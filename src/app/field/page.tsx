"use client";

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { SoilData, ElevationData } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';

function FieldContent() {
    const { user, locationLoading, detectLocation } = useAuth();
    const [soil, setSoil] = useState<SoilData | null>(null);
    const [elevation, setElevation] = useState<ElevationData | null>(null);
    const [weather, setWeather] = useState<any>(null);
    const [locationName, setLocationName] = useState<string>("Locating...");
    const [terrainType, setTerrainType] = useState<string>("Unknown");
    const [soilTypeString, setSoilTypeString] = useState<string>("Unknown");
    const [loading, setLoading] = useState(true);

    const determineSoilType = (sand: number, silt: number, clay: number) => {
        // Very basic soil texture triangle estimation
        if (sand > 50 && clay < 20) return "Sandy";
        if (clay > 40) return "Clay";
        if (silt > 50) return "Silty";
        if (sand >= 30 && sand <= 50 && silt >= 30 && silt <= 50 && clay >= 10 && clay <= 30) return "Loam";
        return "Sandy Loam";
    };

    const determineTerrain = (elev: number) => {
        if (elev < 100) return "Flat Plains";
        if (elev < 500) return "Rolling Hills";
        if (elev < 1000) return "Highlands";
        return "Mountainous";
    };

    useEffect(() => {
        // If the user hasn't explicitly permitted location yet, `user.latitude` defaults might be 36.77
        // Let's attempt to auto-detect location once when page mounts
        if (!user) return;
        detectLocation();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetch external data concurrently
                const [soilData, elevData, weatherData, geoName] = await Promise.all([
                    api.fetchSoil(user.latitude, user.longitude),
                    api.fetchElevation(user.latitude, user.longitude),
                    api.fetchWeather(user.latitude, user.longitude),
                    api.reverseGeocode(user.latitude, user.longitude)
                ]);

                setSoil(soilData);
                setElevation(elevData);
                setWeather(weatherData);
                setLocationName(geoName);

                const deducedTerrain = determineTerrain(elevData?.elevation || 0);
                const deducedSoilType = determineSoilType(soilData.sand, soilData.silt, soilData.clay);

                setTerrainType(deducedTerrain);
                setSoilTypeString(deducedSoilType);

                // Save to Firestore Database via Backend API
                try {
                    const { auth } = await import('@/lib/firebase');
                    const token = await auth.currentUser?.getIdToken();
                    
                    if (token) {
                        await fetch('/api/field', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                latitude: user.latitude,
                                longitude: user.longitude,
                                terrainType: deducedTerrain,
                                soilType: deducedSoilType,
                                soilPh: soilData.ph,
                                soilMoisture: weatherData?.current?.soil_moisture || 0,
                                elevation: elevData?.elevation || 0
                            })
                        });
                    }
                } catch (dbError) {
                    console.error("Failed to save field profile to database", dbError);
                }

            } catch (e) {
                console.error("Field Data Fetch Error", e);
            } finally {
                setLoading(false);
            }
        };

        // Don't fetch if location is 0,0 (invalid) 
        if (user?.latitude && user?.longitude) {
            fetchData();
        }
    }, [user?.latitude, user?.longitude]);

    const MetricRow = ({ label, value, unit, icon, colorClass }: any) => (
        <div className="d-flex align-items-center justify-content-between py-2 border-bottom last-border-0">
            <div className="d-flex align-items-center gap-3">
                <div className={`p-2 rounded-3 bg-opacity-10 d-flex align-items-center justify-content-center ${colorClass}`} style={{ width: '40px', height: '40px' }}>
                    <Icon name={icon} />
                </div>
                <span className="small fw-semibold">{label}</span>
            </div>
            <span className="fw-bold">{value} <span className="small text-muted fw-normal">{unit}</span></span>
        </div>
    );

    const AddOnFeature = ({ icon, title, description }: any) => (
        <div className="col-6">
            <div className="bg-white border rounded-4 p-3 h-100 d-flex flex-column align-items-start transition-all hover-scale" style={{ cursor: 'pointer' }}>
                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-2" style={{ width: '36px', height: '36px' }}>
                    <Icon name={icon} className="text-primary-green" style={{ fontSize: '18px' }} />
                </div>
                <h4 className="h6 fw-bold mb-1" style={{ fontSize: '13px' }}>{title}</h4>
                <p className="small text-muted mb-0 lh-sm" style={{ fontSize: '11px' }}>{description}</p>
                <div className="mt-auto pt-2 w-100"><span className="badge bg-light text-muted border w-100">Coming Soon</span></div>
            </div>
        </div>
    );

    return (
        <div className="min-vh-100 d-flex flex-column pb-5 bg-light">
            <Header title="Field Analysis" showBack={false} />

            <main className="flex-grow-1 p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                
                {/* 1. Field Overview */}
                <section className="card rounded-4 p-4 shadow-sm border-0 mb-4 bg-primary-green text-white position-relative overflow-hidden">
                    <div className="position-absolute top-0 end-0 opacity-10 mt-n4 me-n4">
                        <Icon name="map" style={{ fontSize: '150px' }} />
                    </div>
                    <div className="position-relative z-1">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h2 className="h4 fw-bold mb-1">{user?.farm_name || "My Farm"}</h2>
                                <p className="mb-0 text-white-50 d-flex align-items-center gap-1 small">
                                    <Icon name="location_on" style={{ fontSize: '14px' }} />
                                    {loading ? "Locating..." : locationName}
                                </p>
                            </div>
                            {locationLoading ? (
                                <span className="badge bg-white text-primary-green bg-opacity-25" style={{ fontSize: '10px' }}>Syncing GPS...</span>
                            ) : (
                                <button onClick={() => detectLocation()} className="btn btn-sm btn-light rounded-circle p-2 shadow-sm">
                                    <Icon name="my_location" className="text-primary-green" style={{ fontSize: '16px' }} />
                                </button>
                            )}
                        </div>
                        <div className="bg-white bg-opacity-10 rounded-3 p-3 mt-3 font-monospace small">
                            {user?.latitude.toFixed(5)}, {user?.longitude.toFixed(5)}
                        </div>
                    </div>
                </section>

                {/* 2. Terrain Details */}
                <section className="card rounded-4 p-4 shadow-sm border-0 mb-4">
                    <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
                        <Icon name="landscape" className="text-secondary" />
                        Terrain Details
                    </h3>
                    <div className="row g-3">
                        <div className="col-6">
                            <div className="bg-light p-3 rounded-3 h-100">
                                <p className="small text-muted mb-1 d-flex align-items-center gap-1"><Icon name="filter_hdr" style={{ fontSize: '14px' }}/> Elevation</p>
                                <p className="h5 fw-bold mb-0">
                                    {loading ? '...' : elevation?.elevation?.toFixed(1) || 'N/A'}
                                    <span className="small fw-normal text-muted ms-1">m</span>
                                </p>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="bg-light p-3 rounded-3 h-100">
                                <p className="small text-muted mb-1 d-flex align-items-center gap-1"><Icon name="terrain" style={{ fontSize: '14px' }}/> Topology</p>
                                <p className="h6 fw-bold mb-0 text-truncate" title={terrainType}>
                                    {loading ? '...' : terrainType}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Soil Analysis */}
                <section className="card rounded-4 p-4 shadow-sm border-0 mb-4 position-relative">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <div>
                            <h3 className="h6 fw-bold d-flex align-items-center gap-2 mb-1 text-dark">
                                <Icon name="grass" className="text-success" />
                                Soil Analysis
                            </h3>
                            <p className="small text-muted mb-0">Estimated Type: <span className="fw-bold text-dark">{loading ? '...' : soilTypeString}</span></p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-4 text-center"><div className="spinner-border text-success" role="status"></div></div>
                    ) : soil ? (
                        <div className="d-grid gap-1">
                            <MetricRow label="Soil pH" value={soil.ph.toFixed(1)} unit="pH" icon="science" colorClass="text-purple bg-purple-subtle" />
                            <MetricRow label="Moisture (0-1cm)" value={weather?.current?.soil_moisture || 0} unit="m³/m³" icon="water_drop" colorClass="text-primary bg-primary-subtle" />
                            <MetricRow label="Organic Carbon" value={soil.organic_carbon.toFixed(1)} unit="g/kg" icon="carbon_source" colorClass="text-secondary bg-gray-subtle" />
                            <MetricRow label="Nitrogen" value={soil.nitrogen.toFixed(2)} unit="g/kg" icon="eco" colorClass="text-success bg-success-subtle" />

                            <div className="mt-4 pt-4 border-top">
                                <p className="small fw-bold text-muted text-uppercase mb-3">Soil Texture Breakdown</p>
                                <div className="progress overflow-visible" style={{ height: '8px' }}>
                                    <div className="progress-bar bg-warning rounded-start" style={{ width: `${soil.sand / 10}%` }} title="Sand"></div>
                                    <div className="progress-bar bg-info" style={{ width: `${soil.silt / 10}%` }} title="Silt"></div>
                                    <div className="progress-bar bg-danger rounded-end" style={{ width: `${soil.clay / 10}%` }} title="Clay"></div>
                                </div>
                                <div className="d-flex justify-content-between mt-2 small font-monospace" style={{ fontSize: '11px' }}>
                                    <div className="d-flex align-items-center gap-1 fw-bold text-warning"><span className="d-inline-block rounded-circle bg-warning" style={{ width: '8px', height: '8px' }}></span> SAND {(soil.sand / 10).toFixed(0)}%</div>
                                    <div className="d-flex align-items-center gap-1 fw-bold text-info"><span className="d-inline-block rounded-circle bg-info" style={{ width: '8px', height: '8px' }}></span> SILT {(soil.silt / 10).toFixed(0)}%</div>
                                    <div className="d-flex align-items-center gap-1 fw-bold text-danger"><span className="d-inline-block rounded-circle bg-danger" style={{ width: '8px', height: '8px' }}></span> CLAY {(soil.clay / 10).toFixed(0)}%</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted small">
                            <Icon name="portable_wifi_off" className="display-4 text-muted opacity-25 mb-2 d-block" />
                            Unable to fetch soil data for this location.
                        </div>
                    )}
                </section>

                {/* 4. Modular Features */}
                <h3 className="h6 fw-bold mb-3 text-dark px-1">Management Features</h3>
                <div className="row g-3">
                    <AddOnFeature icon="agriculture" title="Crop Tracking" description="Monitor growth stages & yield" />
                    <AddOnFeature icon="water" title="Irrigation" description="Smart watering schedules" />
                    <AddOnFeature icon="vaccines" title="Fertilizer" description="Nutrient recommendations" />
                    <AddOnFeature icon="event_note" title="Field Notes" description="Log daily activities & issues" />
                </div>
            </main>
            <BottomNav />
        </div>
    );
}

export default function FieldPage() {
    return (
        <ProtectedRoute>
            <FieldContent />
        </ProtectedRoute>
    );
}
