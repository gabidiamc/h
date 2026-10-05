import { useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Eye,
  Filter,
  Globe,
  Info,
  Laptop,
  Layers,
  RefreshCw,
  School,
  Search,
  Smartphone,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import type {
  AnalyticsIntelligenceReport,
  AnalyticsPeriodKey,
  ConfidenceLevel,
  ContentTrendRow,
  ExplainableInsight,
  NavigationSequenceRow,
  SegmentIntelligenceRow,
  TrendDirection,
} from "@/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type IntelligenceSubView =
  | "all"
  | "insights"
  | "content"
  | "searches"
  | "sessions"
  | "navigation"
  | "trends"
  | "segments"
  | "schools"
  | "pwa";

function formatDuration(seconds: number | null): string {
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

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  if (level === "sufficient") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-2.5 py-0.5 text-[11px] font-bold">
        <CheckCircle2 className="size-3" />
        <span>Muestra suficiente</span>
      </span>
    );
  }
  if (level === "limited") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 px-2.5 py-0.5 text-[11px] font-bold">
        <Info className="size-3" />
        <span>Muestra limitada</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground border border-border px-2.5 py-0.5 text-[11px] font-bold">
      <Info className="size-3" />
      <span>Datos insuficientes para este análisis.</span>
    </span>
  );
}

function DeltaBadge({
  direction,
  absoluteDelta,
  percentDelta,
  period,
}: {
  direction: TrendDirection;
  absoluteDelta: number | null;
  percentDelta: number | null;
  period: AnalyticsPeriodKey;
}) {
  if (period === "all") {
    return <span className="text-[11px] text-muted-foreground">Acumulado total</span>;
  }
  if (direction === "insufficient" || absoluteDelta === null) {
    return (
      <span className="text-[11px] text-muted-foreground">Datos insuficientes para comparar</span>
    );
  }
  if (direction === "up") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="size-3.5" />
        <span>+{absoluteDelta}</span>
        {percentDelta !== null && <span>(+{percentDelta}%)</span>}
      </span>
    );
  }
  if (direction === "down") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
        <TrendingDown className="size-3.5" />
        <span>{absoluteDelta}</span>
        {percentDelta !== null && <span>({percentDelta}%)</span>}
      </span>
    );
  }
  return <span className="text-[11px] font-semibold text-muted-foreground">— Sin cambio (0)</span>;
}

function InsufficientDataCard({
  title,
  message = "Datos insuficientes para este análisis.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-muted/20 p-6 text-center space-y-1.5">
      {title && <p className="text-xs font-extrabold text-foreground">{title}</p>}
      <p className="text-xs font-semibold text-muted-foreground">{message}</p>
      <p className="text-[11px] text-muted-foreground">
        El análisis descriptivo requiere registros reales en Supabase para el periodo seleccionado.
      </p>
    </div>
  );
}

