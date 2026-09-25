import { createFileRoute } from "@tanstack/react-router";
import { ShopShell } from "@/components/ShopShell";

export const Route = createFileRoute("/personalizados")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pedidos personalizados — Lazo Eterno" },
      {
        name: "description",
        content: "Cuéntanos tu idea y cotizamos un ramo o caja sorpresa hecha a tu medida.",
      },
      { property: "og:title", content: "Pedidos personalizados — Lazo Eterno" },
      {
        property: "og:description",
        content: "Cuéntanos tu idea y cotizamos un ramo o caja sorpresa hecha a tu medida.",
      },
    ],
  }),
  component: () => <ShopShell tab="personalizados" />,
});
