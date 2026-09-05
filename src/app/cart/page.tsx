"use client";

import React from 'react';
import { CartView } from '../../components/CartView';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#FAF7F0] pb-24">
      <CartView onBack={() => router.back()} />
    </main>
  );
}
