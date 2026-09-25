import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  MessageCircle,
  Upload,
  Trash2,
  Send,
  Calendar,
  Heart,
  Palette,
  Check,
  User,
  Phone,
  HelpCircle,
} from "lucide-react";
import { Product } from "../types";
import { fileToOptimizedImage } from "../lib/imageUpload";
import { useApp } from "../context/AppContext";

interface SpecialProductChatIntakeModalProps {
  product: Product;
  selectedColor?: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: (mode?: "login" | "register") => void;
}

const COMMON_OCCASIONS = [
  "Aniversario",
  "Cumpleaños",
  "Propuesta de Noviazgo / Pedida",
  "Graduación",
  "San Valentín",
  "Día de las Madres",
  "Detalle Romántico Sorpresa",
  "Disculpa o Reconciliación",
  "Otro motivo especial",
];

export const SpecialProductChatIntakeModal: React.FC<SpecialProductChatIntakeModalProps> = ({
  product,
  selectedColor,
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const { currentUser, sendChatMessage, setIsChatOpen } = useApp();

  // Automatic determination from the owner's configuration (no manual toggle needed for customer)
  const isPeluche =
    product.customItemType === "peluche" ||
    product.category?.toLowerCase() === "peluches" ||
    product.name?.toLowerCase().includes("peluche") ||
    product.name?.toLowerCase().includes("amigurumi") ||
    product.name?.toLowerCase().includes("tejido") ||
    product.description?.toLowerCase().includes("peluche") ||
    product.description?.toLowerCase().includes("amigurumi");

  const [occasion, setOccasion] = useState(COMMON_OCCASIONS[0]);
  const [customOccasion, setCustomOccasion] = useState("");
  const [targetGender, setTargetGender] = useState<"chica" | "chico" | "pareja">("chica");
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [preferredColors, setPreferredColors] = useState(selectedColor || "");
  const [notes, setNotes] = useState("");

  // Guest inputs if not logged in
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const optimized = await fileToOptimizedImage(file);
      setReferenceImageUrl(optimized);
    } catch (err) {
      console.error("Error al procesar foto de referencia:", err);
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const senderName = currentUser?.name || guestName.trim() || "Cliente Interesado";
    const effectiveOccasion =
      occasion === "Otro motivo especial" && customOccasion.trim()
        ? customOccasion.trim()
        : occasion;
    const genderLabel =
      targetGender === "chica"
        ? "Para Chica 👧"
        : targetGender === "chico"
          ? "Para Chico 👦"
          : "Para Pareja / Ambos 💕";

    const conversationId = currentUser ? `conv-user-${currentUser.id}` : `conv-guest-${Date.now()}`;

    // Construct structured initial intake message
    const lines = isPeluche
      ? [
          `🧸 **SOLICITUD DE PELUCHE ESPECIAL:** "${product.name.replace(/ramo/gi, "Peluche")}"`,
          `🎀 **Destinatario:** ${genderLabel}`,
          `🎉 **Ocasión Especial:** ${effectiveOccasion}`,
          notes.trim() ? `💬 **Detalles o ideas del peluche:** ${notes.trim()}` : null,
          !currentUser && guestPhone.trim()
            ? `📞 **Teléfono de contacto:** ${guestPhone.trim()}`
            : null,
          referenceImageUrl
            ? `📸 *(Se adjuntó foto de referencia para Monce)*`
            : `*(Sin foto de referencia adjunta)*`,
          `\n✨ *Monce revisará tu diseño de peluche y te responderá aquí mismo con el precio final y tiempo de entrega.*`,
        ].filter(Boolean)
      : [
          `🌸 **SOLICITUD DE RAMO ESPECIAL:** "${product.name}"`,
          `🎀 **Destinatario:** ${genderLabel}`,
          `🎉 **Ocasión Especial:** ${effectiveOccasion}`,
          preferredColors ? `🎨 **Colores de listón deseados:** ${preferredColors}` : null,
          notes.trim() ? `💬 **Detalles o ideas del cliente:** ${notes.trim()}` : null,
          !currentUser && guestPhone.trim()
            ? `📞 **Teléfono de contacto:** ${guestPhone.trim()}`
            : null,
          referenceImageUrl
            ? `📸 *(Se adjuntó foto de referencia para Monce)*`
            : `*(Sin foto de referencia adjunta)*`,
          `\n✨ *Monce revisará tu diseño y te responderá aquí mismo con el precio final y tiempo de entrega.*`,
        ].filter(Boolean);

    const messageText = lines.join("\n");

    sendChatMessage({
      targetConversationId: conversationId,
      text: messageText,
      imageUrl: referenceImageUrl || undefined,
      role: "customer",
      senderName,
    });

    onClose();
    // Open integrated chat drawer immediately
    setTimeout(() => {
      setIsChatOpen(true);
    }, 200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-rose-100 max-h-[92vh] overflow-y-auto space-y-4"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs text-xl">
              {isPeluche ? "🧸" : <Sparkles className="w-6 h-6 text-amber-700" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  {isPeluche ? "Peluche Tejido a Mano" : "Ramo Especial"}
                </span>
                <span className="text-[10px] text-stone-500">Atención Directa con la Dueña</span>
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 mt-1">
                {isPeluche ? "Cuéntale a Monce sobre tu Peluche" : "Cuéntale a Monce sobre tu Ramo"}
              </h3>
              <p className="text-xs text-stone-600">
                Diseño:{" "}
                <strong className="text-stone-900">
                  {isPeluche ? product.name.replace(/ramo/gi, "Peluche") : product.name}
                </strong>
              </p>
            </div>
          </div>

          <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-2xl text-xs text-rose-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-rose-600" />
              ¿Cómo funciona este pedido especial?
            </p>
            <p className="text-[11px] text-rose-800/90 leading-relaxed">
              Responde estas preguntas breves y sube tu foto de referencia. Se le enviará directo a
              Monce en el chat integrado, y ella te dará el <strong>precio exacto</strong> y el{" "}
              <strong>tiempo en que lo puede tener listo</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 1. ¿Para quién es? */}
            <div>
              <label className="block font-bold text-stone-800 mb-1.5">
                {isPeluche ? "1. ¿Para quién es el peluche? *" : "1. ¿Para quién es el ramo? *"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetGender("chica")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    targetGender === "chica"
                      ? "bg-rose-700 text-white border-rose-700 shadow-xs"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <span>👧 Para Chica</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetGender("chico")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    targetGender === "chico"
                      ? "bg-rose-700 text-white border-rose-700 shadow-xs"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <span>👦 Para Chico</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetGender("pareja")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    targetGender === "pareja"
                      ? "bg-rose-700 text-white border-rose-700 shadow-xs"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <span>💕 Pareja / Ambos</span>
                </button>
              </div>
            </div>

            {/* 2. ¿Para qué ocasión especial es? */}
            <div>
              <label className="block font-bold text-stone-800 mb-1.5">
                2. ¿Para qué ocasión especial es? *
              </label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:bg-white"
              >
                {COMMON_OCCASIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>

              {occasion === "Otro motivo especial" && (
                <input
                  type="text"
                  placeholder="Describe la ocasión (ej. Bienvenida, Logro laboral...)"
                  value={customOccasion}
                  onChange={(e) => setCustomOccasion(e.target.value)}
                  className="w-full mt-2 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs"
                  required
                />
              )}
            </div>

            {/* 3. Subir imagen de referencia desde el dispositivo */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-stone-800">
                  {isPeluche
                    ? "3. ¿Tienes una imagen o foto de referencia del peluche?"
                    : "3. ¿Tienes una imagen o foto de referencia?"}
                </label>
                <span className="text-[10px] text-stone-400 font-normal">Recomendado</span>
              </div>
              <p className="text-[11px] text-stone-500 mb-2">
                {isPeluche
                  ? "Sube una imagen o diseño del personaje o animalito para que Monce lo teja a mano a tu gusto."
                  : "Sube una captura de pantalla, foto de Pinterest o diseño que te guste para que Monce lo vea en el chat."}
              </p>

              {referenceImageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 aspect-16/9 max-h-52 flex items-center justify-center shadow-xs">
                  <img
                    src={referenceImageUrl}
                    alt="Foto de referencia"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3">
                    <span className="text-[11px] text-white font-medium bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                      Foto de referencia cargada
                    </span>
                    <button
                      type="button"
                      onClick={() => setReferenceImageUrl("")}
                      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-rose-200 bg-rose-50/50 hover:bg-rose-50 rounded-2xl cursor-pointer transition-colors group">
                  <Upload className="w-6 h-6 text-rose-700 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-rose-800">
                    {isUploadingImage
                      ? "Optimizando foto…"
                      : "Subir foto de referencia desde mi dispositivo"}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    JPG, PNG o WEBP desde tu galería o cámara
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </label>
              )}
            </div>

            {/* 4. Colores de listón o detalles preferidos - SOLO PARA RAMOS, NO EN PELUCHES */}
            {!isPeluche && (
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  4. Colores de listón o detalles que deseas
                </label>
                <input
                  type="text"
                  placeholder="Ej. Rojo carmín con blanco perla, o tonos pasteles"
                  value={preferredColors}
                  onChange={(e) => setPreferredColors(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                />
              </div>
            )}

            {/* Notas adicionales para Monce */}
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                {isPeluche
                  ? "4. Notas o detalles específicos del peluche"
                  : "5. Notas o preguntas adicionales para la dueña"}
              </label>
              <textarea
                rows={2}
                placeholder={
                  isPeluche
                    ? "Ej. Me gustaría que el peluche mida unos 20 cm, tenga un saquito tejido o detalles especiales..."
                    : "Ej. Me gustaría que incluya una dedicatoria y mariposas decorativas..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
              />
            </div>

            {/* Guest contact info if not logged in */}
            {!currentUser && (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                <span className="font-bold text-stone-800 block text-xs">
                  Tus datos de contacto (para que Monce te identifique en el chat):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre completo *"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="Tu teléfono o WhatsApp"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {/* Submit buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-stone-600 hover:text-stone-900 rounded-xl font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isPeluche
                    ? "Enviar Solicitud de Peluche por el Chat"
                    : "Enviar Solicitud de Ramo por el Chat"}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
