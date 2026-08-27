"use client";

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop for both Mobile and Desktop */}
      <div
        className="fixed inset-0 bg-[#292524]/65 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. DESKTOP MODAL VIEW (hidden on mobile, visible lg:flex)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-[780px] h-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden flex border border-[#B08A3C]/20 animate-scaleIn pointer-events-auto">
          
          {/* Left Column: Saree Store Image Banner */}
          <div className="relative w-1/2 h-full overflow-hidden bg-[#292524]">
            <img
              src="/login_banner.jpg"
              alt="Shree Banarasi Sarees Trousseau"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
          </div>

          {/* Right Column: Auth Content */}
          <div className="relative w-1/2 h-full bg-white p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-4">
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[#6B625D] hover:text-[#6B1725] hover:bg-[#FAF7F0] rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Circular Emblem Logo */}
            <div className="w-16 h-16 rounded-full border border-[#B08A3C]/40 bg-[#FAF7F0] p-1 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/brand_logo.webp"
                alt="Shree Banarasi Sarees Logo Emblem"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Title */}
            <h2 className="font-serif text-2xl font-bold text-[#292524] leading-snug">
              Customer Account
            </h2>

            {/* Subtitle */}
            <p className="text-xs text-[#6B625D] leading-relaxed max-w-[260px] font-normal">
              Log in to track orders, manage your wishlist, and request custom saree designs.
            </p>

            {/* Gold Accent Divider Line */}
            <div className="w-12 h-[2px] bg-[#B08A3C]/40 mx-auto my-1 rounded-full" />

            {error && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            {/* Continue with Google Outline Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white border border-[#E5D7BF] hover:border-[#6B1725] hover:bg-[#FAF7F0]/40 text-[#292524] rounded-xl font-serif font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin text-[#6B1725]" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              CONTINUE WITH GOOGLE
            </button>

          </div>
        </div>
      </div>


      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. MOBILE DRAWER VIEW (lg:hidden, slides smoothly from bottom) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto pointer-events-auto animate-slideUp">
        <div className="bg-white rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          
          {/* Mobile Top Hero Image Banner */}
          <div className="relative h-[240px] sm:h-[270px] w-full overflow-hidden bg-[#292524] shrink-0">
            <img
              src="/login_banner.jpg"
              alt="Shree Banarasi Sarees Banner"
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/35" />

            {/* Top Right Close Circle Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:text-white flex items-center justify-center hover:bg-black/60 transition-all cursor-pointer"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>

            {/* Top Left Brand Header */}
            <div className="absolute top-4 left-5 z-10 flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full border border-[#B08A3C]/50 bg-[#FAF7F0] p-0.5 shadow-md flex items-center justify-center shrink-0">
                <img
                  src="/brand_logo.webp"
                  alt="Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-left">
                <h3 className="font-serif font-bold text-white text-sm sm:text-base leading-tight">
                  Shree Banarasi Sarees
                </h3>
                <p className="text-[#D4AF37] text-[9px] tracking-widest font-semibold uppercase mt-0.5">
                  EST. SAMASTIPUR, BIHAR
                </p>
              </div>
            </div>

            {/* Bottom Tagline Overlay inside Hero Banner */}
            <div className="absolute bottom-4 left-5 right-5 text-white space-y-1">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight text-white drop-shadow-sm">
                Your wardrobe <br />
                deserves the best.
              </h2>
              <p className="text-xs text-white/80 font-light leading-snug">
                Track orders, save favourites &amp; unlock exclusive offers.
              </p>
            </div>
          </div>

          {/* Mobile Bottom White Action Section */}
          <div className="p-5 sm:p-6 bg-white space-y-4 text-center">
            
            {/* Feature Pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="px-3.5 py-1.5 rounded-full bg-[#FAF7F0] border border-[#F3ECE0] text-[11px] font-semibold text-[#292524] shadow-2xs">
                Track Orders
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-[#FAF7F0] border border-[#F3ECE0] text-[11px] font-semibold text-[#292524] shadow-2xs">
                Save Wishlist
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-[#FAF7F0] border border-[#F3ECE0] text-[11px] font-semibold text-[#292524] shadow-2xs">
                Exclusive Offers
              </span>
            </div>

            {error && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            {/* Deep Wine / Maroon Google Sign-In Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3.5 sm:py-4 bg-[#6B1725] hover:bg-[#52111C] text-white rounded-2xl font-serif font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
              )}
              Continue with Google
            </button>

            {/* Terms and Privacy Policy Caption */}
            <p className="text-[10px] text-[#6B625D]/70 font-normal leading-relaxed">
              By continuing, you agree to our Terms of Service &amp; Privacy Policy.
            </p>

          </div>

        </div>
      </div>
    </div>
  );
};
