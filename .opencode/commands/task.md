---
description: Generate or update an SDD task specification from a single feature/context parameter
---

Generate or update a task specification using exactly one parameter.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the complete task/feature context.

Follow this workflow strictly.

**Prinsip UI-First — Deliverables Design Dulu**: Pekerjaan yang dikerjakan TERLEBIH DAHULU harus berupa design wireframe UI/UX, mockup, prototype interaktif (file tasks tersendiri — FASE 1). Pekerjaan selanjutnya (FASE 2) BARU mengimplementasikan user flow + requirements + domain + API + code yang mengacu pada UI yang telah dibuat sebelumnya.

**Deliverables Design WAJIB (FASE 1)**:
1. **Wireframe low-fi** — semua halaman & states (desktop/tablet/mobile)
2. **Mockup hi-fi** — shadcn/ui + Tailwind CSS v4 + lucide-react + token `app/globals.css` (HSL `--primary: 210 100% 44%` ~ `#0075de`, Inter, radius 12/8/4, `lucide-react`)
3. **Prototype interaktif LANGSUNG implementasi pada project** — komponen React `components/...` + halaman `app/(dashboard)/ | app/builder/ | app/generated/[slug]/ → ...` + **Storybook stories** `apps/web/stories/{feature}/*.stories.tsx` dibaca via `npm run storybook` (port 6006) & `npm run build-storybook` — bukan hanya Figma/PNG.

# 1. Read Project Knowledge

Before generating the task, inspect and understand:

* `AGENTS.md`
* `docs/PRD.md`
* `docs/architecture.md`
* `docs/database.md`
* `docs/design-system.md`
* all existing files inside `tasks/`

Do not generate the task based only on the user input.

The task must be consistent with the project's Permanent Knowledge.

---

# 2. Understand Existing Tasks

Inspect the existing `tasks/` directory (see `tasks/README.md` for the index).

A task is EITHER a legacy flat file `tasks/NN-slug.md` OR a folder-mode task
`tasks/NN-slug/` whose entrypoint is `README.md` (folder mode, opsi B — preferred
for new tasks). When scanning, match BOTH `tasks/NN-*.md` files AND `tasks/NN-*/`
folders (excluding `tasks/_template/`, `tasks/README.md`, `tasks/task-logs.md`).

Determine:

* latest task number
* existing task naming convention
* apakah feature yang diminta bereits memiliki task `*-ui-design.md` (FASE 1)
* apakah feature yang diminta bereits memiliki task implementation (FASE 2)
* apakah request adalah feature baru, enhancement, atau design-only / implementation-only
* apakah harus membuat FASE 1 terlebih dahulu atau langsung FASE 2

Never create duplicate tasks.

If an existing task represents the same feature **and same FASE**, update that task instead of creating another.

Jika ditemukan task implementation tanpa pasangan `*-ui-design.md` padahal memiliki UI, jangan duplikat implementation — buatlah task UI-design baru terlebih dahulu dan catat di `## Dependencies` task implementation untuk mereferensikannya.

---

# 3. Determine Task Identity & Fase

Tentukan FASE berdasarkan konteks:

### FASE 1 — UI/UX Design (Wireframe / Mockup / Prototype)

Dibuat jika:
- Feature memiliki antarmuka pengguna DAN belum memiliki `NN-feature-ui-design.md`, atau
- User secara eksplisit meminta `design`, `wireframe`, `mockup`, `prototype`, `UI` terlebih dahulu.

Filename (legacy flat mode — only for updating an existing flat task):

```text
NN-feature-ui-design.md
```

**Folder mode (opsi B — preferred for NEW tasks)**: create `tasks/NN-slug/` by
copying `tasks/_template/` and filling per file (`README.md` entrypoint + `spec.md`
+ `flow-requirements.md` + `domain-api-ui.md` + `acceptance-tasks.md` +
`verification.md`). Task identity in reports and `tasks/task-logs.md` is the
entrypoint `tasks/NN-slug/README.md`.

Contoh: `05-global-table-ui-design.md`, `07-component-ui-design.md`

Suffix yang diizinkan: `-ui-design` (preferred), `-design`, `-wireframe`. Untuk task baru gunakan `-ui-design`.

### FASE 2 — Implementation (User Flow + Requirements + Domain + API + Code)

Dibuat jika:
- Feature sudah memiliki pasangan `NN-feature-ui-design.md` (FASE 1 DONE atau minimal TODO), atau
- Feature murni backend tanpa UI (`UI: N/A`), atau
- User meminta implementasi dan design sudah ada.

Filename (legacy flat mode — only for updating an existing flat task):

```text
NN-feature.md
```

Contoh: `06-global-table.md` (depends on `05-global-table-ui-design.md`)

**Aturan penomoran**:
- FASE 1 dan FASE 2 yang berpasangan harus bernomor berurutan, FASE 1 terlebih dahulu.
- Jika task implementation diminta tetapi FASE 1 belum ada, buat FASE 1 terlebih dahulu (atau buat keduanya berurutan dan jelaskan di Final Response).
- Jangan membuat task implementation yang memiliki UI tanpa mereferensikan FASE 1 di `## Dependencies` dan `## UI > Referensi Design`.

If creating a new task:

Determine the next sequential number.

Example:

```text
tasks/
├── 01-auth-ui-design.md
├── 02-authentication.md
└── 03-users-ui-design.md
```

New task (implementation with UI reference):

```text
tasks/04-user-management.md   # Depends on 03-users-ui-design.md
```

Use (legacy flat mode — new tasks SHOULD use folder mode instead):

```text
NN-kebab-case-name.md              # implementation
NN-kebab-case-name-ui-design.md    # UI design
```

Folder mode (opsi B — preferred): `tasks/NN-kebab-case-name/` copied from
`tasks/_template/`, identity = `tasks/NN-kebab-case-name/README.md`.

---

# 4. Determine Scope

Analyze the request and determine:

