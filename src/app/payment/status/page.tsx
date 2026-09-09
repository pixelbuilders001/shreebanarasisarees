"use client";

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function StatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (orderId) {
      router.replace(`/account?orderId=${encodeURIComponent(orderId)}`);
    } else {
      router.replace('/account');
    }
  }, [orderId, router]);

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-[#E5DEC9] shadow-md text-center space-y-4 max-w-md w-full">
        <Loader2 className="w-10 h-10 text-[#6B1725] animate-spin mx-auto" />
        <h2 className="font-serif text-lg font-bold text-[#292524]">Redirecting to your orders...</h2>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6B1725] animate-spin" />
      </div>
    }>
      <StatusContent />
    </Suspense>
  );
}
