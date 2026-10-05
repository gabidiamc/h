import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getAppLanguage, getAppSchoolId, isExcludedAdminPath, sanitizePath } from "./device";
import { recordAnalyticsEvent } from "./events";
import {
  getCurrentPageViewId,
  inferContentFromPath,
  recordAnalyticsPageView,
  resetPageViewState,
} from "./pageViews";
import {
  sendPresenceHeartbeatNow,
  startPresenceHeartbeat,
  stopPresenceHeartbeat,
  updatePresenceContext,
} from "./presence";
import { installPwaAnalyticsListeners, trackPwaLaunchIfStandalone } from "./pwa";
import { recordAnalyticsSearch } from "./searches";
import {
  clearCurrentSession,
  getCurrentSessionId,
  getOrCreateAnonymousId,
  hasSessionExpiredByInactivity,
  startOrResumeSession,
  touchSessionActivity,
} from "./session";
import type {
  AnalyticsConfig,
  AnalyticsEventPayload,
  PageViewPayload,
  SearchAnalyticsPayload,
} from "./types";

const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
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

let cachedConfig: AnalyticsConfig | null = null;
let configFetched = false;
let isInitialized = false;
let initPromise: Promise<void> | null = null;
let cleanupListeners: (() => void) | null = null;
let lastExitSentAtMs = 0;

export async function fetchAnalyticsConfig(): Promise<AnalyticsConfig> {
  if (cachedConfig && configFetched) {
    return cachedConfig;
  }

  if (typeof window === "undefined" || !isSupabaseConfigured()) {
    cachedConfig = DEFAULT_ANALYTICS_CONFIG;
    return cachedConfig;
  }

  try {
    const { data, error } = await supabase
      .from("dmps_analytics_config")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (!error && data) {
      cachedConfig = {
        id: data.id || "default",
        enabled: data.enabled !== false,
        retention_days: Number(data.retention_days) || 365,
        presence_timeout_seconds: Number(data.presence_timeout_seconds) || 60,
        track_page_views: data.track_page_views !== false,
        track_searches: data.track_searches !== false,
        track_events: data.track_events !== false,
        track_pwa: data.track_pwa !== false,
        track_referrer: data.track_referrer !== false,
        track_device: data.track_device !== false,
        track_browser: data.track_browser !== false,
        track_os: data.track_os !== false,
        track_language: data.track_language !== false,
        track_country: data.track_country !== false,
      };
      configFetched = true;
      return cachedConfig;
    }
  } catch {
    // Fall back to safe default config if network or table read fails
  }

  cachedConfig = DEFAULT_ANALYTICS_CONFIG;
  configFetched = true;
  return cachedConfig;
}

export function getAnalyticsConfig(): AnalyticsConfig | null {
  return cachedConfig;
}

async function ensureActiveSession(path?: string): Promise<{
  anonymousId: string;
  sessionId: string;
  config: AnalyticsConfig;
} | null> {
  if (typeof window === "undefined") return null;

  const config = await fetchAnalyticsConfig();
  if (!config.enabled) return null;

  const cleanPath = sanitizePath(path || window.location.pathname);
  if (isExcludedAdminPath(cleanPath)) return null;

  if (hasSessionExpiredByInactivity()) {
    const expiredSessionId = getCurrentSessionId();
    const anonymousId = getOrCreateAnonymousId();
    if (expiredSessionId) {
      void recordAnalyticsEvent(anonymousId, expiredSessionId, config, {
        eventName: "session_end",
        eventCategory: "lifecycle",
        path: cleanPath,
        metadata: { reason: "inactivity_timeout" },
      });
    }
    clearCurrentSession();
    resetPageViewState();
  }

  const sessionInfo = await startOrResumeSession(config, cleanPath);
  if (!sessionInfo) return null;

  if (sessionInfo.isNewSession) {
    void recordAnalyticsEvent(sessionInfo.anonymousId, sessionInfo.sessionId, config, {
      eventName: "session_start",
      eventCategory: "lifecycle",
      path: cleanPath,
      metadata: {
        landing_path: cleanPath,
      },
    });

    trackPwaLaunchIfStandalone(config, sessionInfo.anonymousId, sessionInfo.sessionId);
  }

  return {
    anonymousId: sessionInfo.anonymousId,
    sessionId: sessionInfo.sessionId,
    config,
  };
}

