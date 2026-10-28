import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    // The in-memory MongoDB binary is downloaded on the first run, which can take a while.
    hookTimeout: 120_000,
  },
});
