"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User } from '@/types';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import logger from '@/lib/logger';
import { EncryptionService } from '@/lib/encryption';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    locationLoading: boolean;
    signup: (email: string, pass: string, name: string, farm: string, phoneNumber: string, username: string, role: string) => Promise<void>;
    login: (email: string, pass: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateLocation: (lat: number, lon: number) => void;
    detectLocation: () => void;
    setUpRecaptcha: (elementId: string) => any;
    startPhoneSignup: (phoneNumber: string, appVerifier: any) => Promise<any>;
    confirmPhoneSignup: (confirmationResult: any, otp: string, name: string, farm: string, username: string, role: string) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_DATA_KEY = 'drplant_profile_data';

const getAuthErrorMessage = (error: any): string => {
    const code = error?.code || '';
    switch (code) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please sign in instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/weak-password':
            return 'Password must be at least 6 characters long.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in popup was closed. Please try again.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        case 'auth/requires-recent-login':
            return 'Please sign in again to complete this action.';
        default:
            return error?.message || 'An unexpected error occurred. Please try again.';
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [locationLoading, setLocationLoading] = useState(false);
    const watchIdRef = useRef<number | null>(null);
    const userRef = useRef<User | null>(null);
    const lastSyncRef = useRef<number>(0);
    const pendingSignupData = useRef<any>(null);

    // Keep userRef in sync so callbacks can access latest user
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const syncInProgress = useRef<string | null>(null);
    const retryCountRef = useRef<Record<string, number>>({});

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                const idForDb = fbUser.phoneNumber || fbUser.uid;
                
                if (syncInProgress.current === idForDb) return;

                const attemptSync = async (forceRetry = false) => {
                    try {
                        syncInProgress.current = idForDb;
                        const isAdminEmail = fbUser.email?.toLowerCase() === 'ksdharanidharan2005@gmail.com';
                        
                        // 1. Optimistic UI update from Cache
                        const stored = localStorage.getItem(`${USER_DATA_KEY}_${idForDb}`);
                        const cached = (stored ? JSON.parse(stored) : null) || pendingSignupData.current;

                        const resolvedRole = isAdminEmail ? 'ADMIN' : (cached?.role || 'BUYER');
                        console.log(`[Auth] Initial role check for ${fbUser.email}: isAdminEmail=${isAdminEmail}, cachedRole=${cached?.role}, resolved=${resolvedRole}`);
                        
                        if (cached && !user) {
                             setUser({
                                id: cached.uid || cached.id || idForDb,
                                username: cached.username || fbUser.email?.split('@')[0] || idForDb,
                                full_name: cached.name || cached.full_name || fbUser.displayName || 'Agri User',
                                role: resolvedRole,
                                email: fbUser.email || undefined,
                                avatarUrl: cached.avatar_url || cached.avatarUrl || fbUser.photoURL || undefined,
                                farm_name: cached.farm_name || 'My Farm',
                                latitude: cached.latitude || 20.5937,
                                longitude: cached.longitude || 78.9629,
                            } as any);
                        }

                        // 2. Throttled Backend Sync
                        const now = Date.now();
                        const isThrottled = lastSyncRef.current && (now - lastSyncRef.current < 10000);
                        
                        if (!isThrottled || forceRetry) {
                            const token = await fbUser.getIdToken();
                            const res = await fetch('/api/auth/sync', {
                                method: 'POST',
                                headers: { 
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(pendingSignupData.current || {})
                            });

                            if (res.ok) {
                                const { user: profile } = await res.json();
                                lastSyncRef.current = Date.now();
                                retryCountRef.current[idForDb] = 0; // Reset retries on success

                                const finalRole = isAdminEmail ? 'ADMIN' : (profile.role || 'BUYER');
                                console.log(`[Auth] Backend sync role for ${fbUser.email}: profile.role=${profile.role}, final=${finalRole}`);
                                
                                const updatedUser = {
                                    id: profile.id || profile.uid,
                                    username: profile.username || fbUser.email?.split('@')[0],
                                    full_name: profile.full_name || fbUser.displayName || 'Agri User',
                                    role: finalRole as any,
                                    email: fbUser.email || profile.email || undefined,
                                    avatarUrl: profile.avatar_url || fbUser.photoURL || undefined,
                                    farm_name: profile.farm_name || 'My Farm',
                                    latitude: profile.latitude || 20.5937,
                                    longitude: profile.longitude || 78.9629,
                                };

                                setUser(updatedUser);
                                localStorage.setItem(`${USER_DATA_KEY}_${idForDb}`, JSON.stringify(profile));
                                if (pendingSignupData.current) pendingSignupData.current = null;
                                
                                logger.info(`[Auth] Sync success for ${idForDb}`);
                            } else {
                                const errorData = await res.json().catch(() => ({}));
                                logger.error(`[Auth] Sync API failed (${res.status}): ${errorData.message || 'Unknown'}`, errorData.error);
                                
                                // Retry Once Mechanism
                                const retries = retryCountRef.current[idForDb] || 0;
                                if (retries < 1) {
                                    retryCountRef.current[idForDb] = retries + 1;
                                    logger.info(`[Auth] Retrying sync for ${idForDb} (Attempt ${retries + 1})`);
                                    setTimeout(() => attemptSync(true), 2000);
                                }
                            }
                        }
                    } catch (error) {
                        logger.error("[Auth] Sync error", error);
                    } finally {
                        syncInProgress.current = null;
                        setLoading(false);
                    }
                };

                attemptSync();
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const signup = async (email: string, pass: string, name: string, farm: string, phoneNumber: string, username: string, role: string) => {
        logger.info(`Starting signup process for ${email}...`);
        try {
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            logger.info("Firebase User created successfully", { uid: res.user.uid });
            await updateProfile(res.user, { displayName: name });

            const idForDb = res.user.uid; // Always use UID for email signups initially
            const userData = {
                id: idForDb,
                uid: res.user.uid,
                username,
                full_name: name,
                email: email,
                farm_name: farm,
                role,
                latitude: 20.5937,
                longitude: 78.9629,
                createdAt: new Date().toISOString(),
                phoneNumber: phoneNumber // Save as a regular field
            };

            // Set pending data BEFORE local storage, to be absolutely sure the effect sees it
            pendingSignupData.current = userData;
            localStorage.setItem(`${USER_DATA_KEY}_${idForDb}`, JSON.stringify(userData));
            // Note: Postgres sync happens automatically via the onAuthStateChanged effect
        } catch (error: any) {
            logger.error("Signup failed", error);
            throw new Error(getAuthErrorMessage(error));
        }
    };

    const login = async (email: string, pass: string) => {
        logger.info(`Attempting login for ${email}...`);
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            logger.info("Login successful");
        } catch (error: any) {
            logger.error("Login failed", error);
            throw new Error(getAuthErrorMessage(error));
        }
    };

    const loginWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            // Sync handled by listener
        } catch (error: any) {
            throw new Error(getAuthErrorMessage(error));
        }
    };

    const startPhoneSignup = async (phoneNumber: string, appVerifier: any) => {
        return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    };

    const confirmPhoneSignup = async (confirmationResult: any, otp: string, name: string, farm: string, username: string, role: string) => {
        try {
            const res = await confirmationResult.confirm(otp);
            const fbUser = res.user;
            await updateProfile(fbUser, { displayName: name });

            const userData = {
                id: fbUser.phoneNumber || fbUser.uid,
                username,
                full_name: name,
                farm_name: farm,
                role,
                createdAt: new Date().toISOString()
            };
            pendingSignupData.current = userData;
            localStorage.setItem(`${USER_DATA_KEY}_${userData.id}`, JSON.stringify(userData));
        } catch (error: any) {
            throw new Error(getAuthErrorMessage(error));
        }
    };

    const setUpRecaptcha = (elementId: string) => {
        return new RecaptchaVerifier(auth, elementId, {
            'size': 'invisible'
        });
    };

    const logout = async () => {
        const fbUser = auth.currentUser;
        if (fbUser) {
            const idForDb = fbUser.phoneNumber || fbUser.uid;
            localStorage.removeItem(`${USER_DATA_KEY}_${idForDb}`);
        }
        await signOut(auth);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const updateLocation = useCallback((lat: number, lon: number) => {
        const currentUser = userRef.current;
        const fbUser = auth.currentUser;
        if (!currentUser || !fbUser) return;

        if (
            Math.abs(currentUser.latitude - lat) < 0.0001 &&
            Math.abs(currentUser.longitude - lon) < 0.0001
        ) return;

        const updated = { ...currentUser, latitude: lat, longitude: lon };
        setUser(updated);

        const idForDb = fbUser.phoneNumber || fbUser.uid;
        const stored = localStorage.getItem(`${USER_DATA_KEY}_${idForDb}`);
        const extra = stored ? JSON.parse(stored) : {};
        localStorage.setItem(`${USER_DATA_KEY}_${idForDb}`, JSON.stringify({ ...extra, latitude: lat, longitude: lon }));

        // ── Throttled sync to Postgres ──
        const now = Date.now();
        if (now - lastSyncRef.current > 5 * 60 * 1000) { // Every 5 minutes
            const sync = async () => {
                try {
                    const token = await fbUser.getIdToken();
                    await fetch('/api/auth/sync', {
                        method: 'POST',
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ latitude: lat, longitude: lon })
                    });
                    lastSyncRef.current = now;
                    logger.debug("Location synced to Postgres");
                } catch (e) {
                    logger.error("Failed to sync location to Postgres", e);
                }
            };
            sync();
        }
    }, []);

    useEffect(() => {
        if (!user || typeof window === 'undefined' || !navigator.geolocation) return;
        if (watchIdRef.current !== null) return;

        setLocationLoading(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                updateLocation(latitude, longitude);
                setLocationLoading(false);
            },
            () => setLocationLoading(false),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [user?.id, updateLocation]);

    const detectLocation = () => {
        if (!navigator.geolocation) return;
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                updateLocation(pos.coords.latitude, pos.coords.longitude);
                setLocationLoading(false);
            },
            () => setLocationLoading(false),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            locationLoading,
            signup,
            login,
            loginWithGoogle,
            logout,
            resetPassword,
            updateLocation,
            detectLocation,
            setUpRecaptcha,
            startPhoneSignup,
            confirmPhoneSignup,
            refreshUser: async () => {
                const fbUser = auth.currentUser;
                if (!fbUser) return;
                
                logger.info("[Auth] Refreshing user data...");
                const idForDb = fbUser.phoneNumber || fbUser.uid;
                try {
                    const token = await fbUser.getIdToken(true); // Force refresh token to pick up new claims if any
                    const res = await fetch('/api/auth/sync', {
                        method: 'POST',
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({})
                    });

                    if (res.ok) {
                        const { user: profile } = await res.json();
                        const isAdminEmail = fbUser.email?.toLowerCase() === 'ksdharanidharan2005@gmail.com';
                        const dbRole = (profile.role || 'BUYER').toUpperCase();
                        const finalRole = isAdminEmail ? 'ADMIN' : dbRole;

                        setUser(prev => {
                            if (!prev) return null;
                            return {
                                ...prev,
                                role: finalRole as any,
                                username: profile.username || prev.username,
                                full_name: profile.full_name || prev.full_name,
                                farm_name: profile.farm_name || prev.farm_name,
                                avatarUrl: profile.avatar_url || prev.avatarUrl,
                                expert_status: profile.expert_status || prev.expert_status,
                            };
                        });
                        
                        localStorage.setItem(`${USER_DATA_KEY}_${idForDb}`, JSON.stringify({ ...profile, role: finalRole }));
                        logger.info(`[Auth] User data refreshed manually. Role: ${finalRole}`);
                    }
                } catch (error) {
                    logger.error("[Auth] Refresh failed", error);
                }
            }
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
