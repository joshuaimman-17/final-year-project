"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Order } from '@/types';
import { Icon } from '@/components/Icon';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';
import { useRouter } from 'next/navigation';

function FarmerOrdersContent() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFarmerOrders = () => {
            try {
                // In a real app, API: /api/farmer/orders
                // Simulate by reading notifications/global orders (simplified)
                // For demonstration, we'll just show all pending orders from ANY customer
                // (In reality, we'd filter by products owned by this farmer)
                const allOrders: any[] = [];
                // This is a bit complex to simulate perfectly without a real backend
                // So we'll just pull from a central list if available, or simulate dummy data
                const dummyOrders = [
                    {
                        id: 'ORD-9921',
                        customer_name: 'Rahul Kumar',
                        items: [{ name: 'Organic Tomatoes', quantity: 5, price: 40 }],
                        total: 200,
                        status: 'pending',
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'ORD-9842',
                        customer_name: 'Anita Singh',
                        items: [{ name: 'Fresh Wheat', quantity: 50, price: 30 }],
                        total: 1500,
                        status: 'shipped',
                        created_at: new Date(Date.now() - 86400000).toISOString()
                    }
                ];
                setOrders(dummyOrders);
            } catch (err) {
                console.error(err);
                showToast("Failed to load orders", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchFarmerOrders();
    }, [user]);

    const updateStatus = (id: string, newStatus: string) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        showToast(`Order marked as ${newStatus}`, "success");
    };

    return (
        <div className="min-vh-100 bg-light pb-5">
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3 d-flex align-items-center gap-3" style={{ maxWidth: '448px', margin: '0 auto' }}>
                    <button onClick={() => router.back()} className="btn btn-light rounded-circle p-2 border shadow-sm">
                        <Icon name="arrow_back" />
                    </button>
                    <h1 className="h5 mb-0 fw-bold">Incoming Sales Orders</h1>
                </div>
            </header>

            <main className="p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary-green"></div></div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <Icon name="history_toggle_off" className="display-4 mb-3 opacity-25" />
                        <p>No sales orders yet. Keep farming!</p>
                    </div>
                ) : (
                    <div className="d-grid gap-3">
                        {orders.map(order => (
                            <div key={order.id} className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                <div className="p-3 bg-white border-bottom d-flex justify-content-between align-items-center">
                                    <div>
                                        <p className="small fw-bold mb-0">Order #{order.id}</p>
                                        <p className="small text-muted mb-0">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`badge rounded-pill fw-bold ${order.status === 'pending' ? 'bg-warning-subtle text-warning text-dark' : 'bg-success-subtle text-success'}`} style={{ fontSize: '10px' }}>
                                        {order.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="p-3">
                                    <p className="small mb-2"><strong>Customer:</strong> {order.customer_name}</p>
                                    {order.items.map((item: any, idx: number) => (
                                        <div key={idx} className="small d-flex justify-content-between mb-1">
                                            <span>{item.quantity} x {item.name}</span>
                                            <span className="fw-bold">₹{item.quantity * item.price}</span>
                                        </div>
                                    ))}
                                    <hr className="my-2 opacity-10" />
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="small text-muted">Total Earnings</span>
                                        <span className="fw-bold text-success">₹{order.total}</span>
                                    </div>
                                </div>
                                {order.status === 'pending' && (
                                    <div className="px-3 pb-3 d-grid gap-2">
                                        <button onClick={() => updateStatus(order.id, 'shipped')} className="btn btn-primary-green btn-sm rounded-pill fw-bold">
                                            Mark as Shipped
                                        </button>
                                        <button onClick={() => updateStatus(order.id, 'cancelled')} className="btn btn-outline-danger btn-sm rounded-pill py-1">
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
}

export default function FarmerOrdersPage() {
    return (
        <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
            <FarmerOrdersContent />
        </ProtectedRoute>
    );
}
