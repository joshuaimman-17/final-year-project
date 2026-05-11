"use client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const sections = [
    { title: "Account", items: ["Personal Info", "Language & Region", "Security & Password"] },
    { title: "Notifications", items: ["Marketplace Alerts", "Community Activity", "Expert Recommendations"] },
    { title: "Support", items: ["Help Center", "Terms of Service", "Privacy Policy"] },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center space-x-4">
        <button onClick={() => router.back()} className="text-2xl p-2">←</button>
        <h2 className="text-2xl font-black text-gray-900">Settings</h2>
      </div>

      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">{section.title}</h3>
             <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                {section.items.map((item, idx) => (
                  <button 
                    key={item} 
                    className={`w-full p-6 text-left flex justify-between items-center group active:bg-gray-50 transition-colors ${
                      idx !== section.items.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <span className="font-bold text-gray-800 text-sm">{item}</span>
                    <span className="text-gray-300 group-hover:text-green-600 transition-colors">➔</span>
                  </button>
                ))}
             </div>
          </div>
        ))}
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
        <p className="text-center text-[10px] text-gray-300 font-bold mt-8 uppercase tracking-widest">Version 1.0.4 • Dr. Plant PWA</p>
      </div>
    </div>
  );
}
