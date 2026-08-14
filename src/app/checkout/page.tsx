"use client";

import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '../../context/StoreContext';
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
  ChevronRight, 
  MessageSquare,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { checkDeliveryServiceability } from '../../data/supabase';

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
    customerCoords,
    setCustomerCoords,
    checkedPincode,
    setCheckedPincode,
    shippingAddresses,
    saveShippingAddress,
    user,
    isHydrated,
    setIsAuthModalOpen
  } = useStore();

  // Order placing states
  const [isOrdered, setIsOrdered] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  const [fullName, setFullName] = useState('');
  const isPhoneValid = userPhone && /^\d{10}$/.test(userPhone);
  const [mobileNumber, setMobileNumber] = useState(isPhoneValid ? userPhone : '');
  const [email, setEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'Home Delivery' | 'Store Pickup'>('Home Delivery');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Bihar');
  const [pinCode, setPinCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash on Delivery' | 'Online Payment'>('UPI');

  // Address card selection state
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');

  // Validation States
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Redirect to home and open login if not logged in
  useEffect(() => {
    if (isHydrated && !user && !userPhone) {
      router.push('/');
      setIsAuthModalOpen(true);
    }
  }, [isHydrated, user, userPhone, router, setIsAuthModalOpen]);

  // Sync email from logged-in user profile
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  // Sync pincode with context
  useEffect(() => {
    if (checkedPincode) {
      setPinCode(checkedPincode);
    }
  }, [checkedPincode]);

  // Auto-prefill default address once loaded
  useEffect(() => {
    if (shippingAddresses && shippingAddresses.length > 0 && !hasPrefilled && !fullName && !address) {
      const defaultAddr = shippingAddresses.find(a => a.is_default) || shippingAddresses[0];
      if (defaultAddr) {
        setFullName(defaultAddr.full_name || '');
        setMobileNumber(defaultAddr.phone || '');
        setAddress(defaultAddr.address_line1 + (defaultAddr.address_line2 ? ', ' + defaultAddr.address_line2 : '') + (defaultAddr.landmark ? ', Landmark: ' + defaultAddr.landmark : ''));
        setCity(defaultAddr.city || '');
        if (defaultAddr.state) {
          setState(defaultAddr.state);
        }
        setPinCode(defaultAddr.pincode || '');
        handleCheckPincode(defaultAddr.pincode);
        setHasPrefilled(true);
        setSelectedAddressId(defaultAddr.id);
      }
    }
  }, [shippingAddresses, hasPrefilled, fullName, address]);

  const handlePinCodeChange = (val: string) => {
    const sanitized = val.replace(/\D/g, '').slice(0, 6);
    setPinCode(sanitized);
    if (sanitized !== checkedPincode) {
      setDeliveryInfo(null);
    }
  };

  const handleCheckPincode = async (targetPincode: string) => {
    if (targetPincode.length !== 6 || !/^\d+$/.test(targetPincode)) {
      setLocError("Please enter a valid 6-digit PIN code.");
      return;
    }

    setLocError(null);
    setLoadingPincode(true);
    try {
      const res = await checkDeliveryServiceability({ pincode: targetPincode });
      setDeliveryInfo(res);
      setCheckedPincode(targetPincode);
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
          if (!res.success || !res.serviceable) {
            setLocError("Delivery is not available at this location.");
          } else {
            setCity('Samastipur');
            setState('Bihar');
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

  const handleSelectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setFullName(addr.full_name || '');
    setMobileNumber(addr.phone || '');
    setAddress(addr.address_line1 + (addr.address_line2 ? ', ' + addr.address_line2 : '') + (addr.landmark ? ', Landmark: ' + addr.landmark : ''));
    setCity(addr.city || '');
    if (addr.state) {
      setState(addr.state);
    }
    setPinCode(addr.pincode || '');
    handleCheckPincode(addr.pincode);
  };

  const handleAddNewAddressSelect = () => {
    setSelectedAddressId('new');
    setFullName('');
    setMobileNumber(isPhoneValid ? userPhone : '');
    setAddress('');
    setCity('');
    setState('Bihar');
    setPinCode('');
    setDeliveryInfo(null);
    setCheckedPincode('');
  };

  // WhatsApp Chat Inquiry
  const handleWhatsAppInquiry = () => {
    const whatsappNumber = "+9191620390946";
    const textMessage = `Hello Shree Banarasi Sarees, I need help with my checkout. My name is ${fullName || 'Guest'}.`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(textMessage)}`, '_blank');
  };

  // Calculate totals
  const subtotal = cart.reduce((total, item) => {
    const itemPrice = item.product.salePrice ?? item.product.price;
    return total + itemPrice * item.quantity;
  }, 0);

  const discount = 0; // Optional promotional coupon discount
  const shipping = deliveryMethod === 'Home Delivery' && subtotal > 0
    ? (deliveryInfo?.serviceable ? (deliveryInfo.delivery_charge ?? 0) : 0)
    : 0;
  const total = subtotal - discount + shipping;

  // Calculate original list price totals to show product savings
  const totalOriginalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalSavings = totalOriginalPrice - subtotal;

  const getExpectedDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 4);
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const indianStates = [
    "Bihar", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Delhi"
  ];

  const handlePlaceOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validations
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (deliveryMethod === 'Home Delivery') {
      if (!address.trim()) {
        setErrorMsg('Please enter your home address.');
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
      if (!deliveryInfo) {
        setErrorMsg('Please verify your delivery serviceability before placing order.');
        return;
      }
      if (!deliveryInfo.serviceable) {
        setErrorMsg('Delivery is not available at the selected location.');
        return;
      }
      if (checkedPincode && pinCode !== checkedPincode && !customerCoords) {
        setErrorMsg('Please click Verify to validate the entered PIN code.');
        return;
      }
    }

    setErrorMsg('');
    setIsSubmitting(true);

    // Place the order
    placeOrder({
      customer: {
        name: fullName,
        phone: mobileNumber,
        email: email || undefined,
        address: deliveryMethod === 'Home Delivery' ? address : 'Store Pickup',
        city: deliveryMethod === 'Home Delivery' ? city : 'Samastipur',
        state: deliveryMethod === 'Home Delivery' ? state : 'Bihar',
        pinCode: deliveryMethod === 'Home Delivery' ? pinCode : '848103',
        deliveryMethod: deliveryMethod
      },
      items: cart,
      subtotal,
      discount,
      shipping,
      total,
      paymentMethod
    }).then((orderDetails) => {
      // Auto-login customer using their mobile number if not already logged in
      if (!userPhone) {
        loginUser(mobileNumber);
      }

      // Save shipping address if user requested
      if (saveToProfile && user && deliveryMethod === 'Home Delivery' && selectedAddressId === 'new') {
        saveShippingAddress({
          full_name: fullName,
          phone: mobileNumber,
          address_line1: address,
          city: city,
          state: state,
          pincode: pinCode,
          address_label: 'Home',
          is_default: shippingAddresses.length === 0
        }).catch((err) => {
          console.error('Failed to auto-save shipping address:', err);
        });
      }

      setCreatedOrder(orderDetails);
      setIsOrdered(true);
      clearCart();
    }).catch((err) => {
      console.error(err);
      setErrorMsg('Failed to place order. Please try again.');
    }).finally(() => {
      setIsSubmitting(false);
    });
  };

  const isOnline = paymentMethod === 'UPI' || paymentMethod === 'Online Payment';
  const ctaText = isOnline
    ? `PAY ₹${total.toLocaleString('en-IN')}`
    : `PLACE COD ORDER — ₹${total.toLocaleString('en-IN')}`;

  // REDESIGNED SUCCESS VIEW
  if (isOrdered && createdOrder) {
    return (
      <div className="min-h-screen bg-[#FCF9F3] text-dark-brown flex flex-col font-sans">
        {/* Minimal Header */}
        <header className="bg-white border-b border-cream py-4 px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center select-none">
              <img
                src="/brand_logo.png"
                alt="Shree Banarasi Sarees Logo"
                className="h-10 sm:h-12 w-auto object-contain rounded-full border border-gold/25"
              />
              <div className="flex flex-col ml-2 text-left">
                <span className="font-serif text-base sm:text-lg font-extrabold text-maroon tracking-wider leading-none">
                  Shree
                </span>
                <span className="text-[8px] sm:text-[9px] text-gold font-bold tracking-[0.15em] uppercase mt-0.5 font-serif leading-none">
                  Banarasi Sarees
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-dark-brown/70 bg-cream/35 border border-[#C9A45C]/20 px-3 py-1.5 rounded-full">
              <span className="text-emerald-600 font-bold">✓</span> Order Placed
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12 flex-grow w-full">
          <div className="bg-white border border-[#C9A45C]/30 p-8 rounded-2xl shadow-xl space-y-8 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-maroon via-gold to-maroon"></div>

            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
              <CheckCircle size={36} />
            </div>

            <div className="space-y-2 text-center">
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-maroon">
                Order Confirmed!
              </h2>
              <p className="text-sm text-dark-brown/70 max-w-md mx-auto">
                Thank you for your purchase. We have received your order and are preparing your handloom saree with utmost care.
              </p>
            </div>

            <div className="bg-[#FFF9F0] w-full p-6 rounded-xl border border-cream space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-cream pb-3 font-bold text-dark-brown text-sm">
                <span>Order Reference:</span>
                <span className="text-maroon font-mono uppercase tracking-wider">{createdOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-semibold">{new Date(createdOrder.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Method:</span>
                <span className="font-semibold">{createdOrder.customer.deliveryMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-semibold">{createdOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-t border-cream pt-3 font-bold text-dark-brown text-sm">
                <span>Grand Total:</span>
                <span className="text-maroon text-base">₹{createdOrder.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {createdOrder.paymentMethod === 'UPI' && (
              <div className="p-4 bg-yellow-50/70 text-yellow-800 text-xs font-semibold rounded-xl border border-yellow-100/80 text-left leading-relaxed w-full flex gap-3">
                <span className="text-lg">🔔</span>
                <div>
                  <span className="font-bold text-yellow-900 block mb-0.5">UPI Payment Request</span>
                  Since you selected UPI, our Saree Expert is currently preparing your custom payment link. It will be sent to your WhatsApp number (<strong className="text-yellow-900">+91 {createdOrder.customer.phone}</strong>) within 5 minutes.
                </div>
              </div>
            )}

            <div className="w-full pt-4 flex flex-col gap-3">
              <button
                onClick={() => router.push('/account')}
                className="w-full py-3.5 bg-maroon text-[#FFF9F0] rounded-xl font-serif font-bold text-xs sm:text-sm tracking-widest uppercase hover:bg-maroon-dark active:scale-[0.99] transition-all shadow-md cursor-pointer text-center"
              >
                Track Order Status
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full py-3 bg-white border border-cream text-dark-brown rounded-xl font-serif font-bold text-xs uppercase hover:bg-cream/20 active:scale-[0.99] transition-all cursor-pointer text-center"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // MAIN CHECKOUT VIEW
  return (
    <div className="min-h-screen bg-[#FCF9F3] text-dark-brown flex flex-col font-sans pb-32 lg:pb-12">
      {/* Minimal Distraction-Free Header */}
      <header className="bg-white border-b border-cream py-4 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center select-none">
            <img
              src="/brand_logo.png"
              alt="Shree Banarasi Sarees Logo"
              className="h-10 sm:h-12 w-auto object-contain rounded-full border border-gold/25"
            />
            <div className="flex flex-col ml-2 text-left">
              <span className="font-serif text-base sm:text-lg font-extrabold text-maroon tracking-wider leading-none">
                Shree
              </span>
              <span className="text-[8px] sm:text-[9px] text-gold font-bold tracking-[0.15em] uppercase mt-0.5 font-serif leading-none">
                Banarasi Sarees
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-dark-brown/70 bg-cream/35 border border-[#C9A45C]/20 px-3.5 py-2 rounded-full">
            <span className="text-maroon">🔒</span> Secure Checkout
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {cart.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center bg-white border border-cream rounded-2xl shadow-sm px-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-cream/30 flex items-center justify-center text-maroon/40 mb-4">
              <ShoppingBag size={32} />
            </div>
            <h3 className="font-serif text-xl font-bold text-dark-brown mb-2">
              Your bag is empty
            </h3>
            <p className="text-sm text-dark-brown/60 mb-6 max-w-xs leading-relaxed">
              Before you can check out, you must add some exquisite Banarasi sarees to your shopping bag.
            </p>
            <button
              onClick={() => router.push('/sarees')}
              className="w-full py-3.5 bg-maroon text-[#FFF9F0] rounded-xl font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark transition-all shadow-md cursor-pointer"
            >
              Explore Collections
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Form Steps */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              
              {errorMsg && (
                <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-100 flex items-center gap-2 animate-fadeIn">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* STEP 1: DELIVERY ADDRESS */}
              <div className="bg-white p-6 rounded-2xl border border-cream shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b border-cream pb-3">
                  <span className="w-6 h-6 rounded-full bg-maroon text-white text-xs font-bold flex items-center justify-center font-serif">1</span>
                  <h2 className="font-serif text-lg font-bold text-dark-brown">
                    Delivery Address
                  </h2>
                </div>

                {/* Saved Addresses Cards */}
                {shippingAddresses && shippingAddresses.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wider">
                      Select Delivery Address
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {shippingAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectAddress(addr)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-md ${
                              isSelected
                                ? 'border-maroon bg-maroon/[0.02]'
                                : 'border-cream bg-white hover:border-gold/50'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-gold uppercase tracking-wider px-2 py-0.5 bg-cream/45 rounded">
                                  {addr.address_label || 'Home'}
                                </span>
                                {addr.is_default && (
                                  <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-dark-brown font-serif">{addr.full_name}</h4>
                              <p className="text-xs text-dark-brown/70 mt-1 line-clamp-2 leading-relaxed">
                                {addr.address_line1}
                                {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                                {addr.landmark ? `, Landmark: ${addr.landmark}` : ''}
                              </p>
                              <p className="text-xs text-dark-brown/70 leading-relaxed">
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-cream/50 flex justify-between items-center text-[11px] text-dark-brown/65">
                              <span>📞 {addr.phone}</span>
                              {isSelected && <span className="text-maroon font-bold">✓ Selected</span>}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Add New Address Card */}
                      <div
                        onClick={handleAddNewAddressSelect}
                        className={`p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] text-center ${
                          selectedAddressId === 'new'
                            ? 'border-maroon bg-maroon/[0.02] text-maroon'
                            : 'border-cream hover:border-gold/50 text-dark-brown/60 hover:text-maroon bg-white'
                        }`}
                      >
                        <span className="text-2xl mb-1">+</span>
                        <span className="text-xs font-bold uppercase tracking-wider">Add New Address</span>
                        <span className="text-[10px] text-dark-brown/40 mt-1 max-w-[140px]">
                          Deliver to a different location
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Simple Address Form (Shown only when 'new' is selected or no saved addresses exist) */}
                {(selectedAddressId === 'new' || !shippingAddresses || shippingAddresses.length === 0) && (
                  <div className="space-y-4 pt-2 border-t border-cream/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your name"
                          required
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded-xl p-3 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                          Mobile Number *
                        </label>
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-digit phone number"
                          required
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded-xl p-3 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                        Address *
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House / Flat No, Street, Landmark"
                        required
                        className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded-xl p-3 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                          City *
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Samastipur"
                          required
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded-xl p-3 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                          State *
                        </label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded-xl p-3 outline-none transition-all cursor-pointer"
                        >
                          {indianStates.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                          PIN Code *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            value={pinCode}
                            onChange={(e) => handlePinCodeChange(e.target.value)}
                            placeholder="6-digit PIN"
                            required
                            className="flex-grow bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded-xl p-3 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => handleCheckPincode(pinCode)}
                            disabled={loadingPincode || loadingLocation || pinCode.length !== 6}
                            className="bg-maroon hover:bg-maroon-dark text-white text-xs font-serif font-bold tracking-wider px-4 py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[70px] cursor-pointer"
                          >
                            {loadingPincode ? '...' : 'VERIFY'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded-xl p-3 outline-none transition-all"
                      />
                    </div>

                    {user && (
                      <div className="pt-2">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-[#8B5A2B]">
                          <input
                            type="checkbox"
                            checked={saveToProfile}
                            onChange={(e) => setSaveToProfile(e.target.checked)}
                            className="rounded border-[#C9A45C]/30 text-maroon focus:ring-maroon w-4 h-4"
                          />
                          Save address to profile for future orders
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 2: DELIVERY METHOD & VERIFICATION */}
              <div className="bg-white p-6 rounded-2xl border border-cream shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b border-cream pb-3">
                  <span className="w-6 h-6 rounded-full bg-maroon text-white text-xs font-bold flex items-center justify-center font-serif">2</span>
                  <h2 className="font-serif text-lg font-bold text-dark-brown">
                    Delivery Method
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Home Delivery Card */}
                  <div
                    onClick={() => setDeliveryMethod('Home Delivery')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[90px] ${
                      deliveryMethod === 'Home Delivery'
                        ? 'border-maroon bg-maroon/[0.02]'
                        : 'border-cream bg-white hover:border-gold/50'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <Truck className={`flex-shrink-0 mt-0.5 ${deliveryMethod === 'Home Delivery' ? 'text-maroon' : 'text-dark-brown/40'}`} size={20} />
                      <div>
                        <h4 className="text-sm font-serif font-bold text-dark-brown">Home Delivery</h4>
                        <p className="text-[10px] text-dark-brown/50 mt-0.5 leading-relaxed">Delivered directly to your address</p>
                      </div>
                    </div>
                  </div>

                  {/* Store Pickup Card */}
                  <div
                    onClick={() => setDeliveryMethod('Store Pickup')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[90px] ${
                      deliveryMethod === 'Store Pickup'
                        ? 'border-maroon bg-maroon/[0.02]'
                        : 'border-cream bg-white hover:border-gold/50'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <MapPin className={`flex-shrink-0 mt-0.5 ${deliveryMethod === 'Store Pickup' ? 'text-maroon' : 'text-dark-brown/40'}`} size={20} />
                      <div>
                        <h4 className="text-sm font-serif font-bold text-dark-brown">Store Pickup</h4>
                        <p className="text-[10px] text-dark-brown/50 mt-0.5 leading-relaxed">Collect from Samastipur showroom</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditional Verification & Serviceability Details */}
                {deliveryMethod === 'Home Delivery' ? (
                  <div className="space-y-3 pt-2">
                    {deliveryInfo ? (
                      deliveryInfo.serviceable ? (
                        <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2 animate-fadeIn text-xs">
                          <div className="text-emerald-800 font-bold flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                            ✓ Location verified & deliverable
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-medium text-dark-brown/80">
                            <div className="flex items-center gap-2">
                              <span className="text-gold">📅</span>
                              <span>
                                Expected Delivery: <strong className="text-dark-brown">{getExpectedDeliveryDate()}</strong>
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-gold">💵</span>
                              <span>
                                Payment Options: <strong className="text-dark-brown">COD & Online Available</strong>
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                              <span className="text-gold">🚚</span>
                              <span>
                                Shipping Charge:{' '}
                                {deliveryInfo.delivery_charge && deliveryInfo.delivery_charge > 0 ? (
                                  <strong className="text-maroon">₹{deliveryInfo.delivery_charge}</strong>
                                ) : (
                                  <strong className="text-emerald-700 font-bold">FREE Shipping</strong>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-red-50/50 border border-red-200 rounded-xl space-y-1 text-xs text-red-700 animate-fadeIn">
                          <div className="font-bold flex items-center gap-1.5 text-sm">
                            <span>✕</span> Delivery not available at this location
                          </div>
                          <p className="text-red-600/80">
                            Please change the PIN code in Step 1 or select Store Pickup.
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="p-4 bg-cream/15 border border-cream rounded-xl space-y-3 text-xs text-dark-brown/70">
                        <p className="font-semibold text-maroon">
                          ⚠️ Verification Required
                        </p>
                        <p className="leading-relaxed">
                          Please enter and verify your 6-digit PIN code in Step 1 above to check deliverability and shipping rates.
                        </p>
                        
                        <div className="flex items-center justify-between border-t border-cream/50 pt-2.5">
                          <span>Or use GPS coordinates:</span>
                          <button
                            type="button"
                            onClick={handleUseMyLocation}
                            disabled={loadingPincode || loadingLocation}
                            className="text-maroon hover:text-maroon-dark font-bold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {loadingLocation ? (
                              <>
                                <span className="w-3 h-3 border-2 border-maroon border-t-transparent rounded-full animate-spin inline-block" />
                                Detecting...
                              </>
                            ) : (
                              <>📍 Detect GPS Location</>
                            )}
                          </button>
                        </div>
                        {locError && (
                          <p className="text-red-600 font-semibold">⚠️ {locError}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-[#FFF9F0]/70 border border-[#C9A45C]/25 rounded-xl text-xs text-dark-brown space-y-2 leading-relaxed">
                    <p className="font-bold text-maroon text-sm flex items-center gap-1.5">
                      <span>🏪</span> Showroom Pickup Details
                    </p>
                    <p className="font-medium">
                      <strong>Shree Banarasi Sarees</strong><br />
                      Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103
                    </p>
                    <p className="text-[10px] text-dark-brown/60">
                      Showroom timings: 10:00 AM – 9:00 PM (Daily). No delivery fee applies for store collection.
                    </p>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Shree+Banarasi+Sarees+Samastipur"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-maroon font-bold underline inline-block mt-1 hover:text-maroon-dark"
                    >
                      Get Directions on Google Maps →
                    </a>
                  </div>
                )}
              </div>

              {/* STEP 3: PAYMENT METHOD */}
              <div className="bg-white p-6 rounded-2xl border border-cream shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b border-cream pb-3">
                  <span className="w-6 h-6 rounded-full bg-maroon text-white text-xs font-bold flex items-center justify-center font-serif">3</span>
                  <h2 className="font-serif text-lg font-bold text-dark-brown">
                    Payment Method
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* UPI */}
                  <label
                    className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all min-h-[110px] ${
                      paymentMethod === 'UPI'
                        ? 'border-maroon bg-maroon/[0.02]'
                        : 'border-cream bg-white hover:border-gold/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'UPI'}
                        onChange={() => setPaymentMethod('UPI')}
                        className="accent-maroon flex-shrink-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-serif text-sm font-bold text-dark-brown">UPI</span>
                    </div>
                    <div className="mt-2 text-[10px] leading-relaxed text-dark-brown/65 font-medium">
                      Google Pay, PhonePe, Paytm or UPI ID.
                      <span className="block text-gold font-bold mt-1">
                        Secure link sent via WhatsApp
                      </span>
                    </div>
                  </label>

                  {/* Cash on Delivery */}
                  <label
                    className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all min-h-[110px] ${
                      paymentMethod === 'Cash on Delivery'
                        ? 'border-maroon bg-maroon/[0.02]'
                        : 'border-cream bg-white hover:border-gold/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'Cash on Delivery'}
                        onChange={() => setPaymentMethod('Cash on Delivery')}
                        className="accent-maroon flex-shrink-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-serif text-sm font-bold text-dark-brown">Cash on Delivery</span>
                    </div>
                    <div className="mt-2 text-[10px] leading-relaxed text-dark-brown/65 font-medium">
                      Pay in cash or scan UPI code during courier doorstep delivery.
                    </div>
                  </label>

                  {/* Online Payment */}
                  <label
                    className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all min-h-[110px] ${
                      paymentMethod === 'Online Payment'
                        ? 'border-maroon bg-maroon/[0.02]'
                        : 'border-cream bg-white hover:border-gold/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'Online Payment'}
                        onChange={() => setPaymentMethod('Online Payment')}
                        className="accent-maroon flex-shrink-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-serif text-sm font-bold text-dark-brown">Online Payment</span>
                    </div>
                    <div className="mt-2 text-[10px] leading-relaxed text-dark-brown/65 font-medium">
                      Pay immediately with Credit/Debit Cards, Net Banking or Wallets.
                    </div>
                  </label>
                </div>

                {/* Optional WhatsApp Support */}
                <div className="pt-2 border-t border-cream/30 flex justify-between items-center text-xs text-dark-brown/60">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-emerald-500" />
                    Need checkout assistance?
                  </span>
                  <button
                    type="button"
                    onClick={handleWhatsAppInquiry}
                    className="text-maroon font-bold underline hover:text-maroon-dark cursor-pointer"
                  >
                    Chat with an Expert
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Sticky Order Summary */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 space-y-6">
              
              <div className="bg-white p-5 rounded-2xl border border-cream shadow-sm space-y-4">
                <h3 className="font-serif text-base font-bold text-dark-brown border-b border-cream pb-3">
                  Order Summary
                </h3>

                {/* Products List */}
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const currentPrice = item.product.salePrice ?? item.product.price;
                    const salePrice = item.product.salePrice;
                    const originalPrice = item.product.price;
                    const hasDiscount = !!salePrice && salePrice < originalPrice;
                    const discountPercent = (hasDiscount && salePrice)
                      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
                      : 0;

                    return (
                      <div key={item.product.id} className="flex gap-3 text-xs border-b border-cream/35 pb-3 last:border-0 last:pb-0">
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.name} 
                          className="w-10 aspect-[3/4] object-cover rounded bg-cream flex-shrink-0 border border-cream/50" 
                        />
                        <div className="flex-grow">
                          <h4 className="font-serif font-bold text-dark-brown line-clamp-1">{item.product.name}</h4>
                          <p className="text-dark-brown/55 mt-0.5">Qty {item.quantity} &bull; {item.product.fabric}</p>
                          {hasDiscount && (
                            <p className="text-[10px] text-green-700 font-semibold mt-0.5 leading-none">
                              {discountPercent}% OFF Saved
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 font-medium">
                          <span className="font-bold text-dark-brown block">
                            ₹{(currentPrice * item.quantity).toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-dark-brown/40 line-through block mt-0.5">
                              ₹{(originalPrice * item.quantity).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Savings Announcement */}
                {totalSavings > 0 && (
                  <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl flex items-center gap-2 text-[10px] font-bold text-emerald-800 animate-pulse">
                    <Sparkles size={14} className="text-emerald-600" />
                    <span>🎉 You are saving ₹{totalSavings.toLocaleString('en-IN')} on this order!</span>
                  </div>
                )}

                {/* Pricing Summary (using backend-calculated totals dynamically) */}
                <div className="border-t border-cream/70 pt-4 space-y-2.5 text-xs font-semibold text-dark-brown/70">
                  {totalSavings > 0 && (
                    <div className="flex justify-between font-medium">
                      <span>Bag Total (List Price)</span>
                      <span className="line-through">₹{totalOriginalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-green-700 font-bold">
                      <span>Product Discount</span>
                      <span>-₹{totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-dark-brown">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    {deliveryMethod === 'Home Delivery' ? (
                      deliveryInfo ? (
                        deliveryInfo.serviceable ? (
                          deliveryInfo.delivery_charge && deliveryInfo.delivery_charge > 0 ? (
                            <span className="text-maroon font-bold">₹{deliveryInfo.delivery_charge}</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">FREE Delivery</span>
                          )
                        ) : (
                          <span className="text-red-600 font-bold">Not Serviceable</span>
                        )
                      ) : (
                        <span className="text-dark-brown/40 font-bold italic">Verify address PIN</span>
                      )
                    ) : (
                      <span className="text-emerald-700 font-bold">FREE (Store Pickup)</span>
                    )}
                  </div>
                  <div className="flex justify-between border-t border-cream pt-3 text-sm font-serif font-bold text-dark-brown">
                    <span>Total Amount</span>
                    <span className="text-maroon text-base">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Policy Disclaimer */}
                <p className="text-[10px] text-dark-brown/45 leading-relaxed text-center font-medium">
                  By completing payment you agree to our terms & return policies.
                </p>

                {/* Desktop Primary CTA */}
                <button
                  type="button"
                  onClick={() => handlePlaceOrder()}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-maroon hover:bg-maroon-dark text-[#FFF9F0] rounded-xl font-serif font-bold text-xs sm:text-sm tracking-widest uppercase hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hidden lg:flex"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      PLACING ORDER...
                    </>
                  ) : (
                    ctaText
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    href="/sarees"
                    className="text-xs text-dark-brown/65 hover:text-maroon font-semibold underline"
                  >
                    Modify Shopping Bag
                  </Link>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Form hook for sticky mobile CTA */}
      <form id="checkout-form" onSubmit={handlePlaceOrder} className="hidden" />

      {/* Sticky Bottom Payment / Order CTA for Mobile */}
      {cart.length > 0 && !isOrdered && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-cream px-4 py-3 shadow-[0_-8px_24px_rgba(45,33,29,0.08)] lg:hidden flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-dark-brown/40 uppercase font-bold tracking-wider leading-none">Total Amount</span>
            <span className="font-serif text-lg font-extrabold text-maroon mt-1">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting}
            className="bg-maroon hover:bg-maroon-dark text-white rounded-xl px-6 py-3 font-serif font-bold text-xs sm:text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer min-w-[185px] text-center"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                PLACING...
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
    <Suspense fallback={<div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center font-serif text-maroon text-xl animate-pulse">Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
