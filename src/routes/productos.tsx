import { createFileRoute } from "@tanstack/react-router";
import { ShopShell } from "@/components/ShopShell";

export const Route = createFileRoute("/productos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Catálogo de ramos — Lazo Eterno" },
      {
        name: "description",
        content: "Explora ramos de listón satinado, cajas sorpresa y detalles listos para regalar.",
      },
      { property: "og:title", content: "Catálogo de ramos — Lazo Eterno" },
      {
        property: "og:description",
        content: "Explora ramos de listón satinado, cajas sorpresa y detalles listos para regalar.",
      },
    ],
  }),
  component: () => <ShopShell tab="productos" />,
});
