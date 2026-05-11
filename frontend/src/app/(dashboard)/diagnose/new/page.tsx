"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { diagnosisService, farmService } from "@/services";
import { Farm } from "@/types";

export default function NewDiagnosisPage() {
  const router = useRouter();
  const [cropName, setCropName] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Farm selection
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const data = await farmService.listFarms();
        setFarms(data);
        if (data.length > 0) {
          setSelectedFieldId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch farms:", err);
      } finally {
        setIsLoadingFarms(false);
      }
    };
    fetchFarms();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropName || !imagePreview || !selectedFieldId) {
      setError("Please select a field, a crop, and upload an image.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      const newDiagnosis = await diagnosisService.submitDiagnosis({
        field_id: selectedFieldId,
        crop_type: cropName,
        image_url: imagePreview,
      });
      
      router.push(`/diagnose/${newDiagnosis.id}`);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || "Failed to submit diagnosis.";
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const SUPPORTED_CROPS = [
    { id: "tomato", name: "Tomato", icon: "🍅" },
    { id: "potato", name: "Potato", icon: "🥔" },
    { id: "rice", name: "Rice", icon: "🌾" },
    { id: "corn", name: "Corn", icon: "🌽" },
    { id: "apple", name: "Apple", icon: "🍎" },
    { id: "peanut", name: "Peanut", icon: "🥜" },
    { id: "other", name: "Other / General", icon: "🌿" },
  ];

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-gray-700 active:scale-90 transition-all border border-gray-50">
            ←
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-900 leading-tight">Plant Scan</h2>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Powered by Dr. Plant AI</p>
          </div>
        </div>
        <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
          Beta
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Selection Area */}
        <div className="space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`aspect-square sm:aspect-video rounded-[2.5rem] border-2 border-dashed ${imagePreview ? 'border-transparent' : 'border-gray-200 bg-gray-50/50'} flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-all hover:bg-gray-50`}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Crop Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-gray-900">Change Image</span>
                </div>
              </>
            ) : (
              <div className="text-center p-8 space-y-4">
                <div className="w-24 h-24 bg-white shadow-xl text-green-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto group-hover:scale-110 transition-transform duration-500">
                  📸
                </div>
                <div>
                  <p className="font-black text-gray-900 text-lg">Upload Field Photo</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">Back camera works best</p>
                </div>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>

          {!imagePreview && (
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col items-center space-y-2 shadow-sm active:scale-95 transition-all"
              >
                <span className="text-2xl">📸</span>
                <span className="text-xs font-bold text-gray-600">Use Camera</span>
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture');
                    fileInputRef.current.click();
                  }
                }}
                className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col items-center space-y-2 shadow-sm active:scale-95 transition-all"
              >
                <span className="text-2xl">🖼️</span>
                <span className="text-xs font-bold text-gray-600">From Gallery</span>
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black text-center border border-red-100 animate-shake">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4 px-1">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Select your field</label>
            <div className="relative">
              {isLoadingFarms ? (
                <div className="w-full bg-gray-50 px-6 py-4 rounded-[1.5rem] border border-gray-100 animate-pulse text-gray-400 font-bold">
                  Loading your fields...
                </div>
              ) : farms.length === 0 ? (
                <div className="w-full bg-orange-50 px-6 py-4 rounded-[1.5rem] border border-orange-100 text-orange-700 font-bold text-sm">
                  No fields registered. Please add a farm first.
                </div>
              ) : (
                <>
                  <select 
                    value={selectedFieldId}
                    onChange={(e) => setSelectedFieldId(e.target.value)}
                    className="w-full bg-white px-6 py-4 rounded-[1.5rem] border border-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-500/5 outline-none transition-all font-bold text-gray-900 appearance-none shadow-sm"
                  >
                    {farms.map(farm => (
                      <option key={farm.id} value={farm.id}>
                        🚜 {farm.name} ({farm.village})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    ▼
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">What crop is this?</label>
            <div className="relative">
              <select 
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full bg-white px-6 py-4 rounded-[1.5rem] border border-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-500/5 outline-none transition-all font-bold text-gray-900 appearance-none shadow-sm"
              >
                <option value="" disabled>Select a crop type...</option>
                {SUPPORTED_CROPS.map(crop => (
                  <option key={crop.id} value={crop.id}>
                    {crop.icon} {crop.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                ▼
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Extra Details (Optional)</label>
            <textarea 
              placeholder="e.g. Yellow spots on bottom leaves, spreads fast..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
              className="w-full bg-white px-6 py-4 rounded-[1.5rem] border border-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-500/5 outline-none transition-all font-bold text-gray-900 placeholder:font-medium placeholder:text-gray-300 shadow-sm resize-none"
            ></textarea>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || !imagePreview}
          className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-2xl transition-all relative overflow-hidden group ${
            isSubmitting || !imagePreview 
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
              : 'bg-green-600 text-white active:scale-95 hover:bg-green-700 shadow-green-200'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Scanning for Diseases...</span>
            </div>
          ) : (
            <>
              <span className="relative z-10">Start AI Diagnosis</span>
              {!imagePreview && <span className="block text-[10px] opacity-50 mt-1 uppercase tracking-widest">Select photo first</span>}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
