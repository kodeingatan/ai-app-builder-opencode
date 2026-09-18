> **Last Backup:** 2026-09-18 — via `/knowledge:backup`
> **Source:** `apps/web/*` — `prisma/schema.prisma` (25 models), `app/*`, `lib/*`, `components/*`
> **Scope:** `apps/web` — untuk root lihat `../../docs/`

# Database Structure — AI App Builder Platform (Dynamic per Prompt)

## Overview

- **Database Engine**: SQLite (via Prisma + `@prisma/adapter-libsql`)
- **ORM**: Prisma 7.10 (`prisma/schema.prisma` — 25 models platform (RBAC 18 + Global Tables 2 + Persuratan 5 + dyn_*), client di `app/generated/prisma`)
- **Platform Tables (static)**: **25 Prisma models / 25+ physical tables (18 platform + 7 new + N dyn_*)** — RBAC 6 core + 3 junctions + Builder META 8 + Platform (`activity_logs`, `settings`) — di-migrate via Prisma Migrate. **Tidak ada tabel bisnis hardcode.**
- **Dynamic App Tables**: `N` tabel fisik `{slug}_{entity}` dibuat **runtime per prompt** (`buatkan aplikasi kasir` → `pos_kasir_products`, `pos_kasir_categories`, dll). Tidak dihitung di baseline, tidak ada default. Lihat § Dynamic App Tables.
- **Database File**: `apps/web/dev.db` (DATABASE_URL="file:./dev.db", schema `prisma/schema.prisma`, config `prisma7.config.ts`), single file. Dynamic tables hidup di file yang sama.
- **Migrations**: Prisma Migrate — `prisma/schema.prisma` + `prisma/migrations/*` + `prisma7.config.ts`. Dev: `npx prisma migrate dev --name init`, Prod: `npx prisma migrate deploy`. Client generate: `npx prisma generate` → `app/generated/prisma`. BR-001: never edit applied migration. **Dynamic tables TIDAK via migration file** — via `prisma.$executeRawUnsafe('CREATE TABLE "{slug}_{entity}" (...)')` di `lib/services/ai-builder/codegen.service.ts`.
- **Seed**: idempotent via `prisma/seed.ts` (RBAC users/roles/permissions/guards + Builder Templates META) — `npx tsx prisma/seed.ts` atau `npx prisma db seed`; dipanggil saat Next.js boot via `instrumentation.ts` jika perlu. **Tidak seed tabel bisnis** — data bisnis di-seed runtime setelah generate (5-10 rows per entity, idempotent `COUNT(*) == 0`).
- **Startup gating**: Prisma `migrate deploy` di production; dev auto-sync via `migrate dev`. `lib/prisma.ts` singleton cegah hot-reload duplicate client.

---

## Current vs Planned — Platform vs Dynamic

- **CURRENT PLATFORM (static, di-migrate)**: 18 Prisma models / 18 tabel fisik — RBAC foundation + Builder META + Platform. Lihat § Entity Relationship Diagram & § Entity Details — Platform Tables. Ini yang ada di `prisma/schema.prisma` sejak awal.
- **DYNAMIC (per prompt, runtime)**: Setiap `AiProject` menghasilkan `ai_data_models` rows (spec JSON string) → `lib/services/ai-builder/codegen.service.ts` generate **physical tables** via `prisma.$executeRawUnsafe('CREATE TABLE "{slug}_{entity}" (...)')` + `app/api/generated/[slug]/[entity]/route.ts` (CRUD via `prisma.$queryRaw`/`$executeRaw` untuk dynamic). Tabel dinamis TIDAK di schema — runtime DDL. **Jumlah tabel = 0 di awal, N setelah prompt.** Tidak ada `pos_kasir_products` default — hanya muncul jika user prompt `kasir`.
- **PLANNED**: Platform schema changes ship sebagai additive Prisma migration baru (`npx prisma migrate dev --name add_<field>`). Dynamic tables tidak perlu migration — additive DDL per project (`ADD COLUMN`/`CREATE TABLE` via `$executeRaw`). Jika butuh perubahan platform, buat migration baru.

> **Prinsip AI App Builder DB:** `Platform tables = fixed & minimal. Business tables = 100% dynamic per prompt.` Jangan hardcode entity bisnis di baseline.

---


### Global Tables & Persuratan (Baru — 7 models)

**Global Tables (2):**
- `global_tables` (id, name unique, displayName, description, status) — meta tabel
- `global_columns` (tableId FK, name, displayName, type enum 13, optionsJson, defaultValue, isRequired, isOrderable, isSearchable, orderIndex) — 13 tipe: text, richtext, date, datetime, time, image, select, select_multiple, select_table, select_table_multiple, number+IDR, hidden_operation_text, readonly_operation_text

