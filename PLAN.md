# AI-Powered Contribution Validator GitHub Action

## Project Overview

This plan outlines the development of a standalone GitHub Action that validates pull requests
against contribution guidelines using AI. Based on the existing implementation in the TDD Guard
project, this action will provide automated, intelligent feedback on PR quality.

### Purpose

- Automate contribution quality validation using AI
- Provide actionable feedback on commit messages, PR titles, and descriptions
- Reduce manual review burden while maintaining consistency
- Enforce contribution guidelines across projects

### Key Features

- AI-powered validation using multiple providers (Gemini, OpenAI, Anthropic)
- Intelligent comment management (updates existing comments vs spam)
- Graceful degradation when AI services are unavailable
- Abuse prevention through configurable PR size limits
- Status checks integration for CI/CD workflows
- Customizable validation rules and guidelines

## Technical Architecture

### Core Components

#### 1. Validator Engine (`src/validator.js`)

**Responsibilities:**

- Orchestrate the entire validation process
- Handle AI provider switching and fallbacks
- Coordinate between data extraction, validation, and reporting

**Key Functions:**

- `validateContribution(prData, guidelines, config)`
- `handleValidationResponse(response)`
- `determineValidationStatus(issues, warnings)`

#### 2. PR Data Extractor (`src/pr-extractor.js`)

**Responsibilities:**

- Extract PR metadata (title, body, commits)
- Gather file changes and diff summaries
- Collect commit messages and statistics

**Key Functions:**

- `extractPRData(context)`
- `getCommitMessages(prNumber, limit)`
- `getChangedFiles(prNumber, limit)`
- `getDiffSummary(prNumber, maxLines)`

#### 3. AI Client Factory (`src/ai-clients/`)

**Responsibilities:**

- Abstract different AI providers
- Handle API key management
- Standardize response formats

**Providers:**

- `gemini-client.js` - Google Gemini integration
- `openai-client.js` - OpenAI GPT integration
- `anthropic-client.js` - Claude integration
- `base-client.js` - Common interface

#### 4. Result Formatter (`src/formatter.js`)

**Responsibilities:**

- Convert AI responses to markdown
- Generate status check descriptions
- Format improvement suggestions

**Key Functions:**

- `formatValidationResults(response, timestamp)`
- `createStatusCheckDescription(status, issues)`
- `formatImprovements(suggestions)`

#### 5. GitHub Client (`src/github-client.js`)

**Responsibilities:**

- Manage PR comments (create/update)
- Set status checks
- Handle API errors gracefully

**Key Functions:**

- `updateOrCreateComment(prNumber, body)`
- `setStatusCheck(sha, state, description)`
- `findExistingComment(prNumber)`

### Data Flow

```
1. GitHub Event (PR opened/updated)
   ↓
2. Extract PR Data (title, body, commits, files)
   ↓
3. Load Contribution Guidelines
   ↓
4. Send to AI Provider for Validation
   ↓
5. Parse AI Response (status, issues, suggestions)
   ↓
6. Format Results as Markdown
   ↓
7. Update/Create PR Comment
   ↓
8. Set Status Check
```

## Configuration Schema

### Action Inputs

#### Required

```yaml
github-token:
  description: 'GitHub token for API access'
  required: true

ai-api-key:
  description: 'API key for AI provider'
  required: true
```

#### Optional

```yaml
ai-provider:
  description: 'AI provider to use (gemini, openai, anthropic)'
  required: false
  default: 'gemini'

ai-model:
  description: 'Specific model to use'
  required: false
  default: 'gemini-1.5-flash'

guidelines-file:
  description: 'Path to contribution guidelines file'
  required: false
  default: 'CONTRIBUTING.md'

max-pr-additions:
  description: 'Maximum PR additions to process'
  required: false
  default: '10000'

max-changed-files:
  description: 'Maximum changed files to process'
  required: false
  default: '100'

max-commits:
  description: 'Maximum commits to process'
  required: false
  default: '50'

fail-on-violations:
  description: 'Fail the action when violations are found'
  required: false
  default: 'false'

update-existing-comment:
  description: 'Update existing comments instead of creating new ones'
  required: false
  default: 'true'

status-check-name:
  description: 'Name for the status check'
  required: false
  default: 'Contribution Validator'

custom-validation-rules:
  description: 'Additional validation rules (JSON format)'
  required: false

diff-context-lines:
  description: 'Number of diff lines to include in context'
  required: false
  default: '50'
```

