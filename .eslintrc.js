module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // This must be the last item to override other configs
  ],
  env: {
    node: true, // This enables Node.js global variables
  },
  rules: {
    // You can add custom rules here if you want
  },
};
