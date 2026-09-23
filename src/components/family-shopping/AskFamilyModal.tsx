"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Users, Heart, Share2, Check, Copy, ExternalLink, CheckCircle2, MessageCircle } from 'lucide-react';
import { Product } from '../../data/products';
import { createFamilyPoll } from '../../data/supabase';
import { useStore } from '../../context/StoreContext';

interface AskFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: Product[];
}

const OCCASION_PRESETS = [
  'Wedding Reception',
  'Bridal Saree',
  'Sangeet / Mehendi',
  'Diwali / Festival',
  'Puja / Family Function',
  'Anniversary / Gifting',
];

export default function AskFamilyModal({
  isOpen,
  onClose,
  wishlistItems,
}: AskFamilyModalProps) {
  const { userProfile, showToast } = useStore();

  // Selection: Pick up to 4 sarees by default (or at least 2)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [creatorName, setCreatorName] = useState('');
  const [occasion, setOccasion] = useState('Wedding Reception');
  const [showPrice, setShowPrice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Result state
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize defaults whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const initialIds = wishlistItems.slice(0, 4).map((p) => p.id);
      setSelectedIds(initialIds);
      const name = userProfile?.full_name || '';
      setCreatorName(name);
      setOccasion('Wedding Reception');
      setShowPrice(true);
      setCreatedSlug(null);
      setCopied(false);
      setErrorMsg('');
    }
  }, [isOpen, wishlistItems, userProfile]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        showToast('Please select at least 2 sarees to compare', 'info');
        return;
      }
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } else {
      if (selectedIds.length >= 6) {
        showToast('You can compare up to 6 sarees at once', 'info');
        return;
      }
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = creatorName.trim();
    if (!cleanName) {
      setErrorMsg('Please enter your name so family knows who is asking!');
      return;
    }

    if (selectedIds.length < 2) {
      setErrorMsg('Please select at least 2 sarees to compare');
      return;
    }

    setLoading(true);
    try {
      const result = await createFamilyPoll({
        creatorName: cleanName,
        occasion: occasion.trim(),
        productIds: selectedIds,
        showPrice,
      });

      setCreatedSlug(result.slug);
      showToast('Family poll link created!', 'info');
    } catch (err: any) {
      console.error('Failed to create family poll:', err);
      setErrorMsg(err.message || 'Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate share URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pollUrl = createdSlug ? `${origin}/vote/${createdSlug}` : '';

  const whatsappMessage = encodeURIComponent(
    `🌸 ${creatorName || 'I am'} choosing a saree for ${occasion || 'an upcoming function'}! ❤️\n\nWhich one looks best? Vote here:\n${pollUrl}`
  );

  const handleCopyLink = () => {
    if (!pollUrl) return;
    navigator.clipboard.writeText(pollUrl);
    setCopied(true);
    showToast('Link copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden border border-cream"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-maroon to-maroon-dark text-ivory px-6 py-4 flex items-center justify-between relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <Users className="text-gold w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide flex items-center gap-1.5">
                Ask Family to Vote <Heart className="w-4 h-4 text-gold fill-gold" />
              </h2>
              <p className="text-xs text-ivory/80 font-sans">
                {createdSlug ? 'Share your poll link' : 'Get instant family opinions on WhatsApp'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ivory/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-grow space-y-5 text-dark-brown">
          {createdSlug ? (
            /* STEP 2: Shareable Screen */
            <div className="text-center py-2 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-cream/70 rounded-full flex items-center justify-center mx-auto text-maroon border border-cream">
                <CheckCircle2 className="w-8 h-8 text-maroon" />
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-dark-brown">
                  Your Saree Poll is Live!
                </h3>
                <p className="text-xs sm:text-sm text-dark-brown/70 mt-1 max-w-sm mx-auto">
                  Share this link with your family on WhatsApp. They can vote on their phone without creating an account!
                </p>
              </div>

              {/* Link Box */}
              <div className="bg-cream/40 border border-cream rounded-xl p-3 flex items-center justify-between gap-2 text-left">
                <span className="text-xs font-mono text-dark-brown/80 truncate select-all flex-grow">
                  {pollUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-white border border-dark-brown/15 hover:border-maroon rounded-lg text-xs font-semibold text-dark-brown flex items-center gap-1.5 hover:text-maroon transition-all shadow-xs shrink-0"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy
                    </>
                  )}
                </button>
              </div>

              {/* WhatsApp Share Button */}
              <a
                href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span className="font-bold">Share on WhatsApp</span>
              </a>

              {/* Open Poll Page Link */}
              <div className="pt-2 flex items-center justify-center gap-4 text-xs font-medium">
                <Link
                  href={`/vote/${createdSlug}`}
                  className="text-maroon hover:underline flex items-center gap-1"
                  target="_blank"
                >
                  <span>Open Poll & View Votes</span>
                  <ExternalLink size={12} />
                </Link>
                <span className="text-dark-brown/20">•</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-dark-brown/60 hover:text-dark-brown"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* STEP 1: Configuration & Saree Selection */
            <form onSubmit={handleCreatePoll} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-dark-brown uppercase tracking-wider mb-1">
                  Your Name <span className="text-maroon">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priyanka, Ananya, Bride"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-cream/20 border border-dark-brown/20 rounded-xl focus:border-maroon focus:ring-1 focus:ring-maroon focus:outline-none transition-all placeholder:text-dark-brown/40"
                />
                <p className="text-[11px] text-dark-brown/50 mt-1">
                  Family will see: &quot;{creatorName ? creatorName.trim() : 'Priyanka'} is choosing a saree ❤️&quot;
                </p>
              </div>

              {/* Occasion Input & Quick Chips */}
              <div>
                <label className="block text-xs font-bold text-dark-brown uppercase tracking-wider mb-1">
                  Occasion
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wedding Reception, Sangeet"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-cream/20 border border-dark-brown/20 rounded-xl focus:border-maroon focus:ring-1 focus:ring-maroon focus:outline-none transition-all mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {OCCASION_PRESETS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setOccasion(item)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                        occasion === item
                          ? 'bg-maroon text-ivory border-maroon'
                          : 'bg-white text-dark-brown/70 border-dark-brown/15 hover:border-maroon/50'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Saree Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-dark-brown uppercase tracking-wider">
                    Select Sarees to Compare
                  </label>
                  <span className="text-[11px] font-semibold text-maroon">
                    {selectedIds.length} Selected (2 to 6)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-cream rounded-xl bg-cream/10">
                  {wishlistItems.map((product) => {
                    const isSelected = selectedIds.includes(product.id);
                    const imageSrc = product.images?.[0] || '/images/placeholder.jpg';

                    return (
                      <div
                        key={product.id}
                        onClick={() => toggleSelect(product.id)}
                        className={`relative rounded-lg border-2 p-1.5 cursor-pointer transition-all flex flex-col items-center text-center ${
                          isSelected
                            ? 'border-maroon bg-maroon/5 shadow-xs'
                            : 'border-transparent bg-white hover:border-dark-brown/20 opacity-70'
                        }`}
                      >
                        {/* Checkmark bubble */}
                        <div
                          className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shadow ${
                            isSelected ? 'bg-maroon' : 'bg-dark-brown/20'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>

                        <div className="relative w-full aspect-square rounded-md overflow-hidden bg-cream/40 mb-1.5">
                          <Image
                            src={imageSrc}
                            alt={product.name}
                            fill
                            sizes="120px"
                            className="object-cover"
                          />
                        </div>

                        <span className="text-[11px] font-serif font-bold text-dark-brown line-clamp-1">
                          {product.name}
                        </span>
                        <span className="text-[10px] text-dark-brown/60">
                          ₹{(product.salePrice || product.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Show Price Toggle */}
              <div className="pt-1 flex items-center justify-between bg-cream/30 p-2.5 rounded-xl border border-cream">
                <div>
                  <span className="text-xs font-bold text-dark-brown block">
                    Show prices to family
                  </span>
                  <span className="text-[11px] text-dark-brown/60 block">
                    Toggle off if you want purely aesthetic votes
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-dark-brown/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-maroon"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || selectedIds.length < 2}
                  className="w-full py-3 px-4 bg-maroon hover:bg-maroon-dark active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-ivory rounded-xl font-serif font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin"></span>
                      Generating Family Link...
                    </span>
                  ) : (
                    <>
                      <Share2 size={16} />
                      <span>CREATE SHAREABLE POLL</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
