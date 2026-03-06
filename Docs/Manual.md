# WasteViz Operations Dashboard — Developer Manual

> **Welcome to the WasteViz project!** This manual is entirely dedicated to helping the next developer, agent, or contributor understand how this application works from the ground up, why certain architectural decisions were made, and how to safely extend it without breaking existing features.

---

## 🏗️ 1. The Big Picture: What is WasteViz?

**WasteViz** is a localized Waste Management dashboard built specifically for 'Tempat Pembuangan Sampah' (TPS) operations in Bali. Its primary goal is to give facility managers and logistics drivers a real-time, bird's-eye view of waste capacity across the island, overlaid with critical weather data.

### Why Weather Data?
In Bali, heavy rain severely impacts logistics routes and the physical capacity of open-air waste sites. By combining **TPS capacity status** with **live weather radar**, managers can reroute drivers away from flooded areas or prioritize pickups at sites threatened by imminent storms.

---

## 📐 2. The Architecture (Turborepo Monorepo)

The project is structured as a **Monorepo** using **Turborepo** and the **Bun** runtime. This means the Frontend (UI) and Backend (API/Database) live in the same repository but are strictly separated into different "apps".

### The `apps/web` Directory (Frontend)
- **Framework:** Next.js 15 (App Router).
- **Core Rule:** Default to Server Components.
- **The Map:** We use `mapcn` (a wrapper around MapLibre GL JS). Because maps require browser APIs (like `window` and `document`), any file rendering the map (e.g., `InteractiveTpsMap.tsx`) **must** include `"use client"` at the very top.
- **Styling:** Tailwind CSS combined with Shadcn UI. All UI components live in `components/ui/` and should not be edited manually (use the Shadcn CLI to update them).

### The `apps/api` Directory (Backend)
- **Framework:** Fastify.
- **Database:** Neon (Serverless PostgreSQL) accessed via **Drizzle ORM**.
- **Core Rule:** The frontend *never* talks to the database directly. It must go through the Fastify API or Next.js Server Actions.
- **The "bali_" Prefix:** To protect the database from cross-team pollution, all WasteViz tables are prefixed with `bali_` (e.g., `bali_tps`, `bali_waste_drop_offs`). The `drizzle.config.ts` enforces this using the `tablesFilter: ["bali_*"]` setting.

---

## 🔄 3. How Data Flows

Understanding how data moves from the database to the screen is crucial.

### Flow A: TPS Locations & Drop-offs
1. **The Database:** `bali_tps` stores the locations. `bali_waste_drop_offs` stores the logging events.
2. **The Repository (`apps/api/src/repositories/`):** We use a "Repository Pattern". This layer ensures that any record marked as "archived" (`deletedAt IS NOT NULL`) is completely hidden from the application. This is a strict audit requirement.
3. **The API:** Fastify serves this data at `http://localhost:4000/api/drop-offs`.
4. **The Frontend (`apps/web/app/page.tsx`):** The Next.js Server Component securely handles fetching this data across the local network and passes it down to the map component as standard React props.

### Flow B: Live Weather & Radar
1. **The Action (`apps/web/app/actions/weather.ts`):** We use a Next.js Server Action to fetch data from the free Open-Meteo API. This hides the fetch logic from the browser and prevents CORS issues.
2. **Dynamic Fetching:** As the user drags the map around, `InteractiveTpsMap.tsx` watches the center coordinates. After the user stops dragging for 1 second (debouncing), it calls the Server Action to fetch the exact weather for that new location.
3. **The Radar:** The RainViewer radar uses a similar pattern. A server action fetches the latest valid "timestamp" for the radar images, and the map layer maps that timestamp into a URL to overlay the rain clouds.

---

## ⚠️ 4. Essential Rules & Gotchas for Development

If you are going to add a new feature or fix a bug, you **must** adhere to these rules:

1. **The Coordinate Trap (`[Lng, Lat]`):**
   Google Maps uses `[Latitude, Longitude]`. **We do not.** Because we use MapLibre GL (via `mapcn`) and GeoJSON standards, coordinates are **ALWAYS** `[Longitude, Latitude]`. If your map loads in the middle of the ocean, you likely swapped them.

2. **The 4-Doc Sync Protocol:**
   Before coding, you must check `/Docs`.
   - Read `Implementation.md` to see what phase we are in.
   - Read `UI_UX_doc.md` to pick the right Shadcn components and Tailwind colors.
   - If you encounter a bug, stop coding, log it in `Bug_tracking.md`, fix it, and resolve it in the doc.

3. **Client vs. Server Boundaries:**
   If a component needs `useState`, `useEffect`, `onClick`, or uses `mapcn`, it is a Client Component (`"use client"`). If it just displays data or fetches secure data, keep it as a Server Component.

4. **Environment Variables:**
   The `DATABASE_URL` lives in `.env.local` at the absolute root of the workspace. **Never** import this variable into `apps/web`. It is strictly for `apps/api`.

---

## 🚀 5. Getting Started (For the Next Dev)

To spin up the project locally:

1. Ensure Bun is installed (`curl -fsSL https://bun.sh/install | bash`).
2. Verify you have a `.env.local` at the workspace root with a valid Neon `DATABASE_URL`.
3. Open a terminal at the project root (`wasteviz/`).
4. Run `bun install`.
5. Run `bun run dev`.

This single command utilizes Turborepo to simultaneously boot the Next.js frontend (Port 3000) and the Fastify backend (Port 4000).

*Happy coding, and keep Bali clean!*
