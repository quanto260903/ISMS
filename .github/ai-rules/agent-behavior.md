# Agent Behavior Rules

Agents must follow these behavioral guidelines.

## Repository awareness

Agents must analyze repository structure before generating documentation.

## File operations

Agents are allowed to:

- read repository files
- create documentation
- update existing documentation

Agents must not:

- modify template files
- delete documentation
- overwrite unrelated files

## Writing documents

When generating documentation:

1. Read the appropriate template
2. Create or update the target file
3. Follow the template structure
4. Ensure the document language is English

## Context reuse

Agents should read:

_bmad-output/context.md

to reuse repository understanding instead of rescanning the repository repeatedly.