# Product Requirements Document (PRD) — AI App Builder Platform

## 1. Product Overview

**Nama Project**: AI App Builder (AAB) — Platform pembuat aplikasi otomatis berbasis AI

**Tagline**: `Minimal Prompt → Maximal App. Ketik sedikit, jadi aplikasi.`

**Tujuan**: User mengetikkan **perintah singkat** (mis. `buatkan aplikasi kasir`, `buatkan CRM klinik`, `todo app dengan share`) → AI **langsung paham intent** → **langsung generate aplikasi lengkap, cantik, siap pakai** tanpa perlu spesifikasi panjang, tanpa prototype jelek.

**Core Principle — Zero-Friction Generation**:
- **Infer, don't ask** — AI menebak requirement lengkap dari prompt minimal (tanpa tanya balik bertele-tele)
- **Opinionated defaults** — pilih stack, struktur data, role, UI terbaik secara otomatis
- **Production-ready** — hasil bukan prototype, tapi app dengan auth, CRUD, dashboard, search, pagination, validasi, responsive, siap dipakai user akhir
- **Beautiful by default** — setiap app yang di-generate wajib memakai Design System kanonis (Notion-calm + shadcn/ui + Tailwind) → tidak ada app jelek

**Contoh**:
- Input: `buatkan aplikasi kasir`
- Output: App POS lengkap → Dashboard omzet, Produk (CRUD + kategori + stok + barcode), Transaksi (keranjang + diskon + print struk), Pelanggan, Laporan, User & Role (Admin/Kasir), Activity Log, Settings. UI modern, search, pagination, mobile-friendly. Route `/generated/pos-kasir`.

**Current Implementation State**: Platform dibangun di atas **RBAC Foundation** (9 EntitySchemas / 12 tabel: User/Role/Permission/Guard/ActivityLog/Setting) yang menjadi fondasi auth & permission untuk semua generated app. Di atasnya, **AI Builder Layer** menambahkan 8 EntitySchemas baru (AiProject, AiPrompt, AiGeneration, AiAppSchema, AiDataModel, AiPage, AiComponentSpec, AiDeployment) → total **17 EntitySchemas / ~23 tabel**. Generation flow: Prompt → Intent Inference → Spec → Architecture → CodeGen → UI Assembly → Preview → Iterate.

**Tech Stack**:
- Frontend: Next.js 15 (App Router) + React 19 + TypeScript + shadcn/ui + Tailwind CSS v4 + lucide-react + Framer Motion
- Backend: Next.js Route Handlers (`app/api/**/route.ts`) + TypeORM 1.1 EntitySchema + SQLite (`better-sqlite3`) + Zod + JWT
- Auth: JWT (JSON Web Token) 24 jam, `httpOnly` cookie + `middleware.ts` guard
- AI Builder: Prompt Inference Engine + Spec-to-Schema Generator + UI Assembly Engine + Preview & Iteration

---

## 2. Product Vision

Menjadi platform **pembuat aplikasi tercepat dan tercantik** — di mana ide sekecil apa pun langsung menjadi aplikasi production-ready yang bisa dipakai orang, bukan sekadar mockup. Setiap prompt pendek menghasilkan aplikasi yang **opinionated, lengkap, dan indah** — seperti dibuat tim produk Senior + Designer Senior dalam hitungan menit.

---

## 3. Problem Statement

Membuat aplikasi bisnis (kasir, CRM, inventory, klinik, sekolah, todo) secara tradisional membutuhkan:
- Menulis spec panjang, diskusi berulang, revisi desain
- Setup database, API, frontend, auth, RBAC, validasi, pagination, search — berulang-ulang
- Hasil awal sering jelek / tidak siap pakai → butuh polish panjang

Kesenjangan: user punya ide jelas di kepala (`butuh aplikasi kasir`), tapi tool memaksa mereka menulis 5 halaman PRD + memilih warna + mendesain tabel manual.

AI App Builder memecahkan ini dengan **inference**: cukup 1 baris prompt, AI yang mengerjakan sisanya — spec, ERD, API, UI, seed data, RBAC — dengan kualitas production.

