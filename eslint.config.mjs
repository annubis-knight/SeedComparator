import tseslint from 'typescript-eslint'
import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

const tsRuleOverrides = {
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  '@typescript-eslint/ban-ts-comment': 'off',
  'no-console': 'off',
}

const vueRuleOverrides = {
  'vue/multi-word-component-names': 'off',
  'vue/html-self-closing': 'off',
  'vue/max-attributes-per-line': 'off',
  'vue/singleline-html-element-content-newline': 'off',
  'vue/html-closing-bracket-newline': 'off',
  'vue/attributes-order': 'off',
  'vue/first-attribute-linebreak': 'off',
  'vue/html-indent': 'off',
  'vue/multiline-html-element-content-newline': 'off',
  'vue/singleline-html-element-content-newline': 'off',
  'vue/require-default-prop': 'off',
  'no-console': 'off',
}

export default [
  {
    ignores: [
      'node_modules',
      '.nuxt',
      '.output',
      'dist',
      'dist-electron',
      'prisma/migrations',
      'tests/setup',
    ],
  },

  // TypeScript files (.ts)
  ...tseslint.configs.recommended.map((cfg) => ({
    ...cfg,
    files: ['**/*.ts'],
    rules: {
      ...(cfg.rules ?? {}),
      ...tsRuleOverrides,
    },
  })),

  // Vue files (.vue)
  ...vuePlugin.configs['flat/recommended'].map((cfg) => ({
    ...cfg,
    files: ['**/*.vue'],
  })),
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...vueRuleOverrides,
      ...tsRuleOverrides,
    },
  },
]
