/* eslint-disable @typescript-eslint/no-explicit-any */
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { notifyContentUpdated } from "./sync";
import { notifySaveSuccess } from "./storage-engine";
import type { LanguageCode } from "./i18n";
import { filterBySchool } from "./school-scope";
import { getCachedSiteSetting, saveSiteSetting } from "./site-settings-service";

export type MenuSection = "main_header" | "resources_dropdown" | "footer_links";

export interface PublicMenuItem {
  id: string;
  section: MenuSection;
  label_es: string;
  label_en: string;
  label_kar: string;
  desc_es?: string;
  desc_en?: string;
  desc_kar?: string;
  path: string;
  icon: string;
  icon_color?: string;
  display_order: number;
  is_visible: boolean;
  is_external?: boolean;
  school_id?: string | null;
  admin_route?: string;
  badge?: string;
  updated_at?: string;
}

export const MENU_SECTIONS: { id: MenuSection; label: string; description: string }[] = [
  {
    id: "main_header",
    label: "Barra Superior Principal (Header)",
    description:
      "Enlaces visibles en la barra de navegación superior en pantallas de escritorio y menú móvil.",
  },
  {
    id: "resources_dropdown",
    label: "Menú Desplegable de Recursos",
    description:
      "Elementos dentro del menú desplegable 'Recursos' tanto en escritorio como en móvil.",
  },
  {
    id: "footer_links",
    label: "Enlaces del Pie de Página (Footer)",
    description: "Enlaces rápidos listados en el pie de página de todo el sitio público.",
  },
];

