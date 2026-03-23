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

interface AgendaItem {
    icon: string;
    color: string;
    bg: string;
    text: string;
    priority: 'high' | 'medium' | 'low';
}

// ─── Field Health Score SVG Gauge ───────────────────────────────────────────
function HealthScoreGauge({ score }: { score: number }) {
    const color = score >= 75 ? '#4caf50' : score >= 45 ? '#F9A825' : '#ef5350';
    const label = score >= 75 ? 'Healthy' : score >= 45 ? 'Needs Attention' : 'Critical';
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="d-flex flex-column align-items-center">
            <svg width="96" height="96" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="white" strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                />
                <text x="50" y="46" textAnchor="middle" fill="white" fontSize="21" fontWeight="800">{score}</text>
                <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9">/ 100</text>
            </svg>
            <span className="text-white-50" style={{ fontSize: 10, marginTop: -4 }}>{label}</span>
        </div>
    );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
function FarmerDashboardContent() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const todayDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    // Compute a live health score from current stats
    const healthScore = (() => {
        if (!stats) return 72;
        let score = 88;
        if (stats.pendingOrders > 5) score -= 18;
        else if (stats.pendingOrders > 0) score -= 6;
        if (stats.totalProducts === 0) score -= 12;
        return Math.max(20, Math.min(100, score));
    })();

    // Smart agenda — dynamically generated
    const agenda: AgendaItem[] = [
        ...(stats && stats.pendingOrders > 0 ? [{
            icon: 'receipt_long',
            color: '#e65100', bg: '#fff3e0',
            text: `${stats.pendingOrders} pending order${stats.pendingOrders > 1 ? 's' : ''} need your attention`,
            priority: 'high' as const
        }] : []),
        {
            icon: 'document_scanner',
            color: '#1565c0', bg: '#e3f2fd',
            text: 'Scan your crops for early disease detection',
            priority: 'medium' as const
        },
        {
            icon: 'wb_sunny',
            color: '#00696F', bg: '#e0f2f1',
            text: 'View 7-day weather advisory for your field',
            priority: 'low' as const
        },
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch('/api/farmer/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.ok ? await res.json() : { totalProducts: 0, pendingOrders: 0, totalRevenue: 0, totalOrders: 0 });
            } catch {
                setStats({ totalProducts: 0, pendingOrders: 0, totalRevenue: 0, totalOrders: 0 });
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    const marketActions = [
        { icon: 'add_circle',        title: '+ Add New Product',  desc: 'List a new crop for sale',         color: '#2E7D32', bg: '#e8f5e9', href: '/farmer/add-product' },
        { icon: 'edit_note',         title: 'My Listings',        desc: 'Update price or stock',            color: '#1565c0', bg: '#e3f2fd', href: '/farmer/products', badge: stats?.totalProducts ? `${stats.totalProducts} active` : null },
        { icon: 'receipt_long',      title: 'Orders',             desc: 'Track sales and shipments',        color: '#e65100', bg: '#fff3e0', href: '/farmer/orders', badge: stats?.pendingOrders ? `${stats.pendingOrders} pending` : null },
    ];

    const fieldActions = [
        { icon: 'landscape',         title: 'Field Setup',        desc: 'Configure plots and crops',        color: '#388e3c', bg: '#f1f8e9', href: '/field' },
        { icon: 'monitoring',        title: 'Crop Insights',      desc: 'Health and lifecycle data',        color: '#00796b', bg: '#e0f2f1', href: '/field' },
        { icon: 'notifications_active', title: 'Alerts',          desc: 'Weather and disease warnings',      color: '#c62828', bg: '#ffebee', href: '/farmer/order-notifications' },
    ];

    return (
        <div className="min-vh-100 bg-light pb-5">
            <header className="sticky-top bg-white border-bottom px-3 py-3 shadow-sm" style={{ zIndex: 100 }}>
                <div className="d-flex align-items-center justify-content-between mx-auto w-100" style={{ maxWidth: '480px' }}>
                    <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                             style={{ width: 40, height: 40, background: '#2E7D32', fontSize: 18 }}>
                            {user?.full_name?.charAt(0)}
                        </div>
                        <div>
                            <div className="fw-bold text-dark" style={{ fontSize: 15 }}>{user?.full_name}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>{user?.farm_name || 'My Farm'} · {todayDate}</div>
                        </div>
                    </div>
                    <Link href="/profile" className="btn btn-light btn-sm rounded-circle border">
                        <Icon name="settings" style={{ fontSize: 18 }} />
                    </Link>
                </div>
            </header>

            <main className="px-3 py-4 mx-auto w-100" style={{ maxWidth: '480px' }}>
                
                {/* ── 1. Market & Field Overview (SEPARATED) ── */}
                <div className="row g-3 mb-4">
                    <div className="col-12">
                        <div className="rounded-4 p-4 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)' }}>
                            <p className="mb-1 text-white-50 small fw-bold uppercase">MARKET STATUS</p>
                            <h2 className="fw-bold mb-3" style={{ fontSize: 28 }}>
                                ₹{(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}
                            </h2>
                            <div className="d-flex gap-4 border-top border-white-50 pt-3">
                                <div>
                                    <div className="fw-bold small">{loadingStats ? '—' : stats?.totalOrders ?? 0}</div>
                                    <div className="text-white-50" style={{ fontSize: 10 }}>Sales</div>
                                </div>
                                <div>
                                    <div className="fw-bold small">{loadingStats ? '—' : stats?.totalProducts ?? 0}</div>
                                    <div className="text-white-50" style={{ fontSize: 10 }}>Listings</div>
                                </div>
                                <div>
                                    <div className="fw-bold small text-warning">{loadingStats ? '—' : stats?.pendingOrders ?? 0}</div>
                                    <div className="text-white-50" style={{ fontSize: 10 }}>Pending</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-12">
                        <div className="bg-white rounded-4 p-4 border shadow-sm d-flex align-items-center justify-content-between">
                            <div>
                                <p className="mb-1 text-muted small fw-bold">FIELD HEALTH</p>
                                <h3 className="fw-bold text-dark mb-0">{healthScore}%</h3>
                                <p className="text-success small mb-0 mt-1" style={{ fontSize: 11 }}>
                                    <Icon name="verified" style={{ fontSize: 12 }} /> Optimal Condition
                                </p>
                            </div>
                            <HealthScoreGauge score={healthScore} />
                        </div>
                    </div>
                </div>

                {/* ── 2. Smart Agenda ── */}
                <div className="mb-4">
                    <h3 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2" style={{ fontSize: 13, letterSpacing: '0.5px' }}>
                        <Icon name="checklist" style={{ fontSize: 18, color: '#2E7D32' }} />
                        TODAY'S PRIORITY
                    </h3>
                    <div className="d-flex flex-column gap-2">
                        {agenda.map((item, i) => (
                            <div key={i} className="d-flex align-items-center gap-3 bg-white rounded-3 shadow-sm px-3 py-2 border-start border-4"
                                 style={{ borderLeftColor: item.color }}>
                                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                     style={{ width: 32, height: 32, background: item.bg }}>
                                    <Icon name={item.icon} style={{ fontSize: 16, color: item.color }} />
                                </div>
                                <span className="flex-grow-1 text-dark" style={{ fontSize: 12 }}>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── 3. Market Features ── */}
                <h3 className="fw-bold mb-3 text-dark text-uppercase" style={{ fontSize: 11, letterSpacing: '1px' }}>Market Features</h3>
                <div className="d-grid gap-2 mb-4">
                    {marketActions.map((action) => (
                        <Link key={action.href} href={action.href} className="text-decoration-none">
                            <div className="bg-white border rounded-4 p-3 d-flex align-items-center gap-3 transition-all hover-scale">
                                <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                     style={{ width: 42, height: 42, background: action.bg, color: action.color }}>
                                    <Icon name={action.icon} />
                                </div>
                                <div className="flex-grow-1">
                                    <div className="fw-bold text-dark small">{action.title}</div>
                                    <div className="text-muted" style={{ fontSize: 11 }}>{action.desc}</div>
                                </div>
                                {action.badge && <span className="badge rounded-pill bg-light text-dark border fw-bold" style={{fontSize: 9}}>{action.badge}</span>}
                                <Icon name="chevron_right" className="text-muted small" />
                            </div>
                        </Link>
                    ))}
                </div>

                {/* ── 4. Field Setup & Monitoring ── */}
                <h3 className="fw-bold mb-3 text-dark text-uppercase" style={{ fontSize: 11, letterSpacing: '1px' }}>Field Setup & Features</h3>
                <div className="d-grid gap-2 mb-4">
                    {fieldActions.map((action) => (
                        <Link key={action.title} href={action.href} className="text-decoration-none">
                            <div className="bg-white border rounded-4 p-3 d-flex align-items-center gap-3 transition-all hover-scale">
                                <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                     style={{ width: 42, height: 42, background: action.bg, color: action.color }}>
                                    <Icon name={action.icon} />
                                </div>
                                <div className="flex-grow-1">
                                    <div className="fw-bold text-dark small">{action.title}</div>
                                    <div className="text-muted" style={{ fontSize: 11 }}>{action.desc}</div>
                                </div>
                                <Icon name="chevron_right" className="text-muted small" />
                            </div>
                        </Link>
                    ))}
                </div>

                {/* ── 5. Sign Out ── */}
                <button
                    onClick={() => { logout(); router.push('/login'); }}
                    className="btn w-100 py-3 rounded-4 fw-bold d-flex align-items-center justify-content-center gap-2 mt-4"
                    style={{ background: '#fff0f0', color: '#c62828', border: '1px solid #ffcdd2', fontSize: 14 }}>
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
