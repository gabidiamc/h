import {
  Product,
  ImportantDate,
  BlockedDate,
  GalleryItem,
  Review,
  SiteSettings,
  HomepageConfig,
  User,
  ChatConversation,
  GiftCard,
} from "../types";

export const INITIAL_SETTINGS: SiteSettings = {
  businessName: "Hecho Por Monse",
  slogan: "Ramos de Listón Satinado & Detalles Románticos",
  tagline: "Flores eternas que nunca se marchitan, hechas a mano con amor.",
  email: "contacto@hechopormonse.com",
  phone: "+1 (555) 234-5678",
  whatsapp: "+1 (555) 234-5678",
  whatsappWelcomeMessage:
    "¡Hola Monse! Vi tu página de ramos eternos y me gustaría consultar disponibilidad para una fecha especial.",
  instagram: "@hechopormonse",
  tiktok: "@hechopormonse",
  facebook: "facebook.com/hechopormonse",
  pickupAddress: "Taller Hecho por Monse — Los Angeles, CA",
  businessHours: "Lunes a Sábado: 9:00 AM – 7:00 PM (Entregas con cita previa)",
  bankDetails: {
    bankName: "Chase Bank / US Bank Wire",
    accountHolder: "Monse (Hecho Por Monse)",
    accountNumber: "•••• 4567 (Checking)",
    clabeOrKey: "Routing: 071000013",
    instructions:
      "Por favor envía el 50% del total en USD como anticipo para apartar tu fecha e iniciar la confección de tu ramo. Envía tu comprobante desde Mi Cuenta para verificación.",
  },
  paymentMethods: [
    {
      id: "pm-zelle",
      type: "ZELLE",
      title: "Zelle (Recomendado)",
      enabled: true,
      accountIdentifier: "contacto@hechopormonse.com / (555) 234-5678",
      instructions:
        "Envía tu anticipo en dólares ($ USD) por Zelle a contacto@hechopormonse.com o al teléfono (555) 234-5678. Guarda la confirmación y súbela aquí.",
      badge: "Sin Comisión",
    },
    {
      id: "pm-venmo",
      type: "VENMO",
      title: "Venmo",
      enabled: true,
      accountIdentifier: "@hechopormonse",
      paymentUrl: "https://venmo.com/u/hechopormonse",
      instructions:
        "Envía el anticipo en USD a @hechopormonse en Venmo. Agrega en la nota tu número de orden y sube tu comprobante de pago.",
      badge: "Popular en EE.UU.",
    },
    {
      id: "pm-cashapp",
      type: "BANK_TRANSFER",
      title: "Cash App",
      enabled: true,
      accountIdentifier: "$HechoPorMonse",
      instructions:
        "Envía tu anticipo en dólares a $HechoPorMonse en Cash App. Coloca tu número de orden en la nota y adjunta captura de pantalla.",
      badge: "Rápido",
    },
    {
      id: "pm-paypal",
      type: "PAYPAL",
      title: "PayPal",
      enabled: true,
      accountIdentifier: "contacto@hechopormonse.com",
      paymentUrl: "https://paypal.me/hechopormonse",
      instructions:
        "Paga vía PayPal.me o envía el anticipo en USD a contacto@hechopormonse.com. Sube captura del recibo generado.",
      badge: "Pago Seguro",
    },
    {
      id: "pm-applepay",
      type: "BANK_TRANSFER",
      title: "Apple Pay / Wire",
      enabled: true,
      accountIdentifier: "(555) 234-5678",
      instructions:
        "Envía por Apple Cash al (555) 234-5678 o mediante transferencia ACH/Wire a Chase Bank. Adjunta tu recibo para validación.",
    },
  ],
  currencySymbol: "$",
  depositPercentage: 50,
  defaultDailyCapacity: 8,
  pageBackgroundColor: "#FFFDFD",
  pageThemePreset: "blush",
  guaranteeTitle: "Garantía de Calidad & Confección Artesanal",
  guaranteeSubtitle:
    "Cada creación es una joya floral diseñada para emocionar y conservarse impecable a través de los años.",
  guarantees: [
    {
      id: "g-1",
      icon: "HandHeart",
      title: "100% Hecho a Mano",
      description:
        "Pétalo por pétalo. Cada rosa es doblada, planchada y sellada individualmente con paciencia y maestría.",
    },
    {
      id: "g-2",
      icon: "Sparkles",
      title: "Listón Satinado Grado A+",
      description:
        "Brillo sedoso que no se descolora, no atrae polvo ni pierde su firmeza geométrica con el tiempo.",
    },
    {
      id: "g-3",
      icon: "Clock",
      title: "Durabilidad Infinita",
      description:
        "Nunca se marchitan, no requieren agua ni cuidados. El recuerdo de tu aniversario o pedida intacto por años.",
    },
    {
      id: "g-4",
      icon: "ShieldCheck",
      title: "Empaque de Alta Gama",
      description:
        "Papel coreano impermeable importado, coronas de aleación con pedrería fina y tarjeta sellada con dedicatoria.",
    },
  ],
  maintenanceMode: {
    enabled: false,
    title: "Sitio en Mantenimiento Temporal",
    message:
      "Estamos actualizando el catálogo y preparando hermosas novedades para tus fechas especiales. Regresamos en unos momentos.",
    estimatedReturn: "En unos momentos",
    contactWhatsapp: true,
  },
};

