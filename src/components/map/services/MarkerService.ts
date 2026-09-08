import L from 'leaflet';

export const MarkerService = {
  createCustomIcon(color: string) {
    return L.divIcon({
      className: 'custom-marker',
      html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3));">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="white" stroke="none"></circle>
      </svg>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });
  },

  get dominantLandIcon() {
    return L.divIcon({
      className: 'dominant-land-marker',
      html: `
        <div class="land-marker-pulse"></div>
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="#d95c14" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 8px 12px rgba(217, 92, 20, 0.5)); position: relative; z-index: 2;">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="4" fill="white"></circle>
        </svg>
      `,
      iconSize: [56, 56],
      iconAnchor: [28, 56],
      popupAnchor: [0, -56]
    });
  },

  createCategoryIcon(color: string, IconComponent: any) {
    return this.createCustomIcon(color);
  },

  get startIcon() {
    return this.createCustomIcon('#16a34a'); // Green 600
  },

  get endIcon() {
    return this.createCustomIcon('#dc2626'); // Red 600
  },
  
  get defaultIcon() {
    return this.createCustomIcon('#2563eb'); // Blue 600
  }
};
