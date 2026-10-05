import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { jsonResult, requireAuth } from "../supabase";

export default defineTool({
  name: "list_events",
  title: "Ver calendario",
  description:
    "Lista eventos del calendario escolar (días sin clases, conferencias de padres, festivos, inicio de clases) ordenados por fecha.",
  inputSchema: {
    from: z.string().describe("Fecha inicial en formato YYYY-MM-DD.").optional(),
    to: z.string().describe("Fecha final en formato YYYY-MM-DD.").optional(),
    school_id: z.string().describe("'lincoln', 'east' o vacío para todo el distrito.").optional(),
    limit: z.number().describe("Máximo de eventos (por defecto 30).").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, school_id, limit }, ctx) => {
    const supabase = requireAuth(ctx);
    let request = supabase
      .from("events")
      .select("*, event_translations(language_code, title, description)")
      .order("start_date", { ascending: true })
      .limit(Math.min(limit ?? 30, 100));
    if (from) request = request.gte("start_date", from);
    if (to) request = request.lte("start_date", to);
    if (school_id) request = request.eq("school_id", school_id);
    const { data, error } = await request;
    if (error) throw new ToolError(error.message);
    return jsonResult({ total: data?.length ?? 0, eventos: data ?? [] });
  },
});
