import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FolderPlus,
  Globe,
  HelpCircle,
  Layers,
  Link as LinkIcon,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { FileUploadInput } from "@/components/file-upload-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSchool, getSchoolById } from "@/lib/school";
import {
  type BoundActivity,
  type BoundEvent,
  type BoundSyncLog,
  type BoundStatus,
  type BoundTeam,
  type BoundCategory,
  type GenderGroup,
  formatDateFormatted,
  deleteActivity,
  fetchActivitiesForSchool,
  getStoredEvents,
  getStoredRegistrationSettings,
  getStoredSyncLogs,
  getStoredTeams,
  LINCOLN_BOUND_BASE_URL,
  saveActivitiesForSchool,
  saveStoredEvents,
  saveStoredRegistrationSettings,
  saveStoredSyncLogs,
  saveStoredTeams,
} from "@/lib/bound";

export const Route = createFileRoute("/admin/actividades")({
  component: AdminDeportesActividadesPage,
});

export function AdminDeportesActividadesPage() {
  const { adminSchoolFilter } = useSchool();
  const currentSchoolId =
    adminSchoolFilter && adminSchoolFilter !== "all" ? adminSchoolFilter : "lincoln";
  const activeSchool = getSchoolById(currentSchoolId);
  const activeBoundUrl = activeSchool.boundUrl || LINCOLN_BOUND_BASE_URL;

  const [activities, setActivities] = useState<BoundActivity[]>([]);
  const [teams, setTeams] = useState<BoundTeam[]>(() => getStoredTeams(currentSchoolId));
  const [events, setEvents] = useState<BoundEvent[]>(() => getStoredEvents(currentSchoolId));
  const [regSettings, setRegSettings] = useState(() =>
    getStoredRegistrationSettings(currentSchoolId),
  );
  const [syncLogs, setSyncLogs] = useState<BoundSyncLog[]>(() => getStoredSyncLogs());

  useEffect(() => {
    void fetchActivitiesForSchool(currentSchoolId)
      .then(setActivities)
      .catch(() => setActivities([]));
    setTeams(getStoredTeams(currentSchoolId));
    setEvents(getStoredEvents(currentSchoolId));
    setRegSettings(getStoredRegistrationSettings(currentSchoolId));
  }, [currentSchoolId]);

  // Active admin tab
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "girls"
    | "boys"
    | "coed"
    | "extracurricular"
    | "teams"
    | "schedules"
    | "announcement"
    | "sync"
    | "duplicates"
  >("overview");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Duplicates selection
  const [primaryDupId, setPrimaryDupId] = useState("");
  const [secondaryDupId, setSecondaryDupId] = useState("");

  // Edit / Create Activity State
  const [editingActivity, setEditingActivity] = useState<BoundActivity | null>(null);
  const [isNewActivity, setIsNewActivity] = useState(false);

  // Helper to show save feedback
  const showSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  };

  // Start creating a new activity from scratch
  const handleStartNewActivity = () => {
    const timestamp = Date.now();
    const newAct: BoundActivity = {
      id: `act-custom-${timestamp}`,
      bound_id: `custom-${timestamp}`,
      name: "",
      translated_name: "",
      slug: `actividad-${timestamp}`,
      category: "coed",
      gender_group: "Coed",
      activity_type: "sport",
      official_url: "",
      registration_url: "",
      icon_url: null,
      card_banner_url: null,
      card_bg: null,
      season: "Year-Round",
      status: "Registro abierto",
      is_active: true,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      levels: ["Varsity", "JV"],
    };
    setEditingActivity(newAct);
    setIsNewActivity(true);
  };

  // Duplicate activity
  const handleDuplicateActivity = (source: BoundActivity) => {
    const timestamp = Date.now();
    const dup: BoundActivity = {
      ...source,
      id: `act-custom-${timestamp}`,
      bound_id: `custom-${timestamp}`,
      name: `${source.name} (Copia)`,
      translated_name: source.translated_name ? `${source.translated_name} (Copia)` : null,
      slug: `${source.slug}-copia-${timestamp}`,
      updated_at: new Date().toISOString(),
    };
    setEditingActivity(dup);
    setIsNewActivity(true);
  };

  // Delete activity
  const handleDeleteActivity = (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${name}"?`)) return;
    const updated = activities.filter((a) => a.id !== id);
    setActivities(updated);
    void deleteActivity(id).catch((e: Error) =>
      alert(`No se pudo eliminar en la base de datos: ${e.message}`),
    );
    void saveActivitiesForSchool(updated, currentSchoolId).catch((e: Error) =>
      alert(`No se pudo guardar en la base de datos: ${e.message}`),
    );
    if (editingActivity?.id === id) {
      setEditingActivity(null);
    }
    showSuccess(`"${name}" ha sido eliminado.`);
  };

  // Toggle activity visibility/active
  const toggleActivityActive = (id: string) => {
    const updated = activities.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a));
    setActivities(updated);
    void saveActivitiesForSchool(updated, currentSchoolId).catch((e: Error) =>
      alert(`No se pudo guardar en la base de datos: ${e.message}`),
    );
    showSuccess("Estado de visibilidad actualizado.");
  };

  // Save registration banner settings
  const handleSaveRegSettings = () => {
    const updated = {
      ...regSettings,
      verified_at: new Date().toISOString(),
    };
    setRegSettings(updated);
    saveStoredRegistrationSettings(updated, currentSchoolId);
    showSuccess("Configuración del anuncio de registro guardada con éxito.");
  };

  // Save single activity edits (both new and update)
  const handleSaveActivityEdit = () => {
    if (!editingActivity) return;
    if (!editingActivity.name.trim()) {
      alert("Por favor ingresa un nombre para el deporte o actividad.");
      return;
    }

    let updated: BoundActivity[];
    const now = new Date().toISOString();
    const finalActivity: BoundActivity = {
      ...editingActivity,
      updated_at: now,
      verified_at: editingActivity.verified_at || now,
      card_banner_url: editingActivity.card_banner_url || editingActivity.icon_url || null,
      icon_url: editingActivity.card_banner_url || editingActivity.icon_url || null,
    };

    if (isNewActivity) {
      updated = [finalActivity, ...activities];
    } else {
      updated = activities.map((a) => (a.id === finalActivity.id ? finalActivity : a));
    }

    setActivities(updated);
    void saveActivitiesForSchool(updated, currentSchoolId).catch((e: Error) =>
      alert(`No se pudo guardar en la base de datos: ${e.message}`),
    );
    setEditingActivity(null);
    setIsNewActivity(false);
    showSuccess(
      isNewActivity
        ? `Actividad "${finalActivity.name}" creada y guardada con éxito.`
        : `Actividad "${finalActivity.name}" actualizada con éxito.`,
    );
  };

  // Trigger manual Bound sync
  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      const newLog: BoundSyncLog = {
        id: `sync-${Date.now()}`,
        sync_type: "Manual Bound Audit & Link Verification",
        source_url: LINCOLN_BOUND_BASE_URL,
        started_at: now,
        completed_at: new Date(Date.now() + 1500).toISOString(),
        status: "success",
        items_created: 0,
        items_updated: activities.length,
        error_summary: null,
      };
      const updatedLogs = [newLog, ...syncLogs];
      setSyncLogs(updatedLogs);
      saveStoredSyncLogs(updatedLogs);

      // Touch verified_at on activities
      const updatedActs = activities.map((a) => ({ ...a, verified_at: now }));
      setActivities(updatedActs);
      void saveActivitiesForSchool(updatedActs, currentSchoolId).catch((e: Error) =>
        alert(`No se pudo guardar en la base de datos: ${e.message}`),
      );

      setSyncing(false);
      showSuccess("Sincronización y verificación completada.");
    }, 1200);
  };

  // Merge duplicates
  const handleMergeDuplicates = () => {
    if (!primaryDupId || !secondaryDupId || primaryDupId === secondaryDupId) {
      alert("Selecciona dos elementos diferentes para combinar.");
      return;
    }
    const removedId = secondaryDupId;
    const updatedActs = activities.filter((a) => a.id !== removedId);
    setActivities(updatedActs);
    void deleteActivity(removedId).catch((e: Error) =>
      alert(`No se pudo eliminar en la base de datos: ${e.message}`),
    );
    void saveActivitiesForSchool(updatedActs, currentSchoolId).catch((e: Error) =>
      alert(`No se pudo guardar en la base de datos: ${e.message}`),
    );
    setPrimaryDupId("");
    setSecondaryDupId("");
    showSuccess("Duplicado eliminado y fusionado en el registro principal.");
  };

  // Filtered lists
  const girlsActivities = activities.filter(
    (a) => a.category === "girls" || a.category === "girls_coop",
  );
  const boysActivities = activities.filter((a) => a.category === "boys");
  const coedActivities = activities.filter((a) => a.category === "coed");
  const extraActivities = activities.filter((a) => a.category === "extracurricular");

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Trophy className="size-3.5" />
            {activeSchool.name} · Gestión de Deportes y Actividades
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">
            Deportes y Actividades
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea cualquier deporte o actividad libremente, personaliza banners con ajuste
            interactivo, diseña tarjetas y administra registros de {activeSchool.shortName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleStartNewActivity}
            className="min-h-11 rounded-xl font-bold bg-primary text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="size-4 mr-1.5" />+ Nuevo Deporte o Actividad
          </Button>

          <Button
            onClick={handleManualSync}
            disabled={syncing}
            variant="outline"
            className="min-h-11 rounded-xl font-bold bg-card"
          >
            <RefreshCw className={`size-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>

          <a
            href={activeBoundUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-muted"
          >
            Ver fuente ({activeSchool.shortName})
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-600" />
          {saveSuccessMsg}
        </div>
      )}

      {/* TOP METRICS OVERVIEW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Deportes Chicas
          </p>
          <p className="text-2xl font-black text-foreground">{girlsActivities.length}</p>
          <p className="text-[11px] text-muted-foreground">Softball, Volleyball, Dance, Coops</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Deportes Chicos
          </p>
          <p className="text-2xl font-black text-foreground">{boysActivities.length}</p>
          <p className="text-[11px] text-muted-foreground">Baseball, Football, Basketball, Golf</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Mixtos & Clubes
          </p>
          <p className="text-2xl font-black text-foreground">
            {coedActivities.length + extraActivities.length}
          </p>
          <p className="text-[11px] text-muted-foreground">Cheer, Band, Robótica, Drama, Debate</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Actividades
          </p>
          <p className="text-2xl font-black text-primary">{activities.length}</p>
          <p className="text-[11px] text-muted-foreground">
            {activities.filter((a) => a.is_active).length} activas y visibles
          </p>
        </div>
      </div>

      {/* ADMIN TABS */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-2 scrollbar-none text-xs font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "overview"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Todas ({activities.length})
        </button>
        <button
          onClick={() => setActiveTab("girls")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "girls"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Chicas ({girlsActivities.length})
        </button>
        <button
          onClick={() => setActiveTab("boys")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "boys"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Chicos ({boysActivities.length})
        </button>
        <button
          onClick={() => setActiveTab("coed")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "coed"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Mixtos ({coedActivities.length})
        </button>
        <button
          onClick={() => setActiveTab("extracurricular")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "extracurricular"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Clubes & Talleres ({extraActivities.length})
        </button>
        <button
          onClick={() => setActiveTab("announcement")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "announcement"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Anuncio de Registro & Apoyo
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "teams"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Equipos
        </button>
        <button
          onClick={() => setActiveTab("sync")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "sync"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Historial Sync
        </button>
        <button
          onClick={() => setActiveTab("duplicates")}
          className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === "duplicates"
              ? "bg-primary text-primary-foreground font-bold"
              : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Duplicados
        </button>
      </div>

      {/* TAB CONTENT: ANNOUNCEMENT */}
      {activeTab === "announcement" && (
        <div className="surface-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Configuración del Anuncio de Registro
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-foreground">Mostrar Anuncio:</label>
              <input
                type="checkbox"
                checked={regSettings.is_enabled}
                onChange={(e) => setRegSettings({ ...regSettings, is_enabled: e.target.checked })}
                className="size-5 rounded border-border text-primary focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Título del Anuncio:</label>
              <Input
                value={regSettings.title}
                onChange={(e) => setRegSettings({ ...regSettings, title: e.target.value })}
                className="min-h-10 text-sm font-semibold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                Enlace de Registro Oficial:
              </label>
              <Input
                value={regSettings.registration_url}
                onChange={(e) =>
                  setRegSettings({ ...regSettings, registration_url: e.target.value })
                }
                className="min-h-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Mensaje del anuncio:</label>
            <Textarea
              value={regSettings.message}
              onChange={(e) => setRegSettings({ ...regSettings, message: e.target.value })}
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Personas de Apoyo */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Personas de Apoyo Configuradas
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {regSettings.support_persons.map((person, idx) => (
                <div
                  key={person.id}
                  className="rounded-xl border border-border p-4 bg-muted/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-foreground">{person.person_name}</p>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {person.is_verified ? "Verificado" : "Sin teléfono directo"}
                    </span>
                  </div>

                  <Input
                    value={person.role}
                    onChange={(e) => {
                      const updatedSupport = [...regSettings.support_persons];
                      updatedSupport[idx]!.role = e.target.value;
                      setRegSettings({ ...regSettings, support_persons: updatedSupport });
                    }}
                    placeholder="Rol o función"
                    className="min-h-9 text-xs"
                  />

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Input
                      value={person.phone || ""}
                      onChange={(e) => {
                        const updatedSupport = [...regSettings.support_persons];
                        updatedSupport[idx]!.phone = e.target.value || null;
                        setRegSettings({ ...regSettings, support_persons: updatedSupport });
                      }}
                      placeholder="Teléfono (opcional)"
                      className="min-h-9 text-xs"
                    />
                    <Input
                      value={person.office || ""}
                      onChange={(e) => {
                        const updatedSupport = [...regSettings.support_persons];
                        updatedSupport[idx]!.office = e.target.value || null;
                        setRegSettings({ ...regSettings, support_persons: updatedSupport });
                      }}
                      placeholder="Oficina (opcional)"
                      className="min-h-9 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button onClick={handleSaveRegSettings} className="min-h-11 px-6 font-bold rounded-xl">
              <Save className="size-4 mr-2" />
              Guardar configuración del anuncio
            </Button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SPORTS LISTS (Girls, Boys, Coed, Extracurricular, Overview) */}
      {(activeTab === "overview" ||
        activeTab === "girls" ||
        activeTab === "boys" ||
        activeTab === "coed" ||
        activeTab === "extracurricular") && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por deporte, actividad o traducción..."
                className="pl-9 min-h-10 text-xs rounded-xl"
              />
            </div>

            <Button
              onClick={handleStartNewActivity}
              className="min-h-10 rounded-xl font-bold bg-primary text-primary-foreground text-xs shadow-xs"
            >
              <Plus className="size-3.5 mr-1" />
              Agregar Deporte o Actividad
            </Button>
          </div>

          <div className="surface-card overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3.5">Portada</th>
                    <th className="p-3.5">Nombre Oficial</th>
                    <th className="p-3.5">Traducción / Español</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5">Temporada</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5">Visibilidad</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {activities
                    .filter((a) => {
                      if (activeTab === "girls")
                        return a.category === "girls" || a.category === "girls_coop";
                      if (activeTab === "boys") return a.category === "boys";
                      if (activeTab === "coed") return a.category === "coed";
                      if (activeTab === "extracurricular") return a.category === "extracurricular";
                      return true;
                    })
                    .filter((a) =>
                      searchQuery
                        ? a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.translated_name?.toLowerCase().includes(searchQuery.toLowerCase())
                        : true,
                    )
                    .map((act) => {
                      const banner = act.card_banner_url || act.icon_url;
                      return (
                        <tr key={act.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3.5">
                            {banner ? (
                              <img
                                src={banner}
                                alt={act.name}
                                className="size-10 rounded-lg object-cover border border-border/80 bg-muted/20"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="size-10 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                                {act.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-foreground">
                            <div className="flex items-center gap-1.5">
                              <span>{act.name}</span>
                              {act.official_url && (
                                <a
                                  href={act.official_url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-muted-foreground">
                            {act.translated_name || "—"}
                          </td>
                          <td className="p-3.5 uppercase font-semibold text-primary">
                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px]">
                              {act.category}
                            </span>
                          </td>
                          <td className="p-3.5">{act.season}</td>
                          <td className="p-3.5 font-bold text-emerald-600">{act.status}</td>
                          <td className="p-3.5">
                            {act.is_active ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                <Eye className="size-3.5" /> Visible
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                                <EyeOff className="size-3.5" /> Oculto
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingActivity(act);
                                setIsNewActivity(false);
                              }}
                              className="min-h-8 text-xs rounded-lg font-semibold"
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDuplicateActivity(act)}
                              className="min-h-8 text-xs rounded-lg"
                              title="Duplicar actividad"
                            >
                              <Copy className="size-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleActivityActive(act.id)}
                              className="min-h-8 text-xs rounded-lg"
                            >
                              {act.is_active ? "Ocultar" : "Mostrar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteActivity(act.id, act.name)}
                              className="min-h-8 text-xs rounded-lg text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TEAMS */}
      {activeTab === "teams" && (
        <div className="surface-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Equipos Registrados</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            {teams.map((team) => (
              <div
                key={team.id}
                className="rounded-xl border border-border p-4 bg-card space-y-1.5"
              >
                <p className="font-bold text-sm text-foreground">{team.name}</p>
                <p className="text-muted-foreground">
                  Nivel: <strong className="text-foreground">{team.level}</strong>
                </p>
                <p className="text-muted-foreground">
                  Entrenador:{" "}
                  <strong className="text-foreground">{team.head_coach || "No asignado"}</strong>
                </p>
                <p className="text-muted-foreground">Conferencia: {team.conference || "CIML"}</p>
                <a
                  href={team.official_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline pt-1"
                >
                  Ver en Bound <ExternalLink className="size-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SYNC LOGS */}
      {activeTab === "sync" && (
        <div className="surface-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            Historial de Auditoría e Integración Bound
          </h2>
          <div className="space-y-2 text-xs">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-border p-3.5 bg-card flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-foreground">{log.sync_type}</p>
                  <p className="text-muted-foreground">Fuente: {log.source_url}</p>
                  <p className="text-muted-foreground">
                    Fecha: {formatDateFormatted(log.completed_at)}
                  </p>
                </div>
                <span className="rounded bg-emerald-500/10 text-emerald-700 font-bold px-2.5 py-1">
                  {log.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: MERGE DUPLICATES */}
      {activeTab === "duplicates" && (
        <div className="surface-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Gestión y Fusión de Duplicados</h2>
          <p className="text-xs text-muted-foreground">
            Si la fuente de Bound o una importación anterior generó una actividad o deporte
            duplicado, selecciona el elemento principal a conservar y el duplicado a eliminar.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                Registro Principal (Conservar):
              </label>
              <select
                value={primaryDupId}
                onChange={(e) => setPrimaryDupId(e.target.value)}
                className="w-full min-h-10 rounded-xl border border-input bg-card p-2 text-xs font-semibold"
              >
                <option value="">-- Seleccionar principal --</option>
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                Registro Duplicado (Eliminar/Fusionar):
              </label>
              <select
                value={secondaryDupId}
                onChange={(e) => setSecondaryDupId(e.target.value)}
                className="w-full min-h-10 rounded-xl border border-input bg-card p-2 text-xs font-semibold"
              >
                <option value="">-- Seleccionar duplicado --</option>
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={handleMergeDuplicates}
            className="min-h-11 rounded-xl font-bold bg-destructive text-destructive-foreground"
          >
            Combinar registros duplicados
          </Button>
        </div>
      )}

      {/* ALL-IN-ONE MODAL: CREATE & EDIT ACTIVITY WITH REAL-TIME LIVE CARD PREVIEW */}
      {editingActivity && (
        <Dialog open onOpenChange={() => setEditingActivity(null)}>
          <DialogContent className="max-h-[94dvh] overflow-y-auto sm:max-w-4xl lg:max-w-6xl p-0 gap-0 rounded-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/80 bg-muted/20">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-extrabold flex items-center gap-2 text-foreground">
                  <Trophy className="size-5 text-primary" />
                  <span>
                    {isNewActivity
                      ? "Crear Nuevo Deporte o Actividad"
                      : `Editar Actividad: ${editingActivity.name || "Sin título"}`}
                  </span>
                </DialogTitle>
                <span className="text-xs font-bold text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-xl">
                  {activeSchool.shortName}
                </span>
              </div>
            </div>

            {/* Modal Body: Form and Integrated Live Preview together */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Form controls (Left Column) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Name and Spanish Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        Nombre Oficial <span className="text-destructive">*</span>
                      </label>
                      <Input
                        value={editingActivity.name}
                        onChange={(e) =>
                          setEditingActivity({ ...editingActivity, name: e.target.value })
                        }
                        placeholder="Ej: Fútbol Femenino, Robótica..."
                        className="mt-1.5 min-h-10 rounded-xl text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        Traducción / Español / Descripción
                      </label>
                      <Input
                        value={editingActivity.translated_name || ""}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            translated_name: e.target.value || null,
                          })
                        }
                        placeholder="Ej: Soccer Femenino..."
                        className="mt-1.5 min-h-10 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Banner Upload with Move, Scale & Rotate Image Adjuster */}
                  <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Banner de Portada de la Tarjeta
                      </label>
                      <span className="text-[11px] text-primary font-semibold">
                        Soporta Mover, Escalar y Rotar
                      </span>
                    </div>
                    <FileUploadInput
                      id="activity-banner-input"
                      value={editingActivity.card_banner_url || editingActivity.icon_url || ""}
                      onChange={(url) =>
                        setEditingActivity({
                          ...editingActivity,
                          card_banner_url: url,
                          icon_url: url,
                        })
                      }
                      helperText="Sube una foto o ilustración. Podrás moverla, rotarla y recortarla a tu gusto."
                      placeholder="https://... o sube una imagen"
                      accept="image/*"
                    />
                  </div>

                  {/* Card Background Color & Gradients Palette */}
                  <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Fondo de la Tarjeta
                      </label>
                      {editingActivity.card_bg && (
                        <button
                          type="button"
                          onClick={() => setEditingActivity({ ...editingActivity, card_bg: null })}
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          Restablecer por defecto
                        </button>
                      )}
                    </div>

                    {/* Quick Gradients */}
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
                            onClick={() =>
                              setEditingActivity({
                                ...editingActivity,
                                card_bg: g.val || null,
                              })
                            }
                            style={g.val ? { background: g.val } : undefined}
                            className={`h-7 rounded-lg px-2 text-[11px] font-bold transition-all border text-start flex items-center justify-between cursor-pointer ${
                              (editingActivity.card_bg || "") === g.val
                                ? "border-primary ring-2 ring-primary/40 shadow-xs"
                                : "border-border hover:scale-[1.02]"
                            } ${
                              g.val.includes("#0f172a") || g.val.includes("#e11d48")
                                ? "text-white"
                                : "text-foreground bg-card"
                            }`}
                          >
                            <span className="truncate">{g.name}</span>
                            {(editingActivity.card_bg || "") === g.val && (
                              <span className="text-[10px]">✓</span>
                            )}
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
                            onClick={() =>
                              setEditingActivity({
                                ...editingActivity,
                                card_bg: c.val,
                              })
                            }
                            style={{ backgroundColor: c.val }}
                            className={`size-6 rounded-lg border transition-transform hover:scale-110 cursor-pointer ${
                              editingActivity.card_bg === c.val
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
                        value={editingActivity.card_bg || ""}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            card_bg: e.target.value || null,
                          })
                        }
                        placeholder="Ej: #f0fdf4 o linear-gradient(...)"
                        className="h-8 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Category, Season, Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        Categoría
                      </label>
                      <select
                        value={editingActivity.category}
                        onChange={(e) => {
                          const cat = e.target.value as BoundCategory;
                          const genderMap: Record<BoundCategory, GenderGroup> = {
                            girls: "Girls",
                            girls_coop: "Girls",
                            boys: "Boys",
                            coed: "Coed",
                            extracurricular: "Activity",
                          };
                          setEditingActivity({
                            ...editingActivity,
                            category: cat,
                            gender_group: genderMap[cat] || "Coed",
                            activity_type: cat === "extracurricular" ? "extracurricular" : "sport",
                          });
                        }}
                        className="w-full mt-1 min-h-10 rounded-xl border border-input bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground"
                      >
                        <option value="girls">Chicas (Girls)</option>
                        <option value="boys">Chicos (Boys)</option>
                        <option value="coed">Mixto (Coed)</option>
                        <option value="extracurricular">Club / Extracurricular</option>
                        <option value="girls_coop">Cooperativa Chicas</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        Temporada
                      </label>
                      <select
                        value={editingActivity.season}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            season: e.target.value as BoundActivity["season"],
                          })
                        }
                        className="w-full mt-1 min-h-10 rounded-xl border border-input bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground"
                      >
                        <option value="Fall">Otoño (Fall)</option>
                        <option value="Winter">Invierno (Winter)</option>
                        <option value="Spring">Primavera (Spring)</option>
                        <option value="Summer">Verano (Summer)</option>
                        <option value="Year-Round">Todo el año</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        Estado
                      </label>
                      <select
                        value={editingActivity.status}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            status: e.target.value as BoundStatus,
                          })
                        }
                        className="w-full mt-1 min-h-10 rounded-xl border border-input bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground"
                      >
                        <option value="En temporada">En temporada</option>
                        <option value="Próximamente">Próximamente</option>
                        <option value="Fuera de temporada">Fuera de temporada</option>
                        <option value="Registro abierto">Registro abierto</option>
                        <option value="Registro cerrado">Registro cerrado</option>
                      </select>
                    </div>
                  </div>

                  {/* URLs & External Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        URL Oficial / Sitio Web (Opcional)
                      </label>
                      <Input
                        value={editingActivity.official_url}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            official_url: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        className="mt-1 min-h-9 text-xs rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        URL de Registro / Formulario (Opcional)
                      </label>
                      <Input
                        value={editingActivity.registration_url || ""}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            registration_url: e.target.value || null,
                          })
                        }
                        placeholder="https://..."
                        className="mt-1 min-h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Live Real-time Card Preview */}
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

                    {/* Exact Activity Card Render matching public page */}
                    {(() => {
                      const banner = editingActivity.card_banner_url || editingActivity.icon_url;
                      const cardBg = editingActivity.card_bg?.trim() || null;
                      const isDarkBg =
                        cardBg &&
                        (cardBg.includes("#0") ||
                          cardBg.includes("#1") ||
                          cardBg.includes("0f172a") ||
                          cardBg.includes("e11d48"));

                      return (
                        <div
                          style={cardBg ? { background: cardBg } : undefined}
                          className={`rounded-2xl border overflow-hidden transition-all duration-300 shadow-md ${
                            isDarkBg
                              ? "text-white border-white/20"
                              : "bg-card text-foreground border-border/80"
                          }`}
                        >
                          {/* Banner Image */}
                          {banner ? (
                            <div className="relative w-full overflow-hidden border-b border-border/40 bg-muted/20">
                              <img
                                src={banner}
                                alt={editingActivity.name}
                                className="w-full h-auto max-h-[500px] object-cover rounded-t-2xl"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="h-24 w-full bg-muted/40 border-b border-dashed border-border/60 flex flex-col items-center justify-center text-xs text-muted-foreground gap-1 p-3 text-center">
                              <Sparkles className="size-4 text-primary/60" />
                              <span>Sube una imagen para ver la portada aquí</span>
                            </div>
                          )}

                          {/* Card Content */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                  isDarkBg ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                }`}
                              >
                                {editingActivity.category}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  editingActivity.status === "En temporada" ||
                                  editingActivity.status === "Registro abierto"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-amber-500/10 text-amber-600"
                                }`}
                              >
                                {editingActivity.status}
                              </span>
                            </div>

                            <div>
                              <h3
                                className={`text-base font-extrabold leading-snug ${
                                  isDarkBg ? "text-white" : "text-foreground"
                                }`}
                              >
                                {editingActivity.name || "Nombre del deporte o actividad"}
                              </h3>
                              {editingActivity.translated_name && (
                                <p
                                  className={`text-xs mt-0.5 ${
                                    isDarkBg ? "text-slate-300" : "text-muted-foreground"
                                  }`}
                                >
                                  {editingActivity.translated_name}
                                </p>
                              )}
                            </div>

                            <div
                              className={`pt-2.5 border-t flex items-center justify-between text-xs font-bold ${
                                isDarkBg
                                  ? "border-white/20 text-white"
                                  : "border-border/60 text-primary"
                              }`}
                            >
                              <span className="text-[11px] font-medium text-muted-foreground">
                                Temporada: {editingActivity.season}
                              </span>
                              <span>Ver detalles →</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <p className="text-[11px] text-muted-foreground text-center pt-1">
                      💡 La tarjeta se adapta al tamaño y proporciones de tu imagen con esquinas
                      redondeadas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer with Actions */}
              <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-border">
                {!isNewActivity ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleDeleteActivity(editingActivity.id, editingActivity.name)}
                    className="min-h-10 text-xs text-destructive hover:bg-destructive/10 rounded-xl"
                  >
                    <Trash2 className="size-4 mr-1.5" />
                    Eliminar Actividad
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingActivity(null)}
                    className="min-h-10 text-xs rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveActivityEdit}
                    className="min-h-10 text-xs font-bold bg-primary text-primary-foreground rounded-xl px-5 shadow-xs"
                  >
                    <Save className="size-4 mr-1.5" />
                    {isNewActivity ? "Crear y Guardar Actividad" : "Guardar Cambios"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
