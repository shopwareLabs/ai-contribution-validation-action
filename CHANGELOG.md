# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-08-20

### Added

- **AI-Powered PR Validation**: Complete GitHub Action using Google Gemini AI to validate pull
  requests against contribution guidelines
- **GitHub Integration**: Full GitHub API client with PR data extraction, comment management, and
  commit status updates
- **Gemini AI Client**: Google Generative AI integration with structured JSON response parsing and
  token usage tracking
- **Validation Orchestrator**: Core validator with dependency injection, timeout protection (30s),
  and graceful error handling
- **Markdown Formatting**: Professional result formatter for PR comments with categorized
  suggestions
- **Rate Limit Handling**: Exponential backoff retry mechanism for GitHub API rate limits
- **Comprehensive Testing**: 98.89% test coverage with unit, integration, and performance tests
- **MSW Integration**: HTTP-level API mocking for realistic integration testing
- **Error Recovery**: Graceful degradation when AI services are unavailable
- **TDD Architecture**: Complete test-driven development with 74 passing tests
- **Production Bundle**: Optimized 1.18MB distribution bundle using @vercel/ncc
- **CI/CD Pipeline**: Complete GitHub Actions workflow with self-validation

### Features

- Validates PR title, body, commit messages, and file changes against custom guidelines
- Creates and updates PR comments with validation feedback
- Sets commit status checks for CI/CD integration
- Supports both Gemini 1.5 Flash and Pro models
- Handles multiple error scenarios (network issues, API failures, rate limits)
- Configurable guidelines file (CONTRIBUTING.md, etc.)
- Token usage tracking and cost monitoring
- Timeout protection to prevent GitHub Actions hangs

### Technical Highlights

- **Architecture**: Dependency injection pattern with provider-agnostic AI client interface
- **Performance**: Sub-30-second validation workflow with parallel API calls
- **Reliability**: Comprehensive error handling with fallback responses
- **Testing**: MSW for HTTP mocking, Vitest for testing framework, 98.89% coverage
- **Code Quality**: ESLint v9 flat config, Prettier formatting, TypeScript strict mode
- **Security**: Private field encapsulation, input validation, no hardcoded secrets

### Documentation

- Complete README.md with usage examples and configuration options
- Comprehensive API documentation for all components
- Development guide with TDD workflow and architecture patterns
- Troubleshooting guide with common issues and solutions

### Initial Release Notes

This is the initial release of the AI Contribution Validator Action, providing a complete solution
for automated PR validation using AI. The action is production-ready with comprehensive testing and
follows GitHub Actions best practices.

**Minimum Requirements:**

- Node.js 20+
- GitHub token with `repo` and `pull_request` permissions
- Google Gemini API key

**Usage:**

```yaml
- uses: shopware/ai-contribution-validation-action@v0.1.0
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
```

[0.1.0]: https://github.com/shopware/ai-contribution-validation-action/releases/tag/v0.1.0
