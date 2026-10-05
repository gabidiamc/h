import {
  ANALYTICS_PERIOD_OPTIONS,
  computeAnalyticsDateRange,
  fetchAnalyticsOverviewAndSeries,
  fetchAudienceAnalytics,
  fetchContentAnalytics,
  fetchNavigationAnalytics,
  fetchPwaAnalytics,
  fetchSchoolsAnalytics,
  fetchSearchesAnalytics,
  type AnalyticsPeriodKey,
} from "./dashboard-queries";
import {
  fetchAnalyticsIntelligenceReport,
  type AnalyticsIntelligenceReport,
  type ConfidenceLevel,
} from "./intelligence-queries";
import {
  ANALYTICS_REPORT_DEFINITIONS,
  type AnalyticsGeneratedReport,
  type AnalyticsReportType,
  type MetricSummaryCardItem,
  type ReportFindingItem,
  type ReportMetadata,
  type ReportTableSection,
} from "./report-types";

function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return "0";
  return new Intl.NumberFormat("es-US").format(val);
}

function formatPercentage(val: number | null | undefined): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return "—";
  return `${Math.round(val * 10) / 10}%`;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function computeChangeLabel(
  current: number,
  previous: number | null,
): { label: string; direction: "up" | "down" | "neutral" | "insufficient" } {
  if (previous === null || previous === undefined) {
    return { label: "Sin comparación previa", direction: "insufficient" };
  }
  if (previous === 0) {
    if (current === 0) return { label: "0% (sin cambio)", direction: "neutral" };
    return {
      label: `+${formatNumber(current)} (sin línea base previa)`,
      direction: "up",
    };
  }
  const delta = current - previous;
  const pct = Math.round(((current - previous) / previous) * 1000) / 10;
  if (delta > 0) return { label: `+${pct}% (+${formatNumber(delta)})`, direction: "up" };
  if (delta < 0) return { label: `${pct}% (${formatNumber(delta)})`, direction: "down" };
  return { label: "0% (estable)", direction: "neutral" };
}

