/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { filterBySchool, schoolIdForStorage } from "./school-scope";
import { notifyContentUpdated } from "./sync";
import { autoTranslateText } from "./auto-translator";
import { CATEGORIES_ADMIN_PROJECTION, invalidateCategoriesCache } from "./categories-service";

export type AppRole = "super_admin" | "admin" | "editor" | "translator" | "reviewer";

export type Row = Record<string, any>;

export function formatRoleLabel(role: AppRole | string | null | undefined): string {
  if (!role) return "Sin rol";
  switch (role) {
    case "super_admin":
      return "Administrador principal";
    case "admin":
      return "Administrador";
    case "content_admin":
      return "Administrador de contenido";
    case "calendar_admin":
      return "Administrador de calendario";
    case "editor":
      return "Editor";
    case "translator":
      return "Traductor";
    case "reviewer":
      return "Revisor";
    default:
      return String(role).replace(/_/g, " ");
  }
}

function table(name: string) {
  return (supabase as any).from(name);
}

const ORDER_COLUMN_OVERRIDES: Record<string, Record<string, string>> = {
  events: { start_date: "starts_at" },
  programs: { display_order: "name" },
  activities: { display_order: "name" },
  dart_routes: { route_number: "route_short_name", updated_at: "route_short_name" },
};

const VIRTUAL_OR_OPTIONAL_TABLES = new Set(["services", "content_translations"]);

const missingColumnsByTable = new Map<string, Set<string>>();

function extractMissingColumnName(message?: string | null): string | null {
  if (!message) return null;
  const m1 = message.match(/Could not find the '([^']+)' column/i);
  if (m1?.[1]) return m1[1];
  const m2 = message.match(/column "([^"]+)" of relation/i);
  if (m2?.[1]) return m2[1];
  const m3 = message.match(/column (?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+) does not exist/i);
  if (m3?.[1]) return m3[1];
  return null;
}

function pruneKnownMissingColumns(tableName: string, row: Row): Row {
  const known = missingColumnsByTable.get(tableName);
  if (!known || known.size === 0) return { ...row };
  const next = { ...row };
  for (const col of known) {
    delete next[col];
  }
  return next;
}

function rememberMissingColumn(tableName: string, col: string) {
  let set = missingColumnsByTable.get(tableName);
  if (!set) {
    set = new Set();
    missingColumnsByTable.set(tableName, set);
  }
  set.add(col);
}

/**
 * Lists rows directly from Supabase database as the Single Source of Truth.
 */
