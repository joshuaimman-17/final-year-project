"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Icon } from '@/components/ui/Icon';

const COUNTRY_CODES = [
    { code: '+91', label: 'IN' },
    { code: '+1', label: 'US' },
    { code: '+44', label: 'UK' },
    { code: '+61', label: 'AU' },
    { code: '+81', label: 'JP' },
    { code: '+86', label: 'CN' },
    { code: '+971', label: 'UAE' },
];

export default function BuyerSignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { user, signup, loginWithGoogle } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) return;
        
        const r = user.role?.toUpperCase();
        switch (r) {
            case 'ADMIN': router.replace('/admin/dashboard'); break;
            case 'FARMER': router.replace('/farmer/dashboard'); break;
            case 'EXPERT': router.replace('/expert/dashboard'); break;
            case 'BUYER': router.replace('/marketplace'); break;
            default: router.replace('/');
        }
    }, [user, router]);

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError('');
        try {
            await loginWithGoogle('BUYER');
        } catch (err: any) {
            setError(err.message || 'Google signup failed');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!phoneNumber) {
            setError('Phone number is required');
            setLoading(false);
            return;
        }

        const fullPhoneNumber = `${countryCode}${phoneNumber}`;

        try {
            await signup(email, password, name, '', fullPhoneNumber, username, 'BUYER');
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3 border-top border-success border-5">
            <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 mx-auto w-100" style={{ maxWidth: '448px' }}>
                <div className="text-center mb-4">
                    <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center bg-success-subtle text-success mb-3" style={{ width: '64px', height: '64px' }}>
                        <Icon name="shopping_cart" className="display-6" filled />
                    </div>
                    <h1 className="h3 fw-bold text-dark mb-1">Buyer Signup</h1>
                    <p className="text-muted small">Join the Dr.Plant Marketplace</p>
                </div>

                {error && <div className="alert alert-danger py-2 small">{error}</div>}

                <div className="d-grid gap-3 mb-3">
                    <button
                        onClick={handleGoogleSignup}
                        className="btn btn-white border shadow-sm d-flex align-items-center justify-content-center gap-2 py-2 rounded-3"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20" />
                        <span className="fw-medium">Sign up with Google</span>
                    </button>
                </div>

                <div className="position-relative text-center mb-4">
                    <hr className="text-muted opacity-25" />
                    <span className="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small">
                        OR
                    </span>
                </div>

                <form onSubmit={handleEmailSignup} className="d-grid gap-3">
                    <div>
                        <label className="form-label small fw-bold text-muted mb-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="form-control form-control-lg rounded-3 border bg-light fs-6"
                            required
                            placeholder="Enter your name"
                        />
                    </div>

                    <div>
                        <label className="form-label small fw-bold text-muted mb-1">Username (Unique)</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="form-control form-control-lg rounded-3 border bg-light fs-6"
                            required
                            placeholder="your_username"
                        />
                    </div>

                    <div className="mb-0">
                        <label className="form-label small fw-bold text-muted mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-control form-control-lg rounded-3 border bg-light fs-6"
                            required
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="mb-0">
                        <label className="form-label small fw-bold text-muted mb-1">Phone Number</label>
                        <div className="input-group">
                            <select
                                className="form-select border bg-light text-muted"
                                style={{ maxWidth: '90px', fontSize: '13px' }}
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                            >
                                {COUNTRY_CODES.map((code) => (
                                    <option key={code.code} value={code.code}>{code.code}</option>
                                ))}
                            </select>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="form-control form-control-lg border bg-light fs-6"
                                required
                                placeholder="1234567890"
                            />
                        </div>
                    </div>

                    <div className="mb-0">
                        <label className="form-label small fw-bold text-muted mb-1">Password</label>
                        <div className="position-relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-control form-control-lg rounded-3 border bg-light fs-6 pe-5"
                                required
                                placeholder="••••••••"
                                minLength={6}
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary-green btn-lg w-100 rounded-3 fw-bold shadow-sm mt-2"
                        style={{ height: '56px' }}
                    >
                        {loading ? <div className="spinner-border spinner-border-sm text-white" role="status"></div> : 'Register Account'}
                    </button>
                </form>

                <div className="text-center mt-4 pt-2">
                    <p className="text-muted mb-0">Already have an account? <Link href="/buyer/login" className="text-primary-green text-decoration-none fw-bold">Sign In</Link></p>
                    <p className="text-muted mb-0 mt-3 small"><Link href="/signup" className="text-muted text-decoration-underline">Not a buyer?</Link></p>
                </div>
            </div>
        </div>
    );
}
