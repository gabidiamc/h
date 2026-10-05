/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit2,
  ExternalLink,
  Filter,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { LINCOLN_JOB_LISTINGS, type JobListing } from "@/components/job-board";
import { useSchool } from "@/lib/school";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { notifyContentUpdated } from "@/lib/sync";

export const Route = createFileRoute("/admin/empleos")({
  head: () => ({
    meta: [
      { title: "Gestión de Bolsa de Trabajo — Administración DMPS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminEmpleosPage,
});

export function getAdminJobListings(): (JobListing & { school_id?: string })[] {
  return LINCOLN_JOB_LISTINGS;
}

export async function fetchAdminJobListingsFromSupabase(): Promise<
  (JobListing & { school_id?: string })[]
> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "job_listings")
        .maybeSingle();
      if (!error && data?.value && Array.isArray(data.value) && data.value.length > 0) {
        return data.value as (JobListing & { school_id?: string })[];
      }
    } catch (e) {
      console.error(e);
    }
  }
  return LINCOLN_JOB_LISTINGS;
}

export async function saveAdminJobListings(jobs: (JobListing & { school_id?: string })[]) {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from("site_settings").upsert(
        {
          key: "job_listings",
          value: jobs as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );
    } catch (e) {
      console.error("Error saving job listings to Supabase:", e);
    }
  }
  notifyContentUpdated("site_settings");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dmps-jobs-updated"));
  }
}

const EMPTY_JOB: JobListing & { school_id?: string } = {
  id: "",
  employer: "",
  category: "food",
  ageCategory: "16-17",
  positions: {
    es: "",
    en: "",
  },
  details: {
    es: "",
    en: "",
  },
  pay: {
    es: "Pago competitivo por hora",
    en: "Competitive hourly wage",
  },
  ageReq: {
    es: "Desde 16 años en adelante",
    en: "Ages 16 and over",
  },
  location: {
    es: "Des Moines, IA",
    en: "Des Moines, IA",
  },
  contact: {
    name: "",
    phone: "",
    email: "",
    applyUrl: "",
    address: "",
  },
  school_id: "all",
};

