# Project Structure

> **WasteViz TPS Dashboard** — Turborepo Monorepo Architecture

---

## Root Directory

```
wasteviz/                            ← Turborepo workspace root
├── apps/
│   ├── web/                         ← Next.js 15 (App Router) Frontend
│   └── api/                         ← Fastify Backend API
├── packages/
│   ├── ui/                          ← Shared UI components (@repo/ui)
│   ├── eslint-config/               ← Shared ESLint config (@repo/eslint-config)
│   └── typescript-config/           ← Shared TS config (@repo/typescript-config)
├── Docs/                            ← Project documentation (this folder)
│   ├── project_structure.md
│   ├── Implementation.md
│   ├── Bug_tracking.md
│   └── UI_UX_doc.md
├── .env.local                       ← Root environment variables (DATABASE_URL etc.)
├── .gitignore
├── .npmrc
├── turbo.json                       ← Turborepo pipeline config
├── package.json                     ← Root workspace package.json (Bun workspaces)
└── PRD.md                          ← Product Requirements Document
```

---

## Detailed Structure

### `apps/web/` — Next.js 15 Frontend

The frontend application uses the Next.js 15 App Router. Default to **Server Components** unless browser interactivity is required.

```
apps/web/
├── app/
│   ├── layout.tsx                   ← Root layout (Server Component)
│   ├── page.tsx                     ← Home page (Server Component — fetches weather)
│   ├── globals.css                  ← Global CSS (Tailwind directives)
│   └── api/
│       └── weather/
│           └── route.ts             ← Next.js Route Handler: proxies Open-Meteo API
├── components/
│   ├── map/
│   │   ├── TpsMap.tsx               ← [CLIENT "use client"] mapcn map wrapper
│   │   ├── TpsMarker.tsx            ← [CLIENT] Individual TPS marker with popup
│   │   └── WeatherRadarLayer.tsx    ← [CLIENT] RainViewer radar layer toggle
│   └── ui/                         ← Shadcn UI auto-generated components
├── lib/
│   └── api-client.ts               ← Typed fetch helpers for /api/drop-offs
├── public/
│   └── ...                         ← Static assets
├── .gitignore
├── components.json                  ← Shadcn UI config
├── tailwind.config.ts               ← Tailwind CSS config
├── next.config.js
├── tsconfig.json
└── package.json
```

**Key Boundaries (enforced by `workflow.md`):**
| File Type | Rule |
|---|---|
| `app/page.tsx` | Server Component — fetches Open-Meteo, passes data as props |
| `components/map/TpsMap.tsx` | Must have `"use client"` — uses `mapcn` (browser API) |
| `app/api/weather/route.ts` | Server-only — never exposes API keys |

---

### `apps/api/` — Fastify Backend API

```
apps/api/
├── src/
│   ├── db/
│   │   ├── schema.ts                ← Drizzle ORM table definitions (bali_*)
│   │   ├── index.ts                 ← Neon connection + fallback shield
│   │   └── test-connection.ts      ← Connectivity verification script
│   ├── repositories/
│   │   └── dropOffRepository.ts    ← Data Access Layer (enforces soft-delete filter)
│   └── server.ts                   ← Fastify entry point + route registration
├── drizzle.config.ts                ← Drizzle Kit config (points to root .env.local)
├── tsconfig.json
├── package.json
└── index.ts                        ← Bun default entry (can re-export server)
```

**Key Patterns:**
| Pattern | Location | Purpose |
|---|---|---|
| Repository Pattern | `src/repositories/` | Prevents soft-deleted records from leaking into API responses |
| Fallback Shield | `src/db/index.ts` | Prevents crashes when `DATABASE_URL` is not set |
| Table Filter | `drizzle.config.ts` | `tablesFilter: ["bali_*"]` — protects unrelated DB tables |

---

### `packages/` — Shared Workspace Packages

```
packages/
├── ui/
│   ├── src/
│   │   └── components/             ← Shared React components (if any cross-app)
│   ├── package.json
│   └── tsconfig.json
├── eslint-config/
│   ├── index.js                    ← Shared ESLint rules
│   └── package.json
└── typescript-config/
    ├── base.json                   ← Base TS config
    ├── nextjs.json                 ← Next.js-specific TS config
    └── package.json
```

---

## File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| React Components | PascalCase | `TpsMap.tsx`, `WeatherRadarLayer.tsx` |
| Utility/Helper files | camelCase | `api-client.ts`, `index.ts` |
| DB Schema | camelCase columns, snake_case tables | `bali_tps`, `capacityStatus` |
| Config files | kebab-case or dot-prefix | `drizzle.config.ts`, `.env.local` |
| Documentation | PascalCase or snake_case | `Implementation.md`, `Bug_tracking.md` |

---

## Environment Variables

```
# .env.local (root of wasteviz/)
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
```

> ⚠️ **NEVER import `process.env.DATABASE_URL` from any file inside `apps/web/`**. Only `apps/api/src/db/index.ts` is allowed to read this variable.

---

## Build & Deployment Structure

```
turbo.json                           ← Defines pipeline: build → lint → test
package.json (root)                  ← Workspace root — never install app deps here
```

**Pipeline:**
- `turbo build` → builds `apps/web` (Next.js) then `apps/api` (tsc)
- `turbo dev` → runs `next dev` (web) + `bun run src/server.ts` (api) in parallel
- `bunx drizzle-kit push` → applies schema changes (run from `apps/api/`)

---

*Last Updated: 2026-03-05*
