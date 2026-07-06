import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/fresh-unlock.css'

interface FreshUnlockPopupProps {
  onClose: () => void
}

export default function FreshUnlockPopup({ onClose }: FreshUnlockPopupProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const delay = Math.random() * 2000 + 3000 // 3-5 seconds
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // wait for fade animation
  }

  return (
    <>
      {isVisible && (
        <div className="fresh-unlock-overlay" onClick={handleClose}>
          <div className="fresh-unlock-popup" onClick={(e) => e.stopPropagation()}>
            <button className="fresh-unlock-close" onClick={handleClose}>✕</button>
            
            <div className="fresh-unlock-content">
              <div className="fresh-unlock-icon">🍓</div>
              
              <h2 className="fresh-unlock-title">Fresh Groceries at Just $1</h2>
              
              <p className="fresh-unlock-desc">
                Buy any 2 products to unlock 1 exclusive product for only <strong>$1 + free delivery</strong>.
              </p>
              
              <div className="fresh-unlock-highlight">
                <span className="highlight-badge">Limited Time Offer</span>
              </div>
            </div>

            <Link 
              to="/customer/fresh-unlock-market" 
              className="fresh-unlock-btn"
              onClick={handleClose}
            >
              Explore Now →
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
