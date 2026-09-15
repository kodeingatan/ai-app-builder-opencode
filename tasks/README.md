# Tasks — AI App Builder Platform

> Setiap task adalah folder `tasks/NN-slug/`, bukan 1 file raksasa. Entrypoint tiap task: `README.md` di dalam foldernya.

## Daftar Task — AI App Builder

| Task | Folder | Status | Implemented | Verified | Reviewed |
|------|--------|--------|-------------|----------|----------|
| Task 01 — Platform Scope Reduction (RBAC-Only Cleanup & Docs Refresh) | `01-platform-scope-reduction/` | DONE (legacy) | [x] | [x] | [x] |
| Task 02 — Fix Stale Nuxt Auto-Imports & Build Recovery | `02-fix-stale-nuxt-imports-and-render-guard/` | DONE (legacy) | [x] | [x] | [x] |
| Task 03 — Redesign UI/UX Notion-Calm (Wireframe/Mockup/Prototype) | `03-redesign-ui-design/` | DONE (legacy) | [x] | [x] | [x] |
| Task 04 — Redesign Implementation (Notion-Calm 11 Pages) | `04-redesign/` | DONE (legacy) | [x] | [x] | [x] |
| Task 05 — Document Engine | `05-document-engine/` | DONE (legacy) | [x] | [x] | [x] |
| Task 06 — Master Data DDL | `06-master-data-ddl/` | DONE (legacy) | [x] | [x] | [x] |
| Task 07 — Template & Administration | `07-template-administration/` | DONE (legacy) | [x] | [x] | [x] |
| Task 08 — Letter Builder UX Improvement (Design) | `08-letter-builder-ux-improvement-ui-design/` | DONE (legacy) | [x] | [x] | [x] |
| Task 09 — Letter Builder UX Improvement (Implementation) | `09-letter-builder-ux-improvement/` | DONE (legacy) | [x] | [x] | [x] |
| Task 10 — Letter Builder Polish (Design) | `10-letter-builder-polish-ui-design/` | TODO (legacy) | [ ] | [ ] | [ ] |
| Task 11 — Letter Builder Polish (Implementation) | `11-letter-builder-polish/` | TODO (legacy) | [ ] | [ ] | [ ] |
| **Task 12 — AI App Builder Foundation (Prompt → Generate + Preview)** | `12-ai-app-builder-foundation/` | **TODO** | [ ] | [ ] | [ ] |
| **Task 13 — AI Builder: Inference Engine + Spec → UI Assembly** | `13-ai-builder-inference-ui-assembly/` | **TODO** | [ ] | [ ] | [ ] |
| **Task 14 — AI Builder: Project Library + Refine + Deploy** | `14-ai-builder-library-refine/` | **TODO** | [ ] | [ ] | [ ] |
| **Task 15 — Generated Apps: Template Gallery + Seed + RBAC Auto** | `15-generated-templates-rbac/` | **TODO** | [ ] | [ ] | [ ] |

> Legacy Tasks 01-11 adalah arsip LBS/Letter Builder sebelum pivot AI App Builder (2026-09-15). New work mulai Task 12.

## Task Aktif — AI App Builder (Pivot 2026-09-15)

### Task 12 — AI App Builder Foundation

Prompt `buatkan aplikasi kasir` → Inference → Project + Generation → Preview `/generated/pos-kasir` dengan DataTable/PageShell kanonis + seed.

### Task 13 — Inference Engine + Spec → UI Assembly

Spec generation (AiAppSchema: entities/pages/roles/flows) → CodeGen (EntitySchema+DTO+Service+API) → UI Assembly (PageShell+DataTable+FormModal+DetailDrawer) dengan Beautiful by default.

### Task 14 — Project Library + Refine

Library list, detail project, refine `tambahkan fitur X` (delta patch additive), deployments, history.

### Task 15 — Templates + RBAC Auto

Starter templates (pos-kasir, crm-klinik, todo-share, inventory, sekolah) + auto-permissions `Generated:*` + per-slug.

## Struktur tiap folder task

```text
tasks/NN-slug/
  README.md               # judul + Status + panduan baca (entrypoint)
  spec.md                 # Objective, Context, Scope, Dependencies
  flow-requirements.md    # User Flow + Requirements
  domain-api-ui.md        # Domain + API + UI
  acceptance-tasks.md     # Acceptance Criteria + Tasks/Test Plan
  verification.md         # Verification + Assumptions + Open Questions + Related + Change Log
```

## Cara baca

1. Buka `tasks/NN-slug/README.md` untuk status + urutan baca.
2. Baca `spec.md` → `flow-requirements.md` → `domain-api-ui.md` → `acceptance-tasks.md` → `verification.md`.
3. Status lintas-task: `tasks/task-logs.md`.

## Cara generate app (user-facing — Behaviour Contract)

Cukup ketik di `Builder` atau di chat:

```
buatkan aplikasi kasir
```

AI Builder akan:

1. Infer: POS → Product, Category, Transaction, Customer + Admin/Kasir + Dashboard
2. Generate: entities, DTOs, services, APIs, pages, components, seed
3. Preview: `/generated/pos-kasir` langsung siap pakai

Kemudian refine:

```
tambahkan barcode scanner
ganti warna jadi hijau
perbaiki tabel produk tambah kolom stok
```

## Task baru

* Salin `tasks/_template/` menjadi `tasks/NN-slug/` dan isi per file.
* Daftarkan di `tasks/task-logs.md` + tabel di atas.
* Resolusi tooling (`/task`, `/implement`, `/verify`, `/review`, `/gen-tasks`): nomor/nama task → `tasks/NN-slug/README.md`.
