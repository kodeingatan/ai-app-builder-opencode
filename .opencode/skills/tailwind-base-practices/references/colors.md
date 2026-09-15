# Tailwind CSS v4 - Colors

## Default Color Palette

### Slate
```
slate-50:  #f8fafc    slate-100: #f1f5f9    slate-200: #e2e8f0
slate-300: #cbd5e1    slate-400: #94a3b8    slate-500: #64748b
slate-600: #475569    slate-700: #334155    slate-800: #1e293b
slate-900: #0f172a    slate-950: #020617
```

### Gray
```
gray-50:  #f9fafb    gray-100: #f3f4f6    gray-200: #e5e7eb
gray-300: #d1d5db    gray-400: #9ca3af    gray-500: #6b7280
gray-600: #4b5563    gray-700: #374151    gray-800: #1f2937
gray-900: #111827    gray-950: #030712
```

### Blue
```
blue-50:  #eff6ff    blue-100: #dbeafe    blue-200: #bfdbfe
blue-300: #93c5fd    blue-400: #60a5fa    blue-500: #3b82f6
blue-600: #2563eb    blue-700: #1d4ed8    blue-800: #1e40af
blue-900: #1e3a8a    blue-950: #172554
```

### Green
```
green-50:  #f0fdf4    green-100: #dcfce7    green-200: #bbf7d0
green-300: #86efac    green-400: #4ade80    green-500: #22c55e
green-600: #16a34a    green-700: #15803d    green-800: #166534
green-900: #14532d    green-950: #052e16
```

### Red
```
red-50:  #fef2f2    red-100: #fee2e2    red-200: #fecaca
red-300: #fca5a5    red-400: #f87171    red-500: #ef4444
red-600: #dc2626    red-700: #b91c1c    red-800: #991b1b
red-900: #7f1d1d    red-950: #450a0a
```

### Yellow
```
yellow-50:  #fefce8    yellow-100: #fef9c3    yellow-200: #fef08a
yellow-300: #fde047    yellow-400: #facc15    yellow-500: #eab308
yellow-600: #ca8a04    yellow-700: #a16207    yellow-800: #854d0e
yellow-900: #713f12    yellow-950: #422006
```

## Semantic Color Usage
```html
<!-- Backgrounds -->
<div class="bg-primary bg-secondary bg-accent">...</div>
<div class="bg-success bg-warning bg-danger bg-info">...</div>

<!-- Text -->
<p class="text-primary text-secondary text-muted">...</p>
<p class="text-success text-warning text-danger text-info">...</p>

<!-- Borders -->
<div class="border-primary border-success border-danger">...</div>
```

## Custom Colors in @theme
```css
@theme {
  --color-brand-50: #eff6ff;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-brand-700: #1d4ed8;
}
```

## Color Opacity
```html
<div class="bg-primary/50 bg-primary/75 bg-primary/90">...</div>
<div class="text-black/50 text-black/75">...</div>
<div class="border-gray-300/50">...</div>
```
