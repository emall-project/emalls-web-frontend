import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IoCheckmarkCircleOutline, IoReceiptOutline } from "react-icons/io5";

export default function OrderSuccessPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const orders    = location.state?.orders ?? [];

  return (
    <div dir="rtl" className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md w-full">

        <IoCheckmarkCircleOutline className="text-7xl text-green-500 mx-auto mb-6" />

        <h1 className="text-2xl md:text-3xl font-light tracking-wide text-black mb-3">
          تم تقديم طلبك بنجاح!
        </h1>
        <p className="text-sm font-light text-black/50 mb-8 leading-relaxed">
          سيتم مراجعة طلبك من قِبل المتجر وتحديث حالته في أقرب وقت.
        </p>

        {orders.length > 0 && (
          <div className="border border-black/10 p-5 mb-8 text-right">
            <p className="text-xs tracking-widest uppercase text-black/40 font-light mb-3">
              أرقام الطلبات
            </p>
            {orders.map(order => (
              <button
                key={order.shopOrderId}
                onClick={() => navigate(`/orders/${order.shopOrderId}`)}
                className="w-full flex items-center justify-between py-2.5 border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors group px-1"
              >
                <span className="text-sm font-light text-black/60 group-hover:text-black transition-colors">
                  {order.storeName ?? `طلب #${order.shopOrderId}`}
                </span>
                <span className="text-xs text-black/40 font-mono flex items-center gap-1">
                  <IoReceiptOutline className="text-xs" />
                  #{order.shopOrderId}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/orders")}
            className="flex-1 h-12 bg-black text-white text-sm font-light tracking-widest uppercase hover:bg-black/90 transition-colors"
          >
            عرض طلباتي
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 h-12 border border-black/10 text-sm font-light text-black/60 hover:bg-black hover:text-white hover:border-black transition-all duration-300"
          >
            متابعة التسوق
          </button>
        </div>
      </div>
    </div>
  );
}
