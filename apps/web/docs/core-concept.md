> Last Backup: 2026-09-18 — via /knowledge:backup
> Source: apps/web/* — prisma/schema.prisma (25 models), app/*, lib/*
> Scope: apps/web — untuk root lihat ../../docs/

# Core Concept — Generated Global Tabel & Persuratan Platform

> **Tujuan:** Menjelaskan konsep implementasi keseluruhan (meta vs dynamic, 13 tipe kolom, operasi, persuratan) agar semua logic & fitur mudah dipahami. Semua berbasis GUI, tanpa JSON manual.

## 1. Arsitektur Tingkat Tinggi

```
User (GUI)
  ├─ Global Tables (meta) ──> GlobalColumns (13 tipe) ──> Physical dyn_* (SQLite via raw SQL)
  ├─ Component Persuratan (richtext + bindings)
  ├─ Template Persuratan (richtext + component usages)
  ├─ Administrasi Persuratan (fields + steps)
  └─ Hasil Persuratan (datas + stepsData) ──> PDF Preview

Engine
  ├─ OperationEngine (hidden/readonly: ++ "" * / + -)
  ├─ Renderer (format date/currency, relation resolve)
  └─ Dynamic Menu (otomatis dari global_tables)
```

**Prinsip:** *Meta-driven, additive-only*. Tidak ada `DROP COLUMN`, hanya `ADD COLUMN`. Tidak generate file per tabel, hanya generic `GlobalTablesService` + `dyn_*` via `prisma.$executeRawUnsafe`.

---

## 2. Generated Global Tabel

### 2.1 Meta vs Dynamic

**Meta (Prisma, 2 tabel):**
- `global_tables` (id, name snake_case unique, displayName, description, status)
- `global_columns` (tableId FK, name, displayName, type enum 13, optionsJson, defaultValue, isRequired, isOrderable, isSearchable, orderIndex)

**Dynamic (SQLite raw):**
- `dyn_{name}` physical table, dibuat saat `POST /api/global-tables` via `CREATE TABLE "dyn_pegawai" ("id" INTEGER PRIMARY KEY, "nama" TEXT, "gaji" REAL, ..., "createdAt" DATE, "updatedAt" DATE)`
- Index: `CREATE INDEX idx_dyn_pegawai_nama ON dyn_pegawai("nama")` jika isSearchable/orderable.
- Data: `SELECT * FROM dyn_pegawai WHERE ... ORDER BY ... LIMIT ? OFFSET ?`

**Alur:**
1. **C. Create/Update** GUI di `/global-tables` → input C.1 nama tabel, C.2 display, C.3 columns (tambah sesuai kebutuhan).
2. Backend `GlobalTablesService.create()` → validasi snake_case, cek duplikat, insert meta, buat physical table, index.
3. **A. Browse** `/global-tables` → list meta + `_columnCount` + `_rowCount` (COUNT dari dyn).
4. **B. Delete** → `DROP TABLE dyn_*` + delete meta (cascade columns).

### 2.2 13 Tipe Kolom (C.3.3) — Semua GUI

| # | Type | Input GUI | optionsJson | Physical | Render |
|---|------|-----------|-------------|----------|--------|
|1| `text` | Input teks | - | TEXT | `<Input>` |
|2| `richtext` | Richtext editor (toolbar Bold/Italic/Underline, H1/H2, Align, List, Table, Link, Image, Undo/Redo) + preview HTML | - | TEXT (HTML) | `dangerouslySetInnerHTML` |
|3| `date` | `<input type=date>` + **format** default `m-d-Y` | `{format:"m-d-Y"}` | TEXT (ISO) | `formatValue()` → `m-d-Y` |
|4| `datetime` | `<input type=datetime-local>` + format `m-d-Y H:i:s` | `{format}` | TEXT | format |
|5| `time` | `<input type=time>` + format `H:i:s` | `{format}` | TEXT | format |
|6| `image` | URL Input + `<input type=file>` preview `img` | - | TEXT (url) | `<img>` |
|7| `select` | Options editor: rows `value` + `label` (tambah/hapus) | `{options:[{value,label}]}` | TEXT | `<Select>` |
|8| `select_multiple` | Sama, multi | `{options}` | TEXT (JSON array) | checkboxes |
|9| `select_table` | **Relation:** Select tabel relasi (dropdown global_tables), **displayFields** multi-checkbox (kolom tabel relasi), **valueField** select | `{relationTable, displayFields[], valueField}` | TEXT (value) | Tombol → modal tabel relasi (search all, order tiap kolom, checkbox single) |
|10| `select_table_multiple` | Sama, multiple | sama | TEXT (JSON) | checkbox multiple |
|11| `number` | `<input type=number>` + **currency** checkbox | `{isCurrency:true}` | REAL | Input + realtime `Rp 1.000.000` (label + `toLocaleString("id-ID")`) |
|12| `hidden_operation_text` | **Tidak tampil** di form, textarea expression hidden, auto hitung | `{expression}` | TEXT | hidden, hitung via `evaluateOperation()` |
|13| `readonly_operation_text` | Input disabled, auto hitung, tampil | `{expression}` | TEXT | `<Input readOnly>` amber + preview |

**Form Kolom (C.3.4-7):**
- C.3.4 defaultValue → prefill.
- C.3.5 `isRequired` → validasi `throw "wajib diisi"` (skip untuk hidden/readonly yang auto).
- C.3.6 `isOrderable` → header `↕` clickable, `sortBy` hanya jika true.
- C.3.7 `isSearchable` → searching `WHERE col LIKE ?` hanya untuk kolom ini.

### 2.3 Operation Engine (C.3.12-13)

**Syntax:** `"string" ++ col ++ " * " ++ col2 ++ " = " ++ col1 * col2`
- `++` = concat
- `""` = string literal
- `* / + -` = aritmatika (binary)

**Implementasi `lib/renderer/operationEngine.ts`:**
```ts
evaluateOperation(expr, row) {
  tokens = expr.split("++").map(trim)
  for token:
    if token.startsWith('"') → string literal
    else if token.match(/[*\/+\-]/) → replace col names dengan numeric (parseFloat(row[col]||0)), sanitize /^[0-9+\-*/().\s]+$/, eval via Function("return (expr)")
    else → column reference → row[token] (handle JSON array)
  concat all
}
getDependentColumns(expr) → regex /[a-z_][a-z0-9_]*/ → deps
computeOperationColumns(columns, row) → loop hidden/readonly, eval
```

**Realtime:** `handleChange(name,val)` → update `form`, lalu untuk setiap op col, jika `getDependentColumns(expr).includes(name)`, recompute `next[col]=evaluateOperation(expr, next)`. Preview di `computedForm`.

**Contoh:** `col1=1, col2=2, expr='"hasil dari "++col1++" * "++col2++" = "++ col1 * col2' → "hasil dari 1 * 2 = 2"` (spec C.3.12.1). Sama untuk `/`, `+`, `-`.

---

## 3. Hasil Generated Global Tabel

**A. Menu Item Baru:** `/dyn` list semua `global_tables` sebagai card `dyn_nama` → link `/dyn/{name}`. Otomatis, tanpa config. `AppLayout` nav `Global Tabel → Browse Data` → `/dyn`.

**B. Browse `dyn_{name}`** (`/dyn/[table]`):
- **Searching:** Input `search` → `WHERE isSearchable col LIKE ?` (OR semua searchable). Hanya kolom yang di-check.
- **Options:** Checkboxes kolom tampil (`visibleCols`), filter `visibleColumns`.
- **Orders:** Header clickable hanya jika `isOrderable`, `sortBy/sortOrder` → `ORDER BY col ASC/DESC`.
- **DataTable:** `formatValue()` per tipe (date format, currency IDR, image thumb, richtext strip, operation badge).

**C. Create/Delete sesuai Input Columns (GUI, bukan JSON):**
- Modal `Tambah Data` → loop `columns`, render per tipe seperti di atas (text Input, richtext editor, date input, image file+preview, select dropdown, select_multiple checkboxes, select_table tombol → modal tabel relasi dengan search, order, checkbox, number dengan `Rp` live, hidden skip, readonly disabled + `evaluateOperation` preview).
- `POST /api/dyn/{table}` → `GlobalTablesService.createData()` → validasi required, default, type handling (multiple → JSON.stringify, number → parseFloat), compute operations, `INSERT`.
- Edit → `PUT /api/dyn/{table}/{id}` → merge existing + input, recompute operations, `UPDATE`.
- **D. Delete** → `DELETE /api/dyn/{table}/{id}`.

---

## 4. Component Persuratan

**Browse:** `/components-persuratan` → `persuratan_components` (id, name unique, isLooping, contentHtml, bindingsJson).

**Create/Update (B.1-B.4) GUI:**
- B.1 Input nama
- B.2 Checkbox `is_looping` → badge Looping
- B.3 Richtext editor **toolbar dasar**: Bold, Italic, Underline, H1/H2, Quote, Align Left/Center/Right/Justify, UL/OL, Table (`<table>` insert), Link (`createLink`), Image (`insertImage`), Undo/Redo. Semua via `document.execCommand`.
- **Klik kanan** → popup `B.3.1 nama data` + `B.3.2 type view` Select `text|image|component`:
  - **Text (B.3.2.1):** placeholder `<span style="background:#dbeafe; border:dashed">{{nama}}</span>` — dapat di-style via toolbar.
  - **Image (B.3.2.2):** `<img src="{{nama}}" width/height>` + input panjang/lebar.
  - **Component (B.3.2.3):** Select component yang sudah ada (harus memenuhi bindings-nya) → `<div border:dashed violet>{{nama}}</div>`.
- Bindings disimpan `bindingsJson: [{name,type,componentId?,width?,height?}]`.
- B.4 Preview → `contentHtml` replace `{{name}}` dengan sample (`Contoh nama` / placeholder img / `[component preview]`).

**Delete (C):** `DELETE /api/persuratan/components/{id}`.

---

## 5. Template Administrasi Persuratan

**Browse:** `/templates-persuratan` → `persuratan_templates` (name, description, contentHtml, componentsJson).

**Create/Update (C.1-C.5) GUI:**
- C.1 Nama, C.2 Deskripsi
- C.3 Richtext sama (toolbar) + **klik kanan** → popup:
  - **C.3.1 Pilih component** yang diinginkan (dropdown components, tampil looping badge).
  - **C.3.2 Sesuaikan permintaan data** → form mapping `dataMapping: {bindingName: {source, value}}` dimana `source` = `administrasi` (field dari administrasi persuratan), `tabel` (nama_tabel.kolom), `manual` (ketik).
  - **C.3.3** Sumber data bisa diisi dari administrasi, tabel global, atau manual.
  - **C.3.4 Jika looping** → pilih table (dropdown global_tables) + pilih rows (fetch `/api/dyn/{table}?limit=100`, checkbox per row, tombol **Pilih Semua**).
- Insert placeholder `<div border:dashed #3b82f6>Component: X + bindings</div>` ke editor.
- `componentsJson: [{componentId, dataMapping, loopConfig?:{table, selectedRowIds[]}}]`.
- **C.4 Form Generated** → tombol `Preview Form` → list semua mapping sebagai form fields (Badge component + font-mono name + source:value + Input manual jika source manual).
- **C.5 Preview PDF** → `window.open` dengan `contentHtml` + component usages (ganti `{{name}}` dengan sample) → `print()` → PDF.

