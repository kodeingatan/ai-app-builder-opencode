---
description: Create or update permanent project knowledge
---

Use the `permanent-knowledge` skill.

The user provided exactly one project-context parameter:

$ARGUMENTS

Load the permanent-knowledge skill and execute it.

The skill must:

1. Inspect the repository.
2. Understand the project.
3. Identify the Core Concept.
4. Create or update:
   - docs/PRD.md
   - docs/architecture.md
   - docs/database.md
   - docs/design-system.md
5. Preserve existing valid documentation.
6. Detect conflicts.
7. Avoid modifying application source code.
8. Report what was created, updated, or unchanged.