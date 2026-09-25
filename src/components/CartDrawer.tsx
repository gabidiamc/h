import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Trash2,
  Plus,
  Minus,
  Calendar,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Gift,
  Tag,
  MapPin,
  Upload,
  CreditCard,
  ExternalLink,
  Check,
  Copy,
} from "lucide-react";
import { GiftCard, PaymentMethodConfig } from "../types";
import { useApp } from "../context/AppContext";
import { formatPhoneOnBlur } from "../utils/phoneFormatter";
import { fileToOptimizedImage } from "../lib/imageUpload";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    createOrder,
    uploadPaymentProof,
    currentUser,
    siteSettings,
    setActiveTab,
    setSelectedOrderId,
    checkDateAvailability,
    checkGiftCard,
    redeemGiftCard,
    getCustomerLoyaltyProgress,
    registeredUsers,
  } = useApp();

  const [checkoutStep, setCheckoutStep] = useState<"cart" | "checkout" | "success">("cart");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState("11:00 AM - 1:00 PM");
  const deliveryMethod = "RETIRO" as const;
  const [customerName, setCustomerName] = useState(currentUser?.name || "");
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || "");
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || "");
  const [notes, setNotes] = useState("");
  const [dedicationMessage, setDedicationMessage] = useState("");
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Payment proof stages in success view
  const [proofStage, setProofStage] = useState<"options" | "upload" | "uploaded">("options");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodConfig | null>(null);
  const [copiedIdentifier, setCopiedIdentifier] = useState<string | null>(null);
  const [proofFilePreview, setProofFilePreview] = useState<string>("");
  const [proofFileName, setProofFileName] = useState<string>("");
  const [proofNotes, setProofNotes] = useState<string>("");
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  const handleSelectPaymentMethod = (method: PaymentMethodConfig) => {
    setSelectedPaymentMethod(method);
    if (method.paymentUrl) {
      try {
        window.open(method.paymentUrl, "_blank", "noopener,noreferrer");
      } catch (err) {
        console.warn("No se pudo abrir enlace de pago automáticamente:", err);
      }
      // Detección automática al dar clic al link -> pasar a subir recibo
      setProofStage("upload");
    } else {
      setProofStage("upload");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdentifier(text);
    setTimeout(() => setCopiedIdentifier(null), 2500);
  };

  const handleProofFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFileName(file.name);
      try {
        const optimized = await fileToOptimizedImage(file);
        setProofFilePreview(optimized);
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          setProofFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleUploadProofSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrderId || !proofFilePreview) return;
    setIsSubmittingProof(true);
    uploadPaymentProof(
      createdOrderId,
      proofFilePreview,
      proofFileName || "comprobante_anticipo.jpg",
      `Método: ${selectedPaymentMethod?.name || "Transferencia"}. ${proofNotes}`.trim(),
    );
    setIsSubmittingProof(false);
    setProofStage("uploaded");
  };

  // Gift Card State in Cart/Checkout
  const [giftCardCodeInput, setGiftCardCodeInput] = useState("");
  const [appliedGiftCard, setAppliedGiftCard] = useState<GiftCard | null>(null);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);

  // Loyalty member discount calculation
  const effectiveEmail = currentUser?.email || customerEmail;
  const loyaltyProgress = getCustomerLoyaltyProgress(currentUser?.id, effectiveEmail);
  const loyaltyTier = loyaltyProgress.currentTier;
  const isClubMember = Boolean(
    currentUser ||
    (effectiveEmail &&
      registeredUsers?.some((u) => u.email?.toLowerCase() === effectiveEmail.toLowerCase())),
  );
  const loyaltyDiscountPercentage =
    isClubMember && loyaltyTier ? loyaltyTier.discountPercentage || 0 : 0;

  const totalAmount = cart.reduce((acc, item) => acc + item.itemTotal, 0);
  // Club de lealtad: acumulación de puntos activa para canjear más adelante (sin descuentos directos inmediatos)
  const loyaltyDiscount = 0;
  const amountAfterLoyalty = totalAmount;

  const giftCardDiscount = appliedGiftCard
    ? Math.min(appliedGiftCard.currentBalance, amountAfterLoyalty)
    : 0;
  const finalTotal = Math.max(0, Math.round((amountAfterLoyalty - giftCardDiscount) * 100) / 100);
  const pointsEarnedOnOrder = Math.floor(finalTotal * 10);
  const depositRequired =
    Math.round(finalTotal * (siteSettings.depositPercentage / 100) * 100) / 100;
  const remainingBalance = Math.max(0, Math.round((finalTotal - depositRequired) * 100) / 100);

  const handleApplyGiftCard = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGiftCardError(null);
    if (!giftCardCodeInput.trim()) {
      setGiftCardError("Ingresa un código de tarjeta");
      return;
    }
    const card = checkGiftCard(giftCardCodeInput.trim());
    if (!card) {
      setGiftCardError("Código no válido o no encontrado");
      return;
    }
    if (card.status === "expired" || (card.expiresAt && new Date(card.expiresAt) < new Date())) {
      setGiftCardError("Esta tarjeta de regalo ha expirado");
      return;
    }
    if (card.currentBalance <= 0 || card.status === "redeemed") {
      setGiftCardError("Esta tarjeta no tiene saldo disponible ($0 USD)");
      return;
    }
    setAppliedGiftCard(card);
    setGiftCardCodeInput("");
  };

  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardError(null);
  };

  const handleStartCheckout = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setCustomerName(currentUser.name);
    setCustomerEmail(currentUser.email);
    setCustomerPhone(currentUser.phone ? formatPhoneOnBlur(currentUser.phone) : "");

    // Suggest first item's scheduled date if present
    const firstDate = cart.find((i) => i.scheduledDate)?.scheduledDate;
    if (firstDate) {
      setScheduledDate(firstDate);
    } else {
      // Default to 4 days from now (prep time)
      const d = new Date();
      d.setDate(d.getDate() + 4);
      setScheduledDate(d.toISOString().split("T")[0]);
    }
    setCheckoutStep("checkout");
  };

  const isDirectQuoteCart =
    cart.length > 0 &&
    cart.every(
      (item) =>
        (item as any).productType === "especial" ||
        (item as any).isDirectQuote ||
        item.scheduledDate === "A convenir",
    );

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!isDirectQuoteCart) {
      if (!scheduledDate) {
        setValidationError("Por favor selecciona la fecha deseada de entrega o retiro.");
        return;
      }

      // Availability verification
      const availability = checkDateAvailability(scheduledDate);
      if (availability.isBlocked) {
        setValidationError(
          `La fecha seleccionada está bloqueada: ${availability.blockReason || "Sin servicio"}. Por favor elige otra fecha.`,
        );
        return;
      }

      if (availability.status === "FULL") {
        setValidationError(
          "Esta fecha ha alcanzado su capacidad máxima de confección de ramos de listón. Por favor elige otro día en el calendario.",
        );
        return;
      }
    }

    if (!customerPhone.trim()) {
      setValidationError("Ingresa un teléfono de contacto para coordinar la entrega.");
      return;
    }

    // Transform cart items to Order items
    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.images[0],
      quantity: item.quantity,
      unitPrice: item.selectedSize ? item.selectedSize.price : item.product.price,
      selectedSize: item.selectedSize?.name,
      selectedColor: item.selectedColor,
      selectedExtras: item.selectedExtras,
      dedicationMessage: item.dedicationMessage || dedicationMessage,
      recipientName: item.recipientName,
      subtotal: item.itemTotal,
    }));

    const isFullCovered = finalTotal === 0 && (giftCardDiscount > 0 || loyaltyDiscount > 0);
    const newOrder = createOrder({
      customerId: currentUser?.id || "guest-" + Date.now(),
      customerName: customerName || currentUser?.name || "Cliente",
      customerEmail: customerEmail || currentUser?.email || "contacto@cliente.com",
      customerPhone,
      items: orderItems,
      scheduledDate: isDirectQuoteCart ? "Cotización Directa" : scheduledDate,
      isDirectQuote: isDirectQuoteCart,
      scheduledTimeSlot: isDirectQuoteCart ? "A convenir por chat" : scheduledTimeSlot,
      deliveryMethod: "RETIRO",
      deliveryAddress: undefined,
      notes,
      status: isFullCovered ? "ANTICIPO_RECIBIDO" : "ESPERANDO_PAGO",
      totalPrice: finalTotal,
      requiredDeposit: depositRequired,
      amountPaid: isFullCovered ? totalAmount : 0,
      remainingBalance: remainingBalance,
      paymentStatus: isFullCovered ? "PAGADO_TOTAL" : "PENDIENTE",
      giftCardCode: appliedGiftCard?.code,
      giftCardDiscount: giftCardDiscount > 0 ? giftCardDiscount : undefined,
      loyaltyDiscount: loyaltyDiscount > 0 ? loyaltyDiscount : undefined,
      appliedLoyaltyTier:
        loyaltyDiscount > 0 ? `${loyaltyTier.name} (${loyaltyDiscountPercentage}%)` : undefined,
    });

    if (appliedGiftCard && giftCardDiscount > 0) {
      redeemGiftCard(appliedGiftCard.code, giftCardDiscount, newOrder.id, newOrder.orderNumber);
    }

    setCreatedOrderNumber(newOrder.orderNumber);
    setCreatedOrderId(newOrder.id);
    setSelectedOrderId(newOrder.id);
    clearCart();
    setAppliedGiftCard(null);
    setProofStage("options");
    setSelectedPaymentMethod(null);
    setProofFilePreview("");
    setProofFileName("");
    setProofNotes("");
    setCheckoutStep("success");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 pointer-events-none">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full pointer-events-auto relative z-10"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-rose-700" />
                  <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                    {checkoutStep === "cart" && `Bolsa de Compras (${cart.length})`}
                    {checkoutStep === "checkout" && "Confirmar Reserva"}
                    {checkoutStep === "success" && "¡Reserva Registrada!"}
                  </h3>
                </div>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={onClose}
                  className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {checkoutStep === "cart" && (
                  <>
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12 sm:py-16">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4">
                          <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8" />
                        </div>
                        <h4 className="font-serif text-base sm:text-lg font-bold text-stone-800 mb-1">
                          Tu carrito está vacío
                        </h4>
                        <p className="text-xs text-stone-500 max-w-xs mb-6">
                          Explora nuestros ramos de flores de listón satinado y cajas sorpresa para
                          agregar tu primer detalle romántico.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            setActiveTab("productos");
                            onClose();
                          }}
                          className="min-h-[42px] px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-full shadow-xs transition-all cursor-pointer"
                        >
                          Ver Catálogo de Ramos
                        </motion.button>
                      </div>
                    ) : (
                      <div className="space-y-3.5 sm:space-y-4">
                        <AnimatePresence mode="popLayout">
                          {cart.map((item) => (
                            <motion.div
                              key={item.id}
                              layout
                              initial={{ opacity: 0, y: 10, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
                              className="p-3 sm:p-3.5 bg-stone-50 rounded-xl sm:rounded-2xl border border-stone-200/80 flex gap-3 relative"
                            >
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white p-1 border border-stone-200 shrink-0 flex items-center justify-center">
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                                />
                              </div>
                              <div className="flex-1 min-w-0 pr-6">
                                <h4 className="text-xs font-bold text-stone-900 truncate">
                                  {item.product.name}
                                </h4>
                                {item.selectedVariant && (
                                  <p className="text-[11px] text-stone-600 mt-0.5">
                                    Versión: {item.selectedVariant.name}
                                  </p>
                                )}
                                {item.selectedSize && (
                                  <p className="text-[11px] text-stone-600 mt-0.5">
                                    Tamaño: {item.selectedSize.name}
                                  </p>
                                )}
                                {item.selectedColor && (
                                  <p className="text-[11px] text-rose-700 font-medium">
                                    Color: {item.selectedColor}
                                  </p>
                                )}

                                {item.selectedExtras.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.selectedExtras.map((e) => (
                                      <span
                                        key={e.id}
                                        className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-md font-medium"
                                      >
                                        +{e.name}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {item.scheduledDate && (
                                  <p className="text-[10px] text-stone-500 mt-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-rose-500" />
                                    Para: {item.scheduledDate}
                                  </p>
                                )}

                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center border border-stone-200/90 rounded-xl bg-white shadow-2xs overflow-hidden p-0.5">
                                    <motion.button
                                      whileTap={{ scale: 0.8 }}
                                      onClick={() => updateCartQuantity(item.id, -1)}
                                      className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                      aria-label="Disminuir cantidad"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </motion.button>
                                    <span className="px-2.5 text-xs font-bold text-stone-800 select-none">
                                      {item.quantity}
                                    </span>
                                    <motion.button
                                      whileTap={{ scale: 0.8 }}
                                      onClick={() => updateCartQuantity(item.id, 1)}
                                      className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                      aria-label="Aumentar cantidad"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </motion.button>
                                  </div>
                                  <span className="text-xs sm:text-sm font-bold text-stone-900">
                                    ${item.itemTotal}
                                  </span>
                                </div>
                              </div>

                              <motion.button
                                whileTap={{ scale: 0.8 }}
                                whileHover={{ scale: 1.15 }}
                                onClick={() => removeFromCart(item.id)}
                                className="absolute top-2.5 right-2.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors p-1.5 cursor-pointer"
                                title="Eliminar del carrito"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        <div className="pt-2 flex justify-between items-center text-xs">
                          <button
                            onClick={clearCart}
                            className="text-stone-400 hover:text-stone-600 underline py-1 cursor-pointer"
                          >
                            Vaciar carrito
                          </button>
                          <span className="text-[11px] sm:text-xs text-stone-500">
                            Precios en moneda local
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {checkoutStep === "checkout" && (
                  <form onSubmit={handleConfirmOrder} className="space-y-4 text-xs">
                    {validationError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{validationError}</span>
                      </div>
                    )}

                    <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                      <p className="font-semibold text-rose-950 mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-rose-600" />
                        Política de Confección & Depósito
                      </p>
                      <p className="text-[11px] text-rose-900/80 leading-relaxed">
                        Al enviar la reserva, se generará tu orden oficial. Para apartar la fecha en
                        el taller se requiere el anticipo del {siteSettings.depositPercentage}%.
                        Podrás subir tu comprobante de transferencia desde tu cuenta.
                      </p>
                    </div>

                    {/* Date selection with availability badge or Direct Quote notice */}
                    {isDirectQuoteCart ? (
                      <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200/90 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                          <span className="text-xs font-bold text-amber-950">
                            Cotización Directa con la Dueña (Sin selección de fechas)
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900/90 leading-relaxed">
                          Para este ramo o arreglo <strong>no requieres elegir fecha en el calendario</strong>.
                          La fecha deseada, el tiempo de confección y los detalles se coordinan directamente
                          con Monce en el chat integrado.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block font-semibold text-stone-800 mb-1">
                            Fecha deseada de entrega / retiro *
                          </label>
                          <input
                            type="date"
                            required
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]}
                            className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-rose-500 focus:bg-white"
                          />
                          {scheduledDate && (
                            <div className="mt-1.5">
                              {(() => {
                                const check = checkDateAvailability(scheduledDate);
                                if (check.isBlocked) {
                                  return (
                                    <span className="text-xs font-semibold text-stone-700 bg-stone-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                      ⚫ Fecha cerrada ({check.blockReason})
                                    </span>
                                  );
                                }
                                if (check.status === "FULL") {
                                  return (
                                    <span className="text-xs font-semibold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                      🔴 Capacidad completa (0 espacios)
                                    </span>
                                  );
                                }
                                if (check.status === "FEW_SLOTS") {
                                  return (
                                    <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                      🟡 Quedan pocos espacios ({check.remainingSlots} disponibles)
                                    </span>
                                  );
                                }
                                return (
                                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                    🟢 Fecha disponible ({check.remainingSlots} espacios libres)
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Time slot */}
                        <div>
                          <label className="block font-semibold text-stone-800 mb-1">
                            Horario preferente
                          </label>
                          <select
                            value={scheduledTimeSlot}
                            onChange={(e) => setScheduledTimeSlot(e.target.value)}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                          >
                            <option value="10:00 AM - 12:00 PM">Mañana (10:00 AM - 12:00 PM)</option>
                            <option value="12:00 PM - 2:00 PM">Mediodía (12:00 PM - 2:00 PM)</option>
                            <option value="2:00 PM - 4:00 PM">
                              Tarde temprana (2:00 PM - 4:00 PM)
                            </option>
                            <option value="5:00 PM - 7:00 PM">Tarde/Noche (5:00 PM - 7:00 PM)</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Delivery Method: In-Person Pickup Exclusive */}
                    <div className="p-3.5 bg-gradient-to-br from-rose-50/80 via-white to-amber-50/40 rounded-2xl border border-rose-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-rose-600" />
                          <span>Entrega: Recoger en Persona en Taller</span>
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                          Gratis
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-snug">
                        📍 <strong>Punto de entrega:</strong>{" "}
                        {siteSettings.pickupAddress ||
                          "Torreón, Coahuila (Dirección y ubicación exacta compartida al confirmar tu pedido)"}
                        .
                      </p>
                      <p className="text-[10px] text-stone-500 italic">
                        Todos nuestros ramos eternos se entregan exclusivamente para recoger en
                        persona para garantizar la máxima delicadeza y calidad de cada detalle.
                      </p>
                    </div>

                    {/* Customer Contact */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-stone-800 mb-1">Nombre</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-800 mb-1">
                          Teléfono de Contacto *
                        </label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          onBlur={() => setCustomerPhone(formatPhoneOnBlur(customerPhone))}
                          placeholder="(515) 123-4567"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    {/* Dedication message */}
                    <div>
                      <label className="block font-semibold text-stone-800 mb-1">
                        Mensaje para la tarjeta o dedicatoria (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={dedicationMessage}
                        onChange={(e) => setDedicationMessage(e.target.value)}
                        placeholder="Palabras de amor, felicitación o dedicatoria para quien recibe..."
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block font-semibold text-stone-800 mb-1">
                        Notas adicionales para la artesana
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej. Es sorpresa, favor de no llamar antes..."
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                      />
                    </div>

                    {/* Gift Card in Checkout Step */}
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-800 flex items-center gap-1.5 text-xs">
                          <Gift className="w-3.5 h-3.5 text-rose-600" />
                          ¿Tienes una Tarjeta de Regalo?
                        </span>
                      </div>

                      {appliedGiftCard ? (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-xs text-emerald-900 block">
                              {appliedGiftCard.code}
                            </span>
                            <span className="text-[11px] text-emerald-700">
                              Descuento aplicado: <strong>-${giftCardDiscount} USD</strong>
                              {appliedGiftCard.currentBalance > totalAmount && (
                                <span className="block text-[10px] text-emerald-600">
                                  (Saldo restante conservado: $
                                  {appliedGiftCard.currentBalance - giftCardDiscount} USD)
                                </span>
                              )}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveGiftCard}
                            className="text-xs text-rose-700 hover:text-rose-900 font-semibold cursor-pointer underline"
                          >
                            Quitar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={giftCardCodeInput}
                            onChange={(e) => setGiftCardCodeInput(e.target.value)}
                            placeholder="Ej. LAZO-ROSA-500"
                            className="flex-1 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono uppercase focus:outline-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyGiftCard()}
                            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs rounded-lg cursor-pointer"
                          >
                            Aplicar
                          </button>
                        </div>
                      )}
                      {giftCardError && (
                        <p className="text-[10px] text-rose-600 font-medium">{giftCardError}</p>
                      )}
                    </div>

                    {/* Checkout Totals Summary */}
                    <div className="p-3 bg-stone-100/70 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Subtotal</span>
                        <span>${totalAmount} USD</span>
                      </div>
                      <div className="flex justify-between text-amber-900 font-semibold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          Puntos a acumular en tu Club
                        </span>
                        <span>+{pointsEarnedOnOrder} Pts</span>
                      </div>
                      {appliedGiftCard && giftCardDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          <span className="flex items-center gap-1">
                            <Gift className="w-3 h-3 text-emerald-600" />
                            Tarjeta de Regalo ({appliedGiftCard.code})
                          </span>
                          <span>-${giftCardDiscount} USD</span>
                        </div>
                      )}
                      <div className="flex justify-between text-rose-800 font-semibold">
                        <span>Anticipo a pagar hoy ({siteSettings.depositPercentage}%)</span>
                        <span>${depositRequired} USD</span>
                      </div>
                      <div className="border-t border-stone-200 pt-1.5 flex justify-between font-bold text-stone-900">
                        <span>Total final</span>
                        <span>${finalTotal} USD</span>
                      </div>
                      {remainingBalance > 0 && (
                        <div className="flex justify-between text-[11px] text-stone-500">
                          <span>Saldo restante (al retirar o entregar)</span>
                          <span>${remainingBalance} USD</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex gap-2">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCheckoutStep("cart")}
                        className="w-1/3 py-2.5 border border-stone-200 text-stone-700 rounded-xl font-medium cursor-pointer"
                      >
                        Volver
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        className="w-2/3 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Enviar Reserva Oficial
                      </motion.button>
                    </div>
                  </form>
                )}

                {checkoutStep === "success" && (
                  <div className="py-4 space-y-4">
                    {/* Header */}
                    <div className="text-center space-y-1.5 pb-2 border-b border-stone-100">
                      <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                        ¡Reserva #{createdOrderNumber} Recibida!
                      </h4>
                      <p className="text-xs text-stone-600 max-w-xs mx-auto">
                        Anticipo requerido para apartar la fecha ({siteSettings.depositPercentage}%):{" "}
                        <strong className="text-rose-700 font-bold">${depositRequired} USD</strong>
                      </p>
                    </div>

                    {/* ETAPA 1: Opciones de Pago (La primera cosa que verá el cliente) */}
                    {proofStage === "options" && (
                      <div className="space-y-3 animate-in fade-in">
                        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs text-rose-950 space-y-1">
                          <p className="font-bold flex items-center gap-1.5 text-rose-900">
                            <CreditCard className="w-4 h-4 text-rose-700" />
                            1. Selecciona tu Método de Pago
                          </p>
                          <p className="text-[11px] text-rose-800 leading-relaxed">
                            Al hacer clic en un enlace de pago, <strong>se abrirá tu método</strong> y <strong>pasarás automáticamente</strong> a subir el recibo o comprobante.
                          </p>
                        </div>

                        {/* List of enabled payment methods */}
                        {/* Compact List of Payment Methods showing icons only */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                          {(siteSettings.paymentMethods || [])
                            .filter((m) => m.enabled)
                            .map((method) => (
                              <button
                                key={method.id}
                                type="button"
                                onClick={() => handleSelectPaymentMethod(method)}
                                className="px-3 py-2 rounded-2xl border-2 border-stone-200 hover:border-rose-600 bg-white hover:bg-rose-50/50 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center justify-center min-w-[76px] h-14 sm:h-16 group"
                                title={`Pagar con ${method.name || method.type}`}
                              >
                                {method.iconUrl ? (
                                  <img
                                    src={method.iconUrl}
                                    alt={method.name || method.type}
                                    className="max-h-10 sm:max-h-11 w-auto max-w-[90px] object-contain transition-transform group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5" />
                                  </div>
                                )}
                              </button>
                            ))}
                        </div>

                        {/* Fallback traditional bank details if no methods enabled */}
                        {(!siteSettings.paymentMethods ||
                          siteSettings.paymentMethods.filter((m) => m.enabled).length === 0) && (
                          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2 text-left">
                            <p className="font-bold text-stone-900">
                              Transferencia Bancaria Oficial:
                            </p>
                            <p className="text-stone-600">
                              <strong>Banco:</strong> {siteSettings.bankDetails?.bankName || "BBVA"}
                            </p>
                            <p className="text-stone-600">
                              <strong>Titular:</strong>{" "}
                              {siteSettings.bankDetails?.accountHolder || "Monce"}
                            </p>
                            <p className="text-stone-600 flex items-center gap-2">
                              <strong>CLABE:</strong>
                              <code className="bg-white px-2 py-0.5 rounded border border-stone-200 font-bold text-rose-700">
                                {siteSettings.bankDetails?.clabeOrKey || "012345678901234567"}
                              </code>
                            </p>
                            <button
                              type="button"
                              onClick={() => setProofStage("upload")}
                              className="w-full mt-2 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Continuar a subir recibo →
                            </button>
                          </div>
                        )}

                        {/* Bypass to direct upload */}
                        <div className="pt-2 text-center">
                          <button
                            type="button"
                            onClick={() => setProofStage("upload")}
                            className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                          >
                            ¿Ya realizaste tu pago? Saltar directo a subir comprobante →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ETAPA 2: Subir la Imagen o Recibo de Pago */}
                    {proofStage === "upload" && (
                      <form onSubmit={handleUploadProofSubmit} className="space-y-4 text-left animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setProofStage("options")}
                            className="text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                          >
                            ← Ver otros métodos de pago
                          </button>
                          <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                            Paso 2 de 2
                          </span>
                        </div>

                        {/* Method reminder banner if selected */}
                        {selectedPaymentMethod && (
                          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              {selectedPaymentMethod.iconUrl ? (
                                <img
                                  src={selectedPaymentMethod.iconUrl}
                                  alt={selectedPaymentMethod.name}
                                  className="w-7 h-7 object-contain rounded-lg p-0.5 border border-stone-200 bg-white"
                                />
                              ) : (
                                <CreditCard className="w-4 h-4 text-stone-500" />
                              )}
                              <div>
                                <span className="font-bold text-stone-900 block">
                                  {selectedPaymentMethod.name}
                                </span>
                                {selectedPaymentMethod.accountIdentifier && (
                                  <span className="text-[10px] text-stone-500 font-mono">
                                    {selectedPaymentMethod.accountIdentifier}
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedPaymentMethod.paymentUrl && (
                              <a
                                href={selectedPaymentMethod.paymentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1"
                              >
                                <span>Reabrir link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-stone-600">
                          Adjunta la captura o foto del recibo de tu pago de anticipo (<strong>${depositRequired} USD</strong>) para apartar tu fecha en el taller.
                        </p>

                        {/* File input / preview */}
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1.5">
                            Foto o Captura del Comprobante *
                          </label>

                          {proofFilePreview ? (
                            <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 max-h-52 flex items-center justify-center p-2">
                              <img
                                src={proofFilePreview}
                                alt="Vista previa del comprobante"
                                className="max-h-48 max-w-full object-contain rounded-lg"
                              />
                              <div className="absolute top-2 right-2 flex items-center gap-1">
                                <label className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1">
                                  <span>Cambiar</span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={handleProofFileChange}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProofFilePreview("");
                                    setProofFileName("");
                                  }}
                                  className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                                  title="Quitar foto"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-rose-200 bg-rose-50/40 hover:bg-rose-50 rounded-2xl cursor-pointer transition-colors group">
                              <Upload className="w-6 h-6 text-rose-700 group-hover:scale-110 transition-transform" />
                              <span className="text-xs font-bold text-rose-900 text-center">
                                Seleccionar comprobante desde mi dispositivo
                              </span>
                              <span className="text-[10px] text-stone-400">
                                JPG, PNG o PDF de tu transferencia
                              </span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                required
                                className="hidden"
                                onChange={handleProofFileChange}
                              />
                            </label>
                          )}
                        </div>

                        {/* Optional notes */}
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Notas o detalles del pago (Opcional)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Transferencia hecha a nombre de Carlos M."
                            value={proofNotes}
                            onChange={(e) => setProofNotes(e.target.value)}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                          />
                        </div>

                        <div className="pt-2 flex flex-col gap-2">
                          <button
                            type="submit"
                            disabled={!proofFilePreview || isSubmittingProof}
                            className="w-full py-3 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 disabled:from-stone-300 disabled:to-stone-300 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            <span>{isSubmittingProof ? "Enviando comprobante…" : "Confirmar y Subir Comprobante"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              setActiveTab("cuenta");
                            }}
                            className="w-full py-2 text-stone-500 hover:text-stone-800 text-xs font-medium cursor-pointer text-center"
                          >
                            Subir más tarde desde Mi Cuenta
                          </button>
                        </div>
                      </form>
                    )}

                    {/* ETAPA 3: Confirmación de subida exitosa */}
                    {proofStage === "uploaded" && (
                      <div className="py-6 text-center space-y-4 animate-in fade-in">
                        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                          <Check className="w-8 h-8" />
                        </div>
                        <h4 className="font-serif text-lg font-bold text-stone-900">
                          ¡Comprobante Enviado con Éxito!
                        </h4>
                        <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
                          Monce verificará tu comprobante de anticipo en el taller artesanal. Te notificaremos cuando tu orden pase a preparación.
                        </p>
                        <div className="pt-2 space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              setActiveTab("cuenta");
                            }}
                            className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Ver Estado de mi Pedido en Mi Cuenta
                          </button>
                          <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2 text-stone-500 hover:text-stone-800 text-xs cursor-pointer"
                          >
                            Cerrar y seguir navegando
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Footer summary if on cart view */}
              {checkoutStep === "cart" && cart.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/60 space-y-3">
                  {/* Quick Gift Card redemption in cart */}
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-rose-600" />
                        Tarjeta de Regalo
                      </span>
                    </div>

                    {appliedGiftCard ? (
                      <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                        <div>
                          <span className="font-mono font-bold text-emerald-900">
                            {appliedGiftCard.code}
                          </span>
                          <span className="text-[11px] text-emerald-700 ml-2">
                            -${giftCardDiscount} USD
                          </span>
                        </div>
                        <button
                          onClick={handleRemoveGiftCard}
                          className="text-xs text-rose-700 hover:text-rose-900 font-semibold cursor-pointer underline"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={giftCardCodeInput}
                          onChange={(e) => setGiftCardCodeInput(e.target.value)}
                          placeholder="Código LAZO-XXXX"
                          className="flex-1 px-2.5 py-1 text-xs border border-stone-200 rounded-lg font-mono uppercase focus:outline-rose-500"
                        />
                        <button
                          onClick={() => handleApplyGiftCard()}
                          className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs rounded-lg cursor-pointer"
                        >
                          Aplicar
                        </button>
                      </div>
                    )}
                    {giftCardError && (
                      <p className="text-[10px] text-rose-600 font-medium mt-1">{giftCardError}</p>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal total</span>
                      <span className="font-semibold text-stone-900">${totalAmount} USD</span>
                    </div>
                    {appliedGiftCard && giftCardDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Tarjeta de Regalo</span>
                        <span>-${giftCardDiscount} USD</span>
                      </div>
                    )}
                    <div className="flex justify-between text-rose-800 font-medium">
                      <span>Anticipo para apartar ({siteSettings.depositPercentage}%)</span>
                      <span>${depositRequired} USD</span>
                    </div>
                    <div className="flex justify-between text-stone-500 text-[11px]">
                      <span>Restante contra entrega</span>
                      <span>${remainingBalance} USD</span>
                    </div>
                    <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-bold text-stone-900">
                      <span>Total a pagar</span>
                      <span>${finalTotal} USD</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleStartCheckout}
                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-[0_4px_16px_rgba(225,29,72,0.28)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.38)] transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[46px] select-none"
                  >
                    <span>Proceder a la Reserva</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
