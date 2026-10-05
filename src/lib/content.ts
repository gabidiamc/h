/* eslint-disable @typescript-eslint/no-explicit-any */
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { LanguageCode } from "./i18n";
import { filterBySchool } from "./school-scope";
import { computeContentStatus, isItemActive } from "./content-lifecycle";
import {
  autoTranslateArticleContent,
  autoTranslateText,
  hasSpanishContent,
} from "./auto-translator";
import { getCachedSiteSetting } from "./site-settings-service";
import { trackArticleFeedback, trackArticleView, trackSearch } from "@/analytics";

export type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | {
      type: "callout";
      text: string;
      title?: string;
      variant?: "info" | "warning" | "success" | "verified";
    }
  | { type: "image"; url: string; alt?: string; caption?: string }
  | { type: "video"; url: string; caption?: string }
  | { type: "link"; url: string; label: string };

type Tr = { language_code: string } & Record<string, unknown>;

export function normalizeLanguageCode(lang: string): string[] {
  if (lang === "kar" || lang === "ksw") return ["kar", "ksw"];
  return [lang];
}

function mergeTranslations(
  embedded: Record<string, unknown>[] | undefined,
  extra: Record<string, unknown>[],
): Record<string, unknown>[] {
  const merged = [...(embedded ?? [])];
  for (const et of extra) {
    const idx = merged.findIndex((m) => m["language_code"] === et["language_code"]);
    if (idx >= 0) merged[idx] = et;
    else merged.push(et);
  }
  return merged;
}

function dedupeTranslations<T extends { language_code: string; updated_at?: string | null }>(
  trs: T[] | null | undefined,
): T[] {
  if (!Array.isArray(trs) || trs.length <= 1) return trs || [];
  const byLang = new Map<string, T>();
  for (const t of trs) {
    if (!t || !t.language_code) continue;
    const prev = byLang.get(t.language_code);
    if (!prev || String(t.updated_at || "").localeCompare(String(prev.updated_at || "")) >= 0) {
      byLang.set(t.language_code, t);
    }
  }
  return Array.from(byLang.values());
}

export function pickTranslation<T extends Tr>(rows: T[] | null | undefined, lang: string) {
  if (!rows || rows.length === 0) return null;
  const deduped = dedupeTranslations(rows as (T & { updated_at?: string | null })[]);
  const targetCodes = normalizeLanguageCode(lang);
  return (
    deduped.find((r) => targetCodes.includes(r.language_code)) ??
    (lang !== "en" ? deduped.find((r) => r.language_code === "en") : null) ??
    deduped.find((r) => r.language_code === "es") ??
    deduped[0]!
  );
}

export {
  type CategoryRow,
  type CategoryTranslation,
  enrichCategoryRow,
  fetchCategories,
  getCachedCategories,
  getCachedCategoryLookup,
  getCachedCategoryByIdOrSlug,
  invalidateCategoriesCache,
  CATEGORIES_QUERY_OPTIONS,
  CATEGORIES_PUBLIC_PROJECTION,
  CATEGORIES_ADMIN_PROJECTION,
} from "./categories-service";
import {
  type CategoryRow,
  fetchCategories,
  getCachedCategoryLookup,
  getCachedCategoryByIdOrSlug,
} from "./categories-service";

export function localizedCategory(cat: CategoryRow, lang: LanguageCode) {
  const trs = cat.category_translations || [];
  const esTr = trs.find((r) => r.language_code === "es");
  if (lang === "es") {
    return {
      name: esTr?.name || cat.name,
      description: esTr?.description ?? cat.description,
    };
  }

  const targetCodes = normalizeLanguageCode(lang);
  const exactTr = trs.find((r) => targetCodes.includes(r.language_code));
  const sourceEsName = esTr?.name || cat.name;
  const sourceEsDesc = esTr?.description ?? cat.description;

  let name = exactTr?.name || sourceEsName;
  let description = exactTr?.description ?? sourceEsDesc;

  if (
    !exactTr ||
    (exactTr.name === sourceEsName && hasSpanishContent(name)) ||
    hasSpanishContent(name)
  ) {
    name = autoTranslateText(sourceEsName, lang);
  }
  if (
    description &&
    (!exactTr?.description ||
      (exactTr.description === sourceEsDesc && hasSpanishContent(description)) ||
      hasSpanishContent(description))
  ) {
    description = autoTranslateText(sourceEsDesc || description, lang);
  }
  return { name, description };
}

export interface ArticleBottomNav {
  enabled: boolean;
  back?: {
    enabled?: boolean;
    label?: string;
    sublabel?: string;
    targetType?: "category" | "topics" | "browser_back" | "custom_url";
    targetUrl?: string;
  };
  next?: {
    enabled?: boolean;
    label?: string;
    sublabel?: string;
    targetType?: "article" | "internal_page" | "external_url";
    targetSlug?: string;
    targetUrl?: string;
    targetTitle?: string;
    openInNewTab?: boolean;
  };
}

