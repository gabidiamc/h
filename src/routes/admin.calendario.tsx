import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  Save,
  CheckCircle2,
  Eye,
  FileText,
  Trash2,
  Languages,
  Copy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchCalendarSettings,
  getCalendarSettings,
  saveCalendarSettings,
  type CalendarSettings,
} from "@/lib/calendar-config";
import { FileUploadInput } from "@/components/file-upload-input";

export const Route = createFileRoute("/admin/calendario")({
  component: AdminCalendarPage,
});

function isPdfUrl(url: string): boolean {
  const lower = (url || "").toLowerCase();
  return lower.includes("application/pdf") || lower.endsWith(".pdf");
}

function AdminCalendarPage() {
  const [editLang, setEditLang] = useState<"es" | "en">("es");

  const [calendarFileEs, setCalendarFileEs] = useState<string>(() => {
    const initial = getCalendarSettings("lincoln");
    return initial.imageUrl || initial.pdfUrl || "";
  });
  const [calendarFileEn, setCalendarFileEn] = useState<string>(() => {
    const initial = getCalendarSettings("lincoln");
    return initial.imageUrlEn || initial.pdfUrlEn || initial.imageUrl || initial.pdfUrl || "";
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const hasUserEditedRef = useRef(false);

  // Load persisted calendar settings on mount (from IndexedDB & Server Disk) without overwriting user edits
  useEffect(() => {
    let mounted = true;

    const applyLoaded = (loaded: CalendarSettings) => {
      if (!mounted || hasUserEditedRef.current) return;
      const esFile = loaded.imageUrl || loaded.pdfUrl || "";
      const enFile = loaded.imageUrlEn || loaded.pdfUrlEn || esFile;
      setCalendarFileEs(esFile);
      setCalendarFileEn(enFile);
    };

    void fetchCalendarSettings("lincoln").then(applyLoaded);

    const handleExternalSync = () => {
      if (!hasUserEditedRef.current) {
        const current = getCalendarSettings("lincoln");
        applyLoaded(current);
      }
    };

    window.addEventListener("dmps:storage-updated", handleExternalSync);
    return () => {
      mounted = false;
      window.removeEventListener("dmps:storage-updated", handleExternalSync);
    };
  }, []);

  const persistCalendarBothLangs = async (
    rawEs: string,
    rawEn: string,
    silent = false,
  ): Promise<boolean> => {
    const cleanEs = rawEs.trim();
    const cleanEn = rawEn.trim();
    if (!cleanEs && !cleanEn) {
      if (!silent) {
        toast.error("Por favor sube o selecciona el archivo del calendario.");
      }
      return false;
    }

    const finalEs = cleanEs || cleanEn;
    const finalEn = cleanEn || cleanEs;

    const isEsPdf = isPdfUrl(finalEs);
    const isEnPdf = isPdfUrl(finalEn);
    const now = new Date().toISOString();

    const newSettings: CalendarSettings = {
      imageUrl: isEsPdf ? "" : finalEs,
      pdfUrl: isEsPdf ? finalEs : "",
      imageUrlEn: isEnPdf ? "" : finalEn,
      pdfUrlEn: isEnPdf ? finalEn : "",
      title: "Calendario Escolar 2026-2027 — Des Moines Public Schools",
      titleEn: "2026-2027 School Calendar — Des Moines Public Schools",
      subtitle: "Días de clases, recesos, conferencias y fechas clave oficiales.",
      subtitleEn: "School days, family conferences, holidays, and official key dates.",
      lastUpdated: now,
      updated_at: now,
    };

    await saveCalendarSettings("lincoln", newSettings, { silent });
    return true;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const ok = await persistCalendarBothLangs(calendarFileEs, calendarFileEn, false);
      if (ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3500);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const activeFile = editLang === "es" ? calendarFileEs : calendarFileEn;
  const isActivePdf = isPdfUrl(activeFile);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="size-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Calendario Escolar 2026-2027 (Español e Inglés)
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Sube las dos versiones del calendario escolar (uno en Español y otro en Inglés). En la
            página pública, el botón de cambiar idioma de siempre mostrará automáticamente el
            calendario correspondiente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/calendario">
              <Eye className="mr-2 size-4" />
              <span>Ver Calendario Público</span>
            </Link>
          </Button>

          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="rounded-xl font-bold"
          >
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 size-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : isSaved ? (
              <>
                <CheckCircle2 className="mr-2 size-4" />
                <span>¡Guardado Permanente!</span>
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                <span>Guardar Calendario (ES / EN)</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Language Switcher Bar (Español / Inglés) */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Languages className="size-4 text-primary" />
            <span>Idioma del Calendario (Dos Versiones: Español e Inglés)</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecciona el idioma para subir o previsualizar su archivo correspondiente.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
          {[
            {
              code: "es" as const,
              label: "🇪🇸 Español (Principal)",
              hasFile: Boolean(calendarFileEs.trim()),
            },
            {
              code: "en" as const,
              label: "🇺🇸 English (Inglés)",
              hasFile: Boolean(calendarFileEn.trim()),
            },
          ].map((item) => {
            const isActive = editLang === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setEditLang(item.code)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`size-2 rounded-full ${
                    item.hasFile ? (isActive ? "bg-white" : "bg-emerald-500") : "bg-amber-400"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Upload Form */}
        <form onSubmit={(e) => void handleSave(e)} className="space-y-6 lg:col-span-6">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="size-5 text-primary" />
                Archivos del Calendario 2026-2027 (ES / EN)
              </CardTitle>
              <CardDescription>
                Sube el calendario en Español y el calendario en Inglés (PNG, JPG, WEBP, PDF o
                enlace). El espacio de la foto se adapta automáticamente a tu imagen.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Spanish Upload Box */}
              <div
                onClick={() => setEditLang("es")}
                className={`rounded-2xl border p-4 space-y-3 transition-all ${
                  editLang === "es"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/80 bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <span>🇪🇸 1. Calendario en Español</span>
                  </span>
                  {calendarFileEs && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        hasUserEditedRef.current = true;
                        setCalendarFileEn(calendarFileEs);
                        void persistCalendarBothLangs(calendarFileEs, calendarFileEs, true);
                        toast.info("Archivo copiado a la versión en Inglés.");
                      }}
                      className="h-6 px-2 text-[11px] font-bold text-primary hover:bg-primary/10 gap-1"
                    >
                      <Copy className="size-3" />
                      <span>Copiar a Inglés</span>
                    </Button>
                  )}
                </div>

                <FileUploadInput
                  id="calendar-upload-es"
                  value={calendarFileEs}
                  onChange={(val) => {
                    hasUserEditedRef.current = true;
                    setCalendarFileEs(val);
                    setEditLang("es");
                    if (val.trim()) {
                      void persistCalendarBothLangs(val, calendarFileEn, true);
                    }
                  }}
                  helperText="Archivo o imagen del calendario en Español (PNG, JPG, WEBP, PDF)"
                  placeholder="Pega enlace o selecciona el calendario en Español..."
                  accept="image/*,.pdf,application/pdf"
                  showPreview={false}
                />

                {calendarFileEs && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/80 border border-border text-xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[260px]">
                      {isPdfUrl(calendarFileEs)
                        ? "✓ 📄 PDF en Español cargado"
                        : "✓ 🖼️ Imagen en Español cargada"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        hasUserEditedRef.current = true;
                        setCalendarFileEs("");
                      }}
                      className="text-destructive hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" /> Quitar
                    </button>
                  </div>
                )}
              </div>

              {/* English Upload Box */}
              <div
                onClick={() => setEditLang("en")}
                className={`rounded-2xl border p-4 space-y-3 transition-all ${
                  editLang === "en"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/80 bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <span>🇺🇸 2. Calendario en Inglés (English)</span>
                  </span>
                  {calendarFileEn && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        hasUserEditedRef.current = true;
                        setCalendarFileEs(calendarFileEn);
                        void persistCalendarBothLangs(calendarFileEn, calendarFileEn, true);
                        toast.info("Archivo copiado a la versión en Español.");
                      }}
                      className="h-6 px-2 text-[11px] font-bold text-primary hover:bg-primary/10 gap-1"
                    >
                      <Copy className="size-3" />
                      <span>Copiar a Español</span>
                    </Button>
                  )}
                </div>

                <FileUploadInput
                  id="calendar-upload-en"
                  value={calendarFileEn}
                  onChange={(val) => {
                    hasUserEditedRef.current = true;
                    setCalendarFileEn(val);
                    setEditLang("en");
                    if (val.trim()) {
                      void persistCalendarBothLangs(calendarFileEs, val, true);
                    }
                  }}
                  helperText="Archivo o imagen del calendario en Inglés (PNG, JPG, WEBP, PDF)"
                  placeholder="Pega enlace o selecciona el calendario en Inglés..."
                  accept="image/*,.pdf,application/pdf"
                  showPreview={false}
                />

                {calendarFileEn && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/80 border border-border text-xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[260px]">
                      {isPdfUrl(calendarFileEn)
                        ? "✓ 📄 PDF en Inglés cargado"
                        : "✓ 🖼️ Imagen en Inglés cargada"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        hasUserEditedRef.current = true;
                        setCalendarFileEn("");
                      }}
                      className="text-destructive hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" /> Quitar
                    </button>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSaving}
                className="w-full gap-2 rounded-xl font-bold min-h-12 shadow-sm cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="size-5 animate-spin" /> Guardando de forma permanente...
                  </>
                ) : isSaved ? (
                  <>
                    <CheckCircle2 className="size-5 text-white" /> ¡Calendarios Guardados y
                    Publicados!
                  </>
                ) : (
                  <>
                    <Save className="size-5" /> Guardar y Publicar Calendarios (ES / EN)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Live Preview */}
        <div className="space-y-6 lg:col-span-6">
          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/40 pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="size-4 text-primary" /> Vista Previa (
                  {editLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"})
                </CardTitle>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-500/20">
                  2026-2027
                </span>
              </div>
              <CardDescription>
                Así se visualizará en la sección pública cuando el visitante tenga el idioma en{" "}
                <strong>{editLang === "es" ? "Español" : "Inglés"}</strong>. El espacio se adapta al
                tamaño real de la imagen.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              {activeFile ? (
                isActivePdf ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center space-y-2">
                      <FileText className="size-12 text-primary mx-auto" />
                      <h4 className="font-bold text-foreground text-sm">
                        Documento PDF Oficial ({editLang === "es" ? "Español" : "English"})
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        El calendario en formato PDF está listo para descargar y consultar.
                      </p>
                    </div>
                    {activeFile.startsWith("data:") ? (
                      <div className="aspect-[4/3] w-full rounded-xl overflow-hidden border border-border">
                        <iframe
                          src={activeFile}
                          title="Vista previa PDF"
                          className="h-full w-full"
                        />
                      </div>
                    ) : (
                      <a
                        href={activeFile}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-center text-xs font-bold text-primary underline"
                      >
                        Abrir PDF en nueva pestaña
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="mx-auto w-fit max-w-full overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xs">
                    <img
                      src={activeFile}
                      alt="Vista previa del calendario"
                      className="block h-auto w-auto max-w-full rounded-xl mx-auto"
                    />
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground text-xs text-center p-4">
                  <CalendarDays className="size-8 text-muted-foreground/50 mb-2" />
                  <span>
                    Ningún archivo de calendario cargado para{" "}
                    {editLang === "es" ? "Español" : "Inglés"}
                  </span>
                  <span className="text-[11px] mt-1 text-muted-foreground/80">
                    Sube un archivo para ver la vista previa en vivo
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
