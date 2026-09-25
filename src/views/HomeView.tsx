import React, { useState, useRef } from "react";
import {
  Sparkles,
  ArrowRight,
  Calendar,
  Heart,
  CheckCircle2,
  Star,
  Clock,
  ShieldCheck,
  Palette,
  Package,
  Gift,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Eye,
  Award,
  Scissors,
  Camera,
} from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { StoryImageModal } from "../components/StoryImageModal";
import { HomeGiveawaysSection } from "../components/giveaways/HomeGiveawaysSection";

export const HomeView: React.FC<{ onOpenAuth?: () => void }> = ({ onOpenAuth }) => {
  const {
    activeProducts,
    importantDates,
    gallery,
    reviews,
    siteSettings,
    homepageConfig,
    setActiveTab,
    setCustomRequestType,
    setSelectedProductId,
    toggleWishlist,
    wishlist,
    isAdmin,
  } = useApp();

  const [galleryCategory, setGalleryCategory] = useState<string>("Todos");
  const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);

  const featuredProducts = (activeProducts || []).filter(
    (p) => p.featured || homepageConfig?.featuredProductIds?.includes(p.id),
  );
  const displayFeatured =
    featuredProducts.length > 0 ? featuredProducts : (activeProducts || []).slice(0, 8);

  const activeImportantDates = (importantDates || []).filter((d) => d.active).slice(0, 4);

  const filteredGallery =
    galleryCategory === "Todos"
      ? (gallery || []).slice(0, 6)
      : (gallery || [])
          .filter((g) => g.category?.toLowerCase().includes(galleryCategory.toLowerCase()))
          .slice(0, 6);

  const steps = [
    {
      step: "01",
      title: "Elige tu Ramo o Regalo",
      desc: "Explora nuestros modelos de rosas eternas de listón satinado, cajas acrílicas con joyero o arreglos festivos.",
      icon: Gift,
    },
    {
      step: "02",
      title: "Selecciona la Fecha",
      desc: "Consulta la disponibilidad en tiempo real en nuestro calendario para apartar el día de tu evento o aniversario.",
      icon: Calendar,
    },
    {
      step: "03",
      title: "Personaliza a tu Gusto",
      desc: "Elige el color de listón, tamaño, corona de pedrería, luces LED micro-hadas y redacta tu dedicatoria especial.",
      icon: Palette,
    },
    {
      step: "04",
      title: "Envía tu Reserva",
      desc: "Generamos tu orden oficial en el sistema con el desglose exacto de inversión y anticipo del 50%.",
      icon: Package,
    },
    {
      step: "05",
      title: "Realiza el Anticipo",
      desc: "Transfiere a nuestra cuenta bancaria y sube tu foto de comprobante desde tu perfil para aprobación inmediata.",
      icon: ShieldCheck,
    },
    {
      step: "06",
      title: "Recibe tu Obsequio Eterno",
      desc: "Confeccionamos cada pétalo con alta precisión. Recoge en nuestro taller o recíbelo por envío seguro a domicilio.",
      icon: CheckCircle2,
    },
  ];

  // Helper for guarantee icons
  const getGuaranteeIcon = (iconName: string) => {
    switch (iconName) {
      case "HandHeart":
      case "Heart":
        return Heart;
      case "Sparkles":
        return Sparkles;
      case "Clock":
        return Clock;
      case "ShieldCheck":
        return ShieldCheck;
      case "Scissors":
        return Scissors;
      default:
        return Award;
    }
  };

  // 1. HERO SECTION (Adjusts automatically to the uploaded image without cutting it off)
  const renderHeroSection = () => {
    const heroImage =
      homepageConfig.hero.backgroundImage ||
      homepageConfig.hero.imageUrl ||
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=2000&q=85";

    return (
      <section
        key="hero"
        className="relative w-full overflow-hidden bg-stone-950 flex flex-col items-center justify-center"
      >
        {/* Adaptive container: image is displayed completely, horizontal or vertical, without cutting */}
        <div className="relative w-full flex items-center justify-center min-h-[45vh] max-h-[85vh]">
          <img
            src={heroImage}
            alt="Portada Ramos Eternos"
            className="w-full h-auto max-h-[85vh] object-contain mx-auto transition-all"
            style={{ opacity: 1 }}
            suppressHydrationWarning
          />

          {/* Floating Action Buttons ONLY */}
          <div className="absolute inset-x-0 bottom-4 sm:bottom-8 z-10 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-4 max-w-xl mx-auto px-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveTab("productos");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full sm:w-auto min-h-[48px] px-8 sm:px-10 py-3.5 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-[0_8px_25px_rgba(225,29,72,0.35)] transition-all flex items-center justify-center gap-2.5 group cursor-pointer border border-rose-500/40"
            >
              <span>{homepageConfig.hero.primaryBtnText || "Explorar Catálogo"}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveTab("personalizados");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full sm:w-auto min-h-[48px] px-8 sm:px-10 py-3.5 bg-white/95 hover:bg-white text-stone-900 font-bold rounded-2xl text-xs sm:text-sm shadow-[0_8px_25px_rgba(0,0,0,0.18)] transition-all flex items-center justify-center gap-2.5 cursor-pointer backdrop-blur-md border border-white/80 hover:border-rose-200"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
              <span>{homepageConfig.hero.secondaryBtnText || "Pedir Diseño Personalizado"}</span>
            </motion.button>
          </div>
        </div>
      </section>
    );
  };

  // 2. PRÓXIMAS FECHAS CLAVE (Calendar Dates - Responsive Grid)
  const renderDatesSection = () => (
    <section key="dates" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-br from-rose-950 via-rose-900 to-stone-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-rose-300 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-rose-300" />
              Planifica con Anticipación
            </span>
            <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold mt-1 leading-tight">
              Próximas Fechas & Temporadas Especiales
            </h2>
            <p className="text-xs sm:text-sm text-rose-200/80 mt-1 max-w-xl leading-relaxed">
              Fechas clave y temporadas de alta demanda para agendar tu cupo artesanal con
              anticipación.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveTab("calendario");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="min-h-[40px] px-5 py-2.5 bg-white hover:bg-rose-50 text-rose-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
          >
            <span>Ver calendario completo</span>
            <ChevronRight className="w-4 h-4 text-rose-700" />
          </motion.button>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeImportantDates.map((item) => (
            <div
              key={item.id}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-2xl">{item.emoji || "💐"}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/30">
                    Capacidad: {item.maxCapacity}
                  </span>
                </div>
                <h4 className="font-serif font-bold text-sm sm:text-base text-white">
                  {item.title || item.name}
                </h4>
                <p className="text-xs text-rose-200/90 font-medium mt-0.5">
                  {new Date(item.date).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-[11px] text-stone-300 mt-2 leading-relaxed line-clamp-2">
                  {item.notes ||
                    item.description ||
                    "Agenda tu pedido con anticipación para asegurar tu fecha."}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-rose-300">
                  Anticipación: <strong>{item.leadDays || 5} días</strong>
                </span>
                <button
                  onClick={() => {
                    setActiveTab("calendario");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-xs text-white hover:text-rose-200 font-semibold underline cursor-pointer p-1"
                >
                  Apartar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // 3. CATÁLOGO DESTACADO (Responsive Grid for "Ramos Más Pedidos")
  const renderFeaturedSection = () => (
    <section key="featured" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
        <div>
          <span className="text-[11px] sm:text-xs font-bold text-rose-700 uppercase tracking-widest block">
            Colección Selecta
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 mt-1 leading-tight">
            Ramos & Diseños Más Pedidos
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl leading-relaxed">
            Nuestras creaciones de flores eternas de listón satinado más cotizadas y amadas.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setActiveTab("productos");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="min-h-[40px] px-5 py-2 bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900 hover:from-rose-800 hover:to-rose-950 text-white rounded-xl text-xs font-bold shadow-[0_2px_10px_rgba(225,29,72,0.22)] flex items-center gap-1.5 cursor-pointer group self-start sm:self-auto"
        >
          <span suppressHydrationWarning>Ver todo el catálogo ({activeProducts.length})</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      {displayFeatured.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-stone-50 rounded-2xl sm:rounded-3xl border border-stone-200/80">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="font-serif text-base sm:text-lg font-bold text-stone-800">
            ✨ Todavía no hay productos publicados
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
            El catálogo está en preparación. Puedes usar el botón de diseños personalizados para
            solicitar tu ramo a medida.
          </p>
        </div>
      ) : (
        /* Full Responsive Grid - No Sideways Scrolling */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {displayFeatured.map((product, idx) => {
            const isFav = wishlist.includes(product.id);
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{
                  duration: 0.45,
                  delay: Math.min(idx * 0.05, 0.3),
                  ease: [0.25, 0.1, 0.25, 1.0],
                }}
                className="w-full h-auto min-h-[460px] bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-rose-100/90 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.06)] hover:shadow-[0_12px_32px_-6px_rgba(244,63,94,0.18)] hover:border-rose-200 transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Image container: adapts gracefully to image size so it is fully visible */}
                <div className="relative w-full aspect-4/3 sm:aspect-square shrink-0 overflow-hidden bg-gradient-to-b from-rose-50/25 to-stone-50/50 flex items-center justify-center p-3">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="max-h-full max-w-full w-auto h-auto object-contain group-hover:scale-105 transition-transform duration-500 rounded-xl filter drop-shadow-xs"
                    loading="lazy"
                  />

                  {/* Tag badge */}
                  {product.tag && (
                    <span className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-xs text-rose-900 text-[10px] font-bold shadow-xs border border-rose-100">
                      {product.tag}
                    </span>
                  )}

                  {/* Wishlist Button */}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 p-2 sm:p-2.5 min-w-[36px] min-h-[36px] rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-rose-600 shadow-xs transition-colors cursor-pointer flex items-center justify-center border border-stone-200/50"
                    title={isFav ? "Quitar de deseos" : "Guardar en deseos"}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? "text-rose-600 fill-rose-600" : ""}`} />
                  </motion.button>

                  {/* Minimum prep days pill */}
                  <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-rose-300" />
                    <span>{product.minPrepDays} días de anticipación</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
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

                    {/* ONLY SHOW OPTIONS/COLORS CONFIGURED PREVIOUSLY */}
                    {product.variants && product.variants.filter((v) => v.available).length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] text-stone-400 font-medium">Opciones:</span>
                        {product.variants
                          .filter((v) => v.available)
                          .slice(0, 3)
                          .map((v) => (
                            <span
                              key={v.id}
                              className="text-[10px] font-semibold text-rose-800 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md"
                            >
                              {v.name}
                            </span>
                          ))}
                      </div>
                    ) : product.ribbonColors && product.ribbonColors.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] text-stone-400 font-medium">Colores:</span>
                        {product.ribbonColors.slice(0, 3).map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md"
                          >
                            {c}
                          </span>
                        ))}
                        {product.ribbonColors.length > 3 && (
                          <span className="text-[10px] text-stone-400">
                            +{product.ribbonColors.length - 3}
                          </span>
                        )}
                      </div>
                    ) : product.sizes && product.sizes.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] text-stone-400 font-medium">Tamaños:</span>
                        {product.sizes.slice(0, 2).map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 pt-3 border-t border-rose-100/70 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-medium">
                        Inversión desde
                      </span>
                      <span className="font-serif text-base sm:text-lg font-bold text-stone-900">
                        ${product.price}
                      </span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.04, y: -1 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setActiveTab("productos");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="min-h-[38px] px-4 py-2 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white rounded-xl text-xs font-bold shadow-[0_2px_10px_rgba(225,29,72,0.22)] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Ver detalles</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );

  // 4. CÓMO FUNCIONA (Responsive Grid)
  const renderProcessSection = () => (
    <section key="process" className="bg-rose-50/50 py-10 sm:py-14 border-y border-rose-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 text-center max-w-2xl mx-auto">
          <span className="text-[11px] sm:text-xs font-bold text-rose-700 uppercase tracking-widest block">
            Experiencia Sencilla & Transparente
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 mt-1 leading-tight">
            ¿Cómo Funciona Tu Reserva?
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1.5">
            Conoce cada etapa de confección y apartado de tu ramo artesanal de listón.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white rounded-2xl p-5 border border-rose-100/80 shadow-2xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
              >
                <span className="absolute top-3.5 right-4 font-serif font-bold text-2xl text-rose-100 select-none">
                  {item.step}
                </span>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-sm font-bold text-stone-900 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  // 5. GARANTÍA Y CALIDAD (Responsive Grid)
  const renderGuaranteesSection = () => (
    <section key="guarantees" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8 text-center max-w-2xl mx-auto">
        <span className="text-[11px] sm:text-xs font-bold text-rose-700 uppercase tracking-widest block">
          Compromiso & Respaldo
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 mt-1 leading-tight">
          {siteSettings.guaranteeTitle || "Garantía de Calidad & Confección Artesanal"}
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-1.5">
          {siteSettings.guaranteeSubtitle ||
            "Cada creación floral está hecha a mano con listón de seda para conservarse impecable."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(siteSettings.guarantees || []).map((item) => {
          const IconComponent = getGuaranteeIcon(item.icon);
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-rose-100/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-center mb-3">
                  <IconComponent className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900 mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Garantía {siteSettings.businessName}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  // 6. GALERÍA REAL (Responsive Grid with Category Dropdown)
  const renderGallerySection = () => (
    <section key="gallery" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <span className="text-[11px] sm:text-xs font-bold text-rose-700 uppercase tracking-widest block">
            Portafolio Real
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 mt-1 leading-tight">
            Nuestros Trabajos Realizados
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Fotografías reales de ramos y pedidos entregados en nuestro taller artesanal.
          </p>
        </div>

        {/* Menú Desplegable de Categorías de Galería + Wrapped Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <select
              value={galleryCategory}
              onChange={(e) => setGalleryCategory(e.target.value)}
              className="pl-3.5 pr-8 py-2 bg-rose-50/60 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-950 focus:outline-none focus:border-rose-500 cursor-pointer shadow-2xs appearance-none transition-all"
            >
              {["Todos", "Ramos", "Parejas", "Graduaciones", "Cumpleaños", "Personalizados"].map(
                (cat) => (
                  <option key={cat} value={cat}>
                    Categoría: {cat}
                  </option>
                ),
              )}
            </select>
            <div className="absolute right-2.5 top-2.5 pointer-events-none text-rose-600">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          <div className="hidden sm:flex flex-wrap gap-1.5">
            {["Todos", "Ramos", "Parejas", "Graduaciones", "Cumpleaños", "Personalizados"].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGalleryCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    galleryCategory === cat
                      ? "bg-gradient-to-r from-rose-700 to-rose-800 text-white shadow-xs"
                      : "bg-stone-100/90 text-stone-600 hover:bg-rose-50 hover:text-rose-900 border border-stone-200/60"
                  }`}
                >
                  {cat}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {filteredGallery.length === 0 ? (
        <div className="p-8 text-center bg-stone-50 rounded-2xl sm:rounded-3xl border border-stone-200">
          <p className="text-xs sm:text-sm text-stone-500">
            No hay fotos en esta categoría por el momento.
          </p>
        </div>
      ) : (
        /* Full Grid for Gallery */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {filteredGallery.map((item) => (
            <div
              key={item.id}
              className="h-[370px] sm:h-[390px] group relative rounded-2xl overflow-hidden bg-white border border-stone-200/90 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between"
            >
              {/* Image Container */}
              <div className="relative w-full h-[230px] sm:h-[250px] shrink-0 bg-stone-50 flex items-center justify-center p-3">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="max-h-full max-w-full w-auto h-auto object-contain group-hover:scale-105 transition-transform duration-500 rounded-xl"
                  loading="lazy"
                />
              </div>

              <div className="p-3.5 bg-white border-t border-stone-100 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold tracking-wider uppercase text-rose-700">
                    {item.category}
                  </span>
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 mt-0.5 line-clamp-1">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
                {item.date && (
                  <span className="text-[10px] text-stone-400 mt-2 block">{item.date}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-6 sm:mt-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            setActiveTab("galeria");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="min-h-[42px] px-7 py-2.5 bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-800 hover:to-rose-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          Ver Galería Completa de Trabajos
        </motion.button>
      </div>
    </section>
  );

  // 7. TESTIMONIOS (Responsive Grid)
  const renderReviewsSection = () => (
    <section
      key="reviews"
      className="bg-stone-900 text-white py-8 sm:py-12 rounded-2xl sm:rounded-3xl max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 my-6 sm:my-10 relative overflow-hidden"
    >
      <div className="mb-6 sm:mb-8 max-w-2xl">
        <span className="text-[11px] sm:text-xs font-bold text-rose-400 uppercase tracking-widest block">
          Opiniones de Clientes Reales
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 text-white leading-tight">
          Historias que Perduran en el Tiempo
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 mt-1">
          Reseñas y vivencias de quienes ya sorprendieron a sus personas especiales con nuestros
          ramos eternos.
        </p>
      </div>

      {!reviews || reviews.length === 0 ? (
        <div className="p-6 text-center text-stone-400 text-xs sm:text-sm">
          ✨ Todavía no hay testimonios registrados. Los clientes con compras entregadas pueden
          dejar su reseña desde Mi Cuenta.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {(reviews || []).map((rev) => (
            <div
              key={rev.id}
              className="bg-stone-800/80 rounded-2xl p-5 border border-stone-700/80 flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center gap-1 mb-2.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < rev.rating ? "text-amber-400 fill-amber-400" : "text-stone-600"}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-stone-300 italic leading-relaxed">"{rev.comment}"</p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-700/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{rev.customerName}</h4>
                    {rev.productName && (
                      <span className="text-[10px] text-rose-400 block truncate max-w-[160px]">
                        {rev.productName}
                      </span>
                    )}
                  </div>
                  {rev.verifiedPurchase && (
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                      ✓ Compra Real
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  // 8. SOBRE NOSOTROS (About the Craft & Artisan)
  const renderStorySection = () => (
    <section key="story" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center bg-rose-50/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-12 border border-rose-100">
        <div className="lg:col-span-5 max-w-sm mx-auto lg:max-w-none w-full">
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden aspect-4/5 shadow-xl border border-white bg-stone-50 flex items-center justify-center p-2 relative group">
            <img
              src={homepageConfig.aboutUs.imageUrl}
              alt="Artesana de flores de listón"
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
              loading="lazy"
            />
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsStoryModalOpen(true)}
                className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 px-3 py-2 bg-stone-950/90 hover:bg-stone-900 text-amber-300 hover:text-amber-200 rounded-xl text-xs font-bold shadow-lg border border-amber-500/40 flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 cursor-pointer z-10"
                title="Cambiar foto de historia (Modo Dueña)"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Cambiar Foto (Dueña)</span>
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-3 sm:space-y-4">
          <span className="text-[11px] sm:text-xs font-bold text-rose-700 uppercase tracking-widest block">
            {homepageConfig.aboutUs.title}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 leading-tight">
            Hecho con pasión por Monse
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {homepageConfig.aboutUs.story}
          </p>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-rose-100">
              <span className="font-serif text-lg sm:text-xl font-bold text-rose-800 block">
                Listón Satinado
              </span>
              <span className="text-xs text-stone-500">
                Brillo permanente y tacto suave de alta gama
              </span>
            </div>
            <div className="p-3.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-rose-100">
              <span className="font-serif text-lg sm:text-xl font-bold text-rose-800 block">
                Detalles Finos
              </span>
              <span className="text-xs text-stone-500">
                Coronas de pedrería, luces micro-LED y lacre
              </span>
            </div>
          </div>

          <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setCustomRequestType("ramos");
                setActiveTab("personalizados");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="min-h-[44px] px-6 py-3 bg-rose-700 hover:bg-rose-800 active:scale-95 text-white rounded-full text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>🌸 Personalizar Ramo de Listón</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCustomRequestType("peluches");
                setActiveTab("personalizados");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="min-h-[44px] px-6 py-3 bg-white hover:bg-stone-50 active:scale-95 text-stone-800 border border-stone-200 rounded-full text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>🧸 Personalizar Peluche Tejido</span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  // Dispatcher based on layer ID
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "hero":
        return renderHeroSection();
      case "giveaways":
        return <HomeGiveawaysSection key="giveaways-sec" onOpenAuth={onOpenAuth} />;
      case "dates":
        return renderDatesSection();
      case "featured":
        return renderFeaturedSection();
      case "process":
        return renderProcessSection();
      case "guarantees":
        return renderGuaranteesSection();
      case "gallery":
        return renderGallerySection();
      case "story":
        return renderStorySection();
      case "reviews":
        return renderReviewsSection();
      default:
        return null;
    }
  };

  const rawOrder =
    homepageConfig.sectionOrder && homepageConfig.sectionOrder.length > 0
      ? homepageConfig.sectionOrder
      : [
          "hero",
          "giveaways",
          "dates",
          "featured",
          "process",
          "guarantees",
          "gallery",
          "story",
          "reviews",
        ];

  const currentSectionOrder = rawOrder.includes("giveaways")
    ? rawOrder
    : [rawOrder[0], "giveaways", ...rawOrder.slice(1)];

  return (
    <div
      style={{ backgroundColor: siteSettings.pageBackgroundColor || "#FFFDFD" }}
      className="min-h-screen transition-colors duration-500 space-y-12 sm:space-y-16 lg:space-y-20 pb-12 sm:pb-20"
    >
      {currentSectionOrder.map((sectionId) => {
        if (
          homepageConfig.sectionVisibility &&
          homepageConfig.sectionVisibility[sectionId] === false
        ) {
          return null;
        }
        return renderSection(sectionId);
      })}

      {/* Owner Quick Story Image Modal */}
      <StoryImageModal isOpen={isStoryModalOpen} onClose={() => setIsStoryModalOpen(false)} />
    </div>
  );
};
