import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildComparisonMetric,
  computeAnalyticsDateRange,
  fetchAnalyticsOverviewAndSeries,
  fetchAudienceAnalytics,
  fetchContentAnalytics,
  fetchNavigationAnalytics,
  fetchPwaAnalytics,
  fetchRealtimePresenceSnapshot,
  fetchSchoolsAnalytics,
  fetchSearchesAnalytics,
} from "@/analytics/dashboard-queries";
import { supabase } from "@/integrations/supabase/client";
import fs from "node:fs";
import path from "node:path";

type QueryResult = { data: unknown; error: { message: string; code?: string } | null };

function createChainableQuery(result: QueryResult) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = vi.fn(self);
  chain.eq = vi.fn(self);
  chain.gte = vi.fn(self);
  chain.lte = vi.fn(self);
  chain.order = vi.fn(self);
  chain.limit = vi.fn(self);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  chain.then = (resolve: (val: QueryResult) => unknown, reject: (err: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
}

describe("DMPS INFO — Stage 3 Real Analytics Dashboard", () => {
  let originalFrom: unknown;

  beforeEach(() => {
    originalFrom = (supabase as unknown as { from: unknown }).from;
  });

  afterEach(() => {
    if (originalFrom !== undefined) {
      (supabase as unknown as { from: unknown }).from = originalFrom;
    }
    vi.restoreAllMocks();
  });

  it("calculates exact startDate, endDate, and previous period bounds for 24h, 7d, 30d, 90d, 12m, and all", () => {
    const fixedNow = new Date("2026-10-02T12:00:00.000Z");

    const r24h = computeAnalyticsDateRange("24h", fixedNow);
    expect(r24h.endDate.toISOString()).toBe("2026-10-02T12:00:00.000Z");
    expect(r24h.startDate?.toISOString()).toBe("2026-10-01T12:00:00.000Z");
    expect(r24h.previousEndDate?.toISOString()).toBe("2026-10-01T12:00:00.000Z");
    expect(r24h.previousStartDate?.toISOString()).toBe("2026-09-30T12:00:00.000Z");

    const r30d = computeAnalyticsDateRange("30d", fixedNow);
    expect(r30d.startDate?.toISOString()).toBe("2026-09-02T12:00:00.000Z");
    expect(r30d.previousStartDate?.toISOString()).toBe("2026-08-03T12:00:00.000Z");

    const rAll = computeAnalyticsDateRange("all", fixedNow);
    expect(rAll.startDate).toBeNull();
    expect(rAll.previousStartDate).toBeNull();
    expect(rAll.previousEndDate).toBeNull();
  });

  it("computes descriptive period comparisons (up, down, neutral, insufficient, and no comparison for 'all')", () => {
    expect(buildComparisonMetric(15, 10, "30d")).toEqual({
      current: 15,
      previous: 10,
      deltaPercent: 50,
      direction: "up",
      hasComparison: true,
    });

    expect(buildComparisonMetric(5, 10, "7d")).toEqual({
      current: 5,
      previous: 10,
      deltaPercent: -50,
      direction: "down",
      hasComparison: true,
    });

    expect(buildComparisonMetric(8, 8, "24h")).toEqual({
      current: 8,
      previous: 8,
      deltaPercent: 0,
      direction: "neutral",
      hasComparison: true,
    });

    expect(buildComparisonMetric(0, 0, "90d").hasComparison).toBe(false);
    expect(buildComparisonMetric(120, 80, "all").hasComparison).toBe(false);
  });

  it("computes Overview metrics and daily chart series from real Supabase rows and handles Empty state when 0 rows exist", async () => {
    const emptyMock = vi.fn(() => createChainableQuery({ data: [], error: null }));
    (supabase as unknown as { from: unknown }).from = emptyMock;

    const emptyResult = await fetchAnalyticsOverviewAndSeries("7d", "all", 60);
    expect(emptyResult.overview.hasAnyData).toBe(false);
    expect(emptyResult.overview.uniqueUsers.current).toBe(0);
    expect(emptyResult.dailySeries).toEqual([]);

    // Now test with populated Supabase records
    const nowIso = new Date().toISOString();
    const populatedMock = vi.fn((tableName: string) => {
      if (tableName === "dmps_analytics_sessions") {
        return createChainableQuery({
          data: [
            {
              id: "sess-1",
              anonymous_id: "anon-1",
              started_at: nowIso,
              last_seen_at: nowIso,
              landing_path: "/",
              exit_path: "/faq",
              device_type: "mobile",
              browser: "Safari",
              operating_system: "iOS",
              language: "es",
              is_pwa: false,
              duration_seconds: 45,
            },
          ],
          error: null,
        });
      }
      if (tableName === "dmps_analytics_page_views") {
        return createChainableQuery({
          data: [
            {
              id: "pv-1",
              anonymous_id: "anon-1",
              session_id: "sess-1",
              path: "/",
              title: "Inicio",
              content_type: "home",
              content_id: "home",
              school_id: "lincoln",
              language: "es",
              entered_at: nowIso,
              duration_seconds: 25,
            },
            {
              id: "pv-2",
              anonymous_id: "anon-1",
              session_id: "sess-1",
              path: "/faq",
              title: "FAQ",
              content_type: "faq",
              content_id: "faq",
              school_id: "lincoln",
              language: "es",
              entered_at: nowIso,
              duration_seconds: 20,
            },
          ],
          error: null,
        });
      }
      if (tableName === "dmps_analytics_searches") {
        return createChainableQuery({
          data: [
            {
              id: "sr-1",
              anonymous_id: "anon-1",
              session_id: "sess-1",
              query: "inscripcion",
              normalized_query: "inscripcion",
              result_count: 3,
              language: "es",
              path: "/search",
              created_at: nowIso,
            },
          ],
          error: null,
        });
      }
      if (tableName === "dmps_analytics_events") {
        return createChainableQuery({
          data: [
            {
              id: "ev-1",
              anonymous_id: "anon-1",
              session_id: "sess-1",
              event_name: "faq_open",
              event_category: "content",
              path: "/faq",
              content_type: "faq",
              content_id: "faq-1",
              school_id: "lincoln",
              language: "es",
              metadata: {},
              created_at: nowIso,
            },
          ],
          error: null,
        });
      }
      if (tableName === "dmps_analytics_pwa") {
        return createChainableQuery({
          data: [
            {
              id: "pwa-1",
              anonymous_id: "anon-1",
              session_id: "sess-1",
              event_type: "pwa_install",
              platform: "ios",
              device_type: "mobile",
              browser: "Safari",
              operating_system: "iOS",
              created_at: nowIso,
            },
          ],
          error: null,
        });
      }
      if (tableName === "dmps_analytics_presence") {
        return createChainableQuery({
          data: [
            {
              current_path: "/faq",
              current_content_type: "faq",
              current_content_id: "faq",
              language: "es",
              device_type: "mobile",
              is_pwa: false,
              started_at: nowIso,
              last_seen_at: nowIso,
            },
          ],
          error: null,
        });
      }
      return createChainableQuery({ data: [], error: null });
    });

    (supabase as unknown as { from: unknown }).from = populatedMock;

    const res = await fetchAnalyticsOverviewAndSeries("7d", "all", 60);
    expect(res.overview.hasAnyData).toBe(true);
    expect(res.overview.uniqueUsers.current).toBe(1);
    expect(res.overview.sessions.current).toBe(1);
    expect(res.overview.pageViews.current).toBe(2);
    expect(res.overview.uniquePages.current).toBe(2);
    expect(res.overview.searches.current).toBe(1);
    expect(res.overview.events.current).toBe(1);
    expect(res.overview.pwaInstalls.current).toBe(1);
    expect(res.overview.activeUsersNow).toBe(1);
    expect(res.dailySeries.length).toBe(1);
    expect(res.dailySeries[0]?.pageViews).toBe(2);
  });

  it("propagates real Supabase errors instead of converting errors to 0 or empty arrays", async () => {
    const errorMock = vi.fn(() =>
      createChainableQuery({
        data: null,
        error: { code: "42501", message: "permission denied for table dmps_analytics_sessions" },
      }),
    );
    (supabase as unknown as { from: unknown }).from = errorMock;

    await expect(fetchAnalyticsOverviewAndSeries("30d", "all", 60)).rejects.toThrow(
      /permission denied/,
    );
    await expect(fetchAudienceAnalytics("30d")).rejects.toThrow(/permission denied/);
  });

  it("filters realtime presence strictly within presence_timeout_seconds and never exposes anonymous_id", async () => {
    const nowMs = Date.now();
    const activeIso = new Date(nowMs - 15 * 1000).toISOString();
    const expiredIso = new Date(nowMs - 120 * 1000).toISOString();

    (supabase as unknown as { from: unknown }).from = vi.fn(() =>
      createChainableQuery({
        data: [
          {
            current_path: "/articles/guia-9no",
            current_content_type: "article",
            current_content_id: "guia-9no",
            language: "es",
            device_type: "mobile",
            is_pwa: true,
            started_at: activeIso,
            last_seen_at: activeIso,
          },
          {
            current_path: "/expired",
            current_content_type: "page",
            current_content_id: "expired",
            language: "en",
            device_type: "desktop",
            is_pwa: false,
            started_at: expiredIso,
            last_seen_at: expiredIso,
          },
        ],
        error: null,
      }),
    );

    const snapshot = await fetchRealtimePresenceSnapshot(60);
    expect(snapshot.activeCount).toBe(1);
    expect(snapshot.items[0]?.currentPath).toBe("/articles/guia-9no");
    expect("anonymous_id" in (snapshot.items[0] as Record<string, unknown>)).toBe(false);
  });

  it("resolves real content names from content tables and displays 'Contenido no disponible' for deleted content", async () => {
    const nowIso = new Date().toISOString();
    const selectCallsByTable: Record<string, string[]> = {};

    (supabase as unknown as { from: unknown }).from = vi.fn((tableName: string) => {
      const recordSelect = (cols: string) => {
        if (!selectCallsByTable[tableName]) selectCallsByTable[tableName] = [];
        selectCallsByTable[tableName].push(cols);
      };

      if (tableName === "dmps_analytics_page_views") {
        return createChainableQuery({
          data: [
            {
              id: "pv-a1",
              anonymous_id: "anon-1",
              session_id: "sess-1",
              path: "/articles/inscripcion-2026",
              title: "Inscripción",
              content_type: "article",
              content_id: "inscripcion-2026",
              school_id: "lincoln",
              language: "es",
              entered_at: nowIso,
              duration_seconds: 40,
            },
            {
              id: "pv-deleted",
              anonymous_id: "anon-2",
              session_id: "sess-2",
              path: "/articles/articulo-borrado",
              title: "Borrado",
              content_type: "article",
              content_id: "articulo-borrado",
              school_id: "lincoln",
              language: "es",
              entered_at: nowIso,
              duration_seconds: 10,
            },
            {
              id: "pv-res1",
              anonymous_id: "anon-1",
              session_id: "sess-1",
              path: "/resources/res-infinite-campus",
              title: "Infinite Campus",
              content_type: "resource",
              content_id: "res-infinite-campus",
              school_id: "lincoln",
              language: "es",
              entered_at: nowIso,
              duration_seconds: 25,
            },
            {
              id: "pv-act1",
              anonymous_id: "anon-1",
              session_id: "sess-1",
              path: "/deportes-actividades",
              title: "Cross Country",
              content_type: "activities",
              content_id: "act-cross-country",
              school_id: "lincoln",
              language: "es",
              entered_at: nowIso,
              duration_seconds: 35,
            },
            {
              id: "pv-cnt1",
              anonymous_id: "anon-1",
              session_id: "sess-1",
              path: "/contact",
              title: "Contacto BFL",
              content_type: "contact",
              content_id: "cnt-bfl-1",
              school_id: "lincoln",
              language: "es",
              entered_at: nowIso,
              duration_seconds: 15,
            },
          ],
          error: null,
        });
      }
      if (tableName === "articles") {
        return createChainableQuery({
          data: [{ id: "art-1", slug: "inscripcion-2026", title: "Guía Oficial de Inscripción" }],
          error: null,
        });
      }
      if (tableName === "resources") {
        const q = createChainableQuery({
          data: [{ id: "res-infinite-campus", url: "https://dmps.infinitecampus.org" }],
          error: null,
        });
        q.select = vi.fn((cols: string) => {
          recordSelect(cols);
          return q;
        });
        return q;
      }
      if (tableName === "resource_translations") {
        const q = createChainableQuery({
          data: [
            {
              resource_id: "res-infinite-campus",
              language_code: "es",
              title: "Portal Infinite Campus",
            },
          ],
          error: null,
        });
        q.select = vi.fn((cols: string) => {
          recordSelect(cols);
          return q;
        });
        return q;
      }
      if (tableName === "activities") {
        const q = createChainableQuery({
          data: [{ id: "act-cross-country", name: "Cross Country (Atletismo)" }],
          error: null,
        });
        q.select = vi.fn((cols: string) => {
          recordSelect(cols);
          return q;
        });
        return q;
      }
      if (tableName === "contacts") {
        const q = createChainableQuery({
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
        });
        q.select = vi.fn((cols: string) => {
          recordSelect(cols);
          return q;
        });
        return q;
      }
      return createChainableQuery({ data: [], error: null });
    });

    const contentData = await fetchContentAnalytics("30d", "all");
    expect(contentData.hasAnyData).toBe(true);
    const existingRow = contentData.rows.find((r) => r.contentId === "inscripcion-2026");
    const deletedRow = contentData.rows.find((r) => r.contentId === "articulo-borrado");
    const resourceRow = contentData.rows.find((r) => r.contentId === "res-infinite-campus");
    const activityRow = contentData.rows.find((r) => r.contentId === "act-cross-country");
    const contactRow = contentData.rows.find((r) => r.contentId === "cnt-bfl-1");

    expect(existingRow?.title).toBe("Guía Oficial de Inscripción");
    expect(existingRow?.isAvailable).toBe(true);
    expect(existingRow?.avgDurationSeconds).toBe(40);

    expect(deletedRow?.title).toBe("Contenido no disponible");
    expect(deletedRow?.isAvailable).toBe(false);

    expect(resourceRow?.title).toBe("Portal Infinite Campus");
    expect(resourceRow?.isAvailable).toBe(true);

    expect(activityRow?.title).toBe("Cross Country (Atletismo)");
    expect(activityRow?.isAvailable).toBe(true);

    expect(contactRow?.title).toBe("María López (Especialista BFL)");
    expect(contactRow?.isAvailable).toBe(true);

    // Ensure nonexistent columns (contacts.name, activities.slug, resources.name) are never queried
    expect(selectCallsByTable.resources?.[0]).toBe("id, url");
    expect(selectCallsByTable.resource_translations?.[0]).toBe("resource_id, language_code, title");
    expect(selectCallsByTable.activities?.[0]).toBe("id, name");
    expect(selectCallsByTable.contacts?.[0]).toBe(
      "id, person_name, role_title, job_title, department",
    );
  });

  it("aggregates searches, Audience dimensions, Schools, PWA install rates, and Navigation paths accurately", async () => {
    const nowIso = new Date().toISOString();
    (supabase as unknown as { from: unknown }).from = vi.fn((tableName: string) => {
      if (tableName === "dmps_analytics_searches") {
        return createChainableQuery({
          data: [
            {
              id: "s1",
              anonymous_id: "u1",
              session_id: "sess1",
              query: "Calendario",
              normalized_query: "calendario",
              result_count: 4,
              language: "es",
              path: "/search",
              created_at: nowIso,
            },
            {
              id: "s2",
              anonymous_id: "u2",
              session_id: "sess2",
              query: "xyz-inexistente",
              normalized_query: "xyz-inexistente",
              result_count: 0,
              language: "es",
              path: "/search",
              created_at: nowIso,
            },
          ],
          error: null,
        });
      }
      if (tableName === "dmps_analytics_sessions") {
        return createChainableQuery({
          data: [
            {
              id: "sess1",
              anonymous_id: "u1",
              started_at: nowIso,
              last_seen_at: nowIso,
              landing_path: "/",
              exit_path: "/calendario",
              device_type: "mobile",
              browser: "Chrome",
              operating_system: "Android",
              language: "es",
              is_pwa: false,
              duration_seconds: 60,
            },
          ],
          error: null,
        });
      }
      if (tableName === "schools") {
        return createChainableQuery({
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
        });
      }
      if (tableName === "dmps_analytics_page_views") {
        return createChainableQuery({
          data: [
            {
              id: "pv1",
              anonymous_id: "u1",
              session_id: "sess1",
              path: "/calendario",
              title: "Calendario",
              content_type: "calendar",
              content_id: "calendario",
              school_id: "lincoln",
              language: "es",
              entered_at: nowIso,
              duration_seconds: 30,
            },
          ],
          error: null,
        });
      }
      if (tableName === "dmps_analytics_events") {
        return createChainableQuery({
          data: [
            {
              id: "ev1",
              anonymous_id: "u1",
              session_id: "sess1",
              event_name: "school_select",
              event_category: "preference",
              path: "/",
              content_type: "schools",
              content_id: "lincoln",
              school_id: "lincoln",
              language: "es",
              metadata: {},
              created_at: nowIso,
            },
          ],
          error: null,
        });
      }
      if (tableName === "dmps_analytics_pwa") {
        return createChainableQuery({
          data: [
            {
              id: "p1",
              anonymous_id: "u1",
              session_id: "sess1",
              event_type: "pwa_prompt_shown",
              platform: "android",
              device_type: "mobile",
              browser: "Chrome",
              operating_system: "Android",
              created_at: nowIso,
            },
            {
              id: "p2",
              anonymous_id: "u1",
              session_id: "sess1",
              event_type: "pwa_install",
              platform: "android",
              device_type: "mobile",
              browser: "Chrome",
              operating_system: "Android",
              created_at: nowIso,
            },
          ],
          error: null,
        });
      }
      return createChainableQuery({ data: [], error: null });
    });

    const searches = await fetchSearchesAnalytics("30d");
    expect(searches.totalSearches).toBe(2);
    expect(searches.uniqueUsers).toBe(2);
    expect(searches.withResults).toBe(1);
    expect(searches.withoutResults).toBe(1);
    expect(searches.successRatePercent).toBe(50);
    expect(searches.avgResults).toBe(2);

    const audience = await fetchAudienceAnalytics("30d");
    expect(audience.hasAnyData).toBe(true);
    expect(audience.languages[0]?.dimension).toBe("Español (es)");
    expect(audience.devices[0]?.dimension).toBe("Móvil");

    const schools = await fetchSchoolsAnalytics("30d");
    expect(schools.rows.length).toBe(1);
    expect(schools.rows[0]?.schoolName).toBe("Abraham Lincoln High School");
    expect(schools.rows[0]?.pageViews).toBe(1);
    expect(schools.rows[0]?.selections).toBe(1);

    const pwa = await fetchPwaAnalytics("30d");
    expect(pwa.promptsShown).toBe(1);
    expect(pwa.installs).toBe(1);
    expect(pwa.installRatePercent).toBe(100);

    const nav = await fetchNavigationAnalytics("30d", "all");
    expect(nav.landingPages[0]?.path).toBe("/");
    expect(nav.exitPages[0]?.path).toBe("/calendario");
    expect(nav.topVisitedPages[0]?.path).toBe("/calendario");
  });

  it("enforces administrative route protection in /admin/analytics", () => {
    const fileContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/routes/admin.analytics.tsx"),
      "utf-8",
    );
    expect(fileContent).toContain("useAdminSession");
    expect(fileContent).toContain('session.role === "super_admin" || session.role === "admin"');
    expect(fileContent).toContain("Acceso restringido a Administradores");
  });
});
