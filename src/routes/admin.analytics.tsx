import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Eye,
  FileText,
  Globe,
  Laptop,
  Layers,
  MousePointerClick,
  Radio,
  RefreshCw,
  School,
  Search,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ANALYTICS_PERIOD_OPTIONS,
  fetchAnalyticsIntelligenceReport,
  fetchAnalyticsOverviewAndSeries,
  fetchAudienceAnalytics,
  fetchContentAnalytics,
  fetchDashboardAnalyticsConfig,
  fetchNavigationAnalytics,
  fetchPwaAnalytics,
  fetchRealtimePresenceSnapshot,
  fetchSchoolsAnalytics,
  fetchSearchesAnalytics,
  type AnalyticsComparisonMetric,
  type AnalyticsPeriodKey,
  type AudienceRow,
  type DashboardContentCategory,
} from "@/analytics";
import { AnalyticsIntelligencePanel } from "@/components/admin/analytics-intelligence-panel";
import { AnalyticsReportsPanel } from "@/components/admin/analytics-reports-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/admin";
import { getSchoolById, useSchool } from "@/lib/school";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsPage,
});

type DashboardSectionTab =
  | "overview"
  | "intelligence"
  | "reports"
  | "realtime"
  | "audience"
  | "content"
  | "searches"
  | "schools"
  | "pwa"
  | "navigation";

const CONTENT_CATEGORY_FILTERS: Array<{
  key: DashboardContentCategory;
  label: string;
}> = [
  { key: "all", label: "Todos" },
  { key: "pages", label: "Páginas" },
  { key: "articles", label: "Artículos" },
  { key: "categories", label: "Categorías" },
  { key: "resources", label: "Recursos" },
  { key: "programs", label: "Programas" },
  { key: "activities", label: "Actividades" },
  { key: "faqs", label: "FAQs" },
  { key: "announcements", label: "Avisos" },
  { key: "schools", label: "Escuelas" },
  { key: "contacts", label: "Contactos" },
  { key: "external_links", label: "Enlaces externos" },
];

const CONTENT_PAGE_SIZE = 10;

function formatDurationSeconds(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) {
    return "—";
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
}

function ComparisonIndicator({
  metric,
  period,
}: {
  metric: AnalyticsComparisonMetric;
  period: AnalyticsPeriodKey;
}) {
  if (period === "all") {
    return (
      <span className="text-[11px] font-medium text-muted-foreground">
        Historial acumulado completo
      </span>
    );
  }

  if (!metric.hasComparison || metric.direction === "insufficient") {
    return (
      <span className="text-[11px] font-medium text-muted-foreground">
        Sin datos suficientes para comparar.
      </span>
    );
  }

  if (metric.direction === "up") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <span>↑ aumento</span>
        {metric.deltaPercent !== null && (
          <span>
            ({metric.deltaPercent > 0 ? `+${metric.deltaPercent}%` : `${metric.deltaPercent}%`})
          </span>
        )}
        <span className="text-muted-foreground font-normal">vs. periodo anterior</span>
      </span>
    );
  }

  if (metric.direction === "down") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
        <span>↓ disminución</span>
        {metric.deltaPercent !== null && <span>({metric.deltaPercent}%)</span>}
        <span className="text-muted-foreground font-normal">vs. periodo anterior</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
      <span>— sin cambio</span>
      <span className="font-normal">(0%) vs. periodo anterior</span>
    </span>
  );
}

function SectionErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
      <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
        <AlertCircle className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-foreground">
          No fue posible cargar estos datos. Intenta nuevamente.
        </p>
        {message && <p className="text-xs text-muted-foreground max-w-lg mx-auto">{message}</p>}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="rounded-xl text-xs font-bold gap-1.5"
      >
        <RefreshCw className="size-3.5" />
        <span>Reintentar</span>
      </Button>
    </div>
  );
}

function SectionEmptyState({
  text = "No hay datos disponibles para este periodo.",
}: {
  text?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-muted/20 p-8 text-center space-y-2">
      <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <BarChart3 className="size-5" />
      </div>
      <p className="text-sm font-bold text-foreground">{text}</p>
      <p className="text-xs text-muted-foreground max-w-md mx-auto">
        Las métricas provienen únicamente de eventos reales registrados en Supabase PostgreSQL.
      </p>
    </div>
  );
}

