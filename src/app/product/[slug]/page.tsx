"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '../../../components/Header';
import { Footer } from '../../../components/Footer';
import { PRODUCTS, Product } from '../../../data/products';
import { useStore } from '../../../context/StoreContext';
import { Heart, ShoppingBag, MessageCircle, ArrowLeft, Shield, Truck, Calendar } from 'lucide-react';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useStore();
  const [resolvedParams, setResolvedParams] = useState<{ slug: string } | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  // Unwrap params safely for different Next.js versions
  useEffect(() => {
    if (params instanceof Promise) {
      params.then(res => setResolvedParams(res));
    } else {
      setResolvedParams(params);
    }
  }, [params]);

  // Load product once params are resolved
  useEffect(() => {
    if (resolvedParams?.slug) {
      const foundProduct = PRODUCTS.find(p => p.slug === resolvedParams.slug);
      if (foundProduct) {
        setProduct(foundProduct);
        setActiveImage(foundProduct.images[0]);
      }
    }
  }, [resolvedParams]);

  if (!resolvedParams || !product) {
    return (
      <>
        <Header />
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
          <h2 className="font-serif text-2xl font-bold text-dark-brown mb-2">Product Not Found</h2>
          <p className="text-sm text-dark-brown/60 mb-6">The saree collection you are looking for does not exist or has been moved.</p>
          <Link href="/sarees" className="px-6 py-2.5 bg-maroon text-ivory rounded font-serif font-bold text-xs tracking-wider uppercase">
            BACK TO CATALOG
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const finalPrice = product.salePrice ?? product.price;

  // WhatsApp Message Generator
  const handleWhatsAppInquiry = () => {
    const whatsappNumber = "+919000000000";
    const textMessage = `Hello SHREE Banarasi Sarees, I am interested in:

Product: ${product.name}
Price: ₹${finalPrice.toLocaleString('en-IN')}
Product ID: ${product.sku}

Please share more details.`;
    
    const encodedMessage = encodeURIComponent(textMessage);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const handleAddToCart = () => {
    if (product.stock > 0) {
      addToCart(product, quantity);
    }
  };

  const handleBuyNow = () => {
    if (product.stock > 0) {
      addToCart(product, quantity);
      router.push('/checkout');
    }
  };

  return (
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumbs & Back */}
        <div className="mb-6 flex items-center justify-between">
          <nav className="text-xs text-dark-brown/50 font-medium flex items-center gap-1">
            <Link href="/" className="hover:text-maroon">Home</Link>
            <span>/</span>
            <Link href="/sarees" className="hover:text-maroon">Sarees</Link>
            <span>/</span>
            <span className="text-dark-brown truncate max-w-[150px] sm:max-w-xs">{product.name}</span>
          </nav>
          
          <Link href="/sarees" className="text-xs font-bold text-maroon flex items-center gap-1 hover:underline">
            <ArrowLeft size={14} />
            Back to Collection
          </Link>
        </div>

        {/* Product Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Side: Product Image Gallery */}
          <div className="md:col-span-6 space-y-4">
            
            {/* Main Stage Image */}
            <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-cream/15 border border-cream shadow-sm relative group">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Thumbnail Selectors */}
            {product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-20 aspect-[3/4] rounded overflow-hidden border-2 bg-cream/25 flex-shrink-0 transition-all ${
                      activeImage === img ? 'border-maroon scale-95 shadow-sm' : 'border-cream hover:border-maroon/40'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* Right Side: Product Details info */}
          <div className="md:col-span-6 space-y-6">
            
            <div>
              {/* Category tag */}
              <span className="text-[10px] sm:text-xs font-bold text-gold tracking-widest uppercase border-b border-gold/40 pb-0.5 inline-block font-serif mb-2">
                {product.category} Collection
              </span>

              {/* Saree Title */}
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-dark-brown tracking-wide leading-tight">
                {product.name}
              </h1>
              
              {/* Product SKU */}
              <p className="text-[10px] text-dark-brown/40 font-semibold tracking-wide uppercase mt-1">
                SKU: {product.sku}
              </p>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-1.5 mt-3 text-xs font-bold text-dark-brown/70">
                <div className="flex items-center text-gold">
                  {"★".repeat(Math.round(product.rating))}
                  {"☆".repeat(5 - Math.round(product.rating))}
                </div>
                <span>{product.rating}</span>
                <span className="text-dark-brown/40 font-normal">({product.reviewsCount} verified reviews)</span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-cream/25 p-4 rounded border border-cream/55">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-2xl sm:text-3xl font-extrabold text-maroon">
                  ₹{finalPrice.toLocaleString('en-IN')}
                </span>
                {product.salePrice && (
                  <span className="text-sm sm:text-base text-dark-brown/40 line-through">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                )}
                {product.salePrice && (
                  <span className="bg-gold text-dark-brown text-[10px] font-bold px-2 py-0.5 rounded-sm">
                    Save ₹{(product.price - product.salePrice).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-dark-brown/50 mt-1 font-semibold">
                * MRP inclusive of all taxes. Free Shipping across India.
              </p>
            </div>

            {/* Stock Availability */}
            <div className="flex items-center gap-2">
              {product.stock === 0 ? (
                <span className="text-xs font-bold text-red-700 bg-red-50 py-1 px-3 rounded-full border border-red-100">
                  Out of Stock
                </span>
              ) : product.stock <= 2 ? (
                <span className="text-xs font-bold text-orange-600 bg-orange-50 py-1 px-3 rounded-full border border-orange-100 animate-pulse">
                  ✓ Only {product.stock} left in stock - Order Soon!
                </span>
              ) : (
                <span className="text-xs font-bold text-green-800 bg-green-50 py-1 px-3 rounded-full border border-green-100">
                  ✓ In Stock (Ready to dispatch)
                </span>
              )}
            </div>

            {/* Product description */}
            <p className="text-xs sm:text-sm text-dark-brown/85 leading-relaxed font-light">
              {product.description}
            </p>

            {/* Product Attributes Table */}
            <div className="border border-cream rounded-lg overflow-hidden text-xs sm:text-sm bg-white">
              <div className="grid grid-cols-2 border-b border-cream py-2.5 px-4 bg-cream/15 font-semibold text-dark-brown/85">
                <span>Fabric / Material</span>
                <span className="font-serif text-maroon font-bold">{product.fabric}</span>
              </div>
              <div className="grid grid-cols-2 border-b border-cream py-2.5 px-4">
                <span className="font-medium text-dark-brown/60">Color Tone</span>
                <span className="font-semibold text-dark-brown">{product.color}</span>
              </div>
              <div className="grid grid-cols-2 border-b border-cream py-2.5 px-4 bg-cream/15">
                <span className="font-medium text-dark-brown/60">Saree Length</span>
                <span className="font-semibold text-dark-brown">{product.length}</span>
              </div>
              <div className="grid grid-cols-2 border-b border-cream py-2.5 px-4">
                <span className="font-medium text-dark-brown/60">Blouse Piece</span>
                <span className="font-semibold text-dark-brown">{product.blousePiece}</span>
              </div>
              <div className="grid grid-cols-2 border-b border-cream py-2.5 px-4 bg-cream/15">
                <span className="font-medium text-dark-brown/60">Embroidery & Work</span>
                <span className="font-semibold text-dark-brown">{product.work}</span>
              </div>
              <div className="grid grid-cols-2 border-b border-cream py-2.5 px-4">
                <span className="font-medium text-dark-brown/60">Occasion Match</span>
                <span className="font-semibold text-dark-brown">{product.occasion}</span>
              </div>
              <div className="grid grid-cols-2 py-2.5 px-4 bg-cream/15">
                <span className="font-medium text-dark-brown/60">Care Instructions</span>
                <span className="font-semibold text-dark-brown italic text-maroon">{product.care}</span>
              </div>
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-dark-brown/60 uppercase tracking-wider">Quantity:</span>
                <div className="flex items-center border border-cream rounded bg-white">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-2 text-dark-brown/60 hover:text-maroon hover:bg-cream/20"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-4 text-sm font-semibold text-dark-brown min-w-[30px] text-center">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    className="p-2 text-dark-brown/60 hover:text-maroon hover:bg-cream/20"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Actions CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 py-3 px-6 rounded font-serif font-bold text-xs sm:text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${
                  product.stock === 0
                    ? 'bg-dark-brown/10 text-dark-brown/30 cursor-not-allowed border border-dark-brown/10'
                    : 'bg-white border border-maroon text-maroon hover:bg-cream/20 hover:scale-[1.01] active:scale-[0.99] shadow-sm'
                }`}
              >
                <ShoppingBag size={16} />
                ADD TO CART
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className={`flex-1 py-3 px-6 rounded font-serif font-bold text-xs sm:text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${
                  product.stock === 0
                    ? 'bg-dark-brown/20 text-dark-brown/40 cursor-not-allowed'
                    : 'bg-maroon text-ivory hover:bg-maroon-dark hover:scale-[1.01] active:scale-[0.99] shadow-md border border-maroon'
                }`}
              >
                BUY NOW
              </button>
            </div>

            {/* Wishlist Toggle Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className={`w-full py-2.5 rounded font-serif font-bold text-xs tracking-wider uppercase border flex items-center justify-center gap-2 transition-colors ${
                isWishlisted
                  ? 'bg-maroon/5 border-maroon text-maroon hover:bg-maroon/10'
                  : 'bg-white border-cream text-dark-brown/85 hover:border-maroon/40 hover:text-maroon'
              }`}
            >
              <Heart size={14} className={isWishlisted ? 'fill-maroon text-maroon' : ''} />
              {isWishlisted ? 'WISHLISTED' : 'ADD TO WISHLIST'}
            </button>

            {/* WhatsApp Ordering (conversion channel) */}
            <div className="pt-4 border-t border-cream/70 flex flex-col items-center sm:items-start gap-3">
              <span className="text-xs text-dark-brown/50 font-bold uppercase tracking-wider">
                Need help choosing or prefer ordering on WhatsApp?
              </span>
              <button
                onClick={handleWhatsAppInquiry}
                className="w-full sm:w-auto py-2.5 px-6 bg-[#25D366] text-white rounded font-serif font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-[#20ba5a] transition-all shadow"
              >
                <MessageCircle size={16} className="fill-current" />
                Order on WhatsApp
              </button>
            </div>

            {/* Shipping, Returns & Fabric trust signals */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-dark-brown/60 pt-4 border-t border-cream/60 font-semibold">
              <div className="flex flex-col items-center gap-1">
                <Shield size={16} className="text-gold" />
                <span>100% Handloom Trust</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Truck size={16} className="text-gold" />
                <span>Free Safe Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Calendar size={16} className="text-gold" />
                <span>7-Day Easy Return</span>
              </div>
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </>
  );
}
