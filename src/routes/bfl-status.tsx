import { createFileRoute } from "@tanstack/react-router";
import { ExternalServiceView } from "@/components/external-service-view";
import { PublicShell } from "@/components/public-shell";

export const Route = createFileRoute("/bfl-status")({
  head: () => ({
    meta: [
      { title: "BFL Status — DMPS Info" },
      {
        name: "description",
        content:
          "Sistema para consultar la disponibilidad del personal, administrar filas, asignar familias y acceder al kiosco durante eventos.",
      },
      { property: "og:title", content: "BFL Status — DMPS Info" },
      {
        property: "og:description",
        content:
          "Portal de disponibilidad de personal de apoyo bilingüe, asignación y gestión de filas de DMPS.",
      },
    ],
  }),
  component: BflStatusPage,
});

function BflStatusPage() {
  return (
    <PublicShell>
      <ExternalServiceView serviceId="bfl-status" />
    </PublicShell>
  );
}
