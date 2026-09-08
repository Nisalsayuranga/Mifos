import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type { PoiItem } from '../../services/PoiService';
import { MarkerService } from '../../services/MarkerService';
import { POI_CATEGORIES } from '../../config/categories';

interface PoiMarkersProps {
  pois: PoiItem[];
  onMarkerClick: (poi: PoiItem) => void;
}

export default function PoiMarkers({ pois, onMarkerClick }: PoiMarkersProps) {
  
  // Memoize icon creation so we don't recreate Leaflet icons on every render unnecessarily,
  // though Leaflet handles same-options fairly well, it's good practice.
  const iconsByCategory = useMemo(() => {
    const iconMap: Record<string, L.DivIcon> = {};
    POI_CATEGORIES.forEach(cat => {
      iconMap[cat.id] = MarkerService.createCategoryIcon(cat.color, cat.icon);
    });
    return iconMap;
  }, []);

  return (
    <MarkerClusterGroup 
      chunkedLoading
      maxClusterRadius={40}
      showCoverageOnHover={false}
    >
      {pois.map(poi => {
        const icon = iconsByCategory[poi.category] || MarkerService.defaultIcon;
        return (
          <Marker 
            key={poi.id} 
            position={[poi.lat, poi.lon]} 
            icon={icon}
            eventHandlers={{
              click: () => onMarkerClick(poi)
            }}
          >
            <Popup className="poi-popup">
              <div className="popup-content">
                <strong>{poi.name}</strong>
                <span className="popup-category">
                  {POI_CATEGORIES.find(c => c.id === poi.category)?.name}
                </span>
                {poi.distance && (
                  <span className="popup-distance">
                    {(poi.distance / 1000).toFixed(2)} km away
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
}
