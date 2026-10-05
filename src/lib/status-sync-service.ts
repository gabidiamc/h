/**
 * Service to calculate and update 'status' of records (events, announcements, sports/activities, programs, articles, faqs, contacts)
 * based on starts_at, ends_at, start_date, end_date, expires_at, review_date compared to the current time in America/Chicago.
 *
 * Provides:
 * 1. Pure calculation functions for Events, Announcements, Sports/Activities, Programs, Articles, FAQs, Contacts.
 * 2. Instant activation/deactivation toggle for all resources.
 * 3. Setting permanent validity or specific expiration dates.
 * 4. Client-side and database batch status synchronization with Supabase.
 * 5. Batch deactivation of expired resources.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  computeContentStatus,
  DES_MOINES_TIMEZONE,
  getDesMoinesNow,
  formatDesMoinesDateTime,
  type ContentStatus,
  type LifecycleItem,
} from "./content-lifecycle";
import { notifyContentUpdated } from "./sync";

export type ResourceTable =
  "events" | "announcements" | "activities" | "programs" | "articles" | "faqs" | "contacts";

export interface StatusEvaluationResult {
  id: string;
  table: ResourceTable;
  title: string;
  previousStatus: string;
  newDbStatus: "draft" | "in_review" | "scheduled" | "published" | "archived";
  computedStatus: ContentStatus;
  hasChanged: boolean;
  startsAt: string | null;
  endsAt: string | null;
  reason: string;
}

export interface SyncStatusSummary {
  timestamp: string;
  desMoinesTime: string;
  totalEvaluated: number;
  totalUpdated: number;
  eventsUpdated: number;
  announcementsUpdated: number;
  activitiesUpdated: number;
  programsUpdated: number;
  articlesUpdated: number;
  changes: StatusEvaluationResult[];
}

/**
 * Maps a computed dynamic lifecycle status to the database enum 'content_status'
 * ("draft" | "in_review" | "scheduled" | "published" | "archived")
 */
export function mapLifecycleToDbStatus(
  computed: ContentStatus,
  currentDbStatus?: string | null,
): "draft" | "in_review" | "scheduled" | "published" | "archived" {
  if (currentDbStatus === "draft") return "draft";
  if (currentDbStatus === "in_review") return "in_review";

  switch (computed) {
    case "archived":
      return "archived";
    case "upcoming":
      return currentDbStatus === "scheduled" ? "scheduled" : "published";
    case "happening_now":
    case "active":
      return "published";
    case "completed":
    case "out_of_season":
    case "registration_closed":
      return "published";
    case "cancelled":
    case "postponed":
      return "published";
    default:
      return "published";
  }
}

/**
 * Calculates status for an EVENT in America/Chicago timezone.
 */
