import React, { useEffect } from 'react'

interface PromoPopupProps {
  onClose: () => void
  onShop?: () => void
  autoDismissMs?: number
}

export default function PromoPopup({ onClose, onShop, autoDismissMs = 6000 }: PromoPopupProps) {
  useEffect(() => {
    if (!autoDismissMs) return
    const t = setTimeout(() => {
      onClose()
    }, autoDismissMs)
    return () => clearTimeout(t)
  }, [autoDismissMs, onClose])

  return (
    <div className="promo-overlay" role="dialog" aria-modal="true">
      <div className="promo-modal">
        <div className="promo-veggies" aria-hidden>
          <svg className="veggie carrot" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M50 14c0 0-8 8-18 18S14 50 14 50s-6 2-6-2 6-10 14-18 20-18 20-18 4-2 8-2 0 0 0 0z" fill="#ff8a00" />
            <path d="M36 8c2 2 6 4 8 6 0 0 2-4 0-6s-8 0-8 0z" fill="#34d399" />
          </svg>

          <svg className="veggie lettuce" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M32 6c10 0 18 8 18 18s-8 18-18 18S14 34 14 24 22 6 32 6z" fill="#86efac" />
            <path d="M20 24c4-6 12-10 20-8-4 6-12 10-20 8z" fill="#34d399" opacity="0.9" />
          </svg>

          <svg className="veggie broccoli" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <circle cx="22" cy="26" r="8" fill="#34d399" />
            <circle cx="34" cy="20" r="6" fill="#10b981" />
            <circle cx="46" cy="26" r="8" fill="#34d399" />
            <rect x="28" y="34" width="8" height="18" rx="3" fill="#6ee7b7" />
          </svg>
        </div>
        <h2 style={{ margin: '10px 0 6px' }}>Fresh groceries at just $1</h2>
        <p style={{ margin: '0 0 16px', color: '#334155' }}>
          Cute veggies, super prices — grab them before they're gone!
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button
            onClick={() => {
              if (onShop) onShop()
              else onClose()
            }}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: 'none',
              background: '#10b981',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Shop Now
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: 'transparent',
              color: '#0f172a',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
