"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../../context/StoreContext';
import {
  ChevronLeft,
  User,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Lock,
  LogOut,
  Loader2
} from 'lucide-react';
import NotificationSettings from '../../../components/notifications/NotificationSettings';
import { ProfileTabSkeleton } from '../../../components/TabSkeletons';

export default function ProfilePage() {
  const router = useRouter();
  const { 
    user, 
    userProfile, 
    updateUserProfile,
    logoutUser,
    isHydrated,
    setIsAuthModalOpen
  } = useStore();

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.full_name || '');
      setEditPhone(userProfile.phone_number ? String(userProfile.phone_number) : '');
    }
  }, [userProfile]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/account');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveError('');
    setProfileSaveSuccess('');
    setIsSavingProfile(true);
    try {
      let parsedPhone: number | null = null;
      if (editPhone.trim()) {
        const cleanDigits = editPhone.replace(/\D/g, '');
        if (cleanDigits.length !== 10) {
          throw new Error('Please enter a valid 10-digit mobile number.');
        }
        parsedPhone = parseInt(cleanDigits, 10);
      }
      await updateUserProfile({
        full_name: editName.trim() || null,
        phone_number: parsedPhone
      });
      setProfileSaveSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setProfileSaveSuccess(''), 4000);
    } catch (err: any) {
      setProfileSaveError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 1. Loading / Hydration skeleton state (scoped to tab content area only)
  if (!isHydrated) {
    return <ProfileTabSkeleton />;
  }

  // 2. Unauthenticated view
  if (!user) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl p-8 border border-[#E7DFC9] text-center max-w-md mx-auto shadow-2xs space-y-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#D4C39D] flex items-center justify-center mx-auto text-[#6B1725]">
          <User size={26} />
        </div>
        <h3 className="font-serif font-bold text-lg text-[#1C1917]">Sign in to view profile</h3>
        <p className="text-xs text-[#57534E] leading-relaxed font-sans">
          Please link your Google account to view and manage your patron profile details.
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

  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Patron';
  const userAvatar = user?.user_metadata?.avatar_url || userProfile?.avatar_url;

  return (
    <div className="w-full space-y-4 animate-fadeIn min-w-0">
        {/* Success Alert */}
        {profileSaveSuccess && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2 animate-fadeIn shadow-2xs">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{profileSaveSuccess}</span>
          </div>
        )}

        {/* ── CARD 1: PATRON IDENTITY / EDIT FORM ── */}
        {isEditing ? (
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#6B1725] shadow-xs space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <h3 className="font-serif font-bold text-base text-[#1C1917] flex items-center gap-2">
                <Pencil size={15} className="text-[#6B1725]" />
                <span>Edit Profile Information</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(userProfile?.full_name || '');
                  setEditPhone(userProfile?.phone_number ? String(userProfile.phone_number) : '');
                  setProfileSaveError('');
                }}
                className="text-xs text-[#78716C] hover:text-[#1C1917] font-medium font-sans cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>

            {profileSaveError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-100 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{profileSaveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1 font-sans">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full bg-[#FAF8F5]/60 border border-[#E5DEC9] focus:border-[#6B1725] focus:bg-white text-sm text-[#1C1917] rounded-xl px-3.5 py-2.5 outline-none transition-all font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1 font-sans">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs text-[#78716C] font-sans font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="w-full bg-[#FAF8F5]/60 border border-[#E5DEC9] focus:border-[#6B1725] focus:bg-white text-sm text-[#1C1917] rounded-xl pl-12 pr-3.5 py-2.5 outline-none transition-all font-sans"
                  />
                </div>
                <p className="text-[11px] text-[#78716C] mt-1 font-sans">
                  Used for instant delivery coordination and order updates.
                </p>
              </div>

              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE2D2] flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[#57534E] font-medium font-sans">
                  <Lock size={13} className="text-[#A17A32]" />
                  <span>Primary Email:</span>
                </span>
                <span className="font-semibold text-[#1C1917] break-all font-sans">{user.email}</span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(userProfile?.full_name || '');
                    setEditPhone(userProfile?.phone_number ? String(userProfile.phone_number) : '');
                    setProfileSaveError('');
                  }}
                  className="flex-1 py-2.5 border border-[#E5DEC9] text-[#57534E] hover:bg-[#FAF8F5] rounded-full font-sans font-medium text-xs sm:text-sm transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 py-2.5 bg-[#601221] hover:bg-[#4E0E1A] text-white rounded-full font-sans font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={displayName}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#D4C39D] shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FAF8F5] border-2 border-[#D4C39D] flex items-center justify-center text-[#6B1725] shadow-inner">
                      <User size={28} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-serif font-bold text-base sm:text-lg text-[#1C1917] truncate">
                    {displayName}
                  </h2>
                  <p className="text-xs text-[#57534E] font-sans mt-0.5 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="self-start sm:self-center flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E5DEC9] hover:border-[#6B1725] text-[#57534E] hover:text-[#6B1725] text-xs font-medium font-sans transition-all cursor-pointer bg-[#FAF8F5]/60 hover:bg-white shrink-0 shadow-2xs"
              >
                <Pencil size={12} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        )}

        {/* ── CARD 2: PERSONAL DETAILS ── */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-3">
          <h3 className="font-serif font-bold text-base text-[#1C1917] pb-3 border-b border-[#F0EBE1]">
            Personal Details
          </h3>

          {/* Full Name */}
          <div>
            <span className="text-xs text-[#78716C] font-normal font-sans block">Full Name</span>
            <p className="text-sm font-semibold text-[#1C1917] font-sans mt-0.5">
              {userProfile?.full_name || displayName}
            </p>
          </div>

          <div className="border-t border-[#EFEBE4]" />

          {/* Mobile Number */}
          <div>
            <span className="text-xs text-[#78716C] font-normal font-sans block">Mobile Number</span>
            {userProfile?.phone_number ? (
              <p className="text-sm font-semibold text-[#1C1917] font-sans mt-0.5">
                +91 {userProfile.phone_number}
              </p>
            ) : (
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-xs text-[#78716C] italic font-sans">No mobile number added</span>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-[#6B1725] font-semibold hover:underline font-sans cursor-pointer"
                >
                  + Add Number
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-[#EFEBE4]" />

          {/* Primary Email */}
          <div>
            <span className="text-xs text-[#78716C] font-normal font-sans block">Primary Email</span>
            <p className="text-sm font-semibold text-[#1C1917] font-sans mt-0.5 break-all">
              {user.email}
            </p>
          </div>

          <div className="border-t border-[#EFEBE4]" />

          {/* Account Security */}
          <div>
            <span className="text-xs text-[#78716C] font-normal font-sans block">Account Security</span>
            <p className="text-xs text-[#57534E] font-medium font-sans mt-0.5 flex items-center gap-1.5">
              <Lock size={12} className="text-[#A17A32]" />
              <span>Protected by Google Single Sign-On</span>
            </p>
          </div>
        </div>

        {/* ── CARD 3: PREFERENCES & NOTIFICATIONS ── */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs">
          <NotificationSettings />
        </div>

        {/* ── ACTION: SIGN OUT ── */}
        <div className="pt-2">
          <button
            type="button"
            onClick={logoutUser}
            className="w-full py-3 border border-[#E5DEC9] hover:border-rose-300 text-rose-700 hover:bg-rose-50/60 rounded-full font-sans font-medium text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 bg-white shadow-2xs"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
    </div>
  );
}
