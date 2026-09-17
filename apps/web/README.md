# apps/web — AI App Builder Platform (Next.js)

> `Minimal Prompt → Maximal App` — Next.js 15 (App Router) + React 19 + shadcn/ui

## Quick Start (dari `apps/web/`)

```bash
npm install          # butuh rebuild better-sqlite3 & bcrypt jika native
npm run dev          # Next.js dev --turbopack http://localhost:3000
npm run build        # next build
npm run start        # next start
npm run lint         # next lint
npm run test         # vitest
npm run test:e2e     # playwright
```

## AI App Builder

Ketik di `/builder` atau chat:

```
buatkan aplikasi kasir
```

```bash
npm run builder:generate -- "buatkan aplikasi kasir"
npm run builder:list
```

AI akan infer (domain, 3-5 entities, 4-7 pages, 2-3 roles) → generate Next.js:

- `lib/db/entities/generated/{slug}/` (EntitySchema)
- `lib/dto/{slug}/`, `lib/services/{slug}/`, `app/api/generated/[slug]/[entity]/route.ts`
- `app/generated/[slug]/` (`page.tsx`, `components/`, `hooks/` TanStack Query)

Design tokens: `app/globals.css` HSL `--primary: 210 100% 44%` (~ `#0075de`), canvas `#f6f5f4`, hairline `#e6e6e6`, shadcn `components/ui` (Button pill `rounded-full`, Input tight `rounded-[4px]`, Card `rounded-xl`, Dialog, Table), lucide-react icons.

Lihat `AGENTS.md` § Behaviour Contract (Wajib): *Infer don't ask, Beautiful by default, Minimal Prompt → Maximal App*.

## Struktur Next.js

```
app/
  layout.tsx, globals.css, page.tsx
  (auth)/login/page.tsx, (auth)/register/page.tsx
  (dashboard)/dashboard/page.tsx, users/page.tsx, ...
  builder/page.tsx, builder/[slug]/page.tsx
  generated/[slug]/page.tsx, generated/[slug]/[entity]/page.tsx
  api/auth/login/route.ts, api/users/route.ts, api/builder/generate/route.ts, api/generated/[slug]/[entity]/route.ts
components/
  ui/ (Button, Input, Card, Dialog, Table, etc.)
  common/DataTable/  layout/PageShell  builder/AiPromptBar.tsx
hooks/ (useApi, useAiBuilder, useDataTable, useAuthorization)
lib/
  db/data-source.ts, db/seed.ts, db/entities/, db/migrations/
  dto/, services/, services/ai-builder/, auth/jwt.ts, utils/
middleware.ts, instrumentation.ts, next.config.ts
```

## Tech Stack

Next.js 15 + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui + lucide-react + Framer Motion + Zustand + TanStack Query + TypeORM 1.1 EntitySchema + SQLite better-sqlite3 + Zod + JWT httpOnly cookie + middleware.ts

Docs: `docs/PRD.md` | `docs/architecture.md` | `docs/database.md` | `docs/design-system.md` (Next.js + shadcn)
