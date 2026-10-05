/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from "@google/genai";
import type { Block } from "@/lib/content";
import type {
  ArticleTranslationRequest,
  ArticleTranslationResult,
  CategoryTranslationRequest,
  CategoryTranslationResult,
  TextTranslationRequest,
  TextTranslationResult,
  TranslationProvider,
} from "../types";
import { validateArticleTranslation } from "../validator";

export class GeminiTranslationProvider implements TranslationProvider {
  readonly name = "Google Gemini";

  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY no está configurada en las variables de entorno del servidor.",
      );
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  async translateArticle(request: ArticleTranslationRequest): Promise<ArticleTranslationResult> {
    const ai = this.getClient();
    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];

    const prompt = `You are the official institutional translator for Des Moines Public Schools (DMPS) in Iowa, USA.
Translate the following educational article from Spanish into natural, clear, and culturally appropriate American English for school families.

CRITICAL RULES:
1. PRESERVE STRUCTURE: You must output the EXACT same number of blocks in the EXACT same order and with the EXACT same "type" and "id" fields.
2. NO URL MODIFICATIONS: Every "url", "href", "src", and web link must remain 100% UNCHANGED. Never translate or alter URLs or email addresses.
3. IMAGES & MEDIA: In "image" blocks, keep the "url" property identical. Only translate "alt" and "caption" if they contain human-readable Spanish text. In "video" blocks, keep the "url" property identical.
4. LINKS: In "link" blocks, keep the "url" property identical. Only translate the "label" text. In HTML "<a href="...">label</a>", only translate the visible label.
5. PROPER NAMES: Keep proper names unchanged: Des Moines Public Schools, DMPS, Lincoln High School, East High School, Roosevelt High School, North High School, Hoover High School, Central Campus, Central Academy, Infinite Campus, DART, Railsplitters, Scarlets, Silver Cord, BFL, etc.
6. NO HALLUCINATIONS: Do not invent, alter, or remove dates, phone numbers, addresses, times, or facts. Translate accurately without summarizing or embellishing.
7. HTML & FORMATTING: In paragraph blocks, preserve all HTML tags (<p>, <strong>, <em>, <a>, <img>, <ul>, <ol>, <li>, <blockquote>, etc.), CSS styles, and attributes. Only translate text content.

INPUT SPANISH CONTENT:
Title: ${JSON.stringify(request.title)}
Summary / Description: ${JSON.stringify(request.summary || "")}
Category: ${JSON.stringify(request.categoryName || "")}
Blocks JSON:
${JSON.stringify(request.blocks, null, 2)}

RESPONSE FORMAT:
You MUST respond with a valid, clean JSON object matching this schema:
{
  "title": "Translated article title in English",
  "summary": "Translated summary in English (or null if empty)",
  "categoryName": "Translated category name in English (or null)",
  "blocks": [
    /* Array of blocks matching the input structure, with translated textual properties */
  ]
}`;

    let lastError: Error | null = null;
    let usedModel = "";

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const rawText = response.text?.trim() || "";
        if (!rawText) {
          throw new Error("El modelo de IA devolvió una respuesta vacía.");
        }

        const parsed = JSON.parse(rawText);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("La respuesta de la IA no es un objeto JSON válido.");
        }

        const translatedTitle = String(parsed.title || "").trim();
        const translatedSummary = parsed.summary ? String(parsed.summary).trim() : null;
        const translatedCategory = parsed.categoryName ? String(parsed.categoryName).trim() : null;
        const rawTranslatedBlocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];

        // Ensure structural integrity: sanitize and enforce original IDs and URLs
        const sanitizedBlocks: Block[] = request.blocks.map((origBlock, idx) => {
          const transBlock = rawTranslatedBlocks[idx];
          if (!transBlock || transBlock.type !== origBlock.type) {
            // If the model mismatched a block, fallback to original block with translated text if available
            return origBlock;
          }

          // Enforce identical IDs and media URLs from original
          const merged: any = { ...transBlock, type: origBlock.type };
          if ((origBlock as any).id) merged.id = (origBlock as any).id;

          if (origBlock.type === "image") {
            merged.url = (origBlock as any).url; // Guarantee URL is strictly identical
          } else if (origBlock.type === "video") {
            merged.url = (origBlock as any).url;
          } else if (origBlock.type === "link") {
            merged.url = (origBlock as any).url;
          }

          return merged as Block;
        });

        const validation = validateArticleTranslation(
          request,
          sanitizedBlocks,
          translatedTitle,
          translatedSummary,
        );

        usedModel = model;

        return {
          title: translatedTitle,
          summary: translatedSummary,
          categoryName: translatedCategory,
          blocks: sanitizedBlocks,
          provider: `${this.name} (${usedModel})`,
          model: usedModel,
          validation,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[GeminiTranslationProvider] Model ${model} failed:`, err?.message);
      }
    }

    throw lastError || new Error("Todos los modelos de Gemini fallaron al traducir el artículo.");
  }

  async translateCategory(request: CategoryTranslationRequest): Promise<CategoryTranslationResult> {
    const ai = this.getClient();
    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];

    const prompt = `You are an educational translator for Des Moines Public Schools (DMPS) in Iowa, USA.
Translate the following school category name and short description from Spanish into clear, natural American English for parents and students.

RULES:
- Preserve proper names (Lincoln, East, Roosevelt, DMPS, DART, etc.).
- Do not add or remove information.
- Output ONLY valid JSON:
{
  "name": "Translated category name in English",
  "description": "Translated short description in English (or null)"
}

INPUT:
Name: ${JSON.stringify(request.name)}
Description: ${JSON.stringify(request.description || "")}`;

    let lastError: Error | null = null;
    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const raw = response.text?.trim() || "";
        const parsed = JSON.parse(raw);

        return {
          name: String(parsed.name || "").trim() || request.name,
          description: parsed.description ? String(parsed.description).trim() : null,
          provider: `${this.name} (${model})`,
          model,
        };
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error("Error al traducir categoría con Gemini.");
  }

  async translateText(request: TextTranslationRequest): Promise<TextTranslationResult> {
    const ai = this.getClient();
    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];

    const prompt = `You are a professional educational translator for Des Moines Public Schools (DMPS), Iowa.
Translate the following array of Spanish texts into clear, natural American English.
Preserve all URLs, emails, phone numbers, markdown asterisks, proper names, and HTML tags.

INPUT JSON ARRAY:
${JSON.stringify(request.texts)}

Respond ONLY with a valid JSON array of translated strings in the EXACT same order and length:
["translated_string_1", "translated_string_2", ...]`;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const raw = response.text?.trim() || "";
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === request.texts.length) {
          return {
            translations: parsed.map(String),
            provider: `${this.name} (${model})`,
            model,
          };
        }
      } catch (err) {
        console.warn(`[GeminiTranslationProvider text] Model ${model} failed:`, err);
      }
    }

    throw new Error("No se pudo traducir los textos con Gemini.");
  }
}
