export const dynamic = "force-dynamic";

import React from "react";
import { InteractiveTpsMap } from "@/components/InteractiveTpsMap";
import { TPSLocation, TPSDropOff } from "@/components/InteractiveTpsMap";
import { getWeatherForLocation } from "@/lib/weather";

// Pre-define the default center as requested: Denpasar [-8.6500, 115.2167]
const DENPASAR_CENTER: [number, number] = [-8.65, 115.2167];

async function fetchTpsData(): Promise<TPSLocation[]> {
  try {
    // const res = await fetch("http://localhost:4000/api/tps", { cache: "no-store" });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/tps`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error("Failed to fetch TPS");
    return await res.json();
  } catch (error) {
    console.error("Fastify TPS fetch error:", error);
    return [];
  }
}

async function fetchDropOffData(): Promise<TPSDropOff[]> {
  try {
    // const res = await fetch("http://localhost:4000/api/drop-offs", { cache: "no-store" });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/drop-offs`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error("Failed to fetch drop-offs");
    return await res.json();
  } catch (error) {
    console.error("Fastify dropoffs fetch error:", error);
    return [];
  }
}

export default async function HomePage() {
  // Fetch everything concurrently from the server
  const [tpsData, dropOffData, weatherData] = await Promise.all([
    fetchTpsData(),
    fetchDropOffData(),
    getWeatherForLocation(DENPASAR_CENTER[0], DENPASAR_CENTER[1]),
  ]);

  return (
    <main className="h-screen max-h-screen bg-background text-foreground flex flex-col pt-6 px-6 md:pt-10 md:px-10 pb-6 md:pb-10 overflow-hidden">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          WasteViz Operations Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Live monitoring of waste drop-offs and capacity levels across{" "}
          {tpsData.length} locations.
        </p>
      </header>

      <section className="flex-1 flex gap-4 min-h-0">
        <InteractiveTpsMap
          tpsData={tpsData}
          dropOffData={dropOffData}
          weatherData={weatherData}
          initialCenter={DENPASAR_CENTER}
        />
      </section>
    </main>
  );
}
