> **Last Backup:** 2026-09-18 — via `/knowledge:backup`
> **Source:** `apps/web/*` — `prisma/schema.prisma` (25 models), `app/*`, `lib/*`, `components/*`
> **Scope:** `apps/web` — untuk root lihat `../../docs/`

# Design System — AI App Builder Platform

## Overview

Design system menggunakan **shadcn/ui** (Radix UI primitives) + **Tailwind CSS v4** sebagai foundation komponen. Semua token didefinisikan sebagai CSS variables HSL di `app/globals.css` (`:root` + `.dark`) + Tailwind utilities; utilities Tailwind memakai nilai token yang sama. **Generated apps WAJIB re-use token kanonis ini** — tidak ada app jelek/generic. Hasil generate harus terlihat seperti dibuat Designer Senior, bukan template murahan.

Filosofi: **Notion-calm + Professional Workspace** — warm paper, satu aksen struktural, chrome monokrom, personality dari ilustrasi & data.

---

## Color Palette

> Sumber inspirasi: Notion (`DESIGN-notion.md`, dihapus setelah adopsi). Prinsip: kanvas paper-calm, **satu aksen struktural** (Notion blue), chrome monokrom, sticker hanya untuk ilustrasi.

### Primary (Notion Blue — satu-satunya aksen struktural)

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#0075de` | Main brand — primary CTA, inline link, active/focus signal. **WAJIB untuk semua generated app primary button** |
| Primary Hover | `#0069c4` | Button hover (12% darken) |
| Primary Pressed | `#005bab` | Pressed state |
| Primary Soft | `#e8f2fd` | Background hover/light (tint ~8%) |
| Deep Indigo | `#213183` | Full-bleed inverted band (hero dashboard) — satu momen gelap |

### Canvas & Surface (warm paper, bukan clinical white)

| Token | Hex | Usage |
|-------|-----|-------|
| Canvas | `#ffffff` | Nav bar, kartu, panel, field |
| Canvas Soft | `#f6f5f4` | Page canvas + footer band — warm off-white paper-calm |
| Hairline | `#e6e6e6` | Border 1px kartu & divider (black-10%-on-white) |

### Ink (teks — warm charcoal)

| Token | Hex | Usage |
|-------|-----|-------|
| Ink | `#000000` | Headline + body utama (~95% alpha) |
| Ink Secondary | `#31302e` | Body sekunder |
| Ink Muted | `#615d59` | Supporting / muted |
| Ink Faint | `#a39e98` | Caption, metadata, placeholder |

### Sticker Palette (dekoratif saja — tidak untuk CTA/struktur)

| Token | Hex | Usage |
|-------|-----|-------|
| Sky | `#62aef0` | Ilustrasi, icon tile, category dot |
| Purple / Deep | `#d6b6f6` / `#391c57` | Ilustrasi |
| Pink | `#ff64c8` | Ilustrasi |
| Orange / Deep | `#dd5b00` / `#793400` | Ilustrasi |
| Teal | `#2a9d99` | Ilustrasi, tick |
| Green | `#1aae39` | Ilustrasi, tick |
| Brown | `#523410` | Ilustrasi |

### Semantic (dipertahankan — deviasi disengaja)

| Token | Hex | Usage |
|-------|-----|-------|
| Success | `#22C55E` | Success |
| Warning | `#F59E0B` | Warning |
| Error | `#EF4444` | Error |
| Info | `#0EA5E9` | Information |

### Border

| Token | Hex |
|-------|-----|
| Default (Hairline) | `#e6e6e6` |
| Focus | `#0075de` |
| Divider | `#e6e6e6` |

---

## Typography

Font: **Inter** (substitusi `NotionInter` — pakai negative tracking agar setajam Notion).

| Token | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | 40px | 700 | 1.1 | −1px | Hero builder (`Buat Aplikasi dari 1 Baris`) |
| H1 | 28px | 700 | 1.23 | −0.625px | Section headline |
| H2 | 24px | 700 | 1.27 | −0.25px | Sub-section |
| H3 | 20px | 600 | 1.4 | −0.125px | Card title (PageShell title) |
| Body | 14px | 400 | 1.5 | 0 | Default |
| Small | 13px | 400 | 1.43 | 0 | Dense body, table row |
| Caption | 12px | 400 | 1.43 | 0 | Caption, footnote |
| Eyebrow | 12px | 600 | 1.33 | +0.125px | Pill badge, table header |

