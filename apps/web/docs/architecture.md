> **Last Backup:** 2026-09-18 — via `/knowledge:backup`
> **Source:** `apps/web/*` — `prisma/schema.prisma` (25 models), `app/*`, `lib/*`, `components/*`
> **Scope:** `apps/web` — untuk root lihat `../../docs/`

# Architecture — AI App Builder Platform (Next.js)

## Overview

Single Next.js 15 package (App Router) + **AI Builder Layer**:
- **Frontend**: Next.js 15 + React 19 + TypeScript (App Router, Server Components + `"use client"` islands)
- **Backend**: Next.js Route Handlers (`app/api/**/route.ts`) + Prisma 7.10 + SQLite (via @prisma/adapter-libsql) + Zod + JWT
- **AI Builder Layer**: Prompt Inference → Spec Generation → Code Generation → UI Assembly → Preview & Iteration ( `lib/services/ai-builder/` + `hooks/useAiBuilder.ts` )

Tagline: `Minimal Prompt → Maximal App`

---

## Layer Stack — AI App Builder (Next.js)

```text
┌──────────────────────────────────────────────────────────────┐
│                     PRESENTATION (Next.js)                    │
│  Next.js 15 App Router + React 19 + shadcn/ui + Tailwind      │
│  + PageShell + DataTable + AiPromptBar + Generated Pages      │
├──────────────────────────────────────────────────────────────┤
│                    AI BUILDER LAYER                            │
│  Inference Engine → Spec Generator → Schema Generator          │
│  → UI Assembly Engine → Preview & Iteration                    │
├──────────────────────────────────────────────────────────────┤
│                     AUTHORIZATION                              │
│  middleware.ts JWT → User → Role → Permission (method+URL)     │
│  + Guard gating + Generated App Auto-Permissions               │
├──────────────────────────────────────────────────────────────┤
│                      APPLICATION                               │
│  Route Handlers: app/api/auth, users, roles, builder,          │
│  generated [slug]/[entity] + lib/services/*                    │
├──────────────────────────────────────────────────────────────┤
│                      DATA LAYER (Platform + Dynamic)           │
│  Prisma 7.10 models (Platform 18 models + N dynamic via raw)   │
│  RBAC + Builder META — SQLite via @prisma/adapter-libsql —     │
│  Dynamic = {slug}_{entity} per prompt (0 di awal)              │
└──────────────────────────────────────────────────────────────┘
```

### Architecture Rules

1. **RBAC sebagai penjaga** — semua operasi sensitif wajib permission method+URL (`requireApiAccess` di `lib/auth/guard.ts`)
2. **Builder sebagai orkestrator** — inference → spec → codegen → UI assembly terisolasi di `lib/services/ai-builder/`, tidak mencemari service RBAC
3. **Generated code terisolasi** — `app/generated/[slug]/` + `lib/db/entities/generated/[slug]/` + `app/api/generated/[slug]/[entity]/route.ts` tidak edit manual; refine via builder
4. **Opinionated & beautiful** — generated UI wajib pakai Design System kanonis (shadcn/ui + PageShell + DataTable + token `#0075de`)
5. **JWT stateless** — 24 jam, `httpOnly` cookie `accessToken` + `Authorization: Bearer` header, verifikasi di `middleware.ts` + `lib/auth/jwt.ts`
6. **Stateless CRUD** — baik RBAC maupun generated entities pakai service plain object pattern
7. **Next.js conventions** — Server Components default, `"use client"` hanya untuk interaktif, `params` bisa `Promise`, `NextResponse.json`, `NextRequest`

### Module Boundaries

| Concern | Responsibility | Example |
|---------|---------------|---------|
| Auth | Login/register/profile/password + JWT | `POST /api/auth/login` (`app/api/auth/login/route.ts`) |
| RBAC | CRUD user/role/permission/guard | `app/(dashboard)/users/page.tsx` + `app/api/users/route.ts` |
| Sistem | Activity logs, system logs, settings, storage | `app/(dashboard)/activity-logs/page.tsx` |
| **AI Builder** | Prompt → Inference → Spec → CodeGen → Preview | `POST /api/builder/generate` |
| **Generated App** | CRUD per entity hasil generate + dashboard | `GET /api/generated/pos-kasir/products` |
| Builder Management | Library, generations, preview, refine | `app/builder/[slug]/page.tsx` |

