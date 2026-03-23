"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Icon } from '@/components/ui/Icon';

export default function BuyerLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const redirected = useRef(false);

    const { user, login, loginWithGoogle, loading: authLoading } = useAuth();
    const router = useRouter();
    const isProcessing = loading || authLoading;

    useEffect(() => {
        if (authLoading) return;
        if (!user) return;
        if (redirected.current) return;

        redirected.current = true;
        const role = user.role?.toUpperCase();

        switch (role) {
            case 'ADMIN': router.replace('/admin/dashboard'); break;
            case 'FARMER': router.replace('/farmer/dashboard'); break;
            case 'EXPERT': router.replace('/expert/dashboard'); break;
            case 'BUYER': router.replace('/marketplace'); break;
            default: router.replace('/');
        }
    }, [user, authLoading, router]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        redirected.current = false;
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        redirected.current = false;
        try {
            await loginWithGoogle('BUYER');
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading && !user) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="text-center">
                    <div className="spinner-border text-success mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                    <p className="text-muted small">Checking session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center p-3 bg-light border-top border-success border-5">
            
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden mx-auto w-100" style={{ maxWidth: '420px' }}>
                <div className="bg-success py-4 text-center">
                    <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center bg-white text-success mb-2 shadow-sm" style={{ width: '60px', height: '60px' }}>
                        <Icon name="shopping_cart" className="fs-2" filled />
                    </div>
                    <h1 className="h4 fw-bold text-white mb-0">Buyer Login</h1>
                    <p className="text-white-50 small mb-0">Dr.Plant Marketplace</p>
                </div>

                <div className="card-body p-4 p-md-5 bg-white">
                    {error && (
                        <div className="alert alert-danger py-2 small border-0 rounded-3 mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailLogin} className="d-grid gap-4">
                        <div className="form-group">
                            <label className="form-label small fw-bold text-dark mb-1">Email</label>
                            <input 
                                type="text" 
                                className="form-control form-control-lg bg-light border-0 fs-6 shadow-none" 
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isProcessing}
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <label className="form-label small fw-bold text-dark mb-0">Password</label>
                                <Link href="/forgot-password" style={{ color: '#2E7D32' }} className="small text-decoration-none fw-bold">Forgot?</Link>
                            </div>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control form-control-lg bg-light border-0 fs-6 shadow-none pe-5"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isProcessing}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="btn btn-light border-0 text-muted px-3 position-absolute end-0 top-50 translate-middle-y z-1"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
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
                            disabled={isProcessing} 
                            className="btn btn-primary-green btn-lg w-100 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                            style={{ height: '52px' }}
                        >
                            {isProcessing ? (
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
                        disabled={isProcessing}
                        className="btn btn-light border w-100 rounded-3 d-flex align-items-center justify-content-center gap-2 fw-bold mb-3" 
                        style={{ height: '52px' }}
                    >
                        {isProcessing && !loading ? (
                            <span className="spinner-border spinner-border-sm text-secondary" role="status"></span>
                        ) : (
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20" />
                        )}
                        Continue with Google
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-muted small mb-0">
                            New Buyer? <Link href="/buyer/signup" className="text-primary-green text-decoration-none fw-bold">Create Account</Link>
                        </p>
                        <p className="text-muted small mt-2">
                            <Link href="/login" className="text-muted text-decoration-underline">Not a buyer?</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
