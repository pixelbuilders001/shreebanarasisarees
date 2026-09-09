"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '../../../context/StoreContext';
import {
  ChevronLeft,
  Zap,
  Truck,
  Pencil,
  Trash2,
  Check,
  MapPin,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { fetchPincodeDetails } from '../../../lib/pincodeLookup';
import { AddressesTabSkeleton } from '../../../components/TabSkeletons';
import { getStandardDeliveryDateInfo } from '../../../lib/deliveryDates';

function is20MinPincode(pincode?: string): boolean {
  const clean = pincode?.trim();
  return clean === '848101' || clean === '848114';
}

export default function AddressesPage() {
  const router = useRouter();
  const deliveryDateInfo = getStandardDeliveryDateInfo();
  const { 
    shippingAddresses, 
    shippingAddressesLoading,
    shippingAddressesLoaded,
    saveShippingAddress, 
    deleteShippingAddress, 
    setDefaultShippingAddress,
    user,
    isHydrated,
    setIsAuthModalOpen
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAddressId, setEditAddressId] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [addressLabel, setAddressLabel] = useState<string>('Home');
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);

  // Delete confirmation modal state
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/account');
    }
  };

  const handlePincodeChange = async (val: string) => {
    const cleanPin = val.replace(/\D/g, '').slice(0, 6);
    setPincode(cleanPin);
    if (cleanPin.length === 6) {
      setIsFetchingPincode(true);
      const details = await fetchPincodeDetails(cleanPin);
      if (details && details.success) {
        if (details.city) setCity(details.city);
        if (details.state) setStateName(details.state);
      }
      setIsFetchingPincode(false);
    }
  };

  const handleAddNewClick = () => {
    setEditAddressId(null);
    setFullName('');
    setPhone('');
    setAddressLine1('');
    setAddressLine2('');
    setLandmark('');
    setCity('');
    setStateName('');
    setPincode('');
    setAddressLabel('Home');
    setIsDefault(shippingAddresses.length === 0);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (addr: any) => {
    setEditAddressId(addr.id);
    setFullName(addr.full_name || '');
    setPhone(addr.phone ? String(addr.phone).replace(/^\+91\s*/, '') : '');
    setAddressLine1(addr.address_line1 || '');
    setAddressLine2(addr.address_line2 || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city || '');
    setStateName(addr.state || '');
    setPincode(addr.pincode || '');
    setAddressLabel(addr.address_label || 'Home');
    setIsDefault(!!addr.is_default);
    setFormError('');
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;
    try {
      await deleteShippingAddress(addressToDelete);
      setAddressToDelete(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultShippingAddress(id);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Please enter full name.');
      return;
    }
    if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone.trim())) {
      setFormError('Please enter a valid Indian mobile number (starts with 6–9, 10 digits).');
      return;
    }
    if (!addressLine1.trim()) {
      setFormError('Please provide house/flat details.');
      return;
    }
    if (!pincode.trim() || pincode.replace(/\D/g, '').length !== 6) {
      setFormError('Please provide a valid 6-digit PIN code.');
      return;
    }
    if (!city.trim() || !stateName.trim()) {
      setFormError('City and State are required.');
      return;
    }

    setIsSaving(true);
    try {
      await saveShippingAddress({
        ...(editAddressId ? { id: editAddressId } : {}),
        full_name: fullName.trim(),
        phone: phone.trim(),
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        address_label: addressLabel.trim() || 'Home',
        is_default: isDefault || shippingAddresses.length === 0
      });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to save address. Please check your inputs.');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading / Hydration skeleton state (scoped to tab content only)
  const isAddressesLoading = !isHydrated || shippingAddressesLoading || (!!user && !shippingAddressesLoaded);

  if (isAddressesLoading) {
    return <AddressesTabSkeleton />;
  }

  // Unauthenticated view
  if (!user) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl p-8 border border-[#E7DFC9] text-center max-w-md mx-auto shadow-2xs space-y-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#D4C39D] flex items-center justify-center mx-auto text-[#6B1725]">
          <MapPin size={24} className="text-[#A17A32]" />
        </div>
        <h3 className="font-serif font-bold text-lg text-[#1C1917]">Sign in to view addresses</h3>
        <p className="text-xs text-[#57534E] leading-relaxed font-sans">
          Access your saved shipping addresses, order tracking, and fast checkout.
        </p>
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="py-2.5 px-6 bg-[#601221] hover:bg-[#4E0E1A] text-white rounded-full font-sans font-medium text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-fadeIn min-w-0">
      {/* Section Header */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E7DFC9] shadow-2xs">
        <h2 className="font-serif text-base sm:text-lg font-bold text-[#1C1917] flex items-center gap-2">
          <MapPin size={18} className="text-[#6B1725]" />
          <span>My Saved Addresses ({shippingAddresses.length})</span>
        </h2>
        {shippingAddresses.length > 0 && (
          <button
            type="button"
            onClick={handleAddNewClick}
            className="text-xs font-semibold text-[#6B1725] hover:text-[#4E0E1A] bg-[#FAF8F5] hover:bg-white border border-[#E5DEC9] px-3 py-1.5 rounded-lg transition-all cursor-pointer font-sans shadow-2xs"
          >
            + Add Address
          </button>
        )}
      </div>
        {shippingAddresses.length === 0 ? (
          /* ── 2A. EMPTY STATE (EXACTLY MATCHING SCREENSHOT 2) ── */
          <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] py-8 text-center animate-fadeIn">
            {/* Gold Circular Outline with Location Pin Icon */}
            <div className="w-16 h-16 rounded-full border border-[#D4C39D] bg-transparent flex items-center justify-center mx-auto mb-5 shrink-0">
              <MapPin size={22} className="text-[#A17A32] stroke-[1.5]" />
            </div>

            {/* Title */}
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1917] font-normal tracking-tight mb-2.5 text-center">
              No saved addresses
            </h2>

            {/* Description */}
            <p className="font-sans text-xs sm:text-sm text-[#57534E] max-w-[280px] mx-auto text-center leading-relaxed font-normal mb-7">
              Add one and we&apos;ll tell you straight away whether 20-minute delivery reaches you.
            </p>

            {/* CTA Button */}
            <button
              type="button"
              onClick={handleAddNewClick}
              className="py-3 px-8 bg-[#601221] hover:bg-[#4E0E1A] text-white rounded-full font-sans font-medium text-sm transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              Add an address
            </button>
          </div>
        ) : (
          /* ── 2B. ADDRESSES LIST (EXACTLY MATCHING SCREENSHOT 1) ── */
          <div className="space-y-3.5 animate-fadeIn">
            {shippingAddresses.map((addr) => {
              const formattedPhone = addr.phone
                ? addr.phone.startsWith('+91')
                  ? addr.phone
                  : `+91 ${addr.phone}`
                : '';

              const streetParts = [
                addr.address_line1,
                addr.address_line2,
                addr.landmark ? `near ${addr.landmark.replace(/^near\s+/i, '')}` : null,
              ].filter(Boolean).join(', ');

              const locationParts = [
                addr.city,
                addr.state || 'Bihar',
                addr.pincode
              ].filter(Boolean).join(' ');

              return (
                <div
                  key={addr.id}
                  className={`bg-white rounded-xl p-4 sm:p-5 transition-all relative ${
                    addr.is_default
                      ? 'border border-[#6B1725] shadow-2xs'
                      : 'border border-[#E7DFC9]'
                  }`}
                >
                  {/* Top Row: Label Pill + "Default" Text + Radio Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="bg-[#F6EFE9] text-[#5E121E] px-2.5 py-0.5 text-xs font-semibold rounded-md inline-block font-sans">
                        {addr.address_label || 'Home'}
                      </span>
                      {addr.is_default && (
                        <span className="text-xs text-[#78716C] font-normal font-sans ml-2">
                          Default
                        </span>
                      )}
                    </div>

                    {/* Radio Button */}
                    {addr.is_default ? (
                      <div className="w-5 h-5 rounded-full bg-[#5E121E] text-white flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        className="w-5 h-5 rounded-full border border-[#C5B8A5] hover:border-[#6B1725] transition-colors cursor-pointer flex items-center justify-center flex-shrink-0"
                        aria-label="Set as default address"
                      />
                    )}
                  </div>

                  {/* Recipient Full Name */}
                  <h2 className="font-bold text-sm sm:text-base text-[#1C1917] mt-3 font-sans">
                    {addr.full_name}
                  </h2>

                  {/* Address Details */}
                  <p className="text-xs sm:text-[13px] text-[#57534E] font-normal leading-relaxed mt-1 font-sans">
                    {streetParts && <span>{streetParts}</span>}
                    {locationParts && (
                      <>
                        {streetParts && ', '}
                        <br />
                        {locationParts}
                      </>
                    )}
                  </p>

                  {/* Phone Number */}
                  {formattedPhone && (
                    <p className="text-xs sm:text-[13px] text-[#57534E] font-normal mt-1 font-sans">
                      {formattedPhone}
                    </p>
                  )}

                  {/* Delivery Serviceability Badge */}
                  {is20MinPincode(addr.pincode) ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B1725] mt-2.5 font-sans">
                      <img src="/expressdel.webp" alt="Express" className="w-4 h-4 object-contain flex-shrink-0" />
                      <span>20-min delivery reaches here</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-normal text-[#57534E] mt-2.5 font-sans">
                      <img src="/standarddel.webp" alt="Standard" className="w-4 h-4 object-contain flex-shrink-0" />
                      <span>{deliveryDateInfo.deliveryByText}</span>
                    </div>
                  )}

                  {/* Subtle Divider */}
                  <div className="border-t border-[#EFEBE4] my-3" />

                  {/* Actions Row: Edit & Delete on the left */}
                  <div className="flex items-center gap-5">
                    <button
                      type="button"
                      onClick={() => handleEditClick(addr)}
                      className="text-xs text-[#57534E] hover:text-[#1C1917] font-normal flex items-center gap-1.5 cursor-pointer transition-colors font-sans"
                    >
                      <Pencil size={13} className="text-[#57534E]" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressToDelete(addr.id)}
                      className="text-xs text-[#57534E] hover:text-rose-600 font-normal flex items-center gap-1.5 cursor-pointer transition-colors font-sans"
                    >
                      <Trash2 size={13} className="text-[#57534E]" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* "+ Add a new address" Dashed Card Button */}
            <button
              type="button"
              onClick={handleAddNewClick}
              className="w-full border border-dashed border-[#BCA570] hover:border-[#6B1725] rounded-xl p-3.5 bg-transparent hover:bg-white/60 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 group"
            >
              <span className="text-[#6B1725] font-serif font-bold text-sm sm:text-base">
                + Add a new address
              </span>
            </button>
          </div>
        )}

      {/* ── 3. ADD / EDIT ADDRESS MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="absolute inset-0 bg-[#0c0a09]/60 backdrop-blur-xs"
            onClick={() => {
              if (!isSaving) setIsModalOpen(false);
            }}
          />

          <div className="bg-white border border-[#E5DEC9] shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden z-10 relative animate-scaleIn p-5 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#292524]">
                {editAddressId ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="p-1 rounded-full text-[#7A6E65] hover:text-[#6B1725] cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-100 flex items-start gap-2">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              {/* Receiver Name */}
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1 font-sans">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Receiver's full name"
                  className="w-full bg-[#FAF7F0]/60 border border-[#E5DEC9] focus:border-[#6B1725] focus:bg-white text-sm text-[#292524] rounded-xl px-3.5 py-2.5 outline-none transition-all font-sans"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1 font-sans">
                  Mobile Number *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs text-[#7A6E65] font-sans font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      if (digits.length > 0 && !/^[6-9]/.test(digits)) return;
                      setPhone(digits);
                    }}
                    placeholder="10-digit mobile number"
                    className="w-full bg-[#FAF7F0]/60 border border-[#E5DEC9] focus:border-[#6B1725] focus:bg-white text-sm text-[#292524] rounded-xl pl-12 pr-3.5 py-2.5 outline-none transition-all font-sans"
                  />
                </div>
                {phone.length > 0 && !/^[6-9]\d{9}$/.test(phone) && (
                  <p className="mt-1 text-[10px] text-amber-700 font-sans">
                    Enter a valid Indian mobile number (starts with 6, 7, 8 or 9)
                  </p>
                )}
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1 font-sans">
                  Flat, House No., Building Name *
                </label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="e.g. Ward 12, Kashipur Road"
                  className="w-full bg-[#FAF7F0]/60 border border-[#E5DEC9] focus:border-[#6B1725] focus:bg-white text-sm text-[#292524] rounded-xl px-3.5 py-2.5 outline-none transition-all font-sans"
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1 font-sans">
                  Area, Colony, Street (Optional)
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="e.g. Near Durga Mandir"
                  className="w-full bg-[#FAF7F0]/60 border border-[#E5DEC9] focus:border-[#6B1725] focus:bg-white text-sm text-[#292524] rounded-xl px-3.5 py-2.5 outline-none transition-all font-sans"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1 font-sans">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite Durga Mandir"
                  className="w-full bg-[#FAF7F0]/60 border border-[#E5DEC9] focus:border-[#6B1725] focus:bg-white text-sm text-[#292524] rounded-xl px-3.5 py-2.5 outline-none transition-all font-sans"
                />
              </div>

              {/* Pincode, City, State Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1 font-sans flex items-center justify-between">
                    <span>PIN Code *</span>
                    {isFetchingPincode && (
                      <span className="text-[10px] text-[#6B1725] flex items-center gap-1 font-normal font-sans">
                        <Loader2 size={10} className="animate-spin" />
                      </span>
                    )}
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="848101"
                    className="w-full bg-[#FAF7F0]/60 border border-[#E5DEC9] focus:border-[#6B1725] focus:bg-white text-sm text-[#292524] rounded-xl px-3.5 py-2.5 outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1 font-sans">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Samastipur"
                    className="w-full bg-[#FAF7F0]/60 border border-[#E5DEC9] focus:border-[#6B1725] focus:bg-white text-sm text-[#292524] rounded-xl px-3.5 py-2.5 outline-none transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1 font-sans">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="Bihar"
                    className="w-full bg-[#FAF7F0]/60 border border-[#E5DEC9] focus:border-[#6B1725] focus:bg-white text-sm text-[#292524] rounded-xl px-3.5 py-2.5 outline-none transition-all font-sans"
                  />
                </div>
              </div>

              {/* Address Label (Home / Work / Custom like "Mummy's house", "Patna flat") */}
              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1.5 font-sans">
                  Address Label (e.g. Home, Mummy&apos;s house, Patna flat)
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {['Home', 'Work', "Mummy's house", 'Patna flat'].map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setAddressLabel(tag)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        addressLabel === tag
                          ? 'bg-[#6B1725] text-white border-[#6B1725]'
                          : 'bg-[#FAF7F0] text-[#6B625D] border-[#E5DEC9] hover:border-[#6B1725]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                  placeholder="Or enter custom label"
                  className="w-full bg-[#FAF7F0]/60 border border-[#E5DEC9] focus:border-[#6B1725] focus:bg-white text-xs text-[#292524] rounded-xl px-3.5 py-2 outline-none transition-all font-sans"
                />
              </div>

              {/* Set as default checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  disabled={shippingAddresses.length === 0}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-[#6B1725] rounded border-[#D4C39D] focus:ring-[#6B1725] cursor-pointer"
                />
                <span className="text-xs font-medium text-[#292524] font-sans">
                  Make this my default shipping address
                </span>
              </label>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-[#F3ECE0]">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-[#E5DEC9] text-[#292524] rounded-full font-sans font-semibold text-sm hover:bg-[#FAF7F0] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-[#6B1725] hover:bg-[#52111C] text-white rounded-full font-sans font-semibold text-sm transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Address</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. DELETE CONFIRMATION MODAL ── */}
      {addressToDelete && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="absolute inset-0 bg-[#0c0a09]/60 backdrop-blur-xs"
            onClick={() => setAddressToDelete(null)}
          />
          <div className="bg-white border border-[#E5DEC9] shadow-2xl rounded-3xl w-full max-w-sm overflow-hidden z-10 relative animate-scaleIn p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#292524]">
              Delete this address?
            </h3>
            <p className="text-xs text-[#7A6E65] font-sans leading-relaxed">
              Are you sure you want to remove this address from your saved addresses?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddressToDelete(null)}
                className="flex-1 py-2.5 border border-[#E5DEC9] text-[#292524] rounded-full font-sans font-semibold text-xs hover:bg-[#FAF7F0] transition-colors cursor-pointer"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-sans font-semibold text-xs transition-all shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


