'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ProductImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  productName: string;
  productSku?: string;
  onIndexChange?: (index: number) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4.5;
const DOUBLE_TAP_SCALE = 2.5;

export default function ProductImageZoomModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  productName,
  productSku,
  onIndexChange,
}: ProductImageZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimateTransition, setIsAnimateTransition] = useState(true);

  // References for pan & pinch gestures
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef(1);
  const lastTapRef = useRef<number>(0);
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Helper to clamp position within container boundaries when zoomed
  const clampPosition = useCallback((newX: number, newY: number, newScale: number) => {
    if (newScale <= 1) return { x: 0, y: 0 };
    if (!containerRef.current || !imageRef.current) return { x: newX, y: newY };

    const containerRect = containerRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();

    // Natural dimensions considering aspect ratio
    const currentImgWidth = (imgRect.width / scale) * newScale;
    const currentImgHeight = (imgRect.height / scale) * newScale;

    const maxPanX = Math.max(0, (currentImgWidth - containerRect.width) / 2);
    const maxPanY = Math.max(0, (currentImgHeight - containerRect.height) / 2);

    return {
      x: Math.min(Math.max(newX, -maxPanX), maxPanX),
      y: Math.min(Math.max(newY, -maxPanY), maxPanY),
    };
  }, [scale]);

  // Switch images safely and reset zoom
  const handleSelectImage = useCallback((index: number) => {
    if (index < 0 || index >= images.length) return;
    setIsAnimateTransition(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex(index);
    onIndexChange?.(index);
  }, [images.length, onIndexChange]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    handleSelectImage((currentIndex + 1) % images.length);
  }, [currentIndex, handleSelectImage, images.length]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    handleSelectImage((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, handleSelectImage, images.length]);

  // Zoom to a specific scale smoothly
  const handleZoom = useCallback((targetScale: number, focusX?: number, focusY?: number) => {
    setIsAnimateTransition(true);
    const clampedScale = Math.min(Math.max(targetScale, MIN_SCALE), MAX_SCALE);

    if (clampedScale <= 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      return;
    }

    if (focusX !== undefined && focusY !== undefined && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const originX = focusX - (rect.left + rect.width / 2);
      const originY = focusY - (rect.top + rect.height / 2);
      const scaleRatio = clampedScale / scale;

      const newX = position.x - originX * (scaleRatio - 1);
      const newY = position.y - originY * (scaleRatio - 1);

      setScale(clampedScale);
      setPosition(clampPosition(newX, newY, clampedScale));
    } else {
      setScale(clampedScale);
      setPosition(prev => clampPosition(prev.x, prev.y, clampedScale));
    }
  }, [clampPosition, position.x, position.y, scale]);

  const handleZoomIn = () => handleZoom(Math.min(scale + 0.75, MAX_SCALE));
  const handleZoomOut = () => handleZoom(Math.max(scale - 0.75, MIN_SCALE));
  const handleReset = () => handleZoom(1);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
        case '_':
          handleZoomOut();
          break;
        case '0':
          handleReset();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev, handleZoomIn, handleZoomOut, handleReset]);

  // Desktop Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
    const nextScale = scale * zoomFactor;
    handleZoom(nextScale, e.clientX, e.clientY);
  };

  // Double Click / Double Tap toggle
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (scale > 1) {
      handleReset();
    } else {
      handleZoom(DOUBLE_TAP_SCALE, e.clientX, e.clientY);
    }
  };

  // Mouse Drag / Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setIsAnimateTransition(false);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { ...position };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const newX = initialPosRef.current.x + deltaX;
    const newY = initialPosRef.current.y + deltaY;
    setPosition(clampPosition(newX, newY, scale));
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setIsAnimateTransition(true);
    }
  };

  // Mobile Touch Gestures (Pinch, Pan, Double-Tap, Swipe)
  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom start
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      touchDistanceRef.current = dist;
      touchStartScaleRef.current = scale;
      setIsAnimateTransition(false);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();

      // Double-tap detection (<300ms)
      if (now - lastTapRef.current < 300) {
        lastTapRef.current = 0;
        if (scale > 1) {
          handleReset();
        } else {
          handleZoom(DOUBLE_TAP_SCALE, touch.clientX, touch.clientY);
        }
        return;
      }
      lastTapRef.current = now;

      // Pan or Swipe start
      dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      initialPosRef.current = { ...position };
      swipeStartXRef.current = touch.clientX;
      swipeStartYRef.current = touch.clientY;

      if (scale > 1) {
        setIsDragging(true);
        setIsAnimateTransition(false);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      // Handle Pinch
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      const factor = dist / touchDistanceRef.current;
      const targetScale = Math.min(Math.max(touchStartScaleRef.current * factor, MIN_SCALE), MAX_SCALE);

      setScale(targetScale);
      if (targetScale <= 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition(prev => clampPosition(prev.x, prev.y, targetScale));
      }
    } else if (e.touches.length === 1 && scale > 1 && isDragging) {
      // Handle Single Finger Pan when Zoomed
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;
      const newX = initialPosRef.current.x + deltaX;
      const newY = initialPosRef.current.y + deltaY;
      setPosition(clampPosition(newX, newY, scale));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchDistanceRef.current = null;
    }

    if (e.touches.length === 0) {
      if (isDragging) {
        setIsDragging(false);
        setIsAnimateTransition(true);
      }

      // Check for swipe gesture when not zoomed in
      if (scale === 1 && swipeStartXRef.current !== null && swipeStartYRef.current !== null) {
        const touch = e.changedTouches[0];
        const diffX = touch.clientX - swipeStartXRef.current;
        const diffY = touch.clientY - swipeStartYRef.current;

        // Ensure horizontal swipe is dominant and above 50px threshold
        if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
          if (diffX < 0) {
            handleNext();
          } else {
            handlePrev();
          }
        }
        swipeStartXRef.current = null;
        swipeStartYRef.current = null;
      }
    }
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#141212]/95 backdrop-blur-xl flex flex-col justify-between select-none animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="High-resolution Saree Zoom View"
    >
      {/* ── TOP HEADER BAR ── */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex flex-col max-w-[65%] sm:max-w-xl">
          <div className="flex items-center gap-2">
            <h3 className="text-white text-sm sm:text-base font-serif font-medium tracking-wide truncate">
              {productName}
            </h3>
            {productSku && (
              <span className="hidden sm:inline-block text-[11px] font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
                {productSku}
              </span>
            )}
          </div>
          <span className="text-xs text-stone-400 font-sans mt-0.5">
            Image {currentIndex + 1} of {images.length}
          </span>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {scale > 1 && (
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-sans flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              title="Reset Zoom (0)"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
            aria-label="Close zoom viewer"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ── MAIN INTERACTIVE IMAGE STAGE ── */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative flex-1 w-full h-full flex items-center justify-center overflow-hidden touch-none ${
          scale > 1
            ? isDragging
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : 'cursor-zoom-in'
        }`}
        style={{ touchAction: 'none' }}
      >
        <div
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
            transition: isAnimateTransition ? 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            transformOrigin: 'center center',
          }}
          className="will-change-transform flex items-center justify-center pointer-events-none max-w-full max-h-full"
        >
          {/* Using img for raw resolution & smooth matrix transform without layout shift */}
          <img
            ref={imageRef}
            src={currentImage}
            alt={`${productName} view ${currentIndex + 1}`}
            draggable={false}
            className="max-w-[92vw] max-h-[70vh] sm:max-h-[75vh] object-contain rounded-lg shadow-2xl pointer-events-auto select-none"
          />
        </div>

        {/* LEFT / RIGHT NAVIGATION ARROWS */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-black/75 text-white/90 hover:text-white backdrop-blur-md flex items-center justify-center transition-all border border-white/15 shadow-xl active:scale-90 cursor-pointer z-20"
              aria-label="Previous image"
              title="Previous (Left Arrow)"
            >
              <ChevronLeft size={26} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-black/75 text-white/90 hover:text-white backdrop-blur-md flex items-center justify-center transition-all border border-white/15 shadow-xl active:scale-90 cursor-pointer z-20"
              aria-label="Next image"
              title="Next (Right Arrow)"
            >
              <ChevronRight size={26} />
            </button>
          </>
        )}
      </div>

      {/* ── BOTTOM FLOATING DOCK: CONTROLS & THUMBNAILS ── */}
      <div className="relative z-20 flex flex-col items-center gap-3 pb-4 pt-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        {/* Floating Zoom Controls Bar */}
        <div className="flex items-center gap-1 sm:gap-2 bg-stone-900/85 backdrop-blur-xl px-3 py-1.5 rounded-full border border-stone-700/60 shadow-2xl">
          <button
            onClick={handleZoomOut}
            disabled={scale <= MIN_SCALE}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            aria-label="Zoom out"
            title="Zoom out (-)"
          >
            <ZoomOut size={17} />
          </button>

          <button
            onClick={handleReset}
            className="px-2.5 py-1 text-xs font-mono font-semibold text-[#D4AF37] hover:bg-white/10 rounded-md transition-colors cursor-pointer"
            title="Click to reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={scale >= MAX_SCALE}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            aria-label="Zoom in"
            title="Zoom in (+)"
          >
            <ZoomIn size={17} />
          </button>

          <div className="w-[1px] h-4 bg-stone-700 mx-1" />

          <button
            onClick={handleReset}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Reset zoom"
            title="Reset zoom (0)"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 max-w-[90vw] overflow-x-auto py-1 px-2 no-scrollbar">
            {images.map((img, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectImage(idx)}
                  className={`relative w-12 h-14 sm:w-14 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all border-2 cursor-pointer ${
                    isActive
                      ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50 scale-105 opacity-100 shadow-md'
                      : 'border-white/20 opacity-60 hover:opacity-90'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
