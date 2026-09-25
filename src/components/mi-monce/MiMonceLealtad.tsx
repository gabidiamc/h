import React, { useState } from "react";
import {
  Crown,
  Sparkles,
  Gift,
  ShieldCheck,
  TrendingUp,
  History,
  CheckCircle2,
  Lock,
  ArrowRight,
  Zap,
  Tag,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const MiMonceLealtad: React.FC = () => {
  const {
    currentUser,
    getCustomerLoyaltyProgress,
    loyaltyTiers,
    loyaltyTransactions,
    redeemPointsForCoupon,
    loyaltyConfig,
  } = useApp();

  const minRedeem = loyaltyConfig?.minimumPointsToRedeem ?? 100;
  const redemptionRate = loyaltyConfig?.redemptionRatePointsPerUSD ?? 20;

  const [redeemPointsAmount, setRedeemPointsAmount] = useState<number>(minRedeem);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [redeemSuccessCoupon, setRedeemSuccessCoupon] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  if (!currentUser) return null;

  const loyaltyProgress = getCustomerLoyaltyProgress(currentUser.id, currentUser.email);
  const currentTier = loyaltyProgress.currentTier;
  const nextTier = loyaltyProgress.nextTier;
  const availablePoints = loyaltyProgress.availablePoints;
  const lifetimePoints = loyaltyProgress.accumulatedPoints;
  const progressPct = Math.min(100, Math.max(0, loyaltyProgress.progressPercentage));

  // Customer transactions history
  const customerTxs = (loyaltyTransactions || []).filter(
    (tx) =>
      tx.customerId === currentUser.id ||
      (tx.customerEmail && tx.customerEmail.toLowerCase() === currentUser.email.toLowerCase()),
  );

  // GATING RULE: Customer cannot access loyalty benefits without at least 1 verified purchase
  if (!loyaltyProgress.isEligible) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="font-serif text-2xl font-bold text-stone-900">Club de Lealtad VIP</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Programa exclusivo de beneficios, recompensas y descuentos para clientes de Hecho por
            Monce.
          </p>
        </div>

        {/* Locked Access Notice Banner */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-stone-900 via-stone-850 to-rose-950 text-white border border-rose-900/40 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/30 text-amber-300 flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-300" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Acceso Condicional al Programa
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Tu acceso al Club de Lealtad se activará automáticamente con tu primera compra
                verificada.
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Por política de transparencia y seguridad de nuestro taller artesanal, los puntos,
              niveles y cupones de recompensa se desbloquean una vez que la dueña verifique y
              apruebe el comprobante de pago de tu primer pedido.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-rose-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Compras registradas: 0 compras verificadas por la dueña</span>
            </div>
          </div>
        </div>

        {/* Benefits Explainer Grid */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <h4 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Beneficios que obtendrás al aprobarse tu primer pedido</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-stone-600">
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Puntos en cada compra</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Acumula 0.50 puntos por cada $1.00 USD en ramos y cajas artesanales aprobadas.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Cupones de Descuento</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Canjea tus puntos acumulados por cupones de dinero real para tus futuros regalos.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <span>Niveles VIP Exclusivos</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Sube de Nivel Rosa a Plata, Oro Imperial y Diamante Negro con descuentos
                permanentes.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-purple-600" />
                <span>Detalles Conmemorativos</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Promociones anticipadas y sorpresas en fechas especiales guardadas en tu cuenta.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleRedeem = async () => {
    if (availablePoints < redeemPointsAmount || redeemPointsAmount <= 0) return;
    setIsRedeeming(true);
    setRedeemError(null);
    try {
      const res = redeemPointsForCoupon(redeemPointsAmount);
      if (res.success && res.coupon) {
        setRedeemSuccessCoupon(res.coupon.code);
      } else if (!res.success) {
        setRedeemError(res.message || "No se pudo realizar el canje.");
      }
    } catch (err: any) {
      setRedeemError(err?.message || "Ocurrió un error al canjear los puntos.");
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <h2 className="font-serif text-2xl font-bold text-stone-900">Club de Lealtad</h2>
        </div>
        <p className="text-xs text-stone-500 mt-0.5">
          Acumula 0.50 puntos por cada $1 USD en pedidos con pago verificado y desbloquea beneficios
          exclusivos.
        </p>
      </div>

      {/* Digital VIP Membership Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-stone-900 via-rose-950 to-stone-900 text-white relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.3)] border border-rose-400/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
          {/* Top Bar of Card */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-rose-300">
                Tarjeta de Membresía Digital
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
                Hecho por Monce VIP
              </h3>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentTier?.name || "Nivel Rosa"}</span>
            </div>
          </div>

          {/* Points Display */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <span className="text-[11px] text-rose-200/80 font-medium">Puntos Disponibles</span>
              <p className="font-serif text-3xl sm:text-4xl font-bold text-white mt-0.5">
                {availablePoints}{" "}
                <span className="text-xs font-sans text-amber-300 font-bold">pts</span>
              </p>
              <p className="text-[10px] text-rose-300 mt-0.5">
                ≈ ${(availablePoints / 20).toFixed(2)} USD en descuentos
              </p>
            </div>
            <div>
              <span className="text-[11px] text-rose-200/80 font-medium">Puntos Históricos</span>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-200 mt-0.5">
                {lifetimePoints}
              </p>
              <p className="text-[10px] text-stone-400 mt-0.5">Acumulados desde tu inicio</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[11px] text-rose-200/80 font-medium">Cliente</span>
              <p className="text-sm font-bold text-white truncate mt-1">{currentUser.name}</p>
              <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                ID: #{currentUser.id.slice(0, 8)}
              </p>
            </div>
          </div>

          {/* Progress to Next Tier */}
          <div className="pt-3 border-t border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-rose-100">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Progreso hacia {nextTier?.name || "Nivel Máximo"}</span>
              </span>
              <span className="font-bold text-amber-300">
                {nextTier
                  ? `Faltan ${loyaltyProgress.pointsNeededForNextTier} pts (${progressPct.toFixed(0)}%)`
                  : "¡Nivel Supremo Desbloqueado! 👑"}
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-rose-300 to-pink-300 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rules and Verification Security Callout */}
      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3 text-xs text-stone-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-stone-900">Regla de Acreditación Segura & Transparente</p>
          <p className="text-[11px] text-stone-600">
            Tus puntos se acreditan automáticamente una vez que el pago bancario de tu pedido es
            verificado y aprobado por la dueña del taller. Tasa oficial:{" "}
            <strong>$1 USD = 0.50 Puntos</strong> (o superior con bonos especiales de temporada).
          </p>
        </div>
      </div>

      {/* Acumulación de Puntos Activa (Canjes para más adelante) */}
      <div className="bg-gradient-to-r from-amber-50 to-rose-50/70 rounded-3xl p-5 sm:p-6 border border-amber-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-700" />
          <h3 className="font-serif text-lg font-bold text-amber-950">
            Acumulación de Puntos Activa
          </h3>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          Tus compras y pedidos en <strong>Hecho Por Monse</strong> acumulan puntos automáticamente en tu cuenta. Por ahora, las promociones, descuentos y canjes directos están temporalmente en pausa mientras preparamos nuevas dinámicas y recompensas especiales. ¡Sigue acumulando puntos para canjearlos más adelante!
        </p>
        <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-amber-900">
          <div className="px-3 py-1.5 bg-white/80 rounded-xl border border-amber-200 flex items-center gap-1.5 shadow-2xs">
            <Gift className="w-4 h-4 text-amber-600" />
            <span>Tus puntos se conservan al 100% en tu perfil</span>
          </div>
        </div>
      </div>

      {/* Tier Benefits Breakdown */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-stone-900">
          Niveles y Beneficios del Taller
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(loyaltyTiers || []).map((tier) => {
            const isUserTier = currentTier?.id === tier.id;
            const benefitsList = tier.benefits || (tier as any).perks || [];
            const reqPts = tier.requiredPoints ?? (tier as any).thresholdPoints ?? 0;
            const reqOrders = tier.minOrdersCount ?? (tier as any).thresholdOrders ?? 0;
            return (
              <div
                key={tier.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isUserTier
                    ? "bg-gradient-to-b from-rose-50/80 to-white border-rose-300 ring-2 ring-rose-200 shadow-xs"
                    : "bg-stone-50/50 border-stone-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    <Crown
                      className={`w-3.5 h-3.5 ${isUserTier ? "text-amber-500" : "text-stone-400"}`}
                    />
                    {tier.name}
                  </span>
                  {isUserTier && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-700 text-white">
                      Tu Nivel Actual
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-stone-500 mb-2">
                  Meta: {reqPts} pts {reqOrders > 0 ? `o ${reqOrders} pedidos` : ""}
                </div>

                <ul className="space-y-1 text-xs text-stone-700">
                  {benefitsList.map((perk: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          isUserTier ? "text-rose-600" : "text-stone-400"
                        }`}
                      />
                      <span className="text-[11px] leading-tight">{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Loyalty Transactions History */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-rose-700" />
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Historial de Movimientos de Puntos
          </h3>
        </div>

        {customerTxs.length === 0 ? (
          <div className="text-center py-6 text-stone-400 text-xs">
            Aún no tienes movimientos registrados. Cuando tu primer pedido sea validado, verás tus
            puntos acreditados aquí.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {(customerTxs || []).map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-stone-800 truncate">{tx.description}</p>
                  <p className="text-[11px] text-stone-400">
                    {new Date(tx.timestamp).toLocaleString("es-MX")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`font-bold font-mono text-sm ${
                      tx.points > 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                  </span>
                  <p className="text-[10px] text-stone-400">Saldo: {tx.balanceAfter} pts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