---

## Generation Flow (Core — Detail)

```
User Prompt (1 baris: "buatkan aplikasi kasir")
  │
  ├─► AiPrompt.create { promptText, userId, projectId? }
  │
  ├─► Inference Engine (lib/services/ai-builder/inference.service.ts)
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
  │     Provider interface: AiInferenceProvider (rule-based stub v1, LLM-ready)
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
│       prisma.$executeRaw(`CREATE TABLE "{slug}_{entity}" (...)`) // dynamic via Prisma raw
│       lib/dto/{slug}/{entity}.dto.ts (Zod)
│       lib/services/{slug}/{entity}.service.ts (plain object via prisma.$queryRaw)
│       app/api/generated/{slug}/{entity}/route.ts + app/api/generated/{slug}/{entity}/[id]/route.ts
│       lib/types/{slug}/{entity}.ts
│     For each AiPage →
│       app/generated/[slug]/page.tsx (PageShell + DataTable + FormModal)
│       app/generated/[slug]/components/...
│       hooks/use{Entity}Data.ts (TanStack Query)
│       stores: Zustand `use{Entity}Store`
│
  ├─► Integration (integration.service.ts)
│     - Dynamic tables dibuat via prisma.$executeRawUnsafe (bukan data-source)
│     - Generate seed (5-10 rows per entity) via prisma.$executeRaw
│     - Register sidebar nav (dynamic menu Generated Apps)
│     - Create AiDeployment { env: preview, url: /generated/{slug} }
  │
  └─► Preview & Iterate
        Next.js dev server hot-reload → user lihat /generated/{slug}
        Refine: POST /api/builder/refine { slug, prompt: "tambahkan barcode" } → delta patch
```

**Status enum** di `AiProject.status` dan `AiGeneration.status`: `drafting` → `generating` → `ready` | `failed`
`AiGeneration` simpan `spec` JSON, `error` text, `durationMs`.

---

## Next.js 15 Project Structure

