import { NavLink, useNavigate } from 'react-router-dom'
import { clearSession } from '../utils/authStorage'
import StoreLogo from './StoreLogo'

interface NavItem {
  to: string
  label: string
}

interface StoreNavbarProps {
  logoTo?: string
  navItems?: NavItem[]
  userLabel?: string
}

export default function StoreNavbar({ logoTo = '/', navItems = [], userLabel }: StoreNavbarProps) {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearSession()
    navigate('/')
  }

  return (
    <header className="store-header">
      <div className="store-header__left">
        <StoreLogo to={logoTo} size="sm" />
        {navItems.length > 0 && (
          <nav className="store-header__nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `store-header__link${isActive ? ' store-header__link--active' : ''}`
                }
                end={item.to === '/customer'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
      <div className="store-header__right">
        {userLabel && <span className="store-header__user">{userLabel}</span>}
        <button type="button" className="dashboard-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
