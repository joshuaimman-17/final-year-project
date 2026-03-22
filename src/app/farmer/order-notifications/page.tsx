"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/components/common/ToastContext';
import { Icon } from '@/components/ui/Icon';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function OrderNotificationsContent() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = () => {
            try {
                // Simulate fetching notifications from localStorage
                // These were set during the checkout process in Cart page
                const saved = JSON.parse(localStorage.getItem('dr_plant_farmer_notifications') || '[]');
                setNotifications(saved.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            } catch (err) {
                console.error(err);
                showToast("Failed to load notifications", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markAsRead = (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        setNotifications(updated);
        localStorage.setItem('dr_plant_farmer_notifications', JSON.stringify(updated));
    };

    const clearAll = () => {
        localStorage.setItem('dr_plant_farmer_notifications', JSON.stringify([]));
        setNotifications([]);
        showToast("Notifications cleared", "info");
    };

    return (
        <div className="min-vh-100 bg-light pb-5">
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3 d-flex align-items-center justify-content-between mx-auto w-100" style={{ maxWidth: '448px' }}>
                    <div className="d-flex align-items-center gap-3">
                        <button onClick={() => router.back()} className="btn btn-light rounded-circle p-2 border shadow-sm">
                            <Icon name="arrow_back" />
                        </button>
                        <h1 className="h5 mb-0 fw-bold">Farmer Alerts</h1>
                    </div>
                    {notifications.length > 0 && (
                        <button onClick={clearAll} className="btn btn-link text-muted small p-0 text-decoration-none">Clear All</button>
                    )}
                </div>
            </header>

            <main className="p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary-green"></div></div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 bg-opacity-10 text-muted" style={{ width: '80px', height: '80px', border: '2px dashed #ccc' }}>
                            <Icon name="notifications_off" className="display-6" />
                        </div>
                        <h2 className="h5 fw-bold mb-2">No alerts yet</h2>
                        <p className="text-muted small">We'll notify you here when you receive new orders or updates.</p>
                    </div>
                ) : (
                    <div className="d-grid gap-3 mb-4">
                        {notifications.map(n => (
                            <div 
                                key={n.id} 
                                className={`card border-0 shadow-sm rounded-4 overflow-hidden ${n.read ? 'bg-white opacity-75' : 'bg-white border-start border-4 border-primary-green'}`}
                                onClick={() => !n.read && markAsRead(n.id)}
                            >
                                <div className="p-3 d-flex gap-3 align-items-start">
                                    <div className={`p-2 rounded-circle d-flex ${n.type === 'NEW_ORDER' ? 'bg-info-subtle text-info' : 'bg-warning-subtle text-warning'}`}>
                                        <Icon name={n.type === 'NEW_ORDER' ? 'shopping_bag' : 'notifications'} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="small fw-bold text-dark">{n.type === 'NEW_ORDER' ? 'Order Update' : 'System Alert'}</span>
                                            <span className="text-muted" style={{ fontSize: '10px' }}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className={`small mb-0 ${n.read ? 'text-muted' : 'fw-bold text-dark'}`}>{n.message}</p>
                                        {n.type === 'NEW_ORDER' && (
                                            <Link href="/farmer/orders" className="small text-primary-green fw-bold text-decoration-none d-inline-block mt-2">
                                                View Order Details
                                            </Link>
                                        )}
                                    </div>
                                    {!n.read && <div className="bg-primary-green rounded-circle" style={{ width: '8px', height: '8px' }} />}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
}

export default function OrderNotificationsPage() {
    return (
        <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
            <OrderNotificationsContent />
        </ProtectedRoute>
    );
}
