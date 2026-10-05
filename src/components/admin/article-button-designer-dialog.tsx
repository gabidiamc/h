/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowRight,
  ExternalLink,
  Play,
  BookOpen,
  Download,
  Sparkles,
  Calendar,
  Check,
  Search,
  Sliders,
  Palette,
  FileText,
  Link as LinkIcon,
  Upload,
  Image as ImageIcon,
  Trash2,
  Heart,
  Shield,
  HelpCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchPublishedArticles, type ArticleRow } from "@/lib/content";
import { compressImageFile } from "@/lib/image-compression";

export interface ArticleButtonConfig {
  mode: "next_article" | "custom_link";
  targetSlug: string;
  customUrl: string;
  label: string;
  sublabel: string;
  bgColor: string;
  textColor: string;
  shape: "pill" | "rounded-xl" | "rounded-md" | "square";
  styleType: "solid" | "gradient" | "outline" | "elevated";
  size: "sm" | "md" | "lg";
  align: "left" | "center" | "right" | "full";
  iconSource: "preset" | "custom" | "none";
  icon:
    | "arrow"
    | "external"
    | "play"
    | "book"
    | "download"
    | "sparkles"
    | "calendar"
    | "heart"
    | "shield"
    | "help"
    | "none";
  customIconUrl?: string;
  customIconPosition?: "left" | "right" | "top" | "only";
  customIconSize?: "xs" | "sm" | "md" | "lg" | "xl";
  insertPosition: "end" | "cursor";
  openInNewTab: boolean;
}

const PRESET_BUTTON_COLORS = [
  { name: "Azul Escolar DMPS", bg: "#1e40af", text: "#ffffff", border: "#1d4ed8" },
  { name: "Celeste Océano", bg: "#0284c7", text: "#ffffff", border: "#0369a1" },
  { name: "Verde Esmeralda", bg: "#059669", text: "#ffffff", border: "#047857" },
  { name: "Púrpura / Violeta", bg: "#7c3aed", text: "#ffffff", border: "#6d28d9" },
  { name: "Ámbar Cálido", bg: "#d97706", text: "#ffffff", border: "#b45309" },
  { name: "Rosa / Magenta", bg: "#db2777", text: "#ffffff", border: "#be185d" },
  { name: "Naranja Atardecer", bg: "#ea580c", text: "#ffffff", border: "#c2410c" },
  { name: "Negro Elegante", bg: "#0f172a", text: "#ffffff", border: "#1e293b" },
  { name: "Blanco Bordeado", bg: "#ffffff", text: "#0f172a", border: "#cbd5e1" },
];

const ICONS_MAP: Record<string, React.ComponentType<{ className?: string }> | null> = {
  arrow: ArrowRight,
  external: ExternalLink,
  play: Play,
  book: BookOpen,
  download: Download,
  sparkles: Sparkles,
  calendar: Calendar,
  heart: Heart,
  shield: Shield,
  help: HelpCircle,
  none: null,
};

interface ArticleButtonDesignerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (html: string, position: "end" | "cursor") => void;
  defaultMode?: "next_article" | "custom_link";
}

