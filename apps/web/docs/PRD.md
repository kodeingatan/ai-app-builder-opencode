> Last Backup: 2026-09-18 — via /knowledge:backup
> Source: apps/web/* — prisma/schema.prisma (25 models), app/*, lib/*
> Scope: apps/web — untuk root lihat ../../docs/

# Product Requirements Document (PRD) — AI App Builder Platform + Global Tables & Persuratan

## 1. Product Overview

**Nama Project**: AI App Builder (AAB) — Platform pembuat aplikasi otomatis berbasis AI + **Generated Global Tabel** & **Persuratan**.

**Tagline**: `Minimal Prompt → Maximal App. Ketik sedikit, jadi aplikasi.`

**Tujuan**: User mengetikkan **perintah singkat** (`buatkan aplikasi kasir`) → AI paham intent → generate aplikasi lengkap. **Parallel track stabil**: User juga dapat membuat **tabel bisnis dinamis** via GUI (`/global-tables` → `dyn_*`) dan **alur persuratan** (Component → Template → Administrasi → Hasil) tanpa kode, dengan 13 tipe kolom dan operasi `++`.

**Core Principle — Zero-Friction Generation**:
- **Infer, don't ask** — AI menebak requirement lengkap dari prompt minimal
- **Opinionated defaults** — pilih stack, struktur data, role, UI terbaik otomatis
- **Production-ready** — auth, CRUD, dashboard, search, pagination, validasi, responsive
- **Beautiful by default** — Design System kanonis Notion-calm + shadcn/ui + Tailwind (#0075de / #f6f5f4 / #e6e6e6)

**Contoh**:
- Input: `buatkan aplikasi kasir` → App POS lengkap → Dashboard, Produk, Transaksi, Pelanggan, Laporan, User & Role, Activity Log. Route `/generated/pos-kasir`.
- Input GUI: `Buat Tabel Pegawai` (13 tipe) → `dyn_pegawai` browse di `/dyn/pegawai` dengan searching/options/orders.
- Input Persuratan: Component `Kop Surat` (richtext + binding) → Template `Surat Tugas` → Administrasi `Perjalanan Dinas` (fields + steps) → Hasil persuratan + PDF.

**Current Implementation State (2026-09-18 real):**
- **DB:** `prisma/schema.prisma` **19 models real** (10 RBAC core + 2 junctions extra + Global 2 + Persuratan 5 + ActivityLog + Setting) — hitung `grep -c "^model " = 19`. Spec task menyebut 25 models (RBAC 18 + Global 2 + Persuratan 5) → **konflik dicatat** di `database.md` dan laporan akhir — dokumen ini memakai **19 real**.
- **Global Tables:** `GlobalTable` + `GlobalColumn` (enum 13 tipe) → physical `dyn_*` via `lib/services/global-tables.service.ts` + `lib/renderer/operationEngine.ts` (`++`, `""`, `* / + -`).
- **Persuratan:** `PersuratanComponent`, `PersuratanTemplate`, `PersuratanAdministration`, `PersuratanStep`, `PersuratanData` → GUI `app/components-persuratan`, `app/templates-persuratan`, `app/administrasi-persuratan`, `app/hasil-persuratan`.
- **Sidebar:** `components/layout/AppLayout.tsx` 4 grup: Platform, Global Tabel, Persuratan, Manajemen Lama. Rewrites `next.config.ts` alias `/builder` → `/generated/surat-platform/builder`.

**Tech Stack**:
- Frontend: Next.js 15 (App Router) + React 19 + TypeScript + shadcn/ui + Tailwind CSS v4 + lucide-react + Framer Motion
- Backend: Next.js Route Handlers (`app/api/**/route.ts`) + Prisma 7.10 + SQLite (`@prisma/adapter-libsql`, `dev.db`, `DATABASE_URL="file:./dev.db"`) + Zod + JWT
- Auth: JWT 24 jam, httpOnly cookie + middleware guard
- Engine: Prompt Inference + Spec-to-Schema + UI Assembly + Preview + **GlobalTablesService** + **operationEngine** + persuratan services

---

## 2. Product Vision

Menjadi platform **pembuat aplikasi tercepat dan tercantik** — ide sekecil apa pun menjadi app production-ready dalam menit, plus kemampuan **membuat tabel bisnis dinamis** dan **alur surat resmi** tanpa kode, semua dengan UI cantik kanonis.

---

## 3. Problem Statement

Membuat aplikasi bisnis tradisional butuh spec panjang, setup DB/API/frontend berulang, hasil jelek. User punya ide jelas (`butuh aplikasi kasir` / `butuh tabel pegawai` / `butuh surat tugas`) tapi tool memaksa tulis 5 halaman PRD + desain tabel manual.

AAB memecahkan dengan **inference** (1 baris → app) + **GUI meta-driven** (form visual → `dyn_*`) + **persuratan 4 tahap** (klik kanan binding, bukan JSON manual).

---

## 4. Goals

1. **Prompt → App dalam menit**: 1 baris prompt → preview tanpa tanya balik
2. **Infer lengkap**: domain, entities (3-5), relasi, roles (2-3), pages (5-7), flows
3. **Cantik by default**: token #0075de / #f6f5f4 / #e6e6e6, PageShell + DataTable
4. **Production-ready**: auth + CRUD + dashboard + search/sort/pagination + validasi + responsive + empty/loading/error
5. **Iterasi frictionless**: `tambahkan fitur X` tanpa rebuild
6. **Global Tables GUI**: buat tabel + 13 tipe kolom tanpa kode, langsung browse `dyn_*`
7. **Persuratan 4 tahap**: Component → Template → Administrasi → Hasil + PDF, semua GUI
8. **RBAC otomatis**: permission per entity + role default

---

## 5. Non-Goals

- Bukan builder drag-and-drop manual block per block (kecuali `app/generated/surat-platform/builder` Office Doc)
- Bukan code export ke repo eksternal v1 (generated hidup di `app/generated/{slug}/` atau `dyn_*`)
- Bukan AI chat bebas tanpa struktur
- Bukan workflow engine multi-approval kompleks di v1
- Bukan pengganti migrasi visual penuh — dynamic via `CREATE TABLE`/`ADD COLUMN` saja

---

## 6. Target Users

- **Solo Founder / UMKM** — butuh app toko/kasir/klinik tanpa IT
- **Product Manager / Maker** — validasi ide cepat dengan app real
- **Admin Operasional** — butuh tabel internal (`pegawai`, `inventori`) + surat tugas/dinas
- **Developer** — scaffolding production-ready sebagai starting point
- **Admin Persuratan** — buat template surat resmi dengan kop, tanda tangan, tabel data, QR/barcode

---

## 7. User Roles

### Platform Roles (RBAC Foundation)
- **Super Admin** — full platform + semua generated + builder
- **Admin** — kelola users/roles/permissions + Global Tables + Persuratan
- **Editor / Manager / Viewer / Guest** — sesuai seed `prisma/seed.ts` (5 users default: admin/editor/viewer/manager/guest, password `P455w0rd!!!`)
- **Builder User** — generate & iterate app miliknya
- **Viewer** — read-only preview

### Generated / Dynamic Roles (opinionated per app/tabel)
- Aplikasi kasir: **Admin** (kelola produk/laporan), **Kasir** (transaksi)
- Tabel `pegawai`: kolom `isRequired`/`isSearchable`/`isOrderable` mengatur siapa bisa cari/urut
- Persuratan: pembuat template vs pengisi hasil

---

## 8. Core Concepts

- **GlobalTable** — meta tabel dinamis (`name` snake_case unique → `dyn_name`, `displayName`, `status`). Satu GlobalTable punya banyak GlobalColumn.
- **GlobalColumn** — kolom dengan 13 tipe (text, richtext, date, datetime, time, image, select, select_multiple, select_table, select_table_multiple, number+IDR, hidden_operation_text, readonly_operation_text) + `optionsJson` (format, options, relationTable, displayFields, valueField, isCurrency, expression) + flags `isRequired`/`isOrderable`/`isSearchable` + `orderIndex`.
- **dyn_* — Physical Dynamic Table** — tabel SQLite fisik `dyn_pegawai` dibuat runtime via `CREATE TABLE "dyn_pegawai" ("id" INTEGER PRIMARY KEY, "nama" TEXT, ...)`. N tabel, 0 di awal. Additive only.
- **OperationEngine** — evaluasi `hidden_operation_text` / `readonly_operation_text` dengan syntax `"string" ++ col ++ " * " ++ col2 ++ " = " ++ col1 * col2` ( `++` concat, `""` literal, `* / + -` arithmetic). Real-time di form + server `computeOperationColumns`.
- **PersuratanComponent** — komponen surat (name unique, isLooping, contentHtml richtext, bindingsJson `[{name,type,componentId,width,height}]`). Richtext toolbar + klik kanan binding.
- **PersuratanTemplate** — template surat (name, contentHtml, componentsJson `[{componentId, dataMapping:{binding:{source,value}}, loopConfig:{table,selectedRowIds}}]`). Insert component via klik kanan.
- **PersuratanAdministration** — administrasi persuratan (name, fieldsJson `[{name,type:text|richtext}]` akan prefix `step1_field`, steps via `PersuratanStep`).
- **PersuratanStep** — step per administrasi (administrationId, stepOrder, templateId, dataMappingJson).
- **PersuratanData** — hasil persuratan (administrationId, name, valuesJson `step1_field:value`, stepsDataJson `[{templateId,data}]`). Muncul sebagai menu baru `/hasil-persuratan?administrationId=`.
- **Inference / Opinionated Defaults** — AI tebak domain/entities/roles/pages, pilih warna/field/validasi terbaik tanpa tanya.

---

## 9. Major User Workflows

### 9.1 Minimal Prompt → Instant App (Happy Path)
1. Login → `/builder`
2. Ketik `buatkan aplikasi kasir` di AiPromptBar → Enter
3. Inference Preview 1-2s → Generate (Inferring → Planning → Generating Code → Assembling UI → Seeding)
4. Preview `/generated/pos-kasir` → CRUD siap + seed data
5. Iterate: `tambahkan barcode scanner` → patch tanpa rebuild

### 9.2 Global Tables — 13 Tipe → dyn_* (Wajib GUI, tanpa JSON manual)
1. Buka `/global-tables` → klik **Buat Tabel Baru**
2. **C.1** Isi Nama Tabel snake_case (`pegawai`) → preview `dyn_pegawai`
3. **C.2** Isi Nama Tampilan (`Data Pegawai`), deskripsi, status
4. **C.3** Daftar Kolom (tambah sesuai kebutuhan, minimal 1):
   - **C.3.1** Nama Kolom (snake_case), **C.3.2** Nama Tampilan, **C.3.3** Pilih 13 tipe (grid 4 kolom, icon per tipe):
     - `text` — Input biasa
     - `richtext` — Richtext toolbar Bold/Italic/Underline, H1/H2, Align, List, Table, Link, Image, Undo/Redo + preview HTML
     - `date` — `<input type=date>` + **format** `m-d-Y` (default), `datetime` `m-d-Y H:i:s`, `time` `H:i:s` → render via `formatValue()`
     - `image` — URL Input + file input preview `img`
     - `select` — Options editor rows value/label (tambah/hapus)
     - `select_multiple` — sama multi (checkboxes, simpan JSON array)
     - `select_table` — Relation: pilih tabel relasi (dropdown `global_tables`), pilih **displayFields** multi-checkbox, pilih **valueField** select → render tombol pilih dari tabel relasi (modal: search all, order tiap kolom, checkbox single)
     - `select_table_multiple` — sama multiple (checkbox multiple)
     - `number` — `<input type=number>` + checkbox **Format Mata Uang IDR** → realtime `Rp 1.000.000` via `toLocaleString("id-ID")`, simpan REAL
     - `hidden_operation_text` — tidak tampil di form, textarea **Rumus Otomatis** `expression` → auto hitung hidden, simpan TEXT
     - `readonly_operation_text` — Input disabled amber, auto hitung, preview expression
   - **C.3.4** Nilai Default, **C.3.5** Wajib Diisi (`isRequired`), **C.3.6** Dapat Diurutkan (`isOrderable` → header `↕` clickable), **C.3.7** Dapat Dicari (`isSearchable` → `WHERE col LIKE ?`)
   - Reorder: tombol `ArrowUpDown` + hapus per kolom
5. **Submit** → `POST /api/global-tables` (Zod `CreateGlobalTableSchema`) → validasi snake_case + cek duplikat → `INSERT global_tables` + `global_columns` + `CREATE TABLE "dyn_pegawai"` + `CREATE INDEX` untuk searchable/orderable → `GET /api/global-tables` list tampil `_columnCount` + `_rowCount` (COUNT dari `dyn_*`)
6. **A. Menu Item Baru:** Otomatis muncul `/dyn` (card `dyn_nama`) → link `/dyn/{name}`. Sidebar Global Tabel → Browse Data.
7. **B. Browse `dyn_{name}`** (`/dyn/[table]`):
   - **Searching:** Input `search` → `WHERE isSearchable col LIKE ?` (OR semua searchable), hanya kolom yang di-check. Jika tidak ada searchable → searching non-aktif.
   - **Options:** Checkboxes kolom tampil (`visibleCols`) → filter `visibleColumns`
   - **Orders:** Klik header hanya jika `isOrderable` → `ORDER BY col ASC/DESC`, tampil `Sort: {col} {order}`
   - DataTable render per tipe: `formatValue()` (date format, currency IDR, image thumb, richtext strip, operation badge)
8. **C. Create/Delete sesuai Input Columns (GUI):** Modal `Tambah Data` loop columns render per tipe seperti di atas (text Input, richtext editor + preview, date/time inputs, image file+preview, select dropdown, select_multiple checkboxes, select_table tombol → modal tabel relasi dengan search, order, checkbox, number dengan `Rp` live, hidden skip, readonly disabled + `evaluateOperation` preview) → `POST /api/dyn/{table}` → validasi required, default, type handling (multiple → JSON.stringify, number → parseFloat), `computeOperationColumns` (hidden/readonly) → `INSERT dyn_pegawai` → list refresh.
9. **D. Delete:** `DELETE /api/global-tables/{id}` → `DROP TABLE dyn_*` + delete meta (cascade columns); `DELETE /api/dyn/{table}/{id}` untuk data row.

### 9.3 Persuratan — 4 Tahap (Component → Template → Administrasi → Hasil)

#### Tahap 1 — Component Persuratan (`/components-persuratan`)
1. List `persuratan_components` (name, isLooping, bindings count, preview) → **Buat Component**
2. **B.1** Input nama, **B.2** Checkbox Pengulangan (isLooping → badge Looping), **B.3** Richtext editor toolbar dasar (Bold/Italic/Underline, H1/H2, Quote, Align, UL/OL, Table insert, Link, Image, Undo/Redo via `document.execCommand`) + **Klik kanan** di editor → popup `B.3.1 nama data` + `B.3.2 type view` Select `text|image|component`:
   - **Text (B.3.2.1):** placeholder `<span style="background:#dbeafe; border:dashed">{{nama}}</span>` — dapat di-style via toolbar
   - **Image (B.3.2.2):** `<img src="{{nama}}" width/height>` + input panjang/lebar
   - **Component (B.3.2.3):** Select component yang sudah ada (harus memenuhi bindings-nya) → `<div border:dashed violet>{{nama}}</div>`
3. Bindings disimpan `bindingsJson: [{name,type,componentId?,width?,height?}]` → **B.4 Preview** → `contentHtml` replace `{{name}}` dengan sample

#### Tahap 2 — Template Administrasi Persuratan (`/templates-persuratan`)
1. List `persuratan_templates` (name, components count) → **Buat Template**
2. **C.1** Nama, **C.2** Deskripsi, **C.3** Richtext sama + **klik kanan** → popup:
   - **C.3.1 Pilih component** yang diinginkan (dropdown components, badge looping)
   - **C.3.2 Sesuaikan permintaan data** → form mapping `dataMapping: {bindingName: {source, value}}` dimana `source` = `administrasi` (field administrasi), `tabel` (nama_tabel.kolom), `manual` (ketik)
   - **C.3.3** Sumber data bisa diisi dari administrasi, tabel global, atau manual
   - **C.3.4 Jika looping** → pilih table (dropdown global_tables) + pilih rows (fetch `/api/dyn/{table}?limit=100`, checkbox per row, tombol **Pilih Semua**)
3. Insert placeholder `<div border:dashed #3b82f6>Component: X + bindings</div>` ke editor → `componentsJson: [{componentId, dataMapping, loopConfig?:{table,selectedRowIds}}]`
4. **C.4 Form Generated** → tombol `Pratinjau Formulir` → list mapping sebagai form fields; **C.5 Preview PDF** → `window.open` contentHtml + usages → `print()`

