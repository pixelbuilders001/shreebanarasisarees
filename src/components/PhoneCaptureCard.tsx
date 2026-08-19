"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Phone, CheckCircle2, Pencil, ChevronRight, X, Loader2, User, LogIn } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const PhoneCaptureCard: React.FC = () => {
  const { user, userProfile, updateUserProfile, setIsAuthModalOpen } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false); const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const openModal = () => {
    setNameInput(userProfile?.full_name || '');
    setPhoneInput(userProfile?.phone_number ? String(userProfile.phone_number) : '');
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const handleSave = async () => {
    setError('');
    const cleaned = phoneInput.replace(/\D/g, '').slice(0, 10);
    if (!nameInput.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (cleaned.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsSaving(true);
    try {
      await updateUserProfile({
        full_name: nameInput.trim(),
        phone_number: parseInt(cleaned, 10)
      });
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="px-5 pt-4">
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-maroon text-ivory font-serif font-bold text-[12px] uppercase tracking-wider hover:bg-maroon-dark transition-all active:scale-[0.98]"
        >
          <LogIn size={14} /> Sign In / Login
        </button>
      </div>
    );
  }

  const hasPhone = !!userProfile?.phone_number;

  const renderCard = hasPhone ? (
    <div className="px-5 pt-4">
      <button
        onClick={openModal}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white border border-cream group active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 size={15} className="text-emerald-600" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[12px] font-bold text-dark-brown leading-tight">Phone number saved</p>
            <p className="text-[10px] font-semibold text-emerald-700 leading-tight mt-0.5">+91 {userProfile.phone_number}</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold text-maroon whitespace-nowrap">
          <Pencil size={11} /> Update
        </span>
      </button>
    </div>
  ) : (
    <div className="px-5 pt-4">
      <button
        onClick={openModal}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-gold/40 bg-gradient-to-r from-maroon/5 via-cream/40 to-gold/10 group active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center shrink-0">
            <Phone size={15} className="text-maroon" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[12px] font-bold text-dark-brown leading-tight">Add your phone number</p>
            <p className="text-[10px] text-dark-brown/55 leading-tight mt-0.5">Get instant WhatsApp updates on your orders</p>
          </div>
        </div>
        <span className="text-[10px] font-serif font-bold text-maroon whitespace-nowrap flex items-center gap-1">
          Add Now <ChevronRight size={12} />
        </span>
      </button>
    </div>
  );

  return (
    <>
      {renderCard}

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[80]">
          <div
            className="absolute inset-0 bg-[#2D211D]/70 backdrop-blur-sm pc-fade-in"
            onClick={closeModal}
            aria-hidden="true"
          />

          <div className="absolute inset-x-0 bottom-0 h-[60dvh] max-h-[600px] bg-[#FFF9F0] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden pc-slide-up">
            <div className="shrink-0 bg-white border-b border-cream flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center">
                  <Phone size={16} className="text-maroon" />
                </div>
                <div>
                  <p className="font-serif text-sm font-extrabold text-dark-brown leading-tight">
                    {hasPhone ? 'Update Contact Details' : 'Add Contact Details'}
                  </p>
                  <p className="text-[10px] text-dark-brown/50 leading-tight mt-0.5">
                    We only use this to reach you for your orders
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-cream/60 text-dark-brown/60 hover:bg-cream hover:text-maroon transition-all active:scale-95"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
              {error && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-dark-brown/70 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-brown/40">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => { setNameInput(e.target.value); setError(''); }}
                    placeholder="Your full name"
                    className="w-full bg-white border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded-lg pl-9 pr-3 py-2.5 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-dark-brown/70 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-brown/40">
                    <Phone size={14} />
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phoneInput}
                    onChange={(e) => { setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                    placeholder="10-digit mobile number"
                    className="w-full bg-white border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded-lg pl-9 pr-3 py-2.5 outline-none transition-all"
                  />
                </div>
              </div>

              <p className="text-[10px] text-dark-brown/45 leading-relaxed text-center">
                By saving, you agree to our <span className="font-semibold text-dark-brown/60">Terms of Service</span> &amp; <span className="font-semibold text-dark-brown/60">Privacy Policy</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:flex-1 py-3 bg-maroon text-ivory rounded-xl font-serif font-bold text-xs uppercase tracking-wider hover:bg-maroon-dark transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={closeModal}
                  className="w-full sm:flex-1 py-3 border border-cream text-dark-brown hover:bg-cream/20 rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-colors text-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes pcSlideInUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes pcFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .pc-slide-up {
          animation: pcSlideInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .pc-fade-in {
          animation: pcFadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default PhoneCaptureCard;
