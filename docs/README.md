# Docs — Index

Dokumentasi permanen (single-source-of-truth). Scope: **AI App Builder Platform** — `Minimal Prompt → Maximal App`.

| Dokumen | Isi | Baca saat |
|---------|-----|-----------|
| `PRD.md` | Requirements AI App Builder (§1–§24): visi, goals, roles (platform + generated), core concepts (AiProject/Prompt/Generation/AppSchema), workflows (Prompt→App + Iterate + Library), fitur Builder + Generated Quality Bar, auth flow, ringkasan API (builder + generated dynamic), routes (platform + generated), NFR, seed RBAC + builder templates, behaviour contract (Infer don't ask) | Butuh sudut pandang **produk** (apa & mengapa) |
| `architecture.md` | Arsitektur AI Builder (Next.js 15 App Router): layer stack (AI Builder Layer), generation flow (Prompt→Inference→Spec→CodeGen→UI Assembly→Preview), struktur proyek (`app/builder/`, `app/generated/[slug]/`, `app/api/builder/`, `lib/services/ai-builder/`), conventions (Next.js Route Handlers + shadcn/ui + hooks), routing `(auth)`/`(dashboard)` + `[slug]`, API endpoints (builder 9 + generated `/api/generated/[slug]/[entity]`), RBAC system (`middleware.ts` + `lib/auth/guard.ts`), ERD builder, tech stack, DataTable/PageShell kanonis | Butuh sudut pandang **teknis** (bagaimana) |
| `database.md` | Skema DB: **17 EntitySchemas / ~23 tabel** (RBAC 9/12 + Builder 8/11), ERD RBAC + Builder, detail entitas (AiProject, AiPrompt, AiGeneration, AiAppSchema, AiDataModel, AiPage, AiComponentSpec, AiDeployment + generated tables `{slug}_{entity}`), seed RBAC eksak + builder templates + generated tables dynamic, relasi & migration strategy (additive) | Butuh detail **data** |
| `design-system.md` | Token + pola UI (Next.js + shadcn/ui + lucide-react + Framer Motion): Notion-calm palette (`#0075de` primary, `#f6f5f4` canvas, `#e6e6e6` hairline), tipografi Inter, spacing, radius, PageShell/DataTable (shadcn Table)/detail-view kanonis + **AI Builder specs** (AiPromptBar, InferencePreview, GenerationProgress, ProjectCard, Template Gallery, Refine Bar) + **Generated App UI Rules** (wajib PageShell/DataTable/DetailDrawer/Dialog+Form, warna/radius/icon lucide, states, RBAC gating) | Butuh **tampilan / komponen** |
| `production-runbook.md` | Operasi produksi (Next.js): `next build` + `next start`, boot + baseline (RBAC + Builder) via `instrumentation.ts`, health `/api/health`, backup SQLite, roles (Builder:* + Generated:*), audit (GENERATE/REFINE), limits, quickstarts builder + generated, API delta RBAC+Builder | **Deploy / operasi** |

## Aturan anti-drift

* PRD = ringkasan produk, architecture/database/design-system = detail teknis. Dua arah cross-reference (PRD §17.4, §18, §19, §20, §22 ↔ architecture § Routing, API Endpoints, RBAC System; PRD §8 ↔ database.md ERD).
* Seed data: sumber kebenaran `apps/web/lib/db/seed.ts` (Next.js, `lib/services/seeder.service.ts` kompat); salinan di PRD §22 dan database.md § Seed Data harus sama (RBAC 5 users + Builder templates 5).
* Token desain: `apps/web/app/globals.css` (`:root` HSL `--primary: 210 100% 44%` ~ `#0075de`) + `components/ui/*` (shadcn); generated code wajib re-use token kanonis — lint `app/generated/[slug]/**/*.tsx` harus import `PageShell` + `DataTable` (shadcn Table) + `lucide-react`.
* Ubah satu sisi → cek sisi pasangannya. Behaviour contract AI Assistant di `AGENTS.md` + `docs/PRD.md` §24 wajib sinkron: *Infer, don't ask* + *Beautiful by default*.

