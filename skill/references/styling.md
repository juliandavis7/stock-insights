# Styling Reference

Complete guide to Tailwind CSS configuration, design tokens, and styling patterns.

## Tech Stack

- **Tailwind CSS 4.1** - Utility-first CSS framework
- **@tailwindcss/vite** - Vite plugin for Tailwind v4
- **tw-animate-css** - Animation utilities
- **class-variance-authority** - Variant styling for components
- **tailwind-merge + clsx** - Conditional class merging

## Configuration

### app.css

**File**: `app/app.css`

Tailwind v4 uses CSS-first configuration with `@theme` and CSS custom properties:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --font-sans: var(--font-apple-system);
  --radius-md: 10px;
  /* ... other tokens */
}
```

## Design Tokens (CSS Variables)

### Color Palette

**Apple-inspired light theme**:

```css
:root {
  /* Core Colors */
  --background: #ffffff;
  --foreground: #000000;
  --page-background: #f8fafc;
  --footer-background: #1E293B;
  
  /* Card Colors */
  --card: #ffffff;
  --card-foreground: #000000;
  
  /* Primary (Apple Blue) */
  --primary: #0071e3;
  --primary-foreground: #ffffff;
  
  /* Secondary */
  --secondary: #f5f5f7;
  --secondary-foreground: #1d1d1f;
  
  /* Muted/Subtle */
  --muted: #f5f5f7;
  --muted-foreground: #86868b;
  
  /* Accent */
  --accent: #0071e3;
  --accent-foreground: #ffffff;
  
  /* Destructive (Red) */
  --destructive: #ff3b30;
  --destructive-foreground: #ffffff;
  
  /* Borders & Inputs */
  --border: #e2e2e7;
  --input: #f5f5f7;
  --ring: #0071e3;
  
  /* Chart Colors */
  --chart-1: #0071e3; /* Blue */
  --chart-2: #34c759; /* Green */
  --chart-3: #ff9500; /* Orange */
  --chart-4: #ffcc00; /* Yellow */
  --chart-5: #af52de; /* Purple */
}
```

**Usage**:
```tsx
<div className="bg-primary text-primary-foreground">
  Primary Button
</div>
<div className="bg-secondary text-secondary-foreground">
  Secondary Section
</div>
```

### Typography

**Fonts**:
```css
--font-apple-system: -apple-system, BlinkMacSystemFont, "San Francisco", 
                     "Helvetica Neue", Helvetica, sans-serif;
--font-sf-mono: "SF Mono", Menlo, monospace;
--font-sans: var(--font-apple-system);
```

**Classes**:
```tsx
<h1 className="font-sans">Apple System Font</h1>
<code className="font-mono">Monospace Code</code>
```

**Heading Defaults**:
```css
h1, h2, h3, h4, h5, h6 {
  @apply font-medium tracking-tight;
}
```

### Border Radius

```css
--radius-sm: 8px;
--radius-md: 10px;
--radius-lg: 12px;
--radius-xl: 20px;
```

**Usage**:
```tsx
<div className="rounded-md">Medium radius (10px)</div>
<div className="rounded-lg">Large radius (12px)</div>
<button className="rounded-xl">Extra large (20px)</button>
```

### Shadows

Apple-style subtle shadows:

```css
--shadow-sm: 0px 2px 4px rgba(0, 0, 0, 0.1);
--shadow-md: 0px 4px 8px rgba(0, 0, 0, 0.1);
--shadow-lg: 0px 8px 16px rgba(0, 0, 0, 0.1);
--shadow-xl: 0px 12px 24px rgba(0, 0, 0, 0.1);
```

**Usage**:
```tsx
<div className="shadow-md">Card with medium shadow</div>
<div className="shadow-lg hover:shadow-xl">Elevated card</div>
```

## Utility Classes

### Layout

**Container**:
```tsx
<div className="container mx-auto px-4">
  {/* Centered container with padding */}
</div>

<div className="max-w-7xl mx-auto">
  {/* Max width container */}
</div>
```

**Flexbox**:
```tsx
<div className="flex items-center justify-between gap-4">
  <div>Left</div>
  <div>Right</div>
</div>

<div className="flex flex-col space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

