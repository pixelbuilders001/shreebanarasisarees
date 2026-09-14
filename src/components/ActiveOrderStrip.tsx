"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../data/supabase';
import { triggerHaptic } from '../utils/haptics';

interface ActiveOrderData {
  id: string;
  order_number?: string;
  total_amount?: number;
  created_at?: string;
  order_status?: string;
}

export function ActiveOrderStrip() {
  const { user } = useStore();
  const [activeOrder, setActiveOrder] = useState<ActiveOrderData | null>(null);

  const fetchOutForDeliveryOrder = useCallback(async () => {
    try {
      // 0. Development / Instant Test Mode via ?test_order=true
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('test_order') === 'true') {
          setActiveOrder({
            id: 'SBS-DEMO-8481',
            order_number: 'SBS-8481',
            total_amount: 5499,
            order_status: 'out_for_delivery',
          });
          return;
        }
      }

      // 1. If user is logged in, look for their latest out_for_delivery order
      if (user?.id) {
        const { data, error } = await supabase
          .from('orders')
          .select('id, order_number, total_amount, created_at, order_status')
          .eq('user_id', user.id)
          .eq('order_status', 'out_for_delivery')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data && data.order_status === 'out_for_delivery') {
          setActiveOrder(data);
          return;
        }
      }

      // 2. Check localStorage for guest or recent order ID
      if (typeof window !== 'undefined') {
        const storedOrderId =
          localStorage.getItem('sbs_active_order_id') ||
          localStorage.getItem('recent_order_id');

        if (storedOrderId) {
          const { data, error } = await supabase
            .from('orders')
            .select('id, order_number, total_amount, created_at, order_status')
            .eq('id', storedOrderId)
            .eq('order_status', 'out_for_delivery')
            .maybeSingle();

          if (!error && data && data.order_status === 'out_for_delivery') {
            setActiveOrder(data);
            return;
          }
        }
      }

      // If no order is out_for_delivery, clear active order
      setActiveOrder(null);
    } catch (err) {
      console.error('Failed to fetch out_for_delivery order:', err);
      setActiveOrder(null);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOutForDeliveryOrder();

    // Re-check whenever customer re-opens/focuses the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOutForDeliveryOrder();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // Gentle 45-second polling only while customer is on the screen
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOutForDeliveryOrder();
      }
    }, 45000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [fetchOutForDeliveryOrder]);

  // Strictly do NOT render if there is no out_for_delivery order
  if (!activeOrder) return null;

  const displayOrderNum =
    activeOrder.order_number || activeOrder.id.slice(0, 8).toUpperCase();

  return (
    <aside
      role="region"
      aria-label="Active delivery order status"
      className="lg:hidden fixed bottom-[calc(3.85rem+env(safe-area-inset-bottom,0px))] inset-x-3 z-30 animate-slide-in-from-bottom pointer-events-auto select-none"
    >
      <div className="bg-[#2A1519] border border-[#B08A3C]/40 text-[#FAF7F0] shadow-[0_10px_32px_rgba(0,0,0,0.32)] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 backdrop-blur-md">
        {/* Left: Pulsating Showroom Rider Icon */}
        <div className="w-10 h-10 rounded-xl bg-white/95 border border-[#B08A3C]/40 p-1 flex items-center justify-center shrink-0 shadow-2xs">
          <img
            src="/expressdel.webp"
            alt="Out for Delivery"
            className="w-full h-full object-contain animate-rider-pulse"
          />
        </div>

        {/* Center: Live Order Status Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-white tracking-tight">Out for Delivery</span>
          </div>
          <p className="text-[11px] text-[#D8CEBA] truncate mt-0.5">
            Order #{displayOrderNum} · Rider on the way
          </p>
        </div>

        {/* Right: Track CTA Button */}
        <Link
          href={`/account?orderId=${encodeURIComponent(activeOrder.id)}`}
          onClick={() => triggerHaptic('selection')}
          className="px-3 py-1.5 rounded-xl bg-[#B08A3C] hover:bg-[#C49D4C] text-[#2A1519] font-bold text-xs flex items-center gap-0.5 shrink-0 shadow-2xs active:scale-95 transition-all cursor-pointer"
        >
          <span>Track</span>
          <ChevronRight size={13} strokeWidth={2.5} />
        </Link>
      </div>
    </aside>
  );
}
