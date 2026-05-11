import { UserRole } from "../types/user";

export interface SubNavItem {
  label: string;
  href: string;
  icon: string;
  allowedRoles?: UserRole | UserRole[] | "ALL";
}

export interface MainNavItem {
  label: string;
  href: string;
  allowedRoles: UserRole | UserRole[] | "ALL";
  subNavItems?: SubNavItem[];
  hideIfAuthenticated?: boolean;
}

export const NAVIGATION_CONFIG: MainNavItem[] = [
  {
    label: "Home",
    href: "/",
    allowedRoles: "ALL",
    hideIfAuthenticated: true,
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    allowedRoles: "FARMER",
    subNavItems: [
      { label: "Overview", href: "/dashboard", icon: "📊" },
      { label: "Analytics", href: "/dashboard/analytics", icon: "📈" },
      { label: "Reports", href: "/dashboard/reports", icon: "📋" },
    ],
  },
  {
    label: "Farm Management",
    href: "/farms",
    allowedRoles: ["FARMER"],
    subNavItems: [
      { label: "My Farms", href: "/farms", icon: "🚜" },
      { label: "Fields", href: "/farms/fields", icon: "📍" },
      { label: "Sensors", href: "/farms/sensors", icon: "📡" },
    ],
  },
  {
    label: "Diagnostics",
    href: "/diagnose",
    allowedRoles: ["FARMER", "EXPERT"],
    subNavItems: [
      { label: "New Diagnosis", href: "/diagnose/new", icon: "📸" },
      { label: "History", href: "/diagnose", icon: "📜" },
      { label: "Expert Review", href: "/expert/queue", icon: "👨‍🔬" },
      { label: "Risk Analysis", href: "/diagnose/risk", icon: "⚠️" },
    ],
  },
  {
    label: "Marketplace",
    href: "/marketplace",
    allowedRoles: "ALL",
    subNavItems: [
      { label: "Home", href: "/marketplace", icon: "🏠" },
      { label: "Cart", href: "/marketplace/checkout", icon: "🛒" },
      { label: "Orders", href: "/orders", icon: "🧾" },
      { label: "Sell Goods", href: "/marketplace/seller", icon: "📦", allowedRoles: "FARMER" },
      { label: "Manage Orders", href: "/marketplace/seller/orders", icon: "📋", allowedRoles: "FARMER" },
    ],
  },
  {
    label: "Community",
    href: "/community",
    allowedRoles: ["FARMER", "EXPERT", "ADMIN"],
    subNavItems: [
      { label: "Feed", href: "/community/feed", icon: "📰" },
      { label: "Discussions", href: "/community/discussions", icon: "💬" },
      { label: "Groups", href: "/community/groups", icon: "👥" },
    ],
  },
  {
    label: "Expert Hub",
    href: "/experts",
    allowedRoles: ["EXPERT", "ADMIN"],
    subNavItems: [
      { label: "Consultations", href: "/experts/consultations", icon: "🗓️" },
      { label: "Knowledge Base", href: "/experts/kb", icon: "📚" },
    ],
  },
  {
    label: "Admin",
    href: "/admin",
    allowedRoles: ["ADMIN"],
    subNavItems: [
      { label: "Users", href: "/admin/users", icon: "👥" },
      { label: "System Health", href: "/admin/health", icon: "🩺" },
      { label: "Settings", href: "/admin/settings", icon: "⚙️" },
    ],
  },
];
