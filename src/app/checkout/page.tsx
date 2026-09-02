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
  ExternalLink
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

  // Form Fields
  const isPhoneValid = userPhone && /^\d{10}$/.test(userPhone);
  const [mobileNumber, setMobileNumber] = useState(isPhoneValid ? userPhone : '');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Bihar');
  const [pinCode, setPinCode] = useState(checkedPincode || '');
  const [landmark, setLandmark] = useState('');

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

  // Auto-prefill selected or default address for logged-in user
  useEffect(() => {
    if (shippingAddresses && shippingAddresses.length > 0 && !hasPrefilled && !fullName && !address) {
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
        setMobileNumber(targetAddr.phone || '');
        setAddress(targetAddr.address_line1 + (targetAddr.address_line2 ? ', ' + targetAddr.address_line2 : ''));
        setLandmark(targetAddr.landmark || '');
        setCity(targetAddr.city || '');
        if (targetAddr.state) {
          setState(targetAddr.state);
        }
        setPinCode(targetAddr.pincode || '');
        handleCheckPincode(targetAddr.pincode);
        setHasPrefilled(true);
        setSelectedAddressId(targetAddr.id);
      }
    }
  }, [shippingAddresses, hasPrefilled, fullName, address]);

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

      if (res && res.success && !res.isOutsideServiceArea) {
        if (res.is20MinDelivery) {
          setPincodeSuccessMsg(`🚀 20-Minute Express Delivery available for PIN ${cleanPin}! (Approx. ${res.distanceKm} km away)`);
        } else {
          setPincodeSuccessMsg(`✓ Standard delivery available for PIN ${cleanPin} (${res.distanceKm ? `Approx. ${res.distanceKm} km` : '3–5 business days'})`);
        }
      } else {
        setErrorMsg(res?.error || "We currently don't deliver to this location.");
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
      if (deliveryInfo && !deliveryInfo.serviceable) {
        setErrorMsg('Delivery is not available at the selected location.');
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
    <div className="min-h-screen bg-[#FAF7F0] text-[#292524] flex flex-col font-sans pb-28 lg:pb-12">

      {/* DISTRACTION-FREE CHECKOUT HEADER */}
      <header className="bg-white border-b border-[#B08A3C]/20 py-3.5 px-4 sm:px-8 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-[#6B625D] hover:text-[#6B1725] text-xs font-serif font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-[#6B625D] bg-[#FFF9F0] border border-[#B08A3C]/25 px-3 py-1.5 rounded-full">
            <Lock size={12} className="text-[#6B1725]" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* MAIN CHECKOUT CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        {cart.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center bg-white border border-[#B08A3C]/25 rounded-2xl shadow-sm px-6 max-w-md mx-auto my-12">
            <div className="w-14 h-14 rounded-full bg-[#FAF7F0] border border-[#B08A3C]/30 flex items-center justify-center text-[#6B1725] mb-3">
              <ShoppingBag size={26} />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#292524] mb-1.5">
              Your bag is empty
            </h3>
            <p className="text-xs text-[#6B625D] mb-5 leading-relaxed">
              Add your favorite Banarasi sarees to proceed to checkout.
            </p>
            <button
              onClick={() => router.push('/sarees')}
              className="w-full py-3 bg-[#6B1725] text-[#FAF7F0] rounded-xl font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#52111C] transition-all shadow-md cursor-pointer"
            >
              EXPLORE COLLECTIONS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT COLUMN: CHECKOUT STEPS */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-5">

              {/* Progress Indicator */}
              <div className="bg-white p-3 rounded-xl border border-[#B08A3C]/20 shadow-sm flex items-center justify-between text-xs font-serif font-bold text-[#6B625D]">
                <span className="flex items-center gap-1.5 text-[#6B1725]">
                  <span className="w-5 h-5 rounded-full bg-[#6B1725] text-white text-[10px] flex items-center justify-center font-sans">1</span>
                  Contact &amp; Address
                </span>
                <span className="text-[#B08A3C]">→</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#FAF7F0] border border-[#B08A3C]/40 text-[#292524] text-[10px] flex items-center justify-center font-sans">2</span>
                  Delivery
                </span>
                <span className="text-[#B08A3C]">→</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#FAF7F0] border border-[#B08A3C]/40 text-[#292524] text-[10px] flex items-center justify-center font-sans">3</span>
                  Payment
                </span>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-2 animate-fadeIn">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* SECTION 1: CONTACT & DELIVERY ADDRESS */}
              <div className="bg-white p-5 rounded-2xl border border-[#B08A3C]/25 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-[#B08A3C]/15 pb-2.5">
                  <User size={16} className="text-[#6B1725]" />
                  <h2 className="font-serif text-base font-bold text-[#292524]">
                    1. Contact &amp; Delivery Address
                  </h2>
                </div>

                {/* Saved Address Dropdown if user logged in */}
                {shippingAddresses && shippingAddresses.length > 0 && (
                  <div className="space-y-1.5 pb-2 border-b border-[#F3ECE0]">
                    <div className="flex items-center justify-between">
                      <label htmlFor="checkout-saved-address-select" className="text-[11px] font-serif font-bold text-[#6B625D] uppercase tracking-wider">
                        Select Saved Shipping Address:
                      </label>
                      <button
                        type="button"
                        onClick={handleAddNewAddressSelect}
                        className={`text-[11px] font-serif font-bold text-[#6B1725] hover:underline flex items-center gap-0.5 cursor-pointer ${
                          selectedAddressId === 'new' ? 'underline' : ''
                        }`}
                      >
                        <Plus size={12} /> Add New Address
                      </button>
                    </div>

                    <div className="relative">
                      <select
                        id="checkout-saved-address-select"
                        value={selectedAddressId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'new') {
                            handleAddNewAddressSelect();
                          } else if (val) {
                            const addr = shippingAddresses.find(a => a.id === val);
                            if (addr) {
                              handleSelectAddress(addr);
                            }
                          }
                        }}
                        className="w-full bg-[#FAF7F0] border border-[#B08A3C]/35 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-xl px-3.5 py-2.5 outline-none font-sans font-medium transition-all cursor-pointer appearance-none pr-8 text-ellipsis overflow-hidden shadow-xs"
                      >
                        <option value="">-- Select a saved shipping address --</option>
                        {shippingAddresses.map((addr: any, index: number) => {
                          const defaultPrefix = addr.is_default ? '★ DEFAULT ' : '';
                          const label = addr.address_label ? `[${defaultPrefix}${addr.address_label.toUpperCase()}]` : '[SAVED]';
                          const nameStr = addr.full_name ? `${addr.full_name}, ` : '';
                          const line1 = addr.address_line1 || '';
                          const line2 = addr.address_line2 ? `, ${addr.address_line2}` : '';
                          const cityState = `${addr.city ? `, ${addr.city}` : ''}${addr.state ? `, ${addr.state}` : ''}`;
                          const pinStr = addr.pincode ? ` (${addr.pincode})` : '';
                          const fullAddressText = `${label} ${nameStr}${line1}${line2}${cityState}${pinStr}`;

                          return (
                            <option key={addr.id || index} value={addr.id}>
                              {fullAddressText}
                            </option>
                          );
                        })}
                        <option value="new">+ Enter New Address Manually</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#6B1725]">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Input Form */}
                {(selectedAddressId === 'new' || !shippingAddresses || shippingAddresses.length === 0) && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6B625D] uppercase tracking-wide mb-1">
                          Mobile Number <span className="text-red-600">*</span>
                        </label>
                        <div className="flex">
                          <span className="bg-[#FAF7F0] border border-r-0 border-[#B08A3C]/30 text-xs font-bold text-[#6B625D] px-2.5 flex items-center rounded-l-lg font-mono">
                            +91
                          </span>
                          <input
                            type="tel"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10-digit mobile"
                            autoComplete="tel"
                            required
                            className="w-full bg-white border border-[#B08A3C]/30 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-r-lg p-2 outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#6B625D] uppercase tracking-wide mb-1">
                          Full Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your complete name"
                          autoComplete="name"
                          required
                          className="w-full bg-white border border-[#B08A3C]/30 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-lg p-2 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6B625D] uppercase tracking-wide mb-1">
                        Delivery Address <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House / Flat No, Street Name, Colony"
                        autoComplete="address-line1"
                        required
                        className="w-full bg-white border border-[#B08A3C]/30 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-lg p-2 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6B625D] uppercase tracking-wide mb-1">
                          PIN Code <span className="text-red-600">*</span>
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="tel"
                            value={pinCode}
                            onChange={(e) => handlePinCodeChange(e.target.value)}
                            placeholder="6-digit PIN"
                            autoComplete="postal-code"
                            required
                            className="flex-1 bg-white border border-[#B08A3C]/30 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-lg p-2 outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleCheckPincode(pinCode)}
                            disabled={loadingPincode || pinCode.length !== 6}
                            className="px-2.5 py-2 bg-[#6B1725] text-white rounded-lg text-[10px] font-serif font-bold hover:bg-[#52111C] disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            {loadingPincode ? '...' : 'VERIFY'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#6B625D] uppercase tracking-wide mb-1">
                          City <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                          autoComplete="address-level2"
                          required
                          className="w-full bg-white border border-[#B08A3C]/30 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-lg p-2 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#6B625D] uppercase tracking-wide mb-1">
                          State <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full bg-white border border-[#B08A3C]/30 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-lg p-2 outline-none cursor-pointer"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6B625D] uppercase tracking-wide mb-1">
                          Landmark <span className="font-normal text-[#6B625D]/60">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. Near Temple / Bank"
                          className="w-full bg-white border border-[#B08A3C]/30 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-lg p-2 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#6B625D] uppercase tracking-wide mb-1">
                          Email <span className="font-normal text-[#6B625D]/60">(optional)</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="For digital receipt"
                          autoComplete="email"
                          className="w-full bg-white border border-[#B08A3C]/30 focus:border-[#6B1725] focus:ring-1 focus:ring-[#6B1725] text-xs text-[#292524] rounded-lg p-2 outline-none"
                        />
                      </div>
                    </div>

                    {pincodeSuccessMsg && (
                      <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 pt-1">
                        <CheckCircle size={13} className="text-emerald-600" />
                        {pincodeSuccessMsg}
                      </p>
                    )}

                    {user && (
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-[#B08A3C] pt-1">
                        <input
                          type="checkbox"
                          checked={saveToProfile}
                          onChange={(e) => setSaveToProfile(e.target.checked)}
                          className="rounded border-[#B08A3C]/40 text-[#6B1725] focus:ring-[#6B1725]"
                        />
                        Save address to profile for future orders
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 2: DELIVERY METHOD */}
              <div className="bg-white p-5 rounded-2xl border border-[#B08A3C]/25 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-[#B08A3C]/15 pb-2.5">
                  <Truck size={16} className="text-[#6B1725]" />
                  <h2 className="font-serif text-base font-bold text-[#292524]">
                    2. Shipping &amp; Delivery Method
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setDeliveryMethod('Home Delivery')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${deliveryMethod === 'Home Delivery'
                      ? 'border-[#6B1725] bg-[#6B1725]/[0.03]'
                      : 'border-[#B08A3C]/20 bg-white hover:border-[#B08A3C]/40'
                      }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${deliveryMethod === 'Home Delivery' ? 'border-[#6B1725] bg-[#6B1725]' : 'border-[#6B625D]/30 bg-white'
                      }`} />
                    <div>
                      <span className="text-xs font-serif font-bold text-[#292524] block">Home Delivery</span>
                      <span className="text-[10px] text-[#6B625D] block">Delivered in 3–5 business days</span>
                      <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                        {isFreeShipping ? 'FREE Shipping' : `₹${STANDARD_SHIPPING_FEE} Shipping`}
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setDeliveryMethod('Store Pickup')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${deliveryMethod === 'Store Pickup'
                      ? 'border-[#6B1725] bg-[#6B1725]/[0.03]'
                      : 'border-[#B08A3C]/20 bg-white hover:border-[#B08A3C]/40'
                      }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${deliveryMethod === 'Store Pickup' ? 'border-[#6B1725] bg-[#6B1725]' : 'border-[#6B625D]/30 bg-white'
                      }`} />
                    <div>
                      <span className="text-xs font-serif font-bold text-[#292524] block">Store Pickup</span>
                      <span className="text-[10px] text-[#6B625D] block">Collect at Samastipur showroom</span>
                      <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">FREE</span>
                    </div>
                  </div>
                </div>

                {deliveryMethod === 'Store Pickup' && (
                  <div className="p-3 bg-[#FFF9F0] border border-[#B08A3C]/20 rounded-xl text-xs text-[#6B625D] space-y-1">
                    <p className="font-bold text-[#292524]">🏪 Shree Banarasi Sarees Showroom</p>
                    <p>Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103</p>
                    <p className="text-[10px] text-[#B08A3C] font-semibold">Open 10 AM – 8:30 PM Daily</p>
                  </div>
                )}
              </div>

              {/* SECTION 3: PAYMENT METHOD */}
              <div className="bg-white p-5 rounded-2xl border border-[#B08A3C]/25 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-[#B08A3C]/15 pb-2.5">
                  <CreditCard size={16} className="text-[#6B1725]" />
                  <h2 className="font-serif text-base font-bold text-[#292524]">
                    3. Select Payment Method
                  </h2>
                </div>

                <div className="space-y-2">
                  {/* UPI (Google Pay, PhonePe, Paytm) */}
                  {/* <label
                    onClick={() => setPaymentMethod('UPI')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'UPI' ? 'border-[#6B1725] bg-[#6B1725]/[0.03]' : 'border-[#B08A3C]/20 bg-white hover:border-[#B08A3C]/40'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${paymentMethod === 'UPI' ? 'border-[#6B1725] bg-[#6B1725]' : 'border-[#6B625D]/30 bg-white'
                        }`} />
                      <div>
                        <span className="text-xs font-serif font-bold text-[#292524] block">
                          UPI (Google Pay / PhonePe / Paytm)
                        </span>
                        <span className="text-[10px] text-[#6B625D] block">Fastest &amp; most secure payment</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-[#B08A3C] bg-[#FFF9F0] px-2 py-0.5 rounded border border-[#B08A3C]/20">
                      Recommended
                    </span>
                  </label> */}

                  {/* Credit / Debit Cards */}
                  {/* <label
                    onClick={() => setPaymentMethod('Card')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'Card' ? 'border-[#6B1725] bg-[#6B1725]/[0.03]' : 'border-[#B08A3C]/20 bg-white hover:border-[#B08A3C]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        paymentMethod === 'Card' ? 'border-[#6B1725] bg-[#6B1725]' : 'border-[#6B625D]/30 bg-white'
                      }`} />
                      <div>
                        <span className="text-xs font-serif font-bold text-[#292524] block">Credit / Debit Card</span>
                        <span className="text-[10px] text-[#6B625D] block">Visa, Mastercard, RuPay, Maestro</span>
                      </div>
                    </div>
                  </label> */}

                  {/* Net Banking */}
                  {/* <label
                    onClick={() => setPaymentMethod('Net Banking')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'Net Banking' ? 'border-[#6B1725] bg-[#6B1725]/[0.03]' : 'border-[#B08A3C]/20 bg-white hover:border-[#B08A3C]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        paymentMethod === 'Net Banking' ? 'border-[#6B1725] bg-[#6B1725]' : 'border-[#6B625D]/30 bg-white'
                      }`} />
                      <div>
                        <span className="text-xs font-serif font-bold text-[#292524] block">Net Banking</span>
                        <span className="text-[10px] text-[#6B625D] block">All major Indian banks supported</span>
                      </div>
                    </div>
                  </label> */}

                  {/* Cash on Delivery */}
                  <label
                    onClick={() => setPaymentMethod('Cash on Delivery')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'Cash on Delivery' ? 'border-[#6B1725] bg-[#6B1725]/[0.03]' : 'border-[#B08A3C]/20 bg-white hover:border-[#B08A3C]/40'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${paymentMethod === 'Cash on Delivery' ? 'border-[#6B1725] bg-[#6B1725]' : 'border-[#6B625D]/30 bg-white'
                        }`} />
                      <div>
                        <span className="text-xs font-serif font-bold text-[#292524] block">Cash on Delivery (COD)</span>
                        <span className="text-[10px] text-[#6B625D] block">Pay cash when your order arrives</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      FREE COD
                    </span>
                  </label>
                </div>

                {paymentMethod === 'Cash on Delivery' && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>You will pay ₹{grandTotal.toLocaleString('en-IN')} in cash upon delivery.</span>
                  </div>
                )}
              </div>

              {/* WhatsApp Assistance */}
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
                <span className="flex items-center gap-2 font-medium">
                  <MessageSquare size={16} className="text-emerald-600" />
                  Have questions about your order or custom saree weaving?
                </span>
                <button
                  type="button"
                  onClick={handleWhatsAppHelp}
                  className="px-3 py-1.5 bg-emerald-600 text-white font-serif font-bold text-[11px] rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer flex-shrink-0"
                >
                  Chat on WhatsApp
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-[#B08A3C]/25 shadow-sm space-y-4">
                <h3 className="font-serif text-base font-bold text-[#292524] border-b border-[#B08A3C]/15 pb-2.5 flex items-center justify-between">
                  <span>Your Order ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <Link href="/cart" className="text-[10px] text-[#6B1725] hover:underline font-normal font-sans">
                    Edit Bag
                  </Link>
                </h3>

                {/* Items List */}
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const currentPrice = item.product.salePrice ?? item.product.price;
                    const originalPrice = item.product.price;
                    const hasDiscount = !!item.product.salePrice && item.product.salePrice < originalPrice;
                    const discountPercent = hasDiscount
                      ? Math.round(((originalPrice - item.product.salePrice!) / originalPrice) * 100)
                      : 0;

                    return (
                      <div key={item.product.id} className="flex gap-3 text-xs border-b border-[#B08A3C]/10 pb-3 last:border-0 last:pb-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-12 aspect-[3/4] object-cover rounded-lg bg-[#FAF7F0] border border-[#B08A3C]/15 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif font-bold text-[#292524] line-clamp-1">{item.product.name}</h4>
                          <p className="text-[10px] text-[#6B625D] mt-0.5">Qty {item.quantity} &bull; {item.product.fabric}</p>
                          {hasDiscount && (
                            <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-serif font-bold text-[#6B1725] block">
                            ₹{(currentPrice * item.quantity).toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <span className="text-[9px] text-[#6B625D]/50 line-through block">
                              ₹{(originalPrice * item.quantity).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Savings Banner */}
                {totalProductDiscount > 0 && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-600 flex-shrink-0" />
                    <span>You are saving <strong>₹{totalProductDiscount.toLocaleString('en-IN')}</strong> on saree list prices!</span>
                  </div>
                )}

                {/* Coupon Accordion Widget */}
                <div className="border-t border-[#B08A3C]/15 pt-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsCouponOpen(!isCouponOpen)}
                    className="w-full flex items-center justify-between text-xs font-serif font-bold text-[#6B1725] cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Tag size={13} className="text-[#B08A3C]" /> Have a coupon code?
                    </span>
                    {isCouponOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isCouponOpen && (
                    <div className="pt-1.5 space-y-2">
                      {appliedCoupon ? (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                          <span><strong>{appliedCoupon.code}</strong> Applied (-₹{appliedCoupon.discountAmount})</span>
                          <button onClick={handleRemoveCoupon} className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer">
                            Remove
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyCoupon} className="flex gap-1.5">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="e.g. WELCOME10"
                            className="flex-1 bg-[#FAF7F0] border border-[#B08A3C]/30 text-xs text-[#292524] uppercase rounded-lg p-2 outline-none font-mono"
                          />
                          <button
                            type="submit"
                            className="px-3 py-2 bg-[#B08A3C] text-white rounded-lg text-xs font-serif font-bold hover:bg-[#96742F] cursor-pointer"
                          >
                            APPLY
                          </button>
                        </form>
                      )}
                      {couponError && <p className="text-[10px] text-red-600 font-medium">{couponError}</p>}
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="border-t border-[#B08A3C]/15 pt-3 space-y-2 text-xs text-[#6B625D]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#292524]">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span>-₹{couponDiscountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    {isFreeShipping ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      <span className="font-semibold text-[#292524]">₹{shippingFee.toLocaleString('en-IN')}</span>
                    )}
                  </div>

                  <div className="flex justify-between text-sm font-serif font-bold text-[#292524] border-t border-[#B08A3C]/15 pt-2.5">
                    <span>Total Amount</span>
                    <span className="text-[#6B1725] text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* 🎁 Gift Option Toggle */}
                <div className="border-t border-[#B08A3C]/15 pt-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isGift}
                      onChange={(e) => setIsGift(e.target.checked)}
                      className="rounded border-[#B08A3C]/40 text-[#6B1725] focus:ring-[#6B1725]"
                    />
                    <span className="text-xs font-serif font-bold text-[#292524] flex items-center gap-1">
                      <Gift size={13} className="text-[#B08A3C]" /> Is this a gift? <span className="text-[10px] font-normal text-[#6B625D]">(FREE packaging)</span>
                    </span>
                  </label>

                  {isGift && (
                    <div className="mt-2.5 space-y-2 pt-1 animate-fadeIn">
                      <input
                        type="text"
                        value={giftRecipientName}
                        onChange={(e) => setGiftRecipientName(e.target.value)}
                        placeholder="Recipient Name (optional)"
                        className="w-full bg-[#FAF7F0] border border-[#B08A3C]/30 text-xs text-[#292524] rounded-lg p-2 outline-none"
                      />
                      <textarea
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Add a personal gift message..."
                        rows={2}
                        className="w-full bg-[#FAF7F0] border border-[#B08A3C]/30 text-xs text-[#292524] rounded-lg p-2 outline-none resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Desktop Primary CTA Button */}
                <button
                  type="button"
                  onClick={() => handlePlaceOrder()}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#6B1725] hover:bg-[#52111C] text-[#FAF7F0] text-center rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hidden lg:flex"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      PROCESSING YOUR ORDER...
                    </>
                  ) : (
                    <>
                      <Lock size={14} className="text-[#B08A3C]" />
                      {ctaText}
                    </>
                  )}
                </button>

                {/* Trust Badges */}
                <div className="text-center pt-1">
                  <span className="text-[10px] text-[#6B625D] flex items-center justify-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-700" />
                    🔒 100% Encrypted &bull; Quality Checked Saree &bull; Samastipur, Bihar
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Hidden form hook for mobile CTA submit */}
      <form id="checkout-mobile-form" onSubmit={handlePlaceOrder} className="hidden" />

      {/* MOBILE STICKY BOTTOM CHECKOUT BAR */}
      {cart.length > 0 && !isOrdered && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#B08A3C]/20 px-4 py-3 shadow-[0_-8px_24px_rgba(45,33,29,0.1)] lg:hidden flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] text-[#6B625D] uppercase font-bold tracking-wider leading-none">Total Payable</span>
            <span className="font-serif text-base font-extrabold text-[#6B1725] mt-0.5">
              ₹{grandTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <button
            type="submit"
            form="checkout-mobile-form"
            disabled={isSubmitting}
            className="bg-[#6B1725] hover:bg-[#52111C] text-[#FAF7F0] rounded-xl px-5 py-3 font-serif font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 max-w-[220px]"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                PROCESSING...
              </>
            ) : (
              ctaText
            )}
          </button>
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
