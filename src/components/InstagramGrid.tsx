"use client";

import React from 'react';

const INSTA_POSTS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400",
    likes: "2.4k"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400",
    likes: "1.8k"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=400",
    likes: "3.1k"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=400",
    likes: "1.2k"
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400",
    likes: "4.5k"
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&q=80&w=400",
    likes: "2.2k"
  }
];

export const InstagramGrid: React.FC = () => {
  return (
    <section className="py-16 px-4 max-w-7xl mx-auto border-b border-cream">
      <div className="text-center mb-10">
        <h2 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide text-dark-brown">
          Follow Our Saree Stories
        </h2>
        <div className="w-16 h-0.5 bg-maroon mx-auto mt-3 mb-4"></div>
        <p className="text-sm text-dark-brown/65 max-w-md mx-auto leading-relaxed">
          Daily draping inspiration, behind-the-scenes loom stories, and sneak peeks at upcoming launches.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-10">
        {INSTA_POSTS.map((post) => (
          <a
            key={post.id}
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square rounded-2xl overflow-hidden bg-dark-brown shadow-sm"
          >
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-[#2D211D]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col items-center justify-center text-white text-xs font-semibold gap-1">
              <svg className="w-5 h-5 fill-none stroke-current text-gold" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/></svg>
              <span>{post.likes} Likes</span>
            </div>
            
            <img
              src={post.image}
              alt={`Instagram post ${post.id}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          </a>
        ))}
      </div>

      {/* CTA Button */}
      <div className="text-center">
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex py-3 px-8 bg-gold hover:bg-gold-light text-dark-brown rounded-md font-serif font-bold text-xs sm:text-sm tracking-widest uppercase hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md items-center gap-2 border border-gold"
        >
          <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/></svg>
          FOLLOW ON INSTAGRAM →
        </a>
      </div>
    </section>
  );
};
