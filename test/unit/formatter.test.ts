/**
 * Result Formatter Tests
 *
 * Tests for converting AI validation responses into formatted markdown
 * comments for GitHub PR feedback.
 */

import { describe, it, expect } from 'vitest';
import {
  ResultFormatter,
  type ValidationResult,
} from '../../src/core/formatter';

describe('ResultFormatter', () => {
  describe('markdown formatting', () => {
    it('should format validation results into markdown comments', () => {
      const formatter = new ResultFormatter();
      const validationResult: ValidationResult = {
        valid: false,
        suggestions: ['Add unit tests', 'Update documentation'],
      };

      const markdown = formatter.formatToMarkdown(validationResult);

      expect(markdown).toContain('## 🤖 AI Validation Results');
      expect(markdown).toContain('❌ **Validation Failed**');
      expect(markdown).toContain('Add unit tests');
      expect(markdown).toContain('Update documentation');
    });

    it('should format successful validation results', () => {
      const formatter = new ResultFormatter();
      const validationResult: ValidationResult = {
        valid: true,
        suggestions: [],
      };

      const markdown = formatter.formatToMarkdown(validationResult);

      expect(markdown).toContain('## 🤖 AI Validation Results');
      expect(markdown).toContain('✅ **Validation Passed**');
    });

    it('should categorize suggestions by type', () => {
      const formatter = new ResultFormatter();
      const validationResult: ValidationResult = {
        valid: false,
        suggestions: [
          'ERROR: Missing unit tests',
          'WARNING: Large PR size',
          'SUGGESTION: Consider refactoring',
        ],
      };

      const markdown = formatter.formatToMarkdown(validationResult);

      expect(markdown).toContain('### 🚨 Errors');
      expect(markdown).toContain('### ⚠️ Warnings');
      expect(markdown).toContain('### 💡 Suggestions');
      expect(markdown).toContain('Missing unit tests');
      expect(markdown).toContain('Large PR size');
      expect(markdown).toContain('Consider refactoring');
    });

    it('should truncate overly long suggestions', () => {
      const formatter = new ResultFormatter();
      const longSuggestion = 'A'.repeat(1500); // 1500 characters
      const validationResult: ValidationResult = {
        valid: false,
        suggestions: [`ERROR: ${longSuggestion}`],
      };

      const markdown = formatter.formatToMarkdown(validationResult);

      expect(markdown).toContain('### 🚨 Errors');
      expect(markdown).toContain('...');
      expect(markdown.length).toBeLessThan(2000); // Should be truncated
    });

    it('should generate actionable improvement suggestions', () => {
      const formatter = new ResultFormatter();
      const validationResult: ValidationResult = {
        valid: false,
        suggestions: ['ERROR: Missing unit tests', 'WARNING: Large PR size'],
      };

      const markdown = formatter.formatToMarkdown(validationResult);

      expect(markdown).toContain('## 📝 Next Steps');
      expect(markdown).toContain('1. Add unit tests');
      expect(markdown).toContain('2. Break down large PR into smaller');
    });

    it('should truncate warnings and suggestions as well as errors', () => {
      const formatter = new ResultFormatter();
      const longText = 'B'.repeat(1500);
      const validationResult: ValidationResult = {
        valid: false,
        suggestions: [`WARNING: ${longText}`, `SUGGESTION: ${longText}`],
      };

      const markdown = formatter.formatToMarkdown(validationResult);

      expect(markdown).toContain('### ⚠️ Warnings');
      expect(markdown).toContain('### 💡 Suggestions');
      expect(markdown.split('...').length).toBeGreaterThan(2); // Should have multiple truncations
    });
  });
});
