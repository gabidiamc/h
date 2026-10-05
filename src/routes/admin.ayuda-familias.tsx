import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { CrudManager } from "@/components/admin/crud-manager";
import { PublicReviewSettings } from "@/components/admin/public-review-settings";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/ayuda-familias")({
  component: HelpAdminPage,
});

const SCHOOL_OPTIONS = [
  { value: "", label: "Todas las escuelas (Distrito)" },
  { value: "lincoln", label: "Abraham Lincoln High School" },
  { value: "east", label: "Des Moines East High School" },
  { value: "district", label: "Solo información general del distrito" },
];

function HelpAdminPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold">Ayuda para familias</h1>
        <p className="text-muted-foreground">
          Todo lo que ve el asistente familiar sale de aquí. No usa inteligencia artificial: solo
          muestra las respuestas aprobadas por el personal.
        </p>
      </header>

      <Tabs defaultValue="answers">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="answers">Respuestas</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="synonyms">Sinónimos</TabsTrigger>
          <TabsTrigger value="bfl">Contactos BFL</TabsTrigger>
          <TabsTrigger value="reports">Sin respuesta</TabsTrigger>
          <TabsTrigger value="reviews">Reseñas públicas</TabsTrigger>
        </TabsList>

        <TabsContent value="answers" className="mt-4">
          <CrudManager
            table="help_answers"
            title="Respuestas aprobadas"
            description="Solo se muestran a las familias las respuestas activas y aprobadas."
            orderBy="display_order"
            ascending
            columns={[
              { name: "question", label: "Pregunta" },
              { name: "school_id", label: "Escuela" },
              { name: "category_id", label: "Categoría" },
              { name: "is_approved", label: "Aprobada" },
              { name: "is_active", label: "Activa" },
            ]}
            defaults={{
              question: "",
              answer: "",
              language_code: "es",
              steps: [],
              keywords: [],
              display_order: 0,
              is_active: true,
              is_approved: false,
            }}
            fields={[
              { name: "question", label: "Pregunta", required: true },
              { name: "answer", label: "Respuesta", type: "textarea", required: true },
              {
                name: "steps",
                label: "Pasos (uno por línea)",
                type: "textarea",
                help: "Opcional. Se muestran como lista numerada.",
              },
              {
                name: "keywords",
                label: "Palabras clave (separadas por coma)",
                help: "Ayudan a que la búsqueda encuentre esta respuesta.",
              },
              { name: "school_id", label: "Escuela", type: "select", options: SCHOOL_OPTIONS },
              { name: "category_id", label: "Categoría (id)", help: "Ej.: cat-infinite-campus" },
              { name: "internal_url", label: "Página del sitio (ruta interna)" },
              { name: "official_source_url", label: "Fuente oficial (URL)", type: "url" },
              { name: "verified_at", label: "Verificada el", type: "date" },
              { name: "expires_at", label: "Vence el (opcional)", type: "date" },
              { name: "display_order", label: "Orden", type: "number" },
              { name: "is_approved", label: "Aprobada para publicar", type: "checkbox" },
              { name: "is_active", label: "Activa", type: "checkbox" },
            ]}
          />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CrudManager
            table="help_categories"
            title="Categorías del asistente"
            description="Son los botones que aparecen al abrir la ayuda."
            orderBy="display_order"
            ascending
            columns={[
              { name: "name", label: "Nombre" },
              { name: "school_id", label: "Escuela" },
              { name: "display_order", label: "Orden" },
              { name: "is_active", label: "Activa" },
            ]}
            defaults={{
              name: "",
              icon: "BookOpen",
              display_order: 0,
              is_active: true,
              search_terms: [],
            }}
            fields={[
              { name: "name", label: "Nombre (español)", required: true },
              { name: "name_en", label: "Nombre (inglés)" },
              { name: "icon", label: "Icono (nombre de Lucide)" },
              { name: "school_id", label: "Escuela", type: "select", options: SCHOOL_OPTIONS },
              { name: "internal_url", label: "Página del sitio (ruta interna)" },
              {
                name: "search_terms",
                label: "Términos relacionados (separados por coma)",
                type: "textarea",
              },
              { name: "display_order", label: "Orden", type: "number" },
              { name: "is_active", label: "Activa", type: "checkbox" },
            ]}
          />
        </TabsContent>

        <TabsContent value="synonyms" className="mt-4">
          <CrudManager
            table="help_synonyms"
            title="Sinónimos y frases relacionadas"
            description="Permiten que la búsqueda entienda otras formas de preguntar lo mismo."
            orderBy="primary_term"
            ascending
            columns={[
              { name: "primary_term", label: "Término principal" },
              { name: "language_code", label: "Idioma" },
              { name: "is_approved", label: "Aprobado" },
            ]}
            defaults={{
              primary_term: "",
              related_terms: [],
              language_code: "es",
              is_approved: true,
            }}
            fields={[
              { name: "primary_term", label: "Término principal", required: true },
              {
                name: "related_terms",
                label: "Términos relacionados (separados por coma)",
                type: "textarea",
                required: true,
              },
              {
                name: "language_code",
                label: "Idioma",
                type: "select",
                options: [
                  { value: "es", label: "Español" },
                  { value: "en", label: "Inglés" },
                ],
              },
              { name: "is_approved", label: "Aprobado", type: "checkbox" },
            ]}
          />
        </TabsContent>

        <TabsContent value="bfl" className="mt-4">
          <CrudManager
            table="help_bfl_contacts"
            title="Contactos BFL verificados"
            description="Se muestran cuando no existe una respuesta aprobada para la pregunta."
            orderBy="display_order"
            ascending
            columns={[
              { name: "person_name", label: "Persona" },
              { name: "school_id", label: "Escuela" },
              { name: "phone", label: "Teléfono" },
              { name: "is_verified", label: "Verificado" },
            ]}
            defaults={{
              person_name: "",
              languages: [],
              display_order: 0,
              is_verified: false,
              is_visible: true,
            }}
            fields={[
              { name: "person_name", label: "Nombre de la persona", required: true },
              { name: "public_role", label: "Puesto público" },
              { name: "school_id", label: "Escuela", type: "select", options: SCHOOL_OPTIONS },
              { name: "languages", label: "Idiomas (separados por coma)" },
              { name: "phone", label: "Teléfono" },
              { name: "email", label: "Correo electrónico" },
              { name: "office", label: "Oficina" },
              { name: "public_hours", label: "Horario público" },
              { name: "official_source_url", label: "Fuente oficial (URL)", type: "url" },
              { name: "verified_at", label: "Verificado el", type: "date" },
              { name: "display_order", label: "Orden", type: "number" },
              { name: "is_verified", label: "Verificado", type: "checkbox" },
              { name: "is_visible", label: "Visible en la ayuda", type: "checkbox" },
            ]}
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <UnansweredReport />
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <PublicReviewSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type UnansweredRow = {
  id: string;
  sanitized_query: string;
  school_id: string | null;
  hit_count: number;
  last_seen_at: string;
};