export type ArticleRow = {
  id: string;
  slug: string;
  status: string;
  category_id: string | null;
  school_id?: string | null;
  is_featured: boolean;
  published_at: string | null;
  updated_at: string;
  featured_image_url: string | null;
  card_banner_url?: string | null;
  card_bg?: string | null;
  transparent_bg?: boolean | null;
  card_banners?: Record<string, string> | null;
  featured_images?: Record<string, string> | null;
  bottom_nav?: ArticleBottomNav | null;
  article_translations: {
    language_code: string;
    title: string;
    summary: string | null;
    content_blocks: Block[];
    featured_image_url?: string | null;
    card_banner_url?: string | null;
  }[];
  categories?: { slug: string; name: string } | null;
};

const ARTICLE_SELECT =
  "*, article_translations(id, language_code, title, summary, content_blocks, updated_at), categories(slug, name)";

function enrichArticleRow(raw: Record<string, any>): ArticleRow {
  let parsedMeta: Record<string, any> = {};
  let parsedBlocks: Block[] | null = null;
  if (raw.content && typeof raw.content === "object") {
    if (Array.isArray(raw.content)) {
      parsedBlocks = raw.content;
    } else {
      if (Array.isArray(raw.content.blocks)) parsedBlocks = raw.content.blocks;
      if (raw.content._meta && typeof raw.content._meta === "object")
        parsedMeta = raw.content._meta;
    }
  } else if (typeof raw.content === "string" && raw.content.trim()) {
    const trimmed = raw.content.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          parsedBlocks = parsed;
        } else if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.blocks)) parsedBlocks = parsed.blocks;
          if (parsed._meta && typeof parsed._meta === "object") parsedMeta = parsed._meta;
        }
      } catch {
        // ignore JSON parse error
      }
    }
  }

  let trs = dedupeTranslations(
    (Array.isArray(raw.article_translations) ? raw.article_translations : []).map((t: any) => {
      let blocks = t?.content_blocks ?? t?.content;
      if (typeof blocks === "string") {
        try {
          blocks = JSON.parse(blocks);
        } catch {
          blocks = blocks.trim() ? [{ type: "paragraph", text: blocks }] : [];
        }
      }
      return {
        ...t,
        content_blocks: Array.isArray(blocks) ? blocks : [],
      };
    }),
  );

  if (parsedBlocks && parsedBlocks.length > 0) {
    trs = trs.map((t) =>
      t.language_code === "es" &&
      (!Array.isArray(t.content_blocks) || t.content_blocks.length === 0)
        ? { ...t, content_blocks: parsedBlocks! }
        : t,
    );
  }

  if (!trs.some((t) => t.language_code === "es") && raw.title) {
    trs = [
      {
        language_code: "es",
        title: String(raw.title),
        summary: raw.summary ?? null,
        content_blocks: parsedBlocks || [],
      },
      ...trs,
    ];
  }

  let cardBanners: Record<string, string> | null = null;
  if (raw.card_banners && typeof raw.card_banners === "object") {
    cardBanners = raw.card_banners;
  } else if (typeof raw.card_banners === "string" && raw.card_banners.trim().startsWith("{")) {
    try {
      cardBanners = JSON.parse(raw.card_banners);
    } catch {
      // ignore
    }
  }
  if (!cardBanners && parsedMeta.card_banners && typeof parsedMeta.card_banners === "object") {
    cardBanners = parsedMeta.card_banners;
  }

  let featuredImages: Record<string, string> | null = null;
  if (raw.featured_images && typeof raw.featured_images === "object") {
    featuredImages = raw.featured_images;
  } else if (
    typeof raw.featured_images === "string" &&
    raw.featured_images.trim().startsWith("{")
  ) {
    try {
      featuredImages = JSON.parse(raw.featured_images);
    } catch {
      // ignore
    }
  }
  if (
    !featuredImages &&
    parsedMeta.featured_images &&
    typeof parsedMeta.featured_images === "object"
  ) {
    featuredImages = parsedMeta.featured_images;
  }

  // Extract first image from content blocks if no banner URL is explicitly set
  let firstImageFromBlocks: string | null = null;
  if (Array.isArray(trs)) {
    for (const tr of trs) {
      if (Array.isArray(tr.content_blocks)) {
        for (const blk of tr.content_blocks) {
          if (blk?.type === "image" && blk.url) {
            firstImageFromBlocks = blk.url;
            break;
          }
          if (
            blk?.type === "paragraph" &&
            typeof blk.text === "string" &&
            blk.text.includes("<img")
          ) {
            const m = blk.text.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (m?.[1]) {
              firstImageFromBlocks = m[1];
              break;
            }
          }
        }
      }
      if (firstImageFromBlocks) break;
    }
  }

  if (!firstImageFromBlocks && Array.isArray(parsedBlocks)) {
    for (const blk of parsedBlocks) {
      if (blk?.type === "image" && (blk as any).url) {
        firstImageFromBlocks = (blk as any).url;
        break;
      }
      if (blk?.type === "paragraph" && typeof blk.text === "string" && blk.text.includes("<img")) {
        const m = blk.text.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (m?.[1]) {
          firstImageFromBlocks = m[1];
          break;
        }
      }
    }
  }

  const resolvedBannerUrl =
    (raw.card_banner_url && String(raw.card_banner_url).trim()) ||
    (parsedMeta.card_banner_url && String(parsedMeta.card_banner_url).trim()) ||
    cardBanners?.es ||
    cardBanners?.en ||
    (cardBanners &&
      Object.values(cardBanners).find((v) => typeof v === "string" && v.trim().length > 0)) ||
    (raw.featured_image_url && String(raw.featured_image_url).trim()) ||
    (parsedMeta.featured_image_url && String(parsedMeta.featured_image_url).trim()) ||
    (raw.image_url && String(raw.image_url).trim()) ||
    (parsedMeta.image_url && String(parsedMeta.image_url).trim()) ||
    (raw.photo_url && String(raw.photo_url).trim()) ||
    (parsedMeta.photo_url && String(parsedMeta.photo_url).trim()) ||
    (raw.cover_url && String(raw.cover_url).trim()) ||
    (parsedMeta.cover_url && String(parsedMeta.cover_url).trim()) ||
    (raw.banner_url && String(raw.banner_url).trim()) ||
    (parsedMeta.banner_url && String(parsedMeta.banner_url).trim()) ||
    firstImageFromBlocks ||
    null;

  const resolvedCardBg =
    (raw.card_bg && String(raw.card_bg).trim()) ||
    (parsedMeta.card_bg && String(parsedMeta.card_bg).trim()) ||
    null;

  const resolvedTransparentBg = Boolean(raw.transparent_bg ?? parsedMeta.transparent_bg ?? false);

  return {
    ...(raw as ArticleRow),
    card_banners: cardBanners,
    featured_images: featuredImages,
    card_banner_url: resolvedBannerUrl,
    featured_image_url:
      (raw.featured_image_url && String(raw.featured_image_url).trim()) ||
      resolvedBannerUrl ||
      null,
    card_bg: resolvedCardBg,
    transparent_bg: resolvedTransparentBg,
    bottom_nav: raw.bottom_nav ?? parsedMeta.bottom_nav ?? null,
    article_translations: trs,
  };
}

