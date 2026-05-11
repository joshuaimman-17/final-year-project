"use client";

import React from "react";
import Link from "next/link";
import { Listing } from "@/types/marketplace";
import { useCart } from "@/context/cart-context";

interface ProductCardProps {
  listing: Listing;
}

const ProductCard: React.FC<ProductCardProps> = ({ listing }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: listing.id,
      name: listing.crop_name,
      price: listing.price_per_unit,
      quantity: 1,
      unit: listing.unit,
      image: listing.image_urls?.[0],
      sellerId: listing.seller_id || ""
    });
  };

  const displayImage = listing.image_urls?.[0] || 'https://images.unsplash.com/photo-1595841696662-508c4427c1c7?w=800&auto=format&fit=crop&q=60';
  
  // Mock data for Flipkart style
  const rating = 4.2 + (Math.random() * 0.7);
  const reviewsCount = Math.floor(Math.random() * 500) + 20;
  const originalPrice = listing.price_per_unit * 1.25;
  const discount = 20;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Image Section */}
      <Link href={`/marketplace/${listing.id}`} className="block relative aspect-[1/1] sm:aspect-[4/3] overflow-hidden">
        <img 
          src={displayImage} 
          alt={listing.crop_name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {listing.is_organic && (
            <div className="bg-green-600 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
              Organic
            </div>
          )}
          <div className="bg-white/90 backdrop-blur px-2 py-0.5 rounded-md text-[9px] font-bold text-gray-700 shadow-sm self-start">
            {listing.category}
          </div>
        </div>

        {/* Flipkart style "Assured" badge */}
        <div className="absolute bottom-3 left-3">
           <div className="bg-white px-2 py-0.5 rounded flex items-center gap-1 shadow-md border border-blue-50">
              <span className="text-blue-600 font-black italic text-[9px]">Dr. Plant</span>
              <span className="text-yellow-500 text-[10px]">✨</span>
           </div>
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-4 space-y-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight mb-1 truncate">
            {listing.crop_name}
          </h3>
          
          {/* Ratings */}
          <div className="flex items-center gap-2">
            <div className="bg-green-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
              {rating.toFixed(1)} ★
            </div>
            <span className="text-[10px] text-gray-400 font-bold">({reviewsCount})</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-gray-900">₹{listing.price_per_unit.toLocaleString()}</span>
            <span className="text-xs text-gray-400 line-through">₹{originalPrice.toLocaleString()}</span>
            <span className="text-xs font-black text-green-600">{discount}% off</span>
          </div>
          <div className="text-[10px] text-gray-500 font-medium">/ {listing.unit}</div>
        </div>

        <div className="flex gap-2 pt-2">
           <button 
             onClick={handleAddToCart}
             className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-[10px] font-black uppercase tracking-widest py-2.5 rounded transition-colors active:scale-95"
           >
             Add to Cart
           </button>
           <Link 
            href={`/marketplace/${listing.id}`}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded text-center transition-colors active:scale-95 shadow-md"
          >
            Buy Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