```
apps/web/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Inter font, toaster, providers)
│   ├── globals.css               # Tailwind v4 + design tokens :root
│   ├── page.tsx                  # / → redirect /builder or /dashboard
│   ├── (auth)/                   # Auth group
│   │   ├── login/page.tsx        → /login
│   │   └── register/page.tsx     → /register
│   ├── (dashboard)/              # Dashboard group (AppLayout)
│   │   ├── layout.tsx            # Sidebar 220/72 + Topbar
│   │   ├── dashboard/page.tsx    → /dashboard (platform stats)
│   │   ├── users/page.tsx        → /dashboard/users
│   │   ├── roles/page.tsx
│   │   ├── permissions/page.tsx
│   │   ├── guards/page.tsx
│   │   ├── activity-logs/page.tsx
│   │   ├── system-logs/page.tsx
│   │   ├── settings/page.tsx
│   │   └── profile/page.tsx
│   ├── builder/                  # Builder
│   │   ├── page.tsx              → /builder (AiPromptBar + library)
│   │   └── [slug]/page.tsx       → /builder/:slug (detail + preview + refine)
│   ├── generated/                # Generated apps — terisolasi
│   │   └── [slug]/               # per project slug e.g. pos-kasir
│   │       ├── page.tsx          → /generated/pos-kasir (dashboard)
│   │       ├── products/page.tsx → /generated/pos-kasir/products
│   │       ├── components/
│   │       │   ├── ProductTable.tsx
│   │       │   ├── ProductFormModal.tsx
│   │       │   └── ProductDetailDrawer.tsx
│   │       ├── hooks/
│   │       │   └── useProductsData.ts
│   │       └── stores/
│   │           └── products.ts
│   ├── api/                      # Route Handlers (Next.js)
│   │   ├── auth/
│   │   │   ├── login/route.ts    → POST /api/auth/login
│   │   │   ├── register/route.ts → POST /api/auth/register
│   │   │   └── profile/route.ts  → GET|PATCH /api/auth/profile
│   │   ├── users/
│   │   │   ├── route.ts          → GET /api/users, POST /api/users
│   │   │   └── [id]/route.ts     → GET|PUT|DELETE /api/users/:id
│   │   ├── roles/route.ts + [id]/route.ts
│   │   ├── permissions/route.ts + [id]/route.ts
│   │   ├── guards/route.ts + [id]/route.ts
│   │   ├── builder/              # Builder API
│   │   │   ├── generate/route.ts     → POST /api/builder/generate
│   │   │   ├── refine/route.ts       → POST /api/builder/refine
│   │   │   ├── projects/route.ts     → GET /api/builder/projects
│   │   │   ├── projects/[slug]/route.ts → GET|DELETE
│   │   │   ├── generations/[id]/route.ts
│   │   │   └── templates/route.ts    → GET /api/builder/templates
│   │   ├── generated/            # Dynamic per slug
│   │   │   └── [slug]/[entity]/
│   │   │       ├── route.ts      → GET|POST /api/generated/:slug/:entity
│   │   │       └── [id]/route.ts → GET|PUT|DELETE
│   │   ├── activity-logs/route.ts
│   │   ├── system-logs/...
│   │   ├── settings/route.ts
│   │   └── health/route.ts       → GET /api/health
│   └── [...slug]/page.tsx        # Optional catch-all
│
├── components/                   # Shared components
│   ├── ui/                       # shadcn/ui primitives (Button, Input, Card, Dialog, Table, etc.)
│   ├── common/                   # AuthForm, FormField, DataTable
│   │   └── DataTable/            # Reusable table browse component (shadcn Table)
│   ├── layout/                   # AppLayout, PageShell
│   └── builder/                  # Builder UI
│       ├── AiPromptBar.tsx
│       ├── InferencePreview.tsx
│       ├── GenerationProgress.tsx
│       └── ProjectCard.tsx
│
├── hooks/                        # React hooks (pengganti composables)
│   ├── useApi.ts                 # fetch wrapper + auth
│   ├── useAuthorization.ts       # hasRole, hasPermission
│   ├── useDataTable.ts           # search/sort/pagination
│   ├── usePageTransition.ts      # Framer Motion
│   └── useAiBuilder.ts           # generate, refine, preview, list
│
├── lib/                          # Backend lib (pengganti server/)
│   ├── prisma.ts                 # PrismaClient singleton (adapter-libsql, hot-reload safe)
│   ├── db/
│   │   └── dynamic.ts            # Helper prisma.$executeRaw untuk dynamic {slug}_{entity}
│   ├── prisma/                   # Prisma platform
│   │   ├── schema.prisma         # 18 models platform (DATABASE_URL="file:./dev.db")
│   │   ├── seed.ts               # idempotent seed (users/roles/permissions)
│   │   └── migrations/
│   │       └── 20260918_init/    # Prisma Migrate (platform)
│   ├── services/
│   │   ├── users.service.ts (via prisma.user.*), roles.service.ts, ...
│   │   ├── ai-builder.service.ts
│   │   └── ai-builder/
│   │       ├── inference.service.ts
│   │       ├── spec.service.ts
│   │       ├── planner.service.ts
│   │       ├── codegen.service.ts # prisma.$executeRaw CREATE TABLE "{slug}_{entity}"
│   │       └── integration.service.ts
│   ├── dto/
│   │   ├── users.dto.ts, roles.dto.ts, ...
│   │   └── ai-builder.dto.ts     # GenerateSchema, RefineSchema
│   ├── auth/
│   │   ├── jwt.ts                # sign/verify
│   │   ├── password.ts           # bcrypt hash
│   │   └── guard.ts              # requireAuth / requireApiAccess
│   ├── utils/
│   │   └── url-matcher.ts
│   └── types/
│       ├── user.ts, role.ts, ...
│       └── ai-project.ts
│
├── stores/                       # Zustand (pengganti Pinia)
│   ├── auth.ts
│   ├── ai-builder.ts
│   └── ...
│
├── middleware.ts                 # Next.js middleware (JWT guard, redirect)
├── instrumentation.ts            # DB init + seed on boot
├── next.config.ts
├── tailwind.config.ts (atau css-first via globals.css)
├── tsconfig.json
└── package.json
```

---

## Conventions

