---
description: Implement a feature using architect, backend, frontend and reviewer agents
---

Implement the following feature:

$ARGUMENTS

Use the specialized agents available in this project.

Follow this workflow.

## Phase 1 - Architecture

Ask @architect to analyze the feature.

The architect must inspect the repository and define:

- scope
- affected components
- backend work
- frontend work
- data model changes
- API contracts
- validation
- required tests
- implementation order

Do not begin implementation until the architecture analysis is complete.

## Phase 2 - Backend

If backend work is required, delegate it to @backend.

Provide the backend agent with the relevant architectural decisions and API
contract.

The backend agent must:

- inspect existing code
- implement the backend changes
- create migrations when required
- add appropriate tests
- run relevant tests

Do not ask the backend agent to modify frontend code.

## Phase 3 - Frontend

If frontend work is required, delegate it to @frontend.

Provide the frontend agent with:

- the feature requirements
- architectural decisions
- the final API contract produced by the backend

The frontend agent must:

- inspect existing Angular code
- implement the UI
- integrate the API
- handle loading/error/empty states
- run relevant build, lint or tests

Do not ask the frontend agent to modify backend code.

## Phase 4 - Review

After implementation, ask @reviewer to inspect all relevant changes.

The reviewer must:

- inspect the git diff
- check correctness
- check security
- check organization isolation
- check API consistency
- check tests
- identify bugs or architectural problems

## Phase 5 - Fixes

If the reviewer returns BLOCKER or HIGH findings:

Delegate each finding back to the appropriate implementation agent.

After fixes are made, ask @reviewer to review the changes again.

Do not endlessly iterate over LOW or SUGGESTION findings.

## Completion

Return a concise final report containing:

### Feature

What was implemented.

### Backend

Backend changes made.

### Frontend

Frontend changes made.

### Tests

Commands executed and results.

### Review

Reviewer verdict and any remaining non-blocking findings.

### Changed files

Important files modified.

### Follow-up

Any work intentionally left outside the scope.

Do not claim something was implemented or tested unless the responsible agent
actually completed it.