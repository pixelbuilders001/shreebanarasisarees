"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  desktopImage: string;
  ctaLink: string;
}

const SLIDES: Slide[] = [
  {
    desktopImage: "/hero_desktop_soon2.png",
    ctaLink: "/about-us"
  },
  {
    desktopImage: "/banner2.png",
    ctaLink: "/sarees?category=Banarasi"
  },
  {
    desktopImage: "/sawan.png",
    ctaLink: "/sarees?category=Organza"
  },
  {
    desktopImage: "/wedding.png",
    ctaLink: "/sarees?category=Bridal"
  },
  {
    desktopImage: "/hero_desktop_3.png",
    ctaLink: "/sarees?category=Organza"
  }
];

export const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  return (
    <div className="w-full px-3.5 pt-3.5 pb-1 md:px-0 md:py-0">
      <div className="relative w-full aspect-[16/9] md:aspect-[7/3] rounded-2xl md:rounded-none overflow-hidden bg-dark-brown shadow-md md:shadow-none">
        {/* Slides */}
        {SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
          >
            <Link href={slide.ctaLink} className="block w-full h-full animate-fade-in">
              <img
                src={slide.desktopImage}
                alt={`Hero banner ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </Link>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-dark-brown/40 text-white hover:bg-maroon hover:text-white transition-all shadow-md"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-dark-brown/40 text-white hover:bg-maroon hover:text-white transition-all shadow-md"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentSlide ? 'bg-gold w-6' : 'bg-white/50'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
