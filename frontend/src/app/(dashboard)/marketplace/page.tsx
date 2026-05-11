"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { marketplaceService } from "@/services";
import { Listing } from "@/types/marketplace";
import ProductCard from "@/components/marketplace/ProductCard";

export default function MarketplacePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");

  const categories = [
    { name: "All", icon: "🌐" },
    { name: "Grains", icon: "🌾" },
    { name: "Pulses", icon: "🫘" },
    { name: "Oilseeds", icon: "🌻" },
    { name: "Vegetables", icon: "🥦" },
  ];

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const data = await marketplaceService.searchListings({ category: category !== "All" ? category : undefined });
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [category]);

  return (
    <div className="space-y-6 pt-0 pb-24">
      {/* Search Header - Flipkart Style */}
      <div className="bg-green-700 px-4 py-4 sticky top-0 z-30 shadow-md">
        <div className="relative">
          <input
            suppressHydrationWarning
            type="text"
            placeholder="Search for crops, seeds or equipment"
            className="w-full pl-12 pr-4 py-3 bg-white border-none rounded shadow-inner focus:ring-0 transition-all outline-none text-sm font-medium"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
        </div>
      </div>

      {/* Category Navigation - Icon Style */}
      <div className="bg-white px-4 py-4 flex space-x-8 overflow-x-auto no-scrollbar shadow-sm border-b border-gray-50">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setCategory(cat.name)}
            suppressHydrationWarning
            className="flex flex-col items-center flex-shrink-0 group"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-1.5 transition-all ${category === cat.name ? 'bg-green-100 scale-110 shadow-inner' : 'bg-gray-50'}`}>
              {cat.icon}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${category === cat.name ? 'text-green-700' : 'text-gray-500'}`}>
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      {/* Sectioned Grid */}
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-lg font-black text-gray-900 italic">Featured Near You</h3>
           <button className="text-xs font-black text-blue-600 uppercase tracking-widest">View All</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl animate-pulse"></div>
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl">
              <div className="text-5xl mb-4 grayscale opacity-20">🛒</div>
              <h3 className="text-lg font-black text-gray-900">No products found</h3>
            </div>
          ) : (
            products.map((p) => (
              <ProductCard key={p.id} listing={p} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
