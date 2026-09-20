> Last Backup: 2026-09-20 — via /knowledge:backup
> Source: apps/web/* — prisma/schema.prisma (25 models), app/*, lib/*
> Scope: apps/web — untuk root lihat ../../docs/

# Architecture — AI App Builder Platform (Next.js)

## Overview

Single Next.js 15 (16.3.5) package (App Router) + **Global Tables & Persuratan** layer stabil:
- **Frontend**: Next.js 15 + React 19 + TypeScript (App Router, Server Components + `"use client"` islands)
- **Backend**: Next.js Route Handlers (`app/api/**/route.ts`) + Prisma 7.10 + SQLite (via `@prisma/adapter-libsql`) + Zod + JWT
- **Dynamic Layer**: `app/global-tables` (meta GUI 13 tipe) + `app/dyn/[table]` (browse `dyn_*`) + `app/components-persuratan` + `app/templates-persuratan` + `app/administrasi-persuratan` + `app/hasil-persuratan` + `lib/services/global-tables.service.ts` + `lib/renderer/operationEngine.ts` (`++ "" * / + -`) + `lib/services/persuratan/*` + Office Doc `app/generated/surat-platform/builder`
- **AI Builder (legacy)**: Prompt Inference → Spec → CodeGen → UI Assembly → Preview (file-based, bukan DB `ai_*` lagi)

Tagline: `Minimal Prompt → Maximal App` + `GUI-driven dyn_* & Persuratan`

---

## Layer Stack — Next.js + Global Tables & Persuratan

```text
┌──────────────────────────────────────────────────────────────┐
│                     PRESENTATION (Next.js)                    │
│  Next.js 15 App Router + React 19 + shadcn/ui + Tailwind      │
│  PageShell + DataTable + GlobalTables GUI + Dyn Browse       │
│  Components-Persuratan + Office Doc Builder (paper #e8ecef)  │
├──────────────────────────────────────────────────────────────┤
│               DYNAMIC & PERSURATAN LAYER (GUI)               │
│  GlobalTablesService (13 tipe) + operationEngine (++)        │
│  Persuratan: Component → Template → Administrasi → Hasil     │
│  Repeater/Condition/Barcode/QR di Office Doc                 │
├──────────────────────────────────────────────────────────────┤
│                    AI BUILDER LAYER (file)                     │
│  Inference → Spec → CodeGen → UI Assembly → Preview          │
│  File store `docs/ai-builder/projects/*.json` (bukan ai_* DB)│
├──────────────────────────────────────────────────────────────┤
│                     AUTHORIZATION                            │
│  (middleware.ts tidak ada saat backup) → Service guard       │
│  User → Role → Permission (method+URL) + Guard gating        │
├──────────────────────────────────────────────────────────────┤
│                      APPLICATION                             │
│  Route Handlers: app/api/auth, users, roles,                  │
│  app/api/global-tables, app/api/dyn/[table],                  │
│  app/api/persuratan/*, app/api/generated/surat-platform/*     │
│  + lib/services/* + lib/renderer/operationEngine.ts          │
├──────────────────────────────────────────────────────────────┤
│                      DATA LAYER (Platform + Dynamic)          │
│  Prisma 7.10 — 19 models real (spec 25) + N dyn_* via raw    │
│  RBAC 12 + Global 2 + Persuratan 5 + ActivityLog/Setting     │
│  SQLite via @prisma/adapter-libsql — `dev.db` + `dyn_*`      │
└──────────────────────────────────────────────────────────────┘
```

### Architecture Rules

1. **Meta-driven, additive-only** — `global_tables`/`global_columns` meta → `CREATE TABLE "dyn_*"` + `ADD COLUMN` via `lib/services/global-tables.service.ts`; tidak pernah `DROP COLUMN`, hanya `DROP TABLE` saat delete tabel; `prisma.$executeRawUnsafe` bukan migrasi
2. **GUI-first, tanpa JSON manual** — `app/global-tables` 13 tipe cards + relation multi-checkbox + currency live + operation textarea; `app/dyn/[table]` per-type inputs + relation modal search/order/checkbox; semua validasi Zod `lib/dto/global-tables.dto.ts`
3. **Operation deterministic** — `lib/renderer/operationEngine.ts` 161 baris: `evaluateOperation` split `++`, literal `""`, arithmetic `* / + -` via `Function` sanitized `^[0-9+\-*/().\s]+$`, `getDependentColumns` regex, `computeOperationColumns` untuk hidden/readonly realtime + server
4. **Persuratan 4 tahap terisolasi** — `lib/services/persuratan/*` (components.service, templates.service, administrations.service) + `app/components-persuratan` (richtext klik kanan binding), `app/templates-persuratan` (component insert + dataMapping + loopConfig), `app/administrasi-persuratan` (fields + steps), `app/hasil-persuratan` (isi data + PDF)
5. **RBAC sebagai penjaga (partial)** — `lib/services/*` plain object pattern `prisma.user.*`; `middleware.ts` **tidak ditemukan** saat backup — guard dilakukan di service/API, perlu `middleware.ts` JWT jika butuh gating produksi
6. **Generated Office Doc terisolasi** — `app/generated/surat-platform/builder` 3-panel (Components kiri → Document Editor tengah paper `#e8ecef` shadow `0_2px_16px` + ruler/zoom → Properties kanan); tree `TreeNode {type,props,children}` + interpolasi `{{office.name}}`/`{{employee.name}}` + Repeater/Condition
7. **JWT stateless** — 24 jam, `httpOnly` cookie `accessToken` + `Authorization: Bearer`, verifikasi di `lib/auth` jika middleware dibuat
8. **Next.js conventions** — Server Components default, `"use client"` untuk interaktif, `params` Promise, `NextResponse.json`, `NextRequest`, `dynamic = "force-dynamic"` di `hasil-persuratan`
9. **Beautiful by default** — token `#0075de` HSL 210 100% 44%, `#f6f5f4`, `#e6e6e6`, Inter, `detail-view`, PageShell + DataTable kanonis

### Module Boundaries

| Concern | Responsibility | Example (real path) |
|---------|---------------|---------------------|
| Auth | Login/register/profile + JWT | `app/api/users/route.ts`, `lib/prisma.ts` |
| RBAC | CRUD user/role/permission/guard + ActivityLog/Setting | `app/api/users`, `prisma/schema.prisma` 12 models |
| **Global Tables** | Meta CRUD 13 tipe → physical `dyn_*` + indexes | `app/global-tables/page.tsx` (412) + `lib/services/global-tables.service.ts` (451) + `app/api/global-tables/route.ts` |
| **Dyn Browse** | List data search/options/order + per-type CRUD + operation recompute | `app/dyn/[table]/page.tsx` (520) + `app/api/dyn/[table]/route.ts` + `lib/renderer/operationEngine.ts` (161) |
| **Persuratan Component** | Richtext + bindings text/image/component + preview | `app/components-persuratan/page.tsx` (259) + `lib/services/persuratan/components.service.ts` + `app/api/persuratan/components` |
| **Persuratan Template** | Richtext + component usages + dataMapping + loop | `app/templates-persuratan/page.tsx` (328) + `lib/services/persuratan/templates.service.ts` + `app/api/persuratan/templates` |
| **Persuratan Administrasi** | Fields + steps (template per step) | `app/administrasi-persuratan/page.tsx` (175) + `lib/services/persuratan/administrations.service.ts` + `app/api/persuratan/administrations` |
| **Persuratan Hasil** | Pilih administrasi + isi data + steps + PDF | `app/hasil-persuratan/page.tsx` (238, `dynamic force-dynamic`) + `app/api/persuratan/administrations/[id]/datas` |
| **Office Doc Builder** | 3-panel Office Doc (paper #e8ecef, ruler, zoom, header/footer, repeater, condition, barcode) | `app/generated/surat-platform/builder/page.tsx` + `next.config.ts` rewrites `/builder` → `/generated/surat-platform/builder` |
| **Surat Platform (generated)** | Templates/Documents/Employees/DataSources legacy + render/export-pdf | `app/api/generated/surat-platform/*` (templates, documents, employees, render, export-pdf) |

---

## Generation Flow (Core — Detail)

### Global Tables Flow (stabil, GUI-driven)
```
User GUI /global-tables
  ├─ Input C.1 name snake_case → toSnake(), preview dyn_{name}
  ├─ C.2 displayName, description, status
  └─ C.3 columns[] (tambah sesuai kebutuhan, 13 tipe cards)
       ├─ name snake_case, displayName, type enum 13
       ├─ format (date m-d-Y, datetime m-d-Y H:i:s, time H:i:s)
       ├─ options [{value,label}] untuk select/select_multiple
       ├─ relationTable + displayFields[] + valueField untuk select_table(_multiple)
       ├─ isCurrency untuk number → REAL + IDR preview toLocaleString("id-ID")
       └─ expression untuk hidden/readonly_operation_text → operationEngine
  ↓ POST /api/global-tables
  ├─ Zod CreateGlobalTableSchema.parse (lib/dto/global-tables.dto.ts)
  ├─ GlobalTablesService.create()
  │    ├─ toSafeIdent(name) → validate /^[a-z_][a-z0-9_]*$/, cek duplikat SELECT id WHERE name=?
  │    ├─ INSERT global_tables + SELECT id
  │    ├─ loop columns: buildOptionsJson({format,options,relationTable,displayFields,valueField,isCurrency,expression}) → INSERT global_columns
  │    ├─ mapColumnTypeToSql: number→REAL, lainnya TEXT (date/datetime/time/image/select*/text/richtext/hidden/readonly→TEXT)
  │    ├─ CREATE TABLE IF NOT EXISTS "dyn_{name}" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "col" TYPE, "createdAt" DATETIME, "updatedAt" DATETIME)
  │    └─ CREATE INDEX IF NOT EXISTS "idx_dyn_{name}_{col}" ON "dyn_{name}"("col") untuk isSearchable/isOrderable
  └─ Response 201 → findOne(id) (meta + columns)

