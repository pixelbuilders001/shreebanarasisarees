"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '../../../components/Header';
import { Footer } from '../../../components/Footer';
import { Product, PRODUCTS, ProductAddon, SelectedAddon } from '../../../data/products';
import { useStore } from '../../../context/StoreContext';
import {
  Heart,
  MessageCircle,
  Share2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  MapPin,
  X,
  Scissors,
  Check,
  Plus,
  ChevronUp,
  Palette,
  Star,
  User,
  AlertCircle,
  ShoppingBag,
  Bell,
  Loader2,
  Truck,
  Clock,
  PackageCheck
} from 'lucide-react';
import { fetchDesignVariants, fetchDeliverySettings, fetchProductAddons, DeliverySettings, supabase } from '../../../data/supabase';
import { RecentlyViewed } from '../../../components/RecentlyViewed';
import { ProductCard } from '../../../components/ProductCard';
import { SareeCustomizationModal } from '../../../components/SareeCustomizationModal';
import { useRecentlyViewed } from '../../../utils/useRecentlyViewed';
import { trackViewItem } from '../../../lib/gtag';
import { openPincodeSheet, getExpressTimingStatus } from '../../../components/DeliveryPincodeBar';
import { useCustomerLocation } from '../../../hooks/useCustomerLocation';
import { getStandardDeliveryDateInfo } from '../../../lib/deliveryDates';
import { triggerHaptic } from '../../../utils/haptics';
import { DeliveryRiderIcon } from '../../../components/delivery/DeliveryIcons';
import { getQuickCity } from '../../../lib/pincodeLookup';
import { getSameDayCountdownInfo, SameDayCountdownInfo, getExpressDeliveryInfo, ExpressDeliveryInfo } from '../../../utils/deliveryCountdown';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    checkedPincode,
    setCheckedPincode,
    currentPincode,
    defaultDeliveryPincode,
    cart,
    updateCartItemAddons,
    setIsCartOpen,
    user,
    setIsAuthModalOpen,
    showToast
  } = useStore();

  const [activeImage, setActiveImage] = useState<string>(product.images[0]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Sync active image when product or variant changes
  useEffect(() => {
    if (product.images && product.images.length > 0) {
      setActiveImage(product.images[0]);
      setActiveImageIndex(0);
    }
  }, [product.id, product.images]);
  const [quantity, setQuantity] = useState(1);

  // Saree Customization & Add-ons state
  const [addonsList, setAddonsList] = useState<ProductAddon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<Record<string, boolean>>({});
  const [blouseSize, setBlouseSize] = useState<string>('38');
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState<boolean>(false);
  const [customizationMode, setCustomizationMode] = useState<'cart' | 'buy_now' | 'edit'>('cart');
  const [isWishlistAnimating, setIsWishlistAnimating] = useState(false);

  const handleWishlistToggle = () => {
    triggerHaptic('light');
    setIsWishlistAnimating(true);
    toggleWishlist(product);
    setTimeout(() => setIsWishlistAnimating(false), 500);
  };

  // Check if this saree is already in the shopping bag
  const cartItem = useMemo(() => {
    return cart.find(item => item.product.id === product.id);
  }, [cart, product.id]);

  const isProductInCart = Boolean(cartItem);

  // Synchronize addon selections per-product: resets cleanly when switching products
  useEffect(() => {
    const initialRecord: Record<string, boolean> = {};
    let initialBlouseSize = '38';

    if (cartItem?.selectedAddons && cartItem.selectedAddons.length > 0) {
      cartItem.selectedAddons.forEach(a => {
        initialRecord[a.id] = true;
        if (a.size) {
          initialBlouseSize = a.size;
        }
      });
    }

    setSelectedAddonIds(initialRecord);
    setBlouseSize(initialBlouseSize);
  }, [product.id, cartItem]);

  useEffect(() => {
    fetchProductAddons().then(addons => {
      setAddonsList(addons);
    });
  }, []);

  const hasBlouse = product.has_blouse !== false;

  const toggleAddon = (id: string) => {
    const nextSelected = {
      ...selectedAddonIds,
      [id]: !selectedAddonIds[id]
    };
    setSelectedAddonIds(nextSelected);

    // If saree is already in bag, immediately sync the cart item so user never has to re-add the item
    if (isProductInCart) {
      const nextActiveAddons = addonsList
        .filter(addon => {
          if (!nextSelected[addon.id]) return false;
          if (hasBlouse && addon.id === 'blouse_piece') return false;
          return true;
        })
        .map(addon => ({
          id: addon.id,
          title: addon.title,
          price: addon.price,
          size: addon.requires_size ? blouseSize : undefined
        }));

      updateCartItemAddons(product.id, nextActiveAddons);

      const isNowRemoved = !nextSelected[id];
      const addonTitle = addonsList.find(a => a.id === id)?.title || 'Service';
      if (isNowRemoved) {
        showToast(`Removed "${addonTitle}" from your bag.`, 'info');
      } else {
        showToast(`Added "${addonTitle}" to your bag.`, 'info');
      }
    }
  };

  const handleBlouseSizeChange = (newSize: string) => {
    setBlouseSize(newSize);
    if (isProductInCart && selectedAddonIds['stitch_blouse']) {
      const nextActiveAddons = activeSelectedAddons.map(a =>
        a.id === 'stitch_blouse' ? { ...a, size: newSize } : a
      );
      updateCartItemAddons(product.id, nextActiveAddons);
      showToast(`Updated blouse size to ${newSize}" in your bag.`, 'info');
    }
  };

  const displayPincode = currentPincode || defaultDeliveryPincode || '';
  const { result, checkPincode } = useCustomerLocation();

  useEffect(() => {
    if (displayPincode && displayPincode.length === 6) {
      checkPincode(displayPincode);
    }
  }, [displayPincode, checkPincode]);

  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);

  useEffect(() => {
    fetchDeliverySettings().then(setDeliverySettings).catch(console.error);
  }, []);

  // 3-Tier Delivery Logic:
  // Tier 1: Express (< 5 km from showroom) -> 20-Minute Express Delivery
  // Tier 2: Same Day (5 km to 10 km from showroom) -> Same Day Delivery with live countdown
  // Tier 3: Standard (> 10 km / rest of India) -> Tracked courier delivery
  const deliveryTier = useMemo<'express' | 'same_day' | 'standard'>(() => {
    const cleanPin = (displayPincode || '').trim();
    const maxExpressKm = Number(deliverySettings?.express_max_km ?? 5.0);
    const maxSameDayKm = Number(deliverySettings?.same_day_max_km ?? 10.0);

    // 1. Explicit Samastipur Town Center (< 5 km from showroom)
    if (cleanPin === '848101' || cleanPin === '848102' || cleanPin === (defaultDeliveryPincode || '848101')) {
      return 'express';
    }

    // 2. Explicit Samastipur Outer / Suburban Blocks (5 km to 10 km from showroom, e.g. 848134 Jitwarpur/Warisnagar)
    if (cleanPin === '848134' || (cleanPin.startsWith('8481') && cleanPin !== '848114')) {
      return 'same_day';
    }

    // 3. Dynamic distance check via GPS or backend route calculation
    if (result) {
      const dist = result.distanceKm !== undefined ? Number(result.distanceKm) : undefined;
      if (dist !== undefined) {
        if (dist <= maxExpressKm && (result.is20MinDelivery || result.isExpress || result.eligible)) {
          return 'express';
        }
        if (dist <= maxSameDayKm) {
          return 'same_day';
        }
        return 'standard';
      }
      if (result.is20MinDelivery) return 'express';
      if (result.options?.some((o: any) => o.id === 'same_day' && o.available)) return 'same_day';
    }

    return 'standard';
  }, [result, displayPincode, defaultDeliveryPincode, deliverySettings]);

  const is20Min = deliveryTier === 'express';
  const isSameDay = deliveryTier === 'same_day';

  const activeSelectedAddons = useMemo<SelectedAddon[]>(() => {
    return addonsList
      .filter(addon => {
        if (!selectedAddonIds[addon.id]) return false;
        // If saree already has blouse piece, do not offer extra fabric
        if (hasBlouse && addon.id === 'blouse_piece') return false;
        // Blouse stitching is only offered for standard delivery (not quick / same-day delivery)
        if (deliveryTier !== 'standard' && addon.id === 'stitch_blouse') return false;
        return true;
      })
      .map(addon => ({
        id: addon.id,
        title: addon.title,
        price: addon.price,
        size: addon.requires_size ? blouseSize : undefined
      }));
  }, [addonsList, selectedAddonIds, hasBlouse, blouseSize, deliveryTier]);

  const addonsTotal = useMemo(() => {
    return activeSelectedAddons.reduce((sum, a) => sum + a.price, 0);
  }, [activeSelectedAddons]);

  // Live countdown for Same-Day delivery cutoff (5 km - 10 km tier)
  const [sameDayCountdown, setSameDayCountdown] = useState<SameDayCountdownInfo>(() =>
    getSameDayCountdownInfo(deliverySettings?.same_day_cutoff_time ?? '17:00:00', '6:30 PM')
  );

  // Real-time 20-minute delivery ETA (< 5 km express tier)
  const [expressInfo, setExpressInfo] = useState<ExpressDeliveryInfo>(() =>
    getExpressDeliveryInfo(20)
  );

  useEffect(() => {
    const updateTimer = () => {
      setSameDayCountdown(
        getSameDayCountdownInfo(deliverySettings?.same_day_cutoff_time ?? '17:00:00', '6:30 PM')
      );
      setExpressInfo(getExpressDeliveryInfo(20));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [deliverySettings?.same_day_cutoff_time]);

  const timingStatus = useMemo(() => {
    return getExpressTimingStatus(result);
  }, [result]);

  const deliveryDateInfo = useMemo(() => {
    return getStandardDeliveryDateInfo(new Date(), deliverySettings?.standard_delivery_days ?? 3);
  }, [deliverySettings?.standard_delivery_days]);

  const activeDeliveryCharge = useMemo(() => {
    if (result?.options && Array.isArray(result.options)) {
      if (deliveryTier === 'express') {
        const expOpt = result.options.find((o: any) => o.id === 'express' && o.available);
        if (expOpt) return expOpt.charge;
      } else if (deliveryTier === 'same_day') {
        const sdOpt = result.options.find((o: any) => o.id === 'same_day' && o.available);
        if (sdOpt) return sdOpt.charge;
      }
      const stdOpt = result.options.find((o: any) => o.id === 'standard');
      if (stdOpt) return stdOpt.charge;
    }
    if (deliverySettings) {
      if (deliveryTier === 'express') return Number(deliverySettings.express_charge);
      if (deliveryTier === 'same_day') return Number(deliverySettings.same_day_charge);
      return Number(deliverySettings.standard_charge);
    }
    if (deliveryTier === 'express') return 29;
    if (deliveryTier === 'same_day') return 49;
    return 69;
  }, [result, deliveryTier, deliverySettings]);

  const deliveryChargeText = useMemo(() => {
    if (activeDeliveryCharge === 0) {
      if (deliveryTier === 'express') return 'Free express delivery';
      if (deliveryTier === 'same_day') return 'Free same-day delivery';
      return 'Free delivery';
    }
    if (deliveryTier === 'express') return `Express (₹${activeDeliveryCharge})`;
    if (deliveryTier === 'same_day') return `Same Day (₹${activeDeliveryCharge})`;
    return `Standard delivery (₹${activeDeliveryCharge})`;
  }, [activeDeliveryCharge, deliveryTier]);

  // Loading/success states for actions
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Design Variants state
  const [designVariants, setDesignVariants] = useState<Product[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Review Form state
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formText, setFormText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const isWishlisted = isInWishlist(product.id);
  const finalPrice = product.salePrice ?? product.price;
  const finalPriceWithAddons = finalPrice + addonsTotal;
  const discountPercent = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  // Recently viewed tracking
  const { viewedIds, recordView } = useRecentlyViewed();

  // Fetch color/design variants
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

  // Fetch product reviews
  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', product.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReviews(data);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [product.id]);

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

  useEffect(() => {
    recordView(product.id);
    trackViewItem(product);
  }, [product.id, recordView]);

  // Lightbox keyboard navigation
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

  const handleNotifyMe = () => {
    showToast(`We'll notify you when "${product.name}" is back in stock!`, 'info');
  };

  const handleWhatsAppInquiry = () => {
    const whatsappNumber = "+916203909946";
    const textMessage = `Namaste Shree Banarasi Sarees! 🌸
I would like a live daylight video of this saree:
Saree: ${product.name}
SKU: ${product.sku}
Price: ₹${finalPrice.toLocaleString('en-IN')}
Link: https://shreebanarasisarees.in/product/${product.slug}`;

    const encodedMessage = encodeURIComponent(textMessage);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const isAlreadyInCart = isProductInCart;

  const handleAddToCart = async () => {
    if (product.stock > 0) {
      triggerHaptic('medium');
      if (isProductInCart) {
        setIsCartOpen(true);
      } else if (addonsList.length > 0) {
        setCustomizationMode('cart');
        setIsCustomizationModalOpen(true);
      } else {
        setIsAddingToCart(true);
        await new Promise(resolve => setTimeout(resolve, 350));
        addToCart(product, quantity, []);
        setIsAddingToCart(false);
      }
    }
  };

  const handleBuyNow = async () => {
    if (product.stock > 0) {
      triggerHaptic('medium');
      if (isProductInCart) {
        setIsCartOpen(true);
      } else if (addonsList.length > 0) {
        setCustomizationMode('buy_now');
        setIsCustomizationModalOpen(true);
      } else {
        setIsBuyingNow(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        addToCart(product, quantity, []);
        setIsBuyingNow(false);
        setIsCartOpen(true);
      }
    }
  };

  const handleConfirmCustomization = (selectedAddons: SelectedAddon[], mode: 'cart' | 'buy_now' | 'edit') => {
    setIsCustomizationModalOpen(false);

    // Synchronize local PDP addon selections
    const addonMap: Record<string, boolean> = {};
    selectedAddons.forEach(a => {
      addonMap[a.id] = true;
      if (a.size) setBlouseSize(a.size);
    });
    setSelectedAddonIds(addonMap);

    if (isProductInCart) {
      updateCartItemAddons(product.id, selectedAddons);
      showToast(
        selectedAddons.length > 0
          ? 'Updated tailoring services in your bag.'
          : 'Updated bag (saree only).',
        'info'
      );
    } else {
      addToCart(product, quantity, selectedAddons);
    }

    if (mode === 'buy_now' || mode === 'edit') {
      setIsCartOpen(true);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!formTitle.trim() || !formText.trim()) {
      setFormError("Please enter both a title and review details.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Verified Buyer';

      const { error } = await supabase.from('product_reviews').insert([{
        product_id: product.id,
        user_id: user.id,
        rating: formRating,
        title: formTitle.trim(),
        review_text: formText.trim(),
        user_name: userName,
        status: 'approved'
      }]);

      if (error) {
        setFormError(error.message || "Failed to submit review.");
      } else {
        setFormSuccess("Thank you! Your review has been submitted.");
        setFormTitle('');
        setFormText('');
        fetchReviews();
        setTimeout(() => {
          setIsReviewModalOpen(false);
          setFormSuccess(null);
        }, 1800);
      }
    } catch (err: any) {
      setFormError(err.message || "Error submitting review.");
    } finally {
      setSubmitting(false);
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

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/sarees');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${product.name} | Shree Banarasi Sarees`,
      text: `Check out this beautiful ${product.fabric} saree: ${product.name}`,
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

  // Average rating and reviews calculation
  const totalReviewsCount = reviews.length > 0 ? reviews.length : (product.reviewsCount || 0);
  const avgRatingNum = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length)
    : (product.rating || 0);
  const avgRating = avgRatingNum > 0 ? avgRatingNum.toFixed(1) : null;

  // Similar products logic for "Similar weaves" section
  const similarProducts = PRODUCTS.filter(p => p.id !== product.id && (p.category === product.category || p.fabric === product.fabric)).slice(0, 6);

  return (
    <>
      <Header hideOnMobile />

      <main className="max-w-7xl mx-auto px-0 lg:px-8 pt-0 pb-28 lg:py-8 font-sans">
        {/* DESKTOP BREADCRUMB STRIP */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-sans text-[#7A6E65] mb-6">
          <Link href="/" className="hover:text-[#6B1725] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/sarees" className="hover:text-[#6B1725] transition-colors">Sarees</Link>
          <span>/</span>
          <span className="font-semibold text-[#292524]">{product.category}</span>
        </div>

        {/* ── RESPONSIVE PDP LAYOUT: 1-COLUMN MOBILE / 12-COLUMN DESKTOP GRID ── */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-start">

          {/* ── LEFT COLUMN: PRODUCT IMAGE GALLERY ── */}
          <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
            
            {/* MOBILE IMAGE CAROUSEL (Visible on < lg screens) */}
            <div className="lg:hidden relative aspect-[3/4] w-full overflow-hidden bg-[#FAF7F0] mb-6">
              <div
                ref={carouselRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory h-full no-scrollbar"
              >
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-full h-full flex-shrink-0 snap-center cursor-zoom-in relative"
                    onClick={() => setIsLightboxOpen(true)}
                  >
                    <img
                      src={img}
                      alt={`${product.name} - View ${idx + 1}`}
                      className="w-full h-full object-cover object-center"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  </div>
                ))}
              </div>

              {/* Mobile Header Action Overlay */}
              <div
                className="absolute inset-x-4 flex items-center justify-between z-20 pointer-events-none"
                style={{ top: 'max(1rem, env(safe-area-inset-top, 1rem))' }}
              >
                <button
                  onClick={handleBack}
                  className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-[#292524] hover:bg-white active:scale-95 transition-all cursor-pointer pointer-events-auto"
                  aria-label="Go back"
                >
                  <ChevronLeft size={22} />
                </button>
                <div className="flex items-center gap-2.5 pointer-events-auto">
                  <button
                    onClick={handleShare}
                    className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-[#292524] hover:bg-white active:scale-95 transition-all cursor-pointer"
                    aria-label="Share product"
                  >
                    <Share2 size={19} />
                  </button>
                  <button
                    onClick={handleWishlistToggle}
                    className="relative w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-[#292524] hover:bg-white active:scale-90 transition-all cursor-pointer"
                    aria-label="Save to Wishlist"
                  >
                    {isWishlistAnimating && (
                      <span className="absolute inset-0 rounded-full border-2 border-[#6B1725]/40 animate-heart-ring" />
                    )}
                    <Heart
                      size={19}
                      className={`transition-all duration-200 ${
                        isWishlisted ? 'fill-[#6B1725] text-[#6B1725]' : 'text-[#292524]'
                      } ${isWishlistAnimating ? 'animate-heart-pop' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* Mobile Out of Stock Badge */}
              {product.stock === 0 && (
                <div className="absolute top-20 inset-x-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="bg-[#292524]/85 backdrop-blur-md text-white text-xs font-bold font-serif px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-fadeIn">
                    <Bell size={13} />
                    Out of Stock
                  </div>
                </div>
              )}

              {/* Mobile Dots */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-1.5 z-10">
                  {product.images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeImageIndex === idx ? 'w-5 bg-white shadow-sm' : 'w-1.5 bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* DESKTOP HIGH-RES STAGE GALLERY (Visible on >= lg screens) */}
            <div className="hidden lg:block relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-[#FAF7F0] border border-[#E5DEC9] shadow-sm group cursor-zoom-in">
              <img
                src={activeImage}
                alt={product.name}
                className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out ${product.stock === 0 ? 'grayscale opacity-60 group-hover:scale-105' : 'group-hover:scale-105'}`}
                onClick={() => setIsLightboxOpen(true)}
              />
              {product.stock === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-[#292524]/85 backdrop-blur-sm text-white text-sm sm:text-base font-serif font-bold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-fadeIn">
                    <Bell size={16} />
                    Out of Stock
                  </div>
                </div>
              )}
              <div
                onClick={() => setIsLightboxOpen(true)}
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-[#292524] text-xs font-bold px-3 py-2 rounded-full shadow-md flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ZoomIn size={14} />
                <span>Zoom Photo</span>
              </div>
            </div>

            {/* DESKTOP THUMBNAIL STRIP */}
            {product.images.length > 1 && (
              <div className="hidden lg:grid grid-cols-5 gap-3 pt-2">
                {product.images.map((img, idx) => {
                  const isActive = activeImage === img;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveImage(img);
                        setActiveImageIndex(idx);
                      }}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#6B1725] ring-2 ring-[#B08A3C]/40 shadow-sm scale-102'
                          : 'border-[#E5DEC9] opacity-75 hover:opacity-100 hover:border-[#6B1725]/60'
                      }`}
                    >
                      <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: PRODUCT INFO & PRIMARY ACTIONS ── */}
          <div className="lg:col-span-5 space-y-5 px-4 sm:px-6 lg:px-0">
            
            {/* CATEGORY & TITLE */}
            <div className="space-y-1">
              <span className="text-[11px] font-sans font-bold tracking-widest text-[#B08A3C] uppercase block">
                {product.category}
              </span>
              <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#292524] leading-snug">
                {product.name}
              </h1>

              {/* RATING SUMMARY ROW */}
              {totalReviewsCount > 0 && avgRating ? (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('customer-reviews');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 pt-1 text-xs cursor-pointer hover:opacity-85 transition-opacity text-left"
                >
                  <div className="flex items-center gap-1 text-[#B08A3C]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i < Math.round(avgRatingNum) ? "fill-[#B08A3C] text-[#B08A3C]" : "text-stone-300"}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-[#292524]">{avgRating}</span>
                  <span className="text-[#7A6E65]">({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('customer-reviews');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 pt-1 text-xs text-[#7A6E65] hover:text-[#6B1725] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-0.5 text-stone-300">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} className="text-stone-300" />
                    ))}
                  </div>
                  <span className="font-medium text-[#7A6E65]">No reviews yet</span>
                  <span className="text-[#6B1725] font-semibold hover:underline">· Write first review</span>
                </button>
              )}
            </div>

            {/* PRICE ROW */}
            <div className="flex items-baseline gap-2.5 flex-wrap border-b border-[#F3ECE0] pb-4">
              <span className="text-2xl sm:text-3xl font-bold font-sans text-[#292524]">
                ₹{finalPriceWithAddons.toLocaleString('en-IN')}
              </span>
              {addonsTotal > 0 ? (
                <span className="text-xs text-[#6B1725] font-semibold bg-[#FAF6EE] px-2 py-0.5 rounded border border-[#E5DEC9]">
                  ₹{finalPrice.toLocaleString('en-IN')} saree + ₹{addonsTotal.toLocaleString('en-IN')} add-ons
                </span>
              ) : product.salePrice && (
                <span className="text-base text-[#7A6E65] line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
              {discountPercent > 0 && addonsTotal === 0 && (
                <span className="bg-[#FAF6EE] text-[#C25E00] border border-[#E5DEC9] px-2.5 py-0.5 rounded text-xs font-bold">
                  {discountPercent}% off
                </span>
              )}
              <span className="text-xs text-[#7A6E65] w-full mt-1">
                Inclusive of all taxes · Express shipping across India
              </span>
            </div>

            {/* BLOUSE PIECE HIGHLIGHT BADGE */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#292524] bg-[#FAF6EE] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5">
              <Scissors size={15} className="text-[#6B1725] shrink-0" />
              <span>
                <strong>Blouse Piece:</strong> {hasBlouse ? (product.blousePiece || 'Matching unstitched blouse piece (0.8m) included') : 'Not included (add-on available)'}
              </span>
            </div>

            {/* TAILORING SERVICES TRIGGER PILL */}
            {product.stock > 0 && addonsList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCustomizationMode(isProductInCart ? 'edit' : 'cart');
                  setIsCustomizationModalOpen(true);
                }}
                className="w-full flex items-center justify-between gap-3 text-left p-3 rounded-xl bg-[#FAF6EE] hover:bg-[#F5EEDC] border border-[#E8DFD1] hover:border-[#6B1725]/40 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725] shrink-0 group-hover:bg-[#6B1725]/15 transition-colors">
                    <Scissors size={14} className="text-[#6B1725]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#292524] flex items-center gap-1.5">
                      <span>Fall, Pico &amp; Tailoring</span>
                      {activeSelectedAddons.length > 0 && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          {activeSelectedAddons.length} Selected
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#7A6E65]">
                      {activeSelectedAddons.length > 0
                        ? activeSelectedAddons.map(a => a.title).join(', ')
                        : deliveryTier === 'standard'
                          ? 'Optional Fall & Pico, Inskirt & Blouse Stitching'
                          : 'Optional Fall & Pico & Inskirt (Stitching requires standard delivery)'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#6B1725] group-hover:underline shrink-0 flex items-center gap-0.5">
                  {activeSelectedAddons.length > 0 ? 'Edit' : 'Customize'} &rarr;
                </span>
              </button>
            )}

            {/* HIGH-END COLOR VARIANTS CONTAINER */}
            <div className="bg-[#FAF6EE]/60 border border-[#E5DEC9] rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#E5DEC9]/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Palette size={16} className="text-[#6B1725] shrink-0" />
                  <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#292524]">
                    Available Variants
                  </span>
                </div>
                <span className="text-xs font-medium text-[#7A6E65]">
                  Selected: <strong className="text-[#6B1725] font-bold">{product.color}</strong>
                </span>
              </div>

              {loadingVariants ? (
                <div className="flex items-center gap-2 text-xs text-[#7A6E65] py-3">
                  <div className="w-4 h-4 border-2 border-[#6B1725] border-t-transparent rounded-full animate-spin" />
                  <span>Loading weaver color options…</span>
                </div>
              ) : designVariants.length > 1 ? (
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                  {designVariants.map((variant) => {
                    const isSelected = variant.id === product.id;
                    const colorBg = getColorHex(variant.color);
                    const thumbImage = variant.images?.[0];

                    return (
                      <Link
                        key={variant.id}
                        href={`/product/${variant.slug}`}
                        className={`group relative flex-shrink-0 w-16 sm:w-20 aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#6B1725] ring-2 ring-[#B08A3C]/40 shadow-md scale-105'
                            : 'border-[#E5DEC9] opacity-80 hover:opacity-100 hover:border-[#6B1725]/60 hover:scale-102'
                        }`}
                        title={`${variant.name} (${variant.color})`}
                      >
                        {thumbImage ? (
                          <img
                            src={thumbImage}
                            alt={variant.color}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: colorBg }}
                          />
                        )}

                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#6B1725] text-white flex items-center justify-center shadow-xs">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}

                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent pt-3 pb-1 px-1 text-center">
                          <span className="text-[10px] font-bold text-white tracking-tight truncate block leading-tight">
                            {variant.color}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-1">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#6B1725] ring-2 ring-[#B08A3C]/30 shadow-xs shrink-0">
                    <img src={product.images[0]} alt={product.color} className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#6B1725] text-white flex items-center justify-center">
                      <Check size={9} strokeWidth={3} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#292524]">{product.color} Saree</div>
                    <div className="text-[11px] text-[#7A6E65]">Exclusive single weaver shade crafted for this piece</div>
                  </div>
                </div>
              )}
            </div>

            {/* EXCLUSIVITY CALLOUT CARD */}
            <div className="bg-[#FAF6EE] border border-[#E5DEC9] rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#6B1725] shrink-0 mt-1" />
              <p className="text-xs font-bold text-[#292524] leading-snug">
                Only one of this saree exists. <span className="font-normal text-[#7A6E65]">Handloom pieces aren&apos;t re-woven — it won&apos;t come back in stock.</span>
              </p>
            </div>

            {/* ── SINGLE UNIFIED EYE-CATCHING DELIVERY CARD ── */}
            <div className="space-y-2.5">
              <div
                onClick={openPincodeSheet}
                className="rounded-2xl border border-[#E9DFCF] bg-gradient-to-r from-[#FFFDF9] via-[#FAF6EE] to-[#FFF9F2] p-3.5 sm:p-4 shadow-2xs hover:border-[#B08A3C]/60 hover:shadow-xs transition-all cursor-pointer group select-none relative overflow-hidden"
              >
                <div className="flex items-center gap-2.5 sm:gap-3.5">
                  {/* Delivery Illustration */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border border-[#E5DEC9] p-1.5 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#6B1725]/50 group-hover:scale-105 transition-all">
                    <img
                      src={
                        deliveryTier === 'express'
                          ? '/expressdel.webp'
                          : deliveryTier === 'same_day'
                          ? '/sameday.webp'
                          : '/standarddel.webp'
                      }
                      alt={
                        deliveryTier === 'express'
                          ? 'Express Delivery'
                          : deliveryTier === 'same_day'
                          ? 'Same Day Delivery'
                          : 'Standard Delivery'
                      }
                      className={`w-full h-full object-contain ${
                        deliveryTier === 'express' ? 'animate-rider-pulse' : ''
                      }`}
                    />
                  </div>

                  {/* Single Focused Delivery Message */}
                  <div className="flex-1 min-w-0">
                    {deliveryTier === 'same_day' && (
                      <>
                        <div className="font-sans font-bold text-xs sm:text-[14px] text-[#6B1725] leading-snug">
                          <span>
                            <span className="sm:hidden">{sameDayCountdown.mobileHeadline}</span>
                            <span className="hidden sm:inline">{sameDayCountdown.headline}</span>
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-[#7A6E65] mt-0.5 leading-tight">
                          To <strong className="font-semibold text-[#292524]">{getQuickCity(displayPincode) ? `${getQuickCity(displayPincode)} (${displayPincode})` : displayPincode}</strong> · COD available
                        </p>
                      </>
                    )}

                    {deliveryTier === 'express' && (
                      <>
                        <div className="font-sans font-bold text-xs sm:text-[14px] text-[#15803D] leading-snug">
                          <span>
                            <span className="sm:hidden">{expressInfo.mobileHeadline}</span>
                            <span className="hidden sm:inline">{expressInfo.headline}</span>
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-[#7A6E65] mt-0.5 leading-tight">
                          Direct from showroom to <strong className="font-semibold text-[#292524]">{getQuickCity(displayPincode) ? `${getQuickCity(displayPincode)} (${displayPincode})` : displayPincode}</strong> · COD available
                        </p>
                      </>
                    )}

                    {deliveryTier === 'standard' && (
                      <>
                        <div className="font-sans font-bold text-xs sm:text-[14px] text-[#292524] leading-snug">
                          <span>{deliveryDateInfo.deliveryByText}</span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-[#7A6E65] mt-0.5 leading-tight">
                          To <strong className="font-semibold text-[#292524]">{getQuickCity(displayPincode) ? `${getQuickCity(displayPincode)} (${displayPincode})` : displayPincode}</strong> · Tracked express courier
                        </p>
                      </>
                    )}
                  </div>

                  {/* Change Pincode Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPincodeSheet();
                    }}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-[#FAF7F0] border border-[#D8CEBA] hover:border-[#6B1725]/40 text-[11px] sm:text-xs font-bold text-[#6B1725] shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ml-1"
                  >
                    <span>Change</span>
                  </button>
                </div>
              </div>

              {/* 15-Minute Doorstep Color & Fabric Inspection Window - Only for Express or Same-Day */}
              {(deliveryTier === 'express' || deliveryTier === 'same_day') && (
                <div className="bg-[#FAF7F0] border border-[#E8DFD1] rounded-2xl p-3 sm:p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725] shrink-0">
                        <PackageCheck size={14} className="text-[#6B1725]" />
                      </div>
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#292524]">
                        15-Min Doorstep Check &amp; Try
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300/60 px-2 py-0.5 rounded-full shrink-0">
                      Free Service
                    </span>
                  </div>
                  <p className="text-[11.5px] sm:text-xs text-[#6B625D] leading-relaxed">
                    Our delivery boy waits 15 mins at your doorstep. Open the box and check the saree fabric, design, and color. If the color looks different or you don&apos;t like it, change it within 30 mins or return it on the spot for free.
                  </p>
                </div>
              )}

              {/* Bottom Guarantee Trust Badges */}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#7A6E65] px-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Cash on Delivery</span>
                </span>
                <Link
                  href="/returns-refunds"
                  className="flex items-center gap-1.5 hover:text-[#6B1725] transition-colors"
                >
                  <RotateCcw size={13} className="text-[#B08A3C]" />
                  <span>3-day return</span>
                </Link>
                <Link
                  href="/shipping-policy"
                  className="flex items-center gap-1.5 hover:text-[#6B1725] transition-colors"
                >
                  <Truck size={13} className="text-[#B08A3C]" />
                  <span>Shipping Policy</span>
                </Link>
              </div>
            </div>

            {/* DESKTOP INLINE PRIMARY ACTION BUTTONS (Visible on >= lg screens) */}
            <div className="hidden lg:flex flex-col gap-3 py-2">
              {product.stock === 0 ? (
                <div className="space-y-3">
                  <button
                    onClick={handleNotifyMe}
                    className="w-full bg-[#292524] hover:bg-black text-white py-3.5 px-6 rounded-full font-serif font-bold text-sm shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <Bell size={18} />
                    <span>Notify Me When Available</span>
                  </button>
                  <button
                    onClick={handleWhatsAppInquiry}
                    className="w-full bg-white border-2 border-[#6B1725] text-[#6B1725] py-3.5 px-6 rounded-full font-serif font-bold text-sm hover:bg-[#6B1725]/5 cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    <span>Enquire on WhatsApp</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="flex-1 bg-[#6B1725] hover:bg-[#52111C] active:scale-95 disabled:opacity-85 text-white py-3.5 px-6 rounded-full font-serif font-bold text-sm shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 group"
                  >
                    {isAddingToCart ? (
                      <>
                        <Loader2 size={18} className="animate-spin text-white" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={18} className="group-hover:animate-bag-pop transition-transform" />
                        <span>{isAlreadyInCart ? 'Go to cart' : 'Add to Bag'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={isBuyingNow}
                    className="flex-1 bg-white border-2 border-[#6B1725] active:scale-95 disabled:opacity-85 text-[#6B1725] py-3.5 px-6 rounded-full font-serif font-bold text-sm hover:bg-[#6B1725]/5 cursor-pointer transition-all text-center flex items-center justify-center gap-2"
                  >
                    {isBuyingNow ? (
                      <>
                        <Loader2 size={18} className="animate-spin text-[#6B1725]" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>Buy Now{addonsTotal > 0 ? ` • ₹${(finalPriceWithAddons * quantity).toLocaleString('en-IN')}` : ''}</span>
                    )}
                  </button>

                  <button
                    onClick={handleWishlistToggle}
                    className="relative p-3.5 rounded-full border border-[#E5DEC9] text-[#292524] hover:bg-[#FAF6EE] active:scale-90 transition-all cursor-pointer"
                    title="Save to wishlist"
                  >
                    {isWishlistAnimating && (
                      <span className="absolute inset-0 rounded-full border-2 border-[#6B1725]/40 animate-heart-ring" />
                    )}
                    <Heart
                      size={20}
                      className={`transition-all duration-200 ${
                        isWishlisted ? 'fill-[#6B1725] text-[#6B1725]' : ''
                      } ${isWishlistAnimating ? 'animate-heart-pop' : ''}`}
                    />
                  </button>
                </div>
              )}
            </div>

            {/* WHATSAPP DAYLIGHT VIDEO CALLOUT CARD */}
            <div className="bg-[#FAF6EE] border border-[#E5DEC9] rounded-2xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <h4 className="font-sans font-bold text-xs sm:text-sm text-[#292524]">
                  Want a video of this saree in daylight?
                </h4>
                <p className="text-xs text-[#7A6E65] mt-0.5">
                  We&apos;ll send one on WhatsApp in a few minutes.
                </p>
              </div>
              <button
                onClick={handleWhatsAppInquiry}
                className="bg-[#6B1725] hover:bg-[#52111C] text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
              >
                <MessageCircle size={14} />
                Ask
              </button>
            </div>

            {/* IN-STORE LOCATION NOTE */}
            <div className="text-xs text-[#7A6E65] flex items-center gap-2">
              <MapPin size={14} className="text-[#B08A3C] shrink-0" />
              <span>In stock at our Samastipur shop — see it in person</span>
            </div>

            {/* ABOUT THIS WEAVE */}
            <div className="pt-2">
              <h3 className="font-serif text-lg font-bold text-[#292524] mb-1.5">
                About this weave
              </h3>
              <p className="text-sm font-sans text-[#7A6E65] leading-relaxed">
                {product.description || `Sheer ${product.fabric.toLowerCase()} in ${product.color.toLowerCase()} with gold zari buta — light enough for a full day of wear.`}
              </p>
            </div>

            {/* DETAILS SPECIFICATIONS TABLE */}
            <div className="pt-2">
              <h3 className="font-serif text-lg font-bold text-[#292524] mb-3">
                Details
              </h3>
              <div className="divide-y divide-[#F3ECE0] border-y border-[#F3ECE0] text-sm">
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#7A6E65]">Fabric</span>
                  <span className="font-medium text-[#292524]">{product.fabric}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#7A6E65]">Colour</span>
                  <span className="font-medium text-[#292524]">{product.color}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#7A6E65]">Occasion</span>
                  <span className="font-medium text-[#292524]">{product.occasion}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#7A6E65]">Length</span>
                  <span className="font-medium text-[#292524]">{product.length || '5.5 m saree'} + {product.blousePiece || '0.8 m blouse piece'}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#7A6E65]">Blouse Piece</span>
                  <span className="font-medium text-[#292524]">{product.blousePiece || 'Included (Unstitched)'}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#7A6E65]">Zari</span>
                  <span className="font-medium text-[#292524]">{product.work || 'Antique gold, tested'}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#7A6E65]">Care</span>
                  <span className="font-medium text-[#292524]">{product.care || 'Dry clean only'}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#7A6E65]">SKU</span>
                  <span className="font-medium text-[#292524]">{product.sku}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── FULL-WIDTH BOTTOM CUSTOMER REVIEWS SECTION ── */}
        <div id="customer-reviews" className="my-10 pt-6 border-t border-[#F3ECE0] px-4 sm:px-6 lg:px-0 scroll-mt-20">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#292524]">
                  Customer Reviews
                </h2>
                {totalReviewsCount > 0 && avgRating && (
                  <div className="bg-[#FAF6EE] border border-[#E5DEC9] text-[#6B1725] px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star size={12} className="fill-[#B08A3C] text-[#B08A3C]" />
                    <span>{avgRating} / 5</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#7A6E65] mt-0.5">
                {totalReviewsCount > 0
                  ? `Based on ${totalReviewsCount} verified customer ${totalReviewsCount === 1 ? 'review' : 'reviews'}`
                  : 'No reviews yet. Be the first to share your experience with this saree!'}
              </p>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  setIsAuthModalOpen(true);
                } else {
                  setIsReviewModalOpen(true);
                }
              }}
              className="bg-[#FAF6EE] hover:bg-[#6B1725] text-[#6B1725] hover:text-white border border-[#6B1725] px-4 py-2 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Star size={13} />
              Write a review
            </button>
          </div>

          {loadingReviews ? (
            <div className="py-8 text-center text-xs text-[#7A6E65]">
              <div className="w-5 h-5 border-2 border-[#6B1725] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading reviews…
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white border border-[#E5DEC9] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#FAF6EE] border border-[#E5DEC9] text-[#6B1725] font-serif font-bold text-xs flex items-center justify-center shrink-0">
                        {rev.user_name?.[0]?.toUpperCase() || 'SBS'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#292524] flex items-center gap-1.5">
                          {rev.user_name || 'Verified Customer'}
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-normal">
                            ✓ Verified Buyer
                          </span>
                        </h4>
                        <div className="flex items-center gap-1 text-[#B08A3C] mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={11}
                              className={i < (rev.rating || 5) ? 'fill-[#B08A3C]' : 'text-stone-300'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#7A6E65]">
                      {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {rev.title && (
                    <h5 className="font-serif font-bold text-xs text-[#292524]">
                      {rev.title}
                    </h5>
                  )}
                  <p className="text-xs font-sans text-[#7A6E65] leading-relaxed">
                    {rev.review_text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#FAF6EE] border border-[#E5DEC9] rounded-2xl p-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-white text-[#B08A3C] flex items-center justify-center mx-auto border border-[#E5DEC9]">
                <Star size={18} />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#292524]">
                Be the first to review this weave
              </h4>
              <p className="text-xs text-[#7A6E65] max-w-sm mx-auto">
                Have you seen or ordered this piece? Share your thoughts with fellow saree lovers!
              </p>
              <button
                onClick={() => {
                  if (!user) {
                    setIsAuthModalOpen(true);
                  } else {
                    setIsReviewModalOpen(true);
                  }
                }}
                className="mt-2 inline-block bg-[#6B1725] hover:bg-[#52111C] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-md transition-colors cursor-pointer"
              >
                Write a review
              </button>
            </div>
          )}
        </div>

        {/* ── SIMILAR WEAVES SECTION ── */}
        {similarProducts.length > 0 && (
          <div className="mt-6 mb-2 px-4 sm:px-6 lg:px-0">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#292524] mb-4">
              Similar weaves
            </h2>
            <div className="no-scrollbar flex gap-3.5 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
              {similarProducts.map((simProd) => (
                <div key={simProd.id} className="w-[190px] sm:w-[230px] md:w-[250px] shrink-0 snap-start">
                  <ProductCard product={simProd} />
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* RECENTLY VIEWED CAROUSEL */}
      <RecentlyViewed viewedIds={viewedIds} excludeId={product.id} />

      <Footer />

      {/* ── STICKY BOTTOM ACTION BAR (ONLY ON MOBILE - DOCKED TO SCREEN BOTTOM) ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#FFFDF9]/96 backdrop-blur-xl border-t border-[#E9DED1] shadow-[0_-8px_28px_rgba(41,37,36,0.12)] select-none md:hidden">
        {deliveryTier === 'same_day' && (
          <div className="bg-[#FAF6EE] border-b border-[#E9DED1] px-4 py-1.5 text-[11px] text-[#6B1725] font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">{sameDayCountdown.mobileHeadline}</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/60 px-1.5 py-0.5 rounded shrink-0 ml-2">
              Same-Day
            </span>
          </div>
        )}
        {deliveryTier === 'express' && (
          <div className="bg-[#F0FDF4] border-b border-emerald-200 px-4 py-1.5 text-[11px] text-emerald-950 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">{expressInfo.stickyHeadline} · Direct from showroom</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/60 px-1.5 py-0.5 rounded shrink-0 ml-2">
              Express
            </span>
          </div>
        )}
        <div className="px-4 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-3">
        {/* Left: Quick Wishlist toggle + Price */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleWishlistToggle}
            className="native-press relative w-11 h-11 rounded-2xl border border-[#E9DED1] bg-[#FAF7F0] flex items-center justify-center text-[#292524] cursor-pointer shrink-0 shadow-sm active:scale-90 transition-all overflow-hidden"
            aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            {isWishlistAnimating && (
              <span className="absolute inset-0 rounded-2xl border-2 border-[#6B1725]/40 animate-heart-ring" />
            )}
            <Heart
              size={18}
              className={`transition-all duration-200 ${
                isWishlisted ? 'fill-[#6B1725] text-[#6B1725]' : 'text-[#292524]'
              } ${isWishlistAnimating ? 'animate-heart-pop' : ''}`}
            />
          </button>
          <div>
            <div className="font-sans text-base font-bold text-[#292524] leading-tight">
              ₹{finalPriceWithAddons.toLocaleString('en-IN')}
            </div>
            {addonsTotal > 0 ? (
              <span className="text-[10px] font-semibold text-[#6B1725] block">
                Incl. add-ons
              </span>
            ) : product.stock === 0 ? (
              <span className="text-[11px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 block">
                Out of Stock
              </span>
            ) : (
              <div className="text-[11px] font-bold text-[#6B1725] leading-tight">
                Only {product.stock} left
              </div>
            )}
          </div>
        </div>

        {/* Right: Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {product.stock === 0 ? (
            <button
              onClick={handleNotifyMe}
              className="native-press flex-1 bg-[#292524] hover:bg-black active:scale-95 text-white min-h-12 py-3 px-5 rounded-2xl text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-transform"
            >
              <Bell size={15} />
              Notify Me
            </button>
          ) : (
            <>
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="native-press bg-[#6B1725] hover:bg-[#52111C] active:scale-95 disabled:opacity-85 text-white min-h-12 py-3 px-4 rounded-2xl text-sm font-bold shadow-[0_5px_14px_rgba(107,23,37,0.22)] cursor-pointer flex items-center justify-center gap-1.5 min-w-[105px] transition-transform duration-150"
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-white" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={15} className={`text-white transition-transform ${isAlreadyInCart ? '' : 'group-hover:animate-bag-pop'}`} />
                    <span>{isAlreadyInCart ? 'Go to cart' : 'Add to Bag'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isBuyingNow}
                className="native-press bg-white border-2 border-[#6B1725] active:scale-95 disabled:opacity-85 text-[#6B1725] min-h-12 py-3 px-4 rounded-2xl text-sm font-bold hover:bg-[#6B1725]/5 cursor-pointer flex items-center justify-center gap-1.5 min-w-[95px] transition-transform duration-150"
              >
                {isBuyingNow ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-[#6B1725]" />
                    <span>Wait...</span>
                  </>
                ) : (
                  <span>Buy now{addonsTotal > 0 ? ` • ₹${finalPriceWithAddons.toLocaleString('en-IN')}` : ''}</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>

      {/* WRITE A REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsReviewModalOpen(false)} />
          <div className="relative z-10 w-full max-w-lg bg-[#FAF7F0] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 animate-slide-in-from-bottom border border-[#E5DEC9]">
            <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#292524]">
                  Write a Customer Review
                </h3>
                <p className="text-xs text-[#7A6E65] mt-0.5">
                  Share your experience with {product.name}
                </p>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-full text-[#7A6E65] hover:text-[#292524] hover:bg-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-start gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-700" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1 text-center">
                <label className="text-xs font-bold text-[#7A6E65] uppercase tracking-wider font-serif">Rating</label>
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
                        size={26}
                        className={((hoverRating || formRating) >= star) ? 'fill-[#B08A3C] text-[#B08A3C]' : 'text-stone-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="review-title" className="text-xs font-bold text-[#7A6E65] uppercase tracking-wider">Title</label>
                <input
                  id="review-title"
                  type="text"
                  required
                  maxLength={100}
                  disabled={submitting}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Stunning Banarasi weave & beautiful sheen!"
                  className="w-full bg-white border border-[#E5DEC9] focus:border-[#6B1725] text-xs text-[#292524] rounded-xl px-3.5 py-2.5 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="review-text" className="text-xs font-bold text-[#7A6E65] uppercase tracking-wider">Review</label>
                <textarea
                  id="review-text"
                  required
                  rows={4}
                  maxLength={1000}
                  disabled={submitting}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Tell us about the fabric feel, drape quality, color accuracy..."
                  className="w-full bg-white border border-[#E5DEC9] focus:border-[#6B1725] text-xs text-[#292524] rounded-xl px-3.5 py-2.5 outline-none transition-colors resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-3 border border-[#E5DEC9] text-[#7A6E65] rounded-full font-serif font-bold text-xs tracking-wider uppercase hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-[#6B1725] text-[#FFFFFF] rounded-full font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#52111C] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin text-white" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX OVERLAY */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-[#292524]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 bg-white/15 hover:bg-white/30 text-white p-2.5 rounded-full transition-colors z-50 cursor-pointer"
            aria-label="Close image zoom"
          >
            <X size={22} />
          </button>

          <div className="relative w-full max-w-4xl max-h-[75vh] flex items-center justify-center">
            <img
              src={activeImage}
              alt={product.name}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* SAREE CUSTOMIZATION & TAILORING POPUP / BOTTOM SHEET */}
      <SareeCustomizationModal
        key={product.id}
        isOpen={isCustomizationModalOpen}
        onClose={() => setIsCustomizationModalOpen(false)}
        product={product}
        addonsList={addonsList}
        initialSelectedAddons={activeSelectedAddons}
        mode={customizationMode}
        allowBlouseStitching={deliveryTier === 'standard'}
        onConfirm={handleConfirmCustomization}
      />
    </>
  );
}
