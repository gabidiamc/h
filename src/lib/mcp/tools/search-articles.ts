import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { jsonResult, requireAuth } from "../supabase";

export default defineTool({
  name: "search_articles",
  title: "Buscar artículos",
  description:
    "Busca artículos informativos del sitio por texto en el título o resumen. Devuelve id, slug, escuela y estado.",
  inputSchema: {
    query: z.string().describe("Texto a buscar en el título o resumen del artículo.").optional(),
    school_id: z
      .string()
      .describe("Filtra por escuela: 'lincoln', 'east' o vacío para todo el distrito.")
      .optional(),
    limit: z.number().describe("Máximo de artículos a devolver (por defecto 20).").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, school_id, limit }, ctx) => {
    const supabase = requireAuth(ctx);
    let request = supabase
      .from("article_translations")
      .select(
        "article_id, language_code, title, summary, articles(id, slug, status, school_id, published_at)",
      )
      .limit(Math.min(limit ?? 20, 50));
    if (query) request = request.or(`title.ilike.%${query}%,summary.ilike.%${query}%`);
    const { data, error } = await request;
    if (error) throw new ToolError(error.message);
    const rows = (data ?? []).filter((row) => {
      const article = (row as { articles?: { school_id?: string | null } }).articles;
      if (!article) return false;
      if (!school_id) return true;
      return article.school_id === school_id;
    });
    return jsonResult({ total: rows.length, articulos: rows });
  },
});
