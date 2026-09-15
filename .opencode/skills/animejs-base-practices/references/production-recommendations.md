# Production Recommendations

## Bundle Optimization

### 1. Tree Shaking

Gunakan ES Modules dan import hanya yang dibutuhkan:

```js
// Good - tree shakeable
import { animate, stagger } from 'animejs';

// Good - subpath import (lebih kecil)
import { animate } from 'animejs/animation';
import { stagger } from 'animejs/stagger';

// Bad - import semua
import * as anime from 'animejs';
```

### 2. Code Splitting

Pisahkan animasi ke chunk terpisah untuk non-critical animations:

```js
// Dynamic import untuk animasi yang tidak krusial
const loadHeavyAnimation = async () => {
  const { animate } = await import('animejs/animation');
  // ...
};
```

### 3. WAAPI Alternative

Untuk animasi sederhana, gunakan WAAPI yang lebih ringan (3KB vs 10KB):

```js
import { waapi } from 'animejs';
waapi.animate('.box', { translateX: 100 });
```

## Runtime Performance

### 1. Gunakan will-change Sparingly

```css
/* Hanya untuk animasi aktif */
.animated {
  will-change: transform, opacity;
}
```

### 2. Batch DOM Reads/Writes

```js
// Good - minimal reflow
const elements = document.querySelectorAll('.item');
animate(elements, { translateX: 100 });
```

### 3. Debounce Resize-triggered Animations

```ts
const handleResize = debounce(() => {
  // Re-trigger animations if needed
}, 250);
```

### 4. Use requestAnimationFrame Properly

Anime.js sudah menggunakan rAF, tapi pastikan tidak ada blocking code:

```js
animate('.box', {
  translateX: 100,
  onUpdate: (self) => {
    // Hindari operasi berat di sini
    // Gunakan throttling jika perlu
  },
});
```

## Monitoring

### 1. Gunakan Performance Metrics

```js
const animation = animate('.box', {
  translateX: 100,
  onBegin: () => performance.mark('anime-begin'),
  onComplete: () => {
    performance.mark('anime-end');
    performance.measure('anime-duration', 'anime-begin', 'anime-end');
  },
});
```

### 2. Track Animation Count

```ts
let activeAnimations = 0;

const animation = animate('.box', {
  translateX: 100,
  onBegin: () => activeAnimations++,
  onComplete: () => activeAnimations--,
});

// Monitor
console.log('Active animations:', activeAnimations);
```

## Browser Compatibility

### 1. Feature Detection

```ts
const supportsWAAPI = 'animate' in document.body;

if (supportsWAAPI) {
  // Use WAAPI version
} else {
  // Fallback
}
```

### 2. Graceful Degradation

```ts
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // Skip animation or use instant transitions
  element.style.opacity = '1';
} else {
  animate(element, { opacity: [0, 1] });
}
```

## Nuxt Production Tips

### 1. Dynamic Import for Heavy Animations

```ts
// Only load when needed
const animateScroll = async () => {
  const { animate, stagger } = await import('animejs');
  // ...
};
```

### 2. SSR Safety

```ts
// Always client-side
if (import.meta.client) {
  // Anime.js code
}
```

### 3. Bundle Analyzer

```bash
# Check what's included
npx nuxi analyze
```

## Common Pitfalls

1. **Memory leaks** - Always cleanup animations
2. **Layout thrashing** - Batch DOM operations
3. **Over-animation** - Less is more
4. **Ignoring reduced motion** - Accessibility first
5. **Large bundle** - Use tree shaking and subpath imports
6. **SSR issues** - Client-only plugins

## Checklist

- [ ] Tree shaking enabled
- [ ] Subpath imports used where possible
- [ ] WAAPI considered for simple animations
- [ ] Cleanup on unmount
- [ ] Reduced motion respected
- [ ] Performance metrics monitored
- [ ] Bundle size checked
- [ ] No SSR issues
