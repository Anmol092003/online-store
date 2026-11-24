import React, { useEffect, useState } from 'react';
import { Package, CheckCircle2, Clock, MailCheck } from 'lucide-react';
import api, { resolveImageUrl } from '../api/client';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/orders/my')
      .then((res) => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-slate-900">Your Orders</h1>
        <p className="text-sm text-slate-500 mt-1">Track purchases, Razorpay payment receipts, and email confirmations</p>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <Package className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="font-display text-lg text-slate-800">No orders placed yet</p>
          <p className="text-sm text-slate-500 mt-1">Items you checkout will appear here immediately.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order ID</span>
                  <h3 className="text-base font-bold text-slate-900">{order.orderNumber}</h3>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Total Paid</span>
                  <span className="text-base font-bold text-slate-900">
                    ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {order.status === 'PAID' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#1E6B52] text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Paid via Razorpay
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" /> {order.status}
                    </span>
                  )}

                  {order.emailNotificationSent && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold">
                      <MailCheck className="w-3.5 h-3.5" /> Email Sent
                    </span>
                  )}
                </div>
              </div>

              {order.razorpayPaymentId && (
                <p className="text-xs text-slate-500 mt-3">
                  Razorpay Payment ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{order.razorpayPaymentId}</code>
                </p>
              )}

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {order.items?.map((line) => (
                  <div key={line.id} className="flex items-center gap-3 bg-[#FCFBF8] border border-slate-100 p-3 rounded-xl">
                    <img
                      src={resolveImageUrl(line.imageUrl)}
                      alt={line.itemName}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{line.itemName}</p>
                      <p className="text-xs text-slate-500">
                        Qty: {line.quantity} × ₹{Number(line.unitPrice).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