### Frontend (Next.js 15 + React 19)
- Server Components default; `"use client"` untuk interactive (DataTable, FormModal, AiPromptBar)
- UI: **shadcn/ui** (Radix) + **Tailwind CSS v4** (utility only, no preflight)
- File-based routing: `app/` App Router + route groups `(dashboard)`, `(auth)` + dynamic `[slug]`
- Hooks: `useApi`, `useAuthorization`, `useDataTable`, `usePageTransition`, `useAiBuilder` (di `hooks/`)
- State: Zustand untuk global UI, TanStack Query untuk server state (list/create/update)
- Styling: Tailwind utility inline + `app/globals.css` tokens, `components/ui/*` untuk primitives

### Backend (Route Handlers)
- Next.js `app/api/**/route.ts` exports `GET`, `POST`, `PUT`, `DELETE`
- Prisma 7.10 + SQLite via `@prisma/adapter-libsql` (singleton `lib/prisma.ts`) — `prisma.user.findMany()`, `prisma.$executeRaw` untuk dynamic
- Validation: Zod di `lib/dto/` validated di route handler (`GenerateSchema.parse(await req.json())`)
- Service pattern: plain object `export const XService = { async findAll(){ prisma... }, ... }`
- Error: `NextResponse.json({ message }, { status: 403 })` + helper
- Generated routes under `app/api/generated/[slug]/[entity]/route.ts` (or `app/api/[slug]/[entity]/route.ts` dynamic) — pakai `prisma.$queryRaw` untuk entity dynamic

---

## Routing

### File-Based Routing (Next.js App Router) — Platform

| File | Route | Auth | Description |
|------|-------|------|-------------|
| `app/(auth)/login/page.tsx` | `/login` | Guest (middleware) | Login |
| `app/(auth)/register/page.tsx` | `/register` | Guest | Register |
| `app/dashboard/page.tsx` or `app/(dashboard)/dashboard/page.tsx` | `/dashboard` | Required | Dashboard platform (total projects) |
| `app/builder/page.tsx` | `/builder` | Required | Builder prompt bar + library |
| `app/builder/[slug]/page.tsx` | `/builder/:slug` | Required | Project detail + preview + refine bar |
| `app/(dashboard)/users/page.tsx` | `/dashboard/users` | Required | User management |
| `app/(dashboard)/roles/page.tsx` | `/dashboard/roles` | Required | Role management |
| `app/(dashboard)/permissions/page.tsx` | `/dashboard/permissions` | Required | Permission management |
| `app/(dashboard)/guards/page.tsx` | `/dashboard/guards` | Required | Guard management |
| `app/(dashboard)/activity-logs/page.tsx` | `/dashboard/activity-logs` | Required | Activity logs viewer |
| `app/(dashboard)/system-logs/page.tsx` | `/dashboard/system-logs` | Required | System logs viewer |
| `app/(dashboard)/settings/page.tsx` | `/dashboard/settings` | Required | Settings |
| `app/(dashboard)/profile/page.tsx` | `/dashboard/profile` | Required | Profile + change password |

### Generated App Routes (Dynamic — Next.js)

| Route Pattern (file) | Example URL | Description |
|----------------------|-------------|-------------|
| `app/generated/[slug]/page.tsx` | `/generated/pos-kasir` | Generated dashboard |
| `app/generated/[slug]/products/page.tsx` | `/generated/pos-kasir/products` | Entity list (DataTable) |
| `app/generated/[slug]/products/[id]/page.tsx` | `/generated/pos-kasir/products/1` | Detail drawer/page |
| `app/generated/[slug]/reports/page.tsx` | `/generated/pos-kasir/reports` | Reports page (jika ada di spec) |

Sidebar `components/layout/AppLayout.tsx` merender group `Generated Apps` dinamis dari `GET /api/builder/projects?status=ready`.

### Middleware

- `middleware.ts` — checks JWT dari cookie `accessToken` / header `Authorization`, redirects `/login` if missing, `guest` redirects `/dashboard` if already auth, `matcher: ['/dashboard/:path*', '/builder/:path*', '/generated/:path*']`

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

### AI Builder (New — Next.js Route Handlers)

