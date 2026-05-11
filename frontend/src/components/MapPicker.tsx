"use client";
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useEffect, useMemo, useCallback } from "react";

// Fix for default marker icons in Leaflet with React
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const userIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Helper to calculate area in hectares for a set of LatLng points
const calculateArea = (coords: L.LatLng[]) => {
  if (coords.length < 3) return 0;
  
  let area = 0;
  const R = 6378137; // Earth radius in meters
  
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    
    // Simple planar approximation for small areas
    const x1 = p1.lng * Math.PI / 180 * R * Math.cos(p1.lat * Math.PI / 180);
    const y1 = p1.lat * Math.PI / 180 * R;
    const x2 = p2.lng * Math.PI / 180 * R * Math.cos(p2.lat * Math.PI / 180);
    const y2 = p2.lat * Math.PI / 180 * R;
    
    area += (x1 * y2 - x2 * y1);
  }
  
  return Math.abs(area / 2) / 10000; // Return in hectares
};

interface MapPickerProps {
  onPointsSelected: (points: [number, number][]) => void;
  maxPoints?: number;
}

function MapEvents({ onMapClick, onLocationFound }: { 
  onMapClick: (latlng: L.LatLng) => void;
  onLocationFound: (latlng: L.LatLng) => void;
}) {
  const map = useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
    locationfound: (e) => {
      onLocationFound(e.latlng);
      map.flyTo(e.latlng, 18);
    },
  });
  return null;
}

export default function MapPicker({ onPointsSelected, maxPoints = 4 }: MapPickerProps) {
  const [points, setPoints] = useState<L.LatLng[]>([]);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mapKey = useMemo(() => `map-${Date.now()}`, []);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const area = useMemo(() => calculateArea(points), [points]);

  // Fix for map rendering issues in modals (invalidateSize)
  useEffect(() => {
    if (mounted && mapInstance) {
      setTimeout(() => {
        mapInstance.invalidateSize();
      }, 300);
    }
  }, [mounted, mapInstance]);

  if (!mounted) return <div className="h-[450px] w-full bg-gray-100 rounded-[40px] animate-pulse" />;

  const handleMapClick = (latlng: L.LatLng) => {
    if (points.length < maxPoints) {
      const newPoints = [...points, latlng];
      setPoints(newPoints);
      onPointsSelected(newPoints.map(p => [p.lat, p.lng]));
    }
  };

  const handleMarkerDrag = (index: number, latlng: L.LatLng) => {
    const newPoints = [...points];
    newPoints[index] = latlng;
    setPoints(newPoints);
    onPointsSelected(newPoints.map(p => [p.lat, p.lng]));
  };

  const removeMarker = (index: number) => {
    const newPoints = points.filter((_, i) => i !== index);
    setPoints(newPoints);
    onPointsSelected(newPoints.map(p => [p.lat, p.lng]));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstance) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCenter = new L.LatLng(parseFloat(lat), parseFloat(lon));
        mapInstance.flyTo(newCenter, 16);
      } else {
        alert("Location not found");
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const locateUser = () => {
    if (mapInstance) {
      mapInstance.locate({ setView: true, maxZoom: 18 });
    }
  };

  const clearPoints = () => {
    setPoints([]);
    onPointsSelected([]);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <style jsx global>{`
        .leaflet-container img {
          max-width: none !important;
          max-height: none !important;
        }
        .leaflet-control-layers-toggle {
          background-size: 20px 20px !important;
        }
      `}</style>
      <form onSubmit={handleSearch} className="relative group">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search location (e.g. village name)..."
          className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none transition-all pr-12 text-sm font-medium"
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all"
        >
          {isSearching ? <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /> : "🔍"}
        </button>
      </form>

      <div className="h-[300px] sm:h-[450px] w-full rounded-[30px] sm:rounded-[40px] overflow-hidden border-4 border-white shadow-2xl relative group">
        <MapContainer
          key={mapKey}
          center={[12.9716, 77.5946]} 
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          ref={setMapInstance}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <LayersControl position="topleft">
            <LayersControl.BaseLayer checked name="Street View">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite View">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          <MapEvents 
            onMapClick={handleMapClick} 
            onLocationFound={(latlng) => setUserLocation(latlng)} 
          />
          
          {/* userLocation marker removed to avoid confusion with field points */}

          {points.map((p, i) => (
            <Marker 
              key={`${i}-${p.lat}`} 
              position={p} 
              icon={defaultIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => handleMarkerDrag(i, e.target.getLatLng()),
                click: () => removeMarker(i)
              }}
            />
          ))}

          {points.length > 1 && (
            <Polygon 
              positions={points.map(p => [p.lat, p.lng])} 
              pathOptions={{ 
                color: '#22c55e', 
                fillColor: '#22c55e', 
                fillOpacity: 0.3,
                weight: 3,
                dashArray: '5, 10'
              }}
            />
          )}
        </MapContainer>

        {/* Improved Floating Controls */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-[1000] flex flex-col gap-2 sm:gap-3">
          <div className="bg-white/95 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-3 rounded-2xl sm:rounded-3xl shadow-xl border border-white text-center flex flex-col items-center">
            <span className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">Area</span>
            <span className="text-sm sm:text-lg font-black text-green-700">{area.toFixed(2)} ha</span>
          </div>

          <div className="flex flex-col gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => mapInstance?.zoomIn()}
              className="bg-white/90 backdrop-blur-md hover:bg-white text-gray-700 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl shadow-xl border border-white transition-all active:scale-90 flex items-center justify-center text-lg sm:text-xl font-bold"
              title="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => mapInstance?.zoomOut()}
              className="bg-white/90 backdrop-blur-md hover:bg-white text-gray-700 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl shadow-xl border border-white transition-all active:scale-90 flex items-center justify-center text-lg sm:text-xl font-bold"
              title="Zoom Out"
            >
              −
            </button>
            <button
              type="button"
              onClick={locateUser}
              className="bg-white/90 backdrop-blur-md hover:bg-white text-blue-600 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl shadow-xl border border-white transition-all active:scale-90 flex items-center justify-center text-lg sm:text-xl"
              title="My Location"
            >
              📍
            </button>
          </div>
        </div>

        {/* Tip Overlay */}
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none w-[90%] sm:w-auto">
          <div className="bg-black/60 backdrop-blur-md px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-white text-[8px] sm:text-[10px] font-bold uppercase tracking-widest border border-white/20 text-center">
            {points.length === 0 ? "Tap to mark" : "Drag to adjust • Tap to remove"}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-2">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${points.length >= 3 ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
          <p className="text-xs text-gray-600 font-bold">
            {points.length < 3 
              ? `Need ${3 - points.length} more points for boundary` 
              : "Boundary complete"}
          </p>
        </div>
        {points.length > 0 && (
          <button 
            type="button"
            onClick={clearPoints}
            className="text-xs font-black text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors"
          >
            Reset All
          </button>
        )}
      </div>
    </div>
  );
}
