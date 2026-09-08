import React from 'react';

/**
 * Pincode check delivery icons using WebP images:
 * - Express Delivery: /expressdel.webp
 * - Standard Delivery: /standarddel.webp
 */
export function ExpressRiderIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img
      src="/expressdel.webp"
      alt="Express Delivery"
      className={`object-contain shrink-0 ${className}`}
      loading="eager"
    />
  );
}

export function StandardTruckIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img
      src="/standarddel.webp"
      alt="Standard Delivery"
      className={`object-contain shrink-0 ${className}`}
      loading="eager"
    />
  );
}

export function DeliveryRiderIcon({
  className = "w-10 h-10",
  isExpress = true,
  type
}: {
  className?: string;
  isExpress?: boolean;
  type?: 'express' | 'standard';
}) {
  const isExp = type ? type === 'express' : isExpress;
  return (
    <img
      src={isExp ? "/expressdel.webp" : "/standarddel.webp"}
      alt={isExp ? "Express Delivery" : "Standard Delivery"}
      className={`object-contain shrink-0 ${className}`}
      loading="eager"
    />
  );
}

