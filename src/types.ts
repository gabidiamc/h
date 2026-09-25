export type UserRole = "admin" | "customer";

export type AdminSection =
  | "stats"
  | "orders"
  | "requests"
  | "chats"
  | "products"
  | "calendar"
  | "gallery"
  | "giftcards"
  | "loyalty"
  | "giveaways"
  | "settings";

export type MiMonceTab =
  | "inicio"
  | "pedidos"
  | "lealtad"
  | "favoritos"
  | "fechas"
  | "beneficios"
  | "mensajes"
  | "notificaciones"
  | "cuenta";

export interface CustomerPersonalDate {
  id: string;
  personName: string;
  relationship: string;
  eventType: "cumpleanos" | "aniversario" | "san_valentin" | "dia_madres" | "graduacion" | "otro";
  date: string; // YYYY-MM-DD
  notes?: string;
  reminderDaysBefore?: number;
  createdAt: string;
}

export interface CustomerPerson {
  id: string;
  name: string;
  relationship: string;
  importantDate?: string;
  dateType?: string;
  favoriteColors?: string;
  favoriteGiftType?: string;
  notes?: string;
  createdAt: string;
}

export interface CustomerSavedMessage {
  id: string;
  title: string;
  recipient?: string;
  category?: "amor" | "aniversario" | "cumpleanos" | "agradecimiento" | "disculpa" | "otro";
  message: string;
  createdAt: string;
}

export interface CustomerNotificationPreferences {
  orderStatusUpdates: boolean;
  paymentAlerts: boolean;
  upcomingDatesReminders: boolean;
  promotionsAndCoupons: boolean;
  loyaltyLevelUp: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string; // Calle y número o dirección específica
  city?: string; // Ciudad o Municipio
  state?: string; // Estado, Provincia o Región
  postalCode?: string; // Código postal
  nickname?: string; // Apodo o nombre de cariño preferido
  createdAt: string;
  avatar?: string;
  loyaltyPoints?: number;
  spentLoyaltyPoints?: number;
  customLoyaltyTierId?: string;
  isLoyaltyEligible?: boolean;
  favorites?: string[];
  savedDates?: CustomerPersonalDate[];
  savedPeople?: CustomerPerson[];
  savedMessages?: CustomerSavedMessage[];
  notificationPreferences?: CustomerNotificationPreferences;
}

export type ProductCategory = string;

export const DEFAULT_CATEGORIES: string[] = [
  "Ramos de Listón",
  "Cajas Sorpresa",
  "Parejas",
  "Graduaciones",
  "Cumpleaños",
  "Aniversarios",
  "Personalizados",
];

export interface ProductExtraOption {
  id: string;
  name: string;
  image?: string;
  price?: number;
  available?: boolean;
}

export interface ProductExtra {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  image?: string;
  /** Opciones con foto (ej. distintos peluches o tarjetas) que el cliente elige. */
  options?: ProductExtraOption[];
}

/** Grupo reutilizable de extras que se puede activar/desactivar en cada producto. */
export interface ProductExtraGroup {
  id: string;
  name: string;
  description?: string;
  extras: ProductExtra[];
}

