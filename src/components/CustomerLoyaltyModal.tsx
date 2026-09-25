import React, { useState } from "react";
import {
  X,
  Crown,
  Sparkles,
  Gift,
  Copy,
  Check,
  ChevronRight,
  CreditCard,
  Percent,
  Star,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Search,
  ExternalLink,
  Lock,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { LoyaltyTier } from "../types";

export const CustomerLoyaltyModal: React.FC = () => {
  const {
    isLoyaltyModalOpen,
    setIsLoyaltyModalOpen,
    currentUser,
    getCustomerLoyaltyProgress,
    upgradeTierWithPoints,
    loyaltyTiers,
    giftCards,
    checkGiftCard,
    siteSettings,
  } = useApp();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tier" | "giftcards">("tier");
  const [upgradeFeedback, setUpgradeFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Gift card checker state
  const [giftCardCodeInput, setGiftCardCodeInput] = useState("");
  const [checkedCard, setCheckedCard] = useState<any | null>(null);
  const [checkerError, setCheckerError] = useState<string | null>(null);

  if (!isLoyaltyModalOpen) return null;

  const progress = getCustomerLoyaltyProgress(currentUser?.id, currentUser?.email);
  const {
    currentTier,
    nextTier,
    progressPercentage,
    usdNeededForNextTier,
    ordersNeededForNextTier,
  } = progress;

  // Filter user's personal gift cards if email matches
  const userGiftCards = currentUser?.email
    ? giftCards.filter(
        (g) => (g.recipientEmail || "").toLowerCase() === currentUser.email.toLowerCase(),
      )
    : [];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCheckCard = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckerError(null);
    setCheckedCard(null);

    const codeClean = giftCardCodeInput.trim().toUpperCase();
    if (!codeClean) return;

    const found = checkGiftCard(codeClean);
    if (found) {
      setCheckedCard(found);
    } else {
      setCheckerError(
        "No encontramos una tarjeta de regalo con ese código. Verifica que esté bien escrito.",
      );
    }
  };

  // Helper for Card Gradient
  const getCardBackground = (tier: LoyaltyTier) => {
    if (tier.cardTheme === "custom" && tier.customGradient) {
      return tier.customGradient;
    }
    switch (tier.cardTheme) {
      case "silver_velvet":
        return "linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%)";
      case "imperial_gold":
        return "linear-gradient(135deg, #b45309 0%, #d97706 40%, #fbbf24 80%, #fef3c7 100%)";
      case "black_diamond":
        return "linear-gradient(135deg, #09090b 0%, #18181b 40%, #27272a 80%, #3f3f46 100%)";
      case "lavender_luxury":
        return "linear-gradient(135deg, #6b21a8 0%, #9333ea 50%, #c084fc 100%)";
      case "rose_gold":
      default:
        return "linear-gradient(135deg, #be123c 0%, #e11d48 40%, #fb7185 85%, #fecdd3 100%)";
    }
  };

  return (
    <div
      id="modal-customer-loyalty"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto"
      onClick={() => setIsLoyaltyModalOpen(false)}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-6 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Club de Lealtad & Recompensas
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-900/60 text-rose-300 border border-rose-700/50">
                  {siteSettings.businessName}
                </span>
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-white">
                {currentUser
                  ? `¡Hola, ${currentUser.name.split(" ")[0]}!`
                  : "Bienvenida al Club de Clientes"}
              </h2>
            </div>
          </div>

          <button
            id="btn-close-loyalty-modal"
            type="button"
            onClick={() => setIsLoyaltyModalOpen(false)}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 px-6 pt-3 gap-6 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab("tier")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer text-xs font-semibold transition-colors ${
              activeTab === "tier"
                ? "border-rose-700 text-rose-800"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Mi Nivel & Progreso</span>
          </button>

          <button
            onClick={() => setActiveTab("giftcards")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer text-xs font-semibold transition-colors ${
              activeTab === "giftcards"
                ? "border-rose-700 text-rose-800"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Tarjetas de Regalo</span>
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-stone-800">
          {/* 1. TAB: MI NIVEL & PROGRESO */}
          {activeTab === "tier" &&
            (!progress.isEligible ? (
              <div className="space-y-6">
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
                        Tu acceso al Club de Lealtad se activará automáticamente con tu primera
                        compra verificada.
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                      Por política de seguridad y transparencia de nuestro taller artesanal, el
                      programa de recompensas y puntos se activa exclusivamente tras la verificación
                      y aprobación de tu primer pedido por parte de la dueña.
                    </p>

                    <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-rose-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Compras registradas: 0 compras verificadas</span>
                    </div>
                  </div>
                </div>

                {/* Benefits Explanation */}
                <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200 space-y-4">
                  <h4 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Beneficios que obtendrás al activar tu cuenta</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600">
                    <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-1">
                      <p className="font-bold text-stone-900">✨ Puntos por Compra</p>
                      <p className="text-[11px] text-stone-500">
                        $1.00 USD = 0.50 puntos en cada ramo eterno verificado.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-1">
                      <p className="font-bold text-stone-900">👑 4 Niveles VIP</p>
                      <p className="text-[11px] text-stone-500">
                        Descuentos crecientes: Rosa (0%), Plata (5%), Oro (10%), Diamante (15%).
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-1">
                      <p className="font-bold text-stone-900">🪙 Acumulación Continua</p>
                      <p className="text-[11px] text-stone-500">
                        Acumula puntos en cada pedido para canjear más adelante en dinámicas exclusivas.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-1">
                      <p className="font-bold text-stone-900">🎁 Regalos Especiales</p>
                      <p className="text-[11px] text-stone-500">
                        Sorpresas personalizadas en fechas importantes y aniversarios.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Digital Loyalty Card */}
                <div
                  className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden transition-all"
                  style={{ background: getCardBackground(currentTier) }}
                >
                  {/* Decorative sheen pattern */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/15 rounded-full blur-xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col justify-between h-48 sm:h-52">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{currentTier.badge}</span>
                          <span className="text-xs uppercase tracking-widest font-bold opacity-90">
                            {siteSettings.businessName} • Club Lealtad
                          </span>
                        </div>
                        <h3 className="font-serif text-2xl sm:text-3xl font-bold mt-1 tracking-tight">
                          {currentTier.name}
                        </h3>
                        <p className="text-xs text-white/80 max-w-sm mt-0.5 line-clamp-2">
                          {currentTier.description}
                        </p>
                      </div>

                      {currentTier.discountPercentage > 0 && (
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-2xl text-center border border-white/30 shadow-xs">
                          <span className="text-base font-extrabold block leading-none">
                            {currentTier.discountPercentage}%
                          </span>
                          <span className="text-[9px] uppercase font-bold tracking-wider opacity-90">
                            Descuento VIP
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-end justify-between border-t border-white/20 pt-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider block opacity-75">
                          Titular de la Membresía
                        </span>
                        <span className="font-semibold text-sm sm:text-base">
                          {currentUser?.name || "Cliente Registrado"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider block opacity-75">
                          Puntos Acumulados
                        </span>
                        <span className="font-mono font-bold text-base sm:text-lg text-amber-300 flex items-center justify-end gap-1">
                          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                          {progress.accumulatedPoints} pts
                        </span>
                        <span className="text-[10px] opacity-75 block">
                          ${progress.totalSpentUSD} USD gastados • {progress.totalOrdersCount}{" "}
                          pedidos
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress to Next Tier */}
                {nextTier ? (
                  <div className="bg-stone-50 border border-stone-200 rounded-3xl p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                          Camino hacia tu siguiente nivel
                        </span>
                        <h4 className="font-serif text-base font-bold text-stone-900 flex items-center gap-1.5 mt-0.5">
                          <span>{nextTier.badge}</span>
                          <span>{nextTier.name}</span>
                          <span className="text-xs font-normal text-stone-500">
                            ({nextTier.discountPercentage}% de descuento permanente)
                          </span>
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          {progress.accumulatedPoints} / {progress.pointsCostForNextTier} pts
                        </span>
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full">
                          {progress.progressPercentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-rose-600 to-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress.progressPercentage}%` }}
                      />
                    </div>

                    {/* Points Upgrade CTA Box */}
                    <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-rose-100">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <Crown className="w-4 h-4 text-amber-500" />
                          <span>Canjea tu ascenso con Puntos Acumulados</span>
                        </span>
                        <p className="text-[11px] text-stone-500">
                          Precio de ascenso directo:{" "}
                          <strong>{progress.pointsCostForNextTier} puntos</strong>. Desbloquea de
                          inmediato {nextTier.discountPercentage}% de descuento en todos tus
                          pedidos.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={!progress.canUpgradeWithPoints || isUpgrading}
                        onClick={() => {
                          setIsUpgrading(true);
                          const res = upgradeTierWithPoints(nextTier.id);
                          setUpgradeFeedback(res);
                          setIsUpgrading(false);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                          progress.canUpgradeWithPoints
                            ? "bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-sm ring-2 ring-amber-300"
                            : "bg-stone-200 text-stone-400 cursor-not-allowed"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {progress.canUpgradeWithPoints
                            ? `Comprar Nivel ${nextTier.name}`
                            : `Faltan ${Math.max(0, progress.pointsCostForNextTier - progress.accumulatedPoints)} pts`}
                        </span>
                      </button>
                    </div>

                    {upgradeFeedback && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium ${
                          upgradeFeedback.success
                            ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                            : "bg-amber-50 text-amber-900 border border-amber-200"
                        }`}
                      >
                        {upgradeFeedback.message}
                      </div>
                    )}

                    {/* Criteria explanation */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 pt-1 gap-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          También asciendes automáticamente al acumular:{" "}
                          {nextTier.minSpendUSD > 0 && (
                            <b>${nextTier.minSpendUSD} USD en compras</b>
                          )}{" "}
                          {nextTier.minOrdersCount > 0 && (
                            <>
                              o <b>{nextTier.minOrdersCount} pedidos aprobados</b>
                            </>
                          )}
                          .
                        </span>
                      </div>

                      <span className="text-[11px] text-stone-400">
                        1 USD = 10 pts • 1 pedido = 50 pts
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-center gap-3 text-amber-900">
                    <div className="w-10 h-10 rounded-2xl bg-amber-200/70 text-amber-800 flex items-center justify-center shrink-0">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">
                        ¡Perteneces al nivel más alto de Lazo Eterno!
                      </h4>
                      <p className="text-xs text-amber-800/80">
                        Disfrutas de las máximas recompensas, descuentos permanentes y trato VIP en
                        cada entrega.
                      </p>
                    </div>
                  </div>
                )}

                {/* Informational security and loyalty note */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-2.5 text-stone-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    <strong>Transparencia del Club:</strong> Las compras se contabilizan en tu saldo
                    y tarjeta de lealtad exclusivamente cuando la dueña ha verificado y aprobado el
                    comprobante de pago. Los pedidos en revisión no suman puntos hasta su
                    confirmación manual.
                  </p>
                </div>

                {/* Unlocked Benefits */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-rose-600" />
                    <span>Beneficios Activos de tu Nivel ({currentTier.name})</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Standard rule benefits */}
                    {currentTier.earlyAccessEvents && (
                      <div className="p-3 bg-white rounded-2xl border border-rose-100 flex items-start gap-2.5 shadow-2xs">
                        <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-stone-900 block">
                            Acceso Anticipado a Eventos
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Aparta con prioridad en 14 de Febrero y Día de las Madres antes de
                            agotar cupos.
                          </span>
                        </div>
                      </div>
                    )}

                    {currentTier.exclusiveBouquetsCatalog && (
                      <div className="p-3 bg-white rounded-2xl border border-rose-100 flex items-start gap-2.5 shadow-2xs">
                        <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-stone-900 block">
                            Ramos y Papeles Exclusivos
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Acceso a modelos de alta costura, papeles coreanos y confecciones
                            reservadas.
                          </span>
                        </div>
                      </div>
                    )}

                    {currentTier.specialGiftIncluded && (
                      <div className="p-3 bg-white rounded-2xl border border-rose-100 flex items-start gap-2.5 shadow-2xs">
                        <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Gift className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-stone-900 block">
                            Detalle Especial de Regalo
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Corona de circonias, mariposas doradas 3D o luces cálidas en tus
                            encargos.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Custom benefits strings */}
                    {(currentTier.benefits || []).map((ben, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-2xl border border-stone-200 flex items-start gap-2.5 shadow-2xs"
                      >
                        <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-stone-800 leading-snug">
                          {ben}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Tiers Roadmap */}
                <div className="border-t border-stone-200 pt-5 space-y-3">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Escalafón del Programa de Lealtad
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {loyaltyTiers.map((t) => {
                      const isCurrent = t.id === currentTier.id;
                      return (
                        <div
                          key={t.id}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            isCurrent
                              ? "bg-rose-50 border-rose-400 ring-2 ring-rose-400/20 shadow-xs"
                              : "bg-stone-50/70 border-stone-200 opacity-70"
                          }`}
                        >
                          <span className="text-2xl block mb-1">{t.badge}</span>
                          <span className="text-xs font-bold text-stone-900 block truncate">
                            {t.name}
                          </span>
                          <span className="text-[11px] text-rose-700 font-semibold block">
                            {t.discountPercentage}% OFF
                          </span>
                          <span className="text-[10px] text-stone-400 block mt-0.5">
                            {t.minSpendUSD > 0 ? `$${t.minSpendUSD} USD` : "Inicio"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

          {/* 2. TAB: TARJETAS DE REGALO & CONSULTA DE SALDO */}
          {activeTab === "giftcards" && (
            <div className="space-y-6">
              {/* Checker Form */}
              <div className="bg-stone-50 border border-stone-200 rounded-3xl p-5 space-y-3">
                <div>
                  <h4 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-rose-700" />
                    <span>Consultar Saldo de Tarjeta de Regalo</span>
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Ingresa el código alfanumérico de tu tarjeta de regalo para verificar tu saldo
                    disponible en USD.
                  </p>
                </div>

                <form onSubmit={handleCheckCard} className="flex gap-2">
                  <input
                    type="text"
                    value={giftCardCodeInput}
                    onChange={(e) => setGiftCardCodeInput(e.target.value.toUpperCase())}
                    placeholder="Ej. LAZO-GIFT-1234"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Consultar
                  </button>
                </form>

                {checkerError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{checkerError}</span>
                  </div>
                )}

                {checkedCard && (
                  <div className="p-4 bg-white border border-emerald-300 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Tarjeta Válida
                      </span>
                      <span className="font-mono text-xs font-bold text-stone-700">
                        {checkedCard.code}
                      </span>
                    </div>

                    <div className="flex items-end justify-between pt-1 border-t border-stone-100">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase">
                          Saldo Disponible
                        </span>
                        <span className="font-serif text-2xl font-bold text-emerald-700">
                          ${checkedCard.currentBalance} {checkedCard.currency || "USD"}
                        </span>
                      </div>
                      <span className="text-xs text-stone-500">
                        Valor original: ${checkedCard.initialAmount} {checkedCard.currency || "USD"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* User's Gift Cards list if registered */}
              {userGiftCards.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Tarjetas de Regalo Asociadas a tu Correo
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {userGiftCards.map((gc) => (
                      <div
                        key={gc.id}
                        className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded">
                            {gc.code}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              gc.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {gc.status === "active" ? "Activa" : "Canjeada"}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-xs text-stone-500">Saldo restante:</span>
                          <span className="font-serif text-lg font-bold text-rose-800">
                            ${gc.currentBalance} {gc.currency || "USD"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>{siteSettings.businessName} • Programa de Fidelización Permanente</span>
          <button
            onClick={() => setIsLoyaltyModalOpen(false)}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
