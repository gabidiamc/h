import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Scissors,
  Gift,
  Heart,
  Upload,
  AlertCircle,
  MessageCircle,
  Star,
  Sparkles,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Order, isOrderPaymentApproved } from "../types";
import { useApp } from "../context/AppContext";

interface OrderStatusTrackerProps {
  order: Order;
  onOpenProofUpload?: () => void;
  compact?: boolean;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  order,
  onOpenProofUpload,
  compact = false,
}) => {
  const { siteSettings, openInternalChat, addReview, reviews } = useApp();

  const isPaymentApproved = isOrderPaymentApproved(order);
  const isPaymentRejected = order.paymentStatus === "RECHAZADO";
  const proofUrl = order.paymentProof?.fileUrl || order.paymentProofUrl;
  const isProofInReview =
    !isPaymentApproved &&
    !isPaymentRejected &&
    (order.paymentStatus === "VERIFICANDO" ||
      order.paymentStatus === "COMPROBANTE_EN_REVISION" ||
      order.status === "PAGO_PENDIENTE_VERIFICACION" ||
      Boolean(proofUrl));

  // Review Form State for completed orders
  const primaryItem = order.items && order.items[0];
  const [selectedProductId, setSelectedProductId] = useState<string>(primaryItem?.productId || "");
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Check if a review already exists for this order
  const existingReview = reviews.find(
    (r) =>
      (r.orderId && (r.orderId === order.id || r.orderId === order.orderNumber)) ||
      (r.customerName === order.customerName && r.productId === selectedProductId),
  );

  // Determine stage (1 to 5)
  let currentStage = 1;
  if (order.status === "CANCELADO") {
    currentStage = 0;
  } else if (order.status === "ENTREGADO") {
    currentStage = 5;
  } else if (order.status === "LISTO_PARA_ENTREGA" || order.status === "LISTO") {
    currentStage = 4;
  } else if (
    order.status === "EN_PRODUCCION" ||
    order.status === "ANTICIPO_RECIBIDO" ||
    (isPaymentApproved && order.status === "PAGO_VERIFICADO")
  ) {
    currentStage = 3;
  } else if (isProofInReview) {
    currentStage = 2;
  } else if (isPaymentRejected) {
    currentStage = 2;
  } else {
    currentStage = 1;
  }

  // When delivered or compact mode is on, steps are collapsed by default to keep the view neat
  const [showAllSteps, setShowAllSteps] = useState<boolean>(!compact && currentStage !== 5);

  const isDirectQuote =
    order.isDirectQuote ||
    order.items?.some((i: any) => i.productType === "especial") ||
    order.scheduledDate === "A convenir" ||
    order.scheduledDate === "Cotización Directa" ||
    !order.scheduledDate;

  const verticalSteps = [
    {
      step: 1,
      title: "Pedido Registrado",
      desc: isDirectQuote
        ? `Cotización Directa con la Dueña • Confección y entrega acordadas por chat • ${order.deliveryMethod === "RETIRO" ? "Retiro en taller" : "Envío a domicilio"}.`
        : `Fecha programada: ${order.scheduledDate} (${order.scheduledTimeSlot}) • ${order.deliveryMethod === "RETIRO" ? "Retiro en taller" : "Envío a domicilio"}.`,
      icon: Clock,
    },
    {
      step: 2,
      title: "Anticipo del 50%",
      desc: isPaymentApproved
        ? "Pago aprobado por la dueña del taller. ¡Tu cupo está apartado y acumula Puntos de Lealtad!"
        : isProofInReview
          ? "Comprobante bancario recibido. La dueña del taller está validando la transferencia."
          : isPaymentRejected
            ? `Comprobante rechazado: ${order.paymentProof?.rejectionReason || "No legible o no reflejado"}. Por favor sube uno nuevo.`
            : `Anticipo requerido: $${order.requiredDeposit} ${siteSettings.currencySymbol} para apartar cupo y comenzar materiales.`,
      icon: CreditCard,
      action:
        !isPaymentApproved && !isProofInReview && onOpenProofUpload ? (
          <button
            type="button"
            onClick={onOpenProofUpload}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>
              {isPaymentRejected ? "Subir Nuevo Comprobante" : "Subir Comprobante de Anticipo"}
            </span>
          </button>
        ) : null,
    },
    {
      step: 3,
      title: "En Confección Artesanal",
      desc: "Elaboración pétalo por pétalo con listón satinado de alta calidad y detalles personalizados.",
      icon: Scissors,
    },
    {
      step: 4,
      title: "Listo para Entrega / Retiro",
      desc:
        order.deliveryMethod === "RETIRO"
          ? `Arreglo finalizado en caja o envoltura coreana. Listo para retirar en: ${siteSettings.pickupAddress}.`
          : isDirectQuote
            ? "Empacado de lujo y listo para entrega según lo coordinado por chat con Monce."
            : `Empacado de lujo y programado en ruta de entrega a domicilio para el ${order.scheduledDate}.`,
      icon: Gift,
    },
    {
      step: 5,
      title: "Entregado & Finalizado",
      desc: "Ramo en manos del destinatario. ¡Flores eternas que duran para siempre!",
      icon: Heart,
    },
  ];

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setIsSubmittingReview(true);

    const targetItem = order.items.find((i) => i.productId === selectedProductId) || order.items[0];

    addReview({
      customerId: order.customerId,
      orderId: order.orderNumber || order.id,
      productId: targetItem?.productId || "general-bouquet",
      productName: targetItem?.productName || "Ramo Eterno",
      customerName: order.customerName || "Cliente Verificado",
      rating,
      comment: reviewComment.trim(),
      verifiedPurchase: true,
    });

    setIsSubmittingReview(false);
    setReviewSubmitted(true);
  };

  return (
    <div className="bg-white rounded-3xl border border-rose-100/80 shadow-xs p-5 sm:p-6 space-y-6">
      {/* Header with Title and Current Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
              #{order.orderNumber}
            </span>
            <span className="text-xs text-stone-400">•</span>
            {isDirectQuote ? (
              <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Cotización Directa con la Dueña</span>
              </span>
            ) : (
              <span className="text-xs text-stone-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {order.scheduledDate} ({order.scheduledTimeSlot})
              </span>
            )}
          </div>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 mt-1">
            Estado del Pedido
          </h3>
        </div>

        <div>
          {order.status === "CANCELADO" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-700 text-xs font-bold rounded-full">
              <AlertCircle className="w-3.5 h-3.5 text-stone-500" />
              Cancelado
            </span>
          ) : currentStage === 5 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Entregado con Éxito
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              Paso {currentStage} de 5: {verticalSteps[currentStage - 1]?.title}
            </span>
          )}
        </div>
      </div>

      {/* COMPACT DELIVERED SUMMARY BANNER (Shown when delivered to keep tracker small) */}
      {currentStage === 5 && (
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-emerald-950 flex items-center gap-2">
                Pedido Entregado y Finalizado
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  100% Completado
                </span>
              </h4>
              <p className="text-xs text-emerald-800/80 mt-0.5">
                {isDirectQuote
                  ? "Ramo de listón eterno entregado y finalizado con éxito."
                  : `Ramo de listón eterno entregado para la fecha programada (${order.scheduledDate}).`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAllSteps((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100/60 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-all shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <span>{showAllSteps ? "Ocultar 5 etapas" : "Ver 5 etapas completadas"}</span>
            {showAllSteps ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* VERTICAL PROGRESS BAR (Shown if in-progress OR if user expanded the delivered stages) */}
      {(currentStage !== 5 || showAllSteps) && (
        <div className="relative pl-2 sm:pl-3 py-2">
          <div className="space-y-6">
            {verticalSteps.map((s, index) => {
              const Icon = s.icon;
              const isPassed = s.step < currentStage || (currentStage === 5 && s.step === 5);
              const isCurrent = s.step === currentStage && currentStage !== 5;
              const isPending = s.step > currentStage;
              const isLast = index === verticalSteps.length - 1;

              return (
                <div key={s.step} className="relative flex items-start gap-4">
                  {/* Vertical connecting bar between nodes */}
                  {!isLast && (
                    <div
                      className={`absolute left-4.5 top-9 w-0.5 -bottom-7 transition-colors ${
                        isPassed ? "bg-emerald-500" : "bg-stone-200"
                      }`}
                    />
                  )}

                  {/* Step Node */}
                  <div className="relative z-10 shrink-0">
                    {isPassed ? (
                      <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-9 h-9 rounded-full bg-rose-700 text-white flex items-center justify-center ring-4 ring-rose-200 shadow-sm animate-pulse">
                        <Icon className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-stone-100 text-stone-400 border border-stone-300 flex items-center justify-center">
                        <span className="text-xs font-mono font-semibold">{s.step}</span>
                      </div>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className={`flex-1 pt-1 pb-1 ${isPending ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold ${
                          isPassed
                            ? "text-emerald-950 font-serif"
                            : isCurrent
                              ? "text-rose-900 font-serif font-extrabold"
                              : "text-stone-600"
                        }`}
                      >
                        {s.step}. {s.title}
                      </h4>

                      {isPassed && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Completado
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          En curso
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-xl">{s.desc}</p>

                    {/* Step Action (e.g. upload receipt) */}
                    {s.action}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COMPLETED ORDER REVIEW SECTION (Requested: cuando un pedido se termine el cliente pueda dejar una reseña y se pueda ver en el producto) */}
      {order.status === "ENTREGADO" && (
        <div className="mt-6 pt-6 border-t border-rose-100 bg-gradient-to-br from-rose-50/70 to-amber-50/50 rounded-2xl p-5 border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="font-serif text-base font-bold text-stone-900">
              {existingReview || reviewSubmitted
                ? "¡Gracias por calificar tu ramo!"
                : "¿Qué te pareció tu ramo eterno? Deja tu reseña"}
            </h4>
          </div>

          {existingReview || reviewSubmitted ? (
            <div className="bg-white p-4 rounded-xl border border-emerald-200 text-xs text-stone-700 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Reseña verificada registrada con éxito</span>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= (existingReview?.rating || rating) ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
                  />
                ))}
                <span className="text-stone-500 text-[11px] ml-1.5 font-medium">
                  {existingReview?.rating || rating} de 5 estrellas
                </span>
              </div>
              <p className="text-stone-600 italic">"{existingReview?.comment || reviewComment}"</p>
              <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                Esta opinión ya está visible en la página del producto para futuros clientes.
                ¡Gracias por confiar en {siteSettings.businessName}!
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleReviewSubmit}
              className="space-y-4 bg-white p-4 rounded-2xl border border-rose-100"
            >
              <p className="text-xs text-stone-600">
                Tu opinión es muy valiosa para nosotros y ayuda a otros clientes a elegir su regalo
                perfecto. Se publicará como <strong>Compra Verificada</strong>.
              </p>

              {/* Product selector if multiple items */}
              {order.items && order.items.length > 1 && (
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Selecciona el ramo que deseas calificar:
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-stone-200 bg-stone-50 font-medium"
                  >
                    {order.items.map((item) => (
                      <option key={item.id} value={item.productId}>
                        {item.productName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Star Rating selector */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                  Calificación:
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                            : "text-stone-300 hover:text-amber-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-700 ml-2">
                    {rating === 5
                      ? "¡Excelente! (5/5)"
                      : rating === 4
                        ? "Muy Bueno (4/5)"
                        : rating === 3
                          ? "Bueno (3/5)"
                          : rating === 2
                            ? "Regular (2/5)"
                            : "Malo (1/5)"}
                  </span>
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Tu Reseña o Experiencia con el Ramo:
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Describe la calidad del listón, el empaque, la dedicatoria y la reacción al recibirlo..."
                  rows={3}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview || !reviewComment.trim()}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:bg-stone-200 disabled:text-stone-400 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Publicar Reseña del Producto</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Footer Support Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs text-stone-500">
        <span>¿Tienes dudas sobre tu encargo? Comunícate directamente con la artesana.</span>
        <button
          type="button"
          onClick={() =>
            openInternalChat(
              `Hola Monce, tengo una consulta sobre mi orden #${order.orderNumber}.`,
              order.orderNumber,
            )
          }
          className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 text-rose-700" />
          <span>Chat con Taller</span>
        </button>
      </div>
    </div>
  );
};
