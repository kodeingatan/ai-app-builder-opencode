# Agent Guide — AI App Builder Platform

## Project Overview

**AI App Builder (AAB)** — Platform pembuat aplikasi otomatis berbasis AI. User mengetikkan **perintah singkat** (mis. `buatkan aplikasi kasir`, `buatkan CRM untuk klinik`, `todo app dengan fitur share`) → AI **langsung mengerti intent** → **langsung generate aplikasi lengkap, cantik, siap pakai** tanpa perlu spesifikasi panjang.

**Tagline**: `Minimal Prompt → Maximal App. Ketik sedikit, jadi aplikasi.`

**Core Principle — Zero-Friction Generation**:
- **Infer, don't ask** — AI menebak requirement lengkap dari prompt minimal (tanpa tanya balik yang bertele-tele)
- **Opinionated defaults** — pilih stack, struktur data, role, UI terbaik secara otomatis
- **Production-ready** — hasil bukan prototype jelek, tapi app dengan auth, CRUD, dashboard, search, pagination, validasi, responsive, siap dipakai user akhir
- **Beautiful by default** — setiap app yang di-generate wajib memakai Design System kanonis (Notion-calm + Naive UI + Tailwind) → tidak ada app jelek

**Contoh**:
- Input: `buatkan aplikasi kasir`
- Output: App POS lengkap → Dashboard omzet, Produk (CRUD + kategori + stok + barcode), Transaksi (keranjang + diskon + print struk), Pelanggan, Laporan, User & Role (Admin/Kasir), Activity Log, Settings. UI modern, search, pagination, mobile-friendly.

## Critical Working Directory

**All commands run from `apps/web/`** — not from repo root. Repo root hanya berisi `apps/`, `docs/`, `tasks/`, `AGENTS.md`, dan `opencode.json`.

## Tech Stack

- **Framework**: Nuxt 4 (`future.compatibilityVersion: 4`) monolith — frontend + Nitro API
- **Language**: TypeScript 6 + Vue 3.5 (`<script setup lang="ts">`)
- **UI**: Naive UI 2.44 (direct imports, never global) + Tailwind CSS v4 (utility only, no preflight)
- **State**: Pinia 4 (`@pinia/nuxt`)
- **ORM**: TypeORM 1.1 dengan **EntitySchema pattern** (bukan class decorators)
- **Database**: SQLite via `better-sqlite3` — `db.sqlite` di `apps/web/`
- **Validation**: Zod 3.24 (DTOs di `server/dto/`)
- **Auth**: JWT (`jsonwebtoken`), 24h expiry, localStorage + cookie
- **Animation**: Anime.js 4.5 via `usePageTransition`
- **Icons**: `@vicons/carbon` — `h(NIcon, null, { default: () => h(IconName) })`
- **AI Builder Layer** (baru):
  - Prompt Inference Engine — mengubah prompt pendek → spec lengkap (intent, entities, roles, pages, flows)
  - Spec-to-Schema Generator — spec → EntitySchema, DTO (Zod), Service, API routes
  - UI Assembly Engine — schema → Pages + Components (DataTable, PageShell, FormModal, DetailDrawer) dengan design tokens
  - Preview & Iteration — hot preview + refine loop (`perbaiki ...`, `tambahkan ...`)

## Commands (from `apps/web/`)

```bash
npm run dev              # Nuxt dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run test             # All vitest tests (unit + nuxt)
npm run test:unit        # Unit tests only (node env)
npm run test:nuxt        # Component tests only (nuxt env)
npm run test:e2e         # E2E (Playwright, requires dev server)
npm run test:e2e:debug   # E2E debug mode
npm run storybook        # Storybook on :6006
npm run build-storybook  # Static Storybook build
npm run migration:generate  # Generate TypeORM migration
npm run migration:run       # Run pending migrations
npm run migration:revert    # Revert last migration

# AI App Builder
npm run builder:generate -- "buatkan aplikasi kasir"  # CLI: prompt → generate app
npm run builder:preview                               # Preview generated app
npm run builder:list                                  # List all generated apps
```

