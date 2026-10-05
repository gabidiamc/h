import { createFileRoute } from "@tanstack/react-router";

import { CrudManager } from "@/components/admin/crud-manager";

export const Route = createFileRoute("/admin/programas-estudiantes")({
  component: () => (
    <CrudManager
      table="student_programs"
      title="Programas y oportunidades para estudiantes"
      description="Cada programa vive dentro de una escuela. Si está disponible para Lincoln y East, crea un registro para cada escuela. No publiques teléfonos, correos, horarios ni requisitos sin una fuente oficial verificada."
      orderBy="display_order"
      ascending
      columns={[
        { name: "name", label: "Programa" },
        { name: "school_id", label: "Escuela" },
        { name: "categories", label: "Categorías" },
        { name: "enrollment_status", label: "Inscripción" },
        { name: "verified_at", label: "Verificado" },
        { name: "is_visible", label: "Visible" },
      ]}
      defaults={{
        name: "",
        school_id: "lincoln",
        description_es: "",
        categories: "",
        enrollment_status: "unknown",
        is_visible: true,
        is_featured: false,
        display_order: 100,
      }}
      fields={[
        { name: "name", label: "Nombre del programa", required: true },
        {
          name: "school_id",
          label: "Escuela",
          type: "select",
          required: true,
          options: [
            { value: "lincoln", label: "Abraham Lincoln High School" },
            { value: "east", label: "Des Moines East High School" },
          ],
          help: "Un registro por escuela. Para un programa disponible en ambas, duplica el registro y cambia la escuela.",
        },
        {
          name: "description_es",
          label: "Descripción en español",
          type: "textarea",
          required: true,
        },
        { name: "audience", label: "Quién puede participar" },
        {
          name: "categories",
          label: "Categorías (separadas por coma)",
          help: "Valores: universidad, empleo, tecnologia, arte, liderazgo, voluntariado, transporte, gratis",
        },
        {
          name: "cost",
          label: "Costo",
          help: "Escríbelo solamente cuando esté confirmado en la fuente oficial.",
        },
        {
          name: "enrollment_status",
          label: "Estado de inscripción",
          type: "select",
          options: [
            { value: "unknown", label: "Sin confirmar (no se muestra)" },
            { value: "open", label: "Inscripción abierta (verificada)" },
            { value: "closed", label: "Inscripción cerrada" },
          ],
        },
        { name: "enrollment_note", label: "Fechas o nota de inscripción", type: "textarea" },
        { name: "address", label: "Dirección" },
        { name: "phone", label: "Teléfono oficial publicado" },
        { name: "email", label: "Correo oficial publicado" },
        { name: "official_url", label: "Enlace oficial (Ver programa oficial)" },
        {
          name: "how_to_participate",
          label: "Cómo participar (un paso por línea)",
          type: "textarea",
        },
        {
          name: "extra_links",
          label: "Enlaces adicionales (Etiqueta|https://…, uno por línea)",
          type: "textarea",
        },
        { name: "requirements", label: "Requisitos y avisos de verificación", type: "textarea" },
        {
          name: "verified_at",
          label: "Fecha de última verificación",
          type: "date",
          help: "Actualízala cada vez que revises la fuente oficial y los enlaces.",
        },
        { name: "display_order", label: "Orden", type: "number" },
        { name: "is_featured", label: "Destacado", type: "checkbox" },
        {
          name: "is_visible",
          label: "Visible en la página pública",
          type: "checkbox",
        },
      ]}
      renderExtra={(row) =>
        row["official_url"] ? (
          <a
            href={String(row["official_url"])}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-sm font-semibold text-primary hover:bg-secondary"
          >
            Ver fuente
          </a>
        ) : null
      }
    />
  ),
});
