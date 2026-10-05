import { supabase } from "@/integrations/supabase/client";
import type { AnalyticsConfig } from "./types";

export type AnalyticsPeriodKey = "24h" | "7d" | "30d" | "90d" | "12m" | "all";

export interface AnalyticsDateRange {
  period: AnalyticsPeriodKey;
  label: string;
  startDate: Date | null;
  endDate: Date;
  previousStartDate: Date | null;
  previousEndDate: Date | null;
}

export interface AnalyticsComparisonMetric {
  current: number;
  previous: number | null;
  deltaPercent: number | null;
  direction: "up" | "down" | "neutral" | "insufficient";
  hasComparison: boolean;
}

export interface AnalyticsOverviewData {
  uniqueUsers: AnalyticsComparisonMetric;
  sessions: AnalyticsComparisonMetric;
  pageViews: AnalyticsComparisonMetric;
  uniquePages: AnalyticsComparisonMetric;
  searches: AnalyticsComparisonMetric;
  events: AnalyticsComparisonMetric;
  pwaInstalls: AnalyticsComparisonMetric;
  activeUsersNow: number;
  hasAnyData: boolean;
}

export interface DailySeriesPoint {
  date: string;
  label: string;
  pageViews: number;
  uniqueUsers: number;
  sessions: number;
  searches: number;
}

export interface RealtimePresenceItem {
  currentPath: string;
  currentContentType: string;
  currentContentId: string | null;
  language: string;
  deviceType: string;
  isPwa: boolean;
  startedAt: string;
  lastSeenAt: string;
  secondsAgo: number;
}

export interface RealtimePresenceSnapshot {
  activeCount: number;
  timeoutSeconds: number;
  lastActivityAt: string | null;
  items: RealtimePresenceItem[];
}

export interface AudienceRow {
  dimension: string;
  users: number;
  sessions: number;
  percentage: number;
}

export interface AudienceAnalyticsData {
  languages: AudienceRow[];
  devices: AudienceRow[];
  browsers: AudienceRow[];
  operatingSystems: AudienceRow[];
  hasAnyData: boolean;
}

export type DashboardContentCategory =
  | "all"
  | "pages"
  | "articles"
  | "categories"
  | "resources"
  | "programs"
  | "activities"
  | "faqs"
  | "announcements"
  | "schools"
  | "contacts"
  | "external_links";

export interface ContentPerformanceRow {
  key: string;
  contentId: string;
  title: string;
  contentType: string;
  categoryGroup: Exclude<DashboardContentCategory, "all">;
  views: number;
  users: number;
  sessions: number;
  avgDurationSeconds: number | null;
  isAvailable: boolean;
}

export interface ContentAnalyticsData {
  rows: ContentPerformanceRow[];
  hasAnyData: boolean;
}

export interface SearchTermRow {
  term: string;
  searches: number;
  users: number;
  avgResults: number;
  zeroResultsCount: number;
}

export interface SearchesAnalyticsData {
  totalSearches: number;
  uniqueUsers: number;
  uniqueTerms: number;
  withResults: number;
  withoutResults: number;
  successRatePercent: number | null;
  avgResults: number | null;
  topTerms: SearchTermRow[];
  hasAnyData: boolean;
}

export interface SchoolAnalyticsRow {
  schoolId: string;
  schoolName: string;
  shortName: string | null;
  pageViews: number;
  users: number;
  sessions: number;
  selections: number;
}

export interface SchoolsAnalyticsData {
  rows: SchoolAnalyticsRow[];
  hasAnyData: boolean;
}

export interface PwaAnalyticsData {
  launches: number;
  promptsShown: number;
  installs: number;
  installRatePercent: number | null;
  byPlatform: Array<{ platform: string; count: number }>;
  hasAnyData: boolean;
}

export interface NavigationPathRow {
  path: string;
  count: number;
  users: number;
  sessions: number;
}

export interface NavigationAnalyticsData {
  landingPages: NavigationPathRow[];
  exitPages: NavigationPathRow[];
  topVisitedPages: NavigationPathRow[];
  hasAnyData: boolean;
}

export const ANALYTICS_PERIOD_OPTIONS: Array<{
  key: AnalyticsPeriodKey;
  label: string;
  shortLabel: string;
}> = [
  { key: "24h", label: "Últimas 24 horas", shortLabel: "24h" },
  { key: "7d", label: "Últimos 7 días", shortLabel: "7 días" },
  { key: "30d", label: "Últimos 30 días", shortLabel: "30 días" },
  { key: "90d", label: "Últimos 90 días", shortLabel: "90 días" },
  { key: "12m", label: "Últimos 12 meses", shortLabel: "12 meses" },
  { key: "all", label: "Todo el historial", shortLabel: "Todo" },
];

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function computeAnalyticsDateRange(
  period: AnalyticsPeriodKey,
  now: Date = new Date(),
): AnalyticsDateRange {
  const endDate = new Date(now.getTime());

  if (period === "all") {
    return {
      period,
      label: "Todo el historial",
      startDate: null,
      endDate,
      previousStartDate: null,
      previousEndDate: null,
    };
  }

  let durationMs = 7 * DAY_MS;
  let label = "Últimos 7 días";

  switch (period) {
    case "24h":
      durationMs = 24 * HOUR_MS;
      label = "Últimas 24 horas";
      break;
    case "7d":
      durationMs = 7 * DAY_MS;
      label = "Últimos 7 días";
      break;
    case "30d":
      durationMs = 30 * DAY_MS;
      label = "Últimos 30 días";
      break;
    case "90d":
      durationMs = 90 * DAY_MS;
      label = "Últimos 90 días";
      break;
    case "12m":
      durationMs = 365 * DAY_MS;
      label = "Últimos 12 meses";
      break;
  }

  const startDate = new Date(endDate.getTime() - durationMs);
  const previousEndDate = new Date(startDate.getTime());
  const previousStartDate = new Date(previousEndDate.getTime() - durationMs);

  return {
    period,
    label,
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
  };
}

export function buildComparisonMetric(
  current: number,
  previous: number | null,
  period: AnalyticsPeriodKey,
): AnalyticsComparisonMetric {
  if (period === "all" || previous === null) {
    return {
      current,
      previous: null,
      deltaPercent: null,
      direction: "insufficient",
      hasComparison: false,
    };
  }

  if (current === 0 && previous === 0) {
    return {
      current,
      previous,
      deltaPercent: null,
      direction: "insufficient",
      hasComparison: false,
    };
  }

  if (previous === 0) {
    return {
      current,
      previous: 0,
      deltaPercent: null,
      direction: current > 0 ? "up" : "neutral",
      hasComparison: true,
    };
  }

  const rawDelta = ((current - previous) / previous) * 100;
  const roundedDelta = Math.round(rawDelta * 10) / 10;

  return {
    current,
    previous,
    deltaPercent: roundedDelta,
    direction: current > previous ? "up" : current < previous ? "down" : "neutral",
    hasComparison: true,
  };
}

