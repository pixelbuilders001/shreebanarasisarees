"use client";

import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { useIsPwaInstalled, markPwaAsInstalled } from '@/lib/pwaUtils';
import { event as trackGAEvent } from '@/lib/gtag';
import { recordPwaInstall } from '@/data/supabase';

interface AccountPwaStripProps {
  className?: string;
}

export default function AccountPwaStrip({ className = '' }: AccountPwaStripProps) {
  const isInstalled = useIsPwaInstalled();
  const [dismissed, setDismissed] = useState<boolean>(true); // Start true to prevent SSR flash
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const isDismissed = sessionStorage.getItem('sbs_account_pwa_dismissed') === 'true';
      setDismissed(isDismissed);
    } catch {
      setDismissed(false);
    }
  }, []);

  // Hide if already installed or dismissed for this session
  if (isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('sbs_account_pwa_dismissed', 'true');
    } catch (e) {
      console.warn('Could not save dismissal state', e);
    }
  };

  const handleInstallClick = async () => {
    if (typeof window === 'undefined') return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);

    if (isIOS) {
      setShowIosModal(true);
      return;
    }

    const promptEvent = (window as any).deferredPwaPrompt;
    if (promptEvent) {
      setIsInstalling(true);
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          (window as any).deferredPwaPrompt = null;
          markPwaAsInstalled();
          trackGAEvent('app_installed', {
            event_category: 'App',
            source: 'account_bottom_strip'
          });
          await recordPwaInstall('account_strip');
        }
      } catch (err) {
        console.error('App install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      alert(
        'To install our mobile app:\n\n' +
        '• Android: Tap the browser menu (⋮) and select "Install App" or "Add to Home screen"\n' +
        '• iPhone/iPad: Tap Share (⎋) in Safari and select "Add to Home Screen"'
      );
    }
  };

  return (
    <>
      <div
        className={`lg:hidden bg-white border border-[#E7DFC9] rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:border-[#6B1725]/30 transition-all ${className}`}
        role="region"
        aria-label="Download Mobile App"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: Authentic Brand Logo & Copy */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E7DFC9] p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
              <img
                src="/brand_logo.webp"
                alt="Shree Banarasi Sarees"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#1C1917] truncate">
                Shree Banarasi Sarees App
              </h4>
              <p className="text-[11px] text-[#78716C] font-sans truncate mt-0.5">
                Fast order tracking, exclusive collections & instant delivery updates
              </p>
            </div>
          </div>

          {/* Right: Clean Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="bg-[#6B1725] hover:bg-[#52111D] active:scale-98 text-[#FAF7F0] rounded-full px-3.5 py-1.5 text-xs font-serif font-semibold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-60 whitespace-nowrap"
            >
              <Download size={13} />
              <span>{isInstalling ? 'Installing…' : 'Install App'}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-[#A8A29E] hover:text-[#1C1917] rounded-full hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              aria-label="Dismiss app prompt"
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Clean iOS Guide Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#E7DFC9] rounded-2xl p-5 max-w-sm w-full shadow-xl relative space-y-4 text-center animate-scaleIn">
            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="absolute top-3 right-3 p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-full hover:bg-[#F3ECE0] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="w-12 h-12 rounded-xl bg-white border border-[#E7DFC9] p-2 mx-auto flex items-center justify-center shadow-2xs">
              <img
                src="/brand_logo.webp"
                alt="Shree Banarasi Sarees"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-[#1C1917]">
                Add to Home Screen
              </h3>
              <p className="text-xs text-[#78716C] font-sans mt-0.5">
                Enjoy a fast, seamless shopping experience in 2 steps:
              </p>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-[#E7DFC9] text-left space-y-2.5 text-xs text-[#1C1917] font-sans">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#FAF8F5] border border-[#E7DFC9] text-[#6B1725] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Tap the <strong className="text-[#6B1725]">Share</strong> button{' '}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#1C1917] text-[11px] font-mono border border-[#E7DFC9]">
                    <Share size={11} className="inline mr-1" /> Share
                  </span>{' '}
                  in Safari&apos;s bottom bar.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#FAF8F5] border border-[#E7DFC9] text-[#6B1725] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Scroll down and tap <strong className="text-[#6B1725]">&quot;Add to Home Screen&quot;</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="w-full py-2 bg-[#6B1725] hover:bg-[#52111D] text-[#FAF7F0] rounded-xl font-serif font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
