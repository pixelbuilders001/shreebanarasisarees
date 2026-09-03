"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Loader2, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { fetchPincodeDetails } from '../../lib/pincodeLookup';

interface AddNewAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSaved?: (savedAddress: any) => void;
}

export function AddNewAddressModal({ isOpen, onClose, onAddressSaved }: AddNewAddressModalProps) {
  const { user, saveShippingAddress, setIsAuthModalOpen, showToast } = useStore();
  const [mounted, setMounted] = useState(false);

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

  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!user) {
      onClose();
      setIsAuthModalOpen(true);
      showToast("Please log in to save addresses to your account.", "info");
      return;
    }

    if (!fullName.trim() || !phone.trim() || !addressLine1.trim() || !city.trim() || !stateName.trim() || !pincode.trim()) {
      setFormError('Please complete all required fields (*).');
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setFormError('Please enter a valid 6-digit PIN code.');
      return;
    }

    setIsSaving(true);
    try {
      const newAddress = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || null,
        landmark: landmark.trim() || null,
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        address_label: addressLabel,
        is_default: isDefault
      };

      await saveShippingAddress(newAddress);
      showToast("Address saved successfully!", "info");
      
      if (onAddressSaved) {
        onAddressSaved(newAddress);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to save address. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#B08A3C]/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 text-[#292524] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-3">
          <div className="flex items-center gap-2 font-serif font-bold text-sm text-[#6B1725]">
            <MapPin size={18} />
            <span>Add New Shipping Address</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#6B625D] hover:bg-[#FAF7F0] hover:text-[#292524] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#6B625D] uppercase tracking-wider mb-1 font-serif">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Receiver's name"
                required
                className="w-full bg-[#FAF7F0] border border-[#B08A3C]/35 focus:border-[#6B1725] text-xs rounded-xl p-2.5 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#6B625D] uppercase tracking-wider mb-1 font-serif">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile"
                required
                className="w-full bg-[#FAF7F0] border border-[#B08A3C]/35 focus:border-[#6B1725] text-xs rounded-xl p-2.5 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#6B625D] uppercase tracking-wider mb-1 font-serif">
              Address Line 1 *
            </label>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Flat / House No / Building Name"
              required
              className="w-full bg-[#FAF7F0] border border-[#B08A3C]/35 focus:border-[#6B1725] text-xs rounded-xl p-2.5 outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#6B625D] uppercase tracking-wider mb-1 font-serif">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Street / Colony / Area"
                className="w-full bg-[#FAF7F0] border border-[#B08A3C]/35 focus:border-[#6B1725] text-xs rounded-xl p-2.5 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#6B625D] uppercase tracking-wider mb-1 font-serif">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Temple"
                className="w-full bg-[#FAF7F0] border border-[#B08A3C]/35 focus:border-[#6B1725] text-xs rounded-xl p-2.5 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#6B625D] uppercase tracking-wider mb-1 font-serif flex items-center justify-between">
                <span>PIN Code *</span>
                {isFetchingPincode && (
                  <Loader2 size={11} className="animate-spin text-[#6B1725]" />
                )}
              </label>
              <input
                type="tel"
                value={pincode}
                onChange={(e) => handlePincodeChange(e.target.value)}
                placeholder="6-digit PIN"
                required
                className="w-full bg-[#FAF7F0] border border-[#B08A3C]/35 focus:border-[#6B1725] text-xs rounded-xl p-2.5 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B625D] uppercase tracking-wider mb-1 font-serif">
                City *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City / District"
                required
                className="w-full bg-[#FAF7F0] border border-[#B08A3C]/35 focus:border-[#6B1725] text-xs rounded-xl p-2.5 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B625D] uppercase tracking-wider mb-1 font-serif">
                State *
              </label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="State"
                required
                className="w-full bg-[#FAF7F0] border border-[#B08A3C]/35 focus:border-[#6B1725] text-xs rounded-xl p-2.5 outline-none font-medium"
              />
            </div>
          </div>

          {/* Address Label Pills */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold text-[#6B625D] uppercase tracking-wider font-serif">
              Save As:
            </span>
            <div className="flex gap-2">
              {(['Home', 'Work', 'Other'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setAddressLabel(type)}
                  className={`px-3 py-1 rounded-xl text-xs font-serif font-bold transition-all ${
                    addressLabel === type
                      ? 'bg-[#6B1725] text-white shadow-xs'
                      : 'bg-[#FAF7F0] text-[#6B625D] border border-[#B08A3C]/30 hover:border-[#6B1725]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-[#F3ECE0]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#B08A3C]/40 text-xs font-serif font-bold text-[#6B625D] hover:bg-[#FAF7F0] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-[#6B1725] hover:bg-[#52111C] text-white text-xs font-serif font-bold tracking-wider shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Address'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}
