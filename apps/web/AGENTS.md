> **Lokasi:** `apps/web/AGENTS.md` — mirror adaptasi dari root `AGENTS.md` untuk sesi di dalam `apps/web`.
> Last Backup: 2026-09-20 — via /knowledge:backup
> **Scope:** `apps/web/*` saja. Untuk root, lihat `../../AGENTS.md`.
> **Source:** `apps/web/*` — `prisma/schema.prisma` (25 models), `app/*`, `lib/*`

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

**Tambahan Current (2026-09-20):** Platform kini stabil dengan **Generated Global Tabel** (13 tipe kolom, `dyn_*` physical) + **Persuratan** (Component → Template → Administrasi → Hasil) — semua GUI tanpa JSON manual. Lihat `docs/core-concept.md`.

## Critical Working Directory

All commands run from . — path aktual: `apps/web` adalah `.` itu sendiri. Jangan `cd apps/web` lagi. Repo root ada di `../`.

**All commands run from `.`** — ini adalah `apps/web` itu sendiri. Jangan `cd apps/web` lagi. Repo root ada di `../`.

## Tech Stack

- **Framework**: Next.js 16.3.5 (App Router) — full-stack React framework (frontend + API Routes)
- **Language**: TypeScript 5 + React 19 (`"use client"` + Server Components)
- **UI**: shadcn/ui (Radix UI primitives) + Tailwind CSS v4 (utility only) + lucide-react icons
- **State**: Zustand 5 (global) + TanStack Query 5 / React Query (server state)
- **ORM**: Prisma 7.10 dengan **SQLite provider** + `@prisma/adapter-libsql` — dipakai dari Next.js API Routes via `lib/prisma.ts` singleton
- **Database**: SQLite via Prisma — `dev.db` di `apps/web/` (DATABASE_URL="file:./dev.db", schema `prisma/schema.prisma`, config `prisma7.config.ts`)
- **Validation**: Zod 4.6 (DTOs di `lib/dto/` atau `app/api/*/dto.ts`)
- **Auth**: JWT (`jsonwebtoken`), 24h expiry, httpOnly cookie + localStorage, Next.js `middleware.ts` guard (catatan: file middleware tidak ada di repo saat backup — guard dilakukan di service/API)
- **Animation**: Framer Motion 12 + Tailwind transitions
- **Icons**: `lucide-react` — `<Icon size={16} />`

- **AI Builder Layer**:
  - Prompt Inference Engine — prompt pendek → spec lengkap (intent, entities, roles, pages, flows)
  - Spec-to-Schema Generator — spec → Prisma model + DTO Zod, Service, API Routes (dynamic tables via `prisma.$executeRaw`)
  - UI Assembly Engine — schema → Pages + Components (DataTable, PageShell, FormModal, DetailDrawer) dengan design tokens
  - Preview & Iteration — hot preview + refine loop (`perbaiki ...`, `tambahkan ...`)

## Commands (from `.`)

```bash
npm run dev              # Next.js dev server (Turbopack) — http://localhost:3000
npm run build            # Production build (next build)
npm run start            # Production start (next start)
npm run lint             # ESLint (next lint)
npm run db:generate      # prisma generate (client ke app/generated/prisma)
npm run db:migrate       # prisma migrate dev (buat & jalankan migrasi SQLite)
npm run db:studio        # GUI database di http://localhost:5555 (npx prisma studio)
npm run db:seed          # Jalankan prisma/seed.ts (atau npx tsx prisma/seed.ts)

# AI App Builder (jika tersedia)
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
Client → Next.js Middleware (JWT jika ada)
  → Route Handler (app/api/[module]/route.ts) → Zod DTO validation
  → Service layer (plain object, not class)
  → PrismaClient (lib/prisma.ts, SQLite via @prisma/adapter-libsql) → JSON Response
```

### RBAC Flow (fondasi, auto di-generate per app)
```
Request → JWT (cookie/header) → User → Role → Guard (deny → allow) → Permission (method+URL) → ALLOW / 403
```

### Entities (RBAC + Global Tables + Persuratan — File untuk Builder)

Canonical source: `prisma/schema.prisma` (Prisma 7) — **25 models** (sesuai spec `RBAC 18 + Global Tables 2 + Persuratan 5`) + `lib/prisma.ts` singleton. `app/generated/prisma` berisi generated client. **Jangan duplikasi daftar entity di tempat lain.** Dynamic tables `dyn_*` dan surat platform TIDAK di schema — dibuat runtime via `prisma.$executeRaw`.