export async function listRows(
  name: string,
  orderBy = "updated_at",
  ascending = false,
  schoolFilter?: string | null,
): Promise<Row[]> {
  let rows: Row[] = [];

  if (VIRTUAL_OR_OPTIONAL_TABLES.has(name)) {
    return [];
  }

  if (isSupabaseConfigured()) {
    try {
      const effectiveOrderBy = ORDER_COLUMN_OVERRIDES[name]?.[orderBy] ?? orderBy;
      const selectCols = name === "categories" ? CATEGORIES_ADMIN_PROJECTION : "*";
      const baseQuery = table(name).select(selectCols);
      let { data, error } =
        typeof baseQuery?.order === "function"
          ? await baseQuery.order(effectiveOrderBy, { ascending })
          : await baseQuery;

      if (
        error &&
        (error.code === "42703" || /column .* does not exist/i.test(error.message || ""))
      ) {
        const retryCols =
          name === "categories"
            ? "id, slug, name, description, icon, display_order, is_featured, is_visible"
            : "*";
        const retryResult = await table(name).select(retryCols);
        data = retryResult.data;
        error = retryResult.error;
      }

      if (!error && Array.isArray(data)) {
        rows = data as Row[];

        if (name === "events") {
          rows = rows.map((r) => ({
            ...r,
            start_date: r.start_date || (r.starts_at ? String(r.starts_at).slice(0, 10) : ""),
            end_date: r.end_date ? String(r.end_date).slice(0, 10) : null,
          }));
        } else if (name === "dart_routes") {
          rows = rows.map((r) => ({
            ...r,
            id: r.id || r.route_id,
            route_number: r.route_number || r.route_short_name,
            name: r.name || r.route_long_name,
          }));
        } else if (name === "faqs") {
          rows = rows.map((r) => ({
            ...r,
            is_published: r.is_published ?? r.status === "published",
          }));
        } else if (name === "announcements") {
          rows = rows.map((r) => ({
            ...r,
            level:
              r.level === "warning"
                ? "important"
                : r.level ||
                  (r.priority === "urgent"
                    ? "urgent"
                    : r.priority === "high"
                      ? "important"
                      : "info"),
            starts_at: r.starts_at || r.published_at || r.created_at,
            show_on_home: r.show_on_home ?? true,
          }));
        } else if (name === "schools") {
          rows = rows.map((r) => ({
            ...r,
            official_website_url: r.official_website_url || r.website_url || "",
            district_name: r.district_name || "Des Moines Public Schools",
          }));
        } else if (name === "contacts") {
          rows = rows.map((r) => {
            let meta: Record<string, any> = {};
            if (typeof r.notes === "string" && r.notes.trim().startsWith("{")) {
              try {
                meta = JSON.parse(r.notes);
              } catch {
                // ignore
              }
            }
            return {
              ...meta,
              ...r,
              person_name: r.person_name || r.full_name || r.department || "",
              job_title: r.job_title || r.role_title || "",
              address: r.address ?? r.office_location ?? null,
              hours: r.hours ?? r.office_hours ?? null,
              languages: r.languages ?? r.languages_spoken ?? ["Español", "English"],
              is_visible: r.is_visible ?? r.is_active ?? r.status !== "archived",
            };
          });
        } else if (name === "programs") {
          rows = rows.map((r) => {
            let docMeta: Record<string, any> = {};
            if (r.documents && !Array.isArray(r.documents) && typeof r.documents === "object") {
              docMeta = r.documents as Record<string, any>;
            } else if (
              Array.isArray(r.documents) &&
              r.documents.length === 1 &&
              r.documents[0]?._meta
            ) {
              docMeta = r.documents[0]._meta;
            }
            return {
              ...docMeta,
              ...r,
              program_type: r.program_type || docMeta.program_type || "Académico",
              school_level: r.school_level ?? docMeta.school_level ?? null,
              school_id: r.school_id ?? docMeta.school_id ?? null,
              official_url: r.official_url ?? docMeta.official_url ?? null,
              video_url: r.video_url ?? docMeta.video_url ?? null,
              requirements: r.requirements ?? docMeta.requirements ?? null,
              card_banner_url: r.card_banner_url ?? docMeta.card_banner_url ?? r.image_url ?? null,
              card_bg: r.card_bg ?? docMeta.card_bg ?? null,
              start_date: r.start_date ? String(r.start_date).slice(0, 10) : null,
              end_date: r.end_date ? String(r.end_date).slice(0, 10) : null,
            };
          });
        } else if (name === "student_programs") {
          rows = rows.map((r) => ({
            ...r,
            name: r.name || r.name_es || "",
            name_es: r.name_es || r.name || "",
            official_url: r.official_url ?? r.url ?? null,
            url: r.url ?? r.official_url ?? null,
            is_visible: r.is_visible ?? r.is_active ?? true,
            is_active: r.is_active ?? r.is_visible ?? true,
          }));
        }

        // Enrich articles with translations and packed metadata directly from Supabase
        if (name === "articles" && rows.length > 0) {
          rows = rows.map((r) => {
            let contentMeta: Record<string, any> = {};
            let parsedBodyBlocks: any[] | null = null;
            if (r.content && typeof r.content === "object" && !Array.isArray(r.content)) {
              if (r.content._meta && typeof r.content._meta === "object") {
                contentMeta = r.content._meta;
              }
              if (Array.isArray(r.content.blocks)) {
                parsedBodyBlocks = r.content.blocks;
              }
            } else if (typeof r.content === "string" && r.content.trim().startsWith("{")) {
              try {
                const parsed = JSON.parse(r.content);
                if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                  if (parsed._meta && typeof parsed._meta === "object") {
                    contentMeta = parsed._meta;
                  }
                  if (Array.isArray(parsed.blocks)) {
                    parsedBodyBlocks = parsed.blocks;
                  }
                }
              } catch {
                // ignore
              }
            }
            const next: Row = {
              ...contentMeta,
              ...r,
              card_banner_url:
                r.card_banner_url ||
                contentMeta.card_banner_url ||
                r.featured_image_url ||
                contentMeta.featured_image_url ||
                null,
              featured_image_url:
                r.featured_image_url ||
                contentMeta.featured_image_url ||
                r.card_banner_url ||
                contentMeta.card_banner_url ||
                null,
              card_bg: r.card_bg || contentMeta.card_bg || null,
              transparent_bg: r.transparent_bg ?? contentMeta.transparent_bg ?? false,
              card_banners: r.card_banners || contentMeta.card_banners || null,
              featured_images: r.featured_images || contentMeta.featured_images || null,
            };
            if (r.source_authority !== undefined && !next.source_name) {
              next.source_name = r.source_authority;
            }
            if (r.source_url !== undefined && !next.official_url) {
              next.official_url = r.source_url;
            }
            if (r.verification_details !== undefined && !next.admin_note) {
              next.admin_note = r.verification_details;
            }
            if (parsedBodyBlocks && !next._parsed_blocks) {
              next._parsed_blocks = parsedBodyBlocks;
            }
            return next;
          });
          try {
            const { data: artTrs } = await table("article_translations").select("*");
            if (artTrs && Array.isArray(artTrs)) {
              const sortedTrs = [...(artTrs as Row[])].sort((a, b) =>
                String(b.updated_at || "").localeCompare(String(a.updated_at || "")),
              );
              rows = rows.map((r) => {
                const rawTrs = sortedTrs.filter((t) => String(t.article_id) === String(r.id));
                const byLang = new Map<string, Row>();
                for (const t of rawTrs) {
                  const lc = String(t.language_code || "es");
                  if (!byLang.has(lc)) {
                    let blocks = t.content_blocks ?? t.content;
                    if (typeof blocks === "string") {
                      try {
                        blocks = JSON.parse(blocks);
                      } catch {
                        blocks = blocks.trim() ? [{ type: "paragraph", text: blocks }] : [];
                      }
                    }
                    if (!Array.isArray(blocks)) blocks = [];
                    byLang.set(lc, {
                      ...t,
                      content_blocks: blocks,
                      content: blocks,
                    });
                  }
                }
                const trs = Array.from(byLang.values());
                const esTr = trs.find((t) => t.language_code === "es") || trs[0];
                return {
                  ...r,
                  article_translations: trs.length > 0 ? trs : r.article_translations,
                  title: esTr?.title || r.title || undefined,
                  summary: esTr?.summary ?? r.summary ?? undefined,
                };
              });
            }
          } catch {
            // ignore translation enrichment error
          }
        }
      } else if (error) {
        return [];
      }
    } catch {
      return [];
    }
  }

  // If table does not have school_id (e.g. schools, audit_logs, user_roles, appearance_settings), return all
  if (
    [
      "schools",
      "audit_logs",
      "user_roles",
      "appearance_settings",
      "admin_invitations",
      "dart_routes",
      "content_translations",
      "categories",
    ].includes(name)
  ) {
    return rows;
  }

  return filterBySchool(rows, schoolFilter);
}

