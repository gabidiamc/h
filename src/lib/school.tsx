/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { normalizeSchoolId, registerKnownSchools } from "./school-scope";
import { trackSchoolSelect } from "@/analytics";

export type SchoolId = "lincoln" | string;
export type SchoolScope = "lincoln" | string;

export interface School {
  id: string;
  dbId?: string;
  slug: string;
  name: string;
  short_name: string;
  shortName: string;
  district_name: string;
  city: string;
  state: string;
  official_website_url: string;
  officialUrl: string;
  is_active: boolean;
  motto?: string;
  mascot?: string;
  colors?: {
    primary: string;
    badgeBg: string;
    border: string;
    accent: string;
    gradient: string;
  };
  address?: string;
  cityStateZip?: string;
  phone?: string;
  bflPhone?: string;
  bflEmail?: string;
  bflName?: string;
  principal?: string;
  grades?: string;
  boundUrl?: string;
  boundCode?: string;
  description_es?: string;
  description_en?: string;
  silverCordName?: string;
  closetName?: string;
}

export const LINCOLN_SCHOOL: School = {
  id: "lincoln",
  slug: "lincoln-high-school",
  name: "Abraham Lincoln High School",
  short_name: "Lincoln",
  shortName: "Lincoln",
  district_name: "Des Moines Public Schools",
  city: "Des Moines",
  state: "Iowa",
  official_website_url: "https://lincoln.dmschools.org/",
  officialUrl: "https://lincoln.dmschools.org/",
  is_active: true,
  motto: "Home of the Railsplitters",
  mascot: "Railsplitters",
  colors: {
    primary: "#1e3a8a",
    badgeBg:
      "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800",
    border: "border-blue-500",
    accent: "bg-blue-600 text-white hover:bg-blue-700",
    gradient: "from-blue-900 via-indigo-900 to-slate-900",
  },
  address: "2600 SW 9th St",
  cityStateZip: "Des Moines, IA 50315",
  phone: "(515) 242-7500",
  bflPhone: "(515) 242-7300",
  bflEmail: "lincoln.bfl.espanol@dmschools.org",
  bflName: "Enlace BFL Lincoln (Español)",
  principal: "Paul Williamson",
  grades: "9º - 12º Grado",
  boundUrl: "https://www.gobound.com/ia/schools/dmlincoln",
  boundCode: "dmlincoln",
  description_es:
    "Sirviendo al sur de Des Moines con programas académicos de excelencia, cursos AP, deportes universitarios y soporte bilingüe BFL.",
  description_en:
    "Serving South Des Moines with comprehensive academic excellence, AP courses, athletics, and BFL bilingual support.",
  silverCordName: "Silver Cord — Voluntariado Lincoln",
  closetName: "Rails Closet",
};

export const EAST_SCHOOL: School = {
  id: "east",
  slug: "east-high-school",
  name: "Des Moines East High School",
  short_name: "East",
  shortName: "East",
  district_name: "Des Moines Public Schools",
  city: "Des Moines",
  state: "Iowa",
  official_website_url: "https://east.dmschools.org/",
  officialUrl: "https://east.dmschools.org/",
  is_active: true,
  motto: "For the Service of Humanity",
  mascot: "Scarlets",
  colors: {
    primary: "#881337",
    badgeBg:
      "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800",
    border: "border-rose-500",
    accent: "bg-rose-600 text-white hover:bg-rose-700",
    gradient: "from-rose-900 via-red-950 to-slate-900",
  },
  address: "815 E 13th St",
  cityStateZip: "Des Moines, IA 50316",
  phone: "(515) 242-7788",
  bflPhone: "(515) 242-7790",
  bflEmail: "east.bfl@dmschools.org",
  bflName: "Enlace BFL East (Español)",
  principal: "Jill Versteeg",
  grades: "9º - 12º Grado",
  boundUrl: "https://www.gobound.com/ia/schools/dmeast",
  boundCode: "dmeast",
  description_es:
    "Sirviendo al este de Des Moines con excelencia académica, deportes y programas bilingües.",
  description_en:
    "Serving East Des Moines with academic excellence, athletics, and bilingual programs.",
  silverCordName: "Silver Cord — Voluntariado East",
  closetName: "Scarlet Closet",
};

export const ALL_DEFINED_SCHOOLS: School[] = [LINCOLN_SCHOOL, EAST_SCHOOL];

function slugifySchoolKey(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^(sch-|school-)/, "")
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "") || "lincoln"
  );
}

