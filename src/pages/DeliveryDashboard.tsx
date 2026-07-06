import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import StoreNavbar from '../components/StoreNavbar'
import LiveDeliveryMap from '../components/LiveDeliveryMap'
import { getSession, type DeliveryBoy } from '../utils/authStorage'
import { getDeliveries, updateDeliveryStatus } from '../utils/storeStorage'
import type { DeliveryAssignment } from '../types/store'
import '../styles/dashboard.css'
import '../styles/owner-dashboard.css'
import '../styles/live-delivery.css'

function statusClass(status: DeliveryAssignment['status']) {
  return `owner-status owner-status--${status}`
}

interface DeliveryAssist {
  weatherType: 'clear' | 'rain' | 'storm' | 'heat'
  weatherLabel: string
  recommendation: string
  trafficLevel: 'light' | 'moderate' | 'heavy'
  routeSuggestion: string
  alertMessage: string
  adjustedEta: number
}

function buildDeliveryAssist(delivery: DeliveryAssignment): DeliveryAssist {
  const seed = Math.round(Math.abs(delivery.currentLat + delivery.currentLng + delivery.orderId)) % 100
  const weatherType = seed < 30 ? 'rain' : seed < 45 ? 'storm' : seed < 70 ? 'heat' : 'clear'
  const trafficLevel = delivery.etaMinutes >= 22 ? 'heavy' : delivery.etaMinutes >= 14 ? 'moderate' : 'light'
  const weatherLabel =
    weatherType === 'rain'
      ? 'Rain expected'
      : weatherType === 'storm'
      ? 'Storm alert'
      : weatherType === 'heat'
      ? 'Heat advisory'
      : 'Clear skies'
  const recommendation =
    weatherType === 'rain'
      ? 'Rain expected — drive carefully.'
      : weatherType === 'storm'
      ? 'Storm ahead — reduce speed and stay alert.'
      : weatherType === 'heat'
      ? 'High heat — keep the delivery fresh and stay hydrated.'
      : 'Roads are clear, maintain a steady pace.'
  const routeSuggestion =
    trafficLevel === 'heavy'
      ? 'Auto-suggested safer route: use the express ring road.'
      : weatherType === 'rain'
      ? 'Follow the inner city route to avoid slick highways.'
      : 'Stick to the fastest clear route.'
  const alertMessage =
    trafficLevel === 'heavy'
      ? 'High traffic ahead'
      : weatherType === 'rain'
      ? 'Rain detected'
      : weatherType === 'storm'
      ? 'Storm conditions update'
      : ''
  const weatherDelay = weatherType === 'rain' ? 4 : weatherType === 'storm' ? 7 : weatherType === 'heat' ? 2 : 0
  const trafficDelay = trafficLevel === 'heavy' ? 6 : trafficLevel === 'moderate' ? 3 : 0

  return {
    weatherType,
    weatherLabel,
    recommendation,
    trafficLevel,
    routeSuggestion,
    alertMessage,
    adjustedEta: Math.max(1, delivery.etaMinutes + weatherDelay + trafficDelay)
  }
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
  const activeDelivery = inProgress[0]
  const deliveryAssist = activeDelivery ? buildDeliveryAssist(activeDelivery) : null

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

        {activeDelivery && (
          <section className="dashboard-panel owner-panel">
            <h2>Live GPS Assist</h2>
            <p>Weather and traffic guidance for your current delivery route.</p>

            <div className="delivery-assist-grid">
              <article className={`analytics-card analytics-card--compact weather-card weather-card--${deliveryAssist?.weatherType}`}>
                <p className="analytics-card__label">Weather alert</p>
                <h3>{deliveryAssist?.weatherLabel}</h3>
                <p>{deliveryAssist?.recommendation}</p>
              </article>
              <article className="analytics-card analytics-card--compact traffic-card">
                <p className="analytics-card__label">Traffic assist</p>
                <h3>{deliveryAssist?.trafficLevel === 'heavy' ? 'Heavy traffic' : deliveryAssist?.trafficLevel === 'moderate' ? 'Moderate traffic' : 'Clear roads'}</h3>
                <p>{deliveryAssist?.routeSuggestion}</p>
              </article>
              <article className="analytics-card analytics-card--compact eta-card">
                <p className="analytics-card__label">ETA update</p>
                <h3>{deliveryAssist?.adjustedEta} mins</h3>
                <p>{deliveryAssist?.alertMessage || 'Delivery conditions are stable.'}</p>
              </article>
            </div>

            <LiveDeliveryMap delivery={activeDelivery} assist={deliveryAssist} />
          </section>
        )}

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
