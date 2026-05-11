"use client";
import { useParams, useRouter } from "next/navigation";

export default function DiagnosisResultPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center space-x-4 mb-4">
        <button onClick={() => router.back()} className="text-2xl">←</button>
        <h2 className="text-2xl font-black text-gray-900">Diagnosis Result</h2>
      </div>

      {/* Main Image */}
      <div className="aspect-square bg-gray-200 rounded-[2.5rem] overflow-hidden shadow-inner relative">
         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
         <div className="absolute bottom-6 left-6 text-white">
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">CROP TYPE</div>
            <div className="text-lg font-black">Potato (Russet)</div>
         </div>
         {/* Placeholder for actual leaf image */}
         <div className="w-full h-full bg-green-900/10"></div>
      </div>

      {/* Result Card */}
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl -mt-12 relative z-10">
        <div className="flex justify-between items-start mb-6">
           <div>
             <h3 className="text-xl font-black text-gray-900">Early Blight</h3>
             <p className="text-sm text-gray-500 font-medium italic">(Alternaria solani)</p>
           </div>
           <div className="bg-green-100 text-green-700 px-4 py-2 rounded-2xl font-black text-xs">
             AI CONFIRMED
           </div>
        </div>

        <div className="space-y-4 mb-8">
           <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
             <span>Confidence Score</span>
             <span>94.2%</span>
           </div>
           <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
             <div className="h-full bg-green-600 rounded-full" style={{ width: '94%' }}></div>
           </div>
        </div>

        <div className="space-y-6">
           <div>
             <h4 className="font-bold text-gray-900 mb-2">Symptoms Detected</h4>
             <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">●</span> Concentric rings on lower leaves
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">●</span> Yellowing margins (Chlorosis)
                </li>
             </ul>
           </div>

           <div>
             <h4 className="font-bold text-gray-900 mb-2">Recommended Treatment</h4>
             <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
               <p className="text-sm text-blue-900 font-medium leading-relaxed">
                 Apply Mancozeb or Chlorothalonil fungicide. Ensure proper field drainage and remove infected plant debris to prevent soil-borne spread.
               </p>
             </div>
           </div>
        </div>
      </div>

      {/* Expert Verification Section */}
      <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-4">
           <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">👨‍🔬</div>
           <div>
             <div className="text-sm font-bold text-gray-900">Expert Review</div>
             <div className="text-[10px] text-gray-400 font-bold uppercase">Awaiting verification</div>
           </div>
        </div>
        <button className="text-xs font-black text-blue-600 uppercase tracking-widest">Request Now</button>
      </div>
    </div>
  );
}
