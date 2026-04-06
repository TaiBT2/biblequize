// Globals
global.__DEV__ = true

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}))

// Mock Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn() }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }) => children,
}))

// Mock Safe Area
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Mock Haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}))

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
  setNotificationHandler: jest.fn(),
}))

// Mock expo-constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        googleAndroidClientId: 'mock-android-id',
        googleWebClientId: 'mock-web-id',
        googleIosClientId: 'mock-ios-id',
      },
    },
  },
}))

// Mock Google Sign-In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ data: { idToken: 'mock-token' } })),
    signOut: jest.fn(() => Promise.resolve()),
  },
  isSuccessResponse: jest.fn((r) => !!r?.data),
  isErrorWithCode: jest.fn(() => false),
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}))

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  return {
    default: {
      call: () => {},
    },
    useSharedValue: jest.fn((v) => ({ value: v })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((v) => v),
    withSpring: jest.fn((v) => v),
    withRepeat: jest.fn((v) => v),
    Easing: { linear: jest.fn() },
  }
})

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}))
