"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, PRODUCTS, SelectedAddon } from '../data/products';
import { X, ShoppingBag, Heart } from 'lucide-react';
import { 
  supabase,
  fetchProducts, 
  fetchCategories, 
  DbCategory,
  fetchDbCart,
  upsertDbCartItem,
  deleteDbCartItem,
  clearDbCart,
  createDbOrder,
  fetchDbOrders,
  cancelDbOrder,
  cancelDbOrderItem,
  DeliveryCheckResult,
  fetchDbWishlist,
  addToDbWishlist,
  removeFromDbWishlist,
  fetchDefaultDeliveryPincode,
  updateProfileDefaultPincode,
  UserWallet,
  fetchUserWallet,
  lookupReferrerByCode,
  recordReferralSignup
} from '../data/supabase';
import { getStoredReferralCode, clearStoredReferralCode } from '../lib/referralUtils';
import {
  getValidCachedCategories,
  syncCategories,
  checkForCategorySupabaseUpdatesAndSync,
  subscribeToCategoryUpdates
} from '../lib/categoryCache';
import { trackAddToCart, trackRemoveFromCart, trackAddToWishlist } from '../lib/gtag';
import { parseSearchQuery, scoreProducts } from '../lib/searchEngine';

export interface CartItem {
  id?: string;
  inventory_id?: string;
  item_status?: string;
  unit_price?: number;
  total_price?: number;
  product: Product;
  quantity: number;
  hsn_code?: string;
  discount_amount?: number;
  taxable_value?: number;
  gst_rate?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  gst_amount?: number;
  selectedAddons?: SelectedAddon[];
  addonsTotal?: number;
}

export interface CustomRequest {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  sareeType: string;
  color: string;
  fabric: string;
  budget: string;
  occasion: string;
  requirements: string;
  image?: string;
  status: 'Pending' | 'Contacted' | 'In Progress' | 'Completed';
  createdAt: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  status: string;
  note?: string | null;
  createdAt: string;
}

export interface ShipmentTrackingUpdateEntry {
  id: string;
  orderId: string;
  title: string;
  subtitle?: string | null;
  eventTime: string;
  isHighlighted: boolean;
  metadata?: {
    next_stop?: string;
    distance?: string;
    eta?: string;
    [key: string]: any;
  };
  createdAt: string;
}

export interface Order {
  id?: string;
  orderId: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    deliveryMethod: 'Home Delivery' | 'Store Pickup';
  };
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  taxable_amount?: number;
  gst_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  gst_rate?: number;
  place_of_supply?: string;
  invoice_number?: string;
  invoice_date?: string;
  paymentMethod: 'UPI' | 'Cash on Delivery' | 'Online Payment';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  orderStatus: 'Order Placed' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';
  createdAt: string;
  statusHistory?: OrderStatusHistoryEntry[];
  shipmentTrackingUpdates?: ShipmentTrackingUpdateEntry[];
  delivery_method?: string;
  estimated_delivery_date?: string | null;
  // Gift order fields
  is_gift?: boolean;
  gift_recipient_name?: string | null;
  gift_message?: string | null;
  gift_wrap_charge?: number;
}