function mapSupabaseSchoolRow(c: Record<string, any>): School {
  const nameLower = String(c.name || "")
    .trim()
    .toLowerCase();
  const shortLower = String(c.short_name || c.shortName || "")
    .trim()
    .toLowerCase();
  const slugLower = String(c.slug || "")
    .trim()
    .toLowerCase();

  let canonicalId: string;
  if (
    nameLower.includes("lincoln") ||
    shortLower === "lincoln" ||
    (slugLower === "lincoln" && !nameLower && !shortLower)
  ) {
    canonicalId = "lincoln";
  } else if (
    nameLower.includes("east") ||
    shortLower === "east" ||
    slugLower === "east" ||
    slugLower.includes("east")
  ) {
    canonicalId = "east";
  } else {
    const rawCandidate =
      slugLower && slugLower !== "lincoln"
        ? slugLower
        : shortLower && shortLower !== "lincoln"
          ? shortLower
          : nameLower || String(c.id || "school");
    canonicalId = slugifySchoolKey(rawCandidate);
  }

  const trs = Array.isArray(c.school_translations) ? c.school_translations : [];
  const esTr = trs.find((t: any) => t.language_code === "es");
  const enTr = trs.find((t: any) => t.language_code === "en");

  if (canonicalId === "lincoln") {
    const webUrl = String(
      c.official_website_url || c.website_url || LINCOLN_SCHOOL.official_website_url,
    );
    return {
      ...LINCOLN_SCHOOL,
      id: "lincoln",
      dbId: String(c.id || "lincoln"),
      slug: String(c.slug || LINCOLN_SCHOOL.slug).toLowerCase(),
      name: String(c.name || esTr?.name || LINCOLN_SCHOOL.name),
      short_name: String(c.short_name || c.shortName || LINCOLN_SCHOOL.short_name),
      shortName: String(c.short_name || c.shortName || LINCOLN_SCHOOL.shortName),
      district_name: String(c.district_name || LINCOLN_SCHOOL.district_name),
      city: String(c.city || LINCOLN_SCHOOL.city),
      state: String(c.state || LINCOLN_SCHOOL.state),
      official_website_url: webUrl,
      officialUrl: webUrl,
      is_active: c.is_active !== false && c.is_visible !== false,
      address: String(c.address || LINCOLN_SCHOOL.address),
      phone: String(c.phone || LINCOLN_SCHOOL.phone),
      description_es: String(esTr?.description || c.description || LINCOLN_SCHOOL.description_es),
      description_en: String(enTr?.description || c.description || LINCOLN_SCHOOL.description_en),
    };
  }

  if (canonicalId === "east") {
    const rawWeb = String(c.official_website_url || c.website_url || "");
    const webUrl =
      !rawWeb || rawWeb.includes("lincoln.dmschools.org")
        ? EAST_SCHOOL.official_website_url
        : rawWeb;
    return {
      ...EAST_SCHOOL,
      id: "east",
      dbId: String(c.id || "east"),
      slug: String(c.slug || EAST_SCHOOL.slug).toLowerCase(),
      name: String(c.name || esTr?.name || EAST_SCHOOL.name),
      short_name: String(c.short_name || c.shortName || EAST_SCHOOL.short_name),
      shortName: String(c.short_name || c.shortName || EAST_SCHOOL.shortName),
      district_name: String(c.district_name || EAST_SCHOOL.district_name),
      city: String(c.city || EAST_SCHOOL.city),
      state: String(c.state || EAST_SCHOOL.state),
      official_website_url: webUrl,
      officialUrl: webUrl,
      is_active: c.is_active !== false && c.is_visible !== false,
      address: String(c.address || EAST_SCHOOL.address),
      phone: String(c.phone || EAST_SCHOOL.phone),
      description_es: String(esTr?.description || c.description || EAST_SCHOOL.description_es),
      description_en: String(enTr?.description || c.description || EAST_SCHOOL.description_en),
    };
  }

  // Custom / new school added via Gestión de Escuelas
  const displayName = String(c.name || esTr?.name || c.short_name || canonicalId);
  const shortName = String(
    c.short_name || c.shortName || displayName.replace(/\s+High\s+School$/i, ""),
  );
  const rawWeb = String(c.official_website_url || c.website_url || "");
  const webUrl =
    !rawWeb || rawWeb === "https://lincoln.dmschools.org/" ? "https://www.dmschools.org/" : rawWeb;
  const city = String(c.city || "Des Moines");
  const state = String(c.state || "Iowa");
  const district = String(c.district_name || "Des Moines Public Schools");
  const defaultDescEs = `${displayName} — ${district} (${city}, ${state}). Información, recursos y servicios escolares para familias y estudiantes.`;
  const defaultDescEn = `${displayName} — ${district} (${city}, ${state}). School information, resources, and services for families and students.`;

  return {
    id: canonicalId,
    dbId: String(c.id || canonicalId),
    slug: canonicalId,
    name: displayName,
    short_name: shortName,
    shortName: shortName,
    district_name: district,
    city,
    state,
    official_website_url: webUrl,
    officialUrl: webUrl,
    is_active: c.is_active !== false && c.is_visible !== false,
    motto: String(c.motto || district),
    mascot: String(c.mascot || shortName || "DMPS"),
    colors: {
      primary: "#0f766e",
      badgeBg:
        "bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/80 dark:text-teal-200 dark:border-teal-800",
      border: "border-teal-500",
      accent: "bg-teal-600 text-white hover:bg-teal-700",
      gradient: "from-teal-900 via-emerald-950 to-slate-900",
    },
    address: String(c.address || `${city}, ${state}`),
    cityStateZip: String(
      c.cityStateZip || `${city}, ${state}${c.postal_code ? ` ${c.postal_code}` : ""}`,
    ),
    phone: String(c.phone || "(515) 242-7846"),
    bflPhone: String(c.bflPhone || c.phone || "(515) 242-7846"),
    bflName: String(c.bflName || `Enlace BFL ${shortName}`),
    principal: String(c.principal || "Dirección Escolar"),
    grades: String(c.grades || c.level || "9º - 12º Grado"),
    description_es: String(esTr?.description || c.description || defaultDescEs),
    description_en: String(enTr?.description || c.description || defaultDescEn),
    silverCordName: `Silver Cord — Voluntariado ${shortName}`,
    closetName: ` Apoyo Estudiantil ${shortName}`,
  };
}

