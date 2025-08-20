import { describe, test, expect, vi } from 'vitest';
import { Validator } from '../../src/core/validator';
import type { GitHubClient } from '../../src/github/client';
import type { GeminiClient } from '../../src/ai/gemini-client';

describe('Integration: Complete Validation Workflow', () => {
  describe('End-to-End Validation Flow', () => {
    test('should complete full validation workflow successfully', async () => {
      // Arrange - Create mock clients that implement the expected interfaces
      const mockPRData = {
        number: 1,
        title: 'feat(auth): add OAuth2 integration',
        body: 'This PR implements OAuth2 authentication for better user security.',
        commits: [
          {
            sha: 'abc123def456',
            message:
              'feat(auth): add OAuth2 integration\n\nImplement secure authentication flow',
            author: {
              name: 'Contributor',
              email: 'contributor@example.com',
              date: '2025-01-01T00:00:00Z',
            },
          },
        ],
        files: [
          {
            filename: 'src/auth/oauth.ts',
            status: 'added',
            additions: 45,
            deletions: 0,
            changes: 45,
            patch:
              '@@ -0,0 +45,45 @@\n+export class OAuth2Provider {\n+  // Implementation\n+}',
          },
        ],
        diffStats: {
          totalAdditions: 45,
          totalDeletions: 0,
          totalChanges: 45,
          filesChanged: 1,
        },
      };

      const mockGitHubClient = {
        extractPRData: vi.fn().mockResolvedValue(mockPRData),
        createComment: vi.fn().mockResolvedValue({
          id: 789012,
          html_url: 'https://github.com/owner/repo/pull/1#issuecomment-789012',
        }),
        createCommitStatus: vi.fn().mockResolvedValue({
          id: 345678,
          state: 'success',
          description: 'Validation completed successfully',
        }),
      } as unknown as GitHubClient;

      const mockGeminiClient = {
        generateValidationPrompt: vi.fn().mockReturnValue('validation prompt'),
        validateContent: vi.fn().mockResolvedValue({
          valid: true,
          suggestions: [
            'Consider adding unit tests for the new OAuth2 provider',
          ],
        }),
      } as unknown as GeminiClient;

      const config = {
        githubToken: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz123456',
        geminiApiKey: 'gemini_test_key_67890',
        guidelinesFile: 'CONTRIBUTING.md',
      };

      const validator = new Validator(
        config,
        mockGitHubClient,
        mockGeminiClient
      );

      // Act
      const result = await validator.validate('owner', 'repo', 1);

      // Assert
      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]).toContain('unit tests');

      // Verify workflow orchestration
      expect(mockGitHubClient.extractPRData).toHaveBeenCalledWith(
        'owner',
        'repo',
        1
      );
      expect(mockGeminiClient.generateValidationPrompt).toHaveBeenCalled();
      expect(mockGeminiClient.validateContent).toHaveBeenCalled();
    });

    test('should handle PR opened event workflow', async () => {
      // Arrange - Mock a PR opened scenario with different data
      const mockPRData = {
        number: 2,
        title: 'fix(api): resolve rate limit handling',
        body: 'This PR fixes the rate limit handling in the API client.',
        commits: [
          {
            sha: 'def456ghi789',
            message:
              'fix(api): resolve rate limit handling\n\nAdd exponential backoff',
            author: {
              name: 'Developer',
              email: 'dev@example.com',
              date: '2025-01-02T00:00:00Z',
            },
          },
        ],
        files: [
          {
            filename: 'src/api/client.ts',
            status: 'modified',
            additions: 12,
            deletions: 5,
            changes: 17,
          },
        ],
        diffStats: {
          totalAdditions: 12,
          totalDeletions: 5,
          totalChanges: 17,
          filesChanged: 1,
        },
      };

      const mockGitHubClient = {
        extractPRData: vi.fn().mockResolvedValue(mockPRData),
        createComment: vi.fn().mockResolvedValue({
          id: 789013,
          html_url: 'https://github.com/owner/repo/pull/2#issuecomment-789013',
        }),
        createCommitStatus: vi.fn().mockResolvedValue({
          id: 345679,
          state: 'success',
        }),
      } as unknown as GitHubClient;

      const mockGeminiClient = {
        generateValidationPrompt: vi
          .fn()
          .mockReturnValue('validation prompt for fix'),
        validateContent: vi.fn().mockResolvedValue({
          valid: true,
          suggestions: [],
        }),
      } as unknown as GeminiClient;

      const config = {
        githubToken: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz123456',
        geminiApiKey: 'gemini_test_key_67890',
        guidelinesFile: 'CONTRIBUTING.md',
      };

      const validator = new Validator(
        config,
        mockGitHubClient,
        mockGeminiClient
      );

      // Act - simulate PR opened event
      const result = await validator.validate('owner', 'repo', 2);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.suggestions).toHaveLength(0);

      // Verify that the GitHub client was called with the correct parameters
      expect(mockGitHubClient.extractPRData).toHaveBeenCalledWith(
        'owner',
        'repo',
        2
      );
      expect(mockGeminiClient.generateValidationPrompt).toHaveBeenCalled();
      expect(mockGeminiClient.validateContent).toHaveBeenCalled();
    });
  });
});
