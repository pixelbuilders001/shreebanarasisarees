"use client";

import { useEffect } from "react";

export default function PWARegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerServiceWorker = async () => {
        try {
          // Register the service worker from public directory
          const registration = await navigator.serviceWorker.register("/sw.js", {
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
