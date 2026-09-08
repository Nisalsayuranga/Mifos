export type RoutingProfile = 'car' | 'bike' | 'foot';

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  type: string;
  modifier?: string;
  name?: string;
}

export interface RouteData {
  coordinates: [number, number][]; // [lat, lon]
  distance: number; // in meters
  duration: number; // in seconds
  steps: RouteStep[];
}

export const RoutingService = {
  /**
   * Fetches a route between two points using OSRM public API.
   */
  async getRoute(
    start: [number, number], // [lat, lon]
    end: [number, number],
    profile: RoutingProfile = 'car'
  ): Promise<RouteData | null> {
    try {
      let osrmProfile = 'driving';
      if (profile === 'bike') osrmProfile = 'cycling';
      if (profile === 'foot') osrmProfile = 'walking';
      
      const url = `https://routing.openstreetmap.de/routed-${profile}/route/v1/${osrmProfile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Routing request failed');
      
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        return null;
      }
      
      const route = data.routes[0];
      
      // GeoJSON coordinates are [lon, lat], Leaflet expects [lat, lon]
      const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
      
      // Extract steps from the first leg
      const steps: RouteStep[] = [];
      if (route.legs && route.legs.length > 0 && route.legs[0].steps) {
        route.legs[0].steps.forEach((step: any) => {
          let instruction = step.maneuver.type;
          if (step.maneuver.modifier) {
            instruction += ` ${step.maneuver.modifier}`;
          }
          if (step.name) {
            instruction += ` onto ${step.name}`;
          }
          
          steps.push({
            distance: step.distance,
            duration: step.duration,
            instruction: instruction,
            type: step.maneuver.type,
            modifier: step.maneuver.modifier,
            name: step.name
          });
        });
      }

      return {
        coordinates,
        distance: route.distance,
        duration: route.duration,
        steps
      };
    } catch (error) {
      console.error('Routing error:', error);
      return null;
    }
  }
};