| Method | Endpoint | Description | Auth | DTO |
|--------|----------|-------------|------|-----|
| POST | `/api/builder/generate` | Generate app dari prompt | Bearer | `GenerateSchema { prompt: string(3-500) }` → `{ project, generation, previewUrl }` |
| POST | `/api/builder/refine` | Refine existing project | Bearer | `RefineSchema { slug, prompt }` → `{ project, generation }` |
| GET | `/api/builder/projects` | List projects (paginated) | Bearer | `?page&limit&search&status` → `{ data: AiProject[], total }` |
| GET | `/api/builder/projects/:slug` | Detail project + spec + latest generation | Bearer | `slug` |
| GET | `/api/builder/projects/:slug/generations` | List generations per project | Bearer | `?page&limit` |
| GET | `/api/builder/generations/:id` | Detail generation | Bearer | `id` |
| DELETE | `/api/builder/projects/:slug` | Hapus project + generated code | Bearer | `slug` |
| POST | `/api/builder/preview/:slug` | Rebuild preview / get URL | Bearer | `slug` |
| GET | `/api/builder/templates` | List starter templates | Public | — → `AiTemplate[]` |

**Route Handler Example:**
```typescript
// app/api/builder/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GenerateSchema } from '@/lib/dto/ai-builder.dto'
import { AiBuilderService } from '@/lib/services/ai-builder.service'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { prompt } = GenerateSchema.parse(body)
  const userId = req.headers.get('x-user-id') // dari middleware JWT
  const result = await AiBuilderService.generate({ prompt, userId })
  return NextResponse.json(result)
}
```

### Generated App API (Dynamic per Slug/Entity — Next.js)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/generated/:slug/:entity` | List (paginated, search/sort) | Bearer |
| GET | `/api/generated/:slug/:entity/:id` | Detail | Bearer |
| POST | `/api/generated/:slug/:entity` | Create | Bearer |
| PUT | `/api/generated/:slug/:entity/:id` | Update | Bearer |
| DELETE | `/api/generated/:slug/:entity/:id` | Delete | Bearer |

Alternatif: `/api/:slug/:entity` via `app/api/[slug]/[entity]/route.ts` dynamic. Contoh: `GET /api/generated/pos-kasir/products?page=1&limit=20` → `{ data, total, page, limit, totalPages }`

DTO per entity digenerate: `Create{Entity}Schema` (Zod ketat), `Query{Entity}Schema`.

### Auth & RBAC (Existing, Next.js handlers)

`/api/auth/login`, `/api/auth/register`, `/api/auth/profile`, `/api/users`, `/api/roles`, `/api/permissions`, `/api/guards`, `/api/activity-logs`, `/api/system-logs`, `/api/settings`, `/api/health`.

Builder menambah permissions seed:
- `Builder:Generate` → `POST /api/builder/generate`, `POST /api/builder/refine`
- `Builder:Read` → `GET /api/builder/projects*`, `GET /api/builder/generations/*`
- `Generated:*` → wildcard untuk generated APIs

---

## RBAC System (Next.js)

Flow: `middleware.ts` verifikasi JWT → `lib/auth/guard.ts` `requireAuth` / `requireApiAccess` (permission method+URL via `matchUrlPattern`). Generated permissions di-seed otomatis saat `AiProject` ready: untuk setiap `AiDataModel` buat 2 permissions (`{Slug}:{Entity}:Read` → GET, `{Slug}:{Entity}:Write` → POST/PUT/DELETE) dan assign ke role Admin/Kasir yang di-infer.

Client: `hooks/useAuthorization.ts` (`hasRole`, `hasPermission`, `canAccessUrl`) tetap untuk gating menu. Builder UI cek `hasPermission('Builder:Generate')` untuk show AiPromptBar CTA.

Startup: `instrumentation.ts` atau `lib/db/init.ts` init DataSource → drift detection → seed RBAC + builder templates → startup self-checks (JWT, storage, drift).

---

## Entity Relationships (Updated — Next.js paths)

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

Canonis: `prisma/schema.prisma` (18 models) + `lib/prisma.ts` singleton. Platform 18 tabel static; N dynamic `{slug}_{entity}` via `prisma.$executeRaw` per prompt tidak di baseline (`docs/database.md` § Dynamic App Tables).

---

## Tech Stack (Next.js)

