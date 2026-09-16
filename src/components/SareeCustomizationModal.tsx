'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Scissors, CheckCircle2, Clock } from 'lucide-react';
import { Product, ProductAddon, SelectedAddon } from '@/data/products';
import { blockGhostClicks, isGhostClickBlocked } from '../utils/haptics';

export const markCustomizationModalClosed = () => {
  blockGhostClicks(750);
};

export const isCustomizationModalRecentlyClosed = () => {
  return isGhostClickBlocked();
};

interface SareeCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  addonsList: ProductAddon[];
  initialSelectedAddons?: SelectedAddon[];
  onConfirm: (selectedAddons: SelectedAddon[], mode: 'cart' | 'buy_now' | 'edit') => void;
  mode?: 'cart' | 'buy_now' | 'edit';
  allowBlouseStitching?: boolean;
}

export const SareeCustomizationModal: React.FC<SareeCustomizationModalProps> = ({
  isOpen,
  onClose,
  product,
  addonsList,
  initialSelectedAddons = [],
  onConfirm,
  mode = 'cart',
  allowBlouseStitching = true,
}) => {
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [blouseSize, setBlouseSize] = useState<string>('38');
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const hasBlouse = product.has_blouse !== false;
  const basePrice = product.salePrice ?? product.price;

  // Pre-populate selections from initialSelectedAddons whenever modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      const initialMap: Record<string, boolean> = {};
      let initialSize = '38';
      if (initialSelectedAddons && initialSelectedAddons.length > 0) {
        initialSelectedAddons.forEach((a) => {
          initialMap[a.id] = true;
          if (a.size) {
            initialSize = a.size;
          }
        });
      }
      setSelectedIds(initialMap);
      setBlouseSize(initialSize);
    } else {
      setSelectedIds({});
      setBlouseSize('38');
    }
  }, [isOpen, product.id, initialSelectedAddons]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Active selected addons
  const activeAddons = useMemo<SelectedAddon[]>(() => {
    return addonsList
      .filter((addon) => {
        if (!selectedIds[addon.id]) return false;
        if (hasBlouse && addon.id === 'blouse_piece') return false;
        if (!allowBlouseStitching && addon.id === 'stitch_blouse') return false;
        return true;
      })
      .map((addon) => ({
        id: addon.id,
        title: addon.title,
        price: addon.price,
        size: addon.requires_size ? blouseSize : undefined,
      }));
  }, [addonsList, selectedIds, hasBlouse, blouseSize, allowBlouseStitching]);

  const addonsTotal = useMemo(() => {
    return activeAddons.reduce((sum, a) => sum + a.price, 0);
  }, [activeAddons]);

  const finalTotal = basePrice + addonsTotal;

  const toggleAddon = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isClosing) return;
    setIsClosing(true);
    markCustomizationModalClosed();
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 120);
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isClosing) return;
    setIsClosing(true);
    markCustomizationModalClosed();
    setTimeout(() => {
      onConfirm([], mode);
      setIsClosing(false);
    }, 120);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isClosing) return;
    setIsClosing(true);
    markCustomizationModalClosed();
    setTimeout(() => {
      onConfirm(activeAddons, mode);
      setIsClosing(false);
    }, 120);
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        markCustomizationModalClosed();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal / Bottom Sheet Card */}
      <div
        className="relative w-full sm:max-w-lg bg-[#FAF7F0] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E8DFD1] overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] z-10 animate-slideUp sm:animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#D4C8B4]" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 pt-3 pb-3.5 border-b border-[#E8DFD1] flex items-center justify-between gap-3 bg-white/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-14 rounded-xl overflow-hidden bg-[#FAF7F0] border border-[#E5DEC9] shrink-0">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-sans font-bold text-[#B08A3C] uppercase tracking-wider block">
                {product.fabric || product.category || 'BANARASI SILK'}
              </span>
              <h3 className="font-serif font-bold text-xs sm:text-sm text-[#292524] truncate">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-[#6B1725] font-sans">
                  Saree: ₹{basePrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-[#7A6E65] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sub-Header Banner */}
        <div className="bg-[#FAF6EE] px-4 sm:px-6 py-2.5 border-b border-[#E8DFD1]/70 flex items-center gap-2 shrink-0">
          <div className="w-5 h-5 rounded-full bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725] shrink-0">
            <Scissors size={12} />
          </div>
          <p className="text-xs text-[#52111C] font-sans font-medium">
            Optional: Add stitching &amp; matching pieces to wear your saree right away.
          </p>
        </div>

        {/* Scrollable Services Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {/* 1. Fall & Pico */}
          {addonsList.some((a) => a.id === 'fall_pico') && (
            <label
              className={`flex items-start justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                selectedIds['fall_pico']
                  ? 'bg-white border-[#6B1725] ring-2 ring-[#6B1725]/15 shadow-2xs'
                  : 'bg-white/80 border-[#E8DFD1] hover:border-[#D8CEBA]'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={Boolean(selectedIds['fall_pico'])}
                  onChange={() => toggleAddon('fall_pico')}
                  className="mt-0.5 accent-[#6B1725] w-4.5 h-4.5 rounded cursor-pointer shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-[#292524]">
                      Fall &amp; Pico Stitching
                    </span>
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full font-sans">
                      ★ Recommended
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#7A6E65] leading-relaxed mt-0.5">
                    Cotton fall stitched to lower border + neat machine pico edge. Ready to wear.
                  </p>
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#6B1725] shrink-0 font-sans">
                +₹{addonsList.find((a) => a.id === 'fall_pico')?.price || 149}
              </span>
            </label>
          )}

          {/* 2. Matching Petticoat */}
          {addonsList.some((a) => a.id === 'petticoat') && (
            <label
              className={`flex items-start justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                selectedIds['petticoat']
                  ? 'bg-white border-[#6B1725] ring-2 ring-[#6B1725]/15 shadow-2xs'
                  : 'bg-white/80 border-[#E8DFD1] hover:border-[#D8CEBA]'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={Boolean(selectedIds['petticoat'])}
                  onChange={() => toggleAddon('petticoat')}
                  className="mt-0.5 accent-[#6B1725] w-4.5 h-4.5 rounded cursor-pointer shrink-0"
                />
                <div>
                  <span className="text-xs sm:text-sm font-bold text-[#292524] block">
                    Matching Cotton Inskirt (Petticoat)
                  </span>
                  <p className="text-[11.5px] text-[#7A6E65] leading-relaxed mt-0.5">
                    100% breathable pure cotton, color-matched to your saree by showroom experts.
                  </p>
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#6B1725] shrink-0 font-sans">
                +₹{addonsList.find((a) => a.id === 'petticoat')?.price || 299}
              </span>
            </label>
          )}

          {/* 3. Blouse Options (Smart condition based on hasBlouse & allowBlouseStitching) */}
          {hasBlouse ? (
            /* Saree includes unstitched blouse piece */
            allowBlouseStitching ? (
              addonsList.some((a) => a.id === 'stitch_blouse') && (
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    selectedIds['stitch_blouse']
                      ? 'bg-white border-[#6B1725] ring-2 ring-[#6B1725]/15 shadow-2xs space-y-3'
                      : 'bg-white/80 border-[#E8DFD1] hover:border-[#D8CEBA]'
                  }`}
                >
                  <label className="flex items-start justify-between gap-3 cursor-pointer">
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedIds['stitch_blouse'])}
                        onChange={() => toggleAddon('stitch_blouse')}
                        className="mt-0.5 accent-[#6B1725] w-4.5 h-4.5 rounded cursor-pointer shrink-0"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-[#292524]">
                          Stitch Saree&apos;s Blouse Piece
                        </span>
                        <p className="text-[11.5px] text-[#7A6E65] leading-relaxed mt-0.5">
                          Tailored to your size with soft inner lining and side alteration margins.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#6B1725] shrink-0 font-sans">
                      +₹{addonsList.find((a) => a.id === 'stitch_blouse')?.price || 499}
                    </span>
                  </label>

                  {selectedIds['stitch_blouse'] && (
                    <div className="pt-2.5 border-t border-[#E8DFD1] space-y-2 pl-7 sm:pl-7.5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#292524]">
                          Select Bust Size (Inches):
                        </span>
                        <span className="text-[10.5px] text-[#7A6E65]">
                          Standard fit + margins
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['34', '36', '38', '40', '42', '44'].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setBlouseSize(size)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              blouseSize === size
                                ? 'bg-[#6B1725] text-white border-[#6B1725] shadow-xs scale-105'
                                : 'bg-[#FAF7F0] text-[#292524] border-[#D8CEBA] hover:border-[#6B1725]'
                            }`}
                          >
                            {size}&quot;
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="p-3 rounded-2xl bg-[#FAF6EE] border border-[#E8DFD1] text-[11.5px] text-[#7A6E65] flex items-center gap-2.5">
                <Clock size={15} className="text-[#6B1725] shrink-0" />
                <span>Blouse stitching is only available for standard delivery (takes 2–3 tailoring days). Unstitched blouse piece (0.8m) is included with your saree.</span>
              </div>
            )
          ) : (
            /* Saree has no blouse piece */
            <>
              {addonsList.some((a) => a.id === 'blouse_piece') && (
                <label
                  className={`flex items-start justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedIds['blouse_piece']
                      ? 'bg-white border-[#6B1725] ring-2 ring-[#6B1725]/15 shadow-2xs'
                      : 'bg-white/80 border-[#E8DFD1] hover:border-[#D8CEBA]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedIds['blouse_piece'])}
                      onChange={() => toggleAddon('blouse_piece')}
                      className="mt-0.5 accent-[#6B1725] w-4.5 h-4.5 rounded cursor-pointer shrink-0"
                    />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-[#292524] block">
                        Add Matching Blouse Fabric
                      </span>
                      <p className="text-[11.5px] text-[#7A6E65] leading-relaxed mt-0.5">
                        0.8m unstitched complementary fabric handpicked for this saree.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#6B1725] shrink-0 font-sans">
                    +₹{addonsList.find((a) => a.id === 'blouse_piece')?.price || 249}
                  </span>
                </label>
              )}

              {allowBlouseStitching ? (
                addonsList.some((a) => a.id === 'stitch_blouse') && (
                  <div
                    className={`p-3 rounded-2xl border transition-all ${
                      selectedIds['stitch_blouse']
                        ? 'bg-white border-[#6B1725] ring-2 ring-[#6B1725]/15 shadow-2xs space-y-3'
                        : 'bg-white/80 border-[#E8DFD1] hover:border-[#D8CEBA]'
                    }`}
                  >
                    <label className="flex items-start justify-between gap-3 cursor-pointer">
                      <div className="flex items-start gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedIds['stitch_blouse'])}
                          onChange={() => toggleAddon('stitch_blouse')}
                          className="mt-0.5 accent-[#6B1725] w-4.5 h-4.5 rounded cursor-pointer shrink-0"
                        />
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-[#292524] block">
                            Add Ready-to-Wear Stitched Blouse
                          </span>
                          <p className="text-[11.5px] text-[#7A6E65] leading-relaxed mt-0.5">
                            Pre-stitched matching blouse with comfortable inner lining.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#6B1725] shrink-0 font-sans">
                        +₹{addonsList.find((a) => a.id === 'stitch_blouse')?.price || 499}
                      </span>
                    </label>

                    {selectedIds['stitch_blouse'] && (
                      <div className="pt-2.5 border-t border-[#E8DFD1] space-y-2 pl-7 sm:pl-7.5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#292524]">
                            Select Bust Size (Inches):
                          </span>
                          <span className="text-[10.5px] text-[#7A6E65]">
                            Regular fit
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['34', '36', '38', '40', '42', '44'].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setBlouseSize(size)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                blouseSize === size
                                  ? 'bg-[#6B1725] text-white border-[#6B1725] shadow-xs scale-105'
                                  : 'bg-[#FAF7F0] text-[#292524] border-[#D8CEBA] hover:border-[#6B1725]'
                              }`}
                            >
                              {size}&quot;
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="p-3 rounded-2xl bg-[#FAF6EE] border border-[#E8DFD1] text-[11.5px] text-[#7A6E65] flex items-center gap-2.5">
                  <Clock size={15} className="text-[#6B1725] shrink-0" />
                  <span>Ready-to-wear blouse stitching requires standard delivery (2–3 tailoring days).</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer / Dual Action CTA */}
        <div className="p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-5 bg-white border-t border-[#E8DFD1] space-y-2.5 shrink-0 shadow-lg">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-[#7A6E65]">
              {activeAddons.length > 0
                ? `${activeAddons.length} tailoring service(s) selected`
                : 'Pure Saree (no extra services)'}
            </span>
            <span className="font-extrabold text-sm sm:text-base text-[#6B1725] tabular-nums">
              Total: ₹{finalTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Skip Button (Adds just the saree) */}
            {mode !== 'edit' && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isClosing}
                className={`flex-1 py-3 px-4 rounded-xl border border-[#D4C8B4] text-[#7A6E65] hover:text-[#292524] hover:bg-stone-50 font-sans font-bold text-xs sm:text-sm transition-all text-center ${
                  isClosing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                Skip (Just Saree)
              </button>
            )}

            {/* Confirm / Continue Button */}
            <button
              type="button"
              onClick={handleApply}
              disabled={isClosing}
              className={`flex-1 py-3 px-4 rounded-xl font-sans font-bold text-xs sm:text-sm transition-all text-center shadow-md flex items-center justify-center gap-1.5 bg-[#6B1725] hover:bg-[#52111C] text-white shadow-[#6B1725]/20 ${
                isClosing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <CheckCircle2 size={16} />
              <span>
                {mode === 'edit'
                  ? 'Update Services'
                  : activeAddons.length > 0
                  ? 'Add Services & Continue'
                  : `Continue to ${mode === 'buy_now' ? 'Checkout' : 'Bag'}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