export function calculateEventStatus(
  event: {
    id?: string;
    title?: string;
    start_date: string;
    end_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    status?: string | null;
    is_cancelled?: boolean | null;
    is_postponed?: boolean | null;
    archived_at?: string | null;
  },
  now: Date = getDesMoinesNow(),
): {
  computedStatus: ContentStatus;
  targetDbStatus: "draft" | "in_review" | "scheduled" | "published" | "archived";
  startsAtIso: string | null;
  endsAtIso: string | null;
  reason: string;
} {
  const startsAtIso = event.start_date
    ? event.start_time
      ? `${event.start_date}T${event.start_time.length === 5 ? event.start_time + ":00" : event.start_time}`
      : `${event.start_date}T00:00:00`
    : null;

  const endsAtIso = event.end_date
    ? event.end_time
      ? `${event.end_date}T${event.end_time.length === 5 ? event.end_time + ":00" : event.end_time}`
      : `${event.end_date}T23:59:59`
    : event.start_date
      ? event.end_time
        ? `${event.start_date}T${event.end_time.length === 5 ? event.end_time + ":00" : event.end_time}`
        : `${event.start_date}T23:59:59`
      : null;

  const lifecycleItem: LifecycleItem = {
    id: event.id,
    starts_at: startsAtIso,
    ends_at: endsAtIso,
    start_date: event.start_date,
    end_date: event.end_date,
    start_time: event.start_time,
    end_time: event.end_time,
    status: event.status,
    is_cancelled: event.is_cancelled,
    is_postponed: event.is_postponed,
    archived_at: event.archived_at,
  };

  const computedStatus = computeContentStatus(lifecycleItem, { now });
  const targetDbStatus = mapLifecycleToDbStatus(computedStatus, event.status);

  let reason = `Estado calculado: ${computedStatus}`;
  if (event.is_cancelled) {
    reason = "Evento cancelado explícitamente";
  } else if (computedStatus === "happening_now") {
    reason = "En curso en este momento (hora de Chicago)";
  } else if (computedStatus === "upcoming") {
    reason = "Fecha y hora de inicio en el futuro (hora de Chicago)";
  } else if (computedStatus === "completed") {
    reason = "Fecha u hora final ya ha transcurrido (hora de Chicago)";
  }

  return {
    computedStatus,
    targetDbStatus,
    startsAtIso,
    endsAtIso,
    reason,
  };
}

/**
 * Calculates status for an ANNOUNCEMENT in America/Chicago timezone.
 */
export function calculateAnnouncementStatus(
  announcement: {
    id?: string;
    starts_at: string;
    expires_at?: string | null;
    ends_at?: string | null;
    status?: string | null;
    archived_at?: string | null;
  },
  now: Date = getDesMoinesNow(),
): {
  computedStatus: ContentStatus;
  targetDbStatus: "draft" | "in_review" | "scheduled" | "published" | "archived";
  startsAtIso: string | null;
  endsAtIso: string | null;
  reason: string;
} {
  const endsAtIso = announcement.expires_at || announcement.ends_at || null;

  const lifecycleItem: LifecycleItem = {
    id: announcement.id,
    starts_at: announcement.starts_at,
    ends_at: endsAtIso,
    status: announcement.status,
    archived_at: announcement.archived_at,
  };

  const computedStatus = computeContentStatus(lifecycleItem, { now });
  const targetDbStatus = mapLifecycleToDbStatus(computedStatus, announcement.status);

  let reason = `Estado calculado: ${computedStatus}`;
  if (computedStatus === "upcoming") {
    reason = "Aviso programado para iniciar en el futuro";
  } else if (computedStatus === "completed" || computedStatus === "archived") {
    reason = "Fecha de caducidad superada en zona horaria America/Chicago";
  } else {
    reason = "Aviso vigente y activo en portada/listados";
  }

  return {
    computedStatus,
    targetDbStatus,
    startsAtIso: announcement.starts_at,
    endsAtIso,
    reason,
  };
}

/**
 * Calculates status for a SPORT / ACTIVITY in America/Chicago timezone.
 */
export function calculateSportStatus(
  activity: {
    id?: string;
    name?: string;
    season?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    registration_deadline?: string | null;
    enrollment_open?: boolean | null;
    status?: string | null;
    archived_at?: string | null;
  },
  now: Date = getDesMoinesNow(),
): {
  computedStatus: ContentStatus;
  targetDbStatus: "draft" | "in_review" | "scheduled" | "published" | "archived";
  startsAtIso: string | null;
  endsAtIso: string | null;
  reason: string;
} {
  const startsAtIso = activity.start_date ? `${activity.start_date}T00:00:00` : null;
  const endsAtIso = activity.end_date ? `${activity.end_date}T23:59:59` : null;
  const regDeadline = activity.registration_deadline
    ? activity.registration_deadline.includes("T")
      ? activity.registration_deadline
      : `${activity.registration_deadline}T23:59:59`
    : null;

  const lifecycleItem: LifecycleItem = {
    id: activity.id,
    starts_at: startsAtIso,
    ends_at: endsAtIso,
    registration_ends_at: regDeadline,
    season: activity.season,
    status: activity.status,
    archived_at: activity.archived_at,
  };

  const computedStatus = computeContentStatus(lifecycleItem, {
    isSport: true,
    isRegistration: Boolean(regDeadline),
    now,
  });
  const targetDbStatus = mapLifecycleToDbStatus(computedStatus, activity.status);

  let reason = `Estado de actividad calculado: ${computedStatus}`;
  if (computedStatus === "registration_closed") {
    reason = "Plazo de registro cerrado (fecha límite vencida en hora de Chicago)";
  } else if (computedStatus === "out_of_season") {
    reason = "Fuera de temporada o fecha de cierre concluida";
  } else if (computedStatus === "active") {
    reason = "En temporada activa / inscripciones disponibles";
  }

  return {
    computedStatus,
    targetDbStatus,
    startsAtIso,
    endsAtIso,
    reason,
  };
}

