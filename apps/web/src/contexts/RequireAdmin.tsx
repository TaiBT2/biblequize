import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth()
  const location = useLocation()

  console.log('[REQUIRE_ADMIN] Debug:', { isAuthenticated, isLoading, isAdmin, userRole: user?.role })

  if (isLoading) return children
  if (!isAuthenticated) {
    console.log('[REQUIRE_ADMIN] Not authenticated, redirecting to login')
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (!isAdmin) {
    console.log('[REQUIRE_ADMIN] Not admin, redirecting to home. User role:', user?.role)
    return <Navigate to="/" replace />
  }
  console.log('[REQUIRE_ADMIN] Admin access granted')
  return children
}

export default RequireAdmin



