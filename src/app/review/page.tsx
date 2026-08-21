"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '../../context/StoreContext';
import {
  Star,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Search,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  PackageCheck,
  Calendar,
  User,
  Clock,
  ChevronRight
} from 'lucide-react';
import {
  fetchOrderDetailsForReview,
  OrderForReviewDetails,
  OrderReviewItem,
  supabase
} from '../../data/supabase';

function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialOrderId = searchParams.get('orderId') || searchParams.get('order_id') || '';

  const { user, setIsAuthModalOpen, showToast } = useStore();

  const [inputOrderId, setInputOrderId] = useState(initialOrderId);
  const [activeOrderId, setActiveOrderId] = useState(initialOrderId);
  const [orderData, setOrderData] = useState<OrderForReviewDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review submission state per product
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [submittingMap, setSubmittingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});
  const [successMap, setSuccessMap] = useState<Record<string, string | null>>({});

  // Sync active order ID from query parameter
  useEffect(() => {
    const q = searchParams.get('orderId') || searchParams.get('order_id');
    if (q) {
      setInputOrderId(q);
      setActiveOrderId(q);
    }
  }, [searchParams]);

  // Fetch order data when activeOrderId changes
  useEffect(() => {
    if (!activeOrderId.trim()) {
      setOrderData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    fetchOrderDetailsForReview(activeOrderId)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setOrderData(data);
          // Pre-populate rating/title/text states for unreviewed items
          const initRatings: Record<string, number> = {};
          const initTitles: Record<string, string> = {};
          const initTexts: Record<string, string> = {};

          data.items.forEach((item) => {
            if (item.existingReview) {
              initRatings[item.productId] = item.existingReview.rating;
              initTitles[item.productId] = item.existingReview.title;
              initTexts[item.productId] = item.existingReview.review_text;
            }
          });

          setRatings(initRatings);
          setTitles(initTitles);
          setTexts(initTexts);
        } else {
          setOrderData(null);
          setErrorMsg(`No order found matching "${activeOrderId}". Please verify your order number.`);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error loading order for review:', err);
        setErrorMsg('Failed to load order details. Please check your internet connection.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeOrderId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputOrderId.trim()) {
      setErrorMsg('Please enter an Order ID or Order Number.');
      return;
    }
    setActiveOrderId(inputOrderId.trim());
    router.push(`/review?orderId=${encodeURIComponent(inputOrderId.trim())}`);
  };

  const handleReviewSubmit = async (item: OrderReviewItem) => {
    const prodId = item.productId;
    const rating = ratings[prodId] || 0;
    const title = (titles[prodId] || '').trim();
    const reviewText = (texts[prodId] || '').trim();

    if (rating < 1 || rating > 5) {
      setErrorMap(prev => ({ ...prev, [prodId]: "Please select a star rating (1-5 stars)." }));
      return;
    }
    if (!title) {
      setErrorMap(prev => ({ ...prev, [prodId]: "Please enter a headline for your review." }));
      return;
    }
    if (!reviewText) {
      setErrorMap(prev => ({ ...prev, [prodId]: "Please write a brief summary of your feedback." }));
      return;
    }

    if (!user) {
      setIsAuthModalOpen(true);
      showToast("Please log in to submit your verified customer review.");
      return;
    }

    setSubmittingMap(prev => ({ ...prev, [prodId]: true }));
    setErrorMap(prev => ({ ...prev, [prodId]: null }));
    setSuccessMap(prev => ({ ...prev, [prodId]: null }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzqlsawxvvyvsstyzzff.supabase.co'}/functions/v1/verify-review`,
        {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6chwvgIpbfCpeEZrkS9VYg_IO__zSpY',
            'Authorization': `Bearer ${token || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            product_id: prodId,
            order_id: orderData?.id,
            rating,
            title,
            review_text: reviewText
          })
        }
      );

      const resData = await response.json().catch(() => ({}));

      if (response.status === 201 || response.ok) {
        setSuccessMap(prev => ({
          ...prev,
          [prodId]: "Thank you! Your review has been submitted successfully."
        }));

        // Refresh order data to reflect updated review status
        if (activeOrderId) {
          const updated = await fetchOrderDetailsForReview(activeOrderId);
          if (updated) setOrderData(updated);
        }
      } else {
        if (response.status === 401) {
          setIsAuthModalOpen(true);
          setErrorMap(prev => ({ ...prev, [prodId]: "Please log in to submit a review." }));
        } else if (response.status === 403) {
          setErrorMap(prev => ({ ...prev, [prodId]: "Only verified purchasers of this order can submit a review." }));
        } else if (response.status === 409) {
          setErrorMap(prev => ({ ...prev, [prodId]: "You have already reviewed this saree for this order." }));
        } else {
          setErrorMap(prev => ({
            ...prev,
            [prodId]: resData.message || resData.error || "Could not submit review. Please try again."
          }));
        }
      }
    } catch (err: any) {
      console.error("Submit review error:", err);
      setErrorMap(prev => ({ ...prev, [prodId]: "Network error. Please try again." }));
    } finally {
      setSubmittingMap(prev => ({ ...prev, [prodId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] font-sans text-dark-brown flex flex-col">
      {/* Sleek Minimalist Top Navigation Bar (Replacing heavy site Header) */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#E8DFD5] sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img src="/brand_logo.png" alt="Shree Banarasi Sarees" className="h-8 w-auto object-contain" />
          {/* <div className="flex flex-col">
            <span className="font-serif font-bold text-dark-brown text-sm sm:text-base tracking-tight group-hover:text-maroon transition-colors leading-none">
              Shree Banarasi Sarees
            </span>
            <span className="text-[10px] text-gold uppercase tracking-widest font-serif font-medium mt-0.5">
              Verified Order Review
            </span>
          </div> */}
        </Link>

        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFF9F0] border border-[#C9A45C]/40 text-maroon hover:bg-maroon hover:text-white transition-all text-xs font-serif font-semibold shadow-2xs"
        >
          <ArrowLeft size={14} />
          <span>My Orders</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">


        {/* Error Banner */}
        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-800 text-xs font-semibold rounded-2xl border border-red-200 flex items-center gap-3 animate-fadeIn">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="bg-white p-6 rounded-2xl border border-[#EAE2D8] space-y-4 animate-pulse">
            <div className="h-5 bg-cream/60 rounded w-1/3" />
            <div className="h-20 bg-cream/40 rounded-xl" />
            <div className="h-40 bg-cream/30 rounded-xl" />
          </div>
        )}

        {/* Empty State / Prompt to enter Order ID */}
        {!loading && !orderData && !errorMsg && (
          <div className="bg-white border border-[#EAE2D8] rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xs flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[#FFF9F0] border border-[#C9A45C]/30 flex items-center justify-center text-maroon shadow-inner">
              <PackageCheck size={28} />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="font-serif text-base font-bold text-dark-brown">Have an order to review?</h3>
              <p className="text-xs text-dark-brown/65 leading-relaxed font-sans">
                Open your review link from your delivered order notification or view your delivered orders.
              </p>
            </div>
            <Link
              href="/account"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF9F0] border border-[#C9A45C]/40 text-maroon font-serif font-bold text-xs rounded-xl hover:bg-maroon hover:text-white transition-all shadow-2xs mt-2"
            >
              <ShoppingBag size={14} />
              View Delivered Orders
            </Link>
          </div>
        )}

        {/* Order Details & Product Review Cards */}
        {!loading && orderData && (
          <div className="space-y-6 animate-fadeIn">

            {/* Order Summary Strip */}
            <div className="bg-white border border-[#EAE2D8] px-5 py-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-dark-brown/40 uppercase font-bold text-[10px] tracking-wider">Order</span>
                <span className="font-mono font-extrabold text-maroon text-sm uppercase">{orderData.orderNumber}</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  {orderData.orderStatus}
                </span>
              </div>

              <div className="flex items-center gap-4 text-dark-brown/70 text-[11px]">
                <span className="flex items-center gap-1 font-medium">
                  <User size={12} className="text-dark-brown/40" /> {orderData.customerName}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 font-medium">
                  <Calendar size={12} className="text-dark-brown/40" /> {new Date(orderData.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </span>
              </div>
            </div>

            {/* Items to Review */}
            {(() => {
              const unreviewedItems = orderData.items.filter(item => !item.existingReview);

              if (unreviewedItems.length === 0) {
                return (
                  <div className="bg-white border border-[#EAE2D8] rounded-2xl p-8 sm:p-10 text-center space-y-4 shadow-xs flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-inner">
                      <CheckCircle2 size={28} />
                    </div>
                    <div className="space-y-1 max-w-md">
                      <h3 className="font-serif text-base font-bold text-dark-brown">All Items Reviewed!</h3>
                      <p className="text-xs text-dark-brown/65 leading-relaxed font-sans">
                        Thank you! You have already submitted reviews for all items in Order #{orderData.orderNumber}.
                      </p>
                    </div>
                    <Link
                      href="/account"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF9F0] border border-[#C9A45C]/40 text-maroon font-serif font-bold text-xs rounded-xl hover:bg-maroon hover:text-white transition-all shadow-2xs mt-2"
                    >
                      <ShoppingBag size={14} />
                      View My Delivered Orders
                    </Link>
                  </div>
                );
              }

              return (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-base font-bold text-dark-brown flex items-center gap-2">
                      <Star size={18} className="text-gold fill-gold" />
                      Pending Reviews ({unreviewedItems.length})
                    </h2>
                  </div>

                  {unreviewedItems.map((item, idx) => {
                    const prodId = item.productId;
                    const rating = ratings[prodId] || 0;
                    const hoverRating = hoverRatings[prodId] || 0;
                    const title = titles[prodId] || '';
                    const reviewText = texts[prodId] || '';
                    const isSubmitting = submittingMap[prodId] || false;
                    const itemError = errorMap[prodId] || null;
                    const itemSuccess = successMap[prodId] || null;

                    return (
                      <div
                        key={prodId || idx}
                        className="bg-white border border-[#EAE2D8] rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all space-y-5"
                      >
                        {/* Item Product Row */}
                        <div className="flex gap-4 items-center border-b border-[#F2ECE6] pb-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-20 object-cover rounded-lg border border-[#EAE2D8] bg-[#FFF9F0] flex-shrink-0"
                          />

                          <div className="flex-grow space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-gold uppercase tracking-wider font-serif bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                                {item.fabric} Saree
                              </span>
                            </div>

                            <h3 className="font-serif text-sm sm:text-base font-bold text-dark-brown leading-snug">
                              {item.name}
                            </h3>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-dark-brown/60 pt-0.5 font-sans">
                              <span className="font-mono text-[11px]">SKU: {item.sku}</span>
                              {item.color && (
                                <>
                                  <span>&bull;</span>
                                  <span>Color: <strong>{item.color}</strong></span>
                                </>
                              )}
                              <span>&bull;</span>
                              <span className="font-serif font-bold text-maroon">₹{item.price.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>

                        {/* UNREVIEWED FORM INPUT VIEW */}
                        <div className="space-y-4 pt-1">

                          {itemError && (
                            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-100 flex items-start gap-2 animate-fadeIn">
                              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                              <span>{itemError}</span>
                            </div>
                          )}

                          {itemSuccess && (
                            <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-xl border border-green-100 flex items-start gap-2 animate-fadeIn">
                              <CheckCircle2 size={15} className="text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{itemSuccess}</span>
                            </div>
                          )}

                          {/* Rating Selector */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-dark-brown/70 uppercase tracking-wider font-serif">
                              Overall Rating *
                            </label>
                            <div className="flex items-center gap-1.5 py-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  disabled={isSubmitting}
                                  onClick={() => setRatings(prev => ({ ...prev, [prodId]: star }))}
                                  onMouseEnter={() => setHoverRatings(prev => ({ ...prev, [prodId]: star }))}
                                  onMouseLeave={() => setHoverRatings(prev => ({ ...prev, [prodId]: 0 }))}
                                  className="p-0.5 text-gold transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer"
                                  aria-label={`Rate ${star} star`}
                                >
                                  <Star
                                    size={24}
                                    className={((hoverRating || rating) >= star) ? 'fill-gold text-gold' : 'text-dark-brown/20'}
                                  />
                                </button>
                              ))}
                              <span className="text-xs font-serif font-bold text-maroon ml-2">
                                {rating > 0 ? `${rating} / 5` : 'Select rating'}
                              </span>
                            </div>
                          </div>

                          {/* Title Input */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-dark-brown/70 uppercase tracking-wider font-sans">
                              Review Title *
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={100}
                              disabled={isSubmitting}
                              value={title}
                              onChange={(e) => setTitles(prev => ({ ...prev, [prodId]: e.target.value }))}
                              placeholder="e.g. Beautiful fabric quality & drape!"
                              className="w-full bg-[#FFF9F0]/40 border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded-xl px-3 py-2 outline-none transition-all"
                            />
                          </div>

                          {/* Review Content */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-dark-brown/70 uppercase tracking-wider font-sans">
                              Review Details *
                            </label>
                            <textarea
                              required
                              rows={3}
                              maxLength={1000}
                              disabled={isSubmitting}
                              value={reviewText}
                              onChange={(e) => setTexts(prev => ({ ...prev, [prodId]: e.target.value }))}
                              placeholder="Tell us about the fabric quality, color accuracy, and overall experience..."
                              className="w-full bg-[#FFF9F0]/40 border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded-xl px-3 py-2 outline-none transition-all resize-none font-sans"
                            />
                          </div>

                          {/* Submit Action */}
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleReviewSubmit(item)}
                              disabled={isSubmitting}
                              className="px-5 py-2.5 bg-maroon hover:bg-maroon-dark text-white font-serif font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {isSubmitting ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                'Submit Review'
                              )}
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              );
            })()}


          </div>
        )}

      </main>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F5]">
        <div className="w-8 h-8 border-4 border-maroon border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
