/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Plus,
  Trash2,
  FolderPlus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Globe,
  Eye,
  Archive,
  RotateCcw,
  Copy,
  Calendar,
  Clock,
  AlertTriangle,
  FileCheck2,
  Link2,
  ExternalLink,
  Search,
  Filter,
  Layers,
  ArrowRight,
  ArrowLeft,
  Compass,
  Navigation,
  Info,
  Save,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { toast } from "sonner";

import { VisualRichEditor } from "@/components/admin/visual-rich-editor";
import { LANGS } from "@/components/admin/translations-editor";
import { PublicPreviewModal, type PreviewData } from "@/components/admin/public-preview-modal";
import {
  ConfirmActionDialog,
  type ConfirmActionConfig,
} from "@/components/admin/confirm-action-dialog";
import { FileUploadInput } from "@/components/file-upload-input";
import { ArticleBottomNav as ArticleBottomNavPreview } from "@/components/article-bottom-nav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/lib/school";
import { deleteRow, listRows, logAudit, upsertRow, type Row } from "@/lib/admin";
import { notifyContentUpdated, readCache, writeCache } from "@/lib/sync";
import { computeContentStatus, formatDesMoinesDate } from "@/lib/content-lifecycle";
import {
  autoTranslateHtml,
  autoTranslateText,
  invalidateArticleTranslationCache,
} from "@/lib/auto-translator";
import { compactHtmlImages, maskBase64ImagesForTranslation } from "@/lib/image-compression";
import {
  fetchPublishedArticles,
  type ArticleBottomNav as ArticleBottomNavType,
} from "@/lib/content";

export const Route = createFileRoute("/admin/articulos")({
  component: ArticlesAdmin,
});

function formatStatusLabel(status: string): string {
  switch (status) {
    case "published":
      return "Publicado";
    case "draft":
      return "Borrador";
    case "in_review":
      return "En revisión";
    case "scheduled":
      return "Programado";
    case "archived":
      return "Archivado";
    case "completed":
      return "Finalizado";
    default:
      return status.replace(/_/g, " ");
  }
}

function blocksToHtml(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return "";
  return blocks
    .map((b) => {
      if (b.type === "paragraph") {
        return typeof b.text === "string" && (b.text.includes("<") || b.text.includes(">"))
          ? b.text
          : `<p>${b.text || ""}</p>`;
      }
      if (b.type === "heading") {
        const lvl = b.level || "h2";
        return `<${lvl}>${b.text || ""}</${lvl}>`;
      }
      if (b.type === "callout") {
        return `<div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1rem 0; color: #1e3a8a; font-weight: 500;">💡 ${b.text || ""}</div>`;
      }
      if (b.type === "list") {
        const items = Array.isArray(b.items)
          ? b.items.map((i: string) => `<li>${i}</li>`).join("")
          : "";
        return `<ul>${items}</ul>`;
      }
      if (b.type === "image" && b.url) {
        return `<figure data-layer-mode="inline" data-free-flow="false" style="margin: 1.25rem auto; text-align: center; display: block; clear: both;"><img src="${b.url}" alt="${b.alt || ""}" data-layer-mode="inline" data-free-flow="false" data-x="0" data-y="0" data-rotation="0" data-z-index="2" style="width: 100%; max-width: 640px; height: auto; border-radius: 1rem; display: block; margin-left: auto; margin-right: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" />${b.caption ? `<figcaption style="text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">${b.caption}</figcaption>` : ""}</figure>`;
      }
      return b.text ? `<p>${b.text}</p>` : "";
    })
    .join("\n");
}