export interface ProductSizeOption {
  name: string;
  rosesCount: number;
  price: number;
  description?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  color?: string;
  size?: string;
  price?: number;
  image?: string;
  available: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: ProductCategory;
  productType?: "normal" | "especial";
  customItemType?: "ramo" | "peluche";
  variants?: ProductVariant[];
  price: number;
  description: string;
  shortDescription: string;
  images: string[];
  ribbonColors: string[];
  sizes: ProductSizeOption[];
  extrasAvailable: ProductExtra[];
  /** Grupos de extras (definidos globalmente) activados en este producto. */
  extraGroupIds?: string[];
  available: boolean;
  minPrepDays: number;
  featured: boolean;
  tag?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type OrderStatus =
  | "SOLICITUD_RECIBIDA"
  | "EN_REVISION"
  | "ESPERANDO_INFORMACION"
  | "PRECIO_ENVIADO"
  | "ESPERANDO_PAGO"
  | "COMPROBANTE_EN_REVISION"
  | "ANTICIPO_RECIBIDO"
  | "PAGO_PENDIENTE_VERIFICACION"
  | "PAGO_VERIFICADO"
  | "EN_PRODUCCION"
  | "EN_PREPARACION"
  | "LISTO_PARA_ENTREGA"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";

export type PaymentStatus =
  | "PENDIENTE"
  | "ANTICIPO_PAGADO"
  | "COMPROBANTE_EN_REVISION"
  | "VERIFICANDO"
  | "CONFIRMADO"
  | "PAGADO_TOTAL"
  | "RECHAZADO"
  | "CANCELADO";

export interface PaymentProof {
  id: string;
  orderId: string;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
  status: "PENDIENTE" | "CONFIRMADO" | "RECHAZADO" | "CANCELADO";
  notes?: string;
  rejectionReason?: string;
}

export interface OrderItem {
  id?: string;
  productId?: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedExtras: ProductExtra[];
  dedicationMessage?: string;
  recipientName?: string;
  subtotal: number;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  isCustomRequest?: boolean;
  customRequestId?: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  deliveryMethod: "RETIRO" | "ENVIO";
  deliveryAddress?: string;
  notes?: string;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  totalPrice: number;
  requiredDeposit: number;
  amountPaid: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  paymentProof?: PaymentProof;
  paymentProofUrl?: string;
  paymentProofNotes?: string;
  giftCardCode?: string;
  giftCardDiscount?: number;
  loyaltyDiscount?: number;
  appliedLoyaltyTier?: string;
  cancellationReason?: string;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: string;
  paymentRejectedAt?: string;
  paymentRejectedBy?: string;
  paymentProofUploadedAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomRequestFile {
  id: string;
  url: string;
  name: string;
  size: number;
}

export interface CustomRequest {
  id: string;
  trackingNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  projectTitle: string;
  productType: string;
  description: string;
  desiredColors: string;
  theme: string;
  approximateBudget?: number;
  desiredDate: string;
  desiredTimeSlot: string;
  additionalNotes?: string;
  files: CustomRequestFile[];
  status: OrderStatus;
  quotedPrice?: number;
  quotedDeposit?: number;
  associatedOrderId?: string;
  ownerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportantDate {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  name?: string;
  description?: string;
  leadDays?: number;
  subtitle?: string;
  badge?: string;
  depositBonus?: number;
  emoji?: string;
  maxCapacity: number;
  notes?: string;
  active: boolean;
}

export interface BlockedDate {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: "Vacaciones" | "Evento privado" | "Sin disponibilidad" | "Otra razón";
  notes?: string;
  createdAt: string;
}

export interface CalendarDate {
  id: string;
  date: string;
  maxCapacity: number;
  currentOrdersCount: number;
  notes?: string;
  isBlocked?: boolean;
}

export type DayAvailabilityStatus = "AVAILABLE" | "FEW_SLOTS" | "FULL" | "BLOCKED";

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  isBlocked: boolean;
  blockReason?: string;
  maxCapacity: number;
  currentBookings: number;
  remainingSlots: number;
  status: DayAvailabilityStatus;
  importantEvent?: ImportantDate;
}

export interface GalleryItem {
  id: string;
  title: string;
  category:
    | ProductCategory
    | "Ramos"
    | "Parejas"
    | "Cumpleaños"
    | "Graduaciones"
    | "Regalos"
    | "Personalizados";
  imageUrl: string;
  description?: string;
  date?: string;
  featured?: boolean;
}

export interface Review {
  id: string;
  customerId?: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  customerName: string;
  customerEmail?: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  targetRole: "admin" | "customer" | "all";
  title: string;
  message: string;
  type: "order" | "payment" | "custom" | "system" | "loyalty" | "promo" | "reminder";
  linkTarget?: string;
  read: boolean;
  createdAt: string;
}

export interface AdminOrderAlert {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  totalPrice: number;
  requiredDeposit: number;
  scheduledDate: string;
  scheduledTimeSlot?: string;
  deliveryMethod: "RETIRO" | "ENVIO";
  itemsSummary: string;
  itemImage?: string;
  itemsCount: number;
  timestamp: string;
  isCustomRequest?: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedSize?: ProductSizeOption;
  selectedColor?: string;
  selectedVariant?: ProductVariant;
  selectedExtras: ProductExtra[];
  scheduledDate: string;
  scheduledTimeSlot: string;
  deliveryMethod: "RETIRO" | "ENVIO";
  deliveryAddress?: string;
  dedicationMessage?: string;
  recipientName?: string;
  itemTotal: number;
}

export interface GuaranteeItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface MaintenanceModeConfig {
  enabled: boolean;
  title?: string;
  message?: string;
  estimatedReturn?: string;
  contactWhatsapp?: boolean;
}

export type PaymentMethodType =
  "BANK_TRANSFER" | "PAYPAL" | "VENMO" | "ZELLE" | "CASH_APP" | "MERCADO_PAGO" | "OTHER";

export interface PaymentMethodConfig {
  id: string;
  name?: string;
  type: PaymentMethodType;
  title?: string;
  enabled: boolean;
  iconUrl?: string; // Icono subido desde el dispositivo o URL
  accountIdentifier?: string; // Correo, usuario, CLABE, teléfono
  paymentUrl?: string; // Enlace directo a PayPal.me, Venmo, etc.
  instructions: string;
  badge?: string;
}

export interface SiteSettings {
  businessName: string;
  slogan: string;
  tagline: string;
  logoUrl?: string;
  email: string;
  phone: string;
  whatsapp: string;
  whatsappWelcomeMessage?: string;
  instagram: string;
  tiktok?: string;
  facebook?: string;
  pickupAddress: string;
  businessHours: string;
  bankDetails: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    clabeOrKey: string;
    instructions: string;
  };
  paymentMethods?: PaymentMethodConfig[];
  currencySymbol: string;
  depositPercentage: number;
  defaultDailyCapacity: number;
  pageBackgroundColor: string;
  pageThemePreset?: "blush" | "ivory" | "champagne" | "rose" | "luxury" | "custom";
  guaranteeTitle: string;
  guaranteeSubtitle: string;
  guarantees: GuaranteeItem[];
  maintenanceMode?: MaintenanceModeConfig;
  productCategories?: string[];
  /** Grupos de extras personalizables reutilizables en cualquier producto. */
  extraGroups?: ProductExtraGroup[];
}

export interface HomepageConfig {
  hero: {
    title: string;
    emotionalPhrase: string;
    description: string;
    imageUrl: string;
    backgroundImage?: string;
    backgroundOverlayOpacity?: number;
    primaryBtnText: string;
    secondaryBtnText: string;
  };
  aboutUs: {
    title: string;
    artisanName: string;
    story: string;
    imageUrl: string;
  };
  featuredProductIds: string[];
  sectionOrder: string[];
  sectionVisibility: Record<string, boolean>;
}

export interface ChatMessage {
  id: string;
  senderRole: "admin" | "customer";
  senderName: string;
  senderAvatar?: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
  orderNumberRef?: string;
  read?: boolean;
  fontStyle?: "sans" | "serif" | "mono" | "cursive";
}

export interface ChatConversation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  unreadByAdmin: number;
  unreadByCustomer: number;
  messages: ChatMessage[];
  updatedAt: string;
  relatedOrderNumber?: string;
}

