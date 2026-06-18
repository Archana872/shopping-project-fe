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
  updateProduct
} from '../utils/storeStorage'
import { createItem, getStock, updateStock } from '../services/itemService'
import type { DeliveryAssignment, Product, StoreOrder } from '../types/store'
import '../styles/dashboard.css'
import '../styles/owner-dashboard.css'

type OwnerTab = 'stock' | 'orders' | 'delivery'

export default function OwnerDashboard() {
  const session = getSession()
  const [tab, setTab] = useState<OwnerTab>('stock')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryAssignment[]>([])
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
    refresh()
  }, [refresh])

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
  const approvedOrders = orders.filter((o) => o.status === 'approved')
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
        </div>

        <nav className="owner-tabs" aria-label="Owner sections">
          <button type="button" className={`owner-tab${tab === 'stock' ? ' owner-tab--active' : ''}`} onClick={() => setTab('stock')}>
            🌅 Morning Stock
          </button>
          <button type="button" className={`owner-tab${tab === 'orders' ? ' owner-tab--active' : ''}`} onClick={() => setTab('orders')}>
            📦 Order Requests {pendingOrders.length > 0 && <span className="owner-badge">{pendingOrders.length}</span>}
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
                        <span className={`owner-status owner-status--${order.status}`}>{order.status}</span>
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

                      {order.billLines && (
                        <div className="owner-bill">
                          <h4>
                            Generated Bill — ₹{order.billAmount}
                            {order.items.some((i) => i.rejected) && ' (available items only)'}
                          </h4>
                          <table className="order-table">
                            <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
                            <tbody>
                              {order.billLines.map((line, i) => (
                                <tr key={i}>
                                  <td>{line.itemName}</td>
                                  <td>{line.quantity} {line.measurement}</td>
                                  <td>₹{line.unitPrice}</td>
                                  <td>₹{line.lineTotal}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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

                      {order.status === 'approved' && (
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

        {tab === 'delivery' && (
          <section className="dashboard-panel owner-panel">
            <h2>Delivery Queue</h2>
            <p>Orders approved and reported to delivery partners.</p>

            {deliveries.length === 0 && sentOrders.length === 0 ? (
              <p className="empty-state">No orders sent to delivery yet.</p>
            ) : (
              <div className="owner-order-list">
                {deliveries.map((d) => (
                  <article key={d.id} className="owner-order-card">
                    <header className="owner-order-card__head">
                      <strong>Delivery #{d.id} — Order #{d.orderId}</strong>
                      <span className={`owner-status owner-status--sent_to_delivery`}>{d.status}</span>
                    </header>
                    <div className="owner-order-card__customer">
                      <span>👤 {d.customerName}</span>
                      <span>📍 {d.customerAddress}</span>
                      <span>📞 {d.customerPhone}</span>
                      <span>💰 Bill: ₹{d.billAmount}</span>
                    </div>
                    <table className="order-table owner-order-table">
                      <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
                      <tbody>
                        {d.billLines.map((line, i) => (
                          <tr key={i}>
                            <td>{line.itemName}</td>
                            <td>{line.quantity} {line.measurement}</td>
                            <td>₹{line.lineTotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="row-muted" style={{ marginTop: 12 }}>Assigned: {d.assignedAt}</p>
                  </article>
                ))}
              </div>
            )}
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
