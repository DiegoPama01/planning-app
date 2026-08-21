---
description: Diagnose and fix a bug using the appropriate specialized agent
---

Fix the following bug or problem:

$ARGUMENTS

First inspect the repository and reproduce or identify the cause of the
problem.

Determine whether the issue belongs primarily to:

- backend
- frontend
- architecture/integration

Delegate implementation to @backend or @frontend when appropriate.

Do not apply speculative fixes.

After the fix:

1. run the smallest relevant tests
2. inspect the resulting diff
3. ask @reviewer to review the fix

If the reviewer identifies a BLOCKER or HIGH issue caused by the fix, address
it before completing.

Return:

### Cause

The root cause identified.

### Fix

What was changed.

### Tests

Tests or validation performed.

### Review

Reviewer verdict.

### Files

Files modified.