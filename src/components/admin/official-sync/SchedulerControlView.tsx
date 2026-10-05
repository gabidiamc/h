import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runDueOfficialSyncsServerFn } from "@/lib/official-sync/functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Terminal, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";

interface BatchResultType {
  dueCount: number;
  executedCount: number;
  successCount: number;
  failedCount: number;
  results: {
    sourceId: string;
    sourceName: string;
    ok: boolean;
    itemsReceived: number;
    error?: string;
  }[];
}

export function SchedulerControlView() {
  const queryClient = useQueryClient();
  const [batchLimit] = useState(5);
  const [lastBatchResult, setLastBatchResult] = useState<BatchResultType | null>(null);

  const runBatchMutation = useMutation({
    mutationFn: () => runDueOfficialSyncsServerFn({ data: { batchLimit } }),
    onSuccess: (res: BatchResultType) => {
      setLastBatchResult(res);
      if (res.executedCount === 0) {
        toast.info("No hay fuentes oficiales pendientes de ejecución en este momento.");
      } else {
        toast.success(
          `Lote ejecutado: ${res.successCount} exitosas, ${res.failedCount} con error de ${res.executedCount} procesadas.`,
        );
      }
      void queryClient.invalidateQueries({ queryKey: ["official_sync_overview"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Error al procesar lote del scheduler.";
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      {/* Top banner */}
      <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                Control del Scheduler de Sincronización
              </h3>
              <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400">
                Backend Atómico
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl">
              El motor de sincronización se ejecuta exclusivamente en el servidor mediante bloqueos
              atómicos de concurrencia y retroceso exponencial ante fallos. No depende de pestañas
              abiertas en el navegador ni temporizadores locales.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => runBatchMutation.mutate()}
            disabled={runBatchMutation.isPending}
            className="h-9 px-4 text-xs font-semibold self-start sm:self-auto"
          >
            <Play
              className={`h-3.5 w-3.5 mr-1.5 ${runBatchMutation.isPending ? "animate-spin" : ""}`}
            />
            {runBatchMutation.isPending ? "Ejecutando Lote..." : "Ejecutar Fuentes Vencidas"}
          </Button>
        </div>

        {/* Batch result output if any */}
        {lastBatchResult && (
          <div className="p-3.5 rounded-xl border border-border/80 bg-secondary/30 text-xs space-y-2">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" /> Resultado de la última ronda de scheduler:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 rounded-lg bg-card border border-border/60">
                <span className="text-muted-foreground">Pendientes detectadas:</span>{" "}
                <span className="font-bold text-foreground">{lastBatchResult.dueCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border/60">
                <span className="text-muted-foreground">Ejecutadas:</span>{" "}
                <span className="font-bold text-foreground">{lastBatchResult.executedCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border/60">
                <span className="text-muted-foreground">Exitosas:</span>{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {lastBatchResult.successCount}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border/60">
                <span className="text-muted-foreground">Fallidas:</span>{" "}
                <span className="font-bold text-destructive">{lastBatchResult.failedCount}</span>
              </div>
            </div>
            {lastBatchResult.results && lastBatchResult.results.length > 0 && (
              <div className="space-y-1 pt-1">
                {lastBatchResult.results.map((r) => (
                  <div
                    key={r.sourceId}
                    className="flex items-center justify-between text-[11px] p-1.5 rounded-md bg-card/60"
                  >
                    <span className="font-medium text-foreground">{r.sourceName}</span>
                    <span
                      className={
                        r.ok
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-destructive font-semibold"
                      }
                    >
                      {r.ok ? `OK (${r.itemsReceived} elementos)` : r.error || "Error"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Integration Guide for Production Webhook / pg_cron */}
      <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4 shadow-xs">
        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
          <Terminal className="h-4 w-4 text-primary" /> Automatización en Producción (pg_cron /
          Supabase Edge Functions)
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Para ejecutar el scheduler de manera periódica y totalmente desatendida en producción,
          puedes configurar una tarea de <code>pg_cron</code> en Supabase o invocar el endpoint
          interno de sincronización mediante una función programada:
        </p>

        <div className="p-3.5 rounded-xl bg-muted/40 font-mono text-[11px] text-muted-foreground space-y-2 overflow-x-auto border border-border/60">
          <div className="text-foreground font-semibold">
            // Configuración SQL con pg_cron en Supabase:
          </div>
          <div>SELECT cron.schedule(</div>
          <div className="pl-4">'run-official-syncs-every-15-mins',</div>
          <div className="pl-4">'*/15 * * * *',</div>
          <div className="pl-4">
            $$ SELECT net.http_post(url := 'https://[TU-DOMINIO]/api/official-sync/cron', headers :=
            &#123;&apos;Authorization&apos;: &apos;Bearer [CRON_SECRET]&apos;&#125;) $$
          </div>
          <div>);</div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            Cada llamada bloquea atómicamente la fuente, calcula cambios, respeta el backoff
            exponencial y registra auditoría completa.
          </span>
        </div>
      </div>
    </div>
  );
}
