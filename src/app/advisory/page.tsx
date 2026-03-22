"use client";

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/features/auth/context/AuthContext';
import { api } from '@/services/api';
import { ClimateData, WeatherData } from '@/types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';

function AdvisoryContent() {
    const { user } = useAuth();
    const [climate, setClimate] = useState<ClimateData | null>(null);
    const [forecast, setForecast] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeatherData = async () => {
            if (!user) return;
            try {
                const foreData = await api.fetchWeather(user.latitude, user.longitude);
                setForecast(foreData);
            } catch (e) {
                console.error("Weather (Open-Meteo) Error:", e);
            }
        };

        const fetchClimateData = async () => {
            if (!user) return;
            try {
                const climData = await api.fetchClimate(user.latitude, user.longitude);
                setClimate(climData);
            } catch (e) {
                console.error("Climate (NASA) Error:", e);
            }
        };

        const loadAll = async () => {
            setLoading(true);
            await Promise.allSettled([fetchWeatherData(), fetchClimateData()]);
            setLoading(false);
        };

        loadAll();
    }, [user]);

    const rainData = climate ? climate.dates.map((d, i) => ({
        date: d,
        rain: climate.precipitation[i]
    })).slice(-14) : [];

    return (
        <div className="min-vh-100 d-flex flex-column pb-5 bg-light">
            <Header title="Climate & Forecast" showBack={false} />

            <main className="flex-grow-1 p-3 mx-auto w-100" style={{ maxWidth: '448px' }}>
                <section className="mb-4">
                    <h3 className="h6 fw-bold mb-3">7-Day Forecast</h3>
                    <div className="d-flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {forecast?.daily.time.map((t, i) => (
                            <div key={t} className="flex-shrink-0 d-flex flex-column align-items-center bg-white p-3 rounded-3 border" style={{ minWidth: '100px' }}>
                                <span className="small text-muted mb-2">{new Date(t).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                <Icon name={forecast.daily.precipitation_sum[i] > 2 ? 'rainy' : 'sunny'} className={`fs-1 mb-2 ${forecast.daily.precipitation_sum[i] > 2 ? 'text-primary' : 'text-warning'}`} filled />
                                <div className="d-flex gap-2 small fw-bold">
                                    <span>{forecast.daily.temperature_2m_max[i].toFixed(0)}°</span>
                                    <span className="text-muted">{forecast.daily.temperature_2m_min[i].toFixed(0)}°</span>
                                </div>
                            </div>
                        ))}
                        {loading && <div className="p-3 text-muted small">Loading forecast...</div>}
                    </div>
                </section>

                <section className="bg-white rounded-4 p-4 shadow-sm border mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <div>
                            <h3 className="h6 fw-bold mb-0">Historical Rainfall</h3>
                            <p className="small text-muted mb-0">Last 14 days (NASA POWER)</p>
                        </div>
                        <Icon name="water_drop" className="text-primary" />
                    </div>
                    {climate && climate.dates.length > 0 ? (
                        <div style={{ height: '192px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rainData}>
                                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Bar dataKey="rain" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="d-flex align-items-center justify-content-center text-muted small" style={{ height: '192px' }}>
                            {loading ? 'Fetching NASA Data...' : 'Climate data temporarily unavailable'}
                        </div>
                    )}
                </section>

                <section className="mb-4">
                    <h3 className="h6 fw-bold mb-3">System Advisories</h3>
                    {forecast && forecast.daily.precipitation_sum[0] > 5 && (
                        <div className="d-flex gap-3 p-3 bg-info-subtle rounded-3 border border-info-subtle mb-3">
                            <Icon name="rainy" className="text-primary" />
                            <div>
                                <h4 className="fw-bold text-dark mb-1 small">Heavy Rain Expected</h4>
                                <p className="small text-muted mb-0" style={{ fontSize: '0.75rem' }}>Consider postponing fertilization today due to runoff risk.</p>
                            </div>
                        </div>
                    )}

                    <div className="d-flex gap-3 p-3 bg-success-subtle rounded-3 border border-success-subtle">
                        <Icon name="calendar_today" className="text-success" />
                        <div>
                            <h4 className="fw-bold text-dark mb-1 small">Planting Window Open</h4>
                            <p className="small text-muted mb-0" style={{ fontSize: '0.75rem' }}>Soil temperatures are optimal for sowing summer crops.</p>
                        </div>
                    </div>
                </section>
            </main>
            <BottomNav />
        </div>
    );
}

export default function AdvisoryPage() {
    return (
        <ProtectedRoute>
            <AdvisoryContent />
        </ProtectedRoute>
    );
}
