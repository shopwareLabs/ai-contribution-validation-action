# Lessons Learned - AI Contribution Validator Action

This document captures problems encountered during development, their solutions, and prevention
strategies for future reference.

## ESLint Configuration & Migration

### Problem: Dual ESLint Configuration Conflicts

**Issue:** Project had both `.eslintrc.json` (legacy) and `eslint.config.js` (flat config) causing
configuration conflicts and inconsistent linting behavior.

**Solution:**

- Complete migration to ESLint v9 flat config system
- Removed legacy `.eslintrc.json` to eliminate conflicts
- Updated security plugin rules for v3.0.1 compatibility
- Proper Prettier integration in flat config format

**Prevention Strategy:**

- Use only one ESLint configuration format per project
- When migrating, completely remove legacy configuration files
- Verify plugin compatibility with target ESLint version

## Testing Infrastructure & Mocking

### Problem: Vitest Mock Hoisting Limitations

**Issue:** Complex external dependencies like GoogleGenerativeAI SDK couldn't be properly mocked due
to vitest hoisting limitations causing "Cannot access before initialization" errors.

**Solution:**

- Developed class-based mock pattern for complex dependencies
- Created self-contained mock structure avoiding hoisting issues
- Enabled isolated unit testing of real API integration logic

**Prevention Strategy:**

- Use class-based mocks for complex external dependencies
- Test mock patterns early in development
- Document mock patterns for team consistency

### Problem: Module Auto-Execution in Tests

**Issue:** Production code was executing during test runs due to top-level function calls, causing
test duplication and unpredictable behavior.

**Solution:**

- Added `process.argv` check to prevent auto-execution during tests
- Implemented proper module isolation patterns
- Created comprehensive test fixtures for realistic scenarios

**Prevention Strategy:**

- Always guard module execution with environment checks
- Separate module exports from execution logic
- Use proper test isolation from project start

### Problem: Test Logic in Production Code

**Issue:** Production code contained hardcoded test cases and test-specific logic, violating
separation of concerns.

**Solution:**

- Complete removal of test logic from production code
- Proper encapsulation with private fields (`#octokit`)
- Clean architecture with production/test separation

**Prevention Strategy:**

- Enforce strict separation between production and test code
- Use private fields for true encapsulation
- Regular code reviews to catch test logic in production

## API Integration & SDK Management

### Problem: MSW SDK Interception Limitations

**Issue:** MSW cannot intercept SDK-level API calls, only HTTP requests, limiting integration
testing capabilities.

**Solution:**

- Documented SDK interception limitations clearly
- Implemented dual testing strategy (unit tests + HTTP-level integration tests)
- Created comprehensive mock handlers for realistic API simulation

**Prevention Strategy:**

- Understand testing tool limitations early
- Design testing strategy around tool capabilities
- Document architectural decisions and constraints

### Problem: GitHub API Rate Limit Handling

**Issue:** GitHub API rate limits could cause validation failures without proper retry logic.

**Solution:**

- Implemented exponential backoff retry mechanism (1s, 2s delays)
- Added comprehensive error detection for HTTP 403/429 responses
- Used `global.setTimeout` for Node.js compatibility

**Prevention Strategy:**

- Implement retry logic early for all external API calls
- Test rate limit scenarios with proper mocking
- Use appropriate timing functions for target runtime environment

## Build & Distribution

### Problem: Bundle Size Optimization

**Issue:** Initial bundle size exceeded optimal GitHub Actions startup time requirements.

**Solution:**

- Used @vercel/ncc for single-file distribution optimization
- Generated source maps for production debugging
- Achieved 1.18MB optimized bundle with full dependency inclusion

**Prevention Strategy:**

- Monitor bundle size throughout development
- Set bundle size thresholds in CI pipeline
- Regular bundle analysis and optimization

## Error Handling & User Experience

### Problem: Unclear API Error Messages

**Issue:** Generic error messages provided poor user experience and debugging information.

**Solution:**

- Added 404/403 error disambiguation with specific messages
- Implemented user-friendly error guidance
- Enhanced error context with actionable suggestions

**Prevention Strategy:**

- Design error messages from user perspective
- Provide specific guidance for error resolution
- Test error scenarios thoroughly

### Problem: Timeout Management

**Issue:** Long-running operations could exceed GitHub Actions timeout limits.

**Solution:**

- Implemented 30-second timeout using Promise.race pattern
- Added graceful timeout handling with proper cleanup
- Enhanced test coverage for timeout scenarios

**Prevention Strategy:**

- Set realistic timeout limits based on platform constraints
- Test timeout scenarios thoroughly
- Provide clear feedback for timeout conditions

## CI/CD Pipeline Maintenance

### Problem: GitHub Actions Deprecation Warnings

**Issue:** codecov-action@v5 upgrade introduced breaking parameter changes where `file:` was
deprecated in favor of `files:`, causing workflow warnings.

**Solution:**

- Used Context7 documentation to identify correct parameter mappings
- Updated `.github/workflows/ci.yml` with `files:` parameter (comma-separated list format)
- Added codecov-action library ID to CLAUDE.md for consistent future references
- Documented CI/CD maintenance architectural decision in DEVELOPMENT.md

**Prevention Strategy:**

- Proactive dependency audits using Context7 documentation for accurate parameter mappings
- Immediate resolution of deprecation warnings to prevent breaking changes
- Documentation of library IDs in CLAUDE.md for consistent future references
- Regular monitoring of GitHub Actions ecosystem updates and version pinning with semantic
  versioning
