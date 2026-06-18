// Native haptics for the Capacitor target via @capacitor/haptics.
// The plugin is lazy-loaded once and cached; calls are fire-and-forget so the
// existing synchronous haptic API (utils/haptics.ts) stays unchanged.

type HapticsModule = typeof import('@capacitor/haptics')

let modPromise: Promise<HapticsModule> | null = null
function load(): Promise<HapticsModule> {
  if (!modPromise) modPromise = import('@capacitor/haptics')
  return modPromise
}

export function nativeImpact(style: 'Light' | 'Medium' | 'Heavy'): void {
  load()
    .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle[style] }))
    .catch(() => {})
}

export function nativeNotify(type: 'Success' | 'Warning' | 'Error'): void {
  load()
    .then(({ Haptics, NotificationType }) => Haptics.notification({ type: NotificationType[type] }))
    .catch(() => {})
}
