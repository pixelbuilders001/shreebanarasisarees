"use client";

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore, Order } from '../../context/StoreContext';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Zap,
  Truck,
  Package,
  Phone,
  MessageCircle,
  MapPin,
  Download,
  Check,
  Star,
  AlertTriangle,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../data/supabase';
import { OrdersTabSkeleton } from '../../components/TabSkeletons';
import { useIsPwaInstalled, markPwaAsInstalled } from '@/lib/pwaUtils';

// Format date into "Today, 6:12 pm" or "12 Feb 2026"
function formatOrderDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    const timeStr = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `Today, ${timeStr}`;
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Map order status to badge styling matching Image 1
function getStatusBadge(status: string) {
  const s = status?.toLowerCase() || '';
  if (s.includes('out') || s.includes('transit')) {
    return {
      label: 'Out for delivery',
      className: 'bg-[#6B1725] text-white'
    };
  }
  if (s.includes('pack')) {
    return {
      label: 'Packed',
      className: 'bg-[#FAF2ED] text-[#6B1725] border border-[#F0DCD0]'
    };
  }
  if (s.includes('ship') || s.includes('dispatch')) {
    return {
      label: 'Dispatched',
      className: 'bg-[#F0F7FF] text-[#1D4ED8] border border-[#BFDBFE]'
    };
  }
  if (s.includes('confirm') || s.includes('placed') || s.includes('order') || s.includes('process')) {
    return {
      label: 'Confirmed',
      className: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
    };
  }
  if (s.includes('deliver')) {
    return {
      label: 'Delivered',
      className: 'bg-[#F5EFEB] text-[#44403C]'
    };
  }
  if (s.includes('return')) {
    return {
      label: 'Returned',
      className: 'bg-[#F5EFEB] text-[#57534E]'
    };
  }
  if (s.includes('cancel')) {
    return {
      label: 'Cancelled',
      className: 'bg-[#FDF2F2] text-[#991B1B] border border-[#FECDCD]'
    };
  }
  return {
    label: status || 'Order Placed',
    className: 'bg-[#F5EFEB] text-[#57534E]'
  };
}

