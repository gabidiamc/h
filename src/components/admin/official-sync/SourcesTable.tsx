import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
  Zap,
  Clock,
  Activity,
  AlertTriangle,
} from "lucide-react";
import type {
  OfficialSourceRecord,
  OfficialSourceConnectionStatus,
  SourceConnectionTestResult,
} from "@/lib/official-sync/types";
import { ConnectionTestModal } from "./ConnectionTestModal";
import { testSourceConnection } from "@/lib/official-sync/functions";
import { toast } from "sonner";

interface SourcesTableProps {
  sources: OfficialSourceRecord[];
  onTriggerSync: (sourceId: string) => void;
  onOpenConfig: (source: OfficialSourceRecord) => void;
  syncingSourceId: string | null;
}

export function SourcesTable({
  sources,
  onTriggerSync,
  onOpenConfig,
  syncingSourceId,
}: SourcesTableProps) {
  const [testingSourceId, setTestingSourceId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<SourceConnectionTestResult | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const handleTestConnection = async (sourceId: string) => {
    setTestingSourceId(sourceId);
    setIsTestModalOpen(true);
    setTestResult(null);

    try {
      const res = await testSourceConnection({ data: { sourceId } });
      setTestResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al realizar prueba de conexión.";
      toast.error(msg);
      setIsTestModalOpen(false);
    } finally {
      setTestingSourceId(null);
    }
  };

  const renderHonestStatusBadge = (status?: OfficialSourceConnectionStatus, isEnabled = true) => {
    if (!isEnabled) {
      return (
        <Badge variant="outline" className="text-muted-foreground bg-muted/40">
          Desactivado
        </Badge>
      );
    }

    switch (status) {
      case "connected_verified":
        return (
          <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 font-semibold border-emerald-500/20">
            Verificado y conectado
          </Badge>
        );
      case "connected_unverified":
        return (
          <Badge className="bg-blue-600/15 text-blue-700 dark:text-blue-400 font-semibold border-blue-500/20">
            Conectado sin verificar
          </Badge>
        );
      case "manual":
        return (
          <Badge className="bg-amber-600/15 text-amber-700 dark:text-amber-400 font-semibold border-amber-500/20">
            Manual
          </Badge>
        );
      case "not_connected":
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 font-semibold border-slate-500/20">
            No conectado
          </Badge>
        );
      case "temporarily_unavailable":
        return (
          <Badge className="bg-rose-600/15 text-rose-700 dark:text-rose-400 font-semibold border-rose-500/20">
            No disponible temporalmente
          </Badge>
        );
      case "disabled":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Desactivado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            {status || "Pendiente"}
          </Badge>
        );
    }
  };

  const renderSourceTypeBadge = (sourceType?: string) => {
    const map: Record<string, { label: string; className: string }> = {
      api: {
        label: "API",
        className: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
      },
      rss: {
        label: "RSS",
        className: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
      },
      atom: {
        label: "ATOM",
        className: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
      },
      ics: {
        label: "ICS",
        className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
      },
      gtfs_static: {
        label: "GTFS estático",
        className: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
      },
      gtfs_realtime: {
        label: "GTFS tiempo real",
        className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      },
      json_ld: {
        label: "JSON-LD",
        className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
      },
      official_widget: {
        label: "Widget oficial",
        className: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
      },
      public_html: {
        label: "HTML público",
        className: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
      },
      manual_import: {
        label: "Manual",
        className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
      },
      not_connected: {
        label: "No conectado",
        className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
      },
    };

    const item = (sourceType && map[sourceType]) || {
      label: sourceType || "HTML público",
      className: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
    };

    return (
      <span
        className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${item.className}`}
      >
        {item.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Fuente Oficial</TableHead>
              <TableHead className="font-semibold">Estado de Conexión</TableHead>
              <TableHead className="font-semibold">Método de Integración</TableHead>
              <TableHead className="font-semibold">Registros Válidos</TableHead>
              <TableHead className="font-semibold">Último Éxito</TableHead>
              <TableHead className="font-semibold">Próxima Ejecución</TableHead>
              <TableHead className="text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay fuentes oficiales registradas en el sistema.
                </TableCell>
              </TableRow>
            ) : (
              sources.map((source) => {
                const isSyncing = syncingSourceId === source.id || source.status === "running";
                const isTesting = testingSourceId === source.id;

                const lastSuccessFormatted = source.last_success_at
                  ? new Date(source.last_success_at).toLocaleString("es-US", {
                      timeZone: "America/Chicago",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Sin ejecuciones exitosas";

                const nextRunFormatted = source.next_run_at
                  ? new Date(source.next_run_at).toLocaleString("es-US", {
                      timeZone: "America/Chicago",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Por demanda";

                return (
                  <TableRow key={source.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium text-foreground">{source.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <span>{source.organization}</span>
                        <span>•</span>
                        <a
                          href={source.official_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          Enlace oficial <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>

                    <TableCell>
                      {renderHonestStatusBadge(source.connection_status, source.is_enabled)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 mb-1">
                        {renderSourceTypeBadge(source.source_type)}
                      </div>
                      <div className="text-xs font-medium text-foreground">
                        {source.integration_method || "Página pública oficial"}
                      </div>
                      <div
                        className="text-[11px] text-muted-foreground truncate max-w-[200px]"
                        title={source.endpoint_used || source.official_url}
                      >
                        {source.endpoint_used || source.official_url}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-foreground">
                          {source.items_count || 0}
                        </span>
                        {source.last_records_rejected > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px] flex items-center gap-0.5">
                            <AlertTriangle className="h-3 w-3" /> {source.last_records_rejected}{" "}
                            rev.
                          </span>
                        )}
                      </div>
                      {source.last_http_status && (
                        <div className="text-[10px] text-muted-foreground">
                          HTTP {source.last_http_status}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {lastSuccessFormatted}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {nextRunFormatted}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Probar Conexión */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTestConnection(source.id)}
                          disabled={isTesting}
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          title="Ejecutar prueba de conexión técnica en vivo"
                        >
                          <Zap
                            className={`h-3.5 w-3.5 mr-1 ${isTesting ? "animate-pulse text-amber-500" : ""}`}
                          />
                          Probar
                        </Button>

                        {/* Sincronizar */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onTriggerSync(source.id)}
                          disabled={
                            isSyncing || source.automation_mode === "disabled" || !source.is_enabled
                          }
                          className="h-8 px-2.5 text-xs"
                          title="Sincronizar datos y procesar cambios"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 mr-1 ${isSyncing ? "animate-spin text-primary" : ""}`}
                          />
                          Sincronizar
                        </Button>

                        {/* Configurar */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenConfig(source)}
                          className="h-8 px-2 text-xs"
                          title="Configurar frecuencia y modo"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Connection Test Diagnostics Modal */}
      <ConnectionTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        result={testResult}
        isLoading={Boolean(testingSourceId)}
      />
    </div>
  );
}
