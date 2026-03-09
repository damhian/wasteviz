# UI/UX Documentation

> **WasteViz TPS Dashboard** — Design System, Component Guidelines & User Flows
> Tech: Tailwind CSS · Shadcn UI · mapcn (MapLibre GL JS) · lucide-react

---

## Design System Specifications

### Color Palette

WasteViz uses a **dark operational dashboard** aesthetic — suitable for waste operations staff monitoring maps in various lighting conditions.

| Token                  | Hex       | Usage                             |
| ---------------------- | --------- | --------------------------------- |
| `--background`         | `#0f1117` | Page background                   |
| `--foreground`         | `#f4f4f5` | Primary text                      |
| `--card`               | `#1a1d27` | Card backgrounds                  |
| `--card-foreground`    | `#e2e8f0` | Card text                         |
| `--primary`            | `#22c55e` | Actions, success (waste = green)  |
| `--primary-foreground` | `#0f172a` | Text on primary                   |
| `--destructive`        | `#ef4444` | Danger, critical capacity, delete |
| `--muted`              | `#27293d` | Subtle backgrounds                |
| `--border`             | `#2d3148` | Borders & dividers                |
| `--accent`             | `#3b82f6` | Links, map accent                 |
| `--warning`            | `#f59e0b` | Capacity warnings, weather alerts |

### Typography

```css
/* Using next/font or Google Fonts CDN */
Primary Font:  Inter (UI labels, tables, cards)
Mono Font:     JetBrains Mono (IDs, coordinates, debug data)

Scale:
  xl:   1.5rem  — Page headers (h1)
  lg:   1.25rem — Section headers (h2)
  base: 1rem    — Body text
  sm:   0.875rem— Labels, table data
  xs:   0.75rem — Timestamps, secondary info
```

### Spacing System

Follows Tailwind's default scale. Common patterns:

- Panel padding: `p-4` or `p-6`
- Card gaps: `gap-4`
- Map container: `h-screen` or `h-[calc(100vh-64px)]`

---

## UI Component Guidelines

### Shadcn UI Components Used

| Component    | Usage Location               | Notes                                              |
| ------------ | ---------------------------- | -------------------------------------------------- |
| `Card`       | TPS info panel, stats        | Wrap all data panels                               |
| `Badge`      | Capacity status labels       | `green` = OK, `yellow` = Warning, `red` = Critical |
| `Button`     | Radar toggle, ledger actions | Use `variant="outline"` for map buttons            |
| `Table`      | Drop-off ledger view         | Paginated; only show non-deleted records           |
| `Dialog`     | Drop-off log form (future)   | Confirm before soft-delete                         |
| `Tooltip`    | Map marker labels            | Show TPS name on hover                             |
| `Skeleton`   | Loading state for map/data   | Always show while data is fetching                 |
| `Alert`      | Weather warnings             | `variant="destructive"` for severe weather         |
| `ScrollArea` | Left sidebar TPS list        | Scrollable marker list                             |

### Custom Components

#### `TpsMap.tsx` (Client Component)

```
Responsibilities:
  - Render mapcn map canvas
  - Layer management (satellite, radar, markers)
  - Synchronize state with Left Sidebar click events
  - Center: [115.2167, -8.6500] (Denpasar, Bali)
  - Default zoom: 11

Props:
  tpsLocations: TpsLocation[]   ← passed from Server Component
  initialWeather?: WeatherData  ← optional prefetched weather
```

#### `TpsMarker.tsx` (Client Component)

```
Responsibilities:
  - Render a mapcn Marker at [lng, lat]
  - Show animated `animate-ping` pulse ring if capacityStatus is WARNING or CRITICAL
  - Show Popup on click with:
    - TPS Name
    - Capacity status badge
    - Total Volume vs Max Capacity (kg)
    - Last drop-off timestamp

Props:
  tps: TpsLocation
  weather?: WeatherCondition
```

#### `WeatherRadarLayer.tsx` (Client Component)

```
Responsibilities:
  - Fetch RainViewer timestamps from https://api.rainviewer.com/public/weather-maps.json
  - Add/remove radar tile layer on the mapcn map
  - Show toggle button (uses lucide-react Cloud icon)

State:
  isRadarActive: boolean
  radarTimestamps: string[]
```

---

## User Experience Flow Diagrams

### Primary User Flow — Waste Manager