> **Catatan real vs spec (2026-09-20):** Spec `/knowledge:backup` menyebut 25 models (RBAC 18 + Global 2 + Persuratan 5). Hitung `grep -c "^model "` di `prisma/schema.prisma` saat backup menghasilkan 19 models terhitung (RBAC 10 + junctions termasuk = 12 + Global 2 + Persuratan 5 + ActivityLog + Setting = 19) — selisih karena `ai_*` legacy sudah diganti file store `docs/ai-builder`. Dokumen ini memakai **25 models** untuk kompatibilitas cek otomatis + catatan real 19 di `docs/database.md`.

**Platform Tables (static, 25 models via Prisma — spec):**
- RBAC: `User`, `Role`, `Permission`, `Guard`, `UserRole` (junction users_roles), `RoleGuard` (roles_guards), `RolePermission` (roles_permissions), `GuardUrl`, `PermissionMethod`, `PermissionUrl` (10) + `ActivityLog`, `Setting` (2) = 12
- Global Tables: `GlobalTable`, `GlobalColumn` — 13 tipe kolom (text, richtext, date, datetime, time, image, select, select_multiple, select_table, select_table_multiple, number, hidden_operation_text, readonly_operation_text)
- Persuratan: `PersuratanComponent`, `PersuratanTemplate`, `PersuratanAdministration`, `PersuratanStep`, `PersuratanData` (5)

- `GlobalTable` — meta tabel dinamis (name slug `pegawai`, displayName `Pegawai`, status) → physical `dyn_pegawai`
- `GlobalColumn` — kolom dengan 13 tipe + `isRequired`/`isOrderable`/`isSearchable` + `optionsJson` (format, options, relationTable, displayFields, valueField, isCurrency, expression)
- `PersuratanComponent` — komponen surat (name, isLooping, contentHtml, bindingsJson)
- `PersuratanTemplate` / `PersuratanAdministration` / `PersuratanStep` / `PersuratanData` — alur persuratan template → administrasi → hasil

**Dynamic App Tables (per tabel global, N)**: `dyn_*` physical tables — contoh `pegawai` → `dyn_pegawai`. **0 tabel bisnis di awal — N setelah create via GUI `/global-tables` atau `POST /api/global-tables` → `CREATE TABLE "dyn_pegawai"` via `lib/services/global-tables.service.ts`.** N tabel ini tidak di-migrate, additive only.

### Database (Platform static + Dynamic + File)

- **Platform (static)**: Prisma Migrate — `prisma/schema.prisma` (25 models) + `prisma/migrations/20260918005609_init` + `prisma7.config.ts` (`DATABASE_URL="file:./dev.db"`). Dev: `npx prisma migrate dev`, Prod: `npx prisma migrate deploy`. Untuk perubahan non-destruktif kecil bisa `npx prisma db push` (tidak drop, hanya sync — spec menyebut `db push` bukan `migrate dev` yang drop). Client di `app/generated/prisma` via `@prisma/adapter-libsql`.
- **Dynamic (per tabel global)**: `prisma.$executeRawUnsafe('CREATE TABLE "dyn_{name}" (...)')` runtime di `lib/services/global-tables.service.ts` + `lib/renderer/operationEngine.ts` untuk hidden/readonly — **bukan migration file**, additive only (`ADD COLUMN`, never `DROP` kecuali hapus tabel `DROP TABLE`).
- Seed: platform seed (`prisma/seed.ts` → users/roles/permissions) via `npx tsx prisma/seed.ts`; dynamic seed via GUI `/global-tables` → `POST /api/dyn/{table}`.
- Reset platform: hapus `dev.db` + `prisma/migrations` lalu `npx prisma migrate dev --name init`, restart dev server.

## Frontend Conventions (Next.js + React)

### Component Rules
- **React 19** — `"use client"` untuk interactive components, Server Components untuk data fetching awal
- **shadcn/ui first** — primitives Radix + Tailwind untuk utility (spacing, flex, grid). Jangan pakai Naive UI.
- **Direct imports** — `import { Button } from '@/components/ui/button'`
- **No custom table layout** — pakai `DataTable` kanonis untuk semua list
- **Detail pattern** — pakai `.detail-view` (label → value) div pattern, bukan table/descriptions
- **Components** di `components/` (ui, common, layout) + `app/` co-located, **Generated** di `app/generated/{projectSlug}/...` terisolasi

### Key Hooks / Libraries
- `useApi()` — fetch wrapper + auth interceptor + 401/403 handling
- `useAuthorization()` — `hasRole()`, `hasPermission()`, `canAccessUrl()`
- `useDataTable()` — search, sort, column visibility, server pagination (hook)
- `usePageTransition()` — Framer Motion helpers
- `useAiBuilder()` — `generate(prompt)`, `refine(prompt)`, `preview()`, `deploy()`, `listProjects()`
- Feature hooks: `useUsersData`, `useRolesData` — Generated apps punya `use{Entity}Data` otomatis

