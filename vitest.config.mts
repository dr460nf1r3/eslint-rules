import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: import.meta.dirname,
    environment: 'node',
    globals: true,
    include: ['tests/**/*.spec.ts', 'tests/**/spec.ts'],
    setupFiles: ['tests/setup.ts'],
  },
});
