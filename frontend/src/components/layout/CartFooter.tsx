"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../../context/cart-context";

const CartFooter = () => {
  const { itemCount, totalAmount } = useCart();
  const pathname = usePathname();

  // Only show in marketplace, but hide on the checkout page itself
  const isMarketplacePage = pathname?.startsWith("/marketplace");
  const isCheckoutPage = pathname === "/marketplace/checkout";

  if (itemCount === 0 || !isMarketplacePage || isCheckoutPage) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] px-4 sm:px-6 lg:px-8 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <Link 
          href="/marketplace/checkout"
          className="flex items-center justify-between bg-gray-900 text-white p-4 rounded-[2rem] shadow-2xl shadow-green-900/20 active:scale-95 transition-all group border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-green-600 flex items-center justify-center text-lg shadow-lg shadow-green-600/20 group-hover:rotate-12 transition-transform">
              🛒
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 leading-none mb-1">
                {itemCount} {itemCount === 1 ? "Item" : "Items"} in Cart
              </p>
              <p className="text-lg font-black tracking-tight">
                ₹{totalAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-2xl group-hover:bg-green-600 transition-colors">
            <span className="text-[11px] font-black uppercase tracking-widest">Checkout</span>
            <span className="text-xl">➔</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default CartFooter;
