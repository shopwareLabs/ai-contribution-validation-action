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

// Mock external dependencies
vi.mock('@actions/core');
vi.mock('@actions/github');
vi.mock('fs');

// Mock GitHubClient and GeminiClient constructor calls
vi.mock('../../src/github/client');
vi.mock('../../src/ai/gemini-client');
vi.mock('../../src/core/validator');

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

    // Mock validator.validate to return a successful validation
    const mockValidate = vi.fn().mockResolvedValue({
      valid: true,
      suggestions: [],
    });
    vi.mocked(Validator).mockImplementation(
      () =>
        ({
          validate: mockValidate,
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
  });
});
