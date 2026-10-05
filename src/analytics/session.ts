import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { getDeviceContext, isExcludedAdminPath, sanitizePath } from "./device";
import type { AnalyticsConfig } from "./types";

const ANONYMOUS_ID_STORAGE_KEY = "dmps_analytics_anonymous_id";
const SESSION_ID_STORAGE_KEY = "dmps_analytics_session_id";
const SESSION_LAST_ACTIVE_KEY = "dmps_analytics_session_last_active";

/** 30 minutes of inactivity triggers a new session */
export const SESSION_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let memoryAnonymousId: string | null = null;
let memorySessionId: string | null = null;
let memoryLastActiveMs = 0;
let sessionStartPromise: Promise<string | null> | null = null;
let sessionEnded = false;

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

export function generateCryptoUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
    bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  // Last-resort RFC4122 v4 fallback if crypto is unavailable in an exotic environment
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateAnonymousId(): string {
  if (memoryAnonymousId && isValidUuid(memoryAnonymousId)) {
    return memoryAnonymousId;
  }

  if (typeof window !== "undefined") {
    try {
      const existing = window.localStorage.getItem(ANONYMOUS_ID_STORAGE_KEY);
      if (existing && isValidUuid(existing)) {
        memoryAnonymousId = existing.trim();
        return memoryAnonymousId;
      }
    } catch {
      // localStorage blocked (e.g., strict private mode)
    }
  }

  const created = generateCryptoUuid();
  memoryAnonymousId = created;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ANONYMOUS_ID_STORAGE_KEY, created);
    } catch {
      // ignore storage quota/privacy errors
    }
  }

  return created;
}

function readStoredSession(): { sessionId: string | null; expired: boolean } {
  const now = Date.now();

  if (memorySessionId && isValidUuid(memorySessionId)) {
    const expired =
      memoryLastActiveMs > 0 && now - memoryLastActiveMs > SESSION_INACTIVITY_TIMEOUT_MS;
    if (!expired && !sessionEnded) {
      return { sessionId: memorySessionId, expired: false };
    }
  }

  if (typeof window !== "undefined") {
    try {
      const storedId = window.sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
      const storedLastActive = Number(
        window.sessionStorage.getItem(SESSION_LAST_ACTIVE_KEY) || "0",
      );
      if (storedId && isValidUuid(storedId)) {
        const isExpired =
          storedLastActive > 0 && now - storedLastActive > SESSION_INACTIVITY_TIMEOUT_MS;
        if (!isExpired && !sessionEnded) {
          memorySessionId = storedId;
          memoryLastActiveMs = storedLastActive || now;
          return { sessionId: storedId, expired: false };
        }
        return { sessionId: storedId, expired: true };
      }
    } catch {
      // ignore sessionStorage errors
    }
  }

  return { sessionId: null, expired: false };
}

export function touchSessionActivity(): void {
  const now = Date.now();
  memoryLastActiveMs = now;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, String(now));
    } catch {
      // ignore
    }
  }
}

export function hasSessionExpiredByInactivity(): boolean {
  if (!memorySessionId) return false;
  if (memoryLastActiveMs <= 0) return false;
  return Date.now() - memoryLastActiveMs > SESSION_INACTIVITY_TIMEOUT_MS;
}

export function getCurrentSessionId(): string | null {
  const { sessionId, expired } = readStoredSession();
  if (expired) return null;
  return sessionId;
}

function saveSessionId(sessionId: string): void {
  memorySessionId = sessionId;
  sessionEnded = false;
  touchSessionActivity();
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
    } catch {
      // ignore
    }
  }
}

export function clearCurrentSession(): void {
  memorySessionId = null;
  memoryLastActiveMs = 0;
  sessionEnded = true;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(SESSION_ID_STORAGE_KEY);
      window.sessionStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
    } catch {
      // ignore
    }
  }
}

export interface StartOrResumeSessionResult {
  anonymousId: string;
  sessionId: string;
  isNewSession: boolean;
}

export async function startOrResumeSession(
  config: AnalyticsConfig | null,
  landingPath?: string,
  explicitLang?: string | null,
): Promise<StartOrResumeSessionResult | null> {
  if (typeof window === "undefined") return null;
  if (config && !config.enabled) return null;

  const cleanPath = sanitizePath(landingPath || window.location.pathname);
  if (isExcludedAdminPath(cleanPath)) {
    return null;
  }

  const anonymousId = getOrCreateAnonymousId();
  const existing = readStoredSession();

  if (existing.sessionId && !existing.expired) {
    touchSessionActivity();
    return {
      anonymousId,
      sessionId: existing.sessionId,
      isNewSession: false,
    };
  }

  if (sessionStartPromise) {
    const pendingId = await sessionStartPromise;
    if (pendingId) {
      return {
        anonymousId,
        sessionId: pendingId,
        isNewSession: false,
      };
    }
  }

  const device = getDeviceContext(config, explicitLang);

  sessionStartPromise = (async () => {
    try {
      if (!isSupabaseConfigured()) {
        const localId = generateCryptoUuid();
        saveSessionId(localId);
        return localId;
      }

      const { data, error } = await supabase.rpc("record_session", {
        p_anonymous_id: anonymousId,
        p_landing_path: cleanPath,
        p_referrer: config?.track_referrer === false ? null : device.referrer,
        p_user_agent: device.userAgent || null,
        p_device_type: config?.track_device === false ? null : device.deviceType,
        p_browser: config?.track_browser === false ? null : device.browser,
        p_operating_system: config?.track_os === false ? null : device.operatingSystem,
        p_language: config?.track_language === false ? null : device.language || null,
        p_country: config?.track_country === false ? null : device.country,
        p_is_pwa: config?.track_pwa === false ? false : device.isPwa,
        p_session_id: null,
      });

      if (!error && data && isValidUuid(data)) {
        saveSessionId(data);
        return data;
      }
    } catch {
      // Analytics must never break the application
    }

    const fallbackId = generateCryptoUuid();
    saveSessionId(fallbackId);
    return fallbackId;
  })();

  try {
    const resolvedId = await sessionStartPromise;
    if (!resolvedId) return null;
    return {
      anonymousId,
      sessionId: resolvedId,
      isNewSession: true,
    };
  } finally {
    sessionStartPromise = null;
  }
}
