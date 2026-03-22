"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/components/common/ToastContext';
import { Icon } from '@/components/ui/Icon';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';

interface Product {
    id: string;
    name: string;
    price: number;
    unit: string;
    category: string;
    image_url: string;
    description?: string;
    stock?: number;
}

function FarmerProductsContent() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editPrice, setEditPrice] = useState('');
    const [editStock, setEditStock] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/products?farmerOnly=true', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || data || []);
            } else {
                // fallback: show empty state
                setProducts([]);
            }
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, [user]);

    const handleDelete = async (product: Product) => {
        if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
        setDeletingId(product.id);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`/api/products/${product.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== product.id));
                showToast("Product removed successfully", "success");
            } else {
                showToast("Could not delete product", "error");
            }
        } catch {
            showToast("Delete failed. Please try again.", "error");
        } finally {
            setDeletingId(null);
        }
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setEditPrice(String(product.price));
        setEditStock(String(product.stock ?? ''));
    };

    const handleSaveEdit = async () => {
        if (!editingProduct) return;
        setSaving(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`/api/products/${editingProduct.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ price: parseFloat(editPrice), stock: parseInt(editStock) || 0 })
            });
            if (res.ok) {
                setProducts(prev => prev.map(p =>
                    p.id === editingProduct.id ? { ...p, price: parseFloat(editPrice), stock: parseInt(editStock) || 0 } : p
                ));
                showToast("Product updated!", "success");
                setEditingProduct(null);
            } else {
                showToast("Update failed", "error");
            }
        } catch {
            showToast("Could not save changes", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-vh-100 bg-light pb-5">
            {/* Header */}
            <header className="sticky-top bg-white border-bottom shadow-sm" style={{ zIndex: 100 }}>
                <div className="p-3 d-flex align-items-center justify-content-between mx-auto w-100" style={{ maxWidth: '480px' }}>
                    <div className="d-flex align-items-center gap-3">
                        <button onClick={() => router.back()} className="btn btn-light rounded-circle border shadow-sm" style={{ width: 38, height: 38, padding: 0 }}>
                            <Icon name="arrow_back" style={{ fontSize: 20 }} />
                        </button>
                        <div>
                            <h1 className="h6 fw-bold mb-0">My Products</h1>
                            <div className="text-muted" style={{ fontSize: 11 }}>{products.length} listing{products.length !== 1 ? 's' : ''}</div>
                        </div>
                    </div>
                    <Link href="/farmer/add-product"
                          className="btn fw-bold d-flex align-items-center gap-1 rounded-pill px-3 py-2"
                          style={{ background: '#2E7D32', color: '#fff', fontSize: 13 }}>
                        <Icon name="add" style={{ fontSize: 18 }} />
                        Add Product
                    </Link>
                </div>
            </header>

            <main className="p-3 mx-auto w-100" style={{ maxWidth: '480px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border" style={{ color: '#2E7D32' }} role="status" />
                        <p className="text-muted small mt-3">Loading your products...</p>
                    </div>
                ) : products.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-5">
                        <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-4"
                             style={{ width: 90, height: 90, background: '#e8f5e9', border: '2px dashed #a5d6a7' }}>
                            <Icon name="inventory_2" style={{ fontSize: 40, color: '#2E7D32' }} />
                        </div>
                        <h2 className="h5 fw-bold mb-2 text-dark">No products yet</h2>
                        <p className="text-muted small mb-4">Add your first product so buyers can find and purchase from you.</p>
                        <Link href="/farmer/add-product"
                              className="btn fw-bold rounded-pill px-5 py-3 shadow-sm"
                              style={{ background: '#2E7D32', color: '#fff' }}>
                            <Icon name="add" className="me-2" />
                            Add My First Product
                        </Link>
                    </div>
                ) : (
                    <div className="d-grid gap-3 mb-4">
                        {products.map(product => (
                            <div key={product.id} className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                <div className="d-flex p-3 gap-3 align-items-start">
                                    {/* Image */}
                                    <div className="rounded-3 overflow-hidden flex-shrink-0 bg-light"
                                         style={{ width: 80, height: 80 }}>
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name}
                                                 className="w-100 h-100 object-fit-cover" />
                                        ) : (
                                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                                                <Icon name="image" style={{ fontSize: 32 }} />
                                            </div>
                                        )}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-grow-1 min-width-0">
                                        <div className="d-flex align-items-start justify-content-between gap-2">
                                            <h3 className="h6 fw-bold mb-1 text-dark"
                                                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                                                {product.name}
                                            </h3>
                                            <span className="badge rounded-pill bg-success-subtle text-success flex-shrink-0"
                                                  style={{ fontSize: 10 }}>Active</span>
                                        </div>
                                        <div className="text-muted mb-2" style={{ fontSize: 12 }}>{product.category}</div>
                                        <div className="fw-bold" style={{ color: '#2E7D32', fontSize: 16 }}>
                                            ₹{product.price}
                                            <span className="text-muted fw-normal" style={{ fontSize: 12 }}>/{product.unit}</span>
                                        </div>
                                        {product.stock !== undefined && (
                                            <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                                                Stock: {product.stock} {product.unit}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Action Buttons */}
                                <div className="border-top d-flex">
                                    <button
                                        onClick={() => openEdit(product)}
                                        className="btn btn-sm flex-fill fw-bold d-flex align-items-center justify-content-center gap-1 py-2 rounded-0"
                                        style={{ color: '#1565c0', background: '#e3f2fd', border: 'none', fontSize: 13 }}>
                                        <Icon name="edit" style={{ fontSize: 15 }} />
                                        Edit Price/Stock
                                    </button>
                                    <div style={{ width: 1, background: '#e0e0e0' }} />
                                    <button
                                        onClick={() => handleDelete(product)}
                                        disabled={deletingId === product.id}
                                        className="btn btn-sm flex-fill fw-bold d-flex align-items-center justify-content-center gap-1 py-2 rounded-0"
                                        style={{ color: '#c62828', background: '#ffebee', border: 'none', fontSize: 13 }}>
                                        {deletingId === product.id
                                            ? <span className="spinner-border spinner-border-sm" />
                                            : <><Icon name="delete" style={{ fontSize: 15 }} />Remove</>
                                        }
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Edit Modal */}
            {editingProduct && (
                <div className="modal d-flex" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', alignItems: 'flex-end' }}>
                    <div className="bg-white rounded-top-4 w-100 p-4 pb-5" style={{ maxWidth: 480, margin: '0 auto' }}>
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h2 className="h6 fw-bold mb-0">Edit: {editingProduct.name}</h2>
                            <button onClick={() => setEditingProduct(null)} className="btn btn-light rounded-circle border" style={{ width: 34, height: 34, padding: 0 }}>
                                <Icon name="close" style={{ fontSize: 18 }} />
                            </button>
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-bold small text-muted">Price (₹ per {editingProduct.unit})</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-0">₹</span>
                                <input
                                    type="number"
                                    className="form-control bg-light border-0 shadow-none fs-5 fw-bold"
                                    value={editPrice}
                                    onChange={e => setEditPrice(e.target.value)}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-muted">Available Stock ({editingProduct.unit})</label>
                            <input
                                type="number"
                                className="form-control bg-light border-0 shadow-none fs-6"
                                value={editStock}
                                onChange={e => setEditStock(e.target.value)}
                                placeholder="e.g. 50"
                                min="0"
                            />
                        </div>
                        <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="btn w-100 py-3 fw-bold rounded-3 shadow-sm"
                            style={{ background: '#2E7D32', color: '#fff' }}>
                            {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}

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
