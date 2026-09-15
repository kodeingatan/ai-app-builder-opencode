# Tailwind CSS v4 - Anti-Patterns

## 1. ❌ Don't Use `@apply` Excessively
```css
/* ❌ Bad: Over-use of @apply */
.btn {
  @apply bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600;
}

/* ✅ Good: Use inline utilities instead */
<button class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
```

**When to use @apply:**
- Complex components reused across multiple files
- Pseudo-classes (hover, focus) that need to be grouped
- CSS-only components that can't be Vue components

## 2. ❌ Don't Use `tailwind.config.js` (v4)
```js
// ❌ Bad: Using v3 config file
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
      },
    },
  },
}
```
```css
/* ✅ Good: CSS-first in v4 */
@theme {
  --color-primary: #3b82f6;
}
```

## 3. ❌ Don't Use Preflight (with Naive UI)
```css
/* ❌ Bad: Including preflight with Naive UI */
@import "tailwindcss/preflight";

/* ✅ Good: No preflight needed */
@import "tailwindcss";
```

## 4. ❌ Don't Hardcode Colors
```html
<!-- ❌ Bad: Hardcoded values -->
<div class="bg-[#3b82f6] text-[#ffffff]">

<!-- ✅ Good: Use theme variables -->
<div class="bg-primary text-primary-foreground">
```

## 5. ❌ Don't Use `!important`
```html
<!-- ❌ Bad: Important modifier -->
<div class="!p-4 !m-2 !bg-red-500">

<!-- ✅ Good: Proper specificity -->
<div class="p-4 m-2 bg-red-500">
```

## 6. ❌ Don't Use Vendor Prefixes
```css
/* ❌ Bad: Manually adding prefixes */
.btn {
  -webkit-border-radius: 0.5rem;
  -moz-border-radius: 0.5rem;
  border-radius: 0.5rem;
}

/* ✅ Good: Let Tailwind handle it */
.btn {
  @apply rounded-lg;
}
```

## 7. ❌ Don't Nest @apply
```css
/* ❌ Bad: Nested @apply */
.card {
  @apply bg-white p-4;
  .title {
    @apply text-lg font-bold;
  }
}

/* ✅ Good: Flat @apply */
.card {
  @apply bg-white p-4;
}
.card .title {
  @apply text-lg font-bold;
}
```

## 8. ❌ Don't Use `@layer` Incorrectly
```css
/* ❌ Bad: Wrong layer order */
@layer base { /* ... */ }
@layer utilities { /* ... */ }
@layer components { /* ... */ }

/* ✅ Good: Correct layer order */
@layer base { /* ... */ }
@layer components { /* ... */ }
@layer utilities { /* ... */ }
```

## 9. ❌ Don't Use `@import` for Each Component
```css
/* ❌ Bad: Too many imports */
@import "tailwindcss";
@import "./components/button.css";
@import "./components/card.css";
@import "./components/modal.css";

/* ✅ Good: Single import + @layer */
@import "tailwindcss";
@layer components {
  @import "./components.css";
}
```

## 10. ❌ Don't Use Custom CSS When Utilities Exist
```css
/* ❌ Bad: Custom CSS for simple styles */
.center-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ✅ Good: Use Tailwind utilities */
<div class="flex items-center justify-center">
```

## 11. ❌ Don't Use `@apply` for Pseudo-Classes
```css
/* ❌ Bad: @apply for hover */
.btn {
  @apply bg-blue-500;
  &:hover {
    @apply bg-blue-600;
  }
}

/* ✅ Good: Inline pseudo-classes */
<button class="bg-blue-500 hover:bg-blue-600">
```

## 12. ❌ Don't Use `@theme` Incorrectly
```css
/* ❌ Bad: Wrong syntax */
@theme {
  colors: {
    primary: '#3b82f6',
  }
}

/* ✅ Good: Correct syntax */
@theme {
  --color-primary: #3b82f6;
}
```

## Summary
| Anti-Pattern | Why Bad | Alternative |
|--------------|---------|-------------|
| Over-using `@apply` | Increases bundle size | Inline utilities |
| Using `tailwind.config.js` | v3 syntax, not CSS-first | `@theme` directive |
| Including preflight with Naive UI | Breaks component styling | No preflight |
| Hardcoding colors | No theme support | Theme variables |
| Using `!important` | Overrides specificity | Proper specificity |
| Nesting `@apply` | Syntax error | Flat `@apply` |
| Wrong `@layer` order | CSS cascade issues | Correct order |
