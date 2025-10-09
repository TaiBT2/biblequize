import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true, // Allow external connections
      proxy: {
        // Proxy API requests to backend
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true
        }
      }
    },
    define: {
      global: 'globalThis',
      // Expose env variables to the client
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '0.1.0'),
      __DEBUG__: JSON.stringify(env.VITE_DEBUG === 'true'),
    },
    resolve: {
      alias: {
        global: 'globalThis',
      }
    },
    // Environment variables
    envPrefix: 'VITE_',
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
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