---

## 4. Goals

1. **Prompt → App dalam menit**: dari 1 baris prompt ke aplikasi siap preview tanpa tanya balik
2. **Infer lengkap**: domain, entities, relasi, roles, pages, flows, business rules di-infer otomatis
3. **Cantik by default**: setiap generated app mengikuti Design System kanonis (warna, tipografi, spacing, PageShell, DataTable)
4. **Production-ready**: auth + CRUD + dashboard + search/sort/pagination + validasi + responsive + empty/loading/error states
5. **Iterasi friction-less**: `tambahkan fitur X`, `ganti warna jadi Y`, `perbaiki tabel Z` tanpa rebuild dari nol
6. **Preview & Deploy instan**: hot preview di dev server + seed data langsung terlihat
7. **RBAC otomatis**: setiap generated app mendapat role & permission default yang masuk akal

---

## 5. Non-Goals

- Bukan builder drag-and-drop visual manual (user tidak menyusun layout block per block)
- Bukan code export ke repo eksternal di v1 (generated code hidup di `app/generated/{slug}/`)
- Bukan AI chat bebas tanpa struktur — selalu berujung pada aplikasi nyata yang bisa dipakai
- Bukan pengganti database migration visual penuh di v1
- Bukan workflow engine kompleks multi-approval (cukup CRUD + role sederhana per app)

---

## 6. Target Users

- **Solo Founder / UMKM** — butuh aplikasi toko/kasir/klinik tanpa tim IT
- **Product Manager / Maker** — ingin validasi ide cepat dengan app real, bukan mockup
- **Admin Operasional** — butuh app internal (inventory, CRM, booking) yang langsung pakai
- **Developer** — ingin scaffolding production-ready sebagai starting point, bukan boilerplate kosong

---

## 7. User Roles

### Platform Roles (RBAC Foundation — tetap ada)

- **Super Admin** — akses penuh platform + semua generated apps + manage builder
- **Admin** — kelola users/roles/permissions + generate apps
- **Builder User** — generate & iterate app miliknya, access preview
- **Viewer** — read-only preview generated apps

### Generated App Roles (di-infer per app — opinionated)

Contoh untuk `aplikasi kasir`:
- **Admin** — kelola produk, lihat laporan, kelola user
- **Kasir** — buat transaksi, kelola pelanggan
- Viewer diarahkan sesuai domain (mis. `Dokter`/`Perawat` untuk klinik, `Guru`/`Siswa` untuk sekolah)

AI memilih 2-3 role paling masuk akal untuk tiap domain tanpa minta konfirmasi.

---

## 8. Core Concepts

- **AiProject** — container sebuah aplikasi yang di-generate (1 prompt → 1 project). Punya `name`, `slug`, `prompt`, `status` (drafting/generating/ready/failed), `previewUrl`. Satu project punya banyak prompts & generations.
- **AiPrompt** — riwayat prompt user per project (`promptText`, `inferredIntent` JSON, `version`). Prompt pertama = creation, prompt selanjutnya = refine.
- **AiGeneration** — satu run generation (`status`: queued/running/success/failed, `spec` JSON, `error`, `durationMs`). Satu prompt → satu generation.
- **AiAppSchema** — blueprint aplikasi hasil inference (`entities` JSON, `pages` JSON, `roles` JSON, `flows` JSON). Versi blue print per generation.
- **AiDataModel** — model data yang di-generate (field definitions, relations, indexes) → jadi EntitySchema + DTO Zod + Service
- **AiPage** — halaman yang di-generate (`route`, `title`, `type`: list/detail/form/dashboard, `componentTree` JSON)
- **AiComponentSpec** — spec komponen reusable (DataTable, FormModal, DetailDrawer, StatCard, FilterBar) dengan props & design tokens
- **AiDeployment** — info preview/deploy (`env`: preview/production, `url`, `builtAt`)
- **Inference** — proses AI menebak: domain, 3-5 entities utama, fields & relations, 5-7 pages, 2-3 roles, business rules
- **Opinionated Defaults** — keputusan AI tanpa tanya: warna, field types, validasi, permission matrix, seed data

