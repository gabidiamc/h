import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { AdminSection } from "../types";
import {
  Crown,
  TrendingUp,
  Package,
  Sparkles,
  MessageCircle,
  Gift,
  Calendar,
  ImageIcon,
  Settings,
  Eye,
  LogOut,
  Bell,
  Menu,
  X,
  Cloud,
  Loader2,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SideDrawerNav } from "./SideDrawerNav";
import { StoryImageModal } from "./StoryImageModal";

export const OwnerNavbar: React.FC = () => {
  const {
    currentUser,
    logout,
    setActiveTab,
    adminSection,
    setAdminSection,
    orders,
    customRequests,
    chatConversations,
    isMaintenanceActive,
    toggleMaintenanceMode,
    unreadCount,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    isSyncing,
    siteSettings,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);

  // Badge counts
  const pendingProofCount = orders.filter(
    (o) =>
      (o.status === "SOLICITUD_RECIBIDA" ||
        o.status === "COMPROBANTE_EN_REVISION" ||
        o.status === "PAGO_PENDIENTE_VERIFICACION") &&
      (o.paymentProofUrl || o.paymentProof),
  ).length;

  const pendingRequestsCount = customRequests.filter(
    (r) =>
      r.status === "SOLICITUD_RECIBIDA" ||
      r.status === "EN_REVISION" ||
      r.status === "ESPERANDO_INFORMACION",
  ).length;

  const unreadChatsCount = chatConversations.reduce((sum, c) => sum + (c.unreadByAdmin || 0), 0);

  const adminNavSections: {
    id: AdminSection;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badgeCount?: number;
    badgeColor?: string;
  }[] = [
    {
      id: "stats",
      label: "Estadísticas",
      shortLabel: "Stats",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: "orders",
      label: "Pedidos",
      shortLabel: "Pedidos",
      icon: <Package className="w-4 h-4" />,
      badgeCount: pendingProofCount,
      badgeColor: "bg-rose-500",
    },
    {
      id: "requests",
      label: "Cotizaciones",
      shortLabel: "Cotizaciones",
      icon: <Sparkles className="w-4 h-4" />,
      badgeCount: pendingRequestsCount,
      badgeColor: "bg-purple-500",
    },
    {
      id: "chats",
      label: "Mensajes & Chat",
      shortLabel: "Chat",
      icon: <MessageCircle className="w-4 h-4" />,
      badgeCount: unreadChatsCount,
      badgeColor: "bg-rose-500",
    },
    {
      id: "giftcards",
      label: "Tarjetas de Regalo",
      shortLabel: "Tarjetas USD",
      icon: <Gift className="w-4 h-4 text-rose-400" />,
    },
    {
      id: "giveaways",
      label: "Sorteos & Descuentos",
      shortLabel: "Sorteos",
      icon: <Sparkles className="w-4 h-4 text-rose-400" />,
    },
    {
      id: "loyalty",
      label: "Club Lealtad",
      shortLabel: "Lealtad",
      icon: <Crown className="w-4 h-4 text-amber-400" />,
    },
    {
      id: "products",
      label: "Catálogo de Ramos",
      shortLabel: "Catálogo",
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: "calendar",
      label: "Capacidad & Fechas",
      shortLabel: "Agenda",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: "gallery",
      label: "Galería",
      shortLabel: "Galería",
      icon: <ImageIcon className="w-4 h-4" />,
    },
    {
      id: "settings",
      label: "Ajustes de Tienda",
      shortLabel: "Ajustes",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleSelectSection = (section: AdminSection) => {
    setAdminSection(section);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoToPublicStore = () => {
    setActiveTab("inicio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 bg-stone-950/95 backdrop-blur-xl text-stone-100 border-b border-amber-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-15 sm:h-16 gap-2">
          {/* Brand & Mode Identification */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600/30 to-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Crown className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-black text-sm sm:text-base tracking-tight text-white leading-none">
                  Monse
                </span>
                <span className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 shadow-xs">
                  Dueña
                </span>
              </div>
              <p className="text-[10px] text-amber-200/60 mt-0.5 hidden sm:flex items-center gap-1">
                <span suppressHydrationWarning>{siteSettings.businessName}</span>
                <span>•</span>
                <span className="text-stone-400">Taller Privado</span>
              </p>
            </div>
          </div>

          {/* Section Quick Selector Trigger (Mobile & Tablet: only dropdown menu) */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-stone-900 border border-amber-500/40 text-amber-300 hover:text-white shadow-[0_2px_12px_rgba(245,158,11,0.18)] transition-all cursor-pointer select-none"
            title="Abrir menú desplegable de secciones"
          >
            <span className="text-amber-400 shrink-0">
              {adminNavSections.find((s) => s.id === adminSection)?.icon}
            </span>
            <span className="font-serif font-bold text-xs sm:text-sm text-stone-100 max-w-[100px] sm:max-w-[180px] truncate">
              {adminNavSections.find((s) => s.id === adminSection)?.shortLabel ||
                adminNavSections.find((s) => s.id === adminSection)?.label ||
                "Sección"}
            </span>
            {(() => {
              const currentSec = adminNavSections.find((s) => s.id === adminSection);
              if (currentSec?.badgeCount && currentSec.badgeCount > 0) {
                return (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-600 text-white shadow-xs">
                    {currentSec.badgeCount}
                  </span>
                );
              }
              return null;
            })()}
            <ChevronDown
              className={`w-3.5 h-3.5 text-amber-400 transition-transform duration-250 shrink-0 ${mobileMenuOpen ? "rotate-180" : ""}`}
            />
          </motion.button>

          {/* Desktop Owner Section Links with sliding layout pill */}
          <nav className="hidden xl:flex items-center space-x-1 p-1 bg-stone-900/80 rounded-2xl border border-stone-800">
            {adminNavSections.map((section) => {
              const isActive = adminSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSelectSection(section.id)}
                  className={`relative px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer select-none z-10 ${
                    isActive
                      ? "text-stone-950 font-bold"
                      : "text-stone-300 hover:text-white hover:bg-stone-800/60"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="owner-navbar-active-indicator"
                      className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 rounded-xl shadow-[0_2px_12px_rgba(245,158,11,0.4)] -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  {section.icon}
                  <span>{section.shortLabel}</span>

                  {/* Pending alert badge */}
                  {section.badgeCount !== undefined && section.badgeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white shadow-xs ${
                        isActive
                          ? "bg-stone-900 text-amber-300"
                          : section.badgeColor || "bg-rose-600"
                      }`}
                    >
                      {section.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Sync status, Maintenance, Notifications, Public Store, Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Cloud Firestore Live Status */}
            <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-900/80 border border-stone-800 text-[10px] text-stone-300">
              {isSyncing ? (
                <>
                  <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                  <span className="text-amber-300">Sincronizando...</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-stone-400">En la nube</span>
                </>
              )}
            </div>

            {/* Maintenance Mode Quick Indicator */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.03 }}
              type="button"
              onClick={() => toggleMaintenanceMode()}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
                isMaintenanceActive
                  ? "bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  : "bg-stone-900/90 border-stone-800 text-stone-300 hover:border-stone-700"
              }`}
              title={
                isMaintenanceActive
                  ? "Tienda en mantenimiento (clic para abrir)"
                  : "Tienda abierta al público (clic para activar mantenimiento)"
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${isMaintenanceActive ? "bg-amber-400 animate-pulse" : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"}`}
              />
              <span className="text-[11px]">
                {isMaintenanceActive ? "Mantenimiento" : "Tienda Abierta"}
              </span>
            </motion.button>

            {/* Quick Action: Cambiar Foto de Historia */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.03 }}
              type="button"
              onClick={() => setStoryModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/50 text-amber-300 hover:text-white hover:border-amber-400 transition-all cursor-pointer select-none shadow-[0_0_10px_rgba(245,158,11,0.15)]"
              title="Cambiar la imagen de 'Hecho con pasión por Monse'"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-xs whitespace-nowrap">Foto Historia</span>
            </motion.button>

            {/* Notification Popover */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.92 }}
                whileHover={{ y: -1, scale: 1.04 }}
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-stone-300 hover:text-white hover:bg-stone-900 rounded-xl relative transition-all cursor-pointer border border-transparent hover:border-stone-800"
                title="Notificaciones de la tienda"
                aria-label="Notificaciones"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs animate-subtle-pulse">
                    {unreadCount}
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-80 sm:w-96 bg-stone-900/95 backdrop-blur-2xl rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] border border-stone-800 py-3 z-50 text-stone-200 origin-top-right overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 pb-2.5 border-b border-stone-800">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5 uppercase tracking-wider">
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
                        Alertas de Tienda
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer transition-colors"
                        >
                          Marcar leídas
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-stone-800 text-xs">
                      {!notifications || notifications.length === 0 ? (
                        <div className="py-8 text-center text-stone-500">
                          <Bell className="w-6 h-6 mx-auto mb-2 text-stone-600" />
                          Sin alertas pendientes
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((notif, idx) => (
                          <div
                            key={`${notif.id || "notif"}-${idx}`}
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              if (notif.linkTarget?.includes("order")) {
                                setAdminSection("orders");
                              } else if (notif.linkTarget?.includes("chat")) {
                                setAdminSection("chats");
                              }
                              setNotificationsOpen(false);
                            }}
                            className={`px-4 py-3 hover:bg-stone-800/80 cursor-pointer transition-colors ${
                              !notif.read ? "bg-amber-950/30" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-white">{notif.title}</span>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                              )}
                            </div>
                            <p className="text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SWITCH: View Public Store as Customer */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -1, scale: 1.02 }}
              type="button"
              onClick={handleGoToPublicStore}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white shadow-[0_2px_10px_rgba(225,29,72,0.3)] transition-all cursor-pointer select-none"
              title="Ir a la tienda y catálogo público"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Tienda</span>
              <ExternalLink className="w-3 h-3 text-rose-200 hidden sm:inline" />
            </motion.button>

            {/* Logout button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              type="button"
              onClick={() => {
                logout();
                setActiveTab("inicio");
              }}
              className="p-2 text-stone-400 hover:text-rose-400 hover:bg-stone-900 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-stone-800"
              title="Cerrar sesión de dueña"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4.5 h-4.5" />
            </motion.button>

            {/* Menu Toggle Button for Lateral Drawer */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-300 hover:text-amber-300 hover:bg-stone-900 rounded-xl transition-all cursor-pointer border border-stone-800 hover:border-amber-500/40 shadow-xs"
              aria-label="Abrir menú de secciones"
              title="Abrir menú lateral"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="w-5 h-5 text-amber-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Lateral Side Drawer Navigation for Owner (Slides laterally from the right, context-aware) */}
      <SideDrawerNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Story Image Modal for Owner */}
      <StoryImageModal isOpen={storyModalOpen} onClose={() => setStoryModalOpen(false)} />
    </header>
  );
};
