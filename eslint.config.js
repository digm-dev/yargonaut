import path from 'node:path'
import { fileURLToPath } from 'node:url'
import neverthrowPlugin from 'eslint-plugin-neverthrow-must-use'
import markdownPlugin from 'eslint-plugin-markdown'
import htmlPlugin from 'eslint-plugin-html'
import * as tseslint from 'typescript-eslint'

// Calculate __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Base TypeScript config with type checking
const typescriptConfig = tseslint.config(
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      neverthrow: neverthrowPlugin
    },
    rules: {
      // Only enable the neverthrow rule - let Biome handle everything else
      'neverthrow/must-use-result': 'error'
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    }
  }
)

// TypeScript config without type checking (for Markdown code blocks)
const typescriptWithoutTypeCheckingConfig = tseslint.config(
  tseslint.configs.disableTypeChecked,
  {
    files: ['**/*.md/**/*.ts'],
    rules: {
      // Disable TypeScript-specific rules for code examples
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Disable other rules that might cause issues in examples
      'no-undef': 'off',
      'no-console': 'off',
      'import/no-unresolved': 'off'
    }
  }
)

export default [
  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**'
    ]
  },

  // TypeScript files with type checking
  ...typescriptConfig,

  // Markdown files configuration
  {
    files: ['**/*.md'],
    plugins: {
      markdown: markdownPlugin
    },
    processor: 'markdown/markdown'
  },

  // JavaScript code blocks in markdown
  {
    files: ['**/*.md/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true
        }
      }
    },
    rules: {
      // Relax rules for code examples in markdown
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-console': 'off',
      'import/no-unresolved': 'off'
    }
  },
  
  // TypeScript code blocks in markdown (without type checking)
  ...typescriptWithoutTypeCheckingConfig,

  // HTML files configuration
  {
    files: ['**/*.html'],
    plugins: {
      html: htmlPlugin
    },
    processor: 'html/html'
  }
]
