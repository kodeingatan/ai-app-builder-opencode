# Tailwind CSS v4 - Responsive Design

## Breakpoints (v4 defaults)
```
sm:  640px    (mobile landscape)
md:  768px    (tablet)
lg:  1024px   (desktop)
xl:  1280px   (large desktop)
2xl: 1536px   (extra large)
```

## Usage Pattern (Mobile-First)
```html
<!-- Base = mobile, prefix = larger screens -->
<div class="w-full md:w-1/2 lg:w-1/3">
  Content
</div>

<!-- Stacked on mobile, side-by-side on tablet+ -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="flex-1">Sidebar</div>
  <div class="flex-2">Main</div>
</div>
```

## Responsive Typography
```html
<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold">
  Title scales up
</h1>
```

## Responsive Visibility
```html
<div class="hidden md:block">Visible on md+</div>
<div class="block md:hidden">Visible on mobile only</div>
```

## Responsive Padding/Margin
```html
<div class="p-4 md:p-8 lg:p-12">
  Content with responsive spacing
</div>
```

## Responsive Grid
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
  <div>Card 4</div>
</div>
```

## Container Patterns
```html
<div class="w-full max-w-7xl mx-auto px-4 md:px-8">
  Container with responsive padding
</div>
```

## Min/Max Width
```html
<div class="min-w-0 max-w-full md:min-w-[200px]">
  Responsive constraints
</div>
```
