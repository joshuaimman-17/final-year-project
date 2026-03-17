"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserRow {
    id: string;
    email: string;
    username: string;
    full_name: string;
    role: string;
    expert_status?: string;
    created_at: string;
}
interface ExpertRequest {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    username: string;
    skills: string;
    experience: string;
    portfolio_link?: string;
    message?: string;
    status: string;
    created_at: string;
}

type Tab = 'dashboard' | 'users' | 'expert-requests' | 'community';

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [tab, setTab] = useState<Tab>('dashboard');
    const [userSubTab, setUserSubTab] = useState<'ALL' | 'BUYER' | 'FARMER' | 'EXPERT' | 'ADMIN'>('ALL');
    const [users, setUsers] = useState<UserRow[]>([]);
    const [expertRequests, setExpertRequests] = useState<ExpertRequest[]>([]);
    const [adminPosts, setAdminPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    // Guard: only ADMIN can access
    useEffect(() => {
        if (!user) {
            router.replace('/login');
            return;
        }
        const isAdmin = user.role?.toUpperCase() === 'ADMIN' || user.email?.toLowerCase() === 'ksdharanidharan2005@gmail.com';
        if (!isAdmin) {
            console.log("[AdminGuard] Access denied for user:", user.email);
            router.replace('/');
        }
    }, [user, router]);

    const getToken = useCallback(async () => {
        const fbUser = auth.currentUser;
        if (!fbUser) return null;
        return fbUser.getIdToken();
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data.users || []);
        } catch (err: any) {
            setMsg(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    const fetchExpertRequests = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch('/api/admin/expert-requests', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to fetch expert requests');
            const data = await res.json();
            setExpertRequests(data.requests || []);
        } catch (err: any) {
            setMsg(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    const fetchAdminPosts = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch('/api/admin/community/posts', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to fetch posts');
            const data = await res.json();
            setAdminPosts(data.posts || []);
        } catch (err: any) {
            setMsg(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        if (tab === 'dashboard' || tab === 'users') fetchUsers();
        if (tab === 'expert-requests') fetchExpertRequests();
        if (tab === 'community') fetchAdminPosts();
    }, [tab, fetchUsers, fetchExpertRequests, fetchAdminPosts]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const token = await getToken();
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole })
            });
            if (!res.ok) throw new Error('Failed to update role');
            setMsg(`Role updated to ${newRole}`);
            fetchUsers();
        } catch (err: any) {
            setMsg(`Error: ${err.message}`);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const token = await getToken();
            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if (!res.ok) throw new Error('Failed to delete user');
            setMsg('User deleted');
            fetchUsers();
        } catch (err: any) {
            setMsg(`Error: ${err.message}`);
        }
    };

    const handleExpertRequest = async (requestId: string, status: 'approved' | 'denied') => {
        const token = await getToken();
        const res = await fetch('/api/admin/expert-requests', {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, status })
        });
        const data = await res.json();
        if (res.ok) {
            setMsg(`User successfully promoted to Expert.`);
            fetchExpertRequests();
            fetchUsers(); // Refresh users list too since role changed
        } else {
            console.error("Expert request failed:", data.message);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            const token = await getToken();
            const res = await fetch('/api/admin/community/posts', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId })
            });
            if (!res.ok) throw new Error('Failed to delete post');
            setMsg('Community post removed');
            fetchAdminPosts();
        } catch (err: any) {
            setMsg(`Error: ${err.message}`);
        }
    };

    const isAdmin = user && (user.role?.toUpperCase() === 'ADMIN' || user.email?.toLowerCase() === 'ksdharanidharan2005@gmail.com');
    if (!isAdmin) return null;

    const badgeColor: Record<string, string> = {
        ADMIN: 'bg-danger-subtle text-danger',
        EXPERT: 'bg-info-subtle text-info',
        FARMER: 'bg-primary-subtle text-primary',
        BUYER: 'bg-success-subtle text-success',
        pending: 'bg-warning-subtle text-warning',
        approved: 'bg-success-subtle text-success',
        denied: 'bg-danger-subtle text-danger'
    };

    return (
        <div className="min-vh-100 bg-light d-flex flex-column pb-5">
            {/* Nav Header */}
            <header className="sticky-top bg-white border-bottom px-4 py-3 shadow-sm z-3">
                <div className="d-flex align-items-center justify-content-between mx-auto w-100" style={{ maxWidth: '1200px' }}>
                    <div className="d-flex align-items-center gap-3">
                        <button 
                            onClick={() => {
                                // If they are at the dashboard, they likely want to go to the site home
                                // but we should ensure we don't loop if they just came from '/'
                                router.push('/'); 
                            }} 
                            className="btn btn-light rounded-circle p-2 d-flex shadow-none border"
                            title="Back to Site Home"
                        >
                            <span className="material-symbols-outlined fs-5">home</span>
                        </button>
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-danger rounded-circle p-2 d-flex shadow-sm">
                                <span className="material-symbols-outlined text-white">admin_panel_settings</span>
                            </div>
                            <div>
                                <h1 className="h6 fw-bold mb-0">Admin Command Center</h1>
                                <p className="text-muted small mb-0">System Administration & Controls</p>
                            </div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-end d-none d-md-block">
                            <p className="small fw-bold mb-0">{user.full_name}</p>
                            <p className="text-muted mb-0" style={{ fontSize: '10px' }}>{user.id}</p>
                        </div>
                        <button onClick={() => { logout(); router.push('/login'); }} className="btn btn-outline-danger btn-sm rounded-pill px-3">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow-1 p-4 mx-auto w-100" style={{ maxWidth: '1200px' }}>
                {msg && (
                    <div className="alert alert-success border-0 shadow-sm rounded-4 d-flex align-items-center justify-content-between py-2 px-3 animate-fade-in mb-4">
                        <span className="small fw-bold">{msg}</span>
                        <button type="button" className="btn-close small" style={{ fontSize: '10px' }} onClick={() => setMsg('')}></button>
                    </div>
                )}

                {/* Main Tabs */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 p-1 bg-white">
                    <div className="nav nav-pills nav-fill">
                        {(['dashboard', 'users', 'expert-requests', 'community'] as const).map((key) => (
                            <button
                                key={key}
                                className={`nav-link py-3 fw-bold rounded-3 transition-all ${tab === key ? 'bg-success text-white shadow-sm' : 'text-muted'}`}
                                onClick={() => setTab(key)}
                            >
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                    <span className="material-symbols-outlined fs-5">
                                        {key === 'dashboard' ? 'dashboard' : key === 'users' ? 'group' : key === 'community' ? 'forum' : 'verified_user'}
                                    </span>
                                    <span className="d-none d-md-block text-capitalize">{key.replace('-', ' ')}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="animate-fade-in">
                    {tab === 'dashboard' && (
                        <div className="row g-4">
                            {[
                                { label: 'Total Users', val: users.length, icon: 'group', color: 'primary', action: () => { setTab('users'); } },
                                { label: 'Buyers', val: users.filter(u => u.role === 'BUYER').length, icon: 'shopping_cart', color: 'success', action: () => { setTab('users'); } },
                                { label: 'Farmers', val: users.filter(u => u.role === 'FARMER').length, icon: 'agriculture', color: 'warning', action: () => { setTab('users'); } },
                                { label: 'Experts', val: users.filter(u => u.role === 'EXPERT').length, icon: 'psychology', color: 'info', action: () => { setTab('users'); } },
                                { label: 'Admins', val: users.filter(u => u.role === 'ADMIN').length, icon: 'admin_panel_settings', color: 'danger', action: () => { setTab('users'); } },
                                { label: 'System Status', val: 'Online', icon: 'dns', color: 'success', action: null },
                            ].map((stat) => (
                                <div key={stat.label} className="col-12 col-md-4 col-xl-2">
                                    <div 
                                        onClick={stat.action || undefined}
                                        className={`card border-0 shadow-sm rounded-4 p-3 h-100 transition-all ${stat.action ? 'cursor-pointer hover-scale' : ''}`}
                                    >
                                        <div className={`bg-${stat.color}-subtle text-${stat.color} rounded-4 p-2 d-inline-flex mb-2`} style={{ width: 'fit-content' }}>
                                            <span className="material-symbols-outlined fs-5">{stat.icon}</span>
                                        </div>
                                        <h3 className="h5 fw-bold mb-0">{stat.val}</h3>
                                        <p className="text-muted small mb-0 fw-bold text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '10px' }}>{stat.label}</p>
                                    </div>
                                </div>
                            ))}

                            <div className="col-12">
                                <div className="card border-0 shadow-sm rounded-4 p-4 mt-2 bg-white">
                                    <h3 className="h6 fw-bold mb-4 d-flex align-items-center gap-2">
                                        <span className="material-symbols-outlined text-danger">info</span>
                                        Administrative Credentials
                                    </h3>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <div className="p-3 bg-light rounded-4 border">
                                                <p className="text-muted small mb-1 fw-bold">PRIMARY ADMIN EMAIL</p>
                                                <p className="font-monospace mb-0 text-danger fw-bold">ksdharanidharan2005@gmail.com</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="p-3 bg-light rounded-4 border">
                                                <p className="text-muted small mb-1 fw-bold">ACCESS CONTROL</p>
                                                <p className="mb-0 text-dark small fw-semibold">Firebase Authentication (Google / Email)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'users' && (
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                            <div className="card-header bg-white border-bottom p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                                <div>
                                    <h3 className="h6 fw-bold mb-0">User Directory</h3>
                                    <p className="text-muted small mb-0">Manage all registered site members</p>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="btn-group bg-light p-1 rounded-pill flex-wrap">
                                        {(['ALL', 'BUYER', 'FARMER', 'EXPERT', 'ADMIN'] as const).map(roleKey => (
                                            <button 
                                                key={roleKey}
                                                onClick={() => setUserSubTab(roleKey)}
                                                className={`btn btn-sm rounded-pill px-3 fw-bold border-0 ${userSubTab === roleKey ? 'bg-success text-white shadow-sm' : 'text-muted'}`}
                                            >
                                                {roleKey === 'ALL' ? 'Everyone' : roleKey.charAt(0) + roleKey.slice(1).toLowerCase()}s ({roleKey === 'ALL' ? users.length : users.filter(u => u.role === roleKey).length})
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={fetchUsers} className="btn btn-light btn-sm rounded-circle border p-2">
                                        <span className={`material-symbols-outlined fs-6 ${loading ? 'animate-spin' : ''}`}>refresh</span>
                                    </button>
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="px-4 py-3 border-0 small fw-bold text-muted text-uppercase">Profile</th>
                                            <th className="py-3 border-0 small fw-bold text-muted text-uppercase">Role</th>
                                            <th className="py-3 border-0 small fw-bold text-muted text-uppercase">Status</th>
                                            <th className="py-3 border-0 small fw-bold text-muted text-uppercase text-end px-4">Management</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users
                                            .filter(u => userSubTab === 'ALL' || u.role === userSubTab)
                                            .map((u) => (
                                            <tr key={u.id}>
                                                <td className="px-4 py-3">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="rounded-circle bg-success-subtle text-success p-2 d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                                                            {u.full_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="fw-bold mb-0">{u.full_name}</p>
                                                            <p className="text-muted small mb-0">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge rounded-pill fw-bold ${badgeColor[u.role] || 'bg-light text-dark'}`} style={{ fontSize: '10px' }}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="rounded-circle bg-success d-block" style={{ width: '8px', height: '8px' }}></span>
                                                        <span className="small text-muted fw-bold">Active</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 text-end">
                                                    {u.email !== 'ksdharanidharan2005@gmail.com' ? (
                                                        <div className="d-flex align-items-center justify-content-end gap-2">
                                                            <select 
                                                                className="form-select form-select-sm border-0 bg-light shadow-none fw-bold" 
                                                                style={{ width: '130px', fontSize: '12px' }}
                                                                defaultValue={u.role}
                                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                            >
                                                                <option value="BUYER">Buyer</option>
                                                                <option value="FARMER">Farmer</option>
                                                                <option value="EXPERT">Expert</option>
                                                                <option value="ADMIN">Admin</option>
                                                            </select>
                                                            <button onClick={() => handleDeleteUser(u.id)} className="btn btn-light btn-sm rounded-circle p-2 text-danger border shadow-none">
                                                                <span className="material-symbols-outlined fs-5">delete</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="badge bg-danger rounded-pill fw-bold" style={{ fontSize: '10px' }}>PROTECTED</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === 'expert-requests' && (
                        <div className="row g-4">
                            {expertRequests.length === 0 ? (
                                <div className="col-12 text-center py-5">
                                    <div className="bg-white rounded-4 shadow-sm p-5">
                                        <span className="material-symbols-outlined display-1 text-muted mb-3">cloud_done</span>
                                        <h3 className="h5 fw-bold">All caught up!</h3>
                                        <p className="text-muted mb-0">There are no pending expert applications at the moment.</p>
                                    </div>
                                </div>
                            ) : (
                                expertRequests.map((r) => (
                                    <div key={r.id} className="col-12 col-lg-6">
                                        <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                            <div className="card-header bg-white border-bottom p-4 d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-warning-subtle text-warning rounded-pill p-2 d-flex">
                                                        <span className="material-symbols-outlined">badge</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="h6 fw-bold mb-0">{r.full_name}</h4>
                                                        <p className="text-muted small mb-0">@{r.username || 'user'}</p>
                                                    </div>
                                                </div>
                                                <span className={`badge rounded-pill fw-bold ${badgeColor[r.status]}`} style={{ fontSize: '10px' }}>
                                                    {r.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="card-body p-4 bg-light-subtle">
                                                <div className="mb-4">
                                                    <label className="text-muted small text-uppercase fw-bold mb-2 d-block">Skills & Expertise</label>
                                                    <p className="mb-0 fw-semibold text-dark p-3 bg-white rounded-3 border">{r.skills}</p>
                                                </div>
                                                <div className="mb-4">
                                                    <label className="text-muted small text-uppercase fw-bold mb-2 d-block">Background / Experience</label>
                                                    <p className="mb-0 small text-muted p-3 bg-white rounded-3 border">{r.experience}</p>
                                                </div>
                                                {r.portfolio_link && (
                                                    <div className="mb-4">
                                                        <label className="text-muted small text-uppercase fw-bold mb-2 d-block">Portfolio Link</label>
                                                        <a href={r.portfolio_link} target="_blank" rel="noreferrer" className="text-success small fw-bold d-flex align-items-center gap-1 text-decoration-none">
                                                            <span className="material-symbols-outlined fs-6">link</span>
                                                            {r.portfolio_link}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            {r.status === 'pending' && (
                                                <div className="card-footer bg-white border-0 p-4 pt-0">
                                                    <div className="row g-2">
                                                        <div className="col-6">
                                                            <button 
                                                                onClick={() => handleExpertRequest(r.id, 'approved')} 
                                                                className="btn btn-success w-100 py-3 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                                                            >
                                                                <span className="material-symbols-outlined">verified</span>
                                                                Approve
                                                            </button>
                                                        </div>
                                                        <div className="col-6">
                                                            <button 
                                                                onClick={() => handleExpertRequest(r.id, 'denied')} 
                                                                className="btn btn-outline-danger w-100 py-3 rounded-4 fw-bold border-0"
                                                            >
                                                                <span className="material-symbols-outlined">block</span>
                                                                Deny
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                    {tab === 'community' && (
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                            <div className="card-header bg-white border-bottom p-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h3 className="h6 fw-bold mb-0">Community Moderation</h3>
                                    <p className="text-muted small mb-0">Monitor and manage community posts</p>
                                </div>
                                <button onClick={fetchAdminPosts} className="btn btn-light btn-sm rounded-circle border p-2">
                                    <span className={`material-symbols-outlined fs-6 ${loading ? 'animate-spin' : ''}`}>refresh</span>
                                </button>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="px-4 py-3 border-0 small fw-bold text-muted text-uppercase">Post Data</th>
                                            <th className="py-3 border-0 small fw-bold text-muted text-uppercase">Author</th>
                                            <th className="py-3 border-0 small fw-bold text-muted text-uppercase">Engagement</th>
                                            <th className="py-3 border-0 small fw-bold text-muted text-uppercase text-end px-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adminPosts.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-5 text-muted">No posts found to moderate.</td>
                                            </tr>
                                        ) : adminPosts.map((p) => (
                                            <tr key={p.id}>
                                                <td className="px-4 py-3">
                                                    <div className="d-flex align-items-center gap-3">
                                                        {p.imageUrl && (
                                                            <img src={p.imageUrl} alt="post" className="rounded-3 object-fit-cover shadow-sm" style={{ width: '48px', height: '48px' }} />
                                                        )}
                                                        <div style={{ maxWidth: '300px' }}>
                                                            <p className="mb-0 text-truncate fw-semibold small">{p.content}</p>
                                                            <p className="text-muted mb-0" style={{ fontSize: '10px' }}>{new Date(p.createdAt).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '24px', height: '24px' }}>
                                                            {p.authorAvatar ? <img src={p.authorAvatar} alt="avatar" className="w-100 h-100" /> : <span className="small text-muted">{p.authorName?.charAt(0)}</span>}
                                                        </div>
                                                        <span className="small fw-bold">{p.authorName}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <span className="small text-muted d-flex align-items-center gap-1">
                                                            <span className="material-symbols-outlined fs-6 text-danger">favorite</span> {p.likeCount || 0}
                                                        </span>
                                                        <span className="small text-muted d-flex align-items-center gap-1">
                                                            <span className="material-symbols-outlined fs-6 text-primary">chat_bubble</span> {p.commentCount || 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 text-end">
                                                    <button onClick={() => handleDeletePost(p.id)} className="btn btn-outline-danger btn-sm rounded-pill px-3 shadow-none fw-bold">
                                                        Delete Post
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <style>{`
                .nav-link.active { background-color: #198754 !important; color: white !important; }
                .cursor-pointer { cursor: pointer; }
                .hover-scale { transition: transform 0.2s ease; }
                .hover-scale:hover { transform: translateY(-5px); }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