export async function fetchPublishedArticles(
  categoryId?: string,
  schoolId?: string,
): Promise<ArticleRow[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from("articles")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (categoryId) query = query.eq("category_id", categoryId);

      const [artRes, trRes, allCats] = await Promise.all([
        query,
        supabase
          .from("article_translations")
          .select("id, article_id, language_code, title, summary, content_blocks, updated_at"),
        getCachedCategoryLookup(),
      ]);

      if (!artRes.error && artRes.data) {
        const allTrs = Array.isArray(trRes.data) ? (trRes.data as Record<string, any>[]) : [];
        const enriched = (artRes.data as unknown as Record<string, any>[])
          .map((r) => {
            const matchedCat = allCats.find(
              (c) =>
                String(c.id) === String(r.category_id) || String(c.slug) === String(r.category_id),
            );
            return {
              ...r,
              article_translations: allTrs.filter((t) => String(t.article_id) === String(r.id)),
              categories: matchedCat
                ? { slug: String(matchedCat.slug), name: String(matchedCat.name) }
                : null,
            };
          })
          .map(enrichArticleRow);
        return filterBySchool(enriched, schoolId);
      }
    } catch (err) {
      console.warn("[Content] Supabase fetchPublishedArticles notice:", err);
    }
  }

  return [];
}

export async function fetchArticleBySlug(slug: string): Promise<ArticleRow | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();
      if (!error && data) {
        const raw = data as unknown as Record<string, any>;
        const [trRes, matchedCat] = await Promise.all([
          supabase
            .from("article_translations")
            .select("id, article_id, language_code, title, summary, content_blocks, updated_at")
            .eq("article_id", String(raw.id)),
          raw.category_id
            ? getCachedCategoryByIdOrSlug(String(raw.category_id))
            : Promise.resolve(null),
        ]);
        return enrichArticleRow({
          ...raw,
          article_translations: Array.isArray(trRes.data) ? trRes.data : [],
          categories: matchedCat
            ? { slug: String(matchedCat.slug), name: String(matchedCat.name) }
            : null,
        });
      }
    } catch (err) {
      console.warn("[Content] Supabase fetchArticleBySlug notice:", err);
    }
  }

  return null;
}

