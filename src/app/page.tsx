"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { useWeatherData } from '@/hooks/useWeatherData';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';
import dynamic from 'next/dynamic';

// ── Default fallback (only used if geolocation fully denied/unavailable) ─────
const DEFAULT_LAT = 20.5937;
const DEFAULT_LON = 78.9629; // India center — more appropriate default


// Dynamically import Leaflet Map to prevent "window is not defined" SSR errors
const FarmMap = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted gap-2 bg-light">
      <div className="spinner-border spinner-border-sm text-success" />
      <span className="small fw-medium">Loading Map Engine…</span>
    </div>
  ),
});

// ── Geolocation hook (separate from AuthContext to be immediate) ──────────
function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const acquire = useCallback((forceRefresh = false) => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setGeoLoading(false);
      return;
    }

    if (forceRefresh) setGeoLoading(true);

    // Clear previous watch if any
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoLoading(false);
        setGeoError(null);
        setShowPromptBanner(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Location access denied.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError('Location unavailable. Check GPS signal.');
            break;
          case err.TIMEOUT:
            setGeoError('Location request timed out. Retrying…');
            break;
          default:
            setGeoError('Unable to determine location.');
        }
        setGeoLoading(false);
        setShowPromptBanner(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }, []);

  const dismissPrompt = useCallback(() => {
    sessionStorage.setItem('locationPromptIgnored', 'true');
    setShowPromptBanner(false);
    setGeoError('Location access deferred.');
  }, []);

  const requestPermission = useCallback(() => {
    setShowPromptBanner(false);
    setGeoLoading(true);
    acquire(true); // triggers browser native prompt
  }, [acquire]);

  useEffect(() => {
    let active = true;
    const initGeo = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          if (!active) return;
          
          if (result.state === 'granted') {
            acquire(true); // Auto-acquire if already granted
          } else if (result.state === 'denied') {
            acquire(true); // Will hit DENIED error instantly and show error UI
          } else {
            // 'prompt' state
            if (!sessionStorage.getItem('locationPromptIgnored')) {
              setShowPromptBanner(true);
            } else {
              setGeoError('Location access deferred.');
            }
          }
        } else {
          // Fallback if permissions API unsupported
          if (!sessionStorage.getItem('locationPromptIgnored')) {
             setShowPromptBanner(true);
          }
        }
      } catch (e) {
        if (!active) return;
        if (!sessionStorage.getItem('locationPromptIgnored')) setShowPromptBanner(true);
      }
    };
    initGeo();

    return () => {
      active = false;
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [acquire]);

  return { coords, geoLoading, geoError, showPromptBanner, requestPermission, dismissPrompt, recenter: () => acquire(true) };
}


