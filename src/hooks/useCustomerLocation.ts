import { useState, useCallback, useRef } from 'react';
import { supabase } from '../data/supabase';
import { DeliveryCheckResult, DeliverySource } from '../lib/delivery/types';

// In-session cache for pincode & GPS calculations
const deliveryCache = new Map<string, DeliveryCheckResult>();

export function useCustomerLocation() {
  const [loadingState, setLoadingState] = useState<'idle' | 'locating' | 'calculating'>('idle');
  const [result, setResult] = useState<DeliveryCheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isRequesting = useRef(false);

  // Invoke Supabase Edge Function calculate-delivery
  const invokeCalculateDelivery = async (payload: {
    source: DeliverySource;
    customerLat?: number;
    customerLng?: number;
    pincode?: string;
  }): Promise<DeliveryCheckResult> => {
    // Generate cache key
    const cacheKey = payload.source === 'pincode'
      ? `pincode_${payload.pincode}`
      : `gps_${payload.customerLat?.toFixed(4)}_${payload.customerLng?.toFixed(4)}`;

    if (deliveryCache.has(cacheKey)) {
      return deliveryCache.get(cacheKey)!;
    }

    const { data, error } = await supabase.functions.invoke('calculate-delivery', {
      body: payload,
    });

    if (error) {
      // Fallback: direct HTTP fetch to edge function if invoke has client issue
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzqlsawxvvyvsstyzzff.supabase.co';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6chwvgIpbfCpeEZrkS9VYg_IO__zSpY';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/calculate-delivery`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Unable to check delivery right now.');
      }

      const resData = await response.json();
      if (resData.success) {
        deliveryCache.set(cacheKey, resData);
      }
      return resData;
    }

    if (data && data.success) {
      deliveryCache.set(cacheKey, data);
      return data;
    } else if (data && data.error) {
      throw new Error(data.error);
    } else {
      throw new Error('Invalid response from delivery service');
    }
  };

  // Check delivery via GPS location
  const checkGpsLocation = useCallback(async () => {
    if (isRequesting.current) return;
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    isRequesting.current = true;
    setErrorMsg(null);
    setLoadingState('locating');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLoadingState('calculating');

        try {
          const res = await invokeCalculateDelivery({
            source: 'gps',
            customerLat: latitude,
            customerLng: longitude,
          });
          setResult(res);
          setErrorMsg(null);
        } catch (err: any) {
          console.error('GPS delivery calculation error:', err);
          setErrorMsg(err.message || 'Unable to check delivery for your location. Please try again.');
          setResult(null);
        } finally {
          setLoadingState('idle');
          isRequesting.current = false;
        }
      },
      (error) => {
        setLoadingState('idle');
        isRequesting.current = false;
        setResult(null);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorMsg('We couldn\'t access your location. Please allow location access in your browser and try again.');
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorMsg('Your location could not be determined. Please try again.');
            break;
          case error.TIMEOUT:
            setErrorMsg('Location request timed out. Please try again.');
            break;
          default:
            setErrorMsg('Unable to retrieve location. Please try entering your pincode.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Check delivery via 6-digit Indian Pincode
  const checkPincode = useCallback(async (pincodeStr: string) => {
    if (isRequesting.current) return;

    const cleanPin = pincodeStr.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setErrorMsg('Please enter a valid 6-digit pincode.');
      setResult(null);
      return;
    }

    isRequesting.current = true;
    setErrorMsg(null);
    setLoadingState('locating');

    try {
      setLoadingState('calculating');
      const res = await invokeCalculateDelivery({
        source: 'pincode',
        pincode: cleanPin,
      });
      setResult(res);
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Pincode delivery calculation error:', err);
      setErrorMsg(err.message || 'We couldn\'t find this pincode. Please check the pincode and try again.');
      setResult(null);
    } finally {
      setLoadingState('idle');
      isRequesting.current = false;
    }
  }, []);

  const resetState = useCallback(() => {
    setResult(null);
    setErrorMsg(null);
    setLoadingState('idle');
  }, []);

  return {
    loadingState,
    isLoading: loadingState !== 'idle',
    result,
    errorMsg,
    checkGpsLocation,
    checkPincode,
    resetState,
  };
}
