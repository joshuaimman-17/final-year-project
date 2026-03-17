"use client";

import React, { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { api } from '@/services/api';
import { Product } from '@/types';
import { Icon } from '@/components/Icon';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';

function ProductsContent() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Using the fetchProducts endpoint
                const res = await fetch('/api/products');
                const data = await res.json();
                setProducts(data);
            } catch (err) {
                console.error("Failed to fetch products", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="min-vh-100 bg-light pb-5">
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3 d-flex align-items-center justify-content-between" style={{ maxWidth: '448px', margin: '0 auto' }}>
                    <h1 className="h5 mb-0 fw-bold text-primary-green">AgriStore</h1>
                    <Link href="/cart" className="btn btn-light rounded-circle p-2 position-relative shadow-sm border">
                        <Icon name="shopping_cart" />
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                            {/* We could use cartCount here if we want */}
                        </span>
                    </Link>
                </div>
            </header>

            <main className="p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                <div className="row g-3">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="col-6">
                                <div className="card border-0 shadow-sm rounded-4 overflow-hidden animate-pulse" style={{ height: '220px' }} />
                            </div>
                        ))
                    ) : (
                        products.map(product => (
                            <div key={product.id || product._id} className="col-6">
                                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-scale transition-all">
                                    <Link href={`/products/${product.id || product._id}`} className="text-decoration-none">
                                        <div className="position-relative">
                                            <img src={product.image_url} alt={product.name} className="w-100 object-fit-cover" style={{ height: '120px' }} />
                                            {product.on_sale && (
                                                <span className="position-absolute top-0 start-0 bg-danger text-white px-2 py-1 small fw-bold rounded-bottom-end" style={{ fontSize: '10px' }}>SALE</span>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <h3 className="h6 fw-bold mb-1 text-dark text-truncate">{product.name}</h3>
                                            <p className="small text-muted mb-2">{product.category}</p>
                                            <div className="d-flex align-items-center justify-content-between">
                                                <span className="fw-bold text-primary-green">₹{product.price}<span className="small fw-normal text-muted">/{product.unit}</span></span>
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="px-3 pb-3">
                                        <button 
                                            onClick={(e) => { e.preventDefault(); addToCart(product); }}
                                            className="btn btn-primary-green w-100 btn-sm rounded-pill fw-bold shadow-sm"
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
            <BottomNav />
        </div>
    );
}

export default function ProductsPage() {
    return (
        <ProtectedRoute allowedRoles={['BUYER', 'FARMER', 'ADMIN']}>
            <ProductsContent />
        </ProtectedRoute>
    );
}
