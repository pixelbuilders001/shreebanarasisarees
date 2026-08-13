"use client";

import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { useStore } from '../../context/StoreContext';
import { CheckCircle, MapPin, CreditCard, Landmark, Truck, ShoppingBag, ArrowLeft } from 'lucide-react';
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
    user
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

  // Validation States
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

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

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Delhi"
  ];

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

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
      if (saveToProfile && user && deliveryMethod === 'Home Delivery') {
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

  if (isOrdered && createdOrder) {
    return (
      <>
        <Header />
        <main className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="bg-white border border-cream p-8 rounded-lg shadow-md space-y-6 flex flex-col items-center">
            <CheckCircle size={64} className="text-green-600 animate-bounce" />

            <div className="space-y-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-dark-brown">
                Order Placed Successfully!
              </h2>
              <p className="text-sm text-dark-brown/65">
                Thank you, your order has been received. Our team will contact you shortly.
              </p>
            </div>

            <div className="bg-cream/25 w-full p-4 rounded text-xs text-left border border-cream space-y-2.5">
              <div className="flex justify-between border-b border-cream pb-2 font-bold text-dark-brown">
                <span>Order ID:</span>
                <span className="text-maroon text-sm uppercase">{createdOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(createdOrder.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Method:</span>
                <span className="font-semibold">{createdOrder.customer.deliveryMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span>{createdOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-t border-cream pt-2 font-bold text-dark-brown">
                <span>Total Amount:</span>
                <span className="text-maroon text-sm">₹{createdOrder.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {createdOrder.paymentMethod === 'UPI' && (
              <div className="p-3 bg-yellow-50 text-yellow-800 text-xs font-semibold rounded border border-yellow-100 text-left leading-relaxed">
                🔔 <span className="font-bold">UPI Payment:</span> Since you chose UPI, our Saree Expert is generating a payment request link. We will send it to your WhatsApp number (+91 {createdOrder.customer.phone}) within 5 minutes.
              </div>
            )}

            <div className="w-full pt-4 flex flex-col gap-3">
              <button
                onClick={() => router.push('/account')}
                className="w-full py-3 bg-maroon text-ivory rounded font-serif font-bold text-xs sm:text-sm tracking-widest uppercase hover:bg-maroon-dark transition-all shadow-md"
              >
                TRACK ORDER STATUS
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full py-2.5 bg-white border border-cream text-dark-brown rounded font-serif font-bold text-xs uppercase hover:bg-cream/20 transition-all"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">

        {/* Header */}
        <div className="border-b border-cream pb-6 mb-6">
          <nav className="text-xs text-dark-brown/50 font-medium mb-2 flex items-center gap-1">
            <Link href="/" className="hover:text-maroon">Home</Link>
            <span>/</span>
            <span className="text-dark-brown">Checkout</span>
          </nav>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-dark-brown">
            Checkout
          </h1>
        </div>

        {cart.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center bg-white border border-cream rounded-lg shadow-sm px-4">
            <ShoppingBag size={48} className="text-maroon/20 mb-4" />
            <h3 className="font-serif text-lg sm:text-xl font-bold text-dark-brown mb-2">
              Your bag is empty
            </h3>
            <p className="text-sm text-dark-brown/60 max-w-sm mb-6">
              You cannot proceed to checkout with an empty shopping bag.
            </p>
            <button
              onClick={() => router.push('/sarees')}
              className="px-6 py-2.5 bg-maroon text-ivory rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark transition-all shadow"
            >
              EXPLORE COLLECTIONS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Side: Shipping & Payment Form */}
            <form onSubmit={handlePlaceOrder} className="lg:col-span-8 space-y-6">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded border border-red-100">
                  {errorMsg}
                </div>
              )}

              {/* Step 1: Customer Details */}
              <div className="bg-white p-6 rounded-lg border border-cream shadow-sm space-y-4">
                <h2 className="font-serif text-lg font-bold text-dark-brown border-b border-cream pb-2.5">
                  1. Customer Details
                </h2>

                {user && shippingAddresses && shippingAddresses.length > 0 && (
                  <div className="bg-[#FFF9F0]/60 p-4 rounded border border-cream/50 space-y-2 mb-4 animate-fadeIn">
                    <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide">
                      Select from Saved Addresses
                    </label>
                    <select
                      onChange={(e) => {
                        const addrId = e.target.value;
                        if (addrId) {
                          const selected = shippingAddresses.find(a => a.id === addrId);
                          if (selected) {
                            setFullName(selected.full_name || '');
                            setMobileNumber(selected.phone || '');
                            setAddress(selected.address_line1 + (selected.address_line2 ? ', ' + selected.address_line2 : '') + (selected.landmark ? ', Landmark: ' + selected.landmark : ''));
                            setCity(selected.city || '');
                            if (selected.state) {
                              setState(selected.state);
                            }
                            setPinCode(selected.pincode || '');
                            handleCheckPincode(selected.pincode);
                            setDeliveryMethod('Home Delivery');
                          }
                        }
                      }}
                      className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs font-semibold text-dark-brown rounded p-2.5 outline-none cursor-pointer"
                    >
                      <option value="">-- Choose a saved address --</option>
                      {shippingAddresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.address_label} - {addr.full_name} ({addr.city}, {addr.pincode}) {addr.is_default ? '[Default]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter full name"
                      required
                      className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded p-2.5 outline-none transition-all"
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
                      className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded p-2.5 outline-none transition-all"
                    />
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
                    className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded p-2.5 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Step 2: Delivery Method */}
              <div className="bg-white p-6 rounded-lg border border-cream shadow-sm space-y-4">
                <h2 className="font-serif text-lg font-bold text-dark-brown border-b border-cream pb-2.5">
                  2. Delivery Method
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Home Delivery Card */}
                  <div
                    onClick={() => setDeliveryMethod('Home Delivery')}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${deliveryMethod === 'Home Delivery'
                        ? 'border-maroon bg-maroon/[0.02]'
                        : 'border-cream bg-white hover:border-gold/50'
                      }`}
                  >
                    <div className="flex gap-3 items-center">
                      <Truck className={`flex-shrink-0 ${deliveryMethod === 'Home Delivery' ? 'text-maroon' : 'text-dark-brown/40'}`} />
                      <div>
                        <h4 className="text-sm font-serif font-bold text-dark-brown">Home Delivery</h4>
                        <p className="text-[10px] text-dark-brown/50">Delivered directly to your doorstep</p>
                      </div>
                    </div>
                  </div>

                  {/* Store Pickup Card */}
                  <div
                    onClick={() => setDeliveryMethod('Store Pickup')}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${deliveryMethod === 'Store Pickup'
                        ? 'border-maroon bg-maroon/[0.02]'
                        : 'border-cream bg-white hover:border-gold/50'
                      }`}
                  >
                    <div className="flex gap-3 items-center">
                      <MapPin className={`flex-shrink-0 ${deliveryMethod === 'Store Pickup' ? 'text-maroon' : 'text-dark-brown/40'}`} />
                      <div>
                        <h4 className="text-sm font-serif font-bold text-dark-brown">Store Pickup</h4>
                        <p className="text-[10px] text-dark-brown/50">Rudauli Chowk, Samastipur</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditional Fields based on Delivery Method */}
                {deliveryMethod === 'Home Delivery' ? (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                        Shipping Address *
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House / Flat No, Landmark, Street Address"
                        required
                        className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded p-2.5 outline-none transition-all"
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
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded p-2.5 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                          State *
                        </label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded p-2.5 outline-none transition-all cursor-pointer"
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
                            className="flex-grow bg-[#FFFFFF] border border-[#C9A45C]/30 focus:border-maroon focus:ring-1 focus:ring-maroon text-sm text-dark-brown rounded p-2.5 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => handleCheckPincode(pinCode)}
                            disabled={loadingPincode || loadingLocation}
                            className="bg-maroon hover:bg-maroon-dark text-white text-xs font-serif font-bold tracking-wider px-4 py-2 rounded transition-colors disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                          >
                            {loadingPincode ? '...' : 'VERIFY'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5">
                      <span className="text-dark-brown/50">Or check using GPS:</span>
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={loadingPincode || loadingLocation}
                        className="text-maroon hover:text-maroon-dark font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {loadingLocation ? (
                          <>
                            <span className="w-3 h-3 border-2 border-maroon border-t-transparent rounded-full animate-spin inline-block" />
                            Detecting...
                          </>
                        ) : (
                          <>
                            📍 Use My Location
                          </>
                        )}
                      </button>
                    </div>

                    {/* Status Display */}
                    {locError && (
                      <div className="text-xs text-red-600 font-semibold mt-1">
                        ⚠️ {locError}
                      </div>
                    )}

                    {deliveryInfo && !locError && (
                      <div className="mt-2 p-2.5 bg-cream/10 rounded border border-[#C9A45C]/20 text-xs space-y-1.5">
                        {deliveryInfo.serviceable ? (
                          <>
                            <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                              ✓ Location Verified & Serviceable
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-dark-brown/80 font-medium">
                              {deliveryInfo.distance_km !== undefined && (
                                <div>Distance: <span className="font-semibold text-dark-brown">{deliveryInfo.distance_km.toFixed(1)} km</span></div>
                              )}
                              {deliveryInfo.estimated_drive_minutes !== undefined && (
                                <div>Est. Time: <span className="font-semibold text-dark-brown">{deliveryInfo.estimated_drive_minutes} mins</span></div>
                              )}
                              {deliveryInfo.delivery_type && (
                                <div>Mode: <span className="font-semibold text-dark-brown uppercase">{deliveryInfo.delivery_type.replace('_', ' ')}</span></div>
                              )}
                              {deliveryInfo.delivery_charge !== undefined && (
                                <div className="col-span-2 text-maroon font-bold">
                                  Shipping Fee: ₹{deliveryInfo.delivery_charge} (added to total)
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-red-600 font-bold">
                            ✕ Delivery not available at this location
                          </div>
                        )}
                      </div>
                    )}

                    {user && (
                      <div className="pt-3 border-t border-cream/30 mt-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#8B5A2B]">
                          <input
                            type="checkbox"
                            checked={saveToProfile}
                            onChange={(e) => setSaveToProfile(e.target.checked)}
                            className="rounded border-[#C9A45C]/30 text-maroon focus:ring-maroon w-4 h-4"
                          />
                          Save this address to my profile for future orders
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-cream/20 rounded border border-cream text-xs text-dark-brown/85 space-y-2 leading-relaxed">
                    <p className="font-bold text-maroon text-sm">🏪 Store Pickup Address:</p>
                    <p className="font-medium">
                      <strong>Shree Banarasi Sarees</strong><br />
                      Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103
                    </p>
                    <p className="text-[10px] text-dark-brown/60">
                      Showroom timings: 10:00 AM – 9:00 PM (Daily). Please show your order confirmation ID at checkout.
                    </p>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Shree+Banarasi+Sarees+Samastipur"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-maroon font-bold underline inline-block mt-1"
                    >
                      Get Directions on Google Maps
                    </a>
                  </div>
                )}
              </div>

              {/* Step 3: Payment Method */}
              <div className="bg-white p-6 rounded-lg border border-cream shadow-sm space-y-4">
                <h2 className="font-serif text-lg font-bold text-dark-brown border-b border-cream pb-2.5">
                  3. Payment Method
                </h2>

                <div className="space-y-3">
                  {/* UPI Option */}
                  <label className={`p-4 rounded-lg border flex gap-3 items-center cursor-pointer transition-all ${paymentMethod === 'UPI' ? 'border-maroon bg-maroon/[0.01]' : 'border-cream bg-white'
                    }`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                      className="accent-maroon flex-shrink-0"
                    />
                    <div className="flex-grow">
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif text-sm font-bold text-dark-brown">UPI</span>
                        <span className="text-[10px] text-dark-brown/50 font-normal">(GPay / PhonePe / Paytm)</span>
                      </div>
                      <p className="text-[10px] text-gold font-semibold mt-0.5">
                        You'll receive a payment link via WhatsApp.
                      </p>
                    </div>
                  </label>

                  {/* Cash on Delivery Option */}
                  <label className={`p-4 rounded-lg border flex gap-3 items-center cursor-pointer transition-all ${paymentMethod === 'Cash on Delivery' ? 'border-maroon bg-maroon/[0.01]' : 'border-cream bg-white'
                    }`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'Cash on Delivery'}
                      onChange={() => setPaymentMethod('Cash on Delivery')}
                      className="accent-maroon flex-shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-serif font-bold text-dark-brown">Cash on Delivery</h4>
                      <p className="text-[10px] text-dark-brown/50">Pay in cash or UPI when your package is delivered</p>
                    </div>
                  </label>

                  {/* Online Payment */}
                  <label className={`p-4 rounded-lg border flex gap-3 items-center cursor-pointer transition-all ${paymentMethod === 'Online Payment' ? 'border-maroon bg-maroon/[0.01]' : 'border-cream bg-white'
                    }`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'Online Payment'}
                      onChange={() => setPaymentMethod('Online Payment')}
                      className="accent-maroon flex-shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-serif font-bold text-dark-brown">Online Payment</h4>
                      <p className="text-[10px] text-dark-brown/50">Credit Card / Debit Card / Net Banking (Instant Settlement)</p>
                    </div>
                  </label>
                </div>
              </div>
            </form>

            {/* Right Side: Order Summary */}
            <div className="lg:col-span-4 space-y-6">

              <div className="bg-white p-5 rounded-lg border border-cream shadow-sm space-y-4">
                <h3 className="font-serif text-base font-bold text-dark-brown border-b border-cream pb-2.5">
                  Order Summary
                </h3>

                {/* Items preview list */}
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-3 text-xs">
                      <img src={item.product.images[0]} alt={item.product.name} className="w-10 aspect-[3/4] object-cover rounded bg-cream flex-shrink-0" />
                      <div className="flex-grow">
                        <h4 className="font-serif font-bold text-dark-brown line-clamp-1">{item.product.name}</h4>
                        <p className="text-dark-brown/55 mt-0.5">Qty {item.quantity} &bull; {item.product.fabric}</p>
                      </div>
                      <span className="font-bold text-dark-brown">
                        ₹{((item.product.salePrice ?? item.product.price) * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pricing Summary */}
                <div className="border-t border-cream/70 pt-3.5 space-y-2 text-xs font-semibold text-dark-brown/70">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    {deliveryMethod === 'Home Delivery' ? (
                      deliveryInfo ? (
                        deliveryInfo.serviceable ? (
                          deliveryInfo.delivery_charge && deliveryInfo.delivery_charge > 0 ? (
                            <span className="text-maroon font-bold">₹{deliveryInfo.delivery_charge}</span>
                          ) : (
                            <span className="text-green-700 font-bold">FREE</span>
                          )
                        ) : (
                          <span className="text-red-600 font-bold">Not Serviceable</span>
                        )
                      ) : (
                        <span className="text-dark-brown/40 font-bold italic">Verify location</span>
                      )
                    ) : (
                      <span className="text-green-700 font-bold">FREE (Pickup)</span>
                    )}
                  </div>
                  <div className="flex justify-between border-t border-cream pt-2.5 text-sm font-serif font-bold text-dark-brown">
                    <span>Total Amount</span>
                    <span className="text-maroon text-base">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Policy Agreements Disclaimer */}
                <p className="text-[10px] text-dark-brown/40 leading-relaxed text-center font-semibold">
                  By placing your order you agree to our terms & refund policy.
                </p>

                {/* Submit Order Trigger */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-maroon text-ivory rounded font-serif font-bold text-sm tracking-widest uppercase hover:bg-maroon-dark disabled:bg-maroon/50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
                      PLACING ORDER...
                    </>
                  ) : (
                    "PLACE ORDER"
                  )}
                </button>

                <Link
                  href="/sarees"
                  className="block text-center text-xs text-dark-brown/65 hover:text-maroon font-semibold underline"
                >
                  Modify Bag
                </Link>
              </div>

            </div>

          </div>
        )}

      </main>

      <Footer />
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center font-serif text-maroon text-xl animate-pulse">Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
