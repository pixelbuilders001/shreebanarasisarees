/**
 * Native Haptic Feedback Utility
 * Uses the Web Vibration API to provide tactile feedback on touch devices.
 * Gracefully no-ops in unsupported environments or desktop browsers.
 */

export type HapticFeedbackType = 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticFeedbackType, number | number[]> = {
  selection: 8,              // Micro-pulse for tabs, pills, and filter chips
  light: 12,                // Quick tap for hearts, checkboxes, icons
  medium: 22,               // Solid feedback for "Add to Bag", quantity change
  heavy: 35,                // Impact feedback for primary submit buttons
  success: [15, 45, 25],    // Multi-pulse celebration (order placed, coupon applied)
  warning: [25, 40, 25],    // Warning alert
  error: [40, 60, 40],      // Validation failure or error alert
};

export const triggerHaptic = (type: HapticFeedbackType = 'light'): void => {
  if (typeof window === 'undefined') return;

  try {
    if ('navigator' in window && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      const pattern = HAPTIC_PATTERNS[type];
      navigator.vibrate(pattern);
    }
  } catch {
    // Silently ignore if vibration is blocked by browser policy or device settings
  }
};

let blockUntilTimestamp = 0;

/**
 * Universally suppresses ghost clicks / tap bleeding across window boundaries.
 * Uses a capture-phase event listener to intercept and swallow any synthetic click/touch events
 * immediately following the closing of bottom sheets or modals.
 */
export const blockGhostClicks = (durationMs = 750): void => {
  if (typeof window === 'undefined') return;

  const targetExpiry = Date.now() + durationMs;
  blockUntilTimestamp = Math.max(blockUntilTimestamp, targetExpiry);
  (window as any).__lastSheetDismissTime = blockUntilTimestamp;

  const captureInterceptor = (e: Event) => {
    if (Date.now() < blockUntilTimestamp) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    } else {
      window.removeEventListener('click', captureInterceptor, true);
      window.removeEventListener('touchend', captureInterceptor, true);
      window.removeEventListener('pointerup', captureInterceptor, true);
    }
  };

  window.addEventListener('click', captureInterceptor, true);
  window.addEventListener('touchend', captureInterceptor, true);
  window.addEventListener('pointerup', captureInterceptor, true);
};

export const isGhostClickBlocked = (): boolean => {
  if (typeof window === 'undefined') return false;
  const globalExpiry = (window as any).__lastSheetDismissTime || 0;
  return Date.now() < blockUntilTimestamp || Date.now() < globalExpiry;
};

