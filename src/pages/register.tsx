import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import StoreLogo from '../components/StoreLogo'
import { registerCustomer } from '../utils/authStorage'
import '../styles/auth.css'

interface RegisterForm {
  name: string
  email: string
  phone: string
  address: string
  password: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[\d\s\-+()]{10,15}$/

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  })

  const [errors, setErrors] = useState<Partial<RegisterForm>>({})
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    setForm((current) => ({
      ...current,
      [name]: value
    }))

    setSubmitError('')
    setSuccess('')
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const nextErrors: Record<string, string> = {}

    if (!form.name.trim()) nextErrors.name = 'Name is required.'

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!emailRegex.test(form.email)) {
      nextErrors.email = 'Enter a valid email.'
    }

    if (!form.phone.trim()) {
      nextErrors.phone = 'Phone number is required.'
    } else if (!phoneRegex.test(form.phone.replace(/\s/g, ''))) {
      nextErrors.phone = 'Enter a valid phone number (10–15 digits).'
    }

    if (!form.address.trim()) {
      nextErrors.address = 'Address is required.'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    } else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

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
    }

    setSuccess(
      'Registration successful! You can now login with your email and password.'
    )

    setForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      password: ''
    })

    setTimeout(() => navigate('/customer/login'), 1500)
  }

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <StoreLogo onClick={() => navigate('/')} />
      </div>

      <div className="auth-page-body">
        <div className="auth-layout">
          <aside className="auth-side">
            <h2>Join FreshMart</h2>
            <p>
              Create your account and start ordering farm-fresh groceries with
              fast doorstep delivery.
            </p>
          </aside>

          <div className="auth-card">
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">
              Fill in your details to get started.
            </p>

            {submitError && (
              <div className="auth-alert auth-alert--error">
                {submitError}
              </div>
            )}

            {success && (
              <div className="auth-alert auth-alert--success">
                {success}
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="auth-field">
                <label className="auth-label" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  className={`auth-input${
                    errors.name ? ' auth-input--error' : ''
                  }`}
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <p className="auth-error">{errors.name}</p>
                )}
              </div>

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
                />
                {errors.email && (
                  <p className="auth-error">{errors.email}</p>
                )}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="9876543210"
                  className={`auth-input${
                    errors.phone ? ' auth-input--error' : ''
                  }`}
                  value={form.phone}
                  onChange={handleChange}
                />
                {errors.phone && (
                  <p className="auth-error">{errors.phone}</p>
                )}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="address">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={2}
                  placeholder="Delivery address"
                  className={`auth-input${
                    errors.address ? ' auth-input--error' : ''
                  }`}
                  value={form.address}
                  onChange={handleChange}
                />
                {errors.address && (
                  <p className="auth-error">{errors.address}</p>
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
                  placeholder="Min. 6 characters"
                  className={`auth-input${
                    errors.password ? ' auth-input--error' : ''
                  }`}
                  value={form.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="auth-error">{errors.password}</p>
                )}
              </div>

              <button type="submit" className="auth-submit">
                Sign Up
              </button>
            </form>

            <div className="auth-footer">
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => navigate('/customer/login')}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}