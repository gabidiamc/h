import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Heart, Trash2, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({ isOpen, onClose }) => {
  const { wishlist, toggleWishlist, products, setSelectedProductId, setActiveTab } = useApp();

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id) && !p.deletedAt);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 320 }}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 relative max-h-[85vh] flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600 fill-rose-100" />
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Mi Lista de Deseos ({wishlistProducts.length})
                </h3>
              </div>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-rose-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {wishlistProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <Heart className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-stone-700">
                    No tienes productos guardados
                  </p>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                    Explora nuestros ramos de listón y haz clic en el corazón para guardarlos para
                    tus fechas especiales.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <AnimatePresence>
                    {wishlistProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 hover:border-rose-200 transition-colors"
                      >
                        <div className="w-16 h-16 rounded-xl bg-white p-1 border border-stone-200 shrink-0 flex items-center justify-center">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 truncate">
                            {product.name}
                          </h4>
                          <span className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider block">
                            {product.category}
                          </span>
                          <p className="text-xs font-bold text-stone-900 mt-1">
                            Desde ${product.price}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                              setSelectedProductId(product.id);
                              setActiveTab("productos");
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ver</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.88 }}
                            onClick={() => toggleWishlist(product.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 cursor-pointer"
                            title="Quitar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 cursor-pointer"
              >
                Cerrar
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