interface StoreContextType {
  products: Product[];
  categories: DbCategory[];
  isCategoriesLoading: boolean;
  cart: CartItem[];
  wishlist: Product[];
  orders: Order[];
  customRequests: CustomRequest[];
  addToCart: (product: Product, quantity?: number, selectedAddons?: SelectedAddon[]) => void;
  updateCartItemAddons: (productId: string, selectedAddons: SelectedAddon[]) => void;
  removeCartItemAddon: (productId: string, addonId: string) => void;
  removeFromCart: (productId: string, addonsKey?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, addonsKey?: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  placeOrder: (orderData: Omit<Order, 'orderId' | 'orderStatus' | 'paymentStatus' | 'createdAt'> & {
    customer_name?: string;
    customer_phone?: string;
    shipping_address?: any;
    notes?: string;
    coupon_code?: string;
    delivery_option?: string;
    delivery_method?: string;
    shipping_charge?: number;
    coins_redeemed?: number;
    referral_code?: string;
  }) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  cancelOrderItem: (orderId: string, productId: string) => Promise<{ success: boolean; cancelledEntireOrder: boolean; newSubtotal?: number; newTotal?: number; message?: string }>;
  markOrderCancelledLocally: (orderIdOrNumber: string) => void;
  refreshOrders: () => Promise<void>;
  addCustomRequest: (request: Omit<CustomRequest, 'id' | 'status' | 'createdAt'>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getSearchResults: () => Product[];
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  userPhone: string | null;
  loginUser: (phone: string) => void;
  logoutUser: () => void;
  user: any | null;
  userProfile: any | null;
  userWallet: UserWallet | null;
  userWalletLoading: boolean;
  refreshWallet: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateUserProfile: (updates: { full_name?: string | null; phone_number?: number | null }) => Promise<void>;
  shippingAddresses: any[];
  shippingAddressesLoading: boolean;
  shippingAddressesLoaded: boolean;
  fetchShippingAddresses: (userId: string) => Promise<any[]>;
  saveShippingAddress: (address: any) => Promise<any>;
  deleteShippingAddress: (id: string) => Promise<void>;
  setDefaultShippingAddress: (id: string) => Promise<void>;
  isHydrated: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (isOpen: boolean) => void;
  deliveryInfo: DeliveryCheckResult | null;
  setDeliveryInfo: (info: DeliveryCheckResult | null) => void;
  customerCoords: { latitude: number; longitude: number } | null;
  setCustomerCoords: (coords: { latitude: number; longitude: number } | null) => void;
  checkedPincode: string;
  setCheckedPincode: (pincode: string) => void;
  currentPincode: string;
  setCurrentPincode: (pincode: string) => Promise<void>;
  defaultDeliveryPincode: string | null;
  isPincodeReady: boolean;
  toast: {
    message: string;
    type?: 'cart' | 'info';
    action?: { label: string; onClick: () => void };
  } | null;
  showToast: (
    message: string,
    type?: 'cart' | 'info',
    action?: { label: string; onClick: () => void }
  ) => void;
}

interface ToastProps {
  message: string;
  type?: 'cart' | 'info';
  action?: { label: string; onClick: () => void };
  onClose: () => void;
}

const ToastNotification: React.FC<ToastProps> = ({ message, type = 'info', action, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2400);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes toastSlideUpMobile {
          from {
            opacity: 0;
            transform: translate3d(-50%, 12px, 0) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate3d(-50%, 0, 0) scale(1);
          }
        }
        @keyframes toastSlideUpDesktop {
          from {
            opacity: 0;
            transform: translate3d(0, 12px, 0) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        .animate-toast-mobile {
          animation: toastSlideUpMobile 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (min-width: 640px) {
          .animate-toast-desktop {
            animation: toastSlideUpDesktop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
      `}</style>
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50 flex items-center justify-between gap-2.5 bg-[#292524]/94 backdrop-blur-md text-[#FAF7F0] border border-white/12 px-3.5 py-1.5 sm:py-2 rounded-full shadow-[0_6px_22px_rgba(0,0,0,0.24)] animate-toast-mobile sm:animate-toast-desktop max-w-[90vw] sm:max-w-xs pointer-events-auto select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-full bg-white/12 text-[#FAF7F0] flex-shrink-0 flex items-center justify-center">
            {type === 'cart' ? (
              <ShoppingBag size={12} className="text-[#E5C378]" />
            ) : (
              <Heart size={12} className="fill-[#E5C378] text-[#E5C378]" />
            )}
          </div>
          <p className="text-xs font-medium font-sans truncate text-[#FAF7F0]">
            {message}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
          {action && (
            <button
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className="text-[11px] font-sans font-bold text-[#E5C378] hover:underline px-1.5 py-0.5 cursor-pointer"
            >
              {action.label}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[#FAF7F0]/40 hover:text-[#FAF7F0] p-0.5 rounded-full transition-colors cursor-pointer"
            aria-label="Close notification"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </>
  );
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [categories, setCategories] = useState<DbCategory[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('sbs_categories_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return [];
  });
  const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('sbs_categories_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return false;
          }
        }
      } catch {}
    }
    return true;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [userWalletLoading, setUserWalletLoading] = useState(false);
  const [shippingAddresses, setShippingAddresses] = useState<any[]>([]);
  const [shippingAddressesLoading, setShippingAddressesLoading] = useState(false);
  const [shippingAddressesLoaded, setShippingAddressesLoaded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryCheckResult | null>(null);
  const [customerCoords, setCustomerCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [defaultDeliveryPincode, setDefaultDeliveryPincode] = useState<string | null>(null);
  const [currentPincode, setCurrentPincodeState] = useState<string>('');
  const [isPincodeReady, setIsPincodeReady] = useState<boolean>(false);
  const currentPincodeRef = useRef<string>('');

  // Centralized Pincode update:
  // Guest: Saves to localStorage.selected_pincode.
  // Logged-in: Saved/default address is authoritative. Keeps profiles.default_pincode synchronized when appropriate.
  const setCurrentPincode = async (pincode: string) => {
    const cleanPin = pincode.trim().replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(cleanPin)) return;

    setCurrentPincodeState(cleanPin);
    currentPincodeRef.current = cleanPin;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pincode-updated', { detail: { pincode: cleanPin } }));
      // Save active session delivery pincode so navigating between pages or reloads retains user's manual choice
      sessionStorage.setItem('active_delivery_pincode', cleanPin);
    }

    if (!currentUserRef.current) {
      // Guest: Save manually selected pincode to localStorage.selected_pincode
      if (typeof window !== 'undefined') {
        localStorage.setItem('selected_pincode', cleanPin);
      }
    } else {
      // Logged in:
      // If user has no saved addresses, keep profiles.default_pincode synchronized
      if (!shippingAddresses || shippingAddresses.length === 0) {
        await updateProfileDefaultPincode(currentUserRef.current, cleanPin);
        if (userProfile) {
          userProfile.default_pincode = cleanPin;
          setUserProfile({ ...userProfile });
        }
      }
    }
  };

  const setCheckedPincode = (pincode: string) => {
    setCurrentPincode(pincode);
  };

  // Login Sync logic adhering to the strict priority rules:
  // 1. Saved/default address pincode FIRST
  // 2. profiles.default_pincode
  // 3. localStorage.selected_pincode
  // 4. Default pincode from delivery_settings
  const syncPincodeOnAuth = async (
    currentUser: any,
    profile: any,
    addresses: any[],
    defaultPinSetting: string | null
  ) => {
    const defaultAddr = addresses?.find(a => a.is_default) || (addresses && addresses.length > 0 ? addresses[0] : null);
    const defaultAddressPincode = defaultAddr?.pincode ? String(defaultAddr.pincode).trim() : null;
    const profilePincode = profile?.default_pincode ? String(profile.default_pincode).trim() : null;

    let activeSessionPin: string | null = null;
    let guestPincode: string | null = null;
    if (typeof window !== 'undefined') {
      activeSessionPin = sessionStorage.getItem('active_delivery_pincode')?.trim() || null;
      guestPincode = localStorage.getItem('selected_pincode')?.trim() ||
                     localStorage.getItem('user_pincode')?.trim() ||
                     sessionStorage.getItem('selected_delivery_pincode')?.trim() ||
                     null;
    }

    let finalPincode = '';

    // Active session override: if user explicitly entered/selected a pincode during this session (e.g. to deliver for someone else)
    if (activeSessionPin && /^\d{6}$/.test(activeSessionPin)) {
      finalPincode = activeSessionPin;

      // In background, ensure default address pincode syncs to profile if profile is empty
      if (defaultAddressPincode && !profilePincode) {
        await updateProfileDefaultPincode(currentUser.id, defaultAddressPincode);
        if (profile) profile.default_pincode = defaultAddressPincode;
      }
    }
    // Priority 1: Saved/default address pincode (always authoritative over localStorage on fresh sessions)
    else if (defaultAddressPincode) {
      finalPincode = defaultAddressPincode;

      // Never overwrite an existing saved/default address or profiles.default_pincode with old guest pincode.
      // If profile has no pincode, synchronize default address pincode to profile
      if (!profilePincode) {
        await updateProfileDefaultPincode(currentUser.id, defaultAddressPincode);
        if (profile) profile.default_pincode = defaultAddressPincode;
      }

      // Successful sync complete: remove guest pincode
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selected_pincode');
        localStorage.removeItem('user_pincode');
        sessionStorage.removeItem('selected_delivery_pincode');
      }
    }
    // Priority 2: profiles.default_pincode
    else if (profilePincode) {
      finalPincode = profilePincode;

      // Never overwrite profiles.default_pincode with old guest pincode
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selected_pincode');
        localStorage.removeItem('user_pincode');
        sessionStorage.removeItem('selected_delivery_pincode');
      }
    }
    // Priority 3: localStorage.selected_pincode
    else if (guestPincode) {
      finalPincode = guestPincode;

      // If guest pincode exists and profile has no pincode, save to profiles.default_pincode
      const { success } = await updateProfileDefaultPincode(currentUser.id, guestPincode);
      if (success) {
        if (profile) profile.default_pincode = guestPincode;
        // ONLY remove localStorage.selected_pincode AFTER successful database synchronization!
        if (typeof window !== 'undefined') {
          localStorage.removeItem('selected_pincode');
          localStorage.removeItem('user_pincode');
          sessionStorage.removeItem('selected_delivery_pincode');
        }
      } else {
        console.warn('Database sync of guest pincode failed. Retaining localStorage pincode.');
      }
    }
    // Priority 4: Default pincode from delivery_settings
    else {
      finalPincode = defaultPinSetting || '';
    }

    if (finalPincode) {
      setCurrentPincodeState(finalPincode);
      currentPincodeRef.current = finalPincode;
    }
    setIsPincodeReady(true);
  };
  const [toast, setToast] = useState<{
    message: string;
    type?: 'cart' | 'info';
    action?: { label: string; onClick: () => void };
  } | null>(null);
  const currentUserRef = useRef<string | null>(null);

  const showToast = (
    message: string,
    type: 'cart' | 'info' = 'info',
    action?: { label: string; onClick: () => void }
  ) => {
    setToast({ message, type, action });
  };

  // Helper to sync user cart, wishlist and orders
  const syncUserData = async (identifier: string, loadedProducts: Product[], shouldMerge: boolean = false) => {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      let dbCartItems: { product_id: string; quantity: number }[] = [];
      let dbWishlistProductIds: string[] = [];

      let activeProds = loadedProducts;
      if (!activeProds || activeProds.length === 0 || activeProds === PRODUCTS) {
        const dbProducts = await fetchProducts();
        if (dbProducts && dbProducts.length > 0) {
          activeProds = dbProducts;
        }
      }

      // Read local cart and wishlist items for merging
      let localCartItems: CartItem[] = [];
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('sbs_cart') : null;
        if (stored) {
          localCartItems = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to parse stored cart:', e);
      }
      if ((!localCartItems || localCartItems.length === 0) && cart.length > 0) {
        localCartItems = cart;
      }

      let localWishlistItems: Product[] = [];
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('sbs_wishlist') : null;
        if (stored) {
          localWishlistItems = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to parse stored wishlist:', e);
      }
      if ((!localWishlistItems || localWishlistItems.length === 0) && wishlist.length > 0) {
        localWishlistItems = wishlist;
      }

      if (isUuid) {
        dbCartItems = await fetchDbCart(identifier);
        dbWishlistProductIds = await fetchDbWishlist(identifier);

        // ALWAYS merge any local cart items into DB
        if (localCartItems && localCartItems.length > 0) {
          for (const localItem of localCartItems) {
            if (!localItem?.product?.id) continue;
            const dbMatch = dbCartItems.find(dbItem => dbItem.product_id === localItem.product.id);
            if (dbMatch) {
              const mergedQty = Math.max(dbMatch.quantity, localItem.quantity);
              await upsertDbCartItem(identifier, localItem.product.id, mergedQty);
              dbMatch.quantity = mergedQty;
            } else {
              await upsertDbCartItem(identifier, localItem.product.id, localItem.quantity);
              dbCartItems.push({
                product_id: localItem.product.id,
                quantity: localItem.quantity
              });
            }
          }
        }

        // ALWAYS merge any local wishlist items into DB
        if (localWishlistItems && localWishlistItems.length > 0) {
          for (const localItem of localWishlistItems) {
            if (!localItem?.id) continue;
            const dbMatch = dbWishlistProductIds.includes(localItem.id);
            if (!dbMatch) {
              await addToDbWishlist(identifier, localItem.id);
              dbWishlistProductIds.push(localItem.id);
            }
          }
        }
      }

      // Reconstruct final cart items with robust fallbacks
      if (isUuid && dbCartItems && dbCartItems.length > 0) {
        const finalCartItems: CartItem[] = [];
        for (const dbItem of dbCartItems) {
          const product =
            activeProds.find(p => p.id === dbItem.product_id) ||
            localCartItems.find(l => l.product?.id === dbItem.product_id)?.product ||
            products.find(p => p.id === dbItem.product_id) ||
            PRODUCTS.find(p => p.id === dbItem.product_id);

          if (product) {
            const localMatch = localCartItems.find(l => l.product?.id === dbItem.product_id);
            finalCartItems.push({
              product,
              quantity: dbItem.quantity,
              selectedAddons: localMatch?.selectedAddons || [],
              addonsTotal: localMatch?.addonsTotal || 0
            });
          }
        }
        if (finalCartItems.length > 0) {
          setCart(finalCartItems);
          if (typeof window !== 'undefined') {
            localStorage.setItem('sbs_cart', JSON.stringify(finalCartItems));
          }
        } else if (localCartItems.length > 0) {
          setCart(localCartItems);
          if (typeof window !== 'undefined') {
            localStorage.setItem('sbs_cart', JSON.stringify(localCartItems));
          }
        }
      } else if (isUuid && localCartItems && localCartItems.length > 0) {
        setCart(localCartItems);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sbs_cart', JSON.stringify(localCartItems));
        }
      } else if (isUuid) {
        setCart([]);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sbs_cart', JSON.stringify([]));
        }
      }

      // Populate wishlist from DB with robust fallbacks
      if (isUuid && dbWishlistProductIds && dbWishlistProductIds.length > 0) {
        const finalWishlistItems: Product[] = [];
        for (const pid of dbWishlistProductIds) {
          const product =
            activeProds.find(p => p.id === pid) ||
            localWishlistItems.find(l => l.id === pid) ||
            products.find(p => p.id === pid) ||
            PRODUCTS.find(p => p.id === pid);

          if (product) {
            finalWishlistItems.push(product);
          }
        }
        if (finalWishlistItems.length > 0) {
          setWishlist(finalWishlistItems);
          if (typeof window !== 'undefined') {
            localStorage.setItem('sbs_wishlist', JSON.stringify(finalWishlistItems));
          }
        } else if (localWishlistItems.length > 0) {
          setWishlist(localWishlistItems);
          if (typeof window !== 'undefined') {
            localStorage.setItem('sbs_wishlist', JSON.stringify(localWishlistItems));
          }
        }
      } else if (isUuid && localWishlistItems && localWishlistItems.length > 0) {
        setWishlist(localWishlistItems);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sbs_wishlist', JSON.stringify(localWishlistItems));
        }
      } else if (isUuid) {
        setWishlist([]);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sbs_wishlist', JSON.stringify([]));
        }
      }

      const phoneLookup = userProfile?.phone_number ? String(userProfile.phone_number) : (user?.phone || null);
      const dbOrders = await fetchDbOrders(identifier, phoneLookup);
      setOrders(dbOrders || []);
    } catch (err) {
      console.error('Error syncing user data:', err);
    }
  };

  // Load from localStorage on mount and listen to auth changes
  useEffect(() => {
    let storedUser: string | null = null;
    try {
      const storedCart = localStorage.getItem('sbs_cart');
      const storedWishlist = localStorage.getItem('sbs_wishlist');
      const storedRequests = localStorage.getItem('sbs_custom_requests');
      const storedSearches = localStorage.getItem('sbs_recent_searches');
      storedUser = localStorage.getItem('sbs_user_phone');

      // Clean legacy unencrypted order PII from local storage
      if (localStorage.getItem('sbs_orders')) {
        localStorage.removeItem('sbs_orders');
      }

      if (storedCart) setCart(JSON.parse(storedCart));
      if (storedWishlist) setWishlist(JSON.parse(storedWishlist));
      if (storedRequests) setCustomRequests(JSON.parse(storedRequests));
      if (storedSearches) setRecentSearches(JSON.parse(storedSearches));
      if (storedUser) setUserPhone(storedUser);
    } catch (e) {
      console.error("Failed to load local storage state:", e);
    }
    currentUserRef.current = storedUser;
    setIsHydrated(true);

    let activeProducts = PRODUCTS;

    // Fetch dynamic products from Supabase
    fetchProducts().then(async (dbProducts) => {
      if (dbProducts && dbProducts.length > 0) {
        setProducts(dbProducts);
        activeProducts = dbProducts;
      }

      // If user is logged in, sync their data (cart and orders) from DB
      if (storedUser) {
        syncUserData(storedUser, activeProducts);
      }
    });

    // Fetch default pincode from delivery_settings
    fetchDefaultDeliveryPincode().then(defPin => {
      const pinSetting = defPin || '';
      setDefaultDeliveryPincode(pinSetting);

      // Active session delivery pincode check (if user explicitly entered a pincode during this session)
      let activeSessionPin: string | null = null;
      if (typeof window !== 'undefined') {
        activeSessionPin = sessionStorage.getItem('active_delivery_pincode')?.trim() || null;
      }

      if (activeSessionPin && /^\d{6}$/.test(activeSessionPin)) {
        setCurrentPincodeState(activeSessionPin);
        currentPincodeRef.current = activeSessionPin;
        setIsPincodeReady(true);
        return;
      }

      // Guest Pincode Priority (when not logged in):
      // 1. localStorage.selected_pincode
      // 2. Default pincode from delivery_settings
      if (!currentUserRef.current) {
        let localPin: string | null = null;
        if (typeof window !== 'undefined') {
          localPin = localStorage.getItem('selected_pincode')?.trim() ||
                     localStorage.getItem('user_pincode')?.trim() ||
                     sessionStorage.getItem('selected_delivery_pincode')?.trim() ||
                     null;
        }

        const resolvedGuestPin = localPin || pinSetting;
        if (resolvedGuestPin) {
          setCurrentPincodeState(resolvedGuestPin);
          currentPincodeRef.current = resolvedGuestPin;
          if (localPin && typeof window !== 'undefined') {
            localStorage.setItem('selected_pincode', localPin);
          }
        }
        setIsPincodeReady(true);
      }
    });

    // Subscribe to Supabase authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const prevUserId = currentUserRef.current;
      const currentUserId = session?.user?.id || null;
      currentUserRef.current = currentUserId;

      if (session?.user) {
        const currentUser = session.user;
        setUser(currentUser);

        // Fetch or create profile
        let currentProfile = null;
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

          if (profileError || !profile) {
            // Check if there is an active referral code captured from cookie/localStorage
            let referrerId: string | null = null;
            let activeStoredRefCode: string | null = null;
            try {
              activeStoredRefCode = getStoredReferralCode();
              if (activeStoredRefCode) {
                const referrer = await lookupReferrerByCode(activeStoredRefCode);
                if (referrer && referrer.id !== currentUser.id) {
                  referrerId = referrer.id;
                }
              }
            } catch (refErr) {
              console.warn('Referral attribution check failed:', refErr);
            }

            // Profile does not exist, onboarding step: create profile row
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: currentUser.id,
                email: currentUser.email,
                role: 'user', // Default role set to user
                full_name: currentUser.user_metadata?.full_name || null,
                phone_number: currentUser.phone ? parseInt(currentUser.phone.replace(/\D/g, ''), 10) : null,
                referred_by: referrerId
              })
              .select()
              .single();

            if (!insertError && newProfile) {
              currentProfile = newProfile;
              // If successfully attributed, record referral and clear stored referral code
              if (referrerId) {
                recordReferralSignup(referrerId, currentUser.id, activeStoredRefCode || undefined).catch(() => {});
                clearStoredReferralCode();
              }
            } else {
              console.error('Error creating profile on onboarding:', insertError);
              currentProfile = {
                id: currentUser.id,
                email: currentUser.email,
                role: 'user'
              };
            }
          } else {
            currentProfile = profile;

            // If existing user was never referred and has no orders yet, allow attributing them
            if (!profile.referred_by) {
              try {
                const storedRefCode = getStoredReferralCode();
                if (storedRefCode) {
                  const referrer = await lookupReferrerByCode(storedRefCode);
                  if (referrer && referrer.id !== currentUser.id) {
                    const { count } = await supabase
                      .from('orders')
                      .select('*', { count: 'exact', head: true })
                      .eq('user_id', currentUser.id);

                    if (count === 0) {
                      const { error: updateRefErr } = await supabase
                        .from('profiles')
                        .update({ referred_by: referrer.id })
                        .eq('id', currentUser.id);

                      if (!updateRefErr) {
                        currentProfile.referred_by = referrer.id;
                        recordReferralSignup(referrer.id, currentUser.id, storedRefCode).catch(() => {});
                        clearStoredReferralCode();
                      }
                    }
                  }
                }
              } catch (existingRefErr) {
                console.warn('Attribution for existing unpurchased user failed:', existingRefErr);
              }
            }
          }
        } catch (e) {
          console.error('Failed to sync profile:', e);
        }

        setUserProfile(currentProfile);
        setUserPhone(currentUser.id);
        localStorage.setItem('sbs_user_phone', currentUser.id);

        // Fetch shipping addresses and synchronize pincode according to priority
        const addresses = await fetchShippingAddresses(currentUser.id);
        const activeDefaultPin = defaultDeliveryPincode || await fetchDefaultDeliveryPincode();
        const shouldMerge = prevUserId === null || prevUserId !== currentUser.id;
        if (shouldMerge && addresses && addresses.length > 0 && typeof window !== 'undefined') {
          sessionStorage.removeItem('active_delivery_pincode');
        }
        await syncPincodeOnAuth(currentUser, currentProfile, addresses, activeDefaultPin);

        // Fetch and merge cart & orders for this user
        await syncUserData(currentUser.id, activeProducts, true);

        // Fetch Banarasi Coins wallet asynchronously
        fetchUserWallet(currentUser.id).then(w => {
          if (w) setUserWallet(w);
        }).catch(err => {
          console.warn('Initial wallet fetch error:', err);
        });

        // Close auth modal smoothly upon successful login
        setIsAuthModalOpen(false);

        // Sync FCM token if notification permission is granted
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          navigator.serviceWorker.ready.then(async (registration) => {
            try {
              const { getFCMToken, saveFCMTokenToSupabase } = await import("../lib/firebase/messaging");
              const token = await getFCMToken(registration);
              if (token) {
                await saveFCMTokenToSupabase(token, currentUser.id);
              }
            } catch (err) {
              console.error("[FCM] Error syncing FCM token on auth change:", err);
            }
          });
        }

        // Clean up URL hash/search without full page reload if redirected from OAuth
        if (typeof window !== 'undefined' && (
          window.location.hash.includes('access_token') || 
          window.location.hash.includes('id_token') ||
          window.location.search.includes('code=')
        )) {
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('code');
          cleanUrl.searchParams.delete('state');
          cleanUrl.hash = '';
          window.history.replaceState(null, '', cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ''));
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setUserWallet(null);
        setShippingAddresses([]);
        setShippingAddressesLoaded(false);
        currentUserRef.current = null;
        if (prevUserId !== null || event === 'SIGNED_OUT') {
          setOrders([]);
          setCart([]);
          setWishlist([]);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('sbs_cart');
            localStorage.removeItem('sbs_wishlist');
            localStorage.removeItem('sbs_user_phone');
          }

          // Reset to Guest Pincode Priority on signout
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('active_delivery_pincode');
          }
          const guestPin = typeof window !== 'undefined' ? localStorage.getItem('selected_pincode')?.trim() : null;
          const fallbackPin = guestPin || defaultDeliveryPincode || '';
          if (fallbackPin) {
            setCurrentPincodeState(fallbackPin);
            currentPincodeRef.current = fallbackPin;
          }

          // Disassociate FCM token
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            navigator.serviceWorker.ready.then(async (registration) => {
              try {
                const { getFCMToken, disassociateFCMTokenInSupabase } = await import("../lib/firebase/messaging");
                const token = await getFCMToken(registration);
                if (token) {
                  await disassociateFCMTokenInSupabase(token);
                }
              } catch (err) {
                console.error("[FCM] Error disassociating FCM token on signout:", err);
              }
            });
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Categories Dexie.js + IndexedDB Cache-First Synchronization ─────────────
  useEffect(() => {
    let isCategoryMounted = true;

    // 1. Subscribe to reactive category cache updates
    const unsubscribeCategories = subscribeToCategoryUpdates((updatedCategories) => {
      if (isCategoryMounted && updatedCategories.length > 0) {
        setCategories(updatedCategories);
        setIsCategoriesLoading(false);
        try {
          localStorage.setItem('sbs_categories_cache', JSON.stringify(updatedCategories));
        } catch {}
      }
    });

    // 2. Load cached categories immediately with 0ms delay
    getValidCachedCategories()
      .then((cached) => {
        if (!isCategoryMounted) return;
        if (cached && cached.length > 0) {
          setCategories(cached);
          setIsCategoriesLoading(false);
          try {
            localStorage.setItem('sbs_categories_cache', JSON.stringify(cached));
          } catch {}
          // Background check: verify if Supabase has newer updated_at / changes
          checkForCategorySupabaseUpdatesAndSync().catch(() => {});
        } else {
          // Cache miss (first visit): fetch from Supabase and save to Dexie & localStorage
          syncCategories({ force: true })
            .then((freshCategories) => {
              if (isCategoryMounted && freshCategories.length > 0) {
                setCategories(freshCategories);
                try {
                  localStorage.setItem('sbs_categories_cache', JSON.stringify(freshCategories));
                } catch {}
              }
              setIsCategoriesLoading(false);
            })
            .catch((err) => {
              console.error('Error syncing categories:', err);
              setIsCategoriesLoading(false);
            });
        }
      })
      .catch((err) => {
        console.error('Error reading cached categories:', err);
        fetchCategories()
          .then((cats) => {
            if (isCategoryMounted && cats.length > 0) {
              setCategories(cats);
              try {
                localStorage.setItem('sbs_categories_cache', JSON.stringify(cats));
              } catch {}
            }
            setIsCategoriesLoading(false);
          })
          .catch(() => setIsCategoriesLoading(false));
      });

    // 3. Tab visibility / focus listener to detect admin updates
    const handleCategoryVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkForCategorySupabaseUpdatesAndSync().catch(() => {});
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', handleCategoryVisibility);
      window.addEventListener('focus', handleCategoryVisibility);
    }

    return () => {
      isCategoryMounted = false;
      unsubscribeCategories();
      if (typeof window !== 'undefined') {
        window.removeEventListener('visibilitychange', handleCategoryVisibility);
        window.removeEventListener('focus', handleCategoryVisibility);
      }
    };
  }, []);

  // Setup foreground notifications listener
  useEffect(() => {
    let unsubscribeFCM: (() => void) | null = null;

    const setupFCM = async () => {
      try {
        const { isMessagingSupported, registerForegroundMessageHandler } = await import("../lib/firebase/messaging");
        const supported = await isMessagingSupported();
        if (!supported) return;

        unsubscribeFCM = await registerForegroundMessageHandler((payload) => {
          const title = payload.notification?.title || payload.data?.title || "Notification";
          const body = payload.notification?.body || payload.data?.body || "";
          const url = payload.data?.url || payload.notification?.url || "";

          showToast(`🔔 ${title}: ${body}`, "info", url ? {
            label: "View",
            onClick: () => {
              if (typeof window !== "undefined") {
                window.location.href = url;
              }
            }
          } : undefined);
        }) || null;
      } catch (err) {
        console.error("[FCM] Error initializing foreground listener:", err);
      }
    };

    setupFCM();

    return () => {
      if (unsubscribeFCM) {
        unsubscribeFCM();
      }
    };
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('sbs_cart', JSON.stringify(cart));
  }, [cart, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('sbs_wishlist', JSON.stringify(wishlist));
  }, [wishlist, isHydrated]);


  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('sbs_custom_requests', JSON.stringify(customRequests));
  }, [customRequests, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('sbs_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (userPhone) {
      localStorage.setItem('sbs_user_phone', userPhone);
    } else {
      localStorage.removeItem('sbs_user_phone');
    }
  }, [userPhone, isHydrated]);

  const getItemAddonsKey = (addons?: SelectedAddon[]) => {
    return (addons || []).map(a => `${a.id}:${a.size || ''}`).sort().join('|');
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1, selectedAddons?: SelectedAddon[]) => {
    const isCartEmpty = cart.length === 0;

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(item => item.product.id === product.id);

      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        const existing = newCart[existingItemIndex];
        const nextAddons = selectedAddons !== undefined ? selectedAddons : (existing.selectedAddons || []);
        const addonsTotal = nextAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
        newCart[existingItemIndex] = {
          ...existing,
          quantity: Math.max(existing.quantity, quantity),
          selectedAddons: nextAddons,
          addonsTotal
        };
        return newCart;
      }
      const addons = selectedAddons || [];
      const addonsTotal = addons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      return [...prevCart, { product, quantity, selectedAddons: addons, addonsTotal }];
    });

    // GA4 Event: add_to_cart
    trackAddToCart(product, quantity);

    const isUuid = userPhone ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userPhone) : false;
    if (userPhone && isUuid) {
      upsertDbCartItem(userPhone, product.id, quantity);
    }
    
    if (isCartEmpty) {
      setIsCartOpen(true);
    } else {
      showToast('Added to bag', 'cart', {
        label: 'View',
        onClick: () => setIsCartOpen(true)
      });
    }
  };

  const updateCartItemAddons = (productId: string, selectedAddons: SelectedAddon[]) => {
    const addonsTotal = (selectedAddons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    setCart((prevCart) =>
      prevCart.map(item => {
        if (item.product.id === productId) {
          return {
            ...item,
            selectedAddons,
            addonsTotal
          };
        }
        return item;
      })
    );
  };

  const removeCartItemAddon = (productId: string, addonId: string) => {
    setCart((prevCart) =>
      prevCart.map(item => {
        if (item.product.id !== productId) return item;
        const newAddons = (item.selectedAddons || []).filter(a => a.id !== addonId);
        const newTotal = newAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
        return {
          ...item,
          selectedAddons: newAddons,
          addonsTotal: newTotal
        };
      })
    );
  };

  const removeFromCart = (productId: string, addonsKey?: string) => {
    const targetItem = cart.find(item => {
      if (addonsKey !== undefined) {
        return item.product.id === productId && getItemAddonsKey(item.selectedAddons) === addonsKey;
      }
      return item.product.id === productId;
    });
    if (targetItem) {
      trackRemoveFromCart(targetItem.product, targetItem.quantity);
    }

    setCart((prevCart) => prevCart.filter(item => {
      if (addonsKey !== undefined) {
        return !(item.product.id === productId && getItemAddonsKey(item.selectedAddons) === addonsKey);
      }
      return item.product.id !== productId;
    }));
    const isUuid = userPhone ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userPhone) : false;
    if (userPhone && isUuid) {
      deleteDbCartItem(userPhone, productId);
    }
  };

  const updateCartQuantity = (productId: string, quantity: number, addonsKey?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, addonsKey);
      return;
    }
    setCart((prevCart) =>
      prevCart.map(item => {
        if (addonsKey !== undefined) {
          return (item.product.id === productId && getItemAddonsKey(item.selectedAddons) === addonsKey)
            ? { ...item, quantity }
            : item;
        }
        return item.product.id === productId ? { ...item, quantity } : item;
      })
    );
    const isUuid = userPhone ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userPhone) : false;
    if (userPhone && isUuid) {
      upsertDbCartItem(userPhone, productId, quantity);
    }
  };

  const clearCart = () => {
    setCart([]);
    const isUuid = userPhone ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userPhone) : false;
    if (userPhone && isUuid) {
      clearDbCart(userPhone);
    }
  };

  // Wishlist operations
  const toggleWishlist = (product: Product) => {
    const exists = wishlist.some(item => item.id === product.id);
    
    if (!exists) {
      // GA4 Event: add_to_wishlist
      trackAddToWishlist(product);
      showToast('Added to wishlist', 'info');
    } else {
      showToast('Removed from wishlist', 'info');
    }

    setWishlist((prev) => {
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });

    const isUuid = userPhone ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userPhone) : false;
    if (userPhone && isUuid) {
      if (exists) {
        removeFromDbWishlist(userPhone, product.id);
      } else {
        addToDbWishlist(userPhone, product.id);
      }
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.id === productId);
  };

  // Place order
  const placeOrder = async (orderData: Omit<Order, 'orderId' | 'orderStatus' | 'paymentStatus' | 'createdAt'> & {
    customer_name?: string;
    customer_phone?: string;
    shipping_address?: any;
    notes?: string;
    coupon_code?: string;
    delivery_option?: string;
    delivery_method?: string;
    shipping_charge?: number;
    estimated_delivery_date?: string | null;
    coins_redeemed?: number;
    referral_code?: string;
  }): Promise<Order> => {
    // 1. Try to create the order in Supabase via create-order Edge Function
    const dbOrder = await createDbOrder({
      customer: orderData.customer,
      customer_name: orderData.customer_name || orderData.customer?.name,
      customer_phone: orderData.customer_phone || orderData.customer?.phone,
      shipping_address: orderData.shipping_address || orderData.customer,
      notes: orderData.notes,
      coupon_code: orderData.coupon_code,
      delivery_option: orderData.delivery_option,
      delivery_method: orderData.delivery_method,
      shipping_charge: orderData.shipping_charge ?? orderData.shipping,
      estimated_delivery_date: orderData.estimated_delivery_date,
      items: orderData.items,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      shipping: orderData.shipping,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      is_gift: orderData.is_gift,
      gift_recipient_name: orderData.gift_recipient_name,
      gift_message: orderData.gift_message,
      gift_wrap_charge: orderData.gift_wrap_charge,
      coins_redeemed: orderData.coins_redeemed || 0,
      referral_code: orderData.referral_code
    }, user?.id);

    if (dbOrder) {
      // 2. Add to orders state
      setOrders((prev) => [dbOrder, ...prev]);

      // 3. Refresh user coin wallet if coins redeemed
      if (orderData.coins_redeemed && orderData.coins_redeemed > 0) {
        refreshWallet().catch(err => console.warn('Could not refresh wallet after order:', err));
      }
      
      // 4. Clear cart
      setCart([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sbs_cart');
      }
      const isUuid = userPhone ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userPhone) : false;
      if (userPhone && isUuid) {
        await clearDbCart(userPhone);
      }
      
      return dbOrder;
    }

    // If DB insert fails, throw error so user is notified and cart is preserved
    throw new Error('We were unable to confirm your order with the server. Please check your connection and try again.');
  };

  // Instantly mark an order as cancelled in local state without full page reload
  const markOrderCancelledLocally = (orderIdOrNumber: string) => {
    setOrders(prevOrders => 
      prevOrders.map(o => {
        if (o.orderId === orderIdOrNumber || o.id === orderIdOrNumber) {
          const nowStr = new Date().toISOString();
          const newHistory: OrderStatusHistoryEntry = {
            id: `cancelled-${Date.now()}`,
            orderId: o.id || o.orderId,
            status: 'cancelled',
            note: 'Order cancelled by customer',
            createdAt: nowStr
          };
          return {
            ...o,
            orderStatus: 'Cancelled',
            statusHistory: o.statusHistory ? [...o.statusHistory, newHistory] : [newHistory]
          };
        }
        return o;
      })
    );
  };

  // Re-fetch orders from Supabase DB to sync orders state
  const refreshOrders = async () => {
    try {
      const identifier = user?.id || (userProfile?.phone_number ? String(userProfile.phone_number) : (user?.phone || userPhone));
      const phoneLookup = userProfile?.phone_number ? String(userProfile.phone_number) : (user?.phone || null);
      if (identifier) {
        const freshOrders = await fetchDbOrders(identifier, phoneLookup);
        setOrders(freshOrders || []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error refreshing orders in StoreContext:', err);
    }
  };

  // Cancel order
  const cancelOrder = async (orderId: string): Promise<boolean> => {
    const success = await cancelDbOrder(orderId);
    if (success) {
      markOrderCancelledLocally(orderId);
    }
    return success;
  };

  // Cancel order item
  const cancelOrderItem = async (orderId: string, productId: string): Promise<{ success: boolean; cancelledEntireOrder: boolean; newSubtotal?: number; newTotal?: number; message?: string }> => {
    let res = await cancelDbOrderItem(orderId, productId);

    const matchFn = (item: any) =>
      item.product?.id === productId ||
      item.product?.sku === productId ||
      item.id === productId ||
      item.inventory_id === productId;

    // Fallback if DB operation failed or order is locally cached
    const localOrder = orders.find(o => o.orderId === orderId || o.id === orderId);
    if (!res.success && localOrder) {
      const remainingActiveItems = localOrder.items.filter(item => {
        const isCancelled = item.item_status === 'cancelled' || (item.product as any)?.item_status === 'cancelled';
        return !isCancelled && !matchFn(item);
      });
      const cancelledEntireOrder = remainingActiveItems.length === 0;
      const removedItem = localOrder.items.find(matchFn);
      const removedPrice = removedItem ? (removedItem.product?.salePrice || removedItem.product?.price || 0) * (removedItem.quantity || 1) : 0;
      const newSubtotal = Math.max(0, localOrder.subtotal - removedPrice);
      const newTotal = Math.max(0, localOrder.total - removedPrice);
      res = { success: true, cancelledEntireOrder, newSubtotal, newTotal };
    }

    if (res.success) {
      setOrders(prevOrders => 
        prevOrders.map(o => {
          if (o.orderId === orderId || o.id === orderId) {
            const nowStr = new Date().toISOString();
            const targetItem = o.items.find(matchFn);
            const productName = targetItem?.product?.name || 'item';
            const qty = targetItem?.quantity || 1;
            
            const newHistory: OrderStatusHistoryEntry = {
              id: `item-cancelled-${Date.now()}`,
              orderId,
              status: res.cancelledEntireOrder ? 'cancelled' : 'item_cancelled',
              note: res.cancelledEntireOrder
                ? `Cancelled "${productName}" (all items cancelled; order cancelled)`
                : `Cancelled "${productName}" (Qty ${qty}) from order`,
              createdAt: nowStr
            };

            const updatedItems = o.items.map(item => {
              if (matchFn(item)) {
                return {
                  ...item,
                  item_status: 'cancelled',
                  product: {
                    ...item.product,
                    item_status: 'cancelled'
                  }
                };
              }
              return item;
            });

            return {
              ...o,
              orderStatus: res.cancelledEntireOrder ? ('Cancelled' as const) : o.orderStatus,
              subtotal: res.newSubtotal ?? o.subtotal,
              total: res.newTotal ?? o.total,
              items: updatedItems,
              statusHistory: o.statusHistory ? [...o.statusHistory, newHistory] : [newHistory]
            };
          }
          return o;
        })
      );
    }
    return {
      success: res.success,
      cancelledEntireOrder: res.cancelledEntireOrder,
      newSubtotal: res.newSubtotal,
      newTotal: res.newTotal,
      message: (res as any).message
    };
  };

  // Custom request
  const addCustomRequest = (request: Omit<CustomRequest, 'id' | 'status' | 'createdAt'>) => {
    const id = `SBS-CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRequest: CustomRequest = {
      ...request,
      id,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    setCustomRequests((prev) => [newRequest, ...prev]);
  };

  // Advanced search logic
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const detectedFilters = parseSearchQuery(searchQuery);
    return scoreProducts(products, searchQuery, detectedFilters);
  };

  const addRecentSearch = (query: string) => {
    if (!query.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter(s => s !== query);
      return [query, ...filtered].slice(0, 5); // Keep last 5 searches
    });
  };

  const removeRecentSearch = (query: string) => {
    setRecentSearches((prev) => prev.filter(s => s !== query));
  };

  const clearRecentSearches = () => setRecentSearches([]);

  // Auth sync helper
  const loginUser = async (userId: string) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    const cleanDigits = userId ? userId.replace(/\D/g, '') : '';
    const isPhone = cleanDigits.length === 10;
    if (!isUuid && !isPhone) return;

    setUserPhone(isPhone ? cleanDigits : userId);
    if (!isUuid) return;

    // Sync local storage cart to DB
    const currentCart = [...cart];
    for (const item of currentCart) {
      await upsertDbCartItem(userId, item.product.id, item.quantity);
    }

    // Fetch and merge final cart items from DB
    const freshDbCart = await fetchDbCart(userId);
    const finalCartItems: CartItem[] = [];

    for (const dbItem of freshDbCart) {
      const product = products.find(p => p.id === dbItem.product_id);
      if (product) {
        const localMatch = currentCart.find(l => l.product?.id === dbItem.product_id);
        finalCartItems.push({
          product,
          quantity: dbItem.quantity,
          selectedAddons: localMatch?.selectedAddons || [],
          addonsTotal: localMatch?.addonsTotal || 0
        });
      }
    }

    if (finalCartItems.length > 0 || freshDbCart.length > 0) {
      setCart(finalCartItems);
    }

    // Fetch user orders from DB using UUID and phone
    const phoneLookup = userProfile?.phone_number ? String(userProfile.phone_number) : (user?.phone || null);
    const dbOrders = await fetchDbOrders(userId, phoneLookup);
    setOrders(dbOrders || []);
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : `${process.env.NEXT_PUBLIC_SITE_URL || ''}/account`,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    if (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: { full_name?: string | null; phone_number?: number | null }) => {
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: updates.full_name,
        phone_number: updates.phone_number
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    if (updates.full_name) {
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: { full_name: updates.full_name }
      });
      if (!authError && authData?.user) {
        setUser(authData.user);
      }
    }

    if (data) {
      setUserProfile(data);
    }
  };

  const fetchShippingAddresses = async (userId: string): Promise<any[]> => {
    setShippingAddressesLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching shipping addresses:', error);
        return [];
      } else if (data) {
        setShippingAddresses(data);
        return data;
      }
      return [];
    } finally {
      setShippingAddressesLoading(false);
      setShippingAddressesLoaded(true);
    }
  };

  const saveShippingAddress = async (addr: any) => {
    if (!user) throw new Error('User not authenticated');
    
    // If setting this address as default, unset other defaults first
    if (addr.is_default) {
      await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const payload = {
      user_id: user.id,
      address_label: addr.address_label || 'Home',
      full_name: addr.full_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || null,
      landmark: addr.landmark || null,
      city: addr.city,
      district: addr.district || null,
      state: addr.state,
      pincode: addr.pincode,
      latitude: addr.latitude || null,
      longitude: addr.longitude || null,
      is_default: addr.is_default || false,
      updated_at: new Date().toISOString()
    };

    let result;
    if (addr.id) {
      // Update
      result = await supabase
        .from('shipping_addresses')
        .update(payload)
        .eq('id', addr.id)
        .select()
        .single();
    } else {
      // Insert
      result = await supabase
        .from('shipping_addresses')
        .insert({
          ...payload,
          id: crypto.randomUUID()
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving shipping address:', result.error);
      throw result.error;
    }

    // Refresh addresses list
    const freshAddrs = await fetchShippingAddresses(user.id);

    // If this address is default or the only address, keep profiles.default_pincode and currentPincode synchronized
    if (addr.is_default || freshAddrs.length === 1) {
      if (addr.pincode) {
        const cleanPin = String(addr.pincode).trim();
        setCurrentPincodeState(cleanPin);
        currentPincodeRef.current = cleanPin;
        await updateProfileDefaultPincode(user.id, cleanPin);
        if (userProfile) {
          userProfile.default_pincode = cleanPin;
          setUserProfile({ ...userProfile });
        }
      }
    }

    return result.data;
  };

  const deleteShippingAddress = async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('shipping_addresses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting address:', error);
      throw error;
    }

    // Refresh addresses list
    const freshAddrs = await fetchShippingAddresses(user.id);

    // Re-evaluate authoritative address
    const defaultAddr = freshAddrs.find(a => a.is_default) || (freshAddrs.length > 0 ? freshAddrs[0] : null);
    if (defaultAddr?.pincode) {
      const cleanPin = String(defaultAddr.pincode).trim();
      setCurrentPincodeState(cleanPin);
      currentPincodeRef.current = cleanPin;
      await updateProfileDefaultPincode(user.id, cleanPin);
      if (userProfile) {
        userProfile.default_pincode = cleanPin;
        setUserProfile({ ...userProfile });
      }
    } else {
      // If no addresses remain, fallback to profiles.default_pincode or delivery_settings
      const profilePin = userProfile?.default_pincode ? String(userProfile.default_pincode).trim() : null;
      const nextPin = profilePin || defaultDeliveryPincode || '';
      if (nextPin) {
        setCurrentPincodeState(nextPin);
        currentPincodeRef.current = nextPin;
      }
    }
  };

  const setDefaultShippingAddress = async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    
    // Unset all defaults
    await supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Set this one as default
    const { error } = await supabase
      .from('shipping_addresses')
      .update({ is_default: true })
      .eq('id', id);

    if (error) {
      console.error('Error setting default address:', error);
      throw error;
    }

    // Refresh addresses list
    const freshAddrs = await fetchShippingAddresses(user.id);
    const target = freshAddrs.find(a => a.id === id);
    if (target?.pincode) {
      const cleanPin = String(target.pincode).trim();
      setCurrentPincodeState(cleanPin);
      currentPincodeRef.current = cleanPin;
      await updateProfileDefaultPincode(user.id, cleanPin);
      if (userProfile) {
        userProfile.default_pincode = cleanPin;
        setUserProfile({ ...userProfile });
      }
    }
  };

  const logoutUser = async () => {
    setUserPhone(null);
    setUser(null);
    setUserProfile(null);
    setShippingAddresses([]);
    setCart([]);
    setOrders([]);
    setWishlist([]);
    setUserWallet(null);
    localStorage.removeItem('sbs_orders');
    localStorage.removeItem('sbs_user_phone');
    localStorage.removeItem('sbs_wishlist');
    await supabase.auth.signOut();

    // Reset to guest priority (localStorage.selected_pincode or delivery_settings default)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('active_delivery_pincode');
    }
    const guestPin = typeof window !== 'undefined' ? localStorage.getItem('selected_pincode')?.trim() : null;
    const fallbackPin = guestPin || defaultDeliveryPincode || '';
    if (fallbackPin) {
      setCurrentPincodeState(fallbackPin);
      currentPincodeRef.current = fallbackPin;
    }

    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const refreshWallet = async () => {
    if (!currentUserRef.current) {
      setUserWallet(null);
      return;
    }
    setUserWalletLoading(true);
    try {
      const wallet = await fetchUserWallet(currentUserRef.current);
      setUserWallet(wallet);
    } catch (err) {
      console.error('Error refreshing wallet:', err);
    } finally {
      setUserWalletLoading(false);
    }
  };

  return (
    <StoreContext.Provider value={{
      products,
      categories,
      isCategoriesLoading,
      cart,
      wishlist,
      orders,
      customRequests,
      addToCart,
      updateCartItemAddons,
      removeCartItemAddon,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      toggleWishlist,
      isInWishlist,
      placeOrder,
      cancelOrder,
      cancelOrderItem,
      markOrderCancelledLocally,
      refreshOrders,
      addCustomRequest,
      searchQuery,
      setSearchQuery,
      getSearchResults,
      recentSearches,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches,
      userPhone,
      loginUser,
      logoutUser,
      user,
      userProfile,
      userWallet,
      userWalletLoading,
      refreshWallet,
      loginWithGoogle,
      updateUserProfile,
      shippingAddresses,
      shippingAddressesLoading,
      shippingAddressesLoaded,
      fetchShippingAddresses,
      saveShippingAddress,
      deleteShippingAddress,
      setDefaultShippingAddress,
      isHydrated,
      isCartOpen,
      setIsCartOpen,
      isAuthModalOpen,
      setIsAuthModalOpen,
      deliveryInfo,
      setDeliveryInfo,
      customerCoords,
      setCustomerCoords,
      checkedPincode: currentPincode,
      setCheckedPincode,
      currentPincode,
      setCurrentPincode,
      defaultDeliveryPincode,
      isPincodeReady,
      toast,
      showToast
    }}>
      {children}
      {toast && (
        <ToastNotification 
          message={toast.message} 
          type={toast.type}
          action={toast.action}
          onClose={() => setToast(null)} 
        />
      )}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
