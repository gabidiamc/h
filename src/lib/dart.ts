import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

/**
 * Shared, client-safe types and helpers for the DART public-transit integration.
 * No secrets and no server-only imports live in this file.
 */

export const DART_OFFICIAL_URL = "https://www.ridedart.com/";

/** Realtime data older than this is considered stale and is never shown as live. */
export const REALTIME_MAX_AGE_SECONDS = 180;

export const DART_FEED_KEYS = [
  "gtfs_static",
  "vehicle_positions",
  "trip_updates",
  "service_alerts",
] as const;
export type DartFeedKey = (typeof DART_FEED_KEYS)[number];

export const DART_FEED_LABEL: Record<DartFeedKey, string> = {
  gtfs_static: "GTFS estático (rutas, paradas y horarios)",
  vehicle_positions: "Posiciones de vehículos en tiempo real",
  trip_updates: "Actualizaciones de viajes en tiempo real",
  service_alerts: "Alertas de servicio",
};

export const DART_SECRET_NAME: Record<DartFeedKey, string> = {
  gtfs_static: "DART_GTFS_STATIC_URL",
  vehicle_positions: "DART_GTFS_VEHICLE_POSITIONS_URL",
  trip_updates: "DART_GTFS_TRIP_UPDATES_URL",
  service_alerts: "DART_GTFS_ALERTS_URL",
};

export type DartFeedStatus = {
  feed_key: string;
  configured: boolean;
  connected: boolean;
  last_success_at: string | null;
  last_attempt_at: string | null;
  last_feed_timestamp: string | null;
  last_error: string | null;
  record_count: number;
};

export type GeoPlace = {
  label: string;
  latitude: number;
  longitude: number;
};

export type PlanLeg =
  | {
      mode: "walk";
      seconds: number;
      meters: number;
      from: string;
      to: string;
      fromLat: number;
      fromLon: number;
      toLat: number;
      toLon: number;
    }
  | {
      mode: "bus";
      routeId: string;
      routeShortName: string | null;
      routeLongName: string | null;
      routeColor: string | null;
      routeTextColor: string | null;
      tripId: string;
      headsign: string | null;
      wheelchairAccessible: boolean | null;
      boardStopId: string;
      boardStopName: string;
      boardLat: number;
      boardLon: number;
      alightStopId: string;
      alightStopName: string;
      alightLat: number;
      alightLon: number;
      /** Seconds after midnight, from the official GTFS schedule. */
      scheduledDepartureSeconds: number;
      scheduledArrivalSeconds: number;
      /** Realtime prediction, only present when a fresh feed provided it. */
      realtimeDepartureSeconds: number | null;
      realtimeArrivalSeconds: number | null;
      delaySeconds: number | null;
      stopCount: number;
      shapeId: string | null;
    };

export type PlanItinerary = {
  id: string;
  kind: "recommended" | "fastest" | "least_walking";
  legs: PlanLeg[];
  departureSeconds: number;
  arrivalSeconds: number;
  totalSeconds: number;
  walkSeconds: number;
  transfers: number;
  usesRealtime: boolean;
  alertIds: string[];
};

export type ServiceAlert = {
  alert_id: string;
  header_text: string | null;
  description_text: string | null;
  effect: string | null;
  cause: string | null;
  severity_level: string | null;
  url: string | null;
  active_from: string | null;
  active_until: string | null;
  informed_routes: string[];
  informed_stops: string[];
};

export type NearbyStop = {
  stop_id: string;
  stop_name: string;
  stop_code: string | null;
  stop_lat: number;
  stop_lon: number;
  wheelchair_boarding: number | null;
  meters: number;
  walkMinutes: number;
  routes: {
    routeId: string;
    shortName: string | null;
    longName: string | null;
    color: string | null;
  }[];
  arrivals: {
    routeShortName: string | null;
    headsign: string | null;
    minutes: number;
    realtime: boolean;
  }[];
};

export type VehiclePosition = {
  vehicle_id: string;
  route_id: string | null;
  trip_id: string | null;
  latitude: number | null;
  longitude: number | null;
  bearing: number | null;
  feed_timestamp: string | null;
  speed?: number | null;
  current_status?: string | null;
  occupancy_status?: string | null;
  stop_id?: string | null;
  vehicle_label?: string | null;
  direction_id?: number | null;
};

/** Duration of a leg in seconds, for both walking and bus legs. */
export function legSeconds(leg: PlanLeg): number {
  return leg.mode === "walk"
    ? leg.seconds
    : Math.max(
        0,
        (leg.realtimeArrivalSeconds ?? leg.scheduledArrivalSeconds) -
          (leg.realtimeDepartureSeconds ?? leg.scheduledDepartureSeconds),
      );
}

export type PlanResponse = {
  ok: boolean;
  itineraries: PlanItinerary[];
  alerts: ServiceAlert[];
  realtimeAvailable: boolean;
  realtimeUpdatedAt: string | null;
  scheduleOnly: boolean;
  serviceDate: string;
  message?: string;
  errorCode?:
    | "feeds_missing"
    | "no_schedule"
    | "no_trips"
    | "no_stops_near_origin"
    | "no_stops_near_destination";
};

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                   */
/* ------------------------------------------------------------------ */

