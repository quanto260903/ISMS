# Codebase Rules

This repository contains two main applications:

Backend:
ISME_BE

Frontend:
ISMS_FE

Agents must understand the structure before modifying code.

---

# Backend Structure

Location:
ISME_BE

Typical structure:

ISME_BE
│
├── src
│   ├── controllers
│   ├── services
│   ├── repositories
│   ├── models
│   └── config
│
├── tests
└── build configuration

Guidelines:

Controllers
Handle HTTP requests and responses.

Services
Contain business logic.

Repositories
Handle database access.

Models
Represent database entities.

Agents must avoid mixing responsibilities between these layers.

---

# Frontend Structure

Location:
ISMS_FE

Typical structure:

ISMS_FE
│
├── src
│   ├── components
│   ├── pages
│   ├── services
│   ├── hooks
│   └── utils
│
├── public
└── configuration files

Guidelines:

Components
Reusable UI components.

Pages
Top-level routes.

Services
API communication.

Hooks
Reusable logic.

Utils
Helper functions.

---

# Code Modification Rules

Agents are allowed to:

- add new modules
- refactor existing code
- fix bugs
- improve code readability

Agents must NOT:

- break existing architecture
- modify build configuration unnecessarily
- remove important modules without justification

---

# Code Style Rules

Agents must follow these principles:

- clear naming conventions
- modular design
- minimal duplication
- readable code structure

Comments must be written in English.

---

# Implementation Workflow

Before modifying code, agents must:

1. read PRD
docs/output/prd.md

2. read architecture
docs/output/architecture.md

3. read backlog
docs/output/backlog.md

Only then implement changes.

---

# Code Generation Rules

When implementing features:

1. identify the correct module
2. modify the appropriate layer
3. update related files
4. maintain consistency with existing patterns

---

# File Safety

Agents must not modify:

docs/template

Agents may modify:

docs/output

Agents may modify code inside:

ISME_BE  
ISMS_FE

---

# Testing

After implementing changes, agents should:

- validate logic
- suggest tests
- identify potential edge cases

# Testing Rules

Unit Testing

Every new service function must have a unit test.

Test cases must follow the template:

docs/template/Report5.1_Unit Test_Example.csv

Unit test planning artifacts must be written to:

_bmad-output/implementation-artifacts/unit-test-plan.csv


Integration Testing

Every API endpoint must have integration tests.

Test cases must follow the template:

docs/template/Report5.2_Integration Test_Feature 2.csv

Integration test planning artifacts must be written to:

_bmad-output/implementation-artifacts/integration-test-plan.csv