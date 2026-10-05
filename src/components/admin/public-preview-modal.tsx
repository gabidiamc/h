import { useState } from "react";
import {
  Smartphone,
  Tablet,
  Monitor,
  Sun,
  Moon,
  Globe,
  School,
  X,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Clock,
  Building,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useSchool } from "@/lib/school";

export interface PreviewData {
  type: "article" | "announcement" | "event" | "activity" | "category" | "resource";
  title: string;
  summary?: string;
  body?: string;
  category?: string;
  school_id?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  source_name?: string;
  official_url?: string;
  image_url?: string;
  image_alt?: string;
  status?: string;
  items?: unknown[];
  translations?: Record<string, { title?: string; body?: string; summary?: string }>;
}

export function PublicPreviewModal({
  open,
  onOpenChange,
  data,
  onPublish,
  onSaveDraft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PreviewData | null;
  onPublish?: () => void;
  onSaveDraft?: () => void;
}) {
  const { schools } = useSchool();
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState<"es" | "en" | "kar">("es");
  const [school, setSchool] = useState<string>("lincoln");

  if (!data) return null;

  const displayTitle =
    language === "en" && data.translations?.en?.title
      ? data.translations.en.title
      : language === "kar" && (data.translations?.kar?.title || data.translations?.ksw?.title)
        ? data.translations?.kar?.title || data.translations?.ksw?.title
        : data.title;

  const displaySummary =
    language === "en" && data.translations?.en?.summary
      ? data.translations.en.summary
      : language === "kar" && (data.translations?.kar?.summary || data.translations?.ksw?.summary)
        ? data.translations?.kar?.summary || data.translations?.ksw?.summary
        : data.summary;

  const displayBody =
    language === "en" && data.translations?.en?.body
      ? data.translations.en.body
      : language === "kar" && (data.translations?.kar?.body || data.translations?.ksw?.body)
        ? data.translations?.kar?.body || data.translations?.ksw?.body
        : data.body;

  const getContainerWidth = () => {
    switch (device) {
      case "mobile":
        return "w-[375px]";
      case "tablet":
        return "w-[768px]";
      case "desktop":
        return "w-full max-w-4xl";
    }
  };

  const schoolNames: Record<string, string> = {
    lincoln: "Lincoln High School",
    east: "East High School",
    all: "Distrito Escolar de Des Moines (DMPS)",
    ...Object.fromEntries(schools.map((s) => [s.id, s.name])),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-900 border-slate-800 text-slate-100 rounded-2xl">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
              Vista Previa en Vivo
            </span>
            <span className="text-sm font-semibold text-slate-300 hidden sm:inline">
              Comprueba cómo verán las familias este contenido antes de publicarlo
            </span>
          </div>

          {/* Device & Option Switches */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Devices */}
            <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`p-1.5 rounded-lg transition-colors ${
                  device === "mobile"
                    ? "bg-primary text-white font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Vista móvil (375px)"
              >
                <Smartphone className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("tablet")}
                className={`p-1.5 rounded-lg transition-colors ${
                  device === "tablet"
                    ? "bg-primary text-white font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Vista tableta (768px)"
              >
                <Tablet className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={`p-1.5 rounded-lg transition-colors ${
                  device === "desktop"
                    ? "bg-primary text-white font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Vista escritorio (Completa)"
              >
                <Monitor className="size-4" />
              </button>
            </div>

            {/* Light/Dark Switch */}
            <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === "light"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Modo Claro"
              >
                <Sun className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Modo Oscuro"
              >
                <Moon className="size-4" />
              </button>
            </div>

            {/* Language Switch */}
            <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLanguage("es")}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  language === "es"
                    ? "bg-primary text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  language === "en"
                    ? "bg-primary text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("kar")}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  language === "kar"
                    ? "bg-primary text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ကညီ
              </button>
            </div>

            {/* School Scope Switch */}
            <select
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="text-xs bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 font-semibold text-slate-200"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.short_name || s.name}
                </option>
              ))}
              <option value="all">Distrito completo</option>
            </select>
          </div>
        </div>

        {/* Viewport Frame */}
        <div className="flex-1 bg-slate-950/70 p-4 sm:p-6 overflow-y-auto flex items-start justify-center">
          <div
            className={`${getContainerWidth()} transition-all duration-300 rounded-2xl shadow-2xl overflow-hidden border border-slate-800/80 ${
              theme === "dark" ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
            }`}
          >
            {/* Simulated Public Navigation Header */}
            <div
              className={`px-4 py-3 border-b flex items-center justify-between text-xs ${
                theme === "dark"
                  ? "bg-slate-950/80 border-slate-800 text-slate-300"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                <span className="text-primary font-black text-sm">DMPS</span>
                <span>Family Info</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <School className="size-3.5 text-primary" />
                <span className="truncate max-w-[160px]">{schoolNames[school] || school}</span>
              </div>
            </div>

            {/* Render Public Content Preview */}
            <div className="p-5 sm:p-7 space-y-5">
              {/* Category & Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {data.category && (
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {data.category}
                  </span>
                )}
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    data.status === "published"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  }`}
                >
                  {data.status === "published"
                    ? language === "es"
                      ? "Publicado"
                      : "Published"
                    : language === "es"
                      ? "Borrador (Vista previa)"
                      : "Draft (Preview)"}
                </span>
                {data.school_id && (
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Building className="size-3" />
                    {schoolNames[data.school_id] || data.school_id}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                {displayTitle || "Sin título"}
              </h1>

              {/* Dates & Source info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/40">
                {data.starts_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5 text-emerald-600" />
                    <span>
                      {language === "es" ? "Fecha de inicio:" : "Start date:"}{" "}
                      <strong className="text-foreground">{data.starts_at.slice(0, 10)}</strong>
                    </span>
                  </span>
                )}
                {data.ends_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5 text-amber-600" />
                    <span>
                      {language === "es" ? "Fecha de término:" : "End date:"}{" "}
                      <strong className="text-foreground">{data.ends_at.slice(0, 10)}</strong>
                    </span>
                  </span>
                )}
                {data.source_name && (
                  <span className="text-xs">
                    {language === "es" ? "Fuente:" : "Source:"}{" "}
                    <strong className="text-foreground">{data.source_name}</strong>
                  </span>
                )}
              </div>

              {/* Optional Featured Image */}
              {data.image_url && (
                <div className="rounded-xl overflow-hidden border border-border/60 max-h-72 bg-muted">
                  <img
                    src={data.image_url}
                    alt={data.image_alt || displayTitle || "Imagen del recurso"}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Summary */}
              {displaySummary && (
                <div
                  className={`p-4 rounded-xl border font-medium text-sm leading-relaxed ${
                    theme === "dark"
                      ? "bg-slate-800/60 border-slate-700 text-slate-200"
                      : "bg-slate-100 border-slate-200 text-slate-800"
                  }`}
                >
                  {displaySummary}
                </div>
              )}

              {/* Body */}
              {displayBody ? (
                displayBody.includes("<") && displayBody.includes(">") ? (
                  <div
                    className="article-rendered-content max-w-none text-sm sm:text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: displayBody }}
                  />
                ) : (
                  <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {displayBody}
                  </div>
                )
              ) : (
                <p className="text-muted-foreground italic text-sm">
                  {language === "es"
                    ? "No hay texto principal redactado aún para este contenido."
                    : "No main text provided yet for this content."}
                </p>
              )}

              {/* Official Source Link */}
              {data.official_url && (
                <div className="pt-4 border-t border-border/40">
                  <a
                    href={data.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                  >
                    <span>
                      {language === "es" ? "Ver enlace oficial de DMPS" : "View official DMPS link"}
                    </span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-950 border-t border-slate-800 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl"
          >
            <ArrowLeft className="size-4 mr-2" />
            Volver a editar
          </Button>

          <div className="flex items-center gap-2">
            {onSaveDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onSaveDraft();
                  onOpenChange(false);
                }}
                className="bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 rounded-xl font-semibold text-xs min-h-10"
              >
                Guardar borrador
              </Button>
            )}
            {onPublish && (
              <Button
                type="button"
                onClick={() => {
                  onPublish();
                  onOpenChange(false);
                }}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs min-h-10 shadow-soft"
              >
                <CheckCircle2 className="size-4 mr-1.5" />
                Publicar contenido ahora
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
