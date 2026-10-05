/**
 * Nombres cortos para el menú de artículos informativos.
 * Solo afecta la etiqueta del menú: el título completo se mantiene en la página.
 */

const KEYWORD_LABELS: { match: string; label: string }[] = [
  { match: "infinite campus parent", label: "Campus Parent" },
  { match: "campus parent", label: "Campus Parent" },
  { match: "infinite campus student", label: "Campus Student" },
  { match: "campus student", label: "Campus Student" },
  { match: "parentsquare", label: "ParentSquare" },
  { match: "mydart", label: "myDART Transit" },
  { match: "aplicaciones oficiales", label: "Apps oficiales" },
  { match: "official apps", label: "Apps oficiales" },
  { match: "chromebook", label: "Chromebooks" },
  { match: "telefonos celulares", label: "Teléfonos y dispositivos" },
  { match: "dispositivos electronicos", label: "Teléfonos y dispositivos" },
  { match: "cell phone", label: "Teléfonos y dispositivos" },
  { match: "dart", label: "Pases DART" },
  { match: "inscrib", label: "Inscripción" },
  { match: "enroll", label: "Inscripción" },
  { match: "apoyo familiar", label: "Apoyo familiar" },
  { match: "family support", label: "Apoyo familiar" },
  { match: "medicament", label: "Medicamentos" },
  { match: "medication", label: "Medicamentos" },
  { match: "enfermedad", label: "Enfermedad" },
  { match: "vacunas", label: "Vacunas y contactos" },
  { match: "utiles escolares", label: "Útiles escolares" },
  { match: "supply", label: "Útiles escolares" },
  { match: "campanas", label: "Horario escolar" },
  { match: "bell schedule", label: "Horario escolar" },
  { match: "graduacion", label: "Graduación" },
  { match: "graduation", label: "Graduación" },
  { match: "casas", label: "Casas de 9.º grado" },
  { match: "houses", label: "Casas de 9.º grado" },
  { match: "despensa", label: "Despensa gratis" },
  { match: "food pantry", label: "Despensa gratis" },
  { match: "preguntas frecuentes", label: "Preguntas frecuentes" },
  { match: "drivers ed", label: "Drivers ED" },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function shortArticleTitle(title: string): string {
  const norm = normalize(title);
  for (const entry of KEYWORD_LABELS) {
    if (norm.includes(entry.match)) return entry.label;
  }

  // Corta en el primer separador y limita a pocas palabras.
  const head = (title.split(/[:—–|(]/)[0] ?? title).trim();
  const words = head.split(/\s+/);
  const short = words.length > 5 ? `${words.slice(0, 5).join(" ")}…` : head;
  return short.length > 40 ? `${short.slice(0, 38).trim()}…` : short;
}
