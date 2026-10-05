import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { jsonResult, requireAuth } from "../supabase";

export default defineTool({
  name: "list_announcements",
  title: "Ver anuncios",
  description: "Lista los anuncios y avisos del sitio con su texto por idioma, nivel y vigencia.",
  inputSchema: {
    school_id: z.string().describe("'lincoln', 'east' o vacío para todo el distrito.").optional(),
    limit: z.number().describe("Máximo de anuncios (por defecto 20).").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ school_id, limit }, ctx) => {
    const supabase = requireAuth(ctx);
    let request = supabase
      .from("announcements")
      .select("*, announcement_translations(language_code, title, message)")
      .order("created_at", { ascending: false })
      .limit(Math.min(limit ?? 20, 50));
    if (school_id) request = request.eq("school_id", school_id);
    const { data, error } = await request;
    if (error) throw new ToolError(error.message);
    return jsonResult({ total: data?.length ?? 0, anuncios: data ?? [] });
  },
});
