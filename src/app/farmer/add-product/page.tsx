"use client";

import React, { useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/components/common/ToastContext';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { BottomNav } from '@/components/common/BottomNav';
import { auth } from '@/lib/firebase';

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Seeds', 'Dairy', 'Organic Fertilizer', 'Spices', 'Other'];
const UNITS = ['kg', 'gram (g)', 'quintal', 'ton', 'litre', 'bunch', 'piece'];

function AddProductContent() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [step, setStep] = useState(1); // multi-step form
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Vegetables',
        description: '',
        price: '',
        unit: 'kg',
        stock: '',
        image_url: ''
    });

    const update = (key: string, value: string) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        if (!formData.name || !formData.price) {
            showToast("Please fill in the product name and price.", "error");
            return;
        }
        setSubmitting(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const payload = {
                name: formData.name.trim(),
                category: formData.category,
                description: formData.description.trim(),
                price: parseFloat(formData.price),
                unit: formData.unit.split(' ')[0], // strip "(g)" etc
                stock: parseInt(formData.stock) || 0,
                image_url: formData.image_url.trim() || '',
                farmer_id: user?.id,
                farmer_name: user?.full_name,
                farm_name: user?.farm_name || ''
            };
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showToast("Product listed successfully! 🎉", "success");
                router.push('/farmer/products');
            } else {
                const err = await res.json().catch(() => ({}));
                showToast(err.message || "Could not list product. Try again.", "error");
            }
        } catch {
            showToast("Failed to add product. Check your connection.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // Step 1: What are you selling?
    // Step 2: Price & Stock
    // Step 3: Photo (optional)

    return (
        <div className="min-vh-100 bg-light pb-5">
            {/* Header */}
            <header className="sticky-top bg-white border-bottom shadow-sm" style={{ zIndex: 100 }}>
                <div className="p-3 d-flex align-items-center gap-3 mx-auto w-100" style={{ maxWidth: '480px' }}>
                    <button onClick={() => step > 1 ? setStep(step - 1) : router.back()}
                            className="btn btn-light rounded-circle border shadow-sm" style={{ width: 38, height: 38, padding: 0 }}>
                        <Icon name="arrow_back" style={{ fontSize: 20 }} />
                    </button>
                    <div className="flex-grow-1">
                        <h1 className="h6 fw-bold mb-0">Add New Product</h1>
                        <div className="text-muted" style={{ fontSize: 11 }}>Step {step} of 3</div>
                    </div>
                    {/* Step Progress */}
                    <div className="d-flex gap-1">
                        {[1,2,3].map(s => (
                            <div key={s} style={{
                                width: s === step ? 20 : 8, height: 8,
                                borderRadius: 4,
                                background: s <= step ? '#2E7D32' : '#e0e0e0',
                                transition: 'all 0.3s ease'
                            }} />
                        ))}
                    </div>
                </div>
            </header>

            <main className="p-3 mx-auto w-100" style={{ maxWidth: '480px' }}>

                {/* ─── STEP 1: Basic Info ─── */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <div className="rounded-4 p-3 mb-4" style={{ background: '#e8f5e9' }}>
                            <div className="d-flex align-items-center gap-2">
                                <Icon name="inventory_2" style={{ color: '#2E7D32', fontSize: 22 }} />
                                <div>
                                    <div className="fw-bold text-dark" style={{ fontSize: 14 }}>Step 1: What are you selling?</div>
                                    <div className="text-muted" style={{ fontSize: 12 }}>Give your product a clear name and description</div>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-3">
                            <div className="mb-4">
                                <label className="form-label fw-bold text-dark mb-1">
                                    Product Name <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg bg-light border-0 shadow-none rounded-3"
                                    placeholder="e.g.  Fresh Red Tomatoes"
                                    value={formData.name}
                                    onChange={e => update('name', e.target.value)}
                                    maxLength={80}
                                    autoFocus
                                />
                                <div className="text-muted mt-1" style={{ fontSize: 11 }}>Use a simple, clear name buyers can easily search for</div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold text-dark mb-1">Category</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {CATEGORIES.map(cat => (
                                        <button key={cat} type="button"
                                                onClick={() => update('category', cat)}
                                                className="btn btn-sm rounded-pill fw-bold"
                                                style={{
                                                    background: formData.category === cat ? '#2E7D32' : '#f5f5f5',
                                                    color: formData.category === cat ? '#fff' : '#555',
                                                    border: 'none',
                                                    fontSize: 12
                                                }}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-2">
                                <label className="form-label fw-bold text-dark mb-1">Description <span className="text-muted fw-normal">(optional)</span></label>
                                <textarea
                                    className="form-control bg-light border-0 shadow-none rounded-3"
                                    rows={3}
                                    placeholder="e.g. Freshly harvested, organic, no pesticides. Available in bulk."
                                    value={formData.description}
                                    onChange={e => update('description', e.target.value)}
                                    maxLength={300}
                                />
                                <div className="text-end text-muted" style={{ fontSize: 10 }}>{formData.description.length}/300</div>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!formData.name.trim()}
                            className="btn w-100 py-3 fw-bold rounded-3 shadow-sm"
                            style={{ background: formData.name.trim() ? '#2E7D32' : '#ccc', color: '#fff', fontSize: 15 }}>
                            Next: Set Price & Stock →
                        </button>
                    </div>
                )}

                {/* ─── STEP 2: Pricing ─── */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <div className="rounded-4 p-3 mb-4" style={{ background: '#fff8e1' }}>
                            <div className="d-flex align-items-center gap-2">
                                <Icon name="currency_rupee" style={{ color: '#e65100', fontSize: 22 }} />
                                <div>
                                    <div className="fw-bold text-dark" style={{ fontSize: 14 }}>Step 2: Price & Stock</div>
                                    <div className="text-muted" style={{ fontSize: 12 }}>Set your selling price and available quantity</div>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-3">
                            {/* Unit */}
                            <div className="mb-4">
                                <label className="form-label fw-bold text-dark mb-2">Sold by (Unit)</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {UNITS.map(u => (
                                        <button key={u} type="button"
                                                onClick={() => update('unit', u)}
                                                className="btn btn-sm rounded-pill fw-bold"
                                                style={{
                                                    background: formData.unit === u ? '#2E7D32' : '#f5f5f5',
                                                    color: formData.unit === u ? '#fff' : '#555',
                                                    border: 'none',
                                                    fontSize: 12
                                                }}>
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                <label className="form-label fw-bold text-dark mb-1">
                                    Price per {formData.unit.split(' ')[0]} <span className="text-danger">*</span>
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text fw-bold bg-light border-0 fs-5">₹</span>
                                    <input
                                        type="number"
                                        className="form-control form-control-lg bg-light border-0 shadow-none fw-bold"
                                        placeholder="0"
                                        value={formData.price}
                                        onChange={e => update('price', e.target.value)}
                                        min="0"
                                        step="0.5"
                                    />
                                </div>
                                <div className="text-muted mt-1" style={{ fontSize: 11 }}>Check local market rates before setting price</div>
                            </div>

                            {/* Stock */}
                            <div className="mb-2">
                                <label className="form-label fw-bold text-dark mb-1">
                                    Available Stock ({formData.unit.split(' ')[0]}) <span className="text-muted fw-normal">(optional)</span>
                                </label>
                                <input
                                    type="number"
                                    className="form-control bg-light border-0 shadow-none rounded-3"
                                    placeholder="e.g. 100"
                                    value={formData.stock}
                                    onChange={e => update('stock', e.target.value)}
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        {formData.price && (
                            <div className="rounded-3 border p-3 mb-3 d-flex align-items-center justify-content-between"
                                 style={{ background: '#f9fbe7' }}>
                                <span className="text-muted small">Your listing will show:</span>
                                <span className="fw-bold fs-5" style={{ color: '#2E7D32' }}>
                                    ₹{formData.price}
                                    <span className="text-muted fw-normal" style={{ fontSize: 13 }}>/{formData.unit.split(' ')[0]}</span>
                                </span>
                            </div>
                        )}

                        <button
                            onClick={() => setStep(3)}
                            disabled={!formData.price}
                            className="btn w-100 py-3 fw-bold rounded-3 shadow-sm"
                            style={{ background: formData.price ? '#2E7D32' : '#ccc', color: '#fff', fontSize: 15 }}>
                            Next: Add a Photo →
                        </button>
                    </div>
                )}

                {/* ─── STEP 3: Photo (optional) ─── */}
                {step === 3 && (
                    <div className="animate-fade-in">
                        <div className="rounded-4 p-3 mb-4" style={{ background: '#e8eaf6' }}>
                            <div className="d-flex align-items-center gap-2">
                                <Icon name="add_a_photo" style={{ color: '#283593', fontSize: 22 }} />
                                <div>
                                    <div className="fw-bold text-dark" style={{ fontSize: 14 }}>Step 3: Add a Photo</div>
                                    <div className="text-muted" style={{ fontSize: 12 }}>Products with photos get 3× more buyers</div>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-3">
                            <div className="mb-3">
                                <label className="form-label fw-bold text-dark mb-1">Image Link <span className="text-muted fw-normal">(optional)</span></label>
                                <input
                                    type="url"
                                    className="form-control bg-light border-0 shadow-none rounded-3"
                                    placeholder="https://..."
                                    value={formData.image_url}
                                    onChange={e => update('image_url', e.target.value)}
                                />
                                <div className="text-muted mt-1" style={{ fontSize: 11 }}>Paste a link to your product photo from Google or any website</div>
                            </div>

                            {/* Preview */}
                            <div className="rounded-3 overflow-hidden d-flex align-items-center justify-content-center"
                                 style={{ height: 160, background: '#f5f5f5', border: '2px dashed #ccc' }}>
                                {formData.image_url ? (
                                    <img src={formData.image_url} alt="Preview" className="w-100 h-100 object-fit-cover" />
                                ) : (
                                    <div className="text-center text-muted">
                                        <Icon name="image" style={{ fontSize: 48, opacity: 0.3 }} />
                                        <p className="small mt-2 mb-0">Photo preview will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-3" style={{ background: '#f9fbe7' }}>
                            <h3 className="h6 fw-bold mb-3 text-dark">📋 Review Before Submitting</h3>
                            <div className="d-grid gap-1" style={{ fontSize: 13 }}>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Product</span>
                                    <span className="fw-bold text-dark">{formData.name}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Category</span>
                                    <span className="fw-bold text-dark">{formData.category}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Price</span>
                                    <span className="fw-bold" style={{ color: '#2E7D32' }}>₹{formData.price}/{formData.unit.split(' ')[0]}</span>
                                </div>
                                {formData.stock && (
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">Stock</span>
                                        <span className="fw-bold text-dark">{formData.stock} {formData.unit.split(' ')[0]}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="btn w-100 py-3 fw-bold rounded-3 shadow-sm"
                            style={{ background: '#2E7D32', color: '#fff', fontSize: 15 }}>
                            {submitting
                                ? <><span className="spinner-border spinner-border-sm me-2" />Publishing...</>
                                : <><Icon name="check_circle" className="me-2" />Publish Product Listing</>
                            }
                        </button>
                        <p className="text-center text-muted mt-2" style={{ fontSize: 11 }}>
                            Your product will be visible to buyers right away
                        </p>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
}

export default function AddProductPage() {
    return (
        <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
            <AddProductContent />
        </ProtectedRoute>
    );
}
