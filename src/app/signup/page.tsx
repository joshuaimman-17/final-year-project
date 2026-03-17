"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Icon } from '@/components/Icon';

const COUNTRY_CODES = [
    { code: '+91', label: 'IN' },
    { code: '+1', label: 'US' },
    { code: '+44', label: 'UK' },
    { code: '+61', label: 'AU' },
    { code: '+81', label: 'JP' },
    { code: '+86', label: 'CN' },
    { code: '+971', label: 'UAE' },
];

const ROLE_OPTIONS = [
    { id: 'BUYER', title: 'Buyer (Customer)', icon: 'person', desc: 'Browse and buy fresh produce' },
    { id: 'FARMER', title: 'Farmer', icon: 'agriculture', desc: 'Sell your crops and manage orders' },
    { id: 'EXPERT', title: 'Expert', icon: 'psychology', desc: 'Provide agricultural guidance' },
    { id: 'ADMIN', title: 'Admin', icon: 'admin_panel_settings', desc: 'Manage the platform' },
];

export default function SignupPage() {
    const [step, setStep] = useState(1); // 1: Role Selection, 2: Details
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [farmName, setFarmName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('BUYER');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signup, loginWithGoogle } = useAuth();
    const router = useRouter();

    const handleGoogleSignup = async () => {
        try {
            console.log("Starting Google Signup...");
            await loginWithGoogle();
            console.log("Google Signup successful, redirecting...");
            router.push('/');
        } catch (err: any) {
            console.error("Google Signup Error:", err);
            setError(err.message || 'Google signup failed');
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
        console.log("Starting Email Signup with:", { email, name, farmName, fullPhoneNumber, username, role });

        try {
            await signup(email, password, name, farmName || 'My Farm', fullPhoneNumber, username, role);
            console.log("Email Signup successful, redirecting...");
            router.push('/');
        } catch (err: any) {
            console.error("Email Signup Error:", err);
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
            <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 mx-auto w-100" style={{ maxWidth: step === 1 ? '600px' : '448px' }}>
                <div className="text-center mb-4">
                    <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center bg-success-subtle text-success mb-3" style={{ width: '64px', height: '64px' }}>
                        <Icon name="eco" className="display-6" filled />
                    </div>
                    <h1 className="h3 fw-bold text-dark mb-1">{step === 1 ? 'Choose Your Role' : 'Create Account'}</h1>
                    <p className="text-muted small">{step === 1 ? 'Select how you want to use Dr.Plant' : `Joining as a ${role.toLowerCase()}`}</p>
                </div>

                {error && <div className="alert alert-danger py-2 small">{error}</div>}

                {step === 1 ? (
                    <div className="row g-3">
                        {ROLE_OPTIONS.map((opt) => (
                            <div key={opt.id} className="col-sm-6">
                                <div 
                                    onClick={() => { setRole(opt.id); setStep(2); }}
                                    className={`card h-100 border-2 cursor-pointer transition-all hover-scale ${role === opt.id ? 'border-primary-green bg-success-subtle' : 'border-light bg-white'}`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="card-body text-center p-3">
                                        <div className={`mx-auto rounded-circle d-flex align-items-center justify-content-center mb-2 ${role === opt.id ? 'bg-primary-green text-white' : 'bg-light text-muted'}`} style={{ width: '48px', height: '48px' }}>
                                            <Icon name={opt.icon} />
                                        </div>
                                        <h3 className="h6 fw-bold mb-1">{opt.title}</h3>
                                        <p className="text-muted mb-0" style={{ fontSize: '11px' }}>{opt.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
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

                            {role === 'FARMER' && (
                                <div>
                                    <label className="form-label small fw-bold text-muted mb-1">Farm Name</label>
                                    <input
                                        type="text"
                                        value={farmName}
                                        onChange={(e) => setFarmName(e.target.value)}
                                        className="form-control form-control-lg rounded-3 border bg-light fs-6"
                                        required
                                        placeholder="Dream Valley Farm"
                                    />
                                </div>
                            )}

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

                            <button 
                                type="button" 
                                onClick={() => setStep(1)} 
                                className="btn btn-link text-muted small text-decoration-none"
                            >
                                ← Back to role selection
                            </button>
                        </form>
                    </>
                )}

                <div className="text-center mt-4 pt-2">
                    <p className="text-muted mb-0">Already have an account? <Link href="/login" className="text-primary-green text-decoration-none fw-bold">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
}
