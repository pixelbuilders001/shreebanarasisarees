"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyCashfreePayment, triggerOrderNotificationEmail } from '../../../data/supabase';
import { useStore } from '../../../context/StoreContext';
import { trackPurchase } from '../../../lib/gtag';
import { CheckCircle, XCircle, Loader2, ShoppingBag, ArrowRight } from 'lucide-react';

function StatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useStore();
  const orderId = searchParams.get('order_id');

  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'FAILED' | 'PENDING'>('PENDING');
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setPaymentStatus('FAILED');
      return;
    }

    verifyCashfreePayment(orderId)
      .then((res) => {
        if (res && res.order_status === 'PAID') {
          setPaymentStatus('PAID');
          setOrderDetails(res);
          clearCart(); // Clear local cart upon verified paid status

          // Fire GA4 Purchase Event once
          if (typeof window !== 'undefined' && orderId) {
            const pKey = `sbs_ga_purchased_${orderId}`;
            if (!sessionStorage.getItem(pKey)) {
              sessionStorage.setItem(pKey, 'true');
              trackPurchase({
                orderId: orderId,
                total: res.order_amount || 0,
                shipping: 0,
                paymentMethod: 'Online Payment (Cashfree)',
                items: []
              });
            }
          }
        } else {
          setPaymentStatus('FAILED');
        }
      })
      .catch((err) => {
        console.error('Payment verification failed:', err);
        setPaymentStatus('FAILED');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCF9F3] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-cream shadow-xl text-center space-y-4 max-w-md w-full">
          <Loader2 className="w-12 h-12 text-maroon animate-spin mx-auto" />
          <h2 className="font-serif text-xl font-bold text-dark-brown">Verifying Payment...</h2>
          <p className="text-xs text-dark-brown/60">
            Please wait while we confirm your payment details with Cashfree. Do not refresh or close this tab.
          </p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'PAID') {
    return (
      <div className="min-h-screen bg-[#FCF9F3] text-dark-brown flex flex-col font-sans">
        <header className="bg-white border-b border-cream py-4 px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center select-none">
              <img
                src="/brand_logo.webp"
                alt="Shree Banarasi Sarees Logo"
                className="h-10 sm:h-12 w-auto object-contain rounded-full border border-gold/25"
              />
              <div className="flex flex-col ml-2 text-left">
                <span className="font-serif text-base sm:text-lg font-extrabold text-maroon tracking-wider leading-none">
                  Shree
                </span>
                <span className="text-[8px] sm:text-[9px] text-gold font-bold tracking-[0.15em] uppercase mt-0.5 font-serif leading-none">
                  Banarasi Sarees
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-dark-brown/70 bg-cream/35 border border-[#C9A45C]/20 px-3 py-1.5 rounded-full">
              <span className="text-emerald-600 font-bold">✓</span> Payment Verified
            </div>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-12 flex-grow w-full">
          <div className="bg-white border border-[#C9A45C]/30 p-8 rounded-2xl shadow-xl space-y-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-maroon via-gold to-maroon"></div>

            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-maroon">
                Payment Successful!
              </h2>
              <p className="text-sm text-dark-brown/70 max-w-md">
                Your payment has been received and your order is confirmed.
              </p>
            </div>

            <div className="bg-[#FFF9F0] w-full p-5 rounded-xl border border-cream space-y-3 text-xs text-left">
              <div className="flex justify-between border-b border-cream pb-2 font-bold text-dark-brown">
                <span>Order Reference:</span>
                <span className="text-maroon font-mono uppercase">{orderId}</span>
              </div>
              {orderDetails?.cf_order_id && (
                <div className="flex justify-between">
                  <span>Cashfree Ref ID:</span>
                  <span className="font-mono text-dark-brown/70">{orderDetails.cf_order_id}</span>
                </div>
              )}
              {orderDetails?.order_amount && (
                <div className="flex justify-between font-bold text-dark-brown text-sm pt-1">
                  <span>Amount Paid:</span>
                  <span className="text-maroon">₹{orderDetails.order_amount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="w-full space-y-3 pt-2">
              <button
                onClick={() => router.push('/account')}
                className="w-full py-3.5 bg-maroon text-[#FFF9F0] rounded-xl font-serif font-bold text-xs sm:text-sm tracking-widest uppercase hover:bg-maroon-dark transition-all shadow-md cursor-pointer"
              >
                View Order Details & Status
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full py-3 bg-white border border-cream text-dark-brown rounded-xl font-serif font-bold text-xs uppercase hover:bg-cream/20 transition-all cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF9F3] text-dark-brown flex flex-col font-sans">
      <header className="bg-white border-b border-cream py-4 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center select-none">
            <img
              src="/brand_logo.webp"
              alt="Shree Banarasi Sarees Logo"
              className="h-10 sm:h-12 w-auto object-contain rounded-full border border-gold/25"
            />
            <div className="flex flex-col ml-2 text-left">
              <span className="font-serif text-base sm:text-lg font-extrabold text-maroon tracking-wider leading-none">
                Shree
              </span>
              <span className="text-[8px] sm:text-[9px] text-gold font-bold tracking-[0.15em] uppercase mt-0.5 font-serif leading-none">
                Banarasi Sarees
              </span>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12 flex-grow w-full">
        <div className="bg-white border border-red-200 p-8 rounded-2xl shadow-xl space-y-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
            <XCircle size={36} />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-red-700">
              Payment Incomplete or Failed
            </h2>
            <p className="text-sm text-dark-brown/70 max-w-md">
              We couldn't verify payment completion for order <span className="font-mono font-bold text-dark-brown">{orderId || 'N/A'}</span>.
            </p>
          </div>

          <div className="p-4 bg-red-50 text-red-800 text-xs font-medium rounded-xl border border-red-100 text-left w-full">
            If your bank account was debited, please wait 15 minutes as Cashfree may reconcile the transaction automatically. Otherwise, you can attempt payment again from your checkout page.
          </div>

          <div className="w-full space-y-3 pt-2">
            <button
              onClick={() => router.push('/checkout')}
              className="w-full py-3.5 bg-maroon text-[#FFF9F0] rounded-xl font-serif font-bold text-xs sm:text-sm tracking-widest uppercase hover:bg-maroon-dark transition-all shadow-md cursor-pointer"
            >
              Return to Checkout
            </button>
            <button
              onClick={() => router.push('/account')}
              className="w-full py-3 bg-white border border-cream text-dark-brown rounded-xl font-serif font-bold text-xs uppercase hover:bg-cream/20 transition-all cursor-pointer"
            >
              Check My Orders
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FCF9F3] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-maroon animate-spin" />
      </div>
    }>
      <StatusContent />
    </Suspense>
  );
}
