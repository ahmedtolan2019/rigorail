import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
export default tseslint.config(
  { ignores: ['dist', 'coverage', 'test-results', 'playwright-report'] },
  { files: ['**/*.{ts,tsx}'], extends: [js.configs.recommended, ...tseslint.configs.recommended], languageOptions: { globals: { ...globals.browser, ...globals.node } }, plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh }, rules: { 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error', 'react-refresh/only-export-components': ['error', { allowConstantExport: true }] } },
  // Registry primitives and the data-table kit deliberately export variants, hooks and column helpers alongside components.
  { files: ['src/shared/ui/**/*.tsx', 'src/shared/data-table/**/*.tsx'], rules: { 'react-refresh/only-export-components': 'off' } },
)
