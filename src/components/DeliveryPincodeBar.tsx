"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X, Loader2, AlertCircle, Plus, Check, Home, Building, Sparkles } from 'lucide-react';
import { useCustomerLocation } from '../hooks/useCustomerLocation';
import { ExpressRiderIcon, StandardTruckIcon } from './delivery/DeliveryIcons';
import { useStore } from '../context/StoreContext';
import { AddNewAddressModal } from './delivery/AddNewAddressModal';

const SUGGESTED_PINCODES = [
  { pin: '848101', label: 'Samastipur (Express 20-Min)' },
  { pin: '848114', label: 'Darbhanga' },
  { pin: '110001', label: 'Delhi NCR' },
  { pin: '560001', label: 'Bengaluru' }
];

export const openPincodeSheet = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-pincode-sheet'));
  }
};

const getExpressTimingStatus = (result?: any) => {
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
      descText: 'Order before 8 PM for 20-minute hand delivery in Samastipur.'
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

export const DeliveryPincodeBar: React.FC = () => {
  const { user, shippingAddresses, setIsAuthModalOpen } = useStore();
  const [pincode, setPincode] = useState<string>('848101');
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [inputPincode, setInputPincode] = useState<string>('848101');
  const [mounted, setMounted] = useState<boolean>(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);

  const { isLoading, result, errorMsg, checkPincode } = useCustomerLocation();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedPin = sessionStorage.getItem('selected_delivery_pincode') || localStorage.getItem('user_pincode') || '848101';
      setPincode(savedPin);
      setInputPincode(savedPin);
      checkPincode(savedPin);

      const savedAddrId = sessionStorage.getItem('selected_delivery_address_id');
      if (savedAddrId) setSelectedAddressId(savedAddrId);
    }
  }, [checkPincode]);

  useEffect(() => {
    const handleOpenSheet = () => {
      if (typeof window !== 'undefined') {
        const savedPin = sessionStorage.getItem('selected_delivery_pincode') || localStorage.getItem('user_pincode') || '848101';
        setInputPincode(savedPin);
        checkPincode(savedPin);

        const savedAddrId = sessionStorage.getItem('selected_delivery_address_id');
        if (savedAddrId) setSelectedAddressId(savedAddrId);
      }
      setIsSheetOpen(true);
    };

    window.addEventListener('open-pincode-sheet', handleOpenSheet);
    return () => {
      window.removeEventListener('open-pincode-sheet', handleOpenSheet);
    };
  }, [checkPincode]);

  const handleInputChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setInputPincode(clean);
    setSelectedAddressId('');
    if (clean.length === 6) {
      checkPincode(clean);
    }
  };

  const handleSelectSavedAddress = (addr: any) => {
    if (!addr || !addr.pincode) return;
    const cleanPin = addr.pincode.trim().slice(0, 6);
    setSelectedAddressId(addr.id || '');
    setInputPincode(cleanPin);

    if (typeof window !== 'undefined' && addr.id) {
      sessionStorage.setItem('selected_delivery_address_id', addr.id);
      sessionStorage.setItem('selected_delivery_pincode', cleanPin);
    }
    checkPincode(cleanPin);
  };

  const handleSavePincode = (pinToSave: string) => {
    if (/^\d{6}$/.test(pinToSave)) {
      setPincode(pinToSave);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('selected_delivery_pincode', pinToSave);
        localStorage.setItem('user_pincode', pinToSave);
        window.dispatchEvent(new CustomEvent('pincode-updated', { detail: { pincode: pinToSave } }));
      }
      setIsSheetOpen(false);
    }
  };

  const is20Min = result
    ? (result.is20MinDelivery || (result.distanceKm !== undefined && result.distanceKm <= 20) || (result as any).eligible)
    : (inputPincode === '848101' || inputPincode === '848114');

  const timingStatus = getExpressTimingStatus(result);

  const sheetContent = isSheetOpen ? (
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
              className="bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-50 text-white text-xs font-bold px-4 rounded-xl transition-colors cursor-pointer"
            >
              Verify
            </button>
          </div>
        </div>

        {/* 2. DELIVERY SERVICEABILITY RESULT BANNER (SECOND) */}
        {errorMsg ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-700 text-xs">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className={`border rounded-2xl p-3.5 flex items-center gap-3 ${is20Min
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              : 'bg-[#FAF6EE] border-[#E5DEC9] text-[#292524]'
            }`}>
            {is20Min ? (
              <ExpressRiderIcon className="w-9 h-9 shrink-0" />
            ) : (
              <StandardTruckIcon className="w-9 h-9 shrink-0" />
            )}
            <div className="space-y-0.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-serif font-bold text-xs text-[#292524]">
                  {is20Min ? 'Samastipur Express Delivery' : 'Standard India Delivery'}
                </span>
                {is20Min && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    {timingStatus.badgeText}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-sans text-[#7A6E65] leading-relaxed">
                {is20Min ? (
                  <span><strong>{timingStatus.timingText}:</strong> {timingStatus.descText}</span>
                ) : (
                  <span><strong>3–5 Business Days</strong> to {inputPincode}. Free delivery & COD available.</span>
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
                  : (addr.is_default || (shippingAddresses.length > 0 && shippingAddresses[0].id === addr.id));
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
            onClick={() => handleSavePincode(inputPincode)}
            disabled={inputPincode.length !== 6 || isLoading}
            className="w-full py-3 bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-50 text-white rounded-full font-serif font-bold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            Deliver to {inputPincode}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* ── 1. DARK MAROON PINCODE BAR ── */}
      <div className="w-full bg-[#4A121A] text-[#FAF7F0] px-4 py-2 flex items-center justify-between text-xs border-t border-[#B08A3C]/20">
        <div
          onClick={() => { setInputPincode(pincode); checkPincode(pincode); setIsSheetOpen(true); }}
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity truncate"
        >
          <MapPin size={13} className="text-[#D4B870] shrink-0" />
          <span className="font-sans font-medium text-[11px] sm:text-xs truncate">
            Deliver to <strong className="font-bold text-white">{pincode}</strong> — {is20Min ? timingStatus.timingText : 'Standard 3-5 days delivery'}
          </span>
        </div>
        <button
          onClick={() => { setInputPincode(pincode); checkPincode(pincode); setIsSheetOpen(true); }}
          className="text-[11px] font-sans font-semibold text-[#FAF7F0] underline hover:text-[#D4B870] shrink-0 ml-2 cursor-pointer"
        >
          Change
        </button>
      </div>

      {/* ── 2. BOTTOM SHEET DRAWER VIA PORTAL ── */}
      {mounted && sheetContent && createPortal(sheetContent, document.body)}

      {/* ── 3. ADD NEW ADDRESS MODAL ── */}
      <AddNewAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onAddressSaved={(savedAddr) => {
          if (savedAddr && savedAddr.pincode) {
            const cleanPin = savedAddr.pincode.trim().slice(0, 6);
            setInputPincode(cleanPin);
            setPincode(cleanPin);
            if (savedAddr.id) setSelectedAddressId(savedAddr.id);
            checkPincode(cleanPin);

            if (typeof window !== 'undefined') {
              sessionStorage.setItem('selected_delivery_pincode', cleanPin);
              localStorage.setItem('user_pincode', cleanPin);
              if (savedAddr.id) {
                sessionStorage.setItem('selected_delivery_address_id', savedAddr.id);
              }
              window.dispatchEvent(new CustomEvent('pincode-updated', { detail: { pincode: cleanPin } }));
            }
            // Keep pincode sheet open so user sees updated address list & timing!
            setIsSheetOpen(true);
          }
        }}
      />
    </>
  );
};