**Persuratan (5):**
- `persuratan_components` (name unique, isLooping, contentHtml, bindingsJson [{name,type,componentId,width,height}])
- `persuratan_templates` (name, description, contentHtml, componentsJson [{componentId, dataMapping, loopConfig}])
- `persuratan_administrations` (name, description, fieldsJson [{name,type}])
- `persuratan_steps` (administrationId FK, stepOrder, templateId FK, dataMappingJson)
- `persuratan_datas` (administrationId FK, name, valuesJson, stepsDataJson)

**Dynamic:** `dyn_{name}` physical tables via `GlobalTablesService.create()` → `CREATE TABLE "dyn_pegawai" (...)` + `prisma.$executeRawUnsafe`, indexes untuk searchable/orderable, operation via `operationEngine.ts`.

## Entity Relationship Diagram — Platform (Static)

### RBAC Core

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │       │   users_roles    │       │    roles     │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ user_id (FK)     │    ┌──│ id (PK)      │
│ firstName    │  └───>│ role_id (FK)     │<───┘  │ roleName     │
│ lastName     │       └──────────────────┘       │ description  │
│ username     │                                  │ createdAt    │
│ email        │       ┌──────────────────┐       │ updatedAt    │
│ password     │       │  roles_guards    │       └──────────────┘
│ createdAt    │       ├──────────────────┤            │    │
│ updatedAt    │       │ role_id (FK)     │       ┌────┘    └────┐
└──────────────┘       │ guard_id (FK)    │       │              │
                       └──────────────────┘       │              │
                              │    │              │              │
┌──────────────┐              │    │         ┌────┴────┐   ┌────┴────────┐
│   guards     │<─────────────┘    └────────>│guards_  │   │roles_       │
├──────────────┤                             │urls     │   │permissions  │
│ id (PK)      │       ┌──────────────────┐  ├─────────┤   ├─────────────┤
│ guardName    │       │ guard_urls       │  │guard_id │   │role_id (FK) │
│ description  │       ├──────────────────┤  │(FK)     │   │permission_id│
│ createdAt    │       │ id (PK)          │  │url      │   │(FK)         │
│ updatedAt    │       │ guard_id (FK)    │  │type     │   └─────────────┘
└──────────────┘       │ url              │  └─────────┘        │    │
                       │ type (allow/deny)│                      │    │
                       │ createdAt        │               ┌──────┘    └──────┐
                       └──────────────────┘               │                 │
                                                          │                 │
┌──────────────┐       ┌──────────────────┐          ┌────┴─────┐    ┌──────┴────────┐
│ permissions  │       │permission_methods│          │permission│    │               │
├──────────────┤       ├──────────────────┤          │_methods  │    │permission_urls│
│ id (PK)      │──┐    │ id (PK)          │          ├──────────┤    ├───────────────┤
│ permissionNam│  └───>│ permission_id    │          │id (PK)   │    │id (PK)        │
│ description  │       │ method           │          │perm_id   │    │permission_id  │
│ createdAt    │       │ createdAt        │          │(FK)      │    │(FK)           │
│ updatedAt    │       └──────────────────┘          │method    │    │url            │
└──────────────┘                                    │createdAt │    │createdAt      │
                                                    └──────────┘    └───────────────┘
```

### Builder META (Static)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  ai_projects │       │  ai_prompts  │       │ai_generations│
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │       │ id (PK)      │
│ slug (UQ)    │  ├───>│ projectId(FK)│       │ projectId(FK)│
│ name         │  │    │ promptText   │       │ promptId(FK) │
│ prompt       │  │    │ inferredJson │       │ status       │
│ status       │  │    │ version      │       │ spec JSON    │
│ previewUrl   │  │    │ createdAt    │       │ error        │
│ ownerId(FK)  │──┘    └──────────────┘       │ durationMs   │
│ createdAt    │                             │ createdAt    │
│ updatedAt    │       ┌──────────────┐       └──────┬───────┘
└──────┬───────┘       │ai_deployments│              │
       │               ├──────────────┤              │
       │               │ id (PK)      │              v
       │               │ projectId(FK)│       ┌──────────────┐
       │               │ env          │       │ai_app_schemas│
       │               │ url          │       ├──────────────┤
       │               │ builtAt      │       │ id (PK)      │
       │               └──────────────┘       │ generationId │
       │                                     │ entities JSON│
       │                                     │ pages JSON   │
       │                                     │ roles JSON   │
       │                                     │ flows JSON   │
       └─────────────────────────────────────┴──────┬───────┘
                                                   │
                           ┌───────────────────────┼───────────────────────┐
                           │                       │                       │
                    ┌──────┴───────┐        ┌──────┴───────┐        ┌──────┴───────────┐
                    │ai_data_models│        │   ai_pages   │        │ai_component_specs│
                    ├──────────────┤        ├──────────────┤        ├──────────────────┤
                    │ id (PK)      │        │ id (PK)      │        │ id (PK)          │
                    │ schemaId(FK) │        │ schemaId(FK) │        │ schemaId(FK)     │
                    │ name         │        │ route        │        │ name             │
                    │ fields JSON  │        │ title        │        │ type             │
                    │ relations J. │        │ type         │        │ props JSON       │
                    │ indexes JSON │        │ componentTree│        │ tokens JSON      │
                    └──────────────┘        └──────────────┘        └──────────────────┘
```

