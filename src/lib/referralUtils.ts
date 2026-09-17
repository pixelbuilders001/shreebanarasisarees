/**
 * Helper utilities for Referral Code tracking via Cookies and LocalStorage.
 */

const REFERRAL_COOKIE_NAME = 'sbs_ref_code';
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Saves the referral code to a 30-day cookie and localStorage backup.
 */
export function storeReferralCode(code: string): void {
  if (!code || typeof window === 'undefined') return;
  const cleanCode = code.trim().toUpperCase();

  try {
    // 30 days cookie
    document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(cleanCode)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
    // LocalStorage fallback
    localStorage.setItem(REFERRAL_COOKIE_NAME, cleanCode);
  } catch (err) {
    console.warn('Could not store referral code:', err);
  }
}

/**
 * Retrieves stored referral code from Cookie or LocalStorage.
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check cookies first
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + REFERRAL_COOKIE_NAME + '=([^;]*)'));
    if (match && match[2]) {
      const val = decodeURIComponent(match[2]).trim().toUpperCase();
      if (val) return val;
    }

    // 2. Fallback to localStorage
    const localVal = localStorage.getItem(REFERRAL_COOKIE_NAME);
    if (localVal) {
      return localVal.trim().toUpperCase();
    }
  } catch (err) {
    console.warn('Could not read stored referral code:', err);
  }

  return null;
}

/**
 * Clears the stored referral code from both Cookie and LocalStorage once consumed.
 */
export function clearStoredReferralCode(): void {
  if (typeof window === 'undefined') return;

  try {
    document.cookie = `${REFERRAL_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    localStorage.removeItem(REFERRAL_COOKIE_NAME);
  } catch (err) {
    console.warn('Could not clear stored referral code:', err);
  }
}
