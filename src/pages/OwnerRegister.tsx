import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import StoreLogo from '../components/StoreLogo'
import { registerOwner } from '../utils/authStorage'
import '../styles/auth.css'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function OwnerRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
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
    if (!form.username.trim()) nextErrors.username = 'Username is required.'
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    else if (!emailRegex.test(form.email)) nextErrors.email = 'Enter a valid email.'
    if (!form.password) nextErrors.password = 'Password is required.'
    else if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const result = registerOwner({ name: form.name.trim(), username: form.username.trim(), email: form.email.trim(), password: form.password })
    if (result.ok === false) { setSubmitError(result.message); return }
    setSuccess('Registration successful!')
    setTimeout(() => navigate('/owner/login'), 1500)
  }

  return (
    <div className="auth-page auth-page--owner">
      <div className="auth-topbar"><StoreLogo onClick={() => navigate('/')} /></div>
      <div className="auth-page-body">
        <div className="auth-layout">
          <aside className="auth-side">
            <h2>Register your store</h2>
            <p>Set up your owner account and start managing your online grocery business.</p>
          </aside>
          <div className="auth-card">
            <h1 className="auth-title">Owner sign up</h1>
            {submitError && <div className="auth-alert auth-alert--error">{submitError}</div>}
            {success && <div className="auth-alert auth-alert--success">{success}</div>}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {(['name', 'username', 'email', 'password'] as const).map((field) => (
                <div className="auth-field" key={field}>
                  <label className="auth-label" htmlFor={field}>{field === 'name' ? 'Name' : field === 'username' ? 'Username' : field === 'email' ? 'Email' : 'Password'}</label>
                  <input id={field} name={field} type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'} className={`auth-input${errors[field] ? ' auth-input--error' : ''}`} value={form[field]} onChange={handleChange} />
                  {errors[field] && <p className="auth-error">{errors[field]}</p>}
                </div>
              ))}
              <button type="submit" className="auth-submit">Sign Up</button>
            </form>
            <div className="auth-footer">
              Have an account? <button type="button" className="auth-link" onClick={() => navigate('/owner/login')}>Sign in</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
