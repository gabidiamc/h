import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getAppLanguage, getAppSchoolId, isExcludedAdminPath, sanitizePath } from "./device";
import { inferContentFromPath } from "./pageViews";
import { isValidUuid, touchSessionActivity } from "./session";
import type { AnalyticsConfig, AnalyticsEventPayload } from "./types";

const FORBIDDEN_METADATA_KEYS = new Set([
  "email",
  "e-mail",
  "mail",
  "phone",
  "phone_number",
  "telephone",
  "mobile",
  "cell",
  "name",
  "first_name",
  "last_name",
  "full_name",
  "username",
  "user_name",
  "address",
  "street",
  "ssn",
  "dob",
  "birth_date",
  "password",
  "secret",
  "token",
  "access_token",
  "refresh_token",
  "auth_token",
  "id_token",
  "ip",
  "ip_address",
  "client_ip",
  "cookie",
  "cookies",
  "authorization",
]);

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_PATTERN = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

export function sanitizeMetadataValue(val: Json | undefined, depth = 0): Json | undefined {
  if (val === undefined || val === null) return null;
  if (typeof val === "boolean" || typeof val === "number") return val;
  if (typeof val === "string") {
    return val
      .slice(0, 300)
      .replace(EMAIL_PATTERN, "[redacted-email]")
      .replace(PHONE_PATTERN, "[redacted-phone]");
  }
  if (depth > 2) return null;

  if (Array.isArray(val)) {
    return val.slice(0, 20).map((item) => sanitizeMetadataValue(item, depth + 1) ?? null);
  }

  if (typeof val === "object") {
    const out: Record<string, Json | undefined> = {};
    for (const [k, v] of Object.entries(val)) {
      const normalizedKey = k.trim().toLowerCase();
      if (FORBIDDEN_METADATA_KEYS.has(normalizedKey)) continue;
      const cleanVal = sanitizeMetadataValue(v, depth + 1);
      if (cleanVal !== undefined) {
        out[k.slice(0, 64)] = cleanVal;
      }
    }
    return out;
  }

  return null;
}

export function sanitizeEventMetadata(
  metadata?: Record<string, Json | undefined>,
): Record<string, Json> {
  if (!metadata || typeof metadata !== "object") return {};
  const cleaned = sanitizeMetadataValue(metadata, 0);
  if (cleaned && typeof cleaned === "object" && !Array.isArray(cleaned)) {
    return cleaned as Record<string, Json>;
  }
  return {};
}

export async function recordAnalyticsEvent(
  anonymousId: string,
  sessionId: string,
  config: AnalyticsConfig | null,
  payload: AnalyticsEventPayload,
): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!isSupabaseConfigured()) return null;
  if (config && (!config.enabled || !config.track_events)) return null;
  if (!isValidUuid(anonymousId) || !isValidUuid(sessionId)) return null;

  const eventName = payload.eventName?.trim();
  if (!eventName) return null;

  const cleanPath = sanitizePath(payload.path || window.location.pathname);
  if (isExcludedAdminPath(cleanPath)) return null;

  if (eventName !== "session_end" && eventName !== "page_exit") {
    touchSessionActivity();
  }

  const inferred = inferContentFromPath(cleanPath);
  const contentType = payload.contentType ?? inferred.contentType;
  const contentId = payload.contentId ?? inferred.contentId;
  const schoolId = payload.schoolId ?? getAppSchoolId();
  const language = payload.language || getAppLanguage();
  const safeMetadata = sanitizeEventMetadata(payload.metadata);

  try {
    const { data, error } = await supabase.rpc("record_event", {
      p_anonymous_id: anonymousId,
      p_session_id: sessionId,
      p_event_name: eventName.slice(0, 100),
      p_event_category: payload.eventCategory ? String(payload.eventCategory).slice(0, 64) : null,
      p_path: cleanPath,
      p_content_type: contentType ? String(contentType).slice(0, 64) : null,
      p_content_id: contentId ? String(contentId).slice(0, 128) : null,
      p_school_id: schoolId ? String(schoolId).slice(0, 64) : null,
      p_language: config?.track_language === false ? null : language,
      p_metadata: safeMetadata,
    });

    if (!error && data && isValidUuid(data)) {
      return data;
    }
  } catch {
    // Analytics must never throw or block the UI
  }

  return null;
}
