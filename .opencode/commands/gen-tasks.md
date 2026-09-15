---
description: Generate the complete SDD task roadmap from one Core Concept and project context
---

# Generate Complete Tasks

Generate the complete `tasks/` specification roadmap from exactly ONE parameter containing the project's general information and Core Concept.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the high-level product and Core Concept definition.

This command generates the FEATURE ROADMAP and MINI-SPECIFICATIONS.

It does NOT implement application code.

---

# 1. Objective

Transform one high-level Core Concept into a complete, logically ordered set of SDD task specifications.

The goal is to answer:

> "What features must be built to turn this Core Concept into a production-ready application?"

The output is:

```text
tasks/
├── 01-xxx-ui-design.md      # FASE 1: Wireframe/Mockup/Prototype
├── 02-xxx.md                # FASE 2: Implementation (mengacu UI + User Flow)
├── 03-yyy-ui-design.md
├── 04-yyy.md
├── ...
└── NN-xxx.md
```

Every task must be a complete mini-specification.

Do NOT generate simple TODO lists.

**Prinsip UI-First — Deliverables Design Dulu**: Pekerjaan yang dikerjakan TERLEBIH DAHULU harus mengimplementasikan design wireframe UI/UX, mockup, dan prototype interaktif (file tasks tersendiri). Pekerjaan selanjutnya BARU mengacu pada user flow + analysis system + UI yang telah dibuat sebelumnya.

**Deliverables Design WAJIB (FASE 1)**:
1. **Wireframe low-fi** — untuk semua halaman & states (desktop/tablet/mobile)
2. **Mockup hi-fi** — Naive UI 2.44 + Tailwind CSS v4 + token `app/utils/naiveui-theme.ts` (primary `#3B82F6`, Inter, radius 6/4/8, `@vicons/carbon`)
3. **Prototype interaktif LANGSUNG implementasi pada project** — komponen Vue `app/components/...` + halaman `app/pages/...` + **Storybook stories** `apps/web/stories/{feature}/*.stories.ts` yang dapat dibaca via `npm run storybook` (port 6006) dan `npm run build-storybook` — bukan hanya Figma/PNG eksternal. Storybook adalah sumber kebenaran (single source of truth) untuk review design sebelum FASE 2.

---

# 2. Project Understanding

Before generating tasks, inspect the existing project.

Read:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
```

Also inspect:

```text
tasks/
```

if it already exists.

---

# 3. Understand Anything

If the project contains Understand Anything knowledge, use it as supplementary codebase context.

Check whether:

```text
.ua/
```

exists.

If available, use it to understand:

* existing modules
* existing entities
* existing relationships
* architecture
* dependencies
* existing features
* project boundaries
* implementation patterns

Priority:

```text
Current Source Code
        ↓
Tests / Configuration
        ↓
Understand Anything
        ↓
AGENTS.md
        ↓
Permanent Knowledge
        ↓
User Core Concept
```

When generating tasks for an existing project, do not generate tasks for functionality that already exists unless the user explicitly requests a rebuild or enhancement.

Do NOT modify `.ua/`.

---

# 4. Input

The entire input is:

```text
$ARGUMENTS
```

Example:

```text
/gen-tasks "Platform aplikasi bisnis dinamis dengan Core Concept Global Table → Component → Template → Administration. Administrator dapat mendefinisikan struktur data, membangun component, menyusun template, dan mengelola aplikasi secara dinamis."
```

The input may contain:

* product idea
* Core Concept
* business domain
* target users
* technology information
* major capabilities
* constraints
* high-level workflows

Do not require the user to provide a task list.

The command must derive the task list.

---

# 5. Core Concept Analysis

Extract:

### Product

What is being built?

### Users

Who uses the system?

### Business Domain

What business problem does it solve?

### Core Entities

What are the central entities?

### Relationships

How do the entities interact?

### Lifecycle

How does the system operate from beginning to production?

Represent the Core Concept as a model.

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
      │
      ▼
Generated Application
```

Do not assume this exact model.

Derive it from `$ARGUMENTS` and project knowledge.

---

# 6. Feature Decomposition

Break the Core Concept into functional capabilities.

Consider, where relevant:

```text
Foundation
Authentication
Authorization
User Management
Role & Permission
Core Domain
Configuration
Master Data
Transactions
Workflow
Search
Filtering
Import
Export
Notifications
Audit Log
Dashboard
Reporting
Settings
Administration
Integration
Security
Testing
Production Readiness
```

Do not blindly create every category.

Only generate capabilities relevant to the product.

**WAJIB**: Untuk setiap capability yang memiliki antarmuka pengguna, pecah menjadi DUA task berurutan:
1. **UI Design Task** (`NN-feature-ui-design.md`) — wireframe, mockup, prototype
2. **Implementation Task** (`NN+1-feature.md`) — user flow + requirements + domain + API + implementasi yang mengacu pada UI design tersebut

Capability yang murni backend (tanpa UI) cukup satu task implementation dengan `UI: N/A` + alasan.

---

# 7. Dependency Analysis

Determine the correct dependency order dengan prinsip **UI-First**.

Urutan WAJIB:

```text
FASE 1 — UI Design (Wireframe/Mockup/Prototype)
        ↓
FASE 2 — Implementation (User Flow + Requirements + Domain + API + Code)
```

Example:

```text
01-auth-ui-design          # Wireframe login, layout, states
        ↓
02-authentication           # User flow + domain + API + implementasi auth (mengacu 01)
        ↓
03-users-ui-design          # Wireframe user list/form/detail
        ↓
04-user-management           # Mengacu 03
        ↓
05-global-table-ui-design   # Wireframe table builder
        ↓
06-global-table              # Mengacu 05
        ↓
07-component-ui-design
        ↓
08-component
        ↓
09-template-ui-design
        ↓
10-template
        ↓
11-administration-ui-design
        ↓
12-administration
```

Aturan:
- Task `NN-feature-ui-design.md` TIDAK boleh memiliki dependency ke task implementation — dia adalah akar untuk feature tersebut.
- Task implementation `NN+1-feature.md` WAJIB mencantumkan `Depends on: NN-feature-ui-design.md` di `## Dependencies` dan di `## UI > Referensi Design`.
- Jangan urutkan tasks hanya berdasarkan urutan navigasi UI — urutkan berdasarkan dependency aktual + urutan UI-first per feature.

---

# 8. Task Granularity

Each task should represent one meaningful feature capability, dengan pemisahan FASE.

GOOD (UI-First):

```text
01-auth-ui-design.md          # FASE 1: wireframe/mockup/prototype auth
02-authentication.md           # FASE 2: user flow + domain + API + code (mengacu 01)
03-users-ui-design.md
04-user-management.md
05-global-table-ui-design.md
06-global-table.md
07-component-ui-design.md
08-component.md
09-template-ui-design.md
10-template.md
11-administration-ui-design.md
12-administration.md
```

BAD (menggabungkan design + implementasi dalam satu file):

```text
01-authentication.md   # langsung code tanpa design task terpisah
```

BAD (terlalu granular):

```text
01-create-button.md
02-create-input.md
03-create-modal.md
```

BAD (terlalu besar):

```text
01-build-entire-application.md
```

UI elements milik feature task yang bersangkutan, tetapi **design-nya harus selesai di task UI-design sebelum implementation dimulai**.

The target is:

```text
Business Capability
        ↓
UI Design Task (wireframe/mockup/prototype)
        ↓
Implementation Task (user flow → requirements → domain → API → code → tests)
```

---

# 9. Existing Tasks

If `tasks/` already contains tasks:

