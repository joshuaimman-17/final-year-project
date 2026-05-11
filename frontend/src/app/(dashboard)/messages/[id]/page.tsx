"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { chatService, userService } from "@/services";
import { ChatMessage, ChatThread } from "@/types";
import { User } from "@/types/user";

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadDetails, setThreadDetails] = useState<ChatThread | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const [msgsData, threadsData, userData] = await Promise.all([
          chatService.getMessages(roomId),
          chatService.getThreads(),
          userService.getMe()
        ]);
        setMessages(msgsData);
        setCurrentUser(userData);
        // Find the specific thread to get participant details
        const currentThread = threadsData.find(t => t.id === roomId);
        if (currentThread) setThreadDetails(currentThread);
      } catch (error) {
        console.error("Failed to load chat:", error);
      } finally {
        setLoading(false);
      }
    };
    if (roomId) fetchChatData();
  }, [roomId]);

  const handleSend = async () => {
    if (!msg.trim()) return;
    try {
      const newMsg = await chatService.sendMessage(roomId, msg);
      setMessages(prev => [...prev, newMsg]);
      setMsg("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-100 p-4 flex items-center space-x-4 shadow-sm">
        <button onClick={() => router.back()} className="text-xl p-2">←</button>
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl shadow-inner">
           {threadDetails?.participant_role === 'EXPERT' ? '👨‍🔬' : threadDetails?.participant_role === 'BUYER' ? '📦' : '🚜'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-gray-900 leading-none mb-1">
             {threadDetails ? threadDetails.participant_name : "Loading..."}
          </h3>
          <div className="flex items-center space-x-1">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Now</span>
          </div>
        </div>
        <button className="p-2 opacity-50">📞</button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
        <div className="text-center">
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-100">Today</span>
        </div>

        {loading ? (
           <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Loading chat...</div>
        ) : messages.length === 0 ? (
           <div className="text-center py-20 opacity-30">
             <p className="font-black uppercase tracking-widest text-xs">No messages yet</p>
           </div>
        ) : (
          messages.map((m) => {
            // Compare sender_id with current user id
            const isMe = m.sender_id === currentUser?.id;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium shadow-sm ${
                  isMe 
                    ? 'bg-green-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {m.content}
                  <div className={`text-[8px] mt-2 opacity-60 font-bold ${isMe ? 'text-right' : 'text-left'}`}>
                    {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 pb-8">
        <div className="bg-gray-100 rounded-3xl px-4 py-2 flex items-center space-x-3 focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
          <button className="text-xl opacity-40">📎</button>
          <input 
            type="text" 
            placeholder="Type a message..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent border-none py-3 outline-none text-sm font-medium text-gray-800"
          />
          <button 
            onClick={handleSend}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${msg ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
             ➔
          </button>
        </div>
      </div>
    </div>
  );
}
