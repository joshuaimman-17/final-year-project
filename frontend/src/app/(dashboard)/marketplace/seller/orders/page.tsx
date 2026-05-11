"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { marketplaceService } from "@/services";
import { useAuth } from "@/context/auth-context";
import { Order } from "@/types/marketplace";

export default function FarmerOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const history = await marketplaceService.getOrderHistory();
        // Filter orders where the current user is the seller
        const sellerOrders = history.filter(order => order.seller_id === user?.id);
        setOrders(sellerOrders);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("Could not load orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await marketplaceService.updateOrderStatus(orderId, newStatus);
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
        <div className="h-32 w-full bg-gray-50 rounded-2xl animate-pulse"></div>
        <div className="h-32 w-full bg-gray-50 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-black text-gray-900 leading-tight">Incoming Orders</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Manage your product sales</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold text-center">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-sm text-gray-500">When customers buy your products, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order ID</div>
                  <div className="font-bold text-gray-900 text-sm truncate w-32">{order.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Earned</div>
                  <div className="text-lg font-black text-green-600">₹{order.total_amount.toLocaleString()}</div>
                </div>
              </div>

              <div className="border-t border-gray-50 pt-4">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Shipping Details</div>
                <p className="text-sm font-medium text-gray-700">
                  {typeof order.shipping_address === 'string' 
                    ? order.shipping_address 
                    : JSON.stringify(order.shipping_address)}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    order.status === 'PLACED' ? 'bg-blue-50 text-blue-600' :
                    order.status === 'SHIPPED' ? 'bg-orange-50 text-orange-600' :
                    order.status === 'DELIVERED' ? 'bg-green-50 text-green-600' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {order.status}
                  </span>
                </div>
                
                {order.status === 'PLACED' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                    disabled={updatingId === order.id}
                    className="bg-gray-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {updatingId === order.id ? "Packing..." : "Pack & Ship"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
