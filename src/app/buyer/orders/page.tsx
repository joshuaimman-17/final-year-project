"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';
import { auth } from '@/lib/firebase';

function BuyerOrdersContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch('/api/orders?viewAs=buyer', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-warning text-dark';
            case 'CONFIRMED': return 'bg-info text-white';
            case 'SHIPPED': return 'bg-primary text-white';
            case 'DELIVERED': return 'bg-success text-white';
            case 'CANCELLED': return 'bg-danger text-white';
            default: return 'bg-secondary text-white';
        }
    };

    return (
        <div className="min-vh-100 d-flex flex-column pb-5 bg-light">
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3 d-flex align-items-center gap-3 mx-auto w-100" style={{ maxWidth: '480px' }}>
                    <button onClick={() => router.back()} className="btn btn-light rounded-circle border shadow-sm" style={{ width: 38, height: 38, padding: 0 }}>
                        <Icon name="arrow_back" style={{ fontSize: 20 }} />
                    </button>
                    <div>
                        <h1 className="h6 fw-bold mb-0">My Orders</h1>
                        <div className="text-muted" style={{ fontSize: 11 }}>{orders.length} orders placed</div>
                    </div>
                </div>
            </header>

            <main className="flex-grow-1 p-3 mx-auto w-100" style={{ maxWidth: '480px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" />
                        <p className="text-muted small mt-2">Loading your orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3 bg-white border shadow-sm" style={{ width: 80, height: 80 }}>
                            <Icon name="receipt_long" style={{ fontSize: 32, color: '#ccc' }} />
                        </div>
                        <h2 className="h6 fw-bold">No orders yet</h2>
                        <p className="text-muted small">When you buy produce, your orders will appear here.</p>
                        <button onClick={() => router.push('/marketplace')} className="btn btn-primary-green rounded-pill px-4 py-2 fw-bold mt-2">
                            Browse Market
                        </button>
                    </div>
                ) : (
                    <div className="d-grid gap-3">
                        {orders.map(order => (
                            <div key={order.id} className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
                                    <div className="small text-muted">
                                        Order ID: <span className="fw-mono text-dark">{order.id.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                    <span className={`badge rounded-pill ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="p-3">
                                    <p className="small text-muted mb-2 d-flex align-items-center gap-1">
                                        <Icon name="storefront" style={{ fontSize: 14 }} />
                                        Sold by: <span className="fw-bold text-dark">{order.farmer_name}</span>
                                    </p>
                                    
                                    {order.items?.map((item: any) => (
                                        <div key={item.id} className="d-flex align-items-center gap-3 mb-2">
                                            <div className="bg-light rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 50, height: 50 }}>
                                                {item.product_image ? (
                                                    <img src={item.product_image} alt="pic" className="w-100 h-100 object-fit-cover rounded-3"/>
                                                ) : <Icon name="image" className="text-muted opacity-50"/>}
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="fw-bold">{item.product_name}</div>
                                                <div className="text-muted small">Qty: {item.quantity} {item.unit}</div>
                                            </div>
                                            <div className="fw-bold fs-6">₹{item.price}</div>
                                        </div>
                                    ))}

                                    <div className="d-flex justify-content-between align-items-end mt-3 border-top pt-3">
                                        <div>
                                            <div className="small text-muted mb-1">Total Amount</div>
                                            <div className="fw-bold text-primary-green fs-5">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</div>
                                        </div>
                                        <div className="text-end">
                                            <div className="small text-muted mb-1 d-flex align-items-center gap-1 justify-content-end">
                                                <Icon name="local_shipping" style={{ fontSize: 12 }} />
                                                Deliver to:
                                            </div>
                                            <div className="fw-bold" style={{ fontSize: 12 }}>{order.delivery_address?.city || 'Unknown'}</div>
                                        </div>
                                    </div>
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

export default function BuyerOrdersPage() {
    return (
        <ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}>
            <BuyerOrdersContent />
        </ProtectedRoute>
    );
}