export function secondsToClock(seconds: number, locale = "es-US"): string {
  const s = ((seconds % 86400) + 86400) % 86400;
  const d = new Date(Date.UTC(2000, 0, 1, Math.floor(s / 3600), Math.floor((s % 3600) / 60)));
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(d);
}

export function formatDuration(seconds: number): string {
  const total = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function minutesFromSeconds(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

export function routeLabel(shortName: string | null, longName: string | null): string {
  if (shortName && longName) return `${shortName} — ${longName}`;
  return shortName ?? longName ?? "Ruta DART";
}

export function normalizeHexColor(color: string | null | undefined): string | null {
  if (!color) return null;
  const c = color.replace("#", "").trim();
  return /^[0-9a-fA-F]{6}$/.test(c) ? `#${c}` : null;
}

export function isRealtimeFresh(timestamp: string | null | undefined): boolean {
  if (!timestamp) return false;
  const age = (Date.now() - new Date(timestamp).getTime()) / 1000;
  return age >= 0 && age <= REALTIME_MAX_AGE_SECONDS;
}

export function dataAgeLabel(timestamp: string | null | undefined): string {
  if (!timestamp) return "Sin datos";
  const seconds = Math.round((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return `Hace ${Math.max(0, seconds)} s`;
  if (seconds < 3600) return `Hace ${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `Hace ${Math.round(seconds / 3600)} h`;
  return `Hace ${Math.round(seconds / 86400)} días`;
}

/** Plain-language instruction for one leg of the trip. */
export function legInstruction(leg: PlanLeg, locale = "es-US"): string {
  if (leg.mode === "walk") {
    return `Camina ${minutesFromSeconds(leg.seconds)} minutos hasta ${leg.to}.`;
  }
  const dep = leg.realtimeDepartureSeconds ?? leg.scheduledDepartureSeconds;
  return `Toma el autobús ${routeLabel(leg.routeShortName, leg.routeLongName)} a las ${secondsToClock(dep, locale)} en ${leg.boardStopName} y baja en ${leg.alightStopName}.`;
}

/* ------------------------------------------------------------------ */
/* DART Official Planner Configuration                                 */
/* ------------------------------------------------------------------ */

export type DartPlannerStatus = "funciona" | "bloqueado" | "pendiente";

export type DartPlannerConfig = {
  plannerUrl: string;
  widgetUrl: string;
  iframeEnabled: boolean;
  externalButtonEnabled: boolean;
  infoText: string;
  verifiedDomain: string;
  heightDesktop: number;
  heightMobile: number;
  lastTestedAt: string | null;
  lastReviewedAt: string | null;
  lastError: string | null;
  status: DartPlannerStatus;
};

export const DEFAULT_DART_PLANNER_CONFIG: DartPlannerConfig = {
  plannerUrl: "https://transitapp.com/en/trip",
  widgetUrl: "",
  iframeEnabled: true,
  externalButtonEnabled: true,
  infoText:
    "Busca una ruta de transporte público desde tu ubicación hasta Lincoln High School u otro destino.",
  verifiedDomain: "transitapp.com",
  heightDesktop: 780,
  heightMobile: 720,
  lastTestedAt: null,
  lastReviewedAt: null,
  lastError: null,
  status: "pendiente",
};

let memoryDartPlannerConfig: DartPlannerConfig = { ...DEFAULT_DART_PLANNER_CONFIG };
let dartPlannerLoaded = false;

async function ensureDartPlannerConfigLoaded(): Promise<void> {
  if (dartPlannerLoaded || !isSupabaseConfigured()) return;
  dartPlannerLoaded = true;
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "dart_planner_config")
      .maybeSingle();
    if (!error && data?.value && typeof data.value === "object") {
      const parsed = data.value as Partial<DartPlannerConfig>;
      memoryDartPlannerConfig = {
        plannerUrl: parsed.plannerUrl || DEFAULT_DART_PLANNER_CONFIG.plannerUrl,
        widgetUrl: parsed.widgetUrl ?? DEFAULT_DART_PLANNER_CONFIG.widgetUrl,
        iframeEnabled: parsed.iframeEnabled ?? DEFAULT_DART_PLANNER_CONFIG.iframeEnabled,
        externalButtonEnabled:
          parsed.externalButtonEnabled ?? DEFAULT_DART_PLANNER_CONFIG.externalButtonEnabled,
        infoText: parsed.infoText || DEFAULT_DART_PLANNER_CONFIG.infoText,
        verifiedDomain: parsed.verifiedDomain || DEFAULT_DART_PLANNER_CONFIG.verifiedDomain,
        heightDesktop: Number(parsed.heightDesktop) || DEFAULT_DART_PLANNER_CONFIG.heightDesktop,
        heightMobile: Number(parsed.heightMobile) || DEFAULT_DART_PLANNER_CONFIG.heightMobile,
        lastTestedAt: parsed.lastTestedAt || null,
        lastReviewedAt: parsed.lastReviewedAt || null,
        lastError: parsed.lastError || null,
        status: parsed.status || DEFAULT_DART_PLANNER_CONFIG.status,
      };
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dart_config_updated"));
      }
    }
  } catch {
    // ignore
  }
}

export function getDartPlannerConfig(): DartPlannerConfig {
  if (typeof window !== "undefined" && !dartPlannerLoaded) {
    void ensureDartPlannerConfigLoaded();
  }
  return { ...memoryDartPlannerConfig };
}

export function saveDartPlannerConfig(config: DartPlannerConfig): void {
  memoryDartPlannerConfig = { ...config };
  dartPlannerLoaded = true;
  if (isSupabaseConfigured()) {
    void supabase.from("site_settings").upsert(
      {
        key: "dart_planner_config",
        value: config as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "key" },
    );
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dart_config_updated"));
  }
}

/* ------------------------------------------------------------------ */
/* DART Routes Data Model & Storage Helpers                           */
/* ------------------------------------------------------------------ */

export type DartRouteItem = {
  id: string;
  route_number: string;
  name: string;
  school_id: string;
  description: string;
  direction_outbound?: string | null;
  direction_inbound?: string | null;
  frequency?: string | null;
  first_bus?: string | null;
  last_bus?: string | null;
  stops_count?: number | null;
  official_url?: string | null;
  is_active: boolean;
  display_order?: number;
};

export async function fetchDartRoutes(schoolId?: string): Promise<DartRouteItem[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("dart_routes")
        .select("*")
        .order("route_short_name", { ascending: true });

      if (!error && Array.isArray(data)) {
        let items: DartRouteItem[] = data.map((r: Record<string, unknown>) => ({
          id: String(r["route_id"] || r["id"] || ""),
          route_number: String(r["route_short_name"] || r["route_number"] || ""),
          name: String(r["route_long_name"] || r["name"] || ""),
          school_id: String(r["school_id"] ?? "all"),
          description: String(r["route_desc"] || r["description"] || ""),
          direction_outbound: (r["direction_outbound"] as string | null) ?? null,
          direction_inbound: (r["direction_inbound"] as string | null) ?? null,
          frequency: (r["frequency"] as string | null) ?? null,
          first_bus: (r["first_bus"] as string | null) ?? null,
          last_bus: (r["last_bus"] as string | null) ?? null,
          stops_count: r["stops_count"] ? Number(r["stops_count"]) : null,
          official_url: (r["route_url"] || (r["official_url"] as string | null)) ?? null,
          is_active: r["is_active"] !== false,
          display_order: Number(r["display_order"] ?? 99),
        }));

        if (schoolId && schoolId !== "all") {
          items = items.filter((r) => r.school_id === schoolId || r.school_id === "all");
        }
        return items;
      }
    } catch (err) {
      console.warn("[DART] Error fetching dart_routes from Supabase:", err);
    }
  }

  return [];
}

/* ------------------------------------------------------------------ */
/* DART Service Alerts & Notices                                      */
/* ------------------------------------------------------------------ */

export type DartAlertConfig = {
  enabled: boolean;
  type: "normal" | "delay" | "snow_route" | "detour";
  title: string;
  message: string;
  updatedAt: string;
};

export const DEFAULT_DART_ALERT: DartAlertConfig = {
  enabled: true,
  type: "normal",
  title: "Servicio Regular en Rutas Escolares",
  message:
    "Todas las rutas DART hacia Lincoln High School y East High School operan con horario normal. Recuerda llevar tu credencial estudiantil vigente.",
  updatedAt: new Date().toLocaleDateString("es-US", { dateStyle: "medium" }),
};

let memoryDartAlertConfig: DartAlertConfig = { ...DEFAULT_DART_ALERT };
let dartAlertLoaded = false;

async function ensureDartAlertConfigLoaded(): Promise<void> {
  if (dartAlertLoaded || !isSupabaseConfigured()) return;
  dartAlertLoaded = true;
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "dart_alert_config")
      .maybeSingle();
    if (!error && data?.value && typeof data.value === "object") {
      const parsed = data.value as Partial<DartAlertConfig>;
      memoryDartAlertConfig = {
        enabled: parsed.enabled ?? DEFAULT_DART_ALERT.enabled,
        type: parsed.type || DEFAULT_DART_ALERT.type,
        title: parsed.title || DEFAULT_DART_ALERT.title,
        message: parsed.message || DEFAULT_DART_ALERT.message,
        updatedAt: parsed.updatedAt || DEFAULT_DART_ALERT.updatedAt,
      };
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dart_alert_updated"));
      }
    }
  } catch {
    // ignore
  }
}

export function getDartAlertConfig(): DartAlertConfig {
  if (typeof window !== "undefined" && !dartAlertLoaded) {
    void ensureDartAlertConfigLoaded();
  }
  return { ...memoryDartAlertConfig };
}

export function saveDartAlertConfig(alert: DartAlertConfig): void {
  memoryDartAlertConfig = { ...alert };
  dartAlertLoaded = true;
  if (isSupabaseConfigured()) {
    void supabase.from("site_settings").upsert(
      {
        key: "dart_alert_config",
        value: alert as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "key" },
    );
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dart_alert_updated"));
  }
}
