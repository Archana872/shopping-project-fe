import { useState, type ChangeEvent, type FormEvent } from 'react'

interface LoginForm {
  email: string
  password: string
}

interface LoginPageProps {
  onRegister: () => void
  onLoginSuccess: () => void
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login({ onRegister, onLoginSuccess }: LoginPageProps) {
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<LoginForm>>({})

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value } as LoginForm))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextErrors: Partial<LoginForm> = {}

    if (!form.email) nextErrors.email = 'Email is required.'
    else if (!emailRegex.test(form.email)) nextErrors.email = 'Please enter a valid email.'

    if (!form.password) nextErrors.password = 'Password is required.'
    else if (form.password.length < 6)
      nextErrors.password = 'Password must be at least 6 characters.'

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      alert('Login successful!')
      onLoginSuccess()
    }
  }

  return (
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
        <h1 style={{ margin: 0, marginBottom: 12, textAlign: 'center' }}>Customer Login</h1>
        <p style={{ color: '#475569', textAlign: 'center', marginTop: 0, marginBottom: 24 }}>
          Enter your email and password to access the customer dashboard.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              marginBottom: errors.email ? 6 : 18
            }}
          />
          {errors.email && (
            <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 18 }}>{errors.email}</div>
          )}

          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              marginBottom: errors.password ? 6 : 22
            }}
          />
          {errors.password && (
            <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 22 }}>{errors.password}</div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Login
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', color: '#475569' }}>
          Don’t have an account?{' '}
          <button
            type="button"
            onClick={onRegister}
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
        </div>
      </div>
    </div>
  )
}
