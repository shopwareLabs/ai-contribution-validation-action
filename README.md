# AI Contribution Validator Action

> ⚠️ **EXPERIMENTAL PROJECT**
>
> This project is currently in an experimental phase and is **not intended for production use**. The
> API, configuration options, and behavior may change significantly between versions without notice.
> Use at your own risk and expect potential breaking changes.

[![CI](https://github.com/shopwareLabs/ai-contribution-validation-action/actions/workflows/ci.yml/badge.svg)](https://github.com/shopwareLabs/ai-contribution-validation-action/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/shopwareLabs/ai-contribution-validation-action/branch/main/graph/badge.svg)](https://codecov.io/gh/shopwareLabs/ai-contribution-validation-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI-powered GitHub Action that validates pull requests against contribution guidelines using Google
Gemini AI. Automatically reviews PRs for compliance with your project's standards and provides
actionable feedback to contributors.

## Features

- **AI-Powered Validation**: Uses Google Gemini AI to intelligently review PRs against your
  contribution guidelines
- **Structured Feedback**: Returns detailed validation with PASS/FAIL/WARNINGS status and specific
  improvement suggestions for title, commits, and description
- **Automated PR Comments**: Creates and updates PR comments with validation feedback
- **Commit Status Integration**: Sets commit status checks for seamless CI/CD integration
- **Configurable Guidelines**: Works with any contribution guidelines file (CONTRIBUTING.md, etc.)
- **Rate Limit Handling**: Built-in exponential backoff for GitHub API rate limits
- **Multiple AI Models**: Support for both Gemini 1.5 Flash and Pro models
- **Bot Exclusion**: Skip validation for automated PRs (dependabot, renovate, etc.)
- **Error Recovery**: Graceful handling of API failures and network issues

## Validation Scope

> 📝 **Current Focus: Text Format Validation**
>
> The validator currently focuses on **text format validation only** to provide fast, objective, and
> predictable results. This includes:
>
> - **Commit message format** (e.g., conventional commits: `type(scope): description`)
> - **PR title structure** and clarity
> - **PR description completeness** (e.g., What/Why/How sections)
>
> **Currently NOT evaluated** (planned for future releases):
>
> - Code quality or architecture decisions
> - File changes appropriateness
> - Implementation details or technical choices
> - Code complexity or size metrics
>
> This text-first approach ensures consistent contribution documentation standards with lower API
> costs and faster response times. Code content analysis features will be added in future versions
> based on user feedback and requirements.

## Quick Start

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

      - name: Validate PR
        uses: shopware/ai-contribution-validation-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
```

### Advanced Configuration

```yaml
- name: Validate PR with custom settings
  uses: shopware/ai-contribution-validation-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
    guidelines-file: '.github/CONTRIBUTING.md'
    gemini-model: 'gemini-1.5-pro'
    max-pr-size: '3000'
    fail-on-errors: true
    comment-identifier: 'custom-validator'
    skip-authors: 'dependabot[bot],renovate[bot]'
```

## Configuration

### Inputs

| Input                | Description                                       | Required | Default            |
| -------------------- | ------------------------------------------------- | -------- | ------------------ |
| `github-token`       | GitHub token for API access                       | ✅ Yes   |                    |
| `gemini-api-key`     | Google Gemini API key                             | ✅ Yes   |                    |
| `guidelines-file`    | Path to contribution guidelines file              | No       | `CONTRIBUTING.md`  |
| `gemini-model`       | AI model (`gemini-1.5-flash` or `gemini-1.5-pro`) | No       | `gemini-1.5-flash` |
| `max-pr-size`        | Maximum PR size in lines of code                  | No       | `5000`             |
| `fail-on-errors`     | Fail action on validation errors                  | No       | `false`            |
| `comment-identifier` | Unique identifier for PR comments                 | No       | `ai-validator`     |
| `skip-authors`       | Comma-separated list of PR authors to skip        | No       | `""`               |

### Outputs

| Output               | Description                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `validation-status`  | Validation result (`PASS`, `FAIL`, or `WARNINGS`)                      |
| `validation-summary` | Structured JSON with status, issues array, and improvement suggestions |
| `comment-url`        | URL of the created/updated PR comment                                  |

## Setup Guide

### 1. Get a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to your repository secrets as `GEMINI_API_KEY`

### 2. Prepare Your Guidelines

Create a `CONTRIBUTING.md` file in your repository root with your contribution standards:

```markdown
# Contributing Guidelines

## Code Style

- Use TypeScript for all new code
- Follow ESLint rules
- Include unit tests for new features

## Commit Messages

- Use conventional commits format
- Example: `feat(auth): add OAuth2 support`

## Pull Requests

- Keep PRs focused and small
- Include description of changes
- Update documentation as needed
```

### 3. Add the Workflow

Create `.github/workflows/validate-pr.yml`:

```yaml
name: Validate Pull Requests

on:
  pull_request:
    types: [opened, synchronize, edited]

permissions:
  contents: read
  pull-requests: write
  checks: write

jobs:
  validate:
    name: AI Validation
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Validate contribution
        uses: shopware/ai-contribution-validation-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
          skip-authors: 'dependabot[bot]' # Skip bot PRs
```

## Bot Exclusion

Skip validation for automated PRs from dependency management bots and other automated tools that
don't follow human contribution guidelines.

### Basic Bot Exclusion

```yaml
- name: Validate contribution
  uses: shopware/ai-contribution-validation-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
    skip-authors: 'dependabot[bot]'
```

### Multiple Bots

```yaml
- name: Validate contribution
  uses: shopware/ai-contribution-validation-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
    skip-authors: 'dependabot[bot],renovate[bot],github-actions[bot]'
```

### Common Bot Authors

- `dependabot[bot]` - GitHub Dependabot
- `renovate[bot]` - Renovate Bot
- `github-actions[bot]` - GitHub Actions Bot
- `greenkeeper[bot]` - Greenkeeper (legacy)

When a PR from a skipped author is detected, the action will:

- Skip all AI validation checks
- Return success status
- Log a message indicating validation was skipped

## Structured Validation Format

The action returns a structured validation response with detailed feedback and improvement
suggestions:

### Validation Status Levels

- **PASS** ✅: PR meets all guidelines with no issues
- **WARNINGS** ⚠️: PR meets basic requirements but has minor suggestions
- **FAIL** ❌: PR has issues that need to be addressed

### Response Structure

```json
{
  "status": "FAIL",
  "issues": [
    "Commit message doesn't follow conventional commits format",
    "PR description lacks test plan section"
  ],
  "improved_title": "feat(auth): add OAuth2 integration with JWT support",
  "improved_commits": "feat(auth): add OAuth2 integration\n\nImplement OAuth2 authentication flow with JWT token generation",
  "improved_description": "## What\nAdd OAuth2 authentication support\n## Why\nImprove security"
}
```

### Status Examples

#### PASS Status

```markdown
### Status: ✅ Passed

Great work! Your contribution meets our guidelines.

### 📋 Issues Found:

_No issues detected_
```

#### WARNINGS Status

```markdown
### Status: ⚠️ Passed with Warnings

Your contribution looks good, but consider these suggestions for improvement.

### 📋 Issues Found:

- Consider adding more detailed commit messages
- PR could benefit from additional test coverage
```

#### FAIL Status

```markdown
### Status: ❌ Needs Improvement

Your contribution needs some changes to meet our guidelines.

### 📋 Issues Found:

- Commit message format needs improvement
- Missing required documentation updates
```

## Example Output

The action creates PR comments with structured feedback:

```markdown
## 🤖 AI Validation Results

### Status: ❌ Needs Improvement

Your contribution needs some changes to meet our guidelines.

### 📋 Issues Found:

- Commit message doesn't follow conventional commits format
- PR description lacks test plan section
- Missing documentation updates

### ✨ Specific Improvements:

#### 📝 Suggested PR Title:
```

feat(auth): add OAuth2 integration with JWT support

```

#### 📋 Suggested Commit Message:
```

feat(auth): add OAuth2 integration

Implement OAuth2 authentication flow with JWT token generation and validation. Supports Google and
GitHub as providers.

Closes #123

```

#### 📄 Suggested PR Description:
```

## What

Add OAuth2 authentication support with JWT tokens

## Why

Improve security and enable SSO capabilities

## How

- Implemented OAuth2 flow with state validation
- Added JWT token generation and verification
- Integrated Google and GitHub providers

## Testing

- Unit tests for auth flow
- Integration tests for providers
- Manual testing with test accounts

```

---
*Automated validation based on [contribution guidelines](CONTRIBUTING.md)*
_Last updated: 2025-08-21 15:30:45 UTC_
```

## Use Cases

### Open Source Projects

```yaml
# Only validate external contributions, skip bots
jobs:
  validate:
    if: github.event.pull_request.head.repo.fork == true
    runs-on: ubuntu-latest
    steps:
      - uses: shopware/ai-contribution-validation-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
          fail-on-errors: false # Don't block external PRs
          skip-authors: 'dependabot[bot],renovate[bot]'
```

### Enterprise Teams

```yaml
# Strict validation for all PRs
- uses: shopware/ai-contribution-validation-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
    gemini-model: 'gemini-1.5-pro' # Higher quality model
    fail-on-errors: true # Block non-compliant PRs
    max-pr-size: 1000 # Enforce small PRs
```

### Multi-Language Projects

```yaml
# Different guidelines per language
- name: Validate TypeScript PRs
  if: contains(github.event.pull_request.changed_files, '.ts')
  uses: shopware/ai-contribution-validation-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
    guidelines-file: 'docs/typescript-guidelines.md'
```

### Automated Dependency Management

```yaml
# Skip validation for dependency updates, validate everything else
- name: Validate contributions
  uses: shopware/ai-contribution-validation-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
    skip-authors: 'dependabot[bot],renovate[bot],snyk-bot'
    fail-on-errors: true # Strict for human contributions
```

## Troubleshooting

### Common Issues

#### 1. "Repository not found" Error

**Cause:** The GitHub token lacks repository access  
**Solution:** Ensure `GITHUB_TOKEN` has `contents: read` and `pull-requests: write` permissions

#### 2. "Gemini API Error"

**Cause:** Invalid or expired API key  
**Solution:**

- Verify API key in Google AI Studio
- Check if API quotas are exceeded
- Ensure the key is correctly added to repository secrets

#### 3. "PR Too Large" Warning

**Cause:** PR exceeds the maximum size limit  
**Solution:**

- Increase `max-pr-size` parameter
- Break large changes into smaller PRs
- Focus on specific components per PR

#### 4. Rate Limit Errors

**Cause:** Too many GitHub API requests  
**Solution:** The action has built-in exponential backoff, but you can:

- Reduce validation frequency
- Use a GitHub App token for higher rate limits

### Debug Mode

Enable verbose logging:

```yaml
- uses: shopware/ai-contribution-validation-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
  env:
    ACTIONS_STEP_DEBUG: true
```

### Performance Tips

1. **Use Gemini 1.5 Flash** for faster, cost-effective validation
2. **Set appropriate PR size limits** to avoid long processing times
3. **Use specific guidelines files** rather than generic ones
4. **Cache validation results** for identical commits

## Cost Considerations

### Gemini API Pricing

- **Gemini 1.5 Flash**: ~$0.35 per 1M tokens
- **Gemini 1.5 Pro**: ~$3.50 per 1M tokens

### Estimated Costs (per PR)

| PR Size                 | Model | Estimated Cost |
| ----------------------- | ----- | -------------- |
| Small (<500 lines)      | Flash | $0.001-0.01    |
| Medium (500-2000 lines) | Flash | $0.01-0.05     |
| Large (2000+ lines)     | Flash | $0.05-0.20     |

### Cost Optimization

- Use `max-pr-size` to limit processing costs
- Choose Flash model for most use cases
- Only validate changed files for large repositories

## API Reference

### Validation Process

1. **PR Analysis**: Extracts PR title, description, commits, and file changes
2. **Guidelines Processing**: Reads and processes contribution guidelines
3. **AI Validation**: Sends structured prompt to Gemini AI
4. **Result Processing**: Categorizes feedback into errors, warnings, suggestions
5. **Comment Management**: Creates or updates PR comment with results
6. **Status Update**: Sets commit status check with validation result

### Error Handling

The action gracefully handles:

- GitHub API rate limits (exponential backoff)
- Network timeouts (30-second limit)
- Invalid repository access (clear error messages)
- Gemini API failures (fallback to manual review suggestion)

## Development

### Local Testing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build distribution
npm run build

# Test locally with act
act pull_request -e test/fixtures/pr-event.json
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development setup.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/shopware/ai-contribution-validation-action/wiki)
- 🐛 [Report Issues](https://github.com/shopware/ai-contribution-validation-action/issues)
- 💬 [Discussions](https://github.com/shopware/ai-contribution-validation-action/discussions)
- 🔧
  [Feature Requests](https://github.com/shopware/ai-contribution-validation-action/issues/new?template=feature_request.md)

---

**Made with ❤️ by [Shopware](https://github.com/shopware)**
