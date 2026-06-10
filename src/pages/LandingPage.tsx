import { useNavigate } from 'react-router-dom'
import StoreLogo from '../components/StoreLogo'
import '../styles/auth.css'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">
      <div className="landing-topbar">
        <StoreLogo />
      </div>

      <section className="landing-hero">
        <div className="landing-hero__emoji" aria-hidden="true">🥬</div>
        <h1 className="landing-title">Fresh groceries, delivered fast</h1>
        <p className="landing-tagline">
          Shop local produce, track orders in real time, and manage your store — all in one place.
        </p>
      </section>

      <div className="landing-body">
        <p className="landing-section-title">Choose how you want to continue</p>
        <div className="landing-cards">
          <button
            type="button"
            className="landing-card landing-card--customer"
            onClick={() => navigate('/customer/login')}
          >
            <div className="landing-card-avatar" aria-hidden="true">👤</div>
            <h2 className="landing-card-title">Customer</h2>
            <p className="landing-card-desc">Browse, order fresh groceries, and track your delivery.</p>
            <span className="landing-card__cta">Start shopping →</span>
          </button>

          <button
            type="button"
            className="landing-card landing-card--owner"
            onClick={() => navigate('/owner/login')}
          >
            <div className="landing-card-avatar" aria-hidden="true">🏪</div>
            <h2 className="landing-card-title">Store Owner</h2>
            <p className="landing-card-desc">Manage products, stock, orders, and billing.</p>
            <span className="landing-card__cta">Manage store →</span>
          </button>

          <button
            type="button"
            className="landing-card landing-card--delivery"
            onClick={() => navigate('/delivery/login')}
          >
            <div className="landing-card-avatar" aria-hidden="true">🛵</div>
            <h2 className="landing-card-title">Delivery Partner</h2>
            <p className="landing-card-desc">View assigned routes and update delivery status.</p>
            <span className="landing-card__cta">Go deliver →</span>
          </button>
        </div>
      </div>
    </div>
  )
}
