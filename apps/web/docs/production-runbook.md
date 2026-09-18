> Last Backup: 2026-09-18 — via /knowledge:backup
> Source: apps/web/* — prisma/schema.prisma (25 models), app/*, lib/*
> Scope: apps/web — untuk root lihat ../../docs/

# Production Runbook — AI App Builder Platform (Next.js) + Global Tables & Persuratan

Single-node SQLite (`apps/web/dev.db`) deployment. Multi-node/HA out of scope.

## 1. Production boot & baseline migration

```bash
# from apps/web (All commands run from . — bukan apps/web)
NODE_ENV=production JWT_SECRET=<strong-secret> DATABASE_URL="file:./dev.db" npm run build && npm run start
# Next.js: next build → next start (bukan nuxt preview)
# Atau standalone: npm run build && NODE_ENV=production node .next/standalone/server.js
```

- **DB real 19 models** (`prisma/schema.prisma` 308, 19 models real vs spec 25 — RBAC 12 + Global 2 + Persuratan 5 + ActivityLog/Setting) + `prisma/migrations/20260918005609_init/migration.sql` (CREATE TABLE users ... global_tables, global_columns, persuratan_* etc.). `prisma7.config.ts` `DATABASE_URL="file:./dev.db"` (`.env`).
- **Dynamic `dyn_*` + Office Doc** — **not** covered by baseline migrasi. Dibuat runtime via `prisma.$executeRawUnsafe('CREATE TABLE "dyn_pegawai" ...')` di `lib/services/global-tables.service.ts` 451 (additive `ADD COLUMN` only, never `DROP`, `DROP TABLE` hanya saat delete GlobalTable). `lib/renderer/operationEngine.ts` `++` `""` `* / + -` untuk hidden/readonly.
- **File store builder** (`docs/ai-builder/projects/*.json`) — `ai_*` legacy sudah tidak di DB, backup cukup `cp dev.db + cp -r docs/ai-builder`.
- **Seed:** `prisma/seed.ts` idempotent 5 users (admin `P455w0rd!!!` bcrypt10) + 6 roles + 10 permissions + junctions (`upsert`/`findUnique`). `dyn_*` seed via GUI `POST /api/dyn/{table}`.
- **Middleware missing:** `middleware.ts` tidak ada saat backup 2026-09-18 — guard tidak aktif di edge; untuk produksi buat `middleware.ts` JWT atau enforce di Route Handler `GlobalTablesService` + persuratan services.

### Migration workflow (from `.` — apps/web)

```bash
npx prisma generate              # generate client ke app/generated/prisma
npx prisma migrate dev --name add_feature  # create & apply migration (dev, bisa drop jika drift — hati-hati)
npx prisma migrate deploy        # apply pending di produksi
npx prisma db push               # sync cepat additive tanpa file migrasi — aman untuk dev (bukan migrate dev yang drop) — spec task menyebut db push
npx prisma studio                # GUI :5555
npx tsx prisma/seed.ts           # atau npm run db:seed
```

- `migrate dev` canonical (ada `prisma/migrations/20260918005609_init`); `db push` untuk iterasi cepat additive tanpa history (spec: `db push` bukan `migrate dev` yang drop) — pilih sesuai kebutuhan.
- BR-001: never edit applied migration; schema changes ship as new file.
- Up/down drill on empty scratch:

```bash
rm -f /tmp/drill.sqlite
DATABASE_URL="file:/tmp/drill.sqlite" npx prisma migrate deploy
DATABASE_URL="file:/tmp/drill.sqlite" npx prisma db push
sqlite3 /tmp/drill.sqlite "PRAGMA integrity_check;"  # must print: ok
sqlite3 /tmp/drill.sqlite "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'dyn_%';"
sqlite3 /tmp/drill.sqlite "SELECT name FROM sqlite_master WHERE type='table' AND name='global_tables';"
```

### Drift recovery

1. Back up first (§3 `cp dev.db + docs/ai-builder`).
2. `pending:<name>` — migrasi belum apply: `npx prisma migrate deploy` + reboot.
3. `unknown:<name>` — DB punya migrasi tanpa file: restore file dari VCS, jangan delete rows ` _prisma_migrations`.
4. Jika `migrate dev` warning drop → gunakan `npx prisma db push` untuk sync additive aman di dev.

## 2. Health probe

`GET /api/health` — public, no PII:

```json
{ "status": "healthy", "db": "healthy", "storage": "healthy", "version": "1.0.0", "projects": 12, "generations": 34 }
```

Wire to process monitor / LB probe. Include builder counts for observability (optional).

`GET /api/builder/templates` — public, check template seeding.

## 3. SQLite backup / restore

SQLite single file: `apps/web/dev.db` (`DATABASE_URL="file:./dev.db"` di `.env` + `prisma7.config.ts` + `lib/prisma.ts` adapter-libsql).

```bash
# Backup (stop writes atau checkpoint dulu; single-node cukup stop Next.js)
sqlite3 apps/web/dev.db "PRAGMA wal_checkpoint(TRUNCATE);"
cp apps/web/dev.db backups/db-$(date +%F).sqlite
cp -r apps/web/docs/ai-builder backups/ai-builder-$(date +%F)  # file store builder (jika ada)
sqlite3 backups/db-$(date +%F).sqlite "PRAGMA integrity_check;"  # must print: ok

# Restore di scratch + verify
cp backups/db-<date>.sqlite /tmp/restore-check.sqlite
sqlite3 /tmp/restore-check.sqlite "PRAGMA integrity_check;"      # ok
# Check platform + dynamic tables:
sqlite3 /tmp/restore-check.sqlite "SELECT name FROM sqlite_master WHERE type='table' AND name='global_tables';"
sqlite3 /tmp/restore-check.sqlite "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'dyn_%';"
sqlite3 /tmp/restore-check.sqlite "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'persuratan_%';"
sqlite3 /tmp/restore-check.sqlite "SELECT COUNT(*) FROM global_tables;"
```

Cadence: daily file copy off-host; `VACUUM` monthly; `PRAGMA integrity_check` must `ok`. WAL mode via libsql. **Reminder**: `dyn_*` + `persuratan_*` + `global_tables` di dalam `dev.db` yang sama — backup `dev.db` covers semua + `docs/ai-builder` file store.

## 4. Least-privilege roles — AI Builder (RBAC + Builder)

| Role | Grants |
|------|--------|
| Super Admin | Full Access (all methods + URLs) + `Builder:*` + `Generated:*` |
| Admin | Web Access + Read Write + `Builder:Generate` + `Builder:Read` + `Generated:*` |
| Builder User (NEW) | `Builder:Generate` + `Builder:Read` + `Generated:Read/Write` (own slug or wildcard in v1) |
| Viewer | Read Only + `Generated:Read` (preview) |

New users get `Builder:Read` or nothing unless explicitly granted. Permission names immutable once seeded. Katalog seed lengkap: `docs/database.md` § Seed Data, ringkasan produk: `docs/PRD.md` §22. Generated per-slug permissions (`Generated:{Slug}:{Entity}:Read/Write`) ditambah otomatis saat `AiProject` status `ready`.

**Builder permissions** (seed id 11-15):

| Permission | Methods | URLs |
|------------|---------|------|
| Builder Generate | POST | `/api/builder/generate`, `/api/builder/refine` |
| Builder Read | GET | `/api/builder/projects/*`, `/api/builder/generations/*`, `/api/builder/templates` |
| Builder Manage | DELETE | `/api/builder/projects/*` |
| Generated Read | GET | `/api/*/*` |
| Generated Write | POST,PUT,DELETE | `/api/*/*` |

## 5. Audit coverage

Every mutation emits activity log. Verify during QA:

```
GET /api/activity-logs (admin)
→ { data: [...], total, page, limit, totalPages }
GET /api/activity-logs/stats
# Builder-specific:
GET /api/activity-logs?entity=AiProject
GET /api/activity-logs?entity=AiGeneration&action=GENERATE
```

Covered entities: User, Role, Permission, Guard, **AiProject, AiGeneration**, Auth, Settings. Actions: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, **`GENERATE`**, **`REFINE`**.

**Generation audit**: each `POST /api/builder/generate` creates `AiPrompt` + `AiGeneration` + `activity_log` (action=GENERATE, entity=AiProject, metadata=prompt). Failures log `level=ERROR` + `error` field.

## 6. Limits

| Surface | Limit | Behavior |
|---------|-------|----------|
| Uploads (settings) | 5 MB, allowlist `png jpg jpeg svg webp ico gif pdf` | 400 otherwise |
| Auth | 60/min/user for login | 429 |
| **Builder: generate** | 10/min/user, prompt 3-500 chars | 429 / 422 |
| **Builder: refine** | 20/min/user per project | 429 |
| Generated CRUD | pagination max 100, same as RBAC | 400 if over |

## 7. Quickstarts

**Admin:** Login → Dashboard → User Management (Users/Roles/Permissions/Guards) → `prisma/seed.ts` users `admin/admin@admin.com` `P455w0rd!!!` → Activity Logs.

**Global Tables (happy path — 13 tipe):** Login → `Global Tabel` → `Global Tables` → **Buat Tabel Baru** → isi `Nama Tabel` `pegawai` (snake_case → preview `dyn_pegawai`) + `Nama Tampilan` `Data Pegawai` → tambah kolom 13 tipe (text Nama `required` `searchable` `orderable`, richtext Deskripsi, date `m-d-Y`, image, select, select_table relation, number IDR `isCurrency`, hidden_operation `expression` `"hasil "++gaji++" * 2 = "++ gaji*2`) → **Buat Tabel** → `POST /api/global-tables` → `CREATE TABLE "dyn_pegawai"` + indexes → browse `/dyn/pegawai` → searching `Afdal` (isSearchable), options hide kolom, order klik `Nama` ↕ → **Tambah Data** modal per-type → input Nama, Gaji `Rp 5.000.000` realtime, hidden auto `hasil 5000000 *2 =10000000` → Simpan → DataTable.

**Persuratan (4 tahap):** `Components` → buat `Kop Surat` richtext + klik kanan binding `nama` type text → `Templates` → buat `Surat Tugas` klik kanan insert Component `Kop Surat` mapping `{{nama}}` source `tabel:pegawai.nama` loop `pegawai` rows Pilih Semua → `Administrasi` → buat `Perjalanan Dinas` fields `judul:text` + steps pilih `Surat Tugas` → `Hasil` → pilih `Perjalanan Dinas` chips → isi `step1_judul` + tambah step `Surat Tugas` → isi data → Simpan → Preview PDF (window.print).

**Builder (happy path legacy):** Login → `Builder` (`/builder` → `/generated/surat-platform/builder`) Office Doc paper `#e8ecef` shadow → tambah Komponenten text/table/repeater/condition/barcode → Preview HTML → Export PDF `POST /api/generated/surat-platform/export-pdf` (puppeteer-core) → cetak.

**Generated app user (old):** Buka `/generated/pos-kasir` → Dashboard omzet → `Produk` → Search `kopi` → Create `Produk` (validasi Zod) → Transaksi → Cetak struk.

## 8. API delta — Global Tables + Persuratan + Builder (RBAC + Builder)

Base RBAC endpoints (real):

- `/api/auth/*` (jika ada login/register/profile)
- `/api/users/*` (`app/api/users/route.ts` + `[id]/route.ts`), serupa `/api/roles`, `/api/permissions`, `/api/guards` + `GET /api/activity-logs`, `/api/settings`, `/api/health` (`app/api/health/route.ts`)

**Global Tables & Dyn (stabil — real `apps/web`):**

- `GET /api/global-tables` — list meta (paginated, QueryGlobalTableSchema ?page&limit&search&sortBy&sortOrder) → `{data,total,page,limit,totalPages,_columnCount,_rowCount}` (`GlobalTablesService.findAll`)
- `POST /api/global-tables` — create meta + `CREATE TABLE "dyn_{name}"` + `CREATE INDEX idx_dyn_*` (13 tipe, CreateGlobalTableSchema, snake_case, 201)
- `GET /api/global-tables/:id` — detail + columns (`findOne`)
- `PUT /api/global-tables/:id` — update meta + `ALTER TABLE ADD COLUMN` additive (UpdateGlobalTableSchema)
- `DELETE /api/global-tables/:id` — `DROP TABLE IF EXISTS "dyn_{name}"` + delete meta cascade
- `GET /api/dyn/:table` — list data `dyn_*` (QueryDynSchema ?page&limit&search&sortBy&sortOrder&filters, search hanya isSearchable OR, sort hanya isOrderable else id) → `{data,total,page,limit,totalPages,columns}` (`listData`)
- `POST /api/dyn/:table` — create data (validasi required/default/type + `computeOperationColumns` hidden/readonly `++` `""` `* / + -` → INSERT)
- `GET/PUT/DELETE /api/dyn/:table/:id` — detail/update (merge existing + recompute)/delete (`getDataOne`/`updateData`/`deleteData`)

**Persuratan (stabil — real):**

- `GET/POST /api/persuratan/components` — list/create component (`persuratan_components`: name, isLooping, contentHtml, bindingsJson)
- `GET/PUT/DELETE /api/persuratan/components/:id`
- `GET/POST /api/persuratan/templates` — template (componentsJson mapping + loopConfig)
- `GET/PUT/DELETE /api/persuratan/templates/:id`
- `GET/POST /api/persuratan/administrations` — administrasi (fieldsJson + steps → persuratan_steps)
- `GET/PUT/DELETE /api/persuratan/administrations/:id` — detail + steps enrich templateName
- `GET/POST /api/persuratan/administrations/:id/datas` — hasil (valuesJson, stepsDataJson, persuratan_datas)
- `PUT/DELETE /api/persuratan/administrations/:id/datas/:dataId`

**Surat Platform legacy (generated):**

- `GET/POST /api/generated/surat-platform/templates` + `[id]`, `documents`, `employees`, `components`, `data-sources` + `[id]/resolve`
- `POST /api/generated/surat-platform/render` — render HTML schema+data
- `POST /api/generated/surat-platform/export-pdf` — export PDF via `puppeteer-core` + chrome (barcode ikut)

Builder endpoints (NEW, file-based jika aktif):

- `POST /api/builder/generate` — prompt → project + generation (file `docs/ai-builder`)
- `POST /api/builder/refine` — prompt delta → patch
- `GET /api/builder/projects` — list (paginated, ?status=ready|generating|failed)
- `GET /api/builder/projects/:slug` — detail + spec
- `DELETE /api/builder/projects/:slug` — delete project + code
- `GET /api/builder/templates` — starter templates

Generated dynamic (per slug — Next.js Route Handlers):

- `GET|POST /api/generated/:slug/:entity` — list/create (paginated, search/sort) → `app/api/generated/[slug]/[entity]/route.ts`
- `GET|PUT|DELETE /api/generated/:slug/:entity/:id` — detail/update/delete

Example: `GET /api/global-tables?page=1&limit=20&search=pegawai` → `{data:[{name:"pegawai",displayName:"Pegawai",_columnCount:5,_rowCount:10}],total}`; `GET /api/dyn/pegawai?search=Afdal&sortBy=nama&sortOrder=asc` → `{data:[{nama:"Afdal",gaji:5000000}],total,columns}`

## 9. Builder — observability & ops

- **Generation queue**: `ai_generations.status` = `queued`/`running`/`success`/`failed`. Monitor `failed` count via `GET /api/builder/generations?status=failed`.
- **Duration**: `durationMs` per generation — alert if p95 > 30s or `failed` ratio >5%.
- **Storage**: generated code `app/generated/[slug]/` (Next.js app dir) + entities `lib/db/entities/generated/{slug}/` tracked in gitignore? — runtime files untracked; backup DB + code archive for deploy.
- **Deploy**: `AiDeployment` `env=preview` auto, `production` manual. URL `/generated/[slug]` served via Next.js `app/generated/[slug]/page.tsx` + Route Handlers `app/api/generated/[slug]/[entity]/route.ts`. Vercel/Node standalone both `next start` ready.

## Change Log

### 2026-09-18 — Knowledge Backup (Global Tables 13 tipe + Persuratan stabil)

- **Discovery:** 19 models real (spec 25) vs real `dev.db` `DATABASE_URL="file:./dev.db"` + `prisma7.config.ts` + `lib/prisma.ts` adapter-libsql, `lib/services/global-tables.service.ts` 451 (13 tipe `dyn_*`), `lib/renderer/operationEngine.ts` `++`, `apps/web/dev.db` (bukan `db.sqlite`), `docs/ai-builder` file store. **Update runbook:** §1 platform 19 models + dynamic `dyn_*` (CREATE TABLE additive, `db push` aman vs `migrate dev` drop), §3 backup `dev.db` + `docs/ai-builder` + checks `global_tables`/`dyn_%`/`persuratan_%`, §7 quickstarts Global Tables 13 tipe + Persuratan 4 tahap + Office Doc `#e8ecef`, §8 API delta Global Tables & Dyn + Persuratan + legacy generated + builder, §4 roles + §5 audit tetap.

### Stack Migration — Next.js + React (2026-09-15)

- **MIGRASI** dari Nuxt/Nitro ke Next.js 15 (App Router) + React 19: boot `npm run build && npm run start` (bukan `preview`), paths `server/*` → `lib/db/*` + `app/api/**/route.ts` + `instrumentation.ts`, generated code `app/generated/[slug]/`, deploy `next start` standalone. Health check tetap `/api/health` (Route Handler `app/api/health/route.ts`).

### AI App Builder — Platform Pivot (2026-09-15)

- **PIVOT** dari RBAC-Only ke AI Builder — §1 boot baseline tambah builder baseline, §2 health tambah builder counts, §3 backup tambah `ai_%` check + generated tables note, §4 roles tambah Builder User + Builder permissions 11-15 + per-slug `Generated:*`, §5 audit tambah `AiProject`/`AiGeneration` + actions GENERATE/REFINE, §6 limits tambah builder rate limits (generate 10/min, prompt 3-500), §7 quickstarts tambah Builder happy path, §8 API delta tambah 9 builder endpoints + dynamic `/:slug/:entity`, §9 builder observability baru (queue, duration, storage, deploy). RBAC sections retained as base.

### Task 01 — 2026-09-12

- Pruned to RBAC-Only — archived dynamic runbook.

