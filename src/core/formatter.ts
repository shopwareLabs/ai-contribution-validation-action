/**
 * Result Formatter
 *
 * Converts AI validation responses into formatted markdown comments
 * for GitHub PR feedback with proper categorization and styling.
 *
 * Design Pattern: Separates issues (problems to fix) from improvements
 * (AI suggestions for enhancement). This dual approach provides both
 * critical feedback and constructive suggestions, making the validation
 * more helpful than simple pass/fail messaging.
 */

export interface ValidationResult {
  status: 'PASS' | 'FAIL' | 'WARNINGS';
  issues: string[];
  improved_title: string;
  improved_commits: string;
  improved_description: string;
}

/**
 * Formats structured validation results into rich markdown for GitHub PR comments.
 * Uses emojis and clear sections to make feedback actionable and user-friendly.
 *
 * Status-Specific Messaging Design:
 * The formatter uses distinct improvement headers based on validation status to
 * prevent contributor confusion about whether changes are required:
 * - PASS: "Optional Enhancements" with explicit messaging that PR is ready to merge
 * - WARNINGS: "Suggested Improvements" for recommended but not blocking changes
 * - FAIL: "Required Improvements" for changes that must be made before merging
 *
 * This clarity pattern was introduced after contributors expressed confusion when
 * passed PRs included suggestions, unsure if action was needed. The differentiated
 * headers and explanatory text ensure clear communication of expectations.
 */
export class ResultFormatter {
  formatToMarkdown(validationResult: ValidationResult): string {
    let markdown = '## 🤖 AI Validation Results\n\n';

    if (validationResult.status === 'PASS') {
      markdown += '### Status: ✅ Passed\n';
      markdown += 'Great work! Your contribution meets our guidelines.\n\n';
    } else if (validationResult.status === 'WARNINGS') {
      markdown += '### Status: ⚠️ Passed with Warnings\n';
      markdown +=
        'Your contribution looks good, but consider these suggestions for improvement.\n\n';
    } else {
      markdown += '### Status: ❌ Needs Improvement\n';
      markdown +=
        'Your contribution needs some changes to meet our guidelines.\n\n';
    }

    // Add issues section for all status types
    markdown += '### 📋 Issues Found:\n';
    if (validationResult.issues.length === 0) {
      markdown += '_No issues detected_\n\n';
    } else {
      markdown += '\n';
      validationResult.issues.forEach(issue => {
        const truncatedIssue =
          issue.length > 1000 ? `${issue.substring(0, 1000)}...` : issue;
        markdown += `- ${truncatedIssue}\n`;
      });
      markdown += '\n';
    }

    // Add improvements section if any improvements exist
    // Only show suggestions when AI provides meaningful content, avoiding
    // empty sections that would clutter the PR comment
    const hasImprovements =
      validationResult.improved_title.trim() !== '' ||
      validationResult.improved_commits.trim() !== '' ||
      validationResult.improved_description.trim() !== '';

    if (hasImprovements) {
      // Status-specific headers communicate the urgency and requirement level of suggestions.
      // This conditional logic ensures contributors understand whether AI suggestions are
      // mandatory fixes (FAIL), recommended improvements (WARNINGS), or optional ideas (PASS).
      // The PASS status includes additional explanatory text to explicitly state that the
      // PR is ready to merge, addressing a common point of confusion.
      if (validationResult.status === 'PASS') {
        markdown += '### 💡 Optional Enhancements:\n\n';
        markdown +=
          'Your PR meets all requirements and is ready to merge. The following suggestions are optional enhancements you might consider for future contributions:\n\n';
      } else if (validationResult.status === 'WARNINGS') {
        markdown += '### ⚠️ Suggested Improvements:\n\n';
      } else {
        markdown += '### ✨ Required Improvements:\n\n';
      }

      if (validationResult.improved_title.trim() !== '') {
        markdown += '#### 📝 Suggested PR Title:\n';
        markdown += '```\n';
        markdown += `${validationResult.improved_title}\n`;
        markdown += '```\n\n';
      }

      if (validationResult.improved_commits.trim() !== '') {
        markdown += '#### 📋 Suggested Commit Message:\n';
        markdown += '```\n';
        markdown += `${validationResult.improved_commits}\n`;
        markdown += '```\n\n';
      }

      if (validationResult.improved_description.trim() !== '') {
        markdown += '#### 📄 Suggested PR Description:\n';
        markdown += '```\n';
        markdown += `${validationResult.improved_description}\n`;
        markdown += '```\n\n';
      }
    }

    // Add footer
    const timestamp = `${new Date().toISOString().replace('T', ' ').split('.')[0]} UTC`;
    markdown += '---\n';
    markdown +=
      '*Automated validation based on [contribution guidelines](CONTRIBUTING.md)*\n';
    markdown += `_Last updated: ${timestamp}_\n`;

    return markdown;
  }
}
