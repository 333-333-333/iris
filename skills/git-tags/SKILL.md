---
name: git-tags
description: >
  Version releases using git tags following semantic versioning.
  Trigger: When creating releases, tagging versions, or managing version numbers.
license: Apache-2.0
metadata:
  author: template
  version: "1.0"
  type: generic
  scope: [root]
  auto_invoke:
    - "Creating version tags"
    - "Managing releases"
    - "Bumping version numbers"
allowed-tools: Bash, Read, Glob, Grep
---

## When to Use

- Creating a new release
- Tagging a specific version
- Bumping version numbers
- Listing or managing existing tags
- Following semantic versioning

---

## Semantic Versioning (SemVer)

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
```

### Version Components

| Component | When to Increment | Example |
|-----------|-------------------|---------|
| MAJOR | Breaking/incompatible API changes | `1.0.0` -> `2.0.0` |
| MINOR | New backwards-compatible features | `1.0.0` -> `1.1.0` |
| PATCH | Backwards-compatible bug fixes | `1.0.0` -> `1.0.1` |

### Pre-release Versions

```
1.0.0-alpha      # Alpha release
1.0.0-alpha.1    # Alpha with iteration
1.0.0-beta       # Beta release
1.0.0-beta.2     # Beta with iteration
1.0.0-rc.1       # Release candidate
```

### Version Precedence

```
1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-beta < 1.0.0-rc.1 < 1.0.0
```

---

## Tag Naming Conventions

### Standard Format

```bash
v1.0.0          # Recommended: prefix with 'v'
v1.2.3-beta.1   # Pre-release
v2.0.0-rc.1     # Release candidate
```

### With Prefix (monorepos)

```bash
package-v1.0.0      # Package-specific
api-v2.1.0          # API version
frontend-v1.5.0     # Frontend version
```

---

## Creating Tags

### Annotated Tags (Recommended)

Annotated tags store metadata (author, date, message):

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Create with detailed message
git tag -a v1.0.0 -m "Release version 1.0.0

Features:
- User authentication
- Dashboard redesign

Fixes:
- Login timeout issue (#123)
- Memory leak in worker (#456)"
```

### Lightweight Tags

Simple pointer to a commit (no metadata):

```bash
git tag v1.0.0
```

### Tag Specific Commit

```bash
# Tag a past commit
git tag -a v1.0.0 abc1234 -m "Release version 1.0.0"
```

---

## Managing Tags

### List Tags

```bash
# List all tags
git tag

# List with pattern
git tag -l "v1.*"

# List with details
git tag -n

# List sorted by version
git tag -l --sort=-v:refname
```

### View Tag Details

```bash
# Show tag info and commit
git show v1.0.0

# Show just the commit
git rev-parse v1.0.0
```

### Delete Tags

```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin --delete v1.0.0
# or
git push origin :refs/tags/v1.0.0
```

---

## Pushing Tags

```bash
# Push single tag
git push origin v1.0.0

# Push all tags
git push origin --tags

# Push only annotated tags (recommended)
git push origin --follow-tags
```

---

## Version Bump Workflow

### 1. Determine Version Type

| Changes Made | Bump Type | Example |
|--------------|-----------|---------|
| Breaking API changes | MAJOR | `1.2.3` -> `2.0.0` |
| New features (backwards compatible) | MINOR | `1.2.3` -> `1.3.0` |
| Bug fixes only | PATCH | `1.2.3` -> `1.2.4` |

### 2. Update Version Files

Common files that may need updating:

```bash
# Node.js
package.json         # "version": "1.0.0"

# Python
setup.py            # version="1.0.0"
pyproject.toml      # version = "1.0.0"
__version__.py      # __version__ = "1.0.0"

# Other
VERSION             # 1.0.0
version.txt         # 1.0.0
```

### 3. Create Tag and Push

```bash
# Commit version bump
git add .
git commit -m "chore: bump version to 1.1.0"

# Create tag
git tag -a v1.1.0 -m "Release version 1.1.0"

# Push commit and tag
git push origin main
git push origin v1.1.0
```

---

## Release Checklist

- [ ] All tests passing
- [ ] CHANGELOG updated
- [ ] Version files updated
- [ ] Documentation current
- [ ] No uncommitted changes
- [ ] On correct branch (main/master)
- [ ] Previous release tagged

---

## Changelog Integration

### Keep a Changelog Format

```markdown
# Changelog

## [1.1.0] - 2024-01-15

### Added
- New user profile page
- Export to PDF feature

### Changed
- Improved dashboard performance

### Fixed
- Login timeout issue (#123)

## [1.0.0] - 2024-01-01

### Added
- Initial release
```

### Link Tags in Changelog

```markdown
[1.1.0]: https://github.com/user/repo/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
```

---

## Commands Reference

```bash
# Get latest tag
git describe --tags --abbrev=0

# Get current version with commits since tag
git describe --tags

# List tags with dates
git tag -l --format='%(refname:short) %(creatordate:short)'

# Find which tag contains a commit
git tag --contains abc1234

# Checkout specific tag
git checkout v1.0.0

# Create branch from tag
git checkout -b hotfix-1.0.1 v1.0.0

# Compare two tags
git diff v1.0.0..v1.1.0

# Commits between tags
git log v1.0.0..v1.1.0 --oneline
```

---

## Safety Rules

| Action | Risk | Alternative |
|--------|------|-------------|
| Modifying pushed tags | Breaks others' references | Create new tag |
| Force pushing tags | Overwrites history | Delete and recreate |
| Deleting release tags | Loses version history | Mark as deprecated |

### Fixing a Bad Tag

```bash
# If tag not pushed yet
git tag -d v1.0.0
git tag -a v1.0.0 -m "Corrected release"

# If tag already pushed (coordinate with team)
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
git tag -a v1.0.0 -m "Corrected release"
git push origin v1.0.0
```
