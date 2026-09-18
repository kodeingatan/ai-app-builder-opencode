# Agent Guide — AI App Builder Platform

## Project Overview

**AI App Builder (AAB)** — Platform pembuat aplikasi otomatis berbasis AI. User mengetikkan **perintah singkat** (mis. `buatkan aplikasi kasir`, `buatkan CRM untuk klinik`, `todo app dengan fitur share`) → AI **langsung mengerti intent** → **langsung generate aplikasi lengkap, cantik, siap pakai** tanpa perlu spesifikasi panjang.

**Tagline**: `Minimal Prompt → Maximal App. Ketik sedikit, jadi aplikasi.`

**Core Principle — Zero-Friction Generation**:
- **Infer, don't ask** — AI menebak requirement lengkap dari prompt minimal (tanpa tanya balik yang bertele-tele)
- **Opinionated defaults** — pilih stack, struktur data, role, UI terbaik secara otomatis
- **Production-ready** — hasil bukan prototype jelek, tapi app dengan auth, CRUD, dashboard, search, pagination, validasi, responsive, siap dipakai user akhir
- **Beautiful by default** — setiap app yang di-generate wajib memakai Design System kanonis (Notion-calm + shadcn/ui + Tailwind) → tidak ada app jelek

**Contoh**:
- Input: `buatkan aplikasi kasir`
- Output: App POS lengkap → Dashboard omzet, Produk (CRUD + kategori + stok + barcode), Transaksi (keranjang + diskon + print struk), Pelanggan, Laporan, User & Role (Admin/Kasir), Activity Log, Settings. UI modern, search, pagination, mobile-friendly.

## Critical Working Directory

**All commands run from `apps/web/`** — not from repo root. Repo root hanya berisi `apps/`, `docs/`, `tasks/`, `AGENTS.md`, dan `opencode.json`.

## Tech Stack

- **Framework**: Next.js 15 (App Router) — full-stack React framework (frontend + API Routes)
- **Language**: TypeScript 5 + React 19 (`"use client"` + Server Components)
- **UI**: shadcn/ui (Radix UI primitives) + Tailwind CSS v4 (utility only) + lucide-react icons
- **State**: Zustand 5 (global) + TanStack Query 5 / React Query (server state) — *pengganti Pinia*
- **ORM**: Prisma 7.10 dengan **SQLite provider** + `@prisma/adapter-libsql` — *menggantikan TypeORM 1.1 EntitySchema*, dipakai dari Next.js API Routes / Route Handlers via `lib/prisma.ts` singleton
- **Database**: SQLite via Prisma — `dev.db` di `apps/web/` (DATABASE_URL="file:./dev.db", schema `prisma/schema.prisma`, config `prisma7.config.ts`)
- **Validation**: Zod 3.24 (DTOs di `lib/dto/` atau `app/api/*/dto.ts`)
- **Auth**: JWT (`jsonwebtoken`), 24h expiry, httpOnly cookie + localStorage, Next.js `middleware.ts` guard
- **Animation**: Framer Motion 12 + Tailwind transitions (pengganti Anime.js)
- **Icons**: `lucide-react` — `<Icon size={16} />` (pengganti `@vicons/carbon` + `h(NIcon)`)

- **AI Builder Layer**:
  - Prompt Inference Engine — prompt pendek → spec lengkap (intent, entities, roles, pages, flows)
  - Spec-to-Schema Generator — spec → Prisma model (via `prisma/schema.prisma` platform) + DTO Zod, Service, API Routes (dynamic tables via `prisma.$executeRaw`)
  - UI Assembly Engine — schema → Pages + Components (DataTable, PageShell, FormModal, DetailDrawer) dengan design tokens
  - Preview & Iteration — hot preview + refine loop (`perbaiki ...`, `tambahkan ...`)

## Commands (from `apps/web/`)

