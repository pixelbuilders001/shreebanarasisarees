"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X, Loader2, AlertCircle, Plus, Check, Home, Building, ChevronRight, Zap, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCustomerLocation } from '../hooks/useCustomerLocation';
import { useStore } from '../context/StoreContext';
import { AddNewAddressModal } from './delivery/AddNewAddressModal';
import { getStandardDeliveryDateInfo } from '../lib/deliveryDates';
import { fetchDeliverySettings, DeliverySettings } from '../data/supabase';
import { triggerHaptic } from '../utils/haptics';

import { getQuickCity, fetchPincodeDetails } from '../lib/pincodeLookup';

const SUGGESTED_PINCODES = [
  { pin: '848101', city: 'Samastipur', label: 'Samastipur (Express 20-Min)' },
  { pin: '848114', city: 'Darbhanga', label: 'Darbhanga' },
  { pin: '800001', city: 'Patna', label: 'Patna' },
  { pin: '110001', city: 'New Delhi', label: 'New Delhi' },
  { pin: '560001', city: 'Bengaluru', label: 'Bengaluru' }
];

export const openPincodeSheet = (pincode?: any) => {
  if (typeof window !== 'undefined') {
    // Guard against React SyntheticEvent objects passed when openPincodeSheet is used directly in onClick
    const validPin = typeof pincode === 'string' && /^\d{6}$/.test(pincode.trim()) ? pincode.trim() : undefined;
    window.dispatchEvent(new CustomEvent('open-pincode-sheet', { detail: { pincode: validPin } }));
  }
};

export const closePincodeSheet = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('close-pincode-sheet'));
  }
};

export const getExpressTimingStatus = (result?: any) => {
  let hour = 12;
  try {
    const istHourString = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    }).format(new Date());
    hour = parseInt(istHourString, 10);
  } catch {
    hour = new Date().getHours();
  }

  const isAfterMidnight = result?.isAfterMidnight ?? (hour < 9);
  const isAfter8PM = result?.isAfter8PM ?? (hour >= 20);
  const isNormalHours = !(isAfterMidnight || isAfter8PM);

  if (isNormalHours) {
    return {
      isNormalHours: true,
      timingText: '20-Min Express Available',
      badgeText: '✓ 20-Min Express',
      descText: 'Fast hand delivery directly from our Samastipur showroom. Express delivery & COD available.'
    };
  }

  if (isAfterMidnight) {
    return {
      isNormalHours: false,
      timingText: 'Today Morning (by 10 AM)',
      badgeText: '✓ Today Morning',
      descText: 'Order now! Priority delivery will arrive this morning by 10:00 AM.'
    };
  }

  return {
    isNormalHours: false,
    timingText: 'Tomorrow Morning (by 10 AM)',
    badgeText: '✓ Tomorrow Morning',
    descText: 'Place your order tonight for express delivery tomorrow morning by 10:00 AM.'
  };
};

export const DeliveryPincodeSkeleton: React.FC<{ variant?: 'mobile' | 'desktop' }> = ({ variant = 'mobile' }) => {
  if (variant === 'desktop') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4A121A] border border-[#B08A3C]/35 shadow-2xs animate-pulse shrink-0 select-none">
        <div className="w-3.5 h-3.5 rounded-full bg-[#D4B870]/30 shrink-0" />
        <div className="h-3 w-36 bg-[#FAF7F0]/20 rounded-md" />
        <div className="w-3 h-3 rounded-full bg-[#D4B870]/25 shrink-0" />
      </div>
    );
  }

  return (
    <div className="w-full bg-[#4A121A] border border-[#B08A3C]/25 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 shadow-2xs animate-pulse select-none">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-3.5 h-3.5 rounded-full bg-[#D4B870]/30 shrink-0" />
        <div className="h-3 w-40 bg-[#FAF7F0]/20 rounded-md" />
      </div>
      <div className="h-3 w-12 bg-[#D4B870]/25 rounded-md shrink-0" />
    </div>
  );
};

