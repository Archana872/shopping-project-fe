import { useEffect, useState } from 'react'
import { getCurrentUser } from '../../utils/auth'
import { getOrdersForCustomer } from '../../utils/store'
import { subscribeBroadcast } from '../../utils/broadcast'

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])

  function refresh() {
    const current = getCurrentUser()
    const data = current && current.role === 'customer' ? getOrdersForCustomer((current as any).email) : []
    setOrders(data)
  }

  useEffect(() => {
    refresh()
    const unsub = subscribeBroadcast((e) => {
      if (!e || !e.type) return
      if (e.type.startsWith('orders') || e.type === 'order_status_changed' || e.type === 'products_updated') refresh()
    })
    return () => unsub()
  }, [])

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>My Orders</h2>
      {orders.length === 0 ? (
        <p style={{ color: '#475569' }}>No orders submitted yet. Start a new order from the menu.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 8px' }}>Product</th>
              <th style={{ padding: '12px 8px' }}>Quantity</th>
              <th style={{ padding: '12px 8px' }}>Total</th>
              <th style={{ padding: '12px 8px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 8px' }}>{order.product}</td>
                <td style={{ padding: '12px 8px' }}>{order.quantity}{order.measurement ? ` ${order.measurement}` : ''}</td>
                <td style={{ padding: '12px 8px' }}>{order.price != null ? `₹${order.quantity * order.price}` : 'Pending'}</td>
                <td style={{ padding: '12px 8px' }}>{order.status}{order.price == null && order.status === 'Confirmed' ? ' (price pending)' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
