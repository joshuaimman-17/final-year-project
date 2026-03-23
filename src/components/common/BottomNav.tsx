"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/features/auth/context/AuthContext';

export const BottomNav: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();

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

    const role = user?.role?.toUpperCase();

    return (
        <nav className="fixed-bottom bg-white border-top pb-safe shadow-lg">
            <div className="d-flex justify-content-around align-items-center" style={{ height: '64px', maxWidth: '448px', margin: '0 auto' }}>
                {role === 'FARMER' ? (
                    <>
                        <NavItem path="/" icon="dashboard" label="Home" />
                        <NavItem path="/community" icon="groups" label="Feed" />
                        <NavItem path="/chat" icon="chat" label="Chat" />
                        <NavItem path="/field" icon="landscape" label="Field" />
                        <NavItem path="/profile" icon="person" label="Profile" />
                    </>
                ) : role === 'EXPERT' ? (
                    <>
                        <NavItem path="/" icon="dashboard" label="Home" />
                        <NavItem path="/community" icon="groups" label="Feed" />
                        <NavItem path="/chat" icon="chat" label="Chat" />
                        <NavItem path="/field" icon="landscape" label="Field" />
                        <NavItem path="/profile" icon="person" label="Profile" />
                    </>
                ) : role === 'BUYER' ? (
                    <>
                        <NavItem path="/marketplace" icon="storefront" label="Home" />
                        <NavItem path="/buyer/cart" icon="shopping_cart" label="Cart" />
                        <NavItem path="/buyer/orders" icon="receipt_long" label="Orders" />
                        <NavItem path="/buyer/profile" icon="person" label="Profile" />
                    </>
                ) : (
                    <>
                        <NavItem path="/" icon="dashboard" label="Home" />
                        <NavItem path="/community" icon="groups" label="Feed" />
                        <NavItem path="/chat" icon="chat" label="Chat" />
                        <NavItem path="/profile" icon="person" label="Profile" />
                    </>
                )}

                {(user?.email?.toLowerCase() === 'ksdharanidharan2005@gmail.com' || role === 'ADMIN') && (
                    <button
                        onClick={() => router.push('/admin/dashboard')}
                        className={`d-flex flex-column align-items-center justify-content-center w-100 h-100 border-0 bg-transparent transition-colors ${pathname.startsWith('/admin')
                            ? 'text-danger'
                            : 'text-danger opacity-50'
                            }`}
                    >
                        <Icon name="admin_panel_settings" filled={pathname.startsWith('/admin')} className="fs-4" />
                        <span style={{ fontSize: '10px' }} className="fw-bold">Admin</span>
                    </button>
                )}

                {role === 'FARMER' && (
                    <button
                        onClick={() => router.push('/farmer/dashboard')}
                        className={`d-flex flex-column align-items-center justify-content-center w-100 h-100 border-0 bg-transparent transition-colors ${pathname.startsWith('/farmer')
                            ? 'text-primary-green'
                            : 'text-primary-green opacity-50'
                            }`}
                    >
                        <Icon name="agriculture" filled={pathname.startsWith('/farmer')} className="fs-4" />
                        <span style={{ fontSize: '10px' }} className="fw-bold">Farmer</span>
                    </button>
                )}

                {role === 'EXPERT' && (
                    <button
                        onClick={() => router.push('/expert/dashboard')}
                        className={`d-flex flex-column align-items-center justify-content-center w-100 h-100 border-0 bg-transparent transition-colors ${pathname.startsWith('/expert')
                            ? 'text-success'
                            : 'text-success opacity-50'
                            }`}
                    >
                        <Icon name="psychology" filled={pathname.startsWith('/expert')} className="fs-4" />
                        <span style={{ fontSize: '10px' }} className="fw-bold">Expert</span>
                    </button>
                )}
            </div>
        </nav>
    );
};
