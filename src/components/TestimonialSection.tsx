"use client";

import React, { useState } from 'react';
import { Star, MessageSquarePlus, X } from 'lucide-react';
import { NO_IMAGE_PLACEHOLDER } from '../lib/placeholder';

interface Testimonial {
  name: string;
  rating: number;
  text: string;
  location: string;
  avatar: string;
}

const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    name: "Priyanka Mishra",
    rating: 5,
    text: "Beautiful collection of Banarasi sarees! The fabric quality is absolutely premium, and the gold zari work has an authentic shine. Very helpful staff who guided me on video call.",
    location: "Patna, Bihar",
    avatar: NO_IMAGE_PLACEHOLDER
  },
  {
    name: "Neelam Sharma",
    rating: 5,
    text: "Found the perfect pastel Chanderi silk saree for my sister's wedding reception. The custom matching blouse piece is of excellent length. Extremely satisfied!",
    location: "Samastipur, Bihar",
    avatar: NO_IMAGE_PLACEHOLDER
  },
  {
    name: "Radhika Raje",
    rating: 4,
    text: "Very affordable prices. I ordered two daily wear cotton sarees and one Lucknowi Chikankari. The georgette fabric is very soft and lightweight. Highly recommended.",
    location: "Darbhanga, Bihar",
    avatar: NO_IMAGE_PLACEHOLDER
  }
];

export const TestimonialSection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !text) {
      alert("Please enter both your name and review content.");
      return;
    }

    const newReview: Testimonial = {
      name,
      rating,
      text,
      location: location || "India",
      avatar: NO_IMAGE_PLACEHOLDER
    };

    setTestimonials([newReview, ...testimonials]);
    setIsModalOpen(false);

    // Reset Form
    setName('');
    setRating(5);
    setText('');
    setLocation('');
  };

  return (
    <section className="py-16 px-4 bg-white border-b border-cream">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <div className="text-center sm:text-left">
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide text-dark-brown">
              What Our Customers Say
            </h2>
            <p className="text-sm text-gold font-bold mt-1.5">★★★★★ 4.8/5</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2.5 px-5 bg-white border border-maroon text-maroon hover:bg-maroon hover:text-white rounded font-serif font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-sm"
          >
            <MessageSquarePlus size={15} />
            Write a Review
          </button>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((review, idx) => (
            <div 
              key={idx}
              className="bg-cream/20 p-6 rounded-lg border border-cream/50 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Rating stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i < review.rating ? "text-gold fill-gold" : "text-dark-brown/20"} 
                    />
                  ))}
                </div>
                {/* Review Text */}
                <p className="text-xs sm:text-sm text-dark-brown/80 leading-relaxed italic mb-6">
                  "{review.text}"
                </p>
              </div>

              {/* Reviewer Meta */}
              <div className="flex items-center gap-3 pt-4 border-t border-cream/40">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-10 h-10 rounded-full object-cover border border-gold/30 bg-cream"
                />
                <div>
                  <h4 className="font-serif font-bold text-dark-brown text-sm">{review.name}</h4>
                  <p className="text-[10px] text-dark-brown/50 font-medium">{review.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#2D211D]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white border border-gold/20 shadow-2xl rounded-lg max-w-md w-full p-6 z-10 relative overflow-hidden animate-scale-up">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-dark-brown/65 hover:text-maroon rounded-full"
            >
              <X size={18} />
            </button>

            <h3 className="font-serif text-lg sm:text-xl font-bold text-dark-brown text-center mb-1">
              Write a Review
            </h3>
            <p className="text-xs text-dark-brown/60 text-center mb-6">
              Share your shopping experience with other saree lovers
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star 
                        size={24} 
                        className={star <= rating ? "text-gold fill-gold" : "text-dark-brown/20"} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aditi Sen"
                  required
                  className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded p-2.5 outline-none transition-all"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                  Location (City, State)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Samastipur, Bihar"
                  className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded p-2.5 outline-none transition-all"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                  Your Review *
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder="Write details about the fabric, weaving, borders, or delivery experience..."
                  required
                  className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded p-2.5 outline-none transition-all resize-none"
                ></textarea>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-2.5 bg-maroon text-ivory rounded font-serif font-bold text-xs uppercase tracking-widest hover:bg-maroon-dark transition-colors shadow-md"
              >
                SUBMIT REVIEW
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