export type GiftCardTheme = "romantic_rose" | "golden_elegance" | "lavender_dream" | "velvet_noir";

export interface GiftCardRedemption {
  id: string;
  orderId?: string;
  orderNumber?: string;
  amountUsed: number;
  date: string;
  note?: string;
}

export interface GiftCard {
  id: string;
  code: string;
  initialAmount: number;
  currentBalance: number;
  currency?: "USD" | "MXN";
  status: "active" | "partially_used" | "redeemed" | "expired";
  themeDesign: GiftCardTheme;
  purchaserName: string;
  purchaserEmail: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  personalMessage: string;
  deliveryMethod: "whatsapp" | "email" | "direct";
  scheduledDeliveryDate?: string;
  orderId?: string;
  source?: "giveaway" | "purchase" | "admin";
  giveawayId?: string;
  winnerUserId?: string;
  createdAt: string;
  expiresAt?: string;
  redemptionHistory: GiftCardRedemption[];
}

export type LoyaltyQualificationCriterion = "SPEND_USD" | "ORDERS_COUNT" | "BOTH";

export type LoyaltyCardTheme =
  | "rose_gold"
  | "silver_velvet"
  | "imperial_gold"
  | "black_diamond"
  | "vip_royal"
  | "vip_elite"
  | "lavender_luxury"
  | "custom";

