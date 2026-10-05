/* eslint-disable @typescript-eslint/no-explicit-any */
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

/**
 * OpenAI Translation Provider implementation.
 * Prepared for plug-and-play activation via OPENAI_API_KEY environment variable.
 */
export class OpenAITranslationProvider implements TranslationProvider {
  readonly name = "OpenAI (GPT-4o)";

  private getApiKey(): string {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OPENAI_API_KEY no está configurada en las variables de entorno del servidor.",
      );
    }
    return key;
  }

  async translateArticle(request: ArticleTranslationRequest): Promise<ArticleTranslationResult> {
    const apiKey = this.getApiKey();
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    const prompt = `You are an educational translator for Des Moines Public Schools (DMPS), Iowa, USA.
Translate the following educational article from Spanish into natural, clear, and culturally appropriate American English for school families.

CRITICAL RULES:
1. Output the EXACT same number of blocks in the EXACT same order and with the EXACT same "type" and "id" fields.
2. Every "url", "href", and "src" must remain 100% UNCHANGED. Never alter URLs or email addresses.
3. Keep image "url" identical. Only translate "alt" and "caption" if they contain human-readable Spanish text.
4. Keep link "url" identical. Only translate the "label" text.
5. Keep proper names unchanged (DMPS, Lincoln High School, East High School, Roosevelt High School, Central Campus, DART, etc.).
6. In paragraph blocks, preserve all HTML tags and CSS styles exactly.

INPUT SPANISH CONTENT:
Title: ${JSON.stringify(request.title)}
Summary / Description: ${JSON.stringify(request.summary || "")}
Category: ${JSON.stringify(request.categoryName || "")}
Blocks JSON:
${JSON.stringify(request.blocks, null, 2)}

Respond with a JSON object matching this schema:
{
  "title": "Translated article title in English",
  "summary": "Translated summary in English",
  "categoryName": "Translated category name in English",
  "blocks": [...]
}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`OpenAI error (${res.status}): ${errData?.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("OpenAI devolvió una respuesta vacía.");
    }

    const parsed = JSON.parse(content);
    const translatedTitle = String(parsed.title || "").trim();
    const translatedSummary = parsed.summary ? String(parsed.summary).trim() : null;
    const translatedCategory = parsed.categoryName ? String(parsed.categoryName).trim() : null;
    const rawBlocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];

    const sanitizedBlocks: Block[] = request.blocks.map((origBlock, idx) => {
      const transBlock = rawBlocks[idx];
      if (!transBlock || transBlock.type !== origBlock.type) {
        return origBlock;
      }
      const merged: any = { ...transBlock, type: origBlock.type };
      if ((origBlock as any).id) merged.id = (origBlock as any).id;
      if (origBlock.type === "image") merged.url = (origBlock as any).url;
      if (origBlock.type === "video") merged.url = (origBlock as any).url;
      if (origBlock.type === "link") merged.url = (origBlock as any).url;
      return merged as Block;
    });

    const validation = validateArticleTranslation(
      request,
      sanitizedBlocks,
      translatedTitle,
      translatedSummary,
    );

    return {
      title: translatedTitle,
      summary: translatedSummary,
      categoryName: translatedCategory,
      blocks: sanitizedBlocks,
      provider: `${this.name} (${model})`,
      model,
      validation,
    };
  }

  async translateCategory(request: CategoryTranslationRequest): Promise<CategoryTranslationResult> {
    const apiKey = this.getApiKey();
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    const prompt = `You are an educational translator for Des Moines Public Schools (DMPS), Iowa.
Translate the following school category name and short description from Spanish into clear, natural American English for parents and students.
Respond with JSON:
{
  "name": "Translated name",
  "description": "Translated description (or null)"
}

INPUT:
Name: ${JSON.stringify(request.name)}
Description: ${JSON.stringify(request.description || "")}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenAI error: ${err?.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");

    return {
      name: String(parsed.name || "").trim() || request.name,
      description: parsed.description ? String(parsed.description).trim() : null,
      provider: `${this.name} (${model})`,
      model,
    };
  }

  async translateText(request: TextTranslationRequest): Promise<TextTranslationResult> {
    const apiKey = this.getApiKey();
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    const prompt = `Translate this JSON array of Spanish strings into English for Des Moines Public Schools.
Preserve all URLs, emails, numbers, and proper school names.
Output a JSON object: { "translations": ["string1", "string2", ...] }

INPUT:
${JSON.stringify(request.texts)}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenAI error: ${err?.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    const translations = Array.isArray(parsed.translations)
      ? parsed.translations.map(String)
      : request.texts;

    return {
      translations,
      provider: `${this.name} (${model})`,
      model,
    };
  }
}