* FASE (1 = design, 2 = implementation)
* objective & tujuan feature
* user flow (diagram, steps, alternate/error flows) — MANDATORY untuk kedua FASE, dan harus konsisten FASE 1 ↔ FASE 2
* untuk FASE 1: UI deliverables (wireframe, mockup, prototype) dengan 10 sub-bagian (halaman, layout, component, interaction, responsive, loading, empty, error, success, accessibility)
* untuk FASE 2:
  * actors / users
  * use cases (mapping ke User Flow steps)
  * functional requirements
  * business rules & edge cases
  * domain entities, relationships, states, domain rules, invariants
  * API requirements (route, method, request, response, validation, error, authentication, authorization) — mapping ke User Flow & UI FASE 1
  * database impact
  * UI/UX implementation yang MEREFERENSIKAN FASE 1 (bukan desain ulang)
  * frontend & backend requirements
  * acceptance criteria (Given/When/Then — mapping ke User Flow)
  * tasks / implementation checklist (mengacu design FASE 1)
  * testing & verification requirements

Do not invent requirements that contradict the Permanent Knowledge atau bertentangan dengan prototype FASE 1.

If information is missing, make the smallest reasonable assumption and explicitly document it under `Assumptions`.

Jika FASE 2 butuh UI tetapi FASE 1 belum ada, catat di `Assumptions` dan `Open Questions` bahwa design perlu dibuat terlebih dahulu atau buat FASE 1 bersamaan.

---

# 5. Generate Mini-Specification

Every task MUST be a complete mini-specification.

Do not create simple TODO documents.

Terdapat **DUA JENIS TEMPLATE** — pilih sesuai FASE. Semua header bertanda **MANDATORY** wajib ada — jangan dihapus, jangan diganti nama, jangan digabung. Jika tidak relevan, isi `N/A` dengan alasan di `Assumptions`.

## 5.A Template FASE 1 — UI/UX Design Task (Wireframe / Mockup / Prototype)

Gunakan untuk `NN-feature-ui-design.md`.

````md
# Task NN — {Feature} UI Design (Wireframe / Mockup / Prototype)

## Status

TODO

## Objective

{Menghasilkan wireframe, mockup hi-fi, dan prototype interaktif untuk feature {Feature} sebagai acuan implementation FASE 2}

## Context

{Mengapa design ini dibutuhkan terlebih dahulu, posisinya sebagai prasyarat untuk task implementation, ketergantungan terhadap design system / PRD}

## Scope

### In Scope

- Wireframe low-fi untuk semua halaman/state
- Mockup hi-fi (shadcn/ui + Tailwind, token `docs/design-system.md`)
- Prototype interaktif (klik, navigasi, validasi, transisi)

### Out of Scope

- Implementasi API / domain / database
- ...

## Dependencies

- `docs/design-system.md`
- `docs/PRD.md`
- ...

## User Flow

> MANDATORY — diagram + langkah + mapping ke halaman. Flow ini menjadi ACUAN untuk task FASE 2.

### Diagram

```text
[Entry] → {Halaman A} --(primary action)--> {Halaman B} --(success)--> {Halaman C}
                │                                 │
                └--(error/empty)--> {State handling}
```

### Steps

| Step | Actor | Aksi | Halaman / Component | Hasil |
|------|-------|------|---------------------|-------|
| 1 | {Administrator} | Buka menu {Feature} | `/feature` | List tampil |
| 2 | {Administrator} | Klik "Create" | `/feature/create` | Form kosong tampil |
| 3 | ... | ... | ... | ... |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan UI |
|----|----------|-------|---------------|
| ALT-01 | Data kosong | List → Empty state | `Empty` + CTA |
| ERR-01 | Validasi gagal | Form → Inline error | `FormItem` feedback |
| ERR-02 | 403 Forbidden | Any → Permission denied | `Alert` + `rbac-denied (Alert variant=destructive + Portal)` |

## UI

> MANDATORY — 10 sub-bagian wajib + deliverables.

### Halaman

| Route | Halaman | Akses | Deskripsi | Wireframe Ref |
|-------|---------|-------|-----------|---------------|
| `/feature` | List | Admin | Daftar + search + pagination | `wireframe/list.png` |
| `/feature/create` | Create | Admin | Form | `wireframe/create.png` |
| `/feature/:id` | Detail | Admin | Read-only + actions | `wireframe/detail.png` |

### Layout

- Navigasi: {sidebar / workspace / breadcrumb}
- Struktur halaman: {header + filter bar + data table + pagination}
- Penempatan: {di bawah menu "Master Data" → "Feature"}
- Grid & spacing: ikuti token `docs/design-system.md`

### Components

| Component | Lokasi (rencana) | Deskripsi | State Variant |
|-----------|-------------------|-----------|---------------|
| `FeatureDataTable.react` | `components/features/feature/` | Tabel + search/sort/visibility | loading, empty, error |
| `FeatureForm.react` | `components/features/feature/` | Form shadcn/ui | default, validation, disabled |
| `FeatureDetail.react` | `components/features/feature/` | Detail `.detail-view` | loading, error |

### Interaction

- Trigger: {klik "Create" → buka editor}
- Flow: {validate → submit → toast → redirect}
- Konfirmasi: {hapus → AlertDialog / Dialog}
- Transisi/animasi: {Framer Motion fadeInUp, hormati prefers-reduced-motion}
- Prototype link: {Figma / HTML prototype URL}

### Responsive Behavior

| Breakpoint | Perilaku | Wireframe Ref |
|------------|----------|---------------|
| Desktop (≥1024px) | Tabel penuh + sidebar terbuka | `wireframe/desktop.png` |
| Tablet (768–1023px) | Kolom disembunyikan via visibility toggle | `wireframe/tablet.png` |
| Mobile (<768px) | Card list / drawer, form full-width | `wireframe/mobile.png` |

### States

