import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Award,
  Sparkles,
  Gift,
  History,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Tag,
  ChevronRight,
  ArrowUpRight,
  HelpCircle,
  Coins,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { LoyaltyCard } from "./LoyaltyCard";
import { LoyaltyTier, LoyaltyTransaction } from "../types";

export const CustomerLoyaltySection: React.FC = () => {
  const {
    currentUser,
    customerLoyaltyProgress,
    loyaltyTiers,
    loyaltyTransactions = [],
    loyaltyConfig,
    redeemPointsForCoupon,
    siteSettings,
  } = useApp();

  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [selectedPointsToRedeem, setSelectedPointsToRedeem] = useState<number>(100);
  const [redeemSuccessMsg, setRedeemSuccessMsg] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <Award className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white mb-2">
          Club de Lealtad Hecho por Monse
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
          Inicia sesión o crea tu cuenta para obtener tu tarjeta de cliente distinguido, acumular
          0.50 puntos por cada $1 USD en compras aprobadas y desbloquear descuentos permanentes de
          hasta 25%.
        </p>
      </div>
    );
  }

  const progress = customerLoyaltyProgress;
  const userTransactions = loyaltyTransactions.filter(
    (tx) =>
      tx.customerId === currentUser.id ||
      (currentUser.email && tx.customerEmail === currentUser.email),
  );

  // Sorting active tiers by points requirement
  const sortedTiers = [...loyaltyTiers].sort(
    (a, b) => (a.requiredPoints || 0) - (b.requiredPoints || 0),
  );

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const handleRedeem = (points: number) => {
    if (!redeemPointsForCoupon) return;
    const res = redeemPointsForCoupon(points);
    if (res.success) {
      setRedeemSuccessMsg(res.message);
      setTimeout(() => setRedeemSuccessMsg(null), 5000);
    }
  };

  // Preset redemption options (e.g. 100 pts = $5, 200 pts = $10, 500 pts = $25)
  const redemptionOptions = [
    { points: 100, discountUSD: 5 },
    { points: 200, discountUSD: 10 },
    { points: 500, discountUSD: 25 },
    { points: 1000, discountUSD: 50 },
  ];

  return (
    <div className="space-y-8">
      {/* Visual Loyalty Card */}
      <LoyaltyCard
        progress={progress}
        tiers={loyaltyTiers}
        showActions={true}
        onRedeemPoints={() => {
          const target = document.getElementById("canjear-puntos-section");
          target?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
            Puntos Disponibles
          </p>
          <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {progress.availablePoints.toLocaleString()}{" "}
            <span className="text-xs font-sans text-stone-500">pts</span>
          </p>
          <p className="text-[10px] text-stone-500 mt-1">Canjeables por descuentos</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
            Puntos Históricos
          </p>
          <p className="text-xl font-bold font-mono text-stone-900 dark:text-white mt-1">
            {progress.accumulatedPoints.toLocaleString()}{" "}
            <span className="text-xs font-sans text-stone-500">pts</span>
          </p>
          <p className="text-[10px] text-stone-500 mt-1">Determinan tu Nivel</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
            Compras Aprobadas
          </p>
          <p className="text-xl font-bold font-mono text-stone-900 dark:text-white mt-1">
            {progress.totalOrdersCount}{" "}
            <span className="text-xs font-sans text-stone-500">pedidos</span>
          </p>
          <p className="text-[10px] text-stone-500 mt-1">Validadas por Monse</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
            Descuento de Nivel
          </p>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {progress.currentTier.discountPercentage}%{" "}
            <span className="text-xs font-sans text-stone-500">OFF</span>
          </p>
          <p className="text-[10px] text-stone-500 mt-1">En catálogo permanente</p>
        </div>
      </div>

      {/* Redeem Points Section */}
      <div
        id="canjear-puntos-section"
        className="bg-gradient-to-br from-rose-50/50 via-white to-pink-50/30 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900 border border-rose-100 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600">
                <Coins className="w-5 h-5" />
              </span>
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                Canjear Puntos por Cupones de Descuento
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              Convierte tus puntos acumulados en cupones oficiales aplicables a tu próximo ramo o
              caja sorpresa.
            </p>
          </div>

          <div className="px-4 py-2 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 text-right shrink-0">
            <span className="text-[10px] uppercase text-stone-500 block font-medium">
              Saldo Disponible
            </span>
            <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
              {progress.availablePoints} pts
            </span>
          </div>
        </div>

        {redeemSuccessMsg && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{redeemSuccessMsg}</span>
          </div>
        )}

        <div className="p-5 bg-gradient-to-r from-amber-50 to-rose-50/70 dark:from-stone-800 dark:to-stone-850 rounded-2xl border border-amber-200/80 dark:border-stone-700 space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-serif font-bold text-sm text-stone-900 dark:text-white">
              Acumulación de Puntos Activa
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            Cada compra confirmada en <strong>Hecho Por Monse</strong> acumula puntos automáticamente en tu saldo. Por ahora los cupones y descuentos directos se encuentran en pausa para dar paso a una nueva dinámica de recompensas exclusivas. ¡Continúa acumulando puntos para canjearlos más adelante!
          </p>
        </div>
      </div>

      {/* Available Coupons Ready to Use */}
      {progress.availableCoupons.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-rose-600" />
            Tus Cupones Disponibles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {progress.availableCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="p-3.5 rounded-2xl border border-dashed border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-rose-700 dark:text-rose-300 tracking-wider">
                      {coupon.code}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}% OFF`
                        : `$${coupon.discountValue} USD OFF`}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                    {coupon.title}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(coupon.code)}
                  className="px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-rose-400 rounded-xl text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedCoupon === coupon.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Point Transactions History */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              Historial de Puntos y Movimientos
            </h3>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">
            {userTransactions.length} movimiento(s)
          </span>
        </div>

        {userTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500">
            <Coins className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
            Aún no tienes movimientos registrados. Al aprobarse tu primera compra empezarás a sumar
            0.50 puntos por cada $1 USD.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-800 text-[11px] uppercase tracking-wider text-stone-400">
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2">Concepto</th>
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2 text-right">Puntos</th>
                  <th className="pb-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {userTransactions.map((tx) => {
                  const isPositive = tx.points >= 0;
                  return (
                    <tr key={tx.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                      <td className="py-3 text-stone-500 whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 font-medium text-stone-800 dark:text-stone-200">
                        {tx.description}
                        {tx.orderNumber && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono">
                            #{tx.orderNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                          {tx.type === "EARNED_PURCHASE"
                            ? "Compra Aprobada"
                            : tx.type === "BONUS_WELCOME"
                              ? "Bienvenida"
                              : tx.type === "BONUS_SPECIAL_DATE"
                                ? "Fecha Especial"
                                : tx.type === "BONUS_ADMIN"
                                  ? "Bono Taller"
                                  : tx.type === "REDEEMED_DISCOUNT"
                                    ? "Canje Descuento"
                                    : "Ajuste"}
                        </span>
                      </td>
                      <td
                        className={`py-3 text-right font-mono font-bold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {isPositive ? `+${tx.points}` : tx.points}
                      </td>
                      <td className="py-3 text-right font-mono text-stone-500">
                        {tx.balanceAfter} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guide of the 6 Loyalty Tiers */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Los 6 Niveles del Club de Lealtad Hecho por Monse
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Conoce los requisitos en puntos y los beneficios exclusivos de cada categoría.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTiers.map((tier) => {
            const isCurrent = tier.id === progress.currentTier.id;
            return (
              <div
                key={tier.id}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                  isCurrent
                    ? "border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 ring-2 ring-rose-400/20"
                    : "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850"
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                    Tu Nivel Actual
                  </span>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{tier.badge}</span>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                      Nivel {tier.name}
                    </h4>
                    <p className="text-[10px] text-stone-500 font-mono">
                      {tier.requiredPoints} pts requeridos
                    </p>
                  </div>
                </div>

                <div className="my-2.5 py-1.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800/80 flex items-center justify-between text-xs">
                  <span className="text-stone-500 text-[11px]">Descuento fijo:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                    {tier.discountPercentage}% OFF
                  </span>
                </div>

                <p className="text-[11px] text-stone-600 dark:text-stone-400 mb-3 line-clamp-2">
                  {tier.description}
                </p>

                <div className="space-y-1.5 border-t border-stone-100 dark:border-stone-800 pt-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Beneficios clave:
                  </p>
                  {tier.benefits.slice(0, 3).map((b, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-1.5 text-[11px] text-stone-600 dark:text-stone-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
