import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import { GeocodingService } from '../services/GeocodingService';
import type { Province } from '../data/provinces';

interface ProvinceMaskProps {
  selectedProvince: Province | null;
}

export default function ProvinceMask({ selectedProvince }: ProvinceMaskProps) {
  const [geoData, setGeoData] = useState<any | null>(null);

  useEffect(() => {
    if (!selectedProvince || selectedProvince.id === 'all') {
      setGeoData(null);
      return;
    }

    let isMounted = true;
    setGeoData(null); // Clear previous mask while loading the new one

    async function fetchMask() {
      // Fetch the province polygon from Nominatim
      const geojson = await GeocodingService.getProvinceGeoJSON(selectedProvince!.name);
      
      if (!isMounted) return;
      if (!geojson) {
        setGeoData(null);
        return;
      }

      // Create an inverted polygon mask
      // Outer ring: a massive box covering everything
      const worldRing = [
        [[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]]
      ];

      let rings: number[][][] = [...worldRing];

      // Add the province boundaries as "holes" (inner rings)
      if (geojson.type === 'Polygon') {
        rings = rings.concat(geojson.coordinates);
      } else if (geojson.type === 'MultiPolygon') {
        geojson.coordinates.forEach((polygon: any) => {
          rings = rings.concat(polygon);
        });
      }

      const maskGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: rings
            },
            properties: {}
          }
        ]
      };

      setGeoData(maskGeoJSON);
    }

    fetchMask();

    return () => {
      isMounted = false;
    };
  }, [selectedProvince]);

  if (!geoData) return null;

  return (
    <GeoJSON 
      key={selectedProvince?.id} 
      data={geoData} 
      style={{
        fillColor: '#0f172a', // Dark theme slate background
        fillOpacity: 0.75, // Grays out everything outside the province
        color: '#3b82f6', // Nice blue stroke for the province edge
        weight: 3,
        fillRule: 'evenodd'
      }} 
    />
  );
}
