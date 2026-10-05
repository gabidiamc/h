import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import {
  getAppLanguage,
  getAppSchoolId,
  getDeviceContext,
  isExcludedAdminPath,
  sanitizePath,
} from "./device";
import { isValidUuid, touchSessionActivity } from "./session";
import type { AnalyticsConfig, AnalyticsContentType, PageViewPayload } from "./types";

let currentPageViewId: string | null = null;
let lastTrackedPath: string | null = null;
let lastTrackedAtMs = 0;

/** Prevent duplicate page_view calls from StrictMode or rapid re-renders on the same path */
const DUPLICATE_PAGE_VIEW_GUARD_MS = 1500;

export function inferContentFromPath(rawPath: string): {
  contentType: AnalyticsContentType;
  contentId: string | null;
} {
  const path = sanitizePath(rawPath);

  if (path === "/" || path === "") {
    return { contentType: "home", contentId: "home" };
  }

  const segments = path.split("/").filter(Boolean);
  const first = segments[0]?.toLowerCase() || "";
  const second = segments[1] ? decodeURIComponent(segments[1]) : null;

  if (first === "articles" && second) {
    return { contentType: "article", contentId: second };
  }
  if (first === "topics") {
    if (second) {
      return { contentType: "category", contentId: second };
    }
    return { contentType: "topics", contentId: "topics" };
  }
  if (first === "search") {
    return { contentType: "search", contentId: "search" };
  }
  if (first === "faq") {
    return { contentType: "faq", contentId: "faq" };
  }
  if (first === "announcements") {
    return { contentType: "announcements", contentId: "announcements" };
  }
  if (first === "contact") {
    return { contentType: "contact", contentId: "contact" };
  }
  if (first === "apps") {
    return { contentType: "apps", contentId: "apps" };
  }
  if (first === "programas") {
    return { contentType: "programs", contentId: second || "programas" };
  }
  if (first === "programas-estudiantes") {
    return { contentType: "student_programs", contentId: second || "programas-estudiantes" };
  }
  if (first === "deportes-actividades" || first === "equipos") {
    return { contentType: "activities", contentId: second || first };
  }
  if (first === "escuelas") {
    return { contentType: "schools", contentId: second || "escuelas" };
  }
  if (first === "calendario" || first === "horario-campanas") {
    return { contentType: "calendar", contentId: first };
  }
  if (first === "transporte") {
    return { contentType: "transportation", contentId: second || "transporte" };
  }
  if (first === "voluntarios" || first === "empleos" || first === "bfl-status") {
    return { contentType: "volunteers", contentId: first };
  }
  if (first === "podcasts") {
    return { contentType: "podcast", contentId: second || "podcasts" };
  }

  return { contentType: "page", contentId: path };
}

export function getCurrentPageViewId(): string | null {
  return currentPageViewId;
}

export function getLastTrackedPath(): string | null {
  return lastTrackedPath;
}

export function resetPageViewState(): void {
  currentPageViewId = null;
  lastTrackedPath = null;
  lastTrackedAtMs = 0;
}

export async function recordAnalyticsPageView(
  anonymousId: string,
  sessionId: string,
  config: AnalyticsConfig | null,
  payload: PageViewPayload,
): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!isSupabaseConfigured()) return null;
  if (config && (!config.enabled || !config.track_page_views)) return null;
  if (!isValidUuid(anonymousId) || !isValidUuid(sessionId)) return null;

  const cleanPath = sanitizePath(payload.path);
  if (isExcludedAdminPath(cleanPath)) return null;

  const now = Date.now();
  if (lastTrackedPath === cleanPath && now - lastTrackedAtMs < DUPLICATE_PAGE_VIEW_GUARD_MS) {
    return currentPageViewId;
  }

  lastTrackedPath = cleanPath;
  lastTrackedAtMs = now;
  touchSessionActivity();

  const inferred = inferContentFromPath(cleanPath);
  const contentType = payload.contentType ?? inferred.contentType;
  const contentId = payload.contentId ?? inferred.contentId;
  const language = payload.language || getAppLanguage();
  const schoolId = payload.schoolId ?? getAppSchoolId();
  const device = getDeviceContext(config, language);
  const title =
    payload.title ??
    (typeof document !== "undefined" && document.title ? document.title.slice(0, 300) : null);

  const previousPageViewId = currentPageViewId;

  try {
    const { data, error } = await supabase.rpc("record_page_view", {
      p_anonymous_id: anonymousId,
      p_session_id: sessionId,
      p_path: cleanPath,
      p_title: title,
      p_content_type: contentType ? String(contentType).slice(0, 64) : null,
      p_content_id: contentId ? String(contentId).slice(0, 128) : null,
      p_school_id: schoolId ? String(schoolId).slice(0, 64) : null,
      p_language: config?.track_language === false ? null : language,
      p_referrer: config?.track_referrer === false ? null : device.referrer,
      p_device_type: config?.track_device === false ? null : device.deviceType,
      p_browser: config?.track_browser === false ? null : device.browser,
      p_operating_system: config?.track_os === false ? null : device.operatingSystem,
      p_is_pwa: config?.track_pwa === false ? false : device.isPwa,
      p_previous_page_view_id: previousPageViewId,
    });

    if (!error && data && isValidUuid(data)) {
      currentPageViewId = data;
      return data;
    }
  } catch {
    // Analytics must never interrupt the user experience
  }

  return null;
}
