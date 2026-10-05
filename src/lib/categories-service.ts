/* eslint-disable @typescript-eslint/no-explicit-any */
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { filterBySchool } from "./school-scope";

export type CategoryTranslation = {
  language_code: string;
  name: string;
  description: string | null;
  updated_at?: string | null;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color?: string | null;
  card_banner_url?: string | null;
  card_bg?: string | null;
  display_order: number;
  is_featured: boolean;
  is_visible: boolean;
  school_id?: string | null;
  category_translations: CategoryTranslation[];
};

export const CATEGORIES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms
export const CATEGORIES_STALE_TIME = 5 * 60 * 1000; // 5 minutes in ms
export const CATEGORIES_GC_TIME = 30 * 60 * 1000; // 30 minutes in ms

export const CATEGORIES_QUERY_OPTIONS = {
  staleTime: CATEGORIES_STALE_TIME,
  gcTime: CATEGORIES_GC_TIME,
  refetchOnWindowFocus: false,
} as const;

export const CATEGORIES_PUBLIC_PROJECTION =
  "id, slug, name, description, icon, display_order, is_featured, is_visible, school_id, card_banner_url, card_bg";

export const CATEGORIES_FALLBACK_PROJECTION =
  "id, slug, name, description, icon, display_order, is_featured, is_visible";

export const CATEGORIES_ADMIN_PROJECTION =
  "id, slug, name, description, icon, display_order, is_featured, is_visible, school_id, card_banner_url, card_bg, created_at, updated_at";

export const CATEGORIES_TRANSLATIONS_PROJECTION =
  "id, category_id, language_code, name, description, updated_at";

function dedupeCategoryTranslations(trs: CategoryTranslation[]): CategoryTranslation[] {
  if (!Array.isArray(trs) || trs.length <= 1) return trs || [];
  const byLang = new Map<string, CategoryTranslation>();
  for (const t of trs) {
    if (!t || !t.language_code) continue;
    const prev = byLang.get(t.language_code);
    if (!prev || String(t.updated_at || "").localeCompare(String(prev.updated_at || "")) >= 0) {
      byLang.set(t.language_code, t);
    }
  }
  return Array.from(byLang.values());
}

export function enrichCategoryRow(raw: Record<string, any>): CategoryRow {
  let card_banner_url = raw.card_banner_url ?? null;
  let card_bg = raw.card_bg ?? null;
  if (typeof raw.color === "string" && raw.color.trim()) {
    const trimmed = raw.color.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        card_banner_url = card_banner_url || parsed.card_banner_url || null;
        card_bg = card_bg || parsed.card_bg || null;
      } catch {
        card_bg = card_bg || trimmed;
      }
    } else {
      card_bg = card_bg || trimmed;
    }
  }
  const trs = dedupeCategoryTranslations(
    Array.isArray(raw.category_translations) ? raw.category_translations : [],
  );
  const esTr = trs.find((t) => t.language_code === "es");
  return {
    ...(raw as CategoryRow),
    name: esTr?.name || raw.name || raw.slug || "",
    description: esTr?.description ?? raw.description ?? null,
    card_banner_url,
    card_bg,
    is_visible: raw.is_visible !== false,
    category_translations: trs,
  };
}

interface CategoriesCacheEntry {
  data: CategoryRow[];
  timestamp: number;
}

let categoriesMemoryCache: CategoriesCacheEntry | null = null;
let inFlightPromise: Promise<CategoryRow[]> | null = null;

/**
 * Invalidates the in-memory cache and cancels any pending in-flight promise.
 */
export function invalidateCategoriesCache(): void {
  categoriesMemoryCache = null;
  inFlightPromise = null;
}

/**
 * Retrieves cached categories with in-flight request deduplication and 5-minute TTL.
 * Multiple simultaneous calls share a single PostgREST Supabase query.
 */
export async function getCachedCategories(schoolId?: string): Promise<CategoryRow[]> {
  const now = Date.now();
  if (categoriesMemoryCache && now - categoriesMemoryCache.timestamp < CATEGORIES_CACHE_TTL) {
    return filterBySchool(categoriesMemoryCache.data, schoolId);
  }

  if (inFlightPromise) {
    const raw = await inFlightPromise;
    return filterBySchool(raw, schoolId);
  }

  inFlightPromise = (async () => {
    try {
      if (!isSupabaseConfigured()) {
        return categoriesMemoryCache?.data ?? [];
      }

      let catData: any[] | null = null;
      let catError: any = null;

      const { data, error } = await (supabase.from("categories") as any)
        .select(CATEGORIES_PUBLIC_PROJECTION)
        .order("display_order", { ascending: true });

      if (
        error &&
        (error.code === "42703" || /column .* does not exist/i.test(error.message || ""))
      ) {
        const fallbackRes = await (supabase.from("categories") as any)
          .select(CATEGORIES_FALLBACK_PROJECTION)
          .order("display_order", { ascending: true });
        catData = fallbackRes.data;
        catError = fallbackRes.error;
      } else {
        catData = data;
        catError = error;
      }

      if (catError) {
        console.warn("[CategoriesService] Supabase fetchCategories notice:", catError);
        return categoriesMemoryCache?.data ?? [];
      }

      const { data: trData } = await supabase
        .from("category_translations")
        .select(CATEGORIES_TRANSLATIONS_PROJECTION);

      const allTrs = Array.isArray(trData) ? (trData as Record<string, any>[]) : [];
      const enriched = (catData as unknown as Record<string, any>[])
        .map((c) => ({
          ...c,
          category_translations: allTrs.filter((t) => String(t.category_id) === String(c.id)),
        }))
        .map(enrichCategoryRow)
        .filter((c) => c.is_visible !== false);

      categoriesMemoryCache = {
        data: enriched,
        timestamp: Date.now(),
      };
      return enriched;
    } catch (err) {
      console.warn("[CategoriesService] Error fetching categories:", err);
      return categoriesMemoryCache?.data ?? [];
    } finally {
      inFlightPromise = null;
    }
  })();

  const result = await inFlightPromise;
  return filterBySchool(result, schoolId);
}

/**
 * Standard fetchCategories function, preserving identical external signature
 * while delegating to the unified cache and deduplication layer.
 */
export async function fetchCategories(schoolId?: string): Promise<CategoryRow[]> {
  const canonicalSchoolId = typeof schoolId === "string" ? schoolId : undefined;
  return getCachedCategories(canonicalSchoolId);
}

/**
 * Lightweight lookup for article enrichment: returns { id, slug, name } from cache.
 * Eliminates separate PostgREST queries from fetchPublishedArticles and fetchArticleBySlug.
 */
export async function getCachedCategoryLookup(): Promise<
  Array<{ id: string; slug: string; name: string }>
> {
  const all = await getCachedCategories();
  return all.map((c) => ({
    id: String(c.id),
    slug: String(c.slug),
    name: String(c.name),
  }));
}

/**
 * Retrieves a single category by id or slug from the unified cache.
 * Zero network egress if cache is alive.
 */
export async function getCachedCategoryByIdOrSlug(
  idOrSlug: string,
): Promise<{ id: string; slug: string; name: string } | null> {
  if (!idOrSlug) return null;
  const all = await getCachedCategoryLookup();
  const found = all.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  return found ?? null;
}
