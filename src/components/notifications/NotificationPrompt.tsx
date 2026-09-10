"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { requestAndSavePushToken } from '../../lib/firebase/messaging';

export default function NotificationPrompt() {
  const pathname = usePathname();
  const { user, showToast } = useStore();
  const [showPrompt, setShowPrompt] = useState(false);


  useEffect(() => {
    if (!user) {
      setShowPrompt(false);
      return;
    }

    // Only show the floating toast on the homepage
    // All other pages have dedicated contextual banners or don't need this interrupt
    if (pathname !== '/') {
      setShowPrompt(false);
      return;
    }

    let timer: NodeJS.Timeout;

    const checkPermissionAndShow = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const forceTest = urlParams.get('test_prompt') === 'true';

      const { isMessagingSupported } = await import('../../lib/firebase/messaging');
      const supported = await isMessagingSupported();
      if (!supported) return;

      if (Notification.permission !== 'default' && !forceTest) {
        return;
      }

      const dismissed = localStorage.getItem('sbs_notifications_dismissed');
      if (dismissed === 'true' && !forceTest) {
        return;
      }

      const delay = forceTest ? 500 : 3500;
      timer = setTimeout(() => {
        setShowPrompt(true);
      }, delay);
    };

    checkPermissionAndShow();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user, pathname]);

  const handleEnable = () => {
    // Close the toast immediately so the user can keep browsing
    setShowPrompt(false);
    localStorage.setItem('sbs_notifications_dismissed', 'true');

    // Run the permission request & FCM token registration silently in the background
    requestAndSavePushToken(user?.id || null)
      .then((res) => {
        if (res.status === 'granted') {
          showToast("Order & dispatch alerts enabled! 🔔", "info");
        } else if (res.status === 'denied') {
          showToast("Notifications are blocked in your browser settings.", "info");
        }
        // unsupported / error — silent, no toast needed
      })
      .catch((err) => {
        console.error("[FCM] Background notification setup error:", err);
      });
  };

  const handleDismiss = () => {
    localStorage.setItem('sbs_notifications_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!user || !showPrompt) {
    return null;
  }

  // Clear, readable notification prompt at top-right — never overlaps bottom nav or PWA install
  return (
    <div className="fixed top-16 sm:top-20 right-3 sm:right-6 left-3 sm:left-auto z-50 bg-[#FFFDF9] border border-[#B08A3C]/40 text-[#292524] p-4 rounded-2xl shadow-[0_10px_30px_rgba(41,37,36,0.15)] max-w-sm animate-slideDown backdrop-blur-md">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-[#7A6E65] hover:text-[#6B1725] p-1 rounded-full hover:bg-[#FAF7F0] transition-colors cursor-pointer"
        aria-label="Dismiss prompt"
      >
        <X size={15} />
      </button>

      <div className="flex gap-3 items-start pr-4">
        <div className="w-8 h-8 rounded-full bg-[#6B1725]/10 text-[#6B1725] flex items-center justify-center shrink-0 mt-0.5">
          <Bell size={16} />
        </div>
        
        <div className="flex-1">
          <h4 className="font-serif font-bold text-sm text-[#292524] leading-snug">
            Stay updated on your orders 🔔
          </h4>
          <p className="text-xs text-[#7A6E65] mt-1 mb-3 leading-relaxed font-sans">
            Turn on notifications to get instant alerts when your sarees are packed, dispatched, and out for delivery.
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnable}
              className="bg-[#6B1725] hover:bg-[#52111C] active:scale-[0.98] text-white text-xs font-semibold py-2 px-3.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bell size={13} />
              <span>Turn On Alerts</span>
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-[#7A6E65] hover:text-[#292524] px-2 py-1.5 font-medium transition-colors cursor-pointer"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