#### Tahap 3 — Administrasi Persuratan (`/administrasi-persuratan`)
1. List `persuratan_administrations` (name, fields count, steps count, _dataCount) → **Buat Administrasi**
2. **C.1** Nama, **C.2** Deskripsi, **C.3 Input data yang dibutuhkan** — dapat tambah terus: rows `nama data` (akan prefix `step1_nama`), `tipe` select `text|richtext` (C.3.2-4). Tombol `Tambah Field` / hapus → `fieldsJson: [{name,type}]`
3. **Steps** → pilih template per step (dropdown templates), urutan `stepOrder` auto, tombol `Tambah Step` terus → simpan `persuratan_steps` (administrationId, stepOrder, templateId)
4. Delete via `DELETE`

#### Tahap 4 — Hasil Administrasi Persuratan (`/hasil-persuratan`)
1. **A. Menu Item Baru:** `/hasil-persuratan` → pilih administrasi (chips `ClipboardList` + `_dataCount`), detail fields & steps. Setiap administrasi = menu baru (`?administrationId=`)
2. **B. Create/Edit (GUI, tanpa JSON):** Pilih administrasi → load `adminDetail.fields` + `steps` → **Lengkapi data** form per field: `text` → `<Input>`, `richtext` → `<Textarea>` (key `step1_nama`) → **Buat step baru** tombol `Tambah Step` (pilih template dari `adminDetail.steps`), lalu **isi data template** `Textarea` JSON per step `data:{field:value}` → dapat buat step baru terus → simpan `persuratan_datas` (administrationId, name, valuesJson, stepsDataJson)
3. **C. Delete:** `DELETE /api/persuratan/administrations/{id}/datas/{dataId}`; Preview PDF via `window.open` `/api/persuratan/administrations/{id}/datas?preview=pdf`