function AudienceDimensionCard({
  title,
  subtitle,
  icon: Icon,
  rows,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  rows: AudienceRow[];
}) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-2xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Icon className="size-4 text-primary" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription className="text-xs">{subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No hay datos disponibles para este periodo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/70 text-muted-foreground font-bold">
                  <th className="py-2 pr-3">{title}</th>
                  <th className="py-2 px-3 text-right">Usuarios</th>
                  <th className="py-2 px-3 text-right">Sesiones</th>
                  <th className="py-2 pl-3 text-right">% Sesiones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((row) => (
                  <tr key={row.dimension} className="hover:bg-muted/40">
                    <td className="py-2.5 pr-3 font-semibold text-foreground">{row.dimension}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{row.users}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{row.sessions}</td>
                    <td className="py-2.5 pl-3 text-right text-muted-foreground">
                      {row.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminAnalyticsPage() {
  const session = useAdminSession();
  const { adminSchoolFilter } = useSchool();
  const activeSchool = adminSchoolFilter !== "all" ? getSchoolById(adminSchoolFilter) : null;
  const queryClient = useQueryClient();

  const [period, setPeriod] = useState<AnalyticsPeriodKey>("30d");
  const [activeTab, setActiveTab] = useState<DashboardSectionTab>("overview");
  const [contentCategory, setContentCategory] = useState<DashboardContentCategory>("all");
  const [contentSearch, setContentSearch] = useState("");
  const [contentPage, setContentPage] = useState(1);

  const isAuthorizedAdmin = session.role === "super_admin" || session.role === "admin";

  // 1. Config Query
  const configQuery = useQuery({
    queryKey: ["dmps_analytics_dashboard_config"],
    queryFn: fetchDashboardAnalyticsConfig,
    enabled: isAuthorizedAdmin,
    staleTime: 30_000,
  });

  const presenceTimeoutSec = configQuery.data?.presence_timeout_seconds ?? 60;

  // 2. Overview + Charts Query
  const overviewQuery = useQuery({
    queryKey: ["dmps_analytics_overview", period, adminSchoolFilter, presenceTimeoutSec],
    queryFn: () => fetchAnalyticsOverviewAndSeries(period, adminSchoolFilter, presenceTimeoutSec),
    enabled: isAuthorizedAdmin,
    staleTime: 15_000,
  });

  // 3. Realtime Presence Query + Supabase Realtime subscription
  const presenceQuery = useQuery({
    queryKey: ["dmps_analytics_presence_live", presenceTimeoutSec],
    queryFn: () => fetchRealtimePresenceSnapshot(presenceTimeoutSec),
    enabled: isAuthorizedAdmin,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (!isAuthorizedAdmin) return;

    const channel = supabase
      .channel("dmps_admin_analytics_presence_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dmps_analytics_presence",
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["dmps_analytics_presence_live"],
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAuthorizedAdmin, queryClient]);

  // 4. Audience Query
  const audienceQuery = useQuery({
    queryKey: ["dmps_analytics_audience", period],
    queryFn: () => fetchAudienceAnalytics(period),
    enabled: isAuthorizedAdmin,
    staleTime: 20_000,
  });

  // 5. Content Query
  const contentQuery = useQuery({
    queryKey: ["dmps_analytics_content", period, adminSchoolFilter],
    queryFn: () => fetchContentAnalytics(period, adminSchoolFilter),
    enabled: isAuthorizedAdmin,
    staleTime: 20_000,
  });

  // 6. Searches Query
  const searchesQuery = useQuery({
    queryKey: ["dmps_analytics_searches", period],
    queryFn: () => fetchSearchesAnalytics(period),
    enabled: isAuthorizedAdmin,
    staleTime: 20_000,
  });

  // 7. Schools Query
  const schoolsQuery = useQuery({
    queryKey: ["dmps_analytics_schools", period],
    queryFn: () => fetchSchoolsAnalytics(period),
    enabled: isAuthorizedAdmin,
    staleTime: 20_000,
  });

  // 8. PWA Query
  const pwaQuery = useQuery({
    queryKey: ["dmps_analytics_pwa", period],
    queryFn: () => fetchPwaAnalytics(period),
    enabled: isAuthorizedAdmin,
    staleTime: 20_000,
  });

  // 9. Navigation Query
  const navigationQuery = useQuery({
    queryKey: ["dmps_analytics_navigation", period, adminSchoolFilter],
    queryFn: () => fetchNavigationAnalytics(period, adminSchoolFilter),
    enabled: isAuthorizedAdmin,
    staleTime: 20_000,
  });

  // 10. Stage 4 Intelligence Query
  const intelligenceQuery = useQuery({
    queryKey: ["dmps_analytics_intelligence", period, adminSchoolFilter],
    queryFn: () => fetchAnalyticsIntelligenceReport(period, adminSchoolFilter),
    enabled: isAuthorizedAdmin,
    staleTime: 20_000,
  });

  // Filter & paginate content rows
  const filteredContentRows = useMemo(() => {
    const allRows = contentQuery.data?.rows ?? [];
    return allRows.filter((row) => {
      if (contentCategory !== "all" && row.categoryGroup !== contentCategory) {
        return false;
      }
      if (contentSearch.trim()) {
        const q = contentSearch.trim().toLowerCase();
        return (
          row.title.toLowerCase().includes(q) ||
          row.contentType.toLowerCase().includes(q) ||
          row.contentId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contentQuery.data?.rows, contentCategory, contentSearch]);

  const totalContentPages = Math.max(1, Math.ceil(filteredContentRows.length / CONTENT_PAGE_SIZE));
  const paginatedContentRows = useMemo(() => {
    const safePage = Math.min(contentPage, totalContentPages);
    const start = (safePage - 1) * CONTENT_PAGE_SIZE;
    return filteredContentRows.slice(start, start + CONTENT_PAGE_SIZE);
  }, [filteredContentRows, contentPage, totalContentPages]);

  const handleRefreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["dmps_analytics_dashboard_config"] });
    void queryClient.invalidateQueries({ queryKey: ["dmps_analytics_overview"] });
    void queryClient.invalidateQueries({ queryKey: ["dmps_analytics_presence_live"] });
    void queryClient.invalidateQueries({ queryKey: ["dmps_analytics_audience"] });
    void queryClient.invalidateQueries({ queryKey: ["dmps_analytics_content"] });
    void queryClient.invalidateQueries({ queryKey: ["dmps_analytics_searches"] });
    void queryClient.invalidateQueries({ queryKey: ["dmps_analytics_schools"] });
    void queryClient.invalidateQueries({ queryKey: ["dmps_analytics_pwa"] });
    void queryClient.invalidateQueries({ queryKey: ["dmps_analytics_navigation"] });
    void queryClient.invalidateQueries({ queryKey: ["dmps_analytics_intelligence"] });
  };

  if (session.loading) {
    return (
      <div className="space-y-6 pb-12">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!isAuthorizedAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md space-y-4 rounded-2xl border border-destructive/30 bg-card p-6 text-center shadow-soft">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">
            Acceso restringido a Administradores
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            El panel de Analítica Real de DMPS INFO está protegido por políticas RLS (
            <code>public.is_admin()</code>) y requiere rol de Administrador o Super Administrador.
          </p>
        </div>
      </div>
    );
  }

  const liveActiveUsers =
    presenceQuery.data?.activeCount ?? overviewQuery.data?.overview.activeUsersNow ?? 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <BarChart3 className="size-4" />
            <span>Sistema de Analítica Real — Supabase PostgreSQL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Analítica y Métricas de DMPS INFO
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Datos reales, privados y agregados recopilados directamente desde Supabase sin
            identificadores personales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active users live pill */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
            </span>
            <span>{liveActiveUsers} usuarios activos</span>
          </div>

          {/* School Scope Badge */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground">
            <School className="size-4 text-primary" />
            <span>{activeSchool ? activeSchool.name : "Distrito completo"}</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="min-h-10 rounded-xl gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`size-3.5 ${overviewQuery.isFetching ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Global Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground px-1">
          <Calendar className="size-4 text-primary" />
          <span>Periodo de consulta en Supabase:</span>
          {overviewQuery.data?.dateRange && (
            <span className="hidden md:inline text-foreground font-semibold">
              ({overviewQuery.data.dateRange.label})
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {ANALYTICS_PERIOD_OPTIONS.map((opt) => {
            const isSelected = period === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setPeriod(opt.key);
                  setContentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/80 pb-3 overflow-x-auto text-xs font-bold">
        {[
          { id: "overview" as const, label: "Resumen y Gráficos", icon: BarChart3 },
          { id: "intelligence" as const, label: "Inteligencia", icon: Sparkles },
          { id: "reports" as const, label: "Reportes y Exportación", icon: FileText },
          { id: "realtime" as const, label: "Tiempo real", icon: Radio },
          { id: "audience" as const, label: "Audiencia", icon: Users },
          { id: "content" as const, label: "Contenido", icon: BookOpen },
          { id: "searches" as const, label: "Búsquedas", icon: Search },
          { id: "schools" as const, label: "Escuelas", icon: School },
          { id: "pwa" as const, label: "PWA", icon: Smartphone },
          { id: "navigation" as const, label: "Navegación", icon: Compass },
        ].map((tab) => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <IconComp className="size-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 0: STAGE 4 ANALYTICS INTELLIGENCE */}
      {activeTab === "intelligence" && (
        <AnalyticsIntelligencePanel
          report={intelligenceQuery.data}
          isLoading={intelligenceQuery.isLoading}
          isError={intelligenceQuery.isError}
          errorMessage={(intelligenceQuery.error as Error)?.message}
          onRetry={() => void intelligenceQuery.refetch()}
        />
      )}

      {/* SECTION 0.5: STAGE 5 ANALYTICS REPORTS & EXPORTS */}
      {activeTab === "reports" && (
        <AnalyticsReportsPanel
          period={period}
          schoolFilter={adminSchoolFilter}
          schoolNameLabel={activeSchool?.name || "Todas las escuelas"}
        />
      )}

      {/* SECTION 1: OVERVIEW & CHARTS */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {overviewQuery.isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <Skeleton key={`ov-skel-${idx}`} className="h-32 rounded-2xl" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-72 rounded-2xl" />
                <Skeleton className="h-72 rounded-2xl" />
              </div>
            </div>
          ) : overviewQuery.isError ? (
            <SectionErrorState
              message={(overviewQuery.error as Error)?.message}
              onRetry={() => void overviewQuery.refetch()}
            />
          ) : !overviewQuery.data?.overview.hasAnyData ? (
            <div className="space-y-6">
              {/* Even when period has no historical rows, show current active users card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">
                        Usuarios activos actualmente
                      </span>
                      <Radio className="size-4 text-emerald-600" />
                    </div>
                    <div className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {liveActiveUsers}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Ventana activa: últimos {presenceTimeoutSec}s
                    </p>
                  </CardContent>
                </Card>
              </div>
              <SectionEmptyState text="No hay datos disponibles para este periodo." />
            </div>
          ) : (
            <>
              {/* 8 Overview Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Unique Users */}
                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">
                        Usuarios únicos
                      </span>
                      <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Users className="size-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-foreground">
                      {overviewQuery.data.overview.uniqueUsers.current}
                    </div>
                    <ComparisonIndicator
                      metric={overviewQuery.data.overview.uniqueUsers}
                      period={period}
                    />
                  </CardContent>
                </Card>

                {/* 2. Sessions */}
                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">Sesiones</span>
                      <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <Activity className="size-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-foreground">
                      {overviewQuery.data.overview.sessions.current}
                    </div>
                    <ComparisonIndicator
                      metric={overviewQuery.data.overview.sessions}
                      period={period}
                    />
                  </CardContent>
                </Card>

                {/* 3. Page Views */}
                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">
                        Páginas vistas
                      </span>
                      <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Eye className="size-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-foreground">
                      {overviewQuery.data.overview.pageViews.current}
                    </div>
                    <ComparisonIndicator
                      metric={overviewQuery.data.overview.pageViews}
                      period={period}
                    />
                  </CardContent>
                </Card>

                {/* 4. Unique Pages */}
                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">
                        Páginas únicas
                      </span>
                      <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                        <FileText className="size-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-foreground">
                      {overviewQuery.data.overview.uniquePages.current}
                    </div>
                    <ComparisonIndicator
                      metric={overviewQuery.data.overview.uniquePages}
                      period={period}
                    />
                  </CardContent>
                </Card>

                {/* 5. Searches */}
                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">Búsquedas</span>
                      <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Search className="size-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-foreground">
                      {overviewQuery.data.overview.searches.current}
                    </div>
                    <ComparisonIndicator
                      metric={overviewQuery.data.overview.searches}
                      period={period}
                    />
                  </CardContent>
                </Card>

                {/* 6. Events */}
                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">Eventos</span>
                      <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                        <MousePointerClick className="size-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-foreground">
                      {overviewQuery.data.overview.events.current}
                    </div>
                    <ComparisonIndicator
                      metric={overviewQuery.data.overview.events}
                      period={period}
                    />
                  </CardContent>
                </Card>

                {/* 7. Active Users Currently */}
                <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/5 shadow-2xs">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Usuarios activos ahora
                      </span>
                      <div className="size-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                        <Radio className="size-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {liveActiveUsers}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Presencia en vivo ({presenceTimeoutSec}s timeout)
                    </span>
                  </CardContent>
                </Card>

                {/* 8. PWA Installs */}
                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">
                        Instalaciones PWA
                      </span>
                      <div className="size-8 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
                        <Smartphone className="size-4" />
                      </div>
                    </div>
                    {overviewQuery.data.overview.pwaInstalls.current > 0 ? (
                      <>
                        <div className="text-3xl font-black text-foreground">
                          {overviewQuery.data.overview.pwaInstalls.current}
                        </div>
                        <ComparisonIndicator
                          metric={overviewQuery.data.overview.pwaInstalls}
                          period={period}
                        />
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-bold text-muted-foreground pt-1">
                          Sin instalaciones en el periodo
                        </div>
                        <span className="text-[11px] text-muted-foreground block">
                          Se registra al instalar la app PWA
                        </span>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 4 Daily Charts */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">
                    Evolución Diaria en Supabase
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Métricas agrupadas por día dentro del periodo seleccionado.
                  </p>
                </div>

                {overviewQuery.data.dailySeries.length === 0 ? (
                  <SectionEmptyState text="No hay series diarias disponibles para este periodo." />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart 1: Page Views per Day */}
                    <Card className="rounded-2xl border-border/80 shadow-2xs">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                          <Eye className="size-4 text-emerald-600" />
                          <span>Vistas por día</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Total de páginas vistas registradas por fecha
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-64 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={overviewQuery.data.dailySeries}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="pageViews"
                              name="Páginas vistas"
                              stroke="#10b981"
                              fill="#10b981"
                              fillOpacity={0.2}
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Chart 2: Unique Users per Day */}
                    <Card className="rounded-2xl border-border/80 shadow-2xs">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                          <Users className="size-4 text-primary" />
                          <span>Usuarios por día</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Visitantes anónimos únicos por día
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-64 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={overviewQuery.data.dailySeries}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="uniqueUsers"
                              name="Usuarios únicos"
                              stroke="#2563eb"
                              fill="#2563eb"
                              fillOpacity={0.2}
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Chart 3: Sessions per Day */}
                    <Card className="rounded-2xl border-border/80 shadow-2xs">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                          <Activity className="size-4 text-indigo-600" />
                          <span>Sesiones por día</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Sesiones iniciadas o activas por día
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-64 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={overviewQuery.data.dailySeries}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar
                              dataKey="sessions"
                              name="Sesiones"
                              fill="#6366f1"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Chart 4: Searches per Day */}
                    <Card className="rounded-2xl border-border/80 shadow-2xs">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                          <Search className="size-4 text-amber-600" />
                          <span>Búsquedas por día</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Consultas realizadas en el buscador público por día
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-64 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={overviewQuery.data.dailySeries}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar
                              dataKey="searches"
                              name="Búsquedas"
                              fill="#f59e0b"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* SECTION 2: REAL-TIME PRESENCE */}
      {activeTab === "realtime" && (
        <div className="space-y-6">
          {presenceQuery.isLoading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : presenceQuery.isError ? (
            <SectionErrorState
              message={(presenceQuery.error as Error)?.message}
              onRetry={() => void presenceQuery.refetch()}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="p-5 space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">
                      Estado de presencia actual
                    </span>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {presenceQuery.data?.activeCount ?? 0} usuarios activos
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Conectado a Supabase Realtime (<code>dmps_analytics_presence</code>)
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-5 space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">
                      Última actividad detectada
                    </span>
                    <div className="text-lg font-extrabold text-foreground pt-1">
                      {presenceQuery.data?.lastActivityAt
                        ? new Date(presenceQuery.data.lastActivityAt).toLocaleTimeString("es-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "Sin actividad reciente"}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Basado en <code>last_seen_at</code> del servidor
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-5 space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">
                      Ventana de expiración (Timeout)
                    </span>
                    <div className="text-lg font-extrabold text-foreground pt-1">
                      {presenceQuery.data?.timeoutSeconds ?? presenceTimeoutSec} segundos
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Configurado en <code>dmps_analytics_config.presence_timeout_seconds</code>
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-2xl border-border/80 shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <Radio className="size-4 text-emerald-600" />
                    <span>Actividad en Tiempo Real (Agregada y Anónima)</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Muestra las rutas activas dentro de los últimos{" "}
                    {presenceQuery.data?.timeoutSeconds ?? presenceTimeoutSec} segundos sin exponer
                    identificadores personales.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!presenceQuery.data || presenceQuery.data.items.length === 0 ? (
                    <div className="py-8 text-center space-y-1">
                      <p className="text-sm font-bold text-foreground">0 usuarios activos</p>
                      <p className="text-xs text-muted-foreground">
                        No hay visitantes con pestaña activa en los últimos{" "}
                        {presenceQuery.data?.timeoutSeconds ?? presenceTimeoutSec} segundos.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border/70 text-muted-foreground font-bold">
                            <th className="py-2.5 pr-3">Ruta activa</th>
                            <th className="py-2.5 px-3">Tipo de contenido</th>
                            <th className="py-2.5 px-3">Dispositivo</th>
                            <th className="py-2.5 px-3">Idioma</th>
                            <th className="py-2.5 px-3">Modo</th>
                            <th className="py-2.5 pl-3 text-right">Último pulso</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {presenceQuery.data.items.map((item, idx) => (
                            <tr
                              key={`${item.currentPath}-${item.lastSeenAt}-${idx}`}
                              className="hover:bg-muted/40"
                            >
                              <td className="py-2.5 pr-3 font-mono font-semibold text-foreground">
                                {item.currentPath}
                              </td>
                              <td className="py-2.5 px-3 capitalize text-muted-foreground">
                                {item.currentContentType}
                              </td>
                              <td className="py-2.5 px-3 capitalize">{item.deviceType}</td>
                              <td className="py-2.5 px-3 uppercase font-mono">{item.language}</td>
                              <td className="py-2.5 px-3">
                                {item.isPwa ? (
                                  <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-bold">
                                    PWA
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">Navegador</span>
                                )}
                              </td>
                              <td className="py-2.5 pl-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                                hace {item.secondsAgo}s
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* SECTION 3: AUDIENCE */}
      {activeTab === "audience" && (
        <div className="space-y-6">
          {audienceQuery.isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          ) : audienceQuery.isError ? (
            <SectionErrorState
              message={(audienceQuery.error as Error)?.message}
              onRetry={() => void audienceQuery.refetch()}
            />
          ) : !audienceQuery.data?.hasAnyData ? (
            <SectionEmptyState text="No hay datos disponibles para este periodo." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AudienceDimensionCard
                title="Idioma"
                subtitle="Distribución de usuarios y sesiones por idioma"
                icon={Globe}
                rows={audienceQuery.data.languages}
              />
              <AudienceDimensionCard
                title="Dispositivo"
                subtitle="Móvil, escritorio y tablet"
                icon={Smartphone}
                rows={audienceQuery.data.devices}
              />
              <AudienceDimensionCard
                title="Navegador"
                subtitle="Navegadores utilizados en las sesiones registradas"
                icon={Compass}
                rows={audienceQuery.data.browsers}
              />
              <AudienceDimensionCard
                title="Sistema operativo"
                subtitle="Plataformas y sistemas operativos detectados"
                icon={Laptop}
                rows={audienceQuery.data.operatingSystems}
              />
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: CONTENT */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {contentQuery.isLoading ? (
            <Skeleton className="h-96 w-full rounded-2xl" />
          ) : contentQuery.isError ? (
            <SectionErrorState
              message={(contentQuery.error as Error)?.message}
              onRetry={() => void contentQuery.refetch()}
            />
          ) : !contentQuery.data?.hasAnyData ? (
            <SectionEmptyState text="No hay datos disponibles para este periodo." />
          ) : (
            <Card className="rounded-2xl border-border/80 shadow-2xs">
              <CardHeader className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-extrabold flex items-center gap-2">
                      <BookOpen className="size-4 text-primary" />
                      <span>Contenidos más consultados</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Nombres resueltos dinámicamente contra las tablas reales de DMPS INFO en
                      Supabase.
                    </CardDescription>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      value={contentSearch}
                      onChange={(e) => {
                        setContentSearch(e.target.value);
                        setContentPage(1);
                      }}
                      placeholder="Filtrar contenido..."
                      className="pl-8 h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {CONTENT_CATEGORY_FILTERS.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setContentCategory(cat.key);
                        setContentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        contentCategory === cat.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {filteredContentRows.length === 0 ? (
                  <SectionEmptyState text="No hay datos disponibles para este filtro en el periodo seleccionado." />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border/70 text-muted-foreground font-bold">
                            <th className="py-2.5 pr-3">Contenido</th>
                            <th className="py-2.5 px-3">Tipo</th>
                            <th className="py-2.5 px-3 text-right">Vistas</th>
                            <th className="py-2.5 px-3 text-right">Usuarios</th>
                            <th className="py-2.5 px-3 text-right">Sesiones</th>
                            <th className="py-2.5 pl-3 text-right">Tiempo promedio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {paginatedContentRows.map((row) => (
                            <tr key={row.key} className="hover:bg-muted/40">
                              <td className="py-3 pr-3">
                                <div className="font-bold text-foreground">{row.title}</div>
                                <div className="text-[11px] font-mono text-muted-foreground">
                                  {row.contentId}
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="inline-flex rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-bold">
                                  {row.contentType}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                                {row.views}
                              </td>
                              <td className="py-3 px-3 text-right font-mono">{row.users}</td>
                              <td className="py-3 px-3 text-right font-mono">{row.sessions}</td>
                              <td className="py-3 pl-3 text-right font-mono text-muted-foreground">
                                {formatDurationSeconds(row.avgDurationSeconds)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalContentPages > 1 && (
                      <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                        <span className="text-muted-foreground">
                          Mostrando página <strong>{contentPage}</strong> de{" "}
                          <strong>{totalContentPages}</strong> ({filteredContentRows.length}{" "}
                          registros)
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={contentPage <= 1}
                            onClick={() => setContentPage((p) => Math.max(1, p - 1))}
                            className="h-8 rounded-lg px-2.5 text-xs"
                          >
                            <ChevronLeft className="size-3.5 mr-1" />
                            Anterior
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={contentPage >= totalContentPages}
                            onClick={() =>
                              setContentPage((p) => Math.min(totalContentPages, p + 1))
                            }
                            className="h-8 rounded-lg px-2.5 text-xs"
                          >
                            Siguiente
                            <ChevronRight className="size-3.5 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* SECTION 5: SEARCHES */}
      {activeTab === "searches" && (
        <div className="space-y-6">
          {searchesQuery.isLoading ? (
            <Skeleton className="h-80 w-full rounded-2xl" />
          ) : searchesQuery.isError ? (
            <SectionErrorState
              message={(searchesQuery.error as Error)?.message}
              onRetry={() => void searchesQuery.refetch()}
            />
          ) : !searchesQuery.data?.hasAnyData ? (
            <SectionEmptyState text="No hay datos disponibles para este periodo." />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Total búsquedas
                    </span>
                    <span className="text-2xl font-black text-foreground mt-1 block">
                      {searchesQuery.data.totalSearches}
                    </span>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Usuarios únicos
                    </span>
                    <span className="text-2xl font-black text-foreground mt-1 block">
                      {searchesQuery.data.uniqueUsers}
                    </span>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Términos únicos
                    </span>
                    <span className="text-2xl font-black text-foreground mt-1 block">
                      {searchesQuery.data.uniqueTerms}
                    </span>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Con resultados
                    </span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                      {searchesQuery.data.withResults}
                    </span>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Sin resultados
                    </span>
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                      {searchesQuery.data.withoutResults}
                    </span>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Tasa de éxito
                    </span>
                    <span className="text-2xl font-black text-primary mt-1 block">
                      {searchesQuery.data.successRatePercent !== null
                        ? `${searchesQuery.data.successRatePercent}%`
                        : "—"}
                    </span>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Promedio resultados
                    </span>
                    <span className="text-2xl font-black text-foreground mt-1 block">
                      {searchesQuery.data.avgResults !== null ? searchesQuery.data.avgResults : "—"}
                    </span>
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-2xl border-border/80 shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <Search className="size-4 text-primary" />
                    <span>Términos más buscados</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Consultas sanitizadas y normalizadas sin información personal.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/70 text-muted-foreground font-bold">
                          <th className="py-2.5 pr-3">Término</th>
                          <th className="py-2.5 px-3 text-right">Búsquedas</th>
                          <th className="py-2.5 px-3 text-right">Usuarios</th>
                          <th className="py-2.5 pl-3 text-right">Resultados promedio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {searchesQuery.data.topTerms.map((item) => (
                          <tr key={item.term} className="hover:bg-muted/40">
                            <td className="py-2.5 pr-3 font-semibold text-foreground">
                              {item.term}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {item.searches}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">{item.users}</td>
                            <td className="py-2.5 pl-3 text-right font-mono">{item.avgResults}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* SECTION 6: SCHOOLS */}
      {activeTab === "schools" && (
        <div className="space-y-6">
          {schoolsQuery.isLoading ? (
            <Skeleton className="h-72 w-full rounded-2xl" />
          ) : schoolsQuery.isError ? (
            <SectionErrorState
              message={(schoolsQuery.error as Error)?.message}
              onRetry={() => void schoolsQuery.refetch()}
            />
          ) : !schoolsQuery.data?.hasAnyData ? (
            <SectionEmptyState text="No hay datos disponibles para este periodo." />
          ) : (
            <Card className="rounded-2xl border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <School className="size-4 text-primary" />
                  <span>Escuelas con actividad registrada</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Vinculado exclusivamente a las escuelas reales en <code>public.schools</code> que
                  registraron actividad en el periodo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/70 text-muted-foreground font-bold">
                        <th className="py-2.5 pr-3">Escuela</th>
                        <th className="py-2.5 px-3 text-right">Page views</th>
                        <th className="py-2.5 px-3 text-right">Usuarios</th>
                        <th className="py-2.5 px-3 text-right">Sesiones</th>
                        <th className="py-2.5 pl-3 text-right">Selecciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {schoolsQuery.data.rows.map((row) => (
                        <tr key={row.schoolId} className="hover:bg-muted/40">
                          <td className="py-3 pr-3">
                            <div className="font-bold text-foreground">{row.schoolName}</div>
                            {row.shortName && (
                              <div className="text-[11px] text-muted-foreground">
                                {row.shortName}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {row.pageViews}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">{row.users}</td>
                          <td className="py-3 px-3 text-right font-mono">{row.sessions}</td>
                          <td className="py-3 pl-3 text-right font-mono">{row.selections}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* SECTION 7: PWA */}
      {activeTab === "pwa" && (
        <div className="space-y-6">
          {pwaQuery.isLoading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : pwaQuery.isError ? (
            <SectionErrorState
              message={(pwaQuery.error as Error)?.message}
              onRetry={() => void pwaQuery.refetch()}
            />
          ) : !pwaQuery.data?.hasAnyData ? (
            <SectionEmptyState text="No hay datos de PWA disponibles para este periodo." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-border/80">
                <CardContent className="p-5 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">
                    Lanzamientos (Standalone)
                  </span>
                  <div className="text-3xl font-black text-foreground">
                    {pwaQuery.data.launches}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Evento <code>pwa_launch</code>
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80">
                <CardContent className="p-5 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">Prompts mostrados</span>
                  <div className="text-3xl font-black text-foreground">
                    {pwaQuery.data.promptsShown}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Evento <code>pwa_prompt_shown</code>
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80">
                <CardContent className="p-5 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">Instalaciones</span>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {pwaQuery.data.installs}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Evento <code>pwa_install</code>
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80">
                <CardContent className="p-5 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">
                    Tasa de instalación
                  </span>
                  <div className="text-3xl font-black text-primary">
                    {pwaQuery.data.installRatePercent !== null
                      ? `${pwaQuery.data.installRatePercent}%`
                      : "Sin datos suficientes"}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Instalaciones / Prompts mostrados
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* SECTION 8: BASIC NAVIGATION */}
      {activeTab === "navigation" && (
        <div className="space-y-6">
          {navigationQuery.isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-72 rounded-2xl" />
              <Skeleton className="h-72 rounded-2xl" />
              <Skeleton className="h-72 rounded-2xl" />
            </div>
          ) : navigationQuery.isError ? (
            <SectionErrorState
              message={(navigationQuery.error as Error)?.message}
              onRetry={() => void navigationQuery.refetch()}
            />
          ) : !navigationQuery.data?.hasAnyData ? (
            <SectionEmptyState text="No hay datos disponibles para este periodo." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Landing Pages */}
              <Card className="rounded-2xl border-border/80 shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                    <Compass className="size-4 text-primary" />
                    <span>Páginas de entrada</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Rutas donde inician las sesiones (<code>landing_path</code>)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {navigationQuery.data.landingPages.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      Sin registros en este periodo.
                    </p>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/70 text-muted-foreground font-bold">
                          <th className="py-2 pr-2">Ruta</th>
                          <th className="py-2 px-2 text-right">Sesiones</th>
                          <th className="py-2 pl-2 text-right">Usuarios</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {navigationQuery.data.landingPages.map((row) => (
                          <tr key={row.path} className="hover:bg-muted/40">
                            <td className="py-2 pr-2 font-mono font-semibold text-foreground truncate max-w-[160px]">
                              {row.path}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold">
                              {row.count}
                            </td>
                            <td className="py-2 pl-2 text-right font-mono">{row.users}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>

              {/* Exit Pages */}
              <Card className="rounded-2xl border-border/80 shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                    <Clock className="size-4 text-amber-600" />
                    <span>Páginas de salida</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Última ruta registrada en cada sesión (<code>exit_path</code>)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {navigationQuery.data.exitPages.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      Sin registros en este periodo.
                    </p>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/70 text-muted-foreground font-bold">
                          <th className="py-2 pr-2">Ruta</th>
                          <th className="py-2 px-2 text-right">Salidas</th>
                          <th className="py-2 pl-2 text-right">Usuarios</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {navigationQuery.data.exitPages.map((row) => (
                          <tr key={row.path} className="hover:bg-muted/40">
                            <td className="py-2 pr-2 font-mono font-semibold text-foreground truncate max-w-[160px]">
                              {row.path}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold">
                              {row.count}
                            </td>
                            <td className="py-2 pl-2 text-right font-mono">{row.users}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>

              {/* Most Visited Pages */}
              <Card className="rounded-2xl border-border/80 shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                    <Layers className="size-4 text-emerald-600" />
                    <span>Páginas más visitadas</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Rutas con mayor número de vistas (<code>dmps_analytics_page_views</code>)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {navigationQuery.data.topVisitedPages.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      Sin registros en este periodo.
                    </p>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/70 text-muted-foreground font-bold">
                          <th className="py-2 pr-2">Ruta</th>
                          <th className="py-2 px-2 text-right">Vistas</th>
                          <th className="py-2 pl-2 text-right">Usuarios</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {navigationQuery.data.topVisitedPages.map((row) => (
                          <tr key={row.path} className="hover:bg-muted/40">
                            <td className="py-2 pr-2 font-mono font-semibold text-foreground truncate max-w-[160px]">
                              {row.path}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold">
                              {row.count}
                            </td>
                            <td className="py-2 pl-2 text-right font-mono">{row.users}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