### Action Outputs

```yaml
validation-status:
  description: 'Validation result (PASS, WARNINGS, FAIL)'

issues-found:
  description: 'Number of issues found'

comment-url:
  description: 'URL to the validation comment'

status-check-url:
  description: 'URL to the status check'
```

## Implementation Details

### File Structure

```
action.yml                    # Action metadata
src/
├── validator.js             # Main orchestrator
├── pr-extractor.js          # PR data extraction
├── formatter.js             # Result formatting
├── github-client.js         # GitHub API wrapper
├── ai-clients/              # AI provider clients
│   ├── base-client.js       # Common interface
│   ├── gemini-client.js     # Google Gemini
│   ├── openai-client.js     # OpenAI GPT
│   └── anthropic-client.js  # Anthropic Claude
├── config/
│   ├── default-rules.js     # Default validation rules
│   └── prompts.js           # AI prompt templates
└── utils/
    ├── logger.js            # Logging utilities
    ├── errors.js            # Error handling
    └── validators.js        # Input validation

tests/
├── unit/                    # Unit tests
├── integration/            # Integration tests
└── fixtures/               # Test data

examples/
├── basic-usage.yml         # Simple workflow
├── advanced-config.yml     # Complex configuration
└── multi-repo.yml          # Organization-wide setup

docs/
├── configuration.md        # Configuration guide
├── customization.md        # Customization options
├── troubleshooting.md      # Common issues
└── migration.md            # Migration from inline workflows
```

### AI Prompt Engineering

#### Base Validation Prompt

```
You are validating a contribution to a software project. Analyze the following:

PROJECT CONTEXT: {project_description}

CONTRIBUTION GUIDELINES:
{guidelines_content}

CURRENT CONTRIBUTION:
- PR Title: {pr_title}
- PR Description: {pr_description}
- Commit Messages: {commit_messages}
- Files Changed: {files_changed}
- Changes Summary: {diff_summary}

VALIDATION RULES:
{validation_rules}

Respond with ONLY valid JSON in this format:
{
  "status": "PASS|WARNINGS|FAIL",
  "issues": ["issue1", "issue2"],
  "improved_title": "suggested title",
  "improved_commits": "suggested commit messages",
  "improved_description": "suggested PR description"
}
```

#### Custom Rules Support

Allow projects to extend validation with custom rules:

```json
{
  "custom_rules": [
    {
      "type": "commit_format",
      "pattern": "^(feat|fix|docs|style|refactor|test|chore)\\(.+\\): .+",
      "message": "Commits must follow conventional format with scope"
    },
    {
      "type": "pr_size",
      "max_additions": 500,
      "message": "Keep PRs small for easier review"
    }
  ]
}
```

### Error Handling Strategy

#### 1. AI Service Failures

- Retry with exponential backoff
- Fallback to simpler rule-based validation
- Graceful degradation with neutral status

#### 2. GitHub API Errors

- Retry rate-limited requests
- Handle permission issues gracefully
- Log errors for debugging

#### 3. Configuration Errors

- Validate inputs early
- Provide helpful error messages
- Fail fast with clear guidance

### Security Considerations

#### 1. API Key Management

- Never log API keys
- Support GitHub Secrets integration
- Validate key format before use

#### 2. Input Validation

- Sanitize all user inputs
- Validate file paths for security
- Limit resource consumption

#### 3. Permissions

- Minimal required permissions
- Read-only access to repository content
- Write access only to PR comments and status checks

## Development Roadmap

### Phase 1: Core Functionality (MVP)

**Timeline: 2-3 weeks**

**Features:**

- Basic action structure with action.yml
- Gemini AI integration only
- PR data extraction
- Simple validation rules
- Comment creation/updating
- Status check integration

**Deliverables:**

- Working action for basic use cases
- Documentation for installation
- Example workflows

### Phase 2: Multi-Provider Support

**Timeline: 1-2 weeks**

**Features:**

- OpenAI GPT integration
- Anthropic Claude integration
- Provider fallback mechanism
- Cost optimization features

**Deliverables:**

