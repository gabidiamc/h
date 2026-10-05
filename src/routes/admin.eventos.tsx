/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CalendarDays,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Info,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  AlertTriangle,
  School,
  CheckCircle2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { fetchEvents, type EventRow } from "@/lib/content";
import { useSchool } from "@/lib/school";
import { notifyContentUpdated } from "@/lib/sync";

export const Route = createFileRoute("/admin/eventos")({
  head: () => ({
    meta: [
      { title: "Gestión de Eventos Escolares — Administración DMPS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminEventsPage,
});

interface EventFormData {
  id?: string;
  title: string;
  event_type: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
  official_url: string;
  school_id: string;
  status: "published" | "draft" | "archived";
  is_featured: boolean;
}

const DEFAULT_EVENT_FORM: EventFormData = {
  title: "",
  event_type: "academic",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  all_day: true,
  start_time: "08:00",
  end_time: "15:00",
  location: "",
  description: "",
  official_url: "",
  school_id: "all",
  status: "published",
  is_featured: false,
};

const EVENT_TYPES = [
  { value: "academic", label: "Académico / Escolar" },
  { value: "no_school", label: "Sin Clases / Festivo" },
  { value: "conference", label: "Conferencias de Padres" },
  { value: "early_dismissal", label: "Salida Temprana" },
  { value: "sports", label: "Deportes y Partidos" },
  { value: "family", label: "Evento Familiar / Taller" },
  { value: "deadline", label: "Fecha Límite / Inscripciones" },
  { value: "general", label: "General" },
];

export function AdminEventsPage() {
  const { adminSchoolFilter, schools } = useSchool();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>(adminSchoolFilter || "all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(DEFAULT_EVENT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch events with fallback
  const {
    data: events = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-events", schoolFilter],
    queryFn: async () => {
      const rows = await listRows("events");
      const trs = await listRows("event_translations");

      return rows.map((r) => {
        const itemTrs = trs.filter((t) => t.event_id === r.id);
        const esTr = itemTrs.find((t) => t.language_code === "es") || itemTrs[0];
        return {
          ...r,
          title: (r.title as string) || (esTr?.title as string) || "Evento sin título",
          description: (r.description as string) || (esTr?.description as string) || "",
          event_translations: itemTrs,
        };
      }) as unknown as (EventRow & { title: string; description: string })[];
    },
  });

  const filteredEvents = useMemo(() => {
    return events.filter((item) => {
      if (schoolFilter !== "all") {
        if (item.school_id && item.school_id !== "all" && item.school_id !== schoolFilter) {
          return false;
        }
      }

      if (typeFilter !== "all" && item.event_type !== typeFilter) {
        return false;
      }

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const titleMatch = (item.title || "").toLowerCase().includes(term);
        const descMatch = (item.description || "").toLowerCase().includes(term);
        const locMatch = (item.location || "").toLowerCase().includes(term);
        if (!titleMatch && !descMatch && !locMatch) return false;
      }

      return true;
    });
  }, [events, schoolFilter, typeFilter, statusFilter, searchTerm]);

  const handleOpenNew = () => {
    setFormData({
      ...DEFAULT_EVENT_FORM,
      start_date: new Date().toISOString().slice(0, 10),
      school_id: adminSchoolFilter || "all",
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: EventRow & { title?: string; description?: string }) => {
    setFormData({
      id: item.id,
      title: item.title || "",
      event_type: item.event_type || "academic",
      start_date: item.start_date || new Date().toISOString().slice(0, 10),
      end_date: item.end_date || "",
      all_day: Boolean(item.all_day),
      start_time: item.start_time || "08:00",
      end_time: item.end_time || "15:00",
      location: item.location || "",
      description: item.description || "",
      official_url: item.official_url || (item as any).link_url || "",
      school_id: item.school_id || "all",
      status: (item.status as "published" | "draft" | "archived") || "published",
      is_featured: Boolean((item as any).is_featured),
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Por favor ingresa el título o nombre del evento.");
      return;
    }

    if (!formData.start_date) {
      toast.error("Por favor especifica la fecha del evento.");
      return;
    }

    setSaving(true);
    try {
      const eventId = formData.id || crypto.randomUUID();

      const eventRow: Row = {
        id: eventId,
        title: formData.title.trim(),
        event_type: formData.event_type,
        start_date: formData.start_date,
        end_date: formData.end_date || formData.start_date,
        all_day: formData.all_day,
        start_time: formData.all_day ? null : formData.start_time,
        end_time: formData.all_day ? null : formData.end_time,
        location: formData.location.trim() || null,
        description: formData.description.trim() || null,
        official_url: formData.official_url.trim() || null,
        link_url: formData.official_url.trim() || null,
        school_id: formData.school_id,
        status: formData.status,
        is_featured: formData.is_featured,
        updated_at: new Date().toISOString(),
      };

      // 1. Upsert event row
      await upsertRow("events", eventRow);

      // 2. Sync event translations for 'es' and 'en'
      const esTr: Row = {
        id: `${eventId}_es`,
        event_id: eventId,
        language_code: "es",
        title: formData.title.trim(),
        description: formData.description.trim() || null,
      };
      const enTr: Row = {
        id: `${eventId}_en`,
        event_id: eventId,
        language_code: "en",
        title: formData.title.trim(),
        description: formData.description.trim() || null,
      };

      await upsertRow("event_translations", esTr);
      await upsertRow("event_translations", enTr);

      notifyContentUpdated("events");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dmps-calendar-updated"));
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      await queryClient.invalidateQueries({ queryKey: ["events"] });

      toast.success(
        isEditing
          ? "¡Evento actualizado y publicado en el calendario!"
          : "¡Nuevo evento guardado y publicado en Fechas y Calendario Escolar!",
      );
      setDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(`Error al guardar evento: ${err?.message || "Inténtalo de nuevo."}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteRow("events", id);

      notifyContentUpdated("events");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dmps-calendar-updated"));
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      await queryClient.invalidateQueries({ queryKey: ["events"] });

      toast.success("Evento eliminado del calendario.");
      setDeleteConfirmId(null);
      refetch();
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err?.message || "Ocurrió un fallo"}`);
    }
  };

  const handleToggleStatus = async (item: EventRow & { title?: string }) => {
    const nextStatus = item.status === "published" ? "draft" : "published";
    try {
      await upsertRow("events", {
        ...item,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      });
      notifyContentUpdated();
      toast.success(
        nextStatus === "published"
          ? "Evento publicado en el calendario escolar."
          : "Evento guardado como borrador (oculto en calendario).",
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
            <CalendarDays className="size-3.5" />
            <span>Calendario y Eventos Escolares</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Eventos y Fechas del Calendario
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publica y administra eventos escolares, conferencias, días sin clases y actividades.
            Aparecen automáticamente en <strong>Fechas y Calendario Escolar</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/calendario" target="_blank">
              <Eye className="mr-2 size-4" />
              <span>Ver Calendario Público</span>
            </Link>
          </Button>

          <Button
            onClick={handleOpenNew}
            className="rounded-xl bg-primary shadow-soft hover:opacity-95"
          >
            <Plus className="mr-2 size-4" />
            <span>Agregar Evento al Calendario</span>
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
            placeholder="Buscar por título, lugar..."
            className="pl-9 rounded-xl"
          />
        </div>

        {/* Type filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
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

      {/* Events List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-2 p-8 text-center bg-muted/10">
            <CardContent className="pt-6 space-y-3">
              <CalendarDays className="size-10 text-muted-foreground mx-auto opacity-50" />
              <h3 className="text-lg font-bold text-foreground">No hay eventos en la lista</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                No se encontraron eventos escolares con los filtros seleccionados. Publica el primer
                evento para que aparezca en el calendario oficial de las familias.
              </p>
              <Button onClick={handleOpenNew} className="rounded-xl mt-2">
                <Plus className="mr-2 size-4" />
                Agregar Evento al Calendario
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((item) => {
            const isPublished = item.status === "published";
            const typeInfo = EVENT_TYPES.find((t) => t.value === item.event_type) || {
              label: item.event_type,
              value: item.event_type,
            };

            return (
              <Card
                key={item.id}
                className="overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-semibold capitalize">
                          {typeInfo.label}
                        </Badge>

                        <Badge variant={isPublished ? "default" : "secondary"}>
                          {isPublished ? "Publicado" : "Borrador"}
                        </Badge>

                        {item.school_id && (
                          <span className="text-xs text-muted-foreground">
                            {item.school_id === "all"
                              ? "Distrito (Todas)"
                              : schools.find((s) => s.id === item.school_id)?.short_name ||
                                schools.find((s) => s.id === item.school_id)?.name ||
                                item.school_id}
                          </span>
                        )}
                      </div>

                      {/* Event Title */}
                      <h3 className="text-lg font-bold text-foreground leading-snug">
                        {item.title}
                      </h3>

                      {/* Event Description */}
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Date, Time, Location & Link */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                          <Calendar className="size-3.5 text-primary" />
                          <span>
                            {item.start_date}
                            {item.end_date && item.end_date !== item.start_date
                              ? ` hasta ${item.end_date}`
                              : ""}
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          <span>
                            {item.all_day
                              ? "Todo el día"
                              : `${item.start_time || "08:00"} - ${item.end_time || "15:00"}`}
                          </span>
                        </span>

                        {item.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5 text-rose-500" />
                            <span>{item.location}</span>
                          </span>
                        )}

                        {item.official_url && (
                          <a
                            href={item.official_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                          >
                            <ExternalLink className="size-3" />
                            <span>Enlace oficial</span>
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
                        title={isPublished ? "Ocultar del calendario" : "Publicar ahora"}
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

      {/* Direct Create / Edit Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              <span>
                {isEditing ? "Editar Evento Escolar" : "Agregar Nuevo Evento al Calendario"}
              </span>
            </DialogTitle>
            <DialogDescription>
              Al publicar este evento, aparecerá en el calendario escolar oficial de las familias
              con fecha, horario, ubicación y enlaces.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEvent} className="space-y-5 mt-4">
            {/* 1. Nombre del evento */}
            <div className="space-y-2">
              <Label htmlFor="event-title" className="font-bold text-foreground">
                Nombre del evento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="event-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Conferencias de Otoño / Inicio de Clases / Receso de Primavera"
                required
                className="rounded-xl text-base"
              />
            </div>

            {/* 2. Tipo de evento & Escuela */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-bold text-foreground">Tipo de evento</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(val) => setFormData({ ...formData, event_type: val })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-foreground">Escuela</Label>
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

            {/* 3. Fechas */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="event-start-date"
                  className="font-bold text-foreground flex items-center gap-1.5"
                >
                  <Calendar className="size-4 text-primary" />
                  <span>
                    Fecha de inicio <span className="text-destructive">*</span>
                  </span>
                </Label>
                <Input
                  id="event-start-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="rounded-xl text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="event-end-date"
                  className="font-bold text-foreground flex items-center gap-1.5"
                >
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>Fecha de fin (Opcional)</span>
                </Label>
                <Input
                  id="event-end-date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            {/* 4. Horario: Todo el día vs Horas */}
            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-sm text-foreground">¿Evento de todo el día?</p>
                  <p className="text-xs text-muted-foreground">
                    Actívalo para días festivos, recesos o fechas generales sin hora específica.
                  </p>
                </div>
                <Switch
                  checked={formData.all_day}
                  onCheckedChange={(checked) => setFormData({ ...formData, all_day: checked })}
                />
              </div>

              {!formData.all_day && (
                <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/60">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Hora de inicio</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Hora de fin</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 5. Ubicación / Lugar */}
            <div className="space-y-2">
              <Label
                htmlFor="event-location"
                className="font-bold text-foreground flex items-center gap-1.5"
              >
                <MapPin className="size-4 text-rose-500" />
                <span>
                  Ubicación o Lugar{" "}
                  <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
                </span>
              </Label>
              <Input
                id="event-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ej: Auditorio Principal, Gimnasio Lincoln, o Enlace Virtual"
                className="rounded-xl text-sm"
              />
            </div>

            {/* 6. Enlace / Link si hay uno */}
            <div className="space-y-2">
              <Label
                htmlFor="event-link"
                className="font-bold text-foreground flex items-center gap-1.5"
              >
                <ExternalLink className="size-4 text-primary" />
                <span>
                  Enlace o Link{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (Opcional si hay uno)
                  </span>
                </span>
              </Label>
              <Input
                id="event-link"
                value={formData.official_url}
                onChange={(e) => setFormData({ ...formData, official_url: e.target.value })}
                placeholder="https://... o formulario de registro"
                className="rounded-xl text-sm"
              />
            </div>

            {/* 7. Descripción / Información del evento */}
            <div className="space-y-2">
              <Label htmlFor="event-desc" className="font-bold text-foreground">
                Información y detalles del evento
              </Label>
              <Textarea
                id="event-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Escribe los detalles que las familias deben saber..."
                rows={3}
                className="rounded-xl text-sm"
              />
            </div>

            {/* 8. Estado */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="font-bold text-sm text-foreground">Estado del evento</p>
                <p className="text-xs text-muted-foreground">
                  {formData.status === "published"
                    ? "Visible para las familias en el calendario escolar."
                    : "Guardado como borrador."}
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
                {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Publicar en Calendario"}
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
              <span>¿Eliminar este evento escolar?</span>
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará el evento del calendario escolar. No se podrá recuperar.
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
              onClick={() => deleteConfirmId && handleDeleteEvent(deleteConfirmId)}
              className="rounded-xl"
            >
              Sí, eliminar evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
