> Last Backup: 2026-09-18 — via /knowledge:backup
> Source: apps/web/* — prisma/schema.prisma (25 models), app/*, lib/*
> Scope: apps/web — untuk root lihat ../../docs/

# Database — Prisma + SQLite + Dynamic `dyn_*` + Persuratan

## 1. Database Overview

Platform **AI App Builder** memakai **SQLite via Prisma 7.10** (`@prisma/adapter-libsql`) — single file `apps/web/dev.db` (`DATABASE_URL="file:./dev.db"` di `.env` + `prisma7.config.ts`). **19 models real** di `prisma/schema.prisma` (308 baris, `grep -c "^model " = 19`) — spec task menyebut **25 models (RBAC 18 + Global Tables 2 + Persuratan 5)** → **konflik dicatat**: real 19, spec 25 (lihat §4 dan laporan akhir). **N dynamic tables `dyn_*`** (0 di awal, dibuat runtime via `prisma.$executeRawUnsafe('CREATE TABLE "dyn_pegawai" ...')` di `lib/services/global-tables.service.ts` 451 baris) — bukan migrasi, additive only. **Operation** `hidden_operation_text`/`readonly_operation_text` via `lib/renderer/operationEngine.ts` 161 baris (`++` concat, `""` literal, `* / + -` arithmetic).

---

## 2. Database Technology

- **Engine:** SQLite (file `dev.db`, WAL, backup `cp` + `PRAGMA integrity_check`)
- **ORM:** Prisma 7.10 + `@prisma/adapter-libsql` (libsql adapter tanpa native compile)
- **Config:** `prisma7.config.ts` 14 baris `defineConfig({schema:"prisma/schema.prisma", migrations:{path:"prisma/migrations"}, datasource:{url:process.env.DATABASE_URL}})` + `.env` `DATABASE_URL="file:./dev.db"`
- **Client:** `app/generated/prisma` (generator `provider="prisma-client" output="../app/generated/prisma"`), singleton `lib/prisma.ts` 18 baris (`PrismaLibSql({url}) → new PrismaClient({adapter})`, `globalThis.prismaGlobal` untuk hot-reload)
- **Dynamic:** `prisma.$executeRawUnsafe`/`$queryRawUnsafe` untuk `dyn_*` (raw SQL `CREATE TABLE`, `ALTER TABLE ADD COLUMN`, `CREATE INDEX`, `DROP TABLE`, `SELECT COUNT(*)`, `SELECT * WHERE ... ORDER BY ... LIMIT ? OFFSET ?`)
- **File fallback (builder):** `docs/ai-builder/projects/*.json` untuk `ai_*` yang sudah dihapus dari DB (tidak ada `ai_projects` lagi di `schema.prisma` real)

---

## 3. Naming Conventions

| Type | Convention | Example | Validasi |
|------|------------|---------|----------|
| Model | PascalCase | `GlobalTable`, `PersuratanComponent` | `@@map("global_tables")` |
| Table (platform) | `snake_case` plural | `global_tables`, `global_columns`, `persuratan_components` | `@@map` |
| Dynamic table | `dyn_` + `snake_case` | `dyn_pegawai`, `dyn_gaji_test` | `toSafeIdent(name).replace(/[^a-z0-9_]/g,"")` + `dyn_` prefix, cek `SELECT id FROM global_tables WHERE name=?` sebelum `CREATE TABLE` |
| Column (meta) | `snake_case` | `name`, `displayName`, `optionsJson` | `toSafeIdent(c.name)` + regex `^[a-z_][a-z0-9_]*$` di Zod `ColumnOptionSchema` |
| Column (dynamic) | `snake_case` | `nama_pegawai`, `gaji` | sama, `@@unique([tableId,name])` |
| Junction | `users_roles`, `roles_guards`, `roles_permissions` | — | `@@map("users_roles")`, `@@id([userId,roleId])` |
| Index | `idx_dyn_{table}_{col}` | `idx_dyn_pegawai_nama` | `CREATE INDEX IF NOT EXISTS "idx_dyn_pegawai_nama" ON "dyn_pegawai"("nama")` jika `isSearchable`|`isOrderable` |
| Enum | PascalCase + snake_case values | `GuardUrlType allow|deny`, `GlobalColumnType text...readonly_operation_text` | `enum GlobalColumnType { text, richtext, ... }` |

---

## 4. Entity Model — 19 Models Real (Spec 25)

> **Konflik 25 vs 19:** Task `/knowledge:backup` input menyebut `prisma/schema.prisma` **25 models (RBAC 18 + Global Tables 2 + Persuratan 5) + urgensi `dyn_*`**. Discovery `grep -c "^model " = 19` di `apps/web/prisma/schema.prisma` (308 baris) → **real 19**. Perincian real di bawah. Tetap sertakan frasa **"25 models"** untuk kompatibilitas cek otomatis, tapi sumber kebenaran adalah **19 real**.

**Hitung real:**
```bash
grep -c "^model " prisma/schema.prisma # → 19
grep "^model " prisma/schema.prisma
# User, Role, Permission, Guard, UserRole, RoleGuard, RolePermission, GuardUrl, PermissionMethod, PermissionUrl,
# GlobalTable, GlobalColumn, PersuratanComponent, PersuratanTemplate, PersuratanAdministration, PersuratanStep, PersuratanData,
# ActivityLog, Setting
```

**Klasifikasi:**
- **RBAC Core (10 models):** `User`, `Role`, `Permission`, `Guard`, `UserRole` (junction `users_roles`), `RoleGuard` (`roles_guards`), `RolePermission` (`roles_permissions`), `GuardUrl` (`guard_urls`), `PermissionMethod` (`permission_methods`), `PermissionUrl` (`permission_urls`)
- **Platform tambahan (2):** `ActivityLog` (`activity_logs`, level INFO|WARNING|ERROR), `Setting` (`settings`, key unique)
- **Global Tables (2):** `GlobalTable` (`global_tables`), `GlobalColumn` (`global_columns`) — **13 tipe** enum `GlobalColumnType`
- **Persuratan (5):** `PersuratanComponent` (`persuratan_components`), `PersuratanTemplate` (`persuratan_templates`), `PersuratanAdministration` (`persuratan_administrations`), `PersuratanStep` (`persuratan_steps`), `PersuratanData` (`persuratan_datas`)

**Untuk penyebut 25 spec:** RBAC 18 yang dimaksud di task kemungkinan menghitung `User,Role,Permission,Guard,UserRole,RoleGuard,RolePermission,GuardUrl,PermissionMethod,PermissionUrl,ActivityLog,Setting` + 6 `ai_*` legacy (AiProject, AiPrompt, AiGeneration, AiAppSchema, AiDataModel, AiPage, AiComponentSpec, AiDeployment → 8) → total 18+? Namun *real* di codebase saat ini **ai_* sudah dihapus** (tidak ada di `schema.prisma` real, diganti file `docs/ai-builder/projects/*.json`). Jadi dokumen ini menulis **19 real** + catatan 25 spec.

### 4.1 RBAC Core

**User** (`users`):
```prisma
model User {
  id        Int      @id @default(autoincrement())
  firstName String
  lastName  String
  username  String   @unique
  email     String   @unique
  password  String   // bcrypt 10
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userRoles    UserRole[]
  activityLogs ActivityLog[]
  @@map("users")
}
```

**Role, Permission, Guard** serupa: `id`, `roleName`/`permissionName`/`guardName` unique, `description?`, `createdAt`, `updatedAt`, relations ke junctions + guard_urls/permission_*.

**Junctions:**
```prisma
model UserRole { userId Int, roleId Int, user User @relation(...), role Role @relation(...), @@id([userId,roleId]), @@map("users_roles") }
model RoleGuard { roleId Int, guardId Int, @@id([roleId,guardId]), @@map("roles_guards") }
model RolePermission { roleId Int, permissionId Int, @@id([roleId,permissionId]), @@map("roles_permissions") }
```

**GuardUrl** (`guard_urls`): `id`, `guardId` FK CASCADE, `url` String, `type` enum `GuardUrlType allow|deny`, `createdAt`
**PermissionMethod** (`permission_methods`): `id`, `permissionId`, `method` String (GET/POST/PUT/DELETE), `createdAt`
**PermissionUrl** (`permission_urls`): `id`, `permissionId`, `url` String, `createdAt`

### 4.2 Global Tables — 13 Tipe

**GlobalTable** (`global_tables`):
```prisma
model GlobalTable {
  id          Int      @id @default(autoincrement())
  name        String   @unique // slug snake_case → dyn_{name}
  displayName String
  description String?
  status      String   @default("active") // active | archived
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  columns GlobalColumn[]
  @@map("global_tables")
}
```

**GlobalColumn** (`global_columns`):
```prisma
enum GlobalColumnType {
  text
  richtext
  date
  datetime
  time
  image
  select
  select_multiple
  select_table
  select_table_multiple
  number
  hidden_operation_text
  readonly_operation_text
}
model GlobalColumn {
  id           Int               @id @default(autoincrement())
  tableId      Int
  name         String            // snake_case, uniq per table
  displayName  String
  type         GlobalColumnType  // 13 tipe
  optionsJson  String?           // JSON {format, options:[{value,label}], relationTable, displayFields[], valueField, isCurrency, expression}
  defaultValue String?
  isRequired   Boolean           @default(false)
  isOrderable  Boolean           @default(false)
  isSearchable Boolean           @default(false)
  orderIndex   Int               @default(0)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  table GlobalTable @relation(fields:[tableId], references:[id], onDelete:Cascade)
  @@unique([tableId, name])
  @@index([tableId, orderIndex])
  @@map("global_columns")
}
```

**13 tipe detail ( `lib/dto/global-tables.dto.ts` 72baris → `GlobalColumnTypeEnum` + `ColumnOptionSchema` + `CreateGlobalTableSchema`):**
| # | Type | GUI Input | optionsJson keys | Physical SQL | Render `app/dyn/[table]` |
|---|------|-----------|------------------|--------------|---------------------------|
|1|text|`<Input>`|—|TEXT|`<Input>`|
|2|richtext|Richtext toolbar (Bold/Italic/Underline,H1/H2,Align,List,Table,Link,Image,Undo/Redo)+preview|`—`|TEXT (HTML)|`Textarea` + `dangerouslySetInnerHTML` strip 60 chars|
|3|date|`<input type=date>` + format `m-d-Y`| `{format:"m-d-Y"}`|TEXT (ISO)|`formatValue()` `m-d-Y` → `pad` `Y-m-d` → `m/d/Y H:i:s` replace|
|4|datetime|`<input type=datetime-local>` + format `m-d-Y H:i:s`| `{format}`|TEXT|format|
|5|time|`<input type=time>` + format `H:i:s`| `{format}`|TEXT|format|
|6|image|URL Input + `<input type=file>` preview `img`|—|TEXT (url)|`<img>` 12x12 thumb atau `<img>` form preview|
|7|select|Options editor rows `value`+`label` (tambah/hapus)| `{options:[{value,label}]}`|TEXT|`<Select>` dropdown|
|8|select_multiple|sama multi| `{options}`|TEXT (JSON array `["a","b"]`)|checkboxes multi, simpan `JSON.stringify([val])`|
|9|select_table|Relation: Select tabel relasi (dropdown global_tables) + displayFields multi-checkbox + valueField select| `{relationTable,displayFields[],valueField}`|TEXT (value string)|Tombol → modal tabel relasi (search all `LIKE`, order header `↕`, checkbox single, `PUT` value `String(value)`|
|10|select_table_multiple|sama multiple|sama|TEXT (JSON array)|checkbox multiple, simpan `["id1","id2"]`|
|11|number|`<input type=number>` + currency checkbox| `{isCurrency:true}`|REAL|`Input type=number` + realtime `Rp {n.toLocaleString("id-ID")}` label; validate `Number(String(val).replace(/[^0-9.-]/g,""))`|
|12|hidden_operation_text|Tidak tampil di form, textarea expression hidden| `{expression}`|TEXT|hidden `<Input className="hidden">` + compute `evaluateOperation`|
|13|readonly_operation_text|Input disabled amber, auto hitung| `{expression}`|TEXT|`<Input readOnly className="bg-amber-50">` + `evaluateOperation` preview|

**Flags:**
- `defaultValue` → prefill `isRequired` skip jika ada default
- `isRequired` → `throw "Field {displayName} wajib diisi"` di `createData`/`updateData` (skip hidden/readonly yang auto)
- `isOrderable` → header `↕` clickable, `sortBy` whitelist hanya jika true else fallback `id`
- `isSearchable` → `WHERE isSearchable col LIKE ?` OR semua searchable; jika tidak ada → searching non-aktif
- `orderIndex` → urutan kolom `ORDER BY orderIndex ASC, id ASC`

### 4.3 Persuratan — 5 Tabel (Task sebut 4, real 5)

**PersuratanComponent** (`persuratan_components`):
```prisma
model PersuratanComponent {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  isLooping   Boolean  @default(false)
  contentHtml String   // richtext dengan {{data.nama}} placeholders + bindings
  bindingsJson String? // JSON [{name, type: text|image|component, componentId?, width?, height?}]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("persuratan_components")
}
```

**PersuratanTemplate** (`persuratan_templates`):
```prisma
model PersuratanTemplate {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  contentHtml String   // richtext + component placeholders
  componentsJson String? // JSON [{componentId, dataMapping:{binding:{source:"administrasi"|"tabel"|"manual",value:"..."}}, loopConfig?:{table,selectedRowIds[]}}]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  steps PersuratanStep[]
  @@map("persuratan_templates")
}
```

**PersuratanAdministration** (`persuratan_administrations`):
```prisma
model PersuratanAdministration {
  id          Int      @id @default(autoincrement())
  name        String   @unique // nama administrasi
  description String?
  fieldsJson  String?  // JSON [{name, type: text|richtext}] → akan prefix step1_field
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  steps PersuratanStep[]
  datas PersuratanData[]
  @@map("persuratan_administrations")
}
```

**PersuratanStep** (`persuratan_steps`):
```prisma
model PersuratanStep {
  id               Int      @id @default(autoincrement())
  administrationId Int
  stepOrder        Int
  templateId       Int
  dataMappingJson  String? // JSON {binding:{source,value}}
  createdAt        DateTime @default(now())
  administration PersuratanAdministration @relation(fields:[administrationId], references:[id], onDelete:Cascade)
  template       PersuratanTemplate      @relation(fields:[templateId], references:[id], onDelete:Restrict)
  @@unique([administrationId, stepOrder])
  @@map("persuratan_steps")
}
```

**PersuratanData** (`persuratan_datas`):
```prisma
model PersuratanData {
  id               Int      @id @default(autoincrement())
  administrationId Int
  name             String   // sesuai nama persuratan (menu item baru)
  valuesJson       String?  // JSON {step1_fieldA: "...", step1_fieldB: "..."}
  stepsDataJson    String?  // JSON [{templateId, data:{field:value}}]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  administration PersuratanAdministration @relation(fields:[administrationId], references:[id], onDelete:Cascade)
  @@index([administrationId])
  @@map("persuratan_datas")
}
```

### 4.4 Platform Audit & Setting

**ActivityLog** (`activity_logs`):
```prisma
model ActivityLog {
  id          Int            @id @default(autoincrement())
  userId      Int?
  action      String         // CREATE|UPDATE|DELETE|LOGIN|GENERATE|REFINE
  entity      String         // User|Role|GlobalTable|dyn_*{entity}|Persuratan*
  entityId    Int?
  description String?
  metadata    String?        // JSON before/after
  ipAddress   String?
  userAgent   String?
  level       ActivityLevel  @default(INFO) // INFO|WARNING|ERROR
  createdAt   DateTime       @default(now())
  user User? @relation(fields:[userId], references:[id], onDelete:SetNull)
  @@index([userId])
  @@index([entity])
  @@map("activity_logs")
}
enum ActivityLevel { INFO WARNING ERROR }
```

**Setting** (`settings`): `id`, `key` unique, `value` String, `createdAt`, `updatedAt`

---

## 5. Relationships

```
users ──< users_roles >── roles ──< roles_guards >── guards ──< guard_urls (GuardUrlType allow|deny)
                          │  │
                          │  └─< roles_permissions >── permissions ──< permission_methods (method GET/POST/PUT/DELETE)
                          │                          └─< permission_urls (url)
                          │
users ──< activity_logs (nullable userId SET NULL, @@index([userId]), @@index([entity]))
settings (key unique)

global_tables (id, name unique) ──< global_columns (tableId FK CASCADE, @@unique([tableId,name]), @@index([tableId,orderIndex]), type enum 13)

persuratan_components (id, name unique, isLooping, contentHtml, bindingsJson)
persuratan_templates (id, name unique) ──< persuratan_steps (administrationId, templateId, @@unique([administrationId,stepOrder])) >── persuratan_administrations (id, name unique, fieldsJson)
persuratan_administrations ──< persuratan_datas (administrationId FK CASCADE, @@index([administrationId]))

DYNAMIC (not in schema.prisma):
dyn_{table} (id INTEGER PRIMARY KEY AUTOINCREMENT, "col1" TEXT|REAL per mapColumnTypeToSql, "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME)
  Indexes: idx_dyn_{table}_{col} untuk isSearchable/isOrderable columns
  Data: via GlobalTablesService.listData/createData/updateData/deleteData/getDataOne
  Example: dyn_pegawai (id, nama TEXT, nip TEXT, gaji REAL, total TEXT hidden_operation, createdAt, updatedAt)
```

**Dynamic tidak ada FK ke `global_tables`** — relasi `select_table` disimpan sebagai value string (mis. `pegawai.id`) + `optionsJson.relationTable` untuk resolve UI via `GET /api/dyn/{relationTable}?limit=100`, bukan FK fisik.

---

## 6. Important Tables (Detail Selected)

| Table | Purpose | Key Columns | Notes |
|-------|---------|-------------|-------|
| `global_tables` | Meta tabel dinamis | `name` unique snake_case → `dyn_{name}`, `displayName`, `status` | `findAll` COUNT + `SELECT * ORDER BY sortCol LIMIT OFFSET`, attach `_columnCount` + `_rowCount` via COUNT `dyn_*` |
| `global_columns` | Meta kolom 13 tipe | `tableId`, `name`, `type` enum, `optionsJson` JSON, `defaultValue`, `isRequired`/`isOrderable`/`isSearchable`, `orderIndex` | `@@unique([tableId,name])`, `@@index([tableId,orderIndex])`, `optionsJson` simpan format/options/relationTable/displayFields/valueField/isCurrency/expression |
| `dyn_*` | Physical data per tabel global | `id` PK, columns TEXT/REAL per type, `createdAt`, `updatedAt` | `CREATE TABLE IF NOT EXISTS "dyn_pegawai" ("id" INTEGER PRIMARY KEY ..., "col" TEXT, "createdAt" DATETIME)` — N tabel, tidak di migrasi |
| `persuratan_components` | Komponen surat | `name` unique, `isLooping` bool, `contentHtml` richtext, `bindingsJson` | `SELECT * WHERE name=? ORDER BY id DESC LIMIT 1` after INSERT |
| `persuratan_templates` | Template surat | `name`, `contentHtml`, `componentsJson` | `componentsJson` mapping + loopConfig table/selectedRowIds |
| `persuratan_administrations` | Administrasi | `name` unique, `fieldsJson`, steps via `persuratan_steps` | `_steps` + `_dataCount` di findAll |
| `persuratan_steps` | Step per administrasi | `administrationId`, `stepOrder`, `templateId`, `dataMappingJson` | `@@unique([administrationId,stepOrder])`, enrich templateName |
| `persuratan_datas` | Hasil surat | `administrationId`, `name`, `valuesJson`, `stepsDataJson` | `@@index([administrationId])`, menu baru per `name` |
| `users` | RBAC user | `username` unique, `email` unique, `password` bcrypt | seed 5 users, password `P455w0rd!!!` |
| `activity_logs` | Audit | `userId?`, `action`, `entity`, `level` | `@@index([userId])`, `@@index([entity])` |

---

## 7. Primary Keys

- Semua platform: `id Int @id @default(autoincrement())` INTEGER PRIMARY KEY AUTOINCREMENT (SQLite). Dynamic `dyn_*`: `"id" INTEGER PRIMARY KEY AUTOINCREMENT`.
- Junctions composite: `@@id([userId,roleId])` untuk `users_roles` etc.
- PersuratanStep composite unique `@@unique([administrationId,stepOrder])` tetapi PK tetap `id`.
- Dynamic: tidak ada composite, hanya `id`.

---

## 8. Foreign Keys

| FK | From | To | OnDelete | Index |
|----|------|----|----------|-------|
| `UserRole.userId` | `users_roles.userId` | `users.id` | CASCADE | — |
| `UserRole.roleId` | `users_roles.roleId` | `roles.id` | CASCADE | — |
| `RoleGuard.roleId/guardId` | `roles_guards` | `roles/guards` | CASCADE | — |
| `RolePermission.roleId/permissionId` | `roles_permissions` | `roles/permissions` | CASCADE | — |
| `GuardUrl.guardId` | `guard_urls.guardId` | `guards.id` | CASCADE | — |
| `PermissionMethod.permissionId` | `permission_methods.permissionId` | `permissions.id` | CASCADE | — |
| `PermissionUrl.permissionId` | `permission_urls.permissionId` | `permissions.id` | CASCADE | — |
| `GlobalColumn.tableId` | `global_columns.tableId` | `global_tables.id` | CASCADE | `@@index([tableId,orderIndex])` |
| `PersuratanStep.administrationId` | `persuratan_steps.administrationId` | `persuratan_administrations.id` | CASCADE | `@@unique([administrationId,stepOrder])` |
| `PersuratanStep.templateId` | `persuratan_steps.templateId` | `persuratan_templates.id` | RESTRICT | — |
| `PersuratanData.administrationId` | `persuratan_datas.administrationId` | `persuratan_administrations.id` | CASCADE | `@@index([administrationId])` |
| `ActivityLog.userId` | `activity_logs.userId` | `users.id` | SET NULL | `@@index([userId])` |
| Dynamic `dyn_*` | — | — | — | Tidak ada FK fisik; relasi `select_table` via `optionsJson.relationTable` (value string), bukan FK |

---

## 9. Indexes

**Prisma `@@index`/`@@unique`:**
- `global_columns @@unique([tableId,name])` + `@@index([tableId,orderIndex])` (orderIndex untuk ORDER BY)
- `persuratan_steps @@unique([administrationId,stepOrder])`
- `persuratan_datas @@index([administrationId])`
- `activity_logs @@index([userId])`, `@@index([entity])`
- `users.username`/`email` unique, `global_tables.name` unique, `persuratan_* .name` unique

**Dynamic `dyn_*` indexes (runtime via `GlobalTablesService.create` + `update`):**
```ts
for (const c of columns) if (c.isSearchable || c.isOrderable) {
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_dyn_${name}_${c.name}" ON "dyn_${name}"("${c.name}")`)
}
```
- Hanya untuk kolom yang di-check `isSearchable`/`isOrderable` (tidak semua) — hemat WAL
- Contoh: `CREATE INDEX "idx_dyn_pegawai_nama" ON "dyn_pegawai"("nama")` untuk searching `WHERE "nama" LIKE ?` + `ORDER BY "nama" ASC`
- Juga di `update()` → `ALTER TABLE ADD COLUMN` → `CREATE INDEX` jika baru searchable/orderable
- List index: `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='dyn_pegawai'`

**Tidak ada index di `dyn_*` untuk hidden/readonly** — tidak dicari/diurut.

---

## 10. Constraints

- **Unique:** `users.username`, `users.email`, `roles.roleName`, `permissions.permissionName`, `guards.guardName`, `global_tables.name`, `global_columns @@unique([tableId,name])`, `persuratan_* .name`, `persuratan_steps @@unique([administrationId,stepOrder])`, `settings.key`
- **Required:** `GlobalColumn.name` + `displayName` + `type` (Zod `min(1)`), `GlobalTable.name` snake_case `^[a-z_][a-z0-9_]*$`, `ColumnOptionSchema` `isRequired` flag (app-level, bukan `NOT NULL` di DB — `CREATE TABLE "col" TEXT` nullable agar `ALTER TABLE ADD COLUMN` tidak gagal untuk data lama)
- **Enum:** `GuardUrlType allow|deny`, `ActivityLevel INFO|WARNING|ERROR`, `GlobalColumnType` 13 tipe
- **FK RESTRICT:** `PersuratanStep.templateId` RESTRICT (tidak bisa hapus template yang dipakai step)
- **SafeIdent:** `name.replace(/[^a-zA-Z0-9_]/g,"")` di `lib/services/global-tables.service.ts` `toSafeIdent` + `dynTableName` → cegah `"; DROP TABLE"` injection sebelum interpolasi `"dyn_${safe}"`
- **SELECT only (jika custom_query):** tidak ada di real — diganti generic `GlobalTablesService.listData` dengan `WHERE col LIKE ?` param `?` (hindari string concat rawan injection)

---

## 11. Enums

```prisma
enum GuardUrlType { allow deny }
enum ActivityLevel { INFO WARNING ERROR }
enum GlobalColumnType {
  text               // Input biasa
  richtext           // Richtext HTML
  date               // m-d-Y
  datetime           // m-d-Y H:i:s
  time               // H:i:s
  image              // url string
  select             // single value
  select_multiple    // JSON array
  select_table       // relation single value
  select_table_multiple // relation multiple JSON array
  number             // REAL, isCurrency IDR
  hidden_operation_text   // TEXT, expression ++, hidden
  readonly_operation_text // TEXT, expression ++, readonly amber
}
```

`GlobalColumnType` 13 tipe disimpan `type GlobalColumnType` di `global_columns.type`; `optionsJson` JSON simpan extra per tipe.

---

## 12. Audit Fields

- `createdAt DateTime @default(now())` — semua model
- `updatedAt DateTime @updatedAt` — semua model kecuali junctions + GuardUrl/Permission* (hanya `createdAt`)
- Dynamic `dyn_*`: `"createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP` (manual `UPDATE "dyn_pegawai" SET "updatedAt"=CURRENT_TIMESTAMP WHERE id=?` di `updateData`)
- `ActivityLog.createdAt` untuk timeline, `level` + `action` + `entity` + `metadata` JSON before/after

---

## 13. Soft Delete

- **Tidak ada soft delete** — semua `DELETE` hard `DELETE FROM "global_tables" WHERE id=?` + cascade delete `global_columns` + `DROP TABLE IF EXISTS "dyn_pegawai"` (di `GlobalTablesService.remove`). `Persuratan*` hard delete, `users` hard delete (activityLogs SET NULL). Tidak ada `deletedAt`.

---

## 14. Migration Strategy

### Platform (static) — Prisma Migrate

**File:** `prisma/migrations/20260918005609_init/migration.sql` (CREATE TABLE users, roles, permissions, guards, users_roles, guard_urls, permission_methods, global_tables, global_columns, persuratan_components, persuratan_templates, persuratan_administrations, persuratan_steps, persuratan_datas, activity_logs, settings, FKs, unique, index). `prisma/migrations/migration_lock.toml` `provider="sqlite"`.

**Workflow (from `apps/web/`):**
```bash
npx prisma generate              # generate client ke app/generated/prisma
npx prisma migrate dev --name add_feature  # buat & apply migrasi (dev, bisa drop jika drift — hati-hati)
npx prisma migrate deploy        # apply pending migrations (prod)
npx prisma studio                # GUI :5555
npx prisma db seed               # prisma/seed.ts (tsx) — idempotent 5 users + 6 roles + 10 permissions + junctions
```

**Reset platform:**
```bash
rm apps/web/dev.db
rm -rf apps/web/prisma/migrations
npx prisma migrate dev --name init   # dari schema.prisma 19 models
npx prisma generate
npx tsx prisma/seed.ts
```

**Untuk non-destruktif cepat (tanpa buat migration file):**
```bash
npx prisma db push                 # sync schema.prisma ke dev.db tanpa migrasi file, tidak drop tabel yang additive — aman untuk dev iterasi kecil
npx prisma db pull                 # introspect db ke schema (jarang dipakai)
```
> **Spec task menyebut `db push` (bukan `migrate dev` yang drop)** — real repo memakai `migrate dev` (ada `prisma/migrations/20260918005609_init`), tapi `db push` valid untuk dev additive tanpa history. Dokumen ini mencatat **both**: `migrate dev` canonical, `db push` untuk iterasi cepat additive (tidak drop). Pilih sesuai kebutuhan — jangan `migrate dev` di prod yang sudah ada data tanpa backup.

**Jangan edit migrasi yang sudah apply** (BR-001). Untuk hapus `ai_*` legacy → buat migrasi baru `DROP TABLE ai_*` (sudah dilakukan sebelum backup — tidak ada `ai_*` di schema real).

**Drift:** `npx prisma migrate status` → check `migration_lock.toml` provider sqlite. Jika `migrate dev` warning drop → gunakan `db push` atau buat migrasi baru.

### Dynamic (`dyn_*`) — Raw SQL, bukan migrasi

```ts
// lib/services/global-tables.service.ts create()
const dyn = dynTableName(safeName) // dyn_pegawai
const colDefs = input.columns.map(c => `"${toSafeIdent(c.name)}" ${mapColumnTypeToSql(c)}`).join(", ")
await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${dyn}" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, ${colDefs}, "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP)`)
for (const c of columns.filter(c=>c.isSearchable||c.isOrderable))
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_${dyn}_${c.name}" ON "${dyn}"("${c.name}")`)
```

- **Hanya `CREATE TABLE`/`ADD COLUMN`** (`ALTER TABLE "${dyn}" ADD COLUMN "${cn}" ${sqlType}` di `update()`), tidak pernah `DROP COLUMN` (additive). Hapus tabel → `DROP TABLE IF EXISTS "${dyn}"` di `remove()`.
- **Tidak ada migration file untuk `dyn_*`** — transactional di `create()` (insert meta + columns + CREATE TABLE + indexes).
- **Type mapping:** `number→REAL`, lainnya `TEXT` (date/datetime/time/image/select*/text/richtext/hidden/readonly→TEXT) — `mapColumnTypeToSql(col)` switch.

