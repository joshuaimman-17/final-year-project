"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';
import { auth } from '@/lib/firebase';
import { useToast } from '@/components/common/ToastContext';

function FarmerOrdersContent() {
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/orders?viewAs=farmer', {
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

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                showToast(`Order marked as ${newStatus}`, "success");
                await fetchOrders();
            } else {
                showToast("Failed to update status", "error");
            }
        } catch (e) {
            showToast("Network error updating order", "error");
        } finally {
            setUpdatingId(null);
        }
    };

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

    const getNextAllowedStatuses = (current: string) => {
        switch (current) {
            case 'PENDING': return ['CONFIRMED', 'CANCELLED'];
            case 'CONFIRMED': return ['SHIPPED', 'CANCELLED'];
            case 'SHIPPED': return ['DELIVERED'];
            default: return []; // Delivered or Cancelled are terminal
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
                        <h1 className="h6 fw-bold mb-0 text-primary-green d-flex align-items-center gap-2">
                            <Icon name="local_shipping" /> Incoming Orders
                        </h1>
                        <div className="text-muted" style={{ fontSize: 11 }}>{orders.length} orders total</div>
                    </div>
                </div>
            </header>

            <main className="flex-grow-1 p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '480px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary-green" />
                        <p className="text-muted small mt-2">Loading incoming orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3 bg-white border shadow-sm" style={{ width: 80, height: 80 }}>
                            <Icon name="inbox" style={{ fontSize: 32, color: '#ccc' }} />
                        </div>
                        <h2 className="h6 fw-bold">No incoming orders yet</h2>
                        <p className="text-muted small">When buyers purchase your products, they will appear here.</p>
                    </div>
                ) : (
                    <div className="d-grid gap-4">
                        {orders.map(order => {
                            const allowedStatuses = getNextAllowedStatuses(order.status);
                            const addr = order.delivery_address;
                            return (
                                <div key={order.id} className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                                    <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
                                        <div className="small text-muted d-flex align-items-center gap-1">
                                            Order: <span className="fw-mono text-dark fw-bold">{order.id.slice(0, 8).toUpperCase()}</span>
                                        </div>
                                        <span className={`badge rounded-pill ${getStatusColor(order.status)} px-3 py-2 fw-bold`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="p-3">
                                        <p className="small text-muted mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                                            <Icon name="person" style={{ fontSize: 16 }} className="text-primary-green" />
                                            Buyer: <span className="fw-bold text-dark fs-6">{order.buyer_name}</span>
                                        </p>
                                        
                                        <div className="mb-3">
                                            <div className="fw-bold text-dark small mb-2 text-uppercase" style={{ letterSpacing: 0.5 }}>Items</div>
                                            {order.items?.map((item: any) => (
                                                <div key={item.id} className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom" style={{ borderStyle: 'dashed !important' }}>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            {item.product_image ? (
                                                                <img src={item.product_image} alt="pic" className="w-100 h-100 object-fit-cover rounded"/>
                                                            ) : <Icon name="image" className="text-muted opacity-50" style={{ fontSize: 16 }}/>}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-dark" style={{ fontSize: 13 }}>{item.product_name}</div>
                                                            <div className="text-muted" style={{ fontSize: 11 }}>Qty: {item.quantity} {item.unit}</div>
                                                        </div>
                                                    </div>
                                                    <div className="fw-bold fs-6 text-dark">₹{item.price}</div>
                                                </div>
                                            ))}
                                            <div className="d-flex justify-content-between align-items-center mt-2">
                                                <span className="fw-bold text-dark">Total Revenue</span>
                                                <span className="fw-bold text-primary-green fs-5">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>

                                        {/* Delivery Address */}
                                        <div className="bg-light p-3 rounded-4 mb-3 border border-primary border-opacity-25">
                                            <div className="small text-muted mb-2 d-flex align-items-center gap-1 fw-bold text-dark">
                                                <Icon name="local_shipping" style={{ fontSize: 16 }} className="text-primary" />
                                                Delivery Address
                                            </div>
                                            {addr ? (
                                                <div className="small lh-sm">
                                                    <div className="fw-bold text-dark">{addr.name}</div>
                                                    <div className="text-muted my-1"><Icon name="phone" style={{ fontSize: 12 }}/> {addr.phone}</div>
                                                    <div className="text-muted" style={{ fontSize: 12 }}>
                                                        {addr.street}, {addr.city}<br/>
                                                        {addr.state} - {addr.pincode}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="small text-danger">Address missing or deleted</div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {allowedStatuses.length > 0 && (
                                            <div className="d-flex gap-2 mt-3 pt-3 border-top">
                                                {allowedStatuses.map(st => (
                                                    <button 
                                                        key={st}
                                                        onClick={() => handleUpdateStatus(order.id, st)}
                                                        disabled={updatingId === order.id}
                                                        className={`btn btn-sm flex-grow-1 fw-bold rounded-pill ${
                                                            st === 'CANCELLED' ? 'btn-outline-danger' : 'btn-primary-green show-shadow'
                                                        }`}
                                                    >
                                                        {updatingId === order.id ? <span className="spinner-border spinner-border-sm"/> : `Mark ${st}`}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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
