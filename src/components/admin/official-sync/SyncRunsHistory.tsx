import { CheckCircle2, XCircle, AlertCircle, Clock, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SourceSyncRunRecord } from "@/lib/official-sync/types";

interface SyncRunsHistoryProps {
  runs: SourceSyncRunRecord[];
}

export function SyncRunsHistory({ runs }: SyncRunsHistoryProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            Éxito
          </Badge>
        );
      case "review_required":
        return (
          <Badge className="bg-amber-600/15 text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
            <AlertCircle className="size-3" />
            Revisión requerida
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-destructive/15 text-destructive font-medium flex items-center gap-1">
            <XCircle className="size-3" />
            Error
          </Badge>
        );
      case "running":
        return (
          <Badge className="bg-primary/15 text-primary font-medium flex items-center gap-1">
            <RotateCcw className="size-3 animate-spin" />
            En ejecución
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/80 bg-secondary/40 font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Fuente</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-center">Recibidos</th>
                <th className="px-4 py-3 text-center">Nuevos</th>
                <th className="px-4 py-3 text-center">Actualizados</th>
                <th className="px-4 py-3 text-center">Sin cambios</th>
                <th className="px-4 py-3 text-center">En revisión</th>
                <th className="px-4 py-3">Disparador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-foreground max-w-[220px] truncate">
                    {run.source_name || "Fuente Oficial"}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(run.started_at).toLocaleString([], {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(run.status)}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-foreground">
                    {run.items_received}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {run.items_created > 0 ? (
                      <span className="font-bold text-emerald-600">+{run.items_created}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {run.items_updated > 0 ? (
                      <span className="font-bold text-blue-600">{run.items_updated}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center text-muted-foreground">
                    {run.items_unchanged}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {run.items_flagged > 0 ? (
                      <span className="font-bold text-amber-600">{run.items_flagged}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground font-mono text-[11px]">
                    {run.triggered_by}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
