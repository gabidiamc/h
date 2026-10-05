/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FolderTree,
  History,
  Layers,
  Megaphone,
  Plus,
  RefreshCw,
  School,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Trophy,
  CalendarDays,
  HelpCircle,
  BookOpen,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getPublicContentCounts,
  createPublicContentBackup,
  downloadBackupJsonFile,
  executePublicContentReset,
  type PublicContentBackup,
  type PublicContentCounts,
} from "@/lib/public-content-reset";
import { useAdminSession } from "@/lib/admin";
import { applyChangesNow } from "@/lib/sync";

export const Route = createFileRoute("/admin/reinicio")({
  component: AdminReinicioPage,
});

const REQUIRED_CONFIRM_PHRASE = "ELIMINAR CONTENIDO PÚBLICO";

export function AdminReinicioPage() {
  const { session, role, userId, email } = useAdminSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [phraseInput, setPhraseInput] = useState("");
  const [createdBackup, setCreatedBackup] = useState<PublicContentBackup | null>(null);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);
  const [deletedSummary, setDeletedSummary] = useState<PublicContentCounts | null>(null);

  const currentUser = useMemo(() => {
    return {
      id: session?.user?.id || userId || "unknown",
      email: session?.user?.email || email || "unknown",
    };
  }, [session, userId, email]);

  // Query live counts from Supabase
  const countsQuery = useQuery({
    queryKey: ["public_content_counts"],
    queryFn: getPublicContentCounts,
    refetchInterval: resetCompleted ? false : 10000,
  });

  const counts = countsQuery.data || {
    categories: 0,
    articles: 0,
    resources: 0,
    announcements: 0,
    events: 0,
    activities: 0,
    faqs: 0,
    translations: 0,
    dependentRelations: 0,
    exclusiveFiles: 0,
    total: 0,
  };

  // Mutation: Generate and download backup
  const handleCreateBackup = async () => {
    setIsBackupLoading(true);
    try {
      const backup = await createPublicContentBackup(currentUser);
      setCreatedBackup(backup);
      downloadBackupJsonFile(backup);
      toast.success("Respaldo generado y descargado con éxito.", {
        description: `Identificador: ${backup.backupId}`,
      });
    } catch (err: any) {
      toast.error("Error al crear el respaldo", { description: err.message });
    } finally {
      setIsBackupLoading(false);
    }
  };

  // Mutation: Execute safe deletion
  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!createdBackup) {
        throw new Error("Debe generar un respaldo antes de proceder con la eliminación.");
      }
      const result = await executePublicContentReset(currentUser, createdBackup.backupId);
      if (!result.success) {
        throw new Error(result.error || "Ocurrió un error durante la eliminación.");
      }
      return result;
    },
    onSuccess: async (res) => {
      setDeletedSummary(res.deletedCounts);
      setResetCompleted(true);
      setConfirmModalOpen(false);
      setPhraseInput("");
      toast.success("Reinicio completado con éxito", {
        description: `Se eliminaron ${res.deletedCounts.total} registros públicos. Estructura conservada.`,
      });

      // Synchronize caches
      await applyChangesNow(queryClient);
      void countsQuery.refetch();
    },
    onError: (err: any) => {
      toast.error("Error en la eliminación", {
        description: err.message || "La operación se detuvo de forma segura.",
      });
    },
  });

  const isAuthorized = role === "super_admin" || role === "admin" || !session; // Admin authorized
  const isPhraseValid = phraseInput.trim() === REQUIRED_CONFIRM_PHRASE;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3.5 py-1 text-xs font-bold text-destructive">
            <ShieldAlert className="size-3.5" />
            <span>Mantenimiento y Reinicio de Contenido</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-foreground">
            Reinicio del contenido público
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Elimina definitivamente todo el contenido público actual para reconstruir desde cero con
            datos verificados, conservando intactos los usuarios, escuelas, roles, configuraciones y
            auditoría del sistema.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => countsQuery.refetch()}
          disabled={countsQuery.isFetching}
          className="gap-2 rounded-xl text-xs"
        >
          <RefreshCw className={`size-3.5 ${countsQuery.isFetching ? "animate-spin" : ""}`} />
          <span>Actualizar conteo</span>
        </Button>
      </div>

      {/* Success State if reset completed */}
      {resetCompleted && (
        <Card className="rounded-3xl border-2 border-emerald-500/40 bg-emerald-500/5 p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="text-xl font-bold text-foreground">
                Reinicio de contenido público completado exitosamente
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Todo el contenido público anterior ha sido eliminado de forma segura. Los usuarios,
                escuelas, permisos, roles, configuraciones y registros de auditoría se conservaron
                al 100%. La página pública muestra el estado informativo vacío verificado.
              </p>
              {deletedSummary && (
                <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-background/80 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Resumen de registros eliminados:
                  </span>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      Categorías: <strong>{deletedSummary.categories}</strong>
                    </div>
                    <div>
                      Artículos: <strong>{deletedSummary.articles}</strong>
                    </div>
                    <div>
                      Avisos: <strong>{deletedSummary.announcements}</strong>
                    </div>
                    <div>
                      Eventos: <strong>{deletedSummary.events}</strong>
                    </div>
                    <div>
                      Deportes/Actividades: <strong>{deletedSummary.activities}</strong>
                    </div>
                    <div>
                      Preguntas FAQ: <strong>{deletedSummary.faqs}</strong>
                    </div>
                    <div>
                      Traducciones: <strong>{deletedSummary.translations}</strong>
                    </div>
                    <div>
                      Total eliminados: <strong>{deletedSummary.total}</strong>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-3 pt-2">
                <Button
                  asChild
                  className="rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                >
                  <Link to="/admin/articulos">
                    <Plus className="mr-1.5 size-4" />
                    <span>Crear nuevo borrador (Lincoln High School)</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl font-semibold text-xs">
                  <Link to="/" target="_blank">
                    <span>Ver página pública</span>
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Grid: What will be deleted vs. What is preserved */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card: Contenido a eliminar */}
        <Card className="rounded-3xl border border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trash2 className="size-5 text-destructive" />
              <CardTitle className="text-lg font-bold text-destructive">
                1. Contenido público que se eliminará
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Cantidad exacta de registros identificados en la base de datos:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="divide-y divide-border/60 text-sm">
              <li className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-foreground font-medium">
                  <FolderTree className="size-4 text-muted-foreground" />
                  Categorías:
                </span>
                <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                  {counts.categories}
                </span>
              </li>
              <li className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-foreground font-medium">
                  <BookOpen className="size-4 text-muted-foreground" />
                  Artículos y guías:
                </span>
                <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                  {counts.articles}
                </span>
              </li>
              <li className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-foreground font-medium">
                  <Layers className="size-4 text-muted-foreground" />
                  Recursos y programas:
                </span>
                <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                  {counts.resources}
                </span>
              </li>
              <li className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-foreground font-medium">
                  <Megaphone className="size-4 text-muted-foreground" />
                  Avisos:
                </span>
                <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                  {counts.announcements}
                </span>
              </li>
              <li className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-foreground font-medium">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  Eventos y calendario:
                </span>
                <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                  {counts.events}
                </span>
              </li>
              <li className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-foreground font-medium">
                  <Trophy className="size-4 text-muted-foreground" />
                  Deportes y actividades:
                </span>
                <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                  {counts.activities}
                </span>
              </li>
              <li className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-foreground font-medium">
                  <HelpCircle className="size-4 text-muted-foreground" />
                  Preguntas frecuentes:
                </span>
                <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                  {counts.faqs}
                </span>
              </li>
              <li className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-foreground font-medium">
                  <History className="size-4 text-muted-foreground" />
                  Traducciones relacionadas:
                </span>
                <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                  {counts.translations}
                </span>
              </li>
              <li className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-foreground font-medium">
                  <Archive className="size-4 text-muted-foreground" />
                  Relaciones dependientes / Archivos exclusivos:
                </span>
                <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                  {counts.dependentRelations}
                </span>
              </li>
            </ul>

            <div className="mt-4 rounded-2xl border border-destructive/30 bg-background/80 p-3 text-xs text-muted-foreground">
              Total de registros identificados para reinicio:{" "}
              <strong className="text-destructive font-black text-sm">{counts.total}</strong>
            </div>
          </CardContent>
        </Card>

        {/* Card: Elementos del sistema conservados */}
        <Card className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                2. Elementos que se conservarán completamente
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Esta operación NUNCA borra la infraestructura ni configuraciones del sistema:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2.5 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Usuarios y Perfiles</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2.5 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Administradores y Personal</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2.5 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Roles y Permisos</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2.5 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Escuelas (Lincoln, East, etc.)</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2.5 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Inicio de sesión y Auth</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2.5 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Configuración de Supabase</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2.5 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Configuración del sitio</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2.5 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Logo e identidad DMPS</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2.5 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Traducciones de la interfaz</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2.5 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Menú, rutas y PWA</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2.5 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Auditoría y reportes</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2.5 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Archivos de marca y logos</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-background/80 p-3 text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="size-4 text-emerald-600 shrink-0" />
              <span>
                Protección activa: El sistema prohíbe eliminar tablas de sistema o usuarios.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Suite: Backup + Confirmations */}
      <Card className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            3. Procedimiento de Respaldo y Confirmación
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Siga los pasos obligatorios en orden para ejecutar la eliminación segura.
          </p>
        </div>

        {/* Step A: Backup */}
        <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Paso A: Crear respaldo antes de eliminar
              </span>
              <h3 className="text-base font-bold text-foreground">
                Exportar copia completa del contenido público (.json)
              </h3>
              <p className="text-xs text-muted-foreground max-w-xl">
                Genera un archivo descargable con todos los registros, relaciones, traducciones y
                enlaces oficiales. No incluye contraseñas ni claves privadas.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleCreateBackup}
              disabled={isBackupLoading}
              className="rounded-xl text-xs font-bold gap-2 min-w-44"
              variant={createdBackup ? "outline" : "default"}
            >
              <Download className={`size-4 ${isBackupLoading ? "animate-bounce" : ""}`} />
              <span>{createdBackup ? "Descargar de nuevo" : "Crear y descargar respaldo"}</span>
            </Button>
          </div>

          {createdBackup && (
            <div className="mt-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <span>
                ✓ Respaldo activo: <strong>{createdBackup.backupId}</strong> (
                {createdBackup.summary.total} registros)
              </span>
              <span className="text-[11px] text-muted-foreground">
                {new Date(createdBackup.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Step B: Confirmation input */}
        <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-destructive">
              Paso B: Verificación de seguridad por el Administrador
            </span>
            <h3 className="text-base font-bold text-foreground">
              Escriba exactamente:{" "}
              <code className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-bold text-destructive">
                {REQUIRED_CONFIRM_PHRASE}
              </code>
            </h3>
            <p className="text-xs text-muted-foreground">
              Esta verificación confirma que comprendió que el contenido público actual será
              eliminado definitivamente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Input
              type="text"
              placeholder={`Escriba "${REQUIRED_CONFIRM_PHRASE}"`}
              value={phraseInput}
              onChange={(e) => setPhraseInput(e.target.value)}
              disabled={!createdBackup}
              className="h-11 rounded-xl bg-card border-border text-sm max-w-md font-medium"
            />

            <Button
              type="button"
              variant="destructive"
              disabled={!createdBackup || !isPhraseValid || !isAuthorized}
              onClick={() => setConfirmModalOpen(true)}
              className="rounded-xl text-xs font-bold h-11 px-6 gap-2"
            >
              <Trash2 className="size-4" />
              <span>Proceder a la confirmación final</span>
            </Button>
          </div>

          {!createdBackup && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              * Debe crear y descargar el respaldo en el Paso A para habilitar el campo de
              confirmación.
            </p>
          )}
        </div>
      </Card>

      {/* Guide: New Content Creation Stage */}
      <Card className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">
            4. Próxima Etapa: Reconstrucción desde Cero
          </h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Una vez reiniciado el contenido, el panel administrativo está configurado para la creación
          de contenido verificado siguiendo la secuencia oficial obligatoria:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 text-xs">
          <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-1">
            <span className="text-[10px] font-black text-primary uppercase">1. Escuela base</span>
            <div className="font-bold text-foreground">Abraham Lincoln High School</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-1">
            <span className="text-[10px] font-black text-primary uppercase">2. Estructura</span>
            <div className="font-bold text-foreground">Categorías</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-1">
            <span className="text-[10px] font-black text-primary uppercase">3. Artículos</span>
            <div className="font-bold text-foreground">Artículos y Guías</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-1">
            <span className="text-[10px] font-black text-primary uppercase">4. Recursos</span>
            <div className="font-bold text-foreground">Recursos y Programas</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-1">
            <span className="text-[10px] font-black text-primary uppercase">5. Fechas</span>
            <div className="font-bold text-foreground">Eventos y Calendario</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-1">
            <span className="text-[10px] font-black text-primary uppercase">6. Alertas</span>
            <div className="font-bold text-foreground">Avisos</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-1">
            <span className="text-[10px] font-black text-primary uppercase">7. Atletismo</span>
            <div className="font-bold text-foreground">Deportes y Actividades</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-1">
            <span className="text-[10px] font-black text-primary uppercase">8. Consultas</span>
            <div className="font-bold text-foreground">Preguntas Frecuentes</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-1">
            <span className="text-[10px] font-black text-primary uppercase">9. Idiomas</span>
            <div className="font-bold text-foreground">Traducciones (ES, EN, KAR)</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-1">
            <span className="text-[10px] font-black text-primary uppercase">10. Publicación</span>
            <div className="font-bold text-foreground">Revisión y Aprobación</div>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground space-y-1">
          <span className="font-bold text-primary">Regla de publicación garantizada:</span>
          <p className="text-muted-foreground">
            Todo registro nuevo comienza automáticamente en estado <strong>Borrador</strong>. Para
            publicarse requerirá: Escuela seleccionada, Categoría, Título, Resumen, Contenido,
            Fuente oficial verificada, URL oficial y Vista previa antes de la aprobación final.
          </p>
        </div>
      </Card>

      {/* Final Confirmation Modal Dialog */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader className="space-y-3">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              ¿Eliminar definitivamente el contenido público?
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
              Esta acción eliminará definitivamente todo el contenido público actual. Los usuarios,
              escuelas, permisos, configuraciones y funciones del sitio se conservarán.
            </DialogDescription>
          </DialogHeader>

          {createdBackup && (
            <div className="rounded-2xl border border-border bg-secondary/40 p-3 text-xs space-y-1">
              <div className="text-muted-foreground">
                Respaldo verificado: <strong>{createdBackup.backupId}</strong>
              </div>
              <div className="text-muted-foreground">
                Autorizado por: <strong>{currentUser.email}</strong>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmModalOpen(false)}
              disabled={resetMutation.isPending}
              className="rounded-xl text-xs font-semibold w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="rounded-xl text-xs font-bold w-full sm:w-auto"
            >
              {resetMutation.isPending ? "Eliminando registros..." : "Eliminar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