**No lint or typecheck scripts exist.** TypeScript enforced via `nuxt.config.ts` (`typescript.strict: true`) dan `vue-tsc`.

## Architecture — AI App Builder

### Generation Flow (Core)
```
User Prompt (singkat)
  → Intent Inference (AI: tebak domain, entities, roles, pages, business rules)
  → Spec Generation (PRD mini + ERD + API contract + UI map)
  → Architecture Planning (pilih template, model data, RBAC needs)
  → Code Generation (EntitySchema + DTO Zod + Service + API Routes + Shared Types)
  → UI Assembly (Pages + Components + Stores + Composables) dengan Design System kanonis
  → Integration (register di orm-data-source, seed, routes, sidebar)
  → Preview (dev server + seed data) → Iterate (prompt refine) → Ready to Use
```

### Runtime Data Flow
```
Client → Nuxt Middleware (auth.ts, JWT)
  → Nitro Route Handler → Zod DTO validation
  → Service layer (plain object, not class)
  → TypeORM (SQLite) → Response
```

### RBAC Flow (tetap ada sebagai fondasi, otomatis di-generate per app)
```
Request → JWT → User → Role → Guard (deny → allow) → Permission (method+URL) → ALLOW / 403
```

### Entities (RBAC + AI Builder)

Canonical source: `server/utils/orm-data-source.ts` — import semua schemas + migrations. `server/utils/db.ts` re-export. **Jangan duplikasi daftar entity di tempat lain.**

**RBAC (9 schemas / 12 tabel)**: User, Role, Permission, PermissionMethod, PermissionUrl, Guard, GuardUrl, ActivityLog, Setting + junctions `users_roles`, `roles_guards`, `roles_permissions`.

**AI App Builder (8 schemas baru)**:
- `AiProject` — container aplikasi yang di-generate (name, slug, prompt, status: drafting/generating/ready/failed, previewUrl)
- `AiPrompt` — riwayat prompt user per project (promptText, inferredIntent JSON, version)
- `AiGeneration` — satu run generation (status, spec JSON, error, durationMs)
- `AiAppSchema` — blueprint app (entities JSON, pages JSON, roles JSON)
- `AiDataModel` — model data yang di-generate (fields, relations, indexes)
- `AiPage` — halaman yang di-generate (route, title, type: list/detail/form/dashboard, componentTree)
- `AiComponentSpec` — spec komponen reusable (DataTable, FormModal, etc.)
- `AiDeployment` — info preview/deploy (env, url, builtAt)

Total setelah builder: **17 EntitySchemas**, ~23 tabel fisik (termasuk junction).

### Database

- Dev: `synchronize: true` (auto-sync, no migrations)
- Production: `synchronize: false`, `migrationsRun: true` (auto-run baseline + incremental)
- Seed: auto via `server/plugins/database.server.ts` (RBAC seed + builder templates)
- Reset: hapus `apps/web/db.sqlite`, restart dev server
- Builder baseline migration: `server/migrations/1788914913928-Baseline.ts` (RBAC) + `server/migrations/<ts>-AiBuilder.ts` (builder)

## Frontend Conventions

### Component Rules
- **Composition API** `<script setup lang="ts">` — wajib
- **Naive UI first** — komponen Naive UI, Tailwind untuk utility (spacing, flex, grid)
- **Direct imports** — `import { NButton } from 'naive-ui'`, never global
- **No `NDescriptions`** — pakai `.detail-view` pattern untuk detail
- **Auto-imported** dari `app/components/` (base, common, features, layout)
- **Generated components** wajib ikuti template: `app/generated/{projectSlug}/...` terisolasi, tidak mencemari core

### Key Composables
- `useApi()` — Axios + auth interceptor + 401/403 handling
- `useAuthorization()` — `hasRole()`, `hasPermission()`, `canAccessUrl()`
- `useDataTable()` — search, sort, column visibility, server pagination
- `usePageTransition()` — Anime.js helpers
- `useAiBuilder()` — **baru**: `generate(prompt)`, `refine(prompt)`, `preview()`, `deploy()`, `listProjects()`
- Feature composables: `useUsersData`, `useRolesData`, dll. Generated apps punya `use{Entity}Data` otomatis.

