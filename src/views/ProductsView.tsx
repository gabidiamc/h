import React, { useState, useMemo, useRef } from "react";
import { Search, Heart, Clock, Eye, Sparkles, X, ChevronDown, Flame } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Product } from "../types";
import { motion } from "motion/react";

export const ProductsView: React.FC = () => {
  const {
    activeProducts,
    setSelectedProductId,
    wishlist,
    toggleWishlist,
    categories: shopCategories,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [selectedAvailability, setSelectedAvailability] = useState<"all" | "available" | "custom">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">(
    "featured",
  );

  const categories: string[] = ["Todos", ...shopCategories];

  // Most ordered / popular products
  const popularProducts = useMemo(() => {
    return activeProducts.filter(
      (p) =>
        p.featured ||
        p.tag?.toLowerCase().includes("más vendido") ||
        p.tag?.toLowerCase().includes("popular"),
    );
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    return activeProducts
      .filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.ribbonColors || []).some((c) =>
            c.toLowerCase().includes(searchQuery.toLowerCase()),
          );

        const matchesCategory =
          selectedCategory === "Todos" || product.category === selectedCategory;

        const matchesAvailability =
          selectedAvailability === "all"
            ? true
            : selectedAvailability === "available"
              ? product.available
              : !product.available;

        return matchesSearch && matchesCategory && matchesAvailability;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [activeProducts, searchQuery, selectedCategory, selectedAvailability, sortBy]);

  const renderProductCard = (
    product: Product,
    isCarouselItem: boolean = false,
    index: number = 0,
  ) => {
    const isFav = wishlist.includes(product.id);
    return (
      <motion.div
        key={product.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{
          duration: 0.35,
          delay: Math.min(index * 0.03, 0.2),
          ease: [0.25, 0.1, 0.25, 1.0],
        }}
        className={`${
          isCarouselItem ? "w-[260px] sm:w-[290px] shrink-0 snap-start" : "w-full"
        } h-auto min-h-[460px] bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-rose-100/90 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.06)] hover:shadow-[0_12px_32px_-6px_rgba(244,63,94,0.18)] hover:border-rose-200 transition-all duration-300 flex flex-col justify-between group`}
      >
        {/* Uniform Image Container - adapts to image dimensions so full image is visible */}
        <div className="relative w-full aspect-4/3 sm:aspect-square shrink-0 overflow-hidden bg-gradient-to-b from-rose-50/25 to-stone-50/50 flex items-center justify-center p-3">
          <img
            src={product.images?.[0] ?? "/placeholder.svg"}
            alt={product.name}
            className="max-h-full max-w-full w-auto h-auto object-contain group-hover:scale-105 transition-transform duration-500 rounded-xl filter drop-shadow-xs"
            loading="lazy"
          />

          {product.tag && (
            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-rose-900 text-[10px] font-extrabold shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-rose-100">
              {product.tag}
            </span>
          )}

          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.12 }}
            onClick={() => toggleWishlist(product.id)}
            className="absolute top-2.5 right-2.5 p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-full bg-white/95 hover:bg-white text-stone-700 hover:text-rose-600 shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-rose-100 transition-colors cursor-pointer"
            title={isFav ? "Quitar de deseos" : "Guardar en deseos"}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${isFav ? "text-rose-600 fill-rose-600" : ""}`}
            />
          </motion.button>

          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.8 rounded-full bg-stone-950/75 backdrop-blur-md text-white text-[10px] font-medium flex items-center gap-1.5 shadow-xs">
            <Clock className="w-3 h-3 text-rose-300" />
            <span>Mín. {product.minPrepDays} días</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
              {product.category}
            </span>
            <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900 mt-1.5 line-clamp-2 group-hover:text-rose-800 transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Configured options (variants, colors, or sizes) */}
            {product.variants && product.variants.filter((v) => v.available).length > 0 ? (
              <div className="mt-2.5 flex flex-wrap gap-1 items-center">
                <span className="text-[9px] text-stone-400 font-medium">Opciones:</span>
                {product.variants
                  .filter((v) => v.available)
                  .slice(0, 3)
                  .map((v) => (
                    <span
                      key={v.id}
                      className="text-[9px] bg-rose-50 border border-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-semibold"
                    >
                      {v.name}
                    </span>
                  ))}
              </div>
            ) : product.ribbonColors && product.ribbonColors.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap gap-1 items-center">
                <span className="text-[9px] text-stone-400 font-medium">Colores:</span>
                {product.ribbonColors.slice(0, 3).map((col, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] bg-stone-100/80 border border-stone-200/60 text-stone-600 px-2 py-0.5 rounded-md font-medium"
                  >
                    {col}
                  </span>
                ))}
                {product.ribbonColors.length > 3 && (
                  <span className="text-[9px] text-stone-400">
                    +{product.ribbonColors.length - 3}
                  </span>
                )}
              </div>
            ) : product.sizes && product.sizes.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap gap-1 items-center">
                <span className="text-[9px] text-stone-400 font-medium">Tamaños:</span>
                {product.sizes.slice(0, 2).map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] bg-stone-100/80 border border-stone-200/60 text-stone-600 px-2 py-0.5 rounded-md font-medium"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-3.5 pt-3 border-t border-rose-100/70 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-stone-400 block font-medium">Desde</span>
              <span className="font-serif text-base sm:text-lg font-bold text-stone-900">
                ${product.price}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                setSelectedProductId(product.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="min-h-[38px] px-4 py-2 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white rounded-xl text-xs font-bold shadow-[0_2px_10px_rgba(225,29,72,0.22)] hover:shadow-[0_4px_14px_rgba(225,29,72,0.32)] transition-all flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>Ver detalle</span>
              <Eye className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-pink-950 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-lg relative overflow-hidden border border-rose-800/40">
        <div className="absolute right-0 top-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl space-y-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-rose-200 text-xs font-semibold backdrop-blur-xs border border-white/15 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Catálogo Oficial de Flores Eternas
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
            Nuestra Colección de Flores de Listón
          </h1>
          <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed">
            Ramos y arreglos florales creados artesanalmente con listón de seda satinado. Flores
            eternas que conservan su brillo, elegancia y aroma para siempre.
          </p>
        </div>
      </div>

      {/* Featured / Popular Products Grid (Clean Grid, No Sideways Scrolling) */}
      {popularProducts.length > 0 && !searchQuery && selectedCategory === "Todos" && (
        <section className="bg-gradient-to-b from-rose-50/70 via-pink-50/30 to-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-rose-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 text-white flex items-center justify-center shadow-xs">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                  Ramos Más Pedidos
                </h2>
                <p className="text-[11px] sm:text-xs text-stone-500">
                  Las creaciones más cotizadas de nuestro taller de listón
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-rose-700 bg-rose-100/80 border border-rose-200/60 px-2.5 py-1 rounded-full hidden sm:inline-block">
              Ediciones Favoritas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularProducts
              .slice(0, 4)
              .map((product, idx) => renderProductCard(product, false, idx))}
          </div>
        </section>
      )}

      {/* Filter and Search Bar with Dropdown and Wrapped Category Buttons */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs space-y-3.5">
        {/* Search, Category Dropdown & Sort Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-6">
            <Search className="w-4 h-4 text-rose-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por modelo, color de listón, ocasión..."
              className="w-full pl-10 pr-9 py-2.5 bg-stone-50/80 border border-stone-200/90 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 p-1 cursor-pointer transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Menú Desplegable de Categorías */}
          <div className="relative sm:col-span-1 lg:col-span-3">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2.5 bg-rose-50/50 hover:bg-rose-50/80 border border-rose-200/90 rounded-xl text-xs sm:text-sm font-semibold text-rose-950 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 cursor-pointer shadow-2xs transition-all appearance-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    Categoría: {cat}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-rose-600">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative sm:col-span-1 lg:col-span-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-3.5 pr-8 py-2.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs sm:text-sm font-semibold text-stone-800 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 cursor-pointer shadow-2xs transition-all appearance-none"
              >
                <option value="featured">✨ Ordenar: Destacados</option>
                <option value="price-asc">💵 Precio: Menor a Mayor</option>
                <option value="price-desc">💎 Precio: Mayor a Menor</option>
                <option value="name">🏷️ Nombre: A a Z</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-stone-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Category Buttons: Cleanly Wrapped (Zero Sideways Scroll) */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-rose-100/70">
          <span className="text-[11px] font-semibold text-stone-400 mr-1 hidden sm:inline">
            Filtro por ocasión:
          </span>
          {categories.map((cat) => {
            const isCatActive = selectedCategory === cat;
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.94 }}
                whileHover={{ y: -1 }}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer select-none ${
                  isCatActive
                    ? "bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900 text-white font-bold shadow-[0_2px_10px_rgba(225,29,72,0.28)] border border-rose-600"
                    : "bg-stone-50 text-stone-700 hover:bg-rose-50/80 hover:text-rose-900 border border-stone-200/80 font-medium"
                }`}
              >
                {cat}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Product Results Count */}
      <div className="flex items-center justify-between text-xs text-stone-500 px-1">
        <span>
          Mostrando <strong>{filteredProducts.length}</strong> creaciones de listón disponibles
        </span>
        {selectedCategory !== "Todos" && (
          <button
            type="button"
            onClick={() => setSelectedCategory("Todos")}
            className="text-rose-700 hover:text-rose-800 hover:underline font-semibold p-1 cursor-pointer transition-colors"
          >
            Ver todas las categorías
          </button>
        )}
      </div>

      {/* Clean, Full Product Grid (No Sliders) */}
      {filteredProducts.length === 0 ? (
        <div className="bg-stone-50 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-stone-200">
          <Sparkles className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h3 className="font-serif text-base sm:text-lg font-bold text-stone-800 mb-1">
            No encontramos productos con estos criterios
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
            Prueba buscando con otro término o selecciona otra categoría de nuestro catálogo
            artesanal.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Todos");
            }}
            className="min-h-[40px] px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            Restablecer búsqueda
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product, idx) => renderProductCard(product, false, idx))}
        </div>
      )}
    </div>
  );
};