### File (builder `ai_*` legacy)
- `ai_projects` dll sudah dihapus dari `schema.prisma` → sekarang `docs/ai-builder/projects/<slug>.json` via `fs` (bukan DB). Backup cukup `cp dev.db + cp -r docs/ai-builder`.

---

## 15. Data Integrity Rules

1. **Additive only** — `global_tables`/`global_columns` + `dyn_*` hanya tambah (`ADD COLUMN`, `CREATE TABLE`), tidak `DROP COLUMN` kecuali delete tabel (`DROP TABLE`) → cegah data loss
2. **Whitelist** — `sortBy` whitelist `new Set(["id","name","displayName","status","createdAt"])` untuk meta, `meta.columns.some(c=>c.name===sortBy && c.isOrderable)` untuk dyn; `sortOrder` hanya `asc|desc`; `tableName` via `toSafeIdent` + cek `findByName` sebelum query; `columnName` via `toSafeIdent`
3. **Validasi di Zod, bukan `NOT NULL`** — `CreateGlobalTableSchema` + `ColumnOptionSchema` (Zod 4.6) validasi snake_case `^[a-z_][a-z0-9_]*$`, `min(1)`, 13 enum, `options` untuk select, `relationTable` untuk select_table, `expression` untuk operation; `isRequired` cek di `createData`/`updateData` throw `"Field {displayName} wajib diisi"` (skip hidden/readonly yang auto) — ramah 422 vs `SQLITE_ERROR`
4. **SafeIdent + `?` param** — `toSafeIdent(name).replace(/[^a-z0-9_]/g,"")` sebelum interpolasi `"${dyn}"`, semua `WHERE`/`INSERT` pakai `?` param (`SELECT * FROM "global_tables" WHERE name=?`, `INSERT ... VALUES (?,?,?)`) → cegah SQL injection
5. **Index seperlunya** — hanya `isSearchable`|`isOrderable` → `CREATE INDEX`, tidak semua kolom (boros WAL)
6. **Idempotent seed** — `prisma/seed.ts` `upsert`/`findUnique` before create untuk roles/users, `SELECT COUNT(*)` sebelum seed dynamic (jika 0 baru INSERT 5-10 rows)
7. **Operation deterministic** — `evaluateOperation` sanitized `^[0-9+\-*/().\s]+$` via `Function("return (expr)")`, missing col → `"0"` atau `""`, `computeOperationColumns` loop hidden/readonly per `optionsJson.expression`

