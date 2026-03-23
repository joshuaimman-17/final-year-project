"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { api } from '@/services/api';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';
import { Icon } from '@/components/ui/Icon';
import dynamic from 'next/dynamic';

// Field Subcomponents
import { FieldHeader } from '@/features/field/components/FieldHeader';
import { SensorCards } from '@/features/field/components/SensorCards';
import { AlertsPanel } from '@/features/field/components/AlertsPanel';
import { RecommendationEngine } from '@/features/field/components/RecommendationEngine';
import { AIDiagnosis } from '@/features/field/components/AIDiagnosis';
import { TimelineHistory } from '@/features/field/components/TimelineHistory';
import { FieldSetupForm, FieldConfig } from '@/features/field/components/FieldSetupForm';
import { FieldSummaryCard } from '@/features/field/components/FieldSummaryCard';
import { CropLifecycleCalendar } from '@/features/field/components/CropLifecycleCalendar';
import { SoilHealthWallet } from '@/features/field/components/SoilHealthWallet';
import { OutbreakHeatmap } from '@/features/field/components/OutbreakHeatmap';

// Lazy load the heavy chart component
const TrendChart = dynamic(() => import('@/features/field/components/TrendChart'), {
    ssr: false,
    loading: () => (
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-light d-flex align-items-center justify-content-center" style={{ height: 230 }}>
            <div className="spinner-border text-secondary opacity-50" />
        </div>
    )
});

const mockChartData = [
  { day: 'Mon', temp: 24, moisture: 45 },
  { day: 'Tue', temp: 26, moisture: 42 },
  { day: 'Wed', temp: 27, moisture: 40 },
  { day: 'Thu', temp: 28, moisture: 38 },
  { day: 'Fri', temp: 29, moisture: 35 },
  { day: 'Sat', temp: 31, moisture: 30 },
  { day: 'Sun', temp: 30, moisture: 55 }
];

