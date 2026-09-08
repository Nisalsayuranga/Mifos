import type { CategoryConfig } from '../config/categories';
import { fetchOverpass } from '../actions/overpass';

export interface PoiItem {
  id: number;
  lat: number;
  lon: number;
  name: string;
  category: string; // The ID of the category from config
  tags: Record<string, string>;
  distance?: number; // Distance in meters from the selected land
}

export const PoiService = {
  /**
   * Fetches Points of Interest around a specific coordinate within a radius for multiple categories at once.
   * This prevents rate-limiting issues by combining all queries into a single Overpass API request.
   */
  async fetchAllPoisNearLocation(
    lat: number,
    lon: number,
    radius: number,
    categories: CategoryConfig[]
  ): Promise<PoiItem[]> {
    if (categories.length === 0) return [];

    // Build the query string for Overpass combining all tags
    // e.g., node["amenity"="hospital"](around:radius,lat,lon);
    const tagQueries = categories.flatMap(cat => 
      cat.queryTags.map(tag => {
        const [k, v] = tag.split('=');
        return `node["${k}"="${v}"](around:${radius},${lat},${lon});\nway["${k}"="${v}"](around:${radius},${lat},${lon});`;
      })
    ).join('\n');

    const query = `
      [out:json][timeout:25];
      (
        ${tagQueries}
      );
      out center;
    `;

    const successData = await fetchOverpass(query);

    if (!successData) {
      console.error('All Overpass API endpoints failed or timed out.');
      return [];
    }

    try {
      const pois: PoiItem[] = successData.elements.map((el: any) => {
        const elLat = el.lat || (el.center && el.center.lat);
        const elLon = el.lon || (el.center && el.center.lon);
        
        // Determine category based on tags
        let matchedCategory = categories[0].id; // Fallback
        for (const cat of categories) {
          if (cat.queryTags.some(tagStr => {
            const [k, v] = tagStr.split('=');
            return el.tags && el.tags[k] === v;
          })) {
            matchedCategory = cat.id;
            break;
          }
        }
        
        return {
          id: el.id,
          lat: elLat,
          lon: elLon,
          name: el.tags?.name || `Unnamed Facility`,
          category: matchedCategory,
          tags: el.tags || {}
        };
      }).filter((poi: PoiItem) => poi.lat && poi.lon);

      return pois;
    } catch (error) {
      console.error('Error parsing POIs:', error);
      return [];
    }
  }
};

