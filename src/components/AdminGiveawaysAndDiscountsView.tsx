import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gift,
  Tag,
  History,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Filter,
  Search,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Percent,
  X,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { fileToOptimizedImage } from "../lib/imageUpload";
import {
  Giveaway,
  GiveawayPrizeType,
  GiveawayStatus,
  GiveawayEntry,
  GiveawayWinner,
  StoreDiscount,
  formatPublicWinnerName,
} from "../types";

export const AdminGiveawaysAndDiscountsView: React.FC = () => {
  const {
    currentUser,
    giveaways,
    giveawayEntries,
    giveawayWinners,
    discounts,
    products,
    giftCards,
    createGiveaway,
    updateGiveaway,
    deleteGiveaway,
    toggleGiveawayStatus,
    cancelGiveaway,
    drawGiveawayWinner,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    toggleDiscountStatus,
    updateGiveawayPrizeStatus,
    showToast,
    setIsChatOpen,
  } = useApp();

  // Sub-navigation: Sorteos | Descuentos | Historial | Estadísticas
  const [subTab, setSubTab] = useState<"sorteos" | "descuentos" | "historial" | "estadisticas">(
    "sorteos",
  );

  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [isGiveawayModalOpen, setIsGiveawayModalOpen] = useState(false);
  const [editingGiveaway, setEditingGiveaway] = useState<Giveaway | null>(null);

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<StoreDiscount | null>(null);

  const [inspectingEntriesGiveaway, setInspectingEntriesGiveaway] = useState<Giveaway | null>(null);
  const [drawingGiveaway, setDrawingGiveaway] = useState<Giveaway | null>(null);
  const [isDrawingLoading, setIsDrawingLoading] = useState(false);

  // Form State for Giveaway Modal
  const [giveawayForm, setGiveawayForm] = useState({
    title: "",
    description: "",
    prizeName: "",
    prizeType: "gift_card" as GiveawayPrizeType,
    prizeAmount: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
    maxParticipants: 50,
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    requirements: "Tener cuenta registrada en Hecho por Monce y residir en la zona de entrega.",
    status: "ACTIVE" as GiveawayStatus,
    showOnHomepage: true,
  });

  const [isUploadingGiveawayImage, setIsUploadingGiveawayImage] = useState(false);

  const handleGiveawayImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingGiveawayImage(true);
    try {
      const optimized = await fileToOptimizedImage(file);
      setGiveawayForm((prev) => ({ ...prev, imageUrl: optimized }));
    } catch (err) {
      console.error("Error optimizando imagen de sorteo:", err);
    } finally {
      setIsUploadingGiveawayImage(false);
      e.target.value = "";
    }
  };

  // Form State for Discount Modal
  const [discountForm, setDiscountForm] = useState({
    name: "",
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: 15,
    minimumPurchase: 30,
    maxUses: 100,
    currentUses: 0,
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    applicableProducts: [] as string[],
    excludedProducts: [] as string[],
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "EXPIRED",
    showOnHomepage: true,
  });

  // Open create giveaway
  const handleOpenCreateGiveaway = () => {
    setEditingGiveaway(null);
    setGiveawayForm({
      title: "",
      description: "",
      prizeName: "",
      prizeType: "gift_card",
      prizeAmount: 25,
      imageUrl:
        "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
      maxParticipants: 50,
      startAt: new Date().toISOString().slice(0, 16),
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      requirements: "Tener cuenta registrada en Hecho por Monce y residir en la zona de entrega.",
      status: "ACTIVE",
      showOnHomepage: true,
    });
    setIsGiveawayModalOpen(true);
  };

  // Open edit giveaway
  const handleOpenEditGiveaway = (giveaway: Giveaway) => {
    setEditingGiveaway(giveaway);
    setGiveawayForm({
      title: giveaway.title,
      description: giveaway.description,
      prizeName: giveaway.prizeName,
      prizeType: giveaway.prizeType,
      prizeAmount: giveaway.prizeAmount,
      imageUrl: giveaway.imageUrl,
      maxParticipants: giveaway.maxParticipants,
      startAt: giveaway.startAt
        ? giveaway.startAt.slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      endAt: giveaway.endAt
        ? giveaway.endAt.slice(0, 16)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      requirements: giveaway.requirements || "",
      status: giveaway.status,
      showOnHomepage: giveaway.showOnHomepage,
    });
    setIsGiveawayModalOpen(true);
  };

  // Save giveaway
  const handleSaveGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giveawayForm.title.trim() || !giveawayForm.prizeName.trim()) {
      showToast({
        title: "Campos requeridos",
        subtitle: "Completa el título y el nombre del premio del sorteo.",
      });
      return;
    }

    try {
      if (editingGiveaway) {
        await updateGiveaway({
          ...editingGiveaway,
          title: giveawayForm.title,
          description: giveawayForm.description,
          prizeName: giveawayForm.prizeName,
          prizeType: giveawayForm.prizeType,
          prizeAmount: Number(giveawayForm.prizeAmount) || 0,
          imageUrl: giveawayForm.imageUrl,
          maxParticipants: Number(giveawayForm.maxParticipants) || 50,
          startAt: new Date(giveawayForm.startAt).toISOString(),
          endAt: new Date(giveawayForm.endAt).toISOString(),
          requirements: giveawayForm.requirements,
          status: giveawayForm.status,
          showOnHomepage: giveawayForm.showOnHomepage,
        });
        showToast({
          title: "Sorteo actualizado",
          subtitle: "Los cambios se guardaron en Firestore.",
        });
      } else {
        await createGiveaway({
          title: giveawayForm.title,
          description: giveawayForm.description,
          prizeName: giveawayForm.prizeName,
          prizeType: giveawayForm.prizeType,
          prizeAmount: Number(giveawayForm.prizeAmount) || 0,
          imageUrl: giveawayForm.imageUrl,
          maxParticipants: Number(giveawayForm.maxParticipants) || 50,
          startAt: new Date(giveawayForm.startAt).toISOString(),
          endAt: new Date(giveawayForm.endAt).toISOString(),
          requirements: giveawayForm.requirements,
          status: giveawayForm.status,
          showOnHomepage: giveawayForm.showOnHomepage,
          createdBy: currentUser?.email || "admin",
        });
        showToast({
          title: "Sorteo creado",
          subtitle: "El nuevo sorteo está activo en Firestore.",
        });
      }
      setIsGiveawayModalOpen(false);
    } catch (err: any) {
      showToast({ title: "Error", subtitle: err.message || "No se pudo guardar el sorteo." });
    }
  };

  // Quick upload giveaway cover image directly from card
  const handleQuickGiveawayCardUpload = async (giveaway: Giveaway, file: File) => {
    try {
      const optimized = await fileToOptimizedImage(file);
      await updateGiveaway({ ...giveaway, imageUrl: optimized });
      showToast({
        title: "Foto Actualizada",
        subtitle: `La imagen del sorteo "${giveaway.title}" se actualizó desde tu dispositivo.`,
      });
    } catch (err) {
      console.error("Error al actualizar foto del sorteo:", err);
    }
  };

  // Open create discount
  const handleOpenCreateDiscount = () => {
    setEditingDiscount(null);
    setDiscountForm({
      name: "",
      code: "",
      type: "percentage",
      value: 15,
      minimumPurchase: 30,
      maxUses: 100,
      currentUses: 0,
      startAt: new Date().toISOString().slice(0, 16),
      endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      applicableProducts: [],
      excludedProducts: [],
      status: "ACTIVE",
      showOnHomepage: true,
    });
    setIsDiscountModalOpen(true);
  };

  // Open edit discount
  const handleOpenEditDiscount = (discount: StoreDiscount) => {
    setEditingDiscount(discount);
    setDiscountForm({
      name: discount.name,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      minimumPurchase: discount.minimumPurchase,
      maxUses: discount.maxUses,
      currentUses: discount.currentUses,
      startAt: discount.startAt
        ? discount.startAt.slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      endAt: discount.endAt
        ? discount.endAt.slice(0, 16)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      applicableProducts: discount.applicableProducts || [],
      excludedProducts: discount.excludedProducts || [],
      status: discount.status,
      showOnHomepage: discount.showOnHomepage,
    });
    setIsDiscountModalOpen(true);
  };

  // Save discount
  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountForm.name.trim() || !discountForm.code.trim()) {
      showToast({
        title: "Campos requeridos",
        subtitle: "Completa el nombre y el código único del cupón de descuento.",
      });
      return;
    }

    try {
      const cleanCode = discountForm.code.trim().toUpperCase().replace(/\s+/g, "");
      if (editingDiscount) {
        await updateDiscount({
          ...editingDiscount,
          name: discountForm.name,
          code: cleanCode,
          type: discountForm.type,
          value: Number(discountForm.value) || 0,
          minimumPurchase: Number(discountForm.minimumPurchase) || 0,
          maxUses: Number(discountForm.maxUses) || 100,
          startAt: new Date(discountForm.startAt).toISOString(),
          endAt: new Date(discountForm.endAt).toISOString(),
          applicableProducts: discountForm.applicableProducts,
          excludedProducts: discountForm.excludedProducts,
          status: discountForm.status,
          showOnHomepage: discountForm.showOnHomepage,
        });
        showToast({ title: "Descuento actualizado", subtitle: "Guardado en Firestore." });
      } else {
        await createDiscount({
          name: discountForm.name,
          code: cleanCode,
          type: discountForm.type,
          value: Number(discountForm.value) || 0,
          minimumPurchase: Number(discountForm.minimumPurchase) || 0,
          maxUses: Number(discountForm.maxUses) || 100,
          currentUses: 0,
          startAt: new Date(discountForm.startAt).toISOString(),
          endAt: new Date(discountForm.endAt).toISOString(),
          applicableProducts: discountForm.applicableProducts,
          excludedProducts: discountForm.excludedProducts,
          status: discountForm.status,
          showOnHomepage: discountForm.showOnHomepage,
        });
        showToast({ title: "Descuento creado", subtitle: "Activo para compras en la tienda." });
      }
      setIsDiscountModalOpen(false);
    } catch (err: any) {
      showToast({ title: "Error", subtitle: err.message || "No se pudo guardar el descuento." });
    }
  };

  // Draw Winner Trigger
  const handleExecuteWinnerDraw = async (giveaway: Giveaway) => {
    setIsDrawingLoading(true);
    try {
      const res = await drawGiveawayWinner(giveaway.id);
      if (res.success) {
        showToast({
          title: "¡Ganador Seleccionado!",
          subtitle:
            res.message || "El ganador fue registrado y la Gift Card generada si correspondía.",
        });
        setDrawingGiveaway(null);
      } else {
        showToast({
          title: "No se pudo seleccionar ganador",
          subtitle: res.message || "Verifica que el sorteo tenga participantes válidos.",
        });
      }
    } catch (err: any) {
      showToast({
        title: "Error al seleccionar ganador",
        subtitle: err.message || "Error en la ejecución segura.",
      });
    } finally {
      setIsDrawingLoading(false);
    }
  };

  // Filtered Giveaways
  const filteredGiveaways = useMemo(() => {
    return (giveaways || []).filter((g) => {
      const matchesSearch =
        !searchQuery ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.prizeName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || g.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [giveaways, searchQuery, statusFilter]);

  // Filtered Discounts
  const filteredDiscounts = useMemo(() => {
    return (discounts || []).filter((d) => {
      const matchesSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [discounts, searchQuery, statusFilter]);

  // Statistics calculation (Requirement 14)
  const stats = useMemo(() => {
    const activeG = (giveaways || []).filter((g) => g.status === "ACTIVE").length;
    const endedG = (giveaways || []).filter((g) => g.status === "ENDED").length;
    const totalParticipants = (giveawayEntries || []).filter((e) => e.status === "VALID").length;
    const deliveredPrizes = (giveawayWinners || []).length;
    const activeD = (discounts || []).filter((d) => d.status === "ACTIVE").length;
    const totalDiscountUses = (discounts || []).reduce((acc, d) => acc + (d.currentUses || 0), 0);

    const giveawayGiftCards = (giftCards || []).filter(
      (c) => c.source === "giveaway" || c.giveawayId,
    );
    const totalGiftCardAmount = giveawayGiftCards.reduce(
      (sum, c) => sum + (c.initialAmount || 0),
      0,
    );

    return {
      activeG,
      endedG,
      totalParticipants,
      deliveredPrizes,
      activeD,
      totalDiscountUses,
      giveawayGiftCardsCount: giveawayGiftCards.length,
      totalGiftCardAmount,
    };
  }, [giveaways, giveawayEntries, giveawayWinners, discounts, giftCards]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Main Module Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/70 text-rose-800 text-xs font-bold mb-2">
            <Gift className="w-3.5 h-3.5 text-rose-600" />
            <span>Módulo de Marketing & Dinámicas</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            🎁 Sorteos y Descuentos
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl">
            Gestiona sorteos oficiales con selección segura de ganadores, generación automática de
            Gift Cards y administración de cupones con reflejo en portada.
          </p>
        </div>

        {/* Action Button depending on sub-tab */}
        <div className="flex items-center gap-3">
          {subTab === "sorteos" && (
            <button
              type="button"
              onClick={handleOpenCreateGiveaway}
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-rose-200 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Sorteo</span>
            </button>
          )}

          {subTab === "descuentos" && (
            <button
              type="button"
              onClick={handleOpenCreateDiscount}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Descuento</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => {
            setSubTab("sorteos");
            setStatusFilter("ALL");
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === "sorteos"
              ? "bg-rose-900 text-white shadow-xs"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Sorteos ({giveaways?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubTab("descuentos");
            setStatusFilter("ALL");
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === "descuentos"
              ? "bg-rose-900 text-white shadow-xs"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Descuentos ({discounts?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubTab("historial");
            setStatusFilter("ALL");
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === "historial"
              ? "bg-rose-900 text-white shadow-xs"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Ganadores ({giveawayWinners?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("estadisticas")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === "estadisticas"
              ? "bg-rose-900 text-white shadow-xs"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Estadísticas & Reportes</span>
        </button>
      </div>

      {/* ── SUB-TAB 1: SORTEOS (GIVEAWAYS) ─────────────────────────────── */}
      {subTab === "sorteos" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por título o premio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 rounded-xl text-xs border border-stone-200 focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 rounded-xl text-xs border border-stone-200 text-stone-700 font-semibold focus:outline-hidden"
              >
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="DRAFT">Borradores</option>
                <option value="ENDED">Finalizados</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
            </div>
          </div>

          {/* Giveaways List */}
          {filteredGiveaways.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-300">
              <Gift className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-stone-800">
                No hay sorteos para mostrar
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Crea tu primer sorteo oficial para premiar a tus clientes de rosas eternas.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateGiveaway}
                className="mt-4 px-4 py-2 bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Crear Sorteo Ahora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGiveaways.map((giveaway) => {
                const entries = giveawayEntries.filter(
                  (e) => e.giveawayId === giveaway.id && e.status === "VALID",
                );
                const participantCount = entries.length;
                const remainingSlots = Math.max(0, giveaway.maxParticipants - participantCount);
                const winner = giveawayWinners.find((w) => w.giveawayId === giveaway.id);

                return (
                  <div
                    key={giveaway.id}
                    className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Thumbnail & Badges */}
                      <div className="relative aspect-16/9 bg-stone-100 overflow-hidden">
                        <img
                          src={giveaway.imageUrl}
                          alt={giveaway.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-xs ${
                              giveaway.status === "ACTIVE"
                                ? "bg-emerald-600 text-white"
                                : giveaway.status === "DRAFT"
                                  ? "bg-amber-500 text-white"
                                  : giveaway.status === "ENDED"
                                    ? "bg-stone-800 text-stone-200"
                                    : "bg-rose-700 text-white"
                            }`}
                          >
                            {giveaway.status}
                          </span>

                          {giveaway.showOnHomepage && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[10px] font-bold border border-rose-200 flex items-center gap-1">
                              <Eye className="w-3 h-3 text-rose-600" />
                              <span>En Portada</span>
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-2 left-2">
                          <label className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/85 text-white text-[10px] font-bold cursor-pointer flex items-center gap-1.5 transition-colors backdrop-blur-xs shadow-xs">
                            <Upload className="w-3 h-3 text-rose-300" />
                            <span>Cambiar foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handleQuickGiveawayCardUpload(giveaway, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>

                        <div className="absolute bottom-2 right-3 px-2 py-0.5 rounded-lg bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                          {giveaway.prizeType === "gift_card"
                            ? "Gift Card"
                            : giveaway.prizeType === "product"
                              ? "Ramo"
                              : "Descuento"}
                        </div>
                      </div>

                      {/* Info Body */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="font-serif text-base font-bold text-stone-900 leading-snug">
                            {giveaway.title}
                          </h3>
                          <div className="text-xs font-semibold text-rose-700 mt-1">
                            Premio: {giveaway.prizeName} (
                            {giveaway.prizeType === "gift_card"
                              ? `$${giveaway.prizeAmount} USD`
                              : giveaway.prizeType === "discount"
                                ? `${giveaway.prizeAmount}% OFF`
                                : `Valor $${giveaway.prizeAmount}`}
                            )
                          </div>
                        </div>

                        {/* Slots & Dates */}
                        <div className="space-y-1.5 text-xs text-stone-600 pt-2 border-t border-stone-150">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-stone-500">
                              <Users className="w-3.5 h-3.5" />
                              <span>Participantes:</span>
                            </span>
                            <span className="font-bold text-stone-900">
                              {participantCount} / {giveaway.maxParticipants} (Quedan{" "}
                              {remainingSlots})
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-stone-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Vigencia:</span>
                            </span>
                            <span className="text-[11px] font-medium text-stone-700">
                              {new Date(giveaway.startAt).toLocaleDateString()} —{" "}
                              {new Date(giveaway.endAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Winner Display if Ended */}
                        {giveaway.status === "ENDED" && (winner || giveaway.winnerDisplayName) && (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                            <div className="font-bold text-amber-900 flex items-center gap-1.5">
                              <Trophy className="w-3.5 h-3.5 text-amber-600" />
                              <span>Ganador Oficial:</span>
                            </div>
                            <div className="font-semibold text-stone-900 mt-0.5">
                              {winner?.displayName || giveaway.winnerDisplayName} (
                              {winner?.publicName ||
                                formatPublicWinnerName(giveaway.winnerDisplayName)}
                              )
                            </div>
                            {winner?.giftCardCode && (
                              <div className="mt-1 text-[11px] text-stone-600 flex items-center gap-1 font-mono">
                                <span>Gift Card:</span>
                                <span className="font-bold text-rose-800">
                                  {winner.giftCardCode}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-stone-50 border-t border-stone-150 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectingEntriesGiveaway(giveaway)}
                          className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Ver lista de personas inscritas"
                        >
                          <Users className="w-3 h-3 text-stone-500" />
                          <span>Participantes ({participantCount})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditGiveaway(giveaway)}
                          className="p-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs cursor-pointer transition-colors"
                          title="Editar Sorteo"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleGiveawayStatus(giveaway.id)}
                          className="p-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs cursor-pointer transition-colors"
                          title={
                            giveaway.status === "ACTIVE"
                              ? "Pausar/Desactivar Sorteo"
                              : "Activar Sorteo"
                          }
                        >
                          {giveaway.status === "ACTIVE" ? (
                            <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {giveaway.status === "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() => setDrawingGiveaway(giveaway)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                            title="Seleccionar ganador seguro por servidor"
                          >
                            <Trophy className="w-3 h-3 text-amber-100" />
                            <span>Elegir Ganador</span>
                          </button>
                        )}

                        {giveaway.status !== "CANCELLED" && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Deseas cancelar el sorteo "${giveaway.title}"?`)) {
                                cancelGiveaway(giveaway.id);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Cancelar Sorteo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 2: DESCUENTOS (DISCOUNTS) ─────────────────────────── */}
      {subTab === "descuentos" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 rounded-xl text-xs border border-stone-200 focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 rounded-xl text-xs border border-stone-200 text-stone-700 font-semibold focus:outline-hidden"
              >
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
                <option value="EXPIRED">Expirados</option>
              </select>
            </div>
          </div>

          {/* Discounts Grid */}
          {filteredDiscounts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-300">
              <Tag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-stone-800">
                No hay descuentos configurados
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Crea cupones de porcentaje o monto fijo para incentivar las ventas en fechas
                especiales.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateDiscount}
                className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Crear Descuento
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDiscounts.map((discount) => {
                const percentUsed =
                  discount.maxUses > 0
                    ? Math.round(((discount.currentUses || 0) / discount.maxUses) * 100)
                    : 0;

                return (
                  <div
                    key={discount.id}
                    className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              discount.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : discount.status === "EXPIRED"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {discount.status}
                          </span>
                          <h3 className="font-serif text-base font-bold text-stone-900 mt-1.5">
                            {discount.name}
                          </h3>
                        </div>

                        <div className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-900 text-xs font-mono font-bold border border-rose-200">
                          {discount.type === "percentage"
                            ? `${discount.value}% OFF`
                            : `$${discount.value} USD`}
                        </div>
                      </div>

                      {/* Code Pill */}
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-stone-900 tracking-wider">
                          {discount.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(discount.code);
                            showToast({
                              title: "Copiado",
                              subtitle: `Código "${discount.code}" copiado.`,
                            });
                          }}
                          className="p-1 text-stone-500 hover:text-stone-900 cursor-pointer"
                          title="Copiar código"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Usage and Limit */}
                      <div className="space-y-1 text-xs text-stone-600">
                        <div className="flex items-center justify-between">
                          <span>Usos acumulados:</span>
                          <span className="font-bold text-stone-900">
                            {discount.currentUses || 0} / {discount.maxUses}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-600 rounded-full transition-all"
                            style={{ width: `${Math.min(100, percentUsed)}%` }}
                          />
                        </div>
                      </div>

                      {/* Minimum Purchase & Dates */}
                      <div className="text-[11px] text-stone-500 space-y-1 pt-2 border-t border-stone-150">
                        <div className="flex justify-between">
                          <span>Compra mínima:</span>
                          <span className="font-medium text-stone-800">
                            {discount.minimumPurchase > 0
                              ? `$${discount.minimumPurchase} USD`
                              : "Sin mínimo"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vigencia:</span>
                          <span className="font-medium text-stone-800">
                            {new Date(discount.startAt).toLocaleDateString()} —{" "}
                            {new Date(discount.endAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-stone-150 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleDiscountStatus(discount.id)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-colors ${
                            discount.status === "ACTIVE"
                              ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          }`}
                        >
                          {discount.status === "ACTIVE" ? "Desactivar" : "Activar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditDiscount(discount)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar el descuento "${discount.name}"?`)) {
                            deleteDiscount(discount.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 3: HISTORIAL (WINNERS & PAST DRAWS) ───────────────── */}
      {subTab === "historial" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">
              Historial Oficial de Ganadores Seleccionados
            </h3>
            <p className="text-xs text-stone-600 mb-6">
              Registro auditado de ganadores, entrega de premios y códigos de Gift Cards generadas.
            </p>

            {giveawayWinners.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                Aún no hay ganadores seleccionados en ningún sorteo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="bg-stone-50 text-stone-700 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Sorteo</th>
                      <th className="py-3 px-4">Ganador/a</th>
                      <th className="py-3 px-4">Premio</th>
                      <th className="py-3 px-4">Fecha Sorteo</th>
                      <th className="py-3 px-4">Estado del Premio</th>
                      <th className="py-3 px-4">Gift Card / Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {giveawayWinners.map((w) => {
                      const giveawayRef = giveaways.find((g) => g.id === w.giveawayId);

                      return (
                        <tr key={w.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-stone-900">
                            {giveawayRef?.title || w.giveawayId}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-stone-900">{w.displayName}</div>
                            <div className="text-[10px] text-stone-400 font-mono">
                              Público: {w.publicName}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-rose-800">{w.prizeName}</span>
                            <div className="text-[10px] text-stone-400">
                              {w.prizeType === "gift_card"
                                ? `$${w.prizeAmount} USD`
                                : `$${w.prizeAmount}`}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {new Date(w.selectedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={w.prizeStatus}
                              onChange={(e) =>
                                updateGiveawayPrizeStatus(
                                  w.id,
                                  e.target.value as GiveawayWinner["prizeStatus"],
                                )
                              }
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                                w.prizeStatus === "DELIVERED"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : w.prizeStatus === "CLAIMED"
                                    ? "bg-sky-50 text-sky-800 border-sky-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              <option value="PENDING_DELIVERY">Pendiente de Entrega</option>
                              <option value="CLAIMED">Reclamado por Cliente</option>
                              <option value="DELIVERED">Entregado Exitosamente</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            {w.giftCardCode ? (
                              <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-stone-800">
                                <span>{w.giftCardCode}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(w.giftCardCode || "");
                                    showToast({
                                      title: "Copiado",
                                      subtitle: "Código de Gift Card copiado.",
                                    });
                                  }}
                                  className="p-1 text-stone-400 hover:text-stone-900 cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIsChatOpen(true)}
                                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-bold text-stone-700 flex items-center gap-1 cursor-pointer"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>Ver Chat</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 4: ESTADÍSTICAS (STATISTICS) ───────────────────────── */}
      {subTab === "estadisticas" && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Sorteos Activos
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
                {stats.activeG}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                En ejecución actualmente
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Sorteos Finalizados
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
                {stats.endedG}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">Con ganadores asignados</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Total Participantes
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 mt-1">
                {stats.totalParticipants}
              </div>
              <div className="text-[11px] text-rose-600 font-semibold mt-1">
                Registros confirmados
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Premios Entregados
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                {stats.deliveredPrizes}
              </div>
              <div className="text-[11px] text-amber-700 font-semibold mt-1">
                Dinámicas completadas
              </div>
            </div>
          </div>

          {/* Second Row: Discounts and Gift Cards Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-stone-700 font-bold text-xs uppercase tracking-wider">
                <Tag className="w-4 h-4 text-rose-600" />
                <span>Descuentos Activos</span>
              </div>
              <div className="text-3xl font-extrabold text-stone-900">{stats.activeD}</div>
              <p className="text-xs text-stone-500">
                Cupones vigentes aplicables en el carrito y portal principal.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-stone-700 font-bold text-xs uppercase tracking-wider">
                <Percent className="w-4 h-4 text-stone-600" />
                <span>Uso de Descuentos</span>
              </div>
              <div className="text-3xl font-extrabold text-stone-900">
                {stats.totalDiscountUses}
              </div>
              <p className="text-xs text-stone-500">
                Redenciones totales de códigos promocionales por compradores.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-stone-700 font-bold text-xs uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Gift Cards por Sorteos</span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-700">
                ${stats.totalGiftCardAmount} <span className="text-xs text-stone-500">USD</span>
              </div>
              <p className="text-xs text-stone-500">
                {stats.giveawayGiftCardsCount} tarjetas emitidas automáticamente a ganadores.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREAR / EDITAR SORTEO ──────────────────────────────── */}
      {isGiveawayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden my-8"
          >
            <div className="bg-rose-900 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setIsGiveawayModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-serif text-xl sm:text-2xl font-bold">
                {editingGiveaway ? "Editar Sorteo" : "Crear Nuevo Sorteo"}
              </h3>
              <p className="text-rose-200 text-xs mt-1">
                Configura los datos del sorteo, cupos y premio para tus clientes.
              </p>
            </div>

            <form
              onSubmit={handleSaveGiveaway}
              className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Título del Sorteo *
                </label>
                <input
                  type="text"
                  required
                  value={giveawayForm.title}
                  onChange={(e) => setGiveawayForm({ ...giveawayForm, title: e.target.value })}
                  placeholder="ej: Gran Sorteo Día de las Madres — Ramo Eterno 50 Rosas"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-rose-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Descripción *
                </label>
                <textarea
                  rows={3}
                  required
                  value={giveawayForm.description}
                  onChange={(e) =>
                    setGiveawayForm({ ...giveawayForm, description: e.target.value })
                  }
                  placeholder="Explica a los participantes en qué consiste y cómo ganar..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-rose-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Tipo de Premio *
                  </label>
                  <select
                    value={giveawayForm.prizeType}
                    onChange={(e) =>
                      setGiveawayForm({
                        ...giveawayForm,
                        prizeType: e.target.value as GiveawayPrizeType,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50"
                  >
                    <option value="gift_card">Tarjeta de Regalo (Gift Card)</option>
                    <option value="product">Ramo / Producto Físico</option>
                    <option value="discount">Cupón de Descuento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Nombre del Premio *
                  </label>
                  <input
                    type="text"
                    required
                    value={giveawayForm.prizeName}
                    onChange={(e) =>
                      setGiveawayForm({ ...giveawayForm, prizeName: e.target.value })
                    }
                    placeholder="ej: Tarjeta de $50 USD"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Monto / Valor ($ USD o %) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={giveawayForm.prizeAmount}
                    onChange={(e) =>
                      setGiveawayForm({ ...giveawayForm, prizeAmount: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={giveawayForm.startAt}
                    onChange={(e) => setGiveawayForm({ ...giveawayForm, startAt: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Fecha de Finalización *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={giveawayForm.endAt}
                    onChange={(e) => setGiveawayForm({ ...giveawayForm, endAt: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Límite Máximo de Participantes *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10000}
                    value={giveawayForm.maxParticipants}
                    onChange={(e) =>
                      setGiveawayForm({
                        ...giveawayForm,
                        maxParticipants: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Estado Inicial *
                  </label>
                  <select
                    value={giveawayForm.status}
                    onChange={(e) =>
                      setGiveawayForm({
                        ...giveawayForm,
                        status: e.target.value as GiveawayStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm bg-stone-50"
                  >
                    <option value="ACTIVE">ACTIVO (Permite inscripciones)</option>
                    <option value="DRAFT">BORRADOR (Oculto)</option>
                    <option value="ENDED">FINALIZADO</option>
                    <option value="CANCELLED">CANCELADO</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Imagen de Portada del Sorteo *
                </label>

                {/* Upload button from device */}
                <label className="flex items-center justify-center gap-2.5 px-4 py-3 border-2 border-dashed border-rose-200 bg-rose-50/50 hover:bg-rose-50 rounded-2xl cursor-pointer transition-colors group">
                  <Upload className="w-4 h-4 text-rose-700 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-rose-800">
                    {isUploadingGiveawayImage
                      ? "Procesando imagen del dispositivo…"
                      : "Subir imagen desde mi dispositivo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleGiveawayImageUpload}
                  />
                </label>

                {/* Image preview with remove/change option */}
                {giveawayForm.imageUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 aspect-16/9 flex items-center justify-center shadow-xs">
                    <img
                      src={giveawayForm.imageUrl}
                      alt="Vista previa del sorteo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3">
                      <span className="text-[11px] text-white font-medium bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                        Vista previa de portada
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="p-1.5 bg-white/90 hover:bg-white text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs">
                          <Upload className="w-3.5 h-3.5 text-rose-700" />
                          <span>Cambiar foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleGiveawayImageUpload}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setGiveawayForm({ ...giveawayForm, imageUrl: "" })}
                          className="p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Quitar foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct URL alternative */}
                <div className="pt-1">
                  <div className="relative">
                    <input
                      type="url"
                      value={giveawayForm.imageUrl}
                      onChange={(e) =>
                        setGiveawayForm({ ...giveawayForm, imageUrl: e.target.value })
                      }
                      placeholder="O pega una URL directa de imagen (https://...)"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-700 bg-stone-50 focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Puedes subir fotos directamente desde tu celular/computadora o pegar una URL.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Requisitos o Reglas (Opcional)
                </label>
                <input
                  type="text"
                  value={giveawayForm.requirements}
                  onChange={(e) =>
                    setGiveawayForm({ ...giveawayForm, requirements: e.target.value })
                  }
                  placeholder="ej: Seguir en Instagram y tener cuenta activa"
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              {/* Show on Homepage Toggle */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-stone-900">
                    Mostrar en la Página Principal
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Activa automáticamente la tarjeta del sorteo en la sección de inicio.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={giveawayForm.showOnHomepage}
                  onChange={(e) =>
                    setGiveawayForm({ ...giveawayForm, showOnHomepage: e.target.checked })
                  }
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-150">
                <button
                  type="button"
                  onClick={() => setIsGiveawayModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingGiveaway ? "Guardar Cambios" : "Publicar Sorteo"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── MODAL: VER PARTICIPANTES ─────────────────────────────────── */}
      {inspectingEntriesGiveaway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden"
          >
            <div className="bg-stone-900 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setInspectingEntriesGiveaway(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-serif text-xl font-bold">Participantes Registrados</h3>
              <p className="text-stone-300 text-xs mt-1">{inspectingEntriesGiveaway.title}</p>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {giveawayEntries.filter(
                (e) => e.giveawayId === inspectingEntriesGiveaway.id && e.status === "VALID",
              ).length === 0 ? (
                <div className="py-8 text-center text-stone-400 text-xs">
                  Aún no hay participantes inscritos en este sorteo.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {giveawayEntries
                    .filter(
                      (e) => e.giveawayId === inspectingEntriesGiveaway.id && e.status === "VALID",
                    )
                    .map((entry, idx) => (
                      <div
                        key={entry.entryId || entry.id || idx}
                        className="py-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center">
                            {entry.displayName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-stone-900">
                              {entry.displayName}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              ID: {entry.userId?.slice(0, 10)}... · Inscrito:{" "}
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          VÁLIDO
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-150 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingEntriesGiveaway(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL: CONFIRMACIÓN SELECCIÓN DE GANADOR ─────────────────── */}
      {drawingGiveaway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden p-6 text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="font-serif text-xl font-bold text-stone-900">
              ¿Elegir Ganador Oficial?
            </h3>

            <p className="text-xs text-stone-600 leading-relaxed">
              Se ejecutará la selección aleatoria mediante lógica segura de backend entre los
              participantes válidos de <strong>"{drawingGiveaway.title}"</strong>.
              {drawingGiveaway.prizeType === "gift_card" && (
                <span className="block text-emerald-700 font-semibold mt-1">
                  Se creará automáticamente la tarjeta de regalo real vinculada al ganador.
                </span>
              )}
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDrawingLoading}
                onClick={() => setDrawingGiveaway(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDrawingLoading}
                onClick={() => handleExecuteWinnerDraw(drawingGiveaway)}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-2"
              >
                {isDrawingLoading ? (
                  <span>Eligiendo ganador...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirmar Selección</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL: CREAR / EDITAR DESCUENTO ───────────────────────────── */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden"
          >
            <div className="bg-stone-900 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-serif text-xl font-bold">
                {editingDiscount ? "Editar Descuento" : "Crear Cupón de Descuento"}
              </h3>
              <p className="text-stone-300 text-xs mt-1">
                Define las condiciones comerciales y códigos de promoción.
              </p>
            </div>

            <form
              onSubmit={handleSaveDiscount}
              className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Nombre de la Promoción *
                </label>
                <input
                  type="text"
                  required
                  value={discountForm.name}
                  onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                  placeholder="ej: Descuento Bienvenida Primavera"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Código Único *
                  </label>
                  <input
                    type="text"
                    required
                    value={discountForm.code}
                    onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })}
                    placeholder="ej: MONCE15"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Tipo de Descuento *
                  </label>
                  <select
                    value={discountForm.type}
                    onChange={(e) =>
                      setDiscountForm({
                        ...discountForm,
                        type: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($ USD)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Valor del Descuento *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountForm.value}
                    onChange={(e) =>
                      setDiscountForm({ ...discountForm, value: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Compra Mínima ($ USD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={discountForm.minimumPurchase}
                    onChange={(e) =>
                      setDiscountForm({
                        ...discountForm,
                        minimumPurchase: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Usos Máximos
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={discountForm.maxUses}
                    onChange={(e) =>
                      setDiscountForm({ ...discountForm, maxUses: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Estado *
                  </label>
                  <select
                    value={discountForm.status}
                    onChange={(e) =>
                      setDiscountForm({
                        ...discountForm,
                        status: e.target.value as "ACTIVE" | "INACTIVE" | "EXPIRED",
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm bg-stone-50"
                  >
                    <option value="ACTIVE">ACTIVO</option>
                    <option value="INACTIVE">INACTIVO</option>
                    <option value="EXPIRED">EXPIRADO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Válido Desde *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={discountForm.startAt}
                    onChange={(e) => setDiscountForm({ ...discountForm, startAt: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Válido Hasta *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={discountForm.endAt}
                    onChange={(e) => setDiscountForm({ ...discountForm, endAt: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              {/* Show on Homepage */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-stone-900">Mostrar Banner en Portada</div>
                  <div className="text-[11px] text-stone-500">
                    Muestra el cupón en la sección de sorteos y promociones de la página principal.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={discountForm.showOnHomepage}
                  onChange={(e) =>
                    setDiscountForm({ ...discountForm, showOnHomepage: e.target.checked })
                  }
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-150">
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingDiscount ? "Guardar Cambios" : "Crear Cupón"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
