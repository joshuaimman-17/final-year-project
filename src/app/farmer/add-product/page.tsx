"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';

function AddProductContent() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'Vegetables',
        unit: 'kg',
        image_url: 'https://images.unsplash.com/photo-1566385101042-1a000c1268c4?w=500&auto=format&fit=crop',
        description: ''
    });
    
    const [submitting, setSubmitting] = useState(false);

    const categories = ['Vegetables', 'Fruits', 'Grains', 'Seeds', 'Dairy', 'Organic Fertilizer'];
    const units = ['kg', 'g', 'quintal', 'ton', 'litre', 'bunch', 'piece'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // In a real app, this would be: await api.products.create({ ...formData, farmerId: user.id })
            // Simulate saving to database/localStorage
            const products = JSON.parse(localStorage.getItem('dr_plant_custom_products') || '[]');
            const newProduct = {
                id: Math.random().toString(36).substr(2, 9),
                ...formData,
                price: parseFloat(formData.price),
                createdAt: new Date().toISOString(),
                farmer_id: user?.id,
                farmer_name: user?.full_name
            };
            localStorage.setItem('dr_plant_custom_products', JSON.stringify([newProduct, ...products]));
            
            showToast("Product listed successfully!", "success");
            router.push('/farmer/products');
        } catch (err) {
            console.error(err);
            showToast("Failed to add product", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-vh-100 bg-light pb-5">
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3 d-flex align-items-center gap-3" style={{ maxWidth: '448px', margin: '0 auto' }}>
                    <button onClick={() => router.back()} className="btn btn-light rounded-circle p-2 border shadow-sm">
                        <Icon name="arrow_back" />
                    </button>
                    <h1 className="h5 mb-0 fw-bold">Add New Product</h1>
                </div>
            </header>

            <main className="p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                <form onSubmit={handleSubmit} className="d-grid gap-4 mb-4">
                    {/* Basic Info */}
                    <div className="card border-0 shadow-sm rounded-4 p-4">
                        <h2 className="h6 fw-bold mb-4 d-flex align-items-center gap-2">
                            <Icon name="info" className="text-primary" />
                            General Information
                        </h2>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">Product Name</label>
                            <input 
                                required 
                                type="text" 
                                className="form-control rounded-3" 
                                placeholder="e.g. Fresh Red Tomatoes" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">Description</label>
                            <textarea 
                                className="form-control rounded-3" 
                                rows={3} 
                                placeholder="Describe your product's quality, harvest date, etc."
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            ></textarea>
                        </div>
                    </div>

                    {/* Pricing & Category */}
                    <div className="card border-0 shadow-sm rounded-4 p-4">
                        <h2 className="h6 fw-bold mb-4 d-flex align-items-center gap-2">
                            <Icon name="payments" className="text-success" />
                            Pricing & Category
                        </h2>
                        <div className="row g-3">
                            <div className="col-6">
                                <label className="form-label small fw-bold text-muted">Category</label>
                                <select 
                                    className="form-select rounded-3"
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="col-6">
                                <label className="form-label small fw-bold text-muted">Unit</label>
                                <select 
                                    className="form-select rounded-3"
                                    value={formData.unit}
                                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                                >
                                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div className="col-12">
                                <label className="form-label small fw-bold text-muted">Price (₹ per unit)</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">₹</span>
                                    <input 
                                        required 
                                        type="number" 
                                        className="form-control rounded-end-3 border-start-0" 
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image */}
                    <div className="card border-0 shadow-sm rounded-4 p-4">
                        <h2 className="h6 fw-bold mb-4 d-flex align-items-center gap-2">
                            <Icon name="image" className="text-warning" />
                            Product Image
                        </h2>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">Image URL (Optional)</label>
                            <input 
                                type="text" 
                                className="form-control rounded-3" 
                                placeholder="Paste an image URL" 
                                value={formData.image_url}
                                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                            />
                        </div>
                        <div className="bg-light rounded-4 overflow-hidden border border-dashed text-center d-flex align-items-center justify-content-center" style={{ height: '160px' }}>
                            {formData.image_url ? (
                                <img src={formData.image_url} alt="Preview" className="w-100 h-100 object-fit-cover" />
                            ) : (
                                <div className="text-muted small">
                                    <Icon name="add_a_photo" className="display-6 mb-2" />
                                    <p>Image Preview</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={submitting} 
                        className="btn btn-primary-green btn-lg rounded-pill fw-bold shadow-lg py-3 mb-4"
                    >
                        {submitting ? 'Publishing...' : 'List Product For Sale'}
                    </button>
                </form>
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
