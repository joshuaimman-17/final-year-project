"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';
import { Icon } from '@/components/Icon';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';
import { useRouter } from 'next/navigation';

function OrdersContent() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            try {
                // Simulate fetching orders for the current user
                // Ideally this would be an API call: /api/orders?customer_id=xxx
                const savedOrders = localStorage.getItem(`dr_plant_orders_${user.id}`);
                if (savedOrders) {
                    setOrders(JSON.parse(savedOrders));
                }
            } catch (e) {
                console.error("Failed to fetch orders", e);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-success-subtle text-success';
            case 'shipped': return 'bg-info-subtle text-info';
            case 'pending': return 'bg-warning-subtle text-warning text-dark';
            case 'cancelled': return 'bg-danger-subtle text-danger';
            default: return 'bg-light text-muted';
        }
    };

    return (
        <div className="min-vh-100 bg-light pb-5">
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3 d-flex align-items-center gap-3" style={{ maxWidth: '448px', margin: '0 auto' }}>
                    <button onClick={() => router.back()} className="btn btn-light rounded-circle p-2 border shadow-sm">
                        <Icon name="arrow_back" />
                    </button>
                    <h1 className="h5 mb-0 fw-bold">My Orders</h1>
                </div>
            </header>

            <main className="p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary-green" role="status"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 bg-opacity-10 text-muted" style={{ width: '80px', height: '80px', border: '2px dashed #ccc' }}>
                            <Icon name="receipt_long" className="display-6" />
                        </div>
                        <h2 className="h5 fw-bold mb-2">No orders found</h2>
                        <p className="text-muted small mb-4">You haven't placed any orders yet.</p>
                        <Link href="/products" className="btn btn-primary-green rounded-pill px-4 fw-bold shadow-sm">
                            Explore Marketplace
                        </Link>
                    </div>
                ) : (
                    <div className="d-grid gap-3">
                        {orders.map(order => (
                            <div key={order.id} className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                <div className="p-3 bg-white border-bottom d-flex justify-content-between align-items-center">
                                    <div>
                                        <p className="small text-muted mb-0">Order ID: #{order.id.slice(-8).toUpperCase()}</p>
                                        <p className="small text-muted mb-0">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`badge rounded-pill fw-bold ${getStatusColor(order.status)}`} style={{ fontSize: '10px' }}>
                                        {order.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="p-3 bg-light-subtle">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="d-flex align-items-center gap-2 mb-2">
                                            <img src={item.image_url} alt={item.name} className="rounded-2" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                            <div className="flex-grow-1">
                                                <p className="small fw-bold mb-0 text-truncate" style={{ maxWidth: '200px' }}>{item.name}</p>
                                                <p className="small text-muted mb-0">{item.quantity} x ₹{item.price}</p>
                                            </div>
                                            <p className="small fw-bold mb-0">₹{item.quantity * item.price}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-white d-flex justify-content-between align-items-center border-top">
                                    <span className="small text-muted fw-bold">Total Items: {order.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                                    <span className="fw-bold text-primary-green">TotalPaid: ₹{order.total}</span>
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

import Link from 'next/link';

export default function OrdersPage() {
    return (
        <ProtectedRoute allowedRoles={['BUYER', 'FARMER', 'ADMIN']}>
            <OrdersContent />
        </ProtectedRoute>
    );
}
