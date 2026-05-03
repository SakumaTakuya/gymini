---
name: claude-md-improver
description: Audit and improve CLAUDE.md files to maximize Claude Code's effectiveness. Use when asked to review, improve, or update CLAUDE.md documentation.
---

This skill audits and improves CLAUDE.md files across the codebase, ensuring Claude Code sessions have optimal project context.

## Workflow

Execute these phases in order.

### Phase 1: Discovery

Locate all CLAUDE.md variants:

```bash
find . -name "CLAUDE.md" -not -path "*/node_modules/*" 2>/dev/null
find . -name ".claude.local.md" 2>/dev/null
```

Check locations:
- `./CLAUDE.md` — project root (team-shared, in git)
- `./.claude.local.md` — local overrides (gitignored)
- `~/.claude/CLAUDE.md` — user defaults
- Package subdirectories (monorepos)

### Phase 2: Quality Assessment

Score each file against the criteria in [quality-criteria.md](references/quality-criteria.md).

Assign grades:
- **A** (90–100) · **B** (80–89) · **C** (70–79) · **D** (30–69) · **F** (0–29)

### Phase 3: Quality Report

**Always output the full quality report before making any changes.**

Show file-by-file scores, specific gaps, and recommended improvements.

### Phase 4: Targeted Updates

Propose minimal additions. Follow [update-guidelines.md](references/update-guidelines.md).

Only add genuinely useful content:
- Discovered commands/workflows
- Gotchas and non-obvious patterns
- Package relationships
- Working testing approaches
- Configuration quirks

### Phase 5: Apply Updates

Present diffs and ask for approval. Edit only approved files. Preserve existing structure.

## Key Principles

- CLAUDE.md is part of the prompt — brevity matters
- Every addition must help future Claude sessions
- Project-specific insights only; no generic advice
- Use templates from [templates.md](references/templates.md) for new files
