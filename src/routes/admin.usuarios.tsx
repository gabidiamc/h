import { createFileRoute } from "@tanstack/react-router";

import { CrudManager } from "@/components/admin/crud-manager";

export const Route = createFileRoute("/admin/usuarios")({
  component: () => (
    <CrudManager
      table="admin_invitations"
      title="Usuarios e invitaciones"
      description="El registro es solo por invitación: agrega el correo autorizado y su rol. La cuenta se activa cuando la persona se registra con ese correo."
      orderBy="created_at"
      columns={[
        { name: "email", label: "Correo" },
        { name: "role", label: "Rol" },
        { name: "status", label: "Estado" },
        { name: "expires_at", label: "Vence" },
      ]}
      defaults={{
        email: "",
        role: "editor",
        status: "invited",
        permissions: {},
        token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      }}
      fields={[
        { name: "email", label: "Correo autorizado", required: true },
        { name: "full_name", label: "Nombre" },
        {
          name: "role",
          label: "Rol",
          type: "select",
          required: true,
          options: [
            { value: "super_admin", label: "Administrador principal" },
            { value: "admin", label: "Administrador" },
            { value: "content_admin", label: "Administrador de contenido" },
            { value: "calendar_admin", label: "Administrador de calendario" },
            { value: "editor", label: "Editor" },
            { value: "translator", label: "Traductor" },
            { value: "reviewer", label: "Revisor" },
          ],
        },
        {
          name: "status",
          label: "Estado",
          type: "select",
          options: [
            { value: "invited", label: "Invitado" },
            { value: "active", label: "Activo" },
            { value: "revoked", label: "Revocado" },
          ],
        },
        { name: "expires_at", label: "Vence", type: "datetime" },
        { name: "notes", label: "Notas", type: "textarea" },
      ]}
    />
  ),
});
