import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/authStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()

  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        console.log('[AUTH_CALLBACK] Processing callback:', {
          code: code ? 'present' : 'missing',
          error: errorParam
        });

        if (errorParam) {
          console.error('[AUTH_CALLBACK] OAuth error:', errorParam);
          setError(`OAuth error: ${errorParam}`);
          setTimeout(() => navigate('/login?error=oauth_failed'), 2000);
          return;
        }

        if (!code) {
          console.error('[AUTH_CALLBACK] No code received in URL');
          setError('No authentication code received');
          setTimeout(() => navigate('/login?error=no_tokens'), 2000);
          return;
        }

        // --- NEW FLOW: Exchange code for tokens via POST ---
        // The refresh token is set by the backend as an httpOnly cookie.
        // We only receive the accessToken and user profile in JSON.
        const { api } = await import('../api/client');
        const response = await api.post('/api/auth/exchange', { code });
        const { accessToken, name, email, avatar, role } = response.data;

        if (accessToken) {
          // Use AuthContext to store access token in memory and user profile
          login({
            accessToken,
            name: name || 'User',
            email: email || 'user@example.com',
            avatar: avatar || undefined,
            role
          });

          console.log('[AUTH_CALLBACK] User logged in via exchange success');

          // Show success message briefly then redirect
          setTimeout(() => {
            navigate('/');
          }, 1500);
        } else {
          console.error('[AUTH_CALLBACK] Exchange failed: No access token in response');
          setError('Failed to retrieve authentication tokens');
          setTimeout(() => navigate('/login?error=no_tokens'), 2000);
        }
      } catch (err: any) {
        console.error('[AUTH_CALLBACK] Error processing callback:', err);
        const backendError = err.response?.data?.message || err.message;
        setError(`Lỗi xác thực: ${backendError}`);
        setTimeout(() => navigate('/login?error=processing_failed'), 3000);
      } finally {
        setIsProcessing(false);
      }
    };

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
