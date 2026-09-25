import React, { useState } from "react";
import {
  Crown,
  Sparkles,
  Gift,
  Tag,
  Percent,
  Plus,
  Edit,
  Trash2,
  Check,
  Copy,
  ChevronRight,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  Layers,
  TrendingUp,
  Palette,
  CheckCircle2,
  RefreshCw,
  Eye,
  ExternalLink,
  Search,
  Filter,
  CreditCard,
  Flame,
  Star,
  Award,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { LoyaltyTier, LoyaltyCardTheme, LoyaltyQualificationCriterion, GiftCard } from "../types";

export const AdminLoyaltyRewardsView: React.FC = () => {
  const {
    loyaltyTiers,
    createLoyaltyTier,
    updateLoyaltyTier,
    deleteLoyaltyTier,
    toggleLoyaltyTierStatus,
    resetToDefaultLoyaltyTiers,
    loyaltyProgramStats,
    giftCards,
    createAdminGiftCard,
    updateGiftCardStatus,
    deleteGiftCard,
    registeredUsers,
    orders,
    getCustomerLoyaltyProgress,
    saveAllNow,
    showToast,
    siteSettings,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<"stats" | "tiers" | "giftcards" | "customers">(
    "stats",
  );

  // Copied code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal states for Tiers
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [isNewTierModalOpen, setIsNewTierModalOpen] = useState<boolean>(false);
  const [tierFormData, setTierFormData] = useState({
    name: "",
    badge: "🌸",
    description: "",
    cardTheme: "rose_gold" as LoyaltyCardTheme,
    customGradient: "linear-gradient(135deg, #be123c 0%, #e11d48 40%, #fb7185 100%)",
    qualificationCriterion: "SPEND_USD" as LoyaltyQualificationCriterion,
    minSpendUSD: 50,
    minOrdersCount: 2,
    discountPercentage: 10,
    benefits: ["Acceso a promociones y preventas"],
    newBenefitInput: "",
    earlyAccessEvents: true,
    exclusiveBouquetsCatalog: false,
    specialGiftIncluded: false,
    welcomeCouponCode: "",
    active: true,
    orderIndex: loyaltyTiers.length + 1,
  });

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState<string>("");

  // Quick Gift Card state
  const [isNewGiftCardModalOpen, setIsNewGiftCardModalOpen] = useState<boolean>(false);
  const [newGiftCardData, setNewGiftCardData] = useState({
    code: "",
    amountUSD: 15,
    recipientName: "",
    recipientEmail: "",
    personalMessage: "Un detalle de cortesía de Lazo Eterno para canjear en tus ramos favoritos.",
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ─── Helpers for Styling Tiers ─────────────────────────────────────────────
  const getCardGradient = (tier: LoyaltyTier | typeof tierFormData) => {
    if (tier.cardTheme === "custom" && tier.customGradient) {
      return tier.customGradient;
    }
    switch (tier.cardTheme) {
      case "silver_velvet":
        return "linear-gradient(135deg, #475569 0%, #64748b 45%, #94a3b8 100%)";
      case "imperial_gold":
        return "linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 75%, #fde68a 100%)";
      case "black_diamond":
        return "linear-gradient(135deg, #09090b 0%, #18181b 45%, #27272a 80%, #52525b 100%)";
      case "lavender_luxury":
        return "linear-gradient(135deg, #581c87 0%, #7e22ce 50%, #c084fc 100%)";
      case "rose_gold":
      default:
        return "linear-gradient(135deg, #9f1239 0%, #be123c 45%, #f43f5e 80%, #fda4af 100%)";
    }
  };

  // ─── Handlers for Tier CRUD ─────────────────────────────────────────────────
  const openCreateTierModal = () => {
    setEditingTier(null);
    setTierFormData({
      name: "",
      badge: "✨",
      description: "",
      cardTheme: "rose_gold",
      customGradient: "linear-gradient(135deg, #be123c 0%, #e11d48 40%, #fb7185 100%)",
      qualificationCriterion: "SPEND_USD",
      minSpendUSD: 100,
      minOrdersCount: 2,
      discountPercentage: 10,
      benefits: ["Descuento permanente en ramos", "Acceso a colecciones exclusivas"],
      newBenefitInput: "",
      earlyAccessEvents: true,
      exclusiveBouquetsCatalog: false,
      specialGiftIncluded: false,
      welcomeCouponCode: "",
      active: true,
      orderIndex: loyaltyTiers.length + 1,
    });
    setIsNewTierModalOpen(true);
  };

  const openEditTierModal = (tier: LoyaltyTier) => {
    setEditingTier(tier);
    setTierFormData({
      name: tier.name,
      badge: tier.badge,
      description: tier.description,
      cardTheme: tier.cardTheme,
      customGradient:
        tier.customGradient || "linear-gradient(135deg, #be123c 0%, #e11d48 40%, #fb7185 100%)",
      qualificationCriterion: tier.qualificationCriterion,
      minSpendUSD: tier.minSpendUSD,
      minOrdersCount: tier.minOrdersCount,
      discountPercentage: tier.discountPercentage,
      benefits: [...(tier.benefits || [])],
      newBenefitInput: "",
      earlyAccessEvents: tier.earlyAccessEvents,
      exclusiveBouquetsCatalog: tier.exclusiveBouquetsCatalog,
      specialGiftIncluded: tier.specialGiftIncluded,
      welcomeCouponCode: tier.welcomeCouponCode || "",
      active: tier.active,
      orderIndex: tier.orderIndex,
    });
    setIsNewTierModalOpen(true);
  };

  const handleSaveTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierFormData.name.trim()) {
      showToast({
        title: "Nombre requerido",
        subtitle: "Ingresa un nombre para el nivel de lealtad.",
      });
      return;
    }

    if (editingTier) {
      updateLoyaltyTier(editingTier.id, {
        name: tierFormData.name,
        badge: tierFormData.badge,
        description: tierFormData.description,
        cardTheme: tierFormData.cardTheme,
        customGradient: tierFormData.customGradient,
        qualificationCriterion: tierFormData.qualificationCriterion,
        requiredPoints: 0,
        minSpendUSD: Number(tierFormData.minSpendUSD),
        minOrdersCount: Number(tierFormData.minOrdersCount),
        discountPercentage: Number(tierFormData.discountPercentage),
        benefits: tierFormData.benefits,
        earlyAccessEvents: tierFormData.earlyAccessEvents,
        exclusiveBouquetsCatalog: tierFormData.exclusiveBouquetsCatalog,
        specialGiftIncluded: tierFormData.specialGiftIncluded,
        welcomeCouponCode: tierFormData.welcomeCouponCode.trim().toUpperCase() || undefined,
        active: tierFormData.active,
        orderIndex: Number(tierFormData.orderIndex),
      });
      showToast({
        title: "¡Nivel actualizado!",
        subtitle: `El nivel ${tierFormData.name} ha sido guardado.`,
      });
    } else {
      createLoyaltyTier({
        name: tierFormData.name,
        badge: tierFormData.badge,
        description: tierFormData.description,
        cardTheme: tierFormData.cardTheme,
        customGradient: tierFormData.customGradient,
        qualificationCriterion: tierFormData.qualificationCriterion,
        requiredPoints: 0,
        minSpendUSD: Number(tierFormData.minSpendUSD),
        minOrdersCount: Number(tierFormData.minOrdersCount),
        discountPercentage: Number(tierFormData.discountPercentage),
        benefits: tierFormData.benefits,
        earlyAccessEvents: tierFormData.earlyAccessEvents,
        exclusiveBouquetsCatalog: tierFormData.exclusiveBouquetsCatalog,
        specialGiftIncluded: tierFormData.specialGiftIncluded,
        welcomeCouponCode: tierFormData.welcomeCouponCode.trim().toUpperCase() || undefined,
        active: tierFormData.active,
        orderIndex: Number(tierFormData.orderIndex),
      });
      showToast({
        title: "¡Nivel creado!",
        subtitle: `El nuevo nivel ${tierFormData.name} está activo.`,
      });
    }

    setIsNewTierModalOpen(false);
    setTimeout(() => saveAllNow(), 100);
  };

  const handleDeleteTier = (tierId: string, tierName: string) => {
    if (loyaltyTiers.length <= 1) {
      showToast({
        title: "Operación no permitida",
        subtitle: "Debes mantener al menos un nivel básico de lealtad.",
      });
      return;
    }
    if (
      window.confirm(
        `¿Estás segura de eliminar el nivel "${tierName}"? Los clientes de este nivel se reclasificarán automáticamente.`,
      )
    ) {
      deleteLoyaltyTier(tierId);
      showToast({ title: "Nivel eliminado", subtitle: `El nivel ${tierName} ha sido removido.` });
      setTimeout(() => saveAllNow(), 100);
    }
  };

  const handleAddBenefitToForm = () => {
    if (!tierFormData.newBenefitInput.trim()) return;
    setTierFormData((prev) => ({
      ...prev,
      benefits: [...prev.benefits, prev.newBenefitInput.trim()],
      newBenefitInput: "",
    }));
  };

  const handleRemoveBenefitFromForm = (index: number) => {
    setTierFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  // ─── Handlers for Quick Gift Card in USD ────────────────────────────────────
  const handleCreateQuickGiftCard = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode =
      newGiftCardData.code.trim().toUpperCase() ||
      `LAZO-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    createAdminGiftCard({
      code: cleanCode,
      initialAmount: Number(newGiftCardData.amountUSD),
      currentBalance: Number(newGiftCardData.amountUSD),
      currency: "USD",
      recipientName: newGiftCardData.recipientName || "Cliente Distinguido",
      recipientEmail: newGiftCardData.recipientEmail || "",
      purchaserName: "Lazo Eterno (Cortesía Dueña)",
      purchaserEmail: "admin@lazoeterno.com",
      personalMessage: newGiftCardData.personalMessage,
      themeDesign: "romantic_rose",
      deliveryMethod: "direct",
      status: "active",
      redemptionHistory: [],
    });

    showToast({
      title: "¡Tarjeta de regalo emitida!",
      subtitle: `Código ${cleanCode} con saldo de $${newGiftCardData.amountUSD} USD generado.`,
    });

    setIsNewGiftCardModalOpen(false);
    setNewGiftCardData({
      code: "",
      amountUSD: 15,
      recipientName: "",
      recipientEmail: "",
      personalMessage: "Un detalle de cortesía de Lazo Eterno para canjear en tus ramos favoritos.",
    });
    setTimeout(() => saveAllNow(), 100);
  };

  // Calculate distinct customers and their tiers for directory
  const customersList = React.useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        phone?: string;
        ordersCount: number;
        spendUSD: number;
      }
    >();

    registeredUsers.forEach((u) => {
      if (u.role !== "admin") {
        const em = u.email.toLowerCase().trim();
        map.set(em, {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          ordersCount: 0,
          spendUSD: 0,
        });
      }
    });

    orders.forEach((o) => {
      if (o.status !== "CANCELADO") {
        const em = (o.customerEmail || "").toLowerCase().trim();
        if (em) {
          const item = map.get(em) || {
            id: o.customerId || "cust-" + em,
            name: o.customerName || "Cliente",
            email: o.customerEmail,
            phone: o.customerPhone,
            ordersCount: 0,
            spendUSD: 0,
          };
          item.ordersCount += 1;
          const paidUSD = o.amountPaid || o.totalPrice || 0;
          item.spendUSD += Math.round(paidUSD * 100) / 100;
          map.set(em, item);
        }
      }
    });

    return Array.from(map.values()).map((c) => {
      const prog = getCustomerLoyaltyProgress(c.id, c.email);
      return {
        ...c,
        ordersCount: prog.totalOrdersCount,
        spendUSD: prog.totalSpentUSD,
        isEligible: prog.isEligible,
        currentTier: prog.currentTier,
        nextTier: prog.nextTier,
        progressPercentage: prog.progressPercentage,
      };
    });
  }, [registeredUsers, orders, getCustomerLoyaltyProgress]);

  const filteredCustomers = customersList.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.currentTier.name.toLowerCase().includes(q)
    );
  });

  return (
    <div id="admin-loyalty-rewards-view" className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1 border border-rose-200">
              <Crown className="w-3.5 h-3.5 text-rose-700" />
              Módulo de Lealtad y Recompensas
            </span>
            <span className="text-xs text-stone-400">Totalmente Configurable</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-1">
            Gestión de Membresías VIP y Beneficios
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Crea niveles de lealtad basados en gasto acumulado ($ USD) o cantidad de compras.
            Administra tarjetas de regalo y membresías de clientes con reglas personalizadas.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-admin-create-tier"
            type="button"
            onClick={openCreateTierModal}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_4px_14px_rgba(225,29,72,0.25)] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Nivel</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation: Mobile Dropdown + Desktop Artisan Tabs (No horizontal scrolling) */}
      <div className="space-y-3">
        {/* Mobile Dropdown */}
        <div className="sm:hidden">
          <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
            Sección del Club:
          </label>
          <div className="relative">
            <select
              value={activeSubTab}
              onChange={(e) => setActiveSubTab(e.target.value as any)}
              className="w-full pl-3.5 pr-9 py-2.5 bg-white border border-rose-200 rounded-xl text-xs font-bold text-stone-800 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer shadow-2xs"
            >
              <option value="stats">📈 Estadísticas del Club</option>
              <option value="tiers">👑 Niveles & Tarjetas ({loyaltyTiers.length})</option>
              <option value="giftcards">
                💳 Tarjetas de Regalo (${loyaltyProgramStats.giftCardsActiveBalanceUSD} USD)
              </option>
              <option value="customers">👥 Directorio de Clientes ({customersList.length})</option>
            </select>
            <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Desktop Artisan Tabs */}
        <div className="hidden sm:flex flex-wrap items-center gap-2 p-1.5 bg-stone-100/80 rounded-2xl border border-stone-200">
          <button
            onClick={() => setActiveSubTab("stats")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === "stats"
                ? "bg-white text-rose-800 shadow-xs border border-rose-100"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
            <span>Estadísticas del Club</span>
          </button>

          <button
            onClick={() => setActiveSubTab("tiers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === "tiers"
                ? "bg-white text-rose-800 shadow-xs border border-rose-100"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>Niveles & Tarjetas</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 text-[10px] font-extrabold border border-rose-100">
              {loyaltyTiers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("giftcards")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === "giftcards"
                ? "bg-white text-rose-800 shadow-xs border border-rose-100"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-rose-600" />
            <span>Tarjetas de Regalo</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
              ${loyaltyProgramStats.giftCardsActiveBalanceUSD} USD
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("customers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === "customers"
                ? "bg-white text-rose-800 shadow-xs border border-rose-100"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-stone-600" />
            <span>Directorio de Clientes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-800 text-[10px] font-bold">
              {customersList.length}
            </span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 1: ESTADÍSTICAS DEL PROGRAMA (REAL-TIME DATA)                     */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === "stats" && (
        <div className="space-y-6">
          {/* Top KPI Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-400 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Miembros Club
                </span>
                <Users className="w-4 h-4 text-rose-600" />
              </div>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 block">
                {loyaltyProgramStats.totalMembers}
              </span>
              <span className="text-[10px] text-stone-500 mt-1 block">
                Clientes registrados y recurrentes
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-400 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Gasto Total Club
                </span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-emerald-700 block">
                ${loyaltyProgramStats.totalSpentUSD}{" "}
                <span className="text-xs font-sans text-stone-500">USD</span>
              </span>
              <span className="text-[10px] text-stone-500 mt-1 block">
                Acumulado en compras aprobadas (USD)
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-400 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Compras Club
                </span>
                <Layers className="w-4 h-4 text-amber-600" />
              </div>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 block">
                {loyaltyProgramStats.totalOrdersCount}
              </span>
              <span className="text-[10px] text-stone-500 mt-1 block">
                Pedidos de clientes en programa
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-400 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Tarjetas Saldo
                </span>
                <CreditCard className="w-4 h-4 text-sky-600" />
              </div>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-sky-800 block">
                ${loyaltyProgramStats.giftCardsActiveBalanceUSD}{" "}
                <span className="text-xs font-sans text-stone-500">USD</span>
              </span>
              <span className="text-[10px] text-stone-500 mt-1 block">
                ${loyaltyProgramStats.giftCardsRedeemedUSD} USD ya canjeados
              </span>
            </div>
          </div>

          {/* Member Tier Distribution Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span>Distribución de Clientes por Nivel de Lealtad</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Muestra cuántos clientes califican en cada categoría según sus compras y gasto
                  real acumulado.
                </p>
              </div>
              <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
                {loyaltyTiers.filter((t) => t.active).length} Niveles Activos
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {loyaltyProgramStats.tierDistribution.map((dist) => {
                const percentMembers =
                  loyaltyProgramStats.totalMembers > 0
                    ? Math.round((dist.memberCount / loyaltyProgramStats.totalMembers) * 100)
                    : 0;

                return (
                  <div
                    key={dist.tierId}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{dist.badge}</span>
                        <div>
                          <span className="font-bold text-sm text-stone-900 block">
                            {dist.tierName}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Gasto generado por miembros: <b>${dist.totalSpentUSD} USD</b>
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-sm text-rose-800 block">
                          {dist.memberCount} {dist.memberCount === 1 ? "cliente" : "clientes"}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {percentMembers}% del total
                        </span>
                      </div>
                    </div>

                    {/* Bar */}
                    <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-rose-600 to-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentMembers, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Promotion Tips Card */}
          <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Consejo de Fidelización para Monse
              </span>
              <p className="text-xs text-stone-700 max-w-2xl">
                Los clientes leales compran con mayor anticipación en fechas clave como el 14 de
                Febrero o el 10 de Mayo. Puedes activar el beneficio de <b>Acceso Anticipado</b> en
                sus niveles para invitarlos a apartar cupo 2 semanas antes que el público general.
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab("tiers")}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl cursor-pointer shrink-0 transition-colors"
            >
              Configurar Beneficios
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 2: NIVELES Y TARJETAS DE LEALTAD (TIERS CRUD)                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === "tiers" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Niveles y Tarjetas de Lealtad Configurables
              </h3>
              <p className="text-xs text-stone-500">
                Define los requisitos en dólares ($ USD) o número de compras necesarias para que tus
                clientes suban de nivel y disfruten de beneficios exclusivos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetToDefaultLoyaltyTiers}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Restablece los 4 niveles recomendados (Rosa, Plata, Oro, Diamante)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Valores Sugeridos</span>
              </button>

              <button
                type="button"
                onClick={openCreateTierModal}
                className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Nivel</span>
              </button>
            </div>
          </div>

          {/* Grid of Loyalty Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loyaltyTiers.map((tier) => (
              <div
                key={tier.id}
                className={`bg-white rounded-3xl border overflow-hidden shadow-xs transition-all flex flex-col justify-between ${
                  tier.active ? "border-stone-200 hover:shadow-md" : "border-stone-200 opacity-60"
                }`}
              >
                <div>
                  {/* Card Visual Header with Real Gradient Preview */}
                  <div
                    className="p-5 sm:p-6 text-white relative overflow-hidden"
                    style={{ background: getCardGradient(tier) }}
                  >
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{tier.badge}</span>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-white/90">
                            Nivel {tier.orderIndex} • {siteSettings.businessName}
                          </span>
                        </div>
                        <h4 className="font-serif text-2xl font-bold mt-1 text-white tracking-tight">
                          {tier.name}
                        </h4>
                        <p className="text-xs text-white/80 mt-0.5 line-clamp-2">
                          {tier.description}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-extrabold block border border-white/30">
                          {tier.discountPercentage}% OFF
                        </span>
                        <span className="text-[9px] uppercase font-semibold text-white/90 block mt-1">
                          Descuento
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/90 relative z-10">
                      <span>Requisito de Acceso:</span>
                      <span className="font-mono font-bold">
                        {tier.qualificationCriterion === "SPEND_USD" &&
                          `$${tier.minSpendUSD} USD gastados`}
                        {tier.qualificationCriterion === "ORDERS_COUNT" &&
                          `${tier.minOrdersCount} compras completadas`}
                        {tier.qualificationCriterion === "BOTH" &&
                          `$${tier.minSpendUSD} USD Y ${tier.minOrdersCount} pedidos`}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    {/* Status & Rules tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold ${
                          tier.active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {tier.active ? "Activo" : "Inactivo"}
                      </span>

                      {tier.earlyAccessEvents && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-medium">
                          Acceso Anticipado Eventos
                        </span>
                      )}

                      {tier.exclusiveBouquetsCatalog && (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                          Catálogo Exclusivo VIP
                        </span>
                      )}

                      {tier.specialGiftIncluded && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                          Regalo Sorpresa
                        </span>
                      )}
                    </div>

                    {/* Benefits List */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                        Beneficios Otorgados ({tier.benefits?.length || 0})
                      </span>
                      <ul className="space-y-1 text-xs text-stone-600">
                        {(tier.benefits || []).map((ben, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{ben}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleLoyaltyTierStatus(tier.id)}
                    className={`text-xs font-semibold cursor-pointer transition-colors ${
                      tier.active
                        ? "text-stone-500 hover:text-stone-800"
                        : "text-emerald-700 hover:text-emerald-800"
                    }`}
                  >
                    {tier.active ? "Desactivar nivel" : "Activar nivel"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditTierModal(tier)}
                      className="px-3 py-1 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-stone-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTier(tier.id, tier.name)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Eliminar nivel"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 3: TARJETAS DE REGALO & SALDOS EN DÓLARES                          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === "giftcards" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Tarjetas de Regalo en Dólares ($ USD)
              </h3>
              <p className="text-xs text-stone-500">
                Emite tarjetas de regalo digitales de fidelización o cortesía para clientes
                distinguidos de tu club de lealtad.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewGiftCardModalOpen(true)}
              className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Emitir Tarjeta de Regalo en USD</span>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {giftCards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200 text-stone-800">
                      {card.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        card.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-200 text-stone-600"
                      }`}
                    >
                      {card.status === "active" ? "Activa" : "Canjeada"}
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="text-[10px] text-stone-400 block uppercase">
                      Saldo Disponible
                    </span>
                    <span className="font-serif text-2xl font-bold text-rose-800">
                      ${card.currentBalance}{" "}
                      <span className="text-xs font-sans text-stone-500">
                        {card.currency || "USD"}
                      </span>
                    </span>
                    <span className="text-xs text-stone-500 block mt-0.5">
                      Valor inicial: ${card.initialAmount} {card.currency || "USD"}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-stone-100 mt-3 text-xs text-stone-600 space-y-1">
                    <p>
                      <b>Para:</b> {card.recipientName}{" "}
                      {card.recipientEmail && `(${card.recipientEmail})`}
                    </p>
                    <p>
                      <b>De:</b> {card.purchaserName}
                    </p>
                    {card.personalMessage && (
                      <p className="text-[11px] text-stone-500 italic mt-1 bg-stone-50 p-2 rounded-xl">
                        "{card.personalMessage}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-stone-100 gap-2">
                  <span className="text-[10px] text-stone-400">
                    Emitida:{" "}
                    {card.createdAt ? new Date(card.createdAt).toLocaleDateString() : "Reciente"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(card.code)}
                      className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedCode === card.code ? "¡Copiado!" : "Copiar"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Estás segura de eliminar permanentemente la tarjeta ${card.code}? Esta acción borrará el saldo y el registro definitivamente.`,
                          )
                        ) {
                          deleteGiftCard(card.id);
                        }
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer p-1 rounded-md hover:bg-rose-50"
                      title="Eliminar permanentemente"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 5: DIRECTORIO DE CLIENTES Y NIVELES CALCULADOS                    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === "customers" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Directorio y Clasificación de Clientes
              </h3>
              <p className="text-xs text-stone-500">
                Monitorea el estatus de tus clientes, su nivel alcanzado y el avance en su barra de
                recompensas.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Nivel Actual</th>
                    <th className="p-4">Gasto Acumulado ($ USD)</th>
                    <th className="p-4">Pedidos</th>
                    <th className="p-4">Progreso Siguiente Nivel</th>
                    <th className="p-4">Descuento Activo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400">
                        No hay clientes registrados en este filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-stone-900 block">{cust.name}</span>
                          <span className="text-[11px] text-stone-500">{cust.email}</span>
                          {cust.phone && (
                            <span className="text-[10px] text-stone-400 block">{cust.phone}</span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs">
                            <span>{cust.currentTier.badge}</span>
                            <span>{cust.currentTier.name}</span>
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="font-mono font-bold text-sm text-stone-900 block">
                            ${cust.spendUSD} USD
                          </span>
                          <span className="text-[10px] text-stone-400">Total compras</span>
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-stone-900 block">{cust.ordersCount}</span>
                          <span className="text-[10px] text-stone-400">compras</span>
                        </td>

                        <td className="p-4 w-48">
                          {cust.nextTier ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-stone-500">Hacia {cust.nextTier.name}</span>
                                <span className="font-bold text-rose-700">
                                  {cust.progressPercentage}%
                                </span>
                              </div>
                              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-rose-600 h-full rounded-full"
                                  style={{ width: `${cust.progressPercentage}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
                              <Crown className="w-3.5 h-3.5" />
                              Nivel Máximo VIP
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-emerald-700 block">
                            {cust.currentTier.discountPercentage}% OFF
                          </span>
                          <span className="text-[10px] text-stone-400">Permanente</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: CREAR / EDITAR NIVEL DE LEALTAD                                    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isNewTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
                  {editingTier ? "Editar Nivel" : "Nuevo Nivel"}
                </span>
                <h3 className="font-serif text-xl font-bold">
                  {editingTier ? `Configurar: ${editingTier.name}` : "Crear Nivel de Lealtad"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTierModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSaveTier}
              className="p-6 overflow-y-auto space-y-5 text-xs text-stone-700 flex-1"
            >
              {/* Live Preview of the Loyalty Card */}
              <div
                className="rounded-2xl p-5 text-white shadow-md relative overflow-hidden transition-all"
                style={{ background: getCardGradient(tierFormData) }}
              >
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{tierFormData.badge || "🌸"}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/90">
                        {siteSettings.businessName} • Vista Previa
                      </span>
                    </div>
                    <h4 className="font-serif text-2xl font-bold mt-1 text-white">
                      {tierFormData.name || "Nombre del Nivel"}
                    </h4>
                    <p className="text-xs text-white/80 max-w-sm mt-0.5">
                      {tierFormData.description || "Descripción del nivel y sus privilegios..."}
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 text-center">
                    <span className="text-base font-bold block leading-none">
                      {tierFormData.discountPercentage}%
                    </span>
                    <span className="text-[9px] uppercase tracking-wider">Descuento</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
                  <span>Requisito:</span>
                  <span className="font-mono font-bold">
                    {tierFormData.qualificationCriterion === "SPEND_USD" &&
                      `$${tierFormData.minSpendUSD} USD gastados`}
                    {tierFormData.qualificationCriterion === "ORDERS_COUNT" &&
                      `${tierFormData.minOrdersCount} pedidos`}
                    {tierFormData.qualificationCriterion === "BOTH" &&
                      `$${tierFormData.minSpendUSD} USD Y ${tierFormData.minOrdersCount} pedidos`}
                  </span>
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-stone-800">Nombre del Nivel *</label>
                  <input
                    type="text"
                    required
                    value={tierFormData.name}
                    onChange={(e) => setTierFormData({ ...tierFormData, name: e.target.value })}
                    placeholder="Ej. Rosa Pastel, Oro Imperial, Diamante..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-800">Emoticono / Badge</label>
                  <input
                    type="text"
                    value={tierFormData.badge}
                    onChange={(e) => setTierFormData({ ...tierFormData, badge: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-center text-base"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-stone-800">Descripción para el Cliente</label>
                <textarea
                  rows={2}
                  value={tierFormData.description}
                  onChange={(e) =>
                    setTierFormData({ ...tierFormData, description: e.target.value })
                  }
                  placeholder="Describe la exclusividad de este nivel para motivar a tus clientes a alcanzarlo..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Theme & Custom Gradient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-800">Tema Visual de la Tarjeta</label>
                  <select
                    value={tierFormData.cardTheme}
                    onChange={(e) =>
                      setTierFormData({
                        ...tierFormData,
                        cardTheme: e.target.value as LoyaltyCardTheme,
                      })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="rose_gold">Rosa Satinada (Rose Gold)</option>
                    <option value="silver_velvet">Plata Velvet (Silver)</option>
                    <option value="imperial_gold">Oro Imperial (Gold)</option>
                    <option value="black_diamond">Diamante Negro (Black Diamond)</option>
                    <option value="lavender_luxury">Lavanda Luxury (Purple)</option>
                    <option value="custom">Personalizado (Gradiente CSS)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-800">Descuento Permanente (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tierFormData.discountPercentage}
                    onChange={(e) =>
                      setTierFormData({
                        ...tierFormData,
                        discountPercentage: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              {tierFormData.cardTheme === "custom" && (
                <div className="space-y-1">
                  <label className="font-bold text-stone-800">
                    Código de Gradiente CSS Personalizado
                  </label>
                  <input
                    type="text"
                    value={tierFormData.customGradient}
                    onChange={(e) =>
                      setTierFormData({ ...tierFormData, customGradient: e.target.value })
                    }
                    placeholder="linear-gradient(135deg, #10b981 0%, #047857 100%)"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono text-[11px]"
                  />
                </div>
              )}

              {/* Qualification Rules */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <span className="font-bold text-stone-900 block text-xs">
                  Requisitos de Calificación para Subir de Nivel
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-stone-600 font-semibold">
                      Criterio Principal
                    </label>
                    <select
                      value={tierFormData.qualificationCriterion}
                      onChange={(e) =>
                        setTierFormData({
                          ...tierFormData,
                          qualificationCriterion: e.target.value as LoyaltyQualificationCriterion,
                        })
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                    >
                      <option value="SPEND_USD">Solo Gasto en USD ($)</option>
                      <option value="ORDERS_COUNT">Solo Número de Pedidos</option>
                      <option value="BOTH">Ambos Requisitos (USD Y Pedidos)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-stone-600 font-semibold">
                      Gasto Mínimo en USD ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={tierFormData.minSpendUSD}
                      onChange={(e) =>
                        setTierFormData({ ...tierFormData, minSpendUSD: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-stone-600 font-semibold">
                      Cantidad Mínima de Pedidos
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={tierFormData.minOrdersCount}
                      onChange={(e) =>
                        setTierFormData({ ...tierFormData, minOrdersCount: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Pre-configured Benefit Rules */}
              <div className="space-y-2">
                <span className="font-bold text-stone-900 block">
                  Reglas y Beneficios Especiales
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tierFormData.earlyAccessEvents}
                      onChange={(e) =>
                        setTierFormData({ ...tierFormData, earlyAccessEvents: e.target.checked })
                      }
                      className="rounded text-rose-700"
                    />
                    <span className="text-[11px] font-medium">Acceso anticipado a fechas pico</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tierFormData.exclusiveBouquetsCatalog}
                      onChange={(e) =>
                        setTierFormData({
                          ...tierFormData,
                          exclusiveBouquetsCatalog: e.target.checked,
                        })
                      }
                      className="rounded text-rose-700"
                    />
                    <span className="text-[11px] font-medium">Catálogo exclusivo VIP</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tierFormData.specialGiftIncluded}
                      onChange={(e) =>
                        setTierFormData({ ...tierFormData, specialGiftIncluded: e.target.checked })
                      }
                      className="rounded text-rose-700"
                    />
                    <span className="text-[11px] font-medium">Detalle especial / sorpresa</span>
                  </label>
                </div>
              </div>

              {/* Custom Benefits List */}
              <div className="space-y-2">
                <label className="font-bold text-stone-800 block">
                  Beneficios Personalizados Adicionales
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tierFormData.newBenefitInput}
                    onChange={(e) =>
                      setTierFormData({ ...tierFormData, newBenefitInput: e.target.value })
                    }
                    placeholder="Ej. Envío gratis local, tarjeta dedicatoria de lujo..."
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddBenefitToForm();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefitToForm}
                    className="px-4 py-2 bg-stone-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  {tierFormData.benefits.map((b, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-stone-50 rounded-lg border border-stone-200"
                    >
                      <span className="text-xs text-stone-700">{b}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefitFromForm(idx)}
                        className="text-stone-400 hover:text-rose-600 text-xs px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <div className="space-y-1 max-w-xs">
                  <label className="font-bold text-stone-800">
                    Orden de Jerarquía (1 = Básico, 4 = VIP)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tierFormData.orderIndex}
                    onChange={(e) =>
                      setTierFormData({ ...tierFormData, orderIndex: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="tier-active-switch"
                  checked={tierFormData.active}
                  onChange={(e) => setTierFormData({ ...tierFormData, active: e.target.checked })}
                  className="rounded text-rose-700"
                />
                <label
                  htmlFor="tier-active-switch"
                  className="font-bold text-stone-800 cursor-pointer"
                >
                  Nivel activo para los clientes del taller
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTierModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  {editingTier ? "Guardar Cambios" : "Crear Nivel de Lealtad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: EMITIR TARJETA DE REGALO EN USD                                    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isNewGiftCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6 flex flex-col">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
                  Cortesía Dueña
                </span>
                <h3 className="font-serif text-xl font-bold">Emitir Tarjeta de Regalo ($ USD)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewGiftCardModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateQuickGiftCard}
              className="p-6 space-y-4 text-xs text-stone-700"
            >
              <div className="space-y-2">
                <label className="font-bold text-stone-800 block">
                  Selecciona el monto del regalo ($ USD) *
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[5, 10, 15, 20, 25, 30].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNewGiftCardData({ ...newGiftCardData, amountUSD: amt })}
                      className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all border cursor-pointer ${
                        newGiftCardData.amountUSD === amt
                          ? "bg-rose-700 text-white border-rose-700 shadow-xs scale-105"
                          : "bg-stone-50 hover:bg-rose-50 text-stone-700 border-stone-200"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-stone-500">Monto seleccionado ($ USD):</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-stone-400 font-bold text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newGiftCardData.amountUSD}
                      onChange={(e) =>
                        setNewGiftCardData({
                          ...newGiftCardData,
                          amountUSD: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className="w-full pl-6 pr-3 py-1.5 border border-stone-300 rounded-xl text-sm font-bold text-emerald-700"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800">
                  Nombre del Beneficiario / Cliente
                </label>
                <input
                  type="text"
                  value={newGiftCardData.recipientName}
                  onChange={(e) =>
                    setNewGiftCardData({ ...newGiftCardData, recipientName: e.target.value })
                  }
                  placeholder="Ej. Sofía Garza"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800">
                  Correo del Beneficiario (Opcional)
                </label>
                <input
                  type="email"
                  value={newGiftCardData.recipientEmail}
                  onChange={(e) =>
                    setNewGiftCardData({ ...newGiftCardData, recipientEmail: e.target.value })
                  }
                  placeholder="sofia@gmail.com"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800">
                  Código Personalizado (Opcional - se genera automático si está vacío)
                </label>
                <input
                  type="text"
                  value={newGiftCardData.code}
                  onChange={(e) =>
                    setNewGiftCardData({ ...newGiftCardData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="LAZO-VIP-100"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800">Mensaje Dedicatorio</label>
                <textarea
                  rows={2}
                  value={newGiftCardData.personalMessage}
                  onChange={(e) =>
                    setNewGiftCardData({ ...newGiftCardData, personalMessage: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewGiftCardModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Emitir Tarjeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
