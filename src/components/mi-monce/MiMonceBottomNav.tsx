import React from "react";
import { Sparkles, Package, Crown, Heart, User } from "lucide-react";
import { MiMonceTab } from "./MiMonceTypes";

interface MiMonceBottomNavProps {
  activeTab: MiMonceTab;
  onTabChange: (tab: MiMonceTab) => void;
  activeOrdersCount: number;
  favoritesCount: number;
  unreadNotificationsCount: number;
}

export const MiMonceBottomNav: React.FC<MiMonceBottomNavProps> = ({
  activeTab,
  onTabChange,
  activeOrdersCount,
  favoritesCount,
  unreadNotificationsCount,
}) => {
  const items: {
    id: MiMonceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: "inicio", label: "Inicio", icon: Sparkles },
    { id: "pedidos", label: "Pedidos", icon: Package, badge: activeOrdersCount },
    { id: "lealtad", label: "Lealtad", icon: Crown },
    { id: "favoritos", label: "Favoritos", icon: Heart, badge: favoritesCount },
    { id: "cuenta", label: "Cuenta", icon: User, badge: unreadNotificationsCount },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-rose-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around safe-area-pb">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          activeTab === item.id ||
          (item.id === "cuenta" &&
            ["fechas", "beneficios", "mensajes", "notificaciones"].includes(activeTab));

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative cursor-pointer min-w-[56px] ${
              isActive ? "text-rose-700" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? "scale-110 stroke-[2.2]" : "stroke-[1.8]"
                }`}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight leading-none ${
                isActive ? "font-bold text-rose-700" : "font-medium text-stone-500"
              }`}
            >
              {item.label}
            </span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-rose-600 mt-0.5 absolute bottom-0" />
            )}
          </button>
        );
      })}
    </div>
  );
};
