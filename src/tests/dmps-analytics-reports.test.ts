import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ANALYTICS_REPORT_DEFINITIONS,
  buildReportCsv,
  downloadReportCsv,
  escapeCsvCell,
  formatSectionToCsv,
  generateAnalyticsReport,
  type AnalyticsReportType,
} from "@/analytics";
import * as supabaseClientModule from "@/integrations/supabase/client";

type MockTableMap = Record<string, { data: unknown[] | null; error: { message: string } | null }>;

function createSupabaseFromMock(tables: MockTableMap) {
  return vi.fn().mockImplementation((tableName: string) => {
    const entry = tables[tableName] ?? { data: [], error: null };
    const builder = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: Array.isArray(entry.data) ? (entry.data[0] ?? null) : null,
        error: entry.error,
      }),
      then: (resolve: (val: unknown) => void) => {
        resolve({ data: entry.data, error: entry.error });
      },
    };
    return builder;
  });
}

describe("Stage 5 — DMPS INFO Analytics Reporting & Exports", () => {
  let originalFrom: unknown;

  beforeEach(() => {
    originalFrom = (supabaseClientModule.supabase as unknown as { from?: unknown }).from;
  });

  afterEach(() => {
    if (originalFrom !== undefined) {
      (supabaseClientModule.supabase as unknown as { from: unknown }).from = originalFrom;
    }
    vi.restoreAllMocks();
  });

  it("1. escapeCsvCell escapes quotes, commas, and newlines correctly", () => {
    expect(escapeCsvCell("Simple")).toBe("Simple");
    expect(escapeCsvCell("With, comma")).toBe('"With, comma"');
    expect(escapeCsvCell('With "quotes"')).toBe('"With ""quotes"""');
    expect(escapeCsvCell("Line\nBreak")).toBe('"Line\nBreak"');
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
    expect(escapeCsvCell(1234)).toBe("1234");
  });

  it("2. formatSectionToCsv formats headers, descriptions, and data lines", () => {
    const section = {
      id: "test_sec",
      title: "Sección de Prueba",
      description: "Descripción de la tabla",
      columns: [
        { key: "col1", header: "Columna 1" },
        { key: "col2", header: "Columna 2", align: "right" as const },
      ],
      rows: [
        { col1: "Fila 1, con coma", col2: 100 },
        { col1: 'Fila 2 "con comillas"', col2: 250 },
      ],
    };

    const csv = formatSectionToCsv(section);
    expect(csv).toContain("Sección de Prueba");
    expect(csv).toContain("Descripción de la tabla");
    expect(csv).toContain("Columna 1,Columna 2");
    expect(csv).toContain('"Fila 1, con coma",100');
    expect(csv).toContain('"Fila 2 ""con comillas""",250');
  });

  it("3. generateAnalyticsReport generates all 9 report types from real Supabase queries", async () => {
    const nowIso = new Date().toISOString();
    const earlierIso = new Date(Date.now() - 60_000).toISOString();

    const fromMock = createSupabaseFromMock({
      schools: {
        data: [
          {
            id: "lincoln",
            slug: "lincoln",
            name: "Abraham Lincoln High School",
            short_name: "Lincoln",
          },
        ],
        error: null,
      },
      articles: {
        data: [{ id: "art-1", slug: "inscripcion-2026", title: "Guía de Inscripción 2026" }],
        error: null,
      },
      dmps_analytics_page_views: {
        data: [
          {
            id: "pv-1",
            anonymous_id: "anon-secret-1",
            session_id: "sess-secret-1",
            path: "/articles/inscripcion-2026",
            title: "Inscripción",
            content_type: "article",
            content_id: "inscripcion-2026",
            school_id: "lincoln",
            language: "es",
            entered_at: earlierIso,
            duration_seconds: 45,
          },
        ],
        error: null,
      },
      dmps_analytics_sessions: {
        data: [
          {
            id: "sess-secret-1",
            anonymous_id: "anon-secret-1",
            started_at: earlierIso,
            landing_path: "/",
            exit_path: "/articles/inscripcion-2026",
            device_type: "mobile",
            browser: "Safari",
            operating_system: "iOS",
            language: "es",
            is_pwa: false,
            page_views: 2,
            event_count: 1,
            duration_seconds: 90,
          },
        ],
        error: null,
      },
      dmps_analytics_searches: {
        data: [
          {
            id: "sr-1",
            anonymous_id: "anon-secret-1",
            session_id: "sess-secret-1",
            query: "transporte escolar",
            normalized_query: "transporte escolar",
            result_count: 3,
            language: "es",
            path: "/search",
            created_at: nowIso,
          },
        ],
        error: null,
      },
      dmps_analytics_pwa: {
        data: [
          {
            id: "pwa-1",
            anonymous_id: "anon-secret-1",
            session_id: "sess-secret-1",
            event_type: "pwa_install",
            platform: "ios",
            operating_system: "iOS",
            created_at: nowIso,
          },
        ],
        error: null,
      },
    });

    (supabaseClientModule.supabase as unknown as { from: unknown }).from = fromMock;

    const reportTypes: AnalyticsReportType[] = [
      "executive",
      "traffic",
      "content",
      "searches",
      "schools",
      "navigation",
      "pwa",
      "intelligence",
      "full_dataset",
    ];

    for (const repType of reportTypes) {
      const rep = await generateAnalyticsReport(repType, "30d", "lincoln", "Lincoln High School");

      expect(rep.metadata.reportId).toBe(repType);
      expect(rep.metadata.period).toBe("30d");
      expect(rep.metadata.dataSource).toBe("DMPS INFO Analytics (Supabase PostgreSQL)");
      expect(rep.managementSummary.length).toBeGreaterThan(10);
      expect(rep.tables.length).toBeGreaterThan(0);
      expect(rep.hasAnyData).toBe(true);

      // Verify privacy: CSV and tables must NEVER contain anonymous_id or session_id
      const csv = buildReportCsv(rep);
      expect(csv).not.toContain("anon-secret-1");
      expect(csv).not.toContain("sess-secret-1");
      expect(csv).toContain("DMPS INFO — REPORTE DE ANALÍTICA ADMINISTRATIVA");
      expect(csv).toContain("RESUMEN GENERAL");
    }
  });

  it("4. handles empty data and insufficient data without inventing values or throwing", async () => {
    const fromMock = createSupabaseFromMock({
      schools: { data: [], error: null },
      dmps_analytics_page_views: { data: [], error: null },
      dmps_analytics_sessions: { data: [], error: null },
      dmps_analytics_searches: { data: [], error: null },
      dmps_analytics_pwa: { data: [], error: null },
      dmps_analytics_events: { data: [], error: null },
    });

    (supabaseClientModule.supabase as unknown as { from: unknown }).from = fromMock;

    const rep = await generateAnalyticsReport("executive", "24h", "all", "Todas las escuelas");
    expect(rep.hasAnyData).toBe(false);
    expect(rep.insufficientDataNote).toContain("No se encontraron suficientes observaciones");
    expect(rep.managementSummary).toContain("cero eventos de analítica");

    // CSV can still be generated for empty datasets with clean notes
    const csv = buildReportCsv(rep);
    expect(csv).toContain("No hay registros");
    expect(csv).not.toContain("NaN");
    expect(csv).not.toContain("Infinity");
  });

  it("5. downloadReportCsv creates clean blob download and produces expected filename", () => {
    const mockReport = {
      metadata: {
        reportId: "executive" as const,
        reportTitle: "Resumen Ejecutivo de Analítica",
        generatedAtIso: new Date().toISOString(),
        generatedAtFormatted: "10/02/2026, 12:00 PM",
        period: "7d" as const,
        periodLabel: "Últimos 7 días",
        startDateIso: null,
        endDateIso: new Date().toISOString(),
        schoolFilter: "all",
        schoolFilterLabel: "Todas las escuelas",
        dataSource: "DMPS INFO Analytics (Supabase PostgreSQL)" as const,
        isSchoolFilterApplied: false,
        isComparisonSupported: true,
        confidence: "sufficient" as const,
      },
      managementSummary: "Resumen fáctico de prueba.",
      keyMetrics: [
        { id: "m1", label: "Vistas", value: "150", previousValue: "100", changeLabel: "+50%" },
      ],
      tables: [
        {
          id: "t1",
          title: "Tabla de Prueba",
          columns: [{ key: "name", header: "Nombre" }],
          rows: [{ name: "Elemento A" }],
        },
      ],
      hasAnyData: true,
    };

    const fileName = downloadReportCsv(mockReport);
    expect(fileName).toMatch(/^dmps-info-analytics-executive-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("6. ANALYTICS_REPORT_DEFINITIONS contains exactly the 9 required report types", () => {
    const ids = ANALYTICS_REPORT_DEFINITIONS.map((d) => d.id);
    expect(ids).toContain("executive");
    expect(ids).toContain("traffic");
    expect(ids).toContain("content");
    expect(ids).toContain("searches");
    expect(ids).toContain("schools");
    expect(ids).toContain("navigation");
    expect(ids).toContain("pwa");
    expect(ids).toContain("intelligence");
    expect(ids).toContain("full_dataset");
    expect(ids.length).toBe(9);
  });
});