export function ArticleButtonDesignerDialog({
  open,
  onOpenChange,
  onInsert,
  defaultMode = "next_article",
}: ArticleButtonDesignerDialogProps) {
  const [mode, setMode] = useState<"next_article" | "custom_link">(defaultMode);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");

  const [selectedSlug, setSelectedSlug] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [label, setLabel] = useState("Siguiente: Continuar leyendo");
  const [sublabel, setSublabel] = useState("");

  const [bgColor, setBgColor] = useState("#1e40af");
  const [textColor, setTextColor] = useState("#ffffff");
  const [shape, setShape] = useState<"pill" | "rounded-xl" | "rounded-md" | "square">("pill");
  const [styleType, setStyleType] = useState<"solid" | "gradient" | "outline" | "elevated">(
    "solid",
  );
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [align, setAlign] = useState<"left" | "center" | "right" | "full">("center");

  // Icon customization
  const [iconSource, setIconSource] = useState<"preset" | "custom" | "none">("preset");
  const [icon, setIcon] = useState<
    | "arrow"
    | "external"
    | "play"
    | "book"
    | "download"
    | "sparkles"
    | "calendar"
    | "heart"
    | "shield"
    | "help"
    | "none"
  >("arrow");
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [customIconPosition, setCustomIconPosition] = useState<"left" | "right" | "top" | "only">(
    "right",
  );
  const [customIconSize, setCustomIconSize] = useState<"xs" | "sm" | "md" | "lg" | "xl">("md");
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const iconFileInputRef = useRef<HTMLInputElement>(null);

  const [insertPosition, setInsertPosition] = useState<"end" | "cursor">("end");
  const [openInNewTab, setOpenInNewTab] = useState(false);

  // Fetch articles to populate the selector
  useEffect(() => {
    if (open) {
      setMode(defaultMode);
      setIsLoadingArticles(true);
      fetchPublishedArticles()
        .then((data) => {
          setArticles(data || []);
          if (data && data.length > 0 && !selectedSlug) {
            const first = data[0];
            const title = first.article_translations?.[0]?.title || first.slug;
            setSelectedSlug(first.slug);
            if (defaultMode === "next_article") {
              setLabel(`Siguiente: ${title}`);
              setInsertPosition("end");
            }
          }
        })
        .finally(() => setIsLoadingArticles(false));
    }
  }, [open, defaultMode]);

  // Handle uploading custom icon image from device
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingIcon(true);
    try {
      const optimized = await compressImageFile(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.9,
      });
      setCustomIconUrl(optimized);
      setIconSource("custom");
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setCustomIconUrl(reader.result as string);
          setIconSource("custom");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingIcon(false);
      if (iconFileInputRef.current) iconFileInputRef.current.value = "";
    }
  };

  // Filter articles by search term
  const filteredArticles = useMemo(() => {
    if (!articleSearch.trim()) return articles;
    const q = articleSearch.toLowerCase();
    return articles.filter((a) => {
      const t = (a.article_translations?.[0]?.title || "").toLowerCase();
      const s = a.slug.toLowerCase();
      return t.includes(q) || s.includes(q);
    });
  }, [articles, articleSearch]);

  const handleSelectArticle = (slug: string) => {
    setSelectedSlug(slug);
    const found = articles.find((a) => a.slug === slug);
    if (found) {
      const title = found.article_translations?.[0]?.title || found.slug;
      setLabel(`Siguiente: ${title}`);
    }
  };

  const finalUrl = useMemo(() => {
    if (mode === "next_article") {
      return `/articles/${selectedSlug || "inicio"}`;
    }
    return customUrl.trim() || "#";
  }, [mode, selectedSlug, customUrl]);

  // Get pixel dimension for custom icon
  const getCustomIconPx = () => {
    switch (customIconSize) {
      case "xs":
        return 16;
      case "sm":
        return 20;
      case "md":
        return 24;
      case "lg":
        return 32;
      case "xl":
        return 44;
      default:
        return 24;
    }
  };

  // Generate HTML for the rich text editor
  const generateButtonHtml = (): string => {
    const radius =
      shape === "pill"
        ? "9999px"
        : shape === "rounded-xl"
          ? "1rem"
          : shape === "rounded-md"
            ? "0.5rem"
            : "0px";

    const padding =
      size === "sm" ? "0.6rem 1.25rem" : size === "lg" ? "1.1rem 2.25rem" : "0.875rem 1.75rem";

    const fontSize = size === "sm" ? "0.875rem" : size === "lg" ? "1.125rem" : "1rem";

    let bgStyle = `background-color: ${bgColor};`;
    let borderStyle = `border: 1px solid ${bgColor};`;
    let shadowStyle = "box-shadow: 0 4px 14px rgba(0,0,0,0.12);";

    if (styleType === "gradient") {
      bgStyle = `background: linear-gradient(135deg, ${bgColor} 0%, #3b82f6 100%);`;
      borderStyle = "border: none;";
      shadowStyle = "box-shadow: 0 6px 20px rgba(37,99,235,0.25);";
    } else if (styleType === "outline") {
      bgStyle = "background-color: transparent;";
      borderStyle = `border: 2.5px solid ${bgColor};`;
      shadowStyle = "box-shadow: none;";
    } else if (styleType === "elevated") {
      bgStyle = `background-color: ${bgColor};`;
      borderStyle = `border: 1px solid ${bgColor}; border-bottom: 4px solid rgba(0,0,0,0.25);`;
      shadowStyle = "box-shadow: 0 8px 24px rgba(0,0,0,0.18);";
    }

    const effectiveTextColor = styleType === "outline" ? bgColor : textColor;

    const widthStyle =
      align === "full"
        ? "width: 100%; max-width: 100%; box-sizing: border-box;"
        : "display: inline-flex;";

    const wrapperAlign =
      align === "center"
        ? "text-align: center;"
        : align === "right"
          ? "text-align: right;"
          : align === "full"
            ? "text-align: center; width: 100%;"
            : "text-align: left;";

    // Resolve icon HTML
    let iconHtml = "";
    if (iconSource === "custom" && customIconUrl.trim()) {
      const px = getCustomIconPx();
      iconHtml = `<img src="${customIconUrl.trim()}" alt="" style="width: ${px}px; height: ${px}px; object-fit: contain; vertical-align: middle; display: inline-block; flex-shrink: 0; border-radius: 4px;" />`;
    } else if (iconSource === "preset" && icon !== "none") {
      let iconSymbol = "";
      if (icon === "arrow") iconSymbol = "→";
      else if (icon === "external") iconSymbol = "↗";
      else if (icon === "play") iconSymbol = "▶";
      else if (icon === "book") iconSymbol = "📖";
      else if (icon === "download") iconSymbol = "📥";
      else if (icon === "sparkles") iconSymbol = "✨";
      else if (icon === "calendar") iconSymbol = "📅";
      else if (icon === "heart") iconSymbol = "❤️";
      else if (icon === "shield") iconSymbol = "🛡️";
      else if (icon === "help") iconSymbol = "❓";
      if (iconSymbol) {
        iconHtml = `<span style="display: inline-block; vertical-align: middle; line-height: 1;">${iconSymbol}</span>`;
      }
    }

    const labelText = label.trim();
    let contentHtml = "";

    if (customIconPosition === "only" && iconHtml) {
      contentHtml = iconHtml;
    } else if (customIconPosition === "top" && iconHtml) {
      contentHtml = `<span style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.35rem;">${iconHtml}<span>${labelText}</span></span>`;
    } else if (customIconPosition === "left" && iconHtml) {
      contentHtml = `<span style="display: inline-flex; align-items: center; gap: 0.5rem;">${iconHtml}<span>${labelText}</span></span>`;
    } else if (iconHtml) {
      contentHtml = `<span style="display: inline-flex; align-items: center; gap: 0.5rem;"><span>${labelText}</span>${iconHtml}</span>`;
    } else {
      contentHtml = `<span>${labelText}</span>`;
    }

    const sublabelHtml = sublabel.trim()
      ? `<span style="display: block; font-size: 0.75rem; font-weight: 500; opacity: 0.85; margin-top: 3px;">${sublabel.trim()}</span>`
      : "";

    const targetAttr = openInNewTab ? 'target="_blank" rel="noopener noreferrer"' : "";

    return `
      <div class="article-button-wrapper" style="margin: 1.75rem 0; ${wrapperAlign} clear: both;">
        <a href="${finalUrl}" ${targetAttr} class="article-interactive-button" style="text-decoration: none; font-family: inherit; font-weight: 700; ${fontSize} line-height: 1.25; border-radius: ${radius}; padding: ${padding}; ${bgStyle} ${borderStyle} color: ${effectiveTextColor}; ${shadowStyle} ${widthStyle} align-items: center; justify-content: center; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;">
          ${contentHtml}
          ${sublabelHtml}
        </a>
      </div>
      <p><br></p>
    `;
  };

  const handleApply = () => {
    const html = generateButtonHtml();
    onInsert(html, insertPosition);
    onOpenChange(false);
  };

  const SelectedPresetIcon = iconSource === "preset" ? ICONS_MAP[icon] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-foreground">
            <Sparkles className="size-5 text-primary" />
            <span>Diseñador de Botones y Enlaces Interactivos</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Crea botones atractivos con tus propios iconos o imágenes personalizadas para continuar
            la lectura o enlaces CTA dentro del artículo.
          </p>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => setMode("next_article")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === "next_article"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="size-4 text-primary" />
              <span>Siguiente Artículo</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("custom_link")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === "custom_link"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LinkIcon className="size-4 text-primary" />
              <span>Enlace Personalizado (CTA)</span>
            </button>
          </div>

          {/* Destination Selector */}
          {mode === "next_article" ? (
            <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/20 p-3 sm:p-4">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Seleccionar Artículo de Destino</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  {articles.length} artículos disponibles
                </span>
              </label>

              <div className="relative">
                <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  placeholder="Buscar artículo por título o tema..."
                  className="pl-9 text-xs rounded-xl h-9"
                />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-border/60 bg-card p-1">
                {isLoadingArticles ? (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    Cargando artículos...
                  </p>
                ) : filteredArticles.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    No se encontraron artículos con esa búsqueda.
                  </p>
                ) : (
                  filteredArticles.map((art) => {
                    const title = art.article_translations?.[0]?.title || art.slug;
                    const isSelected = selectedSlug === art.slug;
                    return (
                      <button
                        key={art.id || art.slug}
                        type="button"
                        onClick={() => handleSelectArticle(art.slug)}
                        className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-bold"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <span className="truncate">{title}</span>
                        {isSelected && <Check className="size-3.5 shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-3 sm:p-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  URL de Destino (Enlace)
                </label>
                <Input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://... o /calendario o /documento.pdf"
                  className="rounded-xl text-xs h-9"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={openInNewTab}
                  onChange={(e) => setOpenInNewTab(e.target.checked)}
                  className="rounded accent-primary"
                />
                <span>Abrir en nueva pestaña (target="_blank")</span>
              </label>
            </div>
          )}

          {/* Button Text & Subtext */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Texto Principal del Botón
              </label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ej: Continuar con el siguiente artículo"
                className="rounded-xl text-xs h-9"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Subtexto / Etiqueta Opcional
              </label>
              <Input
                value={sublabel}
                onChange={(e) => setSublabel(e.target.value)}
                placeholder="Ej: Lectura de 3 min • Paso 2"
                className="rounded-xl text-xs h-9"
              />
            </div>
          </div>

          {/* SECTION: Icon / Custom Image for the Button */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
                <ImageIcon className="size-4 text-primary" />
                <span>Icono o Imagen del Botón</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                Sube tu propio icono PNG/SVG o elige de la biblioteca
              </span>
            </div>

            {/* Icon Source Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => setIconSource("preset")}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                  iconSource === "preset"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Icono de Biblioteca
              </button>
              <button
                type="button"
                onClick={() => setIconSource("custom")}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                  iconSource === "custom"
                    ? "bg-card text-foreground shadow-2xs text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Subir Mi Propio Icono
              </button>
              <button
                type="button"
                onClick={() => {
                  setIconSource("none");
                  setIcon("none");
                }}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                  iconSource === "none"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sin Icono
              </button>
            </div>

            {/* SUBIR ICONO PERSONALIZADO */}
            {iconSource === "custom" && (
              <div className="space-y-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* File upload button */}
                  <input
                    ref={iconFileInputRef}
                    type="file"
                    accept="image/*,.svg"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploadingIcon}
                    onClick={() => iconFileInputRef.current?.click()}
                    className="w-full sm:w-auto h-10 gap-2 rounded-xl text-xs font-bold border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Upload className="size-4" />
                    <span>
                      {isUploadingIcon
                        ? "Procesando imagen..."
                        : "Subir icono desde mi dispositivo"}
                    </span>
                  </Button>

                  <span className="text-[11px] text-muted-foreground">
                    o pega la URL de la imagen:
                  </span>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="https://... o data:image/png..."
                    value={customIconUrl}
                    onChange={(e) => setCustomIconUrl(e.target.value)}
                    className="h-9 rounded-xl text-xs flex-1 bg-card"
                  />
                  {customIconUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setCustomIconUrl("")}
                      className="size-9 rounded-xl text-destructive hover:bg-destructive/10"
                      title="Eliminar icono"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>

                {customIconUrl && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border/60">
                    <div className="size-10 rounded-lg bg-muted/30 border border-border/80 flex items-center justify-center p-1 overflow-hidden">
                      <img
                        src={customIconUrl}
                        alt="Icono subido"
                        className="size-full object-contain"
                      />
                    </div>
                    <div className="text-xs flex-1 min-w-0">
                      <p className="font-bold text-foreground">Icono cargado correctamente</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Aparecerá en el botón con alta resolución.
                      </p>
                    </div>
                  </div>
                )}

                {/* Custom Icon Options: Position & Size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <div>
                    <label className="text-[11px] font-bold text-foreground block mb-1">
                      Posición del Icono
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: "left", label: "Izquierda" },
                        { id: "right", label: "Derecha" },
                        { id: "top", label: "Arriba" },
                        { id: "only", label: "Solo Icono" },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setCustomIconPosition(pos.id as any)}
                          className={`py-1 text-[11px] font-bold rounded-lg border transition-all ${
                            customIconPosition === pos.id
                              ? "bg-primary text-white border-primary shadow-2xs"
                              : "border-border/60 bg-card text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-foreground block mb-1">
                      Tamaño del Icono
                    </label>
                    <div className="grid grid-cols-5 gap-1">
                      {[
                        { id: "xs", label: "16px" },
                        { id: "sm", label: "20px" },
                        { id: "md", label: "24px" },
                        { id: "lg", label: "32px" },
                        { id: "xl", label: "44px" },
                      ].map((sz) => (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => setCustomIconSize(sz.id as any)}
                          className={`py-1 text-[11px] font-bold rounded-lg border transition-all ${
                            customIconSize === sz.id
                              ? "bg-primary text-white border-primary shadow-2xs"
                              : "border-border/60 bg-card text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRESET ICONS LIBRARY */}
            {iconSource === "preset" && (
              <div className="space-y-2 animate-in fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: "arrow", label: "Flecha", symbol: "→" },
                    { id: "external", label: "Externo", symbol: "↗" },
                    { id: "play", label: "Reproducir", symbol: "▶" },
                    { id: "book", label: "Libro", symbol: "📖" },
                    { id: "download", label: "Descargar", symbol: "📥" },
                    { id: "sparkles", label: "Estrellas", symbol: "✨" },
                    { id: "calendar", label: "Calendario", symbol: "📅" },
                    { id: "heart", label: "Corazón", symbol: "❤️" },
                    { id: "shield", label: "Seguridad", symbol: "🛡️" },
                    { id: "help", label: "Ayuda", symbol: "❓" },
                  ].map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setIcon(ic.id as any)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all ${
                        icon === ic.id
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="text-sm">{ic.symbol}</span>
                      <span className="truncate text-[11px]">{ic.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Posición de icono predeterminado:
                  </span>
                  <div className="flex gap-1">
                    {[
                      { id: "left", label: "Izquierda" },
                      { id: "right", label: "Derecha" },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setCustomIconPosition(pos.id as any)}
                        className={`py-0.5 px-2 text-[10px] font-bold rounded-md border transition-all ${
                          customIconPosition === pos.id
                            ? "bg-primary text-white border-primary"
                            : "border-border/60 bg-card text-muted-foreground"
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Color Customization */}
          <div>
            <label className="text-xs font-bold text-foreground flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <Palette className="size-3.5 text-primary" />
                <span>Color y Apariencia</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Color HEX:</span>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="size-6 cursor-pointer rounded-md border border-border"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-20 rounded-md border border-border px-2 py-0.5 text-xs font-mono"
                />
              </div>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PRESET_BUTTON_COLORS.map((c) => {
                const isSelected = bgColor.toLowerCase() === c.bg.toLowerCase();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setBgColor(c.bg);
                      setTextColor(c.text);
                    }}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30 shadow-xs bg-muted/60"
                        : "border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className="size-4 shrink-0 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: c.bg }}
                    />
                    <span className="text-[11px] font-semibold truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shape & Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Forma del Botón
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "pill", label: "Píldora", icon: "🟢" },
                  { id: "rounded-xl", label: "Curvo", icon: "🔲" },
                  { id: "rounded-md", label: "Medio", icon: "⏹️" },
                  { id: "square", label: "Recto", icon: "◻️" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setShape(s.id as ArticleButtonConfig["shape"])}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                      shape === s.id
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/60 text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-base">{s.icon}</span>
                    <span className="text-[10px] mt-0.5">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Decoración / Estilo Visual
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "solid", label: "Sólido" },
                  { id: "gradient", label: "Gradiente" },
                  { id: "outline", label: "Contorno" },
                  { id: "elevated", label: "3D Elevado" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStyleType(st.id as ArticleButtonConfig["styleType"])}
                    className={`rounded-xl border p-2 text-center text-xs transition-all ${
                      styleType === st.id
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/60 text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Size, Alignment & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Tamaño del Botón
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as ArticleButtonConfig["size"])}
                className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="sm">Pequeño</option>
                <option value="md">Mediano (Normal)</option>
                <option value="lg">Grande (Destacado)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Alineación</label>
              <select
                value={align}
                onChange={(e) => setAlign(e.target.value as ArticleButtonConfig["align"])}
                className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="center">Centrado</option>
                <option value="left">Izquierda</option>
                <option value="right">Derecha</option>
                <option value="full">Ancho Completo (100%)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Insertar En</label>
              <select
                value={insertPosition}
                onChange={(e) =>
                  setInsertPosition(e.target.value as ArticleButtonConfig["insertPosition"])
                }
                className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-primary"
              >
                <option value="end">Al final del artículo</option>
                <option value="cursor">En el cursor (en medio)</option>
              </select>
            </div>
          </div>

          {/* REAL TIME PREVIEW */}
          <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                Vista Previa en Tiempo Real
              </span>
              <span className="text-[10px] text-primary font-bold">
                {iconSource === "custom" && customIconUrl ? "✓ Con icono personalizado" : ""}
              </span>
            </div>

            <div
              className={`p-4 rounded-xl bg-card border border-border/40 min-h-[90px] flex items-center ${
                align === "center" || align === "full"
                  ? "justify-center"
                  : align === "right"
                    ? "justify-end"
                    : "justify-start"
              }`}
            >
              <div
                style={{
                  backgroundColor: styleType === "outline" ? "transparent" : bgColor,
                  background:
                    styleType === "gradient"
                      ? `linear-gradient(135deg, ${bgColor} 0%, #3b82f6 100%)`
                      : undefined,
                  color: styleType === "outline" ? bgColor : textColor,
                  borderRadius:
                    shape === "pill"
                      ? "9999px"
                      : shape === "rounded-xl"
                        ? "1rem"
                        : shape === "rounded-md"
                          ? "0.5rem"
                          : "0px",
                  border:
                    styleType === "outline"
                      ? `2.5px solid ${bgColor}`
                      : styleType === "elevated"
                        ? `1px solid ${bgColor}`
                        : "none",
                  borderBottom: styleType === "elevated" ? "4px solid rgba(0,0,0,0.25)" : undefined,
                  boxShadow:
                    styleType === "elevated"
                      ? "0 8px 24px rgba(0,0,0,0.18)"
                      : styleType === "solid"
                        ? "0 4px 14px rgba(0,0,0,0.12)"
                        : undefined,
                  padding:
                    size === "sm"
                      ? "0.6rem 1.25rem"
                      : size === "lg"
                        ? "1.1rem 2.25rem"
                        : "0.875rem 1.75rem",
                  fontSize: size === "sm" ? "0.875rem" : size === "lg" ? "1.125rem" : "1rem",
                  width: align === "full" ? "100%" : "auto",
                  textAlign: "center",
                }}
                className="font-bold inline-flex flex-col items-center justify-center transition-all cursor-default select-none"
              >
                <div
                  className={`flex items-center gap-2 ${
                    customIconPosition === "top" ? "flex-col" : "flex-row"
                  }`}
                >
                  {/* Left custom or preset icon */}
                  {customIconPosition === "left" && (
                    <>
                      {iconSource === "custom" && customIconUrl && (
                        <img
                          src={customIconUrl}
                          alt=""
                          style={{
                            width: `${getCustomIconPx()}px`,
                            height: `${getCustomIconPx()}px`,
                          }}
                          className="object-contain shrink-0 rounded-xs"
                        />
                      )}
                      {SelectedPresetIcon && <SelectedPresetIcon className="size-4" />}
                    </>
                  )}

                  {/* Top custom icon */}
                  {customIconPosition === "top" && iconSource === "custom" && customIconUrl && (
                    <img
                      src={customIconUrl}
                      alt=""
                      style={{
                        width: `${getCustomIconPx()}px`,
                        height: `${getCustomIconPx()}px`,
                      }}
                      className="object-contain shrink-0 rounded-xs"
                    />
                  )}

                  {/* Button text */}
                  {customIconPosition !== "only" && <span>{label || "Texto del Botón"}</span>}

                  {/* Only icon */}
                  {customIconPosition === "only" && (
                    <>
                      {iconSource === "custom" && customIconUrl && (
                        <img
                          src={customIconUrl}
                          alt=""
                          style={{
                            width: `${getCustomIconPx()}px`,
                            height: `${getCustomIconPx()}px`,
                          }}
                          className="object-contain shrink-0 rounded-xs"
                        />
                      )}
                      {SelectedPresetIcon && <SelectedPresetIcon className="size-5" />}
                    </>
                  )}

                  {/* Right custom or preset icon */}
                  {customIconPosition === "right" && (
                    <>
                      {iconSource === "custom" && customIconUrl && (
                        <img
                          src={customIconUrl}
                          alt=""
                          style={{
                            width: `${getCustomIconPx()}px`,
                            height: `${getCustomIconPx()}px`,
                          }}
                          className="object-contain shrink-0 rounded-xs"
                        />
                      )}
                      {SelectedPresetIcon && <SelectedPresetIcon className="size-4" />}
                    </>
                  )}
                </div>

                {sublabel.trim() && (
                  <span className="text-[11px] opacity-85 font-medium mt-0.5">
                    {sublabel.trim()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex sm:justify-between items-center gap-2 border-t border-border pt-4">
          <Button
            variant="ghost"
            type="button"
            className="rounded-xl text-xs font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            className="rounded-xl text-xs font-bold gap-2 px-5 min-h-10"
            onClick={handleApply}
          >
            <Check className="size-4" />
            <span>
              {insertPosition === "end" ? "Insertar al final del artículo" : "Insertar en el texto"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
