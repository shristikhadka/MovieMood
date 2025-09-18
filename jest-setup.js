import '@testing-library/jest-native/extend-expect';

// Mock Expo modules that aren't available in test environment
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      EXPO_PUBLIC_GEMINI_API_KEY: 'test-key',
      EXPO_PUBLIC_OPENWEATHER_API_KEY: 'test-key',
      EXPO_PUBLIC_MOVIE_API_KEY: 'test-key',
    },
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => 
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
    })
  ),
  reverseGeocodeAsync: jest.fn(() =>
    Promise.resolve([
      {
        city: 'San Francisco',
        country: 'United States',
      },
    ])
  ),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock performance API for transaction IDs
global.performance = {
  now: jest.fn(() => Date.now()),
};

// Silence console warnings during tests
const originalConsoleWarn = console.warn;
console.warn = (message) => {
  if (
    message.includes('Animated:') ||
    message.includes('VirtualizedLists') ||
    message.includes('componentWillReceiveProps')
  ) {
    return;
  }
  originalConsoleWarn(message);
};