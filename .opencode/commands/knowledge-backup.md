---
description: Backup pengetahuan apps/web ke apps/web/docs/* + apps/web/AGENTS.md (PRD, architecture, database, design-system, README, core-concept)
---

# Knowledge Backup — apps/web

Backup pengetahuan **real** dari `apps/web/*` ke `apps/web/docs/*` + `apps/web/AGENTS.md` agar sesi baru bisa `/knowledge:prime`.

> **Nama command:** `/knowledge:backup` (alias `/backup`, `/sync-docs`)
> **Lokasi output:** `apps/web/docs/` + `apps/web/AGENTS.md`
> **Sumber kebenaran:** kode `apps/web/*` (bukan janji di chat)

Input: `$ARGUMENTS` opsional — konteks tambahan, contoh: `"Global Tables 13 tipe + persuratan stabil"` atau kosong (auto-discovery).

---

## 1. Discovery (WAJIB read-only dulu, jangan tulis)

Baca **sebelum tulis apapun**:

```text
apps/web/package.json              # deps, scripts
apps/web/prisma/schema.prisma      # 25 models (RBAC 18 + Global Tables 2 + Persuratan 5) + urgensi dyn_*
apps/web/prisma7.config.ts         # DATABASE_URL file:./dev.db
apps/web/lib/prisma.ts             # singleton
apps/web/lib/services/global-tables.service.ts  # 13 tipe kolom
apps/web/lib/renderer/operationEngine.ts        # ++ "" * / + -
apps/web/lib/services/persuratan/*
apps/web/app/global-tables/page.tsx            # GUI C.1-C.3
apps/web/app/dyn/[table]/page.tsx              # search/options/order
apps/web/app/components-persuratan/page.tsx    # richtext + binding
apps/web/app/templates-persuratan/page.tsx
apps/web/app/administrasi-persuratan/page.tsx
apps/web/app/hasil-persuratan/page.tsx
apps/web/app/generated/surat-platform/builder/page.tsx # Office Doc
apps/web/components/layout/AppLayout.tsx       # sidebar 4 grup
apps/web/app/globals.css                       # tokens #0075de #f6f5f4 #e6e6e6
apps/web/next.config.ts                        # rewrites /builder etc
AGENTS.md (root)                               # baseline
docs/PRD.md, architecture.md, database.md, design-system.md (root) # baseline
```

Jangan percaya buta `$ARGUMENTS`. Jika konteks user konflik dengan repo (mis. “sudah pakai Postgres” padahal masih SQLite), catat konflik di hasil, jangan diam-diam overwrite.

---

## 2. Tulis / Update (idempoten)

Target **wajib** di `apps/web/` (bukan `docs/` root):

```
apps/web/AGENTS.md        # copy adaptasi dari root AGENTS.md
apps/web/docs/PRD.md
apps/web/docs/architecture.md
apps/web/docs/database.md
apps/web/docs/design-system.md
apps/web/docs/README.md   # index docs
apps/web/docs/core-concept.md
apps/web/docs/production-runbook.md (jika ada)
```

Aturan adaptasi `AGENTS.md`:
- Header tambah `> Last Backup: YYYY-MM-DD — via /knowledge:backup`
- `All commands run from apps/web/` → `All commands run from .` (karena sudah di dalam apps/web)
- `docs/PRD.md` → `docs/PRD.md` (relative, bukan `../docs`)

Aturan docs:
- Tiap file prefix header:
  ```
  > Last Backup: YYYY-MM-DD — via /knowledge:backup
  > Source: apps/web/* — prisma/schema.prisma (25 models), app/*, lib/*
  > Scope: apps/web — untuk root lihat ../../docs/
  ```
- `PRD.md` — WHAT/WHY/WHO, workflows Global Tables (13 tipe) & Persuratan (4 tahap), jangan tulis TODO task.
- `architecture.md` — HOW: layer stack Next.js, `app/global-tables` + `app/dyn/[table]` + `app/components-persuratan` + `lib/services/global-tables.service.ts` + `dyn_*`, `app/api/global-tables`, `app/api/dyn`, `app/api/persuratan`, `middleware.ts`.
- `database.md` — HOW data: 25 models (list semua), `global_tables` + `global_columns` (13 tipe), `persuratan_*` 4 tabel, `dyn_*` pattern, indexes, migration `db push` (bukan `migrate dev` yang drop), `operationEngine` eval.
- `design-system.md` — HOW look: `#0075de` HSL 210 100% 44%, `#f6f5f4`, `#e6e6e6`, Inter, PageShell + DataTable kanonis, detail-view, office doc paper `#e8ecef` + `shadow`.
- `README.md` — index + aturan anti-drift.
- `core-concept.md` — dari `docs/core-concept-global-persuratan.md` (meta vs dynamic, operation `++`).

Gunakan skill `permanent-knowledge` sebagai referensi struktur (PRD §1-24, architecture §1-20, database §1-17, design-system §1-26), tapi **target path di-override ke `apps/web/docs/*`**.

---

## 3. Validasi

Setelah tulis:

- [ ] `apps/web/AGENTS.md` ada & `All commands run from .`
- [ ] `apps/web/docs/PRD.md` ada
- [ ] `apps/web/docs/architecture.md` ada
- [ ] `apps/web/docs/database.md` ada (sebut 25 models + dyn_*)
- [ ] `apps/web/docs/design-system.md` ada
- [ ] `apps/web/docs/README.md` ada
- [ ] `apps/web/docs/core-concept.md` ada
- [ ] `npm run build` dari `apps/web` tetap hijau (tidak merusak app)

---

## 4. Laporan Akhir

Kembalikan:

```
Knowledge Backup — apps/web

AGENTS.md: CREATED/UPDATED/NO CHANGE
PRD: ...
Architecture: ...
Database: ...
Design System: ...
README: ...
Core Concept: ...

Source: apps/web/* (25 models, 13 tipe, persuratan)
Conflicts: (jika ada)
Next: /knowledge:prime untuk sesi baru
```

Jangan ubah kode aplikasi (`app/*`, `lib/*`) di command ini — hanya docs.
