import React, { useState, useMemo } from "react";
import {
  User as UserIcon,
  Package,
  Crown,
  Heart,
  Calendar,
  Gift,
  MessageSquareText,
  Bell,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { MiMonceTab } from "../components/mi-monce/MiMonceTypes";
import { MiMonceSidebar } from "../components/mi-monce/MiMonceSidebar";
import { MiMonceBottomNav } from "../components/mi-monce/MiMonceBottomNav";
import { MiMonceResumen } from "../components/mi-monce/MiMonceResumen";
import { MiMoncePedidos } from "../components/mi-monce/MiMoncePedidos";
import { MiMonceLealtad } from "../components/mi-monce/MiMonceLealtad";
import { MiMonceFavoritos } from "../components/mi-monce/MiMonceFavoritos";
import { MiMonceFechas } from "../components/mi-monce/MiMonceFechas";
import { MiMonceBeneficios } from "../components/mi-monce/MiMonceBeneficios";
import { MiMonceMensajes } from "../components/mi-monce/MiMonceMensajes";
import { MiMonceNotificaciones } from "../components/mi-monce/MiMonceNotificaciones";
import { MiMonceCuenta } from "../components/mi-monce/MiMonceCuenta";

interface CustomerAccountViewProps {
  onOpenAuth: (mode?: "login" | "register") => void;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({ onOpenAuth }) => {
  const {
    currentUser,
    orders,
    wishlist,
    coupons,
    unreadCount,
    setActiveTab,
    customerAccountTab,
    setCustomerAccountTab,
    setSelectedProductId,
    getCustomerLoyaltyProgress,
  } = useApp();

  const activeTab = customerAccountTab;
  const setActiveTabState = setCustomerAccountTab;

  // User orders
  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(
      (o) =>
        o.customerId === currentUser.id ||
        (o.customerEmail && o.customerEmail.toLowerCase() === currentUser.email.toLowerCase()),
    );
  }, [orders, currentUser]);

  // Active orders in workshop
  const activeOrdersCount = useMemo(() => {
    return userOrders.filter((o) => o.status !== "ENTREGADO" && o.status !== "CANCELADO").length;
  }, [userOrders]);

  // Available coupons count
  const availableCouponsCount = useMemo(() => {
    if (!currentUser) return 0;
    const progress = getCustomerLoyaltyProgress(currentUser.id, currentUser.email);
    const tierId = progress.currentTier?.id;
    return (coupons || []).filter((c) => {
      if (c.status !== "ACTIVE") return false;
      if (c.expirationDate && new Date(c.expirationDate) < new Date()) return false;
      if (c.restrictedToTierId && c.restrictedToTierId !== "ALL") {
        return c.restrictedToTierId === tierId;
      }
      return true;
    }).length;
  }, [coupons, currentUser, getCustomerLoyaltyProgress]);

  // Upcoming dates count (in the next 30 days)
  const upcomingDatesCount = useMemo(() => {
    if (!currentUser?.savedDates) return 0;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    return currentUser.savedDates.filter((d) => {
      const currentYear = today.getFullYear();
      let target = d.date;
      const parts = d.date.split("-");
      if (parts.length === 3) {
        target = `${currentYear}-${parts[1]}-${parts[2]}`;
        if (target < todayStr) {
          target = `${currentYear + 1}-${parts[1]}-${parts[2]}`;
        }
      }
      const diffDays = Math.ceil(
        (new Date(target).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24),
      );
      return diffDays >= 0 && diffDays <= 30;
    }).length;
  }, [currentUser]);

  // Auth gate: If not logged in, render the login/register invitation view
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8 animate-in fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">Mi Monce</h2>
          <p className="text-sm text-stone-600 max-w-md mx-auto">
            Tu centro de cliente personal en Hecho por Monce. Consulta tus pedidos de ramos eternos,
            acumula puntos de lealtad, guarda fechas especiales y administra tus beneficios.
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => onOpenAuth("login")}
              className="flex-1 py-3.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserIcon className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth("register")}
              className="flex-1 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-rose-600" />
              <span>Crear Cuenta Nueva</span>
            </button>
          </div>

          {/* Benefits Grid */}
          <div className="pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 text-center space-y-1">
              <Package className="w-5 h-5 text-rose-600 mx-auto" />
              <h4 className="text-xs font-bold text-stone-900">Seguimiento en Vivo</h4>
              <p className="text-[11px] text-stone-500">
                8 etapas de elaboración y entrega de tu ramo.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 text-center space-y-1">
              <Crown className="w-5 h-5 text-amber-500 mx-auto" />
              <h4 className="text-xs font-bold text-stone-900">Club de Lealtad VIP</h4>
              <p className="text-[11px] text-stone-500">$1 USD = 0.50 pts en compras aprobadas.</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 text-center space-y-1">
              <Calendar className="w-5 h-5 text-purple-600 mx-auto" />
              <h4 className="text-xs font-bold text-stone-900">Fechas & Dedicatorias</h4>
              <p className="text-[11px] text-stone-500">Guarda aniversarios y cartas especiales.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24 lg:pb-12">
      {/* Main Layout: Sidebar (Desktop) + Main View Content */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Desktop Sidebar Menu */}
        <MiMonceSidebar
          activeTab={activeTab}
          onTabChange={setActiveTabState}
          activeOrdersCount={activeOrdersCount}
          availableCouponsCount={availableCouponsCount}
          favoritesCount={wishlist.length}
          upcomingDatesCount={upcomingDatesCount}
        />

        {/* Dynamic Content Panel */}
        <main className="flex-1 w-full min-w-0">
          {activeTab === "inicio" && (
            <MiMonceResumen onTabChange={setActiveTabState} userOrders={userOrders} />
          )}

          {activeTab === "pedidos" && <MiMoncePedidos userOrders={userOrders} />}

          {activeTab === "lealtad" && <MiMonceLealtad />}

          {activeTab === "favoritos" && (
            <MiMonceFavoritos
              onSelectProduct={(id) => {
                setSelectedProductId(id);
                setActiveTab("catalogo");
              }}
              onExploreCatalog={() => setActiveTab("catalogo")}
            />
          )}

          {activeTab === "fechas" && (
            <MiMonceFechas
              onOrderForDate={(date, person) => {
                setActiveTab("personalizados");
              }}
            />
          )}

          {activeTab === "beneficios" && <MiMonceBeneficios />}

          {activeTab === "mensajes" && <MiMonceMensajes />}

          {activeTab === "notificaciones" && <MiMonceNotificaciones />}

          {activeTab === "cuenta" && <MiMonceCuenta />}
        </main>
      </div>

      {/* Mobile Bottom Fixed Navigation */}
      <MiMonceBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTabState}
        activeOrdersCount={activeOrdersCount}
        favoritesCount={wishlist.length}
        unreadNotificationsCount={unreadCount}
      />
    </div>
  );
};
