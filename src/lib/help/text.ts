/**
 * Local text utilities for the family help assistant.
 *
 * Everything here runs in the browser with plain JavaScript: no AI, no API
 * calls, no tokens. It only normalizes and compares text.
 */

/** Lowercase, strip accents, drop punctuation and collapse whitespace. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()"'`´“”«»/\\|_*#-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Common words that rarely change the meaning of a family question. */
const STOP_WORDS = new Set([
  "a",
  "al",
  "como",
  "con",
  "cual",
  "cuales",
  "cuando",
  "de",
  "del",
  "donde",
  "el",
  "ella",
  "ellos",
  "en",
  "es",
  "esta",
  "este",
  "esto",
  "hay",
  "la",
  "las",
  "le",
  "lo",
  "los",
  "mas",
  "me",
  "mi",
  "mis",
  "muy",
  "no",
  "o",
  "para",
  "pero",
  "por",
  "que",
  "quien",
  "se",
  "si",
  "sobre",
  "su",
  "sus",
  "tengo",
  "un",
  "una",
  "uno",
  "y",
  "yo",
  "the",
  "and",
  "for",
  "how",
  "i",
  "in",
  "is",
  "it",
  "my",
  "of",
  "on",
  "or",
  "to",
  "what",
  "when",
  "where",
  "do",
  "does",
  "can",
  "my",
]);

/** Splits a query into meaningful search tokens. */
export function tokenizeQuery(query: string): string[] {
  const raw = normalizeText(query)
    .split(" ")
    .filter((word) => word.length > 1);
  const meaningful = raw.filter((word) => !STOP_WORDS.has(word));
  return meaningful.length > 0 ? meaningful : raw;
}

/** Removes a trailing plural marker so "buses" matches "bus". */
export function singularize(word: string): string {
  if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

/** Classic Levenshtein distance, capped for performance. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 4;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min((curr[j - 1] ?? 0) + 1, (prev[j] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j] ?? 0;
  }
  return prev[b.length] ?? 4;
}

/** Tolerance for typos: longer words may differ by two characters. */
function allowedDistance(word: string): number {
  if (word.length <= 4) return 0;
  if (word.length <= 7) return 1;
  return 2;
}

/**
 * Match strength of one search token against one haystack word.
 * 1 = exact, 0.85 = prefix/incomplete word, 0.65 = close spelling, 0 = no match.
 */
export function wordMatchStrength(token: string, word: string): number {
  if (!token || !word) return 0;
  if (token === word) return 1;
  const st = singularize(token);
  const sw = singularize(word);
  if (st === sw) return 0.95;
  if (word.startsWith(token) || token.startsWith(word)) {
    return Math.min(token.length, word.length) >= 4 ? 0.85 : 0;
  }
  if (editDistance(st, sw) <= allowedDistance(st)) return 0.65;
  return 0;
}

/** Best match strength of a token anywhere inside a normalized text. */
export function tokenInText(token: string, normalizedText: string): number {
  if (!normalizedText) return 0;
  if (token.length > 3 && normalizedText.includes(token)) return 1;
  let best = 0;
  for (const word of normalizedText.split(" ")) {
    const strength = wordMatchStrength(token, word);
    if (strength > best) best = strength;
    if (best === 1) break;
  }
  return best;
}

/** Removes anything that looks private before a query is ever stored. */
export function sanitizeQueryForStorage(query: string): string | null {
  const cleaned = query.replace(/\s+/g, " ").trim().slice(0, 160);
  if (cleaned.length < 3) return null;
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+/i.test(cleaned)) return null;
  if (/\d{5,}/.test(cleaned)) return null;
  return cleaned;
}
