"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Icon } from '@/components/Icon';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { user, login, loginWithGoogle } = useAuth();
    const router = useRouter();

    // ── Redirect once user is resolved ──
    useEffect(() => {
        if (!user) return;
        
        const role = user.role?.toUpperCase();
        console.log(`[Login] Redirecting user with role: ${role}`);
        
        switch (role) {
            case 'ADMIN':
                router.replace('/admin/dashboard');
                break;
            case 'FARMER':
                router.replace('/farmer/dashboard');
                break;
            case 'EXPERT':
                router.replace('/expert/dashboard');
                break;
            case 'BUYER':
                router.replace('/marketplace');
                break;
            default:
                router.replace('/');
        }
    }, [user, router]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
        } catch (err: any) {
            console.error("[Login] Failed:", err);
            window.alert("LOGIN ERROR: " + (err.message || 'Unknown error'));
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await loginWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" 
             style={{ background: 'linear-gradient(135deg, #f1f8e9 0%, #c5e1a5 100%)' }}>
            
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden mx-auto w-100" style={{ maxWidth: '420px' }}>
                <div className="bg-success py-4 text-center">
                    <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center bg-white text-success mb-2 shadow-sm" style={{ width: '60px', height: '60px' }}>
                        <Icon name="eco" className="fs-2" filled />
                    </div>
                    <h1 className="h4 fw-bold text-white mb-0">Dr.Plant</h1>
                    <p className="text-white-50 small mb-0">Secure Agriculture Portal</p>
                </div>

                <div className="card-body p-4 p-md-5 bg-white">
                    {error && (
                        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small border-0 rounded-3 mb-4">
                            <Icon name="error" style={{ fontSize: '18px' }} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailLogin} className="d-grid gap-4">
                        <div className="form-group">
                            <label className="form-label small fw-bold text-dark mb-1">Email or Username</label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-0 text-muted">@</span>
                                <input 
                                    type="text" 
                                    className="form-control form-control-lg bg-light border-0 fs-6 shadow-none" 
                                    placeholder="yourname@farm.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <label className="form-label small fw-bold text-dark mb-0">Password</label>
                                <Link href="/forgot-password" style={{ color: '#2E7D32' }} className="small text-decoration-none fw-bold">Forgot?</Link>
                            </div>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-0 text-muted">
                                    <Icon name="lock" style={{ fontSize: '18px' }} />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control form-control-lg bg-light border-0 fs-6 shadow-none"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn btn-light border-0 text-muted px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <Icon name={showPassword ? "visibility" : "visibility_off"} style={{ fontSize: '18px' }} />
                                </button>
                            </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between">
                            <div className="form-check">
                                <input 
                                    className="form-check-input shadow-none" 
                                    type="checkbox" 
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <label className="form-check-label small text-muted cursor-pointer" htmlFor="rememberMe">
                                    Remember Me
                                </label>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="btn btn-primary-green btn-lg w-100 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                            style={{ height: '52px' }}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                                <>Sign In <Icon name="login" /></>
                            )}
                        </button>
                    </form>

                    <div className="position-relative my-5">
                        <hr className="text-muted opacity-25" />
                        <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small fw-bold">OR</span>
                    </div>

                    <button 
                        onClick={handleGoogleLogin} 
                        disabled={loading} 
                        className="btn btn-light border w-100 rounded-3 d-flex align-items-center justify-content-center gap-2 fw-bold mb-3" 
                        style={{ height: '52px' }}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20" />
                        Google
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-muted small mb-0">
                            Dr. Plant member? <Link href="/signup" className="text-primary-green text-decoration-none fw-bold">Create Account</Link>
                        </p>
                        <hr className="my-3 opacity-10" />
                        <button 
                            type="button"
                            onClick={() => {
                                setEmail('ksdharanidharan2005@gmail.com');
                                setPassword('Admin@123');
                                window.alert("Credentials pre-filled. Please click 'Sign In' to test.");
                            }}
                            className="btn btn-link btn-sm text-muted text-decoration-none"
                            style={{ fontSize: '10px' }}
                        >
                            [Admin Debug: Pre-fill Credentials]
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
