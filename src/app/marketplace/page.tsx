"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/components/common/ToastContext';
import { auth } from '@/lib/firebase';
import CheckoutModal from '@/features/marketplace/components/CheckoutModal';

interface Product {
    id: string;
    farmer_id: string;
    farmer_name: string;
    farm_name: string;
    name: string;
    description: string;
    price: string | number;
    unit: string;
    category: string;
    image_url: string;
    stock: number;
    created_at: string;
}

// --- HELPERS ---
const timeAgo = (date: any) => {
    if (!date) return "N/A";
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
};

// --- MAIN COMPONENT ---
function MarketplaceContent() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Checkout Flow
    const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
    const [orderQuantity, setOrderQuantity] = useState(1);

    const categories = ['All', 'Vegetables', 'Fruits', 'Grains', 'Seeds', 'Dairy', 'Organic Fertilizer', 'Spices', 'Other'];

    useEffect(() => {
        fetchProducts();
    }, [categoryFilter]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const query = new URLSearchParams();
            if (categoryFilter !== 'All') query.append('category', categoryFilter);
            if (searchQuery) query.append('search', searchQuery);

            const res = await fetch(`/api/products?${query.toString()}`, {
                headers: { ...(token && { Authorization: `Bearer ${token}` }) }
            });

            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to load products", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProducts();
    };

    const handleBuyClick = (product: Product) => {
        // Enforce RBAC for buying
        if (user?.role !== 'BUYER') {
            showToast("Only Buyers can place orders.", "error");
            return;
        }

        if (product.stock <= 0) {
            showToast("Out of stock!", "error");
            return;
        }

        setOrderQuantity(1); // Reset
        setCheckoutProduct(product);
    };

    const closeCheckout = () => setCheckoutProduct(null);

    const onCheckoutSuccess = () => {
        closeCheckout();
        // Option to redirect to "My Orders"
        setTimeout(() => router.push('/buyer/orders'), 1500);
    };

    return (
        <div className="min-vh-100 d-flex flex-column pb-5 bg-light">
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3">
                    <div className="d-flex align-items-center justify-content-between mb-3" style={{ maxWidth: '448px', margin: '0 auto' }}>
                        <h1 className="h5 mb-0 fw-bold tracking-tight d-flex align-items-center gap-2" style={{ color: '#2E7D32' }}>
                            <Icon name="storefront" /> 
                            AgriMarket
                        </h1>
                        <button onClick={() => router.push('/buyer/orders')} className="btn btn-sm btn-light border rounded-pill fw-bold text-muted d-flex align-items-center gap-1 shadow-sm px-3 py-2" style={{ fontSize: 12 }}>
                            <Icon name="receipt_long" style={{ fontSize: 16 }} />
                            My Orders
                        </button>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearchSubmit} className="mb-3" style={{ maxWidth: '448px', margin: '0 auto' }}>
                        <div className="bg-light rounded-pill px-3 py-2 border d-flex align-items-center gap-2 shadow-sm transition-all focus-ring">
                            <Icon name="search" style={{ fontSize: '18px', color: '#888' }} />
                            <input 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                                type="text" 
                                className="form-control form-control-sm border-0 shadow-none p-0 bg-transparent" 
                                placeholder="Search fresh produce from local farmers..." 
                                style={{ fontSize: '14px' }} 
                            />
                        </div>
                    </form>

                    {/* Category Filter Chips */}
                    <div className="d-flex gap-2 overflow-auto hide-scrollbar pb-1" style={{ maxWidth: '448px', margin: '0 auto' }}>
                        {categories.map(cat => (
                            <button 
                                key={cat} 
                                onClick={() => setCategoryFilter(cat)} 
                                className={`btn btn-sm rounded-pill fw-bold px-3 flex-shrink-0 transition-all ${categoryFilter === cat ? 'shadow-sm text-white' : 'btn-light text-muted border'}`}
                                style={{ backgroundColor: categoryFilter === cat ? '#2E7D32' : '' }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="flex-grow-1 p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                
                <h2 className="h6 fw-bold mb-3 d-flex justify-content-between align-items-center text-dark">
                    Available Products
                    <span className="badge rounded-pill fw-bold" style={{ background: '#e8f5e9', color: '#2E7D32' }}>{products.length} items</span>
                </h2>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border" style={{ color: '#2E7D32' }}></div>
                        <p className="small text-muted mt-2">Loading fresh produce...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center p-5 bg-white rounded-4 border border-dashed text-muted shadow-sm">
                        <Icon name="inventory_2" style={{ fontSize: 40, color: '#ccc' }} className="mb-2" />
                        <h3 className="h6 fw-bold text-dark mb-1">No products found</h3>
                        <p className="small m-0">Try a different search or category.</p>
                    </div>
                ) : (
                    <div className="d-grid gap-3">
                        {products.map(product => (
                            <div key={product.id} className="card border-0 shadow-sm rounded-4 overflow-hidden transition-all hover-scale bg-white">
                                <div className="d-flex">
                                    {/* Image */}
                                    <div className="bg-light flex-shrink-0 border-end" style={{ width: '110px', height: '110px' }}>
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-100 h-100 object-fit-cover" />
                                        ) : (
                                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                                                <Icon name="image" style={{ fontSize: 32, opacity: 0.5 }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 flex-grow-1 min-width-0 d-flex flex-column justify-content-between">
                                        <div>
                                            <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                                                <h3 className="h6 fw-bold mb-0 text-dark text-truncate">{product.name}</h3>
                                                {product.stock <= 0 ? (
                                                     <span className="badge bg-danger-subtle text-danger rounded-pill flex-shrink-0" style={{ fontSize: 10 }}>Out of Stock</span>
                                                ) : (
                                                    <span className="fw-bold" style={{ color: '#2E7D32', fontSize: 13 }}>
                                                        ₹{product.price}<span className="text-muted fw-normal" style={{ fontSize: 11 }}>/{product.unit}</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-muted text-truncate mb-1" style={{ fontSize: 11 }}>
                                                {product.description || product.category}
                                            </div>
                                            <div className="d-flex align-items-center gap-1 text-secondary" style={{ fontSize: 11 }}>
                                                <Icon name="agriculture" style={{ fontSize: 13 }} />
                                                <span className="text-truncate">{product.farm_name || product.farmer_name}</span>
                                                <span className="mx-1">•</span>
                                                <span>{product.stock} {product.unit} left</span>
                                            </div>
                                        </div>
                                        
                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                            <span className="text-muted" style={{ fontSize: 10 }}>{timeAgo(product.created_at)}</span>
                                            <button 
                                                onClick={() => handleBuyClick(product)} 
                                                disabled={product.stock <= 0 || user?.role !== 'BUYER'}
                                                className={`btn btn-sm rounded-pill px-4 fw-bold shadow-sm ${product.stock > 0 && user?.role === 'BUYER' ? 'btn-primary-green' : 'btn-light border text-muted'}`}
                                                style={{ fontSize: 12, opacity: user?.role !== 'BUYER' ? 0.5 : 1 }}
                                            >
                                                {user?.role !== 'BUYER' ? 'Buyers Only' : 'Buy Now'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </main>
            
            {/* Modal Injection */}
            {checkoutProduct && (
                <CheckoutModal 
                    product={checkoutProduct} 
                    quantity={orderQuantity} 
                    onClose={closeCheckout} 
                    onSuccess={onCheckoutSuccess} 
                />
            )}

            <BottomNav />
        </div>
    );
}

export default function MarketplacePage() {
    return (
        <ProtectedRoute allowedRoles={['BUYER', 'FARMER', 'ADMIN']}>
            <MarketplaceContent />
        </ProtectedRoute>
    );
}