function ArticlesAdmin() {
  const queryClient = useQueryClient();
  const { adminSchoolFilter, schools } = useSchool();
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmActionConfig | null>(null);

  const articles = useQuery({
    queryKey: ["admin", "articles", adminSchoolFilter],
    queryFn: () => listRows("articles", "updated_at", false, adminSchoolFilter),
  });

  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => listRows("categories", "display_order", true),
  });

  const categoriesList = categories.data ?? [];

  // Filter articles based on tab & search
  const filteredArticles = useMemo(() => {
    const raw = articles.data ?? [];
    return raw.filter((row: any) => {
      const computed = computeContentStatus({
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        status: row.status,
        archived_at: row.archived_at,
      });

      if (activeTab === "drafts" && row.status !== "draft" && row.status !== "in_review")
        return false;
      if (activeTab === "published" && (row.status !== "published" || computed === "archived"))
        return false;
      if (activeTab === "upcoming" && computed !== "upcoming") return false;
      if (activeTab === "completed" && computed !== "completed") return false;
      if (activeTab === "archived" && row.status !== "archived" && computed !== "archived")
        return false;
      if (activeTab === "unverified" && row.source_name && row.source_name.trim().length > 0)
        return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const title = String(row.title || row.name || row.slug || "").toLowerCase();
        const summary = String(row.summary || "").toLowerCase();
        if (!title.includes(q) && !summary.includes(q)) return false;
      }

      return true;
    });
  }, [articles.data, activeTab, search]);

  // Tab counts
  const counts = useMemo(() => {
    const raw = articles.data ?? [];
    let drafts = 0;
    let published = 0;
    let upcoming = 0;
    let completed = 0;
    let archived = 0;
    let unverified = 0;

    raw.forEach((row: any) => {
      const computed = computeContentStatus({
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        status: row.status,
        archived_at: row.archived_at,
      });
      if (row.status === "draft" || row.status === "in_review") drafts++;
      if (row.status === "published" && computed !== "archived") published++;
      if (computed === "upcoming") upcoming++;
      if (computed === "completed") completed++;
      if (row.status === "archived" || computed === "archived") archived++;
      if (!row.source_name || row.source_name.trim().length === 0) unverified++;
    });

    return { all: raw.length, drafts, published, upcoming, completed, archived, unverified };
  }, [articles.data]);

  // Logical Archive Mutation
  const archiveMutation = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const newStatus = archive ? "archived" : "published";
      await upsertRow("articles", { id, status: newStatus, updated_at: new Date().toISOString() });
      try {
        await logAudit("update", "articles", id, archive ? "Archivado lógico" : "Restaurado");
      } catch {
        // ignore
      }
    },
    onSuccess: (_, v) => {
      toast.success(
        v.archive ? "Artículo archivado lógicamente." : "Artículo restaurado a publicado.",
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
      void queryClient.invalidateQueries({ queryKey: ["published-articles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Permanent Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteRow("articles", id);
      try {
        await logAudit("delete", "articles", id, "Eliminado permanentemente");
      } catch {
        // ignore
      }
    },
    onSuccess: () => {
      toast.success("Artículo eliminado con éxito de la base de datos y la página pública.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
      void queryClient.invalidateQueries({ queryKey: ["published-articles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Duplicate as Draft Mutation
  const duplicateMutation = useMutation({
    mutationFn: async (row: Row) => {
      const newId = `art_${Date.now()}`;
      const newSlug = `${String(row["slug"] || "articulo")}-copia-${Date.now().toString().slice(-4)}`;
      const duplicated = {
        ...row,
        id: newId,
        slug: newSlug,
        title: `${String(row["title"] || "Artículo")} (Copia Borrador)`,
        status: "draft",
        updated_at: new Date().toISOString(),
      };
      await upsertRow("articles", duplicated);
      try {
        await logAudit("create", "articles", newId, "Duplicado como borrador");
      } catch {
        // ignore
      }
      return duplicated;
    },
    onSuccess: (dupe) => {
      toast.success("Artículo duplicado como borrador con éxito.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
      setEditingRow(dupe);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Artículos y Recursos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea, programa y organiza artículos informativos con validación de fechas, fuentes y
            vista previa.
          </p>
        </div>
        <Button
          className="min-h-11 gap-2 rounded-xl px-5 text-sm font-bold shadow-soft"
          onClick={() =>
            setEditingRow({
              id: null,
              slug: "",
              category_id: categoriesList[0]?.id || "",
              school_id: adminSchoolFilter === "all" ? "all" : adminSchoolFilter,
              status: "published",
              is_featured: false,
              starts_at: new Date().toISOString().slice(0, 10),
              ends_at: null,
              verified_at: new Date().toISOString().slice(0, 10),
              source_name: "Abraham Lincoln High School",
            })
          }
        >
          <Plus className="size-4" aria-hidden="true" />
          Crear artículo
        </Button>
      </div>

      {/* Tabs bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none border-b border-border/80">
        {[
          { id: "all", label: "Todo", count: counts.all },
          { id: "published", label: "Publicados", count: counts.published },
          { id: "drafts", label: "Borradores", count: counts.drafts },
          { id: "upcoming", label: "Próximamente", count: counts.upcoming },
          { id: "completed", label: "Finalizados", count: counts.completed },
          { id: "archived", label: "Archivados", count: counts.archived },
          { id: "unverified", label: "Por verificar fuente", count: counts.unverified },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-2xs"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-background text-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and context */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o resumen…"
            className="pl-10 min-h-10 rounded-xl text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span>Vista activa:</span>
          <span className="font-bold text-foreground">
            {adminSchoolFilter === "all"
              ? "Distrito Completo"
              : `${adminSchoolFilter.toUpperCase()} High`}
          </span>
          <span>({filteredArticles.length} resultados)</span>
        </div>
      </div>

      {/* Articles Table */}
      {articles.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground space-y-2">
          <p className="font-bold text-foreground">No se encontraron artículos</p>
          <p className="text-xs">
            Prueba cambiando los filtros de estado o el término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="surface-card overflow-x-auto rounded-2xl border border-border/80 shadow-2xs">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="px-4 py-3 text-start font-bold">Título / Identificador</th>
                <th className="px-4 py-3 text-start font-bold">Escuela</th>
                <th className="px-4 py-3 text-start font-bold">Categoría</th>
                <th className="px-4 py-3 text-start font-bold">Fechas / Vigencia</th>
                <th className="px-4 py-3 text-start font-bold">Estado</th>
                <th className="px-4 py-3 text-end font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((row: any) => {
                const categoryObj = categoriesList.find((c) => c.id === row["category_id"]);
                const catName = categoryObj?.name || "Sin categoría";
                const rowSchool = String(row["school_id"] || "all");

                return (
                  <tr
                    key={String(row["id"])}
                    className="border-b border-border/60 transition-colors hover:bg-muted/30 last:border-0"
                  >
                    <td className="max-w-[20rem] truncate px-4 py-3.5">
                      <p className="font-bold text-foreground">
                        {String(row["title"] || row["name"] || row["slug"])}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {String(row["slug"])}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      {(() => {
                        const matchedSchool = schools.find((s) => s.id === rowSchool);
                        return (
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                              rowSchool.includes("lincoln")
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                                : rowSchool.includes("east")
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                                  : matchedSchool
                                    ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200"
                                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {matchedSchool
                              ? matchedSchool.short_name || matchedSchool.name
                              : rowSchool.includes("lincoln")
                                ? "Lincoln"
                                : rowSchool.includes("east")
                                  ? "East"
                                  : "Distrito (Todas)"}
                          </span>
                        );
                      })()}
                    </td>

                    <td className="px-4 py-3.5 font-medium text-foreground">
                      <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {catName}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {row["starts_at"] ? (
                        <span>Inicio: {String(row["starts_at"]).slice(0, 10)}</span>
                      ) : null}
                      {row["ends_at"] ? (
                        <span className="block text-amber-600 dark:text-amber-400 font-semibold">
                          Fin: {String(row["ends_at"]).slice(0, 10)}
                        </span>
                      ) : (
                        <span className="block text-slate-500 font-medium">Permanente</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          row["status"] === "published"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : row["status"] === "archived"
                              ? "bg-muted text-muted-foreground"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {formatStatusLabel(String(row["status"] || "published"))}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-end">
                      <div className="flex justify-end gap-1.5">
                        {/* Preview */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                          title="Vista previa"
                          onClick={() => {
                            setPreviewData({
                              type: "article",
                              title: String(row["title"] || "Artículo"),
                              summary: String(row["summary"] || ""),
                              body: String(row["content"] || ""),
                              category: catName,
                              school_id: rowSchool,
                              starts_at: row["starts_at"],
                              ends_at: row["ends_at"],
                              source_name: row["source_name"],
                              official_url: row["official_url"],
                              image_url: row["featured_image_url"],
                              image_alt: row["image_alt"],
                              status: row["status"],
                            });
                          }}
                        >
                          <Eye className="size-4" />
                        </Button>

                        {/* Duplicate as Draft */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                          title="Duplicar como borrador"
                          onClick={() => duplicateMutation.mutate(row)}
                        >
                          <Copy className="size-4" />
                        </Button>

                        {/* Edit */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                          title="Editar"
                          onClick={() => setEditingRow({ ...row })}
                        >
                          <Pencil className="size-4" />
                        </Button>

                        {/* Logical Archive or Restore */}
                        {row["status"] === "archived" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-xl text-emerald-600 hover:bg-emerald-500/10"
                            title="Restaurar artículo"
                            onClick={() =>
                              archiveMutation.mutate({ id: String(row["id"]), archive: false })
                            }
                          >
                            <RotateCcw className="size-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Archivar lógicamente (se oculta públicamente pero se preserva)"
                            onClick={() =>
                              setConfirmConfig({
                                title: "¿Archivar artículo lógicamente?",
                                description: `El artículo "${row["title"]}" se ocultará del portal público, pero todos sus datos e historial permanecerán seguros en la base de datos.`,
                                consequence:
                                  "Dejará de aparecer en la portada y categorías públicas.",
                                confirmText: "Archivar contenido",
                                variant: "warning",
                                onConfirm: () =>
                                  archiveMutation.mutateAsync({
                                    id: String(row["id"]),
                                    archive: true,
                                  }),
                              })
                            }
                          >
                            <Archive className="size-4" />
                          </Button>
                        )}

                        {/* Permanent Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Eliminar permanentemente de la base de datos"
                          onClick={() =>
                            setConfirmConfig({
                              title: "¿Eliminar artículo permanentemente?",
                              description: `Se borrará el artículo "${row["title"]}" por completo. Esta acción no se puede deshacer y se reflejará al instante en la página pública.`,
                              consequence:
                                "Se eliminará inmediatamente sin necesidad de recargar la página.",
                              confirmText: "Eliminar definitivamente",
                              variant: "danger",
                              onConfirm: () => deleteMutation.mutateAsync(String(row["id"])),
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Step-by-Step Article Editor Modal */}
      {editingRow && (
        <ArticleStepEditorModal
          editingRow={editingRow}
          categoriesList={categoriesList}
          onClose={() => setEditingRow(null)}
          onSuccess={() => {
            setEditingRow(null);
            void queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
            void queryClient.invalidateQueries({ queryKey: ["articles"] });
            void queryClient.invalidateQueries({ queryKey: ["published-articles"] });
          }}
        />
      )}

      {/* Multi-device Public Preview Modal */}
      <PublicPreviewModal
        open={previewData !== null}
        onOpenChange={(o) => !o && setPreviewData(null)}
        data={previewData}
      />

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={confirmConfig !== null}
        onOpenChange={(o) => !o && setConfirmConfig(null)}
        config={confirmConfig}
      />
    </div>
  );
}

function ArticleStepEditorModal({
  editingRow,
  categoriesList,
  onClose,
  onSuccess,
}: {
  editingRow: Row;
  categoriesList: Row[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const articleId = editingRow["id"] ? String(editingRow["id"]) : null;
  const { adminSchoolFilter, schools } = useSchool();

  // Steps: 1. Basic Info, 2. Content, 3. Dates & Verification, 4. Publishing & Preview
  const [activeStep, setActiveStep] = useState<number>(1);
  const [lang, setLang] = useState("es");

  // Initial Content Calculation
  const initialTitle = String(editingRow["title"] || editingRow["name"] || "");
  const initialSummary = String(editingRow["summary"] || "");
  const initialHtml = (() => {
    if (editingRow["bodyHtml"]) return String(editingRow["bodyHtml"]);
    if (
      Array.isArray(editingRow["article_translations"]) &&
      editingRow["article_translations"].length > 0
    ) {
      const tr =
        editingRow["article_translations"].find((t: any) => t.language_code === "es") ||
        editingRow["article_translations"][0];
      if (Array.isArray(tr.content_blocks) && tr.content_blocks.length > 0) {
        return blocksToHtml(tr.content_blocks);
      }
      if (tr.body || tr.content) return String(tr.body || tr.content);
    }
    if (Array.isArray(editingRow["_parsed_blocks"]) && editingRow["_parsed_blocks"].length > 0) {
      return blocksToHtml(editingRow["_parsed_blocks"]);
    }
    if (
      typeof editingRow["content"] === "string" &&
      !editingRow["content"].trim().startsWith("{") &&
      !editingRow["content"].trim().startsWith("[")
    ) {
      return String(editingRow["content"]);
    }
    return "";
  })();

  // Form Fields - Multilingual support (ES / EN)
  const [contentLang, setContentLang] = useState<"es" | "en">("es");

  const [titleEs, setTitleEs] = useState(() => {
    const tr = Array.isArray(editingRow["article_translations"])
      ? editingRow["article_translations"].find((t: any) => t.language_code === "es")
      : null;
    return String(tr?.title || initialTitle || "");
  });
  const [summaryEs, setSummaryEs] = useState(() => {
    const tr = Array.isArray(editingRow["article_translations"])
      ? editingRow["article_translations"].find((t: any) => t.language_code === "es")
      : null;
    return String(tr?.summary || initialSummary || "");
  });
  const [bodyHtmlEs, setBodyHtmlEs] = useState(() => {
    const tr = Array.isArray(editingRow["article_translations"])
      ? editingRow["article_translations"].find((t: any) => t.language_code === "es")
      : null;
    return Array.isArray(tr?.content_blocks) && tr.content_blocks.length > 0
      ? blocksToHtml(tr.content_blocks)
      : initialHtml || "";
  });

  const [titleEn, setTitleEn] = useState(() => {
    const tr = Array.isArray(editingRow["article_translations"])
      ? editingRow["article_translations"].find((t: any) => t.language_code === "en")
      : null;
    return String(tr?.title || "");
  });
  const [summaryEn, setSummaryEn] = useState(() => {
    const tr = Array.isArray(editingRow["article_translations"])
      ? editingRow["article_translations"].find((t: any) => t.language_code === "en")
      : null;
    return String(tr?.summary || "");
  });
  const [bodyHtmlEn, setBodyHtmlEn] = useState(() => {
    const tr = Array.isArray(editingRow["article_translations"])
      ? editingRow["article_translations"].find((t: any) => t.language_code === "en")
      : null;
    return tr?.content_blocks ? blocksToHtml(tr.content_blocks) : "";
  });

  // Bottom Navigation state (Volver y Siguiente)
  const initialNav = (editingRow["bottom_nav"] as ArticleBottomNavType) || null;

  const [bottomNavEnabled, setBottomNavEnabled] = useState(Boolean(initialNav?.enabled));

  // Back button config
  const [backTargetType, setBackTargetType] = useState<
    "category" | "topics" | "browser_back" | "custom_url"
  >(initialNav?.back?.targetType || "category");
  const [backLabel, setBackLabel] = useState(initialNav?.back?.label || "");
  const [backSublabel, setBackSublabel] = useState(initialNav?.back?.sublabel || "");
  const [backCustomUrl, setBackCustomUrl] = useState(initialNav?.back?.targetUrl || "");

  // Next button config
  const [nextTargetType, setNextTargetType] = useState<
    "article" | "internal_page" | "external_url"
  >(initialNav?.next?.targetType || "article");
  const [nextTargetSlug, setNextTargetSlug] = useState(initialNav?.next?.targetSlug || "");
  const [nextTargetUrl, setNextTargetUrl] = useState(initialNav?.next?.targetUrl || "");
  const [nextLabel, setNextLabel] = useState(initialNav?.next?.label || "");
  const [nextSublabel, setNextSublabel] = useState(initialNav?.next?.sublabel || "");
  const [nextOpenInNewTab, setNextOpenInNewTab] = useState(Boolean(initialNav?.next?.openInNewTab));

  // Query existing articles for next article selector
  const existingArticlesQuery = useQuery({
    queryKey: ["admin_articles_for_bottom_nav"],
    queryFn: () => fetchPublishedArticles(),
  });
  const availableArticles = useMemo(() => {
    return (existingArticlesQuery.data || []).filter(
      (a) => a.id !== articleId && a.slug !== editingRow["slug"],
    );
  }, [existingArticlesQuery.data, articleId, editingRow]);
  const [articleSearchQuery, setArticleSearchQuery] = useState("");

  const filteredArticles = useMemo(() => {
    if (!articleSearchQuery.trim()) return availableArticles;
    const q = articleSearchQuery.toLowerCase();
    return availableArticles.filter((art) => {
      const trTitle = (
        art.article_translations?.[0]?.title ||
        art.title ||
        art.slug ||
        ""
      ).toLowerCase();
      const artSlug = (art.slug || "").toLowerCase();
      return trTitle.includes(q) || artSlug.includes(q);
    });
  }, [availableArticles, articleSearchQuery]);

  const [schoolId, setSchoolId] = useState(() => {
    const raw = String(
      editingRow["school_id"] ||
        (adminSchoolFilter && adminSchoolFilter !== "all" ? adminSchoolFilter : "all"),
    ).toLowerCase();
    if (!raw || raw === "all" || raw === "district") return "all";
    if (raw.includes("east")) return "east";
    if (raw.includes("lincoln")) return "lincoln";
    return raw;
  });
  const [categoryId, setCategoryId] = useState(String(editingRow["category_id"] || ""));
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Dates
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const [startsAt, setStartsAt] = useState(
    String(editingRow["starts_at"] || todayDateStr).slice(0, 10) || todayDateStr,
  );
  const [endsAt, setEndsAt] = useState(String(editingRow["ends_at"] || "").slice(0, 10));
  const [isPermanent, setIsPermanent] = useState(!editingRow["ends_at"]);

  // Sources & Verification
  const [sourceName, setSourceName] = useState(String(editingRow["source_name"] || ""));
  const [officialUrl, setOfficialUrl] = useState(String(editingRow["official_url"] || ""));
  const [verifiedAt, setVerifiedAt] = useState(
    String(editingRow["verified_at"] || todayDateStr).slice(0, 10) || todayDateStr,
  );
  const [adminNote, setAdminNote] = useState(String(editingRow["admin_note"] || ""));

  // Publishing & Media
  const [slug, setSlug] = useState(String(editingRow["slug"] || ""));
  const [status, setStatus] = useState(String(editingRow["status"] || "published"));
  const [featuredImage, setFeaturedImage] = useState(
    String(editingRow["featured_image_url"] || editingRow["card_banner_url"] || ""),
  );
  const [cardBanner, setCardBanner] = useState(
    String(editingRow["card_banner_url"] || editingRow["featured_image_url"] || ""),
  );
  const [coverLang, setCoverLang] = useState<"es" | "en">("es");
  const [cardBanners, setCardBanners] = useState<Record<string, string>>(() => {
    const defaultBanner = String(
      editingRow["card_banner_url"] || editingRow["featured_image_url"] || "",
    );
    const initial: Record<string, string> = {
      es: defaultBanner,
      en: "",
    };
    if (editingRow["card_banners"] && typeof editingRow["card_banners"] === "object") {
      Object.assign(initial, editingRow["card_banners"]);
    }
    if (editingRow["featured_images"] && typeof editingRow["featured_images"] === "object") {
      Object.assign(initial, editingRow["featured_images"]);
    }
    if (Array.isArray(editingRow["article_translations"])) {
      editingRow["article_translations"].forEach((tr: any) => {
        if (tr.language_code && (tr.card_banner_url || tr.featured_image_url)) {
          initial[tr.language_code] = tr.card_banner_url || tr.featured_image_url;
        }
      });
    }
    if (!initial.es) initial.es = defaultBanner;
    return initial;
  });
  const [previewCardLang, setPreviewCardLang] = useState<"es" | "en">("es");
  const [cardBg, setCardBg] = useState(String(editingRow["card_bg"] || ""));
  const [transparentBg, setTransparentBg] = useState<boolean>(() =>
    Boolean(
      editingRow["transparent_bg"] ??
      (editingRow as any)["_meta"]?.transparent_bg ??
      (editingRow["card_banner_url"] &&
        (String(editingRow["card_banner_url"]).startsWith("data:image/svg") ||
          String(editingRow["card_banner_url"]).includes(".svg"))),
    ),
  );
  const [imageAlt, setImageAlt] = useState(String(editingRow["image_alt"] || ""));
  const [isFeatured, setIsFeatured] = useState(Boolean(editingRow["is_featured"]));

  const [isSaving, setIsSaving] = useState(false);
  const [isTranslatingWithAi, setIsTranslatingWithAi] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [permanentConfirmOpen, setPermanentConfirmOpen] = useState(false);

  // Real AI Translation using Gemini endpoint
  const handleAiTranslate = async (source: "step1" | "step2") => {
    if (!titleEs.trim() && !summaryEs.trim() && !bodyHtmlEs.trim()) {
      toast.error(
        "Escribe primero el título, descripción o contenido en Español para poder traducirlo.",
      );
      return;
    }

    setIsTranslatingWithAi(true);
    const toastId = toast.loading("Traduciendo al inglés con IA (Gemini)...");

    const { maskedHtml, restore } = maskBase64ImagesForTranslation(
      bodyHtmlEs.replace(/\sdata-original-src="[^"]*"/gi, ""),
    );

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLang: "en",
          article: {
            title: titleEs,
            summary: summaryEs,
            bodyHtml: maskedHtml,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.article) {
        if (data.article.title) setTitleEn(data.article.title);
        if (data.article.summary) setSummaryEn(data.article.summary);
        if (data.article.bodyHtml) setBodyHtmlEn(restore(data.article.bodyHtml));

        if (source === "step1") {
          setCoverLang("en");
        } else {
          setContentLang("en");
        }

        toast.success(
          `¡Artículo traducido al inglés con IA (${data.engine || "Gemini"}) exitosamente!`,
          { id: toastId },
        );
      } else {
        throw new Error(data.error || "No se pudo obtener la traducción de IA.");
      }
    } catch (err: any) {
      console.warn("AI translation error, falling back to local dictionary:", err);
      if (titleEs && !titleEn.trim()) setTitleEn(autoTranslateText(titleEs, "en"));
      if (summaryEs && !summaryEn.trim()) setSummaryEn(autoTranslateText(summaryEs, "en"));
      if (bodyHtmlEs && !bodyHtmlEn.trim()) {
        setBodyHtmlEn(restore(autoTranslateHtml(maskedHtml, "en")));
      }

      if (source === "step1") setCoverLang("en");
      else setContentLang("en");

      toast.info("Traducción generada. Puedes revisarla y ajustarla.", { id: toastId });
    } finally {
      setIsTranslatingWithAi(false);
    }
  };

  // Validation logic
  const handleValidateAndSave = async (forcePermanent = false) => {
    const finalTitle = titleEs.trim() || titleEn.trim();
    if (!finalTitle) {
      toast.error("El título del artículo es obligatorio.");
      setActiveStep(1);
      return;
    }

    // Validate dates
    if (startsAt && endsAt) {
      if (new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
        toast.error(
          "Error en fechas: La fecha de término no puede ser anterior a la fecha de inicio.",
        );
        setActiveStep(4);
        return;
      }
    }

    // Check if user publishes without an end date and hasn't explicitly confirmed permanent
    if (!endsAt && !isPermanent && !forcePermanent && status === "published") {
      setPermanentConfirmOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      let finalCategoryId = categoryId;
      if (isCreatingNewCategory && newCategoryName.trim()) {
        const catNameClean = newCategoryName.trim();
        const catSlugClean = catNameClean
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-");

        const newCatRow = {
          id: `cat_${Date.now()}`,
          name: catNameClean,
          slug: catSlugClean || `cat-${Date.now()}`,
          icon: "BookOpen",
          display_order: categoriesList.length + 1,
          is_featured: true,
          is_visible: true,
        };
        await upsertRow("categories", newCatRow);
        finalCategoryId = newCatRow.id;
      }

      const finalSlug =
        slug.trim() ||
        finalTitle
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "") ||
        `articulo${Date.now()}`;

      const finalBanners = { ...cardBanners };
      if (!finalBanners.es && cardBanner) finalBanners.es = cardBanner;
      const bannerUrlFinal =
        finalBanners[coverLang] || finalBanners.es || cardBanner.trim() || null;

      const bottomNavPayload: ArticleBottomNavType = {
        enabled: bottomNavEnabled,
        back: {
          enabled: true,
          targetType: backTargetType,
          label: backLabel.trim() || undefined,
          sublabel: backSublabel.trim() || undefined,
          targetUrl: backTargetType === "custom_url" ? backCustomUrl.trim() : undefined,
        },
        next: {
          enabled: true,
          targetType: nextTargetType,
          targetSlug: nextTargetType === "article" ? nextTargetSlug || undefined : undefined,
          targetUrl: nextTargetType !== "article" ? nextTargetUrl.trim() || undefined : undefined,
          label: nextLabel.trim() || undefined,
          sublabel: nextSublabel.trim() || undefined,
          openInNewTab: nextOpenInNewTab,
        },
      };

      const stripTranslatorAttrs = (html: string) =>
        html
          .replace(/\sdata-original-src="[^"]*"/gi, "")
          .replace(/\sdata-orig-text="[^"]*"/g, "")
          .replace(/\sdata-translated-lang="[^"]*"/g, "")
          .replace(/\sdata-upt-es="[^"]*"/g, "")
          .replace(/\sdata-upt-en="[^"]*"/g, "");

      const effectiveTitleEs = titleEs.trim() || finalTitle;
      const effectiveSummaryEs = summaryEs.trim() || summaryEn.trim();
      const rawBodyEs = stripTranslatorAttrs(bodyHtmlEs.trim() || bodyHtmlEn.trim());
      const effectiveBodyEs = await compactHtmlImages(rawBodyEs);
      const esBlocks = [{ type: "paragraph", text: effectiveBodyEs }];

      const effectiveStatus = status || "published";
      const articleData = {
        id: articleId || `art_${Date.now()}`,
        slug: finalSlug,
        category_id: finalCategoryId || null,
        school_id: schoolId === "all" ? null : schoolId || null,
        title: effectiveTitleEs,
        summary: effectiveSummaryEs,
        content_blocks: esBlocks,
        status: effectiveStatus,
        is_featured: isFeatured,
        published_at:
          effectiveStatus === "published"
            ? (editingRow["published_at"] as string) || new Date().toISOString()
            : (editingRow["published_at"] as string) || null,
        featured_image_url: bannerUrlFinal,
        card_banner_url: bannerUrlFinal,
        card_banners: finalBanners,
        featured_images: finalBanners,
        card_bg: cardBg.trim() || null,
        transparent_bg: transparentBg,
        image_alt: imageAlt.trim() || null,
        bottom_nav: bottomNavPayload,
        starts_at: startsAt ? `${startsAt}T00:00:00` : null,
        ends_at: endsAt ? `${endsAt}T23:59:59` : null,
        source_name: sourceName.trim() || null,
        official_url: officialUrl.trim() || null,
        verified_at: verifiedAt ? `${verifiedAt}T00:00:00` : new Date().toISOString(),
        admin_note: adminNote.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const savedArt = await upsertRow("articles", articleData);
      const newArticleId = String(savedArt.id);

      // 1. Save Spanish translation
      const trBodyEs = {
        id: `tr_${newArticleId}_es`,
        article_id: newArticleId,
        language_code: "es",
        title: effectiveTitleEs,
        summary: effectiveSummaryEs,
        content_blocks: esBlocks,
        updated_at: new Date().toISOString(),
      };
      await upsertRow("article_translations", trBodyEs);

      // 2. Save English translation (custom if provided, or AI/neural translated from Spanish)
      let effectiveTitleEn = titleEn.trim();
      let effectiveSummaryEn = summaryEn.trim();
      let effectiveBodyEn = await compactHtmlImages(stripTranslatorAttrs(bodyHtmlEn.trim()));

      const needsAiTitle = !effectiveTitleEn && Boolean(effectiveTitleEs);
      const needsAiSummary = !effectiveSummaryEn && Boolean(effectiveSummaryEs);
      const needsAiBody = !effectiveBodyEn && Boolean(effectiveBodyEs);

      const { maskedHtml: maskedBodyEs, restore: restoreBodyImages } =
        maskBase64ImagesForTranslation(effectiveBodyEs);

      if (needsAiTitle || needsAiSummary || needsAiBody) {
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetLang: "en",
              article: {
                title: needsAiTitle ? effectiveTitleEs : "",
                summary: needsAiSummary ? effectiveSummaryEs : "",
                bodyHtml: needsAiBody ? maskedBodyEs : "",
              },
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.article) {
              if (needsAiTitle && data.article.title) effectiveTitleEn = data.article.title;
              if (needsAiSummary && data.article.summary) effectiveSummaryEn = data.article.summary;
              if (needsAiBody && data.article.bodyHtml) {
                effectiveBodyEn = restoreBodyImages(stripTranslatorAttrs(data.article.bodyHtml));
              }
            }
          }
        } catch {
          // fallback below
        }
      }

      if (!effectiveTitleEn && effectiveTitleEs) {
        effectiveTitleEn = autoTranslateText(effectiveTitleEs, "en");
      }
      if (!effectiveSummaryEn && effectiveSummaryEs) {
        effectiveSummaryEn = autoTranslateText(effectiveSummaryEs, "en");
      }
      if (!effectiveBodyEn && effectiveBodyEs) {
        effectiveBodyEn = restoreBodyImages(autoTranslateHtml(maskedBodyEs, "en"));
      }
      const trBodyEn = {
        id: `tr_${newArticleId}_en`,
        article_id: newArticleId,
        language_code: "en",
        title: effectiveTitleEn || effectiveTitleEs,
        summary: effectiveSummaryEn,
        content_blocks: [{ type: "paragraph", text: effectiveBodyEn || effectiveBodyEs }],
        updated_at: new Date().toISOString(),
      };
      await upsertRow("article_translations", trBodyEn);

      // Invalidate translation cache so public reader immediately loads updated content
      invalidateArticleTranslationCache(newArticleId);

      notifyContentUpdated("articles");
      notifyContentUpdated("article_translations");

      // Log audit
      try {
        await logAudit(
          articleId ? "update" : "create",
          "articles",
          newArticleId,
          `Artículo ${status === "published" ? "publicado" : "guardado como borrador"}`,
        );
      } catch (auditErr) {
        console.warn("[audit log error]", auditErr);
      }

      toast.success("¡Artículo guardado y sincronizado en vivo exitosamente!");
      onSuccess();
    } catch (e: any) {
      toast.error(
        "No se pudieron guardar ambas versiones del artículo: " +
          (e.message || "Error al guardar el artículo"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { num: 1, label: "1. Tarjeta y Portada" },
    { num: 2, label: "2. Contenido (ES / EN)" },
    { num: 3, label: "3. Botones al Pie" },
    { num: 4, label: "4. Fechas y Vigencia" },
    { num: 5, label: "5. Publicación y Estado" },
  ];

  return (
    <Dialog open onOpenChange={(open) => !isSaving && !open && onClose()}>
      <DialogContent
        onPointerDownOutside={(e) => isSaving && e.preventDefault()}
        onEscapeKeyDown={(e) => isSaving && e.preventDefault()}
        className="max-h-[94dvh] overflow-y-auto sm:max-w-4xl lg:max-w-6xl p-0 gap-0 rounded-2xl"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-extrabold flex items-center gap-2 text-foreground">
              <Sparkles className="size-5 text-primary" />
              <span>{articleId ? "Editar Artículo" : "Nuevo Artículo Informativo"}</span>
            </DialogTitle>

            <span className="text-xs font-bold text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-xl">
              Traducción automática activa
            </span>
          </div>

          {/* Step Navigator */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
            {steps.map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setActiveStep(s.num)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-start border ${
                  activeStep === s.num
                    ? "bg-primary text-white border-primary shadow-2xs"
                    : activeStep > s.num
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step Body Content */}
        <div className="p-6 space-y-5">
          {/* STEP 1: All-in-One Card Editor (Description, Banner with mover/rotar/escalar, Background, Categories & Real-time Live Preview) */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Input Form (Title, Description, Banner, Colors, Category, School) */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <label className="text-sm font-bold text-foreground block">
                      Título del artículo ({coverLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"}){" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder={
                        coverLang === "es"
                          ? "Ej: Guía de Inscripciones y Requisitos Escolares"
                          : "Ex: Student Registration and School Requirements Guide"
                      }
                      value={coverLang === "es" ? titleEs : titleEn}
                      onChange={(e) => {
                        if (coverLang === "es") setTitleEs(e.target.value);
                        else setTitleEn(e.target.value);
                      }}
                      className="mt-1.5 min-h-11 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-foreground block">
                      Descripción o Resumen de la Tarjeta (
                      {coverLang === "es" ? "🇪🇸 Español" : "🇺🇸 English"}){" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      placeholder={
                        coverLang === "es"
                          ? "Escribe la descripción o resumen que aparecerá directamente en la portada de la tarjeta..."
                          : "Write the summary that will appear directly on the card cover..."
                      }
                      value={coverLang === "es" ? summaryEs : summaryEn}
                      onChange={(e) => {
                        if (coverLang === "es") setSummaryEs(e.target.value);
                        else setSummaryEn(e.target.value);
                      }}
                      className="mt-1.5 min-h-[90px] rounded-xl text-xs sm:text-sm leading-relaxed"
                      rows={3}
                    />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                      <span>
                        {coverLang === "es"
                          ? "Este texto se muestra en la tarjeta de la página principal y en el catálogo."
                          : "Si dejas este campo en blanco, se traducirá automáticamente desde el español al guardar."}
                      </span>
                      {coverLang === "en" && (summaryEs.trim() || titleEs.trim()) && (
                        <button
                          type="button"
                          disabled={isTranslatingWithAi}
                          onClick={() => handleAiTranslate("step1")}
                          className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isTranslatingWithAi ? (
                            <>
                              <Loader2 className="size-3 animate-spin" />
                              <span>Traduciendo con IA...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="size-3" />
                              <span>⚡ Auto-traducir con IA desde Español</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Per-Language Banner Upload & Customization */}
                  <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                          <Sparkles className="size-3.5 text-primary" />
                          <span>Portada de la Tarjeta por Idioma</span>
                        </label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Sube una portada específica para cada idioma o usa la misma para todos.
                        </p>
                      </div>

                      {/* Language Selection Tabs for Cover Image */}
                      <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                        {[
                          { code: "es" as const, label: "🇪🇸 Español", short: "ES" },
                          { code: "en" as const, label: "🇺🇸 English", short: "EN" },
                        ].map((item) => {
                          const hasImg = Boolean(cardBanners[item.code]?.trim());
                          const isActive = coverLang === item.code;
                          return (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => {
                                setCoverLang(item.code);
                                setPreviewCardLang(item.code);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                isActive
                                  ? "bg-primary text-white shadow-xs"
                                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                              }`}
                            >
                              <span>{item.label}</span>
                              {hasImg && (
                                <span
                                  className={`size-1.5 rounded-full ${
                                    isActive ? "bg-white" : "bg-emerald-500"
                                  }`}
                                  title="Portada configurada"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Language Notice & Copy Tool */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/30 px-3 py-2 rounded-xl border border-border/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          Idioma activo:{" "}
                          <span className="text-primary font-extrabold">
                            {coverLang === "es" ? "Español (Principal)" : "English (Inglés)"}
                          </span>
                        </span>
                        {!cardBanners[coverLang]?.trim() && coverLang !== "es" && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-md border border-amber-500/20">
                            Heredará portada en español si se deja vacía
                          </span>
                        )}
                      </div>

                      {cardBanners[coverLang]?.trim() && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-lg gap-1"
                          onClick={() => {
                            const current = cardBanners[coverLang] || "";
                            setCardBanners({
                              es: current,
                              en: current,
                            });
                            setCardBanner(current);
                            toast.success("Portada copiada a todos los idiomas (ES, EN)");
                          }}
                        >
                          <Copy className="size-3" />
                          <span>Copiar esta portada a todos los idiomas</span>
                        </Button>
                      )}
                    </div>

                    <FileUploadInput
                      id={`card-banner-input-${coverLang}`}
                      value={cardBanners[coverLang] || ""}
                      onChange={(url) => {
                        setCardBanners((prev) => ({ ...prev, [coverLang]: url }));
                        if (coverLang === "es" || !cardBanner) {
                          setCardBanner(url);
                        }
                      }}
                      helperText={`Portada para ${
                        coverLang === "es"
                          ? "Español"
                          : coverLang === "en"
                            ? "English"
                            : "ကညီကျိာ် (Karen)"
                      }. Sube o pega la imagen de cabecera de la tarjeta.`}
                      placeholder="https://... o sube una imagen para este idioma"
                      accept="image/*"
                    />
                  </div>

                  {/* Card Background Colors & Gradients */}
                  <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Fondo de la Tarjeta
                      </label>
                      {cardBg && (
                        <button
                          type="button"
                          onClick={() => setCardBg("")}
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          Restablecer por defecto
                        </button>
                      )}
                    </div>

                    {/* Gradients */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                        Degradados Rápidos
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { name: "Por defecto", val: "" },
                          {
                            name: "Amanecer",
                            val: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
                          },
                          {
                            name: "Océano",
                            val: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
                          },
                          {
                            name: "Rosa",
                            val: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
                          },
                          {
                            name: "Menta",
                            val: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
                          },
                          {
                            name: "Lavanda",
                            val: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
                          },
                          {
                            name: "Noche",
                            val: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
                          },
                          {
                            name: "Escarlata",
                            val: "linear-gradient(135deg, #e11d48 0%, #fb923c 100%)",
                          },
                        ].map((g) => (
                          <button
                            key={g.name}
                            type="button"
                            onClick={() => setCardBg(g.val)}
                            style={g.val ? { background: g.val } : undefined}
                            className={`h-7 rounded-lg px-2 text-[11px] font-bold transition-all border text-start flex items-center justify-between cursor-pointer ${
                              cardBg === g.val
                                ? "border-primary ring-2 ring-primary/40 shadow-xs"
                                : "border-border hover:scale-[1.02]"
                            } ${
                              g.val.includes("#0f172a") || g.val.includes("#e11d48")
                                ? "text-white"
                                : "text-foreground bg-card"
                            }`}
                          >
                            <span className="truncate">{g.name}</span>
                            {cardBg === g.val && <span className="text-[10px]">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Solids */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                        Colores Sólidos
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: "Blanco", val: "#ffffff" },
                          { name: "Gris Suave", val: "#f8fafc" },
                          { name: "Azul Tenue", val: "#eff6ff" },
                          { name: "Rosa Tenue", val: "#fff1f2" },
                          { name: "Verde Tenue", val: "#ecfdf5" },
                          { name: "Ámbar Tenue", val: "#fffbeb" },
                          { name: "Púrpura Tenue", val: "#faf5ff" },
                          { name: "Carbón Oscuro", val: "#0f172a" },
                        ].map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setCardBg(c.val)}
                            style={{ backgroundColor: c.val }}
                            className={`size-6 rounded-lg border transition-transform hover:scale-110 cursor-pointer ${
                              cardBg === c.val
                                ? "border-primary ring-2 ring-primary/40 shadow-xs"
                                : "border-border"
                            }`}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Custom Hex */}
                    <div>
                      <Input
                        value={cardBg}
                        onChange={(e) => setCardBg(e.target.value)}
                        placeholder="Ej: #f0fdf4 o linear-gradient(...)"
                        className="h-8 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* School & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* School Scope */}
                    <div className="rounded-2xl border border-border/80 bg-card p-3.5 space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        Escuela
                      </label>
                      <select
                        value={schoolId}
                        onChange={(e) => setSchoolId(e.target.value)}
                        className="w-full min-h-10 rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                      >
                        <option value="all">Todas las escuelas (Distrito)</option>
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div className="rounded-2xl border border-border/80 bg-card p-3.5 space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        Categoría
                      </label>
                      {!isCreatingNewCategory ? (
                        <div className="flex gap-1.5">
                          <select
                            value={categoryId}
                            onChange={(e) => {
                              if (e.target.value === "NEW") setIsCreatingNewCategory(true);
                              else setCategoryId(e.target.value);
                            }}
                            className="min-h-10 flex-1 rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground"
                          >
                            <option value="">Selecciona categoría...</option>
                            {categoriesList.map((cat) => (
                              <option key={String(cat.id)} value={String(cat.id)}>
                                {String(cat.name)}
                              </option>
                            ))}
                            <option value="NEW">+ Nueva categoría...</option>
                          </select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-10 rounded-xl px-2.5"
                            onClick={() => setIsCreatingNewCategory(true)}
                          >
                            <FolderPlus className="size-4 text-primary" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <Input
                            placeholder="Nombre de categoría"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="min-h-10 rounded-xl text-xs"
                            autoFocus
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="min-h-10 rounded-xl text-xs"
                            onClick={() => setIsCreatingNewCategory(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Live Real-time Card Preview (Together with Form) */}
                <div className="lg:col-span-5 sticky top-2">
                  <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Vista Previa en Vivo de la Tarjeta
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                        En Tiempo Real
                      </span>
                    </div>

                    {/* Language Preview Switcher Buttons */}
                    <div className="flex items-center justify-between gap-1.5 bg-background/80 p-1.5 rounded-xl border border-border/70">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        Idioma de prueba:
                      </span>
                      <div className="flex items-center gap-1">
                        {[
                          { code: "es" as const, label: "🇪🇸 ES" },
                          { code: "en" as const, label: "🇺🇸 EN" },
                        ].map((btn) => (
                          <button
                            key={btn.code}
                            type="button"
                            onClick={() => setPreviewCardLang(btn.code)}
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                              previewCardLang === btn.code
                                ? "bg-primary text-white shadow-2xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Exact Article Card Render */}
                    {(() => {
                      const previewBanner =
                        cardBanners[previewCardLang]?.trim() ||
                        (previewCardLang !== "es" ? cardBanners.es?.trim() : "") ||
                        cardBanner.trim();
                      const previewSummary =
                        previewCardLang === "es"
                          ? summaryEs
                          : summaryEn.trim() ||
                            (summaryEs ? autoTranslateText(summaryEs, previewCardLang) : "");
                      const previewTitle =
                        previewCardLang === "es"
                          ? titleEs
                          : titleEn.trim() ||
                            (titleEs ? autoTranslateText(titleEs, previewCardLang) : "");
                      const isCustomCover = Boolean(cardBanners[previewCardLang]?.trim());

                      return (
                        <div
                          style={cardBg ? { background: cardBg } : undefined}
                          className={`rounded-2xl border overflow-hidden transition-all duration-300 shadow-md ${
                            cardBg &&
                            (cardBg.includes("#0") ||
                              cardBg.includes("#1") ||
                              cardBg.includes("0f172a") ||
                              cardBg.includes("e11d48"))
                              ? "text-white border-white/20"
                              : "bg-card text-foreground border-border/80"
                          }`}
                        >
                          {/* Banner */}
                          {previewBanner ? (
                            <div className="relative w-full overflow-hidden border-b border-border/40 bg-muted/20">
                              <img
                                src={previewBanner}
                                alt="Preview banner"
                                className="w-full h-auto max-h-[600px] object-cover rounded-t-2xl transition-all duration-300"
                                loading="lazy"
                              />
                              {previewCardLang !== "es" && (
                                <div className="absolute top-2 right-2">
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-black/75 text-white backdrop-blur-xs border border-white/20">
                                    {isCustomCover
                                      ? `Portada personalizada (${previewCardLang.toUpperCase()})`
                                      : "Portada de respaldo (ES)"}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-28 w-full bg-muted/40 border-b border-dashed border-border/60 flex flex-col items-center justify-center text-xs text-muted-foreground gap-1 p-3 text-center">
                              <Sparkles className="size-4 text-primary/60" />
                              <span>Sube una imagen para ver el banner aquí</span>
                            </div>
                          )}

                          {/* Description & Action */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                  cardBg &&
                                  (cardBg.includes("#0") ||
                                    cardBg.includes("0f172a") ||
                                    cardBg.includes("e11d48"))
                                    ? "bg-white/20 text-white"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                {categoriesList.find((c) => c.id === categoryId)?.name ||
                                  "Artículo"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {schoolId === "all"
                                  ? "Todas las escuelas"
                                  : schools.find((s) => s.id === schoolId)?.short_name ||
                                    schools.find((s) => s.id === schoolId)?.name ||
                                    schoolId}
                              </span>
                            </div>

                            <p
                              className={`text-xs font-medium leading-relaxed line-clamp-4 ${
                                cardBg &&
                                (cardBg.includes("#0") ||
                                  cardBg.includes("0f172a") ||
                                  cardBg.includes("e11d48"))
                                  ? "text-slate-200"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {previewSummary ||
                                previewTitle ||
                                "Escribe la descripción o resumen en el formulario para ver cómo luce la tarjeta al instante..."}
                            </p>

                            <div
                              className={`pt-2.5 border-t flex items-center justify-between text-xs font-bold ${
                                cardBg &&
                                (cardBg.includes("#0") ||
                                  cardBg.includes("0f172a") ||
                                  cardBg.includes("e11d48"))
                                  ? "border-white/20 text-white"
                                  : "border-border/60 text-primary"
                              }`}
                            >
                              <span>{previewCardLang === "en" ? "Read more" : "Leer más"}</span>
                              <span>→</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <p className="text-[11px] text-muted-foreground text-center pt-1">
                      💡 Comprueba cómo se visualiza cada idioma disponible con su portada y textos
                      correspondientes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Full Rich Article Body Content (Bilingual ES / EN like cards system) */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      <span>Contenido del Artículo por Idioma</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Redacta o revisa el contenido completo en Español e Inglés con el mismo
                      sistema de pestañas de las tarjetas.
                    </p>
                  </div>

                  {/* Language Selection Tabs for Content */}
                  <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
                    {[
                      {
                        code: "es" as const,
                        label: "🇪🇸 Español (Principal)",
                        hasContent: Boolean(bodyHtmlEs.trim()),
                      },
                      {
                        code: "en" as const,
                        label: "🇺🇸 English (Inglés)",
                        hasContent: Boolean(bodyHtmlEn.trim()),
                      },
                    ].map((item) => {
                      const isActive = contentLang === item.code;
                      return (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => setContentLang(item.code)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            isActive
                              ? "bg-primary text-white shadow-xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                          }`}
                        >
                          <span>{item.label}</span>
                          <span
                            className={`size-2 rounded-full ${
                              item.hasContent
                                ? isActive
                                  ? "bg-white"
                                  : "bg-emerald-500"
                                : "bg-amber-400/80"
                            }`}
                            title={
                              item.hasContent ? "Contenido presente" : "Sin contenido personalizado"
                            }
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toolbar for translation and quick actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/30 px-3.5 py-2 rounded-xl border border-border/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      Editando:{" "}
                      <span className="text-primary font-extrabold">
                        {contentLang === "es" ? "Versión en Español" : "Versión en Inglés"}
                      </span>
                    </span>
                    {contentLang === "en" && !bodyHtmlEn.trim() && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-md border border-amber-500/20">
                        Se auto-traducirá desde el español al guardar si la dejas vacía
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {contentLang === "en" ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={(!bodyHtmlEs.trim() && !titleEs.trim()) || isTranslatingWithAi}
                          className="h-7 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg gap-1.5"
                          onClick={() => handleAiTranslate("step2")}
                        >
                          {isTranslatingWithAi ? (
                            <>
                              <Loader2 className="size-3 animate-spin" />
                              <span>Traduciendo con IA...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="size-3" />
                              <span>⚡ Auto-traducir con IA desde Español</span>
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={!bodyHtmlEs.trim() || isTranslatingWithAi}
                          className="h-7 text-xs font-bold text-muted-foreground hover:text-foreground rounded-lg gap-1"
                          onClick={() => {
                            setBodyHtmlEn(bodyHtmlEs);
                            toast.info("Contenido en español copiado a la versión en inglés.");
                          }}
                        >
                          <Copy className="size-3" />
                          <span>Copiar Español</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={(!bodyHtmlEs.trim() && !titleEs.trim()) || isTranslatingWithAi}
                        className="h-7 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg gap-1.5"
                        onClick={() => handleAiTranslate("step2")}
                      >
                        {isTranslatingWithAi ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            <span>Traduciendo con IA...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-3" />
                            <span>⚡ Traducir con IA y revisar versión en Inglés</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Editor depending on selected language */}
              <div>
                <label className="text-sm font-bold text-foreground block mb-1.5 flex items-center justify-between">
                  <span>
                    {contentLang === "es"
                      ? "Cuerpo principal en Español (Principal)"
                      : "Cuerpo principal en Inglés"}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Formato enriquecido: negritas, títulos, avisos, imágenes y tablas
                  </span>
                </label>
                {contentLang === "es" ? (
                  <VisualRichEditor
                    key="editor-es"
                    value={bodyHtmlEs}
                    onChange={setBodyHtmlEs}
                    placeholder="Redacta el contenido informativo en español. Puedes usar negritas, subtítulos y llamadas..."
                  />
                ) : (
                  <VisualRichEditor
                    key="editor-en"
                    value={bodyHtmlEn}
                    onChange={setBodyHtmlEn}
                    placeholder="Write the informative article content in English..."
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Bottom Navigation System (Volver y Siguiente) */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              {/* Activation Switch Card */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Compass className="size-5 text-primary" />
                      <h3 className="text-base font-extrabold text-foreground">
                        Navegación al pie del artículo (Volver y Siguiente)
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-2xl">
                      Activa botones de navegación debajo del contenido para guiar a las familias:
                      regresar a la categoría o catálogo, y avanzar al siguiente artículo o página
                      relevante.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant={bottomNavEnabled ? "default" : "outline"}
                    className={`min-h-10 px-5 rounded-xl font-bold gap-2 text-xs transition-all ${
                      bottomNavEnabled
                        ? "bg-primary text-white shadow-soft"
                        : "border-border hover:bg-muted text-foreground"
                    }`}
                    onClick={() => {
                      const nextVal = !bottomNavEnabled;
                      setBottomNavEnabled(nextVal);
                      if (nextVal) {
                        toast.success(
                          "Navegación al pie activada. Configura a dónde regresar y a dónde llevar al usuario.",
                        );
                      } else {
                        toast.info("Navegación al pie desactivada.");
                      }
                    }}
                  >
                    <Navigation className="size-4" />
                    <span>{bottomNavEnabled ? "✓ Navegación Activada" : "Activar Navegación"}</span>
                  </Button>
                </div>

                {!bottomNavEnabled && (
                  <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                    <span>
                      La navegación al pie está desactivada. Haz clic en{" "}
                      <strong>"Activar Navegación"</strong> para configurar el botón de volver y el
                      botón de siguiente.
                    </span>
                  </div>
                )}
              </div>

              {bottomNavEnabled && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* BOTÓN DE VOLVER (A dónde regresar al usuario) */}
                    <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs">
                      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ArrowLeft className="size-4 text-primary" />
                          <h4 className="text-sm font-extrabold text-foreground">
                            1. Botón de Volver
                          </h4>
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          A dónde regresar al usuario
                        </span>
                      </div>

                      {/* Options for Back Destination */}
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-2">
                          Destino del botón de regreso:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {
                              id: "category",
                              label: "Categoría actual",
                              desc: "Regresa a los temas de esta categoría",
                            },
                            {
                              id: "topics",
                              label: "Catálogo de Temas",
                              desc: "Ruta /topics con todas las categorías",
                            },
                            {
                              id: "browser_back",
                              label: "Página anterior",
                              desc: "Historial del navegador (Atrás)",
                            },
                            {
                              id: "custom_url",
                              label: "Página o enlace específico",
                              desc: "Ruta interna o enlace web",
                            },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setBackTargetType(opt.id as any)}
                              className={`p-3 rounded-xl border text-start transition-all ${
                                backTargetType === opt.id
                                  ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                                  : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                              }`}
                            >
                              <div className="text-xs font-extrabold text-foreground flex items-center justify-between">
                                <span>{opt.label}</span>
                                {backTargetType === opt.id && (
                                  <span className="text-primary">●</span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground block mt-1 line-clamp-1">
                                {opt.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* If custom URL */}
                      {backTargetType === "custom_url" && (
                        <div className="space-y-2 p-3 bg-muted/30 rounded-xl border border-border/60">
                          <label className="text-xs font-bold text-foreground block">
                            Ruta interna o URL web de regreso:
                          </label>
                          <Input
                            placeholder="Ej: / o /transporte o /ayuda-familias"
                            value={backCustomUrl}
                            onChange={(e) => setBackCustomUrl(e.target.value)}
                            className="h-9 rounded-lg text-xs"
                          />
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {[
                              { label: "Inicio (/)", url: "/" },
                              { label: "Transporte (/transporte)", url: "/transporte" },
                              {
                                label: "Deportes (/deportes-actividades)",
                                url: "/deportes-actividades",
                              },
                              { label: "Ayuda Familias (/ayuda-familias)", url: "/ayuda-familias" },
                              { label: "Calendario (/calendario)", url: "/calendario" },
                            ].map((preset) => (
                              <button
                                key={preset.url}
                                type="button"
                                onClick={() => setBackCustomUrl(preset.url)}
                                className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted font-medium"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom Label & Sublabel */}
                      <div className="space-y-3 pt-2 border-t border-border/60">
                        <div>
                          <label className="text-xs font-bold text-foreground block mb-1">
                            Texto del botón (Opcional):
                          </label>
                          <Input
                            placeholder={
                              backTargetType === "category"
                                ? "Por defecto: Volver a [Nombre de Categoría]"
                                : backTargetType === "topics"
                                  ? "Por defecto: Volver a Temas"
                                  : "Por defecto: Volver"
                            }
                            value={backLabel}
                            onChange={(e) => setBackLabel(e.target.value)}
                            className="h-9 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-foreground block mb-1">
                            Subtítulo (Opcional):
                          </label>
                          <Input
                            placeholder="Ej: Ver catálogo completo de recursos"
                            value={backSublabel}
                            onChange={(e) => setBackSublabel(e.target.value)}
                            className="h-9 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* BOTÓN DE SIGUIENTE (A dónde lo quiero llevar) */}
                    <div className="rounded-2xl border border-primary/30 bg-card p-5 space-y-4 shadow-2xs">
                      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="size-4 text-primary" />
                          <h4 className="text-sm font-extrabold text-foreground">
                            2. Botón de Siguiente
                          </h4>
                        </div>
                        <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                          A dónde llevar al usuario
                        </span>
                      </div>

                      {/* Options for Next Destination */}
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-2">
                          Tipo de destino siguiente:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "article", label: "Otro artículo", desc: "Artículo del portal" },
                            {
                              id: "internal_page",
                              label: "Página dentro",
                              desc: "Ruta del sitio DMPS",
                            },
                            {
                              id: "external_url",
                              label: "Página fuera",
                              desc: "Enlace web externo",
                            },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setNextTargetType(opt.id as any)}
                              className={`p-2.5 rounded-xl border text-start transition-all ${
                                nextTargetType === opt.id
                                  ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                                  : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                              }`}
                            >
                              <div className="text-xs font-extrabold text-foreground flex items-center justify-between">
                                <span>{opt.label}</span>
                                {nextTargetType === opt.id && (
                                  <span className="text-primary">●</span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground block mt-1 line-clamp-1">
                                {opt.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* If Destination is Another Article */}
                      {nextTargetType === "article" && (
                        <div className="space-y-2 p-3 bg-muted/30 rounded-xl border border-border/60">
                          <label className="text-xs font-bold text-foreground block">
                            Selecciona el artículo siguiente:
                          </label>
                          <div className="relative">
                            <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                            <Input
                              placeholder="Buscar artículo publicado por título o palabra clave..."
                              value={articleSearchQuery}
                              onChange={(e) => setArticleSearchQuery(e.target.value)}
                              className="h-8 pl-8 rounded-lg text-xs"
                            />
                          </div>

                          <div className="max-h-44 overflow-y-auto space-y-1 pt-1 pr-1">
                            {filteredArticles.length === 0 ? (
                              <p className="text-[11px] text-muted-foreground py-2 text-center">
                                No se encontraron otros artículos publicados.
                              </p>
                            ) : (
                              filteredArticles.map((art) => {
                                const artTitle = art.article_translations?.[0]?.title || art.slug;
                                const isSelected = nextTargetSlug === art.slug;
                                return (
                                  <button
                                    key={art.id || art.slug}
                                    type="button"
                                    onClick={() => {
                                      setNextTargetSlug(art.slug);
                                      if (!nextLabel.trim() || nextLabel.startsWith("Siguiente:")) {
                                        setNextLabel(`Siguiente: ${artTitle}`);
                                      }
                                    }}
                                    className={`w-full text-start px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                                      isSelected
                                        ? "bg-primary text-white font-bold"
                                        : "bg-background hover:bg-muted text-foreground border border-border/50"
                                    }`}
                                  >
                                    <span className="truncate pr-2">{artTitle}</span>
                                    {isSelected && <span className="text-xs">✓</span>}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* If Destination is Internal Page */}
                      {nextTargetType === "internal_page" && (
                        <div className="space-y-2 p-3 bg-muted/30 rounded-xl border border-border/60">
                          <label className="text-xs font-bold text-foreground block">
                            Ruta interna de la página siguiente:
                          </label>
                          <Input
                            placeholder="Ej: /transporte o /programas-estudiantes"
                            value={nextTargetUrl}
                            onChange={(e) => setNextTargetUrl(e.target.value)}
                            className="h-9 rounded-lg text-xs"
                          />
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {[
                              { label: "Transporte", url: "/transporte" },
                              { label: "Deportes", url: "/deportes-actividades" },
                              { label: "Programas", url: "/programas-estudiantes" },
                              { label: "Ayuda Familias", url: "/ayuda-familias" },
                              { label: "Calendario", url: "/calendario" },
                              { label: "Temas (/topics)", url: "/topics" },
                            ].map((preset) => (
                              <button
                                key={preset.url}
                                type="button"
                                onClick={() => {
                                  setNextTargetUrl(preset.url);
                                  if (!nextLabel.trim() || nextLabel.startsWith("Siguiente:")) {
                                    setNextLabel(`Siguiente: Guía de ${preset.label}`);
                                  }
                                }}
                                className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted font-medium"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* If Destination is External URL */}
                      {nextTargetType === "external_url" && (
                        <div className="space-y-2.5 p-3 bg-muted/30 rounded-xl border border-border/60">
                          <div>
                            <label className="text-xs font-bold text-foreground block mb-1">
                              URL web externa:
                            </label>
                            <Input
                              placeholder="https://www.ridedart.com o https://www.dmschools.org"
                              value={nextTargetUrl}
                              onChange={(e) => setNextTargetUrl(e.target.value)}
                              className="h-9 rounded-lg text-xs"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={nextOpenInNewTab}
                              onChange={(e) => setNextOpenInNewTab(e.target.checked)}
                              className="rounded accent-primary"
                            />
                            <span>Abrir enlace en una pestaña nueva</span>
                          </label>
                        </div>
                      )}

                      {/* Next Custom Label & Sublabel */}
                      <div className="space-y-3 pt-2 border-t border-border/60">
                        <div>
                          <label className="text-xs font-bold text-foreground block mb-1">
                            Texto del botón siguiente:
                          </label>
                          <Input
                            placeholder="Ej: Siguiente: Cómo tramitar el pase gratuito de DART"
                            value={nextLabel}
                            onChange={(e) => setNextLabel(e.target.value)}
                            className="h-9 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-foreground block mb-1">
                            Subtítulo (Opcional):
                          </label>
                          <Input
                            placeholder="Ej: Paso 2 de 3 • Guía oficial de transporte"
                            value={nextSublabel}
                            onChange={(e) => setNextSublabel(e.target.value)}
                            className="h-9 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LIVE PREVIEW OF THE BOTTOM BUTTONS */}
                  <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="size-4 text-primary" />
                        <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                          Vista previa en vivo de los botones al pie del artículo
                        </h4>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Así se verán directamente para las familias debajo del contenido
                      </span>
                    </div>

                    <div className="bg-background rounded-2xl p-4 border border-border/70 shadow-xs">
                      <ArticleBottomNavPreview
                        bottomNav={{
                          enabled: bottomNavEnabled,
                          back: {
                            enabled: true,
                            targetType: backTargetType,
                            label: backLabel.trim() || undefined,
                            sublabel: backSublabel.trim() || undefined,
                            targetUrl: backCustomUrl.trim() || undefined,
                          },
                          next: {
                            enabled: true,
                            targetType: nextTargetType,
                            targetSlug: nextTargetSlug || undefined,
                            targetUrl: nextTargetUrl.trim() || undefined,
                            label: nextLabel.trim() || undefined,
                            sublabel: nextSublabel.trim() || undefined,
                            openInNewTab: nextOpenInNewTab,
                          },
                        }}
                        category={categoriesList.find((c) => c.id === categoryId)}
                        lang={coverLang}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Dates & Source Verification */}
          {activeStep === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Calendar className="size-4 text-primary" />
                    <span>Control de Fechas y Vigencia (America/Chicago)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPermanent}
                      onChange={(e) => {
                        setIsPermanent(e.target.checked);
                        if (e.target.checked) setEndsAt("");
                      }}
                      className="rounded accent-primary"
                    />
                    <span>Contenido permanente (sin fecha de caducidad)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Fecha de inicio (Publicación visible)
                    </label>
                    <Input
                      type="date"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="mt-1 min-h-10 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Fecha de finalización (Caducidad automática)
                    </label>
                    <Input
                      type="date"
                      disabled={isPermanent}
                      value={endsAt}
                      onChange={(e) => {
                        setEndsAt(e.target.value);
                        if (e.target.value) setIsPermanent(false);
                      }}
                      className="mt-1 min-h-10 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Source & Verification */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileCheck2 className="size-4 text-primary" />
                  <span>Fuente Oficial y Verificación</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Nombre de la fuente oficial
                    </label>
                    <Input
                      placeholder="Ej: Distrito Escolar DMPS / Departamento de Transporte"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      className="mt-1 min-h-10 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Enlace oficial (URL con https://)
                    </label>
                    <Input
                      placeholder="https://www.dmschools.org/..."
                      value={officialUrl}
                      onChange={(e) => setOfficialUrl(e.target.value)}
                      className="mt-1 min-h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Nota interna de verificación administrativa
                  </label>
                  <Input
                    placeholder="Ej: Verificado con el boletín oficial de agosto 2026"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="mt-1 min-h-10 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Publishing & Preview */}
          {activeStep === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
                <h3 className="text-base font-bold text-foreground">Estado de Publicación</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Estado del contenido
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground"
                    >
                      <option value="published">Publicado (Visible)</option>
                      <option value="draft">Borrador (Oculto)</option>
                      <option value="in_review">En revisión por equipo</option>
                      <option value="archived">Archivado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Dirección web (Slug)
                    </label>
                    <Input
                      placeholder="guia-inscripciones"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="mt-1 min-h-11 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border/60">
                  <div>
                    <p className="font-bold text-sm text-foreground">
                      Vista previa multi-dispositivo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Comprueba la visualización en teléfonos, tabletas y computadoras antes de
                      publicar.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const cat =
                        categoriesList.find((c) => c.id === categoryId)?.name || "General";
                      const finalTitle = titleEs || titleEn || "Vista previa de artículo";
                      setPreviewData({
                        type: "article",
                        title: finalTitle,
                        summary: summaryEs || summaryEn,
                        body: bodyHtmlEs || bodyHtmlEn,
                        category: cat,
                        school_id: schoolId,
                        starts_at: startsAt,
                        ends_at: endsAt,
                        source_name: sourceName,
                        official_url: officialUrl,
                        image_url: featuredImage,
                        image_alt: imageAlt,
                        status,
                      });
                      setPreviewOpen(true);
                    }}
                    className="min-h-11 gap-2 rounded-xl font-bold border-border shadow-2xs"
                  >
                    <Eye className="size-4 text-primary" />
                    <span>Ver Vista Previa</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-6 border-t border-border/80 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            className="min-h-11 rounded-xl text-muted-foreground"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick save button accessible at any step */}
            <Button
              type="button"
              variant="outline"
              disabled={isSaving || (!titleEs.trim() && !titleEn.trim())}
              className="min-h-11 rounded-xl font-bold px-4 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => handleValidateAndSave()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="size-4 mr-1.5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </Button>

            {activeStep > 1 && (
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                className="min-h-11 rounded-xl"
                onClick={() => setActiveStep(activeStep - 1)}
              >
                Anterior
              </Button>
            )}

            {activeStep < 5 ? (
              <Button
                type="button"
                disabled={isSaving}
                className="min-h-11 rounded-xl font-bold px-6"
                onClick={() => setActiveStep(activeStep + 1)}
              >
                <span>Siguiente</span>
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isSaving || (!titleEs.trim() && !titleEn.trim())}
                className="min-h-11 rounded-xl font-bold px-8 shadow-soft bg-primary text-white hover:bg-primary/90"
                onClick={() => handleValidateAndSave()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    <span>Guardando y Sincronizando...</span>
                  </>
                ) : (
                  <span>Guardar y Validar</span>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Confirmation modal for permanent content */}
      <ConfirmActionDialog
        open={permanentConfirmOpen}
        onOpenChange={setPermanentConfirmOpen}
        config={{
          title: "Contenido sin fecha de finalización",
          description:
            "Este artículo no tiene una fecha de término establecida. ¿Deseas confirmarlo como información permanente o prefieres agregar una fecha de caducidad?",
          consequence:
            "El contenido permanecerá activo en el portal público de forma indefinida hasta que sea archivado manualmente.",
          confirmText: "Sí, es información permanente",
          cancelText: "Volver y agregar fecha",
          variant: "warning",
          onConfirm: () => {
            setIsPermanent(true);
            void handleValidateAndSave(true);
          },
        }}
      />

      {/* Public Preview Modal */}
      <PublicPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        data={previewData}
        onPublish={() => {
          setStatus("published");
          void handleValidateAndSave();
        }}
        onSaveDraft={() => {
          setStatus("draft");
          void handleValidateAndSave();
        }}
      />
    </Dialog>
  );
}
