"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Product } from '@/types';
import { Icon } from '@/components/Icon';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function FarmerProductsContent() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFarmerProducts = () => {
            try {
                // In a real app, API: /api/farmer/products
                // Simulate by reading custom products from localStorage
                const allCustom = JSON.parse(localStorage.getItem('dr_plant_custom_products') || '[]');
                const farmerSpecific = allCustom.filter((p: any) => p.farmer_id === user?.id);
                setProducts(farmerSpecific);
            } catch (err) {
                console.error(err);
                showToast("Failed to load products", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchFarmerProducts();
    }, [user]);

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure you want to delete this listing?")) return;
        try {
            const allCustom = JSON.parse(localStorage.getItem('dr_plant_custom_products') || '[]');
            const updated = allCustom.filter((p: any) => p.id !== id);
            localStorage.setItem('dr_plant_custom_products', JSON.stringify(updated));
            setProducts(prev => prev.filter(p => p.id !== id));
            showToast("Product deleted successfully", "success");
        } catch (err) {
            showToast("Delete failed", "error");
        }
    };

    return (
        <div className="min-vh-100 bg-light pb-5">
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3 d-flex align-items-center justify-content-between mx-auto w-100" style={{ maxWidth: '448px' }}>
                    <div className="d-flex align-items-center gap-3">
                        <button onClick={() => router.back()} className="btn btn-light rounded-circle p-2 border shadow-sm">
                            <Icon name="arrow_back" />
                        </button>
                        <h1 className="h5 mb-0 fw-bold">My Product Listings</h1>
                    </div>
                    <Link href="/farmer/add-product" className="btn btn-primary-green rounded-circle p-2 shadow-sm border">
                        <Icon name="add" />
                    </Link>
                </div>
            </header>

            <main className="p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary-green"></div></div>
                ) : products.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 bg-opacity-10 text-muted" style={{ width: '80px', height: '80px', border: '2px dashed #ccc' }}>
                            <Icon name="inventory_2" className="display-6" />
                        </div>
                        <h2 className="h5 fw-bold mb-2">No products listed</h2>
                        <p className="text-muted small mb-4">Start selling by adding your first product!</p>
                        <Link href="/farmer/add-product" className="btn btn-primary-green rounded-pill px-4 fw-bold shadow-sm">
                            Add First Product
                        </Link>
                    </div>
                ) : (
                    <div className="d-grid gap-3 mb-4">
                        {products.map(product => (
                            <div key={product.id} className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                <div className="d-flex p-3">
                                    <img src={product.image_url} alt={product.name} className="rounded-3 object-fit-cover" style={{ width: '80px', height: '80px' }} />
                                    <div className="ms-3 flex-grow-1">
                                        <div className="d-flex justify-content-between">
                                            <h3 className="h6 fw-bold mb-1">{product.name}</h3>
                                            <div className="d-flex gap-1">
                                                <button onClick={() => handleDelete(product.id)} className="btn btn-link text-danger p-0">
                                                    <Icon name="delete" style={{ fontSize: '18px' }} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="small text-muted mb-2">{product.category}</p>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <span className="fw-bold text-primary-green">₹{product.price}<span className="small fw-normal text-muted">/{product.unit}</span></span>
                                            <span className="badge bg-light text-dark border rounded-pill" style={{ fontSize: '10px' }}>Active</span>
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

export default function FarmerProductsPage() {
    return (
        <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
            <FarmerProductsContent />
        </ProtectedRoute>
    );
}
