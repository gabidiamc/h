export type GenderGroup = "Girls" | "Boys" | "Coed" | "Activity";
export type BoundCategory = "girls" | "boys" | "coed" | "extracurricular" | "girls_coop";
export type BoundActivityType = "sport" | "coop" | "extracurricular" | "club";

export type BoundStatus =
  | "En temporada"
  | "Próximamente"
  | "Fuera de temporada"
  | "Registro abierto"
  | "Registro cerrado"
  | "Sin fechas publicadas"
  | "Información pendiente de actualización";

export type BoundEventStatus =
  "Programado" | "En curso" | "Finalizado" | "Cancelado" | "Pospuesto" | "Reprogramado";

export interface BoundActivity {
  id: string;
  bound_id: string;
  name: string;
  translated_name: string | null;
  slug: string;
  category: BoundCategory;
  gender_group: GenderGroup;
  activity_type: BoundActivityType;
  official_url: string;
  registration_url: string | null;
  icon_url: string | null;
  card_banner_url?: string | null;
  card_bg?: string | null;
  season: "Fall" | "Winter" | "Spring" | "Summer" | "Year-Round";
  status: BoundStatus;
  is_active: boolean;
  verified_at: string;
  updated_at: string;
  levels?: string[];
}

export interface BoundTeam {
  id: string;
  activity_id: string;
  bound_team_id: string;
  name: string;
  level: "Varsity" | "Junior Varsity" | "Freshman" | "Middle School" | "Coop Varsity" | "Coop JV";
  class_name: string | null;
  conference: string | null;
  head_coach: string | null;
  official_url: string;
  season: string;
  verified_at: string;
  updated_at: string;
}

export interface BoundEvent {
  id: string;
  team_id: string;
  activity_id: string;
  bound_event_id: string;
  event_type: "game" | "meet" | "match" | "tournament" | "performance" | "event";
  opponent_or_title: string;
  starts_at: string; // ISO string
  ends_at: string | null;
  location_name: string;
  location_address: string | null;
  home_away: "Home" | "Away" | "Neutral";
  status: BoundEventStatus;
  score_display: string | null;
  ticket_url: string | null;
  official_url: string;
  verified_at: string;
  updated_at: string;
  expires_at?: string | null;
  is_active?: boolean;
}

export interface BoundPractice {
  id: string;
  team_id: string;
  bound_practice_id: string;
  starts_at: string;
  ends_at: string | null;
  location_name: string;
  status: "Programada" | "Realizada" | "Cancelada";
  official_url: string | null;
  verified_at: string;
  updated_at: string;
}

export interface BoundSyncLog {
  id: string;
  sync_type: string;
  source_url: string;
  started_at: string;
  completed_at: string;
  status: "success" | "warning" | "error";
  items_created: number;
  items_updated: number;
  error_summary: string | null;
}

export interface RegistrationSupportPerson {
  id: string;
  person_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  office: string | null;
  is_verified: boolean;
  is_visible: boolean;
  updated_at: string;
}

export interface RegistrationSettings {
  is_enabled: boolean;
  title: string;
  message: string;
  primary_button_label: string;
  secondary_button_label: string;
  registration_url: string;
  verified_at: string;
  support_persons: RegistrationSupportPerson[];
}

export const LINCOLN_BOUND_BASE_URL = "https://www.gobound.com/ia/schools/dmlincoln";
export const LINCOLN_BOUND_REGISTRATION_URL = "https://www.gobound.com/ia/schools/dmlincoln";

// Authentic Lincoln High School activities on Bound
export const INITIAL_BOUND_TEAMS: BoundTeam[] = [];

// Sample authentic events on Bound
export const INITIAL_BOUND_EVENTS: BoundEvent[] = [];

export const INITIAL_BOUND_PRACTICES: BoundPractice[] = [];

export const INITIAL_REGISTRATION_SUPPORT: RegistrationSupportPerson[] = [];

export const INITIAL_REGISTRATION_SETTINGS: RegistrationSettings = {
  is_enabled: true,
  title: "¿Quieres registrarte en un deporte o actividad?",
  message:
    "Solicita ayuda al personal escolar para completar el proceso de registro de deportes y actividades.",
  primary_button_label: "Registrarse",
  secondary_button_label: "Necesito ayuda",
  registration_url: LINCOLN_BOUND_REGISTRATION_URL,
  verified_at: new Date().toISOString(),
  support_persons: INITIAL_REGISTRATION_SUPPORT,
};

export const INITIAL_SYNC_LOGS: BoundSyncLog[] = [];

// Helper functions for reading & mutating state locally with localStorage sync
import { type SchoolId } from "@/lib/school";

export const EAST_BOUND_BASE_URL = "https://www.gobound.com/ia/schools/dmeast";
export const EAST_BOUND_REGISTRATION_URL = "https://www.gobound.com/ia/schools/dmeast";

/* Activities live in the database (table `activities`), scoped per school. */

