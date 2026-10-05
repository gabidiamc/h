import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  evaluateSampleConfidence,
  fetchAnalyticsIntelligenceReport,
} from "@/analytics/intelligence-queries";
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

describe("Stage 4 — DMPS INFO Analytics Intelligence", () => {
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

  it("1. evaluateSampleConfidence clasifica muestras insuficientes, limitadas y suficientes", () => {
    expect(evaluateSampleConfidence(0)).toBe("insufficient");
    expect(evaluateSampleConfidence(1)).toBe("limited");
    expect(evaluateSampleConfidence(4)).toBe("limited");
    expect(evaluateSampleConfidence(5)).toBe("sufficient");
    expect(evaluateSampleConfidence(25)).toBe("sufficient");
  });

  it("2. fetchAnalyticsIntelligenceReport genera inteligencia de contenido, búsquedas, sesiones, navegación, tendencias, segmentos, escuelas, PWA e insights explicables con datos reales de Supabase", async () => {
    const nowIso = new Date().toISOString();
    const earlierIso = new Date(Date.now() - 60_000).toISOString();
    const latestIso = new Date(Date.now() - 10_000).toISOString();

    const fromMock = createSupabaseFromMock({
      schools: {
        data: [
          {
            id: "lincoln",
            slug: "lincoln",
            name: "Abraham Lincoln High School",
            short_name: "Lincoln High",
          },
          {
            id: "east",
            slug: "east",
            name: "Des Moines East High School",
            short_name: "East High",
          },
        ],
        error: null,
      },
      articles: {
        data: [{ id: "art-1", slug: "inscripcion-2026", title: "Guía de Inscripción 2026" }],
        error: null,
      },
      categories: {
        data: [{ id: "cat-1", slug: "transporte", name: "Transporte Escolar" }],
        error: null,
      },
      resources: {
        data: [{ id: "res-infinite-campus", url: "https://dmps.infinitecampus.org" }],
        error: null,
      },
      resource_translations: {
        data: [
          {
            resource_id: "res-infinite-campus",
            language_code: "es",
            title: "Portal Infinite Campus",
          },
        ],
        error: null,
      },
      activities: {
        data: [{ id: "act-cross-country", name: "Cross Country (Atletismo)" }],
        error: null,
      },
      contacts: {
        data: [
          {
            id: "cnt-bfl-1",
            person_name: "María López",
            role_title: "Especialista BFL",
            job_title: null,
            department: "Apoyo Familiar BFL",
          },
        ],
        error: null,
      },
      dmps_analytics_page_views: {
        data: [
          {
            id: "pv-1",
            anonymous_id: "anon-1",
            session_id: "sess-1",
            path: "/",
            content_type: "page",
            content_id: "home",
            school_id: "lincoln",
            language: "es",
            entered_at: earlierIso,
            duration_seconds: 30,
          },
          {
            id: "pv-2",
            anonymous_id: "anon-1",
            session_id: "sess-1",
            path: "/articles/inscripcion-2026",
            content_type: "article",
            content_id: "inscripcion-2026",
            school_id: "lincoln",
            language: "es",
            entered_at: latestIso,
            duration_seconds: 90,
          },
          {
            id: "pv-3",
            anonymous_id: "anon-2",
            session_id: "sess-2",
            path: "/articles/deleted-slug",
            content_type: "article",
            content_id: "deleted-slug",
            school_id: "lincoln",
            language: "en",
            entered_at: nowIso,
            duration_seconds: 20,
          },
          {
            id: "pv-res",
            anonymous_id: "anon-1",
            session_id: "sess-1",
            path: "/resources/res-infinite-campus",
            content_type: "resource",
            content_id: "res-infinite-campus",
            school_id: "lincoln",
            language: "es",
            entered_at: nowIso,
            duration_seconds: 25,
          },
          {
            id: "pv-act",
            anonymous_id: "anon-1",
            session_id: "sess-1",
            path: "/deportes-actividades",
            content_type: "activities",
            content_id: "act-cross-country",
            school_id: "lincoln",
            language: "es",
            entered_at: nowIso,
            duration_seconds: 35,
          },
          {
            id: "pv-cnt",
            anonymous_id: "anon-1",
            session_id: "sess-1",
            path: "/contact",
            content_type: "contact",
            content_id: "cnt-bfl-1",
            school_id: "lincoln",
            language: "es",
            entered_at: nowIso,
            duration_seconds: 15,
          },
        ],
        error: null,
      },
      dmps_analytics_sessions: {
        data: [
          {
            id: "sess-1",
            anonymous_id: "anon-1",
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
            duration_seconds: 120,
          },
          {
            id: "sess-2",
            anonymous_id: "anon-2",
            started_at: nowIso,
            landing_path: "/articles/deleted-slug",
            exit_path: "/articles/deleted-slug",
            device_type: "desktop",
            browser: "Chrome",
            operating_system: "Windows",
            language: "en",
            is_pwa: false,
            page_views: 1,
            event_count: 0,
            duration_seconds: 20,
          },
        ],
        error: null,
      },
      dmps_analytics_events: {
        data: [
          {
            id: "ev-1",
            anonymous_id: "anon-1",
            session_id: "sess-1",
            event_name: "school_select",
            event_category: "school",
            path: "/",
            content_type: "schools",
            content_id: "lincoln",
            school_id: "lincoln",
            language: "es",
            created_at: nowIso,
          },
        ],
        error: null,
      },
      dmps_analytics_searches: {
        data: [
          {
            id: "sr-1",
            anonymous_id: "anon-1",
            session_id: "sess-1",
            query: "becas universitarias",
            normalized_query: "becas universitarias",
            result_count: 0,
            language: "es",
            path: "/search",
            created_at: nowIso,
          },
          {
            id: "sr-2",
            anonymous_id: "anon-2",
            session_id: "sess-2",
            query: "becas universitarias",
            normalized_query: "becas universitarias",
            result_count: 0,
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
            anonymous_id: "anon-1",
            session_id: "sess-1",
            event_type: "pwa_prompt_shown",
            platform: "ios",
            operating_system: "iOS",
            created_at: nowIso,
          },
          {
            id: "pwa-2",
            anonymous_id: "anon-1",
            session_id: "sess-1",
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

    const report = await fetchAnalyticsIntelligenceReport("30d", "all");

    expect(report.hasAnyData).toBe(true);
    // 1. Content Intelligence resolves real titles & missing items
    const resolvedArticle = report.content.topConsulted.find(
      (r) => r.contentId === "inscripcion-2026",
    );
    expect(resolvedArticle?.title).toBe("Guía de Inscripción 2026");

    const missingArticle = report.content.topConsulted.find((r) => r.contentId === "deleted-slug");
    expect(missingArticle?.title).toBe("Contenido no disponible");
    expect(missingArticle?.isAvailable).toBe(false);

    const resolvedResource = report.content.topConsulted.find(
      (r) => r.contentId === "res-infinite-campus",
    );
    expect(resolvedResource?.title).toBe("Portal Infinite Campus");
    expect(resolvedResource?.isAvailable).toBe(true);

    const resolvedActivity = report.content.topConsulted.find(
      (r) => r.contentId === "act-cross-country",
    );
    expect(resolvedActivity?.title).toBe("Cross Country (Atletismo)");
    expect(resolvedActivity?.isAvailable).toBe(true);

    const resolvedContact = report.content.topConsulted.find((r) => r.contentId === "cnt-bfl-1");
    expect(resolvedContact?.title).toBe("María López (Especialista BFL)");
    expect(resolvedContact?.isAvailable).toBe(true);

    // 2. Search Intelligence & Content Opportunities
    expect(report.searches.totalSearches).toBe(2);
    expect(report.searches.zeroResultSearches).toBe(2);
    expect(report.searches.zeroResultRatePercent).toBe(100);
    expect(report.searches.opportunities.length).toBe(1);
    expect(report.searches.opportunities[0]?.term).toBe("becas universitarias");
    expect(report.searches.opportunities[0]?.patternsObserved).toContain(
      "Búsquedas sin resultados",
    );
    expect(report.searches.opportunities[0]?.patternsObserved).toContain("Término repetido");

    // 3. Session Intelligence
    expect(report.sessions.totalSessions).toBe(2);
    expect(report.sessions.avgDurationSeconds).toBe(70);
    expect(report.sessions.avgPagesPerSession).toBe(3);
    expect(report.sessions.singlePageSessions).toBe(1);
    expect(report.sessions.multiPageSessions).toBe(1);
    expect(report.sessions.sessionsWithSearches).toBe(2);
    expect(report.sessions.sessionsWithEvents).toBe(1);

    // 4. Navigation Intelligence & Sequences
    expect(report.navigation.entryPages.length).toBeGreaterThan(0);
    expect(report.navigation.frequentTransitions.length).toBeGreaterThanOrEqual(1);
    expect(
      report.navigation.frequentTransitions.some(
        (t) => t.fromPath === "/" && t.toPath === "/articles/inscripcion-2026",
      ),
    ).toBe(true);
    expect(report.navigation.visitedAfterEntry[0]?.toPath).toBe("/articles/inscripcion-2026");

    // 5. Segmentation Intelligence
    expect(report.segmentation.languages.length).toBe(2);
    expect(report.segmentation.devices.length).toBe(2);

    // 6. School Intelligence
    const lincoln = report.schools.schools.find((s) => s.schoolId === "lincoln");
    expect(lincoln?.hasActivity).toBe(true);
    expect(lincoln?.pageViews).toBe(6);
    expect(lincoln?.selections).toBe(1);
    expect(lincoln?.topConsultedContent.length).toBeGreaterThan(0);

    // 7. PWA Intelligence
    expect(report.pwa.promptsShown.current).toBe(1);
    expect(report.pwa.installs.current).toBe(1);
    expect(report.pwa.installRatePercent).toBe(100);

    // 8. Explainable Insights
    expect(report.insights.length).toBeGreaterThan(0);
    expect(report.insights.some((i) => i.id === "insight-search-zero-results")).toBe(true);
  });

  it("3. Propaga error real cuando una consulta a Supabase falla (nunca convierte error en 0)", async () => {
    const fromMock = createSupabaseFromMock({
      schools: {
        data: [],
        error: null,
      },
      dmps_analytics_page_views: {
        data: null,
        error: { message: "RLS permission denied on dmps_analytics_page_views" },
      },
    });

    (supabaseClientModule.supabase as unknown as { from: unknown }).from = fromMock;

    await expect(fetchAnalyticsIntelligenceReport("7d", "all")).rejects.toThrow(
      /No fue posible cargar vistas de página \(inteligencia\)/,
    );
  });
});
