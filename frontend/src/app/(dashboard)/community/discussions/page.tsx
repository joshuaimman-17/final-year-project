"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { chatService } from "@/services";
import { ChatMessage } from "@/types";

const DISCUSSION_ROOMS = [
  { id: "global_general", name: "General Discussion", icon: "💬", description: "Talk about anything related to farming & plants" },
  { id: "global_crops", name: "Crop Help", icon: "🌱", description: "Get advice on your specific crops" },
  { id: "global_market", name: "Market Trends", icon: "📈", description: "Discuss pricing and marketplace strategy" },
  { id: "global_tech", name: "AgriTech", icon: "📡", description: "Modern tools and automated farming" }
];

export default function CommunityDiscussionsPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [activeRoom, setActiveRoom] = useState(DISCUSSION_ROOMS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Simulated fetching for global rooms
    const fetchMessages = async () => {
      setLoading(true);
      try {
        // In a real app, we'd fetch from chatService.getMessages(activeRoom.id)
        // Mocking for demonstration
        const mockMessages: ChatMessage[] = [
          { id: "1", sender_id: "system", sender_name: "Dr. Plant Bot", content: `Welcome to the ${activeRoom.name}!`, created_at: new Date().toISOString(), is_read: true },
          { id: "2", sender_id: "user1", sender_name: "Rahul Sharma", content: "Has anyone tried the new organic fertilizer?", created_at: new Date().toISOString(), is_read: true },
          { id: "3", sender_id: "user2", sender_name: "Priya Patel", content: "Yes, it works great for tomatoes!", created_at: new Date().toISOString(), is_read: true },
        ];
        setMessages(mockMessages);
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [activeRoom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender_id: user.id,
      sender_name: user.full_name,
      content: newMessage,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages([...messages, msg]);
    setNewMessage("");
    
    try {
      // await chatService.sendMessage(activeRoom.id, newMessage);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black text-gray-900">Community</h2>
        <Link href="/community/new" className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-green-100 transition-transform active:scale-90">
          +
        </Link>
      </div>

      {/* Community Tabs */}
      <div className="flex p-1.5 bg-gray-100/50 rounded-2xl w-full max-w-md mx-auto">
        <Link 
          href="/community" 
          className={`flex-1 py-3 text-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            !pathname.includes("/discussions") ? "bg-white text-green-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          📰 Feed
        </Link>
        <Link 
          href="/community/discussions" 
          className={`flex-1 py-3 text-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            pathname.includes("/discussions") ? "bg-white text-green-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          💬 Discussions
        </Link>
      </div>

      <div className="flex flex-col h-[calc(100vh-320px)] bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar: Rooms */}
        <div className="w-80 border-r border-gray-50 flex flex-col bg-gray-50/30 overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <span className="text-2xl">💬</span> Discussions
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Community Rooms</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {DISCUSSION_ROOMS.map((room) => (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={`w-full text-left p-4 rounded-2xl transition-all ${
                  activeRoom.id === room.id 
                    ? "bg-white shadow-md border border-gray-100" 
                    : "hover:bg-white/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl bg-gray-100 w-10 h-10 rounded-xl flex items-center justify-center">{room.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm truncate ${activeRoom.id === room.id ? "text-green-600" : "text-gray-900"}`}>
                      {room.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium truncate">{room.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
               <span className="text-3xl">{activeRoom.icon}</span>
               <div>
                 <h3 className="font-black text-gray-900 text-lg">{activeRoom.name}</h3>
                 <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Community</span>
                 </div>
               </div>
            </div>
            <div className="flex gap-2">
               <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors">🔍</button>
               <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors">⚙️</button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, index) => {
              const isMe = msg.sender_id === user?.id;
              const isSystem = msg.sender_id === 'system';
              
              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="bg-gray-50 text-[10px] font-black text-gray-400 px-4 py-1.5 rounded-full uppercase tracking-widest border border-gray-100">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                        {msg.sender_name}
                      </span>
                      <span className="text-[8px] text-gray-300 font-bold">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm ${
                      isMe 
                        ? "bg-green-600 text-white rounded-tr-none" 
                        : "bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-gray-50">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Type a message in ${activeRoom.name}...`}
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none pr-12 transition-all"
                />
                <button 
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform"
                >
                  😊
                </button>
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-green-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
              >
                <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
