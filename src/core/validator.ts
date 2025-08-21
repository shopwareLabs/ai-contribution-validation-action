/**
 * Validator Orchestrator
 *
 * Main orchestrator that coordinates GitHub and AI clients to validate
 * pull requests against contribution guidelines.
 */

import type { GitHubClient } from '../github/client';
import type { GeminiClient } from '../ai/gemini-client';

/**
 * Configuration for the validator
 */
export interface ValidationConfig {
  githubToken: string;
  geminiApiKey: string;
  guidelinesFile: string;
  skipAuthors?: string;
}

/**
 * Result of a validation operation
 */
export interface ValidationReport {
  valid: boolean;
  suggestions: string[];
  skipped?: boolean;
}

/**
 * Main validator orchestrator class
 */
export class Validator {
  private readonly _config: ValidationConfig;
  private readonly _githubClient: GitHubClient | undefined;
  private readonly _geminiClient: GeminiClient | undefined;

  /**
   * Creates validator with configuration and optional dependency injection.
   *
   * Optional clients enable graceful degradation: the validator can operate
   * with reduced functionality if GitHub or AI services are unavailable,
   * rather than failing completely.
   * Token validation covers both classic (ghp_) and fine-grained (github_pat_) formats.
   */
  constructor(
    config: ValidationConfig,
    githubClient?: GitHubClient,
    geminiClient?: GeminiClient
  ) {
    if (!config.githubToken || !config.geminiApiKey || !config.guidelinesFile) {
      throw new Error('Invalid configuration');
    }

    // GitHub token validation - covers classic and fine-grained tokens
    const githubTokenPattern = /^(ghp_|github_pat_)[A-Za-z0-9_]{40,255}$/;
    if (!githubTokenPattern.test(config.githubToken)) {
      throw new Error('Invalid GitHub token format');
    }

    this._config = config;
    this._githubClient = githubClient;
    this._geminiClient = geminiClient;
  }

  /**
   * Orchestrates the complete validation workflow with timeout protection.
   *
   * Planned workflow: extract PR data → generate prompt → validate content → update PR
   * Currently returns stub data pending full client integration.
   */
  async validate(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ValidationReport> {
    // 30-second timeout balances AI processing time with GitHub Actions constraints:
    // enough time for API calls but prevents workflow from hanging indefinitely
    const timeoutPromise = new Promise<never>((_, reject) => {
      global.setTimeout(() => {
        reject(new Error('Validation timeout after 30 seconds'));
      }, 30000);
    });

    // Create validation work promise
    const validationPromise = this.performValidation(owner, repo, prNumber);

    // Race between timeout and validation completion
    return Promise.race([validationPromise, timeoutPromise]);
  }

  private async performValidation(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ValidationReport> {
    if (this._githubClient) {
      const prData = await this._githubClient.extractPRData(
        owner,
        repo,
        prNumber
      );

      // Bot exclusion pattern: Skip AI validation for automated PRs
      // This prevents dependency bots from failing validation due to different
      // commit formats and contribution patterns that don't apply to automated updates
      if (this._config.skipAuthors && prData.author) {
        const skipAuthors = this._config.skipAuthors
          .split(',')
          .map(a => a.trim());
        if (skipAuthors.includes(prData.author)) {
          return {
            valid: true,
            suggestions: [
              `Validation skipped for automated PR by ${prData.author}`,
            ],
            skipped: true, // Flag enables different handling in CI workflows
          };
        }
      }

      if (this._geminiClient) {
        const prompt = this._geminiClient.generateValidationPrompt(
          prData,
          this._config.guidelinesFile
        );
        const validationResult =
          await this._geminiClient.validateContent(prompt);
        await this._githubClient.createCommitStatus(
          owner,
          repo,
          'HEAD',
          'success',
          'Test',
          'ai-validator'
        );
        return validationResult;
      }

      await this._githubClient.createCommitStatus(
        owner,
        repo,
        'HEAD',
        'success',
        'Test',
        'ai-validator'
      );
      return Promise.resolve({
        valid: true,
        suggestions: [],
      });
    }
    return Promise.resolve({
      valid: true,
      suggestions: [],
    });
  }
}
