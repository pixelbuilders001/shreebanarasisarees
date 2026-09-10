"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X, Loader2, AlertCircle, Plus, Check, Home, Building, ChevronRight } from 'lucide-react';
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
  const isSavingRef = useRef<boolean>(false);

  const { isLoading, result, errorMsg, checkPincode } = useCustomerLocation();

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
      fetchPincodeDetails(pin).then((details) => {
        if (details?.city) setCity(details.city);
      }).catch(() => {});

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
      fetchPincodeDetails(clean).then((details) => {
        if (details?.city) {
          setCity(details.city);
        }
      }).catch(() => {});
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
    if (isSavingRef.current) return;
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
      <div className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 animate-slide-in-from-bottom border border-[#E5DEC9] max-h-[85vh] overflow-y-auto">

        {/* Drawer Grab Handle */}
        <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto -mt-1 mb-1 sm:hidden" />

        {/* Header with Close Button Only */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setIsSheetOpen(false)}
            className="p-1.5 rounded-full text-[#7A6E65] hover:text-[#292524] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. PINCODE INPUT WITH INLINE CHECK BUTTON (FIRST) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#7A6E65] uppercase tracking-wider font-serif block">
            Enter Pincode
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={inputPincode}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputPincode.length === 6) {
                    e.preventDefault();
                    executeSave();
                  }
                }}
                placeholder="Enter 6-digit pincode"
                className="w-full bg-[#FAF6EE] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 text-xs font-sans font-medium text-[#292524] focus:outline-none focus:border-[#6B1725] transition-colors font-mono"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B1725]">
                  <Loader2 size={14} className="animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={() => checkPincode(inputPincode)}
              disabled={inputPincode.length !== 6 || isLoading}
              className="bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-50 text-white text-xs font-bold px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-w-[70px]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin text-white" />
                  <span>...</span>
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>

          {/* Quick Suggested Cities Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10.5px] text-[#7A6E65] font-medium">Quick select:</span>
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
                  className={`text-[10.5px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-medium ${
                    isSelected
                      ? 'bg-[#6B1725] text-white border-[#6B1725]'
                      : 'bg-[#FAF6EE] text-[#52111C] border-[#E5DEC9] hover:border-[#6B1725]'
                  }`}
                >
                  {sug.city} ({sug.pin})
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. DELIVERY SERVICEABILITY RESULT BANNER (SECOND) */}
        {errorMsg ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-700 text-xs">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className={`border rounded-2xl p-3.5 flex items-center gap-3 ${isInput20Min
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              : 'bg-[#FAF6EE] border-[#E5DEC9] text-[#292524]'
            }`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
              isInput20Min ? 'bg-white border border-emerald-200 shadow-2xs' : 'bg-white border border-[#E5DEC9] shadow-2xs'
            }`}>
              <img
                src={isInput20Min ? '/expressdel.webp' : '/standarddel.webp'}
                alt={isInput20Min ? 'Express Delivery' : 'Standard Delivery'}
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-serif font-bold text-xs text-[#292524]">
                  {isInput20Min ? 'Samastipur Express Delivery' : 'Standard India Delivery'}
                </span>
                {isInput20Min && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    {timingStatus.badgeText}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-sans text-[#7A6E65] leading-relaxed">
                {isInput20Min ? (
                  <span><strong>{timingStatus.timingText}:</strong> {timingStatus.descText}</span>
                ) : (
                  <span>
                    <strong>{deliveryDateInfo.deliveryByText}</strong> to {getQuickCity(inputPincode) ? `${getQuickCity(inputPincode)}, ${inputPincode}` : inputPincode}. Standard courier & COD available.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* 3. SAVED ADDRESSES SLIDER & ADD ADDRESS LINK (THIRD) */}
        {shippingAddresses && shippingAddresses.length > 0 ? (
          <div className="space-y-1.5 pt-1 border-t border-[#F3ECE0]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-serif font-bold text-[#292524]">Saved Locations</span>
              <button
                onClick={() => {
                  if (!user) setIsAuthModalOpen(true);
                  else setIsAddressModalOpen(true);
                }}
                className="text-[11px] font-bold text-[#6B1725] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus size={12} />
                <span>New Address</span>
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {shippingAddresses.map((addr: any) => {
                const isSelected = selectedAddressId
                  ? addr.id === selectedAddressId
                  : (Boolean(inputPincode) && addr.pincode?.trim() === inputPincode.trim());
                const IconComponent = addr.address_label?.toLowerCase() === 'work' ? Building : Home;

                return (
                  <button
                    key={addr.id}
                    onClick={() => handleSelectSavedAddress(addr)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left border transition-all shrink-0 cursor-pointer ${isSelected
                        ? 'bg-[#FAF6EE] border-[#6B1725] text-[#6B1725] ring-1 ring-[#6B1725]/30 font-bold shadow-xs'
                        : 'bg-white border-[#E5DEC9] text-[#7A6E65] hover:border-[#6B1725]'
                      }`}
                  >
                    <IconComponent size={14} className={isSelected ? 'text-[#6B1725]' : 'text-[#7A6E65]'} />
                    <div>
                      <div className="text-[11px] font-bold text-[#292524] leading-tight truncate max-w-[120px]">
                        {addr.address_label || 'Home'} · {addr.city}
                      </div>
                      <div className="text-[10px] text-[#7A6E65] font-mono">
                        PIN: {addr.pincode}
                      </div>
                    </div>
                    {isSelected && <Check size={12} className="text-[#6B1725] ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (!user) setIsAuthModalOpen(true);
              else setIsAddressModalOpen(true);
            }}
            className="w-full text-center text-xs font-bold text-[#6B1725] hover:underline cursor-pointer py-1"
          >
            + Add a new address to your account
          </button>
        )}

        {/* 4. SAVE & DELIVER TO THIS PINCODE BUTTON (FOURTH) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={executeSave}
            onPointerUp={(e) => {
              if (e.pointerType === 'touch') {
                executeSave();
              }
            }}
            disabled={inputPincode.length !== 6}
            className="w-full py-3 bg-[#6B1725] hover:bg-[#52111C] active:scale-[0.99] disabled:opacity-50 text-white rounded-full font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 select-none"
          >
            Deliver to {inputPincode}
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
