import '../../styles/ui.css'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

export default function CustomerLayout({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate()
  const nav = [
    { to: '/dashboard', label: 'New Order', icon: '🛒' },
    { to: '/dashboard/orders', label: 'My Orders', icon: '📦' },
    { to: '/dashboard/track', label: 'Track Order', icon: '🚚' }
  ]

  return (
    <div style={{ minHeight: '100vh', padding: 24 }}>
      <div className="centered">
        <header className="dashboard-header">
          <div>
            <h1 style={{ margin: 0 }}>Customer Dashboard</h1>
            <p style={{ margin: '6px 0 0', color: '#475569' }}>
              Place new grocery orders, review requests, bills, and track delivery.
            </p>
          </div>

          <button onClick={() => { onLogout(); navigate('/') }} className="btn" style={{ background: '#ef4444', color: '#fff' }}>
            Logout
          </button>
        </header>

        <nav className="dash-nav">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <div style={{ fontSize: 20 }}>{item.icon}</div>
              <div style={{ fontWeight: 700 }}>{item.label}</div>
            </NavLink>
          ))}
        </nav>

        <section className="panel">
          <Outlet />
        </section>
      </div>
    </div>
  )
}