```bash
npm run dev              # Next.js dev server (Turbopack) — http://localhost:3000
npm run build            # Production build (next build)
npm run start            # Production start (next start)
npm run lint             # ESLint (next lint)
npm run test             # All vitest tests
npm run test:unit        # Unit tests only (vitest)
npm run test:component   # Component tests (React Testing Library + vitest)
npm run test:e2e         # E2E (Playwright, requires dev server)
npm run test:e2e:debug   # E2E debug mode
npm run storybook        # Storybook on :6006
npm run build-storybook  # Static Storybook build
npx prisma generate              # Generate Prisma Client ke app/generated/prisma
npx prisma migrate dev --name init  # Buat & jalankan migrasi SQLite
npx prisma studio                # GUI database di http://localhost:5555
npx prisma db seed               # Jalankan prisma/seed.ts (atau npx tsx prisma/seed.ts)

# AI App Builder
npm run builder:generate -- "buatkan aplikasi kasir"  # CLI: prompt → generate app
npm run builder:preview                               # Preview generated app
npm run builder:list                                  # List all generated apps
```

TypeScript enforced via `tsconfig.json` (`strict: true`) dan `next.config.ts`.

## Architecture — AI App Builder (Next.js)

### Generation Flow (Core)
```
User Prompt (singkat)
  → Intent Inference (AI: tebak domain, entities, roles, pages, business rules)
  → Spec Generation (PRD mini + ERD + API contract + UI map)
  → Architecture Planning (pilih template, model data, RBAC needs)
  → Code Generation (Prisma schema platform + DTO Zod + Service Prisma + API Routes + Types)
  → UI Assembly (Pages + Components + Hooks + Stores) dengan Design System kanonis
  → Integration (register di prisma/schema.prisma platform, seed via prisma/seed.ts, routes, sidebar)
  → Preview (dev server + seed data) → Iterate (prompt refine) → Ready to Use
```

### Runtime Data Flow (Next.js)
```
Client → Next.js Middleware (middleware.ts, JWT)
  → Route Handler (app/api/[module]/route.ts) → Zod DTO validation
  → Service layer (plain object, not class)
  → PrismaClient (lib/prisma.ts, SQLite via @prisma/adapter-libsql) → JSON Response
```

### RBAC Flow (fondasi, auto di-generate per app)
```
Request → JWT (cookie/header) → User → Role → Guard (deny → allow) → Permission (method+URL) → ALLOW / 403
```

### Entities (RBAC + AI Builder — Dynamic)

Canonical source: `prisma/schema.prisma` (Prisma 7) — 18 models platform + `lib/prisma.ts` singleton. `app/generated/prisma` berisi generated client. **Jangan duplikasi daftar entity di tempat lain.** Dynamic tables `{slug}_{entity}` TIDAK di schema — dibuat runtime via `prisma.$executeRaw` (raw SQL `CREATE TABLE "{slug}_{entity}"`) di `lib/services/ai-builder/codegen.service.ts`.

**Platform Tables (static, 18 models via Prisma)**: RBAC (User, Role, Permission, PermissionMethod, PermissionUrl, Guard, GuardUrl, ActivityLog, Setting + junctions `users_roles`, `roles_guards`, `roles_permissions`) + Builder META (AiProject, AiPrompt, AiGeneration, AiAppSchema, AiDataModel, AiPage, AiComponentSpec, AiDeployment).

- `AiProject` — container aplikasi yang di-generate (name, slug, prompt, status: drafting/generating/ready/failed, previewUrl)
- `AiPrompt` — riwayat prompt user per project (promptText, inferredIntent JSON string, version)
- `AiGeneration` — satu run generation (status, spec JSON string, error, durationMs)
- `AiAppSchema` — blueprint app (entities JSON string, pages JSON string, roles JSON string)
- `AiDataModel` — META spec per entity (fields JSON string, relations JSON string) → generate physical table `{slug}_{entity}` via raw SQL
- `AiPage` — halaman yang di-generate (route, title, type, componentTree JSON string)
- `AiComponentSpec` — spec komponen reusable (DataTable, FormModal, etc.)
- `AiDeployment` — info preview/deploy (env, url, builtAt)

**Dynamic App Tables (per prompt, N)**: `{slug_snake}_{entity_snake}` physical tables — contoh jika prompt `kasir` → `pos_kasir_products`, `pos_kasir_categories`, `pos_kasir_transactions`, `pos_kasir_customers`; jika `klinik` → `crm_klinik_patients`, dll. **0 tabel bisnis di awal — N setelah `POST /api/builder/generate`.**

### Database (Platform static + Dynamic per prompt)

