# Structured JSON Validation Output - Implementation Plan

## Overview

Replace the current simple validation output (`valid` boolean + `suggestions` array) with a
comprehensive structured JSON format that provides categorized feedback, severity levels, and
actionable insights for better CI/CD integration.

## Reference

This implementation is based on user requirements for structured validation output format inspired
by GitHub workflow patterns. See: `.github/workflows/validate-pr.yml` in this repository for current
validation workflow usage.

## Current State Analysis

### Existing ValidationResult Interface

```typescript
interface ValidationResult {
  valid: boolean;
  suggestions: string[];
}
```

### Current Limitations

- No categorization of feedback (commit messages vs. code quality vs. PR description)
- No severity levels (errors vs. warnings vs. suggestions)
- No actionable metadata (affected files, line numbers, rule violations)
- Limited CI/CD integration capabilities
- Difficult to generate meaningful analytics

## Proposed Solution: Structured JSON Format

### 1. Core Type Definitions

Create `src/types/validation.ts`:

```typescript
export interface StructuredValidationResult {
  valid: boolean;
  summary: ValidationSummary;
  categories: ValidationCategories;
  details: ValidationDetail[];
  metadata: ValidationMetadata;
}

export interface ValidationSummary {
  totalIssues: number;
  errors: number;
  warnings: number;
  suggestions: number;
  score: number; // 0-100 overall quality score
}

export interface ValidationCategories {
  commitMessages: ValidationCategory;
  prDescription: ValidationCategory;
  codeQuality: ValidationCategory;
  guidelines: ValidationCategory;
}

export interface ValidationCategory {
  status: 'pass' | 'fail' | 'warning';
  score: number; // 0-100 category score
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  rule?: string;
  fix?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ValidationDetail {
  id: string; // Unique identifier for tracking
  type: 'commit' | 'description' | 'code' | 'guideline';
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  context?: ValidationContext;
  suggestion?: string;
  autoFixable?: boolean;
}

export interface ValidationContext {
  file?: string;
  line?: number;
  commit?: string;
  section?: string; // For PR description sections
}

export interface ValidationMetadata {
  validatedAt: string; // ISO timestamp
  modelUsed: string;
  tokenUsage: TokenUsage;
  validationDuration: number; // milliseconds
  rulesApplied: string[];
}
```

### 2. Enhanced Gemini Client Updates

Update `src/ai/gemini-client.ts`:

```typescript
// Update prompt to request structured response
const structuredPrompt = `${prompt}

Return a comprehensive JSON analysis with this exact structure:
{
  "valid": boolean,
  "summary": {
    "totalIssues": number,
    "errors": number,
    "warnings": number,
    "suggestions": number,
    "score": number (0-100)
  },
  "categories": {
    "commitMessages": {
      "status": "pass|fail|warning",
      "score": number (0-100),
      "issues": [
        {
          "severity": "error|warning|suggestion",
          "message": "specific issue description",
          "rule": "rule name",
          "fix": "specific fix instruction",
          "priority": "high|medium|low"
        }
      ]
    },
    "prDescription": { /* same structure */ },
    "codeQuality": { /* same structure */ },
    "guidelines": { /* same structure */ }
  },
  "details": [
    {
      "id": "unique_id",
      "type": "commit|description|code|guideline",
      "severity": "error|warning|suggestion",
      "message": "detailed description",
      "context": {
        "file": "optional file path",
        "line": "optional line number",
        "commit": "optional commit hash",
        "section": "optional section name"
      },
      "suggestion": "actionable fix",
      "autoFixable": boolean
    }
  ]
}

Focus on:
1. Commit message format, clarity, and conventional commits compliance
2. PR description completeness, structure, and required sections
3. Code organization, file changes, and architectural decisions
4. Adherence to project-specific guidelines

Provide specific, actionable feedback with clear priorities.`;

// Update response schema for Gemini API
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    valid: { type: SchemaType.BOOLEAN },
    summary: {
      type: SchemaType.OBJECT,
      properties: {
        totalIssues: { type: SchemaType.NUMBER },
        errors: { type: SchemaType.NUMBER },
        warnings: { type: SchemaType.NUMBER },
        suggestions: { type: SchemaType.NUMBER },
        score: { type: SchemaType.NUMBER },
      },
      required: ['totalIssues', 'errors', 'warnings', 'suggestions', 'score'],
    },
    categories: {
      type: SchemaType.OBJECT,
      properties: {
        commitMessages: {
          /* category schema */
        },
        prDescription: {
          /* category schema */
        },
        codeQuality: {
          /* category schema */
        },
        guidelines: {
          /* category schema */
        },
      },
    },
    details: {
      type: SchemaType.ARRAY,
      items: {
        /* detail schema */
      },
    },
  },
  required: ['valid', 'summary', 'categories', 'details'],
};
```

