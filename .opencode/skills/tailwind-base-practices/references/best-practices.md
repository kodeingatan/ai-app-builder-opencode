# Tailwind CSS v4 - Best Practices

## 1. Mobile-First Responsive Design
```html
<!-- ✅ Good: Mobile-first -->
<div class="w-full md:w-1/2 lg:w-1/3">

<!-- ❌ Bad: Desktop-first -->
<div class="hidden md:block w-1/3 lg:w-1/2">
```

## 2. Use Theme Variables for Consistency
```css
@theme {
  --color-primary: #3b82f6;
}
```
```html
<!-- ✅ Good: Uses theme variable -->
<div class="bg-primary text-primary-foreground">

<!-- ❌ Bad: Hardcoded color -->
<div class="bg-[#3b82f6] text-white">
```

## 3. Group Related Classes
```html
<!-- ✅ Good: Logical grouping -->
<button class="
  bg-blue-500 text-white
  px-4 py-2
  rounded-lg
  hover:bg-blue-600
  transition-colors duration-200
">

<!-- ❌ Bad: Random order -->
<button class="rounded-lg px-4 bg-blue-500 hover:bg-blue-600 py-2 transition-colors duration-200 text-white">
```

## 4. Extract Components with @apply
```css
/* ✅ Good: Reusable component classes */
.card {
  @apply bg-white rounded-lg p-4 shadow-md border border-gray-200;
}

.btn-primary {
  @apply bg-primary text-primary-foreground px-4 py-2 rounded-lg 
         hover:bg-primary-hover transition-colors duration-200;
}
```

## 5. Use Dark Mode Variants
```html
<!-- ✅ Good: Dark mode support -->
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">

<!-- ❌ Bad: No dark mode -->
<div class="bg-white text-gray-900">
```

## 6. Leverage Flexbox/Grid
```html
<!-- ✅ Good: Modern layout -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">

<!-- ❌ Bad: Float hacks -->
<div style="float: left; width: 33%;">
```

## 7. Use Spacing Scale
```html
<!-- ✅ Good: Consistent spacing -->
<div class="p-4 m-2 gap-4">

<!-- ❌ Bad: Custom values -->
<div class="p-[16px] m-[8px] gap-[16px]">
```

## 8. Minimize Custom CSS
```html
<!-- ✅ Good: Tailwind utilities -->
<div class="flex items-center justify-between w-full">

<!-- ❌ Bad: Custom CSS -->
<div class="custom-layout">
```

## 9. Use Semantic Color Names
```html
<!-- ✅ Good: Semantic -->
<button class="bg-primary hover:bg-primary-hover">Save</button>

<!-- ❌ Bad: Generic -->
<button class="bg-blue-500 hover:bg-blue-600">Save</button>
```

## 10. Responsive Typography
```html
<!-- ✅ Good: Responsive text -->
<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold">

<!-- ❌ Bad: Fixed text -->
<h1 class="text-3xl font-bold">
```

## 11. Use Container for Layout
```html
<!-- ✅ Good: Responsive container -->
<div class="container mx-auto px-4">

<!-- ❌ Bad: Fixed width -->
<div class="max-w-7xl mx-auto px-4">
```

## 12. Avoid Premature Abstraction
```html
<!-- ✅ Good: Inline utilities -->
<div class="bg-primary text-white p-4 rounded-lg">

<!-- ❌ Bad: Over-abstracted -->
<div class="btn-primary-wrapper">
```

## Performance Tips
1. Use `@layer` to organize CSS
2. Avoid `@import` for each component
3. Use `@theme` for all custom values
4. Minimize use of `@apply`
5. Use CSS variables for dynamic values