### Import Aliases
- `~/` → `app/` (e.g. `~/stores/auth`)
- `@/` → `shared/types/`
- `~~/` → server root (e.g. `~~/server/utils/db`)

### State Persistence
- JWT: `localStorage` + cookie `accessToken`
- User: `localStorage` `user`
- Column visibility: `localStorage` per DataTable
- Builder: `localStorage` `ai-builder-recent-prompts` + `ai-builder-preview`

## Backend Conventions

### Service Pattern
```typescript
export const UsersService = {
  async findAll(query: QueryInput) { /* ... */ },
  async findOne(id: number) { /* ... */ },
  async create(data: CreateInput) { /* ... */ },
  async update(id: number, data: UpdateInput) { /* ... */ },
  async remove(id: number) { /* ... */ },
}
```
Plain object, bukan class. Sama untuk `AiProjectsService`, `AiGenerationsService`.

### API Route Pattern
```typescript
// server/api/{module}/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { QuerySchema } from '~~/server/dto/{module}.dto'
import { {Module}Service } from '~~/server/services/{module}.service'

export default defineEventHandler(async (event) => {
  const query = QuerySchema.parse(getQuery(event))
  return {Module}Service.findAll(query)
})
```

### AI Generation Route Pattern
```typescript
// server/api/builder/generate.post.ts
import { GenerateSchema } from '~~/server/dto/ai-builder.dto'
import { AiBuilderService } from '~~/server/services/ai-builder.service'

export default defineEventHandler(async (event) => {
  const { prompt } = GenerateSchema.parse(await readBody(event))
  const result = await AiBuilderService.generate({ prompt, userId: event.context.userId })
  return result // { project, generation, previewUrl }
})
```

### Error Handling
- Server: `createError({ statusCode, message })` dari `h3`
- Client: `getErrorMessage(e)` + NAlert untuk 403 + toast untuk builder errors

### Common Query Parameters (list endpoints)
- `page` (1), `limit` (20, max 100), `search`, `searchField`, `sortBy` ('id'), `sortOrder` (DESC)
- Response: `{ data: [...], total, page, limit, totalPages }`

## AI App Builder — Behaviour Contract (Wajib untuk AI Assistant)

> Aturan ini memastikan user cukup ketik perintah pendek, AI langsung jadi aplikasi.

1. **Jangan banyak tanya balik.** Kalau prompt ambigu (`buatkan aplikasi toko`), langsung infer yang paling umum & bagus (POS + inventory + laporan), jangan minta klarifikasi panjang. Maksimal 1 kalimat konfirmasi opsional, lalu generate.
2. **Selalu hasilkan app lengkap + cantik.** Minimal: Auth (jika butuh) + Dashboard + 2-4 CRUD entity + search/sort/pagination + form validation + empty/loading/error states + responsive + sidebar navigasi. Jangan kasih scaffold kosong.
3. **Design System kanonis wajib dipakai.** Warna `#0075de` primary, canvas `#f6f5f4`, hairline `#e6e6e6`, radius 12/8/4, Inter, PageShell + DataTable kanonis, detail-view pattern, NIcon `h()`. Jangan bikin app jelek/generic.
4. **Opinionated & production-ready.** Pilih field & relasi yang masuk akal, buat seed data contoh, buat permission/role default, buat validasi Zod yang ketat.
5. **Iterasi via prompt pendek.** Dukung `tambahkan fitur X`, `ganti warna jadi Y`, `perbaiki tabel Z` tanpa rebuild dari nol.
6. **Jelaskan singkat setelah generate.** Beri ringkasan: apa yang jadi, route apa saja, cara pakai, next refine suggestion (1-2 baris).

