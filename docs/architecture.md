# Architecture — AI App Builder Platform

## Overview

Single Nuxt 4 package + **AI Builder Layer**:
- **Frontend**: Nuxt 4 + Vue 3 + TypeScript (file-based routing, auto-imports)
- **Backend**: Nitro server routes in `server/api/` (TypeORM + SQLite + Zod + JWT)
- **AI Builder Layer**: Prompt Inference Engine → Spec Generation → Code Generation → UI Assembly → Preview & Iteration (lives in `server/services/ai-builder/` + `app/composables/useAiBuilder`)

Tagline: `Minimal Prompt → Maximal App`

---

## Layer Stack — AI App Builder

```text
┌──────────────────────────────────────────────────────────────┐
│                      PRESENTATION                              │
│  Nuxt 4 + Vue 3 + Naive UI + Tailwind + PageShell + DataTable │
│  + AiPromptBar + Project Library + Generated Pages             │
├──────────────────────────────────────────────────────────────┤
│                    AI BUILDER LAYER                            │
│  Inference Engine → Spec Generator → Schema Generator          │
│  → UI Assembly Engine → Preview & Iteration                    │
├──────────────────────────────────────────────────────────────┤
│                     AUTHORIZATION                              │
│  JWT → User → Role → Permission (method+URL) + Guard gating    │
│  + Generated App Auto-Permissions (`Generated:{Slug}:*`)       │
├──────────────────────────────────────────────────────────────┤
│                      APPLICATION                               │
│  Nitro API: Auth, Users/Roles/Permissions/Guards, ActivityLogs │
│  Builder API: /api/builder/*, Generated APIs: /api/:slug/*    │
│  Storage, Settings, Health                                     │
├──────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                │
│  TypeORM EntitySchema (17 schemas / ~23 tables)                │
│  RBAC 9 + Builder 8 schemas — SQLite better-sqlite3            │
└──────────────────────────────────────────────────────────────┘
```

### Architecture Rules

1. **RBAC sebagai penjaga** — semua operasi sensitif wajib permission method+URL (`requireApiAccess`)
2. **Builder sebagai orkestrator** — inference → spec → codegen → UI assembly terisolasi di `server/services/ai-builder/`, tidak mencemari service RBAC
3. **Generated code terisolasi** — `app/generated/{slug}/` + `server/generated/{slug}/` (atau `server/api/{slug}/` dynamic) tidak edit manual; refine via builder
4. **Opinionated & beautiful** — generated UI wajib pakai Design System kanonis (PageShell, DataTable, detail-view, token `#0075de`)
5. **JWT stateless** — 24 jam, localStorage + cookie
6. **Stateless CRUD** — baik RBAC maupun generated entities pakai service plain object pattern

### Module Boundaries

| Concern | Responsibility | Example |
|---------|---------------|---------|
| Auth | Login/register/profile/password | `POST /api/auth/login` |
| RBAC | CRUD user/role/permission/guard + assignment | `app/pages/dashboard/users.vue` |
| Sistem | Activity logs, system logs, settings, storage | `app/pages/dashboard/activity-logs.vue` |
| **AI Builder** | Prompt → Inference → Spec → CodeGen → Preview | `POST /api/builder/generate` |
| **Generated App** | CRUD per entity hasil generate + dashboard | `GET /api/pos-kasir/products` |
| Builder Management | Library, generations, preview, refine | `app/pages/builder/[slug].vue` |

---

## Generation Flow (Core — Detail)

