export type DeliverySource = 'gps' | 'pincode';

export interface DeliveryCheckResult {
  success: boolean;
  source: DeliverySource;
  pincode?: string;
  distanceKm: number;
  routeMinutes: number;
  packingBufferMinutes: number;
  deliveryBufferMinutes: number;
  customerEtaMinutes: number;
  is20MinDelivery: boolean;
  eta?: { minutes: number };
  district?: string;
  state?: string;
  error?: string;
  message?: string;
}

export interface CustomerLocation {
  latitude: number;
  longitude: number;
  source: DeliverySource;
}

export interface PincodeLocation {
  pincode: string;
  latitude: number;
  longitude: number;
  district?: string;
  state?: string;
  city?: string;
}
