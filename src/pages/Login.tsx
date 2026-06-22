import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import StoreLogo from '../components/StoreLogo'
import { loginCustomer, saveSession } from '../utils/authStorage'
import '../styles/auth.css'

interface LoginForm {
  email: string
  password: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const navigate = useNavigate()

  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: ''
  })

  const [errors, setErrors] = useState<Partial<LoginForm>>({})
  const [submitError, setSubmitError] = useState('')

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setForm((current) => ({
      ...current,
      [name]: value
    }))

    setSubmitError('')
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const nextErrors: Partial<LoginForm> = {}

    if (!form.email) {
      nextErrors.email = 'Email is required.'
    } else if (!emailRegex.test(form.email)) {
      nextErrors.email = 'Please enter a valid email.'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    } else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

    setErrors(nextErrors)
    setSubmitError('')

    if (Object.keys(nextErrors).length > 0) return

    const result = loginCustomer(form.email, form.password)

    if (result.ok === false) {
      setSubmitError(result.message)
      return
    }

    saveSession('customer', result.user)
    navigate('/customer')
  }

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <StoreLogo onClick={() => navigate('/')} />
      </div>

      <div className="auth-page-body">
        <div className="auth-layout">
          <aside className="auth-side">
            <h2>Welcome back!</h2>
            <p>
              Sign in to order fresh groceries, manage your cart, and track
              deliveries to your door.
            </p>
          </aside>

          <div className="auth-card">
            <h1 className="auth-title">Sign in</h1>
            <p className="auth-subtitle">
              Enter your account details below.
            </p>

            {submitError && (
              <div className="auth-alert auth-alert--error">
                {submitError}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                  className={`auth-input${
                    errors.email ? ' auth-input--error' : ''
                  }`}
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />

                {errors.email && (
                  <p className="auth-error">{errors.email}</p>
                )}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className={`auth-input${
                    errors.password ? ' auth-input--error' : ''
                  }`}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />

                {errors.password && (
                  <p className="auth-error">{errors.password}</p>
                )}
              </div>

              <button type="submit" className="auth-submit">
                Sign In
              </button>
            </form>

            <div className="auth-footer">
              New here?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => navigate('/customer/register')}
              >
                Create an account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}