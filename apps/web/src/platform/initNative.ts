// One-time native shell setup for the Capacitor (mobile) target.
// Called from main.tsx; a no-op on web. Failures are swallowed so a missing
// plugin never blocks app startup.

import { isCapacitor } from './capacitor'

export function initNative(): void {
  if (!isCapacitor()) return

  // Marker class for native-only CSS (overscroll/text-select tweaks).
  document.documentElement.classList.add('capacitor')

  // Status bar: dark app chrome (#11131e) with light icons, not overlaying
  // the WebView so content starts below it (top bar still adds safe-area pad).
  import('@capacitor/status-bar')
    .then(({ StatusBar, Style }) => {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {})
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
      StatusBar.setBackgroundColor({ color: '#11131e' }).catch(() => {})
    })
    .catch(() => {})

  // Resize the WebView when the keyboard opens so inputs stay visible.
  import('@capacitor/keyboard')
    .then(({ Keyboard, KeyboardResize }) => {
      Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {})
    })
    .catch(() => {})

  // Hide the splash screen once the web app has booted.
  import('@capacitor/splash-screen')
    .then(({ SplashScreen }) => {
      SplashScreen.hide().catch(() => {})
    })
    .catch(() => {})
}
