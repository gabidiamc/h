/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { readCache, writeCache, notifyContentUpdated } from "./sync";
import type { LanguageCode } from "./i18n";

export type TranslationLanguage = "es" | "en" | "ksw";

export type TranslationStatus = "missing" | "draft" | "needs_review" | "approved";

export type EntityType = "school" | "category" | "article" | "resource";

export interface ContentTranslation {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  language_code: TranslationLanguage;
  title: string;
  summary?: string | null;
  content?: string | null;
  button_label?: string | null;
  accessibility_label?: string | null;
  translation_status: TranslationStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const SUPPORTED_TRANSLATION_LANGUAGES: {
  code: TranslationLanguage;
  label: string;
  native: string;
}[] = [
  { code: "es", label: "Español", native: "Español" },
  { code: "en", label: "Inglés", native: "English" },
  { code: "ksw", label: "S'gaw Karen", native: "ကညီကျိာ်" },
];

export const TRANSLATION_STATUS_CONFIG: Record<
  TranslationStatus,
  { label: string; badgeClass: string }
> = {
  missing: {
    label: "Pendiente / Sin traducción",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
  draft: {
    label: "Borrador",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  needs_review: {
    label: "En revisión",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  approved: {
    label: "Aprobada y Verificada",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
};

const TABLE_NAME = "content_translations";

/**
 * Fetches all translations for a specific entity.
 */
export async function fetchEntityTranslations(
  entityType: EntityType,
  entityId: string,
): Promise<ContentTranslation[]> {
  try {
    const { data, error } = await (supabase as any)
      .from(TABLE_NAME)
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as ContentTranslation[];
    }
  } catch (err) {
    void err;
  }

  // Local cache fallback
  const cached = readCache<ContentTranslation>(TABLE_NAME) ?? [];
  return cached.filter(
    (t) => t.entity_type === entityType && String(t.entity_id) === String(entityId),
  );
}

/**
 * Saves or updates a translation for an entity.
 */
export async function saveContentTranslation(
  translation: Partial<ContentTranslation> & {
    entity_type: EntityType;
    entity_id: string;
    language_code: TranslationLanguage;
    title: string;
  },
): Promise<ContentTranslation> {
  const id =
    translation.id ||
    `ct_${translation.entity_type}_${translation.entity_id}_${translation.language_code}`;

  const payload: ContentTranslation = {
    id,
    entity_type: translation.entity_type,
    entity_id: translation.entity_id,
    language_code: translation.language_code,
    title: translation.title || "",
    summary: translation.summary ?? null,
    content: translation.content ?? null,
    button_label: translation.button_label ?? null,
    accessibility_label: translation.accessibility_label ?? null,
    translation_status: translation.translation_status || "draft",
    reviewed_by: translation.reviewed_by ?? null,
    reviewed_at: translation.reviewed_at ?? null,
    updated_at: new Date().toISOString(),
    created_at: translation.created_at || new Date().toISOString(),
  };

  // 1. Update local cache
  try {
    const cached = readCache<ContentTranslation>(TABLE_NAME) ?? [];
    const idx = cached.findIndex(
      (c) =>
        c.entity_type === payload.entity_type &&
        c.entity_id === payload.entity_id &&
        c.language_code === payload.language_code,
    );
    let nextCached = [...cached];
    if (idx >= 0) {
      nextCached[idx] = { ...nextCached[idx], ...payload };
    } else {
      nextCached = [payload, ...nextCached];
    }
    writeCache(TABLE_NAME, nextCached);
  } catch (err) {
    console.warn("Failed to write translation cache:", err);
  }

  // 2. Persist to Supabase
  try {
    await (supabase as any)
      .from(TABLE_NAME)
      .upsert(payload, { onConflict: "entity_type,entity_id,language_code" });
  } catch (err) {
    console.warn("Failed to upsert to content_translations table:", err);
  }

  if (typeof window !== "undefined") {
    notifyContentUpdated(TABLE_NAME);
  }

  return payload;
}

/**
 * Returns localized string with Spanish as fallback.
 * Guarantees no undefined or empty keys are returned.
 */
export function getLocalizedField(
  translations: ContentTranslation[] | undefined | null,
  field: "title" | "summary" | "content" | "button_label" | "accessibility_label",
  targetLang: TranslationLanguage | LanguageCode | string,
  fallbackValue: string = "",
): { value: string; isFallback: boolean; status: TranslationStatus } {
  const normLang = targetLang === "kar" ? "ksw" : (targetLang as TranslationLanguage);
  const list = translations ?? [];

  const exact = list.find((t) => t.language_code === normLang && t[field]?.trim());
  if (exact && exact[field]) {
    return {
      value: exact[field] as string,
      isFallback: false,
      status: exact.translation_status,
    };
  }

  // 1. Spanish Fallback
  const es = list.find((t) => t.language_code === "es" && t[field]?.trim());
  if (es && es[field]) {
    return {
      value: es[field] as string,
      isFallback: normLang !== "es",
      status: es.translation_status,
    };
  }

  // 2. English Fallback
  const en = list.find((t) => t.language_code === "en" && t[field]?.trim());
  if (en && en[field]) {
    return {
      value: en[field] as string,
      isFallback: true,
      status: en.translation_status,
    };
  }

  return {
    value: fallbackValue || "",
    isFallback: true,
    status: "missing",
  };
}