### 9.4 Browse & Manage Projects (Builder)
1. Buka `/builder` → list AiProjects (status, preview, last prompt)
2. Klik project → spec (entities, pages, roles), generations, deployments
3. Aksi: Preview, Deploy, Delete, Duplicate, Refine
4. Office Doc Builder: `/generated/surat-platform/builder` (3-panel: Components kiri → Document Editor Office Doc tengah `#e8ecef` paper shadow → Properties kanan)

### 9.5 RBAC Administration (Fondasi)
1. Admin kelola user, role, permission, guard via DataTable
2. Generated apps mewarisi RBAC — permission otomatis per entity
3. Activity Logs mencatat mutasi (generation, CRUD, Global Tables, Persuratan)

---

## 10. Functional Requirements

### 10.1 AI Builder Core
- Prompt single-line + generate (Enter langsung jalan)
- Inference: domain, 3-5 entities, 2-3 roles, 5-7 pages, flows
- Spec: mini-PRD + ERD + API contract + UI map sebagai `AiAppSchema` JSON
- CodeGen: DTO Zod + Service plain object + Route Handlers + Types
- UI Assembly: Pages + Components (DataTable, PageShell, FormModal, DetailDrawer, StatCard) + Hooks + Stores — wajib design tokens
- Integration: dynamic tables via `prisma.$executeRaw`, seed 5-10 rows, sidebar, routes
- Preview: hot-reload + seed data; Iteration: delta patch merge

