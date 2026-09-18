> **Last Backup:** 2026-09-18 — via `/knowledge:backup`
> **Source:** `apps/web/*` — `prisma/schema.prisma` + `lib/services/*` + `docs/ai-builder/*`
> **Scope:** `apps/web` — untuk root lihat `../../docs/`

# Database — Panduan Umum AI App Builder

## 1. Filosofi

Database AI App Builder **bukan daftar tabel**, tapi **cara membuat database yang benar untuk semua project**. Prinsip: *Database untuk data yang butuh query, file untuk data yang butuh versi.*

- **DB (SQLite via Prisma)**: data yang butuh `WHERE`, `ORDER BY`, `JOIN`, `INDEX`, transaksi — RBAC, Global Tables, Persuratan, `dyn_*`, `activity_logs`, `settings`.
- **File (`docs/ai-builder/`)**: data builder META yang dulu di `ai_*` tables — sekarang `projects/<slug>.json`, `projects/<slug>.spec.json`, `templates/starter.json`. Bisa `git diff`, tidak perlu migrasi, ringan.
- **Dynamic (`dyn_*`)**: tabel bisnis yang dibuat runtime per project via `prisma.$executeRawUnsafe`, bukan via migrasi — tetap di DB karena butuh query.

> **Perubahan 2026-09-18:** Semua tabel `ai_*` (`ai_projects`, `ai_prompts`, `ai_generations`, `ai_app_schemas`, `ai_data_models`, `ai_pages`, `ai_component_specs`, `ai_deployments`) **dihapus** dari SQLite dan diganti file di `docs/ai-builder/` (lihat `docs/ai-builder/README.md`). Tidak ada lagi tabel `ai_*` di `dev.db`.

## 2. Cara Database Dibuat

### 2.1 Pilih Engine & ORM

- **SQLite + Prisma + @prisma/adapter-libsql** — single file `apps/web/dev.db`, `DATABASE_URL="file:./dev.db"` di `.env`, config `prisma7.config.ts`.
- **Kenapa SQLite**: zero-ops, backup cukup copy file, cukup untuk 10k-100k rows per project, tidak perlu server.
- **Kapan ganti**: jika butuh concurrent write tinggi atau data >1GB → ganti ke Postgres (cukup ganti `provider = "postgresql"` + URL, Prisma query tetap sama).

### 2.2 Buat Model Prisma (untuk data yang butuh query)

1. Tentukan **apakah butuh query?** Jika ya → buat `model` di `prisma/schema.prisma`. Jika tidak (mis. spec snapshot, prompt history) → simpan file JSON di `docs/`.
2. Tulis model minimal:
```prisma
model GlobalTable {
  id        Int      @id @default(autoincrement())
  name      String   @unique // snake_case, validasi regex
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  columns   GlobalColumn[]
  @@map("global_tables")
}
```
3. `npx prisma generate` → client di `app/generated/prisma`.
4. `npx prisma migrate dev --name add_global_tables` → buat `prisma/migrations/*` + update `dev.db`. **Jangan edit migrasi yang sudah apply** (BR-001). Untuk hapus tabel `ai_*` → buat migrasi baru yang `DROP TABLE` (sudah dilakukan 2026-09-18).

### 2.3 Buat Tabel Dynamic (untuk bisnis per project)

Untuk tabel yang dibuat user via GUI (Global Tables → `dyn_*`):