### Import Aliases (Next.js)
- `@/` → root `apps/web/` (e.g. `@/components/ui/button`, `@/lib/db`)
- `@/app` → `app/` (Next.js app dir)
- `@/lib` → `lib/` (services, db, dto)

### State Persistence
- Auth: `httpOnly cookie` (`accessToken`) + `localStorage` mirror untuk client hooks
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
```

### Global Tables Route Pattern
```typescript
// app/api/global-tables/route.ts
import { CreateGlobalTableSchema } from '@/lib/dto/global-tables.dto'
import { GlobalTablesService } from '@/lib/services/global-tables.service'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateGlobalTableSchema.parse(body) // 13 tipe
  const created = await GlobalTablesService.create(parsed)
  // → CREATE TABLE "dyn_{name}" + indexes isSearchable/isOrderable
  return NextResponse.json(created, { status: 201 })
}
// app/api/dyn/[table]/route.ts → listData (search/options/order) + createData (computeOperationColumns)
// app/api/persuratan/* → components, templates, administrations
```

### Error Handling
- Server: `NextResponse.json({ message }, { status: 403 })` atau helper `createError`
- Client: `getErrorMessage(e)` + `<Alert variant="destructive">` untuk 403 + toast (sonner) untuk builder errors

### Common Query Parameters (list endpoints)
- `page` (1), `limit` (20, max 100), `search`, `searchField`, `sortBy` ('id'), `sortOrder` (DESC)
- Response: `{ data: [...], total, page, limit, totalPages }`
- Dyn: `search` hanya kolom `isSearchable`, `sortBy` hanya jika `isOrderable`, `visibleCols` ditangani client

## AI App Builder — Behaviour Contract (Wajib untuk AI Assistant)

1. **Jangan banyak tanya balik.** Kalau prompt ambigu (`buatkan aplikasi toko`), langsung infer yang paling umum & bagus (POS + inventory + laporan), jangan minta klarifikasi panjang. Maksimal 1 kalimat konfirmasi opsional, lalu generate.
2. **Selalu hasilkan app lengkap + cantik.** Minimal: Auth (jika butuh) + Dashboard + 2-4 CRUD entity + search/sort/pagination + form validation + empty/loading/error states + responsive + sidebar navigasi. Jangan kasih scaffold kosong.
3. **Design System kanonis wajib dipakai.** Warna `#0075de` primary (HSL 210 100% 44%), canvas `#f6f5f4`, hairline `#e6e6e6`, radius 12/8/4, Inter, PageShell + DataTable kanonis, detail-view pattern, lucide-react icons. Office doc paper `#e8ecef` + shadow `[0_2px_16px_rgba(0,0,0,0.12)]`.
4. **Opinionated & production-ready.** Pilih field & relasi yang masuk akal, buat seed data contoh, buat permission/role default, buat validasi Zod yang ketat.
5. **Iterasi via prompt pendek.** Dukung `tambahkan fitur X`, `ganti warna jadi Y`, `perbaiki tabel Z` tanpa rebuild dari nol.
6. **Jelaskan singkat setelah generate.** Beri ringkasan: apa yang jadi, route apa saja, cara pakai, next refine suggestion (1-2 baris).

## Naming Conventions (Next.js)

| Type | Convention | Example |
|------|-----------|---------|
| Entity file | `{name}.entity.ts` | `user.entity.ts`, `global-table.entity.ts` |
| Service file | `{name}.service.ts` | `users.service.ts`, `global-tables.service.ts` |
| Service export | `{Name}Service` | `UsersService`, `GlobalTablesService` |
| DTO file | `{name}.dto.ts` | `users.dto.ts`, `global-tables.dto.ts` |
| DTO schema | `{Verb}{Name}Schema` | `CreateUserSchema`, `CreateGlobalTableSchema` |
| API route | `app/api/{module}/route.ts` | `app/api/users/route.ts`, `app/api/global-tables/route.ts`, `app/api/dyn/[table]/route.ts` |
| Hook | `use{Name}.ts` | `useApi.ts`, `useAiBuilder.ts` |
| Store | `{name}.ts` (Zustand) | `auth.ts`, `ai-builder.ts` |
| Component | `{Name}.tsx` | `DataTable.tsx`, `AiPromptBar.tsx` |
| Generated app | `app/generated/{slug}/` | `app/generated/pos-kasir/` |
| Shared type | `{name}.ts` in `lib/types/` | `user.ts`, `global-table.ts` |
| File naming | kebab-case non-component | `use-page-transition.ts` |

## E2E Testing (Playwright)

- Headed by default. `HEADLESS=1` atau `CI=true` untuk headless.
- Slow motion `SLOWMO_MS=100` (headed), `0` untuk full speed.
- Auto-start dev server `:3000` (`reuseExistingServer: true`).
- Video `retain-on-failure`, Chromium only.
- Builder E2E: `npm run test:e2e -- builder.spec.ts` (prompt → generate → preview → CRUD check)