---

## 9. Major User Workflows

### 9.1 Minimal Prompt → Instant App (Happy Path — Wajib Frictionless)

1. User login → buka halaman Builder (`/builder` atau `/dashboard/builder`)
2. Ketik prompt pendek di **AiPromptBar**: `buatkan aplikasi kasir` → tekan Enter / Generate
3. Sistem menampilkan **Inference Preview** 1-2 detik: "Siap — aku bikinin Kasir POS lengkap ya. Ada Produk, Transaksi, Pelanggan, Laporan, Dashboard. Generate sekarang?"
4. Sistem jalankan generation (progress: Inferring → Planning → Generating Code → Assembling UI → Seeding)
5. Selesai → **Preview** langsung muncul (iframe atau redirect ke `/generated/pos-kasir` atau `/dashboard/generated/pos-kasir`)
6. App siap dipakai: CRUD, search, sort, pagination, validasi — dengan seed data contoh
7. User bisa langsung iterate: ketik `tambahkan barcode scanner` atau `tambahkan laporan harian PDF` → sistem patch app tanpa rebuild nol

### 9.2 Iterate via Short Prompt

1. Di halaman project, user ketik refine prompt: `tambahkan fitur diskon member 10%`
2. Sistem infer delta, generate patch (entity/field/page baru), merge ke project
3. Preview auto-refresh, data lama tetap aman
4. Riwayat prompt & generation tercatat (versioning)

### 9.3 Browse & Manage Projects

1. User buka `/builder` → lihat list AiProjects (status, preview, last prompt)
2. Klik project → lihat spec (entities, pages, roles), generations, deployments
3. Aksi: Preview, Deploy, Delete, Duplicate, Refine

### 9.4 RBAC Administration (Tetap Ada sebagai Fondasi)

1. Admin mengelola user, role, permission, guard via DataTable
2. Generated apps mewarisi RBAC — permission otomatis dibuat per entity (`{App}:{Entity}:Read/Write`)
3. Activity Logs mencatat semua mutasi (generation, CRUD generated app)

---

## 10. Functional Requirements

### 10.1 AI Builder Core

- Prompt input single-line + generate (Enter → langsung jalan, jangan minta form panjang)
- Inference engine: domain detection, entity extraction (3-5 entities), role inference (2-3 roles), page mapping (4-7 pages), business rules
- Spec generation: mini-PRD + ERD + API contract + UI map sebagai `AiAppSchema` JSON
- Code generation: EntitySchema + DTO Zod + Service (plain object) + Route Handlers (`app/api/generated/[slug]/[entity]/route.ts`) + Types (`lib/types/`)
- UI Assembly: Pages (`app/generated/[slug]/**`) + Components (DataTable, PageShell, FormModal, DetailDrawer, StatCard) + Hooks + Zustand stores — wajib pakai design tokens shadcn/ui
- Integration: register di `lib/db/data-source.ts`, generate migrations/seeds, sidebar nav, routes `app/generated/[slug]/`
- Preview: Next.js dev server hot-reload + seed data otomatis, URL preview per project
- Iteration: delta inference, patch generation, merge tanpa hapus data user

### 10.2 Generated App Quality Bar (Wajib — Bukan Prototype Jelek)

Setiap generated app **minimal** harus punya:
- [ ] Auth (jika butuh multi-role) atau guest mode yang masuk akal
- [ ] Dashboard dengan stats + recent items + chart sederhana (jika relevan)
- [ ] 2-4 CRUD entity dengan field realistis (bukan `name` + `description` generik)
- [ ] Search (global 320px + field-specific 160px), sort, column visibility, pagination (10/20/50/100)
- [ ] Form validation (Zod ketat), empty/loading/error states
- [ ] Detail view dengan `.detail-view` pattern (bukan NDescriptions)
- [ ] Responsive (mobile-tablet-desktop) + sidebar navigasi
- [ ] Seed data 5-10 rows per entity yang masuk akal (nama produk nyata, harga realistis)
- [ ] Role & permission default + guard

### 10.3 Library & Management

