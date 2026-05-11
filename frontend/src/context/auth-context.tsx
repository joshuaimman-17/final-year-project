"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types/user";
import { userService } from "../services/user-service";
import { cookieUtils } from "../utils/cookie";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = cookieUtils.get("auth_token") || localStorage.getItem("auth_token");
        if (token) {
          try {
            const userData = await userService.getMe();
            setUser(userData);
            // Sync cookie if only in localStorage
            if (!cookieUtils.get("auth_token")) {
              cookieUtils.set("auth_token", token);
            }
          } catch (error) {
            console.error("Failed to fetch user:", error);
            localStorage.removeItem("auth_token");
            cookieUtils.remove("auth_token");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("auth_token", token);
    cookieUtils.set("auth_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    cookieUtils.remove("auth_token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
