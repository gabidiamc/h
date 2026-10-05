/* eslint-disable @typescript-eslint/no-explicit-any */
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { notifySaveSuccess } from "./storage-engine";
import { notifyContentUpdated } from "./sync";
import { getCachedSiteSetting, saveSiteSetting } from "./site-settings-service";

export type CalendarSettings = {
  id?: string;
  schoolId?: string;
  // Spanish (Español)
  imageUrl: string;
  pdfUrl: string;
  title: string;
  subtitle: string;
  // English (Inglés)
  imageUrlEn?: string;
  pdfUrlEn?: string;
  titleEn?: string;
  subtitleEn?: string;
  lastUpdated?: string;
  updated_at?: string;
};

const DEFAULT_TIMESTAMP = "2020-01-01T00:00:00.000Z";

const DEFAULT_CALENDAR_ENTRY: CalendarSettings = {
  id: "calendar_lincoln",
  schoolId: "lincoln",
  imageUrl:
    "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1600&auto=format&fit=crop&q=80",
  pdfUrl: "",
  title: "Calendario Escolar 2026-2027 — Des Moines Public Schools",
  subtitle: "Días de clase, conferencias, festivos y eventos oficiales.",
  imageUrlEn:
    "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1600&auto=format&fit=crop&q=80",
  pdfUrlEn: "",
  titleEn: "2026-2027 School Calendar — Des Moines Public Schools",
  subtitleEn: "School days, family conferences, holidays, and official key dates.",
  lastUpdated: DEFAULT_TIMESTAMP,
  updated_at: DEFAULT_TIMESTAMP,
};

function normalizeCalendarSettings(
  schoolId: string,
  raw?: Partial<CalendarSettings> | null,
): CalendarSettings {
  if (!raw) {
    return {
      ...DEFAULT_CALENDAR_ENTRY,
      id: `calendar_${schoolId}`,
      schoolId,
    };
  }

  const imageUrl = typeof raw.imageUrl === "string" ? raw.imageUrl : "";
  const pdfUrl = typeof raw.pdfUrl === "string" ? raw.pdfUrl : "";
  const hasExplicitEn = typeof raw.imageUrlEn === "string" || typeof raw.pdfUrlEn === "string";
  const imageUrlEn = hasExplicitEn ? (raw.imageUrlEn ?? "") : imageUrl;
  const pdfUrlEn = hasExplicitEn ? (raw.pdfUrlEn ?? "") : pdfUrl;

  return {
    id: raw.id || `calendar_${schoolId}`,
    schoolId,
    imageUrl,
    pdfUrl,
    title: raw.title || DEFAULT_CALENDAR_ENTRY.title,
    subtitle: raw.subtitle || DEFAULT_CALENDAR_ENTRY.subtitle,
    imageUrlEn,
    pdfUrlEn,
    titleEn: raw.titleEn || raw.title || DEFAULT_CALENDAR_ENTRY.titleEn,
    subtitleEn: raw.subtitleEn || raw.subtitle || DEFAULT_CALENDAR_ENTRY.subtitleEn,
    lastUpdated: raw.lastUpdated || raw.updated_at || DEFAULT_TIMESTAMP,
    updated_at: raw.updated_at || raw.lastUpdated || DEFAULT_TIMESTAMP,
  };
}

function parseCalendarTimestamp(entry?: CalendarSettings | null): number {
  if (!entry) return 0;
  const stamp = entry.updated_at || entry.lastUpdated || DEFAULT_TIMESTAMP;
  const parsed = Date.parse(stamp);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickNewestCalendarRow(
  rows: CalendarSettings[],
  schoolId: string,
): CalendarSettings | null {
  if (!rows || rows.length === 0) return null;
  const scoped = rows.filter((r) => r.schoolId === schoolId);
  const pool = scoped.length > 0 ? scoped : rows;
  const sorted = [...pool].sort((a, b) => parseCalendarTimestamp(b) - parseCalendarTimestamp(a));
  return sorted[0] ? normalizeCalendarSettings(schoolId, sorted[0]) : null;
}

export function getCalendarSettings(schoolId: string = "lincoln"): CalendarSettings {
  return normalizeCalendarSettings(schoolId, null);
}

export async function fetchCalendarSettings(
  schoolId: string = "lincoln",
): Promise<CalendarSettings> {
  try {
    const raw = await getCachedSiteSetting<CalendarSettings[]>("school_calendars", []);
    if (raw && Array.isArray(raw)) {
      const picked = pickNewestCalendarRow(raw, schoolId);
      if (picked) return picked;
    }
  } catch (e) {
    console.warn("Error fetching calendar settings from Supabase:", e);
  }

  return normalizeCalendarSettings(schoolId, null);
}

export async function saveCalendarSettings(
  schoolId: string,
  settings: CalendarSettings,
  options?: { silent?: boolean },
): Promise<CalendarSettings> {
  const now = new Date().toISOString();
  const normalizedLincoln = normalizeCalendarSettings("lincoln", {
    ...settings,
    lastUpdated: now,
    updated_at: now,
  });
  const normalizedEast = normalizeCalendarSettings("east", {
    ...settings,
    lastUpdated: now,
    updated_at: now,
  });

  const payload = [normalizedLincoln, normalizedEast];
  await saveSiteSetting("school_calendars", payload);

  notifyContentUpdated("site_settings");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dmps-calendar-updated"));
  }

  if (!options?.silent) {
    notifySaveSuccess("¡Calendario escolar guardado de forma permanente en Supabase!");
  }

  return schoolId === "east" ? normalizedEast : normalizedLincoln;
}
