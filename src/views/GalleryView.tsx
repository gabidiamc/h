import React, { useState } from "react";
import { Sparkles, X, Eye, ChevronDown, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { GalleryItem } from "../types";

export const GalleryView: React.FC = () => {
  const { gallery, setActiveTab } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [activeModalItem, setActiveModalItem] = useState<GalleryItem | null>(null);

  const categories = ["Todos", "Ramos", "Parejas", "Graduaciones", "Cumpleaños", "Personalizados"];

  const filteredItems =
    selectedCategory === "Todos"
      ? gallery
      : gallery.filter((item) =>
          item.category.toLowerCase().includes(selectedCategory.toLowerCase()),
        );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5 sm:space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-rose-600" />
          <span>Galería de Entregas Reales</span>
        </span>
        <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight">
          Momentos Inolvidables Confeccionados en Listón
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Cada flor cuenta una historia de amor, gratitud y celebración enlistonada a mano con
          acabados impecables.
        </p>

        {/* Dropdown Menu & Category Filter Badges */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Menú Desplegable Principal */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto pl-4 pr-10 py-2.5 bg-rose-50/70 hover:bg-rose-50 border border-rose-200 text-rose-950 font-semibold text-xs rounded-xl shadow-xs focus:outline-none focus:border-rose-500 cursor-pointer appearance-none transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  Categoría: {cat}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-rose-700">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Wrapped Category Badges for Quick Desktop Selection */}
          <div className="hidden sm:flex flex-wrap justify-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-rose-700 to-rose-800 text-white shadow-xs"
                    : "bg-stone-100/90 text-stone-600 hover:bg-rose-50 hover:text-rose-900 border border-stone-200/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Content - Full Responsive Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-stone-50 rounded-3xl border border-stone-200">
          <p className="text-xs sm:text-sm text-stone-500">
            No hay fotografías publicadas en esta categoría.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveModalItem(item)}
              className="w-full h-[390px] sm:h-[410px] group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-rose-100/80 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.06)] hover:shadow-[0_12px_32px_-6px_rgba(244,63,94,0.18)] hover:border-rose-200 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="relative w-full h-[240px] sm:h-[260px] shrink-0 bg-stone-50/60 flex items-center justify-center p-3 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="max-h-full max-w-full w-auto h-auto object-contain group-hover:scale-105 transition-transform duration-500 rounded-xl filter drop-shadow-xs"
                  loading="lazy"
                />
              </div>

              <div className="p-4 border-t border-stone-100 bg-white flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                    {item.category}
                  </span>
                  <h4 className="font-serif font-bold text-sm text-stone-900 mt-1 line-clamp-1 group-hover:text-rose-800 transition-colors">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="mt-3 pt-2.5 border-t border-rose-100/70 flex items-center justify-between text-[11px] text-stone-400">
                  <span>{item.date}</span>
                  <span className="flex items-center gap-1 font-semibold text-rose-700 group-hover:text-rose-900 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ampliar</span>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 rounded-2xl sm:rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative border border-stone-800">
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-3.5 right-3.5 z-10 p-2.5 rounded-full bg-black/70 text-white hover:bg-rose-700 transition-colors cursor-pointer"
              aria-label="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Container adjusts to photo dimensions */}
            <div className="w-full min-h-[260px] max-h-[70vh] bg-stone-950 flex items-center justify-center p-4">
              <img
                src={activeModalItem.imageUrl}
                alt={activeModalItem.title}
                className="max-h-[66vh] max-w-full w-auto h-auto object-contain rounded-xl"
              />
            </div>

            <div className="p-5 sm:p-6 text-white space-y-1.5">
              <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider">
                {activeModalItem.category}
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold">{activeModalItem.title}</h3>
              {activeModalItem.description && (
                <p className="text-xs text-stone-300 leading-relaxed">
                  {activeModalItem.description}
                </p>
              )}
              {activeModalItem.date && (
                <span className="text-[11px] text-stone-400 block pt-1">
                  Entrega realizada el {activeModalItem.date}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Banner */}
      <div className="bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50/50 rounded-3xl p-6 sm:p-10 border border-rose-200 text-center space-y-3.5 shadow-xs">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
          ¿Te gustaría un ramo idéntico o en otra combinación de colores?
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
          Podemos confeccionar a medida cualquiera de estos modelos con las tonalidades de listón,
          diamantes, mariposas y coronas que elijas.
        </p>
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setActiveTab("personalizados");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="min-h-[44px] px-8 py-3 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-bold rounded-xl text-xs sm:text-sm shadow-[0_4px_16px_rgba(225,29,72,0.3)] transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <span>Cotizar mi modelo ahora</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
