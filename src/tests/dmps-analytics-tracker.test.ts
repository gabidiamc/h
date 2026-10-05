import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCurrentSession,
  computeHeartbeatIntervalMs,
  detectBrowser,
  detectDeviceType,
  detectOperatingSystem,
  DmpsAnalyticsObserver,
  generateCryptoUuid,
  getCurrentPageViewId,
  getCurrentSessionId,
  getOrCreateAnonymousId,
  inferContentFromPath,
  isExcludedAdminPath,
  isValidUuid,
  normalizeSearchQuery,
  recordAnalyticsEvent,
  recordAnalyticsPageView,
  recordAnalyticsPwaEvent,
  recordAnalyticsSearch,
  resetPageViewState,
  sanitizeEventMetadata,
  sanitizePath,
  sanitizeSearchQuery,
  sendPresenceHeartbeatNow,
  shutdownAnalyticsTracker,
  startOrResumeSession,
  stopPresenceHeartbeat,
  updatePresenceContext,
} from "@/analytics";
import type { AnalyticsConfig } from "@/analytics";
import * as supabaseClientModule from "@/integrations/supabase/client";

const TEST_CONFIG: AnalyticsConfig = {
  id: "default",
  enabled: true,
  retention_days: 365,
  presence_timeout_seconds: 60,
  track_page_views: true,
  track_searches: true,
  track_events: true,
  track_pwa: true,
  track_referrer: true,
  track_device: true,
  track_browser: true,
  track_os: true,
  track_language: true,
  track_country: true,
};

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

