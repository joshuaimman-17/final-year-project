"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/features/marketplace/context/CartContext';
import { Product } from '@/types';
import { Icon } from '@/components/ui/Icon';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';
import Link from 'next/link';

function ProductDetailPageContent() {
    const { id } = useParams();
    const router = useRouter();
    const { addToCart } = useCart();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // In a real app, we'd have a specific GET /api/products/[id]
                // For now, we fetch all and find the one (simulating API behavior)
                const res = await fetch('/api/products');
                const data: Product[] = await res.json();
                const found = data.find(p => (p.id === id || p._id === id));
                setProduct(found || null);
            } catch (err) {
                console.error("Failed to fetch product", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProduct();
    }, [id]);

    if (loading) {
        return (
            <div className="vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="spinner-border text-primary-green" role="status"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-vh-100 bg-light d-flex flex-column align-items-center justify-content-center p-3">
                <Icon name="error_outline" className="display-1 text-muted mb-3" />
                <h2 className="h4 fw-bold">Product not found</h2>
                <button onClick={() => router.back()} className="btn btn-primary-green rounded-pill px-4 mt-3 fw-bold">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light pb-5">
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3 d-flex align-items-center gap-3" style={{ maxWidth: '448px', margin: '0 auto' }}>
                    <button onClick={() => router.back()} className="btn btn-light rounded-circle p-2 border shadow-sm">
                        <Icon name="arrow_back" />
                    </button>
                    <h1 className="h6 mb-0 fw-bold text-truncate">{product.name}</h1>
                </div>
            </header>

            <main className="mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                <div className="position-relative bg-white shadow-sm overflow-hidden mb-4">
                    <img src={product.image_url} alt={product.name} className="w-100 object-fit-cover" style={{ height: '300px' }} />
                    {product.on_sale && (
                        <span className="position-absolute top-0 start-0 bg-danger text-white px-3 py-2 fw-bold rounded-bottom-end">SALE</span>
                    )}
                </div>

                <div className="px-3">
                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 mt-n5 position-relative bg-white mx-2">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <span className="badge bg-success-subtle text-success rounded-pill mb-2 px-3 fw-bold">{product.category}</span>
                                <h1 className="h4 fw-bold mb-0">{product.name}</h1>
                            </div>
                            <div className="text-end">
                                <p className="h3 fw-bold text-primary-green mb-0">₹{product.price}</p>
                                <p className="small text-muted mb-0">per {product.unit}</p>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 mb-4">
                            <div className="text-warning d-flex align-items-center">
                                <Icon name="star" filled style={{ fontSize: '18px' }} />
                                <span className="ms-1 fw-bold text-dark">{product.rating || '4.5'}</span>
                            </div>
                            <span className="text-muted small">({product.reviews || '28'} reviews)</span>
                        </div>

                        <p className="text-muted small mb-4">
                            Fresh, high-quality {product.name.toLowerCase()} sourced directly from certified organic farms. 
                            Our products are harvested at peak ripeness to ensure maximum nutritional value and taste.
                        </p>

                        <div className="d-grid">
                            <button 
                                onClick={() => addToCart(product)}
                                className="btn btn-primary-green btn-lg rounded-pill fw-bold shadow-lg py-3 d-flex align-items-center justify-content-center gap-2"
                            >
                                <Icon name="shopping_cart" />
                                Add to Cart
                            </button>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                        <h2 className="h6 fw-bold mb-3">Product Details</h2>
                        <ul className="list-unstyled small d-grid gap-2 mb-0">
                            <li className="d-flex justify-content-between">
                                <span className="text-muted">Origin</span>
                                <span className="fw-bold">Dream Valley Farm</span>
                            </li>
                            <li className="d-flex justify-content-between">
                                <span className="text-muted">Shelf Life</span>
                                <span className="fw-bold">5-7 Days</span>
                            </li>
                            <li className="d-flex justify-content-between">
                                <span className="text-muted">Packaging</span>
                                <span className="fw-bold">Eco-friendly Box</span>
                            </li>
                            <li className="d-flex justify-content-between">
                                <span className="text-muted">Quality</span>
                                <span className="fw-bold">A+ Grade</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
            <BottomNav />
        </div>
    );
}

export default function ProductDetailPage() {
    return (
        <ProtectedRoute>
            <ProductDetailPageContent />
        </ProtectedRoute>
    );
}