export const DEFAULT_PUBLIC_MENU_ITEMS: PublicMenuItem[] = [
  // --- Barra Superior (Main Header) ---
  {
    id: "nav_home",
    section: "main_header",
    label_es: "Inicio",
    label_en: "Home",
    label_kar: "ဟံၣ်",
    path: "/",
    icon: "Home",
    display_order: 10,
    is_visible: true,
    admin_route: "/admin",
  },
  {
    id: "nav_announcements",
    section: "main_header",
    label_es: "Avisos",
    label_en: "Announcements",
    label_kar: "တၢ်ဟ့ၣ်သ့ၣ်ညါ",
    path: "/announcements",
    icon: "Megaphone",
    display_order: 20,
    is_visible: true,
    admin_route: "/admin/anuncios",
  },
  {
    id: "nav_calendar",
    section: "main_header",
    label_es: "Calendario",
    label_en: "Calendar",
    label_kar: "မုၢ်နံၤမုၢ်သီလံာ်",
    path: "/calendario",
    icon: "CalendarDays",
    display_order: 30,
    is_visible: true,
    admin_route: "/admin/calendario",
  },
  {
    id: "nav_events",
    section: "main_header",
    label_es: "Eventos",
    label_en: "Events",
    label_kar: "မုၢ်နံၤမုၢ်သီတၢ်မၤ",
    path: "/eventos",
    icon: "CalendarCheck",
    display_order: 35,
    is_visible: true,
    admin_route: "/admin/eventos",
  },
  {
    id: "nav_resources",
    section: "main_header",
    label_es: "Recursos",
    label_en: "Resources",
    label_kar: "တၢ်မၤစၢၤခိၣ်ဖုး",
    path: "/programas",
    icon: "FolderTree",
    display_order: 40,
    is_visible: true,
    admin_route: "/admin/recursos",
  },
  {
    id: "nav_teams",
    section: "main_header",
    label_es: "Equipos 9º",
    label_en: "9th Grade Teams",
    label_kar: "ကရူၢ် ၉ တီၤ",
    path: "/equipos",
    icon: "Users",
    display_order: 50,
    is_visible: true,
    school_id: "lincoln",
    admin_route: "/admin/articulos",
  },
  {
    id: "nav_articles",
    section: "main_header",
    label_es: "Artículos",
    label_en: "Articles",
    label_kar: "လံာ်တၢ်ကွဲးတဖၣ်",
    path: "/topics",
    icon: "BookOpen",
    display_order: 60,
    is_visible: true,
    admin_route: "/admin/articulos",
  },
  {
    id: "nav_podcasts",
    section: "main_header",
    label_es: "Podcasts",
    label_en: "Podcasts",
    label_kar: "တၢ်ကလုၢ်ရဲၣ်ကျဲၤ",
    path: "/podcasts",
    icon: "Headphones",
    display_order: 65,
    is_visible: true,
    admin_route: "/admin/podcasts",
  },
  {
    id: "nav_contact",
    section: "main_header",
    label_es: "Contacto",
    label_en: "Contact",
    label_kar: "တၢ်ဆဲးကျိး",
    path: "/contact",
    icon: "Phone",
    display_order: 70,
    is_visible: true,
    admin_route: "/admin/contactos",
  },
  {
    id: "nav_social_media",
    section: "main_header",
    label_es: "Redes sociales",
    label_en: "Social Media",
    label_kar: "ဆိၡၢလ္ မံဒံယၢ",
    path: "/redes-sociales",
    icon: "Share2",
    display_order: 75,
    is_visible: true,
    admin_route: "/admin/redes-sociales",
  },
  {
    id: "nav_quienes_somos",
    section: "main_header",
    label_es: "Quiénes somos",
    label_en: "About Us",
    label_kar: "ပဝဲအဂ့ၢ်",
    path: "/quienes-somos",
    icon: "Info",
    display_order: 80,
    is_visible: true,
  },

  // --- Submenú de Recursos (Resources Dropdown) ---
  {
    id: "res_programs",
    section: "resources_dropdown",
    label_es: "Programas Académicos",
    label_en: "Academic Programs",
    label_kar: "တၢ်ကူၣ်ဘၣ်ကူၣ်သ့ တၢ်ရဲၣ်တၢ်ကျဲၤ",
    desc_es: "Programas académicos y del distrito",
    desc_en: "Academic and community programs",
    desc_kar: "တၢ်ကူၣ်ဘၣ်ကူၣ်သ့ ဒီးတၢ်ရဲၣ်တၢ်ကျဲၤတဖၣ်",
    path: "/programas",
    icon: "GraduationCap",
    icon_color: "text-primary bg-primary/10",
    display_order: 10,
    is_visible: true,
    admin_route: "/admin/programas",
  },
  {
    id: "res_events",
    section: "resources_dropdown",
    label_es: "Eventos Escolares",
    label_en: "School Events",
    label_kar: "မုၢ်နံၤမုၢ်သီတၢ်မၤ",
    desc_es: "Talleres, conferencias, actividades y eventos",
    desc_en: "Workshops, conferences, activities and events",
    desc_kar: "တၢ်မၤဒီးတၢ်ရဲၣ်တၢ်ကျဲၤတဖၣ်",
    path: "/eventos",
    icon: "CalendarDays",
    icon_color: "text-primary bg-primary/10",
    display_order: 15,
    is_visible: true,
    admin_route: "/admin/eventos",
  },
  {
    id: "res_sports",
    section: "resources_dropdown",
    label_es: "Deportes y Actividades",
    label_en: "Sports & Activities",
    label_kar: "တၢ်လုၢ်တၢ်စှီၤ ဒီးတၢ်မၤတဖၣ်",
    desc_es: "Atletismo, deportes y clubes estudiantiles",
    desc_en: "Athletics, sports and student clubs",
    desc_kar: "တၢ်လုၢ်တၢ်စှီၤ ဒီးတၢ်ဖိတဖၣ်အတၢ်ကရူၢ်",
    path: "/deportes-actividades",
    icon: "Trophy",
    icon_color: "text-primary bg-primary/10",
    display_order: 20,
    is_visible: true,
    admin_route: "/admin/actividades",
  },
  {
    id: "res_dart",
    section: "resources_dropdown",
    label_es: "App para Familias",
    label_en: "Family Mobile App",
    label_kar: "တၢ်အပလီခ့ၡၢၣ်",
    desc_es: "Artículo, enlace de descarga e información de la app escolar",
    desc_en: "App article, direct download link and features",
    desc_kar: "တၢ်အပလီခ့ၡၢၣ် ဒီးတၢ်ကျဲဆူညါ",
    path: "/transporte/dart",
    icon: "Smartphone",
    icon_color: "text-indigo-600 bg-indigo-500/10",
    display_order: 30,
    is_visible: true,
    admin_route: "/admin/dart/configuracion",
  },
  {
    id: "res_bell",
    section: "resources_dropdown",
    label_es: "Horario de Campanas",
    label_en: "Bell Schedule",
    label_kar: "တၢ်ကိးနၣ်ရံၣ် တၢ်ဆၢကတီၢ်",
    desc_es: "Horarios regulares, días especiales y períodos",
    desc_en: "Regular schedule, late start and periods",
    desc_kar: "တၢ်မၤလိဆၢကတီၢ် ဒီးနၣ်ရံၣ်",
    path: "/horario-campanas",
    icon: "Clock",
    icon_color: "text-primary bg-primary/10",
    display_order: 40,
    is_visible: true,
    school_id: "lincoln",
    admin_route: "/admin/recursos",
  },
  {
    id: "res_volunteers",
    section: "resources_dropdown",
    label_es: "Voluntariado y Silver Cord",
    label_en: "Volunteering & Silver Cord",
    label_kar: "တၢ်မၤစၢၤလၢသး ဒီး Silver Cord",
    desc_es: "Horas de servicio comunitario y oportunidades",
    desc_en: "Community service hours and opportunities",
    desc_kar: "တၢ်မၤစၢၤပှၤဂၤ အတၢ်ဆၢကတီၢ်",
    path: "/voluntarios",
    icon: "HeartHandshake",
    icon_color: "text-rose-600 bg-rose-500/10",
    display_order: 50,
    is_visible: true,
    admin_route: "/admin/recursos",
  },
  {
    id: "res_bfl",
    section: "resources_dropdown",
    label_es: "Estado BFL (Enlaces Familiares)",
    label_en: "BFL Liaison Status",
    label_kar: "BFL ဟံၣ်ဖိဃီဖိ တၢ်ဆဲးကျိး",
    desc_es: "Disponibilidad de enlaces bilingües y contacto directo",
    desc_en: "Bilingual liaison availability and direct contact",
    desc_kar: "တၢ်ကတိၤကျိာ်ခံဘိ ပှၤမၤစၢၤအတၢ်အိၣ်သး",
    path: "/bfl-status",
    icon: "Activity",
    icon_color: "text-blue-600 bg-blue-500/10",
    display_order: 60,
    is_visible: true,
    admin_route: "/admin/contactos",
  },
  {
    id: "res_jobs",
    section: "resources_dropdown",
    label_es: "Bolsa de Empleo y Oportunidades",
    label_en: "Job Board & Opportunities",
    label_kar: "တၢ်မၤအတၢ်ခွဲးတၢ်ယာ်တဖၣ်",
    desc_es: "Vacantes en DMPS y empleos para familias",
    desc_en: "DMPS openings and family career opportunities",
    desc_kar: "DMPS တၢ်မၤတဖၣ် လၢဟံၣ်ဖိဃီဖိအဂီၢ်",
    path: "/empleos",
    icon: "Briefcase",
    icon_color: "text-primary bg-primary/10",
    display_order: 70,
    is_visible: true,
    admin_route: "/admin/empleos",
  },
  {
    id: "res_faq",
    section: "resources_dropdown",
    label_es: "Preguntas Frecuentes",
    label_en: "Frequently Asked Questions",
    label_kar: "တၢ်သံကွၢ်တဖၣ်လၢ ညီနုၢ်သံကွၢ်ဝဲ",
    desc_es: "Respuestas claras a dudas frecuentes de familias",
    desc_en: "Quick answers to common parent questions",
    desc_kar: "တၢ်စံးဆၢတဖၣ်လၢ ဟံၣ်ဖိဃီဖိတၢ်သံကွၢ်အဂီၢ်",
    path: "/faq",
    icon: "HelpCircle",
    icon_color: "text-primary bg-primary/10",
    display_order: 80,
    is_visible: true,
    admin_route: "/admin/faq",
  },
  {
    id: "res_tutorial",
    section: "resources_dropdown",
    label_es: "Guía Interactiva de Inicio",
    label_en: "Interactive App Tutorial",
    label_kar: "တၢ်သိၣ်လိတၢ်သူ App အဂ့ၢ်",
    desc_es: "Recorrido guiado por las funciones del portal",
    desc_en: "Guided walk-through of portal features",
    desc_kar: "တၢ်ဒုးနဲၣ်တၢ်သူ App အကျဲ",
    path: "#tutorial",
    icon: "Compass",
    icon_color: "text-primary bg-primary/10",
    display_order: 90,
    is_visible: true,
    admin_route: "/admin",
  },
  {
    id: "res_quienes_somos",
    section: "resources_dropdown",
    label_es: "Quiénes somos",
    label_en: "About DMPS Info",
    label_kar: "ပဝဲအဂ့ၢ်",
    desc_es: "Propósito, visión e independencia de DMPS Info",
    desc_en: "Mission, vision, and project independence",
    desc_kar: "တၢ်ရဲၣ်တၢ်ကျဲၤ ဒီးတၢ်မၤစၢၤဟံၣ်ဖိဃီဖိ",
    path: "/quienes-somos",
    icon: "Info",
    icon_color: "text-sky-600 bg-sky-500/10",
    display_order: 95,
    is_visible: true,
  },

  // --- Pie de Página (Footer Links) ---
  {
    id: "footer_home",
    section: "footer_links",
    label_es: "Inicio",
    label_en: "Home",
    label_kar: "ဟံၣ်",
    path: "/",
    icon: "Home",
    display_order: 10,
    is_visible: true,
    admin_route: "/admin",
  },
  {
    id: "footer_quienes_somos",
    section: "footer_links",
    label_es: "Quiénes somos",
    label_en: "About Us",
    label_kar: "ပဝဲအဂ့ၢ်",
    path: "/quienes-somos",
    icon: "Info",
    display_order: 15,
    is_visible: true,
  },
  {
    id: "footer_articles",
    section: "footer_links",
    label_es: "Artículos y Temas",
    label_en: "Articles & Topics",
    label_kar: "လံာ်တၢ်ကွဲး ဒီးတၢ်ဂ့ၢ်တဖၣ်",
    path: "/topics",
    icon: "BookOpen",
    display_order: 20,
    is_visible: true,
    admin_route: "/admin/articulos",
  },
  {
    id: "footer_calendar",
    section: "footer_links",
    label_es: "Calendario Escolar",
    label_en: "School Calendar",
    label_kar: "မုၢ်နံၤမုၢ်သီလံာ်",
    path: "/calendario",
    icon: "CalendarDays",
    display_order: 30,
    is_visible: true,
    admin_route: "/admin/calendario",
  },
  {
    id: "footer_programs",
    section: "footer_links",
    label_es: "Programas",
    label_en: "Programs",
    label_kar: "တၢ်ရဲၣ်တၢ်ကျဲၤတဖၣ်",
    path: "/programas",
    icon: "GraduationCap",
    display_order: 40,
    is_visible: true,
    admin_route: "/admin/programas",
  },
  {
    id: "footer_sports",
    section: "footer_links",
    label_es: "Deportes y Actividades",
    label_en: "Sports & Activities",
    label_kar: "တၢ်လုၢ်တၢ်စှီၤတဖၣ်",
    path: "/deportes-actividades",
    icon: "Trophy",
    display_order: 50,
    is_visible: true,
    admin_route: "/admin/actividades",
  },
  {
    id: "footer_apps",
    section: "footer_links",
    label_es: "Aplicaciones Escolares",
    label_en: "School Apps",
    label_kar: "ကၠိ App တဖၣ်",
    path: "/apps",
    icon: "Smartphone",
    display_order: 60,
    is_visible: true,
    admin_route: "/admin/recursos",
  },
  {
    id: "footer_bell",
    section: "footer_links",
    label_es: "Horario de Campanas",
    label_en: "Bell Schedule",
    label_kar: "တၢ်ကိးနၣ်ရံၣ် တၢ်ဆၢကတီၢ်",
    path: "/horario-campanas",
    icon: "Clock",
    display_order: 70,
    is_visible: true,
    school_id: "lincoln",
    admin_route: "/admin/recursos",
  },
  {
    id: "footer_dart",
    section: "footer_links",
    label_es: "App Escolar",
    label_en: "School App",
    label_kar: "တၢ်အပလီခ့ၡၢၣ်",
    path: "/transporte/dart",
    icon: "Smartphone",
    display_order: 80,
    is_visible: true,
    admin_route: "/admin/dart/configuracion",
  },
  {
    id: "footer_announcements",
    section: "footer_links",
    label_es: "Avisos Oficiales",
    label_en: "Official Announcements",
    label_kar: "ပဒိၣ်တၢ်ဟ့ၣ်သ့ၣ်ညါ",
    path: "/announcements",
    icon: "Megaphone",
    display_order: 90,
    is_visible: true,
    admin_route: "/admin/anuncios",
  },
  {
    id: "footer_faq",
    section: "footer_links",
    label_es: "Preguntas Frecuentes",
    label_en: "FAQ",
    label_kar: "တၢ်သံကွၢ်တဖၣ်",
    path: "/faq",
    icon: "HelpCircle",
    display_order: 100,
    is_visible: true,
    admin_route: "/admin/articulos",
  },
  {
    id: "footer_volunteers",
    section: "footer_links",
    label_es: "Voluntariado",
    label_en: "Volunteering",
    label_kar: "တၢ်မၤစၢၤလၢသး",
    path: "/voluntarios",
    icon: "HeartHandshake",
    display_order: 110,
    is_visible: true,
    admin_route: "/admin/recursos",
  },
  {
    id: "footer_social_media",
    section: "footer_links",
    label_es: "Redes Sociales",
    label_en: "Social Media",
    label_kar: "ဆိၡၢလ္ မံဒံယၢ",
    path: "/redes-sociales",
    icon: "Share2",
    display_order: 115,
    is_visible: true,
    admin_route: "/admin/redes-sociales",
  },
  {
    id: "footer_bfl",
    section: "footer_links",
    label_es: "Estado BFL",
    label_en: "BFL Liaison Status",
    label_kar: "BFL တၢ်အိၣ်သး",
    path: "/bfl-status",
    icon: "Activity",
    display_order: 120,
    is_visible: true,
    admin_route: "/admin/contactos",
  },
  {
    id: "footer_contact",
    section: "footer_links",
    label_es: "Directorio y Contacto",
    label_en: "Directory & Contact",
    label_kar: "တၢ်ဆဲးကျိး",
    path: "/contact",
    icon: "Phone",
    display_order: 130,
    is_visible: true,
    admin_route: "/admin/contactos",
  },
  {
    id: "footer_tutorial",
    section: "footer_links",
    label_es: "Guía de Inicio (Tutorial)",
    label_en: "App Guide (Tutorial)",
    label_kar: "တၢ်သိၣ်လိ App",
    path: "#tutorial",
    icon: "Compass",
    display_order: 140,
    is_visible: true,
    admin_route: "/admin",
  },
  {
    id: "footer_accessibility",
    section: "footer_links",
    label_es: "Accesibilidad",
    label_en: "Accessibility",
    label_kar: "တၢ်သူလၢပှၤကိးဂၤဒဲးအဂီၢ်",
    path: "/accessibility",
    icon: "ShieldCheck",
    display_order: 150,
    is_visible: true,
    admin_route: "/admin/apariencia",
  },
  {
    id: "footer_staff",
    section: "footer_links",
    label_es: "Acceso del Personal",
    label_en: "Staff Portal",
    label_kar: "ပှၤမၤတၢ်ဖိ အတၢ်နုာ်လီၤ",
    path: "/admin/login",
    icon: "Users",
    display_order: 160,
    is_visible: true,
    admin_route: "/admin/login",
  },
];

