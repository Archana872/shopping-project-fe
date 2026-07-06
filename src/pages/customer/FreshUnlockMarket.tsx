import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '../../context/OrderContext'
import '../../styles/fresh-unlock.css'

interface UnlockProduct {
  id: number
  name: string
  emoji: string
  price: number
  measurement: string
  locked: boolean
  harvestedHoursAgo: number
}

interface Category {
  name: string
  emoji: string
  products: UnlockProduct[]
}

const CATEGORIES_DATA: Category[] = [
  {
    name: 'Vegetables',
    emoji: '🥕',
    products: [
      { id: 1, name: 'Carrot', emoji: '🥕', price: 40, measurement: 'kg', locked: false, harvestedHoursAgo: 2 },
      { id: 2, name: 'Broccoli', emoji: '🥦', price: 60, measurement: 'kg', locked: true, harvestedHoursAgo: 4 },
      { id: 3, name: 'Spinach', emoji: '🌿', price: 35, measurement: 'kg', locked: true, harvestedHoursAgo: 3 },
      { id: 4, name: 'Capsicum', emoji: '🫑', price: 50, measurement: 'kg', locked: true, harvestedHoursAgo: 5 }
    ]
  },
  {
    name: 'Fruits',
    emoji: '🍎',
    products: [
      { id: 5, name: 'Apple', emoji: '🍎', price: 80, measurement: 'kg', locked: false, harvestedHoursAgo: 6 },
      { id: 6, name: 'Banana', emoji: '🍌', price: 50, measurement: 'kg', locked: true, harvestedHoursAgo: 2 },
      { id: 7, name: 'Orange', emoji: '🍊', price: 70, measurement: 'kg', locked: true, harvestedHoursAgo: 4 },
      { id: 8, name: 'Mango', emoji: '🥭', price: 120, measurement: 'kg', locked: true, harvestedHoursAgo: 8 }
    ]
  },
  {
    name: 'Fresh Cut Fruits',
    emoji: '🍉',
    products: [
      { id: 9, name: 'Watermelon', emoji: '🍉', price: 100, measurement: 'pack', locked: false, harvestedHoursAgo: 1 },
      { id: 10, name: 'Papaya', emoji: '🧡', price: 90, measurement: 'pack', locked: true, harvestedHoursAgo: 3 },
      { id: 11, name: 'Pineapple', emoji: '🍍', price: 110, measurement: 'pack', locked: true, harvestedHoursAgo: 2 },
      { id: 12, name: 'Mixed Fruits', emoji: '🍓', price: 150, measurement: 'pack', locked: true, harvestedHoursAgo: 1 }
    ]
  }
]

export default function FreshUnlockMarket() {
  const navigate = useNavigate()
  const { addDraftItem } = useOrders()
  const [categories, setCategories] = useState<Category[]>(CATEGORIES_DATA)
  const [cartCount, setCartCount] = useState(0)
  const [showRewardPopup, setShowRewardPopup] = useState(false)
  const [unlockedProduct, setUnlockedProduct] = useState<UnlockProduct | null>(null)

  const handleAddToCart = (product: UnlockProduct) => {
    addDraftItem({
      itemName: product.name,
      quantity: 1,
      measurement: product.measurement
    })

    const newCount = cartCount + 1

    if (newCount === 2) {
      // Unlock all products
      const updated = categories.map(cat => ({
        ...cat,
        products: cat.products.map(p => ({ ...p, locked: false }))
      }))
      setCategories(updated)
      setShowRewardPopup(true)
    }

    setCartCount(newCount)
  }

  const handleSelectForDollar = (product: UnlockProduct) => {
    setUnlockedProduct(product)
    setShowRewardPopup(true)
  }

  return (
    <div className="fresh-unlock-market">
      <div className="fresh-unlock-market__header">
        <h1 className="fresh-unlock-market__title">🍓 Fresh Unlock Market</h1>
        <p className="fresh-unlock-market__subtitle">
          Discover fresh produce with exclusive unlock rewards
        </p>
      </div>

      {/* Progress Bar */}
      <div className="fresh-unlock-progress-section">
        <div className="progress-label">
          <span>Add 2 products to unlock all items</span>
          <span className="progress-count">{cartCount}/2</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar__fill" 
            style={{ width: `${(cartCount / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="fresh-unlock-categories">
        {categories.map((category) => (
          <section key={category.name} className="fresh-unlock-category">
            <h2 className="category-title">{category.emoji} {category.name}</h2>
            <div className="category-products">
              {category.products.map((product) => (
                <div
                  key={product.id}
                  className={`product-unlock-card ${product.locked ? 'locked' : 'unlocked'}`}
                >
                  {product.locked && (
                    <div className="lock-overlay">
                      <div className="lock-icon">🔒</div>
                      <p className="lock-text">Unlock all items by adding 2 products</p>
                    </div>
                  )}

                  <div className={`product-unlock-card__content ${product.locked ? 'blurred' : ''}`}>
                    <div className="product-emoji">{product.emoji}</div>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-freshness">Harvested {product.harvestedHoursAgo}h ago</p>
                    <div className="product-price">₹{product.price}/{product.measurement}</div>
                  </div>

                  {!product.locked && (
                    <div className="product-actions">
                      <button 
                        className="btn-add-cart"
                        onClick={() => handleAddToCart(product)}
                      >
                        Add to Cart
                      </button>
                      <button 
                        className="btn-dollar-unlock"
                        onClick={() => handleSelectForDollar(product)}
                      >
                        Get for $1
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Reward Popup */}
      {showRewardPopup && (
        <div className="reward-popup-overlay" onClick={() => setShowRewardPopup(false)}>
          <div className="reward-popup" onClick={(e) => e.stopPropagation()}>
            <button 
              className="reward-popup-close" 
              onClick={() => setShowRewardPopup(false)}
            >
              ✕
            </button>

            {cartCount === 2 && unlockedProduct === null && (
              <div className="reward-content">
                <div className="reward-icon">🎉</div>
                <h2 className="reward-title">All Items Unlocked!</h2>
                <p className="reward-desc">
                  Congratulations! Now you can select 1 exclusive product for just $1 + free delivery.
                </p>
              </div>
            )}

            {unlockedProduct && (
              <div className="reward-content">
                <div className="reward-icon">⭐</div>
                <h2 className="reward-title">Exclusive Offer Selected!</h2>
                <p className="reward-selected">
                  {unlockedProduct.emoji} {unlockedProduct.name}
                </p>
                <p className="reward-desc">
                  Get {unlockedProduct.name} for just <strong>$1</strong> + <strong>Free Delivery</strong>
                </p>
                <button 
                  className="btn-checkout"
                  onClick={() => {
                    localStorage.setItem('freshUnlockProduct', JSON.stringify({
                      itemName: unlockedProduct.name,
                      quantity: 1,
                      measurement: unlockedProduct.measurement,
                      price: 1,
                      freeDelivery: true
                    }))
                    navigate('/customer/new-order')
                  }}
                >
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
