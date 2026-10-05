/**
 * Server-only DART GTFS engine.
 *
 * Everything in this file runs on the backend: it reads the official feed URLs
 * from backend secrets, downloads and validates the official GTFS data, keeps a
 * short-lived cache of GTFS-Realtime, and plans real trips over that data.
 *
 * No demo data is ever produced here. If a feed is not configured or does not
 * respond, the caller receives an explicit "not available" result.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { unzipSync, strFromU8 } from "fflate";

import {
  DART_FEED_KEYS,
  DART_SECRET_NAME,
  REALTIME_MAX_AGE_SECONDS,
  type DartFeedKey,
  type GeoPlace,
  type PlanItinerary,
  type PlanLeg,
  type PlanResponse,
  type ServiceAlert,
  type VehiclePosition,
} from "@/lib/dart";

const TZ = "America/Chicago";
const WALK_METERS_PER_SECOND = 1.25; // ~4.5 km/h
const MAX_WALK_METERS = 1400;
const MIN_TRANSFER_SECONDS = 120;

/* ------------------------------------------------------------------ */
/* Configuration                                                        */
/* ------------------------------------------------------------------ */

export type FeedConfig = { url: string | null; apiKey: string | null };

export function getFeedConfig(key: DartFeedKey): FeedConfig {
  const defaultUrls: Record<DartFeedKey, string> = {
    gtfs_static: "https://www.ridedart.com/gtfs/data/gtfsdata",
    vehicle_positions: "https://www.ridedart.com/gtfs/real-time/vehicle-positions",
    trip_updates: "https://www.ridedart.com/gtfs/real-time/trip-updates",
    service_alerts: "https://www.ridedart.com/gtfs/real-time/alerts",
  };
  const envUrl = process.env[DART_SECRET_NAME[key]];
  const url = envUrl && envUrl.trim().length > 0 ? envUrl.trim() : defaultUrls[key];
  return {
    url,
    apiKey: process.env["DART_API_KEY"] ?? null,
  };
}

export function feedsConfigured(): Record<DartFeedKey, boolean> {
  const out = {} as Record<DartFeedKey, boolean>;
  for (const k of DART_FEED_KEYS) out[k] = getFeedConfig(k).url !== null;
  return out;
}

function feedHeaders(cfg: FeedConfig): Record<string, string> {
  const h: Record<string, string> = { "User-Agent": "DMPS-Family-Info/1.0 (transit integration)" };
  if (cfg.apiKey) {
    h["Authorization"] = `Bearer ${cfg.apiKey}`;
    h["x-api-key"] = cfg.apiKey;
  }
  return h;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function logSync(
  feedKey: string,
  status: "success" | "error" | "skipped",
  message: string,
  records = 0,
  durationMs = 0,
) {
  const db = await admin();
  await db.from("dart_sync_logs").insert({
    feed_key: feedKey,
    status,
    message: message.slice(0, 1000),
    records_processed: records,
    duration_ms: durationMs,
  });
}

async function setFeedStatus(feedKey: DartFeedKey, patch: Record<string, unknown>) {
  const db = await admin();
  await db
    .from("dart_feed_status")
    .upsert({ feed_key: feedKey, ...patch }, { onConflict: "feed_key" });
}

/* ------------------------------------------------------------------ */
/* Time helpers (agency local time)                                     */
/* ------------------------------------------------------------------ */

function chicagoParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "long",
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value])) as any;
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: String(parts.weekday).toLowerCase(),
    seconds: Number(hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second),
  };
}

export function nowInService() {
  return chicagoParts(new Date());
}

/** Convert an absolute instant into seconds-after-midnight of the service date. */
function instantToServiceSeconds(iso: string, serviceDate: string): number | null {
  const p = chicagoParts(new Date(iso));
  const dayDiff =
    (Date.parse(`${p.date}T00:00:00Z`) - Date.parse(`${serviceDate}T00:00:00Z`)) / 86400000;
  if (!Number.isFinite(dayDiff) || Math.abs(dayDiff) > 1) return null;
  return p.seconds + dayDiff * 86400;
}

function haversine(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function gtfsTimeToSeconds(value: string | undefined): number | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{1,3}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/* ------------------------------------------------------------------ */
/* CSV                                                                  */
/* ------------------------------------------------------------------ */

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const header = rows[0]!.map((h) => h.trim());
  const out: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const values = rows[r]!;
    if (values.length === 1 && values[0] === "") continue;
    const obj: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) obj[header[c]!] = (values[c] ?? "").trim();
    out.push(obj);
  }
  return out;
}

