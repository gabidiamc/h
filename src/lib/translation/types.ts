import type { Block } from "@/lib/content";

export type SupportedLanguage = "es" | "en";

export type TranslationStatus =
  "not_created" | "in_progress" | "ready" | "saved" | "outdated" | "failed";

export interface ArticleTranslationRequest {
  title: string;
  summary: string | null;
  categoryName?: string | null;
  blocks: Block[];
  sourceLang: "es";
  targetLang: "en";
}

export interface ArticleTranslationResult {
  title: string;
  summary: string | null;
  categoryName?: string | null;
  blocks: Block[];
  provider: string;
  model?: string;
  validation: StructuralValidationResult;
}

export interface CategoryTranslationRequest {
  name: string;
  description: string | null;
  sourceLang: "es";
  targetLang: "en";
}

export interface CategoryTranslationResult {
  name: string;
  description: string | null;
  provider: string;
  model?: string;
}

export interface TextTranslationRequest {
  texts: string[];
  sourceLang: "es";
  targetLang: "en";
}

export interface TextTranslationResult {
  translations: string[];
  provider: string;
  model?: string;
}

export interface StructuralValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  blockCountMatch: boolean;
  blockTypesMatch: boolean;
  blockIdsMatch: boolean;
  urlsPreserved: boolean;
  imagesPreserved: boolean;
}

export interface TranslationProvider {
  readonly name: string;
  translateArticle(request: ArticleTranslationRequest): Promise<ArticleTranslationResult>;
  translateCategory(request: CategoryTranslationRequest): Promise<CategoryTranslationResult>;
  translateText(request: TextTranslationRequest): Promise<TextTranslationResult>;
}