// Helper to determine if a pincode is eligible for 20-min express
// Note: Only Samastipur store pincodes (848101, 848102) qualify. All other Indian pincodes are Standard Delivery!
export const checkIsExpress = (pin: string, deliveryRes?: any) => {
  const clean = pin?.trim() || '';
  if (!clean) return false;

  const isSamastipurExpressPin = clean === '848101' || clean === '848102';
  if (!isSamastipurExpressPin) {
    return false; // ANY other pincode across India is Standard Delivery (3–5 Days)!
  }

  if (deliveryRes && deliveryRes.pincode === clean) {
    if (deliveryRes.isExpress === false || deliveryRes.eligible === false) {
      return false;
    }
    return Boolean(deliveryRes.is20MinDelivery || deliveryRes.isExpress);
  }

  return true;
};

export const sanitizePincode = (val: any): string => {
  if (typeof val === 'string') {
    const digits = val.trim().replace(/\D/g, '').slice(0, 6);
    if (digits.length === 6) return digits;
  }
  return '';
};

export interface DeliveryPincodeBarProps {
  hideBar?: boolean;
  variant?: 'mobile' | 'desktop';
}

/**
 * Lean delivery pincode bar / chip component for header and navigation.
 * Tapping opens the centralized singleton DeliveryPincodeSheet.
 */
export const DeliveryPincodeBar: React.FC<DeliveryPincodeBarProps> = ({ hideBar = false, variant = 'mobile' }) => {
  const { currentPincode, defaultDeliveryPincode, isHydrated } = useStore();
  const activePin = sanitizePincode(currentPincode) || sanitizePincode(defaultDeliveryPincode) || '848101';
  const [city, setCity] = useState<string>(() => getQuickCity(activePin) || 'Samastipur');
  const [mounted, setMounted] = useState<boolean>(false);

  const { result, checkPincode } = useCustomerLocation();

  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchDeliverySettings().then(setDeliverySettings).catch(console.error);
  }, []);

  // Synchronize city and check location whenever activePin changes
  useEffect(() => {
    if (activePin) {
      checkPincode(activePin);

      // Instant 0ms synchronous quick city lookup
      const quick = getQuickCity(activePin);
      if (quick) {
        setCity(quick);
      }

      // Async deep lookup via India Post / Zippopotam
      let isSubscribed = true;
      fetchPincodeDetails(activePin).then((details) => {
        if (isSubscribed && details?.city) {
          setCity(details.city);
        }
      }).catch(() => {});

      return () => {
        isSubscribed = false;
      };
    }
  }, [activePin, checkPincode]);

  const is20Min = checkIsExpress(activePin, result);

  const locationCity =
    city ||
    getQuickCity(activePin) ||
    (result as any)?.city ||
    result?.district ||
    (activePin === '848101' || activePin === '848102' ? 'Samastipur' : '');
  const locationLabel = locationCity
    ? `${locationCity}, ${activePin}`
    : activePin
      ? activePin
      : 'Select Location';

  if (hideBar) return null;

  if (!mounted || !isHydrated) {
    return <DeliveryPincodeSkeleton variant={variant} />;
  }

  if (variant === 'desktop') {
    return (
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          openPincodeSheet(activePin);
        }}
        aria-label={`Deliver to ${locationLabel}. Click to change.`}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4A121A] text-[#FAF7F0] hover:bg-[#5E1722] border border-[#B08A3C]/35 text-xs font-sans transition-all cursor-pointer shadow-2xs group shrink-0"
      >
        <MapPin size={13} className="text-[#D4B870] shrink-0 group-hover:scale-110 transition-transform" />
        <div className="flex items-center gap-1.5 truncate text-left">
          <span className="text-[#FAF7F0]/80 text-[11px] font-medium">Deliver to</span>
          <span className="font-bold text-white text-xs truncate">
            {locationCity ? `${locationCity}, ${activePin}` : activePin}
          </span>
        </div>
        {is20Min && (
          <span className="text-[9px] font-bold text-emerald-200 bg-emerald-900/80 border border-emerald-500/30 px-1.5 py-0.5 rounded-md shrink-0">
            ⚡ 20-Min
          </span>
        )}
        <ChevronRight size={12} className="text-[#D4B870] group-hover:translate-x-0.5 transition-transform" />
      </button>
    );
  }

  return (
    <div
      onClick={() => {
        triggerHaptic('light');
        openPincodeSheet(activePin);
      }}
      role="button"
      tabIndex={0}
      aria-label={`Deliver to ${locationLabel}. Tap to change.`}
      className="w-full bg-[#4A121A] text-[#FAF7F0] border border-[#B08A3C]/25 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 shadow-2xs active:scale-[0.99] transition-all cursor-pointer select-none"
    >
      {/* Left: Map Pin + Deliver to [City, Pincode] */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MapPin size={13} className="text-[#D4B870] shrink-0" />
        <span className="font-sans text-xs font-medium text-[#FAF7F0] truncate">
          Deliver to{' '}
          {locationCity ? (
            <>
              <strong className="font-bold text-white">{locationCity}</strong>
              {activePin ? <span className="font-mono text-white/90">, {activePin}</span> : ''}
            </>
          ) : (
            <strong className="font-bold text-white font-mono tracking-wide">{activePin || 'Select Location'}</strong>
          )}
        </span>
        {is20Min && (
          <span className="text-[9.5px] font-bold text-emerald-200 bg-emerald-900/80 border border-emerald-500/30 px-1.5 py-0.5 rounded-md shrink-0">
            ⚡ 20-Min
          </span>
        )}
      </div>

      {/* Right: Change Link */}
      <div className="flex items-center gap-0.5 text-[11px] font-semibold text-[#D4B870] hover:text-white transition-colors shrink-0">
        <span>Change</span>
        <ChevronRight size={12} />
      </div>
    </div>
  );
};

