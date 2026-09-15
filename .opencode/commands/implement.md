---
description: Implement code based on the task specification and implementation plan
---

Implement code based on a task specification and its implementation plan.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the task file path or task name.

---

# 1. Objective

Execute the implementation plan to produce working code.

The goal is to answer:

> "Write the actual code that satisfies the task specification."

The output is:

- new files created
- existing files modified
- code that follows project conventions

---

# 2. Identify the Task

Determine which task to implement.

If `$ARGUMENTS` is:

- a file path (e.g., `tasks/01-migrate-admin-panel-to-nuxt.md`) → use that file
- a task number (e.g., `01`) → find matching task in `tasks/`
- a task name (e.g., `authentication`) → find matching task in `tasks/`
- empty → list available tasks and ask the user to choose

Read the identified task file completely.

---

# 3. Read Project Knowledge

Before implementing, read and understand:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
```

These define the conventions and patterns you MUST follow.

---

# 4. Understand Anything

If `.ua/` exists, use it as supplementary context for:

- existing implementation patterns
- module relationships
- entity relationships
- code conventions

Priority:

```text
Current Source Code (HIGHEST)
        ↓
Task Specification
        ↓
Implementation Plan
        ↓
Understand Anything
        ↓
Permanent Knowledge
```

Always verify against actual source code.

---

# 5. Pre-Implementation Checklist

Before writing any code:

- [ ] Task specification fully understood — termasuk Fase (1=design / 2=implementation), User Flow, dan referensi `tasks/NN-ui-design.md` jika FASE 2
- [ ] User Flow steps + Alternate/Error flows + Flow→UI/API mapping dipahami dan KONSISTEN dengan FASE 1
- [ ] Implementation plan reviewed (jika ada — note: `tasks/NN-*.md` sudah berisi plan di `## Tasks`; `/plan` bersifat optional refinement)
- [ ] Existing code patterns identified (termasuk test patterns `tests/unit`, `tests/nuxt`, `tests/e2e`)
- [ ] Dependencies verified — untuk FASE 2: pastikan `tasks/NN-ui-design.md` sudah DONE atau minimal tersedia sebagai acuan
- [ ] Test Plan QA dipahami — setiap User Flow step / AC / BR/EC harus memiliki UT/NT/E2E (bertindak sebagai QA engineer)
- [ ] No conflicts with existing code atau dengan prototype FASE 1 detected

---

# 6. Implementation Rules

### Follow Conventions

Inspect existing code and follow the same:

- naming conventions
- file structure
- function signatures
- error handling
- validation approach
- import patterns
- type definitions

### Reuse Existing Code

Before creating new code:

1. Check if similar functionality exists
2. Check if components can be reused
3. Check if utilities can be reused
4. Check if patterns can be followed

### Minimal Changes

Implement the smallest consistent change that satisfies the task.

Do NOT:

- refactor unrelated code
- introduce new patterns when existing ones work
- create abstractions without clear need
- "improve" existing code while implementing new features

### One Step at a Time

Follow the implementation plan step by step.

After each step:

1. Verify the code is syntactically correct
2. Check for type errors
3. Ensure imports resolve

---

# 7. Backend Implementation (FASE 2 — mengacu User Flow + Domain + API di task file)

> Untuk FASE 1 (UI Design): lewati bagian ini — fokus ke Frontend Design di #8 dan deliverables wireframe/mockup/prototype.

### Entity Pattern

```typescript
// server/entities/{name}.entity.ts
import { EntitySchema } from 'typeorm'

export const {Name}Schema = new EntitySchema({
  name: '{name}',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    // ... columns — sesuai ## Domain > Data Model
  },
  relations: {
    // ... relations — sesuai ## Domain > Relationships, perhatikan cascade
  },
})
```
> Daftar invariants / domain rules dari `## Domain > Invariants / Domain Rules` harus ditegakkan di entity/service.

### Service Pattern

```typescript
// server/services/{name}.service.ts
import { getDataSource } from '~/server/utils/db'
import { {Name}Schema } from '~/server/entities/{name}.entity'

export const {Name}Service = {
  async findAll(query: QueryInput) { /* ... */ },
  async findOne(id: number) { /* ... */ },
  async create(data: CreateInput) { /* ... */ },
  async update(id: number, data: UpdateInput) { /* ... */ },
  async remove(id: number) { /* ... */ },
}
```
> Setiap FR/BR/DR harus memiliki branch di service dan akan di-cover oleh unit test UT-XXX (QA perspective).

### API Route Pattern