Prinsip: headline heavy (700) + body tenang (400) — body tidak pernah heavy.

---

## Spacing

Skala 8px-base (xxs 4 · xs 8 · sm 12 · md 16 · lg 24 · xl 28 · xxl 32):

| Token | Value | Usage |
|-------|-------|-------|
| xxs | 4px | Gap mikro, chip |
| xs | 8px | Gap antar-aksi, toolbar |
| sm | 12px | Cell padding vertikal |
| md | 16px | Padding kartu kecil, gap form |
| lg | 24px | Padding kartu, PageShell body |
| xl | 28px | Gap section |
| xxl | 32px | Gap section besar, empty-state |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Form field, tag, chip (input tetap tight — **jangan pill**) |
| sm | 5px | Menu item, list row, status pill |
| md | 8px | Utility/nav button, kartu kecil |
| lg | 12px | Feature card, PageShell, illustration frame |
| xl | 16px | Kontainer besar, modal, drawer |
| Full | 9999px | Primary CTA pill, badge, circular icon |

**Aturan untuk generated apps**: CTA primer **pill** (Full), input **xs 4px** (tight), kartu **lg 12px** — jangan random.

---

## Elevation & Depth

Filosofi **barely-there**: hairline + micro-shadow berlapis nyaris transparan — ilustrasi adalah cue kedalaman utama.

| Level | Treatment | Use |
|-------|-----------|-----|
| 0 — Flat | Hairline `#e6e6e6` 1px, no shadow | Default card di warm canvas, DataTable container |
| 1 — Soft | `rgba(0,0,0,0.04) 0 4px 18px` + hairline | Raised card, floating button, focus input |
| 2 — Elevated | `rgba(0,0,0,0.05) 0 23px 52px` + hairline | Modal, popover, drawer |

---

## Component Dimensions

### Component Height

| Component | Height |
|-----------|--------|
| Button Small | 28px |
| Button Default | 32px |
| Button Large | 36px |
| Input | 32px |
| Select | 32px |
| Badge | 20px |
| Tag | 20px |

### Button Padding

| Size | Padding |
|------|---------|
| Small | `0 10px` |
| Default | `0 12px` |
| Large | `0 16px` |

### Icon Size

| Token | Size |
|-------|------|
| xs | 12px |
| sm | 14px |
| md | 16px |
| lg | 20px |
| xl | 24px |

---

## Container

| Token | Value |
|-------|-------|
| Card Padding | 12px |
| Modal Padding | 16px |
| Drawer Padding | 16px |
| Form Gap | 12px |
| Section Gap | 20px |

---

## PageShell (Kanonis List/Detail/Editor — Wajib untuk Semua App: RBAC + Generated)

Kanonis shell untuk semua halaman `list` / `detail` / `editor`.

- **Komponen**: `app/components/layout/PageShell.vue` — `props: title, breadcrumbs: {label, href?}[], description?`, slots `actions` + `default`
- **Struktur**: `breadcrumb` → `header (title + actions)` → `toolbar (DataTable)` → `konten (table/detail/editor)` → `pagination`. Padding `head 16px 20px`, `body 24px`, border `1px #e6e6e6` radius `12`, `flex-wrap` responsive (`column <768px`)
- **Breadcrumb**: leaf `span aria-current="page"`, lainnya `<a href>` + `preventDefault` + `router.push`
- **Generated apps**: tiap list page (`/generated/pos-kasir/products`) WAJIB pakai PageShell — jangan buat header custom tanpa breadcrumb.

---

## Detail View (Read Detail — Wajib untuk Generated Drawer/Page)

Standar layout untuk semua **read detail** (drawer, inline card). Menggantikan `NDescriptions`.

