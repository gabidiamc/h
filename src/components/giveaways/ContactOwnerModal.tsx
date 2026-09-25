import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Heart, ShieldCheck, Sparkles, MessageCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Giveaway } from "../../types";

interface ContactOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  giveaway: Giveaway;
}

export const ContactOwnerModal: React.FC<ContactOwnerModalProps> = ({
  isOpen,
  onClose,
  giveaway,
}) => {
  const { currentUser, sendChatMessage, setIsChatOpen, showToast } = useApp();

  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [message, setMessage] = useState(
    `¡Hola Monse! Soy el/la ganador/a del sorteo "${giveaway.title}" (${giveaway.prizeName}). Me comunico con mucha emoción para coordinar la entrega o canje de mi premio. ¡Muchas gracias!`,
  );
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast({
        title: "Campos requeridos",
        subtitle: "Por favor completa tu nombre, correo y mensaje para la dueña.",
      });
      return;
    }

    setIsSending(true);

    try {
      // Build private message for owner chat
      const formattedText = `🎁 [RECLAMO DE PREMIO DE SORTEO]\n• Sorteo: ${giveaway.title}\n• Premio: ${giveaway.prizeName} (${giveaway.prizeType === "gift_card" ? `$${giveaway.prizeAmount} USD Gift Card` : `$${giveaway.prizeAmount}`})\n• Ganador/a: ${name}\n• Correo de contacto: ${email}${phone ? `\n• Teléfono: ${phone}` : ""}\n\nMensaje:\n"${message}"`;

      sendChatMessage({
        text: formattedText,
        role: "customer",
        senderName: name,
        targetConversationId: currentUser ? `conv-${currentUser.id}` : "conv-general",
      });

      showToast({
        title: "¡Mensaje enviado a Monse!",
        subtitle: "La dueña del taller responderá tu mensaje en el chat para coordinar tu premio.",
      });

      onClose();
      setIsChatOpen(true);
    } catch (err) {
      showToast({
        title: "Error al enviar",
        subtitle: "Hubo un problema temporal. Puedes intentar de nuevo.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-stone-900 text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-200 text-xs font-semibold mb-2 border border-rose-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Canje y Entrega de Premio</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold">Contactar a la Dueña</h3>
            <p className="text-rose-100/80 text-xs sm:text-sm mt-1">
              Envía un mensaje privado directo a Monse para coordinar los detalles de tu
              obsequio.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-2xl flex items-start gap-3 text-xs text-rose-900">
              <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Canal directo y privado:</span> Tu información se envía
                directamente a la bandeja de mensajes de la dueña del taller Hecho por Monce.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Nombre de contacto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Teléfono / WhatsApp (Opcional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Para avisos de entrega"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Mensaje para Monse *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tus dudas, dirección o instrucciones para el premio..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSending ? (
                  <span>Enviando...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Mensaje Privado</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