```typescript
// server/api/{name}/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { QuerySchema } from '~~/server/dto/{name}.dto'
import { {Name}Service } from '~~/server/services/{name}.service'

export default defineEventHandler(async (event) => {
  const query = QuerySchema.parse(getQuery(event))
  return {Name}Service.findAll(query)
})
```
> Setiap endpoint harus sesuai `## API > Endpoint Overview` (route, method, request, response, validation Zod, error, authentication JWT, authorization Guard/Permission) dan mapping ke `User Flow > Flow → API Mapping`.

### DTO Pattern

```typescript
// server/dto/{name}.dto.ts
import { z } from 'zod'

export const CreateSchema = z.object({ /* ... */ })
export type CreateInput = z.infer<typeof CreateSchema>

export const QuerySchema = z.object({ /* ... */ })
export type QueryInput = z.infer<typeof QuerySchema>
```
> Validation harus sinkron dengan FR/BR/EC dan akan di-test via unit + API tests.

---

# 8. Frontend Implementation — Storybook-First

> **FASE 1 — UI Design — Deliverables Design Dulu**: WAJIB buat **wireframe low-fi** → **mockup hi-fi** (Naive UI 2.44 + Tailwind CSS v4 + token `app/utils/naiveui-theme.ts` — primary `#3B82F6`, Inter, radius `6/4/8`, `@vicons/carbon`) → **prototype interaktif LANGSUNG implementasi pada project** (`app/components/...` + `app/pages/...` + **Storybook stories** `apps/web/stories/{feature}/*.stories.ts`) — sesuai `## UI` dan `## User Flow` di task FASE 1. Simpan wireframe di `docs/wireframes/{feature}/`, mockup di `docs/mockups/{feature}/`, **prototype di `apps/web/stories/{feature}/` dibaca via `npm run storybook` (port 6006) & `npm run build-storybook`**. Config: `apps/web/.storybook/main.ts` (`../stories/**/*.stories.*`, addons `a11y`+`docs`, `vue3-vite`) + `apps/web/.storybook/preview.ts` (import `../assets/css/main.css`). Checklist ada di `## Tasks (Design)` di task file. **Figma/PNG hanya arsip, bukan deliverable utama — Storybook adalah single source of truth.**

> **FASE 2 — Implementation**: Implementasi frontend HARUS pixel-perfect terhadap **mockup + Storybook stories FASE 1** (`tasks/NN-ui-design.md` + `apps/web/stories/{feature}/*.stories.ts`). Jangan desain ulang. Jika ada deviasi, catat di `## UI > Penyesuaian dari design`. Verifikasi Storybook tetap PASS (`npm run build-storybook` sukses) setelah perubahan.

### Page Pattern

```vue
<!-- app/pages/{route}/index.vue — sesuai ## UI > Halaman di task FASE 1/2 -->
<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
// logic — mapping ke User Flow Step
</script>

<template>
  <!-- template — Naive UI first, Tailwind utility, no NDescriptions -->
</template>
```

### Component Pattern

```vue
<!-- app/components/features/{name}/{Name}.vue — sesuai ## UI > Components -->
<script setup lang="ts">
// ... props, emits, logic — sesuai mockup FASE 1
</script>

<template>
  <!-- ... template — states: loading/empty/error/success/validation/permission -->
</template>
```

### Composable Pattern

```typescript
// app/composables/use{Name}Data.ts — sesuai task file Frontend checklist
export function use{Name}Data() {
  // ... logic — wrap useApi() dengan auth interceptor
  return { /* ... */ }
}
```

### Store Pattern

```typescript
// app/stores/{name}.ts
import { defineStore } from 'pinia'

export const use{Name}Store = defineStore('{name}', () => {
  // ... state, actions, getters
})
```

### States (WAJIB — sesuai ## UI > States di task)

- Implementasikan semua state: loading (NSpin/NSkeleton), empty (NEmpty + CTA), error (NAlert + retry), success (useMessage), validation (NFormItem), permission denied (NAlert 403 + `rbac-denied`) — **setiap state WAJIB memiliki Storybook story variant di FASE 1** (`Default`, `Loading`, `Empty`, `Error`, `ValidationError`, `PermissionDenied`)
- Setiap state HARUS memiliki test NT-XXX (nuxt) + E2E-XXX (+ story `args` + a11y check via `@storybook/addon-a11y`) — sebagai QA, pastikan ada.

### Storybook Stories (WAJIB FASE 1 — Prototype Langsung di Project)

