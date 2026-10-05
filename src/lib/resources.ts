/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { filterBySchool } from "./school-scope";
import type { LanguageCode } from "./i18n";
import {
  fetchEntityTranslations,
  getLocalizedField,
  type ContentTranslation,
} from "./translations";

export type ResourceType = "link" | "document" | "tool" | "guide" | "contact" | "map";

export interface ResourceRow {
  id: string;
  school_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  resource_type: ResourceType;
  url: string;
  description: string | null;
  icon: string;
  is_visible: boolean;
  display_order: number;
  status: "draft" | "in_review" | "published" | "archived";
  created_at?: string;
  updated_at?: string;
  translations?: ContentTranslation[];
  category?: { id: string; name: string; slug: string } | null;
}

export const RESOURCE_TYPES: { type: ResourceType; label: string; icon: string }[] = [
  { type: "tool", label: "Herramienta interactiva", icon: "Wrench" },
  { type: "guide", label: "Guía paso a paso", icon: "BookOpen" },
  { type: "document", label: "Documento oficial / PDF", icon: "FileText" },
  { type: "link", label: "Portal o enlace externo", icon: "ExternalLink" },
  { type: "map", label: "Mapa o rutas", icon: "MapPin" },
  { type: "contact", label: "Canal de contacto directo", icon: "Phone" },
];

export async function fetchResources(
  schoolId: string,
  categoryId?: string,
): Promise<ResourceRow[]> {
  try {
    let query = (supabase as any)
      .from("resources")
      .select("*")
      .eq("school_id", schoolId)
      .eq("status", "published")
      .order("display_order", { ascending: true });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      return filterBySchool(data as ResourceRow[], schoolId);
    }
  } catch (err) {
    void err;
  }

  return [];
}

export async function fetchAllAdminResources(schoolId: string): Promise<ResourceRow[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("resources")
      .select("*")
      .eq("school_id", schoolId)
      .order("display_order", { ascending: true });

    if (!error && Array.isArray(data)) {
      return data as ResourceRow[];
    }
  } catch (err) {
    void err;
  }

  return [];
}

export function localizedResource(resource: ResourceRow, lang: LanguageCode) {
  const translations = resource.translations;
  const titleLoc = getLocalizedField(translations, "title", lang, resource.title);
  const descLoc = getLocalizedField(translations, "summary", lang, resource.description || "");

  return {
    title: titleLoc.value || resource.title,
    description: descLoc.value || resource.description,
    isFallback: titleLoc.isFallback,
  };
}
