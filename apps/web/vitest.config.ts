import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    pool: 'threads',
  },
  define: {
    __APP_VERSION__: JSON.stringify('0.1.0-test'),
    __DEBUG__: JSON.stringify(false),
  },
})