```
User Prompt (1 baris: "buatkan aplikasi kasir")
  │
  ├─► AiPrompt.create { promptText, userId, projectId? }
  │
  ├─► Inference Engine (server/services/ai-builder/inference.service.ts)
  │     Input: promptText
  │     Output: inferredIntent = {
  │       domain: "pos",
  │       domainLabel: "Kasir POS",
  │       entities: [
  │         { name:"Product", label:"Produk", fields:[...], relations:[...] },
  │         { name:"Category", label:"Kategori" },
  │         { name:"Transaction", label:"Transaksi" },
  │         { name:"Customer", label:"Pelanggan" }
  │       ],
  │       pages: ["Dashboard","Products","Transactions","Customers","Reports"],
  │       roles: ["Admin","Kasir"],
  │       flows: ["kasir buat transaksi → kurangi stok → cetak struk"]
  │     }
  │     Provider interface: AiInferenceProvider (rule-based stub di v1, LLM-ready)
  │
  ├─► Spec Generation (spec.service.ts)
  │     Output: AiAppSchema = { entities JSON, pages JSON, roles JSON, flows JSON, apiContract }
  │     + AiDataModel rows + AiPage rows + AiComponentSpec rows
  │
  ├─► Architecture Planning (planner.service.ts)
  │     Pilih template (pos-kasir), normalisasi field types, tentukan RBAC matrix
  │
  ├─► Code Generation (codegen.service.ts)
  │     For each AiDataModel →
  │       server/entities/generated/{slug}/{entity}.entity.ts (EntitySchema)
  │       server/dto/{slug}/{entity}.dto.ts (Zod)
  │       server/services/{slug}/{entity}.service.ts (plain object)
  │       server/api/{slug}/{entity}/... routes (index.get/post, [id].get/put/delete)
  │       shared/types/{slug}/{entity}.ts
  │     For each AiPage →
  │       app/generated/{slug}/pages/{page}.vue (PageShell + DataTable + FormModal)
  │       app/generated/{slug}/components/... 
  │       app/generated/{slug}/stores/... + composables/use{Entity}Data.ts
  │
  ├─► Integration (integration.service.ts)
  │     - Register entities di server/utils/orm-data-source.ts (appEntities += generated)
  │     - Generate seed (5-10 rows per entity)
  │     - Register sidebar nav (dynamic menu Generated Apps)
  │     - Create AiDeployment { env: preview, url: /generated/{slug} }
  │
  └─► Preview & Iterate
        Dev server hot-reload → user lihat /generated/{slug}
        Refine: POST /api/builder/refine { slug, prompt: "tambahkan barcode" } → delta patch
```

**Status enum** di `AiProject.status` dan `AiGeneration.status`: `drafting` → `generating` → `ready` | `failed`
`AiGeneration` simpan `spec` JSON, `error` text, `durationMs`.

---

## Nuxt 4 Project Structure

