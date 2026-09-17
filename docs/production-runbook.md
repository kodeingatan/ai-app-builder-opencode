# Production Runbook — AI App Builder Platform (Next.js)

Single-node SQLite deployment. Multi-node/HA out of scope.

## 1. Production boot & baseline migration

```bash
NODE_ENV=production JWT_SECRET=<strong-secret> DB_SYNCHRONIZE=false npm run build && npm run start
# Next.js: next build → next start (bukan nuxt preview)
# Atau standalone: npm run build && NODE_ENV=production node .next/standalone/server.js
```

- `synchronize:false` production (`lib/db/data-source.ts` / `lib/db/index.ts` — override `DB_SYNCHRONIZE=true` only for scratch/dev). On fresh DB the server applies checked-in baselines automatically at boot (`migrationsRun` in `getDataSource()`):
  - `lib/db/migrations/1788914913928-Baseline.ts` — RBAC 9 schemas / 12 tables
  - `lib/db/migrations/<ts>-AiBuilder.ts` — Builder 8 schemas / +11 tables (AiProject, AiPrompt, AiGeneration, AiAppSchema, AiDataModel, AiPage, AiComponentSpec, AiDeployment + indexes + FKs)
  → total **17 schemas / ~23 tables**, then runs idempotent seed (RBAC + builder templates). Dev default unchanged (`synchronize:true`, no migration enforcement).
- On drift the server fails fast with `MIGRATION_DRIFT` pointing here (see `lib/utils/startup-check.ts` + `lib/utils/migration-status.ts` via `instrumentation.ts` / `lib/db/init.ts`). Next.js `instrumentation.ts` hook (atau `app/layout.tsx` startup) yang init DataSource.
- Fresh-install seed idempotent: every `seed*` checks existence first — re-running never duplicates permissions/roles/users/templates.
- Startup self-check fails fast in production when `JWT_SECRET` is default, storage unwritable, or migrations drift. Dev boots (`synchronize:true`) are warn-free by design (Task 24); prod fatals unchanged.
- Generated tables (`{slug}_{entity}`) — **not** covered by baseline migrations. They are created runtime via `synchronize` or `queryRunner.createTable` in `lib/services/ai-builder/codegen.service.ts` (additive only, never drop). Backup file before refine that adds columns.

### Migration workflow (from `apps/web/`)

```bash
npm run migration:run                    # apply pending migrations (DB_PATH defaults to db.sqlite atau data/db.sqlite)
DB_PATH=/tmp/scratch.sqlite npm run migration:run
npm run migration:revert                 # revert last
npm run migration:generate -- <Name>     # diff EntitySchemas vs DB → lib/db/migrations/<timestamp>-<Name>.ts
```

- `generate` diffs entity metadata vs target DB: point `DB_PATH` at fully-migrated copy so only delta emitted, then wire new class into `appMigrations` in `lib/db/data-source.ts` (CLI prints reminder).
- BR-001: never edit applied migration; schema changes ship as new files.
- Up/down drill on empty scratch file before touching prod:

```bash
rm -f /tmp/drill.sqlite
DB_PATH=/tmp/drill.sqlite npm run migration:run
DB_PATH=/tmp/drill.sqlite npm run migration:revert
DB_PATH=/tmp/drill.sqlite npm run migration:run
sqlite3 /tmp/drill.sqlite "PRAGMA integrity_check;"  # must print: ok
```

### Drift recovery (`MIGRATION_DRIFT` at boot)

1. Back up first (§3).
2. `pending:<name>` — checked-in migration not applied: `npm run migration:run` and reboot.
3. `unknown:<name>` — DB carries migration with no checked-in file: do NOT delete rows from `migrations`; restore matching file from VCS (or restore backup) and reboot.
4. `migrations-table-missing` — pre-migration DB (tables exist but no bookkeeping): this file predates baseline. Either rebuild from baseline on empty file, or keep on dev `synchronize:true` — never force `DB_SYNCHRONIZE=true` against prod file (BR-002).

## 2. Health probe

`GET /api/health` — public, no PII:

```json
{ "status": "healthy", "db": "healthy", "storage": "healthy", "version": "1.0.0", "projects": 12, "generations": 34 }
```

Wire to process monitor / LB probe. Include builder counts for observability (optional).

`GET /api/builder/templates` — public, check template seeding.

## 3. SQLite backup / restore

SQLite is single file: `apps/web/db.sqlite`.

```bash
# Backup (stop writes or checkpoint first; single-node so stopping Next.js is enough)
sqlite3 apps/web/db.sqlite "PRAGMA wal_checkpoint(TRUNCATE);"
cp apps/web/db.sqlite backups/db-$(date +%F).sqlite
sqlite3 backups/db-$(date +%F).sqlite "PRAGMA integrity_check;"  # must print: ok

# Restore on scratch copy + verify
cp backups/db-<date>.sqlite /tmp/restore-check.sqlite
sqlite3 /tmp/restore-check.sqlite "PRAGMA integrity_check;"      # ok
# Check builder tables exist:
sqlite3 /tmp/restore-check.sqlite "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ai_%';"
```

