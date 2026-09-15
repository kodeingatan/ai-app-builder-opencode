---
description: Review the implementation quality and provide feedback
---

Review the implementation quality, architecture decisions, and code quality.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the task file path or task name.

---

# 1. Objective

Perform a thorough code review of the implementation — **bertindak sebagai QA engineer / tester senior + code reviewer**.

The goal is to answer:

> "Is the implementation high quality? Does it follow best practices? Are ALL user flows berjalan benar dan semua logika benar? Are tests (unit/nuxt/e2e) ada, berkualitas, dan traceable ke User Flow + AC Given/When/Then? Are there improvements needed?"

The output is a review report with actionable feedback, termasuk **penilaian kualitas test (UT/NT/E2E) dan traceability User Flow ↔ AC ↔ Test**. Hasil review menentukan apakah task dapat `APPROVED` (DONE) atau perlu `CHANGES REQUESTED` / `REVISION NEEDED`.

---

# 2. Identify the Task

Determine which task to review.

If `$ARGUMENTS` is:

- a file path (e.g., `tasks/01-migrate-admin-panel-to-nuxt.md`) → use that file
- a folder path (e.g., `tasks/01-migrate-admin-panel-to-nuxt/`) → use `README.md` inside it (folder mode, opsi B)
- a task number (e.g., `01`) → find matching task in `tasks/`
- a task name (e.g., `authentication`) → find matching task in `tasks/`
- empty → list available tasks and ask the user to choose

**Folder mode (opsi B) — task resolution**: a task is EITHER a legacy flat file
`tasks/NN-slug.md` OR a folder `tasks/NN-slug/` whose entrypoint is `README.md`
(status + reading order) with split files `spec.md`, `flow-requirements.md`,
`domain-api-ui.md`, `acceptance-tasks.md`, `verification.md`. Resolution rules:

1. If `$ARGUMENTS` is a folder → read `README.md` in it first, then the split
   files needed for review (all five for full traceability
   User Flow ↔ AC ↔ Test).
2. If `$ARGUMENTS` is a number/name → match against BOTH `tasks/NN-*.md` files
   AND `tasks/NN-*/` folders (folder wins if both exist for the same NN-slug).
3. In folder mode, the `## Status` lives in `README.md` — updating task status
   to DONE means editing `README.md`, not a flat file.