1. inspect all existing tasks
2. identify completed functionality
3. identify TODO functionality
4. identify overlapping tasks
5. identify missing capabilities
6. identify UI-design tasks yang belum ada untuk feature yang sudah ada — buatkan jika belum ada
7. preserve existing valid tasks
8. update tasks only when necessary
9. never create duplicates

Do not renumber existing tasks casually.

If the existing task structure already represents the correct roadmap, extend it rather than rebuilding it.

Jika ditemukan task implementation tanpa pasangan `*-ui-design.md` padahal memiliki UI, buatkan task UI-design baru dan update task implementation untuk mereferensikannya di `## Dependencies` dan `## UI > Referensi Design`.

---

# 10. Determine Task Number

For new tasks:

```text
NN-feature-name.md              # implementation
NN-feature-ui-design.md         # UI design (wireframe/mockup/prototype)
```

Gunakan sequential numbering. UI-design dan implementation yang berpasangan harus bernomor berurutan, design terlebih dahulu.

Example:

```text
tasks/
├── 01-auth-ui-design.md
├── 02-authentication.md
├── 03-users-ui-design.md
├── 04-user-management.md
├── 05-global-table-ui-design.md
└── 06-global-table.md
```

Jika existing numbering contains gaps, preserve the existing numbering unless there is a strong reason to reorganize it.

Do not rename existing task files merely for cosmetic consistency.

Suffix yang diizinkan untuk design task: `-ui-design` (preferred), `-design`, `-wireframe`. Konsisten gunakan `-ui-design` untuk task baru.

---

# 11. Task Specification

Every generated task MUST be a mini-specification.

Terdapat **DUA JENIS TEMPLATE** — pilih sesuai FASE. Semua header bertanda **MANDATORY** wajib ada — jangan dihapus, jangan diganti nama, jangan digabung. Jika tidak relevan, isi dengan `N/A` dan jelaskan alasan di `Assumptions`.

## 11.A Template FASE 1 — UI/UX Design Task (Wireframe / Mockup / Prototype)

Gunakan untuk `NN-feature-ui-design.md`. Fokus: design wireframe, mockup, prototype interaktif SEBELUM code.

````md
# Task NN — {Feature} UI Design (Wireframe / Mockup / Prototype)

## Status

TODO | IN_PROGRESS | DONE

## Objective

{Menghasilkan wireframe, mockup hi-fi, dan prototype interaktif untuk feature {Feature} sebagai acuan implementation}

## Context

{Mengapa design ini dibutuhkan terlebih dahulu, posisinya sebagai prasyarat untuk task implementation NN+1, ketergantungan terhadap design system / PRD}

## Scope

### In Scope

- Wireframe low-fi untuk semua halaman/state
- Mockup hi-fi (Naive UI + Tailwind, token `docs/design-system.md`)
- Prototype interaktif (klik, navigasi, validasi, transisi)
- Deliverables: file Figma / HTML prototype / Storybook stories

### Out of Scope

- Implementasi API / domain / database
- Logic bisnis di luar presentasi
- ...

## Dependencies

- `docs/design-system.md`
- `docs/PRD.md`
- Task terkait sebelumnya: ...

## User Flow

> MANDATORY — diagram + langkah + mapping ke halaman. Flow ini menjadi ACUAN untuk task implementation FASE 2.

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
| ALT-01 | Data kosong | List → Empty state | `NEmpty` + CTA |
| ERR-01 | Validasi gagal | Form → Inline error | `NFormItem` feedback |
| ERR-02 | 403 Forbidden | Any → Permission denied | `NAlert` + `rbac-denied` |

## UI

> MANDATORY — 10 sub-bagian wajib untuk design task. Inilah deliverable utama FASE 1.

### Halaman

| Route | Halaman | Akses | Deskripsi | Wireframe Ref |
|-------|---------|-------|-----------|---------------|
| `/global-tables` | Global Table List | Admin | Daftar + search + pagination | `wireframe/list.png` |
| `/global-tables/create` | Create | Admin | Form pembuatan | `wireframe/create.png` |
| `/global-tables/:id` | Detail | Admin | Read-only + actions | `wireframe/detail.png` |

### Layout

- Navigasi: {sidebar / workspace / breadcrumb}
- Struktur halaman: {header + filter bar + data table + pagination}
- Penempatan: {di bawah menu "Master Data" → "Global Table"}
- Grid & spacing: ikuti token `docs/design-system.md`

### Components

| Component | Lokasi (rencana) | Deskripsi | State Variant |
|-----------|-------------------|-----------|---------------|
| `GlobalTableDataTable.vue` | `app/components/features/global-table/` | Tabel + search/sort/visibility | loading, empty, error |
| `GlobalTableForm.vue` | `app/components/features/global-table/` | Form Naive UI | default, validation, disabled |
| `GlobalTableDetail.vue` | `app/components/features/global-table/` | Detail `.detail-view` | loading, error |

### Interaction

- Trigger: {klik "Create" → buka editor}
- Flow: {validate → submit → toast → redirect}
- Konfirmasi: {hapus → NPopconfirm / NDialog}
- Transisi/animasi: {Anime.js fadeInUp, hormati prefers-reduced-motion}
- Prototype link: {Figma / HTML prototype URL}

### Responsive Behavior

| Breakpoint | Perilaku | Wireframe Ref |
|------------|----------|---------------|
| Desktop (≥1024px) | Tabel penuh + sidebar terbuka | `wireframe/desktop.png` |
| Tablet (768–1023px) | Kolom disembunyikan via visibility toggle | `wireframe/tablet.png` |
| Mobile (<768px) | Card list / drawer, form full-width | `wireframe/mobile.png` |

### States

| State | Tampilan | Komponen Naive UI | Mockup Ref |
|-------|----------|-------------------|------------|
| Loading | Skeleton / NSpin | `NSpin`, `NSkeleton` | `mockup/loading.png` |
| Empty | Illustration + CTA "Create pertama" | `NEmpty` | `mockup/empty.png` |
| Error | NAlert + retry | `NAlert` | `mockup/error.png` |
| Success | NMessage / NNotification | `useMessage()` | `mockup/success.png` |
| Validation | Inline error di field | `NFormItem` feedback | `mockup/validation.png` |
| Permission Denied | NAlert 403 + event `rbac-denied` | `NAlert` | `mockup/403.png` |

### Accessibility

