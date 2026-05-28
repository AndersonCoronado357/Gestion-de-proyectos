module.exports = {
  env: { browser: true, es2022: true, jest: true },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  },
  settings: { react: { version: 'detect' } }
};