const TRANSLATION_TABLE_FK: Record<string, { fk: string; parentTable: string }> = {
  article_translations: { fk: "article_id", parentTable: "articles" },
  category_translations: { fk: "category_id", parentTable: "categories" },
  announcement_translations: { fk: "announcement_id", parentTable: "announcements" },
  event_translations: { fk: "event_id", parentTable: "events" },
  faq_translations: { fk: "faq_id", parentTable: "faqs" },
  program_translations: { fk: "program_id", parentTable: "programs" },
  activity_translations: { fk: "activity_id", parentTable: "activities" },
  school_translations: { fk: "school_id", parentTable: "schools" },
};

/**
 * Upserts a row directly to Supabase.
 * If Supabase returns an error, it throws an error immediately so the UI reflects
 * failure accurately and allows the user to retry.
 */
export async function upsertRow(name: string, values: Row): Promise<Row> {
  const payload = { ...values };
  const trMeta = TRANSLATION_TABLE_FK[name];

  let id =
    payload["id"] ||
    (name === "appearance_settings"
      ? "default"
      : name === "site_settings" && payload["key"]
        ? String(payload["key"])
        : trMeta && payload[trMeta.fk] && payload["language_code"]
          ? `tr_${String(payload[trMeta.fk])}_${String(payload["language_code"])}`
          : `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);

  delete payload["created_at"];
  delete payload["updated_at"];

  // Normalize school_id: preserve null/"all" for district-wide records on nullable tables
  if ("school_id" in payload) {
    const rawSchool = payload["school_id"];
    const isDistrictWide =
      rawSchool === null ||
      rawSchool === undefined ||
      rawSchool === "" ||
      rawSchool === "all" ||
      rawSchool === "district" ||
      rawSchool === "global" ||
      rawSchool === "*";

    if (isDistrictWide) {
      if (["resources", "student_programs"].includes(name)) {
        payload["school_id"] = "lincoln";
      } else if (["social_media_posts", "user_roles"].includes(name)) {
        payload["school_id"] = "all";
      } else {
        payload["school_id"] = null;
      }
    } else {
      payload["school_id"] = schoolIdForStorage(String(rawSchool));
    }
  }
  delete payload["id"];

  // Auto-generate slug if missing on tables with required slug
  if (
    [
      "articles",
      "categories",
      "topics",
      "programs",
      "schools",
      "resources",
      "student_programs",
    ].includes(name)
  ) {
    if (!payload["slug"] || typeof payload["slug"] !== "string" || !payload["slug"].trim()) {
      const sourceStr = String(
        payload["title"] || payload["name"] || payload["name_es"] || `item-${Date.now()}`,
      );
      payload["slug"] =
        sourceStr
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
    }
  }

  // Auto-ensure required fields for articles
  if (name === "articles") {
    if (!payload["status"]) payload["status"] = "published";
    if (!payload["verification_status"]) payload["verification_status"] = "verified";
    if (payload["status"] === "published" && !payload["published_at"]) {
      payload["published_at"] = new Date().toISOString();
    }
  }

  // Auto-ensure required fields for resources
  if (name === "resources") {
    if (!payload["status"]) payload["status"] = "published";
    if (!payload["resource_type"]) payload["resource_type"] = "link";
    if (!payload["title"] && payload["name"]) payload["title"] = payload["name"];
    if (!payload["name"] && payload["title"]) payload["name"] = payload["title"];
  }

  // Auto-ensure required fields for student_programs
  if (name === "student_programs") {
    if (!payload["name_es"] && payload["name"]) payload["name_es"] = payload["name"];
    if (!payload["name"] && payload["name_es"]) payload["name"] = payload["name_es"];
    if (!payload["description_es"]) payload["description_es"] = payload["description_en"] || "";
    if (payload["official_url"] !== undefined && payload["url"] === undefined) {
      payload["url"] = payload["official_url"];
    }
    if (payload["is_visible"] !== undefined && payload["is_active"] === undefined) {
      payload["is_active"] = Boolean(payload["is_visible"]);
    }
  }

  // Auto-ensure required fields for contacts
  if (name === "contacts") {
    if (!payload["role_title"]) {
      payload["role_title"] = payload["job_title"] || "Personal de contacto";
    }
    if (!payload["person_name"] && payload["full_name"]) {
      payload["person_name"] = payload["full_name"];
    }
  }

  // Auto-ensure required fields for faqs
  if (name === "faqs") {
    if (payload["is_published"] !== undefined && payload["status"] === undefined) {
      payload["status"] = payload["is_published"] ? "published" : "archived";
    }
    if (!payload["status"]) payload["status"] = "published";
  }

  // Auto-ensure required fields for schools
  if (name === "schools") {
    if (payload["official_website_url"] && !payload["website_url"]) {
      payload["website_url"] = payload["official_website_url"];
    }
    if (payload["is_active"] !== undefined && payload["is_visible"] === undefined) {
      payload["is_visible"] = Boolean(payload["is_active"]);
    }
    const nameStr = String(payload["name"] || "").toLowerCase();
    const shortStr = String(payload["short_name"] || "").toLowerCase();
    const slugStr = String(payload["slug"] || "")
      .trim()
      .toLowerCase();
    if (
      !slugStr ||
      (slugStr === "lincoln" && !nameStr.includes("lincoln") && shortStr !== "lincoln")
    ) {
      const baseSlug = String(payload["short_name"] || payload["name"] || `school-${Date.now()}`);
      payload["slug"] =
        baseSlug
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || `school-${Date.now()}`;
    } else {
      payload["slug"] = slugStr
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
  }

  // Auto-ensure required fields for events
  if (name === "events") {
    if (!payload["event_type"]) payload["event_type"] = "academic";
    if (!payload["status"]) payload["status"] = "published";
    if (payload["start_date"]) {
      const dateStr = String(payload["start_date"]).slice(0, 10);
      const timeStr =
        typeof payload["start_time"] === "string" && payload["start_time"].trim()
          ? payload["start_time"].trim()
          : "00:00";
      payload["starts_at"] = `${dateStr}T${timeStr.length === 5 ? `${timeStr}:00` : timeStr}Z`;
    }
    if (!payload["starts_at"]) payload["starts_at"] = new Date().toISOString();
    if (payload["end_date"] === "") {
      payload["end_date"] = null;
    } else if (
      typeof payload["end_date"] === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(payload["end_date"].trim())
    ) {
      const endTimeStr =
        typeof payload["end_time"] === "string" && payload["end_time"].trim()
          ? payload["end_time"].trim()
          : "23:59:59";
      payload["end_date"] =
        `${payload["end_date"].trim()}T${endTimeStr.length === 5 ? `${endTimeStr}:00` : endTimeStr}Z`;
    }
  }

  // Auto-ensure required fields for announcements
  if (name === "announcements") {
    if (!payload["priority"]) {
      payload["priority"] =
        payload["level"] === "urgent"
          ? "urgent"
          : payload["level"] === "important" || payload["level"] === "warning"
            ? "high"
            : "medium";
    }
    if (!payload["status"]) payload["status"] = "published";
    if (!payload["published_at"]) payload["published_at"] = new Date().toISOString();
    if (!payload["starts_at"]) payload["starts_at"] = payload["published_at"];
  }

  // Auto-ensure required fields for categories
  if (name === "categories") {
    if (!payload["icon"]) payload["icon"] = "BookOpen";
    if (!payload["name"] || typeof payload["name"] !== "string" || !payload["name"].trim()) {
      payload["name"] = String(payload["slug"] || "Categoría");
    }
  }

  let dbPayload: Row = { ...payload, id, updated_at: new Date().toISOString() };
  for (const joinedKey of [
    "article_translations",
    "category_translations",
    "event_translations",
    "announcement_translations",
    "program_translations",
    "activity_translations",
    "school_translations",
    "faq_translations",
    "categories",
    "_parsed_blocks",
  ]) {
    delete dbPayload[joinedKey];
  }

  // Sanitize empty string timestamps/dates to null so PostgreSQL timestamptz/date never throws 22007
  for (const [k, v] of Object.entries(dbPayload)) {
    if (v === "" && (k.endsWith("_at") || k.endsWith("_date") || k === "review_date")) {
      dbPayload[k] = null;
    }
  }

  if (name === "appearance_settings") {
    const { settings: _legacySettings, ...appearanceFields } = dbPayload;
    dbPayload = {
      ...appearanceFields,
      id,
      updated_at: new Date().toISOString(),
    };
  } else if (name === "site_settings") {
    if (dbPayload["key"]) {
      delete dbPayload["id"];
    }
  } else if (name === "articles") {
    if (dbPayload["source_name"] !== undefined && dbPayload["source_authority"] === undefined) {
      dbPayload["source_authority"] = dbPayload["source_name"];
    }
    if (dbPayload["official_url"] !== undefined && dbPayload["source_url"] === undefined) {
      dbPayload["source_url"] = dbPayload["official_url"];
    }
    if (dbPayload["admin_note"] !== undefined && dbPayload["verification_details"] === undefined) {
      dbPayload["verification_details"] = dbPayload["admin_note"];
    }

    // Preserve extended article metadata in articles.content JSON envelope
    let existingEnvelope: Record<string, any> = {};
    if (
      dbPayload["content"] &&
      typeof dbPayload["content"] === "object" &&
      !Array.isArray(dbPayload["content"])
    ) {
      existingEnvelope = dbPayload["content"];
    } else if (
      typeof dbPayload["content"] === "string" &&
      dbPayload["content"].trim().startsWith("{")
    ) {
      try {
        existingEnvelope = JSON.parse(dbPayload["content"]);
      } catch {
        existingEnvelope = {};
      }
    }
    const metaToSave: Record<string, any> = {
      ...(existingEnvelope._meta || {}),
    };
    for (const metaKey of [
      "card_banners",
      "featured_images",
      "card_banner_url",
      "featured_image_url",
      "card_bg",
      "transparent_bg",
      "image_mode",
      "image_url",
      "bottom_nav",
      "starts_at",
      "ends_at",
      "image_alt",
      "source_name",
      "official_url",
      "admin_note",
      "review_date",
      "contact_id",
    ]) {
      if (payload[metaKey] !== undefined) {
        metaToSave[metaKey] = payload[metaKey];
      }
    }
    dbPayload["content"] = JSON.stringify({
      blocks:
        payload["content_blocks"] !== undefined
          ? payload["content_blocks"]
          : existingEnvelope.blocks || [],
      _meta: metaToSave,
    });

    for (const uiOnlyCol of [
      "admin_note",
      "bottom_nav",
      "card_banners",
      "featured_images",
      "image_alt",
      "official_url",
      "source_name",
      "starts_at",
      "ends_at",
      "contact_id",
      "source_id",
      "review_date",
      "scheduled_at",
      "is_demo",
      "last_verified_at",
      "source_fetched_at",
      "view_count",
      "content_blocks",
    ]) {
      delete dbPayload[uiOnlyCol];
    }
  } else if (name === "article_translations") {
    if (dbPayload["content"] !== undefined && dbPayload["content_blocks"] === undefined) {
      dbPayload["content_blocks"] = dbPayload["content"];
    }
    delete dbPayload["content"];
    delete dbPayload["is_machine_translated"];
    delete dbPayload["card_banner_url"];
    delete dbPayload["featured_image_url"];
  } else if (name === "announcements") {
    if (dbPayload["level"] === "important") {
      dbPayload["level"] = "warning";
    }
    delete dbPayload["card_banner_url"];
    delete dbPayload["card_bg"];
    delete dbPayload["ends_at"];
    delete dbPayload["timezone"];
  } else if (name === "events") {
    const {
      start_date: _startDate,
      slug: _slug,
      official_url: _officialUrl,
      link_url: _linkUrl,
      ...eventFields
    } = dbPayload;
    dbPayload = eventFields;
  } else if (name === "faqs") {
    delete dbPayload["is_published"];
  } else if (name === "schools") {
    delete dbPayload["official_website_url"];
    delete dbPayload["district_name"];
  } else if (name === "programs") {
    const docMeta = {
      program_type: payload["program_type"] || "Académico",
      school_level: payload["school_level"] ?? null,
      school_id: payload["school_id"] ?? null,
      official_url: payload["official_url"] ?? null,
      video_url: payload["video_url"] ?? null,
      requirements: payload["requirements"] ?? null,
      card_banner_url: payload["card_banner_url"] ?? null,
      card_bg: payload["card_bg"] ?? null,
    };
    dbPayload["documents"] = [{ _meta: docMeta }];
    for (const progUiCol of [
      "program_type",
      "school_level",
      "school_id",
      "official_url",
      "video_url",
      "requirements",
      "card_banner_url",
      "card_bg",
      "languages",
    ]) {
      delete dbPayload[progUiCol];
    }
  }

  const fullSavedObject: Row = {
    ...payload,
    id,
    updated_at: new Date().toISOString(),
    created_at: values["created_at"] || new Date().toISOString(),
  };

  // Translation seed mapping (only triggered when parent row actually provides translatable text)
  const translationSeedMap: Record<
    string,
    {
      trTable: string;
      fk: string;
      shouldSeed: (p: Row) => boolean;
      extract: (p: Row) => Record<string, any>;
    }
  > = {
    categories: {
      trTable: "category_translations",
      fk: "category_id",
      shouldSeed: (p) => Boolean(p["name"] && String(p["name"]).trim()),
      extract: (p) => ({
        name: String(p["name"]).trim(),
        description: p["description"] || null,
      }),
    },
    events: {
      trTable: "event_translations",
      fk: "event_id",
      shouldSeed: (p) => Boolean(p["title"] && String(p["title"]).trim()),
      extract: (p) => ({
        title: String(p["title"]).trim(),
        description: p["description"] || null,
      }),
    },
    programs: {
      trTable: "program_translations",
      fk: "program_id",
      shouldSeed: (p) => Boolean(p["name"] && String(p["name"]).trim()),
      extract: (p) => ({
        name: String(p["name"]).trim(),
        summary: p["summary"] || null,
        description: p["description"] || null,
      }),
    },
    activities: {
      trTable: "activity_translations",
      fk: "activity_id",
      shouldSeed: (p) => Boolean(p["name"] && String(p["name"]).trim()),
      extract: (p) => ({
        name: String(p["name"]).trim(),
        description: p["description"] || null,
      }),
    },
    schools: {
      trTable: "school_translations",
      fk: "school_id",
      shouldSeed: (p) => Boolean(p["name"] && String(p["name"]).trim()),
      extract: (p) => ({
        name: String(p["name"]).trim(),
        description: p["description"] || null,
      }),
    },
    announcements: {
      trTable: "announcement_translations",
      fk: "announcement_id",
      shouldSeed: (p) => Boolean(p["title"] && String(p["title"]).trim()),
      extract: (p) => ({
        title: String(p["title"]).trim(),
        message: p["message"] || "",
      }),
    },
    faqs: {
      trTable: "faq_translations",
      fk: "faq_id",
      shouldSeed: (p) => Boolean(p["question"] && String(p["question"]).trim()),
      extract: (p) => ({
        question: String(p["question"]).trim(),
        answer: p["answer"] || "",
      }),
    },
  };

  const seedInfo = translationSeedMap[name];

  let resultRow: Row = fullSavedObject;

  // Direct persistence to Supabase
  if (isSupabaseConfigured()) {
    // If this is a translation table, look up existing rows for (fk, language_code) so we update in place and clean up duplicates
    if (trMeta && dbPayload[trMeta.fk] && dbPayload["language_code"]) {
      try {
        const { data: existingTrs } = await table(name)
          .select("id, updated_at")
          .eq(trMeta.fk, dbPayload[trMeta.fk])
          .eq("language_code", dbPayload["language_code"]);
        if (Array.isArray(existingTrs) && existingTrs.length > 0) {
          const sorted = [...existingTrs].sort((a, b) =>
            String(b.updated_at || "").localeCompare(String(a.updated_at || "")),
          );
          id = String(sorted[0].id);
          dbPayload["id"] = id;
          fullSavedObject["id"] = id;
          if (sorted.length > 1) {
            const duplicateIds = sorted.slice(1).map((r) => String(r.id));
            await table(name).delete().in("id", duplicateIds);
          }
        }
      } catch {
        // ignore lookup error
      }
    }

    const conflictTarget = name === "site_settings" && dbPayload["key"] ? "key" : "id";
    // 1. Upsert primary row (automatically pruning any unmigrated columns reported by PGRST204/42703)
    const selectCols = name === "site_settings" ? "key" : "id";
    const currentPayload = pruneKnownMissingColumns(name, dbPayload);
    let { data, error } = await table(name)
      .upsert(currentPayload, { onConflict: conflictTarget })
      .select(selectCols)
      .maybeSingle();

    let pruneRetries = 0;
    while (
      error &&
      name !== "appearance_settings" &&
      pruneRetries < 25 &&
      (error.code === "PGRST204" ||
        error.code === "42703" ||
        error.code === "23505" ||
        error.code === "23503" ||
        error.code === "57014" ||
        Boolean(extractMissingColumnName(error.message)))
    ) {
      if (error.code === "57014") {
        // Statement timeout: strip any duplicated data-original-src in JSON strings and retry without RETURNING
        for (const [k, v] of Object.entries(currentPayload)) {
          if (typeof v === "string" && v.includes("data-original-src=")) {
            currentPayload[k] = v.replace(/\sdata-original-src="[^"]*"/gi, "");
          } else if (Array.isArray(v)) {
            currentPayload[k] = JSON.parse(
              JSON.stringify(v).replace(/\\s*data-original-src=\\"[^\\"]*\\"/gi, ""),
            );
          }
        }
        pruneRetries += 1;
        const retryTimeoutRes = await table(name).upsert(currentPayload, {
          onConflict: conflictTarget,
        });
        data = null;
        error = retryTimeoutRes.error;
        break;
      } else if (error.code === "23505" && "slug" in currentPayload) {
        currentPayload["slug"] =
          `${currentPayload["slug"]}-${Math.random().toString(36).slice(2, 6)}`;
      } else if (error.code === "23503") {
        // Foreign key constraint fallback on optional references
        if ("school_id" in currentPayload && currentPayload["school_id"] !== null) {
          currentPayload["school_id"] = null;
        } else if ("category_id" in currentPayload && currentPayload["category_id"] !== null) {
          currentPayload["category_id"] = null;
        } else if ("contact_id" in currentPayload && currentPayload["contact_id"] !== null) {
          currentPayload["contact_id"] = null;
        } else {
          break;
        }
      } else {
        const missingCol = extractMissingColumnName(error.message);
        if (!missingCol || !(missingCol in currentPayload)) break;
        rememberMissingColumn(name, missingCol);
        delete currentPayload[missingCol];
      }
      pruneRetries += 1;
      const retryRes = await table(name)
        .upsert(currentPayload, { onConflict: conflictTarget })
        .select(selectCols)
        .maybeSingle();
      data = retryRes.data;
      error = retryRes.error;
    }

    if (
      error &&
      name === "appearance_settings" &&
      /column .* does not exist|schema cache/i.test(error.message)
    ) {
      const legacySettings = {
        id,
        settings: {
          logo_url: payload["logo_url"] ?? null,
          logo_light_url: payload["logo_light_url"] ?? null,
          logo_dark_url: payload["logo_dark_url"] ?? null,
          favicon_url: payload["favicon_url"] ?? null,
          pwa_icon_url: payload["pwa_icon_url"] ?? null,
          application_logo_storage_path: payload["application_logo_storage_path"] ?? null,
          favicon_storage_path: payload["favicon_storage_path"] ?? null,
          pwa_icon_storage_path: payload["pwa_icon_storage_path"] ?? null,
          branding_version: payload["branding_version"] ?? "1",
          logo_height: payload["logo_height"] ?? 56,
          logo_alt: payload["logo_alt"] ?? null,
          show_wordmark: payload["show_wordmark"] ?? true,
          light_theme: payload["light_theme"] ?? {},
          dark_theme: payload["dark_theme"] ?? {},
        },
        updated_at: new Date().toISOString(),
      };
      const legacyResult = await table(name)
        .upsert(legacySettings, { onConflict: "id" })
        .select()
        .maybeSingle();
      data = legacyResult.data;
      error = legacyResult.error;
    }

    if (error) {
      console.error(`[Supabase upsert error for ${name}]:`, error);
      throw new Error(
        `Error en Supabase (${name}): ${error.message}${error.code ? ` (${error.code})` : ""}`,
      );
    }

    if (data) {
      resultRow = { ...fullSavedObject, ...(data as Row) };
    }

    // If we just saved an 'es' translation row, sync its main fields back to the parent table
    if (trMeta && dbPayload["language_code"] === "es" && dbPayload[trMeta.fk]) {
      try {
        const parentId = String(dbPayload[trMeta.fk]);
        const parentUpdate: Row = { updated_at: new Date().toISOString() };
        if (trMeta.parentTable === "categories" && dbPayload["name"]) {
          parentUpdate["name"] = dbPayload["name"];
          if (dbPayload["description"] !== undefined) {
            parentUpdate["description"] = dbPayload["description"];
          }
          await table("categories").update(parentUpdate).eq("id", parentId);
        } else if (trMeta.parentTable === "events" && dbPayload["title"]) {
          parentUpdate["title"] = dbPayload["title"];
          if (dbPayload["description"] !== undefined) {
            parentUpdate["description"] = dbPayload["description"];
          }
          await table("events").update(parentUpdate).eq("id", parentId);
        } else if (trMeta.parentTable === "programs" && dbPayload["name"]) {
          parentUpdate["name"] = dbPayload["name"];
          if (dbPayload["summary"] !== undefined) parentUpdate["summary"] = dbPayload["summary"];
          if (dbPayload["description"] !== undefined) {
            parentUpdate["description"] = dbPayload["description"];
          }
          await table("programs").update(parentUpdate).eq("id", parentId);
        } else if (trMeta.parentTable === "activities" && dbPayload["name"]) {
          parentUpdate["name"] = dbPayload["name"];
          if (dbPayload["description"] !== undefined) {
            parentUpdate["description"] = dbPayload["description"];
          }
          await table("activities").update(parentUpdate).eq("id", parentId);
        } else if (trMeta.parentTable === "schools" && dbPayload["name"]) {
          parentUpdate["name"] = dbPayload["name"];
          if (dbPayload["description"] !== undefined) {
            parentUpdate["description"] = dbPayload["description"];
          }
          await table("schools").update(parentUpdate).eq("id", parentId);
        } else if (trMeta.parentTable === "faqs" && dbPayload["question"]) {
          parentUpdate["question"] = dbPayload["question"];
          if (dbPayload["answer"] !== undefined) {
            parentUpdate["answer"] = dbPayload["answer"];
          }
          await table("faqs").update(parentUpdate).eq("id", parentId);
        }
      } catch {
        // ignore parent sync error
      }
    }

    // 2. Persist translations if applicable and parent payload actually included translatable text
    if (seedInfo && seedInfo.shouldSeed(payload)) {
      const upsertTranslationRow = async (trPayload: Row, isEn = false) => {
        try {
          const { data: existingTrs } = await table(seedInfo.trTable)
            .select("id, updated_at")
            .eq(seedInfo.fk, id)
            .eq("language_code", trPayload["language_code"]);
          if (Array.isArray(existingTrs) && existingTrs.length > 0) {
            if (isEn) return; // Don't overwrite existing English translation automatically
            const sorted = [...existingTrs].sort((a, b) =>
              String(b.updated_at || "").localeCompare(String(a.updated_at || "")),
            );
            trPayload["id"] = String(sorted[0].id);
            if (sorted.length > 1) {
              const dupIds = sorted.slice(1).map((r) => String(r.id));
              await table(seedInfo.trTable).delete().in("id", dupIds);
            }
          }
        } catch {
          // ignore
        }

        const currentTrPayload = pruneKnownMissingColumns(seedInfo.trTable, trPayload);
        let { error: trErr } = await table(seedInfo.trTable).upsert(currentTrPayload, {
          onConflict: "id",
        });
        let trRetries = 0;
        while (
          trErr &&
          trRetries < 10 &&
          (trErr.code === "PGRST204" ||
            trErr.code === "42703" ||
            Boolean(extractMissingColumnName(trErr.message)))
        ) {
          const missingCol = extractMissingColumnName(trErr.message);
          if (!missingCol || !(missingCol in currentTrPayload)) break;
          rememberMissingColumn(seedInfo.trTable, missingCol);
          delete currentTrPayload[missingCol];
          trRetries += 1;
          const retryTr = await table(seedInfo.trTable).upsert(currentTrPayload, {
            onConflict: "id",
          });
          trErr = retryTr.error;
        }
      };

      const extracted = seedInfo.extract(payload);
      const esRow = {
        id: `tr_${id}_es`,
        [seedInfo.fk]: id,
        language_code: "es",
        ...extracted,
        updated_at: new Date().toISOString(),
      };

      await upsertTranslationRow(esRow, false);

      const enExtracted: Record<string, any> = {};
      for (const [k, v] of Object.entries(extracted)) {
        if (typeof v === "string" && v.trim()) {
          enExtracted[k] = autoTranslateText(v, "en");
        } else {
          enExtracted[k] = v;
        }
      }
      const enRow = {
        id: `tr_${id}_en`,
        [seedInfo.fk]: id,
        language_code: "en",
        ...enExtracted,
        updated_at: new Date().toISOString(),
      };
      await upsertTranslationRow(enRow, true);
    }
  }

  if (
    name === "categories" ||
    name === "category_translations" ||
    (trMeta && trMeta.parentTable === "categories")
  ) {
    invalidateCategoriesCache();
  }

  if (typeof window !== "undefined") {
    notifyContentUpdated(name);
    if (trMeta) notifyContentUpdated(trMeta.parentTable);
    if (seedInfo) notifyContentUpdated(seedInfo.trTable);
    if (name === "appearance_settings") {
      window.dispatchEvent(new CustomEvent("dmps_appearance_updated", { detail: resultRow }));
    }
  }

  return resultRow;
}

/**
 * Deletes a row directly from Supabase.
 * If Supabase returns an error, throws immediately.
 */
export async function deleteRow(name: string, id: string): Promise<void> {
  if (name === "categories" || name === "category_translations") {
    invalidateCategoriesCache();
  }

  if (isSupabaseConfigured()) {
    const { error } = await table(name).delete().eq("id", id);
    if (error) {
      console.error(`[Supabase delete error for ${name}]:`, error);
      throw new Error(
        `Error al eliminar en Supabase (${name}): ${error.message}${error.code ? ` (${error.code})` : ""}`,
      );
    }
  }

  if (typeof window !== "undefined") {
    notifyContentUpdated(name);
  }
}

/**
 * Purges demo/sample data directly from Supabase.
 */
export async function clearAllDemoData(): Promise<{ success: boolean; clearedCount: number }> {
  const tablesToClear = [
    "article_translations",
    "articles",
    "category_translations",
    "categories",
    "announcement_translations",
    "announcements",
    "activity_translations",
    "activities",
    "event_translations",
    "events",
    "faq_translations",
    "faqs",
  ];

  let clearedCount = 0;

  if (isSupabaseConfigured()) {
    for (const t of tablesToClear) {
      try {
        const { data, error } = await table(t).delete().neq("id", "___NEVER_MATCH___").select("id");
        if (!error && Array.isArray(data)) {
          clearedCount += data.length;
        }
      } catch (e) {
        console.warn(`Could not clear table ${t} via Supabase:`, e);
      }

      if (typeof window !== "undefined") {
        notifyContentUpdated(t);
      }
    }
  }

  return { success: true, clearedCount };
}

export async function logAudit(
  action: string,
  entityType: string,
  entityId?: string,
  summary?: string,
) {
  try {
    const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (!data?.user) return;
    await table("audit_logs")
      .insert({
        user_id: data.user.id,
        action,
        entity_type: entityType,
        entity_id: entityId ?? null,
        change_summary: summary ?? null,
      })
      .catch(() => {});
  } catch {
    // Ignore audit log error in offline/local fallback mode
  }
}

/* ---------------- session + roles ---------------- */

export type AdminSession = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  role: AppRole | null;
  session?: { user?: { id?: string; email?: string } } | null;
};

export function useAdminSession(): AdminSession {
  const [state, setState] = useState<AdminSession>({
    loading: true,
    userId: null,
    email: null,
    role: null,
    session: null,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!active) return;
        if (!user) {
          setState({
            loading: false,
            userId: null,
            email: null,
            role: null,
            session: null,
          });
          return;
        }
        const { data: roles, error: roleError } = await table("user_roles")
          .select("role")
          .eq("user_id", user.id);
        if (!active) return;

        if (roleError || !roles || roles.length === 0) {
          setState({
            loading: false,
            userId: user.id,
            email: user.email ?? null,
            role: null,
            session: { user: { id: user.id, email: user.email ?? undefined } },
          });
          return;
        }

        const order: AppRole[] = ["super_admin", "admin", "editor", "translator", "reviewer"];
        const validRoles = (roles ?? [])
          .map((r: Row) => r["role"] as AppRole)
          .filter((r: AppRole) => order.includes(r))
          .sort((a: AppRole, b: AppRole) => order.indexOf(a) - order.indexOf(b));
        const found = validRoles[0] ?? null;

        setState({
          loading: false,
          userId: user.id,
          email: user.email ?? null,
          role: found,
          session: { user: { id: user.id, email: user.email ?? undefined } },
        });
      } catch {
        if (!active) return;
        setState({
          loading: false,
          userId: null,
          email: null,
          role: null,
          session: null,
        });
      }
    }

    void load();

    const handleAuthChange = () => {
      void load();
    };

    window.addEventListener("dmps_auth_change", handleAuthChange);

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      active = false;
      window.removeEventListener("dmps_auth_change", handleAuthChange);
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function canEdit(role: AppRole | null) {
  return role !== null;
}

export function canManageUsers(role: AppRole | null) {
  return role === "super_admin" || role === "admin";
}

export function canPublish(role: AppRole | null) {
  return role === "super_admin" || role === "admin" || role === "editor";
}

/** True when no staff account exists yet — allows the very first sign-up. */
export async function noStaffYet(): Promise<boolean> {
  try {
    const { count, error } = await table("user_roles").select("id", { count: "exact", head: true });
    if (error) return true;
    return (count ?? 0) === 0;
  } catch {
    return true;
  }
}

export async function createInvitation(input: {
  email: string;
  role: AppRole;
  full_name?: string;
  notes?: string;
}) {
  const token =
    globalThis.crypto?.randomUUID?.().replaceAll("-", "") ??
    Math.random().toString(36).slice(2) + Date.now().toString(36);
  const { data: me } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  const { data, error } = await table("admin_invitations")
    .insert({
      email: input.email.trim().toLowerCase(),
      role: input.role,
      full_name: input.full_name ?? null,
      notes: input.notes ?? null,
      token,
      expires_at: expires,
      invited_by: me?.user?.id ?? null,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data as Row;
}

/** Signs the staff member out of the shared backend. */
export async function signOutStaff() {
  await supabase.auth.signOut();
  if (typeof window !== "undefined") window.dispatchEvent(new Event("dmps_auth_change"));
}
