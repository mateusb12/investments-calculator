import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import noCommentsPlugin from './eslint-plugin-no-comments.js';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      prettierConfig,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      prettier: prettier,
      'no-comments': noCommentsPlugin,
    },
    rules: {
      'no-comments/no-explanatory-comments': 'warn',

      'prettier/prettier': 'error',

      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },

    ignores: ['eslint-plugin-no-comments.js'],
  },
]);