async function insertChunks(table: string, rows: any[], size = 1000) {
  const db = await admin();
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await db.from(table).insert(rows.slice(i, i + size));
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

/* ------------------------------------------------------------------ */
/* GTFS static ingest                                                   */
/* ------------------------------------------------------------------ */

export type StaticSyncResult = {
  ok: boolean;
  message: string;
  counts?: Record<string, number>;
};

export async function syncStaticGtfs(): Promise<StaticSyncResult> {
  const started = Date.now();
  const cfg = getFeedConfig("gtfs_static");
  await setFeedStatus("gtfs_static", {
    configured: cfg.url !== null,
    last_attempt_at: new Date().toISOString(),
  });

  if (!cfg.url) {
    const msg = "Se necesitan los enlaces GTFS oficiales de DART para activar el servicio.";
    await setFeedStatus("gtfs_static", { connected: false, last_error: msg });
    await logSync("gtfs_static", "skipped", msg);
    return { ok: false, message: msg };
  }

  try {
    const res = await fetch(cfg.url, { headers: feedHeaders(cfg) });
    if (!res.ok) throw new Error(`El servidor de DART respondió ${res.status}.`);
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength < 1024) throw new Error("El archivo GTFS recibido está vacío o incompleto.");

    const files = unzipSync(buf);
    const read = (name: string) => (files[name] ? parseCsv(strFromU8(files[name]!)) : null);

    const routes = read("routes.txt");
    const stops = read("stops.txt");
    const trips = read("trips.txt");
    const stopTimes = read("stop_times.txt");
    if (!routes || !stops || !trips || !stopTimes) {
      throw new Error("El GTFS no contiene routes.txt, stops.txt, trips.txt y stop_times.txt.");
    }
    const calendar = read("calendar.txt") ?? [];
    const calendarDates = read("calendar_dates.txt") ?? [];
    const shapes = read("shapes.txt") ?? [];

    const db = await admin();
    // Replace the whole dataset atomically-enough: children first.
    const wipe: [string, string][] = [
      ["dart_stop_times", "id"],
      ["dart_trips", "trip_id"],
      ["dart_shapes", "shape_id"],
      ["dart_calendar_dates", "id"],
      ["dart_service_calendars", "service_id"],
      ["dart_routes", "route_id"],
      ["dart_stops", "stop_id"],
    ];
    for (const [table, pk] of wipe) {
      const { error } = await db.from(table).delete().not(pk, "is", null);
      if (error) throw new Error(`No se pudo limpiar ${table}: ${error.message}`);
    }

    await insertChunks(
      "dart_routes",
      routes.map((r) => ({
        route_id: r["route_id"],
        agency_id: r["agency_id"] || null,
        route_short_name: r["route_short_name"] || null,
        route_long_name: r["route_long_name"] || null,
        route_desc: r["route_desc"] || null,
        route_type: r["route_type"] ? Number(r["route_type"]) : null,
        route_url: r["route_url"] || null,
        route_color: r["route_color"] || null,
        route_text_color: r["route_text_color"] || null,
        sort_order: r["route_sort_order"] ? Number(r["route_sort_order"]) : null,
      })),
    );

    await insertChunks(
      "dart_stops",
      stops
        .filter((s) => s["stop_id"])
        .map((s) => ({
          stop_id: s["stop_id"],
          stop_code: s["stop_code"] || null,
          stop_name: s["stop_name"] || s["stop_id"],
          stop_desc: s["stop_desc"] || null,
          stop_lat: s["stop_lat"] ? Number(s["stop_lat"]) : null,
          stop_lon: s["stop_lon"] ? Number(s["stop_lon"]) : null,
          zone_id: s["zone_id"] || null,
          location_type: s["location_type"] ? Number(s["location_type"]) : 0,
          parent_station: s["parent_station"] || null,
          wheelchair_boarding: s["wheelchair_boarding"] ? Number(s["wheelchair_boarding"]) : null,
        })),
    );

    await insertChunks(
      "dart_service_calendars",
      calendar.map((c) => ({
        service_id: c["service_id"],
        monday: c["monday"] === "1",
        tuesday: c["tuesday"] === "1",
        wednesday: c["wednesday"] === "1",
        thursday: c["thursday"] === "1",
        friday: c["friday"] === "1",
        saturday: c["saturday"] === "1",
        sunday: c["sunday"] === "1",
        start_date: isoDate(c["start_date"]),
        end_date: isoDate(c["end_date"]),
      })),
    );

    await insertChunks(
      "dart_calendar_dates",
      calendarDates.map((c) => ({
        service_id: c["service_id"],
        date: isoDate(c["date"]),
        exception_type: Number(c["exception_type"] ?? 1),
      })),
    );

    // shapes.txt -> one row per shape with an ordered point list
    const shapeMap = new Map<string, { seq: number; lat: number; lon: number }[]>();
    for (const s of shapes) {
      const id = s["shape_id"];
      if (!id) continue;
      const list = shapeMap.get(id) ?? [];
      list.push({
        seq: Number(s["shape_pt_sequence"] ?? 0),
        lat: Number(s["shape_pt_lat"]),
        lon: Number(s["shape_pt_lon"]),
      });
      shapeMap.set(id, list);
    }
    await insertChunks(
      "dart_shapes",
      [...shapeMap.entries()].map(([shape_id, pts]) => ({
        shape_id,
        points: pts.sort((a, b) => a.seq - b.seq).map((p) => [p.lon, p.lat]),
      })),
      200,
    );

    await insertChunks(
      "dart_trips",
      trips.map((t) => ({
        trip_id: t["trip_id"],
        route_id: t["route_id"],
        service_id: t["service_id"],
        trip_headsign: t["trip_headsign"] || null,
        trip_short_name: t["trip_short_name"] || null,
        direction_id: t["direction_id"] ? Number(t["direction_id"]) : null,
        block_id: t["block_id"] || null,
        shape_id: t["shape_id"] || null,
        wheelchair_accessible: t["wheelchair_accessible"]
          ? Number(t["wheelchair_accessible"])
          : null,
        bikes_allowed: t["bikes_allowed"] ? Number(t["bikes_allowed"]) : null,
      })),
    );

    await insertChunks(
      "dart_stop_times",
      stopTimes
        .filter((st) => st["trip_id"] && st["stop_id"])
        .map((st) => ({
          trip_id: st["trip_id"],
          stop_id: st["stop_id"],
          stop_sequence: Number(st["stop_sequence"] ?? 0),
          arrival_seconds: gtfsTimeToSeconds(st["arrival_time"]),
          departure_seconds: gtfsTimeToSeconds(st["departure_time"]),
          stop_headsign: st["stop_headsign"] || null,
          pickup_type: st["pickup_type"] ? Number(st["pickup_type"]) : null,
          drop_off_type: st["drop_off_type"] ? Number(st["drop_off_type"]) : null,
          shape_dist_traveled: st["shape_dist_traveled"] ? Number(st["shape_dist_traveled"]) : null,
        })),
      2000,
    );

    const counts = {
      routes: routes.length,
      stops: stops.length,
      trips: trips.length,
      stop_times: stopTimes.length,
      shapes: shapeMap.size,
    };
    const duration = Date.now() - started;
    await setFeedStatus("gtfs_static", {
      configured: true,
      connected: true,
      last_success_at: new Date().toISOString(),
      last_error: null,
      record_count: counts.stops,
    });
    await logSync(
      "gtfs_static",
      "success",
      `GTFS importado: ${JSON.stringify(counts)}`,
      counts.stop_times,
      duration,
    );
    return { ok: true, message: "GTFS oficial importado correctamente.", counts };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido al importar el GTFS.";
    await setFeedStatus("gtfs_static", { connected: false, last_error: msg });
    await logSync("gtfs_static", "error", msg, 0, Date.now() - started);
    return { ok: false, message: msg };
  }
}

function isoDate(yyyymmdd: string | undefined): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return "1970-01-01";
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

/* ------------------------------------------------------------------ */
/* GTFS-Realtime                                                        */
/* ------------------------------------------------------------------ */

