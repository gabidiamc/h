import type { LanguageCode } from "@/lib/i18n";
import { normalizeText, tokenizeQuery, tokenInText, singularize } from "@/lib/help/text";
import {
  localizedArticle,
  localizedAnnouncement,
  localizedCategory,
  localizedFaq,
  type ArticleRow,
  type AnnouncementRow,
  type CategoryRow,
  type FaqRow,
} from "@/lib/content";
import {
  localizedActivity,
  localizedEvent,
  localizedProgram,
  type ActivityRow,
  type ContactRow,
  type EventRow,
  type OfficialSourceRow,
  type ProgramRow,
} from "@/lib/directory";
import { NGOT_ARTICLES } from "@/lib/ngot-articles";
import { NGOT_TEAMS } from "@/lib/ngot-teams";
import {
  computeContentStatus,
  formatDesMoinesDate,
  getStatusBadgeInfo,
  type ContentStatus,
  type LifecycleItem,
} from "@/lib/content-lifecycle";

export type SearchGroupKey =
  | "announcements"
  | "articles"
  | "guides"
  | "categories"
  | "events"
  | "programs"
  | "activities"
  | "teams"
  | "faqs"
  | "contacts"
  | "sources"
  | "pages";

export type GlobalSearchResult = {
  id: string;
  group: SearchGroupKey;
  title: string;
  snippet: string;
  href: string;
  external?: boolean;
  score: number;
  lifecycleStatus: ContentStatus;
  isExpired: boolean;
  isDeactivated: boolean;
  endsAt: string | null;
  completedDateLabel: string | null;
  badgeLabel: string | null;
  badgeClass: string | null;
  schoolId?: string | null;
};

const GROUP_LABELS: Record<SearchGroupKey, { es: string; en: string }> = {
  announcements: { es: "Avisos y Noticias", en: "Announcements & News" },
  articles: { es: "Artículos", en: "Articles" },
  guides: { es: "Guías", en: "Guides" },
  categories: { es: "Categorías", en: "Categories" },
  events: { es: "Calendario", en: "Calendar" },
  programs: { es: "Programas", en: "Programs" },
  activities: { es: "Deportes y actividades", en: "Sports & activities" },
  teams: { es: "Equipos", en: "Teams" },
  faqs: { es: "Preguntas frecuentes", en: "FAQ" },
  contacts: { es: "Contactos", en: "Contacts" },
  sources: { es: "Fuentes oficiales", en: "Official sources" },
  pages: { es: "Secciones del sitio", en: "Site sections" },
};

export function searchGroupLabel(group: SearchGroupKey, lang: LanguageCode): string {
  const entry = GROUP_LABELS[group];
  if (!entry) return group;
  return lang === "en" ? entry.en : entry.es;
}

export const SEARCH_GROUP_ORDER: SearchGroupKey[] = [
  "announcements",
  "articles",
  "guides",
  "events",
  "programs",
  "activities",
  "teams",
  "faqs",
  "categories",
  "contacts",
  "sources",
  "pages",
];

