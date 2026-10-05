/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/admin";
import { REALTIME_TABLES, cacheKey, notifyContentUpdated } from "@/lib/sync";
import { invalidateCategoriesCache } from "@/lib/content";

export interface PublicContentCounts {
  categories: number;
  articles: number;
  resources: number;
  announcements: number;
  events: number;
  activities: number;
  faqs: number;
  translations: number;
  dependentRelations: number;
  exclusiveFiles: number;
  total: number;
}

export interface PublicContentBackup {
  backupId: string;
  timestamp: string;
  authorizedBy: {
    id: string;
    email: string;
  };
  summary: PublicContentCounts;
  data: {
    categories: unknown[];
    category_translations: unknown[];
    articles: unknown[];
    article_translations: unknown[];
    article_relations: unknown[];
    article_tags: unknown[];
    tags: unknown[];
    announcements: unknown[];
    announcement_translations: unknown[];
    events: unknown[];
    event_translations: unknown[];
    activities: unknown[];
    activity_translations: unknown[];
    faqs: unknown[];
    faq_translations: unknown[];
    programs: unknown[];
    program_translations: unknown[];
    program_schools: unknown[];
    student_programs: unknown[];
    feedback: unknown[];
    page_views: unknown[];
    search_analytics: unknown[];
    broken_link_reports: unknown[];
    update_requests: unknown[];
  };
}

export interface ResetResult {
  success: boolean;
  backupId: string;
  deletedCounts: PublicContentCounts;
  timestamp: string;
  error?: string;
}

/**
 * Counts all live public content in the database.
 */
export async function getPublicContentCounts(): Promise<PublicContentCounts> {
  try {
    const [
      { count: catCount },
      { count: catTrCount },
      { count: artCount },
      { count: artTrCount },
      { count: artRelCount },
      { count: artTagCount },
      { count: tagCount },
      { count: annCount },
      { count: annTrCount },
      { count: evtCount },
      { count: evtTrCount },
      { count: actCount },
      { count: actTrCount },
      { count: faqCount },
      { count: faqTrCount },
      { count: progCount },
      { count: progTrCount },
      { count: progSchCount },
      { count: sprogCount },
      { count: fbCount },
      { count: pvCount },
      { count: saCount },
      { count: blrCount },
      { count: urCount },
    ] = await Promise.all([
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("category_translations").select("*", { count: "exact", head: true }),
      supabase.from("articles").select("*", { count: "exact", head: true }),
      supabase.from("article_translations").select("*", { count: "exact", head: true }),
      supabase.from("article_relations").select("*", { count: "exact", head: true }),
      supabase.from("article_tags").select("*", { count: "exact", head: true }),
      supabase.from("tags").select("*", { count: "exact", head: true }),
      supabase.from("announcements").select("*", { count: "exact", head: true }),
      supabase.from("announcement_translations").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("event_translations").select("*", { count: "exact", head: true }),
      supabase.from("activities").select("*", { count: "exact", head: true }),
      supabase.from("activity_translations").select("*", { count: "exact", head: true }),
      supabase.from("faqs").select("*", { count: "exact", head: true }),
      supabase.from("faq_translations").select("*", { count: "exact", head: true }),
      supabase.from("programs").select("*", { count: "exact", head: true }),
      supabase.from("program_translations").select("*", { count: "exact", head: true }),
      supabase.from("program_schools").select("*", { count: "exact", head: true }),
      supabase.from("student_programs").select("*", { count: "exact", head: true }),
      supabase.from("feedback").select("*", { count: "exact", head: true }),
      supabase.from("page_views").select("*", { count: "exact", head: true }),
      supabase.from("search_analytics").select("*", { count: "exact", head: true }),
      supabase.from("broken_link_reports").select("*", { count: "exact", head: true }),
      supabase.from("update_requests").select("*", { count: "exact", head: true }),
    ]);

    const categories = catCount || 0;
    const articles = artCount || 0;
    const resources = (progCount || 0) + (sprogCount || 0);
    const announcements = annCount || 0;
    const events = evtCount || 0;
    const activities = actCount || 0;
    const faqs = faqCount || 0;
    const translations =
      (catTrCount || 0) +
      (artTrCount || 0) +
      (annTrCount || 0) +
      (evtTrCount || 0) +
      (actTrCount || 0) +
      (faqTrCount || 0) +
      (progTrCount || 0);
    const dependentRelations =
      (artRelCount || 0) +
      (artTagCount || 0) +
      (tagCount || 0) +
      (progSchCount || 0) +
      (fbCount || 0) +
      (pvCount || 0) +
      (saCount || 0) +
      (blrCount || 0) +
      (urCount || 0);

    return {
      categories,
      articles,
      resources,
      announcements,
      events,
      activities,
      faqs,
      translations,
      dependentRelations,
      exclusiveFiles: 0,
      total:
        categories +
        articles +
        resources +
        announcements +
        events +
        activities +
        faqs +
        translations +
        dependentRelations,
    };
  } catch (error) {
    console.error("Error calculating content counts:", error);
    return {
      categories: 0,
      articles: 0,
      resources: 0,
      announcements: 0,
      events: 0,
      activities: 0,
      faqs: 0,
      translations: 0,
      dependentRelations: 0,
      exclusiveFiles: 0,
      total: 0,
    };
  }
}

