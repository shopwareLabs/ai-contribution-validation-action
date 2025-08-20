/**
 * MSW server setup for testing.
 *
 * Design Pattern: Test isolation with proper cleanup
 * - beforeAll(): Start MSW server with unhandled request warnings
 * - afterEach(): Reset handlers to prevent test interference
 * - afterAll(): Clean shutdown to avoid resource leaks
 *
 * This pattern ensures each test runs with a clean handler state while
 * maintaining server lifecycle management across the test suite.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server with default handlers
export const server = setupServer(...handlers);

/**
 * Utility function for consistent MSW server lifecycle management.
 * Call this in test suites that need API mocking to ensure proper setup and cleanup.
 */
export const setupMswServer = (): void => {
  // Start server before all tests
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: 'warn', // Warn about unhandled requests
    });
  });

  // Reset handlers after each test
  afterEach(() => {
    server.resetHandlers();
  });

  // Clean up after all tests
  afterAll(() => {
    server.close();
  });
};

export { server as mswServer };
