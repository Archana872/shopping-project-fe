import { useOrders } from '../../context/OrderContext'
import { ORDER_STATUSES } from '../../types/order'

export default function TrackOrderPage() {
  const { submittedOrders } = useOrders()
  const latestOrder = submittedOrders[submittedOrders.length - 1]

  return (
    <section className="dashboard-panel">
      <h2>Track Order</h2>
      <p>Follow your order from placement to delivery.</p>

      {!latestOrder ? (
        <p className="empty-state">No submitted orders yet. Create and submit an order first.</p>
      ) : (
        <>
          <p className="order-meta">
            Order #{latestOrder.id} — {latestOrder.submittedAt}
          </p>
          <div className="track-steps">
            {ORDER_STATUSES.map((status) => {
              const done =
                ORDER_STATUSES.indexOf(status) <=
                ORDER_STATUSES.indexOf(latestOrder.status as (typeof ORDER_STATUSES)[number])
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
            Current status: <strong>{latestOrder.status}</strong>
          </p>
        </>
      )}
    </section>
  )
}
