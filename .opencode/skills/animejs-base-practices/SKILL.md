---
name: animejs-base-practices
description: Best practices untuk menggunakan Anime.js animation engine pada project Nuxt 3 + Vue 3. Mencakup installation, animation, timeline, easings, utilities, dan production recommendations.
metadata:
  author: opencompany
  version: "1.0"
  category: animation
---

# Anime.js Best Practices (Nuxt)

## Kapan Skill Ini Digunakan

- Saat menambahkan animasi menggunakan anime.js
- Saat mengintegrasikan anime.js dengan Nuxt
- Saat membuat custom animations
- Saat menggunakan stagger, timeline, atau keyframes
- Saat mengoptimasi performa animasi

## Kapan TIDAK Digunakan

- Untuk animasi CSS murni (tanpa JS)
- Untuk transisi halaman Nuxt built-in
- Untuk animasi yang bisa diimplementasikan dengan CSS transitions

## Workflow

1. **Install** animejs via npm
2. **Buat plugin** client-only di `plugins/animejs.client.ts`
3. **Import** hanya fungsi yang dibutuhkan
4. **Buat animasi** menggunakan `animate()` atau `waapi.animate()`
5. **Cleanup** animasi saat component unmount
6. **Respect** `prefers-reduced-motion`

## Aturan Implementasi

### 1. Installation & Setup

```bash
npm install animejs
```

```ts
// plugins/animejs.client.ts
import * as anime from 'animejs';

export default defineNuxtPlugin(() => ({
  provide: { anime },
}));
```

### 2. Penggunaan di Komponen

```vue
<script setup>
const { $anime } = useNuxtApp();
const box = ref(null);

onMounted(() => {
  $anime.animate(box.value, {
    translateX: 100,
    duration: 800,
    ease: 'outExpo',
  });
});
</script>

<template>
  <div ref="box">Animated content</div>
</template>
```

### 3. Import Selektif

```js
// Good - tree shakeable
import { animate, stagger } from 'animejs';

// Good - subpath import
import { animate } from 'animejs/animation';
import { stagger } from 'animejs/stagger';

// Good - WAAPI alternative (3KB)
import { waapi } from 'animejs';
```

## Checklist Sebelum Implementasi

- [ ] Apakah animasi ini benar-benar perlu?
- [ ] Bisa diimplementasikan dengan CSS saja?
- [ ] Sudah install animejs?
- [ ] Sudah buat client-only plugin?
- [ ] Menggunakan template refs untuk target?
- [ ] Sudah pertimbangkan `waapi.animate()` untuk animasi sederhana?
- [ ] Sudah hormati `prefers-reduced-motion`?

## Checklist Sesudah Implementasi

- [ ] Cleanup animasi di `onUnmounted()`
- [ ] Tidak ada memory leak
- [ ] Animasi menggunakan transform/opacity (GPU accelerated)
- [ ] Tidak ada layout thrashing
- [ ] Bundle size tidak membengkak
- [ ] Tested dengan reduced motion preference

## Best Practices

### Performance
- **Gunakan transform dan opacity** untuk GPU acceleration
- **Batch animations** untuk multiple elements
- **Gunakan `stagger()`** untuk delay bertahap
- **Pertimbangkan `waapi.animate()`** untuk animasi sederhana (3KB vs 10KB)
- **Hindari animating layout properties** (width, margin, padding)

### Code Quality
- **Gunakan template refs** untuk target DOM
- **Pisahkan config animasi** ke constants/composables
- **Buat reusable composables** untuk pattern yang sering digunakan
- **Cleanup semua animasi** saat unmount
- **Error handling** - cek target existence

### Accessibility
- **Hormati `prefers-reduced-motion`** - skip atau gunakan duration 0
- **Hindari infinite loops** tanpa pause control
- **Gunakan reduced duration** untuk accessibility

### Nuxt Specific
- **Client-only plugins** untuk semua DOM manipulations
- **Dynamic imports** untuk animasi yang tidak krusial
- **Template refs** lebih baik dari querySelector
- **Watch** untuk trigger animasi dari reactive state

## Conventions

### File Naming
- Plugin: `plugins/animejs.client.ts`
- Composables: `composables/use[AnimationName].ts`
- Config: `config/animations.ts`

### Component Structure
```vue
<script setup>
// 1. Refs
const element = ref(null);
const animation = ref(null);

// 2. Animation function
function startAnimation() {
  animation.value = animate(element.value, {
    translateX: 100,
  });
}

// 3. Lifecycle
onMounted(() => startAnimation());
onUnmounted(() => animation.value?.cancel());
</script>
```

### Animation Config
```ts
// config/animations.ts
export const fadeIn = {
  opacity: [0, 1],
  translateY: [20, 0],
  duration: 600,
  ease: 'outExpo',
};

export const slideIn = {
  translateX: ['-100%', '0%'],
  duration: 800,
  ease: 'outCubic',
};
```

## Anti-Patterns

- ❌ Animating layout properties (width, height, margin, padding)
- ❌ Tidak cleanup animasi saat unmount
- ❌ Hardcoded magic numbers
- ❌ Ignoring prefers-reduced-motion
- ❌ Infinite loops tanpa pause control
- ❌ Import seluruh library
- ❌ Menggunakan anime.js di server-side
- ❌ Over-animating (too many properties)
- ❌ Tidak menggunakan template refs
- ❌ QuerySelector setelah render

## Referensi

- [Installation](references/installation.md) - Cara install dan setup
- [Concepts](references/concepts.md) - Core concepts anime.js
- [Easings](references/easings.md) - Easing functions
- [Common Patterns](references/common-patterns.md) - Pola animasi umum
- [Best Practices](references/best-practices.md) - Best practices lengkap
- [Production](references/production-recommendations.md) - Rekomendasi production
- [Anti-Patterns](references/anti-patterns.md) - Yang harus dihindari
- [FAQ](references/faq.md) - Pertanyaan umum

## AI Instructions

Saat menggunakan skill ini:

1. **Selalu gunakan** client-only plugins untuk anime.js di Nuxt
2. **Selalu import** hanya fungsi yang dibutuhkan
3. **Selalu cleanup** animasi saat unmount
4. **Selalu hormati** prefers-reduced-motion
5. **Prioritaskan** transform dan opacity untuk performance
6. **Gunakan** template refs untuk target DOM
7. **Buat** reusable composables untuk animasi yang sering digunakan
8. **Hindari** animating layout properties kecuali benar-benar diperlukan
9. **Pertimbangkan** waapi.animate() untuk animasi sederhana
10. **Ikuti** conventions dan patterns yang sudah ada di codebase
