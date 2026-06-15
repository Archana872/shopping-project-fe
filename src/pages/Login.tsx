import { useState, type ChangeEvent, type FormEvent } from 'react'
<<<<<<< Updated upstream
import { useNavigate } from 'react-router-dom'
import StoreLogo from '../components/StoreLogo'
import { loginCustomer, saveSession } from '../utils/authStorage'
import '../styles/auth.css'
=======
import { loginUser } from '../utils/auth'
import '../styles/ui.css'
>>>>>>> Stashed changes

interface LoginForm {
  email: string
  password: string
}

<<<<<<< Updated upstream
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const navigate = useNavigate()
=======
interface LoginPageProps {
  role?: 'customer' | 'delivery' | 'owner'
  onRegister: (role?: 'customer' | 'delivery' | 'owner') => void
  onLoginSuccess: () => void
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login({ role = 'customer', onRegister, onLoginSuccess }: LoginPageProps) {
>>>>>>> Stashed changes
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<LoginForm>>({})
  const [submitError, setSubmitError] = useState('')

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value } as LoginForm))
    setSubmitError('')
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextErrors: Partial<LoginForm> = {}

<<<<<<< Updated upstream
    if (!form.email) nextErrors.email = 'Email is required.'
    else if (!emailRegex.test(form.email)) nextErrors.email = 'Please enter a valid email.'
=======
    if (!form.email) nextErrors.email = role === 'customer' ? 'Email is required.' : 'ID is required.'
    else if (role === 'customer' && !emailRegex.test(form.email)) nextErrors.email = 'Please enter a valid email.'

>>>>>>> Stashed changes
    if (!form.password) nextErrors.password = 'Password is required.'
    else if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'

    setErrors(nextErrors)
    setSubmitError('')
    if (Object.keys(nextErrors).length > 0) return

<<<<<<< Updated upstream
    const result = loginCustomer(form.email, form.password)
    if (result.ok === false) {
      setSubmitError(result.message)
      return
=======
    if (Object.keys(nextErrors).length === 0) {
      const res = loginUser(form.email, form.password, role)
      if (!res.success) return alert(res.message)
      onLoginSuccess()
>>>>>>> Stashed changes
    }

    saveSession('customer', result.user)
    navigate('/customer')
  }

  return (
<<<<<<< Updated upstream
    <div className="auth-page">
      <div className="auth-topbar">
        <StoreLogo onClick={() => navigate('/')} />
      </div>
=======
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        background: 'linear-gradient(180deg, #eef2ff 0%, #ffffff 100%)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#ffffff',
          borderRadius: 18,
          boxShadow: '0 18px 45px rgba(15,23,42,0.12)',
          padding: 32
        }}
      >
        <h1 style={{ margin: 0, marginBottom: 12, textAlign: 'center' }}>{role[0].toUpperCase() + role.slice(1)} Login</h1>
        <p style={{ color: '#475569', textAlign: 'center', marginTop: 0, marginBottom: 24 }}>
          {role === 'customer'
            ? 'Enter your email and password to access the customer dashboard.'
            : 'Enter your ID and password to access your account.'}
        </p>
>>>>>>> Stashed changes

      <div className="auth-page-body">
        <div className="auth-layout">
          <aside className="auth-side">
            <h2>Welcome back!</h2>
            <p>Sign in to order fresh groceries, manage your cart, and track deliveries to your door.</p>
          </aside>

          <div className="auth-card">
            <h1 className="auth-title">Sign in</h1>
            <p className="auth-subtitle">Enter your account details below.</p>

            {submitError && <div className="auth-alert auth-alert--error">{submitError}</div>}

<<<<<<< Updated upstream
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="you@email.com" className={`auth-input${errors.email ? ' auth-input--error' : ''}`} value={form.email} onChange={handleChange} autoComplete="email" />
                {errors.email && <p className="auth-error">{errors.email}</p>}
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="password">Password</label>
                <input id="password" name="password" type="password" placeholder="••••••••" className={`auth-input${errors.password ? ' auth-input--error' : ''}`} value={form.password} onChange={handleChange} autoComplete="current-password" />
                {errors.password && <p className="auth-error">{errors.password}</p>}
              </div>
              <button type="submit" className="auth-submit">Sign In</button>
            </form>

            <div className="auth-footer">
              New here?{' '}
              <button type="button" className="auth-link" onClick={() => navigate('/customer/register')}>Create an account</button>
            </div>
          </div>
=======
        <div style={{ marginTop: 20, textAlign: 'center', color: '#475569' }}>
          Don’t have an account?{' '}
          <button
            type="button"
            onClick={() => onRegister(role)}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#2563eb',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Register
          </button>
>>>>>>> Stashed changes
        </div>
      </div>
    </div>
  )
}
