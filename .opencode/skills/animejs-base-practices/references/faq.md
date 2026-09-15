# FAQ

## Apakah Anime.js kompatibel dengan Nuxt?

Ya. Gunakan plugin client-only untuk menghindari SSR issues.

```ts
// plugins/animejs.client.ts
import * as anime from 'animejs';
export default defineNuxtPlugin(() => ({ provide: { anime } }));
```

## Bagaimana cara menghentikan animasi?

Gunakan method `cancel()` atau `revert()`:

```js
const anim = animate('.box', { translateX: 100 });
anim.cancel();   // Hentikan dan reset ke nilai awal
anim.revert();   // Hentikan dan kembali ke nilai sebelum animasi
anim.pause();    // Jeda di posisi saat ini
```

## Bagaimana cara cleanup animasi?

Selalu cleanup saat component unmount:

```vue
<script setup>
const anim = ref(null);

onMounted(() => {
  anim.value = animate('.box', { translateX: 100, loop: true });
});

onUnmounted(() => {
  anim.value?.cancel();
});
</script>
```

## Apa bedanya `animate()` dan `waapi.animate()`?

| Fitur | `animate()` | `waapi.animate()` |
|-------|-------------|-------------------|
| Size | ~10KB | ~3KB |
| Keyframes | Ya | Terbatas |
| Timeline | Ya | Tidak |
| Callbacks | Lengkap | Dasar |
| CSS Variables | Ya | Tidak |
| Function values | Ya | Tidak |

Gunakan `waapi.animate()` untuk animasi sederhana yang tidak memerlukan fitur lengkap.

## Bagaimana cara menghormati prefers-reduced-motion?

```ts
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  animate('.box', { translateX: 100 });
} else {
  // Langsung set nilai akhir
  document.querySelector('.box').style.transform = 'translateX(100px)';
}
```

## Bagaimana cara menambahkan custom easing?

```js
// Cubic Bézier
animate('.box', {
  translateX: 100,
  ease: [0.25, 0.1, 0.25, 1.0],
});

// Spring
animate('.box', {
  translateX: 100,
  ease: 'spring(1, 80, 10, 0)',
});

// Function
animate('.box', {
  translateX: 100,
  ease: (t) => t * t,
});
```

## Bagaimana cara animasi multiple elements dengan delay bertahap?

```js
import { stagger } from 'animejs';

animate('.item', {
  translateX: 100,
  delay: stagger(50), // 50ms per item
});

// Dengan grid
animate('.item', {
  translateX: 100,
  delay: stagger(50, {
    grid: [3, 3], // 3x3 grid
    from: 'center',
  }),
});
```

## Bagaimana cara membuat sequence animation?

```js
import { timeline } from 'animejs';

const tl = timeline();

tl.add(animate('.box1', { translateX: 100 }), 0)
  .add(animate('.box2', { translateX: 100 }), 500)
  .add(animate('.box3', { translateX: 100 }), 1000);
```

## Bagaimana cara menangani error saat target tidak ada?

```js
const elements = document.querySelectorAll('.box');
if (elements.length > 0) {
  animate(elements, { translateX: 100 });
}
```

## Bagaimana cara membuat animasi yang bisa dipause/play?

```js
const anim = animate('.box', {
  translateX: 100,
  autoplay: false, // Jangan auto-play
});

// Control
anim.play();
anim.pause();
anim.restart();
```

## Performance Tips

1. Gunakan transform dan opacity untuk GPU acceleration
2. Gunakan `stagger()` untuk multiple elements
3. Pertimbangkan `waapi.animate()` untuk animasi sederhana
4. Batch animations untuk mengurangi reflow
5. Cleanup semua animasi saat unmount
