"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { diagnosisService } from "@/services";
import { Diagnosis } from "@/types";

export default function ExpertQueuePage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const data = await diagnosisService.getExpertQueue();
        setTasks(data);
      } catch (error) {
        console.error("Failed to fetch expert queue:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-black text-gray-900 leading-tight">Review Queue</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Manual AI Verification</p>
        </div>
        <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-xl flex items-center justify-center font-black">
          {tasks.length}
        </div>
      </div>

      <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
         {["All Tasks", "Low Confidence", "High Urgency", "My Specialty"].map((tab) => (
           <button key={tab} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${tab === 'All Tasks' ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400'}`}>
             {tab}
           </button>
         ))}
      </div>

      <div className="space-y-4">
        {loading ? (
           <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Loading queue...</div>
        ) : tasks.length === 0 ? (
           <div className="text-center py-20 opacity-50">
             <div className="text-5xl mb-4">✅</div>
             <p className="text-lg font-medium">Queue is empty!</p>
           </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center space-x-4 active:scale-98 transition-transform group">
               <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:bg-blue-50 transition-colors overflow-hidden relative">
                 {task.image_url ? (
                    <img src={task.image_url} alt={task.crop_type} className="w-full h-full object-cover" />
                 ) : (
                    task.crop_type === 'Potato' ? '🥔' : task.crop_type === 'Rice' ? '🌾' : '🌾'
                 )}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 truncate">{task.ai_result?.suggested_disease || "Processing..."}</h3>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                      (task.ai_result?.confidence_score || 0) < 50 ? 'bg-red-100 text-red-600' : 
                      (task.ai_result?.confidence_score || 0) < 80 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {(task.ai_result?.confidence_score || 0) < 50 ? 'CRITICAL' : (task.ai_result?.confidence_score || 0) < 80 ? 'HIGH' : 'LOW'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium mb-3">
                    {task.crop_type} • {new Date(task.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center space-x-3">
                     <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                       <div className={`h-full rounded-full ${(task.ai_result?.confidence_score || 0) < 50 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${task.ai_result?.confidence_score || 0}%` }}></div>
                     </div>
                     <span className="text-[10px] font-black text-gray-400">{Math.round(task.ai_result?.confidence_score || 0)}% AI</span>
                  </div>
               </div>
               <button 
                 onClick={() => router.push(`/diagnose/${task.id}`)}
                 className="bg-gray-900 text-white p-3 rounded-xl shadow-lg"
               >
                 ➔
               </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
