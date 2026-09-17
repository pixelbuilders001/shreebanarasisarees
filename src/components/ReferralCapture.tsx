"use client";

import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { storeReferralCode } from '../lib/referralUtils';
import { useStore } from '../context/StoreContext';

function ReferralCaptureInner() {
  const searchParams = useSearchParams();
  const { showToast, user } = useStore();
  const capturedRef = useRef(false);

  useEffect(() => {
    if (capturedRef.current) return;

    const refCode = searchParams.get('ref') || searchParams.get('referral');
    if (refCode && refCode.trim()) {
      capturedRef.current = true;
      const cleanCode = refCode.trim().toUpperCase();
      storeReferralCode(cleanCode);

      // If user is guest, show a subtle confirmation toast
      if (!user) {
        showToast(`Referral code ${cleanCode} applied! Sign in to get started.`, 'info');
      }

      // Clean the query parameter from URL without triggering a page reload
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('ref');
        url.searchParams.delete('referral');
        window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash);
      }
    }
  }, [searchParams, user, showToast]);

  return null;
}

export function ReferralCapture() {
  return (
    <React.Suspense fallback={null}>
      <ReferralCaptureInner />
    </React.Suspense>
  );
}

export default ReferralCapture;