function throwIfSupabaseError(error: { message?: string; code?: string } | null, context: string) {
  if (error) {
    throw new Error(
      `No fue posible cargar ${context}: ${error.message || "Error de consulta"}${
        error.code ? ` (${error.code})` : ""
      }`,
    );
  }
}

export async function fetchDashboardAnalyticsConfig(): Promise<AnalyticsConfig> {
  const { data, error } = await supabase
    .from("dmps_analytics_config")
    .select(
      "id, enabled, retention_days, presence_timeout_seconds, track_page_views, track_searches, track_events, track_pwa, track_referrer, track_device, track_browser, track_os, track_language, track_country",
    )
    .eq("id", "default")
    .maybeSingle();

  throwIfSupabaseError(error, "configuración de analítica");

  return {
    id: data?.id || "default",
    enabled: data?.enabled !== false,
    retention_days: Number(data?.retention_days) || 365,
    presence_timeout_seconds: Number(data?.presence_timeout_seconds) || 60,
    track_page_views: data?.track_page_views !== false,
    track_searches: data?.track_searches !== false,
    track_events: data?.track_events !== false,
    track_pwa: data?.track_pwa !== false,
    track_referrer: data?.track_referrer !== false,
    track_device: data?.track_device !== false,
    track_browser: data?.track_browser !== false,
    track_os: data?.track_os !== false,
    track_language: data?.track_language !== false,
    track_country: data?.track_country !== false,
  };
}

interface RawSessionRecord {
  id: string;
  anonymous_id: string;
  started_at: string;
  last_seen_at: string;
  landing_path: string;
  exit_path: string | null;
  device_type: string | null;
  browser: string | null;
  operating_system: string | null;
  language: string | null;
  is_pwa: boolean;
  duration_seconds: number | null;
}

interface RawPageViewRecord {
  id: string;
  anonymous_id: string;
  session_id: string;
  path: string;
  title: string | null;
  content_type: string | null;
  content_id: string | null;
  school_id: string | null;
  language: string | null;
  entered_at: string;
  duration_seconds: number | null;
}

interface RawEventRecord {
  id: string;
  anonymous_id: string;
  session_id: string;
  event_name: string;
  event_category: string | null;
  path: string | null;
  content_type: string | null;
  content_id: string | null;
  school_id: string | null;
  language: string | null;
  metadata: unknown;
  created_at: string;
}

interface RawSearchRecord {
  id: string;
  anonymous_id: string;
  session_id: string;
  query: string;
  normalized_query: string;
  result_count: number;
  language: string | null;
  path: string | null;
  created_at: string;
}

interface RawPwaRecord {
  id: string;
  anonymous_id: string;
  session_id: string | null;
  event_type: string;
  platform: string | null;
  device_type: string | null;
  browser: string | null;
  operating_system: string | null;
  created_at: string;
}

async function fetchSessionsInRange(
  startIso: string | null,
  endIso: string,
): Promise<RawSessionRecord[]> {
  let query = supabase
    .from("dmps_analytics_sessions")
    .select(
      "id, anonymous_id, started_at, last_seen_at, landing_path, exit_path, device_type, browser, operating_system, language, is_pwa, duration_seconds",
    )
    .lte("started_at", endIso)
    .order("started_at", { ascending: false })
    .limit(10000);

  if (startIso) {
    query = query.gte("started_at", startIso);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, "sesiones");
  return (data ?? []) as RawSessionRecord[];
}

async function fetchPageViewsInRange(
  startIso: string | null,
  endIso: string,
  schoolFilter?: string | null,
): Promise<RawPageViewRecord[]> {
  let query = supabase
    .from("dmps_analytics_page_views")
    .select(
      "id, anonymous_id, session_id, path, title, content_type, content_id, school_id, language, entered_at, duration_seconds",
    )
    .lte("entered_at", endIso)
    .order("entered_at", { ascending: false })
    .limit(15000);

  if (startIso) {
    query = query.gte("entered_at", startIso);
  }
  if (schoolFilter && schoolFilter !== "all") {
    query = query.eq("school_id", schoolFilter);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, "vistas de página");
  return (data ?? []) as RawPageViewRecord[];
}