function ContentTrendTable({
  rows,
  period,
  emptyMessage = "Datos insuficientes para este análisis.",
}: {
  rows: ContentTrendRow[];
  period: AnalyticsPeriodKey;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <InsufficientDataCard message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border/70 text-muted-foreground font-bold">
            <th className="py-2.5 pr-3">Contenido</th>
            <th className="py-2.5 px-3">Tipo</th>
            <th className="py-2.5 px-3 text-right">Actual</th>
            <th className="py-2.5 px-3 text-right">Anterior</th>
            <th className="py-2.5 px-3 text-right">Variación</th>
            <th className="py-2.5 px-3 text-right">Usuarios</th>
            <th className="py-2.5 px-3 text-right">Duración prom.</th>
            <th className="py-2.5 pl-3 text-right">Actividad</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {rows.map((r) => (
            <tr key={r.key} className="hover:bg-muted/40">
              <td className="py-2.5 pr-3">
                <div className="font-bold text-foreground">{r.title}</div>
                <div className="text-[11px] font-mono text-muted-foreground">{r.contentId}</div>
              </td>
              <td className="py-2.5 px-3">
                <span className="inline-flex rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold">
                  {r.contentTypeLabel}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                {r.currentViews}
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                {r.previousViews !== null ? r.previousViews : "—"}
              </td>
              <td className="py-2.5 px-3 text-right">
                <DeltaBadge
                  direction={r.direction}
                  absoluteDelta={r.absoluteDelta}
                  percentDelta={r.percentDelta}
                  period={period}
                />
              </td>
              <td className="py-2.5 px-3 text-right font-mono">{r.users}</td>
              <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                {formatDuration(r.avgDurationSeconds)}
              </td>
              <td className="py-2.5 pl-3 text-right">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                    r.activityLevel === "alta"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : r.activityLevel === "media"
                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.activityLevel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SequenceTable({
  rows,
  emptyMessage = "Datos insuficientes para este análisis.",
}: {
  rows: NavigationSequenceRow[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <InsufficientDataCard message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border/70 text-muted-foreground font-bold">
            <th className="py-2 pr-2">Ruta origen</th>
            <th className="py-2 px-2">Ruta destino</th>
            <th className="py-2 px-2 text-right">Transiciones</th>
            <th className="py-2 pl-2 text-right">Sesiones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {rows.map((row) => (
            <tr key={`${row.fromPath}->${row.toPath}`} className="hover:bg-muted/40">
              <td className="py-2 pr-2 font-mono text-[11px] font-semibold text-foreground truncate max-w-[150px]">
                {row.fromPath}
              </td>
              <td className="py-2 px-2 font-mono text-[11px] text-primary font-semibold truncate max-w-[150px]">
                <span className="inline-flex items-center gap-1">
                  <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                  <span>{row.toPath}</span>
                </span>
              </td>
              <td className="py-2 px-2 text-right font-mono font-bold">{row.transitions}</td>
              <td className="py-2 pl-2 text-right font-mono text-muted-foreground">
                {row.sessions}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SegmentComparisonCard({
  title,
  subtitle,
  icon: Icon,
  rows,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  rows: SegmentIntelligenceRow[];
}) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-2xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-extrabold flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription className="text-xs">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <InsufficientDataCard />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/70 text-muted-foreground font-bold">
                  <th className="py-2 pr-2">Segmento</th>
                  <th className="py-2 px-2 text-right">Usuarios</th>
                  <th className="py-2 px-2 text-right">Sesiones</th>
                  <th className="py-2 px-2 text-right">%</th>
                  <th className="py-2 px-2 text-right">Págs/sesión</th>
                  <th className="py-2 pl-2 text-right">Duración prom.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((r) => (
                  <tr key={`${r.segmentType}-${r.segmentValue}`} className="hover:bg-muted/40">
                    <td className="py-2.5 pr-2 font-semibold text-foreground">{r.segmentValue}</td>
                    <td className="py-2.5 px-2 text-right font-mono">{r.users}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold">{r.sessions}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">
                      {r.sharePercent}%
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono">
                      {r.avgPagesPerSession !== null ? r.avgPagesPerSession : "—"}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono text-muted-foreground">
                      {formatDuration(r.avgDurationSeconds)}
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

function InsightCard({ insight }: { insight: ExplainableInsight }) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-2xs">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary">
              <Sparkles className="size-3" />
              <span>Hallazgo descriptivo • {insight.category}</span>
            </span>
            <h3 className="text-sm font-extrabold text-foreground">{insight.title}</h3>
          </div>
          <ConfidenceBadge level={insight.confidence} />
        </div>

        <p className="text-xs text-foreground/90 leading-relaxed">{insight.observation}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-muted/40 border border-border/60 p-2.5 text-[11px]">
          <div>
            <span className="text-muted-foreground block">Métrica</span>
            <span className="font-bold text-foreground">{insight.metricName}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Valor actual</span>
            <span className="font-mono font-bold text-foreground">{insight.currentValue}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Comparación previa</span>
            <span className="font-mono text-foreground">
              {insight.previousValue
                ? `${insight.previousValue}${insight.deltaLabel ? ` (${insight.deltaLabel})` : ""}`
                : "Sin referencia previa"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Fuente verificable</span>
            <span className="font-mono text-[10px] text-primary">{insight.dataSource}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsIntelligencePanel({
  report,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: {
  report: AnalyticsIntelligenceReport | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
}) {
  const [subView, setSubView] = useState<IntelligenceSubView>("all");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
          <AlertCircle className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">
            No fue posible cargar estos datos. Intenta nuevamente.
          </p>
          {errorMessage && (
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">{errorMessage}</p>
          )}
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

  if (!report || !report.hasAnyData) {
    return (
      <div className="rounded-2xl border border-border/80 bg-muted/20 p-8 text-center space-y-2">
        <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </div>
        <p className="text-sm font-bold text-foreground">Datos insuficientes para este análisis.</p>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          No existen registros suficientes en Supabase durante el periodo seleccionado para generar
          inteligencia descriptiva ni comparaciones.
        </p>
      </div>
    );
  }

  const showSection = (target: IntelligenceSubView) => subView === "all" || subView === target;

  return (
    <div className="space-y-8">
      {/* Descriptive Transparency & Sample Confidence Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-extrabold text-primary">
            <Database className="size-4" />
            <span>Inteligencia Analítica Determinística (Basada 100% en Supabase PostgreSQL)</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Todos los análisis describen patrones observados, frecuencias y variaciones entre{" "}
            <strong>{report.dateRange.label}</strong> y su periodo equivalente anterior sin inventar
            causas ni identificar personas.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ConfidenceBadge level={report.overallConfidence} />
        </div>
      </div>

      {/* Sub-navigation Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { id: "all" as const, label: "Vista completa" },
          { id: "insights" as const, label: "Hallazgos explicables" },
          { id: "trends" as const, label: "Detección de tendencias" },
          { id: "content" as const, label: "Inteligencia de contenido" },
          { id: "searches" as const, label: "Búsquedas y oportunidades" },
          { id: "sessions" as const, label: "Inteligencia de sesiones" },
          { id: "navigation" as const, label: "Flujos de navegación" },
          { id: "segments" as const, label: "Segmentación" },
          { id: "schools" as const, label: "Inteligencia por escuela" },
          { id: "pwa" as const, label: "Inteligencia PWA" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSubView(item.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              subView === item.id
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 1. AUTOMATIC EXPLAINABLE INSIGHTS */}
      {showSection("insights") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <span>Hallazgos Descriptivos y Explicables</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Observaciones determinísticas respaldadas por métricas verificables y tablas de
                origen.
              </p>
            </div>
            <ConfidenceBadge level={report.overallConfidence} />
          </div>

          {report.insights.length === 0 ? (
            <InsufficientDataCard />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {report.insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. TREND DETECTION */}
      {showSection("trends") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" />
                <span>Detección de Tendencias por Periodo</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Comparación entre el periodo seleccionado y el periodo equivalente inmediatamente
                anterior.
              </p>
            </div>
            <ConfidenceBadge level={report.trends.confidence} />
          </div>

          {!report.trends.hasAnyData ? (
            <InsufficientDataCard />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.trends.items.map((item) => (
                <Card key={item.key} className="rounded-2xl border-border/80 shadow-2xs">
                  <CardContent className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-foreground">{item.label}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.stabilityState === "aumento"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : item.stabilityState === "disminución"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : item.stabilityState === "actividad_inusual"
                                ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                                : item.stabilityState === "estabilidad"
                                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                                  : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.stabilityState === "sin_comparacion"
                          ? "Sin comparación"
                          : item.stabilityState === "actividad_inusual"
                            ? "Variación pronunciada"
                            : item.stabilityState}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-black text-foreground">
                        {item.metric.current}
                      </span>
                      {item.metric.previous !== null && (
                        <span className="text-xs text-muted-foreground">
                          previo: <strong>{item.metric.previous}</strong>
                          {item.metric.deltaPercent !== null && (
                            <span>
                              {" "}
                              ({item.metric.deltaPercent > 0 ? "+" : ""}
                              {item.metric.deltaPercent}%)
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.descriptiveSummary}
                    </p>

                    <div className="pt-1 text-[10px] font-mono text-muted-foreground">
                      Fuente: {item.dataSource}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. CONTENT INTELLIGENCE & CONTENT TRENDS */}
      {showSection("content") && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                <span>Inteligencia y Tendencias de Contenido</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Desempeño por tipo de contenido, variaciones positivas/negativas y niveles de
                actividad.
              </p>
            </div>
            <ConfidenceBadge level={report.content.confidence} />
          </div>

          {!report.content.hasAnyData ? (
            <InsufficientDataCard />
          ) : (
            <>
              {/* Distribution by Content Type */}
              <Card className="rounded-2xl border-border/80 shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    <span>Participación por Tipo de Contenido</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Volumen agregado de consultas y sesiones según la categoría de contenido real en
                    DMPS INFO.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {report.content.byContentType.length === 0 ? (
                    <InsufficientDataCard />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border/70 text-muted-foreground font-bold">
                            <th className="py-2 pr-3">Categoría de contenido</th>
                            <th className="py-2 px-3 text-right">Consultas / Vistas</th>
                            <th className="py-2 px-3 text-right">Usuarios únicos</th>
                            <th className="py-2 px-3 text-right">Sesiones</th>
                            <th className="py-2 pl-3 text-right">% del total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {report.content.byContentType.map((row) => (
                            <tr key={row.categoryGroup} className="hover:bg-muted/40">
                              <td className="py-2.5 pr-3 font-bold text-foreground">
                                {row.typeLabel}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold">
                                {row.views}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono">{row.users}</td>
                              <td className="py-2.5 px-3 text-right font-mono">{row.sessions}</td>
                              <td className="py-2.5 pl-3 text-right font-mono text-primary font-bold">
                                {row.percentageOfViews}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Growing Content */}
                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <TrendingUp className="size-4 text-emerald-600" />
                      <span>Contenido en Crecimiento</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Contenidos con aumento de vistas frente al periodo anterior
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContentTrendTable
                      rows={report.content.growingContent}
                      period={report.period}
                      emptyMessage={
                        report.period === "all"
                          ? "Selecciona un periodo acotado (24h, 7d, 30d, 90d, 12m) para calcular variaciones."
                          : "No se observaron contenidos con incremento positivo respecto al periodo anterior."
                      }
                    />
                  </CardContent>
                </Card>

                {/* Declining Content */}
                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <TrendingDown className="size-4 text-amber-600" />
                      <span>Contenido en Disminución</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Contenidos con menor número de vistas frente al periodo anterior
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContentTrendTable
                      rows={report.content.decliningContent}
                      period={report.period}
                      emptyMessage={
                        report.period === "all"
                          ? "Selecciona un periodo acotado (24h, 7d, 30d, 90d, 12m) para calcular variaciones."
                          : "No se observaron contenidos con disminución respecto al periodo anterior."
                      }
                    />
                  </CardContent>
                </Card>
              </div>

              {/* High vs Low Activity Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <Eye className="size-4 text-primary" />
                      <span>Contenido con Alta Actividad</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Contenidos ubicados en el tramo superior de consultas del periodo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContentTrendTable
                      rows={report.content.highActivityContent}
                      period={report.period}
                    />
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <Filter className="size-4 text-muted-foreground" />
                      <span>Contenido con Baja Actividad</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Contenidos con una sola consulta registrada en el periodo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContentTrendTable
                      rows={report.content.lowActivityContent}
                      period={report.period}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. SEARCH INTELLIGENCE & CONTENT OPPORTUNITIES */}
      {showSection("searches") && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Search className="size-5 text-primary" />
                <span>Inteligencia de Búsquedas y Oportunidades de Contenido</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Detección descriptiva de términos sin resultados, consultas repetidas y variaciones
                de búsqueda.
              </p>
            </div>
            <ConfidenceBadge level={report.searches.confidence} />
          </div>

          {!report.searches.hasAnyData ? (
            <InsufficientDataCard />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Búsquedas en el periodo
                    </span>
                    <span className="text-2xl font-black text-foreground mt-1 block">
                      {report.searches.totalSearches}
                    </span>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Términos únicos
                    </span>
                    <span className="text-2xl font-black text-foreground mt-1 block">
                      {report.searches.uniqueTerms}
                    </span>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Búsquedas sin resultados
                    </span>
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                      {report.searches.zeroResultSearches}
                    </span>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      % Sin resultados
                    </span>
                    <span className="text-2xl font-black text-foreground mt-1 block">
                      {report.searches.zeroResultRatePercent !== null
                        ? `${report.searches.zeroResultRatePercent}%`
                        : "—"}
                    </span>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Resultados promedio
                    </span>
                    <span className="text-2xl font-black text-primary mt-1 block">
                      {report.searches.avgResults !== null ? report.searches.avgResults : "—"}
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Content Opportunities Table */}
              <Card className="rounded-2xl border-border/80 shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-600" />
                    <span>Oportunidades de Contenido Basadas en Búsquedas Reales</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Términos que registraron 0 resultados, consultas repetidas o aumento frente al
                    periodo anterior.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {report.searches.opportunities.length === 0 ? (
                    <InsufficientDataCard message="No se detectaron términos repetidos o sin resultados en este periodo." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border/70 text-muted-foreground font-bold">
                            <th className="py-2.5 pr-3">Término buscado</th>
                            <th className="py-2.5 px-3 text-right">Búsquedas</th>
                            <th className="py-2.5 px-3 text-right">Sin resultados</th>
                            <th className="py-2.5 px-3 text-right">Prom. resultados</th>
                            <th className="py-2.5 px-3">Patrones observados</th>
                            <th className="py-2.5 pl-3">Descripción verificable</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {report.searches.opportunities.map((row) => (
                            <tr key={row.normalizedTerm} className="hover:bg-muted/40">
                              <td className="py-2.5 pr-3 font-bold text-foreground">{row.term}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold">
                                {row.currentSearches}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono">
                                {row.zeroResultsCount > 0 ? (
                                  <span className="font-bold text-amber-600 dark:text-amber-400">
                                    {row.zeroResultsCount} ({row.zeroResultsRatePercent}%)
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">0</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono">{row.avgResults}</td>
                              <td className="py-2.5 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {row.patternsObserved.map((pat) => (
                                    <span
                                      key={pat}
                                      className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold"
                                    >
                                      {pat}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-2.5 pl-3 text-muted-foreground">
                                {row.descriptiveNote}
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

      {/* 5. SESSION INTELLIGENCE */}
      {showSection("sessions") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Activity className="size-5 text-primary" />
                <span>Inteligencia de Sesiones</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Profundidad de navegación, duración promedio e interacción por sesión.
              </p>
            </div>
            <ConfidenceBadge level={report.sessions.confidence} />
          </div>

          {!report.sessions.hasAnyData ? (
            <InsufficientDataCard />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-border/80">
                <CardContent className="p-5 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">
                    Duración promedio de sesión
                  </span>
                  <div className="text-2xl font-black text-foreground">
                    {formatDuration(report.sessions.avgDurationSeconds)}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Basado en <code>dmps_analytics_sessions.duration_seconds</code>
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80">
                <CardContent className="p-5 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">
                    Páginas promedio por sesión
                  </span>
                  <div className="text-2xl font-black text-primary">
                    {report.sessions.avgPagesPerSession ?? "—"}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    En {report.sessions.totalSessions} sesión(es) analizadas
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80">
                <CardContent className="p-5 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">
                    Sesiones de 1 página vs. múltiples
                  </span>
                  <div className="text-lg font-extrabold text-foreground">
                    1 pág: {report.sessions.singlePageSessions} (
                    {report.sessions.singlePageRatePercent ?? 0}%) • 2+ págs:{" "}
                    {report.sessions.multiPageSessions} ({report.sessions.multiPageRatePercent ?? 0}
                    %)
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Navegación profunda (3+ págs): {report.sessions.deepNavigationSessions} (
                    {report.sessions.deepNavigationRatePercent ?? 0}%)
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80">
                <CardContent className="p-5 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">
                    Sesiones con búsquedas y eventos
                  </span>
                  <div className="text-lg font-extrabold text-foreground">
                    Con búsqueda: {report.sessions.sessionsWithSearches} • Con eventos:{" "}
                    {report.sessions.sessionsWithEvents}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Cruce por <code>session_id</code> real
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* 6. NAVIGATION INTELLIGENCE & ENTRY / EXIT ANALYSIS */}
      {showSection("navigation") && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Compass className="size-5 text-primary" />
                <span>Inteligencia de Navegación y Análisis de Entrada / Salida</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Rutas de inicio, rutas de término y secuencias reales de transición dentro de las
                sesiones.
              </p>
            </div>
            <ConfidenceBadge level={report.navigation.confidence} />
          </div>

          {!report.navigation.hasAnyData ? (
            <InsufficientDataCard />
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Entry Analysis */}
                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <Compass className="size-4 text-primary" />
                      <span>Páginas donde inician las sesiones</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Distribución de <code>landing_path</code> y tipo de contenido de entrada
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report.navigation.entryPages.length === 0 ? (
                      <InsufficientDataCard />
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border/70 text-muted-foreground font-bold">
                            <th className="py-2 pr-2">Ruta</th>
                            <th className="py-2 px-2">Tipo</th>
                            <th className="py-2 px-2 text-right">Sesiones</th>
                            <th className="py-2 pl-2 text-right">%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {report.navigation.entryPages.map((row) => (
                            <tr key={row.path} className="hover:bg-muted/40">
                              <td className="py-2 pr-2 font-mono font-semibold text-foreground">
                                {row.path}
                              </td>
                              <td className="py-2 px-2 text-muted-foreground">
                                {row.contentTypeLabel}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold">
                                {row.sessions}
                              </td>
                              <td className="py-2 pl-2 text-right font-mono text-muted-foreground">
                                {row.percentage}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>

                {/* Exit Analysis */}
                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <Clock className="size-4 text-amber-600" />
                      <span>Páginas donde terminan las sesiones</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Distribución de <code>exit_path</code> registrada al finalizar o actualizar
                      sesión
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report.navigation.exitPages.length === 0 ? (
                      <InsufficientDataCard />
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border/70 text-muted-foreground font-bold">
                            <th className="py-2 pr-2">Ruta</th>
                            <th className="py-2 px-2">Tipo</th>
                            <th className="py-2 px-2 text-right">Salidas</th>
                            <th className="py-2 pl-2 text-right">%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {report.navigation.exitPages.map((row) => (
                            <tr key={row.path} className="hover:bg-muted/40">
                              <td className="py-2 pr-2 font-mono font-semibold text-foreground">
                                {row.path}
                              </td>
                              <td className="py-2 px-2 text-muted-foreground">
                                {row.contentTypeLabel}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold">
                                {row.sessions}
                              </td>
                              <td className="py-2 pl-2 text-right font-mono text-muted-foreground">
                                {row.percentage}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-extrabold">
                      Secuencias frecuentes de navegación
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Pares consecutivos de páginas dentro de una misma sesión
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SequenceTable
                      rows={report.navigation.frequentTransitions}
                      emptyMessage="Se requieren sesiones con al menos 2 páginas distintas para observar transiciones."
                    />
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-extrabold">
                      Qué visitan después de entrar
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Primera transición inmediatamente posterior a la página de entrada
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SequenceTable
                      rows={report.navigation.visitedAfterEntry}
                      emptyMessage="Sin transiciones posteriores a la entrada en este periodo."
                    />
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/80 shadow-2xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-extrabold">
                      Qué visitan antes de salir
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Última transición observada antes de la página de salida
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SequenceTable
                      rows={report.navigation.visitedBeforeExit}
                      emptyMessage="Sin transiciones previas a la salida en este periodo."
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* 7. SEGMENTATION INTELLIGENCE */}
      {showSection("segments") && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <span>Inteligencia de Segmentación</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Comparativa de profundidad de navegación y duración por idioma, dispositivo,
                navegador, sistema operativo y escuela.
              </p>
            </div>
            <ConfidenceBadge level={report.segmentation.confidence} />
          </div>

          {!report.segmentation.hasAnyData ? (
            <InsufficientDataCard />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SegmentComparisonCard
                title="Segmentos por Idioma"
                subtitle="Comportamiento por idioma configurado en la sesión"
                icon={Globe}
                rows={report.segmentation.languages}
              />
              <SegmentComparisonCard
                title="Segmentos por Dispositivo"
                subtitle="Móvil, escritorio y tablet"
                icon={Smartphone}
                rows={report.segmentation.devices}
              />
              <SegmentComparisonCard
                title="Segmentos por Navegador"
                subtitle="Comparativa por navegador web"
                icon={Compass}
                rows={report.segmentation.browsers}
              />
              <SegmentComparisonCard
                title="Segmentos por Sistema Operativo"
                subtitle="Comparativa por plataforma operativa"
                icon={Laptop}
                rows={report.segmentation.operatingSystems}
              />
            </div>
          )}
        </div>
      )}

      {/* 8. SCHOOL INTELLIGENCE */}
      {showSection("schools") && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <School className="size-5 text-primary" />
                <span>Inteligencia por Escuela</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Actividad comparativa y contenidos más consultados asociados a cada escuela real de{" "}
                <code>public.schools</code>.
              </p>
            </div>
            <ConfidenceBadge level={report.schools.confidence} />
          </div>

          {!report.schools.hasAnyData ? (
            <InsufficientDataCard message="No hay actividad específica por escuela registrada en este periodo." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {report.schools.schools
                .filter((s) => s.hasActivity)
                .map((school) => (
                  <Card key={school.schoolId} className="rounded-2xl border-border/80 shadow-2xs">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-extrabold flex items-center gap-2">
                            <School className="size-4 text-primary" />
                            <span>{school.schoolName}</span>
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {school.pageViews} vistas • {school.users} usuarios • {school.sessions}{" "}
                            sesiones • {school.selections} selecciones
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {school.topConsultedContent.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Sin vistas de contenido específicas registradas para esta escuela.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-muted-foreground block">
                            Contenido más consultado en esta escuela:
                          </span>
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-border/60 text-muted-foreground font-bold">
                                <th className="py-1.5 pr-2">Contenido</th>
                                <th className="py-1.5 px-2">Tipo</th>
                                <th className="py-1.5 pl-2 text-right">Vistas</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {school.topConsultedContent.map((c) => (
                                <tr key={`${school.schoolId}-${c.contentId}`}>
                                  <td className="py-2 pr-2 font-semibold text-foreground">
                                    {c.title}
                                  </td>
                                  <td className="py-2 px-2 text-muted-foreground">
                                    {c.contentTypeLabel}
                                  </td>
                                  <td className="py-2 pl-2 text-right font-mono font-bold">
                                    {c.views}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 9. PWA INTELLIGENCE */}
      {showSection("pwa") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Smartphone className="size-5 text-primary" />
                <span>Inteligencia de PWA</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Evolución de lanzamientos standalone, avisos de instalación y tasa de conversión.
              </p>
            </div>
            <ConfidenceBadge level={report.pwa.confidence} />
          </div>

          {!report.pwa.hasAnyData ? (
            <InsufficientDataCard />
          ) : (
            <Card className="rounded-2xl border-border/80 shadow-2xs">
              <CardContent className="p-5 space-y-4">
                <p className="text-xs font-semibold text-foreground">
                  {report.pwa.descriptiveSummary}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-border/70 p-3.5">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Lanzamientos PWA
                    </span>
                    <span className="text-2xl font-black text-foreground">
                      {report.pwa.launches.current}
                    </span>
                    {report.pwa.launches.previous !== null && (
                      <span className="block text-[11px] text-muted-foreground">
                        Previo: {report.pwa.launches.previous}
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border border-border/70 p-3.5">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Prompts mostrados
                    </span>
                    <span className="text-2xl font-black text-foreground">
                      {report.pwa.promptsShown.current}
                    </span>
                    {report.pwa.promptsShown.previous !== null && (
                      <span className="block text-[11px] text-muted-foreground">
                        Previo: {report.pwa.promptsShown.previous}
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border border-border/70 p-3.5">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Instalaciones
                    </span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {report.pwa.installs.current}
                    </span>
                    {report.pwa.installs.previous !== null && (
                      <span className="block text-[11px] text-muted-foreground">
                        Previo: {report.pwa.installs.previous}
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border border-border/70 p-3.5">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      Tasa de instalación
                    </span>
                    <span className="text-2xl font-black text-primary">
                      {report.pwa.installRatePercent !== null
                        ? `${report.pwa.installRatePercent}%`
                        : "Sin datos suficientes"}
                    </span>
                    {report.pwa.previousInstallRatePercent !== null && (
                      <span className="block text-[11px] text-muted-foreground">
                        Previo: {report.pwa.previousInstallRatePercent}%
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
