import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  Flower2,
  Package,
  Crown,
  Heart,
  Calendar,
  Users,
  Gift,
  MessageSquareText,
  Bell,
  User as UserIcon,
  LogOut,
  ShoppingBag,
  CreditCard,
  ImageIcon,
  Settings,
  TrendingUp,
  MessageCircle,
  Eye,
  ArrowRight,
  ExternalLink,
  Store,
  ChevronRight,
  Check,
  ShieldCheck,
  Loader2,
  Clock,
  Camera,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { AdminSection, MiMonceTab } from "../types";
import { StoryImageModal } from "./StoryImageModal";

export interface SideDrawerNavProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: (mode?: "login" | "register") => void;
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
}

export const SideDrawerNav: React.FC<SideDrawerNavProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  onOpenCart,
  onOpenWishlist,
}) => {
  const {
    activeTab,
    setActiveTab,
    customRequestType,
    setCustomRequestType,
    adminSection,
    setAdminSection,
    customerAccountTab,
    setCustomerAccountTab,
    currentUser,
    isAdmin,
    logout,
    orders,
    customRequests,
    chatConversations,
    unreadCount,
    cart,
    wishlist,
    coupons,
    siteSettings,
    isSyncing,
    isMaintenanceActive,
    toggleMaintenanceMode,
    getCustomerLoyaltyProgress,
  } = useApp();

  const [mounted, setMounted] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Determine current area context
  const currentArea: "admin" | "account" | "public" = useMemo(() => {
    if (activeTab === "admin") return "admin";
    if (activeTab === "cuenta") return "account";
    return "public";
  }, [activeTab]);

  // Public store links
  const publicNavLinks = [
    { id: "inicio", label: "Inicio", icon: Flower2 },
    { id: "productos", label: "Catálogo de Ramos", icon: Package },
    { id: "personalizados", label: "Personalizados", icon: Sparkles, highlight: true },
    { id: "tarjetas", label: "Checar Saldo", icon: CreditCard, isGift: true },
    { id: "calendario", label: "Calendario de Cupos", icon: Calendar },
    { id: "galeria", label: "Galería de Ramos", icon: ImageIcon },
    { id: "nosotros", label: "Sobre Nosotros", icon: Store },
    { id: "contacto", label: "Contacto & Taller", icon: MessageCircle },
  ];

  // Client account data calculations
  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(
      (o) =>
        o.customerId === currentUser.id ||
        (o.customerEmail && o.customerEmail.toLowerCase() === currentUser.email.toLowerCase()),
    );
  }, [orders, currentUser]);

  const activeOrdersCount = useMemo(() => {
    return userOrders.filter((o) => o.status !== "ENTREGADO" && o.status !== "CANCELADO").length;
  }, [userOrders]);

  const loyaltyProgress = useMemo(() => {
    if (!currentUser) return null;
    return getCustomerLoyaltyProgress(currentUser.id, currentUser.email);
  }, [currentUser, getCustomerLoyaltyProgress]);

  const availableCouponsCount = useMemo(() => {
    if (!currentUser) return 0;
    const tierId = loyaltyProgress?.currentTier?.id;
    return (coupons || []).filter((c) => {
      if (c.status !== "ACTIVE") return false;
      if (c.expirationDate && new Date(c.expirationDate) < new Date()) return false;
      if (c.restrictedToTierId && c.restrictedToTierId !== "ALL") {
        return c.restrictedToTierId === tierId;
      }
      return true;
    }).length;
  }, [coupons, currentUser, loyaltyProgress]);

  // Account menu options
  const accountNavItems: {
    id: MiMonceTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: "inicio",
      label: "Resumen General",
      description: "Tus pedidos y nivel VIP",
      icon: Sparkles,
    },
    {
      id: "pedidos",
      label: "Mis Pedidos & Recibos",
      description: "Seguimiento en vivo y recibos oficiales",
      icon: Package,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: "bg-rose-600 text-white",
    },
    {
      id: "lealtad",
      label: "Club de Lealtad VIP",
      description: `${loyaltyProgress?.availablePoints ?? 0} pts disponibles`,
      icon: Crown,
    },
    {
      id: "favoritos",
      label: "Ramos Favoritos",
      description: "Modelos que has guardado",
      icon: Heart,
      badge: wishlist.length > 0 ? wishlist.length : undefined,
      badgeColor: "bg-rose-100 text-rose-700",
    },
    {
      id: "fechas",
      label: "Fechas Especiales",
      description: "Aniversarios y recordatorios",
      icon: Calendar,
    },
    {
      id: "beneficios",
      label: "Cupones & Beneficios",
      description: "Descuentos exclusivos",
      icon: Gift,
      badge: availableCouponsCount > 0 ? availableCouponsCount : undefined,
      badgeColor: "bg-amber-100 text-amber-900",
    },
    {
      id: "mensajes",
      label: "Mensajes con Monce",
      description: "Conversación directa del taller",
      icon: MessageSquareText,
    },
    {
      id: "notificaciones",
      label: "Avisos & Alertas",
      description: "Notificaciones de pedidos",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: "bg-amber-500 text-white",
    },
    {
      id: "cuenta",
      label: "Datos de Cuenta",
      description: "Perfil, teléfono y contraseña",
      icon: UserIcon,
    },
  ];

  // Owner admin data calculations
  const pendingProofCount = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.status === "SOLICITUD_RECIBIDA" ||
          o.status === "COMPROBANTE_EN_REVISION" ||
          o.status === "PAGO_PENDIENTE_VERIFICACION") &&
        (o.paymentProofUrl || o.paymentProof),
    ).length;
  }, [orders]);

  const pendingRequestsCount = useMemo(() => {
    return customRequests.filter(
      (r) =>
        r.status === "SOLICITUD_RECIBIDA" ||
        r.status === "EN_REVISION" ||
        r.status === "ESPERANDO_INFORMACION",
    ).length;
  }, [customRequests]);

  const unreadChatsCount = useMemo(() => {
    return chatConversations.reduce((sum, c) => sum + (c.unreadByAdmin || 0), 0);
  }, [chatConversations]);

  // Owner admin sections
  const ownerNavSections: {
    id: AdminSection;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: "stats",
      label: "Estadísticas & Finanzas",
      description: "Balance, ventas e ingresos del taller",
      icon: TrendingUp,
    },
    {
      id: "orders",
      label: "Gestión de Pedidos",
      description: "Comprobantes de anticipo y entregas",
      icon: Package,
      badge: pendingProofCount > 0 ? pendingProofCount : undefined,
      badgeColor: "bg-rose-600 text-white",
    },
    {
      id: "requests",
      label: "Cotizaciones a Medida",
      description: "Solicitudes personalizadas",
      icon: Sparkles,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
      badgeColor: "bg-purple-600 text-white",
    },
    {
      id: "chats",
      label: "Mensajes & Chat en Vivo",
      description: "Atención a clientes por taller",
      icon: MessageCircle,
      badge: unreadChatsCount > 0 ? unreadChatsCount : undefined,
      badgeColor: "bg-rose-500 text-white",
    },
    {
      id: "giftcards",
      label: "Tarjetas de Regalo",
      description: "Emisión y saldos en USD",
      icon: Gift,
    },
    {
      id: "loyalty",
      label: "Club de Lealtad VIP",
      description: "Niveles, puntos y miembros",
      icon: Crown,
    },
    {
      id: "products",
      label: "Catálogo de Ramos",
      description: "Ramos eternos, precios y stock",
      icon: Flower2,
    },
    {
      id: "calendar",
      label: "Capacidad & Agenda",
      description: "Límites diarios y fechas bloqueadas",
      icon: Calendar,
    },
    {
      id: "gallery",
      label: "Galería de Trabajos",
      description: "Fotografías de ramos entregados",
      icon: ImageIcon,
    },
    {
      id: "settings",
      label: "Ajustes del Taller",
      description: "Horarios, WhatsApp y datos",
      icon: Settings,
    },
  ];

  // Handlers
  const handleSelectPublicTab = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectAccountTab = (tabId: MiMonceTab) => {
    setActiveTab("cuenta");
    setCustomerAccountTab(tabId);
    onClose();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectOwnerSection = (section: AdminSection) => {
    setActiveTab("admin");
    setAdminSection(section);
    onClose();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSwitchToPublicStore = () => {
    setActiveTab("inicio");
    onClose();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSwitchToAccount = () => {
    setActiveTab("cuenta");
    setCustomerAccountTab("inicio");
    onClose();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSwitchToAdmin = () => {
    setActiveTab("admin");
    onClose();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] overflow-hidden select-none">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs cursor-pointer z-0"
            aria-hidden="true"
          />

          {/* Off-Canvas Side Drawer (Slides in laterally from the right) */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10 pointer-events-none z-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`pointer-events-auto w-screen max-w-md flex flex-col h-full shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden ${
                currentArea === "admin"
                  ? "bg-stone-950 text-stone-100 border-l border-amber-500/25"
                  : "bg-white text-stone-900 border-l border-rose-100"
              }`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="side-drawer-nav-title"
            >
              {/* Top Drawer Header with Contextual Branding */}
              <div
                className={`px-5 py-4 border-b flex items-center justify-between gap-3 shrink-0 ${
                  currentArea === "admin"
                    ? "border-stone-800/90 bg-stone-900/90"
                    : "border-rose-100/90 bg-rose-50/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {currentArea === "admin" ? (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600/30 to-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(245,158,11,0.25)]">
                      <Crown className="w-5 h-5" />
                    </div>
                  ) : currentArea === "account" ? (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-[0_4px_12px_rgba(225,29,72,0.25)]">
                      {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "M"}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-100 via-rose-50 to-pink-100 border border-rose-200/90 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                      <Flower2 className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2
                        id="side-drawer-nav-title"
                        className="font-serif font-bold text-sm sm:text-base tracking-tight truncate leading-tight"
                      >
                        {currentArea === "admin"
                          ? "Panel de la Dueña"
                          : currentArea === "account"
                            ? "Mi Monce"
                            : siteSettings.businessName}
                      </h2>
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md shrink-0 ${
                          currentArea === "admin"
                            ? "bg-amber-400 text-stone-950"
                            : currentArea === "account"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {currentArea === "admin"
                          ? "Dueña"
                          : currentArea === "account"
                            ? "Cliente"
                            : "Tienda"}
                      </span>
                    </div>

                    <p
                      className={`text-[11px] truncate mt-0.5 ${
                        currentArea === "admin" ? "text-amber-200/70" : "text-stone-500"
                      }`}
                    >
                      {currentArea === "admin"
                        ? "Administración & Taller Privado"
                        : currentArea === "account"
                          ? currentUser?.name || "Tu cuenta de ramos eternos"
                          : "Ramos Artesanales de Listón Satinado"}
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onClose}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    currentArea === "admin"
                      ? "text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800"
                      : "text-stone-500 hover:text-rose-700 hover:bg-rose-100/60 border border-stone-200/80"
                  }`}
                  aria-label="Cerrar menú lateral"
                  title="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Scrollable Contextual Navigation Body */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin">
                {/* ---------------------------------------------------- */}
                {/* 1. OWNER ADMIN MENU CONTEXT */}
                {/* ---------------------------------------------------- */}
                {currentArea === "admin" && (
                  <div className="space-y-4">
                    {/* Live Workshop Bar: Sync & Maintenance Quick Toggle */}
                    <div className="p-3 rounded-2xl bg-stone-900/90 border border-stone-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-stone-300">
                        {isSyncing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                            <span className="text-[11px] text-amber-300">Sincronizando...</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            <span className="text-[11px] text-stone-400">Nube Activa</span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleMaintenanceMode()}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isMaintenanceActive
                            ? "bg-amber-950/80 border-amber-500 text-amber-300"
                            : "bg-stone-800 border-stone-700 text-emerald-400 hover:bg-stone-750"
                        }`}
                        title="Alternar estado de apertura de la tienda"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isMaintenanceActive ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                          }`}
                        />
                        <span>{isMaintenanceActive ? "Mantenimiento" : "Tienda Abierta"}</span>
                      </button>
                    </div>

                    {/* Quick Action: Cambiar Foto de Historia */}
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">Foto de Historia</p>
                          <p className="text-[10px] text-amber-200/70 truncate">
                            Hecho con pasión por Monse
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStoryModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shrink-0 transition-colors shadow-xs cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>

                    {/* Section Label */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400/80">
                        Secciones de Administración
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium">10 Módulos</span>
                    </div>

                    {/* Owner Nav Items List */}
                    <div className="space-y-1">
                      {ownerNavSections.map((item) => {
                        const Icon = item.icon;
                        const isActive = adminSection === item.id;
                        return (
                          <motion.button
                            key={item.id}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => handleSelectOwnerSection(item.id)}
                            className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer ${
                              isActive
                                ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-stone-950 font-bold shadow-[0_4px_16px_rgba(245,158,11,0.35)]"
                                : "bg-stone-900/60 text-stone-200 hover:text-white hover:bg-stone-900 border border-stone-800/80 hover:border-amber-500/30"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isActive
                                    ? "bg-stone-950 text-amber-400"
                                    : "bg-stone-800 text-amber-400"
                                }`}
                              >
                                <Icon className="w-4.5 h-4.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold truncate leading-tight">
                                  {item.label}
                                </p>
                                <p
                                  className={`text-[10px] truncate mt-0.5 ${
                                    isActive ? "text-stone-900/80" : "text-stone-400"
                                  }`}
                                >
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.badge !== undefined && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs ${
                                    isActive
                                      ? "bg-stone-950 text-amber-400"
                                      : item.badgeColor || "bg-rose-600 text-white"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                              <ChevronRight
                                className={`w-4 h-4 transition-transform ${
                                  isActive ? "text-stone-950" : "text-stone-500"
                                }`}
                              />
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Switch to Public View & Logout */}
                    <div className="pt-3 border-t border-stone-800/90 space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleSwitchToPublicStore}
                        className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(225,29,72,0.3)] transition-all cursor-pointer select-none"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver Tienda Pública (Modo Cliente)</span>
                      </motion.button>

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          handleSwitchToPublicStore();
                        }}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-stone-900 border border-stone-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión de Dueña</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* 2. CUSTOMER ACCOUNT MENU CONTEXT (MI MONCE) */}
                {/* ---------------------------------------------------- */}
                {currentArea === "account" && (
                  <div className="space-y-4">
                    {/* User VIP Profile Header Card */}
                    {currentUser && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50/50 to-white border border-rose-200/80 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-stone-900">{currentUser.name}</p>
                            <p className="text-[11px] text-stone-500 truncate max-w-[220px]">
                              {currentUser.email}
                            </p>
                          </div>
                          <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                            <Crown className="w-3 h-3 text-amber-300" />
                            <span>{loyaltyProgress?.currentTier?.name || "Nivel Rosa"}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-rose-100 flex items-center justify-between text-xs">
                          <span className="text-stone-600 font-medium">Puntos Acumulados:</span>
                          <span className="font-extrabold text-rose-700">
                            {loyaltyProgress?.availablePoints ?? 0} pts
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Section Label */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                        Opciones de Tu Cuenta
                      </span>
                      <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                        Mi Monce
                      </span>
                    </div>

                    {/* Account Navigation Options */}
                    <div className="space-y-1">
                      {accountNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = customerAccountTab === item.id;
                        return (
                          <motion.button
                            key={item.id}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => handleSelectAccountTab(item.id)}
                            className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer ${
                              isActive
                                ? "bg-rose-50 text-rose-950 font-bold border border-rose-300 shadow-[0_2px_12px_rgba(244,63,94,0.1)]"
                                : "bg-white text-stone-700 hover:text-stone-950 hover:bg-stone-50 border border-stone-100"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isActive
                                    ? "bg-rose-700 text-white shadow-xs"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                <Icon className="w-4.5 h-4.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold truncate leading-tight">
                                  {item.label}
                                </p>
                                <p className="text-[10px] text-stone-500 truncate mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.badge !== undefined && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs ${
                                    item.badgeColor || "bg-rose-600 text-white"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                              <ChevronRight
                                className={`w-4 h-4 transition-transform ${
                                  isActive ? "text-rose-700" : "text-stone-400"
                                }`}
                              />
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Switch to Public Store & Logout */}
                    <div className="pt-3 border-t border-stone-100 space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleSwitchToPublicStore}
                        className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <Store className="w-4 h-4" />
                        <span>Volver a la Tienda Pública</span>
                      </motion.button>

                      {isAdmin && (
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={handleSwitchToAdmin}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                        >
                          <Crown className="w-4 h-4" />
                          <span>Ir al Panel de la Dueña</span>
                        </motion.button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          handleSwitchToPublicStore();
                        }}
                        className="w-full py-2 text-xs text-rose-700 font-semibold hover:underline flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* 3. PUBLIC SHOP MENU CONTEXT */}
                {/* ---------------------------------------------------- */}
                {currentArea === "public" && (
                  <div className="space-y-4">
                    {/* Section Label */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                        Navegación del Taller
                      </span>
                      <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                        Ramos Eternos
                      </span>
                    </div>

                    {/* Public Nav Links */}
                    <div className="space-y-1">
                      {publicNavLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = activeTab === link.id;



                        return (
                          <motion.button
                            key={link.id}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => handleSelectPublicTab(link.id)}
                            className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer ${
                              isActive
                                ? "bg-rose-50 text-rose-950 font-bold border border-rose-300 shadow-[0_2px_12px_rgba(244,63,94,0.1)]"
                                : "bg-white text-stone-700 hover:text-stone-950 hover:bg-stone-50 border border-stone-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isActive
                                    ? "bg-rose-700 text-white shadow-xs"
                                    : "bg-stone-100 text-stone-600"
                                }`}
                              >
                                <Icon className="w-4.5 h-4.5" />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs sm:text-sm font-semibold">
                                  {link.label}
                                </span>
                                {link.highlight && (
                                  <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full">
                                    Nuevo
                                  </span>
                                )}
                                {link.isGift && (
                                  <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full">
                                    Saldo USD
                                  </span>
                                )}
                              </div>
                            </div>

                            {isActive ? (
                              <Check className="w-4 h-4 text-rose-700 stroke-[2.5]" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-stone-400" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Quick Access to Cart & Wishlist */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenCart) onOpenCart();
                        }}
                        className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                          <ShoppingBag className="w-4 h-4 text-rose-600" />
                          <span>Carrito</span>
                        </div>
                        {cart.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                            {cart.reduce((sum, item) => sum + item.quantity, 0)}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenWishlist) onOpenWishlist();
                        }}
                        className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                          <Heart className="w-4 h-4 text-rose-600" />
                          <span>Favoritos</span>
                        </div>
                        {wishlist.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                            {wishlist.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Account Section / Actions */}
                    <div className="pt-3 border-t border-stone-100 space-y-2">
                      {currentUser ? (
                        <div className="space-y-2">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={handleSwitchToAccount}
                            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-rose-50 hover:bg-rose-100/80 text-rose-900 border border-rose-200 flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-rose-700" />
                              <span>Ir a Mi Monce (Tu Cuenta)</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-rose-600" />
                          </motion.button>

                          {isAdmin && (
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={handleSwitchToAdmin}
                              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 flex items-center justify-between shadow-[0_2px_12px_rgba(245,158,11,0.25)] cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4 text-stone-950" />
                                <span>Panel Dueña / Administradora</span>
                              </div>
                              <span className="text-[10px] bg-stone-950 text-amber-400 font-extrabold px-2 py-0.5 rounded-full">
                                Admin
                              </span>
                            </motion.button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              logout();
                              onClose();
                            }}
                            className="w-full py-2 text-xs text-stone-500 hover:text-rose-700 font-medium cursor-pointer transition-colors"
                          >
                            Cerrar sesión ({currentUser.name.split(" ")[0]})
                          </button>
                        </div>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onOpenAuth) onOpenAuth("login");
                          }}
                          className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white shadow-[0_4px_14px_rgba(225,29,72,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                        >
                          <UserIcon className="w-4 h-4" />
                          <span>Iniciar Sesión / Registrarse</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Footer Note inside Drawer */}
              <div
                className={`px-5 py-3 border-t text-center text-[10px] shrink-0 ${
                  currentArea === "admin"
                    ? "border-stone-800/80 bg-stone-900/60 text-stone-500"
                    : "border-stone-100 bg-stone-50/70 text-stone-400"
                }`}
              >
                <span>{siteSettings.businessName} • San Pedro Sula & Envíos</span>
              </div>
            </motion.div>
          </div>

          {/* Story Image Modal */}
          <StoryImageModal isOpen={storyModalOpen} onClose={() => setStoryModalOpen(false)} />
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
