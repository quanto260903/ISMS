# BMAD Workflow Rules

Agents operate in the following sequence.

repo-analyzer
Analyzes the repository and produces system overview.

analyst
Generates Product Requirements Document (PRD).

project-manager
Creates development backlog and task planning.

architect
Produces architecture documentation.

developer
Implements code based on PRD and architecture.

qa
Reviews implementation and produces QA report.

## Expected document flow

repo-analyzer
→ docs/output/system-overview.md

analyst
→ docs/output/prd.md

project-manager
→ docs/output/backlog.md

architect
→ docs/output/architecture.md

qa
→ docs/output/qa-report.md