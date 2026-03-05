export interface WeatherData {
  latitude: number;
  longitude: number;
  condition: string;
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  precipitation: number;
  locationName?: string;
}

export function getWmoCondition(code: number): string {
  if (code === 0) return "Clear Sky";
  if (code >= 1 && code <= 3) return "Partly Cloudy";
  if (code >= 45 && code <= 48) return "Fog";
  if (code >= 51 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 95 && code <= 99) return "Thunderstorm";
  return "Unknown";
}

export async function getWeatherForLocation(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m`,
      {
        cache: "no-store",
        next: { revalidate: 300 }, // optionally refresh cache
      }
    );

    if (!res.ok) return null;
    const data = await res.json();

    if (data && data.current) {
      // Fetch reverse geocoding to get human-readable location name
      let locationName = "Bali Region";
      try {
        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
          { cache: "no-store" } // optional
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          locationName = geoData.locality || geoData.city || geoData.principalSubdivision || "Bali Region";
        }
      } catch (geoErr) {
        console.error("Reverse geocode fetch error:", geoErr);
      }

      return {
        latitude: lat,
        longitude: lng,
        condition: getWmoCondition(data.current.weather_code),
        temperature: data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        windSpeed: data.current.wind_speed_10m,
        precipitation: data.current.precipitation,
        locationName,
      };
    }

    return null;
  } catch (error) {
    console.error("Open-Meteo fetch error:", error);
    return null;
  }
}

export async function fetchRadarTimestamp(): Promise<number | null> {
  try {
    const res = await fetch("https://api.rainviewer.com/public/weather-maps.json", {
      next: { revalidate: 600 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.radar?.past?.[data?.radar?.past?.length - 1]?.time || null;
  } catch (error) {
    console.error("RainViewer timestamp fetch error:", error);
    return null;
  }
}

