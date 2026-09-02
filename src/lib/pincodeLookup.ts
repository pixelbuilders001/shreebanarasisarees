/**
 * Helper utility to lookup City/District and State from a 6-digit Indian Pincode.
 * Employs a multi-provider fallback strategy (Zippopotam API -> India Post API).
 */

export interface PincodeDetails {
  city: string;
  state: string;
  pincode: string;
  success: boolean;
}

export async function fetchPincodeDetails(pincode: string): Promise<PincodeDetails | null> {
  const cleanPin = pincode.trim().replace(/\D/g, '');
  if (cleanPin.length !== 6 || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return null;
  }

  // 1. Try Zippopotam API (Fastest)
  try {
    const res = await fetch(`https://api.zippopotam.us/in/${cleanPin}`, {
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.places && data.places.length > 0) {
        const place = data.places[0];
        const city = place['place name'] || place['state abbreviation'] || '';
        const state = place['state'] || '';
        if (city && state) {
          return {
            city: city.trim(),
            state: state.trim(),
            pincode: cleanPin,
            success: true
          };
        }
      }
    }
  } catch (err) {
    console.warn('[Pincode Lookup] Zippopotam fallback trigger:', err);
  }

  // 2. Fallback to India Post Postal API
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const city = po.District || po.Block || po.Name || '';
        const state = po.State || '';
        if (city && state) {
          return {
            city: city.trim(),
            state: state.trim(),
            pincode: cleanPin,
            success: true
          };
        }
      }
    }
  } catch (err) {
    console.warn('[Pincode Lookup] India Post API error:', err);
  }

  return null;
}
