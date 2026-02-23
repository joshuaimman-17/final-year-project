"use client";

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';

function ProfileContent() {
    const { user, logout, updateLocation, detectLocation, locationLoading } = useAuth();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdateLocation = async () => {
        if (!search) return;
        setLoading(true);
        try {
            const results = await api.searchLocation(search);
            if (results.length > 0) {
                const { lat, lon } = results[0];
                updateLocation(parseFloat(lat), parseFloat(lon));
                setSearch(''); // Clear input
            } else {
                alert('Location not found');
            }
        } catch (e) {
            alert('Error searching location');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 bg-light d-flex flex-column pb-5">
            <Header
                title="Profile & Settings"
                showBack={false}
            />

            <main className="flex-grow-1 w-100 mx-auto p-3 pt-4" style={{ maxWidth: '448px' }}>
                <section className="d-flex flex-column align-items-center mb-5">
                    <div className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center border border-white border-4 shadow-sm" style={{ width: '112px', height: '112px' }}>
                        <span className="display-4 fw-bold text-primary-green">{user?.full_name.charAt(0)}</span>
                    </div>
                    <div className="mt-3 text-center">
                        <h1 className="h4 fw-bold mb-0 text-dark">{user?.full_name}</h1>
                        <p className="text-muted small mb-0">{user?.farm_name}</p>
                    </div>
                </section>

                <section className="card rounded-4 shadow-sm border-0 overflow-hidden mb-4">
                    <div className="card-header bg-white border-bottom p-3">
                        <h3 className="h6 fw-bold d-flex align-items-center gap-2 mb-0">
                            <Icon name="location_on" className="text-primary-green" />
                            Farm Location
                            {locationLoading ? (
                                <span className="badge bg-warning-subtle text-warning fw-normal ms-auto" style={{ fontSize: '10px' }}>
                                    <span className="spinner-border spinner-border-sm me-1" style={{ width: '10px', height: '10px', borderWidth: '2px' }}></span>
                                    Detecting...
                                </span>
                            ) : (
                                <span className="badge bg-success-subtle text-success fw-normal ms-auto d-flex align-items-center gap-1" style={{ fontSize: '10px' }}>
                                    <span className="d-inline-block rounded-circle bg-success" style={{ width: '6px', height: '6px', animation: 'pulse 2s infinite' }}></span>
                                    GPS Live
                                </span>
                            )}
                        </h3>
                    </div>
                    <div className="card-body p-3">
                        <div className="mb-4">
                            <span className="small fw-bold text-muted text-uppercase mb-2 d-block">Current Coordinates</span>
                            <div className="bg-light p-3 rounded-3 d-flex align-items-center justify-content-between">
                                <p className="font-monospace small mb-0">{user?.latitude?.toFixed(4) ?? 'N/A'}, {user?.longitude?.toFixed(4) ?? 'N/A'}</p>
                                <button
                                    onClick={detectLocation}
                                    className="btn btn-sm btn-outline-success rounded-pill px-3 d-flex align-items-center gap-1"
                                    disabled={locationLoading}
                                >
                                    <Icon name="my_location" style={{ fontSize: '14px' }} />
                                    <span style={{ fontSize: '11px' }}>Detect</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="small fw-bold text-muted text-uppercase mb-2 d-block">Search Location</label>
                            <div className="d-flex gap-2">
                                <input
                                    className="form-control rounded-3 bg-light border-0 shadow-none"
                                    type="text"
                                    placeholder="City, Region"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <button
                                    onClick={handleUpdateLocation}
                                    disabled={loading}
                                    className="btn btn-primary-green rounded-3 px-3 fw-bold"
                                >
                                    {loading ? '...' : 'Set'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mt-4">
                    <button
                        onClick={async () => { await logout(); router.push('/login'); }}
                        className="btn btn-outline-danger w-100 py-3 rounded-4 fw-bold d-flex align-items-center justify-content-center gap-2"
                    >
                        <Icon name="logout" />
                        Log Out
                    </button>
                </section>
            </main>
            <BottomNav />
        </div>
    );
}

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <ProfileContent />
        </ProtectedRoute>
    );
}