export interface LoyaltyTier {
  id: string;
  name: string;
  badge: string;
  description: string;
  cardTheme: LoyaltyCardTheme;
  customGradient?: string;
  cardTextColor?: string;
  qualificationCriterion: LoyaltyQualificationCriterion;
  requiredPoints: number; // Puntos requeridos: Rosa (0), Plata (250), Oro (750), Diamante (1750), VIP (3750), VIP Elite (7500)
  minSpendUSD: number;
  minOrdersCount: number;
  discountPercentage: number;
  multiplier?: number; // Multiplicador de puntos (ej. 1.0, 1.25, 1.5, 2.0)
  benefits: string[];
  earlyAccessEvents: boolean;
  exclusiveBouquetsCatalog: boolean;
  specialGiftIncluded: boolean;
  welcomeCouponCode?: string;
  active: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export type LoyaltyTransactionType =
  | "EARNED_PURCHASE"
  | "BONUS_WELCOME"
  | "BONUS_SPECIAL_DATE"
  | "BONUS_ADMIN"
  | "REDEEMED_DISCOUNT"
  | "REDEEMED_REWARD"
  | "ORDER_APPROVED"
  | "REDEMPTION"
  | "ADJUSTMENT";

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  customerEmail?: string;
  customerName?: string;
  orderId?: string;
  orderNumber?: string;
  type: LoyaltyTransactionType;
  points: number; // Positivo para sumas, negativo para canjes
  balanceAfter: number;
  description: string;
  timestamp: string;
  createdBy?: string;
  note?: string;
}

export interface LoyaltyProgramConfig {
  enabled: boolean;
  pointsPerDollar: number; // Default: 0.5 ($1 USD = 0.50 puntos)
  welcomeBonusPoints: number; // Default: 50 puntos
  specialDateBonusMultiplier: number; // Default: 1.5x
  redemptionRatePointsPerUSD: number; // Default: 20 (20 pts = $1 USD descuento)
  minimumPointsToRedeem: number; // Default: 100 pts
  maxDiscountPerOrderUSD?: number;
}

export type CouponDiscountType = "PERCENTAGE" | "FIXED_USD";

export interface DiscountCoupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minPurchaseUSD?: number;
  maxDiscountUSD?: number;
  expirationDate?: string;
  maxUses?: number;
  usedCount: number;
  maxUsesPerCustomer?: number;
  restrictedToTierId?: string; // 'ALL' or a specific tier id
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  createdAt: string;
}

export interface CustomerLoyaltyProgress {
  customerId: string;
  customerName: string;
  customerEmail: string;
  memberNumber?: string;
  isEligible: boolean; // True ONLY if customer has at least 1 verified & approved purchase
  totalSpentUSD: number;
  totalOrdersCount: number;
  accumulatedPoints: number; // Total histórico de puntos ganados (determina nivel)
  availablePoints: number; // Saldo disponible para canje
  spentPoints: number; // Puntos canjeados
  currentTier: LoyaltyTier;
  nextTier?: LoyaltyTier;
  progressPercentage: number;
  pointsNeededForNextTier: number;
  usdNeededForNextTier: number;
  ordersNeededForNextTier: number;
  pointsCostForNextTier: number;
  canUpgradeWithPoints: boolean;
  unlockedBenefits: string[];
  availableCoupons: DiscountCoupon[];
}

export interface LoyaltyProgramStats {
  totalMembers: number;
  totalSpentUSD: number;
  totalOrdersCount: number;
  totalPointsIssued?: number;
  totalPointsRedeemed?: number;
  activePointsInCirculation?: number;
  couponsUsedCount: number;
  couponsTotalDiscountGivenUSD: number;
  giftCardsIssuedUSD: number;
  giftCardsRedeemedUSD: number;
  giftCardsActiveBalanceUSD: number;
  tierDistribution: {
    tierId: string;
    tierName: string;
    badge: string;
    memberCount: number;
    totalSpentUSD: number;
  }[];
}

/**
 * Payment Verification Check:
 * Indicates whether the owner has approved the payment proof for order processing/workshop.
 * This applies to both advance payments (anticipo) and full payments.
 *
 * - Orders in 'PENDIENTE', 'VERIFICANDO', 'PAGO_PENDIENTE_VERIFICACION', 'ESPERANDO_PAGO' DO NOT COUNT.
 * - Orders with 'RECHAZADO' or 'CANCELADO' DO NOT COUNT.
 * - Approved orders (paymentStatus === 'CONFIRMADO', 'PAGADO_TOTAL', 'ANTICIPO_PAGADO', or status === 'PAGO_VERIFICADO') COUNT.
 */
export function isOrderPaymentApproved(order?: Order | null): boolean {
  if (!order || !order.id) return false;
  if (order.status === "CANCELADO" || order.paymentStatus === "CANCELADO") return false;
  if (
    order.paymentStatus === "RECHAZADO" ||
    order.paymentStatus === "PENDIENTE" ||
    order.paymentStatus === "VERIFICANDO" ||
    order.paymentStatus === "COMPROBANTE_EN_REVISION" ||
    order.status === "PAGO_PENDIENTE_VERIFICACION" ||
    order.status === "ESPERANDO_PAGO"
  ) {
    return false;
  }
  return (
    order.paymentStatus === "CONFIRMADO" ||
    order.paymentStatus === "PAGADO_TOTAL" ||
    order.paymentStatus === "ANTICIPO_PAGADO" ||
    order.status === "PAGO_VERIFICADO" ||
    order.paymentProof?.status === "CONFIRMADO"
  );
}

