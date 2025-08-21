/**
 * Entry Point Tests
 *
 * Tests for the main GitHub Action entry point that orchestrates
 * the validation workflow using the Validator class.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import * as fs from 'fs';
import { Validator } from '../../src/core/validator';
import { ResultFormatter } from '../../src/core/formatter';
import { GitHubClient } from '../../src/github/client';

// Mock external dependencies
vi.mock('@actions/core');
vi.mock('@actions/github');
vi.mock('fs');

// Mock GitHubClient and GeminiClient constructor calls
vi.mock('../../src/github/client');
vi.mock('../../src/ai/gemini-client');
vi.mock('../../src/core/validator');
vi.mock('../../src/core/formatter');

describe('Entry Point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Clear environment variables
    delete process.env['GITHUB_REPOSITORY'];
    delete process.env['GITHUB_EVENT_PATH'];
  });

  it('should parse GitHub Actions inputs and create validator', async () => {
    // Mock core.getInput to return test values
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      const inputs = new Map([
        ['github-token', 'ghp_test_token_1234567890abcdef1234567890'],
        ['gemini-api-key', 'test-gemini-api-key'],
        ['guidelines-file', 'CONTRIBUTING.md'],
        ['skip-authors', 'dependabot[bot]'],
      ]);
      return inputs.get(name) ?? '';
    });

    // Mock GitHub context
    process.env['GITHUB_REPOSITORY'] = 'owner/repo';
    process.env['GITHUB_EVENT_PATH'] = 'test/fixtures/pr-event.json';

    // Import and test the run function
    const { run } = await import('../../src/index');
    await run();

    expect(core.info).toHaveBeenCalledWith(
      'AI Contribution Validator Action starting...'
    );
    expect(core.getInput).toHaveBeenCalledWith('github-token');
    expect(core.getInput).toHaveBeenCalledWith('gemini-api-key');
    expect(core.getInput).toHaveBeenCalledWith('guidelines-file');
    expect(core.getInput).toHaveBeenCalledWith('skip-authors');
  });

  it('should orchestrate full validation workflow with clients', async () => {
    // Mock core.getInput to return test values
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      const inputs = new Map([
        ['github-token', 'ghp_test_token_1234567890abcdef1234567890'],
        ['gemini-api-key', 'test-gemini-api-key'],
        ['guidelines-file', 'CONTRIBUTING.md'],
        ['skip-authors', 'dependabot[bot]'],
      ]);
      return inputs.get(name) ?? '';
    });

    // Mock GitHub context
    process.env['GITHUB_REPOSITORY'] = 'owner/repo';
    process.env['GITHUB_EVENT_PATH'] = 'test/fixtures/pr-event.json';

    // Import and test the run function
    const { run } = await import('../../src/index');
    await run();

    // Verify the expected messages are logged
    expect(core.info).toHaveBeenCalledWith(
      'AI Contribution Validator Action starting...'
    );
    expect(core.info).toHaveBeenCalledWith(
      'Creating validator with GitHub and Gemini clients...'
    );
    // Module auto-execution issue is now fixed with require.main check
    expect(vi.mocked(core.info).mock.calls.length).toEqual(3);
  });

  it('should execute validation workflow with GitHub repository context', async () => {
    // Mock core.getInput to return test values
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      const inputs = new Map([
        ['github-token', 'ghp_test_token_1234567890abcdef1234567890'],
        ['gemini-api-key', 'test-gemini-api-key'],
        ['guidelines-file', 'CONTRIBUTING.md'],
        ['skip-authors', 'dependabot[bot]'],
      ]);
      return inputs.get(name) ?? '';
    });

    // Mock fs.readFileSync to return PR event data
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        pull_request: {
          number: 123,
        },
      })
    );

    // Mock validator.validate to return a successful validation with new structured format
    const mockValidate = vi.fn().mockResolvedValue({
      status: 'PASS',
      issues: [],
      improved_title: '',
      improved_commits: '',
      improved_description: '',
    });
    vi.mocked(Validator).mockImplementation(
      () =>
        ({
          validate: mockValidate,
        }) as any
    );

    // Mock ResultFormatter
    vi.mocked(ResultFormatter).mockImplementation(
      () =>
        ({
          formatToMarkdown: vi.fn().mockReturnValue('Formatted result'),
        }) as any
    );

    // Mock GitHubClient
    vi.mocked(GitHubClient).mockImplementation(
      () =>
        ({
          createComment: vi.fn().mockResolvedValue({ id: 123456 }),
        }) as any
    );

    // Set GitHub context with repository information
    process.env['GITHUB_REPOSITORY'] = 'test-owner/test-repo';
    process.env['GITHUB_EVENT_PATH'] = 'test/fixtures/pr-event.json';

    // Import and test the run function
    const { run } = await import('../../src/index');

    console.log('Before run() call');
    try {
      await run();
      console.log('After run() call - success');
    } catch (error) {
      console.log('After run() call - error:', error);
      throw error;
    }

    // Should validate the repository context and execute validation
    // Due to module auto-execution, check for calls with more flexible matching
    const allCalls = vi.mocked(core.info).mock.calls.map(call => call[0]);
    const allWarningCalls = vi
      .mocked(core.warning)
      .mock.calls.map(call => call[0]);
    console.log('All info calls:', allCalls);
    console.log('All warning calls:', allWarningCalls);
    console.log('Total info calls:', vi.mocked(core.info).mock.calls.length);

    expect(allCalls).toContain('Starting validation workflow...');
    expect(allCalls.some(call => call.includes('Validating PR #'))).toBe(true);
    expect(allCalls.some(call => call.includes('test-owner/test-repo'))).toBe(
      true
    );

    // Verify structured validation result is used correctly
    expect(mockValidate).toHaveBeenCalledWith('test-owner', 'test-repo', 123);
    expect(
      allCalls.some(call =>
        call.includes('Validation completed successfully - PR meets guidelines')
      )
    ).toBe(true);
  });

  it('should create PR comment with formatted validation result', async () => {
    // Mock core.getInput to return test values
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      const inputs = new Map([
        ['github-token', 'ghp_test_token_1234567890abcdef1234567890'],
        ['gemini-api-key', 'test-gemini-api-key'],
        ['guidelines-file', 'CONTRIBUTING.md'],
        ['skip-authors', 'dependabot[bot]'],
        ['comment-identifier', 'ai-validator'],
      ]);
      return inputs.get(name) ?? '';
    });

    // Mock fs.readFileSync to return PR event data
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        pull_request: {
          number: 456,
        },
      })
    );

    // Mock validation result with new structured format
    const mockValidationResult = {
      status: 'FAIL',
      issues: ['Commit message format needs improvement', 'Add unit tests'],
      improved_title: 'feat(api): add user authentication endpoint',
      improved_commits:
        'feat(api): add user authentication endpoint\n\nImplement OAuth2 authentication with JWT tokens for secure API access.',
      improved_description:
        '## What\nAdd user authentication endpoint\n## Why\nSecure API access\n## Testing\nUnit tests included',
    };

    // Mock validator.validate to return validation result
    const mockValidate = vi.fn().mockResolvedValue(mockValidationResult);
    vi.mocked(Validator).mockImplementation(
      () =>
        ({
          validate: mockValidate,
        }) as any
    );

    // Mock ResultFormatter
    const mockFormatToMarkdown = vi
      .fn()
      .mockReturnValue(
        '## Validation Results\n❌ Validation failed\n- Commit message format needs improvement\n- Add unit tests'
      );
    vi.mocked(ResultFormatter).mockImplementation(
      () =>
        ({
          formatToMarkdown: mockFormatToMarkdown,
        }) as any
    );

    // Mock GitHubClient with createComment method
    const mockCreateComment = vi.fn().mockResolvedValue({
      id: 123456,
      body: 'Test comment',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    });
    vi.mocked(GitHubClient).mockImplementation(
      () =>
        ({
          createComment: mockCreateComment,
        }) as any
    );

    // Set GitHub context
    process.env['GITHUB_REPOSITORY'] = 'test-owner/test-repo';
    process.env['GITHUB_EVENT_PATH'] = 'test/fixtures/pr-event.json';

    // Import and test the run function
    const { run } = await import('../../src/index');
    await run();

    // Verify ResultFormatter was called with validation result
    expect(mockFormatToMarkdown).toHaveBeenCalledWith(mockValidationResult);

    // Verify createComment was called with formatted markdown
    expect(mockCreateComment).toHaveBeenCalledWith(
      'test-owner',
      'test-repo',
      456,
      '## Validation Results\n❌ Validation failed\n- Commit message format needs improvement\n- Add unit tests',
      'ai-validator'
    );

    // Verify comment-url output was set
    expect(core.setOutput).toHaveBeenCalledWith(
      'comment-url',
      'https://github.com/test-owner/test-repo/pull/456#issuecomment-123456'
    );
  });
});
