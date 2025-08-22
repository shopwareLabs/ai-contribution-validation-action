---
allowed-tools: FileRead, FileWrite
description: Compact the README.md file while optimizing for human readability
---

# /compact-readme

## Purpose

Transform README.md into a concise, scannable document that gets users started quickly while
preserving all essential information.

## Instructions

### 1. **Check for Development Guide Redundancy**:

First, read DEVELOPMENT.md to identify overlapping content. Remove from README:

- Development setup instructions (link to DEVELOPMENT.md instead)
- Local testing details beyond basic workflow example
- Environment variable configuration details
- Contributing workflow steps for developers
- Architecture explanations and technical patterns
- Detailed command documentation
- Testing strategy and coverage details

### 3. **Remove These Patterns**:

- Redundant examples (keep maximum 2 per concept)
- Explanatory paragraphs that don't directly help setup
- Decorative elements and unnecessary visual separators
- Duplicate information across different sections
- Verbose descriptions where tables or lists suffice
- Commentary about how things work internally
- Multiple variations of the same configuration
- Detailed edge cases and special scenarios

### 4. **Compact Using These Techniques**:

- Convert paragraphs to bullet points
- Merge multiple similar examples into one
- Replace long descriptions with concise statements
- Consolidate scattered related information
- Transform verbose explanations into numbered steps
- Combine small related sections into unified ones
- Use tables for configuration and options

### 5. **Always Preserve**:

- Project name and critical status warnings
- Essential badges (CI, coverage, license)
- One clear quick-start example
- Complete configuration parameter tables
- Minimum required setup steps
- Links to detailed documentation
- License and attribution

### 6. **Readability Guidelines**:

- Use clear, descriptive headings
- Prefer tables over prose for configurations
- Keep code examples minimal but functional
- Remove emojis except for critical warnings
- Eliminate unnecessary blank lines
- Focus on "what to do" not "why it works"
- Target 30-40% of original length

### 7. **Optimal Structure**:

1. Title + Status/Warnings
2. One-sentence description
3. Quick Start (minimal working example)
4. Configuration (table format)
5. Setup Steps (numbered, essential only)
6. Links to More Information

## Important Notes

- Check DEVELOPMENT.md first to avoid content duplication
- Replace developer-focused sections with "See DEVELOPMENT.md"
- Prioritize getting users running quickly
- Keep only actionable information in main sections
- Move detailed explanations to linked documentation
- Ensure every remaining line adds value for setup
- Test that examples still work after compaction
