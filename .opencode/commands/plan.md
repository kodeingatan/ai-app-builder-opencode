---
description: Create a detailed implementation plan from a task specification
---

Create a detailed implementation plan from a task specification in `tasks/`.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the task file path or task name.

---

# 1. Objective

Transform a task specification into a detailed, step-by-step implementation plan.

The goal is to answer:

> "How exactly should this task be implemented, file by file, function by function?"

The output is an implementation plan that can be directly executed by `/implement`.

---

# 2. Identify the Task

Determine which task to plan.

If `$ARGUMENTS` is:

- a file path (e.g., `tasks/01-migrate-admin-panel-to-next.md`) → use that file
- a task number (e.g., `01`) → find matching task in `tasks/`
- a task name (e.g., `authentication`) → find matching task in `tasks/`
- empty → list available tasks and ask the user to choose

Read the identified task file completely.

---

# 3. Read Project Knowledge

Before planning, read and understand:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
```

Also read:

```text
tasks/
```

to understand dependencies between tasks.

---

# 4. Understand Anything

If `.ua/` exists, use it as supplementary context for:

- existing modules and their relationships
- existing entities and patterns
- architecture boundaries
- dependency direction
- implementation patterns already in use

Priority:

```text
Current Source Code
        ↓
Task Specification
        ↓
Understand Anything
        ↓
Permanent Knowledge
```

---

# 5. Analyze the Task

From the task specification, extract:

### Fase

- Apakah FASE 1 — UI Design (wireframe/mockup/prototype) atau FASE 2 — Implementation
- Jika FASE 2, identifikasi `Dependencies: tasks/NN-ui-design.md` dan `## UI > Referensi Design` — plan TIDAK BOLEH mendesain ulang UI

### User Flow

- Diagram, steps, alternate/error flows
- Flow → UI mapping dan Flow → API mapping (FASE 2)
- Pastikan setiap AC Given/When/Then dapat ditelusuri ke User Flow step

### Scope

- What is included
- What is excluded

### Dependencies

- Which tasks must be completed first (FASE 1 → FASE 2)
- Which entities/modules are affected

### Affected Areas

- Backend files to create/modify
- Frontend files to create/modify — termasuk **Storybook stories** `apps/web/stories/{feature}/*.stories.tsx` untuk FASE 1 (prototype langsung di project, shadcn/ui + Tailwind + `globals.css`)
- Database changes
- Configuration changes
- Documentation changes
- Test files to create (`tests/unit`, `tests/next`, `tests/e2e`) — bertindak sebagai QA
- Storybook verification — `npm run storybook` (:6006) + `npm run build-storybook`

### Patterns to Follow

- Existing service patterns
- Existing component patterns
- Existing API route patterns
- Existing DTO patterns
- Existing entity patterns
- Existing test patterns (`apps/web/tests/` — unit, next, e2e, Playwright)

---

# 6. Inspect Existing Code

Before planning new code, inspect what already exists:

### Backend

- Check existing entities in `lib/db/entities/`
- Check existing services in `lib/services/`
- Check existing API routes in `app/api/`
- Check existing DTOs in `lib/dto/`
- Check existing utils in `lib/utils/`

### Frontend

- Check existing pages in `app/(dashboard)/ | app/builder/ | app/generated/[slug]/ → `
- Check existing components in `components/`
- Check existing composables in `hooks/`
- Check existing stores in `stores/`
- Check existing plugins in `app/`
- Check existing middleware in `middleware.ts`

### Shared

- Check existing types in `lib/types/`

Identify what already exists and what needs to be created.

---

# 7. Generate Implementation Plan

> Catatan: File `tasks/NN-*.md` hasil `/gen-tasks` dan `/task` SUDAH mencantumkan plan terperinci di `## Tasks` (+ `## Test Plan` QA + `## Verification`). Command `/plan` bersifat **optional/refinement**: jika Tasks di task file sudah lengkap, plan hanya memperinci langkah eksekusi file-by-file. Jika belum lengkap, plan melengkapinya. Selalu konsisten dengan User Flow + UI FASE 1 (termasuk **Storybook prototype di project**) + QA perspective.