/**
 * Creates an exportable JSON backup of all public content before deletion.
 * Excludes passwords, tokens, sessions, private auth keys, and personal credentials.
 */
export async function createPublicContentBackup(authorizedBy: {
  id: string;
  email: string;
}): Promise<PublicContentBackup> {
  const counts = await getPublicContentCounts();
  const backupId = `dmps-backup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  // Fetch all public records safely
  const [
    { data: categories },
    { data: category_translations },
    { data: articles },
    { data: article_translations },
    { data: article_relations },
    { data: article_tags },
    { data: tags },
    { data: announcements },
    { data: announcement_translations },
    { data: events },
    { data: event_translations },
    { data: activities },
    { data: activity_translations },
    { data: faqs },
    { data: faq_translations },
    { data: programs },
    { data: program_translations },
    { data: program_schools },
    { data: student_programs },
    { data: feedback },
    { data: page_views },
    { data: search_analytics },
    { data: broken_link_reports },
    { data: update_requests },
  ] = await Promise.all([
    supabase.from("categories").select("*"),
    supabase.from("category_translations").select("*"),
    supabase.from("articles").select("*"),
    supabase.from("article_translations").select("*"),
    supabase.from("article_relations").select("*"),
    supabase.from("article_tags").select("*"),
    supabase.from("tags").select("*"),
    supabase.from("announcements").select("*"),
    supabase.from("announcement_translations").select("*"),
    supabase.from("events").select("*"),
    supabase.from("event_translations").select("*"),
    supabase.from("activities").select("*"),
    supabase.from("activity_translations").select("*"),
    supabase.from("faqs").select("*"),
    supabase.from("faq_translations").select("*"),
    supabase.from("programs").select("*"),
    supabase.from("program_translations").select("*"),
    supabase.from("program_schools").select("*"),
    supabase.from("student_programs").select("*"),
    supabase.from("feedback").select("*"),
    supabase.from("page_views").select("*"),
    supabase.from("search_analytics").select("*"),
    supabase.from("broken_link_reports").select("*"),
    supabase.from("update_requests").select("*"),
  ]);

  const backup: PublicContentBackup = {
    backupId,
    timestamp,
    authorizedBy,
    summary: counts,
    data: {
      categories: categories || [],
      category_translations: category_translations || [],
      articles: articles || [],
      article_translations: article_translations || [],
      article_relations: article_relations || [],
      article_tags: article_tags || [],
      tags: tags || [],
      announcements: announcements || [],
      announcement_translations: announcement_translations || [],
      events: events || [],
      event_translations: event_translations || [],
      activities: activities || [],
      activity_translations: activity_translations || [],
      faqs: faqs || [],
      faq_translations: faq_translations || [],
      programs: programs || [],
      program_translations: program_translations || [],
      program_schools: program_schools || [],
      student_programs: student_programs || [],
      feedback: feedback || [],
      page_views: page_views || [],
      search_analytics: search_analytics || [],
      broken_link_reports: broken_link_reports || [],
      update_requests: update_requests || [],
    },
  };

  // Persist backup metadata in Supabase site_settings if configured
  if (isSupabaseConfigured()) {
    try {
      await supabase.from("site_settings").upsert(
        {
          key: "last_public_content_backup_meta",
          value: {
            backupId: backup.backupId,
            timestamp: backup.timestamp,
            authorizedBy: backup.authorizedBy,
            summary: backup.summary,
          } as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );
    } catch {
      // ignore metadata write warning
    }
  }

  return backup;
}

/**
 * Triggers the browser download of the backup file.
 */
export function downloadBackupJsonFile(backup: PublicContentBackup) {
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dmps-info-respaldo-${backup.backupId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Executes safe cascading deletion in strict dependency order:
 * 1. Dependent relations (relations, tags, student_programs, feedback, page views)
 * 2. Content translations (article, announcement, event, activity, faq, program translations)
 * 3. Search analytics, broken link reports, update requests
 * 4. Main public records (articles, announcements, events, activities, faqs, programs)
 * 5. Category translations & Categories
 * 6. Local caches
 * 7. Immutable audit logging
 */
export async function executePublicContentReset(
  authorizedBy: { id: string; email: string },
  backupId: string,
): Promise<ResetResult> {
  const initialCounts = await getPublicContentCounts();
  const timestamp = new Date().toISOString();

  try {
    // Step 1: Delete dependent child relations & tag connections
    await supabase
      .from("article_relations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("article_tags").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("program_schools")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("feedback").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("page_views").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Step 2: Delete content translations
    await supabase
      .from("article_translations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("announcement_translations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("event_translations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("activity_translations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("faq_translations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("program_translations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // Step 3: Delete search indexes & report logs associated with previous content
    await supabase
      .from("search_analytics")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("broken_link_reports")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("update_requests")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // Step 4: Delete main public records
    await supabase.from("articles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("announcements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("activities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("faqs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("programs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("student_programs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("tags").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Step 5: Delete category translations & categories
    await supabase
      .from("category_translations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    invalidateCategoriesCache();

    // Step 6: Clear all client offline and localStorage caches
    if (typeof window !== "undefined") {
      for (const table of REALTIME_TABLES) {
        try {
          localStorage.removeItem(cacheKey(table));
        } catch {
          // ignore
        }
      }
      // Also clear bound & sports cache
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (
            k &&
            (k.startsWith("dmps_db_") ||
              k.startsWith("dmps_bound_") ||
              k.startsWith("dmps_directory_"))
          ) {
            localStorage.removeItem(k);
          }
        }
      } catch {
        // ignore
      }
      notifyContentUpdated();
    }

    // Step 7: Record an immutable audit log entry
    const details = JSON.stringify({
      backupId,
      authorizedBy,
      countsDeleted: initialCounts,
      result: "SUCCESS",
      timestamp,
    });

    await logAudit(
      "delete",
      "system_public_content",
      backupId,
      `Reinicio del contenido público autorizado por ${authorizedBy.email}. Registros eliminados: ${initialCounts.total}. Respaldo: ${backupId}`,
    );

    // Also insert into audit_logs directly if possible
    try {
      await supabase.from("audit_logs").insert({
        action: "public_content_reset",
        entity: "system",
        entity_id: backupId,
        user_id: authorizedBy.id,
        user_email: authorizedBy.email,
        details,
        created_at: timestamp,
      });
    } catch {
      // ignore if duplicate
    }

    return {
      success: true,
      backupId,
      deletedCounts: initialCounts,
      timestamp,
    };
  } catch (error: any) {
    console.error("Public content reset failed:", error);
    // Log failure
    try {
      await logAudit(
        "delete",
        "system_public_content",
        backupId,
        `ERROR en reinicio de contenido: ${error.message || "Error desconocido"}`,
      );
    } catch {
      // ignore
    }

    return {
      success: false,
      backupId,
      deletedCounts: initialCounts,
      timestamp,
      error: error.message || "Ocurrió un error al eliminar los registros.",
    };
  }
}
