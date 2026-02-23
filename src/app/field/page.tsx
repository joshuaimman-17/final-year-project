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
    const { user, locationLoading } = useAuth();
    const [soil, setSoil] = useState<SoilData | null>(null);
    const [elevation, setElevation] = useState<ElevationData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const [soilData, elevData] = await Promise.all([
                    api.fetchSoil(user.latitude, user.longitude),
                    api.fetchElevation(user.latitude, user.longitude)
                ]);
                setSoil(soilData);
                setElevation(elevData);
            } catch (e) {
                console.error("Field Data Fetch Error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.latitude, user?.longitude]); // React to coordinate changes specifically

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

    return (
        <div className="min-vh-100 d-flex flex-column pb-5 bg-light">
            <Header title="Field Analysis" showBack={false} />

            <main className="flex-grow-1 p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                <section className="card rounded-4 p-4 shadow-sm border-0 mb-4 hover-scale transition-all">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <h3 className="h6 fw-bold mb-0 d-flex align-items-center gap-2 text-dark">
                            <Icon name="landscape" className="text-primary-green" />
                            Terrain & Location
                        </h3>
                        {locationLoading ? (
                            <span className="badge bg-warning-subtle text-warning fw-normal" style={{ fontSize: '10px' }}>Updating...</span>
                        ) : (
                            <span className="badge bg-success-subtle text-success fw-normal d-flex align-items-center gap-1" style={{ fontSize: '10px' }}>
                                <span className="d-inline-block rounded-circle bg-success" style={{ width: '6px', height: '6px', animation: 'pulse 2s infinite' }}></span>
                                Live GPS
                            </span>
                        )}
                    </div>

                    <div className="row g-3">
                        <div className="col-6">
                            <div className="bg-light p-3 rounded-3 transition-all hover-scale">
                                <p className="small text-muted mb-1">Elevation</p>
                                <p className="h5 fw-bold mb-0">
                                    {loading ? '...' : elevation?.elevation?.toFixed(1) || 'N/A'}
                                    <span className="small fw-normal text-muted ms-1">m</span>
                                </p>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="bg-light p-3 rounded-3 transition-all hover-scale">
                                <p className="small text-muted mb-1">Coordinates</p>
                                <p className="font-monospace small fw-bold mb-0">
                                    {user?.latitude.toFixed(4)},<br />{user?.longitude.toFixed(4)}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="card rounded-4 p-4 shadow-sm border-0 mb-4 hover-scale transition-all">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <h3 className="h6 fw-bold d-flex align-items-center gap-2 mb-0 text-dark">
                            <Icon name="grass" className="text-primary-green" />
                            Soil Properties
                        </h3>
                        <span className="badge bg-light text-muted fw-normal border">ISRIC Source</span>
                    </div>

                    {loading ? (
                        <div className="py-5 text-center"><div className="spinner-border text-primary-green" role="status"></div></div>
                    ) : soil ? (
                        <div className="d-grid gap-1">
                            <MetricRow label="Soil pH" value={soil.ph.toFixed(1)} unit="pH" icon="science" colorClass="text-purple bg-purple-subtle" />
                            <MetricRow label="Organic Carbon" value={soil.organic_carbon.toFixed(1)} unit="g/kg" icon="carbon_source" colorClass="text-secondary bg-gray-subtle" />
                            <MetricRow label="Nitrogen" value={soil.nitrogen.toFixed(2)} unit="g/kg" icon="eco" colorClass="text-success bg-success-subtle" />

                            <div className="mt-4 pt-4 border-top">
                                <p className="small fw-bold text-muted text-uppercase mb-3">Soil Texture</p>
                                <div className="progress overflow-visible" style={{ height: '6px' }}>
                                    <div className="progress-bar bg-warning rounded-start" style={{ width: `${soil.sand / 10}%` }} title="Sand"></div>
                                    <div className="progress-bar bg-info" style={{ width: `${soil.silt / 10}%` }} title="Silt"></div>
                                    <div className="progress-bar bg-danger rounded-end" style={{ width: `${soil.clay / 10}%` }} title="Clay"></div>
                                </div>
                                <div className="d-flex justify-content-between mt-2 small text-muted font-monospace" style={{ fontSize: '10px' }}>
                                    <div className="d-flex align-items-center gap-1"><span className="d-inline-block rounded-circle bg-warning" style={{ width: '8px', height: '8px' }}></span> SAND {(soil.sand / 10).toFixed(0)}%</div>
                                    <div className="d-flex align-items-center gap-1"><span className="d-inline-block rounded-circle bg-info" style={{ width: '8px', height: '8px' }}></span> SILT {(soil.silt / 10).toFixed(0)}%</div>
                                    <div className="d-flex align-items-center gap-1"><span className="d-inline-block rounded-circle bg-danger" style={{ width: '8px', height: '8px' }}></span> CLAY {(soil.clay / 10).toFixed(0)}%</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted small">Soil data unavailable for this location.</div>
                    )}
                </section>
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
