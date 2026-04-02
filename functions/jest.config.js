module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^firebase-admin/firestore$': '<rootDir>/src/__tests__/__mocks__/firebase-admin-firestore.ts',
    '^firebase-functions/v2/https$': '<rootDir>/src/__tests__/__mocks__/firebase-functions-https.ts',
    '^firebase-functions/v2/scheduler$': '<rootDir>/src/__tests__/__mocks__/firebase-functions-scheduler.ts',
  },
}
