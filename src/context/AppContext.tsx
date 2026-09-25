import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { safeStorage as localStorage } from "../lib/safeStorage";
import {
  useMirroredCollection,
  useMirroredDoc,
  useUpsertedCollection,
  onPersistenceStatus,
} from "../lib/persistence";
import {
  User,
  AdminSection,
  MiMonceTab,
  Product,
  Order,
  OrderStatus,
  CustomRequest,
  ImportantDate,
  BlockedDate,
  CalendarDate,
  GalleryItem,
  Review,
  AppNotification,
  CartItem,
  SiteSettings,
  DEFAULT_CATEGORIES,
  HomepageConfig,
  MaintenanceModeConfig,
  DayAvailability,
  PaymentProof,
  ChatMessage,
  ChatConversation,
  GiftCard,
  GiftCardRedemption,
  AdminOrderAlert,
  LoyaltyTier,
  LoyaltyTransaction,
  LoyaltyProgramConfig,
  DiscountCoupon,
  CustomerLoyaltyProgress,
  LoyaltyProgramStats,
  PaymentMethodConfig,
  isOrderPaymentApproved,
  isOrderEligibleForLoyalty,
  CustomerPersonalDate,
  CustomerPerson,
  CustomerSavedMessage,
  CustomerNotificationPreferences,
  Giveaway,
  GiveawayEntry,
  GiveawayWinner,
  StoreDiscount,
} from "../types";
import { playOrderChime } from "../utils/soundEffects";
import { sendPushNotification } from "../lib/pushNotifications";
import {
  INITIAL_SETTINGS,
  INITIAL_HOMEPAGE_CONFIG,
  INITIAL_PRODUCTS,
  INITIAL_IMPORTANT_DATES,
  INITIAL_BLOCKED_DATES,
  INITIAL_GALLERY,
  INITIAL_REVIEWS,
  INITIAL_ADMIN_USER,
  INITIAL_DEMO_CUSTOMER,
  INITIAL_CHAT_CONVERSATIONS,
  INITIAL_GIFT_CARDS,
  INITIAL_LOYALTY_TIERS,
  INITIAL_LOYALTY_CONFIG,
  INITIAL_LOYALTY_TRANSACTIONS,
  INITIAL_COUPONS,
} from "../data/initialData";
import {
  INITIAL_GIVEAWAYS,
  INITIAL_GIVEAWAY_ENTRIES,
  INITIAL_GIVEAWAY_WINNERS,
  INITIAL_STORE_DISCOUNTS,
} from "../data/giveawaysInitialData";
import {
  COLLECTIONS,
  subscribeToDoc,
  subscribeToCollection,
  saveSiteSettingsToFirestore,
  saveHomepageConfigToFirestore,
  saveProductToFirestore,
  saveOrderToFirestore,
  saveCustomRequestToFirestore,
  saveLoyaltyTierToFirestore,
  deleteLoyaltyTierFromFirestore,
  saveLoyaltyTransactionToFirestore,
  deleteLoyaltyTransactionFromFirestore,
  saveLoyaltyConfigToFirestore,
  saveCouponToFirestore,
  deleteCouponFromFirestore,
  saveGiftCardToFirestore,
  deleteGiftCardFromFirestore,
  saveImportantDateToFirestore,
  deleteImportantDateFromFirestore,
  saveBlockedDateToFirestore,
  deleteBlockedDateFromFirestore,
  saveGalleryItemToFirestore,
  deleteGalleryItemFromFirestore,
  saveReviewToFirestore,
  deleteReviewFromFirestore,
  deleteOrderFromFirestore,
  deleteCustomRequestFromFirestore,
  saveChatConversationToFirestore,
  saveGiveawayToFirestore,
  deleteGiveawayFromFirestore,
  saveGiveawayEntryToFirestore,
  saveGiveawayWinnerToFirestore,
  deleteGiveawayWinnerFromFirestore,
  saveDiscountToFirestore,
  deleteDiscountFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  deleteUserCompletelyFromServers,
  syncCompleteStateToFirestore,
  checkAndSeedFirestoreDatabase,
} from "../lib/cloudService";
import { drawGiveawayWinnerSecurely, registerGiveawayEntry } from "../services/giveawayService";
import { supabase } from "@/integrations/supabase/client";
import { generateUniqueOrderId } from "../utils/orderIdGenerator";

export interface AuthResult {
  ok: boolean;
  message?: string;
  needsConfirmation?: boolean;
  isOwner?: boolean;
}

interface AppContextType {
  // Auth
  currentUser: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, phone: string, password: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<{ ok: boolean; message?: string }>;
  changePassword: (newPassword: string) => Promise<{ ok: boolean; message?: string }>;
  authReady: boolean;
  logout: () => void;
  quickSwitchUser: (role: "admin" | "customer" | "guest") => void;
  enterOwnerMode: () => void;
  updateUserProfile: (profile: Partial<User>) => Promise<User | null>;
  deleteAccountPermanently: () => Promise<{ success: boolean; message: string }>;
  registeredUsers: User[];
  savePersonalDate: (date: CustomerPersonalDate) => void;
  deletePersonalDate: (id: string) => void;
  savePerson: (person: CustomerPerson) => void;
  deletePerson: (id: string) => void;
  saveCustomerMessage: (msg: CustomerSavedMessage) => void;
  deleteCustomerMessage: (id: string) => void;
  updateNotificationPreferences: (prefs: CustomerNotificationPreferences) => void;

  // Products
  products: Product[];
  activeProducts: Product[];
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => void;
  createProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  toggleProductAvailability: (id: string) => void;
  deleteProduct: (id: string) => void;
  resetToSampleProducts: () => void;

  // Orders
  orders: Order[];
  customerOrders: Order[];
  createOrder: (
    orderData: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt" | "statusHistory">,
  ) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  uploadPaymentProof: (orderId: string, fileUrl: string, fileName: string, notes?: string) => void;
  verifyPayment: (orderId: string, approved: boolean, depositOrReason?: number | string) => void;
  verifyPaymentProof: (orderId: string, approved: boolean, depositOrReason?: any) => void;

  // Custom Requests
  customRequests: CustomRequest[];
  customerCustomRequests: CustomRequest[];
  submitCustomRequest: (
    request: Omit<CustomRequest, "id" | "trackingNumber" | "createdAt" | "updatedAt" | "status">,
  ) => CustomRequest;
  quoteCustomRequest: (id: string, price: number, deposit: number, notes?: string) => void;
  updateCustomRequestStatus: (id: string, status: OrderStatus, quotedPrice?: number) => void;

  // Calendar & Capacity
  importantDates: ImportantDate[];
  blockedDates: BlockedDate[];
  calendarDates: CalendarDate[];
  addImportantDate: (date: Omit<ImportantDate, "id">) => void;
  updateImportantDate: (id: string, date: Partial<ImportantDate>) => void;
  deleteImportantDate: (id: string) => void;
  addBlockedDate: (blocked: Omit<BlockedDate, "id" | "createdAt">) => void;
  deleteBlockedDate: (id: string) => void;
  setDayCapacity: (dateStr: string, capacity: number) => void;
  setDayBlocked: (dateStr: string, blocked: boolean, reason?: string) => void;
  checkDateAvailability: (dateStr: string) => DayAvailability;

  // Gallery
  gallery: GalleryItem[];
  addGalleryItem: (item: Omit<GalleryItem, "id">) => void;
  deleteGalleryItem: (id: string) => void;

  // Reviews
  reviews: Review[];
  addReview: (review: Omit<Review, "id" | "date">) => void;
  deleteReview: (id: string) => void;

  // Cart & Wishlist
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  wishlist: string[]; // product IDs
  toggleWishlist: (productId: string) => void;

  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  sendNotification: (notification: Omit<AppNotification, "id" | "createdAt" | "read">) => void;

  // Site Settings & CMS
  siteSettings: SiteSettings;
  categories: string[];
  addCategory: (name: string) => void;
  renameCategory: (oldName: string, newName: string) => void;
  deleteCategory: (name: string) => void;
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;
  homepageConfig: HomepageConfig;
  updateHomepageConfig: (config: Partial<HomepageConfig>) => void;

  // Maintenance Mode
  isMaintenanceActive: boolean;
  toggleMaintenanceMode: (forceState?: boolean) => void;
  updateMaintenanceConfig: (config: Partial<MaintenanceModeConfig>) => void;
  previewAsVisitor: boolean;
  setPreviewAsVisitor: (preview: boolean) => void;

  // Active view navigation helper
  activeTab: string;
  setActiveTab: (tab: string) => void;
  customerAccountTab: MiMonceTab;
  setCustomerAccountTab: (tab: MiMonceTab) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  customRequestType: "ramos" | "peluches";
  setCustomRequestType: (type: "ramos" | "peluches") => void;

  // Feedback, Toasts & Micro-animations
  toast: {
    id: string;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    price?: number;
    actionLabel?: string;
    onAction?: () => void;
  } | null;
  showToast: (toast: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    price?: number;
    actionLabel?: string;
    onAction?: () => void;
  }) => void;
  clearToast: () => void;
  cartBounceKey: number;

  // Admin Real-Time Visual Alerts (Toasts)
  adminOrderAlerts: AdminOrderAlert[];
  dismissAdminOrderAlert: (id: string) => void;
  clearAllAdminOrderAlerts: () => void;
  triggerAdminOrderAlert: (order: Order, isCustom?: boolean) => void;
  adminSoundEnabled: boolean;
  toggleAdminSound: () => void;
  testAdminOrderAlert: () => void;

  // Internal Chat System
  chatConversations: ChatConversation[];
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  chatDraftMessage: string;
  setChatDraftMessage: (msg: string) => void;
  openInternalChat: (initialMessage?: string, orderNumberRef?: string) => void;
  sendChatMessage: (
    paramsOrConvoId:
      | string
      | {
          text: string;
          imageUrl?: string;
          orderNumberRef?: string;
          targetConversationId?: string;
          role?: "admin" | "customer";
          senderName?: string;
          fontStyle?: "sans" | "serif" | "mono" | "cursive";
        },
    textIfConvoId?: string,
  ) => void;
  markChatAsRead: (conversationId: string, forRole?: "admin" | "customer") => void;
  deleteChatConversation: (conversationId: string) => void;

  // Digital Gift Cards
  giftCards: GiftCard[];
  purchaseGiftCard: (
    cardData: Omit<
      GiftCard,
      "id" | "code" | "createdAt" | "currentBalance" | "status" | "redemptionHistory"
    > & {
      customCode?: string;
    },
  ) => Promise<GiftCard>;
  redeemGiftCard: (
    code: string,
    amount: number,
    orderId?: string,
    orderNumber?: string,
  ) => { success: boolean; appliedAmount: number; remainingBalance: number; error?: string };
  checkGiftCard: (code: string) => GiftCard | null;
  updateGiftCardStatus: (cardId: string, status: GiftCard["status"]) => void;
  createAdminGiftCard: (card: Partial<GiftCard>) => GiftCard;
  deleteGiftCard: (cardId: string) => void;

  // Loyalty & Rewards System
  loyaltyTiers: LoyaltyTier[];
  createLoyaltyTier: (tier: Omit<LoyaltyTier, "id" | "createdAt" | "updatedAt">) => LoyaltyTier;
  updateLoyaltyTier: (id: string, updates: Partial<LoyaltyTier>) => void;
  deleteLoyaltyTier: (id: string) => void;
  toggleLoyaltyTierStatus: (id: string) => void;
  resetToDefaultLoyaltyTiers: () => void;

  // Coupons & Promo Codes
  coupons: DiscountCoupon[];
  createCoupon: (coupon: Omit<DiscountCoupon, "id" | "createdAt" | "usedCount">) => DiscountCoupon;
  updateCoupon: (id: string, updates: Partial<DiscountCoupon>) => void;
  deleteCoupon: (id: string) => void;
  toggleCouponStatus: (id: string) => void;
  validateCoupon: (
    code: string,
    subtotalUSD: number,
    customerTierId?: string,
  ) => {
    valid: boolean;
    discountAmountUSD: number;
    discountAmountLocal: number;
    message: string;
    coupon?: DiscountCoupon;
  };
  applyCouponUsage: (couponId: string) => void;

  // Real-Time Loyalty Progress, Transactions & Program Config
  loyaltyConfig: LoyaltyProgramConfig;
  loyaltyTransactions: LoyaltyTransaction[];
  saveLoyaltyConfig: (config: LoyaltyProgramConfig) => void;
  adjustCustomerPoints: (
    customerId: string,
    points: number,
    note: string,
  ) => { success: boolean; message: string };
  redeemPointsForCoupon: (pointsToRedeem: number) => {
    success: boolean;
    message: string;
    coupon?: DiscountCoupon;
  };
  customerLoyaltyProgress: CustomerLoyaltyProgress;
  getCustomerLoyaltyProgress: (
    customerId?: string,
    customerEmail?: string,
  ) => CustomerLoyaltyProgress;
  upgradeTierWithPoints: (targetTierId?: string) => { success: boolean; message: string };
  loyaltyProgramStats: LoyaltyProgramStats;
  isLoyaltyModalOpen: boolean;
  setIsLoyaltyModalOpen: (open: boolean) => void;

  // Cloud & Real-Time Sync
  isFirestoreConnected: boolean;
  isSyncing: boolean;
  syncStatus: "idle" | "saving" | "saved" | "error" | "syncing_live";
  lastSavedTime: Date | null;
  connectedDevicesCount: number;
  saveAllNow: (overrides?: Record<string, any>) => Promise<boolean>;
  reloadFromServer: () => Promise<void>;

  // Owner Admin Navigation State
  adminSection: AdminSection;
  setAdminSection: (section: AdminSection) => void;

  // Sorteos y Descuentos (Giveaways & Discounts)
  giveaways: Giveaway[];
  giveawayEntries: GiveawayEntry[];
  giveawayWinners: GiveawayWinner[];
  discounts: StoreDiscount[];
  createGiveaway: (giveaway: Omit<Giveaway, "id" | "createdAt">) => Promise<Giveaway>;
  updateGiveaway: (giveaway: Giveaway) => Promise<void>;
  deleteGiveaway: (giveawayId: string) => Promise<void>;
  toggleGiveawayStatus: (giveawayId: string) => Promise<void>;
  cancelGiveaway: (giveawayId: string) => Promise<void>;
  participateInGiveaway: (
    giveawayId: string,
  ) => Promise<{ success: boolean; message: string; entry?: GiveawayEntry }>;
  drawGiveawayWinner: (
    giveawayId: string,
  ) => Promise<{
    success: boolean;
    message?: string;
    winner?: GiveawayWinner;
    giftCard?: GiftCard;
  }>;
  updateGiveawayPrizeStatus: (
    winnerId: string,
    status: GiveawayWinner["prizeStatus"],
  ) => Promise<void>;
  createDiscount: (discount: Omit<StoreDiscount, "id" | "createdAt">) => Promise<StoreDiscount>;
  updateDiscount: (discount: StoreDiscount) => Promise<void>;
  deleteDiscount: (discountId: string) => Promise<void>;
  toggleDiscountStatus: (discountId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: "lazo_eterno_user",
  REGISTERED_USERS: "lazo_eterno_registered_users",
  PRODUCTS: "lazo_eterno_products",
  ORDERS: "lazo_eterno_orders",
  CUSTOM_REQUESTS: "lazo_eterno_custom_requests",
  IMPORTANT_DATES: "lazo_eterno_important_dates",
  BLOCKED_DATES: "lazo_eterno_blocked_dates",
  GALLERY: "lazo_eterno_gallery",
  REVIEWS: "lazo_eterno_reviews",
  CART: "lazo_eterno_cart",
  WISHLIST: "lazo_eterno_wishlist",
  NOTIFICATIONS: "lazo_eterno_notifications",
  SETTINGS: "lazo_eterno_settings",
  HOMEPAGE: "lazo_eterno_homepage",
  CHAT_CONVERSATIONS: "lazo_eterno_chat_conversations",
  GIFT_CARDS: "lazo_eterno_gift_cards",
  LOYALTY_TIERS: "lazo_eterno_loyalty_tiers",
  LOYALTY_CONFIG: "hecho_por_monse_loyalty_config",
  LOYALTY_TRANSACTIONS: "hecho_por_monse_loyalty_transactions",
  COUPONS: "lazo_eterno_coupons",
  GIVEAWAYS: "lazo_eterno_giveaways",
  GIVEAWAY_ENTRIES: "lazo_eterno_giveaway_entries",
  GIVEAWAY_WINNERS: "lazo_eterno_giveaway_winners",
  DISCOUNTS: "lazo_eterno_discounts",
};