```
├── app/                          # Nuxt app directory
│   ├── components/
│   │   ├── base/                 # Button, etc.
│   │   ├── common/               # AuthForm, FormField, DataTable
│   │   │   └── DataTable/        # Reusable table browse component
│   │   ├── layout/               # AppLayout, PageShell
│   │   └── builder/              # Builder UI (NEW)
│   │       ├── AiPromptBar.vue       # Input prompt + Generate CTA
│   │       ├── InferencePreview.vue  # Domain/entities/pages/roles badges
│   │       ├── GenerationProgress.vue# Stepper + logs
│   │       └── ProjectCard.vue       # Card di library
│   │
│   ├── generated/                # Generated apps — terisolasi (NEW)
│   │   └── {slug}/               # per project slug e.g. pos-kasir/
│   │       ├── pages/            # File-based routing mirror
│   │       │   ├── index.vue         → /generated/pos-kasir (dashboard)
│   │       │   ├── products.vue      → /generated/pos-kasir/products
│   │       │   └── transactions.vue
│   │       ├── components/       # Feature components per entity
│   │       │   ├── ProductTable.vue
│   │       │   ├── ProductFormModal.vue
│   │       │   └── ProductDetailDrawer.vue
│   │       ├── composables/
│   │       │   └── useProductsData.ts
│   │       └── stores/
│   │           └── products.ts
│   │
│   ├── composables/              # Vue composables
│   │   ├── useApi.ts
│   │   ├── useDataTable.ts
│   │   ├── useAuthorization.ts
│   │   └── useAiBuilder.ts       # NEW: generate, refine, preview, listProjects
│   │
│   ├── pages/
│   │   ├── login.vue             → /login
│   │   ├── register.vue          → /register
│   │   ├── dashboard/
│   │   │   ├── index.vue         → /dashboard (platform stats)
│   │   │   ├── users.vue
│   │   │   ├── roles.vue
│   │   │   ├── permissions.vue
│   │   │   ├── guards.vue
│   │   │   ├── activity-logs.vue
│   │   │   ├── system-logs.vue
│   │   │   ├── settings.vue
│   │   │   └── profile.vue
│   │   ├── builder/
│   │   │   ├── index.vue         → /builder (prompt bar + library)
│   │   │   └── [slug].vue        → /builder/:slug (detail + preview + refine)
│   │   └── generated/
│   │       └── [slug]/
│   │           └── [...all].vue  # catch-all mount generated pages (atau Nuxt layers)
│   │
│   ├── stores/
│   │   ├── auth.ts
│   │   ├── ai-builder.ts         # NEW
│   │   └── ...
│   │
│   ├── types/
│   └── utils/
│
├── server/                       # Nitro server directory
│   ├── api/
│   │   ├── auth/
│   │   ├── users/, roles/, permissions/, guards/
│   │   ├── builder/              # NEW
│   │   │   ├── generate.post.ts      → POST /api/builder/generate
│   │   │   ├── refine.post.ts        → POST /api/builder/refine
│   │   │   ├── projects.get.ts       → GET  /api/builder/projects
│   │   │   ├── projects/[slug].get.ts
│   │   │   ├── projects/[slug].delete.ts
│   │   │   ├── generations/[id].get.ts
│   │   │   └── templates.get.ts      → GET /api/builder/templates
│   │   ├── generated/            # NEW — dynamic per slug (atau server/api/[slug]/[entity]/)
│   │   │   └── [slug]/[entity]/
│   │   │       ├── index.get.ts
│   │   │       ├── index.post.ts
│   │   │       └── [id]/...
│   │   ├── activity-logs/, system-logs/, settings/, storage/
│   │   └── health.get.ts
│   │
│   ├── entities/
│   │   ├── user.entity.ts, role.entity.ts, ... (RBAC 9)
│   │   ├── ai-project.entity.ts      # NEW
│   │   ├── ai-prompt.entity.ts
│   │   ├── ai-generation.entity.ts
│   │   ├── ai-app-schema.entity.ts
│   │   ├── ai-data-model.entity.ts
│   │   ├── ai-page.entity.ts
│   │   ├── ai-component-spec.entity.ts
│   │   ├── ai-deployment.entity.ts
│   │   └── generated/            # NEW per slug entity schemas
│   │       └── {slug}/{entity}.entity.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts, users.service.ts, ...
│   │   ├── ai-builder.service.ts         # NEW orchestrator
│   │   └── ai-builder/
│   │       ├── inference.service.ts
│   │       ├── spec.service.ts
│   │       ├── planner.service.ts
│   │       ├── codegen.service.ts
│   │       ├── ui-assembly.service.ts
│   │       └── integration.service.ts
│   │
│   ├── dto/
│   │   ├── auth.dto.ts, users.dto.ts, ...
│   │   └── ai-builder.dto.ts      # NEW: GenerateSchema, RefineSchema, QueryProjectsSchema
│   │
│   ├── utils/
│   │   ├── db.ts, orm-data-source.ts (canonical 17 schemas)
│   │   ├── auth.ts, jwt.ts, password.ts, rbac.ts, route-guard.ts, url-matcher.ts
│   │   └── ai-inference-provider.ts # NEW interface
│   │
│   └── plugins/database.server.ts
│
├── shared/types/
│   ├── user.ts, role.ts, ...
│   ├── ai-project.ts, ai-generation.ts, ai-app-schema.ts  # NEW
│   └── generated/{slug}/{entity}.ts
│
├── nuxt.config.ts
└── package.json
```

---

## Conventions

### Frontend (Nuxt 4)
- Vue 3 `<script setup>` SFCs, TypeScript strict
- UI: **Naive UI** + **Tailwind CSS v4** (utility only, no preflight)
- Auto-imports: composables, components, utilities
- File-based routing: `app/pages/` + `app/generated/{slug}/pages/` (via Nuxt layers atau [...all].vue mount)
- Composables: `useApi`, `useAuthorization`, `useDataTable`, `usePageTransition`, `useAiBuilder`
- Direct imports: `import { NButton } from 'naive-ui'` per component

