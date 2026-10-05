import { createFileRoute } from "@tanstack/react-router";
import { ExternalServiceView } from "@/components/external-service-view";
import { PublicShell } from "@/components/public-shell";

export const Route = createFileRoute("/voluntarios")({
  head: () => ({
    meta: [
      { title: "Portal de Voluntarios — DMPS Info" },
      {
        name: "description",
        content:
          "Encuentra oportunidades de voluntariado, consulta tus solicitudes, registra tus horas y revisa tu perfil en DMPS Connect Hub.",
      },
      { property: "og:title", content: "Portal de Voluntarios — DMPS Info" },
      {
        property: "og:description",
        content:
          "Portal central de oportunidades y registro de voluntariado para las familias y miembros de la comunidad de DMPS.",
      },
    ],
  }),
  component: VoluntariosPage,
});

function VoluntariosPage() {
  return (
    <PublicShell>
      <ExternalServiceView serviceId="voluntarios" />
    </PublicShell>
  );
}
