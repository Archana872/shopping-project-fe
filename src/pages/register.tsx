import { useState, ChangeEvent, FormEvent } from 'react'

interface RegisterForm {
  name: string
  email: string
  phone: string
  address: string
  password: string
}

interface RegisterPageProps {
  onBackToLogin: () => void
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage({ onBackToLogin }: RegisterPageProps) {
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  })
  const [errors, setErrors] = useState<Partial<RegisterForm>>({})

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value } as RegisterForm))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextErrors: Partial<RegisterForm> = {}

    if (!form.name) nextErrors.name = 'Name is required.'
    if (!form.email) nextErrors.email = 'Email is required.'
    else if (!emailRegex.test(form.email)) nextErrors.email = 'Enter a valid email.'
    if (!form.phone) nextErrors.phone = 'Phone number is required.'
    if (!form.address) nextErrors.address = 'Address is required.'
    if (!form.password) nextErrors.password = 'Password is required.'
    else if (form.password.length < 6)
      nextErrors.password = 'Password must be at least 6 characters.'

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      alert('Registration successful (mock). Please login.')
      onBackToLogin()
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
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          background: '#ffffff',
          borderRadius: 18,
          boxShadow: '0 18px 45px rgba(15,23,42,0.12)',
          padding: 32
        }}
      >
        <h1 style={{ margin: 0, marginBottom: 10, textAlign: 'center' }}>Create Account</h1>
        <p style={{ color: '#475569', textAlign: 'center', marginTop: 0, marginBottom: 24 }}>
          Register as a customer to place grocery orders.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', marginBottom: errors.name ? 6 : 18 }}
          />
          {errors.name && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 18 }}>{errors.name}</div>}

          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', marginBottom: errors.email ? 6 : 18 }}
          />
          {errors.email && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 18 }}>{errors.email}</div>}

          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }} htmlFor="phone">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', marginBottom: errors.phone ? 6 : 18 }}
          />
          {errors.phone && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 18 }}>{errors.phone}</div>}

          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }} htmlFor="address">
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={form.address}
            onChange={handleChange}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', marginBottom: errors.address ? 6 : 18 }}
          />
          {errors.address && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 18 }}>{errors.address}</div>}

          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', marginBottom: errors.password ? 6 : 22 }}
          />
          {errors.password && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 22 }}>{errors.password}</div>}

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
            Register
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', color: '#475569' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onBackToLogin}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#2563eb',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  )
}
