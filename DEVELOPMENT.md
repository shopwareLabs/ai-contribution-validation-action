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

**Decision**: Implement provider-agnostic AI client interface with Gemini as primary provider.

**Rationale**: Enable future AI provider swapping (OpenAI, Anthropic) without changing core
validation logic. Maintain cost visibility and performance monitoring across different providers.

**Implementation Decisions**:

1. **Real API Integration**: Uses GoogleGenerativeAI SDK with Gemini 1.5 Flash model for structured
   JSON responses, replacing pattern-based stub implementation.

2. **Structured Response Schema**: Uses SchemaType enum to enforce JSON structure with 'valid'
   boolean and 'suggestions' array, ensuring consistent API responses.

3. **Token Usage Tracking**: Captures promptTokens, completionTokens, and totalTokens from
   usageMetadata for cost estimation and performance monitoring.

4. **Graceful Error Handling**: Falls back to manual review suggestion when API fails (network,
   auth, rate limits) to prevent workflow blocking.

5. **Test-Driven Implementation**: Built following TDD with class-based mock pattern to overcome
   vitest hoisting limitations with complex external dependencies.

## Architecture Decisions

### Project Status Communication

**Decision**: Add prominent experimental disclaimer at top of README with warning emoji and
blockquote formatting.

**Rationale**: Clear communication that project is not production-ready prevents misuse, sets proper
expectations for early adopters, and reduces support burden from users encountering breaking
changes.

**Implementation**: Positioned disclaimer immediately after title but before badges for maximum
visibility. Uses markdown blockquote with warning emoji and bold formatting to ensure it stands out
visually.

### CI/CD Pipeline Maintenance

**Decision**: Proactively upgrade GitHub Actions dependencies and resolve deprecation warnings to
maintain pipeline reliability.

**Rationale**: GitHub Actions ecosystem evolves rapidly with security improvements and API changes.
Staying current prevents breaking changes, ensures access to latest features, and maintains
compatibility with GitHub's platform updates.

**Implementation**:

- Regular dependency audits using Context7 documentation for accurate parameter mappings
- Immediate resolution of deprecation warnings (e.g., codecov-action@v5 `file` → `files` parameter)
- Documentation of library IDs in CLAUDE.md for consistent future references
- Version pinning with semantic versioning to balance stability and feature access

### Test Coverage Strategy

**Decision**: Target comprehensive coverage focusing on error paths and edge cases rather than just
happy paths.

**Rationale**: Error handling is critical for GitHub Actions reliability. Users depend on clear
error messages and graceful degradation when external services fail.

**Implementation**:

- Input validation tests for all public method parameters
- Error path testing for all external API calls (GitHub, Gemini)
- Fallback mode testing when services are unavailable
- Legacy pattern preservation for backwards compatibility

### Fallback Mode Design

**Decision**: Implement graceful degradation with multiple fallback levels.

**Rationale**: GitHub Actions should never fail silently. When AI services are down, the action
should still provide value through basic validation and clear status updates.

**Fallback Hierarchy**:

1. Full validation with AI + GitHub integration
2. GitHub-only mode (no AI validation)
3. Minimal mode (configuration validation only)
4. Each level returns valid response structure

### Error Handling Patterns

**Decision**: Use consistent error wrapping with context-specific messages.

**Rationale**: External API errors need translation into actionable user guidance. Generic errors
frustrate developers trying to debug issues.

**Patterns**:

- Wrap all external API errors with context
- Distinguish between user errors (403, 404) and system errors (500, timeout)
- Provide specific guidance for each error type
- Preserve original error for debugging while adding user-friendly messages

### Bot Exclusion Pattern

**Decision**: Implement comma-separated author list for bot exclusion with early return validation
skip.

**Rationale**: Dependency management bots (dependabot, renovate) follow different contribution
patterns than human developers. They create PRs with automated commit messages and minimal
descriptions that don't conform to human contribution guidelines. Validating these PRs wastes AI API
costs and creates false positives.

**Implementation**:

- **Early Return Design**: Check author before AI validation to save API costs
- **Flexible Configuration**: Comma-separated list supports multiple bots without code changes
- **Backwards Compatibility**: Optional `skipAuthors` field with empty default preserves existing
  behavior
- **Cost Optimization**: Skipped PRs return immediately without expensive AI API calls
- **Clear Feedback**: Skipped status and descriptive message for transparency

**Usage Pattern**:

```yaml
skip-authors: 'dependabot[bot],renovate[bot],github-actions[bot]'
```

**Architecture Benefits**:

1. **Performance**: No AI validation overhead for automated PRs
2. **Cost Control**: Prevents unnecessary API charges for bot PRs
3. **Flexibility**: Supports any bot by GitHub username without code changes
4. **Transparency**: Clear logging when validation is skipped

### GitHub Token Flexibility

**Decision**: Remove strict token format validation to support GitHub's automatic GITHUB_TOKEN.

**Rationale**: GitHub Actions provides an automatic GITHUB*TOKEN that doesn't follow classic token
patterns (ghp*, github*pat*). Strict regex validation prevented using this convenient automatic
token, forcing users to create PATs unnecessarily. The GitHub API already validates token
authenticity and provides clear error messages for invalid tokens.

**Implementation**:

- Removed regex validation for token formats in both Validator and GitHubClient classes
- Accept any non-empty string as token, delegating validation to GitHub API
- Updated workflow to use `${{ github.token }}` instead of requiring secrets.GITHUB_TOKEN
- Preserved clear error messages from API for authentication failures

**Benefits**:

1. **Simplicity**: Users can use automatic GITHUB_TOKEN without configuration
2. **Security**: No need to create and manage PATs for basic operations
3. **Compatibility**: Works with all GitHub token types (classic, fine-grained, automatic)
4. **Future-proof**: Supports new token formats without code changes

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

**Design Pattern**: Mock Service Worker (MSW) provides HTTP-level API mocking for integration tests.

**Capabilities**:

- Intercepts `fetch()` calls at the network level for realistic testing
- Supports both GitHub REST API and Gemini AI API mocking
- Enables error scenario simulation (rate limits, timeouts, auth failures)

**Limitations**:

- Cannot intercept SDK internal HTTP clients (`@actions/github`, `@google/generative-ai`)
- SDKs bypass MSW's request interception using custom HTTP implementations
- Real SDK calls may hit live APIs during testing

**Dual Testing Strategy**:

1. **Direct fetch() testing**: Verifies MSW handler correctness and response structure
2. **SDK instantiation testing**: Ensures clients can be created and have proper interfaces
3. **Unit tests with vi.mock()**: Isolated testing of individual components

**Files**:

- `test/mocks/handlers.ts`: API response mocks with realistic data structures
- `test/mocks/server.ts`: MSW server lifecycle management
- `test/integration/`: End-to-end workflow tests acknowledging SDK limitations
