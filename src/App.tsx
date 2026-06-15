<<<<<<< Updated upstream
import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/Login'
import RegisterPage from './pages/register'
import OwnerLogin from './pages/OwnerLogin'
import OwnerRegister from './pages/OwnerRegister'
import DeliveryLogin from './pages/DeliveryLogin'
import DeliveryRegister from './pages/DeliveryRegister'
import CustomerLayout from './layouts/CustomerLayout'
import CustomerHomePage from './pages/customer/CustomerHomePage'
import MyOrderPage from './pages/customer/MyOrderPage'
import NewOrderPage from './pages/customer/NewOrderPage'
import TrackOrderPage from './pages/customer/TrackOrderPage'
import OwnerDashboard from './pages/OwnerDashboard'
import DeliveryDashboard from './pages/DeliveryDashboard'
import { getSession } from './utils/authStorage'

function RootRedirect() {
  const session = getSession()
  if (!session) return <LandingPage />
  if (session.role === 'customer') return <Navigate to="/customer" replace />
  if (session.role === 'owner') return <Navigate to="/owner" replace />
  return <Navigate to="/delivery" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route path="/customer/login" element={<LoginPage />} />
      <Route path="/customer/register" element={<RegisterPage />} />
      <Route path="/customer" element={<CustomerLayout />}>
        <Route index element={<CustomerHomePage />} />
        <Route path="my-order" element={<MyOrderPage />} />
        <Route path="new-order" element={<NewOrderPage />} />
        <Route path="track-order" element={<TrackOrderPage />} />
      </Route>

      <Route path="/owner/login" element={<OwnerLogin />} />
      <Route path="/owner/register" element={<OwnerRegister />} />
      <Route path="/owner" element={<OwnerDashboard />} />

      <Route path="/delivery/login" element={<DeliveryLogin />} />
      <Route path="/delivery/register" element={<DeliveryRegister />} />
      <Route path="/delivery" element={<DeliveryDashboard />} />
    </Routes>
=======
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import LoginCustomer from './pages/LoginCustomer'
import LoginDelivery from './pages/LoginDelivery'
import LoginOwner from './pages/LoginOwner'
import RegisterPage from './pages/register'
import OwnerDashboard from './pages/owner/Dashboard'
import RoleSelect from './pages/RoleSelect'
import CustomerLayout from './pages/customer/Dashboard'
import NewOrder from './pages/dashboard/NewOrder'
import Orders from './pages/customer/MyOrders'
import Track from './pages/dashboard/TrackOrder'
import DeliveryDashboard from './pages/delivery/DeliveryDashboard'
import { isAuthenticated, logout, seedDemoUsers, getCurrentUser } from './utils/auth'
import { seedStore } from './utils/store'

function RoleSelectRoute() {
  const navigate = useNavigate()
  return <RoleSelect onSelect={(role) => navigate(`/login/${role}`)} />
}

function LoginCustomerRoute() {
  const navigate = useNavigate()
  return <LoginCustomer onRegister={() => navigate('/register')} onLoginSuccess={() => navigate('/dashboard')} />
}

function LoginDeliveryRoute() {
  const navigate = useNavigate()
  return <LoginDelivery onRegister={() => navigate('/register')} onLoginSuccess={() => navigate('/delivery')} />
}

function LoginOwnerRoute() {
  const navigate = useNavigate()
  return <LoginOwner onRegister={() => navigate('/register')} onLoginSuccess={() => navigate('/owner')} />
}

function RegisterRoute() {
  const navigate = useNavigate()
  return <RegisterPage onBackToLogin={(role) => navigate(role === 'customer' ? '/login/customer' : role === 'delivery' ? '/login/delivery' : '/login/owner')} />
}

function LogoutAndHome() {
  const navigate = useNavigate()
  useEffect(() => {
    logout()
    navigate('/')
  }, [navigate])
  return null
}

export default function App() {
  useEffect(() => {
    seedDemoUsers()
    seedStore()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelectRoute />} />
        <Route path="/login/customer" element={<LoginCustomerRoute />} />
        <Route path="/login/delivery" element={<LoginDeliveryRoute />} />
        <Route path="/login/owner" element={<LoginOwnerRoute />} />
        <Route path="/login" element={<LoginCustomerRoute />} />
        <Route path="/register" element={<RegisterRoute />} />

        <Route path="/dashboard" element={isAuthenticated() ? <CustomerLayout onLogout={logout} /> : <Navigate to="/login/customer" />}>
          <Route index element={<NewOrder />} />
          <Route path="orders" element={<Orders />} />
          <Route path="track" element={<Track currentStatus={[] as any} onAdvance={() => {}} />} />
        </Route>

        <Route path="/owner" element={isAuthenticated() ? <OwnerDashboard onLogout={logout} /> : <Navigate to="/login/owner" />} />

        <Route path="/delivery" element={(isAuthenticated() && (() => { try { const u = getCurrentUser(); return u && (u as any).role === 'delivery' } catch { return false } })()) ? <DeliveryDashboard onLogout={logout} /> : <Navigate to="/login/delivery" />} />

        <Route path="/logout" element={<LogoutAndHome />} />
      </Routes>
    </BrowserRouter>
>>>>>>> Stashed changes
  )
}
