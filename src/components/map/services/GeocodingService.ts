export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
  address?: {
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state_district?: string;
    state?: string; // Province
    postcode?: string;
    road?: string;
    country?: string;
  };
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export const GeocodingService = {
  /**
   * Forward geocoding: Get coordinates from an address string.
   * Hardcoded to strictly search within Sri Lanka (countrycodes=lk).
   */
  async search(query: string): Promise<GeocodingResult[]> {
    if (!query.trim()) return [];
    
    try {
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=lk`
      );
      
      if (!response.ok) throw new Error('Geocoding request failed');
      
      const data = await response.json();
      return data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        displayName: item.display_name,
        address: item.address,
      }));
    } catch (error) {
      console.error('Geocoding search error:', error);
      return [];
    }
  },

  /**
   * Reverse geocoding: Get address from coordinates.
   */
  async reverse(lat: number, lon: number): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
      );
      
      if (!response.ok) throw new Error('Reverse geocoding request failed');
      
      const item = await response.json();
      if (item.error) return null;
      
      return {
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        displayName: item.display_name,
        address: item.address,
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  },

  /**
   * Fetches the GeoJSON boundary for a specific province
   */
  async getProvinceGeoJSON(provinceName: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(provinceName)},Sri+Lanka&format=json&polygon_geojson=1&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!response.ok) return null;
      const data = await response.json();
      if (data && data.length > 0 && data[0].geojson) {
        return data[0].geojson;
      }
      return null;
    } catch (error) {
      console.error('GeoJSON fetch error:', error);
      return null;
    }
  }
};