async function fetchEventsInRange(
  startIso: string | null,
  endIso: string,
  schoolFilter?: string | null,
): Promise<RawEventRecord[]> {
  let query = supabase
    .from("dmps_analytics_events")
    .select(
      "id, anonymous_id, session_id, event_name, event_category, path, content_type, content_id, school_id, language, metadata, created_at",
    )
    .lte("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(15000);

  if (startIso) {
    query = query.gte("created_at", startIso);
  }
  if (schoolFilter && schoolFilter !== "all") {
    query = query.eq("school_id", schoolFilter);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, "eventos");
  return (data ?? []) as RawEventRecord[];
}

async function fetchSearchesInRange(
  startIso: string | null,
  endIso: string,
): Promise<RawSearchRecord[]> {
  let query = supabase
    .from("dmps_analytics_searches")
    .select(
      "id, anonymous_id, session_id, query, normalized_query, result_count, language, path, created_at",
    )
    .lte("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(10000);

  if (startIso) {
    query = query.gte("created_at", startIso);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, "búsquedas");
  return (data ?? []) as RawSearchRecord[];
}

async function fetchPwaEventsInRange(
  startIso: string | null,
  endIso: string,
): Promise<RawPwaRecord[]> {
  let query = supabase
    .from("dmps_analytics_pwa")
    .select(
      "id, anonymous_id, session_id, event_type, platform, device_type, browser, operating_system, created_at",
    )
    .lte("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (startIso) {
    query = query.gte("created_at", startIso);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, "eventos de PWA");
  return (data ?? []) as RawPwaRecord[];
}

export async function fetchRealtimePresenceSnapshot(
  timeoutSeconds = 60,
): Promise<RealtimePresenceSnapshot> {
  const effectiveTimeout = Math.max(10, Number(timeoutSeconds) || 60);
  const nowMs = Date.now();
  const cutoffIso = new Date(nowMs - effectiveTimeout * 1000).toISOString();

  const { data, error } = await supabase
    .from("dmps_analytics_presence")
    .select(
      "current_path, current_content_type, current_content_id, language, device_type, is_pwa, started_at, last_seen_at",
    )
    .gte("last_seen_at", cutoffIso)
    .order("last_seen_at", { ascending: false })
    .limit(250);

  throwIfSupabaseError(error, "presencia en tiempo real");

  const rows = data ?? [];
  const items: RealtimePresenceItem[] = rows
    .filter((row) => {
      const seenMs = new Date(row.last_seen_at).getTime();
      return Number.isFinite(seenMs) && seenMs >= nowMs - effectiveTimeout * 1000;
    })
    .map((row) => {
      const seenMs = new Date(row.last_seen_at).getTime();
      const secondsAgo = Math.max(0, Math.round((nowMs - seenMs) / 1000));
      return {
        currentPath: row.current_path || "/",
        currentContentType: row.current_content_type || "page",
        currentContentId: row.current_content_id || null,
        language: row.language || "es",
        deviceType: row.device_type || "unknown",
        isPwa: Boolean(row.is_pwa),
        startedAt: row.started_at,
        lastSeenAt: row.last_seen_at,
        secondsAgo,
      };
    });

  return {
    activeCount: items.length,
    timeoutSeconds: effectiveTimeout,
    lastActivityAt: items[0]?.lastSeenAt ?? null,
    items,
  };
}

function summarizeWindowMetrics(params: {
  sessions: RawSessionRecord[];
  pageViews: RawPageViewRecord[];
  events: RawEventRecord[];
  searches: RawSearchRecord[];
  pwaEvents: RawPwaRecord[];
  schoolFilter?: string | null;
}) {
  const { sessions, pageViews, events, searches, pwaEvents, schoolFilter } = params;
  const scopedBySchool = Boolean(schoolFilter && schoolFilter !== "all");

  const uniqueVisitors = new Set<string>();
  const uniqueSessionIds = new Set<string>();
  const uniquePaths = new Set<string>();

  for (const pv of pageViews) {
    if (pv.anonymous_id) uniqueVisitors.add(pv.anonymous_id);
    if (pv.session_id) uniqueSessionIds.add(pv.session_id);
    if (pv.path) uniquePaths.add(pv.path);
  }

  for (const ev of events) {
    if (ev.anonymous_id) uniqueVisitors.add(ev.anonymous_id);
    if (ev.session_id) uniqueSessionIds.add(ev.session_id);
  }

  if (!scopedBySchool) {
    for (const s of sessions) {
      if (s.anonymous_id) uniqueVisitors.add(s.anonymous_id);
      if (s.id) uniqueSessionIds.add(s.id);
    }
    for (const sr of searches) {
      if (sr.anonymous_id) uniqueVisitors.add(sr.anonymous_id);
      if (sr.session_id) uniqueSessionIds.add(sr.session_id);
    }
    for (const pw of pwaEvents) {
      if (pw.anonymous_id) uniqueVisitors.add(pw.anonymous_id);
      if (pw.session_id) uniqueSessionIds.add(pw.session_id);
    }
  }

  const pwaInstallsCount = pwaEvents.filter((p) => p.event_type === "pwa_install").length;

  return {
    uniqueUsers: uniqueVisitors.size,
    sessions: scopedBySchool
      ? uniqueSessionIds.size
      : Math.max(sessions.length, uniqueSessionIds.size),
    pageViews: pageViews.length,
    uniquePages: uniquePaths.size,
    searches: searches.length,
    events: events.length,
    pwaInstalls: pwaInstallsCount,
  };
}

export async function fetchAnalyticsOverviewAndSeries(
  period: AnalyticsPeriodKey,
  schoolFilter?: string | null,
  presenceTimeoutSeconds = 60,
): Promise<{
  overview: AnalyticsOverviewData;
  dailySeries: DailySeriesPoint[];
  dateRange: AnalyticsDateRange;
}> {
  const dateRange = computeAnalyticsDateRange(period);
  const startIso = dateRange.startDate ? dateRange.startDate.toISOString() : null;
  const endIso = dateRange.endDate.toISOString();

  const [sessions, pageViews, events, searches, pwaEvents, presenceSnapshot] = await Promise.all([
    fetchSessionsInRange(startIso, endIso),
    fetchPageViewsInRange(startIso, endIso, schoolFilter),
    fetchEventsInRange(startIso, endIso, schoolFilter),
    fetchSearchesInRange(startIso, endIso),
    fetchPwaEventsInRange(startIso, endIso),
    fetchRealtimePresenceSnapshot(presenceTimeoutSeconds),
  ]);

  const currentStats = summarizeWindowMetrics({
    sessions,
    pageViews,
    events,
    searches,
    pwaEvents,
    schoolFilter,
  });

  let prevStats: ReturnType<typeof summarizeWindowMetrics> | null = null;

  if (period !== "all" && dateRange.previousStartDate && dateRange.previousEndDate) {
    const prevStartIso = dateRange.previousStartDate.toISOString();
    const prevEndIso = dateRange.previousEndDate.toISOString();

    const [prevSessions, prevPageViews, prevEvents, prevSearches, prevPwaEvents] =
      await Promise.all([
        fetchSessionsInRange(prevStartIso, prevEndIso),
        fetchPageViewsInRange(prevStartIso, prevEndIso, schoolFilter),
        fetchEventsInRange(prevStartIso, prevEndIso, schoolFilter),
        fetchSearchesInRange(prevStartIso, prevEndIso),
        fetchPwaEventsInRange(prevStartIso, prevEndIso),
      ]);

    prevStats = summarizeWindowMetrics({
      sessions: prevSessions,
      pageViews: prevPageViews,
      events: prevEvents,
      searches: prevSearches,
      pwaEvents: prevPwaEvents,
      schoolFilter,
    });
  }

  const hasAnyData =
    currentStats.uniqueUsers > 0 ||
    currentStats.sessions > 0 ||
    currentStats.pageViews > 0 ||
    currentStats.searches > 0 ||
    currentStats.events > 0 ||
    currentStats.pwaInstalls > 0;

  const overview: AnalyticsOverviewData = {
    uniqueUsers: buildComparisonMetric(
      currentStats.uniqueUsers,
      prevStats ? prevStats.uniqueUsers : null,
      period,
    ),
    sessions: buildComparisonMetric(
      currentStats.sessions,
      prevStats ? prevStats.sessions : null,
      period,
    ),
    pageViews: buildComparisonMetric(
      currentStats.pageViews,
      prevStats ? prevStats.pageViews : null,
      period,
    ),
    uniquePages: buildComparisonMetric(
      currentStats.uniquePages,
      prevStats ? prevStats.uniquePages : null,
      period,
    ),
    searches: buildComparisonMetric(
      currentStats.searches,
      prevStats ? prevStats.searches : null,
      period,
    ),
    events: buildComparisonMetric(currentStats.events, prevStats ? prevStats.events : null, period),
    pwaInstalls: buildComparisonMetric(
      currentStats.pwaInstalls,
      prevStats ? prevStats.pwaInstalls : null,
      period,
    ),
    activeUsersNow: presenceSnapshot.activeCount,
    hasAnyData,
  };

  const dailySeries = buildDailySeriesFromRaw({
    sessions,
    pageViews,
    searches,
    events,
    schoolFilter,
  });

  return {
    overview,
    dailySeries,
    dateRange,
  };
}

function toDayKey(isoTimestamp: string): string | null {
  if (!isoTimestamp) return null;
  const d = new Date(isoTimestamp);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(dayKey: string): string {
  const parts = dayKey.split("-");
  if (parts.length !== 3) return dayKey;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const dateObj = new Date(Date.UTC(year, month, day));
  return dateObj.toLocaleDateString("es-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function buildDailySeriesFromRaw(params: {
  sessions: RawSessionRecord[];
  pageViews: RawPageViewRecord[];
  searches: RawSearchRecord[];
  events: RawEventRecord[];
  schoolFilter?: string | null;
}): DailySeriesPoint[] {
  const { sessions, pageViews, searches, events, schoolFilter } = params;
  const scopedBySchool = Boolean(schoolFilter && schoolFilter !== "all");

  const dayMap = new Map<
    string,
    {
      pageViews: number;
      users: Set<string>;
      sessions: Set<string>;
      searches: number;
    }
  >();

  const ensureBucket = (dayKey: string) => {
    let bucket = dayMap.get(dayKey);
    if (!bucket) {
      bucket = {
        pageViews: 0,
        users: new Set<string>(),
        sessions: new Set<string>(),
        searches: 0,
      };
      dayMap.set(dayKey, bucket);
    }
    return bucket;
  };

  for (const pv of pageViews) {
    const dayKey = toDayKey(pv.entered_at);
    if (!dayKey) continue;
    const b = ensureBucket(dayKey);
    b.pageViews += 1;
    if (pv.anonymous_id) b.users.add(pv.anonymous_id);
    if (pv.session_id) b.sessions.add(pv.session_id);
  }

  for (const ev of events) {
    const dayKey = toDayKey(ev.created_at);
    if (!dayKey) continue;
    const b = ensureBucket(dayKey);
    if (ev.anonymous_id) b.users.add(ev.anonymous_id);
    if (ev.session_id) b.sessions.add(ev.session_id);
  }

  if (!scopedBySchool) {
    for (const s of sessions) {
      const dayKey = toDayKey(s.started_at);
      if (!dayKey) continue;
      const b = ensureBucket(dayKey);
      if (s.anonymous_id) b.users.add(s.anonymous_id);
      if (s.id) b.sessions.add(s.id);
    }

    for (const sr of searches) {
      const dayKey = toDayKey(sr.created_at);
      if (!dayKey) continue;
      const b = ensureBucket(dayKey);
      b.searches += 1;
      if (sr.anonymous_id) b.users.add(sr.anonymous_id);
      if (sr.session_id) b.sessions.add(sr.session_id);
    }
  }

  const sortedDays = Array.from(dayMap.keys()).sort((a, b) => a.localeCompare(b));

  return sortedDays.map((dayKey) => {
    const bucket = dayMap.get(dayKey)!;
    return {
      date: dayKey,
      label: formatDayLabel(dayKey),
      pageViews: bucket.pageViews,
      uniqueUsers: bucket.users.size,
      sessions: bucket.sessions.size,
      searches: bucket.searches,
    };
  });
}

function formatLanguageLabel(code: string | null | undefined): string {
  const clean = (code || "").trim().toLowerCase();
  if (!clean) return "No especificado";
  if (clean === "es" || clean.startsWith("es-")) return "Español (es)";
  if (clean === "en" || clean.startsWith("en-")) return "Inglés (en)";
  if (clean === "kar" || clean === "ksw") return "Karen (kar)";
  return clean;
}

function formatDeviceLabel(device: string | null | undefined): string {
  const clean = (device || "").trim().toLowerCase();
  if (clean === "mobile") return "Móvil";
  if (clean === "tablet") return "Tablet";
  if (clean === "desktop") return "Escritorio";
  return "Desconocido";
}

function buildAudienceBreakdown(
  sessions: RawSessionRecord[],
  extractor: (s: RawSessionRecord) => string,
): AudienceRow[] {
  const map = new Map<string, { users: Set<string>; sessions: number }>();

  for (const s of sessions) {
    const key = extractor(s);
    let entry = map.get(key);
    if (!entry) {
      entry = { users: new Set<string>(), sessions: 0 };
      map.set(key, entry);
    }
    if (s.anonymous_id) entry.users.add(s.anonymous_id);
    entry.sessions += 1;
  }

  const totalSessions = sessions.length;
  return Array.from(map.entries())
    .map(([dimension, val]) => ({
      dimension,
      users: val.users.size,
      sessions: val.sessions,
      percentage: totalSessions > 0 ? Math.round((val.sessions / totalSessions) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions || b.users - a.users);
}

export async function fetchAudienceAnalytics(
  period: AnalyticsPeriodKey,
): Promise<AudienceAnalyticsData> {
  const range = computeAnalyticsDateRange(period);
  const startIso = range.startDate ? range.startDate.toISOString() : null;
  const endIso = range.endDate.toISOString();

  const sessions = await fetchSessionsInRange(startIso, endIso);
  if (sessions.length === 0) {
    return {
      languages: [],
      devices: [],
      browsers: [],
      operatingSystems: [],
      hasAnyData: false,
    };
  }

  return {
    languages: buildAudienceBreakdown(sessions, (s) => formatLanguageLabel(s.language)),
    devices: buildAudienceBreakdown(sessions, (s) => formatDeviceLabel(s.device_type)),
    browsers: buildAudienceBreakdown(sessions, (s) => (s.browser || "").trim() || "Desconocido"),
    operatingSystems: buildAudienceBreakdown(
      sessions,
      (s) => (s.operating_system || "").trim() || "Desconocido",
    ),
    hasAnyData: true,
  };
}

interface ContentLookupCatalog {
  articlesByIdOrSlug: Map<string, string>;
  categoriesByIdOrSlug: Map<string, string>;
  resourcesById: Map<string, string>;
  programsById: Map<string, string>;
  studentProgramsById: Map<string, string>;
  activitiesByIdOrSlug: Map<string, string>;
  faqsById: Map<string, string>;
  announcementsById: Map<string, string>;
  schoolsByIdOrSlug: Map<string, string>;
  contactsById: Map<string, string>;
}

const KNOWN_PUBLIC_ROUTE_NAMES: Record<string, string> = {
  "/": "Portada principal (Inicio)",
  home: "Portada principal (Inicio)",
  "/topics": "Directorio de Temas",
  topics: "Directorio de Temas",
  "/search": "Buscador general",
  search: "Buscador general",
  "/faq": "Preguntas Frecuentes (FAQ)",
  faq: "Preguntas Frecuentes (FAQ)",
  "/announcements": "Avisos y Comunicados",
  announcements: "Avisos y Comunicados",
  "/contact": "Directorio y Contacto BFL",
  contact: "Directorio y Contacto BFL",
  "/apps": "Aplicaciones y Portales",
  apps: "Aplicaciones y Portales",
  "/programas": "Programas Académicos",
  programas: "Programas Académicos",
  "/programas-estudiantes": "Programas para Estudiantes",
  "programas-estudiantes": "Programas para Estudiantes",
  "/deportes-actividades": "Deportes y Actividades",
  "deportes-actividades": "Deportes y Actividades",
  "/equipos": "Equipos Deportivos",
  equipos: "Equipos Deportivos",
  "/escuelas": "Escuelas del Distrito",
  escuelas: "Escuelas del Distrito",
  "/calendario": "Calendario Escolar",
  calendario: "Calendario Escolar",
  "/eventos": "Eventos Escolares",
  "/horario-campanas": "Horario de Campanas",
  "horario-campanas": "Horario de Campanas",
  "/transporte/dart": "Transporte Escolar y DART",
  transporte: "Transporte Escolar y DART",
  dart: "Transporte Escolar y DART",
  "/voluntarios": "Voluntarios",
  voluntarios: "Voluntarios",
  "/empleos": "Bolsa de Trabajo",
  empleos: "Bolsa de Trabajo",
  "/bfl-status": "Estado BFL",
  "bfl-status": "Estado BFL",
  "/quienes-somos": "Quiénes Somos",
  "/redes-sociales": "Redes Sociales Oficiales",
  "/accessibility": "Accesibilidad",
};

async function loadContentLookupCatalog(): Promise<ContentLookupCatalog> {
  const [
    articlesRes,
    categoriesRes,
    resourcesRes,
    resourceTranslationsRes,
    programsRes,
    studentProgramsRes,
    activitiesRes,
    faqsRes,
    faqTranslationsRes,
    announcementsRes,
    announcementTranslationsRes,
    schoolsRes,
    contactsRes,
  ] = await Promise.all([
    supabase.from("articles").select("id, slug, title"),
    supabase.from("categories").select("id, slug, name"),
    supabase.from("resources").select("id, url"),
    supabase.from("resource_translations").select("resource_id, language_code, title"),
    supabase.from("programs").select("id, name"),
    supabase.from("student_programs").select("id, name_es, name_en"),
    supabase.from("activities").select("id, name"),
    supabase.from("faqs").select("id"),
    supabase.from("faq_translations").select("faq_id, language_code, question"),
    supabase.from("announcements").select("id"),
    supabase.from("announcement_translations").select("announcement_id, language_code, title"),
    supabase.from("schools").select("id, slug, name, short_name"),
    supabase.from("contacts").select("id, person_name, role_title, job_title, department"),
  ]);

  const articlesByIdOrSlug = new Map<string, string>();
  for (const row of articlesRes.data ?? []) {
    if (row.id && row.title) articlesByIdOrSlug.set(String(row.id), row.title);
    if (row.slug && row.title) articlesByIdOrSlug.set(String(row.slug), row.title);
  }

  const categoriesByIdOrSlug = new Map<string, string>();
  for (const row of categoriesRes.data ?? []) {
    if (row.id && row.name) categoriesByIdOrSlug.set(String(row.id), row.name);
    if (row.slug && row.name) categoriesByIdOrSlug.set(String(row.slug), row.name);
  }

  const resourcesById = new Map<string, string>();
  const resourceTrList = (resourceTranslationsRes.data ?? []) as Array<{
    resource_id: string;
    language_code: string;
    title: string;
  }>;
  for (const row of (resourcesRes.data ?? []) as Array<{ id: string; url?: string | null }>) {
    const trEs = resourceTrList.find(
      (t) => String(t.resource_id) === String(row.id) && t.language_code === "es",
    );
    const trEn = resourceTrList.find(
      (t) => String(t.resource_id) === String(row.id) && t.language_code === "en",
    );
    const trAny = resourceTrList.find((t) => String(t.resource_id) === String(row.id));
    const title = trEs?.title || trEn?.title || trAny?.title || row.url || null;
    if (row.id && title) {
      resourcesById.set(String(row.id), title);
    }
  }

  const programsById = new Map<string, string>();
  for (const row of programsRes.data ?? []) {
    if (row.id && row.name) programsById.set(String(row.id), row.name);
  }

  const studentProgramsById = new Map<string, string>();
  for (const row of studentProgramsRes.data ?? []) {
    const title = row.name_es || row.name_en;
    if (row.id && title) studentProgramsById.set(String(row.id), title);
  }

  const activitiesByIdOrSlug = new Map<string, string>();
  for (const row of activitiesRes.data ?? []) {
    if (row.id && row.name) activitiesByIdOrSlug.set(String(row.id), row.name);
  }

  const faqsById = new Map<string, string>();
  const faqTrList = faqTranslationsRes.data ?? [];
  for (const faq of faqsRes.data ?? []) {
    const trEs = faqTrList.find(
      (t) => String(t.faq_id) === String(faq.id) && t.language_code === "es",
    );
    const trAny = faqTrList.find((t) => String(t.faq_id) === String(faq.id));
    const question = trEs?.question || trAny?.question;
    if (faq.id && question) {
      faqsById.set(String(faq.id), question);
    }
  }

  const announcementsById = new Map<string, string>();
  const annTrList = announcementTranslationsRes.data ?? [];
  for (const ann of announcementsRes.data ?? []) {
    const trEs = annTrList.find(
      (t) => String(t.announcement_id) === String(ann.id) && t.language_code === "es",
    );
    const trAny = annTrList.find((t) => String(t.announcement_id) === String(ann.id));
    const title = trEs?.title || trAny?.title;
    if (ann.id && title) {
      announcementsById.set(String(ann.id), title);
    }
  }

  const schoolsByIdOrSlug = new Map<string, string>();
  for (const row of schoolsRes.data ?? []) {
    const label = row.name || row.short_name;
    if (row.id && label) schoolsByIdOrSlug.set(String(row.id), label);
    if (row.slug && label) schoolsByIdOrSlug.set(String(row.slug), label);
  }

  const contactsById = new Map<string, string>();
  for (const row of (contactsRes.data ?? []) as Array<{
    id: string;
    person_name?: string | null;
    role_title?: string | null;
    job_title?: string | null;
    department?: string | null;
  }>) {
    const personOrDept = (row.person_name || row.department || "").trim();
    const roleLabel = (row.role_title || row.job_title || row.department || "").trim();
    const label =
      personOrDept && roleLabel && personOrDept !== roleLabel
        ? `${personOrDept} (${roleLabel})`
        : personOrDept || roleLabel;
    if (row.id && label) contactsById.set(String(row.id), label);
  }

  return {
    articlesByIdOrSlug,
    categoriesByIdOrSlug,
    resourcesById,
    programsById,
    studentProgramsById,
    activitiesByIdOrSlug,
    faqsById,
    announcementsById,
    schoolsByIdOrSlug,
    contactsById,
  };
}

function classifyAndResolveContent(
  rawType: string | null,
  rawId: string | null,
  rawPath: string | null,
  catalog: ContentLookupCatalog,
): {
  categoryGroup: Exclude<DashboardContentCategory, "all">;
  typeLabel: string;
  title: string;
  isAvailable: boolean;
} {
  const type = (rawType || "page").toLowerCase().trim();
  const id = (rawId || rawPath || "/").trim();

  if (type === "article") {
    const cleanSlug = id.startsWith("/articles/") ? id.replace("/articles/", "") : id;
    const found = catalog.articlesByIdOrSlug.get(cleanSlug) || catalog.articlesByIdOrSlug.get(id);
    return {
      categoryGroup: "articles",
      typeLabel: "Artículo",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "category") {
    const cleanSlug = id.startsWith("/topics/") ? id.replace("/topics/", "") : id;
    const found =
      catalog.categoriesByIdOrSlug.get(cleanSlug) || catalog.categoriesByIdOrSlug.get(id);
    return {
      categoryGroup: "categories",
      typeLabel: "Categoría",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "resource") {
    const found = catalog.resourcesById.get(id);
    return {
      categoryGroup: "resources",
      typeLabel: "Recurso",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "programs" || type === "student_programs") {
    if (id === "programas" || id === "/programas") {
      return {
        categoryGroup: "programs",
        typeLabel: "Página de Programas",
        title: "Programas Académicos",
        isAvailable: true,
      };
    }
    if (id === "programas-estudiantes" || id === "/programas-estudiantes") {
      return {
        categoryGroup: "programs",
        typeLabel: "Página de Programas",
        title: "Programas para Estudiantes",
        isAvailable: true,
      };
    }
    const found = catalog.programsById.get(id) || catalog.studentProgramsById.get(id);
    return {
      categoryGroup: "programs",
      typeLabel: type === "student_programs" ? "Programa Estudiantil" : "Programa Académico",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "activities") {
    if (
      id === "deportes-actividades" ||
      id === "/deportes-actividades" ||
      id === "equipos" ||
      id === "/equipos"
    ) {
      return {
        categoryGroup: "activities",
        typeLabel: "Página de Actividades",
        title: KNOWN_PUBLIC_ROUTE_NAMES[id] || "Deportes y Actividades",
        isAvailable: true,
      };
    }
    const found = catalog.activitiesByIdOrSlug.get(id);
    return {
      categoryGroup: "activities",
      typeLabel: "Deporte / Actividad",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "faq") {
    if (id === "faq" || id === "/faq") {
      return {
        categoryGroup: "pages",
        typeLabel: "Página Pública",
        title: "Preguntas Frecuentes (FAQ)",
        isAvailable: true,
      };
    }
    const found = catalog.faqsById.get(id);
    return {
      categoryGroup: "faqs",
      typeLabel: "Pregunta Frecuente",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "announcements") {
    if (id === "announcements" || id === "/announcements") {
      return {
        categoryGroup: "pages",
        typeLabel: "Página Pública",
        title: "Avisos y Comunicados",
        isAvailable: true,
      };
    }
    const found = catalog.announcementsById.get(id);
    return {
      categoryGroup: "announcements",
      typeLabel: "Aviso Oficial",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "schools") {
    if (id === "escuelas" || id === "/escuelas") {
      return {
        categoryGroup: "pages",
        typeLabel: "Página Pública",
        title: "Escuelas del Distrito",
        isAvailable: true,
      };
    }
    if (id === "all") {
      return {
        categoryGroup: "schools",
        typeLabel: "Escuela",
        title: "Todas las escuelas (Distrito)",
        isAvailable: true,
      };
    }
    const found = catalog.schoolsByIdOrSlug.get(id);
    return {
      categoryGroup: "schools",
      typeLabel: "Escuela",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "contact") {
    if (id === "contact" || id === "/contact") {
      return {
        categoryGroup: "pages",
        typeLabel: "Página Pública",
        title: "Directorio y Contacto BFL",
        isAvailable: true,
      };
    }
    const found = catalog.contactsById.get(id);
    return {
      categoryGroup: "contacts",
      typeLabel: "Contacto BFL",
      title: found ?? "Contenido no disponible",
      isAvailable: Boolean(found),
    };
  }

  if (type === "external_link") {
    return {
      categoryGroup: "external_links",
      typeLabel: "Enlace Externo",
      title: id || "Enlace externo",
      isAvailable: true,
    };
  }

  const routeKey = rawPath || id || "/";
  const knownPageTitle = KNOWN_PUBLIC_ROUTE_NAMES[routeKey] || KNOWN_PUBLIC_ROUTE_NAMES[id];
  return {
    categoryGroup: "pages",
    typeLabel: "Página Pública",
    title: knownPageTitle || routeKey,
    isAvailable: true,
  };
}

export async function fetchContentAnalytics(
  period: AnalyticsPeriodKey,
  schoolFilter?: string | null,
): Promise<ContentAnalyticsData> {
  const range = computeAnalyticsDateRange(period);
  const startIso = range.startDate ? range.startDate.toISOString() : null;
  const endIso = range.endDate.toISOString();

  const [pageViews, events, catalog] = await Promise.all([
    fetchPageViewsInRange(startIso, endIso, schoolFilter),
    fetchEventsInRange(startIso, endIso, schoolFilter),
    loadContentLookupCatalog(),
  ]);

  interface AggBucket {
    contentType: string;
    contentId: string;
    path: string | null;
    views: number;
    users: Set<string>;
    sessions: Set<string>;
    durations: number[];
  }

  const buckets = new Map<string, AggBucket>();

  const getOrCreate = (cType: string, cId: string, path: string | null) => {
    const key = `${cType}::${cId}`;
    let b = buckets.get(key);
    if (!b) {
      b = {
        contentType: cType,
        contentId: cId,
        path,
        views: 0,
        users: new Set<string>(),
        sessions: new Set<string>(),
        durations: [],
      };
      buckets.set(key, b);
    }
    return b;
  };

  for (const pv of pageViews) {
    const cType = pv.content_type || "page";
    const cId = pv.content_id || pv.path || "/";
    const b = getOrCreate(cType, cId, pv.path);
    b.views += 1;
    if (pv.anonymous_id) b.users.add(pv.anonymous_id);
    if (pv.session_id) b.sessions.add(pv.session_id);
    if (typeof pv.duration_seconds === "number" && pv.duration_seconds > 0) {
      b.durations.push(pv.duration_seconds);
    }
  }

  const CONTENT_EVENT_MAP: Record<string, string> = {
    resource_click: "resource",
    program_click: "programs",
    activity_click: "activities",
    faq_open: "faq",
    announcement_click: "announcements",
    contact_click: "contact",
    external_link_click: "external_link",
    category_click: "category",
    school_select: "schools",
  };

  for (const ev of events) {
    const mappedType = CONTENT_EVENT_MAP[ev.event_name];
    if (!mappedType) continue;
    const cId = ev.content_id || ev.path;
    if (!cId) continue;

    const b = getOrCreate(mappedType, cId, ev.path);
    b.views += 1;
    if (ev.anonymous_id) b.users.add(ev.anonymous_id);
    if (ev.session_id) b.sessions.add(ev.session_id);
  }

  const rows: ContentPerformanceRow[] = Array.from(buckets.entries()).map(([key, b]) => {
    const resolved = classifyAndResolveContent(b.contentType, b.contentId, b.path, catalog);
    const avgDurationSeconds =
      b.durations.length > 0
        ? Math.round(b.durations.reduce((acc, v) => acc + v, 0) / b.durations.length)
        : null;

    return {
      key,
      contentId: b.contentId,
      title: resolved.title,
      contentType: resolved.typeLabel,
      categoryGroup: resolved.categoryGroup,
      views: b.views,
      users: b.users.size,
      sessions: b.sessions.size,
      avgDurationSeconds,
      isAvailable: resolved.isAvailable,
    };
  });

  rows.sort((a, b) => b.views - a.views || b.users - a.users);

  return {
    rows,
    hasAnyData: rows.length > 0,
  };
}

export async function fetchSearchesAnalytics(
  period: AnalyticsPeriodKey,
): Promise<SearchesAnalyticsData> {
  const range = computeAnalyticsDateRange(period);
  const startIso = range.startDate ? range.startDate.toISOString() : null;
  const endIso = range.endDate.toISOString();

  const searches = await fetchSearchesInRange(startIso, endIso);
  if (searches.length === 0) {
    return {
      totalSearches: 0,
      uniqueUsers: 0,
      uniqueTerms: 0,
      withResults: 0,
      withoutResults: 0,
      successRatePercent: null,
      avgResults: null,
      topTerms: [],
      hasAnyData: false,
    };
  }

  const uniqueUsers = new Set<string>();
  const termBuckets = new Map<
    string,
    {
      displayTerm: string;
      count: number;
      users: Set<string>;
      totalResults: number;
      zeroCount: number;
    }
  >();

  let withResults = 0;
  let withoutResults = 0;
  let totalResultCountSum = 0;

  for (const sr of searches) {
    if (sr.anonymous_id) uniqueUsers.add(sr.anonymous_id);
    const rCount = Math.max(0, Number(sr.result_count) || 0);
    totalResultCountSum += rCount;

    if (rCount > 0) {
      withResults += 1;
    } else {
      withoutResults += 1;
    }

    const norm = (sr.normalized_query || sr.query || "").trim().toLowerCase();
    if (!norm) continue;

    let bucket = termBuckets.get(norm);
    if (!bucket) {
      bucket = {
        displayTerm: sr.query.trim() || norm,
        count: 0,
        users: new Set<string>(),
        totalResults: 0,
        zeroCount: 0,
      };
      termBuckets.set(norm, bucket);
    }
    bucket.count += 1;
    if (sr.anonymous_id) bucket.users.add(sr.anonymous_id);
    bucket.totalResults += rCount;
    if (rCount === 0) bucket.zeroCount += 1;
  }

  const totalSearches = searches.length;
  const successRatePercent =
    totalSearches > 0 ? Math.round((withResults / totalSearches) * 1000) / 10 : null;
  const avgResults =
    totalSearches > 0 ? Math.round((totalResultCountSum / totalSearches) * 10) / 10 : null;

  const topTerms: SearchTermRow[] = Array.from(termBuckets.values())
    .map((b) => ({
      term: b.displayTerm,
      searches: b.count,
      users: b.users.size,
      avgResults: b.count > 0 ? Math.round((b.totalResults / b.count) * 10) / 10 : 0,
      zeroResultsCount: b.zeroCount,
    }))
    .sort((a, b) => b.searches - a.searches || b.users - a.users);

  return {
    totalSearches,
    uniqueUsers: uniqueUsers.size,
    uniqueTerms: termBuckets.size,
    withResults,
    withoutResults,
    successRatePercent,
    avgResults,
    topTerms,
    hasAnyData: true,
  };
}

export async function fetchSchoolsAnalytics(
  period: AnalyticsPeriodKey,
): Promise<SchoolsAnalyticsData> {
  const range = computeAnalyticsDateRange(period);
  const startIso = range.startDate ? range.startDate.toISOString() : null;
  const endIso = range.endDate.toISOString();

  const [schoolsRes, pageViews, events] = await Promise.all([
    supabase
      .from("schools")
      .select("id, slug, name, short_name")
      .order("name", { ascending: true }),
    fetchPageViewsInRange(startIso, endIso),
    fetchEventsInRange(startIso, endIso),
  ]);

  throwIfSupabaseError(schoolsRes.error, "escuelas registradas");

  const dbSchools = schoolsRes.data ?? [];
  const schoolLookup = new Map<string, { id: string; name: string; shortName: string | null }>();

  for (const s of dbSchools) {
    const info = {
      id: String(s.id),
      name: s.name || String(s.id),
      shortName: s.short_name || null,
    };
    schoolLookup.set(String(s.id).toLowerCase(), info);
    if (s.slug) {
      schoolLookup.set(String(s.slug).toLowerCase(), info);
    }
  }

  const activityBySchoolId = new Map<
    string,
    {
      schoolId: string;
      schoolName: string;
      shortName: string | null;
      pageViews: number;
      users: Set<string>;
      sessions: Set<string>;
      selections: number;
    }
  >();

  const ensureSchoolBucket = (rawSchoolKey: string | null) => {
    if (!rawSchoolKey) return null;
    const clean = rawSchoolKey.trim().toLowerCase();
    if (!clean || clean === "all") return null;

    const matched = schoolLookup.get(clean);
    if (!matched) return null;

    let bucket = activityBySchoolId.get(matched.id);
    if (!bucket) {
      bucket = {
        schoolId: matched.id,
        schoolName: matched.name,
        shortName: matched.shortName,
        pageViews: 0,
        users: new Set<string>(),
        sessions: new Set<string>(),
        selections: 0,
      };
      activityBySchoolId.set(matched.id, bucket);
    }
    return bucket;
  };

  for (const pv of pageViews) {
    const bucket = ensureSchoolBucket(pv.school_id);
    if (!bucket) continue;
    bucket.pageViews += 1;
    if (pv.anonymous_id) bucket.users.add(pv.anonymous_id);
    if (pv.session_id) bucket.sessions.add(pv.session_id);
  }

  for (const ev of events) {
    const targetSchoolKey =
      ev.school_id || (ev.event_name === "school_select" ? ev.content_id : null);
    const bucket = ensureSchoolBucket(targetSchoolKey);
    if (!bucket) continue;
    if (ev.anonymous_id) bucket.users.add(ev.anonymous_id);
    if (ev.session_id) bucket.sessions.add(ev.session_id);
    if (ev.event_name === "school_select") {
      bucket.selections += 1;
    }
  }

  const rows: SchoolAnalyticsRow[] = Array.from(activityBySchoolId.values())
    .filter((b) => b.pageViews > 0 || b.selections > 0 || b.sessions.size > 0)
    .map((b) => ({
      schoolId: b.schoolId,
      schoolName: b.schoolName,
      shortName: b.shortName,
      pageViews: b.pageViews,
      users: b.users.size,
      sessions: b.sessions.size,
      selections: b.selections,
    }))
    .sort((a, b) => b.pageViews - a.pageViews || b.users - a.users || b.selections - a.selections);

  return {
    rows,
    hasAnyData: rows.length > 0,
  };
}

export async function fetchPwaAnalytics(period: AnalyticsPeriodKey): Promise<PwaAnalyticsData> {
  const range = computeAnalyticsDateRange(period);
  const startIso = range.startDate ? range.startDate.toISOString() : null;
  const endIso = range.endDate.toISOString();

  const pwaEvents = await fetchPwaEventsInRange(startIso, endIso);
  if (pwaEvents.length === 0) {
    return {
      launches: 0,
      promptsShown: 0,
      installs: 0,
      installRatePercent: null,
      byPlatform: [],
      hasAnyData: false,
    };
  }

  let launches = 0;
  let promptsShown = 0;
  let installs = 0;
  const platformCounts = new Map<string, number>();

  for (const ev of pwaEvents) {
    if (ev.event_type === "pwa_launch") launches += 1;
    else if (ev.event_type === "pwa_prompt_shown") promptsShown += 1;
    else if (ev.event_type === "pwa_install") installs += 1;

    const plat = (ev.operating_system || ev.platform || "Desconocido").trim();
    platformCounts.set(plat, (platformCounts.get(plat) || 0) + 1);
  }

  const installRatePercent =
    promptsShown > 0 ? Math.round((installs / promptsShown) * 1000) / 10 : null;

  const byPlatform = Array.from(platformCounts.entries())
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);

  return {
    launches,
    promptsShown,
    installs,
    installRatePercent,
    byPlatform,
    hasAnyData: launches > 0 || promptsShown > 0 || installs > 0,
  };
}

export async function fetchNavigationAnalytics(
  period: AnalyticsPeriodKey,
  schoolFilter?: string | null,
): Promise<NavigationAnalyticsData> {
  const range = computeAnalyticsDateRange(period);
  const startIso = range.startDate ? range.startDate.toISOString() : null;
  const endIso = range.endDate.toISOString();

  const [sessions, pageViews] = await Promise.all([
    fetchSessionsInRange(startIso, endIso),
    fetchPageViewsInRange(startIso, endIso, schoolFilter),
  ]);

  const landingMap = new Map<
    string,
    { count: number; users: Set<string>; sessions: Set<string> }
  >();
  const exitMap = new Map<string, { count: number; users: Set<string>; sessions: Set<string> }>();
  const visitedMap = new Map<
    string,
    { count: number; users: Set<string>; sessions: Set<string> }
  >();

  const addEntry = (
    map: Map<string, { count: number; users: Set<string>; sessions: Set<string> }>,
    path: string | null | undefined,
    anonId: string | null | undefined,
    sessId: string | null | undefined,
  ) => {
    const clean = (path || "").trim();
    if (!clean) return;
    let b = map.get(clean);
    if (!b) {
      b = { count: 0, users: new Set<string>(), sessions: new Set<string>() };
      map.set(clean, b);
    }
    b.count += 1;
    if (anonId) b.users.add(anonId);
    if (sessId) b.sessions.add(sessId);
  };

  for (const s of sessions) {
    addEntry(landingMap, s.landing_path, s.anonymous_id, s.id);
    if (s.exit_path) {
      addEntry(exitMap, s.exit_path, s.anonymous_id, s.id);
    }
  }

  for (const pv of pageViews) {
    addEntry(visitedMap, pv.path, pv.anonymous_id, pv.session_id);
  }

  const toSortedRows = (
    map: Map<string, { count: number; users: Set<string>; sessions: Set<string> }>,
  ): NavigationPathRow[] =>
    Array.from(map.entries())
      .map(([path, b]) => ({
        path,
        count: b.count,
        users: b.users.size,
        sessions: b.sessions.size,
      }))
      .sort((a, b) => b.count - a.count || b.users - a.users)
      .slice(0, 15);

  const landingPages = toSortedRows(landingMap);
  const exitPages = toSortedRows(exitMap);
  const topVisitedPages = toSortedRows(visitedMap);

  return {
    landingPages,
    exitPages,
    topVisitedPages,
    hasAnyData: landingPages.length > 0 || exitPages.length > 0 || topVisitedPages.length > 0,
  };
}