/** Cross-language keyword dictionary and synonyms */
const SYNONYM_MAP: Record<string, string[]> = {
  campus: [
    "infinite",
    "portal",
    "parent",
    "calificaciones",
    "notas",
    "grades",
    "asistencia",
    "faltas",
  ],
  infinite: ["campus", "portal", "calificaciones", "notas", "grades"],
  portal: ["campus", "infinite", "parent", "padres", "familias"],
  bus: ["autobus", "transporte", "camion", "dart", "rutas", "paradas", "horario", "pase", "id"],
  autobus: ["bus", "transporte", "dart", "rutas", "paradas", "camion", "escolar"],
  camion: ["bus", "autobus", "dart", "transporte", "escolar", "rutas"],
  dart: [
    "bus",
    "autobus",
    "transporte",
    "rutas",
    "paradas",
    "rides",
    "id",
    "credencial",
    "pase",
    "tarjeta",
  ],
  transporte: ["bus", "autobus", "dart", "rutas", "transportation", "camion"],
  id: ["credencial", "identificacion", "tarjeta", "carnet", "badge", "estudiante", "dart"],
  credencial: ["id", "identificacion", "tarjeta", "carnet", "badge", "estudiante"],
  comida: [
    "almuerzo",
    "desayuno",
    "nutricion",
    "cafeteria",
    "lunch",
    "breakfast",
    "meals",
    "food",
    "nutrislice",
    "menus",
  ],
  almuerzo: [
    "comida",
    "desayuno",
    "nutricion",
    "lunch",
    "meals",
    "cafeteria",
    "nutrislice",
    "menu",
  ],
  desayuno: ["comida", "almuerzo", "breakfast", "nutricion", "nutrislice"],
  lunch: ["almuerzo", "comida", "meals", "nutrition", "cafeteria", "nutrislice"],
  calificaciones: ["notas", "grades", "report card", "boletin", "campus", "infinite campus"],
  notas: ["calificaciones", "grades", "campus", "boletin"],
  grades: ["calificaciones", "notas", "report card", "campus"],
  asistencia: ["faltas", "attendance", "ausencias", "justificar", "excusa", "tardanzas"],
  horario: ["campanas", "bell", "schedule", "horas", "clases", "entrada", "salida", "periodos"],
  campanas: ["horario", "bell", "schedule", "campana", "timbre", "entrada", "salida"],
  bell: ["campanas", "horario", "schedule", "campana"],
  inscripcion: [
    "matricula",
    "registro",
    "enrollment",
    "registration",
    "inscribirse",
    "ingreso",
    "oler",
    "kindergarten",
  ],
  matricula: ["inscripcion", "registro", "enrollment", "registration", "inscribirse"],
  registro: ["inscripcion", "matricula", "enrollment", "registration"],
  enrollment: ["inscripcion", "matricula", "registration", "register", "oler"],
  calendario: [
    "calendar",
    "fechas",
    "dias",
    "festivos",
    "vacaciones",
    "no school",
    "sin clases",
    "receso",
  ],
  calendar: ["calendario", "dates", "schedule", "holidays"],
  deportes: [
    "sports",
    "futbol",
    "soccer",
    "baloncesto",
    "basketball",
    "volleyball",
    "atletismo",
    "bound",
    "equipos",
  ],
  bound: ["deportes", "sports", "actividades", "atletismo", "equipos", "boletos"],
  sports: ["deportes", "athletics", "teams", "equipos", "bound"],
  salud: [
    "enfermera",
    "enfermeria",
    "vacunas",
    "health",
    "nurse",
    "immunization",
    "medico",
    "dental",
    "vision",
  ],
  vacunas: ["salud", "enfermera", "nurse", "immunization", "inmunizaciones"],
  health: ["salud", "nurse", "immunization", "enfermeria", "vacunas"],
  contacto: [
    "telefono",
    "oficina",
    "email",
    "correo",
    "contact",
    "directorio",
    "phone",
    "director",
  ],
  contact: ["contacto", "phone", "email", "office", "directory"],
  voluntarios: [
    "voluntariado",
    "voluntario",
    "volunteer",
    "bfl",
    "participar",
    "silver cord",
    "horas",
  ],
  volunteer: ["voluntarios", "voluntariado", "bfl", "silver cord"],
  empleos: ["trabajo", "jobs", "student jobs", "carreras", "bolsa de trabajo", "laboral"],
  jobs: ["empleos", "trabajo", "work"],
  faq: ["preguntas", "dudas", "respuestas", "questions", "ayuda"],
  preguntas: ["faq", "dudas", "respuestas", "questions"],
};

function normalize(value: string): string {
  return normalizeText(value);
}

function tokenize(query: string): string[] {
  return tokenizeQuery(query);
}

/** Expand search tokens with known cross-language synonyms */
function expandTokens(tokens: string[]): string[][] {
  return tokens.map((token) => {
    const list = [token];
    const sing = singularize(token);
    if (sing !== token && !list.includes(sing)) {
      list.push(sing);
    }
    if (SYNONYM_MAP[token]) {
      list.push(...SYNONYM_MAP[token]);
    }
    if (SYNONYM_MAP[sing]) {
      for (const s of SYNONYM_MAP[sing]) {
        if (!list.includes(s)) list.push(s);
      }
    }
    for (const [key, syns] of Object.entries(SYNONYM_MAP)) {
      if ((syns.includes(token) || syns.includes(sing)) && !list.includes(key)) {
        list.push(key);
      }
    }
    return list;
  });
}

