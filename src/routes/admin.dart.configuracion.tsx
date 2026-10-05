import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Languages,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Smartphone,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadInput } from "@/components/file-upload-input";
import {
  AppArticleData,
  DEFAULT_APP_ARTICLE,
  fetchAppArticle,
  getLocalizedAppArticle,
  saveAppArticle,
} from "@/lib/app-article";
import { autoTranslateText } from "@/lib/auto-translator";

export const Route = createFileRoute("/admin/dart/configuracion")({
  head: () => ({
    meta: [
      { title: "Gestión del Artículo de la App — Administración DMPS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAppArticleEditorPage,
});

const PRESET_IMAGES = [
  {
    label: "Móvil Escolar Moderno (Pantalla)",
    url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Estudiantes con Dispositivo",
    url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Familia y Tecnología Escolar",
    url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Tablet & Portal Educativo",
    url: "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1200&q=80",
  },
];

export const AdminDartConfigPage = AdminAppArticleEditorPage;

export function AdminAppArticleEditorPage() {
  const [formData, setFormData] = useState<AppArticleData>(DEFAULT_APP_ARTICLE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [newFeature, setNewFeature] = useState("");
  const [activeTab, setActiveTab] = useState("editor");
  const [editLang, setEditLang] = useState<"es" | "en">("es");

  // Load current saved article data on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await fetchAppArticle();
        if (isMounted) {
          setFormData(data);
        }
      } catch (err) {
        console.error("Error loading app article:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field: keyof AppArticleData, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTranslateEsToEn = async () => {
    setIsTranslating(true);
    try {
      let titleEn = autoTranslateText(formData.title, "en");
      let subtitleEn = autoTranslateText(formData.subtitle, "en");
      const badgeTextEn = autoTranslateText(formData.badgeText, "en");
      const platformEn = autoTranslateText(formData.platform, "en");
      const secondaryUrlLabelEn = formData.secondaryUrlLabel
        ? autoTranslateText(formData.secondaryUrlLabel, "en")
        : "";
      const versionEn = formData.version ? autoTranslateText(formData.version, "en") : "";
      let descriptionEn = autoTranslateText(formData.description, "en");
      const featuresEn = (formData.features || []).map((f) => autoTranslateText(f, "en"));

      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            summary: formData.subtitle,
            bodyHtml: formData.description,
            sourceLang: "es",
            targetLang: "en",
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.title?.trim()) titleEn = json.title.trim();
          if (json.summary?.trim()) subtitleEn = json.summary.trim();
          if (json.bodyHtml?.trim()) descriptionEn = json.bodyHtml.trim();
        }
      } catch {
        // Fallback already computed via autoTranslateText
      }

      setFormData((prev) => ({
        ...prev,
        titleEn,
        subtitleEn,
        badgeTextEn,
        platformEn,
        secondaryUrlLabelEn,
        versionEn,
        descriptionEn,
        featuresEn,
        imageUrlEn: prev.imageUrlEn || prev.imageUrl,
      }));
      setEditLang("en");
      toast.success("Traducción al inglés completada. Puedes revisarla o editarla aquí.");
    } finally {
      setIsTranslating(false);
    }
  };

  const currentFeatures = editLang === "es" ? formData.features || [] : formData.featuresEn || [];

  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    if (currentFeatures.includes(trimmed)) {
      toast.info("Esta característica ya está en la lista.");
      return;
    }
    if (editLang === "es") {
      const nextEs = [...(formData.features || []), trimmed];
      const translatedFeat = autoTranslateText(trimmed, "en");
      const nextEn = [...(formData.featuresEn || []), translatedFeat];
      setFormData((prev) => ({
        ...prev,
        features: nextEs,
        featuresEn: nextEn,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        featuresEn: [...(prev.featuresEn || []), trimmed],
      }));
    }
    setNewFeature("");
  };

  const handleRemoveFeature = (indexToRemove: number) => {
    if (editLang === "es") {
      setFormData((prev) => ({
        ...prev,
        features: (prev.features || []).filter((_, idx) => idx !== indexToRemove),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        featuresEn: (prev.featuresEn || []).filter((_, idx) => idx !== indexToRemove),
      }));
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.title.trim() && !(formData.titleEn || "").trim()) {
      toast.error("El título de la app es obligatorio.");
      return;
    }
    if (!formData.appUrl.trim()) {
      toast.error("El enlace de descarga o acceso de la app es obligatorio.");
      return;
    }
    if (!formData.description.trim() && !(formData.descriptionEn || "").trim()) {
      toast.error("La información o descripción de la app no puede estar vacía.");
      return;
    }

    setIsSaving(true);
    try {
      const payloadToSave: AppArticleData = {
        ...formData,
        title: formData.title.trim() || autoTranslateText(formData.titleEn || "", "es"),
        titleEn: (formData.titleEn || "").trim() || autoTranslateText(formData.title, "en"),
        subtitle: formData.subtitle.trim() || autoTranslateText(formData.subtitleEn || "", "es"),
        subtitleEn:
          (formData.subtitleEn || "").trim() || autoTranslateText(formData.subtitle, "en"),
        badgeText: formData.badgeText.trim() || autoTranslateText(formData.badgeTextEn || "", "es"),
        badgeTextEn:
          (formData.badgeTextEn || "").trim() || autoTranslateText(formData.badgeText, "en"),
        platform: formData.platform.trim() || autoTranslateText(formData.platformEn || "", "es"),
        platformEn:
          (formData.platformEn || "").trim() || autoTranslateText(formData.platform, "en"),
        description:
          formData.description.trim() || autoTranslateText(formData.descriptionEn || "", "es"),
        descriptionEn:
          (formData.descriptionEn || "").trim() || autoTranslateText(formData.description, "en"),
        imageUrl: formData.imageUrl || formData.imageUrlEn || DEFAULT_APP_ARTICLE.imageUrl,
        imageUrlEn: formData.imageUrlEn || formData.imageUrl || DEFAULT_APP_ARTICLE.imageUrlEn,
        featuresEn:
          formData.featuresEn && formData.featuresEn.length > 0
            ? formData.featuresEn
            : (formData.features || []).map((f) => autoTranslateText(f, "en")),
      };

      const saved = await saveAppArticle(payloadToSave);
      setFormData(saved);
      toast.success("✓ Artículo de la app guardado en Español e Inglés", {
        description:
          "Ambas versiones están listas. El botón de idioma del sitio mostrará el idioma correspondiente.",
      });
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Ocurrió un error al guardar la información. Por favor reintenta.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setFormData({
      ...DEFAULT_APP_ARTICLE,
      updatedAt: new Date().toISOString(),
    });
    toast.info(
      "Valores restablecidos a los predeterminados (ES / EN). Recuerda presionar Guardar.",
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="size-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Cargando artículo de la app...</span>
        </div>
      </div>
    );
  }

  const previewArticle = getLocalizedAppArticle(formData, editLang);
  const currentImage =
    editLang === "es" ? formData.imageUrl || "" : formData.imageUrlEn || formData.imageUrl || "";

  return (
    <div
      id="app_article_editor"
      data-testid="tab-app-article-editor"
      className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8"
    >
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Smartphone className="size-3.5" />
            <span>Módulo Bilingüe de la Aplicación Móvil (ES / EN)</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Gestión del Artículo de la App
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configura las dos versiones (Español e Inglés) de la aplicación oficial. En la página
            pública, el botón de cambiar idioma de siempre mostrará automáticamente la versión
            correspondiente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/transporte/dart">
              <Eye className="mr-2 size-4" />
              <span>Ver Artículo Público</span>
            </Link>
          </Button>

          <Button
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="rounded-xl font-bold"
          >
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 size-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                <span>Guardar Cambios (ES / EN)</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Language Switcher Bar (Español / Inglés) like in the rest of Admin */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Languages className="size-4 text-primary" />
              <span>Idioma de Edición (Dos Versiones: Español e Inglés)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Edita la imagen, título, descripción y características en ambos idiomas.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
            {[
              {
                code: "es" as const,
                label: "🇪🇸 Español (Principal)",
                ready: Boolean(formData.title?.trim() && formData.description?.trim()),
              },
              {
                code: "en" as const,
                label: "🇺🇸 English (Inglés)",
                ready: Boolean(formData.titleEn?.trim() && formData.descriptionEn?.trim()),
              },
            ].map((langItem) => {
              const isActive = editLang === langItem.code;
              return (
                <button
                  key={langItem.code}
                  type="button"
                  onClick={() => setEditLang(langItem.code)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <span>{langItem.label}</span>
                  <span
                    className={`size-2 rounded-full ${
                      langItem.ready ? (isActive ? "bg-white" : "bg-emerald-500") : "bg-amber-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/30 px-3.5 py-2 rounded-xl border border-border/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">
              Editando ahora:{" "}
              <span className="text-primary font-extrabold">
                {editLang === "es" ? "🇪🇸 Versión en Español" : "🇺🇸 Versión en Inglés (English)"}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isTranslating}
              onClick={() => void handleTranslateEsToEn()}
              className="h-7 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg gap-1.5"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Traduciendo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>⚡ Auto-traducir todo de Español a Inglés</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs: Editor vs Live Preview */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/80 p-1 sm:w-auto sm:inline-flex">
            <TabsTrigger value="editor" className="rounded-xl px-5 py-2 font-semibold">
              <Sparkles className="mr-2 size-4" />
              <span>Editor ({editLang === "es" ? "Español" : "English"})</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="rounded-xl px-5 py-2 font-semibold">
              <Eye className="mr-2 size-4" />
              <span>Vista Previa ({editLang === "es" ? "Español" : "English"})</span>
            </TabsTrigger>
          </TabsList>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToDefaults}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            <span>Restaurar Valores por Defecto</span>
          </Button>
        </div>

        {/* Tab 1: Editor Form */}
        <TabsContent value="editor" className="space-y-6">
          <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
            {/* Core Links & Visuals Card */}
            <Card className="rounded-3xl border border-border shadow-xs">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Link2 className="size-5 text-primary" />
                  <span>
                    Enlaces y Fotografía de la App (
                    {editLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"})
                  </span>
                </CardTitle>
                <CardDescription>
                  El enlace directo de descarga y la imagen de la aplicación. El espacio se adapta
                  automáticamente al tamaño y forma de tu imagen sin recortarla.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Primary App Link */}
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="appUrl" className="font-semibold text-foreground">
                        Enlace principal de la App (Link){" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      {formData.appUrl && (
                        <a
                          href={formData.appUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <span>Probar enlace</span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                    <Input
                      id="appUrl"
                      type="url"
                      placeholder="https://apps.apple.com/... o https://play.google.com/..."
                      value={formData.appUrl}
                      onChange={(e) => {
                        handleChange("appUrl", e.target.value);
                        handleChange("appUrlEn", e.target.value);
                      }}
                      required
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Puedes colocar el enlace a Apple App Store, Google Play Store o portal web de
                      la app.
                    </p>
                  </div>

                  {/* Secondary Link (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="secondaryUrl" className="font-semibold text-foreground">
                      Enlace secundario (Opcional)
                    </Label>
                    <Input
                      id="secondaryUrl"
                      type="url"
                      placeholder="https://play.google.com/store/apps/details?id=..."
                      value={formData.secondaryUrl || ""}
                      onChange={(e) => handleChange("secondaryUrl", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryUrlLabel" className="font-semibold text-foreground">
                      Etiqueta del enlace secundario (
                      {editLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"})
                    </Label>
                    <Input
                      id="secondaryUrlLabel"
                      placeholder={
                        editLang === "es"
                          ? "Ej. Descargar en Google Play"
                          : "Ex. Download on Google Play"
                      }
                      value={
                        editLang === "es"
                          ? formData.secondaryUrlLabel || ""
                          : formData.secondaryUrlLabelEn || ""
                      }
                      onChange={(e) =>
                        handleChange(
                          editLang === "es" ? "secondaryUrlLabel" : "secondaryUrlLabelEn",
                          e.target.value,
                        )
                      }
                      className="rounded-xl"
                    />
                  </div>

                  {/* App Image / Device Upload per language */}
                  <div className="space-y-3 sm:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">
                        Fotografía o Captura de la App (
                        {editLang === "es" ? "🇪🇸 Versión Español" : "🇺🇸 Versión Inglés"})
                      </span>
                      {currentImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              imageUrl: currentImage,
                              imageUrlEn: currentImage,
                            }));
                            toast.success("Imagen aplicada tanto a Español como a Inglés.");
                          }}
                          className="h-7 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 gap-1"
                        >
                          <Copy className="size-3" />
                          <span>Usar esta misma imagen en Español e Inglés</span>
                        </Button>
                      )}
                    </div>

                    <FileUploadInput
                      id={`imageUrl-${editLang}`}
                      value={currentImage}
                      onChange={(url) => {
                        if (editLang === "es") {
                          setFormData((prev) => ({
                            ...prev,
                            imageUrl: url,
                            imageUrlEn: prev.imageUrlEn || url,
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            imageUrlEn: url,
                            imageUrl: prev.imageUrl || url,
                          }));
                        }
                      }}
                      helperText="El contenedor se adaptará exactamente al tamaño y proporciones de tu imagen sin recortarla."
                      placeholder="https://... o sube una imagen desde tu teléfono o computadora"
                      accept="image/*"
                      showPreview={true}
                    />

                    {/* Presets buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs text-muted-foreground">
                        O elige una imagen sugerida:
                      </span>
                      {PRESET_IMAGES.map((preset, idx) => (
                        <Button
                          key={idx}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (editLang === "es") {
                              handleChange("imageUrl", preset.url);
                            } else {
                              handleChange("imageUrlEn", preset.url);
                            }
                          }}
                          className="h-7 rounded-lg text-xs"
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Title & Metadata Card */}
            <Card className="rounded-3xl border border-border shadow-xs">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Smartphone className="size-5 text-primary" />
                  <span>
                    Título, Subtítulo y Plataformas (
                    {editLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"})
                  </span>
                </CardTitle>
                <CardDescription>
                  Datos descriptivos que se muestran en el encabezado principal cuando el visitante
                  selecciona {editLang === "es" ? "Español" : "Inglés"}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="title" className="font-semibold text-foreground">
                      Título de la Aplicación ({editLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"}){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder={
                        editLang === "es"
                          ? "Ej. DMPS Connect & Portal de Familias"
                          : "Ex. DMPS Connect & Family Portal"
                      }
                      value={editLang === "es" ? formData.title : formData.titleEn || ""}
                      onChange={(e) =>
                        handleChange(editLang === "es" ? "title" : "titleEn", e.target.value)
                      }
                      required
                      className="rounded-xl font-medium"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="subtitle" className="font-semibold text-foreground">
                      Subtítulo o Resumen Corto ({editLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"})
                    </Label>
                    <Input
                      id="subtitle"
                      placeholder={
                        editLang === "es"
                          ? "Breve resumen visible en el encabezado"
                          : "Brief summary visible in the header"
                      }
                      value={editLang === "es" ? formData.subtitle : formData.subtitleEn || ""}
                      onChange={(e) =>
                        handleChange(editLang === "es" ? "subtitle" : "subtitleEn", e.target.value)
                      }
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="badgeText" className="font-semibold text-foreground">
                      Etiqueta Destacada (Badge) ({editLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"})
                    </Label>
                    <Input
                      id="badgeText"
                      placeholder={
                        editLang === "es"
                          ? "Ej. Aplicación Oficial Recomendada"
                          : "Ex. Recommended Official Application"
                      }
                      value={editLang === "es" ? formData.badgeText : formData.badgeTextEn || ""}
                      onChange={(e) =>
                        handleChange(
                          editLang === "es" ? "badgeText" : "badgeTextEn",
                          e.target.value,
                        )
                      }
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform" className="font-semibold text-foreground">
                      Plataformas Disponibles ({editLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"})
                    </Label>
                    <Input
                      id="platform"
                      placeholder={
                        editLang === "es"
                          ? "Ej. iOS • Android • Portal Web"
                          : "Ex. iOS • Android • Web Portal"
                      }
                      value={editLang === "es" ? formData.platform : formData.platformEn || ""}
                      onChange={(e) =>
                        handleChange(editLang === "es" ? "platform" : "platformEn", e.target.value)
                      }
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="developer" className="font-semibold text-foreground">
                      Desarrollador u Organización
                    </Label>
                    <Input
                      id="developer"
                      placeholder="Ej. Des Moines Public Schools"
                      value={formData.developer || ""}
                      onChange={(e) => handleChange("developer", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="version" className="font-semibold text-foreground">
                      Versión o Estado ({editLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"})
                    </Label>
                    <Input
                      id="version"
                      placeholder={editLang === "es" ? "Ej. v4.2 Oficial" : "Ex. v4.2 Official"}
                      value={editLang === "es" ? formData.version || "" : formData.versionEn || ""}
                      onChange={(e) =>
                        handleChange(editLang === "es" ? "version" : "versionEn", e.target.value)
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Information and Full Description */}
            <Card className="rounded-3xl border border-border shadow-xs">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Sparkles className="size-5 text-primary" />
                  <span>
                    Información y Descripción de la App (
                    {editLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"})
                  </span>
                </CardTitle>
                <CardDescription>
                  El cuerpo principal del artículo en {editLang === "es" ? "Español" : "Inglés"}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="font-semibold text-foreground">
                      Cuerpo del Artículo ({editLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"}){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      Admite subtítulos con ### y negrita con **texto**
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    rows={12}
                    placeholder={
                      editLang === "es"
                        ? "Escribe la información detallada de la aplicación en español..."
                        : "Write the detailed application information in English..."
                    }
                    value={editLang === "es" ? formData.description : formData.descriptionEn || ""}
                    onChange={(e) =>
                      handleChange(
                        editLang === "es" ? "description" : "descriptionEn",
                        e.target.value,
                      )
                    }
                    required
                    className="font-mono text-sm leading-relaxed rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Key Features List */}
            <Card className="rounded-3xl border border-border shadow-xs">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <span>
                    Características y Puntos Clave (
                    {editLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"})
                  </span>
                </CardTitle>
                <CardDescription>
                  Listado de beneficios rápidos en {editLang === "es" ? "Español" : "Inglés"}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      editLang === "es"
                        ? "Nueva característica en español..."
                        : "New feature in English..."
                    }
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleAddFeature}
                    className="rounded-xl font-semibold"
                  >
                    <Plus className="mr-1.5 size-4" />
                    <span>Agregar</span>
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {currentFeatures.map((feat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/40 px-3.5 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                        <span className="truncate font-medium text-foreground">{feat}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFeature(index)}
                        className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bottom Save Action */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/transporte/dart">Cancelar / Ver Sitio</Link>
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                size="lg"
                className="rounded-xl px-6 font-bold shadow-md"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    <span>Guardar Artículo (Español e Inglés)</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Tab 2: Live Preview */}
        <TabsContent value="preview">
          <Card className="overflow-hidden rounded-3xl border border-border shadow-md">
            <div className="border-b border-border bg-muted/60 px-6 py-3 text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>
                Vista Previa ({editLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"}): Así verán el
                artículo los visitantes
              </span>
              <Badge variant="outline" className="bg-background text-xs">
                {editLang === "es" ? "Español" : "English"}
              </Badge>
            </div>

            <div className="p-6 sm:p-10 space-y-8 bg-background">
              <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                {/* Preview Hero Left */}
                <div className="space-y-4 lg:col-span-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-primary/20">
                      <Sparkles className="mr-1.5 size-3" />
                      {previewArticle.badgeText ||
                        (editLang === "es" ? "App Oficial" : "Official App")}
                    </Badge>
                    {previewArticle.platform && (
                      <Badge variant="outline" className="text-muted-foreground">
                        {previewArticle.platform}
                      </Badge>
                    )}
                    {previewArticle.version && (
                      <Badge variant="outline" className="text-muted-foreground">
                        {previewArticle.version}
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                    {previewArticle.title || "Título de la Aplicación"}
                  </h1>

                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
                    {previewArticle.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button asChild size="lg" className="rounded-2xl font-bold">
                      <a href={previewArticle.appUrl} target="_blank" rel="noreferrer">
                        <span>
                          {editLang === "es" ? "Abrir / Descargar App" : "Download / Open App"}
                        </span>
                        <ArrowUpRight className="ml-1.5 size-4" />
                      </a>
                    </Button>

                    {previewArticle.secondaryUrl && (
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="rounded-2xl font-semibold"
                      >
                        <a href={previewArticle.secondaryUrl} target="_blank" rel="noreferrer">
                          <span>
                            {previewArticle.secondaryUrlLabel ||
                              (editLang === "es" ? "Ver en otra tienda" : "Alternative Store")}
                          </span>
                          <ExternalLink className="ml-1.5 size-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Preview Image Right - Adaptive Container */}
                {previewArticle.imageUrl && (
                  <div className="lg:col-span-5 flex justify-center">
                    <div className="inline-block w-fit max-w-full overflow-hidden rounded-3xl border border-border/80 bg-card p-2 shadow-xl">
                      <img
                        src={previewArticle.imageUrl}
                        alt={previewArticle.title}
                        referrerPolicy="no-referrer"
                        className="block h-auto max-h-[70vh] w-auto max-w-full rounded-2xl"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Features */}
              {previewArticle.features && previewArticle.features.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">
                    {editLang === "es" ? "Funciones Principales" : "Key Features"}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {previewArticle.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs"
                      >
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                        <span className="text-sm font-medium text-foreground">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Description */}
              <div className="space-y-3 pt-2 border-t border-border">
                <h3 className="text-lg font-bold text-foreground">
                  {editLang === "es" ? "Información Detallada" : "Detailed Information"}
                </h3>
                <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground whitespace-pre-line text-sm sm:text-base leading-relaxed">
                  {previewArticle.description}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