function sendPageExitAndSessionEnd(isUnload: boolean): void {
  if (typeof window === "undefined") return;
  if (cachedConfig && !cachedConfig.enabled) return;

  const now = Date.now();
  if (now - lastExitSentAtMs < 1000) return;
  lastExitSentAtMs = now;

  const path = sanitizePath(window.location.pathname);
  if (isExcludedAdminPath(path)) return;

  const anonymousId = getOrCreateAnonymousId();
  const sessionId = getCurrentSessionId();
  if (!sessionId) return;

  const currentPvId = getCurrentPageViewId();

  void recordAnalyticsEvent(anonymousId, sessionId, cachedConfig, {
    eventName: "page_exit",
    eventCategory: "lifecycle",
    path,
    metadata: currentPvId ? { page_view_id: currentPvId } : {},
  });

  if (isUnload) {
    void recordAnalyticsEvent(anonymousId, sessionId, cachedConfig, {
      eventName: "session_end",
      eventCategory: "lifecycle",
      path,
      metadata: currentPvId ? { page_view_id: currentPvId } : {},
    });
  }
}

function installBrowserListeners(): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  let lastActivityTouchMs = 0;
  const handleUserActivity = () => {
    const now = Date.now();
    if (now - lastActivityTouchMs < 10000) return;
    lastActivityTouchMs = now;

    if (hasSessionExpiredByInactivity()) {
      void ensureActiveSession(window.location.pathname);
    } else {
      touchSessionActivity();
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      sendPageExitAndSessionEnd(false);
    } else if (document.visibilityState === "visible") {
      void (async () => {
        const active = await ensureActiveSession(window.location.pathname);
        if (active) {
          void sendPresenceHeartbeatNow(active.config);
        }
      })();
    }
  };

  const handlePageHide = () => {
    sendPageExitAndSessionEnd(true);
  };

  const handleDocumentClick = (event: MouseEvent) => {
    if (cachedConfig && (!cachedConfig.enabled || !cachedConfig.track_events)) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target || typeof target.closest !== "function") return;

    const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return;

    // Skip if component already tracked this specific anchor click
    if (anchor.dataset.analyticsTracked === "true") return;

    const rawHref = anchor.getAttribute("href")?.trim() || "";
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:")) {
      return;
    }

    const currentPath = sanitizePath(window.location.pathname);
    if (isExcludedAdminPath(currentPath)) return;

    if (rawHref.startsWith("tel:")) {
      void trackEvent({
        eventName: "contact_click",
        eventCategory: "directory",
        path: currentPath,
        contentType: "contact",
        metadata: { channel: "phone" },
      });
      return;
    }

    if (rawHref.startsWith("mailto:")) {
      void trackEvent({
        eventName: "contact_click",
        eventCategory: "directory",
        path: currentPath,
        contentType: "contact",
        metadata: { channel: "email" },
      });
      return;
    }

    try {
      const resolvedUrl = new URL(rawHref, window.location.origin);
      if (resolvedUrl.origin !== window.location.origin) {
        void trackEvent({
          eventName: "external_link_click",
          eventCategory: "outbound",
          path: currentPath,
          contentType: "external_link",
          contentId: resolvedUrl.hostname.slice(0, 128),
          metadata: {
            target_host: resolvedUrl.hostname,
            target_url: `${resolvedUrl.origin}${resolvedUrl.pathname}`.slice(0, 250),
          },
        });
      } else {
        const targetPath = sanitizePath(resolvedUrl.pathname);
        if (targetPath !== currentPath && !isExcludedAdminPath(targetPath)) {
          const inferredTarget = inferContentFromPath(targetPath);
          void trackEvent({
            eventName: "internal_link_click",
            eventCategory: "navigation",
            path: currentPath,
            contentType: inferredTarget.contentType,
            contentId: inferredTarget.contentId,
            metadata: {
              target_path: targetPath,
            },
          });
        }
      }
    } catch {
      // Ignore malformed hrefs
    }
  };

  window.addEventListener("pointerdown", handleUserActivity, { passive: true });
  window.addEventListener("keydown", handleUserActivity, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", handlePageHide);
  document.addEventListener("click", handleDocumentClick, { capture: true, passive: true });

  const removePwaListeners = installPwaAnalyticsListeners(() => cachedConfig);

  return () => {
    window.removeEventListener("pointerdown", handleUserActivity);
    window.removeEventListener("keydown", handleUserActivity);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", handlePageHide);
    document.removeEventListener("click", handleDocumentClick, { capture: true });
    removePwaListeners();
    stopPresenceHeartbeat();
  };
}

