import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Languages,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Pencil,
  Filter,
  Sparkles,
  School,
  FileText,
  FolderTree,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchool } from "@/lib/school";
import { listRows, Row } from "@/lib/admin";
import {
  SUPPORTED_TRANSLATION_LANGUAGES,
  TRANSLATION_STATUS_CONFIG,
  type TranslationLanguage,
  type TranslationStatus,
  type EntityType,
  saveContentTranslation,
  type ContentTranslation,
} from "@/lib/translations";

export const Route = createFileRoute("/admin/traducciones")({
  component: TranslationsAdminHub,
});

function TranslationsAdminHub() {
  const queryClient = useQueryClient();
  const { adminSchoolFilter } = useSchool();

  const [search, setSearch] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [editingItem, setEditingItem] = useState<{
    entity_type: EntityType;
    entity_id: string;
    entity_title: string;
    language_code: TranslationLanguage;
    title: string;
    summary: string;
    content: string;
    button_label: string;
    translation_status: TranslationStatus;
    reviewed_by: string;
  } | null>(null);

  // Fetch all entities for current school
  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories", adminSchoolFilter],
    queryFn: () => listRows("categories", "display_order", true, adminSchoolFilter),
  });

  const articlesQuery = useQuery({
    queryKey: ["admin", "articles", adminSchoolFilter],
    queryFn: () => listRows("articles", "updated_at", false, adminSchoolFilter),
  });

  const resourcesQuery = useQuery({
    queryKey: ["admin", "resources", adminSchoolFilter],
    queryFn: () => listRows("resources", "display_order", true, adminSchoolFilter),
  });

  const translationsQuery = useQuery({
    queryKey: ["admin", "content_translations"],
    queryFn: () => listRows("content_translations", "updated_at", false),
  });

  // Combine items and matrix
  const items = useMemo(() => {
    const cats = (categoriesQuery.data ?? []).map((c: Row) => ({
      entity_type: "category" as EntityType,
      entity_id: String(c.id),
      entity_title: String(c.name || c.slug),
      category: "Categoría",
      source_school: String(c.school_id || "lincoln"),
    }));

    const arts = (articlesQuery.data ?? []).map((a: Row) => ({
      entity_type: "article" as EntityType,
      entity_id: String(a.id),
      entity_title: String(a.title || a.name || a.slug),
      category: "Artículo",
      source_school: String(a.school_id || "lincoln"),
    }));

    const res = (resourcesQuery.data ?? []).map((r: Row) => ({
      entity_type: "resource" as EntityType,
      entity_id: String(r.id),
      entity_title: String(r.title || r.slug),
      category: "Recurso",
      source_school: String(r.school_id || "lincoln"),
    }));

    const allEntities = [...cats, ...arts, ...res];
    const trs = (translationsQuery.data ?? []) as unknown as ContentTranslation[];

    const rows: {
      entity_type: EntityType;
      entity_id: string;
      entity_title: string;
      category_label: string;
      language_code: TranslationLanguage;
      translation?: ContentTranslation;
      status: TranslationStatus;
    }[] = [];

    for (const entity of allEntities) {
      for (const lang of SUPPORTED_TRANSLATION_LANGUAGES) {
        const found = trs.find(
          (t) =>
            t.entity_type === entity.entity_type &&
            String(t.entity_id) === String(entity.entity_id) &&
            t.language_code === lang.code,
        );

        rows.push({
          entity_type: entity.entity_type,
          entity_id: entity.entity_id,
          entity_title: entity.entity_title,
          category_label: entity.category,
          language_code: lang.code,
          translation: found,
          status: found?.translation_status || (found ? "approved" : "missing"),
        });
      }
    }

    return rows;
  }, [categoriesQuery.data, articlesQuery.data, resourcesQuery.data, translationsQuery.data]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedEntityType !== "all" && item.entity_type !== selectedEntityType) return false;
      if (selectedLanguage !== "all" && item.language_code !== selectedLanguage) return false;
      if (selectedStatus !== "all" && item.status !== selectedStatus) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = item.entity_title.toLowerCase().includes(q);
        const matchesTrTitle = item.translation?.title?.toLowerCase().includes(q);
        const matchesSummary = item.translation?.summary?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTrTitle && !matchesSummary) return false;
      }
      return true;
    });
  }, [items, selectedEntityType, selectedLanguage, selectedStatus, search]);

  const saveMutation = useMutation({
    mutationFn: async (payload: NonNullable<typeof editingItem>) => {
      await saveContentTranslation({
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        language_code: payload.language_code,
        title: payload.title,
        summary: payload.summary,
        content: payload.content,
        button_label: payload.button_label,
        translation_status: payload.translation_status,
        reviewed_by: payload.reviewed_by,
        reviewed_at:
          payload.translation_status === "approved" ? new Date().toISOString() : undefined,
      });
    },
    onSuccess: () => {
      toast.success("Traducción guardada correctamente.");
      setEditingItem(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "content_translations"] });
    },
    onError: (err: Error) => {
      toast.error(`Error al guardar: ${err.message}`);
    },
  });

  const isLoading =
    categoriesQuery.isLoading ||
    articlesQuery.isLoading ||
    resourcesQuery.isLoading ||
    translationsQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2.5">
            <Languages className="size-8 text-primary" />
            <span>Gestión Centralizada de Traducciones</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control de traducciones manuales en Español (es), Inglés (en) y S’gaw Karen (ksw).
          </p>
        </div>
      </div>

      {/* School isolation banner */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs font-semibold text-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <School className="size-4 text-primary" />
          <span>
            Administrando traducciones para:{" "}
            <strong className="text-primary font-bold">Abraham Lincoln High School</strong>
          </span>
        </div>
        <span className="font-mono text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
          school_id: {adminSchoolFilter || "lincoln"}
        </span>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar título o contenido…"
              className="pl-10 min-h-10 rounded-xl text-xs sm:text-sm"
            />
          </div>

          {/* Entity Type Filter */}
          <div>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="w-full min-h-10 rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm font-semibold text-foreground"
            >
              <option value="all">Todas las entidades</option>
              <option value="category">Categorías</option>
              <option value="article">Artículos</option>
              <option value="resource">Recursos</option>
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full min-h-10 rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm font-semibold text-foreground"
            >
              <option value="all">Todos los idiomas</option>
              {SUPPORTED_TRANSLATION_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} ({l.native})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full min-h-10 rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm font-semibold text-foreground"
            >
              <option value="all">Todos los estados</option>
              <option value="missing">Sin traducción / Pendiente</option>
              <option value="draft">Borrador</option>
              <option value="needs_review">En revisión</option>
              <option value="approved">Aprobada y Verificada</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-3">
          <span>
            Mostrando <strong>{filteredItems.length}</strong> items de traducción
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="size-3.5" /> Aprobadas
            </span>
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
              <Clock className="size-3.5" /> En revisión
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
              <AlertCircle className="size-3.5" /> Pendientes
            </span>
          </div>
        </div>
      </div>

      {/* Translations Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
          <p className="font-bold text-foreground">
            No se encontraron traducciones con esos filtros
          </p>
        </div>
      ) : (
        <div className="surface-card overflow-x-auto rounded-2xl border border-border/80 shadow-2xs">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="px-4 py-3 text-start font-bold">Entidad / Elemento</th>
                <th className="px-4 py-3 text-start font-bold">Tipo</th>
                <th className="px-4 py-3 text-start font-bold">Idioma</th>
                <th className="px-4 py-3 text-start font-bold">Título Traducido</th>
                <th className="px-4 py-3 text-start font-bold">Estado de Calidad</th>
                <th className="px-4 py-3 text-end font-bold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => {
                const langInfo = SUPPORTED_TRANSLATION_LANGUAGES.find(
                  (l) => l.code === item.language_code,
                );
                const statusCfg =
                  TRANSLATION_STATUS_CONFIG[item.status] || TRANSLATION_STATUS_CONFIG.missing;

                return (
                  <tr
                    key={`${item.entity_type}_${item.entity_id}_${item.language_code}_${idx}`}
                    className="border-b border-border/60 transition-colors hover:bg-muted/30 last:border-0"
                  >
                    <td className="max-w-[18rem] truncate px-4 py-3.5">
                      <p className="font-bold text-foreground">{item.entity_title}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {item.entity_id}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-lg bg-secondary px-2.5 py-0.5 text-xs font-bold text-foreground">
                        {item.category_label}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground uppercase">
                          {item.language_code}
                        </span>
                        <span className="text-xs text-muted-foreground">({langInfo?.label})</span>
                      </div>
                    </td>

                    <td className="max-w-[20rem] truncate px-4 py-3.5">
                      {item.translation?.title ? (
                        <p className="font-medium text-foreground">{item.translation.title}</p>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">
                          (Sin traducción cargada)
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${statusCfg.badgeClass}`}
                      >
                        {item.status === "approved" ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : item.status === "needs_review" ? (
                          <Clock className="size-3.5" />
                        ) : (
                          <AlertCircle className="size-3.5" />
                        )}
                        <span>{statusCfg.label}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5 font-bold"
                        onClick={() =>
                          setEditingItem({
                            entity_type: item.entity_type,
                            entity_id: item.entity_id,
                            entity_title: item.entity_title,
                            language_code: item.language_code,
                            title: item.translation?.title || item.entity_title,
                            summary: item.translation?.summary || "",
                            content: item.translation?.content || "",
                            button_label: item.translation?.button_label || "",
                            translation_status: item.translation?.translation_status || "draft",
                            reviewed_by: item.translation?.reviewed_by || "Administrador",
                          })
                        }
                      >
                        <Pencil className="size-3.5" />
                        <span>Revisar y Editar</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Translation Dialog */}
      <Dialog open={editingItem !== null} onOpenChange={(o) => !o && setEditingItem(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Languages className="size-5 text-primary" />
              <span>Editar Traducción</span>
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(editingItem);
              }}
            >
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs space-y-1">
                <p className="font-bold text-foreground">Elemento original:</p>
                <p className="text-primary font-semibold">{editingItem.entity_title}</p>
                <p className="text-muted-foreground">
                  Idioma objetivo:{" "}
                  <strong>
                    {
                      SUPPORTED_TRANSLATION_LANGUAGES.find(
                        (l) => l.code === editingItem.language_code,
                      )?.label
                    }{" "}
                    ({editingItem.language_code})
                  </strong>
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block">
                  Título traducido <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="mt-1 min-h-11 rounded-xl"
                  placeholder="Título en el idioma correspondiente..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block">
                  Resumen o descripción traducida
                </label>
                <Textarea
                  value={editingItem.summary}
                  onChange={(e) => setEditingItem({ ...editingItem, summary: e.target.value })}
                  className="mt-1 min-h-[90px] rounded-xl text-sm"
                  placeholder="Descripción resumida..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block">
                  Texto del botón o enlace (opcional)
                </label>
                <Input
                  value={editingItem.button_label}
                  onChange={(e) => setEditingItem({ ...editingItem, button_label: e.target.value })}
                  className="mt-1 min-h-10 rounded-xl"
                  placeholder="Ej: Abrir Guía, Registrarse"
                />
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                <label className="text-xs font-bold text-foreground block">
                  Estado de verificación y calidad
                </label>
                <select
                  value={editingItem.translation_status}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      translation_status: e.target.value as TranslationStatus,
                    })
                  }
                  className="w-full min-h-10 rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-bold"
                >
                  <option value="draft">Borrador (Draft)</option>
                  <option value="needs_review">Necesita revisión (Needs Review)</option>
                  <option value="approved">Aprobada y Verificada por personal (Approved)</option>
                </select>

                {editingItem.language_code === "ksw" && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ Importante: Para S’gaw Karen, marcar como &quot;Aprobada&quot; únicamente
                    cuando haya sido revisada por un traductor o enlace bilingüe calificado.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full min-h-11 rounded-xl text-sm font-bold"
              >
                {saveMutation.isPending ? "Guardando…" : "Guardar y Actualizar Traducción"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
