"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminService } from "@/services";
import { PlatformStat } from "@/types";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getPlatformStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 leading-tight">Admin Hub</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Platform Governance</p>
        </div>
        <div className="bg-red-100 text-red-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-pulse">
          Live Audit
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-10 text-gray-500 font-bold animate-pulse">Loading platform metrics...</div>
        ) : stats.length === 0 ? (
          <div className="col-span-2 text-center py-10 text-gray-500 font-bold">No metrics available.</div>
        ) : (
          stats.map((s) => (
            <div key={s.label} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="text-2xl">{s.icon}</div>
                  <div className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                    s.change.startsWith('+') ? 'bg-green-100 text-green-600' : 
                    s.change === 'Urgent' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {s.change}
                  </div>
               </div>
               <div className="text-2xl font-black text-gray-900 mb-1">{s.value}</div>
               <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{s.label}</div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 text-lg px-1">Management Queues</h3>
        <div className="space-y-3">
           <button className="w-full bg-gray-900 text-white p-6 rounded-[2rem] flex justify-between items-center group active:scale-98 transition-transform shadow-xl shadow-gray-200">
              <div className="text-left">
                 <div className="font-bold mb-1">Expert Approvals</div>
                 <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pending Applications</div>
              </div>
              <span className="text-xl group-hover:translate-x-2 transition-transform">➔</span>
           </button>
           <button className="w-full bg-white text-gray-900 border border-gray-100 p-6 rounded-[2rem] flex justify-between items-center group active:scale-98 transition-transform shadow-sm">
              <div className="text-left">
                 <div className="font-bold mb-1">Content Moderation</div>
                 <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Flagged Posts</div>
              </div>
              <span className="text-xl group-hover:translate-x-2 transition-transform">➔</span>
           </button>
        </div>
      </div>
    </div>
  );
}
