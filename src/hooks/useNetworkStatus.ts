"use client";

import { useState, useEffect, useCallback } from "react";
import { triggerHaptic } from "@/utils/haptics";

export interface NetworkStatus {
  isOnline: boolean;
  isChecking: boolean;
  wasOffline: boolean;
  clearWasOffline: () => void;
  checkConnection: () => Promise<boolean>;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return true;

    // Fast path: if navigator specifically says offline, no need to ping
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      setWasOffline(true);
      return false;
    }

    setIsChecking(true);
    try {
      // Use lightweight cache-busted ping to verify actual internet reachability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`/favicon.ico?_t=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const online = response.ok || response.type === "opaque";
      setIsOnline(online);
      if (!online) {
        setWasOffline(true);
      }
      return online;
    } catch {
      setIsOnline(false);
      setWasOffline(true);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize state
    const initialOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    setIsOnline(initialOnline);
    if (!initialOnline) {
      setWasOffline(true);
    }

    const handleOnline = async () => {
      // Actively verify when the browser triggers 'online' event
      const reallyOnline = await checkConnection();
      if (reallyOnline) {
        triggerHaptic("success");
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      triggerHaptic("warning");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkConnection]);

  const clearWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  return {
    isOnline,
    isChecking,
    wasOffline,
    clearWasOffline,
    checkConnection,
  };
}
