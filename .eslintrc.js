module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
  },
  overrides: [
    {
      // Frontend specific rules
      files: ['packages/brainsait-frontend/**/*'],
      extends: [
        'next/core-web-vitals',
        'plugin:@typescript-eslint/recommended',
      ],
      env: {
        browser: true,
        node: true,
        es2022: true,
      },
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react-hooks/exhaustive-deps': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'jsx-a11y/alt-text': 'error',
        'jsx-a11y/anchor-is-valid': 'error',
      },
    },
    {
      // Backend specific rules
      files: ['packages/brainsait-backend/**/*', 'packages/brainsait-docs/**/*'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        'no-console': 'off', // Allow console in backend
        '@typescript-eslint/no-var-requires': 'warn',
      },
    },
    {
      // Shared package rules
      files: ['packages/brainsait-shared/**/*'],
      rules: {
        'no-console': 'error', // No console in shared code
        '@typescript-eslint/explicit-function-return-type': 'error',
      },
    },
    {
      // Test files
      files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'coverage/',
    '*.config.js',
    '*.config.ts',
  ],
};