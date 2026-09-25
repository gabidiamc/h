import React from "react";
import {
  Sparkles,
  Package,
  Crown,
  Heart,
  Calendar,
  Gift,
  MessageSquareText,
  Bell,
  User,
  LogOut,
  Phone,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { MiMonceTab } from "./MiMonceTypes";

interface MiMonceSidebarProps {
  activeTab: MiMonceTab;
  onTabChange: (tab: MiMonceTab) => void;
  activeOrdersCount: number;
  availableCouponsCount: number;
  favoritesCount: number;
  upcomingDatesCount: number;
}

export const MiMonceSidebar: React.FC<MiMonceSidebarProps> = ({
  activeTab,
  onTabChange,
  activeOrdersCount,
  availableCouponsCount,
  favoritesCount,
  upcomingDatesCount,
}) => {
  const { currentUser, logout, getCustomerLoyaltyProgress, unreadCount, siteSettings } = useApp();

  if (!currentUser) return null;

  const loyaltyProgress = getCustomerLoyaltyProgress(currentUser.id, currentUser.email);
  const tierName = loyaltyProgress?.currentTier?.name || "Nivel Rosa";
  const points = loyaltyProgress?.availablePoints ?? 0;

  const navItems: {
    id: MiMonceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: "inicio",
      label: "Inicio / Resumen",
      icon: Sparkles,
    },
    {
      id: "pedidos",
      label: "Mis Pedidos",
      icon: Package,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: "bg-rose-600 text-white",
    },
    {
      id: "lealtad",
      label: "Mi Lealtad",
      icon: Crown,
      badge: `${points} pts`,
      badgeColor: "bg-amber-100 text-amber-900 border border-amber-200",
    },
    {
      id: "favoritos",
      label: "Favoritos",
      icon: Heart,
      badge: favoritesCount > 0 ? favoritesCount : undefined,
      badgeColor: "bg-rose-100 text-rose-800",
    },
    {
      id: "fechas",
      label: "Mis Fechas",
      icon: Calendar,
      badge: upcomingDatesCount > 0 ? `${upcomingDatesCount} próx.` : undefined,
      badgeColor: "bg-purple-100 text-purple-900",
    },
    {
      id: "beneficios",
      label: "Mis Beneficios",
      icon: Gift,
      badge: availableCouponsCount > 0 ? availableCouponsCount : undefined,
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    {
      id: "mensajes",
      label: "Mis Mensajes",
      icon: MessageSquareText,
    },
    {
      id: "notificaciones",
      label: "Notificaciones",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: "bg-rose-600 text-white animate-pulse",
    },
    {
      id: "cuenta",
      label: "Mi Cuenta",
      icon: User,
    },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col bg-white rounded-3xl border border-rose-100/80 shadow-[0_4px_24px_rgba(244,63,94,0.05)] p-4 space-y-4 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
      {/* Client Profile Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/70 via-stone-50 to-pink-50/50 border border-rose-100/70 relative overflow-hidden">
        <div className="flex items-center gap-3">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-12 h-12 rounded-2xl object-cover shadow-sm shrink-0 border-2 border-white ring-2 ring-rose-200/60"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-pink-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 border border-white">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-stone-900 truncate leading-snug">
              {currentUser.nickname || currentUser.name}
            </h3>
            {currentUser.nickname && (
              <p className="text-[10px] text-stone-500 truncate leading-tight">
                {currentUser.name}
              </p>
            )}
            <p className="text-[10px] text-stone-400 truncate leading-tight mt-0.5">
              {currentUser.email}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100/90 text-rose-800 border border-rose-200/80">
                <Crown className="w-2.5 h-2.5 text-amber-600" />
                <span>{tierName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Points Summary */}
        <div className="mt-3 pt-2.5 border-t border-rose-100/60 flex items-center justify-between text-[11px]">
          <span className="text-stone-500 font-medium">Saldo de Lealtad:</span>
          <span className="font-bold text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200/60 shadow-2xs">
            {points} pts
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer select-none group ${
                isActive
                  ? "bg-rose-700 text-white shadow-xs font-semibold"
                  : "text-stone-700 hover:bg-rose-50/70 hover:text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? "text-white" : "text-rose-600 group-hover:scale-110"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-white/20 text-white" : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* WhatsApp Concierge direct button */}
      {siteSettings.whatsapp && (
        <a
          href={`https://wa.me/${siteSettings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
            `¡Hola Monce! Soy ${currentUser.name}. Quisiera consultar un detalle sobre mis pedidos o ramos personalizados.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 transition-colors text-xs font-medium cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="font-bold text-emerald-950">Atención Personal</p>
            <p className="text-[10px] text-emerald-700 truncate">Hablar con Monce por WhatsApp</p>
          </div>
        </a>
      )}

      {/* Logout button */}
      <button
        type="button"
        onClick={logout}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4 text-stone-400" />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
};