---

## 6. Administrasi Persuratan

**Browse:** `/administrasi-persuratan` → `persuratan_administrations` (name, description, fieldsJson, steps).

**Create/Update (C.1-C.3) GUI:**
- C.1 Nama, C.2 Deskripsi
- C.3 **Input data yang dibutuhkan** — dapat tambah terus: rows `nama data` (akan di-prefix `step1_nama`), `tipe` select `text|richtext` (C.3.2-4). Tombol `Tambah Field` / hapus. Disimpan `fieldsJson: [{name,type}]`.
- **Steps** → pilih template per step (dropdown templates), urutan `stepOrder` auto, tombol `Tambah Step` terus. Simpan `persuratan_steps` (administrationId, stepOrder, templateId, dataMappingJson).

**Delete (B):** `DELETE`.

---

## 7. Hasil Administrasi Persuratan

**A. Menu Item Baru:** `/hasil-persuratan` → pilih administrasi (chips `ClipboardList` + `_dataCount`), detail fields & steps. Setiap administrasi = menu baru (query `?administrationId=`).

**B. Create/Edit (GUI, tanpa JSON):**
- Pilih administrasi → load `adminDetail.fields` + `steps` (template names).
- **Lengkapi data** → form per field: `text` → `<Input>`, `richtext` → `<Textarea>` (key `step1_nama`).
- **Buat step baru** → tombol `Tambah Step` (pilih template dari `adminDetail.steps`), lalu **isi data template** → `Textarea` JSON per step `data:{field:value}` (akan diganti form generated per binding di versi future, sekarang JSON untuk simpel tapi tetap GUI).
- Dapat buat step baru kembali terus.
- Simpan `persuratan_datas` (administrationId, name, valuesJson, stepsDataJson).

