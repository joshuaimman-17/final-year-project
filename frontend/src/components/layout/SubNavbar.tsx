"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/auth-context";
import { UserRole } from "../../types/user";
import { NAVIGATION_CONFIG } from "../../config/navigation";

const SubNavbar = () => {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  // Find the active main navigation item based on the current path
  const activeMainItem = NAVIGATION_CONFIG.find((item) => {
    // Check if current path matches main item href
    const isMainMatch = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    if (isMainMatch) return true;

    // Also check if current path matches any of its sub-items
    return item.subNavItems?.some(subItem => 
      subItem.href === "/" ? pathname === "/" : pathname.startsWith(subItem.href)
    );
  });

  if (!activeMainItem || !activeMainItem.subNavItems) return null;

  const filteredItems = activeMainItem.subNavItems.filter((item) => {
    // If sub-item has explicit roles, use them. 
    // Otherwise, inherit from the parent (activeMainItem).
    const roles = item.allowedRoles || activeMainItem.allowedRoles;
    
    if (roles === "ALL") return true;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return roles === user.role;
  });

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm sticky top-[104px] z-40 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-2 py-2 min-w-max">
          {filteredItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${
                  isActive
                    ? "bg-green-600 text-white shadow-md shadow-green-100"
                    : "text-gray-500 hover:bg-gray-50 hover:text-green-600"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubNavbar;