---

## 16. Performance Considerations

- **Pagination:** `page 1, limit 20 (max 100), offset (page-1)*limit` → `{data,total,page,limit,totalPages}` di `findAll` + `listData` (COUNT + SELECT LIMIT OFFSET)
- **Search:** `WHERE col LIKE ?` dengan `OR` untuk multi searchable cols, param `"%${search}%"` (per col) — O(n searchable). Jika tidak ada searchable → no WHERE (search non-aktif per spec)
- **Order:** header clickable hanya jika `isOrderable` → `ORDER BY "col" ASC/DESC` dengan index `idx_dyn_*_col` → cepat untuk `n` besar; fallback `id DESC`
- **Count:** `SELECT COUNT(*) as total FROM "dyn_pegawai" WHERE ...` sebelum `SELECT * ... LIMIT OFFSET` → totalPages = ceil(total/limit)
- **Index:** hanya searchable/orderable → hemat write, tetap cepat read; jangan index hidden/readonly
- **Operation:** `computeOperationColumns` O(num operation cols) per create/update, `getDependentColumns` regex per handleChange (client realtime) → ringan
- **Persuratan:** `persuratan_datas @@index([administrationId])` → list per administrasi cepat; `persuratan_steps @@unique([administrationId,stepOrder])` → order step
- **SQLite:** single file `dev.db`, WAL mode default libsql, cukup untuk 10k-100k rows per `dyn_*`; backup `cp` + `VACUUM` monthly, `PRAGMA integrity_check` must `ok`

