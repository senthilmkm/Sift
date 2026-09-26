module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  modulePathIgnorePatterns: ['<rootDir>/worker/'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/expoMock.js',
    '^expo-sqlite$': '<rootDir>/__mocks__/expoMock.js',
    '^expo-sharing$': '<rootDir>/__mocks__/expoMock.js',
    '^expo-mail-composer$': '<rootDir>/__mocks__/expoMock.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expoMock.js',
  }
};
