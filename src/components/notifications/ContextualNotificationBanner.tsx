"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Truck, Tag, Check, Sparkles, X, Loader2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { requestAndSavePushToken, isMessagingSupported } from '../../lib/firebase/messaging';

interface ContextualNotificationBannerProps {
  variant: 'order_success' | 'wishlist';
  orderId?: string;
  className?: string;
}

export default function ContextualNotificationBanner({
  variant,
  orderId,
  className = ''
}: ContextualNotificationBannerProps) {
  const { user, showToast } = useStore();
  const [permission, setPermission] = useState<NotificationPermission | 'unknown'>('unknown');
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check dismissal for wishlist
    if (variant === 'wishlist') {
      const isDismissed = localStorage.getItem('sbs_notif_wishlist_dismissed') === 'true';
      if (isDismissed) setDismissed(true);
    }

    // Check browser notification support & current permission
    isMessagingSupported().then((isSupp) => {
      setSupported(isSupp);
      if (isSupp && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    });
  }, [variant]);

  if (!supported || dismissed) {
    return null;
  }

  // If permission is denied in browser settings, do not annoy user with an unusable prompt
  if (permission === 'denied') {
    return null;
  }

  const handleEnable = async () => {
    setLoading(true);
    try {
      const res = await requestAndSavePushToken(user?.id || null);
      if (res.status === 'granted') {
        setPermission('granted');
        const successMsg =
          variant === 'order_success'
            ? 'Delivery & dispatch alerts enabled! 🚚🔔'
            : 'Price drop & offer alerts enabled! 🏷️🔔';
        showToast(successMsg, 'info');
      } else if (res.status === 'denied') {
        setPermission('denied');
        showToast('Notifications are blocked in your browser settings.', 'info');
      } else {
        showToast('Could not enable notifications. Please try again.', 'info');
      }
    } catch (err) {
      console.error('[FCM] Error enabling contextual notification:', err);
      showToast('An error occurred while enabling notifications.', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (variant === 'wishlist') {
      localStorage.setItem('sbs_notif_wishlist_dismissed', 'true');
    }
    setDismissed(true);
  };

  // 1. ORDER SUCCESS VARIANT
  if (variant === 'order_success') {
    // If already granted, show reassurance bar
    if (permission === 'granted') {
      return (
        <div className={`bg-[#F4F9F4] border border-[#CDE5CE] rounded-xl p-3.5 flex items-center gap-3 text-[#292524] shadow-2xs ${className}`}>
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Check size={14} strokeWidth={2.5} />
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            <span className="font-semibold">Live delivery alerts active:</span> You will receive instant notifications on this device when your saree is inspected, packed, dispatched, and out for delivery.
          </p>
        </div>
      );
    }

    // Default: Clear in-page prompt with full message
    return (
      <div className={`bg-[#FFFDF9] border border-[#E5DEC9] rounded-xl p-4 shadow-2xs text-[#292524] ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#6B1725]/10 text-[#6B1725] flex items-center justify-center shrink-0 mt-0.5">
              <Truck size={16} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[#292524] flex items-center gap-1.5">
                Real-Time Delivery & Dispatch Updates 🚚
              </h4>
              <p className="text-xs text-[#7A6E65] mt-0.5 leading-relaxed">
                Never wonder where your parcel is. Get instant updates sent to your device when your saree is packed, dispatched, and out for doorstep delivery.
              </p>
            </div>
          </div>

          <button
            onClick={handleEnable}
            disabled={loading}
            className="self-start sm:self-center shrink-0 bg-[#6B1725] hover:bg-[#52111C] active:scale-[0.98] text-white text-xs font-semibold py-2 px-3.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 whitespace-nowrap ml-11 sm:ml-0"
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Bell size={13} />
            )}
            <span>{loading ? 'Enabling...' : 'Enable Delivery Alerts'}</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. WISHLIST VARIANT
  if (variant === 'wishlist') {
    if (permission === 'granted') {
      return null;
    }

    return (
      <div className={`bg-[#FFFDF9] border border-[#B08A3C]/35 rounded-xl p-3.5 sm:p-4 mb-6 text-[#292524] shadow-xs relative ${className}`}>
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 text-[#7A6E65] hover:text-[#6B1725] p-1 rounded-md transition-colors cursor-pointer"
          aria-label="Dismiss price alerts"
        >
          <X size={15} />
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6 sm:pr-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#B08A3C]/15 text-[#8A6A24] flex items-center justify-center shrink-0 mt-0.5">
              <Tag size={16} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[#292524] flex items-center gap-1.5">
                Price Drop & Stock Alerts 🏷️
              </h4>
              <p className="text-xs text-[#7A6E65] mt-0.5 leading-relaxed">
                Turn on alerts to be notified immediately when sarees in your wishlist go on discount or when limited handloom stock is running low.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pl-11 sm:pl-0">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="bg-[#6B1725] hover:bg-[#52111C] active:scale-[0.98] text-white text-xs font-semibold py-2 px-3.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Bell size={13} />
              )}
              <span>{loading ? 'Enabling...' : 'Notify Me on Price Drops'}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-[#7A6E65] hover:text-[#292524] px-2 py-1.5 font-medium transition-colors cursor-pointer sm:hidden"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
