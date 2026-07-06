import { Link } from 'react-router-dom'
import '../styles/fresh-unlock.css'

export default function FreshUnlockMiniBanner() {
  return (
    <Link to="/customer/fresh-unlock-market" className="fresh-unlock-mini-banner">
      <div className="mini-banner-content">
        <div className="mini-banner-icon">🍓</div>
        <div className="mini-banner-text">
          <h3 className="mini-banner-title">Fresh Unlock Market</h3>
          <p className="mini-banner-subtitle">Buy 2 → Get 1 for $1</p>
        </div>
      </div>
      <div className="mini-banner-arrow">→</div>
    </Link>
  )
}
