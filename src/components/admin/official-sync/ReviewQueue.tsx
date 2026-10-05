import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, ExternalLink, ShieldAlert } from "lucide-react";
import type { SourceChangeProposalRecord } from "@/lib/official-sync/types";

interface ReviewQueueProps {
  proposals: SourceChangeProposalRecord[];
  onResolveProposal: (proposalId: string, action: "approve" | "reject", notes?: string) => void;
  onApproveAllSafe: () => void;
  isProcessingId: string | null;
}

export function ReviewQueue({
  proposals,
  onResolveProposal,
  onApproveAllSafe,
  isProcessingId,
}: ReviewQueueProps) {
  const pendingList = proposals.filter((p) => p.review_status === "pending");
  const lowRiskCount = pendingList.filter((p) => p.risk_level === "low").length;

  const renderRiskBadge = (level: string) => {
    switch (level) {
      case "critical":
        return (
          <Badge className="bg-rose-600/15 text-rose-700 dark:text-rose-400 font-bold border-rose-500/20">
            Crítico
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-orange-600/15 text-orange-700 dark:text-orange-400 font-bold border-orange-500/20">
            Alto
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-amber-600/15 text-amber-700 dark:text-amber-400 font-bold border-amber-500/20">
            Medio
          </Badge>
        );
      default:
        return (
          <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 font-bold border-emerald-500/20">
            Bajo (Seguro)
          </Badge>
        );
    }
  };

  const parseJsonValue = (val: string | null) => {
    if (!val) return "Sin datos previos";
    try {
      const obj = JSON.parse(val);
      if (typeof obj === "object" && obj !== null) {
        return obj.title || obj.summary || JSON.stringify(obj, null, 2);
      }
      return String(obj);
    } catch {
      return val;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border/80 bg-card shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" /> Cola de Moderación de Cambios (
            {pendingList.length} pendientes)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Los cambios de datos detectados desde las fuentes oficiales que requieren verificación
            humana antes de publicarse.
          </p>
        </div>

        {lowRiskCount > 0 && (
          <Button
            size="sm"
            onClick={onApproveAllSafe}
            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white self-start sm:self-auto"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Aprobar {lowRiskCount} cambios seguros
          </Button>
        )}
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Fuente / Elemento</TableHead>
              <TableHead>Tipo de Cambio</TableHead>
              <TableHead>Nivel de Riesgo</TableHead>
              <TableHead>Comparativa (Anterior vs Propuesto)</TableHead>
              <TableHead>Detectado</TableHead>
              <TableHead className="text-right">Decisión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2 opacity-80" />
                  No hay cambios pendientes de revisión. Todos los datos oficiales están
                  verificados.
                </TableCell>
              </TableRow>
            ) : (
              pendingList.map((proposal) => {
                const isProcessing = isProcessingId === proposal.id;
                const prevText = parseJsonValue(proposal.previous_value);
                const propText = parseJsonValue(proposal.proposed_value);

                return (
                  <TableRow key={proposal.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium text-xs text-foreground">
                        {proposal.item_title || "Elemento nuevo"}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <span>{proposal.source_name}</span>
                        {proposal.official_url && (
                          <a
                            href={proposal.official_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-primary hover:underline inline-flex items-center"
                          >
                            <ExternalLink className="h-2.5 w-2.5 ml-1" />
                          </a>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-[11px] capitalize">
                        {proposal.change_type}
                      </Badge>
                    </TableCell>

                    <TableCell>{renderRiskBadge(proposal.risk_level)}</TableCell>

                    <TableCell className="max-w-[280px]">
                      <div className="text-[11px] space-y-1">
                        {proposal.previous_value && (
                          <div className="p-1.5 rounded bg-muted/40 text-muted-foreground line-through line-clamp-2">
                            {prevText}
                          </div>
                        )}
                        <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium line-clamp-2">
                          {propText}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(proposal.detected_at).toLocaleString("es-US", {
                        timeZone: "America/Chicago",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onResolveProposal(proposal.id, "reject")}
                          disabled={isProcessing}
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Rechazar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onResolveProposal(proposal.id, "approve")}
                          disabled={isProcessing}
                          className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprobar
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
    </div>
  );
}
