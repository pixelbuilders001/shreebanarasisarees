"use client";

import { useEffect } from "react";

export default function PWARegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerServiceWorker = async () => {
        try {
          // Append firebase configuration to service worker URL to avoid hardcoding credentials in static files
          const firebaseConfigParams = new URLSearchParams({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
          }).toString();

          // Register the service worker from public directory
          const registration = await navigator.serviceWorker.register(`/sw.js?${firebaseConfigParams}`, {
            scope: "/",
          });
          
          console.log("[PWA] Service Worker registered successfully:", registration.scope);

          // Handle service worker updates
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

      // Register service worker after window load to ensure critical resources load first
      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker);
        return () => window.removeEventListener("load", registerServiceWorker);
      }
    }
  }, []);

  return null;
}
