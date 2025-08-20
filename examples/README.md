# AI Contribution Validator - Examples

This directory contains ready-to-use workflow examples. Copy and adapt them for your project.

## Examples Index

### 📄 [basic-usage.yml](basic-usage.yml)
**Minimal configuration for getting started quickly**

- **When to use:** Simple validation needs, getting started
- **Key features:** Default settings, minimal setup
- **Configuration:** Uses default Gemini 1.5 Flash model and CONTRIBUTING.md

### 📄 [advanced-config.yml](advanced-config.yml)  
**Full configuration with all available options**

- **When to use:** Need fine-grained control, strict enforcement
- **Key features:** Custom model, size limits, strict mode, failure handling
- **Configuration:** Uses Gemini 1.5 Pro, strict mode, custom comment identifier

### 📄 [multi-language.yml](multi-language.yml)
**Different validation rules per file type**

- **When to use:** Projects with multiple languages/frameworks
- **Key features:** Conditional validation, file filtering, language-specific guidelines
- **Configuration:** Separate jobs for frontend, backend, documentation, and general changes

## How to Use These Examples

1. **Choose** the example that best matches your needs
2. **Copy** the workflow file to `.github/workflows/validate-pr.yml`
3. **Add secrets** to your repository:
   - `GEMINI_API_KEY` - Your Google Gemini API key
4. **Customize** the configuration as needed for your project
5. **Test** with a sample pull request

## Decision Guide

**Use basic-usage.yml if:**
- You're just getting started
- You want simple, out-of-the-box validation
- You have a single-language project

**Use advanced-config.yml if:**
- You need strict validation that can fail PRs
- You want to use the more powerful Gemini 1.5 Pro model
- You need custom size limits or comment identifiers

**Use multi-language.yml if:**
- Your project has multiple programming languages
- You have different guidelines for different types of changes
- You want language-specific validation rules

## Integration Patterns

### With Branch Protection
Add the validation job as a required status check:
```yaml
# In your branch protection rules
required_status_checks:
  - "AI Validation"
```

### Conditional Execution
Only validate external contributions:
```yaml
if: github.event.pull_request.head.repo.fork == true
```

### Multiple Validators
Run different validators for different scenarios:
```yaml
comment-identifier: 'security-validator'  # For security reviews
comment-identifier: 'docs-validator'      # For documentation
```

For complete configuration options and troubleshooting, see the [main README](../README.md).