- List projects dengan status, slug, last prompt, preview URL
- Detail project: spec JSON viewer, generation timeline, error logs
- Actions: preview, delete, duplicate, export spec

### 10.4 RBAC Modules (Fondasi — Tetap Ada)

Dashboard, User/Role/Permission/Guard CRUD, Activity Logs, System Logs, Settings — seperti sebelumnya. Generated apps memperluas ini.

---

## 11. Business Rules

1. **Infer, don't ask** — prompt ambigu (`buatkan aplikasi toko`) → pilih inferensi paling umum & laku (POS + inventory + laporan), jangan tanya balik panjang. Maks 1 kalimat konfirmasi opsional lalu generate.
2. **Opinionated defaults** — jika user tidak sebut warna/field/role, pilih yang terbaik untuk domain tersebut.
3. **Beautiful by default** — semua generated UI wajib pakai token `#0075de` primary, canvas `#f6f5f4`, hairline `#e6e6e6`, radius 12/8/4, Inter, PageShell + DataTable kanonis. Jangan generate UI jelek/generic.
4. **Production-ready validation** — field wajib punya Zod schema ketat (string min/max, email, unique, required, enum, relation checks).
5. **RBAC auto-generate** — setiap entity baru dapat permission `GET/POST/PUT/DELETE /api/{slug}/{entity}/*` dan role default.
6. **Iterasi non-destruktif** — refine tidak menghapus data existing atau project lain; perubahan schema via additive migration/patch.
7. **Seed idempotent** — generated app seed hanya seed bila tabel kosong.
8. **Slug unik & URL-safe** — `pos-kasir`, `crm-klinik`, `todo-share` — lowercase, hyphen, unique.

---

## 12. Constraints

- Database: SQLite (better-sqlite3) — cocok untuk skala kecil-menengah, single file. `synchronize: true` dev, `synchronize: false` + `migrationsRun: true` production. TypeORM via Next.js Route Handlers.
- Monolith: Next.js 15 (App Router) — frontend (React Server Components + Client Islands) + API Routes satu package, tanpa microservice
- Auth JWT 24 jam, bcrypt, `httpOnly` cookie, `middleware.ts` guard
- TypeScript strict (`strict: true`), Zod validation single source of truth (DTOs di `lib/dto/`)
- AI inference di v1 bisa berupa rule-based + LLM call (stub dulu, interface `AiInferenceProvider`). Jangan hard-code ke vendor spesifik di schema.

---

## 13. Important Edge Cases

- Prompt kosong / 1 kata (`kasir`) → tetap infer sebagai `aplikasi kasir` lengkap
- Prompt super panjang → truncate + summarise, tetap generate 1 app (bukan multi-app)
- Slug tabrakan → auto suffix `-2`, `-3`
- Generation gagal mid-way → `AiGeneration.status=failed`, simpan error, project tetap ada, bisa retry
- Refine yang konflik dengan existing field → merge strategy: tambah field baru, jangan drop column existing (additive)
- Permission tanpa methods/urls → deny-all (tidak efektif)
- Guard deny dievaluasi sebelum allow (client gating)
- Activity log `userId` nullable (SET NULL saat user dihapus)

---

## 14. Product Principles

- **Minimal Input, Maximal Output** — user effort minimal, AI effort maksimal
- **Opinionated, not Generic** — berani memilih yang terbaik, bukan menyajikan 10 opsi membingungkan
- **Beautiful is Non-Negotiable** — UI jelek ditolak, seperti Notion: tenang, rapi, warm
- **Production, not Prototype** — langsung bisa dipakai user akhir
- **Iterate Instantly** — refine sepelan `tambahkan X` langsung jadi
- **Auditability** — semua generation & mutasi tercatat di Activity Logs

---

## 15. Glossary

- **AiProject**: wadah aplikasi yang di-generate
- **AiPrompt**: teks prompt user + hasil inference
- **AiGeneration**: satu eksekusi generation (queue → running → success/failed)
- **AiAppSchema**: blueprint (entities, pages, roles, flows) JSON
- **Inference**: proses menebak requirement lengkap dari prompt pendek
- **Opinionated Defaults**: keputusan AI saat input minim
- **Generated App**: aplikasi hasil generate (`app/generated/{slug}/`)
- **Guard**: aturan URL allow/deny (client gating)
- **Permission**: izin method+URL (server enforcement)

