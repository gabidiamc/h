import { createFileRoute } from "@tanstack/react-router";

import { CrudManager } from "@/components/admin/crud-manager";

export const Route = createFileRoute("/admin/solicitudes")({
  component: () => (
    <CrudManager
      table="update_requests"
      title="Solicitudes de las familias"
      description="Reportes de información desactualizada o enlaces rotos enviados desde el sitio público."
      orderBy="created_at"
      columns={[
        { name: "kind", label: "Tipo" },
        { name: "page_url", label: "Página" },
        { name: "status", label: "Estado" },
        { name: "created_at", label: "Recibido" },
      ]}
      defaults={{ kind: "update", message: "", status: "open" }}
      fields={[
        {
          name: "status",
          label: "Estado",
          type: "select",
          options: [
            { value: "open", label: "Pendiente" },
            { value: "in_progress", label: "En proceso" },
            { value: "resolved", label: "Resuelta" },
            { value: "dismissed", label: "Descartada" },
          ],
        },
        { name: "message", label: "Mensaje", type: "textarea" },
        { name: "resolution_note", label: "Nota de resolución", type: "textarea" },
      ]}
    />
  ),
});
