"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X, Loader2, AlertCircle, Plus, Check, Home, Building, ChevronRight, Zap, Clock, ArrowRight, CheckCircle2, Plane, RotateCcw, ShieldCheck, Banknote, Sparkles } from 'lucide-react';
import { useCustomerLocation } from '../hooks/useCustomerLocation';
import { useStore } from '../context/StoreContext';
import { AddNewAddressModal } from './delivery/AddNewAddressModal';
import { getStandardDeliveryDateInfo } from '../lib/deliveryDates';
import { fetchDeliverySettings, DeliverySettings } from '../data/supabase';
import { triggerHaptic, blockGhostClicks, isGhostClickBlocked } from '../utils/haptics';

import { getQuickCity, fetchPincodeDetails } from '../lib/pincodeLookup';
import { getSameDayCountdownInfo, getExpressDeliveryInfo } from '../utils/deliveryCountdown';

const SUGGESTED_PINCODES = [
  { pin: '848101', city: 'Samastipur', label: 'Samastipur' },
  { pin: '800001', city: 'Patna', label: 'Patna' },
  { pin: '110001', city: 'Delhi', label: 'Delhi' }
];

export const markPincodeSheetClosed = () => {
  blockGhostClicks(750);
};

export const isPincodeSheetRecentlyClosed = () => {
  return isGhostClickBlocked();
};

export const openPincodeSheet = (pincode?: any) => {
  if (typeof window !== 'undefined') {
    // Guard against React SyntheticEvent objects passed when openPincodeSheet is used directly in onClick
    const validPin = typeof pincode === 'string' && /^\d{6}$/.test(pincode.trim()) ? pincode.trim() : undefined;
    window.dispatchEvent(new CustomEvent('open-pincode-sheet', { detail: { pincode: validPin } }));
  }
};