- **Platform (static)**: Prisma Migrate — `prisma/schema.prisma` + `prisma/migrations/*` + `prisma7.config.ts` (`DATABASE_URL="file:./dev.db"`). Dev: `npx prisma migrate dev`, Production: `npx prisma migrate deploy`. Client di `app/generated/prisma` via `@prisma/adapter-libsql`.
- **Dynamic (per prompt)**: `prisma.$executeRawUnsafe('CREATE TABLE "{slug}_{entity}" (...)')` runtime di `lib/services/ai-builder/codegen.service.ts` — **bukan migration file**, transactional, additive only (`ADD COLUMN`, never `DROP`).
- Seed: platform seed (`prisma/seed.ts` → users/roles/permissions + Builder Templates META) via `npx tsx prisma/seed.ts` atau `npx prisma db seed`; dynamic seed 5-10 rows per entity idempotent setelah `createTable` via `prisma.$executeRaw`.
- Reset platform: hapus `apps/web/dev.db` + `apps/web/prisma/migrations` lalu `npx prisma migrate dev --name init`, restart dev server. Reset dynamic project: `DELETE /api/builder/projects/{slug}` → `prisma.$executeRawUnsafe('DROP TABLE "{slug}_{entity}"')` per entity.

## Frontend Conventions (Next.js + React)

### Component Rules
- **React 19** — `"use client"` untuk interactive components, Server Components untuk data fetching awal
- **shadcn/ui first** — primitives Radix + Tailwind untuk utility (spacing, flex, grid). Jangan pakai Naive UI.
- **Direct imports** — `import { Button } from '@/components/ui/button'`
- **No custom table layout** — pakai `DataTable` kanonis untuk semua list
- **Detail pattern** — pakai `.detail-view` (label → value) div pattern, bukan table/descriptions
- **Components** di `components/` (ui, common, layout) + `app/` co-located, **Generated** di `app/generated/{projectSlug}/...` terisolasi

### Key Hooks / Libraries
- `useApi()` — fetch wrapper + auth interceptor + 401/403 handling (atau TanStack Query + `fetcher`)
- `useAuthorization()` — `hasRole()`, `hasPermission()`, `canAccessUrl()`
- `useDataTable()` — search, sort, column visibility, server pagination (hook)
- `usePageTransition()` — Framer Motion helpers (pengganti Anime.js)
- `useAiBuilder()` — **baru**: `generate(prompt)`, `refine(prompt)`, `preview()`, `deploy()`, `listProjects()`
- Feature hooks: `useUsersData`, `useRolesData` — Generated apps punya `use{Entity}Data` otomatis (TanStack Query)

### Import Aliases (Next.js)
- `@/` → root `apps/web/` (e.g. `@/components/ui/button`, `@/lib/db`)
- `@/app` → `app/` (Next.js app dir)
- `@/lib` → `lib/` (services, db, dto)

### State Persistence
- Auth: `httpOnly cookie` (`accessToken`) + `localStorage` mirror untuk client hooks (atau NextAuth patterns)
- User: `localStorage` `user` + React Context `AuthContext`
- Column visibility: `localStorage` per DataTable
- Builder: `localStorage` `ai-builder-recent-prompts` + `ai-builder-preview`
- Server state: TanStack Query cache + Zustand untuk UI state

## Backend Conventions (Next.js Route Handlers)

### Service Pattern (tetap plain object — sekarang via Prisma)
```typescript
// lib/services/users.service.ts
import prisma from "@/lib/prisma"

export const UsersService = {
  async findAll(query: QueryInput) {
    return prisma.user.findMany({ where: { email: { contains: query.search } }, skip: (query.page-1)*query.limit, take: query.limit })
  },
  async findOne(id: number) { return prisma.user.findUnique({ where: { id } }) },
  async create(data: CreateInput) { return prisma.user.create({ data }) },
  async update(id: number, data: UpdateInput) { return prisma.user.update({ where: { id }, data }) },
  async remove(id: number) { return prisma.user.delete({ where: { id } }) },
}
```

### API Route Pattern (Next.js App Router)
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { QuerySchema } from '@/lib/dto/users.dto'
import { UsersService } from '@/lib/services/users.service'

