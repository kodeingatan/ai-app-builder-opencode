---
description: Understand the entire project and create or update AGENTS.md with verified project knowledge
---

You are responsible for understanding the current project and maintaining `AGENTS.md` as the project's operational instruction and architecture guide for AI coding agents.

The user provided exactly one optional project-understanding parameter:

$ARGUMENTS

If `$ARGUMENTS` is empty, understand the project without additional scope instructions.

---

# 1. Objective

Understand the CURRENT state of the repository before making any changes.

Your primary output is:

```text
AGENTS.md
```

Create it if it does not exist.

Update it if it already exists.

The goal is to make `AGENTS.md` accurately represent how this project is currently built, organized, tested, and maintained.

Do NOT rely only on documentation.

Source code is the source of truth for implementation details.

---

# 2. Project Discovery

Inspect the repository systematically.

At minimum inspect:

```text
AGENTS.md
README.md
package.json
pnpm-workspace.yaml
turbo.json
nx.json
docker-compose.yml
.env.example
```

Only inspect files that actually exist.

Also inspect:

```text
docs/
tasks/
src/
apps/
packages/
server/
api/
components/
composables/
pages/
modules/
```

Again, only inspect directories that actually exist.

Identify the real project structure rather than assuming a specific framework structure.

---

# 3. Optional Understand Anything Knowledge Graph

If the `.ua/` directory exists, inspect it as an optional source of project understanding.

The `.ua/` directory may contain Understand Anything knowledge graph files, generated project maps, relationships, summaries, metadata, or other codebase understanding artifacts.

Use `.ua/` to help understand:

* project structure
* file relationships
* module relationships
* dependency relationships
* domain concepts
* architecture
* important symbols
* codebase navigation
* existing project knowledge

Treat `.ua/` as supplementary project knowledge, not as the sole source of truth.

The priority for resolving implementation behavior is:

```text
source code
tests
configuration
Understand Anything knowledge graph
documentation
existing AGENTS.md
```

If information from `.ua/` conflicts with the current source code, treat the current source code as authoritative.

Do not assume that every file inside `.ua/` is intended for direct human editing.

Do not modify `.ua/` unless the user explicitly requests it.

Do not copy the entire knowledge graph into `AGENTS.md`.

Extract only concise, actionable knowledge that helps AI coding agents work correctly.

If `.ua/` does not exist, continue without it and do not treat its absence as an error.

In the final response, report whether `.ua/` was inspected:

```text
Understand Anything Knowledge Graph:
- `.ua/`: inspected / not found / not used
```

---

# 4. Technology Discovery

Determine the actual technology stack from the repository.

Identify:

### Frontend

* framework
* language
* package manager
* build tool
* UI framework
* CSS framework
* state management
* form validation
* API client
* testing framework

### Backend

* framework
* language
* ORM
* database
* validation
* authentication
* authorization
* API architecture
* testing framework

### Infrastructure

* Docker
* CI/CD
* environment configuration
* database infrastructure
* external services

Do not assume technologies from the user's description if the repository contradicts them.

---

# 5. Architecture Discovery

Understand the actual architecture.

Determine:

* application boundaries
* frontend/backend boundaries
* module boundaries
* domain boundaries
* dependency direction
* shared packages
* API structure
* database access pattern
* authentication flow
* authorization flow
* error handling
* configuration management
* external integrations

Use `.ua/` knowledge graph information when available to validate relationships and dependencies, but verify important conclusions against source code and configuration.

Identify architectural patterns actually used in the codebase.

Do not introduce architectural patterns merely because they are considered best practice.

Document existing conventions first.

---

# 6. Codebase Structure

Identify important directories and their responsibilities.

For example:

```text
apps/
├── web/
│   ├── pages/
│   ├── components/
│   ├── composables/
│   └── ...
└── api/
    ├── modules/
    ├── common/
    └── ...
```

Explain the responsibility of important directories.

Use `.ua/` knowledge graph information when it helps identify module boundaries or relationships that are not obvious from directory names.

Do not document every insignificant file.

Focus on directories and modules that an AI agent needs to understand before modifying code.

---

# 7. Coding Conventions

Inspect the codebase to discover existing conventions.

Determine:

