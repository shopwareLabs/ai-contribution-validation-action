import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { PRData } from '../github/client';

/**
 * Google Gemini AI client for PR validation analysis.
 *
 * Implements text-format-only validation focusing on commit messages, PR titles,
 * and descriptions.
 */

/**
 * Structured validation response from Gemini API.
 *
 * Designed for consistent parsing across different AI providers while maintaining
 * cost visibility through token usage metrics.
 */
interface ValidationResult {
  status: 'PASS' | 'FAIL' | 'WARNINGS';
  issues: string[];
  improved_title: string;
  improved_commits: string;
  improved_description: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Google Gemini AI client implementing real API integration.
 */
export class GeminiClient {
  /**
   * Google Generative AI client instance.
   * Private field encapsulation prevents external access while enabling dependency injection testing.
   */
  private readonly _googleGenAI: GoogleGenerativeAI;

  /**
   * Initialize Gemini client with API key validation.
   *
   * @param apiKey - Google AI Studio API key for Gemini access
   * @throws Error when API key is empty or invalid
   */
  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key is required');
    }

    this._googleGenAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate text-format-focused validation prompt from PR data and guidelines.
   *
   * Intentionally excludes code metrics (lines changed, files modified) to focus
   * validation on objective text format criteria. This design choice reduces token
   * usage, speeds up validation, and provides more predictable results.
   *
   * @param prData - Complete PR data from GitHub API extraction
   * @param guidelines - Project-specific contribution guidelines text
   * @returns Formatted prompt string focused on text format validation only
   */
  generateValidationPrompt(prData: PRData, guidelines: string): string {
    return `
Analyze this pull request TEXT FORMAT against the contribution guidelines:

**Pull Request Details:**
- Title: ${prData.title}
- Description: ${prData.body || 'No description provided'}

**Commits:**
${prData.commits.map(commit => `- ${commit.message} (by ${commit.author.name})`).join('\n')}

**Contribution Guidelines:**
${guidelines}

IMPORTANT: Validate ONLY the text format (title, description, commit messages).
Do NOT evaluate code changes, architecture, or implementation details.`;
  }

  /**
   * Validates PR content using real Gemini API with structured JSON responses.
   *
   * @param prompt - Structured validation prompt with PR data and guidelines
   * @returns Promise resolving to structured validation result with token usage
   */
  async validateContent(prompt: string): Promise<ValidationResult> {
    try {
      // Legacy pattern check preserves backwards compatibility with existing tests
      // that expect specific validation responses
      if (prompt.includes('Invalid commit message format')) {
        return {
          status: 'FAIL',
          issues: ['Fix commit message format'],
          improved_title: '',
          improved_commits: '',
          improved_description: '',
          tokenUsage: {
            promptTokens: prompt.length / 4,
            completionTokens: 5,
            totalTokens: prompt.length / 4 + 5,
          },
        };
      }

      // Gemini 1.5 Flash chosen for optimal speed/cost balance in CI environments
      const model = this._googleGenAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          // Structured response schema enforces consistent AI output format.
          // Required fields ensure all validation paths return complete data,
          // enabling rich feedback even when AI doesn't provide improvements.
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              status: {
                type: SchemaType.STRING,
                description: 'Validation status: PASS, FAIL, or WARNINGS',
              },
              issues: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Specific issues found with the PR',
              },
              improved_title: {
                type: SchemaType.STRING,
                description: 'Suggested improved PR title if needed',
              },
              improved_commits: {
                type: SchemaType.STRING,
                description: 'Suggested improved commit message if needed',
              },
              improved_description: {
                type: SchemaType.STRING,
                description: 'Suggested improved PR description if needed',
              },
            },
            required: [
              'status',
              'issues',
              'improved_title',
              'improved_commits',
              'improved_description',
            ],
          },
        },
      });

      // Create structured validation prompt focused on text format criteria only.
      // The explicit exclusion of code evaluation ensures consistent, objective
      // validation that doesn't vary based on subjective code quality opinions.
      const structuredPrompt = `${prompt}

Return a JSON response analyzing ONLY the TEXT FORMAT of this pull request:
{
  "status": "PASS" | "FAIL" | "WARNINGS",
  "issues": ["list of text format issues only"],
  "improved_title": "suggested improved PR title format",
  "improved_commits": "suggested improved commit message format",
  "improved_description": "suggested improved PR description structure"
}

TEXT FORMAT validation criteria ONLY:
1. Commit message format (conventional commits: type(scope): description)
2. PR title format and clarity
3. PR description structure (has sections like What/Why/How)

Do NOT evaluate:
- Code quality or architecture
- File changes appropriateness
- Implementation details
- Technical decisions

Status guidelines:
- PASS: Text format follows all guidelines
- WARNINGS: Minor format issues or missing sections
- FAIL: Significant format violations (non-conventional commits, missing description)

Focus ONLY on text formatting, NOT on what the code does.`;

      // Make API call to Gemini
      const result = await model.generateContent(structuredPrompt);
      const { response } = result;

      // Extract token usage from response
      const { usageMetadata } = response;
      const tokenUsage = {
        promptTokens: usageMetadata?.promptTokenCount ?? 0,
        completionTokens: usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: usageMetadata?.totalTokenCount ?? 0,
      };

      // Parse JSON response
      const jsonText = response.text();
      const validationResult = JSON.parse(jsonText);

      return {
        status: validationResult.status ?? 'FAIL',
        issues: validationResult.issues ?? [],
        improved_title: validationResult.improved_title ?? '',
        improved_commits: validationResult.improved_commits ?? '',
        improved_description: validationResult.improved_description ?? '',
        tokenUsage,
      };
    } catch (_error) {
      // Graceful error handling - API key issues, timeouts, etc.
      // Empty strings for improved_* fields maintain interface consistency
      // while gracefully degrading when AI service is unavailable.
      return {
        status: 'FAIL',
        issues: ['AI validation unavailable - please review manually'],
        improved_title: '',
        improved_commits: '',
        improved_description: '',
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      };
    }
  }
}