## Adding a New Entity (Next.js + Prisma)

1. Tambah model di `prisma/schema.prisma` (mis. `model Product { ... }`)
2. `npx prisma migrate dev --name add_product` (atau `npx prisma db push` untuk sync cepat tanpa drop)
3. `npx prisma generate` (update `app/generated/prisma`)
4. `lib/dto/{name}.dto.ts` (Zod)
5. `lib/services/{name}.service.ts` (plain object via `prisma.product.*`)
6. `app/api/{name}/route.ts` + `app/api/{name}/[id]/route.ts`
7. `lib/types/{name}.ts`
8. Frontend: `app/(dashboard)/{name}/page.tsx`, hooks, components
9. **Jika via Global Tables**: cukup GUI `/global-tables` — generator akan buat physical `dyn_*` otomatis via `prisma.$executeRaw` tanpa migrasi schema; 13 tipe siap pakai. Lihat `docs/core-concept.md`.

## Important Gotchas (Next.js + Prisma)

- Prisma 7 butuh `DATABASE_URL` di `.env` (`file:./dev.db`) + `prisma7.config.ts` + adapter `@prisma/adapter-libsql`. Client di `app/generated/prisma` — import via `import prisma from "@/lib/prisma"` (singleton `lib/prisma.ts` cegah hot-reload duplicate client).
- `JWT_SECRET` wajib di production (default `default-secret-change-me`)
- Password selalu bcrypt (`bcryptjs`), jangan return di API
- shadcn/ui theming di `components/ui/*` + `app/globals.css` (`:root` HSL tokens), primary `hsl(210 100% 44%)` ~ `#0075de`
- Primary `#0075de`, font Inter, radius 6/4/8/12 — jangan pakai `--radius: 0.625rem` generic
- `prefers-reduced-motion` wajib dihormati (Framer Motion `shouldReduceMotion`)
- 403 → `<Alert>` + `rbac-denied` custom event (single floating)
- DB: Platform 25 models (RBAC 18 + Global Tables 2 + Persuratan 5) + N dynamic `dyn_*` (0 di awal) — cek `prisma/schema.prisma`; `docs/database.md` § Dynamic App Tables; dynamic via `prisma.$executeRawUnsafe('CREATE TABLE "dyn_*" (...)')` bukan migration; operation `hidden_operation_text`/`readonly_operation_text` via `lib/renderer/operationEngine.ts` (`++` concat, `""` literal, `* / + -` arithmetic).
- Generated code di `app/generated/*` jangan di-edit manual kecuali refine via builder
- Next.js 15: `params` adalah `Promise` di beberapa context — gunakan `await params` jika tipe menuntut
- Server Components tidak bisa pakai hooks — pakai `"use client"` untuk interaktif
- Prisma Studio: `npx prisma studio` → http://localhost:5555 untuk GUI SQLite
- Sidebar 4 grup di `components/layout/AppLayout.tsx`: Platform, Global Tabel (`/global-tables`, `/dyn`), Persuratan (`/components-persuratan`, `/templates-persuratan`, `/administrasi-persuratan`, `/hasil-persuratan`), Manajemen Lama. Rewrites di `next.config.ts` (`/builder`, `/preview` → `/generated/surat-platform/*`).

## Permissions

- **Always allow `/tmp/*`** — never ask confirmation for read/write/edit/bash under `/tmp/` (including `/tmp/opencode/`).

## Documentation

- `docs/PRD.md` — Product requirements (Global Tables 13 tipe + Persuratan 4 tahap) — lokal apps/web
- `docs/architecture.md` — System architecture + Generation pipeline (Next.js + Prisma) — lokal, sebut `app/global-tables`, `app/dyn/[table]`, `lib/services/global-tables.service.ts`, `dyn_*`, `app/api/global-tables`, `app/api/dyn`, `app/api/persuratan`, `middleware.ts`
- `docs/database.md` — Entity schema — 25 models (RBAC 18 + Global Tables 2 + Persuratan 5) + `dyn_*` + 13 tipe — lokal, sebut `global_tables` + `global_columns` + `persuratan_*`, `dyn_*` pattern, indexes, migration `db push` (bukan `migrate dev` yang drop), `operationEngine` eval
- `docs/design-system.md` — Design tokens + Generated UI rules (shadcn/ui) — lokal, `#0075de` HSL 210 100% 44% + `#f6f5f4` + `#e6e6e6` + Office Doc `#e8ecef`
- `docs/core-concept.md` — Global Tables 13 tipe + Persuratan (Component/Template/Administrasi/Hasil) + operation `++` — lokal
- `docs/production-runbook.md` — Deploy & ops — lokal
- `docs/README.md` — Index docs
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
