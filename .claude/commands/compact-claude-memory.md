# /compact-claude-md

## Purpose
Compact the CLAUDE.md file by removing redundant information and compressing verbose descriptions while maintaining essential reference information.

## Instructions

1. **Remove**:
   - Detailed implementation descriptions
   - Coverage percentages and test counts
   - Verbose API descriptions (keep only method signatures)
   - Redundant sections that repeat information
   - "See [link]" references for implementation details
   - Session-specific dates and notes

2. **Compact**:
   - API interfaces to single-line method signatures
   - Architecture overview to essential bullet points
   - Multi-line descriptions to single lines
   - Combine similar sections

3. **Keep**:
   - Context7 library IDs (essential for AI)
   - Architecture diagram/overview (minimal)
   - API method names (no descriptions)
   - Essential commands

4. **Format**:
   - Use tables for API references
   - Use bullet points instead of paragraphs
   - Remove empty lines between related items
   - Target: < 50 lines total

## Important Notes
- Do NOT reference DEVELOPMENT.md or ROADMAP.md for details since those files serve different purposes
- Keep information self-contained but minimal
- Focus on what AI assistants need for quick reference
- Remove any volatile information that changes frequently