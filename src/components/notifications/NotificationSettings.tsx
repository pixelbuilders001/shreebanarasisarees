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
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-[#1C1917] flex items-center gap-2 font-sans">
            <Bell size={15} className="text-[#6B1725] shrink-0" />
            <span>Push Notifications</span>
          </h4>
          <p className="text-xs text-[#78716C] leading-relaxed font-sans">
            Receive order updates, dispatch alerts, and exclusive offers directly on your device.
          </p>
        </div>
        <div className="flex items-center shrink-0">
          {!supported ? (
            <span className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1 font-sans">
              Not supported
            </span>
          ) : permission === 'denied' ? (
            <span className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1 font-sans">
              Blocked in browser
            </span>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enabled ? 'bg-[#6B1725]' : 'bg-[#E5DEC9]'
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
