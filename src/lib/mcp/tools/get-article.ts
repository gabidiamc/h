import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { jsonResult, requireAuth } from "../supabase";

export default defineTool({
  name: "get_article",
  title: "Ver artículo",
  description:
    "Devuelve un artículo completo con sus traducciones (título, resumen y bloques de contenido) por id o slug.",
  inputSchema: {
    id: z.string().describe("Id del artículo.").optional(),
    slug: z.string().describe("Slug del artículo.").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, slug }, ctx) => {
    if (!id && !slug) throw new ToolError("Indique el id o el slug del artículo.");
    const supabase = requireAuth(ctx);
    const query = supabase.from("articles").select("*, article_translations(*)").limit(1);
    const { data, error } = id ? await query.eq("id", id) : await query.eq("slug", slug!);
    if (error) throw new ToolError(error.message);
    const article = data?.[0];
    if (!article) throw new ToolError("No se encontró ese artículo.");
    return jsonResult({ articulo: article });
  },
});
