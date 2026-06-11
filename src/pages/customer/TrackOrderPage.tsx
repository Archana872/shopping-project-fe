import { useEffect, useState } from 'react'
import { getSession, type Customer } from '../../utils/authStorage'
import { getOrdersByCustomer } from '../../utils/storeStorage'
import type { StoreOrder } from '../../types/store'

const TRACK_STEPS = ['Order Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered'] as const

function statusToStep(status: StoreOrder['status']): string {
  if (status === 'pending') return 'Order Placed'
  if (status === 'rejected') return 'Order Placed'
  if (status === 'approved') return 'Confirmed'
  if (status === 'sent_to_delivery') return 'Out for Delivery'
  return 'Order Placed'
}

export default function TrackOrderPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([])

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'customer') {
      setOrders(getOrdersByCustomer((session.user as Customer).email))
    }
    const interval = setInterval(() => {
      const s = getSession()
      if (s?.role === 'customer') {
        setOrders(getOrdersByCustomer((s.user as Customer).email))
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const latestOrder = orders[orders.length - 1]

  return (
    <section className="dashboard-panel">
      <h2>Track Order</h2>
      <p>Follow your order from placement to delivery.</p>

      {!latestOrder ? (
        <p className="empty-state">No submitted orders yet. Create and submit an order first.</p>
      ) : latestOrder.status === 'rejected' ? (
        <>
          <p className="order-meta">Order #{latestOrder.id} — {latestOrder.submittedAt}</p>
          <div className="owner-stock-warning" style={{ marginTop: 16 }}>
            ❌ Order rejected: {latestOrder.rejectionReason}
          </div>
        </>
      ) : (
        <>
          <p className="order-meta">
            Order #{latestOrder.id} — {latestOrder.submittedAt}
            {latestOrder.billAmount !== undefined && ` · Bill: ₹${latestOrder.billAmount}`}
          </p>
          <div className="track-steps">
            {TRACK_STEPS.map((status) => {
              const current = statusToStep(latestOrder.status)
              const done = TRACK_STEPS.indexOf(status) <= TRACK_STEPS.indexOf(current as (typeof TRACK_STEPS)[number])
              return (
                <div
                  key={status}
                  className={`track-step${done ? ' track-step--done' : ' track-step--pending'}`}
                >
                  {status}
                </div>
              )
            })}
          </div>
          <p className="status-note">
            Current status: <strong>{latestOrder.status.replace(/_/g, ' ')}</strong>
          </p>
        </>
      )}
    </section>
  )
}
