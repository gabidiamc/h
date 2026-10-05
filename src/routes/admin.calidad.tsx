import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  FileCheck2,
  AlertTriangle,
  Link2,
  Languages,
  Copy,
  ImageIcon,
  CalendarAlert,
  Inbox,
  CheckCircle2,
  ArrowUpRight,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/lib/school";
import { logAudit } from "@/lib/admin";
import { formatDesMoinesDate } from "@/lib/content-lifecycle";

export const Route = createFileRoute("/admin/calidad")({
  component: AdminCalidadPage,
});

interface QualityIssue {
  id: string;
  table: "articles" | "announcements" | "events" | "programs" | "categories" | "requests";
  title: string;
  schoolId?: string | null;
  issueType:
    | "unverified_source"
    | "broken_link"
    | "missing_translation"
    | "duplicate_title"
    | "missing_alt"
    | "expired_active"
    | "family_report";
  issueCategory:
    | "unverified"
    | "broken_links"
    | "duplicates"
    | "translations"
    | "alt_text"
    | "dates"
    | "reports";
  severity: "high" | "medium" | "low";
  description: string;
  recommendation: string;
  editUrl: string;
  extraData?: Record<string, unknown>;
}

function AdminCalidadPage() {
  const { adminSchoolFilter } = useSchool();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Fetch data from multiple tables to evaluate quality metrics
  const {
    data: issues = [],
    isLoading,
    refetch,
  } = useQuery<QualityIssue[]>({
    queryKey: ["admin_quality_issues", adminSchoolFilter],
    queryFn: async () => {
      const results: QualityIssue[] = [];

      // 1. Check Articles
      const [{ data: rawArticles }, { data: artTrs }] = await Promise.all([
        supabase.from("articles").select("*"),
        supabase.from("article_translations").select("article_id, language_code, title"),
      ]);
      const articles = (rawArticles ?? []).map((a) => ({
        ...a,
        article_translations: (artTrs ?? []).filter((t) => String(t.article_id) === String(a.id)),
      }));

      if (articles) {
        // Track duplicate titles
        const titleCounts: Record<string, number> = {};
        articles.forEach((a) => {
          const norm = a.title.trim().toLowerCase();
          titleCounts[norm] = (titleCounts[norm] || 0) + 1;
        });

        articles.forEach((art) => {
          const norm = art.title.trim().toLowerCase();

          // Check unverified sources
          if (
            art.status === "published" &&
            (!art.source_name || art.source_name.trim().length === 0)
          ) {
            results.push({
              id: `art-unv-${art.id}`,
              table: "articles",
              title: art.title,
              schoolId: art.school_id,
              issueType: "unverified_source",
              issueCategory: "unverified",
              severity: "medium",
              description:
                "El artículo está publicado pero no tiene registrada una fuente oficial.",
              recommendation:
                "Agrega la fuente oficial (ej. 'Distrito Escolar DMPS') para mayor credibilidad.",
              editUrl: "/admin/articulos",
            });
          }

          // Check broken or invalid URLs
          if (art.official_url) {
            const url = art.official_url.trim();
            if (
              !url.startsWith("http://") &&
              !url.startsWith("https://") &&
              !url.startsWith("mailto:") &&
              !url.startsWith("tel:")
            ) {
              results.push({
                id: `art-url-${art.id}`,
                table: "articles",
                title: art.title,
                schoolId: art.school_id,
                issueType: "broken_link",
                issueCategory: "broken_links",
                severity: "high",
                description: `El enlace oficial '${url}' no tiene un protocolo válido (debe iniciar con https://).`,
                recommendation: "Corrige el enlace agregando 'https://' al inicio de la dirección.",
                editUrl: "/admin/articulos",
              });
            }
          }

          // Check missing translations
          const translations = art.article_translations as
            Array<{ language_code?: string; title?: string }> | undefined;
          const hasEs = translations?.some((t) => t.language_code === "es" && t.title?.trim());
          const hasEn = translations?.some((t) => t.language_code === "en" && t.title?.trim());
          if (art.status === "published" && (!hasEs || !hasEn)) {
            const missing = !hasEs && !hasEn ? "ES y EN" : !hasEs ? "Español (ES)" : "Inglés (EN)";
            results.push({
              id: `art-trans-${art.id}`,
              table: "articles",
              title: art.title,
              schoolId: art.school_id,
              issueType: "missing_translation",
              issueCategory: "translations",
              severity: "medium",
              description: `Falta traducción en ${missing} para este artículo publicado.`,
              recommendation: `Abre el editor de traducciones y agrega el texto en ${missing}.`,
              editUrl: "/admin/articulos",
            });
          }

          // Check duplicate titles
          if (titleCounts[norm] > 1) {
            results.push({
              id: `art-dup-${art.id}`,
              table: "articles",
              title: art.title,
              schoolId: art.school_id,
              issueType: "duplicate_title",
              issueCategory: "duplicates",
              severity: "low",
              description: `Existen múltiples artículos con el mismo título ('${art.title}').`,
              recommendation:
                "Revisa si es contenido duplicado o aclara el título según la escuela.",
              editUrl: "/admin/articulos",
            });
          }

          // Check missing Alt text for images
          if (art.featured_image_url && (!art.image_alt || art.image_alt.trim().length === 0)) {
            results.push({
              id: `art-alt-${art.id}`,
              table: "articles",
              title: art.title,
              schoolId: art.school_id,
              issueType: "missing_alt",
              issueCategory: "alt_text",
              severity: "low",
              description: "La imagen destacada no tiene texto alternativo de accesibilidad (Alt).",
              recommendation:
                "Escribe una breve descripción de la imagen para lectores de pantalla de personas invidentes.",
              editUrl: "/admin/articulos",
            });
          }

          // Check active items with passed end dates
          if (art.status === "published" && art.ends_at) {
            const ends = new Date(art.ends_at).getTime();
            if (ends < Date.now()) {
              results.push({
                id: `art-exp-${art.id}`,
                table: "articles",
                title: art.title,
                schoolId: art.school_id,
                issueType: "expired_active",
                issueCategory: "dates",
                severity: "high",
                description: `La fecha de término (${art.ends_at.slice(0, 10)}) ya pasó, pero sigue marcado como publicado.`,
                recommendation:
                  "Archiva el contenido o extiende su fecha de vigencia desde el centro de vigencia.",
                editUrl: "/admin/vigencia",
              });
            }
          }
        });
      }

      // 2. Check Announcements
      const [{ data: rawAnnouncements }, { data: annTrs }] = await Promise.all([
        supabase.from("announcements").select("id, level, status, starts_at, expires_at, link_url"),
        supabase
          .from("announcement_translations")
          .select("announcement_id, language_code, title, message"),
      ]);
      const announcements = (rawAnnouncements ?? []).map((an) => ({
        ...an,
        announcement_translations: (annTrs ?? []).filter(
          (t) => String(t.announcement_id) === String(an.id),
        ),
      }));

      if (announcements) {
        announcements.forEach((an) => {
          const annTranslations = an.announcement_translations as
            Array<{ language_code?: string; title?: string; message?: string }> | undefined;
          const transEs = annTranslations?.find((t) => t.language_code === "es");
          const transEn = annTranslations?.find((t) => t.language_code === "en");
          const title = transEs?.title || transEn?.title || "Aviso oficial";

          if (an.status === "published" && (!transEs || !transEn)) {
            const missing =
              !transEs && !transEn ? "ES y EN" : !transEs ? "Español (ES)" : "Inglés (EN)";
            results.push({
              id: `ann-trans-${an.id}`,
              table: "announcements",
              title,
              issueType: "missing_translation",
              issueCategory: "translations",
              severity: "medium",
              description: `Aviso publicado sin texto en ${missing}.`,
              recommendation: "Completa el aviso en ambos idiomas para las familias.",
              editUrl: "/admin/anuncios",
            });
          }

          if (an.link_url && !an.link_url.startsWith("http")) {
            results.push({
              id: `ann-url-${an.id}`,
              table: "announcements",
              title,
              issueType: "broken_link",
              issueCategory: "broken_links",
              severity: "high",
              description: `El enlace del aviso '${an.link_url}' no tiene formato válido.`,
              recommendation: "Asegúrate de que empiece con https://.",
              editUrl: "/admin/anuncios",
            });
          }
        });
      }

      // 3. Check Family Update Requests (Pending)
      const { data: requests } = await supabase
        .from("update_requests")
        .select("id, page_url, message, kind, status, created_at")
        .eq("status", "open");

      if (requests) {
        requests.forEach((req) => {
          results.push({
            id: `req-${req.id}`,
            table: "requests",
            title: `Reporte de familia: ${req.kind === "bug" ? "Problema técnico" : "Información desactualizada"}`,
            issueType: "family_report",
            issueCategory: "reports",
            severity: "high",
            description: `Mensaje: "${req.message}" en la página ${req.page_url || "Sitio DMPS"}.`,
            recommendation:
              "Revisa la página señalada, corrige la información y marca el reporte como resuelto.",
            editUrl: "/admin/solicitudes",
            extraData: req,
          });
        });
      }

      return results;
    },
    staleTime: 1000 * 30,
  });

  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (activeTab !== "all" && issue.issueCategory !== activeTab) return false;
      if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !issue.title.toLowerCase().includes(q) &&
          !issue.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [issues, activeTab, severityFilter, search]);

  // Counts by category
  const counts = useMemo(() => {
    return {
      all: issues.length,
      unverified: issues.filter((i) => i.issueCategory === "unverified").length,
      broken_links: issues.filter((i) => i.issueCategory === "broken_links").length,
      translations: issues.filter((i) => i.issueCategory === "translations").length,
      duplicates: issues.filter((i) => i.issueCategory === "duplicates").length,
      alt_text: issues.filter((i) => i.issueCategory === "alt_text").length,
      dates: issues.filter((i) => i.issueCategory === "dates").length,
      reports: issues.filter((i) => i.issueCategory === "reports").length,
      highSeverity: issues.filter((i) => i.severity === "high").length,
    };
  }, [issues]);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <FileCheck2 className="size-4" />
            <span>Centro de Calidad y Verificación</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
            Bandeja: Necesita Revisión
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Detecta automáticamente información sin fuente, enlaces sospechosos, traducciones
            faltantes, contenidos vencidos y reportes enviados por las familias.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="min-h-10 rounded-xl gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Analizar de nuevo
          </Button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`border-border cursor-pointer transition-all ${activeTab === "all" ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/40"}`}
          onClick={() => setActiveTab("all")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total de Observaciones</p>
              <p className="text-2xl font-black text-foreground mt-1">{counts.all}</p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileCheck2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-border cursor-pointer transition-all ${activeTab === "reports" ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/40"}`}
          onClick={() => setActiveTab("reports")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Reportes de Familias</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {counts.reports}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
              <Inbox className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-border cursor-pointer transition-all ${activeTab === "broken_links" ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/40"}`}
          onClick={() => setActiveTab("broken_links")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Enlaces con Problemas</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {counts.broken_links}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Link2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-border cursor-pointer transition-all ${activeTab === "translations" ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/40"}`}
          onClick={() => setActiveTab("translations")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Falta Traducción</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {counts.translations}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Languages className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-4">
        {/* Horizontal Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {[
            { id: "all", label: "Todas las observaciones", count: counts.all },
            { id: "reports", label: "Reportes familias", count: counts.reports },
            { id: "unverified", label: "Sin fuente oficial", count: counts.unverified },
            { id: "broken_links", label: "Enlaces con error", count: counts.broken_links },
            { id: "translations", label: "Falta traducción", count: counts.translations },
            { id: "dates", label: "Vencidos activos", count: counts.dates },
            { id: "duplicates", label: "Duplicados", count: counts.duplicates },
            { id: "alt_text", label: "Sin texto Alt", count: counts.alt_text },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-background text-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Severity Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título o descripción del problema..."
              className="pl-10 min-h-10 rounded-xl text-sm"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-semibold">Importancia:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="min-h-10 rounded-xl border border-input bg-background px-3 py-1 font-semibold text-foreground"
            >
              <option value="all">Todas</option>
              <option value="high">🔴 Alta prioridad</option>
              <option value="medium">🟡 Media</option>
              <option value="low">🔵 Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
            <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              ¡Excelente! No hay observaciones pendientes
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Todos los contenidos verificados cumplen con los estándares de calidad, enlaces
              válidos y fechas consistentes.
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
                issue.severity === "high"
                  ? "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50"
                  : issue.severity === "medium"
                    ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                    : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Issue Details */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        issue.severity === "high"
                          ? "bg-rose-500 text-white"
                          : issue.severity === "medium"
                            ? "bg-amber-500 text-slate-950 font-black"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      Prioridad{" "}
                      {issue.severity === "high"
                        ? "Alta"
                        : issue.severity === "medium"
                          ? "Media"
                          : "Baja"}
                    </span>

                    <span className="text-[11px] font-bold rounded-full bg-primary/10 text-primary px-2.5 py-0.5 uppercase">
                      {issue.table === "articles"
                        ? "Artículo"
                        : issue.table === "announcements"
                          ? "Aviso"
                          : issue.table === "requests"
                            ? "Reporte de Familia"
                            : issue.table}
                    </span>

                    {issue.schoolId && (
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                        • {issue.schoolId}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-foreground">{issue.title}</h3>

                  <div className="text-sm text-foreground/90 leading-relaxed font-medium">
                    <span className="font-bold text-destructive dark:text-rose-400">
                      Qué ocurre:{" "}
                    </span>
                    {issue.description}
                  </div>

                  <div className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
                    <strong className="text-primary shrink-0">Acción recomendada:</strong>
                    <span>{issue.recommendation}</span>
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="shrink-0 flex items-center gap-2">
                  <a
                    href={issue.editUrl}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-xs font-bold text-white hover:bg-primary-deep shadow-soft transition-all"
                  >
                    <span>Corregir elemento</span>
                    <ArrowUpRight className="size-4 ml-1.5" />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
