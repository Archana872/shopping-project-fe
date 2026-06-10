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
  )
}
