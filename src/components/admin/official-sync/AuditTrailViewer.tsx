import { useState } from "react";
import { ShieldCheck, Search, FileText, UserCheck, Calendar } from "lucide-react";
import type { OfficialDataAuditRecord } from "@/lib/official-sync/types";

interface AuditTrailViewerProps {
  logs: OfficialDataAuditRecord[];
}

export function AuditTrailViewer({ logs }: AuditTrailViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.source_name && log.source_name.toLowerCase().includes(term)) ||
      (log.reason && log.reason.toLowerCase().includes(term)) ||
      log.performed_by.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card p-2.5">
        <Search className="size-4 text-muted-foreground ml-2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar eventos en el registro de auditoría..."
          className="flex-1 bg-transparent px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
        <div className="divide-y divide-border/60">
          {filtered.map((log) => (
            <div key={log.id} className="p-4 hover:bg-secondary/20 transition-colors space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 font-bold text-primary">
                    <ShieldCheck className="size-3.5" />
                    {log.action}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-semibold text-foreground">{log.source_name}</span>
                </div>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {new Date(log.performed_at).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-muted-foreground font-medium">
                {log.reason || "Acción registrada por el motor de sincronización oficial."}
              </p>

              <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                <span className="flex items-center gap-1 font-mono">
                  <UserCheck className="size-3" />
                  Ejecutado por: <strong className="text-foreground">{log.performed_by}</strong>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <FileText className="size-3" />
                  Entidad: {log.entity_type}
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No se encontraron registros de auditoría que coincidan con la búsqueda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
