"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyCashfreePayment, triggerOrderNotificationEmail } from '../../../data/supabase';
import { useStore } from '../../../context/StoreContext';
import { trackPurchase } from '../../../lib/gtag';
import { CheckCircle, XCircle, Loader2, ShoppingBag, ArrowRight, Check, Zap } from 'lucide-react';

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
    const paidAmount = orderDetails?.order_amount || 0;

    return (
      <div className="min-h-screen bg-[#FAF7F0] text-[#292524] flex flex-col justify-center items-center font-sans py-10 sm:py-16 px-4">
        <main className="max-w-md w-full mx-auto">
          {/* Status Check Icon */}
          <div className="w-16 h-16 rounded-full bg-[#6B1725] text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Check size={32} strokeWidth={2.5} className="text-white" />
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#292524] text-center mb-2">
            Order placed
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#7A6E65] text-center max-w-sm mx-auto leading-relaxed mb-6 font-sans">
            Your online payment has been confirmed. Our master weavers are carefully inspecting and packing your saree now.
          </p>

          {/* Card 1: Order & Payment Summary */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5DEC9] shadow-2xs mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-sans font-medium text-[#7A6E65] uppercase tracking-wider">
                ORDER
              </span>
              <span className="font-bold text-sm text-[#292524]">
                {orderId}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-sans font-medium text-[#7A6E65] uppercase tracking-wider">
                PAYING
              </span>
              <span className="font-bold text-sm text-[#292524]">
                ₹{paidAmount.toLocaleString('en-IN')} · paid online
              </span>
            </div>

            <div className="border-t border-[#F3ECE0] my-3.5" />

            <div className="flex items-start gap-3">
              <Zap size={18} className="text-[#6B1725] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#292524]">
                  Arriving in 3–5 business days
                </p>
                <p className="text-xs text-[#7A6E65] mt-0.5">
                  To your delivery address
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs: Maroon Account Tracker & Cream Keep Browsing */}
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/account?orderId=${encodeURIComponent(orderId || '')}`)}
              className="w-full py-4 bg-[#6B1725] hover:bg-[#52111C] text-white rounded-full font-medium text-sm transition-all shadow-md active:scale-[0.99] cursor-pointer text-center block"
            >
              Track order in account
            </button>

            <button
              onClick={() => router.push('/sarees')}
              className="w-full py-4 bg-[#FAF7F0] hover:bg-[#F3ECE0] border border-[#E5DEC9] text-[#292524] rounded-full font-medium text-sm transition-all active:scale-[0.99] cursor-pointer text-center block"
            >
              Keep browsing
            </button>
          </div>

          {/* Peace of mind delivery note */}
          <p className="text-center text-xs text-[#7A6E65] max-w-xs mx-auto mt-6 leading-relaxed font-sans">
            Open the packet in front of the rider. If the weave isn&apos;t what you saw, hand it straight back — no questions.
          </p>
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
