import { createFileRoute } from "@tanstack/react-router";
import { ShopShell } from "@/components/ShopShell";

export const Route = createFileRoute("/panel")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel de la dueña — Lazo Eterno" },
      {
        name: "description",
        content: "Administración del taller: pedidos, catálogo, fechas y clientes.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ShopShell tab="admin" />,
});
