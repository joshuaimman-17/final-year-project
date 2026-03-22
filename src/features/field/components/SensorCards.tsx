import React from 'react';
import { Icon } from '@/components/ui/Icon';

interface SensorCardsProps {
    loading: boolean;
    sm: number;
    temp: number;
    n: number;
    ph: number;
    smColor: string;
}

export const SensorCards: React.FC<SensorCardsProps> = ({ loading, sm, temp, n, ph, smColor }) => {
    
    // Skeleton component for fast paint without Layout Shift
    const SkeletonCard = () => (
        <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-light">
            <div className="d-flex justify-content-between mb-2">
                <div className="rounded-circle bg-secondary bg-opacity-10 skeleton-pulse" style={{ width: 36, height: 36 }} />
            </div>
            <div className="mt-auto">
                <div className="bg-secondary bg-opacity-10 rounded skeleton-pulse mb-1" style={{ width: '60%', height: 28 }} />
                <div className="bg-secondary bg-opacity-10 rounded skeleton-pulse" style={{ width: '80%', height: 14 }} />
            </div>
        </div>
    );

    return (
        <div className="mb-4">
            <h3 className="h6 fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                <Icon name="sensors" className="text-secondary" />
                Live Sensors
            </h3>
            <div className="row g-2">
                {/* Soil Moisture */}
                <div className="col-6">
                    {loading ? <SkeletonCard /> : (
                        <div className={`card border-0 shadow-sm rounded-4 h-100 p-3 border-start border-4 border-${smColor} transition-all`}>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className={`rounded-circle bg-${smColor} bg-opacity-10 text-${smColor} d-flex align-items-center justify-content-center p-2`}>
                                    <Icon name="water_drop" />
                                </div>
                                <span className="small text-muted fw-bold">Live</span>
                            </div>
                            <div className="mt-auto">
                                <div className="h4 fw-bold mb-0 text-dark">{sm.toFixed(1)}<span className="fs-6 text-muted">%</span></div>
                                <div className="small text-muted fw-medium" style={{ fontSize: 11 }}>Soil Moisture</div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Temp */}
                <div className="col-6">
                    {loading ? <SkeletonCard /> : (
                        <div className="card border-0 shadow-sm rounded-4 h-100 p-3 border-start border-4 border-warning transition-all">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="rounded-circle bg-warning bg-opacity-10 text-warning d-flex align-items-center justify-content-center p-2">
                                    <Icon name="thermostat" />
                                </div>
                            </div>
                            <div className="mt-auto">
                                <div className="h4 fw-bold mb-0 text-dark">{temp.toFixed(1)}<span className="fs-6 text-muted">°C</span></div>
                                <div className="small text-muted fw-medium" style={{ fontSize: 11 }}>Temperature</div>
                            </div>
                        </div>
                    )}
                </div>
                {/* NPK */}
                <div className="col-6">
                    {loading ? <SkeletonCard /> : (
                        <div className="card border-0 shadow-sm rounded-4 h-100 p-3 border-start border-4 border-info transition-all">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="rounded-circle bg-info bg-opacity-10 text-info d-flex align-items-center justify-content-center p-2">
                                    <Icon name="science" />
                                </div>
                            </div>
                            <div className="mt-auto">
                                <div className="h4 fw-bold mb-0 text-dark">{n.toFixed(0)}<span className="fs-6 text-muted">mg/kg</span></div>
                                <div className="small text-muted fw-medium" style={{ fontSize: 11 }}>Nitrogen (N)</div>
                            </div>
                        </div>
                    )}
                </div>
                {/* pH */}
                <div className="col-6">
                    {loading ? <SkeletonCard /> : (
                        <div className="card border-0 shadow-sm rounded-4 h-100 p-3 border-start border-4 border-success transition-all">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center p-2">
                                    <Icon name="grass" />
                                </div>
                            </div>
                            <div className="mt-auto">
                                <div className="h4 fw-bold mb-0 text-dark">{ph.toFixed(1)}</div>
                                <div className="small text-muted fw-medium" style={{ fontSize: 11 }}>Soil pH Level</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
