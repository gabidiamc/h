import { createFileRoute } from "@tanstack/react-router";

import { CrudManager } from "@/components/admin/crud-manager";

export const Route = createFileRoute("/admin/programas")({
  component: () => (
    <CrudManager
      table="programs"
      title="Programas"
      description="Programas académicos, de apoyo y de enriquecimiento."
      orderBy="name"
      ascending
      columns={[
        { name: "name", label: "Programa" },
        { name: "program_type", label: "Tipo" },
        { name: "enrollment_open", label: "Inscripción" },
        { name: "status", label: "Estado" },
      ]}
      defaults={{
        name: "",
        slug: "",
        program_type: "academic",
        is_free: true,
        enrollment_open: false,
        languages: [],
        documents: [],
        status: "published",
      }}
      fields={[
        { name: "name", label: "Nombre", required: true },
        { name: "slug", label: "Slug", required: true },
        {
          name: "program_type",
          label: "Tipo",
          type: "select",
          options: [
            { value: "academic", label: "Académico" },
            { value: "support", label: "Apoyo" },
            { value: "enrichment", label: "Enriquecimiento" },
            { value: "language", label: "Idiomas" },
            { value: "special", label: "Educación especial" },
            { value: "career", label: "Carrera y técnico" },
          ],
        },
        {
          name: "school_level",
          label: "Nivel escolar",
          type: "select",
          options: [
            { value: "preschool", label: "Preescolar" },
            { value: "elementary", label: "Primaria" },
            { value: "middle", label: "Secundaria" },
            { value: "high", label: "Preparatoria" },
            { value: "all", label: "Todos" },
          ],
        },
        { name: "grades", label: "Grados" },
        { name: "summary", label: "Resumen", type: "textarea" },
        { name: "description", label: "Descripción", type: "textarea" },
        { name: "requirements", label: "Requisitos", type: "textarea" },
        { name: "application_process", label: "Cómo inscribirse", type: "textarea" },
        { name: "cost", label: "Costo" },
        { name: "start_date", label: "Inicio", type: "date" },
        { name: "end_date", label: "Fin", type: "date" },
        { name: "official_url", label: "Enlace oficial", type: "url" },
        { name: "image_url", label: "Imagen (URL)", type: "url" },
        { name: "is_free", label: "Gratuito", type: "checkbox" },
        { name: "enrollment_open", label: "Inscripción abierta", type: "checkbox" },
        {
          name: "status",
          label: "Estado",
          type: "select",
          options: [
            { value: "draft", label: "Borrador" },
            { value: "published", label: "Publicado" },
            { value: "archived", label: "Archivado" },
          ],
        },
      ]}
      translations={{
        table: "program_translations",
        fkColumn: "program_id",
        fields: [
          { name: "name", label: "Nombre", required: true },
          { name: "summary", label: "Resumen", type: "textarea" },
          { name: "description", label: "Descripción", type: "textarea" },
        ],
      }}
    />
  ),
});
