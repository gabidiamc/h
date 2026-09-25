import React, { useEffect, useRef, useState } from "react";
import {
  Package,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Clock3,
  XCircle,
  Truck,
  Sparkles,
  ShieldCheck,
  Gift,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Order, SiteSettings, isOrderPaymentApproved } from "../types";
import { getReceiptDisplayStatus, type ReceiptDisplayStatus } from "../utils/receiptStatus";

export type { ReceiptDisplayStatus };
export { getReceiptDisplayStatus };

export interface OrderReceiptDocumentProps {
  order: Order;
  siteSettings: SiteSettings;
  isPrintMode?: boolean;
}

export const OrderReceiptDocument: React.FC<OrderReceiptDocumentProps> = ({
  order,
  siteSettings,
  isPrintMode = false,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const statusInfo = getReceiptDisplayStatus(order);
  const StatusIcon = statusInfo.icon;

  // Track state changes to trigger discrete subtle animations only when the status actually updates
  const prevStatusRef = useRef<string>(order.status + ":" + order.paymentStatus);
  const [justUpdated, setJustUpdated] = useState<boolean>(false);

  useEffect(() => {
    const currentKey = order.status + ":" + order.paymentStatus;
    if (prevStatusRef.current !== currentKey) {
      prevStatusRef.current = currentKey;
      setJustUpdated(true);
      const t = setTimeout(() => setJustUpdated(false), 1600);
      return () => clearTimeout(t);
    }
  }, [order.status, order.paymentStatus]);

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.orderNumber || order.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Financial calculations
  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
  const giftCardDisc = order.giftCardDiscount || 0;
  const loyaltyDisc = order.loyaltyDiscount || 0;
  const totalDiscounts = giftCardDisc + loyaltyDisc;

  // Format dates
  const createdDateFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Fecha no registrada";

  return (
    <div
      id="hecho-por-monce-receipt-content"
      className={`bg-white text-stone-800 font-sans ${
        isPrintMode ? "p-8 max-w-3xl mx-auto" : "p-6 sm:p-8"
      }`}
    >
      {/* Printable CSS watermark seal */}
      <div className="relative border border-stone-200 rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-white via-stone-50/30 to-white shadow-xs overflow-hidden">
        {/* Decorative Stamp in background */}
        <div
          className={`absolute top-6 right-6 pointer-events-none select-none border-2 border-dashed rounded-2xl px-3.5 py-1.5 rotate-[-8deg] opacity-60 uppercase font-mono text-xs font-black tracking-widest ${statusInfo.stampColor} hidden sm:block`}
        >
          {statusInfo.stampText}
        </div>

        {/* 1. Header: Brand Logo & Company Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-rose-700 text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs">
                M
              </span>
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight leading-none">
                  {siteSettings.businessName || "Hecho Por Monse"}
                </h1>
                <p className="text-[11px] text-rose-700 font-medium tracking-wide">
                  Ramos de Listón Satinado & Creaciones Eternas
                </p>
              </div>
            </div>
            <p className="text-[11px] text-stone-500 pt-1 leading-relaxed max-w-sm">
              Taller artesanal de arreglos florales infinitos, cajas sorpresa y regalos
              personalizados con dedicación única.
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-stone-500 space-y-0.5">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
              <span>{order.orderNumber}</span>
              {!isPrintMode && (
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  title="Copiar ID de pedido"
                  className="p-1 hover:text-rose-700 rounded transition-colors cursor-pointer"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
            <p className="text-[11px] text-stone-500 pt-1">
              <strong>Emisión:</strong> {createdDateFormatted}
            </p>
            <p className="text-[11px] text-stone-500">
              <strong>WhatsApp:</strong> {siteSettings.whatsapp || "+52 (871) 329-8730"}
            </p>
          </div>
        </div>

        {/* 2. Dynamic Real Status Banner (with discreet transition) */}
        <div className="my-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={statusInfo.type + (justUpdated ? "-updated" : "")}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className={`p-4 rounded-2xl border ${statusInfo.borderColor} ${statusInfo.badgeColor} relative overflow-hidden transition-all duration-300`}
            >
              <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center bg-white shadow-xs shrink-0 ${statusInfo.textColor}`}
                  >
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">
                      Estado Oficial del Pedido
                    </span>
                    <h3 className={`text-sm font-bold ${statusInfo.textColor} leading-tight`}>
                      {statusInfo.badgeLabel}
                    </h3>
                  </div>
                </div>

                <div className="text-[11px] text-right font-medium">
                  {isOrderPaymentApproved(order) ? (
                    <span className="inline-flex items-center gap-1 text-emerald-800 bg-white/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Pago Verificado
                    </span>
                  ) : order.paymentStatus === "RECHAZADO" ? (
                    <span className="inline-flex items-center gap-1 text-rose-800 bg-white/80 px-2.5 py-0.5 rounded-full border border-rose-200">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      Comprobante Inválido
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-800 bg-white/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Pago Pendiente de Verificación
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-black/5 text-xs flex flex-col sm:flex-row justify-between gap-1 opacity-90">
                <p>{statusInfo.description}</p>
                {statusInfo.subDescription && (
                  <p className="text-[11px] font-medium italic">{statusInfo.subDescription}</p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3. Customer & Delivery Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5 text-xs">
          {/* Client Details */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
            <h4 className="font-bold text-stone-900 uppercase text-[10px] tracking-wider text-rose-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Datos del Cliente</span>
            </h4>
            <div className="space-y-1 text-stone-600">
              <p>
                <strong className="text-stone-900">Nombre:</strong> {order.customerName}
              </p>
              <p className="flex items-center gap-1.5 truncate">
                <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                <span>{order.customerEmail}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                <span>{order.customerPhone}</span>
              </p>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
            <h4 className="font-bold text-stone-900 uppercase text-[10px] tracking-wider text-rose-800 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              <span>Modalidad y Fecha de Entrega</span>
            </h4>
            <div className="space-y-1 text-stone-600">
              {order.isDirectQuote ||
              order.items?.some((i: any) => i.productType === "especial") ||
              order.scheduledDate === "A convenir" ||
              order.scheduledDate === "Cotización Directa" ||
              !order.scheduledDate ? (
                <p className="flex items-center gap-1.5 text-amber-900 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Modalidad:</strong> Cotización Directa con la Dueña (Coordinación por chat)
                  </span>
                </p>
              ) : (
                <>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>
                      <strong>Fecha programada:</strong> {order.scheduledDate}
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>
                      <strong>Horario preferente:</strong> {order.scheduledTimeSlot}
                    </span>
                  </p>
                </>
              )}
              <p className="flex items-start gap-1.5">
                <MapPin className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Modalidad:</strong>{" "}
                  {order.deliveryMethod === "ENVIO" ? (
                    <span className="text-rose-900 font-medium">
                      Envío a domicilio ({order.deliveryAddress || "Dirección pendiente"})
                    </span>
                  ) : (
                    <span className="text-stone-800">
                      Retiro en Taller ({siteSettings.pickupAddress || "Torreón, Coah."})
                    </span>
                  )}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 4. Products Table */}
        <div className="my-5">
          <h4 className="font-bold text-stone-900 uppercase text-[10px] tracking-wider text-rose-800 mb-2 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            <span>Productos y Personalizaciones</span>
          </h4>

          <div className="border border-stone-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Detalle del Ramo</th>
                  <th className="p-3 text-center">Cant.</th>
                  <th className="p-3 text-right">Precio Unit.</th>
                  <th className="p-3 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {order.items.map((item, index) => (
                  <tr key={index} className="hover:bg-stone-50/50">
                    <td className="p-3 space-y-1">
                      <div className="font-serif font-bold text-stone-900 text-sm">
                        {item.productName}
                      </div>

                      {/* Customization Details */}
                      <div className="flex flex-wrap gap-1.5 text-[11px] text-stone-500">
                        {item.selectedSize && (
                          <span className="bg-stone-100 px-2 py-0.5 rounded-md text-stone-700">
                            Tamaño: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="bg-rose-50 px-2 py-0.5 rounded-md text-rose-800 border border-rose-100">
                            Color listón: {item.selectedColor}
                          </span>
                        )}
                        {item.recipientName && (
                          <span className="bg-pink-50 px-2 py-0.5 rounded-md text-pink-800">
                            Destinataria: {item.recipientName}
                          </span>
                        )}
                      </div>

                      {item.selectedExtras && item.selectedExtras.length > 0 && (
                        <div className="text-[11px] text-stone-500">
                          <strong className="text-stone-700">Extras incluidos:</strong>{" "}
                          {item.selectedExtras.map((e) => `${e.name} (+$${e.price})`).join(", ")}
                        </div>
                      )}

                      {item.dedicationMessage && (
                        <div className="bg-rose-50/60 p-2 rounded-xl border border-rose-100/70 text-[11px] text-rose-900 italic mt-1">
                          <strong>Carta/Dedicatoria:</strong> &ldquo;{item.dedicationMessage}&rdquo;
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold text-stone-900">{item.quantity}</td>
                    <td className="p-3 text-right font-medium text-stone-600">
                      ${item.unitPrice.toFixed(2)} USD
                    </td>
                    <td className="p-3 text-right font-bold text-stone-900">
                      ${item.subtotal.toFixed(2)} USD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Financial Summary Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 pt-4 border-t border-stone-100">
          {/* Notes or Bank Details for Payment */}
          <div className="space-y-3">
            {order.notes && (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs">
                <span className="font-bold text-stone-800 block mb-0.5">
                  Instrucciones especiales del cliente:
                </span>
                <p className="text-stone-600 italic leading-relaxed">{order.notes}</p>
              </div>
            )}


          </div>

          {/* Subtotals & Totals Table */}
          <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal productos:</span>
              <span className="font-semibold text-stone-900">${itemsSubtotal.toFixed(2)} USD</span>
            </div>

            {giftCardDisc > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span className="flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" />
                  Tarjeta de Regalo ({order.giftCardCode || "Aplicada"}):
                </span>
                <span>-${giftCardDisc.toFixed(2)} USD</span>
              </div>
            )}

            {loyaltyDisc > 0 && (
              <div className="flex justify-between text-amber-800 font-medium">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Descuento Lealtad ({order.appliedLoyaltyTier || "Club VIP"}):
                </span>
                <span>-${loyaltyDisc.toFixed(2)} USD</span>
              </div>
            )}

            <div className="flex justify-between text-stone-500 text-[11px]">
              <span>Impuestos (IVA / Tasas):</span>
              <span>Incluidos ($0.00 USD)</span>
            </div>

            <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-bold text-stone-900">
              <span>Total del Pedido:</span>
              <span className="text-rose-700 font-serif text-base font-bold">
                ${order.totalPrice.toFixed(2)} USD
              </span>
            </div>

            {/* Deposit & Balance Breakdown */}
            <div className="pt-2 border-t border-dashed border-stone-200 space-y-1 text-xs">
              <div className="flex justify-between font-medium text-stone-700">
                <span>Anticipo requerido para apartar:</span>
                <span>${order.requiredDeposit.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-800">
                <span>Monto efectivamente pagado:</span>
                <span>${(order.amountPaid || 0).toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Saldo restante a liquidar contra entrega:</span>
                <span className="font-bold text-stone-900">
                  $
                  {(order.remainingBalance !== undefined
                    ? order.remainingBalance
                    : Math.max(0, order.totalPrice - (order.amountPaid || 0))
                  ).toFixed(2)}{" "}
                  USD
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Footer Notes & Official Verification Badge */}
        <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-stone-400">
          <div className="space-y-0.5">
            <p className="text-stone-600 font-medium text-[11px]">
              ¡Gracias por elegir Hecho por Monce para inmortalizar tus momentos especiales! 🌹
            </p>
            <p className="text-[10px] text-stone-400">
              Cada rosa es confeccionada artesanalmente pétalo por pétalo con listón satinado de
              alta densidad.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/80">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
            <span>ID Auténtico: {order.orderNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