export function adaptSchoolText(text: string, schoolId?: string): string {
  if (!text) return text;
  const currentSchool = (
    schoolId ||
    (typeof window !== "undefined"
      ? localStorage.getItem("dmps_selected_school") ||
        localStorage.getItem("dmps_selected_school_v2") ||
        "lincoln"
      : "lincoln")
  ).toLowerCase();

  if (currentSchool === "east") {
    return text
      .replace(/Abraham Lincoln High School/g, "Des Moines East High School")
      .replace(/Lincoln High School/g, "East High School")
      .replace(/Lincoln High/g, "East High")
      .replace(/Escuela Lincoln/g, "Escuela East High")
      .replace(/Lincoln Students/g, "East High Students")
      .replace(/estudiantes de Lincoln/g, "estudiantes de East High")
      .replace(/alumnos de Lincoln/g, "alumnos de East High")
      .replace(/Lincoln Main Campus/g, "East High Main Campus")
      .replace(/Railsplitters/g, "Scarlets")
      .replace(/Railsplitter/g, "Scarlet")
      .replace(/Rails Closet/g, "Scarlet Closet")
      .replace(/Rails/g, "Scarlets")
      .replace(/2600 SW 9th St, Des Moines, IA 50315/g, "815 E 13th St, Des Moines, IA 50316")
      .replace(/lincoln\.bfl\.espanol@dmschools\.org/g, "east.bfl@dmschools.org")
      .replace(/lincoln\.dmschools\.org/g, "east.dmschools.org")
      .replace(/lincolnhigh\.dmschools\.org/g, "easthigh.dmschools.org")
      .replace(/515-242-7500/g, "515-242-7788")
      .replace(/515-242-7300/g, "515-242-7790")
      .replace(/\bLincoln\b/g, "East High");
  }

  if (currentSchool === "roosevelt") {
    return text
      .replace(/Abraham Lincoln High School/g, "Theodore Roosevelt High School")
      .replace(/Lincoln High School/g, "Roosevelt High School")
      .replace(/Lincoln High/g, "Roosevelt High")
      .replace(/Escuela Lincoln/g, "Escuela Roosevelt High")
      .replace(/Lincoln Students/g, "Roosevelt Students")
      .replace(/estudiantes de Lincoln/g, "estudiantes de Roosevelt High")
      .replace(/alumnos de Lincoln/g, "alumnos de Roosevelt High")
      .replace(/Lincoln Main Campus/g, "Roosevelt Main Campus")
      .replace(/Railsplitters/g, "Roughriders")
      .replace(/Railsplitter/g, "Roughrider")
      .replace(/Rails Closet/g, "Rider Closet")
      .replace(/Rails/g, "Roughriders")
      .replace(/2600 SW 9th St, Des Moines, IA 50315/g, "4419 Center St, Des Moines, IA 50312")
      .replace(/lincoln\.bfl\.espanol@dmschools\.org/g, "roosevelt.bfl@dmschools.org")
      .replace(/lincoln\.dmschools\.org/g, "roosevelt.dmschools.org")
      .replace(/515-242-7500/g, "515-242-7272")
      .replace(/515-242-7300/g, "515-242-7275")
      .replace(/\bLincoln\b/g, "Roosevelt High");
  }

  if (currentSchool === "north") {
    return text
      .replace(/Abraham Lincoln High School/g, "North High School")
      .replace(/Lincoln High School/g, "North High School")
      .replace(/Lincoln High/g, "North High")
      .replace(/Escuela Lincoln/g, "Escuela North High")
      .replace(/Lincoln Students/g, "North High Students")
      .replace(/estudiantes de Lincoln/g, "estudiantes de North High")
      .replace(/alumnos de Lincoln/g, "alumnos de North High")
      .replace(/Lincoln Main Campus/g, "North High Main Campus")
      .replace(/Railsplitters/g, "Polar Bears")
      .replace(/Railsplitter/g, "Polar Bear")
      .replace(/Rails Closet/g, "Polar Bear Closet")
      .replace(/Rails/g, "Polar Bears")
      .replace(/2600 SW 9th St, Des Moines, IA 50315/g, "501 Holcomb Ave, Des Moines, IA 50313")
      .replace(/lincoln\.bfl\.espanol@dmschools\.org/g, "north.bfl@dmschools.org")
      .replace(/lincoln\.dmschools\.org/g, "north.dmschools.org")
      .replace(/515-242-7500/g, "515-242-7200")
      .replace(/515-242-7300/g, "515-242-7205")
      .replace(/\bLincoln\b/g, "North High");
  }

  if (currentSchool === "hoover") {
    return text
      .replace(/Abraham Lincoln High School/g, "Herbert Hoover High School")
      .replace(/Lincoln High School/g, "Hoover High School")
      .replace(/Lincoln High/g, "Hoover High")
      .replace(/Escuela Lincoln/g, "Escuela Hoover High")
      .replace(/Lincoln Students/g, "Hoover High Students")
      .replace(/estudiantes de Lincoln/g, "estudiantes de Hoover High")
      .replace(/alumnos de Lincoln/g, "alumnos de Hoover High")
      .replace(/Lincoln Main Campus/g, "Hoover Main Campus")
      .replace(/Railsplitters/g, "Huskies")
      .replace(/Railsplitter/g, "Husky")
      .replace(/Rails Closet/g, "Husky Closet")
      .replace(/Rails/g, "Huskies")
      .replace(/2600 SW 9th St, Des Moines, IA 50315/g, "4800 Aurora Ave, Des Moines, IA 50310")
      .replace(/lincoln\.bfl\.espanol@dmschools\.org/g, "hoover.bfl@dmschools.org")
      .replace(/lincoln\.dmschools\.org/g, "hoover.dmschools.org")
      .replace(/515-242-7500/g, "515-242-7300")
      .replace(/515-242-7300/g, "515-242-7305")
      .replace(/\bLincoln\b/g, "Hoover High");
  }

  if (currentSchool === "central") {
    return text
      .replace(/Abraham Lincoln High School/g, "Central Campus & Central Academy")
      .replace(/Lincoln High School/g, "Central Campus")
      .replace(/Lincoln High/g, "Central Campus")
      .replace(/Escuela Lincoln/g, "Central Campus")
      .replace(/Lincoln Students/g, "Central Campus Students")
      .replace(/estudiantes de Lincoln/g, "estudiantes de Central Campus")
      .replace(/alumnos de Lincoln/g, "alumnos de Central Campus")
      .replace(/Lincoln Main Campus/g, "Central Campus")
      .replace(/Railsplitters/g, "Trailblazers")
      .replace(/Railsplitter/g, "Trailblazer")
      .replace(/Rails Closet/g, "Central Closet")
      .replace(/Rails/g, "Trailblazers")
      .replace(/2600 SW 9th St, Des Moines, IA 50315/g, "1800 Grand Ave, Des Moines, IA 50309")
      .replace(/lincoln\.bfl\.espanol@dmschools\.org/g, "central.bfl@dmschools.org")
      .replace(/lincoln\.dmschools\.org/g, "centralcampus.dmschools.org")
      .replace(/515-242-7500/g, "515-242-7888")
      .replace(/\bLincoln\b/g, "Central Campus");
  }

  return text;
}

