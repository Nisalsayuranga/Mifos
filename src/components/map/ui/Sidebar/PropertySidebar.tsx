import { MapPin } from 'lucide-react';
import CategoryFilters from './CategoryFilters';
import PoiList from './PoiList';
import type { PoiItem } from '../../services/PoiService';
import SearchAutocomplete from '../SearchAutocomplete';
import type { GeocodingResult } from '../../services/GeocodingService';

interface PropertySidebarProps {
  selectedLocation: [number, number] | null;
  radius: number;
  onRadiusChange: (radius: number) => void;
  enabledCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  pois: PoiItem[];
  isAnalyzing: boolean;
  onViewRoute: (poi: PoiItem) => void;
  activeRouteId: number | null;
  onLocationSearch: (result: GeocodingResult) => void;
}

export default function PropertySidebar({
  selectedLocation,
  radius,
  onRadiusChange,
  enabledCategories,
  onToggleCategory,
  pois,
  isAnalyzing,
  onViewRoute,
  activeRouteId,
  onLocationSearch
}: PropertySidebarProps) {
  
  return (
    <div className="sidebar glass-panel property-sidebar">
      <div className="sidebar-header">
        <h1>Location Intelligence</h1>
        <p>PROPIX Property Analyzer</p>
      </div>

      <div className="control-group">
        <label>Search Location</label>
        <SearchAutocomplete onSelect={onLocationSearch} />
      </div>

      {!selectedLocation ? (
        <div className="empty-selection-state">
          <MapPin size={48} className="empty-icon" />
          <p>Select a location on the map or search to analyze its surroundings.</p>
        </div>
      ) : (
        <>
          <div className="control-group radius-selector">
            <label>Analysis Radius</label>
            <div className="radius-options">
              {[500, 1000, 2000, 5000, 10000].map(r => (
                <button
                  key={r}
                  className={`radius-btn ${radius === r ? 'active' : ''}`}
                  onClick={() => onRadiusChange(r)}
                >
                  {r >= 1000 ? `${r/1000}km` : `${r}m`}
                </button>
              ))}
            </div>
          </div>

          <CategoryFilters 
            enabledCategories={enabledCategories} 
            onToggleCategory={onToggleCategory} 
          />

          <PoiList 
            pois={pois} 
            isLoading={isAnalyzing} 
            onViewRoute={onViewRoute} 
            activeRouteId={activeRouteId}
          />
        </>
      )}
    </div>
  );
}
