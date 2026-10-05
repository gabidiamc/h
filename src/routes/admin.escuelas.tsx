import { createFileRoute } from "@tanstack/react-router";

import { CrudManager } from "@/components/admin/crud-manager";

export const Route = createFileRoute("/admin/escuelas")({
  component: () => (
    <CrudManager
      table="schools"
      title="Gestión de Escuelas"
      description="Configuración de escuelas del distrito. La primera escuela activa es Abraham Lincoln High School."
      orderBy="name"
      ascending
      columns={[
        { name: "name", label: "Nombre Oficial" },
        { name: "short_name", label: "Nombre Corto" },
        { name: "district_name", label: "Distrito" },
        { name: "city", label: "Ciudad" },
        { name: "official_website_url", label: "Sitio Web" },
        { name: "is_active", label: "Activa" },
      ]}
      defaults={{
        name: "",
        short_name: "",
        slug: "",
        district_name: "Des Moines Public Schools",
        city: "Des Moines",
        state: "Iowa",
        official_website_url: "https://www.dmschools.org/",
        is_active: true,
        is_visible: true,
        display_order: 10,
      }}
      fields={[
        {
          name: "name",
          label: "Nombre de la Escuela",
          required: true,
          help: "Ej: Theodore Roosevelt High School",
        },
        { name: "short_name", label: "Nombre Corto", required: true, help: "Ej: Roosevelt" },
        {
          name: "slug",
          label: "Identificador (Slug)",
          help: "Ej: roosevelt (se genera automáticamente si se deja en blanco)",
        },
        {
          name: "district_name",
          label: "Nombre del Distrito",
          required: true,
          help: "Ej: Des Moines Public Schools",
        },
        { name: "city", label: "Ciudad", required: true, help: "Ej: Des Moines" },
        { name: "state", label: "Estado", required: true, help: "Ej: Iowa" },
        {
          name: "official_website_url",
          label: "Sitio Web Oficial (URL)",
          type: "url",
          required: true,
          help: "Ej: https://lincoln.dmschools.org/",
        },
        { name: "phone", label: "Teléfono Principal", help: "Ej: (515) 242-7500" },
        { name: "address", label: "Dirección", help: "Ej: 2600 SW 9th St" },
        { name: "is_active", label: "Escuela Activa", type: "checkbox" },
        { name: "display_order", label: "Orden de Visualización", type: "number" },
      ]}
      translations={{
        table: "school_translations",
        fkColumn: "school_id",
        fields: [
          { name: "name", label: "Nombre Traducido", required: true },
          { name: "description", label: "Descripción / Bienvenida", type: "textarea" },
        ],
      }}
    />
  ),
});