function adaptBlock(block: Block, schoolId?: string): Block {
  if ("text" in block && typeof block.text === "string") {
    return { ...block, text: adaptSchoolText(block.text, schoolId) };
  }
  if (block.type === "list" && Array.isArray(block.items)) {
    return { ...block, items: block.items.map((i) => adaptSchoolText(i, schoolId)) };
  }
  return block;
}

export function localizedArticle(article: ArticleRow, lang: LanguageCode, schoolId?: string) {
  const trs = article.article_translations || [];
  const targetCodes = normalizeLanguageCode(lang);
  const exact = trs.find((t) => targetCodes.includes(t.language_code));
  const esTr = trs.find((t) => t.language_code === "es");
  const fallback = esTr || trs.find((t) => t.language_code === "en") || trs[0];
  const tr = lang === "es" ? esTr || fallback : exact || fallback;

  let rawTitle = (tr as { title?: string } | null)?.title || article.slug;
  let rawSummary = (tr as { summary?: string | null } | null)?.summary ?? null;
  let rawBlocks = ((tr as { content_blocks?: Block[] } | null)?.content_blocks ?? []) as Block[];

  let isAutoTranslated = false;
  if (lang !== "es") {
    if (!exact) {
      const auto = autoTranslateArticleContent(article.id, rawTitle, rawSummary, rawBlocks, lang);
      rawTitle = auto.title;
      rawSummary = auto.summary;
      rawBlocks = auto.blocks;
      isAutoTranslated = true;
    } else {
      // Authoritative translation exists for this language.
      // NEVER overwrite explicit saved content with machine translation.
      // Only auto-translate if the record exists but was saved completely empty.
      const hasContent =
        Array.isArray(rawBlocks) &&
        rawBlocks.length > 0 &&
        rawBlocks.some((b) => {
          if ("text" in b && typeof b.text === "string") return b.text.trim().length > 0;
          if (b.type === "list" && Array.isArray(b.items)) return b.items.length > 0;
          if (b.type === "image" && (b as any).url) return true;
          return false;
        });

      if (!hasContent && esTr) {
        const esTitle = esTr.title || "";
        const esSummary = esTr.summary ?? null;
        const esBlocks = (esTr.content_blocks ?? []) as Block[];
        if (esBlocks.length > 0) {
          const auto = autoTranslateArticleContent(
            article.id,
            rawTitle || esTitle,
            rawSummary || esSummary,
            esBlocks,
            lang,
          );
          if (!rawTitle) rawTitle = auto.title;
          if (!rawSummary) rawSummary = auto.summary;
          rawBlocks = auto.blocks;
          isAutoTranslated = true;
        }
      }
    }
  }

  // Resolve cover image / banner specifically for the requested language
  const exactTrObj = exact as Record<string, unknown> | undefined;
  const fallbackTrObj = fallback as Record<string, unknown> | undefined;
  const bannerUrl =
    (article.card_banners &&
      typeof article.card_banners === "object" &&
      article.card_banners[lang]) ||
    (exactTrObj?.card_banner_url as string) ||
    (exactTrObj?.featured_image_url as string) ||
    (article.featured_images &&
      typeof article.featured_images === "object" &&
      article.featured_images[lang]) ||
    (article.card_banners &&
      typeof article.card_banners === "object" &&
      (article.card_banners["es"] || article.card_banners["en"])) ||
    (fallbackTrObj?.card_banner_url as string) ||
    (fallbackTrObj?.featured_image_url as string) ||
    article.card_banner_url ||
    article.featured_image_url ||
    null;

  return {
    title: adaptSchoolText(rawTitle, schoolId),
    summary: rawSummary ? adaptSchoolText(rawSummary, schoolId) : null,
    blocks: rawBlocks.map((b) => adaptBlock(b, schoolId)),
    bannerUrl,
    cardBg: article.card_bg || null,
    transparent_bg: Boolean(article.transparent_bg),
    isFallback: !exact && !isAutoTranslated,
    isAutoTranslated,
  };
}

