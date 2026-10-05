import { supabase } from "@/integrations/supabase/client";
import {
  buildComparisonMetric,
  computeAnalyticsDateRange,
  type AnalyticsComparisonMetric,
  type AnalyticsDateRange,
  type AnalyticsPeriodKey,
  type DashboardContentCategory,
} from "./dashboard-queries";

export type TrendDirection = "up" | "down" | "neutral" | "insufficient";

export type ConfidenceLevel = "sufficient" | "limited" | "insufficient";

export interface ContentTrendRow {
  key: string;
  contentId: string;
  title: string;
  contentTypeLabel: string;
  categoryGroup: Exclude<DashboardContentCategory, "all">;
  currentViews: number;
  previousViews: number | null;
  absoluteDelta: number | null;
  percentDelta: number | null;
  direction: TrendDirection;
  users: number;
  sessions: number;
  avgDurationSeconds: number | null;
  activityLevel: "alta" | "media" | "baja";
  isAvailable: boolean;
}

export interface ContentTypeSummaryRow {
  categoryGroup: Exclude<DashboardContentCategory, "all">;
  typeLabel: string;
  views: number;
  users: number;
  sessions: number;
  percentageOfViews: number;
}

export interface ContentIntelligenceSection {
  topConsulted: ContentTrendRow[];
  growingContent: ContentTrendRow[];
  decliningContent: ContentTrendRow[];
  highActivityContent: ContentTrendRow[];
  lowActivityContent: ContentTrendRow[];
  byContentType: ContentTypeSummaryRow[];
  confidence: ConfidenceLevel;
  hasAnyData: boolean;
}

export interface SearchOpportunityRow {
  term: string;
  normalizedTerm: string;
  currentSearches: number;
  previousSearches: number | null;
  absoluteDelta: number | null;
  percentDelta: number | null;
  direction: TrendDirection;
  users: number;
  zeroResultsCount: number;
  zeroResultsRatePercent: number;
  avgResults: number;
  patternsObserved: string[];
  descriptiveNote: string;
}

export interface SearchIntelligenceSection {
  totalSearches: number;
  previousSearches: number | null;
  uniqueUsers: number;
  uniqueTerms: number;
  zeroResultSearches: number;
  zeroResultRatePercent: number | null;
  avgResults: number | null;
  topSearchedTerms: SearchOpportunityRow[];
  growingTerms: SearchOpportunityRow[];
  zeroResultTerms: SearchOpportunityRow[];
  opportunities: SearchOpportunityRow[];
  confidence: ConfidenceLevel;
  hasAnyData: boolean;
}

export interface SessionIntelligenceSection {
  totalSessions: number;
  avgDurationSeconds: number | null;
  avgPagesPerSession: number | null;
  singlePageSessions: number;
  singlePageRatePercent: number | null;
  multiPageSessions: number;
  multiPageRatePercent: number | null;
  deepNavigationSessions: number;
  deepNavigationRatePercent: number | null;
  sessionsWithSearches: number;
  sessionsWithEvents: number;
  confidence: ConfidenceLevel;
  hasAnyData: boolean;
}

export interface NavigationSequenceRow {
  fromPath: string;
  toPath: string;
  transitions: number;
  sessions: number;
  users: number;
}

export interface EntryExitIntelligenceRow {
  path: string;
  contentTypeLabel: string;
  sessions: number;
  users: number;
  percentage: number;
}

export interface NavigationIntelligenceSection {
  entryPages: EntryExitIntelligenceRow[];
  exitPages: EntryExitIntelligenceRow[];
  frequentTransitions: NavigationSequenceRow[];
  visitedAfterEntry: NavigationSequenceRow[];
  visitedBeforeExit: NavigationSequenceRow[];
  confidence: ConfidenceLevel;
  hasAnyData: boolean;
}

export interface MetricTrendItem {
  key: string;
  label: string;
  metric: AnalyticsComparisonMetric;
  stabilityState:
    "aumento" | "disminución" | "estabilidad" | "actividad_inusual" | "sin_comparacion";
  descriptiveSummary: string;
  dataSource: string;
}

export interface TrendIntelligenceSection {
  items: MetricTrendItem[];
  confidence: ConfidenceLevel;
  hasAnyData: boolean;
}

export interface SegmentIntelligenceRow {
  segmentType: "idioma" | "dispositivo" | "navegador" | "sistema_operativo" | "escuela";
  segmentValue: string;
  users: number;
  sessions: number;
  sharePercent: number;
  avgPagesPerSession: number | null;
  avgDurationSeconds: number | null;
}

export interface SegmentationIntelligenceSection {
  languages: SegmentIntelligenceRow[];
  devices: SegmentIntelligenceRow[];
  browsers: SegmentIntelligenceRow[];
  operatingSystems: SegmentIntelligenceRow[];
  schools: SegmentIntelligenceRow[];
  confidence: ConfidenceLevel;
  hasAnyData: boolean;
}

export interface SchoolContentConsultationRow {
  schoolId: string;
  schoolName: string;
  shortName: string | null;
  pageViews: number;
  users: number;
  sessions: number;
  selections: number;
  topConsultedContent: Array<{
    contentId: string;
    title: string;
    contentTypeLabel: string;
    views: number;
  }>;
  hasActivity: boolean;
}

export interface SchoolIntelligenceSection {
  schools: SchoolContentConsultationRow[];
  confidence: ConfidenceLevel;
  hasAnyData: boolean;
}

export interface PwaIntelligenceSection {
  launches: AnalyticsComparisonMetric;
  promptsShown: AnalyticsComparisonMetric;
  installs: AnalyticsComparisonMetric;
  installRatePercent: number | null;
  previousInstallRatePercent: number | null;
  descriptiveSummary: string;
  confidence: ConfidenceLevel;
  hasAnyData: boolean;
}

export interface ExplainableInsight {
  id: string;
  category:
    | "contenido"
    | "busquedas"
    | "sesiones"
    | "navegacion"
    | "tendencias"
    | "segmentos"
    | "escuelas"
    | "pwa";
  title: string;
  observation: string;
  metricName: string;
  currentValue: string;
  previousValue: string | null;
  deltaLabel: string | null;
  periodLabel: string;
  dataSource: string;
  confidence: ConfidenceLevel;
}

export interface AnalyticsIntelligenceReport {
  period: AnalyticsPeriodKey;
  dateRange: AnalyticsDateRange;
  schoolFilter: string;
  content: ContentIntelligenceSection;
  searches: SearchIntelligenceSection;
  sessions: SessionIntelligenceSection;
  navigation: NavigationIntelligenceSection;
  trends: TrendIntelligenceSection;
  segmentation: SegmentationIntelligenceSection;
  schools: SchoolIntelligenceSection;
  pwa: PwaIntelligenceSection;
  insights: ExplainableInsight[];
  overallConfidence: ConfidenceLevel;
  hasAnyData: boolean;
}

export function evaluateSampleConfidence(totalCount: number): ConfidenceLevel {
  if (totalCount <= 0) return "insufficient";
  if (totalCount < 5) return "limited";
  return "sufficient";
}

function throwIfError(error: { message?: string; code?: string } | null, context: string) {
  if (error) {
    throw new Error(
      `No fue posible cargar ${context}: ${error.message || "Error de consulta"}${
        error.code ? ` (${error.code})` : ""
      }`,
    );
  }
}

interface ContentCatalogMaps {
  articles: Map<string, string>;
  categories: Map<string, string>;
  resources: Map<string, string>;
  programs: Map<string, string>;
  studentPrograms: Map<string, string>;
  activities: Map<string, string>;
  faqs: Map<string, string>;
  announcements: Map<string, string>;
  schools: Map<string, { id: string; name: string; shortName: string | null }>;
  contacts: Map<string, string>;
}

const KNOWN_ROUTE_LABELS: Record<string, string> = {
  "/": "Portada principal (Inicio)",
  home: "Portada principal (Inicio)",
  "/topics": "Directorio de Temas",
  topics: "Directorio de Temas",
  "/search": "Buscador general",
  search: "Buscador general",
  "/faq": "Preguntas Frecuentes (FAQ)",
  faq: "Preguntas Frecuentes (FAQ)",
  "/announcements": "Avisos y Comunicados",
  announcements: "Avisos y Comunicados",
  "/contact": "Directorio y Contacto BFL",
  contact: "Directorio y Contacto BFL",
  "/apps": "Aplicaciones y Portales",
  apps: "Aplicaciones y Portales",
  "/programas": "Programas Académicos",
  programas: "Programas Académicos",
  "/programas-estudiantes": "Programas para Estudiantes",
  "programas-estudiantes": "Programas para Estudiantes",
  "/deportes-actividades": "Deportes y Actividades",
  "deportes-actividades": "Deportes y Actividades",
  "/equipos": "Equipos Deportivos",
  equipos: "Equipos Deportivos",
  "/escuelas": "Escuelas del Distrito",
  escuelas: "Escuelas del Distrito",
  "/calendario": "Calendario Escolar",
  calendario: "Calendario Escolar",
  "/eventos": "Eventos Escolares",
  "/horario-campanas": "Horario de Campanas",
  "horario-campanas": "Horario de Campanas",
  "/transporte/dart": "Transporte Escolar y DART",
  transporte: "Transporte Escolar y DART",
  dart: "Transporte Escolar y DART",
  "/voluntarios": "Voluntarios",
  voluntarios: "Voluntarios",
  "/empleos": "Bolsa de Trabajo",
  empleos: "Bolsa de Trabajo",
  "/bfl-status": "Estado BFL",
  "bfl-status": "Estado BFL",
  "/quienes-somos": "Quiénes Somos",
  "/redes-sociales": "Redes Sociales Oficiales",
  "/accessibility": "Accesibilidad",
};

