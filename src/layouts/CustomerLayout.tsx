import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { OrderProvider } from '../context/OrderContext'
import StoreNavbar from '../components/StoreNavbar'
import { getSession, type Customer } from '../utils/authStorage'
import { getUnreadNotifications, markNotificationRead } from '../utils/storeStorage'
import '../styles/dashboard.css'

const customerNav = [
  { to: '/customer', label: 'Home' },
  { to: '/customer/my-order', label: 'My Order' },
  { to: '/customer/new-order', label: 'New Order' },
  { to: '/customer/items-ordered', label: 'Items Ordered' },
  { to: '/customer/track-order', label: 'Track Order' }
]

function CustomerShell({ customer }: { customer: Customer }) {
  const location = useLocation()
  const isHome = location.pathname === '/customer'
  const [notification, setNotification] = useState<{
    title: string
    message: string
    type: 'delivery' | 'approval' | 'rejection'
    icon: string
  } | null>(null)

  useEffect(() => {
    const checkNotifications = () => {
      const unread = getUnreadNotifications(customer.email)
      if (unread.length > 0) {
        const n = unread[0]
        setNotification({
          title:
            n.type === 'delivery'
              ? 'Delivery Update'
              : n.type === 'approval'
              ? 'Good News!'
              : 'Oops!'
          ,
          message: n.message,
          type: n.type,
          icon: n.type === 'delivery' ? '🚚' : n.type === 'approval' ? '🌸' : '⚠️'
        })
        markNotificationRead(n.id)
      }
    }
    checkNotifications()
    const interval = setInterval(checkNotifications, 4000)
    return () => clearInterval(interval)
  }, [customer.email])

  useEffect(() => {
    if (!notification) return
    const timer = window.setTimeout(() => setNotification(null), 7000)
    return () => window.clearTimeout(timer)
  }, [notification])

  const closeNotification = () => setNotification(null)

  return (
    <OrderProvider>
      <div className="dashboard">
        <StoreNavbar logoTo="/customer" navItems={customerNav} userLabel={customer.name} />

        <div className="dashboard-inner">
          {!isHome && (
            <nav className="customer-icons" aria-label="Quick navigation">
              <NavLink
                to="/customer/my-order"
                className={({ isActive }) =>
                  `customer-icon-btn${isActive ? ' customer-icon-btn--active' : ''}`
                }
              >
                <span className="customer-icon-btn__emoji" aria-hidden="true">📋</span>
                <span className="customer-icon-btn__label">My Order</span>
              </NavLink>
              <NavLink
                to="/customer/new-order"
                className={({ isActive }) =>
                  `customer-icon-btn${isActive ? ' customer-icon-btn--active' : ''}`
                }
              >
                <span className="customer-icon-btn__emoji" aria-hidden="true">🛒</span>
                <span className="customer-icon-btn__label">New Order</span>
              </NavLink>
              <NavLink
                to="/customer/items-ordered"
                className={({ isActive }) =>
                  `customer-icon-btn${isActive ? ' customer-icon-btn--active' : ''}`
                }
              >
                <span className="customer-icon-btn__emoji" aria-hidden="true">📦</span>
                <span className="customer-icon-btn__label">Items Ordered</span>
              </NavLink>
              <NavLink
                to="/customer/track-order"
                className={({ isActive }) =>
                  `customer-icon-btn${isActive ? ' customer-icon-btn--active' : ''}`
                }
              >
                <span className="customer-icon-btn__emoji" aria-hidden="true">🚚</span>
                <span className="customer-icon-btn__label">Track Order</span>
              </NavLink>
            </nav>
          )}

          {notification && (
            <div className={`customer-notification customer-notification--${notification.type}`}>
              <div className="customer-notification__icon" aria-hidden="true">
                {notification.icon}
              </div>
              <div className="customer-notification__content">
                <div className="customer-notification__title">{notification.title}</div>
                <div className="customer-notification__message">{notification.message}</div>
              </div>
              <button
                type="button"
                className="customer-notification__close"
                aria-label="Dismiss notification"
                onClick={closeNotification}
              >
                ×
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </div>
    </OrderProvider>
  )
}

export default function CustomerLayout() {
  const session = getSession()

  if (!session || session.role !== 'customer') {
    return <Navigate to="/customer/login" replace />
  }

  return <CustomerShell customer={session.user as Customer} />
}
