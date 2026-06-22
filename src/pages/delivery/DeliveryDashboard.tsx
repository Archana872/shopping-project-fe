import '../../styles/ui.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../utils/auth'
import { getOrdersForDelivery, getAvailableOrders, assignOrderToDelivery, updateOrderStatus } from '../../utils/store'
import { subscribeBroadcast } from '../../utils/broadcast'

const DELIVERY_STATUSES: Array<import('../../utils/store').Order['status']> = ['Confirmed', 'Packing', 'Out for Delivery', 'Delivered']

export default function DeliveryDashboard({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const deliveryId = user && (user as any).id ? (user as any).id : ''

  const [available, setAvailable] = useState(() => getAvailableOrders())
  const [assigned, setAssigned] = useState(() => (deliveryId ? getOrdersForDelivery(deliveryId) : []))

  function refresh() {
    setAvailable(getAvailableOrders())
    setAssigned(deliveryId ? getOrdersForDelivery(deliveryId) : [])
  }

  useEffect(() => {
    refresh()
    const unsub = subscribeBroadcast(() => refresh())
    return () => unsub()
  }, [deliveryId])

  const handleClaim = (id: number) => {
    if (!deliveryId) return alert('Delivery not identified. Please login correctly.')
    const ok = assignOrderToDelivery(id, deliveryId)
    if (!ok) return alert('Failed to claim order.')
    refresh()
  }

  const handleAdvance = (orderId: number) => {
    const orders = getOrdersForDelivery(deliveryId)
    const o = orders.find((x) => x.id === orderId)
    if (!o) return
    const idx = DELIVERY_STATUSES.indexOf(o.status as any)
    if (idx === -1) return
    if (idx < DELIVERY_STATUSES.length - 1) {
      updateOrderStatus(orderId, DELIVERY_STATUSES[idx + 1])
      refresh()
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: 24 }}>
      <div className="centered">
        <header className="dashboard-header">
          <div>
            <h1 style={{ margin: 0 }}>Delivery Dashboard</h1>
            <p style={{ margin: '6px 0 0', color: '#475569' }}>Claim available orders and update delivery status.</p>
          </div>

          <button onClick={() => { onLogout(); navigate('/') }} className="btn" style={{ background: '#ef4444', color: '#fff' }}>
            Logout
          </button>
        </header>

        <section className="panel">
          <h2 style={{ marginTop: 0 }}>Available Orders</h2>
          {available.length === 0 ? (
            <p style={{ color: '#475569' }}>No available orders to claim.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px' }}>ID</th>
                  <th style={{ padding: '8px' }}>Customer</th>
                  <th style={{ padding: '8px' }}>Product</th>
                  <th style={{ padding: '8px' }}>Qty</th>
                  <th style={{ padding: '8px' }}></th>
                </tr>
              </thead>
              <tbody>
                {available.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px' }}>{o.id}</td>
                    <td style={{ padding: '8px' }}>{o.customerEmail}</td>
                    <td style={{ padding: '8px' }}>{o.product}</td>
                    <td style={{ padding: '8px' }}>{o.quantity}{o.measurement ? ` ${o.measurement}` : ''}</td>
                    <td style={{ padding: '8px' }}><button className="btn btn-primary" onClick={() => handleClaim(o.id)}>Claim</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2 style={{ marginTop: 18 }}>My Assigned Orders</h2>
          {assigned.length === 0 ? (
            <p style={{ color: '#475569' }}>No orders assigned to you yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px' }}>ID</th>
                  <th style={{ padding: '8px' }}>Product</th>
                  <th style={{ padding: '8px' }}>Qty</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assigned.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px' }}>{o.id}</td>
                    <td style={{ padding: '8px' }}>{o.product}</td>
                    <td style={{ padding: '8px' }}>{o.quantity}{o.measurement ? ` ${o.measurement}` : ''}</td>
                    <td style={{ padding: '8px' }}>{o.status}</td>
                    <td style={{ padding: '8px' }}>
                      {o.status !== 'Delivered' && (
                        <button className="btn btn-primary" onClick={() => handleAdvance(o.id)}>Advance Status</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}
