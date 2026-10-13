module.exports = {
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/tests/unit/storage/**/*.test.ts', '**/tests/unit/clipboard/**/*.test.ts', '**/tests/unit/ipc/**/*.test.ts'],
    },
    {
      displayName: 'jsdom',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['**/tests/unit/renderer/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['@testing-library/jest-dom'],
    },
  ],
};