```ts
// lib/services/global-tables.service.ts
const cols = columns.map(c => `"${c.name}" ${mapType(c.type)}`).join(", ")
await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "dyn_${name}" ("id" INTEGER PRIMARY KEY, ${cols}, "createdAt" DATETIME, "updatedAt" DATETIME)`)
for (const c of columns.filter(c => c.isSearchable || c.isOrderable))
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_dyn_${name}_${c.name}" ON "dyn_${name}"("${c.name}")`)
```

- **Hanya `CREATE`/`ADD COLUMN`**, tidak pernah `DROP COLUMN` (additive).
- **Hapus project** → `DROP TABLE IF EXISTS "dyn_${name}"`.

### 2.4 File Storage (pengganti ai_*)

Untuk spec builder:
```ts
// lib/services/ai-builder/file-store.ts
const BASE = path.join(process.cwd(), "docs", "ai-builder", "projects")
fs.writeFileSync(`${BASE}/${slug}.json`, JSON.stringify(project, null, 2))
fs.writeFileSync(`${BASE}/${slug}.spec.json`, JSON.stringify(spec, null, 2))
```

- Baca: `fs.readFileSync`, tulis: `fs.writeFileSync`, list: `fs.readdirSync`.
- Tidak perlu index, tidak perlu transaksi, cukup `JSON.parse`.

## 3. Penerapan Bagus untuk Semua Project

### 3.1 Penamaan

- **Tabel**: `snake_case` plural untuk meta (`global_tables`), `dyn_` prefix untuk dynamic (`dyn_pegawai`), `users`/`roles` untuk RBAC. Unik: `name` di `global_tables` unique, collision → validasi `throw "Nama tabel sudah ada"`.
- **Kolom**: `snake_case`, regex `^[a-z_][a-z0-9_]*$`, unique per tabel (`@@unique([tableId, name])`).
- **Slug/ID**: `^[a-z0-9]+(-[a-z0-9]+)*$` untuk slug, auto suffix `-2` jika duplikat.

### 3.2 Index & Query

- **Index hanya jika perlu**: `isSearchable`/`isOrderable` → `CREATE INDEX`. Jangan index semua kolom (boros).
- **Search**: `WHERE col LIKE ?` dengan `OR` untuk multi-kolom searchable, param `"%${search}%"` (hindari string concat rawan SQL injection, pakai `?`).
- **Order**: whitelist `sortBy` (`id, name, createdAt`), fallback `id`, `ASC/DESC` saja.
- **Pagination**: `page 1, limit 20 (max 100), offset (page-1)*limit`, response `{data, total, page, limit, totalPages}`.

### 3.3 Validasi & Keamanan

- **Zod di DTO**: `lib/dto/global-tables.dto.ts` → `CreateGlobalTableSchema.parse(body)` sebelum `INSERT`. Jangan percaya `req.json()` mentah.
- **SafeIdent**: `name.replace(/[^a-z0-9_]/g,"")` untuk nama tabel/kolom sebelum interpolasi SQL → cegah injection `"; DROP TABLE"`.
- **Hanya SELECT untuk custom_query**: `if (!sql.trim().toLowerCase().startsWith("select")) throw`.
- **Required**: cek `isRequired` di service, bukan di DB `NOT NULL` (biar `ALTER TABLE ADD COLUMN` tidak gagal untuk data lama).

### 3.4 Migrasi & Backup

- **Platform (meta)**: Prisma Migrate — `migrate dev` (dev), `migrate deploy` (prod), `generate` setelah ubah schema. Reset: `rm dev.db && rm -rf prisma/migrations && npx prisma migrate dev --name init` + `npx prisma db seed`.
- **Dynamic & File**: tidak pakai migrasi file — DDL via `$executeRaw`, file via `fs`.
- **Backup**: cukup copy `dev.db` + `docs/ai-builder/` (single file + folder). Restore: copy balik, `npx prisma generate`.
- **Seed**: idempotent `SELECT COUNT(*)`, jika `0` baru `INSERT` contoh realistis (bukan `test1`), jangan seed tiap boot.

### 3.5 Kapan Pakai DB vs File

| Butuh | Pakai |
|-------|-------|
| Query, filter, sort, paginasi, relasi, transaksi | **DB** (`global_tables`, `persuratan_*`, `dyn_*`, `users`) |
| Snapshot, history, spec, template starter, perlu `git diff` | **File** (`docs/ai-builder/projects/*.json`) |
| Data bisnis yang dibuat user via GUI | **DB dynamic** (`dyn_*`) |
| Data builder yang jarang query | **File** (dulu `ai_*`, sekarang file) |

### 3.6 Contoh Alur Lengkap

1. User buat tabel `pegawai` via `app/global-tables` → `POST /api/global-tables` → validasi Zod → `INSERT global_tables` + `global_columns` + `CREATE TABLE dyn_pegawai` + index.
2. User isi data `POST /api/dyn/pegawai` → validasi required/type → `computeOperationColumns` (hidden/readonly) → `INSERT dyn_pegawai`.
3. Builder buat project `pos-kasir` → `POST` (dulu `ai_projects`, sekarang `fs.writeFile docs/ai-builder/projects/pos-kasir.json`) → `spec.json` → tidak ada tabel `ai_*`.
4. Semua tetap bisa `SELECT * FROM dyn_pegawai WHERE department = 'TI' ORDER BY nama ASC LIMIT 20` via `GlobalTablesService.listData`.

## 4. Aturan Emas

1. **DB untuk query, file untuk versi** — jangan paksa semua ke DB.
2. **Additive only** — `ADD COLUMN` / `CREATE TABLE` ya, `DROP COLUMN` tidak (kecuali `DROP TABLE` saat hapus tabel).
3. **Whitelist** — `sortBy`, `tableName`, `columnName` selalu whitelist, jangan interpolasi langsung.
4. **Validasi di Zod, bukan di DB** — biar error ramah `422`, bukan `SQLITE_ERROR`.
5. **Index seperlunya** — searchable/orderable saja, tidak semua.
6. **Transparan** — `dyn_*` bisa dilihat `npx prisma studio` atau `sqlite3 dev.db "SELECT * FROM dyn_pegawai"`, file bisa `cat docs/ai-builder/projects/pos-kasir.json`.

## 5. Checklist Project Baru

- [ ] Butuh query? → buat `model` di `schema.prisma` + `migrate dev` + `generate`
- [ ] Tidak butuh query? → buat file di `docs/<domain>/*.json` + helper `fs`
- [ ] Butuh tabel dinamis user? → pakai pattern `dyn_*` + `GlobalTablesService` + `operationEngine`
- [ ] Sudah tambah `isSearchable`/`isOrderable` → buat index?
- [ ] Sudah tulis `lib/dto/*.dto.ts` Zod?
- [ ] Sudah cek `toSafeIdent` dan `?` param?

---

> File ini **bukan daftar tabel** — itu ada di `prisma/schema.prisma` dan `sqlite_master`. File ini adalah **panduan cara membuat database yang benar** untuk semua project di `apps/web`.
