import React from "react";
import { CheckCircle2, AlertCircle, Clock3, XCircle } from "lucide-react";
import { Order, isOrderPaymentApproved } from "../types";

export type ReceiptDisplayStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_UNDER_REVIEW"
  | "PAYMENT_VERIFIED"
  | "DELIVERED"
  | "PAYMENT_REJECTED"
  | "CANCELLED_OR_REFUNDED";

export function getReceiptDisplayStatus(order: Order): {
  type: ReceiptDisplayStatus;
  badgeLabel: string;
  badgeColor: string;
  textColor: string;
  borderColor: string;
  description: string;
  subDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  stampText: string;
  stampColor: string;
} {
  // 1. Cancelled / Refunded
  if (order.status === "CANCELADO" || order.paymentStatus === "CANCELADO") {
    const isRefunded = order.amountPaid > 0;
    return {
      type: "CANCELLED_OR_REFUNDED",
      badgeLabel: isRefunded ? "Pago Reembolsado — Pedido Cancelado" : "Pedido Cancelado",
      badgeColor: "bg-stone-100",
      textColor: "text-stone-700",
      borderColor: "border-stone-300",
      description: isRefunded
        ? "El pedido fue cancelado y el anticipo procesado para reembolso."
        : "Este pedido fue cancelado en el sistema.",
      subDescription: order.cancellationReason
        ? `Motivo: ${order.cancellationReason}`
        : "Registro histórico inmutable.",
      icon: XCircle,
      stampText: isRefunded ? "REEMBOLSADO" : "CANCELADO",
      stampColor: "border-stone-400 text-stone-500",
    };
  }

  // 2. Rejected Payment Proof
  if (order.paymentStatus === "RECHAZADO") {
    const reason =
      order.paymentProof?.rejectionReason ||
      order.notes ||
      "El comprobante bancario no coincide con los registros.";
    return {
      type: "PAYMENT_REJECTED",
      badgeLabel: "Pago rechazado — Se requiere un nuevo comprobante",
      badgeColor: "bg-rose-50",
      textColor: "text-rose-800",
      borderColor: "border-rose-200",
      description: "El comprobante enviado no pudo ser validado por la administración.",
      subDescription: `Motivo: ${reason}. Por favor sube un nuevo comprobante legible.`,
      icon: AlertCircle,
      stampText: "PAGO RECHAZADO",
      stampColor: "border-rose-500 text-rose-600",
    };
  }

  // 3. Delivered & Fully Settled
  if (order.status === "ENTREGADO") {
    return {
      type: "DELIVERED",
      badgeLabel: "Pedido entregado",
      badgeColor: "bg-purple-50",
      textColor: "text-purple-900",
      borderColor: "border-purple-200",
      description: "Ramo artesanal entregado y recibido con satisfacción por el cliente.",
      subDescription: "Ciclo de compra y liquidación completado exitosamente.",
      icon: CheckCircle2,
      stampText: "ENTREGADO",
      stampColor: "border-purple-600 text-purple-700",
    };
  }

  // 4. Approved & Verified Payment
  if (isOrderPaymentApproved(order)) {
    const verifiedBy = order.paymentVerifiedBy || "Monce (Dueña)";
    const verifiedAt = order.paymentVerifiedAt || order.updatedAt;
    const formattedDate = verifiedAt ? new Date(verifiedAt).toLocaleDateString("es-MX") : "";

    return {
      type: "PAYMENT_VERIFIED",
      badgeLabel: "Pago confirmado — Pago verificado",
      badgeColor: "bg-emerald-50",
      textColor: "text-emerald-900",
      borderColor: "border-emerald-200",
      description: "Pago de anticipo verificado y acreditado oficialmente en cuenta.",
      subDescription: `Aprobado por: ${verifiedBy}${formattedDate ? ` el ${formattedDate}` : ""}.`,
      icon: CheckCircle2,
      stampText: "PAGO VERIFICADO",
      stampColor: "border-emerald-600 text-emerald-700",
    };
  }

  // 5. Payment Proof Uploaded & Under Review
  const hasProof = Boolean(order.paymentProof?.fileUrl || order.paymentProofUrl);
  if (
    order.paymentStatus === "VERIFICANDO" ||
    order.paymentStatus === "COMPROBANTE_EN_REVISION" ||
    order.status === "PAGO_PENDIENTE_VERIFICACION" ||
    order.status === "COMPROBANTE_EN_REVISION" ||
    (hasProof && !isOrderPaymentApproved(order))
  ) {
    return {
      type: "PAYMENT_UNDER_REVIEW",
      badgeLabel: "Comprobante recibido — Pago en revisión",
      badgeColor: "bg-amber-50",
      textColor: "text-amber-900",
      borderColor: "border-amber-200",
      description: "Comprobante bancario recibido en el sistema.",
      subDescription:
        "Pendiente de verificación manual por la dueña. El pedido se confirmará al validar el depósito.",
      icon: Clock3,
      stampText: "EN REVISIÓN",
      stampColor: "border-amber-500 text-amber-600",
    };
  }

  // 6. Default / Pending Deposit Payment
  return {
    type: "PENDING_PAYMENT",
    badgeLabel: "Pedido creado — Pago pendiente",
    badgeColor: "bg-amber-50",
    textColor: "text-amber-900",
    borderColor: "border-amber-200",
    description:
      "Pedido agendado en el taller. Requiere anticipo para apartar la fecha en agenda.",
    subDescription: "",
    icon: Clock3,
    stampText: "PENDIENTE DE PAGO",
    stampColor: "border-amber-500 text-amber-600",
  };
}