export function getSchoolById(id: string | null | undefined, customList?: School[]): School {
  const list = customList && customList.length > 0 ? customList : ALL_DEFINED_SCHOOLS;
  if (!id) return list[0] || LINCOLN_SCHOOL;

  const cleanId = String(id).toLowerCase().trim();
  const canonical = normalizeSchoolId(id);

  // First check the active list (which includes database overrides and newly created schools)
  const exactMatch = list.find(
    (s) =>
      s.id.toLowerCase() === cleanId ||
      s.id.toLowerCase() === canonical ||
      (s.dbId && s.dbId.toLowerCase() === cleanId) ||
      s.slug.toLowerCase() === cleanId ||
      s.short_name.toLowerCase() === cleanId,
  );
  if (exactMatch) return exactMatch;

  const partialMatch = list.find(
    (s) =>
      cleanId.includes(s.id.toLowerCase()) ||
      s.name.toLowerCase() === cleanId ||
      s.name.toLowerCase().includes(cleanId),
  );
  if (partialMatch) return partialMatch;

  if (canonical === "east") return EAST_SCHOOL;
  if (canonical === "lincoln") return LINCOLN_SCHOOL;
  return list[0] || LINCOLN_SCHOOL;
}

const STORAGE_KEY = "dmps_selected_school";
const STORAGE_KEY_V2 = "dmps_selected_school_v2";
const ADMIN_STORAGE_KEY = "dmps_admin_school_filter";

interface SchoolContextType {
  selectedSchoolId: string;
  selectedSchool: School;
  schools: School[];
  isSchoolSelected: boolean;
  isModalOpen: boolean;
  setSelectedSchool: (id: string) => void;
  openSchoolModal: () => void;
  closeSchoolModal: () => void;
  adminSchoolFilter: string;
  setAdminSchoolFilter: (scope: string) => void;
  reloadSchools: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [schools, setSchools] = useState<School[]>(ALL_DEFINED_SCHOOLS);
  const [selectedSchoolId, setSelectedSchoolIdState] = useState<string>("lincoln");
  const [isSchoolSelected, setIsSchoolSelected] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [adminSchoolFilter, setAdminSchoolFilterState] = useState<string>("all");

  const loadSchoolsList = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const [schRes, trRes] = await Promise.all([
          supabase.from("schools").select("*").order("display_order", { ascending: true }),
          supabase
            .from("school_translations")
            .select("school_id, language_code, name, description"),
        ]);
        const data = schRes.data;
        const error = schRes.error;
        const allTrs = Array.isArray(trRes.data) ? trRes.data : [];

