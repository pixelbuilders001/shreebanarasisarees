"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '../../../context/StoreContext';
import { Mail, Phone, User, Shield, Edit3, CheckCircle } from 'lucide-react';
import NotificationSettings from '../../../components/notifications/NotificationSettings';

export default function ProfilePage() {
  const { 
    user, 
    userProfile, 
    updateUserProfile 
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveError('');
    setProfileSaveSuccess('');
    setIsSavingProfile(true);
    try {
      let parsedPhone: number | null = null;
      if (editPhone.trim()) {
        if (!/^\d{10}$/.test(editPhone.trim())) {
          throw new Error('Please enter a valid 10-digit phone number.');
        }
        parsedPhone = parseInt(editPhone.trim(), 10);
      }
      await updateUserProfile({
        full_name: editName.trim() || null,
        phone_number: parsedPhone
      });
      setProfileSaveSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setProfileSaveError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white rounded-2xl border border-cream/80 shadow-sm overflow-hidden animate-fadeIn mx-auto w-full">
      {/* Top Banner / Avatar Header */}
      <div className="relative bg-gradient-to-r from-cream/20 via-[#FFF9F0] to-cream/30 px-4 sm:px-6 py-6 sm:py-8 border-b border-cream flex flex-col items-center justify-center text-center">
        <div className="relative mb-3">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gold shadow-md"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-cream border-2 border-gold/50 rounded-full flex items-center justify-center text-maroon shadow-inner">
              <User size={30} />
            </div>
          )}
          <span className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-sm" title="Google Verified">
            <CheckCircle size={10} className="fill-current" />
          </span>
        </div>

        <h2 className="font-serif text-lg sm:text-xl font-bold text-dark-brown">
          {userProfile?.full_name || user?.user_metadata?.full_name || 'Shree Banarasi Guest'}
        </h2>
        <span className="text-[9px] font-bold text-gold bg-maroon/10 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1">
          Google Account Verified
        </span>
      </div>

      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex justify-between items-center border-b border-cream pb-3">
          <h3 className="font-serif text-xs sm:text-sm font-bold text-dark-brown uppercase tracking-wider flex items-center gap-1.5">
            <Shield size={14} className="text-maroon" />
            Profile Details
          </h3>
          {user && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-maroon hover:underline font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Edit3 size={12} />
              Edit Profile
            </button>
          )}
        </div>

        {profileSaveError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded border border-red-100 animate-slideDown">
            ⚠️ {profileSaveError}
          </div>
        )}

        {profileSaveSuccess && (
          <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded border border-green-100 animate-slideDown">
            ✓ {profileSaveSuccess}
          </div>
        )}

        {user ? (
          isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-brown/40">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded-lg pl-9 pr-3 py-2.5 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-brown/40">
                    <Phone size={14} />
                  </span>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit phone number"
                    className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded-lg pl-9 pr-3 py-2.5 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="pt-2 text-xs space-y-2.5 bg-cream/10 p-3.5 rounded-lg border border-cream/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-dark-brown/85 font-medium gap-1">
                  <span className="flex items-center gap-1.5"><Mail size={13} className="text-maroon/60" /> Email:</span>
                  <span className="font-semibold break-all">{user.email}</span>
                </div>
                {userProfile && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-dark-brown/85 font-medium gap-1">
                    <span className="flex items-center gap-1.5"><Shield size={13} className="text-maroon/60" /> Role:</span>
                    <span className="capitalize px-2 py-0.5 bg-maroon/15 text-maroon font-bold rounded text-[9px] tracking-wide self-start sm:self-auto">
                      {userProfile.role}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full sm:flex-1 py-2.5 bg-maroon text-ivory rounded-lg font-serif font-bold text-xs uppercase tracking-wider hover:bg-maroon-dark transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(userProfile?.full_name || '');
                    setEditPhone(userProfile?.phone_number ? String(userProfile.phone_number) : '');
                    setProfileSaveError('');
                  }}
                  className="w-full sm:flex-1 py-2.5 border border-cream text-dark-brown hover:bg-cream/20 rounded-lg font-serif font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-cream/40 pb-3 text-xs gap-1 sm:gap-4">
                <div className="flex items-center gap-2 font-medium text-dark-brown/60">
                  <Mail size={15} className="text-maroon" />
                  <span>Email Address</span>
                </div>
                <span className="font-bold text-dark-brown break-all sm:text-right">{user.email}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-cream/40 pb-3 text-xs gap-1 sm:gap-4">
                <div className="flex items-center gap-2 font-medium text-dark-brown/60">
                  <User size={15} className="text-maroon" />
                  <span>Full Name</span>
                </div>
                <span className="font-bold text-dark-brown sm:text-right">{userProfile?.full_name || 'Not set'}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-cream/40 pb-3 text-xs gap-1 sm:gap-4">
                <div className="flex items-center gap-2 font-medium text-dark-brown/60">
                  <Phone size={15} className="text-maroon" />
                  <span>Phone Number</span>
                </div>
                <span className="font-bold text-dark-brown sm:text-right">
                  {userProfile?.phone_number ? `+91 ${userProfile.phone_number}` : 'Not set'}
                </span>
              </div>

              {userProfile && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-cream/40 pb-3 text-xs gap-1 sm:gap-4">
                  <div className="flex items-center gap-2 font-medium text-dark-brown/60">
                    <Shield size={15} className="text-maroon" />
                    <span>Account Role</span>
                  </div>
                  <span className="capitalize px-2.5 py-0.5 bg-maroon/15 text-maroon font-bold rounded text-[9px] tracking-wide self-start sm:self-auto">
                    {userProfile.role}
                  </span>
                </div>
              )}

              <NotificationSettings />

              <div className="pt-4 text-[10px] text-dark-brown/50 leading-relaxed text-center">
                🔒 Your profile information is synchronized with Google authentication.
              </div>
            </div>
          )
        ) : (
          <div className="text-xs text-dark-brown/60 text-center py-6">
            Please link your Google account to set up and manage custom profile details.
          </div>
        )}
      </div>
    </div>
  );
}