> **Deliverables Design Dulu — Storybook-First**: Untuk FASE 1, prototype WAJIB langsung implementasi pada project (`components/...` + `app/(dashboard)/ | app/builder/ | app/generated/[slug]/ → ...` + `apps/web/stories/{feature}/*.stories.tsx`) dengan shadcn/ui + Tailwind + token `app/globals.css`, dibaca via `npm run storybook` (port 6006) dan `npm run build-storybook`. Figma/PNG hanya sebagai arsip, bukan deliverable utama.

Create a detailed plan with these sections:

````md
# Implementation Plan — Task NN: {Task Name} (FASE X)

## Overview

{Brief summary — sebutkan Fase, apakah UI design atau implementation, dan referensi ke FASE 1 jika ada}

## Fase & Dependencies

- Fase: FASE 1 — UI Design / FASE 2 — Implementation
- Depends on: `tasks/NN-ui-design.md` (jika FASE 2)
- User Flow: {ringkasan diagram + jumlah steps}
- Referensi Design: {tasks/NN-ui-design.md → wireframe/mockup/prototype} (jika FASE 2)

## Prerequisites

- [ ] Task `NN-ui-design.md` DONE — termasuk Storybook stories `apps/web/stories/{feature}/*.stories.tsx` PASS (`npm run storybook` + `npm run build-storybook`) (jika FASE 2)
- [ ] Dependencies installed
- [ ] Database ready
- [ ] Design tokens `app/globals.css` + Storybook prototype tersedia & runnable (jika FASE 2)

## Implementation Steps

> Untuk FASE 1: langkah adalah Discovery → Wireframe → Mockup (shadcn/ui + Tailwind + `globals.css`) → Prototype **Storybook di project** (`apps/web/stories/{feature}/*.stories.tsx` + `components/...`) → Handoff via `npm run storybook` (:6006) + `npm run build-storybook`.
> Untuk FASE 2: langkah mengikuti `## Tasks` di task file (Backend → Frontend → Test Plan QA), selalu mengacu mockup + **Storybook stories** FASE 1 dan User Flow.

### Step 1: {Step Name} — {User Flow Step / AC mapping}

**Priority**: HIGH/MEDIUM/LOW

**Fase**: FASE 1 / FASE 2

**Files to create/modify**:
- `path/to/file1.ts` — {what changes}
- `path/to/file2.ts` — {what changes}

**Details**:
{exact code changes, function signatures, type definitions — untuk FASE 2, sebutkan referensi mockup/wireframe FASE 1}

**User Flow / AC mapping**:
- Covers: `User Flow Step X`, `AC-XXX`, `FR/BR/DR/INV-XXX`

**Verification**:
- [ ] {how to verify this step — kaitkan ke test ID UT-XXX/NT-XXX/E2E-XXX}

### Step 2: {Step Name}

...

## File Change Summary

| Action | File | Description | Fase | User Flow / AC |
|--------|------|-------------|------|----------------|
| CREATE | `lib/db/entities/xxx.entity.ts` | New entity | FASE 2 | DR-01, Step 3 |
| CREATE | `components/xxx/XXX.react` | New component (sesuai mockup + stories FASE 1) | FASE 2 | Step 2, AC-002 |
| CREATE | `apps/web/stories/{feature}/*.stories.tsx` | **Storybook prototype (FASE 1 — shadcn/ui + Tailwind + `globals.css`, a11y)** | FASE 1 | All Steps, States |
| CREATE | `tests/e2e/xxx.spec.ts` | E2E happy path (QA) | FASE 2 | User Flow Steps 1→3 |
| CREATE | `docs/wireframes/xxx/list.png` | Wireframe low-fi | FASE 1 | Step 1 |

## Test Plan (QA — Bertindak sebagai QA Engineer)

> Diisi seolah QA tester. Setiap User Flow step + AC + BR/EC HARUS memiliki test. Rencana ini akan dipakai `/verify` dan `/review`.

| Test ID | Jenis | File | Mengcover (User Flow / AC / BR) | Ekspektasi Given/When/Then |
|---------|-------|------|----------------------------------|-----------------------------|
| UT-01 | unit | `tests/unit/{feature}.service.test.ts` | FR-001, BR-001, INV-01 | Given valid input When create Then 201 + invariant hold |
| NT-01 | next | `tests/next/{feature}.form.test.ts` | Step 2, States validation | Given empty When submit Then inline error |
| E2E-01 | e2e | `tests/e2e/{feature}.spec.ts` | Steps 1→3 happy path, AC-001..003 | Given logged in When flow Then success |
| E2E-02 | e2e | `tests/e2e/{feature}.alt.spec.ts` | ALT-01, ERR-01, EC-01, permission | Given ... When ... Then ... |

