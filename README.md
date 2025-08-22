# AI Contribution Validator Action

> ⚠️ **EXPERIMENTAL PROJECT** - Not for production use. Breaking changes expected.

[![CI](https://github.com/shopwareLabs/ai-contribution-validation-action/actions/workflows/ci.yml/badge.svg)](https://github.com/shopwareLabs/ai-contribution-validation-action/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/shopwareLabs/ai-contribution-validation-action/branch/main/graph/badge.svg)](https://codecov.io/gh/shopwareLabs/ai-contribution-validation-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI-powered GitHub Action that validates PR text format compliance using Google Gemini.

## Quick Start

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
      - uses: shopware/ai-contribution-validation-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
```

## Setup

1. **Get API Key**: [Google AI Studio](https://aistudio.google.com/app/apikey) → Add as
   `GEMINI_API_KEY` secret
2. **Add Guidelines**: Create `CONTRIBUTING.md` with your standards
3. **Add Workflow**: Copy Quick Start to `.github/workflows/validate-pr.yml`

## Configuration

| Input                | Description                            | Required | Default            |
| -------------------- | -------------------------------------- | -------- | ------------------ |
| `github-token`       | GitHub token for API access            | ✅       |                    |
| `gemini-api-key`     | Google Gemini API key                  | ✅       |                    |
| `guidelines-file`    | Path to contribution guidelines        |          | `CONTRIBUTING.md`  |
| `gemini-model`       | `gemini-1.5-flash` or `gemini-1.5-pro` |          | `gemini-1.5-flash` |
| `max-pr-size`        | Maximum PR size (lines)                |          | `5000`             |
| `fail-on-errors`     | Fail on validation errors              |          | `false`            |
| `comment-identifier` | PR comment identifier                  |          | `ai-validator`     |
| `skip-authors`       | Comma-separated authors to skip        |          | `""`               |

**Outputs**: `validation-status` (PASS/FAIL/WARNINGS), `validation-summary` (JSON), `comment-url`

## Validation Scope

**Validates**:

- Commit message format (e.g., `type(scope): description`)
- PR title structure and clarity
- PR description completeness

**Not evaluated** (future releases):

- Code quality, architecture, implementation details

## Common Use Cases

### Skip Bots

```yaml
skip-authors: 'dependabot[bot],renovate[bot],github-actions[bot]'
```

### Strict Validation

```yaml
gemini-model: 'gemini-1.5-pro'
fail-on-errors: true
max-pr-size: 1000
```

### External Contributors

```yaml
if: github.event.pull_request.head.repo.fork == true
runs-on: ubuntu-latest
# ... with fail-on-errors: false
```

## Validation Status

| Status          | Meaning              | Action Required       |
| --------------- | -------------------- | --------------------- |
| ✅ **PASS**     | Meets all guidelines | None - ready to merge |
| ⚠️ **WARNINGS** | Minor suggestions    | Optional improvements |
| ❌ **FAIL**     | Has issues           | Must fix before merge |

## Example Output

```markdown
## AI Validation Results

### Status: ❌ Needs Improvement

### Issues Found:

- Commit message doesn't follow conventional commits format
- PR description lacks test plan section

### Specific Improvements:

#### Suggested PR Title:

feat(auth): add OAuth2 integration with JWT support

#### Suggested Commit Message:

feat(auth): add OAuth2 integration

Implement OAuth2 authentication flow with JWT token generation. Closes #123
```

## Troubleshooting

| Issue                  | Solution                                                    |
| ---------------------- | ----------------------------------------------------------- |
| "Repository not found" | Add `contents: read` and `pull-requests: write` permissions |
| "Gemini API Error"     | Verify API key and quotas in Google AI Studio               |
| "PR Too Large"         | Increase `max-pr-size` or split PR                          |
| Rate limits            | Built-in exponential backoff handles automatically          |
| Debug mode             | Set `ACTIONS_STEP_DEBUG: true` environment variable         |

## Cost Estimates

| Model | Cost per PR |
| ----- | ----------- |
| Flash | $0.001-0.05 |
| Pro   | $0.01-0.50  |

## Links

- [Development Guide](DEVELOPMENT.md) - Contributing, testing, architecture
- [Issues](https://github.com/shopware/ai-contribution-validation-action/issues)
- [Discussions](https://github.com/shopware/ai-contribution-validation-action/discussions)

---

MIT License - Made by [Shopware](https://github.com/shopware)
