---
name: tailwind-base-practices
description: >
  Tailwind CSS v4 best practices, utility patterns, theming, responsive design, dark mode, custom styles, and Vue 3 + Vite integration. Covers CSS-first configuration with @theme, @custom-variant, @utility directives.
---

# Tailwind CSS v4 Best Practices

Tailwind CSS utility-first framework with CSS-first configuration (v4).

## When to Use

- **UI styling** — any Vue/Nuxt project using Tailwind
- **Responsive design** — mobile-first layouts
- **Dark mode** — class-based dark/light theming
- **Custom utilities** — new utility classes via `@utility`
- **Theme variables** — consistent colors, spacing, typography

## Installation

```bash
# Vite
npm install tailwindcss @tailwindcss/vite

# Nuxt
npm install -D @nuxtjs/tailwindcss
```

## CSS Entry Point

```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}
```

## Core Patterns

### Responsive Design (Mobile-First)
```html
<div class="w-full md:w-1/2 lg:w-1/3">...</div>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">...</div>
```

### Dark Mode (Class-Based)
```css
@variant dark (&:where(.dark, .dark *));
```
```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  ...
</div>
```

### Theme Variables
```css
@theme {
  --color-brand-50: #eff6ff;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
}
```
```html
<div class="bg-brand-500 text-brand-600">...</div>
```

### Custom Utilities
```css
@utility scrollbar-hide {
  scrollbar-width: none;
}
@utility scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

### Custom Variants
```css
@variant dark (&:where(.dark, .dark *));
@variant hover (&:hover);
@variant group-hover (&:is(.group:hover *));
```

## Key Anti-Patterns

| Anti-Pattern | Better |
|-------------|--------|
| Over-using `@apply` | Inline utilities |
| Using `tailwind.config.js` | `@theme` directive |
| Including preflight with Naive UI | No preflight |
| Hardcoding colors | Theme variables |
| Using `!important` | Proper specificity |

## v4 Key Changes

- No more `tailwind.config.js` — CSS-first `@theme`
- No preflight by default (Naive UI compatible)
- `@import "tailwindcss"` replaces `@tailwind base/components/utilities`
- Container is a built-in utility
- Gradient syntax: `bg-linear-to-r` (not `bg-gradient-to-r`)

## References

```bash
# Read skill reference files
ls .opencode/skills/tailwind-base-practices/references/
```

Key references:
- `installation.md` — Setup with Vite, Nuxt, CDN
- `utility-classes.md` — Common utility patterns
- `responsive-design.md` — Breakpoints, mobile-first
- `dark-mode.md` — Class-based dark mode
- `theme.md` — v4 `@theme` configuration
- `colors.md` — Color palette, opacity, custom colors
- `custom-styles.md` — `@apply`, `@utility`, `@variant`, `@layer`
- `nuxt-integration.md` — Nuxt + Tailwind + Naive UI setup
- `best-practices.md` — 12 best practices
- `anti-patterns.md` — 12 anti-patterns to avoid
- `official-docs.md` — Links to official documentation

## Complete Examples

### Card Component
```html
<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
            rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Title</h3>
  <p class="text-gray-600 dark:text-gray-300 text-sm mt-2">Description</p>
  <div class="flex gap-2 mt-4">
    <button class="bg-primary text-primary-foreground px-4 py-2 rounded-lg 
                   hover:bg-primary-hover transition-colors">
      Action
    </button>
    <button class="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg 
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      Cancel
    </button>
  </div>
</div>
```

### Responsive Layout
```html
<div class="min-h-screen flex flex-col">
  <header class="h-16 border-b border-gray-200 dark:border-gray-700 
                 flex items-center justify-between px-4 md:px-8">
    <span class="text-lg font-semibold">Logo</span>
    <nav class="hidden md:flex gap-4">
      <a class="text-gray-600 dark:text-gray-300 hover:text-gray-900 
                dark:hover:text-white">Link</a>
    </nav>
  </header>
  
  <div class="flex-1 flex">
    <aside class="w-64 border-r border-gray-200 dark:border-gray-700 
                  hidden lg:block p-4">
      Sidebar
    </aside>
    <main class="flex-1 p-4 md:p-8">Content</main>
  </div>
</div>
```

### Form Input
```html
<input 
  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
         rounded-lg bg-white dark:bg-gray-800 
         text-gray-900 dark:text-white 
         placeholder-gray-400 dark:placeholder-gray-500
         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
         transition-colors"
  placeholder="Enter text..."
/>
```
