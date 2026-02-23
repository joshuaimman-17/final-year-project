"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Product } from '@/types';
import { Icon } from '@/components/Icon';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';

function MarketplaceContent() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        api.products.list()
            .then((data: any) => {
                if (Array.isArray(data)) {
                    setProducts(data);
                } else {
                    setProducts([]);
                }
            })
            .catch((e) => {
                console.error("Failed to fetch products", e);
                setError(true);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-vh-100 d-flex flex-column pb-5 bg-light">
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3">
                    <div className="d-flex align-items-center justify-content-between" style={{ maxWidth: '448px', margin: '0 auto' }}>
                        <button className="btn btn-link text-dark p-0">
                            <Icon name="menu" className="fs-4" />
                        </button>
                        <h1 className="h5 mb-0 fw-bold tracking-tight">Marketplace</h1>
                        <button className="btn btn-link text-dark p-0 position-relative">
                            <Icon name="shopping_cart" className="fs-4" />
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>0</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container-fluid p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary-green" role="status"></div>
                        <p className="text-muted mt-2 small">Inventory loading...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-5 glass-morphism rounded-4 p-4 border">
                        <Icon name="cloud_off" className="display-4 text-muted mb-3 d-block mx-auto" />
                        <p className="text-muted fw-medium">Could not load products</p>
                        <button onClick={() => window.location.reload()} className="btn btn-primary-green rounded-pill px-4 mt-2 shadow-sm">
                            Retry
                        </button>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-5 glass-morphism rounded-4 p-4 border">
                        <Icon name="storefront" className="display-4 text-muted mb-3 d-block mx-auto opacity-50" />
                        <p className="fw-bold text-dark mb-1">No products yet</p>
                        <p className="text-muted small">Our shop is being stocked. Check back soon!</p>
                    </div>
                ) : (
                    <div className="row row-cols-2 g-2">
                        {products.map((product) => (
                            <div key={product._id} className="col">
                                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-scale transition-all">
                                    <div className="position-relative bg-light" style={{ aspectRatio: '1/1' }}>
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-100 h-100 object-fit-cover" />
                                        ) : (
                                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted opacity-25">
                                                <Icon name="image" className="display-4" />
                                            </div>
                                        )}
                                        {product.on_sale && (
                                            <span className="position-absolute top-0 start-0 m-2 badge bg-danger fw-bold border border-white shadow-sm" style={{ fontSize: '9px' }}>
                                                OFFER
                                            </span>
                                        )}
                                    </div>
                                    <div className="card-body p-2 d-flex flex-column">
                                        <h3 className="h6 mb-2 text-dark fw-bold text-truncate-2" style={{ height: '2.5rem', overflow: 'hidden', fontSize: '0.85rem' }}>{product.name}</h3>
                                        <div className="mt-auto d-flex align-items-center justify-content-between">
                                            <p className="h6 fw-bold text-primary-green mb-0">${product.price.toFixed(2)}</p>
                                            <button className="btn btn-primary-green btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm hover-scale" style={{ width: '28px', height: '28px' }}>
                                                <Icon name="add" style={{ fontSize: '16px' }} />
                                            </button>
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

export default function MarketplacePage() {
    return (
        <ProtectedRoute>
            <MarketplaceContent />
        </ProtectedRoute>
    );
}
