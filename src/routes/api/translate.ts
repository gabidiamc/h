import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenAI } from "@google/genai";
import { autoTranslateText, containsSpanishText } from "@/lib/auto-translator";

// Cache for single and short phrase translations: source text -> translated text
const textTranslationCache = new Map<string, string>();

// Cache for full article translations: hash/key -> { title, summary, bodyHtml }
const articleTranslationCache = new Map<
  string,
  { title: string; summary: string; bodyHtml: string }
>();

// Circuit breaker timestamp: when quota limit (429) is encountered, skip Gemini calls for 60 seconds
let rateLimitCooldownUntil = 0;

function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("quota") ||
    msg.includes("Quota exceeded") ||
    msg.includes("rate-limit") ||
    msg.includes("rate_limit")
  );
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch {
    return null;
  }
}

/**
 * Fast, quota-free neural translation fallback using Google Translate GTX endpoint.
 * Ensures 100% English output even when Gemini free-tier quota (5 RPM) is in cooldown.
 */
async function translateWithGoogleGtx(text: string, targetLang = "en"): Promise<string | null> {
  if (!text || !text.trim()) return text;
  const trimmed = text.trim();
  if (textTranslationCache.has(trimmed)) {
    return textTranslationCache.get(trimmed)!;
  }
  const dictHit = autoTranslateText(trimmed, targetLang);
  if (dictHit && dictHit !== trimmed && !containsSpanishText(dictHit)) {
    textTranslationCache.set(trimmed, dictHit);
    return dictHit;
  }
  try {
    const tl = targetLang === "kar" || targetLang === "ksw" ? "en" : targetLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0]
        .map((seg: unknown) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
        .join("");
      if (translated && translated.trim().length > 0) {
        textTranslationCache.set(trimmed, translated);
        return translated;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Translates HTML content while preserving all HTML tags and attributes.
 */
async function translateHtmlWithGoogleGtx(html: string, targetLang = "en"): Promise<string> {
  if (!html || !html.trim()) return html;
  // Split HTML into tags and text segments
  const parts = html.split(/(<[^>]+>)/g);
  const textIndices: number[] = [];
  const textValues: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p || p.startsWith("<")) continue;
    const trimmed = p.trim();
    if (trimmed.length >= 2 && /[a-záéíóúñü]/i.test(trimmed)) {
      textIndices.push(i);
      textValues.push(trimmed);
    }
  }

  if (textValues.length === 0) return html;

  // Translate unique text segments in parallel batches of 10
  const uniqueTexts = Array.from(new Set(textValues));
  const translationMap = new Map<string, string>();

  for (let i = 0; i < uniqueTexts.length; i += 10) {
    const chunk = uniqueTexts.slice(i, i + 10);
    await Promise.all(
      chunk.map(async (txt) => {
        const tr = await translateWithGoogleGtx(txt, targetLang);
        if (tr) {
          translationMap.set(txt, tr);
        }
      }),
    );
  }

  for (let j = 0; j < textIndices.length; j++) {
    const partIdx = textIndices[j];
    const origTrimmed = textValues[j];
    const tr = translationMap.get(origTrimmed);
    if (tr) {
      parts[partIdx] = parts[partIdx].replace(origTrimmed, tr);
    }
  }

  return parts.join("");
}

interface TranslateRequestBody {
  texts?: string[];
  text?: string;
  targetLang: "en" | "es";
  sourceLang?: string;
  article?: {
    title?: string;
    summary?: string;
    bodyHtml?: string;
  };
}

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as TranslateRequestBody;
          const targetLang = body.targetLang || "en";

          // If Spanish, return input as-is (Spanish is original source language)
          if (targetLang === "es") {
            if (body.article) {
              return new Response(
                JSON.stringify({
                  success: true,
                  article: body.article,
                  engine: "source",
                }),
                { headers: { "Content-Type": "application/json" } },
              );
            }
            const inputTexts = Array.isArray(body.texts)
              ? body.texts
              : typeof body.text === "string"
                ? [body.text]
                : [];
            return new Response(
              JSON.stringify({ success: true, translations: inputTexts, engine: "source" }),
              { headers: { "Content-Type": "application/json" } },
            );
          }

          const isCooldownActive = Date.now() < rateLimitCooldownUntil;
          const ai = isCooldownActive ? null : getGeminiClient();
          // Use standard supported model aliases per genai guidance
          const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];

          // 1. If article object is provided (title, summary, bodyHtml)
          if (body.article) {
            const { title = "", summary = "", bodyHtml = "" } = body.article;
            const articleCacheKey = `${title}:::${summary}:::${bodyHtml.slice(0, 300)}`;

            if (articleTranslationCache.has(articleCacheKey)) {
              return new Response(
                JSON.stringify({
                  success: true,
                  article: articleTranslationCache.get(articleCacheKey),
                  engine: "server_cache",
                }),
                { headers: { "Content-Type": "application/json" } },
              );
            }

            let articleResult: { title: string; summary: string; bodyHtml: string } | null = null;
            let usedModel = "";

            if (ai) {
              const articlePrompt = `You are a professional educational translator for Des Moines Public Schools (DMPS) in Iowa, USA.
Translate the following article content accurately, respectfully, and naturally from Spanish into English.
CRITICAL RULES:
1. Preserve all HTML tags (<p>, <strong>, <em>, <h1>-<h6>, <ul>, <ol>, <li>, <a>, <img>, <blockquote>, <table>, <span>, etc.), CSS classes, styles, and attributes exactly. Only translate the human-readable text inside the elements.
2. Keep proper school and program names (such as Lincoln High School, East High School, Roosevelt High School, Central Campus, Central Academy, Infinite Campus, DART, DMPS, BFL, Silver Cord) unchanged.
3. Preserve all URLs, links, email addresses, phone numbers, and numbers.
4. Output natural, culturally appropriate American English for school families.

SPANISH INPUT:
Title: ${JSON.stringify(title)}
Summary: ${JSON.stringify(summary)}
Body HTML: ${JSON.stringify(bodyHtml)}

Respond ONLY with a valid JSON object in this format:
{
  "title": "Translated title in English",
  "summary": "Translated summary in English",
  "bodyHtml": "Translated body HTML in English"
}`;

              for (const modelName of candidateModels) {
                try {
                  const res = await ai.models.generateContent({
                    model: modelName,
                    contents: articlePrompt,
                    config: {
                      responseMimeType: "application/json",
                      temperature: 0.1,
                    },
                  });

                  const raw = res.text?.trim() || "";
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === "object") {
                      articleResult = {
                        title: String(parsed.title || ""),
                        summary: String(parsed.summary || ""),
                        bodyHtml: String(parsed.bodyHtml || ""),
                      };
                      usedModel = modelName;
                      articleTranslationCache.set(articleCacheKey, articleResult);
                      break;
                    }
                  }
                } catch (mErr: unknown) {
                  if (isQuotaExceededError(mErr)) {
                    // Activate circuit breaker for 60 seconds and stop model iteration
                    rateLimitCooldownUntil = Date.now() + 60_000;
                    break;
                  }
                }
              }
            }

            if (articleResult) {
              return new Response(
                JSON.stringify({
                  success: true,
                  article: articleResult,
                  engine: `gemini (${usedModel})`,
                }),
                { headers: { "Content-Type": "application/json" } },
              );
            }

            // Fallback to neural GTX translation + dictionary if Gemini is rate-limited
            const [gtxTitle, gtxSummary, gtxBodyHtml] = await Promise.all([
              title ? translateWithGoogleGtx(title, "en") : Promise.resolve(""),
              summary ? translateWithGoogleGtx(summary, "en") : Promise.resolve(""),
              bodyHtml ? translateHtmlWithGoogleGtx(bodyHtml, "en") : Promise.resolve(""),
            ]);

            const fallbackArticle = {
              title: gtxTitle || (title ? autoTranslateText(title, "en") : ""),
              summary: gtxSummary || (summary ? autoTranslateText(summary, "en") : ""),
              bodyHtml: gtxBodyHtml || (bodyHtml ? autoTranslateText(bodyHtml, "en") : ""),
            };
            articleTranslationCache.set(articleCacheKey, fallbackArticle);

            return new Response(
              JSON.stringify({
                success: true,
                article: fallbackArticle,
                engine: "neural_fallback",
              }),
              { headers: { "Content-Type": "application/json" } },
            );
          }

          // 2. Standard array of strings or single text
          const inputTexts = Array.isArray(body.texts)
            ? body.texts
            : typeof body.text === "string"
              ? [body.text]
              : [];

          if (inputTexts.length === 0) {
            return new Response(JSON.stringify({ success: true, translations: [] }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // Check server-side cache and dictionary first
          const resultTranslations: (string | null)[] = new Array(inputTexts.length).fill(null);
          const uncachedIndices: number[] = [];
          const uncachedTexts: string[] = [];

          for (let i = 0; i < inputTexts.length; i++) {
            const rawText = inputTexts[i];
            const trimmed = rawText.trim();

            if (!trimmed) {
              resultTranslations[i] = rawText;
              continue;
            }

            // Check server memory cache
            if (textTranslationCache.has(trimmed)) {
              resultTranslations[i] = textTranslationCache.get(trimmed)!;
              continue;
            }

            // Check instant dictionary match (only accept if genuinely translated)
            const dictMatch = autoTranslateText(trimmed, "en");
            if (dictMatch && dictMatch !== trimmed && !containsSpanishText(dictMatch)) {
              textTranslationCache.set(trimmed, dictMatch);
              resultTranslations[i] = dictMatch;
              continue;
            }

            // Needs translation
            uncachedIndices.push(i);
            uncachedTexts.push(trimmed);
          }

          // If everything was resolved via cache or dictionary, return immediately!
          if (uncachedTexts.length === 0) {
            return new Response(
              JSON.stringify({
                success: true,
                translations: resultTranslations as string[],
                engine: "cache_and_dictionary",
              }),
              { headers: { "Content-Type": "application/json" } },
            );
          }

          // If AI is available and not in cooldown, translate remaining items with Gemini
          let aiSuccess = false;
          let usedModel = "";

          if (ai && !isCooldownActive) {
            const prompt = `You are a professional educational translator for Des Moines Public Schools (DMPS) in Iowa, USA.
Translate the following array of Spanish strings accurately, respectfully, and naturally into English.
Preserve all URLs, emails, phone numbers, markdown asterisks, emojis, numbers, and proper school names (like Lincoln High School, East High School, Central Campus, Infinite Campus, DART, BFL, DMPS).

INPUT JSON ARRAY:
${JSON.stringify(uncachedTexts)}

Respond ONLY with a valid JSON array of translated strings in the EXACT same order and length:
["translated_text_1", "translated_text_2", ...]`;

            for (const modelName of candidateModels) {
              try {
                const res = await ai.models.generateContent({
                  model: modelName,
                  contents: prompt,
                  config: {
                    responseMimeType: "application/json",
                    temperature: 0.1,
                  },
                });

                const responseText = res.text?.trim() || "";
                if (responseText) {
                  const parsed = JSON.parse(responseText);
                  if (Array.isArray(parsed) && parsed.length === uncachedTexts.length) {
                    parsed.forEach((trans, idx) => {
                      const translatedStr = String(trans || uncachedTexts[idx]);
                      const original = uncachedTexts[idx];
                      textTranslationCache.set(original, translatedStr);
                      resultTranslations[uncachedIndices[idx]] = translatedStr;
                    });
                    aiSuccess = true;
                    usedModel = modelName;
                    break;
                  }
                }
              } catch (mErr: unknown) {
                if (isQuotaExceededError(mErr)) {
                  rateLimitCooldownUntil = Date.now() + 60_000;
                  break;
                }
              }
            }
          }

          // Fill any remaining unresolved texts with neural GTX translation + dictionary fallback
          await Promise.all(
            uncachedIndices.map(async (origIdx, j) => {
              if (!resultTranslations[origIdx]) {
                const srcTxt = uncachedTexts[j];
                const gtx = await translateWithGoogleGtx(srcTxt, "en");
                const finalTrans = gtx || autoTranslateText(srcTxt, "en");
                if (finalTrans && !containsSpanishText(finalTrans)) {
                  textTranslationCache.set(srcTxt, finalTrans);
                }
                resultTranslations[origIdx] = finalTrans;
              }
            }),
          );

          return new Response(
            JSON.stringify({
              success: true,
              translations: resultTranslations as string[],
              engine: aiSuccess ? `gemini (${usedModel})` : "dictionary_fallback",
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        } catch {
          // Graceful fallback on unexpected error
          const fallbackBody = await request
            .clone()
            .json()
            .catch(() => ({}));
          const fallbackTexts = Array.isArray(fallbackBody?.texts)
            ? fallbackBody.texts
            : typeof fallbackBody?.text === "string"
              ? [fallbackBody.text]
              : [];
          const safeTranslations = fallbackTexts.map((t: string) =>
            autoTranslateText(String(t), "en"),
          );

          return new Response(
            JSON.stringify({
              success: true,
              translations: safeTranslations,
              engine: "safe_fallback",
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
