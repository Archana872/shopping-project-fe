import { Navigate } from 'react-router-dom'
import StoreNavbar from '../components/StoreNavbar'
import { getSession, type DeliveryBoy } from '../utils/authStorage'
import '../styles/dashboard.css'

export default function DeliveryDashboard() {
  const session = getSession()

  if (!session || session.role !== 'delivery') {
    return <Navigate to="/delivery/login" replace />
  }

  const deliveryBoy = session.user as DeliveryBoy

  return (
    <div className="dashboard">
      <StoreNavbar userLabel={`${deliveryBoy.name} · Delivery`} />

      <div className="dashboard-inner">
        <section className="store-hero store-hero--compact">
          <div className="store-hero__bg" aria-hidden="true">🛵</div>
          <div className="store-hero__content">
            <span className="store-hero__badge">On the road</span>
            <h1 className="store-hero__title store-hero__title--compact">Deliveries</h1>
            <p className="store-hero__desc">Hello, {deliveryBoy.name}. Your routes are ready for today.</p>
          </div>
        </section>

        <section className="store-section">
          <h2 className="store-section__title">Today&apos;s Stats</h2>
          <div className="owner-grid">
            <div className="stat-card">
              <h3>Today&apos;s Deliveries</h3>
              <p>3</p>
            </div>
            <div className="stat-card stat-card--blue">
              <h3>In Progress</h3>
              <p>1</p>
            </div>
            <div className="stat-card stat-card--orange">
              <h3>Completed</h3>
              <p>2</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
