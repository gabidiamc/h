import { createFileRoute } from "@tanstack/react-router";
import { AdminDartConfigPage } from "./admin.dart.configuracion";

export const Route = createFileRoute("/admin/dart/")({
  head: () => ({
    meta: [
      { title: "Administración del Artículo de la App — DMPS Family Info" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDartConfigPage,
});
