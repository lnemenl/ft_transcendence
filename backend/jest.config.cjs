require('dotenv').config({ path: '.env.test' });

const isCI = process.env.CI === 'true';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: ".",

  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { tsconfig: 'tsconfig.test.json' }
    ],
  },

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!tests/**/*.test.ts',
    '!**/node_modules/**'
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

  // Remove setupFilesAfterEnv
  setupFilesAfterEnv: [],

  clearMocks: true,
  testTimeout: 10000,
};
