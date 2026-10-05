/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Info,
  Layers,
  Megaphone,
  Pencil,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteRow, listRows, upsertRow, type Row } from "@/lib/admin";
import { fetchAllAnnouncements, localizedAnnouncement, type AnnouncementRow } from "@/lib/content";
import { useSchool } from "@/lib/school";
import { notifyContentUpdated, readCache, writeCache } from "@/lib/sync";

export const Route = createFileRoute("/admin/anuncios")({
  head: () => ({
    meta: [
      { title: "Gestión de Anuncios — Administración DMPS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAnnouncementsPage,
});

interface AnnouncementFormData {
  id?: string;
  title: string;
  link_url: string;
  message: string;
  starts_at: string;
  expires_at: string;
  show_on_home: boolean;
  is_pinned: boolean;
  level: "info" | "important" | "urgent";
  status: "published" | "draft" | "archived";
  school_id: string;
}

const DEFAULT_FORM_DATA: AnnouncementFormData = {
  title: "",
  link_url: "",
  message: "",
  starts_at: new Date().toISOString().slice(0, 16),
  expires_at: "",
  show_on_home: true,
  is_pinned: false,
  level: "info",
  status: "published",
  school_id: "all",
};

export function AdminAnnouncementsPage() {
  const { adminSchoolFilter, schools } = useSchool();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>(adminSchoolFilter || "all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AnnouncementFormData>(DEFAULT_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch announcements with fallback cache
  const {
    data: announcements = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-announcements", schoolFilter],
    queryFn: async () => {
      const rows = await listRows("announcements");
      const trs = await listRows("announcement_translations");

      // Merge translations
      return rows.map((r) => {
        const itemTrs = trs.filter((t) => t.announcement_id === r.id);
        const esTr = itemTrs.find((t) => t.language_code === "es") || itemTrs[0];
        return {
          ...r,
          title: (r.title as string) || (esTr?.title as string) || "Sin título",
          message: (r.message as string) || (esTr?.message as string) || "",
          announcement_translations: itemTrs,
        };
      }) as unknown as (AnnouncementRow & { title: string; message: string })[];
    },
  });

  // Filter announcements for table
  const filteredList = useMemo(() => {
    return announcements.filter((item) => {
      // School filter
      if (schoolFilter !== "all") {
        if (item.school_id && item.school_id !== "all" && item.school_id !== schoolFilter) {
          return false;
        }
      }

      // Level filter
      if (levelFilter !== "all" && item.level !== levelFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const titleMatch = (item.title || "").toLowerCase().includes(term);
        const msgMatch = (item.message || "").toLowerCase().includes(term);
        if (!titleMatch && !msgMatch) return false;
      }

      return true;
    });
  }, [announcements, schoolFilter, levelFilter, statusFilter, searchTerm]);

  const handleOpenNew = () => {
    setFormData({
      ...DEFAULT_FORM_DATA,
      starts_at: new Date().toISOString().slice(0, 16),
      school_id: adminSchoolFilter || "all",
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: AnnouncementRow & { title?: string; message?: string }) => {
    const loc = localizedAnnouncement(item, "es");
    setFormData({
      id: item.id,
      title: item.title || loc.title || "",
      link_url: item.link_url || "",
      message: item.message || loc.message || "",
      starts_at: item.starts_at
        ? item.starts_at.slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      expires_at: item.expires_at ? item.expires_at.slice(0, 16) : "",
      show_on_home: item.show_on_home !== false,
      is_pinned: Boolean(item.is_pinned),
      level: item.level || "info",
      status: (item.status as "published" | "draft" | "archived") || "published",
      school_id: item.school_id || "all",
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Por favor ingresa el nombre del aviso.");
      return;
    }

    if (!formData.message.trim()) {
      toast.error("Por favor ingresa la información del anuncio.");
      return;
    }

    setSaving(true);
    try {
      const announcementId = formData.id || crypto.randomUUID();
      const startsAtIso = formData.starts_at
        ? new Date(formData.starts_at).toISOString()
        : new Date().toISOString();
      const expiresAtIso = formData.expires_at ? new Date(formData.expires_at).toISOString() : null;

      const mainRow: Row = {
        id: announcementId,
        level: formData.level,
        status: formData.status,
        starts_at: startsAtIso,
        expires_at: expiresAtIso,
        link_url: formData.link_url.trim() || null,
        show_on_home: formData.show_on_home,
        is_pinned: formData.is_pinned,
        school_id: formData.school_id,
        title: formData.title.trim(),
        message: formData.message.trim(),
        updated_at: new Date().toISOString(),
      };

      // 1. Upsert announcement row
      await upsertRow("announcements", mainRow);

      // 2. Automatically sync announcement translations for 'es' and 'en'
      const esTrRow: Row = {
        id: `${announcementId}_es`,
        announcement_id: announcementId,
        language_code: "es",
        title: formData.title.trim(),
        message: formData.message.trim(),
      };
      const enTrRow: Row = {
        id: `${announcementId}_en`,
        announcement_id: announcementId,
        language_code: "en",
        title: formData.title.trim(),
        message: formData.message.trim(),
      };

      await upsertRow("announcement_translations", esTrRow);
      await upsertRow("announcement_translations", enTrRow);

      // 3. Update local cache for instant UI response
      const cached = readCache<Record<string, unknown>>("announcements") || [];
      const trCache = readCache<Record<string, unknown>>("announcement_translations") || [];

      const filteredCache = cached.filter((c) => c.id !== announcementId);
      filteredCache.unshift({ ...mainRow });
      writeCache("announcements", filteredCache);

      const filteredTrCache = trCache.filter((t) => t.announcement_id !== announcementId);
      filteredTrCache.push(esTrRow);
      filteredTrCache.push(enTrRow);
      writeCache("announcement_translations", filteredTrCache);

      notifyContentUpdated();
      await queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      await queryClient.invalidateQueries({ queryKey: ["announcements"] });
      await queryClient.invalidateQueries({ queryKey: ["announcements-all"] });

      toast.success(
        isEditing
          ? "¡Aviso actualizado y publicado con éxito!"
          : "¡Nuevo aviso creado y publicado con éxito!",
      );
      setDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(`Error al guardar aviso: ${err?.message || "Inténtalo de nuevo."}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteRow("announcements", id);

      const cached = readCache<Record<string, unknown>>("announcements") || [];
      writeCache(
        "announcements",
        cached.filter((c) => c.id !== id),
      );

      notifyContentUpdated();
      await queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      await queryClient.invalidateQueries({ queryKey: ["announcements"] });
      await queryClient.invalidateQueries({ queryKey: ["announcements-all"] });

      toast.success("Aviso eliminado correctamente.");
      setDeleteConfirmId(null);
      refetch();
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err?.message || "Ocurrió un fallo"}`);
    }
  };

  const handleToggleStatus = async (
    item: AnnouncementRow & { title?: string; message?: string },
  ) => {
    const nextStatus = item.status === "published" ? "draft" : "published";
    try {
      await upsertRow("announcements", {
        ...item,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      });
      notifyContentUpdated();
      toast.success(
        nextStatus === "published"
          ? "Aviso publicado en el sitio."
          : "Aviso cambiado a borrador (oculto para familias).",
      );
      refetch();
    } catch {
      toast.error("Error al cambiar estado.");
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Megaphone className="size-3.5" />
            <span>Gestión de Anuncios y Alertas</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Avisos Oficiales para Familias
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea comunicados oficiales, alertas de clima, fechas límite y avisos que se verán en la
            portada y en el Centro de Avisos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/announcements" target="_blank">
              <Eye className="mr-2 size-4" />
              <span>Ver en el Sitio Público</span>
            </Link>
          </Button>

          <Button
            onClick={handleOpenNew}
            className="rounded-xl bg-primary shadow-soft hover:opacity-95"
          >
            <Plus className="mr-2 size-4" />
            <span>Crear Nuevo Aviso</span>
          </Button>
        </div>
      </div>

      {/* Control bar: search & filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 bg-card border border-border p-4 rounded-2xl shadow-2xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o contenido..."
            className="pl-9 rounded-xl"
          />
        </div>

        {/* Level filter */}
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Nivel de aviso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los niveles</SelectItem>
            <SelectItem value="info">Informativo (Azul)</SelectItem>
            <SelectItem value="important">Importante (Ámbar)</SelectItem>
            <SelectItem value="urgent">Urgente (Rojo)</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
          </SelectContent>
        </Select>

        {/* School filter */}
        <Select value={schoolFilter} onValueChange={setSchoolFilter}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Escuela" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las escuelas (Distrito)</SelectItem>
            {schools.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-2 p-8 text-center bg-muted/10">
            <CardContent className="pt-6 space-y-3">
              <Megaphone className="size-10 text-muted-foreground mx-auto opacity-50" />
              <h3 className="text-lg font-bold text-foreground">No hay avisos que coincidan</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                No se encontraron anuncios con los filtros seleccionados. Puedes crear uno nuevo con
                el botón superior.
              </p>
              <Button onClick={handleOpenNew} className="rounded-xl mt-2">
                <Plus className="mr-2 size-4" />
                Crear Nuevo Aviso
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredList.map((item) => {
            const isUrgent = item.level === "urgent";
            const isImportant = item.level === "important";
            const isPublished = item.status === "published";

            return (
              <Card
                key={item.id}
                className={`overflow-hidden rounded-2xl border transition-all hover:border-primary/40 ${
                  isUrgent
                    ? "border-rose-300 dark:border-rose-900 bg-rose-50/20"
                    : isImportant
                      ? "border-amber-300 dark:border-amber-900 bg-amber-50/20"
                      : "border-border bg-card"
                }`}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Content preview */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Level badge */}
                        <Badge
                          className={
                            isUrgent
                              ? "bg-rose-600 text-white"
                              : isImportant
                                ? "bg-amber-600 text-white"
                                : "bg-blue-600 text-white"
                          }
                        >
                          {isUrgent ? "Urgente" : isImportant ? "Importante" : "Informativo"}
                        </Badge>

                        {/* Status badge */}
                        <Badge variant={isPublished ? "default" : "secondary"}>
                          {isPublished ? "Publicado" : "Borrador"}
                        </Badge>

                        {/* Home indicator */}
                        {item.show_on_home && (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 font-medium"
                          >
                            ✓ En Portada
                          </Badge>
                        )}

                        {/* Pinned indicator */}
                        {item.is_pinned && (
                          <Badge
                            variant="outline"
                            className="border-primary/40 text-primary bg-primary/10 font-medium inline-flex items-center gap-1"
                          >
                            <Pin className="size-3" />
                            <span>Fijado</span>
                          </Badge>
                        )}

                        {/* School tag */}
                        <span className="text-xs text-muted-foreground">
                          {!item.school_id || item.school_id === "all"
                            ? "Distrito (Todas)"
                            : schools.find((s) => s.id === item.school_id)?.short_name ||
                              schools.find((s) => s.id === item.school_id)?.name ||
                              item.school_id}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-foreground leading-snug">
                        {item.title || "Aviso sin título"}
                      </h3>

                      {/* Message preview */}
                      <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                        {item.message || "Sin contenido descriptivo."}
                      </p>

                      {/* Metadata: dates & link */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                        {item.starts_at && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5" />
                            <span>
                              Inicia:{" "}
                              {new Date(item.starts_at).toLocaleDateString("es-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </span>
                        )}

                        {item.expires_at ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                            <Calendar className="size-3.5" />
                            <span>
                              Caduca:{" "}
                              {new Date(item.expires_at).toLocaleDateString("es-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70">Sin fecha de caducidad</span>
                        )}

                        {item.link_url && (
                          <a
                            href={item.link_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            <span className="max-w-[200px] truncate">{item.link_url}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(item)}
                        className="rounded-xl text-xs font-semibold"
                        title={isPublished ? "Ocultar a familias" : "Publicar ahora"}
                      >
                        {isPublished ? "Despublicar" : "Publicar"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-xl text-xs font-semibold"
                      >
                        <Pencil className="mr-1.5 size-3.5" />
                        Editar
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="rounded-xl text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Direct Create / Edit Modal without asking for languages */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Megaphone className="size-5 text-primary" />
              <span>{isEditing ? "Editar Aviso Oficial" : "Crear Nuevo Aviso Oficial"}</span>
            </DialogTitle>
            <DialogDescription>
              Configura los detalles del anuncio. Este formulario guarda la información directamente
              para que aparezca en el Centro de Avisos y en la Portada según lo configures.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAnnouncement} className="space-y-5 mt-4">
            {/* 1. Nombre del aviso */}
            <div className="space-y-2">
              <Label htmlFor="form-title" className="font-bold text-foreground">
                Nombre del aviso <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Cierre de escuelas por tormenta de nieve / Alerta de transporte"
                required
                className="rounded-xl text-base"
              />
            </div>

            {/* 2. Link si hay uno */}
            <div className="space-y-2">
              <Label htmlFor="form-link" className="font-bold text-foreground">
                Enlace o Link{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (Opcional si hay uno)
                </span>
              </Label>
              <Input
                id="form-link"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="https://dmschools.org/aviso-oficial o /calendario"
                className="rounded-xl text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Si el aviso incluye un sitio oficial, formulario o enlace interno, ponlo aquí.
              </p>
            </div>

            {/* 3. Información del anuncio */}
            <div className="space-y-2">
              <Label htmlFor="form-message" className="font-bold text-foreground">
                Información del anuncio <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="form-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Escribe el comunicado oficial completo para las familias..."
                rows={4}
                required
                className="rounded-xl leading-relaxed text-sm"
              />
            </div>

            {/* 4. Fechas (Inicio y Caducidad) */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="form-starts-at"
                  className="font-bold text-foreground flex items-center gap-1.5"
                >
                  <Clock className="size-4 text-primary" />
                  <span>Fecha y hora de inicio</span>
                </Label>
                <Input
                  id="form-starts-at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  className="rounded-xl text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="form-expires-at"
                  className="font-bold text-foreground flex items-center gap-1.5"
                >
                  <Calendar className="size-4 text-amber-600" />
                  <span>Fecha de caducidad</span>
                </Label>
                <Input
                  id="form-expires-at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="rounded-xl text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Déjalo vacío si el anuncio no tiene fecha de caducidad.
                </p>
              </div>
            </div>

            {/* 5. Nivel de anuncio & Escuela */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-bold text-foreground">Nivel del anuncio</Label>
                <Select
                  value={formData.level}
                  onValueChange={(val: "info" | "important" | "urgent") =>
                    setFormData({ ...formData, level: val })
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecciona nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informativo (Azul - Normal)</SelectItem>
                    <SelectItem value="important">Importante (Ámbar - Relevante)</SelectItem>
                    <SelectItem value="urgent">Urgente (Rojo - Emergencia)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-foreground">Escuela destinataria</Label>
                <Select
                  value={formData.school_id}
                  onValueChange={(val) => setFormData({ ...formData, school_id: val })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecciona escuela" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las escuelas (Distrito)</SelectItem>
                    {schools.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 6. ¿Estará en la página principal? & Fijar arriba */}
            <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-sm text-foreground">
                    ¿Mostrar en la página principal (Inicio)?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Si está activado, este anuncio aparecerá visible en la portada principal para
                    todas las familias.
                  </p>
                </div>
                <Switch
                  checked={formData.show_on_home}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_on_home: checked })}
                />
              </div>

              <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/60">
                <div>
                  <p className="font-bold text-sm text-foreground">Fijar al inicio de la lista</p>
                  <p className="text-xs text-muted-foreground">
                    Aparecerá en los primeros lugares por encima de los avisos regulares.
                  </p>
                </div>
                <Switch
                  checked={formData.is_pinned}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                />
              </div>
            </div>

            {/* 7. Estado: Publicado vs Borrador */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="font-bold text-sm text-foreground">Estado de publicación</p>
                <p className="text-xs text-muted-foreground">
                  {formData.status === "published"
                    ? "El aviso será visible inmediatamente para las familias."
                    : "El aviso se guardará como borrador y no será visible para las familias."}
                </p>
              </div>
              <Select
                value={formData.status}
                onValueChange={(val: "published" | "draft") =>
                  setFormData({ ...formData, status: val })
                }
              >
                <SelectTrigger className="w-[140px] rounded-xl font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="rounded-xl bg-primary shadow-soft">
                {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Publicar Aviso"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={Boolean(deleteConfirmId)} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" />
              <span>¿Eliminar este aviso oficial?</span>
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará el anuncio del sitio web y de la portada. Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteAnnouncement(deleteConfirmId)}
              className="rounded-xl"
            >
              Sí, eliminar aviso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