### 10.2 Global Tables — 13 Tipe (Wajib GUI)
- Validasi Zod `CreateGlobalTableSchema` (name snake_case, columns min 1, 13 enum)
- Physical `dyn_*` creation + indexes searchable/orderable via `CREATE INDEX`
- List meta + counts, browse `dyn_*` dengan searching/options/orders, CRUD per-type input, operation realtime via `operationEngine`
- Delete cascade `DROP TABLE`

### 10.3 Persuratan — 4 Tahap (Wajib GUI)
- Component: richtext + bindings (text/image/component) + isLooping + preview
- Template: richtext + component usages + dataMapping (administrasi/tabel/manual) + loopConfig (table + selectedRowIds) + form preview + PDF preview
- Administrasi: fieldsJson + steps (template per step, order, additive)
- Hasil: pilih administrasi + lengkapi data (step1_field) + tambah steps + hapus + PDF

### 10.4 Generated App Quality Bar (Wajib — Bukan Prototype Jelek)
Setiap generated app minimal:
- [ ] Auth (jika multi-role) atau guest mode
- [ ] Dashboard dengan stats + recent + chart mini
- [ ] 2-4 CRUD entity dengan field realistis
- [ ] Search (global 320px + field 160px), sort, visibility, pagination (10/20/50/100)
- [ ] Form validation (Zod ketat), empty/loading/error states
- [ ] Detail view `.detail-view` pattern
- [ ] Responsive + sidebar
- [ ] Seed 5-10 rows realistis
- [ ] Role & permission default + guard
- [ ] Office Doc paper `#e8ecef` + shadow `[0_2px_16px_rgba(0,0,0,0.12)]` untuk builder surat

### 10.5 Library & Management
- List projects/tables/templates dengan status, preview, last update
- Detail: spec viewer, generation timeline, error logs, columns
- Actions: preview, delete, duplicate, export spec, browse data

### 10.6 RBAC Modules (Fondasi)
Dashboard, User/Role/Permission/Guard CRUD, Activity Logs, System Logs, Settings — menjadi fondasi untuk generated + Global Tables + Persuratan.

---

## 11. Business Rules

1. **Infer, don't ask** — prompt ambigu → pilih inferensi paling umum, maks 1 kalimat konfirmasi lalu generate
2. **Opinionated defaults** — jika tidak sebut warna/field/role, pilih terbaik
3. **Beautiful by default** — token #0075de / #f6f5f4 / #e6e6e6, radius 12/8/4, Inter, PageShell + DataTable kanonis, lucide-react
4. **Production-ready validation** — Zod ketat (string min/max, email, unique, required, enum, relation checks)
5. **RBAC auto-generate** — setiap entity baru dapat permission `GET/POST/PUT/DELETE /api/{slug}/{entity}/*`
6. **Iterasi non-destruktif** — refine tidak hapus data existing; Global Tables additive (`ADD COLUMN` only, never `DROP`)
7. **Seed idempotent** — seed hanya bila tabel kosong
8. **Slug unik & URL-safe** — lowercase hyphen, unique, snake_case untuk nama tabel/kolom (`^[a-z_][a-z0-9_]*$`)
9. **Global Tables additive** — tambah kolom via `ALTER TABLE ADD COLUMN`, jangan `DROP COLUMN` kecuali `DROP TABLE` saat hapus tabel
10. **Operation deterministic** — `evaluateOperation` concat `++`, literal `""`, arithmetic `* / + -` dengan `Function` sanitized `^[0-9+\-*/().\s]+$`, missing col → `0` atau `""`
11. **Search/order gate** — searching hanya kolom `isSearchable`, sorting hanya `isOrderable`, validasi di `GlobalTablesService.listData`
12. **Persuratan loop** — `isLooping` → pilih table + rows, render per row di template PDF

---

## 12. Constraints

- Database: SQLite via Prisma (`dev.db`, `DATABASE_URL="file:./dev.db"`, `prisma/schema.prisma` + `prisma7.config.ts`, adapter `@prisma/adapter-libsql`) — single file. Prisma Migrate `migrate dev` / `migrate deploy`; untuk non-destruktif cepat `prisma db push` boleh dipakai dev. Dynamic tables via `prisma.$executeRaw`.
- Monolith: Next.js 15 + React — frontend + API Routes satu package
- Auth JWT 24 jam, bcrypt, httpOnly cookie, middleware guard
- TypeScript strict, Zod single source of truth
- AI inference v1 rule-based + LLM stub (interface `AiInferenceProvider`)

---

## 13. Important Edge Cases

