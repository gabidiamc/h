import { createFileRoute } from "@tanstack/react-router";

/**
 * Legacy storage route neutralized.
 * All business and content data is persisted exclusively in Supabase PostgreSQL.
 */
export const Route = createFileRoute("/api/storage/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = (params as { _splat?: string })._splat || "";
        const parts = splat.split("/").filter(Boolean);
        const target = parts[0] || "all";

        if (target === "all") {
          return new Response(JSON.stringify({ success: true, data: {} }), {
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store, no-cache, must-revalidate",
            },
          });
        }

        return new Response(JSON.stringify({ success: true, table: target, data: [] }), {
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store, no-cache, must-revalidate",
          },
        });
      },

      POST: async ({ params }) => {
        const splat = (params as { _splat?: string })._splat || "";
        const parts = splat.split("/").filter(Boolean);
        const target = parts[0] || "bulk";

        return new Response(JSON.stringify({ success: true, table: target }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
