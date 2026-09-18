---
description: Prime sesi baru dengan pengetahuan apps/web dari apps/web/docs/* + apps/web/AGENTS.md
---

# Knowledge Prime — apps/web

Load pengetahuan **real** `apps/web` agar sesi/model baru langsung paham dan bisa lanjutkan project tanpa tanya ulang.

> **Nama command:** `/knowledge:prime` (alias `/prime`, `/pahami`, `/onboard` — `/understand` global tetap untuk knowledge-graph `.ua/`)
> **Sumber:** `apps/web/AGENTS.md` + `apps/web/docs/*`
> **Efek:** read-only, tidak tulis file, hanya inject context ke sesi

Input: `$ARGUMENTS` opsional — mis. pertanyaan spesifik `"lanjutkan global tables"` atau kosong (prime full).

---

## 1. Load Wajib (urutan penting)

Baca **berurutan**, jangan skip:

```text
1. apps/web/AGENTS.md                          # behaviour contract, working dir ".", tech stack, token #0075de
2. apps/web/docs/PRD.md                        # WHAT/WHY — Global Tables 13 tipe + Persuratan
3. apps/web/docs/architecture.md               # HOW — app/global-tables, app/dyn/[table], lib/services/global-tables.service.ts, dyn_*, operationEngine
4. apps/web/docs/database.md                   # DATA — 25 models, global_tables/columns, persuratan_*, dyn_* indexes
5. apps/web/docs/design-system.md              # LOOK — #0075de, #f6f5f4, #e6e6e6, PageShell, DataTable, office doc
6. apps/web/docs/README.md + core-concept.md   # Index + meta vs dynamic
```

Jika `apps/web/docs/*` belum ada → fallback baca `docs/*` root + `AGENTS.md` root, tapi warn di laporan: “apps/web/docs belum di-backup, jalankan /knowledge:backup dulu”.

Tambahan ringan (jangan dump penuh, cukup glob):

```text
Glob apps/web/app/**/*            # list pages
Glob apps/web/lib/services/**/*    # list services
Read apps/web/prisma/schema.prisma # hitung models (harus 25)
Read apps/web/package.json         # deps
```

---

## 2. Synthesize (in-memory)

Buat ringkasan 1-2 halaman di memori (jangan tulis file):

- **Product:** Surat Platform di `apps/web` — Next.js 15 + Global Tables (13 tipe: text, richtext, date, datetime, time, image, select, select_multiple, select_table, select_table_multiple, number+IDR, hidden_operation_text, readonly_operation_text dengan `++` `""` `* / + -`) + Persuratan (Component → Template → Administrasi → Hasil) + Document Builder Office Doc.
- **Tech:** Next.js 15 App Router + React 19 + shadcn/ui + Tailwind v4 + Prisma 7.10 SQLite `dev.db` via `@prisma/adapter-libsql` + `lib/prisma.ts` singleton + `puppeteer-core` PDF + Zod + JWT `middleware.ts`.
- **Architecture:** `app/global-tables` (meta CRUD) → `dyn_*` (physical) via `prisma.$executeRawUnsafe`; `app/dyn/[table]` (search/options/order); `app/components-persuratan` (richtext + right-click binding); `app/templates-persuratan` (richtext + component mapping + loop); `app/administrasi-persuratan` (fields + steps); `app/hasil-persuratan` (menu baru); `app/generated/surat-platform/builder` (Office Doc paper).
- **Database:** 25 models (cek `prisma/schema.prisma`): RBAC 18 + `global_tables`, `global_columns`, `persuratan_components`, `persuratan_templates`, `persuratan_administrations`, `persuratan_steps`, `persuratan_datas` + `dyn_*` runtime.
- **Design:** `#0075de` HSL 210 100% 44%, `#f6f5f4`, `#e6e6e6`, Inter, `PageShell` + `DataTable` kanonis, `detail-view`, office doc `#e8ecef`.

Validasi silang: `PRD ↔ architecture ↔ database ↔ design-system` — laporkan konflik jika ada (mis. “PRD bilang 13 tipe tapi code 12”).

---

## 3. Output — Prime Report (wajib cetak)

Kembalikan format ini:

```md
## Knowledge Prime — apps/web

**Project:** Surat Platform (`apps/web`) — Next.js 15 + Global Tables + Persuratan — DB 25 models — Design #0075de

**Stack:** Next.js 15, React 19, Prisma 7.10 SQLite (dev.db), Tailwind v4, shadcn/ui, lucide-react, operationEngine

**Modules:**
- Global Tables: app/global-tables (C.1-C.3) + app/dyn/[table] (search/options/order) + lib/services/global-tables.service.ts + dyn_*
- Persuratan: components → templates → administrations → hasil (persuratan_*)
- Document Builder: app/generated/surat-platform/builder Office Doc + lib/renderer/engine.ts + puppeteer-core PDF

**Docs Loaded:**
- AGENTS.md: OK (apps/web)
- PRD: OK
- architecture: OK
- database: OK (25 models)
- design-system: OK
- README/core-concept: OK

**Conflicts:** none / list

**Next Step:** Lanjutkan di `app/dyn/[table]/page.tsx` untuk filter departemen, atau `app/components-persuratan` untuk binding.

**Ready to continue — tanyakan task selanjutnya.**
```

Jangan tulis file baru. Hanya baca dan laporkan. Jika user minta lanjutkan task, langsung pakai konteks ini.

---

## 4. Aturan

- **Read-only:** Jangan edit `apps/web/*` atau `docs/*` di command prime.
- **Factual:** Jangan ngarang. Jika docs belum ada, bilang `Belum ada, jalankan /knowledge:backup`.
- **Ringkas:** Jangan dump 500 baris PRD ke chat — ringkas 1-2 halaman.
- **Tracer:** Sebut file sumber (`apps/web/docs/PRD.md:12`) saat merujuk.
