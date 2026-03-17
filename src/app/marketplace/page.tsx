"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Icon } from '@/components/Icon';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { MarketListing, BuyerRequest, MandiPrice } from '@/types';
import dynamic from 'next/dynamic';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const FarmMap = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <div className="bg-light animate-pulse h-100 w-100 rounded-4" />
});

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
    const { user, detectLocation } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'sell' | 'buyers'>('dashboard');
    
    // State
    const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
    const [buyerRequests, setBuyerRequests] = useState<BuyerRequest[]>([]);
    const [mandiPrices, setMandiPrices] = useState<MandiPrice[]>([]);
    const [locationName, setLocationName] = useState<string>("Detecting nearby markets...");
    const [loading, setLoading] = useState(true);

    // Search & Sort State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'avg' | 'name'>('avg');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // My Listings Filter
    const [showOnlyMyListings, setShowOnlyMyListings] = useState(false);

    // Form State (Sell Produce)
    const [sellForm, setSellForm] = useState({ crop_name: '', quantity: '', price: '', location: '', contact: '' });
    const [isSelling, setIsSelling] = useState(false);

    // Form State (Buyer Request)
    const [buyerForm, setBuyerForm] = useState({ buyer_name: '', crop_name: '', quantity: '', offered_price: '', location: '', contact: '' });
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        fetchData();
        fetchLocation();
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [listings, requests, prices] = await Promise.all([
                api.marketListings.list().catch(() => []),
                api.buyerRequests.list().catch(() => []),
                api.marketPrices.list().catch(() => [])
            ]);
            setMarketListings(listings);
            setBuyerRequests(requests);
            setMandiPrices(prices);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchLocation = async () => {
        if (!user || (!user.latitude && !user.longitude)) {
            detectLocation?.();
            return;
        }
        try {
            const name = await api.reverseGeocode(user.latitude, user.longitude);
            setLocationName(name);
        } catch (e) {
            setLocationName("Regional Markets");
        }
    };

    const handleSellSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSelling(true);
        try {
            const payload = { ...sellForm, location: sellForm.location || locationName };
            await api.marketListings.create(payload);
            setSellForm({ crop_name: '', quantity: '', price: '', location: '', contact: '' });
            showToast("Listing posted successfully!", "success");
            fetchData();
        } catch (e) {
            showToast("Failed to post listing.", "error");
            console.error(e);
        } finally {
            setIsSelling(false);
        }
    };

    const handleBuyerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsRequesting(true);
        try {
            const payload = { ...buyerForm, location: buyerForm.location || locationName };
            await api.buyerRequests.create(payload);
            setBuyerForm({ buyer_name: '', crop_name: '', quantity: '', offered_price: '', location: '', contact: '' });
            showToast("Request posted successfully!", "success");
            fetchData();
        } catch (e) {
            showToast("Failed to post request.", "error");
            console.error(e);
        } finally {
            setIsRequesting(false);
        }
    };

    const handleDeleteListing = async (id: string) => {
        if (!confirm("Are you sure you want to delete this listing?")) return;
        try {
            await api.marketListings.delete(id);
            setMarketListings(prev => prev.filter(l => l.id !== id));
            showToast("Listing deleted.", "success");
        } catch (e) {
            showToast("Delete failed.", "error");
        }
    };

    const handleDeleteRequest = async (id: string) => {
        if (!confirm("Are you sure you want to delete this buyer request?")) return;
        try {
            await api.buyerRequests.delete(id);
            setBuyerRequests(prev => prev.filter(r => r.id !== id));
            showToast("Request deleted.", "success");
        } catch (e) {
            showToast("Delete failed.", "error");
        }
    };

    const filteredCropPrices = mandiPrices.filter((crop: MandiPrice) => 
        (crop.crop || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (crop.market || '').toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a: MandiPrice, b: MandiPrice) => {
        const factor = sortOrder === 'asc' ? 1 : -1;
        if (sortBy === 'name') return (a.crop || '').localeCompare(b.crop || '') * factor;
        const avgA = a.avg_price || 0;
        const avgB = b.avg_price || 0;
        return (avgA - avgB) * factor;
    });

    const displayListings = showOnlyMyListings 
        ? marketListings.filter(l => l.user_id === (user?.id || user?.phoneNumber))
        : marketListings;

    const displayRequests = showOnlyMyListings
        ? buyerRequests.filter(r => r.contact === user?.phoneNumber) // Approximation for "My"
        : buyerRequests;

    const chartData = [
        { day: 'Mon', Rice: 2100, Tomato: 900, Wheat: 1800 },
        { day: 'Tue', Rice: 2150, Tomato: 950, Wheat: 1820 },
        { day: 'Wed', Rice: 2120, Tomato: 1100, Wheat: 1810 },
        { day: 'Thu', Rice: 2200, Tomato: 1050, Wheat: 1850 },
        { day: 'Fri', Rice: 2250, Tomato: 1150, Wheat: 1860 },
        { day: 'Sat', Rice: 2220, Tomato: 1200, Wheat: 1880 },
        { day: 'Sun', Rice: 2300, Tomato: 1180, Wheat: 1900 },
    ];

    return (
        <div className="min-vh-100 d-flex flex-column pb-5 bg-light">
            <header className="sticky-top bg-white border-bottom shadow-sm z-3">
                <div className="p-3">
                    <div className="d-flex align-items-center justify-content-between mb-3" style={{ maxWidth: '448px', margin: '0 auto' }}>
                        <h1 className="h5 mb-0 fw-bold tracking-tight text-primary-green d-flex align-items-center gap-2">
                            <Icon name="storefront" /> 
                            AgriMarket
                        </h1>
                        <div className="badge bg-light text-dark border d-flex align-items-center gap-1">
                            <Icon name="location_on" style={{ fontSize: '12px' }} />
                            {locationName}
                        </div>
                    </div>
                    {/* TABS */}
                    <div className="d-flex gap-2 overflow-auto hide-scrollbar" style={{ maxWidth: '448px', margin: '0 auto' }}>
                        <button onClick={() => setActiveTab('dashboard')} className={`btn btn-sm rounded-pill fw-bold px-3 ${activeTab === 'dashboard' ? 'btn-primary-green' : 'btn-light text-muted border'}`}>
                            Dashboard
                        </button>
                        <button onClick={() => setActiveTab('sell')} className={`btn btn-sm rounded-pill fw-bold px-3 ${activeTab === 'sell' ? 'btn-primary-green' : 'btn-light text-muted border'}`}>
                            Sell Produce
                        </button>
                        <button onClick={() => setActiveTab('buyers')} className={`btn btn-sm rounded-pill fw-bold px-3 ${activeTab === 'buyers' ? 'btn-warning text-dark' : 'btn-light text-muted border'}`}>
                            Buyer Requests
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow-1 p-3 mx-auto w-100 animate-fade-in" style={{ maxWidth: '448px' }}>
                
                {activeTab === 'dashboard' && (
                    <div className="animate-fade-in">
                        <section className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                            <div className="p-3 bg-white d-flex align-items-center justify-content-between">
                                <h2 className="h6 fw-bold mb-0 d-flex align-items-center gap-2">
                                    <Icon name="map" className="text-secondary" />
                                    Nearby Markets Map
                                </h2>
                                <button className="btn btn-sm btn-light border py-1 rounded-pill" style={{ fontSize: '11px' }}>Full Map</button>
                            </div>
                            <div style={{ height: '140px' }} className="position-relative">
                                <FarmMap lat={user?.latitude || 20.5937} lon={user?.longitude || 78.9629} isLive={true} showMarkers={[]} onRecenter={() => {}} />
                            </div>
                        </section>

                        <section className="card border-0 shadow-sm rounded-4 p-3 mb-4">
                            <h2 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
                                <Icon name="trending_up" className="text-primary" />
                                7-Day Price Trends (₹/Quintal)
                            </h2>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6c757d' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6c757d' }} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Line type="monotone" dataKey="Rice" stroke="#28a745" strokeWidth={3} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="Tomato" stroke="#dc3545" strokeWidth={3} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="Wheat" stroke="#ffc107" strokeWidth={3} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                            <div className="p-3 bg-light border-bottom">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h2 className="h6 fw-bold mb-0">Today's Mandi Prices</h2>
                                    <div className="d-flex gap-2">
                                        <button onClick={() => { setSortBy('avg'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }} className="btn btn-sm btn-white border px-2 py-0" style={{ fontSize: '11px' }}>
                                            Price {sortBy === 'avg' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </button>
                                        <button onClick={() => { setSortBy('name'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }} className="btn btn-sm btn-white border px-2 py-0" style={{ fontSize: '11px' }}>
                                            A-Z {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-pill px-3 py-1 border d-flex align-items-center gap-2">
                                    <Icon name="search" style={{ fontSize: '14px', color: '#888' }} />
                                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} type="text" className="form-control form-control-sm border-0 shadow-none p-0" placeholder="Search crops or markets..." style={{ fontSize: '12px' }} />
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                                    <thead className="table-light">
                                        <tr>
                                            <th className="fw-semibold text-muted py-3 px-3">Crop & Market</th>
                                            <th className="fw-semibold text-muted py-3 text-end">Min/Max</th>
                                            <th className="fw-semibold text-muted py-3 px-3 text-end">Avg (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCropPrices.map((crop: MandiPrice) => (
                                            <tr key={crop.id}>
                                                <td className="px-3 py-3">
                                                    <div className="fw-bold text-dark">{crop.crop}</div>
                                                    <div className="small text-muted d-flex align-items-center gap-1 mt-1">
                                                        <Icon name="store" style={{ fontSize: '12px' }} />
                                                        {crop.market}
                                                    </div>
                                                </td>
                                                <td className="text-end py-3 text-muted">
                                                    ₹{crop.min_price} - ₹{crop.max_price}
                                                </td>
                                                <td className="px-3 py-3 text-end">
                                                    <div className="fw-bold d-flex align-items-center justify-content-end gap-1">
                                                        ₹{crop.avg_price}
                                                        <Icon name="trending_flat" className="text-muted" style={{ fontSize: '14px' }} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="mb-4">
                            <h2 className="h6 fw-bold mb-3 d-flex justify-content-between align-items-center">
                                Nearby Farmer Listings
                                <span className="badge bg-primary-green bg-opacity-10 text-primary-green">{marketListings.length} items</span>
                            </h2>
                            {loading ? (
                                <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary-green"></div></div>
                            ) : marketListings.length === 0 ? (
                                <div className="text-center p-4 bg-white rounded-4 border border-dashed text-muted small">No recent local listings found. Be the first to sell!</div>
                            ) : (
                                <div className="d-grid gap-3">
                                    {marketListings.slice(0, 5).map(listing => (
                                        <div key={listing.id} className="card border-0 shadow-sm rounded-4 p-3 hover-scale">
                                            <div className="d-flex justify-content-between">
                                                <div>
                                                    <h3 className="h6 fw-bold mb-1 text-dark">{listing.crop_name}</h3>
                                                    <p className="small text-muted mb-2 d-flex align-items-center gap-1">
                                                        <Icon name="scale" style={{ fontSize: '14px' }}/> {listing.quantity} kg
                                                    </p>
                                                </div>
                                                <div className="text-end">
                                                    <p className="fw-bold h5 text-primary-green mb-0">₹{listing.price}<span className="small text-muted fw-normal">/kg</span></p>
                                                    <span className="small text-muted" style={{ fontSize: '10px' }}>{timeAgo(listing.created_at)}</span>
                                                </div>
                                            </div>
                                            <div className="d-flex pt-2 mt-2 border-top justify-content-between align-items-center">
                                                <p className="small text-muted mb-0 d-flex align-items-center gap-1">
                                                    <Icon name="location_on" style={{ fontSize: '14px' }}/> {listing.location}
                                                </p>
                                                <button className="btn btn-sm btn-outline-primary-green rounded-pill px-3 shadow-sm py-1">Contact</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* SELL TAB */}
                {activeTab === 'sell' && (
                    <div className="animate-fade-in">
                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                            <div className="text-center mb-4">
                                <div className="d-inline-flex bg-primary-green bg-opacity-10 text-primary-green p-3 rounded-circle mb-2">
                                    <Icon name="agriculture" className="fs-3" />
                                </div>
                                <h2 className="h5 fw-bold mb-1">List Your Produce</h2>
                                <p className="small text-muted">Connect directly with buyers in your region.</p>
                            </div>
                            
                            <form onSubmit={handleSellSubmit} className="d-flex flex-column gap-3">
                                <div>
                                    <label className="form-label small fw-bold text-muted">Crop Name</label>
                                    <input required value={sellForm.crop_name} onChange={e => setSellForm({...sellForm, crop_name: e.target.value})} type="text" className="form-control rounded-3" placeholder="e.g. Organic Tomatoes" />
                                </div>
                                <div className="row g-2">
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted">Quantity (kg/ton)</label>
                                        <input required value={sellForm.quantity} onChange={e => setSellForm({...sellForm, quantity: e.target.value})} type="number" className="form-control rounded-3" placeholder="Qty" />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted">Price (₹ per kg)</label>
                                        <input required value={sellForm.price} onChange={e => setSellForm({...sellForm, price: e.target.value})} type="number" className="form-control rounded-3" placeholder="₹ Price" />
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label small fw-bold text-muted">Contact Info (Phone/Email)</label>
                                    <input required value={sellForm.contact} onChange={e => setSellForm({...sellForm, contact: e.target.value})} type="text" className="form-control rounded-3" placeholder="Your mobile number" />
                                </div>
                                <button type="submit" disabled={isSelling} className="btn btn-primary-green w-100 py-3 rounded-3 mt-2 fw-bold shadow">
                                    {isSelling ? "Posting..." : "Post Listing for Sale"}
                                </button>
                            </form>
                        </div>

                        <div className="d-flex align-items-center justify-content-between mb-3 px-1">
                            <h2 className="h6 fw-bold mb-0">Your Active Listings</h2>
                            <div className="form-check form-switch small">
                                <input className="form-check-input" type="checkbox" checked={showOnlyMyListings} onChange={e => setShowOnlyMyListings(e.target.checked)} />
                                <label className="form-check-label text-muted">My Lists Only</label>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary-green"></div></div>
                        ) : displayListings.length === 0 ? (
                            <div className="text-center p-4 bg-white rounded-4 border border-dashed text-muted small">
                                {showOnlyMyListings ? "You haven't posted any listings yet." : "No listings available."}
                            </div>
                        ) : (
                            <div className="d-grid gap-3">
                                {displayListings.map(listing => (
                                    <div key={listing.id} className="card border-0 shadow-sm rounded-4 p-3">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <h3 className="h6 fw-bold mb-1 text-dark">{listing.crop_name}</h3>
                                                <p className="small text-muted mb-0">{listing.quantity} kg @ ₹{listing.price}/kg</p>
                                                <span className="small text-muted" style={{ fontSize: '10px' }}>{timeAgo(listing.created_at)}</span>
                                            </div>
                                            {listing.user_id === (user?.id || user?.phoneNumber) && (
                                                <button onClick={() => handleDeleteListing(listing.id)} className="btn btn-sm btn-light text-danger p-1 rounded-circle">
                                                    <Icon name="delete" style={{ fontSize: '18px' }} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* BUYERS TAB */}
                {activeTab === 'buyers' && (
                    <div className="animate-fade-in">
                         <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-warning bg-opacity-10 border border-warning border-opacity-25">
                            <h2 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
                                <Icon name="campaign" className="text-warning text-darken" />
                                Post a Buyer Request
                            </h2>
                            <form onSubmit={handleBuyerSubmit} className="d-flex flex-column gap-3">
                                <div className="row g-2">
                                    <div className="col-6">
                                        <input required value={buyerForm.buyer_name} onChange={e => setBuyerForm({...buyerForm, buyer_name: e.target.value})} type="text" className="form-control form-control-sm rounded-3" placeholder="Buyer Name" />
                                    </div>
                                    <div className="col-6">
                                        <input required value={buyerForm.crop_name} onChange={e => setBuyerForm({...buyerForm, crop_name: e.target.value})} type="text" className="form-control form-control-sm rounded-3" placeholder="Crop (e.g. Onion)" />
                                    </div>
                                </div>
                                <div className="row g-2">
                                    <div className="col-4">
                                        <input required value={buyerForm.quantity} onChange={e => setBuyerForm({...buyerForm, quantity: e.target.value})} type="number" className="form-control form-control-sm rounded-3" placeholder="Qty" />
                                    </div>
                                    <div className="col-4">
                                        <input value={buyerForm.offered_price} onChange={e => setBuyerForm({...buyerForm, offered_price: e.target.value})} type="number" className="form-control form-control-sm rounded-3" placeholder="₹" />
                                    </div>
                                    <div className="col-4">
                                        <input required value={buyerForm.contact} onChange={e => setBuyerForm({...buyerForm, contact: e.target.value})} type="text" className="form-control form-control-sm rounded-3" placeholder="Ph" />
                                    </div>
                                </div>
                                <button type="submit" disabled={isRequesting} className="btn btn-warning btn-sm w-100 fw-bold shadow-sm">
                                    {isRequesting ? "Submitting..." : "Submit Requirement"}
                                </button>
                            </form>
                        </div>

                        <div className="d-flex align-items-center justify-content-between mb-3 px-1">
                            <h2 className="h6 fw-bold mb-0">Live Produce Requests</h2>
                            <div className="form-check form-switch small">
                                <input className="form-check-input" type="checkbox" checked={showOnlyMyListings} onChange={e => setShowOnlyMyListings(e.target.checked)} />
                                <label className="form-check-label text-muted">My Requests</label>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-warning"></div></div>
                        ) : displayRequests.length === 0 ? (
                            <div className="text-center p-4 bg-white rounded-4 border border-dashed text-muted small">No active requests found.</div>
                        ) : (
                            <div className="d-grid gap-3">
                                {displayRequests.map(req => (
                                    <div key={req.id} className="card border border-warning border-opacity-25 shadow-sm rounded-4 p-3 position-relative overflow-hidden">
                                        <div className="position-absolute top-0 end-0 bg-warning text-dark px-2 py-1 small fw-bold rounded-bottom-start shadow-sm" style={{ fontSize: '10px' }}>
                                            {timeAgo(req.created_at)}
                                        </div>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <h3 className="h6 fw-bold mb-1 text-dark">Needed: <span className="text-primary-green">{req.quantity}kg {req.crop_name}</span></h3>
                                                <p className="small text-muted mb-2">Requested by: <span className="fw-semibold text-dark">{req.buyer_name}</span></p>
                                                <div className="d-flex gap-3 small text-muted">
                                                    <span>₹{req.offered_price || 'Negotiable'}</span>
                                                    <span>{req.location}</span>
                                                </div>
                                            </div>
                                            {req.contact === user?.phoneNumber && (
                                                <button onClick={() => handleDeleteRequest(req.id)} className="btn btn-sm btn-light text-danger p-1 rounded-circle ms-2">
                                                    <Icon name="delete" style={{ fontSize: '18px' }} />
                                                </button>
                                            )}
                                        </div>
                                        <button className="btn btn-outline-dark btn-sm w-100 rounded-pill shadow-sm mt-3">
                                            <Icon name="phone" style={{ fontSize: '14px' }} className="me-1"/> {req.contact}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
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
