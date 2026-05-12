"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/auth-context";
import { UserRole } from "../../types/user";

import { NAVIGATION_CONFIG } from "../../config/navigation";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredMainItems = NAVIGATION_CONFIG.filter((item) => {
    if (item.hideIfAuthenticated && user) return false;
    
    if (item.allowedRoles === "ALL") return true;
    if (!user) return false;
    
    if (Array.isArray(item.allowedRoles)) {
      return item.allowedRoles.includes(user.role);
    }
    return item.allowedRoles === user.role;
  });

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      {/* Row 1: App Branding & User Profile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-gray-50">
        <div className="flex justify-between h-14 items-center">
          {/* Logo */}
          <Link href="/" className="text-xl font-black text-green-700 flex items-center gap-2 italic tracking-tighter">
            <span className="bg-green-100 p-1 rounded-lg not-italic">🌿</span>
            Dr. Plant
          </Link>

          {/* User Info or Auth Links */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-2xl transition-all active:scale-95"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-gray-900 leading-none">{user.full_name}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-green-600 mt-0.5">{user.role}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-green-100 border-2 border-white">
                  {user.full_name[0].toUpperCase()}
                </div>
              </button>

              {/* Dropdown Menu */}
              <div className={`absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl shadow-gray-200 border border-gray-50 py-3 px-2 transition-all transform z-[100] ${isProfileOpen ? 'visible opacity-100 scale-100' : 'invisible opacity-0 scale-95'}`}>
                <div className="px-3 py-3 border-b border-gray-50 mb-2">
                  <p className="text-xs font-black text-gray-900">{user.full_name}</p>
                  <p className="text-[10px] text-gray-400 font-bold truncate">{user.email}</p>
                </div>
                
                <Link 
                  href="/profile" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all"
                >
                  <span className="text-base">👤</span>
                  My Profile
                </Link>
                
                {user.role === "ADMIN" && (
                  <Link 
                    href="/admin" 
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest text-purple-600 hover:bg-purple-50 rounded-2xl transition-all"
                  >
                    <span className="text-base">🛡️</span>
                    Admin Hub
                  </Link>
                )}

                <Link 
                  href="/settings" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all"
                >
                  <span className="text-base">⚙️</span>
                  Settings
                </Link>

                <div className="h-px bg-gray-50 my-2"></div>

                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <span className="text-base">🚪</span>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-green-600 transition-colors"
              >
                Log In
              </Link>
              <Link 
                href="/signup" 
                className="text-[11px] font-black uppercase tracking-widest bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Main Navigation Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-6 h-12 items-center overflow-x-auto no-scrollbar">
          {filteredMainItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-green-600 transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
