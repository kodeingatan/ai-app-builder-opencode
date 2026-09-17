---
description: Verify the implementation against the task specification
---

Verify the implementation against the task specification and run all checks.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the task file path or task name.

---

# 1. Objective

Verify that the implementation satisfies the task specification — **bertindak sebagai QA engineer / tester independen**.

The goal is to answer:

> "Apakah semua User Flow telah berjalan dengan benar? Apakah semua logika (FR/BR/DR/INV/EC) berjalan benar? Apakah semua Given/When/Then PASS? Apakah tests unit/next/e2e ada dan lolos serta traceable ke User Flow?"

The output is a verification report with pass/fail status for each criterion, terutama **traceability User Flow ↔ AC ↔ Test (UT/NT/E2E)**. Hasil ini dipakai oleh `/review` dan menjadi gate sebelum `DONE`.

---

# 2. Identify the Task

Determine which task to verify.

If `$ARGUMENTS` is:

- a file path (e.g., `tasks/01-migrate-admin-panel-to-next.md`) → use that file
- a folder path (e.g., `tasks/01-migrate-admin-panel-to-next/`) → use `README.md` inside it (folder mode, opsi B)
- a task number (e.g., `01`) → find matching task in `tasks/`
- a task name (e.g., `authentication`) → find matching task in `tasks/`
- empty → list available tasks and ask the user to choose

**Folder mode (opsi B) — task resolution**: a task is EITHER a legacy flat file
`tasks/NN-slug.md` OR a folder `tasks/NN-slug/` whose entrypoint is `README.md`
(status + reading order) with split files `spec.md`, `flow-requirements.md`,
`domain-api-ui.md`, `acceptance-tasks.md`, `verification.md`. Resolution rules:

1. If `$ARGUMENTS` is a folder → read `README.md` in it first, then the split
   files needed for verification (`acceptance-tasks.md` for AC/Tasks/Test Plan,
   `flow-requirements.md` for User Flow traceability, `verification.md` for the
   checklist).
2. If `$ARGUMENTS` is a number/name → match against BOTH `tasks/NN-*.md` files
   AND `tasks/NN-*/` folders (folder wins if both exist for the same NN-slug).
3. In folder mode, AC lives in `acceptance-tasks.md` and the QA checklist in
   `verification.md`. Traceability User Flow ↔ AC ↔ Test spans
   `flow-requirements.md` ↔ `acceptance-tasks.md`.
