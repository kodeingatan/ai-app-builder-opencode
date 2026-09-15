# Installation

## Overview

Anime.js v4 dapat dipasang melalui NPM, CDN, atau download langsung dari GitHub repository.

## NPM Installation

```bash
npm install animejs
```

### ES Modules (Recommended)

```js
import { animate } from 'animejs';
```

### CommonJS

```js
const { animate } = require('animejs');
```

## CDN

### ES Modules

```js
import { animate } from 'https://esm.sh/animejs';
// atau
import { animate } from 'https://cdn.jsdelivr.net/npm/animejs/+esm';
```

### UMD Global Object

```html
<script src="https://cdn.jsdelivr.net/npm/animejs/dist/bundles/anime.umd.min.js"></script>
<script>
  const { animate } = anime;
</script>
```

## Module Imports

Anime.js v4 mendukung subpath imports untuk tree-shaking yang lebih baik:

```js
import { animate } from 'animejs'; // Full library
import { animate } from 'animejs/animation'; // Animation module only
import { stagger } from 'animejs/stagger'; // Stagger utility only
import { waapi } from 'animejs/web-animation-api'; // WAAPI version only
```

## Integration dengan Nuxt

### 1. Install dependency

```bash
npm install animejs
```

### 2. Client-only plugin

Karena anime.js berinteraksi dengan DOM, buat plugin client-only:

```js
// plugins/animejs.client.ts
import * as anime from 'animejs';

export default defineNuxtPlugin(() => {
  return {
    provide: {
      anime,
    },
  };
});
```

### 3. Penggunaan di komponen

```vue
<script setup>
const { $anime } = useNuxtApp();
const animation = $anime.animate('.element', {
  translateX: 250,
  duration: 800,
});
</script>
```

## Best Practices

- Selalu gunakan ES Modules untuk mendapatkan tree-shaking
- Gunakan client-only plugin di Nuxt untuk menghindari SSR issues
- Import hanya fungsi yang dibutuhkan untuk mengurangi bundle size
- Untuk animasi sederhana, pertimbangkan `waapi.animate()` (3KB) sebagai alternatif `animate()` (10KB)

## Anti-Patterns

- Jangan import anime.js di server-side code
- Jangan menggunakan UMD bundle di project yang sudah memiliki bundler
- Jangan import seluruh library jika hanya menggunakan 1-2 fitur
