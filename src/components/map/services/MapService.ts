import L from 'leaflet';

export const SRI_LANKA_BOUNDS = L.latLngBounds(
  L.latLng(5.5, 79.0), // South-West (loosened)
  L.latLng(10.5, 82.5) // North-East (loosened)
);

export const SRI_LANKA_CENTER: [number, number] = [7.8731, 80.7718];
export const MIN_ZOOM = 7;

/**
 * Calculates straight-line distance between two points using the Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return parseFloat(distance.toFixed(2));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