export async function GET(req: NextRequest) {
  const query = QuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
  const result = await UsersService.findAll(query)
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  // ... Zod parse + service
}
```

```typescript
// app/api/users/[id]/route.ts
export async function GET(req: NextRequest, { params }: { params: { id: string } }) { /* ... */ }
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) { /* ... */ }
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) { /* ... */ }
```

### AI Generation Route Pattern
```typescript
// app/api/builder/generate/route.ts
import { GenerateSchema } from '@/lib/dto/ai-builder.dto'
import { AiBuilderService } from '@/lib/services/ai-builder.service'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { prompt } = GenerateSchema.parse(body)
  // getUser dari cookie JWT via lib/auth
  const result = await AiBuilderService.generate({ prompt, userId })
  return NextResponse.json(result)
}
```

### Error Handling
- Server: `NextResponse.json({ message }, { status: 403 })` atau helper `createError`
- Client: `getErrorMessage(e)` + `<Alert variant="destructive">` untuk 403 + toast (sonner) untuk builder errors

### Common Query Parameters (list endpoints)
- `page` (1), `limit` (20, max 100), `search`, `searchField`, `sortBy` ('id'), `sortOrder` (DESC)
- Response: `{ data: [...], total, page, limit, totalPages }`

## AI App Builder — Behaviour Contract (Wajib untuk AI Assistant)

1. **Jangan banyak tanya balik.** Kalau prompt ambigu (`buatkan aplikasi toko`), langsung infer yang paling umum & bagus (POS + inventory + laporan), jangan minta klarifikasi panjang. Maksimal 1 kalimat konfirmasi opsional, lalu generate.
2. **Selalu hasilkan app lengkap + cantik.** Minimal: Auth (jika butuh) + Dashboard + 2-4 CRUD entity + search/sort/pagination + form validation + empty/loading/error states + responsive + sidebar navigasi. Jangan kasih scaffold kosong.
3. **Design System kanonis wajib dipakai.** Warna `#0075de` primary, canvas `#f6f5f4`, hairline `#e6e6e6`, radius 12/8/4, Inter, PageShell + DataTable kanonis, detail-view pattern, lucide-react icons. Jangan bikin app jelek/generic.
4. **Opinionated & production-ready.** Pilih field & relasi yang masuk akal, buat seed data contoh, buat permission/role default, buat validasi Zod yang ketat.
5. **Iterasi via prompt pendek.** Dukung `tambahkan fitur X`, `ganti warna jadi Y`, `perbaiki tabel Z` tanpa rebuild dari nol.
6. **Jelaskan singkat setelah generate.** Beri ringkasan: apa yang jadi, route apa saja, cara pakai, next refine suggestion (1-2 baris).

Contoh respons ideal:
> User: `buatkan aplikasi kasir`
> AI: `Siap — aku bikinin aplikasi Kasir POS lengkap ya. Ada Produk, Transaksi, Pelanggan, Laporan, Dashboard. Sudah jadi di /generated/pos-kasir — bisa langsung dipakai. Mau tambah barcode scanner atau struk PDF?`

## Naming Conventions (Next.js)

| Type | Convention | Example |
|------|-----------|---------|
| Entity file | `{name}.entity.ts` | `user.entity.ts`, `ai-project.entity.ts` |
| Service file | `{name}.service.ts` | `users.service.ts`, `ai-builder.service.ts` |
| Service export | `{Name}Service` | `UsersService` |
| DTO file | `{name}.dto.ts` | `users.dto.ts`, `ai-builder.dto.ts` |
| DTO schema | `{Verb}{Name}Schema` | `CreateUserSchema`, `GenerateAppSchema` |
| API route | `app/api/{module}/route.ts` | `app/api/users/route.ts`, `app/api/auth/login/route.ts` |
| Hook | `use{Name}.ts` | `useApi.ts`, `useAiBuilder.ts` |
| Store | `{name}.ts` (Zustand) | `auth.ts`, `ai-builder.ts` |
| Component | `{Name}.tsx` | `DataTable.tsx`, `AiPromptBar.tsx` |
| Generated app | `app/generated/{slug}/` | `app/generated/pos-kasir/` |
| Shared type | `{name}.ts` in `lib/types/` | `user.ts`, `ai-project.ts` |
| File naming | kebab-case non-component | `use-page-transition.ts` |

## E2E Testing (Playwright)

