"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Icon } from '@/components/Icon';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login, loginWithGoogle } = useAuth();
    const router = useRouter();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            router.push('/');
        } catch (err: any) {
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
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
            <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 mx-auto w-100" style={{ maxWidth: '448px' }}>
                <div className="text-center mb-4">
                    <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center bg-success-subtle text-success mb-3" style={{ width: '64px', height: '64px' }}>
                        <Icon name="eco" className="display-6" filled />
                    </div>
                    <h1 className="h3 fw-bold text-dark mb-1">Dr.Plant</h1>
                    <p className="text-muted small">Agri-Command Center</p>
                </div>

                {error && <div className="alert alert-danger py-2 small">{error}</div>}

                <form onSubmit={handleEmailLogin} className="d-grid gap-3">
                    <div>
                        <label className="form-label small fw-bold text-muted mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control form-control-lg rounded-3 border bg-light fs-6" required placeholder="farmer@example.com" />
                    </div>
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <label className="form-label small fw-bold text-muted mb-0">Password</label>
                            <Link href="/forgot-password" style={{ color: '#2E7D32' }} className="small text-decoration-none fw-bold">Forgot?</Link>
                        </div>
                        <div className="position-relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-control form-control-lg rounded-3 border bg-light fs-6 pe-5"
                                required
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                className="btn position-absolute top-50 end-0 translate-middle-y border-0 pe-3 text-muted"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                <Icon name={showPassword ? "visibility" : "visibility_off"} />
                            </button>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary-green btn-lg w-100 rounded-3 fw-bold shadow-sm mt-2" style={{ height: '56px' }}>
                        {loading ? <div className="spinner-border spinner-border-sm text-white" role="status"></div> : 'Sign In'}
                    </button>
                </form>

                <div className="position-relative my-4">
                    <hr />
                    <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small">OR</span>
                </div>

                <button onClick={handleGoogleLogin} disabled={loading} className="btn btn-outline-dark btn-lg w-100 rounded-3 d-flex align-items-center justify-content-center gap-2 fw-bold" style={{ height: '56px' }}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20" />
                    Continue with Google
                </button>

                <div className="text-center mt-4 pt-2">
                    <p className="text-muted mb-0">Don't have an account? <Link href="/signup" className="text-primary-green text-decoration-none fw-bold">Sign Up</Link></p>
                </div>
            </div>
        </div>
    );
}