type ActivityDbRow = {
  id: string;
  name: string;
  gender: string | null;
  season: string | null;
  grades: string | null;
  enrollment_open: boolean | null;
  official_url: string | null;
  forms_url: string | null;
  image_url: string | null;
  description: string | null;
  registration_info: string | null;
  status: string | null;
  school_id: string | null;
  verified_at: string | null;
  updated_at: string | null;
};

const CATEGORY_BY_GENDER: Record<string, BoundCategory> = {
  Girls: "girls",
  Boys: "boys",
  Coed: "coed",
  Activity: "extracurricular",
};

function toBoundActivity(row: ActivityDbRow): BoundActivity {
  const gender = (row.gender ?? "Coed") as GenderGroup;
  return {
    id: row.id,
    bound_id: row.id,
    name: row.name,
    translated_name: row.description || null,
    slug: row.id,
    category: CATEGORY_BY_GENDER[gender] ?? "coed",
    gender_group: gender,
    activity_type: gender === "Activity" ? "extracurricular" : "sport",
    official_url: row.official_url ?? "",
    registration_url: row.forms_url ?? null,
    icon_url: row.image_url ?? null,
    card_banner_url: row.image_url ?? null,
    card_bg: null,
    season: (row.season ?? "Year-Round") as BoundActivity["season"],
    status: (row.registration_info ??
      (row.enrollment_open ? "Registro abierto" : "Registro cerrado")) as BoundStatus,
    is_active: row.status !== "archived" && row.status !== "draft",
    verified_at: row.verified_at ?? row.updated_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    levels: row.grades
      ? row.grades
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean)
      : [],
  };
}

function toActivityDbRow(a: BoundActivity, schoolId: string) {
  return {
    id: a.id,
    name: a.name,
    gender: a.gender_group,
    season: a.season,
    grades: (a.levels ?? []).join(", ") || null,
    enrollment_open: a.status === "Registro abierto",
    official_url: a.official_url || null,
    forms_url: a.registration_url,
    image_url: a.card_banner_url || a.icon_url || null,
    description: a.translated_name,
    registration_info: a.status,
    status: (a.is_active ? "published" : "draft") as "published" | "draft",
    school_id: schoolId,
    verified_at: a.verified_at,
  };
}

export function getInitialTeamsForSchool(schoolId: SchoolId = "lincoln"): BoundTeam[] {
  return INITIAL_BOUND_TEAMS;
}

export function getInitialEventsForSchool(schoolId: SchoolId = "lincoln"): BoundEvent[] {
  return INITIAL_BOUND_EVENTS;
}

export function getInitialRegistrationSettingsForSchool(
  schoolId: SchoolId = "lincoln",
): RegistrationSettings {
  return INITIAL_REGISTRATION_SETTINGS;
}

const memoryTeams = new Map<string, BoundTeam[]>();
const memoryEvents = new Map<string, BoundEvent[]>();
const memorySettings = new Map<string, RegistrationSettings>();
let memorySyncLogs: BoundSyncLog[] = [];
const boundLoadedKeys = new Set<string>();

async function loadBoundSiteSetting<T>(key: string, onLoaded: (val: T) => void): Promise<void> {
  if (boundLoadedKeys.has(key)) return;
  boundLoadedKeys.add(key);
  try {
    const { supabase, isSupabaseConfigured } = await import("@/integrations/supabase/client");
    if (!isSupabaseConfigured()) return;
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (!error && data?.value !== undefined && data?.value !== null) {
      onLoaded(data.value as T);
    }
  } catch {
    // ignore
  }
}

