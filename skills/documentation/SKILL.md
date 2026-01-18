---
name: documentation
description: >
  Write clear, structured documentation for any project.
  Trigger: When writing READMEs, API docs, user guides, or technical documentation.
license: Apache-2.0
metadata:
  author: template
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Writing README files"
    - "Creating API documentation"
    - "Writing user guides or tutorials"
allowed-tools: Read, Edit, Write, Glob, Grep
---

## When to Use

- Writing or updating README.md files
- Creating API reference documentation
- Writing user guides, tutorials, or how-to docs
- Documenting architecture or design decisions
- Creating CONTRIBUTING.md or other project docs

---

## Document Structure by Type

### README.md

```markdown
# Project Name

Brief description (1-2 sentences).

## Features

- Key feature 1
- Key feature 2

## Quick Start

\`\`\`bash
# Installation
npm install project-name

# Usage
npx project-name
\`\`\`

## Documentation

Link to full docs if available.

## Contributing

Link to CONTRIBUTING.md or brief instructions.

## License

License type with link.
```

### API Documentation

```markdown
# API Reference

## Overview

Brief description of the API.

## Authentication

How to authenticate (if applicable).

## Endpoints

### `GET /resource`

Description of what this endpoint does.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | Resource identifier |

**Response:**

\`\`\`json
{
  "id": "123",
  "name": "Example"
}
\`\`\`

**Errors:**

| Code | Description |
|------|-------------|
| 404 | Resource not found |
```

### User Guide

```markdown
# Guide Title

## Overview

What this guide covers and prerequisites.

## Step 1: First Step

Clear instructions with code examples.

## Step 2: Second Step

Continue with logical progression.

## Troubleshooting

Common issues and solutions.

## Next Steps

Links to related guides or advanced topics.
```

---

## Writing Principles

### Clarity

| Do | Don't |
|----|-------|
| Use simple, direct language | Use jargon without explanation |
| One idea per paragraph | Write dense walls of text |
| Active voice ("Run the command") | Passive voice ("The command should be run") |
| Specific examples | Abstract explanations |

### Structure

| Do | Don't |
|----|-------|
| Start with most important info | Bury key info in paragraphs |
| Use headers to organize | Write long unstructured sections |
| Use lists for 3+ related items | Use paragraphs for lists |
| Include code examples | Describe without showing |

### Audience

| Audience | Approach |
|----------|----------|
| Beginners | Explain concepts, avoid assumptions |
| Developers | Focus on API, code examples |
| Users | Task-oriented, step-by-step |
| Contributors | Architecture, conventions |

---

## Code Examples

### Good Example

```python
# Install the package
pip install mypackage

# Import and use
from mypackage import Client

client = Client(api_key="your-key")
result = client.get_data()
print(result)
```

### Bad Example

```python
# This is a comprehensive example showing all the features
# of the package including advanced configuration options
# and error handling patterns that you might need...
from mypackage import Client, Config, ErrorHandler
# ... 50 more lines
```

**Key Rule**: Examples should be minimal and focused. Show one concept at a time.

---

## Formatting Guidelines

### Headers

- Use sentence case: "Getting started" not "Getting Started"
- Maximum 3 levels deep (##, ###, ####)
- Headers should be descriptive and scannable

### Code Blocks

- Always specify language for syntax highlighting
- Keep examples short (< 20 lines ideally)
- Include comments only when necessary

### Tables

Use tables for:
- Parameter/option descriptions
- Feature comparisons
- Reference data

### Links

- Use descriptive link text: "See the [installation guide](./install.md)"
- Not: "Click [here](./install.md)"

---

## Checklist Before Submitting

- [ ] Title clearly describes the content
- [ ] Structure matches the document type
- [ ] Code examples are tested and work
- [ ] No spelling or grammar errors
- [ ] Links are valid
- [ ] Appropriate for target audience
- [ ] Follows project conventions (if any)