describe("DMPS INFO — Stage 2 Real Analytics Tracker E2E Validation", () => {
  const rpcSpy = vi.fn();
  let mockVisibilityState: DocumentVisibilityState = "visible";
  let mockPathname = "/";

  let originalRpc: unknown;

  beforeEach(() => {
    originalRpc = (supabaseClientModule.supabase as unknown as { rpc?: unknown }).rpc;
    rpcSpy.mockReset();
    rpcSpy.mockImplementation(async (fnName: string) => {
      if (fnName === "heartbeat_presence") {
        return { data: true, error: null };
      }
      return { data: generateCryptoUuid(), error: null };
    });

    vi.spyOn(supabaseClientModule, "isSupabaseConfigured").mockReturnValue(true);
    (supabaseClientModule.supabase as unknown as { rpc: unknown }).rpc = rpcSpy;

    const localStore = createMockStorage();
    const sessionStore = createMockStorage();
    mockVisibilityState = "visible";
    mockPathname = "/";

    vi.stubGlobal("window", {
      localStorage: localStore,
      sessionStorage: sessionStore,
      location: {
        get pathname() {
          return mockPathname;
        },
        origin: "https://dmpsinfo.org",
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    });

    vi.stubGlobal("document", {
      get visibilityState() {
        return mockVisibilityState;
      },
      title: "DMPS Family Info",
      referrer: "https://www.dmschools.org/welcome",
      documentElement: { lang: "es" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    clearCurrentSession();
    resetPageViewState();
    stopPresenceHeartbeat();
  });

  afterEach(() => {
    if (originalRpc !== undefined) {
      (supabaseClientModule.supabase as unknown as { rpc: unknown }).rpc = originalRpc;
    }
    shutdownAnalyticsTracker();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("exports DmpsAnalyticsObserver component for public application mounting", () => {
    expect(typeof DmpsAnalyticsObserver).toBe("function");
  });

  it("creates and preserves anonymous_id across calls and storage", () => {
    const id1 = generateCryptoUuid();
    const id2 = getOrCreateAnonymousId();
    const id3 = getOrCreateAnonymousId();

    expect(isValidUuid(id1)).toBe(true);
    expect(isValidUuid(id2)).toBe(true);
    expect(id2).toBe(id3);
    expect(window.localStorage.getItem("dmps_analytics_anonymous_id")).toBe(id2);
    expect(isValidUuid("not-a-uuid")).toBe(false);
  });

  it("creates, preserves, and renews session_id via record_session RPC", async () => {
    mockPathname = "/programas";
    const first = await startOrResumeSession(TEST_CONFIG, "/programas", "es");
    expect(first).not.toBeNull();
    expect(first?.isNewSession).toBe(true);
    expect(isValidUuid(first?.sessionId)).toBe(true);
    expect(getCurrentSessionId()).toBe(first?.sessionId);
    expect(rpcSpy).toHaveBeenCalledWith(
      "record_session",
      expect.objectContaining({
        p_anonymous_id: first?.anonymousId,
        p_landing_path: "/programas",
        p_language: "es",
      }),
    );

    // Resuming active session does not call record_session again
    rpcSpy.mockClear();
    const second = await startOrResumeSession(TEST_CONFIG, "/faq", "es");
    expect(second?.isNewSession).toBe(false);
    expect(second?.sessionId).toBe(first?.sessionId);
    expect(rpcSpy).not.toHaveBeenCalled();

    // Clearing/ending session renews session_id on next visit
    clearCurrentSession();
    expect(getCurrentSessionId()).toBeNull();
    const renewed = await startOrResumeSession(TEST_CONFIG, "/faq", "es");
    expect(renewed?.isNewSession).toBe(true);
    expect(renewed?.sessionId).not.toBe(first?.sessionId);
    expect(rpcSpy).toHaveBeenCalledWith(
      "record_session",
      expect.objectContaining({
        p_landing_path: "/faq",
      }),
    );
  });

  it("excludes /admin* and /auth* routes from generating sessions, page views, events, searches, presence, or PWA records", async () => {
    expect(isExcludedAdminPath("/admin")).toBe(true);
    expect(isExcludedAdminPath("/admin/articulos")).toBe(true);
    expect(isExcludedAdminPath("/auth")).toBe(true);
    expect(isExcludedAdminPath("/auth/callback")).toBe(true);
    expect(isExcludedAdminPath("/")).toBe(false);
    expect(isExcludedAdminPath("/articles/salud")).toBe(false);
    expect(sanitizePath("/articles/salud?token=secret#top")).toBe("/articles/salud");

    mockPathname = "/admin/articulos";
    const anonId = getOrCreateAnonymousId();
    const fakeSessionId = generateCryptoUuid();

    expect(await startOrResumeSession(TEST_CONFIG, "/admin/articulos")).toBeNull();
    expect(
      await recordAnalyticsPageView(anonId, fakeSessionId, TEST_CONFIG, {
        path: "/admin/articulos",
      }),
    ).toBeNull();
    expect(
      await recordAnalyticsEvent(anonId, fakeSessionId, TEST_CONFIG, {
        eventName: "article_view",
        path: "/admin/articulos",
      }),
    ).toBeNull();
    expect(
      await recordAnalyticsSearch(anonId, fakeSessionId, TEST_CONFIG, {
        query: "calendario",
        resultCount: 3,
        path: "/admin/articulos",
      }),
    ).toBeNull();
    expect(await sendPresenceHeartbeatNow(TEST_CONFIG)).toBe(false);
    expect(
      await recordAnalyticsPwaEvent("pwa_install", TEST_CONFIG, anonId, fakeSessionId),
    ).toBeNull();

    expect(rpcSpy).not.toHaveBeenCalled();
  });

  it("records page views via record_page_view and links p_previous_page_view_id on navigation", async () => {
    const anonId = getOrCreateAnonymousId();
    const session = await startOrResumeSession(TEST_CONFIG, "/");
    const sessionId = session!.sessionId;
    rpcSpy.mockClear();

    const pv1 = await recordAnalyticsPageView(anonId, sessionId, TEST_CONFIG, {
      path: "/",
      title: "Inicio — DMPS",
      schoolId: "lincoln",
      language: "es",
    });

    expect(isValidUuid(pv1)).toBe(true);
    expect(getCurrentPageViewId()).toBe(pv1);
    expect(rpcSpy).toHaveBeenCalledWith(
      "record_page_view",
      expect.objectContaining({
        p_anonymous_id: anonId,
        p_session_id: sessionId,
        p_path: "/",
        p_content_type: "home",
        p_content_id: "home",
        p_school_id: "lincoln",
        p_previous_page_view_id: null,
      }),
    );

    rpcSpy.mockClear();
    const pv2 = await recordAnalyticsPageView(anonId, sessionId, TEST_CONFIG, {
      path: "/articles/inscripcion-escolar",
      title: "Inscripción Escolar",
      schoolId: "lincoln",
      language: "es",
    });

    expect(isValidUuid(pv2)).toBe(true);
    expect(rpcSpy).toHaveBeenCalledWith(
      "record_page_view",
      expect.objectContaining({
        p_path: "/articles/inscripcion-escolar",
        p_content_type: "article",
        p_content_id: "inscripcion-escolar",
        p_previous_page_view_id: pv1,
      }),
    );
  });

  it("sends heartbeat_presence ONLY when the browser tab is active (visible)", async () => {
    mockPathname = "/topics/transporte";
    await startOrResumeSession(TEST_CONFIG, "/topics/transporte");
    updatePresenceContext({ path: "/topics/transporte", language: "es" });
    rpcSpy.mockClear();

    expect(computeHeartbeatIntervalMs(TEST_CONFIG)).toBe(30000);

    // Tab is visible -> heartbeat succeeds
    mockVisibilityState = "visible";
    const sentVisible = await sendPresenceHeartbeatNow(TEST_CONFIG);
    expect(sentVisible).toBe(true);
    expect(rpcSpy).toHaveBeenCalledWith(
      "heartbeat_presence",
      expect.objectContaining({
        p_current_path: "/topics/transporte",
        p_current_content_type: "category",
        p_current_content_id: "transporte",
      }),
    );

    // Tab is hidden -> heartbeat does NOT fire
    rpcSpy.mockClear();
    mockVisibilityState = "hidden";
    const sentHidden = await sendPresenceHeartbeatNow(TEST_CONFIG);
    expect(sentHidden).toBe(false);
    expect(rpcSpy).not.toHaveBeenCalled();
  });

  it("records sanitized events via record_event and strips PII keys/patterns", async () => {
    const anonId = getOrCreateAnonymousId();
    const session = await startOrResumeSession(TEST_CONFIG, "/contact");
    const sessionId = session!.sessionId;
    rpcSpy.mockClear();

    const eventId = await recordAnalyticsEvent(anonId, sessionId, TEST_CONFIG, {
      eventName: "contact_click",
      eventCategory: "directory",
      path: "/contact",
      contentType: "contact",
      contentId: "bfl-lincoln",
      schoolId: "lincoln",
      language: "es",
      metadata: {
        channel: "phone",
        email: "parent@example.com",
        phone: "515-242-7846",
        full_name: "Juan Perez",
        access_token: "secret-jwt",
        note: "Call 515-242-7846 or email parent@example.com",
      },
    });

    expect(isValidUuid(eventId)).toBe(true);
    expect(rpcSpy).toHaveBeenCalledWith(
      "record_event",
      expect.objectContaining({
        p_anonymous_id: anonId,
        p_session_id: sessionId,
        p_event_name: "contact_click",
        p_event_category: "directory",
        p_content_id: "bfl-lincoln",
        p_metadata: {
          channel: "phone",
          note: "Call [redacted-phone] or email [redacted-email]",
        },
      }),
    );
  });

  it("sanitizes search queries and records via record_search + search/search_no_results events", async () => {
    expect(sanitizeSearchQuery("  Inscripción   2026  ")).toBe("Inscripción 2026");
    expect(normalizeSearchQuery("  Inscripción   2026  ")).toBe("inscripcion 2026");
    expect(sanitizeSearchQuery("help user@test.org 515-555-1234")).toBe(
      "help [redacted-email] [redacted-phone]",
    );

    const anonId = getOrCreateAnonymousId();
    const session = await startOrResumeSession(TEST_CONFIG, "/search");
    const sessionId = session!.sessionId;
    rpcSpy.mockClear();

    const searchId = await recordAnalyticsSearch(anonId, sessionId, TEST_CONFIG, {
      query: "  Rutas de Autobús user@test.org  ",
      resultCount: 0,
      language: "es",
      path: "/search",
      schoolId: "lincoln",
    });

    expect(isValidUuid(searchId)).toBe(true);
    expect(rpcSpy).toHaveBeenCalledWith(
      "record_search",
      expect.objectContaining({
        p_anonymous_id: anonId,
        p_session_id: sessionId,
        p_query: "Rutas de Autobús [redacted-email]",
        p_normalized_query: "rutas de autobus [redacted-email]",
        p_result_count: 0,
        p_path: "/search",
      }),
    );
    expect(rpcSpy).toHaveBeenCalledWith(
      "record_event",
      expect.objectContaining({
        p_event_name: "search_no_results",
        p_event_category: "search",
      }),
    );
  });

  it("records PWA telemetry via record_pwa_event", async () => {
    mockPathname = "/";
    const anonId = getOrCreateAnonymousId();
    const session = await startOrResumeSession(TEST_CONFIG, "/");
    const sessionId = session!.sessionId;
    rpcSpy.mockClear();

    const pwaId = await recordAnalyticsPwaEvent("pwa_install", TEST_CONFIG, anonId, sessionId);
    expect(isValidUuid(pwaId)).toBe(true);
    expect(rpcSpy).toHaveBeenCalledWith(
      "record_pwa_event",
      expect.objectContaining({
        p_anonymous_id: anonId,
        p_event_type: "pwa_install",
        p_session_id: sessionId,
      }),
    );
  });

  it("maps DMPS INFO routes and detects device context accurately", () => {
    expect(inferContentFromPath("/")).toEqual({ contentType: "home", contentId: "home" });
    expect(inferContentFromPath("/articles/inscripcion-escolar")).toEqual({
      contentType: "article",
      contentId: "inscripcion-escolar",
    });
    expect(inferContentFromPath("/topics/transporte")).toEqual({
      contentType: "category",
      contentId: "transporte",
    });
    expect(inferContentFromPath("/deportes-actividades")).toEqual({
      contentType: "activities",
      contentId: "deportes-actividades",
    });

    const iphoneUa =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    expect(detectDeviceType(iphoneUa)).toBe("mobile");
    expect(detectBrowser(iphoneUa)).toBe("Safari");
    expect(detectOperatingSystem(iphoneUa)).toBe("iOS");
  });

  it("cleaned metadata strips all forbidden PII keys", () => {
    const cleaned = sanitizeEventMetadata({
      article_id: "art-123",
      email: "parent@example.com",
      phone: "515-242-7846",
      full_name: "Juan Perez",
      access_token: "secret-jwt",
    });
    expect(cleaned).toEqual({ article_id: "art-123" });
  });
});
