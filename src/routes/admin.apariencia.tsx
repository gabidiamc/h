/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  ImageIcon,
  Moon,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Upload,
  Sparkles,
  Link as LinkIcon,
  X,
  Laptop,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import defaultLogoAsset from "@/assets/dmps-info-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAppearance, type AppearanceRow } from "@/lib/directory";
import { logAudit, upsertRow } from "@/lib/admin";
import {
  uploadBrandingAsset,
  validateBrandingFile,
  cleanupOldBrandingAsset,
  applyFaviconToDocument,
  applyPwaIconToDocument,
  type BrandingAssetType,
} from "@/lib/branding";

export const Route = createFileRoute("/admin/apariencia")({
  component: AdminBrandingIdentityPage,
});

function AdminBrandingIdentityPage() {
  const queryClient = useQueryClient();

  // Hidden file inputs for each asset
  const logoInputRef = useRef<HTMLInputElement>(null);
  const darkLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const pwaIconInputRef = useRef<HTMLInputElement>(null);

  const appearanceQuery = useQuery({
    queryKey: ["appearance"],
    queryFn: fetchAppearance,
  });

  // Database form state (persisted settings)
  const [form, setForm] = useState<Partial<AppearanceRow>>({
    id: "default",
    logo_url: null,
    logo_light_url: null,
    logo_dark_url: null,
    favicon_url: null,
    pwa_icon_url: null,
    application_logo_storage_path: null,
    favicon_storage_path: null,
    pwa_icon_storage_path: null,
    branding_version: "1",
    logo_height: 56,
    logo_alt: "DMPS Connect — Des Moines Public Schools",
    show_wordmark: true,
  });

  // Pending file selections (for instant preview before save)
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState<string | null>(null);

  const [pendingFaviconFile, setPendingFaviconFile] = useState<File | null>(null);
  const [pendingFaviconPreview, setPendingFaviconPreview] = useState<string | null>(null);

  const [pendingPwaFile, setPendingPwaFile] = useState<File | null>(null);
  const [pendingPwaPreview, setPendingPwaPreview] = useState<string | null>(null);

  // UI state
  const [isSavingAsset, setIsSavingAsset] = useState<BrandingAssetType | "all" | null>(null);
  const [previewThemeMode, setPreviewThemeMode] = useState<"light" | "dark">("light");
  const [showLogoAdvanced, setShowLogoAdvanced] = useState(false);
  const [logoUrlInputOpen, setLogoUrlInputOpen] = useState(false);
  const [customLogoUrl, setCustomLogoUrl] = useState("");

  // Sync initial appearance from query
  useEffect(() => {
    if (appearanceQuery.data) {
      setForm((prev) => ({
        ...prev,
        ...appearanceQuery.data,
      }));
    }
  }, [appearanceQuery.data]);

  // Handle file selection with validation & instant preview
  const handleSelectFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    assetType: BrandingAssetType,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateBrandingFile(file, assetType);
    if (!validation.valid) {
      toast.error(validation.error || "Archivo no válido.");
      if (e.target) e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    if (assetType === "application_logo") {
      setPendingLogoFile(file);
      setPendingLogoPreview(objectUrl);
      toast.info("Nuevo logo cargado en vista previa.", {
        description: "Revisa la simulación y presiona 'Guardar logo' para aplicarlo.",
      });
    } else if (assetType === "favicon") {
      setPendingFaviconFile(file);
      setPendingFaviconPreview(objectUrl);
      toast.info("Nuevo favicon cargado en vista previa.", {
        description: "Revisa la simulación de pestaña del navegador y presiona 'Guardar favicon'.",
      });
    } else if (assetType === "pwa_icon") {
      setPendingPwaFile(file);
      setPendingPwaPreview(objectUrl);
      toast.info("Nuevo ícono PWA cargado en vista previa.", {
        description: "Revisa la simulación de la app y presiona 'Guardar ícono PWA'.",
      });
    }

    if (e.target) e.target.value = "";
  };

  // Cancel pending preview
  const handleCancelPending = (assetType: BrandingAssetType) => {
    if (assetType === "application_logo") {
      if (pendingLogoPreview) URL.revokeObjectURL(pendingLogoPreview);
      setPendingLogoFile(null);
      setPendingLogoPreview(null);
    } else if (assetType === "favicon") {
      if (pendingFaviconPreview) URL.revokeObjectURL(pendingFaviconPreview);
      setPendingFaviconFile(null);
      setPendingFaviconPreview(null);
    } else if (assetType === "pwa_icon") {
      if (pendingPwaPreview) URL.revokeObjectURL(pendingPwaPreview);
      setPendingPwaFile(null);
      setPendingPwaPreview(null);
    }
    toast.info("Vista previa cancelada.");
  };

  // Core save function: persists only specified asset or all
  const saveAssetMutation = useMutation({
    mutationFn: async (target: BrandingAssetType | "all") => {
      setIsSavingAsset(target);
      const nextVersion = Date.now().toString();

      let newLogoUrl = form.logo_url ?? null;
      let newLogoPath = form.application_logo_storage_path ?? null;
      let oldLogoPathToCleanup: string | null = null;

      let newFaviconUrl = form.favicon_url ?? null;
      let newFaviconPath = form.favicon_storage_path ?? null;
      let oldFaviconPathToCleanup: string | null = null;

      let newPwaUrl = form.pwa_icon_url ?? null;
      let newPwaPath = form.pwa_icon_storage_path ?? null;
      let oldPwaPathToCleanup: string | null = null;

      // 1. Process application logo if targeted
      if (target === "application_logo" || target === "all") {
        if (pendingLogoFile) {
          const uploadRes = await uploadBrandingAsset({
            file: pendingLogoFile,
            assetType: "application_logo",
          });
          oldLogoPathToCleanup = form.application_logo_storage_path ?? null;
          newLogoUrl = uploadRes.publicUrl;
          newLogoPath = uploadRes.storagePath;
        }
      }

      // 2. Process favicon if targeted
      if (target === "favicon" || target === "all") {
        if (pendingFaviconFile) {
          const uploadRes = await uploadBrandingAsset({
            file: pendingFaviconFile,
            assetType: "favicon",
          });
          oldFaviconPathToCleanup = form.favicon_storage_path ?? null;
          newFaviconUrl = uploadRes.publicUrl;
          newFaviconPath = uploadRes.storagePath;
        }
      }

      // 3. Process PWA icon if targeted
      if (target === "pwa_icon" || target === "all") {
        if (pendingPwaFile) {
          const uploadRes = await uploadBrandingAsset({
            file: pendingPwaFile,
            assetType: "pwa_icon",
          });
          oldPwaPathToCleanup = form.pwa_icon_storage_path ?? null;
          newPwaUrl = uploadRes.publicUrl;
          newPwaPath = uploadRes.storagePath;
        }
      }

      // 4. Assemble payload
      const payload: AppearanceRow = {
        id: "default",
        logo_url: newLogoUrl,
        logo_light_url: newLogoUrl,
        logo_dark_url: form.logo_dark_url ?? null,
        favicon_url: newFaviconUrl,
        pwa_icon_url: newPwaUrl,
        application_logo_storage_path: newLogoPath,
        favicon_storage_path: newFaviconPath,
        pwa_icon_storage_path: newPwaPath,
        branding_version: nextVersion,
        logo_height: Number(form.logo_height) || 56,
        logo_alt: form.logo_alt ?? "DMPS Connect — Des Moines Public Schools",
        show_wordmark: form.show_wordmark ?? true,
        light_theme: form.light_theme ?? {},
        dark_theme: form.dark_theme ?? {},
      };

      // 5. Persist to Supabase
      const saved = await upsertRow("appearance_settings", payload as any);

      // 6. Safe cleanup of old unreferenced storage files
      if (oldLogoPathToCleanup && oldLogoPathToCleanup !== newLogoPath) {
        void cleanupOldBrandingAsset(oldLogoPathToCleanup);
      }
      if (oldFaviconPathToCleanup && oldFaviconPathToCleanup !== newFaviconPath) {
        void cleanupOldBrandingAsset(oldFaviconPathToCleanup);
      }
      if (oldPwaPathToCleanup && oldPwaPathToCleanup !== newPwaPath) {
        void cleanupOldBrandingAsset(oldPwaPathToCleanup);
      }

      // 7. Realtime DOM updates & event broadcasting
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dmps_appearance_updated", { detail: saved }));
        if (newFaviconUrl !== form.favicon_url) {
          applyFaviconToDocument(newFaviconUrl, nextVersion);
        }
        if (newPwaUrl !== form.pwa_icon_url) {
          applyPwaIconToDocument(newPwaUrl, nextVersion);
        }
      }

      // 8. Audit log
      try {
        const auditLabels: Record<string, string> = {
          application_logo: "Actualización de Logo de la Aplicación",
          favicon: "Actualización de Favicon del Sitio Web",
          pwa_icon: "Actualización de Ícono de la PWA",
          all: "Actualización completa de Identidad de DMPS INFO",
        };
        await logAudit(
          "update",
          "appearance_settings",
          "default",
          auditLabels[target] || "Actualización de Identidad Visual",
        );
      } catch {
        // ignore audit failure
      }

      return { saved: saved as AppearanceRow, target };
    },
    onSuccess: ({ saved, target }) => {
      setForm((prev) => ({
        ...prev,
        ...saved,
      }));

      // Clear pending file for saved target
      if (target === "application_logo" || target === "all") {
        setPendingLogoFile(null);
        setPendingLogoPreview(null);
      }
      if (target === "favicon" || target === "all") {
        setPendingFaviconFile(null);
        setPendingFaviconPreview(null);
      }
      if (target === "pwa_icon" || target === "all") {
        setPendingPwaFile(null);
        setPendingPwaPreview(null);
      }

      queryClient.setQueryData(["appearance"], saved);
      void queryClient.invalidateQueries({ queryKey: ["appearance"] });

      const successMsgs: Record<string, string> = {
        application_logo: "¡Logo de la aplicación guardado con éxito!",
        favicon: "¡Favicon del sitio web guardado con éxito!",
        pwa_icon: "¡Ícono de la PWA guardado con éxito!",
        all: "¡Identidad de DMPS INFO guardada con éxito!",
      };
      toast.success(successMsgs[target] || "¡Cambios guardados con éxito!");
    },
    onError: (err: Error) => {
      toast.error(`Error al guardar: ${err.message}`);
    },
    onSettled: () => {
      setIsSavingAsset(null);
    },
  });

  // Remove/revert an individual asset
  const handleRemoveAsset = async (assetType: BrandingAssetType) => {
    if (assetType === "application_logo") {
      setForm((prev) => ({ ...prev, logo_url: null, logo_light_url: null }));
      setPendingLogoFile(null);
      setPendingLogoPreview(null);
      await saveAssetMutation.mutateAsync("application_logo");
      toast.info("Logo restablecido al logotipo oficial predeterminado.");
    } else if (assetType === "favicon") {
      setForm((prev) => ({ ...prev, favicon_url: null }));
      setPendingFaviconFile(null);
      setPendingFaviconPreview(null);
      await saveAssetMutation.mutateAsync("favicon");
      applyFaviconToDocument(null);
      toast.info("Favicon restablecido al predeterminado.");
    } else if (assetType === "pwa_icon") {
      setForm((prev) => ({ ...prev, pwa_icon_url: null }));
      setPendingPwaFile(null);
      setPendingPwaPreview(null);
      await saveAssetMutation.mutateAsync("pwa_icon");
      applyPwaIconToDocument(null);
      toast.info("Ícono PWA restablecido al predeterminado.");
    }
  };

  // Resolved sources for active and preview states
  const activeLogoSrc =
    pendingLogoPreview || form.logo_url || form.logo_light_url || defaultLogoAsset;
  const activeDarkLogoSrc = form.logo_dark_url || activeLogoSrc;
  const currentDisplayedLogo = previewThemeMode === "dark" ? activeDarkLogoSrc : activeLogoSrc;
  const hasCustomLogo = Boolean(form.logo_url || form.logo_light_url);

  const activeFaviconSrc = pendingFaviconPreview || form.favicon_url || "/favicon.ico";
  const hasCustomFavicon = Boolean(form.favicon_url);

  const activePwaSrc = pendingPwaPreview || form.pwa_icon_url || "/icons/dmps-info-512.png";
  const hasCustomPwa = Boolean(form.pwa_icon_url);

  const logoHeightPx = Math.min(Math.max(Number(form.logo_height) || 56, 32), 120);

  return (
    <div className="space-y-8 pb-16">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={(e) => handleSelectFile(e, "application_logo")}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        className="hidden"
      />
      <input
        type="file"
        ref={darkLogoInputRef}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const uploadRes = await uploadBrandingAsset({
              file,
              assetType: "application_logo",
            });
            setForm((prev) => ({ ...prev, logo_dark_url: uploadRes.publicUrl }));
            toast.success("Logo para modo oscuro cargado.");
          } catch (err: any) {
            toast.error(err.message);
          }
        }}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        className="hidden"
      />
      <input
        type="file"
        ref={faviconInputRef}
        onChange={(e) => handleSelectFile(e, "favicon")}
        accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/jpeg,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={pwaIconInputRef}
        onChange={(e) => handleSelectFile(e, "pwa_icon")}
        accept="image/png,image/webp,image/jpeg,image/svg+xml"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
            <Sparkles className="size-4" />
            <span>Identidad y Marca Oficial</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Identidad de DMPS INFO
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Administra de forma completamente independiente los tres elementos clave de identidad
            visual: el logo interno, el favicon del navegador y el icono de la aplicación instalable
            PWA.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPendingLogoFile(null);
              setPendingLogoPreview(null);
              setPendingFaviconFile(null);
              setPendingFaviconPreview(null);
              setPendingPwaFile(null);
              setPendingPwaPreview(null);
              if (appearanceQuery.data) {
                setForm(appearanceQuery.data);
              }
              toast.info("Configuración recargada.");
            }}
            className="min-h-11 rounded-xl font-medium gap-2 border-border"
          >
            <RotateCcw className="size-4" />
            <span>Restablecer</span>
          </Button>

          <Button
            type="button"
            onClick={() => saveAssetMutation.mutate("all")}
            disabled={saveAssetMutation.isPending}
            className="min-h-11 px-5 rounded-xl font-bold gap-2 bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
          >
            {isSavingAsset === "all" ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>Guardando todo...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Guardar Todo</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {appearanceQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* ============================================================ */}
          {/* CARD 1: LOGO DE LA APLICACIÓN */}
          {/* ============================================================ */}
          <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ImageIcon className="size-4" />
                    </span>
                    <CardTitle className="text-xl font-bold">LOGO DE LA APLICACIÓN</CardTitle>
                  </div>
                  <CardDescription>
                    Logo que aparece dentro de la interfaz y cabecera de DMPS INFO.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      hasCustomLogo
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                    }`}
                  >
                    {hasCustomLogo ? (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        Logo personalizado
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="size-3.5" />
                        Logo oficial por defecto
                      </>
                    )}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Preview simulation of internal app header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Laptop className="size-3.5" />
                    Vista Previa en Cabecera
                  </span>
                  <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPreviewThemeMode("light")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 ${
                        previewThemeMode === "light"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Sun className="size-3" />
                      <span>Claro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewThemeMode("dark")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 ${
                        previewThemeMode === "dark"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Moon className="size-3" />
                      <span>Oscuro</span>
                    </button>
                  </div>
                </div>

                <div
                  className={`rounded-xl border p-4 sm:p-6 flex items-center justify-between transition-colors ${
                    previewThemeMode === "dark"
                      ? "bg-slate-950 border-slate-800 text-slate-100"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={currentDisplayedLogo}
                      alt={form.logo_alt || "Logo de la aplicación"}
                      style={{ height: `${logoHeightPx}px` }}
                      className="max-w-[240px] sm:max-w-xs object-contain transition-all"
                    />
                    {form.show_wordmark !== false && (
                      <span className="hidden sm:inline font-bold text-sm tracking-tight border-l pl-3 border-current/20">
                        DMPS Connect & Portal de Familias
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-muted-foreground font-mono">
                    H: {logoHeightPx}px
                  </span>
                </div>
              </div>

              {/* Action Buttons for Logo */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                  >
                    <Upload className="size-4" />
                    <span>{hasCustomLogo ? "Reemplazar logo" : "Cambiar logo"}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLogoUrlInputOpen(!logoUrlInputOpen)}
                    className="rounded-xl font-medium gap-1.5"
                  >
                    <LinkIcon className="size-3.5" />
                    <span>Pegar URL</span>
                  </Button>

                  {hasCustomLogo && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveAsset("application_logo")}
                      className="rounded-xl text-destructive hover:bg-destructive/10 gap-1.5"
                    >
                      <Trash2 className="size-4" />
                      <span>Restablecer predeterminado</span>
                    </Button>
                  )}
                </div>

                {/* If there's a pending file preview waiting to be saved */}
                {pendingLogoFile && (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl">
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                      Nuevo archivo listo:
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelPending("application_logo")}
                      className="h-8 px-2 text-xs"
                    >
                      <X className="size-3.5 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveAssetMutation.mutate("application_logo")}
                      disabled={saveAssetMutation.isPending}
                      className="h-8 gap-1.5 font-bold bg-amber-600 hover:bg-amber-700 text-white text-xs"
                    >
                      {isSavingAsset === "application_logo" ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      <span>Guardar logo</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Direct URL input popup for logo */}
              {logoUrlInputOpen && (
                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3 animate-in fade-in">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    URL directa del logo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customLogoUrl}
                      onChange={(e) => setCustomLogoUrl(e.target.value)}
                      placeholder="https://ejemplo.org/logo.png"
                      className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-xs focus:ring-2 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const trimmed = customLogoUrl.trim();
                        if (trimmed) {
                          setForm((prev) => ({
                            ...prev,
                            logo_url: trimmed,
                            logo_light_url: trimmed,
                          }));
                          setLogoUrlInputOpen(false);
                          setCustomLogoUrl("");
                          toast.success("URL de logo cargada en vista previa.");
                        }
                      }}
                      className="rounded-xl font-bold text-xs"
                    >
                      Aplicar a vista previa
                    </Button>
                  </div>
                </div>
              )}

              {/* Adjustments: Height slider & Wordmark toggle & Dark mode */}
              <div className="pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowLogoAdvanced(!showLogoAdvanced)}
                  className="flex items-center justify-between w-full py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Ajustes de tamaño, texto alternativo y modo oscuro</span>
                  {showLogoAdvanced ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>

                {showLogoAdvanced && (
                  <div className="mt-3 space-y-4 p-4 rounded-xl bg-muted/20 border border-border/60">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-foreground">
                        <span>Altura del logo en pantalla</span>
                        <span className="font-mono text-primary">{logoHeightPx}px</span>
                      </div>
                      <input
                        type="range"
                        min={32}
                        max={110}
                        step={2}
                        value={logoHeightPx}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, logo_height: Number(e.target.value) }));
                        }}
                        className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                      />
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.show_wordmark !== false}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, show_wordmark: e.target.checked }));
                        }}
                        className="size-4 rounded accent-primary text-primary focus:ring-primary"
                      />
                      <span className="text-xs font-medium text-foreground">
                        Mostrar texto "DMPS Connect" junto al logotipo en escritorio
                      </span>
                    </label>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">
                        Texto descriptivo (Accesibilidad)
                      </label>
                      <input
                        type="text"
                        value={form.logo_alt ?? ""}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, logo_alt: e.target.value }));
                        }}
                        placeholder="DMPS Connect — Des Moines Public Schools"
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs"
                      />
                    </div>

                    {/* Dark mode logo */}
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          Logo exclusivo para Modo Oscuro (Opcional)
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Si no se define, se usará automáticamente el logo principal.
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {form.logo_dark_url && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setForm((prev) => ({ ...prev, logo_dark_url: null }))}
                            className="text-xs text-destructive h-8"
                          >
                            Quitar
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => darkLogoInputRef.current?.click()}
                          className="text-xs h-8"
                        >
                          <Upload className="size-3 mr-1" />
                          <span>{form.logo_dark_url ? "Cambiar oscuro" : "Subir oscuro"}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ============================================================ */}
          {/* CARD 2: FAVICON */}
          {/* ============================================================ */}
          <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Globe className="size-4" />
                    </span>
                    <CardTitle className="text-xl font-bold">FAVICON</CardTitle>
                  </div>
                  <CardDescription>
                    Este icono aparece en las pestañas del navegador.
                  </CardDescription>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    hasCustomFavicon
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                  }`}
                >
                  {hasCustomFavicon ? (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      Favicon personalizado
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-3.5" />
                      Favicon predeterminado
                    </>
                  )}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Browser Tab Simulation Preview */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Laptop className="size-3.5" />
                  [Pestaña del navegador] 📖 DMPS INFO
                </span>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  {/* Browser top chrome */}
                  <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <div className="flex gap-1.5">
                      <span className="size-2.5 rounded-full bg-red-400 inline-block" />
                      <span className="size-2.5 rounded-full bg-amber-400 inline-block" />
                      <span className="size-2.5 rounded-full bg-emerald-400 inline-block" />
                    </div>
                    {/* Simulated active browser tab */}
                    <div className="inline-flex items-center gap-2 rounded-t-lg bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground border-t border-x border-border shadow-xs max-w-xs">
                      {/* Live favicon image */}
                      <img
                        src={activeFaviconSrc}
                        alt="Favicon"
                        className="size-4 shrink-0 object-contain rounded-xs"
                      />
                      <span className="truncate">📖 DMPS INFO</span>
                      <X className="size-3 text-muted-foreground/60 shrink-0 ml-1" />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground pt-1">
                    Este icono aparece en las pestañas del navegador, marcadores e historial de
                    navegación.
                  </p>
                </div>
              </div>

              {/* Action Buttons for Favicon */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    className="rounded-xl font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    <Upload className="size-4" />
                    <span>{hasCustomFavicon ? "Reemplazar favicon" : "Cambiar favicon"}</span>
                  </Button>

                  {hasCustomFavicon && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveAsset("favicon")}
                      className="rounded-xl text-destructive hover:bg-destructive/10 gap-1.5"
                    >
                      <Trash2 className="size-4" />
                      <span>Restablecer predeterminado</span>
                    </Button>
                  )}
                </div>

                {/* If there's a pending favicon file preview */}
                {pendingFaviconFile && (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl">
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                      Nuevo favicon listo:
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelPending("favicon")}
                      className="h-8 px-2 text-xs"
                    >
                      <X className="size-3.5 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveAssetMutation.mutate("favicon")}
                      disabled={saveAssetMutation.isPending}
                      className="h-8 gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      {isSavingAsset === "favicon" ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      <span>Guardar favicon</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ============================================================ */}
          {/* CARD 3: ICONO DE LA PWA */}
          {/* ============================================================ */}
          <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Smartphone className="size-4" />
                    </span>
                    <CardTitle className="text-xl font-bold">ICONO DE LA PWA</CardTitle>
                  </div>
                  <CardDescription>
                    Este icono aparece cuando DMPS INFO se instala como aplicación en teléfonos,
                    tablets o computadoras.
                  </CardDescription>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    hasCustomPwa
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                  }`}
                >
                  {hasCustomPwa ? (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      Ícono PWA personalizado
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-3.5" />
                      Ícono PWA predeterminado
                    </>
                  )}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* PWA Launcher Simulation Preview */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Smartphone className="size-3.5" />
                  [Simulación PWA] DMPS INFO
                </span>

                <div className="rounded-xl border border-border bg-muted/30 p-6 flex flex-col sm:flex-row items-center gap-6">
                  {/* PWA Home screen icon simulation */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="size-20 sm:size-24 rounded-2xl bg-card border-2 border-border shadow-md overflow-hidden p-2 flex items-center justify-center">
                      <img
                        src={activePwaSrc}
                        alt="Icono PWA"
                        className="size-full object-contain rounded-xl"
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground text-center">DMPS INFO</span>
                  </div>

                  <div className="space-y-1.5 text-center sm:text-left">
                    <h4 className="text-sm font-bold text-foreground">
                      Icono de Instalación (PWA & Apple Touch)
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Este icono aparece cuando DMPS INFO se instala como aplicación. Se aplica
                      automáticamente al archivo del Web App Manifest y a los dispositivos iOS y
                      Android.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] text-muted-foreground">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono">192x192</span>
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono">512x512</span>
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono">
                        Apple Touch Icon
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for PWA Icon */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => pwaIconInputRef.current?.click()}
                    className="rounded-xl font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  >
                    <Upload className="size-4" />
                    <span>{hasCustomPwa ? "Reemplazar icono PWA" : "Cambiar icono PWA"}</span>
                  </Button>

                  {hasCustomPwa && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveAsset("pwa_icon")}
                      className="rounded-xl text-destructive hover:bg-destructive/10 gap-1.5"
                    >
                      <Trash2 className="size-4" />
                      <span>Restablecer predeterminado</span>
                    </Button>
                  )}
                </div>

                {/* If there's a pending PWA file preview */}
                {pendingPwaFile && (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl">
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                      Nuevo ícono PWA listo:
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelPending("pwa_icon")}
                      className="h-8 px-2 text-xs"
                    >
                      <X className="size-3.5 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveAssetMutation.mutate("pwa_icon")}
                      disabled={saveAssetMutation.isPending}
                      className="h-8 gap-1.5 font-bold bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                    >
                      {isSavingAsset === "pwa_icon" ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      <span>Guardar icono PWA</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
