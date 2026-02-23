"use client";

import React from 'react';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { useWeatherData } from '@/hooks/useWeatherData';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';
import { useState, useEffect } from 'react';

function DashboardContent() {
  const { user, locationLoading } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  const lat = user?.latitude || 36.7783;
  const lon = user?.longitude || -119.4179;
  const { data, loading, error } = useWeatherData(lat, lon);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
      <div className="spinner-border text-primary-green mb-3" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted fw-medium">Fetching Live Satellite Data...</p>
    </div>
  );

  if (error || !data) return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center p-4">
      <Icon name="cloud_off" className="display-4 text-muted mb-3" />
      <p className="text-danger">{error || 'Data unavailable'}</p>
      <button onClick={() => window.location.reload()} className="btn btn-primary-green mt-3 px-4 rounded-pill">Retry</button>
    </div>
  );

  const chartData = data.hourly.time.slice(0, 24).map((t, i) => ({
    time: new Date(t).getHours() + ':00',
    temp: data.hourly.temperature_2m[i],
    moisture: data.hourly.soil_moisture_0_to_1cm[i] * 100
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
  const tempStatus = getTempLabel(data.current.temperature);

  const getSmartTip = () => {
    if (data.current.humidity > 80) return "High humidity: Watch for fungal growth.";
    if (parseFloat(currentMoisture) < 30) return "Soil is dry: Best time to irrigate.";
    if (data.current.temperature > 32) return "Heat wave: Consider shade for seedlings.";
    return "Conditions are ideal for crop growth.";
  };

  return (
    <div className="d-flex flex-column min-vh-100 pb-5">
      <header className="sticky-top bg-white border-bottom px-3 py-2 shadow-sm">
        <div className="d-flex align-items-center justify-content-between mx-auto" style={{ maxWidth: '448px' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success shadow-sm" style={{ width: '36px', height: '36px' }}>
              <Icon name="eco" className="fs-5" />
            </div>
            <div>
              <p className="small text-muted mb-0 fw-bold">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              <h1 className="h6 mb-0 fw-bold text-dark">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</h1>
            </div>
          </div>
          <div className={`d-flex align-items-center gap-2 small bg-light px-3 py-2 rounded-pill shadow-sm ${locationLoading ? 'text-warning' : 'text-success'}`}>
            <span className={`d-inline-block rounded-circle ${locationLoading ? 'bg-warning' : 'bg-success'}`} style={{ width: '8px', height: '8px', animation: locationLoading ? 'none' : 'pulse 1.5s infinite' }}></span>
            <span className="fw-bold">{locationLoading ? 'Syncing...' : 'Live GPS'}</span>
          </div>
        </div>
      </header>

      <main className="flex-grow-1 w-100 px-3 py-4 mx-auto animate-fade-in" style={{ maxWidth: '448px' }}>
        <div className="rounded-4 p-4 text-white shadow-sm position-relative overflow-hidden mb-4 bg-primary-green hover-scale transition-all">
          <div className="position-absolute top-0 end-0 mt-n5 me-n5 bg-white opacity-10 rounded-circle" style={{ width: '128px', height: '128px', filter: 'blur(32px)' }}></div>
          <div className="position-relative z-1 d-flex justify-content-between align-items-start">
            <div>
              <h2 className="display-4 fw-bold mb-0">{data.current.temperature}°</h2>
              <p className="text-white-50 mt-1 d-flex align-items-center gap-1 mb-0 font-monospace" style={{ fontSize: '0.7rem' }}>
                <Icon name="location_on" className="fs-6" />
                {user?.latitude.toFixed(4)}, {user?.longitude.toFixed(4)}
              </p>
            </div>
            <Icon name="partly_cloudy_day" className="display-3 text-warning" filled />
          </div>
          <div className="position-relative z-1 row g-2 mt-4">
            <div className="col">
              <div className="bg-white bg-opacity-10 rounded-3 p-2 text-center transition-all hover-scale">
                <Icon name="water_drop" className="text-info mb-1" />
                <p className="small text-white-50 mb-0">Air Humid</p>
                <p className="fw-bold mb-0">{data.current.humidity}%</p>
              </div>
            </div>
            <div className="col">
              <div className="bg-white bg-opacity-10 rounded-3 p-2 text-center transition-all hover-scale">
                <Icon name="grass" className="text-white mb-1" />
                <p className="small text-white-50 mb-0">Soil</p>
                <p className="fw-bold mb-0 lh-1">{currentMoisture}%</p>
                <span className={`extra-small fw-bold ${moistStatus.color}`} style={{ fontSize: '0.65rem' }}>{moistStatus.text}</span>
              </div>
            </div>
            <div className="col">
              <div className="bg-white bg-opacity-10 rounded-3 p-2 text-center transition-all hover-scale">
                <Icon name="device_thermostat" className="text-warning mb-1" />
                <p className="small text-white-50 mb-0">Health</p>
                <p className="fw-bold mb-0 lh-1">{data.current.temperature}°</p>
                <span className={`extra-small fw-bold ${tempStatus.color}`} style={{ fontSize: '0.65rem' }}>{tempStatus.text}</span>
              </div>
            </div>
          </div>

          <div className="position-relative z-1 mt-3 bg-white bg-opacity-10 rounded-3 p-2 d-flex align-items-center gap-2">
            <Icon name="tips_and_updates" className="text-warning fs-5" />
            <p className="small mb-0 flex-grow-1 text-white-50" style={{ fontSize: '0.75rem' }}>
              <span className="text-white fw-bold">Smart Tip:</span> {getSmartTip()}
            </p>
          </div>
        </div>

        <section className="bg-white rounded-4 p-4 shadow-sm border mb-4 hover-scale transition-all">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h3 className="h6 fw-bold mb-0 text-dark">24h Temperature</h3>
            <span className="small text-muted">Open-Meteo Source</span>
          </div>
          <div style={{ height: '192px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffc107" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ffc107" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} unit="°" />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#333', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="temp" stroke="#ffc107" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-4 p-4 shadow-sm border mb-4 hover-scale transition-all">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h3 className="h6 fw-bold mb-0 text-dark">Soil Moisture Trend</h3>
          </div>
          <div style={{ height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMoist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#198754" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#198754" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#333', color: '#fff' }} />
                <Area type="monotone" dataKey="moisture" stroke="#198754" strokeWidth={3} fillOpacity={1} fill="url(#colorMoist)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="d-flex justify-content-between mt-2 small fw-medium text-muted px-1">
            <span>Now</span>
            <span>+12h</span>
            <span>+24h</span>
          </div>
        </section>

      </main>
      <BottomNav />
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
