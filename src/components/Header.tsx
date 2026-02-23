"use client";

import React from 'react';
import { Icon } from './Icon';
import { useRouter } from 'next/navigation';

interface HeaderProps {
    title: string;
    showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = true }) => {
    const router = useRouter();

    return (
        <header className="sticky-top bg-white border-bottom px-3 py-3 shadow-sm d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
                {showBack && (
                    <button
                        onClick={() => router.back()}
                        className="btn btn-link p-0 text-dark"
                    >
                        <Icon name="arrow_back" className="fs-4" />
                    </button>
                )}
                <h1 className="h5 mb-0 fw-bold">{title}</h1>
            </div>
            <div className="d-flex align-items-center gap-2">
                <Icon name="pwa" className="text-primary-green opacity-50 fs-5" />
            </div>
        </header>
    );
};