/**
 * Hook to reactively consume a localized article.
 * Automatically updates if background AI translations finish or language updates.
 */
export function useLocalizedArticle(
  article: ArticleRow | null | undefined,
  lang: LanguageCode,
  schoolId?: string,
) {
  const [, setTick] = useState(0);
  const articleId = article?.id;

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail || !articleId || detail.articleId === articleId) {
        setTick((t) => t + 1);
      }
    };
    window.addEventListener("dmps:article-translated", handler);
    window.addEventListener("dmps_content_updated", handler);
    return () => {
      window.removeEventListener("dmps:article-translated", handler);
      window.removeEventListener("dmps_content_updated", handler);
    };
  }, [articleId]);

  if (!article) return null;
  return localizedArticle(article, lang, schoolId);
}

export type AnnouncementRow = {
  id: string;
  level: "info" | "important" | "urgent";
  status: string;
  starts_at: string;
  expires_at?: string | null;
  ends_at?: string | null;
  archived_at?: string | null;
  link_url: string | null;
  is_pinned: boolean;
  show_on_home: boolean;
  school_id?: string | null;
  timezone?: string | null;
  card_banner_url?: string | null;
  card_bg?: string | null;
  announcement_translations: { language_code: string; title: string; message: string }[];
};

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  location: string | null;
  official_url: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_cancelled: boolean;
  status: string;
  school_id?: string | null;
  category_id?: string | null;
  contact_id?: string | null;
  updated_at?: string;
  event_translations?: { language_code: string; title: string; description: string | null }[];
};

export async function fetchEvents(schoolId?: string): Promise<EventRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const [evRes, trRes] = await Promise.all([
        supabase
          .from("events")
          .select("*")
          .eq("status", "published")
          .order("starts_at", { ascending: true }),
        supabase
          .from("event_translations")
          .select("id, event_id, language_code, title, description, updated_at"),
      ]);

      if (!evRes.error && evRes.data) {
        const allTrs = Array.isArray(trRes.data) ? (trRes.data as Record<string, any>[]) : [];
        const mapped = (evRes.data as unknown as Record<string, any>[]).map((r) => {
          const rawTrs = allTrs.filter((t) => String(t.event_id) === String(r.id));
          const trs = dedupeTranslations(rawTrs as any[]);
          const esTr = trs.find((t) => t.language_code === "es");
          return {
            ...r,
            title: esTr?.title || r.title || "",
            description: esTr?.description ?? r.description ?? null,
            start_date: r.start_date || (r.starts_at ? String(r.starts_at).slice(0, 10) : ""),
            end_date:
              r.end_date !== undefined
                ? r.end_date
                : r.ends_at
                  ? String(r.ends_at).slice(0, 10)
                  : null,
            official_url: r.official_url ?? r.source_url ?? null,
            event_translations: trs,
          };
        });
        return filterBySchool(mapped as unknown as EventRow[], schoolId);
      }
    } catch (err) {
      console.warn("[Content] Supabase fetchEvents notice:", err);
    }
  }

  return [];
}

