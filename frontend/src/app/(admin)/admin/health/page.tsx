"use client";

import React, { useState, useEffect } from "react";
import { adminService } from "@/services";

const SystemHealthPage = () => {
  const [healthData, setHealthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const data = await adminService.getSystemHealth();
      setHealthData(data);
    } catch (error) {
      console.error("Failed to fetch system health:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">System Health</h1>
          <p className="text-gray-500 font-medium">Real-time status monitoring for all platform microservices.</p>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchHealth(); }}
          className="bg-white border border-gray-100 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all active:scale-95 shadow-sm"
        >
          Refresh Now
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && healthData.length === 0 ? (
          <div className="col-span-full text-center py-20">
             <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Pinging services...</p>
          </div>
        ) : (
          healthData.map((service) => (
            <div key={service.name} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden group">
              {/* Status Indicator */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 transition-colors duration-500 ${
                service.status === "UP" ? "bg-green-500/5" : "bg-red-500/5"
              }`}></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  service.status === "UP" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}>
                  {service.status}
                </div>
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-1 capitalize">{service.name}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Microservice</p>

              <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Latency</span>
                <span className="text-xs font-bold text-gray-900">{service.latency}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Infrastructure Note */}
      <div className="bg-gray-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-2">Infrastructure Overview</h3>
          <p className="text-sm text-gray-400 mb-6">All services are currently running on high-performance nodes with automatic failover and load balancing.</p>
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Load: Low</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Uptime: 99.9%</span>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
      </div>
    </div>
  );
};

export default SystemHealthPage;
