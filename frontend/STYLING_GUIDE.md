# Lost & Found - Design System & Styling Guide

## Overview

This document describes the complete design system implemented for the Lost & Found application. It's built on **CSS custom properties (variables)** for consistency, making it easy to maintain and explain.

## Design System Architecture

### 1. Global Design System (`frontend/src/styles.css`)

All design decisions are centralized in CSS custom properties (variables), making the system **consistent** and **easy to update**.

#### Color Palette

```css
/* Brand */
--color-primary: #2563eb       /* Blue - actions, links */
--color-primary-light: #dbeafe
--color-primary-dark: #1e40af

/* Status badges */
--color-lost: #dc2626          /* Red */
--color-found: #0891b2         /* Cyan */
--color-active: #16a34a        /* Green */
--color-claimed: #ea580c       /* Orange */
--color-resolved: #6b7280      /* Gray */

/* Neutral */
--color-dark: #111827          /* Main text */
--color-dark-secondary: #4b5563
--color-border: #e5e7eb
--color-bg-light: #f3f4f6      /* Light backgrounds */
--color-bg-white: #ffffff
```

**How it works:**
- `--color-lost` (red) badge appears on "Lost" items
- `--color-found` (cyan) badge appears on "Found" items
- `--color-active` (green) shows item is available for claims
- `--color-claimed` (orange) shows item has a claim pending
- `--color-resolved` (gray) shows item is no longer available

#### Spacing Scale (8px base unit)

```css
--spacing-xs: 4px
--spacing-sm: 8px    /* Small gaps, padding on small elements */
--spacing-md: 16px   /* Default padding, form field gaps */
--spacing-lg: 24px   /* Section margins, card padding */
--spacing-xl: 32px   /* Large section gaps */
--spacing-2xl: 48px  /* Very large gaps */
```

**Usage example:**
```css
/* Instead of hardcoding: */
padding: 16px;
margin-bottom: 24px;

/* Use variables: */
padding: var(--spacing-md);
margin-bottom: var(--spacing-lg);
```

#### Typography

```css
--font-family: system-ui, -apple-system, Segoe UI, Roboto...
--font-size-sm: 14px          /* Labels, captions */
--font-size-base: 16px        /* Body text, buttons */
--font-size-lg: 18px
--font-size-xl: 20px          /* Card titles */
--font-size-2xl: 24px         /* Page headings */
--font-size-3xl: 32px         /* Main titles */

--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700

--line-height-tight: 1.3      /* Headings */
--line-height-normal: 1.5     /* Body text */
--line-height-relaxed: 1.7    /* Long form */
```

#### Border Radius

```css
--border-radius-sm: 4px
--border-radius-md: 6px        /* Form fields, small buttons */
--border-radius-lg: 8px        /* Cards, larger elements */
--border-radius-xl: 12px       /* Badges, modals */
```

#### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1)
```

## Component Styling

### Badges (Type & Status)

**Lost/Found badges:**
```html
<span class="badge badge--lost">Lost</span>
<span class="badge badge--found">Found</span>
```

**Status badges:**
```html
<span class="badge badge--active">Active</span>
<span class="badge badge--claimed">Claimed</span>
<span class="badge badge--resolved">Resolved</span>
```

**Styling:**
- All badges have 4px 10px padding
- White text on colored background
- 12px border-radius for pill shape
- Colors from the palette above

### Buttons

**Primary button** (main actions like "Create Item", "Approve Claim"):
```html
<button class="btn btn-primary">Save</button>
```

**Secondary button** (alternative actions):
```html
<a routerLink="/items" class="btn btn-secondary">View items</a>
```

**Variations:**
- `.btn-sm` - smaller buttons for compact layouts
- `:disabled` - grayed out, cursor: not-allowed

### Form Elements

**Text inputs, textareas, selects:**
- Consistent padding: `var(--spacing-sm)` vertical, `var(--spacing-md)` horizontal
- Border: 1px solid `--color-border`
- Focus state: blue border + light blue background
- Rounded corners: `--border-radius-md`

**Radio buttons:**
- Wrapped in `.radio-group` with horizontal flex layout
- Gap between options: `var(--spacing-lg)`
- Using native HTML radios (no custom styling)

### Cards & Containers

**Item cards** (`.item-card`):
- White background with subtle shadow
- 1px border with light gray color
- 16px padding inside (`.item-card__body`)
- Smooth shadow on hover
- Image: 200px height, full width, cover fit

**Item detail card** (`.item-detail__card`):
- Larger padding: 24px
- Section dividers with top/bottom borders
- Info grid: 2-column layout (label | value)
- On mobile: single column

**My items cards** (`.my-item-card`):
- Expandable sections with toggles
- Claims shown in subgrid
- Action buttons: approve (green), reject (red), view (blue)

## Page-Specific Styling

### Items List Page (`items.html`)

**Layout:**
- Container width: 1200px max
- Grid: `repeat(auto-fill, minmax(300px, 1fr))` - responsive 3+ column grid
- On tablet (768px): 2 columns
- On mobile (480px): 1 column

**Toolbar:**
- Background: light gray (`--color-bg-light`)
- Flexbox with wrap
- Search input: flex: 1 (takes remaining space)
- Dropdowns: min-width 140px

### Item Detail Page (`item-detail.html`)

**Layout:**
- Max-width: 720px (narrower for reading)
- Light gray background: `--color-bg-light`
- White card on top
- Header with title + badges (side-by-side on desktop, stacked on mobile)
- Info grid: 2 columns (label | value)

**Claim form:**
- Only shown if:
  - User is logged in
  - User is NOT the item owner
  - Item status is "active"
- Textarea: 4 rows, resizable
- Submit button disabled if message is empty

### My Items Page (`my-items.html`)

**Layout:**
- Max-width: 1200px
- List of item cards (one per row)
- Expandable claims section per item
- Each claim shows:
  - Username (bold)
  - Message
  - Status badge (pending = yellow, approved = green, rejected = red)
  - Action buttons (approve/reject) if pending

**Actions:**
- "View" button: link to detail page
- "Mark Resolved" button: only shown if not already resolved
- "Show/Hide claims" button: toggle expand

### Form Pages (`item-form.html`, `login.html`, `register.html`)

**Layout:**
- Centered card container
- Max-width: 460px for auth, 560px for forms
- White card on light gray background
- Responsive: 100% width on mobile

**Form structure:**
- Title at top
- Fields stacked vertically
- Label above each field
- Focus ring: blue border + light blue background
- Submit button: full width
- Error message: red background with left border accent

## Responsive Design

### Breakpoints

```css
/* Tablet and below */
@media (max-width: 768px) {
  /* Adjust grid, hide some elements, stack layout */
}

