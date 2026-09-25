import React from "react";
import {
  Sparkles,
  Clock,
  MessageCircle,
  Phone,
  Instagram,
  ShieldCheck,
  Lock,
  ArrowRight,
  Heart,
  EyeOff,
} from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { EnterprisePinModal } from "./EnterprisePinModal";

interface MaintenanceViewProps {
  onOpenAuth: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ onOpenAuth }) => {
  const [isPinModalOpen, setIsPinModalOpen] = React.useState(false);
  const {
    siteSettings,
    isAdmin,
    previewAsVisitor,
    setPreviewAsVisitor,
    enterOwnerMode,
    setActiveTab,
  } = useApp();

  const maintenance = siteSettings.maintenanceMode || {
    enabled: true,
    title: "Sitio en Mantenimiento Temporal",
    message:
      "Estamos actualizando nuestro catálogo y preparando hermosas novedades para tus fechas especiales. Regresamos en unos momentos.",
    estimatedReturn: "En unos momentos",
    contactWhatsapp: true,
  };

  const cleanPhone = (siteSettings.whatsapp || siteSettings.phone || "").replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `¡Hola ${siteSettings.businessName}! Vi que el sitio está en mantenimiento y tengo una consulta urgente sobre un ramo de listón.`,
  )}`;

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-between relative overflow-hidden selection:bg-rose-500 selection:text-white">
      {/* Ambient background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-950/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-950/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-amber-950/20 rounded-full blur-3xl" />
      </div>

      {/* Admin Preview Mode Floating Banner */}
      {isAdmin && previewAsVisitor && (
        <aside
          aria-label="Aviso de previsualización"
          className="sticky top-0 z-50 bg-amber-500 text-stone-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <EyeOff className="w-4 h-4 shrink-0" />
            <span>
              Vista Previa de Visitante: Así es exactamente como tus clientes ven la tienda en este
              momento.
            </span>
          </div>
          <button
            onClick={() => setPreviewAsVisitor(false)}
            className="px-3 py-1 bg-stone-950 text-white hover:bg-stone-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Salir de Vista Previa
          </button>
        </aside>
      )}

      {/* Top Brand Bar */}
      <header className="relative z-10 pt-8 px-6 text-center">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-stone-800/80 border border-stone-700/80 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span className="font-serif text-sm font-semibold tracking-wide text-rose-200">
            {siteSettings.businessName}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span className="text-[11px] text-stone-400">Taller de Ramos Eternos</span>
        </div>
      </header>

      {/* Center Main Card */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12 text-center my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* Animated Icon */}
          <div className="relative inline-flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-rose-500/20" />
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-900/60 to-stone-800 border border-rose-500/40 flex items-center justify-center text-rose-300 shadow-2xl shadow-rose-950/60">
              <Heart className="w-10 h-10 fill-rose-500/20 text-rose-300 animate-pulse" />
            </div>
          </div>

          {/* Status Badge */}
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Taller en Actualización
            </span>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              {maintenance.title || "Sitio en Mantenimiento Temporal"}
            </h1>
            <p className="text-stone-300 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              {maintenance.message ||
                "Estamos actualizando nuestro catálogo y preparando hermosas novedades para tus fechas especiales. Regresamos en unos momentos."}
            </p>
          </div>

          {/* Estimated Return Box */}
          {maintenance.estimatedReturn && (
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-stone-800/80 border border-stone-700/80 text-xs sm:text-sm text-stone-200 shadow-inner">
              <Clock className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="text-left">
                <span className="text-[10px] text-stone-400 block uppercase tracking-wider font-bold">
                  Tiempo estimado
                </span>
                <span className="font-semibold text-rose-100">{maintenance.estimatedReturn}</span>
              </div>
            </div>
          )}

          {/* Urgent Contact Actions */}
          {maintenance.contactWhatsapp !== false && (
            <div className="pt-4 space-y-3">
              <p className="text-xs text-stone-400 font-medium">
                ¿Tienes un pedido urgente o quieres consultar disponibilidad inmediata?
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  id="btn-maintenance-whatsapp"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Contactar por WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                {siteSettings.phone && (
                  <a
                    id="btn-maintenance-phone"
                    href={`tel:${siteSettings.phone.replace(/[^0-9]/g, "")}`}
                    className="px-4 py-3 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded-2xl font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>Llamar al Taller</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Bottom Footer & Owner Access */}
      <footer className="relative z-10 py-6 px-6 border-t border-stone-800/80 text-center">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <p>
            © {new Date().getFullYear()} {siteSettings.businessName} — Hecho a mano con amor
          </p>

          <div className="flex items-center gap-3">
            {siteSettings.instagram && (
              <a
                href={`https://instagram.com/${siteSettings.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-rose-400 transition-colors flex items-center gap-1 text-[11px]"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>{siteSettings.instagram}</span>
              </a>
            )}

            <button
              id="btn-maintenance-owner-access"
              onClick={() => setIsPinModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-[11px] font-medium transition-all cursor-pointer"
              title="Acceso directo para la administradora de Lazo Eterno"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Acceso Dueña</span>
            </button>
          </div>
        </div>
      </footer>

      <EnterprisePinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          enterOwnerMode();
          setActiveTab("admin");
        }}
      />
    </div>
  );
};
