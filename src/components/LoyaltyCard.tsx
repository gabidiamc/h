import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Award,
  Crown,
  Gem,
  Star,
  ShieldCheck,
  CheckCircle2,
  Gift,
  QrCode,
  Info,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { CustomerLoyaltyProgress, LoyaltyTier } from "../types";

interface LoyaltyCardProps {
  progress: CustomerLoyaltyProgress;
  tiers?: LoyaltyTier[];
  showActions?: boolean;
  onRedeemPoints?: () => void;
  compact?: boolean;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({
  progress,
  tiers = [],
  showActions = true,
  onRedeemPoints,
  compact = false,
}) => {
  const [showBack, setShowBack] = useState(false);
  const {
    currentTier,
    nextTier,
    availablePoints,
    accumulatedPoints,
    progressPercentage,
    pointsNeededForNextTier,
  } = progress;

  // Visual themes configuration for all 6 tiers
  const getThemeStyles = () => {
    switch (currentTier.cardTheme) {
      case "vip_elite":
        return {
          bg: "bg-gradient-to-br from-neutral-950 via-stone-900 to-zinc-950",
          border: "border-amber-400/40 shadow-2xl shadow-amber-500/10",
          foil: "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent",
          textColor: "text-amber-100",
          subText: "text-amber-300/80",
          badgeBg:
            "bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border border-amber-400/50 text-amber-200",
          accentColor: "text-amber-400",
          progressBg: "bg-amber-400",
          chipBg: "from-amber-300 to-yellow-600",
          icon: "⚜️",
        };
      case "vip_royal":
        return {
          bg: "bg-gradient-to-br from-purple-950 via-fuchsia-950 to-slate-950",
          border: "border-fuchsia-400/30 shadow-2xl shadow-purple-900/20",
          foil: "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-fuchsia-400/20 via-transparent to-transparent",
          textColor: "text-fuchsia-50",
          subText: "text-fuchsia-200/80",
          badgeBg:
            "bg-gradient-to-r from-fuchsia-500/30 to-purple-500/20 border border-fuchsia-400/40 text-fuchsia-200",
          accentColor: "text-fuchsia-300",
          progressBg: "bg-fuchsia-400",
          chipBg: "from-fuchsia-300 to-purple-600",
          icon: "🌟",
        };
      case "black_diamond":
        return {
          bg: "bg-gradient-to-br from-slate-950 via-zinc-900 to-cyan-950",
          border: "border-cyan-400/30 shadow-2xl shadow-cyan-900/20",
          foil: "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent",
          textColor: "text-cyan-50",
          subText: "text-cyan-200/80",
          badgeBg:
            "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-200",
          accentColor: "text-cyan-300",
          progressBg: "bg-cyan-400",
          chipBg: "from-cyan-200 to-blue-600",
          icon: "💎",
        };
      case "imperial_gold":
        return {
          bg: "bg-gradient-to-br from-amber-700 via-amber-600 to-yellow-700",
          border: "border-yellow-200/50 shadow-2xl shadow-amber-900/30",
          foil: "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-200/30 via-transparent to-transparent",
          textColor: "text-yellow-50",
          subText: "text-yellow-100/90",
          badgeBg: "bg-yellow-900/40 border border-yellow-200/40 text-yellow-100",
          accentColor: "text-yellow-200",
          progressBg: "bg-yellow-300",
          chipBg: "from-yellow-100 to-amber-500",
          icon: "👑",
        };
      case "silver_velvet":
        return {
          bg: "bg-gradient-to-br from-slate-700 via-zinc-600 to-stone-700",
          border: "border-slate-300/50 shadow-2xl shadow-zinc-900/30",
          foil: "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-200/30 via-transparent to-transparent",
          textColor: "text-slate-50",
          subText: "text-slate-200/90",
          badgeBg: "bg-slate-900/40 border border-slate-300/40 text-slate-100",
          accentColor: "text-slate-200",
          progressBg: "bg-slate-200",
          chipBg: "from-slate-100 to-zinc-400",
          icon: "✨",
        };
      case "rose_gold":
      default:
        return {
          bg: "bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700",
          border: "border-rose-200/40 shadow-2xl shadow-rose-900/20",
          foil: "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent",
          textColor: "text-rose-50",
          subText: "text-rose-100/90",
          badgeBg: "bg-rose-900/40 border border-rose-200/40 text-rose-100",
          accentColor: "text-pink-200",
          progressBg: "bg-rose-200",
          chipBg: "from-rose-100 to-pink-300",
          icon: "🌸",
        };
    }
  };

  const theme = getThemeStyles();
  const memberCode =
    progress.memberNumber || `HPM-${(progress.customerId || "000").slice(-4).toUpperCase()}`;

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* 3D Card Container */}
      <div className="perspective-1000">
        <motion.div
          animate={{ rotateY: showBack ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", damping: 20 }}
          className="relative w-full rounded-3xl p-6 sm:p-7 transition-all duration-300 preserve-3d"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Card Front */}
          <div
            className={`${theme.bg} ${theme.border} ${theme.textColor} rounded-3xl border p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md`}
          >
            {/* Holographic light effect */}
            <div className={`absolute inset-0 pointer-events-none ${theme.foil}`} />
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-black/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top row: Brand & Level Badge */}
            <div className="relative z-10 flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white drop-shadow-sm">
                    Hecho por Monse
                  </span>
                  <span className="inline-flex items-center justify-center p-1 rounded-full bg-white/10 text-xs">
                    ✨
                  </span>
                </div>
                <p
                  className={`text-xs ${theme.subText} tracking-wider uppercase font-medium mt-0.5`}
                >
                  Club de Lealtad & Flores Eternas
                </p>
              </div>

