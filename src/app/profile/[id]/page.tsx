"use client";

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/features/auth/context/AuthContext';
import { auth } from '@/lib/firebase';
import { useParams, useRouter } from 'next/navigation';
import { BottomNav } from '@/components/common/BottomNav';

export default function PublicProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const targetUserId = params.id as string;
    
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            const requestId = `req_${Date.now().toString(36)}`;
            console.log(`[Profile][${requestId}] Fetching profile for UID: "${targetUserId}"`);

            if (!targetUserId) {
                setError('Invalid user ID in URL');
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/users/${targetUserId}`);
                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                    console.error(`[Profile][${requestId}] API Error:`, res.status, data);
                    setError(data.message || `Server error (${res.status})`);
                    // If we have a requestId from server, log it for support
                    if (data.requestId) console.warn(`[Profile][${requestId}] Server Request ID: ${data.requestId}`);
                    return;
                }
                
                console.log(`[Profile][${requestId}] Success:`, data.username);
                setProfile(data);
                
                // If logged in, check follow status
                if (user && auth.currentUser) {
                    const token = await auth.currentUser.getIdToken();
                    const checkFollowRes = await fetch(`/api/follow?checkFolloweeId=${targetUserId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (checkFollowRes.ok) {
                        const followData = await checkFollowRes.json();
                        setIsFollowing(followData.isFollowing);
                    }
                }
            } catch (err: any) {
                console.error(`[Profile][${requestId}] Network/Fetch error:`, err);
                setError(`Network error: ${err.message || 'Check your connection'}`);
            } finally {
                setLoading(false);
            }
        };

        if (targetUserId) fetchProfile();
    }, [targetUserId, user]);

    const handleFollowToggle = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        setFollowLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const method = isFollowing ? 'DELETE' : 'POST';
            
            const res = await fetch(`/api/follow`, {
                method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                // For DELETE we still need to send the followee_id in the body
                body: JSON.stringify({ followee_id: targetUserId })
            });

            if (res.ok) {
                setIsFollowing(!isFollowing);
                setProfile((prev: any) => ({
                    ...prev,
                    follower_count: prev.follower_count + (isFollowing ? -1 : 1)
                }));
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to update follow status');
            }
        } catch (err) {
            alert('Something went wrong. Try again.');
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) return (
        <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
            <div className="spinner-border text-success mb-3" />
            <span className="text-muted small">Loading Profile...</span>
        </div>
    );

    if (error || !profile) return (
        <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-light px-4 text-center">
            <span className="material-symbols-outlined display-1 text-muted mb-3">person_off</span>
            <h3 className="h5 fw-bold">{error || 'User Not Found'}</h3>
            <button onClick={() => router.back()} className="btn btn-primary-green mt-3 px-4 rounded-pill">
                Go Back
            </button>
        </div>
    );

    const isOwnProfile = user?.id === targetUserId;

    return (
        <div className="min-vh-100 bg-light d-flex flex-column pb-5">
            <Header title={profile.full_name} showBack={true} />

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
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Profile" className="w-100 h-100 object-fit-cover" />
                                    ) : (
                                        <span className="fs-1 fw-bold">{profile.full_name.charAt(0)}</span>
                                    )}
                                </div>
                            </div>
                            <span className="position-absolute bottom-0 end-0 bg-white rounded-circle p-1 shadow-sm border border-2 border-white">
                                <span className={`d-block rounded-circle bg-success`} style={{ width: '12px', height: '12px' }}></span>
                            </span>
                        </div>

                        <div className="mt-2">
                            <h1 className="h5 fw-bold mb-0 text-dark">{profile.full_name}</h1>
                            <p className="text-muted small mb-1">@{profile.username}</p>
                            <span className="badge bg-success-subtle text-success small rounded-pill fw-bold" style={{ fontSize: '10px' }}>
                                {profile.role === 'ADMIN' ? 'Administrator' : profile.role === 'EXPERT' ? 'Agriculture Expert' : 'Citizen Farmer'}
                            </span>
                        </div>

                        {!isOwnProfile && profile.role === 'EXPERT' && (user?.role === 'FARMER' || user?.role === 'EXPERT') && (
                            <div className="mt-3">
                                <button 
                                    onClick={handleFollowToggle} 
                                    disabled={followLoading}
                                    className={`btn ${isFollowing ? 'btn-light border text-dark' : 'btn-success'} rounded-pill px-4 fw-bold shadow-sm`}
                                    style={{ transition: 'all 0.2s', width: '140px' }}
                                >
                                    {followLoading ? (
                                        <span className="spinner-border spinner-border-sm" />
                                    ) : isFollowing ? (
                                        <>Following</>
                                    ) : (
                                        <><Icon name="person_add" className="fs-6 me-1" /> Follow</>
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="d-flex align-items-center justify-content-center gap-4 my-4 border-top border-bottom py-3 mt-4">
                            {profile.role === 'EXPERT' && (
                                <div className="text-center">
                                    <div className="fw-bold h6 mb-0 text-dark">{profile.follower_count || 0}</div>
                                    <div className="text-muted" style={{ fontSize: '10px' }}>Followers</div>
                                </div>
                            )}
                            {profile.role === 'EXPERT' && (
                                <div className="text-center border-start ps-4">
                                    <div className="fw-bold h6 mb-0 text-dark">Expert</div>
                                    <div className="text-muted" style={{ fontSize: '10px' }}>Verified Role</div>
                                </div>
                            )}
                        </div>

                        {profile.role !== 'BUYER' && profile.farm_name && (
                            <div className="text-start mb-4 bg-light p-3 rounded-4 border">
                                <label className="small fw-bold text-muted text-uppercase mb-2 d-block">Farm / Brand Name</label>
                                <p className="small mb-0 text-dark" style={{ lineHeight: '1.6' }}>{profile.farm_name}</p>
                            </div>
                        )}
                        
                        {profile.location && (
                            <div className="text-start mb-4 bg-light p-3 rounded-4 border">
                                <label className="small fw-bold text-muted text-uppercase mb-2 d-block">Location</label>
                                <p className="small mb-0 text-dark" style={{ lineHeight: '1.6' }}>{profile.location}</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <BottomNav />
        </div>
    );
}