**Grid**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
```

### Spacing

**Padding**:
```tsx
<div className="p-4">All sides</div>
<div className="px-6 py-4">Horizontal & Vertical</div>
<div className="pt-8 pb-4">Top & Bottom</div>
```

**Margin**:
```tsx
<div className="m-4">All sides</div>
<div className="mx-auto">Horizontal center</div>
<div className="mt-8 mb-4">Top & Bottom</div>
```

**Gap** (for flex/grid):
```tsx
<div className="flex gap-2">Small gap</div>
<div className="grid gap-6">Medium gap</div>
<div className="flex gap-x-4 gap-y-2">Different X/Y gaps</div>
```

**Space Between**:
```tsx
<div className="flex flex-col space-y-4">
  <div>Item with 1rem gap below</div>
  <div>Item with 1rem gap below</div>
</div>
```

### Typography

**Text Size**:
```tsx
<p className="text-xs">Extra small (0.75rem)</p>
<p className="text-sm">Small (0.875rem)</p>
<p className="text-base">Base (1rem)</p>
<p className="text-lg">Large (1.125rem)</p>
<p className="text-xl">Extra large (1.25rem)</p>
<p className="text-2xl">2X large (1.5rem)</p>
<p className="text-4xl">4X large (2.25rem)</p>
```

**Font Weight**:
```tsx
<p className="font-normal">Normal (400)</p>
<p className="font-medium">Medium (500)</p>
<p className="font-semibold">Semibold (600)</p>
<p className="font-bold">Bold (700)</p>
```

**Text Color**:
```tsx
<p className="text-foreground">Default text</p>
<p className="text-muted-foreground">Muted text</p>
<p className="text-primary">Primary blue</p>
<p className="text-destructive">Destructive red</p>
<p className="text-gray-600">Gray 600</p>
```

**Text Alignment**:
```tsx
<p className="text-left">Left aligned</p>
<p className="text-center">Center aligned</p>
<p className="text-right">Right aligned</p>
```

### Colors

**Background**:
```tsx
<div className="bg-background">Default background</div>
<div className="bg-card">Card background</div>
<div className="bg-primary">Primary blue</div>
<div className="bg-secondary">Secondary gray</div>
<div className="bg-gray-50">Light gray</div>
<div className="bg-gray-100">Medium gray</div>
```

**Border**:
```tsx
<div className="border">Default border</div>
<div className="border-2">Thicker border</div>
<div className="border-gray-200">Gray border</div>
<div className="border-primary">Primary border</div>
<div className="border-t">Top border only</div>
<div className="border-b-2">Bottom border (2px)</div>
```

### States

**Hover**:
```tsx
<button className="hover:bg-gray-100">Hover background</button>
<a className="hover:text-primary">Hover text color</a>
<div className="hover:shadow-lg">Hover shadow</div>
<button className="hover:scale-105">Hover scale</button>
```

**Focus**:
```tsx
<input className="focus:ring-2 focus:ring-primary" />
<button className="focus:outline-none focus:ring-2">Button</button>
```

**Active/Disabled**:
```tsx
<button className="active:bg-gray-200">Active state</button>
<button className="disabled:opacity-50 disabled:cursor-not-allowed">
  Disabled
</button>
```

### Responsive Design

**Mobile-first breakpoints**:
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up
- `2xl:` - 1536px and up

```tsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text size
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive grid
</div>

<div className="hidden lg:block">
  Hidden on mobile, visible on desktop
</div>

<div className="block lg:hidden">
  Visible on mobile, hidden on desktop
</div>
```

### Transitions

**Duration**:
```tsx
<div className="transition duration-200">Fast transition</div>
<div className="transition duration-300">Medium transition</div>
<div className="transition-all duration-200">All properties</div>
```

**Properties**:
```tsx
<div className="transition-colors">Color transitions only</div>
<div className="transition-transform">Transform transitions only</div>
<div className="transition-opacity">Opacity transitions only</div>
```

## Component Styling Patterns

### cn() Utility

**File**: `app/lib/utils.ts`

```tsx
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage** - Merge classes conditionally:
```tsx
import { cn } from "~/lib/utils";

function Button({ variant, className, ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md font-medium",
        variant === "primary" && "bg-primary text-primary-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        className // Allow override
      )}
      {...props}
    />
  );
}
```