User Browse /dyn/{table} → GET /api/dyn/{table}?page&limit&search&sortBy&sortOrder
  ├─ GlobalTablesService.listData(tableName, query)
  │    ├─ findByName(tableName) → meta + columns
  │    ├─ searchableCols = columns.filter(c=>c.isSearchable).map(c.name)
  │    ├─ WHERE 1=1 + (col LIKE ? OR ...) jika search
  │    ├─ filters additional ? AND "k" = ?
  │    ├─ sortBy whitelist: columns.some(c=>c.name===sortBy && c.isOrderable) ? sortBy : "id"
  │    ├─ COUNT(*) → total, SELECT * ... ORDER BY "sortBy" LIMIT ? OFFSET ?
  │    └─ return {data,total,page,limit,totalPages,columns}
  └─ DataTable + visibleCols + formatValue per tipe + handleSort clickable header ↕

User Create Data /dyn/{table} → Modal per-type
  ├─ form realtime: handleChange(name,val) → for op cols if getDependentColumns(expr).includes(name) → next[col]=evaluateOperation(expr,next)
  ├─ POST /api/dyn/{table} → GlobalTablesService.createData(tableName,input)
  │    ├─ validate required (skip hidden/readonly yang auto), defaultValue, type handling (multiple→JSON.stringify, number→parseFloat, image string)
  │    ├─ computeOperationColumns(meta.columns, {...row,...input}) → row[col]=evaluateOperation(expr,row) untuk hidden/readonly
  │    ├─ INSERT INTO "dyn_{table}" (cols) VALUES (?)
  │    └─ SELECT * ORDER BY id DESC LIMIT 1
  └─ PUT /api/dyn/{table}/{id} → updateData: fetch existing, merged={...existing,...input}, computeOperations, sets UPDATE ... SET "updatedAt"=CURRENT_TIMESTAMP

