import React, { useState } from "react";
import {
  Heart,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Clock,
  Sparkles,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Lock,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { EnterprisePinModal } from "./EnterprisePinModal";

export const Footer: React.FC = () => {
  const { siteSettings, setActiveTab, setCustomRequestType, openInternalChat, enterOwnerMode, isAdmin } = useApp();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  return (
    <footer className="bg-stone-900 text-stone-300 pt-10 sm:pt-16 pb-8 sm:pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-8 sm:pb-12 border-b border-stone-800">
          {/* Column 1: Brand & Craft */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <span
                suppressHydrationWarning
                className="font-serif text-2xl font-bold tracking-tight text-white"
              >
                {siteSettings.businessName}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              {siteSettings.slogan}. {siteSettings.tagline} Confección artesanal de alta costura que
              perdura intacta a través de los años.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href={`https://instagram.com/${siteSettings.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-stone-800 hover:bg-rose-900/60 flex items-center justify-center text-stone-300 hover:text-rose-300 transition-colors cursor-pointer"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <button
                onClick={() =>
                  openInternalChat(
                    "¡Hola Monce! Me gustaría consultar disponibilidad de ramos en el taller.",
                  )
                }
                className="w-10 h-10 rounded-full bg-stone-800 hover:bg-rose-900/60 flex items-center justify-center text-stone-300 hover:text-rose-300 transition-colors cursor-pointer"
                title="Chat interno directo con la Dueña"
                aria-label="Chat interno"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h4 className="font-serif text-white text-sm sm:text-base font-semibold mb-3 sm:mb-4 tracking-wide">
              Explorar Catálogo
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => {
                    setActiveTab("productos");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-rose-400 transition-colors text-stone-400 hover:underline py-1 text-left w-full cursor-pointer"
                >
                  Ramos de Rosas Eternas de Listón
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab("productos");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-rose-400 transition-colors text-stone-400 hover:underline py-1 text-left w-full cursor-pointer"
                >
                  Cajas Sorpresa con Joyero
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCustomRequestType("ramos");
                    setActiveTab("personalizados");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-rose-400 transition-colors text-rose-300 font-medium hover:underline flex items-center gap-1.5 py-1 text-left w-full cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ramos de Listón Personalizados
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCustomRequestType("peluches");
                    setActiveTab("personalizados");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-rose-400 transition-colors text-rose-300 font-medium hover:underline flex items-center gap-1.5 py-1 text-left w-full cursor-pointer"
                >
                  <span>🧸</span>
                  Peluches Tejidos a Mano (Crochet)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab("calendario");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-rose-400 transition-colors text-stone-400 hover:underline py-1 text-left w-full cursor-pointer"
                >
                  Calendario & Próximas Fechas
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab("galeria");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-rose-400 transition-colors text-stone-400 hover:underline py-1 text-left w-full cursor-pointer"
                >
                  Galería de Entregas Reales
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Workshop info */}
          <div>
            <h4 className="font-serif text-white text-sm sm:text-base font-semibold mb-3 sm:mb-4 tracking-wide">
              Taller & Entregas
            </h4>
            <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{siteSettings.pickupAddress}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{siteSettings.businessHours}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{siteSettings.phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{siteSettings.email}</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Guarantees & Booking policy */}
          <div>
            <h4 className="font-serif text-white text-sm sm:text-base font-semibold mb-3 sm:mb-4 tracking-wide">
              Garantía de Calidad
            </h4>
            <div className="bg-stone-800/80 rounded-xl p-3.5 sm:p-4 border border-stone-700/60 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-stone-300">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Cupos limitados por día:</strong> Cada flor es elaborada a mano.
                  Garantizamos atención meticulosa en cada detalle.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-stone-300">
                <CreditCard className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Anticipo seguro:</strong> Aparta tu fecha con el{" "}
                  {siteSettings.depositPercentage}% y liquida el restante contra entrega.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & discreet owner access */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center flex-wrap justify-center sm:justify-start gap-3">
            <p suppressHydrationWarning>
              © {new Date().getFullYear()} {siteSettings.businessName}. Todos los derechos
              reservados.
            </p>
            {!isAdmin && (
              <button
                id="footer-enterprise-access-btn"
                onClick={() => setIsPinModalOpen(true)}
                className="text-[11px] text-stone-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer transition-colors bg-stone-800/80 hover:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-700/80 hover:border-rose-500/50"
                title="Acceso protegido a Cuenta de la Empresa"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-medium">Cuenta de la Empresa</span>
              </button>
            )}
          </div>
          <p className="flex items-center justify-center gap-1 text-stone-400">
            Hecho a mano con <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> para
            momentos inolvidables.
          </p>
        </div>
      </div>

      {/* Enterprise Access PIN Code Modal */}
      <EnterprisePinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={enterOwnerMode}
      />
    </footer>
  );
};