### 3. Enhanced Formatter Implementation

Create `src/core/structured-formatter.ts`:

```typescript
export class StructuredFormatter {
  formatToMarkdown(result: StructuredValidationResult): string {
    let markdown = this.generateHeader(result);
    markdown += this.generateSummary(result.summary);
    markdown += this.generateCategories(result.categories);
    markdown += this.generateActionableFixes(result.details);
    markdown += this.generateFooter(result.metadata);
    return markdown;
  }

  formatToJSON(result: StructuredValidationResult): string {
    return JSON.stringify(result, null, 2);
  }

  generateActionableOutputs(result: StructuredValidationResult): ActionOutputs {
    return {
      'validation-json': this.formatToJSON(result),
      'has-errors': result.summary.errors > 0,
      'has-warnings': result.summary.warnings > 0,
      'error-count': result.summary.errors,
      'warning-count': result.summary.warnings,
      'quality-score': result.summary.score,
      'validation-status': result.valid ? 'pass' : 'fail',
    };
  }

  private generateHeader(result: StructuredValidationResult): string {
    const emoji = result.valid ? '✅' : '❌';
    const status = result.valid ? 'Passed' : 'Failed';
    const score = result.summary.score;

    return `## 🤖 AI Validation Results

${emoji} **Validation ${status}** (Score: ${score}/100)

`;
  }

  private generateSummary(summary: ValidationSummary): string {
    return `### 📊 Summary

| Metric | Count |
|--------|--------|
| Total Issues | ${summary.totalIssues} |
| Errors | ${summary.errors} |
| Warnings | ${summary.warnings} |
| Suggestions | ${summary.suggestions} |
| Quality Score | ${summary.score}/100 |

`;
  }

  private generateCategories(categories: ValidationCategories): string {
    let markdown = '### 📋 Category Analysis\n\n';

    Object.entries(categories).forEach(([name, category]) => {
      const emoji = this.getCategoryEmoji(category.status);
      const title = this.formatCategoryName(name);

      markdown += `<details>\n<summary>${emoji} ${title} (${category.score}/100)</summary>\n\n`;

      if (category.issues.length > 0) {
        category.issues.forEach(issue => {
          const severityEmoji = this.getSeverityEmoji(issue.severity);
          markdown += `- ${severityEmoji} **${issue.message}**\n`;
          if (issue.fix) {
            markdown += `  - 💡 Fix: ${issue.fix}\n`;
          }
          if (issue.rule) {
            markdown += `  - 📏 Rule: \`${issue.rule}\`\n`;
          }
        });
      } else {
        markdown += '✅ No issues found in this category.\n';
      }

      markdown += '\n</details>\n\n';
    });

    return markdown;
  }
}
```

### 4. Action Output Updates

Update `src/index.ts` to provide structured outputs:

```typescript
// After validation
const structuredResult = await validator.validateStructured(owner, repo, prNumber);

// Generate different output formats
const formatter = new StructuredFormatter();
const markdownResult = formatter.formatToMarkdown(structuredResult);
const jsonResult = formatter.formatToJSON(structuredResult);
const outputs = formatter.generateActionableOutputs(structuredResult);

// Set all outputs
Object.entries(outputs).forEach(([key, value]) => {
  core.setOutput(key, value);
});

// Maintain backward compatibility
const legacyResult = this.convertToLegacyFormat(structuredResult);
const legacyFormatter = new ResultFormatter();
const legacyMarkdown = legacyFormatter.formatToMarkdown(legacyResult);
```

### 5. Backward Compatibility

Create adapter for existing code:

```typescript
export class ValidationResultAdapter {
  static toLegacy(structured: StructuredValidationResult): ValidationResult {
    return {
      valid: structured.valid,
      suggestions: structured.details.map(
        detail => `${detail.severity.toUpperCase()}: ${detail.message}`
      ),
    };
  }

