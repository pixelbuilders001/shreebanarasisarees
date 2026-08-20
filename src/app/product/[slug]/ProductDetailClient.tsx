"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '../../../components/Header';
import { Footer } from '../../../components/Footer';
import { Product } from '../../../data/products';
import { useStore } from '../../../context/StoreContext';
import { 
  Heart, 
  ShoppingBag, 
  MessageCircle, 
  ArrowLeft, 
  Shield, 
  Truck, 
  Calendar, 
  MapPin, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Share2,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  Check
} from 'lucide-react';
import { checkDeliveryServiceability, supabase } from '../../../data/supabase';
import { YouMayAlsoLike } from '../../../components/YouMayAlsoLike';
import { RecentlyViewed } from '../../../components/RecentlyViewed';
import { useRecentlyViewed } from '../../../utils/useRecentlyViewed';
import { trackViewItem } from '../../../lib/gtag';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { 
    addToCart, 
    toggleWishlist, 
    isInWishlist,
    deliveryInfo,
    setDeliveryInfo,
    customerCoords,
    setCustomerCoords,
    checkedPincode,
    setCheckedPincode,
    cart,
    setIsCartOpen,
    user,
    setIsAuthModalOpen,
    showToast
  } = useStore();
  
  const [activeImage, setActiveImage] = useState<string>(product.images[0]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincodeInput, setPincodeInput] = useState(checkedPincode);
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Loading/success states for actions
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  
  // Accordion tabs state
  const [activeTab, setActiveTab] = useState<string | null>('about');

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Reviews states
  const [reviews, setReviews] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Review form states
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formText, setFormText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const isWishlisted = isInWishlist(product.id);
  const finalPrice = product.salePrice ?? product.price;

  // Recently viewed tracking
  const { viewedIds, recordView } = useRecentlyViewed();

  // Record this product view on mount & trigger GA4 view_item
  useEffect(() => {
    recordView(product.id);
    trackViewItem(product);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // React to store context pincode changes
  React.useEffect(() => {
    setPincodeInput(checkedPincode);
  }, [checkedPincode]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('product_reviews')
        .select('*, orders(customer_name)')
        .eq('product_id', product.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        return;
      }

      if (reviewsData) {
        setReviews(reviewsData);

        const userIds = reviewsData.map((r: any) => r.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          if (!profilesError && profilesData) {
            const map: Record<string, string> = {};
            profilesData.forEach((p: any) => {
              map[p.id] = p.full_name;
            });
            setProfilesMap(map);
          }
        }
      }
    } catch (err) {
      console.error('Exception fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [product.id]);

  const dynamicTotalReviews = reviews.length;
  const dynamicAverageRating = dynamicTotalReviews > 0
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / dynamicTotalReviews).toFixed(1))
    : 0;

  const getStarPercentage = (starRating: number) => {
    const count = reviews.filter(r => Math.round(r.rating) === starRating).length;
    return dynamicTotalReviews > 0 ? Math.round((count / dynamicTotalReviews) * 100) : 0;
  };

  const handleWriteReviewClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      showToast("Please log in to write a review.");
      return;
    }
    setFormRating(0);
    setFormTitle('');
    setFormText('');
    setFormError(null);
    setFormSuccess(null);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formRating < 1 || formRating > 5) {
      setFormError("Please select a rating between 1 and 5 stars.");
      return;
    }
    if (!formTitle.trim()) {
      setFormError("Please enter a review title.");
      return;
    }
    if (!formText.trim()) {
      setFormError("Please write your review details.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzqlsawxvvyvsstyzzff.supabase.co'}/functions/v1/verify-review`, {
        method: 'POST',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6chwvgIpbfCpeEZrkS9VYg_IO__zSpY',
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: product.id,
          rating: formRating,
          title: formTitle.trim(),
          review_text: formText.trim()
        })
      });

      const resData = await response.json().catch(() => ({}));

      if (response.status === 201) {
        setFormSuccess("Thank you! Your review has been submitted successfully and is pending approval.");
        setFormRating(0);
        setFormTitle('');
        setFormText('');
        fetchReviews();
        setTimeout(() => {
          setIsReviewModalOpen(false);
          setFormSuccess(null);
        }, 3000);
      } else {
        if (response.status === 401) {
          setFormError("Please log in to submit a review.");
        } else if (response.status === 403) {
          setFormError("Only verified purchasers can review this product.");
        } else if (response.status === 409) {
          setFormError("You have already reviewed this product.");
        } else {
          setFormError(resData.message || resData.error || "An error occurred while submitting your review.");
        }
      }
    } catch (err: any) {
      console.error('Submit review error:', err);
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-IN', options);
    } catch (e) {
      return dateString;
    }
  };

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pincodeInput.length !== 6 || !/^\d+$/.test(pincodeInput)) {
      setLocError("Please enter a valid 6-digit PIN code.");
      return;
    }

    setLocError(null);
    setLoadingPincode(true);
    try {
      const res = await checkDeliveryServiceability({ pincode: pincodeInput });
      setDeliveryInfo(res);
      setCheckedPincode(pincodeInput);
      setCustomerCoords(null);
      if (!res.success || !res.serviceable) {
        setLocError("Delivery is not available at this location.");
      }
    } catch (err) {
      console.error(err);
      setLocError("Error checking delivery. Please try again.");
    } finally {
      setLoadingPincode(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      return;
    }

    setLocError(null);
    setLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await checkDeliveryServiceability({ latitude, longitude });
          setDeliveryInfo(res);
          setCustomerCoords({ latitude, longitude });
          setCheckedPincode('');
          setPincodeInput('');
          if (!res.success || !res.serviceable) {
            setLocError("Delivery is not available at this location.");
          }
        } catch (err) {
          console.error(err);
          setLocError("Error checking location. Please try again.");
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        setLoadingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocError("Location permission denied. Please enter your PIN code manually.");
        } else {
          setLocError("Unable to retrieve location. Please enter PIN code manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // WhatsApp Message Generator
  const handleWhatsAppInquiry = () => {
    const whatsappNumber = "+9191620390946"; // Verified store phone number
    const textMessage = `Hello Shree Banarasi Sarees, I am interested in:

Product: ${product.name}
Price: ₹${finalPrice.toLocaleString('en-IN')}
Product ID: ${product.sku}

Please share more details.`;

    const encodedMessage = encodeURIComponent(textMessage);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const isAlreadyInCart = cart.some(item => item.product.id === product.id);

  const handleAddToCart = async () => {
    if (product.stock > 0) {
      if (isAlreadyInCart) {
        setIsCartOpen(true);
      } else {
        setIsAddingToCart(true);
        // Soft animation transition delay for premium feeling
        await new Promise(resolve => setTimeout(resolve, 600));
        addToCart(product, quantity);
        setIsAddingToCart(false);
      }
    }
  };

  const handleBuyNow = async () => {
    if (product.stock > 0) {
      setIsBuyingNow(true);
      await new Promise(resolve => setTimeout(resolve, 450));
      if (!isAlreadyInCart) {
        addToCart(product, quantity);
      }
      setIsBuyingNow(false);
      setIsCartOpen(true);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    const index = Math.round(scrollLeft / width);
    setActiveImageIndex(index);
    setActiveImage(product.images[index]);
  };

  const handleThumbnailClick = (img: string, idx: number) => {
    setActiveImage(img);
    setActiveImageIndex(idx);
    if (carouselRef.current) {
      const width = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: width * idx,
        behavior: 'smooth'
      });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${product.name} | Shree Banarasi Sarees`,
      text: `Check out this beautiful ${product.fabric} saree in ${product.color}: ${product.name}. Direct from authentic weavers!`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showToast("Product link copied to clipboard!");
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12">

        {/* Breadcrumbs & Back Navigation */}
        <div className="mb-6 flex items-center justify-between text-xs font-sans">
          <nav className="text-dark-brown/50 font-medium flex items-center gap-1.5">
            <Link href="/" className="hover:text-maroon transition-colors">Home</Link>
            <span className="text-dark-brown/20">/</span>
            <Link href="/sarees" className="hover:text-maroon transition-colors">Sarees</Link>
            <span className="text-dark-brown/20">/</span>
            <Link href={`/sarees/${product.category.toLowerCase()}`} className="hover:text-maroon transition-colors">
              {product.category}
            </Link>
            <span className="text-dark-brown/20">/</span>
            <span className="text-dark-brown/85 font-semibold truncate max-w-[120px] sm:max-w-xs">{product.name}</span>
          </nav>

          <Link href="/sarees" className="font-bold text-maroon flex items-center gap-1 hover:underline transition-all">
            <ArrowLeft size={14} />
            Back to Collection
          </Link>
        </div>

        {/* Product Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-start">

          {/* Left Column: Product Image Gallery */}
          <div className="md:col-span-6 space-y-4 relative">
            
            {/* Desktop main image viewer with lightbox trigger & hover zoom */}
            <div 
              onClick={() => setIsLightboxOpen(true)}
              className="hidden md:block relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-cream/10 border border-cream/50 shadow-sm cursor-zoom-in group"
            >
              <img
                src={activeImage}
                alt={`${product.name} - ${product.fabric} Saree in ${product.color}`}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute bottom-4 right-4 bg-dark-brown/65 backdrop-blur-sm text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ZoomIn size={16} />
              </div>
            </div>

            {/* Mobile swipeable image carousel with 1/n indicator */}
            <div className="md:hidden relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-cream/10 border border-cream/40 shadow-sm">
              <div
                ref={carouselRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-none"
              >
                {product.images.map((img, idx) => (
                  <div key={idx} className="w-full h-full flex-shrink-0 snap-center" onClick={() => setIsLightboxOpen(true)}>
                    <img
                      src={img}
                      alt={`${product.name} - View ${idx + 1}`}
                      className="w-full h-full object-cover object-center"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  </div>
                ))}
              </div>
              
              {/* Indicator (e.g. 1/4) */}
              <div className="absolute top-4 right-4 bg-dark-brown/65 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider font-serif">
                {activeImageIndex + 1} / {product.images.length}
              </div>
            </div>

            {/* Thumbnails below image */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleThumbnailClick(img, idx)}
                    className={`w-16 sm:w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 bg-cream/25 flex-shrink-0 transition-all ${
                      activeImage === img 
                        ? 'border-maroon scale-95 shadow-sm' 
                        : 'border-cream/80 hover:border-maroon/40'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} Thumbnail ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                      loading="lazy" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Information & Purchase Section */}
          <div className="md:col-span-6 space-y-6">
            
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-gold tracking-widest uppercase border-b border-gold/30 pb-0.5 inline-block font-serif">
                  {product.category} Collection
                </span>
                
                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="p-2 text-dark-brown/50 hover:text-maroon hover:bg-cream/40 rounded-full transition-all cursor-pointer flex items-center justify-center border border-cream/50 bg-white/60 shadow-sm"
                  title="Share product with friends"
                >
                  <Share2 size={16} />
                </button>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-dark-brown tracking-wide leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center justify-between text-[10px] text-dark-brown/40 font-bold uppercase tracking-wider">
                <span>SKU: {product.sku}</span>
                {product.stock > 0 ? (
                  product.stock <= 2 ? (
                    <span className="text-orange-600 animate-pulse font-extrabold">Only {product.stock} items left!</span>
                  ) : (
                    <span className="text-green-700 font-extrabold">In Stock</span>
                  )
                ) : (
                  <span className="text-red-600 font-extrabold">Out of Stock</span>
                )}
              </div>

              {/* Rating Summary Link to reviews */}
              <div className="flex items-center gap-2 text-xs font-bold text-dark-brown/70 py-1 border-b border-cream/30">
                <div className="flex items-center text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>
                      {i < Math.round(dynamicAverageRating) ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                <span>{dynamicAverageRating > 0 ? dynamicAverageRating : "No rating"}</span>
                <span className="text-dark-brown/30">&bull;</span>
                <a href="#reviews" className="text-dark-brown/50 font-medium hover:underline">
                  ({dynamicTotalReviews} {dynamicTotalReviews === 1 ? 'Review' : 'Reviews'})
                </a>
                <span className="text-dark-brown/30">&bull;</span>
                <button 
                  onClick={handleWriteReviewClick}
                  className="text-maroon hover:underline font-bold transition-all"
                >
                  Write Review
                </button>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-[#FFF9F0] p-5 rounded-2xl border border-[#C9A45C]/25 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-3xl font-extrabold text-maroon">
                  ₹{finalPrice.toLocaleString('en-IN')}
                </span>
                {product.salePrice && (
                  <span className="text-base text-dark-brown/45 line-through font-medium">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                )}
                {product.salePrice && (
                  <span className="bg-gold/15 border border-[#C9A45C]/30 text-[#801F32] text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                    SAVE ₹{(product.price - product.salePrice).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-dark-brown/40 font-medium pt-1">
                * Price includes GST. Handloom authenticity certified. Free express courier delivery inside India.
              </p>
            </div>

            {/* Product short intro */}
            <p className="text-xs sm:text-sm text-dark-brown/75 leading-relaxed font-light font-sans">
              Experience the unmatched luxury of authentic hand-woven Banarasi craftsmanship. Made with premium grade {product.fabric} threads, detailed with intricate borders.
            </p>

            {/* Purchase CTA buttons */}
            <div className="space-y-3 pt-2">
              {product.stock > 0 ? (
                <>
                  <div className="flex gap-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-cream/70 rounded-xl bg-white overflow-hidden">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="px-3 py-2 text-dark-brown/50 hover:text-maroon hover:bg-cream/10 font-bold transition-all"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-3 text-sm font-semibold text-dark-brown min-w-[32px] text-center font-serif">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                        className="px-3 py-2 text-dark-brown/50 hover:text-maroon hover:bg-cream/10 font-bold transition-all"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Cart CTA */}
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className="flex-1 py-3 px-6 rounded-xl font-serif font-extrabold text-xs tracking-widest uppercase flex items-center justify-center gap-2 border border-maroon text-maroon hover:bg-cream/15 active:scale-[0.99] transition-all disabled:opacity-70 shadow-sm cursor-pointer"
                    >
                      {isAddingToCart ? (
                        <div className="w-4 h-4 border-2 border-maroon border-t-transparent rounded-full animate-spin" />
                      ) : isAlreadyInCart ? (
                        <Check size={16} />
                      ) : (
                        <ShoppingBag size={15} />
                      )}
                      {isAddingToCart ? 'ADDING...' : isAlreadyInCart ? 'GO TO BAG' : 'ADD TO BAG'}
                    </button>
                  </div>

                  {/* Buy Now CTA */}
                  <button
                    onClick={handleBuyNow}
                    disabled={isBuyingNow}
                    className="w-full py-3.5 px-6 rounded-xl font-serif font-extrabold text-xs tracking-widest uppercase flex items-center justify-center gap-2 bg-maroon text-white hover:bg-maroon-dark active:scale-[0.99] transition-all disabled:opacity-75 shadow-md cursor-pointer border border-maroon"
                  >
                    {isBuyingNow ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'BUY NOW'
                    )}
                  </button>
                </>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 bg-dark-brown/10 text-dark-brown/30 rounded-xl font-serif font-extrabold text-xs tracking-widest uppercase cursor-not-allowed border border-dark-brown/10"
                >
                  SOLD OUT
                </button>
              )}

              {/* Wishlist Trigger */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`w-full py-2.5 rounded-xl font-serif font-extrabold text-xs tracking-wider uppercase border flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer ${
                  isWishlisted
                    ? 'bg-maroon/5 border-maroon text-maroon shadow-sm'
                    : 'bg-white border-cream text-dark-brown/85 hover:border-maroon/40 hover:text-maroon'
                }`}
              >
                <Heart size={14} className={isWishlisted ? 'fill-maroon text-maroon animate-pulse' : ''} />
                {isWishlisted ? 'WISHLISTED' : 'ADD TO WISHLIST'}
              </button>
            </div>

            {/* Delivery Serviceability Check (Moved under CTA) */}
            <div className="p-4 bg-cream/10 rounded-2xl border border-[#C9A45C]/20 text-dark-brown space-y-3 mt-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-dark-brown/85 font-serif">
                <MapPin size={15} className="text-maroon animate-bounce" />
                <span>Verify Delivery Availability</span>
              </div>
              
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit PIN code"
                  className="flex-1 bg-white border border-[#C9A45C]/35 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded-xl px-3.5 py-2.5 outline-none transition-all font-sans"
                />
                <button
                  type="submit"
                  disabled={loadingPincode || loadingLocation}
                  className="bg-maroon hover:bg-maroon-dark text-white text-xs font-serif font-bold tracking-wider px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {loadingPincode ? 'CHECKING...' : 'CHECK'}
                </button>
              </form>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[10px] text-dark-brown/40 font-bold uppercase">Or detect current location</span>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={loadingPincode || loadingLocation}
                  className="text-xs text-maroon hover:text-maroon-dark font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loadingLocation ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-maroon border-t-transparent rounded-full animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    '📍 GPS Locate'
                  )}
                </button>
              </div>

              {locError && (
                <div className="text-xs text-red-600 font-semibold flex items-center gap-1 animate-fadeIn">
                  <AlertCircle size={14} />
                  <span>{locError}</span>
                </div>
              )}

              {deliveryInfo && !locError && (
                <div className="p-3 bg-white/70 rounded-xl border border-[#C9A45C]/15 text-xs space-y-1 text-dark-brown/85 animate-fadeIn">
                  {deliveryInfo.serviceable ? (
                    <>
                      <div className="text-emerald-700 font-extrabold flex items-center gap-1.5 text-xs">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span>Delivery Serviceable</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] font-medium text-dark-brown/70 font-sans">
                        {deliveryInfo.delivery_type && (
                          <div>Mode: <span className="font-bold text-dark-brown uppercase">{deliveryInfo.delivery_type.replace('_', ' ')}</span></div>
                        )}
                        {deliveryInfo.delivery_charge !== undefined && (
                          <div>Shipping: <span className="font-bold text-maroon">{deliveryInfo.delivery_charge === 0 ? 'FREE' : `₹${deliveryInfo.delivery_charge}`}</span></div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-red-600 font-bold text-xs flex items-center gap-1.5">
                      <X size={15} className="text-red-500" />
                      <span>Delivery not available for this address</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Compact Trust Signals */}
            <div className="grid grid-cols-2 gap-3.5 p-4 bg-[#FFF9F0]/65 border border-[#C9A45C]/20 rounded-2xl text-[11px] text-dark-brown/70 font-sans">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-maroon/5 text-maroon rounded-xl">
                  <Shield size={16} />
                </div>
                <div>
                  <div className="font-bold text-dark-brown">Authentic Saree</div>
                  <div className="text-[9px] text-dark-brown/40 leading-none mt-0.5">100% handloom certified</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-maroon/5 text-maroon rounded-xl">
                  <Truck size={16} />
                </div>
                <div>
                  <div className="font-bold text-dark-brown">Safe Checkout</div>
                  <div className="text-[9px] text-dark-brown/40 leading-none mt-0.5">UPI, Cards & COD</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-maroon/5 text-maroon rounded-xl">
                  <Calendar size={16} />
                </div>
                <div>
                  <div className="font-bold text-dark-brown">7-Day Return</div>
                  <div className="text-[9px] text-dark-brown/40 leading-none mt-0.5">Hassle-free exchange</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-maroon/5 text-maroon rounded-xl">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <div className="font-bold text-dark-brown">Weavers Direct</div>
                  <div className="text-[9px] text-dark-brown/40 leading-none mt-0.5">Empowering weavers</div>
                </div>
              </div>
            </div>

            {/* WhatsApp Assistance */}
            <button
              onClick={handleWhatsAppInquiry}
              className="w-full py-3 px-6 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 rounded-2xl font-sans font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-sm group cursor-pointer"
            >
              <MessageCircle size={18} className="fill-emerald-800 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span>Need help choosing this saree? → Chat on WhatsApp</span>
            </button>

            {/* Accordions (About, Shipping & Returns, Care) */}
            <div className="space-y-3 pt-4">
              {[
                { 
                  id: 'about', 
                  label: 'About This Saree', 
                  content: `${product.description}\n\nFabric Detail: ${product.fabric} base.\nLength: ${product.length} with separate ${product.blousePiece} blouse piece.\nWork Type: ${product.work}.` 
                },
                { 
                  id: 'shipping', 
                  label: 'Shipping & Returns', 
                  content: 'Free shipping all over India. Orders are processed within 24-48 hours and shipped via express couriers (Delhivery, BlueDart, DTDC). Standard delivery takes 3-5 business days. We offer a hassle-free 7-day return/exchange policy on unused products in their original packaging.' 
                },
                { 
                  id: 'care', 
                  label: 'Care Instructions', 
                  content: 'We recommend dry cleaning only for all our Banarasi silk products to preserve the shine and fabric quality. Store your saree wrapped in a soft muslin cloth in a cool, dry place. Avoid direct sunlight and direct ironing on the gold/silver zari work.' 
                }
              ].map((tab) => (
                <div key={tab.id} className="border border-cream/50 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                    className="w-full py-3.5 px-5 flex items-center justify-between text-left font-serif font-bold text-xs sm:text-sm text-dark-brown bg-cream/5 hover:bg-cream/10 transition-all"
                  >
                    <span>{tab.label}</span>
                    {activeTab === tab.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {activeTab === tab.id && (
                    <div className="py-4 px-5 text-xs sm:text-sm text-dark-brown/75 leading-relaxed border-t border-cream/40 whitespace-pre-line font-sans font-light bg-white/50">
                      {tab.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Divider */}
        <hr className="my-12 border-cream/50" />

        {/* Reviews Section */}
        <div id="reviews" className="space-y-8 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream/55 pb-4">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-extrabold text-dark-brown tracking-wide">
                Customer Reviews
              </h2>
              <p className="text-xs text-dark-brown/65 mt-1">
                Real feedback from our verified purchasers.
              </p>
            </div>
            <button
              onClick={handleWriteReviewClick}
              className="self-start sm:self-auto px-5 py-2.5 bg-maroon text-ivory rounded-xl font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark transition-all cursor-pointer shadow-sm"
            >
              Write a Review
            </button>
          </div>

          {/* Loading reviews state */}
          {loadingReviews ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-maroon border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-dark-brown/60 font-semibold uppercase tracking-wider">Loading Reviews...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Summary card */}
              <div className="lg:col-span-4 bg-cream/15 p-6 rounded-2xl border border-cream/70 space-y-6">
                <div className="text-center space-y-2">
                  <div className="font-serif text-5xl font-extrabold text-maroon">
                    {dynamicAverageRating > 0 ? dynamicAverageRating : "0.0"}
                  </div>
                  <div className="flex items-center justify-center text-gold text-lg">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={i < Math.round(dynamicAverageRating) ? 'fill-gold text-gold' : 'text-dark-brown/20'}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-dark-brown/55 font-bold uppercase tracking-wider">
                    Based on {dynamicTotalReviews} {dynamicTotalReviews === 1 ? 'review' : 'reviews'}
                  </div>
                </div>

                {/* Rating distribution bars */}
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const pct = getStarPercentage(stars);
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs font-semibold text-dark-brown/70 font-sans">
                        <span className="w-12 text-right">{stars} Star</span>
                        <div className="flex-1 h-2 bg-cream/35 border border-cream/85 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gold transition-all duration-500" 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                        <span className="w-8 text-left text-dark-brown/55">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews list */}
              <div className="lg:col-span-8 space-y-6">
                {reviews.length === 0 ? (
                  <div className="bg-cream/10 border border-dashed border-cream/80 rounded-2xl p-12 text-center space-y-3">
                    <p className="font-serif text-lg font-bold text-dark-brown/70">Be the first to review this product</p>
                    <p className="text-xs text-dark-brown/55 max-w-xs mx-auto">
                      Have you purchased this saree? Share your thoughts and photos with other customers.
                    </p>
                    <button
                      onClick={handleWriteReviewClick}
                      className="px-4 py-2 border border-maroon text-maroon hover:bg-maroon/5 rounded-xl font-serif font-bold text-xs tracking-wider uppercase transition-all cursor-pointer"
                    >
                      Write Review
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-cream/65 space-y-6">
                    {reviews.map((review, idx) => (
                      <div key={review.id} className={`${idx > 0 ? 'pt-6' : ''} space-y-2.5`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {/* Avatar circle */}
                            <div className="w-9 h-9 bg-maroon/10 border border-maroon/20 rounded-full flex items-center justify-center font-serif text-maroon font-extrabold text-sm uppercase">
                              {(review.orders?.customer_name || "C").charAt(0)}
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-sm text-dark-brown">
                                {review.orders?.customer_name || "Customer"}
                              </h4>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center text-gold text-[10px]">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      size={10}
                                      className={i < review.rating ? 'fill-gold text-gold' : 'text-dark-brown/20'}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-dark-brown/45 font-semibold font-sans">{formatDate(review.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {review.is_verified_purchase && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/60 rounded px-2 py-0.5 select-none">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              Verified Purchase
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 pl-12">
                          <h5 className="font-serif font-extrabold text-sm text-dark-brown tracking-wide">
                            {review.title}
                          </h5>
                          <p className="text-xs sm:text-sm text-dark-brown/80 font-light leading-relaxed whitespace-pre-line font-sans">
                            {review.review_text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* You May Also Like Recommendations */}
        <YouMayAlsoLike currentProduct={product} />

      </main>

      {/* Recently Viewed — rendered outside main so it spans full width */}
      <RecentlyViewed viewedIds={viewedIds} excludeId={product.id} />

      <Footer />

      {/* Lightbox / Zoom Overlay */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-60 bg-[#2D211D]/95 flex flex-col items-center justify-center p-4 md:p-8 animate-fadeIn">
          <button 
            onClick={() => setIsLightboxOpen(false)} 
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-70 cursor-pointer"
            aria-label="Close image zoom"
          >
            <X size={24} />
          </button>
          
          <div className="relative w-full max-w-4xl max-h-[75vh] flex items-center justify-center animate-scaleIn">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
            />
          </div>
          
          {/* Lightbox thumbnail selectors */}
          <div className="flex gap-2.5 mt-6 overflow-x-auto max-w-full pb-2 scrollbar-none">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveImage(img);
                  setActiveImageIndex(idx);
                }}
                className={`w-14 aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                  activeImage === img ? 'border-gold scale-95' : 'border-white/20'
                }`}
              >
                <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Review Write Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#2D211D]/60 backdrop-blur-sm animate-fadeIn" 
            onClick={() => {
              if (!submitting) {
                setIsReviewModalOpen(false);
                setFormError(null);
              }
            }} 
          />

          <div className="bg-[#FFF9F0] border border-[#C9A45C]/35 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden z-10 relative animate-scaleIn p-6 sm:p-8 space-y-6">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsReviewModalOpen(false);
                setFormError(null);
              }}
              disabled={submitting}
              className="absolute top-4 right-4 z-20 p-1.5 text-dark-brown/65 hover:text-maroon hover:bg-cream/40 rounded-full transition-all disabled:opacity-50 cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Modal Title */}
            <div className="text-center space-y-1">
              <h3 className="font-serif text-lg sm:text-xl font-extrabold text-dark-brown">
                Write a Review
              </h3>
              <p className="text-xs text-dark-brown/60">
                Share your experience with the {product.name}
              </p>
            </div>

            <div className="w-12 h-0.5 bg-gold/45 mx-auto rounded-full"></div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded border border-red-100 flex items-start gap-2 animate-fadeIn">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded border border-green-100 flex items-start gap-2 animate-fadeIn">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-green-600" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Star selector */}
              <div className="space-y-1 text-center">
                <label className="text-xs font-bold text-dark-brown/65 uppercase tracking-wider">Rating</label>
                <div className="flex items-center justify-center gap-1 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      disabled={submitting}
                      onClick={() => setFormRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-gold transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        size={28}
                        className={((hoverRating || formRating) >= star) ? 'fill-gold text-gold' : 'text-dark-brown/20'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label htmlFor="review-title" className="text-xs font-bold text-dark-brown/65 uppercase tracking-wider font-sans">Review Title</label>
                <input
                  id="review-title"
                  type="text"
                  required
                  maxLength={100}
                  disabled={submitting}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Beautiful saree, highly recommend!"
                  className="w-full bg-[#FFFFFF] border border-[#C9A45C]/40 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded-lg px-3.5 py-2.5 outline-none transition-all font-sans"
                />
              </div>

              {/* Review text textarea */}
              <div className="space-y-1">
                <label htmlFor="review-text" className="text-xs font-bold text-dark-brown/65 uppercase tracking-wider font-sans">Review Details</label>
                <textarea
                  id="review-text"
                  required
                  rows={4}
                  maxLength={1000}
                  disabled={submitting}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Tell us about the fabric quality, color accuracy, and overall experience..."
                  className="w-full bg-[#FFFFFF] border border-[#C9A45C]/40 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded-lg px-3.5 py-2.5 outline-none transition-all resize-none font-sans"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-2.5 border border-cream text-dark-brown/70 rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-cream/15 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-maroon text-white rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      SUBMITTING...
                    </>
                  ) : (
                    "SUBMIT REVIEW"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Floating Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-[#FFF9F0]/90 backdrop-blur-md border-t border-[#C9A45C]/35 px-4 py-3.5 pb-safe shadow-[0_-8px_24px_rgba(45,33,29,0.08)] flex items-center justify-between md:hidden animate-fadeIn">
        {/* Left Side: Price Breakdown */}
        <div className="flex flex-col">
          <span className="text-[9px] text-dark-brown/40 uppercase font-bold tracking-wider leading-none">Price</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-serif text-base font-extrabold text-maroon">
              ₹{finalPrice.toLocaleString('en-IN')}
            </span>
            {product.salePrice && (
              <span className="text-[10px] text-dark-brown/40 line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Wishlist + Add / Buy */}
        <div className="flex items-center gap-2">
          {product.stock > 0 ? (
            <>
              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  isWishlisted
                    ? 'bg-maroon/5 border-maroon text-maroon'
                    : 'bg-white border-cream text-dark-brown/85 hover:border-maroon/40 hover:text-maroon'
                }`}
                aria-label="Wishlist"
              >
                <Heart size={16} className={isWishlisted ? 'fill-maroon text-maroon' : ''} />
              </button>

              {/* Add to Cart CTA */}
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="bg-maroon hover:bg-maroon-dark text-white rounded-xl px-5 py-3 font-serif font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                {isAddingToCart ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShoppingBag size={14} />
                )}
                {isAlreadyInCart ? 'GO TO BAG' : 'ADD TO BAG'}
              </button>
            </>
          ) : (
            <span className="text-[10px] font-bold text-red-700 bg-red-50 py-2.5 px-3.5 rounded-lg border border-red-100 uppercase tracking-wider">
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </>
  );
}
