"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { auth } from '@/lib/firebase';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

function UserDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [formData, setFormData] = useState({ skills: '', experience: '', portfolio_link: '', message: '' });
    const [submitMsg, setSubmitMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) return;
        const role = user.role?.toUpperCase();
        // Admin should never be on this page
        if (role === 'ADMIN') router.replace('/admin/dashboard');
        // Approved expert goes to expert dashboard
        if (role === 'EXPERT') router.replace('/expert/dashboard');
        // Buyer goes to marketplace
        if (role === 'BUYER') router.replace('/marketplace');
    }, [user, router]);

    const handleApplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitMsg('');
        try {
            const fbUser = auth.currentUser;
            if (!fbUser) return;
            const token = await fbUser.getIdToken();
            const res = await fetch('/api/admin/expert-requests', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                setSubmitMsg('✅ Application submitted! The admin will review it shortly.');
                setShowApplyForm(false);
            } else {
                setSubmitMsg(`❌ ${data.message}`);
            }
        } catch (err) {
            setSubmitMsg('❌ Failed to submit application. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleForceRefresh = async () => {
        // Clear localStorage cache and force a fresh sync
        const fbUser = auth.currentUser;
        if (fbUser) {
            const userId = fbUser.phoneNumber || fbUser.uid;
            localStorage.removeItem(`drplant_profile_data_${userId}`);
        }
        window.location.reload();
    };

    if (!user) return null;

    return (
        <div className="d-flex flex-column min-vh-100 pb-5 bg-light">
            {/* Nav Header */}
            <header className="sticky-top bg-white border-bottom px-3 py-3 shadow-sm z-3">
                <div className="d-flex align-items-center justify-content-between mx-auto w-100" style={{ maxWidth: '448px' }}>
                    <div className="d-flex align-items-center gap-3">
                        <button onClick={() => router.push('/')} className="btn btn-light rounded-circle p-2 d-flex shadow-none border">
                            <span className="material-symbols-outlined fs-5">arrow_back</span>
                        </button>
                        <div className="d-flex align-items-center gap-2">
                            <div className="bg-success rounded-circle p-2 d-flex shadow-sm">
                                <span className="material-symbols-outlined text-white">agriculture</span>
                            </div>
                            <div>
                                <h1 className="h6 fw-bold mb-0">Farmer Dashboard</h1>
                                <p className="text-muted mb-0" style={{ fontSize: '10px' }}>Personal Agriculture Hub</p>
                            </div>
                        </div>
                    </div>
                    <span className="badge bg-success-subtle text-success rounded-pill fw-bold" style={{ fontSize: '10px' }}>FARMER</span>
                </div>
            </header>

            <main className="flex-grow-1 px-3 py-4 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                {/* Hero Welcome Card */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                    <div className="p-4 text-white" style={{ background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)' }}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h2 className="h5 fw-bold mb-1">Welcome, {user.full_name.split(' ')[0]}!</h2>
                                <p className="text-white-50 small mb-0">Monitor your farm and grow better.</p>
                                <button
                                    onClick={handleForceRefresh}
                                    className="btn btn-sm mt-2 text-white btn-link text-decoration-none p-0 opacity-75"
                                    style={{ fontSize: '10px' }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '12px', verticalAlign: 'middle' }}>refresh</span>
                                    {' '}Refresh Account Status
                                </button>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-circle p-3">
                                <span className="material-symbols-outlined fs-1 text-white">potted_plant</span>
                            </div>
                        </div>
                    </div>
                </div>

                {submitMsg && (
                    <div className={`alert border-0 shadow-sm rounded-4 animate-fade-in mb-4 py-2 px-3 fw-bold small ${submitMsg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>
                        {submitMsg}
                    </div>
                )}

                {/* Grid Menu */}
                <h3 className="h6 fw-bold text-muted text-uppercase mb-3 px-1" style={{ fontSize: '11px', letterSpacing: '1px' }}>Farm Operations</h3>
                <div className="row g-3 mb-4">
                    {[
                        { icon: 'biotech', title: 'Diagnosis', color: 'success', href: '/advisory' },
                        { icon: 'sensors', title: 'Telemetry', color: 'info', href: '/' },
                        { icon: 'storefront', title: 'Market', color: 'warning', href: '/marketplace' },
                        { icon: 'forum', title: 'Ask Expert', color: 'primary', href: '/community' },
                    ].map((item) => (
                        <div key={item.title} className="col-6">
                            <Link href={item.href} className="text-decoration-none">
                                <div className="card border-0 shadow-sm rounded-4 h-100 hover-scale transition-all text-center p-3">
                                    <div className={`bg-${item.color}-subtle text-${item.color} rounded-circle p-3 mx-auto mb-2 d-inline-flex`}>
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                    </div>
                                    <h4 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: '13px' }}>{item.title}</h4>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Become an Expert Section */}
                <h3 className="h6 fw-bold text-muted text-uppercase mb-3 px-1" style={{ fontSize: '11px', letterSpacing: '1px' }}>Career Path</h3>
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                    <div className="card-body p-4">
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div className="bg-warning-subtle text-warning rounded-circle p-2 d-flex">
                                <span className="material-symbols-outlined">grade</span>
                            </div>
                            <div className="flex-grow-1">
                                <h4 className="h6 fw-bold mb-0">Become a Dr.Plant Expert</h4>
                                <p className="text-muted mb-0" style={{ fontSize: '11px' }}>Share wisdom and help the community.</p>
                            </div>
                            {user.expert_status && user.expert_status !== 'none' && (
                                <span className={`badge rounded-pill fw-bold ${
                                    user.expert_status === 'pending' ? 'bg-warning-subtle text-warning' : 
                                    user.expert_status === 'approved' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                                }`} style={{ fontSize: '9px' }}>
                                    {user.expert_status.toUpperCase()}
                                </span>
                            )}
                        </div>

                        {user.expert_status === 'pending' ? (
                            <div className="bg-light p-3 rounded-4 text-center border">
                                <span className="material-symbols-outlined text-warning mb-2 d-block fs-3">history_edu</span>
                                <p className="small text-muted mb-0 fw-bold text-dark">Your expert request is under review.</p>
                                <p className="text-muted mb-0" style={{ fontSize: '10px' }}>You already have a pending expert request.</p>
                            </div>
                        ) : user.expert_status === 'denied' ? (
                            <div className="d-grid gap-3">
                                <div className="bg-danger-subtle text-danger p-3 rounded-4 text-center border border-danger-subtle">
                                    <p className="small mb-0 fw-bold">Your expert request was denied. You may apply again.</p>
                                </div>
                                <button onClick={() => setShowApplyForm(true)} className="btn btn-primary-green w-100 py-3 rounded-4 fw-bold shadow-sm">
                                    Apply Again
                                </button>
                            </div>
                        ) : user.expert_status === 'approved' ? (
                            <div className="bg-success-subtle p-3 rounded-4 text-center border border-success-subtle">
                                <span className="material-symbols-outlined text-success mb-2 d-block fs-3">verified</span>
                                <p className="small text-success mb-0 fw-bold">Expert Request Status: Approved</p>
                                <p className="text-muted mb-0" style={{ fontSize: '10px' }}>You are now an Expert. Redirecting to your dashboard...</p>
                            </div>
                        ) : !showApplyForm ? (
                            <button onClick={() => setShowApplyForm(true)} className="btn btn-primary-green w-100 py-3 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
                                <span className="material-symbols-outlined fs-6">auto_awesome</span>
                                Apply to Expert Panel
                            </button>
                        ) : (
                            <form onSubmit={handleApplySubmit} className="d-grid gap-3 animate-fade-in">
                                <div className="form-floating mb-1">
                                    <input required type="text" className="form-control border-0 bg-light rounded-3" id="skills" placeholder="Skills" value={formData.skills} onChange={e => setFormData(p => ({ ...p, skills: e.target.value }))} />
                                    <label htmlFor="skills" className="text-muted small">Specialized Skills (e.g. Pest Control)</label>
                                </div>
                                <div className="form-floating mb-1">
                                    <input required type="text" className="form-control border-0 bg-light rounded-3" id="exp" placeholder="Experience" value={formData.experience} onChange={e => setFormData(p => ({ ...p, experience: e.target.value }))} />
                                    <label htmlFor="exp" className="text-muted small">Years / Field of Experience</label>
                                </div>
                                <div className="form-floating mb-1">
                                    <input type="url" className="form-control border-0 bg-light rounded-3" id="url" placeholder="Portfolio" value={formData.portfolio_link} onChange={e => setFormData(p => ({ ...p, portfolio_link: e.target.value }))} />
                                    <label htmlFor="url" className="text-muted small">Portfolio or LinkedIn URL</label>
                                </div>
                                <div className="form-floating mb-3">
                                    <textarea className="form-control border-0 bg-light rounded-3" id="msg" placeholder="Message" style={{ height: '80px' }} value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} />
                                    <label htmlFor="msg" className="text-muted small">Tell us why you&apos;re a great fit</label>
                                </div>
                                <div className="row g-2">
                                    <div className="col-8">
                                        <button type="submit" disabled={submitting} className="btn btn-success w-100 py-3 rounded-4 fw-bold shadow-sm">
                                            {submitting ? <span className="spinner-border spinner-border-sm" /> : 'Submit Now'}
                                        </button>
                                    </div>
                                    <div className="col-4">
                                        <button type="button" onClick={() => setShowApplyForm(false)} className="btn btn-light w-100 py-3 rounded-4 border">Cancel</button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Logout Card */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
                    <button 
                        onClick={() => { logout(); router.push('/login'); }} 
                        className="btn btn-white w-100 py-3 border-0 rounded-0 fs-6 fw-bold text-danger d-flex align-items-center justify-content-center gap-2"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Sign Out Account
                    </button>
                </div>
            </main>
            <BottomNav />

            <style>{`
                .hover-scale { transition: transform 0.2s ease; }
                .hover-scale:hover { transform: translateY(-3px); }
                .transition-all { transition: all 0.2s ease; }
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

export default function UserDashboardPage() {
    return (
        <ProtectedRoute>
            <UserDashboard />
        </ProtectedRoute>
    );
}


