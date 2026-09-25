import React, { useState, useRef } from "react";
import { safeStorage as localStorage } from "../lib/safeStorage";
import {
  ShieldCheck,
  Package,
  DollarSign,
  Calendar,
  Sparkles,
  Image as ImageIcon,
  Settings,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Filter,
  X,
  ExternalLink,
  Database,
  Lock,
  ArrowUp,
  ArrowDown,
  Palette,
  Layers,
  Upload,
  RotateCcw,
  Sliders,
  Globe,
  FileText,
  Heart,
  MessageCircle,
  Send,
  User,
  TrendingUp,
  BarChart2,
  AlertTriangle,
  Power,
  Wrench,
  Gift,
  Copy,
  Share2,
  Volume2,
  VolumeX,
  BellRing,
  ChevronDown,
  Crown,
  CreditCard,
  Link as LinkIcon,
  Check,
  Search,
  Camera,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { RIBBON_COLOR_PALETTE, ALL_RIBBON_COLOR_NAMES } from "../data/ribbonColors";
import { FormattedChatMessage } from "../components/FormattedChatMessage";
import {
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  ProductVariant,
  ProductExtraOption,
  GuaranteeItem,
  ImportantDate,
  BlockedDate,
  GiftCard,
  GiftCardTheme,
  PaymentMethodConfig,
} from "../types";
import { filesToOptimizedImages, fileToOptimizedImage } from "../lib/imageUpload";
import { OrderStatusTracker } from "../components/OrderStatusTracker";
import { BusinessStatsDashboard } from "../components/BusinessStatsDashboard";
import { GiftCardPreview } from "../components/GiftCardPreview";
import { AdminLoyaltyRewardsView } from "../components/AdminLoyaltyRewardsView";
import { EnterprisePinModal } from "../components/EnterprisePinModal";
import { formatPhoneOnBlur } from "../utils/phoneFormatter";
import { AdminOrderDetailModal } from "../components/AdminOrderDetailModal";
import { OrderReceiptModal } from "../components/OrderReceiptModal";
import { matchesOrderQuery } from "../utils/orderIdGenerator";
import { GalleryUploadModal } from "../components/GalleryUploadModal";
import { OwnerUniversalSearch } from "../components/OwnerUniversalSearch";
import { ExtraGroupsManager } from "../components/ExtraGroupsManager";
import { StoryImageModal } from "../components/StoryImageModal";
import { AdminGiveawaysAndDiscountsView } from "../components/AdminGiveawaysAndDiscountsView";

export const AdminView: React.FC = () => {
  const {
    currentUser,
    orders,
    products,
    customRequests,
    giveaways,
    calendarDates,
    importantDates,
    blockedDates,
    addImportantDate,
    updateImportantDate,
    deleteImportantDate,
    addBlockedDate,
    deleteBlockedDate,
    gallery,
    siteSettings,
    homepageConfig,
    updateOrderStatus,
    verifyPaymentProof,
    verifyPayment,
    updateCustomRequestStatus,
    createProduct,
    updateProduct,
    deleteProduct,
    setDayCapacity,
    setDayBlocked,
    addGalleryItem,
    deleteGalleryItem,
    updateSiteSettings,
    updateHomepageConfig,
    enterOwnerMode,
    setActiveTab: setActiveRootTab,
    chatConversations,
    sendChatMessage,
    markChatAsRead,
    setIsChatOpen,
    saveAllNow,
    isSyncing,
    syncStatus,
    lastSavedTime,
    showToast,
    isMaintenanceActive,
    toggleMaintenanceMode,
    updateMaintenanceConfig,
    setPreviewAsVisitor,
    giftCards,
    createAdminGiftCard,
    updateGiftCardStatus,
    deleteGiftCard,
    adminOrderAlerts,
    testAdminOrderAlert,
    adminSoundEnabled,
    toggleAdminSound,
    adminSection: activeTab,
    setAdminSection: setActiveTab,
    categories,
    addCategory,
    renameCategory,
    deleteCategory,
    registeredUsers,
    getCustomerLoyaltyProgress,
  } = useApp();

  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<
    | "branding"
    | "payments"
    | "backgrounds"
    | "guarantees"
    | "layers"
    | "content"
    | "database"
    | "maintenance"
  >("branding");
  const [newGuarantee, setNewGuarantee] = useState({
    title: "",
    description: "",
    icon: "Sparkles",
  });

  // Story image state
  const [isStoryImageModalOpen, setIsStoryImageModalOpen] = useState(false);
  const [isProcessingStoryImage, setIsProcessingStoryImage] = useState(false);
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  // Gift card admin states
  const [giftCardSearch, setGiftCardSearch] = useState("");
  const [giftCardFilter, setGiftCardFilter] = useState<string>("ALL");
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [inspectingGiftCard, setInspectingGiftCard] = useState<GiftCard | null>(null);
  const [adminCardForm, setAdminCardForm] = useState({
    code: "",
    initialAmount: 15,
    themeDesign: "romantic_rose" as GiftCardTheme,
    recipientName: "",
    recipientEmail: "",
    recipientPhone: "",
    purchaserName: "Lazo Eterno (Cortesía)",
    personalMessage:
      "Un detalle eterno hecho a mano para ti, para que elijas tu ramo o caja sorpresa favorita.",
  });

  // Order filters & inspection
  const [orderFilter, setOrderFilter] = useState<string>("ALL");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Product modal
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [showProductTypeSelector, setShowProductTypeSelector] = useState(false);
  const [personalizedOnlySelector, setPersonalizedOnlySelector] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const handleStartCreateProduct = (
    type: "normal" | "especial",
    customItemType?: "ramo" | "peluche",
  ) => {
    setShowProductTypeSelector(false);
    const resolvedCustomItemType = type === "especial" ? customItemType || "ramo" : undefined;
    setEditingProduct({
      id: "prod-" + Date.now(),
      name:
        resolvedCustomItemType === "peluche"
          ? "Peluche Tejido a Mano Personalizado"
          : resolvedCustomItemType === "ramo"
            ? "Ramo de Listón Personalizado"
            : "",
      category:
        resolvedCustomItemType === "peluche"
          ? categories.includes("Peluches" as any)
            ? ("Peluches" as any)
            : categories[0]
          : categories[0],
      productType: type,
      customItemType: resolvedCustomItemType,
      price: resolvedCustomItemType === "peluche" ? 35 : type === "especial" ? 60 : 50,
      minPrepDays: type === "especial" ? 0 : 2,
      shortDescription:
        resolvedCustomItemType === "peluche"
          ? "Peluche tejido a crochet hecho a mano con estambre suave."
          : "",
      description: "",
      ribbonColors: resolvedCustomItemType === "peluche" ? [] : [...ALL_RIBBON_COLOR_NAMES],
      images: [
        resolvedCustomItemType === "peluche"
          ? "https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=800&q=80"
          : "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=800&q=80",
      ],
      tag:
        resolvedCustomItemType === "peluche"
          ? "Peluche Tejido"
          : type === "especial"
            ? "Ramo Especial"
            : "Nuevo",
      featured: false,
    });
    setIsNewProduct(true);
  };

  // Categorías
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExtraGroups, setShowExtraGroups] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameCategoryValue, setRenameCategoryValue] = useState("");

  const handleProductImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editingProduct) return;
    setIsUploadingImages(true);
    try {
      const images = await filesToOptimizedImages(files);
      setEditingProduct((prev) =>
        prev
          ? { ...prev, images: [...images, ...(prev.images || []).filter(Boolean)].slice(0, 8) }
          : prev,
      );
    } catch (e) {
      console.error("Error al procesar las fotos:", e);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const updateVariant = (id: string, updates: Partial<ProductVariant>) => {
    setEditingProduct((prev) =>
      prev
        ? {
            ...prev,
            variants: (prev.variants || []).map((v) => (v.id === id ? { ...v, ...updates } : v)),
          }
        : prev,
    );
  };

  const updateExtraOption = (
    extraId: string,
    optionId: string,
    updates: Partial<ProductExtraOption>,
  ) => {
    setEditingProduct((prev) =>
      prev
        ? {
            ...prev,
            extrasAvailable: (prev.extrasAvailable || []).map((x) =>
              x.id === extraId
                ? {
                    ...x,
                    options: (x.options || []).map((o) =>
                      o.id === optionId ? { ...o, ...updates } : o,
                    ),
                  }
                : x,
            ),
          }
        : prev,
    );
  };

  // Calendar modification & date upload states
  const [editDateString, setEditDateString] = useState(new Date().toISOString().split("T")[0]);
  const [newCapacity, setNewCapacity] = useState<number>(4);
  const [blockReason, setBlockReason] = useState<string>("Descanso del taller");
  const [blockReasonInput, setBlockReasonInput] = useState<string>("Descanso del taller");
  const [showAddDateModal, setShowAddDateModal] = useState<boolean>(false);
  const [newDateItem, setNewDateItem] = useState({
    date: new Date().toISOString().split("T")[0],
    title: "",
    subtitle: "Aparta con anticipación para asegurar tu ramo",
    badge: "Cupos Limitados",
    maxCapacity: 10,
    depositBonus: 0,
    active: true,
  });

  // Gallery modal
  const [newGalleryPhoto, setNewGalleryPhoto] = useState<{
    title: string;
    category: any;
    imageUrl: string;
    description: string;
  }>({ title: "", category: "Ramos", imageUrl: "", description: "" });
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Chat admin states
  const [selectedAdminChatId, setSelectedAdminChatId] = useState<string>(
    chatConversations[0]?.id || "conv-1",
  );
  const [adminChatInput, setAdminChatInput] = useState("");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Security barrier: only admin can view
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Panel de Control de la Dueña
        </h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          Gestiona pedidos de ramos eternos, comprobantes de pago, capacidad por fecha y chat con
          clientes con el código de seguridad.
        </p>
        <button
          onClick={() => setIsPinModalOpen(true)}
          className="px-6 py-3 bg-rose-700 hover:bg-rose-800 text-white rounded-full text-xs font-bold shadow-xs cursor-pointer transition-colors"
        >
          Ingresar Código de Seguridad
        </button>

        <EnterprisePinModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          onSuccess={enterOwnerMode}
        />
      </div>
    );
  }

  // Calculated Real KPIs
  const totalRevenue = orders.reduce((sum, o) => sum + o.amountPaid, 0);
  const totalOrdersCount = orders.length;
  const pendingProofCount = orders.filter(
    (o) =>
      o.paymentStatus === "VERIFICANDO" ||
      o.paymentStatus === "COMPROBANTE_EN_REVISION" ||
      o.status === "PAGO_PENDIENTE_VERIFICACION" ||
      (o.paymentProof && o.paymentProof.status === "PENDIENTE"),
  ).length;
  const pendingRequestsCount = customRequests.filter(
    (r) => r.status === "SOLICITUD_RECIBIDA",
  ).length;
  const activeOrdersInWorkshop = orders.filter(
    (o) => o.status === "EN_PRODUCCION" || o.status === "ANTICIPO_RECIBIDO",
  ).length;

  const filteredOrders = orders.filter((o) => {
    // 1. Status Filter
    if (orderFilter === "PENDIENTE_VERIFICACION") {
      const isPending =
        o.paymentStatus === "VERIFICANDO" ||
        o.paymentStatus === "COMPROBANTE_EN_REVISION" ||
        o.status === "PAGO_PENDIENTE_VERIFICACION" ||
        (o.paymentProof && o.paymentProof.status === "PENDIENTE");
      if (!isPending) return false;
    } else if (orderFilter === "PAGO_VERIFICADO") {
      const isApproved = o.paymentStatus === "CONFIRMADO" || o.status === "PAGO_VERIFICADO";
      if (!isApproved) return false;
    } else if (orderFilter !== "ALL") {
      if (o.status !== orderFilter) return false;
    }

    // 2. Search Query (ID, name, phone, email)
    if (orderSearchQuery.trim()) {
      const query = orderSearchQuery.trim().toLowerCase();
      const matchesId = matchesOrderQuery(o, query);
      const matchesCustomer =
        (o.customerName || "").toLowerCase().includes(query) ||
        (o.customerEmail || "").toLowerCase().includes(query) ||
        (o.customerPhone || "").includes(query);
      return matchesId || matchesCustomer;
    }

    return true;
  });

  // Save Product (Create or Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) return;

    if (isNewProduct) {
      createProduct({
        name: editingProduct.name,
        slug: editingProduct.slug || editingProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        category: (editingProduct.category as ProductCategory) || "Ramos de Listón",
        productType: editingProduct.productType || "normal",
        customItemType: editingProduct.customItemType,
        price: Number(editingProduct.price),
        minPrepDays:
          editingProduct.productType === "especial" ? 0 : Number(editingProduct.minPrepDays) || 2,
        shortDescription: editingProduct.shortDescription || "",
        description: editingProduct.description || "",
        images:
          editingProduct.images && editingProduct.images.length > 0
            ? editingProduct.images
            : [
                "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=800&q=80",
              ],
        available: true,
        ribbonColors: editingProduct.ribbonColors || [...ALL_RIBBON_COLOR_NAMES],
        tag: editingProduct.tag,
        featured: editingProduct.featured || false,
        sizes: editingProduct.sizes || [],
        extrasAvailable: editingProduct.extrasAvailable || [],
        extraGroupIds: editingProduct.extraGroupIds || [],
        variants: editingProduct.variants || [],
      });
    } else if (editingProduct.id) {
      updateProduct(editingProduct.id, {
        ...editingProduct,
        productType: editingProduct.productType || "normal",
        customItemType: editingProduct.customItemType,
        minPrepDays:
          editingProduct.productType === "especial" ? 0 : Number(editingProduct.minPrepDays) || 2,
      });
    }

    showToast({
      title: isNewProduct ? "¡Producto creado!" : "¡Producto actualizado!",
      subtitle: "Guardado y sincronizado en tiempo real con todos los dispositivos.",
    });

    // Instant save trigger
    setTimeout(() => {
      saveAllNow();
    }, 100);

    setEditingProduct(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Top Header */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              Panel Administrativo
            </span>
            <span className="text-xs text-stone-400">Modo Taller Activo</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1">
            Gestión Central — {siteSettings.businessName}
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Bienvenida Monse. Administra tus pedidos de ramos eternos, cupos por día y
            cotizaciones a medida.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Real-time Toast Audio Chime Switch */}
          <button
            id="btn-admin-sound-toggle"
            type="button"
            onClick={toggleAdminSound}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${
              adminSoundEnabled
                ? "bg-rose-950/80 hover:bg-rose-900 border-rose-500/40 text-rose-200"
                : "bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-400"
            }`}
            title={
              adminSoundEnabled
                ? "Sonido de alertas activado: Clic para silenciar"
                : "Sonido silenciado: Clic para activar timbre"
            }
          >
            {adminSoundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-stone-400" />
            )}
            <span>{adminSoundEnabled ? "Timbre Activado" : "Timbre Silenciado"}</span>
          </button>

          {/* Test Live Toast Alert */}
          <button
            id="btn-admin-test-alert"
            type="button"
            onClick={testAdminOrderAlert}
            className="px-3 py-2 bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-600 hover:to-amber-600 border border-rose-500/30 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95"
            title="Simular la llegada de una nueva reserva o compra en tiempo real para ver el Toast"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-200 animate-bounce" />
            <span>Probar Alerta en Vivo</span>
          </button>

          <button
            onClick={() => setActiveRootTab("inicio")}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-xs font-semibold text-stone-300 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Ver Tienda</span>
          </button>
        </div>
      </div>

      {/* Quick Maintenance Mode Switch Card */}
      <div
        id="card-maintenance-quick-toggle"
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          isMaintenanceActive
            ? "bg-amber-500/10 border-amber-500/40 shadow-xs"
            : "bg-white border-stone-200 shadow-xs"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                isMaintenanceActive
                  ? "bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/30"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {isMaintenanceActive ? (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              ) : (
                <Globe className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif text-base font-bold text-stone-900">
                  Modo Mantenimiento de la Tienda
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
                    isMaintenanceActive
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isMaintenanceActive ? "bg-amber-600 animate-ping" : "bg-emerald-500"
                    }`}
                  />
                  {isMaintenanceActive
                    ? "ACTIVADO (Sitio Oculto al Público)"
                    : "DESACTIVADO (Sitio Abierto al Público)"}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 max-w-xl leading-relaxed">
                {isMaintenanceActive
                  ? "⚠️ Los visitantes ven la pantalla de aviso temporal mientras editas productos, precios o cupos. Tú puedes seguir navegando y previsualizando normalmente."
                  : "✅ Tu tienda está abierta y visible para todo el público. Los clientes pueden comprar, ver ramos y agendar en el calendario."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
            {isMaintenanceActive && (
              <button
                id="btn-admin-preview-maintenance"
                type="button"
                onClick={() => setPreviewAsVisitor(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Ver la pantalla tal como la ven tus visitantes"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Ver como</span> Visitante
              </button>
            )}

            <button
              id="btn-admin-config-maintenance"
              type="button"
              onClick={() => {
                setActiveTab("settings");
                setSettingsSubTab("maintenance");
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Personalizar títulos, mensaje y tiempo estimado del aviso"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Ajustar Textos</span>
            </button>

            {/* Switch Toggle Button */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <span className="text-xs font-bold text-stone-700 hidden lg:inline">
                {isMaintenanceActive ? "Cerrada" : "Abierta"}
              </span>
              <button
                id="btn-toggle-maintenance-mode"
                type="button"
                role="switch"
                aria-checked={isMaintenanceActive}
                onClick={() => toggleMaintenanceMode()}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isMaintenanceActive ? "bg-amber-600" : "bg-stone-300"
                }`}
                title={
                  isMaintenanceActive
                    ? "Desactivar modo mantenimiento (Abrir tienda)"
                    : "Activar modo mantenimiento (Ocultar tienda)"
                }
              >
                <span className="sr-only">Habilitar modo mantenimiento</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                    isMaintenanceActive ? "translate-x-7" : "translate-x-0"
                  }`}
                >
                  <Power
                    className={`w-3.5 h-3.5 ${isMaintenanceActive ? "text-amber-700" : "text-stone-400"}`}
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Universal Search for Owner Panel */}
      <div className="w-full">
        <OwnerUniversalSearch
          orders={orders}
          products={products}
          registeredUsers={registeredUsers}
          giftCards={giftCards}
          siteSettings={siteSettings}
          onSelectOrder={(order) => setInspectingOrder(order)}
          onOpenReceipt={(order) => setSelectedReceiptOrder(order)}
          onNavigateToTab={(tabId) => setActiveTab(tabId as any)}
        />
      </div>

      {/* Space-Saving Admin Section Navigation: Left Status + Right Dropdown Menu */}
      {(() => {
        const adminNavSections = [
          {
            id: "stats",
            label: "Estadísticas del Negocio",
            icon: <TrendingUp className="w-4 h-4" />,
          },
          {
            id: "orders",
            label: "Pedidos en Proceso",
            icon: <Package className="w-4 h-4" />,
            count: orders.length,
            badgeCount: pendingProofCount,
            badgeColor: "bg-rose-600",
          },
          {
            id: "requests",
            label: "Cotizaciones Personalizadas",
            icon: <Sparkles className="w-4 h-4" />,
            count: customRequests.length,
            badgeCount: pendingRequestsCount,
            badgeColor: "bg-purple-600",
          },
          {
            id: "chats",
            label: "Mensajes & Chat",
            icon: <MessageCircle className="w-4 h-4" />,
            count: chatConversations.length,
            badgeCount: chatConversations.reduce((sum, c) => sum + (c.unreadByAdmin || 0), 0),
            badgeColor: "bg-rose-600",
          },
          {
            id: "loyalty",
            label: "Lealtad y Recompensas",
            icon: <Crown className="w-4 h-4 text-amber-500" />,
            tag: "Club VIP",
          },
          {
            id: "products",
            label: "Catálogo de Ramos",
            icon: <Package className="w-4 h-4" />,
            count: products.filter((p) => !p.deletedAt).length,
          },
          {
            id: "calendar",
            label: "Capacidad Diaria & Fechas",
            icon: <Calendar className="w-4 h-4" />,
          },
          {
            id: "gallery",
            label: "Fotos de Entregas",
            icon: <ImageIcon className="w-4 h-4" />,
            count: gallery.length,
          },
          {
            id: "giftcards",
            label: "Tarjetas de Regalo ($ USD)",
            icon: <Gift className="w-4 h-4 text-rose-600" />,
            count: giftCards.length,
          },
          {
            id: "giveaways",
            label: "🎁 Sorteos y Descuentos",
            icon: <Sparkles className="w-4 h-4 text-rose-600" />,
            count: giveaways?.length || 0,
            tag: "Sorteos",
          },
          {
            id: "settings",
            label: "Ajustes & Base de Datos",
            icon: <Settings className="w-4 h-4" />,
          },
        ];
        const currentSection =
          adminNavSections.find((s) => s.id === activeTab) || adminNavSections[0];

        return (
          <div className="bg-white rounded-3xl px-4 sm:px-6 py-3.5 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3 relative z-30">
            {/* Left: Active Section Indicator */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100/80 shadow-2xs shrink-0">
                {currentSection.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">
                    Sección del Panel
                  </span>
                  {currentSection.tag && (
                    <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-200">
                      {currentSection.tag}
                    </span>
                  )}
                  {currentSection.count !== undefined && (
                    <span className="text-[11px] text-stone-400 font-medium">
                      ({currentSection.count})
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 leading-tight">
                  {currentSection.label}
                </h2>
              </div>
            </div>

            {/* Right: Dropdown Menu Trigger & Options */}
            <div className="relative ml-auto">
              <button
                id="admin-nav-dropdown-btn"
                type="button"
                onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-semibold cursor-pointer shadow-xs transition-all"
                aria-expanded={isNavDropdownOpen}
              >
                <span className="text-stone-300 hidden sm:inline">Módulo:</span>
                <span className="font-bold text-white max-w-[140px] sm:max-w-[200px] truncate">
                  {currentSection.label}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-rose-300 transition-transform duration-200 ${isNavDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Floating Dropdown Menu on the Right Side */}
              {isNavDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNavDropdownOpen(false)} />
                  <div
                    id="admin-nav-dropdown-menu"
                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-3xl border border-stone-200 shadow-2xl p-2 z-50 space-y-1 origin-top-right animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] overflow-y-auto"
                  >
                    <div className="px-3.5 py-2 border-b border-stone-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      <span>Seleccionar Módulo del Panel</span>
                      <span className="text-[9px] lowercase font-normal">10 módulos</span>
                    </div>

                    {adminNavSections.map((section) => {
                      const isActive = activeTab === section.id;
                      return (
                        <button
                          key={section.id}
                          id={`admin-tab-${section.id}`}
                          type="button"
                          onClick={() => {
                            setActiveTab(section.id as any);
                            setIsNavDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-left cursor-pointer transition-colors ${
                            isActive
                              ? "bg-rose-50 text-rose-900 font-bold border border-rose-200/60 shadow-2xs"
                              : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate mr-2">
                            <span className={isActive ? "text-rose-700" : "text-stone-400"}>
                              {section.icon}
                            </span>
                            <span className="truncate">{section.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {section.badgeCount !== undefined && section.badgeCount > 0 && (
                              <span
                                className={`w-5 h-5 rounded-full ${section.badgeColor || "bg-rose-600"} text-white text-[10px] flex items-center justify-center font-bold`}
                              >
                                {section.badgeCount}
                              </span>
                            )}
                            {section.tag && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800">
                                {section.tag}
                              </span>
                            )}
                            {section.count !== undefined && !section.badgeCount && (
                              <span className="text-[10px] text-stone-400 font-normal">
                                ({section.count})
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* 1. TAB: Estadísticas del Negocio */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <BusinessStatsDashboard />
        </div>
      )}

      {/* 2. TAB: Orders Management */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {/* Order status filters and Search Bar */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { id: "ALL", label: "Todos" },
                  {
                    id: "PENDIENTE_VERIFICACION",
                    label: `⏳ Por Verificar Pago ${pendingProofCount > 0 ? `(${pendingProofCount})` : ""}`,
                  },
                  { id: "PAGO_VERIFICADO", label: "✓ Pagos Aprobados (Lealtad)" },
                  { id: "ESPERANDO_PAGO", label: "Esperando Pago" },
                  { id: "EN_PRODUCCION", label: "En Taller" },
                  { id: "LISTO_PARA_ENTREGA", label: "Listo Entrega" },
                  { id: "ENTREGADO", label: "Entregados" },
                  { id: "CANCELADO", label: "Cancelados" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setOrderFilter(st.id)}
                    className={`px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                      orderFilter === st.id
                        ? "bg-rose-700 text-white font-semibold shadow-xs"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Order ID Search bar */}
              <div className="relative min-w-[260px] sm:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Buscar ID (ej. HPM-2026-000001, 000001), cliente..."
                  className="w-full pl-9 pr-8 py-1.5 bg-white border border-stone-300 rounded-2xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs"
                />
                {orderSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setOrderSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded-full cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
              <span>
                Mostrando <strong>{filteredOrders.length}</strong> de {orders.length} pedidos
                registrados
              </span>
              {orderSearchQuery && (
                <span className="text-rose-700 font-medium">
                  Filtrado por búsqueda: "{orderSearchQuery}"
                </span>
              )}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Orden / Cliente</th>
                    <th className="p-4">Entrega</th>
                    <th className="p-4">Total / Anticipo</th>
                    <th className="p-4">Comprobante y Estado de Pago</th>
                    <th className="p-4">Etapa Pedido</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400">
                        No hay pedidos en este estado.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const proofUrl = order.paymentProof?.fileUrl || order.paymentProofUrl;
                      const isApproved =
                        order.paymentStatus === "CONFIRMADO" || order.status === "PAGO_VERIFICADO";
                      const isPendingReview =
                        order.paymentStatus === "VERIFICANDO" ||
                        order.status === "PAGO_PENDIENTE_VERIFICACION" ||
                        order.paymentStatus === "COMPROBANTE_EN_REVISION" ||
                        (order.paymentProof && order.paymentProof.status === "PENDIENTE") ||
                        (Boolean(proofUrl) && !isApproved && order.paymentStatus !== "RECHAZADO");

                      return (
                        <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="p-4">
                            <span className="font-serif font-bold text-stone-900 block">
                              #{order.orderNumber}
                            </span>
                            <span className="text-stone-600">{order.customerName}</span>
                            <span className="text-[10px] text-stone-400 block">
                              {order.customerPhone}
                            </span>
                          </td>

                          <td className="p-4">
                            {order.isDirectQuote ||
                            order.items?.some((i) => (i as any).productType === "especial") ||
                            order.scheduledDate === "A convenir" ||
                            order.scheduledDate === "Cotización Directa" ||
                            !order.scheduledDate ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Cotización Directa</span>
                              </span>
                            ) : (
                              <>
                                <span className="font-semibold block">{order.scheduledDate}</span>
                                <span className="text-[10px] text-stone-500">
                                  {order.scheduledTimeSlot}
                                </span>
                              </>
                            )}
                          </td>

                          <td className="p-4">
                            <span className="font-bold text-stone-900 block">
                              ${order.totalPrice}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold block">
                              Pagado: ${order.amountPaid}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              Anticipo req.: ${order.requiredDeposit}
                            </span>
                          </td>

                          <td className="p-4">
                            {isApproved ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Pago Aprobado (Válido Lealtad)</span>
                                </span>
                                {proofUrl && (
                                  <button
                                    onClick={() => setInspectingOrder(order)}
                                    className="text-[10px] text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-2.5 h-2.5" />
                                    <span>Ver Comprobante</span>
                                  </button>
                                )}
                              </div>
                            ) : isPendingReview ? (
                              <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold animate-pulse border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Por Verificar (No suma a Lealtad)</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setInspectingOrder(order)}
                                    className="px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-900 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-2.5 h-2.5" />
                                    <span>Revisar</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      verifyPayment(order.id, true, order.requiredDeposit)
                                    }
                                    className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                                    title="Aprobar pago manualmente y sumar al programa de lealtad"
                                  >
                                    ✓ Aprobar
                                  </button>
                                </div>
                              </div>
                            ) : order.paymentStatus === "RECHAZADO" ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                  ✕ Pago Rechazado
                                </span>
                                {proofUrl && (
                                  <button
                                    onClick={() => setInspectingOrder(order)}
                                    className="text-[10px] text-rose-700 hover:underline flex items-center gap-1 cursor-pointer block"
                                  >
                                    Ver motivo o comprobante
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-stone-400">Sin comprobante</span>
                            )}
                          </td>

                          <td className="p-4">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                updateOrderStatus(order.id, e.target.value as OrderStatus)
                              }
                              className="text-xs px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white font-medium focus:ring-1 focus:ring-rose-500"
                            >
                              <option value="ESPERANDO_PAGO">Esperando Pago</option>
                              <option value="PAGO_PENDIENTE_VERIFICACION">
                                Pendiente de Verificación
                              </option>
                              <option value="PAGO_VERIFICADO">Pago Aprobado (Taller)</option>
                              <option value="ANTICIPO_RECIBIDO">Anticipo Recibido</option>
                              <option value="EN_PRODUCCION">En Producción (Taller)</option>
                              <option value="LISTO_PARA_ENTREGA">Listo para Entrega</option>
                              <option value="ENTREGADO">Entregado</option>
                              <option value="CANCELADO">Cancelado</option>
                            </select>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptOrder(order)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="Ver e imprimir recibo oficial del pedido"
                              >
                                <FileText className="w-3.5 h-3.5 text-rose-600" />
                                <span>Recibo</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setInspectingOrder(order)}
                                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                              >
                                Gestionar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: Custom Requests */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {customRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-rose-700 block">
                      Seguimiento: {req.trackingNumber}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      {req.projectTitle}
                    </h3>
                    <span className="text-xs text-stone-500">
                      Cliente: {req.customerName} ({req.customerPhone || req.customerEmail})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={req.status}
                      onChange={(e) =>
                        updateCustomRequestStatus(
                          req.id,
                          e.target.value as OrderStatus,
                          req.quotedPrice,
                        )
                      }
                      className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold"
                    >
                      <option value="SOLICITUD_RECIBIDA">Solicitud Recibida</option>
                      <option value="EN_REVISION">En Revisión</option>
                      <option value="PRECIO_ENVIADO">Cotizada / Precio Enviado</option>
                      <option value="ESPERANDO_PAGO">Esperando Anticipo</option>
                      <option value="ANTICIPO_RECIBIDO">Anticipo Recibido</option>
                      <option value="EN_PRODUCCION">En Confección</option>
                      <option value="LISTO">Listo para Entrega</option>
                      <option value="ENTREGADO">Entregado</option>
                      <option value="CANCELADO">Cancelada</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-2xl">
                  {req.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px]">Colores</span>
                    <span className="font-semibold">{req.desiredColors}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">Fecha Deseada</span>
                    <span className="font-semibold">{req.desiredDate}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">Presupuesto Estimado</span>
                    <span className="font-semibold">
                      {req.approximateBudget ? `$${req.approximateBudget}` : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">Cotización Monse</span>
                    <input
                      type="number"
                      placeholder="Precio $"
                      defaultValue={req.quotedPrice || ""}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          updateCustomRequestStatus(req.id, "PRECIO_ENVIADO", val);
                        }
                      }}
                      className="w-24 px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Photos */}
                {req.files && req.files.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                      Fotos de Inspiración Enviadas ({req.files.length})
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {req.files.map((f) => (
                        <a
                          key={f.id}
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 block w-20 h-20 rounded-xl bg-stone-50 border border-stone-200 p-1 flex items-center justify-center hover:opacity-90"
                        >
                          <img
                            src={f.url}
                            alt={f.name}
                            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB: Internal Customer Chat System */}
      {activeTab === "chats" && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col md:flex-row">
          {/* Left Column: Conversations List */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-stone-200 flex flex-col bg-stone-50/50">
            <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Bandeja de Mensajes
                </h3>
                <p className="text-[11px] text-stone-500">Chats directos de clientas del taller</p>
              </div>
              <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                {chatConversations.length}
              </span>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-stone-100">
              {chatConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400">
                  No hay conversaciones activas.
                </div>
              ) : (
                chatConversations.map((convo) => {
                  const isSelected = convo.id === selectedAdminChatId;
                  const lastMsg = convo.messages[convo.messages.length - 1];
                  const unreadCount = convo.unreadByAdmin || 0;

                  return (
                    <button
                      key={convo.id}
                      onClick={() => {
                        setSelectedAdminChatId(convo.id);
                        markChatAsRead(convo.id);
                      }}
                      className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-rose-50/80 border-l-4 border-rose-700"
                          : "hover:bg-stone-100/70"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={`text-xs font-semibold truncate ${isSelected ? "text-rose-950 font-bold" : "text-stone-800"}`}
                          >
                            {convo.customerName}
                          </span>
                          {lastMsg && (
                            <span className="text-[10px] text-stone-400 shrink-0">
                              {lastMsg.timestamp}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 truncate mb-1">
                          {lastMsg ? lastMsg.text : "Sin mensajes aún"}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {convo.relatedOrderNumber && (
                            <span className="text-[10px] bg-white border border-stone-200 text-stone-600 px-1.5 py-0.2 rounded font-medium">
                              #{convo.relatedOrderNumber}
                            </span>
                          )}
                          {convo.customerPhone && (
                            <span className="text-[10px] text-stone-400">
                              {convo.customerPhone}
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <span className="ml-auto bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {unreadCount} nuevo{unreadCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation View */}
          {(() => {
            const activeConvo =
              chatConversations.find((c) => c.id === selectedAdminChatId) || chatConversations[0];

            if (!activeConvo) {
              return (
                <div className="flex-1 flex items-center justify-center p-8 text-stone-400 text-xs">
                  Selecciona una conversación para leer y responder.
                </div>
              );
            }

            const handleAdminSend = (e?: React.FormEvent) => {
              if (e) e.preventDefault();
              if (!adminChatInput.trim()) return;
              sendChatMessage(activeConvo.id, adminChatInput.trim());
              setAdminChatInput("");
            };

            const handleQuickAdminReply = (reply: string) => {
              sendChatMessage(activeConvo.id, reply);
            };

            return (
              <div className="flex-1 flex flex-col bg-white">
                {/* Header */}
                <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-900 text-sm">
                        {activeConvo.customerName}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        {activeConvo.customerPhone && <span>{activeConvo.customerPhone}</span>}
                        {activeConvo.relatedOrderNumber && (
                          <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-200">
                            Orden #{activeConvo.relatedOrderNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => markChatAsRead(activeConvo.id)}
                      className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                    >
                      Marcar Leído
                    </button>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/40">
                  {activeConvo.messages.map((msg) => {
                    const isFromAdmin = msg.senderRole === "admin";

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isFromAdmin ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-2xs leading-relaxed ${
                            isFromAdmin
                              ? "bg-rose-700 text-white rounded-br-2xs"
                              : "bg-white border border-stone-200 text-stone-800 rounded-bl-2xs"
                          }`}
                        >
                          <FormattedChatMessage text={msg.text} fontStyle={msg.fontStyle} />
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isFromAdmin ? "text-rose-200" : "text-stone-400"
                            }`}
                          >
                            <span>{msg.timestamp}</span>
                            {isFromAdmin && <span>✓✓</span>}
                          </div>
                        </div>
                        <span className="text-[10px] text-stone-400 mt-0.5 px-1">
                          {msg.senderName}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Input box */}
                <form
                  onSubmit={handleAdminSend}
                  className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={adminChatInput}
                    onChange={(e) => setAdminChatInput(e.target.value)}
                    placeholder={`Responder como Monse a ${activeConvo.customerName}...`}
                    className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-600 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!adminChatInput.trim()}
                    className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:bg-stone-300 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </form>
              </div>
            );
          })()}
        </div>
      )}

      {/* 5. TAB: Products CRUD */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Catálogo de Ramos y Cajas ({products.filter((p) => !p.deletedAt).length})
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  Sincronizado
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Cualquier producto que agregues, edites o desactives se actualiza en tiempo real en
                todos los dispositivos.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              {products.some((p) => !p.deletedAt) && (
                <button
                  onClick={() => {
                    if (
                      !window.confirm(
                        "¿Eliminar TODOS los productos del catálogo? Esta acción se sincroniza en tiempo real.",
                      )
                    )
                      return;
                    products.filter((p) => !p.deletedAt).forEach((p) => deleteProduct(p.id));
                    showToast?.({ title: "Catálogo vaciado" });
                  }}
                  className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Vaciar Catálogo</span>
                </button>
              )}
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Layers className="w-4 h-4" />
                <span>Categorías</span>
              </button>
              <button
                id="btn-admin-add-custom-product"
                onClick={() => {
                  setPersonalizedOnlySelector(true);
                  setShowProductTypeSelector(true);
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-600 via-rose-700 to-rose-800 hover:from-amber-700 hover:to-rose-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>+ Crear Producto Personalizado</span>
              </button>
              <button
                id="btn-admin-add-product"
                onClick={() => {
                  setPersonalizedOnlySelector(false);
                  setShowProductTypeSelector(true);
                }}
                className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Producto</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products
              .filter((p) => !p.deletedAt)
              .map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex gap-3"
                >
                  <div className="w-20 h-24 rounded-xl bg-stone-50 border border-stone-200 shrink-0 p-1 flex items-center justify-center">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-rose-700 uppercase">
                          {product.category}
                        </span>
                        {product.productType === "especial" ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                            ✨ Especial
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            Normal
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif font-bold text-xs text-stone-900 truncate mt-0.5">
                        {product.name}
                      </h4>
                      <span className="text-xs font-bold text-stone-900 block mt-1">
                        ${product.price}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {product.productType === "especial"
                          ? "Sin días mín. (Chat)"
                          : `${product.minPrepDays} días mín.`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setIsNewProduct(false);
                        }}
                        className="text-stone-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar el producto "${product.name}"?`)) {
                            deleteProduct(product.id);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 5. TAB: Calendar & Dates Manager */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Fechas Especiales & Capacidad del Taller
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  Sincronizado
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Sube fechas especiales de alta demanda, programa descansos y define los cupos
                diarios que se sincronizan con todos los visitantes.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                id="btn-admin-add-date"
                onClick={() => setShowAddDateModal(true)}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Subir Fecha Especial</span>
              </button>
            </div>
          </div>

          {/* Modal / Form: Subir Fecha Especial */}
          {showAddDateModal && (
            <div className="bg-white rounded-3xl p-6 border-2 border-rose-200 shadow-md space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <h4 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <span>Subir Nueva Fecha Especial (Temporada Alta / Campaña)</span>
                </h4>
                <button
                  onClick={() => setShowAddDateModal(false)}
                  className="text-stone-400 hover:text-stone-700 text-xs font-bold"
                >
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">
                    Fecha del Evento
                  </label>
                  <input
                    type="date"
                    value={newDateItem.date}
                    onChange={(e) => setNewDateItem({ ...newDateItem, date: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700">
                    Título de la Fecha Especial
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Día de las Madres, 14 de Febrero, Graduaciones"
                    value={newDateItem.title}
                    onChange={(e) => setNewDateItem({ ...newDateItem, title: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700">
                    Etiqueta / Badge
                  </label>
                  <select
                    value={newDateItem.badge}
                    onChange={(e) => setNewDateItem({ ...newDateItem, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-600 outline-none"
                  >
                    <option value="Alta Demanda">Alta Demanda</option>
                    <option value="Cupos Limitados">Cupos Limitados</option>
                    <option value="Temporada Especial">Temporada Especial</option>
                    <option value="Descuento Anticipado">Descuento Anticipado</option>
                    <option value="Cierre de Pedidos">Cierre de Pedidos</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1 text-stone-700">
                    Subtítulo / Recomendación para el Cliente
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Recomendamos apartar con 5 a 7 días de anticipación para garantizar confección."
                    value={newDateItem.subtitle}
                    onChange={(e) => setNewDateItem({ ...newDateItem, subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700">
                    Capacidad Máxima de Ramos ese Día
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newDateItem.maxCapacity}
                    onChange={(e) =>
                      setNewDateItem({ ...newDateItem, maxCapacity: parseInt(e.target.value) || 8 })
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddDateModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!newDateItem.title.trim() || !newDateItem.date) {
                      showToast({
                        title: "Completa los campos",
                        subtitle: "Ingresa al menos el título y la fecha.",
                      });
                      return;
                    }
                    addImportantDate({
                      date: newDateItem.date,
                      title: newDateItem.title.trim(),
                      subtitle: newDateItem.subtitle.trim(),
                      badge: newDateItem.badge,
                      maxCapacity: newDateItem.maxCapacity,
                      active: true,
                    });
                    showToast({
                      title: "¡Fecha especial subida!",
                      subtitle: `La fecha "${newDateItem.title}" ya es visible en la portada y el calendario.`,
                    });
                    setShowAddDateModal(false);
                    setNewDateItem({
                      date: new Date().toISOString().split("T")[0],
                      title: "",
                      subtitle: "Aparta con anticipación para asegurar tu ramo",
                      badge: "Cupos Limitados",
                      maxCapacity: 10,
                      depositBonus: 0,
                      active: true,
                    });
                    setTimeout(() => saveAllNow(), 100);
                  }}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publicar Fecha en la Web</span>
                </button>
              </div>
            </div>
          )}

          {/* List: Fechas Especiales Subidas */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-serif text-lg font-bold text-stone-900">
                  Fechas Especiales Activas ({importantDates.length})
                </h4>
                <p className="text-xs text-stone-500">
                  Estas fechas se destacan en la portada y avisan a los clientes sobre fechas de
                  alta demanda.
                </p>
              </div>
            </div>

            {importantDates.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-xs text-stone-500 space-y-2">
                <Calendar className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="font-semibold text-stone-700">
                  No hay fechas especiales configuradas aún.
                </p>
                <p className="text-stone-400">
                  Haz clic en "Subir Fecha Especial" para programar el 14 de Febrero, Día de las
                  Madres o Aniversarios.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {importantDates.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2 relative"
                  >
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                        {item.badge || "Fecha Especial"}
                      </span>
                      <button
                        onClick={() => {
                          deleteImportantDate(item.id);
                          showToast({
                            title: "Fecha eliminada",
                            subtitle: `Se eliminó "${item.title}".`,
                          });
                          setTimeout(() => saveAllNow(), 100);
                        }}
                        className="text-stone-400 hover:text-rose-700 p-1"
                        title="Eliminar fecha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h5 className="font-bold text-sm text-stone-900">{item.title}</h5>
                    <p className="text-xs text-rose-700 font-semibold font-mono">📅 {item.date}</p>
                    {item.subtitle && (
                      <p className="text-xs text-stone-500 line-clamp-2">{item.subtitle}</p>
                    )}

                    <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-[11px] text-stone-600">
                      <span>
                        Cupos máx: <strong>{item.maxCapacity || 8} pedidos</strong>
                      </span>
                      <span className="text-emerald-700 font-semibold">● Visible en web</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Two-column layout: Bloquear Fechas & Ajuste de Capacidad */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bloqueador de Fechas / Días Inhábiles */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 space-y-4 shadow-xs">
              <h4 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-stone-700" />
                <span>Bloquear Fecha (Descanso o Sin Cupo)</span>
              </h4>
              <p className="text-xs text-stone-500">
                Bloquea días específicos para que ningún cliente pueda agendar entregas en esa
                fecha.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">
                    Fecha a Bloquear
                  </label>
                  <input
                    type="date"
                    value={editDateString}
                    onChange={(e) => setEditDateString(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700">
                    Motivo del Bloqueo
                  </label>
                  <input
                    type="text"
                    value={blockReasonInput}
                    onChange={(e) => setBlockReasonInput(e.target.value)}
                    placeholder="Ej. Descanso semanal del taller, Vacaciones, Cupo al 100%"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-600"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setDayBlocked(editDateString, true, blockReasonInput);
                      showToast({
                        title: "¡Fecha Bloqueada!",
                        subtitle: `El día ${editDateString} ha sido bloqueado: ${blockReasonInput}.`,
                      });
                      setTimeout(() => saveAllNow(), 100);
                    }}
                    className="px-4 py-2 bg-stone-900 hover:bg-black text-white font-bold rounded-xl cursor-pointer"
                  >
                    Bloquear Esta Fecha
                  </button>

                  <button
                    onClick={() => {
                      setDayBlocked(editDateString, false);
                      showToast({
                        title: "Fecha Desbloqueada",
                        subtitle: `El día ${editDateString} ahora vuelve a admitir pedidos.`,
                      });
                      setTimeout(() => saveAllNow(), 100);
                    }}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl cursor-pointer"
                  >
                    Desbloquear
                  </button>
                </div>

                {/* Blocked dates list */}
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <span className="font-semibold text-stone-700 text-xs block">
                    Fechas Actualmente Bloqueadas ({blockedDates.length}):
                  </span>
                  {blockedDates.length === 0 ? (
                    <p className="text-stone-400 text-xs italic">
                      No hay fechas bloqueadas actualmente.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {blockedDates.map((b) => (
                        <div
                          key={b.id}
                          className="flex justify-between items-center p-2 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                        >
                          <div>
                            <span className="font-bold text-stone-800">{b.startDate}</span>
                            <span className="text-stone-500 ml-2">({b.notes || b.reason})</span>
                          </div>
                          <button
                            onClick={() => {
                              deleteBlockedDate(b.id);
                              showToast({
                                title: "Fecha liberada",
                                subtitle: `La fecha ${b.startDate} está desbloqueada.`,
                              });
                              setTimeout(() => saveAllNow(), 100);
                            }}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-bold"
                          >
                            Quitar Bloqueo
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ajuste de Capacidad Diaria */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 space-y-4 shadow-xs">
              <h4 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-700" />
                <span>Ajustar Capacidad de un Día Específico</span>
              </h4>
              <p className="text-xs text-stone-500">
                Ajusta el límite máximo de ramos o pedidos que puedes confeccionar en una fecha
                particular.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">Fecha</label>
                  <input
                    type="date"
                    value={editDateString}
                    onChange={(e) => setEditDateString(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700">
                    Capacidad Máxima de Pedidos
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-600"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Capacidad predeterminada del taller: {siteSettings.defaultDailyCapacity} pedidos
                    diarios.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setDayCapacity(editDateString, newCapacity);
                      showToast({
                        title: "Capacidad Guardada",
                        subtitle: `Capacidad para el día ${editDateString} establecida en ${newCapacity} pedidos.`,
                      });
                      setTimeout(() => saveAllNow(), 100);
                    }}
                    className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                  >
                    Guardar Capacidad de Este Día
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB: Gallery Manager */}
      {activeTab === "gallery" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Fotos del Portafolio ({gallery.length})
            </h3>
            <button
              onClick={() => setShowGalleryModal(true)}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Foto</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 aspect-square group flex items-center justify-center p-2"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 text-white flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-rose-300">{item.category}</span>
                  <p className="text-xs font-bold line-clamp-2">{item.title}</p>
                  <button
                    onClick={() => deleteGalleryItem(item.id)}
                    className="p-1.5 bg-rose-700 hover:bg-rose-800 rounded-lg text-white self-end"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. TAB: Digital Gift Cards Management */}
      {activeTab === "giftcards" && (
        <div className="space-y-6">
          {/* Header & Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Tarjetas Emitidas
                </span>
                <Gift className="w-5 h-5 text-rose-700" />
              </div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
                {giftCards.length}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                {giftCards.filter((c) => c.status === "active").length} activas sin canjear
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Saldo en Circulación
                </span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-900 mt-2">
                $
                {giftCards
                  .reduce(
                    (acc, c) =>
                      acc +
                      (c.status !== "redeemed" && c.status !== "expired" ? c.currentBalance : 0),
                    0,
                  )
                  .toLocaleString("es-MX")}
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">
                Disponible para compras de clientes
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Total Canjeado
                </span>
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-purple-950 mt-2">
                $
                {giftCards
                  .reduce(
                    (acc, c) => acc + c.redemptionHistory.reduce((sum, r) => sum + r.amountUsed, 0),
                    0,
                  )
                  .toLocaleString("es-MX")}
              </p>
              <p className="text-[11px] text-purple-700 mt-1">Aplicado a pedidos en tienda</p>
            </div>
          </div>

          {/* Controls: Search, Filter, and "+ Emitir Tarjeta" button */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <input
                type="text"
                value={giftCardSearch}
                onChange={(e) => setGiftCardSearch(e.target.value)}
                placeholder="Buscar por código, destinatario o remitente..."
                className="w-full sm:max-w-xs px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />

              <div className="relative min-w-[140px]">
                <select
                  value={giftCardFilter}
                  onChange={(e) => setGiftCardFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 appearance-none focus:outline-none focus:border-rose-500 cursor-pointer shadow-2xs"
                >
                  <option value="ALL">Todas las tarjetas</option>
                  <option value="active">Activas</option>
                  <option value="partially_used">Parciales</option>
                  <option value="redeemed">Canjeadas</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() => setShowCreateCardModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-bold text-xs rounded-xl shadow-[0_4px_14px_rgba(225,29,72,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Tarjeta / Cortesía</span>
            </button>
          </div>

          {/* Gift Cards Table / List */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3.5 pl-5">Código Único</th>
                    <th className="p-3.5">Destinatario</th>
                    <th className="p-3.5">De parte de</th>
                    <th className="p-3.5">Valor Inicial</th>
                    <th className="p-3.5">Saldo Actual</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5">Fecha</th>
                    <th className="p-3.5 pr-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {giftCards
                    .filter((card) => {
                      if (giftCardFilter !== "ALL" && card.status !== giftCardFilter) return false;
                      if (!giftCardSearch.trim()) return true;
                      const q = giftCardSearch.toLowerCase();
                      return (
                        card.code.toLowerCase().includes(q) ||
                        card.recipientName.toLowerCase().includes(q) ||
                        card.purchaserName.toLowerCase().includes(q)
                      );
                    })
                    .map((card) => {
                      const isExpired = card.expiresAt && new Date(card.expiresAt) < new Date();
                      return (
                        <tr key={card.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="p-3.5 pl-5 font-mono font-bold text-stone-900">
                            <div className="flex items-center gap-1.5">
                              <span>{card.code}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(card.code);
                                  showToast({
                                    title: "Copiado",
                                    subtitle: `Código ${card.code} copiado`,
                                  });
                                }}
                                className="text-stone-400 hover:text-stone-700 p-0.5"
                                title="Copiar código"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5 font-semibold text-stone-800">
                            {card.recipientName}
                            {card.recipientPhone && (
                              <span className="block text-[10px] text-stone-400 font-normal">
                                {card.recipientPhone}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-stone-600">{card.purchaserName}</td>
                          <td className="p-3.5 font-semibold text-stone-900">
                            ${card.initialAmount} USD
                          </td>
                          <td className="p-3.5 font-bold text-emerald-700">
                            ${card.currentBalance} USD
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isExpired
                                  ? "bg-stone-100 text-stone-500"
                                  : card.status === "active"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : card.status === "partially_used"
                                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                                      : "bg-rose-100 text-rose-800 border border-rose-200"
                              }`}
                            >
                              {isExpired
                                ? "Expirada"
                                : card.status === "active"
                                  ? "Activa"
                                  : card.status === "partially_used"
                                    ? "Saldo Parcial"
                                    : "Canjeada"}
                            </span>
                          </td>
                          <td className="p-3.5 text-[11px] text-stone-500">
                            {new Date(card.createdAt).toLocaleDateString("es-MX", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="p-3.5 pr-5 text-right space-x-1.5">
                            <button
                              onClick={() => setInspectingGiftCard(card)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer transition-colors"
                            >
                              Ver Detalle
                            </button>
                            {card.status === "active" && (
                              <button
                                onClick={() => updateGiftCardStatus(card.id, "redeemed")}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer transition-colors"
                              >
                                Marcar Canjeada
                              </button>
                            )}
                            {card.status === "redeemed" && (
                              <button
                                onClick={() => updateGiftCardStatus(card.id, "active")}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg cursor-pointer transition-colors"
                              >
                                Reactivar
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `¿Estás segura de eliminar permanentemente la tarjeta ${card.code}? Esta acción borrará el saldo y el registro definitivamente.`,
                                  )
                                ) {
                                  deleteGiftCard(card.id);
                                }
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1"
                              title="Eliminar permanentemente"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {giftCards.length === 0 && (
              <div className="p-12 text-center space-y-2">
                <Gift className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="font-serif text-sm font-bold text-stone-700">
                  No hay tarjetas de regalo emitidas aún
                </p>
                <p className="text-xs text-stone-500">
                  Genera una tarjeta de regalo de cortesía o espera las compras de clientes.
                </p>
              </div>
            )}
          </div>

          {/* Modal to create admin card */}
          {showCreateCardModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-rose-700" />
                    Emitir Tarjeta de Regalo / Cortesía
                  </h3>
                  <button
                    onClick={() => setShowCreateCardModal(false)}
                    className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-2">
                    <label className="block font-semibold text-stone-800">
                      Selecciona el monto del regalo ($ USD) *
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {[5, 10, 15, 20, 25, 30].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAdminCardForm({ ...adminCardForm, initialAmount: amt })}
                          className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all border cursor-pointer ${
                            adminCardForm.initialAmount === amt
                              ? "bg-rose-700 text-white border-rose-700 shadow-xs scale-105"
                              : "bg-stone-50 hover:bg-rose-50 text-stone-700 border-stone-200"
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-stone-800">
                        Monto Seleccionado ($ USD) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={adminCardForm.initialAmount}
                        onChange={(e) =>
                          setAdminCardForm({
                            ...adminCardForm,
                            initialAmount: Math.max(1, Number(e.target.value)),
                          })
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-sm text-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-stone-800">
                        Código Personalizado
                      </label>
                      <input
                        type="text"
                        placeholder="Automático si se deja vacío"
                        value={adminCardForm.code}
                        onChange={(e) =>
                          setAdminCardForm({ ...adminCardForm, code: e.target.value.toUpperCase() })
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-stone-800">
                        Nombre Destinatario *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Sofia Ramos"
                        value={adminCardForm.recipientName}
                        onChange={(e) =>
                          setAdminCardForm({ ...adminCardForm, recipientName: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-stone-800">
                        WhatsApp Destinatario
                      </label>
                      <input
                        type="tel"
                        placeholder="(515) 123-4567"
                        value={adminCardForm.recipientPhone}
                        onChange={(e) =>
                          setAdminCardForm({ ...adminCardForm, recipientPhone: e.target.value })
                        }
                        onBlur={() =>
                          setAdminCardForm({
                            ...adminCardForm,
                            recipientPhone: formatPhoneOnBlur(adminCardForm.recipientPhone),
                          })
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-stone-800">
                        De parte de (Emisor)
                      </label>
                      <input
                        type="text"
                        value={adminCardForm.purchaserName}
                        onChange={(e) =>
                          setAdminCardForm({ ...adminCardForm, purchaserName: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-stone-800">Tema Visual</label>
                      <select
                        value={adminCardForm.themeDesign}
                        onChange={(e) =>
                          setAdminCardForm({
                            ...adminCardForm,
                            themeDesign: e.target.value as GiftCardTheme,
                          })
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      >
                        <option value="romantic_rose">Rosa Romántica</option>
                        <option value="golden_elegance">Oro Satinado</option>
                        <option value="lavender_dream">Lavanda Etérea</option>
                        <option value="velvet_noir">Velvet Noir</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Mensaje de Dedicatoria
                    </label>
                    <textarea
                      rows={2}
                      value={adminCardForm.personalMessage}
                      onChange={(e) =>
                        setAdminCardForm({ ...adminCardForm, personalMessage: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateCardModal(false)}
                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-semibold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!adminCardForm.recipientName.trim()) {
                        showToast({
                          title: "Falta destinatario",
                          subtitle: "Ingresa el nombre del destinatario",
                        });
                        return;
                      }
                      createAdminGiftCard(adminCardForm);
                      setShowCreateCardModal(false);
                      setAdminCardForm({
                        code: "",
                        initialAmount: 15,
                        themeDesign: "romantic_rose",
                        recipientName: "",
                        recipientEmail: "",
                        recipientPhone: "",
                        purchaserName: "Lazo Eterno (Cortesía)",
                        personalMessage:
                          "Un detalle eterno hecho a mano para ti, para que elijas tu ramo o caja sorpresa favorita.",
                      });
                    }}
                    className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Crear y Emitir Tarjeta
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal to inspect a card */}
          {inspectingGiftCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Ficha Técnica de Tarjeta
                  </h3>
                  <button
                    onClick={() => setInspectingGiftCard(null)}
                    className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <GiftCardPreview
                  amount={inspectingGiftCard.initialAmount}
                  balance={inspectingGiftCard.currentBalance}
                  recipientName={inspectingGiftCard.recipientName}
                  purchaserName={inspectingGiftCard.purchaserName}
                  personalMessage={inspectingGiftCard.personalMessage}
                  theme={inspectingGiftCard.themeDesign}
                  code={inspectingGiftCard.code}
                  status={inspectingGiftCard.status}
                  expiresAt={inspectingGiftCard.expiresAt}
                />

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Emitida el:</span>
                    <span className="font-semibold text-stone-800">
                      {new Date(inspectingGiftCard.createdAt).toLocaleString("es-MX")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Destinatario:</span>
                    <span className="font-semibold text-stone-800">
                      {inspectingGiftCard.recipientName}{" "}
                      {inspectingGiftCard.recipientPhone
                        ? `(${inspectingGiftCard.recipientPhone})`
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Historial de canjes:</span>
                    <span className="font-bold text-purple-800">
                      {inspectingGiftCard.redemptionHistory.length} canjes registrados
                    </span>
                  </div>
                </div>

                {inspectingGiftCard.redemptionHistory.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                    {inspectingGiftCard.redemptionHistory.map((r) => (
                      <div
                        key={r.id}
                        className="flex justify-between items-center py-1 border-b border-stone-200/50 last:border-0 text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-stone-800">
                            Canje -${r.amountUsed} USD
                          </span>
                          <span className="block text-stone-400">
                            {new Date(r.date).toLocaleDateString("en-US")}
                          </span>
                        </div>
                        <span className="text-stone-600">{r.note || r.orderNumber || ""}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setInspectingGiftCard(null)}
                    className="px-4 py-2 bg-stone-800 text-white rounded-xl text-xs font-semibold"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. TAB: Lealtad y Recompensas (Módulo Totalmente Configurable) */}
      {activeTab === "loyalty" && <AdminLoyaltyRewardsView />}

      {/* 10. TAB: Sorteos y Descuentos */}
      {activeTab === "giveaways" && <AdminGiveawaysAndDiscountsView />}

      {/* 11. TAB: Settings & Complete Store Customization */}
      {activeTab === "settings" && (
        <div className="space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Personalización General de la Tienda
              </h3>
              <p className="text-xs text-stone-500">
                Ajusta identidad, textos, fondos y parámetros. Todos los cambios se sincronizan en
                vivo.
              </p>
            </div>
          </div>

          {/* Sub-navigation tabs for Settings */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-stone-200">
            {[
              { id: "branding", label: "Identidad & Contacto", icon: Sparkles },
              { id: "payments", label: "Métodos de Pago (PayPal, Venmo...)", icon: CreditCard },
              { id: "backgrounds", label: "Fondos & Colores", icon: Palette },
              { id: "guarantees", label: "Garantía & Calidad", icon: ShieldCheck },
              { id: "layers", label: "Orden de Capas", icon: Layers },
              { id: "content", label: "Textos & Portada", icon: FileText },
              { id: "maintenance", label: "Modo Mantenimiento", icon: AlertTriangle },
              { id: "database", label: "Base de Datos", icon: Database },
            ].map((sub) => {
              const Icon = sub.icon;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSettingsSubTab(sub.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    settingsSubTab === sub.id
                      ? "bg-rose-700 text-white shadow-xs"
                      : "bg-white text-stone-600 hover:bg-rose-50 border border-stone-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* SUBTAB 1: Branding & Contact Info */}
          {settingsSubTab === "branding" && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-5">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Nombre del Negocio & Eslogan
                  </h3>
                  <p className="text-xs text-stone-500">
                    Personaliza la marca visible en la cabecera, pie de página y mensajes
                    automáticos.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Nombre Comercial del Negocio
                    </label>
                    <input
                      type="text"
                      value={siteSettings.businessName}
                      onChange={(e) => updateSiteSettings({ businessName: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Eslogan Principal
                    </label>
                    <input
                      type="text"
                      value={siteSettings.slogan}
                      onChange={(e) => updateSiteSettings({ slogan: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-stone-800">
                      Frase Inspiradora / Subtítulo
                    </label>
                    <input
                      type="text"
                      value={siteSettings.tagline}
                      onChange={(e) => updateSiteSettings({ tagline: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Contact and Channels */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-5">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Información de Contacto & Redes Sociales
                  </h3>
                  <p className="text-xs text-stone-500">
                    Canales donde los clientes enviarán sus dudas, dedicatorias y pedidos urgentes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      WhatsApp de Ventas
                    </label>
                    <input
                      type="text"
                      value={siteSettings.whatsapp}
                      onChange={(e) => updateSiteSettings({ whatsapp: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Teléfono Directo
                    </label>
                    <input
                      type="text"
                      value={siteSettings.phone}
                      onChange={(e) => updateSiteSettings({ phone: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Correo Electrónico de Contacto
                    </label>
                    <input
                      type="email"
                      value={siteSettings.email}
                      onChange={(e) => updateSiteSettings({ email: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">Instagram</label>
                    <input
                      type="text"
                      value={siteSettings.instagram}
                      onChange={(e) => updateSiteSettings({ instagram: e.target.value })}
                      placeholder="@tunegocio"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">TikTok</label>
                    <input
                      type="text"
                      value={siteSettings.tiktok || ""}
                      onChange={(e) => updateSiteSettings({ tiktok: e.target.value })}
                      placeholder="@tunegocio_ramos"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">Facebook</label>
                    <input
                      type="text"
                      value={siteSettings.facebook || ""}
                      onChange={(e) => updateSiteSettings({ facebook: e.target.value })}
                      placeholder="facebook.com/tunegocio"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-stone-800">
                      Dirección del Taller / Punto de Retiro
                    </label>
                    <input
                      type="text"
                      value={siteSettings.pickupAddress}
                      onChange={(e) => updateSiteSettings({ pickupAddress: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-stone-800">
                      Horarios de Atención
                    </label>
                    <input
                      type="text"
                      value={siteSettings.businessHours}
                      onChange={(e) => updateSiteSettings({ businessHours: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Bank & Financial details */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-5">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Cuentas Bancarias & Anticipo
                  </h3>
                  <p className="text-xs text-stone-500">
                    Datos bancarios presentados a los clientes para transferir su 50% de anticipo.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Banco para Depósitos
                    </label>
                    <input
                      type="text"
                      value={siteSettings.bankDetails.bankName}
                      onChange={(e) =>
                        updateSiteSettings({
                          bankDetails: { ...siteSettings.bankDetails, bankName: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Titular de la Cuenta
                    </label>
                    <input
                      type="text"
                      value={siteSettings.bankDetails.accountHolder}
                      onChange={(e) =>
                        updateSiteSettings({
                          bankDetails: {
                            ...siteSettings.bankDetails,
                            accountHolder: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Número de Cuenta
                    </label>
                    <input
                      type="text"
                      value={siteSettings.bankDetails.accountNumber}
                      onChange={(e) =>
                        updateSiteSettings({
                          bankDetails: {
                            ...siteSettings.bankDetails,
                            accountNumber: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      CLABE Interbancaria / Clave de Pago
                    </label>
                    <input
                      type="text"
                      value={siteSettings.bankDetails.clabeOrKey}
                      onChange={(e) =>
                        updateSiteSettings({
                          bankDetails: { ...siteSettings.bankDetails, clabeOrKey: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-stone-800">
                      Instrucciones de Transferencia
                    </label>
                    <textarea
                      rows={2}
                      value={siteSettings.bankDetails.instructions}
                      onChange={(e) =>
                        updateSiteSettings({
                          bankDetails: {
                            ...siteSettings.bankDetails,
                            instructions: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB: Métodos de Pago */}
          {settingsSubTab === "payments" && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-rose-700" />
                      Métodos de Pago para Clientes
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Activa y configura opciones como PayPal, Venmo, Zelle, Mercado Pago o
                      Transferencias directas. Al activarlos, tus clientes podrán ver los datos o
                      abrir el enlace de pago con un solo clic y luego subir su comprobante.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newMethod: PaymentMethodConfig = {
                        id: "pay-" + Date.now(),
                        name: "Nuevo Método de Pago",
                        type: "OTHER",
                        enabled: true,
                        instructions: "Realiza tu pago e ingresa el comprobante.",
                      };
                      const currentMethods = siteSettings.paymentMethods || [];
                      updateSiteSettings({ paymentMethods: [...currentMethods, newMethod] });
                    }}
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Método
                  </button>
                </div>

                {/* Deposit configuration percentage */}
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-bold text-rose-950 block text-sm">
                      Porcentaje de Anticipo Obligatorio
                    </span>
                    <span className="text-rose-900/80">
                      Porcentaje del total del pedido requerido para apartar la fecha en el taller.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={siteSettings.depositPercentage || 50}
                      onChange={(e) =>
                        updateSiteSettings({ depositPercentage: parseInt(e.target.value) || 50 })
                      }
                      className="w-20 px-3 py-1.5 bg-white border border-rose-300 rounded-xl text-center font-bold text-rose-900"
                    />
                    <span className="font-bold text-stone-600">%</span>
                  </div>
                </div>

                {/* List of payment methods */}
                <div className="space-y-4">
                  {(siteSettings.paymentMethods || []).map((method, idx) => (
                    <div
                      key={method.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        method.enabled
                          ? "bg-stone-50/60 border-stone-200"
                          : "bg-stone-100/40 border-stone-200 opacity-60"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-3 h-3 rounded-full ${method.enabled ? "bg-emerald-500" : "bg-stone-300"}`}
                          />
                          <input
                            type="text"
                            value={method.name}
                            onChange={(e) => {
                              const updated = (siteSettings.paymentMethods || []).map((m, i) =>
                                i === idx ? { ...m, name: e.target.value } : m,
                              );
                              updateSiteSettings({ paymentMethods: updated });
                            }}
                            className="font-bold text-stone-900 bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs sm:text-sm"
                            placeholder="Nombre del método (ej. PayPal)"
                          />
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                            {method.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={method.enabled}
                              onChange={(e) => {
                                const updated = (siteSettings.paymentMethods || []).map((m, i) =>
                                  i === idx ? { ...m, enabled: e.target.checked } : m,
                                );
                                updateSiteSettings({ paymentMethods: updated });
                              }}
                              className="rounded border-stone-300 text-rose-700 focus:ring-rose-700 w-4 h-4 cursor-pointer"
                            />
                            <span>{method.enabled ? "Activado para clientes" : "Desactivado"}</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = (siteSettings.paymentMethods || []).filter(
                                (_, i) => i !== idx,
                              );
                              updateSiteSettings({ paymentMethods: updated });
                            }}
                            className="text-stone-400 hover:text-rose-700 p-1 rounded-lg"
                            title="Eliminar método"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
                        {/* Icono del método de pago subido desde el dispositivo */}
                        <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-stone-200">
                          <div className="flex items-center gap-3">
                            {method.iconUrl ? (
                              <div className="relative w-12 h-12 rounded-xl bg-white border border-stone-200 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                <img
                                  src={method.iconUrl}
                                  alt={method.name}
                                  className="w-full h-full object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (siteSettings.paymentMethods || []).map(
                                      (m, i) => (i === idx ? { ...m, iconUrl: undefined } : m),
                                    );
                                    updateSiteSettings({ paymentMethods: updated });
                                  }}
                                  className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-rose-700 text-white rounded-full p-0.5 cursor-pointer"
                                  title="Quitar icono"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-stone-50 border border-dashed border-stone-300 flex items-center justify-center shrink-0 text-stone-400">
                                <CreditCard className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-stone-800 text-xs block">
                                Icono del Método de Pago
                              </span>
                              <span className="text-[10px] text-stone-500">
                                {method.iconUrl
                                  ? "Icono personalizado cargado correctamente."
                                  : "Sube el logo o icono (PayPal, OXXO, BBVA, Zelle, etc.) desde tu dispositivo."}
                              </span>
                            </div>
                          </div>

                          <label className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-2xs self-start sm:self-auto">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {method.iconUrl ? "Cambiar icono" : "Subir icono desde dispositivo"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const optimized = await fileToOptimizedImage(file);
                                  const updated = (siteSettings.paymentMethods || []).map((m, i) =>
                                    i === idx ? { ...m, iconUrl: optimized } : m,
                                  );
                                  updateSiteSettings({ paymentMethods: updated });
                                } catch (err) {
                                  console.error("Error optimizando icono de pago:", err);
                                } finally {
                                  e.target.value = "";
                                }
                              }}
                            />
                          </label>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1 text-stone-700">
                            Enlace directo de pago (URL de cobro / link)
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              placeholder="ej. https://paypal.me/tu-cuenta o link de cobro"
                              value={method.paymentUrl || ""}
                              onChange={(e) => {
                                const updated = (siteSettings.paymentMethods || []).map((m, i) =>
                                  i === idx ? { ...m, paymentUrl: e.target.value } : m,
                                );
                                updateSiteSettings({ paymentMethods: updated });
                              }}
                              className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-800 font-mono text-[11px]"
                            />
                            <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                          </div>
                          <span className="text-[10px] text-stone-400 mt-0.5 block">
                            Si pones un enlace, al cliente le saldrá un botón directo para pagar.
                          </span>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1 text-stone-700">
                            Identificador / Cuenta / Correo / Teléfono
                          </label>
                          <input
                            type="text"
                            placeholder="ej. monse@ejemplo.com o @MonseLazo o 55-1234-5678"
                            value={method.accountIdentifier || ""}
                            onChange={(e) => {
                              const updated = (siteSettings.paymentMethods || []).map((m, i) =>
                                i === idx ? { ...m, accountIdentifier: e.target.value } : m,
                              );
                              updateSiteSettings({ paymentMethods: updated });
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-800 font-mono text-[11px]"
                          />
                          <span className="text-[10px] text-stone-400 mt-0.5 block">
                            Dato visible para que el cliente lo copie fácilmente.
                          </span>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-semibold mb-1 text-stone-700">
                            Instrucciones para el cliente
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Instrucciones breves de cómo realizar el pago con este método..."
                            value={method.instructions || ""}
                            onChange={(e) => {
                              const updated = (siteSettings.paymentMethods || []).map((m, i) =>
                                i === idx ? { ...m, instructions: e.target.value } : m,
                              );
                              updateSiteSettings({ paymentMethods: updated });
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-800 text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: Backgrounds & Color Styling */}
          {settingsSubTab === "backgrounds" && (
            <div className="space-y-6">
              {/* Hero Background Image */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-5">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Imagen de Fondo de la Portada Principal
                  </h3>
                  <p className="text-xs text-stone-500">
                    Pon tu propia foto de ramos o taller como fondo de bienvenida en la página
                    principal.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      URL de la Imagen de Fondo (o sube un archivo abajo)
                    </label>
                    <input
                      type="url"
                      value={homepageConfig.hero.backgroundImage || ""}
                      onChange={(e) =>
                        updateHomepageConfig({
                          hero: { ...homepageConfig.hero, backgroundImage: e.target.value },
                        })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs"
                    />
                  </div>

                  {/* File Uploader for Background */}
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-stone-700">
                      <span className="font-bold block">¿Tienes una foto en tu dispositivo?</span>
                      <span className="text-[11px] text-stone-500">
                        Sube una foto de tu ramo o catálogo y se aplicará inmediatamente.
                      </span>
                    </div>
                    <label className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-2xs">
                      <Upload className="w-4 h-4" />
                      <span>Subir Mi Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                updateHomepageConfig({
                                  hero: {
                                    ...homepageConfig.hero,
                                    backgroundImage: event.target.result as string,
                                  },
                                });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Full visibility note */}
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-900">
                    <p className="font-semibold mb-0.5">✨ Portada 100% Visible & Limpia:</p>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      La imagen de fondo de portada se muestra en alta fidelidad y al 100% de
                      visibilidad, sin capas oscuras ni textos encima. Solo se muestran los dos
                      botones flotantes de acción ("Explorar Catálogo" y "Pedir Diseño
                      Personalizado") en la parte inferior.
                    </p>
                  </div>

                  {/* Quick Presets for Background */}
                  <div>
                    <span className="font-semibold text-stone-700 block mb-2">
                      O selecciona uno de nuestros fondos predeterminados:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        {
                          name: "Rosas Satinadas",
                          url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1800&q=80",
                        },
                        {
                          name: "Taller Floral",
                          url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1800&q=80",
                        },
                        {
                          name: "Pétalos Románticos",
                          url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1800&q=80",
                        },
                        {
                          name: "Luz Cálida & Lazo",
                          url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1800&q=80",
                        },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() =>
                            updateHomepageConfig({
                              hero: { ...homepageConfig.hero, backgroundImage: preset.url },
                            })
                          }
                          className={`relative rounded-xl overflow-hidden aspect-16/10 border-2 transition-all group cursor-pointer ${
                            homepageConfig.hero.backgroundImage === preset.url
                              ? "border-rose-600 ring-2 ring-rose-200"
                              : "border-stone-200 hover:border-rose-300"
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1 text-center">
                            <span className="text-[10px] font-bold text-white leading-tight drop-shadow-xs">
                              {preset.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview Banner */}
                  {homepageConfig.hero.backgroundImage && (
                    <div className="relative rounded-2xl overflow-hidden border border-stone-200 p-4 h-32 flex items-center justify-between text-white">
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${homepageConfig.hero.backgroundImage})` }}
                      />
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs" />
                      <div className="relative z-10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                          Vista Previa
                        </span>
                        <h4 className="font-serif font-bold text-sm text-white">
                          Fondo Activo en Portada
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateHomepageConfig({
                            hero: { ...homepageConfig.hero, backgroundImage: "" },
                          })
                        }
                        className="relative z-10 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold backdrop-blur-xs cursor-pointer"
                      >
                        Quitar Fondo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Page Background Color */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-5">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Color de Fondo de la Aplicación
                  </h3>
                  <p className="text-xs text-stone-500">
                    Cambia la tonalidad base de toda la tienda web según el estilo visual que
                    prefieras.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-4">
                    <label className="font-semibold text-stone-800">Color Personalizado:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={siteSettings.pageBackgroundColor || "#FFFDFD"}
                        onChange={(e) =>
                          updateSiteSettings({ pageBackgroundColor: e.target.value })
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 p-0.5"
                      />
                      <input
                        type="text"
                        value={siteSettings.pageBackgroundColor || "#FFFDFD"}
                        onChange={(e) =>
                          updateSiteSettings({ pageBackgroundColor: e.target.value })
                        }
                        className="w-28 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono uppercase text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-stone-700 block mb-2">
                      Paletas de Color Prémium:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                      {[
                        { name: "Soft Blush", hex: "#FFFDFD", border: "border-rose-200" },
                        { name: "Warm Ivory", hex: "#FAF8F5", border: "border-amber-200" },
                        { name: "Champagne", hex: "#FDFBF7", border: "border-amber-100" },
                        { name: "Rose Silk", hex: "#FFF5F5", border: "border-rose-300" },
                        { name: "Pure White", hex: "#FFFFFF", border: "border-stone-200" },
                        { name: "Velvet Noir", hex: "#18181B", border: "border-stone-700" },
                      ].map((pal) => (
                        <button
                          key={pal.name}
                          type="button"
                          onClick={() => updateSiteSettings({ pageBackgroundColor: pal.hex })}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            siteSettings.pageBackgroundColor === pal.hex
                              ? "ring-2 ring-rose-600 shadow-xs"
                              : "hover:border-rose-300"
                          }`}
                          style={{ backgroundColor: pal.hex }}
                        >
                          <span
                            className={`block text-[11px] font-bold ${
                              pal.hex === "#18181B" ? "text-white" : "text-stone-800"
                            }`}
                          >
                            {pal.name}
                          </span>
                          <span
                            className={`text-[10px] font-mono ${
                              pal.hex === "#18181B" ? "text-stone-400" : "text-stone-500"
                            }`}
                          >
                            {pal.hex}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: Guarantees and Quality Information */}
          {settingsSubTab === "guarantees" && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-5">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Información de Garantía y Calidad
                  </h3>
                  <p className="text-xs text-stone-500">
                    Edita los compromisos artesanales que dan seguridad al cliente al comprar ramos
                    eternos.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Título de la Sección
                    </label>
                    <input
                      type="text"
                      value={siteSettings.guaranteeTitle || ""}
                      onChange={(e) => updateSiteSettings({ guaranteeTitle: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Subtítulo Descriptivo
                    </label>
                    <input
                      type="text"
                      value={siteSettings.guaranteeSubtitle || ""}
                      onChange={(e) => updateSiteSettings({ guaranteeSubtitle: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>

                {/* Cards List */}
                <div className="space-y-3 pt-3">
                  <span className="font-serif font-bold text-sm text-stone-900 block">
                    Tarjetas de Garantía ({siteSettings.guarantees?.length || 0})
                  </span>

                  {(siteSettings.guarantees || []).map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-rose-800">
                          Tarjeta #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = siteSettings.guarantees.filter(
                              (g) => g.id !== item.id,
                            );
                            updateSiteSettings({ guarantees: filtered });
                          }}
                          className="text-stone-400 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                            Icono
                          </label>
                          <select
                            value={item.icon}
                            onChange={(e) => {
                              const updated = siteSettings.guarantees.map((g) =>
                                g.id === item.id ? { ...g, icon: e.target.value } : g,
                              );
                              updateSiteSettings({ guarantees: updated });
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                          >
                            <option value="HandHeart">Corazón / A Mano</option>
                            <option value="Sparkles">Destello / Listón A+</option>
                            <option value="Clock">Reloj / Eternas</option>
                            <option value="ShieldCheck">Escudo / Calidad</option>
                            <option value="Scissors">Tijeras / Confección</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                            Título
                          </label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const updated = siteSettings.guarantees.map((g) =>
                                g.id === item.id ? { ...g, title: e.target.value } : g,
                              );
                              updateSiteSettings({ guarantees: updated });
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                            Descripción
                          </label>
                          <textarea
                            rows={2}
                            value={item.description}
                            onChange={(e) => {
                              const updated = siteSettings.guarantees.map((g) =>
                                g.id === item.id ? { ...g, description: e.target.value } : g,
                              );
                              updateSiteSettings({ guarantees: updated });
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add New Guarantee Card */}
                  <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-3">
                    <span className="font-bold text-xs text-rose-950 block">
                      Agregar Nueva Tarjeta de Garantía
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <select
                          value={newGuarantee.icon}
                          onChange={(e) =>
                            setNewGuarantee({ ...newGuarantee, icon: e.target.value })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-rose-200 rounded-lg text-xs"
                        >
                          <option value="Sparkles">Destello (Sparkles)</option>
                          <option value="HandHeart">Amor / Hecho a Mano</option>
                          <option value="Clock">Durabilidad Infinita</option>
                          <option value="ShieldCheck">Garantía / Escudo</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Título de la garantía (ej. Envoltura Impermeable Coreana)"
                          value={newGuarantee.title}
                          onChange={(e) =>
                            setNewGuarantee({ ...newGuarantee, title: e.target.value })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-rose-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Descripción detallada de la garantía..."
                          value={newGuarantee.description}
                          onChange={(e) =>
                            setNewGuarantee({ ...newGuarantee, description: e.target.value })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-rose-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newGuarantee.title) return;
                        const item: GuaranteeItem = {
                          id: `g-${Date.now()}`,
                          icon: newGuarantee.icon,
                          title: newGuarantee.title,
                          description: newGuarantee.description,
                        };
                        updateSiteSettings({
                          guarantees: [...(siteSettings.guarantees || []), item],
                        });
                        setNewGuarantee({ title: "", description: "", icon: "Sparkles" });
                      }}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      + Añadir a Garantías
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 4: Layer Ordering (Orden de las capas a tu gusto) */}
          {settingsSubTab === "layers" && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      Orden & Visibilidad de las Capas de la Portada
                    </h3>
                    <p className="text-xs text-stone-500">
                      Reordena las secciones de arriba hacia abajo usando las flechas o
                      activa/desactiva las que quieras mostrar.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      updateHomepageConfig({
                        sectionOrder: [
                          "hero",
                          "dates",
                          "featured",
                          "process",
                          "guarantees",
                          "gallery",
                          "story",
                          "reviews",
                        ],
                        sectionVisibility: {
                          hero: true,
                          dates: true,
                          featured: true,
                          process: true,
                          guarantees: true,
                          gallery: true,
                          story: true,
                          reviews: true,
                        },
                      });
                    }}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer Orden</span>
                  </button>
                </div>

                {/* Layers Reorder List */}
                <div className="space-y-2.5">
                  {(() => {
                    const sectionNames: Record<string, { title: string; desc: string }> = {
                      hero: {
                        title: "Portada Principal / Hero",
                        desc: "Título, eslogan, botones de acción y ramo insignia",
                      },
                      dates: {
                        title: "Próximas Fechas & Temporadas",
                        desc: "Tarjetas de cupos para San Valentín, Aniversarios y Graduaciones",
                      },
                      featured: {
                        title: "Ramos & Diseños Más Pedidos",
                        desc: "Colección de productos destacados y ramos insignia",
                      },
                      process: {
                        title: "¿Cómo Funciona Tu Reserva?",
                        desc: "Los 6 pasos ilustrados del proceso de compra y anticipo",
                      },
                      guarantees: {
                        title: "Garantía & Calidad Artesanal",
                        desc: "4 compromisos de durabilidad, listón satinado y trabajo manual",
                      },
                      gallery: {
                        title: "Portafolio Real & Trabajos Realizados",
                        desc: "Fotografías de entregas reales a clientes",
                      },
                      story: {
                        title: "Sobre la Artesana & Taller",
                        desc: "Historia del negocio y dedicación artesanal de Monse",
                      },
                      reviews: {
                        title: "Opiniones & Testimonios Reales",
                        desc: "Calificaciones de 5 estrellas con insignia de compra verificada",
                      },
                    };

                    const order = homepageConfig.sectionOrder || [
                      "hero",
                      "dates",
                      "featured",
                      "process",
                      "guarantees",
                      "gallery",
                      "story",
                      "reviews",
                    ];

                    const visibility = homepageConfig.sectionVisibility || {};

                    return order.map((sectionId, idx) => {
                      const info = sectionNames[sectionId] || { title: sectionId, desc: "" };
                      const isVisible = visibility[sectionId] !== false;

                      const moveUp = () => {
                        if (idx === 0) return;
                        const newOrder = [...order];
                        const temp = newOrder[idx - 1];
                        newOrder[idx - 1] = newOrder[idx];
                        newOrder[idx] = temp;
                        updateHomepageConfig({ sectionOrder: newOrder });
                      };

                      const moveDown = () => {
                        if (idx === order.length - 1) return;
                        const newOrder = [...order];
                        const temp = newOrder[idx + 1];
                        newOrder[idx + 1] = newOrder[idx];
                        newOrder[idx] = temp;
                        updateHomepageConfig({ sectionOrder: newOrder });
                      };

                      const toggleVis = () => {
                        updateHomepageConfig({
                          sectionVisibility: {
                            ...visibility,
                            [sectionId]: !isVisible,
                          },
                        });
                      };

                      return (
                        <div
                          key={sectionId}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isVisible
                              ? "bg-white border-stone-200 shadow-2xs"
                              : "bg-stone-50 border-stone-200/60 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            <div>
                              <h4 className="font-serif text-sm font-bold text-stone-900 flex items-center gap-2">
                                {info.title}
                                {!isVisible && (
                                  <span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-sans font-normal">
                                    Oculta
                                  </span>
                                )}
                              </h4>
                              <p className="text-[11px] text-stone-500">{info.desc}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={moveUp}
                              disabled={idx === 0}
                              title="Subir capa"
                              className="p-2 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={moveDown}
                              disabled={idx === order.length - 1}
                              title="Bajar capa"
                              className="p-2 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={toggleVis}
                              title={isVisible ? "Ocultar sección" : "Mostrar sección"}
                              className={`p-2 rounded-xl cursor-pointer ${
                                isVisible
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                                  : "bg-stone-200 hover:bg-stone-300 text-stone-600"
                              }`}
                            >
                              {isVisible ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 5: Content, Hero Text & About Us */}
          {settingsSubTab === "content" && (
            <div className="space-y-6">
              {/* Hero Texts */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-5">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Textos de la Portada Principal (Hero)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Personaliza los mensajes y llamadas a la acción que cautivan al cliente al
                    entrar.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Título Principal
                    </label>
                    <input
                      type="text"
                      value={homepageConfig.hero.title}
                      onChange={(e) =>
                        updateHomepageConfig({
                          hero: { ...homepageConfig.hero, title: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Frase Emocional en Cursiva
                    </label>
                    <input
                      type="text"
                      value={homepageConfig.hero.emotionalPhrase}
                      onChange={(e) =>
                        updateHomepageConfig({
                          hero: { ...homepageConfig.hero, emotionalPhrase: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl italic font-serif"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Descripción Detallada
                    </label>
                    <textarea
                      rows={3}
                      value={homepageConfig.hero.description}
                      onChange={(e) =>
                        updateHomepageConfig({
                          hero: { ...homepageConfig.hero, description: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block font-semibold mb-1 text-stone-800">
                        Texto Botón Primario
                      </label>
                      <input
                        type="text"
                        value={homepageConfig.hero.primaryBtnText}
                        onChange={(e) =>
                          updateHomepageConfig({
                            hero: { ...homepageConfig.hero, primaryBtnText: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-stone-800">
                        Texto Botón Secundario
                      </label>
                      <input
                        type="text"
                        value={homepageConfig.hero.secondaryBtnText}
                        onChange={(e) =>
                          updateHomepageConfig({
                            hero: { ...homepageConfig.hero, secondaryBtnText: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      URL Foto Insignia de Portada (Columna Derecha)
                    </label>
                    <input
                      type="url"
                      value={homepageConfig.hero.imageUrl}
                      onChange={(e) =>
                        updateHomepageConfig({
                          hero: { ...homepageConfig.hero, imageUrl: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* About Us section */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-5">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Sobre la Artesana & Taller
                  </h3>
                  <p className="text-xs text-stone-500">
                    Cuenta la historia detrás de tus manos y la pasión por los ramos eternos.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-stone-800">
                        Título de la Sección
                      </label>
                      <input
                        type="text"
                        value={homepageConfig.aboutUs.title}
                        onChange={(e) =>
                          updateHomepageConfig({
                            aboutUs: { ...homepageConfig.aboutUs, title: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-stone-800">
                        Nombre de la Artesana / Creador
                      </label>
                      <input
                        type="text"
                        value={homepageConfig.aboutUs.artisanName}
                        onChange={(e) =>
                          updateHomepageConfig({
                            aboutUs: { ...homepageConfig.aboutUs, artisanName: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Historia & Mensaje Personal
                    </label>
                    <textarea
                      rows={4}
                      value={homepageConfig.aboutUs.story}
                      onChange={(e) =>
                        updateHomepageConfig({
                          aboutUs: { ...homepageConfig.aboutUs, story: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="pt-2 border-t border-stone-100">
                    <label className="block font-semibold mb-2 text-stone-800">
                      Foto de la Sección "Hecho con pasión por Monse"
                    </label>

                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Thumbnail preview */}
                        <div className="w-24 h-30 rounded-xl overflow-hidden shadow-xs border-2 border-white bg-stone-200 shrink-0 relative flex items-center justify-center">
                          {homepageConfig.aboutUs.imageUrl ? (
                            <img
                              src={homepageConfig.aboutUs.imageUrl}
                              alt="Foto actual de la artesana"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-stone-400" />
                          )}
                          {isProcessingStoryImage && (
                            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-2xs flex items-center justify-center text-white">
                              <span className="text-[10px] font-bold animate-pulse">
                                Guardando...
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                          <p className="text-xs text-stone-600 font-medium">
                            Esta fotografía acompaña la historia de la artesana en la página
                            principal.
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                            <input
                              ref={storyFileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsProcessingStoryImage(true);
                                try {
                                  const optimized = await fileToOptimizedImage(file);
                                  updateHomepageConfig({
                                    aboutUs: { ...homepageConfig.aboutUs, imageUrl: optimized },
                                  });
                                  showToast({
                                    title: "Foto Actualizada ✨",
                                    subtitle:
                                      "Se ha guardado la nueva foto de 'Hecho con pasión por Monse'.",
                                  });
                                } catch (err) {
                                  console.error(err);
                                  showToast({
                                    title: "Error al subir",
                                    subtitle: "No se pudo procesar la imagen seleccionada.",
                                  });
                                } finally {
                                  setIsProcessingStoryImage(false);
                                  if (storyFileInputRef.current)
                                    storyFileInputRef.current.value = "";
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => storyFileInputRef.current?.click()}
                              disabled={isProcessingStoryImage}
                              className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Subir desde dispositivo</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsStoryImageModalOpen(true)}
                              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Camera className="w-3.5 h-3.5 text-amber-400" />
                              <span>Catálogo & Gestor</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Direct URL input */}
                      <div>
                        <span className="block text-[11px] font-semibold text-stone-500 mb-1">
                          O editar enlace web (URL):
                        </span>
                        <input
                          type="url"
                          value={homepageConfig.aboutUs.imageUrl}
                          onChange={(e) =>
                            updateHomepageConfig({
                              aboutUs: { ...homepageConfig.aboutUs, imageUrl: e.target.value },
                            })
                          }
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB: Maintenance Mode Configuration */}
          {settingsSubTab === "maintenance" && (
            <div className="space-y-6">
              {/* Main Control Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <h3 className="font-serif text-lg font-bold text-stone-900">
                        Configuración de Modo Mantenimiento
                      </h3>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Activa una pantalla elegante de aviso para cuando estés editando productos,
                      precios importantes o fechas especiales sin que los visitantes vean cambios a
                      medias.
                    </p>
                  </div>

                  {/* Switch button */}
                  <div className="flex items-center gap-3 p-2 bg-stone-50 rounded-2xl border border-stone-200 shrink-0">
                    <span className="text-xs font-bold text-stone-800">
                      {isMaintenanceActive ? "Mantenimiento ACTIVO" : "Mantenimiento DESACTIVADO"}
                    </span>
                    <button
                      id="btn-settings-toggle-maintenance"
                      type="button"
                      role="switch"
                      aria-checked={isMaintenanceActive}
                      onClick={() => toggleMaintenanceMode()}
                      className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        isMaintenanceActive ? "bg-amber-600" : "bg-stone-300"
                      }`}
                      title={
                        isMaintenanceActive
                          ? "Desactivar modo mantenimiento"
                          : "Activar modo mantenimiento"
                      }
                    >
                      <span className="sr-only">Modo Mantenimiento</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                          isMaintenanceActive ? "translate-x-8" : "translate-x-0"
                        }`}
                      >
                        <Power
                          className={`w-4 h-4 ${isMaintenanceActive ? "text-amber-700" : "text-stone-400"}`}
                        />
                      </span>
                    </button>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Título Principal de la Pantalla de Mantenimiento
                    </label>
                    <input
                      id="input-maintenance-title"
                      type="text"
                      value={siteSettings.maintenanceMode?.title || ""}
                      onChange={(e) => updateMaintenanceConfig({ title: e.target.value })}
                      placeholder="Ej: Sitio en Mantenimiento Temporal / Actualizando Catálogo"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">
                      Este título se mostrará en tipografía destacada a los visitantes.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-stone-800">
                      Mensaje Explicativo para los Visitantes
                    </label>
                    <textarea
                      id="input-maintenance-message"
                      rows={3}
                      value={siteSettings.maintenanceMode?.message || ""}
                      onChange={(e) => updateMaintenanceConfig({ message: e.target.value })}
                      placeholder="Explica amablemente a tus clientes que estás preparando novedades y volverás pronto..."
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-stone-800">
                        Tiempo Estimado de Reapertura / Regreso
                      </label>
                      <div className="relative">
                        <input
                          id="input-maintenance-return"
                          type="text"
                          value={siteSettings.maintenanceMode?.estimatedReturn || ""}
                          onChange={(e) =>
                            updateMaintenanceConfig({ estimatedReturn: e.target.value })
                          }
                          placeholder="Ej: En unos momentos / Hoy a las 6:00 PM / Pronto"
                          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800 focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all"
                        />
                        <Clock className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1">
                        Aparecerá destacado dentro de una insignia de tiempo.
                      </p>
                    </div>

                    <div className="flex flex-col justify-center">
                      <label className="block font-semibold mb-1 text-stone-800">
                        Atención por WhatsApp para Pedidos Urgentes
                      </label>
                      <label className="flex items-center gap-3 p-2.5 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
                        <input
                          id="checkbox-maintenance-whatsapp"
                          type="checkbox"
                          checked={siteSettings.maintenanceMode?.contactWhatsapp !== false}
                          onChange={(e) =>
                            updateMaintenanceConfig({ contactWhatsapp: e.target.checked })
                          }
                          className="w-4 h-4 text-emerald-600 rounded-sm border-stone-300 focus:ring-emerald-500"
                        />
                        <div className="text-left">
                          <span className="font-semibold text-stone-800 block">
                            Mostrar botón directo de WhatsApp
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Permite a los clientes pedir cotizaciones urgentes mientras el sitio
                            está cerrado.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Real-time sync & preview buttons */}
                <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/70">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Autoguardado en Firestore activo</span>
                    </div>

                    <button
                      id="btn-preview-maintenance-screen"
                      type="button"
                      onClick={() => setPreviewAsVisitor(true)}
                      className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4 text-stone-600" />
                      <span>Previsualizar Pantalla Completa</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-stone-400">
                    Cambios sincronizados en tiempo real mediante SSE
                  </span>
                </div>
              </div>

              {/* Interactive Live Mockup Box */}
              <div className="bg-stone-900 text-white rounded-3xl p-6 border border-stone-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-rose-200 uppercase tracking-wider">
                      Vista Previa en Tiempo Real de la Pantalla de Aviso
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded-full">
                    Diseño Adaptativo
                  </span>
                </div>

                <div className="p-6 rounded-2xl bg-stone-950/80 border border-stone-800 text-center max-w-lg mx-auto space-y-4 shadow-inner">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-300">
                    <Heart className="w-6 h-6 text-rose-300" />
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Taller en Actualización
                    </span>
                  </div>

                  <h4 className="font-serif text-lg font-bold text-white">
                    {siteSettings.maintenanceMode?.title || "Sitio en Mantenimiento Temporal"}
                  </h4>

                  <p className="text-stone-400 text-xs leading-relaxed">
                    {siteSettings.maintenanceMode?.message ||
                      "Estamos actualizando nuestro catálogo y preparando hermosas novedades para tus fechas especiales. Regresamos en unos momentos."}
                  </p>

                  {siteSettings.maintenanceMode?.estimatedReturn && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-300">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      <span>{siteSettings.maintenanceMode.estimatedReturn}</span>
                    </div>
                  )}

                  {siteSettings.maintenanceMode?.contactWhatsapp !== false && (
                    <div className="pt-2">
                      <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/50">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Contactar por WhatsApp</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 6: Database Architecture & Cloud Readiness */}
          {settingsSubTab === "database" && (
            <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 border border-stone-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-rose-400" />
                <h3 className="font-serif text-lg font-bold text-white">
                  Estructura de Base de Datos Real & Persistencia
                </h3>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                La aplicación opera con persistencia real en{" "}
                <code className="text-rose-300">localStorage</code> manteniendo intactos los cambios
                de marca, imágenes de fondo, colores, capas, comprobantes y pedidos. Todo está
                modelado para conectar directamente a Firestore o PostgreSQL:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
                <div className="p-3 bg-stone-800 rounded-xl border border-stone-700">
                  <span className="text-rose-400 font-bold block">1. site_settings</span>
                  <span className="text-stone-400">
                    businessName, whatsapp, pageBackgroundColor, guarantees, bankDetails
                  </span>
                </div>
                <div className="p-3 bg-stone-800 rounded-xl border border-stone-700">
                  <span className="text-rose-400 font-bold block">2. homepage_config</span>
                  <span className="text-stone-400">
                    hero.backgroundImage, sectionOrder, sectionVisibility, hero, aboutUs
                  </span>
                </div>
                <div className="p-3 bg-stone-800 rounded-xl border border-stone-700">
                  <span className="text-rose-400 font-bold block">3. orders</span>
                  <span className="text-stone-400">
                    orderNumber, status (5 etapas con barra de progreso), paymentProofUrl
                  </span>
                </div>
                <div className="p-3 bg-stone-800 rounded-xl border border-stone-700">
                  <span className="text-rose-400 font-bold block">4. products</span>
                  <span className="text-stone-400">
                    id, name, price, minPrepDays, ribbonColors, sizes, extras
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete Order Profile Management Modal */}
      <AdminOrderDetailModal
        order={inspectingOrder}
        isOpen={Boolean(inspectingOrder)}
        onClose={() => setInspectingOrder(null)}
        siteSettings={siteSettings}
        registeredUsers={registeredUsers}
        getCustomerLoyaltyProgress={getCustomerLoyaltyProgress}
        onUpdateStatus={(orderId, status, note) => {
          updateOrderStatus(orderId, status, note);
          if (inspectingOrder && inspectingOrder.id === orderId) {
            setInspectingOrder({ ...inspectingOrder, status });
          }
        }}
        onVerifyPayment={(orderId, approved, depositOrReason) => {
          verifyPayment(orderId, approved, depositOrReason);
          if (inspectingOrder && inspectingOrder.id === orderId) {
            const depositNum =
              typeof depositOrReason === "number"
                ? depositOrReason
                : inspectingOrder.requiredDeposit || inspectingOrder.totalPrice;
            setInspectingOrder({
              ...inspectingOrder,
              paymentStatus: approved ? "CONFIRMADO" : "RECHAZADO",
              status: approved ? "PAGO_VERIFICADO" : "ESPERANDO_PAGO",
              amountPaid: approved ? depositNum : inspectingOrder.amountPaid,
              remainingBalance: approved
                ? Math.max(0, inspectingOrder.totalPrice - depositNum)
                : inspectingOrder.remainingBalance,
            });
          }
        }}
        onOpenReceiptModal={(ord) => setSelectedReceiptOrder(ord)}
      />

      {/* Official Printable Order Receipt Modal */}
      <OrderReceiptModal
        order={selectedReceiptOrder}
        siteSettings={siteSettings}
        isOpen={Boolean(selectedReceiptOrder)}
        onClose={() => setSelectedReceiptOrder(null)}
      />

      {/* Selector previo: Tipo de Producto (Normal vs Ramo Especial vs Peluche Especial) */}
      {showProductTypeSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md sm:max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 relative space-y-5">
            <button
              onClick={() => {
                setShowProductTypeSelector(false);
                setPersonalizedOnlySelector(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700 block">
                Catálogo del Taller Monce
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-1">
                {personalizedOnlySelector
                  ? "¿Es un Ramo o un Peluche tejido a mano?"
                  : "¿Qué tipo de producto deseas crear?"}
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {personalizedOnlySelector
                  ? "Elige si es un Ramo de Listón o un Peluche Tejido a Mano. Dependiendo de tu elección, a los clientes les saldrá automáticamente el menú correspondiente sin que ellos tengan que cambiar nada manual:"
                  : "Selecciona la modalidad para configurar el menú y flujo de orden exacto para tus clientes:"}
              </p>
            </div>

            <div
              className={`grid grid-cols-1 ${
                personalizedOnlySelector ? "sm:grid-cols-2" : "sm:grid-cols-3"
              } gap-3`}
            >
              {/* Opción 1: Ramo de Listón Personalizado */}
              <button
                type="button"
                onClick={() => {
                  setPersonalizedOnlySelector(false);
                  handleStartCreateProduct("especial", "ramo");
                }}
                className="p-4 rounded-2xl border-2 border-rose-200 hover:border-rose-600 bg-rose-50/20 hover:bg-rose-50/60 text-left transition-all group cursor-pointer shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 mb-3 text-lg">
                    🌸
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="font-bold text-sm text-rose-950 group-hover:text-rose-900">
                      Ramo de Listón
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
                      Personalizado
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Ramo especial a la medida. Al cliente le saldrá automáticamente el menú de Ramo con selección de colores de listón.
                  </p>
                </div>
                <span className="text-xs font-bold text-rose-800 mt-3 block group-hover:underline">
                  Crear Ramo →
                </span>
              </button>

              {/* Opción 2: Peluche Tejido a Mano */}
              <button
                type="button"
                onClick={() => {
                  setPersonalizedOnlySelector(false);
                  handleStartCreateProduct("especial", "peluche");
                }}
                className="p-4 rounded-2xl border-2 border-amber-200 hover:border-amber-600 bg-amber-50/30 hover:bg-amber-50/70 text-left transition-all group cursor-pointer shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 mb-3 text-lg">
                    🧸
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="font-bold text-sm text-amber-950 group-hover:text-amber-900">
                      Peluche Tejido a Mano
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900">
                      Personalizado
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Amigurumi o figura a crochet. Al cliente le saldrá automáticamente el menú de Peluche (sin pedir listón y sin decir ramo en ningún lado).
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-800 mt-3 block group-hover:underline">
                  Crear Peluche →
                </span>
              </button>

              {/* Opción 3: Producto Normal */}
              {!personalizedOnlySelector && (
                <button
                  type="button"
                  onClick={() => {
                    setPersonalizedOnlySelector(false);
                    handleStartCreateProduct("normal");
                  }}
                  className="p-4 rounded-2xl border-2 border-stone-200 hover:border-rose-600 bg-white hover:bg-rose-50/30 text-left transition-all group cursor-pointer shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-rose-100 flex items-center justify-center text-stone-700 group-hover:text-rose-700 mb-3 transition-colors">
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-bold text-sm text-stone-900 group-hover:text-rose-900">
                        Producto Normal
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Catálogo habitual con precio fijo, opciones de rosas y anticipación mínima obligatoria.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-rose-700 mt-3 block group-hover:underline">
                    Crear Normal →
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                {editingProduct.productType === "especial" ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                    {editingProduct.customItemType === "peluche" ? "🧸" : <Sparkles className="w-3 h-3 text-amber-700" />}
                    {editingProduct.customItemType === "peluche"
                      ? "Peluche Tejido Especial (Personalizado por Chat)"
                      : "Ramo Especial (Personalizado por Chat)"}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-bold flex items-center gap-1">
                    <Package className="w-3 h-3 text-stone-600" />
                    Producto Normal (Catálogo Estándar)
                  </span>
                )}
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                {isNewProduct
                  ? editingProduct.productType === "especial"
                    ? editingProduct.customItemType === "peluche"
                      ? "Crear Peluche Tejido Especial"
                      : "Crear Ramo Especial"
                    : "Crear Nuevo Producto"
                  : editingProduct.productType === "especial"
                    ? editingProduct.customItemType === "peluche"
                      ? "Editar Peluche Tejido Especial"
                      : "Editar Ramo Especial"
                    : "Editar Producto"}
              </h3>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              {/* Selector si es Ramo, Peluche o Normal con configuración automática para el cliente */}
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-amber-950 text-xs">
                    ¿Es un Ramo, Peluche tejido o Normal? *
                  </label>
                  <span className="text-[10px] text-amber-800 font-semibold">
                    Configura el menú del cliente
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingProduct({
                        ...editingProduct,
                        productType: "especial",
                        customItemType: "ramo",
                        tag:
                          editingProduct.tag === "Peluche Tejido"
                            ? "Ramo Especial"
                            : editingProduct.tag || "Ramo Especial",
                        minPrepDays: 0,
                      })
                    }
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center ${
                      editingProduct.productType === "especial" && editingProduct.customItemType !== "peluche"
                        ? "bg-rose-700 text-white border-rose-700 shadow-xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <span className="text-base">🌸</span>
                    <span className="leading-tight">Ramo Especial</span>
                    <span className="text-[9px] opacity-80 font-normal">Personalizado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingProduct({
                        ...editingProduct,
                        productType: "especial",
                        customItemType: "peluche",
                        tag:
                          editingProduct.tag === "Ramo Especial" || !editingProduct.tag
                            ? "Peluche Tejido"
                            : editingProduct.tag,
                        ribbonColors: [],
                        minPrepDays: 0,
                      })
                    }
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center ${
                      editingProduct.productType === "especial" && editingProduct.customItemType === "peluche"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <span className="text-base">🧸</span>
                    <span className="leading-tight">Peluche Tejido</span>
                    <span className="text-[9px] opacity-80 font-normal">Personalizado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingProduct({
                        ...editingProduct,
                        productType: "normal",
                        customItemType: undefined,
                        minPrepDays: editingProduct.minPrepDays || 2,
                      })
                    }
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center ${
                      editingProduct.productType !== "especial"
                        ? "bg-stone-800 text-white border-stone-800 shadow-xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <span className="text-base">📦</span>
                    <span className="leading-tight">Normal</span>
                    <span className="text-[9px] opacity-80 font-normal">Catálogo Estándar</span>
                  </button>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  {editingProduct.productType === "especial"
                    ? editingProduct.customItemType === "peluche"
                      ? "🧸 Configurado como Peluche: A los usuarios les saldrá automáticamente el menú de orden de Peluche (sin colores de listón y sin decir ramo en ningún lado)."
                      : "🌸 Configurado como Ramo: A los usuarios les saldrá automáticamente el menú de orden de Ramo con selección de colores de listón."
                    : "📦 Configurado como Normal: Producto de catálogo habitual con precio fijo, opciones de rosas y fecha de entrega obligatoria."}
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Categoría</label>
                  <select
                    value={editingProduct.category || categories[0]}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    {editingProduct.productType === "especial"
                      ? "Precio Orientativo ($)"
                      : "Precio Base ($)"}
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              {editingProduct.productType === "especial" ? (
                <div className="space-y-2">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Sin días mínimos de anticipo requeridos</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      En este producto especial no se aplican días mínimos fijos de anticipo. El
                      plazo y fecha en que lo puedes tener listo se acuerdan directamente contigo y
                      el cliente en el chat.
                    </p>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Etiqueta Badge</label>
                    <input
                      type="text"
                      placeholder="Ej. Especial, A Medida, Diseño Único"
                      value={editingProduct.tag || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, tag: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">Días Mínimos Anticipación</label>
                    <input
                      type="number"
                      min="1"
                      value={editingProduct.minPrepDays || 2}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          minPrepDays: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Etiqueta Badge</label>
                    <input
                      type="text"
                      placeholder="Ej. Más Vendido"
                      value={editingProduct.tag || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, tag: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Fotos del Producto</label>
                <label className="flex items-center justify-center gap-2 px-3 py-3 mb-2 border-2 border-dashed border-rose-200 bg-rose-50/50 rounded-xl cursor-pointer hover:bg-rose-50 transition-colors">
                  <Upload className="w-4 h-4 text-rose-700" />
                  <span className="font-bold text-rose-700">
                    {isUploadingImages ? "Procesando fotos…" : "Subir fotos desde tu dispositivo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      void handleProductImageFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>

                {editingProduct.images && editingProduct.images.filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editingProduct.images.filter(Boolean).map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-16 h-20 rounded-lg overflow-hidden border border-stone-200 bg-stone-50"
                      >
                        <img
                          src={img}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-rose-700 text-white text-[8px] text-center font-bold">
                            Principal
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProduct({
                              ...editingProduct,
                              images: (editingProduct.images || []).filter((_, i) => i !== idx),
                            })
                          }
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="url"
                  placeholder="O pega una URL de imagen"
                  value={
                    editingProduct.images?.[0]?.startsWith("http") ? editingProduct.images[0] : ""
                  }
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      images: [e.target.value, ...(editingProduct.images || []).slice(1)],
                    })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              {/* Colores del listón (Solo para Ramos, no aplica a Peluches) */}
              {editingProduct.customItemType !== "peluche" && (
                <div className="border border-stone-200 rounded-xl p-3 space-y-2 bg-stone-50/60">
                  <div>
                    <label className="block font-semibold">Colores del Listón</label>
                    <p className="text-[10px] text-stone-500">
                      Activa o desactiva los colores que ofreces en este ramo. Los activos
                      aparecen en la página del producto.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {RIBBON_COLOR_PALETTE.map((c) => {
                      const active = (editingProduct.ribbonColors || []).includes(c.name);
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() =>
                            setEditingProduct({
                              ...editingProduct,
                              ribbonColors: active
                                ? (editingProduct.ribbonColors || []).filter((n) => n !== c.name)
                                : [...(editingProduct.ribbonColors || []), c.name],
                            })
                          }
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                            active
                              ? "border-rose-600 bg-rose-50 text-rose-900"
                              : "border-stone-200 bg-white text-stone-400"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full border shrink-0 ${active ? "border-stone-300" : "border-stone-200 opacity-40"}`}
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="truncate">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct({
                          ...editingProduct,
                          ribbonColors: [...ALL_RIBBON_COLOR_NAMES],
                        })
                      }
                      className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 rounded-lg text-[11px] font-bold text-stone-700"
                    >
                      Activar todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, ribbonColors: [] })}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[11px] font-bold text-stone-600"
                    >
                      Quitar todos
                    </button>
                  </div>
                </div>
              )}

              {/* Extras personalizables */}
              <div className="border border-stone-200 rounded-xl p-3 space-y-2 bg-stone-50/60">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-semibold">Extras Personalizables</label>
                    <p className="text-[10px] text-stone-500">
                      Tarjeta, tarjeta de regalo, listón, peluche… con su precio aparte. Se suman al
                      pedido si el cliente los elige.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingProduct({
                        ...editingProduct,
                        extrasAvailable: [
                          ...(editingProduct.extrasAvailable || []),
                          { id: "extra-" + Date.now(), name: "", price: 0, description: "" },
                        ],
                      })
                    }
                    className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>

                {(editingProduct.extrasAvailable || []).length === 0 && (
                  <p className="text-[11px] text-stone-400 italic">
                    Aún no hay extras para este producto.
                  </p>
                )}

                {(editingProduct.extrasAvailable || []).map((extra) => (
                  <div
                    key={extra.id}
                    className="bg-white border border-stone-200 rounded-xl p-2.5 space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre (Ej. Peluche mediano)"
                        value={extra.name}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            extrasAvailable: (editingProduct.extrasAvailable || []).map((x) =>
                              x.id === extra.id ? { ...x, name: e.target.value } : x,
                            ),
                          })
                        }
                        className="px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Precio extra"
                        value={Number.isFinite(extra.price) ? extra.price : 0}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            extrasAvailable: (editingProduct.extrasAvailable || []).map((x) =>
                              x.id === extra.id
                                ? { ...x, price: parseFloat(e.target.value) || 0 }
                                : x,
                            ),
                          })
                        }
                        className="px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Descripción corta (opcional)"
                        value={extra.description || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            extrasAvailable: (editingProduct.extrasAvailable || []).map((x) =>
                              x.id === extra.id ? { ...x, description: e.target.value } : x,
                            ),
                          })
                        }
                        className="flex-1 px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditingProduct({
                            ...editingProduct,
                            extrasAvailable: (editingProduct.extrasAvailable || []).filter(
                              (x) => x.id !== extra.id,
                            ),
                          })
                        }
                        className="text-rose-700 hover:text-rose-900"
                        title="Eliminar extra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Opciones con foto del extra */}
                    <div className="border-t border-stone-100 pt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-stone-700">
                          Opciones con foto{" "}
                          <span className="font-normal text-stone-400">
                            (ej. distintos peluches)
                          </span>
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProduct({
                              ...editingProduct,
                              extrasAvailable: (editingProduct.extrasAvailable || []).map((x) =>
                                x.id === extra.id
                                  ? {
                                      ...x,
                                      options: [
                                        ...(x.options || []),
                                        { id: "opt-" + Date.now(), name: "", available: true },
                                      ],
                                    }
                                  : x,
                              ),
                            })
                          }
                          className="px-2 py-1 bg-stone-200 hover:bg-stone-300 rounded-lg text-[10px] font-bold text-stone-700 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Opción
                        </button>
                      </div>

                      {(extra.options || []).map((opt) => (
                        <div
                          key={opt.id}
                          className="flex flex-wrap items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg p-2"
                        >
                          {opt.image ? (
                            <img
                              src={opt.image}
                              alt={opt.name}
                              className="w-10 h-10 object-cover rounded-lg border border-stone-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-white border border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <label className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 border border-rose-200">
                            <Upload className="w-3 h-3" /> Foto
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (!file) return;
                                try {
                                  const optimized = await fileToOptimizedImage(file);
                                  if (optimized)
                                    updateExtraOption(extra.id, opt.id, { image: optimized });
                                } catch (err) {
                                  console.error("Error procesando foto de opción:", err);
                                }
                              }}
                            />
                          </label>
                          <input
                            type="text"
                            placeholder="Nombre de la opción"
                            value={opt.name}
                            onChange={(e) =>
                              updateExtraOption(extra.id, opt.id, { name: e.target.value })
                            }
                            className="flex-1 min-w-[120px] px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-[11px]"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Precio"
                            value={opt.price ?? ""}
                            onChange={(e) =>
                              updateExtraOption(extra.id, opt.id, {
                                price:
                                  e.target.value === "" ? undefined : parseFloat(e.target.value),
                              })
                            }
                            className="w-20 px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-[11px]"
                          />
                          <label className="flex items-center gap-1 text-[10px] font-semibold text-stone-600">
                            <input
                              type="checkbox"
                              checked={opt.available !== false}
                              onChange={(e) =>
                                updateExtraOption(extra.id, opt.id, { available: e.target.checked })
                              }
                            />
                            Activo
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingProduct({
                                ...editingProduct,
                                extrasAvailable: (editingProduct.extrasAvailable || []).map((x) =>
                                  x.id === extra.id
                                    ? {
                                        ...x,
                                        options: (x.options || []).filter((o) => o.id !== opt.id),
                                      }
                                    : x,
                                ),
                              })
                            }
                            className="text-rose-700 hover:text-rose-900"
                            title="Eliminar opción"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {(extra.options || []).length === 0 && (
                        <p className="text-[10px] text-stone-400 italic">
                          Sin opciones: se agrega como un solo detalle con el precio de arriba.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grupos de personalizables reutilizables */}
              <div className="border border-stone-200 rounded-xl p-3 space-y-2 bg-stone-50/60">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-semibold">Grupos de Personalizables</label>
                    <p className="text-[10px] text-stone-500">
                      Activa o desactiva en este producto los grupos que creaste una sola vez.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExtraGroups(true)}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-[11px] font-bold"
                  >
                    Administrar grupos
                  </button>
                </div>
                {(siteSettings.extraGroups || []).length === 0 && (
                  <p className="text-[11px] text-stone-400 italic">Aún no hay grupos creados.</p>
                )}
                <div className="grid sm:grid-cols-2 gap-2">
                  {(siteSettings.extraGroups || []).map((group) => {
                    const active = (editingProduct.extraGroupIds || []).includes(group.id);
                    return (
                      <label
                        key={group.id}
                        className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer ${
                          active ? "border-rose-600 bg-rose-50/60" : "border-stone-200 bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              extraGroupIds: e.target.checked
                                ? [...(editingProduct.extraGroupIds || []), group.id]
                                : (editingProduct.extraGroupIds || []).filter(
                                    (id) => id !== group.id,
                                  ),
                            })
                          }
                          className="mt-0.5"
                        />
                        <span>
                          <span className="block font-bold text-stone-800">
                            {group.name || "Grupo sin nombre"}
                          </span>
                          <span className="block text-[10px] text-stone-500">
                            {(group.extras || []).length} extras
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Descripción Corta</label>
                <textarea
                  rows={2}
                  value={editingProduct.shortDescription || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, shortDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Descripción Completa{" "}
                  <span className="font-normal text-[10px] text-stone-500">
                    (se muestra dentro del producto — usa **texto** para negritas y respeta los
                    saltos de línea)
                  </span>
                </label>
                <textarea
                  rows={6}
                  value={editingProduct.description || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-stone-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Administrador de Categorías */}
      {showExtraGroups && (
        <ExtraGroupsManager
          groups={siteSettings.extraGroups || []}
          onChange={(groups) => updateSiteSettings({ extraGroups: groups })}
          onClose={() => setShowExtraGroups(false)}
        />
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative space-y-4 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowCategoryModal(false)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Categorías del Catálogo
              </h3>
              <p className="text-xs text-stone-500">
                Crea, renombra o elimina las categorías de tus productos.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addCategory(newCategoryName);
                setNewCategoryName("");
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Nueva categoría"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold"
              >
                Crear
              </button>
            </form>

            <div className="space-y-2">
              {categories.map((cat) => {
                const count = products.filter((p) => !p.deletedAt && p.category === cat).length;
                return (
                  <div key={cat} className="border border-stone-200 rounded-xl p-2.5 text-xs">
                    {renamingCategory === cat ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          renameCategory(cat, renameCategoryValue);
                          setRenamingCategory(null);
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={renameCategoryValue}
                          onChange={(e) => setRenameCategoryValue(e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-rose-700 text-white rounded-lg font-bold"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingCategory(null)}
                          className="px-2 text-stone-500"
                        >
                          Cancelar
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-stone-900 block truncate">{cat}</span>
                          <span className="text-[10px] text-stone-500">{count} producto(s)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingCategory(cat);
                            setRenameCategoryValue(cat);
                          }}
                          className="p-1.5 text-stone-500 hover:text-stone-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={categories.length <= 1}
                          onClick={() => {
                            const fallback = categories.find((c) => c !== cat);
                            if (
                              count > 0 &&
                              !window.confirm(
                                `"${cat}" tiene ${count} producto(s). Se moverán a "${fallback}". ¿Continuar?`,
                              )
                            )
                              return;
                            deleteCategory(cat);
                          }}
                          className="p-1.5 text-rose-700 hover:text-rose-900 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Gallery New Photo Modal */}
      <GalleryUploadModal isOpen={showGalleryModal} onClose={() => setShowGalleryModal(false)} />

      {/* Story Image Modal */}
      <StoryImageModal
        isOpen={isStoryImageModalOpen}
        onClose={() => setIsStoryImageModalOpen(false)}
      />
    </div>
  );
};
