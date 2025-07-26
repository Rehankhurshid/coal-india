# V0 Modular UI Style Guide

A comprehensive guide to set up the V0 modular UI design system for any project. This creates a consistent, scalable design system### 3. Verify Dependencies in package.json

Your `package.json` should include these key dependencies:

```json
{
  "dependencies": {
    "next": "14.2.0",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.300.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "@tanstack/react-table": "^8.11.0",
    "recharts": "^2.8.0"
  }
}
```

### 4. Create Navigation Componentjs, TypeScript, Tailwind CSS, and shadcn/ui that gives you the clean, modern V0 aesthetic.

## Table of Contents

1. [Quick Setup (5 minutes)](#quick-setup-5-minutes)
2. [Design System Foundation](#design-system-foundation)
3. [Core Components Setup](#core-components-setup)
4. [UI Patterns & Components](#ui-patterns--components)
5. [Layout Patterns](#layout-patterns)
6. [Interactive Components](#interactive-components)
7. [Styling Guidelines](#styling-guidelines)
8. [Best Practices](#best-practices)

---

## Quick Setup (5 minutes)

### 1. Initialize Next.js Project

```bash
npx create-next-app@latest your-project-name --typescript --tailwind --app --src-dir --import-alias "@/*"
cd your-project-name
```

### 2. Install shadcn/ui

```bash
npx shadcn@latest init
```

**Configuration options:**

- **Which style would you like to use?** → Default
- **Which color would you like to use as base color?** → Slate
- **Would you like to use CSS variables for colors?** → Yes
- **Where is your global CSS file?** → src/app/globals.css
- **Would you like to use CSS variables for colors?** → Yes
- **Where is your tailwind.config.js located?** → tailwind.config.ts
- **Configure the import alias for components?** → src/components
- **Configure the import alias for utils?** → src/lib/utils

### 3. Install Core Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4",
    "class-variance-authority": "^0.7",
    "clsx": "^2.1",
    "tailwind-merge": "^2.2",
    "lucide-react": "^0.300"
  }
}
```

```bash
# Essential utilities
npm install class-variance-authority@^0.7 clsx@^2.1 tailwind-merge@^2.2 lucide-react@^0.300

# Form handling
npm install react-hook-form@^7.48 zod@^3.22 @hookform/resolvers@^3.3

# Data tables (optional but recommended)
npm install @tanstack/react-table@^8.11

# Charts (optional)
npm install recharts@^2.8
```

### 4. Install Essential shadcn/ui Components

```bash
# Core UI components (install these first)
npx shadcn@latest add button card input form table badge

# Navigation components
npx shadcn@latest add navigation-menu sheet

# Layout components
npx shadcn@latest add separator skeleton

# Form components (install as needed)
npx shadcn@latest add select checkbox radio-group textarea switch label

# Advanced components (install as needed)
npx shadcn@latest add dialog dropdown-menu tabs breadcrumb avatar
npx shadcn@latest add calendar date-picker command popover tooltip
```

### 5. Essential Utils Setup

Create `src/lib/utils.ts` (if not already created):

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Design System Foundation

The V0 aesthetic is built on these core principles:

### Visual Hierarchy

- **Typography scale**: Clear hierarchy with `text-4xl`, `text-3xl`, `text-xl` for headings
- **Color contrast**: High contrast with `text-foreground` and `text-muted-foreground`
- **Spacing rhythm**: Consistent spacing using `space-y-*` utilities

### Modern Aesthetics

- **Clean borders**: Subtle borders using `border` color
- **Soft shadows**: Hover effects with `hover:shadow-lg`
- **Rounded corners**: Consistent `rounded-md` for cards and inputs
- **Backdrop blur**: Modern glass effect with `bg-background/95 backdrop-blur`

### Component Composition

- **Card-based layouts**: Everything is contained in clean card components
- **Badge system**: Status indicators and tags with consistent styling
- **Button hierarchy**: Clear primary, secondary, and ghost button variants

---

## Core Components Setup

### 1. Verify Project Structure

After setup, your project should have this structure:

```
your-project/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── ... (other shadcn components)
│   └── lib/
│       └── utils.ts
├── components.json
├── tailwind.config.ts
└── package.json
```

### 2. Update `lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 2. Create Navigation Component

Create `src/components/app-nav.tsx`:

```typescript
"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Components", href: "/components" },
  { name: "Patterns", href: "/patterns" },
  { name: "Examples", href: "/examples" },
];

interface AppNavProps {
  className?: string;
}

export function AppNav({ className }: AppNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur",
        className
      )}
    >
      <div className="container mx-auto px-4 flex h-16 items-center">
        {/* Logo */}
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">Your App Name</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex flex-1 items-center justify-between">
          <div className="flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost">Sign In</Button>
            <Button>Get Started</Button>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden ml-auto"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                Sign In
              </Button>
              <Button className="w-full">Get Started</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
```

### 5. Update Root Layout

Update `src/app/layout.tsx` to include proper font setup and navigation:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/app-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Your App Name - V0 Modular UI",
  description: "Built with V0 modular UI patterns using Next.js and shadcn/ui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-background font-sans">
          <AppNav />
          {children}
        </div>
      </body>
    </html>
  );
}
```

---

## UI Patterns & Components

### 1. Hero Sections

The V0 style for prominent sections:

```typescript
<section className="text-center space-y-6 py-12">
  <h1 className="text-4xl font-bold text-foreground">Your Main Heading</h1>
  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
    Supporting description text that explains the value proposition.
  </p>
  <div className="flex justify-center gap-4">
    <Button size="lg">Primary Action</Button>
    <Button variant="outline" size="lg">
      Secondary Action
    </Button>
  </div>
</section>
```

### 2. Feature Cards

Clean, hover-responsive cards:

```typescript
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle className="text-lg">Feature Title</CardTitle>
    <CardDescription>
      Clear, concise description of the feature or content.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">Tag 1</Badge>
      <Badge variant="secondary">Tag 2</Badge>
    </div>
  </CardContent>
</Card>
```

### 3. Navigation Pattern

Sticky, responsive navigation with glass effect:

```typescript
<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
  <div className="container mx-auto px-4 flex h-16 items-center">
    {/* Logo */}
    <div className="mr-4 flex">
      <Link href="/" className="font-bold text-xl">
        Brand
      </Link>
    </div>

    {/* Navigation */}
    <nav className="hidden md:flex flex-1 items-center justify-between">
      <div className="flex items-center space-x-6">{/* Nav links */}</div>
      <div className="flex items-center gap-4">
        <Button variant="ghost">Secondary</Button>
        <Button>Primary</Button>
      </div>
    </nav>
  </div>
</header>
```

### 4. Data Display Tables

Clean, functional data presentation:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Data Table Title</CardTitle>
    <CardDescription>Description of the data being shown</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="rounded-md border">
      <Table>{/* Table content with consistent styling */}</Table>
    </div>
  </CardContent>
</Card>
```

### 5. Form Patterns

Clean form layouts with consistent spacing:

```typescript
<Card className="max-w-md">
  <CardHeader>
    <CardTitle>Form Title</CardTitle>
    <CardDescription>Form description</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">Field Label</label>
      <Input placeholder="Placeholder text" />
    </div>
    <div className="flex gap-2">
      <Button className="flex-1">Submit</Button>
      <Button variant="outline" className="flex-1">
        Cancel
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## Layout Patterns

### 1. Container Pattern

Always center and constrain content width:

```typescript
<div className="container mx-auto px-4 py-8">{/* Your content */}</div>
```

### 2. Section Spacing

Consistent vertical rhythm between sections:

```typescript
<section className="py-12">
  <h2 className="text-3xl font-bold text-center mb-8">Section Title</h2>
  {/* Section content */}
</section>
```

### 3. Grid Layouts

Responsive grid system:

```typescript
{
  /* 3-column responsive grid */
}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>;

{
  /* 2-column responsive grid */
}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">{/* Grid items */}</div>;
```

### 4. Flex Layouts

For button groups and horizontal layouts:

```typescript
{
  /* Centered button group */
}
<div className="flex justify-center gap-4">
  <Button>Primary</Button>
  <Button variant="outline">Secondary</Button>
</div>;

{
  /* Responsive flex layout */
}
<div className="flex flex-col sm:flex-row gap-4">{/* Flex items */}</div>;
```

---

## Interactive Components

### 1. Hover Effects

Subtle, performant hover states:

```css
/* Card hover effect */
hover:shadow-lg transition-shadow

/* Button hover effects (built into shadcn/ui) */
hover:bg-accent hover:text-accent-foreground

/* Link hover effects */
hover:text-foreground transition-colors
```

### 2. Focus States

Accessible focus indicators:

```css
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
```

### 3. Loading States

Use shadcn/ui skeleton components for loading:

```typescript
import { Skeleton } from "@/components/ui/skeleton";

<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
</div>;
```

### 4. State Indicators

Use badges for status and state:

```typescript
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="outline">Inactive</Badge>
<Badge variant="destructive">Error</Badge>
```

---

## Styling Guidelines

### Design System Tokens

### Typography Scale

```css
text-4xl    /* 36px - Main headings */
text-3xl    /* 30px - Section headings */
text-2xl    /* 24px - Subsection headings */
text-xl     /* 20px - Large text, descriptions */
text-lg     /* 18px - Card titles */
text-base   /* 16px - Body text */
text-sm     /* 14px - Secondary text */
text-xs     /* 12px - Captions, badges */
```

### Spacing Scale

```css
space-y-1   /* 4px - Tight spacing */
space-y-2   /* 8px - Close spacing */
space-y-4   /* 16px - Default spacing */
space-y-6   /* 24px - Comfortable spacing */
space-y-8   /* 32px - Section spacing */
space-y-12  /* 48px - Large section spacing */

gap-2       /* 8px - Button groups */
gap-4       /* 16px - Card grids */
gap-6       /* 24px - Large grids */
```

### Color Usage

```css
/* Text Colors */
text-foreground        /* Primary text - highest contrast */
text-muted-foreground  /* Secondary text - lower contrast */

/* Background Colors */
bg-background         /* Main background */
bg-muted             /* Subtle background for cards/sections */
bg-accent            /* Hover backgrounds */

/* Border Colors */
border               /* Default border color */
border-muted         /* Subtle borders */
```

### Component Sizing

```css
/* Heights */
h-16        /* Navigation height */
h-10        /* Default button height */
h-9         /* Small button height */

/* Padding */
px-4        /* Horizontal container padding */
py-8        /* Vertical container padding */
p-6         /* Card padding */

/* Max widths */
max-w-2xl   /* Hero text width */
max-w-md    /* Form width */
max-w-sm    /* Input width */
```

### Responsive Breakpoints & Mobile-First Design

```css
/* Mobile first approach */
/* Base styles apply to mobile */

sm:   /* 640px+ - Small tablets */
md:   /* 768px+ - Tablets */
lg:   /* 1024px+ - Laptops */
xl:   /* 1280px+ - Desktops */
2xl:  /* 1536px+ - Large screens */
```

**Example responsive patterns:**

```typescript
{
  /* Responsive grid */
}
className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

{
  /* Responsive flex direction */
}
className = "flex flex-col sm:flex-row gap-4";

{
  /* Responsive text sizes */
}
className = "text-2xl md:text-3xl lg:text-4xl";

{
  /* Responsive spacing */
}
className = "px-4 md:px-6 lg:px-8";
```

---

## Best Practices

### 1. Component Composition

```typescript
// Good: Compose larger components from smaller ones
const FeatureCard = ({ title, description, tags }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    </CardContent>
  </Card>
);
```

### 2. Consistent Spacing Rhythm

```typescript
// Good: Use consistent spacing classes
<div className="space-y-8">
  <section className="space-y-6">
    <h2 className="text-3xl font-bold">Title</h2>
    <p className="text-muted-foreground">Description</p>
  </section>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Grid items */}
  </div>
</div>
```

### 3. Semantic HTML Structure

```typescript
// Good: Use proper semantic elements
<main className="container mx-auto px-4 py-8">
  <section className="py-12">
    <header className="text-center space-y-4 mb-8">
      <h1 className="text-4xl font-bold">Page Title</h1>
      <p className="text-xl text-muted-foreground">Subtitle</p>
    </header>
    <article className="space-y-6">{/* Content */}</article>
  </section>
</main>
```

### 4. Color and Contrast

```typescript
// Good: Use semantic color classes
<Card>
  <CardHeader>
    <CardTitle className="text-foreground">High contrast title</CardTitle>
    <CardDescription className="text-muted-foreground">
      Lower contrast description
    </CardDescription>
  </CardHeader>
</Card>
```

### 5. Interactive States

```typescript
// Good: Include hover and focus states
<Button className="hover:shadow-md focus-visible:ring-2 transition-all">
  Interactive Button
</Button>

<Link
  href="/page"
  className="text-muted-foreground hover:text-foreground transition-colors"
>
  Navigation Link
</Link>
```

---

## Component Variants & Usage

### Button Hierarchy

```typescript
<Button>Primary Action</Button>                    {/* Most important */}
<Button variant="secondary">Secondary Action</Button>  {/* Less important */}
<Button variant="outline">Tertiary Action</Button>     {/* Least important */}
<Button variant="ghost">Subtle Action</Button>         {/* Very subtle */}
<Button variant="destructive">Delete Action</Button>   {/* Dangerous actions */}
```

### Badge Usage

```typescript
<Badge>Default Status</Badge>                 {/* Primary status */}
<Badge variant="secondary">Info Tag</Badge>   {/* General tags */}
<Badge variant="outline">Inactive</Badge>     {/* Inactive states */}
<Badge variant="destructive">Error</Badge>    {/* Error states */}
```

### Card Patterns

```typescript
{
  /* Basic card */
}
<Card>
  <CardContent className="p-6">Content only</CardContent>
</Card>;

{
  /* Card with header */
}
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Main content</CardContent>
</Card>;

{
  /* Interactive card */
}
<Card className="hover:shadow-lg transition-shadow cursor-pointer">
  {/* Card content */}
</Card>;
```

---

## Development Commands & Quick Reference

### Essential Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Add more shadcn/ui components
npx shadcn@latest add [component-name]
```

### Must-Have shadcn/ui Components

```bash
# Core components (install first)
npx shadcn@latest add button card input form table badge

# Navigation & layout
npx shadcn@latest add navigation-menu sheet dialog dropdown-menu

# Form components
npx shadcn@latest add select checkbox radio-group textarea switch

# Data & feedback
npx shadcn@latest add tabs breadcrumb avatar separator skeleton

# Advanced components (as needed)
npx shadcn@latest add calendar date-picker command popover tooltip
```

### Key V0 Style Characteristics

1. **Clean, minimal aesthetic** with subtle borders and shadows
2. **Consistent spacing rhythm** using Tailwind's space-y utilities
3. **Clear typography hierarchy** with proper contrast ratios
4. **Hover and focus states** for all interactive elements
5. **Card-based layouts** for content organization
6. **Responsive design** with mobile-first approach
7. **Semantic color usage** with foreground/muted-foreground pattern
8. **Glass morphism effects** with backdrop-blur on overlays

This design system gives you the foundation to create clean, modern interfaces with the V0 aesthetic that can be applied to any type of application - from dashboards to marketing sites to mobile apps!
