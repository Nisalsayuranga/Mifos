import { GeocodingService, type GeocodingResult } from './GeocodingService';

export const SearchService = {
  /**
   * Search for a location in Sri Lanka and caches the result.
   */
  async searchLocation(query: string): Promise<GeocodingResult[]> {
    return GeocodingService.search(query);
  }
};