export const NAVIGATION_CACHE_KEY = "public_navigation_menu";

/**
 * Merges cached or stored menu items with standard defaults so any new item or field
 * is consistently present without losing user edits.
 */
export function mergeWithDefaults(
  savedRows: PublicMenuItem[] | null | undefined,
): PublicMenuItem[] {
  if (!savedRows || !Array.isArray(savedRows) || savedRows.length === 0) {
    return [...DEFAULT_PUBLIC_MENU_ITEMS];
  }

  const map = new Map<string, PublicMenuItem>();

  // First, insert defaults
  for (const def of DEFAULT_PUBLIC_MENU_ITEMS) {
    map.set(def.id, { ...def });
  }

  // Then override with saved modifications or custom added items
  for (const row of savedRows) {
    if (!row || !row.id) continue;
    const existing = map.get(row.id);
    if (existing) {
      map.set(row.id, {
        ...existing,
        ...row,
        // Ensure booleans and required strings are properly preserved
        is_visible: row.is_visible !== undefined ? Boolean(row.is_visible) : existing.is_visible,
        display_order:
          typeof row.display_order === "number" ? row.display_order : existing.display_order,
      });
    } else {
      map.set(row.id, row);
    }
  }

  return Array.from(map.values()).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

/**
 * Reads the public menu items from defaults.
 */
export function getCachedPublicMenuItems(): PublicMenuItem[] {
  return [...DEFAULT_PUBLIC_MENU_ITEMS];
}

/**
 * Fetches public menu items directly from Supabase site_settings, falling back to defaults.
 */
export async function fetchPublicMenuItems(schoolId?: string): Promise<PublicMenuItem[]> {
  try {
    const raw = await getCachedSiteSetting<PublicMenuItem[]>(
      "navigation_menu",
      DEFAULT_PUBLIC_MENU_ITEMS,
    );
    if (raw && Array.isArray(raw)) {
      const merged = mergeWithDefaults(raw);
      return filterBySchool(merged, schoolId);
    }
  } catch (err) {
    console.warn("fetchPublicMenuItems error:", err);
  }

  return filterBySchool(DEFAULT_PUBLIC_MENU_ITEMS, schoolId);
}

/**
 * Saves a single menu item and updates Supabase.
 */
export async function savePublicMenuItem(item: PublicMenuItem): Promise<PublicMenuItem[]> {
  const all = await fetchPublicMenuItems();
  const index = all.findIndex((i) => i.id === item.id);
  const updatedItem: PublicMenuItem = {
    ...item,
    updated_at: new Date().toISOString(),
  };

  let updatedList: PublicMenuItem[];
  if (index >= 0) {
    updatedList = [...all];
    updatedList[index] = updatedItem;
  } else {
    updatedList = [...all, updatedItem];
  }

  return saveAllPublicMenuItems(updatedList);
}

/**
 * Saves all menu items directly to Supabase site_settings.
 */
export async function saveAllPublicMenuItems(items: PublicMenuItem[]): Promise<PublicMenuItem[]> {
  const sorted = [...items].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  await saveSiteSetting("navigation_menu", sorted);

  notifyContentUpdated("site_settings");
  notifyContentUpdated("public_menu_items");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("dmps_navigation_updated", { detail: { items: sorted } }));
  }

  notifySaveSuccess("✓ Menú guardado y confirmado en Supabase.");
  return sorted;
}

/**
 * Restores menu items to the official default system list.
 */
export async function resetPublicMenuItemsToDefault(): Promise<PublicMenuItem[]> {
  return saveAllPublicMenuItems([...DEFAULT_PUBLIC_MENU_ITEMS]);
}

/**
 * Localizes a menu item for the current language.
 */
export function localizedMenuItem(
  item: PublicMenuItem,
  lang: LanguageCode,
): { label: string; desc?: string } {
  let label = item.label_es || "";
  let desc = item.desc_es;

  if (lang === "en") {
    label = item.label_en || item.label_es || "";
    desc = item.desc_en || item.desc_es;
  } else if (lang === "kar") {
    label = item.label_kar || item.label_es || item.label_en || "";
    desc = item.desc_kar || item.desc_es || item.desc_en;
  }

  return {
    label: label.trim() || item.label_es || "Enlace",
    desc: desc?.trim(),
  };
}
