"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWARegistration() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Service Worker Registration
    if ("serviceWorker" in navigator) {
      const registerServiceWorker = async () => {
        try {
          const firebaseConfigParams = new URLSearchParams({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
          }).toString();

          const registration = await navigator.serviceWorker.register(`/sw.js?${firebaseConfigParams}`, {
            scope: "/",
          });
          
          console.log("[PWA] Service Worker registered successfully:", registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    console.log("[PWA] New version is available, please refresh.");
                  } else {
                    console.log("[PWA] Content is cached for offline use.");
                  }
                }
              };
            }
          };
        } catch (error) {
          console.error("[PWA] Service Worker registration failed:", error);
        }
      };

      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker);
      }
    }

    // 2. PWA Install Prompt Banner Handling
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandaloneMode) return;

    const dismissedTime = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedTime && Date.now() - Number(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => {
        setShowPrompt(true);
      }, 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isIOSDevice) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User install choice:', outcome);
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (err) {
      console.error('[PWA] Error triggering install prompt:', err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="sm:hidden fixed bottom-20 left-3 right-3 z-50 bg-[#FAF7F0] border border-[#B08A3C]/40 text-[#292524] p-3.5 rounded-2xl shadow-2xl animate-fade-in transition-all">
      <div className="flex items-start gap-3">
        <img
          src="/brand_logo.webp"
          alt="Shree Banarasi Sarees"
          className="w-11 h-11 object-contain rounded-xl bg-white p-1 border border-[#B08A3C]/30 shadow-md flex-shrink-0"
        />

        <div className="flex-1 min-w-0 pr-6">
          <h4 className="font-serif font-bold text-sm text-[#292524] leading-tight">
            Install Shree Banarasi App
          </h4>
          <p className="text-xs text-[#6B625D] font-light mt-0.5 leading-snug">
            {isIOS
              ? "Tap Share and select 'Add to Home Screen' for faster access."
              : "Install our app for faster shopping & instant order updates."}
          </p>

          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="mt-2.5 px-4 py-1.5 bg-[#6B1725] hover:bg-[#52111C] text-[#FAF7F0] rounded-lg text-xs font-serif font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all shadow-sm active:scale-95 border border-[#B08A3C]/30"
            >
              <Download size={13} />
              <span>INSTALL NOW</span>
            </button>
          )}

          {isIOS && (
            <div className="mt-2 text-[11px] text-[#6B1725] font-medium flex items-center gap-1">
              <span>Tap</span>
              <Share size={12} className="inline text-[#B08A3C]" />
              <span>→ Add to Home Screen</span>
            </div>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full text-[#6B625D] hover:text-[#292524] hover:bg-[#B08A3C]/15 transition-all"
          aria-label="Dismiss install prompt"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
