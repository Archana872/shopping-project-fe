import { useState, type ChangeEvent, type FormEvent } from 'react'
<<<<<<< Updated upstream
import { useNavigate } from 'react-router-dom'
import StoreLogo from '../components/StoreLogo'
import { registerCustomer } from '../utils/authStorage'
import '../styles/auth.css'
=======
import '../styles/ui.css'
import { registerUser, registerDeliveryUser, registerOwner } from '../utils/auth'
>>>>>>> Stashed changes

interface RegisterForm {
  name: string
  email: string
  phone: string
  address: string
  password: string
}

<<<<<<< Updated upstream
=======
interface OtherForm {
  id: string
  name: string
  password: string
}

interface RegisterPageProps {
  role?: 'customer' | 'delivery' | 'owner'
  onBackToLogin: (role?: 'customer' | 'delivery' | 'owner') => void
}

>>>>>>> Stashed changes
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[\d\s\-+()]{10,15}$/

<<<<<<< Updated upstream
export default function RegisterPage() {
  const navigate = useNavigate()
=======
export default function RegisterPage({ role = 'customer', onBackToLogin }: RegisterPageProps) {
>>>>>>> Stashed changes
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  })
<<<<<<< Updated upstream
  const [errors, setErrors] = useState<Partial<RegisterForm>>({})
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')
=======
  const [otherForm, setOtherForm] = useState<OtherForm>({ id: '', name: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
>>>>>>> Stashed changes

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
<<<<<<< Updated upstream
    setForm((current) => ({ ...current, [name]: value } as RegisterForm))
    setSubmitError('')
    setSuccess('')
=======
    if (role === 'customer') setForm((current) => ({ ...current, [name]: value } as RegisterForm))
    else setOtherForm((current) => ({ ...current, [name]: value } as OtherForm))
>>>>>>> Stashed changes
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}

<<<<<<< Updated upstream
    if (!form.name.trim()) nextErrors.name = 'Name is required.'
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    else if (!emailRegex.test(form.email)) nextErrors.email = 'Enter a valid email.'

    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.'
    else if (!phoneRegex.test(form.phone.replace(/\s/g, '')))
      nextErrors.phone = 'Enter a valid phone number (10–15 digits).'

    if (!form.address.trim()) nextErrors.address = 'Address is required.'

    if (!form.password) nextErrors.password = 'Password is required.'
    else if (form.password.length < 6)
      nextErrors.password = 'Password must be at least 6 characters.'

    setErrors(nextErrors)
    setSubmitError('')
    setSuccess('')

    if (Object.keys(nextErrors).length > 0) return

    const result = registerCustomer({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      password: form.password
    })

    if (result.ok === false) {
      setSubmitError(result.message)
      return
=======
    if (role === 'customer') {
      if (!form.name) nextErrors.name = 'Name is required.'
      if (!form.email) nextErrors.email = 'Email is required.'
      else if (!emailRegex.test(form.email)) nextErrors.email = 'Enter a valid email.'
      if (!form.phone) nextErrors.phone = 'Phone number is required.'
      if (!form.address) nextErrors.address = 'Address is required.'
      if (!form.password) nextErrors.password = 'Password is required.'
      else if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'

      setErrors(nextErrors)

      if (Object.keys(nextErrors).length === 0) {
        const res = registerUser({ name: form.name, email: form.email, phone: form.phone, address: form.address, password: form.password })
        if (!res.success) return alert(res.message)
        alert('Registration successful. Please login.')
        onBackToLogin('customer')
      }
    } else {
      if (!otherForm.id) nextErrors.id = 'ID is required.'
      if (!otherForm.name) nextErrors.name = 'Name is required.'
      if (!otherForm.password) nextErrors.password = 'Password is required.'
      else if (otherForm.password.length < 4) nextErrors.password = 'Password must be at least 4 characters.'

      setErrors(nextErrors)

      if (Object.keys(nextErrors).length === 0) {
        const payload = { id: otherForm.id, name: otherForm.name, password: otherForm.password }
        const res = role === 'delivery' ? registerDeliveryUser(payload) : registerOwner(payload)
        if (!res.success) return alert(res.message)
        alert('Registration successful. Please login.')
        onBackToLogin(role)
      }
>>>>>>> Stashed changes
    }

    setSuccess('Registration successful! You can now login with your email and password.')
    setForm({ name: '', email: '', phone: '', address: '', password: '' })
    setTimeout(() => navigate('/customer/login'), 1500)
  }

  return (
<<<<<<< Updated upstream
    <div className="auth-page">
      <div className="auth-topbar">
        <StoreLogo onClick={() => navigate('/')} />
      </div>

      <div className="auth-page-body">
        <div className="auth-layout">
          <aside className="auth-side">
            <h2>Join FreshMart</h2>
            <p>Create your account and start ordering farm-fresh groceries with fast doorstep delivery.</p>
          </aside>

          <div className="auth-card">
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Fill in your details to get started.</p>

            {submitError && <div className="auth-alert auth-alert--error">{submitError}</div>}
            {success && <div className="auth-alert auth-alert--success">{success}</div>}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="name">Name</label>
                <input id="name" name="name" type="text" placeholder="Your name" className={`auth-input${errors.name ? ' auth-input--error' : ''}`} value={form.name} onChange={handleChange} autoComplete="name" />
                {errors.name && <p className="auth-error">{errors.name}</p>}
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="you@email.com" className={`auth-input${errors.email ? ' auth-input--error' : ''}`} value={form.email} onChange={handleChange} autoComplete="email" />
                {errors.email && <p className="auth-error">{errors.email}</p>}
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" placeholder="9876543210" className={`auth-input${errors.phone ? ' auth-input--error' : ''}`} value={form.phone} onChange={handleChange} autoComplete="tel" />
                {errors.phone && <p className="auth-error">{errors.phone}</p>}
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="address">Address</label>
                <textarea id="address" name="address" rows={2} placeholder="Delivery address" className={`auth-input${errors.address ? ' auth-input--error' : ''}`} value={form.address} onChange={handleChange} autoComplete="street-address" style={{ resize: 'vertical', minHeight: 72 }} />
                {errors.address && <p className="auth-error">{errors.address}</p>}
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="password">Password</label>
                <input id="password" name="password" type="password" placeholder="Min. 6 characters" className={`auth-input${errors.password ? ' auth-input--error' : ''}`} value={form.password} onChange={handleChange} autoComplete="new-password" />
                {errors.password && <p className="auth-error">{errors.password}</p>}
              </div>
              <button type="submit" className="auth-submit">Sign Up</button>
            </form>

            <div className="auth-footer">
              Already have an account?{' '}
              <button type="button" className="auth-link" onClick={() => navigate('/customer/login')}>Sign in</button>
            </div>
          </div>
=======
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
        <h1 style={{ margin: 0, marginBottom: 10, textAlign: 'center' }}>{role === 'customer' ? 'Create Account' : `Register ${role[0].toUpperCase() + role.slice(1)}`}</h1>
        <p style={{ color: '#475569', textAlign: 'center', marginTop: 0, marginBottom: 24 }}>
          {role === 'customer' ? 'Register as a customer to place grocery orders.' : `Register as ${role} to access your dashboard.`}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {role === 'customer' ? (
            <>
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
            </>
          ) : (
            <>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }} htmlFor="id">
                ID
              </label>
              <input
                id="id"
                name="id"
                type="text"
                value={otherForm.id}
                onChange={handleChange}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', marginBottom: errors.id ? 6 : 18 }}
              />
              {errors.id && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 18 }}>{errors.id}</div>}

              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }} htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={otherForm.name}
                onChange={handleChange}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', marginBottom: errors.name ? 6 : 18 }}
              />
              {errors.name && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 18 }}>{errors.name}</div>}

              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={otherForm.password}
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
            </>
          )}
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', color: '#475569' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onBackToLogin(role)}
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
>>>>>>> Stashed changes
        </div>
      </div>
    </div>
  )
}
