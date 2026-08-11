"use client";

import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Send, CheckCircle, X } from 'lucide-react';

export const CustomSareeRequest: React.FC = () => {
  const { addCustomRequest } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    sareeType: 'Banarasi',
    color: '',
    fabric: '',
    budget: 'Under ₹2,000',
    occasion: '',
    requirements: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.whatsapp) {
      alert("Please fill in Name, Phone, and WhatsApp number.");
      return;
    }
    
    // Add custom request to context
    addCustomRequest({
      name: formData.name,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      sareeType: formData.sareeType,
      color: formData.color || 'Any',
      fabric: formData.fabric || 'Any',
      budget: formData.budget,
      occasion: formData.occasion || 'General',
      requirements: formData.requirements || 'None'
    });

    setIsSubmitted(true);

    // Reset form after submission
    setFormData({
      name: '',
      phone: '',
      whatsapp: '',
      sareeType: 'Banarasi',
      color: '',
      fabric: '',
      budget: 'Under ₹2,000',
      occasion: '',
      requirements: ''
    });
  };

  return (
    <section id="custom-saree" className="bg-[#5C0612] text-ivory py-20 px-4 border-t border-b border-gold/30">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        
        {/* Subtitle Decorator */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-8 h-px bg-gold/50"></div>
          <span className="text-xs text-gold uppercase tracking-[0.2em] font-bold">
            WEAVER EXPRESS
          </span>
          <div className="w-8 h-px bg-gold/50"></div>
        </div>

        {/* Heading */}
        <h2 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-wide">
          Can't Find Your Perfect Saree?
        </h2>

        {/* Subtext */}
        <p className="text-sm sm:text-base text-ivory/80 max-w-xl mx-auto font-light">
          Tell us what you want, we'll help you to customize it.
        </p>

        {/* Capsules / Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto pt-2">
          {['STRETCH SILK', 'FABRIC', 'SHAPE', 'MORE SIZE', 'CHOOSE', 'CUSTOM'].map((item) => (
            <span 
              key={item} 
              className="px-3.5 py-1.5 rounded-full border border-gold/20 bg-[#6E1725]/40 text-[10px] sm:text-xs font-bold text-gold uppercase tracking-wider"
            >
              {item}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <button
            onClick={() => {
              setIsSubmitted(false);
              setIsModalOpen(true);
            }}
            className="px-8 py-3.5 bg-gold hover:bg-gold-light text-dark-brown rounded-md font-serif font-bold text-xs sm:text-sm tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg border border-gold"
          >
            REQUEST CUSTOM SAREE →
          </button>
        </div>

        {/* Detailed Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-[#2D211D]/60 backdrop-blur-sm" 
              onClick={() => setIsModalOpen(false)} 
            />
            
            <div className="bg-[#FFF9F0] border border-gold/20 shadow-2xl rounded-xl max-w-2xl w-full p-6 sm:p-8 z-10 relative overflow-hidden text-dark-brown max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1 text-dark-brown/65 hover:text-maroon rounded-full"
              >
                <X size={18} />
              </button>

              {isSubmitted ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <CheckCircle size={56} className="text-green-600 mb-4 animate-bounce" />
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-dark-brown mb-2">
                    Request Submitted!
                  </h3>
                  <p className="text-sm text-dark-brown/70 max-w-sm mb-6 leading-relaxed">
                    Thank you! Our master weaver will review your requirements and connect with you on WhatsApp shortly.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 bg-maroon text-ivory rounded font-semibold text-xs tracking-wider uppercase hover:bg-maroon-dark transition-all shadow"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-dark-brown">
                      Bespoke Saree Request
                    </h3>
                    <p className="text-xs text-dark-brown/60 mt-1">
                      Our artisans will customize a saree to match your exact dream specifications.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Row 1: Name & Contact Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Full name"
                          required
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded p-2.5 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="10-digit mobile"
                          required
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded p-2.5 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1">
                          WhatsApp *
                        </label>
                        <input
                          type="tel"
                          name="whatsapp"
                          value={formData.whatsapp}
                          onChange={handleChange}
                          placeholder="WhatsApp number"
                          required
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded p-2.5 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Row 2: Saree Type, Color, Fabric */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1">
                          Saree Type
                        </label>
                        <select
                          name="sareeType"
                          value={formData.sareeType}
                          onChange={handleChange}
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded p-2.5 outline-none cursor-pointer"
                        >
                          <option value="Banarasi">Banarasi Saree</option>
                          <option value="Chikankari">Chikankari Saree</option>
                          <option value="Bandhani">Bandhani Saree</option>
                          <option value="Organza">Organza Saree</option>
                          <option value="Chanderi">Chanderi Silk</option>
                          <option value="Georgette">Georgette Saree</option>
                          <option value="Bridal">Bridal / Wedding</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1">
                          Color Idea
                        </label>
                        <input
                          type="text"
                          name="color"
                          value={formData.color}
                          onChange={handleChange}
                          placeholder="e.g. Royal Red, Wine"
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded p-2.5 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1">
                          Fabric Preference
                        </label>
                        <input
                          type="text"
                          name="fabric"
                          value={formData.fabric}
                          onChange={handleChange}
                          placeholder="e.g. Katan Silk, Organza"
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded p-2.5 outline-none"
                        />
                      </div>
                    </div>

                    {/* Row 3: Budget & Occasion */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1">
                          Budget Range
                        </label>
                        <select
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded p-2.5 outline-none cursor-pointer"
                        >
                          <option value="Under ₹2,000">Under ₹2,000</option>
                          <option value="₹2,000 – ₹5,000">₹2,000 – ₹5,000</option>
                          <option value="₹5,000 – ₹10,000">₹5,000 – ₹10,000</option>
                          <option value="Premium (₹10,000+)">Premium (₹10,000+)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1">
                          Occasion
                        </label>
                        <input
                          type="text"
                          name="occasion"
                          value={formData.occasion}
                          onChange={handleChange}
                          placeholder="e.g. Wedding Reception, Diwali"
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded p-2.5 outline-none"
                        />
                      </div>
                    </div>

                    {/* Requirements */}
                    <div>
                      <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1">
                        Weaving & Design Requirements
                      </label>
                      <textarea
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Describe border detailing, buttis, pallu patterns, or custom length options..."
                        className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded p-2.5 outline-none resize-none"
                      />
                    </div>

                    {/* Submit CTA */}
                    <button
                      type="submit"
                      className="w-full py-3 bg-maroon text-ivory rounded font-serif font-bold text-xs sm:text-sm tracking-widest uppercase hover:bg-maroon-dark hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Send size={14} />
                      SUBMIT REQUEST TO WEAVER
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