| State | Tampilan | Komponen shadcn/ui | Mockup Ref |
|-------|----------|-------------------|------------|
| Loading | Skeleton / Spinner (Loader2) | `Spinner (Loader2)`, `Skeleton` | `mockup/loading.png` |
| Empty | Illustration + CTA | `Empty` | `mockup/empty.png` |
| Error | Alert + retry | `Alert` | `mockup/error.png` |
| Success | NMessage / NNotification | `toast() via sonner` | `mockup/success.png` |
| Validation | Inline error di field | `FormItem` feedback | `mockup/validation.png` |
| Permission Denied | Alert 403 + event `rbac-denied (Alert variant=destructive + Portal)` | `Alert` | `mockup/403.png` |

### Accessibility

- Keyboard: semua aksi via keyboard, focus trap di modal, tab order
- ARIA: `aria-label` untuk icon-only button
- Kontras & font: ikuti `docs/design-system.md` (primary #0075de, Inter, radius 12/8/4/full)
- Reduced motion: hormati `prefers-reduced-motion`
- Screen reader: label & live region untuk feedback

### Wireframe & Mockup Deliverables

| Deliverable | Format | Lokasi | Status |
|-------------|--------|--------|--------|
| Wireframe low-fi | Figma / PNG | `docs/wireframes/{feature}/` | TODO |
| Mockup hi-fi | Figma / PNG + **React (shadcn/ui + Tailwind, token `globals.css`)** | `docs/mockups/{feature}/` + `components/...` | TODO |
| Prototype interaktif | **Storybook stories langsung di project** | `apps/web/stories/{feature}/*.stories.tsx` (dibaca `npm run storybook` :6006) | TODO |
| Storybook build | Static Storybook | `npm run build-storybook` | TODO |

> **Aturan Storybook (WAJIB FASE 1)**: Prototype TIDAK cukup Figma link/PNG. Harus komponen React nyata (shadcn/ui direct import, Tailwind utility, token `app/globals.css`) + stories `apps/web/stories/{feature}/`. Config `apps/web/.storybook/main.ts` (stories `../stories/**/*.stories.*`, addons `a11y`+`docs`, `react + next`) & `preview.ts` (import `../assets/css/main.css`). Verifikasi: `npm run storybook` :6006 & `npm run build-storybook` sukses.

### Design Tokens Check

- [ ] Warna mengikuti `app/globals.css` (`globals.css HSL tokens` — primary `#0075de`, `primaryColorHover` `#2563EB`, radius `12px/8px/4px/16px/full`, font `Inter`)
- [ ] Typography Inter
- [ ] Radius 6/4/8
- [ ] Spacing Tailwind (`app/assets/css/main.css` + Tailwind v4)
- [ ] Icon `lucide-react` dengan `<IconName size={16} />`
- [ ] Storybook stories me-render dengan `ThemeProvider` + `app/globals.css` HSL tokens (`--primary: 210 100% 44%`)

## Acceptance Criteria (Design)

> MANDATORY — Given/When/Then untuk validasi design.

### AC-D01 — {Judul}

Given {reviewer membuka prototype}

When {mengklik alur utama}

Then {navigasi sesuai User Flow tanpa dead-end}

### AC-D02 — ...

## Tasks (Design)

> MANDATORY — checklist design.

### Discovery

- [ ] Audit halaman & states existing
- [ ] Mapping User Flow → halaman

### Wireframe

- [ ] Low-fi untuk semua halaman (desktop)
- [ ] Low-fi untuk tablet & mobile
- [ ] Wireframe untuk semua states (loading/empty/error/success/validation/permission)

### Mockup

- [ ] Hi-fi mockup dengan shadcn/ui + Tailwind + design tokens
- [ ] Mockup untuk semua breakpoint
- [ ] Mockup untuk semua states

### Prototype

- [ ] Prototype interaktif (klik, navigasi, transisi)
- [ ] Validasi alur dengan User Flow
- [ ] Review internal + iterasi

### Handoff

- [ ] Export assets & spec
- [ ] Dokumentasi komponen & interaction
- [ ] Storybook stories terdokumentasi (`*.stories.ts` args/controls/a11y)
- [ ] Verifikasi Storybook: `npm run storybook` (:6006) & `npm run build-storybook` sukses
- [ ] Tandai `Status: DONE` sebelum FASE 2 dimulai — hanya jika Storybook lolos

## Verification (Design)

- [ ] Design System verification (token `globals.css`, shadcn/ui, Tailwind — no `detail-view div`, pakai `.detail-view`)
- [ ] Responsive verification (desktop/tablet/mobile — wireframe + Storybook viewport)
- [ ] Accessibility verification (keyboard, ARIA, contrast, `prefers-reduced-motion`, a11y addon Storybook)
- [ ] User Flow coverage (semua step ada di Storybook prototype — klik tanpa dead-end)
- [ ] Storybook verification — `npm run storybook` tampil, stories semua halaman/state, `npm run build-storybook` sukses
- [ ] Stakeholder / peer review via Storybook URL (`http://localhost:6006`)

## Assumptions

- ...

## Open Questions

- ...

## Related Knowledge

- `docs/PRD.md`
- `docs/design-system.md`

## Change Log

### Initial

- UI design task created (FASE 1 — UI-First).

````

---

## 5.B Template FASE 2 — Implementation Task (User Flow + Requirements + Domain + API + Code)

Gunakan untuk `NN-feature.md` yang mengacu pada FASE 1.

````md
# Task NN — {Task Name}

## Status

TODO

## Objective

{Jelaskan tujuan feature secara ringkas — apa yang diselesaikan task ini}

## Context

{Mengapa feature ini ada dan bagaimana posisinya dalam produk / roadmap — sebutkan task UI-design prasyarat}

## Scope

### In Scope

- ...

### Out of Scope

- ...

## Dependencies

- `tasks/NN-1-feature-ui-design.md` — Wireframe/Mockup/Prototype (WAJIB untuk feature dengan UI)
- ...

## User Flow

> MANDATORY — WAJIB ada bahkan untuk backend-only. Harus KONSISTEN dengan task UI-design FASE 1.

### Diagram

```text
[Entry] → {Halaman A} --(aksi)--> {Halaman B} --(success/error)--> {Hasil}
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | {Administrator} | Buka list | `/feature` → `GET /api/feature` | Data tampil |
| 2 | {Administrator} | Klik Create | `/feature/create` | Form tampil |
| 3 | {Administrator} | Submit valid | `POST /api/feature` | 201 + redirect + toast |
| 4 | ... | ... | ... | ... |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Data kosong | List → Empty | `Empty` + CTA |
| ERR-01 | Validasi gagal | Submit → 400 | Inline error |
| ERR-02 | Forbidden | Any → 403 | `Alert` + `rbac-denied (Alert variant=destructive + Portal)` |

### Flow → UI Mapping

| Flow Step | Halaman (dari UI-design) | Component | State |
|-----------|--------------------------|-----------|-------|
| Step 1 | `/feature` | `FeatureDataTable.react` | loading → empty/error/success |
| Step 2 | `/feature/create` | `FeatureForm.react` | validation |

### Flow → API Mapping

| Flow Step | HTTP Method | Server Route | Validasi |
|-----------|-------------|--------------|----------|
| Step 1 | GET | `/api/feature` | QuerySchema |
| Step 3 | POST | `/api/feature` | CreateSchema |

## Requirements

> MANDATORY — tidak boleh kosong. Harus mengacu pada User Flow di atas dan UI design FASE 1.

### Tujuan Fitur

- REQ-G01: {tujuan utama — business goal}

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| {Administrator} | {dapat mengelola ...} | {role/permission} |
| {End User} | ... | ... |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | {Administrator} | {membuat Dynamic Entity (per prompt, e.g., Product/Category/Transaction) baru} | {tabel tersimpan} | Step 3 |
| UC-02 | ... | ... | ... | ... |

### Functional Requirements

- FR-001: {sistem harus ...} — mengcover Step X
- FR-002: ...
- FR-003: ...

### Business Rules

- BR-001: {aturan bisnis eksplisit}
- BR-002: ...

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | {input duplikat / kosong / network failure} | {validasi / 409 / retry} | ERR-01 |
| EC-02 | ... | ... | ... |

## Domain

> MANDATORY

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| {GlobalTable} | {struktur data dinamis} | id, name, slug |
| ... | ... | ... |

### Relationships

```text
{EntityA} ──1:N── {EntityB}  (contoh AI Builder: Product N:1 Category dari prompt `buatkan aplikasi kasir` → tabel `{slug}_products` FK → `{slug}_categories`)
```

- REL-01: {kardinalitas & cascade}
- REL-02: ...

### States

| State | Deskripsi | Transisi Diizinkan |
|-------|-----------|--------------------|
| {DRAFT} | {belum dipublish} | DRAFT → PUBLISHED |
| {PUBLISHED} | ... | ... |

Jika stateless CRUD, tulis `N/A — stateless CRUD` dan jelaskan.

### Domain Rules

- DR-01: {contoh: Component tidak dapat dihapus jika masih dipakai Template}
- DR-02: ...

### Invariants

- INV-01: {kondisi yang harus selalu benar — contoh: Setiap GlobalTable minimal 1 kolom}
- INV-02: ...

### Data Model

#### {Entity}

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | number | Y | Y | auto | PK |
| ... | ... | ... | ... | ... | ... |

- Index: ...
- Constraint: ...

## API

> MANDATORY. Jika murni tanpa backend, tulis `N/A — No API` + alasan. Jika ada API, harus SESUAI dengan User Flow dan UI FASE 1.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/global-tables` | GET | JWT | `Generated:{Slug}:Read` | List + pagination | Step 1 |
| 2 | `/api/global-tables` | POST | JWT | `Generated:{Slug}:Write` | Create | Step 3 |
| 3 | `/api/global-tables/:id` | GET | JWT | `global-table:read` | Detail | Step 4 |
| 4 | `/api/global-tables/:id` | PATCH | JWT | `global-table:update` | Update | Step 5 |
| 5 | `/api/global-tables/:id` | DELETE | JWT | `global-table:delete` | Delete | Step 6 |

### Detail per Endpoint

#### List — GET /api/...

- **Request**
  - Query: `page`, `limit`, `search`, `searchField`, `sortBy`, `sortOrder`
  - Headers: `Authorization: Bearer <JWT>`
- **Response**
  ```json
  { "data": [...], "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
  ```
- **Validation (Zod)**
  - `QuerySchema`: page min 1, limit 1–100, sortBy whitelist, ...
- **Error**
  | Status | Kondisi | Body |
  |--------|---------|------|
  | 400 | query tidak valid | `{ "message": "Validation failed", "errors": [...] }` |
  | 401 | tanpa token | `{ "message": "Unauthorized" }` |
  | 403 | permission tidak cukup | `{ "message": "Forbidden" }` |
  | 404 | data tidak ditemukan | `{ "message": "Not found" }` |
- **Authentication**: JWT via cookie/header, `auth` middleware
- **Authorization**: Guard + Permission check (`method + URL pattern`)

_(Ulangi blok ini untuk Create / Detail / Update / Delete sesuai kebutuhan)_

## UI

> MANDATORY. Untuk task implementation, WAJIB mereferensikan hasil FASE 1. Jangan mendesain ulang dari nol.

### Referensi Design

- Design task: `tasks/NN-feature-ui-design.md`
- Wireframe: `docs/wireframes/{feature}/`
- Mockup: `docs/mockups/{feature}/`
- Prototype: **Storybook** `apps/web/stories/{feature}/*.stories.tsx` (`npm run storybook` :6006) — `docs/prototypes/{feature}/` hanya arsip Figma/PNG bila ada

### Halaman

| Route | Halaman | Akses | Deskripsi | Status Design | Storybook |
|-------|---------|-------|-----------|---------------|-----------|
| `/generated/{slug}/products` | Dynamic Entity List (e.g., Product dari prompt `kasir`) | Builder User | Daftar + search + pagination | Approved (FASE 1) | `stories/generated-products/List.stories.tsx` |
| `/generated/{slug}/products/new` | Dynamic Entity Create | Builder User | Form pembuatan (fields sesuai inference) | Approved (FASE 1) | `stories/generated-products/Form.stories.tsx` |
| `/generated/{slug}/products/:id` | Dynamic Entity Detail | Builder User | Read-only + actions | Approved (FASE 1) | `stories/generated-products/Detail.stories.tsx` |

### Layout

- Navigasi: {sesuai design task 01 — sidebar / workspace / breadcrumb}
- Struktur halaman: {header + filter bar + data table + pagination}
- Penempatan: {di bawah menu "Master Data" → "Dynamic Entity (per prompt, e.g., Product/Category/Transaction)"}
- Penyesuaian dari design: {catat jika ada deviasi + alasan}

### Components

| Component | Lokasi | Deskripsi | Mengacu Mockup |
|-----------|--------|-----------|----------------|
| `GlobalTableDataTable.react` | `components/features/global-table/` | Tabel dengan search, sort, visibility | `mockup/list.png` |
| `GlobalTableForm.react` | `components/features/global-table/` | Form create/edit dengan shadcn/ui | `mockup/form.png` |
| `GlobalTableDetail.react` | `components/features/global-table/` | Detail view `.detail-view` pattern | `mockup/detail.png` |

### Interaction

- Trigger: {klik "Create" → buka editor — sesuai prototype task 01}
- Flow: {validate → submit → toast → redirect}
- Konfirmasi: {hapus → AlertDialog / Dialog}
- Navigasi balik: {breadcrumbs / back button}
- Deviasi dari prototype: {jika ada, jelaskan}

### Responsive Behavior

| Breakpoint | Perilaku | Mengacu Wireframe |
|------------|----------|-------------------|
| Desktop (≥1024px) | Tabel penuh + sidebar terbuka | `wireframe/desktop.png` (task 01) |
| Tablet (768–1023px) | Kolom disembunyikan via visibility toggle | `wireframe/tablet.png` (task 01) |
| Mobile (<768px) | Card list / drawer, form full-width | `wireframe/mobile.png` (task 01) |

### States

| State | Tampilan | Komponen shadcn/ui | Mengacu Mockup |
|-------|----------|-------------------|----------------|
| Loading | Skeleton / Spinner (Loader2) | `Spinner (Loader2)`, `Skeleton` | `mockup/loading.png` (task 01) |
| Empty | Illustration + CTA "Create pertama" | `Empty` | `mockup/empty.png` (task 01) |
| Error | Alert + retry | `Alert` | `mockup/error.png` (task 01) |
| Success | NMessage / NNotification | `toast() via sonner` | `mockup/success.png` (task 01) |
| Validation | Inline error di field | `FormItem` feedback | `mockup/validation.png` (task 01) |
| Permission Denied | Alert 403 + event `rbac-denied (Alert variant=destructive + Portal)` | `Alert` | `mockup/403.png` (task 01) |

### Accessibility

- Keyboard: semua aksi via keyboard, focus trap di modal — sesuai design task 01
- ARIA: `aria-label` untuk icon-only button
- Kontras & font: ikuti `docs/design-system.md` (primary #0075de, Inter)
- Reduced motion: hormati `prefers-reduced-motion`

## Acceptance Criteria

> MANDATORY — minimal cover happy path + validation + business rules + error + empty + permission + edge case. Format Given / When / Then. Setiap AC harus mapping ke User Flow step.

### AC-001 — {Judul kriteria}

Given {konteks / pre-condition}

When {aksi user / sistem}

Then {hasil yang dapat diverifikasi}

### AC-002 — {Judul kriteria}

Given ...

When ...

Then ...

## Tasks

> MANDATORY — daftar pekerjaan implementasi dengan checkbox. Harus mengacu pada design FASE 1.

### Backend

- [ ] Entity — `lib/db/entities/{name}.entity.ts` + registrasi di `lib/db/data-source.ts`
- [ ] DTO — `lib/dto/{name}.dto.ts` (Zod: Create/Update/Query)
- [ ] Service — `lib/services/{name}.service.ts` (plain object)
- [ ] API Routes — `app/api/{name}/index.get.ts`, `index.post.ts`, `[id].get.ts`, `[id].patch.ts`, `[id].delete.ts`
- [ ] Auth & Authorization — middleware + guard/permission
- [ ] Validation & Error handling — Zod + `createError` h3
- [ ] Migration/Seed — jika `synchronize: false` / data awal
- [ ] Unit tests — service & DTO
- [ ] Integration/API tests — endpoint + RBAC

### Frontend

- [ ] Shared Types — `lib/types/{name}.ts`
- [ ] API Service / Composable — `hooks/use{Name}Data.ts`
- [ ] Store (jika perlu) — `stores/{name}.ts`
- [ ] Pages — `app/(dashboard)/ | app/builder/ | app/generated/[slug]/ → {route}/index.react`, `create.react`, `[id].react` (sesuai mockup FASE 1)
- [ ] Components — `DataTable.react`, `Form.react`, `Detail.react` (sesuai mockup FASE 1)
- [ ] Validation — shadcn/ui `NForm` + rules sinkron dengan Zod
- [ ] States — loading / empty / error / success / permission (sesuai design FASE 1)
- [ ] Responsive & Accessibility — breakpoint + ARIA + keyboard (sesuai wireframe FASE 1)
- [ ] Unit tests — `vitest` (`test:unit` / `test:next`)
- [ ] E2E tests — Playwright (`test:e2e`) — mengacu User Flow

### Cross-Cutting

- [ ] RBAC matrix diperbarui
- [ ] ActivityLog / Audit jika diperlukan
- [ ] Storybook stories FASE 1 tetap PASS setelah perubahan FASE 2 (regresi visual)
- [ ] Verifikasi konsistensi dengan `tasks/NN-feature-ui-design.md` + Storybook (`apps/web/stories/{feature}/*.stories.tsx`) — tidak ada deviasi tanpa catatan

### Test Plan (QA — Bertindak sebagai QA Engineer)

> MANDATORY untuk FASE 2. Setiap User Flow step, Alternate/Error flow, dan Business Rule HARUS memiliki pasangan test. Nanti dipakai oleh `/verify` dan `/review`.

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit — Service/DTO | `tests/unit/{feature}.service.test.ts` | Logic, validation, domain rules, invariants | FR-001, BR-001, INV-01 |
| UT-02 | Unit — Domain | `tests/unit/{feature}.entity.test.ts` | Entity, relationship, state | DR-01, State DRAFT→PUBLISHED |
| NT-01 | Next.js — Component | `tests/next/{feature}.form.test.ts` | Render, interaction, validation, states | Step 2, AC-002 |
| NT-02 | Next.js — Page | `tests/next/{feature}.page.test.ts` | Layout, responsive, accessibility, permission | Step 1, AC-001 |
| E2E-01 | E2E — Happy path | `tests/e2e/{feature}.spec.ts` | Full User Flow end-to-end | Step 1→3→success |
| E2E-02 | E2E — Alternate | `tests/e2e/{feature}.alt.spec.ts` | Empty, error, permission, edge cases | ALT-01, ERR-01, EC-01 |

- [ ] Unit tests — semua service/DTO/domain — 1 test per FR/BR/DR/INV
- [ ] Next.js tests — semua state (loading/empty/error/success/validation/permission) dari `## UI > States`
- [ ] E2E tests — happy + alternate/error + edge + permission — mapping 1:1 ke User Flow + AC
- [ ] Coverage target: User Flow steps 100%, AC 100%, BR 100%, EC 100%

## Verification (QA — Bertindak sebagai QA Engineer)

> Verifikasi seolah QA independen. Pastikan semua User Flow berjalan benar + semua logika benar. Dipakai oleh `/verify` dan `/review`.

### Automated (wajib lolos sebelum DONE)

- [ ] Typecheck (`react-tsc` / `next typecheck`) — 0 error
- [ ] Unit tests (`npm run test:unit`) — semua UT-01/UT-02 PASS, coverage ≥80% logic baru
- [ ] Next.js tests (`npm run test:next`) — semua CT-01/CT-02 PASS, semua state ter-render
- [ ] API/Integration tests — semua endpoint PASS, validation + error + auth/authz PASS
- [ ] E2E tests (`npm run test:e2e`) — semua E2E-01/E2E-02 PASS, semua User Flow steps + Alternate/Error flows
- [ ] Storybook build (`npm run build-storybook`) — sukses tanpa error (stories semua halaman/state)
- [ ] Build (`npm run build`) — sukses

### Manual / QA Checklist (mapping ke User Flow & AC)

- [ ] Database verification — entity, constraint, migration, invariant (DR/INV)
- [ ] Permission verification — 401/403 matrix per Permission di `## API`
- [ ] Business Rules verification — setiap BR-XXX memiliki test dan PASS
- [ ] Edge Cases verification — setiap EC-XXX memiliki test dan PASS
- [ ] States verification — loading/empty/error/success/validation/permission (sesuai `## UI > States`) + test (NT + Storybook story)
- [ ] Responsive verification — desktop/tablet/mobile sesuai wireframe + Storybook viewport FASE 1
- [ ] Accessibility verification — keyboard, ARIA, contrast, reduced-motion + Storybook a11y addon
- [ ] UI/UX verification — pixel-perfect terhadap mockup + **Storybook** `apps/web/stories/{feature}/*.stories.tsx` (shadcn/ui + Tailwind, token `globals.css`)
- [ ] Storybook verification — `npm run storybook` (:6006) + `npm run build-storybook` sukses, semua stories ada
- [ ] User Flow verification — setiap `User Flow > Steps` + `Alternate & Error Flows` + `Flow→UI/API Mapping` ada AC dan ada E2E PASS
- [ ] Acceptance verification — setiap AC Given/When/Then PASS (traceability AC ↔ User Flow step ↔ Test ID)

## Assumptions

- ...

## Open Questions

- ...

## Related Knowledge

- `docs/PRD.md`
- `docs/architecture.md`
- `docs/database.md`
- `docs/design-system.md`
- `tasks/NN-feature-ui-design.md` — Design referensi (WAJIB untuk feature dengan UI)

## Change Log

### Initial

- Task specification created.

````

Untuk **FASE 1 (UI Design)**, bagian MANDATORY:

```text
User Flow   (diagram, steps, alternate/error flows)
UI          (halaman, layout, component, interaction, responsive, loading/empty/error/success, accessibility + wireframe/mockup/prototype deliverables)
Acceptance  (Given/When/Then — validasi design)
Tasks       (checklist wireframe → mockup → prototype → handoff)
Verification (design system, responsive, accessibility, user flow coverage)
```

Untuk **FASE 2 (Implementation)**, bagian MANDATORY:

```text
User Flow    (diagram, steps, alternate/error, flow→UI mapping, flow→API mapping — KONSISTEN dengan FASE 1)
Requirements (tujuan, users, use cases, functional, business rules, edge cases — mengacu User Flow)
Domain       (entity, relationship, state, domain rules, invariant + data model)
API          (server route, HTTP method, request, response, validation, error, authentication, authorization — sesuai User Flow & UI FASE 1)
UI           (halaman, layout, component, interaction, responsive, loading/empty/error/success, accessibility — MEREFERENSIKAN FASE 1)
Acceptance   (Given / When / Then — kapan feature dianggap benar — mapping ke User Flow)
Tasks        (daftar pekerjaan implementasi — checkbox — mengacu design FASE 1) + Test Plan (QA: unit/next/e2e mapping ke User Flow & AC)
Verification (QA — bertindak sebagai QA engineer: unit/next/e2e + states/permission/BR/EC/User Flow/AC traceability — termasuk pixel-perfect terhadap mockup FASE 1)
```

Jika tidak relevan, isi `N/A` + alasan di `Assumptions` — jangan hapus headernya.

**Aturan KONSISTENSI**: Task FASE 2 TIDAK BOLEH mendesain ulang UI dari nol. Deviasi harus dicatat di `## UI > Penyesuaian dari design` dan `## Open Questions`.

---

# 6. User Flow

User Flow MANDATORY di **kedua FASE** dan harus KONSISTEN.

* **FASE 1**: Menggambarkan alur interaksi di prototype (klik, navigasi, state).
* **FASE 2**: Menggambarkan alur yang sama + mapping ke API & implementasi. Tidak boleh mengubah alur UI tanpa catatan.

Gunakan struktur:

```text
Diagram → Steps → Alternate & Error Flows → (FASE 2: Flow→UI mapping + Flow→API mapping)
```

Setiap `Requirements > Use Cases` dan `Acceptance Criteria` di FASE 2 harus dapat ditelusuri ke `User Flow > Steps`.

Jika flow tidak dapat ditentukan, buat asumsi terkecil dan catat di `Assumptions` + `Open Questions`.

---

# 7. Acceptance Criteria

Acceptance Criteria MUST be testable dan berada di `## Acceptance Criteria`.

Use:

```text
Given
When
Then
````

Avoid vague criteria such as:

```text
- Feature works correctly.
- UI looks good.
- CRUD works.
```

Instead:

```md
### AC-001 — Menampilkan editor Dynamic Entity (per prompt, e.g., Product/Category/Transaction)

Given the user is on the Dynamic Entity (per prompt, e.g., Product/Category/Transaction) list

When the user clicks "Create"

Then the Dynamic Entity (per prompt, e.g., Product/Category/Transaction) editor is displayed.
```

Create enough acceptance criteria to cover:

* happy path
* validation
* error handling
* empty state
* permissions
* important business rules
* destructive actions
* edge cases

Setiap AC harus dapat dipetakan ke `User Flow > Steps` dan minimal satu item di `## Tasks`.

Untuk FASE 1, AC memvalidasi design/prototype. Untuk FASE 2, AC memvalidasi implementasi terhadap flow + mockup FASE 1.

---

# 8. UI Specification

UI/UX adalah bagian dari task specification, bukan afterthought.

**FASE 1 — Storybook-First**: Isi `## UI` dengan 10 sub-bagian wajib + deliverables wireframe/mockup/prototype **langsung di project**:
* halaman — route & daftar halaman
* layout — navigasi & struktur halaman
* component — daftar component React + lokasi file (rencana) + Storybook story file `apps/web/stories/{feature}/*.stories.tsx`
* interaction — trigger, flow, konfirmasi, navigasi balik, transisi (Framer Motion hormati `prefers-reduced-motion`), prototype Storybook link (`http://localhost:6006`)
* responsive behavior — desktop/tablet/mobile (dengan wireframe ref + Storybook viewport)
* states — loading / empty / error / success / validation / permission denied (tiap state = Storybook story variant + a11y check)
* accessibility — keyboard, ARIA, kontras, reduced-motion + `@storybook/addon-a11y` di Storybook
* wireframe & mockup deliverables — tabel format/lokasi/status (**termasuk `Storybook build` + `apps/web/stories/{feature}/` **)
* design tokens check — token `app/globals.css` (primary `#0075de`, Inter, radius 12/8/4/full) di Storybook decorator

**FASE 2**: `## UI` WAJIB mereferensikan FASE 1 di `Referensi Design` (termasuk **Storybook** `apps/web/stories/{feature}/*.stories.tsx`) dan tidak mendesain ulang:
* halaman/layout/component/interaction/responsive/states/accessibility harus menunjuk ke mockup/wireframe **+ Storybook stories** FASE 1
* catat penyesuaian di `Penyesuaian dari design` jika ada deviasi (termasuk dari Storybook stories)

Jika feature murni backend (kedua FASE), tulis:

```md
## UI

N/A — No UI (backend only). Alasan: ...
```

dan jelaskan di `## Assumptions`. Dalam kasus ini FASE 1 tidak perlu dibuat.

The UI must follow the project's existing Design System (`docs/design-system.md`).

---

# 8A. QA Perspective — Bertindak sebagai QA Engineer / Tester

> Saat mengisi `## Tasks > Test Plan` dan `## Verification`, bertindak SEOLAH-OLAH sebagai QA engineer independen yang akan membuat file test `unit`, `next`, `e2e` dan memastikan semua User Flow berjalan benar + semua logika benar. Test ini dipakai oleh `/verify` dan `/review`.

Aturan WAJIB:

- Setiap **User Flow step** (happy + alternate + error) HARUS memiliki minimal 1 test E2E. Mapping: `User Flow Step → E2E test case`.
- Setiap **Acceptance Criteria Given/When/Then** HARUS memiliki test (unit/next/e2e). Mapping: `AC-XXX → Test ID`.
- Setiap **Functional Requirement / Business Rule / Domain Rule / Invariant** HARUS memiliki unit test.
- Setiap **UI State** (loading/empty/error/success/validation/permission) HARUS memiliki next/component test + E2E.
- Setiap **API endpoint** HARUS memiliki unit/DTO test + integration test untuk request/response/validation/error/auth/authz.
- Setiap **Edge Case** HARUS memiliki test (unit atau e2e).
- Tulis rencana file test eksplisit: `tests/unit/{feature}/*.test.ts`, `tests/next/{feature}/*.test.ts`, `tests/e2e/{feature}.spec.ts`. Jangan tulis generik.
- Definisikan ekspektasi Given/When/Then untuk setiap test case di `## Tasks > Test Plan` — agar `/verify` dapat menjalankan `npm run test:unit`, `npm run test:next`, `npm run test:e2e`.

`/verify` akan berperan sebagai QA yang menjalankan ketiga suite dan memverifikasi traceability `User Flow ↔ AC ↔ Test`. `/review` akan menilai kualitas dan coverage test.

---

# 9. Cross-Document Consistency

After generating the task, verify consistency against:

```text
PRD
Architecture
Database
Design System
Existing Tasks
Pasangan FASE 1 ↔ FASE 2 (User Flow & UI)
```

Check for:

* conflicting terminology
* conflicting entity names
* conflicting API conventions
* conflicting database rules
* conflicting UI patterns
* User Flow konsistensi (FASE 2 tidak bertentangan dengan FASE 1)
* UI konsistensi (FASE 2 mereferensikan mockup/wireframe FASE 1)
* API konsistensi (endpoint mapping ke User Flow)
* duplicated functionality
* dependency problems (FASE 1 → FASE 2)
* missing requirements
* kelengkapan bagian mandatory per FASE

If a conflict is found:

DO NOT silently overwrite Permanent Knowledge atau prototype FASE 1.

Document it under:

```md
## Open Questions
```

Serta catat di `## UI > Penyesuaian dari design` (FASE 2) jika ada deviasi.

---

# 10. Do Not Implement

This command ONLY generates or updates the task specification plus `tasks/task-logs.md` (see #12).

Do NOT:

* modify application source code
* create entities
* create controllers
* create services
* create React/Next.js components
* create migrations
* install packages
* run implementation

The output of this command is the SDD task specification + `tasks/task-logs.md` update only.

---

# 11. Final Response

After generating/updating the task, report:

```text
Task: tasks/NN-task-name.md            # folder mode: tasks/NN-slug/README.md

Action:
- CREATED (FASE 1 — UI Design)
or
- CREATED (FASE 2 — Implementation, depends on NN-1-ui-design)
or
- UPDATED

Fase:
- FASE 1 — UI Design (Wireframe/Mockup/Prototype)
or
- FASE 2 — Implementation

Objective:
...

User Flow:
- Diagram: ...
- Steps: N steps
- Konsistensi dengan FASE 1: OK/CONFLICT/N/A

Affected Areas:
- Backend
- Frontend
- Database
- UI/UX

Dependencies:
- FASE 1: tasks/NN-feature-ui-design.md (jika FASE 2)
- ...

Consistency:
- PRD: OK/CONFLICT
- Architecture: OK/CONFLICT
- Database: OK/CONFLICT
- Design System: OK/CONFLICT
- FASE 1 ↔ FASE 2 User Flow: OK/CONFLICT/N/A
- FASE 1 ↔ FASE 2 UI: OK/CONFLICT/N/A

Mandatory Sections:
FASE 1:
- User Flow: OK
- UI (10 sub-bagian): OK
- Acceptance (Given/When/Then): OK
- Tasks (design checklist): OK
- Verification (design): OK

FASE 2:
- User Flow: OK
- Requirements (tujuan/users/use cases/functional/business rules/edge cases): OK
- Domain (entity/relationship/state/domain rules/invariant): OK
- API (route/method/request/response/validation/error/auth/authz): OK
- UI (referensi FASE 1): OK
- Acceptance (Given/When/Then): OK
- Tasks (daftar implementasi): OK
- Verification: OK

Task Logs:
- tasks/task-logs.md created/updated (see #12)

Next recommended step:
- Jika FASE 1 baru dibuat: /task {feature} (untuk FASE 2) atau /plan tasks/NN-ui-design.md
- Jika FASE 2: /plan tasks/NN-task-name.md
```

Do not provide implementation code unless explicitly requested.

---

# 12. Task Logs (Mandatory Final Step)

After the task specification is generated/updated, you MUST create or update `tasks/task-logs.md` to record what has NOT yet been implemented, verified, and reviewed.

This step is mandatory and is part of `/task` execution — do NOT skip it.

### 12.1 Rules

1. If `tasks/task-logs.md` does not exist → CREATE it using the same template as `/gen-tasks` #24.2, listing all folder-mode entrypoints (`tasks/NN-slug/README.md`) AND legacy `tasks/NN-*.md` files (excluding `task-logs.md` itself) dengan kolom Fase.
2. If it already exists → UPDATE it:
    - add the current task (`tasks/NN-task-name.md`; folder mode: `tasks/NN-slug/README.md`) if not yet listed dengan Fase yang benar,
   - preserve existing `[x]` states for already implemented/verified/reviewed items — never reset `[x]` to `[ ]`,
   - update `Last Updated` (`Date`, `By: /task`, `Source: $ARGUMENTS` summary),
   - update the `Overview` row and `Detail per Task` section for the current task (termasuk Depends on),
   - ensure the current task appears under `Belum Implementasi` / `Belum Diverifikasi` / `Belum Direview` with `[ ]` unless it was already marked `[x]` by `/implement`, `/verify`, `/review`.
3. A newly created task via `/task` defaults to `[ ]` (belum) for Implemented, Verified, and Reviewed.
4. An updated task via `/task` (existing file edited) MUST NOT reset its existing `[x]` states.
5. Pisahkan FASE 1 dan FASE 2 di Overview jika memungkinkan untuk keterbacaan.
6. Do NOT modify application source code in this step — only `tasks/task-logs.md`.

### 12.2 Verification

Before finishing `/task`, ensure:

- [ ] `tasks/task-logs.md` exists
- [ ] Current task is listed in Overview and Detail per Task dengan Fase
- [ ] For FASE 2: `Depends on` menunjuk ke task FASE 1 yang benar
- [ ] Current task status in `tasks/task-logs.md` matches its `## Status` in `tasks/NN-*.md` (folder mode: `tasks/NN-slug/README.md`)
- [ ] No existing `[x]` was reset
