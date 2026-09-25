import React, { useState } from "react";
import { motion } from "motion/react";
import { Gift, Tag, Sparkles, Copy, Check, Percent, ArrowRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { GiveawayCard } from "./GiveawayCard";

interface HomeGiveawaysSectionProps {
  onOpenAuth?: () => void;
}

export const HomeGiveawaysSection: React.FC<HomeGiveawaysSectionProps> = ({ onOpenAuth }) => {
  const { giveaways, discounts, showToast } = useApp();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Active giveaways with showOnHomepage enabled
  const activeGiveaways = (giveaways || []).filter((g) => {
    if (!g.showOnHomepage) return false;
    // Show active giveaways OR recently ended with winner to celebrate the winner
    if (g.status === "ACTIVE") return true;
    if (g.status === "ENDED" && (g.winnerDisplayName || g.winnerUserId)) return true;
    return false;
  });

  // Active discounts with showOnHomepage enabled
  const activeDiscounts = (discounts || []).filter(
    (d) => d.showOnHomepage && d.status === "ACTIVE",
  );

  // If no items are active for homepage display, hide section completely
  if (activeGiveaways.length === 0 && activeDiscounts.length === 0) {
    return null;
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast({
      title: "Cupón copiado al portapapeles",
      subtitle: `Aplica el código "${code}" al finalizar tu pedido.`,
    });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <section
      id="seccion-sorteos-promociones"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
    >
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/70 text-rose-800 text-xs font-bold mb-3 shadow-2xs">
          <Gift className="w-3.5 h-3.5 text-rose-600" />
          <span>🎁 Sorteos y promociones</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">
          Premios Especiales & Beneficios Exclusivos
        </h2>
        <p className="mt-2 text-stone-600 text-xs sm:text-sm max-w-xl mx-auto">
          Participa gratis en nuestras dinámicas oficiales del taller y aprovecha los descuentos de
          temporada para tus rosas eternas y obsequios.
        </p>
      </div>

      {/* Giveaways Grid */}
      {activeGiveaways.length > 0 && (
        <div className="mb-10">
          <div
            className={`grid gap-6 ${
              activeGiveaways.length === 1
                ? "max-w-xl mx-auto grid-cols-1"
                : activeGiveaways.length === 2
                  ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {activeGiveaways.map((giveaway) => (
              <GiveawayCard key={giveaway.id} giveaway={giveaway} onOpenAuth={onOpenAuth} />
            ))}
          </div>
        </div>
      )}

      {/* Homepage Promotional Discounts / Coupons Bar */}
      {activeDiscounts.length > 0 && (
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDiscounts.map((discount) => (
              <motion.div
                key={discount.id}
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-rose-900 via-rose-950 to-stone-900 text-white rounded-2xl p-4 sm:p-5 border border-rose-500/20 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-rose-300 tracking-wider">
                      <Tag className="w-3 h-3" />
                      <span>Promoción Oficial</span>
                    </span>
                    <h4 className="font-serif text-base sm:text-lg font-bold text-white mt-1">
                      {discount.name}
                    </h4>
                  </div>
                  <div className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-200 border border-rose-400/30 text-xs font-mono font-bold shrink-0">
                    {discount.type === "percentage"
                      ? `${discount.value}% OFF`
                      : `$${discount.value} USD`}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-stone-300">
                    {discount.minimumPurchase > 0 ? (
                      <span>Compra mín: ${discount.minimumPurchase} USD</span>
                    ) : (
                      <span>Sin compra mínima</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(discount.code)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-stone-900 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    title="Copiar código de descuento"
                  >
                    {copiedCode === discount.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-600" />
                        <span className="font-mono">{discount.code}</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