- Lokasi: `apps/web/stories/{feature}/*.stories.ts` (pattern `../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)` dari `.storybook/main.ts`)
- Per feature minimal 2–3 stories files (mis. `List.stories.ts`, `Form.stories.ts`, `Detail.stories.ts`) — tiap file: `meta` (`title`, `component`, `parameters: { docs, a11y }`) + story variants untuk semua state + interaction (klik, validasi, transisi Anime.js hormati `prefers-reduced-motion`).
- Token check: `NConfigProvider` + `themeOverrides` dari `app/utils/naiveui-theme.ts` di decorator/preview; direct import `import { NButton } from 'naive-ui'`; Tailwind utility only; icon `h(NIcon, null, { default: () => h(Icon) })` dari `@vicons/carbon`.
- Verifikasi: `npm run storybook` (6006) tampil tanpa error, semua stories render; `npm run build-storybook` sukses.

---

# 9. During Implementation — QA Test Creation (Bertindak sebagai QA Engineer)

> Selain code feature, ANDA BERTINDAK SEBAGAI QA ENGINEER: buat file test `unit`, `nuxt`, `e2e` yang memverifikasi semua User Flow berjalan benar dan semua logika benar. Test ini adalah bagian dari `## Tasks > Test Plan` di task file dan akan dipakai `/verify` + `/review`.

### Test Creation (WAJIB — FASE 2)

Ikuti `## Tasks > Test Plan` di task file (UT/NT/E2E mapping ke User Flow/AC/BR/EC):

**Unit tests** (`tests/unit/` atau `server/**/*.test.ts`):

```typescript
// tests/unit/{feature}.service.test.ts
// - 1 test per FR/BR/DR/INV
// - DTO validation (Zod) — valid/invalid/edge
// - Service logic — happy + error + edge + permission
```

**Nuxt tests** (`tests/nuxt/` atau `app/components/**/ *.test.ts`):

```typescript
// tests/nuxt/{feature}.form.test.ts
// - Render semua state: loading/empty/error/success/validation/permission
// - Interaction: klik, submit, validation, navigation — sesuai User Flow
// - Responsive & accessibility — desktop/tablet/mobile, keyboard, ARIA
```

**E2E tests** (`tests/e2e/{feature}.spec.ts` — Playwright):

```typescript
// tests/e2e/{feature}.spec.ts
// - Happy path: semua User Flow steps end-to-end — Given/When/Then dari AC-XXX
// - Alternate/Error: empty, validation 400, 401/403 permission, edge cases EC-XXX
// - Setup: reuseExistingServer, headed default, SLOWMO_MS=100
```

Aturan:
- Setiap User Flow step → minimal 1 E2E case. Setiap AC → minimal 1 test (unit/nuxt/e2e). Setiap BR/EC → test. Setiap UI State → nuxt + e2e.
- Tulis file test eksplisit, jangan placeholder generik. File harus runnable via `npm run test:unit`, `npm run test:nuxt`, `npm run test:e2e`.
- Untuk FASE 1 (design task), tidak ada code test — verifikasi adalah design review (lihat `## Verification (Design)`), bukan vitest/playwright.

### Track Progress

Update the task file's `## Tasks` checklist (centang `[x]` per item) dan sesuaikan dengan `## Test Plan`:

```markdown
## Tasks

### Backend
* [x] Entity
* [x] Service
* [x] Unit tests — UT-01/UT-02

### Frontend
* [x] Pages (sesuai mockup FASE 1)
* [x] Components — semua states
* [x] Nuxt tests — NT-01/NT-02

### Test Plan (QA)
* [x] UT-01 — ...
* [x] NT-01 — ...
* [x] E2E-01 — ...
```

### Handle Errors

If you encounter an error:

1. Read the error message carefully
2. Check if the pattern exists in the codebase
3. Follow existing error handling patterns
4. Do not introduce new error handling patterns
5. Jika error terkait User Flow / UI mismatch dengan FASE 1, catat di `## UI > Penyesuaian dari design` dan `## Open Questions`

### Document Decisions

If you make a decision not covered by the task or plan:

1. Document it in the task file under `Assumptions`
2. Keep it minimal
3. Follow existing patterns
4. Untuk deviasi dari mockup FASE 1, wajib catat alasan

---

# 10. Post-Implementation — QA Smoke (Bertindak sebagai QA)

After implementing all steps — jalankan smoke check sebagai QA sebelum `/verify`:

### Verify Code Quality

1. Check all imports resolve
2. Check TypeScript types are correct
3. Check no `any` types were introduced unnecessarily
4. Check naming conventions are followed
5. Untuk FASE 2: pastikan tidak ada deviasi dari mockup FASE 1 tanpa catatan

