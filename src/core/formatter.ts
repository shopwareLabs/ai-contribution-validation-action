/**
 * Result Formatter
 *
 * Converts AI validation responses into formatted markdown comments
 * for GitHub PR feedback with proper categorization and styling.
 */

export interface ValidationResult {
  valid: boolean;
  suggestions: string[];
}

export class ResultFormatter {
  formatToMarkdown(validationResult: ValidationResult): string {
    let markdown = '## 🤖 AI Validation Results\n\n';

    if (validationResult.valid) {
      markdown += '✅ **Validation Passed**\n';
    } else {
      markdown += '❌ **Validation Failed**\n\n';

      if (validationResult.suggestions.length > 0) {
        // Check for errors
        const errors = validationResult.suggestions.filter(s =>
          s.startsWith('ERROR:')
        );
        if (errors.length > 0) {
          markdown += '### 🚨 Errors\n\n';
          errors.forEach(error => {
            const cleanedError = error.replace('ERROR: ', '');
            const truncatedError =
              cleanedError.length > 1000
                ? `${cleanedError.substring(0, 1000)}...`
                : cleanedError;
            markdown += `- ${truncatedError}\n`;
          });
        }

        // Check for warnings
        const warnings = validationResult.suggestions.filter(s =>
          s.startsWith('WARNING:')
        );
        if (warnings.length > 0) {
          markdown += '### ⚠️ Warnings\n\n';
          warnings.forEach(warning => {
            const cleanedWarning = warning.replace('WARNING: ', '');
            const truncatedWarning =
              cleanedWarning.length > 1000
                ? `${cleanedWarning.substring(0, 1000)}...`
                : cleanedWarning;
            markdown += `- ${truncatedWarning}\n`;
          });
        }

        // Check for suggestions
        const suggestions = validationResult.suggestions.filter(s =>
          s.startsWith('SUGGESTION:')
        );
        if (suggestions.length > 0) {
          markdown += '### 💡 Suggestions\n\n';
          suggestions.forEach(suggestion => {
            const cleanedSuggestion = suggestion.replace('SUGGESTION: ', '');
            const truncatedSuggestion =
              cleanedSuggestion.length > 1000
                ? `${cleanedSuggestion.substring(0, 1000)}...`
                : cleanedSuggestion;
            markdown += `- ${truncatedSuggestion}\n`;
          });
        }

        // Handle uncategorized suggestions
        const uncategorized = validationResult.suggestions.filter(
          s =>
            !s.startsWith('ERROR:') &&
            !s.startsWith('WARNING:') &&
            !s.startsWith('SUGGESTION:')
        );
        if (uncategorized.length > 0) {
          markdown += '### Suggestions\n\n';
          uncategorized.forEach(suggestion => {
            markdown += `- ${suggestion}\n`;
          });
        }
      }

      // Generate actionable next steps
      markdown += '\n## 📝 Next Steps\n\n';
      let stepNumber = 1;

      validationResult.suggestions.forEach(suggestion => {
        if (suggestion.startsWith('ERROR: Missing unit tests')) {
          markdown += `${stepNumber}. Add unit tests for your changes\n`;
          stepNumber++;
        } else if (suggestion.startsWith('WARNING: Large PR size')) {
          markdown += `${stepNumber}. Break down large PR into smaller, focused changes\n`;
          stepNumber++;
        }
      });
    }

    return markdown;
  }
}
