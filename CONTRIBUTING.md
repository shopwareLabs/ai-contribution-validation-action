# Contributing to AI Contribution Validator

Thank you for your interest in contributing to the AI Contribution Validator! This GitHub Action
uses Gemini AI to validate pull requests against contribution guidelines.

## Project Overview

AI Contribution Validator is a GitHub Action that automatically reviews pull requests using AI to
ensure they meet project standards. It provides structured feedback on code quality, commit
messages, and contribution guidelines compliance.

## Contribution Requirements

### Code Quality Standards

- All code must be written in TypeScript
- Follow Test-Driven Development (TDD) workflow
- Use dependency injection for external dependencies
- Use private fields with `#` syntax for encapsulation
- Prefer async/await over callbacks
- Use early returns over nested conditions

### Pull Request Guidelines

- PRs should focus on a single feature or fix
- Include tests for all new functionality
- Update documentation when adding features
- Keep changes small and reviewable
- Ensure all CI checks pass
- Reference relevant issues in the PR description

## Commit Message Format

### Required Format

```
type(scope): brief description (max 70 characters)

Detailed explanation of WHY this change is needed.
Reference relevant issues or discussions.
Keep lines under 70 characters.
```

### Valid Types

- `feat` - New feature implementation
- `fix` - Bug fix
- `test` - Test additions or modifications
- `docs` - Documentation updates
- `refactor` - Code restructuring without behavior change
- `chore` - Maintenance and tooling updates
- `ci` - CI/CD configuration changes

### Valid Scopes

- `validator` - Core validation logic
- `github-client` - GitHub API interactions
- `gemini-client` - Gemini AI integration
- `formatter` - Result formatting
- `config` - Configuration changes

### What to Avoid in Commits

Never include:

- Session or version references
- Coverage statistics or metrics
- Temporary development details

### Example Good Commit

```
feat(validator): add timeout protection for long-running validations

Implement 30-second timeout using Promise.race pattern to prevent
GitHub Actions from hanging on slow API responses. This ensures
the action fails gracefully rather than timing out silently.

Addresses issue #15 where validations would hang indefinitely.
```

### Example Bad Commits

```
Fixed stuff
Update code
feat: add new feature and fix bug and update docs
WIP: working on validator
Session 18: apply fixes
fix: update with 98% coverage
Applied stash from previous work
```

## Testing Requirements

All contributions must:

- Include unit tests for new functionality
- Pass all existing tests
- Not decrease overall code coverage
- Follow TDD: write failing tests before implementation
- Include integration tests for workflow changes

### Run Before Submitting

```bash
npm run validate
```

This command runs:

- TypeScript compilation
- ESLint checks
- Prettier formatting
- All tests with coverage

## Architecture and Code Style

For architecture patterns, design principles, and code style guidelines, see
[DEVELOPMENT.md](./DEVELOPMENT.md).

## Development Setup

For prerequisites, setup instructions, and development workflow, see
[DEVELOPMENT.md](./DEVELOPMENT.md).

## How to Contribute

### Bug Reports

1. Check existing issues first
2. Use GitHub Issues
3. Include reproduction steps
4. Provide environment details
5. Include error messages and logs

### Feature Requests

1. Open an issue for discussion first
2. Explain the use case clearly
3. Consider if documentation improvements could solve the problem
4. Provide implementation suggestions if possible

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `feature/description` or `fix/description`
3. Write failing tests first (TDD workflow)
4. Implement the minimal code to pass tests
5. Refactor while keeping tests green
6. Run `npm run validate` to ensure all checks pass
7. Submit pull request with clear description

## Submission Checklist

Before submitting a PR, ensure:

- [ ] Tests pass: `npm test`
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Code is formatted: `npm run format:check`
- [ ] Commit messages follow the format above
- [ ] PR description explains the change clearly
- [ ] All CI checks are green
- [ ] Documentation is updated if needed

## Environment Variables for Testing

```bash
export GITHUB_TOKEN="ghp_..."
export GEMINI_API_KEY="..."
export INPUT_GUIDELINES_FILE="CONTRIBUTING.md"
export GITHUB_REPOSITORY="owner/repo"
```

## Local Testing

```bash
# Test with GitHub Actions locally
act pull_request -e test/fixtures/pr-event.json

# Run specific test suites
npm run test:unit
npm run test:integration

# Watch mode for TDD
npm run test:watch
```

## Maintainers

### Release Process

This project uses [release-it](https://github.com/release-it/release-it) for automated versioning
and releases.

#### Prerequisites

- You must be on the `main` branch with a clean working directory
- All tests must pass
- You must have push access to the repository
- You must have permissions to create GitHub releases

#### Creating a Release

1. **Test the release process** (dry run):

   ```bash
   npm run release:dry-run
   ```

   This shows what would happen without making any changes.

2. **Create an interactive release**:

   ```bash
   npm run release
   ```

   This will:
   - Run pre-release validation (typecheck, lint, unit tests)
   - Prompt for version bump (patch/minor/major)
   - Update package.json version
   - Build the distribution bundle
   - Verify CHANGELOG.md entry exists
   - Create git commit and tag
   - Push to GitHub with the tag
   - Create a GitHub release with auto-generated notes

3. **Automated CI release** (for CI/CD pipelines):
   ```bash
   npm run release:ci
   ```
   Uses the same process but without interactive prompts.

#### Release Configuration

The release process is configured in `.release-it.json`:

- **Git hooks**: Validates code quality before release
- **Version format**: Uses semantic versioning with `v` prefix (e.g., v0.1.0)
- **GitHub integration**: Automatically creates releases with changelogs
- **Distribution**: Builds and commits the `dist/` folder

#### Post-Release

After a successful release:

- The GitHub Actions workflow (`.github/workflows/release.yml`) will:
  - Verify the build outputs
  - Update the major version tag (e.g., v0 → v0.1.0)
  - Make the action available at `shopware/ai-contribution-validation-action@v{version}`

#### Troubleshooting

- **"Working directory not clean"**: Commit or stash your changes first
- **"Branch must be main"**: Switch to main branch with `git checkout main`
- **"CHANGELOG missing entry"**: Add an entry for the new version in CHANGELOG.md
- **Build failures**: Run `npm run validate` to identify and fix issues

## Questions?

If you have questions about contributing, please:

1. Check the [DEVELOPMENT.md](./DEVELOPMENT.md) for technical details
2. Search existing issues for similar questions
3. Open a new issue with the "question" label

We appreciate your contributions to making AI-powered code review accessible to everyone!
