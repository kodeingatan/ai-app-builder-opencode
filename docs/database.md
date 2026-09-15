# Database Structure — AI App Builder Platform

## Overview

- **Database Engine**: SQLite (via `better-sqlite3`)
- **ORM**: TypeORM 1.1 (`EntitySchema` pattern; **17 EntitySchemas / ~23 physical tables**: RBAC 9 schemas / 12 tables + Builder 8 schemas / +11 tables)
- **Database File**: `apps/web/db.sqlite`
- **Migrations**: `synchronize: true` dev (default, override `DB_SYNCHRONIZE`), `synchronize: false` + `migrationsRun: true` production. Baseline `server/migrations/1788914913928-Baseline.ts` (RBAC) + `server/migrations/<ts>-AiBuilder.ts` (Builder 8 schemas) auto-run via `getDataSource()`. Drift → `MIGRATION_DRIFT` via `server/utils/migration-status.ts`. CLI: `npm run migration:generate -- <Name>` / `migration:run` / `migration:revert` (detail `docs/production-runbook.md` §1). BR-001: never edit applied migration.
- **Seed**: idempotent via `server/plugins/database.server.ts` (RBAC + Builder templates)
- **Startup gating**: dev `synchronize:true` suppress `JWT_SECRET_DEFAULT` + `MIGRATION_DRIFT` warns (Task 24); prod fatals.

---

## Current vs Planned

- **CURRENT DATABASE (v1 AI Builder)**: 17 schemas / ~23 tabel fisik — RBAC foundation (9 schemas) + Builder (8 schemas). Lihat § Entity Details & § Builder Entities.
- **PLANNED**: schema baru untuk generated apps: tiap `AiProject` generate EntitySchemas dinamis di `server/entities/generated/{slug}/` — tidak dihitung di baseline, diregistrasi runtime di `appEntities` via `orm-data-source.ts` (generated schemas di-import dinamis atau di-register via `getGeneratedEntities(slug)`). Future builder schema changes ship sebagai additive migration baru setelah baseline builder.

---

## Entity Relationship Diagram — RBAC (9 schemas)

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

## Entity Relationship Diagram — Builder (8 schemas)

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

Generasi dinamis: `ai_data_models` tiap row → `server/entities/generated/{slug}/{entity}.entity.ts` + tabel fisik `"{slug}_{entity}"` (mis. `pos_kasir_products`).

---

## Entity Details — RBAC (1-9 + junctions)

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

## Entity Details — Builder (11-18)

### 11. ai_projects

Container aplikasi yang di-generate.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID |
| `name` | VARCHAR(100) | NOT NULL | `Kasir POS` |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE | `pos-kasir` URL-safe lowercase hyphen |
| `initialPrompt` | TEXT | NOT NULL | prompt pertama |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'drafting' | `drafting`/`generating`/`ready`/`failed` |
| `previewUrl` | VARCHAR(500) | NULLABLE | `/generated/pos-kasir` |
| `ownerId` | INTEGER | NULLABLE, FK→users.id ON DELETE SET NULL | pembuat project |
| `createdAt` | DATETIME | | |
| `updatedAt` | DATETIME | | |

Indexes: PK id, UNIQUE slug, INDEX ownerId, INDEX status.

**Business rule**: slug auto-generate dari name + collision suffix `-2`.

### 12. ai_prompts

Riwayat prompt per project (versioning).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `projectId` | INTEGER | NOT NULL, FK→ai_projects.id ON DELETE CASCADE | |
| `promptText` | TEXT | NOT NULL | teks asli user |
| `inferredIntent` | TEXT | NULLABLE (JSON) | hasil inference (domain, entities, pages, roles) |
| `version` | INTEGER | NOT NULL, DEFAULT 1 | increment per project |
| `createdAt` | DATETIME | | |

Indexes: PK id, INDEX projectId, UNIQUE(projectId, version).

### 13. ai_generations

Satu run generation (queued → running → success/failed).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `projectId` | INTEGER | NOT NULL, FK→ai_projects.id ON DELETE CASCADE | |
| `promptId` | INTEGER | NULLABLE, FK→ai_prompts.id ON DELETE SET NULL | prompt pemicu |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'queued' | `queued`/`running`/`success`/`failed` |
| `spec` | TEXT | NULLABLE (JSON) | snapshot AiAppSchema saat generation |
| `error` | TEXT | NULLABLE | error message jika failed |
| `durationMs` | INTEGER | NULLABLE | lama generation ms |
| `createdAt` | DATETIME | | |
| `updatedAt` | DATETIME | | |

Indexes: PK id, INDEX projectId, INDEX status.

### 14. ai_app_schemas

Blueprint aplikasi (1 per successful generation).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `generationId` | INTEGER | NOT NULL, UNIQUE, FK→ai_generations.id ON DELETE CASCADE | |
| `entities` | TEXT | NOT NULL (JSON) | array entity definitions |
| `pages` | TEXT | NOT NULL (JSON) | array page definitions |
| `roles` | TEXT | NOT NULL (JSON) | array role definitions |
| `flows` | TEXT | NULLABLE (JSON) | business flows |
| `apiContract` | TEXT | NULLABLE (JSON) | endpoints contract |
| `createdAt` | DATETIME | | |

