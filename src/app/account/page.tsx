"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useStore } from '../../context/StoreContext';
import { 
  ShoppingBag, 
  FileText, 
  MessageCircle, 
  ArrowRight 
} from 'lucide-react';

function getStatusDisplay(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
    case 'placed':
    case 'ordered':
      return 'Order Placed';
    case 'confirmed':
    case 'processing':
      return 'Order Confirmed';
    case 'packed':
      return 'Packed & Ready';
    case 'shipped':
      return 'Dispatched / In Transit';
    case 'out_for_delivery':
    case 'out for delivery':
      return 'Out for Delivery';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status || 'Status Update';
  }
}

function AccountContent() {
  const { 
    orders, 
    customRequests, 
    recentSearches,
    clearRecentSearches
  } = useStore();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Get active order details
  const activeOrder = orders.find(o => o.orderId === selectedOrderId) || (orders.length > 0 ? orders[0] : null);
  const historyList = activeOrder?.statusHistory || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Orders & Tracking (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-cream shadow-sm space-y-6 animate-fadeIn">
          <h2 className="font-serif text-base sm:text-lg font-bold text-dark-brown border-b border-cream pb-3 flex items-center gap-2">
            <ShoppingBag size={18} className="text-maroon" />
            Your Orders ({orders.length})
          </h2>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-dark-brown/50 italic">
              No orders placed yet. Shop our premium collection to get started.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Selector List */}
              {orders.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-cream/50 scrollbar-none">
                  {orders.map((o) => (
                    <button
                      key={o.orderId}
                      onClick={() => setSelectedOrderId(o.orderId)}
                      className={`px-3.5 py-1.5 text-xs rounded-full border transition-all flex-shrink-0 font-serif font-bold ${
                        (activeOrder?.orderId === o.orderId)
                          ? 'bg-maroon border-maroon text-ivory shadow-sm'
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
                  <div className="bg-[#FFF9F0]/40 p-4 rounded-xl border border-cream grid grid-cols-2 sm:flex sm:flex-row justify-between gap-4 text-xs font-semibold text-dark-brown/75 shadow-sm">
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-dark-brown/40 uppercase font-bold text-[9px] tracking-wider">Order ID</p>
                      <p className="text-xs sm:text-sm font-bold text-maroon uppercase mt-0.5 break-all leading-tight">{activeOrder.orderId}</p>
                    </div>
                    <div>
                      <p className="text-dark-brown/40 uppercase font-bold text-[9px] tracking-wider">Placed On</p>
                      <p className="text-xs sm:text-sm font-bold text-dark-brown mt-0.5">
                        {new Date(activeOrder.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-dark-brown/40 uppercase font-bold text-[9px] tracking-wider">Total Amount</p>
                      <p className="text-xs sm:text-sm font-bold text-maroon mt-0.5">₹{activeOrder.total.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-dark-brown/40 uppercase font-bold text-[9px] tracking-wider">Status</p>
                      <span className="inline-block px-2.5 py-0.5 bg-green-50 text-green-800 border border-green-150 rounded-full text-[9px] font-bold mt-1 uppercase tracking-wider">
                        {activeOrder.orderStatus}
                      </span>
                    </div>
                  </div>



                  {/* Detailed Tracking History */}
                  {historyList.length > 0 && (
                    <div className="border-t border-cream pt-5 space-y-4">
                      <h3 className="text-xs font-bold text-dark-brown/65 uppercase tracking-wider font-serif">
                        Tracking Activity Log
                      </h3>
                      <div className="space-y-4 pl-2">
                        {historyList.map((history, idx) => {
                          const date = new Date(history.createdAt);
                          const formattedDate = date.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          });
                          const formattedTime = date.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <div key={history.id || idx} className="relative flex gap-4">
                              {/* Connector line between tracking list items */}
                              {idx < historyList.length - 1 && (
                                <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-cream/70" />
                              )}
                              
                              {/* Dot indicator */}
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-maroon/10 border border-maroon/30 flex items-center justify-center text-maroon z-10 bg-[#FFF9F0]">
                                <div className="w-1.5 h-1.5 rounded-full bg-maroon" />
                              </div>

                              <div className="flex-grow bg-[#FFF9F0]/20 border border-cream/40 p-3 rounded-xl text-xs">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                  <span className="font-serif font-bold text-dark-brown text-xs">
                                    {getStatusDisplay(history.status)}
                                  </span>
                                  <span className="text-[10px] text-dark-brown/40 font-semibold uppercase">
                                    {formattedDate} &bull; {formattedTime}
                                  </span>
                                </div>
                                {history.note && (
                                  <p className="text-dark-brown/65 mt-1.5 italic text-[11px] leading-relaxed">
                                    &ldquo;{history.note}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Items Details */}
                  <div className="border-t border-cream pt-5 space-y-4">
                    <h3 className="text-xs font-bold text-dark-brown/65 uppercase tracking-wider font-serif">
                      Saree details in order
                    </h3>
                    <div className="space-y-3">
                      {activeOrder.items.map((item: any) => (
                        <div key={item.product.id} className="flex gap-4 p-3 border border-cream/50 rounded-xl bg-white shadow-sm hover:shadow transition-shadow animate-fadeIn">
                          <img src={item.product.images[0]} alt={item.product.name} className="w-14 aspect-[3/4] object-cover rounded-lg bg-cream flex-shrink-0" />
                          <div className="flex-grow flex flex-col justify-center">
                            <h4 className="font-serif text-sm font-bold text-dark-brown leading-snug">{item.product.name}</h4>
                            <p className="text-xs text-dark-brown/60 mt-1">{item.product.fabric} &bull; Qty {item.quantity}</p>
                          </div>
                          <div className="text-right flex flex-col justify-center">
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
      </div>

      {/* Right Column: Custom Requests & Recent Searches (1/3 width) */}
      <div className="space-y-6">
        {/* Custom Saree Requests */}
        <div className="bg-white p-6 rounded-lg border border-cream shadow-sm space-y-4">
          <h2 className="font-serif text-base font-bold text-dark-brown border-b border-cream pb-3 flex items-center gap-2">
            <FileText size={18} className="text-maroon" />
            Customizations ({customRequests.length})
          </h2>

          {customRequests.length === 0 ? (
            <div className="py-6 text-center text-xs text-dark-brown/50 italic">
              No customization requests submitted yet.
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              {customRequests.map((req) => (
                <div 
                  key={req.id} 
                  className="border border-cream p-4 rounded-lg bg-[#FFF9F0]/30 space-y-2 text-xs"
                >
                  <div className="flex justify-between items-center border-b border-cream/50 pb-2">
                    <span className="font-serif font-bold text-maroon text-sm">{req.sareeType}</span>
                    <span className="px-2 py-0.5 bg-yellow-50 border border-yellow-100 text-yellow-800 font-bold rounded-[3px] text-[9px] uppercase tracking-wide">
                      {req.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-dark-brown/80 font-medium">
                    <p><strong>Color:</strong> {req.color}</p>
                    <p><strong>Fabric:</strong> {req.fabric}</p>
                    <p><strong>Budget:</strong> {req.budget}</p>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <a
                      href={`https://wa.me/+916203909946?text=${encodeURIComponent(`Hello, I am tracking my Saree Customization Request (ID: ${req.id})`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1 px-3 bg-[#25D366] text-white rounded text-[10px] font-bold flex items-center gap-1 hover:bg-[#20ba5a]"
                    >
                      <MessageCircle size={10} className="fill-current" />
                      Chat
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Searches */}
        <div className="bg-white p-5 rounded-lg border border-cream shadow-sm space-y-3 text-xs">
          <div className="flex justify-between items-center border-b border-cream pb-2">
            <h3 className="font-serif text-sm font-bold text-dark-brown">
              Recent Searches
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
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-dark-brown/50 italic animate-pulse">Loading orders...</div>}>
      <AccountContent />
    </Suspense>
  );
}
