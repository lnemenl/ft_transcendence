/* eslint-disable @typescript-eslint/no-require-imports */

require('dotenv').config({ path: '.env.test' });

const isCI = process.env.CI === 'true';

module.exports = {
  // Tell Jest to run tests using the "projects" defined below
  projects: ['<rootDir>/jest.config.unit.cjs', '<rootDir>/jest.config.e2e.cjs'],

  // Global settings (like coverage) can live here
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