/** Scores a record against query tokens (and their synonym expansions). */
function scoreFields(
  tokenGroups: string[][],
  rawTokens: string[],
  title: string,
  body: string[],
  itemSchoolId?: string | null,
  currentSchoolId?: string | null,
  normalizedFullQuery?: string,
): number {
  const normTitle = normalizeText(title);
  const normBody = normalizeText(body.filter(Boolean).join(" \u00b7 "));
  let total = 0;
  let matchedGroupCount = 0;

  for (let g = 0; g < tokenGroups.length; g++) {
    const alternatives = tokenGroups[g];
    const primaryToken = rawTokens[g];
    let bestGroupScore = 0;

    for (const alt of alternatives) {
      const isPrimary = alt === primaryToken;
      const factor = isPrimary ? 1.0 : 0.82;

      if (normTitle === alt) {
        bestGroupScore = Math.max(bestGroupScore, 200 * factor);
      } else if (normTitle.startsWith(alt + " ") || normTitle.endsWith(" " + alt)) {
        bestGroupScore = Math.max(bestGroupScore, 160 * factor);
      } else {
        const titleStrength = tokenInText(alt, normTitle);
        if (titleStrength > 0) {
          bestGroupScore = Math.max(
            bestGroupScore,
            (titleStrength >= 0.95 ? 130 : 90) * factor * titleStrength,
          );
        } else {
          const bodyStrength = tokenInText(alt, normBody);
          if (bodyStrength > 0) {
            bestGroupScore = Math.max(
              bestGroupScore,
              (bodyStrength >= 0.95 ? 45 : 30) * factor * bodyStrength,
            );
          }
        }
      }
    }

    if (bestGroupScore > 0) {
      matchedGroupCount++;
      total += bestGroupScore;
    }
  }

  if (matchedGroupCount === 0) return 0;

  // Multi-term relaxation: allows matching queries even when imprecise
  const requiredMatches =
    rawTokens.length <= 1
      ? 1
      : rawTokens.length === 2
        ? 1
        : Math.max(1, Math.floor(rawTokens.length * 0.33));

  if (matchedGroupCount < requiredMatches) {
    return 0;
  }

  // Completeness multiplier: rewarding documents that match more or all query terms
  const coverageRatio = matchedGroupCount / rawTokens.length;
  total = total * (0.6 + coverageRatio * 1.4);

  // Exact full phrase bonus if the user's entire query appears
  if (normalizedFullQuery && normalizedFullQuery.length >= 4) {
    if (normTitle.includes(normalizedFullQuery)) {
      total += 260;
    } else if (normBody.includes(normalizedFullQuery)) {
      total += 110;
    }
  }

  // Bonus if the item specifically matches the currently selected school
  if (itemSchoolId && currentSchoolId && itemSchoolId === currentSchoolId) {
    total += 60;
  }

  return total;
}

