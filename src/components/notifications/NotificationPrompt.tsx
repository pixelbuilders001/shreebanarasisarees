"use client";

import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { isMessagingSupported, getFCMToken, saveFCMTokenToSupabase } from '../../lib/firebase/messaging';

export default function NotificationPrompt() {
  const { user, showToast } = useStore();
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("[FCM Prompt] User auth state changed:", user?.email || "Guest/Null");
    if (!user) {
      console.log("[FCM Prompt] No authenticated user detected, prompt will not display.");
      setShowPrompt(false);
      return;
    }

    let timer: NodeJS.Timeout;

    const checkPermissionAndShow = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const forceTest = urlParams.get('test_prompt') === 'true';
      if (forceTest) {
        console.log("[FCM Prompt] Bypassing permission and dismissal checks due to ?test_prompt=true");
      }

      console.log("[FCM Prompt] Checking messaging support...");
      const supported = await isMessagingSupported();
      console.log("[FCM Prompt] Is supported on this browser:", supported);
      if (!supported) return;

      console.log("[FCM Prompt] Notification.permission:", Notification.permission);
      if (Notification.permission !== 'default' && !forceTest) {
        console.log("[FCM Prompt] Notification permission is not 'default', skipping prompt.");
        return;
      }

      const dismissed = localStorage.getItem('sbs_notifications_dismissed');
      console.log("[FCM Prompt] Is dismissed in localStorage:", dismissed);
      if (dismissed === 'true' && !forceTest) {
        console.log("[FCM Prompt] Prompt dismissed previously, skipping prompt.");
        return;
      }

      const delay = forceTest ? 500 : 4000;
      console.log(`[FCM Prompt] Scheduling notification prompt display in ${delay}ms.`);
      timer = setTimeout(() => {
        console.log("[FCM Prompt] Displaying notification opt-in prompt.");
        setShowPrompt(true);
      }, delay);
    };

    checkPermissionAndShow();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [user]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const token = await getFCMToken(registration);
          
          if (token) {
            await saveFCMTokenToSupabase(token, user?.id || null);
            showToast("Notifications enabled successfully! 🔔", "info");
          } else {
            showToast("Could not enable notifications. Please try again.", "info");
          }
        }
      } else if (permission === 'denied') {
        showToast("Notifications are blocked in your browser settings.", "info");
      }
    } catch (err) {
      console.error("[FCM] Error enabling notifications:", err);
      showToast("An error occurred while enabling notifications.", "info");
    } finally {
      setLoading(false);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('sbs_notifications_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!user || !showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 z-40 bg-[#FFF9F0] border border-gold/45 text-dark-brown p-5 rounded-2xl shadow-2xl max-w-sm animate-toast-slide-down">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-dark-brown/40 hover:text-dark-brown p-1"
        aria-label="Dismiss prompt"
      >
        <X size={16} />
      </button>
      <div className="flex gap-4 items-start pr-4">
        <div className="p-3 rounded-full bg-maroon/10 text-maroon flex-shrink-0">
          <Bell size={24} className="animate-bounce" />
        </div>
        <div>
          <h4 className="font-serif font-bold text-base text-maroon mb-1">Never miss an update 🔔</h4>
          <p className="text-xs text-dark-brown/80 mb-4 font-sans leading-relaxed">
            Get order updates, new collections and special offers from Shree Banarasi Sarees.
          </p>
          <button
            onClick={handleEnable}
            disabled={loading}
            className="w-full bg-maroon hover:bg-maroon-dark text-white text-xs font-serif font-bold py-2.5 px-4 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Enabling..." : "Enable Notifications"}
          </button>
        </div>
      </div>
    </div>
  );
}
