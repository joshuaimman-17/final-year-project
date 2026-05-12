"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Admin Sidebar/Topnav could go here, for now just a simple header */}
      <div className="bg-white border-b border-gray-100 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="text-lg font-black text-gray-900 tracking-tighter flex items-center gap-2">
            <span className="bg-gray-900 text-white p-1 rounded-lg text-xs">AD</span>
            Admin Console
          </Link>
          <div className="flex gap-4">
             <Link href="/admin" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Dashboard</Link>
             <Link href="/admin/users" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Users</Link>
             <Link href="/admin/experts" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Experts</Link>
             <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-green-600 hover:text-green-700 transition-colors">Back to App</Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4">
        {children}
      </div>
    </div>
  );
}