export function localizedEvent(e: EventRow, lang: LanguageCode, schoolId?: string) {
  const trs = e.event_translations || [];
  const esTr = trs.find((r) => r.language_code === "es");
  if (lang === "es") {
    return {
      title: adaptSchoolText(esTr?.title || e.title || "", schoolId),
      description: adaptSchoolText(esTr?.description || e.description || "", schoolId),
    };
  }
  const targetCodes = normalizeLanguageCode(lang);
  const exactTr = trs.find((r) => targetCodes.includes(r.language_code));
  const sourceEsTitle = esTr?.title || e.title || "";
  const sourceEsDesc = esTr?.description || e.description || "";
  let title = exactTr?.title || sourceEsTitle;
  let description = exactTr?.description || sourceEsDesc;
  if (!exactTr || hasSpanishContent(title)) {
    title = autoTranslateText(sourceEsTitle || title, lang);
  }
  if (description && (!exactTr?.description || hasSpanishContent(description))) {
    description = autoTranslateText(sourceEsDesc || description, lang);
  }
  return {
    title: adaptSchoolText(title, schoolId),
    description: adaptSchoolText(description, schoolId),
  };
}

function enrichAnnouncementRow(raw: Record<string, any>): AnnouncementRow {
  const trs = dedupeTranslations(
    Array.isArray(raw.announcement_translations) ? raw.announcement_translations : [],
  );
  return {
    ...(raw as AnnouncementRow),
    level: raw.level === "warning" ? "important" : raw.level || "info",
    ends_at: raw.ends_at || raw.expires_at || null,
    announcement_translations: trs,
  };
}

export async function fetchActiveAnnouncements(schoolId?: string): Promise<AnnouncementRow[]> {
  const isActive = (a: AnnouncementRow) => {
    const item = {
      ...a,
      ends_at: a.ends_at || a.expires_at,
    };
    return isItemActive(item);
  };

  const scoped = (rows: AnnouncementRow[]) => filterBySchool(rows.filter(isActive), schoolId);

  if (isSupabaseConfigured()) {
    try {
      const [annRes, trRes] = await Promise.all([
        supabase
          .from("announcements")
          .select("*")
          .order("is_pinned", { ascending: false })
          .order("starts_at", { ascending: false }),
        supabase
          .from("announcement_translations")
          .select("id, announcement_id, language_code, title, message, updated_at"),
      ]);
      if (!annRes.error && annRes.data) {
        const allTrs = Array.isArray(trRes.data) ? (trRes.data as Record<string, any>[]) : [];
        return scoped(
          (annRes.data as unknown as Record<string, any>[])
            .map((r) => ({
              ...r,
              announcement_translations: allTrs.filter(
                (t) => String(t.announcement_id) === String(r.id),
              ),
            }))
            .map(enrichAnnouncementRow),
        );
      }
    } catch (err) {
      console.warn("[Content] Supabase fetchActiveAnnouncements notice:", err);
    }
  }

  return [];
}

export async function fetchAllAnnouncements(schoolId?: string): Promise<AnnouncementRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const [annRes, trRes] = await Promise.all([
        supabase
          .from("announcements")
          .select("*")
          .order("is_pinned", { ascending: false })
          .order("starts_at", { ascending: false }),
        supabase
          .from("announcement_translations")
          .select("id, announcement_id, language_code, title, message, updated_at"),
      ]);
      if (!annRes.error && annRes.data) {
        const allTrs = Array.isArray(trRes.data) ? (trRes.data as Record<string, any>[]) : [];
        return filterBySchool(
          (annRes.data as unknown as Record<string, any>[])
            .map((r) => ({
              ...r,
              announcement_translations: allTrs.filter(
                (t) => String(t.announcement_id) === String(r.id),
              ),
            }))
            .map(enrichAnnouncementRow),
          schoolId,
        );
      }
    } catch (err) {
      console.warn("[Content] Supabase fetchAllAnnouncements notice:", err);
    }
  }

  return [];
}

export function localizedAnnouncement(a: AnnouncementRow, lang: LanguageCode, schoolId?: string) {
  const trs = a.announcement_translations || [];
  const esTr = trs.find((r) => r.language_code === "es");
  const rawObj = a as Record<string, unknown>;
  const sourceEsTitle = esTr?.title || (typeof rawObj.title === "string" ? rawObj.title : "");
  const sourceEsMsg = esTr?.message || (typeof rawObj.message === "string" ? rawObj.message : "");
  if (lang === "es") {
    return {
      title: adaptSchoolText(sourceEsTitle, schoolId),
      message: adaptSchoolText(sourceEsMsg, schoolId),
    };
  }
  const targetCodes = normalizeLanguageCode(lang);
  const exactTr = trs.find((r) => targetCodes.includes(r.language_code));
  let title = exactTr?.title || sourceEsTitle;
  let message = exactTr?.message || sourceEsMsg;
  if (!exactTr || hasSpanishContent(title)) {
    title = autoTranslateText(sourceEsTitle || title, lang);
  }
  if (message && (!exactTr?.message || hasSpanishContent(message))) {
    message = autoTranslateText(sourceEsMsg || message, lang);
  }
  return {
    title: adaptSchoolText(title, schoolId),
    message: adaptSchoolText(message, schoolId),
  };
}