  static fromLegacy(legacy: ValidationResult): StructuredValidationResult {
    // Convert legacy format to structured (for migration)
  }
}
```

## Implementation Steps

### Phase 1: Foundation (Week 1)

1. ✅ Create type definitions in `src/types/validation.ts`
2. ✅ Add validation result adapter for backward compatibility
3. ✅ Update tests to cover new interfaces

### Phase 2: AI Integration (Week 2)

1. ✅ Update Gemini client prompt for structured response
2. ✅ Modify response schema and parsing logic
3. ✅ Add error handling for structured response parsing
4. ✅ Test with real Gemini API responses

### Phase 3: Formatting & Output (Week 3)

1. ✅ Implement StructuredFormatter class
2. ✅ Create enhanced markdown generation
3. ✅ Add JSON output formatting
4. ✅ Update action outputs in index.ts

### Phase 4: Integration & Testing (Week 4)

1. ✅ Update existing tests to use structured format
2. ✅ Add comprehensive integration tests
3. ✅ Test backward compatibility
4. ✅ Update documentation and examples

## Benefits

### For Developers

- **Clearer Feedback**: Categorized issues are easier to understand and prioritize
- **Actionable Insights**: Specific fixes and suggestions for each issue
- **Progress Tracking**: Quality scores show improvement over time

### For CI/CD Systems

- **Better Integration**: Structured JSON can be consumed by other tools
- **Conditional Logic**: Different actions based on error/warning counts
- **Analytics**: Historical tracking of validation metrics

### For Project Maintainers

- **Quality Metrics**: Track project quality trends over time
- **Rule Effectiveness**: See which validation rules are most helpful
- **Contributor Guidance**: Better onboarding through structured feedback

## Example Structured Output

```json
{
  "valid": false,
  "summary": {
    "totalIssues": 5,
    "errors": 2,
    "warnings": 2,
    "suggestions": 1,
    "score": 72
  },
  "categories": {
    "commitMessages": {
      "status": "fail",
      "score": 40,
      "issues": [
        {
          "severity": "error",
          "message": "Commit message doesn't follow conventional format",
          "rule": "conventional-commits",
          "fix": "Use format: type(scope): description",
          "priority": "high"
        }
      ]
    },
    "prDescription": {
      "status": "warning",
      "score": 70,
      "issues": [
        {
          "severity": "warning",
          "message": "PR description lacks test plan section",
          "rule": "test-plan-required",
          "fix": "Add a 'Testing' section describing how changes were tested",
          "priority": "medium"
        }
      ]
    },
    "codeQuality": {
      "status": "pass",
      "score": 90,
      "issues": []
    },
    "guidelines": {
      "status": "warning",
      "score": 80,
      "issues": [
        {
          "severity": "suggestion",
          "message": "Consider adding documentation for new public methods",
          "rule": "documentation-coverage",
          "fix": "Add JSDoc comments to exported functions",
          "priority": "low"
        }
      ]
    }
  },
  "details": [
    {
      "id": "commit-1-format",
      "type": "commit",
      "severity": "error",
      "message": "Commit 'fix stuff' doesn't follow conventional format",
      "context": {
        "commit": "abc123"
      },
      "suggestion": "Rewrite as: 'fix(validator): resolve commit message parsing issue'",
      "autoFixable": false
    }
  ],
  "metadata": {
    "validatedAt": "2024-01-15T10:30:00Z",
    "modelUsed": "gemini-1.5-flash",
    "tokenUsage": {
      "promptTokens": 1500,
      "completionTokens": 800,
      "totalTokens": 2300
    },
    "validationDuration": 2400,
    "rulesApplied": ["conventional-commits", "test-plan-required", "documentation-coverage"]
  }
}
```

## Migration Strategy

1. **Feature Flag**: Add `structured-output` input parameter (default: false)
2. **Parallel Outputs**: Generate both legacy and structured formats
3. **Gradual Adoption**: Users can opt-in to structured format
4. **Documentation**: Provide migration guide and examples
5. **Deprecation**: Eventually deprecate legacy format in major version

## Testing Strategy

1. **Unit Tests**: Test each component in isolation
2. **Integration Tests**: Test full structured validation workflow
3. **API Tests**: Verify Gemini API structured response parsing
4. **Compatibility Tests**: Ensure backward compatibility works
5. **Performance Tests**: Measure impact of structured processing

This implementation will significantly enhance the validation output quality while maintaining
backward compatibility and enabling powerful CI/CD integrations.