/**
 * Calculates status for an ARTICLE / GUIDE in America/Chicago timezone.
 */
export function calculateArticleStatus(
  article: {
    id?: string;
    title?: string;
    review_date?: string | null;
    published_at?: string | null;
    status?: string | null;
  },
  now: Date = getDesMoinesNow(),
): {
  computedStatus: ContentStatus;
  targetDbStatus: "draft" | "in_review" | "scheduled" | "published" | "archived";
  startsAtIso: string | null;
  endsAtIso: string | null;
  reason: string;
} {
  const endsAtIso = article.review_date ? `${article.review_date}T23:59:59` : null;
  const startsAtIso = article.published_at || null;

  const lifecycleItem: LifecycleItem = {
    id: article.id,
    starts_at: startsAtIso,
    ends_at: endsAtIso,
    review_date: article.review_date,
    status: article.status,
  };

  const computedStatus = computeContentStatus(lifecycleItem, { now });
  const targetDbStatus = mapLifecycleToDbStatus(computedStatus, article.status);

  let reason = `Artículo calculado como: ${computedStatus}`;
  if (computedStatus === "completed" || computedStatus === "archived") {
    reason = "Fecha límite de revisión o vigencia vencida";
  } else {
    reason = "Artículo publicado y vigente";
  }

  return {
    computedStatus,
    targetDbStatus,
    startsAtIso,
    endsAtIso,
    reason,
  };
}

/**
 * Directly toggles a resource between Active (published/visible) and Inactive (archived/hidden).
 */
export async function toggleResourceActive(
  table: ResourceTable | string,
  id: string,
  targetActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();

    if (table === "events") {
      const { error } = await supabase
        .from("events")
        .update({
          status: targetActive ? "published" : "archived",
          is_cancelled: false,
          updated_at: nowIso,
        })
        .eq("id", id);
      if (error) throw error;
    } else if (table === "announcements") {
      const { error } = await supabase
        .from("announcements")
        .update({
          status: targetActive ? "published" : "archived",
          updated_at: nowIso,
        })
        .eq("id", id);
      if (error) throw error;
    } else if (table === "activities") {
      const { error } = await supabase
        .from("activities")
        .update({
          status: targetActive ? "published" : "archived",
          enrollment_open: targetActive,
          updated_at: nowIso,
        })
        .eq("id", id);
      if (error) throw error;
    } else if (table === "programs") {
      const { error } = await supabase
        .from("programs")
        .update({
          status: targetActive ? "published" : "archived",
          enrollment_open: targetActive,
          updated_at: nowIso,
        })
        .eq("id", id);
      if (error) throw error;
    } else if (table === "articles") {
      const { error } = await supabase
        .from("articles")
        .update({
          status: targetActive ? "published" : "archived",
          updated_at: nowIso,
        })
        .eq("id", id);
      if (error) throw error;
    } else if (table === "faqs") {
      const { error } = await supabase
        .from("faqs")
        .update({
          status: targetActive ? "published" : "archived",
          updated_at: nowIso,
        })
        .eq("id", id);
      if (error) throw error;
    } else if (table === "contacts") {
      const { error } = await supabase
        .from("contacts")
        .update({
          is_visible: targetActive,
          updated_at: nowIso,
        })
        .eq("id", id);
      if (error) throw error;
    }

    if (typeof window !== "undefined") {
      notifyContentUpdated(String(table));
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al actualizar estado del recurso";
    console.error("toggleResourceActive error:", err);
    return { success: false, error: msg };
  }
}

