import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { authApi, getAccessToken, getCurrentUser } from '../services/api'

const DEMO_ACCOUNTS = [
  { role: 'Citizen', email: 'citizen.demo@ahmedabadmetro.in', password: 'Citizen123!' },
  { role: 'Tech', email: 'tech.demo@ahmedabadmetro.in', password: 'Tech123!' },
  { role: 'Admin', email: 'admin.demo@ahmedabadmetro.in', password: 'Admin123!' },
]

const roleRedirectMap = {
  Citizen: '/citizen',
  Tech: '/tech',
  Admin: '/admin',
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectPath = location.state?.from || '/'
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const token = getAccessToken()
  const user = getCurrentUser()
  const demoCredentials = useMemo(() => DEMO_ACCOUNTS, [])

  if (token && user) {
    return <Navigate to={roleRedirectMap[user.role] || redirectPath || '/'} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleDemoFill = (demoAccount) => {
    setForm({ email: demoAccount.email, password: demoAccount.password })
    toast.success(`${demoAccount.role} demo credentials loaded.`)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const result = await authApi.login({
        email: form.email,
        password: form.password,
      })

      toast.success(`Welcome back, ${result.user.email}`)
      navigate(roleRedirectMap[result.user.role] || redirectPath || '/')
    } catch (error) {
      if (![401, 500].includes(error.status)) toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <a className="login-brand" href="/" aria-label="Ahmedabad Metro Asset Central">
          <span className="login-brand-mark">AM</span>
          <span><strong>Ahmedabad Metro</strong><small>Centralized Asset Tracker</small></span>
        </a>
        <div className="login-heading">
          <span className="eyebrow">SECURE OPERATIONS ACCESS</span>
          <h1 id="login-title">Welcome back</h1>
          <p>Sign in with your assigned account to continue.</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field" htmlFor="login-email">Email
            <input id="login-email" name="email" type="email" autoComplete="username" value={form.email} onChange={handleChange} required />
          </label>
          <label className="login-field" htmlFor="login-password">Password
            <input id="login-password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={handleChange} required />
          </label>
          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="demo-credentials-panel" aria-label="demo credentials panel">
          <div className="panel-kicker">Quick demo access</div>
          <div className="demo-credential-list">
            {demoCredentials.map((demoAccount) => (
              <button key={demoAccount.role} type="button" className="demo-credential-item" onClick={() => handleDemoFill(demoAccount)}>
                <span>{demoAccount.role}</span>
                <small>{demoAccount.email}</small>
              </button>
            ))}
          </div>
        </div>

        <p className="login-footnote">Access is managed by your Ahmedabad Metro operations role.</p>
      </section>
    </main>
  )
}

export default LoginPage
