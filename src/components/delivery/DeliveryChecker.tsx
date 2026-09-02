import React, { useState } from 'react';
import { MapPin, Navigation, Clock, CheckCircle2, AlertCircle, RefreshCw, PackageX, Sparkles, ChevronDown, Plus, Moon } from 'lucide-react';
import { useCustomerLocation } from '../../hooks/useCustomerLocation';
import { ExpressRiderIcon, StandardTruckIcon } from './DeliveryIcons';
import { useStore } from '../../context/StoreContext';
import { AddNewAddressModal } from './AddNewAddressModal';

// Helper to check if current time in IST is after 8:00 PM (20:00) or before 9:00 AM (09:00)
const isAfter8PMCutoff = (): boolean => {
  try {
    const istHourString = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    }).format(new Date());
    const hour = parseInt(istHourString, 10);
    return hour >= 20 || hour < 9;
  } catch {
    const localHour = new Date().getHours();
    return localHour >= 20 || localHour < 9;
  }
};

interface DeliveryCheckerProps {
  initialPincode?: string;
  onResultChange?: (result: any) => void;
  className?: string;
}

export function DeliveryChecker({ initialPincode = '', onResultChange, className = '' }: DeliveryCheckerProps) {
  const [pincodeInput, setPincodeInput] = useState(initialPincode);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const { loadingState, isLoading, result, errorMsg, checkGpsLocation, checkPincode, resetState } = useCustomerLocation();

  // Retrieve saved shipping addresses safely from StoreContext
  let shippingAddresses: any[] = [];
  try {
    const store = useStore();
    if (store && Array.isArray(store.shippingAddresses)) {
      shippingAddresses = store.shippingAddresses;
    }
  } catch {
    // Fallback if rendered outside StoreProvider context
  }

  const handleAddressSaved = (savedAddr: any) => {
    if (savedAddr && savedAddr.pincode) {
      const cleanPin = savedAddr.pincode.trim().slice(0, 6);
      setPincodeInput(cleanPin);
      if (savedAddr.id) {
        setSelectedAddressId(savedAddr.id);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('selected_delivery_address_id', savedAddr.id);
          sessionStorage.setItem('selected_delivery_pincode', cleanPin);
        }
      }
      checkPincode(cleanPin);
    }
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedAddressId(val);
    if (!val) return;

    const chosenAddr = shippingAddresses.find((a: any) => (a.id && a.id === val) || (a.pincode && a.pincode === val));
    if (chosenAddr && chosenAddr.pincode) {
      const cleanPin = chosenAddr.pincode.trim().slice(0, 6);
      setPincodeInput(cleanPin);
      if (typeof window !== 'undefined' && chosenAddr.id) {
        sessionStorage.setItem('selected_delivery_address_id', chosenAddr.id);
        sessionStorage.setItem('selected_delivery_pincode', cleanPin);
      }
      checkPincode(cleanPin);
    }
  };

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setSelectedAddressId('');
    if (typeof window !== 'undefined' && pincodeInput.length === 6) {
      sessionStorage.removeItem('selected_delivery_address_id');
      sessionStorage.setItem('selected_delivery_pincode', pincodeInput);
    }
    checkPincode(pincodeInput);
  };

  const handleGpsClick = () => {
    if (isLoading) return;
    setSelectedAddressId('');
    checkGpsLocation();
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincodeInput(val);
    setSelectedAddressId('');
  };

  const hasAutoSelectedRef = React.useRef(false);

  // Auto pre-select last selected address or default saved address on mount
  React.useEffect(() => {
    if (!hasAutoSelectedRef.current) {
      const savedSelectedId = typeof window !== 'undefined' ? sessionStorage.getItem('selected_delivery_address_id') : null;
      const savedSelectedPin = typeof window !== 'undefined' ? sessionStorage.getItem('selected_delivery_pincode') : null;

      // 1. Try restoring address by saved address ID
      let targetAddr = null;
      if (savedSelectedId && shippingAddresses && shippingAddresses.length > 0) {
        targetAddr = shippingAddresses.find((a: any) => a.id === savedSelectedId);
      }

      if (targetAddr && targetAddr.pincode) {
        hasAutoSelectedRef.current = true;
        const cleanPin = targetAddr.pincode.trim().slice(0, 6);
        setPincodeInput(cleanPin);
        setSelectedAddressId(targetAddr.id);
        checkPincode(cleanPin);
        return;
      }

      // 2. Try restoring by saved pincode string
      if (savedSelectedPin && /^\d{6}$/.test(savedSelectedPin)) {
        hasAutoSelectedRef.current = true;
        setPincodeInput(savedSelectedPin);
        checkPincode(savedSelectedPin);
        return;
      }

      // 3. Fall back to user's default saved address
      if (shippingAddresses && shippingAddresses.length > 0 && !initialPincode) {
        const defaultAddr = shippingAddresses.find((a: any) => a.is_default) || shippingAddresses[0];
        if (defaultAddr && defaultAddr.pincode) {
          hasAutoSelectedRef.current = true;
          const cleanPin = defaultAddr.pincode.trim().slice(0, 6);
          setPincodeInput(cleanPin);
          if (defaultAddr.id) {
            setSelectedAddressId(defaultAddr.id);
          }
          checkPincode(cleanPin);
        }
      }
    }
  }, [shippingAddresses, initialPincode]);

  // Pass result up if callback provided
  React.useEffect(() => {
    if (result && onResultChange) {
      onResultChange(result);
    }
  }, [result, onResultChange]);

  return (
    <div className={`bg-white border border-[#B08A3C]/30 rounded-2xl p-4 sm:p-5 text-[#292524] shadow-sm font-sans space-y-4 ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-2.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#292524] font-serif">
          {/* <Sparkles size={15} className="text-[#6B1725]" /> */}
          <span>Check Delivery Availability</span>
        </div>
        <span className="text-[10px] font-bold text-[#6B1725] bg-[#6B1725]/10 border border-[#6B1725]/20 px-2 py-0.5 rounded-full font-serif">
          20-Min Express
        </span>
      </div>

      {/* Main Input Controls */}
      <div className="space-y-3">
        {/* Pincode Input Form */}
        <form onSubmit={handlePincodeSubmit} className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="delivery-pincode-input" className="block text-[11px] font-bold text-[#6B625D] uppercase tracking-wider font-serif">
              Enter Pincode
            </label>

            {/* Small GPS CTA */}
            <button
              type="button"
              onClick={handleGpsClick}
              disabled={isLoading}
              className="text-[11px] font-serif font-bold text-[#6B1725] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-all"
              title="Detect location automatically via GPS"
            >
              <Navigation size={12} className={loadingState === 'locating' ? 'animate-spin text-[#6B1725]' : 'text-[#6B1725]'} />
              <span>{loadingState === 'locating' ? 'Detecting...' : '📍 Use GPS'}</span>
            </button>
          </div>

          <div className="flex gap-2">
            <input
              id="delivery-pincode-input"
              type="text"
              inputMode="numeric"
              pattern="^[1-9][0-9]{5}$"
              maxLength={6}
              value={pincodeInput}
              onChange={handlePincodeChange}
              placeholder="e.g. 848101"
              disabled={isLoading}
              className="flex-1 bg-[#FAF7F0] border border-[#B08A3C]/35 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-xl px-3.5 py-2.5 outline-none font-mono font-medium disabled:opacity-60 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || pincodeInput.length !== 6}
              className="bg-[#6B1725] hover:bg-[#52111C] text-[#FAF7F0] text-xs font-serif font-bold tracking-wider px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs whitespace-nowrap"
            >
              {isLoading ? 'Checking...' : 'Check Delivery'}
            </button>
          </div>
        </form>

        {/* Saved Addresses Dropdown */}
        <div className="pt-2 space-y-1.5 border-t border-[#F3ECE0]">
          <div className="flex items-center justify-between">
            <span className="block text-[11px] font-bold text-[#6B625D] uppercase tracking-wider font-serif">
              {shippingAddresses.length > 0 ? 'Or Select From Saved Addresses' : 'Saved Addresses'}
            </span>
            <button
              type="button"
              onClick={() => setIsAddressModalOpen(true)}
              className="text-[11px] font-serif font-bold text-[#6B1725] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <Plus size={12} /> Add New Address
            </button>
          </div>

          {shippingAddresses.length > 0 && (
            <div className="relative">
              <select
                id="saved-address-select"
                value={selectedAddressId}
                onChange={handleDropdownChange}
                disabled={isLoading}
                className="w-full bg-[#FAF7F0] border border-[#B08A3C]/35 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-xl px-3.5 py-2.5 outline-none font-sans font-medium disabled:opacity-60 transition-all cursor-pointer appearance-none pr-8 text-ellipsis overflow-hidden"
              >
                <option value="">-- Choose a saved shipping address --</option>
                {shippingAddresses.map((addr: any, index: number) => {
                  const defaultPrefix = addr.is_default ? '★ DEFAULT ' : '';
                  const label = addr.address_label ? `[${defaultPrefix}${addr.address_label.toUpperCase()}]` : '[SAVED]';
                  const nameStr = addr.full_name ? `${addr.full_name}, ` : '';
                  const line1 = addr.address_line1 || '';
                  const line2 = addr.address_line2 ? `, ${addr.address_line2}` : '';
                  const cityState = `${addr.city ? `, ${addr.city}` : ''}${addr.state ? `, ${addr.state}` : ''}`;
                  const pinStr = addr.pincode ? ` (${addr.pincode})` : '';
                  const fullAddressText = `${label} ${nameStr}${line1}${line2}${cityState}${pinStr}`;
                  const valueKey = addr.id || `addr-${index}`;

                  return (
                    <option key={valueKey} value={valueKey}>
                      {fullAddressText}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#6B1725]">
                <ChevronDown size={14} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add New Address Modal */}
      <AddNewAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onAddressSaved={handleAddressSaved}
      />

      {/* Loading Banner */}
      {isLoading && (
        <div className="p-3 bg-[#FFF9F0] border border-[#B08A3C]/30 rounded-xl text-xs flex items-center gap-2.5 text-[#6B1725] animate-pulse">
          <div className="w-4 h-4 border-2 border-[#6B1725] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span className="font-medium">
            {loadingState === 'locating' ? 'Checking your location...' : 'Calculating delivery time...'}
          </span>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && !isLoading && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs space-y-2 text-red-700 animate-fadeIn">
          <div className="flex items-start gap-2 font-semibold">
            <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={resetState}
            className="text-[11px] font-serif font-bold text-[#6B1725] hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
          >
            <RefreshCw size={12} />
            Try Again
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && !isLoading && !errorMsg && (
        <div className="space-y-2.5 animate-fadeIn">

          {/* OUTSIDE SERVICE AREA */}
          {(result as any).isOutsideServiceArea ? (
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-1.5 text-stone-700">
              <div className="flex items-center gap-2 font-extrabold text-stone-800 font-serif">
                <PackageX size={16} className="text-stone-600" />
                <span>📦 Delivery Not Available</span>
              </div>
              <p className="text-[#6B625D] text-[11px]">
                We currently don&apos;t deliver to this location.
              </p>
            </div>
          ) : (result.is20MinDelivery || (result.distanceKm && result.distanceKm <= 20) || (result as any).eligible) ? (

            (result.isStoreClosed || isAfter8PMCutoff()) ? (
              /* UNDER 20 KM BUT AFTER 8 PM: EXPRESS DELIVERY CLOSED */
              <div className="p-4 bg-amber-50/95 border border-amber-300 rounded-xl text-xs space-y-2.5 text-amber-950 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 font-extrabold text-amber-900 text-sm font-serif">
                    <Moon className="w-5 h-5 flex-shrink-0 text-amber-700" />
                    <span>Express Delivery Closed Today</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    Order After 9 AM
                  </span>
                </div>

                <div className="space-y-1 text-xs text-amber-900 pt-2 border-t border-amber-200">
                  <div className="flex items-center gap-2 font-extrabold text-amber-950 text-xs">
                    <Clock size={15} className="text-amber-700 flex-shrink-0" />
                    <span>Order tomorrow after 9:00 AM for 20-min delivery</span>
                  </div>
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed pt-0.5">
                    Our 20-minute express delivery operates between 9:00 AM and 8:00 PM.
                  </p>
                  <div className="text-[10px] text-amber-700 font-medium">
                    {result.source === 'gps'
                      ? 'Based on your current location'
                      : `Verified for pincode ${result.pincode}`}
                  </div>
                </div>
              </div>
            ) : (
              /* UNDER 20 KM & DURING OPERATING HOURS: EXPRESS DELIVERY AVAILABLE */
              <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-xl text-xs space-y-2.5 text-emerald-950 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 font-extrabold text-emerald-800 text-sm font-serif">
                    <ExpressRiderIcon className="w-10 h-10 flex-shrink-0" />
                    <span>Express Delivery Available</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    ✓ Available
                  </span>
                </div>

                <div className="space-y-1 text-xs text-emerald-900 pt-2 border-t border-emerald-200/80">
                  <div className="flex items-center gap-2 font-extrabold text-emerald-950 text-xs">
                    <Clock size={15} className="text-emerald-700 flex-shrink-0" />
                    <span>Estimated arrival: ~{result.customerEtaMinutes || result.eta?.minutes || 20} minutes</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    {result.source === 'gps'
                      ? 'Based on your current location'
                      : `Verified for pincode ${result.pincode}`}
                  </div>
                </div>
              </div>
            )
          ) : (

            /* ABOVE 20 KM: STANDARD DELIVERY (3-5 DAYS) */
            <div className="p-4 bg-[#FAF7F0] border border-[#B08A3C]/30 rounded-xl text-xs space-y-2.5 text-[#292524] shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-extrabold text-[#6B1725] text-sm font-serif">
                  <StandardTruckIcon className="w-10 h-10 flex-shrink-0" />
                  <span>Standard Delivery Available</span>
                </div>
                <span className="text-[10px] font-bold text-[#6B1725] bg-[#6B1725]/10 px-2.5 py-0.5 rounded-full border border-[#6B1725]/20 font-serif">
                  3–5 Days
                </span>
              </div>

              <div className="space-y-1 text-xs text-[#6B625D] pt-2 border-t border-[#B08A3C]/20">
                <div className="flex items-center gap-2 font-bold text-[#292524] text-xs">
                  <Clock size={15} className="text-[#6B1725] flex-shrink-0" />
                  <span>Estimated delivery: 3–5 Business Days</span>
                </div>
                <div className="text-[10px] text-[#6B625D] font-medium">
                  {result.source === 'gps'
                    ? 'Based on your location'
                    : `Verified for pincode ${result.pincode}`}
                </div>
              </div>
            </div>
          )}

          {/* Reset / Check another location */}
          <button
            type="button"
            onClick={resetState}
            className="text-[10px] font-serif font-bold text-[#6B625D] hover:text-[#6B1725] underline cursor-pointer pt-1 block ml-auto"
          >
            Check another location
          </button>
        </div>
      )}
    </div>
  );
}