/**
 * Singleton Bottom Sheet Drawer for checking & selecting delivery pincode.
 * Mount once globally in RootLayout to prevent duplicate overlapping sheets.
 */
export const DeliveryPincodeSheet: React.FC = () => {
  const { user, shippingAddresses, setIsAuthModalOpen, currentPincode, setCurrentPincode, defaultDeliveryPincode } = useStore();
  const activePin = sanitizePincode(currentPincode) || sanitizePincode(defaultDeliveryPincode) || '848101';
  const [city, setCity] = useState<string>(() => getQuickCity(activePin) || 'Samastipur');
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [inputPincode, setInputPincode] = useState<string>(activePin);
  const [mounted, setMounted] = useState<boolean>(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);
  const [isCityLoading, setIsCityLoading] = useState<boolean>(false);
  const isSavingRef = useRef<boolean>(false);

  const { isLoading, result, errorMsg, checkPincode } = useCustomerLocation();
  const isPincodeLoading = isLoading || isCityLoading;

  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchDeliverySettings().then(setDeliverySettings).catch(console.error);
  }, []);

  // Synchronize city and check delivery when activePin changes from outside
  useEffect(() => {
    if (activePin) {
      const quick = getQuickCity(activePin);
      if (quick) setCity(quick);

      let isSubscribed = true;
      fetchPincodeDetails(activePin).then((details) => {
        if (isSubscribed && details?.city) {
          setCity(details.city);
        }
      }).catch(() => {});

      return () => {
        isSubscribed = false;
      };
    }
  }, [activePin]);

  // Listen to open-pincode-sheet and close-pincode-sheet events
  useEffect(() => {
    const handleOpenSheet = (e?: any) => {
      const specifiedPin = sanitizePincode(e?.detail?.pincode);
      const currentPin = sanitizePincode(currentPincode);
      const defaultPin = sanitizePincode(defaultDeliveryPincode);
      const pin = specifiedPin || currentPin || defaultPin || '848101';

      setInputPincode(pin);
      checkPincode(pin);
      const quick = getQuickCity(pin);
      if (quick) setCity(quick);
      setIsCityLoading(true);
      fetchPincodeDetails(pin).then((details) => {
        if (details?.city) setCity(details.city);
      }).catch(() => {}).finally(() => {
        setIsCityLoading(false);
      });

      setIsSheetOpen(true);
    };

    const handleCloseSheet = () => {
      setIsSheetOpen(false);
    };

    window.addEventListener('open-pincode-sheet', handleOpenSheet);
    window.addEventListener('close-pincode-sheet', handleCloseSheet);
    return () => {
      window.removeEventListener('open-pincode-sheet', handleOpenSheet);
      window.removeEventListener('close-pincode-sheet', handleCloseSheet);
    };
  }, [currentPincode, defaultDeliveryPincode, checkPincode]);

  // Close on Escape key & lock background scroll while sheet is open
  useEffect(() => {
    if (!isSheetOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSheetOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSheetOpen]);

  const handleInputChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setInputPincode(clean);
    setSelectedAddressId('');
    if (clean.length === 6) {
      checkPincode(clean);
      const quick = getQuickCity(clean);
      if (quick) {
        setCity(quick);
      }
      setIsCityLoading(true);
      fetchPincodeDetails(clean).then((details) => {
        if (details?.city) {
          setCity(details.city);
        }
      }).catch(() => {}).finally(() => {
        setIsCityLoading(false);
      });
    }
  };

  const handleSelectSavedAddress = (addr: any) => {
    if (!addr || !addr.pincode) return;
    const cleanPin = addr.pincode.trim().slice(0, 6);
    setSelectedAddressId(addr.id || '');
    setInputPincode(cleanPin);
    if (addr.city) {
      setCity(addr.city);
    } else {
      const quick = getQuickCity(cleanPin);
      if (quick) setCity(quick);
    }
    setCurrentPincode(cleanPin);
    checkPincode(cleanPin);
  };

  const handleSavePincode = (pinToSave: string) => {
    const clean = pinToSave?.trim().replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(clean)) return;

    triggerHaptic('selection');
    const quick = getQuickCity(clean);
    if (quick) {
      setCity(quick);
    }

    // Dismiss virtual keyboard by blurring active element immediately
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 1. Immediately close the sheet synchronously on the very first click / tap
    setIsSheetOpen(false);

    // 2. Persist and check in background without blocking UI dismissal
    setCurrentPincode(clean);
    checkPincode(clean);
  };

  const executeSave = () => {
    if (isSavingRef.current || isPincodeLoading || inputPincode.length !== 6) return;
    isSavingRef.current = true;
    handleSavePincode(inputPincode);
    setTimeout(() => {
      isSavingRef.current = false;
    }, 400);
  };

  const isInput20Min = checkIsExpress(inputPincode, result);
  const timingStatus = getExpressTimingStatus(result);
  const deliveryDateInfo = getStandardDeliveryDateInfo(new Date(), deliverySettings?.standard_delivery_days ?? 3);

  if (!mounted || !isSheetOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn p-0 sm:p-4">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={() => setIsSheetOpen(false)} />

      {/* Modern Clean Drawer Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 animate-slide-in-from-bottom border border-gray-100 max-h-[85vh] overflow-y-auto">

        {/* Top Content Area */}
        <div className="space-y-3.5">
          {/* Drawer Grab Handle */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto -mt-1 mb-1 sm:hidden" />

          {/* Close Button */}
          <button
            onClick={() => setIsSheetOpen(false)}
            className="absolute right-4 top-4 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Header with Location Beacon Badge + Title + Subtitle */}
          <div className="flex items-center gap-3 pr-7">
            <div className="w-10 h-10 rounded-full bg-[#FDF1F3] border border-[#FADCE2] flex items-center justify-center shrink-0 shadow-2xs">
              <div className="flex items-center gap-0.5">
                <span className="w-0.5 h-0.5 rounded-full bg-[#6B1725]/40" />
                <MapPin size={18} className="text-[#6B1725] fill-[#6B1725]" />
                <span className="w-0.5 h-0.5 rounded-full bg-[#6B1725]/40" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-tight">
                Check Delivery Availability
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 leading-normal">
                Enter your pincode to see if we deliver to your area
              </p>
            </div>
          </div>

          {/* 1. PINCODE INPUT WITH INLINE VERIFY BUTTON */}
          <div className="flex items-stretch gap-2 sm:gap-2.5">
            <div className="relative flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 bg-white focus-within:border-[#6B1725] focus-within:ring-1 focus-within:ring-[#6B1725]/20 transition-all shadow-2xs">
              <MapPin size={18} className="text-gray-600 shrink-0" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={inputPincode}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputPincode.length === 6 && !isPincodeLoading) {
                    e.preventDefault();
                    executeSave();
                  }
                }}
                placeholder="848101"
                className="w-full text-[16px] sm:text-base font-bold text-gray-900 outline-none bg-transparent font-mono tracking-wider placeholder:text-gray-300"
              />
              {isPincodeLoading ? (
                <Loader2 size={15} className="animate-spin text-[#6B1725] shrink-0" />
              ) : inputPincode.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setInputPincode('');
                    setSelectedAddressId('');
                  }}
                  className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  aria-label="Clear pincode"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => checkPincode(inputPincode)}
              disabled={inputPincode.length !== 6 || isPincodeLoading}
              className="bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] shrink-0"
            >
              {isPincodeLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin text-white" />
                  <span>...</span>
                </>
              ) : (
                <>
                  <span>Verify</span>
                  <ArrowRight size={14} strokeWidth={2.2} />
                </>
              )}
            </button>
          </div>

          {/* Quick Select Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Zap size={13} className="text-[#8C2234] fill-[#8C2234]" />
                <span className="text-xs sm:text-[13px] font-bold text-gray-900">Quick Select</span>
              </div>
              <button
                type="button"
                className="text-[11px] font-semibold text-[#6B1725] hover:text-[#52111C] flex items-center gap-0.5 cursor-pointer"
              >
                <span>Popular Cities</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {SUGGESTED_PINCODES.map((sug) => {
                const isSelected = inputPincode === sug.pin;
                return (
                  <button
                    key={sug.pin}
                    type="button"
                    onClick={() => {
                      setInputPincode(sug.pin);
                      setCity(sug.city);
                      checkPincode(sug.pin);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full border text-[11px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#6B1725] text-white border-[#6B1725] shadow-xs'
                        : 'bg-[#FAF9F9] border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <MapPin size={11} className={isSelected ? 'text-white fill-white' : 'text-gray-400'} />
                    <span>{sug.city} ({sug.pin})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. DELIVERY SERVICEABILITY RESULT CARD */}
          {errorMsg ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-800 text-xs">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-xs">Delivery Unavailable</div>
                <p className="text-[11px] text-red-700">{errorMsg}</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#FFF9F9] border border-[#F5E6E8] rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {/* Delivery Illustration */}
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-[#FFF0F3]">
                  <img
                    src={isInput20Min ? '/expressdel.webp' : '/standarddel.webp'}
                    alt={isInput20Min ? 'Express Delivery' : 'Standard Delivery'}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Thin vertical separator */}
                <div className="h-10 w-[1px] bg-gray-200/80 shrink-0 hidden sm:block" />

                {/* Text Info */}
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-gray-900 leading-tight">
                    {isInput20Min ? 'Samastipur Express Delivery' : 'Standard India Delivery'}
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                      <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                      <span>{isInput20Min ? timingStatus.badgeText.replace('✓', '').trim() : 'Standard Delivery'}</span>
                    </span>
                  </div>
                  <p className="text-[10.5px] text-gray-500 leading-snug line-clamp-2">
                    {isInput20Min
                      ? timingStatus.descText
                      : `${deliveryDateInfo.deliveryByText} to ${getQuickCity(inputPincode) ? `${getQuickCity(inputPincode)}, ${inputPincode}` : inputPincode}. Standard courier & COD available.`}
                  </p>
                </div>
              </div>

              {/* Estimated / Timing Box */}
              <div className="bg-[#FBF4F5] border border-[#F2E2E5] rounded-lg p-2 text-center shrink-0 min-w-[85px] sm:min-w-[95px]">
                <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-gray-700">
                  <Clock size={11} className="text-gray-700 shrink-0" />
                  <span>
                    {isInput20Min
                      ? (timingStatus.isNormalHours
                          ? 'Estimated'
                          : (timingStatus.badgeText.includes('Today') ? 'Today' : 'Tomorrow'))
                      : 'Estimated'}
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-[#6B1725] mt-0.5 tracking-tight">
                  {isInput20Min
                    ? (timingStatus.isNormalHours ? '20 MINS' : '10:00 AM')
                    : (deliveryDateInfo.flipkartFormat || '3-5 Days')}
                </div>
              </div>
            </div>
          )}

          {/* 3. SAVED ADDRESSES (IF ANY) */}
          {shippingAddresses && shippingAddresses.length > 0 && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-gray-800">Saved Locations</span>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                {shippingAddresses.map((addr: any) => {
                  const isSelected = selectedAddressId
                    ? addr.id === selectedAddressId
                    : (Boolean(inputPincode) && addr.pincode?.trim() === inputPincode.trim());
                  const IconComponent = addr.address_label?.toLowerCase() === 'work' ? Building : Home;

                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-left border transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-[#FAF6EE] border-[#6B1725] text-[#6B1725] ring-1 ring-[#6B1725]/30 font-bold shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-[#6B1725]'
                      }`}
                    >
                      <IconComponent size={13} className={isSelected ? 'text-[#6B1725]' : 'text-gray-500'} />
                      <div>
                        <div className="text-[10.5px] font-bold text-gray-900 leading-tight truncate max-w-[110px]">
                          {addr.address_label || 'Home'} · {addr.city}
                        </div>
                        <div className="text-[9.5px] text-gray-500 font-mono">
                          PIN: {addr.pincode}
                        </div>
                      </div>
                      {isSelected && <Check size={11} className="text-[#6B1725] ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add a new address divider button */}
          <div className="relative flex items-center justify-center pt-0.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200/80" />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!user) setIsAuthModalOpen(true);
                else setIsAddressModalOpen(true);
              }}
              className="relative bg-white px-2.5 py-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#6B1725] hover:text-[#52111C] cursor-pointer transition-colors"
            >
              <span className="w-4 h-4 rounded-full bg-[#FCE8ED] text-[#6B1725] flex items-center justify-center text-[10px] font-bold leading-none">
                +
              </span>
              <span>Add a new address to your account</span>
            </button>
          </div>
        </div>

        {/* 4. DELIVER TO THIS PINCODE BUTTON (BOTTOM) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={executeSave}
            onPointerUp={(e) => {
              if (e.pointerType === 'touch' && !isPincodeLoading && inputPincode.length === 6) {
                executeSave();
              }
            }}
            disabled={inputPincode.length !== 6 || isPincodeLoading}
            className={`w-full py-3 bg-[#6B1725] hover:bg-[#52111C] active:scale-[0.99] text-white rounded-full font-bold text-xs sm:text-[13px] tracking-wider uppercase transition-all shadow-md shadow-[#6B1725]/20 flex items-center justify-center gap-1.5 select-none ${
              inputPincode.length !== 6 || isPincodeLoading
                ? 'opacity-50 cursor-not-allowed pointer-events-none'
                : 'cursor-pointer'
            }`}
          >
            {isPincodeLoading ? (
              <>
                <Loader2 size={14} className="animate-spin text-white" />
                <span>Checking Delivery...</span>
              </>
            ) : (
              <>
                <span>DELIVER TO {inputPincode || 'THIS PINCODE'}</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── ADD NEW ADDRESS MODAL ── */}
      <AddNewAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onAddressSaved={(savedAddr) => {
          if (savedAddr && savedAddr.pincode) {
            const cleanPin = savedAddr.pincode.trim().slice(0, 6);
            setInputPincode(cleanPin);
            setCurrentPincode(cleanPin);
            if (savedAddr.id) setSelectedAddressId(savedAddr.id);
            checkPincode(cleanPin);
            setIsSheetOpen(true);
          }
        }}
      />
    </div>,
    document.body
  );
};
