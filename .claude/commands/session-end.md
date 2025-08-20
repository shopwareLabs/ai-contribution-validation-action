---
allowed-tools: Bash(npm run validate), FileRead, FileWrite, Edit, MultiEdit, TodoWrite
description: Conduct end-of-session review with code documentation and architecture preservation
---

## Session End Command

**Workflow**:
1. **Review** - Analyze git diff & conversation for accomplishments and design decisions
2. **Document Code** - Add meaningful comments to source files explaining the "why" behind implementations
3. **Architecture** - Update DEVELOPMENT.md with architectural decisions and patterns used
4. **Update Progress** - Mark development/ROADMAP.md progress without verbose session logs
5. **Validate** - Run `npm run validate`, document results & fix tasks
6. **Plan** - Define next session priority with quick-start commands

**Code Documentation Guidelines**:
- **Class-level**: Explain responsibility, design patterns, why this abstraction exists
- **Method-level**: Document complex algorithms, side effects, rationale for approach
- **Inline**: Only for non-obvious logic, performance considerations, workarounds with reasons
- **Focus**: The "why" over the "what" - assume readers can understand the code

**Architecture Documentation**:
- Add decisions to DEVELOPMENT.md under existing "Architecture Decisions" section
- Include: pattern choices, dependency selections, testing strategies, trade-offs made
- Document rationale for significant design choices made during session
- Update existing subsections: Core Patterns, Implementation Choices

**Implementation Steps**:
1. **Scan Modified Files**: Use `git diff --name-only` to identify changed source files
2. **Add Class Comments**: For each new/modified class, add JSDoc explaining design rationale
3. **Add Method Comments**: For complex methods, document algorithm choices and side effects
4. **Update Architecture Guide**: Add new patterns/decisions to DEVELOPMENT.md sections
5. **Clean External Docs**: Remove verbose histories, keep only essential references

**Comment Examples**:

```typescript
/**
 * Uses HTML comment markers for idempotent PR comment updates.
 * This pattern allows multiple validators to coexist without conflicts
 * and preserves comment history for audit trails.
 */
export class GitHubClient {
  // Private field ensures Octokit instance cannot be accessed externally,
  // preventing test pollution and enforcing API boundaries
  #octokit: ReturnType<typeof getOctokit>;

  /**
   * Creates PR comments with unique identifiers for later updates.
   * The identifier approach enables findCommentByIdentifier() to locate
   * and update existing comments without creating duplicates.
   */
  async createComment(identifier: string) {
    // Prepend identifier as HTML comment - invisible to users but trackable
    const bodyWithIdentifier = `<!-- ${identifier} -->\n${body}`;
  }
}
```

**Output**: Preserved knowledge in codebase, updated architecture guide, clean external docs
