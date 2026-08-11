"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, PRODUCTS } from '../data/products';

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
  orderStatus: 'Order Placed' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered';
  createdAt: string;
}

interface StoreContextType {
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
  placeOrder: (orderData: Omit<Order, 'orderId' | 'orderStatus' | 'paymentStatus' | 'createdAt'>) => Order;
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
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('sbs_cart');
      const storedWishlist = localStorage.getItem('sbs_wishlist');
      const storedOrders = localStorage.getItem('sbs_orders');
      const storedRequests = localStorage.getItem('sbs_custom_requests');
      const storedSearches = localStorage.getItem('sbs_recent_searches');
      const storedUser = localStorage.getItem('sbs_user_phone');

      if (storedCart) setCart(JSON.parse(storedCart));
      if (storedWishlist) setWishlist(JSON.parse(storedWishlist));
      if (storedOrders) setOrders(JSON.parse(storedOrders));
      if (storedRequests) setCustomRequests(JSON.parse(storedRequests));
      if (storedSearches) setRecentSearches(JSON.parse(storedSearches));
      if (storedUser) setUserPhone(storedUser);
    } catch (e) {
      console.error("Failed to load local storage state:", e);
    }
    setIsHydrated(true);
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
    localStorage.setItem('sbs_orders', JSON.stringify(orders));
  }, [orders, isHydrated]);

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
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(item => item.product.id === product.id);
      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      }
      return [...prevCart, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter(item => item.product.id !== productId));
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
  };

  const clearCart = () => setCart([]);

  // Wishlist operations
  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.id === productId);
  };

  // Place order
  const placeOrder = (orderData: Omit<Order, 'orderId' | 'orderStatus' | 'paymentStatus' | 'createdAt'>) => {
    const orderId = `SBS-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      ...orderData,
      orderId,
      orderStatus: 'Order Placed',
      paymentStatus: orderData.paymentMethod === 'Online Payment' ? 'Paid' : 'Pending',
      createdAt: new Date().toISOString()
    };
    
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
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

  // Search logic
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.fabric.toLowerCase().includes(query) ||
      p.color.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.occasion.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query)
    );
  };

  const addRecentSearch = (query: string) => {
    if (!query.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter(s => s !== query);
      return [query, ...filtered].slice(0, 5); // Keep last 5 searches
    });
  };

  const clearRecentSearches = () => setRecentSearches([]);

  // Auth placeholder
  const loginUser = (phone: string) => setUserPhone(phone);
  const logoutUser = () => setUserPhone(null);

  return (
    <StoreContext.Provider value={{
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
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
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
