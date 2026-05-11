"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { chatService } from "@/services";
import { ChatThread } from "@/types";

export default function MessengerInboxPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const data = await chatService.getThreads();
        setThreads(data);
      } catch (error) {
        console.error("Failed to fetch chat threads:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black text-gray-900">Messages</h2>
        <button className="bg-gray-100 w-10 h-10 rounded-xl flex items-center justify-center">🔍</button>
      </div>

      <div className="space-y-2">
        {loading ? (
           <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Loading messages...</div>
        ) : threads.length === 0 ? (
           <div className="text-center py-20 opacity-30">
             <div className="text-5xl mb-4">💬</div>
             <p className="font-black uppercase tracking-widest text-xs">No active threads</p>
           </div>
        ) : (
          threads.map((thread) => (
            <Link 
              key={thread.id} 
              href={`/messages/${thread.id}`}
              className="flex items-center space-x-4 p-4 rounded-[1.5rem] hover:bg-white hover:shadow-md transition-all group active:scale-98"
            >
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl shadow-inner group-hover:bg-green-50 transition-colors">
                {thread.participant_role === 'EXPERT' ? '👨‍🔬' : thread.participant_role === 'BUYER' ? '📦' : '🚜'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <div className="flex items-center space-x-2">
                     <h3 className="font-bold text-gray-900 truncate">{thread.participant_name}</h3>
                     <span className="text-[8px] font-black bg-gray-100 px-1.5 py-0.5 rounded uppercase text-gray-500">
                       {thread.participant_role}
                     </span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">
                    {thread.last_message_time ? new Date(thread.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                <p className={`text-sm truncate ${thread.unread_count > 0 ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium'}`}>
                  {thread.last_message}
                </p>
              </div>
              {thread.unread_count > 0 && (
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-green-200">
                  {thread.unread_count}
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
