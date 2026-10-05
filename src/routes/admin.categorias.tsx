import { createFileRoute } from "@tanstack/react-router";

import { CrudManager } from "@/components/admin/crud-manager";

export const Route = createFileRoute("/admin/categorias")({
  component: () => (
    <CrudManager
      table="categories"
      title="Categorías"
      description="Organiza los temas que ven las familias en el sitio público."
      orderBy="display_order"
      ascending
      columns={[
        { name: "icon", label: "Icono" },
        { name: "name", label: "Nombre" },
        { name: "slug", label: "Slug" },
        { name: "display_order", label: "Orden" },
        { name: "is_visible", label: "Visible" },
      ]}
      defaults={{
        name: "",
        slug: "",
        school_id: "all",
        description: "",
        icon: "BookOpen",
        card_banner_url: "",
        card_bg: "",
        display_order: 0,
        is_visible: true,
        is_featured: false,
      }}
      fields={[
        { name: "name", label: "Nombre", required: true },
        { name: "slug", label: "Slug (dirección web)", required: true },
        {
          name: "school_id",
          label: "Escuela",
          type: "select",
          options: [
            { value: "all", label: "Todas las escuelas (Distrito completo)" },
            { value: "lincoln", label: "Abraham Lincoln High School (Lincoln)" },
            { value: "east", label: "Des Moines East High School (East)" },
          ],
          help: "Determina si esta categoría está disponible en una escuela específica o para todo el distrito.",
        },
        { name: "description", label: "Descripción corta", type: "textarea" },
        {
          name: "icon",
          label: "Icono de la Categoría",
          type: "icon",
          help: "Selecciona un icono visual de la biblioteca para ver cómo quedará en vivo, o sube tu propio icono personalizado desde tu dispositivo.",
        },
        {
          name: "card_banner_url",
          label: "Imagen de cabecera / Banner de la tarjeta (URL o Canva)",
          help: "URL de la imagen que se mostrará en la tarjeta de esta categoría.",
        },
        {
          name: "card_bg",
          label: "Color de fondo de la tarjeta (HEX)",
          help: "Ej.: #06234B, #1e3a8a, #dc2626 o deja vacío para el estilo predeterminado.",
        },
        { name: "display_order", label: "Orden", type: "number" },
        { name: "is_visible", label: "Visible en el sitio", type: "checkbox" },
        { name: "is_featured", label: "Destacada en la portada", type: "checkbox" },
      ]}
    />
  ),
});
