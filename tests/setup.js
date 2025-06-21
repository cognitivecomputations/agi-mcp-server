import 'dotenv/config';

// Global test setup for Vitest
// This file is run before all tests

// Set test environment variables if needed
process.env.NODE_ENV = 'test';

// Global test utilities
global.testTimeout = 60000;

// Cleanup function for database connections
global.cleanupConnections = async () => {
  // This will be called after each test suite
  await new Promise(resolve => setTimeout(resolve, 100));
};

// Global error handler for unhandled rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
});
