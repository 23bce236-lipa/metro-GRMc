import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken, getCurrentUser } from '../services/api'

function ProtectedRoute({ children, allowedRoles = [], redirectTo = '/login' }) {
  const location = useLocation()
  const token = getAccessToken()
  const user = getCurrentUser()

  if (!token || !user) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
