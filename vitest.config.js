import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/test-*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'tests/raw-pg-test.js', // Exclude raw PostgreSQL tests
      'tests/implementation-analysis.md'
    ],
    setupFiles: ['./tests/setup.js'],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'coverage/',
        'drizzle/',
        'config/'
      ]
    }
  }
});
