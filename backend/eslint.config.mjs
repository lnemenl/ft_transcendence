// Minimal ESLint config for Node + TypeScript.
// We lint .ts sources only; Prettier runs via npm scripts, not as an ESLint rule.
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  // Block 1: Global Ignores
  {
    ignores: ['dist/', 'node_modules/'],
  },

  // Recommended TypeScript Rules (applied to all .ts files)
  ...tseslint.configs.recommended,

  // Custom Project Configuration
  {
  // Apply these settings to ALL TypeScript files in the project
    files: ['**/*.ts'],

    languageOptions: {
      globals: {
        ...globals.node, // Defines all Node.js global variables
      },
    },

    rules: {
      // Robust rule for unused variables (ignore prefixed by _)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Add more project-specific rules here as needed
      // "no-console": "warn",
    },
  },

  // Prettier Integration (must be last)
  {
    // Temporarily disable Prettier-as-ESLint-rule to avoid loading TS-based Prettier config.
    // Prettier formatting can still be run via `npm run format`.
    rules: {},
  },
]);
