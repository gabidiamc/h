import React from "react";
import { Heart, ShoppingCart, Sparkles, ArrowRight, Eye, CheckCircle2, Trash2 } from "lucide-react";
import { useApp } from "../../context/AppContext";

interface MiMonceFavoritosProps {
  onSelectProduct?: (productId: string) => void;
  onExploreCatalog?: () => void;
}

export const MiMonceFavoritos: React.FC<MiMonceFavoritosProps> = ({
  onSelectProduct,
  onExploreCatalog,
}) => {
  const { wishlist, products, toggleWishlist, addToCart, setSelectedProductId } = useApp();

  const favoriteProducts = products.filter((p) => wishlist.includes(p.id) && !p.deletedAt);

  const handleOpenProduct = (id: string) => {
    if (onSelectProduct) {
      onSelectProduct(id);
    } else {
      setSelectedProductId(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
            <h2 className="font-serif text-2xl font-bold text-stone-900">Mis Ramos Favoritos</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Tus creaciones florales guardadas, sincronizadas en la nube para tus futuros pedidos y
            ocasiones.
          </p>
        </div>

        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200/80 self-start sm:self-auto">
          {favoriteProducts.length}{" "}
          {favoriteProducts.length === 1 ? "ramo guardado" : "ramos guardados"}
        </span>
      </div>

      {/* Grid of Favorites */}
      {favoriteProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-rose-100 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-800">Aún no tienes ramos favoritos</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Guarda tus ramos eternos preferidos tocando el corazón ❤️ en nuestro catálogo para
              tenerlos a la mano en todo momento.
            </p>
          </div>
          {onExploreCatalog && (
            <button
              type="button"
              onClick={onExploreCatalog}
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Explorar Catálogo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-rose-100/90 shadow-[0_2px_14px_rgba(244,63,94,0.04)] hover:shadow-[0_6px_24px_rgba(244,63,94,0.08)] transition-all overflow-hidden flex flex-col group"
            >
              {/* Image Box */}
              <div className="relative aspect-square overflow-hidden bg-stone-100">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badge Category */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-stone-800 backdrop-blur-xs shadow-xs border border-white/60">
                    {product.category}
                  </span>
                </div>

                {/* Remove from wishlist button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                  title="Quitar de favoritos"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>

              {/* Details Box */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-serif text-sm font-bold text-stone-900 group-hover:text-rose-800 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-base font-bold font-serif text-stone-900">
                    ${product.price.toFixed(2)} USD
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {product.available ? "Disponible" : "Agotado"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenProduct(product.id)}
                    className="flex-1 py-2 px-3 rounded-xl border border-stone-200 hover:border-rose-300 text-stone-700 hover:text-rose-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver detalles</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenProduct(product.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Al carrito</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