// ─────────────────────────────────────────────────────────────────────────────
function DashboardContent() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const { coords, geoLoading, geoError, showPromptBanner, requestPermission, dismissPrompt, recenter } = useGeolocation();

  // Resolved lat/lon: prefer real GPS, fallback to profile coords, then default
  const lat = coords?.lat ?? user?.latitude ?? DEFAULT_LAT;
  const lon = coords?.lon ?? user?.longitude ?? DEFAULT_LON;

  const { data, loading, error } = useWeatherData(lat, lon);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted || !currentTime) return null;

  if (loading) return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
      <div className="spinner-border text-success mb-3" role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
      <p className="text-muted fw-medium">Fetching Live Satellite Data…</p>
    </div>
  );

  if (error || !data) return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center p-4">
      <Icon name="cloud_off" className="display-4 text-muted mb-3" />
      <p className="text-danger">{error || 'Data unavailable'}</p>
      <button onClick={() => window.location.reload()} className="btn btn-success mt-3 px-4 rounded-pill">
        Retry
      </button>
    </div>
  );

  const chartData = data.hourly.time.slice(0, 24).map((t: string, i: number) => ({
    time: new Date(t).getHours() + ':00',
    temp: data.hourly.temperature_2m[i],
    moisture: data.hourly.soil_moisture_0_to_1cm[i] * 100,
  }));

  const currentMoisture = (data.current.soil_moisture * 100).toFixed(0);

  const getMoistureLabel = (m: number) => {
    if (m < 20) return { text: 'Dry', color: 'text-danger' };
    if (m < 60) return { text: 'Optimal', color: 'text-success' };
    return { text: 'Saturated', color: 'text-info' };
  };

  const getTempLabel = (t: number) => {
    if (t < 15) return { text: 'Cold', color: 'text-info' };
    if (t < 30) return { text: 'Healthy', color: 'text-success' };
    return { text: 'Heat Stress', color: 'text-danger' };
  };

  const moistStatus = getMoistureLabel(parseFloat(currentMoisture));
  const tempStatus  = getTempLabel(data.current.temperature);

  const getSmartTip = () => {
    if (data.current.humidity > 80) return "High humidity: Watch for fungal growth.";
    if (parseFloat(currentMoisture) < 30) return "Soil is dry: Best time to irrigate.";
    if (data.current.temperature > 32) return "Heat wave: Consider shade for seedlings.";
    return "Conditions are ideal for crop growth.";
  };

  return (
    <div className="d-flex flex-column min-vh-100 pb-5">

      {/* ── Header ── */}
      <header className="sticky-top bg-white border-bottom px-3 py-2 shadow-sm">
        <div className="d-flex align-items-center justify-content-between mx-auto" style={{ maxWidth: '448px' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success shadow-sm"
              style={{ width: '36px', height: '36px' }}>
              <Icon name="eco" className="fs-5" />
            </div>
            <div>
              <p className="small text-muted mb-0 fw-bold">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <h1 className="h6 mb-0 fw-bold text-dark">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </h1>
            </div>
          </div>

          {/* GPS status */}
          <div className={`d-flex align-items-center gap-2 small px-3 py-2 rounded-pill shadow-sm
            ${geoLoading ? 'bg-warning-subtle text-warning' : geoError ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>
            <span className={`d-inline-block rounded-circle
              ${geoLoading ? 'bg-warning' : geoError ? 'bg-danger' : 'bg-success'}`}
              style={{ width: '8px', height: '8px', animation: geoLoading ? 'none' : geoError ? 'none' : 'pulse 1.5s infinite' }} />
            <span className="fw-bold">
              {geoLoading ? 'Locating…' : geoError ? 'GPS Off' : 'Live GPS'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-grow-1 w-100 px-3 py-4 mx-auto animate-fade-in d-flex flex-column gap-3" style={{ maxWidth: '448px' }}>
        
        {/* Custom Location Permission Banner */}
        {showPromptBanner && (
          <div className="bg-white rounded-4 shadow-sm border p-3 mt-n2 mb-2 hover-scale transition-all animate-fade-in position-relative z-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 44, height: 44, boxShadow: '0 4px 10px rgba(39, 174, 96, 0.3)' }}>
                <Icon name="location_on" className="fs-5" />
              </div>
              <div>
                <h3 className="h6 fw-bold mb-1 text-dark">Enable Location Services</h3>
                <p className="small text-muted mb-0 lh-sm" style={{ fontSize: '11.5px' }}>
                  Allow location access to use live farm mapping, accurate local weather tracking, and real-time alerts.
                </p>
              </div>
            </div>
            <div className="d-flex gap-2 mt-3 justify-content-end">
              <button onClick={dismissPrompt} className="btn btn-sm btn-light rounded-pill px-4 fw-medium text-dark border">
                Not Now
              </button>
              <button onClick={requestPermission} className="btn btn-sm btn-success rounded-pill px-4 fw-medium shadow-sm">
                Allow Location
              </button>
            </div>
          </div>
        )}

        {/* ── Weather card ── */}
        <div className="rounded-4 p-4 text-white shadow-sm position-relative overflow-hidden mb-4"
          style={{ background: 'linear-gradient(135deg, #1a6b3a 0%, #27ae60 100%)' }}>
          <div className="position-absolute top-0 end-0 mt-n5 me-n5 bg-white opacity-10 rounded-circle"
            style={{ width: '128px', height: '128px', filter: 'blur(32px)' }} />
          <div className="position-relative z-1 d-flex justify-content-between align-items-start">
            <div>
              <h2 className="display-4 fw-bold mb-0">{data.current.temperature}°</h2>
              <p className="text-white-50 mt-1 d-flex align-items-center gap-1 mb-0 font-monospace" style={{ fontSize: '0.7rem' }}>
                <Icon name="location_on" className="fs-6" />
                {lat.toFixed(4)}, {lon.toFixed(4)}
                {geoError && <span className="ms-1 text-warning-emphasis" style={{ fontSize: '0.6rem' }}>(fallback)</span>}
              </p>
            </div>
            <Icon name="partly_cloudy_day" className="display-3 text-warning" filled />
          </div>
          <div className="position-relative z-1 row g-2 mt-4">
            {[
              { icon: 'water_drop', label: 'Air Humid', value: `${data.current.humidity}%`, sub: null, color: 'text-info' },
              { icon: 'grass', label: 'Soil', value: `${currentMoisture}%`, sub: moistStatus, color: 'text-white' },
              { icon: 'device_thermostat', label: 'Health', value: `${data.current.temperature}°`, sub: tempStatus, color: 'text-warning' },
            ].map(({ icon, label, value, sub, color }) => (
              <div key={label} className="col">
                <div className="bg-white bg-opacity-10 rounded-3 p-2 text-center transition-all hover-scale">
                  <Icon name={icon} className={`${color} mb-1`} />
                  <p className="small text-white-50 mb-0">{label}</p>
                  <p className="fw-bold mb-0 lh-1">{value}</p>
                  {sub && <span className={`fw-bold ${sub.color}`} style={{ fontSize: '0.65rem' }}>{sub.text}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="position-relative z-1 mt-3 bg-white bg-opacity-10 rounded-3 p-2 d-flex align-items-center gap-2">
            <Icon name="tips_and_updates" className="text-warning fs-5" />
            <p className="small mb-0 flex-grow-1 text-white-50" style={{ fontSize: '0.75rem' }}>
              <span className="text-white fw-bold">Smart Tip: </span>{getSmartTip()}
            </p>
          </div>
        </div>

        {/* ── 24h Temperature chart ── */}
        <section className="bg-white rounded-4 p-4 shadow-sm border mb-4 hover-scale transition-all">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h3 className="h6 fw-bold mb-0 text-dark">24h Temperature</h3>
            <span className="small text-muted bg-light px-2 py-1 rounded-pill" style={{fontSize: '10px'}}>Open-Meteo</span>
          </div>
          <div style={{ height: '192px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ffc107" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ffc107" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} unit="°" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(26, 46, 30, 0.9)', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="temp" stroke="#ffc107" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ── Soil moisture chart ── */}
        <section className="bg-white rounded-4 p-4 shadow-sm border mb-4 hover-scale transition-all">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h3 className="h6 fw-bold mb-0 text-dark">Soil Moisture Trend</h3>
            <Icon name="water_drop" className="text-success opacity-50" />
          </div>
          <div style={{ height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMoist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#198754" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#198754" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(26, 46, 30, 0.9)', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                <Area type="monotone" dataKey="moisture" stroke="#198754" strokeWidth={3} fillOpacity={1} fill="url(#colorMoist)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="d-flex justify-content-between mt-2 small fw-medium text-muted px-1">
            <span>Now</span><span>+12h</span><span>+24h</span>
          </div>
        </section>

        {/* ── Live Farm Map ── */}
        <section className="bg-white rounded-4 p-4 shadow-sm border mb-4 hover-scale transition-all">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h3 className="h6 fw-bold mb-0 text-dark">Live Farm Location</h3>
              <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                {geoLoading
                  ? 'Detecting your position…'
                  : geoError
                    ? 'Location access required'
                    : `📍 ${lat.toFixed(5)}, ${lon.toFixed(5)}`}
              </p>
            </div>

            <div className="d-flex gap-2 align-items-center">
              {/* Live indicator */}
              <span className={`d-flex align-items-center gap-1 small fw-semibold bg-opacity-10 px-2 py-1 rounded-pill
                ${showPromptBanner ? 'text-secondary bg-secondary' : geoLoading ? 'text-warning bg-warning' : geoError ? 'text-danger bg-danger' : 'text-success bg-success'}`}
                style={{ fontSize: '10px' }}>
                <span className={`d-inline-block rounded-circle
                  ${showPromptBanner ? 'bg-secondary' : geoLoading ? 'bg-warning' : geoError ? 'bg-danger' : 'bg-success'}`}
                  style={{ width: '6px', height: '6px', animation: (geoError || geoLoading || showPromptBanner) ? 'none' : 'pulse 1.5s infinite' }} />
                {showPromptBanner ? 'Awaiting Access' : geoLoading ? 'Locating' : geoError ? 'Offline' : 'Live'}
              </span>
            </div>
          </div>

          {/* Map container */}
          <div className="rounded-4 overflow-hidden border position-relative shadow-inner" style={{ height: '260px', background: '#f8fdf9' }}>
            {geoError && geoError.includes('denied') ? (
               <div className="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-4" style={{ zIndex: 10, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}>
                  <div className="bg-danger-subtle text-danger rounded-circle p-3 mb-2 d-flex align-items-center justify-content-center">
                    <Icon name="location_off" className="fs-3" />
                  </div>
                  <h4 className="h6 fw-bold mb-1">Location Blocked</h4>
                  <p className="small text-muted mb-3 lh-sm" style={{ fontSize: '11px' }}>
                    Please click the <strong>lock icon 🔒 in your browser&apos;s address bar</strong> to allow location access, then click retry.
                  </p>
                  <button onClick={recenter} className="btn btn-outline-success rounded-pill px-4 py-1 shadow-sm d-flex align-items-center gap-2">
                    <Icon name="refresh" style={{ fontSize: '16px' }} />
                    Retry
                  </button>
               </div>
            ) : geoLoading ? (
              <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted gap-2">
                <div className="spinner-border spinner-border-sm text-success" />
                <span className="small fw-medium">Acquiring GPS signal…</span>
              </div>
            ) : (
              <FarmMap 
                lat={lat} 
                lon={lon} 
                isLive={!geoError && !geoLoading} 
                onRecenter={recenter} 
              />
            )}
            
            {/* Fallback warning if not denied but other error */}
            {geoError && !geoError.includes('denied') && (
              <div className="position-absolute top-0 start-0 w-100 p-2" style={{ zIndex: 400 }}>
                 <div className="bg-warning-subtle text-warning-emphasis rounded-3 p-2 d-flex align-items-center gap-2 shadow-sm" style={{ fontSize: '11px' }}>
                    <Icon name="warning" style={{ fontSize: '14px' }}/>
                    <span>{geoError} Using fallback.</span>
                    <button onClick={recenter} className="btn btn-link py-0 px-1 ms-auto text-dark" style={{ fontSize: '11px' }}>Retry</button>
                 </div>
              </div>
            )}
          </div>
        </section>

      </main>
      <BottomNav />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
        .hover-scale { transition: transform 0.2s ease; }
        .hover-scale:hover { transform: scale(1.02); }
        .transition-all { transition: all 0.2s ease; }
      `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
