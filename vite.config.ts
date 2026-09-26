import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    target: 'es2022',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    // Soak runs (autopilot through generated worlds) only when SOAK=1.
    exclude: process.env.SOAK ? [] : ['tests/**/*.scratch.test.ts'],
    environment: 'node',
    testTimeout: 120000,
  },
});
