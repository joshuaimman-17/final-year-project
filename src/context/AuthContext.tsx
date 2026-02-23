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

    // Keep userRef in sync so callbacks can access latest user
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            logger.debug(`Auth state changed: ${fbUser ? fbUser.email : 'No user'}`);
            if (fbUser) {
                const idForDb = fbUser.phoneNumber || fbUser.uid;

                try {
                    // Fetch user profile from Postgres via sync API
                    const token = await fbUser.getIdToken();
                    const res = await fetch('/api/auth/sync', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const profile = await res.json();
                        setUser({
                            id: profile.id,
                            username: profile.username || fbUser.email?.split('@')[0] || profile.id,
                            full_name: profile.full_name || fbUser.displayName || 'Agri User',
                            role: profile.role || 'CUSTOMER',
                            farm_name: profile.farm_name || 'My Farm',
                            latitude: profile.latitude || 36.7783,
                            longitude: profile.longitude || -119.4179,
                            avatarUrl: profile.avatar_url || fbUser.photoURL || undefined,
                            phoneNumber: profile.id
                        });
                        localStorage.setItem(`${USER_DATA_KEY}_${idForDb}`, JSON.stringify(profile));
                    } else {
                        // Fallback to local storage if API fails
                        const stored = localStorage.getItem(`${USER_DATA_KEY}_${idForDb}`);
                        const extra = stored ? JSON.parse(stored) : {};
                        setUser({
                            id: idForDb,
                            username: extra.username || fbUser.email?.split('@')[0] || fbUser.phoneNumber || 'User',
                            full_name: fbUser.displayName || extra.full_name || 'Agri User',
                            role: extra.role || 'CUSTOMER',
                            farm_name: extra.farm_name || 'My Farm',
                            latitude: extra.latitude || 36.7783,
                            longitude: extra.longitude || -119.4179,
                            avatarUrl: fbUser.photoURL || undefined,
                            phoneNumber: fbUser.phoneNumber || extra.phoneNumber || undefined
                        });
                    }
                } catch (error) {
                    logger.error("Error syncing profile from Postgres", error);
                    const stored = localStorage.getItem(`${USER_DATA_KEY}_${idForDb}`);
                    const extra = stored ? JSON.parse(stored) : {};
                    setUser({
                        id: idForDb,
                        username: extra.username || fbUser.email?.split('@')[0] || fbUser.phoneNumber || 'User',
                        full_name: fbUser.displayName || extra.full_name || 'Agri User',
                        role: extra.role || 'CUSTOMER',
                        farm_name: extra.farm_name || 'My Farm',
                        latitude: extra.latitude || 36.7783,
                        longitude: extra.longitude || -119.4179,
                        avatarUrl: fbUser.photoURL || undefined,
                        phoneNumber: fbUser.phoneNumber || extra.phoneNumber || undefined
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signup = async (email: string, pass: string, name: string, farm: string, phoneNumber: string, username: string, role: string) => {
        logger.info(`Starting signup process for ${email}...`);
        try {
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            logger.info("Firebase User created successfully", { uid: res.user.uid });
            await updateProfile(res.user, { displayName: name });

            const idForDb = phoneNumber;
            const userData = {
                id: idForDb,
                uid: res.user.uid,
                username,
                full_name: name,
                email: email,
                farm_name: farm,
                role,
                latitude: 36.7783,
                longitude: -119.4179,
                createdAt: new Date().toISOString(),
                phoneNumber: phoneNumber
            };

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

        // TODO: Push to Postgres
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
            confirmPhoneSignup
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