- Prompt kosong / 1 kata (`kasir`) → tetap infer sebagai `aplikasi kasir` lengkap
- Nama tabel/kolom tidak snake_case → 422 validasi Zod `^[a-z_][a-z0-9_]*$`
- Nama tabel duplikat → 400 "Nama tabel sudah ada"
- Nama kolom duplikat per tabel → 400 "Duplikat nama kolom"
- Kolom select tanpa options → 400 validasi
- Kolom select_table tanpa relationTable → 400
- Kolom hidden/readonly tanpa expression → 400
- Searching tanpa kolom searchable → searching non-aktif (no `WHERE`)
- Sorting kolom tidak orderable → fallback `id DESC`
- Operation missing column → `0` atau `""` (tidak throw)
- Operation expression sanitized — hanya `0-9 + - * / ( ) .` dieksekusi, lainnya fallback
- Persuratan component delete dipakai template → restrict (template masih reference)
- Generation gagal mid-way → `AiGeneration.status=failed`, simpan error, bisa retry
- Slug/table tabrakan → auto suffix `-2`, `-3` (untuk slug) atau reject untuk tabel (harus unique)

---

## 14. Product Principles

- **Minimal Input, Maximal Output** — user effort minimal, AI effort maksimal
- **Opinionated, not Generic** — berani memilih yang terbaik
- **Beautiful is Non-Negotiable** — UI jelek ditolak, seperti Notion: tenang, rapi, warm
- **Production, not Prototype** — langsung dipakai user akhir
- **Iterate Instantly** — refine sepelan `tambahkan X` langsung jadi
- **Additive & GUI-first** — tambah terus, tanpa JSON manual, tanpa drop
- **Auditability** — semua generation & mutasi tercatat di Activity Logs

---

## 15. Glossary

- **GlobalTable**: meta tabel dinamis yang generate physical `dyn_*`
- **GlobalColumn**: kolom dengan 13 tipe + optionsJson + flags
- **dyn_*:** physical table `dyn_pegawai` hasil `CREATE TABLE` runtime
- **OperationEngine**: evaluasi hidden/readonly `++` `""` `* / + -`
- **PersuratanComponent**: komponen surat richtext + bindings
- **PersuratanTemplate**: template surat dengan component usages + dataMapping + loop
- **PersuratanAdministration**: administrasi surat (fields + steps)
- **PersuratanData**: hasil isi surat (values + stepsData)
- **AiProject/Prompt/Generation/AppSchema**: builder container/spec
- **Inference**: menebak requirement dari prompt pendek
- **Guard/Permission**: aturan URL allow/deny + izin method+URL

---

## 16. Tujuan Aplikasi (Current — Global Tables & Persuratan Stabil)

Platform menyediakan:
1. **Builder Prompt Bar** — 1 baris → inference → generate
2. **Inference & Spec Preview** — mini-PRD + ERD + pages preview
3. **Generation Pipeline** — prompt → code (entities, DTOs, services, APIs, pages)
4. **Global Tables GUI** — `app/global-tables` (C.1-C.3) + `app/dyn/[table]` (search/options/order) → `dyn_*`
5. **Persuratan 4 Tahap** — Components (`app/components-persuratan`) → Templates (`app/templates-persuratan`) → Administrasi (`app/administrasi-persuratan`) → Hasil (`app/hasil-persuratan`) + PDF
6. **Office Doc Builder** — `app/generated/surat-platform/builder` (paper `#e8ecef` + shadow)
7. **Project Library** — kelola semua generated apps/tables/templates
8. **RBAC Foundation** — user/role/permission/guard sebagai fondasi auth

---

## 17. Daftar Fitur

### 17.1 Builder — Prompt → Generate
**Halaman utama builder** (`/builder` alias `/generated/surat-platform/builder`):