async function saveBoundSiteSetting(key: string, value: unknown): Promise<void> {
  try {
    const { supabase, isSupabaseConfigured } = await import("@/integrations/supabase/client");
    if (!isSupabaseConfigured()) return;
    await supabase.from("site_settings").upsert(
      {
        key,
        value: value as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
  } catch {
    // ignore
  }
}

import { notifyContentUpdated } from "@/lib/sync";

/** Reads the activities of one school from the database, localized when possible. */
export async function fetchActivitiesForSchool(
  schoolId: SchoolId = "lincoln",
  lang: string = "es",
): Promise<BoundActivity[]> {
  type TrRow = { language_code: string; name: string | null; description: string | null };
  const initial = getInitialActivitiesForSchool(schoolId);

  try {
    const { supabase, isSupabaseConfigured } = await import("@/integrations/supabase/client");
    if (isSupabaseConfigured()) {
      const [actRes, trRes] = await Promise.all([
        supabase
          .from("activities")
          .select(
            "id, name, gender, season, grades, enrollment_open, official_url, forms_url, image_url, description, registration_info, status, school_id, verified_at, updated_at",
          )
          .in("school_id", [schoolId, `sch-${schoolId}`])
          .order("name", { ascending: true }),
        supabase
          .from("activity_translations")
          .select("activity_id, language_code, name, description"),
      ]);
      const data = actRes.data;
      const error = actRes.error;
      const allTrs = Array.isArray(trRes.data)
        ? (trRes.data as (TrRow & { activity_id?: string })[])
        : [];

      if (!error && Array.isArray(data)) {
        return ((data ?? []) as unknown as ActivityDbRow[]).map((row) => {
          const trs = allTrs.filter((x) => String(x.activity_id) === String(row.id));
          const tr =
            trs.find((x) => x.language_code === lang) ?? trs.find((x) => x.language_code === "en");
          const localized = tr
            ? { ...row, name: tr.name || row.name, description: tr.description ?? row.description }
            : row;
          return toBoundActivity(localized);
        });
      }
    }
  } catch (err) {
    console.warn("[Bound] Supabase fetch activities notice:", err);
  }

  return initial;
}

/** Saves the activities of one school directly to Supabase. */
export async function saveActivitiesForSchool(
  activities: BoundActivity[],
  schoolId: SchoolId = "lincoln",
) {
  const rows = activities.map((a) => toActivityDbRow(a, schoolId));

  try {
    const { supabase, isSupabaseConfigured } = await import("@/integrations/supabase/client");
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("activities").upsert(rows, { onConflict: "id" });
      if (error) console.warn("[Bound] Supabase activities upsert note:", error.message);
    }
  } catch (err) {
    console.warn("[Bound] Background Supabase save note:", err);
  }

  notifyContentUpdated("activities");
}

/** Deletes one activity of a school directly from Supabase. */
export async function deleteActivity(id: string) {
  try {
    const { supabase, isSupabaseConfigured } = await import("@/integrations/supabase/client");
    if (isSupabaseConfigured()) {
      await supabase.from("activities").delete().eq("id", id);
    }
  } catch {
    // ignore
  }

  notifyContentUpdated("activities");
}

export function getStoredTeams(schoolId: SchoolId = "lincoln"): BoundTeam[] {
  const initial = getInitialTeamsForSchool(schoolId);
  const key = `bound_teams_${schoolId}`;
  if (typeof window !== "undefined") {
    void loadBoundSiteSetting<BoundTeam[]>(key, (val) => {
      if (Array.isArray(val)) {
        memoryTeams.set(schoolId, val);
        notifyContentUpdated("bound_teams");
      }
    });
  }
  return memoryTeams.get(schoolId) ?? initial;
}

export function saveStoredTeams(teams: BoundTeam[], schoolId: SchoolId = "lincoln") {
  const key = `bound_teams_${schoolId}`;
  memoryTeams.set(schoolId, teams);
  boundLoadedKeys.add(key);
  void saveBoundSiteSetting(key, teams);
  notifyContentUpdated("bound_teams");
}

export function getStoredEvents(schoolId: SchoolId = "lincoln"): BoundEvent[] {
  const initial = getInitialEventsForSchool(schoolId);
  const key = `bound_events_${schoolId}`;
  if (typeof window !== "undefined") {
    void loadBoundSiteSetting<BoundEvent[]>(key, (val) => {
      if (Array.isArray(val)) {
        memoryEvents.set(schoolId, val);
        notifyContentUpdated("bound_events");
      }
    });
  }
  return memoryEvents.get(schoolId) ?? initial;
}

export function saveStoredEvents(events: BoundEvent[], schoolId: SchoolId = "lincoln") {
  const key = `bound_events_${schoolId}`;
  memoryEvents.set(schoolId, events);
  boundLoadedKeys.add(key);
  void saveBoundSiteSetting(key, events);
  notifyContentUpdated("bound_events");
}

export function getStoredRegistrationSettings(
  schoolId: SchoolId = "lincoln",
): RegistrationSettings {
  const initial = getInitialRegistrationSettingsForSchool(schoolId);
  const key = `bound_settings_${schoolId}`;
  if (typeof window !== "undefined") {
    void loadBoundSiteSetting<RegistrationSettings>(key, (val) => {
      if (val && typeof val === "object") {
        memorySettings.set(schoolId, { ...initial, ...val });
        notifyContentUpdated("bound_settings");
      }
    });
  }
  return memorySettings.get(schoolId) ?? initial;
}

export function saveStoredRegistrationSettings(
  settings: RegistrationSettings,
  schoolId: SchoolId = "lincoln",
) {
  const key = `bound_settings_${schoolId}`;
  memorySettings.set(schoolId, settings);
  boundLoadedKeys.add(key);
  void saveBoundSiteSetting(key, settings);
  notifyContentUpdated("bound_settings");
}

export function getStoredSyncLogs(): BoundSyncLog[] {
  const key = "bound_sync_logs";
  if (typeof window !== "undefined") {
    void loadBoundSiteSetting<BoundSyncLog[]>(key, (val) => {
      if (Array.isArray(val)) {
        memorySyncLogs = val;
      }
    });
  }
  return memorySyncLogs;
}

export function saveStoredSyncLogs(logs: BoundSyncLog[]) {
  const key = "bound_sync_logs";
  memorySyncLogs = logs;
  boundLoadedKeys.add(key);
  void saveBoundSiteSetting(key, logs);
}

export function formatDateFormatted(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function formatTimeFormatted(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}