- Support for major AI providers
- Cost comparison documentation
- Provider-specific optimizations

### Phase 3: Advanced Customization

**Timeline: 2-3 weeks**

**Features:**

- Custom validation rules
- Configurable prompt templates
- Project-specific guidelines parsing
- Advanced formatting options
- Webhook support for external systems

**Deliverables:**

- Comprehensive customization guide
- Template library
- Integration examples

### Phase 4: Enterprise Features

**Timeline: 3-4 weeks**

**Features:**

- Organization-wide configuration
- Analytics and reporting
- Audit logging
- SAML/SSO integration
- On-premises deployment options

**Deliverables:**

- Enterprise deployment guide
- Analytics dashboard
- Compliance documentation

### Phase 5: Marketplace Release

**Timeline: 1-2 weeks**

**Features:**

- GitHub Marketplace optimization
- Comprehensive documentation
- Video tutorials
- Community templates

**Deliverables:**

- Marketplace listing
- Marketing materials
- Community support channels

## Usage Examples

### Basic Usage

```yaml
name: Validate Contributions
on:
  pull_request:
    types: [opened, synchronize, edited]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/contribution-validator-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          ai-api-key: ${{ secrets.GEMINI_API_KEY }}
```

### Advanced Configuration

```yaml
- uses: your-org/contribution-validator-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    ai-api-key: ${{ secrets.OPENAI_API_KEY }}
    ai-provider: openai
    ai-model: gpt-4
    guidelines-file: .github/CONTRIBUTING.md
    max-pr-additions: 2000
    fail-on-violations: true
    custom-validation-rules: |
      {
        "require_tests": true,
        "max_function_length": 50,
        "require_documentation": true
      }
```

### Organization-Wide Setup

```yaml
- uses: your-org/contribution-validator-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    ai-api-key: ${{ secrets.ORG_AI_KEY }}
    guidelines-file: https://raw.githubusercontent.com/org/standards/main/CONTRIBUTING.md
    status-check-name: 'Org Standards Check'
```

## Migration Guide

### From Inline Workflow

**Current Implementation:**

```yaml
# .github/workflows/contribution-validator.yml
# 300+ lines of inline scripts
```

**Migrated Implementation:**

```yaml
# .github/workflows/contribution-validator.yml
name: Contribution Validator
on:
  pull_request:
    types: [opened, synchronize, edited]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/contribution-validator-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          ai-api-key: ${{ secrets.GEMINI_API_KEY }}
          guidelines-file: CONTRIBUTING.md
```

**Migration Steps:**

1. Replace inline workflow with action usage
2. Move configuration to action inputs
3. Update secret names if needed
4. Test with existing PRs
5. Remove old workflow file

**Breaking Changes:**

- Secret name changes (if any)
- Configuration format differences
- Output format changes

**Benefits:**

- Reduced workflow complexity (300+ lines → 10 lines)
- Automatic updates through action versioning
- Reusable across multiple repositories
- Better testing and maintenance

## Testing Strategy

### Unit Tests

- AI client implementations
- Response parsing logic
- Configuration validation
- Error handling scenarios

### Integration Tests

- End-to-end workflow validation
- GitHub API interactions
- AI provider integrations
- Comment formatting

### Performance Tests

- Large PR handling
- API rate limit scenarios
- Memory usage optimization
- Concurrent execution

### Security Tests

- Input sanitization
- API key handling
- Permission validation
- Injection attack prevention

## Monitoring and Analytics

### Metrics to Track

- Validation success/failure rates
- AI provider response times
- API usage and costs
- User adoption metrics

### Error Tracking

- AI service failures
- GitHub API errors
- Configuration issues
- Performance bottlenecks

### Cost Optimization

- Token usage monitoring
- Provider cost comparison
- Caching strategies
- Rate limit management

## Support and Maintenance

### Documentation

- Comprehensive README
- Configuration reference
- Troubleshooting guide
- API documentation

### Community

- GitHub Discussions
- Issue templates
- Contributing guidelines
- Code of conduct

### Versioning

- Semantic versioning
- Release notes
- Migration guides
- Deprecation notices

This plan provides a complete roadmap for transforming the inline contribution validator into a
standalone, reusable GitHub Action that can benefit the entire GitHub community.
