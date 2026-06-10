import { Link } from 'react-router-dom'
import '../../styles/dashboard.css'

const trending = [
  { emoji: '🍅', name: 'Tomato', price: '₹40 / kg', color: 'green' as const },
  { emoji: '🧅', name: 'Onion', price: '₹30 / kg', color: 'orange' as const },
  { emoji: '🥔', name: 'Potato', price: '₹25 / kg', color: 'purple' as const },
  { emoji: '🥕', name: 'Carrot', price: '₹35 / kg', color: 'orange' as const },
  { emoji: '🥦', name: 'Broccoli', price: '₹60 / kg', color: 'green' as const }
]

export default function CustomerHomePage() {
  return (
    <>
      <section className="store-hero">
        <div className="store-hero__bg" aria-hidden="true">🥬🍅🥕</div>
        <div className="store-hero__content">
          <span className="store-hero__badge">⚡ Delivery in 30 mins</span>
          <h1 className="store-hero__title">Fresh picks for your kitchen</h1>
          <p className="store-hero__desc">
            Add items to your cart, submit your order, and track delivery — farm to doorstep.
          </p>
          <div className="store-hero__actions">
            <Link to="/customer/my-order" className="btn-primary">Shop Now</Link>
            <Link to="/customer/track-order" className="btn-secondary">Track Order</Link>
          </div>
        </div>
      </section>

      <section className="store-section">
        <h2 className="store-section__title">Quick Actions</h2>
        <div className="store-section__scroll">
          <Link to="/customer/my-order" className="product-card product-card--green">
            <div className="product-card__image"><span>📋</span></div>
            <div className="product-card__body">
              <div className="product-card__label">My Order</div>
              <div className="product-card__sub">Add items to your list</div>
            </div>
          </Link>
          <Link to="/customer/new-order" className="product-card product-card--blue">
            <div className="product-card__image"><span>🛒</span></div>
            <div className="product-card__body">
              <div className="product-card__label">New Order</div>
              <div className="product-card__sub">Review &amp; submit</div>
            </div>
          </Link>
          <Link to="/customer/track-order" className="product-card product-card--orange">
            <div className="product-card__image"><span>🚚</span></div>
            <div className="product-card__body">
              <div className="product-card__label">Track Order</div>
              <div className="product-card__sub">Live delivery status</div>
            </div>
          </Link>
        </div>
      </section>

      <section className="store-section">
        <h2 className="store-section__title">Popular This Week</h2>
        <div className="store-section__scroll">
          {trending.map((item) => (
            <div key={item.name} className={`product-card product-card--${item.color}`}>
              <div className="product-card__image"><span>{item.emoji}</span></div>
              <div className="product-card__body">
                <div className="product-card__label">{item.name}</div>
                <div className="product-card__price">{item.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
