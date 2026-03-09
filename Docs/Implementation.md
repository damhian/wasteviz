# Implementation Plan

> **WasteViz TPS Dashboard** — Full Implementation Guide
> Stack: Turborepo · Next.js 15 · Fastify · Neon + Drizzle ORM · mapcn · Tailwind CSS · Shadcn UI · Bun

---

## Tech Stack Reference

| Technology       | Role                            | Official Docs                          |
| ---------------- | ------------------------------- | -------------------------------------- |
| **Bun**          | Package Manager & Runtime       | https://bun.sh/docs                    |
| **Turborepo**    | Monorepo Build System           | https://turbo.build/repo/docs          |
| **Next.js 15**   | Frontend Framework (App Router) | https://nextjs.org/docs                |
| **Fastify**      | Backend HTTP Server             | https://fastify.dev/docs/latest/       |
| **Drizzle ORM**  | Type-safe ORM                   | https://orm.drizzle.team/docs/overview |
| **Neon**         | Serverless PostgreSQL           | https://neon.tech/docs/introduction    |
| **mapcn**        | Map Component (MapLibre GL JS)  | https://www.npmjs.com/package/mapcn    |
| **Tailwind CSS** | Utility-first CSS               | https://tailwindcss.com/docs           |
| **Shadcn UI**    | Component Library               | https://ui.shadcn.com/docs             |
| **Vitest**       | Testing Framework               | https://vitest.dev/guide/              |
| **Open-Meteo**   | Free Weather API                | https://open-meteo.com/en/docs         |

---

## Feature Analysis

### Categorized Features

**Client-Side (Browser Required):**

- Interactive map with `mapcn` — must use `"use client"`
- Clickable TPS markers with popups
- Weather radar layer toggle (RainViewer via `mapcn`)

**Server-Side (No Browser):**

- Weather data fetching from Open-Meteo API
- All database queries (via Repository Pattern)
- Environment variable access (DATABASE_URL)

**API Layer (Fastify):**

- `GET /api/health` — connectivity check
- `GET /api/drop-offs` — returns non-deleted waste drop-off records
- `POST /api/drop-offs` (future) — log a new drop-off
- `DELETE /api/drop-offs/:id` (future) — soft-delete a record

---

## Phase 1: Turborepo Scaffold & Dependency Management

**Estimated time: 1–2 hours**

### apps/web Setup

- [x] Verify Next.js 15 is bootstrapped in `apps/web/`
- [x] Install and configure Tailwind CSS in `apps/web/`
  ```bash
  cd apps/web
  bun add tailwindcss @tailwindcss/postcss postcss
  bun add -d tailwindcss
  ```
- [x] Initialize Shadcn UI (requires Tailwind to be set up first)
  ```bash
  cd apps/web
  bunx shadcn@latest init -d
  ```
- [x] Install `mapcn` (MapLibre GL JS wrapper)
  ```bash
  cd apps/web
  bun add mapcn
  ```
  > ⚠️ **Do NOT install `maplibre-gl` separately.** `mapcn` bundles the core engine.
- [x] Install `lucide-react` for icons
  ```bash
  cd apps/web
  bun add lucide-react
  ```

### apps/api Setup

- [x] `fastify` installed
- [x] `drizzle-orm` installed
- [x] `@neondatabase/serverless` installed
- [x] `dotenv` installed
- [x] `drizzle-kit` installed (devDep)
- [x] `vitest` installed (devDep)
- [x] `tsx` installed (devDep)
- [x] `typescript` installed (peerDep)

---

## Phase 2: Database Schema & Drizzle ORM Setup

**Estimated time: 1 hour**

- [x] Create `.env.local` at workspace root (empty, to be filled by user)
- [x] Create `apps/api/src/db/schema.ts`
  - Table: `bali_tps` — `id`, `name`, `lat`, `lng`, `capacityStatus`, `maxCapacityKg`
  - Table: `bali_waste_drop_offs` — `id`, `tpsId` (FK), `driverName`, `volumeKg`, `droppedAt`, `deletedAt`
- [x] Create `apps/api/src/db/index.ts`
  - Initialize Neon serverless connection
  - **Fallback Shield:** `const connectionString = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost/dummy'`
- [x] Create `apps/api/drizzle.config.ts`
  - Point to `src/db/schema.ts`
  - Load `.env.local` from the root (`../../.env.local` relative to `apps/api`)
  - **CRITICAL:** add `tablesFilter: ["bali_*"]` — protects other teams' tables
- [x] Create `apps/api/src/db/test-connection.ts` — runs `SELECT 1` to verify connectivity
- [x] Pause for user to add `DATABASE_URL` to `.env.local`
- [x] Run `bunx drizzle-kit push` (only after test-connection passes)