export const INITIAL_HOMEPAGE_CONFIG: HomepageConfig = {
  hero: {
    title: "Flores que duran para siempre, amor que nunca se apaga",
    emotionalPhrase:
      "Confeccionamos a mano ramos de listón satinado de alta costura, personalizados con pedrería, mariposas y luces.",
    description:
      "Cada pétalo es doblado cuidadosamente a mano para crear un recuerdo eterno de tu aniversario, propuesta o fecha inolvidable.",
    imageUrl:
      "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1400&q=80",
    backgroundImage:
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1800&q=80",
    backgroundOverlayOpacity: 0.15,
    primaryBtnText: "Explorar Catálogo",
    secondaryBtnText: "Pedir Diseño Personalizado",
  },
  aboutUs: {
    title: "El Arte de las Flores Eternas",
    artisanName: "Monse",
    story:
      "Hecho por Monse nació de la pasión por crear obsequios que trasciendan el tiempo. Mientras las flores naturales duran pocos días, nuestros ramos confeccionados con listón satinado de primera calidad conservan su brillo, forma y elegancia por años intactos. Cada arreglo lleva horas de dedicación manual, corona de pedrería y envoltura coreana de importación.",
    imageUrl:
      "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
  },
  featuredProductIds: [],
  sectionOrder: [
    "hero",
    "dates",
    "featured",
    "process",
    "guarantees",
    "gallery",
    "story",
    "reviews",
  ],
  sectionVisibility: {
    hero: true,
    dates: true,
    featured: true,
    process: true,
    guarantees: true,
    gallery: true,
    story: true,
    reviews: true,
  },
};

// Clean slate: no demo catalog products
export const INITIAL_PRODUCTS: Product[] = [];

// Clean slate: no demo upcoming dates
export const INITIAL_IMPORTANT_DATES: ImportantDate[] = [];

// Clean slate: no demo blocked dates
export const INITIAL_BLOCKED_DATES: BlockedDate[] = [];

// Clean slate: no demo delivery photos
export const INITIAL_GALLERY: GalleryItem[] = [];

// Clean slate: no demo customer reviews
export const INITIAL_REVIEWS: Review[] = [];

export const INITIAL_ADMIN_USER: User = {
  id: "usr-admin-1",
  name: "Monse (Dueña)",
  email: "admin@hechopormonse.com",
  role: "admin",
  phone: "+1 (555) 234-5678",
  address: "Hecho por Monse, Los Angeles, CA",
  createdAt: "2026-01-01T00:00:00Z",
};

export const INITIAL_DEMO_CUSTOMER: User = {
  id: "usr-cust-1",
  name: "Cliente",
  email: "cliente@hechopormonse.com",
  role: "customer",
  phone: "+1 (555) 876-5432",
  address: "",
  createdAt: "2026-01-01T00:00:00Z",
};

// Clean slate: no demo chat messages
export const INITIAL_CHAT_CONVERSATIONS: ChatConversation[] = [];

// Clean slate: no predefined or default gift cards
export const INITIAL_GIFT_CARDS: GiftCard[] = [];

export const INITIAL_LOYALTY_CONFIG: import("../types").LoyaltyProgramConfig = {
  enabled: true,
  pointsPerDollar: 0.5, // $1 USD = 0.50 puntos
  welcomeBonusPoints: 50,
  specialDateBonusMultiplier: 1.5,
  redemptionRatePointsPerUSD: 20, // 20 puntos = $1 USD descuento
  minimumPointsToRedeem: 100,
  maxDiscountPerOrderUSD: 50,
};

export const INITIAL_LOYALTY_TRANSACTIONS: import("../types").LoyaltyTransaction[] = [];