### Class Variance Authority (CVA)

Used in shadcn/ui components for variant styling:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

## Common Patterns

### Card Layout
```tsx
<Card className="max-w-md mx-auto">
  <CardHeader>
    <CardTitle className="text-2xl font-bold">Title</CardTitle>
    <CardDescription className="text-muted-foreground">
      Subtitle
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <p>Content here</p>
  </CardContent>
  <CardFooter className="flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Submit</Button>
  </CardFooter>
</Card>
```

### Form Layout
```tsx
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input 
      id="email" 
      type="email" 
      placeholder="Enter email"
      className="w-full"
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="password">Password</Label>
    <Input 
      id="password" 
      type="password"
      className="w-full"
    />
  </div>
  <Button type="submit" className="w-full">
    Sign In
  </Button>
</form>
```

### Table Layout
```tsx
<Table>
  <TableHeader>
    <TableRow className="bg-gray-50">
      <TableHead className="font-semibold">Metric</TableHead>
      <TableHead className="text-right font-semibold">Value</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">PE Ratio</TableCell>
      <TableCell className="text-right">25.4</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Loading Skeleton
```tsx
<div className="space-y-4">
  <Skeleton className="h-8 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

### Error Display
```tsx
<div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-md">
  <AlertCircle className="h-4 w-4" />
  <span>{errorMessage}</span>
</div>
```

### Page Layout
```tsx
<div className="min-h-screen bg-page-background">
  <header className="bg-background border-b">
    <div className="container mx-auto px-4 py-4">
      {/* Header content */}
    </div>
  </header>
  
  <main className="container mx-auto px-4 py-8">
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page content */}
    </div>
  </main>
  
  <footer className="bg-footer-background text-white mt-16">
    <div className="container mx-auto px-4 py-8">
      {/* Footer content */}
    </div>
  </footer>
</div>
```

## Chart Styling

### Recharts Color Configuration

```tsx
const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#F59E0B", // Golden amber
  },
  eps: {
    label: "EPS",
    color: "#F59E0B",
  },
  grossMargin: {
    label: "Gross Margin",
    color: "#10B981", // Green
  },
  netMargin: {
    label: "Net Margin",
    color: "#3B82F6", // Blue
  },
};

<ChartContainer config={chartConfig}>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <Bar dataKey="revenue" fill="var(--color-revenue)" />
    </BarChart>
  </ResponsiveContainer>
</ChartContainer>
```

## Best Practices

1. **Use design tokens** - Reference CSS variables (`bg-primary`) instead of hardcoding colors
2. **Mobile-first** - Start with mobile styles, add breakpoints upward
3. **Consistent spacing** - Use Tailwind's spacing scale (0, 1, 2, 4, 6, 8, 12, 16)
4. **Use cn() for conditionals** - Merge classes safely with tailwind-merge
5. **Follow shadcn patterns** - Consistent with existing UI components
6. **Semantic colors** - Use `text-muted-foreground` not `text-gray-500`
7. **Hover states** - Add hover effects to interactive elements
8. **Focus states** - Always style focus rings for accessibility
9. **Transitions** - Add smooth transitions for state changes
10. **Responsive** - Test all breakpoints (mobile, tablet, desktop)

## Dark Mode Support

Dark mode support is available via CSS variables (not currently active):

```css
.dark {
  --sidebar: hsl(240 5.9% 10%);
  --sidebar-foreground: hsl(240 4.8% 95.9%);
  /* ... other dark tokens */
}
```

To enable dark mode, add class toggling:
```tsx
<html className={isDark ? "dark" : ""}>
```

## Animations

From `tw-animate-css`:

```tsx
<div className="animate-fade-in">Fade in</div>
<div className="animate-slide-up">Slide up</div>
<div className="animate-bounce">Bounce</div>
<div className="animate-spin">Spin</div>
```

## Custom Utilities

Add custom utilities in `app.css`:

```css
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

## Performance Tips

1. **Avoid arbitrary values** - Use design tokens when possible
2. **Purge unused CSS** - Tailwind automatically handles this
3. **Group related utilities** - Use component composition
4. **Reuse component classes** - Create reusable components for common patterns
5. **Use CSS variables** - Easier to theme and maintain

