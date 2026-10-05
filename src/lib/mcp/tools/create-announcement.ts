import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { jsonResult, requireAuth, textId } from "../supabase";

export default defineTool({
  name: "create_announcement",
  title: "Crear anuncio",
  description:
    "Crea un anuncio nuevo con su texto en español (y en inglés si se indica). Requiere una cuenta del personal con permisos de contenido.",
  inputSchema: {
    title: z.string().describe("Título del anuncio en español."),
    message: z.string().describe("Mensaje del anuncio en español."),
    title_en: z.string().describe("Título en inglés (opcional).").optional(),
    message_en: z.string().describe("Mensaje en inglés (opcional).").optional(),
    level: z.string().describe("Nivel: 'info', 'warning' o 'urgent'.").optional(),
    school_id: z.string().describe("'lincoln', 'east' o vacío para todo el distrito.").optional(),
    show_on_home: z.boolean().describe("Mostrar en la portada.").optional(),
    link_url: z.string().describe("Enlace opcional del anuncio.").optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const supabase = requireAuth(ctx);
    const id = textId("announcement");
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        id,
        level: input.level ?? "info",
        school_id: input.school_id ?? null,
        show_on_home: input.show_on_home ?? true,
        link_url: input.link_url ?? null,
        status: "published",
        starts_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new ToolError(error.message);

    const translations = [
      { announcement_id: id, language_code: "es", title: input.title, message: input.message },
      ...(input.title_en
        ? [
            {
              announcement_id: id,
              language_code: "en",
              title: input.title_en,
              message: input.message_en ?? input.message,
            },
          ]
        : []),
    ];
    const { error: translationError } = await supabase
      .from("announcement_translations")
      .insert(translations);
    if (translationError) throw new ToolError(translationError.message);

    return jsonResult({ creado: data, traducciones: translations.length });
  },
});
