/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronRight,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FolderTree,
  Globe,
  ImageIcon,
  LayoutGrid,
  Menu as MenuIcon,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  CheckCircle2,
  FileText,
  Monitor,
} from "lucide-react";

import { NavigationIcon, AVAILABLE_NAV_ICONS } from "@/components/navigation-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchPublicMenuItems,
  saveAllPublicMenuItems,
  resetPublicMenuItemsToDefault,
  MENU_SECTIONS,
  type PublicMenuItem,
  type MenuSection,
} from "@/lib/navigation";
import { useSchool } from "@/lib/school";
import { useI18n } from "@/lib/i18n";
import { SITE_SETTINGS_QUERY_OPTIONS } from "@/lib/site-settings-service";
import {
  fetchCategories,
  fetchPublishedArticles,
  type Category,
  type Article,
  type Block,
  CATEGORIES_QUERY_OPTIONS,
} from "@/lib/content";
import { upsertRow } from "@/lib/admin";
import { translateToEnglish, translateToKaren, autoTranslateBlocks } from "@/lib/auto-translator";
import { PublicPreviewModal, type PreviewData } from "@/components/admin/public-preview-modal";

export const Route = createFileRoute("/admin/menu")({
  component: AdminMenuPage,
});

export default function AdminMenuPage() {
  const queryClient = useQueryClient();
  const { adminSchoolFilter, selectedSchool } = useSchool();
  const { lang } = useI18n();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<PublicMenuItem | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<PublicMenuItem | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Category Content Management State
  const [selectedCategoryItem, setSelectedCategoryItem] = useState<PublicMenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isNewArticle, setIsNewArticle] = useState(false);

  // Live Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Fetch Public Menu Items
  const { data: menuItems = [], isLoading: isMenuLoading } = useQuery({
    queryKey: ["public_menu_items", adminSchoolFilter],
    queryFn: () => fetchPublicMenuItems(adminSchoolFilter ?? undefined),
    ...SITE_SETTINGS_QUERY_OPTIONS,
  });

  // Fetch Categories
  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["categories", selectedSchool.id],
    queryFn: () => fetchCategories(selectedSchool.id),
    ...CATEGORIES_QUERY_OPTIONS,
  });

  // Fetch Articles
  const { data: articles = [], refetch: refetchArticles } = useQuery({
    queryKey: ["articles", selectedSchool.id],
    queryFn: () => fetchPublishedArticles(undefined, selectedSchool.id),
  });

  const saveMutation = useMutation({
    mutationFn: async (items: PublicMenuItem[]) => {
      return saveAllPublicMenuItems(items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public_menu_items"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Navegación pública guardada exitosamente y actualizada en tiempo real.");
    },
    onError: (err) => {
      toast.error(
        `Error al guardar el menú: ${err instanceof Error ? err.message : "Desconocido"}`,
      );
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      return resetPublicMenuItemsToDefault();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public_menu_items"] });
      toast.success("Menú restablecido a la configuración predeterminada.");
      setResetDialogOpen(false);
    },
  });

  // Save Category Edit
  const handleSaveCategory = async (cat: Category) => {
    try {
      await upsertRow("categories", {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        card_banner_url: cat.card_banner_url,
        card_bg: cat.card_bg,
        display_order: cat.display_order,
        is_featured: cat.is_featured,
        is_visible: cat.is_visible,
        school_id: cat.school_id,
      });
      await refetchCategories();
      toast.success(`Categoría "${cat.slug}" guardada y sincronizada correctamente.`);
      setEditingCategory(null);
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar la categoría en Supabase.");
    }
  };

  // Save Article Edit
  const handleSaveArticle = async (art: Article) => {
    try {
      await upsertRow("articles", {
        id: art.id,
        slug: art.slug,
        title: art.title,
        summary: art.summary,
        category_id: art.category_id,
        school_id: art.school_id,
        status: art.status || "published",
        card_banner_url: art.card_banner_url,
        featured_image_url: art.featured_image_url,
        is_featured: art.is_featured,
      });
      await refetchArticles();
      toast.success(`Artículo "${art.title}" guardado correctamente en Supabase.`);
      setEditingArticle(null);
      setIsNewArticle(false);
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar el artículo en Supabase.");
    }
  };

  // Filtered items based on tab and search
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (activeTab !== "all" && item.section !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesEs = item.label_es.toLowerCase().includes(q);
        const matchesEn = item.label_en.toLowerCase().includes(q);
        const matchesKar = item.label_kar.toLowerCase().includes(q);
        const matchesPath = item.path.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        if (!matchesEs && !matchesEn && !matchesKar && !matchesPath && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [menuItems, activeTab, searchQuery]);

  // Reordering helpers
  const handleMove = async (indexInFiltered: number, direction: "up" | "down") => {
    const targetItem = filteredItems[indexInFiltered];
    if (!targetItem) return;

    const sectionItems = menuItems
      .filter((i) => i.section === targetItem.section)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    const currentSectionIdx = sectionItems.findIndex((i) => i.id === targetItem.id);
    const swapTargetIdx = direction === "up" ? currentSectionIdx - 1 : currentSectionIdx + 1;

    if (swapTargetIdx < 0 || swapTargetIdx >= sectionItems.length) return;

    const swapItem = sectionItems[swapTargetIdx];
    const currentOrder = targetItem.display_order ?? 0;
    const swapOrder = swapItem.display_order ?? 0;

    const newItems = menuItems.map((item) => {
      if (item.id === targetItem.id) {
        return { ...item, display_order: swapOrder };
      }
      if (item.id === swapItem.id) {
        return { ...item, display_order: currentOrder };
      }
      return item;
    });

    await saveMutation.mutateAsync(newItems);
  };

  const handleToggleVisibility = async (item: PublicMenuItem) => {
    const updated = menuItems.map((i) =>
      i.id === item.id ? { ...i, is_visible: !i.is_visible } : i,
    );
    await saveMutation.mutateAsync(updated);
    toast.success(
      item.is_visible
        ? `"${item.label_es}" ahora está oculto en el menú público.`
        : `"${item.label_es}" ahora está visible en el menú público.`,
    );
  };

  const handleAutoTranslateMenuItem = () => {
    if (!editingItem) return;
    const esLabel = editingItem.label_es || "";
    const esDesc = editingItem.desc_es || "";

    const enLabel = translateToEnglish(esLabel);
    const karLabel = translateToKaren(esLabel);

    const enDesc = esDesc ? translateToEnglish(esDesc) : "";
    const karDesc = esDesc ? translateToKaren(esDesc) : "";

    setEditingItem({
      ...editingItem,
      label_en: enLabel,
      label_kar: karLabel,
      desc_en: enDesc,
      desc_kar: karDesc,
    });

    toast.success("Traducciones generadas automáticamente para Inglés y S'gaw Karen.");
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editingItem.label_es.trim() && !editingItem.label_en.trim()) {
      toast.error("El enlace debe tener al menos un nombre en español o inglés.");
      return;
    }
    if (!editingItem.path.trim()) {
      toast.error("Debe ingresar la ruta o enlace de destino.");
      return;
    }

    let updatedList: PublicMenuItem[];
    if (isNewItem) {
      const highestOrder = Math.max(
        ...menuItems
          .filter((i) => i.section === editingItem.section)
          .map((i) => i.display_order ?? 0),
        0,
      );
      const newItem: PublicMenuItem = {
        ...editingItem,
        display_order: highestOrder + 10,
        id: editingItem.id || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      };
      updatedList = [...menuItems, newItem];
    } else {
      updatedList = menuItems.map((i) => (i.id === editingItem.id ? editingItem : i));
    }

    await saveMutation.mutateAsync(updatedList);
    setEditingItem(null);
    setIsNewItem(false);
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    const updated = menuItems.filter((i) => i.id !== deleteConfirmItem.id);
    await saveMutation.mutateAsync(updated);
    toast.success(`Enlace "${deleteConfirmItem.label_es}" eliminado.`);
    setDeleteConfirmItem(null);
  };

  const openNewItemModal = (defaultSection: MenuSection = "main_header") => {
    setIsNewItem(true);
    setEditingItem({
      id: `custom_${Date.now()}`,
      section: (activeTab !== "all" ? activeTab : defaultSection) as MenuSection,
      label_es: "",
      label_en: "",
      label_kar: "",
      desc_es: "",
      desc_en: "",
      desc_kar: "",
      path: "/",
      icon: "Link2",
      display_order: 100,
      is_visible: true,
      is_external: false,
      school_id: adminSchoolFilter ?? null,
    });
  };

  // Helper to open live preview
  const handleOpenLivePreview = (item: PublicMenuItem) => {
    // Find category or matching article
    const cat = categories.find(
      (c) => item.path.includes(c.slug) || item.path.includes(c.id) || item.id.includes(c.slug),
    );

    const relevantArticles = cat
      ? articles.filter(
          (a) =>
            a.category_id === cat.id ||
            a.category_id === cat.slug ||
            a.categories?.slug === cat.slug,
        )
      : [];

    const firstArticle = relevantArticles[0];

    const preview: PreviewData = {
      type: cat ? "category" : "announcement",
      title: item.label_es || "Vista Previa de Menú",
      summary:
        item.desc_es ||
        cat?.description ||
        `Exploración pública de ${item.label_es} para familias de DMPS.`,
      body:
        firstArticle?.summary ||
        `Sección: ${item.label_es}\n\nArtículos disponibles en esta categoría: ${relevantArticles.length}\n\nEnlace público: ${item.path}`,
      category: item.label_es,
      school_id: selectedSchool.id,
      image_url: cat?.banner_url || (cat as any)?.image_url || firstArticle?.featured_image_url,
      status: "published",
      translations: {
        en: {
          title: item.label_en || translateToEnglish(item.label_es),
          summary: item.desc_en || translateToEnglish(item.desc_es || item.label_es),
          body: `Section: ${item.label_en || translateToEnglish(item.label_es)}\n\nArticles available: ${relevantArticles.length}\n\nPublic route: ${item.path}`,
        },
        kar: {
          title: item.label_kar || translateToKaren(item.label_es),
          summary: item.desc_kar || translateToKaren(item.desc_es || item.label_es),
          body: `တၢ်မၤစၢၤ: ${item.label_kar || translateToKaren(item.label_es)}\n\nလံာ်တၢ်ကွဲးအိၣ်ဝဲ: ${relevantArticles.length}\n\nကျဲ: ${item.path}`,
        },
      },
    };

    setPreviewData(preview);
    setPreviewOpen(true);
  };

  // Open Category Content Management
  const handleOpenCategoryContent = (item: PublicMenuItem) => {
    setSelectedCategoryItem(item);
    // Find matching category object
    const cat = categories.find(
      (c) =>
        item.path.includes(c.slug) ||
        item.path.includes(c.id) ||
        item.id.includes(c.slug) ||
        c.slug === item.path.replace(/^\/topics\//, ""),
    ) || {
      id: `cat_${item.id.replace(/^nav_|^res_/, "")}`,
      slug: item.path.replace(/^\/topics\//, "").replace(/^\//, "") || item.id,
      icon: item.icon || "FolderTree",
      banner_url: "",
      name: item.label_es,
      description: item.desc_es || "",
      translations: {
        es: { name: item.label_es, description: item.desc_es || "" },
        en: {
          name: item.label_en || translateToEnglish(item.label_es),
          description: item.desc_en || translateToEnglish(item.desc_es || ""),
        },
        ksw: {
          name: item.label_kar || translateToKaren(item.label_es),
          description: item.desc_kar || translateToKaren(item.desc_es || ""),
        },
      },
    };

    setEditingCategory(cat);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MenuIcon className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Editor de Menú y Contenido de Secciones Públicas
              </h1>
              <p className="text-sm text-muted-foreground">
                Ve y edita el contenido, banners, artículos y traducciones automáticas de cada
                opción del menú.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/apariencia">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-border text-foreground hover:bg-muted font-medium"
            >
              <ImageIcon className="size-4 text-primary" />
              <span>Ícono y Logotipo Principal</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const firstItem = menuItems[0];
              if (firstItem) handleOpenLivePreview(firstItem);
            }}
            className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
          >
            <Monitor className="size-4" />
            Vista Previa Pública en Vivo
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
            className="gap-1.5"
          >
            <RotateCcw className="size-4" />
            Restablecer Predeterminados
          </Button>

          <Button size="sm" onClick={() => openNewItemModal()} className="gap-1.5 font-semibold">
            <Plus className="size-4" />
            Nuevo Enlace al Menú
          </Button>
        </div>
      </div>

      {/* Navigation Quick Summary Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {MENU_SECTIONS.map((sec) => {
          const count = menuItems.filter((i) => i.section === sec.id).length;
          const visibleCount = menuItems.filter((i) => i.section === sec.id && i.is_visible).length;
          return (
            <div
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-primary/50 hover:shadow-sm ${
                activeTab === sec.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {sec.label.split("(")[0]}
                </span>
                <Badge variant={visibleCount > 0 ? "secondary" : "outline"} className="text-xs">
                  {visibleCount} de {count} activos
                </Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{sec.description}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2 sm:flex sm:w-auto">
            <TabsTrigger value="all">Todos ({menuItems.length})</TabsTrigger>
            <TabsTrigger value="main_header">Barra Superior</TabsTrigger>
            <TabsTrigger value="resources_dropdown">Menú Recursos</TabsTrigger>
            <TabsTrigger value="footer_links">Pie de Página</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar enlaces por nombre o ruta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Menu Items List */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="border-b border-border bg-muted/40 px-6 py-3">
          <div className="grid grid-cols-12 items-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-1 text-center">Orden</div>
            <div className="col-span-4">Nombre y Traducciones</div>
            <div className="col-span-3">Ruta / Destino</div>
            <div className="col-span-4 text-right">Gestión de Contenido y Acciones</div>
          </div>
        </div>

        {isMenuLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            Cargando opciones de navegación...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <LayoutGrid className="mx-auto size-10 text-muted-foreground/50" />
            <h3 className="mt-4 text-base font-semibold">No se encontraron enlaces</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? "No hay resultados para tu búsqueda."
                : "No hay enlaces en esta sección."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openNewItemModal()}
              className="mt-4 gap-1.5"
            >
              <Plus className="size-4" />
              Agregar Enlace
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredItems.map((item, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === filteredItems.length - 1;
              const sectionInfo = MENU_SECTIONS.find((s) => s.id === item.section);

              // Find matching category to show count of articles
              const matchedCat = categories.find(
                (c) =>
                  item.path.includes(c.slug) ||
                  item.path.includes(c.id) ||
                  item.id.includes(c.slug) ||
                  c.slug === item.path.replace(/^\/topics\//, ""),
              );
              const articleCount = matchedCat
                ? articles.filter(
                    (a) =>
                      a.category_id === matchedCat.id ||
                      a.category_id === matchedCat.slug ||
                      a.categories?.slug === matchedCat.slug,
                  ).length
                : 0;

              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-12 items-center gap-3 px-6 py-4 transition-colors hover:bg-muted/30 ${
                    !item.is_visible ? "opacity-60 bg-muted/10" : ""
                  }`}
                >
                  {/* Reorder Buttons */}
                  <div className="col-span-1 flex items-center justify-center gap-1">
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        disabled={isFirst}
                        onClick={() => handleMove(idx, "up")}
                        title="Mover arriba"
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        disabled={isLast}
                        onClick={() => handleMove(idx, "down")}
                        title="Mover abajo"
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Icon & Title with Multilingual Details */}
                  <div className="col-span-4 flex items-start gap-3 min-w-0">
                    <div
                      className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background ${
                        item.icon_color || "text-primary"
                      }`}
                    >
                      <NavigationIcon name={item.icon} className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">
                          {item.label_es || item.label_en || "Sin título"}
                        </span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {item.badge}
                          </Badge>
                        )}
                        {item.school_id && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-600 dark:text-amber-400"
                          >
                            {item.school_id}
                          </Badge>
                        )}
                        {articleCount > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-primary/30"
                          >
                            {articleCount} artículos
                          </Badge>
                        )}
                      </div>

                      {/* Multilingual Preview Labels */}
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span>
                          <strong className="text-foreground/70">EN:</strong>{" "}
                          {item.label_en || <span className="italic opacity-50">Sin traducir</span>}
                        </span>
                        <span>
                          <strong className="text-foreground/70">KSW:</strong>{" "}
                          {item.label_kar || (
                            <span className="italic opacity-50">Sin traducir</span>
                          )}
                        </span>
                      </div>

                      {item.desc_es && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                          {item.desc_es}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Path & Link Target */}
                  <div className="col-span-3 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
                      <span className="truncate bg-muted px-2 py-1 rounded-md text-xs font-semibold">
                        {item.path}
                      </span>
                      {item.is_external && (
                        <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {sectionInfo?.label.split("(")[0] || item.section}
                      </Badge>
                    </div>
                  </div>

                  {/* Content Editing & Menu Actions */}
                  <div className="col-span-4 flex flex-wrap items-center justify-end gap-1.5">
                    {/* Primary Button: View & Edit Content */}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenCategoryContent(item)}
                      className="gap-1.5 text-xs font-semibold shadow-xs"
                      title="Ver y editar contenido de esta categoría"
                    >
                      <FolderTree className="size-3.5" />
                      <span>Ver y Editar Contenido</span>
                    </Button>

                    {/* Live Preview Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenLivePreview(item)}
                      title="Vista previa pública en vivo"
                      className="gap-1 text-xs"
                    >
                      <Eye className="size-3.5 text-primary" />
                      <span className="hidden xl:inline">Vista Previa</span>
                    </Button>

                    {/* Edit Link Properties */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        setIsNewItem(false);
                        setEditingItem({ ...item });
                      }}
                      title="Editar enlace del menú"
                    >
                      <Edit3 className="size-3.5" />
                    </Button>

                    {/* Toggle Visibility */}
                    <Button
                      variant={item.is_visible ? "ghost" : "outline"}
                      size="icon"
                      className="size-8"
                      onClick={() => handleToggleVisibility(item)}
                      title={item.is_visible ? "Ocultar del menú" : "Mostrar en el menú"}
                    >
                      {item.is_visible ? (
                        <Eye className="size-3.5 text-emerald-600" />
                      ) : (
                        <EyeOff className="size-3.5 text-muted-foreground" />
                      )}
                    </Button>

                    {item.id.startsWith("custom_") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteConfirmItem(item)}
                        title="Eliminar enlace"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CATEGORY & MENU CONTENT EDITOR DRAWER / MODAL */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(editingCategory)}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      >
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          {editingCategory && selectedCategoryItem && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between gap-4">
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                    <FolderTree className="size-5 text-primary" />
                    <span>Contenido de: {selectedCategoryItem.label_es}</span>
                  </DialogTitle>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenLivePreview(selectedCategoryItem)}
                    className="gap-1.5 text-primary border-primary/30"
                  >
                    <Eye className="size-4" />
                    Vista Previa Pública
                  </Button>
                </div>
                <DialogDescription>
                  Personaliza el banner superior, los textos traducidos automáticamente y los
                  artículos de esta categoría.
                </DialogDescription>
              </DialogHeader>

              {/* 1. Category Banner & Info */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <ImageIcon className="size-4 text-primary" />
                    <span>Banner Superior e Identidad de la Categoría</span>
                  </h3>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const esName =
                        editingCategory.translations?.es?.name || editingCategory.name || "";
                      const esDesc =
                        editingCategory.translations?.es?.description ||
                        editingCategory.description ||
                        "";

                      const enName = translateToEnglish(esName);
                      const karName = translateToKaren(esName);

                      const enDesc = esDesc ? translateToEnglish(esDesc) : "";
                      const karDesc = esDesc ? translateToKaren(esDesc) : "";

                      setEditingCategory({
                        ...editingCategory,
                        name: esName,
                        description: esDesc,
                        translations: {
                          ...editingCategory.translations,
                          es: { name: esName, description: esDesc },
                          en: { name: enName, description: enDesc },
                          ksw: { name: karName, description: karDesc },
                        },
                      });

                      toast.success("Traducciones de categoría actualizadas en Inglés y Karen.");
                    }}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Sparkles className="size-3.5 text-amber-500" />
                    Auto-Traducir a Inglés y Karen
                  </Button>
                </div>

                {/* Banner URL Field & Live Preview */}
                <div className="space-y-2">
                  <Label htmlFor="category-banner" className="text-xs font-semibold">
                    URL de la Imagen del Banner Superior (Opcional)
                  </Label>
                  <Input
                    id="category-banner"
                    placeholder="https://images.unsplash.com/... o enlace de imagen"
                    value={editingCategory.banner_url || (editingCategory as any).image_url || ""}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        banner_url: e.target.value,
                        image_url: e.target.value,
                      } as any)
                    }
                  />

                  {(editingCategory.banner_url || (editingCategory as any).image_url) && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-border max-h-48 bg-muted">
                      <img
                        src={editingCategory.banner_url || (editingCategory as any).image_url}
                        alt={editingCategory.name || "Banner"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Multilingual Titles for Category */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
                  <div>
                    <Label className="text-xs">Nombre (Español)</Label>
                    <Input
                      value={editingCategory.translations?.es?.name || editingCategory.name || ""}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          name: e.target.value,
                          translations: {
                            ...editingCategory.translations,
                            es: {
                              ...editingCategory.translations?.es,
                              name: e.target.value,
                              description: editingCategory.translations?.es?.description || "",
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Nombre (English)</Label>
                    <Input
                      value={editingCategory.translations?.en?.name || ""}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          translations: {
                            ...editingCategory.translations,
                            en: {
                              ...editingCategory.translations?.en,
                              name: e.target.value,
                              description: editingCategory.translations?.en?.description || "",
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Nombre (S'gaw Karen)</Label>
                    <Input
                      value={editingCategory.translations?.ksw?.name || ""}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          translations: {
                            ...editingCategory.translations,
                            ksw: {
                              ...editingCategory.translations?.ksw,
                              name: e.target.value,
                              description: editingCategory.translations?.ksw?.description || "",
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Category Description */}
                <div>
                  <Label className="text-xs">Descripción de la Categoría</Label>
                  <Textarea
                    rows={2}
                    value={
                      editingCategory.translations?.es?.description ||
                      editingCategory.description ||
                      ""
                    }
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        description: e.target.value,
                        translations: {
                          ...editingCategory.translations,
                          es: {
                            ...editingCategory.translations?.es,
                            name:
                              editingCategory.translations?.es?.name || editingCategory.name || "",
                            description: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => handleSaveCategory(editingCategory)}
                    className="font-semibold"
                  >
                    Guardar Cambios de la Categoría
                  </Button>
                </div>
              </div>

              {/* 2. Associated Articles in this Category */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <BookOpen className="size-4 text-primary" />
                      <span>Artículos y Guías en esta Categoría</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Contenidos visibles para las familias en la página pública de esta categoría.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setIsNewArticle(true);
                      setEditingArticle({
                        id: `art_${Date.now()}`,
                        slug: `guia-${Date.now().toString(36)}`,
                        title: "",
                        summary: "",
                        status: "published",
                        category_id: editingCategory.id || editingCategory.slug,
                        school_id: selectedSchool.id,
                        featured_image_url: "",
                        blocks: [
                          {
                            id: `blk_${Date.now()}`,
                            type: "paragraph",
                            text: "Escribe aquí la información importante para las familias.",
                          },
                        ],
                        translations: {
                          es: { title: "", summary: "", blocks: [] },
                          en: { title: "", summary: "", blocks: [] },
                          ksw: { title: "", summary: "", blocks: [] },
                        },
                      });
                    }}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Plus className="size-3.5" />
                    Nuevo Artículo
                  </Button>
                </div>

                {/* List of articles belonging to this category */}
                {(() => {
                  const catArticles = articles.filter(
                    (a) =>
                      a.category_id === editingCategory.id ||
                      a.category_id === editingCategory.slug ||
                      a.categories?.slug === editingCategory.slug,
                  );

                  if (catArticles.length === 0) {
                    return (
                      <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                        <FileText className="mx-auto size-8 opacity-40 mb-2" />
                        <p className="font-semibold">
                          No hay artículos creados en esta categoría todavía.
                        </p>
                        <p className="text-xs mt-1">
                          Haz clic en "Nuevo Artículo" para agregar el primero con su banner e
                          información.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                      {catArticles.map((art) => (
                        <div
                          key={art.id}
                          className="flex items-center justify-between gap-4 p-3.5 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {art.featured_image_url ? (
                              <img
                                src={art.featured_image_url}
                                alt={art.title}
                                className="size-12 rounded-lg object-cover border shrink-0"
                              />
                            ) : (
                              <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <FileText className="size-5" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate">{art.title}</span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                >
                                  {art.status}
                                </Badge>
                              </div>
                              {art.summary && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {art.summary}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                                <span>Slug: /{art.slug}</span>
                                {art.school_id && <span>Sede: {art.school_id}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPreviewData({
                                  type: "article",
                                  title: art.title,
                                  summary: art.summary,
                                  body:
                                    art.blocks?.map((b) => b.text || "").join("\n\n") ||
                                    art.summary,
                                  image_url: art.featured_image_url,
                                  school_id: art.school_id || selectedSchool.id,
                                  category: editingCategory.name,
                                  status: art.status,
                                  translations: {
                                    en: {
                                      title:
                                        art.translations?.en?.title ||
                                        translateToEnglish(art.title),
                                      summary:
                                        art.translations?.en?.summary ||
                                        translateToEnglish(art.summary || ""),
                                      body: translateToEnglish(
                                        art.blocks?.map((b) => b.text || "").join("\n\n") || "",
                                      ),
                                    },
                                    kar: {
                                      title:
                                        art.translations?.ksw?.title || translateToKaren(art.title),
                                      summary:
                                        art.translations?.ksw?.summary ||
                                        translateToKaren(art.summary || ""),
                                      body: translateToKaren(
                                        art.blocks?.map((b) => b.text || "").join("\n\n") || "",
                                      ),
                                    },
                                  },
                                });
                                setPreviewOpen(true);
                              }}
                              className="text-xs gap-1"
                            >
                              <Eye className="size-3.5 text-primary" />
                              <span>Vista Previa</span>
                            </Button>

                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setIsNewArticle(false);
                                setEditingArticle({ ...art });
                              }}
                              className="text-xs gap-1"
                            >
                              <Edit3 className="size-3.5" />
                              <span>Editar</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* ARTICLE EDITOR DIALOG WITH BANNER & AUTO-TRANSLATE */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(editingArticle)}
        onOpenChange={(open) => !open && setEditingArticle(null)}
      >
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          {editingArticle && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between gap-3">
                  <DialogTitle className="flex items-center gap-2">
                    <Edit3 className="size-5 text-primary" />
                    <span>
                      {isNewArticle ? "Crear Nuevo Artículo" : `Editar: ${editingArticle.title}`}
                    </span>
                  </DialogTitle>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const esTitle =
                        editingArticle.translations?.es?.title || editingArticle.title || "";
                      const esSummary =
                        editingArticle.translations?.es?.summary || editingArticle.summary || "";

                      const enTitle = translateToEnglish(esTitle);
                      const karTitle = translateToKaren(esTitle);

                      const enSummary = esSummary ? translateToEnglish(esSummary) : "";
                      const karSummary = esSummary ? translateToKaren(esSummary) : "";

                      const { en: enBlocks, ksw: kswBlocks } = autoTranslateBlocks(
                        editingArticle.blocks || [],
                      );

                      setEditingArticle({
                        ...editingArticle,
                        title: esTitle,
                        summary: esSummary,
                        translations: {
                          ...editingArticle.translations,
                          es: { title: esTitle, summary: esSummary, blocks: editingArticle.blocks },
                          en: { title: enTitle, summary: enSummary, blocks: enBlocks },
                          ksw: { title: karTitle, summary: karSummary, blocks: kswBlocks },
                        },
                      });

                      toast.success(
                        "Traducciones de artículo generadas automáticamente para Inglés y Karen.",
                      );
                    }}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Sparkles className="size-3.5 text-amber-500" />
                    Auto-Traducir a Inglés y Karen
                  </Button>
                </div>
                <DialogDescription>
                  Configura el banner superior, título, resumen y contenido del artículo.
                </DialogDescription>
              </DialogHeader>

              {/* Banner Image URL */}
              <div className="space-y-2">
                <Label htmlFor="article-banner" className="text-xs font-semibold">
                  Banner Superior del Artículo (URL de Imagen)
                </Label>
                <Input
                  id="article-banner"
                  placeholder="https://images.unsplash.com/... o URL de imagen"
                  value={editingArticle.featured_image_url || ""}
                  onChange={(e) =>
                    setEditingArticle({
                      ...editingArticle,
                      featured_image_url: e.target.value,
                    })
                  }
                />

                {editingArticle.featured_image_url && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-border max-h-48 bg-muted">
                    <img
                      src={editingArticle.featured_image_url}
                      alt={editingArticle.title || "Banner del artículo"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Title & Slug */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="art-title" className="text-xs">
                    Título en Español *
                  </Label>
                  <Input
                    id="art-title"
                    value={editingArticle.title}
                    onChange={(e) =>
                      setEditingArticle({ ...editingArticle, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="art-slug" className="text-xs">
                    Ruta / Slug *
                  </Label>
                  <Input
                    id="art-slug"
                    value={editingArticle.slug}
                    onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Multilingual Titles */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl bg-muted/30 p-3 border border-border">
                <div>
                  <Label className="text-xs">Título en Inglés (English)</Label>
                  <Input
                    value={editingArticle.translations?.en?.title || ""}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        translations: {
                          ...editingArticle.translations,
                          en: {
                            ...editingArticle.translations?.en,
                            title: e.target.value,
                            summary: editingArticle.translations?.en?.summary || "",
                          },
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <Label className="text-xs">Título en Karen (S'gaw Karen)</Label>
                  <Input
                    value={editingArticle.translations?.ksw?.title || ""}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        translations: {
                          ...editingArticle.translations,
                          ksw: {
                            ...editingArticle.translations?.ksw,
                            title: e.target.value,
                            summary: editingArticle.translations?.ksw?.summary || "",
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <Label htmlFor="art-summary" className="text-xs">
                  Resumen o Subtítulo
                </Label>
                <Textarea
                  id="art-summary"
                  rows={2}
                  value={editingArticle.summary || ""}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, summary: e.target.value })
                  }
                />
              </div>

              {/* Content Body Blocks */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Texto Principal del Artículo</Label>
                <Textarea
                  rows={6}
                  value={editingArticle.blocks?.[0]?.text || ""}
                  onChange={(e) => {
                    const text = e.target.value;
                    const blocks: Block[] = [
                      {
                        id: editingArticle.blocks?.[0]?.id || `blk_${Date.now()}`,
                        type: "paragraph",
                        text,
                      },
                    ];
                    setEditingArticle({ ...editingArticle, blocks });
                  }}
                  placeholder="Escribe el contenido detallado del artículo aquí..."
                />
              </div>

              <DialogFooter className="gap-2 pt-3">
                <Button type="button" variant="outline" onClick={() => setEditingArticle(null)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={() => handleSaveArticle(editingArticle)}>
                  Guardar Artículo
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* EDIT / CREATE MENU LINK ITEM DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="size-5 text-primary" />
                <span>
                  {isNewItem ? "Crear Nuevo Enlace al Menú" : `Editar: ${editingItem?.label_es}`}
                </span>
              </DialogTitle>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAutoTranslateMenuItem}
                className="gap-1.5 text-xs font-semibold"
              >
                <Sparkles className="size-3.5 text-amber-500" />
                Auto-Traducir
              </Button>
            </div>
            <DialogDescription>
              Modifica los textos en los 3 idiomas, la ruta de navegación, el icono y la
              visibilidad.
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <form onSubmit={handleSaveModal} className="space-y-5 py-2">
              {/* Placement & Route Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="item-section">Ubicación en el Menú *</Label>
                  <Select
                    value={editingItem.section}
                    onValueChange={(val: MenuSection) =>
                      setEditingItem({ ...editingItem, section: val })
                    }
                  >
                    <SelectTrigger id="item-section">
                      <SelectValue placeholder="Selecciona sección" />
                    </SelectTrigger>
                    <SelectContent>
                      {MENU_SECTIONS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="item-path">Ruta o Enlace (URL) *</Label>
                  <Input
                    id="item-path"
                    placeholder="/ejemplo o https://..."
                    value={editingItem.path}
                    onChange={(e) => setEditingItem({ ...editingItem, path: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Multilingual Titles */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-primary" />
                    <span>Títulos en los 3 Idiomas</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAutoTranslateMenuItem}
                    className="h-7 text-xs text-primary gap-1"
                  >
                    <Sparkles className="size-3" />
                    Traducir ahora
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="label-es" className="text-xs">
                      Nombre en Español (Principal) *
                    </Label>
                    <Input
                      id="label-es"
                      placeholder="Ej: Programas Académicos"
                      value={editingItem.label_es}
                      onChange={(e) => setEditingItem({ ...editingItem, label_es: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="label-en" className="text-xs">
                        Nombre en Inglés (English)
                      </Label>
                      <Input
                        id="label-en"
                        placeholder="Ej: Academic Programs"
                        value={editingItem.label_en}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, label_en: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="label-kar" className="text-xs">
                        Nombre en Karen (ကညီကျိာ် - S'gaw Karen)
                      </Label>
                      <Input
                        id="label-kar"
                        placeholder="Ej: တၢ်ကူၣ်ဘၣ်ကူၣ်သ့ တၢ်ရဲၣ်တၢ်ကျဲၤ"
                        value={editingItem.label_kar}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, label_kar: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtitles / Descriptions (for dropdowns) */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Subtítulos o Descripciones (Opcional)</span>
                  <span className="text-[11px] font-normal lowercase opacity-75">
                    visible en tarjetas y menús desplegables
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="desc-es" className="text-xs">
                      Descripción en Español
                    </Label>
                    <Input
                      id="desc-es"
                      placeholder="Ej: Programas académicos y servicios del distrito"
                      value={editingItem.desc_es || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, desc_es: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="desc-en" className="text-xs">
                        Descripción en Inglés
                      </Label>
                      <Input
                        id="desc-en"
                        placeholder="Ej: Academic and district services"
                        value={editingItem.desc_en || ""}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, desc_en: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="desc-kar" className="text-xs">
                        Descripción en Karen
                      </Label>
                      <Input
                        id="desc-kar"
                        placeholder="Ej: တၢ်ကူၣ်ဘၣ်ကူၣ်သ့ အတၢ်မၤစၢၤ"
                        value={editingItem.desc_kar || ""}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, desc_kar: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Icon Selector */}
              <div className="space-y-2">
                <Label>Seleccionar Icono</Label>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-xl bg-background">
                  {AVAILABLE_NAV_ICONS.map((ic) => (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setEditingItem({ ...editingItem, icon: ic.name })}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-center ${
                        editingItem.icon === ic.name
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                          : "border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                      title={ic.label}
                    >
                      <NavigationIcon name={ic.name} className="size-5 mb-1" />
                      <span className="text-[10px] truncate max-w-full">{ic.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Options */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="item-badge">Etiqueta / Badge (Opcional)</Label>
                  <Input
                    id="item-badge"
                    placeholder="Ej: Nuevo, Destacado, BETA"
                    value={editingItem.badge || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="item-admin-route">Ruta de Gestión en Admin (Opcional)</Label>
                  <Input
                    id="item-admin-route"
                    placeholder="Ej: /admin/anuncios, /admin/programas"
                    value={editingItem.admin_route || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, admin_route: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="item-visible"
                    checked={editingItem.is_visible}
                    onCheckedChange={(checked) =>
                      setEditingItem({ ...editingItem, is_visible: checked })
                    }
                  />
                  <Label htmlFor="item-visible" className="cursor-pointer text-sm">
                    {editingItem.is_visible
                      ? "Visible en el sitio público"
                      : "Oculto del menú público"}
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="item-external"
                    checked={Boolean(editingItem.is_external)}
                    onCheckedChange={(checked) =>
                      setEditingItem({ ...editingItem, is_external: checked })
                    }
                  />
                  <Label htmlFor="item-external" className="cursor-pointer text-sm">
                    Abrir en pestaña nueva
                  </Label>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Guardando..." : "Guardar y Aplicar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deleteConfirmItem)}
        onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este enlace del menú?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el enlace "{deleteConfirmItem?.label_es}" de la navegación pública.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar Enlace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restablecer el menú a los valores originales?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto restaurará los títulos, rutas y estructura predeterminada del menú público de
              DMPS. Tus contenidos y artículos no se verán afectados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? "Restableciendo..." : "Sí, Restablecer Menú"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Live Preview Modal */}
      <PublicPreviewModal open={previewOpen} onOpenChange={setPreviewOpen} data={previewData} />
    </div>
  );
}
