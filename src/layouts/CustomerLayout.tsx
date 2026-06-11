import { useEffect } from 'react'
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
  { to: '/customer/track-order', label: 'Track Order' }
]

function CustomerShell({ customer }: { customer: Customer }) {
  const location = useLocation()
  const isHome = location.pathname === '/customer'

  useEffect(() => {
    const checkNotifications = () => {
      getUnreadNotifications(customer.email)
        .filter((n) => n.type === 'rejection')
        .forEach((n) => {
          window.alert(`⚠️ Order Unavailable\n\n${n.message}`)
          markNotificationRead(n.id)
        })
    }
    checkNotifications()
    const interval = setInterval(checkNotifications, 4000)
    return () => clearInterval(interval)
  }, [customer.email])

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
