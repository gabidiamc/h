/**
 * Keyword search for the family help assistant.
 *
 * Pure local matching: normalization, staff-approved synonyms, fuzzy word
 * comparison and scoring. No AI model, no external service, no tokens.
 */
import { normalizeText, tokenizeQuery, tokenInText } from "./text";
import type { HelpAnswerRow, HelpSynonymRow } from "./data";

export type HelpDocKind = "answer" | "faq" | "article";

export type HelpDoc = {
  id: string;
  kind: HelpDocKind;
  question: string;
  answer: string;
  steps: string[];
  keywords: string[];
  categoryId: string | null;
  schoolId: string | null;
  internalUrl: string | null;
  officialUrl: string | null;
  verifiedAt: string | null;
};

export type HelpMatch = { doc: HelpDoc; score: number };

export type HelpSearchOutcome = {
  strength: "strong" | "multiple" | "weak" | "none";
  matches: HelpMatch[];
};

export function answerToDoc(row: HelpAnswerRow): HelpDoc {
  return {
    id: row.id,
    kind: "answer",
    question: row.question,
    answer: row.answer,
    steps: row.steps ?? [],
    keywords: row.keywords ?? [],
    categoryId: row.category_id,
    schoolId: row.school_id,
    internalUrl: row.internal_url,
    officialUrl: row.official_source_url,
    verifiedAt: row.verified_at,
  };
}

/** Builds a lookup where every approved term points to its whole synonym group. */
export function buildSynonymIndex(rows: HelpSynonymRow[]): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const row of rows) {
    const group = [row.primary_term, ...(row.related_terms ?? [])]
      .map((term) => normalizeText(term))
      .filter(Boolean);
    for (const term of group) {
      const existing = index.get(term) ?? [];
      index.set(term, Array.from(new Set([...existing, ...group])));
    }
  }
  return index;
}

/**
 * Expands each query token with staff-approved equivalents only.
 * Two words are never treated as equal unless an administrator approved them.
 */
export function expandTokens(tokens: string[], synonyms: Map<string, string[]>): string[][] {
  return tokens.map((token) => {
    const group = synonyms.get(token);
    return group && group.length > 0 ? Array.from(new Set([token, ...group])) : [token];
  });
}

/** Multi-word approved phrases such as "infinite campus" count as one token. */
function phraseBoost(normalizedQuery: string, synonyms: Map<string, string[]>): string[] {
  const hits: string[] = [];
  for (const term of synonyms.keys()) {
    if (term.includes(" ") && normalizedQuery.includes(term)) {
      hits.push(...(synonyms.get(term) ?? []));
    }
  }
  return Array.from(new Set(hits));
}

function scoreDoc(variantGroups: string[][], extraTerms: string[], doc: HelpDoc): number {
  const question = normalizeText(doc.question);
  const keywords = normalizeText(doc.keywords.join(" "));
  const body = normalizeText([doc.answer, ...doc.steps].join(" "));
  let total = 0;
  let matched = 0;

  for (const variants of variantGroups) {
    let best = 0;
    for (const variant of variants) {
      const inQuestion = tokenInText(variant, question);
      const inKeywords = tokenInText(variant, keywords);
      const inBody = tokenInText(variant, body);
      const score = Math.max(inQuestion * 60, inKeywords * 45, inBody * 22);
      if (score > best) best = score;
    }
    if (best > 0) matched += 1;
    total += best;
  }

  for (const term of extraTerms) {
    if (question.includes(term)) total += 25;
    else if (keywords.includes(term)) total += 18;
  }

  if (variantGroups.length === 0) return 0;
  const coverage = matched / variantGroups.length;
  if (coverage === 0) return 0;
  // Answers covering every word of the question rank far above partial matches.
  return Math.round(total * (0.35 + 0.65 * coverage));
}

export function searchHelpDocs(
  query: string,
  docs: HelpDoc[],
  synonyms: Map<string, string[]>,
): HelpSearchOutcome {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return { strength: "none", matches: [] };

  const variantGroups = expandTokens(tokens, synonyms);
  const extraTerms = phraseBoost(normalizeText(query), synonyms);

  const matches: HelpMatch[] = [];
  for (const doc of docs) {
    const score = scoreDoc(variantGroups, extraTerms, doc);
    if (score > 0) matches.push({ doc, score });
  }
  matches.sort((a, b) => b.score - a.score);
  const top = matches.slice(0, 5);

  if (top.length === 0) return { strength: "none", matches: [] };

  const best = top[0]!;
  const runnerUp = top[1]?.score ?? 0;
  const strongThreshold = 45 * tokens.length;
  const weakThreshold = 20 * tokens.length;

  if (best.score >= strongThreshold && best.score >= runnerUp * 1.4) {
    return { strength: "strong", matches: top };
  }
  if (best.score >= weakThreshold) {
    return { strength: "multiple", matches: top };
  }
  return { strength: "weak", matches: top };
}
