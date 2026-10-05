import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import plugin from './src/index.js';

/** The repository lints itself with its strictest preset, straight from source. */
export default defineConfig(
  { ignores: ['dist/**', 'coverage/**', 'docs/**', 'tests/**/fixtures/**'] },
  tseslint.configs.recommended,
  plugin.configs.full,
  plugin.configs['type-checked'],
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
);
