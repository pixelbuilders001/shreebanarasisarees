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
  Check,
  Award,
  Sparkles,
  Scissors,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { checkDeliveryServiceability, fetchDesignVariants, supabase } from '../../../data/supabase';
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
  const [openAccordion, setOpenAccordion] = useState<string | null>('specs');

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
  const discountPercent = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  // Recently viewed tracking
  const { viewedIds, recordView } = useRecentlyViewed();

  // Design Variants state
  const [designVariants, setDesignVariants] = useState<Product[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  useEffect(() => {
    if (product.designCode && typeof fetchDesignVariants === 'function') {
      setLoadingVariants(true);
      fetchDesignVariants(product.designCode)
        .then((vars) => setDesignVariants(vars || []))
        .catch((err) => console.error("Error loading design variants:", err))
        .finally(() => setLoadingVariants(false));
    } else {
      setDesignVariants([]);
    }
  }, [product.designCode, product.id]);

  const getColorHex = (colorStr: string): string => {
    const c = colorStr.toLowerCase().trim();
    if (c.includes('red')) return '#8C1D24';
    if (c.includes('pink') || c.includes('rani')) return '#D63384';
    if (c.includes('blue') || c.includes('peacock')) return '#0D6EFD';
    if (c.includes('green') || c.includes('emerald')) return '#198754';
    if (c.includes('yellow') || c.includes('mustard') || c.includes('gold')) return '#D97706';
    if (c.includes('purple') || c.includes('lavender') || c.includes('wine')) return '#6F42C1';
    if (c.includes('maroon')) return '#52111C';
    if (c.includes('orange') || c.includes('peach')) return '#EA580C';
    if (c.includes('white') || c.includes('ivory') || c.includes('cream')) return '#FFFFFF';
    if (c.includes('black')) return '#18181B';
    return '#B08A3C';
  };

  // Record this product view on mount & trigger GA4 view_item
  useEffect(() => {
    recordView(product.id);
    trackViewItem(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // React to store context pincode changes
  useEffect(() => {
    setPincodeInput(checkedPincode);
  }, [checkedPincode]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => {
          const next = (prev + 1) % product.images.length;
          setActiveImage(product.images[next]);
          return next;
        });
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => {
          const next = (prev - 1 + product.images.length) % product.images.length;
          setActiveImage(product.images[next]);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, product.images]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('product_reviews')
        .select('*, orders(customer_name)')
        .eq('product_id', product.id)
        .neq('status', 'rejected')
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

  // Strictly dynamic calculation from real Supabase reviews database
  const dynamicTotalReviews = reviews.length;
  const dynamicAverageRating = reviews.length > 0
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : 0;

  const getStarPercentage = (starRating: number) => {
    if (reviews.length === 0) return 0;
    const count = reviews.filter(r => Math.round(r.rating) === starRating).length;
    return Math.round((count / reviews.length) * 100);
  };

  const handleWriteReviewClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      showToast("Please log in to write a review.", "info");
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
        setLocError("Delivery is currently not available at this pincode.");
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
          setLocError("Location permission denied. Please enter PIN code manually.");
        } else {
          setLocError("Unable to retrieve location. Please enter PIN code manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // WhatsApp Message Generator prefilled with current saree details
  const handleWhatsAppInquiry = () => {
    const whatsappNumber = "91620390946";
    const textMessage = `Namaste Shree Banarasi Sarees! 🌸
I am interested in buying this saree from your store:

Saree: ${product.name}
SKU: ${product.sku}
Fabric: ${product.fabric}
Price: ₹${finalPrice.toLocaleString('en-IN')}

Link: https://shreebanarasisarees.in/product/${product.slug}

Can you please assist me with color availability, live video preview, or order placement?`;

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
        await new Promise(resolve => setTimeout(resolve, 400));
        addToCart(product, quantity);
        setIsAddingToCart(false);
        showToast(`Added "${product.name}" to your shopping bag.`);
      }
    }
  };

  const handleBuyNow = async () => {
    if (product.stock > 0) {
      setIsBuyingNow(true);
      await new Promise(resolve => setTimeout(resolve, 350));
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
    if (width > 0) {
      const index = Math.round(scrollLeft / width);
      setActiveImageIndex(index);
      if (product.images[index]) {
        setActiveImage(product.images[index]);
      }
    }
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
        showToast("Product link copied to clipboard!", "info");
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Why You'll Love It items based on actual product characteristics
  const loveHighlights = [
    { title: `Authentic ${product.fabric} Weave`, desc: `Crafted with high-density threads for a royal fall and enduring lustrous sheen.` },
    { title: `${product.work} Artisantry`, desc: `Delicate hand-detailed motifs woven by master artisans with precision.` },
    { title: `Matching Blouse Piece Included`, desc: `Includes ${product.blousePiece} for a seamless ensemble.` },
    { title: `Festive & Heritage Aesthetic`, desc: `Tailored for weddings, pujas, and heirloom wardrobe collections.` },
    { title: `Certified Quality Checked`, desc: `Inspected and shipped in luxury protective packaging directly from Samastipur.` }
  ];

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-16 font-sans">

        {/* Top Hindi Heritage Tagline & Breadcrumbs */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-[#B08A3C]/20 pb-3">
          <nav className="text-[#6B625D] font-medium flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-[#6B1725] transition-colors">Home</Link>
            <span className="text-[#B08A3C]/40">/</span>
            <Link href="/sarees" className="hover:text-[#6B1725] transition-colors">Sarees</Link>
            <span className="text-[#B08A3C]/40">/</span>
            <Link href={`/sarees/${product.category.toLowerCase()}`} className="hover:text-[#6B1725] transition-colors">
              {product.category}
            </Link>
            <span className="text-[#B08A3C]/40">/</span>
            <span className="text-[#292524] font-semibold truncate max-w-[160px] sm:max-w-xs">{product.name}</span>
          </nav>

          {/* <div className="flex items-center gap-3">
            <span className="font-serif italic text-xs text-[#B08A3C] font-semibold flex items-center gap-1">
              <Sparkles size={12} className="text-[#B08A3C]" />
              श्री बनारसी साड़ियाँ • समस्तीपुर
            </span>
            <Link href="/sarees" className="font-bold text-[#6B1725] flex items-center gap-1 hover:underline transition-all ml-auto sm:ml-0">
              <ArrowLeft size={13} />
              Catalog
            </Link>
          </div> */}
        </div>

        {/* 2-COLUMN MAIN PRODUCT SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* LEFT COLUMN: Image Gallery */}
          <div className="md:col-span-6 space-y-4 md:sticky md:top-24">

            {/* Main Image Stage (Desktop) */}
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="hidden md:block relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#FAF7F0] border border-[#B08A3C]/25 shadow-md cursor-zoom-in group"
            >
              <img
                src={activeImage}
                alt={`${product.name} - ${product.fabric} Saree in ${product.color}`}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                loading="eager"
              />

              {/* Product Badges (Top Left) */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                {product.bestseller && (
                  <span className="bg-[#6B1725] text-[#FAF7F0] text-[10px] font-serif font-bold px-2.5 py-1 rounded tracking-widest uppercase shadow-md border border-[#B08A3C]/30">
                    BESTSELLER
                  </span>
                )}
                {product.newArrival && (
                  <span className="bg-[#B08A3C] text-[#292524] text-[10px] font-serif font-bold px-2.5 py-1 rounded tracking-widest uppercase shadow-md">
                    NEW ARRIVAL
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-[#52111C] text-[#FAF7F0] text-[10px] font-serif font-bold px-2.5 py-1 rounded tracking-widest uppercase shadow-md border border-[#B08A3C]/20">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Lightbox hint overlay */}
              <div className="absolute bottom-4 right-4 bg-[#292524]/75 backdrop-blur-sm text-[#FAF7F0] px-3 py-1.5 rounded-full text-xs font-serif font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                <ZoomIn size={14} className="text-[#B08A3C]" />
                <span>Click to Expand</span>
              </div>
            </div>

            {/* Mobile Carousel Stage */}
            <div className="md:hidden relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#FAF7F0] border border-[#B08A3C]/25 shadow-md">
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

              {/* Mobile Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                {product.bestseller && (
                  <span className="bg-[#6B1725] text-[#FAF7F0] text-[9px] font-serif font-bold px-2 py-0.5 rounded tracking-widest uppercase shadow">
                    BESTSELLER
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-[#B08A3C] text-[#292524] text-[9px] font-serif font-bold px-2 py-0.5 rounded tracking-widest uppercase shadow">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Image position pill */}
              <div className="absolute top-3 right-3 bg-[#292524]/80 backdrop-blur-sm text-[#FAF7F0] px-2.5 py-0.5 rounded-full text-[10px] font-bold font-serif tracking-wider border border-[#B08A3C]/30">
                {activeImageIndex + 1} / {product.images.length}
              </div>

              <button
                onClick={() => setIsLightboxOpen(true)}
                className="absolute bottom-3 right-3 p-2 bg-[#292524]/75 text-white rounded-full backdrop-blur-sm"
                aria-label="Zoom image"
              >
                <ZoomIn size={16} />
              </button>
            </div>

            {/* Thumbnail Navigation Strip */}
            {product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none items-center justify-start">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleThumbnailClick(img, idx)}
                    className={`w-16 sm:w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 bg-white flex-shrink-0 transition-all cursor-pointer ${activeImage === img
                      ? 'border-[#6B1725] ring-2 ring-[#B08A3C]/40 scale-[0.97] shadow-md'
                      : 'border-[#B08A3C]/20 opacity-75 hover:opacity-100 hover:border-[#6B1725]/50'
                      }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} View ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Heritage Quality Note below image */}
            <div className="p-3.5 bg-white/80 border border-[#B08A3C]/20 rounded-xl flex items-center justify-between text-xs text-[#6B625D]">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-[#B08A3C]" />
                <span className="font-serif text-[#292524] font-bold">100% Handloom Authenticity Guarantee</span>
              </div>
              <span className="text-[10px] text-[#B08A3C] font-semibold uppercase tracking-wider">Varanasi Woven</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Information & Purchase Section */}
          <div className="md:col-span-6 space-y-6">

            {/* Header info & Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-[#B08A3C] tracking-widest uppercase border-b border-[#B08A3C]/30 pb-0.5">
                  {product.category} Collection
                </span>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="p-2 text-[#6B625D] hover:text-[#6B1725] hover:bg-[#F3ECE0] rounded-full transition-all cursor-pointer border border-[#B08A3C]/25 bg-white shadow-sm"
                  title="Share product"
                  aria-label="Share saree details"
                >
                  <Share2 size={15} />
                </button>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#292524] tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center justify-between text-[11px] text-[#6B625D] font-medium uppercase tracking-wider">
                <span>SKU: <strong className="text-[#292524] font-semibold">{product.sku}</strong></span>
                {product.stock > 0 ? (
                  product.stock <= 2 ? (
                    <span className="text-amber-700 font-extrabold flex items-center gap-1 animate-pulse">
                      <AlertCircle size={12} /> Only {product.stock} left in stock!
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                      <CheckCircle2 size={12} /> In Stock & Ready to Ship
                    </span>
                  )
                ) : (
                  <span className="text-red-600 font-extrabold">Currently Sold Out</span>
                )}
              </div>

              {/* Rating Summary Bar */}
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#292524] py-1.5 border-b border-[#B08A3C]/20">
                <div className="flex items-center text-[#B08A3C]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={dynamicAverageRating > 0 && i < Math.round(dynamicAverageRating) ? 'fill-[#B08A3C] text-[#B08A3C]' : 'text-stone-300'}
                    />
                  ))}
                </div>
                {dynamicTotalReviews > 0 ? (
                  <>
                    <span className="font-bold text-sm">{dynamicAverageRating}</span>
                    <span className="text-[#6B625D]/40">•</span>
                    <a href="#reviews" className="text-[#6B625D] font-medium hover:text-[#6B1725] hover:underline transition-colors">
                      {dynamicTotalReviews} Verified {dynamicTotalReviews === 1 ? 'Review' : 'Reviews'}
                    </a>
                  </>
                ) : (
                  <a href="#reviews" className="text-[#6B625D] font-medium hover:text-[#6B1725] hover:underline transition-colors">
                    No reviews yet
                  </a>
                )}
                <span className="text-[#6B625D]/40">•</span>
                <button
                  onClick={handleWriteReviewClick}
                  className="text-[#6B1725] hover:underline font-bold transition-all cursor-pointer"
                >
                  Write Review
                </button>
              </div>
            </div>

            {/* Pricing Highlight Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#B08A3C]/35 shadow-sm space-y-1.5">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-serif text-3xl sm:text-4xl font-extrabold text-[#6B1725]">
                  ₹{finalPrice.toLocaleString('en-IN')}
                </span>
                {product.salePrice && (
                  <span className="text-lg text-[#6B625D]/60 line-through font-medium">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                )}
                {product.salePrice && (
                  <span className="bg-[#6B1725]/10 border border-[#6B1725]/30 text-[#6B1725] text-xs font-serif font-extrabold px-3 py-1 rounded-lg tracking-wider">
                    {discountPercent}% OFF (Save ₹{(product.price - product.salePrice).toLocaleString('en-IN')})
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B625D] font-medium pt-1 border-t border-[#F3ECE0] mt-2">
                ✓ Price inclusive of all taxes. Free express shipping across India.
              </p>
            </div>

            {/* Dynamic Product Attribute Badges */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="px-3 py-1.5 bg-[#FAF7F0] border border-[#B08A3C]/30 text-[#292524] rounded-lg flex items-center gap-1.5">
                <Scissors size={13} className="text-[#6B1725]" />
                Blouse Piece Included ({product.blousePiece})
              </span>
              <span className="px-3 py-1.5 bg-[#FAF7F0] border border-[#B08A3C]/30 text-[#292524] rounded-lg flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#B08A3C]" />
                Weave: {product.work}
              </span>
              <span className="px-3 py-1.5 bg-[#FAF7F0] border border-[#B08A3C]/30 text-[#292524] rounded-lg flex items-center gap-1.5">
                <Shield size={13} className="text-emerald-700" />
                Quality Checked
              </span>
            </div>

            {/* Color Swatch Display (Variant Options for same design_code) */}
            <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-[#B08A3C]/30 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-2">
                <label className="text-xs font-bold text-[#6B625D] uppercase tracking-wider font-serif flex items-center gap-1.5">
                  <span>Color / Design Variant:</span>
                  <span className="text-[#6B1725] font-extrabold">{product.color}</span>
                </label>
                {product.designCode && (
                  <span className="text-[10px] font-mono font-bold bg-[#6B1725]/10 text-[#6B1725] px-2 py-0.5 rounded border border-[#6B1725]/20">
                    DESIGN: {product.designCode}
                  </span>
                )}
              </div>

              {loadingVariants ? (
                <div className="flex items-center gap-2 text-xs text-[#6B625D] py-1">
                  <div className="w-3.5 h-3.5 border-2 border-[#6B1725] border-t-transparent rounded-full animate-spin" />
                  <span>Loading color options…</span>
                </div>
              ) : designVariants.length > 1 ? (
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {designVariants.map((variant) => {
                    const isSelected = variant.id === product.id;
                    const colorBg = getColorHex(variant.color);
                    const hasThumbnail = variant.images && variant.images.length > 0;

                    return (
                      <Link
                        key={variant.id}
                        href={`/product/${variant.slug}`}
                        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${isSelected
                          ? 'border-[#6B1725] bg-[#6B1725]/10 text-[#6B1725] ring-2 ring-[#B08A3C]/40 font-bold shadow-sm'
                          : 'border-[#B08A3C]/30 bg-[#FAF7F0]/60 text-[#292524] hover:border-[#6B1725] hover:bg-white'
                          }`}
                        title={`${variant.name} (${variant.color}) - ₹${(variant.salePrice ?? variant.price).toLocaleString('en-IN')}`}
                      >
                        {/* Swatch Circle with Image or Color */}
                        <div className="relative w-5 h-5 rounded-full overflow-hidden border border-stone-300 shadow-inner flex-shrink-0">
                          {hasThumbnail ? (
                            <img src={variant.images[0]} alt={variant.color} className="w-full h-full object-cover" />
                          ) : (
                            <span className="block w-full h-full" style={{ backgroundColor: colorBg }} />
                          )}
                        </div>

                        <span>{variant.color}</span>

                        {isSelected && (
                          <Check size={12} className="text-[#6B1725] flex-shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2.5 pt-1">
                  <div
                    className="w-7 h-7 rounded-full border-2 border-[#6B1725] ring-2 ring-[#B08A3C]/30 flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: getColorHex(product.color) }}
                    title={product.color}
                  >
                    <Check size={14} className={product.color.toLowerCase() === 'white' ? 'text-[#292524]' : 'text-white'} />
                  </div>
                  <span className="text-xs font-semibold text-[#292524] bg-[#FAF7F0] border border-[#B08A3C]/25 px-3 py-1 rounded-lg">
                    {product.color} ({product.fabric})
                  </span>
                </div>
              )}
            </div>

            {/* Purchase CTA Buttons */}
            <div className="space-y-3 pt-2">
              {product.stock > 0 ? (
                <>
                  <div className="flex gap-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-[#B08A3C]/40 rounded-xl bg-white overflow-hidden shadow-sm">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="px-3 py-3 text-[#6B625D] hover:text-[#6B1725] hover:bg-[#FAF7F0] font-bold transition-all"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-3 text-sm font-bold text-[#292524] min-w-[32px] text-center font-serif">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                        className="px-3 py-3 text-[#6B625D] hover:text-[#6B1725] hover:bg-[#FAF7F0] font-bold transition-all"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Cart Primary Button */}
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className="flex-1 py-3.5 px-6 rounded-xl font-serif font-extrabold text-xs tracking-widest uppercase flex items-center justify-center gap-2 border-2 border-[#6B1725] text-[#6B1725] hover:bg-[#6B1725]/5 active:scale-[0.99] transition-all disabled:opacity-70 shadow-sm cursor-pointer"
                    >
                      {isAddingToCart ? (
                        <div className="w-4 h-4 border-2 border-[#6B1725] border-t-transparent rounded-full animate-spin" />
                      ) : isAlreadyInCart ? (
                        <Check size={16} />
                      ) : (
                        <ShoppingBag size={16} />
                      )}
                      {isAddingToCart ? 'ADDING...' : isAlreadyInCart ? 'GO TO BAG' : 'ADD TO BAG'}
                    </button>
                  </div>

                  {/* Buy Now Secondary CTA */}
                  <button
                    onClick={handleBuyNow}
                    disabled={isBuyingNow}
                    className="w-full py-4 px-6 rounded-xl font-serif font-extrabold text-xs tracking-widest uppercase flex items-center justify-center gap-2 bg-[#6B1725] text-[#FAF7F0] hover:bg-[#52111C] active:scale-[0.99] transition-all disabled:opacity-75 shadow-md cursor-pointer border border-[#B08A3C]/30"
                  >
                    {isBuyingNow ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'BUY NOW — FAST CHECKOUT'
                    )}
                  </button>
                </>
              ) : (
                <button
                  disabled
                  className="w-full py-4 bg-stone-200 text-stone-500 rounded-xl font-serif font-extrabold text-xs tracking-widest uppercase cursor-not-allowed border border-stone-300"
                >
                  CURRENTLY OUT OF STOCK
                </button>
              )}

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`w-full py-3 rounded-xl font-serif font-extrabold text-xs tracking-wider uppercase border flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer ${isWishlisted
                  ? 'bg-[#6B1725]/5 border-[#6B1725] text-[#6B1725] shadow-sm'
                  : 'bg-white border-[#B08A3C]/35 text-[#292524] hover:border-[#6B1725] hover:text-[#6B1725]'
                  }`}
                aria-label={`Save ${product.name} to wishlist`}
              >
                <Heart size={15} className={isWishlisted ? 'fill-[#6B1725] text-[#6B1725] animate-pulse' : ''} />
                {isWishlisted ? 'SAVED TO WISHLIST' : 'SAVE TO WISHLIST'}
              </button>
            </div>

            {/* Delivery & Pincode Checker */}
            <div className="p-4.5 bg-white rounded-2xl border border-[#B08A3C]/30 text-[#292524] space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#292524] font-serif">
                  <MapPin size={16} className="text-[#6B1725]" />
                  <span>Check Delivery & Pincode Availability</span>
                </div>
                <span className="text-[10px] text-[#B08A3C] font-semibold">Pan-India Courier</span>
              </div>

              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit PIN code"
                  className="flex-1 bg-[#FAF7F0] border border-[#B08A3C]/35 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-xl px-3.5 py-2.5 outline-none transition-all font-sans font-medium"
                />
                <button
                  type="submit"
                  disabled={loadingPincode || loadingLocation}
                  className="bg-[#6B1725] hover:bg-[#52111C] text-[#FAF7F0] text-xs font-serif font-bold tracking-wider px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {loadingPincode ? 'CHECKING...' : 'CHECK'}
                </button>
              </form>
              {/* 
              <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                <span className="text-[11px] text-[#6B625D]">Know delivery timeline for your city?</span>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={loadingPincode || loadingLocation}
                  className="text-xs text-[#6B1725] hover:underline font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loadingLocation ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#6B1725] border-t-transparent rounded-full animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    '📍 GPS Locate'
                  )}
                </button>
              </div> */}

              {locError && (
                <div className="text-xs text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle size={14} />
                  <span>{locError}</span>
                </div>
              )}

              {deliveryInfo && !locError && (
                <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#B08A3C]/20 text-xs space-y-1 text-[#292524] animate-slideDown">
                  {deliveryInfo.serviceable ? (
                    <>
                      <div className="text-emerald-800 font-extrabold flex items-center gap-1.5 text-xs">
                        <CheckCircle2 size={16} className="text-emerald-700" />
                        <span>Delivery Available to Your Location</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-medium text-[#6B625D]">
                        <div>Estimated: <strong className="text-[#292524]">3–5 Business Days</strong></div>
                        <div>Shipping: <strong className="text-[#6B1725]">FREE Express</strong></div>
                        <div>COD Available: <strong className="text-emerald-700">✓ Yes</strong></div>
                        <div>Courier: <strong className="text-[#292524]">BlueDart / Delhivery</strong></div>
                      </div>
                    </>
                  ) : (
                    <div className="text-red-600 font-bold text-xs flex items-center gap-1.5">
                      <X size={15} className="text-red-500" />
                      <span>Delivery is currently not available for this pincode.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subtle Trust Signals */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-[#FAF7F0] border border-[#B08A3C]/25 rounded-2xl text-xs text-[#6B625D]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#6B1725]/10 text-[#6B1725] rounded-xl">
                  <Shield size={16} />
                </div>
                <div>
                  <div className="font-bold text-[#292524]">100% Authentic Saree</div>
                  <div className="text-[10px] text-[#6B625D]">Direct weaver craft</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#6B1725]/10 text-[#6B1725] rounded-xl">
                  <Truck size={16} />
                </div>
                <div>
                  <div className="font-bold text-[#292524]">Free Express Delivery</div>
                  <div className="text-[10px] text-[#6B625D]">Inspected packaging</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#6B1725]/10 text-[#6B1725] rounded-xl">
                  <RotateCcw size={16} />
                </div>
                <div>
                  <div className="font-bold text-[#292524]">7-Day Easy Returns</div>
                  <div className="text-[10px] text-[#6B625D]">Hassle-free exchange</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#6B1725]/10 text-[#6B1725] rounded-xl">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="font-bold text-[#292524]">Samastipur Boutique</div>
                  <div className="text-[10px] text-[#6B625D]">Showroom in Bihar</div>
                </div>
              </div>
            </div>

            {/* WhatsApp Saree Assistance Button */}
            <button
              onClick={handleWhatsAppInquiry}
              className="w-full py-3.5 px-5 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border border-emerald-300 rounded-2xl font-sans font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer group"
            >
              <MessageCircle size={18} className="fill-emerald-800 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span>Not sure which saree to choose? Chat with a Saree Expert on WhatsApp</span>
            </button>

          </div>
        </div>

        {/* EDITORIAL SECTION: WHY YOU'LL LOVE IT */}
        <div className="mt-14 mb-10 p-6 sm:p-8 bg-white border border-[#B08A3C]/30 rounded-2xl shadow-sm">
          <div className="max-w-3xl space-y-2 mb-6">
            <span className="text-xs font-serif font-bold text-[#B08A3C] uppercase tracking-widest">Craft & Elegance</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#292524]">Why You&apos;ll Love This Saree</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loveHighlights.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#FAF7F0] border border-[#B08A3C]/20 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#6B1725] flex-shrink-0" />
                  <h3 className="font-serif font-bold text-sm text-[#292524]">{item.title}</h3>
                </div>
                <p className="text-xs text-[#6B625D] leading-relaxed pl-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PRODUCT HIGHLIGHTS SPECIFICATION TABLE */}
        <div className="mb-12 bg-white border border-[#B08A3C]/25 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 bg-[#FAF7F0] border-b border-[#B08A3C]/20 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-extrabold text-[#292524]">Product Highlights</h2>
              <p className="text-xs text-[#6B625D] mt-0.5">Authentic specifications and dimensions</p>
            </div>
            <span className="text-xs font-serif italic text-[#B08A3C]">Certified Pure</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-[#F3ECE0]">
            <div className="p-4 space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#6B625D] tracking-wider">Fabric</span>
              <p className="text-sm font-semibold text-[#292524] font-serif">{product.fabric}</p>
            </div>
            <div className="p-4 space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#6B625D] tracking-wider">Color</span>
              <p className="text-sm font-semibold text-[#292524] font-serif">{product.color}</p>
            </div>
            <div className="p-4 space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#6B625D] tracking-wider">Occasion</span>
              <p className="text-sm font-semibold text-[#292524] font-serif">{product.occasion}</p>
            </div>
            <div className="p-4 space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#6B625D] tracking-wider">Blouse Piece</span>
              <p className="text-sm font-semibold text-[#292524] font-serif">{product.blousePiece}</p>
            </div>
            <div className="p-4 space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#6B625D] tracking-wider">Saree Length</span>
              <p className="text-sm font-semibold text-[#292524] font-serif">{product.length}</p>
            </div>
            <div className="p-4 space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#6B625D] tracking-wider">Work Type</span>
              <p className="text-sm font-semibold text-[#292524] font-serif">{product.work}</p>
            </div>
            <div className="p-4 space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#6B625D] tracking-wider">Care Instructions</span>
              <p className="text-sm font-semibold text-[#292524] font-serif">{product.care}</p>
            </div>
            <div className="p-4 space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#6B625D] tracking-wider">Origin</span>
              <p className="text-sm font-semibold text-[#292524] font-serif">Varanasi, Uttar Pradesh</p>
            </div>
          </div>
        </div>

        {/* ACCORDIONS SECTION */}
        <div className="mb-14 space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-extrabold text-[#292524] mb-4">Detailed Information</h2>

          {[
            {
              id: 'specs',
              label: 'Product Details & Description',
              content: `${product.description}\n\nThis saree has been meticulously handwoven using classic weaving techniques. The body features intricate work, while the border and pallu showcase rich traditional motifs.`
            },
            {
              id: 'dimensions',
              label: 'Fabric & Saree Measurements',
              content: `Saree Length: ${product.length}\nBlouse Piece Length: ${product.blousePiece}\nFabric: ${product.fabric}\nWeave: ${product.work}\nWeight: Approx. 650g – 850g (Standard Handloom Weight)`
            },
            {
              id: 'care',
              label: 'Care & Maintenance Instructions',
              content: '• Dry Clean Only to preserve the luster and thread embroidery.\n• Store wrapped in a soft muslin or cotton cloth in a cool, dry place.\n• Avoid spraying perfume or deodrants directly on the zari embroidery.\n• Iron on low heat on the reverse side only if required.'
            },
            {
              id: 'shipping',
              label: 'Shipping, Delivery & Cash on Delivery (COD)',
              content: '• Free Shipping across all major pincodes in India.\n• Dispatch within 24-48 business hours from Samastipur, Bihar.\n• Express delivery in 3–5 business days via BlueDart, Delhivery, or DTDC.\n• Cash on Delivery (COD) is available nationwide.'
            },
            {
              id: 'returns',
              label: '7-Day Return & Exchange Policy',
              content: 'We take pride in our authentic quality. If you receive a damaged or incorrect saree, or are not completely satisfied, you can initiate a return or exchange within 7 days of delivery. The item must be unused, unstitched, and in its original fold with tags intact.'
            },
            {
              id: 'faqs',
              label: 'Frequently Asked Questions (FAQs)',
              content: 'Q: Is the blouse piece unstitched?\nA: Yes, a 0.8 meter unstitched matching blouse piece is included with the saree.\n\nQ: Is this authentic handloom?\nA: Yes, all our sarees are sourced directly from Varanasi weavers and certified.\n\nQ: Can I request a live video before shipping?\nA: Absolutely! Click the WhatsApp assistance button above and our Samastipur team will share a live video preview.'
            }
          ].map((tab) => (
            <div key={tab.id} className="border border-[#B08A3C]/25 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300">
              <button
                type="button"
                onClick={() => setOpenAccordion(openAccordion === tab.id ? null : tab.id)}
                className="w-full py-4 px-5 flex items-center justify-between text-left font-serif font-bold text-sm sm:text-base text-[#292524] bg-[#FAF7F0]/40 hover:bg-[#FAF7F0] transition-colors cursor-pointer"
              >
                <span>{tab.label}</span>
                <ChevronDown size={18} className={`text-[#6B1725] transition-transform duration-300 ${openAccordion === tab.id ? 'rotate-180' : ''}`} />
              </button>
              <div className={`accordion-wrapper ${openAccordion === tab.id ? 'open' : ''}`}>
                <div className="accordion-inner">
                  <div className="py-4 px-5 text-xs sm:text-sm text-[#6B625D] leading-relaxed border-t border-[#F3ECE0] whitespace-pre-line font-sans bg-white">
                    {tab.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BOUTIQUE SHOWROOM HERITAGE TRUST SECTION */}
        <div className="mb-14 p-6 sm:p-8 bg-[#FAF7F0] border border-[#B08A3C]/35 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-serif font-bold text-[#B08A3C] uppercase tracking-widest">Heritage Storefront</span>
            <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-[#292524]">Visit Shree Banarasi Sarees Showroom</h3>
            <p className="text-xs text-[#6B625D] max-w-xl leading-relaxed">
              Based in <strong>Samastipur, Bihar</strong>, our brick-and-mortar boutique brings authentic Banarasi craftsmanship straight from Varanasi weavers to customers across India.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleWhatsAppInquiry}
              className="px-5 py-3 bg-[#6B1725] text-[#FAF7F0] rounded-xl font-serif font-bold text-xs uppercase tracking-wider hover:bg-[#52111C] transition-all shadow-sm cursor-pointer"
            >
              Contact Store Manager
            </button>
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div id="reviews" className="space-y-8 scroll-mt-24 mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B08A3C]/25 pb-4">
            <div>
              <span className="text-xs font-serif font-bold text-[#B08A3C] uppercase tracking-widest">Verified Feedback</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#292524]">Customer Reviews</h2>
            </div>
            <button
              onClick={handleWriteReviewClick}
              className="self-start sm:self-auto px-5 py-2.5 bg-[#6B1725] text-[#FAF7F0] rounded-xl font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#52111C] transition-all cursor-pointer shadow-sm border border-[#B08A3C]/30"
            >
              Write a Review
            </button>
          </div>

          {loadingReviews ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-[#6B1725] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[#6B625D] font-semibold uppercase tracking-wider">Loading Customer Reviews...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Rating summary card */}
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#B08A3C]/30 space-y-6 shadow-sm">
                <div className="text-center space-y-2">
                  <div className="font-serif text-5xl font-extrabold text-[#6B1725]">
                    {dynamicAverageRating > 0 ? dynamicAverageRating : '0.0'}
                  </div>
                  <div className="flex items-center justify-center text-[#B08A3C] text-lg">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={dynamicAverageRating > 0 && i < Math.round(dynamicAverageRating) ? 'fill-[#B08A3C] text-[#B08A3C]' : 'text-stone-300'}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-[#6B625D] font-bold uppercase tracking-wider">
                    {dynamicTotalReviews > 0
                      ? `Based on ${dynamicTotalReviews} ${dynamicTotalReviews === 1 ? 'review' : 'reviews'}`
                      : 'No Reviews Submitted Yet'}
                  </div>
                </div>

                {/* Star percentage distribution */}
                <div className="space-y-2.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const pct = getStarPercentage(stars);
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs font-semibold text-[#292524]">
                        <span className="w-12 text-right">{stars} Star</span>
                        <div className="flex-1 h-2 bg-[#F3ECE0] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#B08A3C] transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-left text-[#6B625D]">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews Cards List */}
              <div className="lg:col-span-8 space-y-6">
                {reviews.length === 0 ? (
                  <div className="bg-white border border-dashed border-[#B08A3C]/40 rounded-2xl p-10 text-center space-y-3">
                    <p className="font-serif text-lg font-bold text-[#292524]">No Customer Reviews Yet</p>
                    <p className="text-xs text-[#6B625D] max-w-xs mx-auto">
                      Have you purchased this saree? Be the first to share your thoughts and help future buyers!
                    </p>
                    <button
                      onClick={handleWriteReviewClick}
                      className="px-5 py-2.5 bg-[#6B1725] text-[#FAF7F0] rounded-xl font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#52111C] transition-all cursor-pointer shadow-sm border border-[#B08A3C]/30"
                    >
                      Write First Review
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F3ECE0] space-y-6">
                    {reviews.map((review, idx) => (
                      <div key={review.id} className={`${idx > 0 ? 'pt-6' : ''} space-y-2.5`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#6B1725]/10 border border-[#6B1725]/20 rounded-full flex items-center justify-center font-serif text-[#6B1725] font-extrabold text-base uppercase">
                              {(review.orders?.customer_name || profilesMap[review.user_id] || "C").charAt(0)}
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-sm text-[#292524]">
                                {review.orders?.customer_name || profilesMap[review.user_id] || "Verified Customer"}
                              </h4>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center text-[#B08A3C]">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      size={12}
                                      className={i < review.rating ? 'fill-[#B08A3C] text-[#B08A3C]' : 'text-stone-300'}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] text-[#6B625D] font-medium">{formatDate(review.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {review.is_verified_purchase && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1">
                              <CheckCircle2 size={12} className="text-emerald-700" />
                              Verified Purchaser
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 pl-13">
                          <h5 className="font-serif font-extrabold text-sm text-[#292524]">
                            {review.title}
                          </h5>
                          <p className="text-xs sm:text-sm text-[#6B625D] leading-relaxed whitespace-pre-line">
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

        {/* SEEN ON OUR CUSTOMERS SECTION */}
        {(() => {
          const photoReviews = reviews.filter(r => r.images?.length > 0 || r.image_url);
          if (photoReviews.length > 0) {
            return (
              <div className="mb-14 p-6 bg-white border border-[#B08A3C]/25 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-serif font-bold text-[#B08A3C] uppercase tracking-widest">Real Customer Moments</span>
                    <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-[#292524]">Seen On Our Customers</h3>
                  </div>
                  <span className="text-xs font-serif text-[#6B1725] font-bold">#ShreeBanarasiBrides</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {photoReviews.map((rev, i) => {
                    const imgSrc = rev.images?.[0] || rev.image_url;
                    return (
                      <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden border border-[#B08A3C]/20 relative group">
                        <img src={imgSrc} alt={`Customer photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#292524]/80 via-transparent to-transparent flex items-end p-2.5">
                          <span className="text-[10px] font-serif text-[#FAF7F0] font-semibold truncate">
                            {rev.orders?.customer_name || profilesMap[rev.user_id] || "Verified Buyer"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div className="mb-14 p-6 bg-[#FAF7F0] border border-[#B08A3C]/25 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-serif font-bold text-[#B08A3C] uppercase tracking-widest">Share Your Saree Moment</span>
                <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-[#292524]">Wear It & Tag Us</h3>
                <p className="text-xs text-[#6B625D]">
                  Bought this saree? Submit a review with your photo or tag us with <strong className="text-[#6B1725]">#ShreeBanarasiBrides</strong> to be featured.
                </p>
              </div>
              <button
                onClick={handleWriteReviewClick}
                className="px-5 py-2.5 bg-[#6B1725] text-[#FAF7F0] rounded-xl font-serif font-bold text-xs uppercase tracking-wider hover:bg-[#52111C] transition-all shadow-sm cursor-pointer whitespace-nowrap border border-[#B08A3C]/30"
              >
                Write Review
              </button>
            </div>
          );
        })()}

        {/* YOU MAY ALSO LIKE RECOMMENDATIONS */}
        <YouMayAlsoLike currentProduct={product} />

        {/* RELATED CATEGORY BANNER CTA */}
        <div className="mt-14 p-8 bg-[#6B1725] text-[#FAF7F0] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg border border-[#B08A3C]/40">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-serif font-bold text-[#B08A3C] uppercase tracking-widest">Explore Collection</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-extrabold">Discover More {product.category} Sarees</h3>
            <p className="text-xs text-[#FAF7F0]/80 max-w-lg">
              Explore our wide range of handcrafted {product.category} sarees woven with pure zari and traditional Indian motifs.
            </p>
          </div>
          <Link
            href={`/sarees/${product.category.toLowerCase()}`}
            className="px-6 py-3.5 bg-[#B08A3C] hover:bg-[#8C6A23] text-[#292524] rounded-xl font-serif font-extrabold text-xs uppercase tracking-widest transition-colors shadow-md whitespace-nowrap"
          >
            SHOP {product.category.toUpperCase()} SAREES →
          </Link>
        </div>

      </main>

      {/* RECENTLY VIEWED CAROUSEL */}
      <RecentlyViewed viewedIds={viewedIds} excludeId={product.id} />

      <Footer />

      {/* LIGHTBOX OVERLAY */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-[#292524]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-8 animate-fadeIn">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 bg-white/15 hover:bg-white/30 text-white p-2.5 rounded-full transition-colors z-50 cursor-pointer"
            aria-label="Close image zoom"
          >
            <X size={22} />
          </button>

          <div className="relative w-full max-w-4xl max-h-[75vh] flex items-center justify-center animate-scaleIn">
            <img
              src={activeImage}
              alt={product.name}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl transition-all duration-300"
            />

            {/* Prev / Next controls */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const prevIdx = (activeImageIndex - 1 + product.images.length) % product.images.length;
                    setActiveImageIndex(prevIdx);
                    setActiveImage(product.images[prevIdx]);
                  }}
                  className="absolute left-2 p-3 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => {
                    const nextIdx = (activeImageIndex + 1) % product.images.length;
                    setActiveImageIndex(nextIdx);
                    setActiveImage(product.images[nextIdx]);
                  }}
                  className="absolute right-2 p-3 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
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
                className={`w-14 aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${activeImage === img ? 'border-[#B08A3C] scale-95 ring-2 ring-white/50' : 'border-white/20 opacity-60'
                  }`}
              >
                <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* REVIEW SUBMISSION MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#292524]/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => {
              if (!submitting) {
                setIsReviewModalOpen(false);
                setFormError(null);
              }
            }}
          />

          <div className="bg-[#FAF7F0] border border-[#B08A3C]/40 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden z-10 relative p-6 sm:p-8 space-y-6 animate-scaleIn">
            <button
              onClick={() => {
                setIsReviewModalOpen(false);
                setFormError(null);
              }}
              disabled={submitting}
              className="absolute top-4 right-4 z-20 p-1.5 text-[#6B625D] hover:text-[#6B1725] hover:bg-[#F3ECE0] rounded-full transition-all disabled:opacity-50 cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-serif text-xl font-extrabold text-[#292524]">
                Write a Customer Review
              </h3>
              <p className="text-xs text-[#6B625D]">
                Share your experience with the {product.name}
              </p>
            </div>

            <div className="w-12 h-0.5 bg-[#B08A3C]/50 mx-auto rounded-full"></div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200 flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 flex items-start gap-2">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-700" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1 text-center">
                <label className="text-xs font-bold text-[#6B625D] uppercase tracking-wider font-serif">Star Rating</label>
                <div className="flex items-center justify-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      disabled={submitting}
                      onClick={() => setFormRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-[#B08A3C] transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        size={28}
                        className={((hoverRating || formRating) >= star) ? 'fill-[#B08A3C] text-[#B08A3C]' : 'text-stone-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="review-title" className="text-xs font-bold text-[#6B625D] uppercase tracking-wider font-sans">Review Title</label>
                <input
                  id="review-title"
                  type="text"
                  required
                  maxLength={100}
                  disabled={submitting}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Gorgeous Banarasi saree, loved the fabric!"
                  className="w-full bg-white border border-[#B08A3C]/40 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-lg px-3.5 py-2.5 outline-none transition-all font-sans"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="review-text" className="text-xs font-bold text-[#6B625D] uppercase tracking-wider font-sans">Review Details</label>
                <textarea
                  id="review-text"
                  required
                  rows={4}
                  maxLength={1000}
                  disabled={submitting}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Tell us about the fabric sheen, color accuracy, drape feel, and overall experience..."
                  className="w-full bg-white border border-[#B08A3C]/40 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-lg px-3.5 py-2.5 outline-none transition-all resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-2.5 border border-[#B08A3C]/30 text-[#6B625D] rounded-xl font-serif font-bold text-xs tracking-wider uppercase hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#6B1725] text-[#FAF7F0] rounded-xl font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#52111C] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
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

      {/* MOBILE STICKY BOTTOM PURCHASE BAR */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-t border-[#B08A3C]/35 px-4 py-3 pb-safe shadow-[0_-8px_24px_rgba(41,37,36,0.12)] flex items-center justify-between md:hidden animate-slideUp">
        <div className="flex flex-col">
          <span className="text-[9px] text-[#6B625D] uppercase font-bold tracking-wider leading-none">Price (Inc. Tax)</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-serif text-base font-extrabold text-[#6B1725]">
              ₹{finalPrice.toLocaleString('en-IN')}
            </span>
            {product.salePrice && (
              <span className="text-[10px] text-[#6B625D]/50 line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {product.stock > 0 ? (
            <>
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${isWishlisted
                  ? 'bg-[#6B1725]/5 border-[#6B1725] text-[#6B1725]'
                  : 'bg-white border-[#B08A3C]/35 text-[#292524]'
                  }`}
                aria-label="Save to Wishlist"
              >
                <Heart size={16} className={isWishlisted ? 'fill-[#6B1725] text-[#6B1725]' : ''} />
              </button>

              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="bg-[#6B1725] hover:bg-[#52111C] text-[#FAF7F0] rounded-xl px-5 py-2.5 font-serif font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer border border-[#B08A3C]/30"
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
            <span className="text-[10px] font-bold text-red-700 bg-red-50 py-2.5 px-3 rounded-lg border border-red-200 uppercase tracking-wider">
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </>
  );
}
