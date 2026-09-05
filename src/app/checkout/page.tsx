"use client";

import React, { useState, Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore, CartItem } from '../../context/StoreContext';
import {
  CheckCircle,
  MapPin,
  CreditCard,
  Landmark,
  Truck,
  ShoppingBag,
  ArrowLeft,
  Lock,
  Plus,
  MessageSquare,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Tag,
  ChevronDown,
  ChevronUp,
  Gift,
  Check,
  Phone,
  User,
  ExternalLink,
  ChevronLeft,
  Zap,
  Banknote,
  Smartphone,
  Loader2,
  X
} from 'lucide-react';
import { checkDeliveryServiceability, createCashfreeOrder, getProductSlug, supabase } from '../../data/supabase';
import { load } from '@cashfreepayments/cashfree-js';
import { trackBeginCheckout, trackPurchase } from '../../lib/gtag';
import { IconMarqueeLoader } from '../../components/IconMarqueeLoader';
import { fetchPincodeDetails } from '../../lib/pincodeLookup';

const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 99;

// Valid Coupons
const VALID_COUPONS: Record<string, { discountPercent?: number; fixedDiscount?: number; minOrder: number; description: string }> = {
  'WELCOME10': { discountPercent: 10, minOrder: 1000, description: '10% OFF on orders over ₹1,000' },
  'SHREE500': { fixedDiscount: 500, minOrder: 3000, description: '₹500 OFF on orders over ₹3,000' },
  'FESTIVE15': { discountPercent: 15, minOrder: 5000, description: '15% OFF on orders over ₹5,000' },
  'BANARASI10': { discountPercent: 10, minOrder: 1500, description: '10% OFF on Banarasi collection' },
};

const INDIAN_STATES = [
  "Bihar", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi"
];

