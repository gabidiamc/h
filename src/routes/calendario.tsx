import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  CalendarDays,
  CalendarCheck,
  Download,
  ExternalLink,
  FileText,
  Maximize2,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import {
  fetchCalendarSettings,
  getCalendarSettings,
  type CalendarSettings,
} from "@/lib/calendar-config";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario Escolar Oficial — Familias DMPS" },
      {
        name: "description",
        content: "Consulta y descarga el calendario escolar oficial de Des Moines Public Schools.",
      },
      { property: "og:title", content: "Calendario Escolar Oficial — Familias DMPS" },
      {
        property: "og:description",
        content:
          "Calendario escolar oficial con días de clase, recesos festivos y conferencias familiares.",
      },
    ],
  }),
  component: OfficialCalendarPage,
});

export function OfficialCalendarPage() {
  const { lang } = useI18n();
  const isSpanish = lang === "es";

  const [settings, setSettings] = useState<CalendarSettings>(() => getCalendarSettings("lincoln"));
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sync with persisted storage (IndexedDB + Server Disk) and real-time updates from admin
  useEffect(() => {
    let mounted = true;

    const updateSync = () => {
      if (!mounted) return;
      setSettings(getCalendarSettings("lincoln"));
      setImageError(false);
    };

    updateSync();
    void fetchCalendarSettings("lincoln").then((loaded) => {
      if (mounted) {
        setSettings(loaded);
        setImageError(false);
      }
    });

    window.addEventListener("dmps-calendar-updated", updateSync);
    window.addEventListener("dmps:storage-updated", updateSync);
    window.addEventListener("storage", updateSync);
    return () => {
      mounted = false;
      window.removeEventListener("dmps-calendar-updated", updateSync);
      window.removeEventListener("dmps:storage-updated", updateSync);
      window.removeEventListener("storage", updateSync);
    };
  }, [lang]);

  const activeUrl = isSpanish
    ? settings.imageUrl || settings.pdfUrl || settings.imageUrlEn || settings.pdfUrlEn || ""
    : settings.imageUrlEn || settings.pdfUrlEn || settings.imageUrl || settings.pdfUrl || "";
  const isPdf =
    activeUrl.toLowerCase().includes("application/pdf") || activeUrl.toLowerCase().endsWith(".pdf");

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const handlePrint = () => {
    window.print();
  };

  return (
    <PublicShell>
      {/* Hero Header */}
      <section className="hero-wash border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-bold text-primary shadow-soft">
                <CalendarDays className="size-4" aria-hidden="true" />
                <span>
                  {isSpanish ? "Calendario Escolar Oficial" : "Official District Calendar"}
                </span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
                {isSpanish ? "Calendario Escolar 2026-2027" : "2026-2027 School Calendar"}
              </h1>
              <p className="mt-2 text-base text-muted-foreground max-w-2xl">
                {isSpanish
                  ? "Visualiza y descarga el calendario escolar oficial de Des Moines Public Schools. Días lectivos, recesos, conferencias y días sin clases."
                  : "View and download the official school calendar for Des Moines Public Schools. School days, holidays, and family conferences."}
              </p>
            </div>

            {/* Quick Download Action (No school switcher buttons) */}
            {activeUrl && (
              <div className="flex items-center gap-3">
                <Button asChild className="rounded-xl font-bold gap-2 shadow-soft">
                  <a
                    href={activeUrl}
                    download="Calendario_Escolar_DMPS"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="size-4" />
                    <span>{isSpanish ? "Descargar" : "Download"}</span>
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Banner linking to Separate Events Page */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
              <CalendarCheck className="size-6" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                {isSpanish
                  ? "¿Buscas eventos escolares y reuniones específicas?"
                  : "Looking for specific events and meetings?"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {isSpanish
                  ? "Consulta conferencias para padres, partidos deportivos, talleres y reuniones en nuestra sección de Eventos."
                  : "Explore parent conferences, athletics, workshops, and school meetings in the Events section."}
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="default"
            size="sm"
            className="rounded-xl font-bold gap-2 shrink-0"
          >
            <Link to="/eventos">
              <span>{isSpanish ? "Ver Lista de Eventos" : "View Events List"}</span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Calendar Viewer Container */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
        {/* Controls toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border p-3.5 rounded-2xl shadow-soft">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs font-bold text-primary border-primary/30 bg-primary/5"
            >
              <ShieldCheck className="size-3.5 mr-1" />
              Des Moines Public Schools
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isSpanish ? "Documento Oficial 2026-2027" : "Official 2026-2027 Document"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls (only for images) */}
            {!isPdf && (
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/80">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Alejar"
                >
                  <ZoomOut className="size-3.5" />
                </Button>
                <span className="text-[11px] font-bold px-1 text-muted-foreground min-w-9 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Acercar"
                >
                  <ZoomIn className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetZoom}
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Restablecer tamaño"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              </div>
            )}

            {/* Fullscreen Modal trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(true)}
              className="h-8 rounded-xl text-xs font-semibold gap-1.5"
            >
              <Maximize2 className="size-3.5" />
              <span className="hidden sm:inline">
                {isSpanish ? "Pantalla Completa" : "Fullscreen"}
              </span>
            </Button>

            {/* Print Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 rounded-xl text-xs font-semibold gap-1.5"
            >
              <Printer className="size-3.5" />
              <span className="hidden sm:inline">{isSpanish ? "Imprimir" : "Print"}</span>
            </Button>

            {/* Download */}
            {activeUrl && (
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="h-8 rounded-xl text-xs font-bold gap-1.5"
              >
                <a href={activeUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="size-3.5" />
                  <span>{isSpanish ? "Descargar" : "Download"}</span>
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Main Viewer — Space adapts directly to the image */}
        {isPdf ? (
          <Card className="rounded-3xl border-border bg-card overflow-hidden shadow-md">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-muted/20 overflow-hidden h-[700px] w-full">
                  <iframe
                    src={`${activeUrl}#toolbar=1&navpanes=0`}
                    className="w-full h-full border-0"
                    title="Calendario Escolar PDF"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>
                    {isSpanish
                      ? "Documento PDF oficial del ciclo escolar"
                      : "Official school year PDF document"}
                  </span>
                  <a
                    href={activeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>{isSpanish ? "Abrir en nueva pestaña" : "Open in new tab"}</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : !imageError && activeUrl ? (
          <div className="flex flex-col items-center justify-center">
            <div className="mx-auto w-fit max-w-full overflow-auto rounded-3xl border border-border bg-card p-2 sm:p-3 shadow-md">
              <img
                src={activeUrl}
                alt={
                  isSpanish
                    ? "Calendario Escolar Oficial 2026-2027"
                    : "Official 2026-2027 School Calendar"
                }
                onError={() => setImageError(true)}
                style={
                  zoomLevel !== 1
                    ? {
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: "center top",
                        transition: "transform 0.15s ease-out",
                      }
                    : undefined
                }
                className="block w-auto max-w-full h-auto rounded-2xl cursor-zoom-in select-none mx-auto"
                onClick={() => setIsFullscreen(true)}
              />
            </div>

            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              {isSpanish
                ? "Haz clic sobre la imagen para ampliar en pantalla completa o usa los controles de zoom."
                : "Click the image to expand full-screen or use zoom controls."}
            </p>
          </div>
        ) : (
          <Card className="rounded-3xl border-border bg-card overflow-hidden shadow-md">
            <CardContent className="py-20 text-center space-y-4">
              <div className="size-16 rounded-3xl bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto">
                <FileText className="size-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  {isSpanish ? "Calendario Escolar en Preparación" : "School Calendar Coming Soon"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {isSpanish
                    ? "El personal administrativo actualizará la imagen del calendario en breve."
                    : "Staff will update the official calendar file shortly."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Fullscreen Image Lightbox Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[96vw] max-h-[96vh] p-4 bg-background/95 backdrop-blur-md rounded-3xl border-border flex flex-col">
          <DialogHeader className="pb-2 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold">
                {isSpanish
                  ? settings.title || "Calendario Escolar 2026-2027"
                  : settings.titleEn || "2026-2027 School Calendar"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isSpanish ? "Visualizador en alta resolución" : "High-resolution viewer"}
              </DialogDescription>
            </div>
            {activeUrl && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-xl h-8 text-xs font-bold gap-1 mr-6"
              >
                <a href={activeUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="size-3.5" />
                  <span>{isSpanish ? "Descargar" : "Download"}</span>
                </a>
              </Button>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-auto flex items-center justify-center p-2">
            {isPdf ? (
              <iframe
                src={activeUrl}
                className="w-full h-[80vh] rounded-2xl border border-border"
                title="Calendario PDF Fullscreen"
              />
            ) : (
              <img
                src={activeUrl}
                alt="Calendario Escolar Fullscreen"
                className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PublicShell>
  );
}
