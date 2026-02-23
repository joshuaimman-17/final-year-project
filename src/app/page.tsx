"use client";

import React from 'react';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { useWeatherData } from '@/hooks/useWeatherData';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';

function DashboardContent() {
  const { user, locationLoading } = useAuth();
  const lat = user?.latitude || 36.7783;
  const lon = user?.longitude || -119.4179;
  const { data, loading, error } = useWeatherData(lat, lon);

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

  return (
    <div className="d-flex flex-column min-vh-100 pb-5">
      <header className="sticky-top bg-white border-bottom px-3 py-2 shadow-sm">
        <div className="d-flex align-items-center justify-content-between" style={{ maxWidth: '448px', margin: '0 auto' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success" style={{ width: '40px', height: '40px' }}>
              <Icon name="eco" className="fs-4" />
            </div>
            <div>
              <h1 className="h5 mb-0 fw-bold text-primary-green">Dr.Plant</h1>
              <p className="small text-muted mb-0 fw-medium">{user?.farm_name}</p>
            </div>
          </div>
          <div className={`d-flex align-items-center gap-2 small bg-light px-2 py-1 rounded-pill ${locationLoading ? 'text-warning' : 'text-muted'}`}>
            <span className={`d-inline-block rounded-circle ${locationLoading ? 'bg-warning' : 'bg-success'}`} style={{ width: '8px', height: '8px', animation: locationLoading ? 'none' : 'pulse 2s infinite' }}></span>
            {locationLoading ? 'Tracking...' : 'Live GPS'}
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
                <p className="small text-white-50 mb-0">Humidity</p>
                <p className="fw-bold mb-0">{data.current.humidity}%</p>
              </div>
            </div>
            <div className="col">
              <div className="bg-white bg-opacity-10 rounded-3 p-2 text-center transition-all hover-scale">
                <Icon name="grass" className="text-white mb-1" />
                <p className="small text-white-50 mb-0">Soil Moist</p>
                <p className="fw-bold mb-0">{currentMoisture}%</p>
              </div>
            </div>
            <div className="col">
              <div className="bg-white bg-opacity-10 rounded-3 p-2 text-center transition-all hover-scale">
                <Icon name="device_thermostat" className="text-warning mb-1" />
                <p className="small text-white-50 mb-0">Soil Temp</p>
                <p className="fw-bold mb-0">{data.current.temperature}°</p>
              </div>
            </div>
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
