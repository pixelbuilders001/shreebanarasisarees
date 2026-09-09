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
  X,
  Clock,
  Download,
  FileText
} from 'lucide-react';
import {
  checkDeliveryServiceability,
  fetchDeliverySettings,
  calculateDeliveryOptions,
  DeliverySettings,
  CalculatedDeliveryOption,
  DeliveryOptionType,
  getProductSlug,
  supabase
} from '../../data/supabase';
import { trackBeginCheckout, trackPurchase } from '../../lib/gtag';
import { fetchPincodeDetails } from '../../lib/pincodeLookup';
import { AddNewAddressModal } from '../../components/delivery/AddNewAddressModal';
import { DeliveryRiderIcon } from '../../components/delivery/DeliveryIcons';
import { CheckoutSkeleton } from '../../components/CheckoutSkeleton';
import { getStandardDeliveryDateInfo } from '../../lib/deliveryDates';

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

// Helper to check current IST operating hours window (mirrors DeliveryChecker on the PDP):
// - 9 AM to 8 PM: Normal 20-min express flow
// - 8 PM to 12 AM: Tomorrow Morning (by 10:00 AM)
// - 12 AM to 9 AM: Today Morning (by 10:00 AM)
const getExpressTimingStatus = (result?: any) => {
  let hour = 12;
  try {
    const istHourString = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    }).format(new Date());
    hour = parseInt(istHourString, 10);
  } catch {
    hour = new Date().getHours();
  }

  const isAfterMidnight = result?.isAfterMidnight ?? (hour < 9);
  const isAfter8PM = result?.isAfter8PM ?? (hour >= 20);
  const isNormalHours = !(isAfterMidnight || isAfter8PM);

  if (isNormalHours) {
    return {
      isNormalHours: true,
      isAfterMidnight: false,
      isAfter8PM: false,
      timingText: '',
      badgeText: '',
      descText: ''
    };
  }

  if (isAfterMidnight) {
    return {
      isNormalHours: false,
      isAfterMidnight: true,
      isAfter8PM: false,
      timingText: 'Today Morning (by 10:00 AM)',
      badgeText: '✓ Today Morning',
      descText: 'Priority express delivery will arrive this morning by 10:00 AM.'
    };
  }

  return {
    isNormalHours: false,
    isAfterMidnight: false,
    isAfter8PM: true,
    timingText: 'Tomorrow Morning (by 10:00 AM)',
    badgeText: '✓ Tomorrow Morning',
    descText: 'Priority express delivery will arrive tomorrow morning by 10:00 AM.'
  };
};

