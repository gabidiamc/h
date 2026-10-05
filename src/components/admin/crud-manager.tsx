import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryIcon } from "@/components/category-icon";
import { FieldInput, type Field } from "./field-input";
import { TranslationsEditor } from "./translations-editor";
import { deleteRow, listRows, logAudit, upsertRow, type Row } from "@/lib/admin";
import { notifyContentUpdated } from "@/lib/sync";
import { useSchool } from "@/lib/school";
import { normalizeSchoolId } from "@/lib/school-scope";

export type { Field } from "./field-input";

const SCHOOL_FIELD: Field = {
  name: "school_id",
  label: "Escuela obligatoria (school_id)",
  type: "select",
  options: [
    { value: "all", label: "Todas las escuelas (Distrito completo)" },
    { value: "lincoln", label: "Abraham Lincoln High School (Lincoln)" },
    { value: "east", label: "Des Moines East High School (East)" },
  ],
  help: "Selecciona si el contenido es específico de una escuela o aplica para todo el distrito.",
};

const TABLES_WITH_SCHOOL_FIELD = new Set([
  "contacts",
  "programs",
  "events",
  "announcements",
  "articles",
  "activities",
  "faqs",
  "categories",
  "resources",
  "dart_routes",
]);

export function CrudManager({
  table,
  title,
  description,
  fields,
  columns,
  defaults,
  orderBy = "updated_at",
  ascending = false,
  renderExtra,
  translations,
}: {
  table: string;
  title: string;
  description?: string;
  fields: Field[];
  columns: { name: string; label: string }[];
  defaults: Row;
  orderBy?: string;
  ascending?: boolean;
  renderExtra?: (row: Row) => ReactNode;
  translations?: { table: string; fkColumn: string; fields: Field[] };
}) {
  const queryClient = useQueryClient();
  const { adminSchoolFilter, schools } = useSchool();
  const key = ["admin", table, orderBy, ascending, adminSchoolFilter];
  const [editing, setEditing] = useState<Row | null>(null);

  const rows = useQuery({
    queryKey: key,
    queryFn: () => listRows(table, orderBy, ascending, adminSchoolFilter),
  });

  const dynamicSchoolOptions = [
    ...(table === "student_programs"
      ? []
      : [{ value: "all", label: "Todas las escuelas (Distrito completo)" }]),
    ...schools.map((s) => ({
      value: s.id,
      label: `${s.name} (${s.short_name || s.id})`,
    })),
  ];

  // Ensure primary Spanish translation fields are directly editable in the main form
  const effectiveFields = fields.map((f) =>
    f.name === "school_id" ? { ...f, options: dynamicSchoolOptions } : f,
  );
  if (translations?.fields) {
    const missingTrFields = translations.fields.filter(
      (tf) => !effectiveFields.some((ef) => ef.name === tf.name),
    );
    if (missingTrFields.length > 0) {
      effectiveFields.unshift(...missingTrFields);
    }
  }

  // Ensure school_id field is present if table supports it
  if (TABLES_WITH_SCHOOL_FIELD.has(table) && !effectiveFields.some((f) => f.name === "school_id")) {
    effectiveFields.push({ ...SCHOOL_FIELD, options: dynamicSchoolOptions });
  }

  // Ensure school_id column is present if table supports it
  const effectiveColumns = [...columns];
  if (
    TABLES_WITH_SCHOOL_FIELD.has(table) &&
    !effectiveColumns.some((c) => c.name === "school_id")
  ) {
    effectiveColumns.splice(1, 0, { name: "school_id", label: "Escuela" });
  }

  // New records default to the school currently selected in the staff panel,
  // so an edit made while "Lincoln High" is active never touches East High.
  const defaultSchoolId = normalizeSchoolId(adminSchoolFilter);

  const save = useMutation({
    mutationFn: async (values: Row) => {
      const saved = await upsertRow(table, values);
      try {
        await logAudit(values["id"] ? "update" : "create", table, saved["id"] as string);
      } catch {
        // ignore audit failure
      }
      return saved;
    },
    onSuccess: () => {
      toast.success("✓ Se guardó sin ningún problema la información. Los cambios son permanentes.");
      notifyContentUpdated(table);
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", table] });
      void queryClient.invalidateQueries({ queryKey: [table] });
      void queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message || "Error al guardar los cambios"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await deleteRow(table, id);
      try {
        await logAudit("delete", table, id);
      } catch {
        // ignore audit failure
      }
    },
    onSuccess: () => {
      toast.success("Eliminado correctamente.");
      notifyContentUpdated(table);
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: [table] });
      void queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-extrabold">{title}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Autoguardado permanente
            </span>
          </div>
          {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
        </div>
        <Button
          className="min-h-11 gap-2 rounded-xl"
          onClick={() =>
            setEditing({
              ...defaults,
              school_id: defaultSchoolId ?? defaults["school_id"] ?? "all",
            })
          }
        >
          <Plus className="size-4" aria-hidden="true" />
          Nuevo
        </Button>
      </div>

      {TABLES_WITH_SCHOOL_FIELD.has(table) && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Vista activa:</span>
            {adminSchoolFilter === "all" ? (
              <span className="font-semibold text-primary">
                Todas las escuelas (Distrito completo — resultados combinados)
              </span>
            ) : (
              <span className="font-semibold text-foreground">
                Exclusivo para{" "}
                <strong className="text-primary">
                  {schools.find((s) => s.id === adminSchoolFilter)?.name || adminSchoolFilter}
                </strong>{" "}
                (datos separados por escuela)
              </span>
            )}
          </div>
          <span className="text-muted-foreground font-medium">
            Total: {(rows.data ?? []).length} registros
          </span>
        </div>
      )}

      {rows.isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : rows.error ? (
        <p className="mt-6 rounded-xl bg-destructive/10 p-4 text-destructive">
          {(rows.error as Error).message}
        </p>
      ) : (rows.data ?? []).length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          Todavía no hay registros para la escuela seleccionada.
        </p>
      ) : (
        <div className="surface-card mt-6 overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-border">
                {effectiveColumns.map((c) => (
                  <th key={c.name} className="px-4 py-3 text-start font-bold">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-end font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(rows.data ?? []).map((row) => (
                <tr key={String(row["id"])} className="border-b border-border/60 last:border-0">
                  {effectiveColumns.map((c) => (
                    <td key={c.name} className="max-w-[16rem] truncate px-4 py-3">
                      {c.name === "icon" && row[c.name] ? (
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center p-1 border border-primary/20 shrink-0">
                            <CategoryIcon name={row[c.name]} className="size-4.5 text-primary" />
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground truncate max-w-[8rem]">
                            {String(row[c.name] || "").startsWith("data:")
                              ? "Personalizado"
                              : row[c.name] || "—"}
                          </span>
                        </div>
                      ) : c.name === "school_id" ? (
                        !row[c.name] || row[c.name] === "all" || row[c.name] === "district" ? (
                          "Todas (Distrito)"
                        ) : (
                          schools.find((s) => s.id === normalizeSchoolId(row[c.name]))
                            ?.short_name || formatCell(row[c.name])
                        )
                      ) : (
                        formatCell(row[c.name])
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {renderExtra?.(row)}
                      <Button
                        variant="outline"
                        size="icon"
                        className="min-h-11 min-w-11 rounded-xl"
                        aria-label="Editar"
                        onClick={() =>
                          setEditing({
                            ...defaults,
                            school_id: defaultSchoolId ?? defaults["school_id"] ?? "all",
                            ...row,
                          })
                        }
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="min-h-11 min-w-11 rounded-xl text-destructive"
                        aria-label="Eliminar"
                        onClick={() => {
                          if (window.confirm("¿Eliminar este registro?"))
                            remove.mutate(String(row["id"]));
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => !save.isPending && !o && setEditing(null)}
      >
        <DialogContent
          onPointerDownOutside={(e) => save.isPending && e.preventDefault()}
          onEscapeKeyDown={(e) => save.isPending && e.preventDefault()}
          className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle>{editing?.["id"] ? "Editar registro" : "Nuevo registro"}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(editing);
              }}
            >
              {TABLES_WITH_SCHOOL_FIELD.has(table) && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-foreground font-medium flex items-center justify-between">
                  <span>
                    🏫 Administrando para:{" "}
                    <strong className="text-primary font-bold">
                      {!editing["school_id"] || editing["school_id"] === "all"
                        ? "Todas las escuelas (Distrito completo)"
                        : schools.find((s) => s.id === normalizeSchoolId(editing["school_id"]))
                            ?.name || String(editing["school_id"])}
                    </strong>
                  </span>
                  <span className="font-mono text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded">
                    school_id: {String(editing["school_id"] || "all")}
                  </span>
                </div>
              )}
              {effectiveFields.map((f) => (
                <FieldInput
                  key={f.name}
                  field={f}
                  value={editing[f.name]}
                  onChange={(v) => setEditing({ ...editing, [f.name]: v })}
                />
              ))}
              <Button
                type="submit"
                disabled={save.isPending}
                className="min-h-12 w-full rounded-xl text-base font-semibold"
              >
                {save.isPending ? "Guardando y Sincronizando..." : "Guardar"}
              </Button>
              {translations ? (
                editing["id"] ? (
                  <TranslationsEditor
                    table={translations.table}
                    fkColumn={translations.fkColumn}
                    parentId={String(editing["id"])}
                    fields={translations.fields}
                    onEsChange={(esFields) =>
                      setEditing((prev) => (prev ? { ...prev, ...esFields } : prev))
                    }
                  />
                ) : (
                  <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
                    Los textos en Español de arriba se guardarán y traducirán automáticamente al
                    guardar el registro.
                  </p>
                )
              ) : null}
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const KNOWN_LABELS: Record<string, string> = {
  super_admin: "Administrador principal",
  admin: "Administrador",
  content_admin: "Administrador de contenido",
  calendar_admin: "Administrador de calendario",
  editor: "Editor",
  translator: "Traductor",
  reviewer: "Revisor",
  elementary: "Primaria",
  middle: "Secundaria",
  high: "Preparatoria (High School)",
  in_progress: "En proceso",
  resolved: "Resuelto",
  dismissed: "Descartado",
  open: "Pendiente",
  invited: "Invitado",
  active: "Activo",
  revoked: "Revocado",
  academic: "Académico",
  sports: "Deportes",
  arts: "Arte y Música",
  draft: "Borrador",
  in_review: "En revisión",
  scheduled: "Programado",
  published: "Publicado",
  completed: "Finalizado",
  archived: "Archivado",
  cancelled: "Cancelado",
  unknown: "Desconocido",
  verified: "Verificada",
  pending: "Pendiente",
  update: "Actualización de información",
  bug: "Error o reporte técnico",
  "sch-lincoln": "Lincoln High",
  lincoln: "Lincoln High",
  "sch-east": "East High",
  east: "East High",
  "sch-roosevelt": "Roosevelt High",
  roosevelt: "Roosevelt High",
  "sch-north": "North High",
  north: "North High",
  "sch-hoover": "Hoover High",
  hoover: "Hoover High",
  "sch-central": "Central Campus",
  central: "Central Campus",
  all: "Todas (Distrito)",
  district: "Todas (Distrito)",
};

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value).slice(0, 60);
  const str = String(value);
  if (KNOWN_LABELS[str]) return KNOWN_LABELS[str];
  return str;
}