function UnansweredReport() {
  const rows = useQuery({
    queryKey: ["admin", "help_unanswered_searches"],
    queryFn: async (): Promise<UnansweredRow[]> => {
      const { data, error } = await supabase
        .from("help_unanswered_searches")
        .select("*")
        .order("occurrence_count", { ascending: false })
        .limit(100);
      if (error || !Array.isArray(data)) return [];
      return (data as Record<string, unknown>[]).map((r) => ({
        id: String(r.id ?? ""),
        sanitized_query: String(r.sanitized_query ?? r.normalized_query ?? ""),
        school_id: (r.school_id as string | null) ?? null,
        hit_count: Number(r.hit_count ?? r.occurrence_count ?? 1),
        last_seen_at: String(
          r.last_seen_at ?? r.last_searched_at ?? r.created_at ?? new Date().toISOString(),
        ),
      }));
    },
  });

  return (
    <section className="surface-card overflow-hidden p-0">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-bold">Búsquedas sin respuesta</h2>
        <p className="text-sm text-muted-foreground">
          Preguntas que las familias buscaron y no encontraron. Úsalas para crear respuestas nuevas.
          No guardamos nombres ni datos personales.
        </p>
      </div>
      {rows.isLoading ? (
        <p className="p-4 text-sm text-muted-foreground">Cargando…</p>
      ) : (rows.data ?? []).length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">Todavía no hay búsquedas sin respuesta.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left">
              <tr>
                <th className="p-3 font-semibold">Búsqueda</th>
                <th className="p-3 font-semibold">Escuela</th>
                <th className="p-3 font-semibold">Veces</th>
                <th className="p-3 font-semibold">Última vez</th>
              </tr>
            </thead>
            <tbody>
              {(rows.data ?? []).map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="p-3">{row.sanitized_query}</td>
                  <td className="p-3">{row.school_id ?? "Distrito"}</td>
                  <td className="p-3 font-semibold">{row.hit_count}</td>
                  <td className="p-3">{new Date(row.last_seen_at).toLocaleDateString("es-MX")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
