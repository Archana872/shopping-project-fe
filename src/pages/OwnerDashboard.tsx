import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import StoreNavbar from '../components/StoreNavbar'
import { getSession, type Owner } from '../utils/authStorage'
import {
  approveOrder,
  checkItemAvailability,
  checkOrderStock,
  deleteProduct,
  getDeliveries,
  getOrders,
  getProducts,
  rejectOrder,
  rejectOrderItem,
  saveProduct,
  sendToDelivery,
  syncProductsFromApi,
  updateDeliveryStatus,
  updateProduct
} from '../utils/storeStorage'
import { createItem, getStock, updateStock } from '../services/itemService'
import { getHarvestsApi, updateTimelineApi, updateHarvestApi, type HarvestRecord } from '../services/harvestService'
import type { DeliveryAssignment, Product, StoreOrder } from '../types/store'
import '../styles/dashboard.css'
import '../styles/owner-dashboard.css'
import '../styles/live-delivery.css'
import LiveDeliveryMap from '../components/LiveDeliveryMap'
import OwnerAnalyticsPanel from '../components/OwnerAnalyticsPanel'

type OwnerTab = 'stock' | 'orders' | 'harvest' | 'delivery'

export default function OwnerDashboard() {
  const session = getSession()
  const [tab, setTab] = useState<OwnerTab>('stock')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryAssignment[]>([])
  const [harvests, setHarvests] = useState<HarvestRecord[]>([])
  const [harvestLoading, setHarvestLoading] = useState(false)
  const [harvestError, setHarvestError] = useState('')
  const [freshnessEdits, setFreshnessEdits] = useState<Record<number, { score: string; status: string }>>({})
  const [toast, setToast] = useState('')

  const [productForm, setProductForm] = useState({ name: '', stock: '', price: '', unit: 'kg' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingOrderId, setRejectingOrderId] = useState<number | null>(null)
  const [loadingStock, setLoadingStock] = useState(false)
  const [apiError, setApiError] = useState('')

  const refresh = useCallback(async () => {
    setLoadingStock(true)
    setApiError('')
    try {
      const stock = await getStock()
      syncProductsFromApi(stock)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to load stock from server.')
    } finally {
      setProducts(getProducts())
      setLoadingStock(false)
    }
    setOrders(getOrders())
    setDeliveries(getDeliveries())
  }, [])

  useEffect(() => {
    if (tab !== 'delivery') return
    const interval = window.setInterval(() => {
      setDeliveries((prev) =>
        prev.map((delivery) => {
          if (delivery.status === 'delivered') return delivery

          const drift = delivery.status === 'assigned' ? 0.0002 : 0.0004
          const nextLat = delivery.currentLat + drift
          const nextLng = delivery.currentLng + drift * 0.9
          const eta = Math.max(0, delivery.etaMinutes - 1)
          const distance = Math.hypot(delivery.destinationLat - nextLat, delivery.destinationLng - nextLng)
          const arrival = distance < 0.00035

          return {
            ...delivery,
            currentLat: nextLat,
            currentLng: nextLng,
            etaMinutes: eta,
            status: arrival
              ? 'near_destination'
              : delivery.status === 'assigned'
              ? 'picked_up'
              : delivery.status === 'picked_up'
              ? 'in_transit'
              : delivery.status,
            arrivalDetected: arrival || delivery.arrivalDetected
          }
        })
      )
    }, 8000)

    return () => window.clearInterval(interval)
  }, [tab])

  const refreshHarvests = useCallback(async () => {
    setHarvestLoading(true)
    setHarvestError('')
    try {
      const records = await getHarvestsApi()
      setHarvests(records)
      setFreshnessEdits(records.reduce((acc, record) => ({
        ...acc,
        [record.harvestId]: {
          score: String(record.freshnessScore),
          status: record.freshnessStatus
        }
      }), {} as Record<number, { score: string; status: string }>))
    } catch (err) {
      setHarvestError('Failed to load harvest records.')
    } finally {
      setHarvestLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    refreshHarvests()
  }, [refresh, refreshHarvests])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])

  if (!session || session.role !== 'owner') {
    return <Navigate to="/owner/login" replace />
  }

  const owner = session.user as Owner
  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const approvedOrders = orders.filter((o) => o.status === 'approved' || o.status === 'partially_approved')
  const sentOrders = orders.filter((o) => o.status === 'sent_to_delivery')

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault()
    const stock = Number(productForm.stock)
    const price = Number(productForm.price)
    if (!productForm.name.trim() || stock < 0 || price <= 0) return

    const itemName = productForm.name.trim()
    const unit = productForm.unit

    if (editingId) {
      // --- EDIT existing product ---
      // 1. Update locally first so the table updates immediately
      updateProduct(editingId, { name: itemName, stock, price, unit })
      setProducts(getProducts())
      setEditingId(null)
      setProductForm({ name: '', stock: '', price: '', unit: 'kg' })

      // 2. Sync to API in background
      try {
        await updateStock({ itemName, availableQuantity: stock })
        setToast('Stock updated.')
      } catch (err) {
        setToast('Saved locally. Server sync failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
      }
      await refresh()
    } else {
      // --- ADD new product ---
      // 1. Save locally immediately so the UI shows it right away
      saveProduct({ name: itemName, stock, price, unit })
      setProducts(getProducts())
      setProductForm({ name: '', stock: '', price: '', unit: 'kg' })
      setToast('Product added.')

      // 2. Try to create on the server
      let serverSynced = false
      try {
        await createItem({ itemName, quantity: stock, measurement: unit })
        serverSynced = true
      } catch {
        // createItem failed — try updateStock as a fallback
        try {
          await updateStock({ itemName, availableQuantity: stock })
          serverSynced = true
        } catch {
          console.warn('Server unreachable — new product saved locally only.')
        }
      }

      // 3. Refresh from server, but only sync if server returned the new product
      //    so we don't accidentally wipe the locally-added item
      try {
        const serverStock = await getStock()
        const serverHasNewItem = serverStock.some(
          (s) => s.itemName.trim().toLowerCase() === itemName.toLowerCase()
        )
        if (serverHasNewItem || !serverSynced) {
          // Safe to overwrite — server reflects our new product, or we never pushed it
          syncProductsFromApi(serverStock)
        }
        // If server synced but doesn't have our item yet (async lag),
        // keep local localStorage as-is (our product is still there)
      } catch {
        // API down — local state is fine as-is
      }

      setProducts(getProducts())
      setOrders(getOrders())
      setDeliveries(getDeliveries())
    }
  }

  const startEdit = (p: Product) => {
    setEditingId(p.id)
    setProductForm({ name: p.name, stock: String(p.stock), price: String(p.price), unit: p.unit })
    setTab('stock')
  }

  const handleApprove = (orderId: number) => {
    const result = approveOrder(orderId)
    if (result.ok === false) {
      setToast(result.message)
      refresh()
      return
    }
    const rejectedCount = result.order.items.filter((i) => i.rejected).length
    setToast(
      rejectedCount > 0
        ? `Order #${orderId} partially approved. Bill: ₹${result.order.billAmount} (${rejectedCount} item(s) removed).`
        : `Order #${orderId} approved. Bill: ₹${result.order.billAmount}`
    )
    refresh()
  }

  const handleRejectItem = (orderId: number, itemIndex: number) => {
    const updated = rejectOrderItem(orderId, itemIndex)
    if (updated) {
      const item = updated.items[itemIndex]
      setToast(`"${item.itemName}" removed from order — customer notified.`)
      refresh()
    }
  }

  const handleReject = () => {
    if (!rejectingOrderId || !rejectReason.trim()) return
    rejectOrder(rejectingOrderId, rejectReason.trim())
    setRejectingOrderId(null)
    setRejectReason('')
    setToast('Order rejected — customer will receive a notification.')
    refresh()
  }

  const handleSendDelivery = (orderId: number) => {
    const assignment = sendToDelivery(orderId)
    if (assignment) {
      setToast(`Order #${orderId} reported to delivery partner.`)
      refresh()
    }
  }

  return (
    <div className="dashboard">
      <StoreNavbar userLabel={`${owner.name} · Owner`} />

      {toast && <div className="owner-toast">{toast}</div>}
      {apiError && <div className="owner-toast owner-toast--error">{apiError}</div>}

      <div className="dashboard-inner">
        <section className="store-hero store-hero--compact owner-hero">
          <div className="store-hero__bg" aria-hidden="true">🏪</div>
          <div className="store-hero__content">
            <span className="store-hero__badge">Good morning, {owner.name}</span>
            <h1 className="store-hero__title store-hero__title--compact">Store Control Panel</h1>
            <p className="store-hero__desc">
              Update morning stock, review customer orders, generate bills, and dispatch to delivery.
            </p>
          </div>
        </section>

        <div className="owner-stats">
          <div className="stat-card">
            <h3>Products in stock</h3>
            <p>{products.length}</p>
          </div>
          <div className="stat-card stat-card--blue">
            <h3>Pending orders</h3>
            <p>{pendingOrders.length}</p>
          </div>
          <div className="stat-card stat-card--orange">
            <h3>Awaiting delivery</h3>
            <p>{approvedOrders.length + sentOrders.length}</p>
          </div>
          <div className="stat-card stat-card--green">
            <h3>Harvest records</h3>
            <p>{harvests.length}</p>
          </div>
        </div>

        <nav className="owner-tabs" aria-label="Owner sections">
          <button type="button" className={`owner-tab${tab === 'stock' ? ' owner-tab--active' : ''}`} onClick={() => setTab('stock')}>
            🌅 Morning Stock
          </button>
          <button type="button" className={`owner-tab${tab === 'orders' ? ' owner-tab--active' : ''}`} onClick={() => setTab('orders')}>
            📦 Order Requests {pendingOrders.length > 0 && <span className="owner-badge">{pendingOrders.length}</span>}
          </button>
          <button type="button" className={`owner-tab${tab === 'harvest' ? ' owner-tab--active' : ''}`} onClick={() => setTab('harvest')}>
            🌾 Harvest Controls {harvests.length > 0 && <span className="owner-badge">{harvests.length}</span>}
          </button>
          <button type="button" className={`owner-tab${tab === 'delivery' ? ' owner-tab--active' : ''}`} onClick={() => setTab('delivery')}>
            🛵 Delivery Queue
          </button>
        </nav>

        {tab === 'stock' && (
          <section className="dashboard-panel owner-panel">
            <h2>Morning Stock Update</h2>
            <p>Set product name, available stock, and price each morning before customers order.</p>

            <form className="owner-product-form" onSubmit={handleSaveProduct}>
              <div className="order-field">
                <label htmlFor="pname">Product Name</label>
                <input id="pname" value={productForm.name} onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Tomato" required />
              </div>
              <div className="order-field">
                <label htmlFor="pstock">Available Stock</label>
                <input id="pstock" type="number" min={0} step="any" value={productForm.stock} onChange={(e) => setProductForm((f) => ({ ...f, stock: e.target.value }))} placeholder="e.g. 50" required />
              </div>
              <div className="order-field">
                <label htmlFor="pprice">Price (₹ per unit)</label>
                <input id="pprice" type="number" min={0.01} step="any" value={productForm.price} onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))} placeholder="e.g. 40" required />
              </div>
              <div className="order-field">
                <label htmlFor="punit">Unit</label>
                <select id="punit" value={productForm.unit} onChange={(e) => setProductForm((f) => ({ ...f, unit: e.target.value }))}>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="liter">liter</option>
                  <option value="pcs">pcs</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">{editingId ? 'Update Product' : 'Add Product'}</button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setProductForm({ name: '', stock: '', price: '', unit: 'kg' }) }}>
                  Cancel
                </button>
              )}
            </form>

            <h3 className="section-heading">Today&apos;s Product List</h3>
            {loadingStock && <p className="row-muted">Loading stock from server…</p>}
            {products.length === 0 ? (
              <p className="empty-state">No products yet. Add your morning stock above.</p>
            ) : (
              <table className="order-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.stock} {p.unit}</td>
                      <td>₹{p.price} / {p.unit}</td>
                      <td className="row-muted">{p.updatedAt}</td>
                      <td>
                        <div className="owner-actions">
                          <button type="button" className="btn-sm btn-sm--edit" onClick={() => startEdit(p)}>Edit</button>
                          <button type="button" className="btn-sm btn-sm--danger" onClick={() => { deleteProduct(p.id); refresh(); setToast('Product removed.') }}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {tab === 'orders' && (
          <section className="dashboard-panel owner-panel">
            <h2>Customer Order Requests</h2>
            <p>Check stock per item, reject unavailable products, then approve the rest to generate the bill.</p>

            {pendingOrders.length === 0 && approvedOrders.length === 0 ? (
              <p className="empty-state">No customer orders right now.</p>
            ) : (
              <div className="owner-order-list">
                {[...pendingOrders, ...approvedOrders].map((order) => {
                  const stockCheck = checkOrderStock(order)
                  const activeItems = order.items.filter((i) => !i.rejected)
                  const canApprove = order.status === 'pending' && activeItems.length > 0 && stockCheck.ok
                  return (
                    <article key={order.id} className="owner-order-card">
                      <header className="owner-order-card__head">
                        <div>
                          <strong>Order #{order.id}</strong>
                          <span className="row-muted"> · {order.submittedAt}</span>
                        </div>
                        <span className={`owner-status owner-status--${order.status}`}>
                          {order.status === 'partially_approved' ? 'Partially Approved' : order.status}
                        </span>
                      </header>

                      <div className="owner-order-card__customer">
                        <span>👤 {order.customerName}</span>
                        <span>📧 {order.customerEmail}</span>
                        <span>📞 {order.customerPhone}</span>
                        <span>📍 {order.customerAddress}</span>
                      </div>

                      <table className="order-table owner-order-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Unit</th>
                            <th>Stock check</th>
                            {order.status === 'pending' && <th>Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => {
                            const availability = item.rejected ? null : checkItemAvailability(item)
                            const product = products.find((p) => p.name.toLowerCase() === item.itemName.toLowerCase())
                            const inStock = availability?.ok ?? false
                            return (
                              <tr key={idx} className={item.rejected ? 'owner-order-item--rejected' : undefined}>
                                <td>{item.itemName}</td>
                                <td>{item.quantity}</td>
                                <td>{item.measurement}</td>
                                <td>
                                  {item.rejected ? (
                                    <span className="stock-tag stock-tag--bad" title={item.rejectionReason}>
                                      Rejected
                                    </span>
                                  ) : !product ? (
                                    <span className="stock-tag stock-tag--bad">Not listed</span>
                                  ) : inStock ? (
                                    <span className="stock-tag stock-tag--ok">{product.stock} {product.unit} avail.</span>
                                  ) : (
                                    <span className="stock-tag stock-tag--bad">Only {product.stock} left</span>
                                  )}
                                </td>
                                {order.status === 'pending' && (
                                  <td>
                                    {!item.rejected && !inStock && (
                                      <button
                                        type="button"
                                        className="btn-sm btn-sm--danger"
                                        onClick={() => handleRejectItem(order.id, idx)}
                                      >
                                        Reject Item
                                      </button>
                                    )}
                                    {item.rejected && (
                                      <span className="row-muted">{item.rejectionReason}</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>

                      {!stockCheck.ok && order.status === 'pending' && activeItems.length > 0 && (
                        <div className="owner-stock-warning">
                          ⚠️ Some items are unavailable. Use <strong>Reject Item</strong> on each unavailable product, then approve the rest.
                        </div>
                      )}

                      {activeItems.length === 0 && order.status === 'pending' && (
                        <div className="owner-stock-warning">
                          ⚠️ All items have been rejected. Reject the entire order or wait for a new request.
                        </div>
                      )}

                      {(order.billLines || order.items.some((i) => i.rejected)) && (
                        <div className="owner-bill">
                          <h4>
                            Updated Total — ₹{order.billAmount ?? 0}
                            {order.items.some((i) => i.rejected) && ' (available items only)'}
                          </h4>

                          {order.items.some((i) => !i.rejected) && (
                            <>
                              <h5>Approved Items</h5>
                              <table className="order-table">
                                <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
                                <tbody>
                                  {order.billLines?.map((line, i) => (
                                    <tr key={i}>
                                      <td>{line.itemName}</td>
                                      <td>{line.quantity} {line.measurement}</td>
                                      <td>₹{line.unitPrice}</td>
                                      <td>₹{line.lineTotal}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </>
                          )}

                          {order.items.some((i) => i.rejected) && (
                            <>
                              <h5>Rejected Items</h5>
                              <table className="order-table owner-order-table">
                                <thead><tr><th>Item</th><th>Qty</th><th>Reason</th></tr></thead>
                                <tbody>
                                  {order.items.filter((i) => i.rejected).map((item, i) => (
                                    <tr key={i} className="owner-order-item--rejected">
                                      <td>{item.itemName}</td>
                                      <td>{item.quantity} {item.measurement}</td>
                                      <td>{item.rejectionReason}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </>
                          )}
                        </div>
                      )}

                      {order.status === 'pending' && (
                        <div className="owner-order-card__actions">
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={!canApprove}
                            onClick={() => handleApprove(order.id)}
                          >
                            {activeItems.length === 0
                              ? 'No items to approve'
                              : stockCheck.ok
                                ? activeItems.length < order.items.length
                                  ? 'Approve Available Items & Generate Bill'
                                  : 'Approve & Generate Bill'
                                : 'Reject unavailable items first'}
                          </button>
                          <button type="button" className="btn-secondary" onClick={() => setRejectingOrderId(order.id)}>
                            Reject Entire Order
                          </button>
                        </div>
                      )}

                      {(order.status === 'approved' || order.status === 'partially_approved') && (
                        <div className="owner-order-card__actions">
                          <button type="button" className="btn-primary" onClick={() => handleSendDelivery(order.id)}>
                            Report to Delivery Boy
                          </button>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'harvest' && (
          <section className="dashboard-panel owner-panel">
            <h2>Harvest Controls</h2>
            <p>Mark harvest stages, update packing and delivery timestamps, and edit freshness scores for tracked crops.</p>

            {harvestLoading && <p className="row-muted">Loading harvest records…</p>}
            {harvestError && <p className="row-muted">{harvestError}</p>}
            {!harvestLoading && harvests.length === 0 && <p className="empty-state">No harvest records available right now.</p>}

            {harvests.length > 0 && (
              <table className="order-table owner-harvest-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Harvested</th>
                    <th>Packed</th>
                    <th>Delivery</th>
                    <th>Freshness</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {harvests.map((harvest) => {
                    const stageAction = harvest.deliveredTimestamp
                      ? null
                      : harvest.shippedTimestamp
                        ? { label: 'Mark Delivered', stage: 'delivered' }
                        : { label: 'Start Transit', stage: 'shipped' }

                    const edit = freshnessEdits[harvest.harvestId] ?? {
                      score: String(harvest.freshnessScore),
                      status: harvest.freshnessStatus
                    }

                    return (
                      <tr key={harvest.harvestId}>
                        <td>{harvest.cropName}</td>
                        <td>{new Date(harvest.harvestTimestamp).toLocaleString()}</td>
                        <td>{harvest.packedTimestamp ? new Date(harvest.packedTimestamp).toLocaleString() : 'Pending'}</td>
                        <td>{harvest.deliveredTimestamp ? 'Delivered' : harvest.shippedTimestamp ? 'In transit' : 'Pending'}</td>
                        <td>
                          <div className="harvest-freshness-grid">
                            <input
                              type="number"
                              className="harvest-input"
                              min={0}
                              max={100}
                              value={edit.score}
                              onChange={(event) => setFreshnessEdits((prev) => ({
                                ...prev,
                                [harvest.harvestId]: { ...edit, score: event.target.value }
                              }))}
                            />
                            <select
                              className="harvest-input"
                              value={edit.status}
                              onChange={(event) => setFreshnessEdits((prev) => ({
                                ...prev,
                                [harvest.harvestId]: { ...edit, status: event.target.value }
                              }))}
                            >
                              <option>Very Fresh</option>
                              <option>Consume Soon</option>
                              <option>Reduced Freshness</option>
                            </select>
                          </div>
                        </td>
                        <td>
                          <div className="owner-actions owner-harvest-actions">
                            <button
                              type="button"
                              className="btn-sm btn-sm--edit"
                              onClick={async () => {
                                await updateTimelineApi(harvest.harvestId, 'harvested', new Date().toISOString())
                                setToast(`Marked ${harvest.cropName} as harvested.`)
                                refreshHarvests()
                              }}
                              disabled={!!harvest.harvestTimestamp}
                            >
                              Mark harvested
                            </button>
                            <button
                              type="button"
                              className="btn-sm btn-sm--edit"
                              onClick={async () => {
                                await updateTimelineApi(harvest.harvestId, 'packed', new Date().toISOString())
                                setToast(`Packing time updated for ${harvest.cropName}.`)
                                refreshHarvests()
                              }}
                              disabled={!harvest.harvestTimestamp || !!harvest.packedTimestamp}
                            >
                              Update packing
                            </button>
                            {stageAction && (
                              <button
                                type="button"
                                className="btn-sm btn-sm--edit"
                                onClick={async () => {
                                  await updateTimelineApi(harvest.harvestId, stageAction.stage, new Date().toISOString())
                                  setToast(`${stageAction.label} saved for ${harvest.cropName}.`)
                                  refreshHarvests()
                                }}
                              >
                                {stageAction.label}
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-sm btn-sm--danger"
                              onClick={async () => {
                                const current = freshnessEdits[harvest.harvestId] ?? { score: String(harvest.freshnessScore), status: harvest.freshnessStatus }
                                const score = Number(current.score)
                                if (Number.isNaN(score) || score < 0 || score > 100) {
                                  setToast('Enter a valid freshness score between 0 and 100.')
                                  return
                                }
                                await updateHarvestApi(harvest.harvestId, {
                                  freshnessScore: score,
                                  freshnessStatus: current.status
                                })
                                setToast(`Freshness values saved for ${harvest.cropName}.`)
                                refreshHarvests()
                              }}
                            >
                              Save freshness
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>
        )}

        {tab === 'delivery' && (
          <section className="dashboard-panel owner-panel">
            <h2>Delivery Queue</h2>
            <p>Orders approved and reported to delivery partners.</p>

            <div className="live-delivery-section">
              <div className="live-delivery-list">
                {deliveries.length === 0 && sentOrders.length === 0 ? (
                  <p className="empty-state">No orders sent to delivery yet.</p>
                ) : (
                  deliveries.map((d) => {
                    const badgeColor =
                      d.status === 'delivered'
                        ? '#15803d'
                        : d.status === 'near_destination'
                        ? '#22c55e'
                        : d.status === 'in_transit'
                        ? '#38bdf8'
                        : d.status === 'picked_up'
                        ? '#fb923c'
                        : '#fbbf24'

                    const nextStatus =
                      d.status === 'assigned'
                        ? 'picked_up'
                        : d.status === 'picked_up'
                        ? 'in_transit'
                        : d.status === 'in_transit'
                        ? 'near_destination'
                        : d.status === 'near_destination'
                        ? 'delivered'
                        : d.status

                    return (
                      <article key={d.id} className="live-delivery-card">
                        <div className="live-delivery-card__head">
                          <div>
                            <h3>🚚 Order #{d.orderId}</h3>
                            <p className="live-delivery-subtitle">Delivery Partner: {d.partnerName}</p>
                          </div>
                          <span className="live-delivery-badge" style={{ backgroundColor: badgeColor }}>
                            {d.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="live-delivery-grid">
                          <div>
                            <p className="live-delivery-label">Customer</p>
                            <p>{d.customerName}</p>
                          </div>
                          <div>
                            <p className="live-delivery-label">Location</p>
                            <p>{d.currentLat.toFixed(3)}, {d.currentLng.toFixed(3)}</p>
                          </div>
                          <div>
                            <p className="live-delivery-label">ETA</p>
                            <p>{d.etaMinutes} min</p>
                          </div>
                          <div>
                            <p className="live-delivery-label">Freshness</p>
                            <p>{d.freshnessScore}% 🌱</p>
                          </div>
                        </div>

                        <div className="live-delivery-status-row">
                          <span>Assigned: {d.assignedAt}</span>
                          <span>OTP: {d.otpCode}</span>
                        </div>

                        <div className="owner-order-card__actions" style={{ marginTop: 18 }}>
                          {d.status !== 'delivered' && (
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => {
                                const updated = updateDeliveryStatus(d.id, nextStatus)
                                if (updated) {
                                  setDeliveries(getDeliveries())
                                }
                              }}
                            >
                              {d.status === 'assigned'
                                ? 'Start Pickup'
                                : d.status === 'picked_up'
                                ? 'Mark On Route'
                                : d.status === 'in_transit'
                                ? 'Mark Near Destination'
                                : 'Mark Delivered'}
                            </button>
                          )}
                        </div>
                      </article>
                    )
                  })
                )}
              </div>

              <div className="live-delivery-sidebar">
                {deliveries[0] && <LiveDeliveryMap delivery={deliveries[0]} />}
                <OwnerAnalyticsPanel orders={orders} products={products} deliveries={deliveries} />
              </div>
            </div>
          </section>
        )}
      </div>

      {rejectingOrderId && (
        <div className="owner-modal-overlay" onClick={() => setRejectingOrderId(null)}>
          <div className="owner-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Order #{rejectingOrderId}</h3>
            <p>This will send a popup notification to the customer.</p>
            <textarea
              className="auth-input"
              rows={3}
              placeholder="Reason (e.g. Tomato out of stock)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="owner-modal__actions">
              <button type="button" className="btn-primary" onClick={handleReject}>Confirm Reject</button>
              <button type="button" className="btn-secondary" onClick={() => { setRejectingOrderId(null); setRejectReason('') }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
