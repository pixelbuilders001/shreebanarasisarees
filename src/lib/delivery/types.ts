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
  isExpress?: boolean;
  eligible?: boolean;
  serviceable?: boolean;
  isOutsideServiceArea?: boolean;
  isStoreClosed?: boolean;
  isAfterMidnight?: boolean;
  isAfter8PM?: boolean;
  storeClosedMessage?: string;
  eta?: {
    minutes?: number;
    formattedDelivery?: string;
    packingBufferMinutes?: number;
    deliveryBufferMinutes?: number;
  };
  district?: string;
  state?: string;
  error?: string;
  message?: string;
  options?: any[];
  deliverySettings?: any;
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
