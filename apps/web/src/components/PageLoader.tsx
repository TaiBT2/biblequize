/**
 * Route-level Suspense fallback shown while a lazy-loaded page chunk downloads.
 * Kept minimal + token-based to avoid layout shift (CLS). `fullScreen` centers
 * over the whole viewport (full-screen routes: gameplay/auth); the default
 * variant fills the layout content area so the AppLayout/AdminLayout chrome
 * (nav/sidebar) stays visible during the chunk fetch.
 */
export default function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      data-testid="page-loader"
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex items-center justify-center ${
        fullScreen ? 'min-h-screen bg-bq-paper' : 'min-h-[40vh]'
      }`}
    >
      <span
        aria-hidden
        className="h-8 w-8 rounded-full border-2 border-bq-hair border-t-bq-amberd animate-spin"
      />
      <span className="sr-only">Đang tải…</span>
    </div>
  )
}