/**
 * Updates a resource's expiration settings: makes it permanent or assigns a specific expiration date.
 */
export async function setResourceExpiration(
  table: ResourceTable | string,
  id: string,
  options: {
    isPermanent?: boolean;
    expiresAtIso?: string | null;
    endDateStr?: string | null;
    endTimeStr?: string | null;
    reviewDateStr?: string | null;
    activateNow?: boolean;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const shouldActivate = options.activateNow ?? true;

    if (table === "announcements") {
      const updateData: Record<string, unknown> = {
        expires_at: options.isPermanent ? null : options.expiresAtIso,
        updated_at: nowIso,
      };
      if (shouldActivate) updateData.status = "published";

      const { error } = await supabase.from("announcements").update(updateData).eq("id", id);
      if (error) throw error;
    } else if (table === "events") {
      const updateData: Record<string, unknown> = {
        ends_at: options.isPermanent
          ? null
          : options.endDateStr
            ? `${options.endDateStr}T23:59:59`
            : null,
        end_time: options.isPermanent ? null : options.endTimeStr || null,
        updated_at: nowIso,
      };
      if (shouldActivate) {
        updateData.status = "published";
        updateData.is_cancelled = false;
      }
      const { error } = await supabase.from("events").update(updateData).eq("id", id);
      if (error) throw error;
    } else if (table === "programs") {
      const updateData: Record<string, unknown> = {
        end_date: options.isPermanent ? null : options.endDateStr,
        updated_at: nowIso,
      };
      if (shouldActivate) {
        updateData.status = "published";
        updateData.enrollment_open = true;
      }
      const { error } = await supabase.from("programs").update(updateData).eq("id", id);
      if (error) throw error;
    } else if (table === "articles") {
      const updateData: Record<string, unknown> = {
        updated_at: nowIso,
      };
      if (shouldActivate) updateData.status = "published";
      const { error } = await supabase.from("articles").update(updateData).eq("id", id);
      if (error) throw error;
    } else if (table === "activities") {
      const updateData: Record<string, unknown> = {
        updated_at: nowIso,
      };
      if (shouldActivate) {
        updateData.status = "published";
        updateData.enrollment_open = true;
      }
      const { error } = await supabase.from("activities").update(updateData).eq("id", id);
      if (error) throw error;
    }

    if (typeof window !== "undefined") {
      notifyContentUpdated(String(table));
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al fijar vigencia del recurso";
    console.error("setResourceExpiration error:", err);
    return { success: false, error: msg };
  }
}

/**
 * Scans, calculates, and synchronizes status of all records across all tables.
 */
export async function syncAndUpdateAllStatuses(options?: {
  updateRemote?: boolean;
  dryRun?: boolean;
}): Promise<SyncStatusSummary> {
  const updateRemote = options?.updateRemote ?? true;
  const dryRun = options?.dryRun ?? false;
  const now = getDesMoinesNow();
  const desMoinesTimeStr = formatDesMoinesDateTime(now);
  const changes: StatusEvaluationResult[] = [];

  let eventsUpdated = 0;
  let announcementsUpdated = 0;
  let activitiesUpdated = 0;
  let programsUpdated = 0;
  let articlesUpdated = 0;

  // 1. Process Events
  try {
    const { data: events, error: evErr } = await supabase
      .from("events")
      .select(
        "id, title, starts_at, ends_at, start_time, end_time, status, is_cancelled, is_featured",
      );

    if (!evErr && events) {
      for (const rawEv of events) {
        const ev = {
          ...rawEv,
          start_date: rawEv.starts_at ? String(rawEv.starts_at).slice(0, 10) : null,
          end_date: rawEv.ends_at ? String(rawEv.ends_at).slice(0, 10) : null,
        };
        const { computedStatus, targetDbStatus, startsAtIso, endsAtIso, reason } =
          calculateEventStatus(ev, now);

        const currentStatus = ev.status || "published";
        const hasChanged = currentStatus !== targetDbStatus;

        if (hasChanged) {
          changes.push({
            id: ev.id,
            table: "events",
            title: ev.title || "Evento sin título",
            previousStatus: currentStatus,
            newDbStatus: targetDbStatus,
            computedStatus,
            hasChanged: true,
            startsAt: startsAtIso,
            endsAt: endsAtIso,
            reason,
          });

          if (updateRemote && !dryRun) {
            await supabase
              .from("events")
              .update({
                status: targetDbStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", ev.id);
            eventsUpdated++;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Status Sync: Error scanning events", err);
  }

  // 2. Process Announcements
  try {
    const [annRes, annTrRes] = await Promise.all([
      supabase.from("announcements").select("id, starts_at, expires_at, status"),
      supabase.from("announcement_translations").select("announcement_id, title, language_code"),
    ]);
    const announcements = annRes.data;
    const annErr = annRes.error;
    const allAnnTrs = Array.isArray(annTrRes.data) ? annTrRes.data : [];

    if (!annErr && announcements) {
      for (const ann of announcements) {
        const { computedStatus, targetDbStatus, startsAtIso, endsAtIso, reason } =
          calculateAnnouncementStatus(ann, now);

        const currentStatus = ann.status || "published";
        const hasChanged = currentStatus !== targetDbStatus;

        const trans = allAnnTrs.filter(
          (t: { announcement_id?: unknown }) => String(t.announcement_id) === String(ann.id),
        ) as Array<{
          title: string;
          language_code: string;
        }>;
        const title =
          trans?.find((t) => t.language_code === "es")?.title || trans?.[0]?.title || "Aviso";

        if (hasChanged) {
          changes.push({
            id: ann.id,
            table: "announcements",
            title,
            previousStatus: currentStatus,
            newDbStatus: targetDbStatus,
            computedStatus,
            hasChanged: true,
            startsAt: startsAtIso,
            endsAt: endsAtIso,
            reason,
          });

          if (updateRemote && !dryRun) {
            await supabase
              .from("announcements")
              .update({
                status: targetDbStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", ann.id);
            announcementsUpdated++;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Status Sync: Error scanning announcements", err);
  }

  // 3. Process Activities
  try {
    const { data: activities, error: actErr } = await supabase
      .from("activities")
      .select("id, name, season, status, enrollment_open");

    if (!actErr && activities) {
      for (const act of activities) {
        const { computedStatus, targetDbStatus, startsAtIso, endsAtIso, reason } =
          calculateSportStatus(act, now);

        const currentStatus = act.status || "published";
        const hasChanged = currentStatus !== targetDbStatus;

        if (hasChanged) {
          changes.push({
            id: act.id,
            table: "activities",
            title: act.name || "Actividad",
            previousStatus: currentStatus,
            newDbStatus: targetDbStatus,
            computedStatus,
            hasChanged: true,
            startsAt: startsAtIso,
            endsAt: endsAtIso,
            reason,
          });

          if (updateRemote && !dryRun) {
            await supabase
              .from("activities")
              .update({
                status: targetDbStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", act.id);
            activitiesUpdated++;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Status Sync: Error scanning activities", err);
  }

  // 4. Process Programs
  try {
    const { data: programs, error: progErr } = await supabase
      .from("programs")
      .select("id, name, start_date, end_date, status, enrollment_open");

    if (!progErr && programs) {
      for (const prog of programs) {
        const startsAt = prog.start_date ? `${prog.start_date}T00:00:00` : null;
        const endsAt = prog.end_date ? `${prog.end_date}T23:59:59` : null;

        const computedStatus = computeContentStatus(
          {
            id: prog.id,
            starts_at: startsAt,
            ends_at: endsAt,
            status: prog.status,
          },
          { now },
        );

        const targetDbStatus = mapLifecycleToDbStatus(computedStatus, prog.status);
        const currentStatus = prog.status || "published";
        const hasChanged = currentStatus !== targetDbStatus;

        if (hasChanged) {
          changes.push({
            id: prog.id,
            table: "programs",
            title: prog.name || "Programa",
            previousStatus: currentStatus,
            newDbStatus: targetDbStatus,
            computedStatus,
            hasChanged: true,
            startsAt,
            endsAt,
            reason: `Programa calculado como ${computedStatus}`,
          });

          if (updateRemote && !dryRun) {
            await supabase
              .from("programs")
              .update({
                status: targetDbStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", prog.id);
            programsUpdated++;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Status Sync: Error scanning programs", err);
  }

  // 5. Process Articles
  try {
    const [artRes, artTrRes] = await Promise.all([
      supabase.from("articles").select("id, title, content, published_at, status"),
      supabase.from("article_translations").select("article_id, title, language_code"),
    ]);
    const articles = artRes.data;
    const artErr = artRes.error;
    const allArtTrs = Array.isArray(artTrRes.data) ? artTrRes.data : [];

    if (!artErr && articles) {
      for (const art of articles) {
        const trans = allArtTrs.filter(
          (t: { article_id?: unknown }) => String(t.article_id) === String(art.id),
        ) as Array<{ title: string; language_code: string }>;
        const title =
          trans?.find((t) => t.language_code === "es")?.title ||
          trans?.[0]?.title ||
          art.title ||
          "Artículo";
        let reviewDate: string | null = null;
        if (typeof art.content === "string" && art.content.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(art.content);
            reviewDate = parsed?._meta?.review_date ?? null;
          } catch {
            reviewDate = null;
          }
        }

        const { computedStatus, targetDbStatus, startsAtIso, endsAtIso, reason } =
          calculateArticleStatus(
            {
              id: art.id,
              title,
              review_date: reviewDate,
              published_at: art.published_at,
              status: art.status,
            },
            now,
          );

        const currentStatus = art.status || "published";
        const hasChanged = currentStatus !== targetDbStatus;

        if (hasChanged) {
          changes.push({
            id: art.id,
            table: "articles",
            title,
            previousStatus: currentStatus,
            newDbStatus: targetDbStatus,
            computedStatus,
            hasChanged: true,
            startsAt: startsAtIso,
            endsAt: endsAtIso,
            reason,
          });

          if (updateRemote && !dryRun) {
            await supabase
              .from("articles")
              .update({
                status: targetDbStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", art.id);
            articlesUpdated++;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Status Sync: Error scanning articles", err);
  }

  const totalUpdated =
    eventsUpdated + announcementsUpdated + activitiesUpdated + programsUpdated + articlesUpdated;

  if (totalUpdated > 0 && typeof window !== "undefined") {
    notifyContentUpdated();
  }

  return {
    timestamp: new Date().toISOString(),
    desMoinesTime: desMoinesTimeStr,
    totalEvaluated: changes.length,
    totalUpdated: dryRun ? 0 : totalUpdated,
    eventsUpdated,
    announcementsUpdated,
    activitiesUpdated,
    programsUpdated,
    articlesUpdated,
    changes,
  };
}

/**
 * Deactivates/Archives all expired resources across all tables immediately.
 */
export async function deactivateAllExpiredResources(): Promise<{
  totalDeactivated: number;
  details: string[];
}> {
  const now = getDesMoinesNow();
  let totalDeactivated = 0;
  const details: string[] = [];

  try {
    // 1. Expired Announcements
    const { data: expiredAnnouncements } = await supabase
      .from("announcements")
      .select("id, expires_at, status")
      .eq("status", "published")
      .not("expires_at", "is", null);

    if (expiredAnnouncements) {
      for (const ann of expiredAnnouncements) {
        if (ann.expires_at && new Date(ann.expires_at).getTime() <= now.getTime()) {
          await supabase
            .from("announcements")
            .update({ status: "archived", updated_at: new Date().toISOString() })
            .eq("id", ann.id);
          totalDeactivated++;
          details.push(`Aviso ID ${ann.id.slice(0, 8)} archivado.`);
        }
      }
    }

    // 2. Expired Events
    const { data: events } = await supabase
      .from("events")
      .select("id, title, ends_at, end_time, starts_at, start_time, status")
      .neq("status", "archived");

    if (events) {
      for (const rawEv of events) {
        const ev = {
          ...rawEv,
          start_date: rawEv.starts_at ? String(rawEv.starts_at).slice(0, 10) : null,
          end_date: rawEv.ends_at ? String(rawEv.ends_at).slice(0, 10) : null,
        };
        const { computedStatus } = calculateEventStatus(ev, now);
        if (computedStatus === "completed") {
          await supabase
            .from("events")
            .update({ status: "archived", updated_at: new Date().toISOString() })
            .eq("id", ev.id);
          totalDeactivated++;
          details.push(`Evento "${ev.title || ev.id.slice(0, 8)}" archivado por fecha vencida.`);
        }
      }
    }

    // 3. Expired Articles
    const { data: articles } = await supabase
      .from("articles")
      .select("id, content, status")
      .eq("status", "published");

    if (articles) {
      for (const art of articles) {
        let reviewDate: string | null = null;
        if (typeof art.content === "string" && art.content.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(art.content);
            reviewDate = parsed?._meta?.review_date ?? null;
          } catch {
            reviewDate = null;
          }
        }
        if (reviewDate) {
          const rDate = new Date(`${reviewDate}T23:59:59`);
          if (rDate.getTime() <= now.getTime()) {
            await supabase
              .from("articles")
              .update({ status: "archived", updated_at: new Date().toISOString() })
              .eq("id", art.id);
            totalDeactivated++;
            details.push(`Artículo ID ${art.id.slice(0, 8)} archivado por revisión vencida.`);
          }
        }
      }
    }

    // 4. Expired Programs
    const { data: programs } = await supabase
      .from("programs")
      .select("id, name, end_date, status")
      .eq("status", "published")
      .not("end_date", "is", null);

    if (programs) {
      for (const prog of programs) {
        if (prog.end_date) {
          const eDate = new Date(`${prog.end_date}T23:59:59`);
          if (eDate.getTime() <= now.getTime()) {
            await supabase
              .from("programs")
              .update({
                status: "archived",
                enrollment_open: false,
                updated_at: new Date().toISOString(),
              })
              .eq("id", prog.id);
            totalDeactivated++;
            details.push(`Programa "${prog.name}" archivado.`);
          }
        }
      }
    }

    if (totalDeactivated > 0 && typeof window !== "undefined") {
      notifyContentUpdated();
    }
  } catch (err) {
    console.error("Error deactivating expired resources:", err);
  }

  return { totalDeactivated, details };
}

/**
 * Returns PostgreSQL SQL code defining server-side stored procedures and triggers
 * to manage validity and automatic deactivation in Supabase with America/Chicago timezone.
 */
export function getDatabaseSqlDefinition(): string {
  return `-- ============================================================================
-- DMPS Info: Función de Base de Datos y Disparadores para Control de Vigencia
-- Zona Horaria Oficial: America/Chicago (Des Moines, IA)
-- Desactiva y archiva automáticamente recursos cuando su fecha de vigencia vence.
-- ============================================================================

-- 1. Función Principal para Desactivar Registros Vencidos y Publicar Programados
CREATE OR REPLACE FUNCTION public.fn_update_content_statuses()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now_chicago timestamp with time zone := timezone('America/Chicago', now());
  v_today_chicago date := (v_now_chicago)::date;
  v_events_updated integer := 0;
  v_announcements_updated integer := 0;
  v_activities_updated integer := 0;
  v_programs_updated integer := 0;
  v_articles_updated integer := 0;
BEGIN
  -- A. ACTUALIZAR EVENTOS (events)
  -- Publicar programados que inician hoy
  UPDATE public.events
  SET status = 'published', updated_at = now()
  WHERE status = 'scheduled'
    AND start_date <= v_today_chicago;

  -- Desactivar y archivar eventos cuya fecha de fin ya transcurrió
  UPDATE public.events
  SET status = 'archived', updated_at = now()
  WHERE status = 'published'
    AND end_date IS NOT NULL
    AND end_date < v_today_chicago;
  GET DIAGNOSTICS v_events_updated = ROW_COUNT;

  -- B. ACTUALIZAR ANUNCIOS Y AVISOS (announcements)
  -- Publicar anuncios programados
  UPDATE public.announcements
  SET status = 'published', updated_at = now()
  WHERE status = 'scheduled'
    AND timezone('America/Chicago', starts_at) <= v_now_chicago;

  -- Desactivar y archivar automáticamente anuncios vencidos (expires_at)
  UPDATE public.announcements
  SET status = 'archived', updated_at = now()
  WHERE status = 'published'
    AND expires_at IS NOT NULL
    AND timezone('America/Chicago', expires_at) < v_now_chicago;
  GET DIAGNOSTICS v_announcements_updated = ROW_COUNT;

  -- C. ACTUALIZAR PROGRAMAS (programs)
  -- Desactivar programas cuya fecha de fin ya expiró
  UPDATE public.programs
  SET status = 'archived', enrollment_open = false, updated_at = now()
  WHERE status = 'published'
    AND end_date IS NOT NULL
    AND (end_date)::date < v_today_chicago;
  GET DIAGNOSTICS v_programs_updated = ROW_COUNT;

  -- D. ACTUALIZAR ARTÍCULOS (articles)
  -- Desactivar artículos con fecha de revisión/vigencia vencida
  UPDATE public.articles
  SET status = 'archived', updated_at = now()
  WHERE status = 'published'
    AND review_date IS NOT NULL
    AND (review_date)::date < v_today_chicago;
  GET DIAGNOSTICS v_articles_updated = ROW_COUNT;

  -- Retornar resumen JSON
  RETURN jsonb_build_object(
    'success', true,
    'executed_at_chicago', v_now_chicago,
    'events_archived_or_published', v_events_updated,
    'announcements_archived', v_announcements_updated,
    'programs_archived', v_programs_updated,
    'articles_archived', v_articles_updated
  );
END;
$$;

-- 2. Disparador (Trigger) para calcular estado antes de guardar Eventos
CREATE OR REPLACE FUNCTION public.trg_fn_calculate_event_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_today_chicago date := (timezone('America/Chicago', now()))::date;
BEGIN
  IF NEW.is_cancelled = true THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('draft', 'archived', 'in_review') THEN
    IF NEW.end_date IS NOT NULL AND NEW.end_date < v_today_chicago THEN
      NEW.status := 'archived';
    ELSIF NEW.start_date > v_today_chicago THEN
      NEW.status := 'scheduled';
    ELSE
      NEW.status := 'published';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_events_lifecycle_status ON public.events;
CREATE TRIGGER trg_events_lifecycle_status
BEFORE INSERT OR UPDATE OF start_date, end_date, is_cancelled, status
ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_calculate_event_status();
`;
}
