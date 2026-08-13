"use client";

import React, { useState } from 'react';
import { useStore } from '../../../context/StoreContext';
import { MapPin, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';

export default function AddressesPage() {
  const { 
    shippingAddresses, 
    saveShippingAddress, 
    deleteShippingAddress, 
    setDefaultShippingAddress,
    user
  } = useStore();

  const [isEditing, setIsEditing] = useState(false);
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
    setIsDefault(shippingAddresses.length === 0); // default if first address
    setFormError('');
    setIsEditing(true);
  };

  const handleEditClick = (addr: any) => {
    setEditAddressId(addr.id);
    setFullName(addr.full_name);
    setPhone(addr.phone);
    setAddressLine1(addr.address_line1);
    setAddressLine2(addr.address_line2 || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city);
    setStateName(addr.state);
    setPincode(addr.pincode);
    setAddressLabel(addr.address_label || 'Home');
    setIsDefault(addr.is_default);
    setFormError('');
    setIsEditing(true);
  };

  const handleDeleteClick = async (id: string) => {
    try {
      await deleteShippingAddress(id);
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

    if (!fullName.trim() || !phone.trim() || !addressLine1.trim() || !city.trim() || !stateName.trim() || !pincode.trim()) {
      setFormError('All required fields (*) must be filled.');
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      setFormError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setFormError('Please enter a valid 6-digit PIN code.');
      return;
    }

    setIsSaving(true);
    try {
      await saveShippingAddress({
        id: editAddressId || undefined,
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
      });
      setIsEditing(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save address. Please check your inputs.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white p-8 rounded-lg border border-cream shadow-sm text-center text-xs text-dark-brown/50 italic py-16">
        Please log in to manage your saved shipping addresses.
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center border-b border-cream pb-3 bg-white p-4 rounded-lg border border-cream shadow-sm">
        <h2 className="font-serif text-lg font-bold text-dark-brown flex items-center gap-2">
          <MapPin size={18} className="text-maroon" />
          Saved Addresses ({shippingAddresses.length})
        </h2>
        {!isEditing && (
          <button
            onClick={handleAddNewClick}
            className="py-1.5 px-3 bg-maroon text-ivory rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark transition-colors flex items-center gap-1.5 shadow"
          >
            <Plus size={14} />
            Add New
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-lg border border-cream shadow-sm space-y-4 animate-fadeIn">
          <h3 className="font-serif text-base font-bold text-dark-brown border-b border-cream pb-2">
            {editAddressId ? 'Edit Address' : 'Add New Address'}
          </h3>

          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded border border-red-100">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Receiver's full name"
                className="w-full border border-cream rounded px-3 py-2 text-xs text-dark-brown focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                className="w-full border border-cream rounded px-3 py-2 text-xs text-dark-brown focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wider mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Flat / House no. / Building Name"
                className="w-full border border-cream rounded px-3 py-2 text-xs text-dark-brown focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wider mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Street / Colony / Area"
                className="w-full border border-cream rounded px-3 py-2 text-xs text-dark-brown focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wider mb-1">
              Landmark (Optional)
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near Temple, Opp. Mall"
              className="w-full border border-cream rounded px-3 py-2 text-xs text-dark-brown focus:outline-none focus:border-gold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wider mb-1">
                City *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Varanasi"
                className="w-full border border-cream rounded px-3 py-2 text-xs text-dark-brown focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wider mb-1">
                State *
              </label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="Uttar Pradesh"
                className="w-full border border-cream rounded px-3 py-2 text-xs text-dark-brown focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wider mb-1">
                PIN Code *
              </label>
              <input
                type="tel"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="221001"
                className="w-full border border-cream rounded px-3 py-2 text-xs text-dark-brown focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-cream">
            <div className="flex gap-2">
              {(['Home', 'Work', 'Other'] as const).map(type => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setAddressLabel(type)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                    addressLabel === type
                      ? 'bg-cream text-maroon border-maroon'
                      : 'bg-white text-dark-brown/70 border-cream hover:bg-cream/10'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDefault}
                disabled={shippingAddresses.length === 0}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-cream text-maroon focus:ring-maroon w-4 h-4"
              />
              <span className="text-xs font-semibold text-dark-brown/70">
                Set as Default shipping address
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-cream">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-maroon text-ivory rounded font-semibold text-xs uppercase tracking-wider hover:bg-maroon-dark transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving Address...' : 'Save Address'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2.5 border border-cream text-dark-brown hover:bg-cream/20 rounded font-semibold text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : shippingAddresses.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-cream shadow-sm text-center text-xs text-dark-brown/50 italic py-16">
          No saved addresses found. Add a shipping address to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shippingAddresses.map((addr) => (
            <div 
              key={addr.id} 
              className={`bg-white p-5 rounded-lg border shadow-sm relative flex flex-col justify-between gap-4 transition-all duration-300 ${
                addr.is_default ? 'border-maroon ring-1 ring-maroon animate-pulseOnce' : 'border-cream hover:border-maroon/30'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-cream text-maroon text-[9px] font-bold rounded uppercase tracking-wider">
                    {addr.address_label}
                  </span>
                  {addr.is_default && (
                    <span className="flex items-center gap-1 text-[10px] text-green-700 font-bold">
                      <CheckCircle2 size={12} />
                      Default
                    </span>
                  )}
                </div>

                <div className="text-xs text-dark-brown space-y-1">
                  <h4 className="font-serif font-bold text-sm">{addr.full_name}</h4>
                  <p className="font-medium text-dark-brown/80">{addr.address_line1}</p>
                  {addr.address_line2 && <p className="font-medium text-dark-brown/80">{addr.address_line2}</p>}
                  {addr.landmark && <p className="text-xs text-dark-brown/60 italic font-medium">Landmark: {addr.landmark}</p>}
                  <p className="font-medium text-dark-brown/80">{addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-dark-brown/60 pt-1 font-bold">Phone: +91 {addr.phone}</p>
                </div>
              </div>

              <div className="flex gap-3 border-t border-cream/50 pt-3 mt-1">
                {!addr.is_default && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-[10px] text-maroon hover:underline font-bold uppercase tracking-wider mr-auto"
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() => handleEditClick(addr)}
                  className="text-[10px] text-dark-brown/70 hover:text-maroon font-bold uppercase tracking-wider flex items-center gap-1 ml-auto"
                >
                  <Edit2 size={10} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(addr.id)}
                  className="text-[10px] text-red-600 hover:text-red-800 font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <Trash2 size={10} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
