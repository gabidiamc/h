import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ShoppingBag, Heart, X, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";

interface FloatingToastProps {
  onOpenCart: () => void;
  onOpenWishlist: () => void;
}

export const FloatingToast: React.FC<FloatingToastProps> = ({ onOpenCart, onOpenWishlist }) => {
  const { toast, clearToast } = useApp();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 4200);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-50 pointer-events-none max-w-sm w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="pointer-events-auto bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-rose-100/90 flex items-center gap-3 relative overflow-hidden"
          >
            {/* Soft accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 to-rose-700" />

            {/* Thumbnail or Icon */}
            {toast.imageUrl ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-stone-50 border border-stone-200/80 p-1 flex items-center justify-center shrink-0">
                <img
                  src={toast.imageUrl}
                  alt={toast.title}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {toast.title}
                </span>
              </div>
              {toast.subtitle && (
                <p className="text-xs font-semibold text-stone-800 truncate mt-0.5">
                  {toast.subtitle}
                </p>
              )}
              {toast.price !== undefined && (
                <p className="text-[11px] font-bold text-rose-800 mt-0.5">${toast.price}</p>
              )}

              {toast.actionLabel && (
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    if (
                      toast.actionLabel?.toLowerCase().includes("bolsa") ||
                      toast.actionLabel?.toLowerCase().includes("carrito")
                    ) {
                      onOpenCart();
                    } else if (
                      toast.actionLabel?.toLowerCase().includes("favorito") ||
                      toast.actionLabel?.toLowerCase().includes("deseo")
                    ) {
                      onOpenWishlist();
                    } else if (toast.onAction) {
                      toast.onAction();
                    }
                    clearToast();
                  }}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 transition-colors"
                >
                  <span>{toast.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </motion.button>
              )}
            </div>

            {/* Dismiss button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={clearToast}
              className="absolute top-2.5 right-2.5 p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </motion.button>

            {/* Subtle duration bar at bottom */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4.2, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-200 origin-left"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
