# Core Concepts

## Arsitektur Anime.js v4

Anime.js v4 terdiri dari beberapa komponen inti:

```
animejs
├── animate()      - Fungsi utama untuk animasi
├── timer()        - Timer tanpa target visual
├── timeline()     - Urutan animasi
├── Animatable     - Interface untuk properti yang bisa dianimasikan
├── Draggable      - Drag and drop dengan physics
├── Layout         - Layout animation system
├── Scope          - Scoped animation context
├── Events         - Scroll dan event observers
├── SVG            - SVG animation utilities
├── Text           - Text splitting dan scrambling
├── Utilities      - Helper functions (stagger, math, dll)
├── Easings        - Easing functions
├── waapi          - Web Animation API wrapper
└── Engine         - Animation engine control
```

## 1. animate() - Fungsi Utama

Fungsi utama untuk membuat animasi pada target.

```js
import { animate } from 'animejs';

const animation = animate(targets, parameters);
```

### Parameters

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| targets | String/Object/Array | Element atau objek yang akan dianimasikan |
| parameters | Object | Konfigurasi animasi |

### Return Value

Mengembalikan objek `JSAnimation` dengan methods dan properties.

## 2. Timer

Timer berfungsi seperti animasi tanpa target visual. Berguna untuk delay, sequences, atau logic berbasis waktu.

```js
import { timer } from 'animejs';

const t = timer({
  duration: 1000,
  onUpdate: (self) => console.log(self.progress),
  onComplete: () => console.log('selesai'),
});
```

## 3. Timeline

Timeline memungkinkan pengurutan beberapa animasi dengan kontrol yang lebih baik.

```js
import { timeline } from 'animejs';

const tl = timeline();

tl.add(animate('.box', { translateX: 100 }), 0)
  .add(animate('.circle', { scale: 2 }), 500);
```

## 4. Targets

Target adalah elemen atau objek yang akan dianimasikan.

### CSS Selector

```js
animate('.className', { translateX: 100 });
animate('#id', { opacity: 0.5 });
animate('div > p', { scale: 1.2 });
```

### DOM Elements

```js
const el = document.querySelector('.box');
animate(el, { translateX: 100 });
```

### Array of Targets

```js
animate(['.box1', '.box2', document.getElementById('box3')], {
  translateX: 100,
});
```

### JavaScript Objects

```js
const obj = { value: 0 };
animate(obj, {
  value: 100,
  onUpdate: (self) => console.log(obj.value),
});
```

## 5. Animatable Properties

### CSS Properties

```js
animate('.box', {
  backgroundColor: '#ff0000',
  opacity: 0.5,
  width: '100px',
});
```

### CSS Transforms

```js
animate('.box', {
  translateX: 100,      // pixel
  translateY: 50,
  scale: 1.5,
  rotate: '1turn',
  skewX: 15,
});
```

### CSS Variables

```js
animate('.box', {
  '--my-color': '#00ff00',
  '--my-size': '2rem',
});
```

### JavaScript Object Properties

```js
const myObj = { x: 0, y: 0, color: 0 };
animate(myObj, {
  x: 100,
  y: 200,
  color: 360,
});
```

### HTML Attributes

```js
animate('img', {
  src: 'new-image.jpg',
}, { duration: 0 });
```

### SVG Attributes

```js
animate('circle', {
  cx: 200,
  r: 50,
  strokeDashoffset: [251.2, 0],
});
```

## 6. Tween Value Types

### Numerical

```js
animate('.box', { translateX: 100 });
```

### Relative Values

```js
animate('.box', {
  translateX: '+50',   // tambah 50
  scale: '-=0.1',     // kurang 0.1
});
```

### Color Values

```js
animate('.box', {
  backgroundColor: '#ff0000',
  borderColor: 'rgb(0, 255, 0)',
  color: 'rgba(0, 0, 255, 0.5)',
});
```

### Function Based Values

```js
animate('.box', {
  translateX: (el, i) => i * 50,
  rotate: () => Math.random() * 360,
});
```

## 7. Tween Parameters

```js
animate('.box', {
  translateX: {
    to: 250,           // Target value
    from: 0,           // Start value
    delay: 100,        // Delay sebelum mulai
    duration: 800,     // Durasi animasi
    ease: 'outExpo',   // Easing function
  },
});
```

## 8. Keyframes

### Tween Values Keyframes

```js
animate('.box', {
  translateX: [
    { to: 250, ease: 'outExpo' },
    { to: 0, ease: 'outBounce' },
  ],
});
```

### Duration Based Keyframes

```js
animate('.box', {
  translateX: [0, 250, 0],
  duration: 2000,
});
```

## 9. Playback Settings

```js
animate('.box', {
  translateX: 100,
  duration: 800,       // Durasi default: 1000ms
  delay: 200,          // Delay sebelum mulai
  loop: true,          // Ulangi animasi
  loopDelay: 100,      // Delay antar loop
  alternate: true,     // Bolak-balik
  reversed: false,     // Mulai dari akhir
  autoplay: true,      // Auto-play saat dibuat
  playbackRate: 1,     // Kecepatan playback
});
```

## 10. Callbacks

```js
animate('.box', {
  translateX: 100,
  onBegin: () => console.log('Animasi dimulai'),
  onUpdate: () => console.log('Animasi diupdate'),
  onComplete: () => console.log('Animasi selesai'),
  onLoop: () => console.log('Loop baru'),
  onPause: () => console.log('Animasi dijeda'),
  then: () => console.log('Promise resolved'),
});
```

## 11. Animation Methods

```js
const animation = animate('.box', { translateX: 100 });

animation.play();       // Mulai/jalankan
animation.pause();      // Jeda
animation.restart();    // Mulai ulang
animation.reverse();    // Balik arah
animation.cancel();     // Batalkan
animation.complete();   // Langsung ke akhir
animation.seek(0.5);    // Posisi 50%
animation.stretch(2);   // 2x lebih lama
```

## 12. Stagger Utility

Untuk memberikan delay atau nilai berbeda ke multiple targets.

```js
import { stagger } from 'animejs';

animate('.item', {
  translateX: 100,
  delay: stagger(50),           // Delay 50ms bertambah
  scale: stagger(0.1, { from: 'center' }),
  opacity: stagger({ from: 0, to: 1 }),
});
```

### Stagger Parameters

- `start`: Nilai awal
- `from`: Posisi awal ('first', 'last', 'center', index, atau array)
- `reversed`: Balik urutan
- `ease`: Easing function
- `grid`: Grid layout [rows, cols]
- `axis': 'x' atau 'y' untuk grid
- `modifier`: Fungsi untuk memodifikasi nilai
- `total`: Total nilai untuk distribusi

## Best Practices untuk Nuxt

1. **Import selektif**: Hanya import yang dibutuhkan
2. **Client-only**: Gunakan `onMounted()` atau plugin client-only
3. **Cleanup**: Selalu cancel/revert animasi saat unmount
4. **Template refs**: Gunakan untuk target DOM langsung
5. **Composable**: Buat composable untuk animasi yang sering digunakan
6. **Reactivity**: Gunakan `watch()` untuk trigger animasi berdasarkan reactive state

```vue
<script setup>
const box = ref(null);

onMounted(() => {
  const anim = animate(box.value, {
    translateX: 100,
    duration: 800,
  });

  onUnmounted(() => anim.cancel());
});
</script>
```
