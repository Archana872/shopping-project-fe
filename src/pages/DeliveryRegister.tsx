import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import StoreLogo from '../components/StoreLogo'
import { registerDeliveryBoy } from '../utils/authStorage'
import '../styles/auth.css'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[\d\s\-+()]{10,15}$/

export default function DeliveryRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
    setSubmitError('')
    setSuccess('')
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextErrors: Partial<typeof form> = {}
    if (!form.name.trim()) nextErrors.name = 'Name is required.'
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    else if (!emailRegex.test(form.email)) nextErrors.email = 'Enter a valid email.'
    if (!form.phone.trim()) nextErrors.phone = 'Phone is required.'
    else if (!phoneRegex.test(form.phone.replace(/\s/g, ''))) nextErrors.phone = 'Enter a valid phone.'
    if (!form.password) nextErrors.password = 'Password is required.'
    else if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const result = registerDeliveryBoy({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password })
    if (result.ok === false) { setSubmitError(result.message); return }
    setSuccess('Registration successful!')
    setTimeout(() => navigate('/delivery/login'), 1500)
  }

  return (
    <div className="auth-page auth-page--delivery">
      <div className="auth-topbar"><StoreLogo onClick={() => navigate('/')} /></div>
      <div className="auth-page-body">
        <div className="auth-layout">
          <aside className="auth-side">
            <h2>Become a delivery partner</h2>
            <p>Join our fleet and help deliver fresh groceries to customers in your area.</p>
          </aside>
          <div className="auth-card">
            <h1 className="auth-title">Delivery sign up</h1>
            {submitError && <div className="auth-alert auth-alert--error">{submitError}</div>}
            {success && <div className="auth-alert auth-alert--success">{success}</div>}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="name">Name</label>
                <input id="name" name="name" type="text" className={`auth-input${errors.name ? ' auth-input--error' : ''}`} value={form.name} onChange={handleChange} />
                {errors.name && <p className="auth-error">{errors.name}</p>}
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" className={`auth-input${errors.email ? ' auth-input--error' : ''}`} value={form.email} onChange={handleChange} />
                {errors.email && <p className="auth-error">{errors.email}</p>}
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" className={`auth-input${errors.phone ? ' auth-input--error' : ''}`} value={form.phone} onChange={handleChange} />
                {errors.phone && <p className="auth-error">{errors.phone}</p>}
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="password">Password</label>
                <input id="password" name="password" type="password" className={`auth-input${errors.password ? ' auth-input--error' : ''}`} value={form.password} onChange={handleChange} />
                {errors.password && <p className="auth-error">{errors.password}</p>}
              </div>
              <button type="submit" className="auth-submit">Sign Up</button>
            </form>
            <div className="auth-footer">
              Have an account? <button type="button" className="auth-link" onClick={() => navigate('/delivery/login')}>Sign in</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