export type FaqRow = {
  id: string;
  display_order: number;
  category_id: string | null;
  school_id?: string | null;
  question?: string | null;
  answer?: string | null;
  faq_translations: {
    language_code: string;
    question: string;
    answer: string;
    updated_at?: string | null;
  }[];
};

export async function fetchFaqs(schoolId?: string): Promise<FaqRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const [faqRes, trRes] = await Promise.all([
        supabase
          .from("faqs")
          .select("*")
          .eq("status", "published")
          .order("display_order", { ascending: true }),
        supabase
          .from("faq_translations")
          .select("id, faq_id, language_code, question, answer, updated_at"),
      ]);
      if (!faqRes.error && faqRes.data) {
        const allTrs = Array.isArray(trRes.data) ? (trRes.data as Record<string, any>[]) : [];
        const mapped = (faqRes.data as unknown as Record<string, any>[]).map((r) => ({
          ...r,
          faq_translations: dedupeTranslations(
            allTrs.filter((t) => String(t.faq_id) === String(r.id)) as any[],
          ),
        }));
        return filterBySchool(mapped as unknown as FaqRow[], schoolId);
      }
    } catch (err) {
      console.warn("[Content] Supabase fetchFaqs notice:", err);
    }
  }

  return [];
}

export function localizedFaq(f: FaqRow, lang: LanguageCode, schoolId?: string) {
  const trs = f.faq_translations || [];
  const esTr = trs.find((r) => r.language_code === "es");
  const parentQ = typeof f.question === "string" ? f.question : "";
  const parentA = typeof f.answer === "string" ? f.answer : "";
  if (lang === "es") {
    return {
      question: adaptSchoolText(esTr?.question ?? (parentQ || trs[0]?.question || ""), schoolId),
      answer: adaptSchoolText(esTr?.answer ?? (parentA || trs[0]?.answer || ""), schoolId),
    };
  }
  const targetCodes = normalizeLanguageCode(lang);
  const exactTr = trs.find((r) => targetCodes.includes(r.language_code));
  const sourceEsQ = esTr?.question ?? (parentQ || trs[0]?.question || "");
  const sourceEsA = esTr?.answer ?? (parentA || trs[0]?.answer || "");
  let question = exactTr?.question ?? sourceEsQ;
  let answer = exactTr?.answer ?? sourceEsA;
  if (!exactTr || hasSpanishContent(question)) {
    question = autoTranslateText(sourceEsQ || question, lang);
  }
  if (!exactTr || hasSpanishContent(answer)) {
    answer = autoTranslateText(sourceEsA || answer, lang);
  }
  return {
    question: adaptSchoolText(question, schoolId),
    answer: adaptSchoolText(answer, schoolId),
  };
}

export type SiteSettings = {
  site_name: string;
  official_notice_en: string;
  official_notice_es: string;
  contact_email: string;
  contact_phone: string;
};

export async function fetchSettings(): Promise<Partial<SiteSettings>> {
  const res = await getCachedSiteSetting<Partial<SiteSettings>>("general", {});
  return res ?? {};
}

function blocksToText(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === "list") return b.items.join(" ");
      if ("text" in b) return b.text;
      if (b.type === "link") return b.label;
      return "";
    })
    .join(" ");
}

export function searchArticles(
  articles: ArticleRow[],
  query: string,
  lang: LanguageCode,
  categoryId?: string,
) {
  const q = query.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  return articles
    .filter((a) => !categoryId || a.category_id === categoryId)
    .map((a) => {
      const loc = localizedArticle(a, lang);
      const haystackTitle = loc.title.toLowerCase();
      const haystackBody = `${loc.summary ?? ""} ${blocksToText(loc.blocks)}`.toLowerCase();
      const allText = a.article_translations
        .map((t) => `${t.title} ${t.summary ?? ""}`)
        .join(" ")
        .toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (haystackTitle.includes(term)) score += 10;
        if (haystackBody.includes(term)) score += 4;
        if (allText.includes(term)) score += 1;
      }
      return { article: a, loc, score };
    })
    .filter((r) => terms.length === 0 || r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export async function logSearch(query: string, results: number, lang: string) {
  void trackSearch({
    query,
    resultCount: results,
    language: lang,
  });
  try {
    await supabase.from("search_analytics").insert({
      anonymous_query: query.slice(0, 160),
      results_count: results,
      language_code: lang,
    });
  } catch {
    /* analytics is best effort */
  }
}

export async function logPageView(articleId: string, lang: string) {
  trackArticleView({
    id: articleId,
    language: lang,
  });
  try {
    await supabase.from("page_views").insert({ article_id: articleId, language_code: lang });
  } catch {
    /* analytics is best effort */
  }
}

export async function sendFeedback(articleId: string, wasHelpful: boolean) {
  trackArticleFeedback(articleId, wasHelpful);
  await supabase.from("feedback").insert({ article_id: articleId, was_helpful: wasHelpful });
}