```html
<div class="detail-view">
  <div class="detail-field">
    <span class="detail-label">{LABEL}</span>
    <span class="detail-value">{VALUE}</span>
  </div>
</div>
```

| Class | Property | Value |
|-------|----------|-------|
| `.detail-view` | display | `flex` + `column` |
| `.detail-field` | padding | `12px 0` + border-bottom `1px solid rgba(0,0,0,0.06)` |
| `.detail-label` | font-size | `11px` + `600` + `uppercase` + `letter-spacing 0.05em` + `#94a3b8` |
| `.detail-value` | font-size | `14px` + `500` + `#1e293b` + `line-height 1.5` |

Modifiers: `.detail-value--text` (400 #334155), `.detail-value--mono` (mono 13px), `.detail-value--code` (bg #f8fafc border #e2e8f0 radius 8 padding 12), `.detail-value--dark` (bg #1e293b).

**Generated apps**: DetailDrawer per entity wajib pakai pola ini — jangan pakai NDescriptions.

---

## Table (Kanonis — Wajib untuk Semua Tabel: RBAC + Generated)

### Dimensions

| Item | Value |
|------|-------|
| Row Height | 36px |
| Cell Padding | `12px 16px` |
| Header Height | 40px |
| Header Background | Canvas Soft `#f6f5f4` |
| Header Typography | Eyebrow 12px/600 caps +0.125px |
| Body Typography | Small 13–14px/400 |
| Row Border | Hairline `#e6e6e6` 1px |

### Required Features — Semua Tabel WAJIB

| Feature | Component |
|---------|-----------|
| Global Search 320px | <Input> + Search icon + clearable + debounce 300ms + placeholder `Cari...` |
| Field-Specific Search 160px | Select (shadcn) filterable `Semua Kolom` |
| Column Visibility | NPopover + NCheckbox + Settings icon |
| Sorting | NDataTable sorter (ArrowUp/ArrowDown 14px Primary) |
| Pagination | `Menampilkan {from}-{to} dari {total}` (ID) |
| Page Size | 10, 20, 50, 100 — default 20 |
| Refresh | <Button> + Restart icon + `emit('refresh')` |
| Error Slot | Alert (shadcn) error + `Coba lagi` retry |
| Empty | Empty (shadcn) `Belum ada data` + CTA `+ Buat ...` |
| Loading | Spinner overlay semi-transparan |

**Generated apps**: DataTable per entity wajib pakai `app/components/common/DataTable/DataTable.vue` — jangan buat `NDataTable` manual tanpa toolbar kanonis. Toolbar layout:

```
┌─────────────────────────────────────────────────────────────────┐
│ [Search 320px flex-1] [Field 160px] [Reset] [Settings] [Refresh]│
│ [Create CTA pill primary]                          [Page info]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Builder — Component Specs (Baru — Wajib)

### AiPromptBar — Input Prompt → Generate

Kartu prompt builder — center stage di `/builder`.

| Property | Value |
|----------|-------|
| Container | Canvas `#ffffff` + radius xl `16px` + hairline `#e6e6e6` + shadow Level-1 + padding `24px` |
| Title | H2 24px/700 `Buat Aplikasi dari 1 Baris` + subtitle Small 13px Muted `Ketik ide... mis. buatkan aplikasi kasir` |
| Input | <Input> shadcn `size=lg` + `placeholder="Ketik ide aplikasi... mis. buatkan aplikasi kasir"` + `clearable` + prefix `Sparkles` (lucide-react) via `h(lucide-react)` + height 44px + radius 9999 pill? **No** — input tetap **radius xs 4px** (tight) sesuai rule; CTA yang pill |
| CTA | <Button> shadcn + `size=large` + pill `Full 9999px` + `Buat Aplikasi` + suffix `ArrowRight` (lucide-react) + `#0075de` bg + `#e8f2fd` hover? (follow GlobalThemeOverrides) |
| Hint | Caption 12px Faint `Tekan Enter — AI akan langsung paham dan generate` + `prefers-reduced-motion` |
| States | empty → hint + disabled CTA; loading → CTA loading + progress; error → Alert (shadcn) error + retry |

**Layout**:
```
┌─ AiPromptBar (white card, 24px pad, 16px radius) ─────────────────┐
│  Buat Aplikasi dari 1 Baris (H2)                                   │
│  Ketik ide... mis. buatkan aplikasi kasir (Small muted)            │
│  ┌─────────────────────────────────┐ ┌───────────────┐              │
│  │ ✨  Ketik ide aplikasi...       │ │ Buat Aplikasi →│ (pill primary)|
│  └─────────────────────────────────┘ └───────────────┘              │
│  Tekan Enter — AI akan langsung paham dan generate (Caption)        │
└─────────────────────────────────────────────────────────────────────┘
```

### InferencePreview — Hasil Tebakan AI (opsional, <2s)

Card badge list sebelum generate (atau inline setelah submit):

| Property | Value |
|----------|-------|
| Container | Canvas Soft `#f6f5f4` + radius lg `12px` + padding `16px` + gap `12px` |
| Title | Eyebrow 12px/600 `AI MENGERTI SEBAGAI:` |
| Badges | Domain: pill `Sky #62aef0` text Deep; Entities: 3-5 pills `<Badge>` medium; Roles: pills `Purple`; Pages: pills `Orange` |
| Seed | Small 13px `Otomatis siapkan 8 produk contoh, 5 pelanggan` |
| CTA | `Generate Sekarang` <Button> shadcn small pill primary (jika butuh konfirmasi) |
| Animation | slideUp 250ms stagger per badge |

### GenerationProgress — Stepper

| Property | Value |
|----------|-------|
| Steps | `Memahami intent` → `Merancang struktur` → `Membuat database` → `Merakit UI` → `Menyiapkan preview` |
| Component | Steps (shadcn) + Progress + Spinner |
| Step done | CheckmarkFilled Teal `#1aae39` |
| Step active | Primary `#0075de` + pulse |
| Log | Mono 12px `inference.service.ts: infer "kasir" → domain=pos` (collapsible NCollapse) |

### ProjectCard — Card di Library

| Property | Value |
|----------|-------|
| Surface | Canvas `#ffffff` + radius lg `12px` + hairline + Level-0 (hover Level-1) |
| Header | H3 20px/600 + slug Caption 12px Muted `pos-kasir` + status badge `<Badge>` (ready=success, generating=warning, failed=error) |
| Body | Small 13px Muted `Prompt: "buatkan aplikasi kasir"` + 2-line clamp |
| Footer | Entities count `4 entitas` + Pages `5 halaman` + Roles `Admin, Kasir` (Eyebrow) + actions: `Preview` primary ghost + `Refine` + `Hapus` danger |
| Empty | Empty (shadcn) + illustration sticker + `Belum ada aplikasi — coba "buatkan aplikasi kasir"` + CTA |

### Template Gallery — Starter Templates

Grid 3-col (desktop) / 1-col (mobile) — tiap template card:

| Property | Value |
|----------|-------|
| Card | Same as ProjectCard + icon tile 40px Sky/Purple/Orange + title H3 + description Small + entities Eyebrow |
| Action | `Gunakan Template` <Button> shadcn small secondary on hover |
| Click | Fill AiPromptBar dengan prompt template + auto-focus Generate |

### Refine Bar — Iterate Prompt Pendek

Di `/builder/:slug`:

| Property | Value |
|----------|-------|
| Container | Sticky bottom atau top of detail — Canvas `#ffffff` + hairline top + padding `12px 20px` |
| Input | <Input> shadcn small + placeholder `Tambahkan fitur... mis. tambahkan barcode scanner` + clearable |
| CTA | <Button> small primary pill `Perbarui` + `Refresh` icon |
| Hint | Caption `Perubahan tanpa menghapus data — patch aman` |

---

## Generated App — UI Rules (Wajib — Anti Jelek)

Setiap generated app **harus** mengikuti aturan ini (enforced di codegen template):

| Rule | Detail |
|------|--------|
| **PageShell wajib** | Tiap list page pakai `<PageShell title>` + breadcrumb + `actions` slot (Create <Button> pill primary) |
| **DataTable kanonis** | Jangan bikin table manual — re-use `DataTable.vue` dengan toolbar 320/160 + pagination ID + error/empty slot |
| **DetailDrawer wajib** | Pakai `NDrawer` + `.detail-view` pattern + footer actions `Edit`/`Hapus`; jangan NDescriptions |
| **FormModal wajib** | `<Dialog> (shadcn)` + `<Form> (react-hook-form + zodResolver)` dengan Zod errors + pill CTA `Simpan` primary + `Batal` secondary |
| **Dashboard** | Grid 2-col (Tailwind `grid grid-cols-2`) (stats) + Cards (shadcn `Card`) StatCard (icon tile Sky/Purple + value 24px/700 + label Eyebrow) + recent table mini |
| **Warna** | Hanya `#0075de` untuk primary; sticker Sky/Purple/Orange hanya untuk icon tile / category dot — **jangan** buat button pink/ungu |
| **Radius** | Card lg 12, modal xl 16, button pill, input xs 4 — konsisten |
| **Icon** | `lucide-react` via `h(lucide-react)` — mapping: Product=`Box`, Transaction=`Report`, Customer=`User`, Appointment=`Calendar` etc. |
| **Validation** | Tiap field punya `<Form> (react-hook-form + zodResolver)Item` dengan `rule` Zod message ID |
| **States** | Loading `Spinner`, Empty `Empty (shadcn)` + CTA `+ Buat Produk`, Error `Alert (shadcn)` + retry, Success `useMessage` `Berhasil` |
| **Responsive** | NGrid responsive + PageShell flex-wrap + table horizontal scroll di mobile |
| **RBAC** | Create/Edit/Delete buttons gated `v-if="hasPermission('Generated:{Slug}:Write')"` |

**Lint check**: jika generated page tidak import `PageShell` + `DataTable` → fail review.

---

## System Logs Design (Tetap)

Sama seperti sebelumnya — log levels TRACE-EMERGENCY, <Badge> mapping, table columns Timestamp/Level/Context/Message/Actions, detail drawer, VS Code URI.

---

## Layout Dimensions

### Sidebar

| Item | Value |
|------|-------|
| Width | 220px |
| Collapsed | 72px |
| Item Height | 36px |

### Navbar

| Item | Value |
|------|-------|
| Height | 52px |

### Builder Layout

| Item | Value |
|------|-------|
| AiPromptBar max-width | 720px centered |
| Library grid | 3-col desktop (gap 16px), 1-col mobile |
| ProjectCard height | auto, min 160px |

---

## Sidebar Navigation

### Menu Item Link Behavior

Leaf dirender `<a href>` + `preventDefault` + `router.push` — preserve right-click/Ctrl+click.

```typescript
label: () => h('a', { href: '/builder', onClick:e=>{e.preventDefault();router.push('/builder')} }, 'Buat Aplikasi')
```

### Group Builder (Baru)

```
Builder (NEW — highlight dengan Sparkles icon)
  ├── Buat Aplikasi        → /builder (AiPromptBar focus)
  └── Library              → /builder (scroll to list — anchor #library)
Generated Apps (dynamic — dari projects ready)
  ├── POS Kasir            → /generated/pos-kasir
  └── CRM Klinik           → /generated/crm-klinik
```

Generated group di-render dinamis dari `useAiBuilder().projectsReady` — icon per app dari inference (Box, Calendar, UserMultiple).

---

## Responsive

| Device | Width |
|--------|-------|
| Mobile | 320–639px |
| Tablet Portrait | 640–767px |
| Tablet Landscape | 768–1023px |
| Laptop | 1024–1279px |
| Desktop | 1280–1535px |
| Large | ≥1536px |

Builder: AiPromptBar full-width di mobile (padding 16px), library 1-col. Generated apps: PageShell → column di <768px, DataTable horizontal scroll.

---

## Icons (Next.js + React)

### Icon Library
- Library: `lucide-react` (tree-shakable SVG, 24x24 default)
- Usage: `import { Sparkles, ShoppingCart, Hospital, Plus, Trash2, Search, RotateCw } from 'lucide-react'` + `<Sparkles size={16} className="text-[#0075de]" />`
- No wrapper: langsung `<Icon size={16} />` atau `<Icon className="h-4 w-4" />` (Tailwind sizing) — **jangan** `h(lucide-react)`

### Builder Icons (Baru)

| Action | Icon | Mapping |
|--------|------|---------|
| Buat Aplikasi / Generate | `Sparkles` atau `Wand` (`lucide-react`) | AiPromptBar CTA |
| Inference domain POS | `ShoppingCart` atau `Store` | Domain badge |
| Inference domain CRM | `Customer` / `UserMultiple` | |
| Clinic | `Hospital` | |
| Todo | `Task` | |
| Generate progress | `Renew` (spin) | |
| ProjectCard Preview | `View` / `Launch` | |
| Refine | `Edit` | |

### Menu Icons — Builder

| Menu | Icon |
|------|------|
| Builder | `Wand` / `Sparkles` |
| Library | `Grid` |
| Generated Apps group | `Application` / `Apps` |
| POS Kasir (generated) | `ShoppingCart` |
| CRM Klinik | `Hospital` |

---

## Animations

### Library (Next.js)
- Primary: **Framer Motion 12** (`motion/react`) + CSS Transitions + Tailwind `transition` utilities
- Fallback: CSS `transition` untuk micro-interactions sederhana; Anime.js **dihapus** (Vue-only) → **Framer Motion** untuk PageTransitions

### Tokens

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| Fast | 150ms | ease-out | Hover, button |
| Normal | 250ms | ease-in-out | Page, card reveal |
| Slow | 350ms | ease-in-out | Modal/drawer |
| Bounce | 400ms | cubic-bezier(0.68,-0.55,0.265,1.55) | Emphasis |

### Builder Animations

| Element | Animation |
|---------|-----------|
| AiPromptBar mount | slideUp 250ms + fade |
| InferencePreview badges | stagger 50ms per badge |
| GenerationProgress steps | Steps (shadcn) transition + progress bar 300ms |
| ProjectCard mount | staggerFadeIn 250ms per card |
| Generated page mount | fadeInUp via usePageTransition |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## Implementation Notes (Next.js + shadcn/ui)

- **shadcn/ui** primitives (Radix UI) + **Tailwind CSS v4** utility-first. Tokens sebagai HSL CSS variables di `app/globals.css` — `components/ui/*` (Button, Input, Card, Dialog, Table, Sheet, Badge, etc.) adalah copy-paste shadcn, bukan dependency global. Theming via `:root { --primary: 210 100% 44%; }` (~ `#0075de`), border `hsl(var(--border))` (`#e6e6e6`), radius `12px/8px/4px` di `tailwind.config.ts` / `globals.css`.
- **Tailwind v4** sebagai pendekatan utama untuk styling component (utility inline di `className`, arbitrary values untuk token kanonis seperti `bg-[#f6f5f4]`, `border-[#e6e6e6]`, `text-[#0075de]` atau `bg-primary`). Hindari hard-coded color di luar token.
- **Generated code lint**: setiap `app/generated/[slug]/**/*.tsx` harus import `PageShell` (`@/components/layout/PageShell`) + `DataTable` (`@/components/common/DataTable`) — tidak boleh buat layout custom yang break token. Native `<table>` manual tanpa shadcn `Table` → fail review.
- **CTA pill**: `<Button className="rounded-full bg-[#0075de] hover:bg-[#0069c4]">` — generated FormModal primary button wajib pill (`rounded-full`). Jangan pakai `rounded-md` generik untuk CTA primer.
- **Input tight**: `<Input className="rounded-[4px]">` shadcn Input tetap tight 4px — jangan override jadi pill. Focus ring `ring-[#0075de]`.

---

## Authorization UI Patterns

### Access Denied — Single Floating Global (Next.js)

`components/common/AccessDeniedAlert.tsx` via React Portal (`createPortal` ke `document.body`) top 16 right 16 max 448, `Framer Motion` slideIn 300ms / slideOut 200ms, auto-dismiss 4s, event `rbac-denied` (dispatch di `hooks/useApi.ts` + `middleware.ts`) → satu `<Alert variant="destructive">` `[data-testid="access-denied"]` + `sonner` toast.

### Builder Guard

AiPromptBar CTA disabled + shadcn `<Tooltip>` `Anda tidak memiliki izin Builder:Generate` jika `!hasPermission('Builder:Generate')` (`hooks/useAuthorization.ts`).

---

## Chrome Patterns (Notion — diadaptasi, Next.js + shadcn/ui)

Badge Pill, Empty-State Card, Toast (sonner), Auth Card, Modal Card (`Dialog`), App-Shell Row — tetap sesuai § sebelumnya namun dengan shadcn primitives. Generated apps re-use sama:

- **StatCard** (dashboard generated) = `Card` shadcn + Canvas `#ffffff` + radius xl 16 + icon tile 32px Sky/Purple (`<div className="bg-[#62aef0] rounded-md p-2"> <Box size={20}/> </div>` lucide-react) + value 24px/700 + label Eyebrow Muted
- **Empty di generated list** = shadcn `Empty` + DataTable `empty` prop (`Belum ada data`) + CTA `<Button className="rounded-full">+ Buat {EntityLabel}</Button>` pill primary

---

## Do's and Don'ts — Untuk Generated Apps (Keras)

### Do
- Pakai Primary `#0075de` hanya untuk CTA primer, link, focus
- Halaman di Canvas Soft `#f6f5f4`; kartu & field putih
- Sticker palette hanya untuk ilustrasi / icon tile / dot
- Headline heavy + tracking negatif; body 400
- CTA primer pill; input tight 4px
- Permukaan = hairline + micro-shadow
- Generated dashboard = 1 hero band Deep Indigo opsional (sekali, bukan berulang)

### Don't
- Jangan cat CTA dengan warna sticker (pink/orange/ungu)
- Jangan tambah aksen struktural kedua selain primary
- Jangan radius pill pada input
- Jangan pakai heavy shadow
- Jangan set body copy heavy
- Jangan gelar halaman penuh putih klinis
- Jangan buat generated app tanpa PageShell + DataTable — **akan di-reject review**

---

## Change Log

### Stack Migration — Next.js + React (2026-09-15)

- **MIGRASI** dari Naive UI + `lucide-react` + Anime.js + Vue `<Transition>` → **shadcn/ui (Radix) + Tailwind v4 + lucide-react + Framer Motion** untuk Next.js 15 + React 19. Overview, Implementation Notes, Authorization UI (Portal + Alert + sonner), Chrome Patterns (Card/Dialog/Empty), Icons (lucide-react), Animations (Framer Motion) semua diupdate. Tokens tetap `#0075de`/`#f6f5f4`/`#e6e6e6`, radius 12/8/4/full, Inter. Generated lint tetap `PageShell` + `DataTable` wajib, namun kini import `@/components/layout/PageShell` + `@/components/common/DataTable` (shadcn Table) + `lucide-react`.

### AI App Builder — Platform Pivot (2026-09-15)

- **PIVOT** tambah § AI Builder — Component Specs (AiPromptBar, InferencePreview, GenerationProgress, ProjectCard, Template Gallery, Refine Bar) + § Generated App — UI Rules (PageShell/DataTable/DetailDrawer/FormModal/Dashboard wajib, warna/radius/icon/validation/states/responsive/RBAC) + Builder Layout + Builder Icons + Builder Animations. Sidebar Navigation tambah group Builder + Generated Apps dynamic. Do's and Don'ts tambah lint untuk generated. Semua generated UI **wajib** re-use token kanonis `#0075de`/`#f6f5f4`/`#e6e6e6` + PageShell/DataTable — enforce "No ugly app".
- **Dipertahankan**: Color Palette, Typography, Spacing, Radius, Elevation, Table kanonis, PageShell, Detail View, System Logs.

### Tailwind-First (2026-09-13)

- Intended direction Tailwind v4 — CURRENT campuran, migrasi bertahap.

### Adopsi Notion Design (2026-09-13)

- Token Notion blue `#0075de`, warm paper `#f6f5f4`, hairline `#e6e6e6`.