/* Mobile */
@media (max-width: 640px) {
  /* Single column layouts, full-width buttons */
  /* Smaller padding, smaller fonts */
}

/* Extra small mobile */
@media (max-width: 480px) {
  /* Minimal padding, extra compact */
  /* Stack navbar items */
}
```

### Mobile-first approach:

1. Mobile base styles (narrow viewport)
2. Tablet adjustments (768px+)
3. Desktop enhancements (1024px+)

**Example - grid adjustments:**

```css
/* Base: 1 column */
.items-page__grid {
  grid-template-columns: 1fr;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  grid-template-columns: repeat(2, 1fr);
}

/* Desktop: 3+ columns */
@media (min-width: 1024px) {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
```

## Consistency Rules

### Spacing

- Never hardcode pixels - always use `var(--spacing-*)` 
- Standard gaps: `--spacing-md` between elements
- Large gaps: `--spacing-lg` between sections
- Cards/boxes: `--spacing-lg` padding inside

### Colors

- Text: `var(--color-dark)` (default)
- Secondary text: `var(--color-dark-secondary)`
- Links/actions: `var(--color-primary)`
- Errors: `var(--color-error)` (red)
- Success: `var(--color-active)` (green)
- Warnings: `var(--color-warning)` (orange)
- Borders: `var(--color-border)` (light gray)

### Typography

- Headings: use `--font-size-*xl`, `--font-weight-bold`, `--line-height-tight`
- Body text: use `--font-size-base`, `--font-weight-normal`, `--line-height-normal`
- Small text: use `--font-size-sm`, `--font-weight-medium`

### Shadows & Effects

- Default shadow: `var(--shadow-sm)` on cards
- Hover state: `var(--shadow-md)` (slightly larger)
- Transitions: `var(--transition-fast)` (150ms) for hovers, `var(--transition-normal)` (250ms) for animations

## How to Explain This

### To a Non-Technical Person

> "We created a **color palette** where red means 'Lost', blue means 'Found', green means 'Active'. We also defined a **spacing scale** - small, medium, large gaps - so everything looks consistent. All colors and sizes are defined in one place, making it easy to change them everywhere at once."

### To a Developer

> "All design tokens are CSS custom properties in `styles.css`. Component styles use these variables for consistency. Pages have specific layouts (grid for items list, card for detail view) that respond to different screen sizes using media queries. The design follows a spacing scale (8px base unit) and uses semantic color names."

### Quick Example

**Before (hardcoded):**
```html
<style>
  .card { padding: 24px; margin-bottom: 16px; border: 1px solid #e5e7eb; }
  .button { background: #2563eb; color: white; padding: 8px 16px; }
</style>
```

**After (design system):**
```html
<style>
  .card { padding: var(--spacing-lg); margin-bottom: var(--spacing-md); border: 1px solid var(--color-border); }
  .button { background: var(--color-primary); color: white; padding: var(--spacing-sm) var(--spacing-md); }
</style>
```

**Benefit:** If we want bigger spacing everywhere, change one number in `styles.css` instead of fixing dozens of places.

## Files Updated

1. **`frontend/src/styles.css`** - Global design system (colors, spacing, typography, utilities)
2. **`frontend/src/app/app.css`** - App layout container
3. **`frontend/src/app/shared/navbar/navbar.css`** - Navigation bar styling
4. **`frontend/src/app/pages/items/items.html`** - Items list page (updated inline styles)
5. **`frontend/src/app/pages/item-detail/item-detail.html`** - Detail page (refactored inline styles to CSS)
6. **`frontend/src/app/pages/item-form/item-form.css`** - Form page styling
7. **`frontend/src/app/pages/login/login.css`** - Auth pages styling
8. **`frontend/src/app/pages/my-items/my-items.html`** - My items page (refactored inline styles)
9. **`frontend/src/app/shared/item-card/item-card.html`** - Item card component

## Testing the Design

1. **Desktop (1200px+):** Full multi-column grids, large cards, all features visible
2. **Tablet (768px):** 2-column layouts, adjusted spacing
3. **Mobile (640px):** Single column, full-width buttons, compact spacing
4. **Extra small (480px):** Minimal padding, stacked navigation

To test: Open DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M) → Try different viewport sizes
