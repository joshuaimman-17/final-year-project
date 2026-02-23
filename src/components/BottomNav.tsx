"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from './Icon';

export const BottomNav: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const NavItem = ({ path, icon, label, filled = false }: { path: string; icon: string; label: string; filled?: boolean }) => (
        <button
            onClick={() => router.push(path)}
            className={`d-flex flex-column align-items-center justify-content-center w-100 h-100 border-0 bg-transparent transition-colors ${isActive(path)
                ? 'text-primary-green'
                : 'text-secondary opacity-75'
                }`}
        >
            <Icon name={icon} filled={isActive(path) || filled} className="fs-4" />
            <span style={{ fontSize: '10px' }} className="fw-medium">{label}</span>
        </button>
    );

    const hideOn = ['/login', '/signup', '/forgot-password'];
    if (hideOn.includes(pathname)) return null;

    return (
        <nav className="fixed-bottom bg-white border-top pb-safe shadow-lg">
            <div className="d-flex justify-content-around align-items-center" style={{ height: '64px', maxWidth: '448px', margin: '0 auto' }}>
                <NavItem path="/" icon="dashboard" label="Home" />
                <NavItem path="/community" icon="groups" label="Feed" />
                <NavItem path="/field" icon="landscape" label="Field" />
                <NavItem path="/marketplace" icon="storefront" label="Market" />
                <NavItem path="/profile" icon="person" label="Profile" />
            </div>
        </nav>
    );
};
