import 'dotenv/config'
import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'BibleQuiz',
  slug: 'biblequiz-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  scheme: 'biblequiz',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain' as const,
    backgroundColor: '#11131e',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.biblequiz.mobile',
    infoPlist: {
      NSCameraUsageDescription: 'BibleQuiz uses the camera for profile photos.',
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    package: 'com.biblequiz.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#11131e',
    },
    edgeToEdgeEnabled: true,
    permissions: ['RECEIVE_BOOT_COMPLETED', 'VIBRATE'],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    ['expo-notifications', { icon: './assets/icon.png', color: '#e8a832' }],
    'expo-font',
    'expo-web-browser',
    '@react-native-google-signin/google-signin',
  ],
  extra: {
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
    eas: {
      projectId: 'biblequiz-mobile',
    },
  },
})
