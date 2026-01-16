import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // ← VERY IMPORTANT
    globals: true,        // optional: allows using expect, describe without imports
    setupFiles: [],       // optional: if you have global mocks
    reporters: 'default', // avoid broken reporter
    include: ['src/**/*.test.{ts,tsx}'], // ensure Vitest sees your tests
  },
});
