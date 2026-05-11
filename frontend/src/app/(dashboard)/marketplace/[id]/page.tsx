"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { marketplaceService } from "@/services";
import { useCart } from "@/context/cart-context";
import ProductCard from "@/components/marketplace/ProductCard";

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [listing, setListing] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, clearCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await marketplaceService.getListing(id);
        setListing(data);
        
        // Fetch similar products in the same category
        if (data.category) {
          const similar = await marketplaceService.searchListings({ category: data.category });
          setSimilarProducts(similar.filter((p: any) => p.id !== id).slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-bold animate-pulse">Loading listing details...</div>;
  }

  if (!listing) {
    return <div className="p-8 text-center text-red-500 font-bold">Listing not found.</div>;
  }

  const handleAddToCart = () => {
    addToCart({
      id: listing.id,
      name: listing.crop_name,
      price: listing.price_per_unit,
      quantity: quantity,
      unit: listing.unit,
      image: listing.image_urls?.[0],
      sellerId: listing.seller_id
    });
    alert("Added to cart!");
  };

  const handleBuyNow = () => {
    clearCart();
    addToCart({
      id: listing.id,
      name: listing.crop_name,
      price: listing.price_per_unit,
      quantity: quantity,
      unit: listing.unit,
      image: listing.image_urls?.[0],
      sellerId: listing.seller_id
    });
    router.push('/marketplace/checkout');
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Product Image Header */}
      <div className="aspect-square bg-gray-100 rounded-[2.5rem] overflow-hidden relative shadow-inner">
         <button 
           onClick={() => router.back()}
           className="absolute top-6 left-6 w-12 h-12 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg z-10"
         >
           ←
         </button>
         
         {listing.image_urls && listing.image_urls.length > 0 ? (
           <img src={listing.image_urls[0]} alt={listing.crop_name} className="w-full h-full object-cover" />
         ) : (
           <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100"></div>
         )}
         
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
         <div className="absolute bottom-8 left-8 right-8 text-white z-10">
            <div className="bg-green-600 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">{listing.category}</div>
            <h2 className="text-3xl font-black mb-1">{listing.crop_name}</h2>
            <p className="text-sm font-medium opacity-80">Quantity available: {listing.available_quantity} {listing.unit}</p>
         </div>
      </div>

      <div className="px-2 space-y-8">
        {/* Pricing & Quantity */}
        <div className="flex justify-between items-end">
           <div>
             <span className="text-4xl font-black text-gray-900">₹{listing.price_per_unit}</span>
             <span className="text-lg text-gray-400 font-bold ml-1">/ {listing.unit}</span>
           </div>
           <div className="flex items-center space-x-4 bg-gray-100 p-2 rounded-2xl">
             <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 bg-white rounded-xl shadow-sm font-black text-xl active:scale-95 transition-transform">-</button>
             <span className="font-black text-lg w-6 text-center">{quantity}</span>
             <button onClick={() => setQuantity(Math.min(listing.available_quantity, quantity + 1))} className="w-10 h-10 bg-white rounded-xl shadow-sm font-black text-xl active:scale-95 transition-transform">+</button>
           </div>
        </div>

        {/* Seller Info */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
           <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">🚜</div>
              <div>
                <div className="font-bold text-gray-900">Verified Seller</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Farm ID: {listing.farm_id.substring(0,8)}...</div>
              </div>
           </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
           <h3 className="font-bold text-gray-900 text-lg">Product Details</h3>
           <p className="text-sm text-gray-500 leading-relaxed font-medium">
             {listing.title || `Premium quality ${listing.crop_name} listed by local farmer. Freshly harvested and ready for order.`}
           </p>
        </div>

        {/* Inline Action Buttons */}
        <div className="flex gap-4 pt-2">
           <button 
             onClick={handleAddToCart}
             className="flex-1 bg-yellow-400 text-gray-900 font-black py-4 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
           >
             Add to Cart
           </button>
           <button 
             onClick={handleBuyNow}
             className="flex-1 bg-orange-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg"
           >
             Buy Now
           </button>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-gray-900 italic">Similar Products</h3>
              <button className="text-xs font-black text-blue-600 uppercase tracking-widest">See All</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} listing={p} />
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-100 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
           <div className="max-w-lg mx-auto flex gap-3">
             <button 
               onClick={() => {
                 if (!localStorage.getItem("access_token")) {
                   router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
                 } else {
                   handleAddToCart();
                 }
               }}
               className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-4 rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
             >
               Add to Cart
             </button>
             <button 
               onClick={() => {
                 if (!localStorage.getItem("access_token")) {
                   router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
                 } else {
                   handleBuyNow();
                 }
               }}
               className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg"
             >
               Buy Now • ₹{(listing.price_per_unit * quantity).toFixed(2)}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
