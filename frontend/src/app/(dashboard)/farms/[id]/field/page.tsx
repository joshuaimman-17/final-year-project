"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { farmService } from "@/services";
import { Farm, Field } from "@/types/farm";

export default function FieldMapPage() {
  const params = useParams();
  const farmId = params.id as string;
  const router = useRouter();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarmData = async () => {
      try {
        const farms = await farmService.listFarms();
        const currentFarm = farms.find(f => f.id === farmId);
        if (currentFarm) {
          setFarm(currentFarm);
          if (currentFarm.fields && currentFarm.fields.length > 0) {
            setField(currentFarm.fields[0]); // Show the first field for now
          }
        }
      } catch (error) {
        console.error("Failed to fetch farm data", error);
      } finally {
        setLoading(false);
      }
    };
    if (farmId) fetchFarmData();
  }, [farmId]);

  if (loading) {
    return <div className="fixed inset-0 bg-gray-900 z-[60] flex items-center justify-center text-white font-bold animate-pulse">Loading Satellite Data...</div>;
  }

  if (!farm) {
    return <div className="fixed inset-0 bg-gray-900 z-[60] flex flex-col items-center justify-center text-white space-y-4">
      <p className="font-bold">Farm details not found.</p>
      <button onClick={() => router.back()} className="px-6 py-2 bg-white text-gray-900 rounded-full font-black">Go Back</button>
    </div>;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-[60] flex flex-col">
      {/* Map Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-900 active:scale-95 transition-transform"
        >
          ←
        </button>
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-lg flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold text-gray-900">GPS Active</span>
        </div>
        <button className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
          🛰️
        </button>
      </div>

      {/* Map Simulation */}
      <div className="flex-1 relative bg-gray-800 overflow-hidden">
        {/* Placeholder for Satellite Map */}
        <div className="absolute inset-0 opacity-40">
           <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900 via-gray-900 to-black"></div>
        </div>
        
        {/* Polygon Drawing (Uses backend field if available, else blank canvas) */}
        {field ? (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Visual representation of the field */}
            <polygon 
              points="100,200 300,250 350,450 150,500" 
              className="fill-green-500/30 stroke-green-400 stroke-2"
            />
            <circle cx="100" cy="200" r="4" className="fill-white stroke-green-500 stroke-2" />
            <circle cx="300" cy="250" r="4" className="fill-white stroke-green-500 stroke-2" />
            <circle cx="350" cy="450" r="4" className="fill-white stroke-green-500 stroke-2" />
            <circle cx="150" cy="500" r="4" className="fill-white stroke-green-500 stroke-2" />
          </svg>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-50">
             <p className="text-white font-bold bg-black/50 px-4 py-2 rounded-xl backdrop-blur">Tap to map your field boundary</p>
          </div>
        )}

        {/* Drawing Tools */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-2">
          <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-xl active:scale-95 transition-transform">⬠</button>
          <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-xl active:scale-95 transition-transform">✂️</button>
          <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-xl active:scale-95 transition-transform">📏</button>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="bg-white rounded-t-[2.5rem] p-8 shadow-2xl relative z-10">
        <div className="w-12 h-1.5 bg-gray-200 mx-auto rounded-full mb-6"></div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">{farm.name}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
              {field ? `${field.area_hectares} Hectares` : "Boundary not set"} • {farm.village || "Unknown Location"}
            </p>
          </div>
          <div className="text-right">
            <div className={`font-black text-xl ${field ? 'text-green-600' : 'text-gray-400'}`}>
              {field ? 'HEALTHY' : 'PENDING'}
            </div>
            {field && <div className="text-[10px] text-gray-400 font-bold uppercase">NDVI: 0.74</div>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-gray-50 p-3 rounded-2xl text-center">
            <div className="text-xs text-gray-400 font-bold mb-1">SOIL</div>
            <div className="text-sm font-black text-gray-800">{field?.soil_type_baseline || "Unknown"}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-2xl text-center">
            <div className="text-xs text-gray-400 font-bold mb-1">WATER</div>
            <div className="text-sm font-black text-gray-800">{field?.irrigation_type || "Unknown"}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-2xl text-center">
            <div className="text-xs text-gray-400 font-bold mb-1">STATUS</div>
            <div className="text-sm font-black text-gray-800">{field ? "Mapped" : "Setup"}</div>
          </div>
        </div>

        <button className="w-full bg-green-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-green-100 active:scale-95 transition-transform">
          {field ? "Update Boundary" : "Save Boundary"}
        </button>
      </div>
    </div>
  );
}
