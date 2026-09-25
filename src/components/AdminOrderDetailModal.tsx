import React, { useState } from "react";
import {
  X,
  Package,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Clock3,
  XCircle,
  FileText,
  Printer,
  Download,
  ShieldCheck,
  Crown,
  Eye,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Sparkles,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Order, SiteSettings, User, CustomerLoyaltyProgress, OrderStatus } from "../types";
import { OrderStatusTracker } from "./OrderStatusTracker";
import { OrderReceiptDocument } from "./OrderReceiptDocument";

export interface AdminOrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  siteSettings: SiteSettings;
  registeredUsers: User[];
  getCustomerLoyaltyProgress: (
    customerId?: string,
    customerEmail?: string,
  ) => CustomerLoyaltyProgress;
  onUpdateStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  onVerifyPayment: (orderId: string, approved: boolean, depositOrReason?: number | string) => void;
  onOpenReceiptModal: (order: Order) => void;
}

export const AdminOrderDetailModal: React.FC<AdminOrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  siteSettings,
  registeredUsers,
  getCustomerLoyaltyProgress,
  onUpdateStatus,
  onVerifyPayment,
  onOpenReceiptModal,
}) => {
  const [activeTab, setActiveTab] = useState<"info" | "cliente" | "pago" | "recibo" | "lealtad">(
    "info",
  );
  const [isFullImageOpen, setIsFullImageOpen] = useState(false);
  const [rejectPromptOpen, setRejectPromptOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approveDepositAmount, setApproveDepositAmount] = useState<number | "">("");

  if (!isOpen || !order) return null;

  // Resolve customer account record if registered
  const customerUser = registeredUsers.find(
    (u) =>
      u.id === order.customerId ||
      (order.customerEmail && u.email.toLowerCase() === order.customerEmail.toLowerCase()),
  );

  // Retrieve authorized loyalty calculation
  const loyaltyProgress = getCustomerLoyaltyProgress(order.customerId, order.customerEmail);

  const proofUrl = order.paymentProof?.fileUrl || order.paymentProofUrl;
  const isPaymentApproved =
    order.paymentStatus === "CONFIRMADO" ||
    order.paymentStatus === "PAGADO_TOTAL" ||
    order.status === "PAGO_VERIFICADO";
  const isPaymentRejected = order.paymentStatus === "RECHAZADO";

  const handleApprove = () => {
    const deposit =
      typeof approveDepositAmount === "number" && approveDepositAmount > 0
        ? approveDepositAmount
        : order.requiredDeposit > 0
          ? order.requiredDeposit
          : order.totalPrice;
    onVerifyPayment(order.id, true, deposit);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    onVerifyPayment(order.id, false, rejectionReason.trim());
    setRejectPromptOpen(false);
    setRejectionReason("");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 z-10 flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-stone-50 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  Panel de la Dueña &bull; Detalle Completo
                </span>
                <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-lg border border-stone-200">
                  #{order.orderNumber}
                </span>
              </div>
              <h2 className="font-serif text-xl font-bold text-stone-900 mt-1">
                Orden de {order.customerName}
              </h2>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => onOpenReceiptModal(order)}
                className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-rose-700" />
                <span>Ver Recibo Oficial</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center px-6 border-b border-stone-200 bg-white overflow-x-auto scrollbar-none gap-2 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`py-3 px-3 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "info"
                  ? "border-rose-700 text-rose-700"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>1. Información del Pedido</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cliente")}
              className={`py-3 px-3 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "cliente"
                  ? "border-rose-700 text-rose-700"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>2. Cliente ({order.customerName.split(" ")[0]})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pago")}
              className={`py-3 px-3 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "pago"
                  ? "border-rose-700 text-rose-700"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>3. Comprobante y Pago</span>
              {isPaymentApproved ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ) : isPaymentRejected ? (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              ) : proofUrl ? (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("recibo")}
              className={`py-3 px-3 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "recibo"
                  ? "border-rose-700 text-rose-700"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>4. Recibo Oficial</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("lealtad")}
              className={`py-3 px-3 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "lealtad"
                  ? "border-rose-700 text-rose-700"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>5. Estado de Lealtad</span>
              {loyaltyProgress.isEligible ? (
                <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">
                  VIP
                </span>
              ) : (
                <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.2 rounded-full font-medium">
                  No elegible
                </span>
              )}
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/40">
            {/* TAB 1: INFORMACIÓN DEL PEDIDO */}
            {activeTab === "info" && (
              <div className="space-y-6">
                {/* Visual Status Tracker */}
                <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                      Progreso de Elaboración y Entrega
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {order.status}
                    </span>
                  </div>
                  <OrderStatusTracker order={order} />
                </div>

                {/* Quick 1-Click Status Controls */}
                <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                    Cambiar Estado Oficial del Pedido
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStatus(
                          order.id,
                          "COMPROBANTE_EN_REVISION",
                          "Comprobante en revisión por la artesana.",
                        )
                      }
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      🔍 En Revisión de Pago
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStatus(
                          order.id,
                          "EN_PRODUCCION",
                          "Anticipo validado y ramo en confección de listón.",
                        )
                      }
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      ✂️ En Producción Artesanal
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStatus(
                          order.id,
                          "LISTO_PARA_ENTREGA",
                          "Ramo empacado y listo en taller.",
                        )
                      }
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      🎁 Listo para Entrega
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStatus(
                          order.id,
                          "ENTREGADO",
                          "Ramo entregado exitosamente al destinatario.",
                        )
                      }
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      💖 Marcar Entregado
                    </button>
                  </div>
                </div>

                {/* Items & Customizations */}
                <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                    Productos del Pedido ({order.items.length})
                  </h4>

                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 flex flex-col sm:flex-row justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <h5 className="font-serif font-bold text-sm text-stone-900">
                            {item.productName}{" "}
                            <span className="text-stone-500 font-sans font-normal">
                              &times; {item.quantity}
                            </span>
                          </h5>
                          <div className="flex flex-wrap gap-1.5 text-[11px] text-stone-600">
                            {item.selectedSize && (
                              <span className="bg-stone-100 px-2 py-0.5 rounded-md">
                                Talla: {item.selectedSize}
                              </span>
                            )}
                            {item.selectedColor && (
                              <span className="bg-rose-50 px-2 py-0.5 rounded-md text-rose-800 border border-rose-100">
                                Color: {item.selectedColor}
                              </span>
                            )}
                            {item.recipientName && (
                              <span className="bg-pink-50 px-2 py-0.5 rounded-md text-pink-800">
                                Para: {item.recipientName}
                              </span>
                            )}
                          </div>
                          {item.selectedExtras && item.selectedExtras.length > 0 && (
                            <p className="text-stone-500">
                              <strong>Extras:</strong>{" "}
                              {item.selectedExtras
                                .map((e) => `${e.name} (+$${e.price})`)
                                .join(", ")}
                            </p>
                          )}
                          {item.dedicationMessage && (
                            <div className="p-2 bg-rose-50/70 border border-rose-100 rounded-xl text-rose-900 italic mt-1">
                              <strong>Carta dedicatoria:</strong> &ldquo;{item.dedicationMessage}
                              &rdquo;
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-stone-900 text-sm block">
                            ${item.subtotal.toFixed(2)} USD
                          </span>
                          <span className="text-[11px] text-stone-500">
                            ${item.unitPrice.toFixed(2)} c/u
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Financial Overview */}
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-stone-500 block">Total del Pedido:</span>
                      <span className="font-serif text-lg font-bold text-stone-900">
                        ${order.totalPrice.toFixed(2)} USD
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Anticipo Requerido:</span>
                      <span className="font-bold text-rose-800">
                        ${order.requiredDeposit.toFixed(2)} USD
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Monto Pagado:</span>
                      <span className="font-bold text-emerald-800">
                        ${order.amountPaid.toFixed(2)} USD
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Saldo Restante:</span>
                      <span className="font-bold text-stone-900">
                        $
                        {(order.remainingBalance !== undefined
                          ? order.remainingBalance
                          : Math.max(0, order.totalPrice - order.amountPaid)
                        ).toFixed(2)}{" "}
                        USD
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline History */}
                <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                    Historial de Estados (Timeline)
                  </h4>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-rose-100">
                    {order.statusHistory.map((item, idx) => (
                      <div key={idx} className="relative text-xs space-y-0.5">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-4 ring-white" />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{item.status}</span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(item.timestamp).toLocaleString("es-MX")}
                          </span>
                        </div>
                        {item.note && <p className="text-stone-600 text-[11px]">{item.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CLIENTE */}
            {activeTab === "cliente" && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 font-bold text-lg flex items-center justify-center">
                      {order.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-stone-900">{order.customerName}</h4>
                      <p className="text-xs text-stone-500 font-mono">
                        ID Interno: {order.customerId}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
                      <span className="text-stone-400 block font-medium">Correo Electrónico:</span>
                      <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <span>{order.customerEmail}</span>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
                      <span className="text-stone-400 block font-medium">Teléfono / WhatsApp:</span>
                      <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span>{order.customerPhone}</span>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-1 sm:col-span-2">
                      <span className="text-stone-400 block font-medium">
                        Modalidad y Dirección de Entrega:
                      </span>
                      <p className="font-semibold text-stone-900 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5" />
                        <span>
                          {order.deliveryMethod === "ENVIO"
                            ? `Envío a domicilio: ${order.deliveryAddress || "Dirección pendiente"}`
                            : `Retiro en taller artesanal (${siteSettings.pickupAddress || "Torreón, Coahuila"})`}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* User Account Verification Badge */}
                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-rose-900 block">
                        Estado de Cuenta del Cliente:
                      </span>
                      <span className="text-rose-700">
                        {customerUser
                          ? `Usuario Registrado (Cuenta Activa desde ${new Date(customerUser.createdAt).toLocaleDateString("es-MX")})`
                          : "Comprador Invitado / Pedido directo"}
                      </span>
                    </div>
                    {customerUser && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verificado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COMPROBANTE Y PAGO */}
            {activeTab === "pago" && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                        Estado Oficial del Pago
                      </span>
                      <h4 className="font-serif text-lg font-bold text-stone-900">
                        {order.paymentStatus}
                      </h4>
                    </div>

                    <div>
                      {isPaymentApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Pago Confirmado
                        </span>
                      ) : isPaymentRejected ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Comprobante Rechazado
                        </span>
                      ) : proofUrl ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200">
                          <Clock3 className="w-3.5 h-3.5 text-amber-600" />
                          Comprobante en Revisión
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 font-semibold text-xs border border-stone-200">
                          <Clock className="w-3.5 h-3.5" />
                          Esperando Comprobante
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Proof Audit Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="text-stone-400 block font-medium">
                        Fecha de Envío de Comprobante:
                      </span>
                      <span className="font-semibold text-stone-900">
                        {order.paymentProof?.uploadedAt || order.paymentProofUploadedAt
                          ? new Date(
                              order.paymentProof?.uploadedAt || order.paymentProofUploadedAt!,
                            ).toLocaleString("es-MX")
                          : "No adjuntado aún"}
                      </span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="text-stone-400 block font-medium">Revisión de Pago:</span>
                      <span className="font-semibold text-stone-900">
                        {order.paymentVerifiedBy
                          ? `Aprobado por ${order.paymentVerifiedBy}`
                          : order.paymentRejectedBy
                            ? `Rechazado por ${order.paymentRejectedBy}`
                            : "Pendiente de dictamen manual"}
                      </span>
                    </div>

                    {order.paymentVerifiedAt && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 sm:col-span-2 text-emerald-900">
                        <strong>Fecha de Aprobación Oficial:</strong>{" "}
                        {new Date(order.paymentVerifiedAt).toLocaleString("es-MX")}
                      </div>
                    )}

                    {order.paymentProof?.rejectionReason && (
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 sm:col-span-2 text-rose-900">
                        <strong>Motivo de Rechazo:</strong> {order.paymentProof.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Proof Image View */}
                  {proofUrl ? (
                    <div className="space-y-2">
                      <span className="font-bold text-xs text-stone-800 block">
                        Captura del Comprobante Bancario:
                      </span>
                      <div className="relative border border-stone-200 rounded-2xl overflow-hidden max-h-72 bg-stone-100 flex items-center justify-center group">
                        <img
                          src={proofUrl}
                          alt="Comprobante de pago"
                          className="max-h-72 w-auto object-contain cursor-pointer transition-transform group-hover:scale-102"
                          onClick={() => setIsFullImageOpen(true)}
                        />
                        <button
                          type="button"
                          onClick={() => setIsFullImageOpen(true)}
                          className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/75 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 backdrop-blur-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver en Pantalla Completa</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed border-stone-200 rounded-2xl text-xs text-stone-400 space-y-1">
                      <Clock className="w-6 h-6 mx-auto text-stone-300" />
                      <p className="font-semibold text-stone-600">
                        El cliente aún no ha subido comprobante bancario.
                      </p>
                      <p>El pedido permanece en estado &ldquo;Esperando Pago&rdquo;.</p>
                    </div>
                  )}

                  {/* Verification Action Controls */}
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <span className="font-bold text-xs text-stone-900 block">
                      Acciones de Dictamen Oficial de la Dueña:
                    </span>

                    <div className="flex flex-wrap items-center gap-3">
                      {!isPaymentApproved && (
                        <button
                          type="button"
                          onClick={handleApprove}
                          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            Aprobar Pago de Anticipo (${order.requiredDeposit || order.totalPrice}{" "}
                            USD)
                          </span>
                        </button>
                      )}

                      {!isPaymentApproved && !rejectPromptOpen && (
                        <button
                          type="button"
                          onClick={() => setRejectPromptOpen(true)}
                          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>Rechazar Comprobante</span>
                        </button>
                      )}
                    </div>

                    {/* Rejection Form */}
                    {rejectPromptOpen && (
                      <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
                        <span className="font-bold text-xs text-rose-900 block">
                          Ingresa el motivo del rechazo del comprobante:
                        </span>
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Ej. Transferencia no reflejada en cuenta, captura borrosa o importe insuficiente"
                          className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs focus:outline-rose-500"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleReject}
                            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Confirmar Rechazo
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectPromptOpen(false)}
                            className="px-3 py-1.5 bg-white border border-stone-200 text-stone-600 text-xs rounded-xl cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: RECIBO OFICIAL */}
            {activeTab === "recibo" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 font-medium">
                    Vista previa idéntica a la que consulta el cliente:
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenReceiptModal(order)}
                    className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Abrir en Modo Impresión / PDF</span>
                  </button>
                </div>

                <div className="border border-stone-200 rounded-3xl overflow-hidden bg-white shadow-xs">
                  <OrderReceiptDocument order={order} siteSettings={siteSettings} />
                </div>
              </div>
            )}

            {/* TAB 5: ESTADO DE LEALTAD */}
            {activeTab === "lealtad" && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-bold text-stone-900">
                          Programa de Lealtad & Membresía VIP
                        </h4>
                        <p className="text-xs text-stone-500">
                          Acceso condicional a compras verificadas
                        </p>
                      </div>
                    </div>

                    <div>
                      {loyaltyProgress.isEligible ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Cliente Elegible & Miembro
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 font-bold text-xs border border-amber-200 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-amber-600" />
                          No elegible para el programa
                        </span>
                      )}
                    </div>
                  </div>

                  {loyaltyProgress.isEligible ? (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                          <span className="text-stone-400 block font-medium">Nivel Actual:</span>
                          <span className="font-serif text-base font-bold text-stone-900 flex items-center gap-1.5">
                            <Crown className="w-4 h-4 text-amber-600" />
                            {loyaltyProgress.currentTier.name}
                          </span>
                        </div>

                        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                          <span className="text-stone-400 block font-medium">
                            Puntos Acumulados / Saldo:
                          </span>
                          <span className="text-base font-bold text-emerald-700">
                            {loyaltyProgress.availablePoints} pts{" "}
                            <span className="text-xs font-normal text-stone-500">
                              (de {loyaltyProgress.accumulatedPoints} ganados)
                            </span>
                          </span>
                        </div>

                        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                          <span className="text-stone-400 block font-medium">
                            Compras Verificadas:
                          </span>
                          <span className="text-base font-bold text-stone-900">
                            {loyaltyProgress.totalOrdersCount} pedidos aprobados
                          </span>
                        </div>
                      </div>

                      {loyaltyProgress.unlockedBenefits.length > 0 && (
                        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 text-xs space-y-2">
                          <span className="font-bold text-amber-950 block">
                            Beneficios Desbloqueados:
                          </span>
                          <ul className="list-disc list-inside text-stone-700 space-y-0.5">
                            {loyaltyProgress.unlockedBenefits.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2 text-stone-600">
                      <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>No elegible para el programa de lealtad</span>
                      </div>
                      <p className="leading-relaxed">
                        Este cliente no cuenta todavía con ninguna compra formalmente aprobada y
                        verificada por la administración.
                      </p>
                      <p className="text-[11px] text-stone-500 italic">
                        Nota de seguridad: De acuerdo a las políticas de Hecho por Monce, un cliente
                        solo califica para acumular puntos y ascender de nivel tras haber completado
                        y validado su primer pago oficial. No es posible alterar manualmente la
                        pertenencia sin un pago aprobado en el sistema.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Full Image Proof Lightbox */}
      {isFullImageOpen && proofUrl && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsFullImageOpen(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={proofUrl}
            alt="Comprobante en alta resolución"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </AnimatePresence>
  );
};
