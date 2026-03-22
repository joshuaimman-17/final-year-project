"use client";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

import { UserRole } from "@/types";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (allowedRoles && !allowedRoles.some(r => r.toUpperCase() === user.role?.toUpperCase())) {
                // Redirect unauthorized users to their respective dashboards
                const role = user.role?.toUpperCase();
                switch (role) {
                    case 'ADMIN': router.replace('/admin/dashboard'); break;
                    case 'FARMER': router.replace('/farmer/dashboard'); break;
                    case 'EXPERT': router.replace('/expert/dashboard'); break;
                    case 'BUYER': router.replace('/marketplace'); break;
                    default: router.replace('/');
                }
            }
        }
    }, [user, loading, router, allowedRoles]);

    if (loading) {
        return (
            <div className="vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="spinner-border text-primary-green" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!user) return null;
    if (allowedRoles && !allowedRoles.some(r => r.toUpperCase() === user.role?.toUpperCase())) return null;

    return <>{children}</>;
}
