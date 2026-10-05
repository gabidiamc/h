/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDiagnosticReportServerFn,
  seedDefaultOfficialSourcesServerFn,
} from "@/lib/official-sync/functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Shield,
  Clock,
  RefreshCw,
  FileCode,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Server,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

export function DiagnosticsView() {
  const queryClient = useQueryClient();
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["official_sync_diagnostics"],
    queryFn: () => getDiagnosticReportServerFn(),
    refetchInterval: 30000,
  });

  const seedMutation = useMutation({
    mutationFn: () => seedDefaultOfficialSourcesServerFn(),
    onSuccess: (res) => {
      toast.success(
        `Población inicial completada: ${res.sourcesCreated} creadas, ${res.sourcesUpdated} actualizadas, ${res.sourcesFound} ya existentes.`,
      );
      void queryClient.invalidateQueries({ queryKey: ["official_sync_overview"] });
      void refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al poblar fuentes iniciales.");
    },
  });

  const handleCopySql = () => {
    if (!data?.migrationSql) return;
    navigator.clipboard.writeText(data.migrationSql);
    setCopiedSql(true);
    toast.success("Script SQL copiado al portapapeles. Péguelo en el Editor SQL de Supabase.");
    setTimeout(() => setCopiedSql(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">
          Ejecutando diagnóstico exhaustivo del sistema de sincronización...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Diagnóstico de Infraestructura y Fiabilidad
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verificación en tiempo real del estado de conexión, tablas remotas, RLS y conectores
            oficiales.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="h-8 text-xs font-semibold"
          >
            <Sparkles
              className={`h-3.5 w-3.5 mr-1.5 ${seedMutation.isPending ? "animate-spin" : ""}`}
            />
            Poblar Fuentes Iniciales
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isRefetching}
            className="h-8 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Migration Alert Banner (if tables are missing) */}
      {data.migrationPending && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Tablas pendientes de migración en Supabase remoto
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Una o más tablas del sistema oficial no existen aún en la base de datos remota.
                  Copie y ejecute el siguiente script SQL en el Editor SQL de Supabase para crearlas
                  de forma segura e idempotente.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={handleCopySql}
              className="h-8 text-xs shrink-0"
            >
              {copiedSql ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-300" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar SQL de Migración
                </>
              )}
            </Button>
          </div>

          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
            >
              {showSqlPreview ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5 mr-1" /> Ocultar SQL
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5 mr-1" /> Ver Script SQL (
                  {data.migrationSql?.split("\n").length || 0} líneas)
                </>
              )}
            </Button>

            {showSqlPreview && data.migrationSql && (
              <div className="mt-2 p-3 rounded-xl bg-muted/60 border border-border/60 max-h-64 overflow-y-auto font-mono text-[11px] leading-relaxed text-foreground/90">
                <pre>{data.migrationSql}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Service Role Warning (if key is missing/unconfigured) */}
      {data.serviceRoleWarning && (
        <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs flex items-start gap-2.5">
          <Server className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">Estado del Service Role:</span>
            <p className="text-muted-foreground">{data.serviceRoleWarning}</p>
          </div>
        </div>
      )}

      {/* Tables Status Table */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">
              Estado Detallado de Tablas ({data.tables?.length || 0})
            </span>
          </div>
          {data.projectId && (
            <Badge variant="outline" className="font-mono text-[11px]">
              ID Proyecto: {data.projectId}
            </Badge>
          )}
        </div>

        <div className="divide-y divide-border/50 text-xs">
          {data.tables && data.tables.length > 0 ? (
            data.tables.map((tbl) => (
              <div
                key={tbl.name}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/10 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{tbl.label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      ({tbl.name})
                    </span>
                  </div>
                  {tbl.errorMessage && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">
                      Error: {tbl.errorMessage} {tbl.errorCode ? `[${tbl.errorCode}]` : ""}
                    </p>
                  )}
                  {tbl.actionRequired && (
                    <p className="text-[11px] text-muted-foreground">
                      Acción:{" "}
                      <span className="font-medium text-foreground/80">{tbl.actionRequired}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-muted-foreground text-[11px]">Registros: </span>
                    <span className="font-mono font-bold text-foreground">
                      {tbl.rowCount !== null ? tbl.rowCount : "—"}
                    </span>
                  </div>

                  {tbl.status === "ok" && (
                    <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Verificada
                    </Badge>
                  )}
                  {tbl.status === "empty" && (
                    <Badge
                      variant="outline"
                      className="bg-amber-600/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                    >
                      Vacía (0)
                    </Badge>
                  )}
                  {tbl.status === "missing" && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> No existe
                    </Badge>
                  )}
                  {tbl.status === "permission_error" && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Error RLS
                    </Badge>
                  )}
                  {tbl.status === "error" && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Error
                    </Badge>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-muted-foreground text-center">
              No se obtuvieron detalles de tablas.
            </div>
          )}
        </div>
      </div>

      {/* Grid of Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Database Connection */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Database className="h-4 w-4 text-primary" /> Conexión Supabase
            </div>
            {data.databaseConnected ? (
              <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400">
                Conectada
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-amber-600/15 text-amber-700 dark:text-amber-400"
              >
                Verificación Pendiente
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>SUPABASE_URL</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Configurada
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>SUPABASE_ANON_KEY</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Configurada
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Service Role Bypass</span>
              {data.serviceRoleConfigured ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Activo</span>
              ) : (
                <span className="text-muted-foreground font-semibold">Modo Cliente RLS</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Security & RLS */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Shield className="h-4 w-4 text-primary" /> Seguridad y RLS
            </div>
            {data.rlsStatus === "active" ? (
              <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400">
                Activo
              </Badge>
            ) : data.rlsStatus === "unverified" ? (
              <Badge
                variant="outline"
                className="bg-amber-600/15 text-amber-700 dark:text-amber-400"
              >
                Sin Verificar
              </Badge>
            ) : (
              <Badge variant="destructive">Inactivo</Badge>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Protección SSRF (Allowlist)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Estricto</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Tabla de Roles (user_roles)</span>
              {data.tablesStatus.userRoles ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Verificada
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Pendiente</span>
              )}
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Almacenamiento de Credenciales</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Cero (Prohibido)
              </span>
            </div>
          </div>
        </div>

        {/* 3. Scheduler & Automation */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Clock className="h-4 w-4 text-primary" /> Scheduler Cron
            </div>
            {data.schedulerStatus === "active" ? (
              <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400">
                Activo
              </Badge>
            ) : data.schedulerStatus === "configured_awaiting_trigger" ? (
              <Badge className="bg-blue-600/15 text-blue-700 dark:text-blue-400">
                Listo para Cron
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                No configurado
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Fuentes Activas</span>
              <span className="font-semibold text-foreground">{data.activeSourcesCount}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Endpoint Cron</span>
              <span className="font-mono text-[11px] text-foreground">/api/official-sync/cron</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>CRON_SECRET</span>
              {data.environmentConfigured.cronSecretConfigured ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Configurado
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Sin configurar
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Tiempo Promedio de Sync</span>
              <span className="font-semibold text-foreground">
                {data.averageSyncTimeMs !== null && data.averageSyncTimeMs !== undefined
                  ? `${data.averageSyncTimeMs} ms`
                  : "Sin datos recientes"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Parsers Version & Capabilities */}
      <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-3 shadow-xs">
        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
          <FileCode className="h-4 w-4 text-primary" /> Versiones de Conectores y Parsers en
          Producción
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {Object.entries(data.parserVersions).map(([key, version]) => (
            <div
              key={key}
              className="p-2.5 rounded-xl border border-border/60 bg-muted/20 space-y-1"
            >
              <div className="font-medium text-foreground capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </div>
              <div className="text-[11px] text-muted-foreground">v{version} (Production)</div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Scheduled Runs Table */}
      <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-3 shadow-xs">
        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
          <Layers className="h-4 w-4 text-primary" /> Próximas Ejecuciones Programadas en Cola
        </div>
        <div className="space-y-2">
          {data.nextScheduledRuns.length > 0 ? (
            data.nextScheduledRuns.map((run) => (
              <div
                key={run.sourceId}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl border border-border/60 bg-secondary/20 text-xs gap-1 sm:gap-4"
              >
                <div className="font-medium text-foreground">{run.sourceName}</div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>Frecuencia: {Math.round(run.frequencyMinutes / 60)}h</span>
                  <span>•</span>
                  <span className="font-semibold text-foreground">
                    {run.nextRunAt
                      ? new Date(run.nextRunAt).toLocaleString("es-US", {
                          timeZone: "America/Chicago",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "Pendiente de inicialización"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-muted-foreground text-xs text-center">
              No hay ejecuciones en cola actualmente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
