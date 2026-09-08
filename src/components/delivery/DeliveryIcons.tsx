import React from 'react';

/**
 * Delivery Rider Icon from public/delivery-rider-icon.svg
 * Used uniformly for both 20-min express and standard delivery pincode check result messages.
 */
export function DeliveryRiderIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img
      src="/delivery-rider-icon.svg"
      alt="Delivery Rider"
      className={`object-contain shrink-0 ${className}`}
      loading="eager"
    />
  );
}

// Aliases ensuring zero broken imports while replacing truck completely with rider
export const ExpressRiderIcon = DeliveryRiderIcon;
export const StandardTruckIcon = DeliveryRiderIcon;

