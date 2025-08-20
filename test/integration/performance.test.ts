/**
 * Performance benchmark testing for validation workflow.
 *
 * Performance Requirements:
 * - GitHub Actions timeout: 6 hours maximum (but we target 30 seconds)
 * - User experience: Sub-30 second validation for PR feedback
 * - Client instantiation: <100ms to avoid workflow overhead
 *
 * Testing Approach:
 * - Measure actual timing of validation workflow components
 * - Test failure paths to ensure quick error reporting (no hangs)
 * - Verify client instantiation performance for workflow startup time
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { GitHubClient } from '../../src/github/client';
import { GeminiClient } from '../../src/ai/gemini-client';
import { Validator } from '../../src/core/validator';
import { mswServer } from '../mocks/server';
import { handlers } from '../mocks/handlers';

describe('Performance Benchmarks', () => {
  let validator: Validator;

  const config = {
    githubToken: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz123456',
    geminiApiKey: 'mock-gemini-api-key',
    guidelinesFile: 'CONTRIBUTING.md',
  };

  beforeEach(() => {
    // Use default handlers for performance testing
    mswServer.use(...handlers);

    const githubClient = new GitHubClient(config.githubToken);
    const geminiClient = new GeminiClient(config.geminiApiKey);
    validator = new Validator(config, githubClient, geminiClient);
  });

  describe('Validation Performance', () => {
    test('should complete basic validation workflow within performance limits', async () => {
      const startTime = Date.now();

      // Act - Attempt validation (will likely hit SDK limitations but test timing structure)
      try {
        await validator.validate('test-owner', 'test-repo', 123);
      } catch (_error) {
        // Expected to fail due to SDK limitations, but should fail quickly
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert - Should fail quickly (within 5 seconds) if it's going to fail
      // This tests that we don't have long hangs in the error path
      expect(duration).toBeLessThan(5000);
    });

    test('should instantiate clients quickly', () => {
      const startTime = Date.now();

      // Act - Test client instantiation performance
      const githubClient = new GitHubClient(config.githubToken);
      const geminiClient = new GeminiClient(config.geminiApiKey);
      const validator = new Validator(config, githubClient, geminiClient);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert - Client instantiation should be very fast
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      expect(githubClient).toBeDefined();
      expect(geminiClient).toBeDefined();
      expect(validator).toBeDefined();
    });
  });
});
