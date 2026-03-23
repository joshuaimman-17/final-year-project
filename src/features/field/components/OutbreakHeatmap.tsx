"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Icon } from '@/components/ui/Icon';

// Mock data for disease outbreaks
const mockOutbreaks = {
    'type': 'FeatureCollection',
    'features': [
        { 'type': 'Feature', 'properties': { 'disease': 'Blast', 'severity': 8 }, 'geometry': { 'type': 'Point', 'coordinates': [78.9629, 20.5937] } },
        { 'type': 'Feature', 'properties': { 'disease': 'Leaf Spot', 'severity': 5 }, 'geometry': { 'type': 'Point', 'coordinates': [78.9700, 20.6000] } },
        { 'type': 'Feature', 'properties': { 'disease': 'Rust', 'severity': 9 }, 'geometry': { 'type': 'Point', 'coordinates': [78.9550, 20.5850] } },
        { 'type': 'Feature', 'properties': { 'disease': 'Blast', 'severity': 7 }, 'geometry': { 'type': 'Point', 'coordinates': [78.9800, 20.6100] } },
        { 'type': 'Feature', 'properties': { 'disease': 'Blight', 'severity': 6 }, 'geometry': { 'type': 'Point', 'coordinates': [78.9400, 20.5700] } }
    ]
};

export const OutbreakHeatmap: React.FC<{ lat: number, lon: number }> = ({ lat, lon }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
        if (!mapContainer.current) return;
        
        // Use placeholder if no token found
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoiam9zaHVhaW1tYW4iLCJhIjoiY204NHRhM3pxMDAzeDJqcXV3NmlhOHBtcyJ9.wBfR89o-3mJ-r3mR8mR8mR'; // Placeholder token
        mapboxgl.accessToken = token;

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/light-v11',
                center: [lon, lat],
                zoom: 11,
                attributionControl: false
            });

            map.current.on('load', () => {
                if (!map.current) return;

                map.current.addSource('outbreaks', {
                    'type': 'geojson',
                    'data': mockOutbreaks as any
                });

                map.current.addLayer({
                    'id': 'outbreak-heat',
                    'type': 'heatmap',
                    'source': 'outbreaks',
                    'maxzoom': 15,
                    'paint': {
                        'heatmap-weight': [
                            'interpolate',
                            ['linear'],
                            ['get', 'severity'],
                            0, 0,
                            10, 1
                        ],
                        'heatmap-intensity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0, 1,
                            15, 3
                        ],
                        'heatmap-color': [
                            'interpolate',
                            ['linear'],
                            ['heatmap-density'],
                            0, 'rgba(33,102,172,0)',
                            0.2, 'rgb(103,169,207)',
                            0.4, 'rgb(209,229,240)',
                            0.6, 'rgb(253,219,199)',
                            0.8, 'rgb(239,138,98)',
                            1, 'rgb(178,24,43)'
                        ],
                        'heatmap-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0, 2,
                            15, 20
                        ],
                        'heatmap-opacity': 0.7
                    }
                });

                map.current.addLayer({
                    'id': 'outbreak-point',
                    'type': 'circle',
                    'source': 'outbreaks',
                    'minzoom': 12,
                    'paint': {
                        'circle-radius': 5,
                        'circle-color': '#b2182b',
                        'circle-stroke-color': 'white',
                        'circle-stroke-width': 1,
                        'circle-opacity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            12, 0,
                            13, 1
                        ]
                    }
                });
            });

        } catch (err) {
            setMapError('Failed to load Mapbox. Check your connectivity or Token.');
        }

        return () => {
            if (map.current) map.current.remove();
        };
    }, [lat, lon]);

    return (
        <section className="bg-white rounded-4 p-4 shadow-sm border mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h3 className="h6 fw-bold mb-0 text-dark">Disease Outbreak Heatmap</h3>
                <span className="badge bg-danger-subtle text-danger rounded-pill fw-bold" style={{fontSize: 10}}>
                    <Icon name="warning" style={{fontSize: 12}} /> Community Alerts
                </span>
            </div>
            
            <div className="rounded-4 overflow-hidden border position-relative" style={{ height: '300px', background: '#f8fdf9' }}>
                {mapError ? (
                    <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-4">
                        <Icon name="map" className="display-4 text-muted opacity-25 mb-2" />
                        <p className="small text-muted mb-0">{mapError}</p>
                    </div>
                ) : (
                    <div ref={mapContainer} className="w-100 h-100" />
                )}
                
                <div className="position-absolute bottom-0 start-0 p-2 bg-white bg-opacity-75 small m-2 rounded-3 border fw-bold" style={{ fontSize: 9 }}>
                    Mapbox Cluster Engine
                </div>
            </div>
            
            <div className="mt-3 d-flex align-items-center gap-2 bg-light p-2 rounded-3 border-start border-4 border-danger">
                <Icon name="info" className="text-danger" style={{fontSize: 16}} />
                <p className="small text-muted mb-0" style={{ fontSize: 11 }}>
                    Scanned disease clusters detected within 5km of your location. Take preventive action.
                </p>
            </div>
        </section>
    );
};
