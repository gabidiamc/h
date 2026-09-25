import React, { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Package,
  Crown,
  CreditCard,
  Calendar,
  Tag,
  Clock,
  Sparkles,
  CheckCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { AppNotification } from "../../types";

export const MiMonceNotificaciones: React.FC = () => {
  const {
    currentUser,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadCount,
  } = useApp();

  const [filter, setFilter] = useState<"all" | "order" | "loyalty" | "promo">("all");

  if (!currentUser) return null;

  // Filter notifications for this customer
  const customerNotifications = (notifications || []).filter((n) => {
    return (
      n.userId === currentUser.id ||
      n.userId === currentUser.email ||
      n.targetRole === "customer" ||
      n.targetRole === "all"
    );
  });

  const filtered = customerNotifications.filter((n) => {
    if (filter === "order") return n.type === "order";
    if (filter === "loyalty") return n.type === "loyalty";
    if (filter === "promo") return n.type === "promo" || n.type === "reminder";
    return true;
  });

  const getNotificationIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "order":
        return <Package className="w-4 h-4 text-rose-600" />;
      case "loyalty":
        return <Crown className="w-4 h-4 text-amber-600" />;
      case "promo":
        return <Tag className="w-4 h-4 text-emerald-600" />;
      case "reminder":
        return <Calendar className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-rose-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-600" />
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Centro de Notificaciones
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Avisos de taller en tiempo real sobre tus pedidos, validación de transferencias y
            beneficios.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsAsRead}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200/80 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-rose-600" />
            <span>Marcar todas como leídas</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            filter === "all"
              ? "bg-rose-700 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          Todas ({customerNotifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("order")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            filter === "order"
              ? "bg-rose-700 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          Pedidos & Pagos
        </button>
        <button
          type="button"
          onClick={() => setFilter("loyalty")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            filter === "loyalty"
              ? "bg-rose-700 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          Club de Lealtad
        </button>
        <button
          type="button"
          onClick={() => setFilter("promo")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            filter === "promo"
              ? "bg-rose-700 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          Fechas & Cupones
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-rose-100 shadow-xs space-y-3">
          <Bell className="w-12 h-12 text-rose-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No tienes notificaciones</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Te avisaremos de inmediato en cuanto la dueña del taller actualice tus pedidos o valide
            tus pagos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n, idx) => (
            <div
              key={`${n.id || "notif"}-${idx}`}
              onClick={() => markNotificationAsRead(n.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                !n.read
                  ? "bg-gradient-to-r from-rose-50/60 to-white border-rose-200 shadow-2xs"
                  : "bg-white border-stone-200/80 hover:bg-stone-50"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center shrink-0">
                {getNotificationIcon(n.type)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-stone-900 leading-snug">{n.title}</h4>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-stone-400">
                      {new Date(n.createdAt).toLocaleDateString("es-MX", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />}
                  </div>
                </div>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
