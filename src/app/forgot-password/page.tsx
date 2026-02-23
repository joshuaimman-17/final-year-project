"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Icon } from '@/components/Icon';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const { resetPassword } = useAuth();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            await resetPassword(email);
            setMessage('Password reset email sent! Please check your inbox.');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
            <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 mx-auto w-100" style={{ maxWidth: '448px' }}>
                <div className="text-center mb-5">
                    <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center bg-warning-subtle text-warning mb-3" style={{ width: '64px', height: '64px' }}>
                        <Icon name="lock_reset" className="display-6" filled />
                    </div>
                    <h1 className="h3 fw-bold text-dark mb-1">Reset Password</h1>
                    <p className="text-muted small">We'll send you a recovery link</p>
                </div>

                {error && <div className="alert alert-danger py-2 small">{error}</div>}
                {message && <div className="alert alert-success py-2 small">{message}</div>}

                <form onSubmit={handleReset} className="d-grid gap-3">
                    <div>
                        <label className="form-label small fw-bold text-muted mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-control form-control-lg rounded-3 border bg-light fs-6"
                            required
                            placeholder="farmer@example.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-warning btn-lg w-100 rounded-3 fw-bold shadow-sm mt-3"
                        style={{ height: '56px', backgroundColor: '#FFD700', border: 'none', color: '#000' }}
                    >
                        {loading ? <div className="spinner-border spinner-border-sm" role="status"></div> : 'Send Link'}
                    </button>
                </form>

                <div className="text-center mt-4 pt-2">
                    <p className="text-muted mb-0">Remembered? <Link href="/login" className="text-primary-green text-decoration-none fw-bold">Back to Login</Link></p>
                </div>
            </div>
        </div>
    );
}
