import { useEffect, useState } from 'react'
import { getSession, type Customer } from '../../utils/authStorage'
import { getOrdersByCustomer } from '../../utils/storeStorage'
import { getOrdersByCustomerApi, type ApiOrder } from '../../services/itemService'
import type { StoreOrder } from '../../types/store'

const TRACK_STEPS = ['Order Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered'] as const

function statusToStep(status: StoreOrder['status'] | string): string {
  if (status === 'pending') return 'Order Placed'
  if (status === 'rejected') return 'Order Placed'
  if (status === 'approved' || status === 'Confirmed') return 'Confirmed'
  if (status === 'sent_to_delivery' || status === 'Out for Delivery') return 'Out for Delivery'
  if (status === 'Delivered' || status === 'delivered') return 'Delivered'
  return 'Order Placed'
}

type DisplayOrder = {
  id: number
  status: string
  submittedAt: string
  billAmount?: number
  rejectionReason?: string
}

function toDisplayOrder(o: StoreOrder | ApiOrder): DisplayOrder {
  return {
    id: o.id,
    status: o.status,
    submittedAt: o.submittedAt,
    billAmount: (o as StoreOrder).billAmount ?? (o as ApiOrder).billAmount,
    rejectionReason: (o as StoreOrder).rejectionReason ?? (o as ApiOrder).rejectionReason
  }
}

export default function TrackOrderPage() {
  const [orders, setOrders] = useState<DisplayOrder[]>([])
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    const loadOrders = async () => {
      const session = getSession()
      if (!session || session.role !== 'customer') return

      const customer = session.user as Customer

      try {
        // Try API first
        const apiOrders = await getOrdersByCustomerApi(customer.email)
        if (Array.isArray(apiOrders) && apiOrders.length > 0) {
          setOrders(apiOrders.map(toDisplayOrder))
          setApiError('')
          return
        }
      } catch {
        // Fall back to localStorage silently
      }

      // localStorage fallback
      const localOrders = getOrdersByCustomer(customer.email)
      setOrders(localOrders.map(toDisplayOrder))
    }

    loadOrders()
    const interval = setInterval(loadOrders, 3000)
    return () => clearInterval(interval)
  }, [])

  const latestOrder = orders[orders.length - 1]

  return (
    <section className="dashboard-panel">
      <h2>Track Order</h2>
      <p>Follow your order from placement to delivery.</p>

      {apiError && <p className="form-error">{apiError}</p>}

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
