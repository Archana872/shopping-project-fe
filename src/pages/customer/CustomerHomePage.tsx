import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStock, type ApiStockItem } from '../../services/itemService'
import '../../styles/dashboard.css'

const FALLBACK_PRODUCTS = [
  { emoji: '🍅', name: 'Tomato', price: '₹40 / kg' },
  { emoji: '🧅', name: 'Onion', price: '₹30 / kg' },
  { emoji: '🥔', name: 'Potato', price: '₹25 / kg' },
  { emoji: '🥕', name: 'Carrot', price: '₹35 / kg' },
  { emoji: '🥦', name: 'Broccoli', price: '₹60 / kg' }
]

const ITEM_EMOJIS: Record<string, string> = {
  tomato: '🍅',
  onion: '🧅',
  potato: '🥔',
  carrot: '🥕',
  broccoli: '🥦',
  cabbage: '🥬',
  spinach: '🌿',
  cucumber: '🥒',
  pepper: '🫑',
  garlic: '🧄',
  lemon: '🍋',
  apple: '🍎',
  banana: '🍌',
  mango: '🥭',
  rice: '🍚',
  milk: '🥛',
  egg: '🥚',
  eggs: '🥚'
}

function getEmoji(name: string) {
  return ITEM_EMOJIS[name.toLowerCase().trim()] ?? '🛒'
}

const CARD_COLORS = ['green', 'orange', 'purple', 'blue', 'green'] as const

export default function CustomerHomePage() {
  const [stockItems, setStockItems] = useState<ApiStockItem[]>([])
  const [stockLoaded, setStockLoaded] = useState(false)

  useEffect(() => {
    getStock()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setStockItems(items)
        }
        setStockLoaded(true)
      })
      .catch(() => {
        setStockLoaded(true) // silently fall back to hardcoded list
      })
  }, [])

  const displayProducts = stockLoaded && stockItems.length > 0
    ? stockItems.slice(0, 5).map((item, i) => ({
        emoji: getEmoji(item.itemName),
        name: item.itemName,
        price: `₹${item.price} / ${item.measurement}`,
        color: CARD_COLORS[i % CARD_COLORS.length]
      }))
    : FALLBACK_PRODUCTS.map((p, i) => ({ ...p, color: CARD_COLORS[i % CARD_COLORS.length] }))

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
          <Link to="/customer/items-ordered" className="product-card product-card--purple">
            <div className="product-card__image"><span>📦</span></div>
            <div className="product-card__body">
              <div className="product-card__label">Items Ordered</div>
              <div className="product-card__sub">All products ever ordered</div>
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
        <h2 className="store-section__title">
          {stockLoaded && stockItems.length > 0 ? "Today's Stock" : 'Popular This Week'}
        </h2>
        <div className="store-section__scroll">
          {displayProducts.map((item) => (
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
