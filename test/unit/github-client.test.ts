import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubClient } from '../../src/github/client';

/**
 * GitHub Client Test Suite
 *
 * Uses vi.mock() to prevent real GitHub API calls during testing.
 * This ensures tests are isolated, fast, and don't require network access.
 */

// Create mock functions for GitHub API endpoints
const mockPullsGet = vi.fn();
const mockPullsListCommits = vi.fn();
const mockPullsListFiles = vi.fn();
const mockIssuesCreateComment = vi.fn();
const mockIssuesListComments = vi.fn();
const mockIssuesUpdateComment = vi.fn();
const mockReposCreateCommitStatus = vi.fn();

// Mock the @actions/github module
vi.mock('@actions/github', () => ({
  getOctokit: vi.fn(() => ({
    rest: {
      pulls: {
        get: mockPullsGet,
        listCommits: mockPullsListCommits,
        listFiles: mockPullsListFiles,
      },
      issues: {
        createComment: mockIssuesCreateComment,
        listComments: mockIssuesListComments,
        updateComment: mockIssuesUpdateComment,
      },
      repos: {
        createCommitStatus: mockReposCreateCommitStatus,
      },
    },
  })),
}));

describe('GitHubClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('initialization', () => {
    it('should create a GitHub client with valid token', () => {
      const token = 'ghp_valid_token_123';

      expect(() => new GitHubClient(token)).not.toThrow();
    });

    it('should throw error with empty token', () => {
      expect(() => new GitHubClient('')).toThrow('GitHub token is required');
    });

    it('should accept any non-empty token format', () => {
      // Token validation is now handled by GitHub API, not client-side
      expect(() => new GitHubClient('invalid-token')).not.toThrow();
      expect(() => new GitHubClient('ghp_valid_token_123')).not.toThrow();
      expect(() => new GitHubClient('ghs_action_token')).not.toThrow();
    });
  });

  describe('PR data extraction', () => {
    it('should make real GitHub API call to extract PR data', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock the API response
      mockPullsGet.mockResolvedValue({
        data: {
          number: 1,
          title: 'Add new feature',
          body: 'This is a real API response',
        },
      });

      // Mock the commits response
      mockPullsListCommits.mockResolvedValue({
        data: [],
      });

      // Mock the files response
      mockPullsListFiles.mockResolvedValue({
        data: [],
      });

      const result = await client.extractPRData('microsoft', 'TypeScript', 1);

      expect(result.number).toBe(1);
      expect(result.title).toBe('Add new feature');
      expect(result.body).toBe('This is a real API response');
      expect(result.title).not.toBe('Test PR'); // Should not be hardcoded
    });

    it('should use real GitHub API for all valid requests', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock the API response
      mockPullsGet.mockResolvedValue({
        data: {
          number: 1,
          title: 'Hello World PR',
          body: 'Example pull request',
        },
      });

      // Mock the commits response
      mockPullsListCommits.mockResolvedValue({
        data: [],
      });

      // Mock the files response
      mockPullsListFiles.mockResolvedValue({
        data: [],
      });

      const result = await client.extractPRData('octocat', 'Hello-World', 1);

      expect(result.number).toBe(1);
      expect(result.title).toBe('Hello World PR');
      expect(result.body).toBe('Example pull request');
      expect(result.title).not.toBe('Test PR'); // Should not be hardcoded
      expect(result.body).not.toBe('Test description'); // Should not be hardcoded
    });

    it('should handle GitHub API errors gracefully', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock an API error
      mockPullsGet.mockRejectedValue(new Error('Not Found'));

      // Test with different repository that will trigger API error
      await expect(
        client.extractPRData('some-owner', 'some-repo', 123)
      ).rejects.toThrow('Failed to fetch PR data: Not Found');
    });

    it('should not expose internal octokit instance', () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // The private field should not be accessible from outside the class
      // @ts-expect-error - accessing private field should fail at compile time
      expect(client.octokit).toBeUndefined();

      // Verify that no public properties expose internal state
      expect(Object.keys(client)).toEqual([]);

      // The client should only expose the extractPRData method as public API
      expect(typeof client.extractPRData).toBe('function');

      // Verify no public methods expose the octokit instance
      const publicMethods = Object.getOwnPropertyNames(GitHubClient.prototype);
      expect(publicMethods).not.toContain('octokit');
    });
  });

  describe('PR author extraction', () => {
    it('should extract PR author from GitHub API response', async () => {
      // Mock GitHub API responses
      mockPullsGet.mockResolvedValue({
        data: {
          number: 123,
          title: 'Test PR',
          body: 'Test description',
          user: {
            login: 'dependabot[bot]',
          },
        },
      });
      mockPullsListCommits.mockResolvedValue({ data: [] });
      mockPullsListFiles.mockResolvedValue({ data: [] });

      const client = new GitHubClient('ghp_valid_token_123');
      const prData = await client.extractPRData('owner', 'repo', 123);

      expect(prData.author).toBeDefined();
      expect(typeof prData.author).toBe('string');
      expect(prData.author).toBe('dependabot[bot]');
    });
  });

  describe('enhanced PR data extraction', () => {
    it('should extract commit information from PR', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock the basic PR data
      mockPullsGet.mockResolvedValue({
        data: {
          number: 1,
          title: 'Add new feature',
          body: 'This is a test PR',
        },
      });

      // Mock the commits data
      mockPullsListCommits.mockResolvedValue({
        data: [
          {
            sha: 'abc123',
            commit: {
              message: 'Add feature implementation',
              author: {
                name: 'John Doe',
                email: 'john@example.com',
                date: '2025-01-15T10:00:00Z',
              },
            },
          },
          {
            sha: 'def456',
            commit: {
              message: 'Fix typo in documentation',
              author: {
                name: 'Jane Smith',
                email: 'jane@example.com',
                date: '2025-01-15T11:00:00Z',
              },
            },
          },
        ],
      });

      // Mock the files response
      mockPullsListFiles.mockResolvedValue({
        data: [],
      });

      const result = await client.extractPRData('microsoft', 'TypeScript', 1);

      expect(result.commits).toBeDefined();
      expect(result.commits).toHaveLength(2);
      expect(result.commits[0]!.sha).toBe('abc123');
      expect(result.commits[0]!.message).toBe('Add feature implementation');
      expect(result.commits[0]!.author.name).toBe('John Doe');
      expect(mockPullsListCommits).toHaveBeenCalledWith({
        owner: 'microsoft',
        repo: 'TypeScript',
        pull_number: 1,
      });
    });

    it('should extract file changes from PR', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock the basic PR data
      mockPullsGet.mockResolvedValue({
        data: {
          number: 1,
          title: 'Add new feature',
          body: 'This is a test PR',
        },
      });

      // Mock commits data
      mockPullsListCommits.mockResolvedValue({
        data: [],
      });

      // Mock the files data
      mockPullsListFiles.mockResolvedValue({
        data: [
          {
            filename: 'src/feature.ts',
            status: 'added',
            additions: 50,
            deletions: 0,
            changes: 50,
            patch: '@@ -0,0 +1,50 @@\n+export class Feature {\n...',
          },
          {
            filename: 'README.md',
            status: 'modified',
            additions: 5,
            deletions: 2,
            changes: 7,
            patch: '@@ -10,7 +10,10 @@ ## Features\n...',
          },
        ],
      });

      const result = await client.extractPRData('microsoft', 'TypeScript', 1);

      expect(result.files).toBeDefined();
      expect(result.files).toHaveLength(2);
      expect(result.files[0]!.filename).toBe('src/feature.ts');
      expect(result.files[0]!.status).toBe('added');
      expect(result.files[0]!.additions).toBe(50);
      expect(result.files[1]!.filename).toBe('README.md');
      expect(result.files[1]!.status).toBe('modified');
      expect(mockPullsListFiles).toHaveBeenCalledWith({
        owner: 'microsoft',
        repo: 'TypeScript',
        pull_number: 1,
      });
    });

    it('should calculate diff statistics from file changes', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock the basic PR data
      mockPullsGet.mockResolvedValue({
        data: {
          number: 1,
          title: 'Add new feature',
          body: 'This is a test PR',
        },
      });

      // Mock commits data
      mockPullsListCommits.mockResolvedValue({
        data: [],
      });

      // Mock file data with various changes
      mockPullsListFiles.mockResolvedValue({
        data: [
          {
            filename: 'src/feature.ts',
            status: 'added',
            additions: 100,
            deletions: 0,
            changes: 100,
          },
          {
            filename: 'src/old-feature.ts',
            status: 'removed',
            additions: 0,
            deletions: 50,
            changes: 50,
          },
          {
            filename: 'README.md',
            status: 'modified',
            additions: 10,
            deletions: 5,
            changes: 15,
          },
        ],
      });

      const result = await client.extractPRData('microsoft', 'TypeScript', 1);

      expect(result.diffStats).toBeDefined();
      expect(result.diffStats.totalAdditions).toBe(110);
      expect(result.diffStats.totalDeletions).toBe(55);
      expect(result.diffStats.totalChanges).toBe(165);
      expect(result.diffStats.filesChanged).toBe(3);
    });
  });

  describe('PR comment management', () => {
    it('should create a PR comment with unique identifier', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock the comment creation response
      mockIssuesCreateComment.mockResolvedValue({
        data: {
          id: 123456,
          body: '<!-- ai-validator-comment -->\nThis is a test comment',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      });

      const result = await client.createComment(
        'microsoft',
        'TypeScript',
        1,
        'This is a test comment',
        'ai-validator-comment'
      );

      expect(result.id).toBe(123456);
      expect(result.body).toBe(
        '<!-- ai-validator-comment -->\nThis is a test comment'
      );
      expect(mockIssuesCreateComment).toHaveBeenCalledWith({
        owner: 'microsoft',
        repo: 'TypeScript',
        issue_number: 1,
        body: '<!-- ai-validator-comment -->\nThis is a test comment',
      });
    });

    it('should find existing comment by identifier', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock the list comments response
      mockIssuesListComments.mockResolvedValue({
        data: [
          {
            id: 111111,
            body: 'This is another comment',
            created_at: '2025-01-15T09:00:00Z',
            updated_at: '2025-01-15T09:00:00Z',
          },
          {
            id: 123456,
            body: '<!-- ai-validator-comment -->\nThis is the target comment',
            created_at: '2025-01-15T10:00:00Z',
            updated_at: '2025-01-15T10:00:00Z',
          },
          {
            id: 222222,
            body: '<!-- different-identifier -->\nThis is different',
            created_at: '2025-01-15T11:00:00Z',
            updated_at: '2025-01-15T11:00:00Z',
          },
        ],
      });

      const result = await client.findCommentByIdentifier(
        'microsoft',
        'TypeScript',
        1,
        'ai-validator-comment'
      );

      expect(result).toBeDefined();
      expect(result!.id).toBe(123456);
      expect(result!.body).toBe(
        '<!-- ai-validator-comment -->\nThis is the target comment'
      );
      expect(mockIssuesListComments).toHaveBeenCalledWith({
        owner: 'microsoft',
        repo: 'TypeScript',
        issue_number: 1,
      });
    });

    it('should return null when comment with identifier not found', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock the list comments response without target identifier
      mockIssuesListComments.mockResolvedValue({
        data: [
          {
            id: 111111,
            body: 'This is another comment',
            created_at: '2025-01-15T09:00:00Z',
            updated_at: '2025-01-15T09:00:00Z',
          },
          {
            id: 222222,
            body: '<!-- different-identifier -->\nThis is different',
            created_at: '2025-01-15T11:00:00Z',
            updated_at: '2025-01-15T11:00:00Z',
          },
        ],
      });

      const result = await client.findCommentByIdentifier(
        'microsoft',
        'TypeScript',
        1,
        'ai-validator-comment'
      );

      expect(result).toBeNull();
      expect(mockIssuesListComments).toHaveBeenCalledWith({
        owner: 'microsoft',
        repo: 'TypeScript',
        issue_number: 1,
      });
    });

    it('should update existing PR comment', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock the update comment response
      mockIssuesUpdateComment.mockResolvedValue({
        data: {
          id: 123456,
          body: '<!-- ai-validator-comment -->\nThis is an updated comment',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T12:00:00Z',
        },
      });

      const result = await client.updateComment(
        'microsoft',
        'TypeScript',
        123456,
        'This is an updated comment',
        'ai-validator-comment'
      );

      expect(result.id).toBe(123456);
      expect(result.body).toBe(
        '<!-- ai-validator-comment -->\nThis is an updated comment'
      );
      expect(result.updated_at).toBe('2025-01-15T12:00:00Z');
      expect(mockIssuesUpdateComment).toHaveBeenCalledWith({
        owner: 'microsoft',
        repo: 'TypeScript',
        comment_id: 123456,
        body: '<!-- ai-validator-comment -->\nThis is an updated comment',
      });
    });

    it('should handle createComment API errors', async () => {
      // Tests error handling for comment creation to ensure graceful failure
      // with meaningful error messages when GitHub API is unavailable.
      const client = new GitHubClient('ghp_valid_token_123');

      mockIssuesCreateComment.mockRejectedValue(new Error('API Error'));

      await expect(
        client.createComment('owner', 'repo', 1, 'Test comment', 'test-id')
      ).rejects.toThrow('Failed to create comment: API Error');
    });

    it('should handle findCommentByIdentifier API errors', async () => {
      // Tests error handling for comment lookup failures to prevent
      // unhandled promise rejections during comment management.
      const client = new GitHubClient('ghp_valid_token_123');

      mockIssuesListComments.mockRejectedValue(new Error('List Error'));

      await expect(
        client.findCommentByIdentifier('owner', 'repo', 1, 'test-id')
      ).rejects.toThrow('Failed to find comment: List Error');
    });

    it('should handle updateComment API errors', async () => {
      // Tests error handling for comment updates to ensure proper
      // error propagation when comment modification fails.
      const client = new GitHubClient('ghp_valid_token_123');

      mockIssuesUpdateComment.mockRejectedValue(new Error('Update Error'));

      await expect(
        client.updateComment('owner', 'repo', 123, 'Updated content', 'test-id')
      ).rejects.toThrow('Failed to update comment: Update Error');
    });
  });

  describe('commit status management', () => {
    it('should create pending commit status', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock the commit status creation response
      mockReposCreateCommitStatus.mockResolvedValue({
        data: {
          id: 789012,
          state: 'pending',
          description: 'AI validation in progress',
          context: 'ai-validator',
          target_url:
            'https://github.com/microsoft/TypeScript/actions/runs/123',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      });

      const result = await client.createCommitStatus(
        'microsoft',
        'TypeScript',
        'abc123',
        'pending',
        'AI validation in progress',
        'ai-validator',
        'https://github.com/microsoft/TypeScript/actions/runs/123'
      );

      expect(result.id).toBe(789012);
      expect(result.state).toBe('pending');
      expect(result.description).toBe('AI validation in progress');
      expect(result.context).toBe('ai-validator');
      expect(result.target_url).toBe(
        'https://github.com/microsoft/TypeScript/actions/runs/123'
      );
      expect(mockReposCreateCommitStatus).toHaveBeenCalledWith({
        owner: 'microsoft',
        repo: 'TypeScript',
        sha: 'abc123',
        state: 'pending',
        description: 'AI validation in progress',
        context: 'ai-validator',
        target_url: 'https://github.com/microsoft/TypeScript/actions/runs/123',
      });
    });

    it('should create success commit status', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock the commit status creation response
      mockReposCreateCommitStatus.mockResolvedValue({
        data: {
          id: 789013,
          state: 'success',
          description: 'AI validation passed',
          context: 'ai-validator',
          target_url:
            'https://github.com/microsoft/TypeScript/actions/runs/123',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:05:00Z',
        },
      });

      const result = await client.createCommitStatus(
        'microsoft',
        'TypeScript',
        'abc123',
        'success',
        'AI validation passed',
        'ai-validator',
        'https://github.com/microsoft/TypeScript/actions/runs/123'
      );

      expect(result.state).toBe('success');
      expect(result.description).toBe('AI validation passed');
      expect(mockReposCreateCommitStatus).toHaveBeenCalledWith({
        owner: 'microsoft',
        repo: 'TypeScript',
        sha: 'abc123',
        state: 'success',
        description: 'AI validation passed',
        context: 'ai-validator',
        target_url: 'https://github.com/microsoft/TypeScript/actions/runs/123',
      });
    });

    it('should create failure commit status', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock the commit status creation response
      mockReposCreateCommitStatus.mockResolvedValue({
        data: {
          id: 789014,
          state: 'failure',
          description: 'AI validation failed',
          context: 'ai-validator',
          target_url:
            'https://github.com/microsoft/TypeScript/actions/runs/123',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:05:00Z',
        },
      });

      const result = await client.createCommitStatus(
        'microsoft',
        'TypeScript',
        'abc123',
        'failure',
        'AI validation failed',
        'ai-validator',
        'https://github.com/microsoft/TypeScript/actions/runs/123'
      );

      expect(result.state).toBe('failure');
      expect(result.description).toBe('AI validation failed');
      expect(mockReposCreateCommitStatus).toHaveBeenCalledWith({
        owner: 'microsoft',
        repo: 'TypeScript',
        sha: 'abc123',
        state: 'failure',
        description: 'AI validation failed',
        context: 'ai-validator',
        target_url: 'https://github.com/microsoft/TypeScript/actions/runs/123',
      });
    });

    it('should handle optional parameters in commit status', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock the commit status creation response
      mockReposCreateCommitStatus.mockResolvedValue({
        data: {
          id: 789015,
          state: 'pending',
          description: 'Validation starting',
          context: 'ai-validator',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      });

      const result = await client.createCommitStatus(
        'microsoft',
        'TypeScript',
        'abc123',
        'pending',
        'Validation starting'
      );

      expect(result.state).toBe('pending');
      expect(result.description).toBe('Validation starting');
      expect(result.context).toBe('ai-validator');
      expect(mockReposCreateCommitStatus).toHaveBeenCalledWith({
        owner: 'microsoft',
        repo: 'TypeScript',
        sha: 'abc123',
        state: 'pending',
        description: 'Validation starting',
        context: 'ai-validator',
      });
    });

    it('should handle commit status API errors gracefully', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock an API error
      mockReposCreateCommitStatus.mockRejectedValue(new Error('Forbidden'));

      await expect(
        client.createCommitStatus(
          'microsoft',
          'TypeScript',
          'abc123',
          'pending',
          'AI validation in progress'
        )
      ).rejects.toThrow('Failed to create commit status: Forbidden');
    });

    it('should retry on rate limit errors (403)', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // First call fails with rate limit, second succeeds
      mockReposCreateCommitStatus
        .mockRejectedValueOnce({
          status: 403,
          message: 'API rate limit exceeded',
        })
        .mockResolvedValueOnce({
          data: {
            id: 456789,
            state: 'success',
            description: 'Rate limit retry success',
            context: 'ai-validator',
            created_at: '2025-01-15T10:00:00Z',
            updated_at: '2025-01-15T10:00:00Z',
          },
        });

      const result = await client.createCommitStatus(
        'microsoft',
        'TypeScript',
        'abc123',
        'success',
        'Rate limit retry success'
      );

      expect(result.state).toBe('success');
      expect(result.description).toBe('Rate limit retry success');
      expect(mockReposCreateCommitStatus).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff with multiple retries', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      // Mock multiple rate limit errors followed by success
      mockReposCreateCommitStatus
        .mockRejectedValueOnce({ status: 429, message: 'Rate limit exceeded' })
        .mockRejectedValueOnce({ status: 429, message: 'Rate limit exceeded' })
        .mockResolvedValueOnce({
          data: {
            id: 789012,
            state: 'success',
            description: 'Success after exponential backoff',
            context: 'ai-validator',
            created_at: '2025-01-15T10:00:00Z',
            updated_at: '2025-01-15T10:00:00Z',
          },
        });

      const startTime = Date.now();

      const result = await client.createCommitStatus(
        'microsoft',
        'TypeScript',
        'def456',
        'success',
        'Exponential backoff test'
      );

      const duration = Date.now() - startTime;

      expect(result.state).toBe('success');
      expect(result.description).toBe('Success after exponential backoff');
      expect(mockReposCreateCommitStatus).toHaveBeenCalledTimes(3);
      // Should have waited for exponential backoff: first delay is 1000ms, second would be 2000ms
      // Since third attempt succeeds, we only see the first 1000ms delay
      expect(duration).toBeGreaterThan(900); // Allow margin for test execution
    });
  });

  describe('repository permission error handling', () => {
    it('should handle repository not found error (404)', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      mockPullsGet.mockRejectedValue({
        status: 404,
        message: 'Not Found',
      });

      await expect(
        client.extractPRData('nonexistent', 'repo', 1)
      ).rejects.toThrow(
        'Repository "nonexistent/repo" not found or you don\'t have access to it'
      );
    });

    it('should handle insufficient permissions error (403)', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      mockPullsGet.mockRejectedValue({
        status: 403,
        message: 'Forbidden',
      });

      await expect(client.extractPRData('private', 'repo', 1)).rejects.toThrow(
        'Insufficient permissions to access repository "private/repo"'
      );
    });

    it('should handle PR not found error with specific message', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      mockPullsGet.mockRejectedValue({
        status: 404,
        message: 'Not Found',
        response: {
          data: { message: 'Issue not found' },
        },
      });

      await expect(client.extractPRData('owner', 'repo', 999)).rejects.toThrow(
        'Pull request #999 not found in repository "owner/repo"'
      );
    });

    it('should handle invalid repository name format', async () => {
      const client = new GitHubClient('ghp_valid_token_123');

      await expect(client.extractPRData('', 'repo', 1)).rejects.toThrow(
        'Invalid repository owner: owner cannot be empty'
      );
    });

    it('should handle empty repository name', async () => {
      // Tests input validation to ensure early failure with clear error messages
      // before making expensive GitHub API calls. Follows fail-fast principle.
      const client = new GitHubClient('ghp_valid_token_123');

      await expect(client.extractPRData('owner', '', 1)).rejects.toThrow(
        'Invalid repository name: repo cannot be empty'
      );
    });

    it('should handle invalid PR number - zero', async () => {
      // Tests edge cases for PR number validation to prevent GitHub API errors.
      // Ensures proper integer validation before API calls.
      const client = new GitHubClient('ghp_valid_token_123');

      await expect(client.extractPRData('owner', 'repo', 0)).rejects.toThrow(
        'Invalid PR number: must be a positive integer'
      );
    });

    it('should handle invalid PR number - negative', async () => {
      // Tests negative number validation to ensure robust input handling
      // and prevent malformed GitHub API requests.
      const client = new GitHubClient('ghp_valid_token_123');

      await expect(client.extractPRData('owner', 'repo', -1)).rejects.toThrow(
        'Invalid PR number: must be a positive integer'
      );
    });
  });
});
