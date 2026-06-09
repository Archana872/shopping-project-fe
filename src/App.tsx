import { useState } from 'react'
import LoginPage from './pages/Login'
import RegisterPage from './pages/register'
import DashboardPage from './pages/dashboard'

function App() {
  const [page, setPage] = useState<'login' | 'register' | 'dashboard'>('login')

  return (
    <div>
      {page === 'login' && (
        <LoginPage
          onRegister={() => setPage('register')}
          onLoginSuccess={() => setPage('dashboard')}
        />
      )}
      {page === 'register' && (
        <RegisterPage onBackToLogin={() => setPage('login')} />
      )}
      {page === 'dashboard' && <DashboardPage onLogout={() => setPage('login')} />}
    </div>
  )
}

export default App