### 15. ai_data_models

Model data yang di-generate (per entity).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `schemaId` | INTEGER | NOT NULL, FK→ai_app_schemas.id ON DELETE CASCADE | |
| `name` | VARCHAR(100) | NOT NULL | `Product` |
| `slug` | VARCHAR(100) | NOT NULL | `products` (table slug) |
| `fields` | TEXT | NOT NULL (JSON) | `[{name:"price", type:"decimal", required:true, ...}]` |
| `relations` | TEXT | NULLABLE (JSON) | `[{type:"ManyToOne", target:"Category", field:"categoryId"}]` |
| `indexes` | TEXT | NULLABLE (JSON) | `["name","categoryId"]` |
| `createdAt` | DATETIME | | |

Indexes: PK id, INDEX schemaId, UNIQUE(schemaId, slug).

**Field type enum** (di JSON): `string`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `enum`, `relation`.

### 16. ai_pages

Halaman yang di-generate.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `schemaId` | INTEGER | NOT NULL, FK→ai_app_schemas.id ON DELETE CASCADE | |
| `route` | VARCHAR(255) | NOT NULL | `/generated/pos-kasir/products` |
| `title` | VARCHAR(100) | NOT NULL | `Produk` |
| `type` | VARCHAR(20) | NOT NULL | `dashboard`/`list`/`detail`/`form`/`report` |
| `componentTree` | TEXT | NOT NULL (JSON) | `{"root":"PageShell","children":["DataTable","FormModal"]}` |
| `createdAt` | DATETIME | | |

Indexes: PK id, INDEX schemaId.

### 17. ai_component_specs

Spec komponen reusable.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `schemaId` | INTEGER | NOT NULL, FK→ai_app_schemas.id ON DELETE CASCADE | |
| `name` | VARCHAR(100) | NOT NULL | `ProductTable` |
| `type` | VARCHAR(50) | NOT NULL | `DataTable`/`FormModal`/`DetailDrawer`/`StatCard`/`FilterBar` |
| `props` | TEXT | NOT NULL (JSON) | props spec |
| `tokens` | TEXT | NULLABLE (JSON) | design tokens override |
| `createdAt` | DATETIME | | |

### 18. ai_deployments

Info preview/deploy.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `projectId` | INTEGER | NOT NULL, FK→ai_projects.id ON DELETE CASCADE | |
| `env` | VARCHAR(20) | NOT NULL | `preview`/`production` |
| `url` | VARCHAR(500) | NOT NULL | `/generated/pos-kasir` atau external URL |
| `builtAt` | DATETIME | NOT NULL | |
| `createdAt` | DATETIME | | |

### 19. activity_logs

Audit trail (tetap).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `userId` | INTEGER | NULLABLE, FK→users.id ON DELETE SET NULL | |
| `action` | VARCHAR | NOT NULL | CREATE/UPDATE/DELETE/LOGIN/GENERATE/REFINE |
| `entity` | VARCHAR | NOT NULL | User/Role/AiProject/AiGeneration/Product/... |
| `entityId` | INTEGER | NULLABLE | |
| `description` | TEXT | NULLABLE | |
| `metadata` | TEXT | NULLABLE | JSON before/after |
| `ipAddress` | VARCHAR | NULLABLE | |
| `userAgent` | VARCHAR | NULLABLE | |
| `level` | VARCHAR(20) | DEFAULT 'INFO' | INFO/WARNING/ERROR |
| `createdAt` | DATETIME | | |

Tambah action `GENERATE`, `REFINE` + entity `AiProject`, `AiGeneration`.

### 20. settings

Key-value (tetap).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK | ID |
| `key` | VARCHAR(100) | UNIQUE | |
| `value` | TEXT | NOT NULL | |
| `createdAt` | DATETIME | | |
| `updatedAt` | DATETIME | | |

Seed tambahan: `builder_default_template = pos-kasir`, `ai_inference_provider = stub`.

### Generated Tables (Dynamic per Project)

Contoh untuk `pos-kasir`:

| Tabel Fisik | Kolom Contoh | Keterangan |
|-------------|--------------|------------|
| `pos_kasir_products` | id, name, price, stock, categoryId (FK), createdAt | dari AiDataModel `Product` |
| `pos_kasir_categories` | id, name, description | |
| `pos_kasir_transactions` | id, customerId, total, status, createdAt | |
| `pos_kasir_customers` | id, name, phone, email | |

Naming: `{slug_snake}_{entity_snake}`. FK ke generated tables lain via `AiDataModel.relations`. Index otomatis untuk FK + `searchField`.

---

## Seed Data — RBAC (Sumber kebenaran: `server/services/seeder.service.ts`)

### Users

| id | username | email | password | roles |
|----|----------|-------|----------|-------|
| 1 | admin | admin@admin.com | P455w0rd!!! | Super Admin |
| 2 | editor | editor@example.com | P455w0rd!!! | Editor |
| 3 | viewer | viewer@example.com | P455w0rd!!! | Viewer |
| 4 | manager | manager@example.com | P455w0rd!!! | Manager |
| 5 | guest | guest@example.com | P455w0rd!!! | Guest |

