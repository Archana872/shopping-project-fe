import { Navigate } from 'react-router-dom'
import StoreNavbar from '../components/StoreNavbar'
import { getSession, type Owner } from '../utils/authStorage'
import '../styles/dashboard.css'

export default function OwnerDashboard() {
  const session = getSession()

  if (!session || session.role !== 'owner') {
    return <Navigate to="/owner/login" replace />
  }

  const owner = session.user as Owner

  return (
    <div className="dashboard">
      <StoreNavbar userLabel={`${owner.name} · Owner`} />

      <div className="dashboard-inner">
        <section className="store-hero store-hero--compact">
          <div className="store-hero__bg" aria-hidden="true">🏪</div>
          <div className="store-hero__content">
            <span className="store-hero__badge">Store Admin</span>
            <h1 className="store-hero__title store-hero__title--compact">Dashboard</h1>
            <p className="store-hero__desc">Welcome back, {owner.name}. Here&apos;s your store at a glance.</p>
          </div>
        </section>

        <section className="store-section">
          <h2 className="store-section__title">Overview</h2>
          <div className="owner-grid">
            <div className="stat-card">
              <h3>Products</h3>
              <p>12</p>
            </div>
            <div className="stat-card stat-card--blue">
              <h3>Pending Orders</h3>
              <p>5</p>
            </div>
            <div className="stat-card stat-card--orange">
              <h3>Customers</h3>
              <p>28</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
