"use client";

import React from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Icon } from '@/components/Icon';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function CartContent() {
    const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const handleCheckout = () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (cart.length === 0) return;

        try {
            const newOrder = {
                id: Math.random().toString(36).substr(2, 9),
                items: [...cart],
                total: cartTotal,
                status: 'pending',
                created_at: new Date().toISOString(),
                customer_id: user.id,
                customer_name: user.full_name,
            };

            // Save to customer's orders
            const savedOrdersKey = `dr_plant_orders_${user.id}`;
            const existingOrders = JSON.parse(localStorage.getItem(savedOrdersKey) || '[]');
            localStorage.setItem(savedOrdersKey, JSON.stringify([newOrder, ...existingOrders]));

            // Simulate notifying farmers (in a real app, this would be a backend action)
            const notifications = JSON.parse(localStorage.getItem('dr_plant_farmer_notifications') || '[]');
            notifications.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'NEW_ORDER',
                orderId: newOrder.id,
                message: `New order placed by ${user.full_name} for ₹${cartTotal}`,
                created_at: new Date().toISOString(),
                read: false
            });
            localStorage.setItem('dr_plant_farmer_notifications', JSON.stringify(notifications));

            showToast("Order placed successfully!", "success");
            clearCart();
            router.push('/orders');
        } catch (e) {
            console.error("Checkout failed", e);
            showToast("Failed to place order", "error");
        }
    };

    return (
        <div className="min-vh-100 bg-light pb-5">
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3 d-flex align-items-center gap-3" style={{ maxWidth: '448px', margin: '0 auto' }}>
                    <button onClick={() => router.back()} className="btn btn-light rounded-circle p-2 border shadow-sm">
                        <Icon name="arrow_back" />
                    </button>
                    <h1 className="h5 mb-0 fw-bold">Shopping Cart</h1>
                </div>
            </header>

            <main className="p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                {cart.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 bg-opacity-10 text-muted" style={{ width: '80px', height: '80px', border: '2px dashed #ccc' }}>
                            <Icon name="shopping_cart" className="display-6" />
                        </div>
                        <h2 className="h5 fw-bold mb-2">Your cart is empty</h2>
                        <p className="text-muted small mb-4">Browse our products and add some items to your cart!</p>
                        <Link href="/products" className="btn btn-primary-green rounded-pill px-4 fw-bold shadow-sm">
                            Go to Store
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="d-grid gap-3 mb-4">
                            {cart.map(item => (
                                <div key={item.id || item._id} className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                    <div className="d-flex p-3">
                                        <img src={item.image_url} alt={item.name} className="rounded-3 object-fit-cover" style={{ width: '70px', height: '70px' }} />
                                        <div className="ms-3 flex-grow-1">
                                            <div className="d-flex justify-content-between">
                                                <h3 className="h6 fw-bold mb-1">{item.name}</h3>
                                                <button onClick={() => removeFromCart(item.id || item._id)} className="btn btn-link text-danger p-0">
                                                    <Icon name="delete" style={{ fontSize: '18px' }} />
                                                </button>
                                            </div>
                                            <p className="small text-muted mb-2">₹{item.price}/{item.unit}</p>
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="btn-group border rounded-pill p-1 bg-light">
                                                    <button onClick={() => updateQuantity(item.id || item._id, item.quantity - 1)} className="btn btn-sm btn-white rounded-circle border-0 shadow-none">-</button>
                                                    <span className="px-3 small fw-bold">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id || item._id, item.quantity + 1)} className="btn btn-sm btn-white rounded-circle border-0 shadow-none">+</button>
                                                </div>
                                                <span className="fw-bold">₹{item.price * item.quantity}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                            <h2 className="h6 fw-bold mb-3">Order Summary</h2>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted small">Subtotal</span>
                                <span className="small fw-bold">₹{cartTotal}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted small">Shipping</span>
                                <span className="small text-success fw-bold">FREE</span>
                            </div>
                            <hr className="my-3 opacity-10" />
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold">Total Amount</span>
                                <span className="h5 fw-bold text-primary-green mb-0">₹{cartTotal}</span>
                            </div>
                        </div>

                        <button onClick={handleCheckout} className="btn btn-primary-green btn-lg w-100 rounded-4 fw-bold shadow-lg py-3 animate-pulse">
                            Proceed to Checkout
                        </button>
                        
                        <button onClick={clearCart} className="btn btn-link text-muted small w-100 mt-3 text-decoration-none">
                            Clear Shopping Cart
                        </button>
                    </>
                )}
            </main>
            <BottomNav />
        </div>
    );
}

export default function CartPage() {
    return (
        <ProtectedRoute allowedRoles={['BUYER', 'FARMER', 'ADMIN']}>
            <CartContent />
        </ProtectedRoute>
    );
}
