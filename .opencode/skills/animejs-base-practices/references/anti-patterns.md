# Anti-Patterns

## Performance Anti-Patterns

### 1. Animating Layout Properties

```js
// BAD - Triggers layout/paint
animate('.box', {
  width: '200px',
  height: '100px',
  margin: '20px',
  padding: '10px',
});

// GOOD - GPU accelerated
animate('.box', {
  translateX: 100,
  scale: 1.2,
  opacity: 0.5,
});
```

### 2. Multiple Individual Animations

```js
// BAD - Multiple reflows
for (let i = 0; i < items.length; i++) {
  animate(items[i], { translateX: 100, delay: i * 50 });
}

// GOOD - Single batch
animate('.item', {
  translateX: 100,
  delay: stagger(50),
});
```

### 3. Over-animating

```js
// BAD - Too many properties
animate('.box', {
  translateX: 100,
  rotate: '1turn',
  scale: 1.5,
  skewX: 15,
  opacity: 0.5,
  backgroundColor: '#ff0000',
});

// GOOD - Minimal, purposeful
animate('.box', {
  translateX: 100,
  opacity: [0, 1],
});
```

### 4. Ignoring will-change

```css
/* BAD - No will-change */
.box { }

/* GOOD - Will-change for active animation */
.box.animating {
  will-change: transform, opacity;
}
```

## Code Quality Anti-Patterns

### 1. No Cleanup

```vue
<!-- BAD - Memory leak -->
<script setup>
onMounted(() => {
  animate('.box', { translateX: 100, loop: true });
});
</script>

<!-- GOOD - Proper cleanup -->
<script setup>
const animation = ref(null);

onMounted(() => {
  animation.value = animate('.box', { translateX: 100, loop: true });
});

onUnmounted(() => {
  animation.value?.cancel();
});
</script>
```

### 2. Hardcoded Values

```js
// BAD - Magic numbers
animate('.box', {
  translateX: 237,
  duration: 847,
  delay: 123,
});

// GOOD - Named constants
const SLIDE_DISTANCE = 250;
const ANIMATION_DURATION = 800;
const STAGGER_DELAY = 50;

animate('.box', {
  translateX: SLIDE_DISTANCE,
  duration: ANIMATION_DURATION,
  delay: STAGGER_DELAY,
});
```

### 3. No Error Handling

```js
// BAD - No target validation
animate('.nonexistent', { translateX: 100 });

// GOOD - Validate or use optional chaining
const elements = document.querySelectorAll('.box');
if (elements.length > 0) {
  animate(elements, { translateX: 100 });
}
```

### 4. Blocking Animations

```js
// BAD - Heavy computation in onUpdate
animate('.box', {
  translateX: 100,
  onUpdate: () => {
    // Heavy DOM manipulation
    expensiveRecalculation();
  },
});

// GOOD - Throttled updates
let lastUpdate = 0;
animate('.box', {
  translateX: 100,
  onUpdate: () => {
    const now = Date.now();
    if (now - lastUpdate > 16) { // ~60fps
      lastUpdate = now;
      expensiveRecalculation();
    }
  },
});
```

## Accessibility Anti-Patterns

### 1. Ignoring prefers-reduced-motion

```js
// BAD - No motion preference check
animate('.box', { translateX: 100, loop: true });

// GOOD - Respect user preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  animate('.box', { translateX: 100, loop: true });
}
```

### 2. Infinite Loops Without Pause

```js
// BAD - No pause control
animate('.box', {
  rotate: '1turn',
  loop: true,
});

// GOOD - Add pause/play control
const animation = animate('.box', {
  rotate: '1turn',
  loop: true,
  autoplay: false, // Manual control
});

// Let user control
button.addEventListener('click', () => animation.play());
```

### 3. No Reduced Duration Option

```js
// BAD - Fixed duration
animate('.box', { translateX: 100, duration: 2000 });

// GOOD - Context-aware duration
const baseDuration = prefersReducedMotion ? 0 : 2000;
animate('.box', { translateX: 100, duration: baseDuration });
```

## Nuxt Anti-Patterns

### 1. Server-Side Rendering

```js
// BAD - SSR breakage
onMounted(() => {
  const { animate } = require('animejs'); // CommonJS in client
  animate('.box', { translateX: 100 });
});

// GOOD - Client-only plugin
// plugins/animejs.client.ts
import * as anime from 'animejs';
export default defineNuxtPlugin(() => ({ provide: { anime } }));

// Component
const { $anime } = useNuxtApp();
onMounted(() => {
  $anime.animate('.box', { translateX: 100 });
});
```

### 2. Not Using Template Refs

```js
// BAD - Query after render
onMounted(() => {
  const box = document.querySelector('.box');
  animate(box, { translateX: 100 });
});

// GOOD - Template ref
const box = ref(null);
onMounted(() => {
  if (box.value) {
    animate(box.value, { translateX: 100 });
  }
});
```

## Summary

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Layout animation | Performance | Use transforms/opacity |
| No cleanup | Memory leak | Cancel on unmount |
| Hardcoded values | Maintainability | Use constants |
| Ignoring reduced motion | Accessibility | Check media query |
| Infinite loops | UX/Performance | Add controls |
| SSR code | Breakage | Client-only plugins |
| Heavy onUpdate | Frame drops | Throttle |
