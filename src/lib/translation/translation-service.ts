import type {
  ArticleTranslationRequest,
  ArticleTranslationResult,
  CategoryTranslationRequest,
  CategoryTranslationResult,
  TextTranslationRequest,
  TextTranslationResult,
  TranslationProvider,
} from "./types";
import { GeminiTranslationProvider } from "./providers/gemini-provider";
import { OpenAITranslationProvider } from "./providers/openai-provider";

export class TranslationService {
  private geminiProvider: GeminiTranslationProvider;
  private openAiProvider: OpenAITranslationProvider;

  constructor() {
    this.geminiProvider = new GeminiTranslationProvider();
    this.openAiProvider = new OpenAITranslationProvider();
  }

  /**
   * Resolves the active provider according to environment configuration.
   * Priority:
   * 1. Google Gemini (default for AI Studio applets)
   * 2. OpenAI (if explicitly selected or if Gemini key is missing and OpenAI key is set)
   */
  getProvider(preferredProvider?: string): TranslationProvider {
    const configProvider = preferredProvider || process.env.AI_TRANSLATION_PROVIDER || "gemini";

    if (configProvider === "openai" && process.env.OPENAI_API_KEY) {
      return this.openAiProvider;
    }

    if (process.env.GEMINI_API_KEY) {
      return this.geminiProvider;
    }

    if (process.env.OPENAI_API_KEY) {
      return this.openAiProvider;
    }

    // Default to Gemini (will surface missing key error if not configured)
    return this.geminiProvider;
  }

  /**
   * Translates an article while rigorously enforcing Phase 20 & 21 structural integrity.
   */
  async translateArticle(
    request: ArticleTranslationRequest,
    preferredProvider?: string,
  ): Promise<ArticleTranslationResult> {
    if (!request.title && (!request.blocks || request.blocks.length === 0)) {
      throw new Error("No hay contenido en español para traducir.");
    }

    const provider = this.getProvider(preferredProvider);
    const result = await provider.translateArticle(request);

    // Strict validation check
    if (!result.validation.valid) {
      const errorDetails = result.validation.errors.join("; ");
      throw new Error(
        `Fallo de validación estructural en la traducción: ${errorDetails}. Se rechaza para proteger el contenido original.`,
      );
    }

    return result;
  }

  /**
   * Translates category name and description.
   */
  async translateCategory(
    request: CategoryTranslationRequest,
    preferredProvider?: string,
  ): Promise<CategoryTranslationResult> {
    if (!request.name?.trim()) {
      throw new Error("El nombre de la categoría no puede estar vacío.");
    }

    const provider = this.getProvider(preferredProvider);
    return await provider.translateCategory(request);
  }

  /**
   * Translates an array of strings.
   */
  async translateText(
    request: TextTranslationRequest,
    preferredProvider?: string,
  ): Promise<TextTranslationResult> {
    const provider = this.getProvider(preferredProvider);
    return await provider.translateText(request);
  }
}

export const translationService = new TranslationService();
