"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { ProductCard } from './ProductCard';
import { PRODUCTS } from '../data/products';
import { Filter, SlidersHorizontal, X, Search, ChevronDown, BookOpen } from 'lucide-react';

interface SareesClientProps {
  initialCategory: string;
  initialOccasion: string;
  h1Title: string;
  introductoryContent: string;
}

export const SareesClient: React.FC<SareesClientProps> = ({
  initialCategory,
  initialOccasion,
  h1Title,
  introductoryContent,
}) => {
  const router = useRouter();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('All');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
    initialOccasion !== 'All' ? [initialOccasion] : []
  );
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  
  // Sort State
  const [sortBy, setSortBy] = useState<string>('Recommended');
  
  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync state if server props change (navigation)
  useEffect(() => {
    setSelectedCategory(initialCategory);
    setSelectedOccasions(initialOccasion !== 'All' ? [initialOccasion] : []);
  }, [initialCategory, initialOccasion]);

  // Categories & attributes list
  const categoriesList = ['All', 'Banarasi', 'Chikankari', 'Bandhani', 'Organza', 'Chanderi', 'Bridal', 'Offers'];
  const colorsList = ['Red', 'Pink', 'Green', 'Blue', 'Yellow', 'Black', 'White', 'Maroon', 'Purple'];
  const occasionsList = ['Wedding', 'Festive', 'Party', 'Daily Wear', 'Office', 'Gift'];
  const fabricsList = ['Silk', 'Cotton', 'Organza', 'Chanderi Silk', 'Georgette', 'Banarasi Silk'];

  // Toggle Filters
  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const handleOccasionToggle = (occ: string) => {
    setSelectedOccasions(prev => prev.includes(occ) ? prev.filter(o => o !== occ) : [...prev, occ]);
  };

  const handleFabricToggle = (fab: string) => {
    setSelectedFabrics(prev => prev.includes(fab) ? prev.filter(f => f !== fab) : [...prev, fab]);
  };

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSelectedPriceRange('All');
    setSelectedColors([]);
    setSelectedOccasions([]);
    setSelectedFabrics([]);
    setSortBy('Recommended');
    router.push('/sarees');
  };

  // Filter Logic
  let filteredProducts = PRODUCTS.filter(product => {
    // 1. Category Filter
    if (selectedCategory !== 'All' && product.category !== selectedCategory) {
      return false;
    }

    // 2. Price Filter
    const finalPrice = product.salePrice ?? product.price;
    if (selectedPriceRange !== 'All') {
      if (selectedPriceRange === 'under_1000' && finalPrice > 1000) return false;
      if (selectedPriceRange === '1000_2000' && (finalPrice < 1000 || finalPrice > 2000)) return false;
      if (selectedPriceRange === '2000_5000' && (finalPrice < 2000 || finalPrice > 5000)) return false;
      if (selectedPriceRange === '5000_plus' && finalPrice < 5000) return false;
    }

    // 3. Color Filter
    if (selectedColors.length > 0 && !selectedColors.includes(product.color)) {
      return false;
    }

    // 4. Occasion Filter
    if (selectedOccasions.length > 0 && !selectedOccasions.includes(product.occasion)) {
      return false;
    }

    // 5. Fabric Filter
    if (selectedFabrics.length > 0 && !selectedFabrics.includes(product.fabric)) {
      return false;
    }

    return true;
  });

  // Sort Logic
  filteredProducts = [...filteredProducts].sort((a, b) => {
    const aPrice = a.salePrice ?? a.price;
    const bPrice = b.salePrice ?? b.price;

    if (sortBy === 'Price Low to High') return aPrice - bPrice;
    if (sortBy === 'Price High to Low') return bPrice - aPrice;
    if (sortBy === 'Newest') return b.newArrival ? 1 : -1;
    if (sortBy === 'Best Selling') return b.bestseller ? 1 : -1;
    return 0; // Recommended
  });

  return (
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumbs */}
        <nav className="text-xs text-dark-brown/50 font-medium mb-3 flex items-center gap-1 select-none">
          <Link href="/" className="hover:text-maroon">Home</Link>
          <span>/</span>
          {selectedCategory !== 'All' ? (
            <>
              <Link href="/sarees" className="hover:text-maroon">Sarees</Link>
              <span>/</span>
              <span className="text-dark-brown font-semibold">{selectedCategory}</span>
            </>
          ) : selectedOccasions.length === 1 ? (
            <>
              <Link href="/sarees" className="hover:text-maroon">Sarees</Link>
              <span>/</span>
              <span className="text-dark-brown font-semibold">{selectedOccasions[0]}</span>
            </>
          ) : (
            <span className="text-dark-brown font-semibold">Sarees</span>
          )}
        </nav>

        {/* Category Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream pb-6 mb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-dark-brown flex items-baseline gap-2">
              {h1Title}
              <span className="text-xs font-semibold text-dark-brown/40 font-sans">
                ({filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'})
              </span>
            </h1>
          </div>

          {/* Sorting Dropdown & Mobile Filter Trigger */}
          <div className="flex items-center gap-3 justify-between md:justify-end">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden py-2 px-4 border border-cream text-dark-brown text-xs font-bold rounded flex items-center gap-2 bg-white hover:bg-cream/10 active:scale-95 transition-all"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-dark-brown/50 hidden sm:inline">SORT BY:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-cream rounded py-2 pl-4 pr-10 text-xs font-bold text-dark-brown cursor-pointer outline-none focus:border-gold"
                >
                  <option value="Recommended">Recommended</option>
                  <option value="Newest">Newest Arrivals</option>
                  <option value="Price Low to High">Price: Low to High</option>
                  <option value="Price High to Low">Price: High to Low</option>
                  <option value="Best Selling">Best Selling</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-brown/50 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* SEO Informative Introductory Content - Visible to users and search bots */}
        {introductoryContent && (
          <div className="mb-8 p-5 bg-cream/15 rounded-lg border border-cream/50 max-w-4xl">
            <div className="flex items-start gap-3">
              <BookOpen size={18} className="text-gold mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-dark-brown/80 leading-relaxed font-light">
                {introductoryContent}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-8 items-start">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0 bg-white border border-cream p-5 rounded-lg shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-cream pb-3">
              <h2 className="font-serif font-bold text-dark-brown text-base flex items-center gap-2">
                <Filter size={16} className="text-maroon" />
                Filters
              </h2>
              <button 
                onClick={resetAllFilters}
                className="text-xs text-maroon hover:underline font-bold"
              >
                Reset All
              </button>
            </div>

            {/* Filter Group: Category */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Category</h3>
              <div className="space-y-1.5">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      if (cat !== 'All') {
                        router.push(`/sarees/${cat.toLowerCase()}`);
                      } else {
                        router.push('/sarees');
                      }
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-medium transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-maroon text-ivory font-bold' 
                        : 'text-dark-brown/85 hover:bg-cream/30'
                    }`}
                  >
                    {cat === 'All' ? 'All Sarees' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Group: Price */}
            <div className="space-y-2 border-t border-cream/50 pt-4">
              <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Price</h3>
              <div className="space-y-1.5 text-xs text-dark-brown/85 font-medium">
                {[
                  { label: 'All Prices', value: 'All' },
                  { label: 'Under ₹1,000', value: 'under_1000' },
                  { label: '₹1,000 – ₹2,000', value: '1000_2000' },
                  { label: '₹2,000 – ₹5,000', value: '2000_5000' },
                  { label: '₹5,000+', value: '5000_plus' }
                ].map((range) => (
                  <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={selectedPriceRange === range.value}
                      onChange={() => setSelectedPriceRange(range.value)}
                      className="accent-maroon"
                    />
                    {range.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Color */}
            <div className="space-y-2 border-t border-cream/50 pt-4">
              <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Color</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-dark-brown/85 font-medium">
                {colorsList.map((color) => (
                  <label key={color} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(color)}
                      onChange={() => handleColorToggle(color)}
                      className="rounded text-maroon accent-maroon"
                    />
                    {color}
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Occasion */}
            <div className="space-y-2 border-t border-cream/50 pt-4">
              <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Occasion</h3>
              <div className="space-y-1.5 text-xs text-dark-brown/85 font-medium">
                {occasionsList.map((occ) => (
                  <label key={occ} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOccasions.includes(occ)}
                      onChange={() => handleOccasionToggle(occ)}
                      className="rounded text-maroon accent-maroon"
                    />
                    {occ}
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Fabric */}
            <div className="space-y-2 border-t border-cream/50 pt-4">
              <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Fabric</h3>
              <div className="space-y-1.5 text-xs text-dark-brown/85 font-medium">
                {fabricsList.map((fab) => (
                  <label key={fab} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFabrics.includes(fab)}
                      onChange={() => handleFabricToggle(fab)}
                      className="rounded text-maroon accent-maroon"
                    />
                    {fab}
                  </label>
                ))}
              </div>
            </div>

          </aside>

          {/* Product Grid Area */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center bg-white border border-cream rounded-lg shadow-sm px-4">
                <Search size={48} className="text-dark-brown/25 mb-4 animate-pulse" />
                <h3 className="font-serif text-lg sm:text-xl font-bold text-dark-brown mb-2">
                  No matching sarees found
                </h3>
                <p className="text-sm text-dark-brown/60 max-w-sm mb-6 leading-relaxed">
                  We couldn't find any sarees matching your selected filters. Try adjusting your selections or reset.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="px-6 py-2.5 bg-maroon text-ivory rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark hover:scale-105 active:scale-95 transition-all shadow"
                >
                  RESET FILTERS
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filter Slideout Menu */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div className="absolute inset-0 bg-[#2D211D]/60 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)} />
          
          <div className="absolute inset-y-0 left-0 max-w-xs w-full bg-[#FFF9F0] shadow-2xl flex flex-col z-50 animate-slide-in-left">
            <div className="px-5 py-6 bg-white border-b border-cream flex items-center justify-between">
              <span className="font-serif text-lg font-bold text-maroon">Filters</span>
              <div className="flex items-center gap-3">
                <button onClick={resetAllFilters} className="text-xs text-maroon font-bold underline">Reset</button>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 rounded-full text-dark-brown/60 hover:text-maroon hover:bg-cream/40">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Category */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Category</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsMobileFilterOpen(false);
                        if (cat !== 'All') {
                          router.push(`/sarees/${cat.toLowerCase()}`);
                        } else {
                          router.push('/sarees');
                        }
                      }}
                      className={`text-center py-2 px-1 border rounded text-xs font-medium transition-colors ${
                        selectedCategory === cat 
                          ? 'bg-maroon border-maroon text-ivory font-bold' 
                          : 'bg-white border-cream text-dark-brown/80'
                      }`}
                    >
                      {cat === 'All' ? 'All' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2 border-t border-cream/50 pt-4">
                <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Price</h3>
                <div className="space-y-2 text-xs text-dark-brown/80">
                  {[
                    { label: 'All Prices', value: 'All' },
                    { label: 'Under ₹1,000', value: 'under_1000' },
                    { label: '₹1,000 – ₹2,000', value: '1000_2000' },
                    { label: '₹2,000 – ₹5,000', value: '2000_5000' },
                    { label: '₹5,000+', value: '5000_plus' }
                  ].map((range) => (
                    <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mobilePrice"
                        checked={selectedPriceRange === range.value}
                        onChange={() => setSelectedPriceRange(range.value)}
                        className="accent-maroon"
                      />
                      {range.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2 border-t border-cream/50 pt-4">
                <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Color</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-dark-brown/80 font-medium">
                  {colorsList.map((color) => (
                    <label key={color} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color)}
                        onChange={() => handleColorToggle(color)}
                        className="accent-maroon rounded"
                      />
                      {color}
                    </label>
                  ))}
                </div>
              </div>

              {/* Occasion */}
              <div className="space-y-2 border-t border-cream/50 pt-4">
                <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Occasion</h3>
                <div className="space-y-2 text-xs text-dark-brown/85 font-medium">
                  {occasionsList.map((occ) => (
                    <label key={occ} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOccasions.includes(occ)}
                        onChange={() => handleOccasionToggle(occ)}
                        className="accent-maroon rounded"
                      />
                      {occ}
                    </label>
                  ))}
                </div>
              </div>

              {/* Fabric */}
              <div className="space-y-2 border-t border-cream/50 pt-4">
                <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Fabric</h3>
                <div className="space-y-2 text-xs text-dark-brown/85 font-medium">
                  {fabricsList.map((fab) => (
                    <label key={fab} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFabrics.includes(fab)}
                        onChange={() => handleFabricToggle(fab)}
                        className="accent-maroon rounded"
                      />
                      {fab}
                    </label>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 bg-white border-t border-cream flex gap-3">
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-2.5 bg-maroon text-ivory text-center rounded font-serif font-bold text-xs uppercase tracking-wider"
              >
                APPLY FILTERS
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};
