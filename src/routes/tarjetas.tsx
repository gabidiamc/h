import { createFileRoute } from "@tanstack/react-router";
import { ShopShell } from "@/components/ShopShell";

export const Route = createFileRoute("/tarjetas")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tarjetas de regalo — Lazo Eterno" },
      {
        name: "description",
        content: "Regala una tarjeta digital y deja que elijan su ramo favorito.",
      },
      { property: "og:title", content: "Tarjetas de regalo — Lazo Eterno" },
      {
        property: "og:description",
        content: "Regala una tarjeta digital y deja que elijan su ramo favorito.",
      },
    ],
  }),
  component: () => <ShopShell tab="tarjetas" />,
});