// Automatic one-time purge of demo data to ensure a completely clean slate with zero demo items
if (typeof window !== "undefined") {
  const PURGE_FLAG = "lazo_eterno_demo_purge_v6_live";
  if (!localStorage.getItem(PURGE_FLAG)) {
    try {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_REQUESTS);
      localStorage.removeItem(STORAGE_KEYS.IMPORTANT_DATES);
      localStorage.removeItem(STORAGE_KEYS.BLOCKED_DATES);
      localStorage.removeItem(STORAGE_KEYS.GALLERY);
      localStorage.removeItem(STORAGE_KEYS.REVIEWS);
      localStorage.removeItem(STORAGE_KEYS.WISHLIST);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEYS.CHAT_CONVERSATIONS);
      localStorage.setItem(PURGE_FLAG, "done");
    } catch (err) {
      console.warn("Demo data purge notice:", err);
    }
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation / View State
  const [activeTab, setActiveTab] = useState<string>("inicio");
  const [adminSection, setAdminSection] = useState<AdminSection>("stats");
  const [customerAccountTab, setCustomerAccountTab] = useState<MiMonceTab>("inicio");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [customRequestType, setCustomRequestType] = useState<"ramos" | "peluches">("ramos");

  // User State - Clean fresh start (no demo account forced)
  // Start as null on server AND client first paint, then restore the cached
  // user in an effect — reading localStorage in the initializer causes an
  // SSR hydration mismatch (server renders "Entrar", client renders the menu).
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {
      /* ignore corrupted cache */
    }
  }, []);

  // Micro-interactions & Toast Feedback
  const [cartBounceKey, setCartBounceKey] = useState<number>(0);
  const [toast, setToast] = useState<{
    id: string;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    price?: number;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  const showToast = (toastData: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    price?: number;
    actionLabel?: string;
    onAction?: () => void;
  }) => {
    setToast({
      ...toastData,
      id: "toast-" + Date.now(),
    });
  };

  const clearToast = () => setToast(null);

  // Admin Real-Time Visual Alerts State
  const [adminOrderAlerts, setAdminOrderAlerts] = useState<AdminOrderAlert[]>([]);
  const [adminSoundEnabled, setAdminSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("lazo_eterno_admin_sound");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleAdminSound = useCallback(() => {
    setAdminSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("lazo_eterno_admin_sound", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const dismissAdminOrderAlert = useCallback((id: string) => {
    setAdminOrderAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAllAdminOrderAlerts = useCallback(() => {
    setAdminOrderAlerts([]);
  }, []);

  // Track known order IDs and persist seen alerts to avoid duplicate toasts on reload or re-entry
  const getSeenOrderAlerts = useCallback((): Set<string> => {
    try {
      const raw = localStorage.getItem("lazo_eterno_seen_alerts");
      return raw ? new Set(JSON.parse(raw)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }, []);

  const markOrderAlertAsSeen = useCallback(
    (orderId: string) => {
      try {
        const current = getSeenOrderAlerts();
        current.add(orderId);
        localStorage.setItem(
          "lazo_eterno_seen_alerts",
          JSON.stringify(Array.from(current).slice(-100)),
        );
      } catch (_) {}
    },
    [getSeenOrderAlerts],
  );

  const knownOrderIdsRef = useRef<Set<string>>(
    (() => {
      const ids = new Set<string>();
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              parsed.forEach((o: any) => o?.id && ids.add(o.id));
            }
          }
        } catch (_) {}
      }
      return ids;
    })(),
  );

  const triggerAdminOrderAlert = useCallback(
    (order: Order, isCustom?: boolean) => {
      if (!order || !order.id) return;

      // Check if alert was already displayed in this or a previous visit
      const seen = getSeenOrderAlerts();
      if (seen.has(order.id)) {
        return;
      }

      // Do not trigger toast banners for historic orders (> 15 minutes old) upon page enter
      const orderCreatedAt = new Date(order.createdAt).getTime();
      if (!isNaN(orderCreatedAt) && Date.now() - orderCreatedAt > 15 * 60 * 1000) {
        markOrderAlertAsSeen(order.id);
        return;
      }

      // Mark as alerted immediately to prevent repeating
      markOrderAlertAsSeen(order.id);

      const alertId = "alert-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);

      const itemsSummary =
        order.items && order.items.length > 0
          ? order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")
          : isCustom
            ? "Reserva de Ramo Personalizado"
            : "Reserva de Flores Eternas";

      const itemImage =
        order.items && order.items[0]?.productImage ? order.items[0].productImage : undefined;

      const newAlert: AdminOrderAlert = {
        id: alertId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        totalPrice: order.totalPrice,
        requiredDeposit: order.requiredDeposit,
        scheduledDate: order.scheduledDate,
        scheduledTimeSlot: order.scheduledTimeSlot,
        deliveryMethod: order.deliveryMethod,
        itemsSummary,
        itemImage,
        itemsCount: order.items ? order.items.length : 1,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isCustomRequest: isCustom || order.isCustomRequest,
      };

      setAdminOrderAlerts((prev) =>
        [newAlert, ...prev.filter((a) => a.orderId !== order.id)].slice(0, 5),
      );

      if (adminSoundEnabled) {
        playOrderChime();
      }

      // Also trigger system background Web Push Notification
      sendPushNotification({
        title: `Nuevo Pedido #${order.orderNumber} 🌹`,
        body: `${order.customerName} apartó para el ${order.scheduledDate}. Total: $${order.totalPrice}`,
        url: window.location.origin + "?tab=admin-pedidos",
        tag: `order-${order.id}`,
      }).catch(() => {});

      // Broadcast across browser tabs via BroadcastChannel
      try {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel("lazo_eterno_orders_channel");
          channel.postMessage({ type: "NEW_ORDER_ALERT", alert: newAlert });
          channel.close();
        }
      } catch (e) {}
    },
    [adminSoundEnabled, getSeenOrderAlerts, markOrderAlertAsSeen],
  );

  // Listen to BroadcastChannel for cross-tab notifications on same machine
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    try {
      const channel = new BroadcastChannel("lazo_eterno_orders_channel");
      channel.onmessage = (event) => {
        if (event.data && event.data.type === "NEW_ORDER_ALERT" && event.data.alert) {
          const incomingAlert = event.data.alert as AdminOrderAlert;
          setAdminOrderAlerts((prev) => {
            if (prev.some((a) => a.id === incomingAlert.id || a.orderId === incomingAlert.orderId))
              return prev;
            return [incomingAlert, ...prev].slice(0, 5);
          });
          if (adminSoundEnabled) {
            playOrderChime();
          }
        }
      };
      return () => {
        channel.close();
      };
    } catch (e) {}
  }, [adminSoundEnabled]);

  const testAdminOrderAlert = useCallback(() => {
    const sampleBouquets = [
      "Ramo Buchón 50 Rosas Satinadas con Corona de Circonias",
      "Ramo Eterno 24 Rosas Rojo Pasión con Mariposas Doradas",
      "Ramo Imperial 100 Rosas con Luces LED Cálidas",
      "Caja Sorpresa Velvet 18 Rosas Rosa Pastel y Chocolates Ferrero",
    ];
    const sampleNames = [
      "Camila Morales",
      "Sofía Villarreal",
      "Diego Hinojosa",
      "Valeria Castillo",
      "Andrea Garza",
    ];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomProduct = sampleBouquets[Math.floor(Math.random() * sampleBouquets.length)];
    const fakeOrderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const randomDate = new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0];

    const fakeOrder: Order = {
      id: "demo-alert-" + Date.now(),
      orderNumber: fakeOrderNumber,
      customerId: "usr-demo-" + Date.now(),
      customerName: randomName,
      customerEmail: "cliente@ejemplo.com",
      customerPhone: "+52 81 1234 5678",
      items: [
        {
          productName: randomProduct,
          productImage:
            "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80",
          quantity: 1,
          unitPrice: 1350,
          selectedExtras: [],
          subtotal: 1350,
        },
      ],
      scheduledDate: randomDate,
      scheduledTimeSlot: "14:00 - 17:00",
      deliveryMethod: "RETIRO",
      deliveryAddress: undefined,
      status: "ESPERANDO_PAGO",
      totalPrice: 1350,
      requiredDeposit: 675,
      amountPaid: 0,
      remainingBalance: 675,
      paymentStatus: "PENDIENTE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [],
    };

    triggerAdminOrderAlert(fakeOrder);
  }, [triggerAdminOrderAlert]);

  // Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!saved) return INITIAL_SETTINGS;
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_SETTINGS,
        ...parsed,
        bankDetails: { ...INITIAL_SETTINGS.bankDetails, ...(parsed.bankDetails || {}) },
        paymentMethods:
          Array.isArray(parsed.paymentMethods) && parsed.paymentMethods.length > 0
            ? parsed.paymentMethods
            : INITIAL_SETTINGS.paymentMethods,
        guarantees:
          parsed.guarantees && parsed.guarantees.length > 0
            ? parsed.guarantees
            : INITIAL_SETTINGS.guarantees,
      };
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Homepage Config
  const [homepageConfig, setHomepageConfig] = useState<HomepageConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HOMEPAGE);
      if (!saved) return INITIAL_HOMEPAGE_CONFIG;
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_HOMEPAGE_CONFIG,
        ...parsed,
        hero: { ...INITIAL_HOMEPAGE_CONFIG.hero, ...(parsed.hero || {}) },
        aboutUs: { ...INITIAL_HOMEPAGE_CONFIG.aboutUs, ...(parsed.aboutUs || {}) },
        sectionOrder:
          parsed.sectionOrder && parsed.sectionOrder.length > 0
            ? parsed.sectionOrder
            : INITIAL_HOMEPAGE_CONFIG.sectionOrder,
        sectionVisibility: {
          ...INITIAL_HOMEPAGE_CONFIG.sectionVisibility,
          ...(parsed.sectionVisibility || {}),
        },
      };
    } catch {
      return INITIAL_HOMEPAGE_CONFIG;
    }
  });

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Registered Users (Real accounts)
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orders - Clean real data only
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter((o: Order) => o.id !== "ord-demo-1") : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  // Custom Requests - Clean real data only
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_REQUESTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter((r: CustomRequest) => r.id !== "req-demo-1")
          : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  // Important Dates
  const [importantDates, setImportantDates] = useState<ImportantDate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.IMPORTANT_DATES);
      return saved ? JSON.parse(saved) : INITIAL_IMPORTANT_DATES;
    } catch {
      return INITIAL_IMPORTANT_DATES;
    }
  });

  // Blocked Dates
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BLOCKED_DATES);
      return saved ? JSON.parse(saved) : INITIAL_BLOCKED_DATES;
    } catch {
      return INITIAL_BLOCKED_DATES;
    }
  });

  // Gallery
  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GALLERY);
      return saved ? JSON.parse(saved) : INITIAL_GALLERY;
    } catch {
      return INITIAL_GALLERY;
    }
  });

  // Reviews
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WISHLIST);
      return saved ? JSON.parse(saved).filter((id: string) => id !== "prod-1") : [];
    } catch {
      return [];
    }
  });

  // Notifications - Clean real data only
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          const deduped: AppNotification[] = [];
          for (const item of parsed) {
            if (!item) continue;
            let id = item.id;
            if (!id || seen.has(id)) {
              id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            }
            seen.add(id);
            deduped.push({ ...item, id });
          }
          return deduped;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Digital Gift Cards State - Only real cards created by the owner
  const [giftCards, setGiftCards] = useState<GiftCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GIFT_CARDS);
      if (saved) {
        const parsed: GiftCard[] = JSON.parse(saved);
        // Exclude any legacy sample cards
        return parsed.filter((c) => c.id !== "gc-sample-1" && c.code !== "LAZO-ROSA-500");
      }
      return INITIAL_GIFT_CARDS;
    } catch {
      return INITIAL_GIFT_CARDS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GIFT_CARDS, JSON.stringify(giftCards));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [giftCards]);

  // Loyalty & Rewards State
  const [loyaltyTiers, setLoyaltyTiers] = useState<LoyaltyTier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOYALTY_TIERS);
      return saved ? JSON.parse(saved) : INITIAL_LOYALTY_TIERS;
    } catch {
      return INITIAL_LOYALTY_TIERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOYALTY_TIERS, JSON.stringify(loyaltyTiers));
    } catch (e) {
      console.warn("Storage notice saving loyalty tiers:", e);
    }
  }, [loyaltyTiers]);

  // Loyalty Program Configuration State
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyProgramConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOYALTY_CONFIG);
      return saved ? JSON.parse(saved) : INITIAL_LOYALTY_CONFIG;
    } catch {
      return INITIAL_LOYALTY_CONFIG;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOYALTY_CONFIG, JSON.stringify(loyaltyConfig));
    } catch (e) {
      console.warn("Storage notice saving loyalty config:", e);
    }
  }, [loyaltyConfig]);

  // Loyalty Transactions History Ledger
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOYALTY_TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_LOYALTY_TRANSACTIONS;
    } catch {
      return INITIAL_LOYALTY_TRANSACTIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOYALTY_TRANSACTIONS, JSON.stringify(loyaltyTransactions));
    } catch (e) {
      console.warn("Storage notice saving loyalty transactions:", e);
    }
  }, [loyaltyTransactions]);

  // Coupons & Promo Codes State
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COUPONS);
      return saved ? JSON.parse(saved) : INITIAL_COUPONS;
    } catch {
      return INITIAL_COUPONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
    } catch (e) {
      console.warn("Storage notice saving coupons:", e);
    }
  }, [coupons]);

  // Sorteos (Giveaways) State
  const [giveaways, setGiveaways] = useState<Giveaway[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GIVEAWAYS);
      return saved ? JSON.parse(saved) : INITIAL_GIVEAWAYS;
    } catch {
      return INITIAL_GIVEAWAYS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GIVEAWAYS, JSON.stringify(giveaways));
    } catch (e) {
      console.warn("Storage notice saving giveaways:", e);
    }
  }, [giveaways]);

  // Participaciones de Sorteos (Giveaway Entries) State
  const [giveawayEntries, setGiveawayEntries] = useState<GiveawayEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GIVEAWAY_ENTRIES);
      return saved ? JSON.parse(saved) : INITIAL_GIVEAWAY_ENTRIES;
    } catch {
      return INITIAL_GIVEAWAY_ENTRIES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GIVEAWAY_ENTRIES, JSON.stringify(giveawayEntries));
    } catch (e) {
      console.warn("Storage notice saving giveaway entries:", e);
    }
  }, [giveawayEntries]);

  // Ganadores Oficiales de Sorteos (Giveaway Winners) State
  const [giveawayWinners, setGiveawayWinners] = useState<GiveawayWinner[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GIVEAWAY_WINNERS);
      return saved ? JSON.parse(saved) : INITIAL_GIVEAWAY_WINNERS;
    } catch {
      return INITIAL_GIVEAWAY_WINNERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GIVEAWAY_WINNERS, JSON.stringify(giveawayWinners));
    } catch (e) {
      console.warn("Storage notice saving giveaway winners:", e);
    }
  }, [giveawayWinners]);

  // Descuentos Comerciales de la Tienda (Store Discounts) State
  const [discounts, setDiscounts] = useState<StoreDiscount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISCOUNTS);
      return saved ? JSON.parse(saved) : INITIAL_STORE_DISCOUNTS;
    } catch {
      return INITIAL_STORE_DISCOUNTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(discounts));
    } catch (e) {
      console.warn("Storage notice saving discounts:", e);
    }
  }, [discounts]);

  // Customer Loyalty Modal State
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState<boolean>(false);

  // Save to localStorage when states update
  useEffect(() => {
    try {
      if (currentUser) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      else localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(siteSettings));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [siteSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HOMEPAGE, JSON.stringify(homepageConfig));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [homepageConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_REQUESTS, JSON.stringify(customRequests));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [customRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.IMPORTANT_DATES, JSON.stringify(importantDates));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [importantDates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BLOCKED_DATES, JSON.stringify(blockedDates));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [blockedDates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(gallery));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [gallery]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [reviews]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registeredUsers));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [registeredUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [notifications]);

  // Auth Helpers — real accounts backed by the project's own cloud
  const isAdmin = currentUser?.role === "admin";
  const [authReady, setAuthReady] = useState(false);

  const hydrateUser = useCallback(
    async (authUser: {
      id: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    }): Promise<User> => {
      const meta = authUser.user_metadata ?? {};
      const existing = await supabase
        .from("app_users")
        .select("data")
        .eq("id", authUser.id)
        .maybeSingle();
      let profile = (existing.data?.data ?? null) as Partial<User> | null;

      if (!profile) {
        profile = {
          name: (meta["name"] as string) || (authUser.email ?? "").split("@")[0],
          nickname: (meta["nickname"] as string) || undefined,
          email: authUser.email ?? "",
          phone: (meta["phone"] as string) || "",
          avatar: (meta["avatar"] as string) || undefined,
          address: (meta["address"] as string) || undefined,
          city: (meta["city"] as string) || undefined,
          state: (meta["state"] as string) || undefined,
          postalCode: (meta["postalCode"] as string) || undefined,
          createdAt: new Date().toISOString(),
        };
        await supabase.from("app_users").insert({
          id: authUser.id,
          data: JSON.parse(JSON.stringify({ ...profile, id: authUser.id })),
        });
      }

      // Admin rights come from the database (user_roles), so any device where
      // the owner signs in can publish changes in real time.
      let role: "admin" | "customer" = "customer";
      try {
        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", authUser.id);
        if (roleRows?.some((r) => r.role === "admin")) role = "admin";
      } catch (_) {
        /* fall through to email check */
      }
      if (role !== "admin") {
        const isDesignatedMasterAdmin =
          authUser.email?.toLowerCase().trim() === "admin@lazoeterno.com" ||
          authUser.email?.toLowerCase().trim() === INITIAL_ADMIN_USER.email.toLowerCase().trim();
        if (isDesignatedMasterAdmin) role = "admin";
      }

      // Permanent avatar fallback from dedicated local storage key and cached session
      const persistentAvatar = (() => {
        try {
          return (
            localStorage.getItem(`monce_avatar_${authUser.id}`) ||
            (authUser.email
              ? localStorage.getItem(`monce_avatar_${authUser.email.toLowerCase()}`)
              : null)
          );
        } catch {
          return null;
        }
      })();

      const cachedLocalUser = (() => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.USER);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (
              parsed.id === authUser.id ||
              (authUser.email && parsed.email?.toLowerCase() === authUser.email.toLowerCase())
            ) {
              return parsed;
            }
          }
        } catch {}
        return null;
      })();

      const resolvedAvatar =
        profile.avatar ||
        persistentAvatar ||
        cachedLocalUser?.avatar ||
        (meta["avatar"] as string) ||
        undefined;

      return {
        ...(profile as User),
        id: authUser.id,
        email: authUser.email ?? profile.email ?? "",
        name:
          profile.name ||
          cachedLocalUser?.name ||
          (meta["name"] as string) ||
          (authUser.email ?? "").split("@")[0],
        nickname:
          profile.nickname ||
          cachedLocalUser?.nickname ||
          (meta["nickname"] as string) ||
          undefined,
        avatar: resolvedAvatar,
        phone: profile.phone || cachedLocalUser?.phone || (meta["phone"] as string) || "",
        address:
          profile.address || cachedLocalUser?.address || (meta["address"] as string) || undefined,
        city: profile.city || cachedLocalUser?.city || (meta["city"] as string) || undefined,
        state: profile.state || cachedLocalUser?.state || (meta["state"] as string) || undefined,
        postalCode:
          profile.postalCode ||
          cachedLocalUser?.postalCode ||
          (meta["postalCode"] as string) ||
          undefined,
        role,
      } as User;
    },
    [],
  );

  useEffect(() => {
    let active = true;

    const sync = async (
      session: {
        user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> };
      } | null,
    ) => {
      if (!session?.user) {
        const localUser = (() => {
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.USER);
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        })();
        if (localUser && active) {
          setCurrentUser(localUser);
        } else if (active) {
          setCurrentUser(null);
        }
        return;
      }
      try {
        const user = await hydrateUser(session.user);
        if (active) setCurrentUser(user);
      } catch (err) {
        console.warn("[Auth] No se pudo cargar el perfil:", err);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      void sync(data.session as never).finally(() => {
        if (active) setAuthReady(true);
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void sync(session as never);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [hydrateUser]);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error || !data.user) {
      const msg = error?.message?.includes("Email not confirmed")
        ? "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."
        : "Correo o contraseña incorrectos.";
      return { ok: false, message: msg };
    }
    const user = await hydrateUser(data.user);
    setCurrentUser(user);
    return { ok: true, isOwner: user.role === "admin" };
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string,
  ): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name: name.trim(), phone: phone.trim(), role: "customer" },
      },
    });
    if (error) {
      const msg = error.message.includes("already registered")
        ? "Ya existe una cuenta con este correo. Inicia sesión."
        : error.message;
      return { ok: false, message: msg };
    }

    // Email confirmation is required: when Supabase returns no session, the
    // account exists but stays inactive until the user clicks the link.
    if (!data.session || !data.user) {
      return {
        ok: true,
        needsConfirmation: true,
        isOwner: false,
        message:
          "Te enviamos un correo de confirmación. Abre el enlace para activar tu cuenta y luego inicia sesión.",
      };
    }

    const user: User = await hydrateUser(data.user);

    user.role = "customer";
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (_) {}

    // Add to registered users list as customer
    setRegisteredUsers((prev) => {
      const next = [...prev.filter((u) => u.email.toLowerCase() !== cleanEmail), user];
      try {
        localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    void saveUserToFirestore(user);

    return { ok: true, isOwner: false };
  };

  const resetPassword = async (email: string): Promise<{ ok: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/restablecer`,
      });
      if (error) {
        return { ok: false, message: error.message };
      }
      return {
        ok: true,
        message:
          "Te hemos enviado un enlace de verificación a tu correo para restablecer tu contraseña.",
      };
    } catch (err: unknown) {
      return {
        ok: false,
        message: (err as Error)?.message || "Error al solicitar restablecimiento de contraseña.",
      };
    }
  };

  const changePassword = async (
    newPassword: string,
  ): Promise<{ ok: boolean; message?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, message: "La contraseña debe tener al menos 6 caracteres." };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        const msg = error.message.includes("should be different")
          ? "La nueva contraseña debe ser distinta a la actual."
          : error.message;
        return { ok: false, message: msg };
      }
      return { ok: true, message: "Tu contraseña ha sido actualizada correctamente." };
    } catch (err: unknown) {
      return {
        ok: false,
        message: (err as Error)?.message || "No pudimos actualizar tu contraseña.",
      };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (_) {}
    void supabase.auth.signOut();
  };

  const quickSwitchUser = (_role: "admin" | "customer" | "guest") => {
    logout();
  };

  const enterOwnerMode = () => {
    // Si no está autenticado como administradora, asigna la cuenta maestra de la dueña directamente con el código
    if (!currentUser || currentUser.role !== "admin") {
      setCurrentUser(INITIAL_ADMIN_USER);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_ADMIN_USER));
        } catch (_) {}
      }
    }
    setActiveTab("admin");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    showToast({
      title: "👑 Acceso Empresa Concedido",
      subtitle: "Bienvenida Monce. Has ingresado al panel de administración del taller.",
    });
  };

  const verifyAdminAccess = useCallback(
    (actionDescription = "Esta operación"): boolean => {
      if (!currentUser || currentUser.role !== "admin") {
        showToast({
          title: "Acceso Restringido 🔒",
          subtitle: `${actionDescription} requiere permisos autorizados de la dueña del negocio.`,
        });
        return false;
      }
      return true;
    },
    [currentUser, showToast],
  );

  const updateUserProfile = async (profile: Partial<User>): Promise<User | null> => {
    if (!currentUser) return null;
    // Security restriction: prevent non-admin clients from falsifying loyalty points, tiers or administrative roles
    const safeProfile = { ...profile };
    if (currentUser.role !== "admin") {
      delete (safeProfile as Record<string, unknown>).role;
      delete (safeProfile as Record<string, unknown>).loyaltyPoints;
      delete (safeProfile as Record<string, unknown>).spentLoyaltyPoints;
      delete (safeProfile as Record<string, unknown>).customLoyaltyTierId;
    }
    const next: User = { ...currentUser, ...safeProfile };

    // Explicitly handle avatar removal vs update
    if (profile.avatar === undefined && "avatar" in profile) {
      delete next.avatar;
    }

    setCurrentUser(next);

    // 1. Persist to registeredUsers state & localStorage
    setRegisteredUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === next.id || (next.email && u.email?.toLowerCase() === next.email.toLowerCase())
          ? next
          : u,
      );
      try {
        localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    // 2. Persist currentUser in localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(next));
    } catch (_) {}

    // 3. Dedicated Avatar Backup (Permanent & Resistant to state wipes)
    try {
      if (next.avatar) {
        localStorage.setItem(`monce_avatar_${next.id}`, next.avatar);
        if (next.email) {
          localStorage.setItem(`monce_avatar_${next.email.toLowerCase()}`, next.avatar);
        }
      } else {
        localStorage.removeItem(`monce_avatar_${next.id}`);
        if (next.email) {
          localStorage.removeItem(`monce_avatar_${next.email.toLowerCase()}`);
        }
      }
    } catch (_) {}

    // 4. Cloud database persistence
    try {
      await saveUserToFirestore(next);
    } catch (e) {
      console.warn("[Cloud] Error persisting user to database:", e);
    }

    // 5. Supabase Auth metadata persistence
    try {
      await supabase.auth.updateUser({
        data: {
          name: next.name,
          nickname: next.nickname,
          phone: next.phone,
          avatar: next.avatar || "",
          address: next.address,
          city: next.city,
          state: next.state,
          postalCode: next.postalCode,
        },
      });
    } catch (e) {
      console.warn("[Auth] Error updating auth metadata:", e);
    }

    return next;
  };

  const deleteAccountPermanently = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: "No hay ninguna sesión activa para eliminar." };
    }
    if (
      currentUser.role === "admin" &&
      currentUser.email?.toLowerCase().trim() === INITIAL_ADMIN_USER.email.toLowerCase().trim()
    ) {
      return {
        success: false,
        message:
          "Por motivos de seguridad del taller, la cuenta principal de la administradora dueña no puede ser eliminada.",
      };
    }

    const userId = currentUser.id;
    const userEmail = currentUser.email;

    try {
      // 1. Delete all user data from cloud database (users, orders, custom requests, chats, reviews, loyalty)
      const res = await deleteUserCompletelyFromServers({ id: userId, email: userEmail });
      if (!res.success) {
        console.warn("[Cloud] Account deletion server notice:", res.error);
      }

      // 2. Remove user orders from local state
      setOrders((prev) =>
        prev.filter(
          (o) =>
            o.customerId !== userId &&
            (!userEmail || o.customerEmail?.toLowerCase() !== userEmail.toLowerCase()),
        ),
      );

      // 3. Remove custom requests from local state
      setCustomRequests((prev) =>
        prev.filter(
          (r) =>
            r.customerId !== userId &&
            (!userEmail || r.customerEmail?.toLowerCase() !== userEmail.toLowerCase()),
        ),
      );

      // 4. Remove user from registered users list
      setRegisteredUsers((prev) => {
        const next = prev.filter((u) => {
          if (u.id === userId) return false;
          if (userEmail && u.email.toLowerCase() === userEmail.toLowerCase()) return false;
          return true;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      // 5. Clean local storage
      try {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(`monce_avatar_${userId}`);
        if (userEmail) {
          localStorage.removeItem(`monce_avatar_${userEmail.toLowerCase()}`);
        }
      } catch (_) {}

      // 6. Sign out from Supabase Auth
      try {
        await supabase.auth.signOut();
      } catch (_) {}

      // 7. Reset session states
      setCurrentUser(null);
      setActiveTab("catalogo");

      showToast({
        title: "Cuenta Eliminada Definitivamente 🗑️",
        subtitle:
          "Tu cuenta y todos tus datos personales han sido eliminados de manera permanente e irreversible de los servidores.",
      });

      return {
        success: true,
        message:
          "Tu cuenta y todos tus datos personales han sido eliminados permanentemente de los servidores.",
      };
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Error al procesar la eliminación de cuenta.";
      return { success: false, message: msg };
    }
  };

  const savePersonalDate = (date: CustomerPersonalDate) => {
    if (!currentUser) return;
    const existing = currentUser.savedDates || [];
    const index = existing.findIndex((d) => d.id === date.id);
    const updatedDates =
      index >= 0 ? existing.map((d) => (d.id === date.id ? date : d)) : [date, ...existing];
    updateUserProfile({ savedDates: updatedDates });
    showToast({
      title: "Fecha Guardada 📅",
      subtitle: `${date.personName} (${date.date})`,
    });
  };

  const deletePersonalDate = (id: string) => {
    if (!currentUser) return;
    const updatedDates = (currentUser.savedDates || []).filter((d) => d.id !== id);
    updateUserProfile({ savedDates: updatedDates });
    showToast({
      title: "Fecha Eliminada",
      subtitle: "Se ha removido el recordatorio de tu lista.",
    });
  };

  const savePerson = (person: CustomerPerson) => {
    if (!currentUser) return;
    const existing = currentUser.savedPeople || [];
    const index = existing.findIndex((p) => p.id === person.id);
    const updatedPeople =
      index >= 0 ? existing.map((p) => (p.id === person.id ? person : p)) : [person, ...existing];
    updateUserProfile({ savedPeople: updatedPeople });
    showToast({
      title: "Perfil Guardado 👤",
      subtitle: `${person.name} (${person.relationship})`,
    });
  };

  const deletePerson = (id: string) => {
    if (!currentUser) return;
    const updatedPeople = (currentUser.savedPeople || []).filter((p) => p.id !== id);
    updateUserProfile({ savedPeople: updatedPeople });
    showToast({
      title: "Perfil Eliminado",
      subtitle: "Se ha removido a la persona de tu lista.",
    });
  };

  const saveCustomerMessage = (msg: CustomerSavedMessage) => {
    if (!currentUser) return;
    const existing = currentUser.savedMessages || [];
    const index = existing.findIndex((m) => m.id === msg.id);
    const updatedMessages =
      index >= 0 ? existing.map((m) => (m.id === msg.id ? msg : m)) : [msg, ...existing];
    updateUserProfile({ savedMessages: updatedMessages });
    showToast({
      title: "Mensaje Guardado 💌",
      subtitle: msg.title,
    });
  };

  const deleteCustomerMessage = (id: string) => {
    if (!currentUser) return;
    const updatedMessages = (currentUser.savedMessages || []).filter((m) => m.id !== id);
    updateUserProfile({ savedMessages: updatedMessages });
    showToast({
      title: "Mensaje Eliminado",
      subtitle: "Se ha removido la dedicatoria guardada.",
    });
  };

  const updateNotificationPreferences = (prefs: CustomerNotificationPreferences) => {
    if (!currentUser) return;
    updateUserProfile({ notificationPreferences: prefs });
    showToast({
      title: "Preferencias Actualizadas 🔔",
      subtitle: "Tus ajustes de notificaciones han sido guardados.",
    });
  };

  // Products
  const activeProducts = useMemo(() => {
    return products.filter((p) => !p.deletedAt);
  }, [products]);

  // Persists the whole catalog so the public site instantly shows the exact
  // current version of every product (and loses the ones that were removed).
  const persistProducts = (next: Product[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(next));
    } catch (e) {
      console.error("Error saving products:", e);
    }
    // El auto-guardado v2 refleja el catálogo completo en la base de datos.
  };

  const addProduct = (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    if (!verifyAdminAccess("Crear producto en el catálogo")) return;
    const newProduct: Product = {
      ...data,
      id: "prod-" + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => {
      const next = [newProduct, ...prev];
      persistProducts(next);
      return next;
    });
  };

  const createProduct = addProduct;

  const updateProduct = (id: string, updates: Partial<Product>) => {
    if (!verifyAdminAccess("Modificar producto")) return;
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
      );
      persistProducts(next);
      return next;
    });
  };

  const toggleProductAvailability = (id: string) => {
    if (!verifyAdminAccess("Cambiar disponibilidad de producto")) return;
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, available: !p.available, updatedAt: new Date().toISOString() } : p,
      );
      persistProducts(next);
      return next;
    });
  };

  const deleteProduct = (id: string) => {
    if (!verifyAdminAccess("Eliminar producto")) return;
    // Hard delete: the row disappears from the database instantly so every
    // device stops showing it right away. Orders keep their own snapshot of
    // the purchased product (name, size, price), so history stays intact.
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving products:", e);
      }
      return next;
    });
    // El auto-guardado v2 elimina la fila correspondiente en la base de datos.
  };

  const resetToSampleProducts = () => {
    if (!verifyAdminAccess("Restaurar catálogo inicial")) return;
    setProducts(INITIAL_PRODUCTS);
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    } catch (e) {
      console.error(e);
    }
    INITIAL_PRODUCTS.forEach((p) => {
      saveProductToFirestore(p).catch(console.error);
    });
  };

  // Orders
  const customerOrders = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return orders;
    return orders.filter(
      (o) => o.customerId === currentUser.id || o.customerEmail === currentUser.email,
    );
  }, [orders, currentUser, isAdmin]);

  const createOrder = (
    orderData: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt" | "statusHistory">,
  ): Order => {
    const timestamp = new Date().toISOString();
    const orderNumber = generateUniqueOrderId(orders);
    const newOrder: Order = {
      ...orderData,
      id: "ord-" + Date.now(),
      orderNumber,
      // Mandatory flow: Every new order starts as ESPERANDO_PAGO & paymentStatus PENDIENTE.
      // Must NEVER count towards loyalty until payment is manually verified & approved by owner.
      paymentStatus: "PENDIENTE",
      status: "ESPERANDO_PAGO",
      amountPaid: 0,
      remainingBalance: orderData.totalPrice,
      paymentProof: undefined,
      paymentProofUrl: undefined,
      paymentProofNotes: undefined,
      statusHistory: [
        {
          status: "ESPERANDO_PAGO",
          timestamp,
          note: "Pedido y reserva creados en el sistema. Pendiente de envío de comprobante bancario para apartar fecha.",
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    knownOrderIdsRef.current.add(newOrder.id);
    setOrders((prev) => {
      const next = [newOrder, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    // Save directly to Cloud Firestore central database
    saveOrderToFirestore(newOrder).catch((err) => {
      console.error("[Firestore] Error saving order:", err);
    });

    // Trigger visual real-time toast alert for admin
    triggerAdminOrderAlert(newOrder);

    // Send customer notification
    sendNotification({
      userId: newOrder.customerId,
      targetRole: "customer",
      title: "¡Reserva recibida con éxito! 💐",
      message: `Tu pedido #${orderNumber} ha sido agendado para el ${newOrder.scheduledDate}. Por favor realiza el depósito para confirmar.`,
      type: "order",
      linkTarget: "pedidos",
    });

    // Send admin notification
    sendNotification({
      userId: INITIAL_ADMIN_USER.id,
      targetRole: "admin",
      title: "Nuevo pedido agendado 🔔",
      message: `El cliente ${newOrder.customerName} agendó el pedido #${orderNumber} para el ${newOrder.scheduledDate}.`,
      type: "order",
      linkTarget: "admin-pedidos",
    });

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    if (!verifyAdminAccess("Actualizar estado de pedido")) return;
    const currentOrder = orders.find((o) => o.id === orderId);
    if (!currentOrder) return;

    // Strict Immutability Guardrails:
    if (currentOrder.status === "CANCELADO") {
      showToast({
        title: "Pedido Cancelado (Inmutable)",
        subtitle:
          "Este pedido ya fue cancelado de forma definitiva. Los pedidos cancelados no pueden reactivarse ni cambiar de estado.",
      });
      return;
    }

    if (currentOrder.status === "ENTREGADO" && status !== "ENTREGADO") {
      showToast({
        title: "Pedido Entregado (Inmutable)",
        subtitle:
          "Este pedido ya fue entregado al cliente con éxito. Su ciclo de vida está completado definitivamente.",
      });
      return;
    }

    if (currentOrder.status === status) {
      return;
    }

    const timestamp = new Date().toISOString();
    let updatedOrder: Order | undefined;
    const isCancelling = status === "CANCELADO";
    const isDelivering = status === "ENTREGADO";

    // Award remaining points upon delivery (total points minus points already awarded for deposit)
    let remainingPointsAwarded = 0;
    let totalOrderLoyaltyPoints = 0;
    if (isDelivering) {
      const pointsPerUSD = loyaltyConfig?.pointsPerDollar ?? 0.5;
      const baseTotalPoints = Math.max(
        1,
        Math.round((currentOrder.totalPrice || 0) * pointsPerUSD),
      );
      const isSpecialDate = importantDates.some(
        (d) => d.active && d.date === currentOrder.scheduledDate,
      );
      const bonusMultiplier = isSpecialDate
        ? (loyaltyConfig?.specialDateBonusMultiplier ?? 1.5)
        : 1;
      totalOrderLoyaltyPoints = Math.round(baseTotalPoints * bonusMultiplier);

      const previousTxs = loyaltyTransactions.filter(
        (tx) => tx.orderId === orderId && tx.points > 0,
      );
      const pointsAlreadyAwarded = previousTxs.reduce((sum, tx) => sum + tx.points, 0);
      remainingPointsAwarded = Math.max(0, totalOrderLoyaltyPoints - pointsAlreadyAwarded);

      if (remainingPointsAwarded > 0) {
        const customer =
          registeredUsers.find(
            (u) =>
              u.id === currentOrder.customerId ||
              (currentOrder.customerEmail &&
                u.email.toLowerCase() === currentOrder.customerEmail.toLowerCase()),
          ) ||
          (currentUser &&
          (currentUser.id === currentOrder.customerId ||
            (currentOrder.customerEmail &&
              currentUser.email.toLowerCase() === currentOrder.customerEmail.toLowerCase()))
            ? currentUser
            : null);

        const prevPoints = customer?.loyaltyPoints || 0;
        const newBalance = prevPoints + remainingPointsAwarded;

        const loyaltyTxId = `ltx-deliv-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        const loyaltyTx: LoyaltyTransaction = {
          id: loyaltyTxId,
          customerId: currentOrder.customerId,
          customerEmail: currentOrder.customerEmail,
          customerName: currentOrder.customerName,
          orderId: currentOrder.id,
          orderNumber: currentOrder.orderNumber,
          type: "ORDER_APPROVED",
          points: remainingPointsAwarded,
          balanceAfter: newBalance,
          description: isSpecialDate
            ? `Entrega completada (#${currentOrder.orderNumber}): liquidación final (+${remainingPointsAwarded} pts restantes, con bono especial x${bonusMultiplier})`
            : `Entrega completada (#${currentOrder.orderNumber}): liquidación final (+${remainingPointsAwarded} pts restantes)`,
          timestamp,
          createdBy: "Monse (Owner)",
          note: `Pedido entregado y liquidado al 100%. Puntos de lealtad acreditados.`,
        };

        setLoyaltyTransactions((prev) => {
          const next = [loyaltyTx, ...prev];
          try {
            localStorage.setItem(STORAGE_KEYS.LOYALTY_TRANSACTIONS, JSON.stringify(next));
          } catch (_) {}
          return next;
        });

        saveLoyaltyTransactionToFirestore(loyaltyTx).catch((err) => {
          console.warn("[Firestore] Error saving delivery loyalty transaction:", err);
        });

        if (customer) {
          const updatedCustomer = {
            ...customer,
            loyaltyPoints: newBalance,
          };
          setRegisteredUsers((prev) => {
            const next = prev.map((u) => (u.id === customer.id ? updatedCustomer : u));
            try {
              localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(next));
            } catch (_) {}
            return next;
          });
          if (currentUser && currentUser.id === customer.id) {
            setCurrentUser(updatedCustomer);
          }
          saveUserToFirestore(updatedCustomer).catch((err) => {
            console.warn("[Firestore] Error updating user points on delivery:", err);
          });
        }
      }
    } else if (isCancelling) {
      // If cancelling an order that previously received loyalty points, reverse them
      const previousOrderTxs = loyaltyTransactions.filter(
        (tx) => tx.orderId === orderId && tx.points > 0,
      );
      const pointsToReverse = previousOrderTxs.reduce((sum, tx) => sum + tx.points, 0);

      if (pointsToReverse > 0) {
        const customer =
          registeredUsers.find(
            (u) =>
              u.id === currentOrder.customerId ||
              (currentOrder.customerEmail &&
                u.email.toLowerCase() === currentOrder.customerEmail.toLowerCase()),
          ) ||
          (currentUser &&
          (currentUser.id === currentOrder.customerId ||
            (currentOrder.customerEmail &&
              currentUser.email.toLowerCase() === currentOrder.customerEmail.toLowerCase()))
            ? currentUser
            : null);

        const prevPoints = customer?.loyaltyPoints || 0;
        const newBalance = Math.max(0, prevPoints - pointsToReverse);

        const loyaltyTxId = `ltx-rev-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        const loyaltyTx: LoyaltyTransaction = {
          id: loyaltyTxId,
          customerId: currentOrder.customerId,
          customerEmail: currentOrder.customerEmail,
          customerName: currentOrder.customerName,
          orderId: currentOrder.id,
          orderNumber: currentOrder.orderNumber,
          type: "ADJUSTMENT",
          points: -pointsToReverse,
          balanceAfter: newBalance,
          description: `Cancelación de pedido (#${currentOrder.orderNumber}): reversión de ${pointsToReverse} pts`,
          timestamp,
          createdBy: "Monse (Owner)",
          note: `Pedido cancelado por la dueña. Puntos revocados.`,
        };

        setLoyaltyTransactions((prev) => {
          const next = [loyaltyTx, ...prev];
          try {
            localStorage.setItem(STORAGE_KEYS.LOYALTY_TRANSACTIONS, JSON.stringify(next));
          } catch (_) {}
          return next;
        });

        saveLoyaltyTransactionToFirestore(loyaltyTx).catch((err) => {
          console.warn("[Firestore] Error saving cancellation loyalty transaction:", err);
        });

        if (customer) {
          const updatedCustomer = {
            ...customer,
            loyaltyPoints: newBalance,
          };
          setRegisteredUsers((prev) => {
            const next = prev.map((u) => (u.id === customer.id ? updatedCustomer : u));
            try {
              localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(next));
            } catch (_) {}
            return next;
          });
          if (currentUser && currentUser.id === customer.id) {
            setCurrentUser(updatedCustomer);
          }
          saveUserToFirestore(updatedCustomer).catch((err) => {
            console.warn("[Firestore] Error updating user points on cancellation:", err);
          });
        }
      }
    }

    setOrders((prev) => {
      const next = prev.map((order) => {
        if (order.id !== orderId) return order;
        const newHistory = [
          ...order.statusHistory,
          {
            status,
            timestamp,
            note:
              note ||
              (isCancelling
                ? "Pedido y pago cancelados definitivamente por la dueña."
                : isDelivering
                  ? `Pedido entregado exitosamente. Saldo liquidado al 100%${remainingPointsAwarded > 0 ? ` (+${remainingPointsAwarded} puntos de lealtad acreditados)` : ""}.`
                  : `Estado actualizado a ${status}`),
          },
        ];
        updatedOrder = {
          ...order,
          status,
          paymentStatus: isCancelling
            ? "CANCELADO"
            : isDelivering
              ? "PAGADO_TOTAL"
              : order.paymentStatus,
          amountPaid: isCancelling ? 0 : isDelivering ? order.totalPrice : order.amountPaid,
          remainingBalance: isCancelling ? 0 : isDelivering ? 0 : order.remainingBalance,
          paymentProof:
            isCancelling && order.paymentProof
              ? {
                  ...order.paymentProof,
                  status: "CANCELADO",
                  rejectionReason: "Pedido y pago cancelados definitivamente",
                }
              : order.paymentProof,
          statusHistory: newHistory,
          updatedAt: timestamp,
        };
        return updatedOrder;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    if (updatedOrder) {
      saveOrderToFirestore(updatedOrder).catch((err) => {
        console.error("[Firestore] Error updating order status:", err);
      });
    }

    // Find order to notify
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      const statusLabels: Record<OrderStatus, string> = {
        SOLICITUD_RECIBIDA: "Solicitud recibida",
        EN_REVISION: "En revisión por la artesana",
        ESPERANDO_INFORMACION: "Esperando información adicional",
        PRECIO_ENVIADO: "Cotización de precio enviada",
        ESPERANDO_PAGO: "Esperando pago del anticipo",
        COMPROBANTE_EN_REVISION: "Comprobante en revisión",
        ANTICIPO_RECIBIDO: "Anticipo recibido exitosamente",
        PAGO_PENDIENTE_VERIFICACION: "Comprobante de pago en revisión",
        PAGO_VERIFICADO: "Pago verificado y confirmado 🟢",
        EN_PRODUCCION: "Tu ramo se está confeccionando en el taller 🎨",
        EN_PREPARACION: "Tu ramo está en confección y preparación 🎨",
        LISTO_PARA_ENTREGA: "¡Tu ramo está listo para entrega o retiro! 📦",
        LISTO: "¡Tu ramo está listo! 📦",
        ENTREGADO: "Pedido entregado exitosamente 🚚❤️",
        CANCELADO: "Pedido cancelado",
      };

      sendNotification({
        userId: order.customerId,
        targetRole: "customer",
        title: isCancelling
          ? `Pedido #${order.orderNumber} Cancelado`
          : isDelivering
            ? `¡Pedido #${order.orderNumber} Entregado y Liquidado! 🚚❤️`
            : `Actualización de pedido #${order.orderNumber}`,
        message: isCancelling
          ? "Tu pedido y pago han sido cancelados definitivamente."
          : isDelivering
            ? remainingPointsAwarded > 0
              ? `Tu ramo ha sido entregado exitosamente. Se han acreditado +${remainingPointsAwarded} puntos restantes a tu tarjeta de lealtad (total acumulado de orden: ${totalOrderLoyaltyPoints} pts).`
              : `Tu pedido #${order.orderNumber} ha sido entregado exitosamente y liquidado al 100%. ¡Gracias por tu compra!`
            : `${statusLabels[status]}${note ? `: ${note}` : ""}`,
        type: "order",
        linkTarget: "pedidos",
      });

      showToast({
        title: isDelivering
          ? "Pedido Entregado con Éxito"
          : isCancelling
            ? "Pedido Cancelado"
            : "Estado Actualizado",
        subtitle: isDelivering
          ? remainingPointsAwarded > 0
            ? `Orden entregada y liquidada al 100%. Se acreditaron +${remainingPointsAwarded} pts restantes a ${currentOrder.customerName}.`
            : `Orden entregada y liquidada al 100%.`
          : `${statusLabels[status]}${note ? `: ${note}` : ""}`,
      });
    }
  };

  const uploadPaymentProof = (
    orderId: string,
    fileUrl: string,
    fileName: string,
    notes?: string,
  ) => {
    const timestamp = new Date().toISOString();
    const proof: PaymentProof = {
      id: "proof-" + Date.now(),
      orderId,
      fileUrl,
      fileName,
      uploadedAt: timestamp,
      status: "PENDIENTE",
      notes,
    };

    let updatedOrder: Order | undefined;
    setOrders((prev) => {
      const next = prev.map((order) => {
        if (order.id !== orderId) return order;
        updatedOrder = {
          ...order,
          paymentProof: proof,
          paymentProofUrl: fileUrl,
          paymentProofNotes: notes,
          paymentProofUploadedAt: timestamp,
          paymentStatus: "VERIFICANDO",
          status: "PAGO_PENDIENTE_VERIFICACION",
          statusHistory: [
            ...order.statusHistory,
            {
              status: "PAGO_PENDIENTE_VERIFICACION",
              timestamp,
              note: `Comprobante de pago adjuntado (${fileName}). Pendiente de verificación por la dueña.`,
            },
          ],
          updatedAt: timestamp,
        };
        return updatedOrder;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    if (updatedOrder) {
      saveOrderToFirestore(updatedOrder).catch((err) => {
        console.warn("[Firestore] Error saving payment proof:", err);
      });
    }

    const order = orders.find((o) => o.id === orderId);
    // Notify admin
    sendNotification({
      userId: INITIAL_ADMIN_USER.id,
      targetRole: "admin",
      title: "Comprobante de pago recibido 🔎",
      message: `El cliente ${order?.customerName || "Cliente"} subió comprobante para el pedido #${order?.orderNumber || orderId}. Pendiente de tu aprobación manual.`,
      type: "payment",
      linkTarget: "admin-pedidos",
    });
  };

  const verifyPayment = (orderId: string, approved: boolean, depositOrReason?: number | string) => {
    if (!verifyAdminAccess("Verificar comprobante de pago")) return;
    const timestamp = new Date().toISOString();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Strict Immutability Guardrails:
    if (order.status === "CANCELADO" || order.paymentStatus === "CANCELADO") {
      showToast({
        title: "Pedido Cancelado",
        subtitle: "No se pueden verificar ni aprobar pagos de órdenes canceladas definitivamente.",
      });
      return;
    }

    if (order.status === "ENTREGADO") {
      showToast({
        title: "Pedido ya Entregado",
        subtitle:
          "El pedido ya fue completado y entregado. El estado del pago no puede modificarse.",
      });
      return;
    }

    // Prevent approving payment twice:
    if (
      approved &&
      (order.paymentStatus === "CONFIRMADO" ||
        order.paymentStatus === "PAGADO_TOTAL" ||
        order.status === "PAGO_VERIFICADO")
    ) {
      showToast({
        title: "Pago Ya Aprobado Previamente",
        subtitle: `El pago del pedido #${order.orderNumber} ya fue validado y confirmado. No es posible aprobar el pago 2 veces.`,
      });
      return;
    }

    // Prevent rejecting already rejected proof unless a new one was uploaded:
    if (
      !approved &&
      order.paymentStatus === "RECHAZADO" &&
      (!order.paymentProof || order.paymentProof.status === "RECHAZADO")
    ) {
      showToast({
        title: "Comprobante Ya Rechazado",
        subtitle: "Este comprobante ya fue rechazado. Espera a que el cliente suba uno nuevo.",
      });
      return;
    }

    let updatedOrder: Order | undefined;
    if (approved) {
      const depositAmount =
        typeof depositOrReason === "number" && depositOrReason > 0
          ? depositOrReason
          : order.requiredDeposit > 0
            ? order.requiredDeposit
            : order.totalPrice;
      const remainingBalance = Math.max(0, order.totalPrice - depositAmount);
      const isFullyPaid = remainingBalance === 0;

      // Calculate loyalty points earned based on approved payment ONLY if fully paid
      const pointsPerUSD = loyaltyConfig?.pointsPerDollar ?? 0.5;
      const basePoints = Math.max(1, Math.round(depositAmount * pointsPerUSD));
      const isSpecialDate = importantDates.some((d) => d.active && d.date === order.scheduledDate);
      const bonusMultiplier = isSpecialDate
        ? (loyaltyConfig?.specialDateBonusMultiplier ?? 1.5)
        : 1;
      const earnedPoints = isFullyPaid ? Math.round(basePoints * bonusMultiplier) : 0;

      setOrders((prev) => {
        const next = prev.map((o) => {
          if (o.id !== orderId) return o;
          updatedOrder = {
            ...o,
            amountPaid: depositAmount,
            remainingBalance,
            paymentStatus: isFullyPaid ? "PAGADO_TOTAL" : "CONFIRMADO",
            status: "PAGO_VERIFICADO",
            paymentVerifiedAt: timestamp,
            paymentVerifiedBy: currentUser?.name || "Monce (Dueña)",
            paymentProof: o.paymentProof ? { ...o.paymentProof, status: "CONFIRMADO" } : undefined,
            statusHistory: [
              ...o.statusHistory,
              {
                status: "PAGO_VERIFICADO",
                timestamp,
                note: isFullyPaid
                  ? `Pago total de $${depositAmount} aprobado y verificado al 100% por la dueña. Compra verificada para el Club de Lealtad (+${earnedPoints} pts).`
                  : `Anticipo de $${depositAmount} aprobado por la dueña. Pedido pasa a taller artesanal. Saldo pendiente: $${remainingBalance}. Los puntos de lealtad se acreditarán al liquidar el 100% del pedido.`,
              },
            ],
            updatedAt: timestamp,
          };
          return updatedOrder;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      if (updatedOrder) {
        saveOrderToFirestore(updatedOrder).catch((err) => {
          console.warn("[Firestore] Error updating verified payment:", err);
        });
      }

      // ONLY award points and register loyalty transaction if order is FULLY PAID (remaining balance = 0)
      if (isFullyPaid && earnedPoints > 0) {
        // Find current customer to compute updated balance
        const customer =
          registeredUsers.find(
            (u) =>
              u.id === order.customerId ||
              (order.customerEmail && u.email.toLowerCase() === order.customerEmail.toLowerCase()),
          ) ||
          (currentUser &&
          (currentUser.id === order.customerId ||
            (order.customerEmail &&
              currentUser.email.toLowerCase() === order.customerEmail.toLowerCase()))
            ? currentUser
            : null);

        const prevPoints = customer?.loyaltyPoints || 0;
        const newPoints = prevPoints + earnedPoints;

        // Create new Loyalty Transaction ledger entry
        const loyaltyTxId = `ltx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        const loyaltyTx: LoyaltyTransaction = {
          id: loyaltyTxId,
          customerId: order.customerId,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: "ORDER_APPROVED",
          points: earnedPoints,
          balanceAfter: newPoints,
          description: isSpecialDate
            ? `Compra aprobada (#${order.orderNumber}) con multiplicador x${bonusMultiplier} por fecha especial (${order.scheduledDate})`
            : `Compra aprobada (#${order.orderNumber}) por $${depositAmount} USD (+${earnedPoints} pts)`,
          timestamp,
          createdBy: "Monse (Owner)",
          note: `Verificación aprobada por la dueña. Pago 100% verificado (saldo $0).`,
        };

        setLoyaltyTransactions((prev) => {
          const next = [loyaltyTx, ...prev];
          try {
            localStorage.setItem(STORAGE_KEYS.LOYALTY_TRANSACTIONS, JSON.stringify(next));
          } catch (_) {}
          return next;
        });

        // Persist transaction to Firestore
        saveLoyaltyTransactionToFirestore(loyaltyTx).catch((err) => {
          console.warn("[Firestore] Error saving loyalty transaction:", err);
        });

        // Update registered users and currentUser loyaltyPoints
        if (customer) {
          const updatedCustomer: User = {
            ...customer,
            loyaltyPoints: newPoints,
          };

          setRegisteredUsers((prev) => {
            const next = prev.map((u) => (u.id === updatedCustomer.id ? updatedCustomer : u));
            try {
              localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(next));
            } catch (_) {}
            return next;
          });

          if (
            currentUser &&
            (currentUser.id === updatedCustomer.id ||
              currentUser.email.toLowerCase() === updatedCustomer.email.toLowerCase())
          ) {
            setCurrentUser(updatedCustomer);
            try {
              localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedCustomer));
            } catch (_) {}
          }

          saveUserToFirestore(updatedCustomer).catch((err) => {
            console.warn("[Firestore] Error saving updated user loyalty points:", err);
          });
        }

        showToast({
          title: "Pago Total Aprobado con Éxito",
          subtitle: `El pedido #${order.orderNumber} quedó 100% liquidado y sumó +${earnedPoints} puntos de lealtad para ${order.customerName}.`,
        });

        sendNotification({
          userId: order.customerId,
          targetRole: "customer",
          title: "¡Pago total verificado y puntos sumados! 🌸",
          message: `Confirmamos tu pago total de $${depositAmount}. ¡Ganaste +${earnedPoints} puntos en tu membresía! Tu pedido #${order.orderNumber} para el ${order.scheduledDate} pasa a taller artesanal.`,
          type: "payment",
          linkTarget: "pedidos",
        });
      } else {
        // Anticipo approved only: Remaining balance exists. No loyalty points yet.
        showToast({
          title: "Anticipo Aprobado con Éxito",
          subtitle: `Anticipo de $${depositAmount} aprobado para el pedido #${order.orderNumber}. Pedido en taller artesanal. Saldo pendiente: $${remainingBalance}. (Puntos de lealtad al liquidar el saldo total).`,
        });

        sendNotification({
          userId: order.customerId,
          targetRole: "customer",
          title: "¡Anticipo verificado! 🌸",
          message: `Confirmamos tu anticipo de $${depositAmount}. Tu pedido #${order.orderNumber} para el ${order.scheduledDate} pasa a taller artesanal. Saldo pendiente: $${remainingBalance}. Tus puntos de lealtad se activarán al liquidar el saldo total.`,
          type: "payment",
          linkTarget: "pedidos",
        });
      }
    } else {
      const rejectionReason =
        typeof depositOrReason === "string"
          ? depositOrReason
          : "Comprobante no válido o no reflejado en cuenta";
      setOrders((prev) => {
        const next = prev.map((o) => {
          if (o.id !== orderId) return o;
          updatedOrder = {
            ...o,
            paymentStatus: "RECHAZADO",
            status: "ESPERANDO_PAGO",
            paymentRejectedAt: timestamp,
            paymentRejectedBy: currentUser?.name || "Monce (Dueña)",
            paymentProof: o.paymentProof
              ? { ...o.paymentProof, status: "RECHAZADO", rejectionReason }
              : undefined,
            statusHistory: [
              ...o.statusHistory,
              {
                status: "ESPERANDO_PAGO",
                timestamp,
                note: `Comprobante rechazado por la dueña: ${rejectionReason}. Compra no válida para lealtad.`,
              },
            ],
            updatedAt: timestamp,
          };
          return updatedOrder;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      if (updatedOrder) {
        saveOrderToFirestore(updatedOrder).catch((err) => {
          console.warn("[Firestore] Error saving rejected payment:", err);
        });
      }

      showToast({
        title: "Comprobante Rechazado",
        subtitle: `El pedido #${order.orderNumber} no cuenta para lealtad hasta que se presente un comprobante válido.`,
      });

      sendNotification({
        userId: order.customerId,
        targetRole: "customer",
        title: "Comprobante no verificado ⚠️",
        message: `No se pudo confirmar tu comprobante del pedido #${order.orderNumber}: ${rejectionReason}. Por favor verifica tu transferencia y sube una nueva captura clara.`,
        type: "payment",
        linkTarget: "pedidos",
      });
    }
  };

  const verifyPaymentProof = (orderId: string, approved: boolean, depositOrReason?: any) => {
    verifyPayment(orderId, approved, depositOrReason);
  };

  // Custom Requests
  const customerCustomRequests = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return customRequests;
    return customRequests.filter(
      (r) => r.customerId === currentUser.id || r.customerEmail === currentUser.email,
    );
  }, [customRequests, currentUser, isAdmin]);

  const submitCustomRequest = (
    data: Omit<CustomRequest, "id" | "trackingNumber" | "createdAt" | "updatedAt" | "status">,
  ): CustomRequest => {
    const timestamp = new Date().toISOString();
    const trackingNumber = `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newReq: CustomRequest = {
      ...data,
      id: "req-" + Date.now(),
      trackingNumber,
      status: "SOLICITUD_RECIBIDA",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setCustomRequests((prev) => {
      const next = [newReq, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_REQUESTS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    // Save to Cloud Firestore
    saveCustomRequestToFirestore(newReq).catch((err) => {
      console.error("[Firestore] Error saving custom request:", err);
    });

    // Trigger visual real-time toast alert for admin
    const approxTotal = newReq.approximateBudget || 850;
    const customAlertEquiv: Order = {
      id: newReq.id,
      orderNumber: newReq.trackingNumber,
      customerId: newReq.customerId,
      customerName: newReq.customerName,
      customerEmail: newReq.customerEmail,
      customerPhone: newReq.customerPhone,
      items: [
        {
          productName: `Diseño: ${newReq.projectTitle}`,
          productImage: newReq.files && newReq.files[0] ? newReq.files[0].url : undefined,
          quantity: 1,
          unitPrice: approxTotal,
          selectedExtras: [],
          subtotal: approxTotal,
        },
      ],
      isCustomRequest: true,
      customRequestId: newReq.id,
      scheduledDate: newReq.desiredDate,
      scheduledTimeSlot: newReq.desiredTimeSlot || "Por definir",
      deliveryMethod: "RETIRO",
      totalPrice: approxTotal,
      requiredDeposit: Math.round(approxTotal * 0.5),
      amountPaid: 0,
      remainingBalance: approxTotal,
      status: "SOLICITUD_RECIBIDA",
      paymentStatus: "PENDIENTE",
      createdAt: timestamp,
      updatedAt: timestamp,
      statusHistory: [],
    };
    triggerAdminOrderAlert(customAlertEquiv, true);

    // Send notifications
    sendNotification({
      userId: newReq.customerId,
      targetRole: "customer",
      title: "¡Solicitud personalizada enviada! ✨",
      message: `Hemos recibido tu idea "${newReq.projectTitle}" (#${trackingNumber}). Te responderemos con la cotización en menos de 24 horas.`,
      type: "custom",
      linkTarget: "pedidos",
    });

    sendNotification({
      userId: INITIAL_ADMIN_USER.id,
      targetRole: "admin",
      title: "Nueva solicitud personalizada ✨",
      message: `${newReq.customerName} envió una idea: "${newReq.projectTitle}" con ${newReq.files.length} fotos de inspiración.`,
      type: "custom",
      linkTarget: "admin-personalizados",
    });

    return newReq;
  };

  const quoteCustomRequest = (id: string, price: number, deposit: number, notes?: string) => {
    if (!verifyAdminAccess("Cotizar solicitud personalizada")) return;
    const timestamp = new Date().toISOString();
    let updatedReq: CustomRequest | undefined;

    setCustomRequests((prev) => {
      const next = prev.map((r) => {
        if (r.id !== id) return r;
        updatedReq = {
          ...r,
          quotedPrice: price,
          quotedDeposit: deposit,
          ownerNotes: notes,
          status: "PRECIO_ENVIADO" as OrderStatus,
          updatedAt: timestamp,
        };
        return updatedReq;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_REQUESTS, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    if (updatedReq) {
      saveCustomRequestToFirestore(updatedReq).catch((err) => {
        console.error("[Firestore] Error updating custom request quote:", err);
      });
    }

    const req = customRequests.find((r) => r.id === id);
    if (req) {
      sendNotification({
        userId: req.customerId,
        targetRole: "customer",
        title: "¡Cotización lista para tu diseño! 💰",
        message: `El precio de tu proyecto "${req.projectTitle}" es de $${price} (Anticipo: $${deposit}). Ya puedes revisarlo y confirmar.`,
        type: "custom",
        linkTarget: "pedidos",
      });
    }
  };

  const updateCustomRequestStatus = (id: string, status: OrderStatus, quotedPrice?: number) => {
    if (!verifyAdminAccess("Actualizar estado de diseño")) return;
    const timestamp = new Date().toISOString();
    let updatedReq: CustomRequest | undefined;

    setCustomRequests((prev) => {
      const next = prev.map((r) => {
        if (r.id !== id) return r;
        const updates: Partial<CustomRequest> = { status, updatedAt: timestamp };
        if (quotedPrice !== undefined) {
          updates.quotedPrice = quotedPrice;
          updates.quotedDeposit = Math.round(quotedPrice * (siteSettings.depositPercentage / 100));
        }
        updatedReq = { ...r, ...updates };
        return updatedReq;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_REQUESTS, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    if (updatedReq) {
      saveCustomRequestToFirestore(updatedReq).catch((err) => {
        console.error("[Firestore] Error updating custom request status:", err);
      });
    }
  };

  // Calendar & Capacity Calculations (Strictly real from data, NO Math.random)
  const checkDateAvailability = (dateStr: string): DayAvailability => {
    // 1. Check if date is in the past
    const target = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Check blocked dates
    const blocked = blockedDates.find((b) => {
      const start = new Date(b.startDate + "T00:00:00");
      const end = new Date(b.endDate + "T23:59:59");
      return target >= start && target <= end;
    });

    if (blocked) {
      return {
        date: dateStr,
        isBlocked: true,
        blockReason: blocked.reason + (blocked.notes ? ` (${blocked.notes})` : ""),
        maxCapacity: 0,
        currentBookings: 0,
        remainingSlots: 0,
        status: "BLOCKED",
      };
    }

    // 3. Check important dates
    const important = importantDates.find((i) => i.date === dateStr && i.active);
    const maxCapacity = important ? important.maxCapacity : siteSettings.defaultDailyCapacity;

    // 4. Count real active orders on this date
    const activeOrdersForDay = orders.filter(
      (o) => o.scheduledDate === dateStr && o.status !== "CANCELADO",
    );
    const currentBookings = activeOrdersForDay.length;
    const remainingSlots = Math.max(0, maxCapacity - currentBookings);

    let status: "AVAILABLE" | "FEW_SLOTS" | "FULL" = "AVAILABLE";
    if (remainingSlots === 0) {
      status = "FULL";
    } else if (remainingSlots <= 2) {
      status = "FEW_SLOTS";
    }

    return {
      date: dateStr,
      isBlocked: false,
      maxCapacity,
      currentBookings,
      remainingSlots,
      status,
      importantEvent: important,
    };
  };

  const addImportantDate = (data: Omit<ImportantDate, "id">) => {
    if (!verifyAdminAccess("Crear fecha especial o evento")) return;
    const newDate: ImportantDate = {
      ...data,
      id: "date-" + Date.now(),
    };
    setImportantDates((prev) => {
      const next = [...prev, newDate].sort((a, b) => a.date.localeCompare(b.date));
      try {
        localStorage.setItem(STORAGE_KEYS.IMPORTANT_DATES, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving important dates:", e);
      }
      return next;
    });
    saveImportantDateToFirestore(newDate).catch((err) => {
      console.error("[Firestore] Error saving important date:", err);
    });
  };

  const updateImportantDate = (id: string, updates: Partial<ImportantDate>) => {
    if (!verifyAdminAccess("Modificar fecha especial")) return;
    let updatedDate: ImportantDate | undefined;
    setImportantDates((prev) => {
      const next = prev.map((d) => {
        if (d.id === id) {
          updatedDate = { ...d, ...updates };
          return updatedDate;
        }
        return d;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.IMPORTANT_DATES, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving important dates:", e);
      }
      return next;
    });
    if (updatedDate) {
      saveImportantDateToFirestore(updatedDate).catch((err) => {
        console.error("[Firestore] Error updating important date:", err);
      });
    }
  };

  const deleteImportantDate = (id: string) => {
    if (!verifyAdminAccess("Eliminar fecha especial")) return;
    setImportantDates((prev) => {
      const next = prev.filter((d) => d.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.IMPORTANT_DATES, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving important dates:", e);
      }
      return next;
    });
    deleteImportantDateFromFirestore(id).catch((err) => {
      console.error("[Firestore] Error deleting important date:", err);
    });
  };

  const addBlockedDate = (data: Omit<BlockedDate, "id" | "createdAt">) => {
    if (!verifyAdminAccess("Bloquear fecha de taller")) return;
    const newBlocked: BlockedDate = {
      ...data,
      id: "block-" + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setBlockedDates((prev) => {
      const next = [...prev, newBlocked];
      try {
        localStorage.setItem(STORAGE_KEYS.BLOCKED_DATES, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving blocked dates:", e);
      }
      return next;
    });
    saveBlockedDateToFirestore(newBlocked).catch((err) => {
      console.error("[Firestore] Error saving blocked date:", err);
    });
  };

  const deleteBlockedDate = (id: string) => {
    if (!verifyAdminAccess("Desbloquear fecha de taller")) return;
    setBlockedDates((prev) => {
      const next = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.BLOCKED_DATES, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving blocked dates:", e);
      }
      return next;
    });
    deleteBlockedDateFromFirestore(id).catch((err) => {
      console.error("[Firestore] Error deleting blocked date:", err);
    });
  };

  const setDayCapacity = (dateStr: string, capacity: number) => {
    if (!verifyAdminAccess("Modificar capacidad diaria")) return;
    const existing = importantDates.find((i) => i.date === dateStr);
    if (existing) {
      updateImportantDate(existing.id, { maxCapacity: capacity, active: true });
    } else {
      addImportantDate({
        date: dateStr,
        title: `Capacidad personalizada (${dateStr})`,
        maxCapacity: capacity,
        active: true,
      });
    }
  };

  const setDayBlocked = (dateStr: string, blocked: boolean, reason?: string) => {
    if (!verifyAdminAccess("Modificar bloqueo de día")) return;
    if (blocked) {
      addBlockedDate({
        startDate: dateStr,
        endDate: dateStr,
        reason: "Sin disponibilidad",
        notes: reason || "Bloqueado manualmente por taller",
      });
    } else {
      const existing = blockedDates.find((b) => b.startDate <= dateStr && b.endDate >= dateStr);
      if (existing) {
        deleteBlockedDate(existing.id);
      }
    }
  };

  const calendarDates = useMemo<CalendarDate[]>(() => {
    return (importantDates || []).map((id) => {
      const avail = checkDateAvailability(id.date);
      return {
        id: id.id,
        date: id.date,
        maxCapacity: id.maxCapacity,
        currentOrdersCount: avail.currentBookings,
        notes: id.notes || id.subtitle || id.title,
        isBlocked: avail.isBlocked,
      };
    });
  }, [importantDates, orders, blockedDates, siteSettings.defaultDailyCapacity]);

  // Gallery
  const addGalleryItem = (item: Omit<GalleryItem, "id">) => {
    const newItem: GalleryItem = {
      ...item,
      id: "gal-" + Date.now(),
    };
    setGallery((prev) => {
      const next = [newItem, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving gallery:", e);
      }
      return next;
    });
    saveGalleryItemToFirestore(newItem).catch((err) => {
      console.error("[Firestore] Error saving gallery item:", err);
    });
  };

  const deleteGalleryItem = (id: string) => {
    if (!verifyAdminAccess("Eliminar foto de la galería")) return;
    setGallery((prev) => {
      const next = prev.filter((g) => g.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving gallery:", e);
      }
      return next;
    });
    deleteGalleryItemFromFirestore(id).catch((err) => {
      console.error("[Firestore] Error deleting gallery item:", err);
    });
  };

  // Reviews
  const addReview = (reviewData: Omit<Review, "id" | "date">) => {
    const newReview: Review = {
      ...reviewData,
      verifiedPurchase: reviewData.verifiedPurchase ?? true,
      id: "rev-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
    };
    setReviews((prev) => {
      const next = [newReview, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving reviews:", e);
      }
      return next;
    });
    saveReviewToFirestore(newReview).catch((err) => {
      console.error("[Firestore] Error saving review:", err);
    });
  };

  const deleteReview = (id: string) => {
    if (!verifyAdminAccess("Eliminar reseña")) return;
    setReviews((prev) => {
      const next = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving reviews:", e);
      }
      return next;
    });
    deleteReviewFromFirestore(id).catch((err) => {
      console.error("[Firestore] Error deleting review:", err);
    });
  };

  // Cart & Wishlist
  const addToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
    setCartBounceKey((prev) => prev + 1);
    const subtitleDetails = [
      item.selectedVariant?.name,
      item.selectedSize?.name,
      item.selectedColor ? `Color ${item.selectedColor}` : null,
    ]
      .filter(Boolean)
      .join(" • ");
    showToast({
      title: "¡Ramo añadido a la bolsa!",
      subtitle: subtitleDetails ? `${item.product.name} (${subtitleDetails})` : item.product.name,
      imageUrl: item.product.images[0],
      price: item.itemTotal,
      actionLabel: "Ver bolsa",
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(1, item.quantity + delta);
        const unitPrice = item.selectedSize ? item.selectedSize.price : item.product.price;
        const extrasTotal = item.selectedExtras.reduce((acc, e) => acc + e.price, 0);
        return {
          ...item,
          quantity: newQty,
          itemTotal: (unitPrice + extrasTotal) * newQty,
        };
      }),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      if (!exists) {
        const prod = products.find((p) => p.id === productId);
        if (prod) {
          showToast({
            title: "Guardado en favoritos ❤️",
            subtitle: prod.name,
            imageUrl: prod.images[0],
            actionLabel: "Ver lista",
          });
        }
      }
      if (currentUser) {
        const updatedUser: User = {
          ...currentUser,
          favorites: next,
        };
        setCurrentUser(updatedUser);
        setRegisteredUsers((users) =>
          users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
        );
        try {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        } catch (_) {}
        saveUserToFirestore(updatedUser).catch(console.warn);
      }
      return next;
    });
  };

  // Notifications
  const sendNotification = (data: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    const uniqueId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newNotif: AppNotification = {
      ...data,
      id: uniqueId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => {
      const seen = new Set<string>();
      const list = [newNotif, ...prev];
      const result: AppNotification[] = [];
      for (const item of list) {
        if (!item) continue;
        let id = item.id;
        if (!id || seen.has(id)) {
          id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        }
        seen.add(id);
        result.push({ ...item, id });
      }
      return result;
    });

    // Background Web Push Notification for users who leave or background the app
    sendPushNotification({
      title: data.title,
      body: data.message,
      url: window.location.origin + (data.linkTarget ? `?tab=${data.linkTarget}` : ""),
      tag: newNotif.id,
    }).catch(() => {});
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return notifications.filter(
      (n) =>
        !n.read &&
        (n.userId === currentUser.id ||
          n.targetRole === "all" ||
          (isAdmin && n.targetRole === "admin") ||
          (!isAdmin && n.targetRole === "customer")),
    ).length;
  }, [notifications, currentUser, isAdmin]);

  // Site Settings & CMS - Centralized in Cloud Firestore
  const updateSiteSettings = (updates: Partial<SiteSettings>) => {
    if (!verifyAdminAccess("Guardar configuración de la tienda")) return;
    setSiteSettings((prev) => {
      const next = { ...prev, ...updates };
      saveSiteSettingsToFirestore(next).catch((err) => {
        console.error("[Firestore] Error saving site settings:", err);
      });
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving siteSettings:", e);
      }
      return next;
    });
  };

  // ---- Categorías de productos (administrables desde el panel) ----
  const categories: string[] =
    siteSettings.productCategories && siteSettings.productCategories.length > 0
      ? siteSettings.productCategories
      : DEFAULT_CATEGORIES;

  const addCategory = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    if (categories.some((c) => c.toLowerCase() === clean.toLowerCase())) return;
    updateSiteSettings({ productCategories: [...categories, clean] });
  };

  const renameCategory = (oldName: string, newName: string) => {
    const clean = newName.trim();
    if (!clean || clean === oldName) return;
    updateSiteSettings({
      productCategories: categories.map((c) => (c === oldName ? clean : c)),
    });
    setProducts((prev) =>
      prev.map((p) =>
        p.category === oldName ? { ...p, category: clean, updatedAt: new Date().toISOString() } : p,
      ),
    );
  };

  const deleteCategory = (name: string) => {
    const remaining = categories.filter((c) => c !== name);
    if (remaining.length === 0) return;
    const fallback = remaining[0] as string;
    updateSiteSettings({ productCategories: remaining });
    setProducts((prev) =>
      prev.map((p) =>
        p.category === name ? { ...p, category: fallback, updatedAt: new Date().toISOString() } : p,
      ),
    );
  };

  const updateHomepageConfig = (updates: Partial<HomepageConfig>) => {
    if (!verifyAdminAccess("Guardar diseño y textos de la portada")) return;
    setHomepageConfig((prev) => {
      const next = { ...prev, ...updates };
      saveHomepageConfigToFirestore(next).catch((err) => {
        console.error("[Firestore] Error saving homepage config:", err);
      });
      try {
        localStorage.setItem(STORAGE_KEYS.HOMEPAGE, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving homepageConfig:", e);
      }
      return next;
    });
  };

  // Internal Live Chat System
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT_CONVERSATIONS);
      return saved ? JSON.parse(saved) : INITIAL_CHAT_CONVERSATIONS;
    } catch {
      return INITIAL_CHAT_CONVERSATIONS;
    }
  });

  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatDraftMessage, setChatDraftMessage] = useState<string>("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(chatConversations));
    } catch (e) {
      console.error(e);
    }
  }, [chatConversations]);

  const openInternalChat = (initialMessage?: string, orderNumberRef?: string) => {
    setIsChatOpen(true);
    // Never send automatic messages. If an initial context message or order number is provided,
    // pre-fill it into draft so the user can review and send it manually.
    if (initialMessage) {
      setChatDraftMessage(initialMessage);
    } else if (orderNumberRef) {
      setChatDraftMessage(`Hola Monce, tengo una consulta sobre mi orden #${orderNumberRef}.`);
    }
  };

  const sendChatMessage = (
    paramsOrConvoId:
      | string
      | {
          text: string;
          imageUrl?: string;
          orderNumberRef?: string;
          targetConversationId?: string;
          role?: "admin" | "customer";
          senderName?: string;
          fontStyle?: "sans" | "serif" | "mono" | "cursive";
        },
    textIfConvoId?: string,
  ) => {
    let text = "";
    let targetConversationId = "conv-general";
    let imageUrl: string | undefined;
    let orderNumberRef: string | undefined;
    let role: "admin" | "customer" | undefined;
    let senderName: string | undefined;
    let fontStyle: "sans" | "serif" | "mono" | "cursive" | undefined;

    if (typeof paramsOrConvoId === "string") {
      targetConversationId = paramsOrConvoId;
      text = textIfConvoId || "";
    } else if (paramsOrConvoId && typeof paramsOrConvoId === "object") {
      text = paramsOrConvoId.text || "";
      targetConversationId = paramsOrConvoId.targetConversationId || "conv-general";
      imageUrl = paramsOrConvoId.imageUrl;
      orderNumberRef = paramsOrConvoId.orderNumberRef;
      role = paramsOrConvoId.role;
      senderName = paramsOrConvoId.senderName;
      fontStyle = paramsOrConvoId.fontStyle;
    }

    if (!text || !text.trim()) return;

    const isSenderAdmin = role ? role === "admin" : currentUser?.role === "admin";
    const name =
      senderName || (isSenderAdmin ? "Monce (Dueña)" : currentUser?.name || "Cliente");
    const avatar = isSenderAdmin
      ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
      : undefined;

    const newMsg: ChatMessage = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      senderRole: isSenderAdmin ? "admin" : "customer",
      senderName: name,
      senderAvatar: avatar,
      text: text.trim(),
      imageUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      orderNumberRef,
      fontStyle: fontStyle || "sans",
    };

    setChatConversations((prev) => {
      let targetFound = false;
      const updated = prev.map((conv) => {
        if (conv.id === targetConversationId) {
          targetFound = true;
          return {
            ...conv,
            messages: [...conv.messages, newMsg],
            updatedAt: new Date().toISOString(),
            unreadByAdmin: isSenderAdmin ? 0 : (conv.unreadByAdmin || 0) + 1,
            unreadByCustomer: isSenderAdmin ? (conv.unreadByCustomer || 0) + 1 : 0,
          };
        }
        return conv;
      });

      if (!targetFound) {
        const newConv: ChatConversation = {
          id: targetConversationId,
          customerId: currentUser?.id || "guest-" + Date.now(),
          customerName: name,
          customerEmail: currentUser?.email || "",
          customerPhone: currentUser?.phone || "",
          unreadByAdmin: isSenderAdmin ? 0 : 1,
          unreadByCustomer: isSenderAdmin ? 1 : 0,
          updatedAt: new Date().toISOString(),
          messages: [newMsg],
        };
        const nextConvos = [newConv, ...updated];
        try {
          localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(nextConvos));
        } catch (e) {
          console.error(e);
        }
        saveChatConversationToFirestore(newConv).catch(() => {});
        return nextConvos;
      }

      const updatedConv = updated.find((c) => c.id === targetConversationId);
      if (updatedConv) {
        saveChatConversationToFirestore(updatedConv).catch(() => {});
      }

      try {
        localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const markChatAsRead = (conversationId: string, forRole?: "admin" | "customer") => {
    setChatConversations((prev) => {
      const next = prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            unreadByAdmin: !forRole || forRole === "admin" ? 0 : c.unreadByAdmin,
            unreadByCustomer: !forRole || forRole === "customer" ? 0 : c.unreadByCustomer,
          };
        }
        return c;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const deleteChatConversation = (conversationId: string) => {
    setChatConversations((prev) => {
      const next = prev.filter((c) => c.id !== conversationId);
      try {
        localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // ─── Digital Gift Cards Functions ───────────────────────────────────────────
  const generateGiftCardCode = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let part1 = "";
    let part2 = "";
    for (let i = 0; i < 4; i++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length));
      part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `LAZO-${part1}-${part2}`;
  };

  const purchaseGiftCard = async (
    cardData: Omit<
      GiftCard,
      "id" | "code" | "createdAt" | "currentBalance" | "status" | "redemptionHistory"
    > & {
      customCode?: string;
    },
  ): Promise<GiftCard> => {
    const timestamp = new Date().toISOString();
    const code =
      cardData.customCode && cardData.customCode.trim()
        ? cardData.customCode.trim().toUpperCase()
        : generateGiftCardCode();

    // Set expiry 1 year from now by default
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const newCard: GiftCard = {
      ...cardData,
      id: "gc-" + Date.now(),
      code,
      currentBalance: cardData.initialAmount,
      status: "active",
      createdAt: timestamp,
      expiresAt: cardData.expiresAt || expiresAt,
      redemptionHistory: [],
    };

    setGiftCards((prev) => [newCard, ...prev]);

    // Send notifications
    sendNotification({
      userId: currentUser?.id || "guest",
      targetRole: "customer",
      title: "¡Tarjeta de Regalo generada! 🎁",
      message: `Tu tarjeta digital de $${newCard.initialAmount} con código ${newCard.code} está lista para enviarse a ${newCard.recipientName}.`,
      type: "system",
      linkTarget: "tarjetas",
    });

    sendNotification({
      userId: INITIAL_ADMIN_USER.id,
      targetRole: "admin",
      title: "Nueva Tarjeta de Regalo vendida 💳",
      message: `${newCard.purchaserName} compró una tarjeta de $${newCard.initialAmount} para ${newCard.recipientName} (Código: ${newCard.code}).`,
      type: "system",
      linkTarget: "admin",
    });

    showToast({
      title: "¡Tarjeta de Regalo Creada!",
      subtitle: `Código único: ${newCard.code}. Puedes enviársela por WhatsApp o correo.`,
    });

    // Sync across devices in background
    setTimeout(() => {
      saveAllNow({ giftCards: [newCard, ...giftCards] });
    }, 150);

    return newCard;
  };

  const checkGiftCard = (code: string): GiftCard | null => {
    if (!code || !code.trim()) return null;
    const cleanCode = code.trim().toUpperCase();
    const found = giftCards.find((c) => c.code.toUpperCase() === cleanCode);
    return found || null;
  };

  const redeemGiftCard = (
    code: string,
    amount: number,
    orderId?: string,
    orderNumber?: string,
  ): { success: boolean; appliedAmount: number; remainingBalance: number; error?: string } => {
    if (!code || !code.trim()) {
      return {
        success: false,
        appliedAmount: 0,
        remainingBalance: 0,
        error: "Ingresa un código de tarjeta",
      };
    }
    const cleanCode = code.trim().toUpperCase();
    const card = giftCards.find((c) => c.code.toUpperCase() === cleanCode);

    if (!card) {
      return {
        success: false,
        appliedAmount: 0,
        remainingBalance: 0,
        error: "Código de tarjeta de regalo no encontrado",
      };
    }

    if (card.status === "expired" || (card.expiresAt && new Date(card.expiresAt) < new Date())) {
      return {
        success: false,
        appliedAmount: 0,
        remainingBalance: 0,
        error: "Esta tarjeta de regalo ha expirado",
      };
    }

    if (card.status === "redeemed" || card.currentBalance <= 0) {
      return {
        success: false,
        appliedAmount: 0,
        remainingBalance: 0,
        error: "Esta tarjeta ya no cuenta con saldo disponible",
      };
    }

    const appliedAmount = Math.min(card.currentBalance, amount);
    const remainingBalance = Math.max(0, card.currentBalance - appliedAmount);
    const newStatus: GiftCard["status"] = remainingBalance <= 0 ? "redeemed" : "partially_used";

    const redemptionRecord: GiftCardRedemption = {
      id: "red-" + Date.now(),
      orderId,
      orderNumber,
      amountUsed: appliedAmount,
      date: new Date().toISOString(),
      note: `Canje aplicado a pedido ${orderNumber || ""}`,
    };

    setGiftCards((prev) => {
      const updated = prev.map((c) => {
        if (c.id === card.id) {
          return {
            ...c,
            currentBalance: remainingBalance,
            status: newStatus,
            redemptionHistory: [...c.redemptionHistory, redemptionRecord],
          };
        }
        return c;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.GIFT_CARDS, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    return {
      success: true,
      appliedAmount,
      remainingBalance,
    };
  };

  const updateGiftCardStatus = (cardId: string, status: GiftCard["status"]) => {
    if (!verifyAdminAccess("Actualizar estado de tarjeta de regalo")) return;
    let updatedCard: GiftCard | undefined;
    setGiftCards((prev) => {
      const next = prev.map((c) => {
        if (c.id === cardId) {
          updatedCard = { ...c, status };
          return updatedCard;
        }
        return c;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.GIFT_CARDS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
    if (updatedCard) {
      saveGiftCardToFirestore(updatedCard).catch((err) => {
        console.error("[Firestore] Error updating gift card:", err);
      });
    }
    showToast({
      title: "Estado actualizado",
      subtitle: `La tarjeta ahora está ${status === "active" ? "activa" : status === "redeemed" ? "canjeada" : "inactiva"}.`,
    });
  };

  const createAdminGiftCard = (cardData: Partial<GiftCard>): GiftCard => {
    if (!verifyAdminAccess("Crear tarjeta de regalo")) {
      throw new Error("Unauthorized");
    }
    const timestamp = new Date().toISOString();
    const code =
      cardData.code && cardData.code.trim()
        ? cardData.code.trim().toUpperCase()
        : generateGiftCardCode();
    const amount = Number(cardData.initialAmount) || 500;

    const newCard: GiftCard = {
      id: "gc-" + Date.now(),
      code,
      initialAmount: amount,
      currentBalance: amount,
      status: "active",
      themeDesign: cardData.themeDesign || "romantic_rose",
      purchaserName: cardData.purchaserName || "Hecho Por Monse (Cortesía)",
      purchaserEmail: cardData.purchaserEmail || "contacto@hechopormonse.com",
      recipientName: cardData.recipientName || "Cliente Distinguido",
      recipientEmail: cardData.recipientEmail || "",
      recipientPhone: cardData.recipientPhone || "",
      personalMessage:
        cardData.personalMessage ||
        "Un obsequio especial de parte de Hecho Por Monse para que elijas tu detalle favorito.",
      deliveryMethod: cardData.deliveryMethod || "whatsapp",
      createdAt: timestamp,
      expiresAt:
        cardData.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      redemptionHistory: [],
    };

    setGiftCards((prev) => {
      const next = [newCard, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.GIFT_CARDS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    saveGiftCardToFirestore(newCard).catch((err) => {
      console.error("[Firestore] Error saving gift card:", err);
    });

    showToast({
      title: "Tarjeta de Regalo Generada",
      subtitle: `Código ${newCard.code} por $${newCard.initialAmount} creado con éxito.`,
    });
    return newCard;
  };

  const deleteGiftCard = (cardId: string) => {
    if (!verifyAdminAccess("Eliminar tarjeta de regalo")) return;
    setGiftCards((prev) => {
      const next = prev.filter((c) => c.id !== cardId);
      try {
        localStorage.setItem(STORAGE_KEYS.GIFT_CARDS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
    deleteGiftCardFromFirestore(cardId).catch((err) => {
      console.error("[Firestore] Error deleting gift card:", err);
    });
    showToast({
      title: "Tarjeta eliminada permanentemente",
      subtitle: "La tarjeta de regalo ha sido removida definitivamente.",
    });
    setTimeout(() => {
      saveAllNow();
    }, 150);
  };

  // ─── Loyalty & Rewards Methods ──────────────────────────────────────────────
  const createLoyaltyTier = (
    tierData: Omit<LoyaltyTier, "id" | "createdAt" | "updatedAt">,
  ): LoyaltyTier => {
    if (!verifyAdminAccess("Crear nivel de lealtad")) {
      throw new Error("Unauthorized");
    }
    const timestamp = new Date().toISOString();
    const newTier: LoyaltyTier = {
      ...tierData,
      id: "tier-" + Date.now(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setLoyaltyTiers((prev) => {
      const next = [...prev, newTier].sort((a, b) => a.orderIndex - b.orderIndex);
      try {
        localStorage.setItem(STORAGE_KEYS.LOYALTY_TIERS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    saveLoyaltyTierToFirestore(newTier).catch((err) => {
      console.error("[Firestore] Error saving loyalty tier:", err);
    });

    showToast({
      title: `¡Nivel "${newTier.name}" Creado!`,
      subtitle: `Requisito: $${newTier.minSpendUSD} USD o ${newTier.minOrdersCount} compras. Beneficios configurados.`,
    });

    setTimeout(() => {
      saveAllNow({ loyaltyTiers: [...loyaltyTiers, newTier] });
    }, 150);

    return newTier;
  };

  const updateLoyaltyTier = (id: string, updates: Partial<LoyaltyTier>) => {
    if (!verifyAdminAccess("Actualizar nivel de lealtad")) return;
    let updatedTier: LoyaltyTier | undefined;
    setLoyaltyTiers((prev) => {
      const next = prev
        .map((t) => {
          if (t.id === id) {
            updatedTier = {
              ...t,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            return updatedTier;
          }
          return t;
        })
        .sort((a, b) => a.orderIndex - b.orderIndex);

      try {
        localStorage.setItem(STORAGE_KEYS.LOYALTY_TIERS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    if (updatedTier) {
      saveLoyaltyTierToFirestore(updatedTier).catch((err) => {
        console.error("[Firestore] Error updating loyalty tier:", err);
      });
    }

    showToast({
      title: "Nivel de lealtad actualizado",
      subtitle: "Los cambios y beneficios han sido guardados.",
    });

    setTimeout(() => {
      saveAllNow();
    }, 150);
  };

  const deleteLoyaltyTier = (id: string) => {
    if (!verifyAdminAccess("Eliminar nivel de lealtad")) return;
    setLoyaltyTiers((prev) => {
      const next = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.LOYALTY_TIERS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    deleteLoyaltyTierFromFirestore(id).catch((err) => {
      console.error("[Firestore] Error deleting loyalty tier:", err);
    });

    showToast({
      title: "Nivel de lealtad eliminado",
      subtitle: "Se eliminó el nivel y se reordenaron las categorías.",
    });

    setTimeout(() => {
      saveAllNow();
    }, 150);
  };

  const toggleLoyaltyTierStatus = (id: string) => {
    if (!verifyAdminAccess("Cambiar estado de nivel")) return;
    let updatedTier: LoyaltyTier | undefined;
    setLoyaltyTiers((prev) => {
      const next = prev.map((t) => {
        if (t.id === id) {
          updatedTier = { ...t, active: !t.active, updatedAt: new Date().toISOString() };
          return updatedTier;
        }
        return t;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.LOYALTY_TIERS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    if (updatedTier) {
      saveLoyaltyTierToFirestore(updatedTier).catch((err) => {
        console.error("[Firestore] Error toggling loyalty tier:", err);
      });
    }
  };

  const resetToDefaultLoyaltyTiers = () => {
    if (!verifyAdminAccess("Restablecer niveles de lealtad")) return;
    setLoyaltyTiers(INITIAL_LOYALTY_TIERS);
    try {
      localStorage.setItem(STORAGE_KEYS.LOYALTY_TIERS, JSON.stringify(INITIAL_LOYALTY_TIERS));
    } catch (_) {}
    INITIAL_LOYALTY_TIERS.forEach((t) => {
      saveLoyaltyTierToFirestore(t).catch(() => {});
    });
    showToast({
      title: "Niveles restablecidos",
      subtitle: "Se restauraron los niveles prediseñados de Hecho Por Monse.",
    });
  };

  // ─── Coupons & Promo Codes Methods ──────────────────────────────────────────
  const createCoupon = (
    couponData: Omit<DiscountCoupon, "id" | "createdAt" | "usedCount">,
  ): DiscountCoupon => {
    if (!verifyAdminAccess("Crear cupón de descuento")) {
      throw new Error("Unauthorized");
    }
    const cleanCode = couponData.code.trim().toUpperCase().replace(/\s+/g, "");
    const newCoupon: DiscountCoupon = {
      ...couponData,
      id: "cp-" + Date.now(),
      code: cleanCode,
      usedCount: 0,
      createdAt: new Date().toISOString(),
    };

    setCoupons((prev) => {
      const next = [newCoupon, ...prev.filter((c) => c.code !== cleanCode)];
      try {
        localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    saveCouponToFirestore(newCoupon).catch((err) => {
      console.error("[Firestore] Error saving coupon:", err);
    });

    showToast({
      title: `Cupón ${newCoupon.code} Creado`,
      subtitle: `Descuento de ${newCoupon.discountType === "PERCENTAGE" ? `${newCoupon.discountValue}%` : `$${newCoupon.discountValue} USD`}.`,
    });

    setTimeout(() => {
      saveAllNow({ coupons: [newCoupon, ...coupons] });
    }, 150);

    return newCoupon;
  };

  const updateCoupon = (id: string, updates: Partial<DiscountCoupon>) => {
    if (!verifyAdminAccess("Actualizar cupón de descuento")) return;
    let updatedCoupon: DiscountCoupon | undefined;
    setCoupons((prev) => {
      const next = prev.map((c) => {
        if (c.id === id) {
          updatedCoupon = { ...c, ...updates };
          return updatedCoupon;
        }
        return c;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    if (updatedCoupon) {
      saveCouponToFirestore(updatedCoupon).catch((err) => {
        console.error("[Firestore] Error updating coupon:", err);
      });
    }

    showToast({
      title: "Cupón actualizado",
      subtitle: "Configuración de descuento y condiciones actualizada.",
    });

    setTimeout(() => {
      saveAllNow();
    }, 150);
  };

  const deleteCoupon = (id: string) => {
    if (!verifyAdminAccess("Eliminar cupón de descuento")) return;
    setCoupons((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    deleteCouponFromFirestore(id).catch((err) => {
      console.error("[Firestore] Error deleting coupon:", err);
    });

    showToast({
      title: "Cupón eliminado",
      subtitle: "El código promocional ya no podrá ser utilizado.",
    });

    setTimeout(() => {
      saveAllNow();
    }, 150);
  };

  const toggleCouponStatus = (id: string) => {
    if (!verifyAdminAccess("Cambiar estado de cupón")) return;
    let updatedCoupon: DiscountCoupon | undefined;
    setCoupons((prev) => {
      const next = prev.map((c) => {
        if (c.id === id) {
          const newStatus = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
          updatedCoupon = { ...c, status: newStatus as DiscountCoupon["status"] };
          return updatedCoupon;
        }
        return c;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    if (updatedCoupon) {
      saveCouponToFirestore(updatedCoupon).catch((err) => {
        console.error("[Firestore] Error toggling coupon:", err);
      });
    }
  };

  const validateCoupon = (
    code: string,
    subtotalUSD: number,
    customerTierId?: string,
  ): {
    valid: boolean;
    discountAmountUSD: number;
    discountAmountLocal: number;
    message: string;
    coupon?: DiscountCoupon;
  } => {
    if (!code || !code.trim()) {
      return {
        valid: false,
        discountAmountUSD: 0,
        discountAmountLocal: 0,
        message: "Ingresa un código de cupón",
      };
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      return {
        valid: false,
        discountAmountUSD: 0,
        discountAmountLocal: 0,
        message: "Código promocional no encontrado",
      };
    }

    if (coupon.status !== "ACTIVE") {
      return {
        valid: false,
        discountAmountUSD: 0,
        discountAmountLocal: 0,
        message: "Este cupón se encuentra inactivo actualmente",
      };
    }

    if (coupon.expirationDate && new Date(coupon.expirationDate + "T23:59:59") < new Date()) {
      return {
        valid: false,
        discountAmountUSD: 0,
        discountAmountLocal: 0,
        message: "Este cupón ha expirado",
      };
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return {
        valid: false,
        discountAmountUSD: 0,
        discountAmountLocal: 0,
        message: "Este cupón ha alcanzado el límite máximo de usos",
      };
    }

    if (coupon.minPurchaseUSD && subtotalUSD < coupon.minPurchaseUSD) {
      return {
        valid: false,
        discountAmountUSD: 0,
        discountAmountLocal: 0,
        message: `Compra mínima requerida de $${coupon.minPurchaseUSD} USD para usar este cupón`,
      };
    }

    if (coupon.restrictedToTierId && coupon.restrictedToTierId !== "ALL") {
      if (!customerTierId || customerTierId !== coupon.restrictedToTierId) {
        const requiredTier = loyaltyTiers.find((t) => t.id === coupon.restrictedToTierId);
        return {
          valid: false,
          discountAmountUSD: 0,
          discountAmountLocal: 0,
          message: `Cupón exclusivo para clientes nivel "${requiredTier?.name || "VIP"}"`,
        };
      }
    }

    let discountUSD = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountUSD = (subtotalUSD * coupon.discountValue) / 100;
      if (coupon.maxDiscountUSD && discountUSD > coupon.maxDiscountUSD) {
        discountUSD = coupon.maxDiscountUSD;
      }
    } else {
      discountUSD = Math.min(coupon.discountValue, subtotalUSD);
    }

    discountUSD = Math.round(discountUSD * 100) / 100;
    const discountLocal = discountUSD;

    return {
      valid: true,
      discountAmountUSD: discountUSD,
      discountAmountLocal: discountLocal,
      message: `¡Cupón "${coupon.code}" aplicado con éxito!`,
      coupon,
    };
  };

  const applyCouponUsage = (couponId: string) => {
    setCoupons((prev) => {
      const next = prev.map((c) => (c.id === couponId ? { ...c, usedCount: c.usedCount + 1 } : c));
      try {
        localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    setDiscounts((prev) => {
      const next = prev.map((d) =>
        d.id === couponId || d.code.toUpperCase() === couponId.toUpperCase()
          ? { ...d, currentUses: (d.currentUses || 0) + 1 }
          : d,
      );
      try {
        localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  // ─── Sorteos (Giveaways) Methods ──────────────────────────────────────────
  const createGiveaway = async (data: Omit<Giveaway, "id" | "createdAt">): Promise<Giveaway> => {
    if (!verifyAdminAccess("Crear sorteo en el taller")) {
      throw new Error("Unauthorized");
    }

    const newGiveaway: Giveaway = {
      ...data,
      id: "giveaway-" + Date.now(),
      createdAt: new Date().toISOString(),
    };

    setGiveaways((prev) => [newGiveaway, ...prev]);
    await saveGiveawayToFirestore(newGiveaway);

    showToast({
      title: "Sorteo creado",
      subtitle: `"${newGiveaway.title}" está registrado en el sistema.`,
    });

    return newGiveaway;
  };

  const updateGiveaway = async (updated: Giveaway): Promise<void> => {
    if (!verifyAdminAccess("Modificar sorteo")) return;

    setGiveaways((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    await saveGiveawayToFirestore(updated);

    showToast({
      title: "Sorteo actualizado",
      subtitle: "Los cambios se guardaron correctamente.",
    });
  };

  const deleteGiveaway = async (giveawayId: string): Promise<void> => {
    if (!verifyAdminAccess("Eliminar sorteo")) return;

    setGiveaways((prev) => prev.filter((g) => g.id !== giveawayId));
    await deleteGiveawayFromFirestore(giveawayId);

    showToast({
      title: "Sorteo eliminado",
      subtitle: "El sorteo fue removido del sistema.",
    });
  };

  const toggleGiveawayStatus = async (giveawayId: string): Promise<void> => {
    if (!verifyAdminAccess("Cambiar estado de sorteo")) return;

    let target: Giveaway | undefined;
    setGiveaways((prev) =>
      prev.map((g) => {
        if (g.id === giveawayId) {
          const nextStatus = g.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
          target = { ...g, status: nextStatus };
          return target;
        }
        return g;
      }),
    );

    if (target) {
      await saveGiveawayToFirestore(target);
      showToast({
        title: target.status === "ACTIVE" ? "Sorteo activado" : "Sorteo pausado",
        subtitle: `Ahora se encuentra en estado ${target.status}.`,
      });
    }
  };

  const cancelGiveaway = async (giveawayId: string): Promise<void> => {
    if (!verifyAdminAccess("Cancelar sorteo")) return;

    let target: Giveaway | undefined;
    setGiveaways((prev) =>
      prev.map((g) => {
        if (g.id === giveawayId) {
          target = { ...g, status: "CANCELLED" };
          return target;
        }
        return g;
      }),
    );

    if (target) {
      await saveGiveawayToFirestore(target);
      showToast({
        title: "Sorteo cancelado",
        subtitle: "El sorteo ha sido marcado como cancelado.",
      });
    }
  };

  const participateInGiveaway = async (
    giveawayId: string,
  ): Promise<{ success: boolean; message: string; entry?: GiveawayEntry }> => {
    if (!currentUser) {
      return {
        success: false,
        message: "Debes iniciar sesión con tu cuenta para participar.",
      };
    }

    const giveaway = giveaways.find((g) => g.id === giveawayId);
    if (!giveaway) {
      return { success: false, message: "Sorteo no encontrado." };
    }

    const result = await registerGiveawayEntry({
      giveaway,
      userId: currentUser.id,
      displayName: currentUser.name || "Cliente Hecho por Monce",
      userEmail: currentUser.email,
      avatarUrl: currentUser.avatar,
      existingEntries: giveawayEntries,
    });

    if (result.success && result.entry) {
      setGiveawayEntries((prev) => {
        const filtered = prev.filter((e) => e.entryId !== result.entry!.entryId);
        return [...filtered, result.entry!];
      });
    }

    return result;
  };

  const drawGiveawayWinner = async (
    giveawayId: string,
  ): Promise<{
    success: boolean;
    message?: string;
    winner?: GiveawayWinner;
    giftCard?: GiftCard;
  }> => {
    if (!verifyAdminAccess("Seleccionar ganador de sorteo")) {
      return { success: false, message: "Acceso no autorizado." };
    }

    const giveaway = giveaways.find((g) => g.id === giveawayId);
    if (!giveaway) {
      return { success: false, message: "Sorteo no encontrado." };
    }

    const existingWinner = giveawayWinners.find((w) => w.giveawayId === giveawayId);

    const result = await drawGiveawayWinnerSecurely({
      giveaway,
      entries: giveawayEntries,
      existingWinner,
      existingGiftCards: giftCards,
    });

    if (result.success) {
      if (result.winner) {
        setGiveawayWinners((prev) => {
          const filtered = prev.filter((w) => w.giveawayId !== giveawayId);
          return [result.winner!, ...filtered];
        });
      }

      if (result.giftCard) {
        setGiftCards((prev) => {
          const filtered = prev.filter((c) => c.id !== result.giftCard!.id);
          return [result.giftCard!, ...filtered];
        });
      }

      setGiveaways((prev) =>
        prev.map((g) =>
          g.id === giveawayId
            ? {
                ...g,
                status: "ENDED",
                winnerUserId: result.winner?.winnerUserId,
                winnerDisplayName: result.winner?.displayName,
                winnerPublicName: result.winner?.publicName,
                winnerAvatarUrl: result.winner?.avatarUrl,
                endedAt: new Date().toISOString(),
              }
            : g,
        ),
      );
    }

    return result;
  };

  const updateGiveawayPrizeStatus = async (
    winnerId: string,
    status: GiveawayWinner["prizeStatus"],
  ): Promise<void> => {
    if (!verifyAdminAccess("Actualizar estado de premio")) return;

    let target: GiveawayWinner | undefined;
    setGiveawayWinners((prev) =>
      prev.map((w) => {
        if (w.id === winnerId) {
          target = { ...w, prizeStatus: status };
          return target;
        }
        return w;
      }),
    );

    if (target) {
      await saveGiveawayWinnerToFirestore(target);
      showToast({
        title: "Estado de premio actualizado",
        subtitle: `Nuevo estado: ${status}`,
      });
    }
  };

  // ─── Descuentos (Store Discounts) Methods ─────────────────────────────────
  const createDiscount = async (
    data: Omit<StoreDiscount, "id" | "createdAt">,
  ): Promise<StoreDiscount> => {
    if (!verifyAdminAccess("Crear descuento en la tienda")) {
      throw new Error("Unauthorized");
    }

    const cleanCode = data.code.trim().toUpperCase().replace(/\s+/g, "");
    const newDiscount: StoreDiscount = {
      ...data,
      id: "disc-" + Date.now(),
      code: cleanCode,
      createdAt: new Date().toISOString(),
    };

    setDiscounts((prev) => [newDiscount, ...prev.filter((d) => d.code !== cleanCode)]);
    await saveDiscountToFirestore(newDiscount);

    showToast({
      title: "Descuento creado",
      subtitle: `Código "${newDiscount.code}" registrado en Firestore.`,
    });

    return newDiscount;
  };

  const updateDiscount = async (updated: StoreDiscount): Promise<void> => {
    if (!verifyAdminAccess("Modificar descuento")) return;

    setDiscounts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    await saveDiscountToFirestore(updated);

    showToast({
      title: "Descuento actualizado",
      subtitle: "Configuración guardada en Firestore.",
    });
  };

  const deleteDiscount = async (discountId: string): Promise<void> => {
    if (!verifyAdminAccess("Eliminar descuento")) return;

    setDiscounts((prev) => prev.filter((d) => d.id !== discountId));
    await deleteDiscountFromFirestore(discountId);

    showToast({
      title: "Descuento eliminado",
      subtitle: "El código promocional fue removido.",
    });
  };

  const toggleDiscountStatus = async (discountId: string): Promise<void> => {
    if (!verifyAdminAccess("Cambiar estado de descuento")) return;

    let target: StoreDiscount | undefined;
    setDiscounts((prev) =>
      prev.map((d) => {
        if (d.id === discountId) {
          const nextStatus = d.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
          target = { ...d, status: nextStatus };
          return target;
        }
        return d;
      }),
    );

    if (target) {
      await saveDiscountToFirestore(target);
      showToast({
        title: target.status === "ACTIVE" ? "Descuento activado" : "Descuento pausado",
        subtitle: `Estado actual: ${target.status}`,
      });
    }
  };

  // ─── Real-Time Customer Loyalty Progress Calculator ─────────────────────────
  const getCustomerLoyaltyProgress = useCallback(
    (customerId?: string, customerEmail?: string): CustomerLoyaltyProgress => {
      const targetEmail = (customerEmail || currentUser?.email || "").toLowerCase().trim();
      const targetId = customerId || currentUser?.id || "";
      const customerName = currentUser?.name || "Cliente de Hecho Por Monse";

      const targetUser =
        registeredUsers.find(
          (u) =>
            (targetId && u.id === targetId) ||
            (targetEmail && u.email.toLowerCase().trim() === targetEmail),
        ) || (currentUser?.id === targetId ? currentUser : undefined);

      // 1. Deduplicate orders by ID to ensure an order modified, re-opened, or queried multiple times is NEVER double-counted
      const uniqueOrdersMap = new Map<string, Order>();
      orders.forEach((o) => {
        if (o && o.id) {
          uniqueOrdersMap.set(o.id, o);
        }
      });

      // 2. Strict requirement: A purchase only counts for the loyalty program once the owner has
      // manually verified and approved the payment proof, AND the order is fully paid with remaining balance = $0.
      // DEFINITIVE RULE: A customer CANNOT enter the loyalty club or receive points solely because an advance payment (anticipo) was approved.
      const clientQualifyingOrders = Array.from(uniqueOrdersMap.values()).filter((o) => {
        const matchEmail = targetEmail && o.customerEmail?.toLowerCase().trim() === targetEmail;
        const matchId = targetId && o.customerId === targetId;
        if (!matchEmail && !matchId) return false;

        return isOrderEligibleForLoyalty(o);
      });

      const isEligible = clientQualifyingOrders.length > 0;
      const totalOrdersCount = clientQualifyingOrders.length;
      const totalSpentLocal = clientQualifyingOrders.reduce((sum, o) => {
        const amt = o.totalPrice && o.totalPrice > 0 ? o.totalPrice : o.amountPaid || 0;
        return sum + amt;
      }, 0);
      const totalSpentUSD = Math.round(totalSpentLocal * 100) / 100;

      // 1. Filter transactions belonging to this customer
      const customerTxs = loyaltyTransactions.filter(
        (tx) =>
          (targetId && tx.customerId === targetId) ||
          (targetEmail &&
            tx.customerEmail &&
            tx.customerEmail.toLowerCase() === targetEmail.toLowerCase()),
      );

      let txEarnedPoints = 0;
      let txSpentPoints = 0;
      customerTxs.forEach((tx) => {
        if (tx.points > 0) txEarnedPoints += tx.points;
        else txSpentPoints += Math.abs(tx.points);
      });

      // 2. Conversion and base calculation: $1 USD = pointsPerDollar (earned ONLY from approved orders)
      const pointsPerUSD = loyaltyConfig?.pointsPerDollar ?? 0.5;
      const earnedFromOrders = Math.round(totalSpentUSD * pointsPerUSD);
      // Welcome bonus is ONLY unlocked once eligible with at least 1 approved purchase
      const welcomeBonus =
        (isEligible && targetUser && (loyaltyConfig?.welcomeBonusPoints ?? 50)) || 0;

      // Direct points saved on user record (if any)
      const directUserPoints = isEligible ? targetUser?.loyaltyPoints || 0 : 0;

      const accumulatedPoints = !isEligible
        ? 0
        : customerTxs.length > 0
          ? txEarnedPoints + directUserPoints
          : Math.max(earnedFromOrders + welcomeBonus, directUserPoints);

      const spentPoints = isEligible ? (targetUser?.spentLoyaltyPoints || 0) + txSpentPoints : 0;
      const availablePoints = isEligible ? Math.max(0, accumulatedPoints - spentPoints) : 0;

      const activeTiers = [...loyaltyTiers]
        .filter((t) => t.active)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      const baseTier = activeTiers[0] || INITIAL_LOYALTY_TIERS[0];

      // Determine current qualifying tier based on accumulatedPoints >= requiredPoints OR spend/orders
      let currentTier = baseTier;
      for (const tier of activeTiers) {
        let qualifies = false;
        const reqPts = tier.requiredPoints ?? 0;
        if (reqPts > 0 && accumulatedPoints >= reqPts) {
          qualifies = true;
        } else if (
          tier.qualificationCriterion === "SPEND_USD" &&
          totalSpentUSD >= tier.minSpendUSD
        ) {
          qualifies = true;
        } else if (
          tier.qualificationCriterion === "ORDERS_COUNT" &&
          totalOrdersCount >= tier.minOrdersCount
        ) {
          qualifies = true;
        } else if (
          tier.qualificationCriterion === "BOTH" &&
          totalSpentUSD >= tier.minSpendUSD &&
          totalOrdersCount >= tier.minOrdersCount
        ) {
          qualifies = true;
        }

        if (qualifies) {
          currentTier = tier;
        }
      }

      // Check if user has an unlocked custom upgraded tier with points
      if (targetUser?.customLoyaltyTierId) {
        const customTier = activeTiers.find((t) => t.id === targetUser.customLoyaltyTierId);
        if (customTier && (customTier.orderIndex ?? 0) > (currentTier.orderIndex ?? 0)) {
          currentTier = customTier;
        }
      }

      const currentTierIndex = activeTiers.findIndex((t) => t.id === currentTier.id);
      const nextTier =
        currentTierIndex >= 0 && currentTierIndex < activeTiers.length - 1
          ? activeTiers[currentTierIndex + 1]
          : undefined;

      let progressPercentage = 100;
      let pointsNeededForNextTier = 0;
      let usdNeededForNextTier = 0;
      let ordersNeededForNextTier = 0;

      if (nextTier) {
        const nextPointsReq =
          nextTier.requiredPoints ?? Math.max(150, Math.round((nextTier.minSpendUSD || 50) * 5));
        const currPointsReq = currentTier.requiredPoints ?? 0;
        pointsNeededForNextTier = Math.max(0, nextPointsReq - accumulatedPoints);
        usdNeededForNextTier = Math.max(
          0,
          Math.round((nextTier.minSpendUSD - totalSpentUSD) * 100) / 100,
        );
        ordersNeededForNextTier = Math.max(0, nextTier.minOrdersCount - totalOrdersCount);

        const span = Math.max(1, nextPointsReq - currPointsReq);
        const userProgress = Math.max(0, accumulatedPoints - currPointsReq);
        progressPercentage = Math.min(100, Math.round((userProgress / span) * 100));
      }

      const pointsCostForNextTier = nextTier
        ? nextTier.requiredPoints
          ? Math.max(100, nextTier.requiredPoints - (currentTier.requiredPoints || 0))
          : 250
        : 0;
      const canUpgradeWithPoints = Boolean(nextTier && availablePoints >= pointsCostForNextTier);

      const availableCoupons = coupons.filter((c) => {
        if (c.status !== "ACTIVE") return false;
        if (c.expirationDate && new Date(c.expirationDate + "T23:59:59") < new Date()) return false;
        if (
          !c.restrictedToTierId ||
          c.restrictedToTierId === "ALL" ||
          c.restrictedToTierId === currentTier.id
        ) {
          return true;
        }
        return false;
      });

      return {
        customerId: targetId,
        customerName,
        customerEmail: targetEmail,
        memberNumber: targetUser?.id
          ? `MONSE-VIP-${targetUser.id.slice(0, 8).toUpperCase()}`
          : undefined,
        isEligible,
        totalSpentUSD,
        totalOrdersCount,
        accumulatedPoints,
        availablePoints,
        spentPoints,
        currentTier,
        nextTier,
        progressPercentage: isEligible ? progressPercentage : 0,
        pointsNeededForNextTier,
        usdNeededForNextTier,
        ordersNeededForNextTier,
        pointsCostForNextTier,
        canUpgradeWithPoints: isEligible && canUpgradeWithPoints,
        unlockedBenefits: isEligible ? currentTier.benefits || [] : [],
        availableCoupons,
      };
    },
    [
      currentUser,
      registeredUsers,
      orders,
      loyaltyTiers,
      coupons,
      loyaltyTransactions,
      loyaltyConfig,
    ],
  );

  // Current logged in customer's loyalty progress memo
  const customerLoyaltyProgress = useMemo(() => {
    return getCustomerLoyaltyProgress(currentUser?.id, currentUser?.email);
  }, [currentUser, getCustomerLoyaltyProgress]);

  // Save Loyalty Program Config
  const saveLoyaltyConfig = useCallback(
    (config: LoyaltyProgramConfig) => {
      setLoyaltyConfig(config);
      try {
        localStorage.setItem(STORAGE_KEYS.LOYALTY_CONFIG, JSON.stringify(config));
      } catch (_) {}
      saveLoyaltyConfigToFirestore(config).catch((err) => {
        console.warn("[Firestore] Error saving loyalty config:", err);
      });
      showToast({
        title: "Configuración de Lealtad Guardada",
        subtitle: "Las reglas de puntos, bonos y canje se actualizaron exitosamente.",
      });
    },
    [showToast],
  );

  // Admin Manual Adjustment of Customer Points
  const adjustCustomerPoints = useCallback(
    (customerId: string, points: number, note: string): { success: boolean; message: string } => {
      if (!verifyAdminAccess("Ajustar puntos de cliente")) {
        return { success: false, message: "Acceso denegado." };
      }

      const targetCustomer = registeredUsers.find((u) => u.id === customerId);
      if (!targetCustomer) {
        return { success: false, message: "Cliente no encontrado." };
      }

      const prevPoints = targetCustomer.loyaltyPoints || 0;
      const newPoints = Math.max(0, prevPoints + points);

      const timestamp = new Date().toISOString();
      const txId = `ltx-adj-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const tx: LoyaltyTransaction = {
        id: txId,
        customerId: targetCustomer.id,
        customerEmail: targetCustomer.email,
        customerName: targetCustomer.name,
        type: points >= 0 ? "BONUS_ADMIN" : "ADJUSTMENT",
        points,
        balanceAfter: newPoints,
        description:
          note ||
          (points >= 0 ? `Bono administrativo otorgado por Monse` : `Ajuste manual de puntos`),
        timestamp,
        createdBy: "Monse (Owner)",
        note,
      };

      setLoyaltyTransactions((prev) => {
        const next = [tx, ...prev];
        try {
          localStorage.setItem(STORAGE_KEYS.LOYALTY_TRANSACTIONS, JSON.stringify(next));
        } catch (_) {}
        return next;
      });
      saveLoyaltyTransactionToFirestore(tx).catch(console.warn);

      const updatedCustomer: User = {
        ...targetCustomer,
        loyaltyPoints: newPoints,
      };

      setRegisteredUsers((prev) => {
        const next = prev.map((u) => (u.id === customerId ? updatedCustomer : u));
        try {
          localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      if (currentUser?.id === customerId) {
        setCurrentUser(updatedCustomer);
        try {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedCustomer));
        } catch (_) {}
      }

      saveUserToFirestore(updatedCustomer).catch(console.warn);

      sendNotification({
        userId: targetCustomer.id,
        targetRole: "customer",
        title:
          points >= 0 ? "¡Recibiste puntos de bonificación! 🎁" : "Ajuste de puntos en tu cuenta",
        message:
          points >= 0
            ? `Monse te ha otorgado un bono de +${points} puntos de cortesía. Saldo actual: ${newPoints} puntos.`
            : `Se realizó un ajuste de ${points} puntos en tu membresía. Saldo actual: ${newPoints} puntos.`,
        type: "system",
        linkTarget: "perfil",
      });

      return {
        success: true,
        message: `Puntos actualizados correctamente (${points >= 0 ? `+${points}` : points} pts). Nuevo saldo: ${newPoints} pts.`,
      };
    },
    [verifyAdminAccess, registeredUsers, currentUser],
  );

  // Customer Redemption of Points for a Discount Coupon
  const redeemPointsForCoupon = useCallback(
    (pointsToRedeem: number): { success: boolean; message: string; coupon?: DiscountCoupon } => {
      if (!currentUser) {
        return { success: false, message: "Debes iniciar sesión para canjear tus puntos." };
      }

      const progress = getCustomerLoyaltyProgress(currentUser.id, currentUser.email);
      const minRedeem = loyaltyConfig.minimumPointsToRedeem || 100;

      if (pointsToRedeem < minRedeem) {
        return { success: false, message: `El mínimo para canjear es de ${minRedeem} puntos.` };
      }

      if (progress.availablePoints < pointsToRedeem) {
        return {
          success: false,
          message: `Puntos insuficientes. Tienes ${progress.availablePoints} puntos disponibles.`,
        };
      }

      const rate = loyaltyConfig.redemptionRatePointsPerUSD || 20; // 20 pts = $1 USD
      const discountUSD = Math.round((pointsToRedeem / rate) * 100) / 100;

      const timestamp = new Date().toISOString();
      const couponCode = `PUNTOS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const newCoupon: DiscountCoupon = {
        id: `cpn-${Date.now()}`,
        code: couponCode,
        title: `Cupón por ${pointsToRedeem} Puntos ($${discountUSD} USD)`,
        description: `Generado por canje de puntos de lealtad de ${currentUser.name}. Válido para cualquier ramo.`,
        discountType: "FIXED_USD",
        discountValue: discountUSD,
        minPurchaseUSD: 20,
        expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 60 días
        maxUses: 1,
        usedCount: 0,
        maxUsesPerCustomer: 1,
        restrictedToTierId: "ALL",
        status: "ACTIVE",
        createdAt: timestamp,
      };

      // Save coupon
      setCoupons((prev) => {
        const next = [newCoupon, ...prev];
        try {
          localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(next));
        } catch (_) {}
        return next;
      });
      saveCouponToFirestore(newCoupon).catch(console.warn);

      // Record redemption transaction
      const newAvailable = Math.max(0, progress.availablePoints - pointsToRedeem);
      const tx: LoyaltyTransaction = {
        id: `ltx-rdm-${Date.now()}`,
        customerId: currentUser.id,
        customerEmail: currentUser.email,
        customerName: currentUser.name,
        type: "REDEMPTION",
        points: -pointsToRedeem,
        balanceAfter: newAvailable,
        description: `Canje de ${pointsToRedeem} puntos por cupón ${couponCode} ($${discountUSD} USD)`,
        timestamp,
        createdBy: currentUser.name,
        note: `Cupón ID: ${newCoupon.id}`,
      };

      setLoyaltyTransactions((prev) => {
        const next = [tx, ...prev];
        try {
          localStorage.setItem(STORAGE_KEYS.LOYALTY_TRANSACTIONS, JSON.stringify(next));
        } catch (_) {}
        return next;
      });
      saveLoyaltyTransactionToFirestore(tx).catch(console.warn);

      // Update user spent points
      const updatedUser: User = {
        ...currentUser,
        spentLoyaltyPoints: (currentUser.spentLoyaltyPoints || 0) + pointsToRedeem,
      };

      setCurrentUser(updatedUser);
      setRegisteredUsers((prev) => {
        const next = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
        try {
          localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(next));
        } catch (_) {}
        return next;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      } catch (_) {}
      saveUserToFirestore(updatedUser).catch(console.warn);

      showToast({
        title: "¡Puntos Canjeados con Éxito! 🎉",
        subtitle: `Se generó tu cupón ${couponCode} con $${discountUSD} USD de descuento.`,
      });

      return {
        success: true,
        message: `¡Canje exitoso! Se generó tu cupón ${couponCode} con $${discountUSD} USD de descuento para tu siguiente ramo.`,
        coupon: newCoupon,
      };
    },
    [currentUser, getCustomerLoyaltyProgress, loyaltyConfig, showToast],
  );

  // Upgrade loyalty tier using accumulated points
  const upgradeTierWithPoints = (targetTierId?: string): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: "Debes iniciar sesión para canjear tus puntos." };
    }
    const progress = getCustomerLoyaltyProgress(currentUser.id, currentUser.email);
    const activeTiers = [...loyaltyTiers]
      .filter((t) => t.active)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const targetTier = targetTierId
      ? activeTiers.find((t) => t.id === targetTierId)
      : progress.nextTier;

    if (!targetTier) {
      return { success: false, message: "Ya te encuentras en el nivel máximo de lealtad." };
    }

    if (progress.accumulatedPoints < progress.pointsCostForNextTier) {
      return {
        success: false,
        message: `Puntos insuficientes. Requieres ${progress.pointsCostForNextTier} puntos acumulados (tienes ${progress.accumulatedPoints}).`,
      };
    }

    const updatedSpentPoints =
      (currentUser.spentLoyaltyPoints || 0) + progress.pointsCostForNextTier;
    const updatedUser: User = {
      ...currentUser,
      spentLoyaltyPoints: updatedSpentPoints,
      customLoyaltyTierId: targetTier.id,
    };

    setCurrentUser(updatedUser);
    setRegisteredUsers((prev) => {
      const next = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      try {
        localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    } catch (_) {}
    void saveUserToFirestore(updatedUser);

    return {
      success: true,
      message: `¡Felicidades! Has desbloqueado el nivel ${targetTier.name}. Ahora disfrutas de ${targetTier.discountPercentage}% de descuento en todos tus encargos.`,
    };
  };

  // ─── Real-Time Program Stats (Strictly from verified approved purchases) ─────
  const loyaltyProgramStats: LoyaltyProgramStats = useMemo(() => {
    // Collect all real client records (registered users + distinct order clients)
    const clientMap = new Map<
      string,
      { email: string; name: string; id: string; ordersCount: number; spendLocal: number }
    >();

    registeredUsers.forEach((u) => {
      if (u.role !== "admin") {
        const email = u.email.toLowerCase().trim();
        clientMap.set(email, { email, name: u.name, id: u.id, ordersCount: 0, spendLocal: 0 });
      }
    });

    // Deduplicate orders by ID to ensure modified/reopened orders are counted at most once
    const uniqueOrdersMap = new Map<string, Order>();
    orders.forEach((o) => {
      if (o && o.id) {
        uniqueOrdersMap.set(o.id, o);
      }
    });

    Array.from(uniqueOrdersMap.values()).forEach((o) => {
      // ONLY COUNT VERIFIED & FULLY PAID PURCHASES (SALDO $0) FOR LOYALTY STATS
      if (isOrderEligibleForLoyalty(o)) {
        const email = (o.customerEmail || "").toLowerCase().trim();
        if (email) {
          const existing = clientMap.get(email) || {
            email,
            name: o.customerName || "Cliente",
            id: o.customerId || "cust-" + email,
            ordersCount: 0,
            spendLocal: 0,
          };
          existing.ordersCount += 1;
          const amt = o.totalPrice && o.totalPrice > 0 ? o.totalPrice : o.amountPaid || 0;
          existing.spendLocal += amt;
          clientMap.set(email, existing);
        }
      }
    });

    const activeTiers = [...loyaltyTiers]
      .filter((t) => t.active)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const tierCounts: Record<string, { memberCount: number; totalSpentUSD: number }> = {};
    activeTiers.forEach((t) => {
      tierCounts[t.id] = { memberCount: 0, totalSpentUSD: 0 };
    });

    let programTotalSpentUSD = 0;
    let programTotalOrders = 0;

    clientMap.forEach((client) => {
      const clientSpentUSD = Math.round(client.spendLocal * 100) / 100;
      programTotalSpentUSD += clientSpentUSD;
      programTotalOrders += client.ordersCount;

      // Find client tier
      let clientTier = activeTiers[0];
      for (const tier of activeTiers) {
        let qualifies = false;
        if (tier.qualificationCriterion === "SPEND_USD") {
          qualifies = clientSpentUSD >= tier.minSpendUSD;
        } else if (tier.qualificationCriterion === "ORDERS_COUNT") {
          qualifies = client.ordersCount >= tier.minOrdersCount;
        } else {
          qualifies =
            clientSpentUSD >= tier.minSpendUSD && client.ordersCount >= tier.minOrdersCount;
        }
        if (qualifies) {
          clientTier = tier;
        }
      }

      if (clientTier && tierCounts[clientTier.id]) {
        tierCounts[clientTier.id].memberCount += 1;
        tierCounts[clientTier.id].totalSpentUSD += clientSpentUSD;
      }
    });

    // Coupons metrics - purged
    const couponsUsedCount = 0;
    const couponsTotalDiscountGivenUSD = 0;

    // Gift cards metrics (All in USD)
    const giftCardsIssuedUSD = giftCards.reduce((sum, g) => sum + (g.initialAmount || 0), 0);
    const giftCardsActiveBalanceUSD = giftCards.reduce(
      (sum, g) => sum + (g.currentBalance || 0),
      0,
    );
    const giftCardsRedeemedUSD = Math.max(0, giftCardsIssuedUSD - giftCardsActiveBalanceUSD);

    const tierDistribution = activeTiers.map((t) => ({
      tierId: t.id,
      tierName: t.name,
      badge: t.badge,
      memberCount: tierCounts[t.id]?.memberCount || 0,
      totalSpentUSD: Math.round((tierCounts[t.id]?.totalSpentUSD || 0) * 100) / 100,
    }));

    return {
      totalMembers: clientMap.size,
      totalSpentUSD: Math.round(programTotalSpentUSD * 100) / 100,
      totalOrdersCount: programTotalOrders,
      couponsUsedCount,
      couponsTotalDiscountGivenUSD: Math.round(couponsTotalDiscountGivenUSD * 100) / 100,
      giftCardsIssuedUSD,
      giftCardsRedeemedUSD,
      giftCardsActiveBalanceUSD,
      tierDistribution,
    };
  }, [registeredUsers, orders, loyaltyTiers, coupons, giftCards]);

  // ─── Real-Time Cloud Synchronization ───────────────────────────────────────
  const clientIdRef = useRef<string>("client-" + Math.random().toString(36).substring(2, 10));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "saving" | "saved" | "error" | "syncing_live"
  >("idle");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [connectedDevicesCount, setConnectedDevicesCount] = useState<number>(1);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const isHydratedFromServerRef = useRef<boolean>(false);
  // Se vuelve true cuando la primera lectura de la base de datos ya se aplicó.
  const [cloudReady, setCloudReady] = useState<boolean>(false);
  const autoSaveTimerRef = useRef<any>(null);
  const canWriteSharedDataRef = useRef<boolean>(false);

  // Helper to safely apply data from server
  const applyServerData = useCallback((data: any) => {
    if (!data || typeof data !== "object") return;

    if (Array.isArray(data.products)) {
      setProducts(data.products);
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
      } catch (_) {}
    }
    if (Array.isArray(data.orders)) {
      if (isHydratedFromServerRef.current) {
        const newOrders = data.orders.filter((o: Order) => !knownOrderIdsRef.current.has(o.id));
        if (newOrders.length > 0) {
          newOrders.forEach((newOrder: Order) => {
            knownOrderIdsRef.current.add(newOrder.id);
            const orderAge = Date.now() - new Date(newOrder.createdAt).getTime();
            if (orderAge < 15 * 60 * 1000 && !getSeenOrderAlerts().has(newOrder.id)) {
              triggerAdminOrderAlert(newOrder);
            } else {
              markOrderAlertAsSeen(newOrder.id);
            }
          });
        }
      } else {
        data.orders.forEach((o: Order) => {
          knownOrderIdsRef.current.add(o.id);
          markOrderAlertAsSeen(o.id);
        });
      }
      setOrders(data.orders);
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
      } catch (_) {}
    }
    if (Array.isArray(data.customRequests)) {
      setCustomRequests(data.customRequests);
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_REQUESTS, JSON.stringify(data.customRequests));
      } catch (_) {}
    }
    if (Array.isArray(data.importantDates)) {
      setImportantDates(data.importantDates);
      try {
        localStorage.setItem(STORAGE_KEYS.IMPORTANT_DATES, JSON.stringify(data.importantDates));
      } catch (_) {}
    }
    if (Array.isArray(data.blockedDates)) {
      setBlockedDates(data.blockedDates);
      try {
        localStorage.setItem(STORAGE_KEYS.BLOCKED_DATES, JSON.stringify(data.blockedDates));
      } catch (_) {}
    }
    if (Array.isArray(data.gallery)) {
      setGallery(data.gallery);
      try {
        localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(data.gallery));
      } catch (_) {}
    }
    if (Array.isArray(data.reviews)) {
      setReviews(data.reviews);
      try {
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(data.reviews));
      } catch (_) {}
    }
    if (data.siteSettings && typeof data.siteSettings === "object") {
      setSiteSettings((prev) => {
        const merged = { ...prev, ...data.siteSettings };
        try {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
        } catch (_) {}
        return merged;
      });
    }
    if (data.homepageConfig && typeof data.homepageConfig === "object") {
      setHomepageConfig((prev) => {
        const merged = { ...prev, ...data.homepageConfig };
        try {
          localStorage.setItem(STORAGE_KEYS.HOMEPAGE, JSON.stringify(merged));
        } catch (_) {}
        return merged;
      });
    }
    if (Array.isArray(data.chatConversations)) {
      setChatConversations(data.chatConversations);
      try {
        localStorage.setItem(
          STORAGE_KEYS.CHAT_CONVERSATIONS,
          JSON.stringify(data.chatConversations),
        );
      } catch (_) {}
    }
    if (Array.isArray(data.giftCards)) {
      setGiftCards(data.giftCards);
      try {
        localStorage.setItem(STORAGE_KEYS.GIFT_CARDS, JSON.stringify(data.giftCards));
      } catch (_) {}
    }
    if (Array.isArray(data.registeredUsers)) {
      setRegisteredUsers(data.registeredUsers);
      try {
        localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(data.registeredUsers));
      } catch (_) {}
    }
    if (Array.isArray(data.loyaltyTiers)) {
      setLoyaltyTiers(data.loyaltyTiers);
      try {
        localStorage.setItem(STORAGE_KEYS.LOYALTY_TIERS, JSON.stringify(data.loyaltyTiers));
      } catch (_) {}
    }
    if (Array.isArray(data.coupons)) {
      setCoupons(data.coupons);
      try {
        localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(data.coupons));
      } catch (_) {}
    }
    if (Array.isArray(data.loyaltyTransactions)) {
      setLoyaltyTransactions(data.loyaltyTransactions);
      try {
        localStorage.setItem(
          STORAGE_KEYS.LOYALTY_TRANSACTIONS,
          JSON.stringify(data.loyaltyTransactions),
        );
      } catch (_) {}
    }
    if (data.loyaltyConfig && typeof data.loyaltyConfig === "object") {
      setLoyaltyConfig((prev) => {
        const merged = { ...prev, ...data.loyaltyConfig };
        try {
          localStorage.setItem(STORAGE_KEYS.LOYALTY_CONFIG, JSON.stringify(merged));
        } catch (_) {}
        return merged;
      });
    }
  }, []);

  // Track latest state for synchronous access in saveAllNow without closure delays
  const latestStateRef = useRef({
    products,
    orders,
    customRequests,
    importantDates,
    blockedDates,
    gallery,
    reviews,
    siteSettings,
    homepageConfig,
    chatConversations,
    giftCards,
    registeredUsers,
    loyaltyTiers,
    coupons,
    loyaltyConfig,
    loyaltyTransactions,
  });

  latestStateRef.current = {
    products,
    orders,
    customRequests,
    importantDates,
    blockedDates,
    gallery,
    reviews,
    siteSettings,
    homepageConfig,
    chatConversations,
    giftCards,
    registeredUsers,
    loyaltyTiers,
    coupons,
    loyaltyConfig,
    loyaltyTransactions,
  };

  // Manual Save All function for the Owner Panel button
  const saveAllNow = useCallback(
    async (overrides?: Record<string, any>): Promise<boolean> => {
      // Clear pending debounce timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      if (!canWriteSharedDataRef.current) {
        showToast({
          title: "Solo la dueña puede publicar cambios",
          subtitle: "Inicia sesión con la cuenta administradora para guardar en la tienda.",
        });
        return false;
      }

      setIsSyncing(true);
      setSyncStatus("saving");
      try {
        const payload = {
          ...latestStateRef.current,
          ...(overrides || {}),
        };

        await syncCompleteStateToFirestore(payload);

        setSyncStatus("saved");
        setLastSavedTime(new Date());
        showToast({
          title: "¡Sincronizado en la base de datos central!",
          subtitle:
            "Todos los cambios (productos, fechas, textos, promociones) ya son la configuración oficial para todos los clientes.",
        });
        return true;
      } catch (err) {
        console.error("Save all error:", err);
        setSyncStatus("error");
        showToast({
          title: "Guardado localmente",
          subtitle: "Los cambios están guardados en este dispositivo y se subirán al reconectar.",
        });
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [showToast],
  );

  // Reload latest data from the cloud
  const reloadFromServer = useCallback(async () => {
    setSyncStatus("saved");
    setLastSavedTime(new Date());
    showToast({
      title: "Datos actualizados",
      subtitle: "Se cargó la versión más reciente de la tienda.",
    });
  }, [showToast]);

  // Maintenance Mode state and methods
  const [previewAsVisitor, setPreviewAsVisitor] = useState<boolean>(false);
  const isMaintenanceActive = Boolean(siteSettings.maintenanceMode?.enabled);

  const toggleMaintenanceMode = useCallback(
    (forceState?: boolean) => {
      const current = siteSettings.maintenanceMode?.enabled ?? false;
      const nextState = typeof forceState === "boolean" ? forceState : !current;

      const nextSettings: SiteSettings = {
        ...siteSettings,
        maintenanceMode: {
          title: siteSettings.maintenanceMode?.title || "Sitio en Mantenimiento Temporal",
          message:
            siteSettings.maintenanceMode?.message ||
            "Estamos actualizando el catálogo y preparando hermosas novedades para tus fechas especiales. Regresamos en unos momentos.",
          estimatedReturn: siteSettings.maintenanceMode?.estimatedReturn || "En unos momentos",
          contactWhatsapp: siteSettings.maintenanceMode?.contactWhatsapp ?? true,
          ...siteSettings.maintenanceMode,
          enabled: nextState,
        },
      };

      setSiteSettings(nextSettings);
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(nextSettings));
      } catch (e) {
        console.error("Error saving siteSettings:", e);
      }

      showToast({
        title: nextState ? "⚠️ Modo Mantenimiento Activado" : "✨ Modo Mantenimiento Desactivado",
        subtitle: nextState
          ? "Los visitantes verán la pantalla de aviso mientras editas."
          : "Tu tienda ya está abierta nuevamente para todo el público.",
      });

      saveAllNow({ siteSettings: nextSettings });
    },
    [siteSettings, saveAllNow, showToast],
  );

  const updateMaintenanceConfig = useCallback(
    (config: Partial<MaintenanceModeConfig>) => {
      const currentMode = siteSettings.maintenanceMode || {
        enabled: false,
        title: "Sitio en Mantenimiento Temporal",
        message:
          "Estamos actualizando el catálogo y preparando hermosas novedades para tus fechas especiales. Regresamos en unos momentos.",
        estimatedReturn: "En unos momentos",
        contactWhatsapp: true,
      };

      const nextSettings: SiteSettings = {
        ...siteSettings,
        maintenanceMode: {
          ...currentMode,
          ...config,
        },
      };

      setSiteSettings(nextSettings);
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(nextSettings));
      } catch (e) {
        console.error("Error saving siteSettings:", e);
      }

      saveAllNow({ siteSettings: nextSettings });
    },
    [siteSettings, saveAllNow],
  );

  // ─── Cloud Real-Time Subscriptions ────────────────────────────────────────
  // Auto-save must not run until the first snapshot from the database has been
  // applied, otherwise a stale local cache could overwrite the live shop.
  useEffect(() => {
    let isMounted = true;
    const unsubscribes: (() => void)[] = [];
    let pendingInitial = 3; // settings + homepage + products
    const markReady = () => {
      pendingInitial -= 1;
      if (pendingInitial <= 0 && !isHydratedFromServerRef.current) {
        isHydratedFromServerRef.current = true;
        setCloudReady(true);
        setSyncStatus("saved");
      }
    };
    const readyFallback = setTimeout(() => {
      pendingInitial = 0;
      markReady();
    }, 6000);

    // Seed Cloud Firestore with official configuration if not yet initialized
    checkAndSeedFirestoreDatabase({
      siteSettings,
      homepageConfig,
      products,
      orders,
      customRequests,
      importantDates,
      blockedDates,
      gallery,
      reviews,
      giftCards,
      loyaltyTiers,
      coupons,
    })
      .then(() => {
        if (isMounted) setIsFirestoreConnected(true);
      })
      .catch((err) => {
        console.warn("[Firestore] Initialization warning:", err);
      });

    // Shared helper: applies a remote list to local state + cache.
    // The database is the single source of truth: an empty list is a real
    // "everything was deleted" and is applied as-is, so removals never come
    // back from a stale browser cache.
    const applyList = <T,>(
      _key: string,
      remote: T[] | null,
      setter: (items: T[]) => void,
      storageKey: string,
    ) => {
      if (!isMounted || !remote) return;
      setter(remote);
      try {
        localStorage.setItem(storageKey, JSON.stringify(remote));
      } catch (_) {}
    };

    // 1. Site Settings Document
    unsubscribes.push(
      subscribeToDoc<SiteSettings>(COLLECTIONS.SITE_CONFIG, "settings", (remoteSettings) => {
        markReady();
        if (!isMounted || !remoteSettings) return;
        setSiteSettings((prev) => {
          const merged = { ...prev, ...remoteSettings };
          try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      }),
    );

    // 2. Homepage Config Document
    unsubscribes.push(
      subscribeToDoc<HomepageConfig>(COLLECTIONS.SITE_CONFIG, "homepage", (remoteHomepage) => {
        markReady();
        if (!isMounted || !remoteHomepage) return;
        setHomepageConfig((prev) => {
          const merged = { ...prev, ...remoteHomepage };
          try {
            localStorage.setItem(STORAGE_KEYS.HOMEPAGE, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      }),
    );

    // 3. Products Collection
    unsubscribes.push(
      subscribeToCollection<Product>(COLLECTIONS.PRODUCTS, (remoteProducts) => {
        markReady();
        applyList("products", remoteProducts, setProducts, STORAGE_KEYS.PRODUCTS);
      }),
    );

    // 4. Orders Collection
    unsubscribes.push(
      subscribeToCollection<Order>(COLLECTIONS.ORDERS, (remoteOrders) => {
        if (!isMounted) return;
        if (remoteOrders) {
          const newOrders = remoteOrders.filter((o) => !knownOrderIdsRef.current.has(o.id));
          if (newOrders.length > 0 && isHydratedFromServerRef.current) {
            newOrders.forEach((no) => {
              knownOrderIdsRef.current.add(no.id);
              const orderAge = Date.now() - new Date(no.createdAt).getTime();
              if (orderAge < 15 * 60 * 1000 && !getSeenOrderAlerts().has(no.id)) {
                triggerAdminOrderAlert(no);
              } else {
                markOrderAlertAsSeen(no.id);
              }
            });
          } else {
            remoteOrders.forEach((o) => {
              knownOrderIdsRef.current.add(o.id);
              markOrderAlertAsSeen(o.id);
            });
          }
          setOrders(remoteOrders);
          try {
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(remoteOrders));
          } catch (_) {}
        }
      }),
    );

    // 5. Custom Requests Collection
    unsubscribes.push(
      subscribeToCollection<CustomRequest>(COLLECTIONS.CUSTOM_REQUESTS, (remoteReqs) => {
        if (!isMounted) return;
        if (remoteReqs) {
          setCustomRequests(remoteReqs);
          try {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_REQUESTS, JSON.stringify(remoteReqs));
          } catch (_) {}
        }
      }),
    );

    // 6. Important Dates Collection
    unsubscribes.push(
      subscribeToCollection<ImportantDate>(COLLECTIONS.IMPORTANT_DATES, (remoteDates) => {
        const sorted = remoteDates
          ? [...remoteDates].sort((a, b) => a.date.localeCompare(b.date))
          : null;
        applyList("importantDates", sorted, setImportantDates, STORAGE_KEYS.IMPORTANT_DATES);
      }),
    );

    // 7. Blocked Dates Collection
    unsubscribes.push(
      subscribeToCollection<BlockedDate>(COLLECTIONS.BLOCKED_DATES, (remoteBlocked) => {
        applyList("blockedDates", remoteBlocked, setBlockedDates, STORAGE_KEYS.BLOCKED_DATES);
      }),
    );

    // 8. Gallery Collection
    unsubscribes.push(
      subscribeToCollection<GalleryItem>(COLLECTIONS.GALLERY, (remoteGallery) => {
        applyList("gallery", remoteGallery, setGallery, STORAGE_KEYS.GALLERY);
      }),
    );

    // 9. Reviews Collection
    unsubscribes.push(
      subscribeToCollection<Review>(COLLECTIONS.REVIEWS, (remoteReviews) => {
        applyList("reviews", remoteReviews, setReviews, STORAGE_KEYS.REVIEWS);
      }),
    );

    // 10. Gift Cards Collection
    unsubscribes.push(
      subscribeToCollection<GiftCard>(COLLECTIONS.GIFT_CARDS, (remoteCards) => {
        if (!isMounted) return;
        if (remoteCards) {
          setGiftCards(remoteCards);
          try {
            localStorage.setItem(STORAGE_KEYS.GIFT_CARDS, JSON.stringify(remoteCards));
          } catch (_) {}
        }
      }),
    );

    // 11. Loyalty Tiers Collection
    unsubscribes.push(
      subscribeToCollection<LoyaltyTier>(COLLECTIONS.LOYALTY_TIERS, (remoteTiers) => {
        const sorted = remoteTiers
          ? [...remoteTiers].sort((a, b) => a.orderIndex - b.orderIndex)
          : null;
        applyList("loyaltyTiers", sorted, setLoyaltyTiers, STORAGE_KEYS.LOYALTY_TIERS);
      }),
    );

    // 12. Coupons Collection
    unsubscribes.push(
      subscribeToCollection<DiscountCoupon>(COLLECTIONS.COUPONS, (remoteCoupons) => {
        applyList("coupons", remoteCoupons, setCoupons, STORAGE_KEYS.COUPONS);
      }),
    );

    // 13. Chat Conversations Collection
    unsubscribes.push(
      subscribeToCollection<ChatConversation>(COLLECTIONS.CHAT_CONVERSATIONS, (remoteConvos) => {
        if (!isMounted) return;
        if (remoteConvos && remoteConvos.length > 0) {
          setChatConversations(remoteConvos);
          try {
            localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(remoteConvos));
          } catch (_) {}
        }
      }),
    );

    // 14. Users Collection
    unsubscribes.push(
      subscribeToCollection<User>(COLLECTIONS.USERS, (remoteUsers) => {
        if (!isMounted) return;
        if (remoteUsers && remoteUsers.length > 0) {
          setRegisteredUsers((prev) => {
            const merged = remoteUsers.map((ru) => {
              const localMatch = prev.find(
                (p) =>
                  p.id === ru.id ||
                  (p.email && ru.email && p.email.toLowerCase() === ru.email.toLowerCase()),
              );
              if (!ru.avatar && localMatch?.avatar) {
                return { ...ru, avatar: localMatch.avatar };
              }
              return ru;
            });
            try {
              localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(merged));
            } catch (_) {}
            return merged;
          });

          setCurrentUser((curr) => {
            if (!curr) return curr;
            const remoteCurrent = remoteUsers.find(
              (u) =>
                u.id === curr.id ||
                (curr.email && u.email && u.email.toLowerCase() === curr.email.toLowerCase()),
            );
            if (remoteCurrent) {
              const resolved = { ...curr, ...remoteCurrent };
              if (!resolved.avatar && curr.avatar) resolved.avatar = curr.avatar;
              return resolved;
            }
            return curr;
          });
        }
      }),
    );

    // 15. Loyalty Transactions Collection
    unsubscribes.push(
      subscribeToCollection<LoyaltyTransaction>(COLLECTIONS.LOYALTY_TRANSACTIONS, (remoteTxs) => {
        applyList(
          "loyaltyTransactions",
          remoteTxs,
          setLoyaltyTransactions,
          STORAGE_KEYS.LOYALTY_TRANSACTIONS,
        );
      }),
    );

    // 16. Loyalty Program Config Document
    unsubscribes.push(
      subscribeToDoc<LoyaltyProgramConfig>(COLLECTIONS.SITE_CONFIG, "loyalty", (remoteConfig) => {
        if (!isMounted || !remoteConfig) return;
        setLoyaltyConfig((prev) => {
          const merged = { ...prev, ...remoteConfig };
          try {
            localStorage.setItem(STORAGE_KEYS.LOYALTY_CONFIG, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      }),
    );

    // 17. Sorteos (Giveaways) Collection
    unsubscribes.push(
      subscribeToCollection<Giveaway>(COLLECTIONS.GIVEAWAYS, (remoteGiveaways) => {
        applyList("giveaways", remoteGiveaways, setGiveaways, STORAGE_KEYS.GIVEAWAYS);
      }),
    );

    // 18. Participaciones de Sorteos (Giveaway Entries) Collection
    unsubscribes.push(
      subscribeToCollection<GiveawayEntry>(COLLECTIONS.GIVEAWAY_ENTRIES, (remoteEntries) => {
        applyList(
          "giveawayEntries",
          remoteEntries,
          setGiveawayEntries,
          STORAGE_KEYS.GIVEAWAY_ENTRIES,
        );
      }),
    );

    // 19. Ganadores Oficiales de Sorteos (Giveaway Winners) Collection
    unsubscribes.push(
      subscribeToCollection<GiveawayWinner>(COLLECTIONS.GIVEAWAY_WINNERS, (remoteWinners) => {
        applyList(
          "giveawayWinners",
          remoteWinners,
          setGiveawayWinners,
          STORAGE_KEYS.GIVEAWAY_WINNERS,
        );
      }),
    );

    // 20. Descuentos Comerciales (Discounts) Collection
    unsubscribes.push(
      subscribeToCollection<StoreDiscount>(COLLECTIONS.DISCOUNTS, (remoteDiscounts) => {
        applyList("discounts", remoteDiscounts, setDiscounts, STORAGE_KEYS.DISCOUNTS);
      }),
    );

    return () => {
      isMounted = false;
      clearTimeout(readyFallback);
      unsubscribes.forEach((unsub) => {
        try {
          unsub();
        } catch (_) {}
      });
    };
  }, []);

  // Only the owner (admin) may publish shared shop data.
  useEffect(() => {
    canWriteSharedDataRef.current = currentUser?.role === "admin";
  }, [currentUser?.role]);

  // ─── Auto-guardado v2 ─────────────────────────────────────────────────────
  // Cada bloque de información se refleja en la base de datos en cuanto cambia.
  // Sólo escribe lo que realmente cambió y sólo cuando la dueña editó algo.
  const canPublish = cloudReady && currentUser?.role === "admin";

  // Contenido de la tienda: se refleja tal cual (incluye eliminaciones).
  useMirroredCollection(COLLECTIONS.PRODUCTS, products, canPublish);
  useMirroredCollection(COLLECTIONS.GALLERY, gallery, canPublish);
  useMirroredCollection(COLLECTIONS.IMPORTANT_DATES, importantDates, canPublish);
  useMirroredCollection(COLLECTIONS.BLOCKED_DATES, blockedDates, canPublish);
  useMirroredCollection(COLLECTIONS.REVIEWS, reviews, canPublish);
  useMirroredCollection(COLLECTIONS.LOYALTY_TIERS, loyaltyTiers, canPublish);
  useMirroredCollection(COLLECTIONS.COUPONS, coupons, canPublish);
  useMirroredCollection(COLLECTIONS.GIVEAWAYS, giveaways, canPublish);
  useMirroredCollection(COLLECTIONS.DISCOUNTS, discounts, canPublish);

  // Configuración de la tienda.
  useMirroredDoc(COLLECTIONS.SITE_CONFIG, "settings", siteSettings, canPublish);
  useMirroredDoc(COLLECTIONS.SITE_CONFIG, "homepage", homepageConfig, canPublish);
  useMirroredDoc(COLLECTIONS.SITE_CONFIG, "loyalty_config", loyaltyConfig, canPublish);

  // Historial de clientes: se actualiza, nunca se borra en bloque.
  useUpsertedCollection(COLLECTIONS.ORDERS, orders, canPublish);
  useUpsertedCollection(COLLECTIONS.CUSTOM_REQUESTS, customRequests, canPublish);
  useUpsertedCollection(COLLECTIONS.GIFT_CARDS, giftCards, canPublish);
  useUpsertedCollection(COLLECTIONS.LOYALTY_TRANSACTIONS, loyaltyTransactions, canPublish);
  useUpsertedCollection(COLLECTIONS.CHAT_CONVERSATIONS, chatConversations, canPublish);
  useUpsertedCollection(COLLECTIONS.USERS, registeredUsers, canPublish);
  useUpsertedCollection(COLLECTIONS.GIVEAWAY_ENTRIES, giveawayEntries, canPublish);
  useUpsertedCollection(COLLECTIONS.GIVEAWAY_WINNERS, giveawayWinners, canPublish);

  // Indicador de estado (guardando / guardado / error) para el panel.
  useEffect(
    () =>
      onPersistenceStatus((s, at) => {
        if (s === "idle") return;
        setSyncStatus(s === "saving" ? "saving" : s === "error" ? "error" : "saved");
        if (at) setLastSavedTime(at);
      }),
    [],
  );

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAdmin,
        login,
        register,
        resetPassword,
        changePassword,
        authReady,
        logout,
        quickSwitchUser,
        enterOwnerMode,
        updateUserProfile,
        deleteAccountPermanently,
        registeredUsers,
        savePersonalDate,
        deletePersonalDate,
        savePerson,
        deletePerson,
        saveCustomerMessage,
        deleteCustomerMessage,
        updateNotificationPreferences,
        products,
        activeProducts,
        addProduct,
        createProduct,
        updateProduct,
        toggleProductAvailability,
        deleteProduct,
        resetToSampleProducts,
        orders,
        customerOrders,
        createOrder,
        updateOrderStatus,
        uploadPaymentProof,
        verifyPayment,
        verifyPaymentProof,
        customRequests,
        customerCustomRequests,
        submitCustomRequest,
        quoteCustomRequest,
        updateCustomRequestStatus,
        importantDates,
        blockedDates,
        calendarDates,
        addImportantDate,
        updateImportantDate,
        deleteImportantDate,
        addBlockedDate,
        deleteBlockedDate,
        setDayCapacity,
        setDayBlocked,
        checkDateAvailability,
        gallery,
        addGalleryItem,
        deleteGalleryItem,
        reviews,
        addReview,
        deleteReview,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        wishlist,
        toggleWishlist,
        notifications,
        unreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        sendNotification,
        siteSettings,
        updateSiteSettings,
        categories,
        addCategory,
        renameCategory,
        deleteCategory,
        homepageConfig,
        updateHomepageConfig,
        activeTab,
        setActiveTab,
        adminSection,
        setAdminSection,
        customerAccountTab,
        setCustomerAccountTab,
        selectedProductId,
        setSelectedProductId,
        selectedOrderId,
        setSelectedOrderId,
        customRequestType,
        setCustomRequestType,
        toast,
        showToast,
        clearToast,
        cartBounceKey,
        adminOrderAlerts,
        dismissAdminOrderAlert,
        clearAllAdminOrderAlerts,
        triggerAdminOrderAlert,
        adminSoundEnabled,
        toggleAdminSound,
        testAdminOrderAlert,
        chatConversations,
        isChatOpen,
        setIsChatOpen,
        chatDraftMessage,
        setChatDraftMessage,
        openInternalChat,
        sendChatMessage,
        markChatAsRead,
        deleteChatConversation,
        isSyncing,
        syncStatus,
        lastSavedTime,
        connectedDevicesCount,
        isFirestoreConnected,
        saveAllNow,
        reloadFromServer,
        isMaintenanceActive,
        toggleMaintenanceMode,
        updateMaintenanceConfig,
        previewAsVisitor,
        setPreviewAsVisitor,
        giftCards,
        purchaseGiftCard,
        redeemGiftCard,
        checkGiftCard,
        updateGiftCardStatus,
        createAdminGiftCard,
        deleteGiftCard,
        loyaltyTiers,
        createLoyaltyTier,
        updateLoyaltyTier,
        deleteLoyaltyTier,
        toggleLoyaltyTierStatus,
        resetToDefaultLoyaltyTiers,
        coupons,
        createCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponStatus,
        validateCoupon,
        applyCouponUsage,
        getCustomerLoyaltyProgress,
        upgradeTierWithPoints,
        loyaltyProgramStats,
        isLoyaltyModalOpen,
        setIsLoyaltyModalOpen,
        loyaltyConfig,
        saveLoyaltyConfig,
        loyaltyTransactions,
        customerLoyaltyProgress,
        adjustCustomerPoints,
        redeemPointsForCoupon,
        giveaways,
        giveawayEntries,
        giveawayWinners,
        discounts,
        createGiveaway,
        updateGiveaway,
        deleteGiveaway,
        toggleGiveawayStatus,
        cancelGiveaway,
        participateInGiveaway,
        drawGiveawayWinner,
        updateGiveawayPrizeStatus,
        createDiscount,
        updateDiscount,
        deleteDiscount,
        toggleDiscountStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
