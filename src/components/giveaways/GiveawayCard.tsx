import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Gift,
  Clock,
  Users,
  Calendar,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { Giveaway, GiveawayEntry, GiveawayWinner, formatPublicWinnerName } from "../../types";
import { useApp } from "../../context/AppContext";
import { ContactOwnerModal } from "./ContactOwnerModal";

interface GiveawayCardProps {
  giveaway: Giveaway;
  onOpenAuth?: () => void;
}

export const GiveawayCard: React.FC<GiveawayCardProps> = ({ giveaway, onOpenAuth }) => {
  const { currentUser, giveawayEntries, giveawayWinners, participateInGiveaway, showToast } =
    useApp();

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  const [isParticipating, setIsParticipating] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Entries for this giveaway
  const currentEntries = giveawayEntries.filter(
    (e) => e.giveawayId === giveaway.id && e.status === "VALID",
  );
  const participantCount = currentEntries.length;
  const maxCapacity = giveaway.maxParticipants || 50;
  const isFull = participantCount >= maxCapacity;

  // Has current user entered?
  const hasUserParticipated = currentUser
    ? currentEntries.some((e) => e.userId === currentUser.id)
    : false;

  // Winner for this giveaway (if ended)
  const winner = giveawayWinners.find((w) => w.giveawayId === giveaway.id);

  // Countdown timer calculation
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(giveaway.endAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [giveaway.endAt]);

  const handleParticipate = async () => {
    if (!currentUser) {
      showToast({
        title: "Inicia sesión para participar",
        subtitle: "Crea tu cuenta o inicia sesión gratis para registrar tu participación.",
      });
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (hasUserParticipated) {
      showToast({
        title: "Ya estás participando",
        subtitle: "Tu registro está seguro en el sistema. ¡Te deseamos mucho éxito!",
      });
      return;
    }

    if (isFull) {
      showToast({
        title: "Cupos agotados",
        subtitle: "Este sorteo ha completado el límite máximo de participantes.",
      });
      return;
    }

    if (timeLeft.isExpired || giveaway.status !== "ACTIVE") {
      showToast({
        title: "Sorteo finalizado",
        subtitle: "El período de inscripción para este sorteo ha terminado.",
      });
      return;
    }

    setIsParticipating(true);
    try {
      const res = await participateInGiveaway(giveaway.id);
      if (res.success) {
        showToast({
          title: "¡Inscripción Confirmada! 🎁",
          subtitle: res.message,
        });
      } else {
        showToast({
          title: "No se pudo registrar",
          subtitle: res.message,
        });
      }
    } catch (err: any) {
      showToast({
        title: "Error de inscripción",
        subtitle: err.message || "Por favor intenta de nuevo.",
      });
    } finally {
      setIsParticipating(false);
    }
  };

  const formattedPrizeAmount =
    giveaway.prizeType === "gift_card"
      ? `$${giveaway.prizeAmount}.00 USD`
      : giveaway.prizeType === "discount"
        ? `${giveaway.prizeAmount}% Descuento`
        : `Valor $${giveaway.prizeAmount} USD`;

  const endDateFormatted = new Date(giveaway.endAt).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isEnded =
    giveaway.status === "ENDED" || (timeLeft.isExpired && giveaway.status !== "ACTIVE");

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="group relative bg-white rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
    >
      {/* Top Banner & Status Indicator */}
      <div className="relative aspect-16/10 sm:aspect-16/9 overflow-hidden bg-stone-100">
        <img
          src={
            giveaway.imageUrl ||
            "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80"
          }
          alt={giveaway.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />

        {/* Floating Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-xs backdrop-blur-md ${
              isEnded
                ? "bg-stone-900/90 text-stone-200 border border-stone-700"
                : "bg-rose-900/90 text-rose-200 border border-rose-500/40"
            }`}
          >
            {isEnded ? (
              <>
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>FINALIZADO</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-rose-300 animate-pulse" />
                <span>SORTEO OFICIAL</span>
              </>
            )}
          </span>

          <span className="px-2.5 py-1 rounded-full bg-white/95 text-stone-900 text-[11px] font-extrabold shadow-sm">
            {giveaway.prizeType === "gift_card"
              ? "Tarjeta de Regalo"
              : giveaway.prizeType === "product"
                ? "Ramo Físico"
                : "Cupón Descuento"}
          </span>
        </div>

        {/* Prize Overlay Box */}
        <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
          <div className="text-[11px] font-extrabold tracking-wider uppercase text-rose-300 drop-shadow-xs">
            Premio: {formattedPrizeAmount}
          </div>
          <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug drop-shadow-md text-white line-clamp-1">
            {giveaway.prizeName}
          </h3>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900 line-clamp-1 group-hover:text-rose-900 transition-colors">
            {giveaway.title}
          </h4>
          <p className="text-stone-600 text-xs sm:text-sm mt-1.5 line-clamp-2 leading-relaxed">
            {giveaway.description}
          </p>

          {giveaway.requirements && (
            <div className="mt-3 p-2.5 bg-stone-50 rounded-xl border border-stone-150 text-[11px] text-stone-600 flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span className="line-clamp-2">
                <strong className="text-stone-800">Requisitos:</strong> {giveaway.requirements}
              </span>
            </div>
          )}
        </div>

        {/* Section: Winner or Active Countdown */}
        {isEnded && (winner || giveaway.winnerDisplayName) ? (
          /* Privacy-preserved Winner Notice */
          <div className="p-4 bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center shrink-0">
                {winner?.avatarUrl ? (
                  <img
                    src={winner.avatarUrl}
                    alt={winner.publicName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Trophy className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                  <span>🏆 ¡Tenemos ganador/a!</span>
                </div>
                <div className="font-serif text-sm font-bold text-stone-900">
                  {winner?.publicName ||
                    formatPublicWinnerName(giveaway.winnerDisplayName || "Cliente Ganador")}
                </div>
                <div className="text-[11px] text-stone-600">
                  Ganó <span className="font-semibold text-rose-900">{giveaway.prizeName}</span>
                </div>
              </div>
            </div>

            {/* Contact Owner Button */}
            <button
              type="button"
              onClick={() => setIsContactModalOpen(true)}
              className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-rose-300" />
              <span>Contactar a la dueña</span>
            </button>
          </div>
        ) : (
          /* Active Sorteo Metadata & Countdown */
          <div className="space-y-3">
            {/* Participants Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-600 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-stone-400" />
                  <span>Participantes</span>
                </span>
                <span className="text-stone-900 font-bold">
                  {participantCount} / {maxCapacity} cupos
                </span>
              </div>
              <div className="w-full h-2 bg-stone-150 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-700 transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((participantCount / maxCapacity) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Live Countdown Grid */}
            <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-150">
              <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-rose-500" />
                  <span>Termina: {endDateFormatted}</span>
                </span>
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                  Cierre
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="bg-white py-1.5 px-1 rounded-xl border border-stone-200/80 shadow-2xs">
                  <div className="font-mono text-sm sm:text-base font-extrabold text-stone-900">
                    {String(timeLeft.days).padStart(2, "0")}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-stone-400">Días</div>
                </div>
                <div className="bg-white py-1.5 px-1 rounded-xl border border-stone-200/80 shadow-2xs">
                  <div className="font-mono text-sm sm:text-base font-extrabold text-stone-900">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-stone-400">Horas</div>
                </div>
                <div className="bg-white py-1.5 px-1 rounded-xl border border-stone-200/80 shadow-2xs">
                  <div className="font-mono text-sm sm:text-base font-extrabold text-stone-900">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-stone-400">Min</div>
                </div>
                <div className="bg-white py-1.5 px-1 rounded-xl border border-stone-200/80 shadow-2xs">
                  <div className="font-mono text-sm sm:text-base font-extrabold text-rose-600">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-stone-400">Seg</div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            {hasUserParticipated ? (
              <div className="w-full py-3 px-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>¡Ya estás participando en este sorteo!</span>
              </div>
            ) : isFull ? (
              <div className="w-full py-3 px-4 bg-stone-100 text-stone-500 rounded-2xl text-xs font-bold text-center">
                Cupo de participantes agotado
              </div>
            ) : isEnded ? (
              <div className="w-full py-3 px-4 bg-stone-100 text-stone-500 rounded-2xl text-xs font-bold text-center">
                Sorteo finalizado
              </div>
            ) : (
              <button
                type="button"
                onClick={handleParticipate}
                disabled={isParticipating}
                className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-rose-200/60 hover:shadow-lg hover:shadow-rose-300 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isParticipating ? (
                  <span>Registrando participación...</span>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>PARTICIPAR EN EL SORTEO</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Private Contact Modal */}
      <ContactOwnerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        giveaway={giveaway}
      />
    </motion.article>
  );
};
