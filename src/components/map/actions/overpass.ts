"use server";

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter'
];

export async function fetchOverpass(query: string) {
  const body = `data=${encodeURIComponent(query)}`;
  
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'PropertX/1.0 (Next.js server-side fetch)'
        },
        body,
        cache: 'no-store' // Avoid caching stale POIs forever
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      console.warn(`Server Action: Endpoint ${endpoint} returned status ${response.status}`);
    } catch (err) {
      console.warn(`Server Action: Endpoint ${endpoint} failed`, err);
    }
  }
  
  return null;
}
