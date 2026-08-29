'use client';

import { useState, useEffect } from 'react';

/**
 * Checks if the PWA is running in standalone mode OR has already been installed by the user.
 */
export function checkIsPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Check if running inside installed standalone PWA app window
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  if (isStandalone) return true;

  // 2. Check if installation was previously completed/recorded in localStorage
  try {
    const isInstalled = localStorage.getItem('pwa_installed') === 'true';
    const isRecorded = localStorage.getItem('pwa_install_recorded') !== null;
    return isInstalled || isRecorded;
  } catch (e) {
    return false;
  }
}

/**
 * Marks the PWA as installed in localStorage and dispatches a global event so all components react instantly.
 */
export function markPwaAsInstalled(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pwa_installed', 'true');
    window.dispatchEvent(new CustomEvent('pwaInstalledStateChanged'));
  } catch (e) {
    console.error('Failed to set pwa_installed in localStorage:', e);
  }
}

/**
 * React hook to reactively track PWA installation state across all components.
 */
export function useIsPwaInstalled(): boolean {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const check = () => {
      setIsInstalled(checkIsPwaInstalled());
    };

    check();

    // Listen for custom state change and browser lifecycle events
    window.addEventListener('pwaInstalledStateChanged', check);
    window.addEventListener('appinstalled', check);

    return () => {
      window.removeEventListener('pwaInstalledStateChanged', check);
      window.removeEventListener('appinstalled', check);
    };
  }, []);

  return isInstalled;
}
