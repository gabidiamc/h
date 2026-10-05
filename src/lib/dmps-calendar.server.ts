/**
 * Importer for the official DMPS calendars (district + per school websites).
 *
 * Source pages (public, official):
 *  - District: https://www.dmschools.org/events/
 *  - Lincoln:  https://lincoln.dmschools.org/events/
 *  - East:     https://east.dmschools.org/events/
 *
 * Each page renders a server-side event listing that accepts a date range,
 * so we can pull several months at once and upsert them into `events`.
 */

export type CalendarScope = "district" | "lincoln" | "east";

const HOSTS: Record<CalendarScope, string> = {
  district: "www.dmschools.org",
  lincoln: "lincoln.dmschools.org",
  east: "east.dmschools.org",
};

export type ParsedEvent = {
  externalId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  location: string | null;
  category: string | null;
  officialUrl: string;
};

function decode(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&ndash;|&mdash;/g, "–")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#8217;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtRange(d: Date) {
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}

/** Pulls `dates=20260811T173000/20260811T190000` out of the Google Calendar link. */
function parseGoogleDates(block: string) {
  const m = block.match(/dates=(\d{8})(?:T(\d{6}))?\/(\d{8})(?:T(\d{6}))?/);
  if (!m) return null;
  const toDate = (s: string) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  const toTime = (s?: string) => (s ? `${s.slice(0, 2)}:${s.slice(2, 4)}` : null);
  const startDate = toDate(m[1]!);
  const endDate = toDate(m[3]!);
  const startTime = toTime(m[2]);
  const endTime = toTime(m[4]);
  return {
    startDate,
    endDate: endDate !== startDate ? endDate : null,
    startTime,
    endTime: endTime && endTime !== startTime ? endTime : null,
    allDay: !startTime,
  };
}

export function parseEventsHtml(html: string, host: string): ParsedEvent[] {
  const blocks = html.split(/<div class="event(?: |")/).slice(1);
  const out: ParsedEvent[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    const titleRaw = block.match(/class="event__title"[^>]*>([\s\S]*?)<\/div>/);
    if (!titleRaw) continue;
    const title = decode(titleRaw[1]!);
    if (!title) continue;

    const dates = parseGoogleDates(block);
    if (!dates) continue;

    const icalId = block.match(/\/events\/ical\?evt_id=(\d+)/)?.[1];
    const externalId =
      icalId ??
      `${dates.startDate}-${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 40)}`;
    if (seen.has(externalId)) continue;
    seen.add(externalId);

    const locationRaw = block.match(/class="event__location"[^>]*>([\s\S]*?)<\/span>/);
    const location = locationRaw ? decode(locationRaw[1]!).replace(/^[–-]\s*/, "") : null;
    const categoryRaw = block.match(/class="event__category[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const category = categoryRaw ? decode(categoryRaw[1]!) : null;
    const moreRaw = block.match(/class="event__more slide-info"[^>]*>([\s\S]*?)<\/div>/);
    const description = moreRaw ? decode(moreRaw[1]!) || null : null;

    out.push({
      externalId,
      title,
      description,
      startDate: dates.startDate,
      endDate: dates.endDate,
      startTime: dates.startTime,
      endTime: dates.endTime,
      allDay: dates.allDay,
      location: location || null,
      category: category && category.toLowerCase() !== "uncategorized" ? category : null,
      officialUrl: icalId ? `https://${host}/events/?evt_id=${icalId}` : `https://${host}/events/`,
    });
  }

  return out;
}

const SPORT_WORDS =
  /\b(football|soccer|basketball|volleyball|wrestling|baseball|softball|tennis|golf|swim|track|cross country|bowling|game|tournament|scrimmage)\b/i;
const NO_SCHOOL_WORDS =
  /(no school|no classes|non-?student|early dismissal|early release|break|holiday|vacation|sin clases|recess|professional development|teacher work day|day off)/i;
const CONFERENCE_WORDS = /(parent[- ]?teacher|conference|conferencias)/i;
const SCHOOL_START_WORDS =
  /(first day|last day|start of (school|classes|semester|term)|registration|orientation|open house|graduation|semester|quarter (begins|ends)|finals|exam|report card|primer d[ií]a|[uú]ltimo d[ií]a)/i;

function eventType(ev: ParsedEvent): string {
  if (NO_SCHOOL_WORDS.test(ev.title)) return "Sin clases / No School";
  if (CONFERENCE_WORDS.test(ev.title)) return "Conferencias / Conferences";
  if (SCHOOL_START_WORDS.test(ev.title)) return "Académico / Academics";
  if (ev.category && /athletic/i.test(ev.category)) return "Deportes / Sports";
  if (ev.category && /academic/i.test(ev.category)) return "Académico / Academics";
  if (SPORT_WORDS.test(ev.title)) return "Deportes / Sports";
  return "Escolar / School";
}

