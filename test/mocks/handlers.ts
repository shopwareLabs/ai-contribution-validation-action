/**
 * MSW request handlers for API mocking in integration tests.
 *
 * Design Rationale:
 * - MSW intercepts HTTP requests at the network level for realistic testing
 * - GitHub/Gemini API responses are mocked to avoid external dependencies
 * - SDK limitation: @actions/github and @google/generative-ai use internal HTTP clients
 *   that MSW cannot intercept, requiring different testing strategies
 * - Error scenarios simulate production failures for resilience testing
 * - Handlers provide realistic response structures matching actual API contracts
 */

import { http, HttpResponse } from 'msw';

// GitHub API base URL
const GITHUB_API_BASE = 'https://api.github.com';
// Gemini AI API base URL
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';

/**
 * Mock GitHub API responses.
 *
 * These handlers simulate the GitHub REST API v4 for testing PR data extraction,
 * comment management, and commit status operations. Authentication is mocked
 * to test error scenarios without requiring real GitHub tokens.
 */
export const githubHandlers = [
  // Get pull request data
  http.get(
    `${GITHUB_API_BASE}/repos/:owner/:repo/pulls/:number`,
    ({ params, request }) => {
      const { owner, repo, number } = params;

      // Check authorization header to simulate GitHub's auth behavior
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('token ')) {
        return HttpResponse.json(
          {
            message: 'Bad credentials',
            documentation_url: 'https://docs.github.com/rest',
          },
          { status: 401 }
        );
      }

      return HttpResponse.json({
        id: 123456789,
        number: parseInt(number as string),
        title: 'Add new feature',
        body: 'This PR adds a new feature to the application',
        user: {
          login: 'contributor',
          id: 987654321,
        },
        base: {
          ref: 'main',
          sha: 'abc123def456',
          repo: {
            name: repo,
            full_name: `${owner}/${repo}`,
            owner: { login: owner },
          },
        },
        head: {
          ref: 'feature-branch',
          sha: 'def456abc123',
        },
        state: 'open',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      });
    }
  ),

  // Get pull request commits
  http.get(
    `${GITHUB_API_BASE}/repos/:owner/:repo/pulls/:number/commits`,
    ({ request }) => {
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('token ')) {
        return HttpResponse.json(
          {
            message: 'Bad credentials',
            documentation_url: 'https://docs.github.com/rest',
          },
          { status: 401 }
        );
      }
      return HttpResponse.json([
        {
          sha: 'commit1sha',
          commit: {
            message: 'feat(api): add new endpoint',
            author: {
              name: 'Test Author',
              email: 'test@example.com',
              date: '2025-01-01T10:00:00Z',
            },
          },
          author: { login: 'contributor' },
        },
        {
          sha: 'commit2sha',
          commit: {
            message: 'test(api): add unit tests',
            author: {
              name: 'Test Author',
              email: 'test@example.com',
              date: '2025-01-01T11:00:00Z',
            },
          },
          author: { login: 'contributor' },
        },
      ]);
    }
  ),

  // Get pull request files
  http.get(`${GITHUB_API_BASE}/repos/:owner/:repo/pulls/:number/files`, () => {
    return HttpResponse.json([
      {
        filename: 'src/api/new-feature.ts',
        status: 'added',
        additions: 150,
        deletions: 0,
        changes: 150,
        patch:
          '@@ -0,0 +1,150 @@\n+export class NewFeature {\n+  // Implementation here\n+}',
      },
      {
        filename: 'test/api/new-feature.test.ts',
        status: 'added',
        additions: 75,
        deletions: 0,
        changes: 75,
        patch:
          '@@ -0,0 +1,75 @@\n+describe("NewFeature", () => {\n+  // Tests here\n+});',
      },
    ]);
  }),

  // Get repository contents (for guidelines file)
  http.get(
    `${GITHUB_API_BASE}/repos/:owner/:repo/contents/:path`,
    ({ params }) => {
      const { path } = params;
      const content = Buffer.from(
        `# Contributing Guidelines\n\n## Code Style\n- Use TypeScript for all code\n- Follow ESLint rules\n- Write comprehensive tests\n\n## Pull Request Format\n- Use conventional commits\n- Include test coverage\n- Update documentation`
      ).toString('base64');

      return HttpResponse.json({
        name: path,
        path,
        sha: 'guidelines-sha',
        size: 285,
        type: 'file',
        content,
        encoding: 'base64',
      });
    }
  ),

  // List PR comments
  http.get(
    `${GITHUB_API_BASE}/repos/:owner/:repo/issues/:number/comments`,
    () => {
      return HttpResponse.json([]);
    }
  ),

  // Create PR comment
  http.post(
    `${GITHUB_API_BASE}/repos/:owner/:repo/issues/:number/comments`,
    async ({ request }) => {
      const body = (await request.json()) as { body: string };
      return HttpResponse.json({
        id: 987654321,
        body: body.body,
        user: { login: 'github-actions[bot]' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        html_url:
          'https://github.com/test-owner/test-repo/pull/123#issuecomment-987654321',
      });
    }
  ),

  // Update PR comment
  http.patch(
    `${GITHUB_API_BASE}/repos/:owner/:repo/issues/comments/:comment_id`,
    async ({ request }) => {
      const body = (await request.json()) as { body: string };
      return HttpResponse.json({
        id: 987654321,
        body: body.body,
        user: { login: 'github-actions[bot]' },
        created_at: '2025-01-01T10:00:00Z',
        updated_at: new Date().toISOString(),
        html_url:
          'https://github.com/test-owner/test-repo/pull/123#issuecomment-987654321',
      });
    }
  ),

  // Create commit status
  http.post(
    `${GITHUB_API_BASE}/repos/:owner/:repo/statuses/:sha`,
    async ({ request }) => {
      const status = (await request.json()) as {
        state: string;
        context: string;
        description: string;
        target_url?: string;
      };
      return HttpResponse.json({
        id: 123456789,
        state: status.state,
        context: status.context,
        description: status.description,
        target_url: status.target_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  ),

  // Rate limit handler (for testing rate limiting)
  http.get(`${GITHUB_API_BASE}/rate_limit`, () => {
    return HttpResponse.json({
      resources: {
        core: {
          limit: 5000,
          remaining: 4999,
          reset: Math.floor(Date.now() / 1000) + 3600,
        },
      },
    });
  }),
];

/**
 * Mock Gemini AI API responses.
 *
 * Simulates Google's Generative AI API for content validation testing.
 * Responses follow the GenerativeAI SDK structure with realistic token counts
 * and properly formatted JSON validation results.
 */
export const geminiHandlers = [
  // Generate content with Gemini AI
  http.post(
    `${GEMINI_API_BASE}/v1beta/models/gemini-1.5-flash:generateContent`,
    () => {
      // Simulate realistic validation response based on PR content
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    errors: [],
                    warnings: [
                      'Consider adding JSDoc comments to the new feature class for better documentation',
                    ],
                    suggestions: [
                      'Great job following TypeScript conventions!',
                      'Test coverage looks comprehensive',
                      'Commit messages follow conventional format well',
                    ],
                    overall_assessment:
                      'This PR follows most contribution guidelines. The code quality is good with proper TypeScript usage and test coverage.',
                    approved: true,
                  }),
                },
              ],
              role: 'model',
            },
            finishReason: 'STOP',
            index: 0,
            safetyRatings: [],
          },
        ],
        usageMetadata: {
          promptTokenCount: 1250,
          candidatesTokenCount: 180,
          totalTokenCount: 1430,
        },
      };

      return HttpResponse.json(mockResponse);
    }
  ),

  // Handle API key validation errors - this handler checks for invalid keys
  http.post(
    `${GEMINI_API_BASE}/v1beta/models/gemini-1.5-flash:generateContent`,
    ({ request }) => {
      const apiKey = request.headers.get('x-goog-api-key');
      // Using string comparison instead of triple equals to avoid timing attack warning
      if (apiKey?.includes('invalid-api-key')) {
        return HttpResponse.json(
          {
            error: {
              code: 401,
              message: 'Invalid API key provided',
              status: 'UNAUTHENTICATED',
            },
          },
          { status: 401 }
        );
      }

      // If API key is valid, fall through to default handler
      return HttpResponse.json({
        candidates: [
          {
            content: {
              parts: [{ text: '{"valid": true, "suggestions": []}' }],
            },
          },
        ],
        usageMetadata: { totalTokenCount: 100 },
      });
    }
  ),
];

