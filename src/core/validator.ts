/**
 * Validator Orchestrator
 *
 * Main orchestrator that coordinates GitHub and AI clients to validate
 * pull requests against contribution guidelines.
 *
 * Architecture pattern: Dependency injection with optional clients enables
 * isolated testing and graceful degradation when services are unavailable.
 * The orchestrator pattern centralizes workflow logic while keeping clients
 * focused on single responsibilities.
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
}

/**
 * Result of a validation operation
 */
export interface ValidationReport {
  valid: boolean;
  suggestions: string[];
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
   * Dependencies are optional to enable isolated testing and allow the system
   * to operate with reduced functionality if external services are unavailable.
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
   * Architecture: Promise.race pattern enforces 30-second timeout to prevent
   * GitHub Actions from hanging on slow AI responses. This ensures reliable
   * feedback even when external services are experiencing issues.
   *
   * Planned workflow: extract PR data → generate prompt → validate content → update PR
   * Currently returns stub data pending full client integration.
   */
  async validate(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ValidationReport> {
    // Timeout protection: GitHub Actions has limited execution time
    // 30 seconds allows for reasonable AI processing while preventing workflow hangs
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
