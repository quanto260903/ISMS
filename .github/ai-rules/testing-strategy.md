# Testing Strategy

This document defines the testing strategy for the repository.

The goal is to ensure that every feature implemented in the codebase is properly tested using both unit tests and integration tests.

---

# Testing Levels

The project follows two primary testing levels:

1. Unit Testing
2. Integration Testing

Each level has specific responsibilities and artifacts.

---

# Unit Testing

Unit testing validates individual business logic components.

Scope:

Backend service layer.

Example locations:

ISME_BE/src/services

Each function implemented in the service layer must have corresponding unit tests.

---

# Unit Test Requirements

For every new service function created:

- At least one unit test must be written.
- Edge cases must be tested.
- Invalid input scenarios must be tested.
- Expected output must be validated.

Example service function:

assignPolicyToDepartment()

Required unit tests:

- successful assignment
- invalid department
- duplicate assignment

---

# Unit Test Template
Create a new test file for each function in the ISME_BE/AppBackend.Services/Services 

Unit tests must follow the template:

docs/template/Report5.1_Unit Test_Example.csv

Agents must populate this template when generating unit test plans.

Generated unit test planning artifacts must be written to:

_bmad-output/implementation-artifacts/unit-test-plan.csv

---

# Integration Testing
Create a new test file for each API endpoint in the ISME_BE/AppBackend.ApiCore/Controllers 

Integration testing validates communication between system components.

Scope:

API endpoints exposed by the backend.

Example location:

ISME_BE/src/controllers

Every API endpoint must have at least one integration test.

---

# Integration Test Requirements

For every API endpoint:

- success case must be tested
- error case must be tested
- authentication behavior must be tested
- response schema must be validated

Example endpoint:

POST /policies/assign

Required integration tests:

- valid request
- invalid request
- unauthorized request

---

# Integration Test Template

Integration tests must follow the template:

docs/template/Report5.2_Integration Test_Feature 2.csv

Agents must populate this template when generating integration test plans.

Generated integration test planning artifacts must be written to:

_bmad-output/implementation-artifacts/integration-test-plan.csv

---

# Mapping Rules

Agents must map implementation artifacts to testing artifacts.

Service Function → Unit Test

Example:

PolicyAssignmentService.assignPolicyToDepartment()
→ unit test cases

API Endpoint → Integration Test

Example:

POST /policies/assign
→ integration test cases

---

# Testing Workflow

Testing is integrated into the BMAD workflow.

repo-analyzer
→ understand system

analyst
→ define requirements

project-manager
→ create backlog

architect
→ define system design

developer
→ implement code and unit test plan

qa
→ create integration test plan and QA validation

---

# Artifact Locations

Unit test planning:

_bmad-output/implementation-artifacts/unit-test-plan.csv

Integration test planning:

_bmad-output/implementation-artifacts/integration-test-plan.csv

Final QA reports:

docs/output/qa-report.md

---

# Rules for Agents

Agents must follow these rules:

1. Every service function must have unit tests.
2. Every API endpoint must have integration tests.
3. Unit test definitions must follow the unit test template.
4. Integration test definitions must follow the integration test template.
5. Tests must be defined before implementation is finalized.

---

# Test Coverage Expectations

Minimum expectations:

Service Layer:
100% function coverage

API Layer:
100% endpoint coverage

Critical business logic:
multiple test scenarios required.

---

# Agent Responsibilities

Developer agent:

- identify service functions
- create unit test planning artifacts

QA agent:

- identify API endpoints
- create integration test planning artifacts

---

# Quality Assurance Goal

The testing strategy ensures:

consistent test coverage  
traceable test cases  
alignment between implementation and validation