# PROJECT VIGIL — Brand Kit & Design System

**Version:** 2.0 | **Date:** April 18, 2026

---

## 1. Brand Identity

**Name:** PROJECT VIGIL
**Tagline:** "Governance, Transparent."
**Voice:** Authoritative, factual, civic-minded. Never sensational. Data speaks.

**Brand Pillars:**
- **Trust** — Clean, minimal UI that lets data breathe
- **Clarity** — Information hierarchy that guides, not overwhelms
- **Civic Duty** — Seriousness without being cold; approachable authority

---

## 2. Color System

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `surface-primary` | `#0c0f14` | App background — near-black with cool undertone |
| `surface-secondary` | `#151922` | Cards, panels, elevated surfaces |
| `surface-tertiary` | `#1e2430` | Hover states, secondary cards, input backgrounds |
| `surface-border` | `#2a3140` | Borders, dividers, subtle separators |

### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `accent-primary` | `#e8963e` | Primary CTA, brand mark, key highlights (warm amber) |
| `accent-hover` | `#f0a854` | Hover state for accent |
| `accent-muted` | `rgba(232, 150, 62, 0.12)` | Accent backgrounds, subtle tints |
| `accent-secondary` | `#3b82f6` | Links, secondary actions, informational |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#f1f3f7` | Headings, primary content |
| `text-secondary` | `#94a3b8` | Body text, descriptions |
| `text-tertiary` | `#64748b` | Captions, timestamps, metadata |
| `text-inverse` | `#0c0f14` | Text on accent backgrounds |

### Semantic / Data Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `status-clean` | `#34d399` | No criminal cases, acquitted, positive indicators |
| `status-warning` | `#fbbf24` | Pending cases, moderate alerts |
| `status-danger` | `#f87171` | Convicted, serious charges, high-risk flags |
| `status-info` | `#60a5fa` | Neutral informational states |
| `status-live` | `#34d399` | Live data indicator (pulsing dot) |
| `status-cached` | `#fbbf24` | Cached/stale data indicator |

### Chart Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `chart-assets` | `#e8963e` | Politician asset growth line |
| `chart-index` | `#64748b` | Market index reference line |
| `chart-grid` | `#1e2430` | Chart gridlines |
| `chart-tooltip-bg` | `#151922` | Tooltip background |

---

## 3. Typography

**Font Stack:** System fonts for performance — no external font loading.

```
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display` | 36px / 2.25rem | 700 | 1.1 | Hero heading, "PROJECT VIGIL" |
| `h1` | 28px / 1.75rem | 700 | 1.2 | Page titles, politician name |
| `h2` | 22px / 1.375rem | 600 | 1.3 | Section headers |
| `h3` | 18px / 1.125rem | 600 | 1.4 | Card titles, subsections |
| `body` | 15px / 0.9375rem | 400 | 1.6 | Default body text |
| `body-sm` | 13px / 0.8125rem | 400 | 1.5 | Secondary info, metadata |
| `caption` | 11px / 0.6875rem | 500 | 1.4 | Labels, badges, timestamps |
| `mono` | 13px / 0.8125rem | 500 | 1.5 | Numbers, amounts, data values |

### Monospace (for data)
```
font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
```
Used for: currency values, percentages, IPC sections, case counts.

---

## 4. Spacing & Layout

### Spacing Scale (rem-based)

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps, icon padding |
| `space-2` | 8px | Inline element gaps |
| `space-3` | 12px | Small component padding |
| `space-4` | 16px | Standard component padding |
| `space-5` | 20px | Card inner padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Major section spacing |
| `space-10` | 40px | Page section breaks |
| `space-12` | 48px | Hero/header spacing |

### Layout

- **Max content width:** 960px (max-w-4xl) — focused, readable
- **Card border-radius:** 12px (rounded-xl)
- **Button border-radius:** 10px (rounded-[10px])
- **Input border-radius:** 12px
- **Badge border-radius:** 6px (rounded-md)
- **Avatar border-radius:** Full circle

### Breakpoints
- Mobile: < 640px (single column, stacked layout)
- Tablet: 640px–1024px (two-column where appropriate)
- Desktop: > 1024px (full layout with sidebar potential)

---

## 5. Elevation & Depth

