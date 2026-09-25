import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ribbonColorHex } from "../data/ribbonColors";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Calendar,
  Sparkles,
  Check,
  Plus,
  Minus,
  Star,
  MessageSquare,
  MessageCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ProductExtra, ProductSizeOption, ProductVariant, CartItem } from "../types";
import { SpecialProductChatIntakeModal } from "../components/SpecialProductChatIntakeModal";

const FormattedProductDescription: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-stone-600">
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index} className="font-bold text-stone-800">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      )}
    </p>
  );
};

interface ProductDetailViewProps {
  productId: string;
  onBack: () => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  onBack,
  onOpenCart,
  onOpenAuth,
}) => {
  const {
    products,
    addToCart,
    wishlist,
    toggleWishlist,
    checkDateAvailability,
    reviews,
    siteSettings,
  } = useApp();

  const product = products.find((p) => p.id === productId);

  const isPeluche =
    product?.customItemType === "peluche" ||
    product?.category?.toLowerCase() === "peluches" ||
    product?.name?.toLowerCase().includes("peluche") ||
    product?.name?.toLowerCase().includes("amigurumi") ||
    product?.name?.toLowerCase().includes("tejido");

  // States
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSizeOption | undefined>(() => {
    return product?.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;
  });
  const [selectedColor, setSelectedColor] = useState<string | undefined>(() => {
    return product?.ribbonColors && product.ribbonColors.filter(Boolean).length > 0
      ? product.ribbonColors[0]
      : undefined;
  });
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(() => {
    const available = (product?.variants || []).filter((v) => v.available);
    return available.length > 0 ? available[0] : undefined;
  });
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [extraPickerId, setExtraPickerId] = useState<string | null>(null);
  const [pendingExtraOptionId, setPendingExtraOptionId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + (product?.minPrepDays || 2));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState("11:00 AM - 1:00 PM");
  const deliveryMethod = "RETIRO" as const;
  const [dedicationMessage, setDedicationMessage] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSpecialChatModalOpen, setIsSpecialChatModalOpen] = useState(false);

  // Minimum date calculation (Sin días mínimos de anticipo para producto especial)
  const minDateString = useMemo(() => {
    const d = new Date();
    const daysToAdd = product?.productType === "especial" ? 0 : product?.minPrepDays || 2;
    d.setDate(d.getDate() + daysToAdd);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [product?.minPrepDays, product?.productType]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">
          Producto no encontrado
        </h2>
        <button onClick={onBack} className="text-xs font-semibold text-rose-700 underline">
          Volver al catálogo
        </button>
      </div>
    );
  }

  const isFav = wishlist.includes(product.id);

  // Extras propios del producto + extras de los grupos activados
  const groupExtras = (siteSettings.extraGroups || [])
    .filter((g) => (product.extraGroupIds || []).includes(g.id))
    .flatMap((g) => g.extras || []);
  const availableExtras: ProductExtra[] = [
    ...(product.extrasAvailable || []),
    ...groupExtras.filter(
      (extra) => !(product.extrasAvailable || []).some((x) => x.id === extra.id),
    ),
  ];

  const descriptionText = (product.description || product.shortDescription || "").trim();

  // Price calculations
  const basePrice =
    typeof selectedVariant?.price === "number"
      ? selectedVariant.price
      : selectedSize
        ? selectedSize.price
        : product.price;
  const extrasTotal = selectedExtras.reduce((acc, e) => acc + e.price, 0);
  const unitPrice = basePrice + extrasTotal;
  const totalPrice = unitPrice * quantity;
  const depositRequired =
    Math.round(totalPrice * (siteSettings.depositPercentage / 100) * 100) / 100;

  const dateAvailability = scheduledDate ? checkDateAvailability(scheduledDate) : null;
  const isDateBlockedOrFull =
    dateAvailability && (dateAvailability.isBlocked || dateAvailability.status === "FULL");

  const extraOptionsOf = (extra: ProductExtra) =>
    (extra.options || []).filter((o) => o.available !== false);

  const isExtraSelected = (extra: ProductExtra) =>
    selectedExtras.some((e) => e.id === extra.id || e.id.startsWith(extra.id + "::"));

  const selectedOptionOf = (extra: ProductExtra) =>
    selectedExtras.find((e) => e.id.startsWith(extra.id + "::"));

  const openExtraDetails = (extra: ProductExtra) => {
    const chosen = selectedOptionOf(extra);
    setPendingExtraOptionId(chosen?.id.split("::")[1] || null);
    setExtraPickerId(extra.id);
  };

  const handleAddExtra = (extra: ProductExtra) => {
    const option = extraOptionsOf(extra).find((item) => item.id === pendingExtraOptionId);
    if (extraOptionsOf(extra).length > 0 && !option) return;

    const picked: ProductExtra = option
      ? {
          id: `${extra.id}::${option.id}`,
          name: `${extra.name}: ${option.name || "Opción"}`,
          price: option.price ?? extra.price,
          description: extra.description,
          image: option.image,
        }
      : extra;
    setSelectedExtras((prev) => [
      ...prev.filter((e) => e.id !== extra.id && !e.id.startsWith(extra.id + "::")),
      picked,
    ]);
    setExtraPickerId(null);
    setPendingExtraOptionId(null);
  };

  const handleAddToCart = (openCartDrawerAfter = true) => {
    if (!scheduledDate) {
      setFeedback(
        "Por favor selecciona una fecha de entrega o retiro antes de agregar al carrito.",
      );
      return;
    }

    if (isDateBlockedOrFull) {
      setFeedback("La fecha seleccionada no tiene disponibilidad. Por favor elige otro día.");
      return;
    }

    const cartItem: CartItem = {
      id: "cart-" + Date.now(),
      product,
      quantity,
      selectedSize,
      selectedColor: selectedVariant?.color || selectedColor || undefined,
      selectedVariant,
      selectedExtras,
      scheduledDate,
      scheduledTimeSlot,
      deliveryMethod,
      dedicationMessage,
      recipientName,
      itemTotal: totalPrice,
    };

    addToCart(cartItem);
    setFeedback("¡Añadido a tu bolsa de compras!");
    if (openCartDrawerAfter) {
      setTimeout(() => {
        onOpenCart();
      }, 300);
    }
  };

  // Reviews for this product
  const productReviews = reviews.filter(
    (r) =>
      r.productId === product.id ||
      (r.productName && r.productName.toLowerCase() === product.name.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-8 sm:space-y-12">
      {/* Top back link */}
      <motion.button
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.96 }}
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-rose-800 transition-colors cursor-pointer py-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Todos los Productos</span>
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        {/* Gallery Col (Left) */}
        <div className="lg:col-span-6 space-y-3 sm:space-y-4">
          {/* Main big image - Adapts to horizontal or vertical photo without cutting */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[280px] max-h-[460px] bg-stone-900/5 border border-stone-200 shadow-sm flex items-center justify-center p-3">
            <motion.img
              key={`${selectedVariant?.id || "main"}-${selectedImageIndex}`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              src={
                selectedVariant?.image ||
                (product.images && product.images[selectedImageIndex]) ||
                product.images?.[0] ||
                "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80"
              }
              alt={selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name}
              className="max-h-[430px] max-w-full w-auto h-auto object-contain rounded-xl"
            />
            {selectedVariant && (
              <span className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 px-2.5 sm:px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-xs text-white text-[11px] sm:text-xs font-medium shadow-xs">
                Versión: {selectedVariant.name}
              </span>
            )}
            {product.tag && (
              <span className="absolute top-3 sm:top-4 left-3 sm:left-4 px-2.5 sm:px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-rose-900 text-[11px] sm:text-xs font-bold shadow-xs">
                {product.tag}
              </span>
            )}
            <motion.button
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 sm:p-2.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-white/95 hover:bg-white text-stone-700 hover:text-rose-600 shadow-xs transition-colors cursor-pointer"
            >
              <Heart className={`w-5 h-5 ${isFav ? "text-rose-600 fill-rose-600" : ""}`} />
            </motion.button>
          </div>

          {/* Thumbnails (No horizontal scroll, clean wrap) */}
          {product.images && product.images.length > 1 && (
            <div className="flex flex-wrap gap-2 sm:gap-3 pt-1">
              {product.images.map((img, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden border-2 shrink-0 transition-all bg-stone-50 p-1 flex items-center justify-center cursor-pointer ${
                    selectedImageIndex === idx
                      ? "border-rose-600 ring-2 ring-rose-300 shadow-sm"
                      : "border-stone-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Vista ${idx + 1}`}
                    className="max-h-full max-w-full w-auto h-auto object-contain"
                  />
                </motion.button>
              ))}
            </div>
          )}

          {/* Product description */}
          <div className="bg-stone-50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-stone-200">
            <FormattedProductDescription
              text={descriptionText || "Aún no hay descripción para este producto."}
            />
          </div>
        </div>

        {/* Product Details & Booking Configurator Col (Right) */}
        <div className="lg:col-span-6 space-y-5 sm:space-y-6">
          <div>
            <span className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-rose-700 block">
              {product.category}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 mt-1 leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing Preview / Special Product Quote Banner */}
          {product.productType === "especial" ? (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-rose-50/70 rounded-xl sm:rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 inline-flex items-center gap-1">
                    {isPeluche ? (
                      <>
                        <span>🧸</span>
                        <span>Peluche Tejido a Mano Personalizado</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-700" />
                        <span>Ramo Especial Personalizado</span>
                      </>
                    )}
                  </span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-1">
                  {isPeluche
                    ? "Cotización de Peluche Tejido con la Dueña"
                    : "Cotización Directa con la Dueña"}
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  {isPeluche
                    ? "El precio final y tiempo de confección se acuerdan directamente por el chat con Monce según tu diseño o fotos."
                    : "El precio final y tiempo de entrega se acuerdan directamente por el chat con Monce según tus fotos o ideas."}
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] text-stone-500 block">Precio orientativo base</span>
                <span className="text-xs font-bold text-stone-700">Desde ${product.price} USD</span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 sm:p-4 bg-rose-50/60 rounded-xl sm:rounded-2xl border border-rose-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] sm:text-xs text-rose-800 font-medium block">
                  Inversión Total
                </span>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-rose-950">
                  ${totalPrice}
                </span>
              </div>
              <div className="text-right text-[11px] sm:text-xs text-rose-900/80">
                <span>
                  Aparta tu fecha con el <strong>{siteSettings.depositPercentage}%</strong>
                </span>
                <p className="font-bold text-rose-700 text-xs sm:text-sm">
                  Anticipo requerido: ${depositRequired} USD
                </p>
              </div>
            </div>
          )}

          {/* Configuration Options - Only rendered if variables actually exist */}
          <div className="space-y-4 sm:space-y-5 border-t border-stone-200 pt-4 sm:pt-5">
            {/* 0. Subproductos / Variantes (Compact cards) */}
            {product.variants && product.variants.filter((v) => v.available).length > 0 && (
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  Elige tu versión:{" "}
                  <span className="text-rose-700 font-semibold">{selectedVariant?.name}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.variants
                    .filter((v) => v.available)
                    .map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      return (
                        <motion.button
                          key={variant.id}
                          type="button"
                          whileHover={{ y: -1, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedVariant(variant)}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-rose-600 bg-rose-50/80 ring-2 ring-rose-500/20"
                              : "border-stone-200 hover:border-rose-200 bg-white hover:bg-stone-50/60"
                          }`}
                        >
                          {variant.image ? (
                            <img
                              src={variant.image}
                              alt={variant.name}
                              className="w-10 h-10 object-cover rounded-lg shrink-0 border border-stone-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                              <Sparkles className="w-4 h-4 text-rose-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-stone-900 block truncate">
                              {variant.name}
                            </span>
                            <span className="text-[10px] text-stone-500 block truncate">
                              {[variant.color, variant.size].filter(Boolean).join(" · ")}
                            </span>
                          </div>
                          {typeof variant.price === "number" && (
                            <span className="text-xs font-bold text-rose-700 shrink-0">
                              ${variant.price}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Ribbon Colors (only for flowers/ramos, not for peluches) */}
            {!isPeluche &&
              product.ribbonColors &&
              product.ribbonColors.filter(Boolean).length > 0 &&
              !selectedVariant?.color && (
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-2">
                    Color del Listón:{" "}
                    <span className="text-rose-700 font-semibold">
                      {selectedColor || product.ribbonColors[0]}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.ribbonColors.filter(Boolean).map((color) => {
                      const isSelected = (selectedColor || product.ribbonColors?.[0]) === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20 shadow-xs"
                              : "border-stone-200 hover:border-rose-200 bg-white text-stone-700"
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-stone-300 shadow-inner shrink-0"
                            style={{ backgroundColor: ribbonColorHex(color) }}
                          />
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Size Options */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  Tamaño & Cantidad de Rosas
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.sizes.map((s, idx) => {
                    const isSelected = selectedSize?.name === s.name;
                    return (
                      <motion.button
                        key={idx}
                        type="button"
                        whileHover={{ y: -1, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedSize(s)}
                        className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all min-h-[44px] cursor-pointer ${
                          isSelected
                            ? "border-rose-600 bg-rose-50 text-rose-950 ring-1 ring-rose-600 shadow-xs"
                            : "border-stone-200 hover:border-rose-200 bg-white"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-stone-900">{s.name}</span>
                          <span className="text-xs font-bold text-rose-700">${s.price}</span>
                        </div>
                        {s.description && (
                          <p className="text-[10px] text-stone-500 mt-0.5">{s.description}</p>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extras & Accesorios */}
            {availableExtras.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  Detalles & Accesorios Opcionales
                </label>
                <div className="space-y-2">
                  {availableExtras.map((extra) => {
                    const isChecked = isExtraSelected(extra);
                    const optionList = extraOptionsOf(extra);
                    const chosenOption = selectedOptionOf(extra);
                    const isOpen = extraPickerId === extra.id;
                    return (
                      <div
                        key={extra.id}
                        className="rounded-xl sm:rounded-2xl border border-stone-200 overflow-hidden"
                      >
                        <motion.div
                          whileHover={{ scale: 1.005 }}
                          onClick={() => {
                            if (isOpen) {
                              setExtraPickerId(null);
                              setPendingExtraOptionId(null);
                            } else {
                              openExtraDetails(extra);
                            }
                          }}
                          className={`p-2.5 sm:p-3 flex items-center justify-between cursor-pointer transition-all min-h-[44px] ${
                            isChecked ? "bg-rose-50/50" : "hover:bg-stone-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                                isChecked
                                  ? "bg-rose-700 border-rose-700 text-white"
                                  : "border-stone-300 bg-white"
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                            </div>
                            {chosenOption?.image && (
                              <img
                                src={chosenOption.image}
                                alt={chosenOption.name}
                                className="w-9 h-9 rounded-lg object-cover border border-rose-200 shrink-0"
                              />
                            )}
                            <div>
                              <span className="text-xs font-bold text-stone-900 block">
                                {chosenOption ? chosenOption.name : extra.name}
                              </span>
                              <span className="text-[10px] font-semibold text-rose-700">
                                {isOpen
                                  ? "Ocultar información"
                                  : optionList.length > 0
                                    ? `Ver información y ${optionList.length} opciones`
                                    : "Ver información"}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-rose-800 shrink-0">
                            +${chosenOption ? chosenOption.price : extra.price}
                          </span>
                        </motion.div>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-stone-200 bg-white"
                            >
                              <div className="p-3 sm:p-4 space-y-3">
                                {extra.description && (
                                  <FormattedProductDescription text={extra.description} />
                                )}
                                <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5">
                                  <span className="text-xs font-semibold text-stone-600">
                                    Precio adicional
                                  </span>
                                  <span className="text-sm font-bold text-rose-800">
                                    +$
                                    {optionList.find((option) => option.id === pendingExtraOptionId)
                                      ?.price ?? extra.price}
                                  </span>
                                </div>
                                {optionList.length > 0 && (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {optionList.map((option) => {
                                      const active = pendingExtraOptionId === option.id;
                                      return (
                                        <button
                                          key={option.id}
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setPendingExtraOptionId(option.id);
                                          }}
                                          className={`text-left rounded-xl border overflow-hidden transition-all ${active ? "border-rose-600 ring-2 ring-rose-500/20" : "border-stone-200"}`}
                                        >
                                          {option.image && (
                                            <img
                                              src={option.image}
                                              alt={option.name}
                                              className="w-full aspect-square object-cover"
                                            />
                                          )}
                                          <span className="block p-2 text-[11px] font-bold text-stone-900">
                                            {option.name}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleAddExtra(extra);
                                  }}
                                  disabled={optionList.length > 0 && !pendingExtraOptionId}
                                  className="w-full rounded-xl bg-rose-700 text-white hover:bg-rose-800"
                                >
                                  <Plus className="w-4 h-4" />
                                  {isChecked ? "Actualizar pedido" : "Agregar al pedido"}
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Scheduling & Date Availability Check */}
            {product.productType === "especial" ? (
              <div className="p-3.5 sm:p-4 bg-amber-50/80 rounded-xl sm:rounded-2xl border border-amber-200/90 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-xs font-bold text-amber-950">
                    Cotización Directa con la Dueña (Sin selección de fechas)
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  {isPeluche ? (
                    <>
                      Para este peluche tejido a mano{" "}
                      <strong>no requieres elegir fecha en el calendario</strong>. La fecha deseada,
                      el tiempo de confección y los detalles se coordinan directamente con Monce en el
                      chat integrado.
                    </>
                  ) : (
                    <>
                      Para este ramo especial <strong>no requieres elegir fecha en el calendario</strong>.
                      La fecha deseada, el tiempo de confección y los detalles se coordinan directamente
                      con Monce en el chat integrado.
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="p-3.5 sm:p-4 bg-stone-50 rounded-xl sm:rounded-2xl border border-stone-200/80 space-y-3">
                <label className="block text-xs font-bold text-stone-800">
                  4. Fecha del Evento o Entrega *
                </label>
                <p className="text-[11px] text-stone-500">
                  Se eligió automáticamente la primera fecha posible según los{" "}
                  {product.minPrepDays || 2} días requeridos. Puedes cambiarla.
                </p>
                <input
                  type="date"
                  required
                  min={minDateString}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-rose-500"
                />

                {/* Real Availability Badge */}
                {scheduledDate && dateAvailability && (
                  <div>
                    {dateAvailability.isBlocked ? (
                      <div className="p-2.5 rounded-xl bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-stone-600 shrink-0" />
                        <span>
                          ⚫ Fecha Bloqueada:{" "}
                          {dateAvailability.blockReason || "Cerrado por descanso"}
                        </span>
                      </div>
                    ) : dateAvailability.status === "FULL" ? (
                      <div className="p-2.5 rounded-xl bg-rose-100 text-rose-900 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>🔴 Capacidad Agotada (0 espacios restantes). Elige otra fecha.</span>
                      </div>
                    ) : dateAvailability.status === "FEW_SLOTS" ? (
                      <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          🟡 ¡Quedan pocos espacios! ({dateAvailability.remainingSlots} lugares
                          disponibles de {dateAvailability.maxCapacity})
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          🟢 Fecha Disponible ({dateAvailability.remainingSlots} espacios libres de{" "}
                          {dateAvailability.maxCapacity})
                        </span>
                      </div>
                    )}

                    {dateAvailability.importantEvent && (
                      <p className="text-[11px] text-rose-800 font-semibold mt-1">
                        Nota especial: {dateAvailability.importantEvent.title} (
                        {dateAvailability.importantEvent.notes})
                      </p>
                    )}
                  </div>
                )}

                {/* Time slot & delivery method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Horario preferente
                    </label>
                    <select
                      value={scheduledTimeSlot}
                      onChange={(e) => setScheduledTimeSlot(e.target.value)}
                      className="w-full px-2.5 py-2 sm:py-1.5 bg-white border border-stone-200 rounded-xl text-xs"
                    >
                      <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                      <option value="12:00 PM - 2:00 PM">12:00 PM - 2:00 PM</option>
                      <option value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</option>
                      <option value="5:00 PM - 7:00 PM">5:00 PM - 7:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Modalidad de Entrega
                    </label>
                    <div className="w-full px-2.5 py-2 sm:py-1.5 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-900 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">Recoger en Persona (Taller)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Dedication message */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                5. Mensaje de Dedicatoria para la Tarjeta (Opcional)
              </label>
              <textarea
                rows={2}
                value={dedicationMessage}
                onChange={(e) => setDedicationMessage(e.target.value)}
                placeholder={
                  isPeluche
                    ? "Escribe las palabras de cariño o dedicatoria que incluiremos con el peluche..."
                    : "Escribe las palabras de amor o felicitación que incluiremos caligrafiadas en el ramo..."
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
              />
            </div>

            {/* Quantity and Actions */}
            {product.productType === "especial" ? (
              <div className="space-y-3 pt-2">
                <div className="p-4 bg-gradient-to-br from-rose-50/90 via-amber-50/40 to-white rounded-2xl border border-rose-200 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-rose-700" />
                    <span className="font-bold text-xs sm:text-sm text-stone-900">
                      {isPeluche
                        ? "Reserva & Personalización de Peluche con Monce"
                        : "Reserva & Personalización con Monce"}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {isPeluche ? (
                      <>
                        Para este peluche tejido a mano{" "}
                        <strong>no requieres pagar ni subir recibo</strong> aquí. Al dar clic en{" "}
                        <strong>Hablar con la Dueña</strong>, responderás unas preguntas iniciales
                        (para chico o chica, ocasión y foto de referencia) y Monce te dará el{" "}
                        <strong>precio acordado</strong> y el{" "}
                        <strong>tiempo en que lo puede tener listo</strong> en el chat.
                      </>
                    ) : (
                      <>
                        Para este ramo especial <strong>no requieres pagar ni subir recibo</strong>{" "}
                        aquí. Al dar clic en <strong>Hablar con la Dueña</strong>, responderás unas
                        preguntas iniciales (para chico o chica, ocasión y foto de referencia) y Monce
                        te dará el <strong>precio acordado</strong> y el{" "}
                        <strong>tiempo en que lo puede tener</strong> en el chat.
                      </>
                    )}
                  </p>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setIsSpecialChatModalOpen(true)}
                  className="w-full py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 hover:from-rose-800 hover:to-black text-white shadow-[0_4px_20px_rgba(190,18,60,0.35)] flex items-center justify-center gap-2.5 cursor-pointer transition-all min-h-[48px]"
                >
                  <MessageCircle className="w-5 h-5 text-rose-300" />
                  <span>
                    {isPeluche
                      ? "Hablar con la Dueña (Personalizar Peluche)"
                      : "Hablar con la Dueña (Personalizar por Chat)"}
                  </span>
                </motion.button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-stone-800">Cantidad:</span>
                  <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center text-stone-600 hover:bg-stone-200 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </motion.button>
                    <span className="px-3 text-xs font-bold text-stone-900">{quantity}</span>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center text-stone-600 hover:bg-stone-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>

                {feedback && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                    {feedback}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    type="button"
                    whileHover={!isDateBlockedOrFull ? { scale: 1.02, y: -1 } : {}}
                    whileTap={!isDateBlockedOrFull ? { scale: 0.96 } : {}}
                    disabled={Boolean(isDateBlockedOrFull)}
                    onClick={() => handleAddToCart(true)}
                    className={`flex-1 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[46px] ${
                      isDateBlockedOrFull
                        ? "bg-stone-300 text-stone-500 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white shadow-[0_4px_16px_rgba(225,29,72,0.3)]"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Reservar & Proceder (${totalPrice})</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={!isDateBlockedOrFull ? { scale: 1.02, y: -1 } : {}}
                    whileTap={!isDateBlockedOrFull ? { scale: 0.96 } : {}}
                    disabled={Boolean(isDateBlockedOrFull)}
                    onClick={() => handleAddToCart(false)}
                    className="px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs font-bold border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-800 transition-all min-h-[46px] cursor-pointer shadow-2xs"
                  >
                    Agregar a Bolsa
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Reviews for this product */}
      <div className="border-t border-stone-200 pt-10">
        <h3 className="font-serif text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-rose-600" />
          Reseñas de Quienes Ya Regalaron Este Producto ({productReviews.length})
        </h3>

        {productReviews.length === 0 ? (
          <div className="bg-stone-50 rounded-2xl p-8 text-center text-xs text-stone-500 border border-stone-200">
            Aún no hay reseñas registradas para este modelo. Quienes reciben su ramo pueden dejar
            una opinión verificada desde Mi Cuenta.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 bg-white rounded-2xl border border-stone-200 shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rev.rating ? "text-amber-400 fill-amber-400" : "text-stone-300"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-stone-400">{rev.date}</span>
                </div>
                <p className="text-xs text-stone-700 italic mb-2">"{rev.comment}"</p>
                <div className="flex items-center justify-between text-[11px] font-semibold text-stone-900 pt-2 border-t border-stone-100">
                  <span>{rev.customerName}</span>
                  {rev.verifiedPurchase && (
                    <span className="text-[10px] text-emerald-700 font-bold">
                      ✓ Compra Verificada
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de preguntas iniciales para producto especial */}
      {product.productType === "especial" && (
        <SpecialProductChatIntakeModal
          product={product}
          selectedColor={selectedColor}
          isOpen={isSpecialChatModalOpen}
          onClose={() => setIsSpecialChatModalOpen(false)}
          onOpenAuth={onOpenAuth}
        />
      )}
    </div>
  );
};
