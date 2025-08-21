# Development

## Prerequisites

- Node.js 20+
- npm 10+
- GitHub token with repo and pull_request permissions
- Gemini API key

## Setup

```bash
npm install
npm run test:watch
```

## Workflow

### TDD (Test-Driven Development)

1. Write failing test
2. Run tests (TDD Guard enforces this)
3. Write minimal code to pass
4. Refactor with green tests
5. Repeat

### Commits

Format: `type(scope): description`

Examples:

- `feat(validator): add retry logic`
- `fix(github-client): handle rate limits`
- `test(gemini): add timeout handling`

## Code Standards

### Architecture Rules

- Use dependency injection for all external dependencies
- Prefer composition over inheritance
- Create abstractions for third-party integrations
- Separate domain logic from infrastructure concerns

### Class Design

- Classes should be small and focused on single responsibility
- Constructor injection for dependencies
- Immutable objects where possible
- No public fields - use methods to expose behavior

### Method Guidelines

- Early returns instead of nested conditionals
- Extract complex logic into private methods
- Avoid deep nesting through method extraction
- Use descriptive parameter and return types

### Naming Conventions

- Classes: `PascalCase` with descriptive nouns
- Methods: `camelCase` with action verbs
- Interfaces: `PascalCase` starting with `I` prefix
- Types: `PascalCase` ending with `Type` suffix
- Constants: `SCREAMING_SNAKE_CASE`

## Commands

### Testing

```bash
npm test                  # Run all tests with coverage
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:watch        # TDD mode
npm run test:ui           # Visual interface
npm run test:debug        # Verbose output
```

### Code Quality

```bash
npm run lint          # Check code style
npm run format        # Auto-format code
npm run typecheck     # TypeScript validation
npm run validate      # Run all checks
```

### Build

```bash
npm run build         # Compile TypeScript
npm run package       # Create distribution bundle
```

## Documentation Files

- **development/LESSONS_LEARNED.md**: Technical problems and solutions

## Architecture

### Key Patterns

- **Dependency Injection**: Constructor injection for testing and mocking
- **Provider Agnostic**: AI client interface enables provider switching
- **Timeout Protection**: Promise.race pattern prevents workflow hangs
- **Graceful Degradation**: Continues with reduced functionality when services unavailable

### Implementation

- **Private Fields**: `#` syntax for encapsulation
- **Parallel API Calls**: Promise.all() for GitHub API optimization
- **Exponential Backoff**: Progressive retry delays for rate limits
- **Input Validation**: Fail-fast at method boundaries
- **MSW Integration**: HTTP-level API mocking for integration tests

### AI Client Architecture

**Decision**: Provider-agnostic interface with Gemini as primary provider. **Rationale**: Enable
future AI provider swapping without changing core validation logic. **Benefits**: Real API
integration, structured response schema, token usage tracking, graceful error handling.

## Architecture Decisions

### Structured Validation Format

**Decision**: Structured validation with PASS/FAIL/WARNINGS status and AI improvement suggestions.
**Rationale**: Contributors need specific guidance beyond simple pass/fail results. **Benefits**:
Clear categorization, actionable feedback, consistent response format.

### Project Status Communication

**Decision**: Prominent experimental disclaimer in README. **Rationale**: Prevents misuse and sets
proper expectations for early adopters. **Benefits**: Clear communication, reduced support burden.

### CI/CD Pipeline Maintenance

**Decision**: Proactive dependency upgrades and deprecation warning resolution. **Rationale**:
Prevents breaking changes and maintains compatibility with platform updates. **Benefits**: Stable
pipeline, access to latest features, documented library references.

### Test Coverage Strategy

**Decision**: Comprehensive coverage focusing on error paths and edge cases. **Rationale**: Error
handling is critical for GitHub Actions reliability. **Benefits**: Clear error messages, graceful
degradation, fallback mode coverage.

### Fallback Mode Design

**Decision**: Graceful degradation with multiple fallback levels. **Rationale**: Actions should
never fail silently when external services are down. **Benefits**: Full → GitHub-only → minimal
validation modes with consistent response structure.

### Error Handling Patterns

**Decision**: Consistent error wrapping with context-specific messages. **Rationale**: External API
errors need translation into actionable user guidance. **Benefits**: Distinguishes user vs system
errors, provides specific guidance, preserves debug info.

### Bot Exclusion Pattern

**Decision**: Comma-separated author list for bot exclusion with early return skip. **Rationale**:
Dependency bots follow different patterns and waste AI API costs. **Benefits**: Performance
optimization, cost control, flexible configuration, clear feedback.

```yaml
skip-authors: 'dependabot[bot],renovate[bot],github-actions[bot]'
```

### Idempotent Comment Management

**Decision**: Check for existing comments before creating new ones, update if found. **Rationale**:
Prevents duplicate comments on force-push and re-run scenarios, maintaining clean PR interface.
**Implementation**: Nested try-catch pattern with graceful fallback ensures reliability even when
comments are deleted between operations. **Benefits**: Single comment thread per validator,
preserved comment history, support for multiple validators via unique identifiers, resilient error
handling.

### GitHub Token Flexibility

**Decision**: Remove strict token format validation to support automatic GITHUB_TOKEN.
**Rationale**: Automatic tokens don't follow classic patterns, forcing unnecessary PAT creation.
**Benefits**: Simplicity, security, compatibility with all token types, future-proof design.

### PR Comment Creation Pattern

**Decision**: PR comment creation with configurable identifiers and action outputs. **Rationale**:
Users need immediate feedback in PR interface, not hidden console logs. **Benefits**: Direct
visibility, multi-validator support, CI/CD integration, audit trail, stateless design.

## Project Structure

```
src/
├── index.ts              # Entry point
├── core/                 # Validation logic
│   ├── validator.ts      # Orchestrator with dependency injection
│   └── formatter.ts      # Markdown result formatting
├── github/               # GitHub API client
│   └── client.ts         # PR data extraction, comments, status
├── ai/                   # AI provider clients
│   └── gemini-client.ts  # Gemini API integration
├── config/               # Configuration
└── utils/                # Utilities

test/
├── unit/                 # Unit tests with dependency mocking
├── integration/          # End-to-end workflow tests with MSW
├── mocks/                # MSW handlers and server setup
└── fixtures/             # Test data and GitHub webhook events

dist/
└── index.js              # Production bundle
```

## Local Testing

```bash
# Test with act (GitHub Actions locally)
act pull_request -e test/fixtures/pr-event.json
```

## Environment Variables

```bash
export GITHUB_TOKEN="ghp_..."
export GEMINI_API_KEY="..."
export INPUT_GUIDELINES_FILE="CONTRIBUTING.md"
export GITHUB_REPOSITORY="owner/repo"
export GITHUB_EVENT_PATH="test/fixtures/pr-event.json"
```

## Testing Architecture

### MSW Integration Testing

**Pattern**: Mock Service Worker for HTTP-level API mocking in integration tests.

**Strategy**:

- Direct fetch() testing for MSW handler verification
- SDK instantiation testing for interface validation
- Unit tests with vi.mock() for isolated component testing

**Limitation**: Cannot intercept SDK internal HTTP clients - uses dual testing approach.