Cadence: daily file copy off-host; `VACUUM` monthly. WAL mode recommended when concurrent readers grow. **Reminder**: generated tables (`pos_kasir_*`, `crm_klinik_*`) are inside same file — backup covers all.

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

**Admin:** Login → Dashboard → User Management (Users/Roles/Permissions/Guards) → Activity Logs / System Logs / Settings.

**Builder (happy path):** Login → `Builder` → ketik `buatkan aplikasi kasir` di AiPromptBar → Generate → tunggu `ready` → klik `Preview` → `/generated/pos-kasir` → CRUD Produk, Transaksi, etc. → Refine `tambahkan barcode scanner` → preview refresh.

**Generated app user:** Buka `/generated/pos-kasir` → Dashboard omzet → `Produk` → Search `kopi` → Create `Produk` (validasi Zod) → Transaksi → Cetak struk.

## 8. API delta — AI Builder (RBAC + Builder)

Base RBAC endpoints:

- `/api/auth/*` (login, register, profile, password)
- `/api/users/*`, `/api/roles/*`, `/api/permissions/*`, `/api/guards/*`
- `/api/activity-logs/*`, `/api/system-logs/*`, `/api/settings/*`, `/api/storage/*`, `/api/health`

Builder endpoints (NEW):

- `POST /api/builder/generate` — prompt → project + generation
- `POST /api/builder/refine` — prompt delta → patch
- `GET /api/builder/projects` — list (paginated, ?status=ready|generating|failed)
- `GET /api/builder/projects/:slug` — detail + spec + latest generation
- `GET /api/builder/projects/:slug/generations` — list generations
- `GET /api/builder/generations/:id` — detail generation
- `DELETE /api/builder/projects/:slug` — delete project + generated code (cascade)
- `POST /api/builder/preview/:slug` — rebuild preview
- `GET /api/builder/templates` — starter templates

Generated dynamic endpoints (per project slug — Next.js Route Handlers):

- `GET|POST /api/generated/:slug/:entity` — list/create (paginated, search/sort) → `app/api/generated/[slug]/[entity]/route.ts`
- `GET|PUT|DELETE /api/generated/:slug/:entity/:id` — detail/update/delete → `app/api/generated/[slug]/[entity]/[id]/route.ts`

Example: `GET /api/generated/pos-kasir/products?page=1&limit=20&search=kopi` → `{ data, total, page, limit, totalPages }`

## 9. Builder — observability & ops

- **Generation queue**: `ai_generations.status` = `queued`/`running`/`success`/`failed`. Monitor `failed` count via `GET /api/builder/generations?status=failed`.
- **Duration**: `durationMs` per generation — alert if p95 > 30s or `failed` ratio >5%.
- **Storage**: generated code `app/generated/[slug]/` (Next.js app dir) + entities `lib/db/entities/generated/{slug}/` tracked in gitignore? — runtime files untracked; backup DB + code archive for deploy.
- **Deploy**: `AiDeployment` `env=preview` auto, `production` manual. URL `/generated/[slug]` served via Next.js `app/generated/[slug]/page.tsx` + Route Handlers `app/api/generated/[slug]/[entity]/route.ts`. Vercel/Node standalone both `next start` ready.

## Change Log

### Stack Migration — Next.js + React (2026-09-15)

- **MIGRASI** dari Nuxt/Nitro ke Next.js 15 (App Router) + React 19: boot `npm run build && npm run start` (bukan `preview`), paths `server/*` → `lib/db/*` + `app/api/**/route.ts` + `instrumentation.ts`, generated code `app/generated/[slug]/`, deploy `next start` standalone. Health check tetap `/api/health` (Route Handler `app/api/health/route.ts`).

### AI App Builder — Platform Pivot (2026-09-15)

- **PIVOT** dari RBAC-Only ke AI Builder — §1 boot baseline tambah builder baseline, §2 health tambah builder counts, §3 backup tambah `ai_%` check + generated tables note, §4 roles tambah Builder User + Builder permissions 11-15 + per-slug `Generated:*`, §5 audit tambah `AiProject`/`AiGeneration` + actions GENERATE/REFINE, §6 limits tambah builder rate limits (generate 10/min, prompt 3-500), §7 quickstarts tambah Builder happy path, §8 API delta tambah 9 builder endpoints + dynamic `/:slug/:entity`, §9 builder observability baru (queue, duration, storage, deploy). RBAC sections retained as base.

### Task 01 — 2026-09-12

- Pruned to RBAC-Only — archived dynamic runbook.

