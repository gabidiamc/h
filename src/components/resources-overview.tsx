/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ExternalLink,
  Globe,
  Smartphone,
  Bus,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { filterBySchool } from "@/lib/school-scope";
import { autoTranslateText } from "@/lib/auto-translator";
import { trackResourceClick } from "@/analytics";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

export interface ResourceLink {
  id: string;
  label: { es: string; en: string };
  url: string;
  type: "web" | "ios" | "android" | "external";
  badge?: { es: string; en: string };
}

export interface ResourceItem {
  id: string;
  title: { es: string; en: string };
  category: { es: string; en: string };
  description: { es: string; en: string };
  badge: { es: string; en: string };
  icon: "campus-parent" | "campus-student" | "parentsquare" | "mydart";
  links: ResourceLink[];
}

export const OFFICIAL_RESOURCES: ResourceItem[] = [
  {
    id: "infinite-campus-parent",
    title: {
      es: "Infinite Campus Parent",
      en: "Infinite Campus Parent",
    },
    category: {
      es: "Padres y Tutores",
      en: "Parents & Guardians",
    },
    description: {
      es: "Portal y app oficial para monitorear calificaciones en tiempo real, asistencia diaria, boletas de notas y saldos de alimentos de DMPS.",
      en: "Official portal & app for parents to track real-time grades, daily attendance, official report cards, and meal accounts.",
    },
    badge: {
      es: "Portal Familiar DMPS",
      en: "DMPS Family Portal",
    },
    icon: "campus-parent",
    links: [
      {
        id: "ic-parent-web",
        label: {
          es: "Portal Web en Computadora",
          en: "Computer Web Portal",
        },
        url: "https://desmoinesia.infinitecampus.org/campus/portal/parents/desmoines.jsp",
        type: "web",
        badge: { es: "Navegador Web", en: "Web Browser" },
      },
      {
        id: "ic-parent-ios",
        label: {
          es: "App Store (iPhone / iPad)",
          en: "App Store (iPhone / iPad)",
        },
        url: "https://apps.apple.com/us/app/campus-parent/id1384542785",
        type: "ios",
        badge: { es: "iOS App", en: "iOS App" },
      },
      {
        id: "ic-parent-android",
        label: {
          es: "Google Play (Android / Samsung)",
          en: "Google Play (Android / Samsung)",
        },
        url: "https://play.google.com/store/apps/details?id=com.infinitecampus.parent.campusportalhybrid",
        type: "android",
        badge: { es: "Android App", en: "Android App" },
      },
    ],
  },
  {
    id: "infinite-campus-student",
    title: {
      es: "Infinite Campus Student",
      en: "Infinite Campus Student",
    },
    category: {
      es: "Estudiantes de Lincoln",
      en: "Lincoln Students",
    },
    description: {
      es: "App oficial para que los alumnos consulten su horario de clases diario, números de salón, tareas, notas y progreso de graduación.",
      en: "Official app for students to check daily class schedules, classroom locations, assignment scores, and graduation progress.",
    },
    badge: {
      es: "Portal Estudiantil",
      en: "Student Portal",
    },
    icon: "campus-student",
    links: [
      {
        id: "ic-student-ios",
        label: {
          es: "App Store (iPhone / iPad)",
          en: "App Store (iPhone / iPad)",
        },
        url: "https://apps.apple.com/us/app/campus-student/id1384542200",
        type: "ios",
        badge: { es: "iOS App", en: "iOS App" },
      },
      {
        id: "ic-student-android",
        label: {
          es: "Google Play (Android / Samsung)",
          en: "Google Play (Android / Samsung)",
        },
        url: "https://play.google.com/store/apps/details?id=com.infinitecampus.student.campusportalhybrid",
        type: "android",
        badge: { es: "Android App", en: "Android App" },
      },
    ],
  },
  {
    id: "parentsquare",
    title: {
      es: "ParentSquare",
      en: "ParentSquare",
    },
    category: {
      es: "Comunicación Escuela - Familia",
      en: "School - Home Communication",
    },
    description: {
      es: "Mensajería privada directa con maestros, boletines de Lincoln High y alertas urgentes con traducción automática en más de 100 idiomas.",
      en: "Direct teacher messaging, Lincoln High newsletters, and emergency alerts with automatic 100+ language translation.",
    },
    badge: {
      es: "Mensajería Oficial",
      en: "Official Messaging",
    },
    icon: "parentsquare",
    links: [
      {
        id: "ps-web",
        label: {
          es: "Iniciar Sesión Web",
          en: "Sign in on Web Portal",
        },
        url: "https://www.parentsquare.com/signin",
        type: "web",
        badge: { es: "Navegador Web", en: "Web Browser" },
      },
      {
        id: "ps-ios",
        label: {
          es: "App Store (iPhone / iPad)",
          en: "App Store (iPhone / iPad)",
        },
        url: "https://apps.apple.com/us/app/parentsquare/id908126679",
        type: "ios",
        badge: { es: "iOS App", en: "iOS App" },
      },
      {
        id: "ps-android",
        label: {
          es: "Google Play (Android / Samsung)",
          en: "Google Play (Android / Samsung)",
        },
        url: "https://play.google.com/store/apps/details?id=com.parentsquare.parentsquare",
        type: "android",
        badge: { es: "Android App", en: "Android App" },
      },
    ],
  },
  {
    id: "mydart-transit",
    title: {
      es: "myDART Transit",
      en: "myDART Transit",
    },
    category: {
      es: "Transporte Escolar Gratuito",
      en: "Free Student Transit",
    },
    description: {
      es: "Mapas de paradas, horarios de la Ruta 7 y rastreo en tiempo real del autobús DART. Gratis para estudiantes de Lincoln con su credencial.",
      en: "Live stop maps, Route 7 bus schedules, and real-time tracking. Free rides for Lincoln High students with active student ID.",
    },
    badge: {
      es: "Autobús DART Gratis",
      en: "Free DART Bus Pass",
    },
    icon: "mydart",
    links: [
      {
        id: "dart-ios",
        label: {
          es: "App Store (iPhone / iPad)",
          en: "App Store (iPhone / iPad)",
        },
        url: "https://apps.apple.com/us/app/mydart-des-moines/id1294661597",
        type: "ios",
        badge: { es: "iOS App", en: "iOS App" },
      },
      {
        id: "dart-android",
        label: {
          es: "Google Play (Android / Samsung)",
          en: "Google Play (Android / Samsung)",
        },
        url: "https://play.google.com/store/apps/details?id=co.bytemark.mydart",
        type: "android",
        badge: { es: "Android App", en: "Android App" },
      },
      {
        id: "dart-web",
        label: {
          es: "Sitio Web Oficial de DART",
          en: "Official DART Transit Web",
        },
        url: "https://www.ridedart.com",
        type: "external",
        badge: { es: "Sitio Web", en: "Website" },
      },
    ],
  },
];

