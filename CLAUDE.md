# AI Contribution Validator Action

## Architecture

**Validator** (orchestrator) | **GitHub Client** (API + retry) | **AI Client** (provider-agnostic) |
**Formatter** (markdown)

## Context7 Library IDs

```yaml
'@actions/core': '/github/actions__toolkit'
'@actions/github': '/github/actions__toolkit'
'@google/generative-ai': '/google-gemini/deprecated-generative-ai-js'
'@types/node': '/definitelytyped/definitelytyped'
'@typescript-eslint/eslint-plugin': '/typescript-eslint/typescript-eslint'
'@typescript-eslint/parser': '/typescript-eslint/typescript-eslint'
'@vercel/ncc': '/vercel/ncc'
'eslint': '/eslint/eslint'
'msw': '/mswjs/msw'
'prettier': '/prettier/prettier'
'typescript': '/microsoft/TypeScript'
'vitest': '/vitest-dev/vitest'
'zod': '/colinhacks/zod'
```

## API Reference

| Component         | Methods                                                      |
| ----------------- | ------------------------------------------------------------ |
| **GitHub Client** | `extractPRData()`, `createComment()`, `createCommitStatus()` |
| **Gemini Client** | `generateValidationPrompt()`, `validateContent()`            |
| **Validator**     | `constructor()`, `validate()`                                |

## Commands

`test:watch` | `validate` | `build` | `test:integration` | Format: `type(scope): description`
