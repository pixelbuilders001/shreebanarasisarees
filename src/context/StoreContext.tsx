"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, PRODUCTS } from '../data/products';
import { X, ShoppingBag } from 'lucide-react';
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
  removeFromDbWishlist
} from '../data/supabase';
import { trackAddToCart, trackRemoveFromCart, trackAddToWishlist } from '../lib/gtag';
import { parseSearchQuery, scoreProducts } from '../lib/searchEngine';

export interface CartItem {
  product: Product;
  quantity: number;
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

export interface Order {
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
  paymentMethod: 'UPI' | 'Cash on Delivery' | 'Online Payment';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  orderStatus: 'Order Placed' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  createdAt: string;
  statusHistory?: OrderStatusHistoryEntry[];
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
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  placeOrder: (orderData: Omit<Order, 'orderId' | 'orderStatus' | 'paymentStatus' | 'createdAt'>) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  cancelOrderItem: (orderId: string, productId: string) => Promise<{ success: boolean; cancelledEntireOrder: boolean }>;
  addCustomRequest: (request: Omit<CustomRequest, 'id' | 'status' | 'createdAt'>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getSearchResults: () => Product[];
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  userPhone: string | null;
  loginUser: (phone: string) => void;
  logoutUser: () => void;
  user: any | null;
  userProfile: any | null;
  loginWithGoogle: () => Promise<void>;
  updateUserProfile: (updates: { full_name?: string | null; phone_number?: number | null }) => Promise<void>;
  shippingAddresses: any[];
  fetchShippingAddresses: (userId: string) => Promise<void>;
  saveShippingAddress: (address: any) => Promise<void>;
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
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-toast-slide-down {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center justify-between gap-3 bg-[#FFF9F0] border border-gold/45 text-dark-brown px-4 py-3 rounded-xl shadow-lg animate-toast-slide-down sm:max-w-md w-auto sm:w-full">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-maroon/10 text-maroon flex-shrink-0">
            {type === 'cart' ? <ShoppingBag size={15} /> : <span className="text-sm">🔔</span>}
          </div>
          <p className="text-xs sm:text-sm font-medium font-sans">{message}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {action && (
            <button
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className="text-[10px] sm:text-xs font-serif font-bold text-maroon hover:underline px-2 py-1"
            >
              {action.label}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-dark-brown/40 hover:text-dark-brown p-1"
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </>
  );
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [shippingAddresses, setShippingAddresses] = useState<any[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryCheckResult | null>(null);
  const [customerCoords, setCustomerCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [checkedPincode, setCheckedPincode] = useState<string>('');
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

      if (isUuid) {
        dbCartItems = await fetchDbCart(identifier);
        dbWishlistProductIds = await fetchDbWishlist(identifier);

        if (shouldMerge) {
          // Merge Cart
          let localCartItems: CartItem[] = [];
          try {
            const stored = localStorage.getItem('sbs_cart');
            if (stored) {
              localCartItems = JSON.parse(stored);
            }
          } catch (e) {
            console.error('Failed to parse stored cart:', e);
          }

          if (localCartItems.length > 0) {
            for (const localItem of localCartItems) {
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

          // Merge Wishlist
          let localWishlistItems: Product[] = [];
          try {
            const stored = localStorage.getItem('sbs_wishlist');
            if (stored) {
              localWishlistItems = JSON.parse(stored);
            }
          } catch (e) {
            console.error('Failed to parse stored wishlist:', e);
          }

          if (localWishlistItems.length > 0) {
            for (const localItem of localWishlistItems) {
              const dbMatch = dbWishlistProductIds.includes(localItem.id);
              if (!dbMatch) {
                await addToDbWishlist(identifier, localItem.id);
                dbWishlistProductIds.push(localItem.id);
              }
            }
          }
        }
      }

      if (isUuid && dbCartItems && dbCartItems.length > 0) {
        const finalCartItems: CartItem[] = [];
        for (const dbItem of dbCartItems) {
          const product = activeProds.find(p => p.id === dbItem.product_id);
          if (product) {
            finalCartItems.push({
              product,
              quantity: dbItem.quantity
            });
          }
        }
        setCart(finalCartItems);
        localStorage.setItem('sbs_cart', JSON.stringify(finalCartItems));
      } else if (isUuid) {
        setCart([]);
        localStorage.setItem('sbs_cart', JSON.stringify([]));
      }

      // Populate wishlist from DB
      if (isUuid && dbWishlistProductIds && dbWishlistProductIds.length > 0) {
        const finalWishlistItems: Product[] = [];
        for (const pid of dbWishlistProductIds) {
          const product = activeProds.find(p => p.id === pid);
          if (product) {
            finalWishlistItems.push(product);
          }
        }
        setWishlist(finalWishlistItems);
        localStorage.setItem('sbs_wishlist', JSON.stringify(finalWishlistItems));
      } else if (isUuid) {
        setWishlist([]);
        localStorage.setItem('sbs_wishlist', JSON.stringify([]));
      }

      const dbOrders = await fetchDbOrders(identifier);
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

    // Fetch dynamic categories from Supabase
    fetchCategories().then(dbCategories => {
      if (dbCategories && dbCategories.length > 0) {
        setCategories(dbCategories);
      }
      setIsCategoriesLoading(false);
    }).catch(err => {
      console.error('Error fetching categories:', err);
      setIsCategoriesLoading(false);
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
            // Profile does not exist, onboarding step: create profile row
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: currentUser.id,
                email: currentUser.email,
                role: 'user', // Default role set to user
                full_name: currentUser.user_metadata?.full_name || null,
                phone_number: currentUser.phone ? parseInt(currentUser.phone.replace(/\D/g, ''), 10) : null
              })
              .select()
              .single();

            if (!insertError && newProfile) {
              currentProfile = newProfile;
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
          }
        } catch (e) {
          console.error('Failed to sync profile:', e);
        }

        setUserProfile(currentProfile);
        setUserPhone(currentUser.id);
        localStorage.setItem('sbs_user_phone', currentUser.id);

        // Fetch shipping addresses
        fetchShippingAddresses(currentUser.id).catch(err => {
          console.error('Error fetching shipping addresses:', err);
        });

        // Fetch and merge cart & orders for this user
        // We only merge if the user just signed in (i.e. transitioned from anonymous to logged-in)
        const shouldMerge = prevUserId === null;
        await syncUserData(currentUser.id, activeProducts, shouldMerge);

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

        // Clean up URL hash/search and force a reload if redirected from OAuth to sync state cleanly
        if (typeof window !== 'undefined' && (
          window.location.hash.includes('access_token') || 
          window.location.hash.includes('id_token') ||
          window.location.search.includes('code=')
        )) {
          window.history.replaceState(null, '', window.location.pathname);
          window.location.reload();
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setShippingAddresses([]);
        if (prevUserId !== null || event === 'SIGNED_OUT') {
          setOrders([]);
          setCart([]);
          setWishlist([]);

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

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    const isCartEmpty = cart.length === 0;
    const existingItem = cart.find(item => item.product.id === product.id);
    const newQty = existingItem ? existingItem.quantity + quantity : quantity;

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(item => item.product.id === product.id);
      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + quantity
        };
        return newCart;
      }
      return [...prevCart, { product, quantity }];
    });

    // GA4 Event: add_to_cart
    trackAddToCart(product, quantity);

    const isUuid = userPhone ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userPhone) : false;
    if (userPhone && isUuid) {
      upsertDbCartItem(userPhone, product.id, newQty);
    }
    
    if (isCartEmpty) {
      setIsCartOpen(true);
    } else {
      showToast(`Added "${product.name}" to your bag!`, 'cart', {
        label: 'View Bag',
        onClick: () => setIsCartOpen(true)
      });
    }
  };

  const removeFromCart = (productId: string) => {
    const targetItem = cart.find(item => item.product.id === productId);
    if (targetItem) {
      trackRemoveFromCart(targetItem.product, targetItem.quantity);
    }

    setCart((prevCart) => prevCart.filter(item => item.product.id !== productId));
    const isUuid = userPhone ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userPhone) : false;
    if (userPhone && isUuid) {
      deleteDbCartItem(userPhone, productId);
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
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
  const placeOrder = async (orderData: Omit<Order, 'orderId' | 'orderStatus' | 'paymentStatus' | 'createdAt'>): Promise<Order> => {
    // 1. Try to create the order in Supabase
    const dbOrder = await createDbOrder({
      customer: orderData.customer,
      items: orderData.items,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      shipping: orderData.shipping,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      is_gift: orderData.is_gift,
      gift_recipient_name: orderData.gift_recipient_name,
      gift_message: orderData.gift_message,
      gift_wrap_charge: orderData.gift_wrap_charge
    }, user?.id);

    if (dbOrder) {
      // 2. Add to orders state
      setOrders((prev) => [dbOrder, ...prev]);
      
      // 3. Clear cart from database if user is logged in
      const isUuid = userPhone ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userPhone) : false;
      if (userPhone && isUuid) {
        await clearDbCart(userPhone);
      }
      
      return dbOrder;
    }

    // Fallback: If DB insert fails, create client-only fallback order
    const orderId = `SBS-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const fallbackOrder: Order = {
      ...orderData,
      orderId,
      orderStatus: 'Order Placed',
      paymentStatus: orderData.paymentMethod === 'Online Payment' ? 'Paid' : 'Pending',
      createdAt: new Date().toISOString()
    };
    
    setOrders((prev) => [fallbackOrder, ...prev]);
    return fallbackOrder;
  };

  // Cancel order
  const cancelOrder = async (orderId: string): Promise<boolean> => {
    const success = await cancelDbOrder(orderId);
    if (success) {
      setOrders(prevOrders => 
        prevOrders.map(o => {
          if (o.orderId === orderId) {
            const nowStr = new Date().toISOString();
            const newHistory: OrderStatusHistoryEntry = {
              id: `cancelled-${Date.now()}`,
              orderId,
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
    }
    return success;
  };

  // Cancel order item
  const cancelOrderItem = async (orderId: string, productId: string): Promise<{ success: boolean; cancelledEntireOrder: boolean }> => {
    const res = await cancelDbOrderItem(orderId, productId);
    if (res.success) {
      if (res.cancelledEntireOrder) {
        setOrders(prevOrders => 
          prevOrders.map(o => {
            if (o.orderId === orderId) {
              const nowStr = new Date().toISOString();
              const newHistory: OrderStatusHistoryEntry = {
                id: `cancelled-${Date.now()}`,
                orderId,
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
      } else {
        setOrders(prevOrders => 
          prevOrders.map(o => {
            if (o.orderId === orderId) {
              const nowStr = new Date().toISOString();
              const targetItem = o.items.find(item => item.product.id === productId);
              const productName = targetItem?.product.name || 'item';
              const qty = targetItem?.quantity || 1;
              
              const newHistory: OrderStatusHistoryEntry = {
                id: `item-cancelled-${Date.now()}`,
                orderId,
                status: 'item_cancelled',
                note: `Cancelled "${productName}" (Qty ${qty}) from order`,
                createdAt: nowStr
              };
              
              return {
                ...o,
                subtotal: res.newSubtotal ?? o.subtotal,
                total: res.newTotal ?? o.total,
                items: o.items.filter(item => item.product.id !== productId),
                statusHistory: o.statusHistory ? [...o.statusHistory, newHistory] : [newHistory]
              };
            }
            return o;
          })
        );
      }
    }
    return {
      success: res.success,
      cancelledEntireOrder: res.cancelledEntireOrder
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

  const clearRecentSearches = () => setRecentSearches([]);

  // Auth sync helper
  const loginUser = async (userId: string) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return;

    setUserPhone(userId);

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
        finalCartItems.push({
          product,
          quantity: dbItem.quantity
        });
      }
    }

    if (finalCartItems.length > 0 || freshDbCart.length > 0) {
      setCart(finalCartItems);
    }

    // Fetch user orders from DB using UUID
    const dbOrders = await fetchDbOrders(userId);
    if (dbOrders && dbOrders.length > 0) {
      setOrders(dbOrders);
    }
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

  const fetchShippingAddresses = async (userId: string) => {
    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching shipping addresses:', error);
    } else if (data) {
      setShippingAddresses(data);
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
    await fetchShippingAddresses(user.id);
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
    await fetchShippingAddresses(user.id);
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
    await fetchShippingAddresses(user.id);
  };

  const logoutUser = async () => {
    setUserPhone(null);
    setUser(null);
    setUserProfile(null);
    setShippingAddresses([]);
    setCart([]);
    setOrders([]);
    setWishlist([]);
    localStorage.removeItem('sbs_orders');
    localStorage.removeItem('sbs_user_phone');
    localStorage.removeItem('sbs_wishlist');
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
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
      removeFromCart,
      updateCartQuantity,
      clearCart,
      toggleWishlist,
      isInWishlist,
      placeOrder,
      cancelOrder,
      cancelOrderItem,
      addCustomRequest,
      searchQuery,
      setSearchQuery,
      getSearchResults,
      recentSearches,
      addRecentSearch,
      clearRecentSearches,
      userPhone,
      loginUser,
      logoutUser,
      user,
      userProfile,
      loginWithGoogle,
      updateUserProfile,
      shippingAddresses,
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
      checkedPincode,
      setCheckedPincode,
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
