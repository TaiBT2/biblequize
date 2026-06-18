import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'org.forbible.app',
  appName: 'BibleQuiz',
  webDir: 'dist',
  // androidScheme 'https' makes the app origin `https://localhost`, which keeps
  // `Secure` cookies and modern web APIs working inside the WebView.
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Route native fetch/XHR through the native HTTP layer so cross-origin
    // calls to the API (https://be.forbible.org) bypass browser CORS entirely.
    // See MOB-0b: mobile auth uses token-in-body, no cookies needed.
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#11131e',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
}

export default config
