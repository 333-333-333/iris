# AI Agent Skills Template

A project-agnostic template for configuring AI coding assistants with reusable skills. Compatible with Claude Code, Gemini CLI, Codex (OpenAI), and GitHub Copilot.

## Features

- Unified skills system across multiple AI assistants
- Project-agnostic design (works with any codebase)
- Automatic skill synchronization to AGENTS.md
- Interactive setup for different AI tools
- Built-in generic skills for common tasks

## Quick start

```bash
# Clone the template
git clone https://github.com/your-org/agents.git
cd agents

# Run setup for your AI assistant
./skills/setup.sh --claude    # Claude Code
./skills/setup.sh --gemini    # Gemini CLI
./skills/setup.sh --codex     # Codex (OpenAI)
./skills/setup.sh --copilot   # GitHub Copilot
./skills/setup.sh --all       # All assistants
./skills/setup.sh             # Interactive mode
```

## Project structure

```
.
├── AGENTS.md                 # Main AI instructions (source of truth)
├── skills/
│   ├── setup.sh              # AI assistant configuration script
│   ├── setup_test.sh         # Tests for setup script
│   │
│   ├── skill-creator/        # Meta-skill: create new skills
│   ├── skill-sync/           # Meta-skill: sync skills to AGENTS.md
│   │
│   ├── documentation/        # Generic: write documentation
│   ├── git-commit/           # Generic: conventional commits
│   └── git-tags/             # Generic: semantic versioning
│
├── .claude/skills -> skills/ # Symlink (created by setup.sh)
├── .gemini/skills -> skills/ # Symlink (created by setup.sh)
└── .codex/skills -> skills/  # Symlink (created by setup.sh)
```

## Skills system

Skills are reusable knowledge modules that AI agents invoke for specific tasks. Each skill lives in `skills/{skill-name}/SKILL.md`.

### Included skills

| Skill | Type | Description |
|-------|------|-------------|
| `skill-creator` | Meta | Create new AI agent skills |
| `skill-sync` | Meta | Sync skills to AGENTS.md tables |
| `documentation` | Generic | Write READMEs, API docs, guides |
| `git-commit` | Generic | Conventional commits workflow |
| `git-tags` | Generic | Semantic versioning with tags |

### Creating new skills

```bash
# Skills follow this structure
skills/{skill-name}/
├── SKILL.md          # Required: skill definition
├── assets/           # Optional: templates, schemas
└── references/       # Optional: links to docs
```

Each SKILL.md has YAML frontmatter:

```yaml
---
name: my-skill
description: >
  What this skill does.
  Trigger: When to invoke it.
license: Apache-2.0
metadata:
  author: your-name
  version: "1.0"
  scope: [root]           # Which AGENTS.md to update
  auto_invoke:            # Actions that trigger this skill
    - "Doing something"
    - "Doing something else"
---
```

### Syncing skills

After creating or modifying a skill, sync to AGENTS.md:

```bash
./skills/skill-sync/assets/sync.sh           # Update all
./skills/skill-sync/assets/sync.sh --dry-run # Preview changes
./skills/skill-sync/assets/sync.sh --scope root # Specific scope
```

## Customization

### Adding project-specific skills

1. Create skill directory: `mkdir -p skills/my-project-skill`
2. Create `SKILL.md` with frontmatter and content
3. Run `./skills/skill-sync/assets/sync.sh`

### Configuring AGENTS.md

Edit `AGENTS.md` to customize:

- **Project Overview**: Your tech stack and components
- **Development Setup**: Your setup commands
- **Code Quality**: Your linting/formatting commands
- **Commit Guidelines**: Your conventions

### Multi-component projects

For monorepos, create component-specific AGENTS.md files:

```
.
├── AGENTS.md           # Root guidelines
├── frontend/
│   └── AGENTS.md       # Frontend-specific
├── backend/
│   └── AGENTS.md       # Backend-specific
└── skills/
    └── my-skill/
        └── SKILL.md    # scope: [root, frontend, backend]
```

## Running tests

```bash
# Test setup script
./skills/setup_test.sh

# Test sync script
./skills/skill-sync/assets/sync_test.sh
```

## How it works

1. **AGENTS.md** is the source of truth for AI instructions
2. **setup.sh** creates symlinks and copies for each AI assistant:
   - Claude: `.claude/skills/` + `CLAUDE.md`
   - Gemini: `.gemini/skills/` + `GEMINI.md`
   - Codex: `.codex/skills/` (uses AGENTS.md natively)
   - Copilot: `.github/copilot-instructions.md`
3. **Skills** provide detailed instructions loaded on-demand
4. **sync.sh** keeps auto-invoke tables updated

## License

Apache-2.0