4. When reporting paths (Final Response #12, Task Logs #13), use the folder
   entrypoint `tasks/NN-slug/README.md` for folder-mode tasks.

Read the identified task file(s) completely.

---

# 3. Read Project Knowledge

Before reviewing, read and understand:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
```

These define the standards the implementation should meet.

---

# 4. Understand Anything

If `.ua/` exists, use it to verify:

- architecture consistency
- pattern consistency
- module relationship correctness
- entity relationship correctness

---

# 5. Review Criteria — QA Engineer Lens

Review the implementation against these criteria, dengan penekanan pada **User Flow benar + logika benar + test traceability**. Selalu bertindak sebagai QA engineer yang akan menyetujui/rilis feature.

### 5.1 Architecture & User Flow

| Criterion | Check | QA |
|-----------|-------|-----|
| Separation of concerns | Is logic properly separated? | — |
| Dependency direction | Are dependencies pointing the right way? (FASE 1 → FASE 2) | FASE consistency |
| Module boundaries | Are module boundaries respected? | — |
| API design | Is the API consistent with existing endpoints + 8 field (route/method/request/response/validation/error/auth/authz)? | Mapping ke Flow→API |
| Data flow | Is the data flow clear and correct? + User Flow konsisten FASE 1↔FASE 2 | User Flow |
| User Flow | Apakah diagram/steps/alternate-error di task file benar-benar diimplementasikan tanpa deviasi dari mockup FASE 1? | QA Core |

### 5.2 Code Quality

| Criterion | Check |
|-----------|-------|
| Readability | Is the code easy to understand? |
| Naming | Are names descriptive and consistent? |
| Functions | Are functions focused and not too long? |
| Types | Are TypeScript types correct and complete? |
| Comments | Are complex parts documented? |

### 5.3 Security (QA Gate)

| Criterion | Check | Traceability |
|-----------|-------|--------------|
| Authentication | Is auth properly checked? (JWT) | API > auth |
| Authorization | Is RBAC properly enforced? (Guard + Permission) | API > authz, AC permission |
| Input validation | Is all input validated? (Zod DTO sync FR/BR/EC) | BR/EC → UT |
| SQL injection | Are queries safe? (TypeORM, no raw) | — |
| XSS | Is output properly escaped? (Vue, Naive UI) | — |
| Secrets | Are secrets not hardcoded? | — |
| Permission matrix | 401/403 ter-test E2E? | E2E-02 |

### 5.4 Performance

| Criterion | Check |
|-----------|-------|
| N+1 queries | Are queries optimized? |
| Pagination | Is pagination implemented? (`page/limit/search/sortBy/sortOrder`) |
| Caching | Is caching considered? |
| Bundle size | Are imports optimized? (Naive UI direct import) |

### 5.5 Maintainability & Testability (QA Core)

| Criterion | Check | QA |
|-----------|-------|-----|
| Testability | Is the code testable? Unit/nuxt/e2e mudah ditulis? | — |
| Tests exist | Apakah `## Tasks > Test Plan` (UT/NT/E2E) benar-benar ada sebagai file runnable? | Must |
| Tests quality | Apakah test assert Given/When/Then benar-benar memverifikasi AC? Bukan test dummy? | Must |
| Traceability | Apakah setiap User Flow step + AC ↔ Test ID terdokumentasi dan valid? | Must |
| Coverage | User Flow 100%, AC 100%, BR/EC 100%, UI States 100%? | Must |
| Error handling | Are errors handled properly? (`createError`, NAlert) | Logic |
| Logging | Is logging appropriate? | — |
| Documentation | Is the code self-documenting? + `## UI > Penyesuaian dari design` jika deviasi | FASE 1↔FASE 2 |

### 5.6 Consistency

| Criterion | Check |
|-----------|-------|
| Pattern consistency | Does it follow existing patterns? (EntitySchema, plain object Service, Nitro route, Storybook stories pattern `stories/**/*.stories.*`) |
| Naming consistency | Does it use existing naming conventions? |
| Structure consistency | Does it follow existing file structure? (`server/`, `app/`, `shared/`, `tests/`, `stories/`, `.storybook/`) |
| Import consistency | Does it use correct import aliases `~/`, `@/`, `~~/` + Naive UI direct import? |
| UI consistency | Pixel-perfect vs mockup + **Storybook stories** `tasks/NN-ui-design.md`? (FASE 2) — token `app/utils/naiveui-theme.ts` |
| Storybook consistency | Stories di `apps/web/stories/{feature}/` dengan `themeOverrides` + `NConfigProvider`, a11y addon, docs? |
| Test consistency | Test file naming & location konsisten (`tests/unit/`, `tests/nuxt/`, `tests/e2e/`) + stories di `stories/`? |

### 5.7 QA — User Flow & Logic Correctness (BERTINDAK SEBAGAI QA TESTER)

> Bagian ini WAJIB untuk APPROVED — reviewer harus menjadi QA tester yang memverifikasi flow dan logika benar, bukan hanya style.

| Criterion | Check | Bukti |
|-----------|-------|-------|
| Happy path | Semua User Flow steps happy berjalan end-to-end (E2E-01 PASS)? | E2E playback |
| Alternate/error | Empty, validation 400, 403, edge cases EC-XXX berjalan (E2E-02 PASS)? | E2E playback |
| Business rules | Setiap BR-XXX ditegakkan dan ada UT PASS? | `tests/unit/*.test.ts` |
| Domain rules/invariants | Setiap DR/INV ada UT dan PASS? | `tests/unit/*.test.ts` |
| Functional requirements | Setiap FR ada test dan PASS? | UT/NT/E2E |
| UI States | Loading/empty/error/success/validation/permission ter-render dan ada NT + E2E PASS? | NT + E2E |
| Acceptance | Setiap AC Given/When/Then ada test dan PASS (traceability AC ↔ Test ID)? | Matrix |
| Regression | `npm run test` — semua test lama PASS? | CI |

Jika salah satu baris di atas FAIL atau Test ID kosong / test dummy / tidak runnable → review tidak boleh APPROVED.

---

# 6. Review Process — QA Tester Workflow

### 6.1 Identify Fase

- Baca `## Status` dan filename: `*-ui-design.md` = FASE 1 (design), `*.md` lainnya = FASE 2 (implementation).
- Untuk FASE 1: fokus review adalah design deliverables (wireframe low-fi + mockup hi-fi Naive UI+Tailwind+`naiveui-theme.ts` + **Storybook prototype di project** `apps/web/stories/{feature}/*.stories.ts`) + User Flow + UI 10 sub-bagian — bukan code UT/NT/E2E (tetapi tetap cek traceability User Flow ↔ AC design + cek `npm run build-storybook` PASS & a11y addon).

### 6.2 Read All Changed Files (Termasuk Test Files & Storybook)

Read every file that was created or modified — **termasuk file test + Storybook** (`tests/unit/**/*.test.ts`, `tests/nuxt/**/*.test.ts`, `tests/e2e/**/*.spec.ts`, `apps/web/stories/**/*.stories.ts`, `app/components/...`):

- Apakah file test ada, runnable, dan bukan dummy?
- Apakah Storybook stories ada untuk semua halaman/state (loading/empty/error/success/validation/permission) dengan token `naiveui-theme.ts` + a11y?
- Apakah test benar-benar meng-assert Given/When/Then dari AC?
- Apakah E2E benar-benar menjalankan User Flow steps (bukan hanya visit tanpa assertion)?

### 6.3 Compare with Existing Code & Design FASE 1 + Storybook

Compare the new code with existing similar code + mockup + **Storybook stories** FASE 1 (`apps/web/stories/{feature}/*.stories.ts`):

- Are patterns consistent? (Naive UI direct import, Tailwind utility, token `naiveui-theme.ts`, `.detail-view` no `NDescriptions`)
- Are conventions followed?
- Is the quality comparable?
- Untuk FASE 1: apakah stories render dengan token `naiveui-theme.ts`, semua state ada, a11y PASS, `npm run build-storybook` sukses?
- Untuk FASE 2: apakah pixel-perfect vs mockup + stories `tasks/NN-ui-design.md`? Jika deviasi, apakah ada catatan di `## UI > Penyesuaian dari design`? Apakah `npm run build-storybook` tetap PASS (regresi)?

### 6.4 Check Task Compliance — Traceability QA

Verify the implementation satisfies all task requirements dengan **traceability matrix**:

- [ ] Semua `## User Flow > Steps` diimplementasikan dan ada E2E
- [ ] Semua `Acceptance Criteria Given/When/Then` MET dan ada test (UT/NT/E2E) yang PASS
- [ ] Semua `Business Rules BR-XXX` + `Domain Rules DR-XXX` + `Invariants INV-XXX` ditegakkan dan ada UT
- [ ] Semua `Functional Requirements FR-XXX` ada implementasi + test
- [ ] Semua `Edge Cases EC-XXX` ada handling + test
- [ ] Semua `API > Endpoint Overview` 8 field (route/method/request/response/validation/error/auth/authz) terimplementasi + ter-test
- [ ] Semua `UI > States` (loading/empty/error/success/validation/permission) ter-render + ada NT/E2E
- [ ] Semua `UI Requirements` 10 sub-bagian (halaman/layout/component/interaction/responsive + states + accessibility) terpenuhi (FASE 1: di mockup, FASE 2: di code + test)
- [ ] Semua `UI` di FASE 2 mereferensikan mockup FASE 1 (tidak desain ulang tanpa catatan)
- [ ] Security (auth, RBAC, validation) ter-test (401/403 E2E)

Gunakan tabel `## Tasks > Test Plan` di task file sebagai checklist — setiap baris harus PASS.

### 6.5 Identify Improvements — Sebagai QA

Identify:

- code smells
- potential bugs — terutama logic yang tidak ter-cover test (FR/BR/DR/INV tanpa UT)
- user flow gaps — step tanpa E2E, alternate/error tanpa handling
- performance issues
- security concerns
- architecture violations
- missing error handling / validation
- missing tests — khususnya User Flow step tanpa E2E, AC tanpa Test ID, BR/EC tanpa UT
- dummy tests — test yang selalu PASS tanpa assertion bermakna
- mockup drift — code menyimpang dari `tasks/NN-ui-design.md` tanpa catatan

---

# 7. Review Report — QA Tester Mode

Generate a review report **sebagai QA tester + code reviewer** — harus menilai user flow & logika benar + kualitas test:

````md
# Review Report — Task NN: {Task Name} (FASE X)

## Summary

- **Status**: APPROVED / CHANGES REQUESTED / REVISION NEEDED
- **Fase**: FASE 1 — UI Design / FASE 2 — Implementation
- **Date**: {date}
- **Reviewer**: /review (QA engineer mode)
- **User Flow coverage**: {X/Y steps ter-cover E2E}
- **Acceptance coverage**: {X/Y AC ter-cover test}
- **Test quality**: PASS / FAIL (dummy? traceable?)

## Architecture & User Flow Review

| Criterion | Rating | Notes |
|-----------|--------|-------|
| Separation of concerns | OK/ISSUE | {notes} |
| Dependency direction (FASE 1→FASE 2) | OK/ISSUE | {notes} |
| Module boundaries | OK/ISSUE | {notes} |
| API consistency (8 field) | OK/ISSUE | {notes} |
| User Flow FASE 1↔FASE 2 konsisten | OK/ISSUE | {notes} |
| UI pixel-perfect vs mockup + Storybook FASE 1 | OK/ISSUE | {notes — token `naiveui-theme.ts`, `apps/web/stories/{feature}/*.stories.ts`} |
| Storybook prototype (FASE 1 — Naive UI+Tailwind+`naiveui-theme.ts`) | OK/ISSUE | {stories ada untuk semua halaman/state, a11y PASS, `build-storybook` sukses} |

## Code Quality Review

| Criterion | Rating | Notes |
|-----------|--------|-------|
| Readability | OK/ISSUE | {notes} |
| Naming | OK/ISSUE | {notes} |
| Function design | OK/ISSUE | {notes} |
| Type safety | OK/ISSUE | {notes} |
| Documentation | OK/ISSUE | {notes} |

## Security Review (QA Gate)

| Criterion | Rating | Notes |
|-----------|--------|-------|
| Authentication (JWT) | OK/ISSUE | {notes} |
| Authorization (Guard+Permission) | OK/ISSUE | {notes} |
| Input validation (Zod, sync BR/EC) | OK/ISSUE | {notes} |
| SQL injection (TypeORM) | OK/ISSUE | {notes} |
| Secrets | OK/ISSUE | {notes} |
| Permission E2E (401/403) | OK/ISSUE | {notes} |

## Performance Review

| Criterion | Rating | Notes |
|-----------|--------|-------|
| Query optimization | OK/ISSUE | {notes} |
| Pagination | OK/ISSUE | {notes} |
| Import optimization | OK/ISSUE | {notes} |

## QA — Tests & Traceability (WAJIB untuk APPROVED)

| Criterion | Rating | Notes |
|-----------|--------|-------|
| Unit tests exist & runnable (UT-01/UT-02) | OK/ISSUE | {file, pass/total, FR/BR/DR/INV coverage} |
| Nuxt tests exist & runnable (NT-01/NT-02) | OK/ISSUE | {file, semua state loading/empty/error/success/validation/permission} |
| E2E happy path (E2E-01) | OK/ISSUE | {User Flow steps ter-cover, assertions bermakna?} |
| E2E alternate/error/edge (E2E-02) | OK/ISSUE | {ALT/ERR/EC + permission 401/403} |
| Storybook stories exist & build PASS | OK/ISSUE | {`apps/web/stories/{feature}/*.stories.ts` — semua halaman/state, token `naiveui-theme.ts`, a11y PASS, `npm run build-storybook` sukses} |
| Tests bukan dummy | OK/ISSUE | {assertion bermakna atau hanya `expect(true).toBe(true)`?} |
| Traceability User Flow ↔ AC ↔ Test ID (termasuk stories) | OK/ISSUE | {setiap AC memiliki Test ID + story variant dan PASS?} |
| Coverage 100% User Flow / AC / BR / EC | OK/ISSUE | {X/Y} |
| Existing regression PASS (`npm run test` + `npm run build-storybook`) | OK/ISSUE | {pass/total, stories regression} |
| Build & typecheck PASS | OK/ISSUE | {notes} |

## Task Compliance — Traceability Matrix (QA)

| Requirement | Status | Test ID | Notes |
|-------------|--------|---------|-------|
| User Flow Step 1: Buka list | MET/NOT MET | E2E-01 | {notes} |
| AC-001 Given/When/Then | MET/NOT MET | E2E-01 | {notes} |
| BR-001 Table name unique | MET/NOT MET | UT-01 | {notes} |
| EC-01 Nama duplikat | MET/NOT MET | UT-01, E2E-02 | {notes} |
| UI State empty | MET/NOT MET | NT-01, E2E-02 | {notes} |
| API POST /api/xxx — validation+auth | MET/NOT MET | UT-01, E2E-01 | {notes} |

> Jika ada baris NOT MET, test missing, atau test dummy → tidak boleh APPROVED.

## Issues

### Must Fix (Before Approval — QA Blocker)

1. **{issue title} — QA Blocker**
    - File: `{file path}`
    - Line: {line number}
    - Problem: {what is wrong — contoh: User Flow step tanpa E2E, AC tanpa test, BR-001 tidak ada UT, test dummy}
    - Solution: {how to fix — buat file `tests/e2e/...` dengan Given/When/Then, dll.}

### Should Fix (Recommended)

1. **{issue title}**
    - File: `{file path}`
    - Problem: {what is wrong}
    - Solution: {how to fix}

### Consider (Optional)

1. **{improvement title}**
    - {description}

## Positive Notes

- {what was done well — termasuk test quality, traceability}
- {good patterns used}
- {clean code examples}

## Conclusion (QA Verdict)

{overall assessment — apakah semua User Flow berjalan benar? Semua logika benar? Semua Given/When/Then PASS? Apakah test traceable dan bermakna? Apakah siap rilis?}

## Recommended Action

- [ ] Fix must-fix QA blockers (User Flow tanpa E2E, AC tanpa test, logic tanpa UT, dummy test, mockup drift)
- [ ] Consider should-fix issues
- [ ] Approve implementation (hanya jika QA verdict PASS — semua flow + logika + test traceable)
- [ ] Request re-review after fixes (jalankan `/verify` lagi sebelum `/review` ulang)
````

---

# 8. Review Quality Rules

### Be Specific

BAD:

```text
Code quality could be better.
```

GOOD:

```text
The `createUser` function in `server/services/users.service.ts:45` is 120 lines long.
Consider extracting the password validation logic into a separate function.
```

### Be Actionable

Every issue should have a clear solution.

### Be Fair

- Acknowledge what was done well
- Focus on improving the code, not criticizing
- Provide constructive feedback

### Be Thorough

- Review all changed files
- Check all task requirements
- Consider edge cases

---

# 9. Severity Levels

### Must Fix

Issues that block approval:

- Security vulnerabilities
- Data loss risks
- Breaking existing functionality
- Architecture violations
- Missing required functionality

### Should Fix

Issues that should be addressed:

- Convention violations
- Missing error handling
- Missing validation
- Code smells
- Performance issues

### Consider

Optional improvements:

- Code optimization
- Additional tests
- Documentation improvements
- Refactoring suggestions

---

# 10. Approval Criteria — QA Gate (Bertindak sebagai QA)

The implementation can be APPROVED when (QA verdict — semua harus terpenuhi):

- [ ] All must-fix issues resolved — termasuk QA blockers (User Flow tanpa E2E/story, AC tanpa test/story, BR/EC tanpa UT)
- [ ] All task requirements met — termasuk User Flow + Requirements/Domain/API/UI + Acceptance Given/When/Then + Storybook stories
- [ ] Semua User Flow steps (happy + alternate + error + edge) berjalan benar — ada E2E + Storybook interaction dan PASS
- [ ] Semua logika benar — FR/BR/DR/INV/EC ada UT dan PASS, validation + error + auth/authz benar
- [ ] Semua AC Given/When/Then PASS dan traceable ke Test ID (UT/NT/E2E) + story variant di `## Tasks > Test Plan`
- [ ] Semua UI States (loading/empty/error/success/validation/permission) ter-render + ada NT/E2E + **Storybook story variant** PASS
- [ ] Pixel-perfect vs mockup + **Storybook stories** `tasks/NN-ui-design.md` (FASE 2) — token `app/utils/naiveui-theme.ts` — atau mockup + stories approved (FASE 1)
- [ ] Tests bukan dummy — assertion bermakna, runnable via `npm run test:unit`, `npm run test:nuxt`, `npm run test:e2e`, coverage User Flow/AC/BR/EC 100%
- [ ] Storybook — `apps/web/stories/{feature}/*.stories.ts` ada untuk semua halaman/state, a11y addon PASS, `npm run build-storybook` sukses (FASE 1 & FASE 2 regresi)
- [ ] No security vulnerabilities — 401/403 E2E PASS, validation Zod sync
- [ ] No breaking changes — `npm run test` + `npm run build-storybook` regression PASS
- [ ] Code follows project conventions (AGENTS.md) + Design System (`naiveui-theme.ts`, Naive UI direct import, Tailwind utility)
- [ ] `npm run build` + `npm run build-storybook` + `vue-tsc` PASS
- [ ] Untuk FASE 1: wireframe/mockup/**Storybook prototype di project** lengkap untuk semua halaman/state/breakpoint + User Flow coverage + peer review via `npm run storybook` (:6006)

---

# 11. Do Not

Do NOT:

- approve code with critical issues
- skip reviewing changed files
- ignore security concerns
- approve without reading the code
- modify code (this is review only)

Exception: updating `tasks/task-logs.md` per #13 IS required and allowed.

---

# 12. Final Response

After review, return:

```text
Review Complete

Task: tasks/NN-task-name.md            # folder mode: tasks/NN-slug/README.md
Status: APPROVED / CHANGES REQUESTED / REVISION NEEDED

Must Fix: N issues
Should Fix: N issues
Consider: N suggestions

Task Logs:
- tasks/task-logs.md updated — Reviewed checked for this task if Status APPROVED, otherwise left unchecked (see #13)

Next Step:

# If APPROVED:
Task is complete! Consider:
- Updating task status to DONE
- Running /knowledge if significant changes

# If CHANGES REQUESTED:
Fix the issues, then:
/implement tasks/NN-task-name.md       # folder mode: tasks/NN-slug/README.md
/verify tasks/NN-task-name.md          # folder mode: tasks/NN-slug/README.md
/review tasks/NN-task-name.md          # folder mode: tasks/NN-slug/README.md

# If REVISION NEEDED:
The task specification may need updating:
/task "describe what needs to change"
```

---

# 13. Update Task Logs (Mandatory Final Step)

After `/review` finishes, you MUST update `tasks/task-logs.md` by checking off what has been reviewed.

This step is mandatory — do NOT skip it.

### 13.1 Rules

1. Read `tasks/task-logs.md`. If it does not exist → CREATE it using the template in `/gen-tasks` #23.2, then apply rule 2.
2. Update ONLY the review tracking for the current task (`tasks/NN-task-name.md`; folder mode: `tasks/NN-slug/README.md`):
   - If Status is **APPROVED**:
     - Overview table: set `Reviewed` column to `[x]` for this task row.
     - Move entry from `## Belum Direview` (`- [ ] tasks/NN-...`) to `## Sudah Direview` (`- [x] tasks/NN-... — {Task Name} — {date} by /review — APPROVED`).
     - Detail per Task: set `Reviewed: [x] {date} by /review — APPROVED: {short summary}`.
      - Optionally update the task file `## Status` to `DONE` if it was `TODO REVIEW` and review is APPROVED (folder mode: edit `README.md` `## Status`).
   - If Status is **CHANGES REQUESTED / REVISION NEEDED**:
     - Do NOT check `[x]`. Keep `[ ]` in Overview and `Belum Direview`.
     - Detail per Task: set `Reviewed: [ ] {date} by /review — CHANGES REQUESTED/REVISION NEEDED: {N must-fix, N should-fix}`.
   - Update `## Last Updated` (`Date`, `By: /review`, task file name).
3. Do NOT touch `Implemented` or `Verified` checklists — those belong to `/implement` and `/verify`.
4. Do NOT reset any existing `[x]` to `[ ]`.
5. Only mark `Reviewed [x]` when review genuinely APPROVED (no must-fix issues, per #10 Approval Criteria).

### 13.2 Verification

Before finishing `/review`, ensure:

- [ ] `tasks/task-logs.md` exists
- [ ] Current task `Reviewed` state matches review Status (APPROVED → `[x]`, otherwise → `[ ]`)
- [ ] Current task in correct section (Sudah vs Belum Direview)
- [ ] Implemented / Verified states untouched
