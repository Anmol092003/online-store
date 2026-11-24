import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import api, { resolveImageUrl, generateIdempotencyKey } from '../api/client';

export default function CartDrawer() {
  const { cart, updateCartQty, clearCart, cartTotal, isCartOpen, setIsCartOpen, user } = useStore();
  const [address, setAddress] = useState('B-18, Green Park Main, New Delhi, 110016');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleRazorpayCheckout = async () => {
    if (!user) {
      setIsCartOpen(false);
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setStatusMsg('Creating idempotent order...');

      // 1. Create Order in Main Service with Idempotency-Key header
      const orderRes = await api.post(
        '/api/orders',
        {
          shippingAddress: address,
          items: cart.map((item) => ({ itemId: item.id, quantity: item.quantity }))
        },
        {
          headers: { 'Idempotency-Key': generateIdempotencyKey() }
        }
      );
      const createdOrder = orderRes.data;

      // 2. Initiate Razorpay Order via Payment Microservice
      setStatusMsg('Connecting to Razorpay...');
      const payRes = await api.post('/api/payments/create-order', {
        appOrderNumber: createdOrder.orderNumber,
        amount: createdOrder.totalAmount
      });
      const payData = payRes.data;

      // Demo simulation if Razorpay API keys are still placeholders
      if (payData.sandboxSimulated) {
        const confirmDemo = window.confirm(
          `Razorpay Checkout (Sandbox Mode — Paste your Razorpay Key ID in payment-service/application.yml for live popup)\n\nOrder: ${createdOrder.orderNumber}\nAmount: ₹${createdOrder.totalAmount}\nEmail Receipt To: ${user.email || 'Registered Account'}\n\nClick OK to complete payment & trigger Kafka + Email confirmation.`
        );
        if (confirmDemo) {
          setStatusMsg('Publishing Kafka payment event...');
          await api.post('/api/payments/verify', {
            appOrderNumber: createdOrder.orderNumber,
            razorpayOrderId: payData.razorpayOrderId,
            razorpayPaymentId: 'pay_demo_' + Date.now(),
            razorpaySignature: 'demo_verified_signature'
          });
          clearCart();
          setIsCartOpen(false);
          navigate('/orders');
        }
        setLoading(false);
        setStatusMsg('');
        return;
      }

      // 3. Live Razorpay Checkout Popup
      const options = {
        key: payData.razorpayKeyId,
        amount: payData.amountInPaise,
        currency: payData.currency,
        name: 'BazaarOne General Store',
        description: `Order #${createdOrder.orderNumber}`,
        order_id: payData.razorpayOrderId,
        handler: async function (response) {
          await api.post('/api/payments/verify', {
            appOrderNumber: createdOrder.orderNumber,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          });
          clearCart();
          setIsCartOpen(false);
          navigate('/orders');
        },
        prefill: {
          name: user.fullName,
          email: user.email || '',
          contact: user.phoneNumber || ''
        },
        theme: {
          color: '#1E6B52'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed. Ensure backend services are running.');
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#FCFBF8] h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">Your Store Basket</h2>
            <p className="text-xs text-slate-500 mt-0.5">Same-day dispatch on general store essentials</p>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-lg text-slate-800">Your basket is empty</p>
              <p className="text-sm text-slate-500 mt-1">Add groceries, gadgets, home goods, or daily items.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <img
                  src={resolveImageUrl(item.imageUrl)}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-xl bg-slate-100"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-slate-500">{item.brand} • {item.unitLabel || '1 Unit'}</p>
                    <p className="text-sm font-bold text-[#1E6B52] mt-1">
                      ₹{Number(item.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateCartQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                    >
                      {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 bg-white border-t border-slate-200 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#1E6B52]"
                placeholder="Enter full shipping address"
              />
            </div>

            {user?.email && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-[#F6F3EC] px-3 py-2 rounded-xl">
                <Mail className="w-3.5 h-3.5 text-[#1E6B52] shrink-0" />
                <span>Order receipt will be emailed to <strong>{user.email}</strong></span>
              </div>
            )}

            <div className="flex items-center justify-between text-base font-bold text-slate-900">
              <span>Total Payable</span>
              <span>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={handleRazorpayCheckout}
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl bg-[#1E6B52] hover:bg-[#16523F] text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-60"
            >
              <span>{loading ? statusMsg : 'Pay Securely with Razorpay'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1E6B52]" />
              Idempotent Checkout • Kafka Verified • Razorpay Secured
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
