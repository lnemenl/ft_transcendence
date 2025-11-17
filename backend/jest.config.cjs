/* eslint-disable @typescript-eslint/no-require-imports */

require('dotenv').config({ path: '.env.test' });

const isCI = process.env.CI === 'true';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/routes/**/*.test.ts',
    '<rootDir>/tests/plugins/**/*.test.ts',
    '<rootDir>/tests/services/**/*.test.ts',
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },

  // Use the E2E setup file for all tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  clearMocks: true,
  testTimeout: 10000,

  // Global settings
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/types/**/*.ts',
    '!src/utils/prisma.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: isCI
    ? {}
    : {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
};
