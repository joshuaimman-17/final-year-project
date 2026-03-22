"use client";

import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useRouter } from 'next/navigation';
import { requestNotificationPermission } from '@/lib/firebase';
import { useAuth } from '@/features/auth/context/AuthContext';

interface HeaderProps {
    title: string;
    showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = true }) => {
    const router = useRouter();
    const { user } = useAuth();
    const [updateAvailable, setUpdateAvailable] = useState(false);

    useEffect(() => {
        // --- 1. Notification Permission ---
        const initNotifications = async () => {
            // Request permission silently on first load if not set
            if (typeof window !== 'undefined' && Notification.permission === 'default') {
                // We could prompt here, but it's better on interaction or after login
            }
        };
        initNotifications();

        // --- 2. Auto-Update / PWA Service Worker check ---
        let updateInterval: NodeJS.Timeout;

        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    // Force update check every 2 seconds
                    updateInterval = setInterval(() => {
                        reg.update();
                        console.log('Force checking for SW update...');
                    }, 2000);

                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    setUpdateAvailable(true);
                                }
                            });
                        }
                    });
                }
            });
        }

        return () => {
            if (updateInterval) clearInterval(updateInterval);
        };
    }, []);

    const handleUpdate = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    const handleNotifyRequest = async () => {
        const token = await requestNotificationPermission();
        if (token) {
            alert("Push notifications enabled! 🔔");
        }
    };

    return (
        <header className="sticky-top bg-white border-bottom px-3 py-3 shadow-sm d-flex align-items-center justify-content-between" style={{ zIndex: 1020 }}>
            <div className="d-flex align-items-center gap-2">
                {showBack && (
                    <button
                        onClick={() => router.back()}
                        className="btn btn-link p-0 text-dark me-1"
                    >
                        <Icon name="arrow_back" style={{ fontSize: '20px' }} />
                    </button>
                )}
                {/* Dr. Plant Premium Logo */}
                <div className="d-flex align-items-center gap-2" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
                    <div className="bg-success-subtle p-1 rounded-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px' }}>
                        <Icon name="psychiatry" className="text-success" style={{ fontSize: '22px' }} />
                    </div>
                    <div>
                        <h1 className="h6 mb-0 fw-bolder text-dark" style={{ letterSpacing: '-0.5px' }}>Dr. Plant</h1>
                        <div className="d-flex align-items-center gap-1">
                            <span className="text-muted" style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Care Companion</span>
                            {user?.role && (
                                <span className={`badge rounded-pill py-0 px-1 fw-bold ${
                                    user.role.toUpperCase() === 'ADMIN' ? 'bg-danger-subtle text-danger' : 
                                    user.role.toUpperCase() === 'FARMER' ? 'bg-primary-green text-white' :
                                    user.role.toUpperCase() === 'EXPERT' ? 'bg-success text-white' : 
                                    'bg-secondary-subtle text-secondary'
                                }`} style={{ fontSize: '8px' }}>
                                    {user.role.toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="d-flex align-items-center gap-3">
                {updateAvailable && (
                    <button
                        onClick={handleUpdate}
                        className="btn btn-warning btn-sm py-0 px-2 rounded-pill shadow-sm animate-pulse"
                        style={{ fontSize: '10px', height: '22px' }}
                    >
                        Update Available
                    </button>
                )}
                <button
                    onClick={handleNotifyRequest}
                    className="btn btn-link p-0 text-muted transition-all hover-scale"
                    title="Enable Notifications"
                >
                    <Icon name="notifications" style={{ fontSize: '20px' }} />
                </button>
                <div className="vr mx-1" style={{ height: '20px', opacity: 0.1 }}></div>
                <h2 className="h6 mb-0 fw-bold text-success d-none d-sm-block">{title}</h2>
            </div>

            <style jsx>{`
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: .7; transform: scale(0.95); }
                }
                .hover-scale:hover {
                    transform: scale(1.1);
                    color: var(--bs-success) !important;
                }
            `}</style>
        </header>
    );
};
