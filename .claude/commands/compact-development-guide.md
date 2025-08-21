---
allowed-tools: FileRead, FileWrite, Bash
description: Compact DEVELOPMENT.md and prevent redundant code comments
---

## Concise Development Guide Cleanup Command

**Purpose**: Streamline DEVELOPMENT.md and eliminate redundant code comments that duplicate
documentation

**Workflow**:

1. **Analyze DEVELOPMENT.md** - Read DEVELOPMENT.md, identify session history sections
2. **Remove Sessions** - Delete entire 'Session History & Handoff Notes' sections
3. **Clean Documentation** - Remove redundant implementation details and coverage statistics
4. **Check Uncommitted Changes** - Use `git diff --name-only` to identify modified source files
5. **Analyze Code Comments** - Review comments in modified files for redundancy with DEVELOPMENT.md
6. **Remove Redundant Comments** - Clean up code comments that duplicate architectural decisions in
   docs
7. **Preserve Essential Comments** - Keep concise "what" comments, remove verbose "why" explanations
8. **Verify References** - Ensure file ends cleanly, no broken references remain

**Code Comment Cleanup Rules**:

- **Remove if duplicates DEVELOPMENT.md**: Architectural decisions, design patterns, detailed
  rationale
- **Keep if essential**: Brief descriptions, non-obvious logic, performance notes, workarounds
- **Simplify verbose comments**: Convert detailed explanations to brief descriptions
- **Focus on "what" not "why"**: Code shows what, documentation explains why

**Documentation Priority**:

- **DEVELOPMENT.md**: Authoritative source for architectural decisions and rationale
- **Code comments**: Brief descriptions and essential context only
- **No duplication**: Each piece of information should exist in exactly one place

**Anti-patterns to Fix**:

```typescript
// ❌ Redundant - already in DEVELOPMENT.md
/**
 * Design Decision: Remove token validation to support GitHub's automatic token
 * Rationale: GitHub Actions provides automatic token that doesn't follow patterns
 * Implementation: Accept any non-empty string, delegate validation to API
 */

// ✅ Concise - focuses on immediate context
/**
 * GitHub API client with retry logic and error handling.
 */
```

**Preservation Guidelines**:

- Keep prerequisites, setup, workflow, commands, structure
- Keep architecture decisions, testing patterns, environment variables
- Keep cross-references to other documentation files
- Remove session histories, verbose implementation notes, test coverage percentages

**Output**:

- Compacted DEVELOPMENT.md with essential developer guidelines only
- Clean code comments focused on immediate context
- No information duplication between code and documentation
