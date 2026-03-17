"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ExpertDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();

    if (!user) return null;

    return (
        <ProtectedRoute allowedRoles={['EXPERT', 'ADMIN']}>
            <div className="d-flex flex-column min-vh-100 pb-5 bg-light">
                {/* Nav Header */}
                <header className="sticky-top bg-white border-bottom px-3 py-3 shadow-sm z-3">
                    <div className="d-flex align-items-center justify-content-between mx-auto w-100" style={{ maxWidth: '448px' }}>
                        <div className="d-flex align-items-center gap-3">
                            <button 
                                onClick={() => router.push('/')} 
                                className="btn btn-light rounded-circle p-2 d-flex shadow-none border"
                                title="Back to Site Home"
                            >
                                <span className="material-symbols-outlined fs-5">home</span>
                            </button>
                            <div className="d-flex align-items-center gap-2">
                                <div className="bg-success rounded-circle p-2 d-flex shadow-sm">
                                    <span className="material-symbols-outlined text-white">psychology</span>
                                </div>
                                <div>
                                    <h1 className="h6 fw-bold mb-0">Expert Workspace</h1>
                                    <p className="text-muted mb-0" style={{ fontSize: '10px' }}>Dr.Plant Specialist Panel</p>
                                </div>
                            </div>
                        </div>
                        <span className="badge bg-success-subtle text-success rounded-pill fw-bold" style={{ fontSize: '10px' }}>VERIFIED</span>
                    </div>
                </header>

                <main className="flex-grow-1 px-3 py-4 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                    {/* Profile Overview Card */}
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                        <div className="bg-success p-4 text-white text-center" style={{ background: 'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)' }}>
                            <div className="position-relative d-inline-block mb-3">
                                <div className="rounded-circle bg-white p-1 shadow-sm">
                                    <div className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center text-success overflow-hidden" 
                                         style={{ width: '72px', height: '72px' }}>
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt="Expert" className="w-100 h-100 object-fit-cover" />
                                        ) : (
                                            <span className="fs-2 fw-bold">{user.full_name?.charAt(0) || user.username?.charAt(0)}</span>
                                        )}
                                    </div>
                                </div>
                                <span className="position-absolute bottom-0 end-0 bg-white rounded-circle border border-2 border-success" 
                                      style={{ width: '14px', height: '14px' }}></span>
                            </div>
                            <h2 className="h5 fw-bold mb-1">Welcome, {user.full_name?.split(' ')[0] || user.username}</h2>
                            <p className="small text-white-50 mb-3">Agricultural Consultant & Specialist</p>
                            
                            <div className="d-flex align-items-center justify-content-center gap-4 border-top border-white-50 pt-3 mt-2">
                                <div>
                                    <div className="fw-bold h6 mb-0">{user.follower_count || 0}</div>
                                    <div className="text-white-50" style={{ fontSize: '10px' }}>Followers</div>
                                </div>
                                <div className="vr bg-white-50"></div>
                                <div>
                                    <div className="fw-bold h6 mb-0">{user.like_count || 0}</div>
                                    <div className="text-white-50" style={{ fontSize: '10px' }}>Endorsements</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Menu */}
                    <h3 className="h6 fw-bold text-muted text-uppercase mb-3 px-1" style={{ fontSize: '11px', letterSpacing: '1px' }}>Core Responsibilities</h3>
                    <div className="d-flex flex-column gap-3 mb-5">
                        {[
                            { icon: 'priority_high', title: 'Open Diagnostics', desc: 'Identify crop diseases from AI reports', color: 'danger', href: '/advisory' },
                            { icon: 'help_center', title: 'Farmer Inquiries', desc: 'Respond to community questions', color: 'warning', href: '/community' },
                            { icon: 'groups', title: 'Community Feed', desc: 'Engage with agricultural discussions', color: 'info', href: '/community' },
                            { icon: 'settings', title: 'Expert Profile', desc: 'Update your bio and expertise area', color: 'success', href: '/profile' },
                        ].map((item) => (
                            <Link key={item.title} href={item.href} className="text-decoration-none">
                                <div className="card border-0 shadow-sm rounded-4 hover-scale transition-all">
                                    <div className="card-body d-flex align-items-center gap-3 py-3">
                                        <div className={`bg-${item.color}-subtle text-${item.color} rounded-3 p-3 d-flex`}>
                                            <span className="material-symbols-outlined">{item.icon}</span>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h4 className="h6 fw-bold mb-1 text-dark">{item.title}</h4>
                                            <p className="text-muted small mb-0">{item.desc}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-muted opacity-50">chevron_right</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Sign Out Card */}
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
                        <button 
                            onClick={async () => { await logout(); router.push('/login'); }} 
                            className="btn btn-white w-100 py-3 border-0 rounded-0 fs-6 fw-bold text-danger d-flex align-items-center justify-content-center gap-2"
                        >
                            <span className="material-symbols-outlined">logout</span>
                            Sign Out Expert Session
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
        </ProtectedRoute>
    );
}
