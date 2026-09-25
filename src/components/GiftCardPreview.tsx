import React from "react";
import { GiftCardTheme } from "../types";
import { Sparkles, Copy, Check, Heart, Gift } from "lucide-react";
import { useApp } from "../context/AppContext";

interface GiftCardPreviewProps {
  amount: number;
  balance?: number;
  currency?: string;
  recipientName: string;
  purchaserName: string;
  personalMessage: string;
  code?: string;
  theme: GiftCardTheme;
  status?: string;
  expiresAt?: string;
  showCopyButton?: boolean;
}

export const GiftCardPreview: React.FC<GiftCardPreviewProps> = ({
  amount,
  balance,
  currency = "USD",
  recipientName,
  purchaserName,
  personalMessage,
  code = "LAZO-••••-••••",
  theme,
  status,
  expiresAt,
  showCopyButton = true,
}) => {
  const { siteSettings } = useApp();
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!code || code.includes("•")) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Theme-specific styles and ribbons
  const themeStyles: Record<
    GiftCardTheme,
    {
      cardBg: string;
      accentBorder: string;
      textPrimary: string;
      textSecondary: string;
      badgeBg: string;
      ribbonColor: string;
      codeBoxBg: string;
      chipLabel: string;
    }
  > = {
    romantic_rose: {
      cardBg: "bg-gradient-to-br from-rose-900 via-rose-950 to-stone-950 text-white",
      accentBorder: "border-rose-400/30 ring-1 ring-rose-300/20",
      textPrimary: "text-rose-100",
      textSecondary: "text-rose-200/80",
      badgeBg: "bg-rose-500/20 text-rose-200 border-rose-400/30",
      ribbonColor: "from-rose-400 to-rose-600",
      codeBoxBg: "bg-rose-950/70 border-rose-400/30 text-rose-100",
      chipLabel: "Rosa Romántica",
    },
    golden_elegance: {
      cardBg: "bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900 text-white",
      accentBorder: "border-amber-400/40 ring-1 ring-amber-300/30",
      textPrimary: "text-amber-100",
      textSecondary: "text-amber-200/80",
      badgeBg: "bg-amber-500/20 text-amber-200 border-amber-400/30",
      ribbonColor: "from-amber-300 to-amber-600",
      codeBoxBg: "bg-amber-950/80 border-amber-400/30 text-amber-100",
      chipLabel: "Oro Satinado",
    },
    lavender_dream: {
      cardBg: "bg-gradient-to-br from-purple-950 via-slate-900 to-violet-950 text-white",
      accentBorder: "border-violet-400/30 ring-1 ring-violet-300/20",
      textPrimary: "text-purple-100",
      textSecondary: "text-purple-200/80",
      badgeBg: "bg-violet-500/20 text-violet-200 border-violet-400/30",
      ribbonColor: "from-violet-400 to-purple-600",
      codeBoxBg: "bg-purple-950/70 border-violet-400/30 text-purple-100",
      chipLabel: "Lavanda Etérea",
    },
    velvet_noir: {
      cardBg: "bg-gradient-to-br from-stone-950 via-stone-900 to-neutral-900 text-white",
      accentBorder: "border-rose-400/40 ring-1 ring-rose-400/30",
      textPrimary: "text-stone-100",
      textSecondary: "text-stone-300/80",
      badgeBg: "bg-white/10 text-rose-300 border-rose-400/40",
      ribbonColor: "from-rose-400 to-pink-600",
      codeBoxBg: "bg-stone-900/90 border-rose-400/30 text-rose-200",
      chipLabel: "Velvet Noir",
    },
  };

  const currentTheme = themeStyles[theme] || themeStyles.romantic_rose;
  const displayAmount = balance !== undefined ? balance : amount;

  return (
    <div
      id="digital-gift-card"
      className={`relative w-full aspect-[1.58/1] min-h-[220px] sm:min-h-[260px] rounded-2xl p-5 sm:p-7 shadow-xl overflow-hidden transition-all duration-300 flex flex-col justify-between border ${currentTheme.cardBg} ${currentTheme.accentBorder}`}
    >
      {/* Decorative Ribbon & Satin Glow Elements */}
      <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-white/5 blur-xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-rose-500/10 blur-xl pointer-events-none" />

      {/* Satin Ribbon Band across top right corner */}
      <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none">
        <div
          className={`absolute transform rotate-45 bg-gradient-to-r ${currentTheme.ribbonColor} text-white text-[9px] sm:text-[10px] font-bold py-1 right-[-35px] top-[22px] w-[130px] text-center shadow-md tracking-wider uppercase`}
        >
          {siteSettings?.businessName || "Hecho Por Monse"}
        </div>
      </div>

      {/* Header: Brand & Amount */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-300" />
            <span className="text-[10px] sm:text-xs tracking-widest uppercase font-semibold text-white/70">
              Tarjeta de Regalo Digital
            </span>
          </div>
          <h3 className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-white drop-shadow-xs">
            {siteSettings?.businessName || "Hecho Por Monse"}
          </h3>
          <p className="text-[10px] sm:text-xs text-white/60">Ramos Satinados & Regalos Eternos</p>
        </div>

        <div className="text-right pr-6 sm:pr-8">
          <span className="text-[10px] uppercase tracking-wider text-white/70 block">
            {balance !== undefined && balance !== amount ? "Saldo Disponible" : "Valor"}
          </span>
          <div className="font-serif text-xl sm:text-3xl font-extrabold text-white tracking-tight">
            $
            {displayAmount.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            <span className="text-xs sm:text-sm font-sans font-normal text-white/80">
              {currency}
            </span>
          </div>
          {balance !== undefined && balance !== amount && (
            <span className="text-[10px] text-white/50 block">
              Original: ${amount.toFixed(2)} {currency}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Recipient & Personal Dedication Message */}
      <div className="my-auto py-2 relative z-10">
        <div className="flex items-center gap-1.5 mb-1 text-xs font-medium text-white/90">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />
          <span>
            Para:{" "}
            <strong className="text-white font-bold">
              {recipientName || "Esa persona especial"}
            </strong>
          </span>
          {purchaserName && (
            <span className="text-white/60 ml-1">
              • De: <strong className="text-white/90 font-medium">{purchaserName}</strong>
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm italic font-serif text-white/80 line-clamp-2 pl-5 border-l-2 border-rose-400/40 leading-snug">
          "
          {personalMessage ||
            "Un detalle eterno hecho a mano especialmente para ti, para que elijas tu ramo o caja sorpresa favorita."}
          "
        </p>
      </div>

      {/* Bottom: Unique Code, Status & Expiry */}
      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border font-mono text-xs sm:text-sm font-bold tracking-widest flex items-center gap-2 ${currentTheme.codeBoxBg}`}
          >
            <Gift className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span>{code}</span>
            {showCopyButton && !code.includes("•") && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="hover:opacity-80 transition-opacity p-0.5 ml-1 text-white/80 hover:text-white cursor-pointer"
                title="Copiar código de tarjeta"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
          {copied && <span className="text-[10px] text-emerald-300 font-medium">¡Copiado!</span>}
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/60">
          {status && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                status === "active"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                  : status === "partially_used"
                    ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-400/30"
              }`}
            >
              {status === "active"
                ? "Válida"
                : status === "partially_used"
                  ? "Saldo Parcial"
                  : "Agotada"}
            </span>
          )}
          <span>
            {expiresAt
              ? `Vence: ${new Date(expiresAt).toLocaleDateString("es-MX", { month: "short", year: "numeric" })}`
              : "Válida por 1 año"}
          </span>
        </div>
      </div>
    </div>
  );
};