              <div className="flex flex-col items-end">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${theme.badgeBg} shadow-sm backdrop-blur-sm`}
                >
                  <span>{theme.icon}</span>
                  <span>Nivel {currentTier.name}</span>
                </span>
                <span className="text-[10px] opacity-75 mt-1 font-mono tracking-widest">
                  {memberCode}
                </span>
              </div>
            </div>

            {/* Middle row: Microchip + Available Points */}
            <div className="relative z-10 flex items-center justify-between my-4 py-2 border-y border-white/10">
              {/* Decorative EMV Chip */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-8 rounded-md bg-gradient-to-tr ${theme.chipBg} p-1 shadow-inner relative flex flex-col justify-between overflow-hidden border border-black/20`}
                >
                  <div className="w-full h-0.5 bg-black/30 rounded" />
                  <div className="w-2/3 h-0.5 bg-black/30 rounded self-center" />
                  <div className="w-full h-0.5 bg-black/30 rounded" />
                </div>
                <div>
                  <p className="text-[10px] opacity-70 uppercase tracking-wider">
                    Puntos Disponibles
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-white drop-shadow-sm">
                    {availablePoints.toLocaleString()}{" "}
                    <span className="text-xs font-sans font-semibold opacity-80">pts</span>
                  </p>
                </div>
              </div>

              {/* Points accumulation status */}
              <div className="text-right">
                <p className="text-[10px] opacity-70 uppercase tracking-wider">Estado Club</p>
                <p className={`text-base sm:text-lg font-extrabold ${theme.accentColor} font-sans`}>
                  Acumulación
                </p>
                <span className="text-[9px] text-white/80 block">Canjes a futuro</span>
              </div>
            </div>

            {/* Member Details */}
            <div className="relative z-10 flex items-end justify-between mt-5 pt-1">
              <div>
                <p className="text-[10px] opacity-70 uppercase tracking-wider">
                  Titular de la Membresía
                </p>
                <p className="text-sm sm:text-base font-semibold text-white tracking-wide truncate max-w-[220px]">
                  {progress.customerName || "Cliente Distinguido"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] opacity-70 uppercase tracking-wider">Puntos Acumulados</p>
                <p className="text-xs sm:text-sm font-medium opacity-90 font-mono">
                  {accumulatedPoints.toLocaleString()} pts totales
                </p>
              </div>
            </div>

            {/* Bottom Progress Bar to next tier */}
            {nextTier && (
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 opacity-85 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Progreso a Nivel <strong className="text-white">{nextTier.name}</strong>
                  </span>
                  <span className="font-bold text-white font-mono">{progressPercentage}%</span>
                </div>

                {/* Bar */}
                <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden p-0.5 backdrop-blur-xs border border-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(5, progressPercentage))}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${theme.progressBg} shadow-sm`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] opacity-75 mt-1.5">
                  <span>
                    {pointsNeededForNextTier > 0 ? (
                      <>
                        Faltan{" "}
                        <strong className="text-white font-mono">
                          {pointsNeededForNextTier} pts
                        </strong>
                      </>
                    ) : (
                      "¡Pronto calificarás!"
                    )}
                  </span>
                  <span>Meta: {nextTier.requiredPoints} pts</span>
                </div>
              </div>
            )}

            {!nextTier && (
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 text-center text-xs opacity-90 font-medium flex items-center justify-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-300" />
                <span>
                  ¡Estatus Máximo Alcanzado! Disfrutas de todos los privilegios exclusivos de Hecho
                  por Monse.
                </span>
              </div>
            )}

            {/* Flip / Details trigger */}
            <div className="relative z-10 flex items-center justify-between mt-5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowBack(!showBack)}
                className="text-[11px] font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                {showBack ? "Ver Frente de la Tarjeta" : "Ver Beneficios & Términos"}
              </button>

              {showActions && (
                <div className="px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-[11px] font-semibold text-white flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Acumulando puntos</span>
                </div>
              )}
            </div>
          </div>

          {/* Card Back / Benefits Drawer */}
          <AnimatePresence>
            {showBack && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{theme.icon}</span>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                      Beneficios Desbloqueados: Nivel {currentTier.name}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBack(false)}
                    className="text-xs text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
                  >
                    Cerrar ✕
                  </button>
                </div>

                <ul className="space-y-2.5 mb-5">
                  {currentTier.benefits.map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-stone-50 dark:bg-stone-800/60 rounded-2xl p-4 border border-stone-200/60 dark:border-stone-700/60 text-[11px] text-stone-600 dark:text-stone-400 space-y-1.5">
                  <p className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                    Reglas del Club de Lealtad Hecho por Monse:
                  </p>
                  <p>
                    • Acumulas 0.50 puntos por cada $1 USD en compras efectivamente aprobadas y
                    verificadas.
                  </p>
                  <p>
                    • Los puntos se acreditan inmediatamente cuando la artesana confirma tu anticipo
                    o liquidación.
                  </p>
                  <p>
                    • Todos tus puntos se conservan al 100% en tu perfil para ser canjeados más adelante cuando se activen las recompensas.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