export const closePincodeSheet = () => {
  markPincodeSheetClosed();
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

export type DeliveryTier = 'express' | 'same_day' | 'standard';

// Helper to determine delivery tier:
// Tier 1: Express (< 5 km) - 848101, 848102
// Tier 2: Same Day (5 - 10 km) - 848134, outer Samastipur blocks
// Tier 3: Standard (> 10 km) - rest of India
export const checkDeliveryTier = (pin: string, deliveryRes?: any): DeliveryTier => {
  const clean = pin?.trim() || '';
  if (!clean) return 'standard';

  // 1. Explicit Samastipur Town Center (< 5 km from showroom)
  if (clean === '848101' || clean === '848102') {
    return 'express';
  }

  // 2. Explicit Samastipur Outer / Suburban Blocks (5 km to 10 km from showroom, e.g. 848134 Jitwarpur/Warisnagar)
  if (clean === '848134' || (clean.startsWith('8481') && clean !== '848114')) {
    return 'same_day';
  }

  // 3. Dynamic distance calculation from API
  if (deliveryRes && deliveryRes.pincode === clean) {
    const dist = deliveryRes.distanceKm !== undefined ? Number(deliveryRes.distanceKm) : undefined;
    if (dist !== undefined) {
      if (dist <= 5.0 && (deliveryRes.is20MinDelivery || deliveryRes.isExpress || deliveryRes.eligible)) {
        return 'express';
      }
      if (dist <= 10.0) {
        return 'same_day';
      }
      return 'standard';
    }
    if (deliveryRes.is20MinDelivery || deliveryRes.isExpress) return 'express';
    if (deliveryRes.options?.some((o: any) => o.id === 'same_day' && o.available)) return 'same_day';
  }

  return 'standard';
};

export const checkIsExpress = (pin: string, deliveryRes?: any) => {
  return checkDeliveryTier(pin, deliveryRes) === 'express';
};

export const checkIsSameDay = (pin: string, deliveryRes?: any) => {
  return checkDeliveryTier(pin, deliveryRes) === 'same_day';
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

  const activeTier = checkDeliveryTier(activePin, result);
  const is20Min = activeTier === 'express';
  const isSameDay = activeTier === 'same_day';

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
        {isSameDay && (
          <span className="text-[9px] font-bold text-amber-200 bg-amber-900/80 border border-amber-500/30 px-1.5 py-0.5 rounded-md shrink-0">
            🟢 Same-Day
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
        {isSameDay && (
          <span className="text-[9.5px] font-bold text-amber-200 bg-amber-900/80 border border-amber-500/30 px-1.5 py-0.5 rounded-md shrink-0">
            🟢 Same-Day
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

const EXPRESS_SHOWCASE_STEPS = [
  {
    step: '01',
    label: 'Order',
    title: 'Instant Order Confirmation',
    image: '/quick-delivery/quick_delivery_01.webp',
    fallback: '/quick%20deivery/quick_delivery_01.webp'
  },
  {
    step: '02',
    label: '20m Ride',
    title: 'Express Rider Dispatched',
    image: '/quick-delivery/quick_delivery_02.webp',
    fallback: '/quick%20deivery/quick_delivery_02.webp'
  },
  {
    step: '03',
    label: 'Doorstep',
    title: 'Luxury Box Handover',
    image: '/quick-delivery/quick_delivery_03.webp',
    fallback: '/quick%20deivery/quick_delivery_03.webp'
  },
  {
    step: '04',
    label: 'Unbox',
    title: 'Unbox in Just 20 Minutes',
    image: '/quick-delivery/quick_delivery_04.webp',
    fallback: '/quick%20deivery/quick_delivery_04.webp'
  }
];

export const PincodeExpressShowcase: React.FC<{ isExpress: boolean }> = ({ isExpress }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isExpanded, setIsExpanded] = useState(isExpress);

  // Auto-expand when pincode qualifies for express
  useEffect(() => {
    setIsExpanded(isExpress);
  }, [isExpress]);

  // Auto-advance showcase steps smoothly every 3.4 seconds
  useEffect(() => {
    if (!isExpanded) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % EXPRESS_SHOWCASE_STEPS.length);
    }, 3400);
    return () => clearInterval(timer);
  }, [isExpanded]);

  const current = EXPRESS_SHOWCASE_STEPS[activeIdx];

  return (
    <div className="bg-gradient-to-b from-[#FFFDF9] to-[#FAF7F0] border border-[#E7DFC9] rounded-2xl p-2.5 sm:p-3 shadow-2xs space-y-2 select-none overflow-hidden transition-all">
      {/* Header / Toggle */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725] shrink-0">
            <Zap size={11} className="fill-[#6B1725]" />
          </span>
          <span className="font-bold text-xs text-[#292524]">
            {isExpress ? 'How 20-Min Delivery Works' : 'Samastipur 20-Min Hand Delivery'}
          </span>
          {isExpress && (
            <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/60 px-1.5 py-0.2 rounded-full">
              Eligible
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#6B1725]">
          <span className="text-[10px] text-[#8C7A6B]">
            {isExpanded ? 'Hide' : 'See Steps'}
          </span>
          <ChevronRight size={12} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2 pt-0.5 animate-fadeIn">
          {/* Connected Waypoint Track */}
          <div className="flex items-center justify-between px-1">
            {EXPRESS_SHOWCASE_STEPS.map((s, idx) => {
              const isActive = idx === activeIdx;
              const isPassed = idx < activeIdx;

              return (
                <React.Fragment key={s.step}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIdx(idx);
                    }}
                    className="flex flex-col items-center group cursor-pointer focus:outline-hidden"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${
                        isActive
                          ? 'bg-[#6B1725] text-[#FAF7F0] shadow-xs scale-105 ring-2 ring-[#6B1725]/20'
                          : isPassed
                          ? 'bg-[#8C2234] text-[#FAF7F0]'
                          : 'bg-[#EFE8D6] text-[#8C7A6B]'
                      }`}
                    >
                      {isPassed ? '✓' : s.step}
                    </div>
                    <span
                      className={`text-[9.5px] mt-0.5 font-medium transition-colors ${
                        isActive ? 'text-[#6B1725] font-bold' : 'text-[#8C7A6B]'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>

                  {idx < EXPRESS_SHOWCASE_STEPS.length - 1 && (
                    <div className="flex-1 h-[2px] mx-1 -mt-3.5 bg-[#E8DEC7] relative rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#8C2234] to-[#6B1725] transition-all duration-400 ease-out"
                        style={{
                          width: idx < activeIdx ? '100%' : '0%'
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Pure Transparent Graphic Stage */}
          <div className="relative w-full aspect-[700/440] max-h-[118px] flex items-center justify-center bg-transparent">
            <div
              className="absolute inset-0 pointer-events-none opacity-30 blur-lg"
              style={{
                background: 'radial-gradient(ellipse at 50% 60%, rgba(212,175,55,0.2), transparent 70%)'
              }}
            />
            <img
              key={current.step}
              src={current.image}
              alt={current.title}
              className="w-full h-full object-contain block drop-shadow-sm animate-fadeIn"
              loading="eager"
              onError={(e) => {
                if (current.fallback && e.currentTarget.src !== current.fallback) {
                  e.currentTarget.src = current.fallback;
                }
              }}
            />
          </div>

          {/* Active Step Caption */}
          <div className="text-center">
            <span className="text-[11px] font-bold text-[#6B1725]">
              Step {current.step}: {current.title}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const PanIndiaDeliveryTrustCard: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-[#FFFDF9] to-[#FAF7F0] border border-[#E7DFC9] rounded-2xl p-3 sm:p-3.5 shadow-2xs select-none animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="w-5 h-5 rounded-full bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725] shrink-0">
          <ShieldCheck size={12} className="text-[#6B1725]" />
        </span>
        <span className="font-bold text-xs text-[#292524]">
          Pan-India Safe Delivery Promise
        </span>
        <span className="text-[9.5px] font-bold text-[#8C2234] bg-[#FCE8ED] border border-[#F2C2CB] px-1.5 py-0.2 rounded-full ml-auto">
          100% Insured
        </span>
      </div>

      {/* 2x2 Trust Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/90 border border-[#EFE8D6] rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-[#FAF6EE] text-[#6B1725] flex items-center justify-center mb-1.5 shrink-0">
            <Plane size={13} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-900 leading-tight">Express Air Transit</div>
            <div className="text-[10px] text-gray-500 leading-snug mt-0.5">Priority dispatch via BlueDart / Delhivery Air.</div>
          </div>
        </div>

        <div className="bg-white/90 border border-[#EFE8D6] rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-[#FAF6EE] text-[#6B1725] flex items-center justify-center mb-1.5 shrink-0">
            <RotateCcw size={13} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-900 leading-tight">3-Day Easy Returns</div>
            <div className="text-[10px] text-gray-500 leading-snug mt-0.5">Hassle-free doorstep pickup & exchange across India.</div>
          </div>
        </div>

        <div className="bg-white/90 border border-[#EFE8D6] rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-[#FAF6EE] text-[#6B1725] flex items-center justify-center mb-1.5 shrink-0">
            <ShieldCheck size={13} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-900 leading-tight">Transit Protected</div>
            <div className="text-[10px] text-gray-500 leading-snug mt-0.5">Full replacement guarantee if damaged in transit.</div>
          </div>
        </div>

        <div className="bg-white/90 border border-[#EFE8D6] rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-[#FAF6EE] text-[#6B1725] flex items-center justify-center mb-1.5 shrink-0">
            <Banknote size={13} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-900 leading-tight">Cash on Delivery</div>
            <div className="text-[10px] text-gray-500 leading-snug mt-0.5">Pay easily at doorstep via Cash or QR/UPI.</div>
          </div>
        </div>
      </div>

      {/* Footer reassurance */}
      <div className="mt-2.5 pt-2 border-t border-[#EFE8D6]/80 flex items-center justify-between text-[10px] text-[#8C7A6B]">
        <span className="flex items-center gap-1">
          <Sparkles size={11} className="text-[#D4AF37]" />
          <span>Direct from Samastipur Flagship Showroom</span>
        </span>
        <span className="font-semibold text-emerald-700">Zero Risk</span>
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
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);
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

      setIsSavedSuccess(false);
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
      markPincodeSheetClosed();
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
        markPincodeSheetClosed();
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

    // 1. Immediately mark pincode sheet closed to shield underlying PDP / Cart buttons from ghost clicks
    markPincodeSheetClosed();
    setIsSavedSuccess(true);

    // 2. Persist and check in background without blocking UI dismissal
    setCurrentPincode(clean);
    checkPincode(clean);

    // 3. Keep sheet in DOM for 150ms to absorb touch/click release and prevent ghost clicks
    setTimeout(() => {
      setIsSheetOpen(false);
      setIsSavedSuccess(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('close-pincode-sheet'));
      }
    }, 150);
  };

  const executeSave = () => {
    if (isSavingRef.current || isPincodeLoading || isSavedSuccess || inputPincode.length !== 6) return;
    isSavingRef.current = true;
    handleSavePincode(inputPincode);
    setTimeout(() => {
      isSavingRef.current = false;
    }, 500);
  };

  const inputTier = checkDeliveryTier(inputPincode, result);
  const isInput20Min = inputTier === 'express';
  const isInputSameDay = inputTier === 'same_day';
  const timingStatus = getExpressTimingStatus(result);
  const sheetExpressInfo = getExpressDeliveryInfo(20);
  const deliveryDateInfo = getStandardDeliveryDateInfo(new Date(), deliverySettings?.standard_delivery_days ?? 3);
  const sheetSameDayCountdown = getSameDayCountdownInfo(deliverySettings?.same_day_cutoff_time ?? '17:00:00', '6:30 PM');

  if (!mounted || !isSheetOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn p-0 sm:p-4">
      {/* Backdrop click to close */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          markPincodeSheetClosed();
          setIsSheetOpen(false);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('close-pincode-sheet'));
          }
        }}
      />

      {/* Modern Clean Drawer Card with Fixed Header, Scroll Body, and Sticky Bottom Action */}
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-in-from-bottom border border-gray-100 h-[88vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden">

        {/* Drawer Header (Fixed at Top) */}
        <div className="px-4 sm:px-5 pt-3 pb-2.5 border-b border-gray-100 shrink-0 relative bg-white">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-2.5 sm:hidden" />

          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              markPincodeSheetClosed();
              setIsSheetOpen(false);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('close-pincode-sheet'));
              }
            }}
            className="absolute right-3.5 top-3.5 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2.5 pr-8">
            <div className="w-8 h-8 rounded-full bg-[#FDF1F3] border border-[#FADCE2] flex items-center justify-center shrink-0 shadow-2xs">
              <MapPin size={15} className="text-[#6B1725] fill-[#6B1725]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight leading-tight">
                Check Delivery Availability
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                Check 20-min express speed & Pan-India courier
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 space-y-3.5">

          {/* 1. PINCODE INPUT WITH INLINE VERIFY BUTTON */}
          <div className="flex items-stretch gap-2 sm:gap-2.5">
            <div className="relative flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 bg-white focus-within:border-[#6B1725] focus-within:ring-1 focus-within:ring-[#6B1725]/20 transition-all shadow-2xs">
              <MapPin size={18} className="text-gray-500 shrink-0" />
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

          {/* Quick Select Section (Compact 1-row grid) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Zap size={11} className="text-[#8C2234] fill-[#8C2234]" />
                <span className="text-[11.5px] font-bold text-gray-800">Quick Select</span>
              </div>
              <span className="text-[10px] text-gray-400">Tap to check</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
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
                    className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'bg-[#6B1725] text-white border-[#6B1725] shadow-xs'
                        : 'bg-[#FAF9F9] border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <MapPin size={10} className={isSelected ? 'text-white fill-white' : 'text-gray-400 shrink-0'} />
                    <span className="truncate">{sug.city}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. DELIVERY SERVICEABILITY RESULT CARD (ORIGINAL ICONS INTACT) */}
          {errorMsg ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-800 text-xs">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-xs">Delivery Unavailable</div>
                <p className="text-[11px] text-red-700">{errorMsg}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="bg-[#FFF9F9] border border-[#F5E6E8] rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {/* Delivery Illustration (ORIGINAL ICONS) */}
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-[#FFF0F3]">
                    <img
                      src={
                        inputTier === 'express'
                          ? '/expressdel.webp'
                          : inputTier === 'same_day'
                          ? '/sameday.webp'
                          : '/standarddel.webp'
                      }
                      alt={
                        inputTier === 'express'
                          ? 'Express Delivery'
                          : inputTier === 'same_day'
                          ? 'Same Day Delivery'
                          : 'Standard Delivery'
                      }
                      className={`w-full h-full object-contain ${
                        inputTier === 'express' ? 'animate-rider-pulse' : ''
                      }`}
                    />
                  </div>

                  {/* Thin vertical separator */}
                  <div className="h-10 w-[1px] bg-gray-200/80 shrink-0 hidden sm:block" />

                  {/* Text Info */}
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="font-bold text-xs sm:text-sm text-gray-900 leading-tight">
                      {inputTier === 'express'
                        ? 'Samastipur Express Delivery'
                        : inputTier === 'same_day'
                        ? 'Samastipur Same Day Delivery'
                        : 'Standard India Delivery'}
                    </div>
                    <div>
                      {inputTier === 'express' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                          <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                          <span>{timingStatus.badgeText.replace('✓', '').trim()} · 20-Min</span>
                        </span>
                      )}
                      {inputTier === 'same_day' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span>Same-Day Guaranteed</span>
                        </span>
                      )}
                      {inputTier === 'standard' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold">
                          <CheckCircle2 size={11} className="text-blue-600 shrink-0" />
                          <span>Standard Delivery</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-gray-500 leading-snug line-clamp-2">
                      {inputTier === 'express'
                        ? (timingStatus.isNormalHours
                            ? `Order now to get by ${sheetExpressInfo.timeStr} (~20 mins). Direct from showroom.`
                            : timingStatus.descText)
                        : inputTier === 'same_day'
                        ? (sheetSameDayCountdown.isBeforeCutoff
                            ? `Order in next ${sheetSameDayCountdown.countdownText} to get this by 6:30 PM today.`
                            : `Order now for delivery tomorrow evening by 6:30 PM.`)
                        : `${deliveryDateInfo.deliveryByText} to ${getQuickCity(inputPincode) ? `${getQuickCity(inputPincode)}, ${inputPincode}` : inputPincode}. Standard courier & COD available.`}
                    </p>
                  </div>
                </div>

                {/* Estimated / Timing Box */}
                <div className="bg-[#FBF4F5] border border-[#F2E2E5] rounded-lg p-2 text-center shrink-0 min-w-[85px] sm:min-w-[95px]">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-gray-700">
                    <Clock size={11} className="text-gray-700 shrink-0" />
                    <span>
                      {inputTier === 'express'
                        ? (timingStatus.isNormalHours
                            ? 'Get by'
                            : (timingStatus.badgeText.includes('Today') ? 'Today' : 'Tomorrow'))
                        : inputTier === 'same_day'
                        ? (sheetSameDayCountdown.isBeforeCutoff ? 'Today' : 'Tomorrow')
                        : 'Estimated'}
                    </span>
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold text-[#6B1725] mt-0.5 tracking-tight">
                    {inputTier === 'express'
                      ? (timingStatus.isNormalHours ? sheetExpressInfo.timeStr : '10:00 AM')
                      : inputTier === 'same_day'
                      ? '6:30 PM'
                      : (deliveryDateInfo.flipkartFormat || '3-5 Days')}
                  </div>
                </div>
              </div>

              {/* Either 20-Min Delivery Showcase (ONLY for Express) OR Pan-India Safe Delivery Promise (Standard) */}
              {isInput20Min ? (
                <PincodeExpressShowcase isExpress={true} />
              ) : (
                <PanIndiaDeliveryTrustCard />
              )}
            </div>
          )}

          {/* 3. SAVED ADDRESSES (IF ANY) */}
          {shippingAddresses && shippingAddresses.length > 0 && (
            <div className="space-y-1.5 pt-1">
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

          {/* Add a new address button */}
          <div className="pt-0.5 pb-1 text-center">
            <button
              type="button"
              onClick={() => {
                if (!user) setIsAuthModalOpen(true);
                else setIsAddressModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B1725] hover:underline cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full bg-[#FCE8ED] text-[#6B1725] flex items-center justify-center text-[10px] font-bold">
                +
              </span>
              <span>Add a new address to your account</span>
            </button>
          </div>
        </div>

        {/* Sticky Pinned Bottom Button (ALWAYS VISIBLE!) */}
        <div className="shrink-0 px-4 sm:px-5 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-3.5 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              executeSave();
            }}
            disabled={inputPincode.length !== 6 || isPincodeLoading || isSavedSuccess}
            className={`w-full py-3 bg-[#6B1725] hover:bg-[#52111C] active:scale-[0.99] text-white rounded-full font-bold text-xs sm:text-[13px] tracking-wider uppercase transition-all shadow-md shadow-[#6B1725]/20 flex items-center justify-center gap-1.5 select-none ${
              inputPincode.length !== 6 || isPincodeLoading || isSavedSuccess
                ? 'opacity-60 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            {isPincodeLoading ? (
              <>
                <Loader2 size={14} className="animate-spin text-white" />
                <span>Checking Delivery...</span>
              </>
            ) : isSavedSuccess ? (
              <>
                <Check size={15} strokeWidth={2.5} className="text-white" />
                <span>DELIVERING TO {inputPincode}</span>
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