// Delivery estimate helper matching Image 1
function getDeliveryEstimate(order: Order): {
  type: 'express' | 'standard' | 'return' | 'refund' | 'cancelled';
  label: string;
} {
  const s = order.orderStatus?.toLowerCase() || '';
  const isSamastipur = order.customer?.pinCode === '848101' || order.customer?.pinCode === '848114';

  if (s.includes('cancel')) {
    return { type: 'cancelled', label: 'Order cancelled' };
  }
  if (s.includes('return')) {
    const methodStr = order.paymentMethod === 'Cash on Delivery' ? 'Cash on delivery' : (order.paymentMethod || 'UPI');
    return { type: 'refund', label: `${methodStr} · refunded` };
  }
  if (s.includes('deliver')) {
    const orderDate = new Date(order.createdAt);
    const returnDate = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const returnStr = !isNaN(returnDate.getTime())
      ? returnDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : '7 days';
    return { type: 'return', label: `Return window closes ${returnStr}` };
  }
  if (s.includes('out') || s.includes('transit')) {
    return {
      type: 'express',
      label: isSamastipur ? 'Arriving by 6:45 pm' : 'Arriving today'
    };
  }
  if (s.includes('pack') || s.includes('ship') || s.includes('confirm') || s.includes('placed')) {
    const orderDate = new Date(order.createdAt);
    const fromDate = new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const toDate = new Date(orderDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    const fromStr = !isNaN(fromDate.getTime()) ? fromDate.toLocaleDateString('en-IN', { day: 'numeric' }) : '3';
    const toStr = !isNaN(toDate.getTime()) ? toDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '5 days';
    return { type: 'standard', label: `Arriving ${fromStr}–${toStr}` };
  }

  return { type: 'standard', label: 'In transit' };
}

// Stepper card uppercase headline matching Image 3
function getStatusHeadline(status: string): string {
  const s = status?.toLowerCase() || '';
  if (s.includes('out') || s.includes('transit')) return 'OUT FOR DELIVERY';
  if (s.includes('pack')) return 'PACKED AT THE SHOP';
  if (s.includes('ship')) return 'DISPATCHED & IN TRANSIT';
  if (s.includes('deliver')) return 'DELIVERED TO YOUR DOORSTEP';
  if (s.includes('return')) return 'RETURN COMPLETED';
  if (s.includes('cancel')) return 'ORDER CANCELLED';
  return 'ORDER PLACED';
}

interface ResolvedOrderItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

// Safely extract item title, image, and price across all possible order item formats
function resolveOrderItem(item: any, products: any[] = []): ResolvedOrderItem {
  if (!item) {
    return {
      id: '',
      sku: 'SBS-SAREE',
      name: 'Pure Silk Banarasi Saree',
      price: 0,
      quantity: 1,
      image: null
    };
  }

  // 1. Unpack product if string
  let prod = item.product;
  if (typeof prod === 'string') {
    try { prod = JSON.parse(prod); } catch (e) { prod = null; }
  }
  let snap = item.product_snapshot;
  if (typeof snap === 'string') {
    try { snap = JSON.parse(snap); } catch (e) { snap = null; }
  }

  // 2. Identify ID and SKU
  const id = prod?.id || item?.inventory_id || item?.productId || item?.id || snap?.id || '';
  const sku = prod?.sku || item?.sku || snap?.sku || '';

  // 3. Find matched product in store catalog
  const matched = Array.isArray(products) ? products.find(p => 
    (id && (p.id === id || p.slug === id)) ||
    (sku && p.sku === sku)
  ) : null;

  // 4. Resolve name
  const name = 
    prod?.name || 
    prod?.saree_name || 
    item?.product_name || 
    item?.saree_name || 
    item?.name || 
    snap?.name || 
    snap?.saree_name || 
    matched?.name || 
    'Pure Silk Banarasi Saree';

  // 5. Resolve price
  const price = Number(
    prod?.salePrice ?? prod?.price ?? 
    item?.unit_price ?? item?.price ?? 
    snap?.salePrice ?? snap?.price ?? 
    matched?.salePrice ?? matched?.price ?? 0
  );

  // 6. Resolve image
  const isValidImg = (img?: string | null): boolean => 
    Boolean(
      img && 
      typeof img === 'string' && 
      img.trim().length > 0 && 
      !img.includes('NO_IMAGE_AVAILABLE')
    );

  const candidateImages: (string | null | undefined)[] = [
    ...(Array.isArray(prod?.images) ? prod.images : []),
    prod?.image,
    prod?.image_url,
    prod?.imageUrl,
    ...(Array.isArray(snap?.images) ? snap.images : []),
    snap?.image,
    snap?.image_url,
    item?.image,
    item?.image_url,
    ...(Array.isArray(item?.images) ? item.images : []),
    ...(Array.isArray(matched?.images) ? matched.images : [])
  ];

  let image = candidateImages.find(isValidImg) || null;

  // If still no image, try finding matched product by name in store catalog
  if (!image && name && Array.isArray(products) && products.length > 0) {
    const matchedByName = products.find(p => 
      p.name?.toLowerCase().includes(name.toLowerCase()) || 
      name.toLowerCase().includes(p.name?.toLowerCase())
    );
    if (matchedByName?.images?.length) {
      image = matchedByName.images.find(isValidImg) || matchedByName.images[0] || null;
    }
  }

  // Fallback to first available real saree image in catalog so card is never blank
  if (!image && Array.isArray(products) && products.length > 0) {
    for (const p of products) {
      const real = p.images?.find(isValidImg);
      if (real) {
        image = real;
        break;
      }
    }
  }

  return {
    id: id || sku || 'item',
    sku: sku || (id ? id.slice(0, 6).toUpperCase() : 'SBS-SAREE'),
    name,
    price,
    quantity: Number(item?.quantity || 1),
    image
  };
}

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    orders,
    products,
    cancelOrder,
    cancelOrderItem,
    isHydrated
  } = useStore();

  const [activeFilter, setActiveFilter] = useState<'All' | 'In transit' | 'Delivered' | 'Returned'>('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderItemsDetails, setOrderItemsDetails] = useState<any[] | null>(null);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);
  const [standaloneOrder, setStandaloneOrder] = useState<Order | null>(null);

  // Sync with searchParams if someone navigates with ?orderId=...
  useEffect(() => {
    const paramOrderId = searchParams.get('orderId');
    if (paramOrderId) {
      setSelectedOrderId(paramOrderId);
    }
  }, [searchParams]);

  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [itemToCancel, setItemToCancel] = useState<string | null>(null);
  const [cancelType, setCancelType] = useState<'order' | 'item'>('order');
  const [cancelStatus, setCancelStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // PWA install state
  const isPwaInstalled = useIsPwaInstalled();

  const handlePwaInstall = async () => {
    const promptEvent = typeof window !== 'undefined' ? (window as any).deferredPwaPrompt : null;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          (window as any).deferredPwaPrompt = null;
          markPwaAsInstalled();
        }
      } catch (err) {
        console.error('PWA install error:', err);
      }
    } else {
      alert('To install our app:\n1. Tap the Share icon in your browser\n2. Select "Add to Home Screen"');
    }
  };

  // Review states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<{ id: string; name: string; images: string[] } | null>(null);
  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formText, setFormText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleWriteReview = (product: { id: string; name: string; images: string[] }) => {
    setReviewProduct(product);
    setFormRating(0);
    setFormTitle('');
    setFormText('');
    setFormError(null);
    setFormSuccess(null);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewProduct) return;

    if (formRating < 1 || formRating > 5) {
      setFormError("Please select a rating between 1 and 5 stars.");
      return;
    }
    if (!formTitle.trim()) {
      setFormError("Please enter a review title.");
      return;
    }
    if (!formText.trim()) {
      setFormError("Please write your review details.");
      return;
    }

    setSubmittingReview(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzqlsawxvvyvsstyzzff.supabase.co'}/functions/v1/verify-review`, {
        method: 'POST',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: reviewProduct.id,
          rating: formRating,
          title: formTitle.trim(),
          review_text: formText.trim()
        })
      });

      const resData = await response.json().catch(() => ({}));

      if (response.status === 201) {
        setFormSuccess("Thank you! Your review has been submitted successfully and is pending approval.");
        setFormRating(0);
        setFormTitle('');
        setFormText('');
        setTimeout(() => {
          setIsReviewModalOpen(false);
          setReviewProduct(null);
          setFormSuccess(null);
        }, 3000);
      } else {
        if (response.status === 401) {
          setFormError("Please log in to submit a review.");
        } else if (response.status === 403) {
          setFormError("Only verified purchasers can review this product.");
        } else if (response.status === 409) {
          setFormError("You have already reviewed this product.");
        } else {
          setFormError(resData.message || resData.error || "An error occurred while submitting your review.");
        }
      }
    } catch (err: any) {
      console.error('Submit review error:', err);
      setFormError("Network error. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Get active order details if one is selected
  const activeOrder = orders.find(o => o.orderId === selectedOrderId || o.id === selectedOrderId) || standaloneOrder;
  const historyList = activeOrder?.statusHistory || [];

  // If activeOrder is not in `orders` array, fetch it directly
  useEffect(() => {
    if (!selectedOrderId) {
      setStandaloneOrder(null);
      return;
    }

    const inList = orders.find(o => o.orderId === selectedOrderId || o.id === selectedOrderId);
    if (inList) {
      setStandaloneOrder(null);
      return;
    }

    let isMounted = true;
    async function fetchStandaloneOrder() {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedOrderId!);
        let query = supabase.from('orders').select('*');
        if (isUuid) {
          query = query.eq('id', selectedOrderId);
        } else {
          query = query.eq('order_number', selectedOrderId);
        }
        const { data: orderRow } = await query.maybeSingle();
        if (orderRow && isMounted) {
          const { data: historyData } = await supabase
            .from('order_status_history')
            .select('*')
            .eq('order_id', orderRow.id)
            .order('created_at', { ascending: true });

          const statusHistory = (historyData || []).map((h: any) => ({
            id: h.id,
            orderId: h.order_id,
            status: h.status,
            note: h.note,
            createdAt: h.created_at
          }));

          let orderStatus: Order['orderStatus'] = 'Order Placed';
          if (orderRow.order_status === 'confirmed' || orderRow.order_status === 'processing') orderStatus = 'Confirmed';
          else if (orderRow.order_status === 'packed') orderStatus = 'Packed';
          else if (orderRow.order_status === 'shipped') orderStatus = 'Shipped';
          else if (orderRow.order_status === 'out_for_delivery') orderStatus = 'Out for Delivery';
          else if (orderRow.order_status === 'delivered') orderStatus = 'Delivered';
          else if (orderRow.order_status === 'cancelled') orderStatus = 'Cancelled';

          setStandaloneOrder({
            id: orderRow.id,
            orderId: orderRow.order_number,
            customer: {
              name: orderRow.customer_name || (orderRow.shipping_address as any)?.name || '',
              phone: orderRow.customer_phone || (orderRow.shipping_address as any)?.phone || '',
              email: orderRow.customer_email || (orderRow.shipping_address as any)?.email || '',
              address: (orderRow.shipping_address as any)?.address || '',
              city: (orderRow.shipping_address as any)?.city || '',
              state: (orderRow.shipping_address as any)?.state || '',
              pinCode: (orderRow.shipping_address as any)?.pinCode || (orderRow.shipping_address as any)?.pincode || '',
              deliveryMethod: (orderRow.shipping_address as any)?.deliveryMethod || 'Home Delivery'
            },
            items: [],
            subtotal: Number(orderRow.subtotal || 0),
            discount: Number(orderRow.discount || 0),
            shipping: Number(orderRow.shipping_fee || 0),
            total: Number(orderRow.total_amount || 0),
            paymentMethod: orderRow.payment_method === 'cod' ? 'Cash on Delivery' : (orderRow.payment_method || 'Online Payment'),
            paymentStatus: orderRow.payment_status === 'paid' ? 'Paid' : 'Pending',
            orderStatus,
            createdAt: orderRow.created_at,
            statusHistory,
            is_gift: orderRow.is_gift,
            gift_recipient_name: orderRow.gift_recipient_name,
            gift_message: orderRow.gift_message,
            gift_wrap_charge: orderRow.gift_wrap_charge
          });
        }
      } catch (e) {
        console.error('Error fetching standalone order:', e);
      }
    }

    fetchStandaloneOrder();
    return () => { isMounted = false; };
  }, [selectedOrderId, orders]);

  // Fetch detailed order items using Supabase order_items query
  useEffect(() => {
    if (!selectedOrderId) {
      setOrderItemsDetails(null);
      return;
    }

    let isMounted = true;
    async function loadOrderItems() {
      setLoadingOrderItems(true);
      try {
        let orderId = activeOrder?.id;

        // If UUID is not directly on activeOrder, determine UUID or check if selectedOrderId is UUID
        if (!orderId) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedOrderId!);
          if (isUuid) {
            orderId = selectedOrderId!;
          } else {
            const { data: orderRow } = await supabase
              .from('orders')
              .select('id')
              .eq('order_number', selectedOrderId!)
              .maybeSingle();
            orderId = orderRow?.id || selectedOrderId!;
          }
        }

        const { data, error } = await supabase
          .from("order_items")
          .select(`
            id,
            order_id,
            inventory_id,
            product_name,
            sku,
            barcode,
            quantity,
            unit_price,
            total_price,
            product_snapshot
          `)
          .eq("order_id", orderId);

        if (error) {
          console.error("Error fetching order items:", error);
        } else if (isMounted && data) {
          setOrderItemsDetails(data);
        }
      } catch (err) {
        console.error("Exception fetching order items:", err);
      } finally {
        if (isMounted) {
          setLoadingOrderItems(false);
        }
      }
    }

    loadOrderItems();

    return () => {
      isMounted = false;
    };
  }, [selectedOrderId, activeOrder?.id]);

  const displayItems = (orderItemsDetails && orderItemsDetails.length > 0)
    ? orderItemsDetails
    : (activeOrder?.items || []);

  const handleCancelOrder = async (productId?: string) => {
    if (!activeOrder) return;
    setOrderToCancel(activeOrder.orderId);

    if (productId && displayItems.length > 1) {
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
          if (orderItemsDetails) {
            setOrderItemsDetails(prev => prev ? prev.filter(i => (i.inventory_id !== itemToCancel && i.id !== itemToCancel)) : null);
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

  const targetItemObj = displayItems.find(item => {
    const res = resolveOrderItem(item, products);
    return res.id === itemToCancel || (item as any)?.product?.id === itemToCancel || (item as any)?.inventory_id === itemToCancel;
  });
  const targetItemName = targetItemObj ? resolveOrderItem(targetItemObj, products).name : '';

  const isCancellable = activeOrder &&
    activeOrder.orderStatus !== 'Out for Delivery' &&
    activeOrder.orderStatus !== 'Delivered' &&
    activeOrder.orderStatus !== 'Cancelled';

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (activeFilter === 'In transit') {
      return orders.filter(o => {
        const s = o.orderStatus?.toLowerCase() || '';
        return (
          s.includes('placed') ||
          s.includes('order') ||
          s.includes('confirm') ||
          s.includes('pack') ||
          s.includes('ship') ||
          s.includes('out') ||
          s.includes('transit')
        );
      });
    }
    if (activeFilter === 'Delivered') {
      return orders.filter(o => o.orderStatus?.toLowerCase().includes('deliver'));
    }
    if (activeFilter === 'Returned') {
      return orders.filter(o => {
        const s = o.orderStatus?.toLowerCase() || '';
        return s.includes('return') || s.includes('cancel');
      });
    }
    return orders; // 'All'
  }, [orders, activeFilter]);

  if (!isHydrated) {
    return <OrdersTabSkeleton />;
  }

  // ═════════════════════════════════════════════════════════════════
  // VIEW A: ORDER DETAILS VIEW (Matches Image 3)
  // ═════════════════════════════════════════════════════════════════
  if (selectedOrderId && activeOrder) {
    const isOutOfDelivery = activeOrder.orderStatus?.toLowerCase().includes('out') || activeOrder.orderStatus?.toLowerCase().includes('transit');
    const isDelivered = activeOrder.orderStatus?.toLowerCase().includes('deliver');
    const isSamastipur = activeOrder.customer?.pinCode === '848101' || activeOrder.customer?.pinCode === '848114';

    // Stepper steps
    const s = activeOrder.orderStatus?.toLowerCase() || '';
    const isPlaced = true;
    const isPacked = s.includes('pack') || s.includes('ship') || s.includes('out') || s.includes('deliver');
    const isOut = s.includes('out') || s.includes('deliver');
    const isDeliv = s.includes('deliver');

    const timelineSteps = [
      {
        title: 'Order placed',
        subtitle: formatOrderDate(activeOrder.createdAt),
        completed: isPlaced
      },
      {
        title: 'Packed at the shop',
        subtitle: 'Checked by Rakesh ji',
        completed: isPacked
      },
      {
        title: 'Out for delivery',
        subtitle: isSamastipur ? 'Ramesh is on the way' : 'Dispatched with priority tracking',
        completed: isOut
      },
      {
        title: 'Delivered',
        subtitle: isDeliv ? 'Hand delivered to your doorstep' : (isSamastipur ? 'Arriving by 6:45 pm' : 'Expected in 3–5 days'),
        completed: isDeliv
      }
    ];

    const activeStepIndex = isDeliv ? 3 : isOut ? 2 : isPacked ? 1 : 0;

    return (
      <div className="w-full space-y-4 animate-fadeIn min-w-0">
        {/* Section Header with Back Navigation (Matching other tab pages) */}
        <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E7DFC9] shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                setSelectedOrderId(null);
                if (searchParams.get('orderId')) router.replace('/account');
              }}
              className="p-1 -ml-1 text-[#1C1917] hover:text-[#6B1725] transition-colors cursor-pointer shrink-0"
              aria-label="Back to orders"
            >
              <ChevronLeft size={20} className="stroke-[2]" />
            </button>
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#1C1917] flex items-center gap-2 truncate">
              <ShoppingBag size={18} className="text-[#6B1725] shrink-0" />
              <span className="truncate">Order #{activeOrder.orderId}</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedOrderId(null);
              if (searchParams.get('orderId')) router.replace('/account');
            }}
            className="text-xs font-semibold text-[#6B1725] hover:text-[#4E0E1A] bg-[#FAF8F5] hover:bg-white border border-[#E5DEC9] px-3 py-1.5 rounded-lg transition-all cursor-pointer font-sans shadow-2xs shrink-0"
          >
            All Orders
          </button>
        </div>

        {/* 1. Live Tracking Highlight Box */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#6B1725] shadow-xs space-y-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-[#6B1725] stroke-[2] shrink-0" />
              <span className="font-bold text-sm sm:text-base text-[#1C1917] font-sans">
                {isOutOfDelivery
                  ? (isSamastipur ? 'Arriving by 6:45 pm' : 'Arriving today')
                  : isDelivered
                    ? `Delivered on ${formatOrderDate(activeOrder.createdAt)}`
                    : 'Dispatched from Varanasi'}
              </span>
            </div>
            <p className="text-xs text-[#57534E] font-sans pl-6">
              {isOutOfDelivery
                ? (isSamastipur ? 'Ramesh is 6 minutes away · 20-min hand delivery' : 'Priority courier partner is on the way')
                : isDelivered
                  ? 'Hand delivered to your doorstep with Silk Mark guarantee'
                  : 'Checked by master weavers and safely packed in authentic fabric pouch'}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <a
              href="tel:+916203909946"
              className="flex-1 py-2.5 px-4 border border-[#6B1725] text-[#6B1725] hover:bg-[#6B1725]/5 rounded-full font-sans font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Phone size={14} />
              <span>Call</span>
            </a>
            <a
              href={`https://wa.me/+916203909946?text=${encodeURIComponent(`Hi Shree Banarasi Sarees, I am inquiring about my order ${activeOrder.orderId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 bg-[#6B1725] hover:bg-[#54121D] text-white rounded-full font-sans font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <MessageCircle size={14} />
              <span>Message</span>
            </a>
          </div>
        </div>

        {/* 2. OUT FOR DELIVERY Stepper Timeline Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-4">
          <h3 className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider font-sans">
            {getStatusHeadline(activeOrder.orderStatus)}
          </h3>

          <div className="space-y-4 relative pl-1">
            {timelineSteps.map((step, idx) => {
              const isActiveStep = idx === activeStepIndex;
              return (
                <div key={step.title} className="flex items-start gap-3.5 relative">
                  {idx < timelineSteps.length - 1 && (
                    <div
                      className={`absolute left-[9px] top-5 bottom-[-18px] w-[2px] ${
                        idx < activeStepIndex ? 'bg-[#6B1725]' : 'bg-[#E7DFC9]'
                      }`}
                    />
                  )}

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                      step.completed
                        ? 'bg-[#6B1725] text-white shadow-2xs'
                        : 'border border-[#D4C39D] bg-[#FAF8F5]'
                    }`}
                  >
                    {step.completed && <Check size={11} className="stroke-[3]" />}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <span className={`text-xs font-semibold font-sans block ${
                      isActiveStep
                        ? 'text-[#6B1725]'
                        : step.completed
                          ? 'text-[#1C1917]'
                          : 'text-[#78716C]'
                    }`}>
                      {step.title}
                    </span>
                    <p className="text-[11px] text-[#78716C] font-sans mt-0.5">
                      {step.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. ITEMS CARD */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider font-sans">
              {displayItems.length} {displayItems.length === 1 ? 'SAREE' : 'SAREES'}
            </h3>
            {loadingOrderItems && (
              <span className="text-[11px] text-[#B08A3C] font-sans animate-pulse">
                Updating details...
              </span>
            )}
          </div>

          <div className="divide-y divide-[#F3ECE0]">
            {displayItems.map((item, idx) => {
              const resolved = resolveOrderItem(item, products);
              const barcode = item.barcode || (item.product_snapshot as any)?.barcode;
              const unitPrice = item.unit_price != null ? Number(item.unit_price) : resolved.price;
              const totalPrice = item.total_price != null ? Number(item.total_price) : (unitPrice * resolved.quantity);

              return (
                <div key={item.id || resolved.id || idx} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {resolved.image ? (
                      <img
                        src={resolved.image}
                        alt={resolved.name}
                        className="w-16 h-20 object-cover rounded-xl border border-[#E7DFC9] bg-[#FAF8F5] shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-20 rounded-xl border border-[#E7DFC9] bg-[#FAF8F5] flex items-center justify-center text-[#B08A3C] shrink-0">
                        <Package size={22} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#1C1917] leading-snug line-clamp-2">
                        {resolved.name}
                      </h4>
                      <p className="text-xs text-[#78716C] font-sans mt-1">
                        {resolved.sku} · Qty {resolved.quantity}
                      </p>
                      {barcode && (
                        <p className="text-[11px] text-[#78716C] font-mono mt-0.5">
                          Barcode: {barcode}
                        </p>
                      )}

                      {/* Actions for individual item */}
                      <div className="flex items-center gap-3 mt-2">
                        {isDelivered && (
                          <button
                            type="button"
                            onClick={() => handleWriteReview({ id: resolved.id, name: resolved.name, images: resolved.image ? [resolved.image] : [] })}
                            className="text-[11px] font-semibold text-[#6B1725] hover:underline flex items-center gap-1 cursor-pointer font-sans"
                          >
                            <Star size={11} className="text-[#B08A3C] fill-[#B08A3C]" />
                            <span>Write review</span>
                          </button>
                        )}
                        {isCancellable && displayItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(resolved.id)}
                            className="text-[11px] font-semibold text-rose-700 hover:underline cursor-pointer font-sans"
                          >
                            Cancel item
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-xs sm:text-sm text-[#1C1917] font-sans block">
                      ₹{totalPrice.toLocaleString('en-IN')}
                    </span>
                    {resolved.quantity > 1 && (
                      <span className="text-[10px] text-[#78716C] font-sans block">
                        ₹{unitPrice.toLocaleString('en-IN')} each
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. BILL CARD */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-3">
          <h3 className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider font-sans">
            BILL
          </h3>

          <div className="space-y-2 text-xs font-sans">
            <div className="flex items-center justify-between text-[#57534E]">
              <span>Items</span>
              <span className="text-[#1C1917] font-medium">
                ₹{(activeOrder.subtotal || activeOrder.total).toLocaleString('en-IN')}
              </span>
            </div>

            {activeOrder.discount > 0 && (
              <div className="flex items-center justify-between text-emerald-700">
                <span>Discount</span>
                <span>-₹{activeOrder.discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[#57534E]">
              <span>Delivery</span>
              <span className="text-emerald-700 font-medium">Free</span>
            </div>

            <div className="border-t border-[#F3ECE0] pt-2 flex items-center justify-between text-sm font-bold text-[#1C1917]">
              <span>Total</span>
              <span>₹{activeOrder.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="border-t border-[#F3ECE0] pt-3 flex items-center justify-between">
            <Link
              href={`/receipt/${encodeURIComponent(activeOrder.orderId)}`}
              target="_blank"
              className="text-xs font-semibold text-[#B08A3C] hover:text-[#8E6C29] transition-colors flex items-center gap-1.5 cursor-pointer font-sans"
            >
              <Download size={14} />
              <span>Download invoice</span>
            </Link>
            <span className="text-[11px] text-[#78716C] font-sans">
              {activeOrder.paymentMethod}
            </span>
          </div>
        </div>

        {/* 5. DELIVERED TO CARD */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#78716C] uppercase tracking-wider font-sans">
            <MapPin size={13} className="text-[#B08A3C]" />
            <span>DELIVERED TO</span>
          </div>
          <p className="text-xs sm:text-sm text-[#1C1917] font-sans leading-relaxed">
            {activeOrder.customer.address}, {activeOrder.customer.city} {activeOrder.customer.pinCode}
          </p>
        </div>

        {/* 6. NEED HELP WITH THIS ORDER BUTTON */}
        <a
          href={`https://wa.me/+916203909946?text=${encodeURIComponent(`Hi Shree Banarasi Sarees, I need help with my order ${activeOrder.orderId}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-[#E7DFC9] bg-[#FAF8F5] hover:bg-[#F3ECE0] text-[#1C1917] py-3.5 px-4 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 w-full transition-colors cursor-pointer shadow-2xs font-sans"
        >
          <MessageCircle size={16} className="text-[#1C1917]" />
          <span>Need help with this order</span>
        </a>

        {/* 7. CANCEL ENTIRE ORDER BUTTON (If Cancellable) */}
        {isCancellable && (
          <div className="text-center pt-1 pb-2">
            <button
              type="button"
              onClick={() => handleCancelOrder()}
              className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline cursor-pointer font-sans"
            >
              Cancel this entire order
            </button>
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // VIEW B: ORDER LIST VIEW (Matches Image 1 & Image 2)
  // ═════════════════════════════════════════════════════════════════
  const filterOptions: Array<'All' | 'In transit' | 'Delivered' | 'Returned'> = [
    'All',
    'In transit',
    'Delivered',
    'Returned'
  ];

  return (
    <div className="w-full space-y-4 animate-fadeIn min-w-0">
      {/* Section Header (Matching other tab pages) */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E7DFC9] shadow-2xs">
        <h2 className="font-serif text-base sm:text-lg font-bold text-[#1C1917] flex items-center gap-2">
          <ShoppingBag size={18} className="text-[#6B1725]" />
          <span>My Orders ({orders.length})</span>
        </h2>
        {orders.length > 0 && (
          <Link
            href="/sarees"
            className="text-xs font-semibold text-[#6B1725] hover:text-[#4E0E1A] bg-[#FAF8F5] hover:bg-white border border-[#E5DEC9] px-3 py-1.5 rounded-lg transition-all cursor-pointer font-sans shadow-2xs"
          >
            Browse Sarees
          </Link>
        )}
      </div>

      {/* 2. Filter Pills (All, In transit, Delivered, Returned) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {filterOptions.map((filter) => {
          const isSelected = activeFilter === filter;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-4 sm:px-5 py-2 rounded-full font-sans text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#6B1725] text-[#FAF7F0] shadow-2xs'
                  : 'bg-[#FAF8F5] text-[#1C1917] border border-[#E7DFC9] hover:bg-[#F3ECE0]'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* 3. Empty State (Image 2) */}
      {filteredOrders.length === 0 ? (
        <div className="bg-transparent flex flex-col items-center justify-center min-h-[55vh] py-12 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-full border border-[#D4C39D] bg-transparent flex items-center justify-center mx-auto mb-5 shrink-0">
            <Package size={26} className="text-[#A17A32] stroke-[1.5]" />
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl text-[#1C1917] font-normal tracking-tight mb-2.5 text-center">
            No orders here yet
          </h3>

          <p className="font-sans text-xs sm:text-sm text-[#57534E] max-w-[280px] mx-auto text-center leading-relaxed font-normal mb-7">
            When you order, this is where you&apos;ll track the rider &mdash; and where you start a return.
          </p>

          <Link
            href="/sarees"
            className="py-3 px-8 bg-[#6B1725] hover:bg-[#52111C] text-white rounded-full font-sans font-medium text-sm transition-all active:scale-95 shadow-xs inline-block text-center cursor-pointer"
          >
            Browse sarees
          </Link>
        </div>
      ) : (
        /* 4. Order List Cards (Image 1) */
        <div className="space-y-3.5 animate-fadeIn">
          {filteredOrders.map((order) => {
            const firstItem = order.items?.[0];
            const resolvedFirstItem = firstItem ? resolveOrderItem(firstItem, products) : null;
            const badge = getStatusBadge(order.orderStatus);
            const estimate = getDeliveryEstimate(order);
            const formattedDate = formatOrderDate(order.createdAt);
            const isOutOfDelivery = order.orderStatus?.toLowerCase().includes('out') || order.orderStatus?.toLowerCase().includes('transit');

            return (
              <div
                key={order.orderId}
                onClick={() => setSelectedOrderId(order.orderId)}
                className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all cursor-pointer shadow-2xs hover:shadow-xs space-y-3 border ${
                  isOutOfDelivery ? 'border-[#6B1725]' : 'border-[#E7DFC9]'
                }`}
              >
                {/* Top Row: Status Badge + Date */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold font-sans shrink-0 ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs text-[#78716C] font-sans">
                    {formattedDate}
                  </span>
                </div>

                {/* Content Row: Thumbnail + Saree Info + Chevron */}
                <div className="flex items-start gap-3.5">
                  {resolvedFirstItem?.image ? (
                    <img
                      src={resolvedFirstItem.image}
                      alt={resolvedFirstItem.name || 'Saree'}
                      className="w-16 h-20 sm:w-18 sm:h-22 object-cover rounded-xl border border-[#E7DFC9] bg-[#FAF8F5] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-20 sm:w-18 sm:h-22 rounded-xl border border-[#E7DFC9] bg-[#FAF8F5] flex items-center justify-center text-[#B08A3C] shrink-0">
                      <Package size={22} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 pr-1">
                    <h3 className="font-serif font-bold text-sm sm:text-base text-[#1C1917] leading-snug truncate">
                      {resolvedFirstItem?.name || 'Pure Silk Banarasi Saree'}
                      {order.items?.length > 1 && (
                        <span className="text-xs font-sans font-normal text-[#78716C] ml-1.5">
                          +{order.items.length - 1} more
                        </span>
                      )}
                    </h3>

                    <p className="text-xs text-[#78716C] font-sans mt-1 truncate">
                      <span>{order.orderId}</span>
                      <span className="mx-1.5">·</span>
                      <span>₹{order.total.toLocaleString('en-IN')}</span>
                      <span className="mx-1.5">·</span>
                      <span>{order.paymentMethod === 'Cash on Delivery' ? 'Cash on delivery' : (order.paymentMethod || 'UPI')}</span>
                      {order.orderStatus?.toLowerCase().includes('return') && (
                        <>
                          <span className="mx-1.5">·</span>
                          <span>refunded</span>
                        </>
                      )}
                    </p>

                    {/* Estimate Line */}
                    {estimate.type === 'express' && (
                      <p className="text-[#6B1725] font-semibold text-xs flex items-center gap-1.5 mt-2 font-sans">
                        <Zap size={13} className="text-[#6B1725] stroke-[2] shrink-0" />
                        <span>{estimate.label}</span>
                      </p>
                    )}
                    {estimate.type === 'standard' && (
                      <p className="text-[#6B1725] font-semibold text-xs flex items-center gap-1.5 mt-2 font-sans">
                        <Truck size={14} className="text-[#6B1725] stroke-[2] shrink-0" />
                        <span>{estimate.label}</span>
                      </p>
                    )}
                    {estimate.type === 'return' && (
                      <p className="text-xs text-[#78716C] font-sans mt-2">
                        {estimate.label}
                      </p>
                    )}
                    {estimate.type === 'cancelled' && (
                      <p className="text-xs text-rose-700 font-sans mt-2">
                        Order cancelled
                      </p>
                    )}
                  </div>

                  <div className="self-center pl-1 shrink-0 text-[#A8A29E]">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-[#0c0a09]/65 backdrop-blur-xs z-55 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FFF9F0] border border-[#B08A3C]/30 max-w-sm w-full rounded-3xl p-6 shadow-2xl relative animate-scaleIn space-y-5">
            {cancelStatus === 'idle' && (
              <>
                <div className="flex items-center gap-3 border-b border-[#F3ECE0] pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-sm font-bold text-dark-brown">
                      {cancelType === 'item' ? 'Cancel Saree' : 'Cancel Order'}
                    </h3>
                    <p className="text-[9px] text-dark-brown/45 font-mono font-bold uppercase tracking-wider mt-0.5 truncate">
                      ID: {orderToCancel}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-dark-brown/70 leading-relaxed font-sans font-medium">
                  {cancelType === 'item' ? (
                    <>Are you sure you want to cancel <strong className="text-maroon font-bold font-serif">{targetItemName}</strong> from this order? The total will adjust automatically.</>
                  ) : (
                    <>Are you sure you want to cancel this entire order? Reserved handloom pieces will be returned to inventory.</>
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
                    className="px-3.5 py-2 border border-[#F3ECE0] text-dark-brown/70 hover:bg-cream/20 rounded-xl text-[11px] font-serif font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Keep
                  </button>
                  <button
                    onClick={confirmCancelOrderAction}
                    disabled={isCancelling}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-serif font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isCancelling ? 'Cancelling...' : (cancelType === 'item' ? 'Cancel Item' : 'Cancel Order')}
                  </button>
                </div>
              </>
            )}

            {cancelStatus === 'success' && (
              <>
                <div className="flex flex-col items-center text-center py-3 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-dark-brown">
                      {cancelType === 'item' ? 'Item Cancelled' : 'Order Cancelled'}
                    </h3>
                    <p className="text-[9px] text-dark-brown/45 font-mono font-bold uppercase tracking-wider mt-0.5">
                      ID: {orderToCancel}
                    </p>
                  </div>
                  <p className="text-xs text-dark-brown/70 leading-relaxed font-sans font-medium px-2">
                    {cancelType === 'item' ? (
                      <>The saree has been cancelled. Remaining items in your order remain active.</>
                    ) : (
                      <>Your order has been cancelled. If any payment was made, your refund is being processed.</>
                    )}
                  </p>
                </div>
                <div className="flex justify-center border-t border-[#F3ECE0] pt-4">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setOrderToCancel(null);
                      setItemToCancel(null);
                      setCancelStatus('idle');
                      setSelectedOrderId(null);
                    }}
                    className="w-full max-w-[140px] py-2.5 bg-maroon text-[#FAF7F0] rounded-xl text-[11px] font-serif font-bold uppercase tracking-wider hover:bg-maroon-dark transition-colors cursor-pointer shadow-xs text-center"
                  >
                    Close
                  </button>
                </div>
              </>
            )}

            {cancelStatus === 'error' && (
              <>
                <div className="flex flex-col items-center text-center py-3 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-inner">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-dark-brown">Cancellation Failed</h3>
                    <p className="text-[9px] text-dark-brown/45 font-mono font-bold uppercase tracking-wider mt-0.5">
                      ID: {orderToCancel}
                    </p>
                  </div>
                  <p className="text-xs text-dark-brown/70 leading-relaxed font-sans font-medium px-2">
                    Could not complete cancellation at this moment. Please check your connection or contact customer support.
                  </p>
                </div>
                <div className="flex justify-center border-t border-[#F3ECE0] pt-4">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setOrderToCancel(null);
                      setItemToCancel(null);
                      setCancelStatus('idle');
                    }}
                    className="w-full max-w-[140px] py-2.5 bg-dark-brown text-[#FAF7F0] rounded-xl text-[11px] font-serif font-bold uppercase tracking-wider hover:bg-dark-brown/90 transition-colors cursor-pointer shadow-xs text-center"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && reviewProduct && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="absolute inset-0 bg-[#0c0a09]/65 backdrop-blur-xs"
            onClick={() => {
              if (!submittingReview) {
                setIsReviewModalOpen(false);
                setReviewProduct(null);
                setFormError(null);
              }
            }}
          />

          <div className="bg-[#FFF9F0] border border-[#B08A3C]/35 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden z-10 relative animate-scaleIn p-5 sm:p-7 space-y-5">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsReviewModalOpen(false);
                setReviewProduct(null);
                setFormError(null);
              }}
              disabled={submittingReview}
              className="absolute top-4 right-4 z-20 p-1.5 text-dark-brown/65 hover:text-maroon hover:bg-cream/40 rounded-full transition-all disabled:opacity-50 cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Modal Title */}
            <div className="text-center space-y-1">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-dark-brown">
                Write a Review
              </h3>
              <p className="text-xs text-dark-brown/60 font-sans truncate max-w-sm mx-auto">
                Share your experience with {reviewProduct.name}
              </p>
            </div>

            <div className="w-12 h-0.5 bg-gold/40 mx-auto rounded-full"></div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-100 flex items-start gap-2 animate-fadeIn">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-100 flex items-start gap-2 animate-fadeIn">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Star selector */}
              <div className="space-y-1 text-center">
                <label className="text-xs font-bold text-dark-brown/70 uppercase tracking-wider font-serif">Your Rating</label>
                <div className="flex items-center justify-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      disabled={submittingReview}
                      onClick={() => setFormRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-gold transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        size={28}
                        className={((hoverRating || formRating) >= star) ? 'fill-gold text-gold' : 'text-dark-brown/20'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label htmlFor="review-title" className="text-xs font-bold text-dark-brown/70 uppercase tracking-wider font-serif">Review Title</label>
                <input
                  id="review-title"
                  type="text"
                  required
                  maxLength={100}
                  disabled={submittingReview}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Magnificent craftsmanship and drape"
                  className="w-full bg-white border border-[#B08A3C]/35 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded-xl px-3.5 py-2.5 outline-none transition-all font-sans"
                />
              </div>

              {/* Review text textarea */}
              <div className="space-y-1">
                <label htmlFor="review-text" className="text-xs font-bold text-dark-brown/70 uppercase tracking-wider font-serif">Review Details</label>
                <textarea
                  id="review-text"
                  required
                  rows={4}
                  maxLength={1000}
                  disabled={submittingReview}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Tell us about the fabric quality, zari shine, color vibrancy, and your wearing experience..."
                  className="w-full bg-white border border-[#B08A3C]/35 focus:border-maroon focus:ring-1 focus:ring-maroon text-xs text-dark-brown rounded-xl px-3.5 py-2.5 outline-none transition-all resize-none font-sans"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setReviewProduct(null);
                    setFormError(null);
                  }}
                  className="flex-1 py-2.5 border border-[#F3ECE0] text-dark-brown/70 rounded-xl font-serif font-bold text-xs tracking-wider uppercase hover:bg-cream/20 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2.5 bg-maroon text-[#FAF7F0] rounded-xl font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submittingReview ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<OrdersTabSkeleton />}>
      <AccountContent />
    </Suspense>
  );
}

