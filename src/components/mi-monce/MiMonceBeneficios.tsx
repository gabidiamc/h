import React, { useState } from "react";
import {
  Tag,
  Gift,
  Copy,
  Check,
  CreditCard,
  Crown,
  Sparkles,
  Calendar,
  AlertCircle,
  Search,
  Lock,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const MiMonceBeneficios: React.FC = () => {
  const {
    currentUser,
    coupons,
    giftCards,
    checkGiftCard,
    getCustomerLoyaltyProgress,
    loyaltyTiers,
  } = useApp();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [giftCardSearchCode, setGiftCardSearchCode] = useState<string>("");
  const [giftCardSearchResult, setGiftCardSearchResult] = useState<string | null>(null);

  if (!currentUser) return null;

  const loyaltyProgress = getCustomerLoyaltyProgress(currentUser.id, currentUser.email);
  const currentTier = loyaltyProgress.currentTier;

  // Cupones disponibles
  const availableCoupons = (coupons || []).filter((c) => {
    if (c.status !== "ACTIVE") return false;
    if (c.expirationDate && new Date(c.expirationDate) < new Date()) return false;
    if (c.restrictedToTierId && c.restrictedToTierId !== "ALL") {
      return c.restrictedToTierId === currentTier?.id;
    }
    return true;
  });

  // Cupones utilizados / expirados
  const usedOrExpiredCoupons = (coupons || []).filter((c) => {
    const isExpired = c.expirationDate && new Date(c.expirationDate) < new Date();
    const isInactive = c.status !== "ACTIVE";
    return isExpired || isInactive;
  });

  // User's Gift cards
  const userGiftCards = (giftCards || []).filter((g) => {
    return (
      g.recipientEmail?.toLowerCase() === currentUser.email.toLowerCase() ||
      g.purchaserEmail?.toLowerCase() === currentUser.email.toLowerCase()
    );
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCheckGiftCard = () => {
    if (!giftCardSearchCode.trim()) return;
    const card = checkGiftCard(giftCardSearchCode.trim());
    if (card) {
      setGiftCardSearchResult(
        `Tarjeta activa: Saldo disponible de $${card.currentBalance.toFixed(2)} USD (Inicial: $${(card.initialAmount ?? (card as any).initialBalance ?? 0).toFixed(2)}).`,
      );
    } else {
      setGiftCardSearchResult("No se encontró ninguna tarjeta válida con ese código.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-rose-600" />
          <h2 className="font-serif text-2xl font-bold text-stone-900">Mis Beneficios</h2>
        </div>
        <p className="text-xs text-stone-500 mt-0.5">
          Consulta y copia tus cupones de descuento, saldo en Gift Cards y privilegios de lealtad.
        </p>
      </div>

      {/* Loyalty Tier Perks Banner (Only shown when fully eligible with verified full payment) */}
      {loyaltyProgress.isEligible ? (
        <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-rose-900 via-rose-800 to-stone-900 text-white shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="font-serif text-base sm:text-lg font-bold">
                Beneficios Desbloqueados: {currentTier?.name || "Nivel Rosa"}
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30">
              {loyaltyProgress.availablePoints} puntos activos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              currentTier?.benefits ||
              (currentTier as any)?.perks || [
                "Acumulación de 0.50 pts por cada $1 en compras",
                "Atención personalizada por WhatsApp",
                "Apartado de fecha prioritaria",
              ]
            ).map((perk: string, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-start gap-2 text-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span className="text-rose-100 text-[11px] leading-snug">{perk}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl p-5 sm:p-6 bg-stone-900 text-white border border-stone-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-amber-300">
            <Lock className="w-5 h-5" />
            <h3 className="font-serif text-base font-bold text-white">
              Beneficios de Lealtad por Desbloquear
            </h3>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed max-w-2xl">
            Tus privilegios de lealtad, puntos y nivel se activarán automáticamente una vez que tu
            primer pedido cuente con pago total verificado y saldo pendiente de $0.
          </p>
        </div>
      )}

      {/* Available Coupons */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-rose-600" />
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Cupones Disponibles ({availableCoupons.length})
          </h3>
        </div>

        {availableCoupons.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center border border-rose-100 shadow-xs text-xs text-stone-500">
            No tienes cupones disponibles en este momento. Puedes canjear tus puntos en la sección
            "Mi Lealtad".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="p-4 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}% OFF`
                        : `-$${coupon.discountValue} USD`}
                    </span>
                    <h4 className="font-bold text-stone-900 text-sm mt-1.5">{coupon.title}</h4>
                    {coupon.description && (
                      <p className="text-[11px] text-stone-500 mt-0.5">{coupon.description}</p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                    <span>{coupon.code}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(coupon.code)}
                    className="px-3 py-1 bg-stone-100 hover:bg-rose-700 hover:text-white text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {coupon.expirationDate && (
                  <p className="text-[10px] text-stone-400">
                    Válido hasta: {coupon.expirationDate}
                    {coupon.minPurchaseUSD ? ` • Compra mín: $${coupon.minPurchaseUSD}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gift Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-purple-600" />
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Gift Cards & Tarjetas de Regalo
          </h3>
        </div>

        {/* User's Gift Cards */}
        {userGiftCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userGiftCards.map((card) => (
              <div
                key={card.id}
                className="p-5 rounded-3xl bg-gradient-to-br from-purple-900 to-stone-900 text-white shadow-md relative overflow-hidden space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-200 tracking-wider">
                      Tarjeta de Regalo
                    </span>
                    <h4 className="font-serif text-xl font-bold mt-1">
                      ${card.currentBalance.toFixed(2)} USD
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      card.currentBalance > 0
                        ? "bg-emerald-400/20 text-emerald-200 border border-emerald-300/30"
                        : "bg-stone-500/30 text-stone-300"
                    }`}
                  >
                    {card.currentBalance > 0 ? "Saldo Disponible" : "Agotada"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <span className="font-mono text-xs font-bold tracking-wider">{card.code}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(card.code)}
                    className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedCode === card.code ? "¡Copiado!" : "Copiar código"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-5 border border-stone-200/80 text-xs text-stone-500">
            No tienes Gift Cards registradas a tu correo electrónico. Puedes consultar el saldo de
            cualquier tarjeta que hayas recibido a continuación:
          </div>
        )}

        {/* Gift Card Balance Checker Box */}
        <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-xs space-y-3">
          <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
            Consultar Saldo de Gift Card
          </h4>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={giftCardSearchCode}
              onChange={(e) => setGiftCardSearchCode(e.target.value.toUpperCase())}
              placeholder="Ingresa el código (ej. GIFT-MONCE-100)"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCheckGiftCard}
              className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Verificar Saldo</span>
            </button>
          </div>

          {giftCardSearchResult && (
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium">
              {giftCardSearchResult}
            </div>
          )}
        </div>
      </div>

      {/* Used / Inactive Coupons */}
      {usedOrExpiredCoupons.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
            Historial de Cupones Anteriores ({usedOrExpiredCoupons.length})
          </h4>
          <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 divide-y divide-stone-200/60">
            {usedOrExpiredCoupons.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="py-2 flex items-center justify-between text-xs text-stone-400"
              >
                <span className="font-mono line-through">{c.code}</span>
                <span>{c.title}</span>
                <span className="text-[10px]">Expirado</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
