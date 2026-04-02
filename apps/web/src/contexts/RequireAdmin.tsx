import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/authStore'

const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth()
  const location = useLocation()
  const isContentMod = user?.role === 'CONTENT_MOD' || user?.role === 'content_mod'

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--hp-bg)' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(212,168,67,.2)', borderTopColor: 'var(--hp-gold)', animation: 'spin 1s linear infinite' }} />
    </div>
  )
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (!isAdmin && !isContentMod) {
    return <Navigate to="/" replace />
  }
  return children
}

export default RequireAdmin
