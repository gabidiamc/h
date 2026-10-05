/* eslint-disable @typescript-eslint/no-explicit-any */
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { LanguageCode } from "./i18n";
import { pickTranslation } from "./content";
import { filterBySchool, filterBySchoolStrict } from "./school-scope";
import {
  computeContentStatus,
  isItemActive,
  isItemUpcoming,
  isRegistrationOpen,
  type ContentStatus,
} from "./content-lifecycle";

/* ---------------- appearance ---------------- */

export type AppearanceRow = {
  id: string;
  logo_url: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  pwa_icon_url?: string | null;
  application_logo_storage_path?: string | null;
  favicon_storage_path?: string | null;
  pwa_icon_storage_path?: string | null;
  branding_version?: string | null;
  logo_height: number;
  logo_alt: string | null;
  show_wordmark: boolean;
  light_theme: Record<string, string>;
  dark_theme: Record<string, string>;
  settings?: Record<string, any>;
};

export async function fetchAppearance(): Promise<AppearanceRow | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from("appearance_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Compatibility with the temporary bootstrap schema that only had `settings`.
    // New writes use the canonical columns above.
    const row = data as Record<string, unknown>;
    const legacy =
      row.settings && typeof row.settings === "object"
        ? (row.settings as Record<string, unknown>)
        : {};

    return {
      id: String(row.id ?? "default"),
      logo_url: (row.logo_url ?? legacy.logo_url ?? null) as string | null,
      logo_light_url: (row.logo_light_url ?? legacy.logo_light_url ?? null) as string | null,
      logo_dark_url: (row.logo_dark_url ?? legacy.logo_dark_url ?? null) as string | null,
      favicon_url: (row.favicon_url ?? legacy.favicon_url ?? null) as string | null,
      pwa_icon_url: (row.pwa_icon_url ?? legacy.pwa_icon_url ?? null) as string | null,
      application_logo_storage_path: (row.application_logo_storage_path ??
        legacy.application_logo_storage_path ??
        null) as string | null,
      favicon_storage_path: (row.favicon_storage_path ?? legacy.favicon_storage_path ?? null) as
        string | null,
      pwa_icon_storage_path: (row.pwa_icon_storage_path ?? legacy.pwa_icon_storage_path ?? null) as
        string | null,
      branding_version: String(row.branding_version ?? legacy.branding_version ?? "1"),
      logo_height: Number(row.logo_height ?? legacy.logo_height ?? 56),
      logo_alt: (row.logo_alt ?? legacy.logo_alt ?? null) as string | null,
      show_wordmark: Boolean(row.show_wordmark ?? legacy.show_wordmark ?? true),
      light_theme: (row.light_theme ?? legacy.light_theme ?? {}) as Record<string, string>,
      dark_theme: (row.dark_theme ?? legacy.dark_theme ?? {}) as Record<string, string>,
      settings: legacy,
    };
  } catch {
    return null;
  }
}

/* ---------------- schools ---------------- */

export type SchoolRow = {
  id: string;
  slug: string;
  name: string;
  level: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  website_url: string | null;
  hours: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  is_visible: boolean;
  verified_at: string | null;
  school_translations?: { language_code: string; name: string; description: string | null }[];
};

/* ---------------- schools ---------------- */

export async function fetchSchools(): Promise<SchoolRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const [schRes, trRes] = await Promise.all([
        supabase.from("schools").select("*").order("name", { ascending: true }),
        supabase
          .from("school_translations")
          .select("id, school_id, language_code, name, description, updated_at"),
      ]);
      if (!schRes.error && schRes.data) {
        const allTrs = Array.isArray(trRes.data) ? (trRes.data as Record<string, any>[]) : [];
        return (schRes.data as unknown as SchoolRow[])
          .filter((s) => s.is_visible !== false)
          .map((s) => ({
            ...s,
            school_translations: allTrs.filter(
              (t) => String(t.school_id) === String(s.id),
            ) as SchoolRow["school_translations"],
          }));
      }
    } catch {
      // ignore
    }
  }

  return [];
}

