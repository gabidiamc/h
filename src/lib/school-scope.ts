/**
 * Central helpers for scoping content by school.
 * Enforces school isolation while allowing district-wide content and full admin visibility.
 */

export type CanonicalSchoolId = string;

const knownSchoolIdMap = new Map<string, string>();

/**
 * Registers dynamic schools loaded from Supabase so their database IDs, slugs,
 * and short names map cleanly to their canonical school ID.
 */
export function registerKnownSchools(
  schools: Array<{
    id?: string | null;
    dbId?: string | null;
    slug?: string | null;
    name?: string | null;
    short_name?: string | null;
  }>,
) {
  for (const s of schools) {
    const canonical = String(s.id || s.slug || "")
      .trim()
      .toLowerCase();
    if (!canonical) continue;
    knownSchoolIdMap.set(canonical, canonical);
    if (s.dbId) knownSchoolIdMap.set(String(s.dbId).trim().toLowerCase(), canonical);
    if (s.slug) knownSchoolIdMap.set(String(s.slug).trim().toLowerCase(), canonical);
    if (s.short_name) knownSchoolIdMap.set(String(s.short_name).trim().toLowerCase(), canonical);
    if (s.name) knownSchoolIdMap.set(String(s.name).trim().toLowerCase(), canonical);
  }
}

/** Normalizes any string or object value into a canonical school id string. */
export function normalizeSchoolId(value: unknown): string {
  if (value === null || value === undefined) return "all";
  const raw = String(value).trim().toLowerCase();
  if (
    !raw ||
    raw === "all" ||
    raw === "district" ||
    raw === "todas" ||
    raw === "global" ||
    raw === "*" ||
    raw === "sch-all"
  ) {
    return "all";
  }

  const registered = knownSchoolIdMap.get(raw);
  if (registered) return registered;

  if (
    raw === "lincoln" ||
    raw === "sch-lincoln" ||
    raw === "school-lincoln" ||
    raw === "dmlincoln" ||
    raw === "lincoln-high-school" ||
    raw.includes("railsplitter") ||
    raw.includes("lincoln")
  ) {
    return "lincoln";
  }
  if (
    raw === "east" ||
    raw === "sch-east" ||
    raw === "school-east" ||
    raw === "dmeast" ||
    raw === "east-high-school" ||
    raw.includes("scarlet") ||
    raw.includes("east")
  ) {
    return "east";
  }

  // Preserve custom schools created in Gestión de Escuelas
  return (
    raw
      .replace(/^(sch-|school-)/, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "") || "all"
  );
}

/** Reads the school a record belongs to, falling back to "all" if not specified. */
export function rowSchoolId(row: Record<string, unknown> | null | undefined): string {
  if (!row) return "all";
  const explicit = row["school_id"] ?? row["school"] ?? row["school_key"];
  if (explicit !== undefined && explicit !== null && String(explicit).trim().length > 0) {
    return normalizeSchoolId(explicit);
  }
  return "all";
}

/**
 * Checks if a record belongs to a specific school view.
 * When viewing "all", returns true for all records.
 * When viewing a specific school, returns true if the record belongs to that school OR is district-wide ("all").
 */
export function belongsToSchool(
  row: Record<string, unknown> | null | undefined,
  schoolId: string | null | undefined,
): boolean {
  if (!row) return false;
  const target = normalizeSchoolId(schoolId);
  if (target === "all") return true;
  const owner = rowSchoolId(row);
  return owner === target || owner === "all" || owner === "district" || owner === "global";
}

/** Filters a list of records down strictly to those visible for the given school. */
export function filterBySchool<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  schoolId: string | null | undefined,
): T[] {
  const list = rows ?? [];
  const target = normalizeSchoolId(schoolId);
  if (target === "all") return list;
  return list.filter((row) => belongsToSchool(row, target));
}

/** Value to persist on a record for a given admin scope. */
export function schoolIdForStorage(scope: string | null | undefined): string {
  const normalized = normalizeSchoolId(scope);
  return normalized === "all" ? "all" : normalized;
}

/** Strict scoping for content types. */
export function filterBySchoolStrict<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  schoolId: string | null | undefined,
): T[] {
  return filterBySchool(rows, schoolId);
}
