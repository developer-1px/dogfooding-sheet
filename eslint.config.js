import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '**/dist/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-console': 'error',
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message: 'Use src/lib/browserStorage.ts so unavailable or quota-blocked storage cannot break editing.',
        },
        {
          name: 'sessionStorage',
          message: 'Use a storage adapter so unavailable or quota-blocked storage cannot break editing.',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'globalThis',
          property: 'localStorage',
          message: 'Use src/lib/browserStorage.ts for safe storage access.',
        },
        {
          object: 'globalThis',
          property: 'sessionStorage',
          message: 'Use a storage adapter for safe storage access.',
        },
        {
          object: 'window',
          property: 'localStorage',
          message: 'Use src/lib/browserStorage.ts for safe storage access.',
        },
        {
          object: 'window',
          property: 'sessionStorage',
          message: 'Use a storage adapter for safe storage access.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "TSAsExpression[typeAnnotation.type='TSNeverKeyword']",
          message: 'Route zod-crud path/value casts through src/lib/dictOps.ts instead of using `as never` at call sites.',
        },
      ],
    },
  },
  {
    files: ['src/lib/dictOps.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['src/lib/browserStorage.ts', '**/*.test.ts', 'src/sheet/test-utils.ts'],
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-properties': 'off',
    },
  },
])