export async function fetchSchoolBySlug(slug: string): Promise<SchoolRow | null> {
  const all = await fetchSchools();
  return all.find((s) => s.slug === slug || s.id === slug) ?? null;
}

export function localizedSchool(s: SchoolRow, lang: LanguageCode) {
  const tr = pickTranslation(s.school_translations ?? [], lang) as {
    name: string;
    description: string | null;
  } | null;
  return { name: tr?.name ?? s.name, description: tr?.description ?? s.description };
}

/* ---------------- programs ---------------- */

export type ProgramRow = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  program_type: string;
  school_level: string | null;
  school_id?: string | null;
  grades: string | null;
  languages: string[];
  is_free: boolean;
  cost: string | null;
  enrollment_open: boolean;
  start_date: string | null;
  end_date: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  registration_starts_at?: string | null;
  registration_ends_at?: string | null;
  requirements: string | null;
  application_process: string | null;
  image_url: string | null;
  card_banner_url?: string | null;
  card_bg?: string | null;
  video_url: string | null;
  official_url: string | null;
  contact_id: string | null;
  category_id: string | null;
  status: string;
  archived_at?: string | null;
  timezone?: string | null;
  verified_at: string | null;
  program_translations?: {
    language_code: string;
    name: string;
    summary: string | null;
    description: string | null;
    requirements?: string | null;
    application_process?: string | null;
  }[];
};

export async function fetchPrograms(schoolId?: string): Promise<ProgramRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const [progRes, trRes] = await Promise.all([
        supabase.from("programs").select("*").order("name", { ascending: true }),
        supabase
          .from("program_translations")
          .select("id, program_id, language_code, name, summary, description, updated_at"),
      ]);
      if (!progRes.error && progRes.data) {
        const allTrs = Array.isArray(trRes.data) ? (trRes.data as Record<string, any>[]) : [];
        const mapped = (progRes.data as unknown as Record<string, any>[])
          .filter((r) => !r.status || r.status === "published")
          .map((r) => {
            let docMeta: Record<string, any> = {};
            if (Array.isArray(r.documents) && r.documents.length > 0) {
              const firstDoc = r.documents[0];
              if (firstDoc && typeof firstDoc === "object" && firstDoc._meta) {
                docMeta = firstDoc._meta;
              }
            }
            return {
              ...r,
              program_translations: allTrs.filter((t) => String(t.program_id) === String(r.id)),
              program_type: r.program_type ?? docMeta.program_type ?? "Académico",
              school_level: r.school_level ?? docMeta.school_level ?? null,
              school_id: r.school_id ?? docMeta.school_id ?? null,
              official_url: r.official_url ?? docMeta.official_url ?? null,
              video_url: r.video_url ?? docMeta.video_url ?? null,
              requirements: r.requirements ?? docMeta.requirements ?? null,
              card_banner_url: r.card_banner_url ?? docMeta.card_banner_url ?? null,
              card_bg: r.card_bg ?? docMeta.card_bg ?? null,
            } as ProgramRow;
          });
        return filterBySchool(mapped, schoolId);
      }
    } catch {
      // ignore
    }
  }
  return [];
}

export function localizedProgram(p: ProgramRow, lang: LanguageCode) {
  const tr = pickTranslation(p.program_translations ?? [], lang) as {
    name: string;
    summary: string | null;
    description: string | null;
    requirements?: string | null;
    application_process?: string | null;
  } | null;
  return {
    name: tr?.name ?? p.name,
    summary: tr?.summary ?? p.summary,
    description: tr?.description ?? p.description,
    requirements: tr?.requirements ?? p.requirements,
    application_process: tr?.application_process ?? p.application_process,
  };
}

/* ---------------- activities ---------------- */

