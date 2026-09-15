# Tailwind CSS v4 - Installation

## Vite (Recommended for Vue/Nuxt)

```bash
npm install tailwindcss @tailwindcss/vite
```

### vite.config.ts
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

### CSS entry point
```css
@import "tailwindcss";
```

## Nuxt Module

```bash
npm install -D @nuxtjs/tailwindcss
```

### nuxt.config.ts
```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
})
```

## CDN (Play CDN)
```html
<script src="https://cdn.tailwindcss.com"></script>
```

## Key Changes in v4
- No more `tailwind.config.js` — configuration is CSS-first
- No more `@tailwind base/components/utilities` — single `@import "tailwindcss"` replaces them
- No preflight by default (better compatibility with component libraries like Naive UI)
- Theme customization via `@theme` directive in CSS
