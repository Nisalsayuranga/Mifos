"use client";
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { RoutingService, type RouteStep } from './services/RoutingService';
import { SRI_LANKA_BOUNDS, SRI_LANKA_CENTER, MIN_ZOOM, calculateHaversineDistance } from './services/MapService';
import { MarkerService } from './services/MarkerService';
import { PoiService, type PoiItem } from './services/PoiService';
import type { GeocodingResult } from './services/GeocodingService';
import { POI_CATEGORIES } from './config/categories';
import PropertySidebar from './ui/Sidebar/PropertySidebar';
import PoiMarkers from './ui/Map/PoiMarkers';
import RouteDirections from './ui/RouteDirections';
import '@/app/map/map.css';

function MapController({ 
  setSelectedLocation,
  selectedLocation
}: { 
  setSelectedLocation: (pos: [number, number]) => void;
  selectedLocation: [number, number] | null;
}) {
  const map = useMapEvents({
    click(e) {
      setSelectedLocation([e.latlng.lat, e.latlng.lng]);
    },
  });

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo(selectedLocation, 14, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [selectedLocation, map]);

  return null;
}

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState<number>(1000);
  const [enabledCategories, setEnabledCategories] = useState<string[]>(
    POI_CATEGORIES.filter(c => c.defaultEnabled).map(c => c.id)
  );
  
  const [pois, setPois] = useState<PoiItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [activeRouteId, setActiveRouteId] = useState<number | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);

  // Fetch POIs when location, radius, or categories change
  useEffect(() => {
    let isMounted = true;
    
    const analyzeLocation = async () => {
      if (!selectedLocation) {
        setPois([]);
        return;
      }
      
      setIsAnalyzing(true);
      
      try {
        const allPois: PoiItem[] = [];
        
        const activeCategoryConfigs = enabledCategories
          .map(id => POI_CATEGORIES.find(c => c.id === id))
          .filter(Boolean) as typeof POI_CATEGORIES;

        const results = await PoiService.fetchAllPoisNearLocation(
          selectedLocation[0],
          selectedLocation[1],
          radius,
          activeCategoryConfigs
        );
        
        results.forEach(poi => {
          // Calculate distance from selected land
          poi.distance = calculateHaversineDistance(
            selectedLocation[0], selectedLocation[1],
            poi.lat, poi.lon
          ) * 1000; // convert to meters
          allPois.push(poi);
        });
        
        if (isMounted) {
          setPois(allPois);
        }
      } catch (error) {
        console.error("Error analyzing location:", error);
      } finally {
        if (isMounted) setIsAnalyzing(false);
      }
    };

    // Debounce the fetching slightly
    const timeoutId = setTimeout(analyzeLocation, 500);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [selectedLocation, radius, enabledCategories]);

  // Clear route if selected location changes
  useEffect(() => {
    setActiveRouteId(null);
    setRouteCoords(null);
    setRouteSteps([]);
  }, [selectedLocation]);

  const handleToggleCategory = (categoryId: string) => {
    setEnabledCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleLocationSearch = (result: GeocodingResult) => {
    setSelectedLocation([result.lat, result.lon]);
  };

  const handleViewRoute = async (poi: PoiItem) => {
    if (!selectedLocation) return;
    
    // Toggle off if already active
    if (activeRouteId === poi.id) {
      setActiveRouteId(null);
      setRouteCoords(null);
      setRouteSteps([]);
      return;
    }
    
    setActiveRouteId(poi.id);
    
    try {
      const data = await RoutingService.getRoute(
        selectedLocation, 
        [poi.lat, poi.lon], 
        'car'
      );
      
      if (data) {
        setRouteCoords(data.coordinates);
        setRouteSteps(data.steps || []);
      } else {
        alert("Could not calculate a route to this facility.");
        setActiveRouteId(null);
      }
    } catch (e) {
      console.error("Error routing:", e);
      alert("Error calculating route.");
      setActiveRouteId(null);
    }
  };

  return (
    <div className="app-container">
      <PropertySidebar 
        selectedLocation={selectedLocation}
        radius={radius}
        onRadiusChange={setRadius}
        enabledCategories={enabledCategories}
        onToggleCategory={handleToggleCategory}
        pois={pois}
        isAnalyzing={isAnalyzing}
        onViewRoute={handleViewRoute}
        activeRouteId={activeRouteId}
        onLocationSearch={handleLocationSearch}
      />

      {routeSteps.length > 0 && (
        <RouteDirections steps={routeSteps} />
      )}

      <div className="map-wrapper">
        <MapContainer 
          center={SRI_LANKA_CENTER} 
          zoom={8} 
          minZoom={MIN_ZOOM}
          maxBounds={SRI_LANKA_BOUNDS}
          maxBoundsViscosity={0.5}
          zoomControl={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          <MapController 
            setSelectedLocation={setSelectedLocation}
            selectedLocation={selectedLocation}
          />
          
          {selectedLocation && (
            <>
              <Marker 
                position={selectedLocation} 
                icon={MarkerService.dominantLandIcon} 
                zIndexOffset={1000}
              />
              <Circle 
                center={selectedLocation}
                radius={radius}
                pathOptions={{
                  color: '#6366f1',
                  fillColor: '#6366f1',
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 10'
                }}
              />
            </>
          )}

          <PoiMarkers 
            pois={pois}
            onMarkerClick={handleViewRoute}
          />
          
          {routeCoords && (
            <Polyline positions={routeCoords} color="#3b82f6" weight={5} opacity={0.8} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

