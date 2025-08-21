/**
 * AI Contribution Validator Action Entry Point
 *
 * This GitHub Action validates pull requests against contribution guidelines using AI.
 * Orchestrates the complete validation workflow from GitHub context extraction to
 * AI-powered analysis and result reporting.
 */

import * as core from '@actions/core';
import * as fs from 'fs';
import { GitHubClient } from './github/client';
import { GeminiClient } from './ai/gemini-client';
import { Validator, type ValidationConfig } from './core/validator';
import { ResultFormatter } from './core/formatter';

/**
 * Main GitHub Action entry point that orchestrates the validation workflow.
 *
 * Architecture pattern: Environment-driven configuration extraction followed by
 * dependency injection for testability. GitHub context is extracted from standard
 * GitHub Actions environment variables to maintain compatibility with all webhook events.
 *
 * Error handling strategy: Fail fast with descriptive messages for misconfiguration,
 * but handle validation errors gracefully to provide useful feedback without blocking PRs.
 */
export async function run(): Promise<void> {
  try {
    core.info('AI Contribution Validator Action starting...');

    // Parse GitHub Actions inputs - follows standard action input pattern
    const githubToken = core.getInput('github-token');
    const geminiApiKey = core.getInput('gemini-api-key');
    const guidelinesFile =
      core.getInput('guidelines-file') || 'CONTRIBUTING.md';
    const skipAuthors = core.getInput('skip-authors');
    // Comment identifier enables multiple validators to coexist in same repository
    // without overwriting each other's feedback comments
    const commentIdentifier =
      core.getInput('comment-identifier') || 'ai-validator';

    core.info('Creating validator with GitHub and Gemini clients...');

    // Dependency injection pattern enables isolated testing and graceful degradation
    const config: ValidationConfig = {
      githubToken,
      geminiApiKey,
      guidelinesFile,
      skipAuthors,
    };

    const githubClient = new GitHubClient(githubToken);
    const geminiClient = new GeminiClient(geminiApiKey);
    const validator = new Validator(config, githubClient, geminiClient);

    core.info('Starting validation workflow...');

    // Extract GitHub context from standard environment variables
    // This pattern works with all GitHub webhook events (PR, push, etc.)
    const githubRepository = process.env['GITHUB_REPOSITORY'];
    if (!githubRepository) {
      throw new Error('GITHUB_REPOSITORY environment variable not set');
    }

    const [owner, repo] = githubRepository.split('/');
    if (!owner || !repo) {
      throw new Error(`Invalid GITHUB_REPOSITORY format: ${githubRepository}`);
    }

    // Parse GitHub event data to extract PR context
    // GitHub Actions provides event payload as JSON file for all webhook events
    const githubEventPath = process.env['GITHUB_EVENT_PATH'];
    if (!githubEventPath) {
      throw new Error('GITHUB_EVENT_PATH environment variable not set');
    }

    let prNumber: number;
    try {
      // Security note: Path is controlled by GitHub Actions runtime, not user input
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const eventData = JSON.parse(fs.readFileSync(githubEventPath, 'utf8'));

      // Handle both pull_request events and direct PR references in other events
      prNumber = eventData.pull_request?.number ?? eventData.number;
      if (!prNumber) {
        throw new Error('PR number not found in GitHub event data');
      }
    } catch (error) {
      throw new Error(
        `Failed to parse GitHub event: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    core.info(`Validating PR #${prNumber} in ${owner}/${repo}`);

    // Execute validation workflow with extracted context
    const validationResult = await validator.validate(owner, repo, prNumber);

    // Create PR comment with validation result
    // ResultFormatter is instantiated per-request to maintain stateless design
    // and avoid shared state between concurrent validation workflows
    const formatter = new ResultFormatter();
    const formattedResult = formatter.formatToMarkdown(validationResult);

    // Post comment with configurable identifier to enable multiple validators
    // to coexist without conflicts. The identifier allows later updates/removal.
    const commentResult = await githubClient.createComment(
      owner,
      repo,
      prNumber,
      formattedResult,
      commentIdentifier
    );

    // Construct GitHub comment URL following standard GitHub URL patterns
    // This enables CI/CD systems to link directly to the posted feedback
    const commentUrl = `https://github.com/${owner}/${repo}/pull/${prNumber}#issuecomment-${commentResult.id}`;
    core.setOutput('comment-url', commentUrl);

    // Report results using appropriate GitHub Actions logging levels
    if (validationResult.valid) {
      core.info('Validation completed successfully - PR meets guidelines');
    } else {
      core.warning(
        `Validation found issues: ${validationResult.suggestions.join(', ')}`
      );
    }
  } catch (error) {
    core.setFailed(
      `Action failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Module execution control: Only run when executed directly, not when imported
// This pattern prevents auto-execution during testing while allowing normal GitHub Actions usage
// The bundled index.js will execute this when deployed as a GitHub Action
if (process.argv[1]?.endsWith('index.js')) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  run();
}
