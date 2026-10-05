/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/manifest")({
  server: {
    handlers: {
      GET: async () => {
        let pwaIcon = "/icons/dmps-info-512.png?v=2";
        let pwaIcon192 = "/icons/dmps-info-192.png?v=2";

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await (supabaseAdmin as any)
            .from("appearance_settings")
            .select("pwa_icon_url, branding_version, settings")
            .eq("id", "default")
            .maybeSingle();

          const customPwa = data?.pwa_icon_url || (data?.settings as any)?.pwa_icon_url;
          if (customPwa) {
            const v = data?.branding_version || Date.now().toString();
            pwaIcon = customPwa.includes("?") ? `${customPwa}&v=${v}` : `${customPwa}?v=${v}`;
            pwaIcon192 = pwaIcon;
          }
        } catch {
          // Fall back gracefully to standard public icons
        }

        const manifest = {
          id: "/",
          name: "DMPS Info",
          short_name: "DMPS Info",
          description: "Información escolar clara, útil y accesible para las familias.",
          lang: "es",
          dir: "ltr",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait-primary",
          background_color: "#FFFFFF",
          theme_color: "#06234B",
          icons: [
            {
              src: pwaIcon192,
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: pwaIcon,
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: pwaIcon192,
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: pwaIcon,
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        };

        return new Response(JSON.stringify(manifest, null, 2), {
          headers: {
            "Content-Type": "application/manifest+json; charset=utf-8",
            "Cache-Control": "public, max-age=60, s-maxage=60",
          },
        });
      },
    },
  },
});
