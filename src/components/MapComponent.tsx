"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Icon } from '@/components/Icon';

// Fix Leaflet's default icon path issues in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle smooth flying to new coordinates
function FlyToLocation({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], map.getZoom(), {
      animate: true,
      duration: 1.5 // seconds
    });
  }, [lat, lon, map]);
  return null;
}

interface MapProps {
  lat: number;
  lon: number;
  isLive: boolean;
  onRecenter: () => void;
}

export default function FarmMap({ lat, lon, isLive, onRecenter }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted gap-2 bg-light">
        <div className="spinner-border spinner-border-sm text-success" />
        <span className="small fw-medium">Initializing map engine…</span>
      </div>
    );
  }

  return (
    <div className="position-relative w-100 h-100">
      <MapContainer
        center={[lat, lon]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={false} // We can add custom controls if needed
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FlyToLocation lat={lat} lon={lon} />
        
        <Marker position={[lat, lon]} icon={defaultIcon}>
          <Popup className="custom-leaflet-popup">
            <div className="text-center">
              <strong>Your Farm Location</strong><br/>
              <span className="text-muted small">
                {lat.toFixed(4)}, {lon.toFixed(4)}
              </span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Floating Controls Overlay */}
      <div className="position-absolute bottom-0 end-0 m-2 d-flex flex-column gap-2" style={{ zIndex: 400 }}>
        <button
          onClick={(e) => {
            e.preventDefault();
            onRecenter();
          }}
          className="btn btn-light shadow-sm rounded-circle d-flex align-items-center justify-content-center p-0"
          style={{ width: '40px', height: '40px', border: '1px solid #dee2e6' }}
          title="Recenter to my active GPS location"
        >
          <Icon name="my_location" className={isLive ? "text-success" : "text-muted"} style={{ fontSize: '20px' }} />
        </button>
      </div>
      
      <style>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          padding: 4px;
        }
        .leaflet-container {
          font-family: 'Inter', sans-serif !important;
        }
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: rgba(255, 255, 255, 0.7) !important;
          border-top-left-radius: 4px;
        }
      `}</style>
    </div>
  );
}
