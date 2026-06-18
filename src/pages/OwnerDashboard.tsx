import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import StoreNavbar from '../components/StoreNavbar'
import { getSession, type Owner } from '../utils/authStorage'
import {
  addNotification,
  getDeliveries,
  getOrders,
  saveDelivery,
  updateOrderStatus,
} from '../utils/ownerStorage'
import { getStock, updateStock } from '../services/itemService'
import { addStock } from '../services/stockService'
import type { DeliveryAssignment, StoreOrder } from '../types/store'
import type { ApiStockItem } from '../services/itemService'
import '../styles/dashboard.css'
import '../styles/owner-dashboard.css'

type OwnerTab = 'stock' | 'orders' | 'delivery'

interface StockRow {
  stockId: number
  name: string
  stock: number
  price: number
  unit: string
}

export default function OwnerDashboard() {
  const session = getSession()
  const [tab, setTab] = useState<OwnerTab>('stock')

  // Stock state — source of truth is SQL via getStock()
  const [stockRows, setStockRows] = useState<StockRow[]>([])
  const [loadingStock, setLoadingStock] = useState(false)
  const [apiError, setApiError] = useState('')

  // Orders & deliveries — from localStorage
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryAssignment[]>([])

  const [toast, setToast] = useState('')
  const [productForm, setProductForm] = useState({ name: '', stock: '', price: '', unit: 'kg' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingOrderId, setRejectingOrderId] = useState<number | null>(null)

  // Track in-flight approve to disable button
  const [approvingId, setApprovingId] = useState<number | null>(null)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3500)
  }, [])

  // Load stock from SQL server
  const loadStock = useCallback(async () => {
    setLoadingStock(true)
    setApiError('')
    try {
      const items: ApiStockItem[] = await getStock()
      setStockRows(
        items.map((s) => ({
          stockId: s.stockId,
          name: s.itemName,
          stock: s.availableQuantity,
          price: s.price,
          unit: s.measurement,
        }))
      )
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to load stock from server.')
    } finally {
      setLoadingStock(false)
    }
  }, [])

  // Load orders & deliveries from localStorage
  const loadOrdersAndDeliveries = useCallback(() => {
    setOrders(getOrders())
    setDeliveries(getDeliveries())
  }, [])

  useEffect(() => {
    loadStock()
    loadOrdersAndDeliveries()
  }, [loadStock, loadOrdersAndDeliveries])

  if (!session || session.role !== 'owner') {
    return <Navigate to="/owner/login" replace />
  }

  const owner = session.user as Owner
  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const approvedOrders = orders.filter((o) => o.status === 'approved')
  const sentOrders = orders.filter((o) => o.status === 'sent_to_delivery')

  // ── Morning Stock form ──────────────────────────────────────────────────────

  const handleSaveProduct = async (e: FormEvent) => {
  e.preventDefault()

  const qty = Number(productForm.stock)
  const price = Number(productForm.price)

  if (!productForm.name.trim() || qty < 0 || price <= 0) {
    return
  }

  try {
    if (editingId) {
      await updateStock({
        itemName: productForm.name.trim(),
        availableQuantity: qty
      })

      showToast('Stock updated successfully')
    } else {
      await addStock({
        itemName: productForm.name.trim(),
        availableQuantity: qty,
        measurement: productForm.unit,
        price: price
      })

      showToast('Stock added successfully')
    }

    setProductForm({
      name: '',
      stock: '',
      price: '',
      unit: 'kg'
    })

    setEditingId(null)

    await loadStock()
  } catch (err) {
    showToast(
      err instanceof Error
        ? err.message
        : 'Failed to save stock'
    )
  }
}

  // ── Approve order ───────────────────────────────────────────────────────────

  const handleApprove = async (orderId: number) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order || order.status !== 'pending') return

    const activeItems = order.items.filter((i) => !i.rejected)
    if (activeItems.length === 0) {
      showToast('No items to approve.')
      return
    }

    // Check every active item has enough stock in our current state
    const issues: string[] = []
    for (const item of activeItems) {
      const row = stockRows.find((r) => r.name.toLowerCase() === item.itemName.toLowerCase())
      if (!row) {
        issues.push(`"${item.itemName}" not found in stock.`)
      } else if (row.stock < item.quantity) {
        issues.push(`"${item.itemName}": need ${item.quantity}, only ${row.stock} available.`)
      }
    }
    if (issues.length > 0) {
      showToast(issues.join(' '))
      return
    }

    setApprovingId(orderId)

    // 1. Compute deducted stock rows immediately
    const deducted = stockRows.map((row) => {
      const ordered = activeItems.find((i) => i.itemName.toLowerCase() === row.name.toLowerCase())
      if (!ordered) return row
      return { ...row, stock: row.stock - ordered.quantity }
    })

    // 2. Update UI immediately
    setStockRows(deducted)

    // 3. Build bill
    const billLines = activeItems.map((item) => {
      const row = stockRows.find((r) => r.name.toLowerCase() === item.itemName.toLowerCase())!
      return {
        itemName: item.itemName,
        quantity: item.quantity,
        measurement: item.measurement,
        unitPrice: row.price,
        lineTotal: row.price * item.quantity,
      }
    })
    const billAmount = billLines.reduce((s, l) => s + l.lineTotal, 0)

    // 4. Persist order as approved in localStorage
    updateOrderStatus(orderId, 'approved', { billLines, billAmount })
    loadOrdersAndDeliveries()

    // 5. Notify customer
    addNotification({
      customerEmail: order.customerEmail,
      orderId: order.id,
      message: `Order #${order.id} approved! Bill total: ₹${billAmount}.`,
      type: 'approval',
    })

    const rejectedCount = order.items.filter((i) => i.rejected).length
    showToast(
      rejectedCount > 0
        ? `Order #${orderId} partially approved. Bill: ₹${billAmount} (${rejectedCount} item(s) removed).`
        : `Order #${orderId} approved. Bill: ₹${billAmount}`
    )

    // 6. Push deducted quantities to SQL server in background
    await Promise.allSettled(
      activeItems.map((item) => {
        const row = deducted.find((r) => r.name.toLowerCase() === item.itemName.toLowerCase())
        if (!row) return Promise.resolve()
        return updateStock({ itemName: row.name, availableQuantity: row.stock })
      })
    )

    setApprovingId(null)
  }

  // ── Reject item ─────────────────────────────────────────────────────────────

  const handleRejectItem = (orderId: number, itemIndex: number) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const item = order.items[itemIndex]
    if (!item || item.rejected) return

    const row = stockRows.find((r) => r.name.toLowerCase() === item.itemName.toLowerCase())
    const reason = row
      ? `"${item.itemName}" unavailable — only ${row.stock} ${row.unit} in stock.`
      : `"${item.itemName}" is not listed in today's stock.`

    const updatedItems = order.items.map((it, idx) =>
      idx === itemIndex ? { ...it, rejected: true, rejectionReason: reason } : it
    )
    updateOrderItems(orderId, updatedItems)
    addNotification({
      customerEmail: order.customerEmail,
      orderId: order.id,
      message: `Item "${item.itemName}" removed from order #${order.id}: ${reason}`,
      type: 'rejection',
    })
    showToast(`"${item.itemName}" removed from order — customer notified.`)
    loadOrdersAndDeliveries()
  }

  // ── Reject entire order ─────────────────────────────────────────────────────

  const handleReject = () => {
    if (!rejectingOrderId || !rejectReason.trim()) return
    const order = orders.find((o) => o.id === rejectingOrderId)
    if (order) {
      updateOrderStatus(rejectingOrderId, 'rejected')
      addNotification({
        customerEmail: order.customerEmail,
        orderId: order.id,
        message: rejectReason.trim(),
        type: 'rejection',
      })
    }
    setRejectingOrderId(null)
    setRejectReason('')
    showToast('Order rejected — customer will receive a notification.')
    loadOrdersAndDeliveries()
  }

  // ── Send to delivery ────────────────────────────────────────────────────────

  const handleSendDelivery = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order || order.status !== 'approved' || !order.billLines || order.billAmount === undefined) return

    updateOrderStatus(orderId, 'sent_to_delivery', { sentToDeliveryAt: new Date().toLocaleString() })

    const assignment: DeliveryAssignment = {
      id: Date.now(),
      orderId: order.id,
      customerName: order.customerName,
      customerAddress: order.customerAddress,
      customerPhone: order.customerPhone,
      billAmount: order.billAmount,
      items: order.items.filter((i) => !i.rejected),
      billLines: order.billLines,
      status: 'assigned',
      assignedAt: new Date().toLocaleString(),
    }
    saveDelivery(assignment)
    showToast(`Order #${orderId} reported to delivery partner.`)
    loadOrdersAndDeliveries()
  }

  // ── Helpers for order item checks ───────────────────────────────────────────

  function itemStockStatus(itemName: string, quantity: number) {
    const row = stockRows.find((r) => r.name.toLowerCase() === itemName.toLowerCase())
    if (!row) return { ok: false, label: 'Not listed', avail: 0 }
    if (row.stock < quantity) return { ok: false, label: `Only ${row.stock} ${row.unit}`, avail: row.stock }
    return { ok: true, label: `${row.stock} ${row.unit} avail.`, avail: row.stock }
  }

  function orderCanApprove(order: StoreOrder) {
    if (order.status !== 'pending') return false
    const active = order.items.filter((i) => !i.rejected)
    if (active.length === 0) return false
    return active.every((item) => itemStockStatus(item.itemName, item.quantity).ok)
  }

  // ────────────────────────────────────────────────────────────────────────────

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
            <p>{stockRows.length}</p>
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

        {/* ── STOCK TAB ── */}
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
              <button type="submit" className="btn-primary">{editingId ? 'Update Product' : 'Add / Update Stock'}</button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setProductForm({ name: '', stock: '', price: '', unit: 'kg' }) }}>
                  Cancel
                </button>
              )}
            </form>

            <h3 className="section-heading">Today's Stock</h3>
            {loadingStock && <p className="row-muted">Loading stock from server…</p>}
            {!loadingStock && stockRows.length === 0 ? (
              <p className="empty-state">No stock yet. Add products above.</p>
            ) : (
              <table className="order-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Available</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stockRows.map((row) => (
                    <tr key={row.stockId}>
                      <td><strong>{row.name}</strong></td>
                      <td>{row.stock} {row.unit}</td>
                      <td>₹{row.price} / {row.unit}</td>
                      <td>
                        <button type="button" className="btn-sm btn-sm--edit" onClick={() => startEdit(row)}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          <section className="dashboard-panel owner-panel">
            <h2>Customer Order Requests</h2>
            <p>Check stock per item, reject unavailable products, then approve to generate the bill.</p>

            {pendingOrders.length === 0 && approvedOrders.length === 0 ? (
              <p className="empty-state">No customer orders right now.</p>
            ) : (
              <div className="owner-order-list">
                {[...pendingOrders, ...approvedOrders].map((order) => {
                  const activeItems = order.items.filter((i) => !i.rejected)
                  const canApprove = orderCanApprove(order)
                  const allStockOk = activeItems.every((item) => itemStockStatus(item.itemName, item.quantity).ok)

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
                            <th>Stock</th>
                            {order.status === 'pending' && <th>Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => {
                            const status = item.rejected ? null : itemStockStatus(item.itemName, item.quantity)
                            return (
                              <tr key={idx} className={item.rejected ? 'owner-order-item--rejected' : undefined}>
                                <td>{item.itemName}</td>
                                <td>{item.quantity}</td>
                                <td>{item.measurement}</td>
                                <td>
                                  {item.rejected ? (
                                    <span className="stock-tag stock-tag--bad">Rejected</span>
                                  ) : status?.ok ? (
                                    <span className="stock-tag stock-tag--ok">{status.label}</span>
                                  ) : (
                                    <span className="stock-tag stock-tag--bad">{status?.label ?? 'Not listed'}</span>
                                  )}
                                </td>
                                {order.status === 'pending' && (
                                  <td>
                                    {!item.rejected && status && !status.ok && (
                                      <button type="button" className="btn-sm btn-sm--danger" onClick={() => handleRejectItem(order.id, idx)}>
                                        Reject Item
                                      </button>
                                    )}
                                    {item.rejected && <span className="row-muted">{item.rejectionReason}</span>}
                                  </td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>

                      {!allStockOk && order.status === 'pending' && activeItems.length > 0 && (
                        <div className="owner-stock-warning">
                          ⚠️ Some items are unavailable. Use <strong>Reject Item</strong> on each unavailable product, then approve the rest.
                        </div>
                      )}

                      {activeItems.length === 0 && order.status === 'pending' && (
                        <div className="owner-stock-warning">
                          ⚠️ All items rejected. Reject the entire order.
                        </div>
                      )}

                      {order.billLines && (
                        <div className="owner-bill">
                          <h4>Generated Bill — ₹{order.billAmount}{order.items.some((i) => i.rejected) && ' (available items only)'}</h4>
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
                            disabled={!canApprove || approvingId === order.id}
                            onClick={() => handleApprove(order.id)}
                          >
                            {approvingId === order.id
                              ? 'Approving…'
                              : activeItems.length === 0
                                ? 'No items to approve'
                                : canApprove
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

        {/* ── DELIVERY TAB ── */}
        {tab === 'delivery' && (
          <section className="dashboard-panel owner-panel">
            <h2>Delivery Queue</h2>
            <p>Orders approved and reported to delivery partners.</p>

            {deliveries.length === 0 ? (
              <p className="empty-state">No orders sent to delivery yet.</p>
            ) : (
              <div className="owner-order-list">
                {deliveries.map((d) => (
                  <article key={d.id} className="owner-order-card">
                    <header className="owner-order-card__head">
                      <strong>Delivery #{d.id} — Order #{d.orderId}</strong>
                      <span className="owner-status owner-status--sent_to_delivery">{d.status}</span>
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
            <p>This will send a notification to the customer.</p>
            <textarea
              className="auth-input"
              rows={3}
              placeholder="Reason (e.g. Out of stock)"
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

// ── helpers that import is not available yet ──────────────────────────────────
function updateOrderItems(orderId: number, items: StoreOrder['items']) {
  const ORDERS_KEY = 'freshmart_orders'
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    const orders: StoreOrder[] = raw ? JSON.parse(raw) : []
    const updated = orders.map((o) => o.id === orderId ? { ...o, items } : o)
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated))
  } catch { /* ignore */ }
}
