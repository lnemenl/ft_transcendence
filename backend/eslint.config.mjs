import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier';

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
      // robust rule for handling unused variables
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // If we need more rules, we put them here
      //"no-console": "warn",
    },
  },

  // Prettier Integration (must be last)
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {},
        {
          usePrettierrc: true,
          fileInfoOptions: {
            configPath: './prettier.config.ts',
            ignorePath: './.config/prettier/prettieringnore',
          },
        },
      ],
    },
  },
]);
