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
  FileText,
  Truck,
  ArrowRight
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
import { CheckoutSkeleton } from '../../components/CheckoutSkeleton';
import { getStandardDeliveryDateInfo } from '../../lib/deliveryDates';
import { buildReceiptDataFromOrder, downloadInvoicePdf } from '../../lib/invoicePdf';
import ContextualNotificationBanner from '../../components/notifications/ContextualNotificationBanner';

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
    setIsAuthModalOpen,
    products
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

  // Invoice direct download states
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [isInvoiceDownloaded, setIsInvoiceDownloaded] = useState(false);

  const handleDownloadInvoice = async () => {
    if (!createdOrder || isDownloadingInvoice) return;
    try {
      setIsDownloadingInvoice(true);
      const receiptData = buildReceiptDataFromOrder(createdOrder, products);
      await downloadInvoicePdf(receiptData);
      setIsInvoiceDownloaded(true);
      setTimeout(() => setIsInvoiceDownloaded(false), 4000);
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert('Failed to generate invoice PDF. Please try again.');
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  // Form Fields - Dynamic initialization
  const isPhoneValid = Boolean(userPhone && /^[6-9]\d{9}$/.test(userPhone));
  const [mobileNumber, setMobileNumber] = useState<string>((isPhoneValid && userPhone) ? userPhone : '');
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

  // 3-step wizard state: 1 = Address, 2 = Delivery, 3 = Review & Pay
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);


  // Saved Addresses selection - initialize from sessionStorage to preserve selection on refresh
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('selected_shipping_address_id');
      if (saved) return saved;
    }
    return '';
  });

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

  const deliveryDateInfo = useMemo(() => {
    return getStandardDeliveryDateInfo(new Date(), deliverySettings?.standard_delivery_days ?? 3);
  }, [deliverySettings?.standard_delivery_days]);

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
      // Priority order:
      // 1. Address whose pincode matches currentPincode (user's active pincode is the truth)
      // 2. Address saved in sessionStorage — only trusted if currentPincode is NOT set (fresh/refresh)
      // 3. Default/first address — ONLY used if currentPincode is not set at all
      // If currentPincode is set but matches no saved address → open form for custom pincode

      const matchingAddr = currentPincode
        ? shippingAddresses.find((a: any) => a.pincode?.trim() === currentPincode.trim())
        : null;

      const savedId = typeof window !== 'undefined' ? sessionStorage.getItem('selected_shipping_address_id') : null;
      const savedAddr = savedId ? shippingAddresses.find((a: any) => a.id === savedId) : null;

      // defaultAddr is only eligible when no currentPincode is active (user arrived fresh)
      const defaultAddr = !currentPincode
        ? (shippingAddresses.find((a: any) => a.is_default) || shippingAddresses[0])
        : null;

      // sessionStorage addr is only trusted when no currentPincode is active (refresh case)
      const sessionAddr = !currentPincode ? savedAddr : null;

      const targetAddr = matchingAddr || sessionAddr || defaultAddr;

      if (targetAddr) {
        setFullName(targetAddr.full_name || '');
        setMobileNumber(targetAddr.phone || ((isPhoneValid && userPhone) ? userPhone : '') || '');
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
        setSelectedAddressId(targetAddr.id);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('selected_shipping_address_id', targetAddr.id);
        }
      } else if (currentPincode) {
        // currentPincode is set but matches no saved address — user picked a custom pincode elsewhere
        // Open the form pre-filled with pincode + auto-lookup city/state
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('selected_shipping_address_id');
        }
        setSelectedAddressId('new');
        setPinCode(currentPincode);
        handleCheckPincode(currentPincode);
        fetchPincodeDetails(currentPincode).then((details) => {
          if (details && details.success) {
            if (details.city) setCity(details.city);
            if (details.state) setState(details.state);
          }
        });
        setIsEditingAddress(true);
      } else {
        // No currentPincode at all — open form so user can enter their location
        setSelectedAddressId('new');
        setIsEditingAddress(true);
      }

      setHasPrefilled(true);
    } else if (userProfile && !hasPrefilled && shippingAddressesLoaded && (!shippingAddresses || shippingAddresses.length === 0)) {
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
  }, [shippingAddresses, shippingAddressesLoaded, userProfile, hasPrefilled, isPhoneValid, userPhone, pinCode, currentPincode, setCurrentPincode]);

  // Ensure selectedAddressId stays synchronized with saved addresses (e.g. on page refresh)
  useEffect(() => {
    if (shippingAddresses && shippingAddresses.length > 0) {
      const isAlreadySelected = shippingAddresses.some((a: any) => a.id === selectedAddressId);
      if (!isAlreadySelected && selectedAddressId !== 'new' && selectedAddressId !== '') {
        // selectedAddressId refers to an ID that no longer exists (e.g. deleted) — fall back to session/default
        const savedId = typeof window !== 'undefined' ? sessionStorage.getItem('selected_shipping_address_id') : null;
        const targetAddr =
          (savedId && shippingAddresses.find((a: any) => a.id === savedId)) ||
          shippingAddresses.find((a: any) => a.is_default) ||
          shippingAddresses[0];

        if (targetAddr) {
          setSelectedAddressId(targetAddr.id);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('selected_shipping_address_id', targetAddr.id);
          }
        }
      }
    }
  }, [shippingAddresses, selectedAddressId]);

  // Sort shipping addresses so that the selected address appears first, followed by the rest
  const sortedShippingAddresses = useMemo(() => {
    if (!shippingAddresses || shippingAddresses.length === 0) return [];

    const targetId =
      selectedAddressId && selectedAddressId !== 'new'
        ? selectedAddressId
        : (shippingAddresses.find((a: any) => a.is_default)?.id || null);

    if (!targetId) return shippingAddresses;

    const selected = shippingAddresses.filter((a: any) => a.id === targetId);
    const others = shippingAddresses.filter((a: any) => a.id !== targetId);

    return [...selected, ...others];
  }, [shippingAddresses, selectedAddressId]);

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
      default_pincode: '848101',
      standard_delivery_days: 3
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
    if (typeof window !== 'undefined' && addr.id) {
      sessionStorage.setItem('selected_shipping_address_id', addr.id);
    }
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
    const newId = savedAddr.id || 'new';
    setSelectedAddressId(newId);
    if (typeof window !== 'undefined' && savedAddr.id) {
      sessionStorage.setItem('selected_shipping_address_id', savedAddr.id);
    }
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
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setErrorMsg('Please enter a valid Indian mobile number (starts with 6–9, 10 digits).');
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

    const estimatedDeliveryDate = deliveryDateInfo?.startDate
      ? deliveryDateInfo.startDate.toISOString().split('T')[0]
      : new Date(Date.now() + (deliverySettings?.standard_delivery_days ?? 3) * 86400000).toISOString().split('T')[0];

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
      estimated_delivery_date: estimatedDeliveryDate,
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

  // Step validation
  const canAdvanceStep1 = Boolean(
    fullName.trim() && /^[6-9]\d{9}$/.test(mobileNumber) && address.trim() && city.trim() && pinCode.length === 6
  );
  const canAdvanceStep2 = Boolean(
    selectedDeliveryOption &&
    deliveryOptions.some(o => o.id === selectedDeliveryOption && o.available)
  );

  const handleStepChange = (step: 1 | 2 | 3) => {
    setErrorMsg('');
    setCurrentStep(step);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleContinueStep1 = () => {
    if (!mobileNumber.trim()) {
      setErrorMsg('Mobile number is required for order delivery.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setErrorMsg('Please enter a valid Indian mobile number (starts with 6–9, 10 digits).');
      return;
    }
    if (!canAdvanceStep1) {
      setErrorMsg('Please fill in all required address fields (name, phone, address, city, PIN).');
      return;
    }
    setErrorMsg('');
    if (pinCode.length === 6) {
      handleCheckPincode(pinCode);
    }
    // Save address to profile if requested and it's a new entry
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
      }).catch((err: any) => console.error('Error saving shipping address:', err));
    }
    setIsEditingAddress(false);
    handleStepChange(2);
  };

  const handleContinueStep2 = () => {
    if (!canAdvanceStep2) {
      setErrorMsg('Please select a valid delivery option.');
      return;
    }
    handleStepChange(3);
  };

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

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#7A6E65] text-center max-w-sm mx-auto leading-relaxed mb-6 font-sans">
            Thank you for your order. We are carefully inspecting and preparing your saree for dispatch.
          </p>

          {/* Order Summary Card */}
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

          {/* Real-time Push Notification Delivery Alerts Card */}
          <ContextualNotificationBanner
            variant="order_success"
            orderId={createdOrder.orderId}
            className="mb-4"
          />

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
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={isDownloadingInvoice}
                className="w-full text-xs font-semibold text-[#6B1725] hover:text-[#52111C] flex items-center justify-center gap-1.5 py-2 bg-[#FAF7F0] hover:bg-[#F3ECE0] rounded-xl transition-colors font-sans cursor-pointer disabled:opacity-60"
              >
                {isDownloadingInvoice ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Downloading Invoice...</span>
                  </>
                ) : isInvoiceDownloaded ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Invoice Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    <span>Download Tax Invoice</span>
                  </>
                )}
              </button>
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
              className="native-press w-full min-h-12 py-4 bg-[#6B1725] hover:bg-[#52111C] text-white rounded-2xl font-medium text-sm shadow-[0_5px_14px_rgba(107,23,37,0.22)] cursor-pointer text-center block"
            >
              Track order in account
            </button>

            <button
              onClick={() => router.push('/sarees')}
              className="native-press w-full min-h-12 py-4 bg-[#FAF7F0] hover:bg-[#F3ECE0] border border-[#E9DED1] text-[#292524] rounded-2xl font-medium text-sm cursor-pointer text-center block"
            >
              Keep browsing
            </button>
          </div>

          {/* Bottom assurance note */}
          <p className="text-center text-xs text-[#7A6E65] max-w-xs mx-auto mt-6 leading-relaxed font-sans">
            Authentic handloom guarantee. If the weave isn&apos;t what you expected, enjoy 7-day hassle-free doorstep returns.
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
              className="native-press w-full min-h-11 py-3.5 bg-[#6B1725] text-white rounded-2xl font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#52111C] shadow-[0_5px_14px_rgba(107,23,37,0.22)] cursor-pointer"
            >
              Sign In / Register
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF9F4] text-[#292524] flex flex-col font-sans pb-28 lg:pb-12">

      {/* ── 1. LUXURY TOP HEADER ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E9DED1] py-3.5 px-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-xl lg:max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (currentStep > 1) handleStepChange((currentStep - 1) as 1 | 2 | 3);
                else router.back();
              }}
              className="p-1 rounded-full text-[#292524] hover:text-[#6B1725] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ChevronLeft size={22} />
            </button>

            <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#292524]">
              Checkout
            </h1>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#0F766E] font-medium bg-emerald-50/90 px-3 py-1 rounded-full border border-emerald-200/60 shadow-2xs">
            <ShieldCheck size={14} className="text-[#0F766E] shrink-0" />
            <span className="hidden sm:inline text-[11px] sm:text-xs font-sans font-semibold">100% Secure Checkout</span>
            <span className="sm:hidden text-[11px] font-sans font-semibold">100% Secure</span>
          </div>
        </div>
      </header>

      {/* ── 2. ROYAL STEPPER BAR (MATCHING SBS LUXURY BRAND) ── */}
      <div className="bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E5DEC9] py-3.5 px-4 sticky top-[57px] z-20 shadow-2xs">
        <div className="max-w-xl lg:max-w-6xl mx-auto">
          <div className="flex items-center justify-between relative px-2 sm:px-6">
            {/* Background connecting track line */}
            <div className="absolute left-8 right-8 sm:left-14 sm:right-14 top-1/2 -translate-y-1/2 h-[2px] bg-[#E5DEC9] z-0" />

            {/* Active animated progress bar line */}
            <div
              className="absolute left-8 sm:left-14 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-[#6B1725] to-[#B08A3C] transition-all duration-500 ease-out z-0"
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? 'calc(50% - 24px)' : 'calc(100% - 48px)'
              }}
            />

            {/* Step 1: Address */}
            <button
              type="button"
              onClick={() => currentStep > 1 && handleStepChange(1)}
              className={`relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                currentStep === 1
                  ? 'bg-white shadow-xs border-2 border-[#6B1725] ring-2 ring-[#6B1725]/10'
                  : currentStep > 1
                  ? 'bg-white shadow-2xs border border-[#E5DEC9] cursor-pointer hover:border-[#6B1725]/50'
                  : 'bg-[#FAF7F0] border border-stone-200 opacity-60'
              }`}
            >
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold transition-colors ${
                currentStep > 1
                  ? 'bg-[#6B1725] text-white'
                  : currentStep === 1
                  ? 'bg-[#6B1725] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-400'
              }`}>
                {currentStep > 1 ? <Check size={12} strokeWidth={3} /> : '1'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-[8px] uppercase font-sans tracking-widest text-[#B08A3C] font-bold">Step 1</span>
                <span className={`block text-xs font-sans font-bold -mt-0.5 ${currentStep === 1 ? 'text-[#6B1725]' : 'text-[#292524]'}`}>
                  Address
                </span>
              </div>
              <span className={`sm:hidden text-xs font-sans font-bold ${currentStep === 1 ? 'text-[#6B1725]' : 'text-[#292524]'}`}>
                Address
              </span>
            </button>

            {/* Step 2: Delivery */}
            <button
              type="button"
              onClick={() => currentStep > 2 && handleStepChange(2)}
              className={`relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                currentStep === 2
                  ? 'bg-white shadow-xs border-2 border-[#6B1725] ring-2 ring-[#6B1725]/10'
                  : currentStep > 2
                  ? 'bg-white shadow-2xs border border-[#E5DEC9] cursor-pointer hover:border-[#6B1725]/50'
                  : 'bg-[#FAF7F0] border border-[#E5DEC9]'
              }`}
            >
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold transition-colors ${
                currentStep > 2
                  ? 'bg-[#6B1725] text-white'
                  : currentStep === 2
                  ? 'bg-[#6B1725] text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-[#7A6E65] border border-[#D4C39D]'
              }`}>
                {currentStep > 2 ? <Check size={12} strokeWidth={3} /> : '2'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-[8px] uppercase font-sans tracking-widest text-[#B08A3C] font-bold">Step 2</span>
                <span className={`block text-xs font-sans font-bold -mt-0.5 ${currentStep === 2 ? 'text-[#6B1725]' : currentStep > 2 ? 'text-[#292524]' : 'text-[#7A6E65]'}`}>
                  Delivery
                </span>
              </div>
              <span className={`sm:hidden text-xs font-sans font-bold ${currentStep === 2 ? 'text-[#6B1725]' : currentStep > 2 ? 'text-[#292524]' : 'text-[#7A6E65]'}`}>
                Delivery
              </span>
            </button>

            {/* Step 3: Review & Pay */}
            <div
              className={`relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                currentStep === 3
                  ? 'bg-white shadow-xs border-2 border-[#6B1725] ring-2 ring-[#6B1725]/10'
                  : 'bg-[#FAF7F0] border border-[#E5DEC9]'
              }`}
            >
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold transition-colors ${
                currentStep === 3
                  ? 'bg-[#6B1725] text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-[#7A6E65] border border-[#D4C39D]'
              }`}>
                3
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-[8px] uppercase font-sans tracking-widest text-[#B08A3C] font-bold">Step 3</span>
                <span className={`block text-xs font-sans font-bold -mt-0.5 ${currentStep === 3 ? 'text-[#6B1725]' : 'text-[#7A6E65]'}`}>
                  Review & Pay
                </span>
              </div>
              <span className={`sm:hidden text-xs font-sans font-bold ${currentStep === 3 ? 'text-[#6B1725]' : 'text-[#7A6E65]'}`}>
                Pay
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN CHECKOUT WORKSPACE ── */}
      <main className="max-w-xl lg:max-w-6xl mx-auto w-full px-4 py-5 sm:py-7 flex-1">
        {cart.length === 0 ? (
          /* Empty bag state */
          <div className="py-20 text-center flex flex-col items-center justify-center bg-white border border-[#E5DEC9] rounded-3xl shadow-2xs px-6 max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F0] border border-[#E5DEC9] flex items-center justify-center text-[#6B1725] mb-4">
              <ShoppingBag size={28} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-2xl text-[#292524] font-normal tracking-tight mb-2">
              Your bag is empty
            </h3>
            <p className="font-sans text-xs sm:text-sm text-[#7A6E65] mb-6 max-w-sm mx-auto leading-relaxed">
              Every saree we stock is an authentic handwoven original. Add your favorites to proceed with checkout.
            </p>
            <button
              onClick={() => router.push('/sarees')}
              className="native-press min-h-12 py-3.5 px-8 bg-[#6B1725] hover:bg-[#52111C] text-white rounded-2xl font-sans font-bold text-xs sm:text-sm tracking-wider uppercase shadow-[0_5px_14px_rgba(107,23,37,0.22)] cursor-pointer"
            >
              Explore Saree Collections
            </button>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">

            {/* ═══════════════════════════════════════════════════
                LEFT COLUMN: ACTIVE STEP CONTENT (ANIMATED)
            ═══════════════════════════════════════════════════ */}
            <div className="lg:col-span-7 space-y-5">

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-4 bg-red-50 text-red-800 text-xs font-medium rounded-2xl border border-red-200 flex items-center gap-2.5 animate-fadeIn shadow-2xs">
                  <AlertCircle size={17} className="text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 1: SHIPPING ADDRESS
              ───────────────────────────────────────────────────────────── */}
              {currentStep === 1 && (
                <div key="step-1" className="animate-fadeIn space-y-5">
                  {/* Step Header */}
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#B08A3C] uppercase tracking-widest block font-serif mb-1">
                      STEP 1 OF 3 &middot; SHIPPING DESTINATION
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#292524] font-normal tracking-tight">
                      Where should we deliver?
                    </h2>
                    <p className="font-sans text-xs sm:text-sm text-[#7A6E65] mt-1 leading-relaxed">
                      Select a saved destination below or enter a new address with PIN code.
                    </p>
                  </div>

                  {/* Saved Addresses Section */}
                  <div className="bg-white rounded-3xl border border-[#E5DEC9] p-4 sm:p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-[#B08A3C]" />
                        <span className="font-serif font-bold text-sm text-[#292524]">
                          Select Delivery Address
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddAddressModalOpen(true)}
                        className="text-xs font-sans font-bold text-[#6B1725] hover:text-[#52111C] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Address
                      </button>
                    </div>

                    {/* Address cards list */}
                    {shippingAddressesLoading && (!shippingAddresses || shippingAddresses.length === 0) ? (
                      <div className="flex gap-3 overflow-hidden pb-1 animate-pulse">
                        {[0, 1].map((n) => (
                          <div key={n} className="w-[240px] shrink-0 bg-[#FAF7F0] rounded-2xl border border-[#E5DEC9] p-4 space-y-2.5">
                            <div className="w-28 h-3.5 bg-stone-200 rounded" />
                            <div className="w-full h-2.5 bg-stone-200 rounded" />
                            <div className="w-4/5 h-2.5 bg-stone-200 rounded" />
                          </div>
                        ))}
                      </div>
                    ) : sortedShippingAddresses && sortedShippingAddresses.length > 0 ? (
                      <div className="flex lg:grid lg:grid-cols-2 gap-3.5 overflow-x-auto lg:overflow-visible pb-1 scrollbar-none snap-x snap-mandatory">
                        {sortedShippingAddresses.map((addr: any) => {
                          const isSelected = selectedAddressId === addr.id;
                          const matchesCurrentPin = currentPincode && addr.pincode?.trim() === currentPincode.trim();

                          return (
                            <div
                              key={addr.id}
                              onClick={() => {
                                handleSelectAddress(addr);
                                setIsEditingAddress(false);
                              }}
                              className={`snap-start w-[240px] sm:w-[260px] lg:w-auto shrink-0 lg:shrink rounded-2xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between relative ${
                                isSelected
                                  ? 'border-2 border-[#6B1725] bg-[#FAF6EE]/50 ring-2 ring-[#6B1725]/10 shadow-xs'
                                  : 'border-[#E5DEC9] bg-white hover:border-[#6B1725]/40 hover:shadow-2xs'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1.5 mb-2">
                                  <span className="font-serif font-bold text-sm text-[#292524] truncate">
                                    {addr.full_name || 'Saved Address'}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {addr.is_default && (
                                      <span className="text-[9px] font-bold text-[#B08A3C] bg-[#FFF9F0] px-2 py-0.5 rounded border border-[#B08A3C]/25">
                                        DEFAULT
                                      </span>
                                    )}
                                    {matchesCurrentPin && !addr.is_default && (
                                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        PIN MATCH
                                      </span>
                                    )}
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? 'bg-[#6B1725] text-white'
                                        : 'border border-[#D4C39D] bg-white'
                                    }`}>
                                      {isSelected && <Check size={10} strokeWidth={3} />}
                                    </div>
                                  </div>
                                </div>

                                <p className="text-xs text-[#7A6E65] leading-relaxed line-clamp-2">
                                  {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} &mdash; <strong className="text-[#292524] font-semibold">{addr.pincode}</strong>
                                </p>

                                {addr.phone && (
                                  <p className="text-xs text-[#7A6E65] font-mono mt-1.5 flex items-center gap-1">
                                    <Phone size={11} className="text-[#B08A3C]" />
                                    +91 {addr.phone}
                                  </p>
                                )}
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-[#F3ECE0] flex items-center justify-between text-xs">
                                <span className={`text-[11px] font-semibold ${isSelected ? 'text-[#6B1725]' : 'text-stone-400'}`}>
                                  {isSelected ? '✓ Selected' : 'Deliver here'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectAddress(addr);
                                    setIsEditingAddress(true);
                                  }}
                                  className="text-[11px] font-sans font-bold text-[#B08A3C] hover:text-[#6B1725] hover:underline cursor-pointer"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add New Address Card in Grid */}
                        <div
                          onClick={() => setIsAddAddressModalOpen(true)}
                          className="snap-start w-[180px] lg:w-auto shrink-0 lg:shrink bg-[#FFFDF9] rounded-2xl border-2 border-dashed border-[#B08A3C]/40 p-4 cursor-pointer hover:border-[#6B1725] hover:bg-[#FAF7F0] transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[120px]"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725]">
                            <Plus size={18} />
                          </div>
                          <span className="font-sans font-bold text-xs text-[#6B1725]">Add New Address</span>
                          <span className="text-[10px] text-[#7A6E65]">Save to your profile</span>
                        </div>
                      </div>
                    ) : null}

                    {/* Inline Address Form (when entering custom/editing or when no addresses saved) */}
                    {(isEditingAddress || !sortedShippingAddresses || sortedShippingAddresses.length === 0) && (
                      <div className="border-t border-[#F3ECE0] pt-4 mt-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-serif font-bold text-[#292524] uppercase tracking-wider">
                            {selectedAddressId === 'new' || !sortedShippingAddresses?.length
                              ? 'Enter Delivery Address Details'
                              : 'Edit Selected Address'}
                          </span>
                          {sortedShippingAddresses && sortedShippingAddresses.length > 0 && isEditingAddress && (
                            <button
                              type="button"
                              onClick={() => setIsEditingAddress(false)}
                              className="text-xs text-[#7A6E65] hover:text-[#292524] flex items-center gap-1 font-sans"
                            >
                              <X size={14} /> Cancel
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 sm:col-span-1">
                            <label className="text-[11px] font-serif font-bold text-[#B08A3C] uppercase tracking-wider block mb-1">
                              Full Name <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="e.g. Anjali Kumari"
                              className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 min-h-[46px] text-[16px] sm:text-sm text-[#292524] outline-none focus:border-[#6B1725] focus:bg-white transition-all font-medium"
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <label className="text-[11px] font-serif font-bold text-[#B08A3C] uppercase tracking-wider block mb-1">
                              Mobile Number <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="tel"
                              value={mobileNumber}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                // Allow clearing; if first digit is typed, enforce 6-9
                                if (digits.length > 0 && !/^[6-9]/.test(digits)) return;
                                setMobileNumber(digits);
                              }}
                              placeholder="10-digit mobile number"
                              className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 min-h-[46px] text-[16px] sm:text-sm text-[#292524] outline-none focus:border-[#6B1725] focus:bg-white transition-all font-mono"
                            />
                            {mobileNumber.length > 0 && !/^[6-9]\d{9}$/.test(mobileNumber) && (
                              <p className="mt-1 text-[11px] text-amber-700 font-sans">
                                Enter a valid Indian mobile number (starts with 6, 7, 8 or 9)
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-serif font-bold text-[#B08A3C] uppercase tracking-wider block mb-1">
                            Flat / House / Street Address <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Flat No., House Name, Road, Colony"
                            className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 min-h-[46px] text-[16px] sm:text-sm text-[#292524] outline-none focus:border-[#6B1725] focus:bg-white transition-all font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-serif font-bold text-[#B08A3C] uppercase tracking-wider block mb-1">
                            Landmark <span className="font-normal text-[#7A6E65] text-[11px]">(optional)</span>
                          </label>
                          <input
                            type="text"
                            value={landmark}
                            onChange={(e) => setLandmark(e.target.value)}
                            placeholder="e.g. Near Shiv Mandir / Station Road"
                            className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 min-h-[46px] text-[16px] sm:text-sm text-[#292524] outline-none focus:border-[#6B1725] focus:bg-white transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-serif font-bold text-[#B08A3C] uppercase tracking-wider block mb-1">
                              PIN Code <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="tel"
                              value={pinCode}
                              onChange={(e) => handlePinCodeChange(e.target.value)}
                              placeholder="6-digit Indian PIN"
                              className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 min-h-[46px] text-[16px] sm:text-sm text-[#292524] outline-none focus:border-[#6B1725] focus:bg-white transition-all font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-serif font-bold text-[#B08A3C] uppercase tracking-wider block mb-1">
                              City <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="e.g. Samastipur"
                              className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 min-h-[46px] text-[16px] sm:text-sm text-[#292524] outline-none focus:border-[#6B1725] focus:bg-white transition-all font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-serif font-bold text-[#B08A3C] uppercase tracking-wider block mb-1">
                            State <span className="text-red-600">*</span>
                          </label>
                          <select
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 min-h-[46px] text-[16px] sm:text-sm text-[#292524] outline-none focus:border-[#6B1725] focus:bg-white transition-all cursor-pointer font-medium"
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
                            Save this address to my profile for future orders
                          </label>
                        )}

                        {/* PIN status indicator */}
                        {loadingPincode && (
                          <div className="p-3 bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl text-xs text-[#B08A3C] flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-[#6B1725]" />
                            <span>Verifying delivery routes for PIN {pinCode}&hellip;</span>
                          </div>
                        )}
                        {pincodeSuccessMsg && !loadingPincode && (
                          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-[#0F766E] font-medium flex items-center gap-2">
                            <CheckCircle size={15} className="text-[#0F766E] shrink-0" />
                            <span>{pincodeSuccessMsg}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PIN status indicator when a saved address is selected */}
                    {!isEditingAddress && sortedShippingAddresses && sortedShippingAddresses.length > 0 && (
                      <div className="pt-2">
                        {loadingPincode && (
                          <div className="p-2.5 bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl text-xs text-[#B08A3C] flex items-center gap-2">
                            <Loader2 size={13} className="animate-spin text-[#6B1725]" />
                            <span>Calculating distance &amp; delivery speed&hellip;</span>
                          </div>
                        )}
                        {pincodeSuccessMsg && !loadingPincode && (
                          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-[#0F766E] font-medium flex items-center gap-2">
                            <CheckCircle size={14} className="text-[#0F766E] shrink-0" />
                            <span>{pincodeSuccessMsg}</span>
                          </div>
                        )}
                        {deliveryInfo && (deliveryInfo.success === false || deliveryInfo.isOutsideServiceArea || deliveryInfo.serviceable === false) && !loadingPincode && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
                            <AlertCircle size={14} className="text-amber-700 shrink-0" />
                            <span>{deliveryInfo?.error || deliveryInfo?.message || "Delivery is currently unavailable to this PIN."}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Desktop Step 1 CTA */}
                  <button
                    type="button"
                    onClick={handleContinueStep1}
                    disabled={!canAdvanceStep1}
                    className="hidden lg:flex native-press w-full min-h-12 py-3.5 bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-sans font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_5px_14px_rgba(107,23,37,0.22)] cursor-pointer items-center justify-center gap-2"
                  >
                    <span>Continue to Delivery Options</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 2: DELIVERY OPTIONS
              ───────────────────────────────────────────────────────────── */}
              {currentStep === 2 && (
                <div key="step-2" className="animate-fadeIn space-y-5">
                  {/* Step Header */}
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#B08A3C] uppercase tracking-widest block font-serif mb-1">
                      STEP 2 OF 3 &middot; DELIVERY SPEED
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#292524] font-normal tracking-tight">
                      Choose delivery speed
                    </h2>
                    <p className="font-sans text-xs sm:text-sm text-[#7A6E65] mt-1 leading-relaxed">
                      Select how quickly you would like your Banarasi weave hand-delivered.
                    </p>
                  </div>

                  {/* Delivering To Luggage Tag Summary */}
                  <div className="bg-[#FAF7F0] rounded-2xl border border-[#E5DEC9] p-4 flex items-center justify-between shadow-2xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725] shrink-0 mt-0.5">
                        <MapPin size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-serif tracking-widest text-[#B08A3C] font-bold block">
                          Delivering to
                        </span>
                        <h4 className="font-serif font-bold text-sm text-[#292524] truncate">
                          {fullName} &middot; <span className="font-mono text-xs font-normal text-[#7A6E65]">+91 {mobileNumber}</span>
                        </h4>
                        <p className="text-xs text-[#7A6E65] truncate mt-0.5">
                          {address}{landmark ? `, ${landmark}` : ''}, {city}, {state} &mdash; <strong className="text-[#292524]">{pinCode}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStepChange(1)}
                      className="text-xs font-sans font-bold text-[#6B1725] hover:underline cursor-pointer shrink-0 ml-3"
                    >
                      Change
                    </button>
                  </div>

                  {/* Delivery Options Selector (Matching CartView.tsx 599-680) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#B08A3C] uppercase tracking-widest block font-serif">
                        AVAILABLE DELIVERY METHODS
                      </span>
                      {deliveryInfo?.distanceKm && (
                        <span className="text-[11px] text-[#7A6E65] font-medium font-sans">
                          Distance: ~{deliveryInfo.distanceKm} km from showroom
                        </span>
                      )}
                    </div>

                    {loadingPincode ? (
                      <div className="space-y-2.5 animate-pulse">
                        {[0, 1, 2].map((n) => (
                          <div key={n} className="rounded-2xl p-4 border border-[#E5DEC9] bg-white flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full bg-stone-200" />
                              <div className="w-10 h-10 rounded-xl bg-stone-200" />
                              <div className="space-y-2">
                                <div className="w-32 h-3.5 bg-stone-200 rounded" />
                                <div className="w-48 h-2.5 bg-stone-200 rounded" />
                              </div>
                            </div>
                            <div className="w-12 h-4 bg-stone-200 rounded" />
                          </div>
                        ))}
                      </div>
                    ) : deliveryInfo && (deliveryInfo.success === false || deliveryInfo.isOutsideServiceArea || deliveryInfo.serviceable === false) ? (
                      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-xs space-y-2 text-stone-700 shadow-2xs">
                        <div className="flex items-center gap-2 font-bold text-stone-800 font-serif text-sm">
                          <AlertCircle size={18} className="text-stone-600" />
                          <span>Delivery Not Available</span>
                        </div>
                        <p className="text-[#6B625D] text-xs">
                          {deliveryInfo?.error || deliveryInfo?.message || "We currently don't deliver to this location."}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleStepChange(1)}
                          className="text-xs font-serif font-bold text-[#6B1725] hover:underline mt-2 inline-block"
                        >
                          &larr; Choose a different delivery address
                        </button>
                      </div>
                    ) : (
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
                                  if (typeof window !== 'undefined') {
                                    sessionStorage.setItem('selected_delivery_option', opt.id);
                                  }
                                }
                              }}
                              className={`rounded-2xl p-3.5 sm:p-4 flex items-center justify-between transition-all relative border ${
                                !isAvailable
                                  ? 'bg-stone-50/80 border-stone-200 opacity-60 cursor-not-allowed select-none'
                                  : isSelected
                                  ? 'bg-white border-2 border-[#6B1725] ring-2 ring-[#6B1725]/10 shadow-xs cursor-pointer'
                                  : 'bg-white border border-[#E5DEC9] hover:border-[#6B1725]/40 cursor-pointer shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                {/* Radio Selection Circle */}
                                <div className="shrink-0">
                                  {isSelected && isAvailable ? (
                                    <div className="w-4 h-4 rounded-full bg-[#6B1725] flex items-center justify-center text-white">
                                      <Check size={10} strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <div className={`w-4 h-4 rounded-full border ${isAvailable ? 'border-[#D4C39D]' : 'border-stone-300 bg-stone-100'}`} />
                                  )}
                                </div>

                                {/* Option WebP Image */}
                                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
                                  isSelected && isAvailable ? 'bg-white ring-1.5 ring-[#6B1725]' : 'bg-[#FAF7F0] border border-[#E5DEC9]'
                                }`}>
                                  <img
                                    src={opt.image || (opt.id === 'express' ? '/expressdel.webp' : opt.id === 'same_day' ? '/sameday.webp' : '/standarddel.webp')}
                                    alt={opt.title}
                                    className={`w-full h-full object-contain p-1 ${!isAvailable ? 'grayscale opacity-60' : ''}`}
                                  />
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className={`text-xs sm:text-sm font-sans font-bold ${isAvailable ? 'text-[#292524]' : 'text-stone-400'}`}>
                                      {opt.title}
                                    </h4>
                                    {opt.badge && isAvailable && (
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
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
                                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200 whitespace-nowrap">
                                        Disabled
                                      </span>
                                    )}
                                  </div>

                                  <p className={`text-[11px] truncate mt-0.5 ${isAvailable ? 'text-[#7A6E65]' : 'text-amber-700 font-medium'}`}>
                                    {isAvailable ? `${opt.eta} · ${opt.description}` : (opt.unavailableReason || 'Standard delivery only for this pincode')}
                                  </p>

                                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B1725] mt-1">
                                    <Clock size={12} className="text-[#6B1725] shrink-0" />
                                    <span>{opt.eta}</span>
                                  </div>
                                </div>
                              </div>

                              <span className={`font-sans font-bold text-xs sm:text-sm tabular-nums shrink-0 ml-2 ${isAvailable ? 'text-[#292524]' : 'text-stone-400'}`}>
                                ₹{opt.charge}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Step 2 Actions */}
                  <div className="hidden lg:flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleStepChange(1)}
                      className="native-press py-3.5 px-6 bg-[#FAF7F0] hover:bg-[#F3ECE0] border border-[#E5DEC9] text-[#292524] rounded-2xl font-sans font-bold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      &larr; Back to Address
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueStep2}
                      disabled={!canAdvanceStep2}
                      className="native-press flex-1 min-h-12 py-3.5 bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-sans font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_5px_14px_rgba(107,23,37,0.22)] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Continue to Review &amp; Pay</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 3: REVIEW & PAYMENT
              ───────────────────────────────────────────────────────────── */}
              {currentStep === 3 && (
                <div key="step-3" className="animate-fadeIn space-y-5">
                  {/* Step Header */}
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#B08A3C] uppercase tracking-widest block font-serif mb-1">
                      STEP 3 OF 3 &middot; REVIEW &amp; PAYMENT
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#292524] font-normal tracking-tight">
                      Review &amp; Place Order
                    </h2>
                    <p className="font-sans text-xs sm:text-sm text-[#7A6E65] mt-1 leading-relaxed">
                      Confirm your delivery details and place your Cash on Delivery order.
                    </p>
                  </div>

                  {/* Destination & Delivery Summary Mini-Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Address Tile */}
                    <div className="bg-white rounded-2xl border border-[#E5DEC9] p-4 shadow-2xs relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] uppercase font-serif tracking-widest text-[#B08A3C] font-bold flex items-center gap-1">
                          <MapPin size={11} /> Shipping Destination
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStepChange(1)}
                          className="text-xs font-sans font-bold text-[#6B1725] hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-xs font-bold text-[#292524] truncate">{fullName}</p>
                      <p className="text-[11px] text-[#7A6E65] leading-relaxed line-clamp-2 mt-0.5">
                        {address}{landmark ? `, ${landmark}` : ''}, {city}, {state} &mdash; {pinCode}
                      </p>
                    </div>

                    {/* Delivery Method Tile */}
                    <div className="bg-white rounded-2xl border border-[#E5DEC9] p-4 shadow-2xs relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] uppercase font-serif tracking-widest text-[#B08A3C] font-bold flex items-center gap-1">
                          <Truck size={11} /> Delivery Speed
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStepChange(2)}
                          className="text-xs font-sans font-bold text-[#6B1725] hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-xs font-bold text-[#292524] truncate">
                        {activeDeliveryOption?.title || 'Standard Delivery'}
                      </p>
                      <p className="text-[11px] text-[#7A6E65] mt-0.5">
                        {activeDeliveryOption?.eta || '2-4 Days'} &middot; ₹{shippingFee} incl. GST
                      </p>
                    </div>
                  </div>

                  {/* Ordered Items Preview */}
                  <div className="bg-white rounded-2xl border border-[#E5DEC9] p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-2.5">
                      <span className="text-[10px] font-sans font-bold text-[#B08A3C] uppercase tracking-wider">
                        ORDER &middot; {cart.reduce((s, i) => s + i.quantity, 0)} SAREE{cart.reduce((s, i) => s + i.quantity, 0) > 1 ? 'S' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => router.push('/cart')}
                        className="text-xs font-sans font-bold text-[#6B1725] hover:underline cursor-pointer"
                      >
                        Edit Bag
                      </button>
                    </div>

                    <div className="space-y-3 divide-y divide-[#F3ECE0]">
                      {cart.map((item, idx) => {
                        const price = item.product.salePrice ?? item.product.price;
                        return (
                          <div key={item.product.id} className={`flex items-center gap-3.5 ${idx > 0 ? 'pt-3' : ''}`}>
                            <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl overflow-hidden bg-[#FAF7F0] shrink-0 border border-[#E5DEC9]">
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-serif font-bold text-[#B08A3C] uppercase tracking-wider block">
                                {item.product.fabric || item.product.category || 'BANARASI SILK'}
                              </span>
                              <h5 className="font-serif font-bold text-xs sm:text-sm text-[#292524] truncate">
                                {item.product.name}
                              </h5>
                              <span className="text-[11px] text-[#7A6E65] block mt-0.5">
                                Qty: {item.quantity} &middot; Blouse piece included
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-sans font-bold text-sm sm:text-base text-[#292524] tabular-nums">
                                ₹{(price * item.quantity).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cash on Delivery Payment Card */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#6B1725] shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725] shrink-0">
                          <Banknote size={20} />
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-sm sm:text-base text-[#292524]">
                            Cash on Delivery (COD)
                          </h4>
                          <p className="text-xs text-[#7A6E65]">
                            Pay the delivery person at your doorstep
                          </p>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-[#6B1725] flex items-center justify-center text-white text-[10px]">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    </div>

                    <div className="p-3 bg-[#FAF6EE] rounded-xl border border-[#E5DEC9] text-xs text-[#6B625D] leading-relaxed">
                      💡 <strong>Doorstep Inspection Guarantee:</strong> Open the packet in front of our delivery rider. Inspect the weave and zariwork &mdash; if it is not what you expected, hand it straight back with zero questions.
                    </div>
                  </div>

                  {/* Gift Order Option */}
                  <div className="bg-white rounded-2xl border border-[#E5DEC9] p-4 shadow-2xs space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isGift}
                        onChange={(e) => setIsGift(e.target.checked)}
                        className="rounded border-[#B08A3C]/40 text-[#6B1725] focus:ring-[#6B1725] w-4 h-4"
                      />
                      <div className="flex items-center gap-2">
                        <Gift size={16} className="text-[#B08A3C]" />
                        <span className="text-xs font-serif font-bold text-[#292524]">
                          This is a Gift Order (Add gift packaging &amp; personal message)
                        </span>
                      </div>
                    </label>

                    {isGift && (
                      <div className="space-y-2.5 pt-2 pl-7 animate-fadeIn">
                        <input
                          type="text"
                          value={giftRecipientName}
                          onChange={(e) => setGiftRecipientName(e.target.value)}
                          placeholder="Recipient's Name (e.g. Priyadarshini)"
                          className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 min-h-[46px] text-[16px] sm:text-sm text-[#292524] outline-none focus:border-[#6B1725] font-medium"
                        />
                        <textarea
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          placeholder="Write a sweet congratulatory or celebratory message to print on our royal greeting card..."
                          rows={2}
                          className="w-full bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 text-[16px] sm:text-sm text-[#292524] outline-none focus:border-[#6B1725] resize-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Mobile Price Breakdown & Coupon Drawer */}
                  <div className="lg:hidden bg-white rounded-2xl border border-[#E5DEC9] p-4 shadow-2xs space-y-3">
                    {/* Coupon */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="COUPON CODE"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 bg-[#FAF7F0] border border-dashed border-[#B08A3C]/60 rounded-xl px-3 py-2.5 min-h-[44px] text-[16px] sm:text-sm uppercase font-sans font-semibold tracking-wide text-[#292524] placeholder:text-[#A89F91] outline-none focus:border-[#6B1725]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2.5 min-h-[44px] bg-[#FAF7F0] hover:bg-[#6B1725] hover:text-white text-[#6B1725] border border-[#6B1725]/30 rounded-xl font-sans font-bold text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
                      >
                        Apply
                      </button>
                    </div>

                    {couponError && <p className="text-[11px] text-red-600 font-medium">{couponError}</p>}
                    {appliedCoupon && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
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

                    <div className="space-y-2 pt-2 border-t border-[#F3ECE0] text-xs font-sans">
                      <div className="flex justify-between text-[#7A6E65]">
                        <span>Item total</span>
                        <span className="font-medium text-[#292524]">₹{originalTotal.toLocaleString('en-IN')}</span>
                      </div>
                      {totalProductDiscount > 0 && (
                        <div className="flex justify-between text-[#7A6E65]">
                          <span>Product discount</span>
                          <span className="text-[#0F766E] font-medium">-₹{totalProductDiscount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {appliedCoupon && couponDiscountAmount > 0 && (
                        <div className="flex justify-between text-[#7A6E65]">
                          <span>Coupon ({appliedCoupon.code})</span>
                          <span className="text-[#0F766E] font-medium">-₹{couponDiscountAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#7A6E65]">
                        <span>Delivery ({activeDeliveryOption?.title?.replace(' Delivery', '') || 'Standard'})</span>
                        <span className="font-bold text-[#292524] tabular-nums">
                          {shippingFee === 0 ? <span className="text-[#0F766E]">FREE</span> : `₹${shippingFee}`}
                        </span>
                      </div>
                      <div className="border-t border-[#E5DEC9] pt-2 flex justify-between items-baseline">
                        <span className="font-sans font-bold text-sm sm:text-base text-[#292524]">Total Payable</span>
                        <span className="font-sans font-extrabold text-2xl text-[#6B1725] tabular-nums tracking-tight">
                          ₹{grandTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {(totalProductDiscount + couponDiscountAmount) > 0 && (
                        <p className="text-xs font-semibold text-[#0F766E]">
                          🎉 You saved ₹{(totalProductDiscount + couponDiscountAmount).toLocaleString('en-IN')}
                        </p>
                      )}
                      <p className="text-[11px] text-[#7A6E65]">Prices include applicable GST</p>
                    </div>

                    {/* Legal Confirmation Notice for Mobile */}
                    <p className="pt-2 text-center text-[11px] text-[#7A6E65] leading-relaxed">
                      By placing your order, you agree to our{' '}
                      <Link href="/terms-and-conditions" target="_blank" className="text-[#6B1725] underline font-medium hover:text-[#52111C]">
                        Terms &amp; Conditions
                      </Link>
                      ,{' '}
                      <Link href="/privacy-policy" target="_blank" className="text-[#6B1725] underline font-medium hover:text-[#52111C]">
                        Privacy Policy
                      </Link>
                      ,{' '}
                      <Link href="/returns-refunds" target="_blank" className="text-[#6B1725] underline font-medium hover:text-[#52111C]">
                        Returns &amp; Refunds
                      </Link>
                      , and{' '}
                      <Link href="/shipping-policy" target="_blank" className="text-[#6B1725] underline font-medium hover:text-[#52111C]">
                        Shipping Policy
                      </Link>
                      .
                    </p>
                  </div>

                  {/* Desktop Step 3 Primary Action */}
                  <div className="hidden lg:block space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handlePlaceOrder()}
                      disabled={isSubmitting}
                      className="native-press w-full min-h-12 py-4 bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-80 text-white rounded-2xl font-sans font-bold text-sm uppercase tracking-wider shadow-[0_5px_14px_rgba(107,23,37,0.22)] cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>CONFIRMING YOUR ORDER&hellip;</span>
                        </>
                      ) : (
                        <span>PLACE COD ORDER &bull; ₹{grandTotal.toLocaleString('en-IN')}</span>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-[#7A6E65]">
                      ✓ Cash on Delivery &middot; Open-box doorstep inspection guaranteed
                    </p>
                    <p className="text-center text-[10.5px] text-[#7A6E65] leading-relaxed">
                      By placing your order, you agree to our{' '}
                      <Link href="/terms-and-conditions" target="_blank" className="text-[#6B1725] underline hover:text-[#52111C]">
                        Terms &amp; Conditions
                      </Link>
                      ,{' '}
                      <Link href="/privacy-policy" target="_blank" className="text-[#6B1725] underline hover:text-[#52111C]">
                        Privacy Policy
                      </Link>
                      ,{' '}
                      <Link href="/returns-refunds" target="_blank" className="text-[#6B1725] underline hover:text-[#52111C]">
                        Returns &amp; Refunds
                      </Link>
                      , and{' '}
                      <Link href="/shipping-policy" target="_blank" className="text-[#6B1725] underline hover:text-[#52111C]">
                        Shipping Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════
                RIGHT COLUMN: DESKTOP STICKY SUMMARY (ALWAYS VISIBLE)
            ═══════════════════════════════════════════════════ */}
            <div className="hidden lg:block lg:col-span-5">
              <div className="sticky top-24 space-y-4">
                <div className="bg-white rounded-3xl border border-[#E5DEC9] p-5 sm:p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-3">
                    <span className="text-xs font-serif font-bold text-[#B08A3C] uppercase tracking-wider">
                      ORDER SUMMARY &middot; {cart.reduce((s, i) => s + i.quantity, 0)} SAREE{cart.reduce((s, i) => s + i.quantity, 0) > 1 ? 'S' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push('/cart')}
                      className="text-xs font-sans font-bold text-[#6B1725] hover:underline cursor-pointer"
                    >
                      Edit Bag
                    </button>
                  </div>

                  {/* Saree List */}
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 divide-y divide-[#F3ECE0]">
                    {cart.map((item, idx) => {
                      const currentPrice = item.product.salePrice ?? item.product.price;
                      const originalPrice = item.product.price;
                      const hasDiscount = !!item.product.salePrice && item.product.salePrice < originalPrice;

                      return (
                        <div key={item.product.id} className={`flex items-center gap-3 py-1 ${idx > 0 ? 'pt-2.5' : ''}`}>
                          <div className="w-14 h-16 rounded-xl overflow-hidden bg-[#FAF7F0] shrink-0 border border-[#E5DEC9]">
                            <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-serif font-bold text-[#B08A3C] uppercase tracking-wider block truncate">
                              {item.product.fabric || item.product.category || 'BANARASI SILK'}
                            </span>
                            <h5 className="font-serif font-bold text-xs text-[#292524] line-clamp-1">
                              {item.product.name}
                            </h5>
                            <span className="text-[11px] text-[#7A6E65] block mt-0.5 font-sans">
                              Qty: {item.quantity} &middot; Blouse piece incl.
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-sans font-bold text-sm text-[#292524] tabular-nums">
                              ₹{(currentPrice * item.quantity).toLocaleString('en-IN')}
                            </div>
                            {hasDiscount && (
                              <span className="text-[11px] text-[#A89F91] line-through tabular-nums block font-sans">
                                ₹{(originalPrice * item.quantity).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coupon Code Section */}
                  <div className="pt-2 border-t border-[#F3ECE0] space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="COUPON CODE"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 bg-[#FAF7F0] border border-dashed border-[#B08A3C]/60 rounded-xl px-3 py-2 text-xs uppercase font-medium text-[#292524] placeholder:text-[#A89F91] outline-none focus:border-[#6B1725]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-[#FAF7F0] hover:bg-[#6B1725] hover:text-white text-[#6B1725] border border-[#6B1725]/30 rounded-xl font-sans font-bold text-xs transition-colors cursor-pointer shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] text-red-600 font-medium">{couponError}</p>}
                    {appliedCoupon && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Tag size={13} className="text-emerald-700" />
                          <strong>{appliedCoupon.code}</strong> (-₹{appliedCoupon.discountAmount.toLocaleString('en-IN')})
                        </span>
                        <button type="button" onClick={handleRemoveCoupon} className="text-xs text-red-600 hover:underline font-semibold cursor-pointer">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Price Details */}
                  <div className="space-y-2 pt-3 border-t border-[#F3ECE0] text-xs font-sans">
                    <div className="flex justify-between text-[#7A6E65]">
                      <span>Item total</span>
                      <span className="font-medium text-[#292524]">₹{originalTotal.toLocaleString('en-IN')}</span>
                    </div>
                    {totalProductDiscount > 0 && (
                      <div className="flex justify-between text-[#7A6E65]">
                        <span>Product discount</span>
                        <span className="text-[#0F766E] font-medium">-₹{totalProductDiscount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {appliedCoupon && couponDiscountAmount > 0 && (
                      <div className="flex justify-between text-[#7A6E65]">
                        <span>Coupon ({appliedCoupon.code})</span>
                        <span className="text-[#0F766E] font-medium">-₹{couponDiscountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#7A6E65]">
                      <span>Delivery ({activeDeliveryOption?.title?.replace(' Delivery', '') || 'Standard'})</span>
                      <span className="font-bold text-[#292524] tabular-nums">
                        {shippingFee === 0 ? <span className="text-[#0F766E]">FREE</span> : `₹${shippingFee}`}
                      </span>
                    </div>
                    <div className="border-t border-[#E5DEC9] pt-3 flex justify-between items-baseline">
                      <span className="font-sans font-bold text-sm sm:text-base text-[#292524]">Total Payable</span>
                      <span className="font-sans font-extrabold text-2xl text-[#6B1725] tabular-nums tracking-tight">
                        ₹{grandTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {(totalProductDiscount + couponDiscountAmount) > 0 && (
                      <p className="text-xs font-semibold text-[#0F766E] pt-0.5">
                        🎉 You saved ₹{(totalProductDiscount + couponDiscountAmount).toLocaleString('en-IN')}
                      </p>
                    )}
                    <p className="text-[11px] text-[#7A6E65] pt-0.5">Prices include applicable GST</p>
                  </div>

                  {/* Desktop Dynamic Step Button */}
                  {currentStep === 1 && (
                    <button
                      type="button"
                      onClick={handleContinueStep1}
                      disabled={!canAdvanceStep1}
                      className="native-press w-full min-h-12 py-3.5 bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-sans font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_5px_14px_rgba(107,23,37,0.22)] cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      <span>Continue to Delivery</span>
                      <ArrowRight size={15} />
                    </button>
                  )}
                  {currentStep === 2 && (
                    <button
                      type="button"
                      onClick={handleContinueStep2}
                      disabled={!canAdvanceStep2}
                      className="native-press w-full min-h-12 py-3.5 bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-sans font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_5px_14px_rgba(107,23,37,0.22)] cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      <span>Continue to Review &amp; Pay</span>
                      <ArrowRight size={15} />
                    </button>
                  )}
                  {currentStep === 3 && (
                    <button
                      type="button"
                      onClick={() => handlePlaceOrder()}
                      disabled={isSubmitting}
                      className="native-press w-full min-h-12 py-4 bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-80 text-white rounded-2xl font-sans font-bold text-sm uppercase tracking-wider shadow-[0_5px_14px_rgba(107,23,37,0.22)] cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>CONFIRMING ORDER&hellip;</span>
                        </>
                      ) : (
                        <span>PLACE COD ORDER &bull; ₹{grandTotal.toLocaleString('en-IN')}</span>
                      )}
                    </button>
                  )}

                  <p className="text-center text-[11px] text-[#7A6E65] pt-1">
                    ✓ Cash on Delivery &middot; Inspect before paying
                  </p>
                </div>

                {/* SBS Heritage Guarantee Badge */}
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

      {/* ── 4. STICKY MOBILE ACTION BAR ── */}
      {cart.length > 0 && !isOrdered && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5DEC9] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <div>
              <div className="font-sans font-extrabold text-xl sm:text-2xl text-[#292524] tabular-nums tracking-tight">
                ₹{grandTotal.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-[#7A6E65] font-sans block -mt-0.5">
                {currentStep === 1
                  ? 'Step 1: Address'
                  : currentStep === 2
                  ? 'Step 2: Delivery'
                  : 'Cash on Delivery'}
              </span>
            </div>

            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleContinueStep1}
                disabled={!canAdvanceStep1}
                className="native-press min-h-12 py-3 px-6 bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-40 text-white rounded-2xl font-sans font-bold text-sm uppercase tracking-wider shadow-[0_5px_14px_rgba(107,23,37,0.22)] cursor-pointer flex items-center justify-center gap-2 min-w-[120px]"
              >
                <span>Continue</span>
                <ArrowRight size={15} />
              </button>
            )}
            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleContinueStep2}
                disabled={!canAdvanceStep2}
                className="native-press min-h-12 py-3 px-6 bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-40 text-white rounded-2xl font-sans font-bold text-sm uppercase tracking-wider shadow-[0_5px_14px_rgba(107,23,37,0.22)] cursor-pointer flex items-center justify-center gap-2 min-w-[120px]"
              >
                <span>Review</span>
                <ArrowRight size={15} />
              </button>
            )}
            {currentStep === 3 && (
              <button
                type="button"
                onClick={() => handlePlaceOrder()}
                disabled={isSubmitting}
                className="native-press min-h-12 py-3 px-7 bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-80 text-white rounded-2xl font-sans font-bold text-sm uppercase tracking-wider shadow-[0_5px_14px_rgba(107,23,37,0.22)] cursor-pointer flex items-center justify-center gap-2 min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Placing&hellip;</span>
                  </>
                ) : (
                  <span>Place Order</span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Shared Add New Address Modal */}
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