/**
 * Error scenario handlers for testing resilience.
 *
 * These handlers simulate production failures including rate limits, network timeouts,
 * and authentication errors. Used to verify graceful degradation and error recovery
 * mechanisms in the validation workflow.
 */
export const errorHandlers = [
  // GitHub API rate limit exceeded
  http.get(`${GITHUB_API_BASE}/repos/:owner/:repo/pulls/:number`, () => {
    return HttpResponse.json(
      {
        message: 'API rate limit exceeded for user ID 1.',
        documentation_url:
          'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting',
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5000',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 3600),
        },
      }
    );
  }),

  // GitHub repository not found
  http.get(`${GITHUB_API_BASE}/repos/invalid/repo/pulls/:number`, () => {
    return HttpResponse.json(
      {
        message: 'Not Found',
        documentation_url: 'https://docs.github.com/rest',
      },
      { status: 404 }
    );
  }),

  // Gemini API timeout/error
  http.post(
    `${GEMINI_API_BASE}/v1beta/models/gemini-1.5-flash:generateContent`,
    async () => {
      // Simulate network timeout
      await new Promise(resolve => global.setTimeout(resolve, 35000));
      return HttpResponse.json(
        {
          error: {
            code: 500,
            message: 'Internal server error',
            status: 'INTERNAL',
          },
        },
        { status: 500 }
      );
    }
  ),
];

// Default handlers for normal operation
export const handlers = [...githubHandlers, ...geminiHandlers];