function CheckoutContent() {
  const router = useRouter();
  const [cashfreeSDK, setCashfreeSDK] = useState<any>(null);

  useEffect(() => {
    load({ mode: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox' })
      .then((cf: any) => setCashfreeSDK(cf))
      .catch((err: any) => console.error('Failed to load Cashfree SDK:', err));
  }, []);

  const {
    cart,
    placeOrder,
    clearCart,
    userPhone,
    loginUser,
    deliveryInfo,
    setDeliveryInfo,
    checkedPincode,
    setCheckedPincode,
    shippingAddresses,
    saveShippingAddress,
    user,
    userProfile,
    isHydrated,
    setIsAuthModalOpen
  } = useStore();

  // Route Protection: Open AuthModal if unauthenticated
  useEffect(() => {
    if (isHydrated && !user) {
      setIsAuthModalOpen(true);
    }
  }, [isHydrated, user, setIsAuthModalOpen]);

  // Order submission states
  const [isOrdered, setIsOrdered] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  // Form Fields - Dynamic initialization
  const isPhoneValid = userPhone && /^\d{10}$/.test(userPhone);
  const [mobileNumber, setMobileNumber] = useState(isPhoneValid ? userPhone : '');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Bihar');
  const [pinCode, setPinCode] = useState(checkedPincode || '');
  const [landmark, setLandmark] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Delivery & Payment selection
  const [deliveryMethod, setDeliveryMethod] = useState<'Home Delivery' | 'Store Pickup'>('Home Delivery');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash on Delivery' | 'Card' | 'Net Banking'>('Cash on Delivery');

  // Saved Addresses selection
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');

  // Coupon state
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Gift Order state
  const [isGift, setIsGift] = useState(false);
  const [giftRecipientName, setGiftRecipientName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');

  // Validation & Loading States
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [pincodeSuccessMsg, setPincodeSuccessMsg] = useState<string | null>(null);

  // Auto-fill user email if logged in
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  // Sync pincode from context
  useEffect(() => {
    if (checkedPincode && !pinCode) {
      setPinCode(checkedPincode);
    }
  }, [checkedPincode, pinCode]);

  // Auto-prefill selected or default address for logged-in user or profile info
  useEffect(() => {
    if (shippingAddresses && shippingAddresses.length > 0 && !hasPrefilled) {
      const savedSelectedId = typeof window !== 'undefined' ? sessionStorage.getItem('selected_delivery_address_id') : null;
      let targetAddr = null;
      if (savedSelectedId) {
        targetAddr = shippingAddresses.find(a => a.id === savedSelectedId);
      }
      if (!targetAddr) {
        targetAddr = shippingAddresses.find(a => a.is_default) || shippingAddresses[0];
      }
      if (targetAddr) {
        setFullName(targetAddr.full_name || '');
        setMobileNumber(targetAddr.phone || (isPhoneValid ? userPhone : ''));
        setAddress(targetAddr.address_line1 + (targetAddr.address_line2 ? ', ' + targetAddr.address_line2 : ''));
        setLandmark(targetAddr.landmark || '');
        setCity(targetAddr.city || '');
        if (targetAddr.state) {
          setState(targetAddr.state);
        }
        setPinCode(targetAddr.pincode || '');
        if (targetAddr.pincode) {
          handleCheckPincode(targetAddr.pincode);
        }
        setHasPrefilled(true);
        setSelectedAddressId(targetAddr.id);
      }
    } else if (userProfile && !hasPrefilled && (!shippingAddresses || shippingAddresses.length === 0)) {
      if (userProfile.full_name && !fullName) setFullName(userProfile.full_name);
      if (userProfile.phone && !mobileNumber) setMobileNumber(userProfile.phone);
      if (userProfile.email && !email) setEmail(userProfile.email);
    }
  }, [shippingAddresses, userProfile, hasPrefilled, isPhoneValid, userPhone]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const itemPrice = item.product.salePrice ?? item.product.price;
      return total + itemPrice * item.quantity;
    }, 0);
  }, [cart]);

  const originalTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }, [cart]);

  const totalProductDiscount = originalTotal - subtotal;

  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || deliveryMethod === 'Store Pickup';
  const shippingFee = deliveryMethod === 'Home Delivery'
    ? (isFreeShipping ? 0 : (deliveryInfo?.delivery_charge ?? STANDARD_SHIPPING_FEE))
    : 0;

  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.discountAmount;
  }, [appliedCoupon]);

  const grandTotal = Math.max(0, subtotal - couponDiscountAmount + shippingFee);

  // Track GA4 begin_checkout
  const hasTrackedCheckout = React.useRef(false);
  useEffect(() => {
    if (cart.length > 0 && grandTotal > 0 && !hasTrackedCheckout.current) {
      hasTrackedCheckout.current = true;
      trackBeginCheckout(cart, grandTotal);
    }
  }, [cart, grandTotal]);

  // Re-validate coupon when subtotal changes
  useEffect(() => {
    if (appliedCoupon) {
      const couponRule = VALID_COUPONS[appliedCoupon.code];
      if (couponRule && subtotal < couponRule.minOrder) {
        setAppliedCoupon(null);
        setCouponError(`Coupon ${appliedCoupon.code} requires min order of ₹${couponRule.minOrder.toLocaleString('en-IN')}`);
      } else if (couponRule) {
        let disc = 0;
        if (couponRule.discountPercent) {
          disc = Math.round((subtotal * couponRule.discountPercent) / 100);
        } else if (couponRule.fixedDiscount) {
          disc = couponRule.fixedDiscount;
        }
        setAppliedCoupon({
          code: appliedCoupon.code,
          discountAmount: disc,
          description: couponRule.description
        });
      }
    }
  }, [subtotal]);

  // Handle PIN Code Validation via calculate-delivery Edge Function
  const handleCheckPincode = async (targetPincode: string) => {
    const cleanPin = targetPincode.replace(/\D/g, '').slice(0, 6);
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setErrorMsg("Please enter a valid 6-digit pincode.");
      setPincodeSuccessMsg(null);
      return;
    }

    setErrorMsg("");
    setLoadingPincode(true);
    setPincodeSuccessMsg(null);

    try {
      const { data, error } = await supabase.functions.invoke('calculate-delivery', {
        body: { source: 'pincode', pincode: cleanPin }
      });

      let res = data;
      if (error || !res) {
        // Fallback to legacy database serviceability helper if function un-deployed locally
        res = await checkDeliveryServiceability({ pincode: cleanPin });
      }

      setDeliveryInfo(res);
      setCheckedPincode(cleanPin);

      if (res && (res.success || res.serviceable) && !res.isOutsideServiceArea && res.serviceable !== false) {
        if (res.is20MinDelivery || res.isExpress) {
          if (res.isStoreClosed || res.isAfterMidnight || res.isAfter8PM) {
            const timeLabel = res.isAfterMidnight ? 'Today by 10:00 AM' : 'Tomorrow by 10:00 AM';
            setPincodeSuccessMsg(`⚡ Express Delivery available for PIN ${cleanPin}! (${timeLabel})`);
          } else {
            const etaMins = res.customerEtaMinutes || res.eta?.minutes || 20;
            setPincodeSuccessMsg(`🚀 Express Delivery available for PIN ${cleanPin}! (Approx. ${etaMins} mins)`);
          }
        } else {
          setPincodeSuccessMsg(`✓ Standard delivery is available for PIN ${cleanPin} (3–5 business days)`);
        }
      } else {
        setErrorMsg(res?.error || res?.message || "We currently don't deliver to this location.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error checking delivery serviceability. Please try again.");
    } finally {
      setLoadingPincode(false);
    }
  };

  const handlePinCodeChange = async (val: string) => {
    const sanitized = val.replace(/\D/g, '').slice(0, 6);
    setPinCode(sanitized);
    if (sanitized.length === 6) {
      // Auto fetch city & state details
      fetchPincodeDetails(sanitized).then((details) => {
        if (details && details.success) {
          if (details.city) setCity(details.city);
          if (details.state) setState(details.state);
        }
      });
      // Immediately calculate delivery details & serviceability for new pincode
      handleCheckPincode(sanitized);
    } else {
      setPincodeSuccessMsg(null);
      if (sanitized !== checkedPincode) {
        setDeliveryInfo(null);
      }
    }
  };

  // Select Saved Address
  const handleSelectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setFullName(addr.full_name || '');
    setMobileNumber(addr.phone || '');
    setAddress(addr.address_line1 + (addr.address_line2 ? ', ' + addr.address_line2 : ''));
    setLandmark(addr.landmark || '');
    setCity(addr.city || '');
    if (addr.state) {
      setState(addr.state);
    }
    setPinCode(addr.pincode || '');
    if (typeof window !== 'undefined') {
      if (addr.id) sessionStorage.setItem('selected_delivery_address_id', addr.id);
      if (addr.pincode) sessionStorage.setItem('selected_delivery_pincode', addr.pincode);
    }
    handleCheckPincode(addr.pincode);
  };

  const handleAddNewAddressSelect = () => {
    setSelectedAddressId('new');
    setFullName('');
    setAddress('');
    setLandmark('');
    setCity('');
    setState('Bihar');
    setPinCode('');
    setDeliveryInfo(null);
    setCheckedPincode('');
    setPincodeSuccessMsg(null);
  };

  // Apply Coupon
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponInput.trim().toUpperCase();
    setCouponError(null);

    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const couponRule = VALID_COUPONS[cleanCode];
    if (!couponRule) {
      setCouponError("This coupon code is not valid.");
      return;
    }

    if (subtotal < couponRule.minOrder) {
      setCouponError(`Requires min order of ₹${couponRule.minOrder.toLocaleString('en-IN')}.`);
      return;
    }

    let discountAmt = 0;
    if (couponRule.discountPercent) {
      discountAmt = Math.round((subtotal * couponRule.discountPercent) / 100);
    } else if (couponRule.fixedDiscount) {
      discountAmt = couponRule.fixedDiscount;
    }

    setAppliedCoupon({
      code: cleanCode,
      discountAmount: discountAmt,
      description: couponRule.description
    });
    setCouponInput('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Main Submit Handler
  const handlePlaceOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    // Inline validations
    if (!/^\d{10}$/.test(mobileNumber)) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (deliveryMethod === 'Home Delivery') {
      if (!address.trim()) {
        setErrorMsg('Please enter your complete delivery address.');
        return;
      }
      if (!city.trim()) {
        setErrorMsg('Please enter your city.');
        return;
      }
      if (!/^\d{6}$/.test(pinCode)) {
        setErrorMsg('Please enter a valid 6-digit Indian PIN code.');
        return;
      }
      if (deliveryInfo && (deliveryInfo.success === false || deliveryInfo.isOutsideServiceArea || deliveryInfo.serviceable === false)) {
        setErrorMsg(deliveryInfo.error || deliveryInfo.message || 'Delivery is not available at the selected location.');
        return;
      }
    }

    setErrorMsg('');
    setIsSubmitting(true);

    const fullAddress = deliveryMethod === 'Home Delivery'
      ? `${address.trim()}${landmark ? `, Landmark: ${landmark.trim()}` : ''}`
      : 'Store Pickup — Samastipur Showroom';

    // Execute order creation
    placeOrder({
      customer: {
        name: fullName.trim(),
        phone: mobileNumber,
        email: email.trim() || undefined,
        address: fullAddress,
        city: deliveryMethod === 'Home Delivery' ? city.trim() : 'Samastipur',
        state: deliveryMethod === 'Home Delivery' ? state : 'Bihar',
        pinCode: deliveryMethod === 'Home Delivery' ? pinCode : '848103',
        deliveryMethod: deliveryMethod
      },
      items: cart,
      subtotal,
      discount: couponDiscountAmount,
      shipping: shippingFee,
      total: grandTotal,
      paymentMethod: paymentMethod === 'Cash on Delivery' ? 'Cash on Delivery' : 'Online Payment',
      is_gift: isGift,
      gift_recipient_name: isGift ? (giftRecipientName.trim() || null) : null,
      gift_message: isGift ? (giftMessage.trim() || null) : null,
      gift_wrap_charge: 0
    }).then((orderDetails) => {
      // Auto-login customer using mobile if guest
      if (!userPhone) {
        loginUser(mobileNumber);
      }

      // Save shipping address if user checked option
      if (saveToProfile && user && deliveryMethod === 'Home Delivery' && selectedAddressId === 'new') {
        saveShippingAddress({
          full_name: fullName.trim(),
          phone: mobileNumber,
          address_line1: address.trim(),
          landmark: landmark.trim() || undefined,
          city: city.trim(),
          state: state,
          pincode: pinCode,
          address_label: 'Home',
          is_default: shippingAddresses.length === 0
        }).catch((err) => {
          console.error('Failed to auto-save shipping address:', err);
        });
      }

      // Handle Online Payment (UPI / Card / Net Banking) via Cashfree
      if (paymentMethod !== 'Cash on Delivery' && orderDetails?.orderId) {
        createCashfreeOrder({
          orderId: orderDetails.orderId,
          customerName: fullName.trim(),
          customerPhone: mobileNumber,
          customerEmail: email.trim() || undefined,
          userId: user?.id || null
        }).then((cfData) => {
          if (cfData && cfData.payment_session_id && cashfreeSDK) {
            cashfreeSDK.checkout({
              paymentSessionId: cfData.payment_session_id,
              redirectTarget: '_self'
            });
          } else {
            console.warn('Cashfree session failed, displaying order confirmation view');
            setCreatedOrder(orderDetails);
            setIsOrdered(true);

            if (typeof window !== 'undefined' && orderDetails?.orderId) {
              const pKey = `sbs_ga_purchased_${orderDetails.orderId}`;
              if (!sessionStorage.getItem(pKey)) {
                sessionStorage.setItem(pKey, 'true');
                trackPurchase({
                  orderId: orderDetails.orderId,
                  total: orderDetails.total,
                  shipping: orderDetails.shipping,
                  paymentMethod: orderDetails.paymentMethod,
                  items: orderDetails.items || cart
                });
              }
            }
            clearCart();
          }
        }).catch((err) => {
          console.error('Cashfree order creation error:', err);
          setErrorMsg('Online payment initialization failed. Please try Cash on Delivery or retry.');
        });
      } else {
        // Cash on Delivery
        setCreatedOrder(orderDetails);
        setIsOrdered(true);
        if (typeof window !== 'undefined' && orderDetails?.orderId) {
          const pKey = `sbs_ga_purchased_${orderDetails.orderId}`;
          if (!sessionStorage.getItem(pKey)) {
            sessionStorage.setItem(pKey, 'true');
            trackPurchase({
              orderId: orderDetails.orderId,
              total: orderDetails.total,
              shipping: orderDetails.shipping,
              paymentMethod: orderDetails.paymentMethod,
              items: orderDetails.items || cart
            });
          }
        }
        clearCart();
      }
    }).catch((err) => {
      console.error(err);
      setErrorMsg('Failed to place order. Please try again.');
    }).finally(() => {
      setIsSubmitting(false);
    });
  };

  // WhatsApp Support Launcher
  const handleWhatsAppHelp = () => {
    const phone = "+916203909946";
    const msg = encodeURIComponent(`Hi Shree Banarasi Sarees, I need help with my checkout. Name: ${fullName || 'Customer'}.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleWhatsAppPostOrderHelp = (orderId: string) => {
    const phone = "+916203909946";
    const msg = encodeURIComponent(`Hi, I just placed order #${orderId} and need assistance.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const ctaText = paymentMethod === 'Cash on Delivery'
    ? `PLACE COD ORDER — ₹${grandTotal.toLocaleString('en-IN')}`
    : `PAY ₹${grandTotal.toLocaleString('en-IN')}`;

  // ==========================================
  // 0. HYDRATION LOADER VIEW
  // ==========================================
  if (!isHydrated) {
    return <IconMarqueeLoader />;
  }

  // ==========================================
  // 1. ORDER CONFIRMATION / SUCCESS VIEW
  // ==========================================
  if (isOrdered && createdOrder) {
    const isCod = createdOrder.paymentMethod === 'Cash on Delivery';

    return (
      <div className="min-h-screen bg-[#FAF7F0] text-[#292524] flex flex-col font-sans">
        {/* Minimal Header */}
        <header className="bg-white border-b border-[#B08A3C]/20 py-4 px-4 sm:px-8 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="text-[#6B625D] hover:text-[#6B1725] text-xs font-serif font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft size={14} /> Home
            </button>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <CheckCircle size={14} className="text-emerald-600" /> Order Placed
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12 flex-grow w-full">
          <div className="bg-white border border-[#B08A3C]/25 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#6B1725] via-[#B08A3C] to-[#6B1725]" />

            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 animate-bounce">
              <CheckCircle size={36} />
            </div>

            <div className="space-y-1.5 text-center">
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#6B1725]">
                🎉 Order Confirmed!
              </h1>
              <p className="text-xs sm:text-sm text-[#6B625D] max-w-md mx-auto">
                Thank you for your purchase from Shree Banarasi Sarees. We are carefully preparing your saree for dispatch.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-[#FFF9F0] w-full p-5 rounded-xl border border-[#B08A3C]/20 space-y-3 text-xs">
              <div className="flex justify-between border-b border-[#B08A3C]/15 pb-2.5 font-bold text-[#292524] text-sm">
                <span>Order Reference:</span>
                <span className="text-[#6B1725] font-mono tracking-wider">#{createdOrder.orderId}</span>
              </div>
              <div className="flex justify-between text-[#6B625D]">
                <span>Payment Status:</span>
                <span className={`font-bold ${isCod ? 'text-amber-800' : 'text-emerald-700'}`}>
                  {isCod ? 'Cash on Delivery' : 'Paid Online'}
                </span>
              </div>
              <div className="flex justify-between text-[#6B625D]">
                <span>Delivery To:</span>
                <span className="font-semibold text-[#292524] text-right max-w-[200px] truncate">
                  {createdOrder.customer.name} ({createdOrder.customer.city})
                </span>
              </div>
              <div className="flex justify-between text-[#6B625D]">
                <span>Estimated Delivery:</span>
                <span className="font-semibold text-[#292524]">3–5 Business Days</span>
              </div>
              <div className="flex justify-between border-t border-[#B08A3C]/15 pt-2.5 font-bold text-[#292524] text-sm">
                <span>{isCod ? 'Amount Payable on Delivery:' : 'Total Amount Paid:'}</span>
                <span className="text-[#6B1725] text-base">₹{createdOrder.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="w-full bg-white p-4 border border-[#B08A3C]/20 rounded-xl space-y-2">
              <span className="text-xs font-serif font-bold text-[#292524] block">Order Status Timeline</span>
              <div className="grid grid-cols-4 text-center text-[10px] gap-1 pt-1">
                <div className="flex flex-col items-center gap-1 text-emerald-800 font-bold">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</div>
                  <span>Order Placed</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-[#6B625D]">
                  <div className="w-5 h-5 rounded-full bg-[#FAF7F0] border border-[#B08A3C]/40 flex items-center justify-center text-[10px]">2</div>
                  <span>Quality Check</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-[#6B625D]">
                  <div className="w-5 h-5 rounded-full bg-[#FAF7F0] border border-[#B08A3C]/40 flex items-center justify-center text-[10px]">3</div>
                  <span>Packed</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-[#6B625D]">
                  <div className="w-5 h-5 rounded-full bg-[#FAF7F0] border border-[#B08A3C]/40 flex items-center justify-center text-[10px]">4</div>
                  <span>Shipped</span>
                </div>
              </div>
            </div>

            {/* Post Order Actions */}
            <div className="w-full space-y-2.5 pt-2">
              <button
                onClick={() => router.push('/account')}
                className="w-full py-3.5 bg-[#6B1725] text-[#FAF7F0] rounded-xl font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#52111C] active:scale-[0.99] transition-all shadow-md cursor-pointer text-center"
              >
                TRACK ORDER STATUS
              </button>
              <button
                onClick={() => handleWhatsAppPostOrderHelp(createdOrder.orderId)}
                className="w-full py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-serif font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare size={14} className="text-emerald-600" />
                NEED HELP? CHAT ON WHATSAPP
              </button>
              <button
                onClick={() => router.push('/sarees')}
                className="w-full py-2.5 bg-white border border-[#B08A3C]/30 text-[#292524] rounded-xl font-serif font-bold text-xs hover:bg-[#FAF7F0] cursor-pointer text-center"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // 2. MAIN CHECKOUT VIEW
  // ==========================================
  if (isHydrated && !user) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] text-[#292524] flex flex-col font-sans">
        <header className="bg-white border-b border-[#B08A3C]/20 py-3.5 px-4 sm:px-8 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="text-[#6B625D] hover:text-[#6B1725] text-xs font-serif font-bold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Store
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-md mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="bg-white border border-[#B08A3C]/25 p-8 rounded-2xl shadow-md space-y-5 w-full">
            <div className="w-14 h-14 bg-[#6B1725]/10 text-[#6B1725] rounded-full flex items-center justify-center mx-auto">
              <Lock size={26} />
            </div>
            <h1 className="font-serif text-2xl font-extrabold text-[#292524]">
              Sign In to Checkout
            </h1>
            <p className="text-xs text-[#6B625D] leading-relaxed">
              Please sign in to your account to complete your order securely and track your delivery.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3.5 bg-[#6B1725] text-white rounded-xl font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#52111C] transition-all shadow-md cursor-pointer"
            >
              Sign In / Register
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#292524] flex flex-col font-sans pb-32">
      {/* 1. TOP HEADER */}
      <header className="bg-white border-b border-[#E5DEC9] py-3.5 px-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-1 rounded-full text-[#292524] hover:text-[#6B1725] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#292524]">
            Checkout
          </h1>
          <div className="w-6" />
        </div>
      </header>

      {/* 2. STEPPER BAR (Address -> Delivery -> Payment) */}
      <div className="bg-[#FAF7F0] border-b border-[#E5DEC9] py-3 px-4">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-sans">
          {/* Step 1: Address */}
          <button
            type="button"
            onClick={() => setIsEditingAddress(true)}
            className="flex items-center gap-1.5 cursor-pointer font-medium text-[#292524]"
          >
            <div className="w-5 h-5 rounded-full bg-[#6B1725] text-white flex items-center justify-center text-[10px]">
              <Check size={12} strokeWidth={3} />
            </div>
            <span className="text-[#6B625D]">Address</span>
          </button>

          <div className="w-8 sm:w-12 h-0.5 bg-[#D4C39D]" />

          {/* Step 2: Delivery */}
          <div className="flex items-center gap-1.5 font-medium text-[#292524]">
            <div className="w-5 h-5 rounded-full bg-[#6B1725] text-white flex items-center justify-center text-[10px]">
              <Check size={12} strokeWidth={3} />
            </div>
            <span className="text-[#6B625D]">Delivery</span>
          </div>

          <div className="w-8 sm:w-12 h-0.5 bg-[#D4C39D]" />

          {/* Step 3: Payment */}
          <div className="flex items-center gap-1.5 font-bold text-[#6B1725]">
            <div className="w-5 h-5 rounded-full border-2 border-[#6B1725] text-[#6B1725] flex items-center justify-center text-[11px]">
              3
            </div>
            <span>Payment</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-xl mx-auto w-full px-4 py-4 space-y-4 flex-1">
        {cart.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center bg-white border border-[#E5DEC9] rounded-2xl shadow-2xs px-6">
            <div className="w-14 h-14 rounded-full bg-[#FAF7F0] border border-[#E5DEC9] flex items-center justify-center text-[#6B1725] mb-3">
              <ShoppingBag size={26} />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#292524] mb-1.5">
              Your bag is empty
            </h3>
            <p className="text-xs text-[#7A6E65] mb-5 leading-relaxed">
              Add your favorite Banarasi sarees to proceed to checkout.
            </p>
            <button
              onClick={() => router.push('/sarees')}
              className="w-full py-3 bg-[#6B1725] text-white rounded-full font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#52111C] transition-all shadow-md cursor-pointer"
            >
              EXPLORE COLLECTIONS
            </button>
          </div>
        ) : (
          <>
            {/* Error Alert */}
            {errorMsg && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-2 animate-fadeIn">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 3. DELIVER TO CARD WITH HORIZONTAL SCROLL ADDRESS SELECTOR */}
            <div className="bg-white rounded-2xl border border-[#E5DEC9] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-[#B08A3C] uppercase tracking-wider">
                  DELIVER TO
                </span>
                <button
                  type="button"
                  onClick={handleAddNewAddressSelect}
                  className="text-xs font-semibold text-[#B08A3C] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus size={13} /> Add New Address
                </button>
              </div>

              {shippingAddresses && shippingAddresses.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none snap-x snap-mandatory">
                  {shippingAddresses.map((addr: any) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr)}
                        className={`snap-start w-[240px] sm:w-[260px] shrink-0 bg-white rounded-xl border p-3 cursor-pointer transition-all flex flex-col justify-between relative ${
                          isSelected
                            ? 'border-2 border-[#6B1725] bg-[#6B1725]/[0.02] shadow-2xs'
                            : 'border-[#E5DEC9] hover:border-[#B08A3C]/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="font-sans font-bold text-xs text-[#292524] truncate">
                              {addr.full_name || 'Saved Address'}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {addr.is_default && (
                                <span className="text-[8px] font-bold text-[#B08A3C] bg-[#FFF9F0] px-1.5 py-0.5 rounded border border-[#B08A3C]/20">
                                  DEFAULT
                                </span>
                              )}
                              {isSelected ? (
                                <div className="w-4 h-4 rounded-full bg-[#6B1725] flex items-center justify-center text-white text-[10px]">
                                  <Check size={10} strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-[#D4C39D]" />
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-[#7A6E65] leading-relaxed line-clamp-2">
                            {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} {addr.pincode}
                          </p>
                          {addr.phone && (
                            <p className="text-[11px] text-[#7A6E65] font-mono mt-1">
                              +91 {addr.phone}
                            </p>
                          )}
                        </div>

                        <div className="mt-2 pt-2 border-t border-[#F3ECE0] flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAddress(addr);
                              setIsEditingAddress(true);
                            }}
                            className="text-[11px] font-semibold text-[#B08A3C] hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add New Address Card in Horizontal Scroll */}
                  <div
                    onClick={handleAddNewAddressSelect}
                    className="snap-start w-[160px] shrink-0 bg-[#FFF9F0] rounded-xl border-2 border-dashed border-[#B08A3C]/40 p-3 cursor-pointer hover:border-[#6B1725] transition-all flex flex-col items-center justify-center text-center gap-1.5 min-h-[110px]"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725]">
                      <Plus size={16} />
                    </div>
                    <span className="font-sans font-bold text-xs text-[#6B1725]">Add New</span>
                  </div>
                </div>
              ) : address && fullName ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-sans font-bold text-sm text-[#292524]">
                      {fullName}
                    </h3>
                    <p className="text-xs text-[#7A6E65] leading-relaxed mt-0.5">
                      {address}{landmark ? `, Landmark: ${landmark}` : ''}, {city}, {state} {pinCode}
                    </p>
                    {mobileNumber && (
                      <p className="text-xs text-[#7A6E65] mt-1 font-mono">
                        {mobileNumber.startsWith('+91') ? mobileNumber : `+91 ${mobileNumber}`}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(true)}
                    className="text-xs font-semibold text-[#B08A3C] hover:underline cursor-pointer shrink-0"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingAddress(true)}
                  className="py-2 flex items-center justify-between text-xs text-[#7A6E65] cursor-pointer hover:text-[#6B1725]"
                >
                  <span className="flex items-center gap-2">
                    <MapPin size={16} className="text-[#6B1725]" />
                    Please enter or select a delivery address
                  </span>
                  <span className="text-[#6B1725] font-semibold text-xs">+ Add Address</span>
                </div>
              )}
            </div>

            {/* 4. SELECTED DELIVERY METHOD CARD */}
            <div className="bg-white rounded-2xl border border-[#6B1725] p-4 flex items-start justify-between shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725] shrink-0 mt-0.5">
                  <Zap size={16} className="fill-[#6B1725]" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-xs sm:text-sm text-[#292524]">
                    {deliveryInfo?.is20MinDelivery || !pinCode || pinCode.startsWith('848')
                      ? '20-minute hand delivery'
                      : 'Express Delivery (3–5 Days)'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#7A6E65] mt-0.5">
                    {deliveryInfo?.is20MinDelivery || !pinCode || pinCode.startsWith('848')
                      ? 'Arriving by 6:45 pm today · our own rider, not a courier'
                      : 'Tracked express courier · packed with care'}
                  </p>
                </div>
              </div>
              <span className="font-serif font-bold text-xs sm:text-sm text-[#292524] shrink-0">
                {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
              </span>
            </div>

            {/* 5. PAYMENT METHOD SECTION */}
            <div className="space-y-2.5 pt-1">
              <span className="text-[10px] font-sans font-bold text-[#B08A3C] uppercase tracking-wider block mb-1">
                PAYMENT METHOD
              </span>

              {/* Option 1: Cash on delivery */}
              <div
                onClick={() => setPaymentMethod('Cash on Delivery')}
                className={`bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'Cash on Delivery'
                    ? 'border-2 border-[#6B1725] shadow-2xs'
                    : 'border border-[#E5DEC9] hover:border-[#6B1725]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725] shrink-0">
                    <Banknote size={18} />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-xs sm:text-sm text-[#292524]">
                      Cash on delivery
                    </h4>
                    <p className="text-[11px] text-[#7A6E65]">
                      Pay the delivery person at your door
                    </p>
                  </div>
                </div>
                {paymentMethod === 'Cash on Delivery' ? (
                  <div className="w-5 h-5 rounded-full bg-[#6B1725] flex items-center justify-center text-white text-[10px]">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#D4C39D]" />
                )}
              </div>

              {/* Option 2: UPI */}
              <div
                onClick={() => setPaymentMethod('UPI')}
                className={`bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-2 border-[#6B1725] shadow-2xs'
                    : 'border border-[#E5DEC9] hover:border-[#6B1725]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#6B625D] shrink-0 border border-[#E5DEC9]">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-xs sm:text-sm text-[#292524]">
                      UPI
                    </h4>
                    <p className="text-[11px] text-[#7A6E65]">
                      GPay, PhonePe, Paytm
                    </p>
                  </div>
                </div>
                {paymentMethod === 'UPI' ? (
                  <div className="w-5 h-5 rounded-full bg-[#6B1725] flex items-center justify-center text-white text-[10px]">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#D4C39D]" />
                )}
              </div>

              {/* Option 3: Card */}
              <div
                onClick={() => setPaymentMethod('Card')}
                className={`bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'Card'
                    ? 'border-2 border-[#6B1725] shadow-2xs'
                    : 'border border-[#E5DEC9] hover:border-[#6B1725]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#6B625D] shrink-0 border border-[#E5DEC9]">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-xs sm:text-sm text-[#292524]">
                      Card
                    </h4>
                    <p className="text-[11px] text-[#7A6E65]">
                      Credit or debit
                    </p>
                  </div>
                </div>
                {paymentMethod === 'Card' ? (
                  <div className="w-5 h-5 rounded-full bg-[#6B1725] flex items-center justify-center text-white text-[10px]">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#D4C39D]" />
                )}
              </div>

              <p className="text-xs text-[#7A6E65] leading-relaxed font-sans pt-1">
                Cash on delivery is how most of Samastipur buys from us. Open the packet in front of the rider &mdash; if the weave isn&apos;t what you saw, send it straight back.
              </p>
            </div>

            {/* 6. ORDER SUMMARY CARD */}
            <div className="bg-white rounded-2xl border border-[#E5DEC9] p-4 space-y-3 shadow-2xs">
              <span className="text-[10px] font-sans font-bold text-[#B08A3C] uppercase tracking-wider block">
                ORDER &middot; {cart.reduce((sum, item) => sum + item.quantity, 0)} SAREE{cart.reduce((sum, item) => sum + item.quantity, 0) > 1 ? 'S' : ''}
              </span>

              <div className="space-y-3 pt-1">
                {cart.map((item) => {
                  const price = item.product.salePrice ?? item.product.price;
                  return (
                    <div key={item.product.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-14 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-[#E5DEC9]">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-serif font-bold text-xs text-[#292524] truncate">
                            {item.product.name}
                          </h5>
                          <span className="text-[11px] font-sans text-[#7A6E65] block">
                            Qty {item.quantity}
                          </span>
                        </div>
                      </div>
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#292524] shrink-0">
                        ₹{(price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#F3ECE0] pt-3 flex items-center justify-between">
                <span className="font-sans font-bold text-sm text-[#292524]">
                  To pay
                </span>
                <span className="font-serif font-bold text-lg sm:text-xl text-[#292524]">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </>
        )}
      </main>

      {/* 7. STICKY BOTTOM CHECKOUT ACTION BAR */}
      {cart.length > 0 && !isOrdered && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5DEC9] px-4 py-3.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="font-serif font-extrabold text-xl sm:text-2xl text-[#292524]">
                ₹{grandTotal.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-[#7A6E65] font-sans block">
                {paymentMethod === 'Cash on Delivery' ? 'Pay on delivery' : 'Includes all taxes'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handlePlaceOrder()}
              disabled={isSubmitting}
              className="py-3.5 px-8 sm:px-10 bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-80 text-white rounded-full font-sans font-bold text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>PLACING...</span>
                </>
              ) : (
                <span>Place order</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 8. ADDRESS EDIT MODAL / SHEET */}
      {isEditingAddress && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full space-y-4 border border-[#E5DEC9] shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#292524]">
                Delivery Address
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingAddress(false)}
                className="p-1 text-[#7A6E65] hover:text-[#292524] rounded-full hover:bg-stone-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* ADDRESS FORM FIELDS ONLY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-bold text-[#6B625D] uppercase">
                  {selectedAddressId === 'new' ? 'Enter New Address' : 'Edit Address Details'}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-sans font-bold text-[#6B625D] uppercase block mb-1">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Anjali Kumari"
                  className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 text-xs text-[#292524] outline-none focus:border-[#6B1725]"
                />
              </div>

              <div>
                <label className="text-[11px] font-sans font-bold text-[#6B625D] uppercase block mb-1">
                  Mobile Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 text-xs text-[#292524] outline-none focus:border-[#6B1725] font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-sans font-bold text-[#6B625D] uppercase block mb-1">
                  Flat / House / Street Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House / Flat No, Street Name, Colony"
                  className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 text-xs text-[#292524] outline-none focus:border-[#6B1725]"
                />
              </div>

              <div>
                <label className="text-[11px] font-sans font-bold text-[#6B625D] uppercase block mb-1">
                  Landmark <span className="font-normal text-[#6B625D]/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Temple / Bank"
                  className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 text-xs text-[#292524] outline-none focus:border-[#6B1725]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-sans font-bold text-[#6B625D] uppercase block mb-1">
                    PIN Code <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={pinCode}
                    onChange={(e) => handlePinCodeChange(e.target.value)}
                    placeholder="6-digit PIN"
                    className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 text-xs text-[#292524] outline-none focus:border-[#6B1725] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-sans font-bold text-[#6B625D] uppercase block mb-1">
                    City <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 text-xs text-[#292524] outline-none focus:border-[#6B1725]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-sans font-bold text-[#6B625D] uppercase block mb-1">
                  State <span className="text-red-600">*</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 text-xs text-[#292524] outline-none focus:border-[#6B1725] cursor-pointer"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {user && (
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#B08A3C] font-semibold pt-1">
                  <input
                    type="checkbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                    className="rounded border-[#B08A3C]/40 text-[#6B1725] focus:ring-[#6B1725]"
                  />
                  Save address to my profile for future orders
                </label>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (!fullName.trim() || !address.trim() || !city.trim() || pinCode.length !== 6) {
                  setErrorMsg('Please fill in all required address fields.');
                  return;
                }
                if (pinCode.length === 6) {
                  handleCheckPincode(pinCode);
                }
                if (saveToProfile && user && selectedAddressId === 'new') {
                  saveShippingAddress({
                    full_name: fullName.trim(),
                    phone: mobileNumber,
                    address_line1: address.trim(),
                    landmark: landmark.trim() || undefined,
                    city: city.trim(),
                    state: state,
                    pincode: pinCode,
                    address_label: 'Home',
                    is_default: (shippingAddresses || []).length === 0
                  }).catch((err) => console.error('Error saving shipping address:', err));
                }
                setIsEditingAddress(false);
              }}
              className="w-full py-3.5 bg-[#6B1725] hover:bg-[#52111C] text-white rounded-full font-serif font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer text-center mt-2"
            >
              Save Address &amp; Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<IconMarqueeLoader />}>
      <CheckoutContent />
    </Suspense>
  );
}
