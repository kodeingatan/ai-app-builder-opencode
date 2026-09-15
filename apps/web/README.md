# apps/web — AI App Builder Platform

> `Minimal Prompt → Maximal App`

## Quick Start (dari `apps/web/`)

```bash
npm install          # install deps (butuh rebuild better-sqlite3 & bcrypt jika native)
npm run dev          # dev server http://localhost:3000
npm run build        # production build
npm run preview      # preview production build
npm run test         # all tests
npm run test:e2e     # e2e (Playwright, auto-start dev server)
```

## AI App Builder

```bash
npm run builder:generate -- "buatkan aplikasi kasir"
npm run builder:preview
npm run builder:list
```

Lihat `AGENTS.md` § AI App Builder — Behaviour Contract (Wajib):

- Ketik `buatkan aplikasi X` → AI langsung infer (domain, 3-5 entities, 4-7 pages, 2-3 roles) → langsung generate aplikasi lengkap + cantik (Dashboard + CRUD + search/sort/pagination + validasi + seed 5-10 rows realistis)
- Design System kanonis: `#0075de` primary pill, `#f6f5f4` canvas, `#e6e6e6` hairline, radius 12/8/4, Inter, PageShell + DataTable, detail-view
- Iterate: `tambahkan barcode scanner` atau `tambahkan laporan harian` → patch tanpa rebuild nol

## Struktur Penting

- `app/components/builder/` — AiPromptBar, InferencePreview, GenerationProgress, ProjectCard
- `app/generated/{slug}/` — generated apps terisolasi (jangan edit manual, refine via builder)
- `server/api/builder/` — `generate.post.ts`, `refine.post.ts`, `projects.get.ts`, etc.
- `server/services/ai-builder/` — inference, spec, planner, codegen, integration
- `server/entities/` — RBAC 9 + Builder 8 schemas (total 17/~23 tabel), canonical `server/utils/orm-data-source.ts`

## Tech Stack

Nuxt 4 + Vue 3.5 + TypeScript + Naive UI 2.44 + Tailwind v4 + Pinia + TypeORM 1.1 EntitySchema + SQLite better-sqlite3 + Zod + JWT 24h + Anime.js

Docs: `docs/PRD.md` | `docs/architecture.md` | `docs/database.md` | `docs/design-system.md`
