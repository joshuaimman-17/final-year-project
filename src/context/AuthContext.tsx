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
    signInWithPhoneNumber,
    ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import logger from '@/lib/logger';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    locationLoading: boolean;
    signup: (email: string, pass: string, name: string, farm: string, phoneNumber?: string) => Promise<void>;
    login: (email: string, pass: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateLocation: (lat: number, lon: number) => void;
    detectLocation: () => void;
    setUpRecaptcha: (elementId: string) => any;
    startPhoneSignup: (phoneNumber: string, appVerifier: any) => Promise<any>;
    confirmPhoneSignup: (confirmationResult: any, otp: string, name: string, farm: string) => Promise<void>;
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
                // Try to get data from Firestore first
                let extra: any = {};
                try {
                    const userDoc = await getDoc(doc(db, "users", fbUser.uid));
                    if (userDoc.exists()) {
                        extra = userDoc.data();
                        logger.debug("Fetched user profile from Firestore", extra);
                        // Update local storage to keep it in sync
                        localStorage.setItem(`${USER_DATA_KEY}_${fbUser.uid}`, JSON.stringify(extra));
                    } else {
                        // Fallback to local storage
                        const stored = localStorage.getItem(`${USER_DATA_KEY}_${fbUser.uid}`);
                        extra = stored ? JSON.parse(stored) : {};
                        logger.debug("User profile not in Firestore, using local storage fallback");
                    }
                } catch (error) {
                    logger.error("Error fetching user data from Firestore", error);
                    // Fallback to local storage on error
                    const stored = localStorage.getItem(`${USER_DATA_KEY}_${fbUser.uid}`);
                    extra = stored ? JSON.parse(stored) : {};
                }

                setUser({
                    id: fbUser.uid,
                    username: fbUser.email?.split('@')[0] || fbUser.phoneNumber || 'User',
                    full_name: fbUser.displayName || extra.full_name || 'Agri User',
                    role: 'FARMER',
                    farm_name: extra.farm_name || 'My Farm',
                    latitude: extra.latitude || 36.7783,
                    longitude: extra.longitude || -119.4179,
                    avatarUrl: fbUser.photoURL || undefined,
                    phoneNumber: extra.phoneNumber || fbUser.phoneNumber || undefined
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signup = async (email: string, pass: string, name: string, farm: string, phoneNumber?: string) => {
        logger.info(`Starting signup process for ${email}...`);
        try {
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            logger.info("Firebase User created successfully", { uid: res.user.uid });
            await updateProfile(res.user, { displayName: name });

            const userData = {
                uid: res.user.uid,
                full_name: name,
                email: email,
                farm_name: farm,
                role: 'FARMER',
                latitude: 36.7783,
                longitude: -119.4179,
                createdAt: new Date().toISOString(),
                phoneNumber: phoneNumber || null
            };

            // Store in localStorage immediately for quick access
            localStorage.setItem(`${USER_DATA_KEY}_${res.user.uid}`, JSON.stringify(userData));

            // Firestore write is non-blocking — don't let it break signup
            try {
                await setDoc(doc(db, "users", res.user.uid), userData);
                logger.debug("User profile saved to Firestore");
            } catch (firestoreError) {
                logger.error("Firestore write failed during signup (user still created)", firestoreError);
            }
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
            const res = await signInWithPopup(auth, googleProvider);

            try {
                const userDoc = await getDoc(doc(db, "users", res.user.uid));

                if (!userDoc.exists()) {
                    const userData = {
                        uid: res.user.uid,
                        full_name: res.user.displayName,
                        email: res.user.email,
                        farm_name: "My Farm",
                        role: 'FARMER',
                        latitude: 36.7783,
                        longitude: -119.4179,
                        createdAt: new Date().toISOString(),
                        phoneNumber: res.user.phoneNumber || null,
                        avatarUrl: res.user.photoURL
                    };
                    await setDoc(doc(db, "users", res.user.uid), userData);
                    localStorage.setItem(`${USER_DATA_KEY}_${res.user.uid}`, JSON.stringify(userData));
                }
            } catch (firestoreError) {
                console.error("Firestore sync failed during Google login (user still authenticated):", firestoreError);
            }
        } catch (error: any) {
            throw new Error(getAuthErrorMessage(error));
        }
    };

    const startPhoneSignup = async (phoneNumber: string, appVerifier: any) => {
        return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    };

    const confirmPhoneSignup = async (confirmationResult: any, otp: string, name: string, farm: string) => {
        const res = await confirmationResult.confirm(otp);
        const user = res.user;

        // Check if user exists, if not create
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            await updateProfile(user, { displayName: name });
            const userData = {
                uid: user.uid,
                full_name: name,
                email: null, // Phone auth might not have email
                farm_name: farm,
                role: 'FARMER',
                latitude: 36.7783,
                longitude: -119.4179,
                createdAt: new Date().toISOString(),
                phoneNumber: user.phoneNumber
            };
            await setDoc(doc(db, "users", user.uid), userData);
            localStorage.setItem(`${USER_DATA_KEY}_${user.uid}`, JSON.stringify(userData));
        }
    };

    const setUpRecaptcha = (elementId: string) => {
        const recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
            'size': 'invisible',
            'callback': (response: any) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
        });
        return recaptchaVerifier;
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

        // Only update if location actually changed (avoid infinite re-renders)
        if (
            Math.abs(currentUser.latitude - lat) < 0.0001 &&
            Math.abs(currentUser.longitude - lon) < 0.0001
        ) return;

        const updated = { ...currentUser, latitude: lat, longitude: lon };
        setUser(updated);

        // Persist to localStorage
        const stored = localStorage.getItem(`${USER_DATA_KEY}_${fbUser.uid}`);
        const extra = stored ? JSON.parse(stored) : {};
        localStorage.setItem(`${USER_DATA_KEY}_${fbUser.uid}`, JSON.stringify({ ...extra, latitude: lat, longitude: lon }));

        // Persist to Firestore (non-blocking)
        setDoc(doc(db, "users", fbUser.uid), { latitude: lat, longitude: lon }, { merge: true })
            .catch((err) => console.error("Firestore location update failed:", err));
    }, []);

    // Auto-detect and continuously watch GPS location
    useEffect(() => {
        if (!user || typeof window === 'undefined' || !navigator.geolocation) return;

        // Only start watching once per session
        if (watchIdRef.current !== null) return;

        setLocationLoading(true);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                updateLocation(latitude, longitude);
                setLocationLoading(false);
            },
            (err) => {
                console.error("GPS watch error:", err);
                setLocationLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 30000 // Cache for 30s to avoid excessive updates
            }
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
            (err) => {
                console.error("Location detection failed:", err);
                setLocationLoading(false);
            },
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
