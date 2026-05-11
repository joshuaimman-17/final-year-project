"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { marketplaceService } from "@/services";
import { Order } from "@/types";

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await marketplaceService.getOrderHistory();
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black text-gray-900">Orders</h2>
        <div className="bg-gray-100 px-3 py-1 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-widest">Buyer View</div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-lg font-medium">No previous orders found.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6 active:scale-98 transition-transform">
               <div className="flex justify-between items-start">
                  <div>
                     <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{order.id.slice(0, 8)}</div>
                     <h3 className="text-lg font-black text-gray-900">
                       {order.items && order.items.length > 0 ? order.items[0].product_name : 'Order Items'}
                     </h3>
                     <p className="text-xs text-gray-500 font-medium">
                       {new Date(order.created_at).toLocaleDateString()}
                     </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
                    order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {order.status || 'PENDING'}
                  </div>
               </div>

               {/* Order Stepper */}
               <div className="flex justify-between items-center px-2">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className={`w-3 h-3 rounded-full ${
                        (order.status === 'SHIPPED' && s <= 3) || (order.status === 'DELIVERED') ? 'bg-green-500' : 'bg-gray-100'
                      }`}></div>
                      {s < 4 && <div className={`h-0.5 flex-1 mx-1 rounded-full ${
                        (order.status === 'SHIPPED' && s < 3) || (order.status === 'DELIVERED') ? 'bg-green-500' : 'bg-gray-100'
                      }`}></div>}
                    </div>
                  ))}
               </div>

               <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                  <span className="text-lg font-black text-gray-900">₹{order.total_amount}</span>
                  <button className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl">Details</button>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
