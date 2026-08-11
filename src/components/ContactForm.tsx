"use client";

import React, { useState } from 'react';
import { Send } from 'lucide-react';

export const ContactForm: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Product Inquiries / Stock Checks');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    alert(`Thank you ${name}! Our saree expert team will contact you shortly regarding your request.`);
    setName('');
    setPhone('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-cream shadow-sm space-y-6">
      <div>
        <h3 className="font-serif text-lg sm:text-xl font-bold text-dark-brown">
          Send Us a Direct Message
        </h3>
        <p className="text-xs text-dark-brown/60 mt-1">
          Fill out the form below, and we will get back to you immediately with details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gold tracking-wider">Your Name</label>
            <input 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priyanshi Singh" 
              className="w-full text-xs sm:text-sm px-4 py-3 rounded-lg border border-cream bg-[#FFF9F0]/30 focus:outline-none focus:border-gold transition-colors text-dark-brown"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gold tracking-wider">Phone Number</label>
            <input 
              type="tel" 
              required 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210" 
              className="w-full text-xs sm:text-sm px-4 py-3 rounded-lg border border-cream bg-[#FFF9F0]/30 focus:outline-none focus:border-gold transition-colors text-dark-brown"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gold tracking-wider">Email Address</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. priyanshi@example.com" 
            className="w-full text-xs sm:text-sm px-4 py-3 rounded-lg border border-cream bg-[#FFF9F0]/30 focus:outline-none focus:border-gold transition-colors text-dark-brown"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gold tracking-wider">Subject / Area of Interest</label>
          <select 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full text-xs sm:text-sm px-4 py-3 rounded-lg border border-cream bg-[#FFF9F0]/30 focus:outline-none focus:border-gold transition-colors text-dark-brown"
          >
            <option>Product Inquiries / Stock Checks</option>
            <option>Bridal Custom Blouse Stitching</option>
            <option>Custom Saree Color Dye Requests</option>
            <option>Order Shipping / Delivery Tracking</option>
            <option>Showroom Consultation Booking</option>
            <option>Other Feedback</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gold tracking-wider">Message</label>
          <textarea 
            rows={4} 
            required 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please write your questions here in detail..." 
            className="w-full text-xs sm:text-sm px-4 py-3 rounded-lg border border-cream bg-[#FFF9F0]/30 focus:outline-none focus:border-gold transition-colors text-dark-brown resize-none"
          />
        </div>

        <button 
          type="submit" 
          className="w-full py-3.5 bg-maroon text-ivory rounded-lg font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark hover:scale-[1.01] active:scale-[0.99] transition-all shadow flex items-center justify-center gap-2"
        >
          <Send size={14} />
          SEND MESSAGE
        </button>
      </form>
    </div>
  );
};
