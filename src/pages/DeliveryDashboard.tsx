import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import StoreNavbar from '../components/StoreNavbar'
import { getSession, type DeliveryBoy } from '../utils/authStorage'
import { getDeliveries, updateDeliveryStatus } from '../utils/storeStorage'
import type { DeliveryAssignment } from '../types/store'
import '../styles/dashboard.css'
import '../styles/owner-dashboard.css'

function statusClass(status: DeliveryAssignment['status']) {
  return `owner-status owner-status--${status}`
}

export default function DeliveryDashboard() {
  const session = getSession()
  const [deliveries, setDeliveries] = useState<DeliveryAssignment[]>([])
  const [toast, setToast] = useState('')

  const refresh = useCallback(() => {
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

  if (!session || session.role !== 'delivery') {
    return <Navigate to="/delivery/login" replace />
  }

  const deliveryBoy = session.user as DeliveryBoy
  const inProgress = deliveries.filter((d) => d.status === 'assigned' || d.status === 'in_transit')
  const completed = deliveries.filter((d) => d.status === 'delivered')

  const handleAdvance = (delivery: DeliveryAssignment) => {
    const nextStatus =
      delivery.status === 'assigned' ? 'in_transit' : delivery.status === 'in_transit' ? 'delivered' : null
    if (!nextStatus) return

    const updated = updateDeliveryStatus(delivery.id, nextStatus)
    if (updated) {
      setToast(
        nextStatus === 'delivered'
          ? `Order #${delivery.orderId} marked as delivered.`
          : `Order #${delivery.orderId} is now in transit.`
      )
      refresh()
    }
  }

  return (
    <div className="dashboard">
      <StoreNavbar userLabel={`${deliveryBoy.name} · Delivery`} />

      {toast && <div className="owner-toast">{toast}</div>}

      <div className="dashboard-inner">
        <section className="store-hero store-hero--compact">
          <div className="store-hero__bg" aria-hidden="true">🛵</div>
          <div className="store-hero__content">
            <span className="store-hero__badge">On the road</span>
            <h1 className="store-hero__title store-hero__title--compact">Deliveries</h1>
            <p className="store-hero__desc">
              Hello, {deliveryBoy.name}. Pick up orders and deliver to customers below.
            </p>
          </div>
        </section>

        <section className="store-section">
          <h2 className="store-section__title">Today&apos;s Stats</h2>
          <div className="owner-grid">
            <div className="stat-card">
              <h3>Total Assignments</h3>
              <p>{deliveries.length}</p>
            </div>
            <div className="stat-card stat-card--blue">
              <h3>In Progress</h3>
              <p>{inProgress.length}</p>
            </div>
            <div className="stat-card stat-card--orange">
              <h3>Completed</h3>
              <p>{completed.length}</p>
            </div>
          </div>
        </section>

        <section className="dashboard-panel owner-panel">
          <h2>Assigned Orders</h2>
          <p>Customer details, address, phone, and bill amount for each delivery.</p>

          {deliveries.length === 0 ? (
            <p className="empty-state">No orders assigned yet. The store owner will dispatch approved orders here.</p>
          ) : (
            <div className="owner-order-list">
              {deliveries.map((d) => (
                <article key={d.id} className="owner-order-card">
                  <header className="owner-order-card__head">
                    <strong>Delivery #{d.id} — Order #{d.orderId}</strong>
                    <span className={statusClass(d.status)}>{d.status.replace('_', ' ')}</span>
                  </header>

                  <div className="owner-order-card__customer">
                    <span>👤 {d.customerName}</span>
                    <span>📍 {d.customerAddress}</span>
                    <span>📞 {d.customerPhone}</span>
                    <span>💰 Bill: ₹{d.billAmount}</span>
                  </div>

                  <div className="owner-bill">
                    <h4>Order items</h4>
                    <table className="order-table owner-order-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.billLines.map((line, i) => (
                          <tr key={i}>
                            <td>{line.itemName}</td>
                            <td>
                              {line.quantity} {line.measurement}
                            </td>
                            <td>₹{line.lineTotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="row-muted" style={{ margin: 0, fontWeight: 600 }}>
                      Total bill: ₹{d.billAmount}
                    </p>
                  </div>

                  <p className="row-muted" style={{ marginTop: 12 }}>
                    Assigned: {d.assignedAt}
                  </p>

                  {d.status !== 'delivered' && (
                    <div className="owner-order-card__actions">
                      <button type="button" className="btn-primary" onClick={() => handleAdvance(d)}>
                        {d.status === 'assigned' ? 'Start delivery' : 'Mark delivered'}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
