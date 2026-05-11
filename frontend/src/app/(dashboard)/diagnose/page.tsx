"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { diagnosisService } from "@/services";
import { Diagnosis } from "@/types";

export default function DiagnosisHistoryPage() {
  const [history, setHistory] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await diagnosisService.getHistory();
        setHistory(data);
      } catch (error) {
        console.error("Failed to fetch diagnosis history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-bold text-gray-900">Health History</h2>
        <button className="bg-gray-100 p-2 rounded-xl">🔍</button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <div className="text-5xl mb-4">🔬</div>
            <p className="text-lg font-medium">No previous diagnoses found.</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 active:scale-98 transition-transform cursor-pointer">
              <div className="w-16 h-16 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0 relative">
                 {item.image_url ? (
                   <img src={item.image_url} alt={item.crop_type} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 opacity-20"></div>
                 )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 truncate">{item.ai_result?.suggested_disease || "Processing..."}</h3>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{item.crop_type} • {new Date(item.created_at).toLocaleDateString()}</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${item.ai_result?.confidence_score || 0}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-green-600">{Math.round(item.ai_result?.confidence_score || 0)}% AI</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
