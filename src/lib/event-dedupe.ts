/**
 * Los eventos llegan de varias fuentes (contenido curado + importaciones del
 * distrito, Lincoln y East), asi que el mismo dia festivo puede aparecer 3 o 4
 * veces. Aqui agrupamos los duplicados y dejamos solo la version con mas
 * informacion.
 */

type DedupeEvent = {
  id: string;
  title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  event_type?: string | null;
  official_url?: string | null;
  image_url?: string | null;
  is_featured?: boolean | null;
  school_id?: string | null;
  event_translations?: Array<{ language_code: string; title: string; description?: string | null }>;
};

/** Frases que identifican la misma fecha escolar en ingles o espanol. */
const CONCEPTS: Array<[string, RegExp]> = [
  [
    "welcome",
    /(welcome|bienvenid[ao]s?|back to school|open house|orientation|orientaci[oó]n|scarlet showcase|railsplitter)/i,
  ],
  ["first-day", /(first day|primer d[ií]a|inicio de (clases|colegio))/i],
  ["last-day", /(last day|[uú]ltimo d[ií]a|fin de (clases|colegio))/i],
  ["labor-day", /(labor day|d[ií]a del trabajo)/i],
  ["mlk", /(mlk|martin luther king)/i],
  ["presidents", /(presidents|presidentes)/i],
  ["thanksgiving", /(thanksgiving|acci[oó]n de gracias)/i],
  ["winter-break", /(winter break|vacaciones de invierno)/i],
  ["spring-break", /(spring break|vacaciones de primavera)/i],
  ["summer-break", /(summer break|vacaciones de verano)/i],
  ["yom-kippur", /yom kippur/i],
  ["election", /(election day|d[ií]a de (las )?elecciones)/i],
  ["conference-comp", /(conference compensation|compensaci[oó]n de la conferencia)/i],
  ["conference", /(parent[- ]?teacher|conferencias?|conferences?)/i],
  ["pd-day", /(pd day|professional development|d[ií]as? de formaci[oó]n|teacher work day)/i],
  ["no-school", /(no school|no classes|sin clases)/i],
  ["preschool-start", /(preschool|preescolar)/i],
];

function conceptKey(ev: DedupeEvent): string {
  const hay = [ev.title, ...(ev.event_translations ?? []).map((t) => t.title)].join(" ");
  for (const [key, re] of CONCEPTS) {
    if (re.test(hay)) return key;
  }
  return ev.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function score(ev: DedupeEvent): number {
  let s = 0;
  if (ev.is_featured) s += 200;
  if (!ev.id.startsWith("dmps-")) s += 60; // contenido curado por el personal
  if (ev.school_id) s += 20; // version especifica de la escuela
  if ((ev.event_translations?.length ?? 0) > 0) s += 40;
  if (ev.image_url) s += 15;
  if (ev.official_url) s += 10;
  s += Math.min((ev.description ?? "").length, 400) / 10;
  const trDesc = (ev.event_translations ?? []).reduce(
    (max, t) => Math.max(max, (t.description ?? "").length),
    0,
  );
  s += Math.min(trDesc, 400) / 20;
  return s;
}

/** Deja un solo evento por fecha + concepto, el que tenga mas informacion. */
export function dedupeEvents<T extends DedupeEvent>(list: T[]): T[] {
  const best = new Map<string, T>();
  const order: string[] = [];

  for (const ev of list) {
    // La fuente oficial a veces publica la misma fecha como evento de un día
    // y como rango de dos días. El inicio + concepto es la identidad estable.
    const key = `${ev.start_date}|${conceptKey(ev)}`;
    const current = best.get(key);
    if (!current) {
      best.set(key, ev);
      order.push(key);
      continue;
    }
    if (score(ev) > score(current)) best.set(key, ev);
  }

  return order.flatMap((key) => {
    const event = best.get(key);
    return event ? [event] : [];
  });
}

const SPANISH_TITLES: Array<[RegExp, string]> = [
  [
    /(scarlet showcase|open house|orientation|back to school|welcome)/i,
    "Noche de orientación y bienvenida",
  ],
  [/first day of school(?: for k-12 students)?/i, "Primer día de clases para estudiantes de K-12"],
  [/last day of school/i, "Último día de clases"],
  [/school board meeting/i, "Reunión de la Junta Escolar"],
  [/parent[- ]?teacher conferences?/i, "Conferencias de padres y maestros"],
  [/professional development(?: day)?/i, "Día de desarrollo profesional — sin clases"],
  [/teacher work day/i, "Día de trabajo docente — sin clases"],
  [/no school/i, "Sin clases"],
  [/labor day/i, "Día del Trabajo — sin clases"],
  [/thanksgiving(?: break)?/i, "Vacaciones de Acción de Gracias — sin clases"],
  [/winter break/i, "Vacaciones de invierno — sin clases"],
  [/spring break/i, "Vacaciones de primavera — sin clases"],
  [/presidents'? day/i, "Día de los Presidentes — sin clases"],
  [/martin luther king(?: jr\.?)? day/i, "Día de Martin Luther King Jr. — sin clases"],
];

/** Traduce títulos comunes importados cuando la fuente oficial solo ofrece inglés. */
export function spanishCalendarTitle(title: string): string {
  for (const [pattern, translated] of SPANISH_TITLES) {
    if (pattern.test(title)) return translated;
  }
  return title;
}
