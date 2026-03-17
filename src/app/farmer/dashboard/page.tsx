"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';

function FarmerDashboardContent() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        revenue: 0,
        alerts: 0
    });

    useEffect(() => {
        // Simulate fetching farmer stats
        // In a real app, this would be an API call
        setStats({
            products: 12,
            orders: 5,
            revenue: 15400,
            alerts: 2
        });
    }, []);

    return (
        <div className="min-vh-100 bg-light pb-5">
            <header className="sticky-top bg-white border-bottom px-3 py-3 shadow-sm z-3">
                <div className="d-flex align-items-center justify-content-between mx-auto w-100" style={{ maxWidth: '448px' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary-green rounded-circle p-2 d-flex shadow-sm">
                            <Icon name="agriculture" className="text-white" />
                        </div>
                        <div>
                            <h1 className="h6 fw-bold mb-0">Farmer Dashboard</h1>
                            <p className="text-muted mb-0" style={{ fontSize: '10px' }}>Manage your farm & sales</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow-1 px-3 py-4 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                {/* Profile Section */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
                    <div className="card-body p-4 text-center">
                        <div className="mx-auto rounded-circle bg-success-subtle d-flex align-items-center justify-content-center text-success mb-3" style={{ width: '80px', height: '80px' }}>
                            <span className="display-5 fw-bold">{user?.full_name?.charAt(0)}</span>
                        </div>
                        <h2 className="h5 fw-bold mb-1">Welcome, {user?.full_name}</h2>
                        <p className="text-muted small mb-0">{user?.farm_name}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="row g-3 mb-4">
                    <div className="col-6">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
                            <Icon name="inventory" className="text-primary mb-2 fs-4" />
                            <h3 className="h5 fw-bold mb-0">{stats.products}</h3>
                            <p className="text-muted small mb-0">Products</p>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
                            <Icon name="pending_actions" className="text-warning mb-2 fs-4" />
                            <h3 className="h5 fw-bold mb-0">{stats.orders}</h3>
                            <p className="text-muted small mb-0">Orders</p>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
                            <Icon name="payments" className="text-success mb-2 fs-4" />
                            <h3 className="h5 fw-bold mb-0">₹{stats.revenue}</h3>
                            <p className="text-muted small mb-0">Revenue</p>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
                            <Icon name="notifications" className="text-danger mb-2 fs-4" />
                            <h3 className="h5 fw-bold mb-0">{stats.alerts}</h3>
                            <p className="text-muted small mb-0">Alerts</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <h3 className="h6 fw-bold text-muted text-uppercase mb-3 px-1" style={{ fontSize: '11px', letterSpacing: '1px' }}>Farmer Operations</h3>
                <div className="d-grid gap-3 mb-5">
                    {[
                        { icon: 'add_circle', title: 'Add New Product', desc: 'List a new crop for sale', color: 'primary', href: '/farmer/add-product' },
                        { icon: 'inventory_2', title: 'Manage Products', desc: 'Edit or remove your listings', color: 'success', href: '/farmer/products' },
                        { icon: 'receipt_long', title: 'View Orders', desc: 'See your sales and fulfillments', color: 'info', href: '/farmer/orders' },
                        { icon: 'notifications_active', title: 'Notifications', desc: 'New orders and site updates', color: 'danger', href: '/farmer/order-notifications' },
                    ].map((action) => (
                        <Link key={action.title} href={action.href} className="text-decoration-none">
                            <div className="card border-0 shadow-sm rounded-4 hover-scale transition-all">
                                <div className="card-body d-flex align-items-center gap-3 py-3">
                                    <div className={`bg-${action.color}-subtle text-${action.color} rounded-3 p-3 d-flex`}>
                                        <Icon name={action.icon} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <h4 className="h6 fw-bold mb-1 text-dark">{action.title}</h4>
                                        <p className="text-muted small mb-0">{action.desc}</p>
                                    </div>
                                    <Icon name="chevron_right" className="text-muted opacity-50" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Sign Out */}
                <button 
                    onClick={() => { logout(); router.push('/login'); }} 
                    className="btn btn-white border shadow-sm w-100 py-3 rounded-4 fw-bold text-danger d-flex align-items-center justify-content-center gap-2 mb-4"
                >
                    <Icon name="logout" />
                    Sign Out Farmer Session
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
