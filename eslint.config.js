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
          message: 'Use src/shared/lib/browserStorage.ts so unavailable or quota-blocked storage cannot break editing.',
        },
        {
          name: 'sessionStorage',
          message: 'Use a storage adapter so unavailable or quota-blocked storage cannot break editing.',
        },
        {
          name: 'alert',
          message: 'Use app-owned dialog components instead of browser alert().',
        },
        {
          name: 'prompt',
          message: 'Use the app prompt flow instead of browser prompt().',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'globalThis',
          property: 'localStorage',
          message: 'Use src/shared/lib/browserStorage.ts for safe storage access.',
        },
        {
          object: 'globalThis',
          property: 'sessionStorage',
          message: 'Use a storage adapter for safe storage access.',
        },
        {
          object: 'window',
          property: 'localStorage',
          message: 'Use src/shared/lib/browserStorage.ts for safe storage access.',
        },
        {
          object: 'window',
          property: 'sessionStorage',
          message: 'Use a storage adapter for safe storage access.',
        },
        {
          object: 'window',
          property: 'alert',
          message: 'Use app-owned dialog components instead of browser alert().',
        },
        {
          object: 'window',
          property: 'confirm',
          message: 'Use app-owned confirm flow instead of browser confirm().',
        },
        {
          object: 'window',
          property: 'prompt',
          message: 'Use the app prompt flow instead of browser prompt().',
        },
      ],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "TSAsExpression[typeAnnotation.type='TSNeverKeyword']",
          message: 'Route json-document path/value casts through src/shared/lib/dictOps.ts instead of using `as never` at call sites.',
        },
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Do not inject raw HTML in spreadsheet UI. Model rich content explicitly.',
        },
        {
          selector: "MemberExpression[property.name=/^(innerHTML|outerHTML)$/]",
          message: 'Do not write raw HTML in spreadsheet UI. Model rich content explicitly.',
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: 'Do not inject raw HTML in spreadsheet UI. Model rich content explicitly.',
        },
        {
          selector: "CallExpression[callee.object.name='document'][callee.property.name='write']",
          message: 'Do not use document.write in app code.',
        },
      ],
    },
  },
  {
    files: ['src/shared/lib/dictOps.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['src/shared/lib/browserStorage.ts', '**/*.test.ts', 'src/shared/testing/test-utils.ts'],
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-properties': 'off',
    },
  },
])
