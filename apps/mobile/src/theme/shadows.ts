import { Platform } from 'react-native'

// Tinted shadows using #0b0e18 (not pure black) per design rules
export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#0b0e18',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
  }),

  md: Platform.select({
    ios: {
      shadowColor: '#0b0e18',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
    },
    android: {
      elevation: 4,
    },
  }),

  lg: Platform.select({
    ios: {
      shadowColor: '#0b0e18',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
  }),

  gold: Platform.select({
    ios: {
      shadowColor: '#e8a832',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
    },
    android: {
      elevation: 6,
    },
  }),
} as const
