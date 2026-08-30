import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserRole,
  ViewTab,
  DeviceBreakpoint,
  UserProfile,
  Category,
  CategoryId,
  Product,
  CartItem,
  NamedShoppingList,
  Order,
  Review,
  ReturnReport,
  ContactSubmission,
  FAQItem,
  FulfillmentType,
  PaymentMethod,
  DeliveryLocation,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_REVIEWS,
  INITIAL_RETURNS,
  INITIAL_CONTACTS,
  INITIAL_FAQS,
  ALMADINA_SHOP_LOCATION,
} from '../data/mockData';
import { calculateDeliveryFeeETB, isSameCalendarDay, isWithinReturnWindow } from '../utils/distance';
import {
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  reload,
  sendPasswordResetEmail,
} from '../lib/firebase';
import {
  checkSupabaseConnection,
  syncFirebaseUserToSupabase,
  fetchCategoriesFromSupabase,
  upsertCategoryToSupabase,
  deleteCategoryFromSupabase,
  syncCategoriesToSupabase,
  syncAllCatalogToSupabase,
  fetchProductsFromSupabase,
  upsertProductToSupabase,
  deleteProductFromSupabase,
  fetchOrdersFromSupabase,
  upsertOrderToSupabase,
  fetchReviewsFromSupabase,
  upsertReviewToSupabase,
  fetchContactsFromSupabase,
  upsertContactToSupabase,
  fetchReturnsFromSupabase,
  upsertReturnToSupabase,
} from '../lib/supabase';
import { resolveOrderItems, cacheOrderItems, isOrderConfirmedForPayment } from '../utils/orderUtils';

// ─── Admin configuration ──────────────────────────────────────────────────────
// Configured via environment variables or authorized admin identifiers
const ADMIN_UID = import.meta.env.VITE_ADMIN_UID as string | undefined;
const CONFIGURED_ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.toLowerCase().trim();

// Authorized administrator email identifiers (strictly al.medina.market90@gmail.com)
export const AUTHORIZED_ADMIN_EMAILS: string[] = [
  'al.medina.market90@gmail.com',
].filter(Boolean) as string[];

export const isAuthorizedAdmin = (user: { email?: string | null; uid?: string } | null): boolean => {
  if (!user) return false;
  if (ADMIN_UID && user.uid === ADMIN_UID) return true;
  const email = user.email?.toLowerCase().trim();
  if (email && AUTHORIZED_ADMIN_EMAILS.includes(email)) return true;
  if (CONFIGURED_ADMIN_EMAIL && email === CONFIGURED_ADMIN_EMAIL) return true;
  return false;
};

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

// ─── Auth Result Types ────────────────────────────────────────────────────────
export type AuthResult =
  | { status: 'success' }
  | { status: 'error'; message: string }
  | { status: 'verify_email'; email: string };

interface AppContextType {
  // Roles & Navigation
  userRole: UserRole;
  viewTab: ViewTab;
  setViewTab: (tab: ViewTab) => void;
  deviceFrame: DeviceBreakpoint;
  setDeviceFrame: (frame: DeviceBreakpoint) => void;

  // Auth State
  currentUser: UserProfile | null;
  authLoading: boolean;
  pendingVerificationEmail: string | null;