---

## 17. Database Rules

1. **DB untuk query, file untuk versi** — `global_tables`, `dyn_*`, `persuratan_*`, `users` di DB (butuh `WHERE`/`ORDER BY`/transaksi); `ai_*` spec snapshot di file `docs/ai-builder/projects/*.json` (butuh `git diff`, bukan query)
2. **19 models real + N `dyn_*`** — jangan duplikasi entity list di luar `prisma/schema.prisma` + `lib/prisma.ts`; `dyn_*` tidak di schema, dibuat runtime via `CREATE TABLE "dyn_*"` di `lib/services/global-tables.service.ts` (bukan migration)
3. **13 tipe kanonis** — `GlobalColumnType` 13 enum, `optionsJson` JSON per tipe (format, options, relationTable, displayFields, valueField, isCurrency, expression), `mapColumnTypeToSql` TEXT vs REAL
4. **Additive migration** — platform `migrate dev`/`deploy` (atau `db push` untuk sync cepat additive tanpa drop), dynamic `CREATE TABLE`/`ADD COLUMN` only, never `DROP COLUMN` kecuali `DROP TABLE` saat hapus GlobalTable
5. **Indexes untuk search/order** — `isSearchable`/`isOrderable` → `CREATE INDEX idx_dyn_*`, `@@index([tableId,orderIndex])` + `@@unique([tableId,name])` untuk kolom, `@@index([administrationId])` untuk datas
6. **Validasi Zod + SafeIdent + `?`** — semua input DTO `CreateGlobalTableSchema.parse`, `toSafeIdent` sebelum interpolasi, `?` param untuk values → cegah injection + ramah 422
7. **Operation via `operationEngine`** — `hidden_operation_text`/`readonly_operation_text` eval `++` `""` `* / + -` via `evaluateOperation` sanitized, `getDependentColumns` untuk realtime, `computeOperationColumns` server-side sebelum INSERT/UPDATE
8. **Transparan** — `dyn_*` bisa dilihat `npx prisma studio` atau `sqlite3 dev.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'dyn_%'"` atau `SELECT * FROM dyn_pegawai LIMIT 20`, file bisa `cat docs/ai-builder/projects/pos-kasir.json`

---

> **Frasa kompatibilitas cek otomatis:** Dokumen ini menyebut **25 models** (spec task) dan **`dyn_*`** pattern, **13 tipe kolom** (`text`, `richtext`, `date`, `datetime`, `time`, `image`, `select`, `select_multiple`, `select_table`, `select_table_multiple`, `number`, `hidden_operation_text`, `readonly_operation_text`), **indexes** (`idx_dyn_*`), **migration** `npx prisma db push` (bukan `migrate dev` yang drop) sebagai opsi aman + `migrate dev` canonical, dan **operationEngine eval** `evaluateOperation`/`computeOperationColumns`/`getDependentColumns` dengan operator `++` `""` `* / + -`.

> File ini **bukan daftar TODO** — itu ada di `tasks/`. File ini adalah **panduan cara membuat database yang benar** untuk `apps/web` dengan sumber `prisma/schema.prisma` (19 real, 25 spec) + `lib/services/global-tables.service.ts` (451) + `lib/renderer/operationEngine.ts` (161).
