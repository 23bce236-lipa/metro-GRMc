import { ArrowRight, CheckCircle2, ShieldCheck, TrainFront } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Navigate, useNavigate } from 'react-router-dom'
import { authApi, getAccessToken, getCurrentUser } from '../services/api'

const demoAccounts = [
  {
    role: 'Citizen',
    label: 'Citizen Access',
    email: 'citizen.demo@ahmedabadmetro.in',
    password: 'Citizen123!',
    route: '/citizen',
    description: 'Report asset issues to the operations team.',
  },
  {
    role: 'Tech',
    label: 'Technician Access',
    email: 'tech.demo@ahmedabadmetro.in',
    password: 'Tech123!',
    route: '/tech',
    description: 'Complete repairs and record work history.',
  },
  {
    role: 'Admin',
    label: 'Admin Access',
    email: 'admin.demo@ahmedabadmetro.in',
    password: 'Admin123!',
    route: '/admin',
    description: 'Review the live network and asset health.',
  },
]

const routeMap = {
  Citizen: '/citizen',
  Tech: '/tech',
  Admin: '/admin',
}

function HomePage() {
  const navigate = useNavigate()
  const token = getAccessToken()
  const user = getCurrentUser()
  const [loadingRole, setLoadingRole] = useState(null)

  if (token && user) {
    return <Navigate to={routeMap[user.role] || '/dashboard'} replace />
  }

  const handleDemoLogin = async (demoAccount) => {
    setLoadingRole(demoAccount.role)

    try {
      await authApi.register({
        email: demoAccount.email,
        password: demoAccount.password,
        role: demoAccount.role,
      })
      toast.success(`${demoAccount.label} ready.`)
      navigate(demoAccount.route)
    } catch (error) {
      if (error?.status === 409 || error?.status === 401) {
        try {
          await authApi.login({
            email: demoAccount.email,
            password: demoAccount.password,
          })
          toast.success(`${demoAccount.label} ready.`)
          navigate(demoAccount.route)
          return
        } catch (loginError) {
          toast.error(loginError.message || 'Unable to start the demo session.')
          navigate('/login')
          return
        }
      }

      toast.error(error.message || 'Unable to start the demo session.')
      navigate('/login')
    } finally {
      setLoadingRole(null)
    }
  }

  return (
    <main className="home-shell">
      <section className="home-hero">
        <nav className="home-nav">
          <div className="login-brand" aria-label="Ahmedabad Metro Asset Central">
            <span className="login-brand-mark">AM</span>
            <span>
              <strong>Ahmedabad Metro</strong>
              <small>Centralized Asset Tracker</small>
            </span>
          </div>
          <button type="button" className="login-link" onClick={() => navigate('/login')}>
            Staff sign in
          </button>
        </nav>

        <div className="home-content">
          <div className="home-copy">
            <span className="eyebrow home-eyebrow">Metro operations / live network visibility</span>
            <h1>Keep the network moving with one source of truth.</h1>
            <p>
              Track infrastructure health, report issues, coordinate maintenance, and lead daily asset operations
              across every station and corridor.
            </p>

            <div className="home-cta-row">
              <button type="button" className="primary-cta" onClick={() => navigate('/login')}>
                Open secure sign in
              </button>
              <button type="button" className="secondary-cta" onClick={() => handleDemoLogin(demoAccounts[0])}>
                Try citizen demo
              </button>
            </div>

            <div className="home-highlights">
              <span><CheckCircle2 size={14} /> Live asset monitoring</span>
              <span><TrainFront size={14} /> Station-ready reporting</span>
              <span><ShieldCheck size={14} /> Role-based access</span>
            </div>
          </div>

          <div className="home-panel" aria-label="demo access panel">
            <div className="panel-kicker">Demo access</div>
            <div className="demo-list">
              {demoAccounts.map((demoAccount) => (
                <button
                  key={demoAccount.role}
                  type="button"
                  className="demo-card"
                  onClick={() => handleDemoLogin(demoAccount)}
                  disabled={Boolean(loadingRole && loadingRole !== demoAccount.role)}
                >
                  <div className="demo-card-copy">
                    <span className="demo-role-label">{demoAccount.label}</span>
                    <strong>{demoAccount.description}</strong>
                    <small>{demoAccount.email}</small>
                    <code>{demoAccount.password}</code>
                  </div>
                  <span className="demo-card-action">
                    {loadingRole === demoAccount.role ? 'Opening…' : 'Open'}
                    <ArrowRight size={15} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default HomePage
