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

- **development/SESSIONS.md**: Development session history
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
