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
- **Automated PR Comments**: Creates and updates PR comments with validation feedback
- **Commit Status Integration**: Sets commit status checks for seamless CI/CD integration
- **Configurable Guidelines**: Works with any contribution guidelines file (CONTRIBUTING.md, etc.)
- **Rate Limit Handling**: Built-in exponential backoff for GitHub API rate limits
- **Multiple AI Models**: Support for both Gemini 1.5 Flash and Pro models
- **Error Recovery**: Graceful handling of API failures and network issues

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

### Outputs

| Output               | Description                                       |
| -------------------- | ------------------------------------------------- |
| `validation-status`  | Validation result (`success`, `failure`, `error`) |
| `validation-summary` | Summary of validation results                     |
| `comment-url`        | URL of the created/updated PR comment             |

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
```

## Example Output

The action creates PR comments with structured feedback:

```markdown
## 🤖 AI Contribution Validation

**Status:** ⚠️ Issues Found

### 🚨 Errors

- Commit message doesn't follow conventional commits format

### ⚠️ Warnings

- PR description is too brief (minimum 50 characters recommended)

### 💡 Suggestions

- Consider adding unit tests for the new authentication method
- Update the README.md to document the new OAuth2 feature

### Next Steps

1. Fix the commit message format: `feat(auth): add OAuth2 integration`
2. Expand the PR description with implementation details
3. Add test coverage for the authentication logic

---

_Validated by AI Contribution Validator v1.0_
```

## Use Cases

### Open Source Projects

```yaml
# Only validate external contributions
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