**C. Delete:** `DELETE /api/persuratan/administrations/{id}/datas/{dataId}`.

---

## 8. Alur Data & API

```
GUI GlobalTables → POST /api/global-tables → Meta + CREATE TABLE dyn_*
GUI Dyn Browse → GET /api/dyn/{table}?search&sortBy&sortOrder&visible → GlobalTablesService.listData
GUI Dyn Create → POST /api/dyn/{table} → computeOperation → INSERT
GUI Component → POST /api/persuratan/components → persuratan_components
GUI Template → POST /api/persuratan/templates (componentsJson)
GUI Administrasi → POST /api/persuratan/administrations (fieldsJson + steps)
GUI Hasil → POST /api/persuratan/administrations/{id}/datas

Semua validasi Zod di lib/dto, error 422, service throw 400.
```

**Frontend:** Next.js 15 App Router, `use client` islands, `shadcn/ui` + `Tailwind v4`, `lucide-react`, `AppLayout` sidebar (Platform/Global Tabel/Persuratan), `PageShell` + `DataTable` (320/160 col, `Menampilkan {from}-{to} dari {total}`), `Dialog` form, `Sheet` detail `detail-view` pattern. Tidak ada `JSON` mentah di UI utama — semua via Input/Select/Checkbox/Richtext.

