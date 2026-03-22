"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/context/AuthContext';

export default function SyncObserver() {
    const pathname = usePathname();
    const { user, refreshUser } = useAuth();

    useEffect(() => {
        // Only refresh on mount or if user ID changes.
        // AuthContext handles throttling of the actual API call.
        if (user) {
            refreshUser();
        }
    }, [user?.id]); // Remove pathname from dependency array

    return null; // This component doesn't render anything
}
