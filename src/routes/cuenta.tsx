import { createFileRoute } from "@tanstack/react-router";
import { ShopShell } from "@/components/ShopShell";

export const Route = createFileRoute("/cuenta")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mi cuenta — Hecho por Monse" },
      { name: "description", content: "Revisa tus pedidos, cotizaciones y puntos de lealtad." },
      { property: "og:title", content: "Mi cuenta — Hecho por Monse" },
      {
        property: "og:description",
        content: "Revisa tus pedidos, cotizaciones y puntos de lealtad.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ShopShell tab="cuenta" />,
});
