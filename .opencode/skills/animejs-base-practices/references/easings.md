# Easings

## Overview

Easing menentukan kecepatan animasi sepanjang durasinya. Anime.js mendukung berbagai jenis easing.

## Built-in Eases

### Standard Eases

- `linear` - Konstan
- `ease` - Default CSS ease
- `easeIn` - Mulai lambat
- `easeOut` - Akhiri lambat
- `easeInOut` - Mulai dan akhiri lambat

### Expo

- `expoOut` - Eksplosif di awal, melambat
- `expoIn` - Lambat di awal, eksplosif di akhir
- `expoInOut` - Eksplosif di tengah

### Cubic

- `cubicOut` - Cubic out
- `cubicIn` - Cubic in
- `cubicInOut` - Cubic in-out

### Quad

- `quadOut` - Quadratic out
- `quadIn` - Quadratic in
- `quadInOut` - Quadratic in-out

### Back

- `backOut` - Overshoot di akhir
- `backIn` - Overshoot di awal
- `backInOut` - Overshoot di kedua sisi

### Bounce

- `bounceOut` - Pantulan di akhir
- `bounceIn` - Pantulan di awal
- `bounceInOut` - Pantulan di kedua sisi

### Elastic

- `elasticOut` - Efek elastis di akhir
- `elasticIn` - Efek elastis di awal
- `elasticInOut` - Efek elastis di kedua sisi

## Custom Easing

### Cubic Bézier

```js
animate('.box', {
  translateX: 100,
  ease: [0.25, 0.1, 0.25, 1.0], // cubic-bezier equivalent
});
```

### Spring

```js
animate('.box', {
  translateX: 100,
  ease: 'spring(1, 80, 10, 0)', // [mass, stiffness, damping, velocity]
});
```

### Steps

```js
animate('.box', {
  translateX: 100,
  ease: 'steps(4)', // 4 steps
});
```

### Linear dengan Tweak

```js
animate('.box', {
  translateX: 100,
  ease: (t) => t, // Linear function
});
```

## Pemilihan Easing

| Kebutuhan | Easing yang Direkomendasikan |
|-----------|------------------------------|
| UI transitions | `easeOut`, `cubicOut` |
| Entrance animations | `backOut`, `elasticOut` |
| Exit animations | `easeIn`, `expoIn` |
| Natural movement | `elasticOut`, `spring()` |
| Mechanical/precise | `linear`, `steps()` |
| Playful/bouncy | `bounceOut`, `backOut` |
| Smooth/friendly | `expoInOut`, `cubicInOut` |

## Best Practices

1. **Konsistensi**: Gunakan easing yang sama untuk animasi sejenis
2. **Subtle**: Untuk UI, gunakan easing yang tidak terlalu dramatis
3. **Context-aware**: Sesuaikan dengan konteks (bouncy untuk playfulness, smooth untuk profesional)
4. **Hindari linear**: Kecuali untuk animasi mekanis atau progress bars
5. **Test**: Coba beberapa easing sebelum memutuskan

## Anti-Patterns

- Menggunakan `bounceOut` untuk transisi UI yang serius
- Menggunakan easing yang berbeda-beda tanpa alasan
- Mengabaikan easing sama sekali (default mungkin tidak cocok)