4. When reporting paths (Final Response #10, Task Logs #11), use the folder
   entrypoint `tasks/NN-slug/README.md` for folder-mode tasks.

Read the identified task file(s) completely.

---

# 3. Read Project Knowledge

Before verifying, read and understand:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
```

These define the standards the implementation must meet.

---

# 4. Understand Anything

If `.ua/` exists, use it to verify:

- module relationships are correct
- entity relationships are correct
- architecture boundaries are respected
- patterns are consistent

---

# 5. Verification Checklist — QA Perspective

Verify against each criterion from the task specification, **bertindak sebagai QA tester yang memverifikasi User Flow dan logika benar**.

### 5.1 Task Phase & User Flow Verification (WAJIB PERTAMA)

Identifikasi Fase:

- **FASE 1 — UI Design** (`*-ui-design.md`): verifikasi adalah **design review + Storybook verification**, bukan hanya code tests. Cek:
  - [ ] `## User Flow` ada (diagram, steps, alternate/error flows)
  - [ ] `## UI` 10 sub-bagian lengkap (halaman, layout, component, interaction, responsive, loading, empty, error, success, accessibility) + token `app/globals.css`
  - [ ] Wireframe / mockup / prototype deliverables ada — **prototype WAJIB Storybook stories di project** (`apps/web/stories/{feature}/*.stories.tsx`) bukan hanya Figma/PNG
  - [ ] Stories ada, runnable via `npm run storybook` (:6006) — per halaman/state (loading/empty/error/success/validation/permission), responsive viewport, a11y addon
  - [ ] `npm run build-storybook` sukses tanpa error
  - [ ] `## Acceptance Criteria (Design)` Given/When/Then ada dan mapping ke User Flow + stories
  - [ ] Konsistensi dengan `docs/design-system.md` & `app/globals.css` (shadcn/ui direct import, Tailwind utility, primary `#0075de`, Inter, radius 12/8/4/full, `lucide-react`)
  - Untuk FASE 1: lanjut ke 5.2 (convention) dan 5.7 (design verification) + 5.6 Storybook build, lewati 5.3–5.5 code tests backend.

- **FASE 2 — Implementation**: lanjut ke 5.2–5.7 lengkap + verifikasi Storybook stories FASE 1 tetap PASS.

Untuk FASE 2, verifikasi:

- [ ] `## User Flow` ada dan KONSISTEN dengan `tasks/NN-ui-design.md` (FASE 1) — tidak ada alur yang diubah tanpa catatan di `Penyesuaian dari design`
- [ ] `## User Flow > Flow → UI Mapping` dan `Flow → API Mapping` ada dan traceable
- [ ] Setiap `## User Flow > Steps` memiliki pasangan AC dan Test ID (lihat `## Tasks > Test Plan`)
- [ ] `## API` 8 field (route, method, request, response, validation, error, auth, authz) sesuai User Flow & UI FASE 1

### 5.2 Code Verification — Traceability ke Task File

Check that all files listed in `## Tasks` + `## Test Plan` exist:

```markdown
## Tasks (FASE 2)

### Backend → [ ] Entity, DTO, Service, API Routes, Auth
### Frontend → [ ] Pages, Components, Composables (sesuai mockup FASE 1)
### Test Plan (QA) → [ ] UT-01/UT-02, CT-01/CT-02, E2E-01/E2E-02
```

For each implemented item:

1. Read the file
2. Verify it follows project conventions (AGENTS.md — EntitySchema, plain object Service, Nitro route, Zod DTO, shadcn/ui direct import, `lib/types/`)
3. Verify it matches the task requirements — mapping ke `User Flow Step` / `AC` / `FR/BR/DR/INV/EC`
4. Verify it works with existing code dan TIDAK menyimpang dari mockup FASE 1 tanpa catatan

### 5.3 Convention Verification (QA Gate)

| Convention | Check | FASE |
|------------|-------|------|
| Naming | Files, functions, variables follow existing patterns | 1 & 2 |
| Structure | Files are in correct directories (`lib/db/entities/`, `components/`, `tests/unit/` etc.) | 2 |
| Imports | Import paths use correct aliases `~/`, `@/`, `~~/` | 2 |
| Types | TypeScript types correct, no unnecessary `any` | 2 |
| Error handling | `createError` h3, Zod validation, `getErrorMessage` + Alert 403 | 2 |
| Validation | Zod DTOs — sync dengan FR/BR/EC | 2 |
| Auth | JWT middleware, cookie/header | 2 |
| RBAC | Guard + Permission (method + URL pattern) | 2 |
| UI | shadcn/ui direct import, Tailwind utility, no `detail-view div`, `.detail-view` | 1 & 2 |
| Design System | `globals.css` tokens, primary #0075de, Inter | 1 & 2 |

### 5.4 Integration Verification

Check that the implementation integrates (FASE 2):

1. New entities are registered in `lib/db/data-source.ts` (`appEntities`)
2. New services are importable from API routes
3. New API routes are accessible (Nitro)
4. New frontend components render correctly (sesuai mockup + **Storybook stories** FASE 1 — `apps/web/stories/{feature}/*.stories.tsx`)
5. New stores/composables work with existing code
6. `## UI > Referensi Design` di FASE 2 benar-benar menunjuk ke `tasks/NN-ui-design.md` + Storybook stories yang ada
7. Storybook stories FASE 1 tetap runnable setelah perubahan FASE 2 (`npm run build-storybook` sukses — regresi visual)

### 5.5 Test Verification — QA Core (WAJIB — Bertindak sebagai QA)

Jalankan sebagai QA tester — pastikan semua User Flow berjalan benar + semua logika benar + Storybook prototype PASS:

```bash
# From apps/web/
npm run test:unit        # Unit — UT-01/UT-02: service, DTO, domain, BR/DR/INV
npm run test:next        # Next.js — CT-01/CT-02: component render semua state
npm run test:e2e         # E2E — E2E-01/E2E-02: happy + alternate/error + permission
npm run test             # All (unit + next) — regression
npm run build-storybook  # Storybook build — stories FASE 1 (+ FASE 2 regression) PASS
# npm run storybook      # Manual: http://localhost:6006 — cek stories render + a11y addon
```

Verifikasi **traceability** (sesuai `## Tasks > Test Plan` di task file):

- [ ] **Unit**: semua UT-01/UT-02 ada, runnable, PASS — setiap FR/BR/DR/INV/EC memiliki test
- [ ] **Next.js**: semua CT-01/CT-02 ada, PASS — setiap UI State (loading/empty/error/success/validation/permission) ter-render dan ada test
- [ ] **E2E**: semua E2E-01/E2E-02 ada, PASS — setiap User Flow step (happy + alternate + error + edge + permission 401/403) ter-cover end-to-end
- [ ] **Storybook**: `npm run build-storybook` PASS — stories untuk semua halaman/state ada (`apps/web/stories/{feature}/*.stories.tsx`), a11y addon PASS, docs render
- [ ] **Coverage**: User Flow steps 100%, AC Given/When/Then 100%, Business Rules 100%, Edge Cases 100% — mapping `User Flow ↔ AC ↔ Test ID` di `## Tasks > Test Plan` terpenuhi
- [ ] **Existing regression**: `npm run test` — semua test lama tetap PASS + `npm run build-storybook` stories lama tetap PASS (tidak ada breaking change)
- [ ] **Baru vs lama**: file test baru mengikuti pola existing (`apps/web/tests/`), stories baru mengikuti pola `apps/web/stories/` + config `.storybook/main.ts`

Jika task adalah FASE 1 (design): verifikasi utama adalah **Storybook** — `npm run storybook` (:6006) tampil + `npm run build-storybook` PASS + checklist `## Verification (Design)` (design system `globals.css`, responsive viewport Storybook, accessibility a11y addon, user flow coverage via stories, peer review via Storybook URL). `npm run test:*` untuk FASE 1 tidak wajib kecuali komponen sudah ada.

### 5.6 Build Verification

```bash
# From apps/web/
npm run build-storybook  # Storybook static build — prototype FASE 1
npm run build            # Production build — Next.js
```

Verify:

- [ ] Storybook build (`npm run build-storybook`) completes without errors — semua stories `apps/web/stories/{feature}/*.stories.tsx` ter-compile
- [ ] Production build (`npm run build`) completes without errors
- [ ] No TypeScript errors (`react-tsc`)
- [ ] No import resolution errors (shadcn/ui direct import, `~/`, `@/`, `~~/` aliases)
- [ ] Storybook stories render dengan token `app/globals.css` (no missing `ThemeProvider`)

### 5.7 User Flow & Acceptance Verification (QA — Kapan Feature Dianggap Benar)

> Kriteria `Given/When/Then` di `## Acceptance Criteria` adalah DEFINISI "benar" menurut QA.

Untuk setiap AC-XXX:

- [ ] `Given` precondition dapat direproduksi (via test setup / seed / mock)
- [ ] `When` aksi dapat dieksekusi (via unit call / component interaction / E2E step)
- [ ] `Then` hasil dapat diverifikasi (assertion PASS)
- [ ] AC mapping ke `User Flow Step` dan ke `Test ID` (UT/NT/E2E) jelas di `## Tasks > Test Plan`

Jalankan E2E sebagai bukti utama: setiap `Given/When/Then` harus memiliki pasangan E2E step yang PASS. Jika ada AC tanpa test, FAIL.

### 5.8 Runtime Verification (Manual QA Smoke)

```bash
# From apps/web/
npm run dev           # Development server
```

Verify (FASE 2):

- [ ] Server starts without errors — tidak ada warning `orm-data-source` / `better-sqlite3` yang baru
- [ ] API endpoints respond correctly — setiap `## API > Endpoint Overview` dapat di-hit dengan token valid/invalid (401/403)
- [ ] Pages render without errors — sesuai mockup + **Storybook stories** FASE 1, responsive desktop/tablet/mobile, no console error — token `globals.css` ter-apply
- [ ] States ter-trigger manual: loading (delay), empty (hapus data), error (matikan API), validation (input salah), permission (role tanpa akses) — sesuai `## UI > States` + Storybook story variants
- [ ] Storybook `npm run storybook` (:6006) — semua stories render, controls interaktif, a11y addon tanpa violation

Untuk FASE 1: verifikasi adalah membuka **Storybook** (`npm run storybook` :6006) — apakah semua User Flow steps dapat diklik via stories tanpa dead-end, apakah semua state variants ada, apakah `npm run build-storybook` sukses (wireframe/mokup PNG di `docs/` hanya arsip).

---

# 6. Verification Report — QA Tester Mode

Generate a verification report **seolah QA tester independen** — fokus pada User Flow + logika benar + traceability test:

````md
# Verification Report — Task NN: {Task Name} (FASE X)

## Summary

- **Status**: PASS / FAIL / PARTIAL
- **Fase**: FASE 1 — UI Design / FASE 2 — Implementation
- **Date**: {date}
- **Verified by**: /verify (QA engineer mode)
- **User Flow coverage**: {X/Y steps PASS}
- **Acceptance coverage**: {X/Y AC PASS}

## Checklist

### Phase & User Flow (WAJIB)

| Item | Status | Notes |
|------|--------|-------|
| Fase teridentifikasi | PASS/FAIL | FASE 1 / FASE 2 |
| User Flow diagram + steps ada | PASS/FAIL | {notes} |
| User Flow konsisten dengan FASE 1 (`NN-ui-design.md`) | PASS/FAIL/N/A | {notes} |
| Flow → UI mapping ada (FASE 2) | PASS/FAIL | {notes} |
| Flow → API mapping ada (FASE 2) | PASS/FAIL | {notes} |
| Setiap User Flow step ada AC + Test ID | PASS/FAIL | {coverage} |

### Code Implementation (FASE 2) / Design Deliverables (FASE 1)

| Item | Status | Notes |
|------|--------|-------|
| FASE 1: Wireframe low-fi | PASS/FAIL/N/A | {path `docs/wireframes/{feature}/`} |
| FASE 1: Mockup hi-fi (shadcn/ui + Tailwind + `globals.css`) | PASS/FAIL/N/A | {implementasi React `components/...` + token check} |
| FASE 1: Storybook stories (prototype di project) | PASS/FAIL/N/A | {`apps/web/stories/{feature}/*.stories.tsx` — semua halaman/state, a11y, `build-storybook` PASS} |
| FASE 2: Entity created | PASS/FAIL/N/A | {notes} |
| Service created | PASS/FAIL/N/A | {notes} |
| API routes created | PASS/FAIL/N/A | {notes} |
| DTO created (Zod) | PASS/FAIL/N/A | {notes} |
| Frontend pages (sesuai mockup + stories FASE 1) | PASS/FAIL/N/A | {notes} |
| Components (semua states — story variant + NT/E2E) | PASS/FAIL/N/A | {notes} |

### Convention Compliance (QA Gate)

| Convention | Status | Notes |
|------------|--------|-------|
| Naming conventions | PASS/FAIL | {notes} |
| File structure | PASS/FAIL | {notes} |
| Import patterns (`~/`, `@/`, `~~/`) | PASS/FAIL | {notes} |
| Error handling (`createError`, Zod) | PASS/FAIL | {notes} |
| Type safety | PASS/FAIL | {notes} |
| Design System (`globals.css`) | PASS/FAIL | {notes} |

### Integration (FASE 2)

| Integration | Status | Notes |
|-------------|--------|-------|
| Entity registered in `orm-data-source.ts` | PASS/FAIL | {notes} |
| Service importable | PASS/FAIL | {notes} |
| API routes accessible (Nitro) | PASS/FAIL | {notes} |
| Frontend renders (sesuai mockup FASE 1) | PASS/FAIL | {notes} |
| UI referensi FASE 1 valid | PASS/FAIL | {notes} |

### Tests — QA Core (Bertindak sebagai QA Tester)

| Test Type | Status | File | Coverage | Notes |
|-----------|--------|------|----------|-------|
| Unit (UT-01/UT-02) | PASS/FAIL/SKIPPED | `tests/unit/{feature}/*.test.ts` | FR/BR/DR/INV/EC | {pass/total, coverage} |
| Next.js (CT-01/CT-02) | PASS/FAIL/SKIPPED | `tests/next/...` | UI States (loading/empty/error/success/validation/permission) | {pass/total} |
| E2E happy (E2E-01) | PASS/FAIL/SKIPPED | `tests/e2e/{feature}.spec.ts` | User Flow happy steps | {pass/total} |
| E2E alternate (E2E-02) | PASS/FAIL/SKIPPED | `tests/e2e/{feature}.alt.spec.ts` | Alternate/error/edge/permission | {pass/total} |
| Storybook build | PASS/FAIL/SKIPPED | `apps/web/stories/{feature}/*.stories.tsx` | All halaman/state + a11y | {`npm run build-storybook` result} |
| Existing regression | PASS/FAIL | `npm run test` + `npm run build-storybook` | All old tests + stories | {pass/total} |

> Traceability WAJIB: setiap AC Given/When/Then ↔ User Flow Step ↔ Test ID harus PASS. Jika ada User Flow step tanpa E2E, FAIL.

### Acceptance — Kapan Feature Dianggap Benar (Given/When/Then)

| AC | User Flow Step | Test ID | Status | Notes |
|----|----------------|---------|--------|-------|
| AC-001 | Step 1 | E2E-01 | PASS/FAIL | {Given/When/Then lolos?} |
| AC-002 | Step 2 | NT-01/E2E-02 | PASS/FAIL | {notes} |
| AC-003 | Step ERR-01 | UT-01/E2E-02 | PASS/FAIL | {notes} |

### Build & Runtime

| Check | Status | Notes |
|-------|--------|-------|
| Typecheck (`react-tsc`) | PASS/FAIL | {notes} |
| Storybook build (`npm run build-storybook`) | PASS/FAIL | {stories compile, a11y, no error} |
| Production build (`npm run build`) | PASS/FAIL | {notes} |
| Dev server starts | PASS/FAIL | {notes} |
| Storybook dev (`npm run storybook` :6006) | PASS/FAIL | {stories render, controls, viewport} |
| API endpoints work (auth 401/403 + 200) | PASS/FAIL | {notes} |
| Pages render (pixel-perfect vs mockup + stories FASE 1) | PASS/FAIL | {notes} |
| Manual QA: states, responsive, accessibility (Storybook a11y) | PASS/FAIL | {notes} |

## Issues Found

### Critical (Wajib Fix — Blocker untuk DONE)

- {issue — contoh: User Flow step tanpa E2E, AC tanpa test, logic BR-001 gagal, build fail, existing test fail}

### Minor (Should Fix)

- {issue — convention, missing error handling, missing validation}

### Suggestions (Consider)

- {optional improvement — test coverage, docs}

## Verification Commands Run (QA)

```bash
npm run test:unit        # {result: X/Y PASS, coverage}
npm run test:next        # {result}
npm run test:e2e         # {result: semua User Flow steps PASS?}
npm run test             # {result: regression PASS?}
npm run build-storybook  # {result: stories FASE 1 PASS? a11y?}
npm run build            # {result}
# manual: npm run storybook (:6006) — stories render + a11y, server starts, E2E happy path playback
```

## Traceability Matrix (QA — User Flow ↔ AC ↔ Test)

| User Flow Step | AC | BR/FR/EC | Test ID | Test File | Result |
|----------------|----|----------|---------|-----------|--------|
| Step 1: Buka list | AC-001 | FR-001 | E2E-01 | `tests/e2e/...` | PASS |
| Step ERR-01: Validasi gagal | AC-004 | BR-002, EC-01 | UT-01, E2E-02 | `tests/unit/...`, `tests/e2e/...` | PASS |

> Jika ada baris dengan Test ID kosong atau Result FAIL → Status tidak boleh PASS.

## Conclusion (QA Verdict)

{ringkasan: apakah semua User Flow berjalan benar? Semua logika benar? Semua Given/When/Then PASS? Apakah siap `/review`?}

## Recommended Action

- [ ] Fix critical issues before review (User Flow tanpa test, AC gagal, logic salah, build fail)
- [ ] Proceed to /review (jika PASS)
- [ ] Task is complete (FASE 1 design DONE atau FASE 2 verified PASS)
````

---

# 7. Issue Classification

### Critical

Issues that MUST be fixed before proceeding:

- Code does not compile
- Existing tests fail
- Security vulnerabilities
- Data loss risks
- Breaking changes to existing functionality

### Minor

Issues that SHOULD be fixed but are not blocking:

- Convention violations
- Missing error handling
- Missing validation
- Missing types

### Suggestions

Optional improvements:

- Code optimization
- Additional tests
- Documentation updates

---

# 8. Auto-Fix Critical Issues

If critical issues are found:

1. Report the issue
2. Ask the user if they want to fix it
3. If yes, fix the issue
4. Re-verify

Do NOT auto-fix minor issues or suggestions.

---

# 9. Do Not

Do NOT:

- skip verification steps
- ignore failing tests
- approve code with critical issues
- modify code (except auto-fix critical issues)
- commit changes

Exception: updating `tasks/task-logs.md` per #11 IS required and allowed.

---

# 10. Final Response

After verification, return:

```text
Verification Complete

Task: tasks/NN-task-name.md            # folder mode: tasks/NN-slug/README.md
Status: PASS / FAIL / PARTIAL

Critical Issues: N
Minor Issues: N
Suggestions: N

Tests: {pass}/{total} passing
Build: PASS/FAIL

Task Logs:
- tasks/task-logs.md updated — Verified checked for this task if Status PASS, otherwise left unchecked (see #11)

Next Step:

# If PASS:
/review tasks/NN-task-name.md          # folder mode: /review tasks/NN-slug/README.md

# If FAIL:
Fix issues, then:
/verify tasks/NN-task-name.md          # folder mode: /verify tasks/NN-slug/README.md
```

---

# 11. Update Task Logs (Mandatory Final Step)

After `/verify` finishes, you MUST update `tasks/task-logs.md` by checking off what has been verified.

This step is mandatory — do NOT skip it.

### 11.1 Rules

1. Read `tasks/task-logs.md`. If it does not exist → CREATE it using the template in `/gen-tasks` #23.2, then apply rule 2.
2. Update ONLY the verification tracking for the current task (`tasks/NN-task-name.md`; folder mode: `tasks/NN-slug/README.md`):
   - If Status is **PASS**:
     - Overview table: set `Verified` column to `[x]` for this task row.
     - Move entry from `## Belum Diverifikasi` (`- [ ] tasks/NN-...`) to `## Sudah Diverifikasi` (`- [x] tasks/NN-... — {Task Name} — {date} by /verify — PASS`).
     - Detail per Task: set `Verified: [x] {date} by /verify — {summary: tests/build results}`.
   - If Status is **FAIL / PARTIAL**:
     - Do NOT check `[x]`. Keep `[ ]` in Overview and `Belum Diverifikasi`.
     - Detail per Task: set `Verified: [ ] {date} by /verify — FAIL/PARTIAL: {N critical, N minor — see report}`.
   - Update `## Last Updated` (`Date`, `By: /verify`, task file name).
3. Do NOT touch `Implemented` or `Reviewed` checklists — those belong to `/implement` and `/review`.
4. Do NOT reset any existing `[x]` to `[ ]`.
5. Only mark `Verified [x]` when verification genuinely PASSED (build + tests + checklist per #5).

### 11.2 Verification

Before finishing `/verify`, ensure:

- [ ] `tasks/task-logs.md` exists
- [ ] Current task `Verified` state matches verification Status (PASS → `[x]`, FAIL/PARTIAL → `[ ]`)
- [ ] Current task in correct section (Sudah vs Belum Diverifikasi)
- [ ] Implemented / Reviewed states untouched
