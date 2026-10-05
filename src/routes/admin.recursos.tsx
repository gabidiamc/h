import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/admin/crud-manager";

export const Route = createFileRoute("/admin/recursos")({
  component: () => (
    <CrudManager
      table="resources"
      title="Recursos y Herramientas"
      description="Enlaces rápidos, documentos oficiales, portales de familias y herramientas de apoyo escolar."
      orderBy="display_order"
      ascending
      columns={[
        { name: "title", label: "Título del Recurso" },
        { name: "resource_type", label: "Tipo" },
        { name: "url", label: "Enlace / URL" },
        { name: "display_order", label: "Orden" },
        { name: "status", label: "Estado" },
        { name: "is_visible", label: "Visible" },
      ]}
      defaults={{
        title: "",
        slug: "",
        school_id: "lincoln",
        category_id: "",
        resource_type: "link",
        url: "https://",
        description: "",
        icon: "ExternalLink",
        display_order: 1,
        status: "published",
        is_visible: true,
      }}
      fields={[
        {
          name: "title",
          label: "Título del Recurso",
          required: true,
          help: "Ej.: Portal Infinite Campus",
        },
        {
          name: "slug",
          label: "Identificador (Slug)",
          required: true,
          help: "Ej.: portal-infinite-campus",
        },
        {
          name: "resource_type",
          label: "Tipo de Recurso",
          type: "select",
          required: true,
          options: [
            { value: "tool", label: "Herramienta interactiva (Infinite Campus, pagos, etc.)" },
            { value: "guide", label: "Guía paso a paso / Tutorial" },
            { value: "document", label: "Documento oficial / PDF / Formato" },
            { value: "link", label: "Portal o enlace externo" },
            { value: "map", label: "Mapa o ruta de transporte" },
            { value: "contact", label: "Contacto / Teléfono directo" },
          ],
        },
        {
          name: "url",
          label: "URL / Enlace de destino",
          type: "url",
          required: true,
          help: "Ej.: https://desmoinesia.infinitecampus.org/...",
        },
        { name: "description", label: "Descripción o instrucciones breves", type: "textarea" },
        {
          name: "icon",
          label: "Icono (Lucide)",
          help: "Ej.: GraduationCap, Bus, BookOpen, FileText, Phone, Award",
        },
        {
          name: "status",
          label: "Estado de Publicación",
          type: "select",
          options: [
            { value: "draft", label: "Borrador (Draft)" },
            { value: "in_review", label: "En revisión (In Review)" },
            { value: "published", label: "Publicado (Published)" },
            { value: "archived", label: "Archivado (Archived)" },
          ],
        },
        { name: "display_order", label: "Orden de Visualización", type: "number" },
        { name: "is_visible", label: "Visible para las Familias", type: "checkbox" },
      ]}
      translations={{
        table: "content_translations",
        fkColumn: "entity_id",
        fields: [
          { name: "title", label: "Título Traducido", required: true },
          { name: "summary", label: "Descripción Traducida", type: "textarea" },
          {
            name: "button_label",
            label: "Texto del Botón",
            help: "Ej.: Abrir Portal, Descargar PDF",
          },
        ],
      }}
    />
  ),
});