### Dynamic App Tables (Virtual — per Prompt)

```
ai_data_models (META: fields JSON string, relations JSON string)
       │
       ├─runtime─> prisma.$executeRawUnsafe('CREATE TABLE "{slug}_{entity}" (...)')
       │           → physical table "{slug}_{entity}" (e.g., "pos_kasir_products")
       │             id PK, name TEXT, price REAL, stock INTEGER,
       │             categoryId INTEGER FK → {slug}_categories.id,
       │             createdAt DATETIME, updatedAt DATETIME
       │
       └─> app/api/generated/[slug]/[entity]/route.ts (CRUD via prisma.$queryRaw / $executeRaw untuk dynamic)
```

> Dynamic tables **tidak muncul di baseline** — hanya ilustrasi virtual. Struktur kolom 100% dari `ai_data_models.fields` hasil inference prompt.

---

## Entity Details — Platform Tables (Static)

> Hanya tabel platform yang di-migrate. Tidak ada `pos_kasir_products` hardcode.

### 1. users

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik |
| `firstName` | VARCHAR(100) | NOT NULL | Nama depan |
| `lastName` | VARCHAR(100) | NOT NULL | Nama belakang |
| `username` | VARCHAR(30) | NOT NULL, UNIQUE | Username unik |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Email unik |
| `password` | VARCHAR(255) | NOT NULL | Hash bcrypt |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| `updatedAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

Indexes: PK id, UNIQUE username, UNIQUE email.

### 2. roles

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `roleName` | VARCHAR(100) | NOT NULL, UNIQUE | |
| `description` | TEXT | NULLABLE | |
| `createdAt` | DATETIME | | |
| `updatedAt` | DATETIME | | |

### 3. permissions

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `permissionName` | VARCHAR(100) | NOT NULL, UNIQUE | |
| `description` | TEXT | NULLABLE | |
| `createdAt` | DATETIME | | |
| `updatedAt` | DATETIME | | |

### 4. guards

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `guardName` | VARCHAR(100) | NOT NULL, UNIQUE | |
| `description` | TEXT | NULLABLE | |
| `createdAt` | DATETIME | | |
| `updatedAt` | DATETIME | | |

### 5. users_roles (Junction)

| Column | Type | Constraint |
|--------|------|-----------|
| `userId` | INTEGER | FK→users.id, PK |
| `roleId` | INTEGER | FK→roles.id, PK |

PK(userId, roleId), CASCADE.

### 6. roles_guards (Junction)

| Column | Type | Constraint |
|--------|------|-----------|
| `roleId` | INTEGER | FK→roles.id, PK |
| `guardId` | INTEGER | FK→guards.id, PK |

### 7. roles_permissions (Junction)

| Column | Type | Constraint |
|--------|------|-----------|
| `roleId` | INTEGER | FK→roles.id, PK |
| `permissionId` | INTEGER | FK→permissions.id, PK |

### 8. guard_urls

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `guardId` | INTEGER | FK→guards.id | |
| `url` | VARCHAR(500) | NOT NULL | pattern `/api/users/*` |
| `type` | ENUM('allow','deny') | NOT NULL | |
| `createdAt` | DATETIME | | |

### 9. permission_methods

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | |
| `permissionId` | INTEGER | FK→permissions.id | |
| `method` | VARCHAR(10) | NOT NULL | GET, POST, ..., * |
| `createdAt` | DATETIME | | |

### 10. permission_urls

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | |
| `permissionId` | INTEGER | FK→permissions.id | |
| `url` | VARCHAR(500) | NOT NULL | pattern |
| `createdAt` | DATETIME | | |

---

## Entity Details — Builder META (Static, 8 schemas)

> Ini adalah **spesifikasi** aplikasi, bukan data bisnis. Data bisnis ada di Dynamic App Tables.

### 11. ai_projects

Container aplikasi yang di-generate (per prompt).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID |
| `name` | VARCHAR(100) | NOT NULL | `Kasir POS` (dari inference `domainLabel`) |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE | `pos-kasir` URL-safe `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `initialPrompt` | TEXT | NOT NULL | prompt pertama (`buatkan aplikasi kasir`) |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'drafting' | `drafting`/`generating`/`ready`/`failed` |
| `previewUrl` | VARCHAR(500) | NULLABLE | `/generated/pos-kasir` |
| `ownerId` | INTEGER | NULLABLE, FK→users.id ON DELETE SET NULL | pembuat project |
| `createdAt` | DATETIME | | |
| `updatedAt` | DATETIME | | |

Indexes: PK id, UNIQUE slug, INDEX ownerId, INDEX status. Slug collision → auto suffix `-2`.

### 12. ai_prompts

Riwayat prompt per project (versioning, untuk refine `tambahkan ...`).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `projectId` | INTEGER | NOT NULL, FK→ai_projects.id ON DELETE CASCADE | |
| `promptText` | TEXT | NOT NULL | teks asli user |
| `inferredIntent` | TEXT | NULLABLE (JSON) | hasil inference (domain, entities, pages, roles) |
| `version` | INTEGER | NOT NULL, DEFAULT 1 | increment per project |
| `createdAt` | DATETIME | | |

UNIQUE(projectId, version).

### 13. ai_generations

Satu run generation (queued → running → success/failed).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `projectId` | INTEGER | NOT NULL, FK→ai_projects.id ON DELETE CASCADE | |
| `promptId` | INTEGER | NULLABLE, FK→ai_prompts.id ON DELETE SET NULL | prompt pemicu |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'queued' | `queued`/`running`/`success`/`failed` |
| `spec` | TEXT | NULLABLE (JSON) | snapshot `AiAppSchema` saat generation |
| `error` | TEXT | NULLABLE | error message jika failed |
| `durationMs` | INTEGER | NULLABLE | lama generation ms |
| `createdAt` | DATETIME | | |
| `updatedAt` | DATETIME | | |

INDEX status (queue monitoring).

### 14. ai_app_schemas

Blueprint aplikasi (1 per successful generation, source of truth untuk codegen).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `generationId` | INTEGER | NOT NULL, UNIQUE, FK→ai_generations.id ON DELETE CASCADE | |
| `entities` | TEXT | NOT NULL (JSON) | array entity definitions (nama + fields) |
| `pages` | TEXT | NOT NULL (JSON) | array page definitions |
| `roles` | TEXT | NOT NULL (JSON) | array role definitions |
| `flows` | TEXT | NULLABLE (JSON) | business flows |
| `apiContract` | TEXT | NULLABLE (JSON) | endpoints contract |
| `createdAt` | DATETIME | | |

### 15. ai_data_models (META — bukan tabel bisnis)

Spec per entity yang akan menjadi **dynamic table**. 1 row di sini → 1 physical table `{slug}_{entity}`.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `schemaId` | INTEGER | NOT NULL, FK→ai_app_schemas.id ON DELETE CASCADE | |
| `name` | VARCHAR(100) | NOT NULL | `Product` (PascalCase) |
| `slug` | VARCHAR(100) | NOT NULL | `products` (snake plural, table suffix) |
| `fields` | TEXT | NOT NULL (JSON) | `[{name:"price", type:"decimal", required:true, unique:false, enumValues:null}]` |
| `relations` | TEXT | NULLABLE (JSON) | `[{type:"ManyToOne", target:"Category", field:"categoryId", onDelete:"SET NULL"}]` |
| `indexes` | TEXT | NULLABLE (JSON) | `["name","categoryId"]` |
| `createdAt` | DATETIME | | |

UNIQUE(schemaId, slug). **Field type enum** (di JSON): `string`→VARCHAR(255), `text`→TEXT, `integer`→INTEGER, `decimal`→NUMERIC(10,2), `boolean`→INTEGER 0/1, `date`→DATE, `datetime`→DATETIME, `enum`→VARCHAR+CHECK, `relation`→INTEGER FK.

### 16. ai_pages

Halaman yang di-generate (spec, bukan tabel bisnis).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `schemaId` | INTEGER | NOT NULL, FK→ai_app_schemas.id ON DELETE CASCADE | |
| `route` | VARCHAR(255) | NOT NULL | `/generated/pos-kasir/products` (jika prompt `kasir`; jika `klinik` → `/generated/crm-klinik/patients`) |
| `title` | VARCHAR(100) | NOT NULL | `Produk` / `Pasien` (dari inference) |
| `type` | VARCHAR(20) | NOT NULL | `dashboard`/`list`/`detail`/`form`/`report` |
| `componentTree` | TEXT | NOT NULL (JSON) | `{"root":"PageShell","children":["DataTable","FormModal"]}` (shadcn/ui) |
| `createdAt` | DATETIME | | |

### 17. ai_component_specs

Spec komponen reusable (shadcn/ui props, bukan tabel bisnis).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `schemaId` | INTEGER | NOT NULL, FK→ai_app_schemas.id ON DELETE CASCADE | |
| `name` | VARCHAR(100) | NOT NULL | `ProductTable` / `PatientTable` (sesuai entity) |
| `type` | VARCHAR(50) | NOT NULL | `DataTable`/`FormModal`/`DetailDrawer`/`StatCard`/`FilterBar` (shadcn) |
| `props` | TEXT | NOT NULL (JSON) | props spec (columns, validation) |
| `tokens` | TEXT | NULLABLE (JSON) | design tokens override |
| `createdAt` | DATETIME | | |

### 18. ai_deployments

Info preview/deploy (static).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `projectId` | INTEGER | NOT NULL, FK→ai_projects.id ON DELETE CASCADE | |
| `env` | VARCHAR(20) | NOT NULL | `preview`/`production` |
| `url` | VARCHAR(500) | NOT NULL | `/generated/{slug}` |
| `builtAt` | DATETIME | NOT NULL | |
| `createdAt` | DATETIME | | |

### 19. activity_logs (Platform)

Audit trail.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `userId` | INTEGER | NULLABLE, FK→users.id ON DELETE SET NULL | |
| `action` | VARCHAR | NOT NULL | CREATE/UPDATE/DELETE/LOGIN/GENERATE/REFINE (GENERATE/REFINE untuk builder) |
| `entity` | VARCHAR | NOT NULL | User/Role/AiProject/AiGeneration/{DynamicEntity} (entity dynamic sesuai prompt) |
| `entityId` | INTEGER | NULLABLE | |
| `description` | TEXT | NULLABLE | |
| `metadata` | TEXT | NULLABLE | JSON before/after |
| `ipAddress` | VARCHAR | NULLABLE | |
| `userAgent` | VARCHAR | NULLABLE | |
| `level` | VARCHAR(20) | DEFAULT 'INFO' | INFO/WARNING/ERROR |
| `createdAt` | DATETIME | | |

### 20. settings (Platform)

Key-value.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `key` | VARCHAR(100) | UNIQUE | |
| `value` | TEXT | NOT NULL | |
| `createdAt` | DATETIME | | |
| `updatedAt` | DATETIME | | |

Seed: `app_name`, `login_bg_gradient`, `builder_default_template = pos-kasir`, `ai_inference_provider = stub` (bukan tabel bisnis).

---

## Dynamic App Tables (Generated per Prompt — TIDAK ADA DEFAULT)

> **Tidak ada tabel bisnis hardcode di baseline.** Semua tabel bisnis dibuat saat `POST /api/builder/generate` dengan `prompt`.

### Kontrak Generasi

**Input:** prompt `buatkan aplikasi kasir` → `AiInferenceService.infer(prompt)` → `InferredIntent.entities` (mis. `Product, Category, Transaction, Customer`)

**Output:** untuk tiap entity:

1. **Spec row** `ai_data_models` (`name`, `slug`, `fields` TEXT JSON, `relations` TEXT JSON)
2. **Dynamic table** `{slug_snake}_{entity_snake}` via `prisma.$executeRawUnsafe('CREATE TABLE ...')` — **runtime**, additive only (`ADD COLUMN` / `CREATE TABLE`, never `DROP COLUMN` pada refine)
3. **DTO** `lib/dto/{slug}/{entity}.dto.ts` (Zod `Create{Entity}Schema`), **Service** `lib/services/{slug}/{entity}.service.ts` (via `prisma.$queryRaw`/`$executeRaw` untuk dynamic, `prisma.user.*` untuk platform), **Route Handler** `app/api/generated/{slug}/{entity}/route.ts`, **UI** `app/generated/[slug]/**` (shadcn)
4. **Prisma**: dynamic tables tidak masuk `schema.prisma` — kelola via raw SQL; platform tables via `prisma.schema` models

### Naming

- Slug: `^[a-z0-9]+(?:-[a-z0-9]+)*$` lower-hyphen, unique, collision → `-2`
- Table: `{slug_snake}_{entity_snake}` lower_snake. Contoh: prompt `kasir` slug `pos-kasir` + entity `Product` → table `pos_kasir_products`; prompt `klinik` slug `crm-klinik` + entity `Patient` → `crm_klinik_patients`
- Column: `camelCase` di spec → `snake_case` di DB? Spec `field.name` disimpan as-is, TypeORM mapping ke `name` (VARCHAR). Konsisten `camelCase` di API.

### Field Type Mapping (spec → SQLite)

| Spec `type` | SQLite (via Prisma raw) | Prisma (platform) | Validasi Zod |
|-------------|--------|---------|--------------|
| `string` | TEXT | `String` | `z.string().min(1).max(255)` |
| `text` | TEXT | `String @db.Text` (SQLite -> TEXT) | `z.string()` |
| `integer` | INTEGER | `Int` | `z.number().int()` |
| `decimal` | REAL | `Float` | `z.number()` |
| `boolean` | INTEGER 0/1 | `Boolean` (Int 0/1 di SQLite) | `z.boolean()` |
| `date` | TEXT (ISO) | `DateTime` | `z.string().date()` atau `z.coerce.date()` |
| `datetime` | TEXT (ISO) | `DateTime` | `z.string().datetime()` |
| `enum` | TEXT + CHECK | `String` + enum di Prisma | `z.enum([...])` |
| `relation` ManyToOne | INTEGER FK | `Int` + relation via raw FK | `z.number().int()` nullable |

### Relation Handling

- `ai_data_models.relations` contoh: `[{type:"ManyToOne", target:"Category", field:"categoryId", onDelete:"SET NULL"}]` → di dynamic DDL `FOREIGN KEY (categoryId) REFERENCES "{slug}_categories"(id) ON DELETE SET NULL` via `prisma.$executeRawUnsafe(...)` + `INDEX categoryId`
- FK constraint dibuat runtime `FOREIGN KEY (categoryId) REFERENCES "{slug}_categories"(id) ON DELETE SET NULL`
- OneToMany inverse tidak buat kolom — hanya ManyToOne FK.

### Index Strategy

- Otomatis: `PRIMARY KEY id`, `INDEX` untuk tiap FK (`categoryId`), `UNIQUE` jika `fields.unique=true`, `INDEX` untuk `fields.index=true` atau `searchField` (untuk DataTable global search 320px).
- Manual via `ai_data_models.indexes` JSON `["name","categoryId"]`.

### DDL Generation (Next.js)

```typescript
// lib/services/ai-builder/codegen.service.ts (pseudo — Prisma raw)
for (const model of aiDataModels) {
  const columns = model.fields.map(f => mapFieldToPrismaRaw(f)).join(", ") // + id PK, createdAt, updatedAt
  const fk = model.relations.map(r => `FOREIGN KEY ("${r.field}") REFERENCES "${slug_snake}_${r.target.toLowerCase()}"(id) ON DELETE SET NULL`).join(", ")
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${slug_snake}_${model.slug}" (${columns}${fk ? ", " + fk : ""})`)
}
// Refine: prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "barcode" TEXT`) — never DROP
```

### Contoh Virtual (BUKAN FIXED — hanya ilustrasi per prompt)

> Label jelas **CONTOH DINAMIS** — akan berbeda tiap prompt, tidak ada di baseline.

**Jika prompt = `buatkan aplikasi kasir` (slug `pos-kasir`):**

| Tabel Fisik Virtual | Kolom (dari inference) | Keterangan |
|---------------------|------------------------|------------|
| `pos_kasir_products` | `id PK, name VARCHAR NOT NULL, price NUMERIC NOT NULL, stock INTEGER NOT NULL, barcode VARCHAR NULL, categoryId INTEGER FK → pos_kasir_categories.id, createdAt DATETIME, updatedAt DATETIME` | Dari entity `Product` fields `[name, price, stock, barcode]` + relation `ManyToOne Category` |
| `pos_kasir_categories` | `id PK, name VARCHAR UNIQUE NOT NULL, description TEXT NULL` | Dari entity `Category` |
| `pos_kasir_transactions` | `id PK, customerId INTEGER FK → pos_kasir_customers.id NULL, total NUMERIC NOT NULL, status VARCHAR CHECK('pending','paid','cancelled') NOT NULL, createdAt DATETIME` | Dari `Transaction` |
| `pos_kasir_customers` | `id PK, name VARCHAR NOT NULL, phone VARCHAR NULL, email VARCHAR UNIQUE NULL` | Dari `Customer` |

**Jika prompt = `buatkan CRM untuk klinik` (slug `crm-klinik`):**

| Tabel Fisik Virtual | Kolom | Keterangan |
|---------------------|-------|------------|
| `crm_klinik_patients` | `id PK, name VARCHAR NOT NULL, phone VARCHAR NOT NULL, birthDate DATE NULL` | Dari `Patient` |
| `crm_klinik_doctors` | `id PK, name VARCHAR NOT NULL, specialty VARCHAR NOT NULL` | Dari `Doctor` |
| `crm_klinik_appointments` | `id PK, patientId FK, doctorId FK, date DATETIME NOT NULL, status VARCHAR CHECK('scheduled','done','cancelled')` | Dari `Appointment` relations |

**Jika prompt = `todo app dengan share` (slug `todo-share`):**

| Tabel Fisik Virtual | Kolom |
|---------------------|-------|
| `todo_share_todos` | `id PK, title VARCHAR NOT NULL, done INTEGER 0/1 NOT NULL, projectId FK, createdAt DATETIME` |
| `todo_share_projects` | `id PK, name VARCHAR NOT NULL` |

> Hapus `pos_kasir_products` dari baseline — tabel ini **hanya ada setelah prompt `kasir` dieksekusi**.

### Lifecycle & Seed

- `AiProject.status`: `drafting` → `generating` (codegen running) → `ready` (tables + seed selesai) / `failed` (spec `error`)
- Seed dynamic: setelah `createTable`, insert 5-10 rows realistis (contoh `Product` → `[{name:"Kopi Arabika", price:25000, stock:50}, ...]`) — idempotent `WHERE NOT EXISTS` (cek `COUNT(*) == 0` sebelum seed). **Bukan** seed global hardcode.

---

## Seed Data — Platform Only (Sumber kebenaran: `prisma/seed.ts`)

> Hanya RBAC + Builder META, **tidak ada seed tabel bisnis**.

### Users (Platform)

| id | username | email | password | roles |
|----|----------|-------|----------|-------|
| 1 | admin | admin@admin.com | P455w0rd!!! | Super Admin |
| 2 | editor | editor@example.com | P455w0rd!!! | Editor |
| 3 | viewer | viewer@example.com | P455w0rd!!! | Viewer |
| 4 | manager | manager@example.com | P455w0rd!!! | Manager |
| 5 | guest | guest@example.com | P455w0rd!!! | Guest |

### Roles / Guards / Permissions (Platform, 7/8/10)

Sama, ringkasan di `docs/PRD.md` §22.

**Tambahan Builder Permissions (platform, seed):**

| id | permissionName | methods | urls |
|----|----------------|---------|------|
| 11 | Builder Generate | POST | `/api/builder/generate`, `/api/builder/refine` |
| 12 | Builder Read | GET | `/api/builder/projects/*`, `/api/builder/generations/*`, `/api/builder/templates` |
| 13 | Builder Manage | DELETE | `/api/builder/projects/*` |
| 14 | Generated Read | GET | `/api/generated/*/*` |
| 15 | Generated Write | POST,PUT,DELETE | `/api/generated/*/*` |

Granular per slug (`Generated:pos-kasir:Products:Read` → `GET /api/generated/pos-kasir/products`) dibuat **runtime** saat project `ready` (bukan seed hardcode).

### Builder Templates META (Contoh Prompt, bukan tabel bisnis)

| slug | name | prompt (contoh) | entities (inference contoh) | roles |
|------|------|-----------------|-----------------------------|-------|
| pos-kasir | Kasir POS | buatkan aplikasi kasir | Product, Category, Transaction, Customer | Admin, Kasir |
| crm-klinik | CRM Klinik | buatkan CRM klinik | Patient, Doctor, Appointment, Record | Admin, Dokter |
| todo-share | Todo Share | todo app share | Todo, Project, ShareLink | Owner, Member |
| inventory | Inventory Gudang | aplikasi inventory | Item, Warehouse, Movement | Admin, Staff |
| sekolah | Sekolah | aplikasi sekolah | Student, Teacher, Class, Attendance | Admin, Guru |

> Ini adalah **baris di `ai_projects`/`ai_app_schemas` sebagai inspirasi prompt** untuk `GET /api/builder/templates`, **bukan tabel fisik** `pos_kasir_products`. Tabel fisik hanya muncul setelah `POST /api/builder/generate` dengan prompt tersebut.

---

## Relationships Summary

### Platform (Static)

```
users ──< ai_projects (owner)
ai_projects ──< ai_prompts
ai_projects ──< ai_generations
ai_generations ──1 ai_app_schemas
ai_app_schemas ──< ai_data_models (META)
ai_app_schemas ──< ai_pages
ai_app_schemas ──< ai_component_specs
ai_projects ──< ai_deployments
ai_generations ── ai_prompts (via promptId, nullable)
users ──< activity_logs (SET NULL)
```

Cardinalities Platform:

| Relationship | Type | On Delete |
|--------------|------|-----------|
| User → AiProject | One-to-Many | SET NULL |
| AiProject → AiPrompt | One-to-Many | CASCADE |
| AiProject → AiGeneration | One-to-Many | CASCADE |
| AiGeneration → AiAppSchema | One-to-One | CASCADE |
| AiAppSchema → AiDataModel | One-to-Many | CASCADE |
| AiAppSchema → AiPage | One-to-Many | CASCADE |
| AiAppSchema → AiComponentSpec | One-to-Many | CASCADE |
| AiProject → AiDeployment | One-to-Many | CASCADE |

### Dynamic (Virtual, per Prompt)

```
ai_data_models (META: fields JSON)
    --runtime DDL--> {slug}_{entity} physical tables
         │
         ├─ {slug}_products (id, name, price, categoryId FK → {slug}_categories)
         ├─ {slug}_categories (id, name)
         └─ {slug}_transactions (id, customerId FK → {slug}_customers)
```

- Tiap dynamic table punya `ManyToOne` FK ke sesama slug (index + constraint)
- Tidak ada FK lintas slug (isolasi project)
- Dynamic tables tidak ada di ERD platform — ERD dynamic digenerate per project dari `ai_data_models.relations`

---

## Indexes & Constraints

### Platform

- `ai_projects.slug` UNIQUE + `ai_projects.status` INDEX
- `ai_prompts` UNIQUE(projectId, version)
- `ai_generations.status` INDEX
- `ai_data_models` UNIQUE(schemaId, slug)
- `ai_pages.route` INDEX
- Semua FK `ON DELETE CASCADE` kecuali `ownerId`/`promptId`/`userId` → `SET NULL`

### Dynamic (per Generated Table)

- `PRIMARY KEY id` auto-increment
- `INDEX` untuk tiap FK column (`categoryId`, `customerId`)
- `UNIQUE` jika `fields.unique=true` (mis. `email` di `customers` jika spec `unique`)
- `INDEX` untuk `searchField` (DataTable global search 320px) & `indexes` JSON

---

## Migration Strategy

### Platform (Prisma Migrate)

- Dev: `npx prisma migrate dev --name add_<feature>` (auto-sync + generate client). Reset: `rm apps/web/dev.db && rm -rf apps/web/prisma/migrations && npx prisma migrate dev --name init`.
- Production: `npx prisma migrate deploy` (apply pending `prisma/migrations/*`). Client `app/generated/prisma` via `@prisma/adapter-libsql`.
- Workflow incremental: `npx prisma migrate dev --name AiBuilderAddX` → edit `prisma/schema.prisma` → `prisma generate`. **Hanya untuk platform tables.**

### Dynamic (per Prompt, NO migration file)

- **Tidak via `prisma/migrations`** — `ai_data_models` → `prisma.$executeRawUnsafe('CREATE TABLE ...')` di `lib/services/ai-builder/codegen.service.ts` (controlled, transactional).
- Refine `tambahkan barcode ke produk` → `prisma.$executeRawUnsafe('ALTER TABLE "{slug}_products" ADD COLUMN "barcode" TEXT')`, never `DROP COLUMN` pada refine (additive only). Hapus project → `prisma.$executeRawUnsafe('DROP TABLE "{slug}_{entity}"')` per entity (cascade).
- Backup: platform backup `dev.db` sudah include dynamic tables (single file). Restore: `SELECT COUNT(*) FROM ai_data_models WHERE schemaId=?` untuk verifikasi DDL vs META.
- Rollback dynamic: jika generation `failed`, `prisma.$transaction` rollback, `ai_generations.error` diisi, `ai_projects.status=failed`.

---

## Data Integrity Rules

### Platform

1. Slug generation `^[a-z0-9]+(?:-[a-z0-9]+)*$`, unique, lower-hyphen, collision → `-2`
2. `AiGeneration` harus punya `projectId`; `spec` JSON valid `AiAppSchemaSchema` (Zod)
3. `AiDataModel.fields` JSON valid `FieldDef[]` (Zod `FieldDefSchema` di `lib/dto/ai-builder.dto.ts`)
4. `AiProject.status` hanya enum `drafting`/`generating`/`ready`/`failed`
5. Seed platform idempotent — check existence sebelum insert

### Dynamic

6. Generated table names `^[a-z0-9]+_[a-z0-9_]+$` (`{slug_snake}_{entity_snake}`) lower_snake, collision across slugs impossible due prefix, within slug UNIQUE
7. Generated columns: `id` auto PK + `createdAt`/`updatedAt` DATETIME default + fields dari spec (required → `NOT NULL`, `enumValues` → `CHECK`)
8. FK ke dynamic tables lain harus target exist dalam same slug, `ON DELETE SET NULL` / `CASCADE` sesuai `relations.onDelete`, `INDEX` wajib
9. Dynamic seed idempotent — `SELECT COUNT(*) FROM {slug}_{entity} WHERE 1` → if 0 then insert 5-10 rows realistis (bukan `test1`), else skip
10. Dynamic DDL harus transactional — `queryRunner.startTransaction()` → `createTable` → `commit`, on error `rollback` + mark `failed`

---

## Change Log

### AI App Builder — Dynamic Database (2026-09-15)

- **PIVOT DB dari default tables → 100% dynamic per prompt.** Overview: `17 schemas / ~23 tabel` (dengan contoh hardcode) → `~14 platform tables static + N dynamic {slug}_{entity}` (0 di awal, N setelah prompt). Current vs Planned: `CURRENT 17` + `PLANNED dynamic incremental` → `CURRENT PLATFORM ~14` + `DYNAMIC per prompt runtime`. ERD: split Platform (static) vs Dynamic Virtual (per prompt). Entity Details: judul `Platform Tables (Static)` + `Builder META (Static)` vs sebelumnya `Builder (11-18)` dengan contoh hardcode. **HILANGKAN**: `## Generated Tables` hardcode `pos_kasir_products` (5 baris fixed) — diganti `## Dynamic App Tables` kontrak lengkap (naming, field type mapping SQLite, relation handling FK, index strategy, DDL generation via queryRunner, contoh virtual label `CONTOH DINAMIS BUKAN FIXED`). Seed: `pos_kasir_products` rows dihapus — hanya `users/roles/permissions/guards` + `Builder Templates META` (contoh prompt di `ai_projects`, bukan tabel fisik). Relationships: split Platform vs Dynamic Virtual. Indexes: split Platform vs Dynamic per FK. Migration Strategy: split Platform (baseline) vs Dynamic (NO migration file, queryRunner transactional). Data Integrity: split Platform 1-5 vs Dynamic 6-10 (table names, FK, seed idempotent, transactional DDL).

### Stack Migration — Next.js + React (2026-09-15)

- MIGRASI paths `server/*` → `lib/db/*`, `instrumentation.ts`, `lib/services/ai-builder/*`. Overview, Current vs Planned, Relationships, Indexes, Seed source, MigrationStrategy semua diupdate ke Next.js.

### AI App Builder — Platform Pivot (2026-09-15)

- PIVOT dari 9 schemas/12 tabel RBAC-Only ke 17 schemas/~23 tabel (RBAC 9 + Builder 8). Baru: Builder META, Generated Tables, Relationships, Indexes, Migration Strategy additive.

