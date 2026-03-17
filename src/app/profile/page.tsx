"use client";

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';

function ProfileContent() {
    const { user, logout, updateLocation, detectLocation, locationLoading } = useAuth();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [farmNameState, setFarmNameState] = useState(user?.farm_name || '');
    const [usernameState, setUsernameState] = useState(user?.username || '');
    const [phoneNumberState, setPhoneNumberState] = useState(user?.phoneNumber || '');
    const [aboutState, setAboutState] = useState(user?.about || '');

    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameMessage, setUsernameMessage] = useState('');

    // Sync state when user data loads
    React.useEffect(() => {
        if (user) {
            setFullName(user.full_name);
            setFarmNameState(user.farm_name);
            setUsernameState(user.username);
            setPhoneNumberState(user.phoneNumber || '');
            setAboutState(user.about || '');
        }
    }, [user]);

    // Live username validation
    React.useEffect(() => {
        if (!usernameState || usernameState === user?.username) {
            setUsernameAvailable(null);
            setCheckingUsername(false);
            setUsernameMessage('');
            return;
        }

        if (usernameState.length < 3) {
            setUsernameAvailable(false);
            setUsernameMessage('Too short');
            return;
        }

        const checkUsername = async () => {
            setCheckingUsername(true);
            try {
                const res = await fetch(`/api/users/check-username?username=${usernameState}`);
                const data = await res.json();
                setUsernameAvailable(data.available);
                setUsernameMessage(data.available ? 'Available' : 'Username taken');
            } catch (e) {
                console.error("Check failed", e);
            } finally {
                setCheckingUsername(false);
            }
        };

        const timer = setTimeout(checkUsername, 500);
        return () => clearTimeout(timer);
    }, [usernameState, user?.username]);

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/auth/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: fullName,
                    farm_name: farmNameState,
                    username: usernameState,
                    phone_number: phoneNumberState,
                    about: aboutState
                })
            });

            if (res.ok) {
                alert('Profile updated successfully!');
                window.location.reload();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to update profile');
            }
        } catch (e) {
            alert('Error updating profile');
        } finally {
            setLoading(false);
        }
    };

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

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateStr));
    };

    return (
        <div className="min-vh-100 bg-light d-flex flex-column pb-5">
            <Header title="My Profile" showBack={false} />

            <main className="flex-grow-1 w-100 mx-auto p-3 pt-4" style={{ maxWidth: '448px' }}>
                <section className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 overflow-visible">
                    <div className="bg-success py-5 text-center position-relative" 
                         style={{ background: 'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)', height: '100px' }}>
                    </div>
                    
                    <div className="px-4 text-center" style={{ marginTop: '-45px' }}>
                        <div className="position-relative d-inline-block">
                            <div className="rounded-circle bg-white p-1 shadow-sm d-inline-block">
                                <div className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center text-primary-green overflow-hidden" 
                                     style={{ width: '88px', height: '88px' }}>
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="Profile" className="w-100 h-100 object-fit-cover" />
                                    ) : (
                                        <span className="fs-1 fw-bold">{user?.full_name.charAt(0)}</span>
                                    )}
                                </div>
                            </div>
                            <span className="position-absolute bottom-0 end-0 bg-white rounded-circle p-1 shadow-sm border border-2 border-white">
                                <span className={`d-block rounded-circle bg-success`} style={{ width: '12px', height: '12px' }}></span>
                            </span>
                        </div>

                        <div className="mt-2">
                            <h1 className="h5 fw-bold mb-0 text-dark">{user?.full_name}</h1>
                            <p className="text-muted small mb-1">@{user?.username}</p>
                            <span className="badge bg-success-subtle text-success small rounded-pill fw-bold" style={{ fontSize: '10px' }}>
                                Role: {user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : 'N/A'}
                            </span>
                            {(user?.role === 'BUYER' || user?.role === 'FARMER') && user?.expert_status === 'pending' && (
                                <span className="badge bg-warning-subtle text-warning small rounded-pill fw-bold ms-2" style={{ fontSize: '10px' }}>
                                    Pending Expert Approval
                                </span>
                            )}
                        </div>

                        <div className="d-flex align-items-center justify-content-center gap-4 my-4 border-top border-bottom py-3 mt-4">
                            {user?.role === 'EXPERT' && (
                                <div className="text-center">
                                    <div className="fw-bold h6 mb-0 text-dark">{user?.follower_count || 0}</div>
                                    <div className="text-muted" style={{ fontSize: '10px' }}>Followers</div>
                                </div>
                            )}
                            {(user?.role === 'BUYER' || user?.role === 'FARMER') && (
                                <div className="text-center">
                                    <div className="fw-bold h6 mb-0 text-dark">{user?.following_count || 0}</div>
                                    <div className="text-muted" style={{ fontSize: '10px' }}>Following</div>
                                </div>
                            )}
                            {user?.role === 'EXPERT' && (
                                <div className="text-center">
                                    <div className="fw-bold h6 mb-0 text-dark">{user?.like_count || 0}</div>
                                    <div className="text-muted" style={{ fontSize: '10px' }}>Endorsements</div>
                                </div>
                            )}
                        </div>

                        {user?.role === 'EXPERT' && (
                            <div className="text-start mb-4">
                                <label className="small fw-bold text-muted text-uppercase mb-2 d-block">About</label>
                                <textarea 
                                    className="form-control bg-light border-0 small rounded-3"
                                    rows={3}
                                    placeholder="Tell us about yourself or your farm..."
                                    value={aboutState}
                                    onChange={(e) => setAboutState(e.target.value)}
                                    style={{ fontSize: '13px' }}
                                />
                            </div>
                        )}
                    </div>
                </section>

                <section className="card rounded-4 shadow-sm border-0 overflow-hidden mb-4">
                    <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
                        <h3 className="h6 fw-bold d-flex align-items-center gap-2 mb-0 text-dark">
                            <Icon name="settings" className="text-success" />
                            Account Settings
                        </h3>
                        {user?.last_login && (
                            <span className="text-muted" style={{ fontSize: '9px' }}>Active {formatDate(user.last_login)}</span>
                        )}
                    </div>
                    <div className="card-body p-4 pt-3">
                        <div className="mb-3">
                            <label className="small fw-bold text-muted text-uppercase mb-2 d-block">Full Name</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-0 text-muted"><Icon name="person" style={{ fontSize: '18px' }} /></span>
                                <input className="form-control bg-light border-0 shadow-none py-2 fs-6" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="small fw-bold text-muted text-uppercase mb-2 d-block">Farm Brand</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-0 text-muted"><Icon name="eco" style={{ fontSize: '18px' }} /></span>
                                <input className="form-control bg-light border-0 shadow-none py-2 fs-6" type="text" value={farmNameState} onChange={(e) => setFarmNameState(e.target.value)} />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="small fw-bold text-muted text-uppercase mb-2 d-block d-flex justify-content-between">
                                Verified Username
                                {checkingUsername && <span className="spinner-border spinner-border-sm" style={{ width: '10px', height: '10px' }}></span>}
                                {!checkingUsername && usernameMessage && (
                                    <span className={usernameAvailable ? 'text-success' : 'text-danger'} style={{ fontSize: '10px', textTransform: 'none' }}>
                                        {usernameAvailable ? '✓ ' : '✕ '}{usernameMessage}
                                    </span>
                                )}
                            </label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-0 text-muted pe-1">@</span>
                                <input className={`form-control bg-light border-0 shadow-none py-2 fs-6 ${usernameAvailable === false ? 'is-invalid' : ''}`} type="text" value={usernameState} onChange={(e) => setUsernameState(e.target.value)} />
                            </div>
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            disabled={loading || checkingUsername || usernameAvailable === false}
                            className="btn btn-success w-100 py-3 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 mb-2"
                        >
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : <><Icon name="cloud_upload" /> Update Profile</>}
                        </button>
                    </div>
                </section>

                <section className="card rounded-4 shadow-sm border-0 overflow-hidden mb-4">
                    <div className="card-header bg-white border-bottom p-3">
                        <h3 className="h6 fw-bold d-flex align-items-center gap-2 mb-0 text-dark">
                            <Icon name="my_location" className="text-success" />
                            Location Services
                        </h3>
                    </div>
                    <div className="card-body p-4 pt-3">
                        <div className="bg-light p-3 rounded-3 mb-3 border">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <span className="small fw-bold text-muted text-uppercase">GPS Coordinates</span>
                                {locationLoading && <span className="spinner-border spinner-border-sm text-success" style={{ width: '12px', height: '12px' }}></span>}
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                                <p className="font-monospace mb-0 text-dark fw-bold">{user?.latitude?.toFixed(5) ?? '0.00000'}, {user?.longitude?.toFixed(5) ?? '0.00000'}</p>
                                <button onClick={detectLocation} className="btn btn-sm btn-white border shadow-sm rounded-pill px-3 py-1" disabled={locationLoading}>
                                    <Icon name="gps_fixed" style={{ fontSize: '14px' }} className="me-1" />
                                    <span style={{ fontSize: '11px' }}>Verify</span>
                                </button>
                            </div>
                        </div>

                        <div className="input-group">
                            <input className="form-control border-light shadow-none bg-light" type="text" placeholder="Search City/District..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            <button onClick={handleUpdateLocation} disabled={loading} className="btn btn-success px-4">Search</button>
                        </div>
                    </div>
                </section>

                <section className="d-grid gap-3 mb-5">
                    <a href={user?.role === 'ADMIN' ? '/admin/dashboard' : user?.role === 'EXPERT' ? '/expert/dashboard' : user?.role === 'FARMER' ? '/farmer/dashboard' : '/marketplace'} 
                       className="btn btn-white border py-3 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-between px-4">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-success-subtle text-success p-2 rounded-3">
                                <Icon name="dashboard" />
                            </div>
                            <div className="text-start">
                                <div className="text-dark small lh-1">Access My</div>
                                <div className="text-success small fw-bold">
                                    {user?.role === 'BUYER' ? 'Shopping Center' : 'Command Center'}
                                </div>
                            </div>
                        </div>
                        <Icon name="chevron_right" />
                    </a>

                    <button onClick={async () => { await logout(); router.push('/login'); }} 
                            className="btn btn-outline-danger border-0 py-3 rounded-4 fw-bold d-flex align-items-center justify-content-center gap-2">
                        <Icon name="logout" /> Log Out My Account
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
