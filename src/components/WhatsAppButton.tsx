"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

export const WhatsAppButton: React.FC = () => {
  const pathname = usePathname();
  const whatsappNumber = "+916203909946";
  const defaultMessage = "Hello Shree Banarasi Sarees, I would like to know more about your collection.";
  const encodedMessage = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

  // Hide floating WhatsApp button on PDP (which has its own dedicated daylight video WhatsApp card)
  // and on checkout/payment flow to keep the screen distraction-free.
  if (
    pathname.startsWith('/product') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/payment') ||
    pathname.startsWith('/receipt')
  ) {
    return null;
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 md:bottom-6 md:right-6 z-40 bg-[#2EBE5D] hover:bg-[#25A650] text-white p-3.5 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center group no-select active:scale-95"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={24} className="fill-current" />

      {/* Hover tooltip */}
      <span className="absolute right-14 bg-[#292524] text-[#FAF7F0] text-xs px-3 py-1.5 rounded-lg shadow-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all font-serif font-medium whitespace-nowrap border border-[#B08A3C]/30">
        Chat with Saree Expert
      </span>
    </a>
  );
};