- Unit: `npm run test:unit` — semua UT PASS
- Next.js: `npm run test:next` — semua NT PASS (semua state loading/empty/error/success/validation/permission)
- E2E: `npm run test:e2e` — semua E2E PASS (happy + alternate/error + edge + permission)
- Coverage: User Flow 100%, AC 100%, BR 100%, EC 100%

## Verification Plan (QA)

### Automated (wajib lolos)

- [ ] Typecheck (`react-tsc`)
- [ ] Unit (`npm run test:unit`) — traceability ke FR/BR/DR/INV
- [ ] Next.js (`npm run test:next`) — traceability ke UI States
- [ ] E2E (`npm run test:e2e`) — traceability ke User Flow Steps + AC
- [ ] Storybook build (`npm run build-storybook`) — stories FASE 1 tetap PASS, no error (FASE 1 & FASE 2)
- [ ] Build (`npm run build`)

### Manual / QA Checklist

- [ ] User Flow steps ter-cover E2E + Storybook interaction
- [ ] AC Given/When/Then PASS (traceability ke stories + E2E)
- [ ] Business Rules & Edge Cases PASS
- [ ] States loading/empty/error/success/validation/permission ter-render — ada NT + **Storybook story** + E2E
- [ ] Permission 401/403 matrix
- [ ] Pixel-perfect vs mockup + **Storybook stories** FASE 1 (jika FASE 2) — token `globals.css`
- [ ] Responsive + Accessibility — Storybook viewport + `@storybook/addon-a11y` PASS
- [ ] Storybook — `npm run storybook` (:6006) tampil, semua stories ada, controls & docs render

## Risk Assessment

| Risk | Impact | Mitigation | Related User Flow / AC |
|------|--------|------------|------------------------|
| {risk} | {impact} | {mitigation} | Step X, AC-XXX |

## Estimated Effort

- Files to create: N (termasuk test files UT/NT/E2E)
- Files to modify: N
- Estimated time: X hours
- Fase: FASE 1 / FASE 2 / kedua

## Execution Order

1. {FASE 1: wireframe → mockup (shadcn/ui + Tailwind + `globals.css`) → Storybook prototype di project (`apps/web/stories/{feature}/*.stories.tsx` + `components/...`) → handoff via `npm run storybook` + `npm run build-storybook`}
2. {FASE 2: entity → DTO → service → API → frontend (sesuai Storybook stories FASE 1) → tests QA → Storybook + build verification}
````

---

# 8. Plan Quality Rules

### Be Specific

BAD:

```text
Create the user service.
```

GOOD:

```text
Create `lib/services/users.service.ts` with:
- `findAll(query)` — paginated list with search
- `findOne(id)` — single user with roles relation
- `create(data)` — hash password, save user
- `update(id, data)` — update fields, hash password if changed
- `remove(id)` — delete user and cascade relations
```

### Follow Existing Patterns

Inspect existing code and follow the same:

- naming conventions
- file structure
- function signatures
- error handling
- validation approach

### Minimize Changes

Plan the smallest consistent change that satisfies the task.

Do not:

- refactor unrelated code
- introduce new patterns when existing ones work
- create abstractions without clear need

### Consider Dependencies

Order steps so that:

1. Entities come before services
2. Services come before API routes
3. API routes come before frontend integration
4. Types come before usage
5. Base components come before feature components

---

# 9. Do Not Implement

This command ONLY creates the implementation plan.

Do NOT:

- write application code
- create entities
- create services
- create components
- modify existing files
- install packages
- run commands

The output of this command is the implementation plan only.

---

# 10. Final Response

After creating the plan, return:

```text
Implementation Plan Created

Task: tasks/NN-task-name.md
Plan: {summary}

Steps: N steps
Files to create: N
Files to modify: N
Estimated effort: X hours

Execution Order:
1. {step 1}
2. {step 2}
3. {step 3}

Next Step:

/implement tasks/NN-task-name.md
```

Do not execute the plan.
