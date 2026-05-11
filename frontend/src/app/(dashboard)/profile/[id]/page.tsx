"use client";
import { useParams, useRouter } from "next/navigation";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();

  return (
    <div className="space-y-8 pb-20">
      {/* Profile Header */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16"></div>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-green-100 rounded-[2rem] flex items-center justify-center text-4xl mb-4 shadow-inner">
            🚜
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">Joshua Immanuel</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Progressive Farmer • District A</p>
          
          <div className="grid grid-cols-3 gap-8 w-full border-t border-gray-50 pt-6">
            <div>
              <div className="text-xl font-black text-gray-900">12</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Farms</div>
            </div>
            <div>
               <div className="text-xl font-black text-green-600">4.9</div>
               <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rating</div>
            </div>
            <div>
              <div className="text-xl font-black text-gray-900">1.2k</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sales</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Score Section */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold">Trust Score</h3>
             <span className="bg-green-600 text-[10px] font-black px-3 py-1 rounded-full">VERIFIED</span>
          </div>
          <div className="flex items-baseline space-x-2 mb-6">
             <span className="text-4xl font-black italic">982</span>
             <span className="text-xs text-gray-500 font-bold uppercase">/ 1000</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
             <div className="h-full bg-green-500 rounded-full" style={{ width: '98%' }}></div>
          </div>
        </div>
      </div>

      {/* Activity Tabs */}
      <div className="space-y-4">
        <div className="flex space-x-6 border-b border-gray-100 pb-2 px-1">
          <button className="text-sm font-black text-gray-900 border-b-2 border-green-600 pb-2">Posts</button>
          <button className="text-sm font-bold text-gray-400 pb-2">Listings</button>
          <button className="text-sm font-bold text-gray-400 pb-2">Reviews</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
             <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100"></div>
           </div>
           <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
             <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100"></div>
           </div>
        </div>
      </div>

      <div className="px-2">
        <button 
          onClick={() => {
            localStorage.removeItem("auth_token");
            window.location.href = "/login";
          }}
          className="w-full py-5 text-red-500 font-black text-sm uppercase tracking-widest border-2 border-red-50 rounded-3xl hover:bg-red-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
