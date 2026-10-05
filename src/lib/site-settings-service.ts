/* eslint-disable @typescript-eslint/no-explicit-any */
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export const SITE_SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms
export const SITE_SETTINGS_STALE_TIME = 5 * 60 * 1000; // 5 minutes in ms
export const SITE_SETTINGS_GC_TIME = 30 * 60 * 1000; // 30 minutes in ms

export const SITE_SETTINGS_QUERY_OPTIONS = {
  staleTime: SITE_SETTINGS_STALE_TIME,
  gcTime: SITE_SETTINGS_GC_TIME,
  refetchOnWindowFocus: false,
} as const;

export const POPUP_SETTINGS_KEY = "popup_announcement";

export type PopupAnnouncement = {
  enabled: boolean;
  title: string;
  message: string;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  background_color: string;
  text_color: string;
  accent_color: string;
  updated_at: string;
};

export const DEFAULT_POPUP: PopupAnnouncement = {
  enabled: false,
  title: "",
  message: "",
  image_url: null,
  link_url: null,
  link_label: null,
  background_color: "#ffffff",
  text_color: "#111827",
  accent_color: "#1d4ed8",
  updated_at: new Date(0).toISOString(),
};

interface SettingCacheEntry<T = unknown> {
  value: T;
  timestamp: number;
}

const settingsMemoryCache = new Map<string, SettingCacheEntry<any>>();
const inFlightPromises = new Map<string, Promise<any>>();

/**
 * Invalidates the in-memory cache for a specific site_settings key or for all keys.
 */
export function invalidateSiteSettingCache(key?: string): void {
  if (key) {
    settingsMemoryCache.delete(key);
    inFlightPromises.delete(key);
  } else {
    settingsMemoryCache.clear();
    inFlightPromises.clear();
  }
}

/**
 * Retrieves a cached site setting by its key with in-flight request deduplication,
 * explicit select("value") projection, and 5-minute TTL.
 */
export async function getCachedSiteSetting<T = unknown>(
  key: string,
  defaultValue: T | null = null,
): Promise<T | null> {
  const now = Date.now();
  const cached = settingsMemoryCache.get(key);
  if (cached && now - cached.timestamp < SITE_SETTINGS_CACHE_TTL) {
    return cached.value as T;
  }

  const existingInFlight = inFlightPromises.get(key);
  if (existingInFlight) {
    return (await existingInFlight) as T;
  }

  const inFlight = (async (): Promise<T | null> => {
    try {
      if (!isSupabaseConfigured()) {
        return (settingsMemoryCache.get(key)?.value as T) ?? defaultValue;
      }

      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();

      if (error) {
        console.warn(`[SiteSettingsService] Notice fetching '${key}':`, error);
        return (settingsMemoryCache.get(key)?.value as T) ?? defaultValue;
      }

      const rawVal = data?.value !== undefined && data?.value !== null ? data.value : defaultValue;
      settingsMemoryCache.set(key, {
        value: rawVal,
        timestamp: Date.now(),
      });
      return rawVal as T;
    } catch (err) {
      console.warn(`[SiteSettingsService] Exception fetching '${key}':`, err);
      return (settingsMemoryCache.get(key)?.value as T) ?? defaultValue;
    } finally {
      inFlightPromises.delete(key);
    }
  })();

  inFlightPromises.set(key, inFlight);
  return inFlight;
}

/**
 * Persists a setting directly to Supabase site_settings and updates the local cache.
 */
export async function saveSiteSetting<T = unknown>(key: string, value: T): Promise<T> {
  const payload = {
    key,
    value: value as any,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from("site_settings")
      .upsert(payload, { onConflict: "key" });

    if (error) {
      console.error(`[SiteSettingsService] Save error for '${key}':`, error);
      throw error;
    }
  }

  settingsMemoryCache.set(key, {
    value,
    timestamp: Date.now(),
  });

  return value;
}

/**
 * Dedicated cached accessor for popup_announcement.
 */
export async function fetchPopupAnnouncement(): Promise<PopupAnnouncement> {
  const res = await getCachedSiteSetting<PopupAnnouncement>(POPUP_SETTINGS_KEY, DEFAULT_POPUP);
  if (!res) return DEFAULT_POPUP;
  return { ...DEFAULT_POPUP, ...res };
}

/**
 * Dedicated persistence method for popup_announcement.
 */
export async function savePopupAnnouncement(value: PopupAnnouncement): Promise<PopupAnnouncement> {
  const payload = { ...value, updated_at: new Date().toISOString() };
  await saveSiteSetting(POPUP_SETTINGS_KEY, payload);
  return payload;
}