async function fetchContentCatalogMaps(): Promise<ContentCatalogMaps> {
  const [
    articlesRes,
    categoriesRes,
    resourcesRes,
    resourceTrRes,
    programsRes,
    studentProgramsRes,
    activitiesRes,
    faqsRes,
    faqTrRes,
    announcementsRes,
    annTrRes,
    schoolsRes,
    contactsRes,
  ] = await Promise.all([
    supabase.from("articles").select("id, slug, title"),
    supabase.from("categories").select("id, slug, name"),
    supabase.from("resources").select("id, url"),
    supabase.from("resource_translations").select("resource_id, language_code, title"),
    supabase.from("programs").select("id, name"),
    supabase.from("student_programs").select("id, name_es, name_en"),
    supabase.from("activities").select("id, name"),
    supabase.from("faqs").select("id"),
    supabase.from("faq_translations").select("faq_id, language_code, question"),
    supabase.from("announcements").select("id"),
    supabase.from("announcement_translations").select("announcement_id, language_code, title"),
    supabase
      .from("schools")
      .select("id, slug, name, short_name")
      .order("name", { ascending: true }),
    supabase.from("contacts").select("id, person_name, role_title, job_title, department"),
  ]);

  throwIfError(schoolsRes.error, "catálogo de escuelas");

  const articles = new Map<string, string>();
  for (const r of articlesRes.data ?? []) {
    if (r.id && r.title) articles.set(String(r.id), r.title);
    if (r.slug && r.title) articles.set(String(r.slug), r.title);
  }

  const categories = new Map<string, string>();
  for (const r of categoriesRes.data ?? []) {
    if (r.id && r.name) categories.set(String(r.id), r.name);
    if (r.slug && r.name) categories.set(String(r.slug), r.name);
  }

  const resources = new Map<string, string>();
  const resourceTrs = (resourceTrRes.data ?? []) as Array<{
    resource_id: string;
    language_code: string;
    title: string;
  }>;
  for (const r of (resourcesRes.data ?? []) as Array<{ id: string; url?: string | null }>) {
    const es = resourceTrs.find(
      (t) => String(t.resource_id) === String(r.id) && t.language_code === "es",
    );
    const en = resourceTrs.find(
      (t) => String(t.resource_id) === String(r.id) && t.language_code === "en",
    );
    const anyTr = resourceTrs.find((t) => String(t.resource_id) === String(r.id));
    const title = es?.title || en?.title || anyTr?.title || r.url || null;
    if (r.id && title) {
      resources.set(String(r.id), title);
    }
  }

  const programs = new Map<string, string>();
  for (const r of programsRes.data ?? []) {
    if (r.id && r.name) programs.set(String(r.id), r.name);
  }

  const studentPrograms = new Map<string, string>();
  for (const r of studentProgramsRes.data ?? []) {
    const label = r.name_es || r.name_en;
    if (r.id && label) studentPrograms.set(String(r.id), label);
  }

  const activities = new Map<string, string>();
  for (const r of activitiesRes.data ?? []) {
    if (r.id && r.name) activities.set(String(r.id), r.name);
  }

  const faqs = new Map<string, string>();
  const faqTrs = faqTrRes.data ?? [];
  for (const f of faqsRes.data ?? []) {
    const es = faqTrs.find((t) => String(t.faq_id) === String(f.id) && t.language_code === "es");
    const anyTr = faqTrs.find((t) => String(t.faq_id) === String(f.id));
    const q = es?.question || anyTr?.question;
    if (f.id && q) faqs.set(String(f.id), q);
  }

  const announcements = new Map<string, string>();
  const annTrs = annTrRes.data ?? [];
  for (const a of announcementsRes.data ?? []) {
    const es = annTrs.find(
      (t) => String(t.announcement_id) === String(a.id) && t.language_code === "es",
    );
    const anyTr = annTrs.find((t) => String(t.announcement_id) === String(a.id));
    const title = es?.title || anyTr?.title;
    if (a.id && title) announcements.set(String(a.id), title);
  }

  const schools = new Map<string, { id: string; name: string; shortName: string | null }>();
  for (const s of schoolsRes.data ?? []) {
    const item = {
      id: String(s.id),
      name: s.name || String(s.id),
      shortName: s.short_name || null,
    };
    schools.set(String(s.id).toLowerCase(), item);
    if (s.slug) schools.set(String(s.slug).toLowerCase(), item);
  }

  const contacts = new Map<string, string>();
  for (const c of (contactsRes.data ?? []) as Array<{
    id: string;
    person_name?: string | null;
    role_title?: string | null;
    job_title?: string | null;
    department?: string | null;
  }>) {
    const personOrDept = (c.person_name || c.department || "").trim();
    const roleLabel = (c.role_title || c.job_title || c.department || "").trim();
    const label =
      personOrDept && roleLabel && personOrDept !== roleLabel
        ? `${personOrDept} (${roleLabel})`
        : personOrDept || roleLabel;
    if (c.id && label) contacts.set(String(c.id), label);
  }

  return {
    articles,
    categories,
    resources,
    programs,
    studentPrograms,
    activities,
    faqs,
    announcements,
    schools,
    contacts,
  };
}

