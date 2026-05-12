"use client";

import React, { useState, useEffect } from "react";
import { adminService } from "@/services";

const ExpertApprovalsPage = () => {
  const [pendingExperts, setPendingExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingExperts();
  }, []);

  const fetchPendingExperts = async () => {
    try {
      const data = await adminService.getPendingExperts();
      setPendingExperts(data);
    } catch (error) {
      console.error("Failed to fetch pending experts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(userId);
    try {
      await adminService.verifyExpert(userId, status, status === 'REJECTED' ? "Credentials did not meet platform standards." : undefined);
      setPendingExperts((prev) => prev.filter((p) => p.user_id !== userId));
      alert(`Expert ${status.toLowerCase()} successfully!`);
    } catch (error) {
      console.error(`Failed to ${status.toLowerCase()} expert:`, error);
      alert(`Error processing verification.`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Expert Verifications</h1>
        <p className="text-gray-500 font-medium">Review and approve applications for the Expert role.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center py-20">
             <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading applications...</p>
          </div>
        ) : pendingExperts.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm">
             <div className="text-5xl mb-4">🎉</div>
             <h3 className="text-lg font-black text-gray-900 mb-1">Queue is Clear</h3>
             <p className="text-gray-400 text-sm">All pending expert applications have been processed.</p>
          </div>
        ) : (
          pendingExperts.map((expert) => (
            <div key={expert.user_id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex gap-6 items-center">
                <div className="w-16 h-16 rounded-3xl bg-blue-100 flex items-center justify-center text-2xl shadow-inner">
                  👨‍🔬
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-1">{expert.full_name || "Applicant"}</h3>
                  <div className="flex gap-3 items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                      {expert.specialization}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      License: {expert.license_number}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => handleVerify(expert.user_id, 'REJECTED')}
                  disabled={processingId === expert.user_id}
                  className="flex-1 md:flex-none px-6 py-3 border-2 border-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleVerify(expert.user_id, 'APPROVED')}
                  disabled={processingId === expert.user_id}
                  className="flex-1 md:flex-none px-8 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-xl shadow-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingId === expert.user_id ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : "Approve"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExpertApprovalsPage;