* naming conventions
* file naming
* component naming
* composable naming
* service naming
* DTO naming
* entity naming
* API naming
* database naming
* import conventions
* folder conventions
* error handling conventions
* validation conventions
* type conventions

Use actual code examples internally to verify conventions.

Use `.ua/` as an additional reference for symbol and module relationships when available.

Do not invent conventions that are not present.

---

# 8. Frontend Conventions

If a frontend exists, understand:

* page structure
* layout system
* component architecture
* reusable components
* composables
* state management
* API integration
* form architecture
* validation
* loading states
* empty states
* error states
* notification patterns
* modal/dialog patterns
* responsive patterns
* accessibility conventions

Determine the actual UI architecture.

Pay special attention to existing Design System implementation.

If:

```text
docs/design-system.md
```

exists, compare it against the implementation.

Do not replace established UI patterns without justification.

---

# 9. Backend Conventions

If a backend exists, understand:

* module structure
* controller structure
* service structure
* repository/data-access structure
* DTO structure
* entity/model structure
* validation
* authentication
* authorization
* guards/middleware
* exception handling
* response format
* pagination
* filtering
* sorting
* transactions
* logging

Document conventions that future AI agents must follow.

---

# 10. Database Understanding

Inspect the database implementation.

Determine:

* database engine
* schema structure
* entities/models
* relationships
* primary keys
* foreign keys
* indexes
* unique constraints
* soft delete strategy
* timestamps
* migrations
* naming conventions

Compare implementation with:

```text
docs/database.md
```

If contradictions exist, treat the actual implementation as the current implementation truth.

Do NOT automatically modify `docs/database.md` unless explicitly requested.

Record important discrepancies in `AGENTS.md` only when they affect development behavior.

---

# 11. Permanent Knowledge

Inspect:

```text
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
```

Use these documents as project-level knowledge.

Understand the relationship:

```text
PRD
 │
 ├── Product requirements
 │
 ▼
Architecture
 │
 ├── System architecture
 │
 ▼
Database
 │
 ├── Data architecture
 │
 ▼
Design System
 │
 └── UI/UX architecture
```

Also inspect:

```text
tasks/
```

to understand currently defined feature specifications.

If `.ua/` contains knowledge related to these areas, use it as supplementary context and verify it against the current documentation and implementation.

---

# 12. Core Concept Detection

Identify the project's Core Concept.

Determine:

* primary business domain
* main entities
* main workflows
* relationships between core concepts
* important terminology
* application lifecycle

Use the `.ua/` knowledge graph when available to identify relationships between core entities and modules.

Represent the concept using a concise model where useful.

Example:

```text
Global Table
      │
      ▼
Component
      │
      ▼
Template
      │
      ▼
Administration
```

Do not assume this example applies to the project.

Derive the actual concept from the repository and documentation.

---

# 13. Development Workflow

Determine how developers are expected to work on the project.

If the project uses SDD, document:

```text
Permanent Knowledge
        ↓
      Task
        ↓
      Plan
        ↓
   Implement
        ↓
     Verify
        ↓
     Review
```

Reference the actual project commands if they exist.

For example:

```text
/knowledge
/task
/plan
/implement
/verify
/review
```

Do not claim commands exist unless they actually exist in the repository.

---

# 14. AGENTS.md Rules

`AGENTS.md` must contain actionable instructions for AI coding agents.

It should answer:

1. What is this project?
2. What is the Core Concept?
3. Where is the important code?
4. What architecture must be followed?
5. What conventions must be followed?
6. What documentation must be read before coding?
7. What must never be changed casually?
8. How should a feature be implemented?
9. How should code be verified?
10. What commands should be used?

---

# 15. AGENTS.md Structure

Create or update `AGENTS.md` using this structure:

````md
# AGENTS.md

## Project Overview

{Concise project description}

## Core Concept

{Core domain concept}

## Technology Stack

### Frontend

...

### Backend

...

### Database

...

### Infrastructure

...

## Repository Structure