### Frontend
- Next.js 15 (App Router, React 19, Turbopack) + TypeScript 5 + Tailwind CSS v4 + shadcn/ui + lucide-react + Framer Motion + Storybook 8 + Vitest 4 + Playwright
- `hooks/useAiBuilder.ts` (fetch wrapper + generation state), Zustand + TanStack Query
- `app/generated/[slug]/` terisolasi (parallel routes atau mounted layout)

### Backend (Next.js Route Handlers)
- Prisma 7.10 + SQLite via `@prisma/adapter-libsql` + bcryptjs + Zod + jsonwebtoken
- Builder services: `lib/services/ai-builder/*` orchestrator + sub-services
- Inference provider interface: `AiInferenceProvider { infer(prompt: string): Promise<InferredIntent> }`

### Database (Platform + Dynamic — Next.js)
- SQLite via Prisma — `dev.db` di `apps/web/` (`prisma/schema.prisma`, `prisma7.config.ts`, `DATABASE_URL="file:./dev.db"`)
- Platform: Prisma Migrate — `prisma/schema.prisma` (18 models) + `prisma/migrations/*` — Dev: `npx prisma migrate dev`, Prod: `npx prisma migrate deploy`. Client di `app/generated/prisma` via `@prisma/adapter-libsql`
- Dynamic: `lib/services/ai-builder/codegen.service.ts` → `prisma.$executeRawUnsafe('CREATE TABLE "{slug}_{entity}" (...)')` runtime per prompt, TIDAK via migration file, additive only, transactional
- CLI: `npx prisma generate`, `npx prisma migrate dev --name <Name>`, `npx prisma studio` (GUI :5555), `npx tsx prisma/seed.ts`

---

## Design System

Lihat `docs/design-system.md` — token kanonis + shadcn/ui mapping + Generated UI rules (PageShell, DataTable, detail-view, radius, animasi, responsive). Generated apps WAJIB re-use token yang sama.

---

## Table Browse Component (Kanonis — Next.js + shadcn/ui)

`components/common/DataTable/DataTable.tsx` — props `columns`, `data`, `loading`, `page`, `limit`, `total`, `sortBy`, `sortOrder`, `searchPlaceholder`, `searchableFields`, `error`, callbacks `onPageChange`, `onSearch`, `onSortChange`, slots `toolbar`. Implementasi: shadcn `Table` + `Input` (320px) + `Select` (160px) + `Button` + `DropdownMenu` untuk column visibility + `Pagination` (ID `Menampilkan {from}-{to} dari {total}`) + `Alert` untuk error + `Empty` + CTA `+ Buat ...`.

`hooks/useDataTable.ts` mengelola state; generated pages re-use `DataTable`.

---

## PageShell (Kanonis — Next.js)

`components/layout/PageShell.tsx` — `props: title, breadcrumbs: {label, href?}[], description?`, `children`, `actions` (ReactNode). Header 20px Semibold + breadcrumb (`next/link`) + toolbar → konten → pagination. Wajib untuk semua list/detail/editor baik RBAC maupun generated.

---

## Storybook Foundation

`apps/web/stories/foundation/` atau `components/ui` stories — PageShell, DataTable, AccessDeniedAlert, plus Builder `AiPromptBar`, `ProjectCard` (Storybook 8 + Next.js).

---

## Change Log

### Stack Migration — Next.js + React (2026-09-15)

- **MIGRASI** dari Nuxt 4 + Vue 3 + Nitro + Pinia + Naive UI → **Next.js 15 (App Router) + React 19 + TypeScript + Zustand + TanStack Query + shadcn/ui + Tailwind + lucide-react + Framer Motion**. Struktur: `app/` (App Router route groups `(dashboard)`, `(auth)`, dynamic `[slug]` + `app/api/**/route.ts` Route Handlers) + `components/ui` (shadcn primitives) + `hooks/` (pengganti composables) + `lib/db` (TypeORM data-source) + `lib/services` + `lib/dto` + `stores/` (Zustand) + `middleware.ts` + `instrumentation.ts`. API pattern: `NextRequest`/`NextResponse.json` + Zod, middleware JWT, icon `lucide-react`. Behaviour & builder contracts tetap.

### AI App Builder — Platform Pivot (2026-09-15)

- AI Builder layer, generation flow, project structure builder + generated, API 9 builder endpoints + dynamic.

