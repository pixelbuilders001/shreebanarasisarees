"use client";

import React, { useState, Suspense } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  ShoppingBag, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Package
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
    cancelOrder,
    cancelOrderItem
  } = useStore();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [itemToCancel, setItemToCancel] = useState<string | null>(null);
  const [cancelType, setCancelType] = useState<'order' | 'item'>('order');
  const [cancelStatus, setCancelStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Get active order details if one is selected
  const activeOrder = orders.find(o => o.orderId === selectedOrderId);
  const historyList = activeOrder?.statusHistory || [];

  const handleCancelOrder = async (productId?: string) => {
    if (!activeOrder) return;
    setOrderToCancel(activeOrder.orderId);
    
    if (productId && activeOrder.items.length > 1) {
      setItemToCancel(productId);
      setCancelType('item');
    } else {
      setItemToCancel(null);
      setCancelType('order');
    }
    
    setCancelStatus('idle');
    setShowCancelModal(true);
  };

  const confirmCancelOrderAction = async () => {
    if (!orderToCancel) return;

    setIsCancelling(true);
    try {
      if (cancelType === 'item' && itemToCancel) {
        const res = await cancelOrderItem(orderToCancel, itemToCancel);
        if (res.success) {
          if (res.cancelledEntireOrder) {
            setCancelType('order');
          }
          setCancelStatus('success');
        } else {
          setCancelStatus('error');
        }
      } else {
        const success = await cancelOrder(orderToCancel);
        if (success) {
          setCancelStatus('success');
        } else {
          setCancelStatus('error');
        }
      }
    } catch (err) {
      console.error("Cancellation error:", err);
      setCancelStatus('error');
    } finally {
      setIsCancelling(false);
    }
  };

  const targetItemObj = activeOrder?.items.find(item => item.product.id === itemToCancel);
  const targetItemName = targetItemObj?.product.name || '';

  const isCancellable = activeOrder && 
    activeOrder.orderStatus !== 'Out for Delivery' && 
    activeOrder.orderStatus !== 'Delivered' && 
    activeOrder.orderStatus !== 'Cancelled';

  // Responsive Timeline component
  const OrderTimeline = ({ currentStatus }: { currentStatus: string }) => {
    const steps = [
      'Order Placed',
      'Confirmed',
      'Packed',
      'Shipped',
      'Out for Delivery',
      'Delivered'
    ];

    const getStatusIndex = (status: string) => {
      const s = status?.toLowerCase() || '';
      if (s.includes('placed') || s.includes('order') || s.includes('pending')) return 0;
      if (s.includes('confirm') || s.includes('process')) return 1;
      if (s.includes('pack')) return 2;
      if (s.includes('ship') || s.includes('dispatch') || s.includes('transit')) return 3;
      if (s.includes('out') || s.includes('delivery')) return 4;
      if (s.includes('deliver')) return 5;
      return -1;
    };

    const activeIndex = getStatusIndex(currentStatus);
    const isCancelled = currentStatus?.toLowerCase() === 'cancelled';

    if (isCancelled) {
      return (
        <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-xs font-semibold">
          <span className="text-base">✕</span>
          <div>
            <span className="font-bold text-sm block">Order Cancelled</span>
            This order has been cancelled. If any payment was made, your refund is being processed to your original payment method.
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[#FFF9F0]/30 p-5 rounded-2xl border border-cream/50 space-y-5">
        <h3 className="text-xs font-bold text-dark-brown/65 uppercase tracking-wider font-serif">
          Delivery Progress
        </h3>

        {/* Horizontal Timeline for Desktop */}
        <div className="hidden md:flex items-center justify-between relative w-full pt-4 pb-2">
          <div className="absolute top-[28px] left-[6%] right-[6%] h-[2px] bg-cream z-0" />
          <div 
            className="absolute top-[28px] left-[6%] h-[2px] bg-maroon z-0 transition-all duration-500" 
            style={{ width: `${activeIndex >= 0 ? (activeIndex / (steps.length - 1)) * 88 : 0}%` }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx <= activeIndex;
            return (
              <div key={step} className="flex flex-col items-center flex-1 relative z-10 text-center">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-maroon border-maroon text-[#FFF9F0] shadow-sm' 
                    : 'bg-white border-cream text-dark-brown/40'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`text-[10px] font-bold mt-2 transition-colors duration-300 max-w-[85px] leading-tight ${
                  isCompleted ? 'text-maroon' : 'text-dark-brown/45'
                }`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Vertical Timeline for Mobile */}
        <div className="md:hidden space-y-4 pl-1">
          {steps.map((step, idx) => {
            const isCompleted = idx <= activeIndex;
            return (
              <div key={step} className="flex gap-4 relative">
                {idx < steps.length - 1 && (
                  <div className={`absolute left-[11px] top-6 bottom-[-16px] w-[2px] ${
                    idx < activeIndex ? 'bg-maroon' : 'bg-cream'
                  }`} />
                )}

                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 ${
                  isCompleted 
                    ? 'bg-maroon border-maroon text-[#FFF9F0]' 
                    : 'bg-white border-cream text-dark-brown/45'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>

                <div className="flex-grow pb-1">
                  <span className={`text-xs font-serif font-bold ${
                    isCompleted ? 'text-maroon' : 'text-dark-brown/50'
                  }`}>
                    {step}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* 1. VIEW ACTIVE ORDER DETAIL */}
      {selectedOrderId && activeOrder ? (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-cream shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-cream pb-3">
            <button
              onClick={() => setSelectedOrderId(null)}
              className="flex items-center gap-1.5 text-xs font-serif font-bold text-maroon hover:text-maroon-dark transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back to Orders
            </button>
            <span className="text-[10px] text-dark-brown/45 font-bold uppercase tracking-wider">
              Order Details
            </span>
          </div>

          {/* Active Order Summary Details */}
          <div className="bg-[#FFF9F0]/40 p-4 rounded-xl border border-cream grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-dark-brown/75">
            <div>
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
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold mt-1 uppercase tracking-wider border ${
                activeOrder.orderStatus === 'Delivered'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-150'
                  : activeOrder.orderStatus === 'Cancelled'
                  ? 'bg-red-50 text-red-800 border-red-150'
                  : 'bg-green-50 text-green-800 border-green-150'
              }`}>
                {activeOrder.orderStatus}
              </span>
            </div>
          </div>

          {/* Progress Timeline */}
          <OrderTimeline currentStatus={activeOrder.orderStatus} />

          {/* detailed history logs if available */}
          {historyList.length > 0 && (
            <div className="border-t border-cream pt-5 space-y-3">
              <h3 className="text-xs font-bold text-dark-brown/65 uppercase tracking-wider font-serif">
                Activity Logs
              </h3>
              <div className="space-y-3 pl-1">
                {historyList.map((history, idx) => {
                  const date = new Date(history.createdAt);
                  return (
                    <div key={history.id || idx} className="text-xs flex justify-between items-start gap-4 border-b border-cream/35 pb-2.5 last:border-0 last:pb-0">
                      <div>
                        <span className="font-serif font-bold text-dark-brown">{getStatusDisplay(history.status)}</span>
                        {history.note && (
                          <p className="text-[11px] text-dark-brown/60 italic mt-0.5">&ldquo;{history.note}&rdquo;</p>
                        )}
                      </div>
                      <span className="text-[10px] text-dark-brown/40 font-semibold flex-shrink-0">
                        {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} &bull; {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saree Details in Active Order */}
          <div className="border-t border-cream pt-5 space-y-4">
            <h3 className="text-xs font-bold text-dark-brown/65 uppercase tracking-wider font-serif">
              Saree Details
            </h3>
            <div className="space-y-3">
              {activeOrder.items.map((item: any) => (
                <div key={item.product.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border border-cream/50 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-4 items-center flex-grow">
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.name} 
                      className="w-14 aspect-[3/4] object-cover rounded-lg bg-cream flex-shrink-0 border border-cream/50" 
                    />
                    <div className="flex-grow flex flex-col justify-center">
                      <h4 className="font-serif text-sm font-bold text-dark-brown leading-snug">{item.product.name}</h4>
                      <p className="text-xs text-dark-brown/60 mt-1">{item.product.fabric} &bull; Qty {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
                    <span className="font-serif text-sm font-bold text-maroon">
                      ₹{((item.product.salePrice ?? item.product.price) * item.quantity).toLocaleString('en-IN')}
                    </span>
                    {isCancellable && (
                      <button
                        onClick={() => handleCancelOrder(item.product.id)}
                        disabled={isCancelling}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-300 rounded-lg text-[10px] font-serif font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {isCancelling ? 'Cancelling...' : activeOrder.items.length > 1 ? 'Cancel Item' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 2. ORDER LIST CARD VIEW */
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-cream shadow-sm space-y-6">
          <h2 className="font-serif text-base sm:text-lg font-bold text-dark-brown border-b border-cream pb-3 flex items-center gap-2">
            <ShoppingBag size={18} className="text-maroon" />
            Your Orders ({orders.length})
          </h2>

          {orders.length === 0 ? (
            <div className="py-16 text-center text-xs text-dark-brown/50 italic flex flex-col items-center justify-center">
              <ShoppingBag size={32} className="text-cream/80 mb-3" />
              <span>No orders placed yet. Shop our premium collection to get started.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                return (
                  <div 
                    key={order.orderId}
                    className="bg-white border border-cream rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="space-y-3.5 flex-grow">
                      {/* Header Info */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream/40 pb-2.5">
                        <div className="flex gap-4">
                          <div>
                            <span className="text-[10px] text-dark-brown/40 uppercase font-bold tracking-wider block">Order Number</span>
                            <span className="font-mono text-xs sm:text-sm font-bold text-maroon uppercase leading-none mt-0.5">{order.orderId}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-dark-brown/40 uppercase font-bold tracking-wider block">Placed On</span>
                            <span className="text-xs sm:text-sm font-semibold text-dark-brown mt-0.5 block">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Thumbnail + Item count */}
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-3 overflow-hidden py-1">
                          {order.items.map((item, idx) => (
                            <img
                              key={item.product.id || idx}
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-12 h-16 object-cover rounded-md border-2 border-white bg-cream shadow-sm flex-shrink-0"
                            />
                          ))}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-dark-brown">
                            {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
                          </p>
                          <p className="text-[10px] text-dark-brown/50 mt-0.5 font-medium line-clamp-1 max-w-[200px] sm:max-w-md">
                            {order.items.map(item => item.product.name).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Side Details */}
                    <div className="flex flex-row md:flex-col justify-between md:justify-center md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-cream/50 flex-shrink-0">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-dark-brown/40 uppercase font-bold tracking-wider block">Total Amount</span>
                        <span className="font-serif text-sm sm:text-base font-bold text-maroon mt-0.5 block">
                          ₹{order.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          order.orderStatus === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-150'
                            : order.orderStatus === 'Cancelled'
                            ? 'bg-red-50 text-red-800 border-red-150'
                            : 'bg-green-50 text-green-800 border-green-150'
                        }`}>
                          {order.orderStatus}
                        </span>

                        <button
                          onClick={() => setSelectedOrderId(order.orderId)}
                          className="px-4 py-2 bg-white border border-[#C9A45C]/35 hover:border-maroon hover:bg-maroon hover:text-white text-maroon rounded-xl font-serif text-xs font-bold tracking-wider uppercase transition-all shadow-sm cursor-pointer"
                        >
                          View Order
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-[#0c0a09]/60 backdrop-blur-sm z-55 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FFF9F0] border border-[#C9A45C]/30 max-w-sm w-full rounded-2xl p-6 shadow-2xl relative animate-scaleIn space-y-5">
            {cancelStatus === 'idle' && (
              <>
                <div className="flex items-center gap-3 border-b border-cream pb-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-dark-brown">
                      {cancelType === 'item' ? 'Cancel Item' : 'Cancel Order'}
                    </h3>
                    <p className="text-[9px] text-dark-brown/40 font-bold uppercase tracking-wider mt-0.5">Order ID: {orderToCancel}</p>
                  </div>
                </div>
                
                <p className="text-xs text-dark-brown/70 leading-relaxed font-medium">
                  {cancelType === 'item' ? (
                    <>Are you sure you want to cancel <strong className="text-maroon font-bold font-serif">{targetItemName}</strong> from this order? The order total will be updated automatically.</>
                  ) : (
                    <>Are you sure you want to cancel this entire order? This action cannot be undone, and your reserved premium items will be returned to store inventory.</>
                  )}
                </p>
                
                <div className="flex justify-end gap-2.5 pt-1">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setOrderToCancel(null);
                      setItemToCancel(null);
                    }}
                    disabled={isCancelling}
                    className="px-3.5 py-2 border border-cream text-dark-brown/60 hover:bg-cream/15 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Keep
                  </button>
                  <button
                    onClick={confirmCancelOrderAction}
                    disabled={isCancelling}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-serif font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {isCancelling ? 'Cancelling...' : (cancelType === 'item' ? 'Cancel Item' : 'Cancel Order')}
                  </button>
                </div>
              </>
            )}

            {cancelStatus === 'success' && (
              <>
                <div className="flex flex-col items-center text-center py-3 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 shadow-inner">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-dark-brown">
                      {cancelType === 'item' ? 'Item Cancelled' : 'Order Cancelled'}
                    </h3>
                    <p className="text-[9px] text-dark-brown/40 font-bold uppercase tracking-wider mt-0.5">Order ID: {orderToCancel}</p>
                  </div>
                  <p className="text-xs text-dark-brown/70 leading-relaxed font-medium px-2">
                    {cancelType === 'item' ? (
                      <>The saree has been successfully cancelled from your order. The remaining items in your order are active and being processed.</>
                    ) : (
                      <>Your order has been successfully cancelled. If you made any payment, a refund request has been initiated automatically.</>
                    )}
                  </p>
                </div>
                <div className="flex justify-center border-t border-cream/50 pt-4">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setOrderToCancel(null);
                      setItemToCancel(null);
                      setCancelStatus('idle');
                      setSelectedOrderId(null); // Return to orders list since order is changed
                    }}
                    className="w-full max-w-[120px] py-2 bg-maroon text-ivory rounded-xl text-[11px] font-serif font-bold uppercase tracking-wider hover:bg-maroon-dark transition-colors cursor-pointer shadow-sm text-center"
                  >
                    Close
                  </button>
                </div>
              </>
            )}

            {cancelStatus === 'error' && (
              <>
                <div className="flex flex-col items-center text-center py-3 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 shadow-inner">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-dark-brown">Cancellation Failed</h3>
                    <p className="text-[9px] text-dark-brown/40 font-bold uppercase tracking-wider mt-0.5">Order ID: {orderToCancel}</p>
                  </div>
                  <p className="text-xs text-dark-brown/70 leading-relaxed font-medium px-2">
                    We could not process your cancellation at this time. Please check your network connection or contact customer support.
                  </p>
                </div>
                <div className="flex justify-center border-t border-cream/50 pt-4">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setOrderToCancel(null);
                      setItemToCancel(null);
                      setCancelStatus('idle');
                    }}
                    className="w-full max-w-[120px] py-2 bg-dark-brown text-white rounded-xl text-[11px] font-serif font-bold uppercase tracking-wider hover:bg-dark-brown/90 transition-colors cursor-pointer shadow-sm text-center"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
