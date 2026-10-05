import { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Info,
  Layers,
  Printer,
  RefreshCw,
  School,
  Search,
  Smartphone,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  ANALYTICS_REPORT_DEFINITIONS,
  downloadReportCsv,
  generateAnalyticsReport,
  type AnalyticsGeneratedReport,
  type AnalyticsPeriodKey,
  type AnalyticsReportType,
  type ConfidenceLevel,
} from "@/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsReportsPanelProps {
  period: AnalyticsPeriodKey;
  schoolFilter: string;
  schoolNameLabel: string;
}

const REPORT_TYPE_ICONS: Record<AnalyticsReportType, React.ElementType> = {
  executive: Sparkles,
  traffic: BarChart3,
  content: FileText,
  searches: Search,
  schools: School,
  navigation: Compass,
  pwa: Smartphone,
  intelligence: Layers,
  full_dataset: FileSpreadsheet,
};

function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  if (confidence === "sufficient") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="size-3" />
        Muestra representativa
      </span>
    );
  }
  if (confidence === "limited") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
        <AlertCircle className="size-3" />
        Muestra limitada (1-4 obs.)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
      <AlertCircle className="size-3" />
      Datos insuficientes
    </span>
  );
}

export function AnalyticsReportsPanel({
  period,
  schoolFilter,
  schoolNameLabel,
}: AnalyticsReportsPanelProps) {
  const [selectedReportType, setSelectedReportType] = useState<AnalyticsReportType>("executive");
  const [generatedReport, setGeneratedReport] = useState<AnalyticsGeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastExportedFile, setLastExportedFile] = useState<string | null>(null);

  const selectedDef = ANALYTICS_REPORT_DEFINITIONS.find((d) => d.id === selectedReportType)!;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setLastExportedFile(null);
    try {
      const rep = await generateAnalyticsReport(
        selectedReportType,
        period,
        schoolFilter,
        schoolNameLabel,
      );
      setGeneratedReport(rep);
    } catch (err: unknown) {
      console.error("[Stage 5 Analytics Reports] Error generating report:", err);
      const msg = err instanceof Error ? err.message : "Error al consultar datos para el reporte";
      setGenerationError(msg);
      setGeneratedReport(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCsv = () => {
    if (!generatedReport) return;
    try {
      const fileName = downloadReportCsv(generatedReport);
      setLastExportedFile(fileName);
    } catch (err) {
      console.error("[Stage 5 CSV Export] Error exporting CSV:", err);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-8 print:space-y-4">
      {/* 1. Header & Configuration Card (Hidden during print) */}
      <Card className="rounded-2xl border-border/80 shadow-2xs print:hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </span>
                <CardTitle className="text-xl font-black tracking-tight">
                  Centro de Reportes y Exportación
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Genere reportes listos para presentación, exporte datasets en CSV estructurado o
                imprima resúmenes directos basados exclusivamente en la base de datos de Supabase.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/60">
              <Filter className="size-4 text-primary" />
              <span>
                Filtros activos: <strong className="text-foreground">{period}</strong> ·{" "}
                <strong className="text-foreground">{schoolNameLabel}</strong>
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* Report Type Selector Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">
              Seleccione el Tipo de Reporte
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ANALYTICS_REPORT_DEFINITIONS.map((def) => {
                const isSelected = selectedReportType === def.id;
                const IconComp = REPORT_TYPE_ICONS[def.id];
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => {
                      setSelectedReportType(def.id);
                      setGeneratedReport(null);
                      setGenerationError(null);
                      setLastExportedFile(null);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                        : "border-border/70 hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex items-center gap-1.5 text-xs font-bold ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          <IconComp className="size-4" />
                          {def.shortTitle}
                        </span>
                        {isSelected && (
                          <span className="size-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {def.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                      <span>
                        {def.supportsSchoolFilter ? "Filtro Escuela: Sí" : "Filtro: Global"}
                      </span>
                      <span>·</span>
                      <span>
                        {def.supportsPeriodComparison ? "Comparación: Sí" : "Comparación: N/A"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/60">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="size-4 text-primary" />
              <span>
                Reporte configurado: <strong>{selectedDef.title}</strong>
                {!selectedDef.supportsSchoolFilter && schoolFilter !== "all" && (
                  <span className="text-amber-600 dark:text-amber-400 ml-1">
                    (Nota: Este reporte utiliza métricas globales de distrito)
                  </span>
                )}
              </span>
            </div>

            <Button
              type="button"
              onClick={() => void handleGenerateReport()}
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-2 rounded-xl font-bold cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Generando reporte...
                </>
              ) : (
                <>
                  <Sparkles className="size-4 mr-2" />
                  Generar Reporte
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Loading State */}
      {isGenerating && (
        <Card className="rounded-2xl border-border/80 p-8 space-y-4 print:hidden">
          <div className="flex items-center gap-3 text-primary font-bold text-sm">
            <RefreshCw className="size-5 animate-spin" />
            <span>Consultando datos reales en Supabase PostgreSQL...</span>
          </div>
          <Skeleton className="h-6 w-1/3 rounded-lg" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </Card>
      )}

      {/* 3. Error State */}
      {generationError && !isGenerating && (
        <Card className="rounded-2xl border-rose-500/30 bg-rose-500/5 p-6 print:hidden">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">
                No fue posible generar este reporte
              </h3>
              <p className="text-xs text-rose-700/90 dark:text-rose-400">{generationError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleGenerateReport()}
                className="mt-3 rounded-xl border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-xs font-bold cursor-pointer"
              >
                Reintentar generación
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Generated Report View */}
      {generatedReport && !isGenerating && (
        <div className="space-y-6">
          {/* Action Bar (Print / Export) — Hidden during actual browser print */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-muted/40 border border-border/80 print:hidden">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-foreground">
                Reporte generado con éxito ({generatedReport.metadata.generatedAtFormatted})
              </span>
              <ConfidenceBadge confidence={generatedReport.metadata.confidence} />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="rounded-xl text-xs font-bold cursor-pointer flex-1 sm:flex-initial"
              >
                <Printer className="size-4 mr-1.5" />
                Imprimir / PDF
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleExportCsv}
                className="rounded-xl text-xs font-bold cursor-pointer flex-1 sm:flex-initial"
              >
                <Download className="size-4 mr-1.5" />
                Descargar CSV
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleGenerateReport()}
                className="rounded-xl text-xs font-bold cursor-pointer"
                title="Actualizar datos del reporte"
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>

          {lastExportedFile && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between print:hidden">
              <span>
                Archivo descargado: <strong>{lastExportedFile}</strong> (formato CSV UTF-8 con
                encabezados normalizados).
              </span>
            </div>
          )}

          {/* Printable Report Document Container */}
          <div className="p-6 sm:p-8 rounded-2xl border border-border/80 bg-card space-y-8 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0">
            {/* Official Report Header */}
            <div className="border-b border-border/80 pb-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-primary">
                    Des Moines Public Schools — DMPS INFO
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-foreground">
                    {generatedReport.metadata.reportTitle}
                  </h1>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Fecha de Emisión</div>
                  <div className="font-bold text-foreground">
                    {generatedReport.metadata.generatedAtFormatted}
                  </div>
                </div>
              </div>

              {/* Metadata Badges Bar */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="size-3.5 text-primary" />
                  Periodo:{" "}
                  <strong className="text-foreground">
                    {generatedReport.metadata.periodLabel}
                  </strong>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <School className="size-3.5 text-primary" />
                  Escuela:{" "}
                  <strong className="text-foreground">
                    {generatedReport.metadata.schoolFilterLabel}
                  </strong>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="size-3.5 text-primary" />
                  Fuente:{" "}
                  <span className="text-foreground">{generatedReport.metadata.dataSource}</span>
                </span>
              </div>
            </div>

            {/* Insufficient Data Alert if Any */}
            {generatedReport.insufficientDataNote && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="size-4" />
                  Aviso de Muestra Analítica
                </div>
                <p>{generatedReport.insufficientDataNote}</p>
              </div>
            )}

            {/* Management Summary */}
            <div className="space-y-2 p-5 rounded-xl bg-muted/30 border border-border/60">
              <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                Resumen General y Conclusiones Fácticas
              </h2>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {generatedReport.managementSummary}
              </p>
            </div>

            {/* Key Metric Cards */}
            {generatedReport.keyMetrics.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Indicadores Principales
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {generatedReport.keyMetrics.map((m) => {
                    const isUp = m.direction === "up";
                    const isDown = m.direction === "down";
                    return (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl border border-border/70 bg-card space-y-1.5"
                      >
                        <span className="text-[11px] font-bold text-muted-foreground">
                          {m.label}
                        </span>
                        <div className="text-2xl font-black text-foreground">{m.value}</div>
                        {m.changeLabel && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold">
                            {isUp && <TrendingUp className="size-3 text-emerald-600" />}
                            {isDown && <TrendingDown className="size-3 text-rose-600" />}
                            <span
                              className={
                                isUp
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : isDown
                                    ? "text-rose-700 dark:text-rose-400"
                                    : "text-muted-foreground"
                              }
                            >
                              {m.changeLabel}
                            </span>
                          </div>
                        )}
                        {m.note && (
                          <p className="text-[10px] text-muted-foreground pt-0.5">{m.note}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Structured Report Tables */}
            {generatedReport.tables.map((tbl) => (
              <div key={tbl.id} className="space-y-3 pt-2">
                <div>
                  <h3 className="text-sm font-black text-foreground">{tbl.title}</h3>
                  {tbl.description && (
                    <p className="text-xs text-muted-foreground">{tbl.description}</p>
                  )}
                </div>

                <div className="rounded-xl border border-border/70 overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-border/60">
                    <thead className="bg-muted/40 font-bold text-foreground">
                      <tr>
                        {tbl.columns.map((c) => (
                          <th
                            key={c.key}
                            className={`py-2.5 px-3 whitespace-nowrap ${
                              c.align === "right"
                                ? "text-right"
                                : c.align === "center"
                                  ? "text-center"
                                  : "text-left"
                            }`}
                          >
                            {c.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {tbl.rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={tbl.columns.length}
                            className="py-6 px-3 text-center text-muted-foreground italic text-xs"
                          >
                            {tbl.emptyMessage || "Sin datos registrados para esta sección."}
                          </td>
                        </tr>
                      ) : (
                        tbl.rows.map((row, rIdx) => (
                          <tr
                            key={`tbl-${tbl.id}-r-${rIdx}`}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            {tbl.columns.map((c) => (
                              <td
                                key={`col-${c.key}`}
                                className={`py-2 px-3 ${
                                  c.isNumeric ? "font-mono font-medium" : ""
                                } ${
                                  c.align === "right"
                                    ? "text-right"
                                    : c.align === "center"
                                      ? "text-center"
                                      : "text-left"
                                }`}
                              >
                                {String(row[c.key] ?? "—")}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Intelligence Findings (if any) */}
            {generatedReport.findings && generatedReport.findings.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border/80">
                <div>
                  <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-4 text-primary" />
                    Hallazgos de Inteligencia y Diagnóstico
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Observaciones generadas por reglas determinísticas con base en la muestra real.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {generatedReport.findings.map((f) => (
                    <div
                      key={f.id}
                      className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                          {f.categoryLabel}
                        </span>
                        <ConfidenceBadge confidence={f.confidence} />
                      </div>
                      <div className="font-bold text-foreground">{f.title}</div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {f.evidence}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Footer */}
            <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-2">
              <span>DMPS INFO — Sistema de Analítica de Distrito (Des Moines Public Schools)</span>
              <span>Documento administrativo confidencial · Uso interno exclusivo</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Initial State before generation */}
      {!generatedReport && !isGenerating && !generationError && (
        <Card className="rounded-2xl border-dashed border-border p-12 text-center space-y-4 print:hidden">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <FileSpreadsheet className="size-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-foreground">
              Listo para generar el reporte &ldquo;{selectedDef.title}&rdquo;
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Haga clic en &ldquo;Generar Reporte&rdquo; para consultar los datos agregados
              correspondientes a {period} para {schoolNameLabel}. Podrá descargar el CSV o imprimir
              el documento listo para archivo.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => void handleGenerateReport()}
            className="rounded-xl px-6 font-bold cursor-pointer"
          >
            <Sparkles className="size-4 mr-1.5" />
            Generar Reporte Ahora
          </Button>
        </Card>
      )}
    </div>
  );
}
