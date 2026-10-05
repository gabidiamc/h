/**
 * Artículos derivados del Paquete de Recursos de 9.º Grado (solo Lincoln High School).
 * Cada bloque del paquete se publica como su propio artículo informativo.
 */
import { NGOT_GUIDE, NGOT_INTRO, type GuideBlock } from "@/lib/ngot-teams";

export interface NgotArticle {
  slug: string;
  title: string;
  summary: string;
  icon: string;
  blocks: GuideBlock[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/^\d+-/, "");
}

function cleanTitle(heading: string): string {
  return heading.replace(/^\d+\.\s*/, "");
}

function summarize(block: GuideBlock): string {
  const text = block.paragraphs?.[0] ?? block.bullets?.[0] ?? "";
  return text.length > 150 ? `${text.slice(0, 147)}…` : text;
}

const ICONS = [
  "BookOpen",
  "Laptop",
  "GraduationCap",
  "CalendarDays",
  "ShieldCheck",
  "Users",
  "HandHeart",
  "LifeBuoy",
  "HeartPulse",
  "Megaphone",
];

export const NGOT_ARTICLES: NgotArticle[] = [
  {
    slug: "que-es-ngot",
    title: cleanTitle(NGOT_INTRO.heading),
    summary: summarize(NGOT_INTRO),
    icon: "Users",
    blocks: [NGOT_INTRO],
  },
  ...NGOT_GUIDE.map((block, i) => ({
    slug: slugify(block.heading),
    title: cleanTitle(block.heading),
    summary: summarize(block),
    icon: ICONS[(i + 1) % ICONS.length] ?? "BookOpen",
    blocks: [block],
  })),
];

export function findNgotArticle(slug: string): NgotArticle | null {
  return NGOT_ARTICLES.find((a) => a.slug === slug) ?? null;
}
