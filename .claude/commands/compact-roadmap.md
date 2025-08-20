---
allowed-tools: FileRead, FileWrite
description: Compact ROADMAP.md and extract session history and lessons learned
---

## ROADMAP Compaction with Knowledge Extraction

**Purpose**: Streamline ROADMAP.md while preserving session knowledge and lessons learned in dedicated files

**Workflow**:
1. **Read** development/ROADMAP.md to analyze content structure
2. **Extract** session summaries → create/update development/SESSIONS.md
3. **Extract** problems/solutions → create/update development/LESSONS_LEARNED.md  
4. **Compact** development/ROADMAP.md to essential planning information
5. **Verify** all files are properly formatted and linked

**Session Extraction Rules**:
- Extract session accomplishments into chronological paragraphs
- Include session number, date, and brief description of achievements
- Focus on deliverables and technical outcomes
- Remove verbose implementation details

**Lessons Learned Extraction Rules**:
- Identify problems, obstacles, and their solutions
- Categorize by area (Testing, Build, API Integration, etc.)
- Include specific technical details about what failed and how it was fixed
- Add prevention strategies where applicable

**ROADMAP Compaction Rules**:
- **Remove**: Detailed session history, verbose implementation notes, test coverage percentages, redundant technical achievements
- **Compact**: Completed phases to checkmarks, session accomplishments to bullet points
- **Preserve**: Current phase status, next priorities, usage examples, future phases, success metrics

**Output Files**:
- **development/ROADMAP.md**: Compacted to essential forward-looking planning
- **development/SESSIONS.md**: Chronological session summaries with key achievements
- **development/LESSONS_LEARNED.md**: Categorized problems/solutions for future reference

**Important Notes**:
- Maintain all critical planning information in development/ROADMAP.md
- Ensure development/SESSIONS.md provides clear development timeline
- Focus development/LESSONS_LEARNED.md on actionable prevention strategies
- Cross-reference files where appropriate