export type ActivityRow = {
  id: string;
  slug: string;
  name: string;
  activity_type: string;
  season: string | null;
  school_id: string | null;
  school_level: string | null;
  grades: string | null;
  gender: string | null;
  description: string | null;
  schedule: string | null;
  location: string | null;
  requirements: string | null;
  forms_url: string | null;
  registration_info: string | null;
  official_url: string | null;
  image_url: string | null;
  contact_id: string | null;
  enrollment_open: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  registration_starts_at?: string | null;
  registration_ends_at?: string | null;
  archived_at?: string | null;
  status: string;
  updated_at: string;
  activity_translations?: { language_code: string; name: string; description: string | null }[];
};

export async function fetchActivities(schoolId?: string): Promise<ActivityRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const [actRes, trRes] = await Promise.all([
        supabase.from("activities").select("*").order("name", { ascending: true }),
        supabase
          .from("activity_translations")
          .select("id, activity_id, language_code, name, description, updated_at"),
      ]);
      if (!actRes.error && actRes.data) {
        const allTrs = Array.isArray(trRes.data) ? (trRes.data as Record<string, any>[]) : [];
        const published = (actRes.data as unknown as ActivityRow[])
          .filter((a) => !a.status || a.status === "published")
          .map((a) => ({
            ...a,
            activity_translations: allTrs.filter(
              (t) => String(t.activity_id) === String(a.id),
            ) as ActivityRow["activity_translations"],
          }));
        return filterBySchool(published, schoolId);
      }
    } catch {
      // ignore
    }
  }
  return [];
}

export function localizedActivity(a: ActivityRow, lang: LanguageCode) {
  const tr = pickTranslation(a.activity_translations ?? [], lang) as {
    name: string;
    description: string | null;
  } | null;
  return { name: tr?.name ?? a.name, description: tr?.description ?? a.description };
}

/* ---------------- events ---------------- */

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  registration_starts_at?: string | null;
  registration_ends_at?: string | null;
  all_day: boolean;
  location: string | null;
  school_id: string | null;
  category_id: string | null;
  event_type: string;
  image_url: string | null;
  official_url: string | null;
  is_featured: boolean;
  is_cancelled: boolean;
  is_postponed?: boolean;
  status: string;
  archived_at?: string | null;
  timezone?: string | null;
  event_translations?: { language_code: string; title: string; description: string | null }[];
};

/* ---------------- events ---------------- */

export async function fetchEvents(schoolId?: string): Promise<EventRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const [evRes, trRes] = await Promise.all([
        supabase.from("events").select("*").order("starts_at", { ascending: true }),
        supabase
          .from("event_translations")
          .select("id, event_id, language_code, title, description, updated_at"),
      ]);
      if (!evRes.error && evRes.data) {
        const allTrs = Array.isArray(trRes.data) ? (trRes.data as Record<string, any>[]) : [];
        const mapped = (evRes.data as unknown as Record<string, any>[])
          .filter((r) => !r.status || r.status === "published")
          .map((r) => ({
            ...r,
            event_translations: allTrs.filter((t) => String(t.event_id) === String(r.id)),
            start_date: r.start_date || (r.starts_at ? String(r.starts_at).slice(0, 10) : ""),
            end_date:
              r.end_date !== undefined
                ? r.end_date
                : r.ends_at
                  ? String(r.ends_at).slice(0, 10)
                  : null,
            official_url: r.official_url ?? r.source_url ?? null,
          }));
        return filterBySchool(mapped as unknown as EventRow[], schoolId);
      }
    } catch {
      // ignore
    }
  }
  return [];
}

export async function fetchActiveEvents(schoolId?: string): Promise<EventRow[]> {
  const all = await fetchEvents(schoolId);
  return all.filter((e) => isItemActive(e));
}

export async function fetchUpcomingEvents(schoolId?: string): Promise<EventRow[]> {
  const all = await fetchEvents(schoolId);
  return all.filter((e) => isItemUpcoming(e) || isItemActive(e));
}

export function localizedEvent(e: EventRow, lang: LanguageCode) {
  const tr = pickTranslation(e.event_translations ?? [], lang) as {
    title: string;
    description: string | null;
  } | null;
  return { title: tr?.title ?? e.title, description: tr?.description ?? e.description };
}

