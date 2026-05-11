"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useCart } from "@/context/cart-context";
import { marketplaceService, farmService } from "@/services";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<any>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("GPay");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const data = await farmService.listFarms();
        setFarms(data);
        if (data.length > 0) setSelectedFarm(data[0]);
      } catch (err) {
        console.error("Failed to fetch farms", err);
      } finally {
        setLoadingFarms(false);
      }
    };
    fetchFarms();
  }, []);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use Nominatim (OpenStreetMap) for free reverse geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();

          if (data && data.display_name) {
            setManualAddress(data.display_name);
          } else {
            setManualAddress(`Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`);
          }
          setUseManual(true);
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          setManualAddress(`Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`);
          setUseManual(true);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error(error);
        alert("Failed to get your location. Please enter manually.");
        setIsLocating(false);
      }
    );
  };

  if (items.length === 0 && step < 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-6xl">🛒</div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900">Your Cart is Empty</h2>
          <p className="text-gray-500 font-medium">Add some fresh produce from the marketplace!</p>
        </div>
        <button
          onClick={() => router.push('/marketplace')}
          className="bg-green-600 text-white font-black px-8 py-4 rounded-2xl active:scale-95 transition-transform"
        >
          Go to Marketplace
        </button>
      </div>
    );
  }

  const deliveryFee = totalAmount > 1000 ? 0 : 40;
  const platformFee = 5;
  const finalTotal = totalAmount + deliveryFee + platformFee;

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      await marketplaceService.placeOrder({
        items: items.map(item => ({
          listing_id: item.id,
          quantity: item.quantity
        })),
        total_price: finalTotal,
        payment_method: paymentMethod,
        shipping_address: useManual ? manualAddress : (selectedFarm ? selectedFarm.name : "Default Address")
      });
      clearCart();
      setStep(3);
    } catch (error) {
      console.error("Order failed", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-30 border-b border-gray-100 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-xl">←</button>
        <h2 className="text-lg font-black text-gray-900">Checkout</h2>
      </div>

      <div className="space-y-3 p-3">
        {/* Section 1: Address */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
            1. Delivery Address
          </h3>

          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setUseManual(false)}
                className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!useManual ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
              >
                Saved Farms
              </button>
              <button
                onClick={() => setUseManual(true)}
                className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${useManual ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
              >
                Manual Entry
              </button>
            </div>

            {!useManual ? (
              loadingFarms ? (
                <div className="h-20 bg-gray-50 rounded-lg animate-pulse"></div>
              ) : farms.length > 0 ? (
                <div className="space-y-2">
                  {farms.map((farm) => (
                    <div
                      key={farm.id}
                      onClick={() => setSelectedFarm(farm)}
                      className={`p-4 rounded-xl border-2 cursor-pointer relative transition-all ${selectedFarm?.id === farm.id ? 'border-green-600 bg-green-50/30' : 'border-gray-50'}`}
                    >
                      <div className="font-bold text-gray-900 text-sm">{farm.name}</div>
                      <div className="text-[10px] text-gray-500">{farm.size_acres} Acres • {farm.farm_type}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 text-center py-4">No saved farms found. Use manual entry.</p>
              )
            ) : (
              <div className="space-y-3">
                <textarea
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="House No., Street Name, City, Pincode"
                  className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm font-medium focus:ring-1 focus:ring-green-600 min-h-[80px] placeholder:text-gray-300"
                />
                <button
                  onClick={handleUseLocation}
                  disabled={isLocating}
                  className="w-full py-3 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {isLocating ? "Locating..." : "📍 Use My Current Location"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Payment */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">2. Payment Method</h3>
          <div className="space-y-2">
            {[
              { id: "GPay", name: "Google Pay (UPI)", icon: "📱" },
              { id: "COD", name: "Cash on Delivery", icon: "💵" }
            ].map((method) => (
              <div
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${paymentMethod === method.id ? 'border-green-600 bg-green-50/30' : 'border-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{method.icon}</span>
                  <span className="font-bold text-gray-800 text-sm">{method.name}</span>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-green-600' : 'border-gray-200'}`}>
                  {paymentMethod === method.id && <div className="w-2 h-2 bg-green-600 rounded-full"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Price Details */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-3">Price Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Price ({items.length} items)</span>
              <span className="text-gray-900 font-bold">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Platform Fee</span>
              <span className="text-gray-900 font-bold">₹{platformFee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Delivery Charges</span>
              <span className={`font-bold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {deliveryFee === 0 ? 'FREE Delivery' : `₹${deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between text-base font-black border-t border-dashed border-gray-100 pt-3 text-gray-900">
              <span>Total Amount</span>
              <span>₹{finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Policy Notice */}
        <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
          <span className="text-xl">🛡️</span>
          <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
            Safe & Secure Payments. Easy returns and 100% authentic produce guaranteed by Dr. Plant.
          </p>
        </div>
        {/* Inline Fallback Button */}
        <div className="p-4 pt-8">
          <button 
             onClick={() => {
               if (!useManual && !selectedFarm) {
                 alert("Please select a delivery address");
                 return;
               }
               if (useManual && !manualAddress) {
                 alert("Please enter your delivery address");
                 return;
               }
               handlePlaceOrder();
             }}
             disabled={isPlacingOrder}
             className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all uppercase text-sm tracking-widest border-2 border-yellow-600/20"
          >
            {isPlacingOrder ? "Processing..." : "Complete Order"}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {step === 3 && (
        <div className="fixed inset-0 bg-white z-[1000] flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="text-8xl animate-bounce">🌻</div>
          <h3 className="text-3xl font-black text-gray-900">Success!</h3>
          <p className="text-gray-500 font-medium">Your order has been placed successfully. You can track it in your dashboard.</p>
          <button
            onClick={() => router.push('/orders')}
            className="w-full bg-green-600 text-white font-black py-5 rounded-2xl active:scale-95 transition-all"
          >
            Go to Orders
          </button>
        </div>
      )}

      {/* Sticky Bottom Bar */}
      {step < 3 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 p-4 z-[999] flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div>
            <div className="text-lg font-black text-gray-900">₹{finalTotal.toLocaleString()}</div>
            <div className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Total Payable</div>
          </div>
          <button
            onClick={() => {
              if (!useManual && !selectedFarm) {
                alert("Please select a delivery address");
                return;
              }
              if (useManual && !manualAddress) {
                alert("Please enter your delivery address");
                return;
              }
              handlePlaceOrder();
            }}
            disabled={isPlacingOrder}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-black px-10 py-4 rounded-lg shadow-xl active:scale-95 transition-all uppercase text-xs tracking-widest"
          >
            {isPlacingOrder ? "Processing..." : "Complete Order"}
          </button>
        </div>
      )}
    </div>
  );
}
