# Tailwind CSS v4 - Nuxt Integration

## Installation

```bash
npm install -D @nuxtjs/tailwindcss
```

## Basic Configuration

### nuxt.config.ts
```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  
  tailwindcss: {
    configPath: '~/tailwind.config.ts',
  },
})
```

## CSS-First Configuration (v4)

### assets/css/main.css
```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}
```

### nuxt.config.ts
```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  
  css: ['~/assets/css/main.css'],
})
```

## Dark Mode in Nuxt

### nuxt.config.ts
```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  
  tailwindcss: {
    config: {
      darkMode: 'class',
    },
  },
})
```

### Toggle in Component
```vue
<script setup>
const colorMode = useColorMode()

function toggleDark() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <button @click="toggleDark">Toggle Dark Mode</button>
</template>
```

## With Naive UI

### nuxt.config.ts
```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', 'naive-ui-nuxt'],
  
  css: ['~/assets/css/main.css'],
})
```

### assets/css/main.css
```css
@import "tailwindcss";

/* No preflight - good for Naive UI compatibility */
@theme {
  --color-primary: #18a058;
  --color-primary-hover: #36ad6a;
}
```

## Tailwind + UnoCSS

If using UnoCSS instead:
```bash
npm install -D @unocss/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@unocss/nuxt'],
})
```

## Best Practices for Nuxt + Tailwind v4

1. Use `@theme` for all custom values
2. Avoid `tailwind.config.js` — use CSS-first
3. Use `@utility` for custom utilities
4. Use `@variant` for custom variants
5. Keep dark mode via `class` strategy
6. Use Nuxt's `useColorMode()` for dark mode toggle
