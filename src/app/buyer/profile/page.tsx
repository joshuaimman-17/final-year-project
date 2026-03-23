"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';

function BuyerProfileContent() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <div className="min-vh-100 bg-light pb-5 d-flex flex-column">
            {/* Header */}
            <header className="bg-white border-bottom shadow-sm px-3 py-3 position-relative z-3">
                <div className="d-flex align-items-center justify-content-between mx-auto" style={{ maxWidth: 800 }}>
                    <div className="d-flex align-items-center gap-3">
                        <button onClick={() => router.push('/marketplace')} className="btn btn-light rounded-circle shadow-sm p-0 d-flex align-items-center justify-content-center hover-scale" style={{ width: 40, height: 40 }}>
                            <Icon name="arrow_back" className="text-dark" />
                        </button>
                        <h1 className="h5 fw-bold mb-0 text-dark">My Profile</h1>
                    </div>
                    <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold shadow-sm">
                        Logout
                    </button>
                </div>
            </header>

            <main className="flex-grow-1 p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: 800 }}>
                {/* Profile Info */}
                <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white d-flex flex-row align-items-center gap-4">
                    <div className="position-relative">
                        <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: 80, height: 80, fontSize: 32 }}>
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Profile" className="w-100 h-100 rounded-circle object-fit-cover" />
                            ) : (
                                user?.full_name?.charAt(0).toUpperCase() || <Icon name="person" style={{ fontSize: 40 }} />
                            )}
                        </div>
                        <span className="position-absolute bottom-0 end-0 bg-white rounded-circle p-1 shadow-sm" style={{ transform: 'translate(25%, 25%)' }}>
                            <Icon name="verified" className="text-primary" style={{ fontSize: 20 }} />
                        </span>
                    </div>
                    <div>
                        <h2 className="h4 fw-bold mb-1 text-dark">{user?.full_name || 'Dr.Plant User'}</h2>
                        <div className="text-muted small d-flex align-items-center gap-1 mb-1">
                            <Icon name="phone" style={{ fontSize: 14 }} /> {user?.id}
                        </div>
                        <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1 fw-bold" style={{ fontSize: 10 }}>
                            {user?.role || 'BUYER'} ACCOUNT
                        </span>
                    </div>
                </div>

                <div 
                    onClick={() => router.push('/buyer/orders')}
                    className="card border-0 shadow-sm rounded-4 p-3 mb-3 bg-white d-flex flex-row align-items-center justify-content-between cursor-pointer hover-scale transition-all"
                >
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-success-subtle rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                            <Icon name="receipt_long" className="text-success fs-4" />
                        </div>
                        <div>
                            <h3 className="h6 fw-bold mb-0 text-dark">My Orders</h3>
                            <p className="small text-muted mb-0">Track and view your previous purchases</p>
                        </div>
                    </div>
                    <Icon name="chevron_right" className="text-muted" />
                </div>
                
                <div 
                    className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center justify-content-between cursor-pointer hover-scale transition-all mt-4"
                >
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center border" style={{ width: 48, height: 48 }}>
                            <Icon name="place" className="text-secondary fs-4" />
                        </div>
                        <div>
                            <h3 className="h6 fw-bold mb-0 text-dark">My Addresses</h3>
                            <p className="small text-muted mb-0">Manage your delivery locations</p>
                        </div>
                    </div>
                    <Icon name="chevron_right" className="text-muted" />
                </div>
            </main>
            
            <BottomNav />
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
                .hover-scale { transition: transform 0.2s ease; }
                .hover-scale:hover { transform: scale(1.05); }
                .transition-all { transition: all 0.3s ease; }
            `}</style>
        </div>
    );
}

export default function BuyerProfilePage() {
    return (
        <ProtectedRoute allowedRoles={['BUYER', 'ADMIN', 'FARMER']}>
            <BuyerProfileContent />
        </ProtectedRoute>
    );
}