/** Turns stored rich text into readable plain text for previews. */
function plainText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[*_`#>]+/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;|&#0?39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function snippetFrom(tokens: string[], parts: string[]): string {
  const text = plainText(parts.filter(Boolean).join(" · "));
  if (!text) return "";
  const norm = normalize(text);
  const hit = tokens
    .map((tk) => norm.indexOf(tk))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];
  if (hit === undefined || hit < 90) return text.slice(0, 190) + (text.length > 190 ? "…" : "");
  const start = Math.max(0, hit - 70);
  return "…" + text.slice(start, start + 190).trim() + (text.length > start + 190 ? "…" : "");
}

/* Only these keys hold human-readable copy; skip type/url/color metadata. */
const TEXT_KEYS = ["text", "title", "caption", "alt", "label", "question", "answer", "summary"];

function blocksToText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const record = block as Record<string, unknown>;
      const chunks: string[] = [];
      for (const key of TEXT_KEYS) {
        const value = record[key];
        if (typeof value === "string") chunks.push(value);
      }
      const items = record["items"];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (typeof item === "string") chunks.push(item);
          else if (item && typeof item === "object") {
            for (const key of TEXT_KEYS) {
              const nested = (item as Record<string, unknown>)[key];
              if (typeof nested === "string") chunks.push(nested);
            }
          }
        }
      }
      return chunks.join(" ");
    })
    .join(" ");
}

export type SearchSources = {
  lang: LanguageCode;
  schoolId: string;
  isLincoln: boolean;
  announcements?: AnnouncementRow[];
  articles: ArticleRow[];
  categories: CategoryRow[];
  events: EventRow[];
  programs: ProgramRow[];
  activities: ActivityRow[];
  faqs: FaqRow[];
  contacts: ContactRow[];
  sources: OfficialSourceRow[];
};

type StaticPage = {
  href: string;
  es: string;
  en: string;
  esDesc: string;
  enDesc: string;
  keywords?: string[];
};

const STATIC_PAGES: StaticPage[] = [
  {
    href: "/calendario",
    es: "Calendario escolar",
    en: "School calendar",
    esDesc: "Días sin clases, conferencias de padres, días festivos y fechas académicas.",
    enDesc: "No-school days, parent conferences, holidays and academic dates.",
    keywords: ["fechas", "festivos", "vacaciones", "no school", "schedule"],
  },
  {
    href: "/programas",
    es: "Programas",
    en: "Programs",
    esDesc: "Programas académicos, de verano, tutorías e inscripciones.",
    enDesc: "Academic programs, summer programs, tutoring and enrollment.",
    keywords: ["tutoria", "academico", "inscripciones"],
  },
  {
    href: "/deportes-actividades",
    es: "Deportes y actividades",
    en: "Sports & activities",
    esDesc: "Equipos deportivos, clubes, horarios y requisitos de participación.",
    enDesc: "Sports teams, clubs, schedules and participation requirements.",
    keywords: ["athletics", "clubes", "equipos", "futbol", "baloncesto"],
  },
  {
    href: "/transporte/dart",
    es: "Transporte DART",
    en: "DART transportation",
    esDesc: "Rutas de autobús DART, paradas y llegadas en tiempo real.",
    enDesc: "DART bus routes, stops and real-time arrivals.",
    keywords: ["bus", "autobus", "paradas", "camion", "rutas"],
  },
  {
    href: "/horario-campanas",
    es: "Horario de campanas (Lincoln)",
    en: "Bell schedule (Lincoln)",
    esDesc: "Horario oficial de periodos escolares y campanas de Lincoln High School.",
    enDesc: "Official bell schedules and period timing for Lincoln High School.",
    keywords: ["campanas", "bell", "horario", "periodos", "clases", "horas"],
  },
  {
    href: "/voluntarios",
    es: "Voluntarios y familias activas",
    en: "Volunteers and family engagement",
    esDesc: "Oportunidades de voluntariado, apoyo en escuelas y participación familiar.",
    enDesc: "Volunteer opportunities, school support and family involvement.",
    keywords: ["voluntariado", "voluntarios", "bfl", "apoyo"],
  },
  {
    href: "/bfl-status",
    es: "Estado BFL (By Family For Leaders)",
    en: "BFL Status (By Family For Leaders)",
    esDesc: "Iniciativas de liderazgo familiar, métricas y desarrollo estudiantil.",
    enDesc: "Family leadership initiatives, metrics and student development.",
    keywords: ["bfl", "liderazgo", "family", "leaders"],
  },
  {
    href: "/empleos",
    es: "Bolsa de trabajo estudiantil",
    en: "Student job board",
    esDesc: "Empleos para estudiantes, campamentos de verano y permisos de trabajo.",
    enDesc: "Student jobs, summer camps and work permits.",
    keywords: ["trabajo", "jobs", "empleos", "laboral"],
  },
  {
    href: "/announcements",
    es: "Anuncios y avisos",
    en: "Announcements & alerts",
    esDesc: "Avisos oficiales y alertas para las familias.",
    enDesc: "Official notices and alerts for families.",
    keywords: ["avisos", "noticias", "alertas", "importante"],
  },
  {
    href: "/faq",
    es: "Preguntas frecuentes",
    en: "FAQ",
    esDesc: "Respuestas rápidas a las dudas más comunes de las familias.",
    enDesc: "Quick answers to the most common family questions.",
    keywords: ["preguntas", "faq", "dudas", "respuestas"],
  },
  {
    href: "/contact",
    es: "Contacto",
    en: "Contact",
    esDesc: "Teléfonos, correos y oficinas del distrito y de las escuelas.",
    enDesc: "Phones, emails and district or school offices.",
    keywords: ["telefono", "correo", "email", "directorio", "oficina"],
  },
  {
    href: "/topics",
    es: "Todas las categorías",
    en: "All categories",
    esDesc: "Explora la información organizada por tema.",
    enDesc: "Browse information organized by topic.",
    keywords: ["temas", "categorias", "articulos", "guias"],
  },
];

/** Searches every public dataset with strict expiration awareness and status priority. */
export function globalSearch(query: string, sources: SearchSources): GlobalSearchResult[] {
  const normQuery = normalizeText(query);
  const rawTokens = tokenize(query);
  if (rawTokens.length === 0) return [];
  const tokenGroups = expandTokens(rawTokens);
  const { lang, schoolId, isLincoln } = sources;
  const results: GlobalSearchResult[] = [];

  const push = (
    group: SearchGroupKey,
    id: string,
    title: string,
    body: string[],
    href: string,
    itemLifecycle?: LifecycleItem,
    isSport?: boolean,
    external?: boolean,
    itemSchoolId?: string | null,
  ) => {
    const rawScore = scoreFields(
      tokenGroups,
      rawTokens,
      title,
      body,
      itemSchoolId,
      schoolId,
      normQuery,
    );
    if (rawScore <= 0) return;

    let lifecycleStatus: ContentStatus = "active";
    let isExpired = false;
    let endsAt: string | null = null;
    let completedDateLabel: string | null = null;

    if (itemLifecycle) {
      lifecycleStatus = computeContentStatus(itemLifecycle, { isSport });
      const badgeInfo = getStatusBadgeInfo(lifecycleStatus, lang);
      isExpired = badgeInfo.isExpired;

      const rawEnd =
        itemLifecycle.ends_at ||
        (itemLifecycle as { expires_at?: string | null }).expires_at ||
        itemLifecycle.end_date;
      if (rawEnd) {
        endsAt = rawEnd;
        const formatted = formatDesMoinesDate(rawEnd, lang);
        if (formatted && isExpired) {
          completedDateLabel =
            lang === "es"
              ? `Finalizó el ${formatted}`
              : lang === "kar"
                ? `ဝံၤဝတံၤဖဲ ${formatted}`
                : `Ended on ${formatted}`;
        }
      }
    }

    // Weight score based on lifecycle status:
    // 1. Ocurriendo ahora (300)
    // 2. Contenido activo (250)
    // 3. Contenido próximo (200)
    // 4. Finalizado recientemente (50)
    // 5. Fuera de temporada (40)
    // 6. Registro cerrado (30)
    // 7. Archivados o cancelados (10)
    let priorityWeight = 100;
    if (lifecycleStatus === "happening_now") {
      priorityWeight = 300;
    } else if (lifecycleStatus === "active") {
      priorityWeight = 250;
    } else if (lifecycleStatus === "upcoming") {
      priorityWeight = 200;
    } else if (lifecycleStatus === "completed") {
      priorityWeight = 50;
    } else if (lifecycleStatus === "out_of_season") {
      priorityWeight = 40;
    } else if (lifecycleStatus === "registration_closed") {
      priorityWeight = 30;
    } else if (lifecycleStatus === "archived" || lifecycleStatus === "cancelled") {
      priorityWeight = 10;
    }

    const badge = getStatusBadgeInfo(lifecycleStatus, lang);
    const isDeactivated =
      isExpired ||
      lifecycleStatus === "archived" ||
      lifecycleStatus === "cancelled" ||
      lifecycleStatus === "out_of_season" ||
      Boolean(
        itemLifecycle &&
        (itemLifecycle.status === "archived" ||
          (itemLifecycle as { is_cancelled?: boolean }).is_cancelled),
      );

    const finalBadgeLabel =
      isDeactivated && !badge.label
        ? lang === "es"
          ? "Desactivado"
          : lang === "kar"
            ? "တၢ်မၤယါသးဆၢ"
            : "Deactivated"
        : badge.label;

    const finalBadgeClass =
      isDeactivated && !badge.className
        ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
        : badge.className;

    const entry: GlobalSearchResult = {
      id: `${group}-${id}`,
      group,
      title,
      snippet: snippetFrom(rawTokens, body),
      href,
      score: rawScore + priorityWeight,
      lifecycleStatus,
      isExpired,
      isDeactivated,
      endsAt,
      completedDateLabel,
      badgeLabel: isDeactivated || lifecycleStatus !== "active" ? finalBadgeLabel : null,
      badgeClass: isDeactivated || lifecycleStatus !== "active" ? finalBadgeClass : null,
      schoolId: itemSchoolId,
    };
    if (external) entry.external = true;
    results.push(entry);
  };

  // Announcements
  if (sources.announcements) {
    for (const a of sources.announcements) {
      const loc = localizedAnnouncement(a, lang, schoolId);
      push(
        "announcements",
        a.id,
        loc.title,
        [loc.message, a.level, a.starts_at],
        "/announcements",
        {
          starts_at: a.starts_at,
          ends_at: a.ends_at || a.expires_at,
          status: a.status,
          archived_at: a.archived_at,
        },
        false,
        false,
        a.school_id,
      );
    }
  }

  for (const article of sources.articles) {
    const loc = localizedArticle(article, lang, schoolId);
    push(
      "articles",
      article.id,
      loc.title,
      [loc.summary ?? "", blocksToText(loc.blocks)],
      `/articles/${article.slug}`,
      {
        status: article.status,
        updated_at: article.updated_at,
        published_at: article.published_at,
        review_date: (article as { review_date?: string }).review_date,
      },
      false,
      false,
      article.school_id,
    );
  }

  if (isLincoln) {
    for (const guide of NGOT_ARTICLES) {
      push(
        "guides",
        guide.slug,
        guide.title,
        [
          guide.summary ?? "",
          guide.blocks
            .map((b) => [b.heading, ...(b.paragraphs ?? []), ...(b.bullets ?? [])].join(" "))
            .join(" "),
        ],
        `/guias/${guide.slug}`,
        undefined,
        false,
        false,
        "lincoln",
      );
    }
    for (const team of NGOT_TEAMS) {
      push(
        "teams",
        team.slug,
        team.name,
        [
          team.tagline,
          team.members.map((m) => [m.subject, m.name ?? "", m.email ?? ""].join(" ")).join(" · "),
        ],
        `/equipos/${team.slug}`,
        undefined,
        false,
        false,
        "lincoln",
      );
    }
  }

  for (const category of sources.categories) {
    const loc = localizedCategory(category, lang);
    push("categories", category.id, loc.name, [loc.description ?? ""], `/topics/${category.slug}`);
  }

  for (const event of sources.events) {
    const loc = localizedEvent(event, lang);
    push(
      "events",
      event.id,
      loc.title,
      [event.start_date, event.end_date ?? "", loc.description ?? "", event.location ?? ""],
      "/calendario",
      {
        start_date: event.start_date,
        end_date: event.end_date,
        start_time: event.start_time,
        end_time: event.end_time,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        status: event.status,
        is_cancelled: event.is_cancelled,
        is_postponed: event.is_postponed,
        archived_at: event.archived_at,
      },
      false,
      false,
      event.school_id,
    );
  }

  for (const program of sources.programs) {
    const loc = localizedProgram(program, lang);
    push(
      "programs",
      program.id,
      loc.name,
      [
        loc.summary ?? "",
        loc.description ?? "",
        loc.requirements ?? "",
        program.grades ?? "",
        program.program_type,
      ],
      "/programas",
      {
        start_date: program.start_date,
        end_date: program.end_date,
        starts_at: program.starts_at,
        ends_at: program.ends_at,
        registration_starts_at: program.registration_starts_at,
        registration_ends_at: program.registration_ends_at,
        status: program.status,
        archived_at: program.archived_at,
      },
      false,
      false,
      program.school_id,
    );
  }

  for (const activity of sources.activities) {
    const loc = localizedActivity(activity, lang);
    push(
      "activities",
      activity.id,
      loc.name,
      [
        loc.description ?? "",
        activity.season ?? "",
        activity.schedule ?? "",
        activity.location ?? "",
        activity.requirements ?? "",
      ],
      "/deportes-actividades",
      {
        season: activity.season,
        starts_at: activity.starts_at,
        ends_at: activity.ends_at,
        registration_starts_at: activity.registration_starts_at,
        registration_ends_at: activity.registration_ends_at,
        status: activity.status,
        archived_at: activity.archived_at,
      },
      true,
      false,
      activity.school_id,
    );
  }

  for (const faq of sources.faqs) {
    const loc = localizedFaq(faq, lang, schoolId);
    push(
      "faqs",
      faq.id,
      loc.question,
      [loc.answer ?? ""],
      "/faq",
      undefined,
      false,
      false,
      faq.school_id,
    );
  }

  for (const contact of sources.contacts) {
    push(
      "contacts",
      contact.id,
      contact.department,
      [
        contact.person_name ?? "",
        contact.job_title ?? "",
        contact.phone ?? "",
        contact.email ?? "",
        contact.address ?? "",
        contact.hours ?? "",
      ],
      "/contact",
      undefined,
      false,
      false,
      contact.school_id,
    );
  }

  for (const source of sources.sources) {
    push(
      "sources",
      source.id,
      source.name,
      [source.notes ?? "", source.url],
      source.url,
      undefined,
      false,
      true,
    );
  }

  for (const page of STATIC_PAGES) {
    const title = lang === "en" ? page.en : page.es;
    const desc = lang === "en" ? page.enDesc : page.esDesc;
    push("pages", page.href, title, [desc, ...(page.keywords ?? [])], page.href);
  }

  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}
