# Product Requirements Document (PRD)
## Project Name: WasteViz TPS Dashboard (Assessment Edition)

### 🎯 Objective
To build a functional, localized waste management MVP that visualizes 'Tempat Pembuangan Sampah' (TPS) locations across Bali. The system integrates real-time weather data to provide operational warnings and features a secure data access layer for logging daily waste drop-offs.

### 👥 Target Audience
- Municipal Waste Managers
- Logistics Drivers & Fleet Operators
- Facility Admins

### 🌟 Core Features
1. **Interactive Geospatial Map (Client Component)**
   - Integration with `mapcn` (MapLibreGL).
   - Default map center: Denpasar, Bali [-8.6500, 115.2167].
   - Clickable markers for local TPS locations showing capacity and live weather warnings.

2. **Real-Time Weather Integration (Server Component)**
   - Secure server-side fetching from the free Open-Meteo API.

3. **Secure Drop-off Ledger (Fastify API & Drizzle ORM)**
   - "Soft Delete" (Archive) functionality for a strict audit trail.
   - Implementation of the Repository Pattern (Data Access Layer) to prevent deleted records from appearing in the UI.

### 🛠️ Tech Stack
- **Workspace Architecture:** Turborepo (Monorepo)
- **Frontend Framework:** Next.js 15 (App Router)
- **Backend API:** Fastify
- **Database Engine:** Neon (Serverless PostgreSQL)
- **Database ORM:** Drizzle ORM
- **Map Library:** `mapcn` (Powered by MapLibre GL JS - Remember to use [Lng, Lat] coordinates!)
- **Styling:** Tailwind CSS & Shadcn UI
- **Testing:** Vitest
- **Package Manager:** Bun
- **Language:** TypeScript