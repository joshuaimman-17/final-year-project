"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useCart } from '@/features/marketplace/context/CartContext';
import { useToast } from '@/components/common/ToastContext';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Seeds', 'Tools', 'Fertilizers'];

function MarketplaceContent() {
    const { user } = useAuth();
    const { cart, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
    const { showToast } = useToast();
    const router = useRouter();

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');


    useEffect(() => {
        fetchProducts();
    }, [category]);

    // Added a debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { auth } = await import('@/lib/firebase');
            const token = await auth.currentUser?.getIdToken();
            const url = new URL(window.location.origin + '/api/products');
            if (category !== 'All') url.searchParams.append('category', category);
            if (search) url.searchParams.append('search', search);

            const res = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setProducts(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };




    return (
        <div className="min-vh-100 bg-light pb-5">
            {/* Top Navigation */}
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3 d-flex align-items-center justify-content-between mx-auto flex-wrap gap-2" style={{ maxWidth: '1200px' }}>
                    <div className="d-flex align-items-center gap-2">
                        <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: 40, height: 40 }}>
                            <Icon name="shopping_cart" />
                        </div>
                        <h1 className="h5 fw-bold mb-0 text-success d-none d-md-block">Dr.Plant Market</h1>
                        <h1 className="h5 fw-bold mb-0 text-success d-md-none">Market</h1>
                    </div>

                    <div className="flex-grow-1 mx-md-4 order-3 order-md-2" style={{ minWidth: '240px' }}>
                        <div className="input-group input-group-lg shadow-sm rounded-pill overflow-hidden border">
                            <span className="input-group-text bg-white border-0 text-muted ps-4">
                                <Icon name="search" />
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-0 bg-white fs-6 shadow-none" 
                                placeholder="Search products, seeds, tools..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="d-flex gap-3 align-items-center order-2 order-md-3">
                        <button onClick={() => router.push('/buyer/profile')} className="btn btn-light rounded-circle border shadow-sm p-0 d-flex align-items-center justify-content-center hover-scale transition-all" style={{ width: 40, height: 40 }}>
                            <Icon name="person" className="text-secondary" />
                        </button>
                        <button 
                            onClick={() => router.push('/buyer/cart')} 
                            className="btn btn-success rounded-pill px-3 shadow-sm d-flex align-items-center gap-2 hover-scale transition-all fw-bold"
                        >
                            <Icon name="shopping_cart" style={{ fontSize: 18 }} />
                            <span>Cart</span>
                            {cartCount > 0 && <span className="badge bg-white text-success rounded-pill ms-1">{cartCount}</span>}
                        </button>
                    </div>
                </div>

                {/* Categories */}
                <div className="bg-white border-top overflow-auto hide-scrollbar">
                    <div className="d-flex gap-2 p-2 mx-auto px-3" style={{ maxWidth: '1200px', whiteSpace: 'nowrap' }}>
                        {CATEGORIES.map(c => (
                            <button 
                                key={c}
                                onClick={() => setCategory(c)}
                                className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${category === c ? 'btn-success shadow-sm' : 'btn-light border text-muted'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="p-3 mx-auto mt-2 animate-fade-in" style={{ maxWidth: '1200px' }}>
                {/* Promo Banner */}
                <div className="rounded-4 p-4 text-white shadow-sm mb-4 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #198754 0%, #20c997 100%)' }}>
                    <div className="position-absolute top-0 end-0 mt-n5 me-n5 bg-white opacity-10 rounded-circle" style={{ width: '200px', height: '200px', filter: 'blur(32px)' }} />
                    <div className="position-relative z-1 d-flex gap-4 align-items-center">
                        <div>
                            <span className="badge bg-white text-success rounded-pill px-2 py-1 mb-2 fw-bold" style={{ fontSize: 10 }}>FARMER DIRECT</span>
                            <h2 className="display-6 fw-bold mb-2 text-white shadow-sm-text">Fresh From<br/>Farm to Home</h2>
                            <p className="mb-0 text-white-50 small">Support local farmers. Get organic produce.</p>
                        </div>
                        <Icon name="agriculture" className="display-1 text-white opacity-50 ms-auto d-none d-sm-block" filled />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-success mb-2" />
                        <p className="text-muted small">Loading marketplace...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm border mx-auto" style={{ maxWidth: 400 }}>
                        <Icon name="inventory_2" style={{ fontSize: 64, color: '#dee2e6' }} className="mb-3" />
                        <h3 className="h5 fw-bold text-dark">No Products Found</h3>
                        <p className="text-muted small">Try adjusting your search or category filters.</p>
                    </div>
                ) : (
                    <div className="row g-3 g-md-4">
                        {products.map(p => (
                            <div key={p.id} className="col-6 col-md-4 col-lg-3">
                                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-scale transition-all bg-white" style={{ outline: '1px solid rgba(0,0,0,0.05)' }}>
                                    <div className="position-relative bg-light" style={{ paddingBottom: '75%' }}>
                                        {p.image_url ? (
                                            <img src={p.image_url} alt={p.name} className="position-absolute w-100 h-100 object-fit-cover" />
                                        ) : (
                                            <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                                                <Icon name="image" style={{ fontSize: 48, opacity: 0.2 }} />
                                            </div>
                                        )}
                                        {/* Category Badge */}
                                        <span className="position-absolute top-0 start-0 m-2 badge bg-white text-dark shadow-sm border" style={{ fontSize: 9 }}>
                                            {p.category}
                                        </span>
                                    </div>
                                    <div className="card-body p-3 d-flex flex-column bg-white">
                                        <div className="small text-muted mb-1 text-truncate d-flex align-items-center gap-1" style={{ fontSize: 11 }}>
                                            <Icon name="storefront" style={{ fontSize: 12 }} /> 
                                            {p.farm_name || p.farmer_name || 'Verified Farmer'}
                                        </div>
                                        <h3 className="h6 fw-bold text-dark mb-1 text-truncate">{p.name}</h3>
                                        <p className="text-muted small mb-3 text-truncate lh-sm" style={{ fontSize: 12 }}>{p.description || "Fresh agricultural product"}</p>
                                        
                                        <div className="mt-auto d-flex align-items-center justify-content-between">
                                            <div>
                                                <span className="fw-bold fs-5 text-dark">₹{p.price}</span>
                                                <span className="text-muted small">/{p.unit}</span>
                                            </div>
                                            <button 
                                                onClick={() => { addToCart(p); showToast("Added to Cart", "success"); }}
                                                className="btn btn-success rounded-circle shadow-sm hover-scale d-flex align-items-center justify-content-center"
                                                style={{ width: 36, height: 36, padding: 0 }}
                                            >
                                                <Icon name="add_shopping_cart" style={{ fontSize: 18 }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Empty space for bottom nav */}
            <div style={{ height: 80 }} /> 
            <BottomNav />

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

export default function MarketplacePage() {
    return (
        <ProtectedRoute allowedRoles={['BUYER', 'ADMIN', 'FARMER']}>
            <MarketplaceContent />
        </ProtectedRoute>
    );
}
