import { auth, defineMcp } from "@lovable.dev/mcp-js";

import createAnnouncementTool from "./tools/create-announcement";
import getArticleTool from "./tools/get-article";
import listAnnouncementsTool from "./tools/list-announcements";
import listEventsTool from "./tools/list-events";
import searchArticlesTool from "./tools/search-articles";

// El emisor OAuth debe ser el host directo de Supabase (el ref sobrevive a la publicación).
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "familiasdmps",
  title: "familiasdmps",
  version: "0.1.0",
  instructions:
    "Herramientas de DMPS Family Info (Lincoln High y East High). Use search_articles y get_article para consultar artículos informativos, list_events para el calendario escolar, list_announcements para avisos y create_announcement para publicar un aviso nuevo. Cada contenido pertenece a una escuela: 'lincoln', 'east' o vacío para todo el distrito.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchArticlesTool,
    getArticleTool,
    listEventsTool,
    listAnnouncementsTool,
    createAnnouncementTool,
  ],
});