### Roles / Guards / Permissions

Sama seperti sebelumnya (7 roles, 8 guards, 10 permissions). Lihat ringkasan di `docs/PRD.md` §22.

**Tambahan Builder Permissions** (seed baru):

| id | permissionName | methods | urls |
|----|----------------|---------|------|
| 11 | Builder Generate | POST | `/api/builder/generate`, `/api/builder/refine` |
| 12 | Builder Read | GET | `/api/builder/projects/*`, `/api/builder/generations/*`, `/api/builder/templates` |
| 13 | Builder Manage | DELETE | `/api/builder/projects/*` |
| 14 | Generated Read | GET | `/api/*/*` (atau granular per slug) |
| 15 | Generated Write | POST,PUT,DELETE | `/api/*/*` |

Assignment: Super Admin → semua; Admin → Builder Generate/Read + Generated Write; Builder User (role baru) → Builder Generate/Read + Generated Write own slug; Viewer → Generated Read.

### Builder Templates Seed

| slug | name | prompt | entities JSON | roles JSON |
|------|------|--------|---------------|------------|
| pos-kasir | Kasir POS | buatkan aplikasi kasir | Product, Category, Transaction, Customer | Admin, Kasir |
| crm-klinik | CRM Klinik | buatkan CRM klinik | Patient, Doctor, Appointment, Record | Admin, Dokter |
| todo-share | Todo Share | todo app share | Todo, Project, ShareLink | Owner, Member |
| inventory | Inventory Gudang | aplikasi inventory | Item, Warehouse, Movement | Admin, Staff |
| sekolah | Sekolah | aplikasi sekolah | Student, Teacher, Class, Attendance | Admin, Guru |

Dipakai untuk `GET /api/builder/templates` + fallback inference jika LLM stub tidak kenal domain.

---

## Relationships Summary — Builder

```
users ──< ai_projects (owner)
ai_projects ──< ai_prompts
ai_projects ──< ai_generations
ai_generations ──1 ai_app_schemas
ai_app_schemas ──< ai_data_models
ai_app_schemas ──< ai_pages
ai_app_schemas ──< ai_component_specs
ai_projects ──< ai_deployments
ai_generations ── ai_prompts (via promptId, nullable)
```

Cardinalities:

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

---

## Indexes & Constraints — Builder

- `ai_projects.slug` UNIQUE + `ai_projects.status` index (filter ready)
- `ai_prompts` UNIQUE(projectId, version)
- `ai_generations.status` index (queue monitoring)
- `ai_data_models` UNIQUE(schemaId, slug)
- `ai_pages.route` index (optional lookup)
- Semua FK `ON DELETE CASCADE` kecuali `ownerId`/`promptId`/`userId` → `SET NULL`

---

## Migration Strategy

- Dev: `synchronize: true` (auto-sync, no migration file needed). Reset: `rm apps/web/db.sqlite`.
- Production: `synchronize: false`, `migrationsRun: true`. Baseline RBAC + builder baseline auto-apply at boot; drift fail-fast.
- Generated tables: tidak di-migrate via file — dibuat runtime via `synchronize` atau `queryRunner.createTable` di `codegen.service.ts` (controlled, additive only). Refine tidak drop column, hanya `ADD COLUMN` atau create new table.
- Workflow incremental: `npm run migration:generate -- AiBuilderAddX` → wire di `orm-data-source.ts` `appMigrations`.

---

## Data Integrity Rules

1. Slug generation harus `^[a-z0-9]+(?:-[a-z0-9]+)*$`, unique, lower-hyphen.
2. `AiGeneration` harus punya `projectId`; `spec` JSON valid (Zod `AiAppSchemaSchema`).
3. `AiDataModel.fields` JSON harus valid `FieldDef[]` (Zod di DTO).
4. Generated table names snake_case + prefix slug untuk avoid collision.
5. `AiProject.status` hanya enum drafting/generating/ready/failed.
6. Seed idempotent — check existence sebelum insert.

---

## Change Log

### AI App Builder — Platform Pivot (2026-09-15)

- **PIVOT** dari 9 schemas/12 tabel RBAC-Only ke **17 schemas/~23 tabel** (RBAC 9 + Builder 8: AiProject, AiPrompt, AiGeneration, AiAppSchema, AiDataModel, AiPage, AiComponentSpec, AiDeployment).
- **Baru**: § Entity Details Builder (11-18), § Builder Templates Seed, § Generated Tables (dynamic per slug), § Relationships Builder, § Indexes Builder, § Migration Strategy (generated tables additive). Entity diagram builder baru. Activity logs tambah action GENERATE/REFINE.
- **Dipertahankan**: RBAC entities 1-10 + seed RBAC eksak.

### Docs Tidy — Seed selaras seeder (2026-09-13)

- Seed 5 users, 7 roles, 8 guards, 10 permissions + junctions lengkap.

### Task 01 — Platform Scope Reduction (2026-09-12)

- Removed Dynamic Administration 14 tabel — diarsip git history.

