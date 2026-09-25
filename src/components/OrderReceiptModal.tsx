import React, { useRef, useState } from "react";
import { X, Printer, Download, FileText, Check, Share2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Order, SiteSettings } from "../types";
import { OrderReceiptDocument } from "./OrderReceiptDocument";

export interface OrderReceiptModalProps {
  order: Order | null;
  siteSettings: SiteSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order,
  siteSettings,
  isOpen,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("hecho-por-monce-receipt-content");
    if (!printContent) {
      window.print();
      return;
    }

    // Open clean print window for crisp vector typography
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Recibo Oficial #${order.orderNumber} - Hecho por Monce</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 10mm; font-family: 'Plus Jakarta Sans', sans-serif; }
              @page { size: A4; margin: 8mm; }
              .no-print { display: none !important; }
            }
            body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; color: #1c1917; }
            .font-serif { font-family: 'Playfair Display', serif; }
          </style>
        </head>
        <body>
          <div class="max-w-3xl mx-auto py-4">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 400);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      // Fallback for popup-blockers: standard print
      window.print();
    }
  };

  const handleDownloadPDF = () => {
    // Triggers print dialog which is the universal, vector-sharp PDF export in modern browsers
    handlePrint();
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/?orderId=${encodeURIComponent(order.orderNumber || order.id)}`,
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 z-10 flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Top Modal Bar */}
          <div className="px-5 py-4 bg-stone-50 border-b border-stone-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 leading-tight">
                  Recibo Oficial del Pedido
                </h3>
                <p className="text-[11px] text-stone-500 font-mono">
                  Identificador: #{order.orderNumber}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Imprimir Recibo"
              >
                <Printer className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Descargar PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Descargar PDF</span>
              </button>

              <button
                type="button"
                onClick={handleShareLink}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                title="Copiar enlace de seguimiento"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer ml-1"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Receipt Area */}
          <div ref={printAreaRef} className="flex-1 overflow-y-auto p-2 sm:p-4 bg-stone-100/60">
            <div className="max-w-3xl mx-auto shadow-sm rounded-3xl overflow-hidden bg-white">
              <OrderReceiptDocument order={order} siteSettings={siteSettings} />
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 shrink-0">
            <span>Hecho por Monce &bull; Torreón, Coahuila</span>
            <button
              type="button"
              onClick={onClose}
              className="font-semibold text-rose-700 hover:underline cursor-pointer"
            >
              Cerrar Vista
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
