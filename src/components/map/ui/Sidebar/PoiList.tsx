import type { PoiItem } from '../../services/PoiService';
import { Navigation2 } from 'lucide-react';
import { POI_CATEGORIES } from '../../config/categories';

interface PoiListProps {
  pois: PoiItem[];
  isLoading: boolean;
  onViewRoute: (poi: PoiItem) => void;
  activeRouteId?: number | null;
}

export default function PoiList({ pois, isLoading, onViewRoute, activeRouteId }: PoiListProps) {
  if (isLoading) {
    return (
      <div className="poi-list loading-state">
        <div className="spinner"></div>
        <p>Analyzing surrounding area...</p>
      </div>
    );
  }

  if (pois.length === 0) {
    return (
      <div className="poi-list empty-state">
        <p>No facilities found in the selected radius for active categories.</p>
      </div>
    );
  }

  // Sort by distance
  const sortedPois = [...pois].sort((a, b) => (a.distance || 0) - (b.distance || 0));

  return (
    <div className="poi-list">
      <h3 className="section-title">Found {pois.length} Facilities</h3>
      <div className="poi-cards-container">
        {sortedPois.map(poi => {
          const category = POI_CATEGORIES.find(c => c.id === poi.category);
          const Icon = category?.icon;
          const isActiveRoute = activeRouteId === poi.id;
          
          return (
            <div key={poi.id} className={`poi-card ${isActiveRoute ? 'active-route' : ''}`}>
              <div className="poi-card-header">
                <div className="poi-icon" style={{ backgroundColor: `${category?.color}20`, color: category?.color }}>
                  {Icon && <Icon size={18} />}
                </div>
                <div className="poi-info">
                  <h4>{poi.name}</h4>
                  <span className="poi-category-label">{category?.name}</span>
                </div>
              </div>
              <div className="poi-card-footer">
                <span className="poi-distance">
                  {poi.distance ? `${(poi.distance / 1000).toFixed(2)} km` : 'Unknown dist'}
                </span>
                <button 
                  className="route-btn" 
                  onClick={() => onViewRoute(poi)}
                  style={{ 
                    backgroundColor: isActiveRoute ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                    color: isActiveRoute ? '#fff' : 'var(--text-light)'
                  }}
                >
                  <Navigation2 size={14} />
                  {isActiveRoute ? 'Active Route' : 'Route'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
