# Common Patterns

## 1. Fade In on Mount

```vue
<script setup>
const element = ref(null);

onMounted(() => {
  animate(element.value, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 600,
    ease: 'outExpo',
  });
});
</script>

<template>
  <div ref="element">Content</div>
</template>
```

## 2. Staggered List Entrance

```vue
<script setup>
const items = ref(['Item 1', 'Item 2', 'Item 3', 'Item 4']);

onMounted(() => {
  animate('.list-item', {
    opacity: [0, 1],
    translateX: [-30, 0],
    delay: stagger(80),
    ease: 'outExpo',
  });
});
</script>

<template>
  <ul>
    <li v-for="(item, i) in items" :key="i" class="list-item">
      {{ item }}
    </li>
  </ul>
</template>
```

## 3. Hover Effects

```vue
<script setup>
const box = ref(null);

function handleEnter() {
  animate(box.value, {
    scale: 1.1,
    duration: 300,
    ease: 'outExpo',
  });
}

function handleLeave() {
  animate(box.value, {
    scale: 1,
    duration: 300,
    ease: 'outExpo',
  });
}
</script>

<template>
  <div
    ref="box"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
  >
    Hover me
  </div>
</template>
```

## 4. Scroll-triggered Animation

```vue
<script setup>
const element = ref(null);
let hasAnimated = false;

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        animate(element.value, {
          opacity: [0, 1],
          translateY: [50, 0],
          duration: 800,
          ease: 'outExpo',
        });
      }
    });
  }, { threshold: 0.1 });

  observer.observe(element.value);
});
</script>

<template>
  <div ref="element">Scroll into view</div>
</template>
```

## 5. Loading Spinner

```vue
<script setup>
onMounted(() => {
  animate('.spinner', {
    rotate: '1turn',
    loop: true,
    ease: 'linear',
    duration: 1000,
  });
});
</script>

<template>
  <div class="spinner" />
</template>
```

## 6. Page Transition

```vue
<script setup>
const page = ref(null);

function animateIn() {
  animate(page.value, {
    opacity: [0, 1],
    translateX: [50, 0],
    duration: 500,
    ease: 'outCubic',
  });
}

function animateOut() {
  return animate(page.value, {
    opacity: [1, 0],
    translateX: [0, -50],
    duration: 500,
    ease: 'inCubic',
  }).finished;
}

definePageMeta({
  async onBeforeEnter() {
    await animateOut();
  },
  onEnter() {
    animateIn();
  },
});
</script>
```

## 7. Number Counter

```vue
<script setup>
const count = ref(0);
const target = 100;

onMounted(() => {
  const obj = { value: 0 };
  animate(obj, {
    value: target,
    duration: 2000,
    ease: 'outExpo',
    onUpdate: () => {
      count.value = Math.round(obj.value);
    },
  });
});
</script>

<template>
  <div>{{ count }}</div>
</template>
```

## 8. Modal Animation

```vue
<script setup>
const props = defineProps({ show: Boolean });
const modal = ref(null);

watch(() => props.show, (visible) => {
  if (visible) {
    animate(modal.value, {
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 300,
      ease: 'outExpo',
    });
  } else {
    animate(modal.value, {
      opacity: [1, 0],
      scale: [1, 0.9],
      duration: 200,
      ease: 'inExpo',
    });
  }
});
</script>

<template>
  <div v-if="show" ref="modal" class="modal">
    Modal content
  </div>
</template>
```

## 9. Drag Animation

```vue
<script setup>
import { Draggable } from 'animejs';

const element = ref(null);

onMounted(() => {
  new Draggable(element.value, {
    x: { snap: 50 },
    y: { snap: 50 },
  });
});
</script>

<template>
  <div ref="element" style="cursor: grab;">
    Drag me
  </div>
</template>
```

## 10. Timeline Sequence

```vue
<script setup>
const box1 = ref(null);
const box2 = ref(null);
const box3 = ref(null);

onMounted(() => {
  const tl = timeline();

  tl.add(animate(box1.value, { translateX: 100 }), 0)
    .add(animate(box2.value, { translateX: 100 }), 200)
    .add(animate(box3.value, { translateX: 100 }), 400);
});
</script>

<template>
  <div ref="box1">Step 1</div>
  <div ref="box2">Step 2</div>
  <div ref="box3">Step 3</div>
</template>
```

## 11. Text Reveal

```vue
<script setup>
const text = ref(null);

onMounted(() => {
  const { chars } = splitText(text.value, { chars: true });

  animate(chars, {
    opacity: [0, 1],
    translateY: [20, 0],
    delay: stagger(30),
    ease: 'outExpo',
  });
});
</script>

<template>
  <h2 ref="text">Hello World</h2>
</template>
```

## 12. Parallax Scroll

```vue
<script setup>
const element = ref(null);

onMounted(() => {
  const { onScroll } = window.__animeEvents;

  onScroll({
    target: element.value,
    container: window,
    onEnter: ({ progress }) => {
      animate(element.value, {
        translateY: `${-50 * progress}%`,
        duration: 0,
      });
    },
  });
});
</script>

<template>
  <div ref="element">Parallax content</div>
</template>
```

## Best Practices

1. **Composable**: Extract reusable patterns into composables
2. **Config objects**: Define animation configs separately
3. **Cleanup**: Always cleanup animations
4. **Accessibility**: Respect prefers-reduced-motion
5. **Performance**: Use transforms and opacity when possible
