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
        // Dev server needs unsafe-inline for Vite HMR inline scripts
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*;",
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
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*;",
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
          // Split shared deps out of the entry monolith so it parses faster and
          // each group caches independently (a code change won't bust the React
          // runtime or the translation bundles). Lazy route chunks are emitted
          // automatically by the React.lazy() imports in main.tsx.
          manualChunks(id) {
            // Translation JSON (vi 143kB + en 127kB) — eager via i18n init, but
            // kept out of the entry JS and cached on its own (rarely changes).
            if (id.includes('/src/i18n/') && id.endsWith('.json')) return 'locales'
            if (id.includes('node_modules')) {
              if (id.includes('react-router')) return 'router'
              if (/[\\/]react(-dom)?[\\/]|[\\/]scheduler[\\/]/.test(id)) return 'react-vendor'
              if (id.includes('@tanstack')) return 'query'
              if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n-vendor'
              // Realtime libs are only imported by lazy multiplayer/room pages,
              // so this chunk loads on demand with them — never on first paint.
              if (id.includes('@stomp') || id.includes('sockjs')) return 'realtime'
              return 'vendor'
            }
          }
        }
      }
    }
  }
})

