"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/features/auth/context/AuthContext';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/common/ToastContext';

// Dynamic import for Leaflet map mapping (no SSR)
const FarmMap = dynamic(() => import('@/features/field/components/MapComponent'), { ssr: false, loading: () => <div className="spinner-border spinner-border-sm text-success" /> });

function ProfileContent() {
    const { user, logout, updateLocation, detectLocation, locationLoading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    // Profile Edit State
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [farmNameState, setFarmNameState] = useState('');
    const [usernameState, setUsernameState] = useState('');
    const [phoneNumberState, setPhoneNumberState] = useState('');
    const [aboutState, setAboutState] = useState('');
    const [skillsState, setSkillsState] = useState('');
    const [experienceState, setExperienceState] = useState('');
    const [projectsState, setProjectsState] = useState('');
    const [achievementsState, setAchievementsState] = useState('');
    const [portfolioLinkState, setPortfolioLinkState] = useState('');

    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameMessage, setUsernameMessage] = useState('');

    // Address Management State
    const [addresses, setAddresses] = useState<any[]>([]);
    const [addrLoading, setAddrLoading] = useState(true);
    const [editingAddr, setEditingAddr] = useState<any>(null);
    const [addrForm, setAddrForm] = useState({ name: '', phone: '', street: '', city: '', state: '', pincode: '', is_default: false });
    const [addrSaving, setAddrSaving] = useState(false);
    
    // Map Search state for Addresses
    const [mapSearch, setMapSearch] = useState('');
    const [mapLat, setMapLat] = useState<number>(user?.latitude || 20.5937);
    const [mapLon, setMapLon] = useState<number>(user?.longitude || 78.9629);

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setFarmNameState(user.farm_name || '');
            setUsernameState(user.username || '');
            setPhoneNumberState(user.phoneNumber || '');
            setAboutState(user.about || '');
            setSkillsState(user.skills || '');
            setExperienceState(user.experience || '');
            setProjectsState(user.projects || '');
            setAchievementsState(user.achievements || '');
            setPortfolioLinkState(user.portfolio_link || '');
            if (user.latitude && user.longitude) {
                setMapLat(user.latitude);
                setMapLon(user.longitude);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchAddresses();
    }, []);

    // Live username validation
    useEffect(() => {
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
        // Phone validation
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneNumberState || !phoneRegex.test(phoneNumberState)) {
            showToast("Please enter a valid mobile number", "error");
            return;
        }

        setLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/auth/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    full_name: fullName,
                    farm_name: farmNameState,
                    username: usernameState,
                    phone_number: phoneNumberState,
                    about: aboutState,
                    skills: skillsState,
                    experience: experienceState,
                    projects: projectsState,
                    achievements: achievementsState,
                    portfolio_link: portfolioLinkState
                })
            });

            if (res.ok) {
                showToast('Profile updated successfully!', 'success');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showToast('Failed to update profile', 'error');
            }
        } catch (e) {
            showToast('Network error updating profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAddresses = async () => {
        setAddrLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;
            const res = await fetch('/api/user/addresses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAddresses(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAddrLoading(false);
        }
    };

    const handleAddrFormLocate = async () => {
        if (!navigator.geolocation) {
            showToast("Geolocation is not supported by your browser", "error");
            return;
        }

        showToast("Fetching precise location...", "info");
        
        const options = {
            enableHighAccuracy: true,
            timeout: 15000, // Increased to 15s for mobile stability
            maximumAge: 300000 // Use cache up to 5 min old for speed
        };

        const successCallback = async (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            setMapLat(latitude);
            setMapLon(longitude);

            try {
                const addressObj = await api.reverseGeocode(latitude, longitude);
                if (addressObj) {
                    setAddrForm({
                        ...addrForm,
                        street: addressObj.street || addrForm.street,
                        city: addressObj.city || addrForm.city,
                        state: addressObj.state || addrForm.state,
                        pincode: addressObj.pincode || addrForm.pincode
                    });
                    showToast("Address autofilled using GPS!", "success");
                } else {
                    showToast("Location captured, but address lookup failed. Please enter manually.", "warning");
                }
            } catch (err) {
                showToast("Reverse geocoding failed. Please enter address manually.", "warning");
            }
        };

        const errorCallback = (err: GeolocationPositionError) => {
            // Fallback: If high accuracy fails or times out, try standard accuracy
            if (options.enableHighAccuracy) {
                showToast("Switching to standard location for better speed...", "info");
                navigator.geolocation.getCurrentPosition(
                    successCallback,
                    (finalErr) => {
                        let errorMsg = "Failed to get your current location.";
                        if (finalErr.code === 1) errorMsg = "Location permission denied. Please enter address manually.";
                        else if (finalErr.code === 2) errorMsg = "Location unavailable. Please enter address manually.";
                        else if (finalErr.code === 3) errorMsg = "Location request timed out. Please enter address manually.";
                        
                        showToast(errorMsg, "error");
                        console.error("Geolocation error:", finalErr);
                    },
                    { ...options, enableHighAccuracy: false, timeout: 10000 }
                );
            } else {
                let errorMsg = "Failed to get your location.";
                if (err.code === 1) errorMsg = "Location permission denied.";
                else if (err.code === 2) errorMsg = "Location unavailable.";
                else if (err.code === 3) errorMsg = "Location request timed out.";
                showToast(errorMsg + " Please enter address manually.", "error");
            }
        };

        navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Pincode validation mapping roughly
        if (!/^[1-9][0-9]{5}$/.test(addrForm.pincode)) {
             showToast("Please enter a valid 6-digit Indian Pincode", "error");
             return;
        }

        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(addrForm.phone)) {
            showToast("Please enter a valid phone number", "error");
            return;
        }

        setAddrSaving(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const isEditing = !!editingAddr?.id;
            const url = isEditing ? `/api/user/addresses/${editingAddr.id}` : '/api/user/addresses';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(addrForm)
            });

            if (res.ok) {
                showToast(`Address ${isEditing ? 'updated' : 'added'}!`, 'success');
                setEditingAddr(null);
                setAddrForm({ name: '', phone: '', street: '', city: '', state: '', pincode: '', is_default: false });
                fetchAddresses();
            } else {
                showToast("Failed to save address", "error");
            }
        } catch (e) {
            showToast("Network error", "error");
        } finally {
            setAddrSaving(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`/api/user/addresses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast("Address deleted", "success");
                setAddresses(addresses.filter(a => a.id !== id));
            }
        } catch (e) {
            showToast("Failed to delete", "error");
        }
    };

    return (
        <div className="min-vh-100 bg-light d-flex flex-column pb-5">
            <Header title="My Profile" showBack={true} />

            <main className="flex-grow-1 w-100 mx-auto p-3 pt-4 animate-fade-in" style={{ maxWidth: '448px' }}>
                {/* Hero Section */}
                <section className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 overflow-visible">
                    <div className="py-5 text-center position-relative" 
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
                                        <span className="fs-1 fw-bold">{user?.full_name?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-2">
                            <h1 className="h5 fw-bold mb-0 text-dark">{user?.full_name}</h1>
                            <p className="text-muted small mb-1">@{user?.username}</p>
                            <span className="badge bg-success-subtle text-success small rounded-pill fw-bold" style={{ fontSize: '10px' }}>
                                {user?.role ? user.role.toUpperCase() : 'BUYER'}
                            </span>
                        </div>

                        {(user?.role === 'EXPERT' || (user?.following_count || 0) > 0) && (
                            <div className="d-flex align-items-center justify-content-center gap-4 my-4 border-top border-bottom py-3 mt-4">
                                {user?.role === 'EXPERT' && (
                                    <div className="text-center">
                                        <div className="fw-bold h6 mb-0 text-dark">{user?.follower_count || 0}</div>
                                        <div className="text-muted" style={{ fontSize: '10px' }}>Followers</div>
                                    </div>
                                )}
                                <div className="text-center">
                                    <div className="fw-bold h6 mb-0 text-dark">{user?.following_count || 0}</div>
                                    <div className="text-muted" style={{ fontSize: '10px' }}>Following</div>
                                </div>
                                {user?.role === 'EXPERT' && (
                                    <div className="text-center">
                                        <div className="fw-bold h6 mb-0 text-dark">{user?.like_count || 0}</div>
                                        <div className="text-muted" style={{ fontSize: '10px' }}>Endorsements</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Account Settings */}
                <section className="card rounded-4 shadow-sm border-0 overflow-hidden mb-4">
                    <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
                        <h3 className="h6 fw-bold d-flex align-items-center gap-2 mb-0 text-dark">
                            <Icon name="manage_accounts" className="text-success" />
                            Personal Information
                        </h3>
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
                            <label className="small fw-bold text-muted text-uppercase mb-2 d-block">Mobile Number</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-0 text-muted"><Icon name="phone" style={{ fontSize: '18px' }} /></span>
                                <input className="form-control bg-light border-0 shadow-none py-2 fs-6" type="tel" value={phoneNumberState} onChange={(e) => setPhoneNumberState(e.target.value)} placeholder="+91..." />
                            </div>
                        </div>

                        {user?.role !== 'BUYER' && (
                            <div className="mb-3">
                                <label className="small fw-bold text-muted text-uppercase mb-2 d-block">Farm / Brand Name</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0 text-muted"><Icon name="eco" style={{ fontSize: '18px' }} /></span>
                                    <input className="form-control bg-light border-0 shadow-none py-2 fs-6" type="text" value={farmNameState} onChange={(e) => setFarmNameState(e.target.value)} />
                                </div>
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="small fw-bold text-muted text-uppercase mb-2 d-block">About Me / Bio</label>
                            <textarea className="form-control bg-light border-0 shadow-none py-2 fs-6" rows={3} value={aboutState} onChange={(e) => setAboutState(e.target.value)} placeholder="Tell us about yourself..." />
                        </div>

                        {user?.role === 'EXPERT' && (
                            <>
                                <div className="mb-3">
                                    <label className="small fw-bold text-muted text-uppercase mb-2 d-block">Specialized Skills</label>
                                    <input className="form-control bg-light border-0 shadow-none py-2 fs-6" type="text" value={skillsState} onChange={(e) => setSkillsState(e.target.value)} placeholder="e.g. Pest Control, Soil Health" />
                                </div>
                                <div className="mb-3">
                                    <label className="small fw-bold text-muted text-uppercase mb-2 d-block">Experience Details</label>
                                    <textarea className="form-control bg-light border-0 shadow-none py-2 fs-6" rows={2} value={experienceState} onChange={(e) => setExperienceState(e.target.value)} placeholder="Years of experience, fields worked in..." />
                                </div>
                                <div className="mb-3">
                                    <label className="small fw-bold text-muted text-uppercase mb-2 d-block">Projects</label>
                                    <textarea className="form-control bg-light border-0 shadow-none py-2 fs-6" rows={3} value={projectsState} onChange={(e) => setProjectsState(e.target.value)} placeholder="List your major agricultural projects..." />
                                </div>
                                <div className="mb-3">
                                    <label className="small fw-bold text-muted text-uppercase mb-2 d-block">Achievements & Awards</label>
                                    <textarea className="form-control bg-light border-0 shadow-none py-2 fs-6" rows={3} value={achievementsState} onChange={(e) => setAchievementsState(e.target.value)} placeholder="Certifications, awards, recognitions..." />
                                </div>
                                <div className="mb-3">
                                    <label className="small fw-bold text-muted text-uppercase mb-2 d-block">Portfolio / Professional Link</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-0 text-muted"><Icon name="link" style={{ fontSize: '18px' }} /></span>
                                        <input className="form-control bg-light border-0 shadow-none py-2 fs-6" type="url" value={portfolioLinkState} onChange={(e) => setPortfolioLinkState(e.target.value)} placeholder="https://linkedin.com/in/..." />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="mb-4">
                            <label className="small fw-bold text-muted text-uppercase mb-2 d-flex justify-content-between align-items-center">
                                Username
                                {checkingUsername && <span className="spinner-border spinner-border-sm text-success" style={{ width: 12, height: 12 }} />}
                                {!checkingUsername && usernameMessage && (
                                    <span className={`badge ${usernameAvailable ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                        {usernameMessage}
                                    </span>
                                )}
                            </label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-0 text-muted pe-1">@</span>
                                <input className={`form-control bg-light border-0 shadow-none py-2 fs-6 ${usernameAvailable === false ? 'is-invalid border border-danger' : ''}`} type="text" value={usernameState} onChange={(e) => setUsernameState(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} />
                            </div>
                        </div>

                        <button onClick={handleSaveProfile} disabled={loading || checkingUsername || usernameAvailable === false} className="btn btn-success w-100 py-3 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
                            {loading ? <span className="spinner-border spinner-border-sm" /> : <><Icon name="save" /> Save Changes</>}
                        </button>
                    </div>
                </section>

                {/* Secure Delivery Address Management with Map */}
                <section className="card rounded-4 shadow-sm border-0 overflow-hidden mb-4">
                    <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                        <h3 className="h6 fw-bold d-flex align-items-center gap-2 mb-0 text-dark">
                            <Icon name="local_shipping" className="text-secondary" />
                            Saved Addresses
                        </h3>
                        {!editingAddr && (
                            <button onClick={() => {
                                setEditingAddr({ id: '' });
                                setAddrForm({ name: user?.full_name || '', phone: user?.phoneNumber || '', street: '', city: '', state: '', pincode: '', is_default: addresses.length === 0 });
                            }} className="btn btn-sm text-primary-green fw-bold p-0 d-flex gap-1 align-items-center">
                                <Icon name="add" style={{ fontSize: 16 }}/> Add New
                            </button>
                        )}
                    </div>
                    
                    <div className="card-body p-3">
                        {editingAddr ? (
                            <form onSubmit={handleSaveAddress} className="animate-fade-in">
                                <div className="mb-3">
                                    <h4 className="small fw-bold text-dark text-uppercase mb-3 border-bottom pb-2">
                                        {editingAddr.id ? 'Edit Address' : 'Add New Address'}
                                    </h4>
                                    
                                    {/* Map Integration */}
                                    <div className="position-relative overflow-hidden rounded-4 mb-3" style={{ height: 160, border: '1px solid #ccc' }}>
                                        <FarmMap lat={mapLat} lon={mapLon} isLive={true} onRecenter={() => handleAddrFormLocate()} />
                                        <div className="position-absolute bottom-0 start-0 m-2" style={{ zIndex: 1000}}>
                                            <button type="button" onClick={handleAddrFormLocate} className="btn btn-sm btn-light border shadow-sm fw-bold d-flex align-items-center gap-1" style={{ fontSize: 11 }}>
                                                <Icon name="gps_fixed" style={{ fontSize: 14, color: '#2E7D32' }}/> Use Live Location
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="row g-2">
                                        <div className="col-12">
                                            <input required placeholder="Receiver's Name" className="form-control" value={addrForm.name} onChange={e => setAddrForm({...addrForm, name: e.target.value})} />
                                        </div>
                                        <div className="col-12">
                                            <input required placeholder="Mobile Number" className="form-control" type="tel" value={addrForm.phone} onChange={e => setAddrForm({...addrForm, phone: e.target.value})} />
                                        </div>
                                        <div className="col-12">
                                            <input required placeholder="Street / Area / Locality" className="form-control" value={addrForm.street} onChange={e => setAddrForm({...addrForm, street: e.target.value})} />
                                        </div>
                                        <div className="col-6">
                                            <input required placeholder="City" className="form-control" value={addrForm.city} onChange={e => setAddrForm({...addrForm, city: e.target.value})} />
                                        </div>
                                        <div className="col-6">
                                            <input required placeholder="State" className="form-control" value={addrForm.state} onChange={e => setAddrForm({...addrForm, state: e.target.value})} />
                                        </div>
                                        <div className="col-12">
                                            <input required placeholder="6-digit Pincode" className="form-control" type="text" maxLength={6} value={addrForm.pincode} onChange={e => setAddrForm({...addrForm, pincode: e.target.value.replace(/\D/g, '')})} />
                                        </div>
                                        <div className="col-12">
                                            <div className="form-check form-switch mt-2">
                                                <input className="form-check-input" type="checkbox" id="defaultAddr" checked={addrForm.is_default} onChange={e => setAddrForm({...addrForm, is_default: e.target.checked})} />
                                                <label className="form-check-label small text-muted" htmlFor="defaultAddr">Set as Default Delivery Address</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <button type="button" onClick={() => setEditingAddr(null)} className="btn btn-light border py-2 flex-grow-1 fw-bold">Cancel</button>
                                    <button type="submit" disabled={addrSaving} className="btn btn-primary-green py-2 flex-grow-1 fw-bold">
                                        {addrSaving ? <span className="spinner-border spinner-border-sm" /> : 'Save Address'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            addrLoading ? (
                                <div className="text-center py-3"><span className="spinner-border text-success" /></div>
                            ) : addresses.length === 0 ? (
                                <div className="text-center p-3 text-muted small border rounded-3 bg-light" style={{ borderStyle: 'dashed !important' }}>
                                    No addresses saved. Add one to checkout quickly!
                                </div>
                            ) : (
                                <div className="d-grid gap-3">
                                    {addresses.map(addr => (
                                        <div key={addr.id} className="border rounded-4 p-3 position-relative bg-light">
                                            {addr.is_default && <span className="badge bg-success position-absolute top-0 end-0 m-3">Default</span>}
                                            <div className="fw-bold fs-6 text-dark">{addr.name}</div>
                                            <div className="small text-muted mb-1"><Icon name="phone" style={{ fontSize: 13 }}/> {addr.phone}</div>
                                            <div className="small text-dark lh-sm pe-4">
                                                {addr.street}, {addr.city}, <br/>
                                                {addr.state} - {addr.pincode}
                                            </div>
                                            
                                            <div className="d-flex gap-3 mt-3 border-top pt-2">
                                                <button onClick={() => {
                                                    setEditingAddr(addr); 
                                                    setAddrForm(addr);
                                                }} className="btn btn-sm btn-link text-decoration-none text-primary fw-bold p-0">Edit</button>
                                                <button onClick={() => handleDeleteAddress(addr.id)} className="btn btn-sm btn-link text-decoration-none text-danger fw-bold p-0">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </section>

                <section className="mt-4 text-center">
                    <button onClick={async () => { await logout(); router.push('/login'); }} 
                            className="btn btn-white text-danger border shadow-sm py-2 px-4 rounded-pill fw-bold d-inline-flex align-items-center gap-2 m-auto">
                        <Icon name="logout" /> Log Out Acccount
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
