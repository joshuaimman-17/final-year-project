"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/components/common/ToastContext';
import { Icon } from '@/components/ui/Icon';

interface Address {
    id: string;
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    is_default: boolean;
}

interface Product {
    id: string;
    farmer_id: string;
    name: string;
    price: string | number;
    unit: string;
    image_url?: string;
}

interface CheckoutModalProps {
    product: Product;
    quantity: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CheckoutModal({ product, quantity, onClose, onSuccess }: CheckoutModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loadingAddr, setLoadingAddr] = useState(true);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    
    // Inline Form State
    const [showForm, setShowForm] = useState(false);
    const [savingAddr, setSavingAddr] = useState(false);
    const [addrForm, setAddrForm] = useState({
        name: user?.full_name || '',
        phone: user?.phoneNumber || '',
        street: '',
        city: '',
        state: '',
        pincode: ''
    });

    const [placingOrder, setPlacingOrder] = useState(false);

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const { auth } = await import('@/lib/firebase');
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch('/api/user/addresses', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAddresses(data);
                    if (data.length > 0) {
                        const def = data.find((a: Address) => a.is_default);
                        setSelectedAddressId(def ? def.id : data[0].id);
                    } else {
                        setShowForm(true); // Auto show form if no addresses
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingAddr(false);
            }
        };
        fetchAddresses();
    }, [user]);

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingAddr(true);
        try {
            const { auth } = await import('@/lib/firebase');
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/user/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...addrForm, is_default: addresses.length === 0 })
            });

            if (res.ok) {
                const newAddr = await res.json();
                setAddresses([newAddr, ...addresses]);
                setSelectedAddressId(newAddr.id);
                setShowForm(false);
                showToast("Address saved!", "success");
            } else {
                showToast("Failed to save address", "error");
            }
        } catch {
            showToast("Network error saving address", "error");
        } finally {
            setSavingAddr(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            showToast("Please select a delivery address", "error");
            return;
        }

        setPlacingOrder(true);
        try {
            const { auth } = await import('@/lib/firebase');
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    farmer_id: product.farmer_id,
                    delivery_address_id: selectedAddressId,
                    items: [
                        {
                            product_id: product.id,
                            quantity: quantity
                        }
                    ]
                })
            });

            if (res.ok) {
                showToast("Order Placed Successfully! 🎉", "success");
                onSuccess();
            } else {
                const errData = await res.json();
                showToast(errData.message || "Failed to place order", "error");
            }
        } catch {
            showToast("Network Error placing order", "error");
        } finally {
            setPlacingOrder(false);
        }
    };

    const totalAmount = parseFloat(product.price.toString()) * quantity;

    return (
        <div className="modal d-flex" style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
            <div className="bg-white rounded-4 w-100 p-0 overflow-hidden mx-3 shadow-lg flex-column d-flex" style={{ maxWidth: 500, maxHeight: '90vh' }}>
                
                {/* Header */}
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                    <h2 className="h6 fw-bold mb-0">Checkout Securely</h2>
                    <button onClick={onClose} className="btn btn-sm btn-light rounded-circle border" style={{ width: 32, height: 32, padding: 0 }}>
                        <Icon name="close" style={{ fontSize: 18 }} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 flex-grow-1 overflow-auto">
                    
                    {/* Order Summary */}
                    <div className="mb-4">
                        <h3 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: 15 }}>
                            <Icon name="receipt_long" className="text-secondary" />
                            Order Summary
                        </h3>
                        <div className="card shadow-sm border-0 rounded-4 p-3 bg-light">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="fw-semibold text-dark">{product.name}</span>
                                <span className="fw-bold">₹{product.price} / {product.unit}</span>
                            </div>
                            <div className="d-flex justify-content-between text-muted small border-bottom pb-2 mb-2">
                                <span>Quantity</span>
                                <span>x {quantity} {product.unit}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold text-dark">Total Amount</span>
                                <span className="fw-bold text-primary-green fs-5">₹{totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Address Selection */}
                    <div>
                        <h3 className="fw-bold mb-3 d-flex align-items-center justify-content-between" style={{ fontSize: 15 }}>
                            <div className="d-flex align-items-center gap-2">
                                <Icon name="local_shipping" className="text-secondary" />
                                Delivery Address
                            </div>
                            {!showForm && addresses.length > 0 && (
                                <button onClick={() => setShowForm(true)} className="btn btn-sm text-primary-green fw-bold p-0">
                                    + Add New
                                </button>
                            )}
                        </h3>

                        {loadingAddr ? (
                            <div className="text-center p-3"><span className="spinner-border spinner-border-sm text-primary-green" /></div>
                        ) : showForm ? (
                            <form onSubmit={handleSaveAddress} className="card shadow-sm border-1 border-primary rounded-4 p-3 animate-fade-in">
                                <div className="row g-2 mb-2">
                                    <div className="col-12">
                                        <input required placeholder="Full Name" className="form-control form-control-sm" value={addrForm.name} onChange={e => setAddrForm({...addrForm, name: e.target.value})} />
                                    </div>
                                    <div className="col-12">
                                        <input required placeholder="Phone Number" className="form-control form-control-sm" value={addrForm.phone} onChange={e => setAddrForm({...addrForm, phone: e.target.value})} />
                                    </div>
                                    <div className="col-12">
                                        <input required placeholder="Street / Area" className="form-control form-control-sm" value={addrForm.street} onChange={e => setAddrForm({...addrForm, street: e.target.value})} />
                                    </div>
                                    <div className="col-5">
                                        <input required placeholder="City" className="form-control form-control-sm" value={addrForm.city} onChange={e => setAddrForm({...addrForm, city: e.target.value})} />
                                    </div>
                                    <div className="col-4">
                                        <input required placeholder="State" className="form-control form-control-sm" value={addrForm.state} onChange={e => setAddrForm({...addrForm, state: e.target.value})} />
                                    </div>
                                    <div className="col-3">
                                        <input required placeholder="PIN" className="form-control form-control-sm" value={addrForm.pincode} onChange={e => setAddrForm({...addrForm, pincode: e.target.value})} />
                                    </div>
                                </div>
                                <div className="d-flex gap-2 justify-content-end">
                                    {addresses.length > 0 && (
                                        <button type="button" onClick={() => setShowForm(false)} className="btn btn-sm btn-light border flex-grow-1 fw-bold">Cancel</button>
                                    )}
                                    <button type="submit" disabled={savingAddr} className="btn btn-sm btn-primary-green flex-grow-1 fw-bold">
                                        {savingAddr ? <span className="spinner-border spinner-border-sm" /> : "Save & Use"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="d-grid gap-2">
                                {addresses.map(addr => (
                                    <label key={addr.id} className={`card p-3 rounded-4 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border shadow-none bg-light'}`}>
                                        <div className="d-flex align-items-start gap-2">
                                            <div className="pt-1">
                                                <input type="radio" className="form-check-input" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} />
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="fw-bold d-flex align-items-center gap-2">
                                                    {addr.name} 
                                                    {addr.is_default && <span className="badge bg-secondary" style={{ fontSize: 9 }}>Default</span>}
                                                </div>
                                                <div className="small text-muted">{addr.phone}</div>
                                                <div className="small text-muted mt-1 lh-sm">
                                                    {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className="mt-4 border-top pt-3">
                        <h3 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ fontSize: 15 }}>
                            <Icon name="payments" className="text-secondary" />
                            Payment Method
                        </h3>
                        <div className="card shadow-sm border-success bg-white rounded-4 p-3 d-flex flex-row align-items-center gap-3 cursor-not-allowed">
                            <input type="radio" className="form-check-input mb-0" checked readOnly style={{ accentColor: '#2E7D32' }} />
                            <div>
                                <div className="fw-bold text-success">Cash on Delivery (COD)</div>
                                <div className="small text-muted" style={{ fontSize: 11 }}>Pay securely at your doorstep</div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer fixed */}
                <div className="p-3 border-top bg-white">
                    <button 

                        onClick={handlePlaceOrder} 
                        disabled={placingOrder || !selectedAddressId || showForm} 
                        className="btn btn-primary-green btn-lg w-100 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                    >
                        {placingOrder ? (
                            <><span className="spinner-border spinner-border-sm" /> Processing Order...</>
                        ) : (
                            <>Place Order - ₹{totalAmount.toLocaleString('en-IN')}</>
                        )}
                    </button>
                    <p className="text-center text-muted mt-2 mb-0" style={{ fontSize: 11 }}>
                        <Icon name="lock" style={{ fontSize: 12 }} /> Secure payment processed dynamically.
                    </p>
                </div>

            </div>
        </div>
    );
}