### Run Verification (QA Smoke — harus lolos sebelum claim DONE)

```bash
# From apps/web/
npm run test:unit        # Unit — UT-01/UT-02 harus PASS, cover FR/BR/DR/INV
npm run test:nuxt        # Nuxt — NT-01/NT-02 harus PASS, semua state ter-render
npm run test:e2e         # E2E — E2E-01/E2E-02 harus PASS, semua User Flow steps
npm run build-storybook  # Storybook build — stories FASE 1 PASS, no error
npm run build            # Production build — 0 error
# npm run storybook      # Dev Storybook :6006 — cek stories render + a11y PASS
# npm run dev            # Opsional: cek server starts, API endpoints, pages render
```

Checklist QA smoke (mapping ke task file):

- [ ] Semua User Flow steps ada E2E dan PASS + Storybook interaction PASS
- [ ] Semua AC Given/When/Then ada test dan PASS
- [ ] Semua BR/EC ada test dan PASS
- [ ] Semua UI States (loading/empty/error/success/validation/permission) ter-cover NT + **Storybook story variant** + E2E
- [ ] Permission matrix 401/403 ter-test (E2E + Storybook `PermissionDenied` story)
- [ ] Pixel-perfect vs mockup + **Storybook stories** FASE 1 (FASE 2) — token `naiveui-theme.ts`, manual check atau visual test
- [ ] Storybook — `npm run storybook` (:6006) tampil + `npm run build-storybook` sukses (semua stories ada, a11y addon PASS)

Jika salah satu gagal, perbaiki sebelum `/verify` — jangan claim implemented dengan test gagal.

### Update Task Status

Update the task file:

```markdown
## Status

TODO → IN_PROGRESS → DONE (FASE 1: design selesai) atau TODO REVIEW (FASE 2: siap verifikasi)

## Tasks

- Centang semua checklist Backend/Frontend/Test Plan yang sudah selesai
```

Untuk FASE 1 (design task), status akhir adalah `DONE` (tidak perlu `/verify` code, tetapi bisa `/review` design). Untuk FASE 2, status `TODO REVIEW` / `DONE` setelah smoke QA lolos, siap `/verify`.

---

# 11. Do Not

Do NOT:

- skip reading the task specification
- ignore existing code patterns
- create duplicate functionality
- introduce new libraries without justification
- modify unrelated code
- change database schema without task specification
- commit changes (wait for `/verify` and `/review`)

Exception: updating `tasks/task-logs.md` per #13 IS required and allowed.

---

# 12. Final Response

After implementation, return:

```text
Implementation Complete

Task: tasks/NN-task-name.md

Files Created:
- path/to/file1.ts
- path/to/file2.ts

Files Modified:
- path/to/file3.ts
- path/to/file4.ts

Task Logs:
- tasks/task-logs.md updated — Implemented checked for this task (see #13)

Status: Ready for verification

Next Step:

/verify tasks/NN-task-name.md
```

---

# 13. Update Task Logs (Mandatory Final Step)

After `/implement` finishes, you MUST update `tasks/task-logs.md` by checking off what has been implemented.

This step is mandatory — do NOT skip it.

### 13.1 Rules

1. Read `tasks/task-logs.md`. If it does not exist → CREATE it using the template in `/gen-tasks` #23.2, then mark the current task as implemented.
2. Update ONLY the implementation tracking for the current task (`tasks/NN-task-name.md`):
   - Overview table: set `Implemented` column to `[x]` for this task row.
   - Move entry from `## Belum Implementasi` (`- [ ] tasks/NN-...`) to `## Sudah Implementasi` (`- [x] tasks/NN-... — {Task Name} — {date} by /implement`).
   - Detail per Task section: set `Implemented: [x] {date} by /implement — {short notes: files created/modified}`.
   - Update `## Last Updated` (`Date`, `By: /implement`, task file name).
3. Do NOT touch `Verified` or `Reviewed` checklists — those belong to `/verify` and `/review`.
4. Do NOT reset any existing `[x]` to `[ ]`.
5. Do NOT mark implementation `[x]` if implementation failed or was aborted — leave `[ ]` and note the reason under Detail `Notes`.

### 13.2 Verification

Before finishing `/implement`, ensure:

- [ ] `tasks/task-logs.md` exists
- [ ] Current task `Implemented` is `[x]` in Overview + Detail
- [ ] Current task moved from Belum → Sudah Implementasi
- [ ] Verified / Reviewed states untouched