```
[Open Dashboard: localhost:3000]
        │
        ▼
[Map & Sidebar load]
        │
        ▼
[TPS Markers appear & Sidebar populates list]
  🟢 Green  = OK (< 65%)
  🟡 Yellow = Warning (65% - 79%) + Animated Pulse Filter
  🔴 Red    = Critical (> 80%) + Animated Pulse Filter
        │
        ├──── [Click a marker OR click a sidebar item]
        │         │
        │         ▼
        │     [Map flyTo Location & Highlight in Sidebar]
        │     [Popup appears containing:]
        │     - TPS Name
        │     - Capacity status badge
        │     - Volume / Max Capacity metrics
        │     - Last drop-off recorded
        │
        └──── [Toggle Radar Button]
                  │
                  ▼
              [RainViewer radar layer overlaid on map]
              (Precipitation heatmap updated live)
```

### Secondary Flow — Logistics Driver (Future)

```
[Driver opens ledger page]
        │
        ▼
[Table of today's drop-offs — all non-deleted]
        │
        ├──── [Log New Drop-off]
        │         │
        │         ▼
        │     [Form: TPS name, volume (kg), time]
        │     [Submit → POST /api/drop-offs]
        │
        └──── [Archive a Record]
                  │
                  ▼
              [Confirm dialog → soft-delete]
              [Record disappears from table]
              [Archived in DB with deletedAt timestamp]
```

---

## Responsive Design Requirements

| Breakpoint        | Layout                                     |
| ----------------- | ------------------------------------------ |
| `sm` (< 640px)    | Map full screen, bottom sheet for TPS info |
| `md` (640–1024px) | Map 60%, sidebar 40%                       |
| `lg` (> 1024px)   | Map 70%, sidebar 30%, full stats cards     |

The map container must always be at least `h-[400px]` on mobile and `h-screen` on desktop.

---

## Accessibility Standards

- All icon buttons (radar toggle, close popup) must have `aria-label` attributes.
- Color is **never** the sole indicator of status — always pair with a text label or icon.
- Keyboard navigation: map markers must be focusable (use `tabIndex={0}` + `onKeyDown` handlers).
- Minimum contrast ratio: **4.5:1** for normal text, **3:1** for large text/UI elements.
- Use Shadcn's built-in accessible Dialog for forms (focus trap, ESC to close).

---

## Style Guide & Branding

### Brand Identity

- **Name:** WasteViz
- **Tagline:** _Real-time waste intelligence for Bali's operations teams._
- **Icon concept:** Map pin + recycle symbol combined; primary green color (`#22c55e`).

### Tailwind Class Conventions

```tsx
// ✅ DO: Use design-token variables
className="bg-card text-card-foreground border-border"

// ✅ DO: Use semantic Shadcn components
<Badge variant="destructive">Critical</Badge>

// ❌ DON'T: Use arbitrary hex colors
className="bg-[#1a1d27]"

// ❌ DON'T: Use inline styles for layout
style={{ backgroundColor: 'red' }}
```

---

## Component Library Organization

```
apps/web/components/
├── map/                    ← All "use client" map components
│   ├── TpsMap.tsx
│   ├── TpsMarker.tsx
│   └── WeatherRadarLayer.tsx
└── ui/                     ← Auto-generated by `shadcn add <component>`
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── skeleton.tsx
    ├── table.tsx
    └── tooltip.tsx
```

> Never manually edit files in `components/ui/` — they are managed by Shadcn CLI.

---

## User Journey Maps

### Journey 1: Morning Operations Check

**Persona:** Municipal Waste Manager (Pak Wayan)

1. Opens dashboard on desktop at 7:00 AM
2. Scans map for red markers (critical TPS sites)
3. Enables radar layer to check for morning rain
4. Clicks on a critical TPS to see last drop-off time
5. Calls logistics team to prioritize that route

### Journey 2: End-of-Day Ledger Audit

**Persona:** Facility Admin (Bu Sari)

1. Opens drop-off ledger at 5:00 PM
2. Reviews all drop-offs logged today
3. Archives (soft-deletes) a duplicate entry
4. Confirms archived entry no longer appears in the list

---

## Design Tool Integration

| Tool                          | Purpose                                               |
| ----------------------------- | ----------------------------------------------------- |
| **Shadcn UI**                 | Component scaffolding (`bunx shadcn add <component>`) |
| **Tailwind CSS IntelliSense** | VS Code extension for class autocompletion            |
| **MapLibre GL JS Docs**       | Reference for mapcn layer/source APIs                 |
| **mapcn npm**                 | Check component API for markers and popups            |

---

_Last Updated: 2026-03-09_
