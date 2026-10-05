import { supabase } from "@/integrations/supabase/client";
import { normalizeSchoolId, type CanonicalSchoolId } from "@/lib/school-scope";

export interface StudentProgramRow {
  id: string;
  school_id: string | null;
  name: string;
  description_es: string;
  audience: string | null;
  categories: string | null;
  cost: string | null;
  enrollment_status: string | null;
  enrollment_note: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  official_url: string | null;
  how_to_participate: string | null;
  extra_links: string | null;
  requirements: string | null;
  verified_at: string | null;
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
}

export interface ProgramLink {
  label: string;
  url: string;
}

export const PROGRAM_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "universidad", label: "Universidad y carreras" },
  { value: "empleo", label: "Empleo y pasantías" },
  { value: "tecnologia", label: "Tecnología" },
  { value: "arte", label: "Arte y creatividad" },
  { value: "liderazgo", label: "Liderazgo" },
  { value: "voluntariado", label: "Voluntariado" },
  { value: "transporte", label: "Transporte" },
  { value: "gratis", label: "Programas gratuitos" },
  { value: "abierta", label: "Solicitud abierta" },
] as const;

export type ProgramFilter = (typeof PROGRAM_FILTERS)[number]["value"];

export const CATEGORY_LABELS: Record<string, string> = {
  universidad: "Universidad y carreras",
  empleo: "Empleo y pasantías",
  tecnologia: "Tecnología",
  arte: "Arte y creatividad",
  liderazgo: "Liderazgo",
  voluntariado: "Voluntariado",
  transporte: "Transporte",
  gratis: "Gratuito",
};

export function programCategories(row: StudentProgramRow): string[] {
  return (row.categories ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

export function programLines(value: string | null | undefined): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function programLinks(row: StudentProgramRow): ProgramLink[] {
  return programLines(row.extra_links)
    .map((line) => {
      const [label, url] = line.split("|").map((p) => p.trim());
      return label && url ? { label, url } : null;
    })
    .filter((l): l is ProgramLink => l !== null);
}

export function matchesFilter(row: StudentProgramRow, filter: ProgramFilter): boolean {
  if (filter === "all") return true;
  if (filter === "abierta") return row.enrollment_status === "open";
  return programCategories(row).includes(filter);
}

type EnglishFields = {
  name_en?: string | null;
  description_en?: string | null;
  how_to_participate_en?: string | null;
  requirements_en?: string | null;
  cost_en?: string | null;
  audience_en?: string | null;
};

/** Swaps in the English wording when the family is not reading in Spanish. */
export function localizeStudentProgram(
  row: StudentProgramRow & EnglishFields,
  lang: string,
): StudentProgramRow {
  if (lang === "es") return row;
  return {
    ...row,
    name: row.name_en || row.name,
    description_es: row.description_en || row.description_es,
    how_to_participate: row.how_to_participate_en ?? row.how_to_participate,
    requirements: row.requirements_en ?? row.requirements,
    cost: row.cost_en ?? row.cost,
    audience: row.audience_en ?? row.audience,
  };
}

export async function fetchStudentPrograms(
  school: CanonicalSchoolId,
  lang: string = "es",
): Promise<StudentProgramRow[]> {
  const { data, error } = await supabase
    .from("student_programs")
    .select("*")
    .eq("is_visible", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as (StudentProgramRow & EnglishFields)[])
    .filter((row) => normalizeSchoolId(row.school_id) === school)
    .map((row) => localizeStudentProgram(row, lang));
}
