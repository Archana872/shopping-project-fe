import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import StoreLogo from '../components/StoreLogo'
import { loginOwner, saveSession } from '../utils/authStorage'
import '../styles/auth.css'

export default function OwnerLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Username and password are required.')
      return
    }
    const result = loginOwner(username.trim(), password)
    if (result.ok === false) {
      setError(result.message)
      return
    }
    saveSession('owner', result.user)
    navigate('/owner')
  }

  return (
    <div className="auth-page auth-page--owner">
      <div className="auth-topbar"><StoreLogo onClick={() => navigate('/')} /></div>
      <div className="auth-page-body">
        <div className="auth-layout">
          <aside className="auth-side">
            <h2>Store Owner Portal</h2>
            <p>Manage products, inventory, customer orders, and billing from one dashboard.</p>
          </aside>
          <div className="auth-card">
            <h1 className="auth-title">Owner sign in</h1>
            <p className="auth-subtitle">Access your store management panel.</p>
            {error && <div className="auth-alert auth-alert--error">{error}</div>}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="username">Username</label>
                <input id="username" type="text" placeholder="Username" className="auth-input" value={username} onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)} />
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="password">Password</label>
                <input id="password" type="password" placeholder="••••••••" className="auth-input" value={password} onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
              </div>
              <button type="submit" className="auth-submit">Sign In</button>
            </form>
            <div className="auth-footer">
              New owner?{' '}
              <button type="button" className="auth-link" onClick={() => navigate('/owner/register')}>Register store</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