        if (!error && Array.isArray(data) && data.length > 0) {
          const enrichedData = data.map((row: any) => ({
            ...row,
            school_translations: allTrs.filter((t: any) => String(t.school_id) === String(row.id)),
          }));
          const activeRows = enrichedData.filter(
            (c: any) => c.is_active !== false && c.is_visible !== false,
          );
          const rowsToMap = activeRows.length > 0 ? activeRows : enrichedData;
          const mapped: School[] = [];
          const seenIds = new Set<string>();

          for (const rawRow of rowsToMap) {
            const schoolObj = mapSupabaseSchoolRow(rawRow);
            // If duplicate slug exists in DB, disambiguate using short_name or dbId suffix
            if (seenIds.has(schoolObj.id)) {
              const altKey = slugifySchoolKey(
                `${schoolObj.short_name || schoolObj.name}-${String(rawRow.id || "").slice(-4)}`,
              );
              schoolObj.id = altKey;
              schoolObj.slug = altKey;
            }
            seenIds.add(schoolObj.id);
            mapped.push(schoolObj);
          }

          registerKnownSchools(mapped);
          setSchools(mapped);
          return;
        }
      } catch {
        // ignore
      }
    }
    registerKnownSchools(ALL_DEFINED_SCHOOLS);
    setSchools(ALL_DEFINED_SCHOOLS);
  }, []);

  useEffect(() => {
    void loadSchoolsList();

    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY_V2);
      if (stored) {
        const canonical = normalizeSchoolId(stored);
        setSelectedSchoolIdState(canonical === "all" ? "lincoln" : canonical);
        setIsSchoolSelected(true);
      } else {
        setSelectedSchoolIdState("lincoln");
        setIsSchoolSelected(true);
      }

      const storedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (storedAdmin) {
        const canonicalAdmin = storedAdmin === "all" ? "all" : normalizeSchoolId(storedAdmin);
        setAdminSchoolFilterState(canonicalAdmin || "all");
      } else {
        setAdminSchoolFilterState("all");
      }
    } catch {
      // ignore
    }

    const handleContentUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail || !detail.table || detail.table === "schools" || detail.table === "all") {
        void loadSchoolsList();
      }
    };

    window.addEventListener("dmps_content_updated", handleContentUpdated);
    return () => {
      window.removeEventListener("dmps_content_updated", handleContentUpdated);
    };
  }, [loadSchoolsList]);

  const setSelectedSchool = (id: string) => {
    const prevSchool = selectedSchoolId;
    const matched = getSchoolById(id, schools);
    const resolvedId = matched ? matched.id : normalizeSchoolId(id);
    const safeSchool = resolvedId === "all" ? schools[0]?.id || "lincoln" : resolvedId;
    setSelectedSchoolIdState(safeSchool);
    setIsSchoolSelected(true);
    setIsModalOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, safeSchool);
      localStorage.setItem(STORAGE_KEY_V2, safeSchool);
      window.dispatchEvent(new CustomEvent("dmps_school_changed", { detail: safeSchool }));
    } catch {
      // ignore
    }
    if (safeSchool !== prevSchool) {
      trackSchoolSelect(safeSchool, prevSchool);
    }
  };

  const openSchoolModal = () => setIsModalOpen(true);
  const closeSchoolModal = () => {
    setIsModalOpen(false);
  };

  const setAdminSchoolFilter = (scope: string) => {
    const normalizedScope =
      !scope || scope === "all"
        ? "all"
        : getSchoolById(scope, schools)?.id || normalizeSchoolId(scope);
    setAdminSchoolFilterState(normalizedScope);
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, normalizedScope);
      window.dispatchEvent(
        new CustomEvent("dmps_admin_school_filter_changed", { detail: normalizedScope }),
      );
    } catch {
      // ignore
    }
  };

  const selectedSchool = getSchoolById(selectedSchoolId, schools);

  return (
    <SchoolContext.Provider
      value={{
        selectedSchoolId: selectedSchool.id,
        selectedSchool,
        schools,
        isSchoolSelected,
        isModalOpen,
        setSelectedSchool,
        openSchoolModal,
        closeSchoolModal,
        adminSchoolFilter,
        setAdminSchoolFilter,
        reloadSchools: loadSchoolsList,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error("useSchool must be used within a SchoolProvider");
  }
  return context;
}

/**
 * Helper to check if an item tagged with a school property matches the currently selected school.
 */
export function isItemForSchool(
  itemSchool: string | null | undefined,
  currentSchool: string,
): boolean {
  if (!itemSchool) return true;
  return itemSchool.toLowerCase() === currentSchool.toLowerCase();
}
