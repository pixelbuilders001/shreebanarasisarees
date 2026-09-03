'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '../context/StoreContext';
import { ArrowRight, Plus } from 'lucide-react';

const WEAVE_CATEGORIES = [
  { name: "Katan", image: "/fabrics/banarasi_silk.png", query: "Katan" },
  { name: "Organza", image: "/fabrics/organza_silk.png", query: "Organza" },
  { name: "Tanchui", image: "/fabrics/chanderi_silk.png", query: "Tanchui" },
  { name: "Bandhani", image: "/fabrics/bandhani_silk.png", query: "Bandhani" },
  { name: "Bridal", image: "/occasions/wedding_bridal.png", query: "Bridal" },
  { name: "Rangkaat", image: "/fabrics/chikankari_fabric.png", query: "Rangkaat" },
  { name: "Shikargarh", image: "/fabrics/pure_cotton.png", query: "Shikargarh" }
];

export const CategoryCard: React.FC = () => {
  const { categories } = useStore();

  const weaves = categories.length > 0
    ? categories.slice(0, 7).map(c => ({
        name: c.name,
        image: c.image_url || "/fabrics/banarasi_silk.png",
        query: c.name
      }))
    : WEAVE_CATEGORIES;

  return (
    <>
      {/* ── 1. MOBILE VIEW (100% PRESERVED & UNTOUCHED FOR MOBILE) ── */}
      <section className="py-4 px-4 bg-[#FAF6EE] md:hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#292524] tracking-wide">
            Shop by weave
          </h2>
          <Link
            href="/sarees"
            className="text-xs font-sans font-semibold text-[#B08A3C] hover:text-[#6B1725] flex items-center gap-1 transition-colors"
          >
            <span>All 20</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-y-4 gap-x-2">
          {weaves.map((weave, idx) => (
            <Link
              key={idx}
              href={`/sarees?fabric=${encodeURIComponent(weave.query)}`}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-[#D5CBB3] p-0.5 group-hover:border-[#6B1725] transition-colors shadow-2xs">
                <Image
                  src={weave.image}
                  alt={weave.name}
                  fill
                  className="object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-xs font-sans font-medium text-[#292524] group-hover:text-[#6B1725] transition-colors text-center truncate w-full">
                {weave.name}
              </span>
            </Link>
          ))}

          <Link
            href="/sarees"
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-1.5 border-dashed border-[#B08A3C]/70 flex items-center justify-center bg-[#FAF6EE] group-hover:bg-[#6B1725] group-hover:border-[#6B1725] transition-colors">
              <Plus size={18} className="text-[#B08A3C] group-hover:text-white transition-colors" />
            </div>
            <span className="text-xs font-sans font-medium text-[#B08A3C] group-hover:text-[#6B1725] transition-colors">
              All
            </span>
          </Link>
        </div>
      </section>

      {/* ── 2. DESKTOP VIEW (EXPANSIVE LUXURY WEAVE GRID FOR DESKTOP/LAPTOP) ── */}
      <section className="hidden md:block py-12 px-6 bg-[#FAF6EE] border-b border-[#B08A3C]/15">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block mb-1">
                HERITAGE WEAVE CATALOGUE
              </span>
              <h2 className="font-serif text-3xl lg:text-4xl font-extrabold text-[#292524] tracking-wide">
                Shop by Weave &amp; Material
              </h2>
              <p className="text-sm text-[#6B625D] font-light mt-1">
                Explore handloom sarees curated by master weaver craftsmanship across Banaras, Rajasthan, and Chanderi.
              </p>
            </div>
            <Link
              href="/sarees"
              className="py-2.5 px-5 bg-white border border-[#B08A3C]/30 hover:border-[#6B1725] text-[#6B1725] font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#6B1725] hover:text-white flex items-center gap-2 transition-all shadow-2xs group"
            >
              <span>Explore All Weaves</span>
              <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 8-Column Grid on Desktop */}
          <div className="grid grid-cols-8 gap-5 lg:gap-7">
            {weaves.map((weave, idx) => (
              <Link
                key={idx}
                href={`/sarees?fabric=${encodeURIComponent(weave.query)}`}
                className="flex flex-col items-center gap-3 group text-center cursor-pointer"
              >
                <div className="relative w-24 h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden border-2 border-[#D4B870] p-1 group-hover:border-[#6B1725] group-hover:scale-108 transition-all duration-500 shadow-md group-hover:shadow-xl bg-white">
                  <Image
                    src={weave.image}
                    alt={weave.name}
                    fill
                    sizes="120px"
                    className="object-cover rounded-full group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-serif font-bold text-[#292524] group-hover:text-[#6B1725] transition-colors leading-tight">
                    {weave.name}
                  </h3>
                  <span className="text-[10px] font-sans font-medium text-[#B08A3C] uppercase tracking-wider block">
                    Authentic
                  </span>
                </div>
              </Link>
            ))}

            {/* 8th "+ Explore All" Desktop Card */}
            <Link
              href="/sarees"
              className="flex flex-col items-center gap-3 group text-center cursor-pointer"
            >
              <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full border-2 border-dashed border-[#B08A3C] flex flex-col items-center justify-center bg-white group-hover:bg-[#6B1725] group-hover:border-[#6B1725] group-hover:scale-108 transition-all duration-500 shadow-md group-hover:shadow-xl">
                <Plus size={24} className="text-[#B08A3C] group-hover:text-white transition-colors" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-serif font-bold text-[#B08A3C] group-hover:text-[#6B1725] transition-colors leading-tight">
                  View All
                </h3>
                <span className="text-[10px] font-sans font-medium text-[#6B625D] uppercase tracking-wider block">
                  20+ Weaves
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
