"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExpertApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center space-x-4">
        <button onClick={() => router.back()} className="text-2xl">←</button>
        <div>
          <h2 className="text-2xl font-black text-gray-900 leading-tight">Become an Expert</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Verification Application</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="flex justify-between items-center px-4">
         {[1, 2, 3].map((s) => (
           <div key={s} className="flex items-center flex-1 last:flex-none">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${step >= s ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-100 text-gray-400'}`}>
               {s}
             </div>
             {s < 3 && <div className={`h-1 flex-1 mx-2 rounded-full ${step > s ? 'bg-green-600' : 'bg-gray-100'}`}></div>}
           </div>
         ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
             <h4 className="font-bold text-blue-900 mb-2">Why join as an Expert?</h4>
             <ul className="text-sm text-blue-800 space-y-2 font-medium">
               <li className="flex items-start"><span className="mr-2">✓</span> Provide paid consultations to farmers</li>
               <li className="flex items-start"><span className="mr-2">✓</span> Verify AI diagnosis results</li>
               <li className="flex items-start"><span className="mr-2">✓</span> Earn the verified agronomist badge</li>
             </ul>
           </div>

           <div className="space-y-4">
             <label className="block px-1 text-xs font-black uppercase tracking-widest text-gray-400">Professional Bio</label>
             <textarea 
               placeholder="Describe your agricultural background and expertise..."
               className="w-full h-32 p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-sm transition-all"
             ></textarea>
           </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="space-y-4">
             <label className="block px-1 text-xs font-black uppercase tracking-widest text-gray-400">Certification / ID</label>
             <div className="border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center bg-gray-50/50 group hover:border-green-400 transition-colors cursor-pointer">
               <div className="text-4xl mb-4 opacity-40 group-hover:scale-110 transition-transform">📄</div>
               <p className="text-sm font-bold text-gray-900">Upload PDF or JPEG</p>
               <p className="text-[10px] text-gray-400 font-medium">Govt. issued ID or University degree</p>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
             {["Agronomy", "Soil Science", "Pest Control", "Irrigation"].map((specialty) => (
               <button key={specialty} className="p-4 border border-gray-100 bg-white rounded-2xl text-sm font-bold text-gray-700 hover:border-green-600 transition-all">
                 {specialty}
               </button>
             ))}
           </div>
        </div>
      )}

      <div className="pt-4">
        {step < 3 ? (
          <button 
            onClick={() => setStep(step + 1)}
            className="w-full bg-green-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-green-100 active:scale-95 transition-transform"
          >
            Next Step
          </button>
        ) : (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-black text-gray-900">Application Submitted!</h3>
            <p className="text-sm text-gray-500 font-medium px-4">Our team will review your documents within 48 hours. You will receive a notification via the messenger.</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl active:scale-95 transition-transform"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
