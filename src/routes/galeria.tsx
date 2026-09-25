import { createFileRoute } from "@tanstack/react-router";
import { ShopShell } from "@/components/ShopShell";

export const Route = createFileRoute("/galeria")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Galería de trabajos — Lazo Eterno" },
      {
        name: "description",
        content: "Fotos de ramos, cajas y arreglos entregados a clientas felices.",
      },
      { property: "og:title", content: "Galería de trabajos — Lazo Eterno" },
      {
        property: "og:description",
        content: "Fotos de ramos, cajas y arreglos entregados a clientas felices.",
      },
    ],
  }),
  component: () => <ShopShell tab="galeria" />,
});
