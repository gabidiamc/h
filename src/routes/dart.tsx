import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dart")({
  head: () => ({
    meta: [
      {
        title: "Aplicación Escolar Oficial — DMPS Family Info",
      },
      {
        name: "description",
        content:
          "Acceso directo al artículo, enlaces de descarga e información de la aplicación oficial para estudiantes y familias del distrito.",
      },
    ],
  }),
  component: DartRouteGateway,
});

function DartRouteGateway() {
  // Directs cleanly to the canonical public transit route inside DMPS Info
  return <Navigate to="/transporte/dart" replace />;
}