/* ---------------- contacts ---------------- */

export type ContactRow = {
  id: string;
  department: string;
  person_name: string | null;
  job_title: string | null;
  phone: string | null;
  extension: string | null;
  email: string | null;
  website?: string | null;
  address: string | null;
  hours: string | null;
  languages: string[];
  school_id: string | null;
  category_ids: string[];
  verification_status: string;
  verified_at: string | null;
  is_visible: boolean;
  avatar_url?: string | null;
  avatar_scale?: number | null;
  avatar_x?: number | null;
  avatar_y?: number | null;
  avatar_rotate?: number | null;
  bio?: string | null;
  role_type?: "liaison" | "principal" | "counselor" | "department" | "nurse" | "support" | string;
};

export async function fetchContacts(schoolId?: string): Promise<ContactRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("display_order", { ascending: true });
      if (!error && Array.isArray(data)) {
        const rows = (data as unknown as Record<string, any>[])
          .map((r) => {
            const rawCats: string[] = Array.isArray(r.category_ids) ? r.category_ids : [];
            const metaEntry = rawCats.find(
              (c) => typeof c === "string" && c.startsWith("__meta__:"),
            );
            let meta: Record<string, any> = {};
            if (metaEntry) {
              try {
                meta = JSON.parse(metaEntry.slice(9));
              } catch {
                meta = {};
              }
            }
            const cleanCats = rawCats.filter(
              (c) => !(typeof c === "string" && c.startsWith("__meta__:")),
            );
            return {
              ...r,
              ...meta,
              person_name: r.person_name ?? r.name ?? null,
              job_title: r.job_title ?? r.role_title ?? null,
              is_visible: meta.is_visible ?? r.is_visible ?? r.is_active ?? true,
              category_ids: cleanCats,
            } as ContactRow;
          })
          .filter((c) => c.is_visible !== false);

        return filterBySchool(rows, schoolId);
      }
    } catch {
      // ignore
    }
  }

  return [];
}

/* ---------------- family reports ---------------- */

export async function submitUpdateRequest(input: {
  kind: string;
  message: string;
  page_url?: string | undefined;
  entity_type?: string | undefined;
  entity_id?: string | undefined;
  reporter_email?: string | undefined;
}) {
  try {
    const { error } = await supabase.from("update_requests").insert({
      kind: input.kind,
      message: input.message.slice(0, 2000),
      page_url: input.page_url ?? null,
      entity_type: input.entity_type ?? null,
      entity_id: input.entity_id ?? null,
      reporter_email: input.reporter_email?.slice(0, 200) || null,
    });
    if (error) console.warn("submitUpdateRequest error:", error);
  } catch (e) {
    console.warn("submitUpdateRequest exception:", e);
  }
}

/* ---------------- official sources ---------------- */

export type OfficialSourceRow = {
  id: string;
  name: string;
  url: string;
  source_type: string;
  category_id: string | null;
  last_reviewed_at: string | null;
  link_status: string;
  notes: string | null;
  images_allowed: boolean;
  is_verified: boolean;
};

export async function fetchSources(): Promise<OfficialSourceRow[]> {
  try {
    const { data, error } = await supabase
      .from("official_sources")
      .select("*")
      .order("name", { ascending: true });
    if (error) return [];
    return (data ?? []) as unknown as OfficialSourceRow[];
  } catch {
    return [];
  }
}

export function formatEventDate(e: EventRow, lang: LanguageCode) {
  const locale = lang;
  const start = new Date(`${e.start_date}T12:00:00`);
  const fmt = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  let label = fmt.format(start);
  if (e.end_date && e.end_date !== e.start_date) {
    label += ` – ${fmt.format(new Date(`${e.end_date}T12:00:00`))}`;
  }
  if (!e.all_day && e.start_time) label += ` · ${e.start_time.slice(0, 5)}`;
  return label;
}
