---
name: skill-sync
description: >
  Syncs skill metadata to AGENTS.md Auto-invoke sections.
  Trigger: After creating/modifying skills, regenerating Auto-invoke tables, or troubleshooting missing skills in AGENTS.md.
license: Apache-2.0
metadata:
  author: template
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "After creating/modifying a skill"
    - "Regenerate AGENTS.md skill tables"
    - "Troubleshoot missing skills in AGENTS.md"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

## Purpose

Keeps AGENTS.md Auto-invoke sections in sync with skill metadata. When you create or modify a skill, run the sync script to automatically update all affected AGENTS.md files.

---

## Required Skill Metadata

Each skill that should appear in Auto-invoke sections needs these fields in `metadata`:

```yaml
metadata:
  author: your-name
  version: "1.0"
  scope: [root]                                   # Which AGENTS.md files to update
  auto_invoke: "When to invoke this skill"        # Single action or list
```

### Scope Values

Scopes are discovered dynamically based on your project structure:

| Scope | Updates |
|-------|---------|
| `root` | `./AGENTS.md` (repository root) |
| `<directory>` | `./<directory>/AGENTS.md` |

Examples:
- `scope: [root]` updates `./AGENTS.md`
- `scope: [frontend]` updates `./frontend/AGENTS.md`
- `scope: [root, backend, frontend]` updates all three

Skills can target multiple scopes: `scope: [root, api, ui]`

### Auto-invoke Format

Single action:
```yaml
auto_invoke: "Creating new components"
```

Multiple actions:
```yaml
auto_invoke:
  - "Creating new components"
  - "Refactoring component structure"
```

---

## Usage

### After Creating/Modifying a Skill

```bash
./skills/skill-sync/assets/sync.sh
```

### What It Does

1. Reads all `skills/*/SKILL.md` files
2. Extracts `metadata.scope` and `metadata.auto_invoke`
3. Generates Auto-invoke tables for each scope
4. Updates the `### Auto-invoke Skills` section in each AGENTS.md

---

## Commands

```bash
# Sync all AGENTS.md files
./skills/skill-sync/assets/sync.sh

# Dry run (show what would change)
./skills/skill-sync/assets/sync.sh --dry-run

# Sync specific scope only
./skills/skill-sync/assets/sync.sh --scope frontend

# Run tests
./skills/skill-sync/assets/sync_test.sh
```

---

## Example

Given this skill metadata:

```yaml
# skills/my-skill/SKILL.md
metadata:
  author: dev
  version: "1.0"
  scope: [frontend]
  auto_invoke: "Creating React components"
```

The sync script generates in `frontend/AGENTS.md`:

```markdown
### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| Creating React components | `my-skill` |
```

---

## Troubleshooting

### Skill not appearing in AGENTS.md

1. Check `metadata.scope` exists and is valid
2. Check `metadata.auto_invoke` exists
3. Verify the target AGENTS.md file exists (e.g., `./frontend/AGENTS.md`)
4. Run with `--dry-run` to see what would be generated

### Warning: No AGENTS.md found for scope

The scope references a directory that doesn't have an AGENTS.md file. Either:
- Create the AGENTS.md file in that directory
- Remove the scope from the skill's metadata

---

## Checklist After Modifying Skills

- [ ] Added `metadata.scope` to new/modified skill
- [ ] Added `metadata.auto_invoke` with action description
- [ ] Ran `./skills/skill-sync/assets/sync.sh`
- [ ] Verified AGENTS.md files updated correctly
