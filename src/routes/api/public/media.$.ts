import { createFileRoute } from "@tanstack/react-router";

/**
 * Sirve públicamente los archivos que el personal sube desde el Asistente IA.
 * El depósito es privado: esta ruta es la única puerta de lectura.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..")) return new Response("No encontrado", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("ai-uploads").download(path);
        if (error || !data) return new Response("No encontrado", { status: 404 });

        return new Response(data, {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