```text
{important project structure}
````

## Architecture

{important architectural rules}

## Domain Model

{important domain concepts}

## Frontend Guidelines

{frontend conventions}

## Backend Guidelines

{backend conventions}

## Database Guidelines

{database conventions}

## UI/UX Guidelines

{important UI/UX conventions}

## Coding Conventions

{naming and coding conventions}

## API Conventions

{API conventions}

## Testing

{testing conventions and commands}

## Development Workflow

{development workflow}

## SDD Workflow

{SDD process if applicable}

## Documentation

Always consult the relevant documentation before implementation:

* `docs/PRD.md`
* `docs/architecture.md`
* `docs/database.md`
* `docs/design-system.md`
* `tasks/`
* `.ua/` when available and relevant for project relationships and knowledge graph context

## Important Rules

* Follow existing architecture.
* Reuse existing components and utilities.
* Do not introduce duplicate abstractions.
* Do not change database structure without considering existing dependencies.
* Do not bypass established validation and authorization.
* Follow the Design System.
* Keep implementation consistent with existing modules.
* Update task specifications when requirements change.
* Treat `.ua/` as supplementary knowledge and verify important conclusions against source code.

## Verification

{commands and verification expectations}

## AI Agent Instructions

Before implementing a feature:

1. Understand the relevant task.
2. Read relevant Permanent Knowledge.
3. Inspect `.ua/` when available and relevant.
4. Inspect existing implementations.
5. Reuse established patterns.
6. Implement the smallest consistent change.
7. Run verification.
8. Review the result against the task specification.

````

Adapt this structure to the actual project.

Do not blindly include irrelevant sections.

---

# 16. Preserve Existing AGENTS.md

If `AGENTS.md` already exists:

DO NOT overwrite it blindly.

First:

1. read it
2. identify valuable project instructions
3. compare with current repository
4. preserve still-valid rules
5. remove obsolete rules only when clearly contradicted
6. update outdated architecture
7. add missing knowledge

Preserve useful human-written instructions.

The resulting file must represent the CURRENT project.

---

# 17. Conflict Detection

Look for contradictions between:

```text
AGENTS.md
docs/
tasks/
source code
configuration
package.json
.ua/
```

Classify findings:

```text
CURRENT
OUTDATED
CONFLICT
UNKNOWN
```

When uncertain, do not invent facts.

Prefer:

```text
source code
configuration
tests
```

as evidence for implementation behavior.

Use documentation for intended architecture and product requirements.

Use `.ua/` to identify potentially relevant relationships, but verify important claims against the current repository.

---

# 18. No Application Implementation

This command is an understanding/documentation command.

Do NOT modify:

```text
src/
apps/
packages/
server/
api/
components/
pages/
modules/
.ua/
```

Do NOT:

- create features
- refactor code
- change database
- install packages
- modify dependencies
- change configuration
- regenerate or edit Understand Anything knowledge graph files

The primary modification allowed by this command is:

```text
AGENTS.md
```

Do not modify Permanent Knowledge documents unless explicitly requested.

---

# 19. Final Verification

After updating `AGENTS.md`, verify:

### Accuracy

- Does it describe the actual stack?
- Does it describe the actual architecture?
- Does it describe the actual project structure?
- Are commands real?
- Are conventions based on existing code?
- Are relevant `.ua/` insights verified against the repository?

### Consistency

Compare with:

```text
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
tasks/
.ua/
```

### AI Usability

Ensure instructions are:

- actionable
- concise
- non-duplicative
- specific
- deterministic
- easy for an AI coding agent to follow

Avoid generic instructions such as:

```text
Write clean code.
Use best practices.
Make the application scalable.
```

Prefer concrete rules based on the actual repository.

---

# 20. Final Response

Return:

```text
Project Understanding Complete

AGENTS.md:
- CREATED / UPDATED / NO CHANGE

Project:
{project name}

Core Concept:
{core concept}

Stack:
{summary}

Architecture:
{summary}

Understand Anything Knowledge Graph:
- `.ua/`: inspected / not found / not used
- Relevant knowledge: ...

Important Conventions:
- ...
- ...
- ...

Documentation:
- PRD: ...
- Architecture: ...
- Database: ...
- Design System: ...
- Tasks: ...
- `.ua/`: ...

Detected Conflicts:
- ...

AGENTS.md Changes:
- ...
- ...
- ...

Next Recommended Step:

/task "describe the next feature"
```

Do not output the entire `AGENTS.md` unless explicitly requested.
````
