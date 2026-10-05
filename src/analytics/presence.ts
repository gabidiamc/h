import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { getAppLanguage, getDeviceContext, isExcludedAdminPath, sanitizePath } from "./device";
import { inferContentFromPath } from "./pageViews";
import {
  getCurrentSessionId,
  getOrCreateAnonymousId,
  hasSessionExpiredByInactivity,
  isValidUuid,
} from "./session";
import type { AnalyticsConfig } from "./types";

let heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
let currentPresencePath: string | null = null;
let currentPresenceContentType: string | null = null;
let currentPresenceContentId: string | null = null;
let currentPresenceLanguage: string | null = null;
let activeConfig: AnalyticsConfig | null = null;
let isSendingHeartbeat = false;

export function computeHeartbeatIntervalMs(config?: AnalyticsConfig | null): number {
  const timeoutSec = config?.presence_timeout_seconds ?? 60;
  const halfTimeoutSec = Math.floor(timeoutSec / 2);
  const clampedSec = Math.max(15, Math.min(45, halfTimeoutSec || 25));
  return clampedSec * 1000;
}

export function updatePresenceContext(context: {
  path?: string | null;
  contentType?: string | null;
  contentId?: string | null;
  language?: string | null;
}): void {
  if (context.path) {
    const clean = sanitizePath(context.path);
    currentPresencePath = clean;
    const inferred = inferContentFromPath(clean);
    currentPresenceContentType = context.contentType ?? inferred.contentType;
    currentPresenceContentId = context.contentId ?? inferred.contentId;
  } else {
    if (context.contentType !== undefined) {
      currentPresenceContentType = context.contentType;
    }
    if (context.contentId !== undefined) {
      currentPresenceContentId = context.contentId;
    }
  }

  if (context.language) {
    currentPresenceLanguage = context.language;
  }
}

export async function sendPresenceHeartbeatNow(
  explicitConfig?: AnalyticsConfig | null,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!isSupabaseConfigured()) return false;
  if (isSendingHeartbeat) return false;

  const cfg = explicitConfig !== undefined ? explicitConfig : activeConfig;
  if (cfg && !cfg.enabled) return false;

  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return false;
  }

  if (hasSessionExpiredByInactivity()) {
    return false;
  }

  const anonymousId = getOrCreateAnonymousId();
  const sessionId = getCurrentSessionId();
  if (!isValidUuid(anonymousId) || !isValidUuid(sessionId)) {
    return false;
  }

  const currentWindowPath = sanitizePath(window.location.pathname);
  const path = sanitizePath(currentPresencePath || currentWindowPath);
  if (isExcludedAdminPath(path) || isExcludedAdminPath(currentWindowPath)) {
    return false;
  }

  const inferred = inferContentFromPath(path);
  const contentType = currentPresenceContentType ?? inferred.contentType;
  const contentId = currentPresenceContentId ?? inferred.contentId;
  const language = currentPresenceLanguage || getAppLanguage();
  const device = getDeviceContext(cfg, language);

  isSendingHeartbeat = true;
  try {
    const { data, error } = await supabase.rpc("heartbeat_presence", {
      p_anonymous_id: anonymousId,
      p_session_id: sessionId,
      p_current_path: path,
      p_current_content_type: contentType ? String(contentType).slice(0, 64) : null,
      p_current_content_id: contentId ? String(contentId).slice(0, 128) : null,
      p_language: cfg?.track_language === false ? null : language,
      p_device_type: cfg?.track_device === false ? null : device.deviceType,
      p_is_pwa: cfg?.track_pwa === false ? false : device.isPwa,
    });

    return !error && Boolean(data);
  } catch {
    return false;
  } finally {
    isSendingHeartbeat = false;
  }
}

export function startPresenceHeartbeat(config: AnalyticsConfig | null): void {
  if (typeof window === "undefined") return;
  activeConfig = config;

  if (heartbeatIntervalId !== null) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }

  if (config && !config.enabled) {
    return;
  }

  const intervalMs = computeHeartbeatIntervalMs(config);

  void sendPresenceHeartbeatNow(config);

  heartbeatIntervalId = setInterval(() => {
    void sendPresenceHeartbeatNow(activeConfig);
  }, intervalMs);
}

export function stopPresenceHeartbeat(): void {
  if (heartbeatIntervalId !== null) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }
}