### Backend (Nitro Server Routes)
- TypeORM `EntitySchema` (not decorators) + `better-sqlite3`
- Route prefix: `/api` (file structure `server/api/`)
- Validation: Zod di `server/dto/` validated di route handler
- Service pattern: plain object `export const XService = { async findAll(){}, ... }`
- Error: `createError({ statusCode, message })` dari `h3`
- Generated routes follow same pattern but under `server/api/generated/[slug]/[entity]/` or dynamic `[slug]`

---

## Routing

### File-Based Routing (Nuxt Pages) — Platform

| File | Route | Auth | Description |
|------|-------|------|-------------|
| `app/pages/login.vue` | `/login` | Guest | Login |
| `app/pages/register.vue` | `/register` | Guest | Register |
| `app/pages/dashboard/index.vue` | `/dashboard` | Required | Dashboard platform (total projects, generations) |
| `app/pages/builder/index.vue` | `/builder` | Required | Builder prompt bar + library |
| `app/pages/builder/[slug].vue` | `/builder/:slug` | Required | Project detail + preview + refine bar |
| `app/pages/dashboard/users.vue` | `/dashboard/users` | Required | User management |
| `app/pages/dashboard/roles.vue` | `/dashboard/roles` | Required | Role management |
| `app/pages/dashboard/permissions.vue` | `/dashboard/permissions` | Required | Permission management |
| `app/pages/dashboard/guards.vue` | `/dashboard/guards` | Required | Guard management |
| `app/pages/dashboard/activity-logs.vue` | `/dashboard/activity-logs` | Required | Activity logs viewer |
| `app/pages/dashboard/system-logs.vue` | `/dashboard/system-logs` | Required | System logs viewer |
| `app/pages/dashboard/settings.vue` | `/dashboard/settings` | Required | Settings |
| `app/pages/dashboard/profile.vue` | `/dashboard/profile` | Required | Profile + change password |

### Generated App Routes (Dynamic)

| Route Pattern | Example | Description |
|---------------|---------|-------------|
| `/generated/:slug` | `/generated/pos-kasir` | Generated dashboard |
| `/generated/:slug/:entity` | `/generated/pos-kasir/products` | Entity list (DataTable) |
| `/generated/:slug/:entity/:id` | `/generated/pos-kasir/products/1` | Detail drawer/page |
| `/generated/:slug/reports` | `/generated/pos-kasir/reports` | Reports page (jika ada di spec) |

Sidebar `AppLayout` merender group `Generated Apps` dinamis dari `GET /api/builder/projects?status=ready`.

### Route Middleware
- `auth` — requires valid JWT, redirect `/login` if missing
- `guest` — redirect `/dashboard` if already authenticated
- `builder` — check `Builder:Generate` permission (opsional, lean)

### Sidebar Menu (AI Builder — 220/72, token #0075de)

```
Builder (NEW)
  ├── Buat Aplikasi        → /builder (AiPromptBar)
  └── Library              → /builder (list)
Generated Apps (dynamic, dari projects ready)
  ├── POS Kasir            → /generated/pos-kasir
  └── CRM Klinik           → /generated/crm-klinik
Dashboard                 → /dashboard
User Management (group)
  ├── User                 → /dashboard/users
  ├── Guard                → /dashboard/guards
  ├── Role                 → /dashboard/roles
  └── Permissions          → /dashboard/permissions
Sistem (group)
  ├── Activity Logs        → /dashboard/activity-logs
  ├── System Logs          → /dashboard/system-logs
  └── Settings             → /dashboard/settings
```

---

## API Endpoints

### AI Builder (New)

| Method | Endpoint | Description | Auth | DTO |
|--------|----------|-------------|------|-----|
| POST | `/api/builder/generate` | Generate app dari prompt | Bearer | `GenerateSchema { prompt: string(3-500), templateSlug?: string }` → `{ project, generation, previewUrl }` |
| POST | `/api/builder/refine` | Refine existing project | Bearer | `RefineSchema { slug: string, prompt: string }` → `{ project, generation }` |
| GET | `/api/builder/projects` | List projects (paginated) | Bearer | `?page&limit&search&status` → `{ data: AiProject[], total }` |
| GET | `/api/builder/projects/:slug` | Detail project + spec + latest generation | Bearer | `slug` |
| GET | `/api/builder/projects/:slug/generations` | List generations per project | Bearer | `?page&limit` |
| GET | `/api/builder/generations/:id` | Detail generation | Bearer | `id` |
| DELETE | `/api/builder/projects/:slug` | Hapus project + generated code | Bearer | `slug` |
| POST | `/api/builder/preview/:slug` | Rebuild preview / get URL | Bearer | `slug` |
| GET | `/api/builder/templates` | List starter templates | Public | — → `AiTemplate[]` |