---

## 16. Tujuan Aplikasi (Current — AI App Builder)

Platform **AI App Builder** yang menyediakan:

1. **Builder Prompt Bar** — input 1 baris → inference → generate
2. **Inference & Spec Preview** — mini-PRD + ERD + pages preview sebelum/saat generate
3. **Generation Pipeline** — prompt → code (entities, DTOs, services, APIs, pages, components, stores)
4. **Preview & Iterate** — preview instan + refine prompt pendek
5. **Project Library** — kelola semua generated apps
6. **RBAC Foundation** — user/role/permission/guard sebagai fondasi auth semua app

---

## 17. Daftar Fitur

### 17.1 Builder — Prompt → Generate

**Halaman utama builder** (`/builder`):

#### AiPromptBar
| Element | Spesifikasi (Next.js + shadcn/ui) |
|---------|-------------|
| Input | `<Input size="lg">` shadcn + `placeholder="Ketik ide aplikasi... mis. buatkan aplikasi kasir"` + clearable + prefix `<Sparkles size={16} />` (lucide-react) |
| CTA | `<Button variant="default">` pill `Buat Aplikasi` (primary `#0075de` via `app/globals.css` HSL) + Enter to submit |
| Hint | Text kecil `Tekan Enter — AI akan langsung paham dan generate` |

#### Inference Preview (opsional, <2s)
- Card menampilkan: Domain terdeteksi, 3-5 entities, 4-7 pages, 2-3 roles — dengan badge pill
- Tombol `Generate Sekarang` (jika inference butuh konfirmasi) atau auto-generate

#### Generation Progress
- Stepper: `Memahami intent` → `Merancang struktur` → `Membuat database` → `Merakit UI` → `Menyiapkan preview`
- Log streaming (sederhana) + progress bar

### 17.2 Project Library

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| ID | Number | Auto |
| Name | String | `Kasir POS` |
| Slug | String | `pos-kasir` unique |
| Prompt Awal | String | `buatkan aplikasi kasir` |
| Status | Enum | drafting/generating/ready/failed |
| Preview URL | String | `/generated/pos-kasir` |
| Updated At | Date | Auto |

Aksi: Preview, Refine, Duplicate, Delete, View Spec

### 17.3 Generated App — Quality Bar

Setiap generated app punya:
- **Dashboard** — stats (total produk, transaksi hari ini, omzet), recent 5 items, chart mini (jika relevan) — `app/generated/[slug]/page.tsx` (Server Component + Client islands)
- **CRUD Pages** — per entity: DataTable kanonis (shadcn Table + search 320px + field 160px + sort + visibility + pagination), FormModal (`Dialog` + `react-hook-form` + `zodResolver`), DetailDrawer (`Sheet`/`Drawer` + `.detail-view`)
- **Relations** — tampilkan relasi (Produk → Kategori, Transaksi → Pelanggan) dengan `Select`/`Badge` shadcn
- **Seed Data** — 5-10 rows realistis
- **Mobile-friendly** — responsive (Tailwind), PageShell breadcrumb (`next/link`)

### 17.4 Table Browse Features (Kanonis — Berlaku untuk Semua Tabel: RBAC + Generated)

Seperti `docs/architecture.md` § Table Browse — semua tabel wajib: Global Search 320px, Field-Specific 160px, Refresh, Error Slot, Pagination `Menampilkan {from}-{to} dari {total}`, Column Visibility, Sorting, Loading, Empty + CTA `+ Buat ...`.

### 17.5 Dashboard Platform

Widget:
| Widget | Deskripsi |
|--------|-----------|
| Total Projects | Jumlah app yang di-generate |
| Generations Today | Generations hari ini |
| Total Entities | Total entities across projects |
| Recent Projects | 5 project terbaru dengan status |

### 17.6 User Management, Role, Permission, Guard, Logs, Settings