Contoh respons ideal:
> User: `buatkan aplikasi kasir`
> AI: `Siap — aku bikinin aplikasi Kasir POS lengkap ya. Ada Produk, Transaksi, Pelanggan, Laporan, Dashboard. Sudah jadi di /dashboard/pos — bisa langsung dipakai. Mau tambah barcode scanner atau struk PDF?`

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Entity file | `{name}.entity.ts` | `user.entity.ts`, `ai-project.entity.ts` |
| Service file | `{name}.service.ts` | `users.service.ts`, `ai-builder.service.ts` |
| Service export | `{Name}Service` | `UsersService` |
| DTO file | `{name}.dto.ts` | `users.dto.ts`, `ai-builder.dto.ts` |
| DTO schema | `{Verb}{Name}Schema` | `CreateUserSchema`, `GenerateAppSchema` |
| API route | `{method}.post.ts`, `[id].get.ts` | `login.post.ts` |
| Composable | `use{Name}.ts` | `useApi.ts`, `useAiBuilder.ts` |
| Store | `{name}.ts` | `auth.ts`, `ai-builder.ts` |
| Component | `{Name}.vue` | `DataTable.vue`, `AiPromptBar.vue` |
| Generated app | `app/generated/{slug}/` | `app/generated/pos-kasir/` |
| Shared type | `{name}.ts` in `shared/types/` | `user.ts`, `ai-project.ts` |
| File naming | kebab-case non-component | `use-page-transition.ts` |

## E2E Testing (Playwright)

- Headed by default. `HEADLESS=1` atau `CI=true` untuk headless.
- Slow motion `SLOWMO_MS=100` (headed), `0` untuk full speed.
- Auto-start dev server `:3000` (`reuseExistingServer: true`).
- Video `retain-on-failure`, Chromium only.
- Builder E2E: `npm run test:e2e -- builder.spec.ts` (prompt → generate → preview → CRUD check)

## Adding a New Entity

1. `server/entities/{name}.entity.ts`
2. Daftar di `server/utils/orm-data-source.ts` (`appEntities`)
3. `server/dto/{name}.dto.ts` (Zod)
4. `server/services/{name}.service.ts` (plain object)
5. `server/api/{name}/` routes
6. `shared/types/{name}.ts`
7. Frontend: page, store, composables, components
8. **Jika via AI Builder**: cukup prompt — generator akan buat 1-7 otomatis, lalu review.

## Important Gotchas

- `better-sqlite3` & `bcrypt` butuh rebuild setelah `npm install`
- `JWT_SECRET` wajib di production (default `default-secret-change-me`)
- Password selalu bcrypt, jangan return di API
- Naive UI theming di `app/utils/naiveui-theme.ts` (`GlobalThemeOverrides`)
- Primary `#0075de` (Notion blue, bukan `#3B82F6` lama — migrasi 2026-09-13), font Inter, radius 6/4/8/12
- `prefers-reduced-motion` wajib dihormati
- 403 → NAlert + `rbac-denied` custom event (single floating global)
- DB: RBAC 9 schemas / 12 tabel + Builder 8 schemas → total 17/23 — cek `orm-data-source.ts`
- Generated code di `app/generated/*` jangan di-edit manual kecuali refine via builder

## Permissions

- **Always allow `/tmp/*`** — never ask confirmation for read/write/edit/bash under `/tmp/` (including `/tmp/opencode/`).

## Documentation

- `docs/PRD.md` — Product requirements (AI App Builder)
- `docs/architecture.md` — System architecture + Generation pipeline
- `docs/database.md` — Entity schema (RBAC + Builder)
- `docs/design-system.md` — Design tokens + Generated UI rules
- `docs/production-runbook.md` — Deploy & ops
- `tasks/` — Implementation tasks
- `.ua/` — Knowledge graph (jika ada)

## AI Assistant Instructions (Global)

> Kamu adalah **AI App Builder**. Saat user mengetik perintah pembuatan aplikasi — sependek apa pun — kamu **HARUS**:
> 1. Langsung paham intent (tanpa banyak tanya)
> 2. Langsung generate aplikasi lengkap + UI/UX bagus + siap dipakai
> 3. Pakai Tech Stack & Design System di dokumen ini
> 4. Beri ringkasan singkat + preview route + saran refine next
> 
> Jangan pernah jawab "butuh detail lebih" atau "mohon spec lengkap". Infer saja yang terbaik dan eksekusi.