function FieldContent() {
    const { user, detectLocation } = useAuth();
    
    // Config State
    const [config, setConfig] = useState<FieldConfig | null>(null);
    const [configs, setConfigs] = useState<FieldConfig[]>([]);
    const [showSetup, setShowSetup] = useState(false);

    // Data State
    const [soil, setSoil] = useState<any>(null);
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastSynced, setLastSynced] = useState("Just now");
    const [isOffline, setIsOffline] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Diagnosis State
    const [diagnosis, setDiagnosis] = useState<any>(null);
    const [scanning, setScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedConfig = localStorage.getItem('drplant_field_config');
            if (savedConfig) {
                setConfig(JSON.parse(savedConfig));
            }
            const savedConfigs = localStorage.getItem('drplant_field_configs_all');
            if (savedConfigs) {
                setConfigs(JSON.parse(savedConfigs));
            }
            // Load latest diagnosis
            const cachedDiag = localStorage.getItem('drplant_latest_diagnosis');
            if (cachedDiag) {
                setDiagnosis(JSON.parse(cachedDiag));
            }
        }
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setScanning(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            // Import auth on demand or use from lib
            const { auth } = await import('@/lib/firebase');
            const token = await auth.currentUser?.getIdToken();
            
            const res = await fetch('/api/diagnosis/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Upload failed');
            }

            const data = await res.json();
            setDiagnosis(data.result);
            localStorage.setItem('drplant_latest_diagnosis', JSON.stringify(data.result));
        } catch (err: any) {
            console.error("Scan Error", err);
            alert(`Failed: ${err.message}`);
        } finally {
            setScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const fetchFieldFromBackend = useCallback(async () => {
        if (!user) return;
        try {
            const { auth } = await import('@/lib/firebase');
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;

            const res = await fetch('/api/field', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.configs && data.configs.length > 0) {
                    setConfig(data.field || data.configs[0]);
                    setConfigs(data.configs);
                    localStorage.setItem('drplant_field_config', JSON.stringify(data.field || data.configs[0]));
                    localStorage.setItem('drplant_field_configs_all', JSON.stringify(data.configs));
                }
            }
        } catch (err) {
            console.error("Fetch Backend Config Error", err);
        }
    }, [user]);

    const handleSaveConfig = async (newConfigs: FieldConfig[]) => {
        if (!newConfigs || newConfigs.length === 0) return;
        
        const primaryConfig = newConfigs[0];
        
        // Save to LocalStorage first for instant feedback
        setConfig(primaryConfig);
        setConfigs(newConfigs);
        localStorage.setItem('drplant_field_config', JSON.stringify(primaryConfig));
        localStorage.setItem('drplant_field_configs_all', JSON.stringify(newConfigs));
        setShowSetup(false);

        // Save to Backend
        try {
            const { auth } = await import('@/lib/firebase');
            const token = await auth.currentUser?.getIdToken();
            
            await fetch('/api/field', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    configs: newConfigs,
                    latitude: user?.latitude,
                    longitude: user?.longitude
                })
            });
        } catch (err) {
            console.error("Save Backend Config Error", err);
        }
    };

    // Location & Sync Intv
    useEffect(() => {
        if (!user) return;
        detectLocation();
        fetchFieldFromBackend();
        
        const intv = setInterval(() => {
            setLastSynced((prev) => {
                if (prev === "Just now") return "1 min ago";
                if (prev.includes("min")) {
                    const mins = parseInt(prev) + 1;
                    return `${mins} mins ago`;
                }
                return prev;
            });
        }, 60000);
        return () => clearInterval(intv);
    }, []);

    const fetchFieldData = useCallback(async () => {
        // Only fetch if config exists AND sensors are enabled
        if (!user?.latitude || !user?.longitude || !config || config.sensorsAvailable === 'No') {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setHasError(false);

        try {
            const [soilData, weatherData] = await Promise.all([
                api.fetchSoil(user.latitude, user.longitude),
                api.fetchWeather(user.latitude, user.longitude)
            ]);
            
            setSoil(soilData);
            setWeather(weatherData);
            setIsOffline(false);
            setLastSynced("Just now");

            try {
                localStorage.setItem('drplant_field_cache', JSON.stringify({
                    soil: soilData,
                    weather: weatherData,
                    timestamp: new Date().toISOString()
                }));
            } catch (storageErr) {}

        } catch (e) {
            console.error("Field Data Fetch Error", e);
            try {
                const cached = localStorage.getItem('drplant_field_cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    setSoil(parsed.soil);
                    setWeather(parsed.weather);
                    setIsOffline(true);
                    const diffMins = Math.floor((Date.now() - new Date(parsed.timestamp).getTime()) / 60000);
                    setLastSynced(diffMins < 60 ? `${diffMins} mins ago` : `${Math.floor(diffMins/60)} hrs ago`);
                } else {
                    setHasError(true);
                }
            } catch (err) {
                setHasError(true);
            }
        } finally {
            setLoading(false);
        }
    }, [user?.latitude, user?.longitude, config]);

    useEffect(() => {
        fetchFieldData();
    }, [fetchFieldData]);

    const sm = weather?.current?.soil_moisture || 45;
    const temp = weather?.current?.temperature_2m || 28;
    const n = soil?.nitrogen || 120;
    const ph = soil?.ph || 6.5;

    const getStatusTheme = (val: number, min: number, max: number) => {
        if (val < min) return { color: 'danger', icon: 'error', text: 'Critical Warning' };
        if (val > max) return { color: 'warning', icon: 'warning', text: 'Needs Attention' };
        return { color: 'success', icon: 'check_circle', text: 'Healthy' };
    };

    const statusTheme = getStatusTheme(sm, 30, 60);

    // Empty State
    if (!config) {
        return (
            <div className="min-vh-100 d-flex flex-column bg-light pb-5">
                <header className="bg-primary-green text-white px-3 py-4 shadow-sm position-relative sticky-top" style={{ zIndex: 10 }}>
                    <div className="mx-auto w-100" style={{ maxWidth: '448px' }}>
                        <h1 className="h5 fw-bold mb-0">Dr.Plant Field Operations</h1>
                        <p className="small text-white-50 mb-0">Smart Agriculture Dashboard</p>
                    </div>
                </header>
                <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center px-4 text-center mx-auto" style={{ maxWidth: '448px' }}>
                    <div className="rounded-circle bg-primary-green bg-opacity-10 text-primary-green p-4 mb-4">
                        <Icon name="landscape" style={{ fontSize: 64 }} />
                    </div>
                    <h2 className="h4 fw-bold text-dark mb-2">Welcome to Your Field</h2>
                    <p className="text-muted small mb-4">No data available. Add your field details to get personalized smart recommendations, track crop lifecycles, and monitor live sensors.</p>
                    <button onClick={() => setShowSetup(true)} className="btn btn-primary-green btn-lg rounded-pill px-5 py-3 fw-bold shadow-sm d-flex align-items-center gap-2">
                        <Icon name="add_circle" /> Setup Field Now
                    </button>
                </main>
                <BottomNav />
                {showSetup && <FieldSetupForm initialConfigs={configs} onSave={handleSaveConfig} onCancel={() => setShowSetup(false)} />}
            </div>
        );
    }

    // Error State
    if (hasError && !loading && config.sensorsAvailable === 'Yes') {
        return (
            <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light px-4 text-center">
                <div className="rounded-circle bg-danger bg-opacity-10 text-danger p-4 mb-3">
                    <Icon name="wifi_off" style={{ fontSize: 48 }} />
                </div>
                <h2 className="h5 fw-bold text-dark">Connection Lost</h2>
                <p className="text-muted small">Unable to fetch live field data and no offline cache was found.</p>
                <button onClick={fetchFieldData} className="btn btn-primary-green rounded-pill px-4 py-2 mt-2 fw-bold d-flex align-items-center gap-2">
                    <Icon name="refresh" /> Retry Connection
                </button>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="min-vh-100 d-flex flex-column pb-5 bg-light" style={{ fontFamily: 'Inter, sans-serif' }}>
            
            <FieldHeader 
                farmName={config.fieldName || user?.farm_name || 'My Farm'}
                loading={loading}
                lastSynced={config.sensorsAvailable === 'No' ? 'N/A' : lastSynced}
                statusIcon={config.sensorsAvailable === 'No' ? 'info' : statusTheme.icon}
                statusText={config.sensorsAvailable === 'No' ? 'Predictive Mode' : statusTheme.text}
                statusBg={config.sensorsAvailable === 'No' ? 'bg-secondary' : `bg-${statusTheme.color}`}
                isOffline={isOffline}
            />

            <main className="flex-grow-1 p-3 mx-auto w-100 pb-5 mb-4 animate-fade-in" style={{ maxWidth: '448px' }}>
                
                <FieldSummaryCard config={config} onEdit={() => setShowSetup(true)} />

                {/* ── 1. Field Operations ── */}
                <div className="mb-4">
                    <h3 className="h6 fw-bold text-dark text-uppercase mb-3" style={{ fontSize: 11, letterSpacing: '1px' }}>Field Operations</h3>
                    {config.sensorsAvailable === 'Yes' ? (
                        <>
                            <AlertsPanel sm={sm} loading={loading} />
                            <SensorCards loading={loading} sm={sm} temp={temp} n={n} ph={ph} smColor={statusTheme.color} />
                        </>
                    ) : (
                        <div className="card border border-secondary border-opacity-25 shadow-sm rounded-4 p-4 text-center mb-4 bg-white bg-opacity-75">
                            <Icon name="sensors_off" className="text-muted mb-2 opacity-50 display-4" />
                            <h4 className="h6 fw-bold text-dark mb-1">No Sensors Connected</h4>
                            <p className="small text-muted mb-0">Hardware telemetry is disabled in your Profile Budget settings. Switch to 'Yes' to enable live moisture readouts.</p>
                        </div>
                    )}
                    <RecommendationEngine config={config} sm={config.sensorsAvailable === 'Yes' ? sm : 45} />
                </div>

                {/* ── 2. Smart Insights ── */}
                <div>
                    <h3 className="h6 fw-bold text-dark text-uppercase mb-3" style={{ fontSize: 11, letterSpacing: '1px' }}>Smart Insights</h3>
                    
                    {config.sensorsAvailable === 'Yes' && (
                        <TrendChart data={mockChartData} />
                    )}

                    <AIDiagnosis data={diagnosis} loading={scanning} />

                    {config && (
                        <CropLifecycleCalendar config={config} />
                    )}

                    {user?.latitude && user?.longitude && (
                        <OutbreakHeatmap lat={user.latitude} lon={user.longitude} />
                    )}

                    <SoilHealthWallet />

                    <TimelineHistory config={config} />
                </div>

            </main>

            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="d-none" 
            />

            {/* Floating Action Button (FAB) relative to BottomNav */}
            <div className="position-fixed d-flex justify-content-end p-3 pointer-events-none" style={{ bottom: '70px', right: '0', left: '0', maxWidth: '448px', margin: '0 auto', zIndex: 100 }}>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={scanning}
                    className="btn btn-primary-green rounded-pill shadow-lg d-flex align-items-center gap-2 px-4 py-3 fw-bold pointer-events-auto hover-scale border border-2 border-white"
                >
                    {scanning ? (
                        <div className="spinner-border spinner-border-sm" />
                    ) : (
                        <Icon name="document_scanner" />
                    )}
                    {scanning ? 'Scanning...' : 'Scan Plant'}
                </button>
            </div>

            <BottomNav />
            
            {showSetup && (
                <FieldSetupForm 
                    initialConfigs={configs} 
                    onSave={handleSaveConfig} 
                    onCancel={() => setShowSetup(false)} 
                />
            )}

            <style>{`
            .pointer-events-none { pointer-events: none; }
            .pointer-events-auto { pointer-events: auto; }
            .hover-scale { transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            .hover-scale:hover { transform: scale(1.05); }
            .z-max { z-index: 1050; }
            .skeleton-pulse {
                animation: pulse 1.5s infinite ease-in-out;
            }
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 0.3; }
                100% { opacity: 0.6; }
            }
            `}</style>
        </div>
    );
}

export default function FieldPage() {
    return (
        <ProtectedRoute allowedRoles={['FARMER', 'EXPERT', 'ADMIN']}>
            <FieldContent />
        </ProtectedRoute>
    );
}