**Generate Response**:
```json
{
  "project": { "id": 1, "name": "Kasir POS", "slug": "pos-kasir", "status": "generating" },
  "generation": { "id": 1, "status": "running", "spec": {...} },
  "previewUrl": "/generated/pos-kasir"
}
```

**Error**: `422` jika prompt terlalu pendek (<3), `409` jika slug collision tak ter-resolve, `500` jika codegen gagal (generation.status=failed + error message).

### Generated App API (Dynamic per Slug/Entity)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/:slug/:entity` | List (paginated, search/sort) | Bearer |
| GET | `/api/:slug/:entity/:id` | Detail | Bearer |
| POST | `/api/:slug/:entity` | Create | Bearer |
| PUT | `/api/:slug/:entity/:id` | Update | Bearer |
| DELETE | `/api/:slug/:entity/:id` | Delete | Bearer |

Contoh: `GET /api/pos-kasir/products?page=1&limit=20&search=kopi&sortBy=price&sortOrder=DESC` → `{ data, total, page, limit, totalPages }`

DTO per entity digenerate: `Create{Entity}Schema` (Zod ketat), `Query{Entity}Schema` (page/limit/search).

### Auth & RBAC (Existing, tetap)

Same as before: `/api/auth/*`, `/api/users/*`, `/api/roles/*`, `/api/permissions/*`, `/api/guards/*`, `/api/activity-logs/*`, `/api/system-logs/*`, `/api/settings/*`, `/api/storage/*`, `/api/health`.

Builder menambah permissions seed:
- `Builder:Generate` → `POST /api/builder/generate`, `POST /api/builder/refine`
- `Builder:Read` → `GET /api/builder/projects*`, `GET /api/builder/generations/*`
- `Generated:*` → wildcard untuk generated APIs (atau per-slug `Generated:{Slug}:Read/Write`)

---

## RBAC System

Same flow: `requireAuth` → `requireApiAccess` (permission method+URL via `matchUrlPattern`). Generated permissions di-seed otomatis saat `AiProject` ready: untuk setiap `AiDataModel` buat 2 permissions (`{Slug}:{Entity}:Read` → GET, `{Slug}:{Entity}:Write` → POST/PUT/DELETE) dan assign ke role Admin/Kasir yang di-infer.

Client: `useAuthorization()` + `canAccessUrl()` tetap untuk gating menu. Builder UI cek `hasPermission('Builder:Generate')` untuk show AiPromptBar CTA.

Startup checks: `server/plugins/database.server.ts` init DB → drift detection → seed RBAC + builder templates → startup self-checks (JWT, storage, drift). Dev silent gate tetap.

---

## Entity Relationships (Updated)

```
users ──< users_roles >── roles ──< roles_guards >── guards ──< guard_urls
                         │  │
                         │  └─< roles_permissions >── permissions ──< permission_methods
                         │                          └─< permission_urls
                         │
                         └─< ai_projects (owner user)
                              │
                              ├─< ai_prompts (version, inferredIntent JSON)
                              │
                              ├─< ai_generations (spec JSON, error, durationMs)
                              │       │
                              │       └─ ai_app_schemas (entities JSON, pages JSON, roles JSON)
                              │               │
                              │               ├─< ai_data_models (fields JSON, relations JSON)
                              │               ├─< ai_pages (route, type, componentTree JSON)
                              │               └─< ai_component_specs (props JSON, tokens)
                              │
                              └─< ai_deployments (env, url, builtAt)

users ──< activity_logs (nullable userId SET NULL)
settings (key-value)
```