export const INITIAL_LOYALTY_TIERS: import("../types").LoyaltyTier[] = [
  {
    id: "tier-rosa",
    name: "Rosa",
    badge: "🌸",
    description: "Nivel inicial de bienvenida al Club de Lealtad Hecho por Monse.",
    cardTheme: "rose_gold",
    qualificationCriterion: "SPEND_USD",
    requiredPoints: 0,
    minSpendUSD: 0,
    minOrdersCount: 0,
    discountPercentage: 3,
    multiplier: 1.0,
    benefits: [
      "Acumulación de 0.50 puntos por cada $1 USD en compras verificadas",
      "Tarjeta digital de membresía exclusiva de Hecho por Monse",
      "Dedicatoria personalizada con caligrafía artesanal incluida",
      "Empaque protector con listón satinado de cortesía",
    ],
    earlyAccessEvents: false,
    exclusiveBouquetsCatalog: false,
    specialGiftIncluded: false,
    active: true,
    orderIndex: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "tier-plata",
    name: "Plata",
    badge: "✨",
    description:
      "Para clientes distinguidos que celebran momentos inolvidables con flores eternas.",
    cardTheme: "silver_velvet",
    qualificationCriterion: "SPEND_USD",
    requiredPoints: 250,
    minSpendUSD: 500,
    minOrdersCount: 2,
    discountPercentage: 5,
    multiplier: 1.1,
    benefits: [
      "5% de descuento permanente en catálogo general de ramos y cajas",
      "Acceso anticipado para apartar cupos en 14 de Febrero y Día de las Madres",
      "10% de bono extra en puntos acumulados por compras verificadas",
      "Mariposa decorativa 3D de cortesía en cada entrega",
    ],
    earlyAccessEvents: true,
    exclusiveBouquetsCatalog: false,
    specialGiftIncluded: false,
    active: true,
    orderIndex: 2,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "tier-oro",
    name: "Oro",
    badge: "👑",
    description: "Membresía distinguida con privilegios de confección de alta gama.",
    cardTheme: "imperial_gold",
    qualificationCriterion: "SPEND_USD",
    requiredPoints: 750,
    minSpendUSD: 1500,
    minOrdersCount: 4,
    discountPercentage: 10,
    multiplier: 1.25,
    benefits: [
      "10% de descuento permanente en toda la boutique",
      "Corona de aleación con pedrería fina o set de mariposas doradas de regalo",
      "Prioridad garantizada en agenda de taller ante fechas de alta demanda",
      "Atención preferente por WhatsApp directo con el taller",
    ],
    earlyAccessEvents: true,
    exclusiveBouquetsCatalog: true,
    specialGiftIncluded: true,
    active: true,
    orderIndex: 3,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "tier-diamante",
    name: "Diamante",
    badge: "💎",
    description: "Estatus de distinción con confección artesanal personalizada y detalles de lujo.",
    cardTheme: "black_diamond",
    qualificationCriterion: "SPEND_USD",
    requiredPoints: 1750,
    minSpendUSD: 3500,
    minOrdersCount: 7,
    discountPercentage: 15,
    multiplier: 1.5,
    benefits: [
      "15% de descuento ilimitado en todas tus compras",
      "Luces LED cálidas o estuche velvet de lujo de cortesía en cada ramo",
      "Acceso exclusivo a catálogo de Ramos de Gala VIP y papeles importados",
      "Envío local prioritario sin costo adicional",
      "Regalo floral sorpresa conmemorativo en tu mes de cumpleaños",
    ],
    earlyAccessEvents: true,
    exclusiveBouquetsCatalog: true,
    specialGiftIncluded: true,
    active: true,
    orderIndex: 4,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "tier-vip",
    name: "VIP",
    badge: "🌟",
    description: "Distinción de honor para clientes frecuentes con trato de alta costura.",
    cardTheme: "vip_royal",
    qualificationCriterion: "SPEND_USD",
    requiredPoints: 3750,
    minSpendUSD: 7500,
    minOrdersCount: 12,
    discountPercentage: 20,
    multiplier: 1.75,
    benefits: [
      "20% de descuento permanente en cualquier creación floral",
      "Agenda abierta sin restricción de cupo en cualquier fecha del año",
      "Personalización de colores especiales y accesorios sin recargo",
      "Detalle conmemorativo sorpresa de temporada semestral",
      "Empaque de lujo con listón personalizado sellado",
    ],
    earlyAccessEvents: true,
    exclusiveBouquetsCatalog: true,
    specialGiftIncluded: true,
    active: true,
    orderIndex: 5,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "tier-vip-elite",
    name: "VIP Elite",
    badge: "⚜️",
    description: "El máximo nivel artesanal de Hecho por Monse con confección exclusiva por Monse.",
    cardTheme: "vip_elite",
    qualificationCriterion: "SPEND_USD",
    requiredPoints: 7500,
    minSpendUSD: 15000,
    minOrdersCount: 20,
    discountPercentage: 25,
    multiplier: 2.0,
    benefits: [
      "25% de descuento permanente ilimitado en todas tus compras",
      "Diseño 100% personalizado elaborado directamente por la dueña Monse",
      "Línea directa VIP para pedidos urgentes o eventos de gala",
      "Corona de pedrería fina de alta gama incluida en cada entrega",
      "Envío express prioritario garantizado en todas tus órdenes",
      "Invitación a lanzamientos exclusivos y colecciones limitadas",
    ],
    earlyAccessEvents: true,
    exclusiveBouquetsCatalog: true,
    specialGiftIncluded: true,
    active: true,
    orderIndex: 6,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

export const INITIAL_COUPONS: import("../types").DiscountCoupon[] = [];
