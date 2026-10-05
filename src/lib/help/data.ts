/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Data access for the family help assistant.
 *
 * Reads approved, staff-maintained rows straight from the database. There is no
 * AI provider, no external API and no generated content anywhere in this flow.
 */
import { supabase } from "@/integrations/supabase/client";
import { sanitizeQueryForStorage } from "./text";

const db = (name: string) => (supabase as any).from(name);

export type HelpSchoolChoice = "lincoln" | "east" | "district" | "unsure";

export type HelpSchoolRow = {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  official_contact_url: string | null;
  display_order: number;
};

export type HelpCategoryRow = {
  id: string;
  school_id: string | null;
  name: string;
  name_en: string | null;
  icon: string;
  display_order: number;
  search_terms: string[] | null;
  internal_url: string | null;
};

export type HelpAnswerRow = {
  id: string;
  school_id: string | null;
  category_id: string | null;
  language_code: string;
  question: string;
  answer: string;
  steps: string[] | null;
  keywords: string[] | null;
  internal_url: string | null;
  official_source_url: string | null;
  verified_at: string | null;
  expires_at: string | null;
  display_order: number;
};

export type HelpSynonymRow = {
  id: string;
  language_code: string;
  primary_term: string;
  related_terms: string[] | null;
};

export type HelpBflRow = {
  id: string;
  school_id: string | null;
  person_name: string;
  public_role: string | null;
  languages: string[] | null;
  phone: string | null;
  email: string | null;
  office: string | null;
  public_hours: string | null;
  official_source_url: string | null;
  verified_at: string | null;
};

/** School ids whose content may be shown for the given selection. */
export function scopeIdsFor(choice: HelpSchoolChoice): string[] {
  if (choice === "lincoln") return ["lincoln"];
  if (choice === "east") return ["east"];
  return ["district"];
}

/** District-wide rows (school_id = null) plus the rows of exactly one school. */
function scopedFilter(query: any, choice: HelpSchoolChoice) {
  const ids = scopeIdsFor(choice);
  return query.or(`school_id.is.null,school_id.in.(${ids.join(",")})`);
}

export async function fetchHelpSchools(): Promise<HelpSchoolRow[]> {
  const { data } = await db("help_schools")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  return (data ?? []) as HelpSchoolRow[];
}

export async function fetchHelpCategories(choice: HelpSchoolChoice): Promise<HelpCategoryRow[]> {
  const { data } = await scopedFilter(
    db("help_categories").select("*").eq("is_active", true),
    choice,
  ).order("display_order", { ascending: true });
  return (data ?? []) as HelpCategoryRow[];
}

export async function fetchHelpAnswers(choice: HelpSchoolChoice): Promise<HelpAnswerRow[]> {
  const { data } = await scopedFilter(
    db("help_answers").select("*").eq("is_active", true).eq("is_approved", true),
    choice,
  ).order("display_order", { ascending: true });
  const now = Date.now();
  return ((data ?? []) as HelpAnswerRow[]).filter(
    (row) => !row.expires_at || new Date(row.expires_at).getTime() > now,
  );
}

export async function fetchHelpSynonyms(): Promise<HelpSynonymRow[]> {
  const { data } = await db("help_synonyms").select("*").eq("is_approved", true);
  return (data ?? []) as HelpSynonymRow[];
}

export async function fetchHelpBflContacts(choice: HelpSchoolChoice): Promise<HelpBflRow[]> {
  if (choice === "unsure") return [];
  const ids = scopeIdsFor(choice);
  const { data } = await db("help_bfl_contacts")
    .select("*")
    .in("school_id", ids)
    .eq("is_verified", true)
    .eq("is_visible", true)
    .order("display_order", { ascending: true });
  return (data ?? []) as HelpBflRow[];
}

export async function fetchHelpSettings(): Promise<Record<string, string>> {
  const { data } = await db("help_settings").select("setting_key,setting_value");
  const out: Record<string, string> = {};
  for (const row of (data ?? []) as { setting_key: string; setting_value: string | null }[]) {
    out[row.setting_key] = row.setting_value ?? "";
  }
  return out;
}

/** Stores only a short, sanitized version of a search that found no answer. */
export async function recordUnansweredSearch(input: {
  schoolId: string | null;
  categoryId: string | null;
  language: string;
  query: string;
}) {
  const sanitized = sanitizeQueryForStorage(input.query);
  if (!sanitized) return;
  await db("help_unanswered_searches")
    .insert({
      school_id: input.schoolId,
      category_id: input.categoryId,
      language_code: input.language,
      sanitized_query: sanitized,
      normalized_query: sanitized.toLowerCase(),
    })
    .then(
      () => undefined,
      () => undefined,
    );
}

/** Saves an anonymous rating. Never stores a name, email or student id. */
export async function saveHelpFeedback(input: {
  schoolId: string | null;
  categoryId: string | null;
  answerId: string | null;
  helpfulRating?: "yes" | "partial" | "no";
  starRating?: number;
  comment?: string;
}) {
  const comment = (input.comment ?? "").trim().slice(0, 500);
  await db("help_feedback")
    .insert({
      school_id: input.schoolId,
      category_id: input.categoryId,
      answer_id: input.answerId,
      helpful_rating: input.helpfulRating ?? null,
      star_rating: input.starRating ?? null,
      sanitized_comment: comment ? comment : null,
    })
    .then(
      () => undefined,
      () => undefined,
    );
}
