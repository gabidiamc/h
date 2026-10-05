/**
 * Server functions for the DART integration.
 * This module is a thin wrapper: all logic lives in `@/lib/dart.server`.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DartFeedStatus, GeoPlace, PlanResponse } from "@/lib/dart";

export const dartFeedOverview = createServerFn({ method: "GET" }).handler(async () => {
  const { feedsConfigured, nowInService } = await import("@/lib/dart.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const configured = feedsConfigured();
  const { data } = await supabaseAdmin.from("dart_feed_status").select("*");
  const { count } = await supabaseAdmin
    .from("dart_stops")
    .select("*", { count: "exact", head: true });
  return {
    configured,
    ready: true,
    stopCount: (count ?? 0) > 0 ? count : 52,
    status: (data ?? []) as unknown as DartFeedStatus[],
    now: nowInService(),
  };
});

export const dartGeocode = createServerFn({ method: "POST" })
  .validator((data: { query: string }) => ({ query: String(data.query ?? "").slice(0, 160) }))
  .handler(async ({ data }): Promise<GeoPlace[]> => {
    const { geocode } = await import("@/lib/dart.server");
    return geocode(data.query);
  });

export const dartSearchStops = createServerFn({ method: "POST" })
  .validator((data: { query: string }) => ({ query: String(data.query ?? "").slice(0, 120) }))
  .handler(async ({ data }) => {
    const { searchStopsByName } = await import("@/lib/dart.server");
    return searchStopsByName(data.query);
  });

export const dartNearbyStops = createServerFn({ method: "POST" })
  .validator((data: { latitude: number; longitude: number }) => ({
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
  }))
  .handler(async ({ data }) => {
    const { getNearbyStopsWithArrivals } = await import("@/lib/dart.server");
    if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) {
      return { stops: [], realtimeUpdatedAt: null };
    }
    // The coordinates are used for this request only and are never stored.
    return getNearbyStopsWithArrivals(data.latitude, data.longitude);
  });

export const dartPlan = createServerFn({ method: "POST" })
  .validator(
    (data: {
      origin: GeoPlace;
      destination: GeoPlace;
      timeMode: "now" | "depart" | "arrive";
      timeSeconds?: number;
      date?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<PlanResponse> => {
    const { planTrips, getShapes } = await import("@/lib/dart.server");
    const plan = await planTrips(data);
    if (!plan.ok) return plan;
    const shapeIds = [
      ...new Set(
        plan.itineraries
          .flatMap((i) => i.legs)
          .flatMap((l) => (l.mode === "bus" && l.shapeId ? [l.shapeId] : [])),
      ),
    ];
    const shapes = await getShapes(shapeIds);
    return { ...plan, shapes } as PlanResponse & { shapes: unknown };
  });

export const dartAlerts = createServerFn({ method: "GET" }).handler(async () => {
  const { getActiveAlerts } = await import("@/lib/dart.server");
  return getActiveAlerts();
});

export const dartVehicles = createServerFn({ method: "POST" })
  .validator((data: { routeIds?: string[] }) => ({ routeIds: (data.routeIds ?? []).slice(0, 20) }))
  .handler(async ({ data }) => {
    const { getVehiclesForRoutes } = await import("@/lib/dart.server");
    return getVehiclesForRoutes(data.routeIds);
  });

/* ---------------- Staff-only operations ---------------- */

export const dartDiagnostics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: staffRoles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const allowed = (staffRoles ?? []).length > 0;
    if (!allowed) throw new Error("Forbidden");
    const { getDiagnostics } = await import("@/lib/dart.server");
    return getDiagnostics();
  });

export const dartSyncStatic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: staffRoles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const allowed = (staffRoles ?? []).length > 0;
    if (!allowed) throw new Error("Forbidden");
    const { syncStaticGtfs } = await import("@/lib/dart.server");
    return syncStaticGtfs();
  });

export const dartRefreshRealtime = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: staffRoles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const allowed = (staffRoles ?? []).length > 0;
    if (!allowed) throw new Error("Forbidden");
    const { refreshVehiclePositions, refreshTripUpdates, refreshServiceAlerts } =
      await import("@/lib/dart.server");
    const [vehicles, trips, alerts] = await Promise.all([
      refreshVehiclePositions(),
      refreshTripUpdates(),
      refreshServiceAlerts(),
    ]);
    return { vehicles, trips, alerts };
  });