function createReportMetadata(
  reportType: AnalyticsReportType,
  period: AnalyticsPeriodKey,
  schoolFilter: string,
  schoolNameLabel: string,
  confidence: ConfidenceLevel,
): ReportMetadata {
  const def = ANALYTICS_REPORT_DEFINITIONS.find((d) => d.id === reportType)!;
  const range = computeAnalyticsDateRange(period);
  const opt = ANALYTICS_PERIOD_OPTIONS.find((p) => p.key === period);
  const now = new Date();

  return {
    reportId: reportType,
    reportTitle: def.title,
    generatedAtIso: now.toISOString(),
    generatedAtFormatted: now.toLocaleString("es-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    period,
    periodLabel: opt?.label || period,
    startDateIso: range.startDate ? range.startDate.toISOString() : null,
    endDateIso: range.endDate.toISOString(),
    schoolFilter,
    schoolFilterLabel: schoolNameLabel,
    dataSource: "DMPS INFO Analytics (Supabase PostgreSQL)",
    isSchoolFilterApplied: def.supportsSchoolFilter && schoolFilter !== "all",
    isComparisonSupported: def.supportsPeriodComparison && period !== "all",
    confidence,
  };
}

/**
 * Generates an aggregated analytics report on-demand.
 * Consumes existing Stage 3 dashboard queries and Stage 4 intelligence queries.
 */
export async function generateAnalyticsReport(
  reportType: AnalyticsReportType,
  period: AnalyticsPeriodKey,
  schoolFilter: string = "all",
  schoolNameLabel: string = "Todas las escuelas",
): Promise<AnalyticsGeneratedReport> {
  const normSchoolFilter = schoolFilter && schoolFilter !== "all" ? schoolFilter.trim() : "all";

  switch (reportType) {
    case "executive": {
      const [overviewData, contentData, searchesData, schoolsData, intelligenceData] =
        await Promise.all([
          fetchAnalyticsOverviewAndSeries(period, normSchoolFilter, 60),
          fetchContentAnalytics(period, normSchoolFilter),
          fetchSearchesAnalytics(period),
          fetchSchoolsAnalytics(period),
          fetchAnalyticsIntelligenceReport(period, normSchoolFilter),
        ]);

      const hasData = overviewData.overview.hasAnyData;
      const ov = overviewData.overview;
      const topContent = contentData.rows[0];
      const topSearch = searchesData.topTerms[0];

      let summary = `Durante el periodo evaluado (${overviewData.overview.hasAnyData ? ANALYTICS_PERIOD_OPTIONS.find((p) => p.key === period)?.label.toLowerCase() : "periodo seleccionado"}), DMPS INFO registró `;
      if (!hasData) {
        summary +=
          "cero eventos de analítica en la base de datos de Supabase. No se detectó actividad registrada con los filtros seleccionados.";
      } else {
        summary += `${formatNumber(ov.pageViews.current)} vistas de páginas y contenido a través de ${formatNumber(ov.sessions.current)} sesiones observadas. `;
        if (topContent) {
          summary += `El contenido más consultado fue "${topContent.title}" (${formatNumber(topContent.views)} vistas). `;
        }
        summary += `La actividad de búsqueda registró ${formatNumber(searchesData.totalSearches)} consultas totales`;
        if (topSearch) {
          summary += `, siendo "${topSearch.term}" el término con mayor frecuencia (${formatNumber(topSearch.searches)} búsquedas). `;
        } else {
          summary += ". ";
        }
        if (ov.pwaInstalls.current > 0) {
          summary += `Se registraron ${formatNumber(ov.pwaInstalls.current)} instalaciones de la aplicación PWA.`;
        }
      }

      const keyMetrics: MetricSummaryCardItem[] = [
        {
          id: "views",
          label: "Vistas de Contenido",
          value: formatNumber(ov.pageViews.current),
          previousValue:
            ov.pageViews.previous !== null ? formatNumber(ov.pageViews.previous) : null,
          changeLabel: computeChangeLabel(ov.pageViews.current, ov.pageViews.previous).label,
          direction: ov.pageViews.direction,
        },
        {
          id: "sessions",
          label: "Sesiones Estimadas",
          value: formatNumber(ov.sessions.current),
          previousValue: ov.sessions.previous !== null ? formatNumber(ov.sessions.previous) : null,
          changeLabel: computeChangeLabel(ov.sessions.current, ov.sessions.previous).label,
          direction: ov.sessions.direction,
        },
        {
          id: "users",
          label: "Visitantes Únicos (Agregado)",
          value: formatNumber(ov.uniqueUsers.current),
          previousValue:
            ov.uniqueUsers.previous !== null ? formatNumber(ov.uniqueUsers.previous) : null,
          changeLabel: computeChangeLabel(ov.uniqueUsers.current, ov.uniqueUsers.previous).label,
          direction: ov.uniqueUsers.direction,
        },
        {
          id: "searches",
          label: "Búsquedas Totales",
          value: formatNumber(searchesData.totalSearches),
          note: `Tasa de éxito: ${formatPercentage(searchesData.successRatePercent)}`,
        },
      ];

      const tables: ReportTableSection[] = [
        {
          id: "top_content",
          title: "Contenido Principal Consultado",
          description: "Artículos, páginas, categorías y recursos con mayor número de vistas.",
          columns: [
            { key: "rank", header: "#", align: "center", isNumeric: true },
            { key: "title", header: "Título de Contenido", align: "left" },
            { key: "type", header: "Tipo", align: "left" },
            { key: "views", header: "Vistas", align: "right", isNumeric: true },
            { key: "sessions", header: "Sesiones", align: "right", isNumeric: true },
            { key: "avgDuration", header: "Duración Prom.", align: "right" },
          ],
          rows: contentData.rows.slice(0, 10).map((r, idx) => ({
            rank: idx + 1,
            title: r.title,
            type: r.contentType,
            views: formatNumber(r.views),
            sessions: formatNumber(r.sessions),
            avgDuration: formatDuration(r.avgDurationSeconds),
          })),
          emptyMessage: "No hay registros de consulta de contenido en este periodo.",
        },
        {
          id: "top_searches",
          title: "Términos de Búsqueda Principales",
          description: "Consultas más frecuentes realizadas por las familias en el buscador.",
          columns: [
            { key: "term", header: "Término de Búsqueda", align: "left" },
            { key: "count", header: "Volumen", align: "right", isNumeric: true },
            { key: "zeroResults", header: "Sin Resultados", align: "right", isNumeric: true },
            { key: "avgResults", header: "Prom. Resultados", align: "right" },
          ],
          rows: searchesData.topTerms.slice(0, 8).map((t) => ({
            term: t.term,
            count: formatNumber(t.searches),
            zeroResults: formatNumber(t.zeroResultsCount),
            avgResults: Math.round(t.avgResults * 10) / 10,
          })),
          emptyMessage: "No hay búsquedas registradas en este periodo.",
        },
        {
          id: "school_dist",
          title: "Distribución por Escuela",
          description: "Actividad agregada en el contexto de escuelas del distrito.",
          columns: [
            { key: "school", header: "Escuela", align: "left" },
            { key: "views", header: "Vistas", align: "right", isNumeric: true },
            { key: "sessions", header: "Sesiones", align: "right", isNumeric: true },
            { key: "selections", header: "Selecciones", align: "right", isNumeric: true },
          ],
          rows: schoolsData.rows.map((s) => ({
            school: s.schoolName || s.shortName || s.schoolId,
            views: formatNumber(s.pageViews),
            sessions: formatNumber(s.sessions),
            selections: formatNumber(s.selections),
          })),
          emptyMessage: "No se registró actividad vinculada a escuelas en este periodo.",
        },
      ];

      const findings: ReportFindingItem[] = intelligenceData.insights.slice(0, 6).map((ins) => ({
        id: ins.id,
        categoryLabel: ins.category.toUpperCase(),
        title: ins.title,
        evidence: `${ins.observation} (Métrica: ${ins.currentValue}${ins.deltaLabel ? `, ${ins.deltaLabel}` : ""})`,
        periodLabel: ins.periodLabel,
        confidence: ins.confidence,
        entityOrMetric: ins.metricName,
      }));

      return {
        metadata: createReportMetadata(
          reportType,
          period,
          normSchoolFilter,
          schoolNameLabel,
          intelligenceData.overallConfidence,
        ),
        managementSummary: summary,
        keyMetrics,
        tables,
        findings,
        hasAnyData: hasData,
        insufficientDataNote: !hasData
          ? "No se encontraron suficientes observaciones en la base de datos para generar un resumen ejecutivo con métricas históricas."
          : null,
      };
    }

    case "traffic": {
      const [overviewData, audienceData, intelligenceData] = await Promise.all([
        fetchAnalyticsOverviewAndSeries(period, normSchoolFilter, 60),
        fetchAudienceAnalytics(period),
        fetchAnalyticsIntelligenceReport(period, normSchoolFilter),
      ]);

      const ov = overviewData.overview;
      const sessIntel = intelligenceData.sessions;
      const hasData = ov.hasAnyData;

      let summary = `Durante el periodo evaluado, se registraron ${formatNumber(ov.sessions.current)} sesiones y ${formatNumber(ov.pageViews.current)} vistas de página. `;
      if (hasData) {
        summary += `La navegación promedió ${sessIntel.avgPagesPerSession ?? "—"} páginas por sesión con una duración media de ${formatDuration(sessIntel.avgDurationSeconds)}. `;
        summary += `El ${formatPercentage(sessIntel.singlePageRatePercent)} de las sesiones fueron de una sola página y el ${formatPercentage(sessIntel.deepNavigationRatePercent)} alcanzaron navegación profunda (3+ páginas).`;
      } else {
        summary += "No se registran eventos de navegación suficientes.";
      }

      const keyMetrics: MetricSummaryCardItem[] = [
        {
          id: "sessions",
          label: "Sesiones Totales",
          value: formatNumber(ov.sessions.current),
          previousValue: ov.sessions.previous !== null ? formatNumber(ov.sessions.previous) : null,
          changeLabel: computeChangeLabel(ov.sessions.current, ov.sessions.previous).label,
          direction: ov.sessions.direction,
        },
        {
          id: "pageviews",
          label: "Vistas de Página",
          value: formatNumber(ov.pageViews.current),
          previousValue:
            ov.pageViews.previous !== null ? formatNumber(ov.pageViews.previous) : null,
          changeLabel: computeChangeLabel(ov.pageViews.current, ov.pageViews.previous).label,
          direction: ov.pageViews.direction,
        },
        {
          id: "avg_duration",
          label: "Duración Media de Sesión",
          value: formatDuration(sessIntel.avgDurationSeconds),
          note: "Calculada desde la actividad en pestaña",
        },
        {
          id: "pages_per_session",
          label: "Páginas por Sesión",
          value: sessIntel.avgPagesPerSession ? `${sessIntel.avgPagesPerSession}` : "—",
          note: `Mono-página: ${formatPercentage(sessIntel.singlePageRatePercent)}`,
        },
      ];

      const tables: ReportTableSection[] = [
        {
          id: "daily_series",
          title: "Serie Cronológica Diaria",
          description: "Evolución día a día de tráfico y visitas registradas.",
          columns: [
            { key: "date", header: "Fecha", align: "left" },
            { key: "pageViews", header: "Vistas", align: "right", isNumeric: true },
            { key: "sessions", header: "Sesiones", align: "right", isNumeric: true },
            { key: "users", header: "Visitantes", align: "right", isNumeric: true },
            { key: "searches", header: "Búsquedas", align: "right", isNumeric: true },
          ],
          rows: overviewData.dailySeries.map((pt) => ({
            date: pt.label || pt.date,
            pageViews: formatNumber(pt.pageViews),
            sessions: formatNumber(pt.sessions),
            users: formatNumber(pt.uniqueUsers),
            searches: formatNumber(pt.searches),
          })),
          emptyMessage: "No hay registros diarios en el rango seleccionado.",
        },
        {
          id: "devices",
          title: "Distribución por Dispositivo",
          description: "Desglose por tipo de equipo utilizado para consultar DMPS INFO.",
          columns: [
            { key: "device", header: "Dispositivo", align: "left" },
            { key: "sessions", header: "Sesiones", align: "right", isNumeric: true },
            { key: "users", header: "Visitantes", align: "right", isNumeric: true },
            { key: "percentage", header: "Participación", align: "right" },
          ],
          rows: audienceData.devices.map((d) => ({
            device: d.dimension,
            sessions: formatNumber(d.sessions),
            users: formatNumber(d.users),
            percentage: formatPercentage(d.percentage),
          })),
        },
        {
          id: "languages",
          title: "Distribución por Idioma",
          description: "Idiomas configurados en el navegador o seleccionados en la app.",
          columns: [
            { key: "language", header: "Idioma", align: "left" },
            { key: "sessions", header: "Sesiones", align: "right", isNumeric: true },
            { key: "percentage", header: "Participación", align: "right" },
          ],
          rows: audienceData.languages.map((l) => ({
            language: l.dimension,
            sessions: formatNumber(l.sessions),
            percentage: formatPercentage(l.percentage),
          })),
        },
      ];

      return {
        metadata: createReportMetadata(
          reportType,
          period,
          normSchoolFilter,
          schoolNameLabel,
          sessIntel.confidence,
        ),
        managementSummary: summary,
        keyMetrics,
        tables,
        hasAnyData: hasData,
        insufficientDataNote: !hasData
          ? "No se registran datos suficientes de tráfico para el periodo y escuela seleccionados."
          : null,
      };
    }

    case "content": {
      const [contentData, intelligenceData] = await Promise.all([
        fetchContentAnalytics(period, normSchoolFilter),
        fetchAnalyticsIntelligenceReport(period, normSchoolFilter),
      ]);

      const hasData = contentData.hasAnyData;
      const top = contentData.rows[0];

      let summary = `Se identificaron ${formatNumber(contentData.rows.length)} elementos de contenido consultados. `;
      if (top) {
        summary += `El contenido principal fue "${top.title}" con ${formatNumber(top.views)} vistas y duración promedio de ${formatDuration(top.avgDurationSeconds)}. `;
      }
      summary += `Se detectaron ${formatNumber(intelligenceData.content.growingContent.length)} contenidos con tendencia de crecimiento y ${formatNumber(intelligenceData.content.decliningContent.length)} en descenso relativo.`;

      const keyMetrics: MetricSummaryCardItem[] = [
        {
          id: "total_items",
          label: "Contenidos Consultados",
          value: formatNumber(contentData.rows.length),
        },
        {
          id: "top_views",
          label: "Vistas del Contenido #1",
          value: top ? formatNumber(top.views) : "0",
          note: top ? top.title : "Sin datos",
        },
        {
          id: "growing_count",
          label: "En Crecimiento Relativo",
          value: formatNumber(intelligenceData.content.growingContent.length),
        },
        {
          id: "declining_count",
          label: "En Descenso Relativo",
          value: formatNumber(intelligenceData.content.decliningContent.length),
        },
      ];

      const tables: ReportTableSection[] = [
        {
          id: "content_performance",
          title: "Detalle de Rendimiento de Contenido",
          description:
            "Todas las páginas, artículos y recursos registrados con títulos oficiales resueltos.",
          columns: [
            { key: "title", header: "Título", align: "left" },
            { key: "category", header: "Categoría", align: "left" },
            { key: "views", header: "Vistas", align: "right", isNumeric: true },
            { key: "users", header: "Visitantes", align: "right", isNumeric: true },
            { key: "sessions", header: "Sesiones", align: "right", isNumeric: true },
            { key: "avgDuration", header: "Duración Media", align: "right" },
            { key: "status", header: "Disponibilidad", align: "center" },
          ],
          rows: contentData.rows.map((r) => ({
            title: r.title,
            category: r.categoryGroup,
            views: formatNumber(r.views),
            users: formatNumber(r.users),
            sessions: formatNumber(r.sessions),
            avgDuration: formatDuration(r.avgDurationSeconds),
            status: r.isAvailable ? "Disponible" : "No disponible / Archivada",
          })),
          emptyMessage: "No hay registros de contenido para los filtros aplicados.",
        },
        {
          id: "content_by_type",
          title: "Distribución por Tipo de Contenido",
          description: "Participación porcentual de consultas por categoría funcional.",
          columns: [
            { key: "type", header: "Tipo", align: "left" },
            { key: "views", header: "Vistas", align: "right", isNumeric: true },
            { key: "sessions", header: "Sesiones", align: "right", isNumeric: true },
            { key: "share", header: "Participación", align: "right" },
          ],
          rows: intelligenceData.content.byContentType.map((t) => ({
            type: t.typeLabel,
            views: formatNumber(t.views),
            sessions: formatNumber(t.sessions),
            share: formatPercentage(t.percentageOfViews),
          })),
        },
      ];

      return {
        metadata: createReportMetadata(
          reportType,
          period,
          normSchoolFilter,
          schoolNameLabel,
          intelligenceData.content.confidence,
        ),
        managementSummary: summary,
        keyMetrics,
        tables,
        hasAnyData: hasData,
        insufficientDataNote: !hasData
          ? "No hay suficientes registros de visualización de contenido para generar este reporte."
          : null,
      };
    }

    case "searches": {
      const [searchesData, intelligenceData] = await Promise.all([
        fetchSearchesAnalytics(period),
        fetchAnalyticsIntelligenceReport(period, normSchoolFilter),
      ]);

      const hasData = searchesData.hasAnyData;
      const top = searchesData.topTerms[0];

      let summary = `Se registraron ${formatNumber(searchesData.totalSearches)} búsquedas correspondientes a ${formatNumber(searchesData.uniqueTerms)} términos distintos. `;
      if (hasData) {
        summary += `La tasa de éxito con resultados fue de ${formatPercentage(searchesData.successRatePercent)} (${formatNumber(searchesData.withResults)} con resultados, ${formatNumber(searchesData.withoutResults)} sin resultados). `;
        if (top) {
          summary += `El término con mayor frecuencia fue "${top.term}" (${formatNumber(top.searches)} consultas). `;
        }
        summary += `El sistema identificó ${formatNumber(intelligenceData.searches.opportunities.length)} oportunidades de contenido asociadas a términos recurrentes sin resultados.`;
      } else {
        summary += "No hay consultas en el buscador para el periodo seleccionado.";
      }

      const keyMetrics: MetricSummaryCardItem[] = [
        {
          id: "total_searches",
          label: "Búsquedas Totales",
          value: formatNumber(searchesData.totalSearches),
        },
        {
          id: "success_rate",
          label: "Tasa de Éxito",
          value: formatPercentage(searchesData.successRatePercent),
          note: `${formatNumber(searchesData.withResults)} con resultados`,
        },
        {
          id: "zero_results",
          label: "Búsquedas Sin Resultados",
          value: formatNumber(searchesData.withoutResults),
          note: `Tasa sin resultados: ${formatPercentage(intelligenceData.searches.zeroResultRatePercent)}`,
        },
        {
          id: "opportunities_count",
          label: "Oportunidades de Contenido",
          value: formatNumber(intelligenceData.searches.opportunities.length),
        },
      ];

      const tables: ReportTableSection[] = [
        {
          id: "top_terms",
          title: "Términos Más Frecuentes",
          description: "Listado de búsquedas ordenadas por volumen de consulta.",
          columns: [
            { key: "term", header: "Término", align: "left" },
            { key: "volume", header: "Búsquedas", align: "right", isNumeric: true },
            { key: "users", header: "Visitantes", align: "right", isNumeric: true },
            { key: "zeroCount", header: "Sin Resultados", align: "right", isNumeric: true },
            { key: "avgResults", header: "Prom. Resultados", align: "right" },
          ],
          rows: searchesData.topTerms.map((t) => ({
            term: t.term,
            volume: formatNumber(t.searches),
            users: formatNumber(t.users),
            zeroCount: formatNumber(t.zeroResultsCount),
            avgResults: Math.round(t.avgResults * 10) / 10,
          })),
          emptyMessage: "No hay búsquedas registradas.",
        },
        {
          id: "opportunities",
          title: "Oportunidades de Contenido Detectadas",
          description:
            "Términos repetidos por los usuarios que arrojaron cero resultados en el portal.",
          columns: [
            { key: "term", header: "Término", align: "left" },
            { key: "searches", header: "Consultas", align: "right", isNumeric: true },
            { key: "zeroRate", header: "% Sin Resultados", align: "right" },
            { key: "patterns", header: "Patrón Observado", align: "left" },
            { key: "note", header: "Observación Fáctica", align: "left" },
          ],
          rows: intelligenceData.searches.opportunities.map((o) => ({
            term: o.term,
            searches: formatNumber(o.currentSearches),
            zeroRate: `${o.zeroResultsRatePercent}%`,
            patterns: o.patternsObserved.join(" · "),
            note: o.descriptiveNote,
          })),
          emptyMessage: "No se identificaron oportunidades de búsqueda insatisfechas.",
        },
      ];

      return {
        metadata: createReportMetadata(
          reportType,
          period,
          normSchoolFilter,
          schoolNameLabel,
          intelligenceData.searches.confidence,
        ),
        managementSummary: summary,
        keyMetrics,
        tables,
        hasAnyData: hasData,
        insufficientDataNote: !hasData
          ? "No se registraron búsquedas en el periodo seleccionado para generar el reporte de inteligencia de búsqueda."
          : null,
      };
    }

    case "schools": {
      const [schoolsData, intelligenceData] = await Promise.all([
        fetchSchoolsAnalytics(period),
        fetchAnalyticsIntelligenceReport(period, normSchoolFilter),
      ]);

      const hasData = schoolsData.hasAnyData;
      let summary = `Se evaluó la actividad agregada en ${formatNumber(schoolsData.rows.length)} escuelas del distrito escolar. `;
      if (hasData) {
        const activeCount = schoolsData.rows.filter((s) => s.pageViews > 0).length;
        summary += `${activeCount} escuelas presentaron actividad directa de vistas o selecciones. Las métricas reflejan consultas descriptivas y no constituyen una evaluación comparativa de desempeño institucional.`;
      } else {
        summary += "No se registran eventos vinculados a escuelas en este periodo.";
      }

      const totalViews = schoolsData.rows.reduce((acc, s) => acc + s.pageViews, 0);
      const totalSelections = schoolsData.rows.reduce((acc, s) => acc + s.selections, 0);

      const keyMetrics: MetricSummaryCardItem[] = [
        {
          id: "schools_count",
          label: "Escuelas Evaluadas",
          value: formatNumber(schoolsData.rows.length),
        },
        {
          id: "school_views",
          label: "Vistas de Páginas de Escuelas",
          value: formatNumber(totalViews),
        },
        {
          id: "school_selections",
          label: "Selecciones de Escuela en Interfaz",
          value: formatNumber(totalSelections),
        },
      ];

      const tables: ReportTableSection[] = [
        {
          id: "schools_overview",
          title: "Actividad Agregada por Escuela",
          description:
            "Vistas, visitantes y selecciones registradas para cada escuela de Des Moines.",
          columns: [
            { key: "school", header: "Escuela", align: "left" },
            { key: "views", header: "Vistas", align: "right", isNumeric: true },
            { key: "sessions", header: "Sesiones", align: "right", isNumeric: true },
            { key: "users", header: "Visitantes", align: "right", isNumeric: true },
            { key: "selections", header: "Selecciones", align: "right", isNumeric: true },
            { key: "activityLevel", header: "Nivel de Observación", align: "center" },
          ],
          rows: schoolsData.rows.map((s) => ({
            school: s.schoolName || s.shortName || s.schoolId,
            views: formatNumber(s.pageViews),
            sessions: formatNumber(s.sessions),
            users: formatNumber(s.users),
            selections: formatNumber(s.selections),
            activityLevel:
              s.pageViews >= 20
                ? "Mayor volumen observado"
                : s.pageViews > 0
                  ? "Volumen moderado"
                  : "Sin actividad en periodo",
          })),
          emptyMessage: "No hay registros de escuelas para este periodo.",
        },
        {
          id: "school_top_content",
          title: "Contenido Destacado por Escuela",
          description: "Elementos de contenido con mayor consulta asociados a cada escuela.",
          columns: [
            { key: "school", header: "Escuela", align: "left" },
            { key: "topContent", header: "Contenido Más Consultado", align: "left" },
            { key: "views", header: "Vistas", align: "right", isNumeric: true },
          ],
          rows: intelligenceData.schools.schools
            .filter((s) => s.topConsultedContent.length > 0)
            .map((s) => ({
              school: s.schoolName || s.shortName || s.schoolId,
              topContent: s.topConsultedContent[0]?.title || "—",
              views: formatNumber(s.topConsultedContent[0]?.views ?? 0),
            })),
          emptyMessage: "No se identificaron contenidos específicos vinculados por escuela.",
        },
      ];

      return {
        metadata: createReportMetadata(
          reportType,
          period,
          normSchoolFilter,
          schoolNameLabel,
          intelligenceData.schools.confidence,
        ),
        managementSummary: summary,
        keyMetrics,
        tables,
        hasAnyData: hasData,
        insufficientDataNote: !hasData
          ? "No hay suficientes observaciones para la distribución por escuelas en este rango."
          : null,
      };
    }

    case "navigation": {
      const [navigationData, intelligenceData] = await Promise.all([
        fetchNavigationAnalytics(period, normSchoolFilter),
        fetchAnalyticsIntelligenceReport(period, normSchoolFilter),
      ]);

      const hasData = navigationData.hasAnyData;
      const topLanding = navigationData.landingPages[0];
      const topExit = navigationData.exitPages[0];

      let summary = "Análisis agregado de rutas de navegación y flujos de usuario. ";
      if (hasData) {
        summary += `La principal página de aterrizaje fue "${topLanding?.path || "/"}" (${formatNumber(topLanding?.sessions)} sesiones). `;
        summary += `La principal ruta de salida registrada fue "${topExit?.path || "/"}" (${formatNumber(topExit?.sessions)} sesiones). `;
        summary += `Se detectaron ${formatNumber(intelligenceData.navigation.frequentTransitions.length)} transiciones frecuentes entre páginas.`;
      } else {
        summary += "No se registran suficientes eventos de navegación en este periodo.";
      }

      const keyMetrics: MetricSummaryCardItem[] = [
        {
          id: "entry_pages_count",
          label: "Rutas de Entrada Registradas",
          value: formatNumber(navigationData.landingPages.length),
          note: topLanding ? `Principal: ${topLanding.path}` : undefined,
        },
        {
          id: "exit_pages_count",
          label: "Rutas de Salida Registradas",
          value: formatNumber(navigationData.exitPages.length),
          note: topExit ? `Principal: ${topExit.path}` : undefined,
        },
        {
          id: "transitions_count",
          label: "Transiciones Frecuentes",
          value: formatNumber(intelligenceData.navigation.frequentTransitions.length),
        },
      ];

      const tables: ReportTableSection[] = [
        {
          id: "entry_pages",
          title: "Páginas Principales de Entrada (Landing)",
          description: "Rutas donde las familias inician su sesión de consulta en el portal.",
          columns: [
            { key: "path", header: "Ruta", align: "left" },
            { key: "sessions", header: "Sesiones", align: "right", isNumeric: true },
            { key: "users", header: "Visitantes", align: "right", isNumeric: true },
            { key: "views", header: "Vistas", align: "right", isNumeric: true },
          ],
          rows: navigationData.landingPages.slice(0, 10).map((p) => ({
            path: p.path,
            sessions: formatNumber(p.sessions),
            users: formatNumber(p.users),
            views: formatNumber(p.count),
          })),
          emptyMessage: "No hay páginas de entrada registradas.",
        },
        {
          id: "exit_pages",
          title: "Páginas Principales de Salida",
          description: "Últimas rutas consultadas antes de finalizar la sesión de navegación.",
          columns: [
            { key: "path", header: "Ruta", align: "left" },
            { key: "sessions", header: "Sesiones", align: "right", isNumeric: true },
            { key: "users", header: "Visitantes", align: "right", isNumeric: true },
          ],
          rows: navigationData.exitPages.slice(0, 10).map((p) => ({
            path: p.path,
            sessions: formatNumber(p.sessions),
            users: formatNumber(p.users),
          })),
          emptyMessage: "No hay páginas de salida registradas.",
        },
        {
          id: "transitions",
          title: "Transiciones Frecuentes entre Páginas",
          description: "Secuencias consecutivas de navegación registradas en una misma sesión.",
          columns: [
            { key: "from", header: "Página Origen", align: "left" },
            { key: "to", header: "Página Destino", align: "left" },
            { key: "transitions", header: "Transiciones", align: "right", isNumeric: true },
            { key: "sessions", header: "Sesiones", align: "right", isNumeric: true },
          ],
          rows: intelligenceData.navigation.frequentTransitions.slice(0, 10).map((t) => ({
            from: t.fromPath,
            to: t.toPath,
            transitions: formatNumber(t.transitions),
            sessions: formatNumber(t.sessions),
          })),
          emptyMessage: "No se identificaron transiciones repetidas.",
        },
      ];

      return {
        metadata: createReportMetadata(
          reportType,
          period,
          normSchoolFilter,
          schoolNameLabel,
          intelligenceData.navigation.confidence,
        ),
        managementSummary: summary,
        keyMetrics,
        tables,
        hasAnyData: hasData,
        insufficientDataNote: !hasData
          ? "No se cuenta con suficientes sesiones para reconstruir el flujo de navegación."
          : null,
      };
    }

    case "pwa": {
      const [pwaData, intelligenceData] = await Promise.all([
        fetchPwaAnalytics(period),
        fetchAnalyticsIntelligenceReport(period, normSchoolFilter),
      ]);

      const hasData = pwaData.hasAnyData;
      let summary = `Adopción de la Progressive Web App (PWA): se registraron ${formatNumber(pwaData.promptsShown)} avisos de instalación, ${formatNumber(pwaData.installs)} instalaciones efectivas y ${formatNumber(pwaData.launches)} aperturas independientes. `;
      if (hasData) {
        summary += `La tasa de instalación observada fue de ${formatPercentage(pwaData.installRatePercent)}.`;
      } else {
        summary += "No se registraron eventos PWA en el periodo analizado.";
      }

      const keyMetrics: MetricSummaryCardItem[] = [
        {
          id: "pwa_prompts",
          label: "Avisos Mostrados",
          value: formatNumber(pwaData.promptsShown),
        },
        {
          id: "pwa_installs",
          label: "Instalaciones Registradas",
          value: formatNumber(pwaData.installs),
        },
        {
          id: "install_rate",
          label: "Tasa de Instalación",
          value: formatPercentage(pwaData.installRatePercent),
        },
        {
          id: "pwa_launches",
          label: "Aperturas PWA",
          value: formatNumber(pwaData.launches),
        },
      ];

      const tables: ReportTableSection[] = [
        {
          id: "pwa_platforms",
          title: "Instalaciones y Actividad por Plataforma",
          description: "Desglose por sistema operativo móvil o de escritorio.",
          columns: [
            { key: "platform", header: "Plataforma", align: "left" },
            { key: "count", header: "Eventos Registrados", align: "right", isNumeric: true },
          ],
          rows: pwaData.byPlatform.map((p) => ({
            platform: p.platform.toUpperCase(),
            count: formatNumber(p.count),
          })),
          emptyMessage: "No hay eventos PWA clasificados por plataforma.",
        },
      ];

      return {
        metadata: createReportMetadata(
          reportType,
          period,
          normSchoolFilter,
          schoolNameLabel,
          intelligenceData.pwa.confidence,
        ),
        managementSummary: summary,
        keyMetrics,
        tables,
        hasAnyData: hasData,
        insufficientDataNote: !hasData
          ? "No se han registrado eventos de instalación o uso PWA en este periodo."
          : null,
      };
    }

    case "intelligence": {
      const intelligenceData = await fetchAnalyticsIntelligenceReport(period, normSchoolFilter);
      const hasData = intelligenceData.hasAnyData;

      let summary = `Informe de Inteligencia y Diagnóstico Analítico (Confianza: ${intelligenceData.overallConfidence.toUpperCase()}). `;
      summary += `Se consolidaron ${formatNumber(intelligenceData.insights.length)} hallazgos determinísticos sobre contenido, búsquedas, sesiones, navegación y segmentos. `;
      summary +=
        "Todas las conclusiones están fundamentadas exclusivamente en datos observados sin interpretaciones especulativas.";

      const keyMetrics: MetricSummaryCardItem[] = [
        {
          id: "total_insights",
          label: "Hallazgos Consolidados",
          value: formatNumber(intelligenceData.insights.length),
        },
        {
          id: "search_opportunities",
          label: "Oportunidades de Búsqueda",
          value: formatNumber(intelligenceData.searches.opportunities.length),
        },
        {
          id: "growing_content",
          label: "Contenido en Crecimiento",
          value: formatNumber(intelligenceData.content.growingContent.length),
        },
        {
          id: "confidence",
          label: "Confianza Global",
          value:
            intelligenceData.overallConfidence === "sufficient"
              ? "Suficiente"
              : intelligenceData.overallConfidence === "limited"
                ? "Limitada"
                : "Insuficiente",
        },
      ];

      const tables: ReportTableSection[] = [
        {
          id: "insights_table",
          title: "Detalle de Hallazgos Determinísticos",
          description: "Observaciones analíticas sustentadas por métricas de la base de datos.",
          columns: [
            { key: "category", header: "Categoría", align: "left" },
            { key: "title", header: "Hallazgo", align: "left" },
            { key: "observation", header: "Evidencia Fáctica", align: "left" },
            { key: "current", header: "Valor Actual", align: "right" },
            { key: "previous", header: "Valor Previo", align: "right" },
            { key: "delta", header: "Variación", align: "right" },
            { key: "confidence", header: "Confianza", align: "center" },
          ],
          rows: intelligenceData.insights.map((ins) => ({
            category: ins.category.toUpperCase(),
            title: ins.title,
            observation: ins.observation,
            current: ins.currentValue,
            previous: ins.previousValue ?? "—",
            delta: ins.deltaLabel ?? "—",
            confidence: ins.confidence,
          })),
          emptyMessage: "No hay hallazgos disponibles con los datos actuales.",
        },
        {
          id: "trends_summary",
          title: "Tendencias de Métricas Globales",
          description: "Comportamiento relativo de los principales indicadores.",
          columns: [
            { key: "label", header: "Indicador", align: "left" },
            { key: "state", header: "Estado", align: "center" },
            { key: "current", header: "Actual", align: "right", isNumeric: true },
            { key: "previous", header: "Previo", align: "right", isNumeric: true },
            { key: "delta", header: "Cambio", align: "right" },
            { key: "summary", header: "Diagnóstico", align: "left" },
          ],
          rows: intelligenceData.trends.items.map((t) => ({
            label: t.label,
            state: t.stabilityState.replace("_", " ").toUpperCase(),
            current: formatNumber(t.metric.current),
            previous: t.metric.previous !== null ? formatNumber(t.metric.previous) : "—",
            delta:
              t.metric.deltaPercent !== null
                ? `${t.metric.deltaPercent > 0 ? "+" : ""}${t.metric.deltaPercent}%`
                : "—",
            summary: t.descriptiveSummary,
          })),
        },
      ];

      const findings: ReportFindingItem[] = intelligenceData.insights.map((ins) => ({
        id: ins.id,
        categoryLabel: ins.category.toUpperCase(),
        title: ins.title,
        evidence: `${ins.observation} (Métrica: ${ins.currentValue}${ins.deltaLabel ? `, ${ins.deltaLabel}` : ""})`,
        periodLabel: ins.periodLabel,
        confidence: ins.confidence,
        entityOrMetric: ins.metricName,
      }));

      return {
        metadata: createReportMetadata(
          reportType,
          period,
          normSchoolFilter,
          schoolNameLabel,
          intelligenceData.overallConfidence,
        ),
        managementSummary: summary,
        keyMetrics,
        tables,
        findings,
        hasAnyData: hasData,
        insufficientDataNote: !hasData
          ? "Muestra analítica insuficiente para generar diagnósticos de inteligencia."
          : null,
      };
    }

    case "full_dataset": {
      const [
        overviewData,
        contentData,
        searchesData,
        schoolsData,
        audienceData,
        navigationData,
        pwaData,
        intelligenceData,
      ] = await Promise.all([
        fetchAnalyticsOverviewAndSeries(period, normSchoolFilter, 60),
        fetchContentAnalytics(period, normSchoolFilter),
        fetchSearchesAnalytics(period),
        fetchSchoolsAnalytics(period),
        fetchAudienceAnalytics(period),
        fetchNavigationAnalytics(period, normSchoolFilter),
        fetchPwaAnalytics(period),
        fetchAnalyticsIntelligenceReport(period, normSchoolFilter),
      ]);

      const ov = overviewData.overview;
      const hasData = ov.hasAnyData;

      const summary = `Conjunto consolidado integral de analítica administrativa de DMPS INFO para el periodo ${ANALYTICS_PERIOD_OPTIONS.find((p) => p.key === period)?.label || period}. Contiene tablas estructuradas de resumen, contenido, búsquedas, escuelas, audiencia, navegación, PWA e inteligencia fáctica.`;

      const keyMetrics: MetricSummaryCardItem[] = [
        { id: "views", label: "Vistas de Contenido", value: formatNumber(ov.pageViews.current) },
        { id: "sessions", label: "Sesiones", value: formatNumber(ov.sessions.current) },
        { id: "users", label: "Visitantes Únicos", value: formatNumber(ov.uniqueUsers.current) },
        {
          id: "searches",
          label: "Búsquedas",
          value: formatNumber(searchesData.totalSearches),
        },
        {
          id: "content_items",
          label: "Items de Contenido",
          value: formatNumber(contentData.rows.length),
        },
        { id: "pwa_installs", label: "Instalaciones PWA", value: formatNumber(pwaData.installs) },
      ];

      const tables: ReportTableSection[] = [
        {
          id: "summary_metrics",
          title: "1. Métricas Principales de Tráfico",
          columns: [
            { key: "metric", header: "Métrica", align: "left" },
            { key: "current", header: "Actual", align: "right", isNumeric: true },
            { key: "previous", header: "Previo", align: "right", isNumeric: true },
            { key: "delta", header: "Variación", align: "right" },
          ],
          rows: [
            {
              metric: "Vistas de Página / Contenido",
              current: formatNumber(ov.pageViews.current),
              previous: ov.pageViews.previous !== null ? formatNumber(ov.pageViews.previous) : "—",
              delta: computeChangeLabel(ov.pageViews.current, ov.pageViews.previous).label,
            },
            {
              metric: "Sesiones Estimadas",
              current: formatNumber(ov.sessions.current),
              previous: ov.sessions.previous !== null ? formatNumber(ov.sessions.previous) : "—",
              delta: computeChangeLabel(ov.sessions.current, ov.sessions.previous).label,
            },
            {
              metric: "Visitantes Únicos (Agregado)",
              current: formatNumber(ov.uniqueUsers.current),
              previous:
                ov.uniqueUsers.previous !== null ? formatNumber(ov.uniqueUsers.previous) : "—",
              delta: computeChangeLabel(ov.uniqueUsers.current, ov.uniqueUsers.previous).label,
            },
            {
              metric: "Búsquedas Registradas",
              current: formatNumber(ov.searches.current),
              previous: ov.searches.previous !== null ? formatNumber(ov.searches.previous) : "—",
              delta: computeChangeLabel(ov.searches.current, ov.searches.previous).label,
            },
            {
              metric: "Instalaciones PWA",
              current: formatNumber(ov.pwaInstalls.current),
              previous:
                ov.pwaInstalls.previous !== null ? formatNumber(ov.pwaInstalls.previous) : "—",
              delta: computeChangeLabel(ov.pwaInstalls.current, ov.pwaInstalls.previous).label,
            },
          ],
        },
        {
          id: "content_all",
          title: "2. Rendimiento Completo de Contenido",
          columns: [
            { key: "title", header: "Título", align: "left" },
            { key: "category", header: "Categoría", align: "left" },
            { key: "views", header: "Vistas", align: "right", isNumeric: true },
            { key: "sessions", header: "Sesiones", align: "right", isNumeric: true },
            { key: "users", header: "Visitantes", align: "right", isNumeric: true },
            { key: "avgDuration", header: "Duración Media", align: "right" },
          ],
          rows: contentData.rows.map((r) => ({
            title: r.title,
            category: r.categoryGroup,
            views: formatNumber(r.views),
            sessions: formatNumber(r.sessions),
            users: formatNumber(r.users),
            avgDuration: formatDuration(r.avgDurationSeconds),
          })),
        },
        {
          id: "searches_all",
          title: "3. Términos de Búsqueda",
          columns: [
            { key: "term", header: "Término", align: "left" },
            { key: "searches", header: "Búsquedas", align: "right", isNumeric: true },
            { key: "zeroCount", header: "Sin Resultados", align: "right", isNumeric: true },
            { key: "avgResults", header: "Prom. Resultados", align: "right" },
          ],
          rows: searchesData.topTerms.map((t) => ({
            term: t.term,
            searches: formatNumber(t.searches),
            zeroCount: formatNumber(t.zeroResultsCount),
            avgResults: Math.round(t.avgResults * 10) / 10,
          })),
        },
        {
          id: "schools_all",
          title: "4. Actividad por Escuela",
          columns: [
            { key: "school", header: "Escuela", align: "left" },
            { key: "views", header: "Vistas", align: "right", isNumeric: true },
            { key: "sessions", header: "Sesiones", align: "right", isNumeric: true },
            { key: "selections", header: "Selecciones", align: "right", isNumeric: true },
          ],
          rows: schoolsData.rows.map((s) => ({
            school: s.schoolName || s.shortName || s.schoolId,
            views: formatNumber(s.pageViews),
            sessions: formatNumber(s.sessions),
            selections: formatNumber(s.selections),
          })),
        },
      ];

      return {
        metadata: createReportMetadata(
          reportType,
          period,
          normSchoolFilter,
          schoolNameLabel,
          intelligenceData.overallConfidence,
        ),
        managementSummary: summary,
        keyMetrics,
        tables,
        hasAnyData: hasData,
        insufficientDataNote: !hasData
          ? "No hay datos analíticos registrados para generar el conjunto de datos completo en este periodo."
          : null,
      };
    }
  }
}
