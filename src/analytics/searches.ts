import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { getAppLanguage, isExcludedAdminPath, sanitizePath } from "./device";
import { recordAnalyticsEvent } from "./events";
import { isValidUuid, touchSessionActivity } from "./session";
import type { AnalyticsConfig, SearchAnalyticsPayload } from "./types";

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_PATTERN = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

let lastSearchSignature: string | null = null;
let lastSearchAtMs = 0;
const DUPLICATE_SEARCH_GUARD_MS = 2500;

export function sanitizeSearchQuery(rawQuery: string): string {
  return rawQuery
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 200)
    .replace(EMAIL_PATTERN, "[redacted-email]")
    .replace(PHONE_PATTERN, "[redacted-phone]");
}

export function normalizeSearchQuery(rawQuery: string): string {
  return sanitizeSearchQuery(rawQuery)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function recordAnalyticsSearch(
  anonymousId: string,
  sessionId: string,
  config: AnalyticsConfig | null,
  payload: SearchAnalyticsPayload,
): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!isSupabaseConfigured()) return null;
  if (config && (!config.enabled || !config.track_searches)) return null;
  if (!isValidUuid(anonymousId) || !isValidUuid(sessionId)) return null;

  const cleanQuery = sanitizeSearchQuery(payload.query || "");
  if (!cleanQuery || cleanQuery.length < 2) return null;

  const normalizedQuery = normalizeSearchQuery(cleanQuery);
  const resultCount = Math.max(0, Math.floor(Number(payload.resultCount) || 0));
  const language = payload.language || getAppLanguage();
  const cleanPath = sanitizePath(payload.path || window.location.pathname);

  if (isExcludedAdminPath(cleanPath)) return null;

  const signature = `${sessionId}:${normalizedQuery}:${resultCount}:${language}`;
  const now = Date.now();
  if (lastSearchSignature === signature && now - lastSearchAtMs < DUPLICATE_SEARCH_GUARD_MS) {
    return null;
  }

  lastSearchSignature = signature;
  lastSearchAtMs = now;
  touchSessionActivity();

  let searchId: string | null = null;

  try {
    const { data, error } = await supabase.rpc("record_search", {
      p_anonymous_id: anonymousId,
      p_session_id: sessionId,
      p_query: cleanQuery,
      p_normalized_query: normalizedQuery,
      p_result_count: resultCount,
      p_language: config?.track_language === false ? null : language,
      p_path: cleanPath,
    });

    if (!error && data && isValidUuid(data)) {
      searchId = data;
    }
  } catch {
    // Analytics is best effort
  }

  // Record corresponding search / search_no_results event
  void recordAnalyticsEvent(anonymousId, sessionId, config, {
    eventName: resultCount === 0 ? "search_no_results" : "search",
    eventCategory: "search",
    path: cleanPath,
    contentType: "search",
    contentId: normalizedQuery.slice(0, 64),
    schoolId: payload.schoolId ?? null,
    language,
    metadata: {
      result_count: resultCount,
      query_length: cleanQuery.length,
      has_results: resultCount > 0,
    },
  });

  return searchId;
}
