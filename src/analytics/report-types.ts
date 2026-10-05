import type { AnalyticsPeriodKey } from "./dashboard-queries";
import type { ConfidenceLevel } from "./intelligence-queries";

export type AnalyticsReportType =
  | "executive"
  | "traffic"
  | "content"
  | "searches"
  | "schools"
  | "navigation"
  | "pwa"
  | "intelligence"
  | "full_dataset";

export interface ReportTypeDefinition {
  id: AnalyticsReportType;
  title: string;
  shortTitle: string;
  description: string;
  supportsSchoolFilter: boolean;
  supportsPeriodComparison: boolean;
}

export const ANALYTICS_REPORT_DEFINITIONS: ReportTypeDefinition[] = [
  {
    id: "executive",
    title: "Resumen Ejecutivo de Analítica",
    shortTitle: "Resumen Ejecutivo",
    description:
      "Síntesis agregada de alto nivel con volumen de tráfico, contenido principal, búsquedas destacadas, actividad por escuela y hallazgos clave.",
    supportsSchoolFilter: true,
    supportsPeriodComparison: true,
  },
  {
    id: "traffic",
    title: "Tráfico, Sesiones y Participación",
    shortTitle: "Tráfico y Participación",
    description:
      "Análisis de eventos totales, sesiones de usuario, páginas por sesión, duración promedio y evolución diaria a lo largo del periodo.",
    supportsSchoolFilter: true,
    supportsPeriodComparison: true,
  },
  {
    id: "content",
    title: "Rendimiento y Tendencias de Contenido",
    shortTitle: "Rendimiento de Contenido",
    description:
      "Métricas de consulta por página, artículo, categoría y recurso con resolución de títulos reales, tendencias y distribución.",
    supportsSchoolFilter: true,
    supportsPeriodComparison: true,
  },
  {
    id: "searches",
    title: "Inteligencia y Volumen de Búsquedas",
    shortTitle: "Inteligencia de Búsquedas",
    description:
      "Términos más consultados, tasa de éxito, búsquedas con cero resultados y oportunidades de contenido detectadas.",
    supportsSchoolFilter: false,
    supportsPeriodComparison: true,
  },
  {
    id: "schools",
    title: "Rendimiento y Actividad por Escuela",
    shortTitle: "Rendimiento por Escuela",
    description:
      "Distribución comparativa neutra de consultas, sesiones y selecciones de escuelas en el distrito.",
    supportsSchoolFilter: false,
    supportsPeriodComparison: true,
  },
  {
    id: "navigation",
    title: "Navegación y Flujo de Usuarios",
    shortTitle: "Navegación y Flujos",
    description:
      "Páginas principales de entrada y salida, transiciones de rutas más frecuentes y profundidad de navegación.",
    supportsSchoolFilter: true,
    supportsPeriodComparison: false,
  },
  {
    id: "pwa",
    title: "Uso y Adopción de la Aplicación PWA",
    shortTitle: "Uso PWA",
    description:
      "Avisos de instalación mostrados, instalaciones registradas, aperturas como app independiente y desglose por plataforma.",
    supportsSchoolFilter: false,
    supportsPeriodComparison: true,
  },
  {
    id: "intelligence",
    title: "Hallazgos de Inteligencia y Diagnóstico",
    shortTitle: "Hallazgos de Inteligencia",
    description:
      "Hallazgos determinísticos estructurados con evidencia fáctica, categorías afectadas, métricas y nivel de confianza.",
    supportsSchoolFilter: true,
    supportsPeriodComparison: false,
  },
  {
    id: "full_dataset",
    title: "Conjunto Completo de Datos Analíticos",
    shortTitle: "Dataset Completo",
    description:
      "Exportación integral consolidada y agregada para auditoría administrativa, reportes anuales y análisis de distrito.",
    supportsSchoolFilter: true,
    supportsPeriodComparison: true,
  },
];

export interface ReportMetadata {
  reportId: AnalyticsReportType;
  reportTitle: string;
  generatedAtIso: string;
  generatedAtFormatted: string;
  period: AnalyticsPeriodKey;
  periodLabel: string;
  startDateIso: string | null;
  endDateIso: string;
  schoolFilter: string;
  schoolFilterLabel: string;
  dataSource: "DMPS INFO Analytics (Supabase PostgreSQL)";
  isSchoolFilterApplied: boolean;
  isComparisonSupported: boolean;
  confidence: ConfidenceLevel;
}

export interface MetricSummaryCardItem {
  id: string;
  label: string;
  value: string | number;
  previousValue?: string | number | null;
  changeLabel?: string | null;
  direction?: "up" | "down" | "neutral" | "insufficient";
  note?: string;
}

export interface ReportTableColumn {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  isNumeric?: boolean;
}

export interface ReportTableRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ReportTableSection {
  id: string;
  title: string;
  description?: string;
  columns: ReportTableColumn[];
  rows: ReportTableRow[];
  emptyMessage?: string;
}

export interface ReportFindingItem {
  id: string;
  categoryLabel: string;
  title: string;
  evidence: string;
  periodLabel: string;
  confidence: ConfidenceLevel;
  entityOrMetric?: string;
}

export interface AnalyticsGeneratedReport {
  metadata: ReportMetadata;
  managementSummary: string;
  keyMetrics: MetricSummaryCardItem[];
  tables: ReportTableSection[];
  findings?: ReportFindingItem[];
  hasAnyData: boolean;
  insufficientDataNote?: string | null;
}
