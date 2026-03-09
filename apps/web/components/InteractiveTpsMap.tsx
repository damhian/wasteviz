"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Map,
  MapMarker,
  MarkerPopup,
  MapControls,
  MarkerContent,
  type MapViewport,
  type MapRef,
} from "@/components/ui/map";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CloudRainWind, ThermometerSun } from "lucide-react";
import { WeatherData } from "@/lib/weather";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchDynamicWeather } from "@/app/actions/weather";

export interface TPSLocation {
  id: number;
  name: string;
  lat: number;
  lng: number;
  capacityStatus: string;
  maxCapacityKg: number;
}

export interface TPSDropOff {
  id: number;
  tpsId: number;
  driverName: string;
  volumeKg: number;
  droppedAt: string;
}

interface InteractiveTpsMapProps {
  tpsData: TPSLocation[];
  dropOffData: TPSDropOff[];
  weatherData?: WeatherData | null;
  initialCenter: [number, number]; // [lat, lng] format
}

export function InteractiveTpsMap({
  tpsData,
  dropOffData,
  weatherData,
  initialCenter,
}: InteractiveTpsMapProps) {
  const [localWeather, setLocalWeather] = useState<WeatherData | null>(
    weatherData || null,
  );
  const [viewport, setViewport] = useState<MapViewport>({
    center: [initialCenter[1], initialCenter[0]], // [lng, lat]
    zoom: 10,
    bearing: 0,
    pitch: 0,
  });
  const [selectedTpsId, setSelectedTpsId] = useState<number | null>(null);

  const handleSelectTps = (tps: TPSLocation) => {
    setSelectedTpsId(tps.id);
    mapRef.current?.flyTo({
      center: [Number(tps.lng), Number(tps.lat)],
      zoom: 14,
      duration: 1000,
    });
  };

  const styles = {
    default: undefined,
    openstreetmap: "https://tiles.openfreemap.org/styles/bright",
    openstreetmap3d: "https://tiles.openfreemap.org/styles/liberty",
  };

  type StyleKey = keyof typeof styles;

  const mapRef = useRef<MapRef>(null);
  const [style, setStyle] = useState<StyleKey>("default");
  const selectedStyle = styles[style];
  const is3D = style === "openstreetmap3d";

  useEffect(() => {
    mapRef.current?.easeTo({ pitch: is3D ? 60 : 0, duration: 500 });
  }, [is3D]);

  useEffect(() => {
    // Debounce the API call by 1000ms after the viewport center stops changing
    const timer = setTimeout(async () => {
      const [lng, lat] = viewport.center;
      const newWeather = await fetchDynamicWeather(lat, lng);
      if (newWeather) {
        setLocalWeather(newWeather);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [viewport.center]);

  const markers = useMemo(() => {
    return tpsData.map((tps) => {
      const relatedDropOffs = dropOffData.filter((d) => d.tpsId === tps.id);

      const lastDropOff =
        relatedDropOffs.length > 0
          ? new Date(
              Math.max(
                ...relatedDropOffs.map((e) => new Date(e.droppedAt).getTime()),
              ),
            )
          : null;

      // Calculate total volume received
      const totalVolume = relatedDropOffs.reduce(
        (sum, dropoff) => sum + dropoff.volumeKg,
        0,
      );

      let color = "#22c55e"; // OK - Green
      if (tps.capacityStatus === "WARNING") color = "#f59e0b"; // WARNING - Yellow
      if (tps.capacityStatus === "CRITICAL") color = "#ef4444"; // CRITICAL - Red

      return (
        <MapMarker
          key={tps.id}
          longitude={Number(tps.lng)}
          latitude={Number(tps.lat)}>
          <MarkerContent>
            <div
              className={`relative flex items-center justify-center cursor-pointer transition-transform duration-300 hover:z-50 ${selectedTpsId === tps.id ? "scale-150" : "hover:scale-125"}`}
              onClick={() => handleSelectTps(tps)}>
              {(tps.capacityStatus === "CRITICAL" ||
                tps.capacityStatus === "WARNING") && (
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: color }}
                />
              )}
              <div
                className={`relative h-4 w-4 rounded-full border-2 border-background shadow-md ${selectedTpsId === tps.id ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`}
                style={{ backgroundColor: color }}
              />
            </div>
          </MarkerContent>
          <MarkerPopup>
            <div className="flex flex-col gap-2 p-1 max-w-[200px] text-foreground">
              <h3 className="font-bold text-sm border-b border-border pb-1">
                {tps.name}
              </h3>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Capacity Status:</span>
                <span
                  className={`font-semibold ${
                    tps.capacityStatus === "CRITICAL"
                      ? "text-destructive"
                      : tps.capacityStatus === "WARNING"
                        ? "text-warning"
                        : "text-primary"
                  }`}>
                  {tps.capacityStatus}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Total Volume:</span>
                <span className="font-semibold">
                  {totalVolume.toFixed(2)} kg
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Location Max:</span>
                <span className="font-semibold">
                  {tps.maxCapacityKg?.toLocaleString() || "5,000"} kg
                </span>
              </div>

              {lastDropOff && (
                <div className="text-[10px] text-muted-foreground mt-1 border-t border-border/50 pt-1">
                  Last delivery: {lastDropOff.toLocaleString()}
                </div>
              )}
            </div>
          </MarkerPopup>
        </MapMarker>
      );
    });
  }, [tpsData, dropOffData, selectedTpsId]);

  return (
    <div className="flex flex-col md:flex-row w-full h-full gap-4">
      {/* Left Sidebar TPS List */}
      <Card className="w-full md:w-80 h-1/3 md:h-full flex flex-col shadow-md border-border overflow-hidden bg-card/95 backdrop-blur-sm">
        <div className="p-4 border-b border-border bg-muted/30 shrink-0">
          <h2 className="font-semibold tracking-tight text-lg">
            TPS Locations
          </h2>
          <p className="text-xs text-muted-foreground">
            {tpsData.length} facilities monitored
          </p>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 space-y-2">
            {tpsData.map((tps) => {
              const isSelected = selectedTpsId === tps.id;

              let badgeColor =
                "bg-green-500/20 text-green-700 dark:text-green-400";
              let dotColor = "bg-green-500";
              if (tps.capacityStatus === "WARNING") {
                badgeColor =
                  "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
                dotColor = "bg-yellow-500";
              }
              if (tps.capacityStatus === "CRITICAL") {
                badgeColor =
                  "bg-red-500/20 text-red-700 dark:text-red-400 animate-pulse";
                dotColor = "bg-red-500";
              }

              return (
                <button
                  key={tps.id}
                  onClick={() => handleSelectTps(tps)}
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 relative overflow-hidden group cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary/30 border shadow-sm"
                      : "hover:bg-muted border border-transparent"
                  }`}>
                  <div className="flex justify-between items-start mb-1.5">
                    <span
                      className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground group-hover:text-primary"} transition-colors`}>
                      {tps.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span
                      className={`flex w-fit items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${badgeColor}`}>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                      />
                      {tps.capacityStatus}
                    </span>

                    <span className="text-[10px] text-muted-foreground font-medium">
                      {dropOffData
                        .filter((d) => d.tpsId === tps.id)
                        .reduce((sum, d) => sum + d.volumeKg, 0)
                        .toFixed(0)}{" "}
                      kg
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </Card>

      {/* Map Container */}
      <div className="relative flex-1 h-full min-h-[400px] md:min-h-0 overflow-hidden isolate rounded-xl border border-border shadow-md">
        {/* Absolute Weather Dashboard Overlay */}
        {localWeather && (
          <Card className="absolute top-4 left-4 z-10 w-48 bg-[#0A2F1D]/90 backdrop-blur-md border-none text-white shadow-lg">
            <CardContent className="p-5 flex flex-col">
              <div className="flex justify-between items-start w-full">
                <ThermometerSun className="w-6 h-6 text-green-300 opacity-80" />
                <div className="text-right">
                  <span className="block font-bold text-md leading-tight tracking-wide">
                    {localWeather.locationName}
                  </span>
                  <span className="block font-bold text-md leading-tight tracking-wide text-green-100">
                    {localWeather.condition}
                  </span>
                  <span className="block text-2xl font-bold tracking-tighter mt-1">
                    {localWeather.temperature.toFixed(1)}°C
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-green-800/50 flex flex-col items-end gap-1">
                <span className="text-xs font-medium text-green-200/80">
                  Feels {localWeather.feelsLike.toFixed(1)}°C • Wind{" "}
                  {localWeather.windSpeed.toFixed(1)} km/h
                </span>
                {localWeather.precipitation > 0 && (
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1">
                    <CloudRainWind className="w-3 h-3" />{" "}
                    {localWeather.precipitation} mm rain
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Map
          viewport={viewport}
          onViewportChange={setViewport}
          ref={mapRef}
          styles={
            selectedStyle
              ? { light: selectedStyle, dark: selectedStyle }
              : undefined
          }
          theme="dark">
          <MapControls
            position="bottom-right"
            showCompass
            showZoom
            showFullscreen
          />
          {markers}
        </Map>
        <div className="absolute top-8 right-12 z-10 flex flex-col gap-2">
          {/* <select
            value={style}
            onChange={(e) => setStyle(e.target.value as StyleKey)}
            className="bg-white/40 backdrop-blur-md border border-white/40 text-gray-800 rounded-lg px-3 py-1.5 text-sm shadow-[0_4px_30px_rgba(0,0,0,0.1)] outline-none cursor-pointer hover:bg-white/50 transition-colors"
          >
            <option value="default">Default (Carto)</option>
            <option value="openstreetmap">OpenStreetMap</option>
            <option value="openstreetmap3d">OpenStreetMap 3D</option>
          </select> */}
          <Select
            value={style}
            onValueChange={(value) => setStyle(value as StyleKey)}>
            <SelectTrigger className="w-[200px] bg-white/40 backdrop-blur-md border border-white/40 text-gray-800 rounded-lg px-3 py-1.5 text-sm shadow-[0_4px_30px_rgba(0,0,0,0.1)] outline-none cursor-pointer hover:bg-white/50 transition-colors font-medium">
              <SelectValue placeholder="Select a map style" />
            </SelectTrigger>

            <SelectContent
              position="popper"
              side="bottom"
              sideOffset={4}
              className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl rounded-lg max-h-48 overflow-y-auto z-[9999]">
              <SelectItem
                value="default"
                className="cursor-pointer hover:bg-white/60 focus:bg-white/60 text-gray-900 font-medium">
                Default (Carto)
              </SelectItem>
              <SelectItem
                value="openstreetmap"
                className="cursor-pointer hover:bg-white/60 focus:bg-white/60 text-gray-900 font-medium">
                OpenStreetMap
              </SelectItem>
              <SelectItem
                value="openstreetmap3d"
                className="cursor-pointer hover:bg-white/60 focus:bg-white/60 text-gray-900 font-medium">
                OpenStreetMap 3D
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div
          className={`absolute bottom-9 left-1/2 -translate-x-1/2 z-10 flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono backdrop-blur-md px-3 py-2 rounded-xl border shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-colors duration-300 ${
            style === "default"
              ? "bg-black/50 border-white/10 text-gray-100" // Dark map styling
              : "bg-white/40 border-white/40 text-gray-800" // Light map styling
          }`}>
          <span>
            <span className="opacity-70">lang:</span>{" "}
            {viewport.center[0].toFixed(3)}
          </span>
          <span>
            <span className="opacity-70">lat:</span>{" "}
            {viewport.center[1].toFixed(3)}
          </span>
          <span>
            <span className="opacity-70">zoom:</span> {viewport.zoom.toFixed(1)}
          </span>
          <span>
            <span className="opacity-70">bearing:</span>{" "}
            {viewport.bearing.toFixed(1)}°
          </span>
          <span>
            <span className="opacity-70">pitch:</span>{" "}
            {viewport.pitch.toFixed(1)}°
          </span>
        </div>
      </div>
    </div>
  );
}