export function resolveContentEntity(
  rawType: string | null,
  rawId: string | null,
  rawPath: string | null,
  catalog: ContentCatalogMaps,
): {
  categoryGroup: Exclude<DashboardContentCategory, "all">;
  typeLabel: string;
  title: string;
  isAvailable: boolean;
} {
  const type = (rawType || "page").toLowerCase().trim();
  const id = (rawId || rawPath || "/").trim();

  if (type === "article") {
    const slug = id.startsWith("/articles/") ? id.replace("/articles/", "") : id;
    const found = catalog.articles.get(slug) || catalog.articles.get(id);
    return {
      categoryGroup: "articles",
      typeLabel: "Artículo",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "category") {
    const slug = id.startsWith("/topics/") ? id.replace("/topics/", "") : id;
    const found = catalog.categories.get(slug) || catalog.categories.get(id);
    return {
      categoryGroup: "categories",
      typeLabel: "Categoría",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "resource") {
    const found = catalog.resources.get(id);
    return {
      categoryGroup: "resources",
      typeLabel: "Recurso",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "programs" || type === "student_programs") {
    if (id === "programas" || id === "/programas") {
      return {
        categoryGroup: "programs",
        typeLabel: "Página de Programas",
        title: "Programas Académicos",
        isAvailable: true,
      };
    }
    if (id === "programas-estudiantes" || id === "/programas-estudiantes") {
      return {
        categoryGroup: "programs",
        typeLabel: "Página de Programas",
        title: "Programas para Estudiantes",
        isAvailable: true,
      };
    }
    const found = catalog.programs.get(id) || catalog.studentPrograms.get(id);
    return {
      categoryGroup: "programs",
      typeLabel: type === "student_programs" ? "Programa Estudiantil" : "Programa Académico",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "activities") {
    if (
      id === "deportes-actividades" ||
      id === "/deportes-actividades" ||
      id === "equipos" ||
      id === "/equipos"
    ) {
      return {
        categoryGroup: "activities",
        typeLabel: "Página de Actividades",
        title: KNOWN_ROUTE_LABELS[id] || "Deportes y Actividades",
        isAvailable: true,
      };
    }
    const found = catalog.activities.get(id);
    return {
      categoryGroup: "activities",
      typeLabel: "Deporte / Actividad",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "faq") {
    if (id === "faq" || id === "/faq") {
      return {
        categoryGroup: "pages",
        typeLabel: "Página Pública",
        title: "Preguntas Frecuentes (FAQ)",
        isAvailable: true,
      };
    }
    const found = catalog.faqs.get(id);
    return {
      categoryGroup: "faqs",
      typeLabel: "Pregunta Frecuente",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "announcements") {
    if (id === "announcements" || id === "/announcements") {
      return {
        categoryGroup: "pages",
        typeLabel: "Página Pública",
        title: "Avisos y Comunicados",
        isAvailable: true,
      };
    }
    const found = catalog.announcements.get(id);
    return {
      categoryGroup: "announcements",
      typeLabel: "Aviso Oficial",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "schools") {
    if (id === "escuelas" || id === "/escuelas") {
      return {
        categoryGroup: "pages",
        typeLabel: "Página Pública",
        title: "Escuelas del Distrito",
        isAvailable: true,
      };
    }
    const found = catalog.schools.get(id.toLowerCase())?.name;
    return {
      categoryGroup: "schools",
      typeLabel: "Escuela",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "contact") {
    if (id === "contact" || id === "/contact") {
      return {
        categoryGroup: "pages",
        typeLabel: "Página Pública",
        title: "Directorio y Contacto BFL",
        isAvailable: true,
      };
    }
    const found = catalog.contacts.get(id);
    return {
      categoryGroup: "contacts",
      typeLabel: "Contacto BFL",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "external_link") {
    return {
      categoryGroup: "external_links",
      typeLabel: "Enlace Externo",
      title: id || "Enlace externo",
      isAvailable: true,
    };
  }

  const routeKey = rawPath || id || "/";
  const known = KNOWN_ROUTE_LABELS[routeKey] || KNOWN_ROUTE_LABELS[id];
  return {
    categoryGroup: "pages",
    typeLabel: "Página Pública",
    title: known || routeKey,
    isAvailable: true,
  };
}

function classifyPathContentTypeLabel(path: string): string {
  const clean = (path || "/").trim().toLowerCase();
  if (clean === "/" || clean === "") return "Portada (Inicio)";
  if (clean.startsWith("/articles/")) return "Artículo";
  if (clean.startsWith("/topics/")) return "Categoría";
  if (clean === "/topics") return "Directorio de Temas";
  if (clean.startsWith("/search")) return "Búsqueda";
  if (clean.startsWith("/faq")) return "Preguntas Frecuentes";
  if (clean.startsWith("/programas")) return "Programas";
  if (clean.startsWith("/deportes-actividades") || clean.startsWith("/equipos")) {
    return "Deportes y Actividades";
  }
  if (clean.startsWith("/escuelas")) return "Escuelas";
  if (clean.startsWith("/contact") || clean.startsWith("/bfl-status")) return "Directorio BFL";
  if (clean.startsWith("/calendario") || clean.startsWith("/eventos")) return "Calendario";
  return "Página Pública";
}

function computeDeltaFields(
  current: number,
  previous: number | null,
  period: AnalyticsPeriodKey,
): {
  previous: number | null;
  absoluteDelta: number | null;
  percentDelta: number | null;
  direction: TrendDirection;
} {
  if (period === "all" || previous === null) {
    return {
      previous: null,
      absoluteDelta: null,
      percentDelta: null,
      direction: "insufficient",
    };
  }

  if (current === 0 && previous === 0) {
    return {
      previous: 0,
      absoluteDelta: 0,
      percentDelta: null,
      direction: "insufficient",
    };
  }

  const absoluteDelta = current - previous;
  if (previous === 0) {
    return {
      previous: 0,
      absoluteDelta,
      percentDelta: null,
      direction: current > 0 ? "up" : "neutral",
    };
  }

  const percentDelta = Math.round(((current - previous) / previous) * 1000) / 10;
  return {
    previous,
    absoluteDelta,
    percentDelta,
    direction: current > previous ? "up" : current < previous ? "down" : "neutral",
  };
}

function formatLanguageName(code: string | null | undefined): string {
  const clean = (code || "").trim().toLowerCase();
  if (!clean) return "No especificado";
  if (clean === "es" || clean.startsWith("es-")) return "Español (es)";
  if (clean === "en" || clean.startsWith("en-")) return "Inglés (en)";
  if (clean === "kar" || clean === "ksw") return "Karen (kar)";
  return clean;
}

function formatDeviceName(device: string | null | undefined): string {
  const clean = (device || "").trim().toLowerCase();
  if (clean === "mobile") return "Móvil";
  if (clean === "tablet") return "Tablet";
  if (clean === "desktop") return "Escritorio";
  return "Desconocido";
}

export async function fetchAnalyticsIntelligenceReport(
  period: AnalyticsPeriodKey,
  schoolFilter: string = "all",
): Promise<AnalyticsIntelligenceReport> {
  const dateRange = computeAnalyticsDateRange(period);
  const startIso = dateRange.startDate ? dateRange.startDate.toISOString() : null;
  const endIso = dateRange.endDate.toISOString();
  const prevStartIso = dateRange.previousStartDate
    ? dateRange.previousStartDate.toISOString()
    : null;
  const prevEndIso = dateRange.previousEndDate ? dateRange.previousEndDate.toISOString() : null;

  const normalizedSchoolFilter =
    schoolFilter && schoolFilter !== "all" ? schoolFilter.trim() : null;

  // Query current & previous period data with bounded column projections + catalog
  const buildPvQuery = (fromIso: string | null, toIso: string, filterSchool: string | null) => {
    let q = supabase
      .from("dmps_analytics_page_views")
      .select(
        "id, anonymous_id, session_id, path, content_type, content_id, school_id, language, entered_at, duration_seconds",
      )
      .lte("entered_at", toIso)
      .order("entered_at", { ascending: true })
      .limit(10000);
    if (fromIso) q = q.gte("entered_at", fromIso);
    if (filterSchool) q = q.eq("school_id", filterSchool);
    return q;
  };

  const buildSessQuery = (fromIso: string | null, toIso: string) => {
    let q = supabase
      .from("dmps_analytics_sessions")
      .select(
        "id, anonymous_id, started_at, landing_path, exit_path, device_type, browser, operating_system, language, is_pwa, page_views, event_count, duration_seconds",
      )
      .lte("started_at", toIso)
      .order("started_at", { ascending: false })
      .limit(8000);
    if (fromIso) q = q.gte("started_at", fromIso);
    return q;
  };

  const buildEvQuery = (fromIso: string | null, toIso: string, filterSchool: string | null) => {
    let q = supabase
      .from("dmps_analytics_events")
      .select(
        "id, anonymous_id, session_id, event_name, event_category, path, content_type, content_id, school_id, language, created_at",
      )
      .lte("created_at", toIso)
      .order("created_at", { ascending: false })
      .limit(10000);
    if (fromIso) q = q.gte("created_at", fromIso);
    if (filterSchool) q = q.eq("school_id", filterSchool);
    return q;
  };

  const buildSrQuery = (fromIso: string | null, toIso: string) => {
    let q = supabase
      .from("dmps_analytics_searches")
      .select(
        "id, anonymous_id, session_id, query, normalized_query, result_count, language, path, created_at",
      )
      .lte("created_at", toIso)
      .order("created_at", { ascending: false })
      .limit(8000);
    if (fromIso) q = q.gte("created_at", fromIso);
    return q;
  };

  const buildPwaQuery = (fromIso: string | null, toIso: string) => {
    let q = supabase
      .from("dmps_analytics_pwa")
      .select("id, anonymous_id, session_id, event_type, platform, operating_system, created_at")
      .lte("created_at", toIso)
      .order("created_at", { ascending: false })
      .limit(4000);
    if (fromIso) q = q.gte("created_at", fromIso);
    return q;
  };

  const [
    catalog,
    curPvRes,
    curSessRes,
    curEvRes,
    curSrRes,
    curPwaRes,
    prevPvRes,
    prevSessRes,
    prevEvRes,
    prevSrRes,
    prevPwaRes,
  ] = await Promise.all([
    fetchContentCatalogMaps(),
    buildPvQuery(startIso, endIso, normalizedSchoolFilter),
    buildSessQuery(startIso, endIso),
    buildEvQuery(startIso, endIso, normalizedSchoolFilter),
    buildSrQuery(startIso, endIso),
    buildPwaQuery(startIso, endIso),
    prevStartIso && prevEndIso
      ? buildPvQuery(prevStartIso, prevEndIso, normalizedSchoolFilter)
      : Promise.resolve({ data: null, error: null }),
    prevStartIso && prevEndIso
      ? buildSessQuery(prevStartIso, prevEndIso)
      : Promise.resolve({ data: null, error: null }),
    prevStartIso && prevEndIso
      ? buildEvQuery(prevStartIso, prevEndIso, normalizedSchoolFilter)
      : Promise.resolve({ data: null, error: null }),
    prevStartIso && prevEndIso
      ? buildSrQuery(prevStartIso, prevEndIso)
      : Promise.resolve({ data: null, error: null }),
    prevStartIso && prevEndIso
      ? buildPwaQuery(prevStartIso, prevEndIso)
      : Promise.resolve({ data: null, error: null }),
  ]);

  throwIfError(curPvRes.error, "vistas de página (inteligencia)");
  throwIfError(curSessRes.error, "sesiones (inteligencia)");
  throwIfError(curEvRes.error, "eventos (inteligencia)");
  throwIfError(curSrRes.error, "búsquedas (inteligencia)");
  throwIfError(curPwaRes.error, "eventos PWA (inteligencia)");

  const curPv = curPvRes.data ?? [];
  const allCurSess = curSessRes.data ?? [];
  const curEv = curEvRes.data ?? [];
  const curSr = curSrRes.data ?? [];
  const curPwa = curPwaRes.data ?? [];

  const prevPv = prevPvRes.data ?? null;
  const allPrevSess = prevSessRes.data ?? null;
  const prevEv = prevEvRes.data ?? null;
  const prevSr = prevSrRes.data ?? null;
  const prevPwa = prevPwaRes.data ?? null;

  // Scope sessions if school filter is active
  const validCurSessionIds = new Set<string>();
  if (normalizedSchoolFilter) {
    for (const pv of curPv) if (pv.session_id) validCurSessionIds.add(pv.session_id);
    for (const ev of curEv) if (ev.session_id) validCurSessionIds.add(ev.session_id);
  }
  const curSess = normalizedSchoolFilter
    ? allCurSess.filter((s) => validCurSessionIds.has(s.id))
    : allCurSess;

  const validPrevSessionIds = new Set<string>();
  if (normalizedSchoolFilter && prevPv) {
    for (const pv of prevPv) if (pv.session_id) validPrevSessionIds.add(pv.session_id);
    for (const ev of prevEv ?? []) if (ev.session_id) validPrevSessionIds.add(ev.session_id);
  }
  const prevSess =
    allPrevSess === null
      ? null
      : normalizedSchoolFilter
        ? allPrevSess.filter((s) => validPrevSessionIds.has(s.id))
        : allPrevSess;

  // ---------------------------------------------------------------------------
  // 1. CONTENT INTELLIGENCE & CONTENT TRENDS
  // ---------------------------------------------------------------------------
  interface ContentAgg {
    contentType: string;
    contentId: string;
    path: string | null;
    currentViews: number;
    previousViews: number;
    users: Set<string>;
    sessions: Set<string>;
    durations: number[];
  }

  const contentMap = new Map<string, ContentAgg>();
  const ensureContentAgg = (cType: string, cId: string, path: string | null) => {
    const key = `${cType}::${cId}`;
    let b = contentMap.get(key);
    if (!b) {
      b = {
        contentType: cType,
        contentId: cId,
        path,
        currentViews: 0,
        previousViews: 0,
        users: new Set<string>(),
        sessions: new Set<string>(),
        durations: [],
      };
      contentMap.set(key, b);
    }
    return b;
  };

  for (const pv of curPv) {
    const cType = pv.content_type || "page";
    const cId = pv.content_id || pv.path || "/";
    const b = ensureContentAgg(cType, cId, pv.path);
    b.currentViews += 1;
    if (pv.anonymous_id) b.users.add(pv.anonymous_id);
    if (pv.session_id) b.sessions.add(pv.session_id);
    if (typeof pv.duration_seconds === "number" && pv.duration_seconds > 0) {
      b.durations.push(pv.duration_seconds);
    }
  }

  const CONTENT_EVENT_TYPES: Record<string, string> = {
    resource_click: "resource",
    program_click: "programs",
    activity_click: "activities",
    faq_open: "faq",
    announcement_click: "announcements",
    contact_click: "contact",
    external_link_click: "external_link",
    category_click: "category",
    school_select: "schools",
  };

  for (const ev of curEv) {
    const mappedType = CONTENT_EVENT_TYPES[ev.event_name];
    if (!mappedType) continue;
    const cId = ev.content_id || ev.path;
    if (!cId) continue;
    const b = ensureContentAgg(mappedType, cId, ev.path);
    b.currentViews += 1;
    if (ev.anonymous_id) b.users.add(ev.anonymous_id);
    if (ev.session_id) b.sessions.add(ev.session_id);
  }

  if (prevPv) {
    for (const pv of prevPv) {
      const cType = pv.content_type || "page";
      const cId = pv.content_id || pv.path || "/";
      const b = ensureContentAgg(cType, cId, pv.path);
      b.previousViews += 1;
    }
  }
  if (prevEv) {
    for (const ev of prevEv) {
      const mappedType = CONTENT_EVENT_TYPES[ev.event_name];
      if (!mappedType) continue;
      const cId = ev.content_id || ev.path;
      if (!cId) continue;
      const b = ensureContentAgg(mappedType, cId, ev.path);
      b.previousViews += 1;
    }
  }

  const activeViewCounts = Array.from(contentMap.values())
    .map((c) => c.currentViews)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);

  const highThreshold =
    activeViewCounts.length >= 3
      ? (activeViewCounts[Math.floor(activeViewCounts.length * 0.7)] ?? 3)
      : 3;

  const allContentRows: ContentTrendRow[] = Array.from(contentMap.entries()).map(([key, b]) => {
    const resolved = resolveContentEntity(b.contentType, b.contentId, b.path, catalog);
    const delta = computeDeltaFields(
      b.currentViews,
      prevPv !== null ? b.previousViews : null,
      period,
    );
    const avgDurationSeconds =
      b.durations.length > 0
        ? Math.round(b.durations.reduce((acc, v) => acc + v, 0) / b.durations.length)
        : null;

    const activityLevel: "alta" | "media" | "baja" =
      b.currentViews >= highThreshold ? "alta" : b.currentViews <= 1 ? "baja" : "media";

    return {
      key,
      contentId: b.contentId,
      title: resolved.title,
      contentTypeLabel: resolved.typeLabel,
      categoryGroup: resolved.categoryGroup,
      currentViews: b.currentViews,
      previousViews: delta.previous,
      absoluteDelta: delta.absoluteDelta,
      percentDelta: delta.percentDelta,
      direction: delta.direction,
      users: b.users.size,
      sessions: b.sessions.size,
      avgDurationSeconds,
      activityLevel,
      isAvailable: resolved.isAvailable,
    };
  });

  const currentActiveContent = allContentRows
    .filter((r) => r.currentViews > 0)
    .sort((a, b) => b.currentViews - a.currentViews || b.users - a.users);

  const growingContent = allContentRows
    .filter((r) => r.direction === "up" && (r.absoluteDelta ?? 0) > 0)
    .sort(
      (a, b) => (b.absoluteDelta ?? 0) - (a.absoluteDelta ?? 0) || b.currentViews - a.currentViews,
    );

  const decliningContent = allContentRows
    .filter((r) => r.direction === "down" && (r.absoluteDelta ?? 0) < 0)
    .sort((a, b) => (a.absoluteDelta ?? 0) - (b.absoluteDelta ?? 0));

  const highActivityContent = currentActiveContent.filter((r) => r.activityLevel === "alta");
  const lowActivityContent = currentActiveContent
    .filter((r) => r.activityLevel === "baja")
    .sort((a, b) => a.currentViews - b.currentViews);

  // Aggregate by content type
  const typeGroupMap = new Map<
    Exclude<DashboardContentCategory, "all">,
    { label: string; views: number; users: Set<string>; sessions: Set<string> }
  >();

  const CATEGORY_GROUP_LABELS: Record<Exclude<DashboardContentCategory, "all">, string> = {
    pages: "Páginas públicas",
    articles: "Artículos y guías",
    categories: "Categorías temáticas",
    resources: "Recursos oficiales",
    programs: "Programas académicos y estudiantiles",
    activities: "Deportes y actividades",
    faqs: "Preguntas frecuentes (FAQ)",
    announcements: "Avisos oficiales",
    schools: "Escuelas del distrito",
    contacts: "Contactos del directorio BFL",
    external_links: "Enlaces externos",
  };

  for (const pv of curPv) {
    const resolved = resolveContentEntity(pv.content_type, pv.content_id, pv.path, catalog);
    let grp = typeGroupMap.get(resolved.categoryGroup);
    if (!grp) {
      grp = {
        label: CATEGORY_GROUP_LABELS[resolved.categoryGroup],
        views: 0,
        users: new Set<string>(),
        sessions: new Set<string>(),
      };
      typeGroupMap.set(resolved.categoryGroup, grp);
    }
    grp.views += 1;
    if (pv.anonymous_id) grp.users.add(pv.anonymous_id);
    if (pv.session_id) grp.sessions.add(pv.session_id);
  }

  for (const ev of curEv) {
    const mappedType = CONTENT_EVENT_TYPES[ev.event_name];
    if (!mappedType) continue;
    const resolved = resolveContentEntity(mappedType, ev.content_id, ev.path, catalog);
    let grp = typeGroupMap.get(resolved.categoryGroup);
    if (!grp) {
      grp = {
        label: CATEGORY_GROUP_LABELS[resolved.categoryGroup],
        views: 0,
        users: new Set<string>(),
        sessions: new Set<string>(),
      };
      typeGroupMap.set(resolved.categoryGroup, grp);
    }
    grp.views += 1;
    if (ev.anonymous_id) grp.users.add(ev.anonymous_id);
    if (ev.session_id) grp.sessions.add(ev.session_id);
  }

  const totalTypeViews = Array.from(typeGroupMap.values()).reduce((acc, g) => acc + g.views, 0);
  const byContentType: ContentTypeSummaryRow[] = Array.from(typeGroupMap.entries())
    .map(([categoryGroup, g]) => ({
      categoryGroup,
      typeLabel: g.label,
      views: g.views,
      users: g.users.size,
      sessions: g.sessions.size,
      percentageOfViews:
        totalTypeViews > 0 ? Math.round((g.views / totalTypeViews) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.views - a.views);

  const contentSection: ContentIntelligenceSection = {
    topConsulted: currentActiveContent.slice(0, 25),
    growingContent: growingContent.slice(0, 15),
    decliningContent: decliningContent.slice(0, 15),
    highActivityContent: highActivityContent.slice(0, 15),
    lowActivityContent: lowActivityContent.slice(0, 15),
    byContentType,
    confidence: evaluateSampleConfidence(curPv.length),
    hasAnyData: currentActiveContent.length > 0 || decliningContent.length > 0,
  };

  // ---------------------------------------------------------------------------
  // 2. SEARCH INTELLIGENCE & SEARCH OPPORTUNITIES
  // ---------------------------------------------------------------------------
  interface SearchAgg {
    displayTerm: string;
    normalizedTerm: string;
    currentSearches: number;
    previousSearches: number;
    users: Set<string>;
    zeroCount: number;
    totalResults: number;
  }

  const searchMap = new Map<string, SearchAgg>();
  const searchUniqueUsers = new Set<string>();
  let totalZeroResultSearches = 0;
  let totalSearchResultsSum = 0;

  for (const sr of curSr) {
    if (sr.anonymous_id) searchUniqueUsers.add(sr.anonymous_id);
    const rCount = Math.max(0, Number(sr.result_count) || 0);
    totalSearchResultsSum += rCount;
    if (rCount === 0) totalZeroResultSearches += 1;

    const norm = (sr.normalized_query || sr.query || "").trim().toLowerCase();
    if (!norm) continue;
    let b = searchMap.get(norm);
    if (!b) {
      b = {
        displayTerm: sr.query.trim() || norm,
        normalizedTerm: norm,
        currentSearches: 0,
        previousSearches: 0,
        users: new Set<string>(),
        zeroCount: 0,
        totalResults: 0,
      };
      searchMap.set(norm, b);
    }
    b.currentSearches += 1;
    if (sr.anonymous_id) b.users.add(sr.anonymous_id);
    if (rCount === 0) b.zeroCount += 1;
    b.totalResults += rCount;
  }

  if (prevSr) {
    for (const sr of prevSr) {
      const norm = (sr.normalized_query || sr.query || "").trim().toLowerCase();
      if (!norm) continue;
      let b = searchMap.get(norm);
      if (!b) {
        b = {
          displayTerm: sr.query.trim() || norm,
          normalizedTerm: norm,
          currentSearches: 0,
          previousSearches: 0,
          users: new Set<string>(),
          zeroCount: 0,
          totalResults: 0,
        };
        searchMap.set(norm, b);
      }
      b.previousSearches += 1;
    }
  }

  const allSearchTerms: SearchOpportunityRow[] = Array.from(searchMap.values())
    .filter((b) => b.currentSearches > 0)
    .map((b) => {
      const delta = computeDeltaFields(
        b.currentSearches,
        prevSr !== null ? b.previousSearches : null,
        period,
      );
      const zeroRate =
        b.currentSearches > 0 ? Math.round((b.zeroCount / b.currentSearches) * 1000) / 10 : 0;
      const avgRes =
        b.currentSearches > 0 ? Math.round((b.totalResults / b.currentSearches) * 10) / 10 : 0;

      const patterns: string[] = [];
      if (b.zeroCount > 0) patterns.push("Búsquedas sin resultados");
      if (b.currentSearches >= 2) patterns.push("Término repetido");
      if (delta.direction === "up" && (delta.absoluteDelta ?? 0) > 0) {
        patterns.push("Tendencia en aumento");
      }

      const descriptiveParts: string[] = [];
      if (b.zeroCount > 0) {
        descriptiveParts.push(
          `Este término presenta ${b.zeroCount} búsqueda(s) sin resultados (${zeroRate}%).`,
        );
      }
      if (b.currentSearches >= 2) {
        descriptiveParts.push(`Fue consultado ${b.currentSearches} veces en el periodo.`);
      }
      if (delta.direction === "up" && delta.absoluteDelta !== null) {
        descriptiveParts.push(
          `Se observa un aumento de +${delta.absoluteDelta} consulta(s) respecto al periodo anterior.`,
        );
      }

      return {
        term: b.displayTerm,
        normalizedTerm: b.normalizedTerm,
        currentSearches: b.currentSearches,
        previousSearches: delta.previous,
        absoluteDelta: delta.absoluteDelta,
        percentDelta: delta.percentDelta,
        direction: delta.direction,
        users: b.users.size,
        zeroResultsCount: b.zeroCount,
        zeroResultsRatePercent: zeroRate,
        avgResults: avgRes,
        patternsObserved: patterns,
        descriptiveNote:
          descriptiveParts.join(" ") ||
          `Se registraron ${b.currentSearches} búsqueda(s) con un promedio de ${avgRes} resultado(s).`,
      };
    })
    .sort(
      (a, b) => b.currentSearches - a.currentSearches || b.zeroResultsCount - a.zeroResultsCount,
    );

  const growingSearchTerms = allSearchTerms
    .filter((t) => t.direction === "up" && (t.absoluteDelta ?? 0) > 0)
    .sort((a, b) => (b.absoluteDelta ?? 0) - (a.absoluteDelta ?? 0));

  const zeroResultSearchTerms = allSearchTerms
    .filter((t) => t.zeroResultsCount > 0)
    .sort(
      (a, b) => b.zeroResultsCount - a.zeroResultsCount || b.currentSearches - a.currentSearches,
    );

  const searchOpportunities = allSearchTerms.filter(
    (t) => t.zeroResultsCount > 0 || t.currentSearches >= 2 || t.direction === "up",
  );

  const searchesSection: SearchIntelligenceSection = {
    totalSearches: curSr.length,
    previousSearches: prevSr !== null ? prevSr.length : null,
    uniqueUsers: searchUniqueUsers.size,
    uniqueTerms: allSearchTerms.length,
    zeroResultSearches: totalZeroResultSearches,
    zeroResultRatePercent:
      curSr.length > 0 ? Math.round((totalZeroResultSearches / curSr.length) * 1000) / 10 : null,
    avgResults:
      curSr.length > 0 ? Math.round((totalSearchResultsSum / curSr.length) * 10) / 10 : null,
    topSearchedTerms: allSearchTerms.slice(0, 20),
    growingTerms: growingSearchTerms.slice(0, 15),
    zeroResultTerms: zeroResultSearchTerms.slice(0, 15),
    opportunities: searchOpportunities.slice(0, 20),
    confidence: evaluateSampleConfidence(curSr.length),
    hasAnyData: curSr.length > 0,
  };

  // ---------------------------------------------------------------------------
  // 3. SESSION INTELLIGENCE
  // ---------------------------------------------------------------------------
  const sessionIdsWithSearch = new Set<string>();
  for (const sr of curSr) if (sr.session_id) sessionIdsWithSearch.add(sr.session_id);

  const sessionIdsWithEvents = new Set<string>();
  for (const ev of curEv) if (ev.session_id) sessionIdsWithEvents.add(ev.session_id);

  const pvCountBySession = new Map<string, number>();
  for (const pv of curPv) {
    if (!pv.session_id) continue;
    pvCountBySession.set(pv.session_id, (pvCountBySession.get(pv.session_id) || 0) + 1);
  }

  let durationSum = 0;
  let durationCount = 0;
  let pagesSum = 0;
  let singlePageSessions = 0;
  let multiPageSessions = 0;
  let deepNavigationSessions = 0;
  let sessionsWithSearches = 0;
  let sessionsWithEvents = 0;

  for (const s of curSess) {
    if (typeof s.duration_seconds === "number" && s.duration_seconds >= 0) {
      durationSum += s.duration_seconds;
      durationCount += 1;
    }
    const effectivePv = Math.max(Number(s.page_views) || 0, pvCountBySession.get(s.id) || 0);
    pagesSum += effectivePv;
    if (effectivePv <= 1) singlePageSessions += 1;
    if (effectivePv > 1) multiPageSessions += 1;
    if (effectivePv >= 3) deepNavigationSessions += 1;
    if (sessionIdsWithSearch.has(s.id)) sessionsWithSearches += 1;
    if ((Number(s.event_count) || 0) > 0 || sessionIdsWithEvents.has(s.id)) {
      sessionsWithEvents += 1;
    }
  }

  const totalSessCount = curSess.length;
  const sessionsSection: SessionIntelligenceSection = {
    totalSessions: totalSessCount,
    avgDurationSeconds: durationCount > 0 ? Math.round(durationSum / durationCount) : null,
    avgPagesPerSession:
      totalSessCount > 0 ? Math.round((pagesSum / totalSessCount) * 100) / 100 : null,
    singlePageSessions,
    singlePageRatePercent:
      totalSessCount > 0 ? Math.round((singlePageSessions / totalSessCount) * 1000) / 10 : null,
    multiPageSessions,
    multiPageRatePercent:
      totalSessCount > 0 ? Math.round((multiPageSessions / totalSessCount) * 1000) / 10 : null,
    deepNavigationSessions,
    deepNavigationRatePercent:
      totalSessCount > 0 ? Math.round((deepNavigationSessions / totalSessCount) * 1000) / 10 : null,
    sessionsWithSearches,
    sessionsWithEvents,
    confidence: evaluateSampleConfidence(totalSessCount),
    hasAnyData: totalSessCount > 0,
  };

  // ---------------------------------------------------------------------------
  // 4. NAVIGATION INTELLIGENCE & ENTRY / EXIT ANALYSIS
  // ---------------------------------------------------------------------------
  const entryMap = new Map<string, { sessions: number; users: Set<string> }>();
  const exitMap = new Map<string, { sessions: number; users: Set<string> }>();

  for (const s of curSess) {
    const landing = (s.landing_path || "").trim();
    if (landing) {
      let b = entryMap.get(landing);
      if (!b) {
        b = { sessions: 0, users: new Set<string>() };
        entryMap.set(landing, b);
      }
      b.sessions += 1;
      if (s.anonymous_id) b.users.add(s.anonymous_id);
    }

    const exit = (s.exit_path || "").trim();
    if (exit) {
      let b = exitMap.get(exit);
      if (!b) {
        b = { sessions: 0, users: new Set<string>() };
        exitMap.set(exit, b);
      }
      b.sessions += 1;
      if (s.anonymous_id) b.users.add(s.anonymous_id);
    }
  }

  const entryPages: EntryExitIntelligenceRow[] = Array.from(entryMap.entries())
    .map(([path, b]) => ({
      path,
      contentTypeLabel: classifyPathContentTypeLabel(path),
      sessions: b.sessions,
      users: b.users.size,
      percentage: totalSessCount > 0 ? Math.round((b.sessions / totalSessCount) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions || b.users - a.users)
    .slice(0, 15);

  const exitPages: EntryExitIntelligenceRow[] = Array.from(exitMap.entries())
    .map(([path, b]) => ({
      path,
      contentTypeLabel: classifyPathContentTypeLabel(path),
      sessions: b.sessions,
      users: b.users.size,
      percentage: totalSessCount > 0 ? Math.round((b.sessions / totalSessCount) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions || b.users - a.users)
    .slice(0, 15);

  // Ordered sequences per session from page views
  const pvsBySession = new Map<
    string,
    Array<{ path: string; enteredAt: string; anonymousId: string }>
  >();
  for (const pv of curPv) {
    if (!pv.session_id || !pv.path) continue;
    let list = pvsBySession.get(pv.session_id);
    if (!list) {
      list = [];
      pvsBySession.set(pv.session_id, list);
    }
    list.push({
      path: pv.path,
      enteredAt: pv.entered_at,
      anonymousId: pv.anonymous_id,
    });
  }

  const transitionsMap = new Map<
    string,
    { fromPath: string; toPath: string; count: number; sessions: Set<string>; users: Set<string> }
  >();
  const afterEntryMap = new Map<
    string,
    { fromPath: string; toPath: string; count: number; sessions: Set<string>; users: Set<string> }
  >();
  const beforeExitMap = new Map<
    string,
    { fromPath: string; toPath: string; count: number; sessions: Set<string>; users: Set<string> }
  >();

  const recordSeq = (
    targetMap: typeof transitionsMap,
    fromPath: string,
    toPath: string,
    sessId: string,
    anonId: string,
  ) => {
    const key = `${fromPath} -> ${toPath}`;
    let b = targetMap.get(key);
    if (!b) {
      b = {
        fromPath,
        toPath,
        count: 0,
        sessions: new Set<string>(),
        users: new Set<string>(),
      };
      targetMap.set(key, b);
    }
    b.count += 1;
    b.sessions.add(sessId);
    if (anonId) b.users.add(anonId);
  };

  for (const [sessId, views] of pvsBySession.entries()) {
    if (views.length < 2) continue;
    views.sort((a, b) => a.enteredAt.localeCompare(b.enteredAt));

    for (let i = 1; i < views.length; i += 1) {
      const prev = views[i - 1]!;
      const curr = views[i]!;
      if (prev.path === curr.path) continue;

      recordSeq(transitionsMap, prev.path, curr.path, sessId, curr.anonymousId);
      if (i === 1) {
        recordSeq(afterEntryMap, prev.path, curr.path, sessId, curr.anonymousId);
      }
      if (i === views.length - 1) {
        recordSeq(beforeExitMap, prev.path, curr.path, sessId, curr.anonymousId);
      }
    }
  }

  const toSequenceRows = (map: typeof transitionsMap): NavigationSequenceRow[] =>
    Array.from(map.values())
      .map((b) => ({
        fromPath: b.fromPath,
        toPath: b.toPath,
        transitions: b.count,
        sessions: b.sessions.size,
        users: b.users.size,
      }))
      .sort((a, b) => b.transitions - a.transitions || b.sessions - a.sessions)
      .slice(0, 15);

  const frequentTransitions = toSequenceRows(transitionsMap);
  const visitedAfterEntry = toSequenceRows(afterEntryMap);
  const visitedBeforeExit = toSequenceRows(beforeExitMap);

  const navigationSection: NavigationIntelligenceSection = {
    entryPages,
    exitPages,
    frequentTransitions,
    visitedAfterEntry,
    visitedBeforeExit,
    confidence: evaluateSampleConfidence(curPv.length),
    hasAnyData: entryPages.length > 0 || exitPages.length > 0 || frequentTransitions.length > 0,
  };

  // ---------------------------------------------------------------------------
  // 5. TREND INTELLIGENCE
  // ---------------------------------------------------------------------------
  const curUniqueUsers = new Set<string>();
  for (const s of curSess) if (s.anonymous_id) curUniqueUsers.add(s.anonymous_id);
  for (const pv of curPv) if (pv.anonymous_id) curUniqueUsers.add(pv.anonymous_id);

  const prevUniqueUsers = prevSess !== null || prevPv !== null ? new Set<string>() : null;
  if (prevUniqueUsers) {
    for (const s of prevSess ?? []) if (s.anonymous_id) prevUniqueUsers.add(s.anonymous_id);
    for (const pv of prevPv ?? []) if (pv.anonymous_id) prevUniqueUsers.add(pv.anonymous_id);
  }

  const buildTrendItem = (
    key: string,
    label: string,
    currVal: number,
    prevVal: number | null,
    sourceTable: string,
  ): MetricTrendItem => {
    const metric = buildComparisonMetric(currVal, prevVal, period);
    let stabilityState: MetricTrendItem["stabilityState"] = "sin_comparacion";
    let descriptiveSummary = `Durante este periodo se registraron ${currVal} ${label.toLowerCase()}.`;

    if (metric.hasComparison && metric.direction !== "insufficient") {
      const absPct = Math.abs(metric.deltaPercent ?? 0);
      if (metric.direction === "neutral" || absPct < 5) {
        stabilityState = "estabilidad";
        descriptiveSummary = `Se observa estabilidad en ${label.toLowerCase()} (${currVal} en el periodo actual vs. ${metric.previous ?? 0} en el periodo anterior).`;
      } else if (absPct >= 100 && currVal >= 5) {
        stabilityState = "actividad_inusual";
        descriptiveSummary = `Se observa una variación pronunciada (${
          metric.deltaPercent !== null
            ? `${metric.deltaPercent > 0 ? "+" : ""}${metric.deltaPercent}%`
            : "cambio significativo"
        }) en ${label.toLowerCase()} (${currVal} actual vs. ${metric.previous ?? 0} anterior).`;
      } else if (metric.direction === "up") {
        stabilityState = "aumento";
        descriptiveSummary = `Se observa un aumento en ${label.toLowerCase()} (${currVal} actual vs. ${metric.previous ?? 0} en el periodo anterior${
          metric.deltaPercent !== null ? `, +${metric.deltaPercent}%` : ""
        }).`;
      } else if (metric.direction === "down") {
        stabilityState = "disminución";
        descriptiveSummary = `Se observa una disminución en ${label.toLowerCase()} (${currVal} actual vs. ${metric.previous ?? 0} en el periodo anterior${
          metric.deltaPercent !== null ? `, ${metric.deltaPercent}%` : ""
        }).`;
      }
    }

    return {
      key,
      label,
      metric,
      stabilityState,
      descriptiveSummary,
      dataSource: sourceTable,
    };
  };

  const trendItems: MetricTrendItem[] = [
    buildTrendItem(
      "page_views",
      "Vistas de página",
      curPv.length,
      prevPv !== null ? prevPv.length : null,
      "dmps_analytics_page_views",
    ),
    buildTrendItem(
      "users",
      "Usuarios anónimos únicos",
      curUniqueUsers.size,
      prevUniqueUsers !== null ? prevUniqueUsers.size : null,
      "dmps_analytics_sessions / page_views",
    ),
    buildTrendItem(
      "sessions",
      "Sesiones",
      curSess.length,
      prevSess !== null ? prevSess.length : null,
      "dmps_analytics_sessions",
    ),
    buildTrendItem(
      "searches",
      "Búsquedas",
      curSr.length,
      prevSr !== null ? prevSr.length : null,
      "dmps_analytics_searches",
    ),
    buildTrendItem(
      "events",
      "Eventos de interacción",
      curEv.length,
      prevEv !== null ? prevEv.length : null,
      "dmps_analytics_events",
    ),
    buildTrendItem(
      "pwa",
      "Actividad PWA",
      curPwa.length,
      prevPwa !== null ? prevPwa.length : null,
      "dmps_analytics_pwa",
    ),
  ];

  const trendsSection: TrendIntelligenceSection = {
    items: trendItems,
    confidence: evaluateSampleConfidence(curPv.length + curSess.length),
    hasAnyData:
      curPv.length > 0 ||
      curSess.length > 0 ||
      curSr.length > 0 ||
      curEv.length > 0 ||
      curPwa.length > 0,
  };

  // ---------------------------------------------------------------------------
  // 6. SEGMENTATION INTELLIGENCE
  // ---------------------------------------------------------------------------
  const buildSegments = (
    segmentType: SegmentIntelligenceRow["segmentType"],
    extractor: (s: (typeof curSess)[number]) => string,
  ): SegmentIntelligenceRow[] => {
    const map = new Map<
      string,
      { users: Set<string>; sessions: number; pagesSum: number; durations: number[] }
    >();

    for (const s of curSess) {
      const val = extractor(s);
      let b = map.get(val);
      if (!b) {
        b = { users: new Set<string>(), sessions: 0, pagesSum: 0, durations: [] };
        map.set(val, b);
      }
      if (s.anonymous_id) b.users.add(s.anonymous_id);
      b.sessions += 1;
      b.pagesSum += Math.max(Number(s.page_views) || 0, pvCountBySession.get(s.id) || 0);
      if (typeof s.duration_seconds === "number" && s.duration_seconds >= 0) {
        b.durations.push(s.duration_seconds);
      }
    }

    return Array.from(map.entries())
      .map(([segmentValue, b]) => ({
        segmentType,
        segmentValue,
        users: b.users.size,
        sessions: b.sessions,
        sharePercent:
          totalSessCount > 0 ? Math.round((b.sessions / totalSessCount) * 1000) / 10 : 0,
        avgPagesPerSession:
          b.sessions > 0 ? Math.round((b.pagesSum / b.sessions) * 100) / 100 : null,
        avgDurationSeconds:
          b.durations.length > 0
            ? Math.round(b.durations.reduce((acc, v) => acc + v, 0) / b.durations.length)
            : null,
      }))
      .sort((a, b) => b.sessions - a.sessions || b.users - a.users);
  };

  // School segmentation & School Intelligence
  const uniqueCatalogSchools = new Map<
    string,
    { id: string; name: string; shortName: string | null }
  >();
  for (const s of catalog.schools.values()) {
    uniqueCatalogSchools.set(s.id, s);
  }

  const schoolIntelMap = new Map<
    string,
    {
      schoolId: string;
      schoolName: string;
      shortName: string | null;
      pageViews: number;
      users: Set<string>;
      sessions: Set<string>;
      selections: number;
      contentCounts: Map<
        string,
        { contentId: string; title: string; contentTypeLabel: string; views: number }
      >;
    }
  >();

  for (const s of uniqueCatalogSchools.values()) {
    schoolIntelMap.set(s.id, {
      schoolId: s.id,
      schoolName: s.name,
      shortName: s.shortName,
      pageViews: 0,
      users: new Set<string>(),
      sessions: new Set<string>(),
      selections: 0,
      contentCounts: new Map(),
    });
  }

  for (const pv of curPv) {
    if (!pv.school_id) continue;
    const matched = catalog.schools.get(pv.school_id.trim().toLowerCase());
    if (!matched) continue;
    const bucket = schoolIntelMap.get(matched.id);
    if (!bucket) continue;

    bucket.pageViews += 1;
    if (pv.anonymous_id) bucket.users.add(pv.anonymous_id);
    if (pv.session_id) bucket.sessions.add(pv.session_id);

    const resolved = resolveContentEntity(pv.content_type, pv.content_id, pv.path, catalog);
    const cId = pv.content_id || pv.path || "/";
    const cKey = `${resolved.typeLabel}::${cId}`;
    const existingContent = bucket.contentCounts.get(cKey);
    if (existingContent) {
      existingContent.views += 1;
    } else {
      bucket.contentCounts.set(cKey, {
        contentId: cId,
        title: resolved.title,
        contentTypeLabel: resolved.typeLabel,
        views: 1,
      });
    }
  }

  for (const ev of curEv) {
    const rawKey = ev.school_id || (ev.event_name === "school_select" ? ev.content_id : null);
    if (!rawKey) continue;
    const matched = catalog.schools.get(rawKey.trim().toLowerCase());
    if (!matched) continue;
    const bucket = schoolIntelMap.get(matched.id);
    if (!bucket) continue;

    if (ev.anonymous_id) bucket.users.add(ev.anonymous_id);
    if (ev.session_id) bucket.sessions.add(ev.session_id);
    if (ev.event_name === "school_select") {
      bucket.selections += 1;
    }
  }

  const schoolRows: SchoolContentConsultationRow[] = Array.from(schoolIntelMap.values())
    .map((b) => {
      const topConsultedContent = Array.from(b.contentCounts.values())
        .sort((x, y) => y.views - x.views)
        .slice(0, 5);
      const hasActivity = b.pageViews > 0 || b.selections > 0 || b.sessions.size > 0;
      return {
        schoolId: b.schoolId,
        schoolName: b.schoolName,
        shortName: b.shortName,
        pageViews: b.pageViews,
        users: b.users.size,
        sessions: b.sessions.size,
        selections: b.selections,
        topConsultedContent,
        hasActivity,
      };
    })
    .sort((a, b) => b.pageViews - a.pageViews || b.users - a.users);

  const totalSchoolSessions = schoolRows.reduce((acc, s) => acc + s.sessions, 0);
  const schoolSegmentRows: SegmentIntelligenceRow[] = schoolRows
    .filter((s) => s.hasActivity)
    .map((s) => ({
      segmentType: "escuela",
      segmentValue: s.schoolName,
      users: s.users,
      sessions: s.sessions,
      sharePercent:
        totalSchoolSessions > 0 ? Math.round((s.sessions / totalSchoolSessions) * 1000) / 10 : 0,
      avgPagesPerSession:
        s.sessions > 0 ? Math.round((s.pageViews / s.sessions) * 100) / 100 : null,
      avgDurationSeconds: null,
    }));

  const segmentationSection: SegmentationIntelligenceSection = {
    languages: buildSegments("idioma", (s) => formatLanguageName(s.language)),
    devices: buildSegments("dispositivo", (s) => formatDeviceName(s.device_type)),
    browsers: buildSegments("navegador", (s) => (s.browser || "").trim() || "Desconocido"),
    operatingSystems: buildSegments(
      "sistema_operativo",
      (s) => (s.operating_system || "").trim() || "Desconocido",
    ),
    schools: schoolSegmentRows,
    confidence: evaluateSampleConfidence(curSess.length),
    hasAnyData: curSess.length > 0 || schoolSegmentRows.length > 0,
  };

  const schoolsSection: SchoolIntelligenceSection = {
    schools: schoolRows,
    confidence: evaluateSampleConfidence(
      schoolRows.reduce((acc, s) => acc + s.pageViews + s.selections, 0),
    ),
    hasAnyData: schoolRows.some((s) => s.hasActivity),
  };

  // ---------------------------------------------------------------------------
  // 7. PWA INTELLIGENCE
  // ---------------------------------------------------------------------------
  const curLaunches = curPwa.filter((p) => p.event_type === "pwa_launch").length;
  const curPrompts = curPwa.filter((p) => p.event_type === "pwa_prompt_shown").length;
  const curInstalls = curPwa.filter((p) => p.event_type === "pwa_install").length;

  const prevLaunches =
    prevPwa !== null ? prevPwa.filter((p) => p.event_type === "pwa_launch").length : null;
  const prevPrompts =
    prevPwa !== null ? prevPwa.filter((p) => p.event_type === "pwa_prompt_shown").length : null;
  const prevInstalls =
    prevPwa !== null ? prevPwa.filter((p) => p.event_type === "pwa_install").length : null;

  const installRatePercent =
    curPrompts > 0 ? Math.round((curInstalls / curPrompts) * 1000) / 10 : null;
  const previousInstallRatePercent =
    prevPrompts !== null && prevPrompts > 0 && prevInstalls !== null
      ? Math.round((prevInstalls / prevPrompts) * 1000) / 10
      : null;

  const pwaHasData = curLaunches > 0 || curPrompts > 0 || curInstalls > 0;
  const pwaSection: PwaIntelligenceSection = {
    launches: buildComparisonMetric(curLaunches, prevLaunches, period),
    promptsShown: buildComparisonMetric(curPrompts, prevPrompts, period),
    installs: buildComparisonMetric(curInstalls, prevInstalls, period),
    installRatePercent,
    previousInstallRatePercent,
    descriptiveSummary: pwaHasData
      ? `Durante este periodo se registraron ${curLaunches} lanzamiento(s), ${curPrompts} aviso(s) de instalación y ${curInstalls} instalación(es)${
          installRatePercent !== null
            ? ` (tasa de conversión sobre prompt de ${installRatePercent}%)`
            : ""
        }.`
      : "Datos insuficientes para este análisis.",
    confidence: evaluateSampleConfidence(curPwa.length),
    hasAnyData: pwaHasData,
  };

  // ---------------------------------------------------------------------------
  // 8. AUTOMATIC DETERMINISTIC & EXPLAINABLE INSIGHTS
  // ---------------------------------------------------------------------------
  const insights: ExplainableInsight[] = [];

  // Insight 1: Top consulted content
  if (currentActiveContent.length > 0) {
    const topContent = currentActiveContent[0]!;
    insights.push({
      id: "insight-top-content",
      category: "contenido",
      title: "Contenido con mayor volumen de consultas",
      observation: `Durante ${dateRange.label.toLowerCase()} se registraron ${topContent.currentViews} vista(s) para "${topContent.title}" (${topContent.contentTypeLabel}).`,
      metricName: "Vistas de contenido",
      currentValue: `${topContent.currentViews} vistas (${topContent.users} usuarios)`,
      previousValue:
        topContent.previousViews !== null ? `${topContent.previousViews} vistas` : null,
      deltaLabel:
        topContent.percentDelta !== null
          ? `${topContent.percentDelta > 0 ? "+" : ""}${topContent.percentDelta}%`
          : topContent.absoluteDelta !== null
            ? `${topContent.absoluteDelta > 0 ? "+" : ""}${topContent.absoluteDelta} vistas`
            : null,
      periodLabel: dateRange.label,
      dataSource: "dmps_analytics_page_views + dmps_analytics_events",
      confidence: evaluateSampleConfidence(topContent.currentViews),
    });
  }

  // Insight 2: Content with highest positive growth
  if (growingContent.length > 0) {
    const fastest = growingContent[0]!;
    insights.push({
      id: "insight-growing-content",
      category: "tendencias",
      title: "Variación positiva en consultas de contenido",
      observation: `Las consultas de "${fastest.title}" presentaron un aumento de +${fastest.absoluteDelta} vista(s)${
        fastest.percentDelta !== null ? ` (+${fastest.percentDelta}%)` : ""
      } respecto al periodo equivalente anterior.`,
      metricName: "Cambio en vistas",
      currentValue: `${fastest.currentViews} vistas`,
      previousValue: `${fastest.previousViews ?? 0} vistas`,
      deltaLabel:
        fastest.percentDelta !== null
          ? `+${fastest.percentDelta}%`
          : `+${fastest.absoluteDelta} vistas`,
      periodLabel: dateRange.label,
      dataSource: "dmps_analytics_page_views",
      confidence: evaluateSampleConfidence(fastest.currentViews),
    });
  }

  // Insight 3: Search terms without results
  if (zeroResultSearchTerms.length > 0) {
    const topZero = zeroResultSearchTerms[0]!;
    insights.push({
      id: "insight-search-zero-results",
      category: "busquedas",
      title: "Término con búsquedas sin resultados registradas",
      observation: `El término "${topZero.term}" presenta ${topZero.zeroResultsCount} búsqueda(s) sin resultados (${topZero.zeroResultsRatePercent}% de sus ${topZero.currentSearches} consultas).`,
      metricName: "Búsquedas sin resultados",
      currentValue: `${topZero.zeroResultsCount} sin resultados de ${topZero.currentSearches} búsquedas`,
      previousValue:
        topZero.previousSearches !== null ? `${topZero.previousSearches} búsquedas previas` : null,
      deltaLabel:
        topZero.percentDelta !== null
          ? `${topZero.percentDelta > 0 ? "+" : ""}${topZero.percentDelta}%`
          : null,
      periodLabel: dateRange.label,
      dataSource: "dmps_analytics_searches",
      confidence: evaluateSampleConfidence(topZero.currentSearches),
    });
  }

  // Insight 4: Dominant audience language segment
  if (segmentationSection.languages.length > 0) {
    const topLang = segmentationSection.languages[0]!;
    insights.push({
      id: "insight-segment-language",
      category: "segmentos",
      title: "Participación por segmento de idioma",
      observation: `El segmento "${topLang.segmentValue}" concentra ${topLang.sessions} sesión(es) (${topLang.sharePercent}% del total del periodo) y ${topLang.users} usuario(s) anónimo(s).`,
      metricName: "Participación de sesiones por idioma",
      currentValue: `${topLang.sharePercent}% (${topLang.sessions} sesiones)`,
      previousValue: null,
      deltaLabel: null,
      periodLabel: dateRange.label,
      dataSource: "dmps_analytics_sessions",
      confidence: evaluateSampleConfidence(topLang.sessions),
    });
  }

  // Insight 5: Session depth summary
  if (sessionsSection.totalSessions > 0 && sessionsSection.avgPagesPerSession !== null) {
    insights.push({
      id: "insight-session-depth",
      category: "sesiones",
      title: "Profundidad de navegación por sesión",
      observation: `Durante el periodo se registró un promedio de ${sessionsSection.avgPagesPerSession} página(s) por sesión, con ${sessionsSection.multiPageSessions} sesión(es) de múltiples páginas (${sessionsSection.multiPageRatePercent ?? 0}%).`,
      metricName: "Páginas por sesión",
      currentValue: `${sessionsSection.avgPagesPerSession} páginas/sesión`,
      previousValue: null,
      deltaLabel: null,
      periodLabel: dateRange.label,
      dataSource: "dmps_analytics_sessions + dmps_analytics_page_views",
      confidence: sessionsSection.confidence,
    });
  }

  // Insight 6: Primary entry point
  if (entryPages.length > 0) {
    const topEntry = entryPages[0]!;
    insights.push({
      id: "insight-navigation-entry",
      category: "navegacion",
      title: "Página de entrada más frecuente",
      observation: `La ruta "${topEntry.path}" (${topEntry.contentTypeLabel}) registró ${topEntry.sessions} inicio(s) de sesión (${topEntry.percentage}% de las entradas).`,
      metricName: "Sesiones iniciadas por landing_path",
      currentValue: `${topEntry.sessions} sesiones (${topEntry.percentage}%)`,
      previousValue: null,
      deltaLabel: null,
      periodLabel: dateRange.label,
      dataSource: "dmps_analytics_sessions.landing_path",
      confidence: evaluateSampleConfidence(topEntry.sessions),
    });
  }

  const totalDataPoints =
    curPv.length + curSess.length + curEv.length + curSr.length + curPwa.length;

  return {
    period,
    dateRange,
    schoolFilter,
    content: contentSection,
    searches: searchesSection,
    sessions: sessionsSection,
    navigation: navigationSection,
    trends: trendsSection,
    segmentation: segmentationSection,
    schools: schoolsSection,
    pwa: pwaSection,
    insights,
    overallConfidence: evaluateSampleConfidence(totalDataPoints),
    hasAnyData: totalDataPoints > 0,
  };
}