#### AiPromptBar
| Element | Spesifikasi (Next.js + shadcn/ui) |
|---------|-------------|
| Input | `<Input size="lg">` shadcn + `placeholder="Ketik ide aplikasi... mis. buatkan aplikasi kasir"` + prefix `<Sparkles size={16} />` |
| CTA | `<Button variant="default">` pill `Buat Aplikasi` (primary #0075de via `app/globals.css` HSL) + Enter to submit |
| Hint | Text kecil `Tekan Enter — AI akan langsung paham dan generate` |

#### Inference Preview (opsional, <2s)
- Card: Domain terdeteksi, 3-5 entities, 4-7 pages, 2-3 roles — badge pill
- Tombol `Generate Sekarang` atau auto-generate

#### Generation Progress
- Stepper: `Memahami intent` → `Merancang struktur` → `Membuat database` → `Merakit UI` → `Menyiapkan preview`
- Log streaming + progress bar

### 17.2 Global Tables — GUI 13 Tipe (app/global-tables)
- **Header:** Total Tabel (`dyn_*` count), 13 tipe info, fitur browse info
- **DataTable:** Tabel (name monospace, displayName, _columnCount, _rowCount, status) + Aksi Browse/Edit/Delete
- **Modal Create/Edit:** Konfigurasi Tabel (name `dyn_` preview, displayName, deskripsi, status) + Daftar Kolom (card per kolom dengan badge type, required, reorder, hapus) + per-type options (select options editor, relation table + displayFields multi-checkbox + valueField select, date format, number currency checkbox + preview Rp, operation expression textarea `++` + aritmatika preview)
- Validasi: snake_case, duplikat kolom, select butuh options, relation butuh table, operation butuh expression

### 17.3 Dyn Browse — Search/Options/Order (app/dyn/[table])
- **Controls Card:** Searching input (hanya searchable), Options checkboxes kolom tampil, Orders info (klik header ↕ hanya orderable) + `Sort: {col} {order}`
- **DataTable:** visibleColumns + formatValue per tipe (date format `m-d-Y`, currency `Rp`, image thumb, richtext strip, operation badge amber/hidden) + Aksi detail/edit/delete
- **Modal Create/Edit:** Loop columns render per tipe (Input, richtext toolbar + preview, date/datetime/time, image URL+file, select dropdown, select_multiple checkboxes, select_table modal relation dengan search/order/checkbox single/multiple, number + Rp live, hidden skip, readonly disabled + amber preview)
- **Detail Drawer:** `.detail-view` per kolom

### 17.4 Persuratan — Component (app/components-persuratan)
- DataTable: name, isLooping badge, bindings count, preview HTML, aksi detail/edit/delete
- Modal: Nama, Pengulangan checkbox, Richtext toolbar (Bold/Italic/Underline, H1/H2, Quote, Align, UL/OL, Table, Link, Image, Undo/Redo) + Klik kanan → popup nama data + type view (text/image/component + width/height + component select) → Insert placeholder `<span>`/`<img>`/`<div>` + bindings list + Preview card

### 17.5 Persuratan — Template (app/templates-persuratan)
- DataTable: name, components count, aksi
- Modal: Nama, deskripsi, Richtext + Klik kanan → Pilih Component (dropdown + badge looping) → mapping `dataMapping` per binding (source administrasi/tabel/manual + value) → loopConfig (table + selectedRowIds via fetch `dyn_*` + Pilih Semua) → Usages cards + Tombol Preview Form (list mapping) + Preview PDF (window.print)

### 17.6 Persuratan — Administrasi (app/administrasi-persuratan)
- DataTable: name, fields count, steps count, _dataCount + link ke Hasil, aksi
- Modal: Nama, deskripsi, Data Surat cards (nama data + type text/richtext → akan jadi `step1_nama`) + Tambah Field + Steps cards (template per step dropdown + order badge + hapus + Tambah Step)

### 17.7 Persuratan — Hasil (app/hasil-persuratan)
- Pilih Administrasi chips (`ClipboardList` + _dataCount) + detail fields & steps
- DataTable: name, values preview (`key:value` 2 keys), aksi detail/edit/delete
- Modal: Nama persuratan, Data Administrasi form per field (text Input / richtext Textarea key `step1_nama`), Steps cards (template dropdown + data JSON Textarea per step + Tambah Step)
- Preview PDF via `/api/persuratan/administrations/{id}/datas?preview=pdf`

### 17.8 Office Doc Builder (app/generated/surat-platform/builder)
- 3-panel: Components (kiri, palette basic/layout/data/dynamic/branding) → Document Editor tengah (paper #e8ecef bg, shadow `[0_2px_16px_rgba(0,0,0,0.12)]`, ruler, zoom, pageSize A4/Letter, Office Doc / Structure / Raw JSON tabs, editable paper height 520) → Properties kanan (edit props selected node)
- Palette: text, heading, paragraph, image, table, signature, divider, qrcode, barcode, date, repeater, condition, kop_surat
- Render: interpolate `{{office.name}}`, `{{employee.name}}`, Repeater loop `source:employees`, Condition `IF field equals value`, Header/Footer, Barcode/QR, Table

### 17.9 Table Browse Features (Kanonis — Berlaku untuk Semua Tabel)
Semua tabel wajib: Global Search 320px, Field-Specific 160px, Refresh, Error Slot, Pagination `Menampilkan {from}-{to} dari {total}`, Column Visibility, Sorting, Loading, Empty + CTA `+ Buat ...`.

### 17.10 Dashboard Platform
Widget: Total Projects, Generations Today, Total Entities, Recent Projects; Plus Global Tables count + Persuratan counts.

---

## 18. Alur Authorization

### Server-Side Enforcement
```
Request → JWT valid? → User → Roles → Permissions (method+URL)
  → Method cocok? (* atau exact) + URL match pattern (wildcard) → ALLOW else 403
```
Guard `allow/deny` dievaluasi client-side untuk menu visibility (`useAuthorization().canAccessUrl`).

### Global Tables & Dyn
- `POST /api/global-tables` → `CreateGlobalTableSchema` + cek safeIdent
- `GET /api/global-tables?search=&sortBy=` → `QueryGlobalTableSchema` + `GlobalTablesService.findAll` (COUNT + pagination)
- `GET /api/dyn/{table}?search=&sortBy=&sortOrder=` → `GlobalTablesService.listData` → `WHERE isSearchable LIKE` + `ORDER BY isOrderable`
- `POST /api/dyn/{table}` → `GlobalTablesService.createData` → validasi required + type + `computeOperationColumns` + `INSERT dyn_*`

### Builder-Specific
- `POST /api/builder/generate` → `requireAuth` + `requireApiAccess` (Builder:Generate)
- `GET /api/builder/projects` → list hanya milik user (atau semua jika admin)
- Generated entity APIs → permission auto `Generated:{Slug}:{Entity}:Read/Write`
- Persuratan APIs: `app/api/persuratan/components`, `templates`, `administrations`, `administrations/[id]/datas` — CRUD tanpa auth ketat di build saat ini (perlu ditambah guard produksi)

---

## 19. API Endpoints

> Detail DTO/query/response: `docs/architecture.md` § API Endpoints.

### Global Tables & Dyn (Baru Stabil)
| Method | Endpoint | Description | Auth | DTO |
|--------|----------|-------------|------|-----|
| GET | `/api/global-tables` | List meta tables (paginated, searchable) | Bearer* | `QueryGlobalTableSchema` → `{data,total,page,limit,totalPages,_columnCount,_rowCount}` |
| POST | `/api/global-tables` | Create meta + `CREATE TABLE dyn_*` + indexes | Bearer* | `CreateGlobalTableSchema` (13 tipe) → 201 |
| GET | `/api/global-tables/:id` | Detail meta + columns | Bearer* |  |
| PUT | `/api/global-tables/:id` | Update meta + `ADD COLUMN` additive | Bearer* | `UpdateGlobalTableSchema` |
| DELETE | `/api/global-tables/:id` | `DROP TABLE dyn_*` + delete meta | Bearer* |  |
| GET | `/api/dyn/:table` | List data dyn (paginated, search/options/order) | Bearer* | `?page&limit&search&sortBy&sortOrder&filters` → `{data,total,columns}` |
| POST | `/api/dyn/:table` | Create data (validasi required + operation compute + INSERT) | Bearer* | `Record<string,any>` |
| GET | `/api/dyn/:table/:id` | Detail data | Bearer* |  |
| PUT | `/api/dyn/:table/:id` | Update data (merge + recompute + UPDATE) | Bearer* |  |
| DELETE | `/api/dyn/:table/:id` | Delete data | Bearer* |  |

*Saat ini tanpa middleware ketat, perlu ditambah di produksi.

### Persuratan API (Stabil)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET/POST | `/api/persuratan/components` | List/create component | Bearer* |
| GET/PUT/DELETE | `/api/persuratan/components/:id` | Detail/update/delete | Bearer* |
| GET/POST | `/api/persuratan/templates` | List/create template | Bearer* |
| GET/PUT/DELETE | `/api/persuratan/templates/:id` | Detail/update/delete | Bearer* |
| GET/POST | `/api/persuratan/administrations` | List/create administrasi | Bearer* |
| GET/PUT/DELETE | `/api/persuratan/administrations/:id` | Detail + steps | Bearer* |
| GET/POST | `/api/persuratan/administrations/:id/datas` | List/create hasil persuratan | Bearer* |
| PUT/DELETE | `/api/persuratan/administrations/:id/datas/:dataId` | Update/delete hasil | Bearer* |

### AI Builder API (Baru)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/builder/generate` | Generate app dari prompt | Bearer |
| POST | `/api/builder/refine` | Refine existing project | Bearer |
| GET | `/api/builder/projects` | List projects (paginated) | Bearer |
| GET | `/api/builder/projects/:slug` | Detail project + spec | Bearer |
| DELETE | `/api/builder/projects/:slug` | Hapus project | Bearer |
| GET | `/api/builder/templates` | List starter templates | Public |

### Generated App API (Otomatis per App)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/generated/:slug/:entity` | List entity (paginated) | Bearer + Permission |
| GET/PUT/DELETE | `/api/generated/:slug/:entity/:id` | Detail/update/delete | Bearer + Permission |
| POST | `/api/generated/:slug/render` | Render HTML dari schema + data | Bearer |
| POST | `/api/generated/:slug/export-pdf` | Export PDF via puppeteer-core | Bearer |

Via `app/api/generated/[slug]/[entity]/route.ts` + `render/route.ts` + `export-pdf/route.ts`

### Auth & RBAC (Tetap)
`POST /api/auth/login`, `/api/auth/register`, `GET /api/auth/profile`, `GET/POST /api/users`, `GET/PUT/DELETE /api/users/:id`, serupa `/api/roles`, `/api/permissions`, `/api/guards` + `GET /api/activity-logs`, `/api/settings`, `/api/health`

---

## 20. Client Routes

### File-Based Routing (Next.js App Router — Real 2026-09-18)
| File | Route | Auth | Description |
|------|-------|------|-------------|
| `app/page.tsx` | `/` | Public | Redirect ke `/generated/surat-platform` atau dashboard |
| `app/global-tables/page.tsx` | `/global-tables` | Required | GUI Buat Tabel (C.1-C.3) + DataTable |
| `app/dyn/[table]/page.tsx` | `/dyn/:table` | Required | Browse `dyn_*` (search/options/order) + CRUD per-type |
| `app/dyn/page.tsx` (via `/dyn` link) | `/dyn` | Required | List kartu `dyn_*` (jika ada) |
| `app/components-persuratan/page.tsx` | `/components-persuratan` | Required | Component richtext + bindings |
| `app/templates-persuratan/page.tsx` | `/templates-persuratan` | Required | Template + component usages + loop |
| `app/administrasi-persuratan/page.tsx` | `/administrasi-persuratan` | Required | Administrasi fields + steps |
| `app/hasil-persuratan/page.tsx` | `/hasil-persuratan` | Required | Hasil pilih administrasi + isi data + PDF |
| `app/generated/surat-platform/builder/page.tsx` | `/generated/surat-platform/builder` (alias `/builder`) | Required | Office Doc Builder (paper #e8ecef) |
| `app/generated/surat-platform/preview/page.tsx` | `/preview` | Required | Preview surat |
| `app/generated/surat-platform/templates/page.tsx` | `/templates` | Required | Templates old |
| `app/generated/surat-platform/documents/page.tsx` | `/documents` | Required | Documents old |
| `app/(dashboard)/users/page.tsx` | `/users` | Required | User management |
| `app/(dashboard)/roles/page.tsx` | `/roles` | Required | Role management |
| `app/api/global-tables/route.ts` | `/api/global-tables` | Bearer | API meta |
| `app/api/dyn/[table]/route.ts` | `/api/dyn/:table` | Bearer | API dyn |

### Sidebar Menu Structure (Real `components/layout/AppLayout.tsx` 4 Grup)
```
Platform
  ├── Dashboard              → / (via rewrites → /generated/surat-platform)
  ├── Template Builder       → /builder
  └── Preview                → /preview
Global Tabel
  ├── Global Tables          → /global-tables
  └── Browse Data            → /dyn
Persuratan
  ├── Components             → /components-persuratan
  ├── Templates              → /templates-persuratan
  ├── Administrasi           → /administrasi-persuratan
  └── Hasil Surat            → /hasil-persuratan
Manajemen Lama
  ├── Templates (old)        → /templates
  ├── Documents (old)        → /documents
  ├── Data Sources           → /data-sources
  ├── Components (old)       → /components
  └── Employees              → /employees
```

Rewrites `next.config.ts`:
```ts
{ source: "/builder", destination: "/generated/surat-platform/builder" },
{ source: "/preview", destination: "/generated/surat-platform/preview" },
// ... templates, documents, employees, components, data-sources
```

---

## 21. Non-Functional Requirements

### Security
- Password bcrypt 10 rounds, JWT 24h
- Zod whitelist DTO, no extra props, `toSafeIdent` (`/[^a-zA-Z0-9_]/g`) untuk nama tabel/kolom sebelum `CREATE TABLE`
- `isSearchable`/`isOrderable` gate, `SELECT` only jika custom query
- Persuratan perlu ditambah permission guard produksi (saat ini terbuka)

### Performance
- Generation <30s untuk 3-4 entities
- List pagination 20 default, max 100
- SQLite single file, `CREATE INDEX` hanya untuk searchable/orderable
- `dyn_*` COUNT via `SELECT COUNT(*)`, data via `LIMIT ? OFFSET ?`

### UX
- **Responsive** mobile-first, canvas `#f6f5f4`, paper Office `#e8ecef` + shadow, hairline `#e6e6e6`
- Warm paper, satu aksen #0075de, CTA pill, input tight 4px
- Loading, empty, error, success di semua flow
- Builder: optimistic UI, progress streaming
- Global Tables: GUI tanpa JSON, realtime preview (currency Rp, operation amber, relation modal)
- Persuratan: klik kanan binding, preview html, form generated

---

## 22. Seed Data Summary

### RBAC Seed (sumber kebenaran `prisma/seed.ts`)
5 users (admin/editor/viewer/manager/guest, password `P455w0rd!!!`), 6 roles (Super Admin, Admin, Editor, Viewer, Manager, Guest), 10 permissions (User Read/Write, Role Read/Write, Permission Read, Guard Read, ActivityLog Read, etc.) + junctions `users_roles`, `roles_permissions`. Seed idempotent `upsert`/`findUnique` before create. Ditambah builder templates starter (jika ada) — `GET /api/builder/templates`.

**Catatan:** DB real 19 models → seed hanya RBAC (12 core) + Global/Persuratan kosong di awal. Dynamic `dyn_*` seed via GUI `POST /api/dyn/{table}` bulk.

---

## 23. Client-Side Authorization

`fetch` wrapper (`hooks/useApi.ts`) interceptor 401/403, `middleware.ts` guard (catatan: file `middleware.ts` tidak ada di `apps/web` saat backup — guard belum aktif, perlu dibuat jika butuh JWT gating), menu visibility via `useAuthorization.ts` (`hasRole`, `hasPermission`, `canAccessUrl`). Builder & Global Tables cek permission di service/API saat ini minimal.

---

## 24. AI Assistant Behaviour Contract (Wajib)

1. **Jangan banyak tanya balik.** Infer paling umum & bagus, maks 1 kalimat konfirmasi lalu generate
2. **Selalu hasilkan app lengkap + cantik.** Minimal: Auth (jika butuh) + Dashboard + 2-4 CRUD + search/sort/pagination + validasi + empty/loading/error + responsive + sidebar
3. **Design System kanonis wajib.** #0075de primary (HSL 210 100% 44%), canvas #f6f5f4, hairline #e6e6e6, radius 12/8/4, Inter, PageShell + DataTable kanonis, detail-view, lucide-react, Office Doc #e8ecef
4. **Opinionated & production-ready.** Pilih field & relasi masuk akal, seed contoh, permission default, validasi Zod ketat
5. **Iterasi via prompt pendek.** Dukung `tambahkan fitur X`, `ganti ...`, `perbaiki ...` tanpa rebuild
6. **Jelaskan singkat setelah generate.** Ringkasan: apa yang jadi, route apa, cara pakai, saran refine 1-2 baris

Contoh ideal:
> User: `buatkan aplikasi kasir`
> AI: `Siap — aku bikinin aplikasi Kasir POS lengkap ya. Ada Produk, Transaksi, Pelanggan, Laporan, Dashboard. Sudah jadi di /generated/pos-kasir — bisa langsung dipakai. Mau tambah barcode scanner atau struk PDF?`
> User: `buatkan tabel pegawai`
> AI: `Siap — aku bikinin tabel pegawai dengan kolom nama, nip, jabatan, departemen, gaji (IDR), total otomatis. Sudah di /dyn/pegawai — bisa isi data langsung. Mau tambah persuratan?`

---

## Change Log

### 2026-09-18 — Knowledge Backup apps/web (Global Tables 13 tipe + Persuratan stabil)
- **Discovery real:** `prisma/schema.prisma` 19 models (real) vs spec task 25 — catat konflik. `lib/prisma.ts` singleton adapter-libsql, `DATABASE_URL="file:./dev.db"` (`prisma7.config.ts` + `.env`). `lib/services/global-tables.service.ts` 451 baris (13 tipe, dyn_* via `CREATE TABLE "dyn_*"`, `mapColumnTypeToSql`, `buildOptionsJson`, `findAll` + `_columnCount`/`_rowCount`, `create`/`update` additive `ADD COLUMN`, `listData` search isSearchable/order isOrderable, `createData`/`updateData` via `computeOperationColumns`), `lib/renderer/operationEngine.ts` 161 baris (`evaluateOperation` `++` concat, `""` literal, `* / + -` via `Function` sanitized, `getDependentColumns`, `computeOperationColumns`), `lib/services/persuratan/*` (components/templates/administrations services), `app/global-tables/page.tsx` 412 baris (GUI C.1-C.3.7, 13 tipe cards, relation multi-checkbox, currency preview, operation textarea), `app/dyn/[table]/page.tsx` 520 baris (search/options/order, `formatValue` date m-d-Y/H:i:s, currency IDR, visibleCols, per-type modal + relation modal search/order/checkbox, number realtime Rp, readonly amber, hidden skip, operation recompute via `getDependentColumns`), `app/components-persuratan/page.tsx` 259 baris (richtext + klik kanan binding text/image/component + preview), `app/templates-persuratan/page.tsx` 328 baris (component insert + dataMapping source administrasi/tabel/manual + loop table/rows Pilih Semua), `app/administrasi-persuratan/page.tsx` 175 baris (fields text/richtext prefix step1_ + steps pilih template), `app/hasil-persuratan/page.tsx` 238 baris (pilih administrasi chips + isi data step1_field + steps tambah terus + PDF preview), `app/generated/surat-platform/builder/page.tsx` Office Doc (paper bg `#e8ecef` shadow `[0_2px_16px_rgba(0,0,0,0.12)]`, ruler, zoom 60-140%, toolbar Bold/Italic/Align, header/footer, repeater condition, barcode), `components/layout/AppLayout.tsx` 178 baris (4 grup sidebar, aliasToCanonical rewrites, isActive, responsive mobile), `app/globals.css` tokens `#0075de` HSL 210 100% 44%, `#f6f5f4`, `#e6e6e6`, Inter, `detail-view`, `next.config.ts` 33 baris rewrites `/builder` etc. **Update docs:** PRD §8-9/17-20 ditambah Global Tables 13 tipe + Persuratan 4 tahap workflows, architecture ditambah dyn_* & persuratan, database 19 models + dyn_* + operationEngine, design-system + Office Doc paper, core-concept meta vs dynamic, production-runbook SQLite, README index, AGENTS.md adaptasi.

### Stack Migration — Next.js + React (2026-09-15)
- MIGRASI dari Nuxt 4 + Vue + Nitro → Next.js 15 + React 19 + Zustand + TanStack Query + shadcn/ui + lucide-react + Framer Motion.

### AI App Builder — Platform Pivot (2026-09-15)
- PIVOT dari LBS RBAC-Only ke AI App Builder Platform (`Minimal Prompt → Maximal App`).

### Docs Tidy — Adopsi Notion Design (2026-09-13)
- §14 + §21 UX: paper-calm (warm canvas, satu aksen #0075de, CTA pill).
