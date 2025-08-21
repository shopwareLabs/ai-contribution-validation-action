/**
 * Validator Orchestrator Tests
 *
 * Tests for the main validation orchestrator that coordinates GitHub and AI clients
 * to validate pull requests against contribution guidelines.
 *
 * Uses dependency injection testing pattern where mocked clients are injected
 * through the constructor, enabling isolated testing of orchestration logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Validator } from '../../src/core/validator';
import type { GitHubClient } from '../../src/github/client';
import type { GeminiClient } from '../../src/ai/gemini-client';

// Mock dependencies to enable isolated testing
vi.mock('../../src/github/client');
vi.mock('../../src/ai/gemini-client');

describe('Validator', () => {
  let mockGitHubClient: GitHubClient;
  let mockGeminiClient: GeminiClient;

  beforeEach(() => {
    // Create mock instances
    mockGitHubClient = {
      extractPRData: vi.fn(),
      createComment: vi.fn(),
      findCommentByIdentifier: vi.fn(),
      updateComment: vi.fn(),
      createCommitStatus: vi.fn(),
    } as unknown as GitHubClient;

    mockGeminiClient = {
      generateValidationPrompt: vi.fn(),
      validateContent: vi.fn(),
    } as unknown as GeminiClient;
  });

  describe('initialization', () => {
    it('should create a validator with required dependencies', () => {
      const config = {
        githubToken: 'ghp_1234567890abcdef1234567890abcdef12345678',
        geminiApiKey: 'test-api-key',
        guidelinesFile: 'CONTRIBUTING.md',
      };

      const validator = new Validator(config);

      expect(validator).toBeInstanceOf(Validator);
    });

    it('should throw error with empty config', () => {
      const config = {
        githubToken: '',
        geminiApiKey: '',
        guidelinesFile: '',
      };

      expect(() => {
        new Validator(config);
      }).toThrow('Invalid configuration');
    });

    it('should accept any non-empty GitHub token format', () => {
      const config = {
        githubToken: 'invalid-token',
        geminiApiKey: 'test-api-key',
        guidelinesFile: 'CONTRIBUTING.md',
      };

      // Token validation is now handled by GitHub API, not client-side
      expect(() => {
        new Validator(config);
      }).not.toThrow('Invalid GitHub token format');
    });

    it('should accept valid GitHub token formats', () => {
      const validTokens = [
        'ghp_1234567890abcdef1234567890abcdef12345678',
        'github_pat_11ABCDEFGH0123456789_abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH',
      ];

      validTokens.forEach(token => {
        const config = {
          githubToken: token,
          geminiApiKey: 'test-api-key',
          guidelinesFile: 'CONTRIBUTING.md',
        };

        expect(() => new Validator(config)).not.toThrow();
      });
    });
  });

  describe('validation workflow', () => {
    it('should have a validate method', () => {
      const config = {
        githubToken: 'ghp_1234567890abcdef1234567890abcdef12345678',
        geminiApiKey: 'test-api-key',
        guidelinesFile: 'CONTRIBUTING.md',
      };

      const validator = new Validator(
        config,
        mockGitHubClient,
        mockGeminiClient
      );

      expect(typeof validator.validate).toBe('function');
    });

    it('should validate a pull request and return validation result', async () => {
      const config = {
        githubToken: 'ghp_1234567890abcdef1234567890abcdef12345678',
        geminiApiKey: 'test-api-key',
        guidelinesFile: 'CONTRIBUTING.md',
      };

      // Setup basic mock responses
      vi.mocked(mockGitHubClient.extractPRData).mockResolvedValue({
        number: 123,
        title: 'Test PR',
        body: 'Test description',
        commits: [],
        files: [],
        diffStats: {
          totalAdditions: 0,
          totalDeletions: 0,
          totalChanges: 0,
          filesChanged: 0,
        },
      });
      vi.mocked(mockGeminiClient.validateContent).mockResolvedValue({
        status: 'PASS',
        issues: [],
        improved_title: '',
        improved_commits: '',
        improved_description: '',
      });

      const validator = new Validator(
        config,
        mockGitHubClient,
        mockGeminiClient
      );

      const result = await validator.validate('owner', 'repo', 123);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('improved_title');
      expect(result).toHaveProperty('improved_commits');
      expect(result).toHaveProperty('improved_description');
      expect(['PASS', 'FAIL', 'WARNINGS']).toContain(result.status);
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should orchestrate full validation workflow with GitHub and Gemini clients', async () => {
      // Setup mock responses
      const mockPRData = {
        number: 123,
        title: 'feat: add new feature',
        body: 'This PR adds a new feature',
        commits: [],
        files: [],
        diffStats: {
          totalAdditions: 10,
          totalDeletions: 5,
          totalChanges: 15,
          filesChanged: 2,
        },
      };

      const mockValidationResult = {
        status: 'FAIL' as const,
        issues: ['Add unit tests', 'Update documentation'],
        improved_title: '',
        improved_commits: '',
        improved_description: '',
      };

      // Configure mocks
      vi.mocked(mockGitHubClient.extractPRData).mockResolvedValue(mockPRData);
      vi.mocked(mockGeminiClient.generateValidationPrompt).mockReturnValue(
        'Generated prompt'
      );
      vi.mocked(mockGeminiClient.validateContent).mockResolvedValue(
        mockValidationResult
      );
      vi.mocked(mockGitHubClient.createCommitStatus).mockResolvedValue({
        id: 1,
        state: 'success',
        description: 'Validation complete',
        context: 'ai-validator',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      });

      const config = {
        githubToken: 'ghp_1234567890abcdef1234567890abcdef12345678',
        geminiApiKey: 'test-api-key',
        guidelinesFile: 'CONTRIBUTING.md',
      };

      const validator = new Validator(
        config,
        mockGitHubClient,
        mockGeminiClient
      );

      const result = await validator.validate('owner', 'repo', 123);

      // Verify client interactions
      expect(mockGitHubClient.extractPRData).toHaveBeenCalledWith(
        'owner',
        'repo',
        123
      );
      expect(mockGeminiClient.generateValidationPrompt).toHaveBeenCalledWith(
        mockPRData,
        'CONTRIBUTING.md'
      );
      expect(mockGeminiClient.validateContent).toHaveBeenCalledWith(
        'Generated prompt'
      );
      // createCommitStatus should no longer be called since debug code was removed
      expect(mockGitHubClient.createCommitStatus).not.toHaveBeenCalled();

      // Verify result
      expect(result).toEqual(mockValidationResult);
    });

    it('should not call createCommitStatus with invalid placeholder values', async () => {
      // This test ensures we don't have debug/test code with hardcoded 'HEAD' and 'Test' values
      const mockPRData = {
        number: 123,
        title: 'Test PR',
        body: 'Test description',
        commits: [
          {
            sha: 'abc123def456',
            message: 'Test commit',
            author: {
              name: 'Test',
              email: 'test@example.com',
              date: '2025-01-01',
            },
          },
        ],
        files: [],
        diffStats: {
          totalAdditions: 0,
          totalDeletions: 0,
          totalChanges: 0,
          filesChanged: 0,
        },
        author: 'testuser',
      };

      const mockValidationResult = {
        status: 'PASS' as const,
        issues: [],
        improved_title: '',
        improved_commits: '',
        improved_description: '',
      };

      vi.mocked(mockGitHubClient.extractPRData).mockResolvedValue(mockPRData);
      vi.mocked(mockGeminiClient.generateValidationPrompt).mockReturnValue(
        'Generated prompt'
      );
      vi.mocked(mockGeminiClient.validateContent).mockResolvedValue(
        mockValidationResult
      );
      vi.mocked(mockGitHubClient.createCommitStatus).mockResolvedValue({
        id: 1,
        state: 'success',
        description: 'Validation complete',
        context: 'ai-validator',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      });

      const config = {
        githubToken: 'ghp_1234567890abcdef1234567890abcdef12345678',
        geminiApiKey: 'test-api-key',
        guidelinesFile: 'CONTRIBUTING.md',
      };

      const validator = new Validator(
        config,
        mockGitHubClient,
        mockGeminiClient
      );
      await validator.validate('owner', 'repo', 123);

      // Ensure createCommitStatus is NOT called with invalid placeholder values
      expect(mockGitHubClient.createCommitStatus).not.toHaveBeenCalledWith(
        'owner',
        'repo',
        'HEAD',
        'success',
        'Test',
        'ai-validator'
      );
    });
  });

  describe('validation report structure', () => {
    it('should return complete validation report with all required fields', async () => {
      const config = {
        githubToken: 'ghp_1234567890abcdef1234567890abcdef12345678',
        geminiApiKey: 'test-api-key',
        guidelinesFile: 'CONTRIBUTING.md',
      };

      const mockPRData = {
        number: 123,
        title: 'test PR',
        body: 'test body',
        commits: [],
        files: [],
        diffStats: {
          totalAdditions: 10,
          totalDeletions: 5,
          totalChanges: 15,
          filesChanged: 2,
        },
      };

      vi.mocked(mockGitHubClient.extractPRData).mockResolvedValue(mockPRData);
      vi.mocked(mockGeminiClient.generateValidationPrompt).mockReturnValue(
        'test prompt'
      );
      vi.mocked(mockGeminiClient.validateContent).mockResolvedValue({
        status: 'PASS',
        issues: [],
        improved_title: 'better title',
        improved_commits: 'better commits',
        improved_description: 'better description',
      });

      const validator = new Validator(
        config,
        mockGitHubClient,
        mockGeminiClient
      );

      const result = await validator.validate('owner', 'repo', 123);

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('improved_title');
      expect(result).toHaveProperty('improved_commits');
      expect(result).toHaveProperty('improved_description');
      expect(result.improved_title).toBe('better title');
      expect(result.improved_commits).toBe('better commits');
      expect(result.improved_description).toBe('better description');
    });
  });

  describe('fallback validation report', () => {
    it('should return complete validation report even without Gemini client', async () => {
      const config = {
        githubToken: 'ghp_1234567890abcdef1234567890abcdef12345678',
        geminiApiKey: 'test-api-key',
        guidelinesFile: 'CONTRIBUTING.md',
      };

      const mockPRData = {
        number: 123,
        title: 'test PR',
        body: 'test body',
        commits: [],
        files: [],
        diffStats: {
          totalAdditions: 10,
          totalDeletions: 5,
          totalChanges: 15,
          filesChanged: 2,
        },
      };

      vi.mocked(mockGitHubClient.extractPRData).mockResolvedValue(mockPRData);

      // Create validator without Gemini client to test fallback
      const validator = new Validator(
        config,
        mockGitHubClient,
        undefined // No Gemini client - will use fallback
      );

      const result = await validator.validate('owner', 'repo', 123);

      // Should have all required fields even in fallback mode
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('improved_title');
      expect(result).toHaveProperty('improved_commits');
      expect(result).toHaveProperty('improved_description');
      expect(result.improved_title).toBe('');
      expect(result.improved_commits).toBe('');
      expect(result.improved_description).toBe('');
    });
  });

  describe('bot exclusion', () => {
    it('should skip validation for dependabot PRs when configured', async () => {
      const config = {
        githubToken: 'ghp_1234567890abcdef1234567890abcdef12345678',
        geminiApiKey: 'test-api-key',
        guidelinesFile: 'CONTRIBUTING.md',
        skipAuthors: 'dependabot[bot],renovate[bot]',
      };

      const mockPRData = {
        number: 123,
        title: 'chore(deps): bump typescript from 5.0.0 to 5.1.0',
        body: 'Bumps typescript from 5.0.0 to 5.1.0',
        commits: [],
        files: [],
        diffStats: {
          totalAdditions: 10,
          totalDeletions: 5,
          totalChanges: 15,
          filesChanged: 2,
        },
        author: 'dependabot[bot]',
      };

      vi.mocked(mockGitHubClient.extractPRData).mockResolvedValue(mockPRData);

      const validator = new Validator(
        config,
        mockGitHubClient,
        mockGeminiClient
      );

      const result = await validator.validate('owner', 'repo', 123);

      expect(result.status).toBe('PASS');
      expect(result.skipped).toBe(true);
      expect(result.issues).toContain(
        'Validation skipped for automated PR by dependabot[bot]'
      );

      // Should not call AI validation
      expect(mockGeminiClient.generateValidationPrompt).not.toHaveBeenCalled();
      expect(mockGeminiClient.validateContent).not.toHaveBeenCalled();
    });

    it('should validate normally when author not in skip list', async () => {
      const config = {
        githubToken: 'ghp_1234567890abcdef1234567890abcdef12345678',
        geminiApiKey: 'test-api-key',
        guidelinesFile: 'CONTRIBUTING.md',
        skipAuthors: 'dependabot[bot]',
      };

      const mockPRData = {
        number: 123,
        title: 'feat: add new feature',
        body: 'This PR adds a new feature',
        commits: [],
        files: [],
        diffStats: {
          totalAdditions: 10,
          totalDeletions: 5,
          totalChanges: 15,
          filesChanged: 2,
        },
        author: 'human-developer',
      };

      const mockValidationResult = {
        status: 'FAIL' as const,
        issues: ['Add unit tests', 'Update documentation'],
        improved_title: '',
        improved_commits: '',
        improved_description: '',
      };

      vi.mocked(mockGitHubClient.extractPRData).mockResolvedValue(mockPRData);
      vi.mocked(mockGeminiClient.generateValidationPrompt).mockReturnValue(
        'Generated prompt'
      );
      vi.mocked(mockGeminiClient.validateContent).mockResolvedValue(
        mockValidationResult
      );
      vi.mocked(mockGitHubClient.createCommitStatus).mockResolvedValue({
        id: 1,
        state: 'success',
        description: 'Validation complete',
        context: 'ai-validator',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      });

      const validator = new Validator(
        config,
        mockGitHubClient,
        mockGeminiClient
      );

      const result = await validator.validate('owner', 'repo', 123);

      expect(result.skipped).toBeUndefined();
      expect(result).toEqual(mockValidationResult);

      // Should call normal AI validation
      expect(mockGeminiClient.generateValidationPrompt).toHaveBeenCalled();
      expect(mockGeminiClient.validateContent).toHaveBeenCalled();
    });
  });

  describe('timeout handling', () => {
    it(
      'should timeout validation after 30 seconds',
      { timeout: 40000 },
      async () => {
        // Mock GitHub client to return PR data quickly
        vi.mocked(mockGitHubClient.extractPRData).mockResolvedValue({
          number: 123,
          title: 'Test PR',
          body: 'Test description',
          commits: [],
          files: [],
          diffStats: {
            totalAdditions: 0,
            totalDeletions: 0,
            totalChanges: 0,
            filesChanged: 0,
          },
        });

        // Mock Gemini client to take longer than 30 seconds
        vi.mocked(mockGeminiClient.generateValidationPrompt).mockReturnValue(
          'Generated prompt'
        );
        vi.mocked(mockGeminiClient.validateContent).mockImplementation(
          () =>
            new Promise(resolve =>
              global.setTimeout(
                () =>
                  resolve({
                    status: 'PASS' as const,
                    issues: [],
                    improved_title: '',
                    improved_commits: '',
                    improved_description: '',
                  }),
                31000
              )
            ) // 31 second delay - exceeds 30s timeout
        );

        const config = {
          githubToken: 'ghp_1234567890abcdef1234567890abcdef12345678',
          geminiApiKey: 'test-api-key',
          guidelinesFile: 'CONTRIBUTING.md',
        };

        const validator = new Validator(
          config,
          mockGitHubClient,
          mockGeminiClient
        );

        await expect(validator.validate('owner', 'repo', 123)).rejects.toThrow(
          'Validation timeout after 30 seconds'
        );
      }
    );

    it('should complete validation within timeout when operations are fast', async () => {
      // Mock all operations to complete quickly
      vi.mocked(mockGitHubClient.extractPRData).mockResolvedValue({
        number: 123,
        title: 'Test PR',
        body: 'Test description',
        commits: [],
        files: [],
        diffStats: {
          totalAdditions: 0,
          totalDeletions: 0,
          totalChanges: 0,
          filesChanged: 0,
        },
      });
      vi.mocked(mockGeminiClient.generateValidationPrompt).mockReturnValue(
        'Generated prompt'
      );
      vi.mocked(mockGeminiClient.validateContent).mockResolvedValue({
        status: 'PASS' as const,
        issues: ['Looks good!'],
        improved_title: '',
        improved_commits: '',
        improved_description: '',
      });
      vi.mocked(mockGitHubClient.createCommitStatus).mockResolvedValue({
        id: 1,
        state: 'success',
        description: 'Validation complete',
        context: 'ai-validator',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      });

      const config = {
        githubToken: 'ghp_1234567890abcdef1234567890abcdef12345678',
        geminiApiKey: 'test-api-key',
        guidelinesFile: 'CONTRIBUTING.md',
      };

      const validator = new Validator(
        config,
        mockGitHubClient,
        mockGeminiClient
      );

      const result = await validator.validate('owner', 'repo', 123);
      expect(result).toEqual({
        status: 'PASS',
        issues: ['Looks good!'],
        improved_title: '',
        improved_commits: '',
        improved_description: '',
      });
    });

    it('should handle validation without Gemini client (fallback mode)', async () => {
      // Tests graceful degradation when AI service is unavailable. Ensures system
      // continues functioning with reduced functionality rather than complete failure.
      const mockPRData = {
        number: 123,
        title: 'feat: add new feature',
        body: 'This PR adds a new feature',
        commits: [],
        files: [],
        diffStats: {
          totalAdditions: 10,
          totalDeletions: 5,
          totalChanges: 15,
          filesChanged: 2,
        },
      };

      // Configure GitHub client mock
      vi.mocked(mockGitHubClient.extractPRData).mockResolvedValue(mockPRData);
      vi.mocked(mockGitHubClient.createCommitStatus).mockResolvedValue({
        id: 1,
        state: 'success',
        description: 'Test',
        context: 'ai-validator',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      });

      const config = {
        githubToken: 'ghp_1234567890abcdef1234567890abcdef12345678',
        geminiApiKey: 'test-api-key',
        guidelinesFile: 'CONTRIBUTING.md',
      };

      // Create validator without Gemini client (undefined)
      const validator = new Validator(config, mockGitHubClient, undefined);

      const result = await validator.validate('owner', 'repo', 123);

      // Should return fallback response
      expect(result).toEqual({
        status: 'PASS',
        issues: [],
        improved_title: '',
        improved_commits: '',
        improved_description: '',
      });

      // createCommitStatus should not be called since debug code was removed
      expect(mockGitHubClient.createCommitStatus).not.toHaveBeenCalled();
    });

    it('should handle validation without GitHub client (minimal mode)', async () => {
      // Tests absolute minimal mode when no external services are available.
      // Ensures the validator can still return a valid response for system stability.
      const config = {
        githubToken: 'ghp_1234567890abcdef1234567890abcdef12345678',
        geminiApiKey: 'test-api-key',
        guidelinesFile: 'CONTRIBUTING.md',
      };

      // Create validator without both GitHub and Gemini clients
      const validator = new Validator(config, undefined, undefined);

      const result = await validator.validate('owner', 'repo', 123);

      // Should return minimal fallback response
      expect(result).toEqual({
        status: 'PASS',
        issues: [],
        improved_title: '',
        improved_commits: '',
        improved_description: '',
      });
    });
  });
});
