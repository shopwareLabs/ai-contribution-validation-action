/**
 * Vitest setup file for test environment configuration
 */

import { vi } from 'vitest';
import { setupMswServer } from './mocks/server';

// Setup MSW server for all tests
setupMswServer();

// Mock environment variables for testing
process.env['GITHUB_REPOSITORY'] = 'test-owner/test-repo';
process.env['GITHUB_TOKEN'] = 'mock-github-token';
process.env['GEMINI_API_KEY'] = 'mock-gemini-api-key';

// Mock console methods to reduce noise in tests
const originalConsole = console;
beforeAll(() => {
  console.log = vi.fn();
  console.info = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});