| Level | Shadow | Usage |
|-------|--------|-------|
| `flat` | none | Inline elements, badges |
| `raised` | `0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)` | Cards, buttons |
| `floating` | `0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)` | Dropdowns, tooltips |
| `overlay` | `0 12px 40px rgba(0,0,0,0.6)` | Modals, dialogs |

Borders are preferred over shadows for most card edges: `1px solid surface-border`.

---

## 6. Component Patterns

### Cards
- Background: `surface-secondary`
- Border: `1px solid surface-border`
- Padding: `space-5` (20px)
- Radius: 12px
- Hover: border shifts to `accent-primary/30`, subtle `translateY(-1px)`

### Buttons

**Primary (CTA):**
- Background: `accent-primary`
- Text: `text-inverse`
- Padding: 12px 24px
- Font weight: 600
- Hover: `accent-hover` + slight scale(1.01)

**Secondary/Ghost:**
- Background: transparent
- Border: `1px solid surface-border`
- Text: `text-secondary`
- Hover: background `surface-tertiary`

**Text Button:**
- No border/background
- Text: `accent-primary`
- Hover: underline

### Inputs
- Background: `surface-tertiary`
- Border: `1px solid surface-border`
- Focus: `ring-2 ring-accent-primary/40`
- Placeholder: `text-tertiary`
- Padding: 14px 16px

### Badges / Tags
- Background: semantic color at 12% opacity
- Text: semantic color
- Font: `caption` size, font-weight 500
- Padding: 2px 8px
- Border-radius: 6px

### Status Indicators
- Pulsing dot (8px circle) + label
- Green = live, Amber = cached, Red = error

---

## 7. Iconography

- **Style:** Outlined, 1.5px stroke weight (Heroicons-style)
- **Size grid:** 16px (inline), 20px (standard), 24px (feature)
- **Color:** Inherits text color via `currentColor`
- **Key icons:**
  - Eye (brand mark / vigil)
  - Search (magnifying glass)
  - Shield (criminal cases)
  - TrendingUp (assets)
  - FileText (reports/audits)
  - Clock (coming soon)
  - Newspaper (news/headlines)
  - Users (family)
  - ArrowLeft (navigation)
  - ExternalLink (source links)

---

## 8. Animation & Motion

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| `fade-in` | 200ms | ease-out | Elements entering view |
| `slide-up` | 250ms | cubic-bezier(0.16, 1, 0.3, 1) | Cards, sections loading |
| `scale-in` | 150ms | ease-out | Modals, tooltips appearing |
| `pulse` | 2s | ease-in-out | Live data indicator |
| `skeleton` | 1.5s | ease-in-out | Loading placeholders |

**Rules:**
- No animation > 300ms
- Prefer opacity + transform (GPU-accelerated)
- Loading skeletons use gradient shimmer, not pulse
- Reduced motion: respect `prefers-reduced-motion`

---

## 9. Data Visualization

### Chart Style
- Dark background matching `surface-secondary`
- Gridlines: `chart-grid` with 0.3 opacity
- Axis labels: `text-tertiary`, caption size
- Data lines: 2.5px stroke, rounded caps
- Tooltips: `chart-tooltip-bg` with `surface-border` border, 8px radius
- Area fills: accent color at 8% opacity

### Data Formatting
- Currency: Indian format with Cr/L suffix (e.g., "40.5 Cr")
- Percentages: Monospace font, color-coded (green positive, red negative)
- Dates: "Mar 2024" format for charts, "18 Apr 2026" for timestamps

---

## 10. "Coming Soon" Feature Cards

Visual treatment for unreleased features:
- Same card structure but with `surface-border` dashed border
- Overlay gradient with 60% opacity
- Clock icon + "Coming Soon" badge (accent-muted background)
- Feature icon centered, 32px, text-tertiary
- Title + one-line description
- Subtle shimmer animation on hover

### Planned Features:
1. **News & Headlines** — Aggregated news coverage per politician from digital magazines
2. **Family Wealth Tracker** — Cross-referenced family member assets (scraped, accuracy disclaimed)
3. **Constituency Scorecard** — Development metrics for a politician's constituency
4. **Compare Politicians** — Side-by-side asset/case comparison
5. **Attendance Tracker** — Parliament/Assembly session attendance records
6. **Election Timeline** — Historical election results and margin analysis