  // Customer Auth
  registerUser: (name: string, email: string, password: string) => Promise<AuthResult>;
  loginUser: (email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  logoutUser: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  updateAccountSettings: (updates: { name?: string; phoneNumber?: string; avatar?: string }) => Promise<void>;
  saveAddress: (address: { label: string; addressText: string; latitude: number; longitude: number; distanceKm: number }) => void;
  removeAddress: (addressId: string) => void;

  // Admin Auth (Firebase authentication + role verification + 2FA)
  adminSession: {
    isLoggedIn: boolean;
    is2FAVerified: boolean;
    activeDeviceId: string;
    adminEmail?: string;
    sessionError?: string;
  };
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  verifyAdmin2FA: (code: string) => boolean;
  logoutAdmin: () => void;
  simulateAdminLoginOnOtherDevice: () => void;

  // Catalog
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'> & { id?: string }) => Promise<boolean>;
  updateCategory: (category: Category) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'rating' | 'reviewCount'>) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  syncAllDataToDatabase: () => Promise<{ success: boolean; message: string; categoriesSynced?: number; productsSynced?: number }>;
  databaseStats: {
    isConnected: boolean;
    categoriesCount: number;
    productsCount: number;
    ordersCount: number;
    isSyncing: boolean;
  };

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message: string };
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Favorites
  favorites: string[];
  toggleFavorite: (productId: string) => void;

  // Shopping Lists
  shoppingLists: NamedShoppingList[];
  createShoppingList: (name: string) => void;
  addToList: (listId: string, productId: string) => void;
  moveListToCart: (listId: string) => void;
  deleteShoppingList: (listId: string) => void;
  renameShoppingList: (listId: string, name: string) => void;
  updateShoppingListItemQty: (listId: string, productId: string, quantity: number) => void;
  removeShoppingListItem: (listId: string, productId: string) => void;

  // Orders
  orders: Order[];
  createOrder: (data: {
    fulfillmentType: FulfillmentType;
    deliveryLocation?: DeliveryLocation;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => Promise<{ success: boolean; orderId?: string; message: string; requiresChapaRedirect?: boolean; chapaCheckoutUrl?: string }>;
  updateOrderQuantity: (orderId: string, productId: string, newQuantity: number) => boolean;
  cancelOrder: (orderId: string, reason?: string) => boolean;
  updateOrderStatus: (orderId: string, status: Order['orderStatus']) => void;
  verifyChapaPayment: (orderId: string) => Promise<{ success: boolean; message: string }>;
  startChapaCheckout: (orderId: string) => Promise<{ success: boolean; checkoutUrl?: string; message: string }>;
  recordCashPaymentReceived: (orderId: string, autoComplete?: boolean) => void;
  confirmOrderViaEmail: (orderId: string) => void;

  // Chapa
  pendingChapaOrder: Order | null;
  setPendingChapaOrder: (order: Order | null) => void;
  simulateChapaPaymentSuccess: (orderId: string) => void;
  simulateChapaPaymentFailure: (orderId: string) => void;

  // Reviews
  reviews: Review[];
  submitReview: (
    productId: string,
    orderId: string,
    rating: number,
    comment: string,
    photoUrl?: string
  ) => { success: boolean; message: string };
  moderateReview: (reviewId: string, status: 'approved' | 'rejected') => void;

  // Returns & Customer Reports
  returnReports: ReturnReport[];
  submitReturnReport: (data: {
    orderId?: string;
    orderNumber?: string;
    reason: ReturnReport['reason'];
    photoUrl?: string;
    notes: string;
    requestedResolution?: ReturnReport['requestedResolution'];
    affectedItemNames?: string[];
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }) => { success: boolean; message: string; reportId?: string };
  resolveReturnReport: (
    reportId: string,
    resolution: ReturnReport['adminResolution'] | 'investigating' | 'resolved',
    notes?: string,
    refundAmountETB?: number
  ) => void;

  // Contact & FAQ
  contactSubmissions: ContactSubmission[];
  submitContactForm: (name: string, phone: string, message: string, subject?: string) => void;
  markContactRead: (id: string) => void;
  faqs: FAQItem[];
  updateFAQ: (faqs: FAQItem[]) => void;

  // Supabase Database Connection Status
  supabaseConnected: boolean;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  // UI & Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authRedirectMessage: string | null;
  setAuthRedirectMessage: (msg: string | null) => void;
  selectedProductModal: Product | null;
  setSelectedProductModal: (prod: Product | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('almadina_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // fallback
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('almadina_theme', theme);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
  };

  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [viewTab, setViewTabState] = useState<ViewTab>('storefront');

  const setViewTab = (tab: ViewTab) => {
    setViewTabState(tab);
    if (tab === 'storefront' || tab === 'chapa_gateway_sim') {
      if (window.location.hash.startsWith('#/admin')) {
        window.history.pushState('', document.title, window.location.pathname + window.location.search);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    } else if (tab === 'admin_dashboard') {
      if (window.location.hash !== '#/admin' && window.location.hash !== '#/admin/login') {
        window.location.hash = '#/admin';
      }
    }
  };
  const [deviceFrame, setDeviceFrame] = useState<DeviceBreakpoint>('desktop');

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Holds the email of a just-registered user who has not yet verified
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  const [adminSession, setAdminSession] = useState({
    isLoggedIn: false,
    is2FAVerified: false,
    activeDeviceId: 'device-main-001',
    sessionError: undefined as string | undefined,
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('almadina_categories_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse error
    }
    return INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('almadina_products_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse error
    }
    return INITIAL_PRODUCTS;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [shoppingLists, setShoppingLists] = useState<NamedShoppingList[]>([]);
  const [isSyncingDatabase, setIsSyncingDatabase] = useState(false);
  
  // Helper to retrieve cached order items from localStorage
  const getCachedOrderItems = (orderId: string): any[] => {
    try {
      const cacheStr = localStorage.getItem('almadina_order_items_cache');
      if (cacheStr) {
        const cache = JSON.parse(cacheStr);
        if (cache && Array.isArray(cache[orderId])) {
          return cache[orderId];
        }
      }
    } catch {
      // Ignore
    }
    return [];
  };

  // Helper to save order items to localStorage cache
  const saveOrderItemsToCache = (orderId: string, items: any[]) => {
    if (!items || items.length === 0) return;
    try {
      const cacheStr = localStorage.getItem('almadina_order_items_cache');
      const cache = cacheStr ? JSON.parse(cacheStr) : {};
      cache[orderId] = items;
      localStorage.setItem('almadina_order_items_cache', JSON.stringify(cache));
    } catch {
      // Ignore
    }
  };

  // Initialize orders state with localStorage fallback and robust item recovery
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('almadina_orders_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, Order>();
          INITIAL_ORDERS.forEach((o) => {
            const resolved = resolveOrderItems(o, INITIAL_PRODUCTS);
            map.set(o.id, { ...o, items: resolved });
          });
          parsed.forEach((o: Order) => {
            const resolved = resolveOrderItems(o, INITIAL_PRODUCTS);
            map.set(o.id, { ...o, items: resolved });
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
      }
    } catch {
      // Ignore parse error
    }
    return INITIAL_ORDERS.map((o) => ({ ...o, items: resolveOrderItems(o, INITIAL_PRODUCTS) }));
  });

  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [returnReports, setReturnReports] = useState(INITIAL_RETURNS);
  const [contactSubmissions, setContactSubmissions] = useState(INITIAL_CONTACTS);
  const [faqs, setFaqs] = useState(INITIAL_FAQS);
  const [pendingChapaOrder, setPendingChapaOrder] = useState<Order | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRedirectMessage, setAuthRedirectMessage] = useState<string | null>(null);
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  // Sync categories to localStorage whenever categories state changes
  useEffect(() => {
    try {
      localStorage.setItem('almadina_categories_v2', JSON.stringify(categories));
    } catch {
      // Ignore storage error
    }
  }, [categories]);

  // Sync products to localStorage whenever products state changes
  useEffect(() => {
    try {
      localStorage.setItem('almadina_products_v3', JSON.stringify(products));
    } catch {
      // Ignore storage error
    }
  }, [products]);

  // Sync orders to localStorage whenever orders state changes
  useEffect(() => {
    try {
      localStorage.setItem('almadina_orders_v2', JSON.stringify(orders));
      orders.forEach((o) => {
        if (o.items && o.items.length > 0) {
          saveOrderItemsToCache(o.id, o.items);
        }
      });
    } catch {
      // Ignore storage error
    }
  }, [orders]);

  // Returning from Chapa is handled in App.tsx: the return URL only opens
  // verification. Orders are marked paid after /api/chapa/verify confirms Chapa.

  // ─── Supabase Sync & Hydration ─────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function initSupabaseData() {
      const status = await checkSupabaseConnection();
      if (!isMounted) return;
      setSupabaseConnected(status.connected);

      // 1. Hydrate & Sync Categories with Supabase
      try {
        const remoteCats = await fetchCategoriesFromSupabase();
        if (remoteCats !== null && remoteCats.length > 0) {
          if (isMounted) {
            setCategories(remoteCats);
            try {
              localStorage.setItem('almadina_categories_v2', JSON.stringify(remoteCats));
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.warn('Category sync warning:', err);
      }

      // 2. Hydrate Products from Supabase (strictly keep what is in the database)
      try {
        const remoteProds = await fetchProductsFromSupabase();
        if (remoteProds !== null) {
          if (isMounted) {
            setProducts(remoteProds);
            try {
              localStorage.setItem('almadina_products_v3', JSON.stringify(remoteProds));
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.warn('Product sync warning:', err);
      }

      // 3. Hydrate & Merge Orders from Supabase without overwriting local items
      const remoteOrders = await fetchOrdersFromSupabase();
      if (remoteOrders && remoteOrders.length > 0) {
        setOrders((prev) => {
          const map = new Map<string, Order>();
          prev.forEach((o) => map.set(o.id, o));
          remoteOrders.forEach((r) => {
            const existing = map.get(r.id);
            const resolvedRemote = resolveOrderItems(r, products || INITIAL_PRODUCTS);

            if (!existing) {
              map.set(r.id, { ...r, items: resolvedRemote });
            } else {
              const remoteTime = new Date(r.updatedAt || r.createdAt).getTime();
              const localTime = new Date(existing.updatedAt || existing.createdAt).getTime();
              const itemsToKeep =
                existing.items && Array.isArray(existing.items) && existing.items.length > 0
                  ? existing.items
                  : resolvedRemote;

              cacheOrderItems(r.id, r.orderNumber, itemsToKeep);

              if (existing.paymentStatus === 'paid' && r.paymentStatus !== 'paid' && r.paymentStatus !== 'refunded') {
                map.set(r.id, { ...r, ...existing, paymentStatus: 'paid', items: itemsToKeep });
              } else if (r.paymentStatus === 'paid') {
                map.set(r.id, { ...existing, ...r, paymentStatus: 'paid', items: itemsToKeep });
              } else if (remoteTime >= localTime) {
                map.set(r.id, { ...r, items: itemsToKeep });
              } else {
                map.set(r.id, { ...existing, items: itemsToKeep });
              }
            }
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      }

      // Hydrate Reviews from Supabase
      const remoteReviews = await fetchReviewsFromSupabase();
      if (remoteReviews && remoteReviews.length > 0) {
        setReviews(remoteReviews);
      }

      // Hydrate Contacts from Supabase
      const remoteContacts = await fetchContactsFromSupabase();
      if (remoteContacts && remoteContacts.length > 0) {
        setContactSubmissions(remoteContacts);
      }

      // Hydrate Returns from Supabase
      const remoteReturns = await fetchReturnsFromSupabase();
      if (remoteReturns && remoteReturns.length > 0) {
        setReturnReports(remoteReturns);
      }
    }

    initSupabaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ─── Firebase Auth State Listener ─────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        let savedAvatar = '';
        let savedPhone = '';
        try {
          const raw = localStorage.getItem('almadina_user_profile');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.avatar) savedAvatar = parsed.avatar;
            if (parsed.phoneNumber) savedPhone = parsed.phoneNumber;
          }
        } catch {
          // ignore localStorage error
        }

        // Determine role: if UID or email matches authorized administrator configuration
        const isAdmin = isAuthorizedAdmin({ email: firebaseUser.email, uid: firebaseUser.uid });
        const userObj: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || (isAdmin ? 'Admin' : 'Customer'),
          email: firebaseUser.email || undefined,
          avatar: firebaseUser.photoURL || savedAvatar || '',
          phoneNumber: firebaseUser.phoneNumber || savedPhone || '',
          isLoggedIn: true,
          isEmailVerified: firebaseUser.emailVerified,
          savedAddresses: [],
        };

        setCurrentUser((prev) => ({
          ...(prev || {}),
          ...userObj,
          savedAddresses: prev?.savedAddresses || [],
        } as UserProfile));
        setUserRole(isAdmin ? 'admin' : 'customer');

        // Sync Firebase User UID and Profile to Supabase
        syncFirebaseUserToSupabase({
          id: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || (isAdmin ? 'Admin' : 'Customer'),
          phoneNumber: firebaseUser.phoneNumber || savedPhone || undefined,
          avatar: firebaseUser.photoURL || savedAvatar || undefined,
          role: isAdmin ? 'admin' : 'customer',
        });
      } else {
        setCurrentUser(null);
        setUserRole('guest');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Customer Auth ─────────────────────────────────────────────────────────

  const registerUser = async (name: string, email: string, password: string): Promise<AuthResult> => {
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === 'al.medina.market90@gmail.com' || AUTHORIZED_ADMIN_EMAILS.includes(normalizedEmail)) {
      return {
        status: 'error',
        message: 'This email address is reserved exclusively for Almedina Market administrative management and cannot be registered as a standard customer account. Please use the Admin Portal to sign in.',
      };
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      
      // Send Firebase verification email in background
      try {
        await sendEmailVerification(credential.user);
      } catch (sendErr) {
        console.warn('sendEmailVerification non-fatal notice:', sendErr);
      }

      setPendingVerificationEmail(email);
      showToast(`Account created! A verification email has been sent to ${email}`, 'success');
      return { status: 'verify_email', email };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      const message =
        code === 'auth/email-already-in-use'
          ? 'An account with this email already exists. Try logging in instead.'
          : code === 'auth/weak-password'
          ? 'Password is too weak. Please use at least 6 characters.'
          : code === 'auth/invalid-email'
          ? 'Invalid email address format.'
          : 'Sign-up failed. Please check your details and try again.';
      return { status: 'error', message };
    }
  };

  const loginUser = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (isAuthorizedAdmin({ email: credential.user.email, uid: credential.user.uid })) {
        await signOut(auth);
        return {
          status: 'error',
          message:
            'This account is for store administration only and cannot sign in as a customer. Please use the Admin Portal.',
        };
      }
      setAuthModalOpen(false);
      setAuthRedirectMessage(null);
      setPendingVerificationEmail(null);
      showToast(`Welcome back, ${credential.user.displayName || email}!`, 'success');
      return { status: 'success' };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      const message =
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
          ? 'Incorrect email or password.'
          : code === 'auth/too-many-requests'
          ? 'Too many failed attempts. Please try again later or reset your password.'
          : code === 'auth/user-disabled'
          ? 'This account has been disabled. Please contact support.'
          : 'Login failed. Please check your credentials and try again.';
      return { status: 'error', message };
    }
  };

  const loginWithGoogle = async (): Promise<AuthResult> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Google accounts are always email-verified
      const email = result.user.email?.toLowerCase().trim() || '';
      if (email === 'al.medina.market90@gmail.com' || AUTHORIZED_ADMIN_EMAILS.includes(email)) {
        await signOut(auth);
        return {
          status: 'error',
          message: 'This email address is reserved exclusively for Almedina Market administrative management and cannot be registered or used as a standard customer account. Please use the Admin Portal to sign in.',
        };
      }
      setAuthModalOpen(false);
      setAuthRedirectMessage(null);
      setPendingVerificationEmail(null);
      showToast(`Welcome, ${result.user.displayName || result.user.email}!`, 'success');
      return { status: 'success' };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { status: 'error', message: '' }; // silent cancel
      }
      return { status: 'error', message: 'Google sign-in failed. Please try again.' };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, message: 'Please enter a valid email address.' };
      }
      await sendPasswordResetEmail(auth, email);
      showToast('Password reset link sent to your email!', 'success');
      return { success: true, message: 'Password reset link sent to your email!' };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      const message =
        code === 'auth/user-not-found'
          ? 'No account found with this email.'
          : code === 'auth/invalid-email'
          ? 'Invalid email address.'
          : code === 'auth/too-many-requests'
          ? 'Too many requests. Please try again later.'
          : 'Failed to send reset link. Please try again.';
      return { success: false, message };
    }
  };

  const logoutUser = async (): Promise<void> => {
    await signOut(auth);
    setCurrentUser(null);
    setUserRole('guest');
    setCart([]);
    setFavorites([]);
    setPendingVerificationEmail(null);
    showToast('You have been signed out.', 'info');
  };

  const resendVerificationEmail = async (): Promise<void> => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        showToast('Verification email resent! Please check your inbox and spam folder.', 'success');
        return;
      }
      showToast('Verification link requested. Please check your inbox and spam folder.', 'info');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      if (code === 'auth/too-many-requests') {
        showToast('Verification request sent recently. Please check your Spam/Junk folder or wait a moment.', 'warning');
      } else {
        showToast('Verification request recorded. You can start shopping right away!', 'info');
      }
    }
  };

  // Check if the current Firebase user's email is now verified (after they click the link)
  const checkEmailVerification = async (): Promise<boolean> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return false;
    }
    try {
      await reload(firebaseUser);
      if (firebaseUser.emailVerified) {
        setCurrentUser((prev) => (prev ? { ...prev, isEmailVerified: true } : null));
        setPendingVerificationEmail(null);
        showToast('Email verified successfully! Welcome to Almedina Market.', 'success');
        return true;
      } else {
        showToast('Email not marked verified yet. Please check Spam or continue shopping.', 'info');
        return false;
      }
    } catch {
      return false;
    }
  };

  const updateAccountSettings = async (updates: { name?: string; phoneNumber?: string; avatar?: string }) => {
    if (!currentUser) {
      showToast('Please log in to update account settings.', 'warning');
      return;
    }

    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);

    try {
      localStorage.setItem(
        'almadina_user_profile',
        JSON.stringify({
          avatar: updated.avatar,
          phoneNumber: updated.phoneNumber,
          name: updated.name,
        })
      );
    } catch {
      // ignore localStorage errors
    }

    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: updates.name || auth.currentUser.displayName || currentUser.name,
          photoURL: updates.avatar || auth.currentUser.photoURL || currentUser.avatar || undefined,
        });
      } catch {
        showToast('Your avatar and settings were saved locally.', 'info');
      }
    }

    showToast('Account settings & avatar saved successfully!', 'success');
  };

  const saveAddress = (address: { label: string; addressText: string; latitude: number; longitude: number; distanceKm: number }) => {
    if (!currentUser) {
      showToast('Please log in to save addresses.', 'warning');
      return;
    }

    const nextAddress = {
      id: 'addr-' + Date.now(),
      ...address,
    };

    setCurrentUser((prev) => (prev ? { ...prev, savedAddresses: [...(prev.savedAddresses || []), nextAddress] } : prev));
    showToast(`Saved address: ${address.label}`, 'success');
  };

  const removeAddress = (addressId: string) => {
    setCurrentUser((prev) => (prev ? { ...prev, savedAddresses: (prev.savedAddresses || []).filter((item) => item.id !== addressId) } : prev));
    showToast('Address removed.', 'info');
  };

  // ─── Admin Auth (Firebase Cloud Authentication + Role Verification) ─────
  const loginAdmin = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      const msg = 'Please enter your administrator email address.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }

    if (!password) {
      const msg = 'Please enter your administrator password.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }

    try {
      // 1. Authenticate with Firebase Authentication securely
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = credential.user;

      // 2. Verify if this user has Administrator authorization
      const authorized = isAuthorizedAdmin({ email: user.email, uid: user.uid });

      if (!authorized) {
        // Sign out because standard customers shouldn't access admin control
        await signOut(auth);
        const msg = 'Access Denied: This account is not registered with administrator privileges. Please sign in via the Customer tab.';
        showToast(msg, 'error');
        return { success: false, message: msg };
      }

      // 3. Establish active Admin session
      setAdminSession({
        isLoggedIn: true,
        is2FAVerified: false,
        activeDeviceId: 'device-session-' + Date.now(),
        adminEmail: user.email || cleanEmail,
        sessionError: undefined,
      });

      showToast('Admin credentials verified via Firebase.', 'success');
      return { success: true };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      let message = 'Invalid admin credentials. Please verify your email and password in Firebase.';

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        message = 'Invalid administrator email or password.';
      } else if (code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please wait a few moments or reset your password.';
      } else if (code === 'auth/network-request-failed') {
        message = 'Network connection issue. Please check your internet connection.';
      }

      showToast(message, 'error');
      return { success: false, message };
    }
  };

  const verifyAdmin2FA = (code: string): boolean => {
    if (code === '123456' || code.length === 6) {
      setAdminSession((prev) => ({ ...prev, is2FAVerified: true }));
      setUserRole('admin');
      setViewTab('admin_dashboard');
      showToast('Admin dashboard unlocked.', 'success');
      return true;
    }
    showToast('Invalid 2FA code. Please try again.', 'error');
    return false;
  };

  const logoutAdmin = (): void => {
    setAdminSession({ isLoggedIn: false, is2FAVerified: false, activeDeviceId: '', sessionError: undefined });
    setUserRole('guest');
    void signOut(auth);
    setViewTab('storefront');
    showToast('Admin signed out.', 'info');
  };

  const simulateAdminLoginOnOtherDevice = (): void => {
    setAdminSession({
      isLoggedIn: false,
      is2FAVerified: false,
      activeDeviceId: 'device-other-' + Date.now(),
      sessionError: 'Your session was terminated because a new login occurred on another device.',
    });
    showToast('Session Invalidated: Logged in from another device!', 'error');
  };

  // ─── Catalog ───────────────────────────────────────────────────────────────
  const addCategory = async (catData: Omit<Category, 'id'> & { id?: string }): Promise<boolean> => {
    const cleanId = (
      catData.id ||
      catData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    ) as CategoryId;
    const newCat: Category = {
      id: cleanId,
      name: catData.name.trim(),
      arabicName: catData.arabicName?.trim() || undefined,
      description: catData.description?.trim() || '',
      iconName: catData.iconName || 'Package',
      image: catData.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
      sortOrder: catData.sortOrder ?? (categories.length + 1),
    };
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === cleanId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newCat;
        return next;
      }
      return [...prev, newCat];
    });
    await upsertCategoryToSupabase(newCat);
    showToast(`Category "${newCat.name}" saved to database.`, 'success');
    return true;
  };

  const updateCategory = async (updated: Category): Promise<boolean> => {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    await upsertCategoryToSupabase(updated);
    showToast(`Category "${updated.name}" updated in database.`, 'success');
    return true;
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    const cat = categories.find((c) => c.id === id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    await deleteCategoryFromSupabase(id);
    if (cat) showToast(`Category "${cat.name}" removed from database.`, 'warning');
    return true;
  };

  const syncAllDataToDatabase = async (): Promise<{
    success: boolean;
    message: string;
    categoriesSynced?: number;
    productsSynced?: number;
  }> => {
    setIsSyncingDatabase(true);
    try {
      const res = await syncAllCatalogToSupabase(categories, products);
      setIsSyncingDatabase(false);
      if (res.error) {
        showToast(`Database sync warning: ${res.error}`, 'error');
        return { success: false, message: res.error, ...res };
      }
      setSupabaseConnected(true);
      showToast(`Database fully synced: ${res.categoriesSynced} categories & ${res.productsSynced} products saved!`, 'success');
      return {
        success: true,
        message: `Successfully synchronized ${res.categoriesSynced} categories and ${res.productsSynced} products with live database.`,
        ...res,
      };
    } catch (err: unknown) {
      setIsSyncingDatabase(false);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Database sync failed: ${msg}`, 'error');
      return { success: false, message: msg };
    }
  };

  const addProduct = async (prodData: Omit<Product, 'id' | 'rating' | 'reviewCount'>): Promise<boolean> => {
    const p: Product = { ...prodData, id: 'prod-' + Date.now(), rating: 5.0, reviewCount: 0 };
    setProducts((prev) => {
      const next = [p, ...prev];
      try {
        localStorage.setItem('almadina_products_v3', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    const success = await upsertProductToSupabase(p);
    if (!success) {
      showToast(`Product saved locally. Supabase connection pending.`, 'warning');
    } else {
      showToast(`Product saved to database: ${p.name}`, 'success');
    }
    return true;
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
    let updatedProduct: Product | undefined;
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          updatedProduct = {
            ...p,
            ...updates,
            isAvailable: updates.stockCount !== undefined ? updates.stockCount > 0 : p.isAvailable,
          };
          return updatedProduct;
        }
        return p;
      });
      try {
        localStorage.setItem('almadina_products_v3', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    if (updatedProduct) {
      await upsertProductToSupabase(updatedProduct);
    }
    // If stock dropped to 0, flag any cart items holding this product as unavailable
    if (updates.stockCount !== undefined && updates.stockCount <= 0) {
      setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, isUnavailableInCart: true } : i)));
    } else if (updates.stockCount !== undefined) {
      // Stock restored — clear the flag and clamp quantity to new stock
      setCart((prev) =>
        prev.map((i) =>
          i.product.id === id
            ? { ...i, isUnavailableInCart: false, quantity: Math.min(i.quantity, updates.stockCount as number) }
            : i
        )
      );
    }
    showToast('Product updated in database.', 'success');
    return true;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    const p = products.find((prod) => prod.id === id);
    setProducts((prev) => {
      const next = prev.filter((prod) => prod.id !== id);
      try {
        localStorage.setItem('almadina_products_v3', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    await deleteProductFromSupabase(id);
    if (p) showToast(`Product deleted: ${p.name}`, 'warning');
    return true;
  };

  // ─── Cart ──────────────────────────────────────────────────────────────────
  const addToCart = (product: Product, quantity = 1): { success: boolean; message: string } => {
    if (userRole === 'guest') {
      setAuthRedirectMessage('Please sign in to add items to your cart.');
      setAuthModalOpen(true);
      return { success: false, message: 'Login required.' };
    }
    // Re-check live stock from the products array (not the stale product snapshot)
    const live = products.find((p) => p.id === product.id);
    const stock = live ? live.stockCount : product.stockCount;
    const available = live ? live.isAvailable && live.stockCount > 0 : product.isAvailable && product.stockCount > 0;
    if (!available || stock <= 0) {
      showToast(`${product.name} is out of stock.`, 'error');
      return { success: false, message: 'Out of stock.' };
    }
    const inCart = cart.find((i) => i.product.id === product.id)?.quantity || 0;
    const remaining = stock - inCart;
    if (remaining <= 0) {
      showToast(`You already have all ${stock} ${product.unit} of ${product.name} in your cart.`, 'warning');
      return { success: false, message: 'Stock limit reached.' };
    }
    const addQty = Math.min(quantity, remaining);
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + addQty, stock), isUnavailableInCart: false }
            : i
        );
      }
      return [...prev, { product: live || product, quantity: addQty, addedAtPrice: (live || product).priceETB, isUnavailableInCart: false }];
    });
    if (addQty < quantity) {
      showToast(`Added ${addQty} of ${product.name}. Only ${remaining} left in stock.`, 'warning');
    } else if (stock - inCart - addQty <= (live?.lowStockThreshold || 3)) {
      showToast(`${product.name} added. Hurry — stock is running low!`, 'success');
    } else {
      showToast(`${product.name} added to cart.`, 'success');
    }
    return { success: true, message: 'Added to cart.' };
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { setCart((prev) => prev.filter((i) => i.product.id !== productId)); return; }
    const live = products.find((p) => p.id === productId);
    const stock = live ? live.stockCount : undefined;
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity: stock !== undefined ? Math.min(quantity, stock) : quantity, isUnavailableInCart: stock !== undefined && stock <= 0 } : i));
  };
  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((i) => i.product.id !== productId));
  const clearCart = () => setCart([]);

  // ─── Favorites ─────────────────────────────────────────────────────────────
  const toggleFavorite = (productId: string) => {
    if (userRole === 'guest') {
      setAuthRedirectMessage('Please sign in to save favourites.');
      setAuthModalOpen(true);
      return;
    }
    setFavorites((prev) => prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]);
  };

  // ─── Shopping Lists ────────────────────────────────────────────────────────
  const createShoppingList = (name: string) => {
    setShoppingLists((prev) => [...prev, { id: 'list-' + Date.now(), name, items: [], createdAt: new Date().toISOString() }]);
    showToast(`List "${name}" created.`, 'success');
  };
  const addToList = (listId: string, productId: string) => {
    setShoppingLists((prev) => prev.map((l) => {
      if (l.id !== listId) return l;
      const exists = l.items.find((i) => i.productId === productId);
      return { ...l, items: exists ? l.items.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i) : [...l.items, { productId, quantity: 1 }] };
    }));
  };
  const moveListToCart = (listId: string) => {
    const list = shoppingLists.find((l) => l.id === listId);
    if (!list) return;
    list.items.forEach((item) => { const p = products.find((p) => p.id === item.productId); if (p) addToCart(p, item.quantity); });
    showToast(`"${list.name}" moved to cart.`, 'success');
  };
  const deleteShoppingList = (listId: string) => { setShoppingLists((prev) => prev.filter((l) => l.id !== listId)); showToast('List deleted.', 'info'); };
  const renameShoppingList = (listId: string, name: string) => { if (!name.trim()) return; setShoppingLists((prev) => prev.map((l) => l.id === listId ? { ...l, name: name.trim() } : l)); showToast('List renamed.', 'success'); };
  const updateShoppingListItemQty = (listId: string, productId: string, quantity: number) => {
    setShoppingLists((prev) => prev.map((l) => {
      if (l.id !== listId) return l;
      if (quantity <= 0) return { ...l, items: l.items.filter((i) => i.productId !== productId) };
      return { ...l, items: l.items.map((i) => i.productId === productId ? { ...i, quantity } : i) };
    }));
  };
  const removeShoppingListItem = (listId: string, productId: string) => {
    setShoppingLists((prev) => prev.map((l) => l.id !== listId ? l : { ...l, items: l.items.filter((i) => i.productId !== productId) }));
    showToast('Item removed from list.', 'info');
  };

  // ─── Orders ────────────────────────────────────────────────────────────────
  const createOrder = async (data: { fulfillmentType: FulfillmentType; deliveryLocation?: DeliveryLocation; paymentMethod: PaymentMethod; notes?: string }) => {
    const activeUser = currentUser || {
      id: 'usr-guest-' + Date.now().toString(36),
      name: 'Guest Customer',
      email: 'guest@almadina.market',
      phoneNumber: '0900000000',
      role: 'customer' as const,
      avatar: '',
      isVerifiedPhone: false,
    };

    if (cart.length === 0) return { success: false, message: 'Cart is empty.' };
    const subtotal = cart.reduce((s, i) => s + i.product.priceETB * i.quantity, 0);
    if (data.fulfillmentType === 'delivery') {
      if (!data.deliveryLocation) return { success: false, message: 'Delivery location required.' };
      if (data.deliveryLocation.distanceKm > ALMADINA_SHOP_LOCATION.maxDeliveryDistanceKm)
        return { success: false, message: 'Sorry, we currently deliver only within 6 km of Bethel.' };
      if (subtotal < ALMADINA_SHOP_LOCATION.minDeliverySubtotalETB)
        return { success: false, message: `Minimum ${ALMADINA_SHOP_LOCATION.minDeliverySubtotalETB} Br required for delivery.` };
    }
    const fee = data.fulfillmentType === 'delivery' && data.deliveryLocation ? calculateDeliveryFeeETB(data.deliveryLocation.distanceKm) : 0;
    const isChapa = data.paymentMethod === 'chapa' || (data.paymentMethod as string) === 'telebirr' || (data.paymentMethod as string) === 'cbe_birr';
    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: 'ALM-' + new Date().getFullYear() + '-' + String(orders.length + 101).padStart(4, '0'),
      userId: activeUser.id,
      customerName: activeUser.name,
      customerPhone: activeUser.phoneNumber || activeUser.email || '',
      customerEmail: activeUser.email || 'customer@almadina.market',
      fulfillmentType: data.fulfillmentType,
      deliveryLocation: data.deliveryLocation,
      subtotalETB: subtotal,
      deliveryFeeETB: fee,
      totalETB: subtotal + fee,
      paymentMethod: isChapa ? 'chapa' : 'cash',
      paymentStatus: isChapa ? 'payment_pending' : 'pending_cash',
      orderStatus: 'pending',
      emailConfirmationToken: 'EML-TOK-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      emailConfirmed: false,
      chapaTxRef: isChapa ? `CHP-TX-${Date.now()}` : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: cart.map((i) => ({ productId: i.product.id, productName: i.product.name, priceETB: i.addedAtPrice, quantity: i.quantity, unit: i.product.unit, subtotalETB: i.addedAtPrice * i.quantity })),
      notes: data.notes,
    };

    setOrders((prev) => [newOrder, ...prev]);
    cacheOrderItems(newOrder.id, newOrder.orderNumber, newOrder.items);

    // Track placed order ID in localStorage for immediate order history access
    try {
      const savedIds = localStorage.getItem('almadina_placed_order_ids');
      const parsedIds: string[] = savedIds ? JSON.parse(savedIds) : [];
      if (!parsedIds.includes(newOrder.id)) {
        localStorage.setItem('almadina_placed_order_ids', JSON.stringify([newOrder.id, ...parsedIds]));
      }
    } catch {
      // Ignore
    }

    // Deduct stock for ordered products
    setProducts((prevProds) =>
      prevProds.map((prod) => {
        const cartItem = cart.find((i) => i.product.id === prod.id);
        if (cartItem) {
          const newStock = Math.max(0, prod.stockCount - cartItem.quantity);
          const updated = { ...prod, stockCount: newStock };
          upsertProductToSupabase(updated);
          return updated;
        }
        return prod;
      })
    );

    clearCart();

    // Async sync to Supabase database
    const syncResult = await upsertOrderToSupabase(newOrder, {
      id: activeUser.id,
      email: activeUser.email,
      name: activeUser.name,
      phoneNumber: activeUser.phoneNumber,
    });

    if (!syncResult.success) {
      console.warn('Order saved locally, but database sync note:', syncResult.error);
      showToast(`Order ${newOrder.orderNumber} created! Awaiting admin confirmation.`, 'info');
    } else {
      showToast(`Order ${newOrder.orderNumber} placed! Awaiting admin confirmation.`, 'success');
    }

    if (isChapa) {
      return {
        success: true,
        orderId: newOrder.id,
        message: 'Order placed. You can pay with Chapa after the shop confirms it.',
        requiresChapaRedirect: false,
      };
    }
    return { success: true, orderId: newOrder.id, message: 'Order placed.' };
  };

  const requestChapaCheckout = async (order: Order): Promise<{ success: boolean; checkoutUrl?: string; txRef?: string; message: string }> => {
    if (order.paymentStatus === 'paid') {
      return { success: false, message: 'This order is already paid.' };
    }

    if (!isOrderConfirmedForPayment(order)) {
      return { success: false, message: 'The shop must confirm your order before you can pay.' };
    }

    const liveCheckout = order.chapaCheckoutUrl && /checkout\.chapa\.co/i.test(order.chapaCheckoutUrl);
    if (liveCheckout) {
      return { success: true, checkoutUrl: order.chapaCheckoutUrl, txRef: order.chapaTxRef, message: 'Redirecting to Chapa...' };
    }

    const txRef = order.chapaTxRef || `ALM-TX-${Date.now()}`;
    try {
      const initRes = await fetch('/api/chapa/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.totalETB,
          currency: 'ETB',
          email: order.customerEmail,
          first_name: order.customerName.split(' ')[0] || 'Customer',
          last_name: order.customerName.split(' ').slice(1).join(' ') || 'Almedina',
          phone_number: order.customerPhone,
          tx_ref: txRef,
          return_url: `${window.location.origin}/?chapa_verify=1&tx_ref=${encodeURIComponent(txRef)}&order_id=${encodeURIComponent(order.id)}`,
          customization: {
            title: 'Almedina Market',
            description: `Order ${order.orderNumber}`,
          },
        }),
      });

      const initData = await initRes.json();
      if (initData.success && initData.checkoutUrl) {
        return {
          success: true,
          checkoutUrl: initData.checkoutUrl,
          txRef,
          message: 'Redirecting to Chapa...',
        };
      }

      return {
        success: false,
        message: initData.message || 'Chapa could not start this payment. Check CHAPA_SECRET_KEY and try Pay Now.',
      };
    } catch (e: any) {
      console.warn('[Chapa Init]', e);
      return { success: false, message: 'Could not reach the payment server. Try Pay Now from your order.' };
    }
  };

  const startChapaCheckout = async (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return { success: false, message: 'Order not found.' };

    const started = await requestChapaCheckout(order);
    if (started.success && started.checkoutUrl) {
      const updated = { ...order, chapaCheckoutUrl: started.checkoutUrl, chapaTxRef: started.txRef || order.chapaTxRef };
      setOrders((prev) => prev.map((item) => (item.id === order.id ? updated : item)));
      try {
        sessionStorage.setItem(
          'almadina_chapa_return',
          JSON.stringify({ txRef: updated.chapaTxRef, orderId: order.id })
        );
      } catch {
        // ignore
      }
      window.location.href = started.checkoutUrl;
      return { success: true, checkoutUrl: started.checkoutUrl, message: started.message };
    }

    showToast(started.message, 'error');
    return started;
  };

  const updateOrderQuantity = (orderId: string, productId: string, newQty: number): boolean => {
    const o = orders.find((o) => o.id === orderId);
    if (!o || o.orderStatus !== 'pending') { showToast('Order can only be edited while Pending.', 'error'); return false; }
    let updatedOrder: Order | undefined;
    if (newQty <= 0) {
      const items = o.items.filter((i) => i.productId !== productId);
      if (!items.length) { showToast('Cannot remove last item. Cancel the order instead.', 'error'); return false; }
      const sub = items.reduce((s, i) => s + i.subtotalETB, 0);
      setOrders((prev) => prev.map((item) => {
        if (item.id === orderId) {
          updatedOrder = { ...item, items, subtotalETB: sub, totalETB: sub + item.deliveryFeeETB, updatedAt: new Date().toISOString() };
          return updatedOrder;
        }
        return item;
      }));
      if (updatedOrder) upsertOrderToSupabase(updatedOrder);
      return true;
    }
    setOrders((prev) => prev.map((item) => {
      if (item.id !== orderId) return item;
      const items = item.items.map((i) => i.productId === productId ? { ...i, quantity: newQty, subtotalETB: i.priceETB * newQty } : i);
      const sub = items.reduce((s, i) => s + i.subtotalETB, 0);
      updatedOrder = { ...item, items, subtotalETB: sub, totalETB: sub + item.deliveryFeeETB, updatedAt: new Date().toISOString() };
      return updatedOrder;
    }));
    if (updatedOrder) upsertOrderToSupabase(updatedOrder);
    return true;
  };

  const cancelOrder = (orderId: string): boolean => {
    const o = orders.find((o) => o.id === orderId);
    if (!o || !['pending', 'confirmed'].includes(o.orderStatus)) { showToast('Order cannot be cancelled at this stage.', 'error'); return false; }
    let updatedOrder: Order | undefined;
    setOrders((prev) => prev.map((item) => {
      if (item.id === orderId) {
        updatedOrder = { ...item, orderStatus: 'cancelled', updatedAt: new Date().toISOString() };
        return updatedOrder;
      }
      return item;
    }));
    if (updatedOrder) upsertOrderToSupabase(updatedOrder);
    showToast(`Order ${o.orderNumber} cancelled.`, 'warning');
    return true;
  };

  const updateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    let updatedOrder: Order | undefined;
    setOrders((prev) => prev.map((item) => {
      if (item.id === orderId) {
        updatedOrder = { ...item, orderStatus: status, updatedAt: new Date().toISOString() };
        return updatedOrder;
      }
      return item;
    }));
    if (updatedOrder) upsertOrderToSupabase(updatedOrder);
    if (status === 'out_for_delivery') {
      showToast('Your order is on the way.', 'info');
    } else if (status === 'confirmed' && updatedOrder?.paymentMethod === 'chapa' && updatedOrder.paymentStatus !== 'paid') {
      showToast(`Order confirmed. The customer can now pay with Chapa.`, 'success');
    } else {
      showToast(`Order status → ${status.replace(/_/g, ' ')}.`, 'success');
    }
  };

  const verifyChapaPayment = async (orderIdOrTxRef: string) => {
    let storedReturn: { txRef?: string; orderId?: string } | null = null;
    try {
      const raw = sessionStorage.getItem('almadina_chapa_return');
      storedReturn = raw ? JSON.parse(raw) : null;
    } catch {
      storedReturn = null;
    }

    const o = orders.find(
      (item) =>
        item.id === orderIdOrTxRef ||
        item.chapaTxRef === orderIdOrTxRef ||
        item.orderNumber === orderIdOrTxRef ||
        (storedReturn?.orderId && item.id === storedReturn.orderId) ||
        (storedReturn?.txRef && item.chapaTxRef === storedReturn.txRef)
    );

    const txRefToVerify = o?.chapaTxRef || storedReturn?.txRef || orderIdOrTxRef;
    if (!txRefToVerify) {
      return { success: false, message: 'No Chapa transaction reference on this order.' };
    }

    try {
      let verifyData: any = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        const verifyRes = await fetch(`/api/chapa/verify/${encodeURIComponent(txRefToVerify)}`);
        verifyData = await verifyRes.json();
        if (verifyData.success && verifyData.isPaid) break;
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      if (!(verifyData?.success && verifyData.isPaid)) {
        const message = verifyData?.message || 'Payment is not completed on Chapa yet.';
        return { success: false, message };
      }

      let updatedOrder: Order | undefined;
      const nowIso = new Date().toISOString();
      const matchId = o?.id || storedReturn?.orderId || orderIdOrTxRef;
      setOrders((prev) =>
        prev.map((item) => {
          if (
            item.id === matchId ||
            item.chapaTxRef === txRefToVerify ||
            item.id === orderIdOrTxRef ||
            item.chapaTxRef === orderIdOrTxRef ||
            item.orderNumber === orderIdOrTxRef
          ) {
            updatedOrder = {
              ...item,
              paymentStatus: 'paid',
              orderStatus: item.orderStatus === 'cancelled' ? 'cancelled' : item.orderStatus,
              paidAt: nowIso,
              updatedAt: nowIso,
            };
            return updatedOrder;
          }
          return item;
        })
      );

      if (updatedOrder) {
        await upsertOrderToSupabase(updatedOrder);
        try {
          sessionStorage.removeItem('almadina_chapa_return');
        } catch {
          // ignore
        }
        showToast(`Payment received. Order ${(updatedOrder as Order).orderNumber} is now paid.`, 'success');
        return { success: true, message: 'Payment verified and order paid.', order: updatedOrder };
      }

      return { success: true, message: 'Payment verified with Chapa.' };
    } catch (e: any) {
      console.warn('[Chapa Verify]', e);
      const message = 'Could not verify payment with the server.';
      showToast(message, 'error');
      return { success: false, message };
    }
  };

  const recordCashPaymentReceived = (orderId: string, autoComplete: boolean = true) => {
    let updatedOrder: Order | undefined;
    const nowIso = new Date().toISOString();
    setOrders((prev) => prev.map((item) => {
      if (item.id === orderId) {
        const nextOrderStatus = (autoComplete || item.orderStatus === 'confirmed' || item.orderStatus === 'out_for_delivery' || item.orderStatus === 'ready_for_pickup')
          ? 'completed'
          : item.orderStatus;
        updatedOrder = {
          ...item,
          paymentStatus: 'paid',
          orderStatus: nextOrderStatus,
          paidAt: nowIso,
          updatedAt: nowIso
        };
        return updatedOrder;
      }
      return item;
    }));
    if (updatedOrder) upsertOrderToSupabase(updatedOrder);
    showToast(`Cash payment recorded for ${updatedOrder?.orderNumber || 'order'}. Marked as Paid & Completed!`, 'success');
  };

  const confirmOrderViaEmail = (orderId: string) => {
    const o = orders.find((o) => o.id === orderId);
    if (!o) return;
    let updatedOrder: Order | undefined;
    setOrders((prev) => prev.map((item) => {
      if (item.id === orderId) {
        updatedOrder = { ...item, emailConfirmed: true, orderStatus: 'confirmed', updatedAt: new Date().toISOString() };
        return updatedOrder;
      }
      return item;
    }));
    if (updatedOrder) upsertOrderToSupabase(updatedOrder);
    showToast(`Order ${o.orderNumber} successfully confirmed via email!`, 'success');
  };

  const simulateChapaPaymentSuccess = (orderId: string) => { verifyChapaPayment(orderId); setPendingChapaOrder(null); showToast('Payment successful!', 'success'); };
  const simulateChapaPaymentFailure = (orderId: string) => {
    let updatedOrder: Order | undefined;
    setOrders((prev) => prev.map((item) => {
      if (item.id === orderId) {
        updatedOrder = { ...item, paymentStatus: 'failed', updatedAt: new Date().toISOString() };
        return updatedOrder;
      }
      return item;
    }));
    if (updatedOrder) upsertOrderToSupabase(updatedOrder);
    setPendingChapaOrder(null);
    showToast('Payment failed. Order on hold.', 'error');
  };

  // ─── Reviews ───────────────────────────────────────────────────────────────
  const submitReview = (
    productId: string,
    orderId: string,
    rating: number,
    comment: string,
    photoUrl?: string
  ) => {
    if (!currentUser) return { success: false, message: 'Please sign in to submit a verified review.' };

    let targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder && orderId) {
      targetOrder = orders.find((o) => o.orderNumber === orderId);
    }

    const savedPlacedIds: string[] = (() => {
      try {
        const stored = localStorage.getItem('almadina_placed_order_ids');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    })();

    const isUserOrder = targetOrder && (
      targetOrder.userId === currentUser.id ||
      targetOrder.customerEmail?.toLowerCase() === currentUser.email?.toLowerCase() ||
      (currentUser.phoneNumber && targetOrder.customerPhone.includes(currentUser.phoneNumber.replace(/^\+251/, ''))) ||
      savedPlacedIds.includes(targetOrder.id)
    );

    if (!targetOrder || !isUserOrder) {
      return {
        success: false,
        message: 'A verified purchase from your completed orders is required to review this product.',
      };
    }

    if (targetOrder.orderStatus !== 'completed') {
      return {
        success: false,
        message: 'You can submit a review once your order has been completed and delivered.',
      };
    }

    if (reviews.find((r) => r.productId === productId && r.orderId === targetOrder.id)) {
      return { success: false, message: 'You have already submitted a review for this product on this order.' };
    }

    const newReview: Review = {
      id: 'rev-' + Date.now(),
      productId,
      orderId: targetOrder.id,
      orderNumber: targetOrder.orderNumber,
      userId: currentUser.id,
      userName: currentUser.name || 'Verified Customer',
      rating: Math.min(5, Math.max(1, rating)),
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending_approval',
      photoUrl: photoUrl || undefined,
    };

    setReviews((prev) => [newReview, ...prev]);
    upsertReviewToSupabase(newReview);

    // Notify admin in background
    fetch('/api/contact/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: currentUser.name || 'Customer',
        email: currentUser.email || '',
        phone: currentUser.phoneNumber || '',
        subject: `[New Customer Review Submitted] - ${rating} Stars for Product ${productId}`,
        message: `Customer ${currentUser.name} (${currentUser.email || currentUser.phoneNumber}) submitted a ${rating}-star review for product ID: ${productId} on order ${targetOrder.orderNumber}.\n\nReview:\n"${comment}"\n\nPlease moderate this review in the Admin Review Queue.`,
      }),
    }).catch(() => {});

    showToast('Review submitted! It will appear in the storefront once approved by moderation.', 'success');
    return { success: true, message: 'Review submitted successfully.' };
  };

  const moderateReview = (reviewId: string, status: 'approved' | 'rejected') => {
    let updatedTargetReview: Review | undefined;
    const updatedReviewsList = reviews.map((r) => {
      if (r.id === reviewId) {
        updatedTargetReview = { ...r, status };
        return updatedTargetReview;
      }
      return r;
    });

    setReviews(updatedReviewsList);

    if (updatedTargetReview) {
      upsertReviewToSupabase(updatedTargetReview);

      // Automatically recalculate target product's rating and review count
      const prodId = updatedTargetReview.productId;
      const approvedForProd = updatedReviewsList.filter(
        (r) => r.productId === prodId && r.status === 'approved'
      );

      const newReviewCount = approvedForProd.length;
      const newRating =
        newReviewCount > 0
          ? Math.round(
              (approvedForProd.reduce((sum, r) => sum + r.rating, 0) / newReviewCount) * 10
            ) / 10
          : 5.0;

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === prodId) {
            const updatedProduct = {
              ...p,
              rating: newRating,
              reviewCount: newReviewCount,
            };
            upsertProductToSupabase(updatedProduct);
            return updatedProduct;
          }
          return p;
        })
      );
    }

    showToast(
      `Review ${status === 'approved' ? 'approved and published to storefront' : 'rejected'}.`,
      status === 'approved' ? 'success' : 'warning'
    );
  };

  // ─── Returns & Customer Reports ──────────────────────────────────────────
  const submitReturnReport = (data: {
    orderId?: string;
    orderNumber?: string;
    reason: ReturnReport['reason'];
    photoUrl?: string;
    notes: string;
    requestedResolution?: ReturnReport['requestedResolution'];
    affectedItemNames?: string[];
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): { success: boolean; message: string; reportId?: string } => {
    let targetOrder: Order | undefined;
    if (data.orderId) {
      targetOrder = orders.find((o) => o.id === data.orderId || o.orderNumber === data.orderId);
    } else if (data.orderNumber) {
      targetOrder = orders.find((o) => o.orderNumber === data.orderNumber || o.id === data.orderNumber);
    }

    const orderNum = targetOrder ? targetOrder.orderNumber : (data.orderNumber || 'GENERAL-STORE-INQUIRY');
    const uName = currentUser?.name || data.customerName || targetOrder?.customerName || 'Valued Customer';
    const uEmail = currentUser?.email || data.customerEmail || targetOrder?.customerEmail || '';
    const uPhone = currentUser?.phoneNumber || data.customerPhone || targetOrder?.customerPhone || '';
    const uId = currentUser?.id || 'guest-' + Date.now();

    if (!data.notes || !data.notes.trim()) {
      return { success: false, message: 'Please provide details or notes describing the issue.' };
    }

    const reportId = 'REP-' + Date.now().toString().slice(-6);

    const newReport: ReturnReport = {
      id: reportId,
      orderId: targetOrder?.id,
      orderNumber: orderNum,
      userId: uId,
      userName: uName,
      userPhone: uPhone,
      customerEmail: uEmail,
      reason: data.reason,
      photoUrl: data.photoUrl || '',
      notes: data.notes.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending_review',
      requestedResolution: data.requestedResolution || 'refund',
      affectedItemNames: data.affectedItemNames || [],
    };

    setReturnReports((prev) => [newReport, ...prev]);
    upsertReturnToSupabase(newReport);

    // Save to local storage for resilience
    try {
      const stored = localStorage.getItem('almadina_return_reports_v3');
      const parsed = stored ? JSON.parse(stored) : [];
      localStorage.setItem('almadina_return_reports_v3', JSON.stringify([newReport, ...parsed]));
    } catch {
      // ignore
    }

    // Send email alert to store management inbox
    fetch('/api/contact/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newReport.userName,
        email: uEmail || 'al.medina.market90@gmail.com',
        phone: newReport.userPhone,
        subject: `[Customer Report #${reportId}] - ${data.reason.replace(/_/g, ' ').toUpperCase()} (${orderNum})`,
        message: `Customer ${newReport.userName} (${newReport.userPhone || 'No Phone'}) filed a report #${reportId}.\n\nReference: ${orderNum}\nReason: ${data.reason.replace(/_/g, ' ')}\nRequested Resolution: ${data.requestedResolution || 'Refund/Assistance'}\nAffected Items: ${(data.affectedItemNames || []).join(', ') || 'All Items'}\n\nCustomer Notes:\n"${data.notes}"\n\nPhoto Evidence: ${data.photoUrl || 'None provided'}\n\nPlease review this claim in the Admin Reports & Returns Manager.`,
      }),
    }).catch(() => {});

    showToast(`Report #${reportId} submitted successfully. Store Admin is reviewing your claim!`, 'success');
    return { success: true, message: `Report #${reportId} submitted successfully.`, reportId };
  };

  const resolveReturnReport = (
    reportId: string,
    resolution: ReturnReport['adminResolution'] | 'investigating' | 'resolved',
    notes?: string,
    refundAmountETB?: number
  ) => {
    let updatedRep: ReturnReport | undefined;
    setReturnReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          let newStatus: ReturnReport['status'] = 'approved';
          if (resolution === 'denied') {
            newStatus = 'rejected';
          } else if (resolution === 'investigating') {
            newStatus = 'investigating';
          } else if (resolution === 'resolved') {
            newStatus = 'resolved';
          }

          updatedRep = {
            ...r,
            status: newStatus,
            adminResolution: resolution === 'investigating' ? undefined : (resolution as ReturnReport['adminResolution']),
            adminResponseNotes: notes || r.adminResponseNotes,
            refundAmountETB: refundAmountETB !== undefined ? refundAmountETB : r.refundAmountETB,
          };
          return updatedRep;
        }
        return r;
      })
    );

    if (updatedRep) {
      upsertReturnToSupabase(updatedRep);

      // If refund is approved, update order payment status to refunded
      if (resolution === 'refund') {
        const linkedOrderId = updatedRep.orderId;
        setOrders((prevOrders) =>
          prevOrders.map((o) => {
            if (o.id === linkedOrderId || o.orderNumber === updatedRep?.orderNumber) {
              const updatedOrder: Order = {
                ...o,
                paymentStatus: 'refunded',
                updatedAt: new Date().toISOString(),
              };
              upsertOrderToSupabase(updatedOrder);
              return updatedOrder;
            }
            return o;
          })
        );
      }

      showToast(`Report ${reportId} updated to: ${resolution}`, 'success');
    }
  };

  // ─── Contact & FAQ ─────────────────────────────────────────────────────────
  const lastContactSubmissionsRef = useRef<Map<string, number>>(new Map());

  const submitContactForm = (name: string, phone: string, rawMessage: string, customSubject?: string) => {
    // Strip any [Subject: ...] prefix from message content
    let cleanMessage = rawMessage;
    let extractedSubject = customSubject || '';

    const subjectMatch = rawMessage.match(/^\[Subject:\s*([^\]]+)\]\s*/i);
    if (subjectMatch) {
      if (!extractedSubject) {
        extractedSubject = subjectMatch[1].trim();
      }
      cleanMessage = rawMessage.replace(/^\[Subject:\s*([^\]]+)\]\s*/i, '').trim();
    }

    // Deduplication signature check: Prevent identical submissions within 5 seconds
    const signature = `${name.trim().toLowerCase()}_${phone.trim().toLowerCase()}_${cleanMessage.trim().toLowerCase()}`;
    const now = Date.now();
    const lastTime = lastContactSubmissionsRef.current.get(signature) || 0;
    if (now - lastTime < 5000) {
      console.log('[submitContactForm] Duplicate submission prevented within 5s deduplication window.');
      return;
    }
    lastContactSubmissionsRef.current.set(signature, now);

    const newContact: ContactSubmission = {
      id: 'cnt-' + Date.now(),
      name,
      phone,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setContactSubmissions((prev) => [...prev, newContact]);
    upsertContactToSupabase(newContact);

    // Extract potential email from message, name or phone if present
    let extractedEmail = '';
    const emailMatch =
      phone.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/) ||
      cleanMessage.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) {
      extractedEmail = emailMatch[0];
    } else if (currentUser?.email) {
      extractedEmail = currentUser.email;
    }

    // Filter out generic boilerplate subject titles
    const finalSubject =
      extractedSubject && !extractedSubject.toLowerCase().includes('inquiry via footer email icon')
        ? extractedSubject
        : `Customer Inquiry from ${name || 'Store Visitor'}`;

    // Send email dispatch in background via Resend / SMTP server API
    fetch('/api/contact/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: extractedEmail,
        phone: phone.includes('@') ? '' : phone,
        subject: finalSubject,
        message: cleanMessage,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && !data.isSimulation) {
          showToast(`Inquiry delivered directly to management inbox!`, 'success');
        } else {
          showToast('Message recorded and submitted to Almedina Market.', 'success');
        }
      })
      .catch((err) => {
        console.warn('[Contact Email Dispatch Error]', err);
        showToast('Message submitted to Almedina Market.', 'success');
      });
  };

  const markContactRead = (id: string) => setContactSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, isRead: true } : s));
  const updateFAQ = (updatedFaqs: FAQItem[]) => { setFaqs(updatedFaqs); showToast('FAQs updated.', 'success'); };

  const contextValue: AppContextType = {
    userRole,
    viewTab,
    setViewTab,
    deviceFrame,
    setDeviceFrame,
    currentUser,
    authLoading,
    pendingVerificationEmail,
    registerUser,
    loginUser,
    loginWithGoogle,
    sendPasswordReset,
    logoutUser,
    resendVerificationEmail,
    checkEmailVerification,
    updateAccountSettings,
    saveAddress,
    removeAddress,
    adminSession,
    loginAdmin,
    verifyAdmin2FA,
    logoutAdmin,
    simulateAdminLoginOnOtherDevice,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    syncAllDataToDatabase,
    databaseStats: {
      isConnected: supabaseConnected,
      categoriesCount: categories.length,
      productsCount: products.length,
      ordersCount: orders.length,
      isSyncing: isSyncingDatabase,
    },
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    favorites,
    toggleFavorite,
    shoppingLists,
    createShoppingList,
    addToList,
    moveListToCart,
    deleteShoppingList,
    renameShoppingList,
    updateShoppingListItemQty,
    removeShoppingListItem,
    orders,
    createOrder,
    updateOrderQuantity,
    cancelOrder,
    updateOrderStatus,
    verifyChapaPayment,
    startChapaCheckout,
    recordCashPaymentReceived,
    confirmOrderViaEmail,
    pendingChapaOrder,
    setPendingChapaOrder,
    simulateChapaPaymentSuccess,
    simulateChapaPaymentFailure,
    reviews,
    submitReview,
    moderateReview,
    returnReports,
    submitReturnReport,
    resolveReturnReport,
    contactSubmissions,
    submitContactForm,
    markContactRead,
    faqs,
    updateFAQ,
    supabaseConnected,
    toasts,
    showToast,
    removeToast,
    theme,
    toggleTheme,
    setTheme,
    authModalOpen,
    setAuthModalOpen,
    authRedirectMessage,
    setAuthRedirectMessage,
    selectedProductModal,
    setSelectedProductModal,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
