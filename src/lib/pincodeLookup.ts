/**
 * Helper utility to lookup City/District and State from a 6-digit Indian Pincode.
 * Employs an instant local dictionary + prefix lookup, backed by multi-provider
 * fallback (India Post API -> Zippopotam API) with in-session caching.
 */

export interface PincodeDetails {
  city: string;
  state: string;
  pincode: string;
  success: boolean;
}

const pincodeCache = new Map<string, PincodeDetails>();

export const COMMON_PINCODE_MAP: Record<string, { city: string; state: string }> = {
  // Bihar - Local & Regional
  '848101': { city: 'Samastipur', state: 'Bihar' },
  '848102': { city: 'Samastipur', state: 'Bihar' },
  '848106': { city: 'Samastipur', state: 'Bihar' },
  '848114': { city: 'Darbhanga', state: 'Bihar' },
  '846001': { city: 'Darbhanga', state: 'Bihar' },
  '846002': { city: 'Darbhanga', state: 'Bihar' },
  '846003': { city: 'Darbhanga', state: 'Bihar' },
  '846004': { city: 'Darbhanga', state: 'Bihar' },
  '846005': { city: 'Darbhanga', state: 'Bihar' },
  '842001': { city: 'Muzaffarpur', state: 'Bihar' },
  '842002': { city: 'Muzaffarpur', state: 'Bihar' },
  '800001': { city: 'Patna', state: 'Bihar' },
  '800002': { city: 'Patna', state: 'Bihar' },
  '800003': { city: 'Patna', state: 'Bihar' },
  '800004': { city: 'Patna', state: 'Bihar' },
  '800013': { city: 'Patna', state: 'Bihar' },
  '800020': { city: 'Patna', state: 'Bihar' },
  '823001': { city: 'Gaya', state: 'Bihar' },
  '812001': { city: 'Bhagalpur', state: 'Bihar' },
  '844101': { city: 'Hajipur', state: 'Bihar' },
  '845401': { city: 'Motihari', state: 'Bihar' },
  '841301': { city: 'Chapra', state: 'Bihar' },

  // Delhi NCR
  '110001': { city: 'New Delhi', state: 'Delhi' },
  '110002': { city: 'New Delhi', state: 'Delhi' },
  '110003': { city: 'New Delhi', state: 'Delhi' },
  '110005': { city: 'Karol Bagh', state: 'Delhi' },
  '110006': { city: 'Old Delhi', state: 'Delhi' },
  '110011': { city: 'New Delhi', state: 'Delhi' },
  '110019': { city: 'Kalkaji', state: 'Delhi' },
  '110020': { city: 'Okhla', state: 'Delhi' },
  '110024': { city: 'Lajpat Nagar', state: 'Delhi' },
  '110034': { city: 'Pitampura', state: 'Delhi' },
  '110085': { city: 'Rohini', state: 'Delhi' },
  '110092': { city: 'East Delhi', state: 'Delhi' },
  '122001': { city: 'Gurugram', state: 'Haryana' },
  '122002': { city: 'Gurugram', state: 'Haryana' },
  '121001': { city: 'Faridabad', state: 'Haryana' },
  '201301': { city: 'Noida', state: 'Uttar Pradesh' },
  '201001': { city: 'Ghaziabad', state: 'Uttar Pradesh' },

  // Uttar Pradesh
  '221001': { city: 'Varanasi', state: 'Uttar Pradesh' },
  '221002': { city: 'Varanasi', state: 'Uttar Pradesh' },
  '221005': { city: 'Varanasi', state: 'Uttar Pradesh' },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '208001': { city: 'Kanpur', state: 'Uttar Pradesh' },
  '211001': { city: 'Prayagraj', state: 'Uttar Pradesh' },
  '282001': { city: 'Agra', state: 'Uttar Pradesh' },

  // Major Metros & States
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '400050': { city: 'Mumbai', state: 'Maharashtra' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '560034': { city: 'Bengaluru', state: 'Karnataka' },
  '560038': { city: 'Bengaluru', state: 'Karnataka' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '500081': { city: 'Hyderabad', state: 'Telangana' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '700020': { city: 'Kolkata', state: 'West Bengal' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '395001': { city: 'Surat', state: 'Gujarat' },
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
  '462001': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '452001': { city: 'Indore', state: 'Madhya Pradesh' },
  '834001': { city: 'Ranchi', state: 'Jharkhand' },
  '831001': { city: 'Jamshedpur', state: 'Jharkhand' },
  '781001': { city: 'Guwahati', state: 'Assam' },
  '682001': { city: 'Kochi', state: 'Kerala' },
  '160017': { city: 'Chandigarh', state: 'Chandigarh' },
  '141001': { city: 'Ludhiana', state: 'Punjab' },
  '143001': { city: 'Amritsar', state: 'Punjab' },
  '751001': { city: 'Bhubaneswar', state: 'Odisha' },
  '492001': { city: 'Raipur', state: 'Chhattisgarh' },
  '248001': { city: 'Dehradun', state: 'Uttarakhand' }
};

export const PINCODE_PREFIX_MAP: Record<string, { city: string; state: string }> = {
  '848': { city: 'Samastipur', state: 'Bihar' },
  '846': { city: 'Darbhanga', state: 'Bihar' },
  '842': { city: 'Muzaffarpur', state: 'Bihar' },
  '844': { city: 'Vaishali', state: 'Bihar' },
  '845': { city: 'Motihari', state: 'Bihar' },
  '841': { city: 'Chapra', state: 'Bihar' },
  '847': { city: 'Madhubani', state: 'Bihar' },
  '800': { city: 'Patna', state: 'Bihar' },
  '801': { city: 'Patna', state: 'Bihar' },
  '803': { city: 'Nalanda', state: 'Bihar' },
  '823': { city: 'Gaya', state: 'Bihar' },
  '812': { city: 'Bhagalpur', state: 'Bihar' },
  '110': { city: 'New Delhi', state: 'Delhi' },
  '121': { city: 'Faridabad', state: 'Haryana' },
  '122': { city: 'Gurugram', state: 'Haryana' },
  '201': { city: 'Noida', state: 'Uttar Pradesh' },
  '221': { city: 'Varanasi', state: 'Uttar Pradesh' },
  '226': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '208': { city: 'Kanpur', state: 'Uttar Pradesh' },
  '211': { city: 'Prayagraj', state: 'Uttar Pradesh' },
  '400': { city: 'Mumbai', state: 'Maharashtra' },
  '411': { city: 'Pune', state: 'Maharashtra' },
  '560': { city: 'Bengaluru', state: 'Karnataka' },
  '500': { city: 'Hyderabad', state: 'Telangana' },
  '600': { city: 'Chennai', state: 'Tamil Nadu' },
  '700': { city: 'Kolkata', state: 'West Bengal' },
  '380': { city: 'Ahmedabad', state: 'Gujarat' },
  '302': { city: 'Jaipur', state: 'Rajasthan' },
  '834': { city: 'Ranchi', state: 'Jharkhand' },
  '831': { city: 'Jamshedpur', state: 'Jharkhand' },
  '452': { city: 'Indore', state: 'Madhya Pradesh' },
  '462': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '160': { city: 'Chandigarh', state: 'Chandigarh' }
};

/**
 * Synchronous, instant (0ms) lookup for city name based on 6-digit pincode or 3-digit prefix.
 */
export function getQuickCity(pincode: string): string {
  const cleanPin = pincode?.trim().replace(/\D/g, '') || '';
  if (cleanPin.length !== 6) return '';

  if (pincodeCache.has(cleanPin)) {
    return pincodeCache.get(cleanPin)!.city;
  }

  if (COMMON_PINCODE_MAP[cleanPin]) {
    return COMMON_PINCODE_MAP[cleanPin].city;
  }

  const prefix = cleanPin.slice(0, 3);
  if (PINCODE_PREFIX_MAP[prefix]) {
    return PINCODE_PREFIX_MAP[prefix].city;
  }

  return '';
}

export async function fetchPincodeDetails(pincode: string): Promise<PincodeDetails | null> {
  const cleanPin = pincode?.trim().replace(/\D/g, '') || '';
  if (cleanPin.length !== 6 || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return null;
  }

  // 1. Check in-memory cache
  if (pincodeCache.has(cleanPin)) {
    return pincodeCache.get(cleanPin)!;
  }

  // 2. Check instant local dictionary
  if (COMMON_PINCODE_MAP[cleanPin]) {
    const entry = {
      city: COMMON_PINCODE_MAP[cleanPin].city,
      state: COMMON_PINCODE_MAP[cleanPin].state,
      pincode: cleanPin,
      success: true
    };
    pincodeCache.set(cleanPin, entry);
    return entry;
  }

  // 3. Fallback to India Post Postal API
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const city = po.District || po.Block || po.Name || '';
        const state = po.State || '';
        if (city && state) {
          const entry = {
            city: city.trim(),
            state: state.trim(),
            pincode: cleanPin,
            success: true
          };
          pincodeCache.set(cleanPin, entry);
          return entry;
        }
      }
    }
  } catch (err) {
    console.warn('[Pincode Lookup] India Post API error:', err);
  }

  // 4. Try Zippopotam API
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
          const entry = {
            city: city.trim(),
            state: state.trim(),
            pincode: cleanPin,
            success: true
          };
          pincodeCache.set(cleanPin, entry);
          return entry;
        }
      }
    }
  } catch (err) {
    console.warn('[Pincode Lookup] Zippopotam fallback trigger:', err);
  }

  // 5. Final fallback: circle prefix map
  const prefix = cleanPin.slice(0, 3);
  if (PINCODE_PREFIX_MAP[prefix]) {
    const entry = {
      city: PINCODE_PREFIX_MAP[prefix].city,
      state: PINCODE_PREFIX_MAP[prefix].state,
      pincode: cleanPin,
      success: true
    };
    pincodeCache.set(cleanPin, entry);
    return entry;
  }

  return null;
}