/**
 * Solo importamos lo que le sirve a las familias: dias sin clases, dias
 * festivos, conferencias de padres, inicio/fin de clases y fechas academicas.
 */
const KEEP_TYPES = new Set([
  "Sin clases / No School",
  "Conferencias / Conferences",
  "Académico / Academics",
]);

function isFamilyRelevant(ev: ParsedEvent): boolean {
  if (SPORT_WORDS.test(ev.title)) return false;
  return KEEP_TYPES.has(eventType(ev));
}

export async function fetchCalendarScope(
  scope: CalendarScope,
  monthsAhead = 6,
): Promise<ParsedEvent[]> {
  const host = HOSTS[scope];
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const end = new Date(start);
  end.setMonth(end.getMonth() + monthsAhead);

  const url =
    `https://${host}/events/?evt_view=range` +
    `&evt_start_date=${encodeURIComponent(fmtRange(start))}` +
    `&evt_end_date=${encodeURIComponent(fmtRange(end))}`;

  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; FamiliasDMPS/1.0)" },
  });
  if (!res.ok) throw new Error(`DMPS calendar fetch failed [${res.status}] for ${url}`);
  return parseEventsHtml(await res.text(), host);
}

/** Detects which of our two schools an event belongs to; null = district-wide. */
function detectSchool(ev: ParsedEvent): "lincoln" | "east" | "other" | null {
  const hay = `${ev.title} ${ev.location ?? ""} ${ev.description ?? ""}`.toLowerCase();
  const lincoln = /lincoln|railsplitter/.test(hay);
  const east = /\beast\b|scarlet/.test(hay);
  if (lincoln && !east) return "lincoln";
  if (east && !lincoln) return "east";
  if (east && lincoln) return null; // both schools involved -> show on both
  if (
    /roosevelt|north high|hoover|central academy|central campus|scavo|meredith|callanan|brody|goodrell|harding|weeks|hiatt|mcCombs/i.test(
      hay,
    )
  ) {
    return "other";
  }
  return null;
}

/** Upserts one scope's official events into `events`, replacing stale imports. */
export async function syncCalendarScope(scope: CalendarScope, monthsAhead = 6) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const parsed = await fetchCalendarScope(scope, monthsAhead);
  const now = new Date().toISOString();

  const relevant = (
    scope === "district" ? parsed.filter((ev) => detectSchool(ev) !== "other") : parsed
  ).filter(isFamilyRelevant);

  const rows = relevant.map((ev) => ({
    id: `dmps-${scope}-${ev.externalId}`,
    slug: `dmps-${scope}-${ev.externalId}`,
    title: ev.title,
    description: ev.description,
    start_date: ev.startDate,
    end_date: ev.endDate,
    start_time: ev.startTime,
    end_time: ev.endTime,
    all_day: ev.allDay,
    location: ev.location,
    school_id:
      scope === "district"
        ? (detectSchool(ev) as "lincoln" | "east" | null)
        : (scope as "lincoln" | "east"),
    event_type: eventType(ev),
    official_url: ev.officialUrl,

    status: "published" as const,
    verification_status: "verified",
    verified_at: now,
    source_fetched_at: now,
    published_at: now,
    updated_at: now,
  }));

  let imported = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const { error } = await supabaseAdmin.from("events").upsert(chunk, { onConflict: "id" });
    if (error) throw new Error(`Calendar upsert failed: ${error.message}`);
    imported += chunk.length;
  }

  // Drop previously imported events for this scope that are no longer relevant.
  const keep = new Set(rows.map((r) => r.id));
  const { data: existing } = await supabaseAdmin
    .from("events")
    .select("id")
    .like("id", `dmps-${scope}-%`);
  const stale = (existing ?? []).map((r) => r.id).filter((id) => !keep.has(id));

  if (stale.length > 0) {
    await supabaseAdmin.from("events").delete().in("id", stale);
  }

  return { scope, imported, removed: stale.length, fetchedAt: now };
}

export async function syncCalendarsForSchool(schoolId: "lincoln" | "east", monthsAhead = 6) {
  const results = [];
  for (const scope of ["district", schoolId] as CalendarScope[]) {
    results.push(await syncCalendarScope(scope, monthsAhead));
  }
  return results;
}

/** True when this scope has not been refreshed within `maxAgeHours`. */
export async function scopeIsStale(scope: CalendarScope, maxAgeHours: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("events")
    .select("source_fetched_at")
    .like("id", `dmps-${scope}-%`)
    .order("source_fetched_at", { ascending: false })
    .limit(1);
  const last = data?.[0]?.source_fetched_at;
  if (!last) return true;
  return Date.now() - new Date(last).getTime() > maxAgeHours * 3600_000;
}
