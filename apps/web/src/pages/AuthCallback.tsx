import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()

  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        const token = searchParams.get('token')
        const refreshToken = searchParams.get('refreshToken')
        const name = searchParams.get('name')
        const email = searchParams.get('email')
        const avatar = searchParams.get('avatar')
        const error = searchParams.get('error')

        console.log('[AUTH_CALLBACK] Processing callback with params:', {
          token: token ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          name,
          email,
          error
        })

        if (error) {
          // Handle OAuth error
          console.error('[AUTH_CALLBACK] OAuth error:', error)
          setError(`OAuth error: ${error}`)
          setTimeout(() => navigate('/login?error=oauth_failed'), 2000)
          return
        }

        if (token && refreshToken) {
          // Use AuthContext to store tokens and user info
          login({
            accessToken: token,
            refreshToken: refreshToken,
            name: name || 'User',
            email: email || 'user@example.com',
            avatar: avatar || undefined
          })
          
          console.log('[AUTH_CALLBACK] User logged in via AuthContext')
          
          // Show success message briefly then redirect
          setTimeout(() => {
            navigate('/')
          }, 1500)
        } else {
          // No tokens received - this shouldn't happen with our current flow
          console.error('[AUTH_CALLBACK] No tokens received')
          setError('No authentication tokens received')
          setTimeout(() => navigate('/login?error=no_tokens'), 2000)
        }
      } catch (err) {
        console.error('[AUTH_CALLBACK] Error processing callback:', err)
        setError('Error processing authentication')
        setTimeout(() => navigate('/login?error=processing_failed'), 2000)
      } finally {
        setIsProcessing(false)
      }
    }

    processAuthCallback()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen neon-bg flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-20 left-20 text-5xl neon-green opacity-20 animate-pulse">🔐</div>
      <div className="absolute bottom-20 right-20 text-5xl neon-pink opacity-20 animate-pulse">⚡</div>
      
      <div className="text-center">
        <div className="neon-card p-8">
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
              <p className="neon-text text-white">Đang xử lý đăng nhập...</p>
            </>
          ) : error ? (
            <>
              <div className="text-6xl mb-4">❌</div>
              <p className="neon-text text-red-400 mb-4">{error}</p>
              <p className="text-white opacity-70">Chuyển hướng về trang đăng nhập...</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">✅</div>
              <p className="neon-text text-green-400 mb-4">Đăng nhập thành công!</p>
              <p className="text-white opacity-70">Chuyển hướng về trang chủ...</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
