import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import StoreLogo from '../components/StoreLogo'
import { loginDeliveryBoy, saveSession } from '../utils/authStorage'
import '../styles/auth.css'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function DeliveryLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextErrors: { email?: string; password?: string } = {}
    if (!email) nextErrors.email = 'Email is required.'
    else if (!emailRegex.test(email)) nextErrors.email = 'Enter a valid email.'
    if (!password) nextErrors.password = 'Password is required.'
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
    setErrors(nextErrors)
    setSubmitError('')
    if (Object.keys(nextErrors).length > 0) return

    const result = loginDeliveryBoy(email, password)
    if (result.ok === false) { setSubmitError(result.message); return }
    saveSession('delivery', result.user)
    navigate('/delivery')
  }

  return (
    <div className="auth-page auth-page--delivery">
      <div className="auth-topbar"><StoreLogo onClick={() => navigate('/')} /></div>
      <div className="auth-page-body">
        <div className="auth-layout">
          <aside className="auth-side">
            <h2>Delivery Partner</h2>
            <p>Sign in to view your assigned routes and update delivery status in real time.</p>
          </aside>
          <div className="auth-card">
            <h1 className="auth-title">Delivery sign in</h1>
            {submitError && <div className="auth-alert auth-alert--error">{submitError}</div>}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">Email</label>
                <input id="email" type="email" placeholder="you@email.com" className={`auth-input${errors.email ? ' auth-input--error' : ''}`} value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
                {errors.email && <p className="auth-error">{errors.email}</p>}
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="password">Password</label>
                <input id="password" type="password" placeholder="••••••••" className={`auth-input${errors.password ? ' auth-input--error' : ''}`} value={password} onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
                {errors.password && <p className="auth-error">{errors.password}</p>}
              </div>
              <button type="submit" className="auth-submit">Sign In</button>
            </form>
            <div className="auth-footer">
              New partner? <button type="button" className="auth-link" onClick={() => navigate('/delivery/register')}>Join now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
