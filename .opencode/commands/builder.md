---
description: Generate AI App via prompt — Minimal Prompt → Maximal App (Next.js + shadcn/ui)
---

# AI App Builder — Generate App from Prompt

Generate aplikasi otomatis dari **prompt pendek** sesuai behaviour contract `AGENTS.md` § AI App Builder.

Input: `$ARGUMENTS` adalah prompt user, contoh: `buatkan aplikasi kasir dengan laporan`.

Contoh:
```
/builder buatkan aplikasi kasir
/builder buatkan CRM untuk klinik dengan fitur janji temu
/builder todo app dengan fitur share dan assign member
```

---

## 1. Inference (Infer, don't ask)

- Input prompt → call `lib/services/ai-builder/inference.service.ts` `AiInferenceService.infer(prompt)` (rule-based stub v1, LLM-ready via `AiInferenceProvider`).
- Output `InferredIntent`: `domain`, `domainLabel`, `entities` (3-5), `pages` (4-7), `roles` (2-3), `flows`.
- Mapping opiniated ada di `.opencode/skills/ai-app-builder/SKILL.md` (kasir→POS, klinik→Clinic, todo→Todo, dll). Jika prompt ambigu → pilih yang paling umum, maks 1 kalimat konfirmasi lalu generate.

## 2. Generate (Next.js)

Untuk tiap `entities`:
- `lib/db/entities/generated/{slug}/{entity}.entity.ts` (EntitySchema TypeORM) — columns dari fields inference
- `lib/dto/{slug}/{entity}.dto.ts` (Zod `Create{Entity}Schema` + `QuerySchema`)
- `lib/services/{slug}/{entity}.service.ts` (plain object `findAll/findOne/create/update/remove` via `getDataSource()`)
- `app/api/generated/{slug}/{entity}/route.ts` (`GET`/`POST`) + `app/api/generated/{slug}/{entity}/[id]/route.ts` (`GET/PUT/DELETE`) — `NextRequest`/`NextResponse`, `lib/auth/guard.ts` (`requireApiAccess` → `Generated:{Slug}:*`)
- `lib/types/{slug}/{entity}.ts`
- `app/generated/[slug]/page.tsx` (dashboard) + `app/generated/[slug]/[entity]/page.tsx` (list) + components `components/` + hooks `hooks/use{Entity}Data.ts` (TanStack Query) + `stores/` (Zustand)

Untuk tiap pages: `PageShell` + `DataTable` shadcn (320/160, `Menampilkan {from}-{to} dari {total}`) + `Dialog`+`Form` (react-hook-form+zodResolver) + `Sheet` detail-view + `Card` StatCard (lucide-react). Wajib token `app/globals.css` HSL `--primary: 210 100% 44%` (~#0075de), `rounded-full` pill CTA.

Register di `lib/db/data-source.ts` (`appEntities` += generated) + seed 5-10 rows realistis (idempotent) via `lib/db/seed.ts`.

## 3. Integration & Preview

- Update sidebar `components/layout/AppLayout.tsx` group `Generated Apps` dynamic dari `GET /api/builder/projects?status=ready`
- Buat `AiProject` (`slug` URL-safe `^[a-z0-9]+(-[a-z0-9]+)*$`, auto suffix `-2` jika collision) + `AiPrompt` (version) + `AiGeneration` (`queued→running→success/failed`, `spec` JSON, `durationMs`) + `AiDeployment` (`/generated/{slug}`)
- `AiProject.status`: `drafting`→`generating`→`ready`/`failed` (lihat `docs/database.md` Dynamic App Tables)

## 4. Iterate (Refine)

- `POST /api/builder/refine` body `{ slug, prompt: "tambahkan barcode scanner" }` → `AiInferenceService.infer delta` → patch additive (ADD COLUMN / create new table, never DROP), merge tanpa hapus data existing.

## 5. Output

Kembalikan JSON `{ project, generation, previewUrl, inferredIntent, message }` dan tampilkan ringkasan singkat + next refine suggestion:
> Siap — aku bikinin Kasir POS lengkap ya. Ada Produk, Transaksi, Pelanggan, Laporan, Dashboard. Sudah jadi di /generated/pos-kasir — bisa langsung dipakai. Mau tambah barcode scanner atau struk PDF?

## 6. Commands Mapping

- CLI: `npm run builder:generate -- "prompt"` → panggil `lib/services/ai-builder/cli.ts generate`
- API: `POST /api/builder/generate` (Route Handler `app/api/builder/generate/route.ts` dengan `GenerateSchema` Zod 3-500 chars)
- Hook: `hooks/useAiBuilder.ts` (`generate(prompt)`, `refine(slug,prompt)`, `listProjects()`)
- UI: `components/builder/AiPromptBar.tsx` (`Input` shadcn + `Button rounded-full` + `Sparkles` lucide, Enter to generate) di `app/builder/page.tsx`

## 7. Validation

- Prompt 3-500 chars (Zod `GenerateSchema`), slug unique, pagination `page/limit/search/sortBy/sortOrder` default, `NextResponse.json` error 422/409/500
- Design lint: setiap `app/generated/[slug]/**/*.tsx` harus import `PageShell` + `DataTable` + `lucide-react`, bukan `@vicons/carbon`/`Naive` — fail review jika generic

## 8. Usage

```
/builder buatkan aplikasi kasir
/builder buatkan aplikasi klinik untuk dokter dengan pasien dan rekam medis
/builder tambahkan laporan harian ke pos-kasir
```
