# Best Practices

## Performance

### 1. Gunakan Transform dan Opacity

Prioritaskan properti yang di-hardware accelerated:

```js
// Good - GPU accelerated
animate('.box', {
  translateX: 100,
  opacity: 0.5,
  scale: 1.2,
});

// Avoid - Triggers layout/paint
animate('.box', {
  width: '200px',
  padding: '20px',
  margin: '10px',
});
```

### 2. Batch Animations

```js
// Good - Single reflow
animate(['.box1', '.box2', '.box3'], {
  translateX: 100,
});

// Avoid - Multiple reflows
boxes.forEach((box, i) => {
  animate(box, { translateX: 100, delay: i * 50 });
});
```

### 3. Gunakan Stagger untuk Multiple Elements

```js
// Efficient
animate('.item', {
  translateX: 100,
  delay: stagger(50),
});
```

### 4. WAAPI untuk Animasi Sederhana

```js
// Lighter (3KB) vs animate() (10KB)
import { waapi } from 'animejs';
waapi.animate('.box', { translateX: 100 });
```

## Code Organization

### 1. Buat Composable untuk Reusable Animations

```ts
// composables/useFadeIn.ts
export function useFadeIn() {
  const element = ref<HTMLElement | null>(null);
  let animation: Animation | null = null;

  onMounted(() => {
    if (element.value) {
      animation = animate(element.value, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        ease: 'outExpo',
      });
    }
  });

  onUnmounted(() => animation?.cancel());

  return { element };
}
```

### 2. Pisahkan Konfigurasi Animasi

```ts
// config/animations.ts
export const fadeInConfig = {
  opacity: [0, 1],
  translateY: [20, 0],
  duration: 600,
  ease: 'outExpo',
};

export const slideInConfig = {
  translateX: ['-100%', '0%'],
  duration: 800,
  ease: 'outCubic',
};
```

### 3. Gunakan Template Refs untuk Target

```vue
<template>
  <div ref="boxRef">Animated content</div>
</template>

<script setup>
const boxRef = ref<HTMLElement | null>(null);

onMounted(() => {
  animate(boxRef.value!, { translateX: 100 });
});
</script>
```

## Cleanup

### 1. Selalu Cancel Animation saat Unmount

```vue
<script setup>
const animation = ref<Animation | null>(null);

onMounted(() => {
  animation.value = animate('.box', { translateX: 100 });
});

onUnmounted(() => {
  animation.value?.cancel();
});
</script>
```

### 2. Gunakan Animation State untuk Cleanup

```vue
<script setup>
const isAnimating = ref(false);
const animation = ref<Animation | null>(null);

function startAnimation() {
  if (isAnimating.value) return;
  isAnimating.value = true;
  
  animation.value = animate('.box', {
    translateX: 100,
    onComplete: () => {
      isAnimating.value = false;
    },
  });
}

onUnmounted(() => {
  animation.value?.cancel();
});
</script>
```

## Accessibility

### 1. Hormati prefers-reduced-motion

```ts
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  animate('.box', { translateX: 100 });
}
```

### 2. Gunakan Reduced Duration

```ts
const duration = prefersReducedMotion ? 0 : 800;
animate('.box', { translateX: 100, duration });
```

### 3. Disable Loop untuk Accessibility

```ts
// Hindari loop tak terbatas untuk accessibility
animate('.box', {
  rotate: '1turn',
  loop: false, // atau batasi jumlah loop
});
```

## Nuxt Specific

### 1. Client-Only Plugin

```ts
// plugins/animejs.client.ts
import * as anime from 'animejs';

export default defineNuxtPlugin(() => ({
  provide: { anime },
}));
```

### 2. Gunakan onMounted

```vue
<script setup>
onMounted(() => {
  // Anime.js code here
});
</script>
```

### 3. Watch untuk Reactive Triggers

```vue
<script setup>
const isVisible = ref(false);

watch(isVisible, (visible) => {
  if (visible) {
    animate('.box', { opacity: [0, 1] });
  }
});
</script>
```

## Anti-Patterns

1. **Jangan animasi layout properties** kecuali memang diperlukan
2. **Jangan forget cleanup** - memory leak
3. **Jangan ignore reduced motion** - accessibility issue
4. **Jangan over-animasi** - Less is more
5. **Jangan hardcode values** - Gunakan variabel atau config
6. **Jangan animasi di SSR** - Selalu client-side
