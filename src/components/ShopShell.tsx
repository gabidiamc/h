import React, { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useApp } from "../context/AppContext";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { AuthModal } from "./AuthModal";
import { CartDrawer } from "./CartDrawer";
import { WishlistModal } from "./WishlistModal";
import { FloatingToast } from "./FloatingToast";
import { AdminOrderToast } from "./AdminOrderToast";
import { InternalChatDrawer } from "./InternalChatDrawer";
import { FloatingChatWidget } from "./FloatingChatWidget";
import { MaintenanceView } from "./MaintenanceView";
import { AdminMaintenanceBanner } from "./AdminMaintenanceBanner";
import { OwnerNavbar } from "./OwnerNavbar";
import { CustomerLoyaltyModal } from "./CustomerLoyaltyModal";
import { ArrowRight, Crown } from "lucide-react";

import { HomeView } from "../views/HomeView";
import { ProductsView } from "../views/ProductsView";
import { ProductDetailView } from "../views/ProductDetailView";
import { CustomRequestView } from "../views/CustomRequestView";
import { CalendarView } from "../views/CalendarView";
import { GalleryView } from "../views/GalleryView";
import { CustomerAccountView } from "../views/CustomerAccountView";
import { AdminView } from "../views/AdminView";
import { GiftCardsView } from "../views/GiftCardsView";

/** Every section of the shop has its own address. */
export const TAB_PATHS: Record<string, string> = {
  inicio: "/",
  productos: "/productos",
  personalizados: "/personalizados",
  calendario: "/calendario",
  galeria: "/galeria",
  tarjetas: "/tarjetas",
  cuenta: "/cuenta",
  admin: "/panel",
};

export const ShopShell: React.FC<{ tab: string }> = ({ tab }) => {
  const {
    activeTab,
    setActiveTab,
    selectedProductId,
    setSelectedProductId,
    isMaintenanceActive,
    isAdmin,
    previewAsVisitor,
  } = useApp();

  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Keep the in-app section and the browser address in sync.
  useEffect(() => {
    if (activeTab !== tab) setActiveTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    const target = TAB_PATHS[activeTab];
    if (target && pathname !== target) {
      void navigate({ to: target });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "register">("login");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Owner-only chrome depends on the stored session, which only exists in the
  // browser; render it after mount so the first paint matches the server HTML.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const adminUI = isMounted && isAdmin;

  const handleOpenAuth = (mode: "login" | "register" = "login") => {
    setAuthInitialMode(mode);
    setIsAuthOpen(true);
  };

  const showMaintenanceScreen =
    isMounted && isMaintenanceActive && (!isAdmin || previewAsVisitor) && tab !== "admin";

  if (showMaintenanceScreen) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 font-sans selection:bg-rose-500 selection:text-white">
        <MaintenanceView onOpenAuth={() => handleOpenAuth("login")} />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          initialMode={authInitialMode}
        />
        <FloatingToast onOpenCart={() => {}} onOpenWishlist={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-rose-200 selection:text-rose-900">
      {isMounted && <AdminMaintenanceBanner />}

      {tab === "admin" ? (
        <OwnerNavbar />
      ) : (
        <>
          {adminUI && (
            <div className="bg-stone-900 text-stone-200 px-4 py-2 text-xs flex items-center justify-between border-b border-stone-800 sticky top-0 z-50 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo Tienda Pública</span>
                </span>
                <span className="text-stone-400 hidden sm:inline">
                  — Visualizando catálogo y pedidos como cliente
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("admin")}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>Ir al Menú de la Dueña</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <Navbar
            onOpenAuth={() => handleOpenAuth("login")}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenWishlist={() => setIsWishlistOpen(true)}
          />
        </>
      )}

      <main className="flex-1">
        {tab === "inicio" && <HomeView onOpenAuth={() => handleOpenAuth("login")} />}

        {tab === "productos" &&
          (selectedProductId ? (
            <ProductDetailView
              productId={selectedProductId}
              onBack={() => setSelectedProductId(null)}
              onOpenCart={() => setIsCartOpen(true)}
              onOpenAuth={() => handleOpenAuth("login")}
            />
          ) : (
            <ProductsView />
          ))}

        {tab === "personalizados" && (
          <CustomRequestView onOpenAuth={() => handleOpenAuth("login")} />
        )}
        {tab === "calendario" && <CalendarView />}
        {tab === "galeria" && <GalleryView />}
        {tab === "tarjetas" && <GiftCardsView />}
        {tab === "cuenta" && (
          <CustomerAccountView onOpenAuth={(mode) => handleOpenAuth(mode || "login")} />
        )}
        {tab === "admin" && <AdminView />}
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenAuth={() => handleOpenAuth("login")}
      />

      <WishlistModal isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authInitialMode}
      />

      <FloatingToast
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
      />

      <AdminOrderToast />

      {tab !== "admin" && <Footer />}

      <CustomerLoyaltyModal />

      <InternalChatDrawer onOpenAuth={handleOpenAuth} />
      <FloatingChatWidget onOpenAuth={() => handleOpenAuth("login")} />
    </div>
  );
};
