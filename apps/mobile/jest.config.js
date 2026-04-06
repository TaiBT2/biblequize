module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|react-native-svg|expo|expo-.*|@expo|@stomp|zustand|@tanstack|@testing-library)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/logic/**/*.ts',
    'src/hooks/**/*.ts',
    'src/components/**/*.tsx',
    'src/screens/**/*.tsx',
    '!src/**/*.test.*',
    '!src/**/*.snapshot.*',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
}
