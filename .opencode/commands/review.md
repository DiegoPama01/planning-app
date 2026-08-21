---
description: Review current changes for bugs, security and architectural issues
agent: reviewer
subtask: true
---

Review the current implementation.

Context provided by the developer:

$ARGUMENTS

Inspect the current git diff and any surrounding code needed to understand the
changes.

Focus on:

- correctness
- security
- organization isolation
- data integrity
- business rules
- API contracts
- Angular/API consistency
- missing validation
- error handling
- missing tests
- maintainability
- performance problems when relevant

Do not modify files.

Return:

### Verdict

APPROVE, APPROVE WITH COMMENTS, or REQUEST CHANGES.

### Findings

Classify findings as:

- BLOCKER
- HIGH
- MEDIUM
- LOW
- SUGGESTION

Include the relevant file or location and a recommended fix.

### Missing tests

List important scenarios that should be tested.

### Final recommendation

State whether the current changes are safe to merge.