export async function initAnalyticsTracker(): Promise<void> {
  if (typeof window === "undefined") return;
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const config = await fetchAnalyticsConfig();
      if (!config.enabled) {
        isInitialized = true;
        return;
      }

      isInitialized = true;
      cleanupListeners = installBrowserListeners();

      const initialPath = sanitizePath(window.location.pathname);
      if (isExcludedAdminPath(initialPath)) {
        return;
      }

      const active = await ensureActiveSession(initialPath);
      if (!active) return;

      updatePresenceContext({
        path: initialPath,
        language: getAppLanguage(),
      });

      await recordAnalyticsPageView(active.anonymousId, active.sessionId, active.config, {
        path: initialPath,
        title: typeof document !== "undefined" ? document.title : null,
        schoolId: getAppSchoolId(),
        language: getAppLanguage(),
      });

      startPresenceHeartbeat(active.config);
    } catch {
      // Never break app startup
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export function shutdownAnalyticsTracker(): void {
  if (cleanupListeners) {
    cleanupListeners();
    cleanupListeners = null;
  }
  stopPresenceHeartbeat();
  isInitialized = false;
}

export async function trackPageView(payload: PageViewPayload): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const cleanPath = sanitizePath(payload.path);
  if (isExcludedAdminPath(cleanPath)) return null;

  const active = await ensureActiveSession(cleanPath);
  if (!active) return null;

  const inferred = inferContentFromPath(cleanPath);
  const contentType = payload.contentType ?? inferred.contentType;
  const contentId = payload.contentId ?? inferred.contentId;

  updatePresenceContext({
    path: cleanPath,
    contentType: contentType ? String(contentType) : null,
    contentId: contentId ? String(contentId) : null,
    language: payload.language || getAppLanguage(),
  });

  const pvId = await recordAnalyticsPageView(active.anonymousId, active.sessionId, active.config, {
    ...payload,
    path: cleanPath,
    contentType,
    contentId,
  });

  startPresenceHeartbeat(active.config);
  return pvId;
}

export async function trackEvent(payload: AnalyticsEventPayload): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const cleanPath = sanitizePath(payload.path || window.location.pathname);
  if (isExcludedAdminPath(cleanPath)) return null;

  const active = await ensureActiveSession(cleanPath);
  if (!active) return null;

  return recordAnalyticsEvent(active.anonymousId, active.sessionId, active.config, {
    ...payload,
    path: cleanPath,
  });
}

export async function trackSearch(payload: SearchAnalyticsPayload): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const cleanPath = sanitizePath(payload.path || window.location.pathname);
  if (isExcludedAdminPath(cleanPath)) return null;

  const active = await ensureActiveSession(cleanPath);
  if (!active) return null;

  return recordAnalyticsSearch(active.anonymousId, active.sessionId, active.config, {
    ...payload,
    path: cleanPath,
  });
}

export function trackArticleView(article: {
  id: string;
  slug?: string | null;
  categoryId?: string | null;
  schoolId?: string | null;
  language?: string | null;
  title?: string | null;
}): void {
  const contentId = article.slug || article.id;
  updatePresenceContext({
    contentType: "article",
    contentId,
    language: article.language || getAppLanguage(),
  });
  void trackEvent({
    eventName: "article_view",
    eventCategory: "content",
    contentType: "article",
    contentId,
    schoolId: article.schoolId ?? getAppSchoolId(),
    language: article.language ?? getAppLanguage(),
    metadata: {
      article_id: article.id,
      article_slug: article.slug ?? article.id,
      category_id: article.categoryId ?? null,
      title: article.title ? article.title.slice(0, 160) : null,
    },
  });
}

export function trackArticleFeedback(
  articleId: string,
  wasHelpful: boolean,
  language?: string | null,
): void {
  void trackEvent({
    eventName: "article_feedback",
    eventCategory: "engagement",
    contentType: "article",
    contentId: articleId,
    language: language ?? getAppLanguage(),
    metadata: {
      was_helpful: wasHelpful,
    },
  });
}

