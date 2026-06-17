import { useEffect, useMemo, useState } from 'react'
import { getItems, isValidApiOrderItem, type ApiOrderItem } from '../../services/itemService'
import '../../styles/owner-dashboard.css'

interface OrderedProductRow {
  itemName: string
  totalQuantity: number
  measurement: string
  orderCount: number
  totalSpent: number
}

function buildProductSummary(items: ApiOrderItem[]): OrderedProductRow[] {
  const map = new Map<string, OrderedProductRow>()

  for (const item of items) {
    const key = `${item.itemName.toLowerCase()}|${item.measurement.toLowerCase()}`
    const lineTotal = item.price * item.quantity
    const existing = map.get(key)
    if (existing) {
      existing.totalQuantity += item.quantity
      existing.orderCount += 1
      existing.totalSpent += lineTotal
    } else {
      map.set(key, {
        itemName: item.itemName,
        totalQuantity: item.quantity,
        measurement: item.measurement,
        orderCount: 1,
        totalSpent: lineTotal
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => a.itemName.localeCompare(b.itemName))
}

export default function ItemsOrderedPage() {
  const [items, setItems] = useState<ApiOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getItems()
        setItems(data.filter(isValidApiOrderItem))
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ordered items.')
      } finally {
        setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  const productSummary = useMemo(() => buildProductSummary(items), [items])

  return (
    <section className="dashboard-panel">
      <h2>Items Ordered</h2>
      <p>All products ever ordered, loaded from the server.</p>

      {loading && <p className="row-muted">Loading ordered items…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && items.length === 0 ? (
        <p className="empty-state">No ordered items yet. Add items in My Order and submit your first order.</p>
      ) : (
        !error && (
          <>
            <div className="owner-grid" style={{ marginBottom: 28 }}>
              <div className="stat-card">
                <h3>Unique Products</h3>
                <p>{productSummary.length}</p>
              </div>
              <div className="stat-card stat-card--blue">
                <h3>Order Lines</h3>
                <p>{items.length}</p>
              </div>
              <div className="stat-card stat-card--orange">
                <h3>Total Items Qty</h3>
                <p>{items.reduce((sum, item) => sum + item.quantity, 0)}</p>
              </div>
            </div>

            <h3 className="section-heading">All Products Ever Ordered</h3>
            {productSummary.length === 0 ? (
              <p className="empty-state">No products found in order history.</p>
            ) : (
              <table className="order-table" style={{ marginBottom: 32 }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Total Qty</th>
                    <th>Unit</th>
                    <th>Times Ordered</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {productSummary.map((row) => (
                    <tr key={`${row.itemName}-${row.measurement}`}>
                      <td><strong>{row.itemName}</strong></td>
                      <td>{row.totalQuantity}</td>
                      <td>{row.measurement}</td>
                      <td>{row.orderCount}</td>
                      <td>₹{row.totalSpent.toFixed(2)}</td>
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
                  <th>Price</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={`${item.itemName}-${item.measurement}-${idx}`}>
                    <td>{item.itemName}</td>
                    <td>{item.quantity}</td>
                    <td>{item.measurement}</td>
                    <td>₹{item.price}</td>
                    <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )
      )}
    </section>
  )
}
