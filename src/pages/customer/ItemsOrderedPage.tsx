import { useEffect, useMemo, useState } from 'react'
import { getSession, type Customer } from '../../utils/authStorage'
import { getOrdersByCustomer } from '../../utils/storeStorage'
import type { StoreOrder, StoreOrderItem } from '../../types/store'
import '../../styles/owner-dashboard.css'

interface OrderedProductRow {
  itemName: string
  totalQuantity: number
  measurement: string
  orderCount: number
  lastOrderedAt: string
}

interface OrderLineRow {
  orderId: number
  submittedAt: string
  orderStatus: StoreOrder['status']
  item: StoreOrderItem
}

function buildProductSummary(orders: StoreOrder[]): OrderedProductRow[] {
  const map = new Map<string, OrderedProductRow>()

  for (const order of orders) {
    for (const item of order.items) {
      if (item.rejected) continue
      const key = `${item.itemName.toLowerCase()}|${item.measurement}`
      const existing = map.get(key)
      if (existing) {
        existing.totalQuantity += item.quantity
        existing.orderCount += 1
        if (order.submittedAt > existing.lastOrderedAt) {
          existing.lastOrderedAt = order.submittedAt
        }
      } else {
        map.set(key, {
          itemName: item.itemName,
          totalQuantity: item.quantity,
          measurement: item.measurement,
          orderCount: 1,
          lastOrderedAt: order.submittedAt
        })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.lastOrderedAt.localeCompare(a.lastOrderedAt))
}

function buildOrderLines(orders: StoreOrder[]): OrderLineRow[] {
  return orders
    .flatMap((order) =>
      order.items.map((item) => ({
        orderId: order.id,
        submittedAt: order.submittedAt,
        orderStatus: order.status,
        item
      }))
    )
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

function itemStatusLabel(item: StoreOrderItem, orderStatus: StoreOrder['status']) {
  if (item.rejected) return 'Removed'
  if (orderStatus === 'rejected') return 'Not fulfilled'
  if (orderStatus === 'approved' || orderStatus === 'sent_to_delivery') return 'Fulfilled'
  return 'Pending'
}

export default function ItemsOrderedPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([])

  useEffect(() => {
    const load = () => {
      const session = getSession()
      if (session?.role === 'customer') {
        setOrders(getOrdersByCustomer((session.user as Customer).email))
      }
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  const productSummary = useMemo(() => buildProductSummary(orders), [orders])
  const orderLines = useMemo(() => buildOrderLines(orders), [orders])

  return (
    <section className="dashboard-panel">
      <h2>Items Ordered</h2>
      <p>Every product you have ever ordered, across all your past and current orders.</p>

      {orders.length === 0 ? (
        <p className="empty-state">No orders yet. Add items in My Order and submit your first order.</p>
      ) : (
        <>
          <div className="owner-grid" style={{ marginBottom: 28 }}>
            <div className="stat-card">
              <h3>Unique Products</h3>
              <p>{productSummary.length}</p>
            </div>
            <div className="stat-card stat-card--blue">
              <h3>Total Orders</h3>
              <p>{orders.length}</p>
            </div>
            <div className="stat-card stat-card--orange">
              <h3>Items Ordered</h3>
              <p>{orderLines.length}</p>
            </div>
          </div>

          <h3 className="section-heading">All Products Ever Ordered</h3>
          {productSummary.length === 0 ? (
            <p className="empty-state">No fulfilled products yet. Items may still be pending or were removed.</p>
          ) : (
            <table className="order-table" style={{ marginBottom: 32 }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Total Qty</th>
                  <th>Unit</th>
                  <th>Times Ordered</th>
                  <th>Last Ordered</th>
                </tr>
              </thead>
              <tbody>
                {productSummary.map((row) => (
                  <tr key={`${row.itemName}-${row.measurement}`}>
                    <td><strong>{row.itemName}</strong></td>
                    <td>{row.totalQuantity}</td>
                    <td>{row.measurement}</td>
                    <td>{row.orderCount}</td>
                    <td className="row-muted">{row.lastOrderedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3 className="section-heading">Full Order History</h3>
          <table className="order-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Order #</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orderLines.map((row, idx) => (
                <tr key={`${row.orderId}-${row.item.itemName}-${idx}`} className={row.item.rejected ? 'owner-order-item--rejected' : undefined}>
                  <td>{row.item.itemName}</td>
                  <td>{row.item.quantity}</td>
                  <td>{row.item.measurement}</td>
                  <td>#{row.orderId}</td>
                  <td className="row-muted">{row.submittedAt}</td>
                  <td>
                    <span className={`stock-tag ${row.item.rejected ? 'stock-tag--bad' : 'stock-tag--ok'}`}>
                      {itemStatusLabel(row.item, row.orderStatus)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