OperationEngine (lib/renderer/operationEngine.ts 161)
  evaluateOperation(expr,row):
    tokens = expr.split("++").map(trim)
    for token:
      if startsWith('"')/\' → literal slice(1,-1)
      else if /[*\/+\-]/ → replace col names dengan parseFloat(row[m]||0) via /\bM\b/g, sanitize /^[0-9+\-*/().\s]+$/, eval Function("return (expr)")
      else → column ref row[token] (handle JSON array join ", " jika startsWith [/{)
    concat → string
  getDependentColumns(expr): split ++, regex /[a-z_][a-z0-9_]*/, exclude digits/true/false/null → deps
  computeOperationColumns(columns,row): for col type hidden/readonly → JSON.parse(optionsJson).expression → evaluateOperation
```

### Persuratan Flow (4 tahap)
```
Component: POST /api/persuratan/components → persuratan_components (name,isLooping,contentHtml,bindingsJson) → GET list page/limit/search ORDER BY id DESC
Template: POST /api/persuratan/templates → persuratan_templates (name,description,contentHtml,componentsJson) dengan usages [{componentId,dataMapping:{binding:{source,value}},loopConfig:{table,selectedRowIds}}] → klik kanan insert placeholder border dashed
Administrasi: POST /api/persuratan/administrations → persuratan_administrations (name,description,fieldsJson) + INSERT persuratan_steps (administrationId,stepOrder,templateId,dataMappingJson) → GET detail enrich templateName
Hasil: POST /api/persuratan/administrations/:id/datas → persuratan_datas (administrationId,name,valuesJson,stepsDataJson) → list via GET /api/persuratan/administrations/:id/datas?page&limit
Preview PDF: window.open contentHtml + component usages (replace {{name}} dengan sample) → print()
```

### AI Builder Flow (legacy, file-based)
```
User Prompt "buatkan aplikasi kasir"
  → AiInferenceProvider (rule-based stub) → inferredIntent {domain,entities,pages,roles}
  → Spec (AiAppSchema) → Planner → CodeGen: prisma.$executeRaw CREATE TABLE "{slug}_{entity}" + DTO Zod + Service plain object + Route Handlers + Types → UI Assembly (PageShell+DataTable) → Integration (seed 5-10 rows) → Preview /generated/{slug}
Status: drafting→generating→ready|failed di file JSON docs/ai-builder/projects/*.json (bukan DB ai_* lagi)
```

---

## Next.js 15 Project Structure (real 2026-09-18)

```
apps/web/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Inter font, providers)
│   ├── globals.css               # Tailwind v4 + design tokens :root (HSL 210 100% 44% #0075de, #f6f5f4, #e6e6e6, radius 12, .detail-view, scrollbar 6px)
│   ├── page.tsx                  # / → redirect /generated/surat-platform atau dashboard
│   ├── global-tables/page.tsx    # → /global-tables (412, GUI 13 tipe, relation, currency, operation)
│   ├── dyn/[table]/page.tsx      # → /dyn/:table (520, search/options/order, per-type modal+relation, operation recompute)
│   ├── dyn/page.tsx (jika ada)   # → /dyn (list kartu dyn_*)
│   ├── components-persuratan/page.tsx    # → /components-persuratan (259, richtext + klik kanan binding)
│   ├── templates-persuratan/page.tsx     # → /templates-persuratan (328, component insert + dataMapping + loop)
│   ├── administrasi-persuratan/page.tsx  # → /administrasi-persuratan (175, fields + steps)
│   ├── hasil-persuratan/page.tsx         # → /hasil-persuratan (238, pilih administrasi + isi data, dynamic force-dynamic)
│   ├── generated/surat-platform/
│   │   ├── builder/page.tsx      # → /generated/surat-platform/builder (alias /builder, Office Doc paper #e8ecef shadow, ruler, zoom)
│   │   ├── preview/page.tsx      # → /preview
│   │   ├── templates/page.tsx    # → /templates (old)
│   │   ├── documents/page.tsx    # → /documents (old)
│   │   ├── employees/page.tsx    # → /employees
│   │   └── components/ (generated)
│   ├── api/                      # Route Handlers (Next.js)
│   │   ├── global-tables/
│   │   │   ├── route.ts          # → GET list (QueryGlobalTableSchema) + POST create (CreateGlobalTableSchema 13 tipe) → CREATE TABLE dyn_*
│   │   │   └── [id]/route.ts     # → GET detail + PUT update (ADD COLUMN additive) + DELETE DROP TABLE
│   │   ├── dyn/[table]/
│   │   │   ├── route.ts          # → GET listData (search isSearchable, sort isOrderable) + POST createData (computeOperations + INSERT)
│   │   │   └── [id]/route.ts     # → GET detail + PUT updateData (merge+recompute) + DELETE
│   │   ├── persuratan/
│   │   │   ├── components/route.ts + [id]/route.ts
│   │   │   ├── templates/route.ts + [id]/route.ts
│   │   │   └── administrations/route.ts + [id]/route.ts + [id]/datas/route.ts + [id]/datas/[dataId]/route.ts
│   │   ├── generated/surat-platform/
│   │   │   ├── templates/route.ts + [id]/route.ts
│   │   │   ├── documents/route.ts + [id]/route.ts
│   │   │   ├── employees/route.ts + [id]/route.ts
│   │   │   ├── components/route.ts + [id]/route.ts
│   │   │   ├── data-sources/route.ts + [id]/route.ts + [id]/resolve/route.ts
│   │   │   ├── render/route.ts   # POST schema+data → html
│   │   │   └── export-pdf/route.ts # POST schema+data → pdf via puppeteer-core
│   │   ├── users/route.ts + [id]/route.ts
│   │   ├── health/route.ts       # → GET /api/health
│   │   └── (jika ada auth route)
│   └── (auth)/(dashboard)/users,roles,permissions,guards (jika ada via generated)
│
├── components/                   # Shared components
│   ├── ui/                       # shadcn/ui primitives (Button, Input, Card, Dialog, Table, Select, Badge, Textarea, Label)
│   ├── common/
│   │   └── DataTable/            # Reusable table browse (shadcn Table, 320/160 col, pagination Menampilkan {from}-{to})
│   └── layout/
│       ├── AppLayout.tsx         # 178, sidebar 4 grup (Platform, Global Tabel, Persuratan, Manajemen Lama), aliasToCanonical, isActive, responsive mobile drawer
│       └── PageShell.tsx         # Kanonis list/detail shell (title, breadcrumbs, description, actions)
│
├── lib/
│   ├── prisma.ts                 # 18, PrismaLibSql singleton (DATABASE_URL file:./dev.db, adapter-libsql, hot-reload safe)
│   ├── dto/
│   │   └── global-tables.dto.ts  # 72, GlobalColumnTypeEnum 13, ColumnOptionSchema, CreateGlobalTableSchema, UpdateGlobalTableSchema, QueryGlobalTableSchema, QueryDynSchema
│   ├── services/
│   │   ├── global-tables.service.ts # 451, META_TABLE global_tables, dynTableName, mapColumnTypeToSql, buildOptionsJson, findAll/findOne/findByName/create/update/remove/listData/createData/updateData/deleteData/getDataOne
│   │   └── persuratan/
│   │       ├── components.service.ts      # 38, persuratan_components CRUD
│   │       ├── templates.service.ts       # 38, persuratan_templates CRUD
│   │       └── administrations.service.ts # 83, persuratan_administrations + steps + datas
│   ├── renderer/
│   │   └── operationEngine.ts    # 161, evaluateOperation( ++ concat, "" literal, * / + - arithmetic via Function sanitized), getDependentColumns, computeOperationColumns
│   └── (ai-builder file store jika ada: docs/ai-builder/projects/*.json)
│
├── prisma/
│   ├── schema.prisma             # 308, 19 models real (User,Role,Permission,Guard,UserRole,RoleGuard,RolePermission,GuardUrl,PermissionMethod,PermissionUrl,GlobalTable,GlobalColumn,PersuratanComponent,PersuratanTemplate,PersuratanAdministration,PersuratanStep,PersuratanData,ActivityLog,Setting) — spec task 25 vs real 19, konflik dicatat
│   ├── seed.ts                   # idempotent seed 5 users (admin P455w0rd!!! bcrypt 10), 6 roles, 10 permissions + junctions
│   ├── migrations/
│   │   └── 20260918005609_init/  # Prisma Migrate (platform RBAC+Global+Persuratan), migration.sql CREATE TABLE users... + global_tables etc.
│   └── prisma7.config.ts         # 14, defineConfig schema prisma/schema.prisma, migrations path, datasource url env DATABASE_URL
│
├── app/generated/prisma/         # generated client (prisma generate → app/generated/prisma/client)
├── components/layout/AppLayout.tsx # 178, navGroups 4 grup, rewrites alias, isActive, mobile header
├── app/globals.css               # 98, @import tailwindcss, @theme inline --color-primary hsl(210 100% 44%), --color-muted #f6f5f4, --color-border #e6e6e6, --radius 12px, :root --primary 210 100% 44%, body bg #f6f5f4, .detail-view pattern, scrollbar
├── next.config.ts                # 33, rewrites /builder→/generated/surat-platform/builder, /preview, /templates, /documents, /employees, /components, /data-sources + wildcard :path*
├── prisma7.config.ts             # DATABASE_URL="file:./dev.db" (lihat .env)
├── .env                          # DATABASE_URL="file:./dev.db"
├── package.json                  # 53, next 16.3.5, prisma 7.10, @prisma/adapter-libsql 7.10, zod 4.6, lucide-react 1.47, bcryptjs 3.0, jsonwebtoken
├── middleware.ts                 # **TIDAK ADA saat backup 2026-09-18** — konflik: docs/PRD menyebut middleware.ts guard, real tidak ada file → guard harus dibuat atau dilakukan di Route Handler (catat konflik)
└── docs/                         # docs lokal apps/web (PRD, architecture, database, design-system, core-concept, README, production-runbook)
```

---

## Conventions

### Frontend (Next.js 15 + React 19)
- Server Components default; `"use client"` untuk interactive (global-tables, dyn, persuratan, builder Office Doc)
- UI: **shadcn/ui** (Radix) + **Tailwind CSS v4** utility only (`bg-[#f6f5f4]`, `border-[#e6e6e6]`, `text-[#0075de]`)
- File-based routing: `app/` App Router + dynamic `[table]`, `force-dynamic` di hasil-persuratan
- Hooks: `useApi`, `useAuthorization`, `useDataTable`, `usePageTransition` (jika ada)
- State: Zustand global + TanStack Query server state (list/create/update via fetch)
- Styling: `app/globals.css` tokens + `components/ui/*` primitives

### Backend (Route Handlers)
- Next.js `app/api/**/route.ts` exports `GET`, `POST`, `PUT`, `DELETE` + `NextRequest`/`NextResponse.json`
- Prisma 7.10 + SQLite via `@prisma/adapter-libsql` singleton `lib/prisma.ts` — `prisma.$queryRawUnsafe`/`$executeRawUnsafe` untuk dyn_* (raw SQL `CREATE TABLE "dyn_pegawai"` + `SELECT COUNT(*)`)
- Validation: Zod `lib/dto/global-tables.dto.ts` 13 enum + ColumnOptionSchema + Create/Update/Query schemas, validated di handler `parse(await req.json())` atau `parse(Object.fromEntries(req.nextUrl.searchParams))`
- Service pattern: plain object `export const GlobalTablesService = { async findAll(){}, create(){}, listData(){}, createData(){}, ... }` + persuratan services
- Error: `NextResponse.json({message},{status:400|422})`, Zod 422 `Validation failed`, service throw 400
- Generated routes di `app/api/generated/surat-platform/*` pakai `prisma.$queryRaw`/`puppeteer-core` untuk render/pdf

---

## Routing

### File-Based Routing (Next.js App Router — Real)
| File | Route | Auth | Description |
|------|-------|------|-------------|
| `app/page.tsx` | `/` | Public | Redirect /generated/surat-platform |
| `app/global-tables/page.tsx` | `/global-tables` | — | GUI Buat Tabel (13 tipe) |
| `app/dyn/[table]/page.tsx` | `/dyn/:table` | — | Browse dyn_* (search/options/order + per-type form) |
| `app/components-persuratan/page.tsx` | `/components-persuratan` | — | Component richtext + bindings |
| `app/templates-persuratan/page.tsx` | `/templates-persuratan` | — | Template + component usages |
| `app/administrasi-persuratan/page.tsx` | `/administrasi-persuratan` | — | Administrasi fields + steps |
| `app/hasil-persuratan/page.tsx` | `/hasil-persuratan` | — | Hasil pilih administrasi + isi data |
| `app/generated/surat-platform/builder/page.tsx` | `/builder` (alias) | — | Office Doc Builder (paper #e8ecef) |
| `app/generated/surat-platform/preview/page.tsx` | `/preview` (alias) | — | Preview surat |
| `app/api/global-tables/route.ts` | `/api/global-tables` | — | GET list + POST create (13 tipe) |
| `app/api/dyn/[table]/route.ts` | `/api/dyn/:table` | — | GET list + POST create |
| `app/api/persuratan/components/route.ts` | `/api/persuratan/components` | — | Component CRUD |
| `app/api/persuratan/templates/route.ts` | `/api/persuratan/templates` | — | Template CRUD |
| `app/api/persuratan/administrations/route.ts` | `/api/persuratan/administrations` | — | Administrasi CRUD + datas |
| `app/api/generated/surat-platform/templates/route.ts` | `/api/generated/surat-platform/templates` | — | Old templates |

### Sidebar Menu (Real `components/layout/AppLayout.tsx` — 4 Grup, token #0075de)
```
Platform
  ├── Dashboard              → / (alias /generated/surat-platform)
  ├── Template Builder       → /builder (icon Palette)
  └── Preview                → /preview (icon Eye)
Global Tabel
  ├── Global Tables          → /global-tables (Table)
  └── Browse Data            → /dyn (Database)
Persuratan
  ├── Components             → /components-persuratan (Boxes)
  ├── Templates              → /templates-persuratan (FileStack)
  ├── Administrasi           → /administrasi-persuratan (ClipboardList)
  └── Hasil Surat            → /hasil-persuratan (Files)
Manajemen Lama (old surat-platform)
  ├── Templates (old)        → /templates (FileText)
  ├── Documents (old)        → /documents (Files)
  ├── Data Sources           → /data-sources (Database)
  ├── Components (old)       → /components (Component)
  └── Employees              → /employees (Users)
```
`AppLayout` navGroups array, `aliasToCanonical` map `/builder`→`/generated/surat-platform/builder`, `isActive(pathname,href)` prefix match, responsive drawer (mobileOverlay + `Menu`/`X`), header `h-16` + `Sparkles` badge.

### Middleware (KONFLIK)
- **Spec/PRD menyebut** `middleware.ts` JWT guard (`matcher: ['/dashboard/:path*','/builder/:path*']`)
- **Real saat backup:** `glob middleware.ts` di `apps/web` → **No files found** + `grep` tidak ada `middleware.ts` → file tidak ada → guard tidak aktif → perlu dibuat jika butuh proteksi produksi → dicatat sebagai **Conflicts** di laporan akhir

### Rewrites (Real `next.config.ts` 33)
```ts
rewrites: [
  { source: "/builder", destination: "/generated/surat-platform/builder" },
  { source: "/builder/:path*", destination: "/generated/surat-platform/builder/:path*" },
  { source: "/preview", destination: "/generated/surat-platform/preview" },
  { source: "/templates", destination: "/generated/surat-platform/templates" },
  { source: "/documents", destination: "/generated/surat-platform/documents" },
  { source: "/employees", destination: "/generated/surat-platform/employees" },
  { source: "/components", destination: "/generated/surat-platform/components" },
  { source: "/data-sources", destination: "/generated/surat-platform/data-sources" },
]
```

---

## API Endpoints

### Global Tables & Dyn (Stabil — Next.js Route Handlers)

| Method | Endpoint | Description | Auth | DTO | Handler |
|--------|----------|-------------|------|-----|---------|
| GET | `/api/global-tables` | List meta tables (paginated, searchable) | — | `QueryGlobalTableSchema {page,limit,search,sortBy,sortOrder} → {data,total,page,limit,totalPages,_columnCount,_rowCount}` | `app/api/global-tables/route.ts` → `GlobalTablesService.findAll` |
| POST | `/api/global-tables` | Create meta + `CREATE TABLE dyn_*` + indexes | — | `CreateGlobalTableSchema {name snake_case displayName columns[13 enum] min 1} → 201` | `.../global-tables/route.ts` → `GlobalTablesService.create` |
| GET | `/api/global-tables/:id` | Detail meta + columns | — | | `app/api/global-tables/[id]/route.ts` |
| PUT | `/api/global-tables/:id` | Update meta + `ALTER TABLE ADD COLUMN` additive | — | `UpdateGlobalTableSchema` | `" |
| DELETE | `/api/global-tables/:id` | `DROP TABLE IF EXISTS dyn_*` + delete meta cascade | — | | `" |
| GET | `/api/dyn/:table` | List data dyn (search isSearchable OR, sort isOrderable, filters, pagination) | — | `QueryDynSchema` → `{data,total,page,limit,totalPages,columns}` | `app/api/dyn/[table]/route.ts` → `GlobalTablesService.listData` |
| POST | `/api/dyn/:table` | Create data (validasi required + type + computeOperation + INSERT) | — | `Record<string,any>` | `.../route.ts` → `GlobalTablesService.createData` |
| GET | `/api/dyn/:table/:id` | Detail row | — | | `app/api/dyn/[table]/[id]/route.ts` |
| PUT | `/api/dyn/:table/:id` | Update row (merge existing + recompute + UPDATE) | — | | `" |
| DELETE | `/api/dyn/:table/:id` | Delete row | — | | `" |

**Handler pattern (real):**
```ts
// app/api/global-tables/route.ts
export async function GET(req: NextRequest){
  const query = QueryGlobalTableSchema.parse(Object.fromEntries(req.nextUrl.searchParams))
  const result = await GlobalTablesService.findAll(query)
  return NextResponse.json(result)
}
export async function POST(req: NextRequest){
  const parsed = CreateGlobalTableSchema.parse(await req.json())
  const created = await GlobalTablesService.create(parsed as any)
  return NextResponse.json(created,{status:201})
}
```

### Persuratan (Stabil)

| Method | Endpoint | Description | Auth | Service |
|--------|----------|-------------|------|---------|
| GET | `/api/persuratan/components` | List components (page/limit/search) | — | `PersuratanComponentsService.findAll` → `SELECT COUNT(*) + SELECT * ORDER BY id DESC LIMIT OFFSET` |
| POST | `/api/persuratan/components` | Create component (name,isLooping,contentHtml,bindingsJson) | — | `...create` → `INSERT persuratan_components ... SELECT * WHERE name=?` |
| GET | `/api/persuratan/components/:id` | Detail | — | |
| PUT | `/api/persuratan/components/:id` | Update (sets + updatedAt) | — | |
| DELETE | `/api/persuratan/components/:id` | Delete | — | |
| GET/POST | `/api/persuratan/templates` | List/create template (name,contentHtml,componentsJson) | — | `PersuratanTemplatesService` |
| GET/PUT/DELETE | `/api/persuratan/templates/:id` | Detail/update/delete | — | |
| GET/POST | `/api/persuratan/administrations` | List/create administrasi (name,description,fieldsJson,steps) | — | `PersuratanAdministrationsService` + steps enrichment |
| GET | `/api/persuratan/administrations/:id` | Detail + steps + templateName enrich | — | |
| PUT/DELETE | `/api/persuratan/administrations/:id` | Update (fieldsJson + steps replace DELETE+INSERT) | — | |
| GET/POST | `/api/persuratan/administrations/:id/datas` | List/create hasil (administrationId,name,valuesJson,stepsDataJson) | — | `...listDatas/createData` |
| PUT/DELETE | `/api/persuratan/administrations/:id/datas/:dataId` | Update/delete hasil | — | |

### Surat Platform Legacy (Generated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/generated/surat-platform/templates` | Old templates |
| GET/POST | `/api/generated/surat-platform/documents` | Documents |
| GET/POST | `/api/generated/surat-platform/employees` | Employees |
| GET/POST | `/api/generated/surat-platform/data-sources` | Data sources + `/[id]/resolve` |
| POST | `/api/generated/surat-platform/render` | Render HTML schema+data |
| POST | `/api/generated/surat-platform/export-pdf` | Export PDF via puppeteer-core + chrome |

### Auth & RBAC
`POST /api/users`, `GET /api/users`, `GET/PUT/DELETE /api/users/:id` serupa `/api/roles`, `/api/permissions`, `/api/guards` + `GET /api/activity-logs`, `/api/settings`, `/api/health`

---

## RBAC System (Next.js)

**Real:** `prisma/schema.prisma` RBAC 10 core models (User,Role,Permission,Guard + junctions UserRole,RoleGuard,RolePermission + GuardUrl,PermissionMethod,PermissionUrl) + ActivityLog/Setting. Flow: `User` —`users_roles`— `Role` —`roles_permissions`— `Permission` — `permission_methods`/`permission_urls`; `Role` —`roles_guards`— `Guard` —`guard_urls`. `middleware.ts` tidak ada → guard tidak aktif di edge; enforcement perlu di Route Handler `requireAuth`/`requireApiAccess` belum terlihat di dyn/persuratan (perlu ditambah produksi). Client `hooks/useAuthorization` `hasRole`, `hasPermission`, `canAccessUrl` untuk gating menu (jika diimplement).

Generated `dyn_*` & persuratan saat ini **tanpa permission ketat** (semua bisa `POST /api/dyn/*`); untuk produksi tambahkan `GuardUrlType allow/deny` + `PermissionMethod`.

---

## Entity Relationships (Real `prisma/schema.prisma` 308)

```
users ──< users_roles >── roles ──< roles_guards >── guards ──< guard_urls (GuardUrlType allow|deny)
                          │  │
                          │  └─< roles_permissions >── permissions ──< permission_methods (method)
                          │                          └─< permission_urls (url)
                          │
users ──< activity_logs (nullable userId SET NULL, level INFO|WARNING|ERROR, action CREATE|UPDATE|DELETE|LOGIN|GENERATE|REFINE)
settings (key-value, key unique)

global_tables ──< global_columns (tableId FK CASCADE, type enum 13, optionsJson JSON, defaultValue, isRequired, isOrderable, isSearchable, orderIndex, @@unique([tableId,name]), @@index([tableId,orderIndex]))

persuratan_components (name unique, isLooping, contentHtml, bindingsJson)
persuratan_templates (name unique, contentHtml, componentsJson) ──< persuratan_steps >── persuratan_administrations (name unique, fieldsJson) + persuratan_datas (administrationId FK CASCADE, name, valuesJson, stepsDataJson, @@index([administrationId]))
persuratan_steps (administrationId FK CASCADE, stepOrder, templateId FK RESTRICT, dataMappingJson, @@unique([administrationId,stepOrder]))

Dynamic: dyn_{name} (id INTEGER PK AUTOINCREMENT, "col" TEXT/REAL per type, "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME) — N tables via CREATE TABLE IF NOT EXISTS "dyn_pegawai" ("id"...), INDEX idx_dyn_pegawai_nama jika searchable/orderable, tidak di schema.prisma
```

Canon: `prisma/schema.prisma` 19 models (real) + `lib/prisma.ts` singleton. Platform static; N dynamic `dyn_*` per Global Table tidak di baseline (`docs/database.md` § Dynamic). `ai_*` (AiProject, AiPrompt, etc.) sudah **tidak ada** — diganti file `docs/ai-builder/projects/*.json` jika builder dipakai.

---

## Tech Stack (Next.js — Real)

### Frontend
- Next.js 16.3.5 (App Router, Turbopack) + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui (Radix) + lucide-react 1.47 + Framer Motion 12
- `hooks/*` (useApi, useAuthorization, useDataTable) jika ada
- `app/generated/surat-platform/builder` Office Doc (paper `#e8ecef` bg, shadow `[0_2px_16px]`, ruler 20 ticks, zoom 60-140%, toolbar Word-like Bold/Italic/Align, header 7px/mono, footer)

### Backend (Next.js Route Handlers)
- Prisma 7.10 + SQLite via `@prisma/adapter-libsql` + bcryptjs 3.0 + Zod 4.6 + jsonwebtoken 9.0
- Services: `lib/services/global-tables.service.ts` (CRUD meta + dyn), `lib/services/persuratan/*` (3 files), `lib/renderer/operationEngine.ts` (eval ++)
- Inference provider: file-based jika builder aktif (bukan DB)

### Database (Platform + Dynamic — Real)
- SQLite `dev.db` di `apps/web/` (`prisma/schema.prisma` 308, `prisma7.config.ts`, `DATABASE_URL="file:./dev.db"` di `.env`)
- Platform: Prisma Migrate `20260918005609_init` (CREATE TABLE users, roles, global_tables, global_columns, persuratan_* etc.) — Dev `npx prisma migrate dev --name <Name>`, Prod `migrate deploy`. **Alternatif dev cepat**: `npx prisma db push` (sync tanpa buat migration file, tidak drop jika additive — perlu dicatat sebagai opsi aman vs `migrate dev` yang bisa drop jika drift)
- Dynamic: `lib/services/global-tables.service.ts` → `prisma.$executeRawUnsafe('CREATE TABLE "dyn_${name}" (...)')` runtime, `ADD COLUMN` additive, `DROP TABLE` hanya saat delete tabel, transactional
- CLI: `npx prisma generate` (client `app/generated/prisma`), `npx prisma studio` :5555, `npx tsx prisma/seed.ts`

---

## Design System

Lihat `docs/design-system.md` — token kanonis `#0075de` HSL 210 100% 44%, canvas `#f6f5f4`, hairline `#e6e6e6`, radius 12/8/4, Inter, Office Doc paper `#e8ecef` shadow, PageShell + DataTable + detail-view.

---

## Table Browse Component (Kanonis — Next.js + shadcn/ui)

`components/common/DataTable/DataTable.tsx` — props `columns`, `data`, `loading`, `page`, `limit`, `total`, `totalPages`, `onPageChange`, `onSearch`, `searchPlaceholder`, `loading`. Implementasi: shadcn `Table` + `Input` 320px + `Select` 160px + `Button` + `Badge` + `Pagination` `Menampilkan {from}-{to} dari {total}` + `Alert` error + `Empty`. `app/global-tables/page.tsx` + `app/dyn/[table]/page.tsx` + persuratan pages re-use `DataTable` dengan toolbar kanonis (Search 320 OR, Field 160, Settings Column Visibility, Refresh, Create CTA pill primary, Page info).

---

## PageShell (Kanonis — Next.js)

`components/layout/PageShell.tsx` — `props: title, breadcrumbs: {label,href?}[], description?, children, actions` (ReactNode). Header 20px Semibold + breadcrumb `next/link` + toolbar → konten → pagination. Wajib untuk semua list/detail: `app/global-tables`, `app/dyn/[table]`, `app/components-persuratan`, etc. semua pakai `PageShell` + `DataTable` + `detail-view` pattern.

---

## Storybook Foundation

`components/ui` stories (Button, Input, Card, Dialog, Table) — jika `npm run storybook` → :6006

---

## Change Log

### 2026-09-20 — Knowledge Backup (Global Tables 13 tipe + persuratan stabil)
- **Discovery:** `prisma/schema.prisma` 25 models (RBAC 18 + Global Tables 2 + Persuratan 5) + urgensi `dyn_*` + real 19 vs spec 25 konflikt dicatat — `lib/services/global-tables.service.ts` 451 (13 tipe `dyn_*`), `lib/renderer/operationEngine.ts` 161 (`++` `""` `* / + -`), `app/global-tables/page.tsx` GUI 13 tipe, `app/dyn/[table]/page.tsx` search/options/order, `app/components-persuratan` 259 + `app/templates-persuratan` 328 + `app/administrasi-persuratan` 175 + `app/hasil-persuratan` 238, Office Doc paper `#e8ecef` + `shadow-[0_2px_16px_rgba(0,0,0,0.12)]` di `components/forms/PersuratanTemplateForm.tsx`, `components/layout/AppLayout.tsx` 4 grup, `next.config.ts` rewrites, `app/globals.css` tokens `#0075de` HSL 210 100% 44%, `.env` `file:./dev.db`, `prisma7.config.ts`, `middleware.ts` missing (konflik). Update header `Last Backup: 2026-09-20`.

### 2026-09-18 — Knowledge Backup (Global Tables 13 tipe + Persuratan stabil)
- **Discovery:** `prisma/schema.prisma` 19 models real (vs spec 25), `lib/services/global-tables.service.ts` 451 (13 tipe), `lib/renderer/operationEngine.ts` 161 (`++` `""` `* / + -`), `app/global-tables/page.tsx` 412, `app/dyn/[table]/page.tsx` 520, `app/components-persuratan` 259, `app/templates-persuratan` 328, `app/administrasi-persuratan` 175, `app/hasil-persuratan` 238, `app/generated/surat-platform/builder` Office Doc (`#e8ecef` paper shadow), `components/layout/AppLayout.tsx` 4 grup, `next.config.ts` rewrites, `app/globals.css` tokens, `.env` `file:./dev.db`, `prisma7.config.ts`, `middleware.ts` **missing** (konflik). **Update architecture:** layer Dynamic & Persuratan, flow Global Tables (meta→CREATE TABLE dyn_*→listData search isSearchable/order isOrderable→createData computeOperation→INSERT), flow Persuratan 4 tahap, project structure real paths, API endpoints `app/api/global-tables`, `app/api/dyn`, `app/api/persuratan`, `app/api/generated/surat-platform`, sidebar 4 grup, rewrites, ERD 19 models + dyn_* dynamic, tech stack real (Next 16.3.5, Prisma 7.10, Zod 4.6), Design System Office Doc paper, Table/PageShell kanonis.

### Stack Migration — Next.js + React (2026-09-15)
- MIGRASI dari Nuxt 4 + Vue 3 → Next.js 15 + React 19 + Zustand + TanStack Query + shadcn/ui + Tailwind + lucide-react + Framer Motion. Struktur `app/` App Router + `components/ui` + `hooks/` + `lib/` + `middleware.ts`.

### AI App Builder — Platform Pivot (2026-09-15)
- AI Builder layer, generation flow, builder + generated project structure, 9 builder endpoints + dynamic.
