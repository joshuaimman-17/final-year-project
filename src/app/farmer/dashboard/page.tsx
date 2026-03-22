"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';
import Link from 'next/link';
import { auth } from '@/lib/firebase';

interface DashboardStats {
    totalProducts: number;
    pendingOrders: number;
    totalRevenue: number;
    totalOrders: number;
}

function FarmerDashboardContent() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const todayDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch('/api/farmer/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                } else {
                    // Fallback to zero stats if API not ready
                    setStats({ totalProducts: 0, pendingOrders: 0, totalRevenue: 0, totalOrders: 0 });
                }
            } catch {
                setStats({ totalProducts: 0, pendingOrders: 0, totalRevenue: 0, totalOrders: 0 });
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: 'My Products', value: stats?.totalProducts ?? 0, icon: 'inventory_2', color: 'primary', suffix: '' },
        { label: 'Pending Orders', value: stats?.pendingOrders ?? 0, icon: 'pending_actions', color: 'warning', suffix: '' },
        { label: 'Total Revenue', value: stats?.totalRevenue ?? 0, icon: 'currency_rupee', color: 'success', prefix: '₹', suffix: '' },
        { label: 'Orders Completed', value: stats?.totalOrders ?? 0, icon: 'check_circle', color: 'info', suffix: '' },
    ];

    const quickActions = [
        {
            icon: 'add_circle',
            title: '+ Add New Product',
            desc: 'List a new crop or produce for sale',
            color: '#2E7D32',
            bg: '#e8f5e9',
            href: '/farmer/add-product',
            badge: null
        },
        {
            icon: 'edit_note',
            title: 'Edit My Products',
            desc: 'Update price, stock or remove a listing',
            color: '#1565c0',
            bg: '#e3f2fd',
            href: '/farmer/products',
            badge: stats?.totalProducts ? `${stats.totalProducts} listed` : null
        },
        {
            icon: 'receipt_long',
            title: 'View Orders',
            desc: 'Track incoming orders and shipments',
            color: '#e65100',
            bg: '#fff3e0',
            href: '/farmer/orders',
            badge: stats?.pendingOrders ? `${stats.pendingOrders} pending` : null
        },
        {
            icon: 'notifications_active',
            title: 'Notifications',
            desc: 'New orders, updates and alerts',
            color: '#c62828',
            bg: '#ffebee',
            href: '/farmer/order-notifications',
            badge: null
        },
    ];

    return (
        <div className="min-vh-100 bg-light pb-5">
            {/* Header */}
            <header className="sticky-top bg-white border-bottom px-3 py-3 shadow-sm" style={{ zIndex: 100 }}>
                <div className="d-flex align-items-center justify-content-between mx-auto w-100" style={{ maxWidth: '480px' }}>
                    <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white"
                             style={{ width: 40, height: 40, background: '#2E7D32', fontSize: 20, fontWeight: 700 }}>
                            {user?.full_name?.charAt(0)}
                        </div>
                        <div>
                            <div className="fw-bold text-dark" style={{ fontSize: 15 }}>
                                {user?.full_name}
                            </div>
                            <div className="text-muted" style={{ fontSize: 11 }}>
                                {user?.farm_name || 'My Farm'} · {todayDate}
                            </div>
                        </div>
                    </div>
                    <Link href="/profile" className="btn btn-light btn-sm rounded-circle border" style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="settings" style={{ fontSize: 18 }} />
                    </Link>
                </div>
            </header>

            <main className="px-3 py-4 mx-auto w-100" style={{ maxWidth: '480px' }}>

                {/* Revenue Banner */}
                <div className="rounded-4 mb-4 p-4 text-white"
                     style={{ background: 'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)', boxShadow: '0 4px 20px rgba(46,125,50,0.3)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                            <p className="mb-1 text-white-50" style={{ fontSize: 12 }}>TOTAL EARNINGS</p>
                            {loadingStats ? (
                                <div className="spinner-border spinner-border-sm text-white-50" />
                            ) : (
                                <h2 className="fw-bold mb-0" style={{ fontSize: 32 }}>
                                    ₹{(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}
                                </h2>
                            )}
                        </div>
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white border border-white border-opacity-25"
                             style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.15)', fontSize: 28 }}>
                            <Icon name="currency_rupee" />
                        </div>
                    </div>
                    <div className="d-flex gap-4">
                        <div>
                            <div className="fw-bold">{loadingStats ? '—' : stats?.totalOrders ?? 0}</div>
                            <div className="text-white-50" style={{ fontSize: 11 }}>Orders Done</div>
                        </div>
                        <div>
                            <div className="fw-bold">{loadingStats ? '—' : stats?.totalProducts ?? 0}</div>
                            <div className="text-white-50" style={{ fontSize: 11 }}>Active Listings</div>
                        </div>
                        <div>
                            <div className="fw-bold text-warning">{loadingStats ? '—' : stats?.pendingOrders ?? 0}</div>
                            <div className="text-white-50" style={{ fontSize: 11 }}>Pending</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <h3 className="fw-bold mb-3 text-dark" style={{ fontSize: 14, letterSpacing: '0.5px' }}>
                    What would you like to do?
                </h3>

                <div className="d-grid gap-3 mb-4">
                    {quickActions.map((action) => (
                        <Link key={action.href} href={action.href} className="text-decoration-none">
                            <div className="card border-0 shadow-sm rounded-4"
                                 style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                                 onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                                 onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                                <div className="card-body d-flex align-items-center gap-3 py-3 px-3">
                                    {/* Icon */}
                                    <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                         style={{ width: 48, height: 48, background: action.bg, color: action.color, fontSize: 24 }}>
                                        <Icon name={action.icon} />
                                    </div>
                                    {/* Text */}
                                    <div className="flex-grow-1">
                                        <div className="fw-bold text-dark" style={{ fontSize: 15 }}>{action.title}</div>
                                        <div className="text-muted" style={{ fontSize: 12 }}>{action.desc}</div>
                                    </div>
                                    {/* Badge */}
                                    {action.badge && (
                                        <span className="badge rounded-pill fw-bold"
                                              style={{ background: action.bg, color: action.color, fontSize: 10 }}>
                                            {action.badge}
                                        </span>
                                    )}
                                    <Icon name="chevron_right" className="text-muted" style={{ fontSize: 20 }} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Help Tips */}
                <div className="rounded-4 p-3 mb-4 border border-warning-subtle" style={{ background: '#fffde7' }}>
                    <div className="d-flex align-items-start gap-2">
                        <Icon name="lightbulb" className="text-warning flex-shrink-0 mt-1" style={{ fontSize: 18 }} />
                        <div>
                            <div className="fw-bold text-dark mb-1" style={{ fontSize: 13 }}>Quick Tips</div>
                            <ul className="mb-0 ps-3 text-muted" style={{ fontSize: 12 }}>
                                <li>Add a photo and clear description to sell faster</li>
                                <li>Update your price based on market rates</li>
                                <li>Check Pending Orders daily to avoid delays</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Sign Out */}
                <button
                    onClick={() => { logout(); router.push('/login'); }}
                    className="btn w-100 py-3 rounded-4 fw-bold d-flex align-items-center justify-content-center gap-2"
                    style={{ background: '#fff0f0', color: '#c62828', border: '1px solid #ffcdd2' }}>
                    <Icon name="logout" />
                    Sign Out
                </button>
            </main>
            <BottomNav />
        </div>
    );
}

export default function FarmerDashboard() {
    return (
        <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
            <FarmerDashboardContent />
        </ProtectedRoute>
    );
}
