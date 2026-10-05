import { createFileRoute } from "@tanstack/react-router";
import { AdminDeportesActividadesPage } from "./admin.actividades";

export const Route = createFileRoute("/admin/deportes-actividades")({
  component: AdminDeportesActividadesPage,
});
