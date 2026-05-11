"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { marketplaceService, farmService } from "@/services";
import { Farm } from "@/types";

export default function SellerDashboardPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    farm_id: "",
    title: "",
    category: "Grains",
    price_per_unit: "",
    unit: "kg",
    available_quantity: "",
    description: ""
  });

  useEffect(() => {
    const loadFarms = async () => {
      try {
        const data = await farmService.listFarms();
        setFarms(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, farm_id: data[0].id }));
        }
      } catch (err) {
        console.error("Failed to load farms", err);
      } finally {
        setLoadingFarms(false);
      }
    };
    loadFarms();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.farm_id) {
      setError("You must select a farm. Please register a farm first.");
      return;
    }
    if (!formData.title || !formData.price_per_unit || !formData.available_quantity) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await marketplaceService.createListing({
        farm_id: formData.farm_id,
        crop_name: formData.title, // Map title to crop_name for backend API
        title: formData.title,
        category: formData.category,
        price_per_unit: parseFloat(formData.price_per_unit),
        unit: formData.unit,
        available_quantity: parseFloat(formData.available_quantity),
      });
      
      router.push('/marketplace');
    } catch (err) {
      console.error(err);
      setError("Failed to create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-20">
      <div className="flex items-center space-x-4 px-1">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center font-bold text-gray-700">
          ←
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900 leading-tight">Seller Dashboard</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Create New Listing</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Source Farm *</label>
            {loadingFarms ? (
              <div className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-transparent font-medium text-gray-400 animate-pulse">Loading farms...</div>
            ) : farms.length === 0 ? (
              <div className="w-full bg-red-50 px-5 py-4 rounded-2xl border border-transparent font-medium text-red-600 text-sm">You have no registered farms. Please register a farm first.</div>
            ) : (
              <div className="relative">
                <select 
                  name="farm_id"
                  value={formData.farm_id}
                  onChange={handleChange}
                  className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-transparent focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all font-bold text-gray-900 appearance-none"
                >
                  {farms.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.village || f.district || 'Local'})</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Product Title *</label>
            <input 
              type="text" 
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Organic Basmati Rice"
              className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-transparent focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all font-bold text-gray-900 placeholder:font-medium placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Category</label>
            <div className="relative">
              <select 
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-transparent focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all font-bold text-gray-900 appearance-none"
              >
                <option value="Grains">Grains</option>
                <option value="Pulses">Pulses</option>
                <option value="Oilseeds">Oilseeds</option>
                <option value="Vegetables">Vegetables</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Price (₹) *</label>
              <input 
                type="number" 
                name="price_per_unit"
                value={formData.price_per_unit}
                onChange={handleChange}
                placeholder="e.g. 85"
                className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-transparent focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all font-bold text-gray-900 placeholder:font-medium placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Unit</label>
              <div className="relative">
                <select 
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-transparent focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all font-bold text-gray-900 appearance-none"
                >
                  <option value="kg">per kg</option>
                  <option value="ton">per ton</option>
                  <option value="quintal">per quintal</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Available Quantity *</label>
            <input 
              type="number" 
              name="available_quantity"
              value={formData.available_quantity}
              onChange={handleChange}
              placeholder="e.g. 500"
              className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-transparent focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all font-bold text-gray-900 placeholder:font-medium placeholder:text-gray-400"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || farms.length === 0}
            className={`w-full mt-4 py-4 rounded-2xl font-black text-lg shadow-lg transition-all ${isSubmitting || farms.length === 0 ? 'bg-green-400 text-white/80 cursor-not-allowed shadow-none' : 'bg-green-600 text-white active:scale-98 hover:bg-green-700 shadow-green-200'}`}
          >
            {isSubmitting ? 'Publishing...' : 'List on Marketplace'}
          </button>
        </form>
      </div>
    </div>
  );
}
