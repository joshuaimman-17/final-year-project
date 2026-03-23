"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';

const ORDER_STEPS = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

function BuyerOrdersContent() {
    const router = useRouter();

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { auth } = await import('@/lib/firebase');
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setOrders(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'text-warning';
            case 'CONFIRMED': return 'text-info';
            case 'SHIPPED': return 'text-primary';
            case 'DELIVERED': return 'text-success';
            case 'CANCELLED': return 'text-danger';
            default: return 'text-secondary';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return 'hourglass_empty';
            case 'CONFIRMED': return 'thumb_up';
            case 'SHIPPED': return 'local_shipping';
            case 'DELIVERED': return 'verified';
            case 'CANCELLED': return 'cancel';
            default: return 'help';
        }
    };

    const isStepCompleted = (currentStatus: string, stepIndex: number) => {
        if (currentStatus === 'CANCELLED') return false;
        const currentIndex = ORDER_STEPS.indexOf(currentStatus);
        return currentIndex >= stepIndex;
    };

    return (
        <div className="min-vh-100 bg-light d-flex flex-column pb-5">
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3 d-flex align-items-center justify-content-between mx-auto" style={{ maxWidth: '800px' }}>
                    <h1 className="h5 fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                        <Icon name="receipt_long" className="text-secondary" /> 
                        My Orders
                    </h1>
                </div>
            </header>

            <main className="flex-grow-1 p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: 800 }}>
                {loading ? (
                    <div className="text-center py-5 mt-5">
                        <div className="spinner-border text-success mb-2" />
                        <p className="text-muted small">Loading your order history...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-5 mt-5 bg-white rounded-4 shadow-sm border">
                        <Icon name="receipt_long" style={{ fontSize: 64, color: '#dee2e6' }} className="mb-3" />
                        <h4 className="h6 fw-bold text-dark">No Orders Yet</h4>
                        <p className="text-muted small mb-3">Looks like you haven't bought anything from our farmers yet.</p>
                        <button onClick={() => router.push('/marketplace')} className="btn btn-success px-4 rounded-pill shadow-sm fw-bold">
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="d-grid gap-4">
                        {orders.map(order => (
                            <div key={order.id} className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white hover-scale transition-all">
                                {/* Order Header */}
                                <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-start flex-wrap gap-2">
                                    <div>
                                        <div className="small text-muted mb-1 fw-medium h-100">
                                            Order ID: <span className="text-dark font-monospace opacity-75">{order.id.split('-')[0].toUpperCase()}</span>
                                        </div>
                                        <div className="small text-muted" style={{ fontSize: 11 }}>
                                            Placed on {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <div className="fw-bold fs-5 text-dark mb-1">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</div>
                                        <span className={`badge rounded-pill bg-white border shadow-sm px-2 py-1 d-inline-flex align-items-center gap-1 ${getStatusColor(order.status)} fw-bold`} style={{ fontSize: 10 }}>
                                            <Icon name={getStatusIcon(order.status)} style={{ fontSize: 12 }} />
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3">
                                    {/* Tracking Timeline */}
                                    {order.status !== 'CANCELLED' && (
                                        <div className="mb-4 mt-2 px-2">
                                            <div className="d-flex justify-content-between position-relative">
                                                {/* Background Line */}
                                                <div className="position-absolute top-50 start-0 w-100 bg-light" style={{ height: 4, transform: 'translateY(-50%)', zIndex: 0, borderRadius: 2 }} />
                                                
                                                {/* Progress Line */}
                                                <div className="position-absolute top-50 start-0 bg-success transition-all" 
                                                    style={{ 
                                                        height: 4, transform: 'translateY(-50%)', zIndex: 1, borderRadius: 2,
                                                        width: `${ORDER_STEPS.indexOf(order.status) === -1 ? 0 : (ORDER_STEPS.indexOf(order.status) / (ORDER_STEPS.length - 1)) * 100}%`
                                                    }} 
                                                />
                                                
                                                {ORDER_STEPS.map((step, idx) => {
                                                    const completed = isStepCompleted(order.status, idx);
                                                    const isCurrent = order.status === step;
                                                    return (
                                                        <div key={step} className="d-flex flex-column align-items-center position-relative z-2" style={{ width: '60px' }}>
                                                            <div className={`rounded-circle d-flex align-items-center justify-content-center transition-all ${completed ? 'bg-success text-white shadow-sm' : 'bg-white border text-muted'}`} 
                                                                style={{ 
                                                                    width: 28, height: 28, border: completed ? 'none' : '2px solid #e9ecef',
                                                                    transform: isCurrent ? 'scale(1.2)' : 'none'
                                                                }}>
                                                                <Icon name={completed ? 'check' : 'circle'} style={{ fontSize: completed ? 16 : 8, opacity: completed ? 1 : 0.3 }} />
                                                            </div>
                                                            <div className={`mt-2 fw-bold text-center ${completed ? 'text-dark' : 'text-muted'}`} style={{ fontSize: 9, letterSpacing: 0.5 }}>
                                                                {step}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Items List */}
                                    <h5 className="h6 fw-bold mb-3 text-dark border-bottom pb-2">Items from {order.farm_name || order.farmer_name || 'Verified Farmer'}</h5>
                                    <div className="d-grid gap-3">
                                        {order.items?.map((item: any) => (
                                            <div key={item.id} className="d-flex gap-3 align-items-center">
                                                <div className="bg-light rounded border-0" style={{ width: 64, height: 64 }}>
                                                    {item.product_image ? (
                                                        <img src={item.product_image} alt={item.product_name} className="w-100 h-100 object-fit-cover rounded" />
                                                    ) : (
                                                        <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                                                            <Icon name="image" className="text-muted opacity-25" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="fw-bold text-dark">{item.product_name}</div>
                                                    <div className="small text-muted mt-1">Qty: {item.quantity} {item.unit}</div>
                                                </div>
                                                <div className="fw-bold text-dark">₹{(parseFloat(item.price) * parseFloat(item.quantity)).toLocaleString('en-IN')}</div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Delivery Address Snapshot */}
                                    {order.delivery_address && (
                                        <div className="mt-3 p-3 bg-light rounded-3 border-0">
                                            <div className="small text-muted mb-1 fw-bold d-flex align-items-center gap-1">
                                                <Icon name="place" style={{ fontSize: 14 }}/> Deliver To
                                            </div>
                                            <div className="small text-dark lh-sm">
                                                <span className="fw-bold">{order.delivery_address.name}</span> <br/>
                                                <span className="text-muted">{order.delivery_address.street}, {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            
            <BottomNav />
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
                .hover-scale { transition: transform 0.2s ease; }
            `}</style>
        </div>
    );
}

export default function BuyerOrdersPage() {
    return (
        <ProtectedRoute allowedRoles={['BUYER', 'ADMIN', 'FARMER']}>
            <BuyerOrdersContent />
        </ProtectedRoute>
    );
}
