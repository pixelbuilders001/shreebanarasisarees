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
  MessageCircle,
  MapPin,
  Download,
  Check,
  Star,
  AlertTriangle,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase, fetchDbOrderWithItems, fetchDbOrders, mapDbOrderToOrder, OrderStatusHistoryEntry, fetchDeliverySettings, DeliverySettings } from '../../data/supabase';
import { OrdersTabSkeleton } from '../../components/TabSkeletons';
import { useIsPwaInstalled, markPwaAsInstalled } from '@/lib/pwaUtils';
import { generateReceiptUrl, ReceiptData, ReceiptItem } from '@/lib/receiptUtils';
import { buildReceiptDataFromOrder, downloadInvoicePdf } from '@/lib/invoicePdf';
import { getStandardDeliveryDateInfo } from '../../lib/deliveryDates';

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

// Format date and time for timeline milestones: "Today, 6:12 pm", "Yesterday, 3:45 pm", or "12 Sep 2026, 4:30 pm"
function formatOrderDateTime(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (date.toDateString() === now.toDateString()) {
    return `Today, ${timeStr}`;
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return `${dateStr}, ${timeStr}`;
}

// Canonical order status progression (matches the DB enum):
// placed → confirmed → processing → packed → shipped → out_for_delivery → delivered
const ORDER_STATUS_STEPS: Array<{ key: string; title: string }> = [
  { key: 'placed', title: 'Placed' },
  { key: 'confirmed', title: 'Confirmed' },
  { key: 'processing', title: 'Processing' },
  { key: 'packed', title: 'Packed' },
  { key: 'shipped', title: 'Shipped' },
  { key: 'out_for_delivery', title: 'Out For Delivery' },
  { key: 'delivered', title: 'Delivered' }
];

// Normalize any raw/pretty order status onto a canonical step key
function normalizeStatusKey(status?: string | null): string {
  const s = (status || '').toLowerCase().trim();
  if (!s) return '';
  const exact = ORDER_STATUS_STEPS.find(step => step.key === s);
  if (exact) return exact.key;
  const byTitle = ORDER_STATUS_STEPS.find(step => step.title.toLowerCase() === s);
  if (byTitle) return byTitle.key;
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('return')) return 'returned';
  if (s.includes('deliver')) return 'delivered';
  if (s.includes('out')) return 'out_for_delivery';
  if (s.includes('ship')) return 'shipped';
  if (s.includes('pack')) return 'packed';
  if (s.includes('process')) return 'processing';
  if (s.includes('confirm')) return 'confirmed';
  if (s.includes('place') || s.includes('order')) return 'placed';
  return '';
}

function getStatusStepIndex(status?: string | null): number {
  return ORDER_STATUS_STEPS.findIndex(step => step.key === normalizeStatusKey(status));
}

// How far an order has progressed, based on its current status + status history
function getFurthestStepIndex(
  orderStatus?: string | null,
  history?: Array<{ status?: string | null }>
): number {
  const orderIndex = getStatusStepIndex(orderStatus);
  const historyIndexes = (history || [])
    .map(h => getStatusStepIndex(h.status))
    .filter(i => i >= 0);
  if (historyIndexes.length > 0) return Math.max(orderIndex, ...historyIndexes);
  return orderIndex >= 0 ? orderIndex : 0;
}

// Badge shows the actual status from the response (no hardcoded labels)
function getStatusBadge(status?: string | null) {
  const key = normalizeStatusKey(status);

  if (key === 'cancelled') {
    return { label: 'Cancelled', className: 'bg-[#FDF2F2] text-[#991B1B] border border-[#FECDCD]' };
  }
  if (key === 'returned') {
    return { label: 'Returned', className: 'bg-[#F5EFEB] text-[#57534E]' };
  }

  const step = ORDER_STATUS_STEPS.find(s => s.key === key);
  if (step) {
    const styleMap: Record<string, string> = {
      placed: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]',
      confirmed: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]',
      processing: 'bg-[#F0F7FF] text-[#1D4ED8] border border-[#BFDBFE]',
      packed: 'bg-[#FAF2ED] text-[#6B1725] border border-[#F0DCD0]',
      shipped: 'bg-[#F0F7FF] text-[#1D4ED8] border border-[#BFDBFE]',
      out_for_delivery: 'bg-[#6B1725] text-white border border-[#6B1725]',
      delivered: 'bg-[#F5EFEB] text-[#44403C]'
    };
    return { label: step.title, className: styleMap[step.key] };
  }

  return {
    label: status || 'Order Placed',
    className: 'bg-[#F5EFEB] text-[#57534E]'
  };
}

function formatEstimatedDeliveryDate(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string'
      ? new Date(dateInput.includes('T') ? dateInput : `${dateInput}T12:00:00`)
      : dateInput;
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    }).format(d);
  } catch {
    return '';
  }
}

function isOtherThanStandardOrder(order: Order): boolean {
  const method = (order.delivery_method || order.customer?.deliveryMethod || '').toLowerCase();
  if (
    method.includes('express') ||
    method.includes('same') ||
    method.includes('20-min') ||
    method === 'store pickup'
  ) {
    return true;
  }
  if (order.shipping === 29 || order.shipping === 49) {
    return true;
  }
  return false;
}

// Delivery estimate helper showing actual date or delivery partner status
function getDeliveryEstimate(order: Order, standardDeliveryDays: number = 3): {
  type: 'express' | 'standard' | 'return' | 'refund' | 'cancelled';
  label: string;
} {
  const s = order.orderStatus?.toLowerCase() || '';

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

  // Other than standard: Express, 20-min, Same Day, Local delivery
  if (isOtherThanStandardOrder(order)) {
    return {
      type: 'express',
      label: 'Delivery partner is on the way'
    };
  }

  // Standard delivery: Show actual date from estimated_delivery_date (no random days)
  let formattedDate = '';
  if (order.estimated_delivery_date) {
    formattedDate = formatEstimatedDeliveryDate(order.estimated_delivery_date);
  }
  if (!formattedDate) {
    const baseDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const info = getStandardDeliveryDateInfo(baseDate, standardDeliveryDays);
    formattedDate = info.formattedDate;
  }

  return {
    type: 'standard',
    label: `Delivery by ${formattedDate}`
  };
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
  mrp: number;
  quantity: number;
  image: string | null;
  item_status?: string;
}

