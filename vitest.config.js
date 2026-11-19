// Vitest configuration
// Docs: https://vitest.dev/config/
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only look for tests in the "tests" folder.
    // (This keeps Vitest from accidentally running Cypress tests later.)
    include: ['tests/**/*.test.js'],

    // Our tests read files from disk and parse them with JSDOM ourselves,
    // so a plain Node environment is all we need.
    environment: 'node',
  },
});