export default function AdminEmpleosPage() {
  const { adminSchoolFilter, schools } = useSchool();
  const [jobs, setJobs] = useState<(JobListing & { school_id?: string })[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState<string>(adminSchoolFilter || "all");

  const [editingJob, setEditingJob] = useState<(JobListing & { school_id?: string }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    void fetchAdminJobListingsFromSupabase().then((loaded) => setJobs(loaded));
  }, []);

  const filteredJobs = jobs.filter((job) => {
    // School filter
    if (schoolFilter !== "all") {
      if (job.school_id && job.school_id !== "all" && job.school_id !== schoolFilter) {
        return false;
      }
    }
    // Category filter
    if (categoryFilter !== "all" && job.category !== categoryFilter) {
      return false;
    }
    // Age filter
    if (ageFilter !== "all" && job.ageCategory !== ageFilter) {
      return false;
    }
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        job.employer.toLowerCase().includes(q) ||
        job.positions.es.toLowerCase().includes(q) ||
        job.positions.en.toLowerCase().includes(q) ||
        job.details.es.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleOpenNew = () => {
    setEditingJob({
      ...EMPTY_JOB,
      id: `job-${Date.now()}`,
      school_id: schoolFilter !== "all" ? schoolFilter : "all",
    });
    setIsNew(true);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (job: JobListing & { school_id?: string }) => {
    setEditingJob(JSON.parse(JSON.stringify(job)));
    setIsNew(false);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, employer: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el empleo de "${employer}"?`)) return;
    const updated = jobs.filter((j) => j.id !== id);
    setJobs(updated);
    saveAdminJobListings(updated);
    toast.success("Empleo eliminado correctamente.");
  };

  const handleResetToDefaults = () => {
    if (!window.confirm("¿Deseas restaurar la lista oficial de empleos predeterminados?")) return;
    setJobs(LINCOLN_JOB_LISTINGS);
    saveAdminJobListings(LINCOLN_JOB_LISTINGS);
    toast.success("Empleos restaurados a la lista oficial verificada.");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    if (!editingJob.employer.trim()) {
      toast.error("Por favor ingresa el nombre del empleador / empresa.");
      return;
    }
    if (!editingJob.positions.es.trim()) {
      toast.error("Por favor ingresa los puestos o vacantes en español.");
      return;
    }

    let updated: (JobListing & { school_id?: string })[];
    if (isNew) {
      updated = [editingJob, ...jobs];
    } else {
      updated = jobs.map((j) => (j.id === editingJob.id ? editingJob : j));
    }

    setJobs(updated);
    saveAdminJobListings(updated);
    setIsDialogOpen(false);
    toast.success(isNew ? "¡Nuevo empleo publicado con éxito!" : "¡Empleo actualizado con éxito!");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="size-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Bolsa de Trabajo para Estudiantes
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra los empleos verificados, pasantías y oportunidades para estudiantes de
            Lincoln y East High.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl">
            <Link to="/empleos" target="_blank" rel="noopener noreferrer">
              <span>Ver Página Pública</span>
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>

          <Button
            onClick={handleResetToDefaults}
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-xl text-muted-foreground hover:text-foreground"
            title="Restaurar vacantes predeterminadas"
          >
            <RotateCcw className="size-3.5" />
            <span className="text-xs">Restaurar</span>
          </Button>

          <Button onClick={handleOpenNew} size="sm" className="gap-2 rounded-xl font-bold">
            <Plus className="size-4" />
            <span>Agregar Empleo</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardContent className="p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por empresa, puesto o descripción..."
              className="pl-9 rounded-xl text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* School Filter */}
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger className="w-[160px] rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Escuela" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todas las escuelas</SelectItem>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.short_name || s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="food">Alimentos</SelectItem>
                <SelectItem value="retail">Tiendas</SelectItem>
                <SelectItem value="camp">Campamentos</SelectItem>
                <SelectItem value="trade">Oficios</SelectItem>
                <SelectItem value="care">Cuidado</SelectItem>
                <SelectItem value="youth">Juvenil</SelectItem>
              </SelectContent>
            </Select>

            {/* Age Filter */}
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-[140px] rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Edad" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Cualquier edad</SelectItem>
                <SelectItem value="14-15">14 - 15 años</SelectItem>
                <SelectItem value="16-17">16 - 17 años</SelectItem>
                <SelectItem value="18+">18+ años</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats summary */}
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
        <span>
          Mostrando {filteredJobs.length} empleos de {jobs.length} totales
        </span>
        <span className="text-primary">
          Los cambios se reflejan inmediatamente en la bolsa pública
        </span>
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => (
          <Card
            key={job.id}
            className="flex flex-col justify-between rounded-2xl border-border bg-card p-5 shadow-xs hover:border-primary/40 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase rounded-md">
                      {job.category}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-bold rounded-md">
                      Edad: {job.ageCategory}
                    </Badge>
                    {job.school_id && job.school_id !== "all" && (
                      <Badge className="text-[10px] font-bold rounded-md bg-primary/10 text-primary border-primary/20">
                        {schools.find((s) => s.id === job.school_id)?.short_name ||
                          schools.find((s) => s.id === job.school_id)?.name ||
                          job.school_id}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-foreground truncate">{job.employer}</h3>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-primary line-clamp-1">
                  {job.positions.es}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{job.details.es}</p>
              </div>

              <div className="space-y-1 text-[11px] text-muted-foreground border-t border-border/50 pt-2">
                {job.pay?.es && (
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <DollarSign className="size-3.5 text-emerald-600" />
                    <span>{job.pay.es}</span>
                  </div>
                )}
                {job.location?.es && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{job.location.es}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEdit(job)}
                className="h-8 rounded-lg gap-1.5 text-xs font-semibold"
              >
                <Edit2 className="size-3.5" />
                <span>Editar</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(job.id, job.employer)}
                className="h-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isNew ? "Publicar Nuevo Empleo" : `Editar Empleo: ${editingJob?.employer}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Completa los datos en español e inglés para los estudiantes.
            </DialogDescription>
          </DialogHeader>

          {editingJob && (
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nombre del Empleador / Empresa *</Label>
                  <Input
                    value={editingJob.employer}
                    onChange={(e) => setEditingJob({ ...editingJob, employer: e.target.value })}
                    placeholder="Ej. Des Moines Spaghetti Works"
                    required
                    className="rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Escuela Dirigida</Label>
                  <Select
                    value={editingJob.school_id || "all"}
                    onValueChange={(val) => setEditingJob({ ...editingJob, school_id: val })}
                  >
                    <SelectTrigger className="rounded-xl text-sm">
                      <SelectValue placeholder="Escuela" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">Todas las escuelas</SelectItem>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Categoría de Trabajo</Label>
                  <Select
                    value={editingJob.category}
                    onValueChange={(val) =>
                      setEditingJob({
                        ...editingJob,
                        category: val as StudentJob["category"],
                      })
                    }
                  >
                    <SelectTrigger className="rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="food">Alimentos / Restaurantes</SelectItem>
                      <SelectItem value="retail">Comercio / Tiendas</SelectItem>
                      <SelectItem value="camp">Campamentos de Verano</SelectItem>
                      <SelectItem value="trade">Oficios / Construcción</SelectItem>
                      <SelectItem value="care">Cuidado Infantil / Salud</SelectItem>
                      <SelectItem value="youth">Programas Juveniles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Rango de Edad Requerida</Label>
                  <Select
                    value={editingJob.ageCategory}
                    onValueChange={(val) =>
                      setEditingJob({
                        ...editingJob,
                        ageCategory: val as StudentJob["ageCategory"],
                      })
                    }
                  >
                    <SelectTrigger className="rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="14-15">14 - 15 años (Primer Empleo)</SelectItem>
                      <SelectItem value="16-17">16 - 17 años</SelectItem>
                      <SelectItem value="18+">18 años en adelante</SelectItem>
                      <SelectItem value="all">Cualquier edad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Positions */}
              <div className="space-y-3 rounded-2xl bg-muted/40 p-3.5 border border-border">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Puestos y Vacantes
                </span>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Puestos (Español) *</Label>
                  <Input
                    value={editingJob.positions.es}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        positions: {
                          ...editingJob.positions,
                          es: e.target.value,
                          en: editingJob.positions.en || e.target.value,
                        },
                      })
                    }
                    placeholder="Ej. Anfitrión(a), Cocina y Repartidor de Platillos"
                    required
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Puestos (Inglés)</Label>
                  <Input
                    value={editingJob.positions.en}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        positions: { ...editingJob.positions, en: e.target.value },
                      })
                    }
                    placeholder="Ej. Host, Kitchen & Food Runner"
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3 rounded-2xl bg-muted/40 p-3.5 border border-border">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Descripción y Requisitos
                </span>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Detalles (Español) *</Label>
                  <Textarea
                    value={editingJob.details.es}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        details: {
                          ...editingJob.details,
                          es: e.target.value,
                          en: editingJob.details.en || e.target.value,
                        },
                      })
                    }
                    rows={3}
                    placeholder="Describe las funciones, horarios flexibles y beneficios para estudiantes..."
                    required
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Detalles (Inglés)</Label>
                  <Textarea
                    value={editingJob.details.en}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        details: { ...editingJob.details, en: e.target.value },
                      })
                    }
                    rows={2}
                    placeholder="Describe positions, flexible student schedules, etc..."
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Pay & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Salario / Pago por Hora</Label>
                  <Input
                    value={editingJob.pay?.es || ""}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        pay: {
                          es: e.target.value,
                          en: editingJob.pay?.en || e.target.value,
                        },
                      })
                    }
                    placeholder="Ej. $14 - $16 por hora"
                    className="rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Ubicación / Dirección</Label>
                  <Input
                    value={editingJob.location?.es || ""}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        location: {
                          es: e.target.value,
                          en: editingJob.location?.en || e.target.value,
                        },
                      })
                    }
                    placeholder="Ej. 310 Court Ave, Des Moines, IA"
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Contacto (Nombre)</Label>
                  <Input
                    value={editingJob.contact.name || ""}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        contact: { ...editingJob.contact, name: e.target.value },
                      })
                    }
                    placeholder="Ej. Gerente de Contratación"
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Teléfono</Label>
                  <Input
                    value={editingJob.contact.phone || ""}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        contact: { ...editingJob.contact, phone: e.target.value },
                      })
                    }
                    placeholder="Ej. 515-243-2195"
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Enlace o Correo</Label>
                  <Input
                    value={editingJob.contact.applyUrl || editingJob.contact.email || ""}
                    onChange={(e) =>
                      setEditingJob({
                        ...editingJob,
                        contact: {
                          ...editingJob.contact,
                          applyUrl: e.target.value.startsWith("http") ? e.target.value : "",
                          email: !e.target.value.startsWith("http") ? e.target.value : "",
                        },
                      })
                    }
                    placeholder="https://... o correo@empresa.com"
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="rounded-xl font-bold gap-2">
                  <Save className="size-4" />
                  <span>Guardar y Publicar</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
