"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // Allow public marketplace paths
      const isMarketplace = pathname.startsWith("/marketplace");
      const isRestrictedMarketplace = pathname.startsWith("/marketplace/seller") || 
                                      pathname.startsWith("/marketplace/checkout") ||
                                      pathname.startsWith("/orders");
      const isPublicPath = isMarketplace && !isRestrictedMarketplace;

      if (!isPublicPath) {
        router.push("/login");
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