Tetap seperti RBAC-Only sebelumnya — menjadi fondasi untuk generated apps. Detail di `docs/architecture.md` § RBAC dan § Seed Data.

---

## 18. Alur Authorization

### Server-Side Enforcement (Generated Apps ikut sama)
```
Request → JWT valid? → User → Roles → Permissions (methods+urls)
  → Method cocok? ( * atau exact) + URL match pattern (wildcard) → ALLOW else 403
```

Guard `allow/deny` dievaluasi client-side untuk menu visibility (`useAuthorization().canAccessUrl`).

### Builder-Specific
- `POST /api/builder/generate` → `requireAuth` + `requireApiAccess` (permission `Builder:Generate`)
- `GET /api/builder/projects` → list hanya project milik user (atau semua jika admin)
- Generated entity APIs (`/api/{slug}/{entity}/*`) → permission auto `Generated:{Slug}:{Entity}:Read/Write`

---

## 19. API Endpoints

> Detail DTO/query/response: `docs/architecture.md` § API Endpoints.

### AI Builder API (Baru)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/builder/generate` | Generate app dari prompt | Bearer |
| POST | `/api/builder/refine` | Refine existing project dengan prompt delta | Bearer |
| GET | `/api/builder/projects` | List semua project (paginated, filterable) | Bearer |
| GET | `/api/builder/projects/:slug` | Detail project + latest spec + generations | Bearer |
| GET | `/api/builder/projects/:slug/generations` | List generations per project | Bearer |
| GET | `/api/builder/generations/:id` | Detail generation (spec, error, duration) | Bearer |
| DELETE | `/api/builder/projects/:slug` | Hapus project + generated code | Bearer |
| POST | `/api/builder/preview/:slug` | (Re)build preview / get preview URL | Bearer |
| GET | `/api/builder/templates` | List template starter (kasir, crm, todo, dll) | Public |

### Generated App API (Otomatis per App — Next.js Route Handlers)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/generated/:slug/:entity` | List entity (paginated) | Bearer + Permission |
| GET | `/api/generated/:slug/:entity/:id` | Detail entity | Bearer + Permission |
| POST | `/api/generated/:slug/:entity` | Create entity | Bearer + Permission |
| PUT | `/api/generated/:slug/:entity/:id` | Update entity | Bearer + Permission |
| DELETE | `/api/generated/:slug/:entity/:id` | Delete entity | Bearer + Permission |

via `app/api/generated/[slug]/[entity]/route.ts` + `[id]/route.ts`

Contoh: `GET /api/generated/pos-kasir/products?page=1&limit=20&search=kopi`