> ⚠️ **DATA PRESERVATION RULE:** Only tables prefixed with `bali_` may be created or modified. Never run `drop table` or alter any non-`bali_` table. The `tablesFilter` in `drizzle.config.ts` enforces this.

---

## Phase 3: Fastify API & Secure Drop-off Ledger

**Estimated time: 1–2 hours**

- [x] Create `apps/api/src/repositories/dropOffRepository.ts`
  - Class: `DropOffRepository`
  - Method `findAll()`: queries `bali_waste_drop_offs` WHERE `deletedAt IS NULL`
  - Method `softDelete(id)`: sets `deletedAt = now()` rather than deleting the row
  - > **Rule:** Every `SELECT` MUST filter `deletedAt IS NULL` — no exceptions
- [x] Create `apps/api/src/server.ts`
  - Initialize Fastify instance with logger enabled
  - Import db connection from `./db/index.ts`
  - Instantiate `DropOffRepository`
  - Route `GET /api/health` → returns `{ status: "ok", timestamp: Date.now() }`
  - Route `GET /api/drop-offs` → calls `dropOffRepository.findAll()`, returns JSON
  - Listen on `PORT` env or default `4000`
- [x] Add `dev` script to `apps/api/package.json`:
  ```json
  "scripts": {
    "dev": "bun run src/server.ts",
    "db:push": "bunx drizzle-kit push",
    "db:studio": "bunx drizzle-kit studio",
    "test": "vitest"
  }
  ```

---

## Phase 4: Next.js Frontend Integration

**Estimated time: 2–3 hours**

- [x] Create `app/actions/weather.ts` (Next.js Server Action)
  - Accepts `lat` and `lng` arguments
  - Fetches from Open-Meteo: `https://api.open-meteo.com/v1/forecast`
  - Fetches radar timestamp from RainViewer
  - Proxies data to client components without exposing logic.
- [x] Create `components/InteractiveTpsMap.tsx`
  - Add `"use client"` directive at top
  - Use `mapcn` to render a MapLibre map centered on Denpasar `[115.2167, -8.6500]`
  - ⚠️ **Coordinate Order:** `mapcn`/MapLibre uses `[Lng, Lat]` — reversed from Google Maps!
  - Render TPS markers from props
- [x] Create `components/map/TpsMarker.tsx` (Combined inside InteractiveTpsMap)
  - `"use client"` — handles click events
  - Shows capacity status and live weather warning in popup
- [x] Create `components/map/WeatherRadarLayer.tsx`
  - `"use client"` — toggle button + RainViewer radar tile overlay
- [x] Update `app/page.tsx` (Server Component)
  - Fetch TPS data from `http://localhost:4000/api/drop-offs`
  - Fetch weather from internal `/api/weather` route
  - Pass data as props to `<TpsMap />`
- [x] Update `app/layout.tsx` with global Tailwind styles
- [x] Delete `app/globals.css` default Next.js styles and replace with clean Tailwind base

---

## Phase 5: Driver Ledger Flow & Responsive UI (Upcoming)

**Estimated time: 2–3 hours**

- [ ] Build `/ledger` route in `apps/web/app/`
- [ ] Implement paginated data table using Shadcn `Table` for drop-offs
- [ ] Build "Log New Drop-off" form using Shadcn `Dialog` (POST to API)
- [ ] Build "Archive" action with confirmation dialog (DELETE to API)
- [x] Implement responsive left sidebar TPS list using Shadcn `ScrollArea` (Synchronized with Map)
- [ ] Implement mobile bottom-sheet view for Map TPS details (`sm` breakpoint)
- [ ] Fix Accessibility (a11y): Add `tabIndex={0}` and keyboard events to map markers, `aria-label` to buttons.

---

## Dependency Tree (Ordered by Install Sequence)

```
apps/web:
  1. tailwindcss + @tailwindcss/postcss + postcss
  2. shadcn init (requires tailwind)
  3. mapcn (requires shadcn for UI)
  4. lucide-react

apps/api:
  ✅ All dependencies already installed
```

---

## Verification Checklist

- [x] `bun run dev` (from root) starts both `web` (port 3000) and `api` (port 4000)
- [x] `GET http://localhost:4000/api/health` returns `{ status: "ok" }`
- [x] `GET http://localhost:4000/api/drop-offs` returns an array (possibly empty)
- [x] `http://localhost:3000` renders the map centered on Denpasar
- [x] Clicking a TPS marker shows its name + capacity status
- [x] Records with `deletedAt` set do NOT appear in the UI
- [x] `bunx drizzle-kit studio` shows `bali_tps` and `bali_waste_drop_offs` tables
- [x] Vitest tests passing in `apps/web`

---

_Last Updated: 2026-03-09_