export function ResourcesOverview({ className = "" }: { className?: string }) {
  const { t, lang } = useI18n();
  const { selectedSchool } = useSchool();
  const bi: "es" | "en" = lang === "es" ? "es" : "en";
  const schoolName = selectedSchool.name;

  const dbResourcesQuery = useQuery({
    queryKey: ["resources", selectedSchool.id],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return [];
      try {
        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .order("display_order", { ascending: true });
        if (error || !Array.isArray(data)) return [];
        const active = (data as Record<string, any>[]).filter(
          (r) =>
            r.is_active !== false &&
            r.is_visible !== false &&
            r.status !== "archived" &&
            r.status !== "draft",
        );
        return filterBySchool(active, selectedSchool.id);
      } catch {
        return [];
      }
    },
  });

  const combinedResources: ResourceItem[] = [
    ...OFFICIAL_RESOURCES,
    ...(dbResourcesQuery.data || []).map((r): ResourceItem => {
      const esTitle = String(r.title || r.name || "Recurso Oficial");
      const enTitle = autoTranslateText(esTitle, "en");
      const esDesc = String(r.description || "");
      const enDesc = esDesc ? autoTranslateText(esDesc, "en") : "";
      const url = String(r.url || r.external_url || r.file_url || "#");
      return {
        id: `db-res-${r.id}`,
        title: { es: esTitle, en: enTitle },
        category: { es: "Recursos Adicionales", en: "Additional Resources" },
        description: { es: esDesc, en: enDesc },
        badge: { es: "Recurso Oficial", en: "Official Resource" },
        icon: "campus-parent",
        links: [
          {
            id: `db-link-${r.id}`,
            label: { es: esTitle, en: enTitle },
            url,
            type: "web",
            badge: { es: "Enlace Oficial", en: "Official Link" },
          },
        ],
      };
    }),
  ];

  return (
    <section className={`space-y-6 ${className}`}>
      {/* SECTION HEADER */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <ShieldCheck className="size-4 text-primary" />
          {t("resources.officialTitle").replace("{school}", schoolName)}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {t("resources.overviewTitle")}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
          {t("resources.overviewBody")}
        </p>
      </div>

      {/* DYNAMIC GRID OF RESOURCES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {combinedResources.map((resource) => {
          let categoryText = resource.category[bi];
          let descriptionText = resource.description[bi];

          if (selectedSchool.id === "east") {
            categoryText = categoryText
              .replace("Estudiantes de Lincoln", "Estudiantes de East High")
              .replace("Lincoln Students", "East High Students");
            descriptionText = descriptionText
              .replace(/Lincoln High/g, "East High")
              .replace(/Lincoln/g, "East High");
          }

          return (
            <div
              key={resource.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md"
            >
              {/* TOP HEADER */}
              <div className="space-y-4">
                {/* CATEGORY & BADGES HEADER BAR */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    {categoryText}
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
                      <CheckCircle2 className="size-3 text-primary" />
                      {resource.badge[bi]}
                    </span>

                    <span
                      title={t("resources.verifiedTitle")}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    >
                      <CalendarCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{t("resources.reviewedDate")}</span>
                    </span>
                  </div>
                </div>

                {/* ICON AND TITLE */}
                <div className="flex items-center gap-3.5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary font-bold">
                    {resource.icon === "mydart" ? (
                      <Bus className="size-6 text-primary" />
                    ) : (
                      <Smartphone className="size-6 text-primary" />
                    )}
                  </span>
                  <h3 className="text-xl font-extrabold text-card-foreground group-hover:text-primary transition-colors leading-tight">
                    {resource.title[bi]}
                  </h3>
                </div>

                {/* DESCRIPTION */}
                <p className="text-sm leading-relaxed text-muted-foreground">{descriptionText}</p>
              </div>

              {/* DYNAMICALLY MAPPED LINKS */}
              <div className="mt-6 pt-4 border-t border-border/60 space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("resources.directLinks")}
                </div>

                <div className="flex flex-col gap-2">
                  {resource.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackResourceClick(resource.id, {
                          link_id: link.id,
                          link_type: link.type,
                          school_id: selectedSchool.id,
                        })
                      }
                      aria-label={`${link.label[bi]} (${t("resources.opensNewTab")})`}
                      className="group/btn flex items-center justify-between gap-3 rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {link.type === "web" || link.type === "external" ? (
                          <Globe className="size-4 shrink-0 text-primary group-hover/btn:text-primary-foreground" />
                        ) : (
                          <Smartphone className="size-4 shrink-0 text-primary group-hover/btn:text-primary-foreground" />
                        )}
                        <span className="leading-tight">{link.label[bi]}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {link.badge ? (
                          <span className="hidden sm:inline-block text-[11px] font-semibold opacity-75 group-hover/btn:opacity-100">
                            {link.badge[bi]}
                          </span>
                        ) : null}
                        <ExternalLink className="size-4 shrink-0 opacity-70 group-hover/btn:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
