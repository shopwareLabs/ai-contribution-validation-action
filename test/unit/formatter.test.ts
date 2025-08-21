/**
 * Result Formatter Tests
 *
 * Tests for converting structured AI validation responses into formatted markdown
 * comments with improvement suggestions for GitHub PR feedback.
 */

import { describe, it, expect } from 'vitest';
import {
  ResultFormatter,
  type ValidationResult,
} from '../../src/core/formatter';

describe('ResultFormatter', () => {
  describe('structured format validation', () => {
    it('should format failed validation with issues and improvements', () => {
      const formatter = new ResultFormatter();
      const validationResult: ValidationResult = {
        status: 'FAIL',
        issues: [
          "Commit message doesn't follow conventional format",
          'PR description lacks test plan section',
        ],
        improved_title: 'feat(validator): add structured validation output',
        improved_commits:
          'feat(validator): add structured validation output\n\nImplement structured JSON format for better CI/CD integration.',
        improved_description:
          '## What\nAdd structured validation\n## Why\nBetter feedback',
      };

      const markdown = formatter.formatToMarkdown(validationResult);

      expect(markdown).toContain('## 🤖 AI Validation Results');
      expect(markdown).toContain('### Status: ❌ Needs Improvement');
      expect(markdown).toContain(
        'Your contribution needs some changes to meet our guidelines.'
      );
      expect(markdown).toContain('### 📋 Issues Found:');
      expect(markdown).toContain(
        "- Commit message doesn't follow conventional format"
      );
      expect(markdown).toContain('- PR description lacks test plan section');
      expect(markdown).toContain('### ✨ Specific Improvements:');
      expect(markdown).toContain('#### 📝 Suggested PR Title:');
      expect(markdown).toContain(
        'feat(validator): add structured validation output'
      );
      expect(markdown).toContain('#### 📋 Suggested Commit Message:');
      expect(markdown).toContain('Implement structured JSON format');
      expect(markdown).toContain('#### 📄 Suggested PR Description:');
      expect(markdown).toContain('## What\nAdd structured validation');
    });

    it('should format passed validation results', () => {
      const formatter = new ResultFormatter();
      const validationResult: ValidationResult = {
        status: 'PASS',
        issues: [],
        improved_title: '',
        improved_commits: '',
        improved_description: '',
      };

      const markdown = formatter.formatToMarkdown(validationResult);

      expect(markdown).toContain('## 🤖 AI Validation Results');
      expect(markdown).toContain('### Status: ✅ Passed');
      expect(markdown).toContain(
        'Great work! Your contribution meets our guidelines.'
      );
      expect(markdown).toContain('### 📋 Issues Found:');
      expect(markdown).toContain('_No issues detected_');
      expect(markdown).not.toContain('### ✨ Specific Improvements:');
    });

    it('should format validation with warnings', () => {
      const formatter = new ResultFormatter();
      const validationResult: ValidationResult = {
        status: 'WARNINGS',
        issues: ['Consider adding more detailed commit messages'],
        improved_title: '',
        improved_commits:
          'feat(validator): add structured validation output\n\nImplement structured JSON format with detailed explanation of why this change improves the developer experience.',
        improved_description: '',
      };

      const markdown = formatter.formatToMarkdown(validationResult);

      expect(markdown).toContain('### Status: ⚠️ Passed with Warnings');
      expect(markdown).toContain(
        'Your contribution looks good, but consider these suggestions for improvement.'
      );
      expect(markdown).toContain(
        '- Consider adding more detailed commit messages'
      );
      expect(markdown).toContain('#### 📋 Suggested Commit Message:');
      expect(markdown).not.toContain('#### 📝 Suggested PR Title:');
      expect(markdown).not.toContain('#### 📄 Suggested PR Description:');
    });

    it('should include timestamp and footer', () => {
      const formatter = new ResultFormatter();
      const validationResult: ValidationResult = {
        status: 'PASS',
        issues: [],
        improved_title: '',
        improved_commits: '',
        improved_description: '',
      };

      const markdown = formatter.formatToMarkdown(validationResult);

      expect(markdown).toContain('---');
      expect(markdown).toContain(
        '*Automated validation based on [contribution guidelines](CONTRIBUTING.md)*'
      );
      expect(markdown).toContain('_Last updated:');
      expect(markdown).toContain('UTC_');
    });

    it('should truncate overly long issues', () => {
      const formatter = new ResultFormatter();
      const longIssue = 'A'.repeat(1500);
      const validationResult: ValidationResult = {
        status: 'FAIL',
        issues: [longIssue],
        improved_title: '',
        improved_commits: '',
        improved_description: '',
      };

      const markdown = formatter.formatToMarkdown(validationResult);

      expect(markdown).toContain('...');
      expect(markdown.length).toBeLessThan(3000);
    });

    it('should handle empty improvement fields gracefully', () => {
      const formatter = new ResultFormatter();
      const validationResult: ValidationResult = {
        status: 'FAIL',
        issues: ['Some issue'],
        improved_title: '',
        improved_commits: '',
        improved_description: '',
      };

      const markdown = formatter.formatToMarkdown(validationResult);

      expect(markdown).not.toContain('### ✨ Specific Improvements:');
      expect(markdown).not.toContain('#### 📝 Suggested PR Title:');
      expect(markdown).not.toContain('#### 📋 Suggested Commit Message:');
      expect(markdown).not.toContain('#### 📄 Suggested PR Description:');
    });

    it('should format individual improvement sections only when content exists', () => {
      const formatter = new ResultFormatter();
      const validationResult: ValidationResult = {
        status: 'WARNINGS',
        issues: ['Minor issue'],
        improved_title: 'Better title',
        improved_commits: '',
        improved_description: 'Better description',
      };

      const markdown = formatter.formatToMarkdown(validationResult);

      expect(markdown).toContain('### ✨ Specific Improvements:');
      expect(markdown).toContain('#### 📝 Suggested PR Title:');
      expect(markdown).toContain('Better title');
      expect(markdown).not.toContain('#### 📋 Suggested Commit Message:');
      expect(markdown).toContain('#### 📄 Suggested PR Description:');
      expect(markdown).toContain('Better description');
    });
  });
});
