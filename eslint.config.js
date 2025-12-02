import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      // Import 순서 (DEV_GUIDE.md 189-209행)
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'type',
          ],
          pathGroups: [
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: '@/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // 네이밍 컨벤션 (DEV_GUIDE.md 56-97행)
      '@typescript-eslint/naming-convention': [
        'warn',
        // 변수: camelCase, UPPER_CASE, PascalCase 허용
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
        // 함수: camelCase, PascalCase (컴포넌트) 허용
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        // 타입/인터페이스: PascalCase
        { selector: 'typeLike', format: ['PascalCase'] },
        // Enum 멤버: PascalCase, UPPER_CASE 허용
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
      ],

      // type-only imports 강제
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
        },
      ],
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/naming-convention': 'off',
    },
  },
])
