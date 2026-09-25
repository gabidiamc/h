import React, { useState } from "react";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Calendar,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Scissors,
  Gift,
  ExternalLink,
  Star,
  Sparkles,
  MessageCircle,
  FileText,
  X,
  Filter,
  Search,
  ArrowLeft,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Order, PaymentMethodConfig, isOrderPaymentApproved } from "../../types";
import { OrderReceiptModal } from "../OrderReceiptModal";
import { matchesOrderQuery } from "../../utils/orderIdGenerator";
import { fileToOptimizedImage } from "../../lib/imageUpload";

interface MiMoncePedidosProps {
  userOrders: Order[];
}

export const MiMoncePedidos: React.FC<MiMoncePedidosProps> = ({ userOrders }) => {
  const { uploadPaymentProof, openInternalChat, siteSettings, addReview, reviews } = useApp();

  // Filter state: all | active | delivered | pending_payment
  const [filter, setFilter] = useState<"all" | "active" | "delivered" | "pending_payment">("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>("");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Track expanded state for delivered orders (delivered orders default to false/collapsed)
  const [expandedDeliveredOrders, setExpandedDeliveredOrders] = useState<Record<string, boolean>>(
    {},
  );

  // Payment proof modal
  const [selectedOrderForProof, setSelectedOrderForProof] = useState<Order | null>(null);
  const [proofModalStage, setProofModalStage] = useState<"options" | "upload">("options");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodConfig | null>(null);
  const [copiedIdentifier, setCopiedIdentifier] = useState<string | null>(null);
  const [proofFilePreview, setProofFilePreview] = useState<string>("");
  const [proofFileName, setProofFileName] = useState<string>("");
  const [proofNotes, setProofNotes] = useState<string>("");
  const [isSubmittingProof, setIsSubmittingProof] = useState<boolean>(false);

  const openProofModal = (order: Order) => {
    setSelectedOrderForProof(order);
    setProofModalStage("options");
    setSelectedPaymentMethod(null);
    setProofFilePreview("");
    setProofFileName("");
    setProofNotes("");
  };

  const handleSelectPaymentMethod = (method: PaymentMethodConfig) => {
    setSelectedPaymentMethod(method);
    if (method.paymentUrl) {
      try {
        window.open(method.paymentUrl, "_blank", "noopener,noreferrer");
      } catch (err) {
        console.warn("No se pudo abrir el enlace automáticamente:", err);
      }
      // Detección automática al dar clic al enlace: pasar a la siguiente etapa (subir recibo)
      setProofModalStage("upload");
    } else {
      // Método sin link directo (ej. transferencia tradicional) -> pasar a la etapa de subir recibo
      setProofModalStage("upload");
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

  // Review modal
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewProductId, setReviewProductId] = useState<string>("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const toggleDeliveredExpand = (orderId: string) => {
    setExpandedDeliveredOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleUploadProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForProof || !proofFilePreview) return;
    setIsSubmittingProof(true);
    try {
      uploadPaymentProof(
        selectedOrderForProof.id,
        proofFilePreview,
        proofFileName || "comprobante.png",
        proofNotes || undefined,
      );
      setSelectedOrderForProof(null);
      setProofFilePreview("");
      setProofFileName("");
      setProofNotes("");
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder || !reviewProductId) return;
    setIsSubmittingReview(true);
    try {
      const prodItem = reviewOrder.items.find((i) => i.productId === reviewProductId);
      addReview({
        productId: reviewProductId,
        productName: prodItem?.productName || "Ramo Eterno",
        customerName: reviewOrder.customerName,
        rating: reviewRating,
        comment: reviewComment,
        verifiedPurchase: true,
        orderId: reviewOrder.id,
      });
      setReviewOrder(null);
      setReviewComment("");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filter orders
  const filteredOrders = userOrders.filter((order) => {
    if (filter === "active") {
      if (order.status === "ENTREGADO" || order.status === "CANCELADO") return false;
    } else if (filter === "delivered") {
      if (order.status !== "ENTREGADO") return false;
    } else if (filter === "pending_payment") {
      if (isOrderPaymentApproved(order) || order.status === "CANCELADO") return false;
    }

    if (orderSearchQuery.trim()) {
      const query = orderSearchQuery.trim().toLowerCase();
      const matchesId = matchesOrderQuery(order, query);
      const matchesProducts = (order.items || []).some((item) =>
        (item.productName || "").toLowerCase().includes(query),
      );
      if (!matchesId && !matchesProducts) return false;
    }

    return true;
  });

  // 8-step pipeline visual mapping
  const getPipelineSteps = (order: Order) => {
    const isApproved = isOrderPaymentApproved(order);
    const isRejected = order.paymentStatus === "RECHAZADO";
    const hasProof = Boolean(order.paymentProof?.fileUrl || order.paymentProofUrl);
    const isInReview =
      !isApproved &&
      !isRejected &&
      (order.paymentStatus === "VERIFICANDO" ||
        order.paymentStatus === "COMPROBANTE_EN_REVISION" ||
        order.status === "PAGO_PENDIENTE_VERIFICACION" ||
        hasProof);

    const isConfirmed = isApproved || order.status === "ANTICIPO_RECIBIDO";
    const isPreparing =
      order.status === "EN_PRODUCCION" ||
      order.status === "LISTO_PARA_ENTREGA" ||
      order.status === "LISTO" ||
      order.status === "ENTREGADO";
    const isReadyOrSent =
      order.status === "LISTO_PARA_ENTREGA" ||
      order.status === "LISTO" ||
      order.status === "ENTREGADO";
    const isDelivered = order.status === "ENTREGADO";

    return [
      { id: 1, label: "Pedido creado", completed: true, active: false },
      {
        id: 2,
        label: "Comprobante enviado",
        completed: hasProof || isApproved,
        active: !hasProof && !isApproved,
      },
      { id: 3, label: "En revisión", completed: isApproved || isRejected, active: isInReview },
      {
        id: 4,
        label: isRejected ? "Pago rechazado" : "Pago aprobado",
        completed: isApproved,
        active: isRejected,
        isError: isRejected,
      },
      { id: 5, label: "Confirmado", completed: isConfirmed, active: isConfirmed && !isPreparing },
      {
        id: 6,
        label: "Preparando",
        completed: isPreparing,
        active: order.status === "EN_PRODUCCION",
      },
      {
        id: 7,
        label: "Listo / Enviado",
        completed: isReadyOrSent,
        active: order.status === "LISTO_PARA_ENTREGA" || order.status === "LISTO",
      },
      { id: 8, label: "Entregado", completed: isDelivered, active: isDelivered },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">Mis Pedidos</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Consulta el avance artesanal en vivo, comprobantes bancarios y fechas programadas.
          </p>
        </div>

        {/* Filter buttons & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search bar */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              placeholder="Buscar por ID o producto..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs"
            />
            {orderSearchQuery && (
              <button
                type="button"
                onClick={() => setOrderSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === "all"
                  ? "bg-rose-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Todos ({userOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("active")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === "active"
                  ? "bg-rose-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              En Taller
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending_payment")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === "pending_payment"
                  ? "bg-rose-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Pendientes de Pago
            </button>
            <button
              type="button"
              onClick={() => setFilter("delivered")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === "delivered"
                  ? "bg-rose-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Entregados
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-rose-100 shadow-xs space-y-3">
          <Package className="w-12 h-12 text-rose-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No se encontraron pedidos</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {filter === "all"
              ? "Aún no has registrado ningún pedido. Explora nuestro catálogo de ramos eternos para agendar tu primera creación."
              : "No tienes pedidos en esta categoría seleccionada."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isApproved = isOrderPaymentApproved(order);
            const isDelivered = order.status === "ENTREGADO";
            const isExpanded = isDelivered ? Boolean(expandedDeliveredOrders[order.id]) : true;
            const pipelineSteps = getPipelineSteps(order);
            const proofUrl = order.paymentProof?.fileUrl || order.paymentProofUrl;
            const isRejected = order.paymentStatus === "RECHAZADO";

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-rose-100/90 shadow-[0_2px_16px_rgba(244,63,94,0.05)] overflow-hidden transition-all"
              >
                {/* Order Top Bar */}
                <div
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 ${
                    isDelivered
                      ? "bg-stone-50/50 cursor-pointer"
                      : "bg-gradient-to-r from-rose-50/40 via-stone-50/20 to-white"
                  }`}
                  onClick={() => {
                    if (isDelivered) toggleDeliveredExpand(order.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isDelivered
                          ? "bg-emerald-100 text-emerald-800"
                          : isApproved
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isDelivered ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <Package className="w-5 h-5 text-rose-700" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-base font-bold text-stone-900">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isDelivered
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                              : order.status === "CANCELADO"
                                ? "bg-stone-200 text-stone-700"
                                : "bg-rose-100 text-rose-900 border border-rose-200"
                          }`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                        {isApproved && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Pago Aprobado</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>Creado: {new Date(order.createdAt).toLocaleDateString("es-MX")}</span>
                        <span>•</span>
                        {order.items?.some((i) => (i as any).productType === "especial") ||
                        (order as any).isDirectQuote ||
                        order.scheduledDate === "A convenir" ||
                        order.scheduledDate === "Cotización Directa" ||
                        !order.scheduledDate ? (
                          <span className="flex items-center gap-1 text-amber-900 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Cotización Directa con Monce • Acordada por chat
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-stone-700 font-medium">
                            <Calendar className="w-3 h-3 text-rose-600" />
                            Entrega: {order.scheduledDate} ({order.scheduledTimeSlot})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                    <div className="text-right">
                      <span className="text-base font-bold text-stone-900 font-serif">
                        ${order.totalPrice.toFixed(2)} USD
                      </span>
                      <p className="text-[11px] text-stone-500">
                        {order.remainingBalance > 0
                          ? `Saldo pendiente: $${order.remainingBalance.toFixed(2)}`
                          : "Liquidado al 100% ✓"}
                      </p>
                    </div>

                    {/* Official Printable Receipt Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReceiptOrder(order);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Ver o imprimir recibo oficial con desglose y estado de pago"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      <span className="hidden sm:inline">Recibo</span>
                    </button>

                    {isDelivered && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDeliveredExpand(order.id);
                        }}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        title={isExpanded ? "Hacer más pequeño" : "Expandir detalles"}
                      >
                        <span className="hidden sm:inline">
                          {isExpanded ? "Minimizar" : "Ver detalles"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* Visual 8-Step Tracking Pipeline */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-stone-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-rose-600" />
                        <span>Seguimiento Visual en Tiempo Real</span>
                      </h4>

                      <div className="p-3.5 rounded-2xl bg-stone-50/90 border border-stone-200/70 overflow-x-auto scrollbar-none">
                        <div className="flex items-center justify-between min-w-[620px] gap-2">
                          {pipelineSteps.map((step, idx) => (
                            <React.Fragment key={step.id}>
                              <div className="flex flex-col items-center text-center space-y-1 shrink-0">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                                    step.isError
                                      ? "bg-red-500 text-white shadow-xs"
                                      : step.completed
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : step.active
                                          ? "bg-rose-600 text-white ring-4 ring-rose-100 animate-pulse"
                                          : "bg-stone-200 text-stone-500"
                                  }`}
                                >
                                  {step.isError ? "✕" : step.completed ? "✓" : step.id}
                                </div>
                                <span
                                  className={`text-[10px] max-w-[70px] leading-tight ${
                                    step.isError
                                      ? "font-bold text-red-600"
                                      : step.completed
                                        ? "font-bold text-stone-800"
                                        : step.active
                                          ? "font-bold text-rose-700"
                                          : "text-stone-400"
                                  }`}
                                >
                                  {step.label}
                                </span>
                              </div>
                              {idx < pipelineSteps.length - 1 && (
                                <div
                                  className={`h-0.5 flex-1 min-w-[20px] rounded-full ${
                                    pipelineSteps[idx + 1].completed
                                      ? "bg-emerald-500"
                                      : "bg-stone-200"
                                  }`}
                                />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Products List & Customizations */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        Productos del Pedido ({order.items.length})
                      </h4>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                                {item.productImage ? (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-rose-400 font-bold text-xs">
                                    Ramo
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-stone-900 truncate">
                                  {item.productName}
                                </h5>
                                <div className="text-[11px] text-stone-500 flex items-center gap-2 flex-wrap">
                                  <span>Cant: {item.quantity}</span>
                                  {item.selectedSize && <span>• Tamaño: {item.selectedSize}</span>}
                                  {item.selectedColor && (
                                    <span>• Listón: {item.selectedColor}</span>
                                  )}
                                </div>
                                {item.dedicationMessage && (
                                  <p className="text-[11px] text-rose-700 italic mt-0.5 line-clamp-1">
                                    "{item.dedicationMessage}"
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-stone-900">
                                ${(item.unitPrice * item.quantity).toFixed(2)}
                              </span>
                              {isDelivered && (
                                <div className="mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReviewOrder(order);
                                      setReviewProductId(item.productId || "");
                                    }}
                                    className="text-[10px] font-bold text-rose-700 hover:text-rose-900 underline flex items-center gap-0.5 cursor-pointer ml-auto"
                                  >
                                    <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                    <span>Dejar reseña</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Proof & Banking Status */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50/50 to-amber-50/40 border border-rose-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="w-4 h-4 text-rose-700 shrink-0" />
                          <div>
                            <h5 className="text-xs font-bold text-stone-900">
                              Comprobante de Pago Bancario
                            </h5>
                            <p className="text-[11px] text-stone-500">
                              {isApproved
                                ? "Comprobante validado y aprobado por Monce. ¡Cupo confirmado!"
                                : proofUrl
                                  ? "Comprobante en revisión en el taller."
                                  : isRejected
                                    ? "Comprobante no válido o ilegible. Por favor sube uno nuevo."
                                    : "Falta comprobante para apartar tu fecha en agenda."}
                            </p>
                          </div>
                        </div>

                        {/* Action: Upload or View Proof */}
                        <div className="flex items-center gap-2 shrink-0">
                          {proofUrl ? (
                            <a
                              href={proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                              <span>Ver Recibo</span>
                            </a>
                          ) : null}

                          {(!isApproved || isRejected) && (
                            <button
                              type="button"
                              onClick={() => openProofModal(order)}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{proofUrl ? "Cambiar Recibo" : "Subir Comprobante"}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Banking notes if rejected */}
                      {isRejected && order.paymentProof?.notes && (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px]">
                          <strong>Nota de taller:</strong> {order.paymentProof.notes}
                        </div>
                      )}

                      {/* Official Printable Receipt Banner */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-rose-100/70">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="text-xs text-stone-600">
                            Recibo oficial con desglose completo, anticipos, saldo e ID permanente.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                        >
                          <FileText className="w-3.5 h-3.5 text-rose-600" />
                          <span>Ver Recibo Completo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Payment Options & Upload Payment Proof */}
      {selectedOrderForProof && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-rose-100 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                {proofModalStage === "upload" ? (
                  <button
                    type="button"
                    onClick={() => setProofModalStage("options")}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors mr-1 cursor-pointer"
                    title="Volver a métodos de pago"
                  >
                    <ArrowLeft className="w-4 h-4 text-stone-600" />
                  </button>
                ) : null}
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  {proofModalStage === "options" ? (
                    <CreditCard className="w-4 h-4" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 leading-tight">
                    {proofModalStage === "options"
                      ? "Opciones de Pago Disponibles"
                      : "Subir Recibo o Comprobante"}
                  </h3>
                  <span className="text-[11px] text-stone-500 block">
                    Pedido #{selectedOrderForProof.orderNumber} •{" "}
                    {proofModalStage === "options" ? "Paso 1 de 2" : "Paso 2 de 2"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForProof(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage 1: Payment Options */}
            {proofModalStage === "options" && (
              <div className="space-y-4">
                {/* Summary amounts */}
                <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider block">
                      Anticipo a pagar ({siteSettings.depositPercentage || 50}%)
                    </span>
                    <span className="font-serif text-lg font-extrabold text-rose-950">
                      $
                      {Math.round(
                        selectedOrderForProof.total *
                          ((siteSettings.depositPercentage || 50) / 100),
                      )}{" "}
                      USD
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 block">Total del pedido</span>
                    <span className="font-bold text-stone-800">
                      ${selectedOrderForProof.total} USD
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Selecciona tu método de pago para continuar. Al hacer clic, se abrirá el enlace (si aplica)
                  y pasarás directamente a adjuntar tu comprobante de pago:
                </p>

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

                {/* Fallback to bank details if no methods configured */}
                {(!siteSettings.paymentMethods ||
                  siteSettings.paymentMethods.filter((m) => m.enabled).length === 0) && (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2">
                    <p className="font-bold text-stone-900">
                      Transferencia Bancaria Tradicional:
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
                      onClick={() => setProofModalStage("upload")}
                      className="w-full mt-2 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Continuar a subir recibo →
                    </button>
                  </div>
                )}

                {/* Direct bypass to upload */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setProofModalStage("upload")}
                    className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                  >
                    ¿Ya realizaste tu pago? Saltar directamente a subir comprobante →
                  </button>
                </div>
              </div>
            )}

            {/* Stage 2: Upload Receipt Form */}
            {proofModalStage === "upload" && (
              <form onSubmit={handleUploadProofSubmit} className="space-y-4">
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
                          Método: {selectedPaymentMethod.name}
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
                  Adjunta la foto o captura de tu comprobante de pago para apartar la fecha de tu
                  pedido <strong>#{selectedOrderForProof.orderNumber}</strong>.
                </p>

                {/* File input */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Foto o Captura del Recibo / Comprobante *
                  </label>
                  <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-rose-200 bg-rose-50/40 hover:bg-rose-50 rounded-2xl cursor-pointer transition-colors group">
                    <Upload className="w-6 h-6 text-rose-700 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-rose-900">
                      {proofFileName
                        ? `Archivo: ${proofFileName}`
                        : "Seleccionar comprobante desde mi dispositivo"}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      PNG, JPG o PDF de tu transferencia bancaria
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      required
                      className="hidden"
                      onChange={handleProofFileChange}
                    />
                  </label>
                </div>

                {proofFilePreview && (
                  <div className="relative rounded-2xl overflow-hidden border border-rose-200 max-h-52 flex items-center justify-center bg-stone-50">
                    <img
                      src={proofFilePreview}
                      alt="Vista previa comprobante"
                      className="max-h-52 w-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProofFilePreview("");
                        setProofFileName("");
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-rose-700 text-white rounded-full transition-colors cursor-pointer"
                      title="Quitar foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Notas o Número de Referencia (opcional)
                  </label>
                  <input
                    type="text"
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    placeholder="Ej. Transferencia Banorte ref #83921 a nombre de Monce"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setProofModalStage("options")}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={!proofFilePreview || isSubmittingProof}
                    className="flex-1 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    {isSubmittingProof ? "Enviando..." : "Guardar y Enviar Comprobante"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Review */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-serif text-lg font-bold text-stone-900">Calificar Creación</h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewOrder(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Calificación
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= reviewRating ? "text-amber-500 fill-amber-500" : "text-stone-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-700 ml-2">
                    {reviewRating} de 5 estrellas
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Tu Opinión</label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Cuéntanos cómo fue tu experiencia con el ramo eterno y su entrega..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!reviewComment.trim() || isSubmittingReview}
                  className="flex-1 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {isSubmittingReview ? "Publicando..." : "Publicar Reseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Order Receipt Modal */}
      <OrderReceiptModal
        order={selectedReceiptOrder}
        siteSettings={siteSettings}
        isOpen={Boolean(selectedReceiptOrder)}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
};
