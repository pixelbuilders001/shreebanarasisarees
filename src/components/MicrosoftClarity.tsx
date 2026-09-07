"use client";

import { useEffect } from "react";

const CLARITY_PROJECT_ID = "y5ogehr1op";

export default function MicrosoftClarity() {
  useEffect(() => {
    if (typeof window === "undefined" || !CLARITY_PROJECT_ID) return;

    const initClarity = () => {
      import("@microsoft/clarity")
        .then(({ default: Clarity }) => {
          Clarity.init(CLARITY_PROJECT_ID);
        })
        .catch((err) => {
          console.warn("[Clarity] Failed to initialize:", err);
        });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(initClarity, { timeout: 3000 });
      return () => window.cancelIdleCallback(idleId);
    } else {
      const timer = setTimeout(initClarity, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