- Keyboard: semua aksi via keyboard, focus trap di modal, tab order
- ARIA: `aria-label` untuk icon-only button
- Kontras & font: ikuti `docs/design-system.md` (primary #3B82F6, Inter, radius 6/4/8)
- Reduced motion: hormati `prefers-reduced-motion`
- Screen reader: label & live region untuk feedback

### Wireframe & Mockup Deliverables

| Deliverable | Format | Lokasi | Status |
|-------------|--------|--------|--------|
| Wireframe low-fi | Figma / PNG | `docs/wireframes/{feature}/` | TODO |
| Mockup hi-fi | Figma / PNG + **Vue implementasi (Naive UI + Tailwind, token `naiveui-theme.ts`)** | `docs/mockups/{feature}/` + `app/components/...` + `app/pages/...` | TODO |
| Prototype interaktif | **Storybook stories langsung di project** | `apps/web/stories/{feature}/*.stories.ts` + `app/components/...` (dibaca via `npm run storybook` :6006) | TODO |
| Storybook build | Static Storybook | `npm run build-storybook` | TODO |

> **Aturan Storybook (WAJIB FASE 1)**: Prototype interaktif TIDAK cukup berupa Figma link atau PNG. Harus diimplementasikan sebagai komponen Vue nyata (Naive UI direct import, Tailwind utility, token `app/utils/naiveui-theme.ts`) + stories di `apps/web/stories/{feature}/`. Config Storybook di `apps/web/.storybook/main.ts` — stories pattern `../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)` dengan addon `@storybook/addon-a11y` + `@storybook/addon-docs`. Verifikasi: `npm run storybook` (port 6006) tampil tanpa error & `npm run build-storybook` sukses.

### Design Tokens Check

- [ ] Warna mengikuti `app/utils/naiveui-theme.ts` (`themeOverrides` — primary `#3B82F6`, `primaryColorHover` `#2563EB`, error `#EF4444`, radius `6px/4px/8px`, font `Inter`)
- [ ] Typography Inter (`fontFamily: 'Inter, ui-sans-serif...'`)
- [ ] Radius 6/4/8 (`borderRadius: 6px`, `borderRadiusSmall: 4px`, Button/Card overrides)
- [ ] Spacing Tailwind (`app/assets/css/main.css` + Tailwind v4 `@theme`)
- [ ] Icon `@vicons/carbon` dengan `h(NIcon, null, { default: () => h(IconName) })`
- [ ] Storybook stories me-render dengan `NConfigProvider` + `themeOverrides` (lihat `apps/web/.storybook/preview.ts` — import `../assets/css/main.css`)

## Acceptance Criteria (Design)

> MANDATORY — Given/When/Then untuk memvalidasi design sebelum implementation.

### AC-D01 — {Judul}

Given {reviewer membuka prototype}

When {mengklik alur utama}

Then {navigasi sesuai User Flow tanpa dead-end}

### AC-D02 — ...

## Tasks (Design)

> MANDATORY — checklist design.

### Discovery

- [ ] Audit halaman & states existing (jika ada)
- [ ] Mapping User Flow → halaman

### Wireframe

- [ ] Low-fi untuk semua halaman (desktop)
- [ ] Low-fi untuk tablet & mobile
- [ ] Wireframe untuk semua states (loading/empty/error/success/validation/permission)

### Mockup

- [ ] Hi-fi mockup dengan Naive UI + Tailwind + design tokens
- [ ] Mockup untuk semua breakpoint
- [ ] Mockup untuk semua states

### Prototype

- [ ] Prototype interaktif (klik, navigasi, transisi)
- [ ] Validasi alur dengan User Flow
- [ ] Review internal + iterasi

### Handoff

- [ ] Export assets & spec (spacing, color, typography)
- [ ] Dokumentasi komponen & interaction di task file
- [ ] Storybook stories terdokumentasi (`*.stories.ts` dengan `args`, `controls`, `a11y` check)
- [ ] Verifikasi Storybook: `npm run storybook` (port 6006) & `npm run build-storybook` sukses
- [ ] Tandai task `Status: DONE` sebelum implementation dimulai — hanya jika Storybook prototype lolos review

## Verification (Design)

- [ ] Design System verification (token `naiveui-theme.ts`, Naive UI direct import, Tailwind utility — no `NDescriptions`, pakai `.detail-view`)
- [ ] Responsive verification (desktop/tablet/mobile — wireframe + Storybook viewport)
- [ ] Accessibility verification (keyboard, ARIA, contrast, `prefers-reduced-motion` — via Storybook `@storybook/addon-a11y`)
- [ ] User Flow coverage (semua step & alternate flow ada di Storybook prototype — klik tanpa dead-end)
- [ ] Storybook verification — `npm run storybook` tampil, stories untuk semua halaman/state, `npm run build-storybook` sukses
- [ ] Stakeholder / peer review via Storybook URL (`http://localhost:6006`)

## Assumptions

- ...

## Open Questions

- ...

## Related Knowledge

- `docs/PRD.md`
- `docs/design-system.md`
- `.ua/` (jika ada)

## Change Log

### Initial

- UI design task generated (FASE 1 — UI-First).
````

---

## 11.B Template FASE 2 — Implementation Task (User Flow + Requirements + Domain + API + Code)

Gunakan untuk `NN-feature.md`. WAJIB mengacu pada UI design FASE 1 dan mencantumkan User Flow.

````md
# Task NN — {Task Name}

## Status

TODO | IN_PROGRESS | DONE

## Objective

{Jelaskan tujuan feature secara ringkas — apa yang diselesaikan task ini dalam konteks Core Concept}

## Context

{Mengapa feature ini ada, bagaimana posisinya dalam roadmap, ketergantungan terhadap task UI-design sebelumnya}

## Scope

### In Scope

- ...

### Out of Scope

- ...

## Dependencies

- `tasks/NN-1-feature-ui-design.md` — Wireframe/Mockup/Prototype (WAJIB untuk feature dengan UI)
- ...

## User Flow

> MANDATORY — WAJIB ada di setiap task implementation (bahkan untuk backend-only, jelaskan flow sistem). Harus KONSISTEN dengan task UI-design FASE 1. Jangan buat flow yang bertentangan dengan prototype yang sudah disetujui.

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
| ALT-01 | Data kosong | List → Empty | `NEmpty` + CTA |
| ERR-01 | Validasi gagal | Submit → 400 | Inline error |
| ERR-02 | Forbidden | Any → 403 | `NAlert` + `rbac-denied` |

### Flow → UI Mapping

| Flow Step | Halaman (dari UI-design) | Component | State |
|-----------|--------------------------|-----------|-------|
| Step 1 | `/feature` | `FeatureDataTable.vue` | loading → empty/error/success |
| Step 2 | `/feature/create` | `FeatureForm.vue` | validation |

### Flow → API Mapping

| Flow Step | HTTP Method | Server Route | Validasi |
|-----------|-------------|--------------|----------|
| Step 1 | GET | `/api/feature` | QuerySchema |
| Step 3 | POST | `/api/feature` | CreateSchema |

## Requirements

> MANDATORY. Tidak boleh kosong. Harus mengacu pada User Flow di atas dan UI design FASE 1.

### Tujuan Fitur

- REQ-G01: {tujuan utama feature — business goal yang ingin dicapai}

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| {Contoh: Administrator} | {dapat mengelola ...} | {role/permission} |
| {End User} | {mengisi ...} | ... |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | {Administrator} | {membuat Global Table baru} | {tabel tersimpan & dapat digunakan di Component} | Step 3 |
| UC-02 | ... | ... | ... | ... |

### Functional Requirements

- FR-001: {sistem harus ...} — mengcover Step X
- FR-002: {sistem harus ...}
- FR-003: ...

### Business Rules

- BR-001: {aturan bisnis eksplisit — contoh: Nama tabel harus unik}
- BR-002: ...
- BR-003: ...

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | {input kosong / duplikat / network failure} | {validasi / error message / retry} | ERR-01 |
| EC-02 | ... | ... | ... |

## Domain

> MANDATORY.

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| {GlobalTable} | {struktur data dinamis} | id, name, slug, ... |
| ... | ... | ... |

### Relationships

```text
{EntityA} ──1:N── {EntityB}  (contoh: GlobalTable 1:N GlobalTableColumn)
{EntityB} ──N:1── {EntityC}
```

- REL-01: {penjelasan kardinalitas & cascade rule}
- REL-02: ...

### States

| State | Deskripsi | Transisi Diizinkan |
|-------|-----------|--------------------|
| {DRAFT} | {belum dipublish} | DRAFT → PUBLISHED |
| {PUBLISHED} | ... | PUBLISHED → ARCHIVED |

Jika tidak ada state machine, tulis `N/A — stateless CRUD` dan jelaskan.

### Domain Rules

- DR-01: {aturan domain — contoh: Component tidak dapat dihapus jika masih dipakai Template}
- DR-02: ...

### Invariants

- INV-01: {kondisi yang harus selalu benar — contoh: Setiap GlobalTable minimal memiliki 1 kolom}
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

> MANDATORY. Jika feature tanpa backend, tulis `N/A — No API` dan jelaskan di Assumptions. Jika ada API, harus SESUAI dengan User Flow dan UI yang telah didesain di FASE 1.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/global-tables` | GET | JWT | `global-table:list` | List dengan pagination | Step 1 |
| 2 | `/api/global-tables` | POST | JWT | `global-table:create` | Create baru | Step 3 |
| 3 | `/api/global-tables/:id` | GET | JWT | `global-table:read` | Detail | Step 4 |
| 4 | `/api/global-tables/:id` | PATCH | JWT | `global-table:update` | Update | Step 5 |
| 5 | `/api/global-tables/:id` | DELETE | JWT | `global-table:delete` | Delete | Step 6 |

### Detail per Endpoint

#### List — GET /api/...

- **Request**
  - Query: `page`, `limit`, `search`, `searchField`, `sortBy`, `sortOrder` (ikuti konvensi AGENTS.md)
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
- **Authentication**: JWT via cookie/header, `auth` middleware
- **Authorization**: Guard + Permission check (`method + URL pattern`)

_(Ulangi blok ini untuk Create / Detail / Update / Delete)_

## UI

> MANDATORY. Untuk task implementation, bagian ini WAJIB mereferensikan hasil FASE 1. Jangan mendesain ulang dari nol — rujuk `tasks/NN-feature-ui-design.md`.

### Referensi Design

- Design task: `tasks/NN-feature-ui-design.md`
- Wireframe: `docs/wireframes/{feature}/`
- Mockup: `docs/mockups/{feature}/`
- Prototype: **Storybook** `apps/web/stories/{feature}/*.stories.ts` (dibaca `npm run storybook` :6006) — `docs/prototypes/{feature}/` hanya arsip Figma/PNG bila ada

### Halaman

| Route | Halaman | Akses | Deskripsi | Status Design | Storybook |
|-------|---------|-------|-----------|---------------|-----------|
| `/global-tables` | Global Table List | Admin | Daftar + search + pagination | Approved (task 01) | `stories/global-table/List.stories.ts` |
| `/global-tables/create` | Global Table Create | Admin | Form pembuatan | Approved (task 01) | `stories/global-table/Form.stories.ts` |
| `/global-tables/:id` | Global Table Detail | Admin | Read-only + actions | Approved (task 01) | `stories/global-table/Detail.stories.ts` |

### Layout

- Navigasi: {sesuai design task 01 — sidebar / workspace / breadcrumb}
- Struktur halaman: {header + filter bar + data table + pagination}
- Penempatan: {di bawah menu "Master Data" → "Global Table"}
- Penyesuaian dari design: {catat jika ada deviasi + alasan}

### Components

| Component | Lokasi | Deskripsi | Mengacu Mockup |
|-----------|--------|-----------|----------------|
| `GlobalTableDataTable.vue` | `app/components/features/global-table/` | Tabel dengan search, sort, visibility | `mockup/list.png` |
| `GlobalTableForm.vue` | `app/components/features/global-table/` | Form create/edit dengan Naive UI | `mockup/form.png` |
| `GlobalTableDetail.vue` | `app/components/features/global-table/` | Detail view `.detail-view` pattern | `mockup/detail.png` |

### Interaction

- Trigger: {klik "Create" → buka editor — sesuai prototype task 01}
- Flow: {validate → submit → optimistic / redirect → toast}
- Konfirmasi: {hapus → NPopconfirm / NDialog}
- Navigasi balik: {breadcrumbs / back button}
- Deviasi dari prototype: {jika ada, jelaskan alasan}

### Responsive Behavior

| Breakpoint | Perilaku | Mengacu Wireframe |
|------------|----------|-------------------|
| Desktop (≥1024px) | Tabel penuh + sidebar terbuka | `wireframe/desktop.png` (task 01) |
| Tablet (768–1023px) | Kolom disembunyikan via visibility toggle | `wireframe/tablet.png` (task 01) |
| Mobile (<768px) | Card list / drawer, form full-width | `wireframe/mobile.png` (task 01) |

### States

| State | Tampilan | Komponen Naive UI | Mengacu Mockup |
|-------|----------|-------------------|----------------|
| Loading | Skeleton / NSpin | `NSpin`, `NSkeleton` | `mockup/loading.png` (task 01) |
| Empty | Illustration + CTA "Create pertama" | `NEmpty` | `mockup/empty.png` (task 01) |
| Error | NAlert + retry button | `NAlert` | `mockup/error.png` (task 01) |
| Success | NMessage / NNotification | `useMessage()` | `mockup/success.png` (task 01) |
| Validation | Inline error di field | `NFormItem` feedback | `mockup/validation.png` (task 01) |
| Permission Denied | NAlert 403 + event `rbac-denied` | `NAlert` | `mockup/403.png` (task 01) |

### Accessibility

- Keyboard: semua aksi via keyboard, focus trap di modal — sesuai design task 01
- ARIA: `aria-label` untuk icon-only button
- Kontras & font: ikuti `docs/design-system.md` (primary #3B82F6, Inter, radius 6/4/8)
- Reduced motion: hormati `prefers-reduced-motion` untuk animasi Anime.js

## Acceptance Criteria

> MANDATORY. Minimal cover happy path + validation + business rules + error + empty + permission + edge case. Gunakan format Given / When / Then. Setiap AC harus dapat dipetakan ke User Flow step dan ke item di ## Tasks.

### AC-001 — {Judul kriteria}

Given {konteks / pre-condition}

When {aksi user / sistem}

Then {hasil yang dapat diverifikasi}

### AC-002 — {Judul kriteria}

Given ...

When ...

Then ...

_(tambahkan AC-003 dst. sesuai kebutuhan)_

## Tasks

> MANDATORY. Daftar pekerjaan implementasi yang dapat di-CENTANG (checkbox). Dipakai oleh `/plan`, `/implement`, `/verify`, `/review`. Harus mengacu pada design yang sudah ada di FASE 1.

### Backend

- [ ] Entity — `server/entities/{name}.entity.ts` + registrasi di `server/utils/orm-data-source.ts`
- [ ] DTO — `server/dto/{name}.dto.ts` (Zod: Create/Update/Query)
- [ ] Service — `server/services/{name}.service.ts` (plain object, bukan class)
- [ ] API Routes — `server/api/{name}/index.get.ts`, `index.post.ts`, `[id].get.ts`, `[id].patch.ts`, `[id].delete.ts`
- [ ] Auth & Authorization — middleware + guard/permission check
- [ ] Validation & Error handling — Zod parse + `createError` h3
- [ ] Migration/Seed — jika `synchronize: false` / data awal
- [ ] Unit tests — service & DTO
- [ ] Integration/API tests — endpoint + RBAC

### Frontend

- [ ] Shared Types — `shared/types/{name}.ts`
- [ ] API Service / Composable — `app/composables/use{Name}Data.ts`
- [ ] Store (jika perlu) — `app/stores/{name}.ts`
- [ ] Pages — `app/pages/{route}/index.vue`, `create.vue`, `[id].vue` (implementasi sesuai mockup task UI-design)
- [ ] Components — `DataTable.vue`, `Form.vue`, `Detail.vue` (implementasi sesuai mockup task UI-design)
- [ ] Validation — Naive UI `NForm` + rules sinkron dengan Zod
- [ ] States — loading / empty / error / success / permission (sesuai design task UI-design)
- [ ] Responsive & Accessibility — breakpoint + ARIA + keyboard (sesuai wireframe task UI-design)
- [ ] Unit tests — `vitest` (`test:unit` / `test:nuxt`)
- [ ] E2E tests — Playwright (`test:e2e`) — skenario mengacu User Flow

### Cross-Cutting

- [ ] RBAC matrix diperbarui (Role/Permission/Guard)
- [ ] ActivityLog / Audit jika diperlukan
- [ ] Dokumentasi singkat (`docs/` atau inline)
- [ ] Storybook stories untuk FASE 1 tetap PASS setelah perubahan FASE 2 (regresi visual)
- [ ] Verifikasi konsistensi dengan `tasks/NN-feature-ui-design.md` + Storybook (`apps/web/stories/{feature}/*.stories.ts`) — tidak ada deviasi tanpa catatan

### Test Plan (QA — Bertindak sebagai QA Engineer)

> MANDATORY untuk FASE 2. Setiap User Flow step, Alternate/Error flow, dan Business Rule HARUS memiliki pasangan test. Test ini nanti dieksekusi oleh `/verify` dan dinilai oleh `/review`.

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit — Service/DTO | `tests/unit/{feature}.service.test.ts` | Logic, validation, domain rules, invariants | FR-001, BR-001, INV-01 |
| UT-02 | Unit — Domain | `tests/unit/{feature}.entity.test.ts` | Entity, relationship, state transition | DR-01, State DRAFT→PUBLISHED |
| NT-01 | Nuxt — Component | `tests/nuxt/{feature}.form.test.ts` / `app/components/.../*.test.ts` | Component render, interaction, validation, states (loading/empty/error/success) | Step 2, AC-002 |
| NT-02 | Nuxt — Page | `tests/nuxt/{feature}.page.test.ts` | Layout, responsive, accessibility, permission | Step 1, AC-001 |
| E2E-01 | E2E — Happy path | `tests/e2e/{feature}.spec.ts` | Full User Flow end-to-end | Step 1→3→success |
| E2E-02 | E2E — Alternate | `tests/e2e/{feature}.alt.spec.ts` | Empty, error, permission, edge cases | ALT-01, ERR-01, EC-01 |

- [ ] Unit tests — semua service method, DTO validation (Zod), domain rule, invariant — 1 test per FR/BR/DR/INV minimal
- [ ] Nuxt component tests — render semua state (loading/empty/error/success/validation/permission) dari `## UI > States`
- [ ] Nuxt page tests — layout, navigation, interaction, responsive, accessibility
- [ ] E2E tests — skenario happy path + alternate/error + edge cases + permission (401/403) — MAPPING 1:1 ke `User Flow` + `Acceptance Criteria`
- [ ] Coverage target: User Flow steps 100%, AC 100%, Business Rules 100%, Edge Cases 100%

## Verification (QA — Bertindak sebagai QA Engineer)

> Verifikasi dilakukan seolah-olah QA tester independen. Pastikan semua User Flow berjalan benar dan semua logika benar. Hasilnya dipakai oleh `/verify` dan `/review`.

### Automated (wajib lolos sebelum DONE)

- [ ] Typecheck (`vue-tsc` / `nuxt typecheck`) — 0 error
- [ ] Unit tests (`npm run test:unit`) — semua UT-01/UT-02 PASS, coverage ≥80% untuk logic baru
- [ ] Nuxt tests (`npm run test:nuxt`) — semua NT-01/NT-02 PASS, semua state ter-render
- [ ] API/Integration tests — semua endpoint PASS, validation + error + auth/authz PASS
- [ ] E2E tests (`npm run test:e2e`) — semua E2E-01/E2E-02 PASS, semua User Flow steps + Alternate/Error flows
- [ ] Storybook build (`npm run build-storybook`) — sukses tanpa error (stories untuk semua halaman/state)
- [ ] Build (`npm run build`) — sukses tanpa error

### Manual / QA Checklist (mapping ke User Flow & AC)

- [ ] Database verification — entity, relationship, constraint, migration, invariant (DR/INV)
- [ ] Permission verification — 401/403 matrix untuk setiap Permission di `## API > Endpoint Overview`
- [ ] Business Rules verification — setiap BR-XXX memiliki test dan PASS
- [ ] Edge Cases verification — setiap EC-XXX memiliki test dan PASS
- [ ] States verification — loading/empty/error/success/validation/permission (sesuai `## UI > States`) ter-render dan ada test (NT + Storybook story)
- [ ] Responsive verification — desktop/tablet/mobile sesuai wireframe FASE 1 + Storybook viewport
- [ ] Accessibility verification — keyboard, ARIA, contrast, reduced-motion (sesuai design FASE 1) + Storybook a11y addon
- [ ] UI/UX verification — pixel-perfect terhadap mockup `tasks/NN-feature-ui-design.md` + Storybook (`apps/web/stories/{feature}/*.stories.ts`) — Naive UI + Tailwind, token `naiveui-theme.ts`, no `NDescriptions`
- [ ] Storybook verification — `npm run storybook` (6006) tampil, semua stories ada untuk halaman/state, controls & a11y PASS
- [ ] User Flow verification — setiap `## User Flow > Steps` + `Alternate & Error Flows` + `Flow→UI/API Mapping` ada AC dan ada E2E yang PASS
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
- `.ua/` (jika ada)

## Change Log

### Initial

- Task generated from Core Concept (FASE 2 — mengacu UI design FASE 1).

````

Hanya sertakan bagian opsional tambahan jika benar-benar relevan. Namun **bagian berikut MANDATORY dan tidak boleh dihapus**:

Untuk **FASE 1 (UI Design Task)**:
```text
User Flow   (diagram, steps, alternate/error flows)
UI          (halaman, layout, component, interaction, responsive, loading/empty/error/success, accessibility + wireframe/mockup/prototype deliverables)
Acceptance  (Given/When/Then — untuk validasi design)
Tasks       (checklist wireframe → mockup → prototype → handoff)
Verification (design system, responsive, accessibility, user flow coverage)
```

Untuk **FASE 2 (Implementation Task)**:
```text
User Flow    (diagram, steps, alternate/error, flow→UI mapping, flow→API mapping — KONSISTEN dengan FASE 1)
Requirements (tujuan, users, use cases, functional, business rules, edge cases — mengacu User Flow)
Domain       (entity, relationship, state, domain rules, invariant + data model)
API          (server route, HTTP method, request, response, validation, error, authentication, authorization — sesuai User Flow & UI)
UI           (halaman, layout, component, interaction, responsive, loading/empty/error/success, accessibility — MEREFERENSIKAN FASE 1, bukan desain ulang)
Acceptance   (Given / When / Then — kapan feature dianggap benar — mapping ke User Flow)
Tasks        (daftar pekerjaan implementasi — checkbox — mengacu design FASE 1) + Test Plan (QA: unit/nuxt/e2e mapping ke User Flow & AC)
Verification (QA — bertindak sebagai QA engineer: unit/nuxt/e2e + states/permission/BR/EC/User Flow/AC traceability — termasuk pixel-perfect terhadap mockup FASE 1)
```

Jika salah satu tidak relevan, isi `N/A` dengan alasan di `Assumptions` — jangan hapus headernya.

**Aturan KONSISTENSI UI**: Task FASE 2 TIDAK BOLEH mendesain ulang UI dari nol. Jika ada perbedaan antara design FASE 1 dan kebutuhan implementasi, catat di `## UI > Penyesuaian dari design` dan `## Open Questions` dengan alasan.

---

# 12. UI Requirements

Every user-facing feature WAJIB memiliki task FASE 1 (`*-ui-design.md`) yang berisi UI requirements lengkap dengan granularitas sesuai template 11.A (halaman, layout, component, interaction, responsive, states, accessibility, wireframe/mockup/prototype).

Task FASE 2 (`*.md` implementation) WAJIB mereferensikan FASE 1 di `## UI > Referensi Design` dan `## Dependencies`, serta tidak mendesain ulang dari nol.

Do not leave:

```text
## UI

TBD
```

Aturan:

* FASE 1: Buat `## UI` lengkap + `## User Flow` + deliverables wireframe/mockup/prototype. Tidak ada `N/A` kecuali feature murni backend (maka FASE 1 tidak dibuat, dan FASE 2 tulis `N/A — No UI` + alasan).
* FASE 2: `## UI` harus berisi `Referensi Design` ke task FASE 1 + tabel halaman/component yang menunjuk ke mockup FASE 1. Jika murni backend, tulis `N/A — No UI (backend only)`.

Consider untuk FASE 1:

* information architecture
* navigation / workspace
* list / detail / editor / form
* actions / dialogs / confirmation
* feedback / toast
* loading / empty / error / validation / permission denied / success
* responsive behavior (desktop/tablet/mobile)
* accessibility (keyboard, ARIA, contrast, reduced-motion)
* wireframe low-fi → mockup hi-fi → prototype interaktif

Follow:

```text
docs/design-system.md
```

and existing UI implementation.

Do not create a generic admin dashboard if the project's design language specifies a desktop/workspace-oriented application.

---

# 13. Business Rules

Business rules must be explicit dan berada di `## Requirements > ### Business Rules` (FASE 2) serta dilengkapi `Edge Cases`.

Example:

```md
### Business Rules

- BR-001: Table name must be unique.
- BR-002: Column name must be unique within a table.
- BR-003: A table must contain at least one column.
- BR-004: A table already referenced by another resource cannot be deleted.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Nama tabel duplikat | Tolak dengan 409 + pesan "Nama sudah digunakan" | ERR-01 |
| EC-02 | Hapus tabel yang masih dipakai Component | Tolak dengan 409 + daftar referensi | ERR-02 |
```

Do not invent business rules without evidence.

When a rule cannot be determined, put it under:

```md
## Open Questions
```

---

# 14. User Flow

User Flow MANDATORY di **kedua FASE** dan harus KONSISTEN satu sama lain.

* **FASE 1**: User Flow menggambarkan alur interaksi di prototype (klik, navigasi, state).
* **FASE 2**: User Flow menggambarkan alur yang sama tetapi dilengkapi mapping ke API dan implementasi. Harus identik dengan FASE 1 untuk langkah interaksi; tambahan langkah API tidak boleh mengubah alur UI tanpa catatan.

Gunakan struktur:

```text
Diagram → Steps → Alternate & Error Flows → (FASE 2: Flow→UI mapping + Flow→API mapping)
```

Setiap `Requirements > Use Cases` dan `Acceptance Criteria` di FASE 2 harus dapat ditelusuri ke `User Flow > Steps`.

Jika flow tidak dapat ditentukan, buat asumsi terkecil dan catat di `Assumptions` + `Open Questions`.

---

# 15. Acceptance Criteria

Acceptance Criteria MUST be testable dan berada di `## Acceptance Criteria`.

Gunakan format:

```text
Given
When
Then
```

Cover:

* happy path
* validation
* business rules
* error handling
* empty state
* permissions
* important edge cases

Example:

```md
### AC-001 — Menampilkan editor Global Table

Given the administrator is on the Global Table page

When the administrator clicks Create

Then the Global Table editor is displayed.
```

Setiap AC harus dapat dipetakan ke:
- `User Flow > Steps` (FASE 1 & 2)
- minimal satu item di `## Tasks`

Untuk FASE 1, AC memvalidasi design/prototype. Untuk FASE 2, AC memvalidasi implementasi terhadap flow + mockup FASE 1.

---

# 16. API Specification

Define API requirements di `## API` (FASE 2) dengan ke-8 kolom/field wajib:

`server route`, `HTTP method`, `request`, `response`, `validation`, `error`, `authentication`, `authorization`.

Harus SESUAI dengan User Flow dan UI yang telah didesain di FASE 1 — setiap endpoint harus dapat dipetakan ke `User Flow > Flow → API Mapping`.

Follow existing project API conventions (`AGENTS.md` — Service pattern, Nitro route, Zod DTO, `createError` dari `h3`, pagination `page/limit/search/sortBy/sortOrder`).

Do not invent API patterns that conflict with:

```text
docs/architecture.md
```

or existing implementation.

Jika endpoint tidak butuh auth, jelaskan eksplisit `Auth: Public` + alasan.

---

# 17. Database Specification

Define database impact di `## Domain` (FASE 2: Entities, Relationships, States, Domain Rules, Invariants + Data Model).

Use:

```text
docs/database.md
```

and existing entities as references.

Identify:

* new entities
* modified entities
* relationships (1:1, 1:N, N:M) + cascade
* indexes / unique constraints
* migrations / seed
* lifecycle / state machine + invariants

Do not redesign the entire database for one task.

---

# 18. Production Readiness

The generated roadmap should consider the complete product lifecycle.

When relevant, include final tasks for:

```text
Security
Audit Log
Error Handling
Observability
Performance
Testing
E2E
Accessibility
Responsive UX
Documentation
Deployment
Production Configuration
Backup / Recovery
```

Do not generate irrelevant tasks. Untuk production tasks yang memiliki UI (mis. dashboard observability), tetap terapkan pola UI-First (design task terlebih dahulu) + Storybook prototype di project.

---

# 18A. Storybook — Prototype Interaktif Langsung di Project (WAJIB FASE 1)

> FASE 1 tidak selesai tanpa Storybook prototype yang runnable di project.

**Aturan**:
- Prototype WAJIB diimplementasikan sebagai komponen Vue nyata (`app/components/...`, `app/pages/...`) + **Storybook stories** (`apps/web/stories/{feature}/*.stories.ts`), bukan hanya Figma/PNG.
- Stack prototype: **Naive UI 2.44** (direct import `import { NButton } from 'naive-ui'`), **Tailwind CSS v4** (utility only), token **`app/utils/naiveui-theme.ts`** (`GlobalThemeOverrides` — primary `#3B82F6`, Inter, radius `6/4/8`).
- Storybook config: `apps/web/.storybook/main.ts` (`stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)']`, addons `a11y` + `docs`, framework `vue3-vite`), `apps/web/.storybook/preview.ts` (import `../assets/css/main.css` + `parameters.a11y`).
- Per story minimal: `default` render, state variants (loading/empty/error/success/validation/permission), responsive viewport, a11y check via `@storybook/addon-a11y`.
- Verifikasi: `npm run storybook` (port 6006) tampil tanpa error; `npm run build-storybook` sukses; peer review via Storybook URL.
- FASE 2 WAJIB mereferensikan stories FASE 1 di `## UI > Referensi Design` (contoh: `stories/global-table/List.stories.ts — ListStory, EmptyStory, ErrorStory`). Deviasi dari Storybook harus dicatat di `Penyesuaian dari design`.

**Struktur stories contoh**:
```text
apps/web/stories/global-table/
├── List.stories.ts        # DataTable: default, loading, empty, error, permission
├── Form.stories.ts        # Form: default, validation, disabled, success
└── Detail.stories.ts      # Detail: .detail-view pattern, loading, error
```

---

# 18B. QA Perspective — Bertindak sebagai QA Engineer / Tester

> Saat mengisi `## Tasks > Test Plan` dan `## Verification`, bertindak SEOLAH-OLAH sebagai QA engineer independen yang akan membuat file test `unit`, `nuxt`, `e2e` dan memastikan semua User Flow berjalan benar + semua logika benar. Test ini dipakai oleh `/verify` dan `/review`.

Aturan WAJIB:

- Setiap **User Flow step** (happy + alternate + error) HARUS memiliki minimal 1 test E2E. Mapping: `User Flow Step → E2E test case`.
- Setiap **Acceptance Criteria Given/When/Then** HARUS memiliki test (unit/nuxt/e2e). Mapping: `AC-XXX → Test ID`.
- Setiap **Functional Requirement / Business Rule / Domain Rule / Invariant** HARUS memiliki unit test. Mapping: `FR/BR/DR/INV → UT-XXX`.
- Setiap **UI State** (loading/empty/error/success/validation/permission) HARUS memiliki nuxt/component test + E2E. Mapping: `State → NT-XXX + E2E-XXX`.
- Setiap **API endpoint** HARUS memiliki unit/DTO test + integration test untuk request/response/validation/error/auth/authz. Mapping: `Endpoint → UT + Integration`.
- Setiap **Edge Case** HARUS memiliki test (unit atau e2e).
- Tulis rencana file test eksplisit: `tests/unit/{feature}/*.test.ts`, `tests/nuxt/{feature}/*.test.ts` atau `app/components/**/ *.test.ts`, `tests/e2e/{feature}.spec.ts`. Jangan tulis "tulis test" generik.
- Definisikan ekspektasi GIVEN/WHEN/THEN untuk setiap test case di `## Tasks > Test Plan` — agar `/verify` dapat menjalankan `npm run test:unit`, `npm run test:nuxt`, `npm run test:e2e` dan memverifikasi 1:1 dengan User Flow.
- Jika task tidak memiliki UI, tetap butuh unit + API tests untuk logic.

Contoh mapping QA (untuk `## Tasks > Test Plan`):

| User Flow Step | AC | BR/BR/FR | Test ID | Jenis | Ekspektasi |
|---|---|---|---|---|---|
| Step 1: Buka list | AC-001 | FR-001 | E2E-01 | e2e | List render, pagination, search work |
| Step 3: Submit valid | AC-003 | BR-001, FR-002 | E2E-01, UT-01 | e2e + unit | 201 created, validasi lolos |
| Step ERR-01: Validasi gagal | AC-004 | BR-002 | E2E-02, UT-01 | e2e + unit | 400 + inline error |
| State empty | AC-005 | — | NT-01, E2E-02 | nuxt + e2e | NEmpty + CTA muncul |

`/verify` akan berperan sebagai QA yang menjalankan ketiga suite dan memverifikasi traceability `User Flow ↔ AC ↔ Test`. `/review` akan menilai kualitas dan coverage test.

---

# 19. Task Dependency Map

After generating the task list, create a dependency map yang menunjukkan FASE 1 → FASE 2 per feature.

Example:

```text
01-auth-ui-design
        │
        ▼
02-authentication
        │
        ▼
03-users-ui-design
        │
        ▼
04-user-management
        │
        ├──────────────┐
        ▼              ▼
05-global-table-ui-design     07-component-ui-design
        │                     │
        ▼                     ▼
06-global-table             08-component
        │                     │
        └──────────┬──────────┘
                   ▼
            09-template-ui-design
                   │
                   ▼
              10-template
                   │
                   ▼
        11-administration-ui-design
                   │
                   ▼
            12-administration
                   │
                   ▼
            13-generated-app
```

The dependency map MUST visually distinguish FASE 1 (design) dan FASE 2 (implementation) dan garis dependency `design → implementation`.

---

# 20. Completeness Check

Before finishing, verify bahwa:

**Untuk setiap feature dengan UI, terdapat PASANGAN task FASE 1 + FASE 2**:

* [ ] FASE 1 `*-ui-design.md` ada dan berisi User Flow + UI lengkap (10 sub-bagian) + wireframe/mockup/prototype + AC design + Tasks design + Verification design
* [ ] FASE 2 `*.md` ada, mencantumkan `Dependencies: FASE 1`, mereferensikan FASE 1 di `## UI > Referensi Design`, User Flow konsisten dengan FASE 1, dan semua 7 bagian mandatory FASE 2 terisi

**Roadmap secara keseluruhan mencakup**:

### Product

* [ ] Core Concept terpetakan ke Requirements.tujuan & use cases (FASE 2)
* [ ] Main user workflows → User Flow → UI.interaction (FASE 1 + 2 konsisten)
* [ ] Main entities → Domain.entities (FASE 2)
* [ ] Core business rules → Requirements.business rules + Domain.domain rules/invariants (FASE 2)

### Design (FASE 1 — Deliverables Langsung di Project + Storybook)

* [ ] Wireframe low-fi untuk semua halaman & states (`docs/wireframes/{feature}/`)
* [ ] Mockup hi-fi dengan Naive UI + Tailwind + token `app/utils/naiveui-theme.ts` (implementasi Vue `app/components/...` + `app/pages/...`)
* [ ] Prototype interaktif **langsung implementasi di project** — Storybook stories `apps/web/stories/{feature}/*.stories.ts` (dibaca `npm run storybook` :6006, build `npm run build-storybook` PASS)
* [ ] Responsive (desktop/tablet/mobile) — wireframe + Storybook viewport
* [ ] Accessibility — a11y addon Storybook + keyboard/ARIA

### Backend (FASE 2)

* [ ] API (route, method, request, response, validation, error, authentication, authorization) — sesuai User Flow & UI FASE 1
* [ ] Domain (entity, relationship, state, domain rules, invariant)
* [ ] Database (Data Model + migration)
* [ ] Validation (Zod)
* [ ] Authorization (Guard/Permission)
* [ ] Error handling (`createError`)

### Frontend (FASE 2 — mengacu FASE 1 + Storybook)

* [ ] Halaman + Layout (sesuai mockup + Storybook FASE 1)
* [ ] Components (sesuai mockup + stories FASE 1 — `apps/web/stories/{feature}/*.stories.ts`)
* [ ] Interaction (sesuai Storybook prototype FASE 1)
* [ ] States (loading/empty/error/success/permission/validation — sesuai design + stories FASE 1)
* [ ] Responsive behavior (sesuai wireframe + Storybook viewport FASE 1)
* [ ] Accessibility (sesuai design + a11y addon FASE 1)

### Quality (QA Perspective)

* [ ] User Flow di setiap task (FASE 1 & 2) — semua steps ada di `## User Flow`
* [ ] Acceptance (Given/When/Then — kapan feature dianggap benar — mapping ke User Flow & Test)
* [ ] Tasks (daftar pekerjaan implementasi — FASE 1: design, FASE 2: code) + Test Plan QA (UT/NT/E2E mapping)
* [ ] Unit tests (`tests/unit/` — service, DTO, entity, domain rules, invariants) — 1 test per FR/BR/DR/INV
* [ ] Nuxt tests (`tests/nuxt/` / `app/components/**/ *.test.ts` — render semua state, interaction, responsive, accessibility)
* [ ] Integration/API tests (endpoint + validation + error + auth/authz)
* [ ] E2E tests (`tests/e2e/` — happy + alternate/error + edge + permission — 100% User Flow steps, 100% AC)
* [ ] Traceability: setiap User Flow step ↔ AC ↔ Test ID terdokumentasi di `## Tasks > Test Plan`
* [ ] UI/UX verification (pixel-perfect terhadap mockup FASE 1)
* [ ] Security (auth, RBAC, validation, secrets)
* [ ] Performance where relevant

### Production

* [ ] Observability
* [ ] Deployment
* [ ] Production configuration
* [ ] Documentation where relevant

Do not create separate tasks for these categories unless they represent meaningful capabilities.

---

# 21. Consistency Check

Validate every generated task against:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
Understand Anything
existing tasks
pasangan FASE 1 ↔ FASE 2 (konsistensi User Flow & UI)
```

Check:

* terminology
* entities
* architecture
* dependencies (FASE 1 → FASE 2)
* User Flow konsistensi (FASE 2 tidak bertentangan dengan FASE 1)
* UI konsistensi (FASE 2 mereferensikan mockup/wireframe FASE 1, tidak desain ulang tanpa catatan)
* API konsistensi (endpoint mapping ke User Flow)
* database conventions
* UI/UX conventions
* task duplication
* task ordering (UI-First)
* kelengkapan bagian mandatory per FASE

If a contradiction exists, do not silently invent a solution.

Record it under:

```text
Open Questions
```

Serta catat di `## UI > Penyesuaian dari design` (FASE 2) jika ada deviasi dari FASE 1.

---

# 22. Scope of Modification

This command may:

```text
create/update tasks/NN-slug/ folders (folder mode, opsi B — preferred: README.md + spec.md + flow-requirements.md + domain-api-ui.md + acceptance-tasks.md + verification.md, copied from tasks/_template/)
update legacy tasks/*.md (only when updating an existing flat task)
create/update tasks/task-logs.md
create/update tasks/README.md (index)
```

It MUST NOT:

```text
modify application source code
modify .ua/
modify AGENTS.md
modify docs/PRD.md
modify docs/architecture.md
modify docs/database.md
modify docs/design-system.md
```

unless explicitly requested by the user.

This command is for task decomposition only.

---

# 23. Final Output

After generation, return:

```text
Complete SDD Task Roadmap Generated

Input:
{short summary of Core Concept}

Tasks:
NN tasks generated (X design + Y implementation)

Created (FASE 1 — UI Design):
- tasks/01-xxx-ui-design/README.md
- tasks/03-yyy-ui-design/README.md
...

Created (FASE 2 — Implementation):
- tasks/02-xxx/README.md (depends on 01)
- tasks/04-yyy/README.md (depends on 03)
...

Updated:
- ...

Skipped:
- ...

Core Concept:
{summary}

Dependency Flow (UI-First):

01-ui-design → 02-impl → 03-ui-design → 04-impl → ...

Coverage:
- Design (wireframe/mockup/prototype): ...
- Authentication: ...
- Authorization: ...
- Core Domain: ...
- Database: ...
- API: ...
- Frontend: ...
- UI/UX: ...
- Testing: ...
- Production: ...

Mandatory Sections Check:

FASE 1 (per design task):
- User Flow: OK
- UI (10 sub-bagian): OK
- Acceptance (Given/When/Then): OK
- Tasks (design checklist): OK
- Verification (design): OK

FASE 2 (per implementation task):
- User Flow: OK
- Requirements (tujuan/users/use cases/functional/business rules/edge cases): OK
- Domain (entity/relationship/state/domain rules/invariant): OK
- API (route/method/request/response/validation/error/auth/authz): OK
- UI (referensi FASE 1 + halaman/layout/component/interaction/responsive/loading/empty/error/success/accessibility): OK
- Acceptance (Given/When/Then): OK
- Tasks (daftar implementasi): OK
- Verification: OK

Konsistensi FASE 1 ↔ FASE 2:
- User Flow konsisten: OK/CONFLICT
- UI referensi: OK/CONFLICT

Detected Conflicts:
- ...

Open Questions:
- ...

Task Logs:
- tasks/task-logs.md created/updated (see #24)

Next Step:

/plan
```

Do not implement any task.

The generated tasks are the source input for `/plan`.

---

# 24. Task Logs (Mandatory Final Step)

After all tasks in `tasks/` are generated/updated, you MUST create or update `tasks/task-logs.md` as the tracking log for what has NOT yet been implemented, verified, and reviewed.

This step is mandatory and is part of `/gen-tasks` execution — do NOT skip it.

### 24.1 Rules

1. Scan all folder-mode entrypoints `tasks/NN-slug/README.md` AND legacy `tasks/NN-*.md` files (excluding `tasks/task-logs.md`, `tasks/README.md`, `tasks/_template/` itself).
2. If `tasks/task-logs.md` does not exist → CREATE it using the template in 24.2.
3. If it already exists → UPDATE it:
   - preserve existing checklist states `[x]` for already implemented/verified/reviewed items,
   - add new tasks as unchecked `[ ]`,
   - remove entries for deleted task files,
   - update `Last Updated` section.
4. All newly generated tasks default to NOT YET implemented, verified, and reviewed (`[ ]`).
5. Pisahkan seksi FASE 1 dan FASE 2 di Overview jika memungkinkan (opsional, untuk keterbacaan).
6. Do NOT modify application source code in this step — only `tasks/task-logs.md`.

### 24.2 Template for `tasks/task-logs.md`

```md
# Task Logs

> Auto-generated by `/gen-tasks` and `/task`. Updated by `/implement`, `/verify`, `/review`.
> Status checklist: `[ ]` = belum, `[x]` = sudah.

## Last Updated

- Date: {YYYY-MM-DD}
- By: /gen-tasks
- Source: {short summary of Core Concept / $ARGUMENTS}

## Overview

| Task File | Fase | Status | Implemented | Verified | Reviewed |
| --------- | ---- | ------ | ----------- | -------- | -------- |
| tasks/01-xxx-ui-design/README.md | FASE 1 — Design | TODO | [ ] | [ ] | [ ] |
| tasks/02-xxx/README.md | FASE 2 — Impl | TODO | [ ] | [ ] | [ ] |

## Belum Implementasi

- [ ] tasks/01-xxx-ui-design/README.md — {Task Name} (FASE 1)
- [ ] tasks/02-xxx/README.md — {Task Name} (FASE 2)

## Sudah Implementasi

- (belum ada)

## Belum Diverifikasi

- [ ] tasks/01-xxx-ui-design/README.md — {Task Name}
- [ ] tasks/02-xxx/README.md — {Task Name}

## Sudah Diverifikasi

- (belum ada)

## Belum Direview

- [ ] tasks/01-xxx-ui-design/README.md — {Task Name}
- [ ] tasks/02-xxx/README.md — {Task Name}

## Sudah Direview

- (belum ada)

## Detail per Task

### tasks/01-xxx-ui-design/README.md

- Fase: FASE 1 — UI Design
- Status: TODO
- Depends on: —
- Implemented: [ ] —
- Verified: [ ] —
- Reviewed: [ ] —
- Notes: Wireframe/Mockup/Prototype untuk {Feature}.

### tasks/02-xxx/README.md

- Fase: FASE 2 — Implementation
- Status: TODO
- Depends on: tasks/01-xxx-ui-design/README.md
- Implemented: [ ] —
- Verified: [ ] —
- Reviewed: [ ] —
- Notes: Implementation mengacu design 01.
```

### 24.3 Verification

Before finishing `/gen-tasks`, ensure:

- [ ] `tasks/task-logs.md` exists
- [ ] Every folder-mode `tasks/NN-slug/README.md` (and any legacy `tasks/NN-*.md`) is listed in Overview and Detail per Task dengan Fase
- [ ] Every new task appears under Belum Implementasi / Belum Diverifikasi / Belum Direview with `[ ]`
- [ ] Existing `[x]` states are not reset to `[ ]`
- [ ] Dependency FASE 1 → FASE 2 tercatat di Detail per Task
