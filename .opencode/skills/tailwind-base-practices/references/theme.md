# Tailwind CSS v4 - Theme Variables

## v4 CSS-First Configuration

v4 replaces `tailwind.config.js` with CSS `@theme` directive.

## Custom Theme Variables
```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-foreground: #ffffff;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  
  /* Font Family */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  
  /* Font Size */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

## Using Theme Variables
```html
<!-- Automatic from @theme -->
<div class="bg-primary text-primary-foreground p-md">...</div>

<!-- Explicit -->
<div class="text-[var(--text-sm)]">...</div>
```

## Extending vs Overriding
```css
@theme {
  /* Override existing */
  --color-primary: #10b981;
  
  /* Add new */
  --color-accent: #f59e0b;
}
```

## Custom Variants
```css
@variant dark (&:where(.dark, .dark *));

@variant hover (&:hover);
```

## Custom Utilities
```css
@utility scrollbar-hide {
  scrollbar-width: none;
}
@utility scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

## Container Configuration
```css
@utility container {
  margin-inline: auto;
  padding-inline: 1rem;
  @media (width >= 640px) { max-width: 640px; }
  @media (width >= 768px) { max-width: 768px; }
  @media (width >= 1024px) { max-width: 1024px; }
}
```

## Gradient Syntax
```html
<div class="bg-linear-to-r from-primary to-primary-hover">
  Gradient background
</div>
```

## Key Differences from v3
| Feature | v3 | v4 |
|---------|----|----|
| Config file | `tailwind.config.js` | CSS `@theme` |
| Base styles | `@tailwind base` | `@import "tailwindcss"` |
| Preflight | Included | Not included by default |
| Container | Plugin | Built-in utility |
| Gradient | `bg-gradient-to-r` | `bg-linear-to-r` |