// Safely extract item title, image, and price across all possible order item formats
function resolveOrderItem(item: any, products: any[] = []): ResolvedOrderItem {
  if (!item) {
    return {
      id: '',
      sku: 'SBS-SAREE',
      name: 'Pure Silk Banarasi Saree',
      price: 0,
      mrp: 0,
      quantity: 1,
      image: null,
      item_status: 'active'
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

  // 5. Resolve price and mrp
  const price = Number(
    prod?.salePrice ?? prod?.price ?? 
    item?.unit_price ?? item?.price ?? 
    snap?.salePrice ?? snap?.selling_price ?? snap?.price ?? 
    matched?.salePrice ?? matched?.price ?? 0
  );

  const snapMrp = Number(snap?.mrp || snap?.price || 0);
  const prodMrp = Number(prod?.price || 0);
  const matchedMrp = Number(matched?.price || 0);
  const rawMrp = Number(item?.mrp || 0);
  const mrpCandidate = snapMrp || prodMrp || matchedMrp || rawMrp;
  const mrp = mrpCandidate > price ? mrpCandidate : (price > 0 ? price : 0);

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

  const item_status = item?.item_status || prod?.item_status || snap?.item_status || 'active';

  return {
    id: id || sku || 'item',
    sku: sku || (id ? id.slice(0, 6).toUpperCase() : 'SBS-SAREE'),
    name,
    price,
    mrp: mrp > 0 ? mrp : price,
    quantity: Number(item?.quantity || 1),
    image,
    item_status
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
    markOrderCancelledLocally,
    refreshOrders,
    user,
    userPhone,
    userProfile,
    isHydrated
  } = useStore();

  const [activeFilter, setActiveFilter] = useState<'All' | 'In transit' | 'Delivered' | 'Returned'>('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderItemsDetails, setOrderItemsDetails] = useState<any[] | null>(null);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);
  const [standaloneOrder, setStandaloneOrder] = useState<Order | null>(null);
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [isLoadingDbOrders, setIsLoadingDbOrders] = useState<boolean>(true);

  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);

  useEffect(() => {
    fetchDeliverySettings().then(setDeliverySettings).catch(console.error);
  }, []);

  const deliveryDateInfo = useMemo(() => {
    return getStandardDeliveryDateInfo(new Date(), deliverySettings?.standard_delivery_days ?? 3);
  }, [deliverySettings?.standard_delivery_days]);

  const [cancelStatus, setCancelStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cancelErrorMessage, setCancelErrorMessage] = useState<string | null>(null);

  // Direct Invoice PDF Download states & handler
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [downloadedOrderId, setDownloadedOrderId] = useState<string | null>(null);

  const handleDownloadInvoice = async (order: any, orderDisplayItems?: any[]) => {
    const invKey = order.invoice_number || order.orderId;
    if (!order || downloadingOrderId === invKey) return;
    try {
      setDownloadingOrderId(invKey);
      const itemsToUse = orderDisplayItems && orderDisplayItems.length > 0 ? orderDisplayItems : order.items;
      const orderForReceipt = { ...order, items: itemsToUse };
      const receiptData = buildReceiptDataFromOrder(orderForReceipt, products);
      await downloadInvoicePdf(receiptData);
      setDownloadedOrderId(invKey);
      setTimeout(() => setDownloadedOrderId(null), 4000);
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert('Failed to generate invoice PDF. Please try again.');
    } finally {
      setDownloadingOrderId(null);
    }
  };

  // Helper: Only show cancel button for placed, confirmed, processing, and packed orders
  const isOrderCancellable = (status?: string | null): boolean => {
    if (!status) return false;
    const s = status.toLowerCase().trim();
    return s === 'placed' || s === 'order placed' || s === 'confirmed' || s === 'processing' || s === 'packed';
  };

  // Fetch only the authenticated user's orders (by user.id or profile/phone number)
  const loadAccountOrders = async () => {
    setIsLoadingDbOrders(true);
    try {
      const targetUserId = user?.id || null;
      const targetPhone = userProfile?.phone_number
        ? String(userProfile.phone_number)
        : (userPhone && /^[6-9]\d{9}$/.test(userPhone) ? userPhone : (user?.phone || null));

      const has10DigitPhone = targetPhone && targetPhone.replace(/\D/g, '').length >= 10;
      // If user is neither logged in via Google OAuth (UUID) nor has a valid 10-digit phone, show no orders
      if (!targetUserId && !has10DigitPhone) {
        setDbOrders([]);
        return;
      }

      const freshOrders = await fetchDbOrders(targetUserId, targetPhone);
      setDbOrders(freshOrders);
    } catch (err) {
      console.error('Error loading orders in AccountContent:', err);
      setDbOrders([]);
    } finally {
      setIsLoadingDbOrders(false);
    }
  };

  useEffect(() => {
    if (isHydrated) {
      loadAccountOrders();
    }
  }, [isHydrated, user?.id, userProfile?.phone_number, userPhone]);

  // For authenticated accounts, display strictly their verified database orders.
  // Never fall back to unverified context orders when a user session is present.
  const displayOrders = (user || userPhone) ? dbOrders : (dbOrders.length > 0 ? dbOrders : orders);

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
  const [orderUuidToCancel, setOrderUuidToCancel] = useState<string | null>(null);
  const [itemToCancel, setItemToCancel] = useState<string | null>(null);
  const [cancelType, setCancelType] = useState<'order' | 'item'>('order');

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
  const activeOrder = standaloneOrder || displayOrders.find(o => o.orderId === selectedOrderId || o.id === selectedOrderId);
  const historyList = activeOrder?.statusHistory || [];

  // Fetch freshest order details & status history whenever an order is selected
  useEffect(() => {
    if (!selectedOrderId) {
      setStandaloneOrder(null);
      return;
    }

    let isMounted = true;
    async function fetchStandaloneOrder() {
      try {
        const order = await fetchDbOrderWithItems(selectedOrderId!);
        if (order && isMounted) {
          setStandaloneOrder(order);
        }
      } catch (e) {
        console.error('Error fetching standalone order:', e);
      }
    }

    fetchStandaloneOrder();
    return () => { isMounted = false; };
  }, [selectedOrderId]);

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
        const isCurrentIdUuid = orderId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId) : false;

        // If UUID is not valid on activeOrder, determine UUID from order_number or check if selectedOrderId is UUID
        if (!isCurrentIdUuid) {
          const isSelectedUuid = selectedOrderId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedOrderId) : false;
          if (isSelectedUuid) {
            orderId = selectedOrderId!;
          } else {
            const lookupNumber = activeOrder?.orderId || selectedOrderId!;
            const { data: orderRow } = await supabase
              .from('orders')
              .select('id')
              .eq('order_number', lookupNumber)
              .maybeSingle();
            orderId = orderRow?.id;
          }
        }

        // Must be a valid UUID before querying order_items.order_id
        const isOrderUuid = orderId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId) : false;
        if (!isOrderUuid) {
          return;
        }

        const { data, error } = await supabase
          .from("order_items")
          .select(`
            id,
            order_id,
            inventory_id,
            product_name,
            product_name_snapshot,
            sku,
            barcode,
            quantity,
            unit_price,
            discount_amount,
            taxable_value,
            gst_rate,
            cgst_amount,
            sgst_amount,
            igst_amount,
            gst_amount,
            total_price,
            product_snapshot,
            item_status
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

  const refreshOrderStatus = async (targetOrderNumber?: string) => {
    // Re-fetch only the orders database data without reloading the entire page
    await Promise.all([
      loadAccountOrders(),
      refreshOrders()
    ]);
    const orderIdToFetch = targetOrderNumber || selectedOrderId;
    if (orderIdToFetch) {
      try {
        const refreshed = await fetchDbOrderWithItems(orderIdToFetch);
        if (refreshed) {
          setStandaloneOrder(refreshed);
        }
      } catch (err) {
        console.error('Error refreshing order details:', err);
      }
    }
  };

  const handleCancelOrder = (orderIdentifier?: string, productId?: string) => {
    const targetOrder = orderIdentifier
      ? (displayOrders.find(o => o.id === orderIdentifier || o.orderId === orderIdentifier) || activeOrder)
      : activeOrder;

    if (!targetOrder || !productId) return;

    // Human-readable order number for UI modal copy
    const displayNum = targetOrder.orderId || targetOrder.id || '';
    setOrderToCancel(displayNum);

    // Database primary key order.id (UUID) for Edge Function payload
    const orderUuid = targetOrder.id || null;
    setOrderUuidToCancel(orderUuid);

    setItemToCancel(productId);
    setCancelType('item');

    setCancelStatus('idle');
    setCancelErrorMessage(null);
    setShowCancelModal(true);
  };

  const confirmCancelOrderAction = async () => {
    if (!orderToCancel || !itemToCancel) return;

    setIsCancelling(true);
    setCancelErrorMessage(null);

    try {
      // 1. Resolve database UUID for order.id
      let resolvedOrderId = orderUuidToCancel;
      if (!resolvedOrderId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedOrderId)) {
        if (orderToCancel) {
          const { data: row } = await supabase
            .from('orders')
            .select('id')
            .eq('order_number', orderToCancel)
            .maybeSingle();
          if (row?.id) {
            resolvedOrderId = row.id;
          }
        }
      }

      if (!resolvedOrderId) {
        throw new Error("Could not find order ID");
      }

      // 2. Resolve database UUID for order_item_id
      let resolvedOrderItemId = itemToCancel;
      const isItemUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedOrderItemId);
      if (!isItemUuid) {
        const { data: itemRows } = await supabase
          .from('order_items')
          .select('id, inventory_id, sku')
          .eq('order_id', resolvedOrderId);

        const matched = itemRows?.find(r => r.id === itemToCancel || r.inventory_id === itemToCancel || r.sku === itemToCancel);
        if (matched?.id) {
          resolvedOrderItemId = matched.id;
        }
      }

      // 3. Perform cancellation via cancelOrderItem (single source of truth)
      const res = await cancelOrderItem(resolvedOrderId, resolvedOrderItemId);

      if (!res.success) {
        const errorMsg = res.message || "Failed to cancel item. Please try again.";
        console.error("Cancel item error:", errorMsg);
        setCancelErrorMessage(errorMsg);
        setCancelStatus('error');
      } else {
        // 4. INSTANT OPTIMISTIC UI REFRESH
        const isEntireOrderCancelled = Boolean(res.cancelledEntireOrder);
        const targetKey = orderToCancel;
        const targetUuid = resolvedOrderId;

        // Update local orderItemsDetails (preserve item, mark item_status as 'cancelled')
        if (orderItemsDetails) {
          setOrderItemsDetails(prev => prev ? prev.map(i => {
            if (i.id === resolvedOrderItemId || i.id === itemToCancel || i.inventory_id === itemToCancel) {
              return { ...i, item_status: 'cancelled' };
            }
            return i;
          }) : null);
        }

        // Update standaloneOrder (preserve item, mark item_status as 'cancelled')
        setStandaloneOrder(prev => {
          if (!prev) return prev;
          const updatedItems = prev.items.map(it => {
            const isMatch = (it as any)?.id === resolvedOrderItemId ||
              it.product?.id === itemToCancel ||
              (it as any)?.id === itemToCancel ||
              (it as any)?.inventory_id === itemToCancel;
            if (isMatch) {
              return {
                ...it,
                item_status: 'cancelled',
                product: { ...it.product, item_status: 'cancelled' }
              };
            }
            return it;
          });
          const hasActiveItems = updatedItems.some(it => (it as any).item_status !== 'cancelled');
          const nowCancelled = isEntireOrderCancelled || !hasActiveItems;
          return {
            ...prev,
            orderStatus: nowCancelled ? ('Cancelled' as const) : prev.orderStatus,
            subtotal: res?.newSubtotal != null ? res.newSubtotal : prev.subtotal,
            total: res?.newTotal != null ? res.newTotal : prev.total,
            items: updatedItems
          };
        });

        // Update local dbOrders state immediately (preserve item, mark item_status as 'cancelled')
        setDbOrders(prev =>
          prev.map(o => {
            if (o.id === targetUuid || o.orderId === targetKey || o.id === targetKey) {
              const updatedItems = o.items.map(it => {
                const isMatch = (it as any)?.id === resolvedOrderItemId ||
                  it.product?.id === itemToCancel ||
                  (it as any)?.id === itemToCancel ||
                  (it as any)?.inventory_id === itemToCancel;
                if (isMatch) {
                  return {
                    ...it,
                    item_status: 'cancelled',
                    product: { ...it.product, item_status: 'cancelled' }
                  };
                }
                return it;
              });
              const hasActiveItems = updatedItems.some(it => (it as any).item_status !== 'cancelled');
              const nowCancelled = isEntireOrderCancelled || !hasActiveItems;
              return {
                ...o,
                orderStatus: nowCancelled ? ('Cancelled' as const) : o.orderStatus,
                subtotal: res?.newSubtotal != null ? res.newSubtotal : o.subtotal,
                total: res?.newTotal != null ? res.newTotal : o.total,
                items: updatedItems
              };
            }
            return o;
          })
        );

        setCancelStatus('success');

        // Refresh fresh DB records in the background
        await refreshOrderStatus(orderToCancel);
      }
    } catch (err: any) {
      console.error("Cancellation error:", err);
      const errorMsg = err.message || "An unexpected error occurred during cancellation.";
      setCancelErrorMessage(errorMsg);
      setCancelStatus('error');
    } finally {
      setIsCancelling(false);
    }
  };

  const targetItemObj = displayItems.find(item => {
    const res = resolveOrderItem(item, products);
    return (
      (item as any)?.id === itemToCancel ||
      (item as any)?.inventory_id === itemToCancel ||
      (item as any)?.product?.id === itemToCancel ||
      (item as any)?.sku === itemToCancel ||
      res.id === itemToCancel ||
      res.sku === itemToCancel
    );
  });
  const targetItemName = targetItemObj ? resolveOrderItem(targetItemObj, products).name : '';

  // Only allow cancellation if order is placed, confirmed, processing, or packed
  const isCancellable = isOrderCancellable(activeOrder?.orderStatus);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (activeFilter === 'In transit') {
      return displayOrders.filter(o => {
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
      return displayOrders.filter(o => o.orderStatus?.toLowerCase().includes('deliver'));
    }
    if (activeFilter === 'Returned') {
      return displayOrders.filter(o => {
        const s = o.orderStatus?.toLowerCase() || '';
        return s.includes('return') || s.includes('cancel');
      });
    }
    return displayOrders; // 'All'
  }, [displayOrders, activeFilter]);

  if (!isHydrated || (isLoadingDbOrders && dbOrders.length === 0)) {
    return <OrdersTabSkeleton />;
  }

  // ═════════════════════════════════════════════════════════════════
  // REUSABLE CANCEL MODAL (Rendered in both View A & View B)
  // ═════════════════════════════════════════════════════════════════
  const renderCancelModal = () => {
    if (!showCancelModal) return null;

    return (
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
                    Cancel Saree
                  </h3>
                  <p className="text-[9px] text-dark-brown/45 font-mono font-bold uppercase tracking-wider mt-0.5 truncate">
                    ID: {orderToCancel}
                  </p>
                </div>
              </div>

              <p className="text-xs text-dark-brown/70 leading-relaxed font-sans font-medium">
                Are you sure you want to cancel <strong className="text-maroon font-bold font-serif">{targetItemName || 'this saree'}</strong> from this order? The total will adjust automatically.
              </p>

              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setOrderToCancel(null);
                    setOrderUuidToCancel(null);
                    setItemToCancel(null);
                  }}
                  disabled={isCancelling}
                  className="px-3.5 py-2 border border-[#F3ECE0] text-dark-brown/70 hover:bg-cream/20 rounded-xl text-[11px] font-serif font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={confirmCancelOrderAction}
                  disabled={isCancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-serif font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center gap-1.5 min-w-[100px]"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-white" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    'Cancel Saree'
                  )}
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
                    Saree Cancelled
                  </h3>
                  <p className="text-[9px] text-dark-brown/45 font-mono font-bold uppercase tracking-wider mt-0.5">
                    ID: {orderToCancel}
                  </p>
                </div>
                <p className="text-xs text-dark-brown/70 leading-relaxed font-sans font-medium px-2">
                  The saree has been cancelled. Remaining items in your order remain active.
                </p>
              </div>
              <div className="flex justify-center border-t border-[#F3ECE0] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setOrderToCancel(null);
                    setOrderUuidToCancel(null);
                    setItemToCancel(null);
                    setCancelStatus('idle');
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
                  {cancelErrorMessage || 'Could not complete cancellation at this moment. Please check your connection or contact customer support.'}
                </p>
              </div>
              <div className="flex justify-center border-t border-[#F3ECE0] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setOrderToCancel(null);
                    setOrderUuidToCancel(null);
                    setItemToCancel(null);
                    setCancelStatus('idle');
                    setCancelErrorMessage(null);
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
    );
  };

  // ═════════════════════════════════════════════════════════════════
  // VIEW A: ORDER DETAILS VIEW (Matches Image 3)
  // ═════════════════════════════════════════════════════════════════
  if (selectedOrderId && activeOrder) {
    const isDelivered = activeOrder.orderStatus?.toLowerCase().includes('deliver');
    const isCancelled = activeOrder.orderStatus?.toLowerCase().includes('cancel');
    const isOther = isOtherThanStandardOrder(activeOrder);
    const actualDeliveryDateStr = activeOrder.estimated_delivery_date
      ? formatEstimatedDeliveryDate(activeOrder.estimated_delivery_date)
      : deliveryDateInfo.formattedDate;

    // Stepper — canonical order statuses (matches DB enum):
    // placed → confirmed → processing → packed → shipped → out_for_delivery → delivered
    const furthestStepIndex = getFurthestStepIndex(activeOrder.orderStatus, historyList);

    const stepCopy: Record<string, { current: string; done: string; future: string }> = {
      placed: { current: 'Your order has been received', done: 'Order placed', future: '' },
      confirmed: { current: 'Verified by master weavers in Samastipur', done: 'Order confirmed', future: 'Awaiting confirmation' },
      processing: { current: 'Being prepared at our workshop', done: 'Processing', future: 'Awaiting processing' },
      packed: { current: 'Safely packed in our authentic fabric pouch', done: 'Packed', future: 'Not yet packed' },
      shipped: { current: 'Dispatched with priority courier', done: 'Shipped', future: 'Not yet shipped' },
      out_for_delivery: { current: 'Delivery partner is on the way', done: 'Out for delivery', future: 'Out for delivery soon' },
      delivered: {
        current: 'Hand delivered to your doorstep',
        done: 'Delivered',
        future: isOther
          ? 'Delivery partner is on the way'
          : `Expected by ${actualDeliveryDateStr}`
      }
    };

    let timelineSteps: Array<{
      key?: string;
      title: string;
      subtitle: string;
      timestamp?: string | null;
      completed: boolean;
      isCancelled?: boolean;
    }> = [];

    if (isCancelled) {
      // Find history entries
      const cancelHist = historyList.slice().reverse().find(h => normalizeStatusKey(h.status) === 'cancelled');
      const placedHist = historyList.find(h => normalizeStatusKey(h.status) === 'placed');
      const confirmedHist = historyList.find(h => normalizeStatusKey(h.status) === 'confirmed');
      const processingHist = historyList.find(h => normalizeStatusKey(h.status) === 'processing');

      // 1. Placed
      timelineSteps.push({
        key: 'placed',
        title: 'Order Placed',
        subtitle: placedHist?.note || 'Your order has been received',
        timestamp: formatOrderDateTime(placedHist?.createdAt || activeOrder.createdAt),
        completed: true
      });

      // 2. Confirmed (if recorded before cancellation)
      if (confirmedHist) {
        timelineSteps.push({
          key: 'confirmed',
          title: 'Confirmed',
          subtitle: confirmedHist.note || 'Order confirmed',
          timestamp: formatOrderDateTime(confirmedHist.createdAt),
          completed: true
        });
      }

      // 3. Processing (if recorded before cancellation)
      if (processingHist) {
        timelineSteps.push({
          key: 'processing',
          title: 'Processing',
          subtitle: processingHist.note || 'Being prepared at workshop',
          timestamp: formatOrderDateTime(processingHist.createdAt),
          completed: true
        });
      }

      // 4. Cancelled (active final step)
      timelineSteps.push({
        key: 'cancelled',
        title: 'Order Cancelled',
        subtitle: cancelHist?.note || 'Order cancelled by customer',
        timestamp: formatOrderDateTime(cancelHist?.createdAt),
        completed: true,
        isCancelled: true
      });
    } else {
      timelineSteps = ORDER_STATUS_STEPS.map((step, idx) => {
        const hist = historyList.slice().reverse().find(h => normalizeStatusKey(h.status) === step.key);
        let subtitle = '';
        let timestamp: string | null = null;

        if (idx <= furthestStepIndex) {
          const rawDate = hist?.createdAt || (step.key === 'placed' ? activeOrder.createdAt : null);
          if (rawDate) {
            timestamp = formatOrderDateTime(rawDate);
          }

          if (hist?.note) {
            subtitle = hist.note;
          } else {
            subtitle = idx === furthestStepIndex ? stepCopy[step.key].current : stepCopy[step.key].done;
          }
        } else {
          subtitle = stepCopy[step.key].future;
        }

        return {
          key: step.key,
          title: step.key === 'shipped' && activeOrder.shipmentTrackingUpdates && activeOrder.shipmentTrackingUpdates.length > 0 ? 'On the Way' : step.title,
          subtitle,
          timestamp,
          completed: idx <= furthestStepIndex
        };
      });
    }

    const activeStepIndex = isCancelled ? timelineSteps.length - 1 : furthestStepIndex;

    const activeItems = displayItems.filter(item => {
      const isItemCancelled = (item?.item_status || (item as any)?.product?.item_status) === 'cancelled';
      return !isItemCancelled;
    });
    const itemsForPriceCalc = (!isCancelled && activeItems.length > 0) ? activeItems : displayItems;

    const orderTotalMrp = itemsForPriceCalc.reduce((acc, item) => {
      const resolved = resolveOrderItem(item, products);
      let snap = item.product_snapshot;
      if (typeof snap === 'string') {
        try { snap = JSON.parse(snap); } catch {}
      }
      const snapMrp = Number(snap?.mrp || snap?.price || 0);
      const mrp = snapMrp > 0 ? snapMrp : (resolved.mrp > 0 ? resolved.mrp : resolved.price);
      return acc + mrp * (resolved.quantity || 1);
    }, 0);

    const orderItemsSellingTotal = itemsForPriceCalc.reduce((acc, item) => {
      const resolved = resolveOrderItem(item, products);
      const unitPrice = item.unit_price != null ? Number(item.unit_price) : resolved.price;
      return acc + unitPrice * (resolved.quantity || 1);
    }, 0) || (activeOrder.subtotal || activeOrder.total);

    const productDiscount = Math.max(0, orderTotalMrp - orderItemsSellingTotal);
    const couponDiscount = Number(activeOrder.discount || 0);
    const totalSavings = productDiscount + couponDiscount;

    const receiptDownloadUrl = (() => {
      try {
        const items: ReceiptItem[] = displayItems.map((item: any) => {
          const resolved = resolveOrderItem(item, products);
          const isItemCancelled = (item?.item_status || (item as any)?.product?.item_status || resolved.item_status || '').toLowerCase() === 'cancelled';
          let snap = item.product_snapshot;
          if (typeof snap === 'string') {
            try { snap = JSON.parse(snap); } catch {}
          }
          const unitPrice = item.unit_price != null ? Number(item.unit_price) : resolved.price;
          const snapMrp = Number(snap?.mrp || snap?.price || 0);
          const mrp = snapMrp > 0 ? snapMrp : (resolved.mrp > 0 ? resolved.mrp : unitPrice);
          const hsnCode = item.hsn_code || snap?.hsn_code || '5208';
          return {
            sareeName: isItemCancelled ? `[Cancelled] ${resolved.name}` : resolved.name,
            quantity: resolved.quantity || 1,
            mrp: mrp > 0 ? mrp : unitPrice,
            sellingPrice: unitPrice,
            hsnCode,
          };
        });

        const fullAddress = [
          activeOrder.customer?.address,
          activeOrder.customer?.city,
          activeOrder.customer?.state,
          activeOrder.customer?.pinCode
        ].filter(Boolean).join(', ');

        const isIntraState = ((activeOrder.place_of_supply || activeOrder.customer?.state || 'Bihar').trim().toLowerCase()) === 'bihar';
        const orderTaxable = activeOrder.taxable_amount;
        const orderGst = activeOrder.gst_amount;
        const isGstPresent = orderTaxable != null && orderGst != null && orderGst > 0;

        const receiptData: ReceiptData = {
          invoiceNumber: activeOrder.invoice_number || activeOrder.orderId,
          date: activeOrder.invoice_date || activeOrder.createdAt,
          paymentMode: activeOrder.paymentMethod || 'cod',
          customerName: activeOrder.customer?.name || null,
          customerMobile: activeOrder.customer?.phone || null,
          customerAddress: fullAddress || null,
          customerEmail: activeOrder.customer?.email || null,
          items,
          subtotal: orderItemsSellingTotal,
          totalAmount: activeOrder.total,
          discountAmount: activeOrder.discount || 0,
          shippingFee: activeOrder.shipping || 0,
          giftWrapCharge: activeOrder.gift_wrap_charge || 0,
          isGstApplied: isGstPresent,
          gstRate: activeOrder.gst_rate || 5,
          taxableAmount: orderTaxable,
          cgstRate: isIntraState ? 2.5 : 0,
          cgstAmount: activeOrder.cgst_amount,
          sgstRate: isIntraState ? 2.5 : 0,
          sgstAmount: activeOrder.sgst_amount,
          igstRate: !isIntraState ? (activeOrder.gst_rate || 5) : 0,
          igstAmount: activeOrder.igst_amount,
          totalGst: orderGst,
          placeOfSupply: activeOrder.place_of_supply || activeOrder.customer?.state || 'Bihar',
        };

        return generateReceiptUrl(receiptData);
      } catch {
        return `/receipt/${encodeURIComponent(activeOrder.orderId)}`;
      }
    })();

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

        {/* Stepper Timeline Card */}
        <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-5 border shadow-2xs space-y-4 ${
          isCancelled ? 'bg-[#FFF9F9] border-[#FECDCD]' : 'bg-white border-[#E7DFC9]'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-[11px] font-bold uppercase tracking-wider font-sans flex items-center gap-2 ${
              isCancelled ? 'text-rose-700' : 'text-[#78716C]'
            }`}>
              {isCancelled && <AlertTriangle size={13} className="text-rose-600 shrink-0" />}
              {!isCancelled && !isDelivered && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6B1725] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6B1725]" />
                </span>
              )}
              {getStatusHeadline(activeOrder.orderStatus)}
            </h3>
            {isCancelled && (
              <span className="text-[10px] font-bold bg-[#FDF2F2] text-[#991B1B] px-2 py-0.5 rounded-md border border-[#FECDCD] uppercase font-sans">
                Cancelled
              </span>
            )}
          </div>

          <div className="space-y-4 relative pl-1">
            {timelineSteps.map((step, idx) => {
              const isActiveStep = idx === activeStepIndex;
              const isCancelStep = step.isCancelled;

              return (
                <div key={step.title} className="flex items-start gap-3.5 relative">
                  {idx < timelineSteps.length - 1 && (
                    <div
                      className={`absolute left-[9px] top-5 bottom-[-18px] w-[2px] ${
                        isCancelled
                          ? 'bg-[#FECDCD]'
                          : idx < activeStepIndex ? 'bg-[#6B1725]' : 'bg-[#E7DFC9]'
                      }`}
                    />
                  )}

                  <div className="relative flex items-center justify-center shrink-0 z-10">
                    {/* Pulsing radar waves for current in-progress status */}
                    {isActiveStep && !isCancelled && !isDelivered && (
                      <>
                        <span className="absolute -inset-1 rounded-full bg-[#6B1725]/30 animate-ping" />
                        <span className="absolute -inset-1.5 rounded-full bg-[#6B1725]/15 animate-pulse" />
                      </>
                    )}

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isCancelStep
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : isActiveStep && !isCancelled && !isDelivered
                            ? 'bg-[#6B1725] text-white ring-4 ring-[#6B1725]/20 shadow-md scale-105'
                            : step.completed
                              ? 'bg-[#6B1725] text-white shadow-2xs'
                              : 'border border-[#D4C39D] bg-[#FAF8F5]'
                      }`}
                    >
                      {isCancelStep ? (
                        <X size={11} className="stroke-[3]" />
                      ) : isActiveStep && !isCancelled && !isDelivered ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      ) : step.completed ? (
                        <Check size={11} className="stroke-[3]" />
                      ) : null}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold font-sans ${
                          isCancelStep
                            ? 'text-rose-800'
                            : (isActiveStep && !isCancelled)
                              ? 'text-[#6B1725] font-bold'
                              : step.completed
                                ? 'text-[#1C1917]'
                                : 'text-[#78716C]'
                        }`}>
                          {step.title}
                        </span>
                        {isActiveStep && !isCancelled && !isDelivered && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#6B1725]/10 text-[#6B1725] border border-[#6B1725]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6B1725] animate-ping" />
                            Live
                          </span>
                        )}
                      </div>
                      {step.timestamp && (
                        <span className="text-[11px] font-medium font-sans text-[#78716C] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E7DFC9]/80 shadow-2xs whitespace-nowrap">
                          {step.timestamp}
                        </span>
                      )}
                    </div>
                    {step.subtitle && (
                      <p className={`text-[11px] font-sans mt-0.5 ${
                        isCancelStep ? 'text-rose-700/80 font-medium' : 'text-[#78716C]'
                      }`}>
                        {step.subtitle}
                      </p>
                    )}

                    {/* Granular parcel tracking sub-notes between Shipped and Out for Delivery */}
                    {step.key === 'shipped' && activeOrder.shipmentTrackingUpdates && activeOrder.shipmentTrackingUpdates.length > 0 && (
                      <div className="mt-3 space-y-3 pt-2.5 border-t border-[#E7DFC9]/60">
                        {activeOrder.shipmentTrackingUpdates.map((update, uIdx) => {
                          const hasDistance = Boolean(update.metadata?.distance);
                          const hasNextStop = Boolean(update.metadata?.next_stop);
                          const hasEta = Boolean(update.metadata?.eta);

                          return (
                            <div key={update.id || uIdx} className="space-y-2.5">
                              {/* Highlighted milestone card vs standard row */}
                              {update.isHighlighted ? (
                                <div className="bg-[#EBF7EE] border border-[#C2E9CA] rounded-xl p-3 space-y-1 shadow-2xs">
                                  <p className="text-xs font-semibold text-[#1B6334] font-sans">
                                    {update.title}
                                  </p>
                                  {update.subtitle && (
                                    <p className="text-[11px] text-[#2E7D47] font-sans">
                                      {update.subtitle}
                                    </p>
                                  )}
                                  <p className="text-[11px] text-[#247A41] font-sans italic">
                                    {formatOrderDateTime(update.eventTime)}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-0.5 pl-0.5">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="text-xs font-medium text-[#1C1917] font-sans">
                                      {update.title}
                                    </span>
                                    <span className="text-[10.5px] text-[#78716C] font-sans">
                                      {formatOrderDateTime(update.eventTime)}
                                    </span>
                                  </div>
                                  {update.subtitle && (
                                    <p className="text-[11px] text-[#78716C] font-sans">
                                      {update.subtitle}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Dotted connector with Distance Badge (if distance exists) */}
                              {hasDistance && (
                                <div className="flex flex-col items-center py-1">
                                  <div className="border-l border-dashed border-[#A8A29E] h-4" />
                                  <div className="my-1 px-3 py-1 bg-[#F5F2EC] border border-[#E7DFC9] rounded-full text-[11px] font-semibold text-[#57534E] shadow-2xs flex items-center gap-1 font-sans">
                                    <span>{update.metadata?.distance}</span>
                                    <span className="text-[10px] text-[#78716C]">↓</span>
                                  </div>
                                  <div className="border-l border-dashed border-[#A8A29E] h-3" />
                                </div>
                              )}

                              {/* Next Stop & ETA (if next stop exists) */}
                              {hasNextStop && (
                                <div className="pl-0.5 space-y-0.5 text-left">
                                  <p className="text-xs font-semibold text-[#1C1917] font-sans">
                                    Next Stop - {update.metadata?.next_stop}
                                  </p>
                                  {hasEta && (
                                    <p className="text-[11px] text-[#78716C] font-sans italic">
                                      Expected by {update.metadata?.eta}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
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
              {displayItems.some(i => (i?.item_status || (i as any)?.product?.item_status) === 'cancelled') && (
                <span className="text-[10px] font-normal text-rose-700 ml-1.5 lowercase">
                  ({displayItems.filter(i => (i?.item_status || (i as any)?.product?.item_status) !== 'cancelled').length} active)
                </span>
              )}
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
              const isItemCancelled = (item?.item_status || (item as any)?.product?.item_status || resolved.item_status || '').toLowerCase() === 'cancelled';
              const unitPrice = item.unit_price != null ? Number(item.unit_price) : resolved.price;
              const totalPrice = item.total_price != null ? Number(item.total_price) : (unitPrice * resolved.quantity);

              return (
                <div key={item.id || resolved.id || idx} className={`py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 ${isItemCancelled ? 'opacity-70 bg-rose-50/20 -mx-2 px-2 rounded-lg' : ''}`}>
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {resolved.image ? (
                      <img
                        src={resolved.image}
                        alt={resolved.name}
                        className={`w-16 h-20 object-cover rounded-xl border border-[#E7DFC9] bg-[#FAF8F5] shrink-0 ${isItemCancelled ? 'grayscale-40' : ''}`}
                      />
                    ) : (
                      <div className="w-16 h-20 rounded-xl border border-[#E7DFC9] bg-[#FAF8F5] flex items-center justify-center text-[#B08A3C] shrink-0">
                        <Package size={22} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-serif font-bold text-xs sm:text-sm leading-snug line-clamp-2 ${isItemCancelled ? 'line-through text-[#78716C]' : 'text-[#1C1917]'}`}>
                          {resolved.name}
                        </h4>
                        {isItemCancelled && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 font-sans shrink-0">
                            Cancelled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#78716C] font-sans mt-1">
                        {resolved.sku} · Qty {resolved.quantity}
                      </p>

                      {/* Actions for individual item */}
                      <div className="flex items-center gap-3 mt-2">
                        {isDelivered && !isItemCancelled && (
                          <button
                            type="button"
                            onClick={() => handleWriteReview({ id: resolved.id, name: resolved.name, images: resolved.image ? [resolved.image] : [] })}
                            className="text-[11px] font-semibold text-[#6B1725] hover:underline flex items-center gap-1 cursor-pointer font-sans"
                          >
                            <Star size={11} className="text-[#B08A3C] fill-[#B08A3C]" />
                            <span>Write review</span>
                          </button>
                        )}
                        {isCancellable && !isItemCancelled && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(activeOrder.id || activeOrder.orderId, (item as any)?.id || (item as any)?.inventory_id || resolved.id || (item as any)?.product?.id)}
                            className="text-[11px] font-semibold text-rose-700 hover:underline cursor-pointer font-sans"
                          >
                            Cancel item
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-baseline justify-end gap-1.5">
                      {resolved.mrp > unitPrice && !isItemCancelled && (
                        <span className="text-[11px] text-[#A8A29E] line-through font-normal font-sans">
                          ₹{(resolved.mrp * resolved.quantity).toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className={`font-bold text-xs sm:text-sm font-sans ${isItemCancelled ? 'line-through text-[#78716C]' : 'text-[#1C1917]'}`}>
                        ₹{totalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {resolved.quantity > 1 && (
                      <span className="text-[10px] text-[#78716C] font-sans block mt-0.5">
                        ₹{unitPrice.toLocaleString('en-IN')} each
                      </span>
                    )}
                    {resolved.mrp > unitPrice && !isItemCancelled && (
                      <span className="text-[10px] font-semibold text-emerald-700 font-sans block mt-0.5">
                        Save ₹{((resolved.mrp - unitPrice) * resolved.quantity).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. BILL SUMMARY CARD */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-3">
          <h3 className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider font-sans">
            PRICE BREAKDOWN
          </h3>

          <div className="space-y-2 text-xs font-sans">
            {productDiscount > 0 ? (
              <>
                <div className="flex items-center justify-between text-[#57534E]">
                  <span>Total MRP</span>
                  <span className="text-[#1C1917] font-medium">
                    ₹{orderTotalMrp.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-700 font-medium">
                  <span>Product Discount</span>
                  <span>-₹{productDiscount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-[#57534E]">
                  <span>Items Subtotal</span>
                  <span className="text-[#1C1917] font-medium">
                    ₹{orderItemsSellingTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between text-[#57534E]">
                <span>Items Subtotal</span>
                <span className="text-[#1C1917] font-medium">
                  ₹{(activeOrder.subtotal || orderItemsSellingTotal || activeOrder.total).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {couponDiscount > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-medium">
                <span>Coupon / Order Discount</span>
                <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[#57534E]">
              <span>Delivery Fee</span>
              {activeOrder.shipping > 0 ? (
                <span className="text-[#1C1917] font-medium">₹{activeOrder.shipping.toLocaleString('en-IN')}</span>
              ) : (
                <span className="text-emerald-700 font-medium">Free</span>
              )}
            </div>

            {Boolean(activeOrder.gift_wrap_charge && activeOrder.gift_wrap_charge > 0) && (
              <div className="flex items-center justify-between text-[#57534E]">
                <span>Gift Packaging</span>
                <span className="text-[#1C1917] font-medium">₹{Number(activeOrder.gift_wrap_charge || 0).toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* GST Breakdown in Account Order Details */}
            {activeOrder.gst_amount != null && Number(activeOrder.gst_amount) > 0 && (
              <div className="bg-[#FAF8F5] border border-[#E7DFC9] rounded-xl p-3 my-2 space-y-1.5 font-sans">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1C1917]">
                  <div className="flex items-center gap-1.5">
                    <span>GST Included ({activeOrder.gst_rate || 5}%)</span>
                    <span className="text-[10px] bg-[#E7DFC9] text-[#6B1725] px-1.5 py-0.5 rounded font-bold">
                      {Number(activeOrder.igst_amount || 0) > 0 ? 'IGST' : 'CGST + SGST'}
                    </span>
                  </div>
                  <span className="font-bold text-[#6B1725]">₹{Number(activeOrder.gst_amount).toFixed(2)}</span>
                </div>
                <div className="pt-1.5 border-t border-[#E7DFC9]/60 space-y-1 text-[11px] text-[#78716C]">
                  {activeOrder.taxable_amount != null && (
                    <div className="flex justify-between">
                      <span>Taxable Value</span>
                      <span className="font-medium text-[#1C1917]">₹{Number(activeOrder.taxable_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(activeOrder.cgst_amount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>CGST ({(Number(activeOrder.gst_rate || 5) / 2).toFixed(1)}%)</span>
                      <span>₹{Number(activeOrder.cgst_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(activeOrder.sgst_amount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>SGST ({(Number(activeOrder.gst_rate || 5) / 2).toFixed(1)}%)</span>
                      <span>₹{Number(activeOrder.sgst_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(activeOrder.igst_amount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>IGST ({Number(activeOrder.gst_rate || 5)}%)</span>
                      <span>₹{Number(activeOrder.igst_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {activeOrder.place_of_supply && (
                    <div className="flex justify-between text-[10px] text-[#A89F91] pt-0.5">
                      <span>Place of Supply</span>
                      <span>{activeOrder.place_of_supply}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-[#F3ECE0] pt-2 flex items-center justify-between text-sm font-bold text-[#1C1917]">
              <span>Total Amount</span>
              <span>₹{activeOrder.total.toLocaleString('en-IN')}</span>
            </div>

            {totalSavings > 0 && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-lg p-2.5 text-center text-xs font-semibold mt-2.5 font-sans">
                🎉 You saved ₹{totalSavings.toLocaleString('en-IN')} on this order!
              </div>
            )}
          </div>

          <div className="border-t border-[#F3ECE0] pt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleDownloadInvoice(activeOrder, displayItems)}
              disabled={downloadingOrderId === (activeOrder.invoice_number || activeOrder.orderId)}
              className="text-xs font-semibold text-[#B08A3C] hover:text-[#8E6C29] transition-colors flex items-center gap-1.5 cursor-pointer font-sans disabled:opacity-60"
            >
              {downloadingOrderId === (activeOrder.invoice_number || activeOrder.orderId) ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Downloading invoice...</span>
                </>
              ) : downloadedOrderId === (activeOrder.invoice_number || activeOrder.orderId) ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Invoice Downloaded</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Download invoice</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-[#78716C] font-sans font-medium uppercase tracking-wider">
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

        {/* Cancel Modal (Order Details View) */}
        {renderCancelModal()}
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
            When you order, this is where you&apos;ll track your order &mdash; and where you start a return.
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
            const activeItem = order.items?.find((i: any) => (i?.item_status || (i as any)?.product?.item_status) !== 'cancelled') || order.items?.[0];
            const resolvedFirstItem = activeItem ? resolveOrderItem(activeItem, products) : null;
            const badge = getStatusBadge(order.orderStatus);
            const estimate = getDeliveryEstimate(order, deliverySettings?.standard_delivery_days ?? 3);
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
                        <img src="/expressdel.webp" alt="Express" className="w-3.5 h-3.5 object-contain shrink-0" />
                        <span>{estimate.label}</span>
                      </p>
                    )}
                    {estimate.type === 'standard' && (
                      <p className="text-[#6B1725] font-semibold text-xs flex items-center gap-1.5 mt-2 font-sans">
                        <img src="/standarddel.webp" alt="Standard" className="w-3.5 h-3.5 object-contain shrink-0" />
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

                <div className="pt-2 mt-2 border-t border-[#F3ECE0] flex items-center justify-between">
                  <span className="text-[11px] text-[#78716C] font-sans">
                    Status: <strong className="text-dark-brown font-medium">{order.orderStatus}</strong>
                  </span>
                  <span className="text-[11px] text-[#B08A3C] font-sans font-medium flex items-center gap-0.5">
                    <span>Manage items</span>
                    <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal (Order List View) */}
      {renderCancelModal()}

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

