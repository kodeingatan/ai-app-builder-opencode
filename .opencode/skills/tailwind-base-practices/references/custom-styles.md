# Tailwind CSS v4 - Custom Styles

## Adding Custom CSS

### Global Styles
```css
@import "tailwindcss";

body {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
```

### Custom Utilities
```css
@utility scrollbar-hide {
  scrollbar-width: none;
}
@utility scrollbar-hide::-webkit-scrollbar {
  display: none;
}

@utility glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}
```

### Custom Variants
```css
@variant dark (&:where(.dark, .dark *));
@variant hover (&:hover);
@variant focus (&:focus-visible);
@variant group-hover (&:is(.group:hover *));
@variant peer-hover (&:is(.peer:hover *));
```

## Preflight (Not Included by Default)

Tailwind v4 does NOT include Preflight by default. This is good for Naive UI compatibility.

To add Preflight if needed:
```css
@import "tailwindcss/preflight";
```

### What Preflight Does
- Removes default margins on `body`, `h1-h6`, `p`
- Sets `box-sizing: border-box`
- Removes default list styles
- Sets `line-height: 1.5`
- Makes images `display: block; max-width: 100%`

## Container
```css
@utility container {
  margin-inline: auto;
  padding-inline: 1rem;
  @media (width >= 640px) { max-width: 640px; }
  @media (width >= 768px) { max-width: 768px; }
  @media (width >= 1024px) { max-width: 1024px; }
  @media (width >= 1280px) { max-width: 1280px; }
  @media (width >= 1536px) { max-width: 1536px; }
}
```

## Functions & Directives

### `@theme`
Define theme variables:
```css
@theme {
  --color-primary: #3b82f6;
}
```

### `@utility`
Define custom utilities:
```css
@utility card {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
}
```

### `@variant`
Define custom variants:
```css
@variant dark (&:where(.dark, .dark *));
```

### `@import`
Import other CSS files:
```css
@import "tailwindcss";
@import "./custom.css";
```

### `@layer`
Organize CSS:
```css
@layer base { /* base styles */ }
@layer components { /* component styles */ }
@layer utilities { /* utility styles */ }
```

## Mixing Tailwind with Existing CSS
```css
@import "tailwindcss";

/* Your custom base styles */
body {
  margin: 0;
}

/* Your custom component styles */
.my-component {
  @apply bg-white p-4 rounded-lg shadow-md;
}
```

## @apply Directive
```css
.card {
  @apply bg-white rounded-lg p-4 shadow-md border border-gray-200;
}

.btn-primary {
  @apply bg-blue-500 text-white px-4 py-2 rounded-lg 
         hover:bg-blue-600 transition-colors duration-200;
}
```

## CSS Variables for Dynamic Values
```css
:root {
  --sidebar-width: 250px;
  --header-height: 64px;
}

.sidebar {
  width: var(--sidebar-width);
}

.main-content {
  margin-left: var(--sidebar-width);
  padding-top: var(--header-height);
}
```
