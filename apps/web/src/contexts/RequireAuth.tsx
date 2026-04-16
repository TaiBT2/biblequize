import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/authStore'

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return (
    <div data-testid="auth-loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--hp-bg)' }}>
      <div data-testid="loading-spinner" role="progressbar" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(212,168,67,.2)', borderTopColor: 'var(--hp-gold)', animation: 'spin 1s linear infinite' }} />
    </div>
  )
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

export default RequireAuth