| Relationship | Type |
|--------------|------|
| AiProject → AiPrompt | One-to-Many |
| AiProject → AiGeneration | One-to-Many |
| AiGeneration → AiAppSchema | One-to-One |
| AiAppSchema → AiDataModel | One-to-Many |
| AiAppSchema → AiPage | One-to-Many |
| AiAppSchema → AiComponentSpec | One-to-Many |
| AiProject → AiDeployment | One-to-Many |
| User → AiProject (owner) | One-to-Many (nullable, SET NULL jika user dihapus) |

---

## Tech Stack

### Frontend
- Nuxt 4 (Vue 3.5 + Nitro) + TypeScript 6 + Pinia + Naive UI 2.44 + Tailwind CSS v4 + Storybook 10 + Vitest 4
- `useAiBuilder` composable (Axios wrapper + generation state)
- `app/generated/*` terisolasi (Nuxt layers atau manual mount)

### Backend (Nitro)
- TypeORM 1.1 EntitySchema + better-sqlite3 + bcrypt + Zod + jsonwebtoken
- Builder services: `ai-builder.service.ts` orchestrator + `ai-builder/` sub-services
- Inference provider interface: `AiInferenceProvider { infer(prompt: string): Promise<InferredIntent> }` — stub rule-based v1, siap ganti LLM

### Database
- SQLite via `better-sqlite3`
- Dev `synchronize: true`, Production `synchronize: false` + `migrationsRun: true`
- Baseline: `server/migrations/1788914913928-Baseline.ts` (RBAC 9 schemas) + `server/migrations/<ts>-AiBuilder.ts` (builder 8 schemas)
- CLI: `migration:generate/run/revert` via `server/utils/migration-cli.ts`

---

## Design System

Lihat `docs/design-system.md` — token kanonis + Generated UI rules (PageShell, DataTable, detail-view, radius, animasi, responsive). Generated apps WAJIB re-use token yang sama, tidak boleh invent palette baru.

---

## Table Browse Component (Kanonis — Berlaku RBAC + Generated)

`app/components/common/DataTable/DataTable.vue` — props `columns`, `data`, `loading`, `page`, `limit`, `total`, `sortBy`, `sortOrder`, `searchPlaceholder`, `searchableFields`, `error`, emits `update:page`, `search`, `sort-change`, slots `toolbar` + `#empty` (single NEmpty `Belum ada data`). Fitur: Global Search 320px + Field-Specific 160px + Refresh + Error Slot NAlert + Pagination ID `Menampilkan {from}-{to} dari {total}` + Column Visibility + Sorting + Empty CTA `+ Buat ...`.

`useDataTable` mengelola state; generated pages re-use `DataTable` tanpa duplikasi.

---

## PageShell (Kanonis)

`app/components/layout/PageShell.vue` — `props: title, breadcrumbs, description?`, slots `actions` + `default`. Header 20px Semibold + breadcrumb `<a href>` + `router.push` + toolbar → konten → pagination. Wajib untuk semua list/detail/editor baik RBAC maupun generated.

---

## Storybook Foundation

`apps/web/stories/foundation/` — PageShell, DataTable, AccessDeniedAlert, plus baru `Builder/AiPromptBar`, `Builder/ProjectCard`.

---

## Change Log

### AI App Builder — Platform Pivot (2026-09-15)

- **PIVOT** dari RBAC-Only ke AI App Builder — layer stack baru (AI Builder Layer), generation flow (Prompt → Inference → Spec → CodeGen → UI Assembly → Preview), module boundaries (+ Builder + Generated App), project structure (+ `app/components/builder/`, `app/generated/{slug}/`, `server/api/builder/`, `server/services/ai-builder/`, `server/entities/ai-*.entity.ts`), routing (+ `/builder`, `/builder/:slug`, `/generated/:slug/*`), API Endpoints (+ 9 builder endpoints + dynamic `/:slug/:entity` CRUD), entity relationships (+ AiProject/Prompt/Generation/AppSchema/DataModel/Page/ComponentSpec/Deployment), tech stack (+ `useAiBuilder`, `AiInferenceProvider`).
- **Dipertahankan**: Auth/RBAC flow, DataTable/PageShell kanonis, SQLite synchronize/migrations, seed idempotent.

### Tailwind-First Component CSS (2026-09-13)

- Tailwind v4 intended direction, CURRENT campuran — migrasi bertahap.

