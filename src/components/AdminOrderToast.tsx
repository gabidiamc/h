import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ShoppingBag,
  Calendar,
  MapPin,
  ExternalLink,
  X,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Phone,
  ArrowRight,
  Eye,
  Clock,
  DollarSign,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { AdminOrderAlert } from "../types";

interface AdminOrderToastProps {
  onInspectOrder?: (orderId: string) => void;
}

export const AdminOrderToast: React.FC<AdminOrderToastProps> = ({ onInspectOrder }) => {
  const {
    adminOrderAlerts,
    dismissAdminOrderAlert,
    clearAllAdminOrderAlerts,
    adminSoundEnabled,
    toggleAdminSound,
    setActiveTab,
    setSelectedOrderId,
    isAdmin,
  } = useApp();

  // If not admin, don't show admin alerts on client screen
  if (!isAdmin || !adminOrderAlerts || adminOrderAlerts.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Notificaciones de pedidos en tiempo real"
      className="fixed top-5 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-md w-[calc(100vw-2rem)] pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {adminOrderAlerts.slice(0, 3).map((alert, index) => (
          <SingleOrderToast
            key={alert.id}
            alert={alert}
            isTop={index === 0}
            totalInQueue={adminOrderAlerts.length}
            soundEnabled={adminSoundEnabled}
            onToggleSound={toggleAdminSound}
            onDismiss={() => dismissAdminOrderAlert(alert.id)}
            onClearAll={clearAllAdminOrderAlerts}
            onInspect={() => {
              if (onInspectOrder) {
                onInspectOrder(alert.orderId);
              } else {
                setSelectedOrderId(alert.orderId);
                setActiveTab("admin");
              }
              dismissAdminOrderAlert(alert.id);
            }}
          />
        ))}
      </AnimatePresence>
    </aside>
  );
};

interface SingleOrderToastProps {
  alert: AdminOrderAlert;
  isTop: boolean;
  totalInQueue: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onDismiss: () => void;
  onClearAll: () => void;
  onInspect: () => void;
}

const SingleOrderToast: React.FC<SingleOrderToastProps> = ({
  alert,
  isTop,
  totalInQueue,
  soundEnabled,
  onToggleSound,
  onDismiss,
  onClearAll,
  onInspect,
}) => {
  const DURATION_MS = 10000; // 10 seconds default
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(100);

  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(DURATION_MS);
  const timerIdRef = useRef<any>(null);

  // Countdown timer with pause on hover
  useEffect(() => {
    if (isPaused) {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    const initialRemaining = remainingTimeRef.current;

    timerIdRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentRemaining = Math.max(0, initialRemaining - elapsed);
      remainingTimeRef.current = currentRemaining;

      const pct = (currentRemaining / DURATION_MS) * 100;
      setProgress(pct);

      if (currentRemaining <= 0) {
        clearInterval(timerIdRef.current);
        onDismiss();
      }
    }, 50);

    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
    };
  }, [isPaused, onDismiss]);

  const handleCopySummary = () => {
    const text = `🌸 Nueva Reserva #${alert.orderNumber}\nCliente: ${alert.customerName}\nFecha: ${alert.scheduledDate}\nEntrega: ${alert.deliveryMethod === "ENVIO" ? "Envío a domicilio" : "Retiro en taller"}\nTotal: $${alert.totalPrice} USD (Anticipo: $${alert.requiredDeposit} USD)`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="pointer-events-auto bg-white/98 backdrop-blur-md rounded-3xl shadow-2xl border border-rose-200/90 overflow-hidden relative group text-stone-900"
      style={{
        boxShadow: "0 20px 35px -8px rgba(136, 19, 55, 0.16), 0 8px 16px -6px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Decorative accent gradient strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500" />

      <div className="p-4 sm:p-4.5 space-y-3">
        {/* Top bar: Live indicator badge, audio toggle, dismiss */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
              </span>
              {alert.isCustomRequest ? "Nueva Solicitud de Reserva" : "¡Nueva Compra en Vivo!"}
            </span>

            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {alert.timestamp || "Ahora"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSound}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
              title={soundEnabled ? "Silenciar alertas de audio" : "Activar timbre de alertas"}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-stone-400" />
              )}
            </button>

            <button
              onClick={onDismiss}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex items-start gap-3">
          {/* Thumbnail / Icon */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-stone-50 border border-stone-200/90 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            {alert.itemImage ? (
              <img
                src={alert.itemImage}
                alt="Foto del pedido"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <ShoppingBag className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-1">
              <h4 className="font-serif text-sm font-bold text-stone-900 truncate">
                {alert.customerName}
              </h4>
              <span className="font-mono text-xs font-bold text-rose-700 shrink-0">
                #{alert.orderNumber}
              </span>
            </div>

            <p className="text-xs text-stone-600 truncate mt-0.5">
              {alert.itemsSummary}
              {alert.itemsCount > 1 && (
                <span className="text-[11px] text-stone-400 ml-1">
                  (+{alert.itemsCount - 1} {alert.itemsCount === 2 ? "artículo" : "artículos"})
                </span>
              )}
            </p>

            {/* Date & Delivery badge */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 text-stone-600 font-medium bg-stone-100 px-2 py-0.5 rounded-md">
                <Calendar className="w-3 h-3 text-rose-600" />
                <span>{alert.scheduledDate}</span>
                {alert.scheduledTimeSlot && (
                  <span className="text-stone-400">({alert.scheduledTimeSlot})</span>
                )}
              </span>

              <span className="inline-flex items-center gap-1 text-stone-600 font-medium bg-stone-100 px-2 py-0.5 rounded-md">
                <MapPin className="w-3 h-3 text-rose-600" />
                <span>
                  {alert.deliveryMethod === "ENVIO" ? "Envío a domicilio" : "Retiro en taller"}
                </span>
              </span>
            </div>

            {/* Financials */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-xs">
              <div>
                <span className="text-stone-500 text-[11px]">Total: </span>
                <strong className="text-stone-900 font-bold">${alert.totalPrice} USD</strong>
              </div>
              <div className="text-rose-800 font-semibold text-[11px]">
                Anticipo 50%: <strong>${alert.requiredDeposit} USD</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopySummary}
              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="Copiar detalles para WhatsApp"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            {totalInQueue > 1 && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-stone-400 hover:text-stone-600 px-2 py-1 cursor-pointer"
              >
                Cerrar todas ({totalInQueue})
              </button>
            )}
          </div>

          <button
            onClick={onInspect}
            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver en Panel</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress countdown bar */}
      <div className="h-1 w-full bg-stone-100 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};
