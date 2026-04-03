import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  const securityHeaders = {
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      headers: {
        ...securityHeaders,
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*;",
      },
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true
        }
      }
    },
    preview: {
      headers: {
        ...securityHeaders,
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*;",
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      },
    },
    define: {
      global: 'globalThis',
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '0.1.0'),
      __DEBUG__: JSON.stringify(env.VITE_DEBUG === 'true'),
    },
    resolve: {
      alias: {
        global: 'globalThis',
      }
    },
    envPrefix: 'VITE_',
    // Strip console.log in production (keep console.error/warn)
    esbuild: {
      pure: mode === 'production' ? ['console.log'] : [],
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom']
          }
        }
      }
    }
  }
})