function CheckoutContent() {
  const router = useRouter();
  const deliveryDateInfo = useMemo(() => getStandardDeliveryDateInfo(), []);

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
    currentPincode,
    setCurrentPincode,
    defaultDeliveryPincode,
    shippingAddresses,
    shippingAddressesLoading,
    shippingAddressesLoaded,
    saveShippingAddress,
    user,
    userProfile,
    isHydrated,
    setIsAuthModalOpen
  } = useStore();

  const fallbackTiming = useMemo(() => getExpressTimingStatus(deliveryInfo), [deliveryInfo]);

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
  const [pinCode, setPinCode] = useState(currentPincode || defaultDeliveryPincode || '');
  const [landmark, setLandmark] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);

  // Delivery & Payment selection
  const [deliveryMethod, setDeliveryMethod] = useState<'Home Delivery' | 'Store Pickup'>('Home Delivery');
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<DeliveryOptionType>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('selected_delivery_option');
      if (saved === 'express' || saved === 'same_day' || saved === 'standard') {
        return saved as DeliveryOptionType;
      }
    }
    return 'express';
  });
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery'>('Cash on Delivery');

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

  // Fetch dynamic delivery_settings from database table
  useEffect(() => {
    fetchDeliverySettings().then(setDeliverySettings).catch(console.error);
  }, []);

  // Sync pincode from centralized context
  useEffect(() => {
    const active = currentPincode || defaultDeliveryPincode;
    if (active && !pinCode) {
      setPinCode(active);
    }
  }, [currentPincode, defaultDeliveryPincode, pinCode]);

  // Auto-prefill selected or default address for logged-in user or profile info
  useEffect(() => {
    if (shippingAddresses && shippingAddresses.length > 0 && !hasPrefilled) {
      // Check if any saved address matches currentPincode
      const matchingAddr = currentPincode
        ? shippingAddresses.find(a => a.pincode?.trim() === currentPincode.trim())
        : null;

      const isManualOtherPincode = currentPincode && !matchingAddr;

      if (matchingAddr) {
        setFullName(matchingAddr.full_name || '');
        setMobileNumber(matchingAddr.phone || (isPhoneValid ? userPhone : ''));
        setAddress(matchingAddr.address_line1 + (matchingAddr.address_line2 ? ', ' + matchingAddr.address_line2 : ''));
        setLandmark(matchingAddr.landmark || '');
        setCity(matchingAddr.city || '');
        if (matchingAddr.state) {
          setState(matchingAddr.state);
        }
        setPinCode(matchingAddr.pincode || '');
        if (matchingAddr.pincode) {
          handleCheckPincode(matchingAddr.pincode);
        }
        setSelectedAddressId(matchingAddr.id);
        setHasPrefilled(true);
      } else if (isManualOtherPincode) {
        // Logged-in user explicitly selected an alternate pincode (e.g. to deliver for someone else)
        setPinCode(currentPincode);
        handleCheckPincode(currentPincode);
        fetchPincodeDetails(currentPincode).then((details) => {
          if (details && details.success) {
            if (details.city) setCity(details.city);
            if (details.state) setState(details.state);
          }
        });
        setSelectedAddressId('');
        setHasPrefilled(true);
      } else {
        let targetAddr = shippingAddresses.find(a => a.is_default) || shippingAddresses[0];
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
            setCurrentPincode(targetAddr.pincode);
          }
          setHasPrefilled(true);
          setSelectedAddressId(targetAddr.id);
        }
      }
    } else if (userProfile && !hasPrefilled && (!shippingAddresses || shippingAddresses.length === 0)) {
      if (userProfile.full_name && !fullName) setFullName(userProfile.full_name);
      if (userProfile.phone && !mobileNumber) setMobileNumber(userProfile.phone);
      if (userProfile.email && !email) setEmail(userProfile.email);
      const active = currentPincode || userProfile.default_pincode;
      if (active) {
        setPinCode(active);
        handleCheckPincode(active);
      }
      setHasPrefilled(true);
    }
  }, [shippingAddresses, userProfile, hasPrefilled, isPhoneValid, userPhone, pinCode, currentPincode, setCurrentPincode]);

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

  // Delivery options calculated dynamically from delivery_settings & customer distance
  const deliveryOptions = useMemo<CalculatedDeliveryOption[]>(() => {
    const dist = deliveryInfo?.distanceKm ?? deliveryInfo?.distance_km;
    const etaMins = deliveryInfo?.customerEtaMinutes ?? deliveryInfo?.eta?.minutes;
    const cleanPin = (pinCode || currentPincode || defaultDeliveryPincode || '').trim();
    const settings = deliverySettings || {
      id: 'default',
      serviceable_district: 'Samastipur',
      serviceable_state: 'Bihar',
      express_max_km: 5,
      same_day_max_km: 10,
      standard_max_km: 20,
      express_charge: 29,
      same_day_charge: 49,
      standard_charge: 69,
      express_min_minutes: 60,
      express_max_minutes: 120,
      same_day_cutoff_time: '17:00:00',
      is_active: true,
      shop_latitude: 25.855802,
      shop_longitude: 85.779337,
      express_packing_buffer_minutes: 3,
      express_delivery_buffer_minutes: 3,
      is_express_20min_enabled: true,
      default_pincode: '848101'
    };

    return calculateDeliveryOptions(dist, settings, etaMins, cleanPin);
  }, [deliveryInfo, deliverySettings, pinCode, currentPincode, defaultDeliveryPincode]);

  // Keep fastest available delivery option selected
  useEffect(() => {
    const currentOpt = deliveryOptions.find(o => o.id === selectedDeliveryOption);
    if (!currentOpt || !currentOpt.available) {
      const best = deliveryOptions.find(o => o.available);
      const nextMethod = best ? best.id : 'standard';
      setSelectedDeliveryOption(nextMethod);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('selected_delivery_option', nextMethod);
      }
    }
  }, [deliveryOptions, selectedDeliveryOption]);

  const activeDeliveryOption = useMemo(() => {
    return deliveryOptions.find(o => o.id === selectedDeliveryOption) || deliveryOptions[0];
  }, [deliveryOptions, selectedDeliveryOption]);

  const shippingFee = deliveryMethod === 'Store Pickup'
    ? 0
    : (activeDeliveryOption ? activeDeliveryOption.charge : (deliverySettings?.standard_charge ?? 69));

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
        const isLocalPinEligible = Boolean(
          res.is20MinDelivery ||
          res.isExpress ||
          (res.distanceKm && res.distanceKm <= 10) ||
          cleanPin.startsWith('8481') ||
          cleanPin === (defaultDeliveryPincode || '848101')
        );

        if (isLocalPinEligible) {
          if (res.isStoreClosed || res.isAfterMidnight || res.isAfter8PM) {
            const timeLabel = res.isAfterMidnight ? 'Today by 10:00 AM' : 'Tomorrow by 10:00 AM';
            setPincodeSuccessMsg(`⚡ Express & Same Day Delivery available for PIN ${cleanPin}! (${timeLabel})`);
          } else {
            const etaMins = res.customerEtaMinutes || res.eta?.minutes || 20;
            setPincodeSuccessMsg(`🚀 Express & Same Day Delivery available for PIN ${cleanPin}! (Approx. ${etaMins} mins)`);
          }
        } else {
          setPincodeSuccessMsg(`✓ Standard delivery is available for PIN ${cleanPin} (${deliveryDateInfo.deliveryByText}). Express and same-day delivery are not available for this pincode.`);
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
      setCurrentPincode(sanitized);
    } else {
      setPincodeSuccessMsg(null);
      if (sanitized !== (currentPincode || defaultDeliveryPincode)) {
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
    if (addr.pincode) {
      setCurrentPincode(addr.pincode);
    }
    handleCheckPincode(addr.pincode);
  };

  const handleAddNewAddressSelect = () => {
    setIsAddAddressModalOpen(true);
  };

  const handleNewAddressSaved = (savedAddr: any) => {
    if (!savedAddr) return;
    setSelectedAddressId('new');
    setFullName(savedAddr.full_name || '');
    setMobileNumber(savedAddr.phone || '');
    setAddress((savedAddr.address_line1 || '') + (savedAddr.address_line2 ? ', ' + savedAddr.address_line2 : ''));
    setLandmark(savedAddr.landmark || '');
    setCity(savedAddr.city || '');
    if (savedAddr.state) {
      setState(savedAddr.state);
    }
    setPinCode(savedAddr.pincode || '');
    setDeliveryInfo(null);
    setPincodeSuccessMsg(null);
    if (savedAddr.pincode) {
      setCurrentPincode(savedAddr.pincode);
      handleCheckPincode(savedAddr.pincode);
    }
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

    const customerDetails = {
      name: fullName.trim(),
      phone: mobileNumber,
      email: email.trim() || undefined,
      address: fullAddress,
      city: deliveryMethod === 'Home Delivery' ? city.trim() : 'Samastipur',
      state: deliveryMethod === 'Home Delivery' ? state : 'Bihar',
      pinCode: deliveryMethod === 'Home Delivery' ? pinCode : '848103',
      deliveryMethod: deliveryMethod
    };

    const orderNotes = isGift && giftMessage.trim()
      ? `Gift for: ${giftRecipientName.trim() || 'Recipient'}. Message: ${giftMessage.trim()}. Payment method: Cash on Delivery`
      : `Payment method: Cash on Delivery`;

    const chosenMethodTitle = deliveryMethod === 'Store Pickup'
      ? 'Store Pickup'
      : (activeDeliveryOption?.title || 'Standard Delivery');

    // Execute order creation
    placeOrder({
      customer: customerDetails,
      customer_name: fullName.trim(),
      customer_phone: mobileNumber,
      shipping_address: customerDetails,
      notes: orderNotes,
      coupon_code: appliedCoupon?.code || undefined,
      delivery_option: selectedDeliveryOption,
      delivery_method: chosenMethodTitle,
      shipping_charge: shippingFee,
      items: cart,
      subtotal,
      discount: couponDiscountAmount,
      shipping: shippingFee,
      total: grandTotal,
      paymentMethod: 'Cash on Delivery',
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

      // Cash on Delivery - Order Confirmed
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
    }).catch((err) => {
      console.error('Order creation error:', err);
      setErrorMsg(err?.message || 'Failed to place order. Please check your connection and try again.');
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

  const ctaText = `PLACE COD ORDER — ₹${grandTotal.toLocaleString('en-IN')}`;

  // ==========================================
  // 0. HYDRATION LOADER VIEW
  // ==========================================
  if (!isHydrated) {
    return <CheckoutSkeleton />;
  }

  // ==========================================
  // 0b. FULL-PAGE SKELETON WHILE BACKEND DATA LOADS
  // ==========================================
  if (isHydrated && user && cart.length > 0 && !shippingAddressesLoaded) {
    return <CheckoutSkeleton />;
  }

  // ==========================================
  // 1. ORDER CONFIRMATION / SUCCESS VIEW
  // ==========================================
  if (isOrdered && createdOrder) {
    const isCod = createdOrder.paymentMethod === 'Cash on Delivery';
    const cleanPin = (createdOrder.customer?.pinCode || pinCode || '').trim();
    const isLocal20MinDelivery = Boolean(
      cleanPin === '848101' ||
      cleanPin === '848114' ||
      (deliveryInfo && (deliveryInfo.is20MinDelivery || deliveryInfo.isExpress)) ||
      createdOrder.customer?.deliveryMethod === 'Store Pickup'
    );

    const orderItems = createdOrder.items || [];

    return (
      <div className="min-h-screen bg-[#FAF7F0] text-[#292524] flex flex-col justify-center items-center font-sans py-10 sm:py-16 px-4">
        <main className="max-w-md w-full mx-auto">
          {/* Status Check Icon */}
          <div className="w-16 h-16 rounded-full bg-[#6B1725] text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Check size={32} strokeWidth={2.5} className="text-white" />
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#292524] text-center mb-2">
            Order placed
          </h1>

          {/* Subtitle - Ramesh picking ONLY for 20-min local delivery */}
          <p className="text-xs sm:text-sm text-[#7A6E65] text-center max-w-sm mx-auto leading-relaxed mb-6 font-sans">
            {isLocal20MinDelivery
              ? "Ramesh is picking your saree off the shelf now. He'll be at your door in about 20 minutes."
              : "Thank you for your order. We are carefully inspecting and preparing your saree for dispatch."}
          </p>

          {/* Card 1 & Timeline: Conditional based on 20-min local vs standard */}
          {isLocal20MinDelivery ? (
            /* Local 20-Min Delivery: Card with 20-min delivery line */
            <div className="bg-white rounded-2xl p-5 border border-[#E5DEC9] shadow-2xs mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-sans font-medium text-[#7A6E65] uppercase tracking-wider">
                  ORDER
                </span>
                <span className="font-bold text-sm text-[#292524]">
                  {createdOrder.orderId}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-medium text-[#7A6E65] uppercase tracking-wider">
                  PAYING
                </span>
                <span className="font-bold text-sm text-[#292524]">
                  ₹{createdOrder.total.toLocaleString('en-IN')} · {isCod ? 'cash on delivery' : 'paid online'}
                </span>
              </div>

              <div className="border-t border-[#F3ECE0] my-3.5" />

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF6EE] border border-[#E5DEC9] p-0.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                  <img src="/expressdel.webp" alt="Express Delivery" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#292524]">
                    Arriving in about 20 minutes
                  </p>
                  <p className="text-xs text-[#7A6E65] mt-0.5">
                    To {cleanPin || defaultDeliveryPincode || ''}{createdOrder.customer?.city ? `, ${createdOrder.customer.city}` : ', Samastipur'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Delivery: Simple Order Summary Card + Delivery Timeline Card */
            <>
              <div className="bg-white rounded-2xl p-5 border border-[#E5DEC9] shadow-2xs mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-sans font-medium text-[#7A6E65] uppercase tracking-wider">
                    ORDER
                  </span>
                  <span className="font-bold text-sm text-[#292524]">
                    {createdOrder.orderId}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-sans font-medium text-[#7A6E65] uppercase tracking-wider">
                    PAYING
                  </span>
                  <span className="font-bold text-sm text-[#292524]">
                    ₹{createdOrder.total.toLocaleString('en-IN')} · {isCod ? 'cash on delivery' : 'paid online'}
                  </span>
                </div>
              </div>

              {/* Delivery Timeline Card */}
              <div className="bg-white rounded-2xl p-5 border border-[#E5DEC9] shadow-2xs mb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-sans font-medium text-[#7A6E65] uppercase tracking-wider">
                    DELIVERY TIMELINE
                  </span>
                  <span className="text-xs font-semibold text-[#6B1725] bg-[#FAF6EE] border border-[#E5DEC9] px-2.5 py-0.5 rounded-full">
                    {deliveryDateInfo.deliveryByText}
                  </span>
                </div>

                <div className="grid grid-cols-4 text-center relative pt-1">
                  {/* Horizontal connecting line behind circles */}
                  <div className="absolute top-4.5 left-[12.5%] right-[12.5%] h-0.5 bg-[#E5DEC9] z-0" />

                  {/* Step 1: Placed */}
                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className="w-7 h-7 rounded-full bg-[#6B1725] text-white flex items-center justify-center text-xs shadow-xs">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-[11px] font-bold text-[#292524] leading-tight">Order Placed</span>
                    <span className="text-[10px] text-[#7A6E65]">Confirmed</span>
                  </div>

                  {/* Step 2: Quality Check */}
                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className="w-7 h-7 rounded-full bg-[#FAF7F0] border-2 border-[#E5DEC9] text-[#7A6E65] flex items-center justify-center text-[10px] font-bold">
                      2
                    </div>
                    <span className="text-[11px] font-medium text-[#7A6E65] leading-tight">Quality Check</span>
                    <span className="text-[10px] text-[#7A6E65]">Silk test</span>
                  </div>

                  {/* Step 3: Packed */}
                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className="w-7 h-7 rounded-full bg-[#FAF7F0] border-2 border-[#E5DEC9] text-[#7A6E65] flex items-center justify-center text-[10px] font-bold">
                      3
                    </div>
                    <span className="text-[11px] font-medium text-[#7A6E65] leading-tight">Packed</span>
                    <span className="text-[10px] text-[#7A6E65]">Care box</span>
                  </div>

                  {/* Step 4: Shipped */}
                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className="w-7 h-7 rounded-full bg-[#FAF7F0] border-2 border-[#E5DEC9] text-[#7A6E65] flex items-center justify-center text-[10px] font-bold">
                      4
                    </div>
                    <span className="text-[11px] font-medium text-[#7A6E65] leading-tight">Shipped</span>
                    <span className="text-[10px] text-[#7A6E65]">{deliveryDateInfo.shortFormat}</span>
                  </div>
                </div>

                <div className="border-t border-[#F3ECE0] mt-4 pt-3 text-xs text-[#7A6E65] flex items-center justify-between">
                  <span>Shipping to:</span>
                  <span className="font-semibold text-[#292524] text-right truncate max-w-[200px]">
                    {createdOrder.customer?.city || 'Your address'}{cleanPin ? `, ${cleanPin}` : ''}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Tax Invoice & GST Summary Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DEC9] shadow-2xs mb-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-sans font-medium text-[#7A6E65] uppercase tracking-wider">
                TAX INVOICE & GST
              </span>
              <span className="text-xs font-mono font-bold text-[#6B1725] bg-[#FAF6EE] border border-[#E5DEC9] px-2 py-0.5 rounded">
                {createdOrder.invoice_number || createdOrder.orderId}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-[#7A6E65] pt-1 border-t border-[#F3ECE0]">
              {createdOrder.taxable_amount != null && (
                <div className="flex justify-between">
                  <span>Taxable Value</span>
                  <span className="font-medium text-[#292524]">
                    ₹{Number(createdOrder.taxable_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {createdOrder.gst_amount != null && (
                <div className="flex justify-between">
                  <span>Total GST ({createdOrder.gst_rate || 5}%)</span>
                  <span className="font-medium text-[#292524]">
                    ₹{Number(createdOrder.gst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {Number(createdOrder.cgst_amount || 0) > 0 && (
                <div className="flex justify-between text-[11px] pl-2 text-[#7A6E65]">
                  <span>CGST ({(Number(createdOrder.gst_rate || 5) / 2).toFixed(1)}%)</span>
                  <span>₹{Number(createdOrder.cgst_amount).toFixed(2)}</span>
                </div>
              )}
              {Number(createdOrder.sgst_amount || 0) > 0 && (
                <div className="flex justify-between text-[11px] pl-2 text-[#7A6E65]">
                  <span>SGST ({(Number(createdOrder.gst_rate || 5) / 2).toFixed(1)}%)</span>
                  <span>₹{Number(createdOrder.sgst_amount).toFixed(2)}</span>
                </div>
              )}
              {Number(createdOrder.igst_amount || 0) > 0 && (
                <div className="flex justify-between text-[11px] pl-2 text-[#7A6E65]">
                  <span>IGST ({Number(createdOrder.gst_rate || 5)}%)</span>
                  <span>₹{Number(createdOrder.igst_amount).toFixed(2)}</span>
                </div>
              )}
              {createdOrder.place_of_supply && (
                <div className="flex justify-between text-[10px] text-[#A89F91] pt-0.5">
                  <span>Place of Supply</span>
                  <span>{createdOrder.place_of_supply}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#F3ECE0]">
              <Link
                href={`/receipt/${encodeURIComponent(createdOrder.invoice_number || createdOrder.orderId)}`}
                target="_blank"
                className="text-xs font-semibold text-[#6B1725] hover:text-[#52111C] flex items-center justify-center gap-1.5 py-2 bg-[#FAF7F0] hover:bg-[#F3ECE0] rounded-xl transition-colors font-sans"
              >
                <Download size={13} />
                <span>View & Download Tax Invoice</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Items List */}
          {orderItems.length > 0 && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DEC9] shadow-2xs mb-6 divide-y divide-[#F3ECE0]">
              {orderItems.map((item: any, idx: number) => {
                const prod = item.product || item;
                const img = prod.images?.[0] || prod.image || '/brand_logo.webp';
                const name = prod.name || 'Handloom Banarasi Saree';
                const sku = prod.sku || prod.designCode || 'SBS';
                const quantity = item.quantity || 1;
                const price = (prod.salePrice ?? prod.price ?? 0) * quantity;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3.5 ${idx > 0 ? 'pt-3.5' : ''} ${
                      idx < orderItems.length - 1 ? 'pb-3.5' : ''
                    }`}
                  >
                    <img
                      src={img}
                      alt={name}
                      className="w-14 h-18 sm:w-16 sm:h-20 rounded-xl object-cover border border-[#E5DEC9] shrink-0 bg-[#FAF7F0]"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[#292524] line-clamp-2 leading-snug">
                        {name}
                      </h3>
                      <p className="text-xs text-[#7A6E65] mt-1 font-mono">
                        {sku}
                        {quantity > 1 && (
                          <span className="ml-2 font-sans text-[11px] font-bold text-[#6B1725]">
                            (Qty: {quantity})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-[#292524] text-right shrink-0 pl-2">
                      ₹{price.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action CTAs: Maroon Account Tracker & Cream Keep Browsing */}
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/account?orderId=${encodeURIComponent(createdOrder.orderId)}`)}
              className="w-full py-4 bg-[#6B1725] hover:bg-[#52111C] text-white rounded-full font-medium text-sm transition-all shadow-md active:scale-[0.99] cursor-pointer text-center block"
            >
              Track order in account
            </button>

            <button
              onClick={() => router.push('/sarees')}
              className="w-full py-4 bg-[#FAF7F0] hover:bg-[#F3ECE0] border border-[#E5DEC9] text-[#292524] rounded-full font-medium text-sm transition-all active:scale-[0.99] cursor-pointer text-center block"
            >
              Keep browsing
            </button>
          </div>

          {/* Bottom assurance note */}
          <p className="text-center text-xs text-[#7A6E65] max-w-xs mx-auto mt-6 leading-relaxed font-sans">
            {isLocal20MinDelivery
              ? "Open the packet in front of the rider. If the weave isn't what you saw, hand it straight back — no questions."
              : "Authentic handloom guarantee. If the weave isn't what you expected, enjoy 7-day hassle-free doorstep returns."}
          </p>
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
    <div className="min-h-screen bg-[#FAF7F0] text-[#292524] flex flex-col font-sans pb-32 lg:pb-16">
      {/* 1. TOP HEADER */}
      <header className="bg-white border-b border-[#E5DEC9] py-3.5 px-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-xl lg:max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-1 rounded-full text-[#292524] hover:text-[#6B1725] hover:bg-[#FAF7F0] transition-colors cursor-pointer flex items-center gap-1.5"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
            <span className="hidden lg:inline font-sans text-xs font-semibold text-[#6B625D]">Back</span>
          </button>

          <div className="flex items-center gap-2.5">
            <Link href="/" className="hidden lg:flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/brand_logo.webp" alt="Shree Banarasi Sarees" className="h-8 w-auto object-contain" />
            </Link>
            <span className="hidden lg:inline text-[#D4C39D]">&bull;</span>
            <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#292524]">
              Checkout
            </h1>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#0F766E] font-medium bg-emerald-50/80 px-2.5 py-1 rounded-full border border-emerald-200/60">
            <ShieldCheck size={15} className="text-[#0F766E]" />
            <span className="hidden sm:inline">100% Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* 2. STEPPER BAR (Address -> Delivery -> Payment) */}
      <div className="bg-[#FAF7F0] border-b border-[#E5DEC9] py-3 px-4">
        <div className="max-w-xl lg:max-w-6xl mx-auto flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-sans">
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
      <main className="max-w-xl lg:max-w-6xl mx-auto w-full px-4 py-4 lg:py-6 space-y-4 flex-1">
        {cart.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center bg-white border border-[#E5DEC9] rounded-2xl shadow-2xs px-6 max-w-xl mx-auto my-8">
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
              className="py-3 px-8 bg-[#6B1725] text-white rounded-full font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#52111C] transition-all shadow-md cursor-pointer"
            >
              EXPLORE COLLECTIONS
            </button>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
            {/* LEFT COLUMN: Steps & Selections */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-4">
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

              {shippingAddressesLoading && (!shippingAddresses || shippingAddresses.length === 0) ? (
                <div className="flex lg:grid lg:grid-cols-2 gap-3 overflow-hidden pb-1.5 pt-0.5 animate-pulse" aria-hidden="true">
                  {[0, 1, 2].map((n) => (
                    <div
                      key={n}
                      className="snap-start w-[240px] sm:w-[260px] lg:w-auto shrink-0 lg:shrink bg-white rounded-xl border border-[#E5DEC9] p-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          <div className="w-24 h-3 bg-stone-200 rounded-md" />
                          <div className="w-4 h-4 rounded-full border border-[#E5DEC9]" />
                        </div>
                        <div className="w-full h-2.5 bg-stone-200 rounded-md mb-1.5" />
                        <div className="w-4/5 h-2.5 bg-stone-200 rounded-md mb-1.5" />
                        <div className="w-1/2 h-2.5 bg-stone-200 rounded-md" />
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#F3ECE0] flex items-center justify-end">
                        <div className="w-10 h-2.5 bg-stone-200 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : shippingAddresses && shippingAddresses.length > 0 ? (
                <div className="flex lg:grid lg:grid-cols-2 gap-3 overflow-x-auto lg:overflow-visible pb-1.5 pt-0.5 scrollbar-none snap-x snap-mandatory">
                  {shippingAddresses.map((addr: any) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr)}
                        className={`snap-start w-[240px] sm:w-[260px] lg:w-auto shrink-0 lg:shrink bg-white rounded-xl border p-3 cursor-pointer transition-all flex flex-col justify-between relative ${
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

                  {/* Add New Address Card in Grid / Horizontal Scroll */}
                  <div
                    onClick={handleAddNewAddressSelect}
                    className="snap-start w-[160px] lg:w-auto shrink-0 lg:shrink bg-[#FFF9F0] rounded-xl border-2 border-dashed border-[#B08A3C]/40 p-3 cursor-pointer hover:border-[#6B1725] transition-all flex flex-col items-center justify-center text-center gap-1.5 min-h-[110px]"
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

            {/* 4. DELIVERY OPTIONS SELECTOR (dynamic based on delivery_settings & customer distance) */}
            {loadingPincode ? (
              <div className="bg-white rounded-2xl border border-[#E5DEC9] p-4 flex items-start justify-between shadow-2xs animate-pulse" aria-hidden="true">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-7 h-7 rounded-full bg-stone-200 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className="w-40 sm:w-52 h-3.5 bg-stone-200 rounded-md" />
                    <div className="w-56 sm:w-72 h-2.5 bg-stone-200 rounded-md" />
                  </div>
                </div>
                <div className="w-10 h-3.5 bg-stone-200 rounded-md shrink-0" />
              </div>
            ) : deliveryInfo && (deliveryInfo.success === false || deliveryInfo.isOutsideServiceArea || deliveryInfo.serviceable === false) ? (
              /* DELIVERY NOT AVAILABLE */
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs space-y-1.5 text-stone-700 shadow-2xs">
                <div className="flex items-center gap-2 font-extrabold text-stone-800 font-serif">
                  <AlertCircle size={16} className="text-stone-600" />
                  <span>Delivery Not Available</span>
                </div>
                <p className="text-[#6B625D] text-[11px]">
                  {deliveryInfo?.error || deliveryInfo?.message || "We currently don't deliver to this location."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-bold text-[#B08A3C] uppercase tracking-wider block">
                    DELIVERY OPTIONS
                  </span>
                  {deliveryInfo?.distanceKm ? (
                    <span className="text-[11px] text-[#7A6E65] font-medium">
                      Distance: ~{deliveryInfo.distanceKm} km
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2.5">
                  {deliveryOptions.map((opt) => {
                    const isSelected = selectedDeliveryOption === opt.id;
                    const isAvailable = opt.available;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedDeliveryOption(opt.id);
                          }
                        }}
                        className={`rounded-2xl p-3.5 sm:p-4 transition-all relative border ${
                          !isAvailable
                            ? 'bg-stone-50/80 border-stone-200 opacity-60 cursor-not-allowed select-none'
                            : isSelected
                            ? 'border-2 border-[#6B1725] bg-[#6B1725]/[0.03] shadow-2xs cursor-pointer'
                            : 'border-[#E5DEC9] bg-white hover:border-[#6B1725]/40 cursor-pointer shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {/* Selection Radio Circle */}
                            <div className="pt-1 shrink-0">
                              {isSelected && isAvailable ? (
                                <div className="w-4 h-4 rounded-full bg-[#6B1725] flex items-center justify-center text-white">
                                  <Check size={10} strokeWidth={3} />
                                </div>
                              ) : (
                                <div className={`w-4 h-4 rounded-full border ${isAvailable ? 'border-[#D4C39D]' : 'border-stone-300 bg-stone-100'}`} />
                              )}
                            </div>

                            {/* Delivery Option WebP Image */}
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
                              isSelected && isAvailable ? 'bg-white ring-1.5 ring-[#6B1725]' : 'bg-[#FAF7F0] border border-[#E5DEC9]'
                            }`}>
                              <img
                                src={opt.image || (opt.id === 'express' ? '/expressdel.webp' : opt.id === 'same_day' ? '/sameday.webp' : '/standarddel.webp')}
                                alt={opt.title}
                                className={`w-full h-full object-contain p-1 ${!isAvailable ? 'grayscale opacity-60' : ''}`}
                              />
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`font-sans font-bold text-xs sm:text-sm ${isAvailable ? 'text-[#292524]' : 'text-stone-400'}`}>
                                  {opt.title}
                                </h4>
                                {opt.badge && isAvailable && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                    opt.id === 'express'
                                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                                      : opt.id === 'same_day'
                                      ? 'text-amber-800 bg-amber-50 border-amber-200'
                                      : 'text-stone-700 bg-stone-100 border-stone-200'
                                  }`}>
                                    {opt.badge}
                                  </span>
                                )}
                                {!isAvailable && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-stone-500 bg-stone-100 border-stone-200 whitespace-nowrap">
                                    Disabled
                                  </span>
                                )}
                              </div>

                              <p className={`text-[11px] mt-1 leading-relaxed ${isAvailable ? 'text-[#7A6E65]' : 'text-stone-400'}`}>
                                {opt.description}
                              </p>

                              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6B1725] mt-1.5">
                                <Clock size={13} className="text-[#6B1725] shrink-0" />
                                <span>{opt.eta}</span>
                              </div>

                              {!isAvailable && opt.unavailableReason && (
                                <p className="text-[10px] text-amber-700 mt-1 font-medium flex items-center gap-1">
                                  <AlertCircle size={11} />
                                  <span>{opt.unavailableReason}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`font-sans font-extrabold text-sm sm:text-base tabular-nums block ${isAvailable ? 'text-[#292524]' : 'text-stone-400'}`}>
                              ₹{opt.charge}
                            </span>
                            <span className="text-[10px] text-[#7A6E65]">incl. GST</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. PAYMENT METHOD SECTION */}
            <div className="space-y-2.5 pt-1">
              <span className="text-[10px] font-sans font-bold text-[#B08A3C] uppercase tracking-wider block mb-1">
                PAYMENT METHOD
              </span>

              {/* Cash on delivery */}
              <div
                className="bg-white rounded-2xl p-4 flex items-center justify-between border-2 border-[#6B1725] shadow-2xs"
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
                <div className="w-5 h-5 rounded-full bg-[#6B1725] flex items-center justify-center text-white text-[10px]">
                  <Check size={12} strokeWidth={3} />
                </div>
              </div>

              <p className="text-xs text-[#7A6E65] leading-relaxed font-sans pt-1">
                Cash on delivery is how most of Samastipur buys from us. Open the packet in front of the rider &mdash; if the weave isn&apos;t what you saw, send it straight back.
              </p>
            </div>

            {/* 6. ORDER SUMMARY CARD (Mobile only) */}
            <div className="lg:hidden bg-white rounded-2xl border border-[#E5DEC9] p-4 space-y-3 shadow-2xs">
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
                      <span className="font-sans font-bold text-xs sm:text-sm text-[#292524] tabular-nums shrink-0">
                        ₹{(price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Code Section (Mobile) */}
              <div className="pt-2 border-t border-[#F3ECE0]">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="COUPON CODE"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="w-full bg-[#FAF7F0] border border-dashed border-[#B08A3C]/60 rounded-xl px-3 py-2.5 text-xs uppercase font-sans font-medium text-[#292524] placeholder:text-[#A89F91] outline-none focus:border-[#6B1725]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2.5 bg-[#FAF7F0] hover:bg-[#6B1725] hover:text-white text-[#6B1725] border border-[#6B1725]/30 rounded-xl font-sans font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                </div>

                {couponError && (
                  <p className="text-[11px] text-red-600 font-medium mt-1 px-0.5">{couponError}</p>
                )}

                {appliedCoupon && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Tag size={13} className="text-emerald-700" />
                      <span><strong>{appliedCoupon.code}</strong> applied (-₹{appliedCoupon.discountAmount.toLocaleString('en-IN')})</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Price Details (Mobile) */}
              <div className="space-y-2.5 pt-3 border-t border-[#F3ECE0] text-xs font-sans">
                <h4 className="font-serif font-bold text-xs sm:text-sm text-[#292524] uppercase tracking-wider">
                  Price Details
                </h4>

                <div className="flex justify-between text-[#7A6E65]">
                  <span>Item total</span>
                  <span className="font-medium text-[#292524]">₹{originalTotal.toLocaleString('en-IN')}</span>
                </div>

                {totalProductDiscount > 0 && (
                  <div className="flex justify-between text-[#7A6E65]">
                    <span>Product discount</span>
                    <span className="font-medium text-[#0F766E]">- ₹{totalProductDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {appliedCoupon && couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-[#7A6E65]">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span className="font-medium text-[#0F766E]">- ₹{couponDiscountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#7A6E65]">
                  <span>Delivery ({activeDeliveryOption?.title ? activeDeliveryOption.title.replace(' Delivery', '') : 'Standard'})</span>
                  <span className="font-sans font-bold text-[#292524] tabular-nums">
                    {shippingFee === 0 ? (
                      <span className="text-[#0F766E] font-bold">FREE</span>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>

                {/* Divider Line */}
                <div className="border-t border-[#E5DEC9] pt-3 flex justify-between items-baseline">
                  <span className="font-sans font-bold text-sm sm:text-base text-[#292524]">Total Payable</span>
                  <span className="font-sans font-extrabold text-2xl text-[#6B1725] tabular-nums tracking-tight">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {totalProductDiscount + couponDiscountAmount > 0 && (
                  <p className="text-xs font-semibold text-[#0F766E] pt-0.5">
                    🎉 You saved ₹{(totalProductDiscount + couponDiscountAmount).toLocaleString('en-IN')}
                  </p>
                )}

                <div className="text-[11px] text-[#7A6E65] font-sans pt-0.5">
                  Prices include applicable GST
                </div>
              </div>
            </div>
          </>
        </div>

        {/* RIGHT COLUMN: Desktop Sticky Order Summary & Checkout (Visible on lg+) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-5">
          <div className="sticky top-24 space-y-4">
            {/* ORDER SUMMARY CARD */}
            <div className="bg-white rounded-2xl border border-[#E5DEC9] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-3">
                <span className="text-xs font-sans font-bold text-[#B08A3C] uppercase tracking-wider">
                  ORDER SUMMARY &middot; {cart.reduce((sum, item) => sum + item.quantity, 0)} SAREE{cart.reduce((sum, item) => sum + item.quantity, 0) > 1 ? 'S' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => router.push('/cart')}
                  className="text-xs font-semibold text-[#6B1725] hover:underline cursor-pointer"
                >
                  Edit Cart
                </button>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {cart.map((item) => {
                  const currentPrice = item.product.salePrice ?? item.product.price;
                  const originalPrice = item.product.price;
                  const hasDiscount = !!item.product.salePrice && item.product.salePrice < originalPrice;

                  return (
                    <div key={item.product.id} className="flex items-center justify-between gap-3 py-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-16 rounded-xl overflow-hidden bg-[#FAF7F0] shrink-0 border border-[#E5DEC9]">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-sans font-bold text-[#B08A3C] uppercase tracking-wider block truncate">
                            {item.product.fabric || item.product.category || 'BANARASI SILK'}
                          </span>
                          <h5 className="font-serif font-bold text-xs text-[#292524] line-clamp-1 leading-snug">
                            {item.product.name}
                          </h5>
                          <span className="text-[11px] font-sans text-[#7A6E65] block mt-0.5">
                            Qty: {item.quantity} &middot; Blouse piece incl.
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-sans font-bold text-sm text-[#292524] tabular-nums">
                          ₹{(currentPrice * item.quantity).toLocaleString('en-IN')}
                        </div>
                        {hasDiscount && (
                          <span className="text-[11px] text-[#A89F91] line-through block tabular-nums">
                            ₹{(originalPrice * item.quantity).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Code Section */}
              <div className="pt-2 border-t border-[#F3ECE0]">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="COUPON CODE"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="w-full bg-[#FAF7F0] border border-dashed border-[#B08A3C]/60 rounded-xl px-3 py-2.5 text-xs uppercase font-sans font-medium text-[#292524] placeholder:text-[#A89F91] outline-none focus:border-[#6B1725]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2.5 bg-[#FAF7F0] hover:bg-[#6B1725] hover:text-white text-[#6B1725] border border-[#6B1725]/30 rounded-xl font-sans font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                </div>

                {couponError && (
                  <p className="text-[11px] text-red-600 font-medium mt-1 px-0.5">{couponError}</p>
                )}

                {appliedCoupon && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Tag size={13} className="text-emerald-700" />
                      <span><strong>{appliedCoupon.code}</strong> applied (-₹{appliedCoupon.discountAmount.toLocaleString('en-IN')})</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Price Details */}
              <div className="space-y-2.5 pt-3 border-t border-[#F3ECE0] text-xs font-sans">
                <h4 className="font-serif font-bold text-xs sm:text-sm text-[#292524] uppercase tracking-wider">
                  Price Details
                </h4>

                <div className="flex justify-between text-[#7A6E65]">
                  <span>Item total</span>
                  <span className="font-medium text-[#292524]">₹{originalTotal.toLocaleString('en-IN')}</span>
                </div>

                {totalProductDiscount > 0 && (
                  <div className="flex justify-between text-[#7A6E65]">
                    <span>Product discount</span>
                    <span className="font-medium text-[#0F766E]">- ₹{totalProductDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {appliedCoupon && couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-[#7A6E65]">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span className="font-medium text-[#0F766E]">- ₹{couponDiscountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#7A6E65]">
                  <span>Delivery ({activeDeliveryOption?.title ? activeDeliveryOption.title.replace(' Delivery', '') : 'Standard'})</span>
                  <span className="font-sans font-bold text-[#292524] tabular-nums">
                    {shippingFee === 0 ? (
                      <span className="text-[#0F766E] font-bold">FREE</span>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>

                {/* Divider Line */}
                <div className="border-t border-[#E5DEC9] pt-3 flex justify-between items-baseline">
                  <span className="font-sans font-bold text-sm sm:text-base text-[#292524]">Total Payable</span>
                  <span className="font-sans font-extrabold text-2xl text-[#6B1725] tabular-nums tracking-tight">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {totalProductDiscount + couponDiscountAmount > 0 && (
                  <p className="text-xs font-semibold text-[#0F766E] pt-0.5">
                    🎉 You saved ₹{(totalProductDiscount + couponDiscountAmount).toLocaleString('en-IN')}
                  </p>
                )}

                <div className="text-[11px] text-[#7A6E65] font-sans pt-0.5">
                  Prices include applicable GST
                </div>
              </div>

              {/* Primary Desktop Action Button */}
              <button
                type="button"
                onClick={() => handlePlaceOrder()}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-80 text-white rounded-full font-sans font-bold text-sm tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>PLACING ORDER...</span>
                  </>
                ) : (
                  <span>PLACE ORDER &bull; ₹{grandTotal.toLocaleString('en-IN')}</span>
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-[11px] text-[#7A6E65] font-sans">
                  ✓ Cash on Delivery &middot; Pay at your doorstep
                </p>
              </div>
            </div>

            {/* TRUST & GUARANTEES BADGE CARD */}
            <div className="bg-[#FAF7F0] border border-[#E5DEC9] rounded-2xl p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#6B1725]">
                <Sparkles size={15} />
                <span>Shree Banarasi Sarees Guarantee</span>
              </div>
              <ul className="text-[11px] text-[#7A6E65] space-y-1.5 font-sans leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check size={13} className="text-[#0F766E] mt-0.5 shrink-0" />
                  <span>100% Certified Authentic Banarasi Silk with Silk Mark guarantee</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={13} className="text-[#0F766E] mt-0.5 shrink-0" />
                  <span>Open-box inspection for COD &mdash; check weave before paying</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={13} className="text-[#0F766E] mt-0.5 shrink-0" />
                  <span>Direct from weavers &bull; No middlemen markup</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )}
  </main>

  {/* 7. STICKY BOTTOM CHECKOUT ACTION BAR (Mobile & Tablet only) */}
  {cart.length > 0 && !isOrdered && (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5DEC9] px-4 py-3.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="font-sans font-extrabold text-xl sm:text-2xl text-[#292524] tabular-nums tracking-tight">
                ₹{grandTotal.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-[#7A6E65] font-sans block">
                Prices include applicable GST
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

      {/* SHARED ADD NEW ADDRESS MODAL (same as product details page) */}
      <AddNewAddressModal
        isOpen={isAddAddressModalOpen}
        onClose={() => setIsAddAddressModalOpen(false)}
        onAddressSaved={handleNewAddressSaved}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutContent />
    </Suspense>
  );
}
