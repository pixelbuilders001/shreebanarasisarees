"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { recordPwaInstall } from "@/data/supabase";
import { event as trackGAEvent } from "@/lib/gtag";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function getPlatform(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/win/.test(ua)) return "windows";
  if (/mac/.test(ua)) return "mac";
  if (/linux/.test(ua)) return "linux";
  return "other";
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

    // 2. Track PWA Installation Event (appinstalled)
    const handleAppInstalled = async () => {
      console.log('[PWA] App was installed successfully');
      setShowPrompt(false);

      const alreadyRecorded = localStorage.getItem('pwa_install_recorded');
      if (!alreadyRecorded) {
        localStorage.setItem('pwa_install_recorded', Date.now().toString());
        const platform = getPlatform();

        // 1. Log to Google Analytics
        trackGAEvent("pwa_installed", {
          event_category: "PWA",
          platform: platform,
        });

        // 2. Record event in Supabase pwa_installs table
        await recordPwaInstall(platform);
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 3. PWA Install Prompt Banner Handling
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
      (window as any).deferredPwaPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event('pwaPromptAvailable'));
      }
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
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (typeof window !== "undefined" ? (window as any).deferredPwaPrompt : null);
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      console.log('[PWA] User install choice:', outcome);

      if (outcome === 'accepted') {
        const platform = getPlatform();
        trackGAEvent("pwa_installed", { event_category: "PWA", platform });
        await recordPwaInstall(platform);
        localStorage.setItem('pwa_install_recorded', Date.now().toString());
      }

      (window as any).deferredPwaPrompt = null;
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
    <div className="sm:hidden fixed bottom-16 left-3 right-3 z-50 bg-white/95 backdrop-blur-md border border-[#F3ECE0] text-[#292524] p-3 rounded-2xl shadow-xl transition-all">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/brand_logo.webp"
            alt="Shree Banarasi Sarees"
            className="w-9 h-9 object-contain rounded-lg bg-[#FAF7F0] p-1 border border-[#F3ECE0] shrink-0"
          />

          <div className="min-w-0">
            <h4 className="font-serif font-bold text-xs text-[#292524] truncate">
              Shree Banarasi App
            </h4>
            <p className="text-[10px] text-[#6B625D] truncate">
              {isIOS ? "Tap Share → Add to Home Screen" : "Faster checkout & order updates"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isIOS && (deferredPrompt || (typeof window !== "undefined" && (window as any).deferredPwaPrompt)) && (
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-[#6B1725] hover:bg-[#52111C] text-[#FAF7F0] rounded-xl text-xs font-serif font-bold tracking-wide transition-all active:scale-95 shadow-2xs"
            >
              Install
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-[#6B625D] hover:text-[#292524] transition-all"
            aria-label="Dismiss install prompt"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
