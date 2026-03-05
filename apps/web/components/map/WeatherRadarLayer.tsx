"use client";

import { useMap } from "@/components/ui/map";
import { useEffect, useId } from "react";

interface WeatherRadarLayerProps {
  /** RainViewer timestamp */
  timestamp: number | null;
  /** Opacity from 0 to 1 */
  opacity?: number;
  /** Whether the layer is visible */
  visible?: boolean;
}

/**
 * RainViewer Weather Radar Layer
 */
export function WeatherRadarLayer({
  timestamp,
  opacity = 0.6,
  visible = true,
}: WeatherRadarLayerProps) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `radar-source-${id}`;
  const layerId = `radar-layer-${id}`;

  useEffect(() => {
    if (!isLoaded || !map || !timestamp) return;

    const radarUrl = `https://tilecache.rainviewer.com/v2/radar/${timestamp}/256/{z}/{x}/{y}/2/1_1.png`;

    try {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "raster",
          tiles: [radarUrl],
          tileSize: 256,
        });

        map.addLayer({
          id: layerId,
          type: "raster",
          source: sourceId,
          layout: {
            visibility: visible ? "visible" : "none",
          },
          paint: {
            "raster-opacity": opacity,
          },
        });
      }
    } catch (err) {
      console.error("Error adding radar layer:", err);
    }

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // ignore
      }
    };
  }, [isLoaded, map, timestamp, sourceId, layerId]);

  useEffect(() => {
    if (!isLoaded || !map || !map.getLayer(layerId)) return;

    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
    map.setPaintProperty(layerId, "raster-opacity", opacity);
  }, [isLoaded, map, layerId, visible, opacity]);

  return null;
}