/**
 * Strict Loyalty Program Eligibility Check:
 * DEFINITIVE RULE: A customer CANNOT enter the loyalty club or receive points solely
 * because an advance payment (anticipo) was approved.
 *
 * Example:
 * Total: $100 | Anticipo approved: $50 | Remaining balance: $50
 * - Advance payment: APPROVED (order can proceed in preparation)
 * - Loyalty: NOT ELIGIBLE yet (points: 0, club: locked/hidden, benefits: hidden)
 *
 * ONLY when the order has total payment verified and remaining balance is strictly $0:
 * - Purchase is considered fully verified
 * - Customer gains loyalty eligibility
 * - Points are credited and calculated
 */
export function isOrderEligibleForLoyalty(order?: Order | null): boolean {
  if (!order || !order.id) return false;
  if (order.status === "CANCELADO" || order.paymentStatus === "CANCELADO") return false;
  if (order.paymentStatus === "RECHAZADO") return false;

  // 1. Payment must be approved by the owner
  if (!isOrderPaymentApproved(order)) return false;

  // 2. Order MUST be fully paid with remaining balance strictly $0
  const remaining = typeof order.remainingBalance === "number" ? order.remainingBalance : 0;
  if (remaining > 0) {
    return false;
  }

  const isFullyPaidStatus = order.paymentStatus === "PAGADO_TOTAL" || order.status === "ENTREGADO";
  const amountCoversTotal = order.totalPrice > 0 && (order.amountPaid || 0) >= order.totalPrice;
  const balanceIsZero = remaining === 0 && (order.amountPaid || 0) > 0;

  return isFullyPaidStatus || amountCoversTotal || balanceIsZero;
}

// ─── Sorteos y Descuentos (Giveaways & Discounts) ──────────────────────────

export type GiveawayPrizeType = "gift_card" | "product" | "discount";
export type GiveawayStatus = "DRAFT" | "ACTIVE" | "ENDED" | "CANCELLED";

export interface Giveaway {
  id: string; // giveawayId
  title: string;
  description: string;
  prizeName: string;
  prizeType: GiveawayPrizeType;
  prizeAmount: number; // e.g. 50 (USD), product value, or % discount
  imageUrl: string;
  maxParticipants: number;
  startAt: string; // ISO string
  endAt: string; // ISO string
  requirements?: string;
  status: GiveawayStatus;
  showOnHomepage: boolean;
  createdAt: string;
  createdBy: string;
  winnerUserId?: string;
  winnerDisplayName?: string;
  winnerPublicName?: string;
  winnerAvatarUrl?: string;
  endedAt?: string;
}

export interface GiveawayEntry {
  entryId: string; // unique combination: `${giveawayId}_${userId}`
  id?: string; // alias to entryId for doc collection indexing
  giveawayId: string;
  userId: string;
  displayName: string;
  userAvatarUrl?: string;
  userEmail?: string; // stored private, NEVER displayed on public winner cards
  createdAt: string;
  status: "VALID" | "CANCELLED";
}

export interface GiveawayWinner {
  id: string; // `winner_${giveawayId}`
  giveawayId: string;
  winnerUserId: string;
  displayName: string;
  publicName: string; // Privacy formatted (e.g. "María G." or "Carlos M.")
  avatarUrl?: string;
  selectedAt: string;
  prizeType: GiveawayPrizeType;
  prizeAmount: number;
  prizeName: string;
  prizeStatus: "PENDING_DELIVERY" | "CLAIMED" | "DELIVERED";
  giftCardId?: string;
  giftCardCode?: string;
  notes?: string;
}

export interface StoreDiscount {
  id: string;
  name: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minimumPurchase: number;
  maxUses: number;
  currentUses: number;
  startAt: string; // ISO date string
  endAt: string; // ISO date string
  applicableProducts?: string[]; // Product IDs (empty = all)
  excludedProducts?: string[];
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  showOnHomepage: boolean;
  createdAt: string;
}

/**
 * Formats public winner name strictly adhering to privacy requirements:
 * Shows public first name + initial of last name if available (e.g. "María G.").
 * Never reveals email, phone, address, or userId.
 */
export function formatPublicWinnerName(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return "Cliente Ganador/a";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}
