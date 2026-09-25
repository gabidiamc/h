import { createFileRoute } from "@tanstack/react-router";
import { ShopShell } from "@/components/ShopShell";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Hecho por Monse — Ramos de listón satinado hechos a mano" },
      {
        name: "description",
        content:
          "Ramos de flores de listón satinado, regalos románticos, cajas sorpresa y reservas personalizadas que duran para siempre.",
      },
      { property: "og:title", content: "Hecho por Monse — Ramos de listón satinado hechos a mano" },
      {
        property: "og:description",
        content:
          "Ramos eternos de listón satinado, cajas sorpresa y regalos personalizados hechos a mano.",
      },
    ],
  }),
  component: () => <ShopShell tab="inicio" />,
});
