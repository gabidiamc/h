import { createFileRoute } from "@tanstack/react-router";
import { ShopShell } from "@/components/ShopShell";

export const Route = createFileRoute("/calendario")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Calendario de entregas — Lazo Eterno" },
      {
        name: "description",
        content: "Consulta fechas disponibles y aparta tu entrega con anticipación.",
      },
      { property: "og:title", content: "Calendario de entregas — Lazo Eterno" },
      {
        property: "og:description",
        content: "Consulta fechas disponibles y aparta tu entrega con anticipación.",
      },
    ],
  }),
  component: () => <ShopShell tab="calendario" />,
});