### Auth API (Tetap Ada)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register | Public |
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/auth/profile` | Get profile | Bearer |
| PATCH | `/api/auth/profile` | Update profile | Bearer |
| PATCH | `/api/auth/password` | Change password | Bearer |

### RBAC API (Tetap Ada — Next.js Route Handlers)

`GET/POST /api/users` (`app/api/users/route.ts`), `GET/PUT/DELETE /api/users/[id]/route.ts`, serupa `/api/roles`, `/api/permissions`, `/api/guards` + `GET /api/activity-logs`, `/api/system-logs`, `/api/settings`, `/api/storage`, `/api/health`

---

## 20. Client Routes

### File-Based Routing (Next.js App Router)

| File | Route | Auth | Description |
|------|-------|------|-------------|
| `app/(auth)/login/page.tsx` | `/login` | Guest (middleware) | Login |
| `app/(auth)/register/page.tsx` | `/register` | Guest | Register |
| `app/(dashboard)/dashboard/page.tsx` | `/dashboard` | Required | Dashboard platform (stats projects) |
| `app/builder/page.tsx` | `/builder` | Required | Builder prompt bar + library |
| `app/builder/[slug]/page.tsx` | `/builder/:slug` | Required | Project detail + preview + refine |
| `app/generated/[slug]/page.tsx` + `app/generated/[slug]/[entity]/page.tsx` | `/generated/:slug/*` | Required | Generated app pages (dashboard, list, etc.) |
| `app/(dashboard)/users/page.tsx` | `/dashboard/users` | Required | Manajemen user |
| `app/(dashboard)/roles/page.tsx` | `/dashboard/roles` | Required | Manajemen role |
| `app/(dashboard)/permissions/page.tsx` | `/dashboard/permissions` | Required | Manajemen permission |
| `app/(dashboard)/guards/page.tsx` | `/dashboard/guards` | Required | Manajemen guard |
| `app/(dashboard)/activity-logs/page.tsx` | `/dashboard/activity-logs` | Required | Activity logs |
| `app/(dashboard)/system-logs/page.tsx` | `/dashboard/system-logs` | Required | System logs |
| `app/(dashboard)/settings/page.tsx` | `/dashboard/settings` | Required | Settings |
| `app/(dashboard)/profile/page.tsx` | `/dashboard/profile` | Required | Profile |

### Sidebar Menu Structure (Baru)
```
Builder (NEW)
  ├── Buat Aplikasi        → /builder (prompt bar)
  └── Library              → /builder (list projects)
Generated Apps (dynamic)
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

## 21. Non-Functional Requirements

### Security
- Password bcrypt 10 rounds, JWT 24h
- Endpoint sensitif: auth + otorisasi permission method+URL
- Zod whitelist DTO, no extra props
- Generated apps ikut RBAC yang sama

### Performance
- Generation <30s untuk app 3-4 entities (tanpa LLM eksternal lambat)
- List pagination 20 default, max 100
- SQLite + better-sqlite3 cukup untuk preview skala kecil; production single-file backup

### UX
- **Responsive** mobile-first
- Warm paper canvas `#f6f5f4` + kartu putih hairline
- Primary CTA pill Notion blue `#0075de`
- Loading, empty, error, success states di semua flow
- Builder: optimistic UI — inference preview <2s, progress streaming
- Generated apps: semua tabel pakai DataTable kanonis, detail pakai `.detail-view`

---

## 22. Seed Data Summary

### RBAC Seed (Tetap — sumber kebenaran `lib/db/seed.ts` / `lib/services/seeder.service.ts`)

Sama seperti sebelumnya: 5 users (admin/editor/viewer/manager/guest), 7 roles, 8 guards, 10 permissions + junctions. Lihat `docs/database.md` § Seed Data eksak. Dipanggil di `instrumentation.ts` atau `lib/db/init.ts` (Next.js).

Ditambah seed **Builder Templates** (di `AiProject` / stub):
| Template | Slug | Prompt Contoh | Entities |
|----------|------|---------------|----------|
| Kasir POS | `pos-kasir` | `buatkan aplikasi kasir` | Product, Category, Transaction, Customer |
| CRM Klinik | `crm-klinik` | `buatkan CRM untuk klinik` | Patient, Doctor, Appointment, MedicalRecord |
| Todo Share | `todo-share` | `todo app dengan fitur share` | Todo, Project, ShareLink |
| Inventory | `inventory` | `buatkan aplikasi inventory gudang` | Item, Warehouse, StockMovement |
| Sekolah | `sekolah` | `buatkan aplikasi sekolah` | Student, Teacher, Class, Attendance |

Template dipakai untuk inference fallback & `GET /api/builder/templates`.

---

## 23. Client-Side Authorization

Sama seperti sebelumnya: `fetch` wrapper (`hooks/useApi.ts`) interceptor 401/403, `middleware.ts` guard, menu visibility via `hooks/useAuthorization.ts` (`hasRole`, `hasPermission`, `canAccessUrl`).

Ditambah untuk Builder:
- `canGenerate` → cek permission `Builder:Generate`
- `canAccessGeneratedApp(slug)` → cek permission `Generated:{Slug}:Read`

---

## 24. AI Assistant Behaviour Contract (Wajib)

> Kontrak perilaku AI Assistant agar user cukup ketik sedikit, langsung jadi aplikasi.

1. **Jangan banyak tanya balik.** Infer yang paling umum & bagus, maksimal 1 kalimat konfirmasi opsional lalu generate.
2. **Selalu hasilkan app lengkap + cantik.** Minimal: Auth (jika butuh) + Dashboard + 2-4 CRUD + search/sort/pagination + validasi + empty/loading/error + responsive + sidebar. Jangan kasih scaffold kosong.
3. **Design System kanonis wajib.** `#0075de` primary, canvas `#f6f5f4`, hairline `#e6e6e6`, radius 12/8/4, Inter, PageShell + DataTable kanonis, detail-view, `lucide-react` icons. Jangan bikin app jelek.
4. **Opinionated & production-ready.** Pilih field & relasi masuk akal, seed data contoh, permission/role default, validasi Zod ketat.
5. **Iterasi via prompt pendek.** Dukung `tambahkan fitur X`, `ganti ...`, `perbaiki ...` tanpa rebuild dari nol.
6. **Jelaskan singkat setelah generate.** Ringkasan: apa yang jadi, route apa, cara pakai, saran refine 1-2 baris.

Contoh ideal:
> User: `buatkan aplikasi kasir`
> AI: `Siap — aku bikinin aplikasi Kasir POS lengkap ya. Ada Produk, Transaksi, Pelanggan, Laporan, Dashboard. Sudah jadi di /generated/pos-kasir — bisa langsung dipakai. Mau tambah barcode scanner atau struk PDF?`

---

## Change Log

### Stack Migration — Next.js + React (2026-09-15)

- **MIGRASI** dari Nuxt 4 + Vue + Nitro + Pinia + Naive UI → **Next.js 15 (App Router) + React 19 + Zustand + TanStack Query + shadcn/ui + lucide-react + Framer Motion**. PRD Tech Stack (§1, §12), Functional Req (§10.1 UI Assembly → hooks + Zustand, Route Handlers), Fitur Builder (§17.1 → shadcn Input/Button), Generated CRUD relations (§17.3 Select/Badge), API Endpoints (§19 generated `/api/generated/:slug`), Client Routes (§20 App Router route groups `(auth)`/`(dashboard)` + `app/generated`), Seed source (`lib/db/seed.ts`), Auth guard (`middleware.ts`), Design System icons (`lucide-react`).

### AI App Builder — Platform Pivot (2026-09-15)

- **PIVOT** dari LBS RBAC-Only ke **AI App Builder Platform** (`Minimal Prompt → Maximal App`).
- **Baru**: §1 Product Overview (tagline, zero-friction, contoh kasir), §2 Vision, §3 Problem Statement (spec panjang vs 1 baris prompt), §4 Goals (prompt→app, infer, cantik, production, iterate, preview, RBAC auto), §7 Roles (Builder User + Generated App Roles), §8 Core Concepts (AiProject/Prompt/Generation/AppSchema/DataModel/Page/ComponentSpec/Deployment + inference), §9 Workflows (Minimal Prompt → Instant App + Iterate + Library), §10 Functional Requirements (Builder Core + Quality Bar + Library), §11 Business Rules (infer don't ask, opinionated, beautiful, RBAC auto, non-destruktif), §17 Daftar Fitur (Builder PromptBar, Inference Preview, Generation Progress, Library, Generated Quality Bar), §18 Alur Authorization (builder + generated), §19 API Endpoints (builder + generated dynamic), §20 Client Routes (builder + generated dynamic), §22 Seed (Builder Templates), §24 Behaviour Contract (Wajib untuk AI Assistant).
- **Dipertahankan**: RBAC Foundation (§17.6, §18, §19, §22 RBAC seed, §23 client auth) sebagai fondasi; Design System & Architecture dirinci di dokumen masing-masing.
- **Migrasi**: `AGENTS.md` + `docs/architecture.md` + `docs/database.md` + `docs/design-system.md` ikut pivot serentak; `docs/production-runbook.md` + `tasks/` menyusul.

### Docs Tidy — Adopsi Notion Design (2026-09-13)

- §14 + §21 UX: paper-calm (warm canvas, satu aksen `#0075de`, CTA pill).

### Task 01 — Platform Scope Reduction (2026-09-12)

- Removed Dynamic Administration scope: Global Table, Component, Template, Administration, Document — diarsip di git history.

