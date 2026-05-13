// ESLint 8.x legacy config. Initial setup 2026-05-13 (CQ-4).
// Rules are deliberately conservative — most flag warnings, not errors,
// so existing code surfaces issues without blocking commits. Tighten as
// the codebase catches up (see CQ-5, CQ-6).
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist',
    'node_modules',
    'coverage',
    'playwright-report',
    'test-results',
    'tests', // Playwright e2e — separate config later if needed
    'scripts', // node scripts, not lint scope
    '.eslintrc.cjs',
    'vite.config.ts',
    'vitest.config.ts',
    'tailwind.config.js',
    'postcss.config.js',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react-refresh'],
  rules: {
    // Type safety — CQ-5/CQ-6 will fix remaining hits
    '@typescript-eslint/no-explicit-any': 'warn',

    // Let TypeScript handle unused vars (project has noUnusedLocals=false)
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'off',

    // Allow {} object type — used widely
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/ban-types': 'off',

    // Hooks discipline
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Console hygiene — allow warn/error (used in interceptors + ErrorBoundary)
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // Vite HMR safety — only export components from .tsx files
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    // TS handles undef
    'no-undef': 'off',

    // Intentional `try {…} catch {}` swallow pattern is used for non-critical
    // operations (localStorage, optional vibrate, etc.). Downgrade to warn so
    // CI surfaces accidental empty blocks without blocking the silent-catch idiom.
    'no-empty': ['warn', { allowEmptyCatch: true }],

    // Allow ts-expect-error / ts-ignore with comment (current codebase uses 1×)
    '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-ignore': 'allow-with-description' }],
  },
}