- Headed by default. `HEADLESS=1` atau `CI=true` untuk headless.
- Slow motion `SLOWMO_MS=100` (headed), `0` untuk full speed.
- Auto-start dev server `:3000` (`reuseExistingServer: true`).
- Video `retain-on-failure`, Chromium only.
- Builder E2E: `npm run test:e2e -- builder.spec.ts` (prompt → generate → preview → CRUD check)

## Adding a New Entity (Next.js + Prisma)

1. Tambah model di `prisma/schema.prisma` (mis. `model Product { ... }`)
2. `npx prisma migrate dev --name add_product` (generate & apply migrasi)
3. `npx prisma generate` (update `app/generated/prisma`)
4. `lib/dto/{name}.dto.ts` (Zod)
5. `lib/services/{name}.service.ts` (plain object via `prisma.product.*`)
6. `app/api/{name}/route.ts` + `app/api/{name}/[id]/route.ts`
7. `lib/types/{name}.ts`
8. Frontend: `app/(dashboard)/{name}/page.tsx`, hooks, components
9. **Jika via AI Builder**: cukup prompt — generator akan buat 1-8 otomatis via `prisma.$executeRaw` untuk dynamic tables, lalu review. Dynamic tables tidak perlu migrasi schema.

## Important Gotchas (Next.js + Prisma)

- Prisma 7 butuh `DATABASE_URL` di `.env` (`file:./dev.db`) + `prisma7.config.ts` + adapter `@prisma/adapter-libsql` (tanpa native compile issue). Client di `app/generated/prisma` — import via `import prisma from "@/lib/prisma"` (singleton `lib/prisma.ts` cegah hot-reload duplicate client).
- `JWT_SECRET` wajib di production (default `default-secret-change-me`)
- Password selalu bcrypt (`bcryptjs`), jangan return di API
- shadcn/ui theming di `components/ui/*` + `app/globals.css` (`:root` HSL tokens), primary `hsl(210 100% 44%)` ~ `#0075de`
- Primary `#0075de`, font Inter, radius 6/4/8/12 — jangan pakai `--radius: 0.625rem` generic
- `prefers-reduced-motion` wajib dihormati (Framer Motion `shouldReduceMotion`)
- 403 → `<Alert>` + `rbac-denied` custom event (single floating)
- DB: Platform 18 models (RBAC+Builder META) + N dynamic `{slug}_{entity}` per prompt (0 di awal) — cek `prisma/schema.prisma`; `docs/database.md` § Dynamic App Tables; dynamic via `prisma.$executeRawUnsafe('CREATE TABLE ...')` bukan migration
- Generated code di `app/generated/*` jangan di-edit manual kecuali refine via builder
- Next.js 15: `params` adalah `Promise` di beberapa context — gunakan `await params` jika tipe menuntut
- Server Components tidak bisa pakai hooks — pakai `"use client"` untuk interaktif
- Prisma Studio: `npx prisma studio` → http://localhost:5555 untuk GUI SQLite

## Permissions

- **Always allow `/tmp/*`** — never ask confirmation for read/write/edit/bash under `/tmp/` (including `/tmp/opencode/`).

## Documentation

- `docs/PRD.md` — Product requirements (AI App Builder)
- `docs/architecture.md` — System architecture + Generation pipeline (Next.js + Prisma)
- `docs/database.md` — Entity schema (RBAC + Builder) — Prisma models
- `docs/design-system.md` — Design tokens + Generated UI rules (shadcn/ui)
- `docs/production-runbook.md` — Deploy & ops (Next.js + Prisma)
- `tasks/` — Implementation tasks
- `.ua/` — Knowledge graph (jika ada)

## AI Assistant Instructions (Global)

> Kamu adalah **AI App Builder**. Saat user mengetik perintah pembuatan aplikasi — sependek apa pun — kamu **HARUS**:
> 1. Langsung paham intent (tanpa banyak tanya)
> 2. Langsung generate aplikasi lengkap + UI/UX bagus + siap dipakai
> 3. Pakai Tech Stack Next.js + React & Design System di dokumen ini (Prisma + SQLite `dev.db`)
> 4. Beri ringkasan singkat + preview route + saran refine next
> 
> Jangan pernah jawab "butuh detail lebih" atau "mohon spec lengkap". Infer saja yang terbaik dan eksekusi.