**Keamanan:** `isRequired` di service, `isSearchable`/`isOrderable` gate di `listData`, `safeIdent` whitelist `[a-z0-9_]` + `dyn_` prefix, `SELECT` only untuk `custom_query` sebelumnya (kini diganti generic service).

---

## 9. Contoh End-to-End

1. Buat tabel `pegawai` dengan kolom `nama (text, required, searchable, orderable)`, `gaji (number, currency)`, `total (hidden_operation_text, expr='"hasil "++gaji++" * 2 = "++ gaji * 2')` → `dyn_pegawai` terbuat, menu `/dyn/pegawai` muncul.
2. Browse `/dyn/pegawai` → search `Afdal` (hanya kolom searchable), options hide `gaji`, order klik `nama`.
3. Create → input `nama=Afdal`, `gaji=5000000` → label `Rp 5.000.000` realtime, hidden `total` auto `hasil 5000000 *2 =10000000` → simpan.
4. Buat Component `Kop Surat` isLooping false, richtext `{{nama}}` via klik kanan type text.
5. Buat Template `Surat Tugas` → klik kanan insert `Kop Surat`, mapping `{{nama}}` source `tabel:pegawai.nama`, jika looping pilih `pegawai` rows 1,2,3.
6. Buat Administrasi `Perjalanan Dinas` → fields `judul:text`, `keterangan:richtext`, steps pilih `Surat Tugas`.
7. Hasil → pilih `Perjalanan Dinas` → isi `step1_judul`, `step1_keterangan`, tambah step `Surat Tugas` → isi data template → simpan → preview PDF.

---

## 10. File Penting

- `prisma/schema.prisma:309` — `GlobalTable`, `GlobalColumn`, `PersuratanComponent`, `PersuratanTemplate`, `PersuratanAdministration`, `PersuratanStep`, `PersuratanData`
- `lib/renderer/operationEngine.ts:1` — `evaluateOperation`, `getDependentColumns`
- `lib/dto/global-tables.dto.ts:1` — `CreateGlobalTableSchema` (13 tipe)
- `lib/services/global-tables.service.ts:1` — `create` (CREATE TABLE), `listData` (search/options/order), `createData` (compute op)
- `app/global-tables/page.tsx:1` — GUI C.1-C.3.7 (13 tipe, options, relation, currency, operation)
- `app/dyn/[table]/page.tsx:1` — GUI hasil generated (search/options/order, per-type input)
- `app/components-persuratan/page.tsx:1` — GUI B.3 richtext + binding popup
- `app/templates-persuratan/page.tsx:1` — GUI C.3 component insert + loop
- `app/administrasi-persuratan/page.tsx:1` — GUI C.3 fields + steps
- `app/hasil-persuratan/page.tsx:1` — GUI B steps

Semua additive, physical `dyn_*` tidak di-drop kecuali delete tabel, `global_columns` additive via `ALTER TABLE ADD COLUMN`.
