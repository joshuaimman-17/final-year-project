"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useCart } from '@/features/marketplace/context/CartContext';
import { useToast } from '@/components/common/ToastContext';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';

function BuyerCartContent() {
    const { user } = useAuth();
    const { cart, cartCount, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
    const { showToast } = useToast();
    const router = useRouter();

    const [checkoutMode, setCheckoutMode] = useState(false);
    
    // Checkout State
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [placingOrder, setPlacingOrder] = useState(false);

    const fetchAddresses = async () => {
        try {
            const { auth } = await import('@/lib/firebase');
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/user/addresses', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setAddresses(data);
                if (data.length > 0) setSelectedAddressId(data[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Make sure we fetch addresses if they want to checkout and haven't fetched yet
    useEffect(() => {
        if (checkoutMode && addresses.length === 0) {
            fetchAddresses();
        }
    }, [checkoutMode, addresses.length]);

    const handleCheckout = async () => {
        if (!selectedAddressId) {
            showToast("Please select a delivery address", "error");
            return;
        }
        
        const itemsByFarmer: Record<string, any[]> = {};
        cart.forEach(item => {
            const fId = item.farmer_id || 'unknown_farmer';
            if (!itemsByFarmer[fId]) itemsByFarmer[fId] = [];
            itemsByFarmer[fId].push({
                product_id: item.id || item._id,
                quantity: item.quantity
            });
        });

        setPlacingOrder(true);
        try {
            const { auth } = await import('@/lib/firebase');
            const token = await auth.currentUser?.getIdToken();
            
            const promises = Object.keys(itemsByFarmer).map(farmerId => 
                fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        farmer_id: farmerId,
                        delivery_address_id: selectedAddressId,
                        items: itemsByFarmer[farmerId]
                    })
                }).then(res => {
                    if (!res.ok) throw new Error("Failed to place order");
                    return res;
                })
            );

            await Promise.all(promises);
            
            clearCart();
            setCheckoutMode(false);
            showToast("Order Placed Successfully! 🎉", "success");
            router.push('/buyer/orders');
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setPlacingOrder(false);
        }
    };

    return (
        <div className="min-vh-100 bg-light d-flex flex-column" style={{ paddingBottom: '160px' }}>
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3 d-flex align-items-center justify-content-between mx-auto" style={{ maxWidth: '800px' }}>
                    <div className="d-flex align-items-center gap-3">
                        <button onClick={() => checkoutMode ? setCheckoutMode(false) : router.push('/marketplace')} className="btn btn-light rounded-circle shadow-sm p-0 d-flex align-items-center justify-content-center hover-scale" style={{ width: 40, height: 40 }}>
                            <Icon name="arrow_back" className="text-dark" />
                        </button>
                        <h1 className="h5 fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                            <Icon name="shopping_cart" className={checkoutMode ? 'text-secondary' : 'text-success'} /> 
                            {checkoutMode ? 'Checkout' : 'Your Cart'}
                        </h1>
                    </div>
                </div>
            </header>

            <main className="flex-grow-1 p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '800px' }}>
                {cart.length === 0 ? (
                    <div className="text-center py-5 mt-4 bg-white rounded-4 shadow-sm border">
                        <Icon name="remove_shopping_cart" style={{ fontSize: 64, color: '#ccc' }} className="mb-3" />
                        <h3 className="h5 fw-bold text-dark">Your cart is empty</h3>
                        <p className="text-muted small mb-4">Looks like you haven't added any fresh produce yet.</p>
                        <button onClick={() => router.push('/marketplace')} className="btn btn-success px-4 rounded-pill shadow-sm fw-bold">
                            Start Shopping
                        </button>
                    </div>
                ) : checkoutMode ? (
                    /* Checkout Delivery UI */
                    <div className="animate-fade-in d-grid gap-4">
                        <section className="bg-white p-4 rounded-4 shadow-sm border">
                            <h4 className="fw-bold mb-3 h6 d-flex align-items-center gap-2 border-bottom pb-2 text-dark">
                                <Icon name="local_shipping" className="text-primary" /> Delivery Address
                            </h4>
                            {addresses.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-muted small">No addresses found. You need a delivery address.</p>
                                    <button onClick={() => router.push('/buyer/profile')} className="btn btn-dark btn-sm rounded-pill px-4 shadow-sm">Add Address</button>
                                </div>
                            ) : (
                                <div className="d-grid gap-3 mt-3">
                                    {addresses.map(addr => (
                                        <label key={addr.id} className={`card p-3 rounded-4 cursor-pointer transition-all border-2 ${selectedAddressId === addr.id ? 'border-success bg-success bg-opacity-10 shadow-sm' : 'border-light shadow-sm bg-white hover-scale'}`}>
                                            <div className="d-flex align-items-start gap-3">
                                                <input type="radio" className="form-check-input mt-1" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} style={{ accentColor: '#198754' }}/>
                                                <div>
                                                    <div className="fw-bold text-dark mb-1">{addr.name}</div>
                                                    <div className="small text-muted mb-2 d-flex align-items-center gap-1"><Icon name="phone" style={{ fontSize: 13 }} /> {addr.phone}</div>
                                                    <div className="small lh-sm text-secondary bg-white p-2 rounded border" style={{ fontSize: 12 }}>
                                                        {addr.street}, {addr.city}, <br/> {addr.state} - <span className="fw-bold">{addr.pincode}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="bg-white p-4 rounded-4 shadow-sm border mb-5">
                            <h4 className="fw-bold mb-3 h6 d-flex align-items-center gap-2 border-bottom pb-2 text-dark">
                                <Icon name="payments" className="text-primary" /> Payment Method
                            </h4>
                            <div className="card shadow-sm border-0 bg-light rounded-4 p-3 d-flex flex-row align-items-center gap-3">
                                <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center">
                                    <Icon name="check_circle" className="fs-5" />
                                </div>
                                <div className="flex-grow-1">
                                    <div className="fw-bold text-dark h6 mb-0">Cash on Delivery (COD)</div>
                                    <div className="small text-muted" style={{ fontSize: 11 }}>Pay at your doorstep seamlessly.</div>
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    /* Cart Items UI */
                    <div className="d-grid gap-3">
                        <div className="bg-white p-3 rounded-4 shadow-sm border mb-2 d-flex justify-content-between align-items-center">
                            <span className="text-secondary fw-bold small text-uppercase">Items in Cart</span>
                            <span className="badge bg-success-subtle text-success rounded-pill">{cartCount} items</span>
                        </div>

                        {cart.map(item => (
                            <div key={item.id} className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white hover-scale transition-all">
                                <div className="d-flex p-3 gap-3">
                                    <div className="bg-light rounded border text-center d-flex align-items-center justify-content-center" style={{ width: 100, height: 100 }}>
                                        {item.image_url ? <img src={item.image_url} className="w-100 h-100 object-fit-cover rounded" /> : <Icon name="image" className="opacity-25" style={{ fontSize: 40 }} />}
                                    </div>
                                    <div className="flex-grow-1 d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                            <h4 className="h6 fw-bold mb-0 text-dark lh-sm pr-2">{item.name}</h4>
                                            <button onClick={() => removeFromCart(item.id || item._id)} className="btn btn-link text-danger p-0 ms-auto">
                                                <Icon name="delete" style={{ fontSize: 20 }} />
                                            </button>
                                        </div>
                                        <div className="small text-muted mb-2"><Icon name="storefront" style={{ fontSize: 11 }} /> {item.farm_name || item.farmer_name || 'Farmer'}</div>
                                        
                                        <div className="text-dark fw-bold mb-auto h5">₹{item.price} <span className="text-muted fw-normal small h6">/{item.unit}</span></div>
                                        
                                        {/* Quantity Controls */}
                                        <div className="d-flex align-items-center gap-3 bg-light rounded-pill px-2 py-1 d-inline-flex border align-self-start mt-2">
                                            <button 
                                                onClick={() => updateQuantity(item.id || item._id, item.quantity - 1)}
                                                className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center text-dark bg-white shadow-sm" style={{ width: 28, height: 28 }}
                                            ><Icon name="remove" style={{ fontSize: 16 }} /></button>
                                            <span className="fw-bold fs-6 text-dark" style={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.id || item._id, item.quantity + 1)}
                                                className="btn btn-sm btn-success rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm" style={{ width: 28, height: 28 }}
                                            ><Icon name="add" style={{ fontSize: 16 }} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Bottom Sticky Action Bar */}
            {cart.length > 0 && (
                <div className="position-fixed start-0 w-100 bg-white shadow-lg border-top p-3 z-3" style={{ bottom: '64px', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
                    <div className="mx-auto" style={{ maxWidth: 800 }}>
                        <div className="d-flex justify-content-between align-items-center mb-3 px-2">
                            <span className="text-muted fw-medium text-uppercase small" style={{ letterSpacing: 1 }}>Grand Total</span>
                            <span className="fw-bold fs-4 text-success">₹{cartTotal.toLocaleString('en-IN')}</span>
                        </div>
                        
                        {checkoutMode ? (
                            <button 
                                onClick={handleCheckout} 
                                disabled={placingOrder || !selectedAddressId}
                                className="btn btn-success btn-lg w-100 rounded-pill fw-bold shadow hover-scale transition-all d-flex align-items-center justify-content-center gap-2"
                            >
                                {placingOrder ? <span className="spinner-border spinner-border-sm" /> : <>Place Order <Icon name="check_circle" /></>}
                            </button>
                        ) : (
                            <button 
                                onClick={() => setCheckoutMode(true)} 
                                className="btn btn-dark btn-lg w-100 rounded-pill fw-bold shadow hover-scale transition-all d-flex align-items-center justify-content-center gap-2"
                            >
                                Proceed to Checkout <Icon name="arrow_forward" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Render Bottom Navigation exactly at the bottom */}
            <BottomNav />


            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
                .hover-scale { transition: transform 0.2s ease; }
                .hover-scale:hover { transform: scale(1.02); }
                .transition-all { transition: all 0.2s ease; }
            `}</style>
        </div>
    );
}

export default function BuyerCartPage() {
    return (
        <ProtectedRoute allowedRoles={['BUYER', 'ADMIN', 'FARMER']}>
            <BuyerCartContent />
        </ProtectedRoute>
    );
}