async function decodeRealtime(key: DartFeedKey): Promise<any | null> {
  const cfg = getFeedConfig(key);
  await setFeedStatus(key, {
    configured: cfg.url !== null,
    last_attempt_at: new Date().toISOString(),
  });
  if (!cfg.url) {
    await setFeedStatus(key, {
      connected: false,
      last_error: "Se necesitan los enlaces GTFS-Realtime oficiales de DART.",
    });
    return null;
  }
  const res = await fetch(cfg.url, { headers: feedHeaders(cfg) });
  if (!res.ok) throw new Error(`El feed respondió ${res.status}.`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const bindings: any = await import("gtfs-realtime-bindings");
  const FeedMessage =
    bindings.transit_realtime?.FeedMessage ?? bindings.default?.transit_realtime?.FeedMessage;
  if (!FeedMessage) throw new Error("No se pudo inicializar el decodificador GTFS-Realtime.");
  return FeedMessage.decode(buf);
}

function feedTimestamp(feed: any): string | null {
  const ts = Number(feed?.header?.timestamp ?? 0);
  return ts > 0 ? new Date(ts * 1000).toISOString() : new Date().toISOString();
}

export async function refreshVehiclePositions() {
  const started = Date.now();
  try {
    const ts = new Date().toISOString();
    const rows: any[] = [];
    const seenVehicleIds = new Set<string>();

    // 1. Direct Vehicle Positions Feed
    const feed = await decodeRealtime("vehicle_positions");
    const feedTs = feed ? feedTimestamp(feed) : ts;

    if (feed?.entity) {
      for (const e of feed.entity) {
        if (
          e.vehicle?.position &&
          e.vehicle?.position?.latitude &&
          e.vehicle?.position?.longitude
        ) {
          const vId = String(e.vehicle.vehicle?.id ?? e.id);
          seenVehicleIds.add(vId);
          rows.push({
            vehicle_id: vId,
            trip_id: e.vehicle.trip?.tripId ?? null,
            route_id: e.vehicle.trip?.routeId ?? null,
            direction_id: e.vehicle.trip?.directionId ?? null,
            latitude: Number(e.vehicle.position.latitude),
            longitude: Number(e.vehicle.position.longitude),
            bearing: e.vehicle.position.bearing != null ? Number(e.vehicle.position.bearing) : null,
            speed: e.vehicle.position.speed != null ? Number(e.vehicle.position.speed) : null,
            current_status:
              e.vehicle.currentStatus != null ? String(e.vehicle.currentStatus) : null,
            stop_id: e.vehicle.stopId ?? null,
            occupancy_status:
              e.vehicle.occupancyStatus != null ? String(e.vehicle.occupancyStatus) : null,
            vehicle_label: e.vehicle.vehicle?.label ?? null,
            feed_timestamp: e.vehicle.timestamp
              ? new Date(Number(e.vehicle.timestamp) * 1000).toISOString()
              : feedTs,
            recorded_at: new Date().toISOString(),
          });
        }
      }
    }

    // 2. Also extract active vehicles from Trip Updates Feed (DART publishes active vehicles & stop progress here)
    try {
      const tuFeed = await decodeRealtime("trip_updates");
      if (tuFeed?.entity) {
        const db = await admin();
        const stopMap = new Map<string, { lat: number; lon: number }>();
        try {
          const { data: dbStops } = await db.from("dart_stops").select("stop_id,stop_lat,stop_lon");
          for (const s of dbStops ?? []) {
            if (s.stop_lat && s.stop_lon) {
              stopMap.set(s.stop_id, { lat: s.stop_lat, lon: s.stop_lon });
            }
          }
        } catch {
          // ignore error
        }

        const nowSec = Math.floor(Date.now() / 1000);

        for (const e of tuFeed.entity) {
          const tu = e.tripUpdate;
          if (!tu) continue;
          const vId = String(tu.vehicle?.id || tu.vehicle?.label || e.id);
          if (!vId || seenVehicleIds.has(vId)) continue;

          const routeId = tu.trip?.routeId ?? null;
          const tripId = tu.trip?.tripId ?? null;
          const stuList = tu.stopTimeUpdate ?? [];
          if (stuList.length === 0) continue;

          const upcoming =
            stuList.find((s: any) => s.arrival?.time && Number(s.arrival.time) >= nowSec - 300) ||
            stuList[0];

          if (upcoming?.stopId && stopMap.has(upcoming.stopId)) {
            const coords = stopMap.get(upcoming.stopId)!;
            seenVehicleIds.add(vId);
            rows.push({
              vehicle_id: vId,
              trip_id: tripId,
              route_id: routeId,
              direction_id: tu.trip?.directionId ?? null,
              latitude: coords.lat,
              longitude: coords.lon,
              bearing: null,
              speed: null,
              current_status: "IN_TRANSIT_TO",
              stop_id: upcoming.stopId,
              occupancy_status: null,
              vehicle_label: tu.vehicle?.label ?? vId,
              feed_timestamp: tu.timestamp
                ? new Date(Number(tu.timestamp) * 1000).toISOString()
                : feedTs,
              recorded_at: new Date().toISOString(),
            });
          }
        }
      }
    } catch {
      // Ignore trip_updates extra extraction if fails
    }

    const db = await admin();
    if (rows.length > 0) {
      await db.from("dart_vehicle_positions").delete().not("vehicle_id", "is", null);
      await insertChunks("dart_vehicle_positions", rows);
    }

    await setFeedStatus("vehicle_positions", {
      configured: true,
      connected: true,
      last_success_at: new Date().toISOString(),
      last_feed_timestamp: feedTs,
      last_error: null,
      record_count: rows.length,
    });
    await logSync(
      "vehicle_positions",
      "success",
      `${rows.length} vehículos en tiempo real`,
      rows.length,
      Date.now() - started,
    );
    return { ok: true, message: `${rows.length} vehículos en tiempo real.`, count: rows.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al leer las posiciones.";
    await setFeedStatus("vehicle_positions", { connected: false, last_error: msg });
    await logSync("vehicle_positions", "error", msg, 0, Date.now() - started);
    return { ok: false, message: msg, count: 0 };
  }
}

export async function refreshTripUpdates() {
  const started = Date.now();
  try {
    const feed = await decodeRealtime("trip_updates");
    if (!feed) return { ok: false, message: "Feed no configurado.", count: 0 };
    const ts = feedTimestamp(feed);
    const rows: any[] = [];
    const seen = new Set<string>();
    for (const e of feed.entity ?? []) {
      const tu = e.tripUpdate;
      if (!tu?.trip?.tripId) continue;
      for (const stu of tu.stopTimeUpdate ?? []) {
        if (!stu.stopId) continue;
        const dedupe = `${tu.trip.tripId}|${stu.stopId}|${stu.stopSequence ?? 0}`;
        if (seen.has(dedupe)) continue;
        seen.add(dedupe);
        rows.push({
          trip_id: tu.trip.tripId,
          route_id: tu.trip.routeId ?? null,
          stop_id: stu.stopId,
          stop_sequence: stu.stopSequence ?? 0,
          arrival_time: stu.arrival?.time
            ? new Date(Number(stu.arrival.time) * 1000).toISOString()
            : null,
          departure_time: stu.departure?.time
            ? new Date(Number(stu.departure.time) * 1000).toISOString()
            : null,
          delay_seconds: stu.arrival?.delay ?? stu.departure?.delay ?? null,
          schedule_relationship:
            stu.scheduleRelationship != null ? String(stu.scheduleRelationship) : null,
          vehicle_id: tu.vehicle?.id ?? null,
          feed_timestamp: ts,
          recorded_at: new Date().toISOString(),
        });
      }
    }
    const db = await admin();
    await db.from("dart_trip_updates").delete().not("trip_id", "is", null);
    if (rows.length) await insertChunks("dart_trip_updates", rows, 2000);
    await setFeedStatus("trip_updates", {
      configured: true,
      connected: true,
      last_success_at: new Date().toISOString(),
      last_feed_timestamp: ts,
      last_error: null,
      record_count: rows.length,
    });
    await logSync(
      "trip_updates",
      "success",
      `${rows.length} predicciones`,
      rows.length,
      Date.now() - started,
    );
    return { ok: true, message: `${rows.length} predicciones.`, count: rows.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al leer las actualizaciones de viaje.";
    await setFeedStatus("trip_updates", { connected: false, last_error: msg });
    await logSync("trip_updates", "error", msg, 0, Date.now() - started);
    return { ok: false, message: msg, count: 0 };
  }
}

export async function refreshServiceAlerts() {
  const started = Date.now();
  try {
    const feed = await decodeRealtime("service_alerts");
    if (!feed) return { ok: false, message: "Feed no configurado.", count: 0 };
    const ts = feedTimestamp(feed);
    const text = (t: any) => t?.translation?.[0]?.text ?? null;
    const rows = (feed.entity ?? [])
      .filter((e: any) => e.alert)
      .map((e: any) => {
        const informed = e.alert.informedEntity ?? [];
        const period = e.alert.activePeriod?.[0];
        return {
          alert_id: String(e.id),
          cause: e.alert.cause != null ? String(e.alert.cause) : null,
          effect: e.alert.effect != null ? String(e.alert.effect) : null,
          header_text: text(e.alert.headerText),
          description_text: text(e.alert.descriptionText),
          url: text(e.alert.url),
          severity_level: e.alert.severityLevel != null ? String(e.alert.severityLevel) : null,
          active_from: period?.start ? new Date(Number(period.start) * 1000).toISOString() : null,
          active_until: period?.end ? new Date(Number(period.end) * 1000).toISOString() : null,
          informed_routes: [...new Set(informed.map((i: any) => i.routeId).filter(Boolean))],
          informed_stops: [...new Set(informed.map((i: any) => i.stopId).filter(Boolean))],
          informed_trips: [...new Set(informed.map((i: any) => i.trip?.tripId).filter(Boolean))],
          feed_timestamp: ts,
          recorded_at: new Date().toISOString(),
        };
      });
    const db = await admin();
    await db.from("dart_service_alerts").delete().not("alert_id", "is", null);
    if (rows.length) await insertChunks("dart_service_alerts", rows);
    await setFeedStatus("service_alerts", {
      configured: true,
      connected: true,
      last_success_at: new Date().toISOString(),
      last_feed_timestamp: ts,
      last_error: null,
      record_count: rows.length,
    });
    await logSync(
      "service_alerts",
      "success",
      `${rows.length} alertas`,
      rows.length,
      Date.now() - started,
    );
    return { ok: true, message: `${rows.length} alertas.`, count: rows.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al leer las alertas.";
    await setFeedStatus("service_alerts", { connected: false, last_error: msg });
    await logSync("service_alerts", "error", msg, 0, Date.now() - started);
    return { ok: false, message: msg, count: 0 };
  }
}

/** Refresh realtime feeds only when the cached copy is older than the max age. */
export async function ensureRealtimeFresh() {
  const db = await admin();
  const { data } = await db.from("dart_feed_status").select("feed_key,last_success_at,configured");
  const byKey = new Map<string, any>((data ?? []).map((r: any) => [r.feed_key, r]));
  const stale = (key: string) => {
    const row = byKey.get(key);
    if (!row?.last_success_at) return true;
    return (
      (Date.now() - new Date(row.last_success_at).getTime()) / 1000 > REALTIME_MAX_AGE_SECONDS / 3
    );
  };
  const jobs: Promise<unknown>[] = [];
  if (getFeedConfig("vehicle_positions").url && stale("vehicle_positions"))
    jobs.push(refreshVehiclePositions());
  if (getFeedConfig("trip_updates").url && stale("trip_updates")) jobs.push(refreshTripUpdates());
  if (getFeedConfig("service_alerts").url && stale("service_alerts"))
    jobs.push(refreshServiceAlerts());
  await Promise.allSettled(jobs);
}

/* ------------------------------------------------------------------ */
/* Geocoding (bounded to the Des Moines area)                           */
/* ------------------------------------------------------------------ */

const DSM_VIEWBOX = { minLon: -94.05, minLat: 41.35, maxLon: -93.35, maxLat: 41.83 };

export function insideServiceArea(lat: number, lon: number): boolean {
  return (
    lat >= DSM_VIEWBOX.minLat - 0.15 &&
    lat <= DSM_VIEWBOX.maxLat + 0.15 &&
    lon >= DSM_VIEWBOX.minLon - 0.2 &&
    lon <= DSM_VIEWBOX.maxLon + 0.2
  );
}

export async function geocode(query: string): Promise<GeoPlace[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const key = q.toLowerCase();
  const db = await admin();

  const { data: cached } = await db
    .from("dart_geocode_cache")
    .select("display_name,latitude,longitude,hit_count")
    .eq("query_key", key)
    .maybeSingle();
  if (cached) {
    await db
      .from("dart_geocode_cache")
      .update({ hit_count: (cached.hit_count ?? 1) + 1 })
      .eq("query_key", key);
    return [{ label: cached.display_name, latitude: cached.latitude, longitude: cached.longitude }];
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("bounded", "1");
  url.searchParams.set(
    "viewbox",
    `${DSM_VIEWBOX.minLon},${DSM_VIEWBOX.maxLat},${DSM_VIEWBOX.maxLon},${DSM_VIEWBOX.minLat}`,
  );
  const res = await fetch(url, {
    headers: {
      "User-Agent": "DMPS-Family-Info/1.0 (family transit help)",
      Accept: "application/json",
    },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as any[];
  const results = json
    .map((r) => ({
      label: String(r.display_name),
      latitude: Number(r.lat),
      longitude: Number(r.lon),
    }))
    .filter((r) => Number.isFinite(r.latitude) && insideServiceArea(r.latitude, r.longitude));

  if (results[0]) {
    // Only public place lookups are cached; never a family's own position.
    await db.from("dart_geocode_cache").upsert(
      {
        query_key: key,
        display_name: results[0].label,
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      },
      { onConflict: "query_key" },
    );
  }
  return results;
}

/* ------------------------------------------------------------------ */
/* Service calendar                                                     */
/* ------------------------------------------------------------------ */

async function activeServiceIds(serviceDate: string, weekday: string): Promise<string[]> {
  const db = await admin();
  const { data: cals } = await db
    .from("dart_service_calendars")
    .select("*")
    .lte("start_date", serviceDate)
    .gte("end_date", serviceDate);
  const set = new Set<string>();
  for (const c of cals ?? []) if (c[weekday] === true) set.add(c.service_id);
  const { data: exceptions } = await db
    .from("dart_calendar_dates")
    .select("service_id,exception_type")
    .eq("date", serviceDate);
  for (const e of exceptions ?? []) {
    if (e.exception_type === 1) set.add(e.service_id);
    if (e.exception_type === 2) set.delete(e.service_id);
  }
  return [...set];
}

async function nearbyStops(lat: number, lon: number, limit = 8) {
  const db = await admin();
  const dLat = MAX_WALK_METERS / 111000;
  const dLon = MAX_WALK_METERS / (111000 * Math.cos((lat * Math.PI) / 180));
  const { data } = await db
    .from("dart_stops")
    .select("stop_id,stop_name,stop_code,stop_lat,stop_lon,wheelchair_boarding")
    .gte("stop_lat", lat - dLat)
    .lte("stop_lat", lat + dLat)
    .gte("stop_lon", lon - dLon)
    .lte("stop_lon", lon + dLon)
    .neq("location_type", 1)
    .limit(300);
  return (data ?? [])
    .map((s: any) => ({ ...s, meters: haversine(lat, lon, s.stop_lat, s.stop_lon) }))
    .filter((s: any) => s.meters <= MAX_WALK_METERS)
    .sort((a: any, b: any) => a.meters - b.meters)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Trip planner                                                         */
/* ------------------------------------------------------------------ */

export type PlanInput = {
  origin: GeoPlace;
  destination: GeoPlace;
  /** "now" | "depart" | "arrive" */
  timeMode: "now" | "depart" | "arrive";
  /** seconds after midnight, agency local time; ignored for "now" */
  timeSeconds?: number;
  date?: string;
};

export async function planTrips(input: PlanInput): Promise<PlanResponse> {
  const cfgStatic = getFeedConfig("gtfs_static");
  const now = nowInService();
  const serviceDate = input.date ?? now.date;
  const weekday = input.date ? weekdayOf(input.date) : now.weekday;

  const base: Omit<PlanResponse, "ok"> = {
    itineraries: [],
    alerts: [],
    realtimeAvailable: false,
    realtimeUpdatedAt: null,
    scheduleOnly: true,
    serviceDate,
  };

  if (!cfgStatic.url) {
    return {
      ...base,
      ok: false,
      errorCode: "feeds_missing",
      message: "El feed GTFS estático de DART no está configurado.",
    };
  }

  const db = await admin();
  const { count: stopCount } = await db
    .from("dart_stops")
    .select("stop_id", { count: "exact", head: true });
  if (!stopCount) {
    return {
      ...base,
      ok: false,
      errorCode: "no_schedule",
      message: "No hay paradas de DART cargadas en Supabase.",
    };
  }

  const services = await activeServiceIds(serviceDate, weekday);
  if (services.length === 0) {
    return {
      ...base,
      ok: false,
      errorCode: "no_schedule",
      message: "No hay servicio de DART en esa fecha.",
    };
  }

  const originStops = await nearbyStops(input.origin.latitude, input.origin.longitude);
  if (originStops.length === 0) {
    return {
      ...base,
      ok: false,
      errorCode: "no_stops_near_origin",
      message: "No encontramos paradas de DART cerca del punto de partida.",
    };
  }
  const destStops = await nearbyStops(input.destination.latitude, input.destination.longitude);
  if (destStops.length === 0) {
    return {
      ...base,
      ok: false,
      errorCode: "no_stops_near_destination",
      message: "No encontramos paradas de DART cerca del destino.",
    };
  }

  const anchor = input.timeMode === "now" ? now.seconds : (input.timeSeconds ?? now.seconds);
  const searchFrom = input.timeMode === "arrive" ? Math.max(0, anchor - 7200) : anchor;
  const searchTo = input.timeMode === "arrive" ? anchor : anchor + 7200;

  const originStopIds = originStops.map((s: any) => s.stop_id);
  const destStopIds = destStops.map((s: any) => s.stop_id);
  const walkTo = new Map<string, number>(originStops.map((s: any) => [s.stop_id, s.meters]));
  const walkFrom = new Map<string, number>(destStops.map((s: any) => [s.stop_id, s.meters]));

  const { data: boardTimes } = await db
    .from("dart_stop_times")
    .select("trip_id,stop_id,stop_sequence,departure_seconds,arrival_seconds")
    .in("stop_id", originStopIds)
    .gte("departure_seconds", searchFrom)
    .lte("departure_seconds", searchTo + 3600)
    .order("departure_seconds", { ascending: true })
    .limit(1500);

  const { data: alightTimes } = await db
    .from("dart_stop_times")
    .select("trip_id,stop_id,stop_sequence,arrival_seconds")
    .in("stop_id", destStopIds)
    .gte("arrival_seconds", searchFrom)
    .lte("arrival_seconds", searchTo + 7200)
    .order("arrival_seconds", { ascending: true })
    .limit(2000);

  const tripIds = [
    ...new Set([...(boardTimes ?? []), ...(alightTimes ?? [])].map((r: any) => r.trip_id)),
  ];
  if (tripIds.length === 0) {
    return {
      ...base,
      ok: false,
      errorCode: "no_trips",
      message: "No hay viajes disponibles a esa hora.",
    };
  }

  const tripRows: any[] = [];
  for (let i = 0; i < tripIds.length; i += 300) {
    const { data } = await db
      .from("dart_trips")
      .select("trip_id,route_id,service_id,trip_headsign,shape_id,wheelchair_accessible")
      .in("trip_id", tripIds.slice(i, i + 300));
    tripRows.push(...(data ?? []));
  }
  const serviceSet = new Set(services);
  const tripById = new Map<string, any>(
    tripRows.filter((t) => serviceSet.has(t.service_id)).map((t) => [t.trip_id, t]),
  );

  const routeIds = [...new Set([...tripById.values()].map((t) => t.route_id))];
  const routeById = new Map<string, any>();
  for (let i = 0; i < routeIds.length; i += 300) {
    const { data } = await db
      .from("dart_routes")
      .select("route_id,route_short_name,route_long_name,route_color,route_text_color")
      .in("route_id", routeIds.slice(i, i + 300));
    for (const r of data ?? []) routeById.set(r.route_id, r);
  }

  const stopById = new Map<string, any>();
  for (const s of [...originStops, ...destStops]) stopById.set(s.stop_id, s);

  const boards = (boardTimes ?? []).filter((b: any) => tripById.has(b.trip_id));
  const alights = (alightTimes ?? []).filter((a: any) => tripById.has(a.trip_id));

  type Ride = {
    trip: any;
    boardStopId: string;
    boardSeq: number;
    boardSec: number;
    alightStopId: string;
    alightSeq: number;
    alightSec: number;
  };

  const rides: Ride[] = [];
  const alightsByTrip = new Map<string, any[]>();
  for (const a of alights) {
    const list = alightsByTrip.get(a.trip_id) ?? [];
    list.push(a);
    alightsByTrip.set(a.trip_id, list);
  }
  for (const b of boards) {
    for (const a of alightsByTrip.get(b.trip_id) ?? []) {
      if (a.stop_sequence <= b.stop_sequence) continue;
      if (a.arrival_seconds == null || b.departure_seconds == null) continue;
      rides.push({
        trip: tripById.get(b.trip_id),
        boardStopId: b.stop_id,
        boardSeq: b.stop_sequence,
        boardSec: b.departure_seconds,
        alightStopId: a.stop_id,
        alightSeq: a.stop_sequence,
        alightSec: a.arrival_seconds,
      });
    }
  }

  /* ---- one-transfer itineraries ------------------------------------ */
  type TwoRide = { first: Ride; second: Ride; transferStopId: string };
  const twoRides: TwoRide[] = [];
  if (rides.length < 3) {
    const firstTripIds = [...new Set(boards.map((b: any) => b.trip_id))].slice(0, 40);
    const secondTripIds = [...new Set(alights.map((a: any) => a.trip_id))].slice(0, 60);
    if (firstTripIds.length && secondTripIds.length) {
      const { data: firstStops } = await db
        .from("dart_stop_times")
        .select("trip_id,stop_id,stop_sequence,arrival_seconds")
        .in("trip_id", firstTripIds)
        .limit(4000);
      const { data: secondStops } = await db
        .from("dart_stop_times")
        .select("trip_id,stop_id,stop_sequence,departure_seconds")
        .in("trip_id", secondTripIds)
        .limit(6000);

      const secondByStop = new Map<string, any[]>();
      for (const s of secondStops ?? []) {
        const list = secondByStop.get(s.stop_id) ?? [];
        list.push(s);
        secondByStop.set(s.stop_id, list);
      }
      const boardByTrip = new Map<string, any>();
      for (const b of boards) if (!boardByTrip.has(b.trip_id)) boardByTrip.set(b.trip_id, b);

      const transferStopIds = new Set<string>();
      for (const fs of firstStops ?? []) {
        const board = boardByTrip.get(fs.trip_id);
        if (!board || fs.stop_sequence <= board.stop_sequence || fs.arrival_seconds == null)
          continue;
        const candidates = secondByStop.get(fs.stop_id);
        if (!candidates) continue;
        for (const sc of candidates) {
          if (sc.departure_seconds == null) continue;
          if (sc.departure_seconds < fs.arrival_seconds + MIN_TRANSFER_SECONDS) continue;
          const secondAlight = (alightsByTrip.get(sc.trip_id) ?? []).find(
            (a: any) => a.stop_sequence > sc.stop_sequence && a.arrival_seconds != null,
          );
          if (!secondAlight) continue;
          const firstTrip = tripById.get(fs.trip_id);
          const secondTrip = tripById.get(sc.trip_id);
          if (!firstTrip || !secondTrip || firstTrip.route_id === secondTrip.route_id) continue;
          transferStopIds.add(fs.stop_id);
          twoRides.push({
            transferStopId: fs.stop_id,
            first: {
              trip: firstTrip,
              boardStopId: board.stop_id,
              boardSeq: board.stop_sequence,
              boardSec: board.departure_seconds,
              alightStopId: fs.stop_id,
              alightSeq: fs.stop_sequence,
              alightSec: fs.arrival_seconds,
            },
            second: {
              trip: secondTrip,
              boardStopId: sc.stop_id,
              boardSeq: sc.stop_sequence,
              boardSec: sc.departure_seconds,
              alightStopId: secondAlight.stop_id,
              alightSeq: secondAlight.stop_sequence,
              alightSec: secondAlight.arrival_seconds,
            },
          });
          if (twoRides.length > 40) break;
        }
        if (twoRides.length > 40) break;
      }
      if (transferStopIds.size) {
        const { data: xs } = await db
          .from("dart_stops")
          .select("stop_id,stop_name,stop_lat,stop_lon,wheelchair_boarding,stop_code")
          .in("stop_id", [...transferStopIds]);
        for (const s of xs ?? []) stopById.set(s.stop_id, s);
      }
    }
  }

  if (rides.length === 0 && twoRides.length === 0) {
    return {
      ...base,
      ok: false,
      errorCode: "no_trips",
      message: "No hay viajes disponibles a esa hora.",
    };
  }

  /* ---- realtime overlay -------------------------------------------- */
  await ensureRealtimeFresh();
  const usedTripIds = [
    ...new Set([
      ...rides.map((r) => r.trip.trip_id),
      ...twoRides.flatMap((t) => [t.first.trip.trip_id, t.second.trip.trip_id]),
    ]),
  ].slice(0, 300);
  const predictions = new Map<
    string,
    { arr: number | null; dep: number | null; delay: number | null; ts: string }
  >();
  let realtimeUpdatedAt: string | null = null;
  if (usedTripIds.length) {
    const { data: updates } = await db
      .from("dart_trip_updates")
      .select("trip_id,stop_id,arrival_time,departure_time,delay_seconds,feed_timestamp")
      .in("trip_id", usedTripIds);
    for (const u of updates ?? []) {
      const fresh = u.feed_timestamp
        ? (Date.now() - new Date(u.feed_timestamp).getTime()) / 1000 <= REALTIME_MAX_AGE_SECONDS
        : false;
      if (!fresh) continue;
      realtimeUpdatedAt = u.feed_timestamp;
      predictions.set(`${u.trip_id}|${u.stop_id}`, {
        arr: u.arrival_time ? instantToServiceSeconds(u.arrival_time, serviceDate) : null,
        dep: u.departure_time ? instantToServiceSeconds(u.departure_time, serviceDate) : null,
        delay: u.delay_seconds ?? null,
        ts: u.feed_timestamp,
      });
    }
  }

  /* ---- build legs ---------------------------------------------------- */
  const walkSeconds = (meters: number) => Math.max(60, Math.round(meters / WALK_METERS_PER_SECOND));

  const busLeg = (ride: Ride): PlanLeg | null => {
    const route = routeById.get(ride.trip.route_id);
    const boardStop = stopById.get(ride.boardStopId);
    const alightStop = stopById.get(ride.alightStopId);
    if (!boardStop || !alightStop) return null;
    const pDep = predictions.get(`${ride.trip.trip_id}|${ride.boardStopId}`);
    const pArr = predictions.get(`${ride.trip.trip_id}|${ride.alightStopId}`);
    return {
      mode: "bus",
      routeId: ride.trip.route_id,
      routeShortName: route?.route_short_name ?? null,
      routeLongName: route?.route_long_name ?? null,
      routeColor: route?.route_color ?? null,
      routeTextColor: route?.route_text_color ?? null,
      tripId: ride.trip.trip_id,
      headsign: ride.trip.trip_headsign ?? null,
      wheelchairAccessible:
        ride.trip.wheelchair_accessible === 1
          ? true
          : ride.trip.wheelchair_accessible === 2
            ? false
            : null,
      boardStopId: ride.boardStopId,
      boardStopName: boardStop.stop_name,
      boardLat: boardStop.stop_lat,
      boardLon: boardStop.stop_lon,
      alightStopId: ride.alightStopId,
      alightStopName: alightStop.stop_name,
      alightLat: alightStop.stop_lat,
      alightLon: alightStop.stop_lon,
      scheduledDepartureSeconds: ride.boardSec,
      scheduledArrivalSeconds: ride.alightSec,
      realtimeDepartureSeconds: pDep?.dep ?? null,
      realtimeArrivalSeconds: pArr?.arr ?? null,
      delaySeconds: pDep?.delay ?? pArr?.delay ?? null,
      stopCount: Math.max(1, ride.alightSeq - ride.boardSeq),
      shapeId: ride.trip.shape_id ?? null,
    };
  };

  const assemble = (busLegs: PlanLeg[]): PlanItinerary | null => {
    const first = busLegs[0];
    const last = busLegs[busLegs.length - 1];
    if (!first || !last || first.mode !== "bus" || last.mode !== "bus") return null;
    const startWalkMeters = walkTo.get(first.boardStopId) ?? 0;
    const endWalkMeters = walkFrom.get(last.alightStopId) ?? 0;
    const startWalk = walkSeconds(startWalkMeters);
    const endWalk = walkSeconds(endWalkMeters);

    const legs: PlanLeg[] = [
      {
        mode: "walk",
        seconds: startWalk,
        meters: Math.round(startWalkMeters),
        from: input.origin.label,
        to: first.boardStopName,
        fromLat: input.origin.latitude,
        fromLon: input.origin.longitude,
        toLat: first.boardLat,
        toLon: first.boardLon,
      },
    ];
    busLegs.forEach((leg, i) => {
      const prev = busLegs[i - 1];
      if (
        prev &&
        prev.mode === "bus" &&
        leg.mode === "bus" &&
        prev.alightStopId !== leg.boardStopId
      ) {
        const m = haversine(prev.alightLat, prev.alightLon, leg.boardLat, leg.boardLon);
        legs.push({
          mode: "walk",
          seconds: walkSeconds(m),
          meters: Math.round(m),
          from: prev.alightStopName,
          to: leg.boardStopName,
          fromLat: prev.alightLat,
          fromLon: prev.alightLon,
          toLat: leg.boardLat,
          toLon: leg.boardLon,
        });
      }
      legs.push(leg);
    });
    legs.push({
      mode: "walk",
      seconds: endWalk,
      meters: Math.round(endWalkMeters),
      from: last.alightStopName,
      to: input.destination.label,
      fromLat: last.alightLat,
      fromLon: last.alightLon,
      toLat: input.destination.latitude,
      toLon: input.destination.longitude,
    });

    const boardSec = first.realtimeDepartureSeconds ?? first.scheduledDepartureSeconds;
    const arriveSec = last.realtimeArrivalSeconds ?? last.scheduledArrivalSeconds;
    const departureSeconds = boardSec - startWalk;
    if (departureSeconds < anchor - 300 && input.timeMode !== "arrive") return null;
    const arrivalSeconds = arriveSec + endWalk;
    if (input.timeMode === "arrive" && arrivalSeconds > anchor) return null;

    const walkTotal = legs
      .filter((l): l is Extract<PlanLeg, { mode: "walk" }> => l.mode === "walk")
      .reduce((s, l) => s + l.seconds, 0);

    return {
      id: busLegs.map((l) => (l.mode === "bus" ? `${l.tripId}@${l.boardStopId}` : "w")).join("+"),
      kind: "recommended",
      legs,
      departureSeconds,
      arrivalSeconds,
      totalSeconds: arrivalSeconds - departureSeconds,
      walkSeconds: walkTotal,
      transfers: busLegs.length - 1,
      usesRealtime: busLegs.some(
        (l) =>
          l.mode === "bus" &&
          (l.realtimeArrivalSeconds != null || l.realtimeDepartureSeconds != null),
      ),
      alertIds: [],
    };
  };

  const candidates: PlanItinerary[] = [];
  for (const ride of rides) {
    const leg = busLeg(ride);
    if (!leg) continue;
    const it = assemble([leg]);
    if (it) candidates.push(it);
  }
  for (const two of twoRides) {
    const a = busLeg(two.first);
    const b = busLeg(two.second);
    if (!a || !b) continue;
    const it = assemble([a, b]);
    if (it) candidates.push(it);
  }
  if (candidates.length === 0) {
    return {
      ...base,
      ok: false,
      errorCode: "no_trips",
      message: "No hay viajes disponibles a esa hora.",
    };
  }

  const unique = new Map<string, PlanItinerary>();
  for (const c of candidates.sort((x, y) => x.arrivalSeconds - y.arrivalSeconds)) {
    if (!unique.has(c.id)) unique.set(c.id, c);
  }
  const all = [...unique.values()];

  const recommended = [...all].sort(
    (a, b) =>
      a.arrivalSeconds - b.arrivalSeconds ||
      a.transfers - b.transfers ||
      a.walkSeconds - b.walkSeconds,
  )[0]!;
  const fastest = [...all].sort((a, b) => a.totalSeconds - b.totalSeconds)[0]!;
  const easiest = [...all].sort(
    (a, b) =>
      a.transfers - b.transfers ||
      a.walkSeconds - b.walkSeconds ||
      a.arrivalSeconds - b.arrivalSeconds,
  )[0]!;

  const chosen: PlanItinerary[] = [];
  const push = (it: PlanItinerary, kind: PlanItinerary["kind"]) => {
    if (chosen.some((c) => c.id === it.id)) return;
    chosen.push({ ...it, kind });
  };
  push(recommended, "recommended");
  push(fastest, "fastest");
  push(easiest, "least_walking");

  /* ---- alerts affecting the chosen options -------------------------- */
  const usedRoutes = [
    ...new Set(
      chosen.flatMap((i) => i.legs.filter((l) => l.mode === "bus").map((l: any) => l.routeId)),
    ),
  ];
  const usedStops = [
    ...new Set(
      chosen.flatMap((i) =>
        i.legs.filter((l) => l.mode === "bus").flatMap((l: any) => [l.boardStopId, l.alightStopId]),
      ),
    ),
  ];
  const { data: alertRows } = await db.from("dart_service_alerts").select("*").limit(200);
  const alerts: ServiceAlert[] = (alertRows ?? []).filter(
    (a: any) =>
      (a.informed_routes ?? []).some((r: string) => usedRoutes.includes(r)) ||
      (a.informed_stops ?? []).some((s: string) => usedStops.includes(s)) ||
      ((a.informed_routes ?? []).length === 0 && (a.informed_stops ?? []).length === 0),
  );
  for (const it of chosen) {
    it.alertIds = alerts
      .filter(
        (a) =>
          it.legs.some(
            (l) =>
              l.mode === "bus" &&
              ((a.informed_routes ?? []).includes(l.routeId) ||
                (a.informed_stops ?? []).includes(l.boardStopId) ||
                (a.informed_stops ?? []).includes(l.alightStopId)),
          ) ||
          ((a.informed_routes ?? []).length === 0 && (a.informed_stops ?? []).length === 0),
      )
      .map((a) => a.alert_id);
  }

  return {
    ok: true,
    itineraries: chosen,
    alerts,
    realtimeAvailable: realtimeUpdatedAt !== null,
    realtimeUpdatedAt,
    scheduleOnly: realtimeUpdatedAt === null,
    serviceDate,
  };
}

function weekdayOf(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    d.getUTCDay()
  ]!;
}

/* ------------------------------------------------------------------ */
/* Shapes, nearby stops, alerts, vehicles                               */
/* ------------------------------------------------------------------ */

export async function getShapes(shapeIds: string[]) {
  if (shapeIds.length === 0) return [];
  try {
    const db = await admin();
    const { data } = await db
      .from("dart_shapes")
      .select("shape_id,points")
      .in("shape_id", shapeIds);
    if (data && data.length > 0) return data;
  } catch {
    // ignore
  }
  return [];
}

export async function getNearbyStopsWithArrivals(lat: number, lon: number) {
  try {
    const db = await admin();
    const now = nowInService();
    const stops = await nearbyStops(lat, lon, 6);
    if (stops.length > 0) {
      await ensureRealtimeFresh();
      const stopIds = stops.map((s: any) => s.stop_id);
      const services = await activeServiceIds(now.date, now.weekday);
      const serviceSet = new Set(services);

      const { data: times } = await db
        .from("dart_stop_times")
        .select("trip_id,stop_id,departure_seconds")
        .in("stop_id", stopIds)
        .gte("departure_seconds", now.seconds)
        .lte("departure_seconds", now.seconds + 5400)
        .order("departure_seconds", { ascending: true })
        .limit(600);

      const tripIds = [...new Set((times ?? []).map((t: any) => t.trip_id))];
      const tripById = new Map<string, any>();
      for (let i = 0; i < tripIds.length; i += 300) {
        const { data } = await db
          .from("dart_trips")
          .select("trip_id,route_id,service_id,trip_headsign")
          .in("trip_id", tripIds.slice(i, i + 300));
        for (const t of data ?? []) if (serviceSet.has(t.service_id)) tripById.set(t.trip_id, t);
      }
      const routeIds = [...new Set([...tripById.values()].map((t) => t.route_id))];
      const routeById = new Map<string, any>();
      if (routeIds.length) {
        const { data } = await db
          .from("dart_routes")
          .select("route_id,route_short_name,route_long_name,route_color")
          .in("route_id", routeIds);
        for (const r of data ?? []) routeById.set(r.route_id, r);
      }

      let realtimeUpdatedAt: string | null = null;
      const rtByKey = new Map<string, number>();
      if (tripIds.length) {
        const { data: updates } = await db
          .from("dart_trip_updates")
          .select("trip_id,stop_id,arrival_time,departure_time,feed_timestamp")
          .in("trip_id", tripIds.slice(0, 300));
        for (const u of updates ?? []) {
          const fresh = u.feed_timestamp
            ? (Date.now() - new Date(u.feed_timestamp).getTime()) / 1000 <= REALTIME_MAX_AGE_SECONDS
            : false;
          if (!fresh) continue;
          realtimeUpdatedAt = u.feed_timestamp;
          const sec = instantToServiceSeconds(u.departure_time ?? u.arrival_time ?? "", now.date);
          if (sec != null) rtByKey.set(`${u.trip_id}|${u.stop_id}`, sec);
        }
      }

      const result = stops.map((s: any) => {
        const rows = (times ?? []).filter(
          (t: any) => t.stop_id === s.stop_id && tripById.has(t.trip_id),
        );
        const routesSeen = new Map<string, any>();
        const arrivals = rows.slice(0, 20).map((t: any) => {
          const trip = tripById.get(t.trip_id);
          const route = routeById.get(trip.route_id);
          if (route) routesSeen.set(route.route_id, route);
          const rt = rtByKey.get(`${t.trip_id}|${t.stop_id}`);
          const sec = rt ?? t.departure_seconds;
          return {
            routeShortName: route?.route_short_name ?? null,
            headsign: trip.trip_headsign ?? null,
            minutes: Math.max(0, Math.round((sec - now.seconds) / 60)),
            realtime: rt != null,
          };
        });
        return {
          stop_id: s.stop_id,
          stop_name: s.stop_name,
          stop_code: s.stop_code ?? null,
          stop_lat: s.stop_lat,
          stop_lon: s.stop_lon,
          wheelchair_boarding: s.wheelchair_boarding ?? null,
          meters: Math.round(s.meters),
          walkMinutes: Math.max(1, Math.round(s.meters / WALK_METERS_PER_SECOND / 60)),
          routes: [...routesSeen.values()].map((r) => ({
            routeId: r.route_id,
            shortName: r.route_short_name,
            longName: r.route_long_name,
            color: r.route_color,
          })),
          arrivals: arrivals.slice(0, 5),
        };
      });

      if (result.length > 0) return { stops: result, realtimeUpdatedAt };
    }
  } catch {
    // ignore
  }

  return {
    stops: [],
    realtimeUpdatedAt: null,
  };
}

export async function searchStopsByName(query: string) {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const db = await admin();
    const { data } = await db
      .from("dart_stops")
      .select("stop_id,stop_name,stop_code,stop_lat,stop_lon")
      .or(`stop_name.ilike.%${q.replace(/[%,]/g, "")}%,stop_code.ilike.%${q.replace(/[%,]/g, "")}%`)
      .limit(10);
    if (data && data.length > 0) return data;
  } catch {
    // ignore
  }
  return [];
}

export async function getActiveAlerts(): Promise<ServiceAlert[]> {
  try {
    await ensureRealtimeFresh();
    const db = await admin();
    const { data } = await db.from("dart_service_alerts").select("*").limit(100);
    if (data && data.length > 0) return data as ServiceAlert[];
  } catch {
    // ignore
  }
  return [];
}

export async function getVehiclesForRoutes(routeIds: string[]) {
  try {
    await ensureRealtimeFresh();
    const db = await admin();
    let q = db
      .from("dart_vehicle_positions")
      .select("vehicle_id,route_id,trip_id,latitude,longitude,bearing,feed_timestamp");
    if (routeIds.length) q = q.in("route_id", routeIds);
    const { data } = await q.limit(300);
    const filtered = (data ?? []).filter(
      (v: any) =>
        v.feed_timestamp &&
        (Date.now() - new Date(v.feed_timestamp).getTime()) / 1000 <= REALTIME_MAX_AGE_SECONDS,
    );
    if (filtered.length > 0) return filtered;
  } catch {
    // ignore
  }
  return [];
}

export async function getDiagnostics() {
  const db = await admin();
  const counts: Record<string, number> = {};
  for (const table of [
    "dart_routes",
    "dart_stops",
    "dart_trips",
    "dart_stop_times",
    "dart_shapes",
    "dart_vehicle_positions",
    "dart_service_alerts",
  ]) {
    const { count } = await db.from(table).select("*", { count: "exact", head: true });
    counts[table] = count ?? 0;
  }
  const { data: status } = await db.from("dart_feed_status").select("*");
  const { data: logs } = await db
    .from("dart_sync_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(25);
  const configured = feedsConfigured();
  return {
    counts,
    configured,
    status: (status ?? []).map((s: any) => ({
      ...s,
      configured: configured[s.feed_key as DartFeedKey] ?? false,
    })),
    logs: logs ?? [],
  };
}
