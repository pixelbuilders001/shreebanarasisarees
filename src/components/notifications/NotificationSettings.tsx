"use client";

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { 
  isMessagingSupported, 
  getFCMToken, 
  saveFCMTokenToSupabase, 
  disableFCMTokenInSupabase 
} from '../../lib/firebase/messaging';

export default function NotificationSettings() {
  const { user, showToast } = useStore();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const isSupported = await isMessagingSupported();
      setSupported(isSupported);
      if (isSupported) {
        setPermission(Notification.permission);
        setEnabled(Notification.permission === 'granted');
      }
    };
    checkStatus();
  }, []);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (!enabled) {
        // Turning ON
        const reqPermission = await Notification.requestPermission();
        setPermission(reqPermission);
        
        if (reqPermission === 'granted') {
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const token = await getFCMToken(registration);
            
            if (token) {
              const success = await saveFCMTokenToSupabase(token, user?.id || null);
              if (success) {
                setEnabled(true);
                showToast("Push notifications enabled successfully! 🔔", "info");
              } else {
                showToast("Failed to save notification token.", "info");
              }
            } else {
              showToast("Failed to generate notification token.", "info");
            }
          }
        } else {
          showToast("Notification permission denied.", "info");
        }
      } else {
        // Turning OFF
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const token = await getFCMToken(registration);
          if (token) {
            await disableFCMTokenInSupabase(token);
          }
        }
        setEnabled(false);
        showToast("Push notifications turned off.", "info");
      }
    } catch (err) {
      console.error("[FCM] Error toggling notifications:", err);
      showToast("Error updating notification settings.", "info");
    } finally {
      setLoading(false);
    }
  };

  if (supported === null) {
    return null; // Silent loading state
  }

  return (
    <div className="border-t border-cream/40 pt-5 mt-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wider flex items-center gap-1.5">
            <Bell size={14} className="text-maroon" />
            Push Notifications
          </h4>
          <p className="text-[11px] text-dark-brown/60 leading-relaxed font-sans max-w-md">
            Receive order updates, new arrivals, and important notifications.
          </p>
        </div>
        <div className="flex items-center min-h-[24px]">
          {!supported ? (
            <span className="text-[10px] font-semibold text-red-650 bg-red-50/70 border border-red-150 rounded-lg px-2.5 py-1">
              Push notifications aren't supported on this browser.
            </span>
          ) : permission === 'denied' ? (
            <span className="text-[10px] font-semibold text-red-650 bg-red-50/70 border border-red-150 rounded-lg px-2.5 py-1">
              Notifications are blocked in your browser settings.
            </span>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enabled ? 'bg-maroon' : 'bg-gray-200'
              } ${loading ? 'opacity-55 cursor-not-allowed' : ''}`}
              role="switch"
              aria-checked={enabled}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
