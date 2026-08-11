"use client";

import React from 'react';
import { MessageCircle } from 'lucide-react';

export const WhatsAppButton: React.FC = () => {
  const whatsappNumber = "+916203909946";
  const defaultMessage = "Hello Shree Banarasi Sarees, I would like to know more about your collection.";
  const encodedMessage = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-6 md:bottom-6 md:right-6 z-40 bg-[#25D366] text-white p-3.5 rounded-full shadow-xl hover:bg-[#20ba5a] transition-all hover:scale-110 flex items-center justify-center group"
      aria-label="Chat on WhatsApp"
    >
      {/* Ripple animation */}
      <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75 animate-ping -z-10 group-hover:hidden"></span>
      <MessageCircle size={26} className="fill-current" />

      {/* Hover tooltip */}
      <span className="absolute right-14 bg-dark-brown text-ivory text-xs px-3 py-1.5 rounded shadow-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all font-medium whitespace-nowrap border border-gold/20">
        Chat with Saree Expert
      </span>
    </a>
  );
};
