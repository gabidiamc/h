import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { GiftCard } from "../types";
import { GiftCardPreview } from "../components/GiftCardPreview";
import {
  CreditCard,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Clock,
  Heart,
  Lock,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const GiftCardsView: React.FC = () => {
  const { checkGiftCard, giftCards, setActiveTab, isAdmin, openInternalChat, siteSettings } =
    useApp();

  // Search state
  const [searchCode, setSearchCode] = useState<string>("");
  const [searchedCard, setSearchedCard] = useState<GiftCard | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Check Balance Handler
  const handleCheckBalance = (e?: React.FormEvent, directCode?: string) => {
    if (e) e.preventDefault();
    setSearchError(null);

    const rawCode = (directCode || searchCode).trim().toUpperCase();
    if (!rawCode) {
      setSearchError("Por favor ingresa los dígitos o código de tu tarjeta.");
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      // Direct lookup
      const found = checkGiftCard(rawCode);
      if (found) {
        setSearchedCard(found);
        setSearchCode(found.code);
        setSearchError(null);
      } else {
        // Fallback matching removing dashes/spaces
        const normalized = rawCode.replace(/[^A-Z0-9]/g, "");
        const fallback = giftCards.find(
          (c) =>
            c.code.toUpperCase().replace(/[^A-Z0-9]/g, "") === normalized ||
            c.code.toUpperCase() === rawCode,
        );
        if (fallback) {
          setSearchedCard(fallback);
          setSearchCode(fallback.code);
          setSearchError(null);
        } else {
          setSearchedCard(null);
          setSearchError(
            `No encontramos ninguna tarjeta activa con los dígitos "${rawCode}". Verifica el código e intenta nuevamente.`,
          );
        }
      }
      setHasSearched(true);
      setIsSearching(false);
    }, 200);
  };

  return (
    <div className="py-8 sm:py-14 bg-stone-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Title & Information */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold uppercase tracking-wider border border-rose-200 shadow-2xs">
            <CreditCard className="w-3.5 h-3.5 text-rose-600" />
            <span>Consulta Oficial de Fondos</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight leading-tight">
            Checar Saldo de Tarjeta Digital
          </h1>

          <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl mx-auto">
            Ingresa los dígitos de tu tarjeta digital {siteSettings.businessName} para consultar tus
            fondos disponibles en tiempo real y canjearlos en tu ramo de flores de listón favorito.
          </p>
        </div>

        {/* Search Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm space-y-6">
          <form onSubmit={handleCheckBalance} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                Dígitos o Código de la Tarjeta
              </label>
              <div className="relative">
                <CreditCard className="w-5 h-5 text-stone-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  value={searchCode}
                  onChange={(e) => {
                    setSearchCode(e.target.value.toUpperCase());
                    setSearchError(null);
                  }}
                  placeholder="Ej. MONSE-7A9B-482"
                  className="w-full pl-12 pr-4 py-3.5 bg-stone-50 border border-stone-300 rounded-2xl text-base sm:text-lg font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1.5">
                El código se encuentra en tu tarjeta digital o en el mensaje de entrega recibido.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-4 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? "Consultando saldo..." : "Consultar Saldo"}</span>
            </button>
          </form>

          {/* Error Message */}
          {searchError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{searchError}</p>
                <p className="text-xs text-rose-700">
                  Si crees que se trata de un error, puedes escribirle directamente a Monse por el
                  chat interno.
                </p>
              </div>
            </div>
          )}

          {/* Search Result Card */}
          <AnimatePresence>
            {hasSearched && searchedCard && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="pt-6 border-t border-stone-100 space-y-6"
              >
                {/* Visual Card Banner */}
                <div className="p-6 bg-gradient-to-br from-stone-900 via-rose-950 to-stone-900 text-white rounded-3xl border border-rose-700/40 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-rose-800/40 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-amber-200">
                        Tarjeta Digital Oficial {siteSettings.businessName}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        searchedCard.status === "active" && searchedCard.currentBalance > 0
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-stone-500/20 text-stone-300 border border-stone-500/30"
                      }`}
                    >
                      {searchedCard.status === "active" && searchedCard.currentBalance > 0
                        ? "Activa con Fondos"
                        : "Canjeada"}
                    </span>
                  </div>

                  <div className="text-center py-2">
                    <p className="text-xs text-stone-300 uppercase tracking-wider font-semibold">
                      Saldo Disponible
                    </p>
                    <p className="text-4xl sm:text-5xl font-serif font-black text-amber-300 tracking-tight mt-1">
                      ${searchedCard.currentBalance.toFixed(2)} USD
                    </p>
                    <p className="text-xs text-stone-300 mt-1">
                      Monto original emitido: ${searchedCard.initialAmount.toFixed(2)} USD
                    </p>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex justify-between items-center py-0.5 border-b border-white/10">
                      <span className="text-stone-300">Código de Tarjeta:</span>
                      <span className="font-mono font-bold text-white text-sm tracking-wider">
                        {searchedCard.code}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-white/10">
                      <span className="text-stone-300">Destinatario / Beneficiario:</span>
                      <span className="font-semibold text-white">{searchedCard.recipientName}</span>
                    </div>
                    {searchedCard.purchaserName && (
                      <div className="flex justify-between items-center py-0.5 border-b border-white/10">
                        <span className="text-stone-300">Emitido por:</span>
                        <span className="font-medium text-white">{searchedCard.purchaserName}</span>
                      </div>
                    )}
                    {searchedCard.expiresAt && (
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-stone-300">Vigencia:</span>
                        <span className="text-white font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-300" />
                          {new Date(searchedCard.expiresAt).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {searchedCard.personalMessage && (
                    <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs italic text-rose-100 flex items-start gap-2">
                      <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 fill-rose-400" />
                      <span>"{searchedCard.personalMessage}"</span>
                    </div>
                  )}

                  {/* Primary CTA */}
                  {searchedCard.currentBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("productos")}
                      className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-2xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Usar mi Saldo en el Catálogo de Ramos</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Redemption History if any */}
                {searchedCard.redemptionHistory && searchedCard.redemptionHistory.length > 0 && (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
                    <h5 className="font-bold text-stone-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Historial de movimientos:</span>
                    </h5>
                    <div className="space-y-1.5">
                      {searchedCard.redemptionHistory.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1 border-b border-stone-200/60 last:border-0"
                        >
                          <div>
                            <span className="font-medium text-stone-700">
                              {h.note || "Canje de saldo"}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              {new Date(h.date).toLocaleDateString("es-MX")}
                            </span>
                          </div>
                          <span className="font-bold text-rose-700">
                            -${h.amountUsed.toFixed(2)} USD
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3 Simple Steps to Redeem */}
        <div className="pt-6 border-t border-stone-200/70">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              ¿Cómo usar tu saldo en {siteSettings.businessName}?
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Es muy sencillo aplicar los fondos de tu tarjeta en cualquier pedido
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-700 font-bold text-sm flex items-center justify-center mx-auto">
                1
              </div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                Consulta tus Fondos
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Ingresa los dígitos de tu tarjeta digital arriba para confirmar tu saldo disponible.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-700 font-bold text-sm flex items-center justify-center mx-auto">
                2
              </div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                Elige tu Ramo
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Visita nuestro catálogo de flores de listón satinado y añade tus diseños favoritos
                al carrito.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-700 font-bold text-sm flex items-center justify-center mx-auto">
                3
              </div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                Aplica tu Código
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Escribe tu código en el carrito antes de reservar; el saldo se descontará de tu
                total automáticamente.
              </p>
            </div>
          </div>
        </div>

        {/* Administration Note: Gift Cards only created by Owner */}
        <div className="bg-stone-100 rounded-2xl p-4 sm:p-5 text-center text-xs text-stone-500 space-y-2">
          <p className="flex items-center justify-center gap-1.5 text-stone-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-rose-700" />
            <span>
              Las tarjetas de regalo son emitidas y acreditadas exclusivamente por la administración
              de {siteSettings.businessName}.
            </span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
            <button
              type="button"
              onClick={() =>
                openInternalChat(
                  `¡Hola! Me gustaría solicitar una tarjeta de regalo digital en ${siteSettings.businessName}.`,
                )
              }
              className="text-rose-700 hover:text-rose-800 font-semibold cursor-pointer underline flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Solicitar tarjeta por chat</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab("admin")}
                className="text-amber-700 hover:text-amber-800 font-bold cursor-pointer underline flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Emitir tarjetas en Panel Dueña</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
