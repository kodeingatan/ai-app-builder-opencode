# Tailwind CSS v4 - Dark Mode

## Class-Based Dark Mode (v4)
```css
@variant dark (&:where(.dark, .dark *));
```

Usage:
```html
<div class="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content
</div>
```

## System Preference (Media Query)
```css
@variant dark (&:where(@media (prefers-color-scheme: dark)));
```

## Common Dark Mode Patterns

### Card Component
```html
<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Title</h3>
  <p class="text-gray-600 dark:text-gray-300">Description</p>
</div>
```

### Form Input
```html
<input 
  class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
         text-gray-900 dark:text-white 
         placeholder-gray-400 dark:placeholder-gray-500
         focus:ring-2 focus:ring-blue-500"
  placeholder="Enter text..."
/>
```

### Navigation
```html
<nav class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
  <a class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
    Link
  </a>
</nav>
```

### Shadows in Dark Mode
```html
<div class="shadow-sm dark:shadow-gray-800/50">
  Softer shadows in dark mode
</div>
```

## Inverting Colors
```html
<img class="dark:invert" src="logo.svg" />
```

## Force Dark Mode (for testing)
```html
<html class="dark">
```

## Toggle Pattern (JavaScript)
```js
// Toggle dark class on <html>
document.documentElement.classList.toggle('dark')
```
