import React from "react";
import {
  Sparkles,
  Crown,
  Package,
  Gift,
  Tag,
  Calendar,
  Heart,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquareText,
  CreditCard,
  ChevronRight,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Order, isOrderPaymentApproved } from "../../types";
import { MiMonceTab } from "./MiMonceTypes";

interface MiMonceResumenProps {
  onTabChange: (tab: MiMonceTab) => void;
  userOrders: Order[];
}

export const MiMonceResumen: React.FC<MiMonceResumenProps> = ({ onTabChange, userOrders }) => {
  const { currentUser, getCustomerLoyaltyProgress, coupons, giftCards, importantDates, wishlist } =
    useApp();

  if (!currentUser) return null;

  const loyaltyProgress = getCustomerLoyaltyProgress(currentUser.id, currentUser.email);
  const currentTier = loyaltyProgress.currentTier;
  const nextTier = loyaltyProgress.nextTier;
  const availablePoints = loyaltyProgress.availablePoints;
  const progressPct = Math.min(100, Math.max(0, loyaltyProgress.progressPercentage));

  // Active orders in workshop (not delivered or cancelled)
  const activeOrders = userOrders.filter(
    (o) => o.status !== "ENTREGADO" && o.status !== "CANCELADO",
  );

  // Available coupons for the customer
  const activeCoupons = (coupons || []).filter((c) => {
    if (c.status !== "ACTIVE") return false;
    if (c.expirationDate && new Date(c.expirationDate) < new Date()) return false;
    if (c.restrictedToTierId && c.restrictedToTierId !== "ALL") {
      return c.restrictedToTierId === currentTier?.id;
    }
    return true;
  });

  // Available Gift Cards
  const userGiftCards = (giftCards || []).filter((g) => {
    const isOwner =
      g.recipientEmail?.toLowerCase() === currentUser.email.toLowerCase() ||
      g.purchaserEmail?.toLowerCase() === currentUser.email.toLowerCase();
    return isOwner && g.currentBalance > 0 && g.status === "active";
  });

  // Next upcoming date: check personal saved dates first, then shop dates
  const todayStr = new Date().toISOString().split("T")[0];
  const personalDates = (currentUser.savedDates || [])
    .map((d) => {
      // Calculate next occurrence
      const currentYear = new Date().getFullYear();
      let targetDateStr = d.date;
      if (d.date.length === 5) {
        // MM-DD format
        targetDateStr = `${currentYear}-${d.date}`;
        if (targetDateStr < todayStr) {
          targetDateStr = `${currentYear + 1}-${d.date}`;
        }
      } else if (d.date < todayStr) {
        // Event in past year, compute next anniversary/birthday
        const parts = d.date.split("-");
        if (parts.length === 3) {
          targetDateStr = `${currentYear}-${parts[1]}-${parts[2]}`;
          if (targetDateStr < todayStr) {
            targetDateStr = `${currentYear + 1}-${parts[1]}-${parts[2]}`;
          }
        }
      }
      const daysDiff = Math.ceil(
        (new Date(targetDateStr).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        id: d.id,
        title: `${d.personName} (${d.relationship})`,
        type: d.eventType,
        date: targetDateStr,
        daysDiff,
        isPersonal: true,
      };
    })
    .filter((d) => d.daysDiff >= 0)
    .sort((a, b) => a.daysDiff - b.daysDiff);

  const shopDates = (importantDates || [])
    .filter((d) => d.active && d.date >= todayStr)
    .map((d) => {
      const daysDiff = Math.ceil(
        (new Date(d.date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        id: d.id,
        title: d.title,
        type: "taller",
        date: d.date,
        daysDiff,
        isPersonal: false,
      };
    })
    .sort((a, b) => a.daysDiff - b.daysDiff);

  const nextUpcomingDate = personalDates[0] || shopDates[0] || null;

  // Greeting based on time
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "¡Buenos días" : currentHour < 19 ? "¡Buenas tardes" : "¡Buenas noches";

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Artisan Ribbon Flair */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-900 via-rose-800 to-stone-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-[0_8px_30px_rgba(159,18,57,0.18)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover shadow-lg border-2 border-white/40 ring-4 ring-rose-500/30 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-rose-400 via-rose-300 to-amber-200 text-rose-950 flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-lg border-2 border-white/30 shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm text-rose-200 font-medium">
                  {greeting}
                  {currentUser.nickname ? `, ${currentUser.nickname}` : ""},
                </span>
                {loyaltyProgress.isEligible ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30">
                    <Crown className="w-3 h-3 text-amber-300" />
                    <span>{currentTier?.name || "Nivel Rosa"}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30">
                    <Lock className="w-3 h-3 text-amber-300" />
                    <span>Club de Lealtad: Por activar</span>
                  </span>
                )}
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {currentUser.name}
              </h2>
              <p className="text-xs sm:text-sm text-rose-100/80 max-w-lg">
                Bienvenida a tu espacio personal en Hecho por Monce. Administra tus pedidos de ramos
                eternos, recompensas y fechas especiales.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onTabChange("lealtad")}
              className="px-4 py-2.5 bg-white text-rose-950 rounded-2xl text-xs font-bold shadow-md hover:bg-rose-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-600" />
              <span>
                {loyaltyProgress.isEligible ? "Ver mi Tarjeta VIP" : "Club de Lealtad VIP"}
              </span>
            </button>
          </div>
        </div>

        {/* Loyalty Progress Bar in Header */}
        <div className="mt-6 pt-5 border-t border-white/10 relative z-10">
          {loyaltyProgress.isEligible ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 mb-2">
                <div className="flex items-center gap-2 text-rose-100">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    Puntos disponibles:{" "}
                    <strong className="text-white text-sm">{availablePoints} pts</strong>{" "}
                    <span className="text-rose-200/70 text-[11px]">
                      (Equivalente a ${(availablePoints / 20).toFixed(2)} USD en descuentos)
                    </span>
                  </span>
                </div>
                {nextTier ? (
                  <span className="text-[11px] text-amber-200 font-medium">
                    Faltan {loyaltyProgress.pointsNeededForNextTier} pts para {nextTier.name}
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-300 font-bold">
                    ¡Nivel Máximo VIP alcanzado! 👑
                  </span>
                )}
              </div>
              <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-rose-300 to-pink-300 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-100/90 bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="text-[11px] sm:text-xs">
                  <strong>Acceso al Club de Lealtad:</strong> Se activará automáticamente con tu
                  primera compra verificada y aprobada por la dueña.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onTabChange("lealtad")}
                className="text-[11px] font-bold text-amber-300 hover:text-white underline shrink-0 cursor-pointer text-left sm:text-right"
              >
                Conocer beneficios VIP →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Active Orders */}
        <div
          onClick={() => onTabChange("pedidos")}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-rose-100/90 shadow-[0_2px_12px_rgba(244,63,94,0.04)] hover:shadow-[0_4px_20px_rgba(244,63,94,0.09)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Pedidos Activos</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 group-hover:bg-rose-100 text-rose-700 flex items-center justify-center transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-2">
            {activeOrders.length}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-rose-700 font-medium">
            <span>
              {activeOrders.length > 0 ? "En preparación / taller" : "Sin pedidos en curso"}
            </span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Metric 2: Available Coupons */}
        <div
          onClick={() => onTabChange("beneficios")}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-rose-100/90 shadow-[0_2px_12px_rgba(244,63,94,0.04)] hover:shadow-[0_4px_20px_rgba(244,63,94,0.09)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Cupones Disponibles</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-2">
            {activeCoupons.length}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700 font-medium">
            <span>Listos para aplicar</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Metric 3: Gift Cards */}
        <div
          onClick={() => onTabChange("beneficios")}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-rose-100/90 shadow-[0_2px_12px_rgba(244,63,94,0.04)] hover:shadow-[0_4px_20px_rgba(244,63,94,0.09)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Gift Cards</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 group-hover:bg-purple-100 text-purple-700 flex items-center justify-center transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-2">
            {userGiftCards.length}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-purple-700 font-medium">
            <span>
              {userGiftCards.length > 0
                ? `$${userGiftCards.reduce((sum, g) => sum + g.currentBalance, 0).toFixed(2)} saldo`
                : "Checar saldo"}
            </span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Metric 4: Next Important Date */}
        <div
          onClick={() => onTabChange("fechas")}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-rose-100/90 shadow-[0_2px_12px_rgba(244,63,94,0.04)] hover:shadow-[0_4px_20px_rgba(244,63,94,0.09)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Próxima Fecha</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-700 flex items-center justify-center transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {nextUpcomingDate ? (
              <>
                <p className="text-sm sm:text-base font-bold text-stone-900 truncate leading-snug">
                  {nextUpcomingDate.title}
                </p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-amber-700 font-bold">
                  <span>
                    {nextUpcomingDate.daysDiff === 0
                      ? "¡Es hoy! 🎉"
                      : `En ${nextUpcomingDate.daysDiff} días`}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-stone-900 mt-1">Sin fechas</p>
                <p className="text-[11px] text-stone-400 mt-1">Registrar recordatorio</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Actions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => onTabChange("pedidos")}
          className="p-3 bg-rose-50 hover:bg-rose-100/80 text-rose-900 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border border-rose-200/60"
        >
          <Package className="w-4 h-4 text-rose-700 shrink-0" />
          <span className="truncate">Rastrear Pedido</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("lealtad")}
          className="p-3 bg-amber-50 hover:bg-amber-100/80 text-amber-950 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border border-amber-200/60"
        >
          <Crown className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="truncate">Canjear Puntos</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("fechas")}
          className="p-3 bg-purple-50 hover:bg-purple-100/80 text-purple-950 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border border-purple-200/60"
        >
          <Calendar className="w-4 h-4 text-purple-700 shrink-0" />
          <span className="truncate">Agregar Fecha</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("favoritos")}
          className="p-3 bg-pink-50 hover:bg-pink-100/80 text-pink-950 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border border-pink-200/60"
        >
          <Heart className="w-4 h-4 text-pink-700 shrink-0" />
          <span className="truncate">Mis Ramos ({wishlist.length})</span>
        </button>
      </div>

      {/* Active Orders Quick Highlight Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100/90 shadow-[0_2px_12px_rgba(244,63,94,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4.5 h-4.5 text-rose-600" />
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Pedidos en Taller ({activeOrders.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onTabChange("pedidos")}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Ver historial completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeOrders.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-stone-50/60 border border-dashed border-stone-200">
            <Package className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">
              No tienes pedidos activos en elaboración
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Cuando apartes tu ramo eterno, podrás seguir su proceso aquí en vivo.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.slice(0, 3).map((order) => {
              const isApproved = isOrderPaymentApproved(order);
              return (
                <div
                  key={order.id}
                  onClick={() => onTabChange("pedidos")}
                  className="p-4 rounded-2xl bg-stone-50/80 hover:bg-rose-50/50 border border-stone-200/70 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {order.items[0]?.productImage ? (
                        <img
                          src={order.items[0].productImage}
                          alt={order.items[0].productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-rose-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-stone-900">
                          #{order.orderNumber}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-800">
                          {order.status.replace(/_/g, " ")}
                        </span>
                        {isApproved && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Pago Validado</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 mt-0.5 line-clamp-1">
                        {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                      </p>
                      <span className="text-[11px] text-stone-400">
                        Entrega programada: {order.scheduledDate} ({order.scheduledTimeSlot})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-stone-100">
                    <div className="text-right">
                      <span className="text-xs font-bold text-stone-900">
                        ${order.totalPrice.toFixed(2)} USD
                      </span>
                      <p className="text-[10px] text-stone-400">
                        Saldo: ${order.remainingBalance.toFixed(2)} USD
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-rose-700 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
