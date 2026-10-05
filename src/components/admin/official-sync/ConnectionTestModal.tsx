import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  ExternalLink,
  Layers,
  FileCode,
  Calendar,
} from "lucide-react";
import type { SourceConnectionTestResult } from "@/lib/official-sync/types";

interface ConnectionTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SourceConnectionTestResult | null;
  isLoading: boolean;
}

export function ConnectionTestModal({
  isOpen,
  onClose,
  result,
  isLoading,
}: ConnectionTestModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-bold">Diagnóstico de Conexión en Vivo</DialogTitle>
            {result && (
              <Badge
                variant={result.ok ? "default" : "destructive"}
                className={
                  result.ok
                    ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-destructive/15 text-destructive"
                }
              >
                {result.ok ? "Conexión Exitosa" : "Fallo de Conexión"}
              </Badge>
            )}
          </div>
          <DialogDescription>
            Resultados técnicos y métricas de procesamiento en tiempo de ejecución para la fuente
            oficial.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Estableciendo conexión segura y analizando estructura de datos remota...
            </p>
          </div>
        ) : result ? (
          <div className="space-y-5 text-sm">
            {/* Header info */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-secondary/30 space-y-1.5">
              <div className="font-semibold text-foreground">{result.sourceName}</div>
              <div className="text-xs text-muted-foreground break-all flex items-center gap-1.5">
                <span className="font-medium text-foreground">Endpoint:</span> {result.endpointUsed}
                <a
                  href={result.officialUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Método:</span>{" "}
                {result.integrationMethod}
              </div>
            </div>

            {/* Technical Execution Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-border/70 bg-card text-center space-y-1">
                <div className="text-xs text-muted-foreground">HTTP Status</div>
                <div className="text-base font-bold">
                  <span
                    className={
                      result.httpStatus >= 200 && result.httpStatus < 300
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    }
                  >
                    {result.httpStatus || "N/A"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border/70 bg-card text-center space-y-1">
                <div className="text-xs text-muted-foreground">Latencia / Duración</div>
                <div className="text-base font-bold text-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {result.durationMs} ms
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border/70 bg-card text-center space-y-1">
                <div className="text-xs text-muted-foreground">Registros Válidos</div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {result.recordsValid}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border/70 bg-card text-center space-y-1">
                <div className="text-xs text-muted-foreground">Registros Rechazados</div>
                <div className="text-base font-bold text-muted-foreground flex items-center justify-center gap-1">
                  {result.recordsRejected > 0 ? (
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                  ) : null}
                  {result.recordsRejected}
                </div>
              </div>
            </div>

            {/* Error banner if any */}
            {result.error && (
              <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" /> Detalle del Error de Conexión:
                </div>
                <p className="font-mono">{result.error}</p>
              </div>
            )}

            {/* Sample Parsed Preview */}
            {result.sampleItemPreview && (
              <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" /> Muestra de Elemento Extraído
                </div>
                <div className="font-medium text-foreground text-sm">
                  {result.sampleItemPreview.title}
                </div>
                {result.sampleItemPreview.dateOrSummary && (
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {result.sampleItemPreview.dateOrSummary}
                  </div>
                )}
              </div>
            )}

            {/* Additional specs */}
            <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
              <span className="flex items-center gap-1">
                <FileCode className="h-3.5 w-3.5" /> Versión del Parser: {result.parserVersion}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Probado el:{" "}
                {new Date(result.testedAt).toLocaleTimeString("es-US", {
                  timeZone: "America/Chicago",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}{" "}
                (CT)
              </span>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
