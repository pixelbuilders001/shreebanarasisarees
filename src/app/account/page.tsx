"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { useStore } from '../../context/StoreContext';
import { User, FileText, ShoppingBag, History, LogOut, CheckCircle2, Circle, Clock, MessageCircle, ArrowRight } from 'lucide-react';

function AccountContent() {
  const { 
    userPhone, 
    orders, 
    customRequests, 
    loginUser, 
    logoutUser,
    recentSearches,
    clearRecentSearches 
  } = useStore();

  // Login Form States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Selected Order for detail view
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phoneNumber)) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setAuthError('');
    setIsOtpSent(true);
    setAuthSuccess('OTP sent successfully (Use 123456 to log in)');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode === '123456') {
      loginUser(phoneNumber);
      setAuthSuccess('Logged in successfully!');
      setPhoneNumber('');
      setOtpCode('');
      setIsOtpSent(false);
      setAuthSuccess('');
    } else {
      setAuthError('Invalid OTP. Please enter 123456.');
    }
  };

  // Helper to determine status step
  const getStatusStep = (status: string) => {
    switch (status) {
      case 'Placed': return 0;
      case 'Processing': return 1;
      case 'Shipped': return 2;
      case 'Delivered': return 3;
      default: return 0;
    }
  };

  const timelineSteps = [
    { title: 'Order Placed', desc: 'Saree order is registered.' },
    { title: 'Weaving & Quality Check', desc: 'Fabric inspection and border check.' },
    { title: 'Dispatched', desc: 'Saree packed & handed to courier.' },
    { title: 'Delivered', desc: 'Package arrived at your home.' }
  ];

  // If not logged in, render the login panel
  if (!userPhone) {
    return (
      <>
        <Header />
        <main className="max-w-md mx-auto px-4 py-16 flex-grow">
          <div className="bg-white border border-cream p-8 rounded-lg shadow-md space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-cream flex items-center justify-center rounded-full text-maroon mb-3 shadow-inner">
                <User size={22} />
              </div>
              <h2 className="font-serif text-2xl font-extrabold text-dark-brown">
                Customer Dashboard
              </h2>
              <p className="text-xs text-dark-brown/65 mt-1">
                Enter your mobile number to view orders, track delivery, and check customization status.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded border border-red-100">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded border border-green-100">
                {authSuccess}
              </div>
            )}

            {!isOtpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                    Mobile Number
                  </label>
                  <div className="flex border border-cream rounded overflow-hidden">
                    <span className="bg-cream/40 px-3 py-2 text-xs font-semibold text-dark-brown border-r border-cream flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      required
                      className="w-full px-3 py-2.5 text-sm text-dark-brown focus:outline-none placeholder-dark-brown/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-maroon text-ivory rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark transition-all shadow"
                >
                  SEND VERIFICATION CODE
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                    Enter 6-Digit OTP sent to +91 {phoneNumber}
                  </label>
                  <input
                    type="password"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 123456"
                    required
                    maxLength={6}
                    className="w-full border border-cream px-3 py-2.5 text-center text-sm font-semibold tracking-[0.5em] text-dark-brown focus:outline-none focus:border-gold rounded placeholder:text-[10px] placeholder:tracking-normal"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-maroon text-ivory rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark transition-all shadow"
                >
                  VERIFY & LOGIN
                </button>

                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="w-full text-center text-xs text-maroon hover:underline font-bold mt-1"
                >
                  Change Mobile Number
                </button>
              </form>
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Get active order details
  const activeOrder = orders.find(o => o.orderId === selectedOrderId) || (orders.length > 0 ? orders[0] : null);
  const currentStep = activeOrder ? getStatusStep(activeOrder.orderStatus) : 0;

  return (
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cream pb-6 mb-8">
          <div>
            <nav className="text-xs text-dark-brown/50 font-medium mb-2 flex items-center gap-1">
              <Link href="/" className="hover:text-maroon">Home</Link>
              <span>/</span>
              <span className="text-dark-brown">Dashboard</span>
            </nav>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-dark-brown flex items-center gap-2">
              Namaste, +91 {userPhone}
            </h1>
          </div>
          <button
            onClick={() => logoutUser()}
            className="py-2 px-4 border border-red-200 text-red-600 hover:bg-red-50 rounded font-serif font-bold text-xs tracking-wider uppercase transition-colors flex items-center gap-1.5"
          >
            <LogOut size={14} />
            LOG OUT
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Track Active Orders */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Orders Section */}
            <div className="bg-white p-6 rounded-lg border border-cream shadow-sm space-y-6">
              <h2 className="font-serif text-lg font-bold text-dark-brown border-b border-cream pb-3 flex items-center gap-2">
                <ShoppingBag size={18} className="text-maroon" />
                Your Orders ({orders.length})
              </h2>

              {orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-dark-brown/50 italic">
                  No orders placed yet. Shop our premium collection to get started.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Order Selector List */}
                  {orders.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 border-b border-cream/50">
                      {orders.map((o) => (
                        <button
                          key={o.orderId}
                          onClick={() => setSelectedOrderId(o.orderId)}
                          className={`px-3 py-1.5 text-xs rounded border transition-all ${
                            (activeOrder?.orderId === o.orderId)
                              ? 'bg-maroon border-maroon text-ivory font-bold'
                              : 'bg-white border-cream text-dark-brown/70 hover:bg-cream/20'
                          }`}
                        >
                          Order {o.orderId.substring(0, 8)}...
                        </button>
                      ))}
                    </div>
                  )}

                  {activeOrder && (
                    <div className="space-y-6">
                      
                      {/* Active Order Summary details */}
                      <div className="bg-cream/15 p-4 rounded border border-cream flex flex-col sm:flex-row justify-between gap-4 text-xs font-semibold text-dark-brown/75">
                        <div>
                          <p className="text-dark-brown/40 uppercase font-bold text-[10px]">Order ID</p>
                          <p className="text-sm font-bold text-maroon uppercase mt-0.5">{activeOrder.orderId}</p>
                        </div>
                        <div>
                          <p className="text-dark-brown/40 uppercase font-bold text-[10px]">Placed On</p>
                          <p className="text-sm font-bold text-dark-brown mt-0.5">
                            {new Date(activeOrder.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-dark-brown/40 uppercase font-bold text-[10px]">Total Amount</p>
                          <p className="text-sm font-bold text-maroon mt-0.5">₹{activeOrder.total.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-dark-brown/40 uppercase font-bold text-[10px]">Payment Status</p>
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                            activeOrder.paymentMethod === 'UPI' 
                              ? 'bg-yellow-50 text-yellow-800 border border-yellow-100'
                              : 'bg-green-50 text-green-800 border border-green-100'
                          }`}>
                            {activeOrder.paymentMethod === 'UPI' ? 'Awaiting Payment' : 'Paid / COD'}
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Timeline */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-dark-brown/60 uppercase tracking-wider">
                          Delivery Timeline Status
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 relative">
                          
                          {/* Progress Line */}
                          <div className="absolute top-[28px] left-[32px] right-[32px] h-0.5 bg-cream hidden md:block -z-10">
                            <div 
                              className="h-full bg-green-600 transition-all duration-500" 
                              style={{ width: `${(currentStep / 3) * 100}%` }}
                            />
                          </div>

                          {timelineSteps.map((step, idx) => {
                            const isCompleted = idx < currentStep;
                            const isCurrent = idx === currentStep;

                            return (
                              <div key={idx} className="flex md:flex-col items-center md:text-center gap-4 md:gap-2">
                                {/* Dot Icon indicator */}
                                <div className="flex-shrink-0">
                                  {isCompleted ? (
                                    <div className="w-8 h-8 rounded-full bg-green-600 border-2 border-white flex items-center justify-center text-white shadow-sm">
                                      <CheckCircle2 size={16} />
                                    </div>
                                  ) : isCurrent ? (
                                    <div className="w-8 h-8 rounded-full bg-maroon border-2 border-gold flex items-center justify-center text-[#FFFFFF] shadow-md animate-pulse">
                                      <Clock size={15} />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-white border-2 border-cream flex items-center justify-center text-dark-brown/30 shadow-sm">
                                      <Circle size={12} className="fill-current" />
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <h4 className={`text-xs font-bold ${isCurrent ? 'text-maroon' : isCompleted ? 'text-green-700' : 'text-dark-brown/60'}`}>
                                    {step.title}
                                  </h4>
                                  <p className="text-[10px] text-dark-brown/50 mt-0.5 leading-relaxed font-medium">
                                    {step.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Items Details */}
                      <div className="border-t border-cream pt-4 space-y-3">
                        <h3 className="text-xs font-bold text-dark-brown/60 uppercase tracking-wider">
                          Saree details in order
                        </h3>
                        <div className="space-y-3">
                          {activeOrder.items.map((item: any) => (
                            <div key={item.product.id} className="flex gap-4 p-3 border border-cream/50 rounded-lg bg-white shadow-inner">
                              <img src={item.product.images[0]} alt={item.product.name} className="w-12 aspect-[3/4] object-cover rounded bg-cream flex-shrink-0" />
                              <div className="flex-grow">
                                <h4 className="font-serif text-sm font-bold text-dark-brown leading-tight">{item.product.name}</h4>
                                <p className="text-xs text-dark-brown/60 mt-0.5">{item.product.fabric} &bull; Qty {item.quantity}</p>
                              </div>
                              <div className="text-right">
                                <span className="font-serif text-sm font-bold text-maroon">
                                  ₹{((item.product.salePrice ?? item.product.price) * item.quantity).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Custom Saree Requests Section */}
            <div className="bg-white p-6 rounded-lg border border-cream shadow-sm space-y-4">
              <h2 className="font-serif text-lg font-bold text-dark-brown border-b border-cream pb-3 flex items-center gap-2">
                <FileText size={18} className="text-maroon" />
                Customization Requests ({customRequests.length})
              </h2>

              {customRequests.length === 0 ? (
                <div className="py-6 text-center text-xs text-dark-brown/50 italic">
                  No customization requests submitted. Need a custom color or weave?{" "}
                  <Link href="/#custom-saree" className="text-maroon underline font-semibold">Submit a request here</Link>.
                </div>
              ) : (
                <div className="space-y-4">
                  {customRequests.map((req) => (
                    <div 
                      key={req.id} 
                      className="border border-cream p-4 rounded-lg bg-[#FFF9F0]/30 space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center border-b border-cream/50 pb-2">
                        <span className="font-serif font-bold text-maroon text-sm">{req.sareeType} Customization</span>
                        <span className="px-2 py-0.5 bg-yellow-50 border border-yellow-100 text-yellow-800 font-bold rounded-[3px] text-[9px] uppercase tracking-wide">
                          {req.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-dark-brown/80 font-medium">
                        <p><strong>Color:</strong> {req.color}</p>
                        <p><strong>Fabric:</strong> {req.fabric}</p>
                        <p><strong>Budget:</strong> {req.budget}</p>
                        <p><strong>Occasion:</strong> {req.occasion}</p>
                      </div>
                      {req.requirements && (
                        <p className="text-dark-brown/65 pt-1.5 border-t border-cream/30 italic">
                          "{req.requirements}"
                        </p>
                      )}
                      <div className="pt-2 flex justify-end">
                        <a
                          href={`https://wa.me/+916203909946?text=${encodeURIComponent(`Hello, I am tracking my Saree Customization Request (ID: ${req.id}) for a ${req.sareeType} saree.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1 px-3 bg-[#25D366] text-white rounded text-[10px] font-bold flex items-center gap-1 hover:bg-[#20ba5a]"
                        >
                          <MessageCircle size={10} className="fill-current" />
                          Chat with Weaver
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Profile details & Recent History */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Account Info */}
            <div className="bg-white p-5 rounded-lg border border-cream shadow-sm space-y-3 text-xs">
              <h3 className="font-serif text-base font-bold text-dark-brown border-b border-cream pb-2.5">
                Profile Details
              </h3>
              <p className="text-dark-brown/80"><strong>Phone Number:</strong> +91 {userPhone}</p>
              <p className="text-dark-brown/80"><strong>Country / Code:</strong> India (+91)</p>
              <p className="text-dark-brown/60 leading-relaxed font-light">
                Your profile is linked to this device's storage. Logging out will clear credentials, but orders remain logged under this phone number.
              </p>
            </div>

            {/* Recent Searches */}
            <div className="bg-white p-5 rounded-lg border border-cream shadow-sm space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-cream pb-2">
                <h3 className="font-serif text-base font-bold text-dark-brown">
                  Search History
                </h3>
                {recentSearches.length > 0 && (
                  <button onClick={clearRecentSearches} className="text-[10px] text-maroon hover:underline font-bold">
                    Clear
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <p className="text-dark-brown/40 italic">No search logs found.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((s, idx) => (
                    <Link
                      key={idx}
                      href={`/sarees?search=${encodeURIComponent(s)}`}
                      className="bg-cream/30 hover:bg-cream text-dark-brown/80 text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1 transition-colors"
                    >
                      {s}
                      <ArrowRight size={8} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center font-serif text-maroon text-xl animate-pulse">Loading Dashboard...</div>}>
      <AccountContent />
    </Suspense>
  );
}
