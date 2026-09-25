import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  ShoppingBag,
  Bell,
  User as UserIcon,
  Menu,
  X,
  Sparkles,
  Calendar,
  ShieldCheck,
  LogOut,
  Check,
  CreditCard,
  ChevronDown,
  PhoneCall,
  Crown,
  Flower2,
  Package,
  Gift,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { SideDrawerNav } from "./SideDrawerNav";
import { MiMonceTab } from "../types";

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenCart, onOpenWishlist }) => {
  const {
    currentUser,
    isAdmin,
    logout,
    activeTab,
    setActiveTab,
    customRequestType,
    setCustomRequestType,
    customerAccountTab,
    setCustomerAccountTab,
    unreadCount,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    cart,
    wishlist,
    siteSettings,
    cartBounceKey,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { id: "inicio", label: "Inicio" },
    { id: "productos", label: "Productos" },
    { id: "personalizados", label: "Personalizados", highlight: true },
    { id: "tarjetas", label: "Checar Saldo", isGift: true },
    { id: "calendario", label: "Calendario" },
    { id: "galeria", label: "Galería" },
    { id: "nosotros", label: "Sobre nosotros" },
    { id: "contacto", label: "Contacto" },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setNotificationsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-rose-100/80 shadow-[0_4px_24px_-6px_rgba(244,63,94,0.07)] transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16">
          {/* Brand Logo with delicate artisan flair */}
          <motion.div
            onClick={() => handleNavClick("inicio")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="cursor-pointer flex items-center gap-2.5 group select-none"
          >
            <div className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl bg-gradient-to-tr from-rose-100 via-rose-50 to-pink-100 border border-rose-200/90 flex items-center justify-center text-rose-600 shadow-[0_2px_8px_rgba(244,63,94,0.12)] group-hover:shadow-[0_4px_14px_rgba(244,63,94,0.22)] transition-all shrink-0">
              <Flower2 className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-rose-600 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div>
              <span
                suppressHydrationWarning
                className="font-serif text-base sm:text-xl font-bold tracking-tight text-stone-900 group-hover:text-rose-700 transition-colors leading-none block"
              >
                {siteSettings.businessName}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-medium hidden sm:block">
                Ramos de Listón Satinado
              </span>
            </div>
          </motion.div>

          {/* Desktop Navigation Links with Animated Layout Pill */}
          <nav className="hidden lg:flex items-center p-1 bg-stone-100/60 backdrop-blur-md rounded-2xl border border-rose-100/60">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;

              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer z-10 select-none ${
                    isActive
                      ? "text-rose-900 font-semibold"
                      : "text-stone-600 hover:text-stone-950 hover:bg-white/40"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktop-navbar-active-indicator"
                      className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(244,63,94,0.08)] border border-rose-200/70 -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  {link.highlight && (
                    <Sparkles
                      className={`w-3 h-3 ${isActive ? "text-rose-600" : "text-rose-400"}`}
                    />
                  )}
                  {link.isGift && (
                    <CreditCard
                      className={`w-3 h-3 ${isActive ? "text-rose-600" : "text-rose-400"}`}
                    />
                  )}
                  <span>{link.label}</span>
                  {link.isGift && (
                    <span className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full">
                      Saldo
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Wishlist Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              whileHover={{ y: -1.5, scale: 1.04 }}
              onClick={onOpenWishlist}
              className="p-2 text-stone-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl relative transition-all min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer border border-transparent hover:border-rose-200/60"
              title="Lista de deseos"
              aria-label="Lista de deseos"
            >
              <Heart
                className={`w-4.5 h-4.5 transition-colors ${wishlist.length > 0 ? "text-rose-600 fill-rose-100" : ""}`}
              />
              <AnimatePresence>
                {wishlist.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs"
                  >
                    {wishlist.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Cart Button with springy bounce when adding items */}
            <motion.button
              key={cartBounceKey}
              animate={cartBounceKey > 0 ? { scale: [1, 1.25, 0.95, 1.05, 1] } : {}}
              transition={{ duration: 0.4, ease: "easeOut" }}
              whileTap={{ scale: 0.92 }}
              whileHover={{ y: -1.5, scale: 1.04 }}
              onClick={onOpenCart}
              className="p-2 text-stone-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl relative transition-all min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer border border-transparent hover:border-rose-200/60"
              title="Carrito de compras"
              aria-label="Carrito"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              <AnimatePresence>
                {cartItemsCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-[0_2px_6px_rgba(225,29,72,0.35)]"
                  >
                    {cartItemsCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Notifications Popover */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.92 }}
                whileHover={{ y: -1.5, scale: 1.04 }}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-stone-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl relative transition-all min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer border border-transparent hover:border-rose-200/60"
                title="Notificaciones"
                aria-label="Notificaciones"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs animate-subtle-pulse">
                    {unreadCount}
                  </span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] border border-rose-100 py-3 z-50 origin-top-right overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 pb-2.5 border-b border-stone-100">
                      <span className="font-semibold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-rose-600" />
                        Notificaciones
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer transition-colors"
                        >
                          Marcar todas leídas
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                      {!notifications || notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-stone-400">
                          <Bell className="w-6 h-6 mx-auto mb-2 text-stone-300 opacity-60" />
                          No tienes notificaciones por el momento
                        </div>
                      ) : (
                        (notifications || []).slice(0, 6).map((notif, idx) => (
                          <div
                            key={`${notif.id || "notif"}-${idx}`}
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              if (notif.linkTarget === "pedidos") {
                                setActiveTab("cuenta");
                              } else if (notif.linkTarget?.startsWith("admin")) {
                                setActiveTab("admin");
                              }
                              setNotificationsOpen(false);
                            }}
                            className={`px-4 py-3 hover:bg-rose-50/70 cursor-pointer transition-all ${
                              !notif.read ? "bg-rose-50/40" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-stone-900">
                                {notif.title}
                              </span>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0 mt-1 shadow-xs" />
                              )}
                            </div>
                            <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-stone-400 mt-1.5 block">
                              {new Date(notif.createdAt).toLocaleDateString("es-MX", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Account / User Menu */}
            <div className="relative">
              {currentUser ? (
                <div className="flex items-center gap-1.5">
                  {isAdmin && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ y: -1, scale: 1.02 }}
                      onClick={() => handleNavClick("admin")}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-stone-950 shadow-[0_2px_10px_rgba(245,158,11,0.28)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.38)] transition-all cursor-pointer select-none"
                    >
                      <Crown className="w-3.5 h-3.5 text-stone-950" />
                      <span>Panel Dueña</span>
                    </motion.button>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-rose-50/80 text-stone-700 border border-stone-200/80 hover:border-rose-300 transition-all cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden">
                      {currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        currentUser.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="hidden md:inline text-xs font-semibold text-stone-800 max-w-[90px] truncate">
                      {currentUser.name.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -1, scale: 1.02 }}
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_2px_10px_rgba(225,29,72,0.22)] hover:shadow-[0_4px_14px_rgba(225,29,72,0.32)] text-xs font-semibold select-none"
                  title="Iniciar Sesión o Registrarse"
                  aria-label="Iniciar Sesión"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Entrar</span>
                </motion.button>
              )}

              {/* User Dropdown */}
              <AnimatePresence>
                {userMenuOpen && currentUser && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-60 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] border border-rose-100 py-2.5 z-50 origin-top-right overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-stone-100 bg-rose-50/40 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 overflow-hidden">
                        {currentUser.avatar ? (
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          currentUser.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                        <span
                          className={`inline-flex items-center gap-1 mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            isAdmin
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {isAdmin ? (
                            <>
                              <Crown className="w-3 h-3 text-amber-700" />
                              <span>Dueña / Admin</span>
                            </>
                          ) : (
                            "Cliente Registrado"
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="p-1 space-y-0.5">
                      {isAdmin && (
                        <button
                          onClick={() => {
                            handleNavClick("admin");
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-900 hover:bg-amber-50/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          <span>Panel Administrativo</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          handleNavClick("cuenta");
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-rose-50/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-rose-600" />
                        <span>Mi Cuenta & Perfil</span>
                      </button>

                      <button
                        onClick={() => {
                          handleNavClick("cuenta");
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-rose-50/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4 text-rose-600" />
                        <span>Mis Pedidos & Anticipos</span>
                      </button>
                    </div>

                    <div className="border-t border-stone-100 my-1" />

                    <div className="p-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile / Lateral Drawer Trigger with animated icon */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer border border-stone-200/80"
              aria-label="Abrir menú"
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
                    <X className="w-5 h-5" />
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

      {/* Lateral Side Drawer Navigation (Slides from the side, context-aware) */}
      <SideDrawerNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenAuth={() => {
          setMobileMenuOpen(false);
          onOpenAuth();
        }}
        onOpenCart={() => {
          setMobileMenuOpen(false);
          onOpenCart();
        }}
        onOpenWishlist={() => {
          setMobileMenuOpen(false);
          onOpenWishlist();
        }}
      />
    </header>
  );
};