export function trackCategoryClick(
  categorySlugOrId: string,
  schoolId?: string | null,
  language?: string | null,
): void {
  void trackEvent({
    eventName: "category_click",
    eventCategory: "content",
    contentType: "category",
    contentId: categorySlugOrId,
    schoolId: schoolId ?? getAppSchoolId(),
    language: language ?? getAppLanguage(),
  });
}

export function trackResourceClick(
  resourceId: string,
  metadata?: Record<string, Json | undefined>,
): void {
  void trackEvent({
    eventName: "resource_click",
    eventCategory: "content",
    contentType: "resource",
    contentId: resourceId,
    metadata,
  });
}

export function trackProgramClick(
  programId: string,
  schoolId?: string | null,
  metadata?: Record<string, Json | undefined>,
): void {
  void trackEvent({
    eventName: "program_click",
    eventCategory: "content",
    contentType: "programs",
    contentId: programId,
    schoolId: schoolId ?? getAppSchoolId(),
    metadata,
  });
}

export function trackActivityClick(
  activityId: string,
  schoolId?: string | null,
  metadata?: Record<string, Json | undefined>,
): void {
  void trackEvent({
    eventName: "activity_click",
    eventCategory: "content",
    contentType: "activities",
    contentId: activityId,
    schoolId: schoolId ?? getAppSchoolId(),
    metadata,
  });
}

export function trackFaqOpen(
  faqId: string,
  schoolId?: string | null,
  language?: string | null,
): void {
  void trackEvent({
    eventName: "faq_open",
    eventCategory: "content",
    contentType: "faq",
    contentId: faqId,
    schoolId: schoolId ?? getAppSchoolId(),
    language: language ?? getAppLanguage(),
  });
}

export function trackSchoolSelect(schoolId: string, previousSchoolId?: string | null): void {
  void trackEvent({
    eventName: "school_select",
    eventCategory: "preference",
    contentType: "schools",
    contentId: schoolId,
    schoolId,
    metadata: {
      previous_school_id: previousSchoolId ?? null,
      selected_school_id: schoolId,
    },
  });
}

export function trackAnnouncementClick(
  announcementId: string,
  schoolId?: string | null,
  metadata?: Record<string, Json | undefined>,
): void {
  void trackEvent({
    eventName: "announcement_click",
    eventCategory: "content",
    contentType: "announcements",
    contentId: announcementId,
    schoolId: schoolId ?? getAppSchoolId(),
    metadata,
  });
}

export function trackContactClick(
  contactId: string,
  channel: "phone" | "email" | "card",
  schoolId?: string | null,
): void {
  void trackEvent({
    eventName: "contact_click",
    eventCategory: "directory",
    contentType: "contact",
    contentId: contactId,
    schoolId: schoolId ?? getAppSchoolId(),
    metadata: {
      channel,
    },
  });
}

export function trackLanguageChange(newLanguage: string, previousLanguage?: string | null): void {
  updatePresenceContext({ language: newLanguage });
  void trackEvent({
    eventName: "language_change",
    eventCategory: "preference",
    contentType: "page",
    contentId: newLanguage,
    language: newLanguage,
    metadata: {
      from_language: previousLanguage ?? null,
      to_language: newLanguage,
    },
  });
}

export function trackExternalLinkClick(
  targetUrl: string,
  context?: {
    contentType?: string;
    contentId?: string;
    schoolId?: string | null;
  },
): void {
  let targetHost = "external";
  let cleanTargetUrl = targetUrl.slice(0, 250);
  try {
    const parsed = new URL(targetUrl);
    targetHost = parsed.hostname;
    cleanTargetUrl = `${parsed.origin}${parsed.pathname}`.slice(0, 250);
  } catch {
    // ignore URL parse error
  }

  void trackEvent({
    eventName: "external_link_click",
    eventCategory: "outbound",
    contentType: context?.contentType ?? "external_link",
    contentId: context?.contentId ?? targetHost,
    schoolId: context?.schoolId ?? getAppSchoolId(),
    metadata: {
      target_host: targetHost,
      target_url: cleanTargetUrl,
    },
  });
}

export function trackSearchResultClick(
  articleSlugOrId: string,
  query: string,
  rank?: number,
): void {
  void trackEvent({
    eventName: "search_result_click",
    eventCategory: "search",
    contentType: "article",
    contentId: articleSlugOrId,
    metadata: {
      query_length: query.trim().length,
      rank: rank ?? null,
    },
  });
}
